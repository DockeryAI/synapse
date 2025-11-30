/**
 * EQ Trend Prioritizer Service
 *
 * Phase 4 of Trends 2.0 Build Plan
 * Applies psychological trigger weights to trend scores.
 * Maps trends to emotional/rational drivers from EQ data.
 *
 * Trigger mapping:
 * - Fear → urgency/risk trends
 * - Desire → opportunity/growth trends
 * - Trust → credibility/proof trends
 *
 * Created: 2025-11-29
 */

import type { CompleteUVP } from '@/types/uvp-flow.types';
import type { ScoredTrend } from './trend-relevance-scorer.service';

// ============================================================================
// TYPES
// ============================================================================

export type PsychologicalTrigger =
  | 'fear'       // Fear of missing out, risks, threats
  | 'desire'     // Growth, opportunity, improvement
  | 'trust'      // Credibility, proof, authority
  | 'urgency'    // Time-sensitive, act now
  | 'curiosity'  // New, surprising, innovative
  | 'social'     // Community, belonging, trends
  | 'practical'; // Efficiency, cost savings, ROI

export interface EQScore {
  emotional: number; // 0-100
  rational: number;  // 0-100
  overall: number;   // 0-100
}

export interface TriggerMatch {
  trigger: PsychologicalTrigger;
  strength: number; // 0-100
  keywords: string[];
}

export interface EQPrioritizedTrend extends ScoredTrend {
  /** EQ-adjusted priority score */
  eqPriority: number;
  /** Primary psychological trigger */
  primaryTrigger: PsychologicalTrigger;
  /** All matched triggers */
  triggers: TriggerMatch[];
  /** Framing recommendation (emotional vs rational) */
  recommendedFraming: 'emotional' | 'rational' | 'balanced';
  /** Why this trend matters */
  whyThisMatters: string;
  /** Suggested content angle */
  contentAngle: string;
}

export interface EQPrioritizerConfig {
  /** Weight for EQ alignment in final score */
  eqWeight: number;
  /** Weight for relevance in final score */
  relevanceWeight: number;
  /** Weight for validation in final score */
  validationWeight: number;
}

// ============================================================================
// TRIGGER KEYWORDS
// ============================================================================

const TRIGGER_KEYWORDS: Record<PsychologicalTrigger, string[]> = {
  fear: [
    'risk', 'threat', 'danger', 'warning', 'crisis', 'problem', 'fail', 'failure',
    'decline', 'loss', 'losing', 'mistake', 'error', 'avoid', 'prevent', 'protect',
    'security', 'breach', 'vulnerable', 'miss', 'missing', 'falling behind',
    'outdated', 'obsolete', 'deadline', 'urgent', 'critical', 'concerned', 'worried'
  ],
  desire: [
    'growth', 'grow', 'opportunity', 'potential', 'improve', 'improvement', 'better',
    'best', 'success', 'successful', 'achieve', 'achievement', 'gain', 'winning',
    'advantage', 'competitive', 'leading', 'leader', 'top', 'premium', 'excellent',
    'outstanding', 'exceptional', 'transform', 'transformation', 'breakthrough',
    'innovation', 'innovative', 'cutting-edge', 'advanced', 'next-generation'
  ],
  trust: [
    'proven', 'reliable', 'trusted', 'trust', 'expert', 'expertise', 'authority',
    'authoritative', 'credible', 'credibility', 'research', 'study', 'data',
    'statistics', 'evidence', 'results', 'case study', 'testimonial', 'review',
    'rated', 'certified', 'accredited', 'award', 'recognized', 'established',
    'verified', 'authentic', 'transparent', 'honest'
  ],
  urgency: [
    'now', 'today', 'immediately', 'urgent', 'hurry', 'limited', 'deadline',
    'soon', 'quickly', 'fast', 'rapid', 'instant', 'breaking', 'latest',
    'new', 'just', 'announced', 'launching', 'ending', 'last chance',
    'don\'t wait', 'act now', 'time-sensitive', 'expires', 'final'
  ],
  curiosity: [
    'new', 'discover', 'secret', 'surprising', 'unexpected', 'revealed',
    'hidden', 'unknown', 'mystery', 'curious', 'interesting', 'fascinating',
    'revolutionary', 'groundbreaking', 'first', 'never before', 'exclusive',
    'insider', 'behind the scenes', 'untold', 'unprecedented', 'shocking'
  ],
  social: [
    'everyone', 'people', 'community', 'trending', 'popular', 'viral',
    'shared', 'following', 'joined', 'together', 'movement', 'industry-wide',
    'peers', 'colleagues', 'competitors', 'others', 'many', 'majority',
    'growing', 'adoption', 'mainstream', 'standard', 'norm', 'common'
  ],
  practical: [
    'save', 'saving', 'cost', 'efficient', 'efficiency', 'roi', 'return',
    'profit', 'revenue', 'productivity', 'time', 'faster', 'easier',
    'simple', 'straightforward', 'practical', 'actionable', 'steps',
    'how to', 'guide', 'template', 'checklist', 'tool', 'solution'
  ]
};

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

const DEFAULT_CONFIG: EQPrioritizerConfig = {
  eqWeight: 0.3,
  relevanceWeight: 0.5,
  validationWeight: 0.2
};

// ============================================================================
// TRIGGER DETECTION
// ============================================================================

/**
 * Detect psychological triggers in trend content
 */
function detectTriggers(trendText: string): TriggerMatch[] {
  const normalizedText = trendText.toLowerCase();
  const triggers: TriggerMatch[] = [];

  (Object.keys(TRIGGER_KEYWORDS) as PsychologicalTrigger[]).forEach(trigger => {
    const keywords = TRIGGER_KEYWORDS[trigger];
    const matchedKeywords: string[] = [];

    keywords.forEach(keyword => {
      if (normalizedText.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
      }
    });

    if (matchedKeywords.length > 0) {
      // Calculate strength based on match count with diminishing returns
      const matchRatio = matchedKeywords.length / keywords.length;
      const strength = Math.min(100, Math.round(matchRatio * 150));

      triggers.push({
        trigger,
        strength,
        keywords: matchedKeywords
      });
    }
  });

  // Sort by strength
  triggers.sort((a, b) => b.strength - a.strength);

  return triggers;
}

/**
 * Get primary trigger from matches
 */
function getPrimaryTrigger(triggers: TriggerMatch[]): PsychologicalTrigger {
  if (triggers.length === 0) return 'practical';
  return triggers[0].trigger;
}

// ============================================================================
// EQ ALIGNMENT
// ============================================================================

/**
 * Calculate EQ alignment score for a trend
 */
function calculateEQAlignment(
  triggers: TriggerMatch[],
  brandEQ: EQScore
): { score: number; framing: 'emotional' | 'rational' | 'balanced' } {
  if (triggers.length === 0) {
    return { score: 50, framing: 'balanced' };
  }

  // Categorize triggers as emotional or rational
  const emotionalTriggers: PsychologicalTrigger[] = ['fear', 'desire', 'curiosity', 'social'];
  const rationalTriggers: PsychologicalTrigger[] = ['trust', 'practical', 'urgency'];

  let emotionalScore = 0;
  let rationalScore = 0;

  triggers.forEach(t => {
    if (emotionalTriggers.includes(t.trigger)) {
      emotionalScore += t.strength;
    } else {
      rationalScore += t.strength;
    }
  });

  // Normalize scores
  const totalScore = emotionalScore + rationalScore;
  if (totalScore === 0) {
    return { score: 50, framing: 'balanced' };
  }

  const emotionalRatio = emotionalScore / totalScore;
  const rationalRatio = rationalScore / totalScore;

  // Calculate alignment with brand EQ
  const brandEmotionalRatio = brandEQ.emotional / 100;
  const brandRationalRatio = brandEQ.rational / 100;

  // Perfect alignment = 100, complete mismatch = 0
  const emotionalAlignment = 1 - Math.abs(emotionalRatio - brandEmotionalRatio);
  const rationalAlignment = 1 - Math.abs(rationalRatio - brandRationalRatio);

  const alignmentScore = Math.round(((emotionalAlignment + rationalAlignment) / 2) * 100);

  // Determine recommended framing
  let framing: 'emotional' | 'rational' | 'balanced';
  if (brandEQ.emotional > brandEQ.rational + 20) {
    framing = 'emotional';
  } else if (brandEQ.rational > brandEQ.emotional + 20) {
    framing = 'rational';
  } else {
    framing = 'balanced';
  }

  return { score: alignmentScore, framing };
}

/**
 * Generate "Why This Matters" explanation
 */
function generateWhyThisMatters(
  trend: ScoredTrend,
  primaryTrigger: PsychologicalTrigger,
  brandEQ: EQScore
): string {
  const templates: Record<PsychologicalTrigger, string> = {
    fear: `This trend highlights risks your customers are concerned about. Address their fears with reassurance and solutions.`,
    desire: `This trend aligns with what your customers aspire to achieve. Position your offering as the path to this outcome.`,
    trust: `This trend emphasizes credibility signals your customers value. Leverage your proof points and expertise.`,
    urgency: `This is a time-sensitive opportunity. Create content that encourages immediate action.`,
    curiosity: `This emerging trend will capture attention. Be among the first to address it in your space.`,
    social: `Your customers are watching what others do. Show how you're part of this movement.`,
    practical: `This trend offers actionable value. Provide practical guidance your customers can implement.`
  };

  return templates[primaryTrigger];
}

/**
 * Generate suggested content angle
 */
function generateContentAngle(
  trend: ScoredTrend,
  primaryTrigger: PsychologicalTrigger,
  framing: 'emotional' | 'rational' | 'balanced'
): string {
  const emotionalAngles: Record<PsychologicalTrigger, string> = {
    fear: `"Don't let [problem] hold you back - here's how we protect our clients"`,
    desire: `"Imagine achieving [outcome] - our clients are already there"`,
    trust: `"Why leading [industry] professionals trust us for [topic]"`,
    urgency: `"The window is closing - take action on [trend] today"`,
    curiosity: `"The surprising truth about [trend] that changes everything"`,
    social: `"Join the [number]+ businesses already embracing [trend]"`,
    practical: `"The simple shift that's transforming [industry]"`
  };

  const rationalAngles: Record<PsychologicalTrigger, string> = {
    fear: `"Risk analysis: What [trend] means for your business"`,
    desire: `"ROI breakdown: How [trend] drives measurable results"`,
    trust: `"Data-backed insights on [trend] from industry research"`,
    urgency: `"Timeline: Key dates and deadlines for [trend]"`,
    curiosity: `"Deep dive: Understanding the mechanics of [trend]"`,
    social: `"Industry report: [trend] adoption rates and benchmarks"`,
    practical: `"Step-by-step guide: Implementing [trend] effectively"`
  };

  if (framing === 'emotional') {
    return emotionalAngles[primaryTrigger];
  } else if (framing === 'rational') {
    return rationalAngles[primaryTrigger];
  } else {
    // Balanced: combine elements
    return `"[Trend]: What the data shows and why it matters for your [outcome]"`;
  }
}

// ============================================================================
// MAIN PRIORITIZATION FUNCTION
// ============================================================================

/**
 * Prioritize trends based on EQ alignment
 */
export function prioritizeTrends(
  trends: ScoredTrend[],
  uvp: CompleteUVP,
  config: Partial<EQPrioritizerConfig> = {}
): EQPrioritizedTrend[] {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // Get brand EQ from transformation goal
  const brandEQ: EQScore = uvp.transformationGoal?.eqScore || {
    emotional: 50,
    rational: 50,
    overall: 50
  };

  console.log(`[EQTrendPrioritizer] Prioritizing ${trends.length} trends with brand EQ:`, brandEQ);

  const prioritizedTrends: EQPrioritizedTrend[] = trends.map(trend => {
    const trendText = `${trend.title} ${trend.description}`;

    // Detect psychological triggers
    const triggers = detectTriggers(trendText);
    const primaryTrigger = getPrimaryTrigger(triggers);

    // Calculate EQ alignment
    const { score: eqAlignmentScore, framing } = calculateEQAlignment(triggers, brandEQ);

    // Calculate final priority score
    const eqPriority = Math.round(
      (trend.relevance.overall * cfg.relevanceWeight) +
      (trend.validationScore * cfg.validationWeight) +
      (eqAlignmentScore * cfg.eqWeight)
    );

    // Generate content guidance
    const whyThisMatters = generateWhyThisMatters(trend, primaryTrigger, brandEQ);
    const contentAngle = generateContentAngle(trend, primaryTrigger, framing);

    return {
      ...trend,
      eqPriority,
      primaryTrigger,
      triggers,
      recommendedFraming: framing,
      whyThisMatters,
      contentAngle
    };
  });

  // Sort by EQ priority
  prioritizedTrends.sort((a, b) => b.eqPriority - a.eqPriority);

  console.log(`[EQTrendPrioritizer] Top triggers:`,
    prioritizedTrends.slice(0, 5).map(t => t.primaryTrigger)
  );

  return prioritizedTrends;
}

/**
 * Get trends by trigger type
 */
export function getTrendsByTrigger(
  trends: EQPrioritizedTrend[],
  trigger: PsychologicalTrigger
): EQPrioritizedTrend[] {
  return trends.filter(t => t.primaryTrigger === trigger);
}

/**
 * Get trigger distribution statistics
 */
export function getTriggerStats(trends: EQPrioritizedTrend[]): Record<PsychologicalTrigger, number> {
  const stats: Record<PsychologicalTrigger, number> = {
    fear: 0,
    desire: 0,
    trust: 0,
    urgency: 0,
    curiosity: 0,
    social: 0,
    practical: 0
  };

  trends.forEach(t => {
    stats[t.primaryTrigger]++;
  });

  return stats;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const EQTrendPrioritizer = {
  prioritize: prioritizeTrends,
  getByTrigger: getTrendsByTrigger,
  getTriggerStats,
  detectTriggers,
  DEFAULT_CONFIG,
  TRIGGER_KEYWORDS
};

export default EQTrendPrioritizer;
