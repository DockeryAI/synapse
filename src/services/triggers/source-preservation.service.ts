/**
 * Source Preservation Service - Triggers 4.0
 *
 * CRITICAL: This service ensures raw scraped data flows through
 * the pipeline UNCHANGED. It converts RawDataSample to VerifiedSource
 * and provides lookup/validation utilities.
 *
 * The LLM can REFERENCE these sources but NEVER modify them.
 *
 * Created: 2025-12-01
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  VerifiedSource,
  SourcePlatform,
  SourceType,
  VerificationStatus,
  SourceScoring,
  TriangulatedTrigger,
  ConfidenceLevel,
} from '@/types/verified-source.types';
import {
  calculateConfidence,
  isSourceFresh,
  validatePlatformUrl,
} from '@/types/verified-source.types';
import type { RawDataSample } from './llm-trigger-synthesizer.service';
import { supabase } from '@/lib/supabase';

// ============================================================================
// URL VERIFICATION CACHE
// ============================================================================

interface CachedVerification {
  status: VerificationStatus;
  timestamp: number;
}

const VERIFICATION_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const verificationCache = new Map<string, CachedVerification>();

function getCachedVerification(url: string): VerificationStatus | null {
  const cached = verificationCache.get(url);
  if (!cached) return null;

  const age = Date.now() - cached.timestamp;
  if (age > VERIFICATION_CACHE_TTL_MS) {
    verificationCache.delete(url);
    return null;
  }

  return cached.status;
}

function setCachedVerification(url: string, status: VerificationStatus): void {
  // Limit cache size
  if (verificationCache.size > 500) {
    const entries = Array.from(verificationCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    for (let i = 0; i < 50; i++) {
      verificationCache.delete(entries[i][0]);
    }
  }

  verificationCache.set(url, { status, timestamp: Date.now() });
}

// ============================================================================
// SOURCE REGISTRY
// ============================================================================

/**
 * In-memory registry of verified sources
 * Key: source ID
 * Value: VerifiedSource
 */
class SourceRegistry {
  private sources: Map<string, VerifiedSource> = new Map();
  private contentIndex: Map<string, string> = new Map(); // content hash -> source ID

  /**
   * Register a new verified source
   * Returns existing source if content already exists (deduplication)
   */
  register(source: VerifiedSource): VerifiedSource {
    // Check for duplicate content
    const contentHash = this.hashContent(source.originalContent);
    const existingId = this.contentIndex.get(contentHash);

    if (existingId) {
      const existing = this.sources.get(existingId);
      if (existing) {
        console.log(`[SourceRegistry] Deduped source, using existing: ${existingId}`);
        return existing;
      }
    }

    // Register new source
    this.sources.set(source.id, source);
    this.contentIndex.set(contentHash, source.id);

    return source;
  }

  /**
   * Get a source by ID
   */
  get(id: string): VerifiedSource | undefined {
    return this.sources.get(id);
  }

  /**
   * Get all sources for a list of IDs
   */
  getMany(ids: string[]): VerifiedSource[] {
    return ids
      .map(id => this.sources.get(id))
      .filter((s): s is VerifiedSource => !!s);
  }

  /**
   * Find sources by content similarity
   */
  findByContent(content: string, threshold: number = 0.5): VerifiedSource[] {
    const results: VerifiedSource[] = [];
    const normalizedContent = this.normalizeForMatching(content);

    for (const source of this.sources.values()) {
      const similarity = this.calculateSimilarity(
        normalizedContent,
        this.normalizeForMatching(source.originalContent)
      );
      if (similarity >= threshold) {
        results.push(source);
      }
    }

    return results.sort((a, b) => {
      const simA = this.calculateSimilarity(normalizedContent, this.normalizeForMatching(a.originalContent));
      const simB = this.calculateSimilarity(normalizedContent, this.normalizeForMatching(b.originalContent));
      return simB - simA;
    });
  }

  /**
   * Get sources by platform
   */
  getByPlatform(platform: SourcePlatform): VerifiedSource[] {
    return Array.from(this.sources.values()).filter(s => s.platform === platform);
  }

  /**
   * Get all registered sources
   */
  getAll(): VerifiedSource[] {
    return Array.from(this.sources.values());
  }

  /**
   * Clear the registry (for testing/reset)
   */
  clear(): void {
    this.sources.clear();
    this.contentIndex.clear();
  }

  /**
   * Get registry stats
   */
  getStats(): {
    totalSources: number;
    byPlatform: Record<string, number>;
    byStatus: Record<string, number>;
  } {
    const byPlatform: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const source of this.sources.values()) {
      byPlatform[source.platform] = (byPlatform[source.platform] || 0) + 1;
      byStatus[source.verificationStatus] = (byStatus[source.verificationStatus] || 0) + 1;
    }

    return {
      totalSources: this.sources.size,
      byPlatform,
      byStatus,
    };
  }

  // Private helpers
  private hashContent(content: string): string {
    // Simple hash for deduplication
    const normalized = content.toLowerCase().replace(/\s+/g, ' ').trim().substring(0, 200);
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  private normalizeForMatching(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200);
  }

  private calculateSimilarity(a: string, b: string): number {
    if (!a || !b) return 0;
    if (a === b) return 1;

    const wordsA = new Set(a.split(' ').filter(w => w.length > 3));
    const wordsB = new Set(b.split(' ').filter(w => w.length > 3));

    if (wordsA.size === 0 || wordsB.size === 0) return 0;

    let overlap = 0;
    for (const word of wordsA) {
      if (wordsB.has(word)) overlap++;
    }

    return overlap / Math.max(wordsA.size, wordsB.size);
  }
}

// Global registry instance
const sourceRegistry = new SourceRegistry();

// ============================================================================
// CONVERSION UTILITIES
// ============================================================================

/**
 * Map platform string to SourcePlatform enum
 */
function mapPlatform(platform: string): SourcePlatform {
  const platformMap: Record<string, SourcePlatform> = {
    'reddit': 'reddit',
    'twitter': 'twitter',
    'x': 'twitter',
    'youtube': 'youtube',
    'hackernews': 'hackernews',
    'hacker news': 'hackernews',
    'hn': 'hackernews',
    'g2': 'g2',
    'trustpilot': 'trustpilot',
    'capterra': 'capterra',
    'linkedin': 'linkedin',
    'quora': 'quora',
    'producthunt': 'producthunt',
    'product hunt': 'producthunt',
    'google': 'google_reviews',
    'google reviews': 'google_reviews',
    'yelp': 'yelp',
    'facebook': 'facebook',
    'instagram': 'instagram',
    'tiktok': 'tiktok',
    'clutch': 'clutch',
    'gartner': 'gartner',
  };

  const normalized = platform.toLowerCase().trim();
  return platformMap[normalized] || 'unknown';
}

/**
 * Infer source type from platform
 */
function inferSourceType(platform: SourcePlatform): SourceType {
  const typeMap: Record<SourcePlatform, SourceType> = {
    'reddit': 'community',
    'twitter': 'social',
    'youtube': 'community',
    'hackernews': 'community',
    'g2': 'voc',
    'trustpilot': 'voc',
    'capterra': 'voc',
    'linkedin': 'social',
    'quora': 'community',
    'producthunt': 'community',
    'google_reviews': 'voc',
    'yelp': 'voc',
    'facebook': 'social',
    'instagram': 'social',
    'tiktok': 'social',
    'clutch': 'voc',
    'gartner': 'executive',
    'unknown': 'community',
  };

  return typeMap[platform];
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

class SourcePreservationService {
  /**
   * Convert RawDataSample to VerifiedSource
   * CRITICAL: Preserves original data exactly as scraped
   */
  convertFromRawSample(sample: RawDataSample): VerifiedSource {
    const platform = mapPlatform(sample.platform);

    const verifiedSource: VerifiedSource = {
      id: sample.id || uuidv4(),
      originalUrl: sample.url || '',
      originalAuthor: sample.author || 'Anonymous',
      originalContent: sample.content,
      platform,
      scrapedAt: sample.timestamp || new Date().toISOString(),
      publishedAt: sample.timestamp,
      sourceType: sample.sourceType ? (sample.sourceType as SourceType) : inferSourceType(platform),
      verificationStatus: 'unverified',
      engagement: sample.engagement,
      competitorName: sample.competitorName,
      communityName: sample.source,
      threadTitle: sample.sourceTitle,
    };

    // Validate URL matches platform if URL exists
    if (verifiedSource.originalUrl && !validatePlatformUrl(verifiedSource.originalUrl, platform)) {
      console.warn(`[SourcePreservation] URL does not match platform: ${verifiedSource.originalUrl} vs ${platform}`);
    }

    // Register and return (deduplicates automatically)
    return sourceRegistry.register(verifiedSource);
  }

  /**
   * Convert batch of RawDataSamples to VerifiedSources
   */
  convertBatch(samples: RawDataSample[]): VerifiedSource[] {
    return samples.map(sample => this.convertFromRawSample(sample));
  }

  /**
   * Look up a source by ID
   */
  getSource(id: string): VerifiedSource | undefined {
    return sourceRegistry.get(id);
  }

  /**
   * Look up sources by content similarity
   * Used to verify LLM evidence quotes match real sources
   */
  findSourceByQuote(quote: string): VerifiedSource | null {
    const matches = sourceRegistry.findByContent(quote, 0.3);
    return matches.length > 0 ? matches[0] : null;
  }

  /**
   * Get all sources for a list of IDs
   */
  getSources(ids: string[]): VerifiedSource[] {
    return sourceRegistry.getMany(ids);
  }

  /**
   * Get registry statistics
   */
  getStats() {
    return sourceRegistry.getStats();
  }

  /**
   * Build a triangulated trigger from verified sources and LLM scorings
   */
  buildTriangulatedTrigger(
    id: string,
    title: string,
    summary: string,
    category: TriangulatedTrigger['category'],
    sourceIds: string[],
    scorings: SourceScoring[]
  ): TriangulatedTrigger {
    const sources = sourceRegistry.getMany(sourceIds);

    // Calculate triangulation stats
    const platforms = new Set(sources.map(s => s.platform));
    const sourceTypes = new Set(sources.map(s => s.sourceType));

    // Calculate confidence
    const { level: confidence } = calculateConfidence(sources, scorings);

    // Calculate average relevance
    const avgRelevanceScore = scorings.length > 0
      ? scorings.reduce((sum, s) => sum + s.relevanceScore, 0) / scorings.length
      : 0;

    // Check for time sensitivity (any source < 7 days old)
    const isTimeSensitive = sources.some(s => {
      const date = new Date(s.publishedAt || s.scrapedAt);
      const daysDiff = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    });

    // Determine dominant buyer journey stage
    const stageCounts: Record<string, number> = {};
    scorings.forEach(s => {
      stageCounts[s.buyerJourneyStage] = (stageCounts[s.buyerJourneyStage] || 0) + 1;
    });
    const buyerJourneyStage = Object.entries(stageCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] as TriangulatedTrigger['buyerJourneyStage'] || 'problem-aware';

    // Average buyer-product fit
    const buyerProductFit = scorings.length > 0
      ? scorings.reduce((sum, s) => sum + s.buyerProductFit, 0) / scorings.length
      : 0;

    return {
      id,
      title,
      executiveSummary: summary,
      category,
      verifiedSources: sources,
      sourceScorings: scorings,
      confidence,
      sourceTypeCount: sourceTypes.size,
      platformCount: platforms.size,
      avgRelevanceScore,
      isTimeSensitive,
      buyerJourneyStage,
      buyerProductFit,
    };
  }

  /**
   * Verify a source URL is accessible
   * Uses server-side Edge Function to bypass CORS restrictions
   * Results are cached for 15 minutes
   */
  async verifySourceUrl(source: VerifiedSource): Promise<VerificationStatus> {
    if (!source.originalUrl) {
      return 'invalid';
    }

    // Check platform-URL match first
    if (!validatePlatformUrl(source.originalUrl, source.platform)) {
      return 'invalid';
    }

    // Check freshness
    if (!isSourceFresh(source)) {
      return 'archived';
    }

    // Check cache first
    const cached = getCachedVerification(source.originalUrl);
    if (cached) {
      return cached;
    }

    // Call Edge Function for server-side verification
    try {
      const { data, error } = await supabase.functions.invoke('verify-url', {
        body: {
          url: source.originalUrl,
          platform: source.platform,
        },
      });

      if (error) {
        console.warn('[SourcePreservation] URL verification failed:', error);
        return 'unverified';
      }

      const status: VerificationStatus = data?.status === 'verified'
        ? 'verified'
        : data?.status === 'invalid'
        ? 'invalid'
        : 'unverified';

      setCachedVerification(source.originalUrl, status);

      // Update source in registry
      const registrySource = sourceRegistry.get(source.id);
      if (registrySource) {
        registrySource.verificationStatus = status;
      }

      return status;
    } catch (err) {
      console.warn('[SourcePreservation] URL verification error:', err);
      return 'unverified';
    }
  }

  /**
   * Verify multiple source URLs in batch
   * More efficient than individual calls
   */
  async verifySourceUrls(sources: VerifiedSource[]): Promise<Map<string, VerificationStatus>> {
    const results = new Map<string, VerificationStatus>();
    const toVerify: Array<{ url: string; platform: string; sourceId: string }> = [];

    // First pass: check cache and pre-validate
    for (const source of sources) {
      if (!source.originalUrl) {
        results.set(source.id, 'invalid');
        continue;
      }

      if (!validatePlatformUrl(source.originalUrl, source.platform)) {
        results.set(source.id, 'invalid');
        continue;
      }

      if (!isSourceFresh(source)) {
        results.set(source.id, 'archived');
        continue;
      }

      const cached = getCachedVerification(source.originalUrl);
      if (cached) {
        results.set(source.id, cached);
        continue;
      }

      toVerify.push({
        url: source.originalUrl,
        platform: source.platform,
        sourceId: source.id,
      });
    }

    // If nothing to verify, return early
    if (toVerify.length === 0) {
      return results;
    }

    // Batch verify via Edge Function
    try {
      const { data, error } = await supabase.functions.invoke('verify-url', {
        body: {
          urls: toVerify.map(v => ({ url: v.url, platform: v.platform })),
        },
      });

      if (error) {
        console.warn('[SourcePreservation] Batch URL verification failed:', error);
        // Mark all as unverified on failure
        for (const v of toVerify) {
          results.set(v.sourceId, 'unverified');
        }
        return results;
      }

      // Process results
      const verifyResults = data?.results as Array<{ url: string; status: string }> || [];
      for (let i = 0; i < toVerify.length; i++) {
        const v = toVerify[i];
        const result = verifyResults[i];

        const status: VerificationStatus = result?.status === 'verified'
          ? 'verified'
          : result?.status === 'invalid'
          ? 'invalid'
          : 'unverified';

        results.set(v.sourceId, status);
        setCachedVerification(v.url, status);

        // Update source in registry
        const registrySource = sourceRegistry.get(v.sourceId);
        if (registrySource) {
          registrySource.verificationStatus = status;
        }
      }
    } catch (err) {
      console.warn('[SourcePreservation] Batch URL verification error:', err);
      for (const v of toVerify) {
        results.set(v.sourceId, 'unverified');
      }
    }

    return results;
  }

  /**
   * Clear the source registry (for testing)
   */
  reset(): void {
    sourceRegistry.clear();
  }
}

// Export singleton instance
export const sourcePreservationService = new SourcePreservationService();
