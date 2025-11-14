/**
 * Parallel Intelligence Orchestrator
 *
 * Gathers business intelligence from 17 data sources in parallel with
 * graceful degradation and intelligent caching.
 *
 * Performance: Completes in <30 seconds with minimum 8 sources required
 */

import type { ParsedURL } from './url-parser.service';
import { ApifyAPI } from './intelligence/apify-api';
import { OutScraperAPI } from './intelligence/outscraper-api';
import { SerperAPI } from './intelligence/serper-api';
import { SemrushAPI } from './intelligence/semrush-api';
import { YouTubeAPI } from './intelligence/youtube-api';
import { NewsAPI } from './intelligence/news-api';
import { WeatherAPI } from './intelligence/weather-api';

/**
 * Result from a single intelligence source
 */
export interface IntelligenceResult {
  /** Data source name */
  source: string;
  /** Raw data from the source */
  data: any;
  /** Whether the fetch was successful */
  success: boolean;
  /** Error if fetch failed */
  error?: Error;
  /** Time taken in milliseconds */
  duration: number;
  /** Priority level of this source */
  priority: 'critical' | 'important' | 'optional';
}

/**
 * Aggregated intelligence from all sources
 */
export interface AggregatedIntelligence {
  /** URL that was analyzed */
  url: string;
  /** Parsed URL components */
  parsedUrl: ParsedURL;
  /** Results from each source */
  results: IntelligenceResult[];
  /** Number of successful sources */
  successCount: number;
  /** Total sources attempted */
  totalCount: number;
  /** Total time taken */
  totalDuration: number;
  /** Whether minimum viable data threshold was met */
  isViable: boolean;
  /** Timestamp of gathering */
  timestamp: Date;
}

/**
 * Error thrown when insufficient data sources succeed
 */
export class InsufficientDataError extends Error {
  constructor(
    message: string,
    public successCount: number,
    public requiredCount: number
  ) {
    super(message);
    this.name = 'InsufficientDataError';
  }
}

/**
 * Parallel Intelligence Service
 *
 * Orchestrates 17 intelligence APIs in parallel with graceful degradation
 */
export class ParallelIntelligenceService {
  private readonly API_TIMEOUT = 15000; // 15 seconds per API
  private readonly MIN_SOURCES = 8; // Minimum successful sources
  private readonly CACHE_TTL = 3600000; // 1 hour in milliseconds

  private cache = new Map<string, { data: AggregatedIntelligence; expires: number }>();

  /**
   * Gather intelligence from all sources in parallel
   *
   * @param parsedUrl - Parsed URL to analyze
   * @param options - Gathering options
   * @returns Aggregated intelligence
   */
  async gather(
    parsedUrl: ParsedURL,
    options: {
      forceRefresh?: boolean;
      timeout?: number;
    } = {}
  ): Promise<AggregatedIntelligence> {
    const { forceRefresh = false, timeout = this.API_TIMEOUT } = options;

    // Check cache
    if (!forceRefresh) {
      const cached = this.getCached(parsedUrl.normalized);
      if (cached) {
        console.log(`📦 Using cached intelligence for ${parsedUrl.domain}`);
        return cached;
      }
    }

    const startTime = Date.now();

    console.log(`🔍 Gathering intelligence for ${parsedUrl.domain}...`);
    console.log(`   Using ${17} parallel data sources`);

    // Execute all sources in parallel
    const results = await Promise.allSettled([
      this.fetchWithTimeout('Apify', 'critical', () =>
        ApifyAPI.scrapeWebsite(parsedUrl.normalized)
      , timeout),

      this.fetchWithTimeout('OutScraper-Business', 'critical', () =>
        OutScraperAPI.getBusinessProfile(parsedUrl.domain)
      , timeout),

      this.fetchWithTimeout('OutScraper-Reviews', 'important', () =>
        OutScraperAPI.getReviews(parsedUrl.domain)
      , timeout),

      this.fetchWithTimeout('Serper-Search', 'critical', () =>
        SerperAPI.search(parsedUrl.domain)
      , timeout),

      this.fetchWithTimeout('Serper-News', 'optional', () =>
        SerperAPI.news(parsedUrl.domain)
      , timeout),

      this.fetchWithTimeout('Serper-Trends', 'optional', () =>
        SerperAPI.trends(parsedUrl.domain)
      , timeout),

      this.fetchWithTimeout('Serper-Autocomplete', 'optional', () =>
        SerperAPI.autocomplete(parsedUrl.domain)
      , timeout),

      this.fetchWithTimeout('Serper-Places', 'important', () =>
        SerperAPI.places(parsedUrl.domain)
      , timeout),

      this.fetchWithTimeout('Serper-Images', 'optional', () =>
        SerperAPI.images(parsedUrl.domain)
      , timeout),

      this.fetchWithTimeout('Serper-Videos', 'optional', () =>
        SerperAPI.videos(parsedUrl.domain)
      , timeout),

      this.fetchWithTimeout('Serper-Shopping', 'optional', () =>
        SerperAPI.shopping(parsedUrl.domain)
      , timeout),

      this.fetchWithTimeout('SEMrush', 'important', () =>
        SemrushAPI.getKeywords(parsedUrl.domain)
      , timeout),

      this.fetchWithTimeout('YouTube', 'optional', () =>
        YouTubeAPI.getTrendingTopics(parsedUrl.domain)
      , timeout),

      this.fetchWithTimeout('NewsAPI', 'optional', () =>
        NewsAPI.getArticles(parsedUrl.domain)
      , timeout),

      this.fetchWithTimeout('Weather', 'optional', () =>
        WeatherAPI.getForecast(parsedUrl.domain)
      , timeout),

      this.fetchWithTimeout('Google-Maps', 'important', () =>
        this.fetchGoogleMaps(parsedUrl.domain)
      , timeout),

      this.fetchWithTimeout('Reddit', 'important', () =>
        this.fetchReddit(parsedUrl.domain)
      , timeout),
    ]);

    // Process results
    const processedResults = this.processResults(results);

    const totalDuration = Date.now() - startTime;
    const successCount = processedResults.filter(r => r.success).length;

    console.log(`   ✅ Completed: ${successCount}/17 sources in ${totalDuration}ms`);

    // Build aggregated intelligence
    const intelligence: AggregatedIntelligence = {
      url: parsedUrl.normalized,
      parsedUrl,
      results: processedResults,
      successCount,
      totalCount: 17,
      totalDuration,
      isViable: successCount >= this.MIN_SOURCES,
      timestamp: new Date()
    };

    // Verify minimum viable data
    if (!intelligence.isViable) {
      const criticalFailed = processedResults
        .filter(r => r.priority === 'critical' && !r.success)
        .map(r => r.source);

      throw new InsufficientDataError(
        `Only ${successCount} sources succeeded. Need at least ${this.MIN_SOURCES}. Critical failures: ${criticalFailed.join(', ')}`,
        successCount,
        this.MIN_SOURCES
      );
    }

    // Cache the result
    this.setCached(parsedUrl.normalized, intelligence);

    return intelligence;
  }

  /**
   * Fetch data with timeout wrapper
   */
  private async fetchWithTimeout<T>(
    source: string,
    priority: 'critical' | 'important' | 'optional',
    fetcher: () => Promise<T>,
    timeout: number
  ): Promise<IntelligenceResult> {
    const startTime = Date.now();

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout)
      );

      const data = await Promise.race([fetcher(), timeoutPromise]) as T;

      return {
        source,
        priority,
        data,
        success: true,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        source,
        priority,
        data: null,
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Process settled promise results
   */
  private processResults(results: PromiseSettledResult<IntelligenceResult>[]): IntelligenceResult[] {
    return results.map(result => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        // Promise.allSettled should never reject, but handle just in case
        return {
          source: 'unknown',
          priority: 'optional' as const,
          data: null,
          success: false,
          error: result.reason instanceof Error ? result.reason : new Error(String(result.reason)),
          duration: 0
        };
      }
    });
  }

  /**
   * Get cached intelligence if available and not expired
   */
  private getCached(url: string): AggregatedIntelligence | null {
    const cached = this.cache.get(url);
    if (!cached) return null;

    if (Date.now() > cached.expires) {
      this.cache.delete(url);
      return null;
    }

    return cached.data;
  }

  /**
   * Cache intelligence result
   */
  private setCached(url: string, intelligence: AggregatedIntelligence): void {
    this.cache.set(url, {
      data: intelligence,
      expires: Date.now() + this.CACHE_TTL
    });
  }

  /**
   * Clear cache for specific URL or all
   */
  clearCache(url?: string): void {
    if (url) {
      this.cache.delete(url);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Placeholder for Google Maps API
   * TODO: Implement proper Google Maps geocoding
   */
  private async fetchGoogleMaps(domain: string): Promise<any> {
    // Placeholder implementation
    return {
      address: null,
      coordinates: null,
      note: 'Google Maps integration pending'
    };
  }

  /**
   * Placeholder for Reddit API
   * TODO: Will be implemented in TASK 6
   */
  private async fetchReddit(domain: string): Promise<any> {
    // Placeholder implementation
    return {
      opportunities: [],
      communities: [],
      note: 'Reddit integration pending (TASK 6)'
    };
  }

  /**
   * Get results by priority level
   */
  getResultsByPriority(
    intelligence: AggregatedIntelligence,
    priority: 'critical' | 'important' | 'optional'
  ): IntelligenceResult[] {
    return intelligence.results.filter(r => r.priority === priority);
  }

  /**
   * Get successful results only
   */
  getSuccessfulResults(intelligence: AggregatedIntelligence): IntelligenceResult[] {
    return intelligence.results.filter(r => r.success);
  }

  /**
   * Get failed results only
   */
  getFailedResults(intelligence: AggregatedIntelligence): IntelligenceResult[] {
    return intelligence.results.filter(r => !r.success);
  }
}

// Export singleton instance
export const parallelIntelligence = new ParallelIntelligenceService();
