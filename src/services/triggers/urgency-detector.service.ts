/**
 * Urgency Detector Service
 *
 * Classifies buying urgency from signals to prioritize high-intent triggers.
 * Distinguishes between:
 * - Browsing: Early research, no timeline
 * - Active: Actively evaluating, 30-90 day buying window
 * - Immediate: Ready to buy now, often triggered by an event
 *
 * SMB buying cycles are typically 30-90 days, so urgency detection
 * is critical for timing outreach correctly.
 *
 * Created: 2025-12-01
 * Phase: Triggers 3.0 - Phase 2 (SMB Signal Pipeline)
 */

import { recencyCalculatorService } from './recency-calculator.service';

// ============================================================================
// TYPES
// ============================================================================

export type UrgencyLevel = 'immediate' | 'active' | 'researching' | 'browsing' | 'unknown';

export type UrgencyTriggerType =
  | 'contract-expiration'
  | 'pain-threshold'
  | 'growth-event'
  | 'compliance-deadline'
  | 'competitive-pressure'
  | 'budget-cycle'
  | 'leadership-change'
  | 'explicit-timeline'
  | 'comparison-shopping'
  | 'general-research';

export interface UrgencyIndicator {
  /** Type of urgency trigger */
  type: UrgencyTriggerType;
  /** Matched text */
  matchedText: string;
  /** Weight for scoring */
  weight: number;
  /** Implied timeline */
  impliedTimelineDays?: number;
}

export interface UrgencyAnalysis {
  /** Overall urgency level */
  level: UrgencyLevel;
  /** Urgency score (0-1) */
  score: number;
  /** Detected urgency indicators */
  indicators: UrgencyIndicator[];
  /** Estimated buying timeline */
  estimatedTimeline: {
    minDays: number;
    maxDays: number;
    label: string;
  };
  /** Confidence in this assessment */
  confidence: number;
  /** Reasoning for the classification */
  reasoning: string;
  /** Recommended action */
  recommendedAction: 'engage-immediately' | 'nurture-short' | 'nurture-long' | 'monitor';
}

export interface UrgencyDetectionInput {
  /** Text to analyze */
  text: string;
  /** Source platform (affects interpretation) */
  platform?: string;
  /** Original timestamp of the signal */
  timestamp?: string;
  /** Additional context */
  context?: string;
}

// ============================================================================
// URGENCY PATTERNS
// ============================================================================

/**
 * Immediate urgency patterns (buying now or within days)
 */
const IMMEDIATE_PATTERNS: Array<{
  pattern: RegExp;
  type: UrgencyTriggerType;
  impliedDays: number;
  weight: number;
}> = [
  // Explicit immediate need
  {
    pattern: /(?:need|looking for|searching for).{0,30}(?:asap|immediately|right now|today|this week|urgently)/i,
    type: 'explicit-timeline',
    impliedDays: 7,
    weight: 1.0,
  },
  {
    pattern: /(?:urgent|emergency|critical|crisis|desperate)/i,
    type: 'pain-threshold',
    impliedDays: 7,
    weight: 0.95,
  },
  // Contract/deadline driven
  {
    pattern: /(?:contract (?:is |)up|contract (?:expir|end)|renewal (?:is |)due|subscription (?:expir|end))/i,
    type: 'contract-expiration',
    impliedDays: 14,
    weight: 0.95,
  },
  {
    pattern: /(?:deadline|due date|must have by|need by|required by).{0,20}(?:next week|end of month|this month)/i,
    type: 'compliance-deadline',
    impliedDays: 14,
    weight: 0.9,
  },
  // Just cancelled/switched
  {
    pattern: /(?:just cancelled|just left|just dropped|just switched from)/i,
    type: 'competitive-pressure',
    impliedDays: 7,
    weight: 0.9,
  },
  // Budget availability
  {
    pattern: /(?:budget approved|got budget|have budget|budget available|can spend)/i,
    type: 'budget-cycle',
    impliedDays: 14,
    weight: 0.85,
  },
];

/**
 * Active buying patterns (30-90 day window)
 */
const ACTIVE_PATTERNS: Array<{
  pattern: RegExp;
  type: UrgencyTriggerType;
  impliedDays: number;
  weight: number;
}> = [
  // Active evaluation
  {
    pattern: /(?:evaluating|comparing|considering|reviewing|testing|trialing)/i,
    type: 'comparison-shopping',
    impliedDays: 45,
    weight: 0.8,
  },
  {
    pattern: /(?:demo|trial|pilot|poc|proof of concept)/i,
    type: 'comparison-shopping',
    impliedDays: 30,
    weight: 0.75,
  },
  // Timeline mentions
  {
    pattern: /(?:next quarter|Q[1-4]|by end of|within.{0,10}(?:month|weeks))/i,
    type: 'explicit-timeline',
    impliedDays: 60,
    weight: 0.75,
  },
  {
    pattern: /(?:planning to|going to|will be) (?:switch|change|replace|implement)/i,
    type: 'explicit-timeline',
    impliedDays: 60,
    weight: 0.7,
  },
  // Growth triggers
  {
    pattern: /(?:scaling|growing|expanding|hiring|opening.{0,10}(?:office|location))/i,
    type: 'growth-event',
    impliedDays: 60,
    weight: 0.65,
  },
  // Leadership change
  {
    pattern: /(?:new (?:CEO|CTO|VP|director|manager)|just joined|taking over)/i,
    type: 'leadership-change',
    impliedDays: 90,
    weight: 0.6,
  },
  // Pain threshold
  {
    pattern: /(?:fed up|had enough|can't take|at my limit|breaking point)/i,
    type: 'pain-threshold',
    impliedDays: 30,
    weight: 0.8,
  },
];

/**
 * Research/browsing patterns (90+ days or unknown)
 */
const RESEARCH_PATTERNS: Array<{
  pattern: RegExp;
  type: UrgencyTriggerType;
  impliedDays: number;
  weight: number;
}> = [
  // General research
  {
    pattern: /(?:curious|wondering|thinking about|might|someday|eventually)/i,
    type: 'general-research',
    impliedDays: 180,
    weight: 0.4,
  },
  {
    pattern: /(?:for future|down the road|next year|long term)/i,
    type: 'general-research',
    impliedDays: 365,
    weight: 0.3,
  },
  // Information gathering
  {
    pattern: /(?:what do you (?:think|recommend)|any suggestions|advice on)/i,
    type: 'general-research',
    impliedDays: 120,
    weight: 0.5,
  },
  // Comparison without urgency
  {
    pattern: /(?:difference between|better.{0,10}or|vs\.?|versus)/i,
    type: 'comparison-shopping',
    impliedDays: 90,
    weight: 0.55,
  },
];

/**
 * Anti-urgency patterns (reduce urgency score)
 */
const ANTI_URGENCY_PATTERNS: RegExp[] = [
  /(?:just curious|no rush|not urgent|when I have time|someday)/i,
  /(?:hypothetically|in theory|if I were to|thinking about maybe)/i,
  /(?:for a friend|asking for someone else)/i,
  /(?:already have|currently using|happy with|satisfied with)/i,
];

/**
 * Urgency level thresholds
 */
const URGENCY_THRESHOLDS = {
  immediate: 0.8,
  active: 0.5,
  researching: 0.3,
  // Below 0.3 = browsing
};

/**
 * Timeline labels by urgency level
 */
const TIMELINE_LABELS: Record<UrgencyLevel, { minDays: number; maxDays: number; label: string }> = {
  'immediate': { minDays: 0, maxDays: 14, label: 'Within 2 weeks' },
  'active': { minDays: 14, maxDays: 90, label: '1-3 months' },
  'researching': { minDays: 90, maxDays: 180, label: '3-6 months' },
  'browsing': { minDays: 180, maxDays: 365, label: '6+ months or unknown' },
  'unknown': { minDays: 30, maxDays: 180, label: 'Unknown timeline' },
};

/**
 * Recommended actions by urgency level
 */
const RECOMMENDED_ACTIONS: Record<UrgencyLevel, UrgencyAnalysis['recommendedAction']> = {
  'immediate': 'engage-immediately',
  'active': 'nurture-short',
  'researching': 'nurture-long',
  'browsing': 'monitor',
  'unknown': 'nurture-long',
};

// ============================================================================
// SERVICE
// ============================================================================

class UrgencyDetectorService {
  /**
   * Detect urgency level from text
   */
  detectUrgency(input: UrgencyDetectionInput): UrgencyAnalysis {
    const { text, platform, timestamp, context } = input;

    // Combine text sources
    const fullText = [text, context].filter(Boolean).join(' ');

    // Collect all indicators
    const indicators: UrgencyIndicator[] = [];

    // Check immediate patterns
    for (const { pattern, type, impliedDays, weight } of IMMEDIATE_PATTERNS) {
      const match = fullText.match(pattern);
      if (match) {
        indicators.push({
          type,
          matchedText: match[0],
          weight,
          impliedTimelineDays: impliedDays,
        });
      }
    }

    // Check active patterns
    for (const { pattern, type, impliedDays, weight } of ACTIVE_PATTERNS) {
      const match = fullText.match(pattern);
      if (match) {
        indicators.push({
          type,
          matchedText: match[0],
          weight,
          impliedTimelineDays: impliedDays,
        });
      }
    }

    // Check research patterns
    for (const { pattern, type, impliedDays, weight } of RESEARCH_PATTERNS) {
      const match = fullText.match(pattern);
      if (match) {
        indicators.push({
          type,
          matchedText: match[0],
          weight,
          impliedTimelineDays: impliedDays,
        });
      }
    }

    // Check anti-urgency patterns
    let antiUrgencyPenalty = 0;
    for (const pattern of ANTI_URGENCY_PATTERNS) {
      if (pattern.test(fullText)) {
        antiUrgencyPenalty += 0.2;
      }
    }

    // Calculate base score from indicators
    let baseScore = 0;
    if (indicators.length > 0) {
      // Use highest weight indicator as primary, with diminishing returns for additional
      const sortedIndicators = [...indicators].sort((a, b) => b.weight - a.weight);
      baseScore = sortedIndicators[0].weight;

      for (let i = 1; i < Math.min(sortedIndicators.length, 3); i++) {
        baseScore += sortedIndicators[i].weight * (0.3 / i); // Diminishing bonus
      }
    }

    // Apply anti-urgency penalty
    baseScore = Math.max(0, baseScore - antiUrgencyPenalty);

    // Apply recency bonus (fresh signals more urgent)
    if (timestamp) {
      const recency = recencyCalculatorService.calculateRecency(timestamp);
      if (recency.isPeak) {
        baseScore = Math.min(1, baseScore * 1.1); // 10% boost for fresh signals
      } else if (recency.isStale) {
        baseScore = baseScore * 0.8; // 20% penalty for stale signals
      }
    }

    // Normalize score
    const score = Math.min(1, Math.max(0, baseScore));

    // Determine urgency level
    const level = this.scoreToLevel(score);

    // Calculate estimated timeline
    const estimatedTimeline = this.calculateTimeline(indicators, level);

    // Calculate confidence
    const confidence = this.calculateConfidence(indicators, antiUrgencyPenalty);

    // Generate reasoning
    const reasoning = this.generateReasoning(indicators, level, antiUrgencyPenalty);

    return {
      level,
      score,
      indicators,
      estimatedTimeline,
      confidence,
      reasoning,
      recommendedAction: RECOMMENDED_ACTIONS[level],
    };
  }

  /**
   * Quick check if a signal is high urgency
   */
  isHighUrgency(input: UrgencyDetectionInput): boolean {
    const analysis = this.detectUrgency(input);
    return analysis.level === 'immediate' || analysis.level === 'active';
  }

  /**
   * Get urgency score only (lightweight)
   */
  getUrgencyScore(text: string): number {
    return this.detectUrgency({ text }).score;
  }

  /**
   * Batch analyze multiple signals
   */
  batchDetectUrgency(inputs: UrgencyDetectionInput[]): UrgencyAnalysis[] {
    return inputs.map(input => this.detectUrgency(input));
  }

  /**
   * Filter signals by minimum urgency
   */
  filterByUrgency<T extends { text: string }>(
    signals: T[],
    minLevel: UrgencyLevel
  ): T[] {
    const levelOrder: UrgencyLevel[] = ['immediate', 'active', 'researching', 'browsing', 'unknown'];
    const minIndex = levelOrder.indexOf(minLevel);

    return signals.filter(signal => {
      const analysis = this.detectUrgency({ text: signal.text });
      const signalIndex = levelOrder.indexOf(analysis.level);
      return signalIndex <= minIndex;
    });
  }

  /**
   * Sort signals by urgency (highest first)
   */
  sortByUrgency<T extends { text: string }>(signals: T[]): T[] {
    return [...signals].sort((a, b) => {
      const scoreA = this.getUrgencyScore(a.text);
      const scoreB = this.getUrgencyScore(b.text);
      return scoreB - scoreA;
    });
  }

  /**
   * Get urgency distribution for analytics
   */
  getUrgencyDistribution(
    signals: Array<{ text: string }>
  ): Record<UrgencyLevel, number> {
    const distribution: Record<UrgencyLevel, number> = {
      immediate: 0,
      active: 0,
      researching: 0,
      browsing: 0,
      unknown: 0,
    };

    for (const signal of signals) {
      const analysis = this.detectUrgency({ text: signal.text });
      distribution[analysis.level]++;
    }

    return distribution;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Convert score to urgency level
   */
  private scoreToLevel(score: number): UrgencyLevel {
    if (score >= URGENCY_THRESHOLDS.immediate) return 'immediate';
    if (score >= URGENCY_THRESHOLDS.active) return 'active';
    if (score >= URGENCY_THRESHOLDS.researching) return 'researching';
    if (score > 0) return 'browsing';
    return 'unknown';
  }

  /**
   * Calculate estimated timeline from indicators
   */
  private calculateTimeline(
    indicators: UrgencyIndicator[],
    level: UrgencyLevel
  ): { minDays: number; maxDays: number; label: string } {
    if (indicators.length === 0) {
      return TIMELINE_LABELS[level];
    }

    // Use the most urgent indicator's timeline
    const minImplied = Math.min(
      ...indicators
        .filter(i => i.impliedTimelineDays !== undefined)
        .map(i => i.impliedTimelineDays!)
    );

    if (minImplied === Infinity) {
      return TIMELINE_LABELS[level];
    }

    // Create custom timeline based on detected indicators
    const minDays = Math.max(0, minImplied - 7);
    const maxDays = minImplied + 30;

    let label: string;
    if (minDays <= 7) label = 'Within 1-2 weeks';
    else if (minDays <= 30) label = 'Within 1 month';
    else if (minDays <= 60) label = 'Within 1-2 months';
    else if (minDays <= 90) label = 'Within 3 months';
    else label = '3+ months';

    return { minDays, maxDays, label };
  }

  /**
   * Calculate confidence in the urgency assessment
   */
  private calculateConfidence(
    indicators: UrgencyIndicator[],
    antiUrgencyPenalty: number
  ): number {
    if (indicators.length === 0) {
      return 0.3; // Low confidence with no indicators
    }

    // More indicators = higher confidence (up to a point)
    const indicatorBonus = Math.min(0.3, indicators.length * 0.1);

    // High weight indicators = higher confidence
    const maxWeight = Math.max(...indicators.map(i => i.weight));

    // Anti-urgency patterns reduce confidence
    const confidence = (maxWeight * 0.5) + indicatorBonus - (antiUrgencyPenalty * 0.1);

    return Math.min(1, Math.max(0.2, confidence));
  }

  /**
   * Generate reasoning for the classification
   */
  private generateReasoning(
    indicators: UrgencyIndicator[],
    level: UrgencyLevel,
    antiUrgencyPenalty: number
  ): string {
    const parts: string[] = [];

    if (indicators.length === 0) {
      return `No clear urgency indicators detected. Classified as ${level}.`;
    }

    // Primary indicator
    const primary = indicators.sort((a, b) => b.weight - a.weight)[0];
    parts.push(`Primary signal: "${primary.matchedText}" (${primary.type})`);

    // Additional indicators
    if (indicators.length > 1) {
      parts.push(`+${indicators.length - 1} additional indicator(s)`);
    }

    // Anti-urgency mention
    if (antiUrgencyPenalty > 0) {
      parts.push('Some hesitation language detected');
    }

    // Timeline
    const timeline = this.calculateTimeline(indicators, level);
    parts.push(`Estimated: ${timeline.label}`);

    return parts.join('. ');
  }
}

// Export singleton
export const urgencyDetectorService = new UrgencyDetectorService();

// Export class for testing
export { UrgencyDetectorService };
