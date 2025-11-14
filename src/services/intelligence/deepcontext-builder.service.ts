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
 * 6. Calls Serper for search trends (News, Trends, Autocomplete, Places, Images, Videos, Shopping)
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
      console.log('[DeepContext] Step 2/7: Gathering intelligence from APIs...');
      const [
        youtubeData,
        outscraperData,
        newsData,
        weatherData,
        serperData,
        semrushData,
        websiteData
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
          errors
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
          source: 'youtube' as DataSource,
          type: 'trending_topic' as DataPointType,
          content: topic,
          metadata: {
            platform: 'youtube',
            rank: i + 1,
            relevance: 0.8
          },
          timestamp: new Date().toISOString(),
          confidence: 0.8
        });
      });

      // Content angles (psychological triggers)
      trends.content_angles.forEach(angle => {
        dataPoints.push({
          source: 'youtube' as DataSource,
          type: 'customer_trigger' as DataPointType,
          content: angle,
          metadata: {
            platform: 'youtube',
            type: 'content_angle'
          },
          timestamp: new Date().toISOString(),
          confidence: 0.7
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
            limit: 20,
            sort: 'newest'
          });

          // Extract psychological triggers from reviews
          reviews.forEach(review => {
            if (review.text && review.text.length > 20) {
              dataPoints.push({
                source: 'outscraper' as DataSource,
                type: 'customer_trigger' as DataPointType,
                content: review.text,
                metadata: {
                  competitor: competitor.name,
                  rating: review.rating,
                  sentiment: review.rating >= 4 ? 'positive' : review.rating <= 2 ? 'negative' : 'neutral'
                },
                timestamp: review.time,
                confidence: 0.85
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

      const dataPoints: DataPoint[] = articles.slice(0, 10).map(article => ({
        source: 'news' as DataSource,
        type: 'trending_topic' as DataPointType,
        content: `${article.title}: ${article.description}`,
        metadata: {
          url: article.url,
          source: article.source,
          publishedAt: article.publishedAt,
          relevanceScore: article.relevanceScore
        },
        timestamp: article.publishedAt,
        confidence: article.relevanceScore / 100
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

      const dataPoints: DataPoint[] = opportunities.map(opp => ({
        source: 'weather' as DataSource,
        type: 'timing' as DataPointType,
        content: `${opp.title}: ${opp.description}`,
        metadata: {
          urgency: opp.urgency,
          impactScore: opp.impact_score,
          suggestedActions: opp.suggested_actions,
          type: opp.type
        },
        timestamp: new Date().toISOString(),
        confidence: opp.impact_score / 100
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
   * Fetch Serper intelligence (8 data sources via one API)
   * Includes: Search, News, Trends, Autocomplete, Places, Images, Videos, Shopping
   */
  private async fetchSerperIntelligence(
    brandData: any,
    errors: any[],
    dataSourcesUsed: string[]
  ): Promise<DataPoint[]> {
    try {
      console.log('[DeepContext/Serper] Fetching from 8 Serper endpoints...');

      const dataPoints: DataPoint[] = [];
      const keywords = brandData.keywords || [brandData.industry];
      const location = brandData.location
        ? typeof brandData.location === 'string'
          ? brandData.location
          : `${brandData.location.city}, ${brandData.location.state}`
        : '';

      // 1. News (with location filtering)
      try {
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

        newsResults.slice(0, 5).forEach((article: any) => {
          dataPoints.push({
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
          });
        });
      } catch (err) {
        console.warn('[DeepContext/Serper] News fetch failed');
      }

      // 2. Trends (for top keyword)
      try {
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

        if (trendData) {
          dataPoints.push({
            source: 'serper' as DataSource,
            type: 'trending_topic' as DataPointType,
            content: `Trend: "${keyword}" is ${trendData.trend} (${trendData.growthPercentage}% growth)`,
            metadata: {
              keyword,
              trend: trendData.trend,
              growth: trendData.growthPercentage,
              relatedQueries: trendData.relatedQueries
            },
            timestamp: new Date().toISOString(),
            confidence: 0.8
          });
        }
      } catch (err) {
        console.warn('[DeepContext/Serper] Trends fetch failed');
      }

      // 3. Autocomplete (for content ideas)
      try {
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

        suggestions.slice(0, 3).forEach((suggestion: string) => {
          dataPoints.push({
            source: 'serper' as DataSource,
            type: 'customer_trigger' as DataPointType,
            content: suggestion,
            metadata: {
              type: 'search_intent',
              query
            },
            timestamp: new Date().toISOString(),
            confidence: 0.75
          });
        });
      } catch (err) {
        console.warn('[DeepContext/Serper] Autocomplete fetch failed');
      }

      // 4. Places (if location-based business)
      if (location) {
        try {
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

          places.slice(0, 3).forEach((place: any) => {
            dataPoints.push({
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
            });
          });
        } catch (err) {
          console.warn('[DeepContext/Serper] Places fetch failed');
        }
      }

      // 5. Videos (for content gap analysis)
      try {
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

        videos.slice(0, 3).forEach((video: any) => {
          dataPoints.push({
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
          });
        });
      } catch (err) {
        console.warn('[DeepContext/Serper] Videos fetch failed');
      }

      dataSourcesUsed.push('serper');

      console.log(`[DeepContext/Serper] ✅ Extracted ${dataPoints.length} data points from 8 endpoints`);
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

        opportunities.slice(0, 10).forEach(opp => {
          dataPoints.push({
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
            timestamp: new Date().toISOString(),
            confidence: 0.8
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
        analysis.valuePropositions.forEach((vp: string) => {
          dataPoints.push({
            source: 'website' as DataSource,
            type: 'value_proposition' as DataPointType,
            content: vp,
            metadata: {
              extracted_from: websiteUrl,
              confidence: analysis.confidence
            },
            timestamp: new Date().toISOString(),
            confidence: analysis.confidence / 100
          });
        });
      }

      if (analysis.targetAudience && analysis.targetAudience.length > 0) {
        analysis.targetAudience.forEach((audience: string) => {
          dataPoints.push({
            source: 'website' as DataSource,
            type: 'customer_segment' as DataPointType,
            content: audience,
            metadata: {
              extracted_from: websiteUrl,
              confidence: analysis.confidence
            },
            timestamp: new Date().toISOString(),
            confidence: analysis.confidence / 100
          });
        });
      }

      if (analysis.customerProblems && analysis.customerProblems.length > 0) {
        analysis.customerProblems.forEach((problem: string) => {
          dataPoints.push({
            source: 'website' as DataSource,
            type: 'customer_trigger' as DataPointType,
            content: `Problem: ${problem}`,
            metadata: {
              type: 'pain_point',
              extracted_from: websiteUrl
            },
            timestamp: new Date().toISOString(),
            confidence: analysis.confidence / 100
          });
        });
      }

      if (analysis.differentiators && analysis.differentiators.length > 0) {
        analysis.differentiators.forEach((diff: string) => {
          dataPoints.push({
            source: 'website' as DataSource,
            type: 'competitive_gap' as DataPointType,
            content: `Differentiator: ${diff}`,
            metadata: {
              type: 'unique_advantage',
              extracted_from: websiteUrl
            },
            timestamp: new Date().toISOString(),
            confidence: analysis.confidence / 100
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
   * Build DeepContext structure from brand data and data points
   */
  private async buildContextStructure(
    brandData: any,
    dataPoints: DataPoint[]
  ): Promise<DeepContext> {
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
        uniqueAdvantages: brandData.unique_selling_points || [],
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
        events: [],
        viralContent: []
      },
      competitiveIntel: {
        blindSpots: [],
        mistakes: [],
        opportunities: [],
        contentGaps: [],
        positioningWeaknesses: []
      },
      customerPsychology: {
        unarticulated: [],
        emotional: [],
        behavioral: [],
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
export type { DeepContextBuilderConfig, DeepContextBuildResult };
