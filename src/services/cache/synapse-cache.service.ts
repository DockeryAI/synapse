/**
 * Synapse Cache Service
 *
 * Caches generated Synapse insights and Smart Picks to prevent
 * unnecessary API calls on page refreshes. Data is stored in
 * localStorage with expiration timestamps.
 *
 * Features:
 * - Persistent localStorage caching
 * - Automatic expiration (24 hours default)
 * - Manual cache invalidation
 * - Per-context caching (different cache for different business contexts)
 */

import type { SynapseInsight } from '@/types/synapse/synapse.types';
import type { SmartPick } from '@/types/smart-picks.types';
import type { DeepContext } from '@/types/synapse/deepContext.types';

interface CachedSynapseData {
  synapses: SynapseInsight[];
  generatedAt: string;
  expiresAt: string;
  contextHash: string;
}

interface CachedSmartPicksData {
  picks: SmartPick[];
  campaignType: string;
  generatedAt: string;
  expiresAt: string;
  contextHash: string;
}

class SynapseCacheService {
  private readonly SYNAPSE_CACHE_KEY = 'synapse_insights_cache';
  private readonly SMART_PICKS_CACHE_KEY = 'smart_picks_cache';
  private readonly DEFAULT_EXPIRY_HOURS = 24; // Cache for 24 hours by default

  /**
   * Generate a hash of the context to use as cache key
   * This ensures different contexts get different caches
   */
  private generateContextHash(context: DeepContext): string {
    const key = `${context.business?.profile?.name || ''}_${context.business?.profile?.industry || ''}_${context.business?.profile?.location?.city || ''}`;
    return btoa(key).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }

  /**
   * Check if cached data is still valid (not expired)
   */
  private isValidCache(expiresAt: string): boolean {
    return new Date(expiresAt) > new Date();
  }

  /**
   * Get cached Synapse insights if available and valid
   */
  getCachedSynapses(context: DeepContext): SynapseInsight[] | null {
    try {
      const cacheKey = `${this.SYNAPSE_CACHE_KEY}_${this.generateContextHash(context)}`;
      const cached = localStorage.getItem(cacheKey);

      if (!cached) {
        console.log('[SynapseCache] No cached synapses found');
        return null;
      }

      const data: CachedSynapseData = JSON.parse(cached);

      if (!this.isValidCache(data.expiresAt)) {
        console.log('[SynapseCache] Cached synapses expired');
        localStorage.removeItem(cacheKey);
        return null;
      }

      console.log('[SynapseCache] Using cached synapses from', data.generatedAt);
      return data.synapses;
    } catch (error) {
      console.error('[SynapseCache] Error reading cache:', error);
      return null;
    }
  }

  /**
   * Cache Synapse insights
   */
  cacheSynapses(context: DeepContext, synapses: SynapseInsight[], expiryHours?: number): void {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + (expiryHours || this.DEFAULT_EXPIRY_HOURS) * 60 * 60 * 1000);

      const data: CachedSynapseData = {
        synapses,
        generatedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        contextHash: this.generateContextHash(context)
      };

      const cacheKey = `${this.SYNAPSE_CACHE_KEY}_${this.generateContextHash(context)}`;
      localStorage.setItem(cacheKey, JSON.stringify(data));

      console.log('[SynapseCache] Cached', synapses.length, 'synapses until', expiresAt.toLocaleString());
    } catch (error) {
      console.error('[SynapseCache] Error caching synapses:', error);
    }
  }

  /**
   * Get cached Smart Picks if available and valid
   */
  getCachedSmartPicks(context: DeepContext, campaignType: string): SmartPick[] | null {
    try {
      const cacheKey = `${this.SMART_PICKS_CACHE_KEY}_${this.generateContextHash(context)}_${campaignType}`;
      const cached = localStorage.getItem(cacheKey);

      if (!cached) {
        console.log('[SynapseCache] No cached smart picks found');
        return null;
      }

      const data: CachedSmartPicksData = JSON.parse(cached);

      if (!this.isValidCache(data.expiresAt)) {
        console.log('[SynapseCache] Cached smart picks expired');
        localStorage.removeItem(cacheKey);
        return null;
      }

      console.log('[SynapseCache] Using cached smart picks from', data.generatedAt);
      return data.picks;
    } catch (error) {
      console.error('[SynapseCache] Error reading smart picks cache:', error);
      return null;
    }
  }

  /**
   * Cache Smart Picks
   */
  cacheSmartPicks(context: DeepContext, campaignType: string, picks: SmartPick[], expiryHours?: number): void {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + (expiryHours || this.DEFAULT_EXPIRY_HOURS) * 60 * 60 * 1000);

      const data: CachedSmartPicksData = {
        picks,
        campaignType,
        generatedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        contextHash: this.generateContextHash(context)
      };

      const cacheKey = `${this.SMART_PICKS_CACHE_KEY}_${this.generateContextHash(context)}_${campaignType}`;
      localStorage.setItem(cacheKey, JSON.stringify(data));

      console.log('[SynapseCache] Cached', picks.length, 'smart picks until', expiresAt.toLocaleString());
    } catch (error) {
      console.error('[SynapseCache] Error caching smart picks:', error);
    }
  }

  /**
   * Clear all caches for a specific context
   */
  clearCache(context: DeepContext): void {
    try {
      const contextHash = this.generateContextHash(context);
      const keysToRemove: string[] = [];

      // Find all keys related to this context
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes(contextHash) || key.includes(this.SYNAPSE_CACHE_KEY) || key.includes(this.SMART_PICKS_CACHE_KEY))) {
          keysToRemove.push(key);
        }
      }

      // Remove all related keys
      keysToRemove.forEach(key => localStorage.removeItem(key));

      console.log('[SynapseCache] Cleared cache for context');
    } catch (error) {
      console.error('[SynapseCache] Error clearing cache:', error);
    }
  }

  /**
   * Clear all Synapse caches
   */
  clearAllCaches(): void {
    try {
      const keysToRemove: string[] = [];

      // Find all Synapse-related keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes(this.SYNAPSE_CACHE_KEY) || key.includes(this.SMART_PICKS_CACHE_KEY))) {
          keysToRemove.push(key);
        }
      }

      // Remove all related keys
      keysToRemove.forEach(key => localStorage.removeItem(key));

      console.log('[SynapseCache] Cleared all Synapse caches');
    } catch (error) {
      console.error('[SynapseCache] Error clearing all caches:', error);
    }
  }

  /**
   * Get cache metadata (when it was generated, when it expires)
   */
  getCacheMetadata(context: DeepContext): { synapsesCache?: { generatedAt: string; expiresAt: string }, smartPicksCache?: { generatedAt: string; expiresAt: string } } | null {
    try {
      const result: any = {};

      // Check Synapses cache
      const synapseCacheKey = `${this.SYNAPSE_CACHE_KEY}_${this.generateContextHash(context)}`;
      const synapsesCached = localStorage.getItem(synapseCacheKey);
      if (synapsesCached) {
        const data: CachedSynapseData = JSON.parse(synapsesCached);
        result.synapsesCache = {
          generatedAt: data.generatedAt,
          expiresAt: data.expiresAt
        };
      }

      // Check Smart Picks cache
      const smartPicksCacheKey = `${this.SMART_PICKS_CACHE_KEY}_${this.generateContextHash(context)}_multi-post`;
      const smartPicksCached = localStorage.getItem(smartPicksCacheKey);
      if (smartPicksCached) {
        const data: CachedSmartPicksData = JSON.parse(smartPicksCached);
        result.smartPicksCache = {
          generatedAt: data.generatedAt,
          expiresAt: data.expiresAt
        };
      }

      return Object.keys(result).length > 0 ? result : null;
    } catch (error) {
      console.error('[SynapseCache] Error getting cache metadata:', error);
      return null;
    }
  }
}

// Export singleton instance
export const synapseCache = new SynapseCacheService();