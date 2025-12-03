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
  'outscraper': {
    functionName: 'fetch-outscraper',
    timeout: 15000,
    queryType: 'short',
    transform: (query) => ({
      business_name: query,
      limit: 20,
      sort: 'newest',
    }),
  },
  'apify-g2': {
    functionName: 'apify-scraper',
    timeout: 15000,
    queryType: 'short',
    transform: (query) => ({
      actorId: 'drobnikj/g2-reviews-scraper',
      input: { searchQuery: query, maxReviews: 20 },
    }),
  },
  'apify-capterra': {
    functionName: 'apify-scraper',
    timeout: 15000,
    queryType: 'short',
    transform: (query) => ({
      actorId: 'emastra/capterra-scraper',
      input: { searchQuery: query, maxReviews: 20 },
    }),
  },
  'apify-trustpilot': {
    functionName: 'apify-scraper',
    timeout: 15000,
    queryType: 'short',
    transform: (query) => ({
      actorId: 'vaclavrut/trustpilot-scraper',
      input: { searchQuery: query, maxReviews: 20 },
    }),
  },
  'apify-amazon': {
    functionName: 'apify-scraper',
    timeout: 15000,
    queryType: 'short',
    transform: (query) => ({
      actorId: 'junglee/amazon-reviews-scraper',
      input: { searchQuery: query, maxReviews: 20 },
    }),
  },
  'apify-yelp': {
    functionName: 'apify-scraper',
    timeout: 15000,
    queryType: 'short',
    transform: (query) => ({
      actorId: 'yin/yelp-scraper',
      input: { searchQuery: query, maxResults: 20 },
    }),
  },
  'apify-facebook': {
    functionName: 'apify-scraper',
    timeout: 15000,
    queryType: 'short',
    transform: (query) => ({
      actorId: 'apify/facebook-pages-scraper',
      input: { searchQuery: query, maxPosts: 20 },
    }),
  },
  'apify-twitter': {
    functionName: 'apify-scraper',
    timeout: 15000,
    queryType: 'short',
    transform: (query) => ({
      actorId: 'apidojo/tweet-scraper',
      input: {
        searchTerms: [query],
        maxTweets: 50,
        tweetLanguage: 'en'
      },
    }),
  },
  'apify-tiktok': {
    functionName: 'apify-scraper',
    timeout: 15000,
    queryType: 'short',
    transform: (query) => ({
      actorId: 'clockworks/tiktok-scraper',
      input: { searchQuery: query, maxVideos: 20 },
    }),
  },
  'apify-instagram': {
    functionName: 'apify-scraper',
    timeout: 15000,
    queryType: 'short',
    transform: (query) => ({
      actorId: 'apify/instagram-scraper',
      input: { search: query, resultsLimit: 20 },
    }),
  },
  'apify-linkedin': {
    functionName: 'apify-scraper',
    timeout: 15000,
    queryType: 'short',
    transform: (query) => ({
      actorId: 'anchor/linkedin-scraper',
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
  'reddit': {
    functionName: 'apify-scraper',
    timeout: 15000,
    queryType: 'short',
    transform: (query) => ({
      actorId: 'perchance/reddit-scraper',
      input: {
        searches: [query],
        maxItems: 25,
        sort: 'relevance'
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
      model: 'llama-3.1-sonar-small-128k-online',
      messages: [
        { role: 'system', content: `Research assistant. Context: ${context}` },
        { role: 'user', content: query },
      ],
    }),
  },
  'youtube': {
    functionName: 'fetch-youtube',
    timeout: 15000,
    queryType: 'short',
    transform: (query) => ({
      query,
      maxResults: 20,
      type: 'video',
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
