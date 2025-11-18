/**
 * EQ Score Type System (Emotional Intelligence Scoring)
 *
 * Measures the psychological resonance and emotional impact of content, messaging,
 * and value propositions. Unlike traditional metrics (clicks, impressions), EQ scores
 * measure how deeply content connects with human psychology.
 *
 * Three Core Dimensions:
 * 1. Emotional Resonance - How emotionally compelling is the message?
 * 2. Urgency - How immediate is the need/desire being addressed?
 * 3. Identity Alignment - How well does this align with who they want to be?
 *
 * Scale: 0-100 for all scores
 * - 90-100: Exceptional psychological connection
 * - 80-89: Strong emotional resonance
 * - 70-79: Good messaging
 * - 60-69: Acceptable but functional
 * - 50-59: Weak, surface-level only
 * - 0-49: Poor, no psychological hooks
 */

// =====================================================
// Core EQ Score Interface
// =====================================================

/**
 * Emotional Intelligence Score
 * Measures psychological resonance across three dimensions
 */
export interface EQScore {
  /** How emotionally resonant is the message? (0-100) */
  emotional_resonance: number;

  /** How urgent is the need/desire? (0-100) */
  urgency: number;

  /** How aligned with customer identity? (0-100) */
  identity_alignment: number;

  /** Composite score (weighted average) */
  composite: number;

  /** When this score was calculated */
  scored_at?: string;

  /** Optional: Confidence in the score (0-100) */
  confidence?: number;
}

/**
 * Extended EQ score with detailed breakdowns and reasoning
 */
export interface ExtendedEQScore extends EQScore {
  /** Detailed component scores */
  components?: EQScoreComponents;

  /** AI-generated reasoning */
  reasoning?: EQScoreReasoning;

  /** Quality tier classification */
  tier?: EQScoreTier;

  /** Percentile ranking (if benchmarks available) */
  percentile?: number;
}

/**
 * Granular component scores for deeper analysis
 */
export interface EQScoreComponents {
  // Emotional Resonance breakdown
  emotional: {
    positive_emotions: number;   // Joy, pride, hope, relief
    negative_emotions: number;   // Fear, frustration, anxiety (used strategically)
    aspiration: number;          // Dreams, desires, "better life"
    empathy: number;             // Understanding their struggles
  };

  // Urgency breakdown
  urgency: {
    time_sensitivity: number;    // "Now" vs "someday"
    pain_intensity: number;      // How bad is the problem?
    opportunity_cost: number;    // What are they missing?
    scarcity: number;           // Limited availability/time
  };

  // Identity Alignment breakdown
  identity: {
    tribe_belonging: number;     // Part of a group/community
    self_image: number;          // Who they see themselves as
    values_alignment: number;    // Shared principles
    transformation: number;      // Who they become
  };
}

/**
 * AI reasoning for EQ scores
 */
export interface EQScoreReasoning {
  /** Why emotional_resonance score was assigned */
  emotional_resonance_reason: string;

  /** Why urgency score was assigned */
  urgency_reason: string;

  /** Why identity_alignment score was assigned */
  identity_alignment_reason: string;

  /** Overall psychological assessment */
  overall_assessment: string;

  /** What's working well psychologically */
  psychological_strengths?: string[];

  /** What could be improved */
  psychological_weaknesses?: string[];

  /** Specific recommendations to increase EQ score */
  improvement_suggestions?: string[];

  /** Predicted emotional response from target audience */
  predicted_emotional_response?: string;
}

// =====================================================
// Scoring Configuration
// =====================================================

/**
 * Configuration for EQ score calculation
 */
export interface EQScoringConfig {
  /** Weight for emotional resonance (default: 0.4) */
  emotional_weight: number;

  /** Weight for urgency (default: 0.3) */
  urgency_weight: number;

  /** Weight for identity alignment (default: 0.3) */
  identity_weight: number;

  /** Minimum acceptable composite score */
  min_acceptable_score: number;

  /** Target excellence score */
  target_score: number;

  /** Optional: Industry-specific adjustments */
  industry_modifiers?: IndustryEQModifiers;
}

/**
 * Industry-specific scoring adjustments
 * Some industries prioritize different dimensions
 */
export interface IndustryEQModifiers {
  industry: string;

  /** Adjust weights for this industry */
  weight_adjustments: {
    emotional_weight: number;
    urgency_weight: number;
    identity_weight: number;
  };

  /** Industry-specific benchmarks */
  benchmarks?: {
    low: number;
    average: number;
    high: number;
    exceptional: number;
  };
}

/**
 * Default EQ scoring configuration
 */
export const DEFAULT_EQ_SCORING_CONFIG: EQScoringConfig = {
  emotional_weight: 0.4,    // 40% - emotional connection is primary
  urgency_weight: 0.3,      // 30% - urgency drives action
  identity_weight: 0.3,     // 30% - identity creates loyalty
  min_acceptable_score: 60,
  target_score: 80,
};

/**
 * Industry-specific scoring presets
 */
export const INDUSTRY_EQ_PRESETS: Record<string, IndustryEQModifiers> = {
  healthcare: {
    industry: 'healthcare',
    weight_adjustments: {
      emotional_weight: 0.35,
      urgency_weight: 0.40,  // Healthcare is often urgent
      identity_weight: 0.25,
    },
    benchmarks: { low: 65, average: 75, high: 85, exceptional: 92 },
  },
  luxury: {
    industry: 'luxury',
    weight_adjustments: {
      emotional_weight: 0.30,
      urgency_weight: 0.20,  // Luxury is rarely urgent
      identity_weight: 0.50, // Identity is everything in luxury
    },
    benchmarks: { low: 70, average: 80, high: 88, exceptional: 95 },
  },
  saas: {
    industry: 'saas',
    weight_adjustments: {
      emotional_weight: 0.35,
      urgency_weight: 0.35,
      identity_weight: 0.30,
    },
    benchmarks: { low: 60, average: 72, high: 82, exceptional: 90 },
  },
  ecommerce: {
    industry: 'ecommerce',
    weight_adjustments: {
      emotional_weight: 0.40,
      urgency_weight: 0.35,
      identity_weight: 0.25,
    },
    benchmarks: { low: 58, average: 70, high: 80, exceptional: 88 },
  },
};

// =====================================================
// Scoring Tiers & Classification
// =====================================================

/**
 * Quality tiers based on composite EQ score
 */
export type EQScoreTier =
  | 'exceptional'  // 90-100: Top 10% psychological resonance
  | 'excellent'    // 80-89: Strong emotional connection
  | 'good'         // 70-79: Solid messaging
  | 'acceptable'   // 60-69: Functional but improvable
  | 'needs_work'   // 50-59: Weak psychological hooks
  | 'poor';        // 0-49: Surface-level only, no depth

/**
 * Tier configuration with thresholds
 */
export interface EQScoreTierConfig {
  tier: EQScoreTier;
  min_score: number;
  max_score: number;
  label: string;
  description: string;
  color: string; // Hex color for UI
  icon?: string; // Optional emoji/icon
}

/**
 * Standard tier configurations
 */
export const EQ_SCORE_TIERS: EQScoreTierConfig[] = [
  {
    tier: 'exceptional',
    min_score: 90,
    max_score: 100,
    label: 'Exceptional',
    description: 'Top 10% psychological resonance - deeply emotionally compelling',
    color: '#10b981', // green-500
    icon: '🌟',
  },
  {
    tier: 'excellent',
    min_score: 80,
    max_score: 89,
    label: 'Excellent',
    description: 'Strong emotional connection with clear identity transformation',
    color: '#84cc16', // lime-500
    icon: '⭐',
  },
  {
    tier: 'good',
    min_score: 70,
    max_score: 79,
    label: 'Good',
    description: 'Solid messaging with decent psychological hooks',
    color: '#eab308', // yellow-500
    icon: '✓',
  },
  {
    tier: 'acceptable',
    min_score: 60,
    max_score: 69,
    label: 'Acceptable',
    description: 'Functional but could use stronger emotional elements',
    color: '#f59e0b', // amber-500
    icon: '~',
  },
  {
    tier: 'needs_work',
    min_score: 50,
    max_score: 59,
    label: 'Needs Work',
    description: 'Weak psychological connection - too surface-level',
    color: '#f97316', // orange-500
    icon: '⚠',
  },
  {
    tier: 'poor',
    min_score: 0,
    max_score: 49,
    label: 'Poor',
    description: 'No psychological depth - features only, no transformation',
    color: '#ef4444', // red-500
    icon: '✗',
  },
];

// =====================================================
// Scoring Algorithm Functions
// =====================================================

/**
 * Calculate composite EQ score from component scores
 */
export function calculateCompositeEQScore(
  scores: Pick<EQScore, 'emotional_resonance' | 'urgency' | 'identity_alignment'>,
  config: EQScoringConfig = DEFAULT_EQ_SCORING_CONFIG
): number {
  const composite =
    scores.emotional_resonance * config.emotional_weight +
    scores.urgency * config.urgency_weight +
    scores.identity_alignment * config.identity_weight;

  // Round to 1 decimal place
  return Math.round(composite * 10) / 10;
}

/**
 * Determine quality tier from composite score
 */
export function getEQScoreTier(score: number): EQScoreTier {
  if (score >= 90) return 'exceptional';
  if (score >= 80) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 60) return 'acceptable';
  if (score >= 50) return 'needs_work';
  return 'poor';
}

/**
 * Get tier configuration for a score
 */
export function getEQScoreTierConfig(score: number): EQScoreTierConfig {
  const tier = getEQScoreTier(score);
  return EQ_SCORE_TIERS.find((t) => t.tier === tier) || EQ_SCORE_TIERS[EQ_SCORE_TIERS.length - 1];
}

/**
 * Get color for EQ score tier (for UI)
 */
export function getEQScoreColor(tier: EQScoreTier): string {
  const config = EQ_SCORE_TIERS.find((t) => t.tier === tier);
  return config?.color || '#6b7280'; // gray-500 default
}

/**
 * Calculate percentile ranking based on benchmark data
 */
export function calculateEQPercentile(score: number, benchmarks: number[]): number {
  if (benchmarks.length === 0) return 50; // Default to median

  const sorted = [...benchmarks].sort((a, b) => a - b);
  const lowerCount = sorted.filter((s) => s < score).length;
  const percentile = (lowerCount / sorted.length) * 100;

  return Math.round(percentile);
}

/**
 * Validate EQ score values
 */
export function validateEQScore(score: Partial<EQScore>): string[] {
  const errors: string[] = [];

  if (score.emotional_resonance !== undefined) {
    if (score.emotional_resonance < 0 || score.emotional_resonance > 100) {
      errors.push('emotional_resonance must be between 0 and 100');
    }
  }

  if (score.urgency !== undefined) {
    if (score.urgency < 0 || score.urgency > 100) {
      errors.push('urgency must be between 0 and 100');
    }
  }

  if (score.identity_alignment !== undefined) {
    if (score.identity_alignment < 0 || score.identity_alignment > 100) {
      errors.push('identity_alignment must be between 0 and 100');
    }
  }

  if (score.composite !== undefined) {
    if (score.composite < 0 || score.composite > 100) {
      errors.push('composite must be between 0 and 100');
    }
  }

  return errors;
}

// =====================================================
// Comparison & Analysis Types
// =====================================================

/**
 * Comparison between two EQ scores
 */
export interface EQScoreComparison {
  score_a: EQScore;
  score_b: EQScore;

  /** Which score is higher overall */
  winner: 'a' | 'b' | 'tie';

  /** Differences in each dimension */
  differences: {
    emotional_resonance_diff: number;
    urgency_diff: number;
    identity_alignment_diff: number;
    composite_diff: number;
  };

  /** Which dimensions are stronger in each */
  stronger_dimensions: {
    a: ('emotional_resonance' | 'urgency' | 'identity_alignment')[];
    b: ('emotional_resonance' | 'urgency' | 'identity_alignment')[];
  };

  /** Recommendation */
  recommendation: string;
}

/**
 * Historical EQ score tracking
 */
export interface EQScoreHistory {
  entity_id: string; // ID of the content/VP being scored
  entity_type: 'value_proposition' | 'campaign' | 'content' | 'ad';

  /** Scores over time */
  scores: Array<{
    score: EQScore;
    timestamp: string;
    version?: string;
    notes?: string;
  }>;

  /** Trend analysis */
  trend?: 'improving' | 'declining' | 'stable';
  trend_percentage?: number; // % change over time period
}

/**
 * Benchmark comparison
 */
export interface EQScoreBenchmark {
  industry: string;
  entity_type: 'value_proposition' | 'campaign' | 'content';

  /** Statistical benchmarks */
  benchmarks: {
    min: number;
    p25: number;   // 25th percentile
    median: number;
    p75: number;   // 75th percentile
    max: number;
    mean: number;
  };

  /** Sample size */
  sample_size: number;

  /** Last updated */
  updated_at: string;
}
