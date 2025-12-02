/**
 * URL Preloader Service
 *
 * Fires website scraping as soon as a valid URL is entered (on blur)
 * This saves 10-15 seconds by starting the scrape before the user clicks submit.
 *
 * Architecture:
 * - User enters URL → onBlur triggers preload
 * - Scrape runs in background with 500ms debounce
 * - Result cached for immediate use on submit
 * - Cache expires after 5 minutes
 *
 * Created: 2025-12-02 (UVP Speed Up Phase 3)
 */

import { scrapeWebsite, type WebsiteData } from '@/services/scraping/websiteScraper';

interface PreloadCacheEntry {
  url: string;
  data: WebsiteData;
  timestamp: number;
  status: 'loading' | 'ready' | 'error';
  error?: string;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const DEBOUNCE_MS = 500;

class UrlPreloaderService {
  private cache: Map<string, PreloadCacheEntry> = new Map();
  private pendingRequests: Map<string, Promise<WebsiteData>> = new Map();
  private debounceTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  /**
   * Preload website data for a URL
   * Called on URL input blur to start scraping early
   */
  preload(url: string): void {
    if (!url || !this.isValidUrl(url)) {
      return;
    }

    const normalizedUrl = this.normalizeUrl(url);

    // Check if already cached and fresh
    const cached = this.cache.get(normalizedUrl);
    if (cached && cached.status === 'ready' && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      console.log('[URLPreloader] Already cached:', normalizedUrl);
      return;
    }

    // Check if already loading
    if (this.pendingRequests.has(normalizedUrl)) {
      console.log('[URLPreloader] Already loading:', normalizedUrl);
      return;
    }

    // Debounce to avoid rapid-fire requests
    const existingTimer = this.debounceTimers.get(normalizedUrl);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      this.doPreload(normalizedUrl);
      this.debounceTimers.delete(normalizedUrl);
    }, DEBOUNCE_MS);

    this.debounceTimers.set(normalizedUrl, timer);
  }

  /**
   * Get cached website data if available
   * Returns immediately if cached, otherwise null
   */
  getCached(url: string): WebsiteData | null {
    const normalizedUrl = this.normalizeUrl(url);
    const cached = this.cache.get(normalizedUrl);

    if (cached && cached.status === 'ready' && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      console.log('[URLPreloader] Cache hit:', normalizedUrl);
      return cached.data;
    }

    return null;
  }

  /**
   * Get cached data or wait for pending request
   * Use this on form submit to get preloaded data
   */
  async getOrWait(url: string): Promise<WebsiteData | null> {
    const normalizedUrl = this.normalizeUrl(url);

    // Check cache first
    const cached = this.getCached(normalizedUrl);
    if (cached) {
      return cached;
    }

    // Check if loading
    const pending = this.pendingRequests.get(normalizedUrl);
    if (pending) {
      console.log('[URLPreloader] Waiting for pending request:', normalizedUrl);
      try {
        return await pending;
      } catch {
        return null;
      }
    }

    return null;
  }

  /**
   * Get status of preload for a URL
   */
  getStatus(url: string): 'none' | 'loading' | 'ready' | 'error' {
    const normalizedUrl = this.normalizeUrl(url);

    if (this.pendingRequests.has(normalizedUrl)) {
      return 'loading';
    }

    const cached = this.cache.get(normalizedUrl);
    if (cached) {
      if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
        return 'none';
      }
      return cached.status;
    }

    return 'none';
  }

  /**
   * Clear cache for a URL (force refresh)
   */
  clearCache(url: string): void {
    const normalizedUrl = this.normalizeUrl(url);
    this.cache.delete(normalizedUrl);
    this.pendingRequests.delete(normalizedUrl);
    const timer = this.debounceTimers.get(normalizedUrl);
    if (timer) {
      clearTimeout(timer);
      this.debounceTimers.delete(normalizedUrl);
    }
  }

  /**
   * Clear all cached data
   */
  clearAll(): void {
    this.cache.clear();
    this.pendingRequests.clear();
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }

  // Private methods

  private async doPreload(url: string): Promise<void> {
    console.log('[URLPreloader] Starting preload:', url);

    // Mark as loading
    this.cache.set(url, {
      url,
      data: null as any,
      timestamp: Date.now(),
      status: 'loading',
    });

    // Create promise for pending request
    const promise = scrapeWebsite(url);
    this.pendingRequests.set(url, promise);

    try {
      const data = await promise;

      console.log('[URLPreloader] Preload complete:', url);
      this.cache.set(url, {
        url,
        data,
        timestamp: Date.now(),
        status: 'ready',
      });
    } catch (error) {
      console.error('[URLPreloader] Preload failed:', url, error);
      this.cache.set(url, {
        url,
        data: null as any,
        timestamp: Date.now(),
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      this.pendingRequests.delete(url);
    }
  }

  private normalizeUrl(url: string): string {
    try {
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      const parsed = new URL(fullUrl);
      // Normalize to just the origin + pathname (no trailing slash)
      return `${parsed.origin}${parsed.pathname.replace(/\/$/, '')}`;
    } catch {
      return url;
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      new URL(fullUrl);
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const urlPreloader = new UrlPreloaderService();
