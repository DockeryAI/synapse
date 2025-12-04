/**
 * API Cache Service - Stale-While-Revalidate Pattern
 * Implements Netflix/Spotify-style cache-first architecture
 */

interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
  etag?: string
}

interface CacheConfig {
  defaultTTL: number // milliseconds
  maxEntries: number
  enableCompression: boolean
}

class APICacheService {
  private cache: Map<string, CacheEntry> = new Map()
  private config: CacheConfig = {
    defaultTTL: 3600000, // 1 hour default
    maxEntries: 1000,
    enableCompression: false
  }

  // API-specific TTLs (in milliseconds)
  private readonly ttlMap: Record<string, number> = {
    'serper-search': 3600000,       // 1 hour
    'youtube-trending': 1800000,     // 30 minutes
    'youtube-comments': 3600000,     // 1 hour
    'semrush-keywords': 86400000,    // 24 hours
    'outscraper-reviews': 86400000,  // 24 hours
    'weather-current': 600000,       // 10 minutes
    'linkedin-company': 86400000,    // 24 hours
    'apify-twitter': 300000,         // 5 minutes (real-time)
    'apify-quora': 3600000,         // 1 hour
    'apify-linkedin': 86400000,     // 24 hours
    'apify-trustpilot': 86400000,   // 24 hours
    'apify-g2': 86400000,           // 24 hours
    'perplexity-research': 3600000,  // 1 hour
    'openrouter-analysis': 3600000,  // 1 hour
  }

  /**
   * Get cached data with SWR pattern
   * Returns stale data immediately while revalidating in background
   */
  async getWithSWR<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: {
      ttl?: number
      forceRefresh?: boolean
      onStale?: (data: T) => void
      onFresh?: (data: T) => void
    }
  ): Promise<{ data: T | null; isStale: boolean; isFetching: boolean }> {
    const cached = this.get<T>(key)

    // Force refresh if requested
    if (options?.forceRefresh) {
      const fresh = await this.fetchAndCache(key, fetcher, options?.ttl)
      options?.onFresh?.(fresh)
      return { data: fresh, isStale: false, isFetching: false }
    }

    // Return cached data immediately if available
    if (cached) {
      const isStale = this.isStale(key)

      if (isStale) {
        // Return stale data and revalidate in background
        options?.onStale?.(cached)

        // Background revalidation
        this.fetchAndCache(key, fetcher, options?.ttl)
          .then(fresh => options?.onFresh?.(fresh))
          .catch(console.error)

        return { data: cached, isStale: true, isFetching: true }
      }

      // Fresh cache hit
      return { data: cached, isStale: false, isFetching: false }
    }

    // No cache, fetch fresh
    const fresh = await this.fetchAndCache(key, fetcher, options?.ttl)
    options?.onFresh?.(fresh)
    return { data: fresh, isStale: false, isFetching: false }
  }

  /**
   * Get all cached data for initial render
   */
  getAllCachedData(): Map<string, any> {
    const result = new Map()

    for (const [key, entry] of this.cache) {
      result.set(key, {
        data: entry.data,
        isStale: this.isStale(key),
        timestamp: entry.timestamp
      })
    }

    return result
  }

  /**
   * Batch get for multiple keys
   */
  batchGet(keys: string[]): Map<string, any> {
    const result = new Map()

    for (const key of keys) {
      const data = this.get(key)
      if (data !== null) {
        result.set(key, data)
      }
    }

    return result
  }

  /**
   * Prefetch and cache data for next likely requests
   */
  async prefetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<void> {
    if (!this.has(key) || this.isStale(key)) {
      await this.fetchAndCache(key, fetcher, ttl)
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    entries: number
    hitRate: number
    staleRate: number
    totalSize: number
  } {
    let staleCount = 0
    let totalSize = 0

    for (const [key, entry] of this.cache) {
      if (this.isStale(key)) staleCount++
      totalSize += JSON.stringify(entry.data).length
    }

    return {
      entries: this.cache.size,
      hitRate: 0, // Would need to track hits/misses
      staleRate: staleCount / Math.max(1, this.cache.size),
      totalSize
    }
  }

  /**
   * Clear stale entries
   */
  pruneStale(): number {
    let removed = 0

    for (const [key] of this.cache) {
      if (this.isExpired(key)) {
        this.cache.delete(key)
        removed++
      }
    }

    return removed
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Clear specific API cache
   */
  clearPattern(pattern: string): number {
    let removed = 0

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
        removed++
      }
    }

    return removed
  }

  // Private methods

  private get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Return even if expired (for SWR)
    return entry.data as T
  }

  private has(key: string): boolean {
    return this.cache.has(key)
  }

  private set<T>(key: string, data: T, ttl?: number): void {
    // Enforce max entries with LRU eviction
    if (this.cache.size >= this.config.maxEntries) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    const finalTTL = ttl || this.getTTLForKey(key) || this.config.defaultTTL

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: finalTTL
    })
  }

  private isStale(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return true

    const age = Date.now() - entry.timestamp
    return age > entry.ttl
  }

  private isExpired(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return true

    const age = Date.now() - entry.timestamp
    // Consider expired after 2x TTL
    return age > entry.ttl * 2
  }

  private async fetchAndCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const data = await fetcher()
    this.set(key, data, ttl)
    return data
  }

  private getTTLForKey(key: string): number | null {
    // Extract API type from key (e.g., "serper-search-coffee" -> "serper-search")
    for (const [pattern, ttl] of Object.entries(this.ttlMap)) {
      if (key.startsWith(pattern)) {
        return ttl
      }
    }
    return null
  }

  /**
   * Generate cache key for API calls
   */
  static generateKey(apiType: string, params: any): string {
    const paramStr = JSON.stringify(params, Object.keys(params).sort())
    const hash = btoa(paramStr).replace(/[^a-zA-Z0-9]/g, '').substring(0, 8)
    return `${apiType}-${hash}`
  }
}

// Export singleton instance
export const apiCache = new APICacheService()

// Export class and types
export { APICacheService }
export type { CacheEntry, CacheConfig }