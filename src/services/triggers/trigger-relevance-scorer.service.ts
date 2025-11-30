/**
 * Trigger Relevance Scorer Service
 *
 * Scores triggers for relevance to the user's brand, UVP, and profile.
 * Combines UVP vocabulary matching, profile relevance, and geographic fit.
 *
 * Created: 2025-11-28
 */

import { uvpVocabularyService, type BrandVocabulary } from './uvp-vocabulary.service';
import { profileRelevanceService } from './profile-relevance.service';
import type { BusinessProfileType } from './profile-detection.service';
import type { CompleteUVP } from '@/types/uvp-flow.types';

// ============================================================================
// TYPES
// ============================================================================

export interface TriggerRelevanceScore {
  /** UVP vocabulary overlap (0-1), weight: 50% */
  uvpMatch: number;
  /** Profile fit (0-1), weight: 30% */
  profileFit: number;
  /** Geographic relevance (0-1), weight: 20% */
  geoRelevance: number;
  /** Combined weighted score */
  finalScore: number;
  /** Whether trigger passes relevance threshold */
  isRelevant: boolean;
  /** Explanation of score */
  reasoning: string;
  /** Matched keywords for debugging */
  matchedKeywords: string[];
}

export interface ScoringContext {
  uvp: CompleteUVP;
  profileType: BusinessProfileType | 'global-saas-b2b';
  brandData?: any;
  /** Minimum score to be considered relevant (default: 0.35) */
  threshold?: number;
}

export interface TriggerInput {
  id: string;
  title: string;
  content: string;
  source?: string;
  platform?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Raised from 0.35 to 0.55 to filter more aggressively
const DEFAULT_THRESHOLD = 0.55;

const SCORE_WEIGHTS = {
  uvpMatch: 0.50,
  profileFit: 0.30,
  geoRelevance: 0.20
};

// Geographic regions for matching
const REGION_KEYWORDS: Record<string, string[]> = {
  'uk': ['uk', 'united kingdom', 'britain', 'british', 'england', 'london', 'manchester', 'birmingham'],
  'emea': ['emea', 'europe', 'european', 'eu', 'germany', 'france', 'spain', 'italy', 'netherlands', 'middle east', 'africa'],
  'us': ['us', 'usa', 'united states', 'american', 'california', 'new york', 'texas', 'florida'],
  'apac': ['apac', 'asia', 'pacific', 'australia', 'singapore', 'japan', 'china', 'india', 'korea'],
  'global': ['global', 'international', 'worldwide', 'multinational']
};

// Self-promotional patterns to filter out (these are marketing claims, not customer triggers)
const SELF_PROMOTIONAL_PATTERNS = [
  /is a leader in/i,
  /is the leading/i,
  /is the best/i,
  /world-class/i,
  /industry-leading/i,
  /award-winning/i,
  /cutting-edge/i,
  /state-of-the-art/i,
  /best-in-class/i,
  /market leader/i,
  /trusted by/i,
  /chosen by/i,
  /preferred by/i,
  /\b(we|our)\s+(are|have|offer|provide|deliver)/i,
  /\b(brand|company|product)\s+is\s+/i,
];

// ============================================================================
// SERVICE
// ============================================================================

class TriggerRelevanceScorerService {
  private vocabularyCache: Map<string, BrandVocabulary> = new Map();

  /**
   * Check if content is self-promotional (marketing copy, not customer voice)
   */
  private isSelfPromotional(text: string): boolean {
    return SELF_PROMOTIONAL_PATTERNS.some(pattern => pattern.test(text));
  }

  /**
   * Score a single trigger for relevance
   */
  scoreTrigger(trigger: TriggerInput, context: ScoringContext): TriggerRelevanceScore {
    const threshold = context.threshold ?? DEFAULT_THRESHOLD;
    const combinedText = `${trigger.title} ${trigger.content}`.toLowerCase();

    // FIRST: Check for self-promotional content (instant rejection)
    if (this.isSelfPromotional(combinedText)) {
      return {
        uvpMatch: 0,
        profileFit: 0,
        geoRelevance: 0,
        finalScore: 0,
        isRelevant: false,
        reasoning: 'Rejected: Self-promotional marketing content, not customer voice',
        matchedKeywords: []
      };
    }

    // Get or build vocabulary
    const vocabulary = this.getVocabulary(context.uvp, context.brandData);

    // Calculate UVP match score
    const uvpMatch = uvpVocabularyService.calculateOverlapScore(combinedText, vocabulary);

    // Calculate profile fit score
    const profileResult = profileRelevanceService.checkRelevance(combinedText, context.profileType);
    const profileFit = profileResult.score;

    // Calculate geographic relevance
    const geoRelevance = this.calculateGeoRelevance(combinedText, context.uvp, context.brandData);

    // Calculate weighted final score
    const finalScore =
      (uvpMatch * SCORE_WEIGHTS.uvpMatch) +
      (profileFit * SCORE_WEIGHTS.profileFit) +
      (geoRelevance * SCORE_WEIGHTS.geoRelevance);

    // Determine if relevant
    const isRelevant = finalScore >= threshold && profileResult.isRelevant;

    // Build reasoning
    const reasoning = this.buildReasoning(uvpMatch, profileFit, geoRelevance, profileResult, isRelevant);

    return {
      uvpMatch,
      profileFit,
      geoRelevance,
      finalScore,
      isRelevant,
      reasoning,
      matchedKeywords: profileResult.matchedKeywords
    };
  }

  /**
   * Score multiple triggers and filter irrelevant ones
   */
  scoreTriggers(
    triggers: TriggerInput[],
    context: ScoringContext
  ): Array<TriggerInput & { relevanceScore: TriggerRelevanceScore }> {
    return triggers
      .map(trigger => ({
        ...trigger,
        relevanceScore: this.scoreTrigger(trigger, context)
      }))
      .filter(t => t.relevanceScore.isRelevant)
      .sort((a, b) => b.relevanceScore.finalScore - a.relevanceScore.finalScore);
  }

  /**
   * Get statistics about scoring results
   */
  getScoringStats(
    triggers: TriggerInput[],
    context: ScoringContext
  ): {
    total: number;
    relevant: number;
    filtered: number;
    avgScore: number;
    topReasons: string[];
  } {
    const scored = triggers.map(t => this.scoreTrigger(t, context));
    const relevant = scored.filter(s => s.isRelevant);

    return {
      total: triggers.length,
      relevant: relevant.length,
      filtered: triggers.length - relevant.length,
      avgScore: relevant.length > 0
        ? relevant.reduce((sum, s) => sum + s.finalScore, 0) / relevant.length
        : 0,
      topReasons: relevant.slice(0, 5).map(s => s.reasoning)
    };
  }

  /**
   * Clear vocabulary cache
   */
  clearCache(): void {
    this.vocabularyCache.clear();
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private getVocabulary(uvp: CompleteUVP, brandData?: any): BrandVocabulary {
    const cacheKey = uvp.id || 'default';

    if (!this.vocabularyCache.has(cacheKey)) {
      const result = uvpVocabularyService.extractVocabulary(uvp, brandData);
      this.vocabularyCache.set(cacheKey, result.vocabulary);
    }

    return this.vocabularyCache.get(cacheKey)!;
  }

  private calculateGeoRelevance(text: string, uvp: CompleteUVP, brandData?: any): number {
    // Get user's target regions
    const targetRegions = this.getTargetRegions(uvp, brandData);

    if (targetRegions.length === 0 || targetRegions.includes('global')) {
      // If global or no specific region, all regions are relevant
      return 0.8;
    }

    // Check if text mentions any of the target regions
    let regionMatches = 0;
    let totalChecks = 0;

    for (const region of targetRegions) {
      const keywords = REGION_KEYWORDS[region] || [];
      totalChecks += keywords.length;

      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          regionMatches++;
        }
      }
    }

    if (totalChecks === 0) return 0.5;

    // Check for mentions of non-target regions (negative signal)
    let nonTargetMentions = 0;
    for (const [region, keywords] of Object.entries(REGION_KEYWORDS)) {
      if (!targetRegions.includes(region) && region !== 'global') {
        for (const keyword of keywords) {
          if (text.includes(keyword)) {
            nonTargetMentions++;
          }
        }
      }
    }

    // Calculate score: boost for target region mentions, slight penalty for non-target
    const baseScore = 0.5;
    const boost = Math.min(regionMatches * 0.15, 0.4);
    const penalty = Math.min(nonTargetMentions * 0.05, 0.2);

    return Math.max(0, Math.min(1, baseScore + boost - penalty));
  }

  private getTargetRegions(uvp: CompleteUVP, brandData?: any): string[] {
    const regions: string[] = [];

    // Check market geography in UVP
    const marketGeo = (uvp.targetCustomer as any)?.marketGeography;
    if (marketGeo?.primaryRegions) {
      regions.push(...marketGeo.primaryRegions.map((r: string) => r.toLowerCase()));
    }

    // Check brand data
    if (brandData?.location) {
      const location = brandData.location.toLowerCase();
      for (const [region, keywords] of Object.entries(REGION_KEYWORDS)) {
        if (keywords.some(k => location.includes(k))) {
          regions.push(region);
        }
      }
    }

    // Check brand description/industry for region hints
    if (brandData?.description) {
      const desc = brandData.description.toLowerCase();
      for (const [region, keywords] of Object.entries(REGION_KEYWORDS)) {
        if (keywords.some(k => desc.includes(k))) {
          regions.push(region);
        }
      }
    }

    return [...new Set(regions)];
  }

  private buildReasoning(
    uvpMatch: number,
    profileFit: number,
    geoRelevance: number,
    profileResult: { matchedKeywords: string[]; matchedNoiseKeywords: string[]; reasoning: string },
    isRelevant: boolean
  ): string {
    const parts: string[] = [];

    // UVP match
    if (uvpMatch >= 0.6) {
      parts.push('Strong UVP alignment');
    } else if (uvpMatch >= 0.3) {
      parts.push('Moderate UVP overlap');
    } else {
      parts.push('Low UVP relevance');
    }

    // Profile fit
    if (profileFit >= 0.6) {
      parts.push('fits profile well');
    } else if (profileFit < 0.3) {
      parts.push('poor profile fit');
    }

    // Noise detection
    if (profileResult.matchedNoiseKeywords.length > 0) {
      parts.push(`noise: ${profileResult.matchedNoiseKeywords.slice(0, 2).join(', ')}`);
    }

    // Keywords
    if (profileResult.matchedKeywords.length > 0) {
      parts.push(`keywords: ${profileResult.matchedKeywords.slice(0, 3).join(', ')}`);
    }

    if (!isRelevant) {
      return `FILTERED: ${parts.join('; ')}`;
    }

    return parts.join('; ');
  }
}

// Export singleton
export const triggerRelevanceScorerService = new TriggerRelevanceScorerService();
