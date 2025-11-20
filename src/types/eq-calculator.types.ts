/**
 * EQ Calculator v2.0 Type Definitions
 *
 * Three-layer emotional intelligence calculation system:
 * - Layer 1: Specialty Context (50% weight)
 * - Layer 2: Pattern Recognition (35% weight)
 * - Layer 3: Content Analysis (15% weight)
 *
 * Created: 2025-11-19
 */

// ============================================================================
// Core EQ Score Types
// ============================================================================

export interface EQScore {
  emotional: number;      // 0-100 emotional quotient
  rational: number;       // 0-100 rational quotient
  overall: number;        // 0-100 combined score
  confidence: number;     // 0-100 confidence in calculation
  calculation_method: 'specialty_based' | 'pattern_based' | 'content_only' | 'hybrid';
}

export interface EQBreakdown {
  score: EQScore;
  layer_contributions: {
    specialty_context: LayerContribution;
    pattern_recognition: LayerContribution;
    content_analysis: LayerContribution;
  };
  detected_signals: DetectedSignals;
  calculation_timestamp: string;
}

export interface LayerContribution {
  score: number;          // The EQ this layer calculated
  weight: number;         // Weight applied (0-1)
  contribution: number;   // Final contribution to overall score
  confidence: number;     // Confidence in this layer's calculation
}

// ============================================================================
// Pattern Recognition Types
// ============================================================================

export interface DetectedSignals {
  emotional_indicators: EmotionalIndicator[];
  rational_indicators: RationalIndicator[];
  decision_complexity: DecisionComplexity;
  price_transparency: PriceTransparency;
  community_signals: CommunitySignals;
  passion_signals: PassionSignals;
}

export interface EmotionalIndicator {
  keyword: string;
  context: string;         // Surrounding text
  proximity_to_product: 'high' | 'medium' | 'low';  // How close to product/service mentions
  weight_multiplier: number;  // 0.5x to 3x based on context
  source: 'testimonial' | 'content' | 'about' | 'service-page' | 'other';
}

export interface RationalIndicator {
  keyword: string;
  context: string;
  emphasis: 'strong' | 'moderate' | 'weak';  // How prominently featured
  weight_multiplier: number;
  source: 'pricing' | 'features' | 'comparison' | 'roi' | 'other';
}

export interface DecisionComplexity {
  complexity_level: 'simple' | 'moderate' | 'complex' | 'very-complex';
  signals: string[];       // What we detected (e.g., "consultation", "custom quote")
  eq_adjustment: number;   // +/- points to EQ score
}

export interface PriceTransparency {
  transparency_level: 'fully-transparent' | 'partially-transparent' | 'opaque' | 'contact-only';
  signals: string[];       // What we detected
  eq_adjustment: number;   // +/- points to EQ score
}

export interface CommunitySignals {
  has_community: boolean;
  signals: string[];       // "forum", "club", "enthusiasts", etc.
  strength: 'strong' | 'moderate' | 'weak';
  eq_boost: number;        // +0 to +20 points
}

export interface PassionSignals {
  has_passion_indicators: boolean;
  signals: string[];       // "heritage", "craft", "collection", etc.
  strength: 'strong' | 'moderate' | 'weak';
  eq_boost: number;        // +0 to +20 points
}

// ============================================================================
// Specialty Context Types
// ============================================================================

export interface SpecialtyContext {
  specialty: string;
  base_eq: number;         // Known baseline EQ for this specialty
  is_known: boolean;       // Is this in our database?
  is_passion_product: boolean;  // High emotional attachment?
  confidence: number;      // How confident are we in specialty detection?
  similar_specialties?: string[];  // Nearest known specialties (if unknown)
}

export interface SpecialtyEQMapping {
  specialty: string;
  base_eq: number;
  is_passion_product: boolean;
  sample_size: number;     // How many businesses we've learned from
  last_updated: string;
  examples: string[];      // Example business names
}

// ============================================================================
// Pattern Recognition Types
// ============================================================================

export interface PatternSignature {
  id: string;
  pattern_type: 'passion' | 'rational' | 'community' | 'hybrid';
  detected_keywords: string[];
  keyword_density: {
    emotional: number;     // Emotional keywords per 100 words
    rational: number;      // Rational keywords per 100 words
  };
  structural_signals: {
    has_testimonials: boolean;
    has_forums: boolean;
    has_pricing_tables: boolean;
    has_comparison_charts: boolean;
    has_contact_only_pricing: boolean;
  };
  calculated_eq: number;
  confidence: number;
  created_at: string;
}

export interface PatternMatch {
  matched_pattern: PatternSignature;
  similarity_score: number;  // 0-100 how similar to this pattern
  eq_estimate: number;       // EQ based on this pattern match
}

// ============================================================================
// Learning System Types
// ============================================================================

export interface LearningRecord {
  id: string;
  business_name: string;
  specialty?: string;
  website_url: string;
  calculated_eq: EQScore;
  pattern_signature: PatternSignature;
  created_at: string;
  validated?: boolean;       // Human validated?
  validation_eq?: number;    // What human said EQ should be
}

export interface SpecialtyCluster {
  cluster_id: string;
  specialty_names: string[];
  average_eq: number;
  pattern_characteristics: {
    avg_emotional_density: number;
    avg_rational_density: number;
    common_signals: string[];
  };
  sample_size: number;
  confidence: number;
}

// ============================================================================
// Content Analysis Types
// ============================================================================

export interface ContentAnalysis {
  emotional_keywords: {
    keyword: string;
    count: number;
    contexts: string[];
  }[];
  rational_keywords: {
    keyword: string;
    count: number;
    contexts: string[];
  }[];
  total_words: number;
  emotional_density: number;   // Emotional keywords per 100 words
  rational_density: number;    // Rational keywords per 100 words
  proximity_weighted_score: number;  // Weighted by proximity to products
}

// ============================================================================
// Platform & Seasonal Adjustment Types
// ============================================================================

export type Platform =
  | 'linkedin'
  | 'instagram'
  | 'facebook'
  | 'twitter'
  | 'tiktok'
  | 'email'
  | 'blog'
  | 'website';

export interface PlatformAdjustment {
  platform: Platform;
  eq_modifier: number;         // +/- points
  reason: string;              // Why this adjustment
}

export interface SeasonalAdjustment {
  season: 'holiday' | 'tax-season' | 'back-to-school' | 'q4-planning' | 'summer' | 'custom';
  eq_modifier: number;
  active_dates?: {
    start: string;             // ISO date
    end: string;
  };
  reason: string;
}

export interface EQAdjustmentContext {
  base_eq: EQScore;
  platform?: Platform;
  seasonal?: SeasonalAdjustment;
  campaign_type?: 'brand-awareness' | 'direct-response' | 'nurture' | 'retention';
  adjusted_eq: EQScore;
  adjustments_applied: string[];
}

// ============================================================================
// Calculation Input/Output Types
// ============================================================================

export interface EQCalculationInput {
  business_name: string;
  website_content: string[];   // Content from different pages
  website_urls?: string[];     // URLs for each content piece
  specialty?: string;          // Pre-detected specialty (optional)
  industry?: string;           // Broader industry (optional)
  force_recalculate?: boolean; // Skip cache
}

export interface EQCalculationResult {
  eq_score: EQScore;
  breakdown: EQBreakdown;
  specialty_context?: SpecialtyContext;
  pattern_matches: PatternMatch[];
  content_analysis: ContentAnalysis;
  recommendations: EQRecommendation[];
  cached: boolean;             // Was this from cache?
  calculation_id: string;      // For tracking/debugging
}

export interface EQRecommendation {
  type: 'tone' | 'messaging' | 'platform' | 'seasonal' | 'competitive';
  recommendation: string;
  reason: string;
  rationale?: string;
  impact: 'high' | 'medium' | 'low';
  suggested_eq_adjustment?: number;
}

// ============================================================================
// Performance Tracking Types
// ============================================================================

export interface EQPerformanceMetric {
  business_id: string;
  campaign_id: string;
  content_type: string;
  platform: Platform;
  content_eq: number;          // EQ of the content
  target_eq: number;           // Optimal EQ for this audience
  eq_variance: number;         // Difference from optimal
  engagement_rate: number;
  conversion_rate: number;
  created_at: string;
}

export interface EQCohortAnalysis {
  eq_range: {
    min: number;
    max: number;
  };
  sample_size: number;
  avg_engagement_rate: number;
  avg_conversion_rate: number;
  performance_vs_baseline: number;  // % better/worse than average
}

// ============================================================================
// Validation & Testing Types
// ============================================================================

export interface EQValidationCase {
  business_name: string;
  specialty: string;
  expected_eq: number;
  expected_range: {
    min: number;
    max: number;
  };
  rationale: string;
}

export interface EQCalculationTest {
  test_name: string;
  input: EQCalculationInput;
  expected: EQValidationCase;
  actual: EQCalculationResult;
  passed: boolean;
  variance: number;
  notes?: string;
}

// ============================================================================
// Constants & Defaults
// ============================================================================

export const EQ_WEIGHTS = {
  SPECIALTY_CONTEXT: 0.5,
  PATTERN_RECOGNITION: 0.35,
  CONTENT_ANALYSIS: 0.15,

  // When specialty unknown
  INDUSTRY_BASE: 0.3,
  PATTERN_UNKNOWN: 0.5,
  CONTENT_UNKNOWN: 0.2
} as const;

export const PLATFORM_MODIFIERS: Record<Platform, number> = {
  'linkedin': -20,
  'instagram': 15,
  'facebook': 10,
  'twitter': 5,
  'tiktok': 25,
  'email': 0,
  'blog': 5,
  'website': 0
};

export const SEASONAL_MODIFIERS = {
  'holiday': 15,
  'tax-season': -10,
  'back-to-school': 5,
  'q4-planning': -15,
  'summer': 10
} as const;

export const EQ_THRESHOLDS = {
  VERY_HIGH: 70,
  HIGH: 55,
  MEDIUM: 40,
  LOW: 25
} as const;

export const CONFIDENCE_THRESHOLDS = {
  HIGH: 80,
  MEDIUM: 60,
  LOW: 40
} as const;

// ============================================================================
// Keyword Dictionaries (Pattern Recognition)
// ============================================================================

export const EMOTIONAL_KEYWORDS = [
  'feel', 'confident', 'peace of mind', 'stress', 'worry', 'relief',
  'frustrated', 'overwhelmed', 'excited', 'proud', 'anxious', 'scared',
  'dream', 'passion', 'love', 'hate', 'trust', 'believe',
  'heritage', 'legacy', 'tradition', 'craft', 'artisan', 'bespoke',
  'collection', 'enthusiast', 'connoisseur', 'aficionado',
  'community', 'family', 'belonging', 'connection', 'relationship',
  'journey', 'transformation', 'empowerment', 'freedom', 'control'
] as const;

export const RATIONAL_KEYWORDS = [
  'roi', 'return on investment', 'efficiency', 'productivity', 'savings',
  'reduce', 'increase', 'improve', 'optimize', 'streamline',
  'faster', 'quicker', 'automated', 'instant', 'immediate',
  'cost', 'price', 'budget', 'affordable', 'value',
  'revenue', 'profit', 'growth', 'scale', 'expansion',
  'compliance', 'regulation', 'requirement', 'standard', 'certified',
  'data', 'metrics', 'analytics', 'measurement', 'tracking',
  'feature', 'capability', 'functionality', 'specification', 'performance'
] as const;

export const PASSION_KEYWORDS = [
  'heritage', 'craft', 'crafted', 'artisan', 'handmade', 'bespoke',
  'collection', 'collector', 'rare', 'exclusive', 'limited edition',
  'vintage', 'classic', 'antique', 'restoration', 'preservation',
  'legacy', 'tradition', 'traditional', 'authentic', 'genuine',
  'enthusiast', 'connoisseur', 'aficionado', 'devotee', 'fanatic',
  'passion', 'passionate', 'dedicated', 'committed', 'obsessed'
] as const;

export const COMMUNITY_KEYWORDS = [
  'forum', 'forums', 'community', 'club', 'association', 'society',
  'members', 'membership', 'fellow', 'enthusiasts', 'collectors',
  'events', 'meetup', 'gathering', 'convention', 'show',
  'share', 'sharing', 'connect', 'network', 'belong'
] as const;

export const DECISION_COMPLEXITY_KEYWORDS = {
  COMPLEX: ['consultation', 'custom', 'bespoke', 'tailored', 'personalized', 'expert', 'specialist'],
  SIMPLE: ['instant', 'automated', 'self-service', 'buy now', 'add to cart', 'checkout']
} as const;

export const PRICE_TRANSPARENCY_KEYWORDS = {
  OPAQUE: ['contact us', 'call for pricing', 'request quote', 'custom pricing', 'pricing available upon request'],
  TRANSPARENT: ['price', 'pricing', '$', 'buy now', 'add to cart', 'starting at', 'from']
} as const;
