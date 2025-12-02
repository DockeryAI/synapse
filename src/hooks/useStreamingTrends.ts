/**
 * useStreamingTrends Hook
 *
 * Master hook for Trends 2.0 that orchestrates the full trend pipeline:
 * 1. UVP-Informed Query Generation
 * 2. Parallel API fetching with category-aware routing
 * 3. Multi-Source Validation (2+ sources required)
 * 4. Brand Relevance Scoring
 * 5. EQ-Weighted Prioritization
 * 6. Lifecycle Detection
 * 7. Triggers Matching
 *
 * PHASE 8 ENHANCEMENTS:
 * - Deep Mining mode: 50-100 queries (vs 21)
 * - HackerNews API for tech/B2B trends
 * - Parallel API execution with Promise.allSettled
 * - More Serper Autocomplete queries
 * - Serper Trends for velocity data
 *
 * CATEGORY-SPECIFIC API ROUTING:
 * - Local B2B/B2C: WeatherAPI, Serper Places, Local News
 * - B2B (1,3,5): LinkedIn/OutScraper, Industry News
 * - National (5,6): SemrushAPI, Serper Shopping
 * - All: Serper Search, News, YouTube, Reddit, Perplexity, HackerNews
 *
 * Created: 2025-11-29
 * Updated: 2025-11-29 - Full category-specific API wiring
 * Updated: 2025-11-30 - Phase 8: Deep Mining + Parallel Execution
 */

import { useState, useCallback, useMemo } from 'react';
import type { CompleteUVP } from '@/types/uvp-flow.types';

// Import trend services
import { UVPQueryGenerator, type GeneratedQuery, extractUVPKeywords } from '@/services/trends/uvp-query-generator.service';
import { TrendCategoryRouter, type BusinessCategory, CATEGORY_CONFIGS } from '@/services/trends/trend-category-router.service';
import { MultiSourceValidator, type RawTrendItem, type ValidatedTrend, type QueryIntent } from '@/services/trends/multi-source-validator.service';
import { TrendRelevanceScorer, type ScoredTrend } from '@/services/trends/trend-relevance-scorer.service';
import { EQTrendPrioritizer, type EQPrioritizedTrend } from '@/services/trends/eq-trend-prioritizer.service';
import { TrendLifecycleDetector, type LifecycleTrend } from '@/services/trends/trend-lifecycle-detector.service';
import { TriggersTrendMatcher, type TrendWithMatches } from '@/services/trends/triggers-trend-matcher.service';
// Phase 11: Outcome-driven query generation
import { OutcomeQueryGenerator, type OutcomeQuery } from '@/services/trends/outcome-query-generator.service';

// Import ALL APIs for category-specific routing
import { SerperAPI } from '@/services/intelligence/serper-api';
import { YouTubeAPI } from '@/services/intelligence/youtube-api';
import { redditAPI } from '@/services/intelligence/reddit-apify-api';
import { perplexityAPI } from '@/services/uvp-wizard/perplexity-api';
import { WeatherAPI } from '@/services/intelligence/weather-api';
import { OutScraperAPI } from '@/services/intelligence/outscraper-api';
import { SemrushAPI } from '@/services/intelligence/semrush-api';
import { HackerNewsAPI } from '@/services/intelligence/hackernews-api';
import { buzzsumoAPI } from '@/services/intelligence/buzzsumo-api';

// ============================================================================
// TYPES
// ============================================================================

export interface TrendsPipelineState {
  stage: 'idle' | 'generating_queries' | 'fetching' | 'validating' | 'scoring' | 'prioritizing' | 'matching' | 'complete' | 'error';
  progress: number;
  statusMessage: string;
  error?: string;
  /** APIs called in this run */
  apisUsed: string[];
}

export interface TrendsPipelineResult {
  trends: TrendWithMatches[];
  rawTrends: RawTrendItem[];
  queries: GeneratedQuery[];
  category: BusinessCategory;
  stats: TrendsStats;
  /** APIs that were called */
  apisUsed: string[];
}

export interface TrendsStats {
  rawCount: number;
  validatedCount: number;
  relevantCount: number;
  contentReadyCount: number;
  lifecycleBreakdown: Record<string, number>;
  triggerBreakdown: Record<string, number>;
  avgRelevance: number;
  avgValidation: number;
}

export interface UseStreamingTrendsOptions {
  minSources?: number;
  relevanceThreshold?: number;
  /** Phase 8: Enable deep mining mode (50-100 queries, parallel execution) */
  deepMining?: boolean;
}

// ============================================================================
// CACHE - Brand-specific to prevent cross-brand contamination
// ============================================================================

const CACHE_KEY_PREFIX = 'trends2_pipeline_';

function getCacheKey(): string {
  // Get current brand ID from localStorage
  try {
    const brandData = localStorage.getItem('currentBrand');
    if (brandData) {
      const brand = JSON.parse(brandData);
      if (brand?.id) {
        return `${CACHE_KEY_PREFIX}${brand.id}`;
      }
    }
  } catch (e) {
    console.warn('[useStreamingTrends] Could not get brand ID for cache key');
  }
  // Fallback to generic key (will be cleared on brand switch)
  return `${CACHE_KEY_PREFIX}generic`;
}

function loadCachedResult(): TrendsPipelineResult | null {
  try {
    const cacheKey = getCacheKey();
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      console.log(`[useStreamingTrends] Loaded cached result (${cacheKey}):`, parsed.trends?.length || 0, 'trends');
      return parsed;
    }

    // MIGRATION: Clear old generic cache key if it exists (one-time cleanup)
    const oldCache = localStorage.getItem('trends2_pipeline_result_v2');
    if (oldCache) {
      console.log('[useStreamingTrends] Removing old generic cache (brand contamination risk)');
      localStorage.removeItem('trends2_pipeline_result_v2');
    }
  } catch (err) {
    console.warn('[useStreamingTrends] Failed to load cache:', err);
  }
  return null;
}

function saveCachedResult(result: TrendsPipelineResult): void {
  try {
    const cacheKey = getCacheKey();
    localStorage.setItem(cacheKey, JSON.stringify(result));
    console.log(`[useStreamingTrends] Saved result to cache (${cacheKey})`);
  } catch (err) {
    console.error('[useStreamingTrends] Failed to save cache:', err);
  }
}

function clearCachedResult(): void {
  try {
    const cacheKey = getCacheKey();
    localStorage.removeItem(cacheKey);
    // Also clear old generic cache key
    localStorage.removeItem('trends2_pipeline_result_v2');
    console.log(`[useStreamingTrends] Cleared cache (${cacheKey})`);
  } catch (err) {
    console.error('[useStreamingTrends] Failed to clear cache:', err);
  }
}

// ============================================================================
// CATEGORY-SPECIFIC API FETCHERS
// ============================================================================

interface CategoryFetchResult {
  trends: RawTrendItem[];
  apisUsed: string[];
}

/**
 * Fetch trends from APIs based on business category
 */
async function fetchCategorySpecificTrends(
  category: BusinessCategory,
  queries: GeneratedQuery[],
  uvp: CompleteUVP,
  updateProgress: (msg: string, pct: number) => void
): Promise<CategoryFetchResult> {
  const allTrends: RawTrendItem[] = [];
  const apisUsed: string[] = [];
  const keywords = extractUVPKeywords(uvp);
  const location = keywords.location[0] || '';
  const industry = keywords.industry[0] || 'business';

  // Group queries
  const searchQueries = UVPQueryGenerator.getQueriesForType(queries, 'search');
  const newsQueries = UVPQueryGenerator.getQueriesForType(queries, 'news');
  const videoQueries = UVPQueryGenerator.getQueriesForType(queries, 'video');
  const socialQueries = UVPQueryGenerator.getQueriesForType(queries, 'social');
  const aiQueries = UVPQueryGenerator.getQueriesForType(queries, 'ai');

  const isLocal = ['local_b2b_service', 'local_b2c_service', 'regional_b2c_retail'].includes(category);
  const isB2B = ['local_b2b_service', 'regional_b2b_agency', 'national_saas_b2b'].includes(category);
  const isNational = ['national_saas_b2b', 'national_product_b2c'].includes(category);
  const isRetail = ['regional_b2c_retail', 'national_product_b2c'].includes(category);

  // =========================================================================
  // UNIVERSAL APIS (All Categories)
  // =========================================================================

  // 1. Serper Search
  updateProgress('Searching web trends...', 10);
  try {
    for (const q of searchQueries.slice(0, 2)) {
      const results = await SerperAPI.searchGoogle(q.query);
      if (results?.length) {
        apisUsed.push('serper_search');
        results.slice(0, 5).forEach((r, idx) => {
          allTrends.push({
            id: `serper-${Date.now()}-${idx}`,
            title: r.title || 'Search Result',
            description: r.snippet || '',
            source: 'serper',
            sourceUrl: r.link,
            date: new Date().toISOString(),
            queryIntent: q.intent // Phase 7: Track query intent
          });
        });
      }
    }
  } catch (err) {
    console.warn('[Trends] Serper search failed:', err);
  }

  // 2. Serper News
  updateProgress('Fetching industry news...', 20);
  try {
    for (const q of newsQueries.slice(0, 2)) {
      const results = await SerperAPI.getNews(q.query, isLocal ? location : undefined);
      if (results?.length) {
        apisUsed.push('serper_news');
        results.slice(0, 5).forEach((r, idx) => {
          allTrends.push({
            id: `news-${Date.now()}-${idx}`,
            title: r.title || 'News',
            description: r.snippet || '',
            source: 'news',
            sourceUrl: r.link,
            date: r.date || new Date().toISOString(),
            queryIntent: q.intent // Phase 7: Track query intent
          });
        });
      }
    }
  } catch (err) {
    console.warn('[Trends] News fetch failed:', err);
  }

  // 3. Serper Autocomplete (Related Searches)
  updateProgress('Finding related searches...', 25);
  try {
    const autocompleteResults = await SerperAPI.getAutocomplete(searchQueries[0]?.query || industry);
    if (autocompleteResults?.length) {
      apisUsed.push('serper_autocomplete');
      autocompleteResults.slice(0, 5).forEach((suggestion, idx) => {
        allTrends.push({
          id: `autocomplete-${Date.now()}-${idx}`,
          title: suggestion,
          description: `Trending search: "${suggestion}" - People are actively searching for this topic.`,
          source: 'autocomplete',
          date: new Date().toISOString(),
          queryIntent: searchQueries[0]?.intent || 'trend' // Phase 7
        });
      });
    }
  } catch (err) {
    console.warn('[Trends] Autocomplete failed:', err);
  }

  // 4. YouTube
  updateProgress('Analyzing video trends...', 35);
  try {
    const ytQuery = videoQueries[0]?.query || `${industry} trends`;
    const videos = await YouTubeAPI.searchVideos([ytQuery]);
    if (videos?.length) {
      apisUsed.push('youtube');
      videos.slice(0, 6).forEach((v, idx) => {
        allTrends.push({
          id: `youtube-${Date.now()}-${idx}`,
          title: v.title || 'Video',
          description: v.description || '',
          source: 'youtube',
          sourceUrl: `https://youtube.com/watch?v=${v.id}`,
          date: v.publishedAt || new Date().toISOString(),
          metadata: { viewCount: v.viewCount },
          queryIntent: videoQueries[0]?.intent || 'trend' // Phase 7
        });
      });
    }
  } catch (err) {
    console.warn('[Trends] YouTube fetch failed:', err);
  }

  // 5. Reddit
  updateProgress('Mining community discussions...', 45);
  try {
    const redditQuery = socialQueries[0]?.query || `${industry} challenges`;
    const redditResult = await redditAPI.mineIntelligence(redditQuery, { limit: 8 });
    if (redditResult?.insights?.length) {
      apisUsed.push('reddit');
      redditResult.insights.slice(0, 6).forEach((insight, idx) => {
        allTrends.push({
          id: `reddit-${Date.now()}-${idx}`,
          title: insight.painPoint || insight.desire || 'Reddit Discussion',
          description: insight.context?.substring(0, 300) || '',
          source: 'reddit',
          sourceUrl: insight.url,
          date: new Date().toISOString(),
          metadata: { upvotes: insight.upvotes },
          queryIntent: socialQueries[0]?.intent || 'pain_point' // Phase 7: Reddit is typically pain_point
        });
      });
    }
  } catch (err) {
    console.warn('[Trends] Reddit fetch failed:', err);
  }

  // 6. Perplexity AI
  updateProgress('Generating AI insights...', 55);
  try {
    const aiQuery = aiQueries[0]?.query || `What are emerging trends in ${industry}?`;
    const aiResult = await perplexityAPI.getIndustryInsights({
      query: aiQuery,
      context: {},
      max_results: 5
    });
    if (aiResult?.insights?.length) {
      apisUsed.push('perplexity');
      aiResult.insights.forEach((insight, idx) => {
        allTrends.push({
          id: `perplexity-${Date.now()}-${idx}`,
          title: insight.substring(0, 100).replace(/^\d+\.\s*/, '').trim(),
          description: insight.length > 100 ? insight.substring(100) : insight,
          source: 'perplexity',
          date: new Date().toISOString(),
          queryIntent: aiQueries[0]?.intent || 'trend' // Phase 7
        });
      });
    }
  } catch (err) {
    console.warn('[Trends] Perplexity fetch failed:', err);
  }

  // =========================================================================
  // LOCAL CATEGORY APIS (1, 2, 4)
  // =========================================================================

  if (isLocal && location) {
    // Weather API - Weather-triggered opportunities
    updateProgress('Checking weather opportunities...', 60);
    try {
      const weatherOpportunities = await WeatherAPI.detectWeatherOpportunities(location, industry);
      if (weatherOpportunities?.length) {
        apisUsed.push('weather');
        weatherOpportunities.forEach((opp, idx) => {
          allTrends.push({
            id: `weather-${Date.now()}-${idx}`,
            title: opp.title,
            description: opp.description,
            source: 'weather',
            date: new Date().toISOString(),
            metadata: {
              urgency: opp.urgency,
              impactScore: opp.impact_score,
              suggestedActions: opp.suggested_actions
            },
            queryIntent: 'opportunity' // Phase 7: Weather is opportunity-based
          });
        });
      }
    } catch (err) {
      console.warn('[Trends] Weather API failed:', err);
    }

    // Serper Places - Local competitor activity
    updateProgress('Scanning local businesses...', 65);
    try {
      const places = await SerperAPI.getPlaces(industry, location);
      if (places?.length) {
        apisUsed.push('serper_places');
        // Extract trends from top local businesses
        const topPlaces = places.slice(0, 5);
        if (topPlaces.length > 0) {
          const avgRating = topPlaces.reduce((sum, p) => sum + (p.rating || 0), 0) / topPlaces.length;
          const totalReviews = topPlaces.reduce((sum, p) => sum + (p.reviewCount || 0), 0);
          allTrends.push({
            id: `places-summary-${Date.now()}`,
            title: `Local ${industry} Market Activity: ${topPlaces.length} Competitors`,
            description: `Average rating: ${avgRating.toFixed(1)}★ across ${totalReviews} reviews. Top competitors: ${topPlaces.map(p => p.name).join(', ')}`,
            source: 'places',
            date: new Date().toISOString(),
            metadata: { places: topPlaces },
            queryIntent: 'industry' // Phase 7: Local market is industry-level
          });
        }
      }
    } catch (err) {
      console.warn('[Trends] Serper Places failed:', err);
    }
  }

  // =========================================================================
  // B2B CATEGORY APIS (1, 3, 5)
  // =========================================================================

  if (isB2B) {
    // LinkedIn thought leadership trends (via OutScraper or Serper)
    updateProgress('Analyzing B2B thought leadership...', 68);
    try {
      // Use Serper's LinkedIn search capability
      const linkedInQuery = `site:linkedin.com/posts ${industry} trends`;
      const linkedInResults = await SerperAPI.searchGoogle(linkedInQuery);
      if (linkedInResults?.length) {
        apisUsed.push('linkedin_search');
        linkedInResults.slice(0, 4).forEach((r, idx) => {
          allTrends.push({
            id: `linkedin-${Date.now()}-${idx}`,
            title: r.title?.replace(' | LinkedIn', '') || 'LinkedIn Post',
            description: r.snippet || '',
            source: 'linkedin',
            sourceUrl: r.link,
            date: new Date().toISOString(),
            queryIntent: 'industry' // Phase 7: LinkedIn is industry thought leadership
          });
        });
      }
    } catch (err) {
      console.warn('[Trends] LinkedIn search failed:', err);
    }
  }

  // =========================================================================
  // NATIONAL CATEGORY APIS (5, 6)
  // =========================================================================

  if (isNational) {
    // Semrush - Keyword opportunities and trends
    updateProgress('Analyzing SEO trends...', 72);
    try {
      const domain = uvp.targetCustomer?.marketGeography?.focusMarkets?.[0] || '';
      if (domain) {
        const seoData = await SemrushAPI.getKeywordOpportunities(domain);
        if (seoData?.length) {
          apisUsed.push('semrush');
          // Group opportunities into trend insights
          const risingKeywords = seoData.filter(k => k.opportunity === 'quick-win' || k.opportunity === 'high-value');
          if (risingKeywords.length > 0) {
            allTrends.push({
              id: `semrush-${Date.now()}`,
              title: `Rising SEO Opportunities: ${risingKeywords.length} Keywords`,
              description: `Top opportunities: ${risingKeywords.slice(0, 3).map(k => `"${k.keyword}" (${k.searchVolume}/mo)`).join(', ')}`,
              source: 'semrush',
              date: new Date().toISOString(),
              metadata: { keywords: risingKeywords },
              queryIntent: 'opportunity' // Phase 7: SEO is opportunity
            });
          }
        }
      }
    } catch (err) {
      console.warn('[Trends] Semrush failed:', err);
    }

    // Serper Trends - Keyword trend direction
    updateProgress('Checking keyword trends...', 75);
    try {
      const trendData = await SerperAPI.getTrends(industry);
      if (trendData?.relatedQueries?.length) {
        apisUsed.push('serper_trends');
        allTrends.push({
          id: `trends-${Date.now()}`,
          title: `${industry} Trend Direction: ${trendData.trend}`,
          description: `Related rising queries: ${trendData.relatedQueries.slice(0, 5).join(', ')}. Growth: ${trendData.growthPercentage || 0}%`,
          source: 'trends',
          date: new Date().toISOString(),
          metadata: trendData,
          queryIntent: 'industry' // Phase 7: Trend direction is industry-level
        });
      }
    } catch (err) {
      console.warn('[Trends] Serper Trends failed:', err);
    }
  }

  // =========================================================================
  // RETAIL/PRODUCT CATEGORY APIS (4, 6)
  // =========================================================================

  if (isRetail) {
    // Serper Shopping - Product trends
    updateProgress('Scanning product trends...', 78);
    try {
      const productKeywords = keywords.products[0] || industry;
      const shoppingResults = await SerperAPI.getShopping(productKeywords);
      if (shoppingResults?.length) {
        apisUsed.push('serper_shopping');
        // Analyze pricing and availability trends
        const avgPrice = shoppingResults.reduce((sum, p) => {
          const price = parseFloat(p.price?.replace(/[^0-9.]/g, '') || '0');
          return sum + price;
        }, 0) / shoppingResults.length;

        const inStockCount = shoppingResults.filter(p => p.inStock).length;

        allTrends.push({
          id: `shopping-${Date.now()}`,
          title: `${productKeywords} Market: ${shoppingResults.length} Products Analyzed`,
          description: `Average price point: $${avgPrice.toFixed(2)}. In-stock rate: ${Math.round(inStockCount/shoppingResults.length*100)}%. Top sources: ${[...new Set(shoppingResults.slice(0,3).map(p => p.source))].join(', ')}`,
          source: 'shopping',
          date: new Date().toISOString(),
          metadata: { products: shoppingResults.slice(0, 5) },
          queryIntent: 'product' // Phase 7: Shopping is product-focused
        });
      }
    } catch (err) {
      console.warn('[Trends] Serper Shopping failed:', err);
    }
  }

  console.log(`[Trends] Fetched ${allTrends.length} trends from ${apisUsed.length} APIs:`, [...new Set(apisUsed)]);

  return {
    trends: allTrends,
    apisUsed: [...new Set(apisUsed)]
  };
}

// ============================================================================
// PHASE 8: DEEP MINING FETCH (PARALLEL EXECUTION)
// ============================================================================

/**
 * Fetch trends using deep mining mode with parallel API execution
 * Generates 50-100 queries and runs APIs concurrently
 */
async function fetchDeepMiningTrends(
  category: BusinessCategory,
  queries: GeneratedQuery[],
  uvp: CompleteUVP,
  updateProgress: (msg: string, pct: number) => void
): Promise<CategoryFetchResult> {
  const allTrends: RawTrendItem[] = [];
  const apisUsed: string[] = [];
  const keywords = extractUVPKeywords(uvp);
  const location = keywords.location[0] || '';
  const industry = keywords.industry[0] || 'business';

  console.log(`[DeepMining] Starting with ${queries.length} queries`);

  // Group queries by type
  const searchQueries = UVPQueryGenerator.getQueriesForType(queries, 'search');
  const newsQueries = UVPQueryGenerator.getQueriesForType(queries, 'news');
  const videoQueries = UVPQueryGenerator.getQueriesForType(queries, 'video');
  const socialQueries = UVPQueryGenerator.getQueriesForType(queries, 'social');
  const aiQueries = UVPQueryGenerator.getQueriesForType(queries, 'ai');

  const isLocal = ['local_b2b_service', 'local_b2c_service', 'regional_b2c_retail'].includes(category);
  const isB2B = ['local_b2b_service', 'regional_b2b_agency', 'national_saas_b2b'].includes(category);
  const isNational = ['national_saas_b2b', 'national_product_b2c'].includes(category);

  updateProgress('Deep mining: Launching parallel API calls...', 10);

  // =========================================================================
  // PARALLEL API EXECUTION - All universal APIs at once
  // =========================================================================

  const apiPromises: Promise<{ source: string; trends: RawTrendItem[] }>[] = [];

  // 1. Serper Search (multiple queries in parallel)
  searchQueries.slice(0, 8).forEach((q, idx) => {
    apiPromises.push(
      SerperAPI.searchGoogle(q.query)
        .then(results => ({
          source: 'serper_search',
          trends: (results || []).slice(0, 5).map((r, i) => ({
            id: `serper-dm-${Date.now()}-${idx}-${i}`,
            title: r.title || 'Search Result',
            description: r.snippet || '',
            source: 'serper',
            sourceUrl: r.link,
            date: new Date().toISOString(),
            queryIntent: q.intent as QueryIntent
          }))
        }))
        .catch(() => ({ source: 'serper_search', trends: [] }))
    );
  });

  // 2. Serper News (multiple queries)
  newsQueries.slice(0, 4).forEach((q, idx) => {
    apiPromises.push(
      SerperAPI.getNews(q.query, isLocal ? location : undefined)
        .then(results => ({
          source: 'serper_news',
          trends: (results || []).slice(0, 5).map((r, i) => ({
            id: `news-dm-${Date.now()}-${idx}-${i}`,
            title: r.title || 'News',
            description: r.snippet || '',
            source: 'news',
            sourceUrl: r.link,
            date: r.date || new Date().toISOString(),
            queryIntent: q.intent as QueryIntent
          }))
        }))
        .catch(() => ({ source: 'serper_news', trends: [] }))
    );
  });

  // 3. Serper Autocomplete (multiple queries for "what people search")
  searchQueries.slice(0, 5).forEach((q, idx) => {
    apiPromises.push(
      SerperAPI.getAutocomplete(q.query)
        .then(suggestions => ({
          source: 'serper_autocomplete',
          trends: (suggestions || []).slice(0, 5).map((suggestion, i) => ({
            id: `autocomplete-dm-${Date.now()}-${idx}-${i}`,
            title: suggestion,
            description: `Trending search: "${suggestion}" - People are actively searching for this.`,
            source: 'autocomplete',
            date: new Date().toISOString(),
            queryIntent: q.intent as QueryIntent
          }))
        }))
        .catch(() => ({ source: 'serper_autocomplete', trends: [] }))
    );
  });

  // 4. YouTube (multiple video queries)
  videoQueries.slice(0, 3).forEach((q, idx) => {
    apiPromises.push(
      YouTubeAPI.searchVideos([q.query])
        .then(videos => ({
          source: 'youtube',
          trends: (videos || []).slice(0, 5).map((v, i) => ({
            id: `youtube-dm-${Date.now()}-${idx}-${i}`,
            title: v.title || 'Video',
            description: v.description || '',
            source: 'youtube',
            sourceUrl: `https://youtube.com/watch?v=${v.id}`,
            date: v.publishedAt || new Date().toISOString(),
            metadata: { viewCount: v.viewCount },
            queryIntent: q.intent as QueryIntent
          }))
        }))
        .catch(() => ({ source: 'youtube', trends: [] }))
    );
  });

  // 5. Reddit (multiple social queries)
  socialQueries.slice(0, 2).forEach((q, idx) => {
    apiPromises.push(
      redditAPI.mineIntelligence(q.query, { limit: 8 })
        .then(result => ({
          source: 'reddit',
          trends: (result?.insights || []).slice(0, 5).map((insight, i) => ({
            id: `reddit-dm-${Date.now()}-${idx}-${i}`,
            title: insight.painPoint || insight.desire || 'Reddit Discussion',
            description: insight.context?.substring(0, 300) || '',
            source: 'reddit',
            sourceUrl: insight.url,
            date: new Date().toISOString(),
            metadata: { upvotes: insight.upvotes },
            queryIntent: q.intent as QueryIntent
          }))
        }))
        .catch(() => ({ source: 'reddit', trends: [] }))
    );
  });

  // 6. Perplexity AI (multiple AI queries)
  aiQueries.slice(0, 2).forEach((q, idx) => {
    apiPromises.push(
      perplexityAPI.getIndustryInsights({ query: q.query, context: {}, max_results: 5 })
        .then(result => ({
          source: 'perplexity',
          trends: (result?.insights || []).map((insight, i) => ({
            id: `perplexity-dm-${Date.now()}-${idx}-${i}`,
            title: insight.substring(0, 100).replace(/^\d+\.\s*/, '').trim(),
            description: insight.length > 100 ? insight.substring(100) : insight,
            source: 'perplexity',
            date: new Date().toISOString(),
            queryIntent: q.intent as QueryIntent
          }))
        }))
        .catch(() => ({ source: 'perplexity', trends: [] }))
    );
  });

  // 7. HackerNews (Phase 8 - free API for tech/B2B)
  if (isB2B || isNational) {
    const hnTopics = [industry, ...keywords.productUseCases.slice(0, 2).map(p => p.useCase)];
    apiPromises.push(
      HackerNewsAPI.searchMultiple(hnTopics, { hitsPerTopic: 8, minPoints: 5 })
        .then(insights => ({
          source: 'hackernews',
          trends: insights.slice(0, 15).map((insight, i) => ({
            id: insight.id,
            title: insight.title,
            description: insight.description,
            source: 'hackernews',
            sourceUrl: insight.url,
            date: insight.date,
            metadata: { points: insight.points, comments: insight.comments },
            queryIntent: 'trend' as QueryIntent
          }))
        }))
        .catch(() => ({ source: 'hackernews', trends: [] }))
    );
  }

  // 8. Serper Trends (Google Trends data for velocity)
  if (isNational) {
    apiPromises.push(
      SerperAPI.getTrends(industry)
        .then(trendData => ({
          source: 'serper_trends',
          trends: trendData?.relatedQueries?.length ? [{
            id: `trends-dm-${Date.now()}`,
            title: `${industry} Trend Direction: ${trendData.trend}`,
            description: `Related rising queries: ${trendData.relatedQueries.slice(0, 5).join(', ')}. Growth: ${trendData.growthPercentage || 0}%`,
            source: 'trends',
            date: new Date().toISOString(),
            metadata: trendData,
            queryIntent: 'industry' as QueryIntent
          }] : []
        }))
        .catch(() => ({ source: 'serper_trends', trends: [] }))
    );
  }

  // 9. LinkedIn Search (for B2B)
  if (isB2B) {
    apiPromises.push(
      SerperAPI.searchGoogle(`site:linkedin.com/posts ${industry} trends`)
        .then(results => ({
          source: 'linkedin_search',
          trends: (results || []).slice(0, 5).map((r, i) => ({
            id: `linkedin-dm-${Date.now()}-${i}`,
            title: r.title?.replace(' | LinkedIn', '') || 'LinkedIn Post',
            description: r.snippet || '',
            source: 'linkedin',
            sourceUrl: r.link,
            date: new Date().toISOString(),
            queryIntent: 'industry' as QueryIntent
          }))
        }))
        .catch(() => ({ source: 'linkedin_search', trends: [] }))
    );
  }

  // 10. BuzzSumo - Top performing content trends (ALL categories)
  apiPromises.push(
    buzzsumoAPI.analyzeContent(industry, { numResults: 20, days: 14 })
      .then(result => ({
        source: 'buzzsumo',
        trends: (result?.topContent || []).slice(0, 10).map((content, i) => ({
          id: `buzzsumo-dm-${Date.now()}-${i}`,
          title: content.title || 'High-Engagement Content',
          description: `${content.totalShares.toLocaleString()} total shares. Published: ${new Date(content.publishedDate).toLocaleDateString()}`,
          source: 'buzzsumo',
          sourceUrl: content.url,
          date: content.publishedDate || new Date().toISOString(),
          metadata: {
            totalShares: content.totalShares,
            facebookShares: content.facebookShares,
            twitterShares: content.twitterShares,
            linkedinShares: content.linkedinShares,
            wordCount: content.wordCount,
          },
          queryIntent: 'trend' as QueryIntent
        }))
      }))
      .catch((err) => {
        console.warn('[DeepMining] BuzzSumo failed:', err);
        return { source: 'buzzsumo', trends: [] };
      })
  );

  // 11. BuzzSumo Trending - Emerging topics
  apiPromises.push(
    buzzsumoAPI.getTrending({ topic: industry, hours: 48 })
      .then(result => ({
        source: 'buzzsumo_trending',
        trends: [
          ...(result?.emergingTopics || []).slice(0, 5).map((topic, i) => ({
            id: `buzzsumo-emerging-${Date.now()}-${i}`,
            title: `Emerging: ${topic}`,
            description: `Rising topic in ${industry} - high velocity content gaining traction.`,
            source: 'buzzsumo',
            date: new Date().toISOString(),
            queryIntent: 'trend' as QueryIntent
          })),
          ...(result?.trends || []).slice(0, 3).map((trend, i) => ({
            id: `buzzsumo-trend-${Date.now()}-${i}`,
            title: trend.topic,
            description: `Velocity: ${trend.velocity.toFixed(1)}x growth. ${trend.articleCount} articles, ${trend.totalEngagements.toLocaleString()} engagements.`,
            source: 'buzzsumo',
            date: trend.peakDay || new Date().toISOString(),
            metadata: {
              velocity: trend.velocity,
              articleCount: trend.articleCount,
              totalEngagements: trend.totalEngagements,
              avgEngagementsPerArticle: trend.avgEngagementsPerArticle,
            },
            queryIntent: 'trend' as QueryIntent
          }))
        ]
      }))
      .catch((err) => {
        console.warn('[DeepMining] BuzzSumo Trending failed:', err);
        return { source: 'buzzsumo_trending', trends: [] };
      })
  );

  updateProgress('Deep mining: Waiting for API responses...', 40);

  // Execute all API calls in parallel with timeout
  const results = await Promise.allSettled(
    apiPromises.map(p =>
      Promise.race([
        p,
        new Promise<{ source: string; trends: RawTrendItem[] }>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 10000)
        )
      ])
    )
  );

  updateProgress('Deep mining: Processing results...', 70);

  // Collect results
  results.forEach((result, idx) => {
    if (result.status === 'fulfilled') {
      const { source, trends } = result.value;
      if (trends.length > 0) {
        if (!apisUsed.includes(source)) {
          apisUsed.push(source);
        }
        allTrends.push(...trends);
      }
    } else {
      console.warn(`[DeepMining] API call ${idx} failed:`, result.reason);
    }
  });

  console.log(`[DeepMining] Completed: ${allTrends.length} trends from ${apisUsed.length} APIs`);
  console.log(`[DeepMining] APIs used:`, apisUsed);

  return {
    trends: allTrends,
    apisUsed: [...new Set(apisUsed)]
  };
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useStreamingTrends(options: UseStreamingTrendsOptions = {}) {
  const { minSources = 2, relevanceThreshold = 50, deepMining = true } = options; // Phase 8: Deep mining enabled by default

  const [state, setState] = useState<TrendsPipelineState>({
    stage: 'idle',
    progress: 0,
    statusMessage: 'Ready to fetch trends',
    apisUsed: []
  });

  const [result, setResult] = useState<TrendsPipelineResult | null>(() => loadCachedResult());

  const updateState = useCallback((updates: Partial<TrendsPipelineState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateProgress = useCallback((msg: string, pct: number) => {
    updateState({ statusMessage: msg, progress: pct });
  }, [updateState]);

  // ============================================================================
  // MAIN PIPELINE
  // ============================================================================

  const executePipeline = useCallback(async (uvp: CompleteUVP) => {
    console.log('[useStreamingTrends] Starting Trends 2.0 pipeline', deepMining ? '(Deep Mining Mode)' : '(Standard Mode)');

    // DEBUG: Log UVP being used to verify correct brand
    const uvpDebugInfo = {
      valueProposition: uvp.valuePropositionStatement?.substring(0, 100),
      targetIndustry: uvp.targetCustomer?.industry,
      productNames: uvp.productsServices?.categories?.flatMap(c => c.items.map(i => i.name)).slice(0, 3),
      targetStatement: uvp.targetCustomer?.statement?.substring(0, 80)
    };
    console.log('[useStreamingTrends] 🔍 UVP DEBUG:', uvpDebugInfo);

    try {
      // Stage 1: Generate Queries
      updateState({
        stage: 'generating_queries',
        progress: 5,
        statusMessage: deepMining ? 'Deep mining: Generating expanded queries...' : 'Generating UVP-informed queries...',
        apisUsed: []
      });

      // Detect category first (needed for outcome queries)
      const categoryResult = TrendCategoryRouter.detectCategory(uvp);
      const category = categoryResult.category;
      console.log('[useStreamingTrends] Detected category:', category, 'confidence:', categoryResult.confidence);
      console.log('[useStreamingTrends] Category signals:', categoryResult.signals);

      // Phase 10: Use balanced query generator for diversified results (use case, industry, outcome, persona)
      // Phase 8: Use deep mining query generator for 50-100 queries
      // Phase 11: Add outcome-driven queries for customer transformation focus
      const baseQueries = deepMining
        ? UVPQueryGenerator.generateBalancedQueries(uvp) // Phase 10: Balanced queries
        : UVPQueryGenerator.generateQueries(uvp);

      // Phase 11: Generate outcome-driven queries (30% of total query mix)
      const keywords = extractUVPKeywords(uvp);
      const primaryIndustry = keywords.industry[0] || 'business';
      const outcomeQueries = OutcomeQueryGenerator.generateQueries(uvp, category, primaryIndustry);

      // Merge queries: 70% base queries, 30% outcome queries
      const baseCount = Math.ceil(baseQueries.length * 0.7);
      const outcomeCount = Math.ceil(outcomeQueries.length * 0.3);
      const queries = [
        ...baseQueries.slice(0, baseCount),
        ...outcomeQueries.slice(0, outcomeCount)
      ].sort((a, b) => b.priority - a.priority);

      console.log('[useStreamingTrends] Generated queries:', queries.length,
        `(${baseCount} base + ${Math.min(outcomeCount, outcomeQueries.length)} outcome)`,
        deepMining ? '(balanced/phase11)' : '(standard/phase11)');

      // Stage 2: Fetch Raw Trends (Category-Specific or Deep Mining)
      updateState({
        stage: 'fetching',
        progress: 10,
        statusMessage: deepMining
          ? `Deep mining: Parallel fetch for ${CATEGORY_CONFIGS[category].label}...`
          : `Fetching trends for ${CATEGORY_CONFIGS[category].label}...`
      });

      // Phase 8: Use deep mining fetch for parallel execution
      const fetchResult = deepMining
        ? await fetchDeepMiningTrends(category, queries, uvp, updateProgress)
        : await fetchCategorySpecificTrends(category, queries, uvp, updateProgress);

      const rawTrends = fetchResult.trends;
      const apisUsed = fetchResult.apisUsed;

      if (rawTrends.length === 0) {
        throw new Error('No trends fetched from any source');
      }

      console.log(`[useStreamingTrends] Fetched ${rawTrends.length} raw trends from ${apisUsed.length} APIs`);
      updateState({ apisUsed });

      // Stage 3: Validate (Multi-Source)
      updateState({
        stage: 'validating',
        progress: 80,
        statusMessage: 'Validating across sources...'
      });

      const validatedTrends = MultiSourceValidator.validate(rawTrends, { minSources });

      // Stage 4: Score Relevance
      updateState({
        stage: 'scoring',
        progress: 85,
        statusMessage: 'Scoring brand relevance...'
      });

      const scoredTrends = TrendRelevanceScorer.scoreTrends(validatedTrends, uvp, { relevanceThreshold }, category);

      // PHASE 11 FIX: Filter out irrelevant trends BEFORE passing to next stages
      // This is where HVAC, Coinbase, etc. get removed
      let relevantTrends = scoredTrends.filter(t => t.isRelevant);
      console.log(`[useStreamingTrends] Filtered to ${relevantTrends.length}/${scoredTrends.length} relevant trends`);

      if (relevantTrends.length < 20) {
        // If fewer than 20 passed relevance filtering, supplement with top-scored trends
        const alreadyIncluded = new Set(relevantTrends.map(t => t.id));
        const supplemental = scoredTrends
          .filter(t => !alreadyIncluded.has(t.id))
          .slice(0, 50 - relevantTrends.length);
        relevantTrends = [...relevantTrends, ...supplemental];
        console.log(`[useStreamingTrends] Supplemented to ${relevantTrends.length} trends (was ${alreadyIncluded.size} relevant)`);
      }

      // Stage 5: EQ Prioritization
      updateState({
        stage: 'prioritizing',
        progress: 90,
        statusMessage: 'Applying psychological weights...'
      });

      const prioritizedTrends = EQTrendPrioritizer.prioritize(relevantTrends, uvp);

      // Stage 6: Lifecycle Detection
      const lifecycleTrends = TrendLifecycleDetector.detect(prioritizedTrends);

      // Stage 7: Trigger Matching
      updateState({
        stage: 'matching',
        progress: 95,
        statusMessage: 'Matching with customer triggers...'
      });

      const finalTrends = TriggersTrendMatcher.match(lifecycleTrends, uvp);

      // Calculate stats
      const lifecycleStats = TrendLifecycleDetector.getStats(lifecycleTrends);
      const matchStats = TriggersTrendMatcher.getStats(finalTrends);

      const stats: TrendsStats = {
        rawCount: rawTrends.length,
        validatedCount: validatedTrends.filter(t => t.isValidated).length,
        relevantCount: scoredTrends.filter(t => t.isRelevant).length,
        contentReadyCount: finalTrends.filter(t => t.isContentReady).length,
        lifecycleBreakdown: lifecycleStats.byStage,
        triggerBreakdown: matchStats.triggerTypeDistribution,
        avgRelevance: matchStats.avgMatchStrength,
        avgValidation: MultiSourceValidator.getStats(validatedTrends).avgValidationScore
      };

      // Create result
      const pipelineResult: TrendsPipelineResult = {
        trends: finalTrends,
        rawTrends,
        queries,
        category,
        stats,
        apisUsed
      };

      // Cache and update state
      saveCachedResult(pipelineResult);
      setResult(pipelineResult);

      updateState({
        stage: 'complete',
        progress: 100,
        statusMessage: `Found ${finalTrends.length} trends (${stats.contentReadyCount} content-ready) from ${apisUsed.length} sources`
      });

      console.log('[useStreamingTrends] Pipeline complete:', stats);
      console.log('[useStreamingTrends] APIs used:', apisUsed);

      return pipelineResult;

    } catch (err) {
      console.error('[useStreamingTrends] Pipeline error:', err);
      updateState({
        stage: 'error',
        progress: 0,
        statusMessage: 'Pipeline failed',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
      throw err;
    }
  }, [updateState, updateProgress, minSources, relevanceThreshold, deepMining]);

  // ============================================================================
  // CLEAR CACHE
  // ============================================================================

  const clearCache = useCallback(() => {
    clearCachedResult(); // Uses brand-specific cache key + clears old generic key
    setResult(null);
    updateState({
      stage: 'idle',
      progress: 0,
      statusMessage: 'Cache cleared',
      apisUsed: []
    });
  }, [updateState]);

  // ============================================================================
  // DERIVED STATE
  // ============================================================================

  const hasCachedData = useMemo(() => result !== null && result.trends.length > 0, [result]);

  const contentReadyTrends = useMemo(() => {
    return result?.trends.filter(t => t.isContentReady) || [];
  }, [result]);

  const emergingTrends = useMemo(() => {
    return result?.trends.filter(t => t.lifecycle.stage === 'emerging') || [];
  }, [result]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    state,
    result,
    hasCachedData,
    contentReadyTrends,
    emergingTrends,
    executePipeline,
    clearCache,
    isLoading: state.stage !== 'idle' && state.stage !== 'complete' && state.stage !== 'error',
    isComplete: state.stage === 'complete',
    hasError: state.stage === 'error'
  };
}

export default useStreamingTrends;
