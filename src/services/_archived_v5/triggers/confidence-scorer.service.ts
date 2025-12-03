/**
 * Confidence Scorer Service
 *
 * Implements the Triggers 3.0 confidence scoring formula:
 * Score = Signal Quality × Recency × Source Count × Competitor Attribution
 *
 * Reduces false positives from ~48% to target < 25% through:
 * - Multi-signal stacking (2+ sources required for high confidence)
 * - Source quality weighting by tier
 * - Recency decay
 * - Competitor attribution bonus
 *
 * Success Targets:
 * - False Positive Rate: < 25%
 * - Confidence Distribution: 60% high, 30% medium, 10% low
 * - Source Diversity: Average 2.3 sources per trigger
 *
 * Created: 2025-12-01
 * Phase: Triggers 3.0 - Phase 1 (Foundation Layer)
 */

import { recencyCalculatorService, type RecencyResult, type TriggerEventType } from './recency-calculator.service';
import { competitorAttributionService, type CompetitorAttributionResult } from './competitor-attribution.service';
import { sourceQualityService, type SourceTier } from './_archived/source-quality.service';
import type { BusinessProfileType } from './_archived/profile-detection.service';

// ============================================================================
// TYPES
// ============================================================================

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface ConfidenceFactors {
  /** Signal quality score (0-1) based on source tier */
  signalQuality: number;
  /** Recency score (0-1) based on timestamp */
  recency: number;
  /** Source count multiplier */
  sourceCountBonus: number;
  /** Competitor attribution bonus */
  competitorAttributionBonus: number;
  /** Profile relevance score (0-1) */
  profileRelevance?: number;
}

export interface ConfidenceExplanation {
  /** Human-readable explanation of the score */
  summary: string;
  /** Breakdown of factors */
  factors: Array<{
    name: string;
    value: number;
    impact: 'positive' | 'neutral' | 'negative';
    explanation: string;
  }>;
  /** Suggestions for improving confidence */
  suggestions: string[];
}

export interface ConfidenceResult {
  /** Final confidence score (0-1) */
  score: number;
  /** Confidence level (high/medium/low) */
  level: ConfidenceLevel;
  /** Individual factor scores */
  factors: ConfidenceFactors;
  /** Human-readable explanation */
  explanation: ConfidenceExplanation;
  /** Whether this trigger meets minimum quality bar */
  meetsQualityBar: boolean;
  /** Recommended action */
  action: 'display-prominent' | 'display' | 'display-with-caveat' | 'filter-out';
}

export interface TriggerSignal {
  /** Source platform */
  source: string;
  /** Signal timestamp */
  timestamp?: string;
  /** Raw quote/text */
  quote: string;
  /** URL if available */
  url?: string;
  /** Event type for recency calculation */
  eventType?: TriggerEventType;
}

export interface ConfidenceScoringInput {
  /** All signals contributing to this trigger */
  signals: TriggerSignal[];
  /** Known competitor name if any */
  competitorName?: string;
  /** Business profile type */
  profileType?: BusinessProfileType;
  /** Profile relevance score from other services */
  profileRelevanceScore?: number;
  /** Primary quote text for attribution extraction */
  primaryQuote?: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Confidence thresholds
 */
const CONFIDENCE_THRESHOLDS = {
  high: 0.7,
  medium: 0.45,
  // Below medium = low
};

/**
 * Minimum quality bar
 * Triggers below this are filtered out
 */
const MINIMUM_QUALITY_BAR = 0.25;

/**
 * Source count bonus multipliers
 * Multi-signal stacking reduces false positives
 */
const SOURCE_COUNT_BONUSES: Record<number, number> = {
  1: 0.8, // Single source = penalty
  2: 1.0, // Two sources = baseline
  3: 1.15, // Three sources = bonus
  4: 1.25, // Four sources = bigger bonus
  5: 1.3, // Five+ sources = max bonus
};

/**
 * Competitor attribution bonus
 */
const COMPETITOR_ATTRIBUTION_BONUS = 1.15;

/**
 * Signal quality tier weights
 */
const SIGNAL_QUALITY_WEIGHTS: Record<SourceTier, number> = {
  tier1: 1.0,
  tier2: 0.8,
  tier3: 0.5,
};

// ============================================================================
// SERVICE
// ============================================================================

class ConfidenceScorerService {
  /**
   * Calculate comprehensive confidence score for a trigger
   */
  calculateConfidence(input: ConfidenceScoringInput): ConfidenceResult {
    const { signals, competitorName, profileType, profileRelevanceScore, primaryQuote } = input;

    // Handle empty signals
    if (!signals || signals.length === 0) {
      return this.createLowConfidenceResult('No signals available');
    }

    // Calculate individual factors
    const signalQuality = this.calculateSignalQuality(signals, profileType);
    const recency = this.calculateRecencyScore(signals);
    const sourceCountBonus = this.calculateSourceCountBonus(signals);
    const competitorAttributionBonus = this.calculateCompetitorBonus(
      competitorName,
      primaryQuote || signals[0]?.quote
    );
    const profileRelevance = profileRelevanceScore ?? 0.7; // Default to moderate relevance

    // Combine factors using the formula
    // Score = Signal Quality × Recency × Source Count × Competitor Attribution × Profile Relevance
    const rawScore =
      signalQuality *
      recency *
      sourceCountBonus *
      competitorAttributionBonus *
      (0.5 + profileRelevance * 0.5); // Profile relevance adds 0-50% boost

    // Normalize to 0-1
    const score = Math.min(1, Math.max(0, rawScore));

    const factors: ConfidenceFactors = {
      signalQuality,
      recency,
      sourceCountBonus,
      competitorAttributionBonus,
      profileRelevance,
    };

    const level = this.determineConfidenceLevel(score);
    const meetsQualityBar = score >= MINIMUM_QUALITY_BAR;
    const action = this.determineAction(score, level, meetsQualityBar);
    const explanation = this.generateExplanation(factors, score, level, signals);

    return {
      score,
      level,
      factors,
      explanation,
      meetsQualityBar,
      action,
    };
  }

  /**
   * Quick check if a trigger meets minimum quality
   */
  meetsMinimumQuality(input: ConfidenceScoringInput): boolean {
    const result = this.calculateConfidence(input);
    return result.meetsQualityBar;
  }

  /**
   * Get confidence level from score
   */
  determineConfidenceLevel(score: number): ConfidenceLevel {
    if (score >= CONFIDENCE_THRESHOLDS.high) return 'high';
    if (score >= CONFIDENCE_THRESHOLDS.medium) return 'medium';
    return 'low';
  }

  /**
   * Batch calculate confidence for multiple triggers
   */
  batchCalculateConfidence(
    triggers: Array<{ signals: TriggerSignal[]; competitorName?: string; profileType?: BusinessProfileType }>
  ): ConfidenceResult[] {
    return triggers.map((t) =>
      this.calculateConfidence({
        signals: t.signals,
        competitorName: t.competitorName,
        profileType: t.profileType,
      })
    );
  }

  /**
   * Get distribution stats for a set of confidence scores
   * Useful for monitoring target: 60% high, 30% medium, 10% low
   */
  getConfidenceDistribution(results: ConfidenceResult[]): {
    high: number;
    medium: number;
    low: number;
    percentHigh: number;
    percentMedium: number;
    percentLow: number;
    averageScore: number;
    meetsTarget: boolean;
  } {
    let high = 0;
    let medium = 0;
    let low = 0;
    let totalScore = 0;

    for (const result of results) {
      totalScore += result.score;
      switch (result.level) {
        case 'high':
          high++;
          break;
        case 'medium':
          medium++;
          break;
        case 'low':
          low++;
          break;
      }
    }

    const total = results.length || 1;
    const percentHigh = Math.round((high / total) * 100);
    const percentMedium = Math.round((medium / total) * 100);
    const percentLow = Math.round((low / total) * 100);
    const averageScore = totalScore / total;

    // Target: 60% high, 30% medium, 10% low
    const meetsTarget = percentHigh >= 50 && percentLow <= 20;

    return {
      high,
      medium,
      low,
      percentHigh,
      percentMedium,
      percentLow,
      averageScore,
      meetsTarget,
    };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Calculate signal quality score based on source tiers
   */
  private calculateSignalQuality(signals: TriggerSignal[], profileType?: BusinessProfileType): number {
    if (signals.length === 0) return 0;

    let totalWeight = 0;
    let weightedSum = 0;

    for (const signal of signals) {
      // Get source quality
      const quality = profileType
        ? sourceQualityService.getProfileAwareQualityAdjustment(signal.source, profileType, signal.url)
        : sourceQualityService.getQualityAdjustment(signal.source, signal.url);

      const tierWeight = SIGNAL_QUALITY_WEIGHTS[quality.tier] || 0.5;
      const signalWeight = quality.multiplier;

      weightedSum += tierWeight * signalWeight;
      totalWeight += 1;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Calculate aggregate recency score
   */
  private calculateRecencyScore(signals: TriggerSignal[]): number {
    if (signals.length === 0) return 0;

    // Get recency for each signal and average
    const recencyScores: number[] = [];

    for (const signal of signals) {
      const recency = recencyCalculatorService.calculateRecency(
        signal.timestamp,
        signal.eventType || 'default'
      );
      recencyScores.push(recency.multiplier);
    }

    // Use max recency (best signal determines recency)
    // This is more forgiving than average
    return Math.max(...recencyScores);
  }

  /**
   * Calculate source count bonus
   */
  private calculateSourceCountBonus(signals: TriggerSignal[]): number {
    // Count unique sources
    const uniqueSources = new Set(signals.map((s) => s.source.toLowerCase()));
    const count = Math.min(uniqueSources.size, 5); // Cap at 5

    return SOURCE_COUNT_BONUSES[count] || SOURCE_COUNT_BONUSES[1];
  }

  /**
   * Calculate competitor attribution bonus
   */
  private calculateCompetitorBonus(competitorName?: string, quote?: string): number {
    // If competitor already known, apply bonus
    if (competitorName) {
      return COMPETITOR_ATTRIBUTION_BONUS;
    }

    // Try to extract competitor from quote
    if (quote) {
      const attribution = competitorAttributionService.extractCompetitorMentions(quote);
      if (attribution.primaryCompetitor) {
        return COMPETITOR_ATTRIBUTION_BONUS;
      }
    }

    // No competitor attribution
    return 1.0;
  }

  /**
   * Determine recommended action based on confidence
   */
  private determineAction(
    score: number,
    level: ConfidenceLevel,
    meetsQualityBar: boolean
  ): 'display-prominent' | 'display' | 'display-with-caveat' | 'filter-out' {
    if (!meetsQualityBar) {
      return 'filter-out';
    }

    switch (level) {
      case 'high':
        return 'display-prominent';
      case 'medium':
        return 'display';
      case 'low':
        return 'display-with-caveat';
    }
  }

  /**
   * Generate human-readable explanation
   */
  private generateExplanation(
    factors: ConfidenceFactors,
    score: number,
    level: ConfidenceLevel,
    signals: TriggerSignal[]
  ): ConfidenceExplanation {
    const factorDetails: ConfidenceExplanation['factors'] = [];
    const suggestions: string[] = [];

    // Signal quality
    factorDetails.push({
      name: 'Signal Quality',
      value: factors.signalQuality,
      impact: factors.signalQuality >= 0.8 ? 'positive' : factors.signalQuality >= 0.5 ? 'neutral' : 'negative',
      explanation: `Source tier quality: ${Math.round(factors.signalQuality * 100)}%`,
    });

    if (factors.signalQuality < 0.8) {
      suggestions.push('Add signals from higher-quality sources (G2, Reddit, Trustpilot)');
    }

    // Recency
    factorDetails.push({
      name: 'Recency',
      value: factors.recency,
      impact: factors.recency >= 0.8 ? 'positive' : factors.recency >= 0.5 ? 'neutral' : 'negative',
      explanation: `Signal freshness: ${Math.round(factors.recency * 100)}%`,
    });

    if (factors.recency < 0.5) {
      suggestions.push('This signal may be stale; look for more recent discussions');
    }

    // Source count
    const uniqueSources = new Set(signals.map((s) => s.source.toLowerCase())).size;
    factorDetails.push({
      name: 'Source Diversity',
      value: factors.sourceCountBonus,
      impact: uniqueSources >= 2 ? 'positive' : 'negative',
      explanation: `${uniqueSources} unique source${uniqueSources !== 1 ? 's' : ''} (${factors.sourceCountBonus}x)`,
    });

    if (uniqueSources < 2) {
      suggestions.push('Single-source signals have higher false positive risk; look for corroborating sources');
    }

    // Competitor attribution
    factorDetails.push({
      name: 'Competitor Attribution',
      value: factors.competitorAttributionBonus,
      impact: factors.competitorAttributionBonus > 1 ? 'positive' : 'neutral',
      explanation:
        factors.competitorAttributionBonus > 1
          ? 'Competitor mentioned (bonus applied)'
          : 'No specific competitor identified',
    });

    if (factors.competitorAttributionBonus === 1) {
      suggestions.push('Triggers with specific competitor mentions are more actionable');
    }

    // Profile relevance
    if (factors.profileRelevance !== undefined) {
      factorDetails.push({
        name: 'Profile Relevance',
        value: factors.profileRelevance,
        impact: factors.profileRelevance >= 0.7 ? 'positive' : factors.profileRelevance >= 0.4 ? 'neutral' : 'negative',
        explanation: `Relevance to business profile: ${Math.round(factors.profileRelevance * 100)}%`,
      });

      if (factors.profileRelevance < 0.5) {
        suggestions.push('This trigger may not be highly relevant to your business profile');
      }
    }

    // Generate summary
    const summary = this.generateSummary(score, level, uniqueSources);

    return {
      summary,
      factors: factorDetails,
      suggestions,
    };
  }

  /**
   * Generate summary text
   */
  private generateSummary(score: number, level: ConfidenceLevel, sourceCount: number): string {
    const percentScore = Math.round(score * 100);

    switch (level) {
      case 'high':
        return `High confidence (${percentScore}%) - ${sourceCount} sources corroborate this signal`;
      case 'medium':
        return `Medium confidence (${percentScore}%) - Signal appears valid but could use more corroboration`;
      case 'low':
        return `Low confidence (${percentScore}%) - Treat this signal with caution`;
    }
  }

  /**
   * Create a low confidence result with custom message
   */
  private createLowConfidenceResult(reason: string): ConfidenceResult {
    return {
      score: 0,
      level: 'low',
      factors: {
        signalQuality: 0,
        recency: 0,
        sourceCountBonus: 0.8,
        competitorAttributionBonus: 1,
        profileRelevance: 0,
      },
      explanation: {
        summary: reason,
        factors: [],
        suggestions: ['Unable to calculate confidence - check input data'],
      },
      meetsQualityBar: false,
      action: 'filter-out',
    };
  }
}

// Export singleton
export const confidenceScorerService = new ConfidenceScorerService();

// Export class for testing
export { ConfidenceScorerService };

// Export types and constants for use by other modules
export { CONFIDENCE_THRESHOLDS, MINIMUM_QUALITY_BAR };
