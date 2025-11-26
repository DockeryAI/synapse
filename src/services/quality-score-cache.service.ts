/**
 * Quality Score Cache Service
 * Persists quality scores in local storage to avoid re-computation
 */

interface CachedScore {
  score: number;
  timestamp: number;
  text: string; // Hash of the text to validate cache
}

interface QualityScoreCache {
  [key: string]: CachedScore;
}

const CACHE_KEY = 'synapse_quality_scores';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

class QualityScoreCacheService {
  private cache: QualityScoreCache = {};
  private initialized = false;

  /**
   * Initialize cache from localStorage
   */
  private init(): void {
    if (this.initialized) return;

    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        this.cache = JSON.parse(stored);
        // Clean expired entries
        this.cleanExpired();
      }
      this.initialized = true;
    } catch (error) {
      console.warn('[QualityScoreCache] Failed to initialize cache:', error);
      this.cache = {};
      this.initialized = true;
    }
  }

  /**
   * Generate cache key from text
   */
  private generateKey(text: string): string {
    // Simple hash function for cache key
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `score_${hash}`;
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > CACHE_EXPIRY_MS;
  }

  /**
   * Clean expired cache entries
   */
  private cleanExpired(): void {
    const now = Date.now();
    Object.keys(this.cache).forEach(key => {
      if (this.isExpired(this.cache[key].timestamp)) {
        delete this.cache[key];
      }
    });
    this.persist();
  }

  /**
   * Persist cache to localStorage
   */
  private persist(): void {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.warn('[QualityScoreCache] Failed to persist cache:', error);
    }
  }

  /**
   * Get cached quality score for text
   */
  getScore(text: string): number | null {
    this.init();

    const key = this.generateKey(text);
    const cached = this.cache[key];

    if (!cached) {
      return null;
    }

    // Verify text matches (basic collision detection)
    if (cached.text !== text) {
      return null;
    }

    // Check if expired
    if (this.isExpired(cached.timestamp)) {
      delete this.cache[key];
      this.persist();
      return null;
    }

    return cached.score;
  }

  /**
   * Cache a quality score
   */
  setScore(text: string, score: number): void {
    this.init();

    const key = this.generateKey(text);
    this.cache[key] = {
      score,
      timestamp: Date.now(),
      text,
    };

    this.persist();
  }

  /**
   * Clear all cached scores
   */
  clear(): void {
    this.cache = {};
    this.persist();
  }

  /**
   * Get cache statistics
   */
  getStats(): { total: number; expired: number; fresh: number } {
    this.init();

    const entries = Object.values(this.cache);
    const expired = entries.filter(e => this.isExpired(e.timestamp)).length;

    return {
      total: entries.length,
      expired,
      fresh: entries.length - expired,
    };
  }
}

export const qualityScoreCacheService = new QualityScoreCacheService();
