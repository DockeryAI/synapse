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
  // PHASE 19: Use Perplexity to find BUYER DISCUSSIONS, not product reviews
  // PHASE 20L: G2 via Serper - uses vocQueries.g2Query for platform-specific targeting
  'apify-g2': {
    functionName: 'fetch-serper',
    timeout: 15000,
    queryType: 'short',
    transform: (query, _context, _profileType, reviewSearch) => {
      // PHASE 20L: Use pre-built platform-specific query from vocQueries
      const buyerIntel = reviewSearch?.buyerIntelligence;
      const searchQuery = buyerIntel?.vocQueries?.g2Query
        || `${buyerIntel?.buyerIndustry || ''} software ${buyerIntel?.buyerProblem?.split(/\s+/).slice(0, 2).join(' ') || 'challenges'}`;

      console.log('[apify-g2] PHASE 20L vocQueries query:', searchQuery);
      return {
        endpoint: '/search',
        params: {
          q: `${searchQuery} site:g2.com`,
          num: 20,
          hl: 'en'
        }
      };
    },
  },
  // PHASE 20L: Capterra via Serper - uses vocQueries.g2Query (same format as G2)
  'apify-capterra': {
    functionName: 'fetch-serper',
    timeout: 15000,
    queryType: 'short',
    transform: (query, _context, _profileType, reviewSearch) => {
      const buyerIntel = reviewSearch?.buyerIntelligence;
      const searchQuery = buyerIntel?.vocQueries?.g2Query
        || `${buyerIntel?.buyerIndustry || ''} software solutions`;

      console.log('[apify-capterra] PHASE 20L vocQueries query:', searchQuery);
      return {
        endpoint: '/search',
        params: {
          q: `${searchQuery} site:capterra.com`,
          num: 20,
          hl: 'en'
        }
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
  // PHASE 20L: TrustRadius via Serper - uses vocQueries.g2Query
  'apify-trustradius': {
    functionName: 'fetch-serper',
    timeout: 15000,
    queryType: 'short',
    transform: (query, _context, _profileType, reviewSearch) => {
      const buyerIntel = reviewSearch?.buyerIntelligence;
      const searchQuery = buyerIntel?.vocQueries?.g2Query
        || `${buyerIntel?.buyerIndustry || ''} enterprise software`;

      console.log('[apify-trustradius] PHASE 20L vocQueries query:', searchQuery);
      return {
        endpoint: '/search',
        params: {
          q: `${searchQuery} site:trustradius.com`,
          num: 15,
          hl: 'en'
        }
      };
    },
  },
  // PHASE 20L: Twitter API - uses vocQueries.twitterQuery for emotional pain language
  'twitter-api': {
    functionName: 'twitter-api',
    timeout: 30000,
    queryType: 'short',
    transform: (query, _context, _profileType, reviewSearch) => {
      const buyerIntel = reviewSearch?.buyerIntelligence;
      // Use pre-built Twitter query (includes industry + pain terms + sentiment)
      const twitterQuery = buyerIntel?.vocQueries?.twitterQuery
        || `${buyerIntel?.buyerIndustry || 'business'} frustrated OR struggling`;

      console.log('[twitter-api] PHASE 20L vocQueries query:', twitterQuery);

      return {
        query: twitterQuery.substring(0, 100), // Twitter API limit
        maxResults: 20,
        lang: 'en',
      };
    },
  },
  // PHASE 20L: LinkedIn via Serper - uses vocQueries.linkedinQuery
  'linkedin-serper': {
    functionName: 'fetch-serper',
    timeout: 15000,
    queryType: 'short',
    transform: (query, _context, _profileType, reviewSearch) => {
      const buyerIntel = reviewSearch?.buyerIntelligence;
      // linkedinQuery already includes site:linkedin.com
      const searchQuery = buyerIntel?.vocQueries?.linkedinQuery
        || `site:linkedin.com ${buyerIntel?.buyerIndustry || 'business'} challenges`;

      console.log('[linkedin-serper] PHASE 20L vocQueries query:', searchQuery);

      return {
        endpoint: '/search',
        params: {
          q: searchQuery,
          num: 20,
          hl: 'en'
        },
      };
    },
  },
  // PHASE 20L: YouTube via Serper - uses vocQueries.youtubeQuery for tutorial/problem format
  'youtube-comments': {
    functionName: 'fetch-serper',
    timeout: 15000,
    queryType: 'short',
    transform: (query, _context, _profileType, reviewSearch) => {
      const buyerIntel = reviewSearch?.buyerIntelligence;
      const searchQuery = buyerIntel?.vocQueries?.youtubeQuery
        || `${buyerIntel?.buyerIndustry || 'business'} challenges tips`;

      console.log('[youtube-comments] PHASE 20L vocQueries query:', searchQuery);
      return {
        endpoint: '/search',
        params: {
          q: `${searchQuery} site:youtube.com`,
          num: 20,
          hl: 'en'
        }
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
    timeout: 30000, // V6 FIX: Increased from 15s - edge functions timing out
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
  // V6 FIX: Serper news endpoint replaces newsapi (key not configured)
  'serper-news': {
    functionName: 'fetch-serper',
    timeout: 10000,
    queryType: 'short',
    transform: (query) => ({
      endpoint: '/news',
      params: { q: query, num: 20 },
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
  // PHASE 20L: Reddit Professional - uses vocQueries.redditSubreddits + redditQuery
  // Now uses industry-specific subreddits from BuyerIntelligence instead of hardcoded
  'reddit-professional': {
    functionName: 'apify-scraper',
    timeout: 30000,
    queryType: 'short',
    transform: (query, _context, profileType, reviewSearch) => {
      const buyerIntel = reviewSearch?.buyerIntelligence;

      // PHASE 20L: Use dynamic industry-specific subreddits from vocQueries
      const subreddits = buyerIntel?.vocQueries?.redditSubreddits || [
        'SaaS', 'sales', 'startups', 'B2BMarketing', 'Entrepreneur'
      ];

      // Use redditQuery which has pain language built in
      const searchQuery = buyerIntel?.vocQueries?.redditQuery
        || `${buyerIntel?.buyerProblem || query} frustrating OR struggling`;

      console.log('[reddit-professional] PHASE 20L vocQueries:', {
        subreddits,
        query: searchQuery.substring(0, 50),
      });

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
  // PHASE 20L: HackerNews COMMENTS - uses vocQueries.hackerNewsQuery
  'hackernews-comments': {
    functionName: 'fetch-hackernews',
    timeout: 10000,
    queryType: 'short',
    transform: (_query, _context, _profileType, reviewSearch) => {
      const buyerIntel = reviewSearch?.buyerIntelligence;
      // HN needs simple queries - vocQueries.hackerNewsQuery is already formatted
      const simpleQuery = buyerIntel?.vocQueries?.hackerNewsQuery
        || `${buyerIntel?.buyerIndustry || 'technology'} ${buyerIntel?.painKeywords?.[0] || 'challenges'}`;

      console.log('[hackernews-comments] PHASE 20L vocQueries query:', simpleQuery);

      return {
        query: simpleQuery,
        tags: 'comment',
        hitsPerPage: 30,
      };
    },
  },
  // PHASE 20L: Product Hunt - uses vocQueries.productHuntQuery
  'producthunt': {
    functionName: 'fetch-serper',
    timeout: 10000,
    queryType: 'short',
    transform: (query, _context, _profileType, reviewSearch) => {
      const buyerIntel = reviewSearch?.buyerIntelligence;
      const searchQuery = buyerIntel?.vocQueries?.productHuntQuery
        || `${buyerIntel?.buyerIndustry || 'B2B'} ${buyerIntel?.painKeywords?.[0] || 'automation'} software`;

      console.log('[producthunt] PHASE 20L vocQueries query:', searchQuery);
      return {
        endpoint: '/search',
        params: {
          q: `${searchQuery} site:producthunt.com`,
          num: 20
        },
      };
    },
  },
  // PHASE 20L: Indie Hackers - uses vocQueries.indieHackersQuery
  'indiehackers': {
    functionName: 'fetch-serper',
    timeout: 10000,
    queryType: 'short',
    transform: (_query, _context, _profileType, reviewSearch) => {
      const buyerIntel = reviewSearch?.buyerIntelligence;
      const searchQuery = buyerIntel?.vocQueries?.indieHackersQuery
        || `${buyerIntel?.buyerIndustry || 'SaaS'} B2B challenges`;

      console.log('[indiehackers] PHASE 20L vocQueries query:', searchQuery);

      return {
        endpoint: '/search',
        params: {
          q: `${searchQuery} site:indiehackers.com`,
          num: 15
        },
      };
    },
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
  // V6 Phase 18: UK Companies House - competitor intelligence
  // Filings, officers, PSC (ownership), insolvency events
  'companies-house': {
    functionName: 'companies-house',
    timeout: 30000,
    queryType: 'short', // Company name search
    transform: (query) => ({
      action: 'competitor-intel',
      params: {
        companyName: query,
      },
    }),
  },
  // PHASE 19D: Companies House VoC - UK BUYER company intelligence
  // Searches for UK companies that ARE the buyer, not generic tech companies
  'companies-house-voc': {
    functionName: 'companies-house',
    timeout: 30000,
    queryType: 'short',
    transform: (_query, _context, _profileType, reviewSearch) => {
      // PHASE 19D: Use buyer intelligence to find UK BUYER companies
      const buyerIntel = reviewSearch?.buyerIntelligence;
      const buyerIndustry = buyerIntel?.buyerIndustry || 'technology';
      const buyerProblem = buyerIntel?.buyerProblem || '';

      // Map buyer industry to relevant UK companies (companies that HAVE the problem)
      const ukBuyerCompanies: Record<string, string[]> = {
        'insurance': ['AVIVA PLC', 'PRUDENTIAL PLC', 'LEGAL & GENERAL', 'ADMIRAL GROUP', 'DIRECT LINE'],
        'healthcare': ['ASTRAZENECA', 'GLAXOSMITHKLINE', 'SMITH & NEPHEW', 'SPIRE HEALTHCARE'],
        'financial services': ['HSBC HOLDINGS', 'BARCLAYS PLC', 'LLOYDS BANKING', 'NATWEST', 'STANDARD CHARTERED'],
        'retail': ['TESCO PLC', 'SAINSBURY', 'MARKS AND SPENCER', 'NEXT PLC', 'OCADO'],
        'manufacturing': ['ROLLS-ROYCE', 'BAE SYSTEMS', 'GKN', 'IMI PLC'],
        'real estate': ['BRITISH LAND', 'LAND SECURITIES', 'SEGRO', 'SAVILLS'],
        'restaurant': ['WHITBREAD', 'MITCHELLS & BUTLERS', 'JD WETHERSPOON', 'GREGGS'],
        'technology': ['ARM HOLDINGS', 'SAGE GROUP', 'AVEVA GROUP', 'SOFTCAT'],
      };

      // Find matching buyer industry
      const industry = Object.keys(ukBuyerCompanies).find(k =>
        buyerIndustry.toLowerCase().includes(k.toLowerCase())
      ) || 'technology';

      const companies = ukBuyerCompanies[industry] || ukBuyerCompanies['technology'];

      console.log('[companies-house-voc] PHASE 19D - Searching UK BUYER companies:', {
        buyerIndustry,
        buyerProblem,
        industry,
        companies: companies.slice(0, 3),
      });

      return {
        action: 'competitor-intel',
        params: {
          companyName: companies[0],
        }
      };
    },
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
  // PHASE 19: Perplexity for finding BUYER PROBLEM discussions
  // This is the main VoC API - now searches for what BUYERS say about THEIR PROBLEMS
  'perplexity-reviews': {
    functionName: 'perplexity-proxy',
    timeout: 45000,
    queryType: 'short',
    transform: (_query, _context, _profileType, reviewSearch) => {
      // PHASE 19: Extract buyer intelligence for targeted searches
      const buyerIntel = reviewSearch?.buyerIntelligence;
      const buyerRole = buyerIntel?.buyerRole || 'business professional';
      const buyerProblem = buyerIntel?.buyerProblem || 'operational challenges';
      const buyerIndustry = buyerIntel?.buyerIndustry || 'business';
      const painKeywords = buyerIntel?.painKeywords || [];
      const alternatives = reviewSearch?.alternatives || [];
      const exclusions = reviewSearch?.exclusions || [];

      // Build context from alternatives
      const alternativeSearches = alternatives.length > 0
        ? `Also search for discussions about: ${alternatives.join(', ')}`
        : '';

      console.log('[perplexity-reviews] PHASE 19 Buyer Intelligence:', {
        buyerRole,
        buyerProblem,
        buyerIndustry,
        painKeywords,
      });

      return {
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: `You are a buyer intelligence researcher. Your job is to find what ${buyerRole}s in ${buyerIndustry} are saying about "${buyerProblem}".

CRITICAL RULES:
1. Find 8-12 REAL quotes from ${buyerRole}s discussing their challenges
2. Search: Reddit (r/sales, r/insurance, industry subreddits), LinkedIn discussions, industry forums, Quora, professional communities
3. Each quote must be first-person: "I", "We", "Our team", "My company"
4. Focus on PROBLEM DISCUSSIONS, not product reviews:
   - "We struggled with..."
   - "Our biggest challenge was..."
   - "I wish we could..."
   - "The hardest part of..."
   - "What keeps me up at night is..."
5. DO NOT return:
   - Product reviews or software comparisons
   - Marketing content or vendor pitches
   - Generic advice or how-to content
${exclusions.length > 0 ? `6. EXCLUDE discussions about: ${exclusions.join(', ')}` : ''}
${painKeywords.length > 0 ? `7. Prioritize discussions mentioning: ${painKeywords.join(', ')}` : ''}

${alternativeSearches}

Format each quote as:
**[Pain Point Theme]**
"[Exact quote about their problem]"
- Source: [Platform], [Role/Title if known]`
          },
          {
            role: 'user',
            content: `Find real discussions from ${buyerRole}s in ${buyerIndustry} about their challenges with "${buyerProblem}".

Search professional communities, industry forums, Reddit, LinkedIn, and Quora for first-person accounts of this problem.

I want to understand:
1. What frustrates them most about this problem?
2. What have they tried that didn't work?
3. What do they wish existed?
4. How does this problem impact their business?

Return direct quotes from real people - not product reviews, marketing content, or vendor descriptions.`
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

  // PHASE 19D: SEC-API.io for BUYER company intelligence
  // Now searches for companies that ARE the buyer (target customer's company type)
  // Instead of generic tech companies, find the buyer's peers
  'sec-api-io': {
    functionName: 'sec-api-io',
    timeout: 45000,
    queryType: 'short',
    transform: (_query, _context, _profileType, reviewSearch) => {
      // PHASE 19D: Use buyer intelligence to find BUYER companies
      const buyerIntel = reviewSearch?.buyerIntelligence;
      const buyerIndustry = buyerIntel?.buyerIndustry || 'technology';
      const buyerProblem = buyerIntel?.buyerProblem || '';

      // Map buyer industry to relevant company tickers (companies that HAVE the problem)
      const buyerIndustryTickers: Record<string, string[]> = {
        'insurance': ['MET', 'PRU', 'AIG', 'ALL', 'TRV', 'AFL', 'CINF'],
        'healthcare': ['UNH', 'CVS', 'CI', 'HUM', 'CNC', 'ANTM'],
        'financial services': ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'C'],
        'retail': ['WMT', 'TGT', 'COST', 'HD', 'LOW', 'BBY'],
        'manufacturing': ['CAT', 'DE', 'MMM', 'GE', 'HON'],
        'real estate': ['CBRE', 'JLL', 'RE', 'WPC'],
        'restaurant': ['MCD', 'SBUX', 'CMG', 'DRI', 'YUM'],
        'technology': ['MSFT', 'GOOGL', 'AMZN', 'CRM', 'NOW'],
      };

      // Find matching buyer industry tickers
      const industry = Object.keys(buyerIndustryTickers).find(k =>
        buyerIndustry.toLowerCase().includes(k.toLowerCase())
      ) || 'technology';

      const tickers = buyerIndustryTickers[industry] || buyerIndustryTickers['technology'];

      console.log('[sec-api-io] PHASE 19D - Searching BUYER companies:', {
        buyerIndustry,
        buyerProblem,
        industry,
        tickers: tickers.slice(0, 3),
      });

      return {
        action: 'extract-executive-quotes',
        params: {
          ticker: tickers[0],
          industry,
          // PHASE 19D: Add buyer problem context for better quote extraction
          searchContext: buyerProblem || undefined,
        }
      };
    },
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
// V5 FIX: Reddit-enterprise has no edge functions - mark as fallback
// V6 VOC FIX: producthunt, indiehackers, hackernews-comments now have edge function configs
// V6 FIX: newsapi replaced by serper-news (key not configured)
const FALLBACK_APIS = new Set([
  'outscraper-multi', 'apify-clutch', 'apify-upwork', 'apify-nextdoor',
  'reddit-marketing', 'reddit-regional', 'reddit-enterprise', 'linkedin', 'facebook-groups',
  'newsapi', 'newsapi-local', 'newsapi-tech', 'newsapi-marketing', 'newsapi-regional',
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
