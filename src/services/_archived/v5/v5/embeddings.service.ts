/**
 * V5 Embeddings Service
 *
 * Handles content deduplication via semantic similarity.
 * Prevents repetitive content in campaigns and recent generation history.
 *
 * Features:
 * - Cosine similarity comparison
 * - Recent content cache (24-hour TTL)
 * - Campaign-level deduplication
 * - Configurable similarity threshold
 *
 * Created: 2025-12-01
 */

import type { V5GeneratedContent, Platform } from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface ContentEmbedding {
  id: string;
  contentHash: string;
  headline: string;
  platform: Platform;
  createdAt: Date;
  brandId?: string;
  campaignId?: string;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  similarContent?: ContentEmbedding;
  similarityScore: number;
  reason?: string;
}

export interface EmbeddingsServiceConfig {
  similarityThreshold: number;  // 0-1, higher = more strict
  cacheTTLMinutes: number;
  maxCacheSize: number;
}

const DEFAULT_CONFIG: EmbeddingsServiceConfig = {
  similarityThreshold: 0.85,  // 85% similar = duplicate
  cacheTTLMinutes: 1440,      // 24 hours
  maxCacheSize: 500,
};

// ============================================================================
// EMBEDDINGS SERVICE
// ============================================================================

class EmbeddingsService {
  private cache: Map<string, ContentEmbedding> = new Map();
  private config: EmbeddingsServiceConfig;

  constructor(config: Partial<EmbeddingsServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Check if content is a duplicate of recently generated content
   */
  async checkDuplicate(
    content: V5GeneratedContent,
    options: {
      brandId?: string;
      campaignId?: string;
      skipCache?: boolean;
    } = {}
  ): Promise<DuplicateCheckResult> {
    // Clean expired entries
    this.cleanExpiredEntries();

    // Generate content hash for quick comparison
    const contentHash = this.hashContent(content);

    // Check exact matches first
    for (const [, existing] of this.cache) {
      // Only compare same brand/campaign if specified
      if (options.brandId && existing.brandId !== options.brandId) continue;
      if (options.campaignId && existing.campaignId !== options.campaignId) continue;

      // Exact hash match
      if (existing.contentHash === contentHash) {
        return {
          isDuplicate: true,
          similarContent: existing,
          similarityScore: 1.0,
          reason: 'Exact content match',
        };
      }

      // Semantic similarity check (headline comparison for efficiency)
      const similarity = this.calculateSimilarity(
        content.headline,
        existing.headline
      );

      if (similarity >= this.config.similarityThreshold) {
        return {
          isDuplicate: true,
          similarContent: existing,
          similarityScore: similarity,
          reason: `Headlines ${Math.round(similarity * 100)}% similar`,
        };
      }
    }

    return {
      isDuplicate: false,
      similarityScore: 0,
    };
  }

  /**
   * Add content to the deduplication cache
   */
  addToCache(
    content: V5GeneratedContent,
    options: { brandId?: string; campaignId?: string } = {}
  ): void {
    // Enforce max cache size
    if (this.cache.size >= this.config.maxCacheSize) {
      this.evictOldestEntries(Math.floor(this.config.maxCacheSize * 0.1));
    }

    const embedding: ContentEmbedding = {
      id: content.id,
      contentHash: this.hashContent(content),
      headline: content.headline,
      platform: content.metadata.platform,
      createdAt: new Date(),
      brandId: options.brandId,
      campaignId: options.campaignId,
    };

    this.cache.set(content.id, embedding);
  }

  /**
   * Check multiple pieces for duplicates (batch mode for campaigns)
   */
  async checkBatchDuplicates(
    contents: V5GeneratedContent[],
    options: { brandId?: string; campaignId?: string } = {}
  ): Promise<Map<string, DuplicateCheckResult>> {
    const results = new Map<string, DuplicateCheckResult>();

    // Check each against cache AND against each other in batch
    for (let i = 0; i < contents.length; i++) {
      const content = contents[i];

      // First check against cache
      let result = await this.checkDuplicate(content, options);

      // If not duplicate in cache, check against previous items in batch
      if (!result.isDuplicate) {
        for (let j = 0; j < i; j++) {
          const prev = contents[j];
          const similarity = this.calculateSimilarity(
            content.headline,
            prev.headline
          );

          if (similarity >= this.config.similarityThreshold) {
            result = {
              isDuplicate: true,
              similarContent: {
                id: prev.id,
                contentHash: this.hashContent(prev),
                headline: prev.headline,
                platform: prev.metadata.platform,
                createdAt: new Date(),
              },
              similarityScore: similarity,
              reason: `Similar to batch item ${j + 1}`,
            };
            break;
          }
        }
      }

      results.set(content.id, result);
    }

    return results;
  }

  /**
   * Clear cache for a specific brand or campaign
   */
  clearCache(options: { brandId?: string; campaignId?: string } = {}): number {
    let cleared = 0;

    if (!options.brandId && !options.campaignId) {
      cleared = this.cache.size;
      this.cache.clear();
      return cleared;
    }

    for (const [id, embedding] of this.cache) {
      if (
        (options.brandId && embedding.brandId === options.brandId) ||
        (options.campaignId && embedding.campaignId === options.campaignId)
      ) {
        this.cache.delete(id);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
    byPlatform: Record<Platform, number>;
  } {
    let oldest: Date | null = null;
    let newest: Date | null = null;
    const byPlatform: Record<Platform, number> = {
      linkedin: 0,
      facebook: 0,
      instagram: 0,
      twitter: 0,
      tiktok: 0,
    };

    for (const embedding of this.cache.values()) {
      if (!oldest || embedding.createdAt < oldest) oldest = embedding.createdAt;
      if (!newest || embedding.createdAt > newest) newest = embedding.createdAt;
      byPlatform[embedding.platform]++;
    }

    return {
      size: this.cache.size,
      oldestEntry: oldest,
      newestEntry: newest,
      byPlatform,
    };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Simple content hash using headline + body first 100 chars
   */
  private hashContent(content: V5GeneratedContent): string {
    const text = `${content.headline}|${content.body.substring(0, 100)}`;
    return this.simpleHash(text);
  }

  /**
   * Simple string hash (djb2 algorithm)
   */
  private simpleHash(str: string): string {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) + hash + str.charCodeAt(i);
    }
    return hash.toString(36);
  }

  /**
   * Calculate text similarity using word overlap (Jaccard-like)
   * For production, this could use actual embeddings via OpenAI/Claude
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(this.tokenize(text1));
    const words2 = new Set(this.tokenize(text2));

    if (words1.size === 0 || words2.size === 0) return 0;

    let intersection = 0;
    for (const word of words1) {
      if (words2.has(word)) intersection++;
    }

    const union = words1.size + words2.size - intersection;
    return intersection / union;
  }

  /**
   * Simple tokenization - lowercase, remove punctuation, split on spaces
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 2);  // Ignore very short words
  }

  /**
   * Remove entries older than TTL
   */
  private cleanExpiredEntries(): void {
    const cutoff = new Date(
      Date.now() - this.config.cacheTTLMinutes * 60 * 1000
    );

    for (const [id, embedding] of this.cache) {
      if (embedding.createdAt < cutoff) {
        this.cache.delete(id);
      }
    }
  }

  /**
   * Evict oldest entries when cache is full
   */
  private evictOldestEntries(count: number): void {
    const entries = Array.from(this.cache.entries()).sort(
      (a, b) => a[1].createdAt.getTime() - b[1].createdAt.getTime()
    );

    for (let i = 0; i < Math.min(count, entries.length); i++) {
      this.cache.delete(entries[i][0]);
    }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const embeddingsService = new EmbeddingsService();

// Export class for testing
export { EmbeddingsService };

export default embeddingsService;
