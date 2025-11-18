/**
 * Core Truth Insight Types
 *
 * The "Core Truth" represents the deepest psychological insight about
 * what truly drives a customer's decision to buy. It synthesizes:
 * - Value propositions (what they offer)
 * - Buyer personas (who they serve)
 * - Emotional intelligence (why it matters)
 *
 * This is the foundation for all messaging, positioning, and content.
 *
 * Example Core Truths:
 * - "Busy parents want to feel like they're making the right health choices
 *    for their family without the guilt of not having time"
 * - "First-time founders crave the confidence that comes from knowing
 *    they're not making rookie mistakes that could kill their startup"
 * - "Enterprise buyers need the political safety of choosing a vendor
 *    that won't make them look bad in 6 months"
 */

// ============================================================================
// Psychological Driver Types
// ============================================================================

/**
 * Psychological motivators that drive buying decisions
 */
export type PsychologicalDriver =
  | 'fear-of-loss'           // Don't want to lose what they have
  | 'fear-of-missing-out'    // Don't want to miss opportunity
  | 'desire-for-gain'        // Want to get something new
  | 'desire-for-belonging'   // Want to be part of a group
  | 'desire-for-status'      // Want recognition/prestige
  | 'desire-for-safety'      // Want security/certainty
  | 'desire-for-freedom'     // Want autonomy/flexibility
  | 'desire-for-mastery'     // Want competence/expertise
  | 'identity-alignment'     // Want to be consistent with self-image
  | 'social-proof'           // Want validation from others
  | 'authority-trust'        // Want expert guidance
  | 'reciprocity'            // Feel obligation to give back

/**
 * Psychological driver with metadata
 */
export interface PsychologicalDriverDetail {
  /** Type of psychological driver */
  type: PsychologicalDriver;

  /** How strong this driver is (0-100) */
  strength: number;

  /** Why this driver matters for this audience */
  explanation: string;

  /** Evidence from personas/propositions that support this */
  evidence: string[];
}

// ============================================================================
// Core Truth Insight
// ============================================================================

/**
 * The synthesized core truth insight about customer psychology
 */
export interface CoreTruthInsight {
  /** Unique identifier */
  id?: string;

  /** Associated business ID */
  business_id?: string;

  /**
   * The core truth statement - 1-2 sentences that capture the deepest
   * psychological reality of what the customer needs/wants/fears
   *
   * Format: "[Who] [what they want/fear] [why it matters emotionally]"
   */
  core_truth: string;

  /**
   * The key psychological drivers that power this truth
   * Ranked by strength
   */
  psychological_drivers: string[];

  /**
   * The transformation promise - who they become after buying
   * This is the aspirational identity shift
   */
  transformation_promise: string;

  /**
   * The emotional payoff - how they will FEEL after transformation
   * This is the ultimate emotional benefit
   */
  emotional_payoff: string;

  /**
   * The reasoning/synthesis that led to this core truth
   * How we connected the dots from personas + propositions
   */
  synthesis_reasoning: string;

  /**
   * Composite emotional quotient score (0-100)
   * How emotionally resonant is this core truth?
   * Combines EQ scores from propositions and personas
   */
  composite_eq_score: number;

  /** When this insight was created */
  created_at?: string;

  /** When this insight was last updated */
  updated_at?: string;
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Core truth validation result
 */
export interface CoreTruthValidation {
  /** Is the core truth well-formed? */
  is_valid: boolean;

  /** Validation errors if any */
  errors: string[];

  /** Suggestions for improvement */
  suggestions: string[];

  /** Estimated emotional resonance score (0-100) */
  resonance_score: number;
}

/**
 * Core truth synthesis input
 * What goes into creating a core truth
 */
export interface CoreTruthSynthesisInput {
  /** Value propositions to synthesize from */
  value_propositions: Array<{
    statement: string;
    category: string;
    eq_score: number;
  }>;

  /** Buyer personas to synthesize from */
  buyer_personas: Array<{
    name: string;
    pain_points: string[];
    desired_outcomes: string[];
    jobs_to_be_done?: any;
  }>;

  /** Industry context */
  industry?: string;

  /** Business name for context */
  business_name?: string;
}

/**
 * Core truth generation options
 */
export interface CoreTruthGenerationOptions {
  /** How many alternative core truths to generate */
  alternatives?: number;

  /** Focus on specific psychological driver */
  focus_driver?: PsychologicalDriver;

  /** Maximum length for core truth statement */
  max_length?: number;

  /** Minimum EQ score to accept (0-100) */
  min_eq_score?: number;
}
