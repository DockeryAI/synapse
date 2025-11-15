/**
 * Simple In-Memory Cache with TTL
 *
 * @example
 * const cache = new SimpleCache<UserData>()
 * cache.set('user-123', userData, 3600) // 1 hour TTL
 * const user = cache.get('user-123')
 */
export class SimpleCache<T> {
  private cache = new Map<string, { data: T; expires: number }>()

  /**
   * Store data with TTL
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttlSeconds - Time to live in seconds
   */
  set(key: string, data: T, ttlSeconds: number): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + (ttlSeconds * 1000)
    })
  }

  /**
   * Retrieve cached data
   * @param key - Cache key
   * @returns Cached data or null if expired/missing
   */
  get(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null
  }

  /**
   * Remove a specific key
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }
}
