/**
 * Jobs-to-be-Done (JTBD) Framework Type System
 *
 * Based on Clayton Christensen's "Jobs to be Done" theory:
 * Customers don't buy products - they "hire" them to get a job done.
 *
 * Key Insight: People buy products to make progress in their lives.
 * Understanding the JOB reveals what they're truly trying to accomplish.
 *
 * Three Job Dimensions:
 * 1. Functional Job - The practical task to accomplish
 * 2. Emotional Job - How they want to feel
 * 3. Social Job - How they want to be perceived by others
 *
 * Example: Buying a drill
 * - Functional: Make holes in the wall
 * - Emotional: Feel competent and capable
 * - Social: Be seen as a handy homeowner
 *
 * The famous quote: "People don't want a quarter-inch drill, they want a quarter-inch hole"
 * But even deeper: They want to hang family photos to feel like their house is a home.
 */

// =====================================================
// Core JTBD Types
// =====================================================

/**
 * Complete Jobs-to-be-Done profile
 * Captures the full context of what customers are trying to accomplish
 */
export interface JTBDProfile {
  /** Unique identifier */
  id?: string;

  /** Associated brand/product */
  brand_id?: string;
  product_id?: string;

  /** Main job statement */
  job_statement: string;

  /** The three job dimensions */
  functional_job: FunctionalJob;
  emotional_job: EmotionalJob;
  social_job: SocialJob;

  /** Job context and circumstances */
  context: JobContext;

  /** Metrics for job success */
  success_criteria: JobSuccessCriteria[];

  /** Current solutions customers use (competitors) */
  current_solutions: CurrentSolution[];

  /** Obstacles preventing job completion */
  obstacles: JobObstacle[];

  /** Job importance and satisfaction */
  importance_score: number; // 0-100
  satisfaction_score: number; // 0-100 with current solutions

  /** Opportunity score (high importance + low satisfaction = opportunity) */
  opportunity_score?: number;

  /** When this was identified */
  created_at?: string;
  updated_at?: string;
}

/**
 * Functional Job - The practical task to accomplish
 * "When [situation], I want to [motivation], so I can [outcome]"
 */
export interface FunctionalJob {
  /** Main functional task */
  main_task: string;

  /** Sub-tasks or steps involved */
  sub_tasks?: string[];

  /** Desired outcome */
  desired_outcome: string;

  /** Success metrics for this functional job */
  metrics?: {
    metric: string;
    current_performance?: number;
    desired_performance: number;
    unit?: string;
  }[];

  /** Time sensitivity */
  time_constraint?: 'immediate' | 'hours' | 'days' | 'weeks' | 'no_rush';

  /** How often does this job arise? */
  frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'one_time';
}

/**
 * Emotional Job - How they want to feel
 * The emotional and personal dimension
 */
export interface EmotionalJob {
  /** Primary emotional goal */
  primary_emotion: EmotionalGoal;

  /** Secondary emotional goals */
  secondary_emotions?: EmotionalGoal[];

  /** Emotions to avoid (what they DON'T want to feel) */
  avoid_emotions?: EmotionalGoal[];

  /** Personal values being expressed */
  values?: PersonalValue[];

  /** Desired emotional transformation */
  transformation?: {
    from_state: string; // Current emotional state
    to_state: string;   // Desired emotional state
  };
}

/**
 * Social Job - How they want to be perceived
 * The external validation and identity dimension
 */
export interface SocialJob {
  /** How they want to be seen by others */
  desired_perception: string;

  /** Which social groups matter */
  reference_groups: string[]; // e.g., "peers at work", "family", "industry experts"

  /** Social identity they're building/maintaining */
  identity_signals: string[];

  /** Status implications */
  status_impact?: 'increase' | 'maintain' | 'neutral';

  /** Belonging aspect */
  tribe_membership?: string; // Which "tribe" do they want to join?

  /** Social proof importance */
  social_proof_importance?: 'critical' | 'important' | 'nice_to_have' | 'not_important';
}

/**
 * Emotional goals customers are pursuing
 */
export type EmotionalGoal =
  // Positive emotions to achieve
  | 'confidence'
  | 'peace_of_mind'
  | 'excitement'
  | 'pride'
  | 'joy'
  | 'security'
  | 'competence'
  | 'control'
  | 'belonging'
  | 'achievement'
  | 'freedom'
  | 'relaxation'
  // Negative emotions to avoid
  | 'avoid_anxiety'
  | 'avoid_guilt'
  | 'avoid_shame'
  | 'avoid_frustration'
  | 'avoid_overwhelm'
  | 'avoid_fear'
  | 'avoid_embarrassment'
  | 'avoid_regret';

/**
 * Personal values
 */
export type PersonalValue =
  | 'authenticity'
  | 'excellence'
  | 'innovation'
  | 'tradition'
  | 'sustainability'
  | 'community'
  | 'independence'
  | 'family'
  | 'health'
  | 'growth'
  | 'efficiency'
  | 'quality'
  | 'simplicity'
  | 'adventure'
  | 'security'
  | 'status'
  | 'fairness'
  | 'creativity';

// =====================================================
// Job Context & Circumstances
// =====================================================

/**
 * The circumstances that trigger the job
 * "Jobs only exist in context"
 */
export interface JobContext {
  /** When does this job arise? */
  trigger_moment: string;

  /** Specific circumstances that create the need */
  circumstances: string[];

  /** Location/environment where job happens */
  location?: 'home' | 'work' | 'transit' | 'store' | 'online' | 'outdoor' | 'other';

  /** Who else is involved? */
  stakeholders?: string[]; // e.g., "boss", "spouse", "kids", "team"

  /** Constraints affecting job completion */
  constraints?: {
    time?: string;
    budget?: string;
    resources?: string;
    knowledge?: string;
    other?: string[];
  };

  /** What happens before this job */
  preceding_events?: string[];

  /** What happens after this job */
  following_events?: string[];
}

/**
 * Success criteria for job completion
 * How customers measure if the job is done well
 */
export interface JobSuccessCriteria {
  /** The criterion */
  criterion: string;

  /** Type of criterion */
  type: 'speed' | 'cost' | 'quality' | 'ease' | 'reliability' | 'customization' | 'status' | 'other';

  /** Importance (0-100) */
  importance: number;

  /** Current satisfaction with existing solutions (0-100) */
  current_satisfaction?: number;

  /** Is this a must-have or nice-to-have? */
  priority: 'must_have' | 'nice_to_have' | 'not_important';
}

// =====================================================
// Current Solutions & Competition
// =====================================================

/**
 * Solutions customers currently use (your real competition)
 * Often includes non-obvious competitors
 */
export interface CurrentSolution {
  /** What they're currently using */
  solution: string;

  /** Type of solution */
  type: 'product' | 'service' | 'diy' | 'workaround' | 'do_nothing';

  /** Why they use this */
  reasons: string[];

  /** What's good about it */
  strengths: string[];

  /** What's frustrating about it */
  weaknesses: string[];

  /** How satisfied are they? (0-100) */
  satisfaction_score: number;

  /** How much does it cost them? */
  cost?: {
    monetary?: string;
    time?: string;
    effort?: string;
    other?: string;
  };

  /** Switching barriers */
  switching_barriers?: string[];
}

/**
 * Obstacles preventing job completion
 */
export interface JobObstacle {
  /** The obstacle */
  obstacle: string;

  /** Type */
  type: 'time' | 'cost' | 'knowledge' | 'access' | 'trust' | 'complexity' | 'fear' | 'habit' | 'other';

  /** Severity (0-100) */
  severity: number;

  /** How often does this obstacle occur? */
  frequency: 'always' | 'often' | 'sometimes' | 'rarely';

  /** Potential solutions to overcome */
  potential_solutions?: string[];
}

// =====================================================
// Job Stories & Use Cases
// =====================================================

/**
 * Job Story format (better than user stories for JTBD)
 * Format: "When [situation], I want to [motivation], so I can [outcome]"
 */
export interface JobStory {
  /** The situation/context */
  when: string;

  /** What they want to do */
  i_want_to: string;

  /** The desired outcome */
  so_i_can: string;

  /** Which job dimension this relates to */
  job_dimension: 'functional' | 'emotional' | 'social';

  /** Real-world example */
  example?: string;
}

/**
 * Job Map - the steps in the job execution
 * Helps identify innovation opportunities at each stage
 */
export interface JobMap {
  job_id: string;

  /** The 8 universal job steps */
  steps: JobMapStep[];

  /** Innovation opportunities identified */
  opportunities: JobOpportunity[];
}

/**
 * A step in the job map
 */
export interface JobMapStep {
  /** Step number */
  order: number;

  /** Step name (from universal job map) */
  step: JobMapStepName;

  /** What happens in this step */
  description: string;

  /** Pain points at this step */
  pain_points: string[];

  /** Current satisfaction with this step (0-100) */
  satisfaction: number;

  /** Importance of this step (0-100) */
  importance: number;
}

/**
 * Universal job map steps (applies to most jobs)
 */
export type JobMapStepName =
  | 'define'       // Define what the job requires
  | 'locate'       // Locate what's needed
  | 'prepare'      // Prepare for the job
  | 'confirm'      // Confirm readiness
  | 'execute'      // Execute the main task
  | 'monitor'      // Monitor progress
  | 'modify'       // Make adjustments
  | 'conclude';    // Conclude and follow up

/**
 * Innovation opportunity from job mapping
 */
export interface JobOpportunity {
  /** Which step this relates to */
  step: JobMapStepName;

  /** Type of opportunity */
  type: 'underserved' | 'overserved' | 'new_market' | 'efficiency' | 'experience';

  /** Description of opportunity */
  description: string;

  /** Opportunity score (importance × (importance - satisfaction)) */
  opportunity_score: number;

  /** Potential solution concepts */
  solution_concepts?: string[];

  /** Estimated market size */
  market_potential?: 'large' | 'medium' | 'small' | 'niche';
}

// =====================================================
// JTBD Analysis & Scoring
// =====================================================

/**
 * Calculate opportunity score for a job
 * Formula: Importance + (Importance - Satisfaction)
 * Range: 0-200, where 100+ is good opportunity
 */
export function calculateOpportunityScore(importance: number, satisfaction: number): number {
  return importance + Math.max(0, importance - satisfaction);
}

/**
 * Classify opportunity level
 */
export function getOpportunityLevel(score: number): OpportunityLevel {
  if (score >= 150) return 'exceptional';
  if (score >= 120) return 'strong';
  if (score >= 100) return 'moderate';
  if (score >= 75) return 'weak';
  return 'minimal';
}

export type OpportunityLevel = 'exceptional' | 'strong' | 'moderate' | 'weak' | 'minimal';

/**
 * JTBD analysis result
 */
export interface JTBDAnalysis {
  /** Jobs identified */
  jobs: JTBDProfile[];

  /** Top opportunities (high importance, low satisfaction) */
  top_opportunities: JTBDProfile[];

  /** Underserved needs */
  underserved_needs: string[];

  /** Overserved needs (customers paying for features they don't value) */
  overserved_needs: string[];

  /** Job clustering */
  job_clusters?: {
    cluster_name: string;
    jobs: JTBDProfile[];
    common_context: string;
    opportunity_size: number;
  }[];

  /** Strategic recommendations */
  recommendations: string[];

  /** Market segmentation by job */
  job_based_segments?: JobSegment[];
}

/**
 * Market segment defined by job to be done
 * Better than demographic segmentation
 */
export interface JobSegment {
  /** Segment name */
  name: string;

  /** Primary job for this segment */
  primary_job: JTBDProfile;

  /** Segment characteristics */
  characteristics: {
    size: string;
    growth: string;
    accessibility: string;
  };

  /** Key needs */
  key_needs: string[];

  /** Messaging themes */
  messaging_themes: string[];

  /** Estimated value */
  market_potential: 'high' | 'medium' | 'low';
}

// =====================================================
// JTBD-Driven Content & Messaging
// =====================================================

/**
 * Content mapped to a job
 */
export interface JTBDContent {
  /** Which job this addresses */
  job: JTBDProfile;

  /** Content pieces addressing this job */
  content_pieces: {
    title: string;
    type: 'article' | 'video' | 'social' | 'email' | 'landing_page' | 'ad';
    job_dimension: 'functional' | 'emotional' | 'social';
    stage: 'awareness' | 'consideration' | 'decision';
    url?: string;
  }[];

  /** Messaging angles */
  messaging_angles: {
    angle: string;
    targets_dimension: 'functional' | 'emotional' | 'social';
    hook_example: string;
  }[];
}

/**
 * JTBD-based value proposition
 */
export interface JTBDValueProposition {
  /** The job being addressed */
  job_statement: string;

  /** How you help get the job done better */
  functional_benefit: string;

  /** The emotional payoff */
  emotional_benefit: string;

  /** The social benefit */
  social_benefit: string;

  /** Why you're better than current solutions */
  competitive_advantage: string;

  /** Evidence/proof */
  proof_points: string[];
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Create a job story from a JTBD profile
 */
export function createJobStory(job: JTBDProfile): JobStory {
  return {
    when: job.context.trigger_moment,
    i_want_to: job.functional_job.main_task,
    so_i_can: job.functional_job.desired_outcome,
    job_dimension: 'functional',
  };
}

/**
 * Validate JTBD profile completeness
 */
export function validateJTBDProfile(job: Partial<JTBDProfile>): {
  is_complete: boolean;
  missing_fields: string[];
  warnings: string[];
} {
  const missing: string[] = [];
  const warnings: string[] = [];

  if (!job.job_statement) missing.push('job_statement');
  if (!job.functional_job?.main_task) missing.push('functional_job.main_task');
  if (!job.functional_job?.desired_outcome) missing.push('functional_job.desired_outcome');
  if (!job.emotional_job?.primary_emotion) missing.push('emotional_job.primary_emotion');
  if (!job.context?.trigger_moment) missing.push('context.trigger_moment');

  if (!job.social_job?.desired_perception) {
    warnings.push('Social job not defined - consider how customers want to be perceived');
  }

  if (!job.success_criteria || job.success_criteria.length === 0) {
    warnings.push('No success criteria defined - how do customers measure success?');
  }

  if (!job.current_solutions || job.current_solutions.length === 0) {
    warnings.push('No current solutions identified - what are customers using today?');
  }

  return {
    is_complete: missing.length === 0,
    missing_fields: missing,
    warnings,
  };
}
