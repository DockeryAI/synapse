/**
 * Embedding Service
 *
 * Handles OpenAI Embeddings API integration with:
 * - Batch processing (100 texts at a time)
 * - Aggressive caching to minimize costs
 * - Cost tracking
 * - Error handling and retries
 *
 * Created: 2025-11-10
 */

import {
  DataPoint,
  EmbeddingCacheEntry,
  EmbeddingCacheStats,
  EMBEDDING_MODEL,
  EMBEDDING_COST_PER_1M_TOKENS
} from '../../../types/connections.types';

export interface EmbeddingRequest {
  texts: string[];
  model?: string;
}

export interface EmbeddingResponse {
  embeddings: number[][];
  tokensUsed: number;
  cost: number;
  cacheHits: number;
}

export class EmbeddingService {
  private cache = new Map<string, EmbeddingCacheEntry>();
  private apiKey: string;
  private totalTokensUsed = 0;
  private totalCost = 0;
  private cacheHits = 0;
  private cacheMisses = 0;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_OPENAI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[EmbeddingService] No OpenAI API key provided');
    }
  }

  /**
   * Create embeddings for multiple texts
   * Uses cache aggressively to minimize API calls
   */
  async createEmbeddings(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    console.log(`[EmbeddingService] Creating embeddings for ${request.texts.length} texts...`);

    const model = request.model || EMBEDDING_MODEL;
    const embeddings: number[][] = [];
    const uncachedTexts: { text: string; index: number }[] = [];

    // Check cache first
    request.texts.forEach((text, index) => {
      const cached = this.getFromCache(text, model);
      if (cached) {
        embeddings[index] = cached.embedding;
        this.cacheHits++;
      } else {
        uncachedTexts.push({ text, index });
        this.cacheMisses++;
      }
    });

    console.log(`[EmbeddingService] Cache: ${this.cacheHits} hits, ${uncachedTexts.length} misses`);

    // If all cached, return immediately
    if (uncachedTexts.length === 0) {
      return {
        embeddings,
        tokensUsed: 0,
        cost: 0,
        cacheHits: this.cacheHits
      };
    }

    // Batch process uncached texts (max 100 per request)
    const batches = this.chunk(uncachedTexts, 100);
    let totalTokens = 0;

    for (const batch of batches) {
      try {
        const response = await this.callOpenAI(
          batch.map(item => item.text),
          model
        );

        // Store results
        response.data.forEach((item, i) => {
          const { text, index } = batch[i];
          const embedding = item.embedding;

          // Add to results
          embeddings[index] = embedding;

          // Cache for future use
          this.addToCache(text, embedding, model);
        });

        totalTokens += response.usage.total_tokens;

      } catch (error) {
        console.error('[EmbeddingService] Batch failed:', error);
        // Fill with zeros for failed embeddings
        batch.forEach(({ index }) => {
          embeddings[index] = new Array(1536).fill(0);
        });
      }
    }

    const cost = (totalTokens / 1000000) * EMBEDDING_COST_PER_1M_TOKENS;
    this.totalTokensUsed += totalTokens;
    this.totalCost += cost;

    console.log(`[EmbeddingService] Generated ${uncachedTexts.length} embeddings. Tokens: ${totalTokens}, Cost: $${cost.toFixed(4)}`);

    return {
      embeddings,
      tokensUsed: totalTokens,
      cost,
      cacheHits: this.cacheHits
    };
  }

  /**
   * Embed data points in place
   */
  async embedDataPoints(dataPoints: DataPoint[]): Promise<void> {
    const texts = dataPoints.map(dp => dp.content);

    const response = await this.createEmbeddings({ texts });

    dataPoints.forEach((dp, i) => {
      dp.embedding = response.embeddings[i];
    });

    console.log(`[EmbeddingService] Embedded ${dataPoints.length} data points`);
  }

  /**
   * Get from cache
   */
  private getFromCache(text: string, model: string): EmbeddingCacheEntry | null {
    const key = this.buildCacheKey(text, model);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if expired (cache for 7 days)
    const age = Date.now() - entry.cachedAt.getTime();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

    if (age > maxAge) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  /**
   * Add to cache
   */
  private addToCache(text: string, embedding: number[], model: string): void {
    const key = this.buildCacheKey(text, model);
    this.cache.set(key, {
      text,
      embedding,
      cachedAt: new Date(),
      model
    });
  }

  /**
   * Build cache key
   */
  private buildCacheKey(text: string, model: string): string {
    // Use first 100 chars + length as key (good enough for deduplication)
    const snippet = text.substring(0, 100);
    return `${model}:${snippet}:${text.length}`;
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(texts: string[], model: string): Promise<any> {
    const url = 'https://api.openai.com/v1/embeddings';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model,
        input: texts
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    return await response.json();
  }

  /**
   * Chunk array into batches
   */
  private chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): EmbeddingCacheStats {
    const totalRequests = this.cacheHits + this.cacheMisses;
    const hitRate = totalRequests > 0 ? this.cacheHits / totalRequests : 0;

    // Estimate cost saved (assuming average 100 tokens per embedding)
    const embeddingsSaved = this.cacheHits;
    const tokensSaved = embeddingsSaved * 100;
    const costSaved = (tokensSaved / 1000000) * EMBEDDING_COST_PER_1M_TOKENS;

    // Estimate memory usage (1536 dimensions × 4 bytes per float)
    const memoryMB = (this.cache.size * 1536 * 4) / (1024 * 1024);

    return {
      size: this.cache.size,
      hitRate,
      costSaved,
      memoryMB
    };
  }

  /**
   * Get total cost
   */
  getTotalCost(): number {
    return this.totalCost;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[EmbeddingService] Cache cleared');
  }

  /**
   * Export cache to JSON (for persistence)
   */
  exportCache(): string {
    const entries = Array.from(this.cache.entries()).map(([key, value]) => ({
      key,
      ...value,
      cachedAt: value.cachedAt.toISOString()
    }));

    return JSON.stringify(entries);
  }

  /**
   * Import cache from JSON
   */
  importCache(json: string): void {
    try {
      const entries = JSON.parse(json);
      this.cache.clear();

      entries.forEach((entry: any) => {
        this.cache.set(entry.key, {
          text: entry.text,
          embedding: entry.embedding,
          cachedAt: new Date(entry.cachedAt),
          model: entry.model
        });
      });

      console.log(`[EmbeddingService] Imported ${entries.length} cache entries`);
    } catch (error) {
      console.error('[EmbeddingService] Failed to import cache:', error);
    }
  }
}
