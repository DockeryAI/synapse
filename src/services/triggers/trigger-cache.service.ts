/**
 * Trigger Cache Service
 *
 * Intelligent caching system for triggers:
 * - In-memory cache with TTL management
 * - Background refresh for stale data
 * - Cache invalidation strategies
 * - Optimized API call batching
 * - Loading state management
 *
 * Created: 2025-12-01
 */

// ============================================================================
// TYPES
// ============================================================================

export interface CacheConfig {
  /** Time-to-live in milliseconds */
  ttl: number;
  /** Stale-while-revalidate threshold in milliseconds */
  staleThreshold: number;
  /** Maximum number of items to cache */
  maxItems: number;
  /** Enable background refresh */
  backgroundRefresh: boolean;
  /** Refresh interval for background updates (ms) */
  refreshInterval: number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  staleAt: number;
  key: string;
  hits: number;
  lastAccessed: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  oldestEntry: number | null;
  newestEntry: number | null;
  hitRate: number;
  totalRequests: number;
}

export type CacheStatus = 'fresh' | 'stale' | 'expired' | 'miss';

export interface CacheResult<T> {
  data: T | null;
  status: CacheStatus;
  age: number;
  fromCache: boolean;
}

export type InvalidationStrategy = 'all' | 'expired' | 'stale' | 'pattern' | 'lru';

export interface InvalidationOptions {
  strategy: InvalidationStrategy;
  pattern?: RegExp;
  maxAge?: number;
  keepCount?: number;
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

const DEFAULT_CONFIG: CacheConfig = {
  ttl: 5 * 60 * 1000, // 5 minutes
  staleThreshold: 2 * 60 * 1000, // 2 minutes
  maxItems: 100,
  backgroundRefresh: true,
  refreshInterval: 60 * 1000, // 1 minute
};

// ============================================================================
// TRIGGER CACHE SERVICE CLASS
// ============================================================================

export class TriggerCacheService {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private config: CacheConfig;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    oldestEntry: null,
    newestEntry: null,
    hitRate: 0,
    totalRequests: 0,
  };
  private refreshCallbacks: Map<string, () => Promise<unknown>> = new Map();
  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private pendingRefreshes: Set<string> = new Set();

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (this.config.backgroundRefresh) {
      this.startBackgroundRefresh();
    }
  }

  // ==========================================================================
  // CORE CACHE OPERATIONS
  // ==========================================================================

  /**
   * Get item from cache
   */
  get<T>(key: string): CacheResult<T> {
    this.stats.totalRequests++;
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return {
        data: null,
        status: 'miss',
        age: 0,
        fromCache: false,
      };
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    // Update access tracking
    entry.hits++;
    entry.lastAccessed = now;

    // Determine status
    let status: CacheStatus;
    if (now > entry.expiresAt) {
      status = 'expired';
      this.stats.misses++;
    } else if (now > entry.staleAt) {
      status = 'stale';
      this.stats.hits++;
      // Trigger background refresh if enabled
      if (this.config.backgroundRefresh && !this.pendingRefreshes.has(key)) {
        this.triggerBackgroundRefresh(key);
      }
    } else {
      status = 'fresh';
      this.stats.hits++;
    }

    this.updateHitRate();

    return {
      data: entry.data,
      status,
      age,
      fromCache: true,
    };
  }

  /**
   * Set item in cache
   */
  set<T>(key: string, data: T, customTtl?: number): void {
    const now = Date.now();
    const ttl = customTtl ?? this.config.ttl;

    // Enforce max items limit
    if (this.cache.size >= this.config.maxItems && !this.cache.has(key)) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
      staleAt: now + this.config.staleThreshold,
      key,
      hits: 0,
      lastAccessed: now,
    };

    this.cache.set(key, entry as CacheEntry<unknown>);
    this.updateStats();
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    return Date.now() < entry.expiresAt;
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.refreshCallbacks.delete(key);
      this.pendingRefreshes.delete(key);
      this.updateStats();
    }
    return deleted;
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.refreshCallbacks.clear();
    this.pendingRefreshes.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      oldestEntry: null,
      newestEntry: null,
      hitRate: 0,
      totalRequests: 0,
    };
  }

  // ==========================================================================
  // ADVANCED CACHE OPERATIONS
  // ==========================================================================

  /**
   * Get or fetch data - returns cached data or fetches if not available
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    customTtl?: number
  ): Promise<{ data: T; fromCache: boolean; status: CacheStatus }> {
    const cached = this.get<T>(key);

    // Fresh cache hit
    if (cached.status === 'fresh' && cached.data !== null) {
      return {
        data: cached.data,
        fromCache: true,
        status: 'fresh',
      };
    }

    // Stale cache - return stale data but refresh in background
    if (cached.status === 'stale' && cached.data !== null) {
      // Register fetcher for background refresh
      this.registerRefreshCallback(key, fetcher);
      return {
        data: cached.data,
        fromCache: true,
        status: 'stale',
      };
    }

    // Cache miss or expired - fetch new data
    try {
      const data = await fetcher();
      this.set(key, data, customTtl);
      this.registerRefreshCallback(key, fetcher);
      return {
        data,
        fromCache: false,
        status: cached.status === 'miss' ? 'miss' : 'expired',
      };
    } catch (error) {
      // If fetch fails but we have expired data, return it
      if (cached.data !== null) {
        return {
          data: cached.data,
          fromCache: true,
          status: 'expired',
        };
      }
      throw error;
    }
  }

  /**
   * Batch get multiple keys
   */
  getMany<T>(keys: string[]): Map<string, CacheResult<T>> {
    const results = new Map<string, CacheResult<T>>();
    for (const key of keys) {
      results.set(key, this.get<T>(key));
    }
    return results;
  }

  /**
   * Batch set multiple items
   */
  setMany<T>(items: Array<{ key: string; data: T; ttl?: number }>): void {
    for (const item of items) {
      this.set(item.key, item.data, item.ttl);
    }
  }

  /**
   * Invalidate cache entries based on strategy
   */
  invalidate(options: InvalidationOptions): number {
    let invalidated = 0;
    const now = Date.now();

    switch (options.strategy) {
      case 'all':
        invalidated = this.cache.size;
        this.clear();
        break;

      case 'expired':
        for (const [key, entry] of this.cache.entries()) {
          if (now > entry.expiresAt) {
            this.delete(key);
            invalidated++;
          }
        }
        break;

      case 'stale':
        for (const [key, entry] of this.cache.entries()) {
          if (now > entry.staleAt) {
            this.delete(key);
            invalidated++;
          }
        }
        break;

      case 'pattern':
        if (options.pattern) {
          for (const key of this.cache.keys()) {
            if (options.pattern.test(key)) {
              this.delete(key);
              invalidated++;
            }
          }
        }
        break;

      case 'lru':
        const keepCount = options.keepCount ?? Math.floor(this.config.maxItems / 2);
        const entries = Array.from(this.cache.entries())
          .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

        const toRemove = entries.slice(0, Math.max(0, entries.length - keepCount));
        for (const [key] of toRemove) {
          this.delete(key);
          invalidated++;
        }
        break;
    }

    return invalidated;
  }

  /**
   * Invalidate entries matching a pattern
   */
  invalidatePattern(pattern: string | RegExp): number {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    return this.invalidate({ strategy: 'pattern', pattern: regex });
  }

  /**
   * Invalidate entries for a specific profile
   */
  invalidateProfile(profileId: string): number {
    return this.invalidatePattern(new RegExp(`^trigger:${profileId}:`));
  }

  // ==========================================================================
  // BACKGROUND REFRESH
  // ==========================================================================

  /**
   * Register a callback for background refresh
   */
  registerRefreshCallback<T>(key: string, fetcher: () => Promise<T>): void {
    this.refreshCallbacks.set(key, fetcher as () => Promise<unknown>);
  }

  /**
   * Trigger background refresh for a key
   */
  private async triggerBackgroundRefresh(key: string): Promise<void> {
    if (this.pendingRefreshes.has(key)) return;

    const fetcher = this.refreshCallbacks.get(key);
    if (!fetcher) return;

    this.pendingRefreshes.add(key);

    try {
      const data = await fetcher();
      this.set(key, data);
    } catch (error) {
      console.warn(`[TriggerCache] Background refresh failed for ${key}:`, error);
    } finally {
      this.pendingRefreshes.delete(key);
    }
  }

  /**
   * Start background refresh timer
   */
  private startBackgroundRefresh(): void {
    if (this.refreshTimer) return;

    this.refreshTimer = setInterval(() => {
      this.refreshStaleEntries();
    }, this.config.refreshInterval);
  }

  /**
   * Stop background refresh timer
   */
  stopBackgroundRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Refresh all stale entries
   */
  private async refreshStaleEntries(): Promise<void> {
    const now = Date.now();
    const staleKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.staleAt && now < entry.expiresAt && !this.pendingRefreshes.has(key)) {
        staleKeys.push(key);
      }
    }

    // Refresh up to 5 entries at a time to avoid overwhelming the system
    const toRefresh = staleKeys.slice(0, 5);
    await Promise.allSettled(
      toRefresh.map((key) => this.triggerBackgroundRefresh(key))
    );
  }

  // ==========================================================================
  // CACHE KEY GENERATION
  // ==========================================================================

  /**
   * Generate cache key for triggers
   */
  static generateTriggerKey(params: {
    profileId: string;
    segment?: string;
    filters?: Record<string, unknown>;
  }): string {
    const base = `trigger:${params.profileId}`;
    const segment = params.segment ? `:${params.segment}` : '';
    const filterHash = params.filters
      ? `:${hashObject(params.filters)}`
      : '';
    return `${base}${segment}${filterHash}`;
  }

  /**
   * Generate cache key for trigger analysis
   */
  static generateAnalysisKey(triggerId: string, analysisType: string): string {
    return `analysis:${triggerId}:${analysisType}`;
  }

  /**
   * Generate cache key for aggregated data
   */
  static generateAggregateKey(profileId: string, aggregationType: string): string {
    return `aggregate:${profileId}:${aggregationType}`;
  }

  // ==========================================================================
  // STATS & MONITORING
  // ==========================================================================

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get detailed cache info
   */
  getDetailedInfo(): {
    stats: CacheStats;
    entries: Array<{
      key: string;
      age: number;
      status: CacheStatus;
      hits: number;
      size: number;
    }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => {
      let status: CacheStatus;
      if (now > entry.expiresAt) {
        status = 'expired';
      } else if (now > entry.staleAt) {
        status = 'stale';
      } else {
        status = 'fresh';
      }

      return {
        key,
        age: now - entry.timestamp,
        status,
        hits: entry.hits,
        size: estimateSize(entry.data),
      };
    });

    return {
      stats: this.getStats(),
      entries,
    };
  }

  /**
   * Update hit rate calculation
   */
  private updateHitRate(): void {
    if (this.stats.totalRequests > 0) {
      this.stats.hitRate = this.stats.hits / this.stats.totalRequests;
    }
  }

  /**
   * Update cache statistics
   */
  private updateStats(): void {
    this.stats.size = this.cache.size;

    let oldest: number | null = null;
    let newest: number | null = null;

    for (const entry of this.cache.values()) {
      if (oldest === null || entry.timestamp < oldest) {
        oldest = entry.timestamp;
      }
      if (newest === null || entry.timestamp > newest) {
        newest = entry.timestamp;
      }
    }

    this.stats.oldestEntry = oldest;
    this.stats.newestEntry = newest;
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.delete(lruKey);
    }
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  /**
   * Cleanup expired entries
   */
  cleanup(): number {
    return this.invalidate({ strategy: 'expired' });
  }

  /**
   * Destroy the cache service
   */
  destroy(): void {
    this.stopBackgroundRefresh();
    this.clear();
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Hash object for cache key generation
 */
function hashObject(obj: Record<string, unknown>): string {
  const str = JSON.stringify(obj, Object.keys(obj).sort());
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Estimate size of data in bytes
 */
function estimateSize(data: unknown): number {
  try {
    return JSON.stringify(data).length * 2; // Rough estimate: 2 bytes per char
  } catch {
    return 0;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const triggerCacheService = new TriggerCacheService();

// ============================================================================
// REACT HOOK HELPERS
// ============================================================================

/**
 * Create a cache key hook for trigger data
 */
export function createTriggerCacheKey(profileId: string, options?: {
  segment?: string;
  confidence?: string;
  category?: string;
}): string {
  return TriggerCacheService.generateTriggerKey({
    profileId,
    segment: options?.segment,
    filters: options ? { confidence: options.confidence, category: options.category } : undefined,
  });
}

/**
 * Preload triggers into cache
 */
export async function preloadTriggers<T>(
  profileId: string,
  fetcher: () => Promise<T>,
  options?: { ttl?: number }
): Promise<void> {
  const key = createTriggerCacheKey(profileId);
  const cached = triggerCacheService.get<T>(key);

  if (cached.status === 'miss' || cached.status === 'expired') {
    try {
      const data = await fetcher();
      triggerCacheService.set(key, data, options?.ttl);
      triggerCacheService.registerRefreshCallback(key, fetcher);
    } catch (error) {
      console.warn('[TriggerCache] Preload failed:', error);
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default triggerCacheService;
