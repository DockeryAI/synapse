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
// V1 WIRING: Import outcome detection for query targeting
import { outcomeDetectionService, type DetectedOutcome } from './outcome-detection.service';
// V6 VOC FIX: Import consolidated business purpose detector (replaces uvp-category-detector)
import { businessPurposeDetector, type BusinessPurpose, type ReviewSearchConfig } from '@/services/intelligence/business-purpose-detector.service';

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
  // V6 VOC FIX: Transform now receives review search config for intelligent query building
  transform?: (
    query: string,
    context: string,
    profileType: BusinessProfileType,
    reviewSearch?: ReviewSearchConfig | null
  ) => Record<string, unknown>;
}

// NOTE: extractSaaSCategory removed - now using BusinessPurposeDetector from
// business-purpose-detector.service.ts which intelligently reads the actual UVP fields

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
  // V6 VOC FIX: Search for ACTUAL CUSTOMER QUOTES not vendor pages
  // Uses consolidated BusinessPurposeDetector for category-aware searches
  'apify-g2': {
    functionName: 'fetch-serper',
    timeout: 10000,
    queryType: 'short',
    transform: (_query, _context, _profileType, reviewSearch) => {
      // Use ReviewSearchConfig from BusinessPurposeDetector
      const searchQuery = reviewSearch?.categoryQuery || '"B2B software"';
      const exclusions = reviewSearch?.exclusions.map(e => `-"${e}"`).join(' ') || '';

      console.log('[apify-g2] Using review search config:', {
        categoryQuery: reviewSearch?.categoryQuery,
        exclusions: reviewSearch?.exclusions,
        competitors: reviewSearch?.competitors,
      });

      return {
        endpoint: '/search',
        params: {
          q: `${searchQuery} ("pros:" OR "cons:" OR "I love" OR "I hate" OR "we switched") site:g2.com/products ${exclusions}`,
          num: 30 // Increased from 20 to get more results
        },
      };
    },
  },
  'apify-capterra': {
    functionName: 'fetch-serper',
    timeout: 10000,
    queryType: 'short',
    transform: (_query, _context, _profileType, reviewSearch) => {
      const searchQuery = reviewSearch?.categoryQuery || '"B2B software"';
      const exclusions = reviewSearch?.exclusions.map(e => `-"${e}"`).join(' ') || '';

      return {
        endpoint: '/search',
        params: {
          q: `${searchQuery} ("pros" OR "cons" OR "review" OR "we use") site:capterra.com/reviews ${exclusions}`,
          num: 30 // Increased from 20
        },
      };
    },
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
  // V6 VOC FIX: TrustRadius for enterprise B2B SaaS reviews - search for actual quotes
  // Uses consolidated BusinessPurposeDetector
  'apify-trustradius': {
    functionName: 'fetch-serper',
    timeout: 10000,
    queryType: 'short',
    transform: (_query, _context, _profileType, reviewSearch) => {
      const searchQuery = reviewSearch?.categoryQuery || '"B2B software"';
      const exclusions = reviewSearch?.exclusions.map(e => `-"${e}"`).join(' ') || '';

      return {
        endpoint: '/search',
        params: {
          q: `${searchQuery} ("what I like" OR "what I dislike" OR "best for" OR "not ideal") site:trustradius.com/products ${exclusions}`,
          num: 30 // Increased from 20
        },
      };
    },
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
  // V6 VOC FIX: Use Serper site:linkedin.com instead of Apify (no cookie needed)
  'apify-linkedin': {
    functionName: 'fetch-serper',
    timeout: 10000,
    queryType: 'short',
    transform: (query) => {
      const keywords = query.split(/\s+/).slice(0, 4).join(' ');
      return {
        endpoint: '/search',
        params: { q: `${keywords} site:linkedin.com`, num: 15 },
      };
    },
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
  // V6 VOC FIX: Professional subreddit targeting for B2B SaaS
  // Searches specific professional subreddits instead of generic Reddit search
  // INDUSTRY-AGNOSTIC: Requires AI/agent keywords for tech queries to prevent consumer content
  'reddit-professional': {
    functionName: 'apify-scraper',
    timeout: 15000,
    queryType: 'short',
    transform: (query, _context, profileType) => {
      // Map profile type to relevant professional subreddits
      // For national-saas: B2B tech subreddits focused on AI/automation
      const subredditMap: Record<string, string[]> = {
        'national-saas': ['SaaS', 'sales', 'startups', 'B2BMarketing', 'Entrepreneur', 'artificial', 'MachineLearning'],
        'local-b2c': ['smallbusiness', 'Entrepreneur', 'sweatystartup'],
        'local-b2b': ['smallbusiness', 'Entrepreneur', 'B2BMarketing', 'msp'],
        'regional-agency': ['marketing', 'digital_marketing', 'SEO', 'PPC', 'agencies'],
        'regional-retail': ['smallbusiness', 'retailnews', 'Entrepreneur'],
        'national-product': ['Entrepreneur', 'ecommerce', 'FulfillmentByAmazon', 'dropship'],
      };
      const subreddits = subredditMap[profileType || 'national-saas'] || subredditMap['national-saas'];

      // CRITICAL: For national-saas, inject AI/agent requirement into query
      // This prevents generic industry discussions without AI/tech context
      let searchQuery = query;
      if (profileType === 'national-saas') {
        // Check if query already has AI/agent keywords
        const hasAIKeywords = /\b(ai|artificial|automation|chatbot|agent|machine learning|conversational)\b/i.test(query);
        if (!hasAIKeywords) {
          // Inject AI context to filter for B2B tech discussions
          searchQuery = `${query} (AI OR automation OR agent OR chatbot)`;
        }
      }

      // Build multi-subreddit search URL
      const subredditPath = subreddits.slice(0, 5).join('+');
      return {
        actorId: 'trudax/reddit-scraper',
        scraperType: 'REDDIT',
        input: {
          startUrls: [{ url: `https://www.reddit.com/r/${subredditPath}/search/?q=${encodeURIComponent(searchQuery)}&restrict_sr=1&sort=hot&t=month` }],
          maxItems: 20,
          includeComments: true,
          maxCommentsPerPost: 10,
          extendedData: true
        },
      };
    },
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
  // V6 VOC FIX: Perplexity specifically for extracting REAL customer quotes
  // Uses ReviewSearchConfig from BusinessPurposeDetector for proper category targeting
  'perplexity-reviews': {
    functionName: 'perplexity-proxy',
    timeout: 30000,
    queryType: 'short',
    transform: (_query, _context, _profileType, reviewSearch) => {
      // Use ReviewSearchConfig for category and exclusions
      const category = reviewSearch?.categoryQuery || '"B2B software"';
      const alternatives = reviewSearch?.alternatives?.slice(0, 2).join(', ') || '';
      const exclusions = reviewSearch?.exclusions?.join(', ') || '';
      const competitors = reviewSearch?.competitors?.join(', ') || '';

      // Build rich context for Perplexity
      const categoryContext = alternatives ? `${category} (also known as: ${alternatives})` : category;

      console.log('[perplexity-reviews] Using ReviewSearchConfig:', {
        category,
        alternatives,
        exclusions,
        competitors,
      });

      return {
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: `You are a B2B customer research analyst specializing in enterprise software reviews. Find and return ONLY direct customer quotes from reviews on G2, Capterra, TrustRadius, or Reddit.

CRITICAL RULES:
1. Return 8-12 ACTUAL customer quotes (in quotation marks)
2. Each quote must include: source platform, customer role/company if available, sentiment (positive/negative)
3. DO NOT summarize or paraphrase - exact words only
4. DO NOT include vendor marketing content or analyst opinions
5. Focus on: complaints, frustrations, switching mentions ("we moved from X"), unmet needs ("wish it had")
${exclusions ? `6. EXCLUDE reviews about: ${exclusions}` : ''}
${competitors ? `7. Look for reviews comparing to or mentioning: ${competitors}` : ''}

Priority order for content value:
1. Pain points and frustrations (highest value)
2. Switching/migration stories
3. Unmet needs and feature gaps
4. Positive differentiators`
          },
          {
            role: 'user',
            content: `Find real B2B customer reviews and direct quotes about: ${categoryContext}

Search G2.com, Capterra, TrustRadius, and professional Reddit communities (r/SaaS, r/sales, r/Entrepreneur).

Return only direct quotes from actual enterprise customers - not vendor descriptions, analyst reports, or marketing content. Focus on reviews that mention specific pain points, switching from competitors, or desired features.

Format each quote as:
**[Topic/Theme]**
"[Exact customer quote]"
- Source: [Platform], [Role/Company if known], [Positive/Negative]`
          },
        ],
      };
    },
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
// V5 FIX: ProductHunt and Reddit-enterprise have no edge functions - mark as fallback
const FALLBACK_APIS = new Set([
  'outscraper-multi', 'apify-clutch', 'apify-upwork', 'apify-nextdoor',
  'reddit-marketing', 'reddit-regional', 'reddit-enterprise', 'linkedin', 'facebook-groups',
  'newsapi-local', 'newsapi-tech', 'newsapi-marketing', 'newsapi-regional',
  'newsapi-funding', 'newsapi-budgets', 'newsapi-holidays',
  'producthunt', // No edge function for ProductHunt API
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
  // V1 WIRING: Store detected outcomes for query targeting
  private detectedOutcomes: DetectedOutcome[] = [];
  // V6 VOC FIX: Store business purpose (includes reviewSearch) for VoC searches
  private businessPurpose: BusinessPurpose | null = null;
  private currentUVP: CompleteUVP | null = null;

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

    // V1 FIX: Get UVP data - fallback to uvp_sessions if brand_profiles.uvp_data is empty
    let uvpData = profile.uvp_data;

    if (!uvpData || Object.keys(uvpData).length === 0) {
      console.log('[ApiOrchestrator] brand_profiles.uvp_data empty, fetching from uvp_sessions...');
      try {
        const { data: session } = await supabase
          .from('uvp_sessions')
          .select('complete_uvp')
          .eq('brand_id', profile.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        if (session?.complete_uvp) {
          uvpData = session.complete_uvp;
          console.log('[ApiOrchestrator] ✅ Loaded UVP from uvp_sessions');
        }
      } catch (err) {
        console.log('[ApiOrchestrator] No uvp_sessions data found');
      }
    }

    this.uvpContext = buildUVPContext(uvpData);

    // Match industry booster in background
    this.industryBooster = await matchIndustryProfile(profile);

    // V1 WIRING: Detect customer outcomes for query targeting
    // First try customerProfiles, then derive from UVP fields
    if (uvpData) {
      let result = outcomeDetectionService.detectOutcomes(uvpData);

      // If no outcomes from customerProfiles, derive from UVP core fields
      if (result.outcomes.length === 0 && uvpData.targetCustomer) {
        console.log('[V1 WIRING] No customerProfiles, deriving outcomes from UVP fields...');
        const derivedOutcomes: DetectedOutcome[] = [];

        // Derive from transformationGoal.before (pain point → outcome)
        const tg = uvpData.transformationGoal;
        if (tg?.before) {
          derivedOutcomes.push({
            id: 'derived-problem',
            statement: `solve ${tg.before}`,
            type: 'functional',
            source: 'transformation_goal',
            impactScore: 90,
            urgencyScore: 80,
            confidence: 85
          });
        }

        // Derive from transformationGoal.after (desired outcome)
        if (tg?.after) {
          derivedOutcomes.push({
            id: 'derived-outcome',
            statement: tg.after,
            type: 'transformation',
            source: 'transformation_goal',
            impactScore: 95,
            urgencyScore: 70,
            confidence: 90
          });
        }

        // Derive from uniqueSolution.statement (how we help)
        const us = uvpData.uniqueSolution;
        if (us?.statement) {
          derivedOutcomes.push({
            id: 'derived-solution',
            statement: us.statement,
            type: 'functional',
            source: 'key_benefit',
            impactScore: 85,
            urgencyScore: 60,
            confidence: 80
          });
        }

        // Derive from keyBenefit.statement
        const kb = uvpData.keyBenefit;
        if (kb?.statement) {
          derivedOutcomes.push({
            id: 'derived-benefit',
            statement: kb.statement,
            type: 'emotional',
            source: 'key_benefit',
            impactScore: 80,
            urgencyScore: 50,
            confidence: 85
          });
        }

        // Use derivedOutcomes directly - don't need full OutcomeDetectionResult
        this.detectedOutcomes = derivedOutcomes;
        console.log(`[V1 WIRING] Derived ${derivedOutcomes.length} outcomes from UVP fields`);
      } else {
        this.detectedOutcomes = result.outcomes;
      }

      console.log(`[V1 WIRING/ApiOrchestrator] ✅ Detected ${this.detectedOutcomes.length} customer outcomes`);
      if (this.detectedOutcomes.length > 0) {
        const topOutcomes = [...this.detectedOutcomes]
          .sort((a, b) => b.impactScore - a.impactScore)
          .slice(0, 3);
        console.log('[V1 WIRING/ApiOrchestrator] Top outcomes:', topOutcomes.map(o => o.statement.substring(0, 50)));
      }
    }

    // V6 VOC FIX: Detect business purpose (includes reviewSearch) for VoC category targeting
    this.currentUVP = uvpData;
    if (uvpData) {
      this.businessPurpose = businessPurposeDetector.detectBusinessPurpose(uvpData);
      console.log('[ApiOrchestrator] Business purpose detected:', {
        productFunction: this.businessPurpose.productFunction.primary,
        customerRole: this.businessPurpose.customerRole.department,
        reviewCategory: this.businessPurpose.reviewSearch.categoryQuery,
        exclusions: this.businessPurpose.reviewSearch.exclusions,
        competitors: this.businessPurpose.reviewSearch.competitors,
        confidence: this.businessPurpose.confidence,
      });
    }

    console.log('[ApiOrchestrator] Profile set:', {
      type: profile.profile_type,
      hasBooster: this.industryBooster?.matched,
      outcomeCount: this.detectedOutcomes.length,
      reviewCategory: this.businessPurpose?.reviewSearch.categoryQuery,
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
   * Call a Supabase Edge Function with retry logic
   * V5 FIX: Added retry logic and exponential backoff for transient failures
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

    // V5 FIX: Retry logic for transient failures
    const maxRetries = 2;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.callEdgeFunctionAttempt(apiName, tab, baseQuery, config);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // V5 FIX: Exponential backoff between retries
        if (attempt < maxRetries) {
          const backoffMs = Math.pow(2, attempt) * 500; // 500ms, 1s, 2s
          console.log(`[ApiOrchestrator] ${apiName} retry ${attempt + 1}/${maxRetries} after ${backoffMs}ms:`, lastError.message);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        }
      }
    }

    // All retries exhausted - return error result
    const result: ApiResult = {
      apiName,
      tab,
      data: null,
      timestamp: Date.now(),
      duration: 0,
      success: false,
      error: lastError?.message || 'Unknown error after retries',
    };

    this.emit('tab:error', { tab, result });
    return result;
  }

  /**
   * Single attempt to call edge function
   * V5 FIX: Extracted into separate method for retry logic
   */
  private async callEdgeFunctionAttempt(
    apiName: string,
    tab: InsightTab,
    baseQuery: string,
    config: EdgeFunctionConfig
  ): Promise<ApiResult | null> {
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
          // PHASE 14F-E: Short keyword query with profile-based fallbacks
          // V1 WIRING: Pass detected outcomes for outcome-aware queries
          query = extractShortQuery(uvp, tab, this.profile?.profile_type, this.detectedOutcomes);
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
          // PHASE 14F-E: Default to short query with profile-based fallbacks
          // V1 WIRING: Pass detected outcomes for outcome-aware queries
          query = extractShortQuery(uvp, tab, this.profile?.profile_type, this.detectedOutcomes);
      }

      // Build context for prompt injection (only used by LLM APIs)
      let context = formatContextForPrompt(this.uvpContext!, tab);
      if (this.industryBooster?.matched) {
        context = applyBoosterToContext(context, this.industryBooster);
      }

      // Log query for debugging
      console.log(`[ApiOrchestrator] ${apiName} query (${config.queryType}):`, query.substring(0, 100));

      // Transform query to edge function format
      // V6 VOC FIX: Pass reviewSearch from businessPurpose for intelligent category detection
      const payload = config.transform
        ? config.transform(query, context, this.profile!.profile_type, this.businessPurpose?.reviewSearch)
        : { query, context };

      // V5 FIX: Better error handling - check response status
      const { data, error } = await supabase.functions.invoke(config.functionName, {
        body: payload,
      });

      if (error) {
        throw new Error(`Edge function error: ${error.message}`);
      }

      // V5 FIX: Validate data response
      if (!data) {
        throw new Error('Empty response from edge function');
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

      console.log(`[ApiOrchestrator] ${apiName} completed in ${duration}ms with ${Array.isArray(data) ? data.length : 'unknown'} results`);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      console.error(`[ApiOrchestrator] ${apiName} attempt failed:`, error);

      // Re-throw for retry logic in parent method
      throw error;
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
