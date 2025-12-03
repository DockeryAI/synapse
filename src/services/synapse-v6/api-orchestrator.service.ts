// PRD Feature: SYNAPSE-V6
/**
 * V6 API Orchestrator
 *
 * Routes API calls based on brand profile type.
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
import type { BrandProfile, InsightTab, BusinessProfileType } from './brand-profile.service';
import { buildUVPContext, buildTabQuery, formatContextForPrompt, getQueryDepth } from './uvp-context-builder.service';
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

// API endpoint configuration
interface ApiEndpoint {
  name: string;
  endpoint: string;
  method: 'GET' | 'POST';
  timeout: number;
  requiresAuth: boolean;
}

// API endpoints by name
const API_ENDPOINTS: Record<string, ApiEndpoint> = {
  // Voice of Customer APIs
  'outscraper': { name: 'outscraper', endpoint: '/api/outscraper/reviews', method: 'POST', timeout: 15000, requiresAuth: true },
  'outscraper-multi': { name: 'outscraper-multi', endpoint: '/api/outscraper/reviews-multi', method: 'POST', timeout: 20000, requiresAuth: true },
  'apify-g2': { name: 'apify-g2', endpoint: '/api/apify/g2-reviews', method: 'POST', timeout: 15000, requiresAuth: true },
  'apify-capterra': { name: 'apify-capterra', endpoint: '/api/apify/capterra', method: 'POST', timeout: 15000, requiresAuth: true },
  'apify-trustradius': { name: 'apify-trustradius', endpoint: '/api/apify/trustradius', method: 'POST', timeout: 15000, requiresAuth: true },
  'apify-amazon': { name: 'apify-amazon', endpoint: '/api/apify/amazon-reviews', method: 'POST', timeout: 15000, requiresAuth: true },
  'apify-yelp': { name: 'apify-yelp', endpoint: '/api/apify/yelp', method: 'POST', timeout: 15000, requiresAuth: true },
  'apify-clutch': { name: 'apify-clutch', endpoint: '/api/apify/clutch', method: 'POST', timeout: 15000, requiresAuth: true },
  'apify-upwork': { name: 'apify-upwork', endpoint: '/api/apify/upwork', method: 'POST', timeout: 15000, requiresAuth: true },
  'apify-facebook': { name: 'apify-facebook', endpoint: '/api/apify/facebook', method: 'POST', timeout: 15000, requiresAuth: true },
  'apify-linkedin': { name: 'apify-linkedin', endpoint: '/api/apify/linkedin', method: 'POST', timeout: 15000, requiresAuth: true },
  'serper': { name: 'serper', endpoint: '/api/serper/search', method: 'POST', timeout: 10000, requiresAuth: true },
  'google-places': { name: 'google-places', endpoint: '/api/google/places', method: 'POST', timeout: 10000, requiresAuth: true },

  // Community APIs
  'reddit': { name: 'reddit', endpoint: '/api/reddit/search', method: 'POST', timeout: 10000, requiresAuth: false },
  'reddit-marketing': { name: 'reddit-marketing', endpoint: '/api/reddit/marketing', method: 'POST', timeout: 10000, requiresAuth: false },
  'reddit-regional': { name: 'reddit-regional', endpoint: '/api/reddit/regional', method: 'POST', timeout: 10000, requiresAuth: false },
  'hackernews': { name: 'hackernews', endpoint: '/api/hackernews/search', method: 'POST', timeout: 10000, requiresAuth: false },
  'linkedin': { name: 'linkedin', endpoint: '/api/linkedin/posts', method: 'POST', timeout: 15000, requiresAuth: true },
  'apify-twitter': { name: 'apify-twitter', endpoint: '/api/apify/twitter', method: 'POST', timeout: 15000, requiresAuth: true },
  'apify-nextdoor': { name: 'apify-nextdoor', endpoint: '/api/apify/nextdoor', method: 'POST', timeout: 15000, requiresAuth: true },
  'apify-tiktok': { name: 'apify-tiktok', endpoint: '/api/apify/tiktok', method: 'POST', timeout: 15000, requiresAuth: true },
  'apify-instagram': { name: 'apify-instagram', endpoint: '/api/apify/instagram', method: 'POST', timeout: 15000, requiresAuth: true },
  'facebook-groups': { name: 'facebook-groups', endpoint: '/api/facebook/groups', method: 'POST', timeout: 15000, requiresAuth: true },

  // Competitive APIs
  'semrush': { name: 'semrush', endpoint: '/api/semrush/domain', method: 'POST', timeout: 20000, requiresAuth: true },
  'meta-ads': { name: 'meta-ads', endpoint: '/api/meta/ads-library', method: 'POST', timeout: 15000, requiresAuth: true },

  // Trends APIs
  'newsapi': { name: 'newsapi', endpoint: '/api/newsapi/search', method: 'POST', timeout: 10000, requiresAuth: true },
  'newsapi-local': { name: 'newsapi-local', endpoint: '/api/newsapi/local', method: 'POST', timeout: 10000, requiresAuth: true },
  'newsapi-tech': { name: 'newsapi-tech', endpoint: '/api/newsapi/tech', method: 'POST', timeout: 10000, requiresAuth: true },
  'newsapi-marketing': { name: 'newsapi-marketing', endpoint: '/api/newsapi/marketing', method: 'POST', timeout: 10000, requiresAuth: true },
  'newsapi-regional': { name: 'newsapi-regional', endpoint: '/api/newsapi/regional', method: 'POST', timeout: 10000, requiresAuth: true },
  'newsapi-funding': { name: 'newsapi-funding', endpoint: '/api/newsapi/funding', method: 'POST', timeout: 10000, requiresAuth: true },
  'newsapi-budgets': { name: 'newsapi-budgets', endpoint: '/api/newsapi/budgets', method: 'POST', timeout: 10000, requiresAuth: true },
  'newsapi-holidays': { name: 'newsapi-holidays', endpoint: '/api/newsapi/holidays', method: 'POST', timeout: 10000, requiresAuth: true },
  'perplexity': { name: 'perplexity', endpoint: '/api/perplexity/research', method: 'POST', timeout: 25000, requiresAuth: true },
  'youtube': { name: 'youtube', endpoint: '/api/youtube/search', method: 'POST', timeout: 15000, requiresAuth: true },
  'openweather': { name: 'openweather', endpoint: '/api/weather/current', method: 'POST', timeout: 5000, requiresAuth: true },

  // Search APIs
  'serper-autocomplete': { name: 'serper-autocomplete', endpoint: '/api/serper/autocomplete', method: 'POST', timeout: 8000, requiresAuth: true },

  // Local/Timing APIs
  'serper-events': { name: 'serper-events', endpoint: '/api/serper/events', method: 'POST', timeout: 10000, requiresAuth: true },
  'sec-edgar': { name: 'sec-edgar', endpoint: '/api/sec/filings', method: 'POST', timeout: 20000, requiresAuth: false },
};

/**
 * V6 API Orchestrator Class
 */
export class ApiOrchestrator extends EventEmitter {
  private profile: BrandProfile | null = null;
  private uvpContext: ReturnType<typeof buildUVPContext> | null = null;
  private industryBooster: IndustryBooster | null = null;
  private tabData: Map<InsightTab, TabData> = new Map();
  private abortControllers: Map<string, AbortController> = new Map();

  constructor() {
    super();
    this.initializeTabs();
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
      this.callApi(apiName, tab, baseQuery, queryDepth.timeout)
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
   * Call a single API
   */
  private async callApi(
    apiName: string,
    tab: InsightTab,
    baseQuery: string,
    timeout: number
  ): Promise<ApiResult | null> {
    const endpoint = API_ENDPOINTS[apiName];
    if (!endpoint) {
      console.warn(`[ApiOrchestrator] Unknown API: ${apiName}`);
      return null;
    }

    const startTime = Date.now();
    const controller = new AbortController();
    const key = `${tab}-${apiName}`;
    this.abortControllers.set(key, controller);

    try {
      // Build query with UVP context
      const query = buildTabQuery(baseQuery, tab, this.uvpContext!);

      // Build context for prompt injection
      let context = formatContextForPrompt(this.uvpContext!, tab);
      if (this.industryBooster?.matched) {
        context = applyBoosterToContext(context, this.industryBooster);
      }

      // Make API call (simulated for now - will connect to real APIs)
      const response = await this.fetchWithTimeout(
        endpoint.endpoint,
        {
          method: endpoint.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            context,
            profile_type: this.profile?.profile_type,
          }),
          signal: controller.signal,
        },
        Math.min(timeout, endpoint.timeout)
      );

      const data = await response.json();
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

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

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

    if (uvp.targetCustomer?.primaryProfile) {
      terms.push(uvp.targetCustomer.primaryProfile);
    }

    if (uvp.keyBenefit?.headline) {
      terms.push(uvp.keyBenefit.headline);
    }

    if (uvp.uniqueSolution?.headline) {
      terms.push(uvp.uniqueSolution.headline);
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
   * Fetch with timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const timeoutId = setTimeout(() => {
      const controller = options.signal as AbortSignal;
      if (controller) {
        // Will be caught by the fetch
      }
    }, timeout);

    try {
      const response = await fetch(url, options);
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
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
