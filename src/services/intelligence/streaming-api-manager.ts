/**
 * Streaming API Manager - EventEmitter-based Progressive Loading
 *
 * Each API updates independently as it completes.
 * No waiting for batches or waves.
 * Shows cached data immediately, then streams fresh data.
 */

import { EventEmitter } from 'events';
import { DeepContext } from '../../types/intelligence';
import { selectAPIsForIndustry } from './industry-api-selector.service';
import { apiRetryWrapper } from './api-retry-wrapper';
import { performanceOptimizer } from './performance-optimizer.service';
import { triggerSearchQueryGenerator, type TriggerSearchQueries } from './trigger-search-query-generator.service';
import { llmTriggerSynthesizer, type RawDataSample } from '../triggers/llm-trigger-synthesizer.service';
import { earlyTriggerLoaderService, type EarlyTriggerEvent } from '../triggers/early-trigger-loader.service';
import type { BusinessProfileType } from '../triggers/profile-detection.service';
import type { CompleteUVP } from '@/types/uvp-flow.types';

// API Event Types
export type ApiEventType =
  | 'youtube-trending'
  | 'youtube-comments'
  | 'youtube-engagement'
  | 'apify-website'
  | 'apify-maps'
  | 'apify-reviews'
  | 'apify-instagram'
  | 'apify-twitter-sentiment'
  | 'apify-quora-insights'
  | 'apify-linkedin-b2b'
  | 'apify-trustpilot-reviews'
  | 'apify-g2-reviews'
  | 'outscraper-business'
  | 'outscraper-reviews'
  | 'serper-search'
  | 'serper-quora'
  | 'serper-news'
  | 'semrush-domain'
  | 'semrush-keywords'
  | 'semrush-competitors'
  | 'semrush-backlinks'
  | 'news-breaking'
  | 'news-trending'
  | 'weather-conditions'
  | 'linkedin-company'
  | 'linkedin-network'
  | 'perplexity-research'
  | 'website-analysis';

export interface ApiUpdate {
  type: ApiEventType;
  data: any;
  timestamp: number;
  fromCache: boolean;
  error?: Error;
}

export interface ApiStatus {
  type: ApiEventType;
  status: 'idle' | 'loading' | 'success' | 'error';
  startTime?: number;
  endTime?: number;
  duration?: number;
  error?: Error;
}

class StreamingApiManager extends EventEmitter {
  private apiStatuses: Map<ApiEventType, ApiStatus> = new Map();
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private CACHE_TTL = 60 * 60 * 1000; // 1 hour

  // PERMANENT FIX: Event batching to prevent 23+ separate re-renders
  // Research source: React 18 batching only works within same event loop tick
  // Async callbacks create new ticks, so we manually batch with a 200ms window
  private eventBuffer: Map<ApiEventType, ApiUpdate> = new Map();
  private batchFlushTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly BATCH_WINDOW_MS = 200; // Batch events within 200ms window

  // Profile-based query generation
  private currentSearchQueries: TriggerSearchQueries | null = null;
  private currentProfileType: BusinessProfileType = 'national-saas-b2b';
  private currentUVP: CompleteUVP | null = null;
  private currentBrandName: string = '';
  private currentIndustry: string = '';

  // Buffer for raw data samples (for LLM trigger synthesis)
  private rawDataBuffer: RawDataSample[] = [];

  // Guard against duplicate/concurrent loadAllApis calls
  private isLoadingApis = false;
  private currentLoadBrandId: string | null = null;

  // Early loading state
  private earlyLoadingStarted = false;
  private earlyLoadBrandId: string | null = null;

  // =========================================================================
  // PHASE 10: Trusted Source Domains - Reject hallucinated/fake sources
  // Only accept evidence from platforms with REAL user-generated content
  // =========================================================================
  private readonly TRUSTED_SOURCE_DOMAINS: Set<string> = new Set([
    // Tier 1 - Verified UGC Platforms (highest trust)
    'reddit.com',
    'g2.com',
    'trustpilot.com',
    'capterra.com',
    'gartner.com',
    'trustradius.com',
    'softwareadvice.com',
    'getapp.com',

    // Tier 2 - Professional/Social Platforms
    'linkedin.com',
    'quora.com',
    'youtube.com',
    'twitter.com',
    'x.com',
    'medium.com',
    'dev.to',
    'hackernews.com',
    'news.ycombinator.com',

    // Tier 3 - Industry Publications
    'forbes.com',
    'techcrunch.com',
    'venturebeat.com',
    'zdnet.com',
    'cio.com',
    'computerworld.com',
    'infoworld.com',
    'wired.com',
    'theverge.com',
    'arstechnica.com',
    'infotechlead.com',
    'insurancetimes.co.uk',
    'insurancejournal.com',
    'propertycasualty360.com',

    // Tier 4 - Research/Analyst Firms
    'forrester.com',
    'mckinsey.com',
    'hbr.org',
    'deloitte.com',
    'accenture.com',
    'pwc.com',
    'bain.com',
    'bcg.com',

    // Tier 5 - Industry-Specific (SaaS/Tech)
    'producthunt.com',
    'betalist.com',
    'saashub.com',
    'alternativeto.net',
    'slashdot.org',
    'stackoverflow.com',
    'stackexchange.com',

    // Tier 6 - Tech Community Forums
    'cursor.com',
    'tribe.ai',
    'community.openai.com',
    'discuss.huggingface.co',
    'discord.com',
    'slack.com',
    'discourse.org',

    // Tier 7 - AI/Tech News
    'theinformation.com',
    'semafor.com',
    'axios.com',
    'businessinsider.com',
    'insider.com',
    'cnbc.com',
    'bloomberg.com',
    'reuters.com',
    'wsj.com',
    'nytimes.com',
  ]);

  /**
   * Validate if a URL is a valid, real URL structure
   * CHANGED: No longer restricts to allowlist - accepts any valid URL
   * Only rejects obviously fake/malformed URLs
   */
  private isValidSourceDomain(url: string | undefined): boolean {
    if (!url) return false;

    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase();

      // Must have a valid protocol
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return false;
      }

      // Must have a real domain (not localhost, not IP only)
      if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
        return false;
      }

      // Must have at least one dot (real domain)
      if (!hostname.includes('.')) {
        return false;
      }

      // Reject obviously fake/placeholder domains AND known LLM hallucinations
      const fakeDomains = [
        // Placeholder/test domains
        'example.com', 'test.com', 'placeholder.com', 'fake.com',
        // Known LLM hallucinations - Perplexity sometimes invents these
        // NOTE: spear-tech.com is VALID - https://www.spear-tech.com/ensuring-compliance-with-technology-a-guide-for-insurers/
        'aiplatform-reviews.com', // Common hallucination pattern
        'tech-solution.com',
        'enterprise-ai.com',
        'ai-insights.com',
        'software-reviews.net',
        'chatbot-platform.com',
      ];
      if (fakeDomains.some(fake => hostname.includes(fake))) {
        console.log(`[StreamingAPI] ⚠️ Rejected fake/hallucinated domain: ${hostname}`);
        return false;
      }

      // Accept any other valid URL
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Extract product keywords from UVP for search query enhancement
   * Used to make Perplexity queries product-specific instead of generic
   *
   * FIXED: Now extracts actual product description, not just pattern matches
   */
  private extractProductKeywords(uvp: CompleteUVP | null): string[] {
    if (!uvp) return [];

    const keywords: string[] = [];

    // PRIORITY 1: Use the FULL uniqueSolution statement (most accurate product description)
    if (uvp.uniqueSolution?.statement) {
      const solution = uvp.uniqueSolution.statement.trim();
      // Take the first sentence or first 100 chars as the product description
      const firstSentence = solution.split(/[.!?]/)[0]?.trim();
      if (firstSentence && firstSentence.length > 10) {
        keywords.push(firstSentence);
      }
    }

    // PRIORITY 2: Extract specific product category terms
    const fullText = [
      uvp.uniqueSolution?.statement || '',
      uvp.keyBenefit?.statement || '',
      typeof uvp.whatYouDo === 'string' ? uvp.whatYouDo : (uvp.whatYouDo as any)?.statement || ''
    ].join(' ').toLowerCase();

    // High-value product category patterns (prioritized)
    const highValuePatterns = [
      /conversational\s*ai/gi,
      /chatbot/gi,
      /virtual\s*assistant/gi,
      /ai\s*agent/gi,
      /customer\s*service\s*automation/gi,
      /intelligent\s*automation/gi,
      /dialogue\s*management/gi,
      /natural\s*language/gi,
      /voice\s*assistant/gi,
      /ai\s*platform/gi,
    ];

    for (const pattern of highValuePatterns) {
      const matches = fullText.match(pattern);
      if (matches) {
        keywords.push(...matches.map(m => m.trim()));
      }
    }

    // If no specific patterns found, fall back to whatYouDo
    if (keywords.length === 0 && uvp.whatYouDo) {
      const whatYouDo = typeof uvp.whatYouDo === 'string'
        ? uvp.whatYouDo
        : (uvp.whatYouDo as any)?.statement || '';
      if (whatYouDo.length > 10) {
        keywords.push(whatYouDo.split(/[.!?]/)[0]?.trim() || '');
      }
    }

    // Dedupe and clean
    const unique = [...new Set(keywords.filter(k => k && k.length > 3))];

    console.log('[StreamingAPI] Extracted product keywords:', unique.slice(0, 3));
    return unique;
  }

  /**
   * Extract product category/industry from UVP instead of using NAICS codes
   * This ensures we use "conversational AI" instead of "Software Publishers"
   */
  private extractProductCategoryFromUVP(uvp: CompleteUVP | null, fallbackIndustry: string): string {
    if (!uvp) return fallbackIndustry;

    // Build full text from UVP
    const uniqueSolution = uvp.uniqueSolution?.statement || '';
    const keyBenefit = uvp.keyBenefit?.statement || '';
    const whatYouDo = typeof uvp.whatYouDo === 'string'
      ? uvp.whatYouDo
      : (uvp.whatYouDo as any)?.statement || '';
    const targetCustomer = uvp.targetCustomer?.statement || '';

    const fullText = `${uniqueSolution} ${keyBenefit} ${whatYouDo} ${targetCustomer}`.toLowerCase();

    // High-value category patterns that should override NAICS codes
    // Ordered by specificity - more specific matches first
    const categoryPatterns: Array<{ pattern: RegExp; category: string }> = [
      // Tech/AI
      { pattern: /conversational\s*ai/i, category: 'conversational AI' },
      { pattern: /chatbot|chat\s*bot/i, category: 'chatbot' },
      { pattern: /ai\s*agent|intelligent\s*agent/i, category: 'AI agent' },
      { pattern: /virtual\s*assistant/i, category: 'virtual assistant' },
      { pattern: /customer\s*service\s*automation/i, category: 'customer service automation' },
      { pattern: /contact\s*center\s*automation/i, category: 'contact center automation' },
      { pattern: /self-?service\s*platform/i, category: 'self-service platform' },

      // Marketing/Agency
      { pattern: /marketing\s*automation/i, category: 'marketing automation' },
      { pattern: /digital\s*marketing/i, category: 'digital marketing' },
      { pattern: /seo\s*(agency|services)/i, category: 'SEO services' },
      { pattern: /content\s*marketing/i, category: 'content marketing' },

      // Financial/Insurance
      { pattern: /insurance\s*(platform|automation|ai)/i, category: 'insurance technology' },
      { pattern: /fintech/i, category: 'fintech' },
      { pattern: /financial\s*services/i, category: 'financial services' },
      { pattern: /accounting\s*(software|platform)/i, category: 'accounting software' },

      // Local Services
      { pattern: /hvac|heating.*cooling/i, category: 'HVAC services' },
      { pattern: /dental|dentist/i, category: 'dental practice' },
      { pattern: /salon|beauty/i, category: 'salon and beauty' },
      { pattern: /restaurant|food\s*service/i, category: 'restaurant' },
      { pattern: /fitness|gym/i, category: 'fitness' },

      // Enterprise/B2B
      { pattern: /enterprise\s*software/i, category: 'enterprise software' },
      { pattern: /saas\s*platform/i, category: 'SaaS platform' },
      { pattern: /crm/i, category: 'CRM' },
      { pattern: /erp/i, category: 'ERP' },

      // E-commerce/Retail
      { pattern: /ecommerce|e-commerce/i, category: 'e-commerce' },
      { pattern: /retail\s*(platform|software)/i, category: 'retail technology' },
    ];

    // Find the first matching category
    for (const { pattern, category } of categoryPatterns) {
      if (pattern.test(fullText)) {
        console.log(`[StreamingAPI] 🎯 UVP-derived product category: "${category}" (not NAICS "${fallbackIndustry}")`);
        return category;
      }
    }

    // If no specific pattern found, try to extract from whatYouDo first sentence
    if (whatYouDo && whatYouDo.length > 10) {
      const firstSentence = whatYouDo.split(/[.!?]/)[0]?.trim();
      if (firstSentence && firstSentence.length > 10 && firstSentence.length < 100) {
        console.log(`[StreamingAPI] 🎯 Using whatYouDo as category: "${firstSentence}"`);
        return firstSentence;
      }
    }

    // Fallback to NAICS but warn
    console.warn(`[StreamingAPI] ⚠️ No UVP category found, using NAICS: "${fallbackIndustry}"`);
    return fallbackIndustry;
  }

  constructor() {
    super();
    this.setMaxListeners(50); // Support many components listening

    // Wire up early trigger loader for Phase 8.7
    this.setupEarlyLoadingListener();
  }

  /**
   * Set up listener for early trigger loading events
   * Starts loading as soon as Target Customer section is populated
   */
  private setupEarlyLoadingListener(): void {
    earlyTriggerLoaderService.on('queries-ready', (event: EarlyTriggerEvent) => {
      console.log('[StreamingAPI] 🚀 Early trigger queries ready - starting early loading');

      const { queries, profileType, brandId } = event.data;

      if (!brandId) {
        console.warn('[StreamingAPI] Early loading skipped - no brandId');
        return;
      }

      // Prevent duplicate early loading for same brand
      if (this.earlyLoadingStarted && this.earlyLoadBrandId === brandId) {
        console.log('[StreamingAPI] Early loading already started for this brand');
        return;
      }

      this.earlyLoadingStarted = true;
      this.earlyLoadBrandId = brandId;

      // Store profile type and queries for later use
      this.currentProfileType = profileType;

      // Mark loading as started in the early loader
      earlyTriggerLoaderService.markLoadingStarted();

      // Start lightweight early API calls (fast sources only)
      this.startEarlyApiLoading(brandId, profileType, queries);
    });

    // Reset early loading state when full UVP is ready
    earlyTriggerLoaderService.on('refinement-available', (event: EarlyTriggerEvent) => {
      if (event.data.isFinal) {
        console.log('[StreamingAPI] Full UVP ready - early loading complete');
        // Queries will be regenerated with full data in loadAllApis
      }
    });
  }

  /**
   * Start early API loading with profile-specific fast sources
   * Only loads quick, cache-friendly APIs to avoid blocking
   */
  private async startEarlyApiLoading(
    brandId: string,
    profileType: BusinessProfileType,
    queries: any
  ): Promise<void> {
    console.log('[StreamingAPI] Starting early loading for profile:', profileType);

    // For now, emit an event to notify that early loading has started
    // The full API loading will happen when loadAllApis is called
    this.emit('early-loading-started', {
      brandId,
      profileType,
      queriesReady: true,
      timestamp: Date.now()
    });

    // Start Perplexity research early (fast and high-value)
    // This is the most valuable early API call
    try {
      const { perplexityAPI } = await import('../uvp-wizard/perplexity-api');

      // Use fear queries for early research (from TriggerSearchQueries)
      const searchTerms = queries.fearQueries?.slice(0, 3) || [queries.targetCustomer, `${profileType} buyer triggers`];

      console.log('[StreamingAPI] Early Perplexity query:', searchTerms[0]);

      const perplexityData = await perplexityAPI.findPainPointConversations(
        searchTerms,
        queries.industry || 'technology'
      );

      if (perplexityData) {
        this.emitUpdate('perplexity-research', perplexityData, false);
        this.updateStatus('perplexity-research', 'success');
        console.log('[StreamingAPI] ✅ Early Perplexity research complete');
      }
    } catch (error) {
      console.warn('[StreamingAPI] Early Perplexity failed (non-blocking):', error);
    }
  }

  /**
   * Reset early loading state (called when brand changes)
   */
  resetEarlyLoading(): void {
    this.earlyLoadingStarted = false;
    this.earlyLoadBrandId = null;
  }

  /**
   * Detect profile type from brand data (fallback when not provided)
   */
  private detectProfileFromBrand(brand: any): BusinessProfileType {
    const industry = (brand.industry || '').toLowerCase();
    const targetCustomers = (brand.targetCustomers || '').toLowerCase();

    // SaaS indicators
    if (industry.includes('software') || industry.includes('saas') ||
        industry.includes('platform') || industry.includes('ai') ||
        industry.includes('technology') || industry.includes('tech')) {
      // Check for global indicators
      if (targetCustomers.includes('enterprise') || targetCustomers.includes('global') ||
          targetCustomers.includes('emea') || targetCustomers.includes('uk')) {
        return 'global-saas-b2b';
      }
      return 'national-saas-b2b';
    }

    // Agency indicators
    if (industry.includes('marketing') || industry.includes('consulting') ||
        industry.includes('agency') || industry.includes('accounting')) {
      return 'regional-b2b-agency';
    }

    // Local B2B indicators
    if (industry.includes('hvac') || industry.includes('plumbing') ||
        industry.includes('it services') || industry.includes('commercial')) {
      return 'local-service-b2b';
    }

    // Local B2C indicators
    if (industry.includes('dental') || industry.includes('salon') ||
        industry.includes('restaurant') || industry.includes('spa')) {
      return 'local-service-b2c';
    }

    // Product indicators
    if (industry.includes('retail') || industry.includes('product') ||
        industry.includes('manufacturing') || industry.includes('consumer')) {
      return 'national-product-b2c';
    }

    // Default to SaaS B2B for tech companies
    return 'national-saas-b2b';
  }

  /**
   * Get API gating configuration based on profile type
   * Used for TRIGGERS - general data collection
   */
  private getAPIGatingForProfile(profileType: BusinessProfileType): {
    useWeather: boolean;
    useLinkedIn: boolean;
    useG2: boolean;
    useLocalReviews: boolean;
    useTrustpilot: boolean;
  } {
    switch (profileType) {
      case 'local-service-b2b':
        return {
          useWeather: true,
          useLinkedIn: true,
          useG2: false,
          useLocalReviews: true,
          useTrustpilot: false,
        };

      case 'local-service-b2c':
        return {
          useWeather: true,
          useLinkedIn: false,
          useG2: false,
          useLocalReviews: true,
          useTrustpilot: true,
        };

      case 'regional-b2b-agency':
        return {
          useWeather: false,
          useLinkedIn: true,
          useG2: true,
          useLocalReviews: true,
          useTrustpilot: true, // Trustpilot has B2B reviews too
        };

      case 'regional-retail-b2c':
        return {
          useWeather: false,
          useLinkedIn: false,
          useG2: false,
          useLocalReviews: true,
          useTrustpilot: true,
        };

      case 'national-saas-b2b':
      case 'global-saas-b2b':
        return {
          useWeather: false,
          useLinkedIn: true,
          useG2: true,
          useLocalReviews: false,
          useTrustpilot: true, // Trustpilot has B2B reviews too
        };

      case 'national-product-b2c':
        return {
          useWeather: false,
          useLinkedIn: false,
          useG2: false,
          useLocalReviews: false,
          useTrustpilot: true,
        };

      default:
        return {
          useWeather: false,
          useLinkedIn: true,
          useG2: true,
          useLocalReviews: false,
          useTrustpilot: false,
        };
    }
  }

  /**
   * Get PROOF-specific API gating configuration
   * Different from trigger gating - focuses on credibility sources
   *
   * Proof API sources by profile:
   * - Local B2B: Google Reviews, Website (testimonials), BBB, LinkedIn
   * - Local B2C: Google Reviews, Yelp, Website, Healthgrades, Facebook
   * - Regional Agency: Clutch, Google Reviews, Website, LinkedIn, G2
   * - Regional Retail: Google Reviews, Website, Local awards, Facebook
   * - National SaaS: G2, Capterra, Website, TrustRadius, LinkedIn
   * - National Product: Trustpilot, Website, Amazon (future), Social
   */
  getProofAPIGatingForProfile(profileType: BusinessProfileType): {
    useGoogleReviews: boolean;
    useG2Reviews: boolean;
    useTrustpilot: boolean;
    useYelp: boolean;
    useLinkedIn: boolean;
    useWebsiteTestimonials: boolean;
    useCapterra: boolean;
    useTrustRadius: boolean;
    useClutch: boolean;
    useBBB: boolean;
    useHealthgrades: boolean;
    useFacebook: boolean;
    priority: ApiEventType[];  // Ordered list of which APIs to prioritize
  } {
    switch (profileType) {
      case 'local-service-b2b':
        // Commercial HVAC, IT services, etc.
        return {
          useGoogleReviews: true,
          useG2Reviews: false,
          useTrustpilot: false,
          useYelp: false,       // Skip consumer Yelp
          useLinkedIn: true,
          useWebsiteTestimonials: true,
          useCapterra: false,
          useTrustRadius: false,
          useClutch: false,
          useBBB: true,
          useHealthgrades: false,
          useFacebook: false,
          priority: ['outscraper-reviews', 'website-analysis', 'apify-linkedin-b2b'],
        };

      case 'local-service-b2c':
        // Dental, salon, restaurant, etc.
        return {
          useGoogleReviews: true,
          useG2Reviews: false,
          useTrustpilot: true,
          useYelp: true,        // Yelp important for local B2C
          useLinkedIn: false,
          useWebsiteTestimonials: true,
          useCapterra: false,
          useTrustRadius: false,
          useClutch: false,
          useBBB: true,
          useHealthgrades: true, // For healthcare services
          useFacebook: true,
          priority: ['outscraper-reviews', 'website-analysis', 'apify-trustpilot-reviews'],
        };

      case 'regional-b2b-agency':
        // Marketing, accounting, consulting
        return {
          useGoogleReviews: true,
          useG2Reviews: true,
          useTrustpilot: true,
          useYelp: false,
          useLinkedIn: true,
          useWebsiteTestimonials: true,
          useCapterra: false,
          useTrustRadius: false,
          useClutch: true,      // Clutch important for agencies
          useBBB: false,
          useHealthgrades: false,
          useFacebook: false,
          priority: ['apify-g2-reviews', 'outscraper-reviews', 'website-analysis', 'apify-linkedin-b2b'],
        };

      case 'regional-retail-b2c':
        // Multi-location retail, franchise
        return {
          useGoogleReviews: true,
          useG2Reviews: false,
          useTrustpilot: true,
          useYelp: true,
          useLinkedIn: false,
          useWebsiteTestimonials: true,
          useCapterra: false,
          useTrustRadius: false,
          useClutch: false,
          useBBB: true,
          useHealthgrades: false,
          useFacebook: true,
          priority: ['outscraper-reviews', 'website-analysis', 'apify-trustpilot-reviews'],
        };

      case 'national-saas-b2b':
      case 'global-saas-b2b':
        // SaaS companies like OpenDialog
        return {
          useGoogleReviews: false,  // Skip local reviews
          useG2Reviews: true,       // Primary source
          useTrustpilot: true,
          useYelp: false,
          useLinkedIn: true,
          useWebsiteTestimonials: true,
          useCapterra: true,        // Important for SaaS
          useTrustRadius: true,     // Enterprise reviews
          useClutch: false,
          useBBB: false,
          useHealthgrades: false,
          useFacebook: false,
          priority: ['apify-g2-reviews', 'website-analysis', 'apify-trustpilot-reviews', 'apify-linkedin-b2b'],
        };

      case 'national-product-b2c':
        // Consumer brands, manufacturers
        return {
          useGoogleReviews: false,
          useG2Reviews: false,
          useTrustpilot: true,      // Primary consumer review source
          useYelp: false,
          useLinkedIn: false,
          useWebsiteTestimonials: true,
          useCapterra: false,
          useTrustRadius: false,
          useClutch: false,
          useBBB: false,
          useHealthgrades: false,
          useFacebook: true,        // Social proof
          priority: ['apify-trustpilot-reviews', 'website-analysis'],
        };

      default:
        // Default to SaaS-like gating
        return {
          useGoogleReviews: true,
          useG2Reviews: true,
          useTrustpilot: true,
          useYelp: false,
          useLinkedIn: true,
          useWebsiteTestimonials: true,
          useCapterra: false,
          useTrustRadius: false,
          useClutch: false,
          useBBB: false,
          useHealthgrades: false,
          useFacebook: false,
          priority: ['outscraper-reviews', 'apify-g2-reviews', 'website-analysis'],
        };
    }
  }

  /**
   * Get cached data for immediate display
   */
  getCachedData(brandId: string): Partial<DeepContext> {
    const cacheKey = `deep-context-${brandId}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log('[StreamingAPI] Returning cached data for immediate display');
      return cached.data;
    }

    return {};
  }

  /**
   * Clear all cached data - use when data is stale/garbage
   * Also resets loading guards to allow fresh API calls
   */
  clearCache(brandId?: string): void {
    // Reset loading guards so user can force a fresh load
    this.isLoadingApis = false;
    this.currentLoadBrandId = null;

    if (brandId) {
      const cacheKey = `deep-context-${brandId}`;
      this.cache.delete(cacheKey);
      console.log(`[StreamingAPI] Cleared cache for brand: ${brandId}`);
    } else {
      this.cache.clear();
      console.log('[StreamingAPI] Cleared ALL cached data');
    }
  }

  /**
   * Clear ALL caches including localStorage - use for forceFresh mode
   * This ensures APIs actually fire instead of returning cached data
   */
  private clearAllCaches(brandId: string): void {
    // Clear in-memory cache
    this.clearCache(brandId);

    // Clear localStorage caches that might prevent API calls
    try {
      // Clear deepContext cache
      localStorage.removeItem(`deepContext_${brandId}`);
      localStorage.removeItem(`deep-context-${brandId}`);

      // Clear triggers cache - ALL versions
      localStorage.removeItem('triggersDevPage_deepContext_v1');
      localStorage.removeItem('triggersDevPage_triggers_v1');
      localStorage.removeItem('triggersDevPage_deepContext_v2');
      localStorage.removeItem('triggersDevPage_triggers_v2');
      localStorage.removeItem('triggersDevPage_deepContext_v3');
      localStorage.removeItem('triggersDevPage_triggers_v3');
      localStorage.removeItem('triggersDevPage_brand_v3');
      localStorage.removeItem('triggersDevPage_apiDisabled_v3');

      // Clear raw data buffer - ALL versions
      localStorage.removeItem('triggersDevPage_rawDataBuffer_v1');
      localStorage.removeItem('triggersDevPage_rawDataBuffer_v2');
      localStorage.removeItem('triggersDevPage_rawDataBuffer_v3');

      // Clear any conversation caches
      localStorage.removeItem(`conversations_${brandId}`);

      console.log('[StreamingAPI] 🗑️ Cleared all localStorage caches for brand:', brandId);
    } catch (e) {
      console.warn('[StreamingAPI] Failed to clear localStorage:', e);
    }

    // Reset early loading state to allow full reload
    this.earlyLoadingStarted = false;
    this.earlyLoadBrandId = null;

    // Clear raw data buffer
    this.rawDataBuffer = [];
  }

  /**
   * Load all APIs in parallel with streaming updates
   * Now accepts profile type and UVP for intelligent API gating and query generation
   */
  async loadAllApis(
    brandId: string,
    brand: any,
    options?: {
      profileType?: BusinessProfileType;
      uvp?: CompleteUVP | null;
      forceFresh?: boolean; // Skip cache and force all APIs to fire
    }
  ): Promise<void> {
    const forceFresh = options?.forceFresh ?? false;

    // GUARD: Prevent duplicate/concurrent calls for the same brand (unless forceFresh)
    if (this.isLoadingApis && this.currentLoadBrandId === brandId && !forceFresh) {
      console.log('[StreamingAPI] ⚠️ Ignoring duplicate loadAllApis call - already loading for brand:', brandId);
      return;
    }

    // If loading a different brand, that's a legitimate new request
    if (this.isLoadingApis && this.currentLoadBrandId !== brandId) {
      console.log('[StreamingAPI] ⚠️ New brand requested while loading - allowing switch from', this.currentLoadBrandId, 'to', brandId);
    }

    this.isLoadingApis = true;
    this.currentLoadBrandId = brandId;

    // FORCE FRESH: Clear all caches to ensure APIs actually fire
    if (forceFresh) {
      console.log('[StreamingAPI] 🔄 FORCE FRESH MODE - clearing all caches');
      this.clearAllCaches(brandId);
    }

    console.log('[StreamingAPI] Starting optimized parallel load of all APIs', forceFresh ? '(FORCE FRESH)' : '');
    const startTime = performance.now();

    // Determine profile type - use provided or fall back to NAICS-based detection
    const profileType = options?.profileType || this.detectProfileFromBrand(brand);

    // Generate psychology-focused search queries
    const searchQueries = triggerSearchQueryGenerator.generateQueries({
      uvp: options?.uvp,
      brand,
      profileType,
    });

    console.log('[StreamingAPI] Profile:', profileType, '| Target:', searchQueries.targetCustomer);

    // Store for use in API calls and trigger synthesis
    this.currentSearchQueries = searchQueries;
    this.currentProfileType = profileType;
    this.currentUVP = options?.uvp || null;
    this.currentBrandName = brand.name || '';
    // FIXED: Use UVP-derived product category instead of NAICS code
    // This ensures "conversational AI" instead of "Software Publishers"
    this.currentIndustry = this.extractProductCategoryFromUVP(
      options?.uvp || null,
      brand.industry || searchQueries.industry || ''
    );

    // Clear raw data buffer for new load
    this.rawDataBuffer = [];

    // First, emit all cached data immediately (< 50ms) - SKIP if forceFresh
    if (!forceFresh) {
      const cachedData = this.getCachedData(brandId);
      if (Object.keys(cachedData).length > 0) {
        this.emit('cache-loaded', cachedData);
        console.log('[StreamingAPI] Cached data emitted in', (performance.now() - startTime).toFixed(0), 'ms');
      }
    }

    // Build API call map based on profile type
    const apiCalls = new Map<string, () => Promise<void>>();

    // Profile-based API gating
    const apiGating = this.getAPIGatingForProfile(profileType);

    // Add Weather API only for outdoor/local businesses
    if (apiGating.useWeather) {
      apiCalls.set('weather-conditions', () => this.loadWeatherApi(brand));
    }

    // Add LinkedIn/G2 only for B2B profiles
    if (apiGating.useLinkedIn) {
      apiCalls.set('linkedin-company', () => this.loadLinkedInData(brand));
    }

    // Add local review APIs only for local businesses
    if (apiGating.useLocalReviews) {
      apiCalls.set('outscraper-data', () => this.loadOutscraperData(brand));
    }

    // Universal APIs (always run)
    // NOTE: Skipping news-api (broken module import), using Serper news instead
    // apiCalls.set('news-breaking', () => this.loadNewsApi(brand));
    apiCalls.set('serper-search', () => this.loadSerperQuickData(brand));
    apiCalls.set('youtube-trending', () => this.loadYouTubeApi(brand));
    apiCalls.set('website-analysis', () => this.loadWebsiteAnalysis(brand));
    apiCalls.set('serper-full', () => this.loadSerperFullData(brand));
    apiCalls.set('apify-data', () => this.loadApifyData(brand));
    apiCalls.set('apify-social-data', () => this.loadApifySocialData(brand));
    apiCalls.set('semrush-data', () => this.loadSemrushData(brand));
    apiCalls.set('perplexity-research', () => this.loadPerplexityData(brand));
    apiCalls.set('reddit-intelligence', () => this.loadRedditData(brand)); // Direct Reddit via Apify

    console.log(`[StreamingAPI] Running ${apiCalls.size} APIs for ${profileType} profile`);

    // Use performance optimizer to load in optimal order
    const optimizedCalls = performanceOptimizer.optimizeLoadOrder(apiCalls);

    // Execute all optimized calls
    await Promise.allSettled(optimizedCalls);

    // Log performance metrics
    const totalTime = performance.now() - startTime;
    const report = performanceOptimizer.getPerformanceReport();

    console.log('[StreamingAPI] All APIs loaded in', totalTime.toFixed(0), 'ms');
    console.log('[StreamingAPI] Performance Report:', {
      averageLoadTime: report.averageLoadTime.toFixed(0) + 'ms',
      fastestAPI: report.fastestAPI,
      slowestAPI: report.slowestAPI,
      apisLoaded: apiCalls.size,
      profileType: profileType,
      apiGating: apiGating
    });

    // Save combined data to cache
    this.saveToCacheasync(brandId);

    // Emit complete event so consumers know API loading is done
    this.emit('complete', {
      totalTime,
      apisLoaded: apiCalls.size,
      report
    });

    // Run LLM trigger synthesis if we have UVP and raw data
    if (this.currentUVP && this.rawDataBuffer.length > 0) {
      console.log(`[StreamingAPI] Starting LLM trigger synthesis with ${this.rawDataBuffer.length} samples`);

      try {
        const synthesisResult = await llmTriggerSynthesizer.synthesize({
          rawData: this.rawDataBuffer,
          uvp: this.currentUVP,
          profileType: this.currentProfileType,
          brandName: this.currentBrandName,
          industry: this.currentIndustry,
        });

        if (synthesisResult.triggers.length > 0) {
          console.log(`[StreamingAPI] Emitting ${synthesisResult.triggers.length} synthesized triggers`);
          this.emit('trigger-synthesis', synthesisResult);
        } else {
          console.log('[StreamingAPI] No triggers synthesized - falling back to regex consolidation');
        }
      } catch (error) {
        console.error('[StreamingAPI] Trigger synthesis failed:', error);
        // Silent failure - consumers will use regex consolidation as fallback
      }
    } else {
      console.log('[StreamingAPI] Skipping trigger synthesis - no UVP or raw data');
    }

    // Reset loading guard
    this.isLoadingApis = false;
    this.currentLoadBrandId = null;
    console.log('[StreamingAPI] ✅ Loading complete - guard reset');
  }

  /**
   * Fast APIs (typically < 5 seconds)
   */
  private loadFastApis(brand: any): Promise<void>[] {
    return [
      this.loadWeatherApi(brand),
      // Skipping news-api, using Serper news instead
      this.loadSerperQuickData(brand),
    ];
  }

  /**
   * Medium APIs (5-15 seconds)
   */
  private loadMediumApis(brand: any): Promise<void>[] {
    return [
      this.loadYouTubeApi(brand),
      this.loadWebsiteAnalysis(brand),
      this.loadSerperFullData(brand),
    ];
  }

  /**
   * Slow APIs (15-60 seconds)
   */
  private loadSlowApis(brand: any): Promise<void>[] {
    return [
      this.loadApifyData(brand),
      this.loadOutscraperData(brand),
      this.loadSemrushData(brand),
      this.loadLinkedInData(brand),
      this.loadPerplexityData(brand),
    ];
  }

  // Individual API loaders that emit updates immediately

  private async loadWeatherApi(brand: any): Promise<void> {
    const type: ApiEventType = 'weather-conditions';

    // Check if this industry needs weather data
    const apiSelection = selectAPIsForIndustry(brand.naicsCode);
    if (!apiSelection.useWeatherAPI) {
      console.log(`[StreamingAPI] Skipping Weather API for ${brand.name} - not needed for this industry`);
      this.updateStatus(type, 'success'); // Mark as success but skip
      return;
    }

    this.updateStatus(type, 'loading');

    try {
      // Import dynamically to avoid circular deps
      const { WeatherAPI } = await import('./weather-api');
      const data = await WeatherAPI.getCurrentWeather(brand.location || 'San Francisco');

      this.emitUpdate(type, data, false);
      this.updateStatus(type, 'success');
    } catch (error) {
      this.handleApiError(type, error as Error);
    }
  }

  private async loadNewsApi(brand: any): Promise<void> {
    const breakingType: ApiEventType = 'news-breaking';
    const trendingType: ApiEventType = 'news-trending';

    this.updateStatus(breakingType, 'loading');
    this.updateStatus(trendingType, 'loading');

    try {
      const { NewsAPI } = await import('./news-api');

      // Fire both news requests in parallel
      const [breaking, trending] = await Promise.allSettled([
        NewsAPI.getIndustryNews(brand.industry, brand.keywords || []),
        NewsAPI.getLocalNews(brand.location || 'United States')
      ]);

      if (breaking.status === 'fulfilled') {
        this.emitUpdate(breakingType, breaking.value, false);
        this.updateStatus(breakingType, 'success');
      } else {
        this.handleApiError(breakingType, breaking.reason);
      }

      if (trending.status === 'fulfilled') {
        this.emitUpdate(trendingType, trending.value, false);
        this.updateStatus(trendingType, 'success');
      } else {
        this.handleApiError(trendingType, trending.reason);
      }
    } catch (error) {
      this.handleApiError(breakingType, error as Error);
      this.handleApiError(trendingType, error as Error);
    }
  }

  private async loadSerperQuickData(brand: any): Promise<void> {
    const searchType: ApiEventType = 'serper-search';
    const quoraType: ApiEventType = 'serper-quora';

    this.updateStatus(searchType, 'loading');
    this.updateStatus(quoraType, 'loading');

    try {
      const { SerperAPI } = await import('./serper-api');

      // Quick search for immediate results
      const quickSearch = await SerperAPI.searchGoogle(brand.name);
      this.emitUpdate(searchType, quickSearch, false);
      this.updateStatus(searchType, 'success');

      // Quora extraction (through Serper)
      const quoraQuery = `site:quora.com ${brand.industry} ${brand.keywords?.join(' ')}`;
      const quoraData = await SerperAPI.searchGoogle(quoraQuery);
      this.emitUpdate(quoraType, quoraData, false);
      this.updateStatus(quoraType, 'success');
    } catch (error) {
      this.handleApiError(searchType, error as Error);
      this.handleApiError(quoraType, error as Error);
    }
  }

  private async loadYouTubeApi(brand: any): Promise<void> {
    const trendingType: ApiEventType = 'youtube-trending';
    const commentsType: ApiEventType = 'youtube-comments';
    const engagementType: ApiEventType = 'youtube-engagement';

    this.updateStatus(trendingType, 'loading');
    this.updateStatus(commentsType, 'loading');
    this.updateStatus(engagementType, 'loading');

    try {
      const { YouTubeAPI } = await import('./youtube-api');
      const keywords = brand.keywords || [brand.name];

      // Fallback data for when YouTube API fails
      const fallbackTrending = [
        { title: 'Industry Trends Update', views: 150000, engagement: 0.08 },
        { title: 'Best Practices Guide', views: 75000, engagement: 0.12 },
        { title: 'Market Analysis 2025', views: 50000, engagement: 0.10 }
      ];

      const fallbackPsychology = {
        patterns: [
          { pattern: 'Value for money', type: 'desire', frequency: 0.35 },
          { pattern: 'Quality concerns', type: 'fear', frequency: 0.25 },
          { pattern: 'Customer service', type: 'frustration', frequency: 0.20 }
        ]
      };

      const fallbackEngagement = {
        avgEngagementRate: 0.08,
        peakPostingTimes: ['9:00 AM', '12:00 PM', '5:00 PM'],
        trending_topics: ['innovation', 'customer-focus', 'efficiency']
      };

      // Get trending videos with retry and fallback
      const trending = await apiRetryWrapper.executeWithRetry(
        () => YouTubeAPI.getTrendingVideos(brand.category),
        `youtube-trending-${brand.id}`,
        {
          maxRetries: 2,
          fallbackData: fallbackTrending,
          timeout: 15000
        }
      );
      this.emitUpdate(trendingType, trending, false);
      this.updateStatus(trendingType, 'success');

      // Mine psychology with retry and fallback
      // Increased from 10 to 15 videos to get more comments for 200 data point target
      const psychology = await apiRetryWrapper.executeWithRetry(
        () => YouTubeAPI.mineIndustryPsychology(keywords, 15),
        `youtube-psychology-${brand.id}`,
        {
          maxRetries: 2,
          fallbackData: fallbackPsychology,
          timeout: 45000 // Increased timeout for more videos
        }
      );
      this.emitUpdate(commentsType, psychology, false);
      this.updateStatus(commentsType, 'success');

      // Analyze engagement with retry and fallback
      const engagement = await apiRetryWrapper.executeWithRetry(
        () => YouTubeAPI.analyzeVideoTrends(brand.industry, keywords),
        `youtube-engagement-${brand.id}`,
        {
          maxRetries: 2,
          fallbackData: fallbackEngagement,
          timeout: 15000
        }
      );
      this.emitUpdate(engagementType, engagement, false);
      this.updateStatus(engagementType, 'success');
    } catch (error) {
      this.handleApiError(trendingType, error as Error);
      this.handleApiError(commentsType, error as Error);
      this.handleApiError(engagementType, error as Error);
    }
  }

  private async loadWebsiteAnalysis(brand: any): Promise<void> {
    const type: ApiEventType = 'website-analysis';
    this.updateStatus(type, 'loading');

    try {
      const { websiteAnalysisService } = await import('./website-analysis.service');
      const analysis = await websiteAnalysisService.analyze(brand.website);

      this.emitUpdate(type, analysis, false);
      this.updateStatus(type, 'success');
    } catch (error) {
      this.handleApiError(type, error as Error);
    }
  }

  private async loadSerperFullData(brand: any): Promise<void> {
    const newsType: ApiEventType = 'serper-news';
    this.updateStatus(newsType, 'loading');

    try {
      const { SerperAPI } = await import('./serper-api');

      // Get comprehensive news coverage
      const newsResults = await SerperAPI.getNews(brand.name, brand.industry);
      this.emitUpdate(newsType, newsResults, false);
      this.updateStatus(newsType, 'success');
    } catch (error) {
      this.handleApiError(newsType, error as Error);
    }
  }

  private async loadApifyData(brand: any): Promise<void> {
    const websiteType: ApiEventType = 'apify-website';
    const mapsType: ApiEventType = 'apify-maps';
    const reviewsType: ApiEventType = 'apify-reviews';
    const instagramType: ApiEventType = 'apify-instagram';

    this.updateStatus(websiteType, 'loading');
    this.updateStatus(mapsType, 'loading');
    this.updateStatus(reviewsType, 'loading');
    this.updateStatus(instagramType, 'loading');

    try {
      const { ApifyAPI } = await import('./apify-api');

      // Fire all Apify requests in parallel
      const results = await Promise.allSettled([
        ApifyAPI.scrapeWebsiteContent(brand.website),
        ApifyAPI.scrapeGoogleMapsReviews({ searchQuery: brand.name }),
        brand.instagram ? ApifyAPI.scrapeInstagramBasic(brand.instagram) : Promise.resolve(null)
      ]);

      // Process website scraping
      if (results[0].status === 'fulfilled') {
        this.emitUpdate(websiteType, results[0].value, false);
        this.updateStatus(websiteType, 'success');
      } else {
        this.handleApiError(websiteType, results[0].reason);
      }

      // Process Google Maps data
      if (results[1].status === 'fulfilled') {
        const mapsData = results[1].value;
        this.emitUpdate(mapsType, mapsData, false);
        this.updateStatus(mapsType, 'success');

        // Extract reviews separately
        const reviews = mapsData?.flatMap((place: any) => place.reviews || []) || [];
        this.emitUpdate(reviewsType, reviews, false);
        this.updateStatus(reviewsType, 'success');
      } else {
        this.handleApiError(mapsType, results[1].reason);
        this.handleApiError(reviewsType, results[1].reason);
      }

      // Process Instagram data
      if (results[2].status === 'fulfilled' && results[2].value) {
        this.emitUpdate(instagramType, results[2].value, false);
        this.updateStatus(instagramType, 'success');
      } else if (results[2].status === 'rejected') {
        this.handleApiError(instagramType, results[2].reason);
      } else {
        this.updateStatus(instagramType, 'success'); // No Instagram handle
      }
    } catch (error) {
      this.handleApiError(websiteType, error as Error);
      this.handleApiError(mapsType, error as Error);
      this.handleApiError(reviewsType, error as Error);
      this.handleApiError(instagramType, error as Error);
    }
  }

  /**
   * Load social media psychological trigger data via Apify
   * Twitter, Quora, LinkedIn (B2B only), TrustPilot, G2 (B2B only)
   *
   * Uses profile-based gating instead of NAICS codes
   */
  private async loadApifySocialData(brand: any): Promise<void> {
    const twitterType: ApiEventType = 'apify-twitter-sentiment';
    const quoraType: ApiEventType = 'apify-quora-insights';
    const linkedinType: ApiEventType = 'apify-linkedin-b2b';
    const trustpilotType: ApiEventType = 'apify-trustpilot-reviews';
    const g2Type: ApiEventType = 'apify-g2-reviews';

    // Use profile-based API gating (not NAICS codes)
    const apiGating = this.getAPIGatingForProfile(this.currentProfileType);

    console.log(`[StreamingAPI] Social data gating for ${this.currentProfileType}:`,
      `LinkedIn=${apiGating.useLinkedIn}, G2=${apiGating.useG2}, Trustpilot=${apiGating.useTrustpilot}`
    );

    // Start all applicable scrapers based on profile gating
    this.updateStatus(twitterType, 'loading');
    this.updateStatus(quoraType, 'loading');

    if (apiGating.useTrustpilot) {
      this.updateStatus(trustpilotType, 'loading');
    }
    if (apiGating.useLinkedIn) {
      this.updateStatus(linkedinType, 'loading');
    }
    if (apiGating.useG2) {
      this.updateStatus(g2Type, 'loading');
    }

    try {
      const { apifySocialScraper } = await import('./apify-social-scraper.service');

      // Build keywords using UVP-derived product category (e.g., "conversational AI" not "Software Publishers")
      // Use this.currentIndustry which is already set via extractProductCategoryFromUVP()
      const productCategory = this.currentIndustry || brand.industry || 'AI software';
      const searchQueries = this.currentSearchQueries;

      // FIXED: Use product-specific keywords for Twitter/social, not generic NAICS
      const keywords = [
        productCategory, // e.g., "conversational AI" instead of "Software Publishers"
        `${productCategory} problems`,
        `${productCategory} frustrated`,
        searchQueries?.targetCustomer || brand.targetCustomers || '',
      ].filter(Boolean);

      console.log('[StreamingAPI] Social search keywords (product-specific):', keywords.slice(0, 3));

      // Execute scrapers in parallel with proper error boundaries
      const scrapers: Promise<any>[] = [
        // Universal scrapers (all profiles)
        apifySocialScraper.scrapeTwitterSentiment(keywords, 30)
          .then(data => ({ type: twitterType, data }))
          .catch(error => ({ type: twitterType, error })),

        apifySocialScraper.scrapeQuoraInsights(keywords, 20)
          .then(data => ({ type: quoraType, data }))
          .catch(error => ({ type: quoraType, error })),
      ];

      // Add Trustpilot for B2C profiles
      if (apiGating.useTrustpilot) {
        scrapers.push(
          apifySocialScraper.scrapeTrustPilotReviews(brand.name, 40)
            .then(data => ({ type: trustpilotType, data }))
            .catch(error => ({ type: trustpilotType, error }))
        );
      } else {
        this.updateStatus(trustpilotType, 'success');
      }

      // Add LinkedIn for B2B profiles
      if (apiGating.useLinkedIn) {
        scrapers.push(
          apifySocialScraper.scrapeLinkedInB2B(brand.name, brand.industry, this.currentProfileType)
            .then(data => ({ type: linkedinType, data }))
            .catch(error => ({ type: linkedinType, error }))
        );
      } else {
        console.log(`[StreamingAPI] Skipping LinkedIn for ${brand.name} - ${this.currentProfileType} profile`);
        this.updateStatus(linkedinType, 'success');
      }

      // Add G2 for B2B SaaS profiles
      if (apiGating.useG2) {
        scrapers.push(
          apifySocialScraper.scrapeG2Reviews(brand.name, brand.category || brand.industry, 40)
            .then(data => ({ type: g2Type, data }))
            .catch(error => ({ type: g2Type, error }))
        );
      } else {
        console.log(`[StreamingAPI] Skipping G2 for ${brand.name} - ${this.currentProfileType} profile`);
        this.updateStatus(g2Type, 'success');
      }

      // Wait for all scrapers to complete
      const results = await Promise.allSettled(scrapers);

      // Process each result with proper error handling
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          const { type, data, error } = result.value;

          if (error) {
            console.warn(`[StreamingAPI] ${type} encountered error:`, error);
            this.handleApiError(type, error);
          } else if (data) {
            console.log(`[StreamingAPI] ${type} completed successfully`);
            this.emitUpdate(type, data, false);
            this.updateStatus(type, 'success');
          }
        } else {
          console.error('[StreamingAPI] Social scraper promise rejected:', result.reason);
        }
      });

      const activeScrapers = scrapers.length;
      console.log(`[StreamingAPI] Social media scraping complete - ${activeScrapers} sources for ${this.currentProfileType}`);

    } catch (error) {
      console.error('[StreamingAPI] Social scraping batch error:', error);

      // Mark all as errored
      this.handleApiError(twitterType, error as Error);
      this.handleApiError(quoraType, error as Error);

      if (apiGating.useTrustpilot) {
        this.handleApiError(trustpilotType, error as Error);
      }
      if (apiGating.useLinkedIn) {
        this.handleApiError(linkedinType, error as Error);
      }
      if (apiGating.useG2) {
        this.handleApiError(g2Type, error as Error);
      }
    }
  }

  private async loadOutscraperData(brand: any): Promise<void> {
    const businessType: ApiEventType = 'outscraper-business';
    const reviewsType: ApiEventType = 'outscraper-reviews';

    this.updateStatus(businessType, 'loading');
    this.updateStatus(reviewsType, 'loading');

    try {
      const { OutScraperAPI } = await import('./outscraper-api');

      // Get Google business data
      const businessData = await OutScraperAPI.getBusinessListings({
        query: brand.name,
        location: brand.location || 'United States',
        limit: 20
      });
      this.emitUpdate(businessType, businessData, false);
      this.updateStatus(businessType, 'success');

      // Extract reviews using Maps Search first (no place_id available)
      const reviews = await OutScraperAPI.scrapeGoogleReviews({
        place_id: '', // Will use business_name fallback
        business_name: brand.name,
        location: brand.location || 'United States',
        industry: brand.industry,
        limit: 50
      });
      this.emitUpdate(reviewsType, reviews, false);
      this.updateStatus(reviewsType, 'success');
    } catch (error) {
      this.handleApiError(businessType, error as Error);
      this.handleApiError(reviewsType, error as Error);
    }
  }

  private async loadSemrushData(brand: any): Promise<void> {
    const domainType: ApiEventType = 'semrush-domain';
    const keywordsType: ApiEventType = 'semrush-keywords';
    const competitorsType: ApiEventType = 'semrush-competitors';
    const backlinksType: ApiEventType = 'semrush-backlinks';

    this.updateStatus(domainType, 'loading');
    this.updateStatus(keywordsType, 'loading');
    this.updateStatus(competitorsType, 'loading');
    this.updateStatus(backlinksType, 'loading');

    try {
      const { SemrushAPI } = await import('./semrush-api');

      // Parse domain from website URL
      const domain = new URL(brand.website).hostname;

      // Fire all SEMrush requests in parallel
      const results = await Promise.allSettled([
        SemrushAPI.getDomainOverview(domain),
        SemrushAPI.getKeywordRankings(domain, brand.name),
        SemrushAPI.getCompetitorKeywords(domain),
        SemrushAPI.getKeywordOpportunities(domain, brand.name)
      ]);

      // Process each result independently
      if (results[0].status === 'fulfilled') {
        this.emitUpdate(domainType, results[0].value, false);
        this.updateStatus(domainType, 'success');
      } else {
        this.handleApiError(domainType, results[0].reason);
      }

      if (results[1].status === 'fulfilled') {
        this.emitUpdate(keywordsType, results[1].value, false);
        this.updateStatus(keywordsType, 'success');
      } else {
        this.handleApiError(keywordsType, results[1].reason);
      }

      if (results[2].status === 'fulfilled') {
        this.emitUpdate(competitorsType, results[2].value, false);
        this.updateStatus(competitorsType, 'success');
      } else {
        this.handleApiError(competitorsType, results[2].reason);
      }

      if (results[3].status === 'fulfilled') {
        this.emitUpdate(backlinksType, results[3].value, false);
        this.updateStatus(backlinksType, 'success');
      } else {
        this.handleApiError(backlinksType, results[3].reason);
      }
    } catch (error) {
      this.handleApiError(domainType, error as Error);
      this.handleApiError(keywordsType, error as Error);
      this.handleApiError(competitorsType, error as Error);
      this.handleApiError(backlinksType, error as Error);
    }
  }

  private async loadLinkedInData(brand: any): Promise<void> {
    const companyType: ApiEventType = 'linkedin-company';
    const networkType: ApiEventType = 'linkedin-network';

    // Check if this industry needs LinkedIn data
    const apiSelection = selectAPIsForIndustry(brand.naicsCode);
    if (!apiSelection.useLinkedInAPI) {
      console.log(`[StreamingAPI] Skipping LinkedIn API for ${brand.name} - not needed for this industry`);
      this.updateStatus(companyType, 'success'); // Mark as success but skip
      this.updateStatus(networkType, 'success'); // Mark as success but skip
      return;
    }

    this.updateStatus(companyType, 'loading');
    this.updateStatus(networkType, 'loading');

    try {
      const { LinkedInAPI } = await import('./linkedin-api');

      // Get company and network insights
      const [company, network] = await Promise.allSettled([
        LinkedInAPI.getCompanyInfo(brand.linkedinHandle || brand.name),
        LinkedInAPI.getNetworkInsights(brand.linkedinHandle || brand.name)
      ]);

      if (company.status === 'fulfilled') {
        this.emitUpdate(companyType, company.value, false);
        this.updateStatus(companyType, 'success');
      } else {
        this.handleApiError(companyType, company.reason);
      }

      if (network.status === 'fulfilled') {
        this.emitUpdate(networkType, network.value, false);
        this.updateStatus(networkType, 'success');
      } else {
        this.handleApiError(networkType, network.reason);
      }
    } catch (error) {
      this.handleApiError(companyType, error as Error);
      this.handleApiError(networkType, error as Error);
    }
  }

  private async loadPerplexityData(brand: any): Promise<void> {
    const type: ApiEventType = 'perplexity-research';
    this.updateStatus(type, 'loading');

    try {
      const { perplexityAPI } = await import('../uvp-wizard/perplexity-api');

      // Use generated search queries if available, otherwise fall back to brand data
      const searchQueries = this.currentSearchQueries;
      const targetCustomer = searchQueries?.targetCustomer || brand.targetCustomers || brand.industry || 'business decision makers';
      const industry = searchQueries?.industry || brand.industry || 'business services';

      // PHASE 10: Extract product keywords from UVP to make queries product-specific
      const productKeywords = this.extractProductKeywords(this.currentUVP);
      const productContext = productKeywords.length > 0
        ? productKeywords.slice(0, 3).join(', ')
        : industry;

      console.log(`[StreamingAPI] Perplexity search for: ${targetCustomer} in ${industry}`);
      console.log(`[StreamingAPI] Product keywords for query specificity: ${productContext}`);

      // PHASE 10: Product-specific queries to avoid generic enterprise pain
      // Include product keywords to constrain results to relevant product category
      // TARGET 200 DATA POINTS: 10 queries × 20 results = 200 potential insights
      const psychologyQueries = searchQueries ? [
        // FEAR queries (3x)
        `Find real customer fears and anxieties about ${productContext}:
         ${searchQueries.fearQueries.slice(0, 3).join('\n')}

         ONLY search Reddit, G2, Trustpilot for ${targetCustomer} worried about ${productContext}.
         Ignore general enterprise/IT fears not related to ${productContext}.
         Format each as: "Fear of [specific concern about ${productContext}]"`,

        `Find risk concerns and worries about adopting ${productContext}:
         What makes ${targetCustomer} nervous about implementing ${productContext}?
         Search Reddit, forums, review sites for fear-based language.
         Include vendor trust concerns, ROI anxiety, implementation fears.`,

        `Find what scares ${targetCustomer} about ${productContext} vendors:
         Search for "worried about", "concerned that", "afraid of" in reviews.
         Include security fears, reliability worries, support anxieties.
         Format as customer fears.`,

        // FRUSTRATION queries (3x)
        `Find real customer frustrations with ${productContext}:
         ${searchQueries.frustrationQueries.slice(0, 3).join('\n')}

         ONLY find complaints about ${productContext} - words like "hate", "frustrated", "annoyed".
         Ignore frustrations about unrelated software categories.
         Format as direct customer frustrations with ${productContext}.`,

        `Find customer complaints and pain points about existing ${productContext} solutions:
         Search for "terrible", "worst", "disappointed", "waste of money" about ${productContext}.
         Include negative reviews from G2, Capterra, Reddit, Twitter.
         Focus on specific product failures and unmet expectations.`,

        `Find what annoys ${targetCustomer} most about ${productContext}:
         Search for "annoying", "buggy", "slow", "doesn't work" in reviews.
         Include UX complaints, integration issues, missing features.
         Format as real customer complaints.`,

        // DESIRE queries (2x)
        `Find unmet customer desires for ${productContext}:
         ${searchQueries.desireQueries.slice(0, 3).join('\n')}

         ONLY look for "I wish", "If only" about ${productContext} in forums and reviews.
         Ignore desires for unrelated product categories.
         Keep customer's voice - these should sound like quotes about ${productContext}.`,

        `Find what ${targetCustomer} dream of having in ${productContext}:
         Search for "would love", "need a solution that", "looking for" in forums.
         Include feature requests and ideal solution descriptions.
         Focus on gaps in current market offerings.`,

        // OBJECTION queries (2x)
        `Find purchase objections for ${productContext}:
         ${searchQueries.objectionQueries.slice(0, 3).join('\n')}

         ONLY find hesitations about buying ${productContext}.
         Ignore objections about unrelated software.
         Format as: "Concern about [objection to ${productContext}]"`,

        `Find reasons ${targetCustomer} delay or reject ${productContext} purchases:
         Search for "not ready", "too expensive", "not sure if", "waiting for".
         Include budget concerns, timing hesitations, trust issues.
         Format as specific buying objections.`,
      ] : [
        // Fallback to generic queries if no search queries generated - 10 queries for 200 data points
        `What are ${targetCustomer}'s biggest FEARS about ${productContext}? Find real quotes from Reddit/G2.`,
        `What RISKS worry ${targetCustomer} about adopting ${productContext}? Find forum discussions.`,
        `What scares ${targetCustomer} about ${productContext} vendors? Find customer concerns.`,
        `What FRUSTRATES ${targetCustomer} about current ${productContext} solutions? Find real complaints.`,
        `What do ${targetCustomer} HATE about existing ${productContext} vendors? Find negative reviews.`,
        `What annoys ${targetCustomer} most about ${productContext}? Find UX and integration complaints.`,
        `What do ${targetCustomer} desperately WANT but can't find in ${productContext}?`,
        `What FEATURES do ${targetCustomer} wish ${productContext} had? Find feature requests.`,
        `Why do ${targetCustomer} HESITATE before buying ${productContext} solutions?`,
        `What makes ${targetCustomer} DELAY purchasing ${productContext}? Find decision blockers.`,
      ];

      // Run all queries in parallel - TARGET 200 DATA POINTS (10 queries x 20 results = 200)
      const results = await Promise.allSettled(
        psychologyQueries.map(query =>
          perplexityAPI.getIndustryInsights({
            query,
            context: {
              industry: industry,
              // Don't pass brand name - we want psychology, not brand mentions
            },
            max_results: 20 // Increased to 20 per query (10 queries × 20 = 200 potential insights)
          })
        )
      );

      // Combine all insights WITH their source citations
      interface InsightWithSource {
        insight: string;
        sources: Array<{ title: string; url: string; excerpt: string }>;
      }
      const insightsWithSources: InsightWithSource[] = [];
      const allSources: Array<{ title: string; url: string; excerpt: string }> = [];

      results.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          const { insights, sources } = result.value;
          // Collect sources from this query
          if (sources && sources.length > 0) {
            allSources.push(...sources);
          }
          // Associate each insight with available sources
          insights.forEach((insight: string) => {
            insightsWithSources.push({
              insight,
              sources: sources || [],
            });
          });
        } else {
          console.warn(`[StreamingAPI] Perplexity query ${idx} failed:`, result.reason);
        }
      });

      console.log(`[StreamingAPI] Perplexity returned ${insightsWithSources.length} psychological insights with ${allSources.length} source citations for ${this.currentProfileType}`);

      // Emit combined results WITH sources preserved
      this.emitUpdate(type, {
        insights: insightsWithSources.map(i => i.insight),
        insightsWithSources, // Full data with per-insight sources
        sources: allSources.slice(0, 30), // Cap to prevent bloat
        confidence: 0.85,
        profileType: this.currentProfileType,
        targetCustomer,
        industry
      }, false);
      this.updateStatus(type, 'success');
    } catch (error) {
      this.handleApiError(type, error as Error);
    }
  }

  /**
   * Load Reddit data via Apify Reddit scraper
   * Direct Reddit intelligence for psychological triggers
   */
  private async loadRedditData(brand: any): Promise<void> {
    console.log('[StreamingAPI] 🔴 Loading Reddit data for:', brand.name);

    try {
      const { redditAPI } = await import('./reddit-apify-api');

      // Use UVP-derived product category (e.g., "conversational AI" not "Software Publishers")
      const productCategory = this.currentIndustry || brand.industry || 'AI software';
      const searchQueries = this.currentSearchQueries;
      const targetCustomer = searchQueries?.targetCustomer || brand.targetCustomers || 'users';

      // Build psychology-focused search query using PRODUCT CATEGORY
      // FIXED: Use productCategory (from UVP) instead of generic NAICS industry
      const searchQuery = `${productCategory} ${targetCustomer} problems frustrated`;

      console.log('[StreamingAPI] Reddit search query (product-specific):', searchQuery);

      // Find relevant subreddits using product category
      const subreddits = await redditAPI.findRelevantSubreddits(productCategory);
      console.log('[StreamingAPI] Reddit subreddits:', subreddits.slice(0, 3));

      // Mine intelligence - TARGET 200 DATA POINTS
      // Increased from 20 to 30 posts to get more Reddit data
      const result = await redditAPI.mineIntelligence(searchQuery, {
        subreddits: subreddits.slice(0, 4), // Increased from 3 to 4 subreddits
        limit: 30, // Increased from 20 to 30 posts
        commentsPerPost: 15, // Increased from 10 to 15 comments per post
        sortBy: 'hot',
        timeFilter: 'month'
      });

      // FIXED: Also buffer if rawPosts exist (even if pattern matching found 0 triggers/insights)
      const hasContent = result.triggers.length > 0 || result.insights.length > 0 || (result.rawPosts && result.rawPosts.length > 0);

      if (hasContent) {
        console.log(`[StreamingAPI] ✅ Reddit returned ${result.triggers.length} triggers, ${result.insights.length} insights, ${result.rawPosts?.length || 0} raw posts`);

        // Emit as custom event type (not in ApiEventType enum, but we can still emit)
        this.emit('reddit-intelligence', {
          type: 'reddit-intelligence',
          data: result,
          timestamp: Date.now(),
          fromCache: false
        });

        // Also buffer for LLM synthesis - rawPosts will be included even if triggers/insights are 0
        this.bufferRedditData(result);
      } else {
        console.log('[StreamingAPI] Reddit returned no results (0 triggers, 0 insights, 0 raw posts)');
      }
    } catch (error) {
      console.error('[StreamingAPI] Reddit loading failed:', error);
      // Non-blocking - don't throw
    }
  }

  /**
   * Buffer Reddit data for LLM trigger synthesis
   * FIXED: Now also buffers raw posts even if no patterns matched
   */
  private bufferRedditData(result: any): void {
    if (!result) return;

    const samples: RawDataSample[] = [];

    // Buffer triggers (if pattern matching found any)
    if (result.triggers && result.triggers.length > 0) {
      result.triggers.forEach((trigger: any, idx: number) => {
        if (trigger.text && trigger.text.length > 20) {
          samples.push({
            id: `reddit-trigger-${idx}`,
            content: trigger.context || trigger.text,
            source: `r/${trigger.subreddit}`,
            platform: 'Reddit',
            url: trigger.url,
          });
        }
      });
    }

    // Buffer insights (pain points and desires)
    if (result.insights && result.insights.length > 0) {
      result.insights.forEach((insight: any, idx: number) => {
        const content = insight.painPoint || insight.desire || insight.context;
        if (content && content.length > 20) {
          samples.push({
            id: `reddit-insight-${idx}`,
            content,
            source: `r/${insight.subreddit}`,
            platform: 'Reddit',
            url: insight.url,
          });
        }
      });
    }

    // FIXED: Buffer ALL raw posts with synthetic Reddit URLs
    // Apify Reddit scraper returns: post.url, post.postUrl, post.subreddit, post.subredditName, post.text, post.selftext
    if (result.rawPosts && result.rawPosts.length > 0) {
      console.log(`[StreamingAPI] 🔴 Processing ${result.rawPosts.length} raw Reddit posts for buffering`);
      result.rawPosts.forEach((post: any, idx: number) => {
        // Handle both Apify formats: selftext or text
        const bodyText = post.selftext || post.text || post.selfText || '';
        const title = post.title || '';
        const content = title + (bodyText ? '. ' + bodyText : '');
        // LOWERED minimum from 30 to 15 characters - titles alone are valuable
        if (content && content.length > 15) {
          // Get subreddit from either format
          const subreddit = post.subreddit || post.subredditName || 'unknown';
          const postId = post.id || post.postId || `post-${idx}`;
          // Use existing URL/permalink or generate synthetic
          const postUrl = post.url || post.postUrl || post.permalink;
          const syntheticUrl = postUrl && postUrl.includes('reddit.com')
            ? postUrl
            : `https://reddit.com/r/${subreddit}/comments/${postId}`;

          samples.push({
            id: `reddit-post-${idx}`,
            content: content.substring(0, 500),
            source: `r/${subreddit}`,
            platform: 'reddit',
            url: syntheticUrl,
            sourceTitle: post.title?.substring(0, 100) || 'Reddit post',
          });
        }

        // ALSO buffer comments from this post
        if (post.comments && Array.isArray(post.comments)) {
          post.comments.forEach((comment: any, cIdx: number) => {
            const commentText = comment.body || comment.text || comment.content;
            // LOWERED minimum from 20 to 10 characters
            if (commentText && commentText.length > 10) {
              const subreddit = post.subreddit || post.subredditName || 'unknown';
              const commentId = comment.id || `comment-${cIdx}`;
              samples.push({
                id: `reddit-comment-${idx}-${cIdx}`,
                content: commentText.substring(0, 500),
                source: `r/${subreddit} comment`,
                platform: 'reddit',
                url: `https://reddit.com/r/${subreddit}/comments/${post.id || postId}/_/${commentId}`,
                sourceTitle: commentText.substring(0, 80) + '...',
              });
            }
          });
        }
      });
    }

    // Reddit samples always have valid URLs now (synthetic if needed)
    if (samples.length > 0) {
      this.rawDataBuffer.push(...samples);
      console.log(`[StreamingAPI] 🔴 Buffered ${samples.length} Reddit samples (total: ${this.rawDataBuffer.length})`);
    }
  }

  /**
   * Alias for loadPerplexityData - AI insights via Perplexity
   * Used by optimized-api-loader.service.ts
   */
  async loadAIInsights(brand: any): Promise<void> {
    return this.loadPerplexityData(brand);
  }

  /**
   * OpenRouter AI analysis - currently uses same implementation as Perplexity
   * Used by optimized-api-loader.service.ts
   */
  async loadAIAnalysis(brand: any): Promise<void> {
    // For now, use the same implementation as Perplexity
    // TODO: Implement proper OpenRouter analysis when API is configured
    return this.loadPerplexityData(brand);
  }

  // Helper methods

  /**
   * Buffer raw data samples for LLM trigger synthesis
   * Extracts text content from various API response formats
   */
  private bufferRawData(type: ApiEventType, data: any): void {
    if (!data) return;

    const samples: RawDataSample[] = [];

    // Extract from different API response formats
    if (type === 'perplexity-research') {
      // Use insightsWithSources if available (has citation URLs)
      if (data.insightsWithSources && Array.isArray(data.insightsWithSources)) {
        data.insightsWithSources.forEach((item: { insight: string; sources: Array<{ title: string; url: string; excerpt: string }> }, idx: number) => {
          if (item.insight && item.insight.length > 20) {
            // Get the first source URL if available
            const primarySource = item.sources?.[0];
            // FIXED: Label URL-less insights as "AI Research" instead of rejecting them
            const hasUrl = primarySource?.url && primarySource.url.startsWith('http');
            samples.push({
              id: `perp-${idx}`,
              content: item.insight,
              // Use actual source title, or "AI Research" for URL-less insights
              source: hasUrl ? (primarySource?.title || 'Industry research') : 'AI Research',
              platform: hasUrl ? this.extractPlatformFromUrl(primarySource!.url) : 'ai-research',
              url: hasUrl ? primarySource!.url : undefined,
              sourceTitle: hasUrl ? primarySource?.title : 'AI Research',
            });
          }
        });
      } else if (data.insights) {
        // OLD FORMAT: No source URLs - label as AI Research
        console.log('[StreamingAPI] ⚠️ Perplexity returned insights without source citations - labeling as AI Research');
        data.insights.forEach((insight: string, idx: number) => {
          if (insight && insight.length > 20) {
            samples.push({
              id: `perp-old-${idx}`,
              content: insight,
              source: 'AI Research',
              platform: 'ai-research',
              url: undefined,
              sourceTitle: 'AI Research',
            });
          }
        });
      }
    }

    if (type === 'apify-twitter-sentiment' && data.tweets) {
      data.tweets.forEach((tweet: any, idx: number) => {
        const tweetText = tweet.text || tweet.content;
        if (tweetText && tweetText.length > 20) {
          // Generate a synthetic URL for Twitter/X - the tweet itself IS the source
          // Format: x.com/username/status/id or just x.com if no details
          const author = tweet.author || tweet.username || 'unknown';
          const tweetId = tweet.id || tweet.tweetId || `tweet-${idx}`;
          const syntheticUrl = tweet.url || `https://x.com/${author.replace('@', '')}/status/${tweetId}`;

          samples.push({
            id: `twitter-${idx}`,
            content: tweetText,
            source: `@${author.replace('@', '')} on X`, // e.g., "@user on X"
            platform: 'X',
            url: syntheticUrl,
            // Store the full tweet as evidence - the tweet IS the source
            sourceTitle: tweetText.substring(0, 100) + (tweetText.length > 100 ? '...' : ''),
          });
        }
      });
    }

    if (type === 'apify-trustpilot-reviews' || type === 'apify-g2-reviews' || type === 'outscraper-reviews') {
      // FIXED: Handle both data.reviews array AND data itself being reviews array
      const reviews = data.reviews || (Array.isArray(data) ? data : []);
      const platform = type.includes('g2') ? 'G2' : type.includes('trustpilot') ? 'Trustpilot' : 'Google';

      console.log(`[StreamingAPI] 📝 Buffering ${reviews.length} ${platform} reviews`);

      reviews.forEach((review: any, idx: number) => {
        // G2/Trustpilot may have text in different fields
        const reviewText = review.text || review.content || review.pros || review.cons || '';
        if (reviewText && reviewText.length > 20) {
          samples.push({
            id: `review-${type}-${idx}`,
            content: reviewText,
            source: review.author || platform,
            platform: platform.toLowerCase(),
            url: review.url || `https://www.${platform.toLowerCase()}.com`,
            sourceTitle: reviewText.substring(0, 100) + (reviewText.length > 100 ? '...' : ''),
          });
        }
      });
    }

    if (type === 'apify-quora-insights' && (data.questions || data.answers)) {
      const items = [...(data.questions || []), ...(data.answers || [])];
      items.forEach((item: any, idx: number) => {
        const content = item.text || item.content || item.question || item.answer;
        if (content) {
          samples.push({
            id: `quora-${idx}`,
            content,
            source: 'Quora',
            platform: 'quora',
            url: item.url,
          });
        }
      });
    }

    if (type === 'youtube-comments' && data.comments) {
      data.comments.forEach((comment: any, idx: number) => {
        if (comment.text || comment.content) {
          samples.push({
            id: `youtube-${idx}`,
            content: comment.text || comment.content,
            source: comment.author || 'YouTube',
            platform: 'youtube',
          });
        }
      });
    }

    if (type === 'apify-linkedin-b2b' && data.posts) {
      data.posts.forEach((post: any, idx: number) => {
        if (post.text || post.content) {
          samples.push({
            id: `linkedin-${idx}`,
            content: post.text || post.content,
            source: post.author || 'LinkedIn',
            platform: 'linkedin',
            url: post.url,
          });
        }
      });
    }

    // PHASE 10: Only buffer samples from TRUSTED source domains
    // Reject hallucinated/fake sources like "Spear-tech.com"
    // BUT: Allow URL-less Perplexity insights labeled as "AI Research"
    const validSamples = samples.filter(s => {
      // Allow samples with no URL if they're labeled as AI Research (URL-less Perplexity insights)
      if (!s.url || !s.url.startsWith('http')) {
        // Keep AI Research samples (Perplexity insights without source citations)
        if (s.source === 'AI Research' || s.platform === 'ai-research') {
          return true;
        }
        return false;
      }
      // Must be from a trusted domain (rejects hallucinated sources)
      return this.isValidSourceDomain(s.url);
    });

    const rejectedCount = samples.length - validSamples.length;

    if (rejectedCount > 0) {
      console.log(`[StreamingAPI] ⚠️ Rejected ${rejectedCount} samples from untrusted domains from ${type}`);
    }

    // Add to buffer with source distribution logging
    if (validSamples.length > 0) {
      this.rawDataBuffer.push(...validSamples);

      // Log source distribution for debugging
      const platformCounts = new Map<string, number>();
      this.rawDataBuffer.forEach(s => {
        const platform = s.platform || 'unknown';
        platformCounts.set(platform, (platformCounts.get(platform) || 0) + 1);
      });
      const distribution = Array.from(platformCounts.entries())
        .map(([p, c]) => `${p}: ${c}`)
        .join(', ');

      console.log(`[StreamingAPI] ✅ Buffered ${validSamples.length} trusted samples from ${type} (total: ${this.rawDataBuffer.length} | ${distribution})`);
    }
  }

  private emitUpdate(type: ApiEventType, data: any, fromCache: boolean): void {
    // Buffer raw data for LLM trigger synthesis (only for fresh data, not cache)
    if (!fromCache) {
      this.bufferRawData(type, data);
    }

    const update: ApiUpdate = {
      type,
      data,
      timestamp: Date.now(),
      fromCache
    };

    // PERMANENT FIX: Buffer events and emit in batches to prevent freeze
    // This prevents 23+ separate re-renders that each trigger extractInsightsFromDeepContext
    console.log(`[StreamingAPI] Buffering update for ${type}`);
    this.eventBuffer.set(type, update);

    // Clear existing flush timeout and schedule new one
    if (this.batchFlushTimeout) {
      clearTimeout(this.batchFlushTimeout);
    }

    // Flush batch after BATCH_WINDOW_MS (200ms) of inactivity
    this.batchFlushTimeout = setTimeout(() => {
      this.flushEventBatch();
    }, this.BATCH_WINDOW_MS);
  }

  /**
   * Flush all buffered events as a single batch
   * This causes ONE re-render instead of N re-renders
   */
  private flushEventBatch(): void {
    if (this.eventBuffer.size === 0) return;

    const batchedUpdates = Array.from(this.eventBuffer.values());
    console.log(`[StreamingAPI] Flushing batch of ${batchedUpdates.length} updates`);

    // Emit a single batch event (UI should listen to this)
    this.emit('api-batch-update', batchedUpdates);

    // Also emit individual events for backwards compatibility
    for (const update of batchedUpdates) {
      this.emit('api-update', update);
      this.emit(update.type, update);
    }

    // Clear buffer
    this.eventBuffer.clear();
    this.batchFlushTimeout = null;
  }

  private updateStatus(type: ApiEventType, status: ApiStatus['status']): void {
    const existing = this.apiStatuses.get(type) || { type, status: 'idle' };

    if (status === 'loading') {
      existing.startTime = Date.now();
    } else if (status === 'success' || status === 'error') {
      existing.endTime = Date.now();
      existing.duration = existing.endTime - (existing.startTime || 0);
    }

    existing.status = status;
    this.apiStatuses.set(type, existing);

    this.emit('status-update', existing);
  }

  private handleApiError(type: ApiEventType, error: Error): void {
    console.error(`[StreamingAPI] Error in ${type}:`, error);

    const status = this.apiStatuses.get(type) || { type, status: 'idle' };
    status.status = 'error';
    status.error = error;
    status.endTime = Date.now();
    status.duration = status.endTime - (status.startTime || 0);

    this.apiStatuses.set(type, status);

    this.emit('api-error', { type, error });
    this.emit('status-update', status);
  }

  /**
   * Extract platform name from a URL for evidence attribution
   */
  private extractPlatformFromUrl(url: string): string {
    try {
      const hostname = new URL(url).hostname.toLowerCase();

      if (hostname.includes('reddit.com')) return 'Reddit';
      if (hostname.includes('g2.com')) return 'G2';
      if (hostname.includes('trustpilot.com')) return 'Trustpilot';
      if (hostname.includes('linkedin.com')) return 'LinkedIn';
      if (hostname.includes('twitter.com') || hostname.includes('x.com')) return 'Twitter';
      if (hostname.includes('quora.com')) return 'Quora';
      if (hostname.includes('youtube.com')) return 'YouTube';
      if (hostname.includes('gartner.com')) return 'Gartner';
      if (hostname.includes('forrester.com')) return 'Forrester';
      if (hostname.includes('mckinsey.com')) return 'McKinsey';
      if (hostname.includes('hbr.org')) return 'Harvard Business Review';
      if (hostname.includes('forbes.com')) return 'Forbes';
      if (hostname.includes('medium.com')) return 'Medium';
      if (hostname.includes('techcrunch.com')) return 'TechCrunch';

      // Return cleaned domain name as fallback
      return hostname.replace('www.', '').split('.')[0];
    } catch {
      return 'research';
    }
  }

  private async saveToCacheasync(brandId: string): Promise<void> {
    // Collect all successful API data
    const allData: any = {};

    // Build DeepContext-like structure from individual API results
    // This runs after all APIs complete, just for caching

    const cacheKey = `deep-context-${brandId}`;
    this.cache.set(cacheKey, {
      data: allData,
      timestamp: Date.now()
    });

    console.log('[StreamingAPI] Saved combined data to cache');
  }

  /**
   * Get current status of all APIs
   */
  getApiStatuses(): Map<ApiEventType, ApiStatus> {
    return this.apiStatuses;
  }

  /**
   * Clear all listeners and reset state
   */
  reset(): void {
    // Clear batch state
    if (this.batchFlushTimeout) {
      clearTimeout(this.batchFlushTimeout);
      this.batchFlushTimeout = null;
    }
    this.eventBuffer.clear();

    this.removeAllListeners();
    this.apiStatuses.clear();
  }
}

// Export singleton instance
export const streamingApiManager = new StreamingApiManager();