/**
 * Psychological Trigger Type System
 *
 * Defines customer pain points, desires, and the psychological triggers that
 * drive purchasing decisions. Maps the emotional journey from problem to solution.
 *
 * Core Concept: Every purchase is driven by either:
 * 1. Moving AWAY from pain (fear, frustration, loss)
 * 2. Moving TOWARD desire (aspiration, gain, transformation)
 *
 * Best messaging hits both: "Stop [pain] and start [desire]"
 *
 * Data Sources: Reviews, Reddit, industry research, customer interviews,
 * website testimonials, social media comments
 */

// =====================================================
// Core Psychological Trigger Types
// =====================================================

/**
 * A psychological trigger - the emotional driver of a purchasing decision
 */
export interface PsychologicalTrigger {
  /** Unique identifier */
  id?: string;

  /** Associated brand/industry */
  brand_id?: string;
  industry?: string;

  /** The trigger statement (what prompts them to seek a solution) */
  trigger: string;

  /** The pain point (what they're trying to escape) */
  pain_point: string;

  /** The desire (what they're trying to achieve) */
  desire: string;

  /** Where this insight came from */
  source: TriggerSource;

  /** Category of trigger */
  category: TriggerCategory;

  /** How impactful is this trigger? */
  impact_level: ImpactLevel;

  /** How urgent is this need? */
  urgency: UrgencyLevel;

  /** Frequency: How common is this trigger? */
  frequency?: FrequencyLevel;

  /** Optional: Specific quote or evidence */
  evidence?: string;

  /** Optional: Which customer segment experiences this */
  persona?: string;

  /** Optional: When this trigger typically occurs */
  timing?: TriggerTiming;

  /** When this was identified */
  created_at?: string;
  updated_at?: string;
}

/**
 * Source of the psychological trigger insight
 */
export type TriggerSource =
  | 'reddit'              // Reddit discussions
  | 'reviews'             // Google/Yelp reviews
  | 'website'             // Customer's website testimonials
  | 'testimonials'        // Direct testimonials
  | 'social_media'        // Social media comments/posts
  | 'survey'              // Customer surveys
  | 'interview'           // Customer interviews
  | 'industry_profile'    // Industry research data
  | 'competitor_analysis' // Competitor customer feedback
  | 'support_tickets'     // Customer support data
  | 'sales_calls'         // Sales conversation insights
  | 'ai_analysis';        // AI-detected patterns

/**
 * Category of psychological trigger
 */
export type TriggerCategory =
  | 'pain_point'    // Problem they're experiencing
  | 'aspiration'    // Goal they want to achieve
  | 'life_event'    // Life change that creates need (marriage, baby, move, etc.)
  | 'seasonal'      // Time-based trigger (tax season, holidays, etc.)
  | 'regulatory'    // Legal/compliance requirement
  | 'social'        // Social pressure or proof
  | 'financial'     // Economic circumstances
  | 'health'        // Health/wellness related
  | 'time'          // Time scarcity or deadline
  | 'status'        // Social status or identity
  | 'fear'          // Fear-based (loss aversion)
  | 'opportunity';  // FOMO, opportunity cost

/**
 * Impact level of trigger
 */
export type ImpactLevel =
  | 'critical'  // Business-critical or life-changing
  | 'high'      // Major impact on quality of life/business
  | 'medium'    // Noticeable improvement
  | 'low';      // Nice to have

/**
 * Urgency level
 */
export type UrgencyLevel =
  | 'immediate'  // Needs solution NOW
  | 'soon'       // Needs solution within weeks
  | 'eventual'   // Will need eventually
  | 'optional';  // No time pressure

/**
 * Frequency of occurrence
 */
export type FrequencyLevel =
  | 'constant'    // Ongoing, always present
  | 'frequent'    // Happens often (weekly/monthly)
  | 'occasional'  // Happens sometimes (quarterly/yearly)
  | 'rare';       // Uncommon but impactful

/**
 * When the trigger typically occurs
 */
export interface TriggerTiming {
  /** Time of year (if seasonal) */
  season?: 'spring' | 'summer' | 'fall' | 'winter';

  /** Specific months */
  months?: number[]; // 1-12

  /** Business lifecycle stage */
  business_stage?: 'startup' | 'growth' | 'established' | 'scaling' | 'mature';

  /** Customer lifecycle stage */
  customer_stage?: 'awareness' | 'consideration' | 'decision' | 'retention' | 'advocacy';

  /** Life stage */
  life_stage?: string; // e.g., "new parent", "recent graduate", "retiree"

  /** Any timing notes */
  notes?: string;
}

// =====================================================
// Pain-Desire Mapping
// =====================================================

/**
 * Maps a pain point to its corresponding desire
 * This is the core of psychological messaging
 */
export interface PainDesireMapping {
  /** The pain they're experiencing */
  pain: string;

  /** What they desire instead */
  desire: string;

  /** The emotional state during pain */
  pain_emotion: Emotion[];

  /** The emotional state after achieving desire */
  desire_emotion: Emotion[];

  /** Example messaging that bridges pain to desire */
  messaging_examples?: string[];

  /** Which stage of awareness this targets */
  awareness_stage: AwarenessStage;
}

/**
 * Core human emotions (Plutchik's wheel)
 */
export type Emotion =
  // Primary emotions
  | 'joy'
  | 'trust'
  | 'fear'
  | 'surprise'
  | 'sadness'
  | 'disgust'
  | 'anger'
  | 'anticipation'
  // Secondary emotions (combinations)
  | 'love'          // joy + trust
  | 'guilt'         // fear + sadness
  | 'delight'       // joy + surprise
  | 'shame'         // fear + disgust
  | 'pride'         // joy + anger
  | 'hope'          // trust + anticipation
  | 'anxiety'       // fear + anticipation
  | 'frustration'   // anger + sadness
  | 'relief'        // joy + surprise
  | 'confidence'    // trust + joy
  | 'overwhelm'     // fear + sadness
  | 'excitement';   // joy + anticipation

/**
 * Customer awareness stages (Eugene Schwartz)
 */
export type AwarenessStage =
  | 'unaware'           // Don't know they have a problem
  | 'problem_aware'     // Know they have a problem
  | 'solution_aware'    // Know solutions exist
  | 'product_aware'     // Know about your product
  | 'most_aware';       // Ready to buy

// =====================================================
// Trigger Analysis & Clustering
// =====================================================

/**
 * Cluster of related triggers
 * Groups similar triggers together for messaging
 */
export interface TriggerCluster {
  /** Unique identifier */
  id: string;

  /** Name of the cluster */
  name: string;

  /** Description of what unites these triggers */
  description: string;

  /** Triggers in this cluster */
  triggers: PsychologicalTrigger[];

  /** Common pain points across cluster */
  common_pains: string[];

  /** Common desires across cluster */
  common_desires: string[];

  /** Recommended messaging themes */
  messaging_themes: string[];

  /** Which personas are affected */
  affected_personas?: string[];

  /** Cluster size and importance */
  size: number;
  importance_score?: number;
}

/**
 * Trigger analysis result
 */
export interface TriggerAnalysis {
  /** Total triggers analyzed */
  total_triggers: number;

  /** Breakdown by category */
  by_category: Record<TriggerCategory, number>;

  /** Breakdown by impact level */
  by_impact: Record<ImpactLevel, number>;

  /** Breakdown by urgency */
  by_urgency: Record<UrgencyLevel, number>;

  /** Top triggers (by impact and frequency) */
  top_triggers: PsychologicalTrigger[];

  /** Identified clusters */
  clusters?: TriggerCluster[];

  /** Messaging recommendations */
  messaging_recommendations: string[];

  /** Content opportunities */
  content_opportunities: string[];
}

// =====================================================
// Trigger-Based Content Generation
// =====================================================

/**
 * Content angle based on a psychological trigger
 */
export interface TriggerContentAngle {
  /** The trigger being addressed */
  trigger: PsychologicalTrigger;

  /** Content hook/headline */
  hook: string;

  /** Main message */
  message: string;

  /** Call to action */
  cta: string;

  /** Emotional arc */
  emotional_arc: {
    opening_emotion: Emotion;
    transformation_emotion: Emotion;
    closing_emotion: Emotion;
  };

  /** Content format recommendations */
  recommended_formats: ContentFormat[];

  /** Platform recommendations */
  recommended_platforms: Platform[];
}

/**
 * Content formats
 */
export type ContentFormat =
  | 'social_post'
  | 'blog_article'
  | 'video'
  | 'email'
  | 'ad'
  | 'landing_page'
  | 'testimonial'
  | 'case_study'
  | 'infographic'
  | 'carousel'
  | 'story';

/**
 * Social platforms
 */
export type Platform =
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'twitter'
  | 'tiktok'
  | 'youtube'
  | 'pinterest'
  | 'email'
  | 'website';

// =====================================================
// Trigger Research & Discovery
// =====================================================

/**
 * Research query for discovering triggers
 */
export interface TriggerResearchQuery {
  /** Industry or niche */
  industry: string;

  /** Target audience */
  audience?: string;

  /** Specific pain point to explore */
  pain_point?: string;

  /** Sources to search */
  sources: TriggerSource[];

  /** Search keywords */
  keywords?: string[];

  /** Time range for research */
  time_range?: {
    start: string;
    end: string;
  };
}

/**
 * Result from trigger research
 */
export interface TriggerResearchResult {
  /** Query that was executed */
  query: TriggerResearchQuery;

  /** Discovered triggers */
  triggers: PsychologicalTrigger[];

  /** Pain-desire mappings */
  pain_desire_mappings: PainDesireMapping[];

  /** Raw evidence/quotes */
  evidence: Array<{
    quote: string;
    source: TriggerSource;
    url?: string;
    date?: string;
  }>;

  /** Common themes identified */
  themes: string[];

  /** Confidence in findings */
  confidence: 'high' | 'medium' | 'low';

  /** Research timestamp */
  researched_at: string;
}

// =====================================================
// Trigger Scoring & Prioritization
// =====================================================

/**
 * Scoring for trigger prioritization
 * Helps determine which triggers to address first in marketing
 */
export interface TriggerScore {
  trigger_id: string;

  /** Impact (0-100) */
  impact_score: number;

  /** Urgency (0-100) */
  urgency_score: number;

  /** Frequency (0-100) */
  frequency_score: number;

  /** How addressable is this by the business? (0-100) */
  addressability_score: number;

  /** Composite priority score */
  priority_score: number;

  /** Recommended action */
  recommendation: 'address_immediately' | 'include_in_messaging' | 'content_opportunity' | 'monitor';
}

/**
 * Calculate priority score for a trigger
 */
export function calculateTriggerPriority(
  impact: ImpactLevel,
  urgency: UrgencyLevel,
  frequency?: FrequencyLevel
): number {
  const impactScores = { critical: 100, high: 75, medium: 50, low: 25 };
  const urgencyScores = { immediate: 100, soon: 75, eventual: 50, optional: 25 };
  const frequencyScores = { constant: 100, frequent: 75, occasional: 50, rare: 25 };

  const impactScore = impactScores[impact];
  const urgencyScore = urgencyScores[urgency];
  const frequencyScore = frequency ? frequencyScores[frequency] : 50;

  // Weighted average: impact (40%), urgency (35%), frequency (25%)
  const priority = impactScore * 0.4 + urgencyScore * 0.35 + frequencyScore * 0.25;

  return Math.round(priority);
}

/**
 * Get human-readable priority level
 */
export function getTriggerPriorityLevel(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score >= 80) return 'critical';
  if (score >= 65) return 'high';
  if (score >= 45) return 'medium';
  return 'low';
}

// =====================================================
// Helper Types
// =====================================================

/**
 * Trigger validation result
 */
export interface TriggerValidation {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

/**
 * Validate a psychological trigger
 */
export function validateTrigger(trigger: Partial<PsychologicalTrigger>): TriggerValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  if (!trigger.trigger || trigger.trigger.trim().length === 0) {
    errors.push('Trigger statement is required');
  }

  if (!trigger.pain_point || trigger.pain_point.trim().length === 0) {
    errors.push('Pain point is required');
  }

  if (!trigger.desire || trigger.desire.trim().length === 0) {
    errors.push('Desire is required');
  }

  if (!trigger.source) {
    errors.push('Source is required');
  }

  if (!trigger.category) {
    warnings.push('Category should be specified for better organization');
  }

  if (!trigger.impact_level) {
    warnings.push('Impact level helps prioritize triggers');
  }

  if (!trigger.evidence) {
    suggestions.push('Adding evidence/quotes strengthens the trigger');
  }

  if (trigger.trigger && trigger.trigger.length > 200) {
    warnings.push('Trigger statement is very long - consider making it more concise');
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
    suggestions,
  };
}
