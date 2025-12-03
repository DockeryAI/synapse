/**
 * V5 Intelligence Service
 *
 * The V5 philosophy: ONE insight per source, pre-processed into variables.
 * Intelligence enhances template selection and variables, never bloats prompts.
 *
 * V4 Mistake: Dump all trends, gaps, phrases into prompts
 * V5 Approach: Extract the SINGLE most relevant insight per source
 *
 * Sources:
 * - Trends → Single {{trend}} variable
 * - Competitor → Single {{competitive_edge}} variable
 * - Social Listening → 3 power words added to scoring
 *
 * Created: 2025-12-01
 */

import type { Platform, CustomerCategory, IndustryPsychology, UVPVariables } from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface IntelligenceContext {
  brandId?: string;
  industrySlug: string;
  industry: string;
  keywords?: string[];
  location?: string;
  competitors?: string[];
}

export interface V5IntelligenceResult {
  // The ONE insight per source
  trend?: string;              // e.g., "AI-powered automation"
  competitiveEdge?: string;    // e.g., "24/7 support availability"
  customerPhrases?: string[];  // 3 phrases from social listening
  proofPoint?: string;         // e.g., "500+ 5-star reviews"

  // Metadata
  sources: {
    trends?: { found: boolean; source?: string; count?: number };
    competitor?: { found: boolean; source?: string };
    social?: { found: boolean; source?: string; count?: number };
    proof?: { found: boolean; source?: string };
  };

  // Performance
  fetchedAt: Date;
  ttlSeconds: number;
  fromCache: boolean;
}

export interface TrendData {
  topic: string;
  relevanceScore: number;  // 0-100
  velocity?: number;       // Growth rate
  source: string;
}

export interface CompetitorGap {
  gap: string;
  strength: number;        // 1-10
  source: string;
}

export interface CustomerPhrase {
  phrase: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  frequency: number;
  source: string;
}

// ============================================================================
// CACHE
// ============================================================================

interface CacheEntry {
  data: V5IntelligenceResult;
  expiresAt: number;
}

const intelligenceCache = new Map<string, CacheEntry>();

const CACHE_TTL = {
  trends: 60 * 60 * 1000,      // 1 hour
  competitor: 24 * 60 * 60 * 1000, // 24 hours
  social: 4 * 60 * 60 * 1000,  // 4 hours
  full: 30 * 60 * 1000,        // 30 min for full result
};

function getCacheKey(context: IntelligenceContext): string {
  return `v5:intel:${context.brandId || 'anon'}:${context.industrySlug}`;
}

function getCached(key: string): V5IntelligenceResult | null {
  const entry = intelligenceCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    intelligenceCache.delete(key);
    return null;
  }
  return { ...entry.data, fromCache: true };
}

function setCache(key: string, data: V5IntelligenceResult, ttl: number): void {
  intelligenceCache.set(key, {
    data,
    expiresAt: Date.now() + ttl,
  });
}

// ============================================================================
// EXTRACTORS - Pick ONE insight per source
// ============================================================================

/**
 * Extract the SINGLE most relevant trend
 * From 10+ trends → pick 1 that's most relevant to industry
 */
export async function extractBestTrend(
  context: IntelligenceContext
): Promise<{ trend: string; source: string } | null> {
  try {
    // Try to get trends from existing services
    const { TrendAnalyzerService } = await import('../intelligence/trend-analyzer');

    const trends = await TrendAnalyzerService.detectTrendingTopics({
      brandId: context.brandId || '',
      industry: context.industry,
      keywords: context.keywords || [context.industry],
      location: context.location,
    });

    if (!trends || trends.length === 0) {
      console.log('[V5 Intel] No trends found');
      return null;
    }

    // Sort by relevance and pick the top one
    const sortedTrends = trends.sort((a, b) =>
      (b.relevance_score || 0) - (a.relevance_score || 0)
    );

    const bestTrend = sortedTrends[0];

    // Format as a usable variable (short, punchy)
    const trendText = bestTrend.topic || bestTrend.title || bestTrend.keyword;
    if (!trendText) return null;

    // Clean up - make it suitable for template insertion
    const cleanTrend = trendText
      .replace(/^(trending|hot|viral):\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 50); // Max 50 chars

    console.log(`[V5 Intel] Best trend: "${cleanTrend}" from ${trends.length} candidates`);

    return {
      trend: cleanTrend,
      source: 'buzzsumo',
    };
  } catch (error) {
    console.warn('[V5 Intel] Trend extraction failed:', error);
    return null;
  }
}

/**
 * Extract the SINGLE strongest competitive differentiator
 * From 5+ gaps → pick 1 that's most defensible
 */
export async function extractCompetitiveEdge(
  context: IntelligenceContext
): Promise<{ edge: string; source: string } | null> {
  try {
    // First, try to get competitive edges from industry profile (loaded from edge functions)
    const { industryProfileService } = await import('./industry-profile.service');
    const profile = await industryProfileService.loadProfile(context.industrySlug);

    if (profile?.competitive_edges && profile.competitive_edges.length > 0) {
      const edge = profile.competitive_edges[0];
      console.log(`[V5 Intel] Competitive edge from industry profile: "${edge}"`);
      return { edge, source: 'industry-profile' };
    }

    // Try psychology data for differentiators
    const psychology = await industryProfileService.loadPsychology(context.industrySlug);
    if (psychology?.differentiators && psychology.differentiators.length > 0) {
      const edge = psychology.differentiators[0];
      console.log(`[V5 Intel] Competitive edge from psychology: "${edge}"`);
      return { edge, source: 'industry-psychology' };
    }

    // If we have a competitor, try to use competitive intelligence service
    if (context.competitors && context.competitors.length > 0) {
      const { competitiveIntelligence } = await import('../intelligence/competitive-intelligence.service');

      // Discover and profile competitors to find messaging gaps
      const competitors = await competitiveIntelligence.discoverCompetitors({
        industry: context.industry,
        location: context.location,
        limit: 3,
      });

      if (competitors && competitors.length > 0) {
        // Profile first competitor to get differentiators
        const compProfile = await competitiveIntelligence.profileCompetitor(competitors[0]);

        if (compProfile?.messaging?.differentiators && compProfile.messaging.differentiators.length > 0) {
          // Find something they emphasize that could be our opportunity
          const opportunity = compProfile.messaging.differentiators[0];
          const edge = `Superior ${opportunity.toLowerCase()}`;
          console.log(`[V5 Intel] Competitive edge from competitor analysis: "${edge}"`);
          return { edge, source: 'competitive-analysis' };
        }
      }
    }

    console.log('[V5 Intel] No competitive edge found');
    return null;
  } catch (error) {
    console.warn('[V5 Intel] Competitor extraction failed:', error);
    return null;
  }
}

/**
 * Extract 3 customer phrases from social listening
 * These get added to scoring power words, not prompts
 */
export async function extractCustomerPhrases(
  context: IntelligenceContext
): Promise<{ phrases: string[]; source: string } | null> {
  try {
    // Try to get from industry psychology (already loaded)
    // Industry profiles have customer_triggers which contain real customer language

    const { industryProfileService } = await import('./industry-profile.service');
    const psychology = await industryProfileService.loadPsychology(context.industrySlug);

    if (!psychology) {
      return null;
    }

    // Extract phrases from customer triggers
    const triggers = psychology.customerTriggers || [];
    const phrases: string[] = [];

    for (const trigger of triggers.slice(0, 5)) {
      if (trigger.trigger && trigger.urgency >= 7) {
        // High urgency triggers = real customer language
        const phrase = trigger.trigger
          .replace(/^(i need|i want|looking for)\s*/i, '')
          .trim()
          .slice(0, 30);
        if (phrase.length > 5) {
          phrases.push(phrase);
        }
      }
    }

    // Fill remaining with power words
    if (phrases.length < 3 && psychology.powerWords) {
      const remaining = 3 - phrases.length;
      phrases.push(...psychology.powerWords.slice(0, remaining));
    }

    if (phrases.length === 0) return null;

    console.log(`[V5 Intel] Customer phrases: ${phrases.slice(0, 3).join(', ')}`);

    return {
      phrases: phrases.slice(0, 3),
      source: 'industry-profile',
    };
  } catch (error) {
    console.warn('[V5 Intel] Phrase extraction failed:', error);
    return null;
  }
}

/**
 * Extract a proof point (testimonial summary, review count)
 */
export async function extractProofPoint(
  context: IntelligenceContext
): Promise<{ proof: string; source: string } | null> {
  try {
    // First, try industry profile for proof points (loaded from edge functions)
    const { industryProfileService } = await import('./industry-profile.service');
    const profile = await industryProfileService.loadProfile(context.industrySlug);

    if (profile?.proof_points && profile.proof_points.length > 0) {
      const proof = profile.proof_points[0];
      console.log(`[V5 Intel] Proof point from industry profile: "${proof}"`);
      return { proof, source: 'industry-profile' };
    }

    // Try psychology data for social proof patterns
    const psychology = await industryProfileService.loadPsychology(context.industrySlug);
    if (psychology?.socialProofPatterns && psychology.socialProofPatterns.length > 0) {
      const proof = psychology.socialProofPatterns[0];
      console.log(`[V5 Intel] Proof point from psychology: "${proof}"`);
      return { proof, source: 'industry-psychology' };
    }

    // If we have deepContext available, use proof consolidation service
    // Note: This is typically called from content-generation which has access to deepContext
    // For V5 intelligence queries without deepContext, we rely on industry profiles
    console.log('[V5 Intel] No proof points found in industry data');
    return null;
  } catch (error) {
    console.warn('[V5 Intel] Proof extraction failed:', error);
    return null;
  }
}

// ============================================================================
// MAIN SERVICE
// ============================================================================

/**
 * Get V5 intelligence for content generation
 * Returns pre-processed variables ready for template injection
 */
export async function getIntelligence(
  context: IntelligenceContext
): Promise<V5IntelligenceResult> {
  const cacheKey = getCacheKey(context);

  // Check cache first
  const cached = getCached(cacheKey);
  if (cached) {
    console.log('[V5 Intel] Returning cached intelligence');
    return cached;
  }

  console.log(`[V5 Intel] Fetching intelligence for ${context.industrySlug}`);

  // Fetch all sources in parallel with graceful degradation
  const [trendResult, edgeResult, phrasesResult, proofResult] = await Promise.all([
    extractBestTrend(context).catch(() => null),
    extractCompetitiveEdge(context).catch(() => null),
    extractCustomerPhrases(context).catch(() => null),
    extractProofPoint(context).catch(() => null),
  ]);

  const result: V5IntelligenceResult = {
    trend: trendResult?.trend,
    competitiveEdge: edgeResult?.edge,
    customerPhrases: phrasesResult?.phrases,
    proofPoint: proofResult?.proof,

    sources: {
      trends: { found: !!trendResult, source: trendResult?.source },
      competitor: { found: !!edgeResult, source: edgeResult?.source },
      social: { found: !!phrasesResult, source: phrasesResult?.source, count: phrasesResult?.phrases?.length },
      proof: { found: !!proofResult, source: proofResult?.source },
    },

    fetchedAt: new Date(),
    ttlSeconds: CACHE_TTL.full / 1000,
    fromCache: false,
  };

  // Cache the result
  setCache(cacheKey, result, CACHE_TTL.full);

  // Log what we found
  const foundCount = [trendResult, edgeResult, phrasesResult, proofResult].filter(Boolean).length;
  console.log(`[V5 Intel] Found ${foundCount}/4 intelligence sources`);

  return result;
}

/**
 * Merge intelligence into UVP variables for template population
 */
export function mergeIntoVariables(
  uvp: UVPVariables,
  intelligence: V5IntelligenceResult
): UVPVariables {
  return {
    ...uvp,
    trend: intelligence.trend || uvp.trend,
    competitiveEdge: intelligence.competitiveEdge || uvp.competitiveEdge,
    proofPoint: intelligence.proofPoint || uvp.proofPoint,
  };
}

/**
 * Get additional power words from intelligence for scoring
 */
export function getIntelligencePowerWords(intelligence: V5IntelligenceResult): string[] {
  return intelligence.customerPhrases || [];
}

/**
 * Check if intelligence is stale and needs refresh
 */
export function isStale(intelligence: V5IntelligenceResult): boolean {
  const age = Date.now() - new Date(intelligence.fetchedAt).getTime();
  return age > intelligence.ttlSeconds * 1000;
}

/**
 * Clear cache for a brand (call when brand data changes)
 */
export function clearCache(brandId?: string): void {
  if (brandId) {
    // Clear specific brand
    for (const key of intelligenceCache.keys()) {
      if (key.includes(brandId)) {
        intelligenceCache.delete(key);
      }
    }
  } else {
    // Clear all
    intelligenceCache.clear();
  }
}

/**
 * Get cache stats
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: intelligenceCache.size,
    keys: Array.from(intelligenceCache.keys()),
  };
}

// ============================================================================
// EXPORT SERVICE
// ============================================================================

export interface IIntelligenceService {
  getIntelligence: typeof getIntelligence;
  mergeIntoVariables: typeof mergeIntoVariables;
  getIntelligencePowerWords: typeof getIntelligencePowerWords;
  clearCache: typeof clearCache;
}

export const intelligenceService: IIntelligenceService = {
  getIntelligence,
  mergeIntoVariables,
  getIntelligencePowerWords,
  clearCache,
};

export default intelligenceService;
