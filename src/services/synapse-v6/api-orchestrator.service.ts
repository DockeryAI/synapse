// PRD Feature: SYNAPSE-V6
/**
 * V6 API Orchestrator
 *
 * Routes API calls based on brand profile type via Supabase Edge Functions.
 * Each profile type has different API priorities per tab.
 * UVP context is injected into all queries.
 *
 * Key principles:
 * - Profile type determines API selection
 * - UVP customizes queries (does NOT filter)
 * - Industry booster adds supplementary context
 * - All data flows to connection discovery
 */

import { EventEmitter } from 'events';
import { supabase } from '@/lib/supabase';
import type { BrandProfile, InsightTab, BusinessProfileType } from './brand-profile.service';
import { buildUVPContext, buildTabQuery, formatContextForPrompt, getQueryDepth, extractShortQuery, extractLocation, extractDomain } from './uvp-context-builder.service';
import { matchIndustryProfile, applyBoosterToContext, type IndustryBooster } from './industry-booster.service';
import type { CompleteUVP } from '@/types/uvp-flow.types';

// API result types
export interface ApiResult {
  apiName: string;
  tab: InsightTab;
  data: unknown;
  timestamp: number;
  duration: number;
  success: boolean;
  error?: string;
}

// Tab data structure
export interface TabData {
  tab: InsightTab;
  results: ApiResult[];
  loading: boolean;
  complete: boolean;
}

// Orchestrator events
export type OrchestratorEvent =
  | 'tab:loading'
  | 'tab:update'
  | 'tab:complete'
  | 'tab:error'
  | 'all:complete';

// Query type enum for API-specific query selection
type QueryType = 'short' | 'location' | 'domain' | 'full' | 'llm';

// Edge function configuration - maps API names to Supabase functions
interface EdgeFunctionConfig {
  functionName: string;
  timeout: number;
  queryType: QueryType; // Which query format this API needs
  transform?: (query: string, context: string, profileType: BusinessProfileType) => Record<string, unknown>;
}

// API to Edge Function mapping - queryType determines which query format is used
const EDGE_FUNCTION_MAP: Record<string, EdgeFunctionConfig> = {
  // Voice of Customer APIs - use short queries for search
  // V5 FIX: OutScraper expects query param, not business_name
  'outscraper': {
    functionName: 'fetch-outscraper',
    timeout: 15000,
    queryType: 'short',
    transform: (query) => ({
      query: query,
      limit: 10,
    }),
  },
  // V5 FIX: Use Serper site: searches for review platforms (working config)
  // These fake Apify actors don't exist - Serper site: searches actually work
  'apify-g2': {
    functionName: 'fetch-serper',
    timeout: 10000,
    queryType: 'short',
    transform: (query) => ({
      endpoint: '/search',
      params: { q: `"${query}" site:g2.com reviews`, num: 10 },
    }),
  },
  'apify-capterra': {
    functionName: 'fetch-serper',
    timeout: 10000,
    queryType: 'short',
    transform: (query) => ({
      endpoint: '/search',
      params: { q: `"${query}" site:capterra.com reviews`, num: 10 },
    }),
  },
  'apify-trustpilot': {
    functionName: 'fetch-serper',
    timeout: 10000,
    queryType: 'short',
    transform: (query) => ({
      endpoint: '/search',
      params: { q: `"${query}" site:trustpilot.com`, num: 10 },
    }),
  },
  // V5 FIX: Use Serper site: searches for review platforms
  'apify-amazon': {
    functionName: 'fetch-serper',
    timeout: 10000,
    queryType: 'short',
    transform: (query) => ({
      endpoint: '/search',
      params: { q: `"${query}" site:amazon.com reviews`, num: 10 },
    }),
  },
  'apify-yelp': {
    functionName: 'fetch-serper',
    timeout: 10000,
    queryType: 'short',
    transform: (query) => ({
      endpoint: '/search',
      params: { q: `"${query}" site:yelp.com reviews`, num: 10 },
    }),
  },
  // V5 FIX: Add Google Maps reviews (verified in edge function SOCIAL_ACTORS)
  // Uses compass/google-maps-reviews-scraper for local business reviews
  'google-maps': {
    functionName: 'apify-scraper',
    timeout: 20000, // Slower actor, needs more time
    queryType: 'short',
    transform: (query) => ({
      actorId: 'compass/google-maps-reviews-scraper',
      scraperType: 'GOOGLE_MAPS',
      input: {
        searchQuery: query,
        maxReviews: 10,
        reviewsCount: 10,
      },
    }),
  },
  // V5 FIX: Use correct Facebook actor (verified in edge function SOCIAL_ACTORS)
  'apify-facebook': {
    functionName: 'apify-scraper',
    timeout: 15000,
    queryType: 'short',
    transform: (query) => ({
      actorId: 'apify/facebook-posts-scraper',
      scraperType: 'FACEBOOK',
      input: { searchQuery: query, maxPosts: 20 },
    }),
  },
  // V5 FIX: Use correct Twitter scraper config (verified 2025-11-26)
  'apify-twitter': {
    functionName: 'apify-scraper',
    timeout: 15000,
    queryType: 'short',
    transform: (query) => ({
      actorId: 'apidojo/tweet-scraper',
      scraperType: 'TWITTER',
      input: {
        searchTerms: [query],
        maxTweets: 50,
        tweetLanguage: 'en'
      },
    }),
  },
  // V5 FIX: Use correct TikTok actor (verified in edge function SOCIAL_ACTORS)
  'apify-tiktok': {
    functionName: 'apify-scraper',
    timeout: 15000,
    queryType: 'short',
    transform: (query) => ({
      actorId: 'clockworks/tiktok-scraper',
      scraperType: 'TIKTOK',
      input: { searchQuery: query, maxVideos: 20 },
    }),
  },
  // V5 FIX: Use correct Instagram actor (verified in edge function SOCIAL_ACTORS)
  'apify-instagram': {
    functionName: 'apify-scraper',
    timeout: 15000,
    queryType: 'short',
    transform: (query) => ({
      actorId: 'apify/instagram-scraper',
      scraperType: 'INSTAGRAM',
      input: { search: query, resultsLimit: 20 },
    }),
  },
  // V5 FIX: Use correct LinkedIn actor (verified in edge function SOCIAL_ACTORS)
  // Note: LinkedIn requires cookie param - may not work without session cookie
  'apify-linkedin': {
    functionName: 'apify-scraper',
    timeout: 15000,
    queryType: 'short',
    transform: (query) => ({
      actorId: 'curious_coder/linkedin-post-search-scraper',
      scraperType: 'LINKEDIN',
      input: { searchQuery: query, maxResults: 20 },
    }),
  },
  // Search APIs - use short queries (max ~100 chars)
  'serper': {
    functionName: 'fetch-serper',
    timeout: 10000,
    queryType: 'short',
    transform: (query) => ({
      q: query,
      num: 20,
    }),
  },
  'serper-autocomplete': {
    functionName: 'fetch-serper',
    timeout: 8000,
    queryType: 'short',
    transform: (query) => ({
      endpoint: '/autocomplete',
      params: { q: query },
    }),
  },
  'serper-events': {
    functionName: 'fetch-serper',
    timeout: 10000,
    queryType: 'location', // Events need location
    transform: (query) => ({
      endpoint: '/search',
      params: { q: `${query} events`, type: 'news' },
    }),
  },

  // Community APIs - short queries
  // V5 FIX: Use trudax/reddit-scraper with REDDIT scraperType (working config)
  'reddit': {
    functionName: 'apify-scraper',
    timeout: 15000,
    queryType: 'short',
    transform: (query) => ({
      actorId: 'trudax/reddit-scraper',
      scraperType: 'REDDIT',
      input: {
        startUrls: [{ url: `https://www.reddit.com/search/?q=${encodeURIComponent(query)}&sort=hot&t=month` }],
        maxItems: 15,
        includeComments: true,
        maxCommentsPerPost: 10,
        extendedData: true
      },
    }),
  },
  'hackernews': {
    functionName: 'fetch-hackernews',
    timeout: 10000,
    queryType: 'short',
    transform: (query) => ({
      query,
      tags: 'story',
      hitsPerPage: 20,
    }),
  },

  // Competitive APIs - domain for SEMrush, short for others
  'semrush': {
    functionName: 'fetch-seo-metrics',
    timeout: 20000,
    queryType: 'domain', // Needs domain name, not keywords
    transform: (query) => ({
      domain: query,
      type: 'overview',
    }),
  },
  'meta-ads': {
    functionName: 'fetch-meta-ads',
    timeout: 15000,
    queryType: 'short',
    transform: (query) => ({
      search_terms: query,
      ad_type: 'ALL',
      limit: 20,
    }),
  },

  // Trends APIs - short queries
  'newsapi': {
    functionName: 'fetch-news',
    timeout: 10000,
    queryType: 'short',
    transform: (query) => ({
      q: query,
      sortBy: 'relevancy',
      pageSize: 20,
    }),
  },
  // Perplexity gets full LLM context
  'perplexity': {
    functionName: 'perplexity-proxy',
    timeout: 25000,
    queryType: 'llm', // Full context for LLM
    transform: (query, context) => ({
      model: 'sonar',
      messages: [
        { role: 'system', content: `Research assistant. Context: ${context}` },
        { role: 'user', content: query },
      ],
    }),
  },
  // V5 FIX: YouTube edge function expects action: 'search' format
  'youtube': {
    functionName: 'fetch-youtube',
    timeout: 15000,
    queryType: 'short',
    transform: (query) => ({
      action: 'search',
      query: query,
      maxResults: 20,
    }),
  },
  'buzzsumo': {
    functionName: 'fetch-buzzsumo',
    timeout: 15000,
    queryType: 'short',
    transform: (query) => ({
      topic: query,
      limit: 20,
      sortBy: 'shares',
      days: 30,
    }),
  },
  // Weather needs location only
  'openweather': {
    functionName: 'fetch-weather',
    timeout: 5000,
    queryType: 'location', // Needs city name, not keywords
    transform: (query) => ({
      location: query,
    }),
  },

  // Local/Timing APIs
  'sec-edgar': {
    functionName: 'sec-edgar-proxy',
    timeout: 20000,
    queryType: 'short', // Company name
    transform: (query) => ({
      company: query,
      formTypes: ['10-K', '10-Q', '8-K'],
      limit: 10,
    }),
  },
  'google-places': {
    functionName: 'fetch-google-places',
    timeout: 10000,
    queryType: 'location', // Needs location
    transform: (query) => ({
      query,
      type: 'establishment',
    }),
  },
};

// Fallback APIs when edge function doesn't exist
const FALLBACK_APIS = new Set([
  'outscraper-multi', 'apify-clutch', 'apify-upwork', 'apify-nextdoor',
  'reddit-marketing', 'reddit-regional', 'linkedin', 'facebook-groups',
  'newsapi-local', 'newsapi-tech', 'newsapi-marketing', 'newsapi-regional',
  'newsapi-funding', 'newsapi-budgets', 'newsapi-holidays',
]);

/**
 * V6 API Orchestrator Class
 */
export class ApiOrchestrator extends EventEmitter {
  private profile: BrandProfile | null = null;
  private uvpContext: ReturnType<typeof buildUVPContext> | null = null;
  private industryBooster: IndustryBooster | null = null;
  private tabData: Map<InsightTab, TabData> = new Map();
  private abortControllers: Map<string, AbortController> = new Map();
  private supabaseUrl: string;
  private supabaseAnonKey: string;

  constructor() {
    super();
    this.initializeTabs();
    // Get Supabase config
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    this.supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  }

  /**
   * Initialize tab data structures
   */
  private initializeTabs(): void {
    const tabs: InsightTab[] = ['voc', 'community', 'competitive', 'trends', 'search', 'local_timing'];
    tabs.forEach((tab) => {
      this.tabData.set(tab, {
        tab,
        results: [],
        loading: false,
        complete: false,
      });
    });
  }

  /**
   * Set profile and build contexts
   */
  async setProfile(profile: BrandProfile): Promise<void> {
    this.profile = profile;
    this.uvpContext = buildUVPContext(profile.uvp_data);

    // Match industry booster in background
    this.industryBooster = await matchIndustryProfile(profile);

    console.log('[ApiOrchestrator] Profile set:', {
      type: profile.profile_type,
      hasBooster: this.industryBooster?.matched,
    });
  }

  /**
   * Load data for a specific tab
   */
  async loadTab(tab: InsightTab): Promise<TabData> {
    if (!this.profile || !this.uvpContext) {
      throw new Error('[ApiOrchestrator] Profile not set');
    }

    const tabState = this.tabData.get(tab)!;
    tabState.loading = true;
    tabState.results = [];
    this.emit('tab:loading', { tab });

    // Get API priorities for this tab
    const apis = this.profile.api_priorities[tab] || [];
    const queryDepth = getQueryDepth(this.profile);

    // Build base query from UVP
    const baseQuery = this.buildBaseQuery(tab);

    // Run APIs in parallel (respecting limits)
    const apiPromises = apis.slice(0, queryDepth.maxQueries).map((apiName) =>
      this.callEdgeFunction(apiName, tab, baseQuery, queryDepth.timeout)
    );

    // Wait for all with parallel limit
    const results = await this.executeWithLimit(apiPromises, queryDepth.parallelLimit);

    // Update tab state
    tabState.results = results.filter((r): r is ApiResult => r !== null);
    tabState.loading = false;
    tabState.complete = true;

    this.emit('tab:complete', { tab, results: tabState.results });

    return tabState;
  }

  /**
   * Load all tabs in parallel
   */
  async loadAllTabs(): Promise<Map<InsightTab, TabData>> {
    if (!this.profile) {
      throw new Error('[ApiOrchestrator] Profile not set');
    }

    const tabs = this.profile.enabled_tabs;

    // Load all tabs in parallel
    await Promise.all(tabs.map((tab) => this.loadTab(tab)));

    this.emit('all:complete', { tabs: Array.from(this.tabData.values()) });

    return this.tabData;
  }

  /**
   * Call a Supabase Edge Function
   */
  private async callEdgeFunction(
    apiName: string,
    tab: InsightTab,
    baseQuery: string,
    timeout: number
  ): Promise<ApiResult | null> {
    const config = EDGE_FUNCTION_MAP[apiName];

    // Skip fallback APIs that don't have edge functions
    if (!config) {
      if (FALLBACK_APIS.has(apiName)) {
        console.log(`[ApiOrchestrator] Skipping ${apiName} - no edge function`);
        return null;
      }
      console.warn(`[ApiOrchestrator] Unknown API: ${apiName}`);
      return null;
    }

    const startTime = Date.now();
    const controller = new AbortController();
    const key = `${tab}-${apiName}`;
    this.abortControllers.set(key, controller);

    try {
      // Select query based on API's queryType
      let query: string;
      const uvp = this.profile!.uvp_data;

      switch (config.queryType) {
        case 'short':
          // Short keyword query for search APIs (max ~100 chars)
          query = extractShortQuery(uvp, tab);
          break;
        case 'location':
          // Location string for weather/local APIs
          query = extractLocation(uvp);
          break;
        case 'domain':
          // Domain name for SEMrush and similar
          query = extractDomain(uvp);
          if (!query) {
            console.log(`[ApiOrchestrator] Skipping ${apiName} - no domain found`);
            return null;
          }
          break;
        case 'llm':
          // Full context for LLM APIs (Perplexity, etc.)
          query = buildTabQuery(baseQuery, tab, this.uvpContext!);
          break;
        default:
          // Default to short query
          query = extractShortQuery(uvp, tab);
      }

      // Build context for prompt injection (only used by LLM APIs)
      let context = formatContextForPrompt(this.uvpContext!, tab);
      if (this.industryBooster?.matched) {
        context = applyBoosterToContext(context, this.industryBooster);
      }

      // Log query for debugging
      console.log(`[ApiOrchestrator] ${apiName} query (${config.queryType}):`, query.substring(0, 100));

      // Transform query to edge function format
      const payload = config.transform
        ? config.transform(query, context, this.profile!.profile_type)
        : { query, context };

      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke(config.functionName, {
        body: payload,
      });

      if (error) {
        throw new Error(error.message);
      }

      const duration = Date.now() - startTime;

      const result: ApiResult = {
        apiName,
        tab,
        data,
        timestamp: Date.now(),
        duration,
        success: true,
      };

      this.emit('tab:update', { tab, result });

      console.log(`[ApiOrchestrator] ${apiName} completed in ${duration}ms`);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      console.error(`[ApiOrchestrator] ${apiName} failed:`, error);

      const result: ApiResult = {
        apiName,
        tab,
        data: null,
        timestamp: Date.now(),
        duration,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      this.emit('tab:error', { tab, result });

      return result;
    } finally {
      this.abortControllers.delete(key);
    }
  }

  /**
   * Build base query from UVP for a tab
   */
  private buildBaseQuery(tab: InsightTab): string {
    const uvp = this.profile?.uvp_data;
    if (!uvp) return '';

    // Extract key terms from UVP
    const terms: string[] = [];

    if (uvp.targetCustomer?.statement) {
      terms.push(uvp.targetCustomer.statement);
    }

    if (uvp.keyBenefit?.statement) {
      terms.push(uvp.keyBenefit.statement);
    }

    if (uvp.uniqueSolution?.statement) {
      terms.push(uvp.uniqueSolution.statement);
    }

    // Tab-specific additions
    switch (tab) {
      case 'voc':
        terms.push('reviews', 'feedback', 'customer experience');
        break;
      case 'community':
        terms.push('discussions', 'community', 'forum');
        break;
      case 'competitive':
        terms.push('vs', 'alternative', 'compare');
        break;
      case 'trends':
        terms.push('trends', 'industry', 'market');
        break;
      case 'search':
        terms.push('how to', 'best', 'what is');
        break;
      case 'local_timing':
        terms.push('local', 'near me', 'events');
        break;
    }

    return terms.slice(0, 5).join(' ');
  }

  /**
   * Execute promises with parallel limit
   */
  private async executeWithLimit<T>(
    promises: Promise<T>[],
    limit: number
  ): Promise<T[]> {
    const results: T[] = [];
    const executing: Promise<void>[] = [];

    for (const promise of promises) {
      const p = promise.then((result) => {
        results.push(result);
        executing.splice(executing.indexOf(p), 1);
      });

      executing.push(p);

      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }

    await Promise.all(executing);
    return results;
  }

  /**
   * Cancel all pending requests
   */
  cancelAll(): void {
    this.abortControllers.forEach((controller) => {
      controller.abort();
    });
    this.abortControllers.clear();
  }

  /**
   * Get current tab data
   */
  getTabData(tab: InsightTab): TabData | undefined {
    return this.tabData.get(tab);
  }

  /**
   * Get all tab data
   */
  getAllTabData(): Map<InsightTab, TabData> {
    return this.tabData;
  }
}

// Export singleton instance
export const apiOrchestrator = new ApiOrchestrator();
