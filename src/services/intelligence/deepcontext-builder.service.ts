/**
 * DeepContext Builder Service
 *
 * The missing orchestration layer that aggregates data from all intelligence APIs
 * and builds the comprehensive DeepContext required for breakthrough content generation.
 *
 * This service:
 * 1. Fetches brand data from Supabase
 * 2. Calls YouTube API for trending topics and psychological triggers
 * 3. Calls OutScraper for Google Reviews and customer sentiment
 * 4. Calls News API (via Serper) for current events and industry trends
 * 5. Calls Weather API for timing-based opportunities
 * 6. Calls Serper for search trends (7 endpoints: News, Trends, Autocomplete, Places, Images, Videos, Shopping)
 * 7. Calls SEMrush for SEO data, keywords, and rankings
 * 8. Calls Website Analyzer (Claude AI) for authentic brand messaging extraction
 * 9. Uses intelligent caching to reduce API costs
 * 10. Implements graceful degradation when APIs fail
 * 11. Returns fully populated DeepContext for ConnectionDiscoveryEngine
 *
 * Created: 2025-11-13
 */

import { supabase } from '@/lib/supabase';
import { YouTubeAPI } from './youtube-api';
import { OutScraperAPI } from './outscraper-api';
import { NewsAPI } from './news-api';
import { WeatherAPI } from './weather-api';
import { SerperAPI } from './serper-api';
import { SemrushAPI } from './semrush-api';
import { websiteAnalyzer } from './website-analyzer.service';
import { redditAPI } from './reddit-api';
import { perplexityAPI } from '@/services/uvp-wizard/perplexity-api';
import { intelligenceCache } from './intelligence-cache.service';
import type { DeepContext } from '@/types/synapse/deepContext.types';
import type {
  DataPoint,
  DataSource,
  DataPointType
} from '@/types/connections.types';

/**
 * DeepContext Builder Configuration
 */
export interface DeepContextBuilderConfig {
  brandId: string;
  brandData?: any; // Optional: Provide brand data directly for demo mode (skip database lookup)
  includeYouTube?: boolean;
  includeOutScraper?: boolean;
  includeNews?: boolean;
  includeWeather?: boolean;
  includeSerper?: boolean;
  includeSemrush?: boolean;
  includeWebsiteAnalysis?: boolean;
  includeReddit?: boolean; // Reddit psychological triggers and customer insights
  includePerplexity?: boolean; // Perplexity local events and real-time insights
  includeLinkedIn?: boolean; // LinkedIn B2B intelligence (posts, companies, jobs)
  cacheResults?: boolean;
  forceFresh?: boolean; // Skip cache and force fresh API calls
}

/**
 * DeepContext Build Result
 */
export interface DeepContextBuildResult {
  context: DeepContext;
  metadata: {
    buildTimeMs: number;
    dataSourcesUsed: string[];
    dataPointsCollected: number;
    errors: Array<{
      source: string;
      error: string;
      severity: 'warning' | 'error';
    }>;
    detailedDataPoints?: DataPoint[];  // Added optional property for detailed provenance
  };
}

/**
 * DeepContext Builder Service
 */
class DeepContextBuilderService {

  /**
   * Build complete DeepContext for a brand
   */
  async buildDeepContext(
    config: DeepContextBuilderConfig
  ): Promise<DeepContextBuildResult> {
    const startTime = Date.now();
    const errors: Array<{ source: string; error: string; severity: 'warning' | 'error' }> = [];
    const dataSourcesUsed: string[] = [];

    console.log('[DeepContext] Building context for brand:', config.brandId);

    // Check cache first (unless forceFresh is true)
    if (config.cacheResults !== false && !config.forceFresh) {
      const cacheKey = `deepcontext:${config.brandId}`;
      const cached = await intelligenceCache.get<DeepContext>(cacheKey);

      if (cached) {
        console.log('[DeepContext] ✅ Returning cached context');
        return {
          context: cached,
          metadata: {
            buildTimeMs: Date.now() - startTime,
            dataSourcesUsed: ['cache'],
            dataPointsCollected: 0,
            errors: []
          }
        };
      }
    }

    try {
      // 1. Load brand data (from config or Supabase)
      console.log('[DeepContext] Step 1/6: Loading brand data...');
      const brandData = config.brandData || await this.loadBrandData(config.brandId);

      if (!brandData) {
        throw new Error(`Brand not found: ${config.brandId}`);
      }

      console.log('[DeepContext] Brand data loaded:', {
        name: brandData.name,
        industry: brandData.industry,
        location: brandData.location
      });

      // 2. Gather intelligence from all sources (parallel execution)
      console.log('[DeepContext] Step 2/10: Gathering intelligence from APIs...');
      const [
        youtubeData,
        outscraperData,
        newsData,
        weatherData,
        serperData,
        semrushData,
        websiteData,
        redditData,
        perplexityData,
        linkedinData
      ] = await Promise.allSettled([
        config.includeYouTube !== false
          ? this.fetchYouTubeIntelligence(brandData, errors, dataSourcesUsed)
          : Promise.resolve(null),
        config.includeOutScraper !== false
          ? this.fetchOutScraperIntelligence(brandData, errors, dataSourcesUsed)
          : Promise.resolve(null),
        config.includeNews !== false
          ? this.fetchNewsIntelligence(brandData, errors, dataSourcesUsed)
          : Promise.resolve(null),
        config.includeWeather !== false
          ? this.fetchWeatherIntelligence(brandData, errors, dataSourcesUsed)
          : Promise.resolve(null),
        config.includeSerper !== false
          ? this.fetchSerperIntelligence(brandData, errors, dataSourcesUsed)
          : Promise.resolve(null),
        config.includeSemrush !== false
          ? this.fetchSemrushIntelligence(brandData, errors, dataSourcesUsed)
          : Promise.resolve(null),
        config.includeWebsiteAnalysis !== false && brandData.website
          ? this.fetchWebsiteIntelligence(brandData, errors, dataSourcesUsed)
          : Promise.resolve(null),
        config.includeReddit !== false
          ? this.fetchRedditIntelligence(brandData, errors, dataSourcesUsed)
          : Promise.resolve(null),
        config.includePerplexity !== false
          ? this.fetchPerplexityIntelligence(brandData, errors, dataSourcesUsed)
          : Promise.resolve(null),
        config.includeLinkedIn !== false
          ? this.fetchLinkedInIntelligence(brandData, errors, dataSourcesUsed)
          : Promise.resolve(null)
      ]);

      // 3. Extract data points from all sources
      console.log('[DeepContext] Step 3/7: Extracting data points...');
      const dataPoints: DataPoint[] = [];

      // Add YouTube data points
      if (youtubeData.status === 'fulfilled' && youtubeData.value) {
        dataPoints.push(...youtubeData.value);
      }

      // Add OutScraper data points
      if (outscraperData.status === 'fulfilled' && outscraperData.value) {
        dataPoints.push(...outscraperData.value);
      }

      // Add News data points
      if (newsData.status === 'fulfilled' && newsData.value) {
        dataPoints.push(...newsData.value);
      }

      // Add Weather data points
      if (weatherData.status === 'fulfilled' && weatherData.value) {
        dataPoints.push(...weatherData.value);
      }

      // Add Serper data points
      if (serperData.status === 'fulfilled' && serperData.value) {
        dataPoints.push(...serperData.value);
      }

      // Add SEMrush data points
      if (semrushData.status === 'fulfilled' && semrushData.value) {
        dataPoints.push(...semrushData.value);
      }

      // Add Website Analysis data points
      if (websiteData.status === 'fulfilled' && websiteData.value) {
        dataPoints.push(...websiteData.value);
      }

      // Add Reddit data points
      if (redditData.status === 'fulfilled' && redditData.value) {
        dataPoints.push(...redditData.value);
      }

      // Add Perplexity data points
      if (perplexityData.status === 'fulfilled' && perplexityData.value) {
        dataPoints.push(...perplexityData.value);
      }

      // Add LinkedIn data points
      if (linkedinData.status === 'fulfilled' && linkedinData.value) {
        dataPoints.push(...linkedinData.value);
      }

      console.log(`[DeepContext] Collected ${dataPoints.length} data points from ${dataSourcesUsed.length} sources`);

      // 4. Build DeepContext structure
      console.log('[DeepContext] Step 4/7: Building context structure...');
      const deepContext = await this.buildContextStructure(brandData, dataPoints);

      // 5. Synthesize insights using AI (if we have enough data)
      console.log('[DeepContext] Step 5/7: Synthesizing insights...');
      if (dataPoints.length > 0) {
        await this.synthesizeInsights(deepContext, dataPoints);
      }

      // 6. Cache the result
      console.log('[DeepContext] Step 6/7: Caching result...');
      if (config.cacheResults !== false) {
        const cacheKey = `deepcontext:${config.brandId}`;
        await intelligenceCache.set(cacheKey, deepContext, {
          dataType: 'deepcontext',
          sourceApi: 'aggregated',
          brandId: config.brandId,
          ttlMinutes: 60 // 1 hour for full DeepContext
        });
      }

      const buildTimeMs = Date.now() - startTime;
      console.log(`[DeepContext] ✅ Context built successfully in ${buildTimeMs}ms`);

      return {
        context: deepContext,
        metadata: {
          buildTimeMs,
          dataSourcesUsed,
          dataPointsCollected: dataPoints.length,
          errors,
          detailedDataPoints: dataPoints  // Include all raw data points for detailed provenance
        }
      };

    } catch (error) {
      console.error('[DeepContext] Fatal error building context:', error);
      throw error;
    }
  }

  /**
   * Load brand data from Supabase
   */
  private async loadBrandData(brandId: string): Promise<any> {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('id', brandId)
      .single();

    if (error) {
      throw new Error(`Failed to load brand: ${error.message}`);
    }

    return data;
  }

  /**
   * Fetch YouTube intelligence (trending topics, psychological triggers)
   */
  private async fetchYouTubeIntelligence(
    brandData: any,
    errors: any[],
    dataSourcesUsed: string[]
  ): Promise<DataPoint[]> {
    try {
      console.log('[DeepContext/YouTube] Fetching trending videos and insights...');

      const keywords = brandData.keywords || [brandData.industry];
      const trends = await YouTubeAPI.analyzeVideoTrends(brandData.industry, keywords);

      dataSourcesUsed.push('youtube');

      // Convert to data points
      const dataPoints: DataPoint[] = [];

      // Trending topics
      trends.trending_topics.forEach((topic, i) => {
        dataPoints.push({
          id: `youtube-topic-${Date.now()}-${i}`,
          source: 'youtube' as DataSource,
          type: 'trending_topic' as DataPointType,
          content: topic,
          metadata: {
            platform: 'youtube',
            rank: i + 1,
            relevance: 0.8
          },
          createdAt: new Date(),
          embedding: undefined
        });
      });

      // Content angles (psychological triggers)
      trends.content_angles.forEach((angle, i) => {
        dataPoints.push({
          id: `youtube-angle-${Date.now()}-${i}`,
          source: 'youtube' as DataSource,
          type: 'customer_trigger' as DataPointType,
          content: angle,
          metadata: {
            platform: 'youtube',
            type: 'content_angle'
          },
          createdAt: new Date(),
          embedding: undefined
        });
      });

      console.log(`[DeepContext/YouTube] ✅ Extracted ${dataPoints.length} data points`);
      return dataPoints;

    } catch (error) {
      console.error('[DeepContext/YouTube] Error:', error);
      errors.push({
        source: 'youtube',
        error: error instanceof Error ? error.message : String(error),
        severity: 'warning'
      });
      return [];
    }
  }

  /**
   * Fetch OutScraper intelligence (Google Reviews, customer sentiment)
   */
  private async fetchOutScraperIntelligence(
    brandData: any,
    errors: any[],
    dataSourcesUsed: string[]
  ): Promise<DataPoint[]> {
    try {
      console.log('[DeepContext/OutScraper] Fetching competitor reviews...');

      // Format location as string for OutScraper API
      const location = brandData.location
        ? typeof brandData.location === 'string'
          ? brandData.location
          : `${brandData.location.city}, ${brandData.location.state}`
        : brandData.city || 'United States';

      const competitors = await OutScraperAPI.discoverCompetitors({
        businessName: brandData.name,
        location,
        industry: brandData.industry,
        radius: 10
      });

      dataSourcesUsed.push('outscraper');

      const dataPoints: DataPoint[] = [];

      // Sample reviews from top 3 competitors
      for (let i = 0; i < Math.min(3, competitors.length); i++) {
        const competitor = competitors[i];

        try {
          const reviews = await OutScraperAPI.scrapeGoogleReviews({
            place_id: competitor.place_id,
            business_name: competitor.name,  // Pass business name for Serper fallback
            location: location,              // Pass location for Serper fallback
            industry: brandData.industry,    // Pass industry for better search specificity
            limit: 20,
            sort: 'newest'
          });

          // Extract psychological triggers from reviews
          reviews.forEach((review, idx) => {
            if (review.text && review.text.length > 20) {
              dataPoints.push({
                id: `outscraper-review-${Date.now()}-${idx}`,
                source: 'outscraper' as DataSource,
                type: 'customer_trigger' as DataPointType,
                content: review.text,
                metadata: {
                  competitor: competitor.name,
                  rating: review.rating,
                  sentiment: review.rating >= 4 ? 'positive' : review.rating <= 2 ? 'negative' : 'neutral'
                },
                createdAt: new Date(review.time),
                embedding: undefined
              });
            }
          });

        } catch (reviewError) {
          console.warn(`[DeepContext/OutScraper] Could not fetch reviews for ${competitor.name}`);
        }
      }

      console.log(`[DeepContext/OutScraper] ✅ Extracted ${dataPoints.length} data points`);
      return dataPoints;

    } catch (error) {
      console.error('[DeepContext/OutScraper] Error:', error);
      errors.push({
        source: 'outscraper',
        error: error instanceof Error ? error.message : String(error),
        severity: 'warning'
      });
      return [];
    }
  }

  /**
   * Fetch News intelligence (industry news, trending stories)
   */
  private async fetchNewsIntelligence(
    brandData: any,
    errors: any[],
    dataSourcesUsed: string[]
  ): Promise<DataPoint[]> {
    try {
      console.log('[DeepContext/News] Fetching industry news...');

      const keywords = brandData.keywords || [brandData.industry];
      const articles = await NewsAPI.getIndustryNews(brandData.industry, keywords);

      dataSourcesUsed.push('news');

      const dataPoints: DataPoint[] = articles.slice(0, 10).map((article, idx) => ({
        id: `news-${Date.now()}-${idx}`,
        source: 'news' as DataSource,
        type: 'trending_topic' as DataPointType,
        content: `${article.title}: ${article.description}`,
        metadata: {
          url: article.url,
          source: article.source,
          publishedAt: article.publishedAt,
          relevanceScore: article.relevanceScore
        },
        createdAt: new Date(article.publishedAt),
        embedding: undefined
      }));

      console.log(`[DeepContext/News] ✅ Extracted ${dataPoints.length} data points`);
      return dataPoints;

    } catch (error) {
      console.error('[DeepContext/News] Error:', error);
      errors.push({
        source: 'news',
        error: error instanceof Error ? error.message : String(error),
        severity: 'warning'
      });
      return [];
    }
  }

  /**
   * Fetch Weather intelligence (timing-based opportunities)
   */
  private async fetchWeatherIntelligence(
    brandData: any,
    errors: any[],
    dataSourcesUsed: string[]
  ): Promise<DataPoint[]> {
    try {
      console.log('[DeepContext/Weather] Fetching weather opportunities...');

      // Format location as string for weather API (just city name)
      const location = brandData.location
        ? typeof brandData.location === 'string'
          ? brandData.location.split(',')[0].trim() // Extract just city name
          : brandData.location.city
        : brandData.city || 'New York';

      const opportunities = await WeatherAPI.detectWeatherOpportunities(
        location,
        brandData.industry
      );

      dataSourcesUsed.push('weather');

      const dataPoints: DataPoint[] = opportunities.map((opp, idx) => ({
        id: `weather-${Date.now()}-${idx}`,
        source: 'weather' as DataSource,
        type: 'timing' as DataPointType,
        content: `${opp.title}: ${opp.description}`,
        metadata: {
          urgency: opp.urgency,
          impactScore: opp.impact_score,
          suggestedActions: opp.suggested_actions,
          type: opp.type
        },
        createdAt: new Date(),
        embedding: undefined
      }));

      console.log(`[DeepContext/Weather] ✅ Extracted ${dataPoints.length} data points`);
      return dataPoints;

    } catch (error) {
      console.error('[DeepContext/Weather] Error:', error);
      errors.push({
        source: 'weather',
        error: error instanceof Error ? error.message : String(error),
        severity: 'warning'
      });
      return [];
    }
  }

  /**
   * Fetch Serper intelligence (7 data sources via one API)
   * Includes: News, Trends, Autocomplete, Places, Images, Videos, Shopping
   */
  private async fetchSerperIntelligence(
    brandData: any,
    errors: any[],
    dataSourcesUsed: string[]
  ): Promise<DataPoint[]> {
    try {
      console.log('[DeepContext/Serper] ⚡ Fetching from 8 Serper endpoints in parallel...');

      const dataPoints: DataPoint[] = [];
      const keywords = brandData.keywords || [brandData.industry];
      const location = brandData.location
        ? typeof brandData.location === 'string'
          ? brandData.location
          : `${brandData.location.city}, ${brandData.location.state}`
        : '';

      // PARALLELIZE all Serper API calls for maximum performance
      const [
        newsResult,
        trendsResult,
        autocompleteResult,
        placesResult,
        videosResult,
        imagesResult
      ] = await Promise.allSettled([
        // 1. News
        (async () => {
          const topic = `${brandData.industry} trends`;
          const cacheKey = intelligenceCache.cacheKeyNews(topic, location);
          let newsResults = await intelligenceCache.get(cacheKey);

          if (!newsResults) {
            newsResults = await SerperAPI.getNews(topic, location || undefined);
            await intelligenceCache.set(cacheKey, newsResults, {
              dataType: 'news',
              sourceApi: 'serper',
              brandId: brandData.id
            });
          }

          return newsResults.slice(0, 5).map((article: any) => ({
            source: 'serper' as DataSource,
            type: 'trending_topic' as DataPointType,
            content: `${article.title}: ${article.snippet}`,
            metadata: {
              url: article.link,
              source: article.source,
              publishedAt: article.date
            },
            timestamp: article.date,
            confidence: 0.85
          }));
        })(),

        // 2. Trends
        (async () => {
          const keyword = keywords[0];
          const cacheKey = intelligenceCache.cacheKeyTrends(keyword);
          let trendData = await intelligenceCache.get(cacheKey);

          if (!trendData) {
            trendData = await SerperAPI.getTrends(keyword);
            await intelligenceCache.set(cacheKey, trendData, {
              dataType: 'trend_data',
              sourceApi: 'serper',
              brandId: brandData.id
            });
          }

          if (!trendData) return [];

          return [{
            id: `serper-trend-${Date.now()}`,
            source: 'serper' as DataSource,
            type: 'trending_topic' as DataPointType,
            content: `Trend: "${keyword}" is ${trendData.trend} (${trendData.growthPercentage}% growth)`,
            metadata: {
              keyword,
              trend: trendData.trend,
              growth: trendData.growthPercentage,
              relatedQueries: trendData.relatedQueries
            },
            createdAt: new Date(),
            embedding: undefined
          }];
        })(),

        // 3. Autocomplete
        (async () => {
          const query = `${brandData.industry} how to`;
          const cacheKey = `serper:autocomplete:${query}`;
          let suggestions = await intelligenceCache.get(cacheKey);

          if (!suggestions) {
            suggestions = await SerperAPI.getAutocomplete(query);
            await intelligenceCache.set(cacheKey, suggestions, {
              dataType: 'autocomplete',
              sourceApi: 'serper',
              brandId: brandData.id
            });
          }

          return suggestions.slice(0, 3).map((suggestion: string) => ({
            source: 'serper' as DataSource,
            type: 'customer_trigger' as DataPointType,
            content: suggestion,
            metadata: {
              type: 'search_intent',
              query
            },
            timestamp: new Date().toISOString(),
            confidence: 0.75
          }));
        })(),

        // 4. Places
        location ? (async () => {
          const cacheKey = intelligenceCache.cacheKeyPlaces(brandData.industry, location);
          let places = await intelligenceCache.get(cacheKey);

          if (!places) {
            places = await SerperAPI.getPlaces(brandData.industry, location);
            await intelligenceCache.set(cacheKey, places, {
              dataType: 'local_reviews',
              sourceApi: 'serper',
              brandId: brandData.id
            });
          }

          return places.slice(0, 3).map((place: any) => ({
            source: 'serper' as DataSource,
            type: 'competitive_gap' as DataPointType,
            content: `Local competitor: ${place.name} (${place.rating}★, ${place.reviewCount} reviews)`,
            metadata: {
              competitor: place.name,
              rating: place.rating,
              reviewCount: place.reviewCount,
              category: place.category
            },
            timestamp: new Date().toISOString(),
            confidence: 0.8
          }));
        })() : Promise.resolve([]),

        // 5. Videos
        (async () => {
          const query = `${brandData.industry} tips`;
          const cacheKey = intelligenceCache.cacheKeyVideos(query);
          let videos = await intelligenceCache.get(cacheKey);

          if (!videos) {
            videos = await SerperAPI.getVideos(query);
            await intelligenceCache.set(cacheKey, videos, {
              dataType: 'youtube_videos',
              sourceApi: 'serper',
              brandId: brandData.id
            });
          }

          return videos.slice(0, 3).map((video: any) => ({
            source: 'serper' as DataSource,
            type: 'trending_topic' as DataPointType,
            content: video.title,
            metadata: {
              url: video.link,
              channel: video.channel,
              duration: video.duration
            },
            timestamp: video.date,
            confidence: 0.7
          }));
        })(),

        // 6. Images
        (async () => {
          const query = `${brandData.industry} inspiration`;
          const cacheKey = `serper:images:${query}`;
          let images = await intelligenceCache.get(cacheKey);

          if (!images) {
            images = await SerperAPI.getImages(query);
            await intelligenceCache.set(cacheKey, images, {
              dataType: 'images',
              sourceApi: 'serper',
              brandId: brandData.id
          });
          }

          return images.slice(0, 3).map((image: any) => ({
            source: 'serper' as DataSource,
            type: 'trending_topic' as DataPointType,
            content: `Visual trend: ${image.title}`,
            metadata: {
              url: image.url,
              imageUrl: image.imageUrl,
              source: image.source
            },
            timestamp: new Date().toISOString(),
            confidence: 0.7
          }));
        })()
      ]);

      // Collect all results
      if (newsResult.status === 'fulfilled' && newsResult.value) {
        dataPoints.push(...newsResult.value);
      }
      if (trendsResult.status === 'fulfilled' && trendsResult.value) {
        dataPoints.push(...trendsResult.value);
      }
      if (autocompleteResult.status === 'fulfilled' && autocompleteResult.value) {
        dataPoints.push(...autocompleteResult.value);
      }
      if (placesResult.status === 'fulfilled' && placesResult.value) {
        dataPoints.push(...placesResult.value);
      }
      if (videosResult.status === 'fulfilled' && videosResult.value) {
        dataPoints.push(...videosResult.value);
      }
      if (imagesResult.status === 'fulfilled' && imagesResult.value) {
        dataPoints.push(...imagesResult.value);
      }

      dataSourcesUsed.push('serper');

      console.log(`[DeepContext/Serper] ✅ Extracted ${dataPoints.length} data points from 6 parallel endpoints`);
      return dataPoints;

    } catch (error) {
      console.error('[DeepContext/Serper] Error:', error);
      errors.push({
        source: 'serper',
        error: error instanceof Error ? error.message : String(error),
        severity: 'warning'
      });
      return [];
    }
  }

  /**
   * Fetch SEMrush SEO and keyword intelligence
   */
  private async fetchSemrushIntelligence(
    brandData: any,
    errors: any[],
    dataSourcesUsed: string[]
  ): Promise<DataPoint[]> {
    try {
      console.log('[DeepContext/SEMrush] Fetching SEO and keyword data...');

      const dataPoints: DataPoint[] = [];
      const domain = brandData.website || brandData.url;

      if (!domain) {
        console.warn('[DeepContext/SEMrush] No domain provided, skipping');
        return [];
      }

      // Get keyword opportunities
      try {
        const opportunities = await SemrushAPI.getKeywordOpportunities(domain, brandData.name);

        opportunities.slice(0, 10).forEach((opp, idx) => {
          dataPoints.push({
            id: `semrush-keyword-${Date.now()}-${idx}`,
            source: 'serper' as DataSource, // Using serper as closest match
            type: 'competitive_gap' as DataPointType,
            content: `Keyword opportunity: "${opp.keyword}" (${opp.searchVolume} searches/mo) - ${opp.reasoning}`,
            metadata: {
              keyword: opp.keyword,
              searchVolume: opp.searchVolume,
              difficulty: opp.difficulty,
              opportunityType: opp.opportunity,
              estimatedTraffic: opp.estimatedTraffic
            },
            createdAt: new Date(),
            embedding: undefined
          });
        });
      } catch (keywordError) {
        console.warn('[DeepContext/SEMrush] Keyword opportunities failed');
      }

      dataSourcesUsed.push('semrush');

      console.log(`[DeepContext/SEMrush] ✅ Extracted ${dataPoints.length} data points`);
      return dataPoints;

    } catch (error) {
      console.error('[DeepContext/SEMrush] Error:', error);
      errors.push({
        source: 'semrush',
        error: error instanceof Error ? error.message : String(error),
        severity: 'warning'
      });
      return [];
    }
  }

  /**
   * Fetch Website Analysis intelligence (Claude AI extraction)
   */
  private async fetchWebsiteIntelligence(
    brandData: any,
    errors: any[],
    dataSourcesUsed: string[]
  ): Promise<DataPoint[]> {
    try {
      console.log('[DeepContext/Website] Analyzing website with Claude AI...');

      const websiteUrl = brandData.website || brandData.url;

      if (!websiteUrl) {
        console.warn('[DeepContext/Website] No website URL provided');
        return [];
      }

      const dataPoints: DataPoint[] = [];

      // Check cache first
      const cacheKey = intelligenceCache.cacheKeyWebsiteAnalysis(websiteUrl);
      let analysis = await intelligenceCache.get(cacheKey);

      if (!analysis) {
        // Fetch fresh analysis
        analysis = await websiteAnalyzer.analyzeWebsite(websiteUrl);

        // Cache for 7 days (website messaging rarely changes)
        await intelligenceCache.set(cacheKey, analysis, {
          dataType: 'website_analysis',
          sourceApi: 'claude',
          brandId: brandData.id
        });
      }

      // Convert analysis to data points
      if (analysis.valuePropositions && analysis.valuePropositions.length > 0) {
        analysis.valuePropositions.forEach((vp: string, idx: number) => {
          dataPoints.push({
            id: `website-vp-${Date.now()}-${idx}`,
            source: 'website' as DataSource,
            type: 'pain_point' as DataPointType, // Changed from value_proposition to valid type
            content: vp,
            metadata: {
              extracted_from: websiteUrl,
              confidence: analysis.confidence,
              domain: 'content_gap' as const
            },
            createdAt: new Date(),
            embedding: undefined
          });
        });
      }

      if (analysis.targetAudience && analysis.targetAudience.length > 0) {
        analysis.targetAudience.forEach((audience: string, idx: number) => {
          dataPoints.push({
            id: `website-audience-${Date.now()}-${idx}`,
            source: 'website' as DataSource,
            type: 'unarticulated_need' as DataPointType, // Changed from customer_segment to valid type
            content: audience,
            metadata: {
              extracted_from: websiteUrl,
              confidence: analysis.confidence,
              domain: 'psychology' as const
            },
            createdAt: new Date(),
            embedding: undefined
          });
        });
      }

      if (analysis.customerProblems && analysis.customerProblems.length > 0) {
        analysis.customerProblems.forEach((problem: string, idx: number) => {
          dataPoints.push({
            id: `website-problem-${Date.now()}-${idx}`,
            source: 'website' as DataSource,
            type: 'customer_trigger' as DataPointType,
            content: `Problem: ${problem}`,
            metadata: {
              type: 'pain_point',
              extracted_from: websiteUrl,
              domain: 'psychology' as const
            },
            createdAt: new Date(),
            embedding: undefined
          });
        });
      }

      if (analysis.differentiators && analysis.differentiators.length > 0) {
        analysis.differentiators.forEach((diff: string, idx: number) => {
          dataPoints.push({
            id: `website-diff-${Date.now()}-${idx}`,
            source: 'website' as DataSource,
            type: 'competitive_gap' as DataPointType,
            content: `Differentiator: ${diff}`,
            metadata: {
              type: 'unique_advantage',
              extracted_from: websiteUrl,
              domain: 'competitive' as const
            },
            createdAt: new Date(),
            embedding: undefined
          });
        });
      }

      dataSourcesUsed.push('website');

      console.log(`[DeepContext/Website] ✅ Extracted ${dataPoints.length} data points (confidence: ${analysis.confidence}%)`);
      return dataPoints;

    } catch (error) {
      console.error('[DeepContext/Website] Error:', error);
      errors.push({
        source: 'website',
        error: error instanceof Error ? error.message : String(error),
        severity: 'warning'
      });
      return [];
    }
  }

  /**
   * Fetch Reddit intelligence (psychological triggers, customer insights)
   */
  private async fetchRedditIntelligence(
    brandData: any,
    errors: any[],
    dataSourcesUsed: string[]
  ): Promise<DataPoint[]> {
    try {
      console.log('[DeepContext/Reddit] Mining Reddit for psychological triggers...');

      const dataPoints: DataPoint[] = [];

      // Find relevant subreddits for this industry
      const subreddits = await redditAPI.findRelevantSubreddits(brandData.industry);
      console.log(`[DeepContext/Reddit] Targeting ${subreddits.length} subreddits:`, subreddits);

      // Mine intelligence from Reddit
      const searchQuery = `${brandData.industry} problems`;
      const intelligence = await redditAPI.mineIntelligence(searchQuery, {
        subreddits,
        limit: 25,
        commentsPerPost: 20,
        sortBy: 'relevance',
        timeFilter: 'month'
      });

      dataSourcesUsed.push('reddit');

      // Convert psychological triggers to data points
      intelligence.triggers.forEach((trigger, idx) => {
        dataPoints.push({
          id: `reddit-trigger-${Date.now()}-${idx}`,
          source: 'reddit' as DataSource,
          type: 'customer_trigger' as DataPointType,
          content: trigger.text,
          metadata: {
            triggerType: trigger.type,
            intensity: trigger.intensity,
            subreddit: trigger.subreddit,
            upvotes: trigger.upvotes,
            url: trigger.url,
            domain: 'psychology' as const
          },
          createdAt: new Date(),
          embedding: undefined
        });
      });

      // Convert customer insights (pain points & desires) to data points
      intelligence.insights.forEach((insight, idx) => {
        if (insight.painPoint) {
          dataPoints.push({
            id: `reddit-pain-${Date.now()}-${idx}`,
            source: 'reddit' as DataSource,
            type: 'customer_trigger' as DataPointType,
            content: `Pain Point: ${insight.painPoint}`,
            metadata: {
              insightType: 'pain_point',
              subreddit: insight.subreddit,
              upvotes: insight.upvotes,
              url: insight.url,
              context: insight.context,
              domain: 'psychology' as const
            },
            createdAt: new Date(),
            embedding: undefined
          });
        }

        if (insight.desire) {
          dataPoints.push({
            id: `reddit-desire-${Date.now()}-${idx}`,
            source: 'reddit' as DataSource,
            type: 'customer_trigger' as DataPointType,
            content: `Customer Desire: ${insight.desire}`,
            metadata: {
              insightType: 'desire',
              subreddit: insight.subreddit,
              upvotes: insight.upvotes,
              url: insight.url,
              context: insight.context,
              domain: 'psychology' as const
            },
            createdAt: new Date(),
            embedding: undefined
          });
        }
      });

      console.log(`[DeepContext/Reddit] ✅ Extracted ${dataPoints.length} data points from ${intelligence.metadata.totalPosts} posts`);
      return dataPoints;

    } catch (error) {
      console.error('[DeepContext/Reddit] Error:', error);
      errors.push({
        source: 'reddit',
        error: error instanceof Error ? error.message : String(error),
        severity: 'warning'
      });
      return [];
    }
  }

  /**
   * 9. Fetch Perplexity Intelligence - Local Events & Real-Time Insights
   */
  private async fetchPerplexityIntelligence(
    brandData: any,
    errors: Array<{ source: string; error: string; severity: 'warning' | 'error' }>,
    dataSourcesUsed: string[]
  ): Promise<DataPoint[]> {
    try {
      console.log('[DeepContext/Perplexity] Fetching local events and real-time insights...');

      // Check if Perplexity API is available
      const isAvailable = await perplexityAPI.isAvailable();
      if (!isAvailable) {
        console.warn('[DeepContext/Perplexity] Perplexity API not available (missing API key)');
        return [];
      }

      // Format location from brandData
      const location = brandData.location
        ? typeof brandData.location === 'string'
          ? brandData.location
          : `${brandData.location.city}, ${brandData.location.state}`
        : brandData.city || 'United States';

      // Get current month for seasonal context
      const now = new Date();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      const currentMonth = monthNames[now.getMonth()];

      // Query Perplexity for local events
      const response = await perplexityAPI.getIndustryInsights({
        query: `What local events, festivals, holidays, and community gatherings are happening in ${location} in ${currentMonth} ${now.getFullYear()} that would be relevant marketing opportunities for ${brandData.industry} businesses? Include specific dates if available.`,
        context: {
          industry: brandData.industry,
          brand_name: brandData.name
        },
        max_results: 5
      });

      dataSourcesUsed.push('perplexity');

      const dataPoints: DataPoint[] = [];

      // Convert insights to data points
      response.insights.forEach((insight, index) => {
        dataPoints.push({
          id: `perplexity-event-${Date.now()}-${index}`,
          source: 'perplexity' as DataSource,
          type: 'local_event' as DataPointType,
          content: insight,
          metadata: {
            location,
            month: currentMonth,
            year: now.getFullYear(),
            confidence: response.confidence,
            domain: 'timing' as const
          },
          createdAt: new Date(),
          embedding: undefined
        });
      });

      console.log(`[DeepContext/Perplexity] ✅ Extracted ${dataPoints.length} local event data points`);
      return dataPoints;

    } catch (error) {
      console.error('[DeepContext/Perplexity] Error:', error);
      errors.push({
        source: 'perplexity',
        error: error instanceof Error ? error.message : String(error),
        severity: 'warning'
      });
      return [];
    }
  }

  /**
   * 10. Fetch LinkedIn Intelligence - B2B Insights, Trends, and Professional Content
   */
  private async fetchLinkedInIntelligence(
    brandData: any,
    errors: Array<{ source: string; error: string; severity: 'warning' | 'error' }>,
    dataSourcesUsed: string[]
  ): Promise<DataPoint[]> {
    try {
      console.log('[DeepContext/LinkedIn] Fetching B2B intelligence via OutScraper...');

      const dataPoints: DataPoint[] = [];
      const industry = brandData.industry;
      const keywords = brandData.keywords || [industry];

      // Parallelize LinkedIn API calls for maximum performance
      const [postsResult, companiesResult] = await Promise.allSettled([
        // 1. LinkedIn Posts (trending B2B topics and thought leadership)
        (async () => {
          try {
            const cacheKey = `linkedin:posts:${industry}`;
            let posts = await intelligenceCache.get(cacheKey);

            if (!posts) {
              // Search for industry-relevant posts
              const query = `${industry} trends insights tips`;
              posts = await OutScraperAPI.getLinkedInPosts(query, 10);

              await intelligenceCache.set(cacheKey, posts, {
                dataType: 'linkedin_posts',
                sourceApi: 'outscraper',
                brandId: brandData.id,
                ttlMinutes: 120 // 2 hours
              });
            }

            return posts.slice(0, 5).map((post: any) => ({
              source: 'linkedin' as DataSource,
              type: 'trending_topic' as DataPointType,
              content: `LinkedIn post by ${post.author}: ${post.content}`,
              metadata: {
                author: post.author,
                authorProfile: post.authorProfile,
                link: post.postUrl,
                date: post.publishedAt,
                engagement: post.engagement
              },
              timestamp: post.publishedAt || new Date().toISOString(),
              confidence: 0.80
            }));
          } catch (err) {
            console.warn('[DeepContext/LinkedIn] Posts fetch failed:', err);
            return [];
          }
        })(),

        // 2. LinkedIn Companies (competitor intelligence)
        (async () => {
          try {
            const cacheKey = `linkedin:companies:${industry}`;
            let companies = await intelligenceCache.get(cacheKey);

            if (!companies) {
              // Search for industry competitors and leaders
              const query = `${industry} companies`;
              companies = await OutScraperAPI.getLinkedInCompanies(query, 10);

              await intelligenceCache.set(cacheKey, companies, {
                dataType: 'linkedin_companies',
                sourceApi: 'outscraper',
                brandId: brandData.id,
                ttlMinutes: 240 // 4 hours
              });
            }

            return companies.slice(0, 3).map((company: any) => ({
              source: 'linkedin' as DataSource,
              type: 'competitive_gap' as DataPointType,
              content: `Competitor: ${company.name} - ${company.description}`,
              metadata: {
                company: company.name,
                link: company.profileUrl,
                industry: company.industry,
                size: company.companySize,
                location: company.location,
                followers: company.followers
              },
              timestamp: new Date().toISOString(),
              confidence: 0.75
            }));
          } catch (err) {
            console.warn('[DeepContext/LinkedIn] Companies fetch failed:', err);
            return [];
          }
        })()
      ]);

      // Collect all results
      if (postsResult.status === 'fulfilled' && postsResult.value) {
        dataPoints.push(...postsResult.value);
      }
      if (companiesResult.status === 'fulfilled' && companiesResult.value) {
        dataPoints.push(...companiesResult.value);
      }

      dataSourcesUsed.push('linkedin');

      console.log(`[DeepContext/LinkedIn] ✅ Extracted ${dataPoints.length} B2B intelligence data points`);
      return dataPoints;

    } catch (error) {
      console.error('[DeepContext/LinkedIn] Error:', error);
      errors.push({
        source: 'linkedin',
        error: error instanceof Error ? error.message : String(error),
        severity: 'warning'
      });
      return [];
    }
  }

  /**
   * Build DeepContext structure from brand data and data points
   */
  private async buildContextStructure(
    brandData: any,
    dataPoints: DataPoint[]
  ): Promise<DeepContext> {
    // Extract website analysis data points
    const valuePropositions = dataPoints.filter(dp => dp.type === 'pain_point' && dp.metadata.type !== 'pain_point');
    const customerSegments = dataPoints.filter(dp => dp.type === 'unarticulated_need');
    const customerTriggers = dataPoints.filter(dp => dp.type === 'customer_trigger');
    const competitiveGaps = dataPoints.filter(dp => dp.type === 'competitive_gap');

    console.log('[DeepContext] Organizing data points:');
    console.log('  - Value Propositions:', valuePropositions.length);
    console.log('  - Customer Segments:', customerSegments.length);
    console.log('  - Customer Triggers:', customerTriggers.length);
    console.log('  - Competitive Gaps:', competitiveGaps.length);

    // Build basic structure - will be enhanced by AI synthesis
    const deepContext: DeepContext = {
      business: {
        profile: {
          id: brandData.id,
          name: brandData.name,
          industry: brandData.industry,
          naicsCode: brandData.naics_code,
          website: brandData.website || '',
          location: {
            city: brandData.city || '',
            state: brandData.state || '',
            country: brandData.country || 'US'
          },
          keywords: brandData.keywords || [brandData.industry],
          competitors: []
        },
        brandVoice: {
          tone: brandData.tone || ['professional', 'friendly'],
          values: brandData.values || [],
          personality: brandData.personality || [],
          avoidWords: [],
          signaturePhrases: []
        },
        // CRITICAL: Populate with actual website value propositions!
        uniqueAdvantages: [
          ...(brandData.unique_selling_points || []),
          ...valuePropositions.map(dp => dp.content)
        ],
        goals: []
      },
      industry: {
        profile: null,
        trends: [],
        seasonality: [],
        competitiveLandscape: {
          topCompetitors: [],
          marketConcentration: 'moderate' as const,
          barrierToEntry: 'medium' as const
        },
        economicFactors: []
      },
      realTimeCultural: {
        trending: {
          topics: dataPoints
            .filter(dp => dp.type === 'trending_topic')
            .slice(0, 10)
            .map(dp => dp.content),
          hashtags: [],
          conversations: []
        },
        sentiment: {
          overall: 0.7,
          byTopic: {},
          shifts: []
        },
        // CRITICAL: Populate with Perplexity local events!
        events: dataPoints
          .filter(dp => dp.type === 'local_event')
          .map(dp => dp.content),
        viralContent: []
      },
      competitiveIntel: {
        blindSpots: [],
        mistakes: [],
        // CRITICAL: Populate with website differentiators!
        opportunities: competitiveGaps.map(dp => ({
          gap: dp.content,
          marketSize: 'medium' as const,
          defensibility: 'medium' as const,
          difficulty: 'medium' as const,
          positioning: 'Leverage unique differentiators'
        })),
        contentGaps: [],
        positioningWeaknesses: []
      },
      customerPsychology: {
        // CRITICAL: Populate with customer segments!
        unarticulated: customerSegments.map(dp => ({
          need: dp.content,
          confidence: 0.7,
          evidence: [],
          approach: 'Address through targeted messaging',
          emotionalDriver: 'Unknown'
        })),
        emotional: [],
        // CRITICAL: Populate with customer triggers (pain points)!
        behavioral: customerTriggers.map(dp => ({
          behavior: dp.content,
          frequency: 'common' as const,
          insight: 'Customer trigger identified',
          contentAlignment: 'Create content addressing this trigger'
        })),
        identityDesires: [],
        purchaseMotivations: [],
        objections: []
      },
      synthesis: {
        keyInsights: [],
        hiddenPatterns: [],
        opportunityScore: 75,
        recommendedAngles: [],
        confidenceLevel: 0.7,
        generatedAt: new Date()
      },
      metadata: {
        aggregatedAt: new Date(),
        dataSourcesUsed: Array.from(new Set(dataPoints.map(dp => dp.source))),
        processingTimeMs: 0,
        version: '1.0.0'
      }
    };

    return deepContext;
  }

  /**
   * Synthesize insights using AI (placeholder for now)
   */
  private async synthesizeInsights(
    deepContext: DeepContext,
    dataPoints: DataPoint[]
  ): Promise<void> {
    // Extract key insights from data points
    const customerTriggers = dataPoints.filter(dp => dp.type === 'customer_trigger');
    const trendingTopics = dataPoints.filter(dp => dp.type === 'trending_topic');
    const timingSignals = dataPoints.filter(dp => dp.type === 'timing');

    // Basic synthesis (can be enhanced with OpenAI later)
    deepContext.synthesis.keyInsights = [
      `Found ${customerTriggers.length} customer psychological triggers`,
      `Identified ${trendingTopics.length} trending topics`,
      `Detected ${timingSignals.length} timing-based opportunities`,
      `Total data points: ${dataPoints.length} from ${deepContext.metadata.dataSourcesUsed.length} sources`
    ];

    deepContext.synthesis.opportunityScore = Math.min(
      100,
      50 + (dataPoints.length * 2)
    );

    deepContext.synthesis.confidenceLevel = Math.min(
      1,
      0.5 + (dataPoints.length / 100)
    );
  }

  /**
   * Clear cache for a brand (delegates to intelligenceCache)
   */
  async clearCache(brandId?: string): Promise<void> {
    if (brandId) {
      await intelligenceCache.invalidateByBrand(brandId);
    } else {
      // Clear all DeepContext caches
      await intelligenceCache.invalidateByType('deepcontext');
    }
  }

  /**
   * Get cache stats (delegates to intelligenceCache)
   */
  async getCacheStats(): Promise<any> {
    return await intelligenceCache.getStats();
  }
}

export const deepContextBuilder = new DeepContextBuilderService();
