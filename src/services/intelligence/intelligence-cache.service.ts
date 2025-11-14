/**
 * Intelligence Cache Service
 * Caches API responses from intelligence services with smart TTL
 * Reduces API costs and improves performance
 */

import { supabase } from '@/lib/supabase'

interface CacheEntry {
  id: string
  cache_key: string
  data: any
  data_type: string
  source_api?: string
  brand_id?: string
  expires_at: string
  created_at: string
  updated_at: string
}

interface CacheOptions {
  dataType: string
  sourceApi?: string
  brandId?: string
  ttlMinutes?: number // Optional override for default TTL
}

/**
 * Smart TTL configuration based on data type
 * Balances freshness with API cost reduction
 */
const TTL_CONFIG: Record<string, number> = {
  // Long-lived data (7 days)
  'competitor_profile': 7 * 24 * 60,
  'website_analysis': 7 * 24 * 60,
  'industry_profile': 7 * 24 * 60,
  'company_info': 7 * 24 * 60,

  // Medium-lived data (24 hours)
  'news': 24 * 60,
  'youtube_videos': 24 * 60,
  'local_reviews': 24 * 60,

  // Short-lived data (2 hours)
  'search_results': 2 * 60,
  'autocomplete': 2 * 60,

  // Very short-lived data (1 hour)
  'trend_data': 60,
  'trending_searches': 60,

  // Real-time data (30 minutes)
  'weather': 30,
  'local_events': 30,

  // Default fallback (2 hours)
  'default': 2 * 60
}

class IntelligenceCacheService {
  /**
   * Generate a cache key from components
   */
  private generateCacheKey(components: string[]): string {
    return components
      .map(c => String(c).toLowerCase().trim())
      .filter(Boolean)
      .join(':')
  }

  /**
   * Get TTL in minutes for a data type
   */
  private getTTL(dataType: string, overrideTTL?: number): number {
    if (overrideTTL) return overrideTTL
    return TTL_CONFIG[dataType] || TTL_CONFIG.default
  }

  /**
   * Calculate expiration timestamp
   */
  private getExpiresAt(ttlMinutes: number): string {
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes)
    return expiresAt.toISOString()
  }

  /**
   * Get cached data by key
   * Returns null if not found or expired
   */
  async get<T = any>(cacheKey: string): Promise<T | null> {
    try {
      console.log('[IntelligenceCache] Getting:', cacheKey)

      const { data, error } = await supabase
        .from('intelligence_cache')
        .select('*')
        .eq('cache_key', cacheKey)
        .single()

      if (error || !data) {
        console.log('[IntelligenceCache] Cache miss:', cacheKey)
        return null
      }

      // Check if expired
      const expiresAt = new Date(data.expires_at)
      if (expiresAt < new Date()) {
        console.log('[IntelligenceCache] Cache expired:', cacheKey)
        // Optionally delete expired entry
        await this.invalidate(cacheKey)
        return null
      }

      console.log('[IntelligenceCache] Cache hit:', cacheKey)
      return data.data as T
    } catch (error) {
      console.error('[IntelligenceCache] Get error:', error)
      return null
    }
  }

  /**
   * Set cache data with smart TTL
   */
  async set(
    cacheKey: string,
    data: any,
    options: CacheOptions
  ): Promise<void> {
    try {
      const ttlMinutes = this.getTTL(options.dataType, options.ttlMinutes)
      const expiresAt = this.getExpiresAt(ttlMinutes)

      console.log(`[IntelligenceCache] Setting: ${cacheKey} (TTL: ${ttlMinutes}m)`)

      // Only include brand_id if it's a valid UUID (not "demo" or other test values)
      const isValidUUID = options.brandId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(options.brandId)

      const { error } = await supabase
        .from('intelligence_cache')
        .upsert({
          cache_key: cacheKey,
          data,
          data_type: options.dataType,
          source_api: options.sourceApi,
          brand_id: isValidUUID ? options.brandId : null,
          expires_at: expiresAt,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'cache_key'
        })

      if (error) {
        console.error('[IntelligenceCache] Set error:', error)
      }
    } catch (error) {
      console.error('[IntelligenceCache] Set error:', error)
    }
  }

  /**
   * Invalidate (delete) cache entry
   */
  async invalidate(cacheKey: string): Promise<void> {
    try {
      console.log('[IntelligenceCache] Invalidating:', cacheKey)

      const { error } = await supabase
        .from('intelligence_cache')
        .delete()
        .eq('cache_key', cacheKey)

      if (error) {
        console.error('[IntelligenceCache] Invalidate error:', error)
      }
    } catch (error) {
      console.error('[IntelligenceCache] Invalidate error:', error)
    }
  }

  /**
   * Invalidate all cache entries for a specific brand
   */
  async invalidateByBrand(brandId: string): Promise<void> {
    try {
      console.log('[IntelligenceCache] Invalidating brand:', brandId)

      const { error } = await supabase
        .from('intelligence_cache')
        .delete()
        .eq('brand_id', brandId)

      if (error) {
        console.error('[IntelligenceCache] Invalidate by brand error:', error)
      }
    } catch (error) {
      console.error('[IntelligenceCache] Invalidate by brand error:', error)
    }
  }

  /**
   * Invalidate all cache entries of a specific type
   */
  async invalidateByType(dataType: string): Promise<void> {
    try {
      console.log('[IntelligenceCache] Invalidating type:', dataType)

      const { error } = await supabase
        .from('intelligence_cache')
        .delete()
        .eq('data_type', dataType)

      if (error) {
        console.error('[IntelligenceCache] Invalidate by type error:', error)
      }
    } catch (error) {
      console.error('[IntelligenceCache] Invalidate by type error:', error)
    }
  }

  /**
   * Invalidate all cache entries from a specific API source
   */
  async invalidateBySource(sourceApi: string): Promise<void> {
    try {
      console.log('[IntelligenceCache] Invalidating source:', sourceApi)

      const { error } = await supabase
        .from('intelligence_cache')
        .delete()
        .eq('source_api', sourceApi)

      if (error) {
        console.error('[IntelligenceCache] Invalidate by source error:', error)
      }
    } catch (error) {
      console.error('[IntelligenceCache] Invalidate by source error:', error)
    }
  }

  /**
   * Clean up all expired cache entries
   * This should be called periodically (e.g., via cron job)
   */
  async cleanupExpired(): Promise<number> {
    try {
      console.log('[IntelligenceCache] Cleaning up expired entries...')

      const { data, error } = await supabase
        .from('intelligence_cache')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('id')

      if (error) {
        console.error('[IntelligenceCache] Cleanup error:', error)
        return 0
      }

      const deletedCount = data?.length || 0
      console.log(`[IntelligenceCache] Cleaned up ${deletedCount} expired entries`)
      return deletedCount
    } catch (error) {
      console.error('[IntelligenceCache] Cleanup error:', error)
      return 0
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    total: number
    byType: Record<string, number>
    bySource: Record<string, number>
    expired: number
  }> {
    try {
      const { data, error } = await supabase
        .from('intelligence_cache')
        .select('data_type, source_api, expires_at')

      if (error || !data) {
        return { total: 0, byType: {}, bySource: {}, expired: 0 }
      }

      const now = new Date()
      const stats = {
        total: data.length,
        byType: {} as Record<string, number>,
        bySource: {} as Record<string, number>,
        expired: 0
      }

      data.forEach(entry => {
        // Count by type
        stats.byType[entry.data_type] = (stats.byType[entry.data_type] || 0) + 1

        // Count by source
        if (entry.source_api) {
          stats.bySource[entry.source_api] = (stats.bySource[entry.source_api] || 0) + 1
        }

        // Count expired
        if (new Date(entry.expires_at) < now) {
          stats.expired++
        }
      })

      return stats
    } catch (error) {
      console.error('[IntelligenceCache] Stats error:', error)
      return { total: 0, byType: {}, bySource: {}, expired: 0 }
    }
  }

  /**
   * Helper: Create cache key for Serper News
   */
  cacheKeyNews(topic: string, location?: string): string {
    return this.generateCacheKey(['serper', 'news', topic, location || 'global'])
  }

  /**
   * Helper: Create cache key for Serper Trends
   */
  cacheKeyTrends(keyword: string, timeRange?: string): string {
    return this.generateCacheKey(['serper', 'trends', keyword, timeRange || '30d'])
  }

  /**
   * Helper: Create cache key for Serper Places
   */
  cacheKeyPlaces(query: string, location: string): string {
    return this.generateCacheKey(['serper', 'places', query, location])
  }

  /**
   * Helper: Create cache key for Serper Videos
   */
  cacheKeyVideos(query: string): string {
    return this.generateCacheKey(['serper', 'videos', query])
  }

  /**
   * Helper: Create cache key for Serper Images
   */
  cacheKeyImages(query: string): string {
    return this.generateCacheKey(['serper', 'images', query])
  }

  /**
   * Helper: Create cache key for Serper Shopping
   */
  cacheKeyShopping(product: string): string {
    return this.generateCacheKey(['serper', 'shopping', product])
  }

  /**
   * Helper: Create cache key for Website Analysis
   */
  cacheKeyWebsiteAnalysis(url: string): string {
    return this.generateCacheKey(['website_analysis', url])
  }

  /**
   * Helper: Create cache key for Competitor Profile
   */
  cacheKeyCompetitorProfile(domain: string): string {
    return this.generateCacheKey(['competitor_profile', domain])
  }

  /**
   * Helper: Create cache key for OutScraper Reviews
   */
  cacheKeyReviews(placeId: string): string {
    return this.generateCacheKey(['outscraper', 'reviews', placeId])
  }

  /**
   * Helper: Create cache key for Weather
   */
  cacheKeyWeather(location: string): string {
    return this.generateCacheKey(['weather', location])
  }

  /**
   * Helper: Create cache key for YouTube
   */
  cacheKeyYouTube(query: string): string {
    return this.generateCacheKey(['youtube', query])
  }
}

export const intelligenceCache = new IntelligenceCacheService()
export { IntelligenceCacheService, TTL_CONFIG }
export type { CacheEntry, CacheOptions }
