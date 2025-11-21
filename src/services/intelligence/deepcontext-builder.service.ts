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
import { WeatherAPI } from './weather-api';
import { SerperAPI } from './serper-api';
import { SemrushAPI } from './semrush-api';
import { websiteAnalyzer } from './website-analyzer.service';
import { redditAPI } from './reddit-api';
import { whisperAPI } from './whisper-api';
import { perplexityAPI } from '@/services/uvp-wizard/perplexity-api';
import { ApifyAPI } from './apify-api';
import { intelligenceCache } from './intelligence-cache.service';
import { insightSynthesis } from './insight-synthesis.service';
import { psychologicalExtractor, type PsychologicalProfile } from './psychological-pattern-extractor.service';
import { orchestrationService } from './orchestration.service';
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
  includeApify?: boolean; // Apify website scraping for services, testimonials, content
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
        linkedinData,
        whisperData,
        apifyData
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
        // Reddit psychological triggers and insights
        config.includeReddit !== false
          ? this.fetchRedditIntelligence(brandData, errors, dataSourcesUsed)
          : Promise.resolve(null),
        config.includePerplexity !== false
          ? this.fetchPerplexityIntelligence(brandData, errors, dataSourcesUsed)
          : Promise.resolve(null),
        config.includeLinkedIn !== false
          ? this.fetchLinkedInIntelligence(brandData, errors, dataSourcesUsed)
          : Promise.resolve(null),
        // Whisper video transcription
        brandData.videoUrls && brandData.videoUrls.length > 0
          ? this.fetchWhisperIntelligence(brandData, errors, dataSourcesUsed)
          : Promise.resolve(null),
        // Apify website scraping
        config.includeApify !== false && brandData.website
          ? this.fetchApifyIntelligence(brandData, errors, dataSourcesUsed)
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

      // Add Whisper data points
      if (whisperData.status === 'fulfilled' && whisperData.value) {
        dataPoints.push(...whisperData.value);
      }

      // Add Apify data points
      if (apifyData.status === 'fulfilled' && apifyData.value) {
        dataPoints.push(...apifyData.value);
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

      // Parallel fetch: trends + psychological mining from comments
      const [trendsResult, psychologyResult] = await Promise.allSettled([
        YouTubeAPI.analyzeVideoTrends(brandData.industry, keywords),
        YouTubeAPI.mineIndustryPsychology(keywords, 5)
      ]);

      dataSourcesUsed.push('youtube');

      // Convert to data points
      const dataPoints: DataPoint[] = [];

      // Trending topics
      if (trendsResult.status === 'fulfilled') {
        const trends = trendsResult.value;
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
      }

      // Add psychological patterns from comment mining (I wish/hate when patterns)
      if (psychologyResult.status === 'fulfilled' && psychologyResult.value) {
        const { patterns } = psychologyResult.value;

        patterns.forEach((pattern, i) => {
          dataPoints.push({
            id: `youtube-psych-${Date.now()}-${i}`,
            source: 'youtube' as DataSource,
            type: 'customer_trigger' as DataPointType,
            content: `${pattern.type.toUpperCase()}: ${pattern.pattern}`,
            metadata: {
              platform: 'youtube',
              type: 'psychological_pattern',
              patternType: pattern.type,
              frequency: pattern.frequency,
              examples: pattern.examples.slice(0, 3),
              domain: 'psychology' as const
            },
            createdAt: new Date(),
            embedding: undefined
          });
        });

        console.log(`[DeepContext/YouTube] ✅ Mined ${patterns.length} psychological patterns from comments`);
      }

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

          // Analyze reviews by rating tier (1-2 star pain vs 4-5 star desire)
          const tierAnalysis = OutScraperAPI.analyzeReviewsByRatingTier(reviews);

          tierAnalysis.forEach((tier, tierIdx) => {
            // Add psychological patterns from each tier
            tier.patterns.forEach((pattern, patternIdx) => {
              dataPoints.push({
                id: `outscraper-tier-${tier.tier}-${Date.now()}-${tierIdx}-${patternIdx}`,
                source: 'outscraper' as DataSource,
                type: 'customer_trigger' as DataPointType,
                content: `[${tier.tier}] ${pattern.type.toUpperCase()}: ${pattern.pattern}`,
                metadata: {
                  competitor: competitor.name,
                  ratingTier: tier.tier,
                  patternType: pattern.type,
                  frequency: pattern.frequency,
                  examples: pattern.examples.slice(0, 2),
                  domain: 'psychology' as const
                },
                createdAt: new Date(),
                embedding: undefined
              });
            });

            // Add emotional triggers from each tier
            tier.emotionalTriggers.forEach((trigger, triggerIdx) => {
              dataPoints.push({
                id: `outscraper-emotion-${tier.tier}-${Date.now()}-${tierIdx}-${triggerIdx}`,
                source: 'outscraper' as DataSource,
                type: 'customer_trigger' as DataPointType,
                content: `[${tier.tier}] Emotional trigger: ${trigger}`,
                metadata: {
                  competitor: competitor.name,
                  ratingTier: tier.tier,
                  type: 'emotional_trigger',
                  domain: 'psychology' as const
                },
                createdAt: new Date(),
                embedding: undefined
              });
            });
          });

          console.log(`[DeepContext/OutScraper] ✅ Analyzed ${tierAnalysis.length} rating tiers for ${competitor.name}`);

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
   * Fetch News intelligence via Serper (industry news, trending stories)
   */
  private async fetchNewsIntelligence(
    brandData: any,
    errors: any[],
    dataSourcesUsed: string[]
  ): Promise<DataPoint[]> {
    try {
      console.log('[DeepContext/News] Fetching industry news via Serper...');

      const location = brandData.location ? `${brandData.location.city}, ${brandData.location.state}` : undefined;
      const articles = await SerperAPI.getNews(brandData.industry, location);

      dataSourcesUsed.push('serper-news');

      const dataPoints: DataPoint[] = articles.slice(0, 10).map((article, idx) => ({
        id: `news-${Date.now()}-${idx}`,
        source: 'news' as DataSource,
        type: 'trending_topic' as DataPointType,
        content: `${article.title}: ${article.snippet}`,
        metadata: {
          url: article.link,
          source: article.source,
          publishedAt: article.date,
          imageUrl: article.imageUrl
        },
        createdAt: new Date(article.date),
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
        imagesResult,
        shoppingResult
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

        // 3. Autocomplete (expanded with multiple query patterns)
        (async () => {
          const queryPatterns = [
            `${brandData.industry} how to`,
            `${brandData.industry} best`,
            `${brandData.industry} problems`,
            `${brandData.industry} mistakes`,
            `${brandData.industry} cost`,
            `why ${brandData.industry}`,
            `${brandData.industry} vs`
          ];

          const allDataPoints: DataPoint[] = [];

          for (const query of queryPatterns) {
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

            // Determine intent type based on query pattern
            const intentType = query.includes('how to') ? 'educational' :
              query.includes('best') ? 'comparison' :
              query.includes('problems') || query.includes('mistakes') ? 'pain_point' :
              query.includes('cost') ? 'pricing' :
              query.includes('why') ? 'justification' :
              query.includes('vs') ? 'comparison' : 'general';

            const points = suggestions.slice(0, 2).map((suggestion: string) => ({
              source: 'serper' as DataSource,
              type: 'customer_trigger' as DataPointType,
              content: suggestion,
              metadata: {
                type: 'search_intent',
                intentType,
                query
              },
              timestamp: new Date().toISOString(),
              confidence: 0.75
            }));

            allDataPoints.push(...points);
          }

          return allDataPoints;
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
        })(),

        // 7. Shopping (competitor pricing and products)
        (async () => {
          const query = `${brandData.industry} products`;
          const cacheKey = `serper:shopping:${query}`;
          let products = await intelligenceCache.get(cacheKey);

          if (!products) {
            products = await SerperAPI.getShopping(query);
            await intelligenceCache.set(cacheKey, products, {
              dataType: 'shopping',
              sourceApi: 'serper',
              brandId: brandData.id
            });
          }

          return (products || []).slice(0, 5).map((product: any) => ({
            source: 'serper' as DataSource,
            type: 'competitive_gap' as DataPointType,
            content: `Product: ${product.title} - ${product.price}`,
            metadata: {
              title: product.title,
              price: product.price,
              source: product.source,
              link: product.link,
              rating: product.rating,
              reviews: product.reviews
            },
            timestamp: new Date().toISOString(),
            confidence: 0.75
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
      if (shoppingResult.status === 'fulfilled' && shoppingResult.value) {
        dataPoints.push(...shoppingResult.value);
      }

      dataSourcesUsed.push('serper');

      console.log(`[DeepContext/Serper] ✅ Extracted ${dataPoints.length} data points from 7 parallel endpoints`);
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
      console.log('[DeepContext/SEMrush] Fetching comprehensive SEO data...');

      const dataPoints: DataPoint[] = [];
      const domain = brandData.website || brandData.url;

      if (!domain) {
        console.warn('[DeepContext/SEMrush] No domain provided, skipping');
        return [];
      }

      // Get comprehensive SEO metrics (overview + rankings + opportunities)
      try {
        const metrics = await SemrushAPI.getComprehensiveSEOMetrics(domain, brandData.name);

        // Add domain overview data point (backlinks, authority)
        dataPoints.push({
          id: `semrush-overview-${Date.now()}`,
          source: 'semrush' as DataSource,
          type: 'market_trend' as DataPointType,
          content: `Domain authority: ${metrics.overview.authority_score}/100 | Backlinks: ${metrics.overview.backlinks.toLocaleString()} | Organic traffic: ${metrics.overview.organic_traffic.toLocaleString()}/mo | SEO health: ${metrics.healthScore}/100`,
          metadata: {
            domainName: metrics.domain,
            authorityScore: metrics.overview.authority_score,
            backlinks: metrics.overview.backlinks,
            organicTraffic: metrics.overview.organic_traffic,
            organicKeywords: metrics.overview.organic_keywords,
            healthScore: metrics.healthScore,
            domain: 'competitive' as const
          },
          createdAt: new Date(),
          embedding: undefined
        });

        // Add content gap data points (rankings that need improvement)
        const contentGaps = metrics.rankings.filter(r =>
          (r.position >= 11 && r.position <= 50) || // Just off page 1
          (r.trend === 'declining') // Losing ground
        ).slice(0, 5);

        contentGaps.forEach((gap, idx) => {
          const gapType = gap.trend === 'declining' ? 'declining' : 'underperforming';
          dataPoints.push({
            id: `semrush-gap-${Date.now()}-${idx}`,
            source: 'semrush' as DataSource,
            type: 'keyword_gap' as DataPointType,
            content: `Content gap: "${gap.keyword}" ranked #${gap.position} (${gap.searchVolume} searches/mo) - ${gapType} content needs optimization`,
            metadata: {
              keyword: gap.keyword,
              position: gap.position,
              searchVolume: gap.searchVolume,
              difficulty: gap.difficulty,
              traffic: gap.traffic,
              trend: gap.trend,
              gapType,
              domain: 'competitive' as const
            },
            createdAt: new Date(),
            embedding: undefined
          });
        });

        // Add keyword opportunities
        metrics.opportunities.slice(0, 10).forEach((opp, idx) => {
          dataPoints.push({
            id: `semrush-keyword-${Date.now()}-${idx}`,
            source: 'semrush' as DataSource,
            type: 'competitive_gap' as DataPointType,
            content: `Keyword opportunity: "${opp.keyword}" (${opp.searchVolume} searches/mo) - ${opp.reasoning}`,
            metadata: {
              keyword: opp.keyword,
              searchVolume: opp.searchVolume,
              difficulty: opp.difficulty,
              opportunityType: opp.opportunity,
              estimatedTraffic: opp.estimatedTraffic,
              currentPosition: opp.currentPosition,
              domain: 'competitive' as const
            },
            createdAt: new Date(),
            embedding: undefined
          });
        });

        // Add backlink insight if significant
        if (metrics.overview.backlinks > 0) {
          const backlinkStrength = metrics.overview.backlinks > 10000 ? 'strong' :
                                   metrics.overview.backlinks > 1000 ? 'moderate' : 'weak';
          dataPoints.push({
            id: `semrush-backlinks-${Date.now()}`,
            source: 'semrush' as DataSource,
            type: 'competitor_weakness' as DataPointType,
            content: `Backlink profile: ${backlinkStrength} with ${metrics.overview.backlinks.toLocaleString()} total backlinks. ${backlinkStrength === 'weak' ? 'Opportunity to build authority through link building campaigns.' : 'Solid foundation for competitive SEO.'}`,
            metadata: {
              backlinks: metrics.overview.backlinks,
              backlinkStrength,
              authorityScore: metrics.overview.authority_score,
              domain: 'competitive' as const
            },
            createdAt: new Date(),
            embedding: undefined
          });
        }

      } catch (metricsError) {
        console.warn('[DeepContext/SEMrush] Comprehensive metrics failed:', metricsError);
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

      // Query Perplexity with multiple psychological-focused prompts
      const queries = [
        // 1. Local events (original)
        {
          query: `What local events, festivals, holidays, and community gatherings are happening in ${location} in ${currentMonth} ${now.getFullYear()} that would be relevant marketing opportunities for ${brandData.industry} businesses? Include specific dates if available.`,
          type: 'local_event' as DataPointType,
          domain: 'timing'
        },
        // 2. Customer pain points and concerns
        {
          query: `What are the most common problems, frustrations, and complaints people in ${location} have about ${brandData.industry} services right now? What are customers asking about most frequently? Include specific pain points and unanswered questions.`,
          type: 'customer_trigger' as DataPointType,
          domain: 'psychology'
        },
        // 3. Emerging trends and desires
        {
          query: `What new trends, desires, and expectations are emerging for ${brandData.industry} customers in ${location}? What are people hoping for that they can't currently find? Include specific features or services people are requesting.`,
          type: 'customer_trigger' as DataPointType,
          domain: 'psychology'
        },
        // 4. Competitor content analysis
        {
          query: `What types of content, marketing approaches, and messaging are the most successful ${brandData.industry} businesses in ${location} using? What blog posts, videos, social media content, or campaigns are getting the most engagement? Include specific examples of content that resonates with customers.`,
          type: 'competitive_gap' as DataPointType,
          domain: 'competitive'
        }
      ];

      const dataPoints: DataPoint[] = [];

      for (const queryConfig of queries) {
        try {
          const response = await perplexityAPI.getIndustryInsights({
            query: queryConfig.query,
            context: {
              industry: brandData.industry,
              brand_name: brandData.name
            },
            max_results: 5
          });

          // Convert insights to data points
          response.insights.forEach((insight, index) => {
            dataPoints.push({
              id: `perplexity-${queryConfig.domain}-${Date.now()}-${index}`,
              source: 'perplexity' as DataSource,
              type: queryConfig.type,
              content: insight,
              metadata: {
                location,
                month: currentMonth,
                year: now.getFullYear(),
                confidence: response.confidence,
                domain: queryConfig.domain as 'psychology' | 'competitive' | 'timing' | 'search_intent' | 'content_gap',
                queryType: queryConfig.domain === 'psychology' ? 'psychological_trigger' : 'event'
              },
              createdAt: new Date(),
              embedding: undefined
            });
          });
        } catch (queryError) {
          console.warn(`[DeepContext/Perplexity] Query failed for ${queryConfig.domain}:`, queryError);
        }
      }

      dataSourcesUsed.push('perplexity');

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
   * 11. Fetch Whisper Intelligence - Video Transcription & Insight Extraction
   */
  private async fetchWhisperIntelligence(
    brandData: any,
    errors: Array<{ source: string; error: string; severity: 'warning' | 'error' }>,
    dataSourcesUsed: string[]
  ): Promise<DataPoint[]> {
    try {
      console.log('[DeepContext/Whisper] Transcribing business videos...');

      const videoUrls = brandData.videoUrls || [];

      if (videoUrls.length === 0) {
        console.log('[DeepContext/Whisper] No video URLs provided, skipping');
        return [];
      }

      // Process videos and extract insights
      const dataPoints = await whisperAPI.processVideos(videoUrls);

      dataSourcesUsed.push('whisper');

      console.log(`[DeepContext/Whisper] ✅ Extracted ${dataPoints.length} data points from ${videoUrls.length} videos`);
      return dataPoints;

    } catch (error) {
      console.error('[DeepContext/Whisper] Error:', error);
      errors.push({
        source: 'whisper',
        error: error instanceof Error ? error.message : String(error),
        severity: 'warning'
      });
      return [];
    }
  }

  /**
   * 12. Fetch Apify Intelligence - Website Content Scraping
   * Extracts services, testimonials, about page content
   */
  private async fetchApifyIntelligence(
    brandData: any,
    errors: Array<{ source: string; error: string; severity: 'warning' | 'error' }>,
    dataSourcesUsed: string[]
  ): Promise<DataPoint[]> {
    try {
      console.log('[DeepContext/Apify] Scraping website content...');

      const website = brandData.website;
      if (!website) {
        console.log('[DeepContext/Apify] No website provided, skipping');
        return [];
      }

      // Check cache first
      const cacheKey = `apify:website:${website}`;
      let cachedContent = await intelligenceCache.get<any>(cacheKey);

      if (!cachedContent) {
        // Scrape website content using Apify
        const content = await ApifyAPI.scrapeWebsiteContent(website);
        cachedContent = content;

        // Cache the result
        await intelligenceCache.set(cacheKey, content, {
          dataType: 'website_content',
          sourceApi: 'apify',
          brandId: brandData.id,
          ttlMinutes: 1440 // 24 hours - website content doesn't change often
        });
      }

      const dataPoints: DataPoint[] = [];

      // Extract services from headings and text
      if (cachedContent.headings && cachedContent.headings.length > 0) {
        const serviceHeadings = cachedContent.headings.filter((h: string) =>
          h.toLowerCase().includes('service') ||
          h.toLowerCase().includes('solution') ||
          h.toLowerCase().includes('offer') ||
          h.toLowerCase().includes('what we do')
        );

        serviceHeadings.forEach((heading: string, index: number) => {
          dataPoints.push({
            id: `apify-service-${Date.now()}-${index}`,
            source: 'apify' as DataSource,
            type: 'service_offering' as DataPointType,
            content: heading,
            metadata: {
              url: website,
              extractedFrom: 'headings',
              confidence: 0.85
            },
            createdAt: new Date()
          });
        });
      }

      // Extract key content as brand voice patterns
      if (cachedContent.text && cachedContent.text.length > 100) {
        // Split text into meaningful chunks
        const sentences = cachedContent.text
          .split(/[.!?]+/)
          .filter((s: string) => s.trim().length > 50 && s.trim().length < 300)
          .slice(0, 10);

        sentences.forEach((sentence: string, index: number) => {
          const trimmed = sentence.trim();
          // Look for value proposition patterns
          if (
            trimmed.toLowerCase().includes('we ') ||
            trimmed.toLowerCase().includes('our ') ||
            trimmed.toLowerCase().includes('help') ||
            trimmed.toLowerCase().includes('provide') ||
            trimmed.toLowerCase().includes('deliver')
          ) {
            dataPoints.push({
              id: `apify-content-${Date.now()}-${index}`,
              source: 'apify' as DataSource,
              type: 'brand_voice' as DataPointType,
              content: trimmed,
              metadata: {
                url: website,
                extractedFrom: 'body_text',
                confidence: 0.75
              },
              createdAt: new Date()
            });
          }
        });
      }

      // Extract title and description as brand messaging
      if (cachedContent.title) {
        dataPoints.push({
          id: `apify-title-${Date.now()}`,
          source: 'apify' as DataSource,
          type: 'brand_voice' as DataPointType,
          content: `Website title: ${cachedContent.title}`,
          metadata: {
            url: website,
            extractedFrom: 'title',
            confidence: 0.95
          },
          createdAt: new Date()
        });
      }

      if (cachedContent.description) {
        dataPoints.push({
          id: `apify-desc-${Date.now()}`,
          source: 'apify' as DataSource,
          type: 'brand_voice' as DataPointType,
          content: `Website description: ${cachedContent.description}`,
          metadata: {
            url: website,
            extractedFrom: 'meta_description',
            confidence: 0.90
          },
          createdAt: new Date()
        });
      }

      // Extract OG metadata as additional brand signals
      if (cachedContent.metadata?.ogTitle || cachedContent.metadata?.ogDescription) {
        dataPoints.push({
          id: `apify-og-${Date.now()}`,
          source: 'apify' as DataSource,
          type: 'brand_voice' as DataPointType,
          content: `Social sharing: ${cachedContent.metadata.ogTitle || ''} - ${cachedContent.metadata.ogDescription || ''}`,
          metadata: {
            url: website,
            extractedFrom: 'og_tags',
            confidence: 0.85
          },
          createdAt: new Date()
        });
      }

      dataSourcesUsed.push('apify');

      console.log(`[DeepContext/Apify] ✅ Extracted ${dataPoints.length} data points from website`);
      return dataPoints;

    } catch (error) {
      console.error('[DeepContext/Apify] Error:', error);
      errors.push({
        source: 'apify',
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
        events: (() => {
          const localEvents = dataPoints.filter(dp => dp.type === 'local_event');
          console.log(`[DeepContext] Found ${localEvents.length} local_event data points to populate`);
          return localEvents.map(dp => ({
            name: dp.content,
            date: dp.metadata?.date,
            description: dp.content
          }));
        })(),
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
   * Extract psychological profile from multi-source data
   */
  private async extractPsychologicalProfile(
    dataPoints: DataPoint[],
    brandData: any
  ): Promise<PsychologicalProfile> {
    console.log('[DeepContext] Extracting psychological profile from data sources...');

    // Extract YouTube comments
    const youtubeComments = dataPoints
      .filter(dp => dp.source === 'youtube' && dp.type === 'customer_trigger')
      .map(dp => ({
        text: dp.content,
        likes: dp.metadata?.engagement || 0,
        timestamp: dp.createdAt
      }));

    // Extract reviews
    const reviews = dataPoints
      .filter(dp => dp.source === 'outscraper' && dp.type === 'customer_trigger')
      .map(dp => ({
        text: dp.content,
        rating: dp.metadata?.rating || 3,
        timestamp: dp.createdAt
      }));

    // Extract testimonials from website
    const testimonials = dataPoints
      .filter(dp => dp.source === 'website' && dp.metadata?.category === 'testimonial')
      .map(dp => dp.content);

    // Get NAICS profile if available
    const naicsProfile = brandData.naicsProfile;

    // Build psychological profile
    const psychProfile = psychologicalExtractor.buildProfile({
      youtubeComments: youtubeComments.length > 0 ? youtubeComments : undefined,
      reviews: reviews.length > 0 ? reviews : undefined,
      testimonials: testimonials.length > 0 ? testimonials : undefined,
      naicsProfile
    });

    console.log(`[DeepContext] ✅ Psychological profile extracted:`);
    console.log(`  - ${psychProfile.triggers.length} psychological triggers`);
    console.log(`  - ${psychProfile.painPoints.length} pain points`);
    console.log(`  - ${psychProfile.desires.length} customer desires`);
    console.log(`  - ${psychProfile.customerLanguage.length} language patterns`);
    console.log(`  - Primary emotion: ${psychProfile.emotionalDrivers.primary}`);

    return psychProfile;
  }

  /**
   * Synthesize insights using AI
   */
  private async synthesizeInsights(
    deepContext: DeepContext,
    dataPoints: DataPoint[]
  ): Promise<void> {
    // Extract psychological profile from all sources
    const psychProfile = await this.extractPsychologicalProfile(dataPoints, deepContext.business.profile);

    // Enhance customerPsychology section with extracted profile
    if (psychProfile) {
      // Add psychological triggers
      deepContext.customerPsychology.emotional = psychProfile.triggers.map(trigger => ({
        trigger: trigger.text,
        strength: trigger.confidence,
        context: `From ${trigger.source}`,
        leverage: `Leverage ${trigger.type} trigger with authentic customer language`
      }));

      // Enhance unarticulated needs with pain points
      deepContext.customerPsychology.unarticulated = [
        ...deepContext.customerPsychology.unarticulated,
        ...psychProfile.painPoints.map(pain => ({
          need: `Address: ${pain.pain}`,
          confidence: pain.frequency / 10, // Normalize frequency
          evidence: pain.quotes,
          approach: 'Eliminate this pain point',
          emotionalDriver: 'Fear/Frustration'
        }))
      ];

      // Add desires
      deepContext.customerPsychology.identityDesires = psychProfile.desires.map(desire => ({
        desire: desire.desire,
        strength: desire.achievementLevel,
        messaging: 'Position as achievement/aspiration'
      }));

      // Add customer language to brand voice
      if (deepContext.business.brandVoice) {
        deepContext.business.brandVoice.signaturePhrases = psychProfile.customerLanguage;
      }
    }

    // Use AI-powered synthesis service to extract specific, actionable insights
    try {
      console.log('[DeepContext] Step 10/10: Running AI-powered insight synthesis...');
      await insightSynthesis.synthesizeAllInsights(deepContext, dataPoints);
      console.log('[DeepContext] ✅ Insight synthesis complete');
    } catch (error) {
      console.error('[DeepContext] ❌ Insight synthesis failed:', error instanceof Error ? error.message : error);
      // Continue with basic context even if synthesis fails
    }

    // Run full intelligence orchestration (Phase 2-5) with embeddings
    try {
      console.log('[DeepContext] Running full intelligence orchestration (embeddings, clustering, connections)...');
      const orchestrationResult = await orchestrationService.orchestrate(dataPoints, deepContext);
      console.log(`[DeepContext] ✅ Full orchestration complete: ${orchestrationResult.stats.embeddedCount} embeddings, ${orchestrationResult.stats.clusterCount} clusters, ${orchestrationResult.stats.breakthroughCount} breakthroughs`);
    } catch (error) {
      console.error('[DeepContext] ❌ Orchestration failed:', error instanceof Error ? error.message : error);
      // Continue with basic context even if orchestration fails
    }
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
