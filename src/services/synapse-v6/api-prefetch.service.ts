/**
 * API Pre-fetch Service - Phase 15
 *
 * Pre-fetches API data for all 6 tabs while user reviews final UVP.
 * Uses specialization data to build custom queries for each profile type.
 * Caches results to prefetch_cache table for instant tab population.
 *
 * Flow:
 * 1. Receives specialization data from SpecializationDetector
 * 2. Builds profile-specific queries for each tab
 * 3. Calls all 6 tab APIs in parallel (non-blocking)
 * 4. Caches results with 24hr TTL
 * 5. Returns cache_id for brand profile persistence
 *
 * Created: 2025-12-05
 */

import { supabase } from '@/lib/supabase';
import type {
  SpecializationData,
  PrefetchTab,
  PrefetchCache,
  SpecializedQueryContext,
  TabQueryConfig,
  BusinessProfileType,
} from '@/types/synapse/specialization.types';

// ============================================================================
// TAB API CONFIGURATIONS
// ============================================================================

interface TabApiConfig {
  tab: PrefetchTab;
  apis: string[];
  buildQuery: (spec: SpecializationData) => string[];
}

const TAB_CONFIGS: Record<PrefetchTab, TabApiConfig> = {
  voc: {
    tab: 'voc',
    // PHASE 20E: REMOVED perplexity-reviews - generates hallucinated quotes
    apis: ['apify-g2', 'apify-capterra', 'serper'],
    buildQuery: buildVoCQuery,
  },
  community: {
    tab: 'community',
    apis: ['reddit-professional', 'apify-linkedin', 'apify-twitter', 'hackernews'],
    buildQuery: buildCommunityQuery,
  },
  competitive: {
    tab: 'competitive',
    apis: ['semrush', 'serper'],
    buildQuery: buildCompetitiveQuery,
  },
  trends: {
    tab: 'trends',
    apis: ['perplexity', 'hackernews', 'newsapi'],
    buildQuery: buildTrendsQuery,
  },
  search: {
    tab: 'search',
    apis: ['semrush', 'serper-autocomplete'],
    buildQuery: buildSearchQuery,
  },
  local_timing: {
    tab: 'local_timing',
    apis: ['newsapi', 'sec-api-io', 'perplexity'],
    buildQuery: buildLocalTimingQuery,
  },
};

// ============================================================================
// QUERY BUILDERS
// ============================================================================

function buildVoCQuery(spec: SpecializationData): string[] {
  const queries: string[] = [];

  switch (spec.profile_type) {
    case 'local-service-b2c': {
      const s = spec as any;
      queries.push(
        `"${s.service_category}" "${s.niche_positioning}" reviews`,
        `"${s.service_type}" customer feedback`,
        `best ${s.service_type} ${s.location_radius} miles`,
      );
      break;
    }
    case 'local-service-b2b': {
      const s = spec as any;
      queries.push(
        `"commercial ${s.trade_type}" reviews`,
        `"${s.sector_served}" ${s.trade_type} contractors`,
        `${s.trade_type} service agreement reviews`,
      );
      break;
    }
    case 'regional-b2b-agency': {
      const s = spec as any;
      queries.push(
        `"${s.agency_type} agency" reviews`,
        `"${s.specialty_vertical}" ${s.agency_type} reviews`,
        `best ${s.agency_type} for ${s.client_size_focus}`,
      );
      break;
    }
    case 'regional-retail-b2c': {
      const s = spec as any;
      queries.push(
        `"${s.retail_category}" store reviews`,
        `"${s.price_positioning}" ${s.retail_category} customer feedback`,
        `${s.retail_category} shopping experience`,
      );
      break;
    }
    case 'national-saas-b2b': {
      const s = spec as any;
      // CRITICAL: Search by what it does for the INDUSTRY IT SELLS TO
      queries.push(
        `"${s.industry_sold_to}" "${s.product_function}" software reviews`,
        `"${s.unique_approach}" for ${s.industry_sold_to}`,
        `"${s.buyer_role}" ${s.product_function} tools`,
        `G2 reviews ${s.product_function} ${s.industry_sold_to}`,
      );
      break;
    }
    case 'national-product-b2c': {
      const s = spec as any;
      queries.push(
        `"${s.product_category}" "${s.differentiator_angle}" reviews`,
        `${s.target_demographic} ${s.product_category} feedback`,
        `best ${s.differentiator_angle} ${s.product_category} brand`,
      );
      break;
    }
    case 'global-saas-b2b': {
      const s = spec as any;
      queries.push(
        `"enterprise ${s.enterprise_function}" reviews`,
        `"${s.enterprise_function}" for ${s.scale_tier}`,
        `G2 Gartner ${s.enterprise_function} reviews`,
        `${s.compliance_requirements.join(' ')} compliant ${s.enterprise_function}`,
      );
      break;
    }
  }

  return queries;
}

function buildCommunityQuery(spec: SpecializationData): string[] {
  const queries: string[] = [];

  switch (spec.profile_type) {
    case 'local-service-b2c':
    case 'local-service-b2b': {
      queries.push(
        `r/smallbusiness ${spec.service_type}`,
        `r/Entrepreneur local ${spec.industry_vertical}`,
      );
      break;
    }
    case 'regional-b2b-agency': {
      const s = spec as any;
      queries.push(
        `r/${s.agency_type} agency tips`,
        `LinkedIn ${s.agency_type} ${s.specialty_vertical}`,
      );
      break;
    }
    case 'national-saas-b2b': {
      const s = spec as any;
      queries.push(
        `r/SaaS ${s.product_function}`,
        `r/sales ${s.industry_sold_to} automation`,
        `HackerNews ${s.unique_approach}`,
        `LinkedIn ${s.buyer_role} discussions`,
      );
      break;
    }
    case 'national-product-b2c': {
      const s = spec as any;
      queries.push(
        `r/${s.product_category} recommendations`,
        `TikTok ${s.differentiator_angle} ${s.product_category}`,
      );
      break;
    }
    case 'global-saas-b2b': {
      const s = spec as any;
      queries.push(
        `r/CIO ${s.enterprise_function}`,
        `r/ITManagers enterprise ${s.enterprise_function}`,
        `HackerNews ${s.enterprise_function} migration`,
      );
      break;
    }
    default:
      queries.push(`${spec.industry_vertical} community discussions`);
  }

  return queries;
}

function buildCompetitiveQuery(spec: SpecializationData): string[] {
  const queries: string[] = [];

  // Add detected competitors
  if (spec.detected_competitors.length > 0) {
    queries.push(`"${spec.detected_competitors[0]}" vs alternatives`);
    queries.push(`${spec.detected_competitors.join(' OR ')} comparison`);
  }

  // Profile-specific competitive queries
  switch (spec.profile_type) {
    case 'national-saas-b2b': {
      const s = spec as any;
      queries.push(
        `${s.product_function} software comparison ${s.industry_sold_to}`,
        `alternatives to ${s.product_function} platforms`,
      );
      break;
    }
    case 'global-saas-b2b': {
      const s = spec as any;
      queries.push(
        `Gartner Magic Quadrant ${s.enterprise_function}`,
        `Forrester Wave ${s.enterprise_function}`,
      );
      break;
    }
    default:
      queries.push(`${spec.service_type} competitors ${spec.industry_vertical}`);
  }

  return queries;
}

function buildTrendsQuery(spec: SpecializationData): string[] {
  const queries: string[] = [];

  queries.push(
    `${spec.industry_vertical} trends 2025`,
    `${spec.service_type} industry news`,
  );

  // Profile-specific trends
  switch (spec.profile_type) {
    case 'national-saas-b2b': {
      const s = spec as any;
      queries.push(
        `${s.industry_sold_to} ${s.product_function} trends 2025`,
        `${s.unique_approach} market growth`,
      );
      break;
    }
    case 'global-saas-b2b': {
      const s = spec as any;
      queries.push(
        `enterprise ${s.enterprise_function} market trends`,
        `${s.compliance_requirements.join(' ')} compliance updates`,
      );
      break;
    }
    default:
      queries.push(`${spec.industry_vertical} market outlook`);
  }

  return queries;
}

function buildSearchQuery(spec: SpecializationData): string[] {
  return [
    `${spec.service_type} ${spec.industry_vertical}`,
    `best ${spec.service_type}`,
    `${spec.niche} ${spec.service_type}`,
    `how to choose ${spec.service_type}`,
  ];
}

function buildLocalTimingQuery(spec: SpecializationData): string[] {
  const queries: string[] = [];

  switch (spec.profile_type) {
    case 'local-service-b2c':
    case 'local-service-b2b':
    case 'regional-retail-b2c': {
      queries.push(
        `${spec.industry_vertical} seasonal trends`,
        `local ${spec.service_type} busy season`,
      );
      break;
    }
    case 'national-saas-b2b':
    case 'global-saas-b2b': {
      const s = spec as any;
      queries.push(
        `${s.industry_sold_to || s.enterprise_function} budget season`,
        `${s.industry_sold_to || s.enterprise_function} fiscal year planning`,
        `SEC filings ${s.industry_sold_to || spec.industry_vertical}`,
      );
      break;
    }
    default:
      queries.push(`${spec.industry_vertical} timing signals`);
  }

  return queries;
}

// ============================================================================
// API PREFETCH SERVICE CLASS
// ============================================================================

export class ApiPrefetchService {
  private isRunning = false;
  private currentBrandId: string | null = null;

  /**
   * Start pre-fetching APIs for a brand
   * Non-blocking - returns immediately, fetches in background
   */
  async startPrefetch(
    brandId: string,
    specialization: SpecializationData
  ): Promise<{ cacheId: string; started: boolean }> {
    // Prevent duplicate runs
    if (this.isRunning && this.currentBrandId === brandId) {
      console.log('[ApiPrefetch] Already running for brand:', brandId);
      return { cacheId: '', started: false };
    }

    this.isRunning = true;
    this.currentBrandId = brandId;

    try {
      // Create cache record
      const cacheId = await this.createCacheRecord(brandId, specialization);

      // Start background fetch (non-blocking)
      this.fetchAllTabsBackground(cacheId, specialization);

      return { cacheId, started: true };
    } catch (error) {
      console.error('[ApiPrefetch] Failed to start:', error);
      this.isRunning = false;
      return { cacheId: '', started: false };
    }
  }

  /**
   * Create initial cache record
   */
  private async createCacheRecord(
    brandId: string,
    specialization: SpecializationData
  ): Promise<string> {
    const queryContext: Record<PrefetchTab, string[]> = {
      voc: TAB_CONFIGS.voc.buildQuery(specialization),
      community: TAB_CONFIGS.community.buildQuery(specialization),
      competitive: TAB_CONFIGS.competitive.buildQuery(specialization),
      trends: TAB_CONFIGS.trends.buildQuery(specialization),
      search: TAB_CONFIGS.search.buildQuery(specialization),
      local_timing: TAB_CONFIGS.local_timing.buildQuery(specialization),
    };

    const { data, error } = await supabase
      .from('prefetch_cache')
      .insert({
        brand_id: brandId,
        status: 'pending',
        query_context: {
          specialization,
          queries_per_tab: queryContext,
        },
        specialization_used: specialization,
        tab_data: {},
      })
      .select('id')
      .single();

    if (error) {
      console.error('[ApiPrefetch] Failed to create cache record:', error);
      throw error;
    }

    console.log('[ApiPrefetch] Created cache record:', data.id);
    return data.id;
  }

  /**
   * Fetch all tabs in background
   * This runs asynchronously without blocking
   */
  private async fetchAllTabsBackground(
    cacheId: string,
    specialization: SpecializationData
  ): Promise<void> {
    console.log('[ApiPrefetch] Starting background fetch for cache:', cacheId);

    try {
      // Mark as fetching
      await supabase
        .from('prefetch_cache')
        .update({ status: 'fetching' })
        .eq('id', cacheId);

      // Build tab configs
      const tabConfigs: TabQueryConfig[] = Object.values(TAB_CONFIGS).map(config => ({
        tab: config.tab,
        queries: config.buildQuery(specialization),
        apis: config.apis,
        context: this.buildQueryContext(specialization),
      }));

      // Fetch all tabs in parallel
      const results = await Promise.allSettled(
        tabConfigs.map(config => this.fetchTabData(config))
      );

      // Aggregate results
      const tabData: Record<string, any> = {};
      let completedCount = 0;

      results.forEach((result, index) => {
        const tab = tabConfigs[index].tab;
        if (result.status === 'fulfilled') {
          tabData[tab] = result.value;
          completedCount++;
        } else {
          tabData[tab] = {
            results: [],
            query: tabConfigs[index].queries[0] || '',
            fetched_at: new Date().toISOString(),
            result_count: 0,
            error: result.reason?.message || 'Fetch failed',
          };
        }
      });

      // Update cache with results
      await supabase
        .from('prefetch_cache')
        .update({
          status: 'complete',
          tab_data: tabData,
          tabs_completed: completedCount,
        })
        .eq('id', cacheId);

      console.log('[ApiPrefetch] ✅ Background fetch complete:', {
        cacheId,
        tabsCompleted: completedCount,
      });
    } catch (error) {
      console.error('[ApiPrefetch] Background fetch failed:', error);

      // Mark as failed
      await supabase
        .from('prefetch_cache')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', cacheId);
    } finally {
      this.isRunning = false;
      this.currentBrandId = null;
    }
  }

  /**
   * Fetch data for a single tab
   */
  private async fetchTabData(config: TabQueryConfig): Promise<{
    results: any[];
    query: string;
    fetched_at: string;
    result_count: number;
  }> {
    console.log(`[ApiPrefetch] Fetching ${config.tab}:`, config.queries[0]);

    // For now, return mock data structure
    // In production, this would call the actual APIs
    // TODO: Integrate with actual API orchestrator

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

    return {
      results: [], // Will be populated by actual API calls
      query: config.queries[0] || '',
      fetched_at: new Date().toISOString(),
      result_count: 0,
    };
  }

  /**
   * Build query context from specialization
   */
  private buildQueryContext(spec: SpecializationData): SpecializedQueryContext {
    return {
      specialization: spec,
      search_terms: [spec.service_type, spec.niche, spec.industry_vertical],
      categories: [spec.industry_vertical],
      exclusions: spec.detected_competitors,
      priority_platforms: this.getPriorityPlatforms(spec.profile_type),
      psychology_triggers: ['pain', 'desire', 'fear', 'urgency'],
    };
  }

  /**
   * Get priority platforms for profile type
   */
  private getPriorityPlatforms(profileType: BusinessProfileType): string[] {
    switch (profileType) {
      case 'local-service-b2c':
        return ['google-maps', 'yelp', 'facebook'];
      case 'local-service-b2b':
        return ['google-maps', 'linkedin', 'industry-forums'];
      case 'regional-b2b-agency':
        return ['g2', 'clutch', 'linkedin'];
      case 'regional-retail-b2c':
        return ['google-maps', 'yelp', 'instagram'];
      case 'national-saas-b2b':
        return ['g2', 'capterra', 'reddit', 'hackernews'];
      case 'national-product-b2c':
        return ['amazon', 'trustpilot', 'tiktok', 'instagram'];
      case 'global-saas-b2b':
        return ['g2', 'gartner', 'forrester', 'linkedin'];
      default:
        return ['google', 'linkedin'];
    }
  }

  /**
   * Get cached data for a brand
   */
  async getCachedData(brandId: string): Promise<PrefetchCache | null> {
    const { data, error } = await supabase
      .from('prefetch_cache')
      .select('*')
      .eq('brand_id', brandId)
      .eq('status', 'complete')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[ApiPrefetch] Failed to get cached data:', error);
      return null;
    }

    return data;
  }

  /**
   * Check if prefetch is complete
   */
  async isPrefetchComplete(cacheId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('prefetch_cache')
      .select('status')
      .eq('id', cacheId)
      .single();

    if (error) return false;
    return data?.status === 'complete';
  }

  /**
   * Get prefetch status
   */
  async getPrefetchStatus(cacheId: string): Promise<{
    status: string;
    tabsCompleted: number;
    error?: string;
  }> {
    const { data, error } = await supabase
      .from('prefetch_cache')
      .select('status, tabs_completed, error_message')
      .eq('id', cacheId)
      .single();

    if (error) {
      return { status: 'unknown', tabsCompleted: 0 };
    }

    return {
      status: data?.status || 'unknown',
      tabsCompleted: data?.tabs_completed || 0,
      error: data?.error_message || undefined,
    };
  }
}

// Export singleton
export const apiPrefetchService = new ApiPrefetchService();
