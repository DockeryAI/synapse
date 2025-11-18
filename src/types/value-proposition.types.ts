/**
 * Value Proposition Type System
 *
 * Defines the 4-layer value proposition framework with emotional intelligence scoring.
 * This system goes beyond surface-level benefits to capture deep psychological resonance.
 *
 * Four Layers:
 * 1. Surface - What they literally sell (features, products)
 * 2. Functional - What it actually does (outcomes, results)
 * 3. Emotional - How it makes customers feel (emotions, states)
 * 4. Identity - Who they become / what tribe they join (transformation, belonging)
 *
 * Example: A gym
 * - Surface: "Fitness equipment and classes"
 * - Functional: "Lose 20 pounds in 3 months"
 * - Emotional: "Feel confident, energized, and proud"
 * - Identity: "Join the fit parent community who shows up for themselves"
 */

// =====================================================
// Core Value Proposition Types
// =====================================================

/**
 * The four layers of value proposition depth
 * Each layer goes deeper into customer psychology
 */
export interface ValuePropositionLayers {
  /** What they literally sell - features, products, services */
  surface: string;

  /** What it actually does - tangible outcomes and results */
  functional: string;

  /** How it makes them feel - emotional states and feelings */
  emotional: string;

  /** Who they become - identity transformation and belonging */
  identity: string;
}

/**
 * Complete value proposition with metadata and scoring
 */
export interface ValueProposition extends ValuePropositionLayers {
  /** Unique identifier */
  id?: string;

  /** Associated brand ID */
  brand_id?: string;

  /** Overall emotional resonance score (0-100) */
  eq_score: number;

  /** Detailed breakdown of EQ components */
  eq_breakdown: EQScore;

  /** Optional: Which customer segment this targets */
  target_persona?: string;

  /** Optional: Context where this will be used */
  context?: ValuePropositionContext;

  /** Optional: Evidence or proof points supporting this VP */
  evidence?: ValuePropositionEvidence[];

  /** When this was generated/last updated */
  created_at?: string;
  updated_at?: string;
}

/**
 * Contexts where value propositions are deployed
 */
export type ValuePropositionContext =
  | 'homepage_hero'
  | 'about_page'
  | 'product_page'
  | 'landing_page'
  | 'ad_campaign'
  | 'email_campaign'
  | 'social_media'
  | 'sales_pitch'
  | 'proposal'
  | 'presentation';

/**
 * Evidence supporting value proposition claims
 */
export interface ValuePropositionEvidence {
  /** Type of evidence */
  type: 'testimonial' | 'case_study' | 'statistic' | 'certification' | 'award' | 'review' | 'social_proof';

  /** The actual evidence statement */
  statement: string;

  /** Where this evidence came from */
  source: string;

  /** Optional: Specific metric or data point */
  metric?: {
    value: number | string;
    unit?: string;
    context?: string;
  };

  /** Which layer this evidence supports most strongly */
  supports_layer: 'surface' | 'functional' | 'emotional' | 'identity';
}

// =====================================================
// EQ Score Types (Emotional Intelligence Scoring)
// =====================================================

/**
 * Emotional Intelligence Score - measures psychological resonance
 * Scale: 0-100 for each component
 */
export interface EQScore {
  /** How emotionally resonant is the message? (0-100) */
  emotional_resonance: number;

  /** How urgent is the need/desire? (0-100) */
  urgency: number;

  /** How aligned with customer identity? (0-100) */
  identity_alignment: number;

  /** Composite score (weighted average of above) */
  composite: number;

  /** Optional: Detailed breakdown by layer */
  layer_scores?: {
    surface_score: number;
    functional_score: number;
    emotional_score: number;
    identity_score: number;
  };

  /** Optional: AI reasoning for the scores */
  reasoning?: EQScoreReasoning;
}

/**
 * AI-generated reasoning for EQ scores
 */
export interface EQScoreReasoning {
  /** Why the emotional resonance score was given */
  emotional_resonance_reason: string;

  /** Why the urgency score was given */
  urgency_reason: string;

  /** Why the identity alignment score was given */
  identity_alignment_reason: string;

  /** Overall assessment */
  overall_assessment: string;

  /** Suggestions for improvement */
  improvement_suggestions?: string[];
}

/**
 * Scoring algorithm configuration
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
}

/**
 * Default EQ scoring configuration
 * These weights determine the composite score calculation
 */
export const DEFAULT_EQ_SCORING_CONFIG: EQScoringConfig = {
  emotional_weight: 0.4,  // 40% - most important
  urgency_weight: 0.3,     // 30% - creates action
  identity_weight: 0.3,    // 30% - creates belonging
  min_acceptable_score: 60,
  target_score: 80,
};

// =====================================================
// Scoring Algorithm Functions
// =====================================================

/**
 * Calculate composite EQ score from component scores
 * Uses weighted average based on configuration
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
 * Determine quality tier based on composite score
 */
export function getEQScoreTier(score: number): EQScoreTier {
  if (score >= 90) return 'exceptional';
  if (score >= 80) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 60) return 'acceptable';
  if (score >= 50) return 'needs_work';
  return 'poor';
}

export type EQScoreTier =
  | 'exceptional'  // 90-100: Top 10% psychological resonance
  | 'excellent'    // 80-89: Strong emotional connection
  | 'good'         // 70-79: Solid value proposition
  | 'acceptable'   // 60-69: Functional but could improve
  | 'needs_work'   // 50-59: Weak psychological hooks
  | 'poor';        // 0-49: Surface-level only

/**
 * Get color coding for EQ score tier (for UI)
 */
export function getEQScoreColor(tier: EQScoreTier): string {
  const colors: Record<EQScoreTier, string> = {
    exceptional: '#10b981', // green-500
    excellent: '#84cc16',   // lime-500
    good: '#eab308',        // yellow-500
    acceptable: '#f59e0b',  // amber-500
    needs_work: '#f97316', // orange-500
    poor: '#ef4444',       // red-500
  };
  return colors[tier];
}

// =====================================================
// Value Proposition Analysis Types
// =====================================================

/**
 * Analysis of how well each layer is developed
 */
export interface ValuePropositionLayerAnalysis {
  layer: keyof ValuePropositionLayers;
  strength: 'strong' | 'moderate' | 'weak';
  score: number; // 0-100
  issues?: string[];
  suggestions?: string[];
}

/**
 * Complete value proposition analysis
 */
export interface ValuePropositionAnalysis {
  /** Overall assessment */
  overall_assessment: string;

  /** Individual layer analyses */
  layer_analyses: ValuePropositionLayerAnalysis[];

  /** What's working well */
  strengths: string[];

  /** What needs improvement */
  weaknesses: string[];

  /** Specific actionable recommendations */
  recommendations: string[];

  /** Competitive positioning insights */
  competitive_insights?: string[];

  /** Analyzed at timestamp */
  analyzed_at: string;
}

// =====================================================
// Value Proposition Generation Types
// =====================================================

/**
 * Input data for generating value propositions
 */
export interface ValuePropositionGenerationInput {
  /** Business/brand information */
  business_name: string;
  industry: string;
  specialty?: string;

  /** Products/services offered */
  offerings: string[];

  /** Target customer information */
  target_audience?: string;
  customer_pain_points?: string[];
  customer_desires?: string[];

  /** Competitive context */
  competitors?: string[];
  differentiators?: string[];

  /** Evidence and proof */
  testimonials?: string[];
  results?: string[];

  /** Brand voice preferences */
  brand_voice?: {
    tone: string[];
    personality: string;
    avoid?: string[];
  };
}

/**
 * Result from value proposition generation
 */
export interface ValuePropositionGenerationResult {
  /** Generated value proposition */
  value_proposition: ValueProposition;

  /** Alternative variations */
  alternatives?: ValueProposition[];

  /** AI reasoning for the generation */
  generation_reasoning?: string;

  /** Warnings or notes */
  warnings?: string[];
}

// =====================================================
// Helper Types
// =====================================================

/**
 * Value proposition comparison result
 */
export interface ValuePropositionComparison {
  vp_a: ValueProposition;
  vp_b: ValueProposition;

  /** Which is stronger overall */
  winner: 'a' | 'b' | 'tie';

  /** Comparison by layer */
  layer_comparison: {
    layer: keyof ValuePropositionLayers;
    stronger: 'a' | 'b' | 'tie';
    reason: string;
  }[];

  /** EQ score difference */
  eq_score_difference: number;

  /** Summary of differences */
  summary: string;
}

/**
 * Value proposition test result (A/B testing)
 */
export interface ValuePropositionTestResult {
  vp_id: string;
  variant_name: string;

  /** Performance metrics */
  impressions: number;
  clicks?: number;
  conversions?: number;

  /** Calculated rates */
  ctr?: number; // Click-through rate
  cvr?: number; // Conversion rate

  /** Statistical significance */
  confidence_level?: number; // 0-100

  /** Time period */
  start_date: string;
  end_date?: string;
}
