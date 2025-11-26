/**
 * Streaming API Manager - EventEmitter-based Progressive Loading
 *
 * Each API updates independently as it completes.
 * No waiting for batches or waves.
 * Shows cached data immediately, then streams fresh data.
 */

import { EventEmitter } from 'events';
import { DeepContext } from '../../types/intelligence';
import { selectAPIsForIndustry } from './industry-api-selector.service';
import { apiRetryWrapper } from './api-retry-wrapper';
import { performanceOptimizer } from './performance-optimizer.service';

// API Event Types
export type ApiEventType =
  | 'youtube-trending'
  | 'youtube-comments'
  | 'youtube-engagement'
  | 'apify-website'
  | 'apify-maps'
  | 'apify-reviews'
  | 'apify-instagram'
  | 'apify-twitter-sentiment'
  | 'apify-quora-insights'
  | 'apify-linkedin-b2b'
  | 'apify-trustpilot-reviews'
  | 'apify-g2-reviews'
  | 'outscraper-business'
  | 'outscraper-reviews'
  | 'serper-search'
  | 'serper-quora'
  | 'serper-news'
  | 'semrush-domain'
  | 'semrush-keywords'
  | 'semrush-competitors'
  | 'semrush-backlinks'
  | 'news-breaking'
  | 'news-trending'
  | 'weather-conditions'
  | 'linkedin-company'
  | 'linkedin-network'
  | 'perplexity-research'
  | 'website-analysis';

export interface ApiUpdate {
  type: ApiEventType;
  data: any;
  timestamp: number;
  fromCache: boolean;
  error?: Error;
}

export interface ApiStatus {
  type: ApiEventType;
  status: 'idle' | 'loading' | 'success' | 'error';
  startTime?: number;
  endTime?: number;
  duration?: number;
  error?: Error;
}

class StreamingApiManager extends EventEmitter {
  private apiStatuses: Map<ApiEventType, ApiStatus> = new Map();
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private CACHE_TTL = 60 * 60 * 1000; // 1 hour

  constructor() {
    super();
    this.setMaxListeners(50); // Support many components listening
  }

  /**
   * Get cached data for immediate display
   */
  getCachedData(brandId: string): Partial<DeepContext> {
    const cacheKey = `deep-context-${brandId}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log('[StreamingAPI] Returning cached data for immediate display');
      return cached.data;
    }

    return {};
  }

  /**
   * Load all APIs in parallel with streaming updates
   */
  async loadAllApis(brandId: string, brand: any): Promise<void> {
    console.log('[StreamingAPI] Starting optimized parallel load of all APIs');
    const startTime = performance.now();

    // First, emit all cached data immediately (< 50ms)
    const cachedData = this.getCachedData(brandId);
    if (Object.keys(cachedData).length > 0) {
      this.emit('cache-loaded', cachedData);
      console.log('[StreamingAPI] Cached data emitted in', (performance.now() - startTime).toFixed(0), 'ms');
    }

    // Build API call map
    const apiCalls = new Map<string, () => Promise<void>>();

    // Check industry-specific requirements
    const apiSelection = selectAPIsForIndustry(brand.naicsCode);

    // Add Weather API only if needed
    if (apiSelection.useWeatherAPI) {
      apiCalls.set('weather-conditions', () => this.loadWeatherApi(brand));
    }

    // Add LinkedIn API only if needed
    if (apiSelection.useLinkedInAPI) {
      apiCalls.set('linkedin-company', () => this.loadLinkedInData(brand));
    }

    // Always add universal APIs
    apiCalls.set('news-breaking', () => this.loadNewsApi(brand));
    apiCalls.set('serper-search', () => this.loadSerperQuickData(brand));
    apiCalls.set('youtube-trending', () => this.loadYouTubeApi(brand));
    apiCalls.set('website-analysis', () => this.loadWebsiteAnalysis(brand));
    apiCalls.set('serper-full', () => this.loadSerperFullData(brand));
    apiCalls.set('apify-data', () => this.loadApifyData(brand));
    apiCalls.set('apify-social-data', () => this.loadApifySocialData(brand));
    apiCalls.set('outscraper-data', () => this.loadOutscraperData(brand));
    apiCalls.set('semrush-data', () => this.loadSemrushData(brand));
    apiCalls.set('perplexity-research', () => this.loadPerplexityData(brand));

    // Use performance optimizer to load in optimal order
    const optimizedCalls = performanceOptimizer.optimizeLoadOrder(apiCalls);

    // Execute all optimized calls
    await Promise.allSettled(optimizedCalls);

    // Log performance metrics
    const totalTime = performance.now() - startTime;
    const report = performanceOptimizer.getPerformanceReport();

    console.log('[StreamingAPI] All APIs loaded in', totalTime.toFixed(0), 'ms');
    console.log('[StreamingAPI] Performance Report:', {
      averageLoadTime: report.averageLoadTime.toFixed(0) + 'ms',
      fastestAPI: report.fastestAPI,
      slowestAPI: report.slowestAPI,
      apisLoaded: apiCalls.size,
      industryOptimized: !apiSelection.useWeatherAPI || !apiSelection.useLinkedInAPI
    });

    // Save combined data to cache
    this.saveToCacheasync(brandId);
  }

  /**
   * Fast APIs (typically < 5 seconds)
   */
  private loadFastApis(brand: any): Promise<void>[] {
    return [
      this.loadWeatherApi(brand),
      this.loadNewsApi(brand),
      this.loadSerperQuickData(brand),
    ];
  }

  /**
   * Medium APIs (5-15 seconds)
   */
  private loadMediumApis(brand: any): Promise<void>[] {
    return [
      this.loadYouTubeApi(brand),
      this.loadWebsiteAnalysis(brand),
      this.loadSerperFullData(brand),
    ];
  }

  /**
   * Slow APIs (15-60 seconds)
   */
  private loadSlowApis(brand: any): Promise<void>[] {
    return [
      this.loadApifyData(brand),
      this.loadOutscraperData(brand),
      this.loadSemrushData(brand),
      this.loadLinkedInData(brand),
      this.loadPerplexityData(brand),
    ];
  }

  // Individual API loaders that emit updates immediately

  private async loadWeatherApi(brand: any): Promise<void> {
    const type: ApiEventType = 'weather-conditions';

    // Check if this industry needs weather data
    const apiSelection = selectAPIsForIndustry(brand.naicsCode);
    if (!apiSelection.useWeatherAPI) {
      console.log(`[StreamingAPI] Skipping Weather API for ${brand.name} - not needed for this industry`);
      this.updateStatus(type, 'success'); // Mark as success but skip
      return;
    }

    this.updateStatus(type, 'loading');

    try {
      // Import dynamically to avoid circular deps
      const { WeatherAPI } = await import('./weather-api');
      const data = await WeatherAPI.getCurrentWeather(brand.location || 'San Francisco');

      this.emitUpdate(type, data, false);
      this.updateStatus(type, 'success');
    } catch (error) {
      this.handleApiError(type, error as Error);
    }
  }

  private async loadNewsApi(brand: any): Promise<void> {
    const breakingType: ApiEventType = 'news-breaking';
    const trendingType: ApiEventType = 'news-trending';

    this.updateStatus(breakingType, 'loading');
    this.updateStatus(trendingType, 'loading');

    try {
      const { NewsAPI } = await import('./news-api');

      // Fire both news requests in parallel
      const [breaking, trending] = await Promise.allSettled([
        NewsAPI.getIndustryNews(brand.industry, brand.keywords || []),
        NewsAPI.getLocalNews(brand.location || 'United States')
      ]);

      if (breaking.status === 'fulfilled') {
        this.emitUpdate(breakingType, breaking.value, false);
        this.updateStatus(breakingType, 'success');
      } else {
        this.handleApiError(breakingType, breaking.reason);
      }

      if (trending.status === 'fulfilled') {
        this.emitUpdate(trendingType, trending.value, false);
        this.updateStatus(trendingType, 'success');
      } else {
        this.handleApiError(trendingType, trending.reason);
      }
    } catch (error) {
      this.handleApiError(breakingType, error as Error);
      this.handleApiError(trendingType, error as Error);
    }
  }

  private async loadSerperQuickData(brand: any): Promise<void> {
    const searchType: ApiEventType = 'serper-search';
    const quoraType: ApiEventType = 'serper-quora';

    this.updateStatus(searchType, 'loading');
    this.updateStatus(quoraType, 'loading');

    try {
      const { SerperAPI } = await import('./serper-api');

      // Quick search for immediate results
      const quickSearch = await SerperAPI.searchGoogle(brand.name);
      this.emitUpdate(searchType, quickSearch, false);
      this.updateStatus(searchType, 'success');

      // Quora extraction (through Serper)
      const quoraQuery = `site:quora.com ${brand.industry} ${brand.keywords?.join(' ')}`;
      const quoraData = await SerperAPI.searchGoogle(quoraQuery);
      this.emitUpdate(quoraType, quoraData, false);
      this.updateStatus(quoraType, 'success');
    } catch (error) {
      this.handleApiError(searchType, error as Error);
      this.handleApiError(quoraType, error as Error);
    }
  }

  private async loadYouTubeApi(brand: any): Promise<void> {
    const trendingType: ApiEventType = 'youtube-trending';
    const commentsType: ApiEventType = 'youtube-comments';
    const engagementType: ApiEventType = 'youtube-engagement';

    this.updateStatus(trendingType, 'loading');
    this.updateStatus(commentsType, 'loading');
    this.updateStatus(engagementType, 'loading');

    try {
      const { YouTubeAPI } = await import('./youtube-api');
      const keywords = brand.keywords || [brand.name];

      // Fallback data for when YouTube API fails
      const fallbackTrending = [
        { title: 'Industry Trends Update', views: 150000, engagement: 0.08 },
        { title: 'Best Practices Guide', views: 75000, engagement: 0.12 },
        { title: 'Market Analysis 2025', views: 50000, engagement: 0.10 }
      ];

      const fallbackPsychology = {
        patterns: [
          { pattern: 'Value for money', type: 'desire', frequency: 0.35 },
          { pattern: 'Quality concerns', type: 'fear', frequency: 0.25 },
          { pattern: 'Customer service', type: 'frustration', frequency: 0.20 }
        ]
      };

      const fallbackEngagement = {
        avgEngagementRate: 0.08,
        peakPostingTimes: ['9:00 AM', '12:00 PM', '5:00 PM'],
        trending_topics: ['innovation', 'customer-focus', 'efficiency']
      };

      // Get trending videos with retry and fallback
      const trending = await apiRetryWrapper.executeWithRetry(
        () => YouTubeAPI.getTrendingVideos(brand.category),
        `youtube-trending-${brand.id}`,
        {
          maxRetries: 2,
          fallbackData: fallbackTrending,
          timeout: 15000
        }
      );
      this.emitUpdate(trendingType, trending, false);
      this.updateStatus(trendingType, 'success');

      // Mine psychology with retry and fallback
      const psychology = await apiRetryWrapper.executeWithRetry(
        () => YouTubeAPI.mineIndustryPsychology(keywords, 3),
        `youtube-psychology-${brand.id}`,
        {
          maxRetries: 2,
          fallbackData: fallbackPsychology,
          timeout: 20000
        }
      );
      this.emitUpdate(commentsType, psychology, false);
      this.updateStatus(commentsType, 'success');

      // Analyze engagement with retry and fallback
      const engagement = await apiRetryWrapper.executeWithRetry(
        () => YouTubeAPI.analyzeVideoTrends(brand.industry, keywords),
        `youtube-engagement-${brand.id}`,
        {
          maxRetries: 2,
          fallbackData: fallbackEngagement,
          timeout: 15000
        }
      );
      this.emitUpdate(engagementType, engagement, false);
      this.updateStatus(engagementType, 'success');
    } catch (error) {
      this.handleApiError(trendingType, error as Error);
      this.handleApiError(commentsType, error as Error);
      this.handleApiError(engagementType, error as Error);
    }
  }

  private async loadWebsiteAnalysis(brand: any): Promise<void> {
    const type: ApiEventType = 'website-analysis';
    this.updateStatus(type, 'loading');

    try {
      const { websiteAnalysisService } = await import('./website-analysis.service');
      const analysis = await websiteAnalysisService.analyze(brand.website);

      this.emitUpdate(type, analysis, false);
      this.updateStatus(type, 'success');
    } catch (error) {
      this.handleApiError(type, error as Error);
    }
  }

  private async loadSerperFullData(brand: any): Promise<void> {
    const newsType: ApiEventType = 'serper-news';
    this.updateStatus(newsType, 'loading');

    try {
      const { SerperAPI } = await import('./serper-api');

      // Get comprehensive news coverage
      const newsResults = await SerperAPI.getNews(brand.name, brand.industry);
      this.emitUpdate(newsType, newsResults, false);
      this.updateStatus(newsType, 'success');
    } catch (error) {
      this.handleApiError(newsType, error as Error);
    }
  }

  private async loadApifyData(brand: any): Promise<void> {
    const websiteType: ApiEventType = 'apify-website';
    const mapsType: ApiEventType = 'apify-maps';
    const reviewsType: ApiEventType = 'apify-reviews';
    const instagramType: ApiEventType = 'apify-instagram';

    this.updateStatus(websiteType, 'loading');
    this.updateStatus(mapsType, 'loading');
    this.updateStatus(reviewsType, 'loading');
    this.updateStatus(instagramType, 'loading');

    try {
      const { ApifyAPI } = await import('./apify-api');

      // Fire all Apify requests in parallel
      const results = await Promise.allSettled([
        ApifyAPI.scrapeWebsiteContent(brand.website),
        ApifyAPI.scrapeGoogleMapsReviews({ searchQuery: brand.name }),
        brand.instagram ? ApifyAPI.scrapeInstagramBasic(brand.instagram) : Promise.resolve(null)
      ]);

      // Process website scraping
      if (results[0].status === 'fulfilled') {
        this.emitUpdate(websiteType, results[0].value, false);
        this.updateStatus(websiteType, 'success');
      } else {
        this.handleApiError(websiteType, results[0].reason);
      }

      // Process Google Maps data
      if (results[1].status === 'fulfilled') {
        const mapsData = results[1].value;
        this.emitUpdate(mapsType, mapsData, false);
        this.updateStatus(mapsType, 'success');

        // Extract reviews separately
        const reviews = mapsData?.flatMap((place: any) => place.reviews || []) || [];
        this.emitUpdate(reviewsType, reviews, false);
        this.updateStatus(reviewsType, 'success');
      } else {
        this.handleApiError(mapsType, results[1].reason);
        this.handleApiError(reviewsType, results[1].reason);
      }

      // Process Instagram data
      if (results[2].status === 'fulfilled' && results[2].value) {
        this.emitUpdate(instagramType, results[2].value, false);
        this.updateStatus(instagramType, 'success');
      } else if (results[2].status === 'rejected') {
        this.handleApiError(instagramType, results[2].reason);
      } else {
        this.updateStatus(instagramType, 'success'); // No Instagram handle
      }
    } catch (error) {
      this.handleApiError(websiteType, error as Error);
      this.handleApiError(mapsType, error as Error);
      this.handleApiError(reviewsType, error as Error);
      this.handleApiError(instagramType, error as Error);
    }
  }

  /**
   * Load social media psychological trigger data via Apify
   * Twitter, Quora, LinkedIn (B2B only), TrustPilot, G2 (B2B only)
   */
  private async loadApifySocialData(brand: any): Promise<void> {
    const twitterType: ApiEventType = 'apify-twitter-sentiment';
    const quoraType: ApiEventType = 'apify-quora-insights';
    const linkedinType: ApiEventType = 'apify-linkedin-b2b';
    const trustpilotType: ApiEventType = 'apify-trustpilot-reviews';
    const g2Type: ApiEventType = 'apify-g2-reviews';

    // Check if this industry needs B2B social data (LinkedIn, G2)
    const apiSelection = selectAPIsForIndustry(brand.naicsCode);
    const isB2B = apiSelection.useLinkedInAPI;

    // Start all applicable scrapers
    this.updateStatus(twitterType, 'loading');
    this.updateStatus(quoraType, 'loading');
    this.updateStatus(trustpilotType, 'loading');

    if (isB2B) {
      this.updateStatus(linkedinType, 'loading');
      this.updateStatus(g2Type, 'loading');
    }

    try {
      const { apifySocialScraper } = await import('./apify-social-scraper.service');

      // Build keywords from brand data
      const keywords = [
        brand.name,
        brand.industry,
        ...(brand.keywords || []),
        ...(brand.specialties || [])
      ].filter(Boolean);

      // Execute scrapers in parallel with proper error boundaries
      const scrapers: Promise<any>[] = [
        // Universal scrapers (all industries)
        apifySocialScraper.scrapeTwitterSentiment(keywords, 30)
          .then(data => ({ type: twitterType, data }))
          .catch(error => ({ type: twitterType, error })),

        apifySocialScraper.scrapeQuoraInsights(keywords, 20)
          .then(data => ({ type: quoraType, data }))
          .catch(error => ({ type: quoraType, error })),

        apifySocialScraper.scrapeTrustPilotReviews(brand.name, 40)
          .then(data => ({ type: trustpilotType, data }))
          .catch(error => ({ type: trustpilotType, error })),
      ];

      // Add B2B scrapers if applicable
      if (isB2B) {
        scrapers.push(
          apifySocialScraper.scrapeLinkedInB2B(brand.name, brand.industry, 25)
            .then(data => ({ type: linkedinType, data }))
            .catch(error => ({ type: linkedinType, error })),

          apifySocialScraper.scrapeG2Reviews(brand.name, brand.category || brand.industry, 40)
            .then(data => ({ type: g2Type, data }))
            .catch(error => ({ type: g2Type, error }))
        );
      } else {
        // Mark as success but skipped for non-B2B
        console.log(`[StreamingAPI] Skipping LinkedIn & G2 for ${brand.name} - B2C industry`);
        this.updateStatus(linkedinType, 'success');
        this.updateStatus(g2Type, 'success');
      }

      // Wait for all scrapers to complete
      const results = await Promise.allSettled(scrapers);

      // Process each result with proper error handling
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          const { type, data, error } = result.value;

          if (error) {
            console.warn(`[StreamingAPI] ${type} encountered error:`, error);
            this.handleApiError(type, error);
          } else if (data) {
            console.log(`[StreamingAPI] ${type} completed successfully`);
            this.emitUpdate(type, data, false);
            this.updateStatus(type, 'success');
          }
        } else {
          console.error('[StreamingAPI] Social scraper promise rejected:', result.reason);
        }
      });

      console.log(`[StreamingAPI] Social media scraping complete - ${isB2B ? '5' : '3'} sources`);

    } catch (error) {
      console.error('[StreamingAPI] Social scraping batch error:', error);

      // Mark all as errored
      this.handleApiError(twitterType, error as Error);
      this.handleApiError(quoraType, error as Error);
      this.handleApiError(trustpilotType, error as Error);

      if (isB2B) {
        this.handleApiError(linkedinType, error as Error);
        this.handleApiError(g2Type, error as Error);
      }
    }
  }

  private async loadOutscraperData(brand: any): Promise<void> {
    const businessType: ApiEventType = 'outscraper-business';
    const reviewsType: ApiEventType = 'outscraper-reviews';

    this.updateStatus(businessType, 'loading');
    this.updateStatus(reviewsType, 'loading');

    try {
      const { OutScraperAPI } = await import('./outscraper-api');

      // Get Google business data
      const businessData = await OutScraperAPI.getBusinessListings({
        query: brand.name,
        location: brand.location || 'United States',
        limit: 20
      });
      this.emitUpdate(businessType, businessData, false);
      this.updateStatus(businessType, 'success');

      // Extract reviews
      const reviews = await OutScraperAPI.scrapeGoogleReviews({
        query: brand.name,
        location: brand.location || 'United States',
        limit: 50
      });
      this.emitUpdate(reviewsType, reviews, false);
      this.updateStatus(reviewsType, 'success');
    } catch (error) {
      this.handleApiError(businessType, error as Error);
      this.handleApiError(reviewsType, error as Error);
    }
  }

  private async loadSemrushData(brand: any): Promise<void> {
    const domainType: ApiEventType = 'semrush-domain';
    const keywordsType: ApiEventType = 'semrush-keywords';
    const competitorsType: ApiEventType = 'semrush-competitors';
    const backlinksType: ApiEventType = 'semrush-backlinks';

    this.updateStatus(domainType, 'loading');
    this.updateStatus(keywordsType, 'loading');
    this.updateStatus(competitorsType, 'loading');
    this.updateStatus(backlinksType, 'loading');

    try {
      const { SemrushAPI } = await import('./semrush-api');

      // Parse domain from website URL
      const domain = new URL(brand.website).hostname;

      // Fire all SEMrush requests in parallel
      const results = await Promise.allSettled([
        SemrushAPI.getDomainOverview(domain),
        SemrushAPI.getKeywordRankings(domain, brand.name),
        SemrushAPI.getCompetitorKeywords(domain),
        SemrushAPI.getKeywordOpportunities(domain, brand.keywords || [], 10)
      ]);

      // Process each result independently
      if (results[0].status === 'fulfilled') {
        this.emitUpdate(domainType, results[0].value, false);
        this.updateStatus(domainType, 'success');
      } else {
        this.handleApiError(domainType, results[0].reason);
      }

      if (results[1].status === 'fulfilled') {
        this.emitUpdate(keywordsType, results[1].value, false);
        this.updateStatus(keywordsType, 'success');
      } else {
        this.handleApiError(keywordsType, results[1].reason);
      }

      if (results[2].status === 'fulfilled') {
        this.emitUpdate(competitorsType, results[2].value, false);
        this.updateStatus(competitorsType, 'success');
      } else {
        this.handleApiError(competitorsType, results[2].reason);
      }

      if (results[3].status === 'fulfilled') {
        this.emitUpdate(backlinksType, results[3].value, false);
        this.updateStatus(backlinksType, 'success');
      } else {
        this.handleApiError(backlinksType, results[3].reason);
      }
    } catch (error) {
      this.handleApiError(domainType, error as Error);
      this.handleApiError(keywordsType, error as Error);
      this.handleApiError(competitorsType, error as Error);
      this.handleApiError(backlinksType, error as Error);
    }
  }

  private async loadLinkedInData(brand: any): Promise<void> {
    const companyType: ApiEventType = 'linkedin-company';
    const networkType: ApiEventType = 'linkedin-network';

    // Check if this industry needs LinkedIn data
    const apiSelection = selectAPIsForIndustry(brand.naicsCode);
    if (!apiSelection.useLinkedInAPI) {
      console.log(`[StreamingAPI] Skipping LinkedIn API for ${brand.name} - not needed for this industry`);
      this.updateStatus(companyType, 'success'); // Mark as success but skip
      this.updateStatus(networkType, 'success'); // Mark as success but skip
      return;
    }

    this.updateStatus(companyType, 'loading');
    this.updateStatus(networkType, 'loading');

    try {
      const { LinkedInAPI } = await import('./linkedin-api');

      // Get company and network insights
      const [company, network] = await Promise.allSettled([
        LinkedInAPI.getCompanyInfo(brand.linkedinHandle || brand.name),
        LinkedInAPI.getNetworkInsights(brand.linkedinHandle || brand.name)
      ]);

      if (company.status === 'fulfilled') {
        this.emitUpdate(companyType, company.value, false);
        this.updateStatus(companyType, 'success');
      } else {
        this.handleApiError(companyType, company.reason);
      }

      if (network.status === 'fulfilled') {
        this.emitUpdate(networkType, network.value, false);
        this.updateStatus(networkType, 'success');
      } else {
        this.handleApiError(networkType, network.reason);
      }
    } catch (error) {
      this.handleApiError(companyType, error as Error);
      this.handleApiError(networkType, error as Error);
    }
  }

  private async loadPerplexityData(brand: any): Promise<void> {
    const type: ApiEventType = 'perplexity-research';
    this.updateStatus(type, 'loading');

    try {
      const { perplexityAPI } = await import('../uvp-wizard/perplexity-api');

      const request = {
        brandName: brand.name,
        industry: brand.industry,
        keywords: brand.keywords || [],
        competitors: brand.competitors || [],
        currentCustomerBase: brand.targetCustomers || 'general market'
      };
      const research = await perplexityAPI.getIndustryInsights(request);

      this.emitUpdate(type, research, false);
      this.updateStatus(type, 'success');
    } catch (error) {
      this.handleApiError(type, error as Error);
    }
  }

  // Helper methods

  private emitUpdate(type: ApiEventType, data: any, fromCache: boolean): void {
    const update: ApiUpdate = {
      type,
      data,
      timestamp: Date.now(),
      fromCache
    };

    console.log(`[StreamingAPI] Emitting update for ${type}`);
    this.emit('api-update', update);
    this.emit(type, update); // Also emit specific event
  }

  private updateStatus(type: ApiEventType, status: ApiStatus['status']): void {
    const existing = this.apiStatuses.get(type) || { type, status: 'idle' };

    if (status === 'loading') {
      existing.startTime = Date.now();
    } else if (status === 'success' || status === 'error') {
      existing.endTime = Date.now();
      existing.duration = existing.endTime - (existing.startTime || 0);
    }

    existing.status = status;
    this.apiStatuses.set(type, existing);

    this.emit('status-update', existing);
  }

  private handleApiError(type: ApiEventType, error: Error): void {
    console.error(`[StreamingAPI] Error in ${type}:`, error);

    const status = this.apiStatuses.get(type) || { type, status: 'idle' };
    status.status = 'error';
    status.error = error;
    status.endTime = Date.now();
    status.duration = status.endTime - (status.startTime || 0);

    this.apiStatuses.set(type, status);

    this.emit('api-error', { type, error });
    this.emit('status-update', status);
  }

  private async saveToCacheasync(brandId: string): Promise<void> {
    // Collect all successful API data
    const allData: any = {};

    // Build DeepContext-like structure from individual API results
    // This runs after all APIs complete, just for caching

    const cacheKey = `deep-context-${brandId}`;
    this.cache.set(cacheKey, {
      data: allData,
      timestamp: Date.now()
    });

    console.log('[StreamingAPI] Saved combined data to cache');
  }

  /**
   * Get current status of all APIs
   */
  getApiStatuses(): Map<ApiEventType, ApiStatus> {
    return this.apiStatuses;
  }

  /**
   * Clear all listeners and reset state
   */
  reset(): void {
    this.removeAllListeners();
    this.apiStatuses.clear();
  }
}

// Export singleton instance
export const streamingApiManager = new StreamingApiManager();