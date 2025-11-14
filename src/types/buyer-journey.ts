/**
 * Buyer Journey Type Definitions
 * Framework: Jobs To Be Done (JTBD) + Customer Journey Mapping
 */

// ============================================================================
// Ideal Customer Profile (ICP)
// ============================================================================

export interface Demographics {
  age_range: string // e.g., "35-55"
  income_range: string // e.g., "$60k-$100k"
  location_type: string // e.g., "Suburban families", "Urban professionals"
  occupation?: string // e.g., "Small business owners", "Healthcare professionals"
  household_size?: string // e.g., "Family with kids", "Single professional"
}

export interface Psychographics {
  values: string[] // e.g., ["Quality over price", "Family-focused", "Time-conscious"]
  personality_traits: string[] // e.g., ["Detail-oriented", "Risk-averse", "Early adopter"]
  lifestyle: string[] // e.g., ["Busy professional", "Health-conscious", "Tech-savvy"]
  interests: string[] // e.g., ["Home improvement", "Fitness", "Travel"]
}

export interface IdealCustomerProfile {
  segment_name: string // e.g., "Busy Homeowners", "Growth-Stage Startups"
  demographics: Demographics
  psychographics: Psychographics
  pain_points: string[] // Top 3-5 pain points
  goals: string[] // Top 3-5 goals/desires
  buying_triggers: string[] // What prompts them to buy
  decision_criteria: string[] // How they evaluate options
}

// ============================================================================
// Jobs To Be Done (JTBD)
// ============================================================================

export interface Job {
  id: string
  description: string // The job statement: "When [situation], I want to [motivation], so I can [outcome]"
  importance: number // 1-5 scale
  satisfaction: number // 1-5 scale (how well currently solved)
}

export interface FunctionalJob extends Job {
  type: 'functional'
  tasks: string[] // Specific tasks involved
}

export interface EmotionalJob extends Job {
  type: 'emotional'
  feeling: string // The feeling they want (e.g., "feel confident", "feel secure")
}

export interface SocialJob extends Job {
  type: 'social'
  perception: string // How they want to be perceived
}

export type JobToBeDone = FunctionalJob | EmotionalJob | SocialJob

export interface JobsAnalysis {
  functional_jobs: FunctionalJob[]
  emotional_jobs: EmotionalJob[]
  social_jobs: SocialJob[]
  primary_job: JobToBeDone // The most important job
}

// ============================================================================
// Journey Stages
// ============================================================================

export type JourneyStage =
  | 'awareness' // Learning about the problem/solution
  | 'consideration' // Evaluating options
  | 'decision' // Choosing a provider
  | 'purchase' // Making the transaction
  | 'delivery' // Receiving/experiencing the service
  | 'post-purchase' // After the service is complete
  | 'advocacy' // Becoming a loyal fan/referrer

export interface StageDetails {
  stage: JourneyStage
  label: string // Display name (e.g., "Awareness & Discovery")
  description: string // What happens in this stage
  customer_questions: string[] // What customers are asking
  customer_emotions: string[] // How customers feel
  duration?: string // How long this stage typically lasts
}

// ============================================================================
// Touchpoints
// ============================================================================

export type TouchpointChannel =
  | 'website'
  | 'google-search'
  | 'google-maps'
  | 'social-media'
  | 'email'
  | 'phone'
  | 'in-person'
  | 'review-sites'
  | 'referral'
  | 'advertising'
  | 'content'
  | 'other'

export interface Touchpoint {
  id: string
  stage: JourneyStage
  channel: TouchpointChannel
  name: string // e.g., "Google Search", "Homepage", "Consultation Call"
  description: string // What happens at this touchpoint
  is_critical: boolean // Is this a make-or-break moment?
  current_experience?: 'excellent' | 'good' | 'needs-work' | 'missing'
  notes?: string
}

// ============================================================================
// Pain Points & Friction
// ============================================================================

export type FrictionType =
  | 'information' // Hard to find information
  | 'trust' // Trust/credibility issues
  | 'complexity' // Too complicated
  | 'time' // Takes too long
  | 'cost' // Price concerns
  | 'access' // Hard to reach/contact
  | 'comparison' // Hard to compare options
  | 'decision' // Decision paralysis
  | 'other'

export interface PainPoint {
  id: string
  stage: JourneyStage
  friction_type: FrictionType
  description: string // What's causing friction
  impact: 'high' | 'medium' | 'low' // Business impact
  evidence: string[] // Where we see this (reviews, analytics, etc.)
  current_solution?: string // How we currently address it (if at all)
}

// ============================================================================
// Opportunities
// ============================================================================

export type OpportunityType =
  | 'quick-win' // Easy to implement, high impact
  | 'strategic' // Harder to implement, high impact
  | 'nice-to-have' // Easy to implement, lower impact
  | 'transformational' // Significant effort, game-changing impact

export interface Opportunity {
  id: string
  stage: JourneyStage
  type: OpportunityType
  title: string // Short title (e.g., "Add online booking")
  description: string // What to do
  expected_impact: string // What will improve
  effort: 'low' | 'medium' | 'high' // Implementation effort
  priority: 1 | 2 | 3 // Ranking
  addresses_pain_points: string[] // Which pain point IDs this solves
}

// ============================================================================
// Complete Journey Map
// ============================================================================

export interface BuyerJourneyMap {
  id: string
  brand_id: string

  // Core ICP
  ideal_customer_profile: IdealCustomerProfile

  // Jobs To Be Done
  jobs_analysis: JobsAnalysis

  // Journey Stages with details
  stages: StageDetails[]

  // All touchpoints mapped to stages
  touchpoints: Touchpoint[]

  // All pain points/friction identified
  pain_points: PainPoint[]

  // All opportunities identified
  opportunities: Opportunity[]

  // Metadata
  is_complete: boolean
  completed_steps: string[] // Which wizard steps are done
  created_at: string
  updated_at: string
}

// ============================================================================
// Wizard Step Progress
// ============================================================================

export type WizardStep =
  | 'customer-definition' // Define ICP
  | 'jobs-to-be-done' // Identify JTBD
  | 'journey-stages' // Map stages
  | 'touchpoints' // Define touchpoints
  | 'pain-points' // Identify friction
  | 'opportunities' // Map opportunities
  | 'review' // Final review & visualization

export interface WizardProgress {
  current_step: WizardStep
  completed_steps: WizardStep[]
  step_data: Partial<BuyerJourneyMap>
}

// ============================================================================
// UVP Pre-Population Mapping
// ============================================================================

/**
 * How UVP data maps to Buyer Journey
 * This enables 60-70% auto-fill from existing UVP wizard data
 */
export interface UVPPrePopulation {
  // Target Audience → ICP Demographics
  target_audience_to_demographics: boolean

  // Problems → Pain Points
  problems_to_pain_points: boolean

  // Value Props → Opportunities
  value_props_to_opportunities: boolean

  // Differentiators → Touchpoint Strategy
  differentiators_to_touchpoints: boolean

  // Customer Stories → Journey Evidence
  stories_to_evidence: boolean
}

// ============================================================================
// Database Schema Types (for Supabase)
// ============================================================================

export interface BuyerJourneyRecord {
  id: string
  brand_id: string
  journey_map: BuyerJourneyMap
  is_complete: boolean
  created_at: string
  updated_at: string
}

// ============================================================================
// Component Props
// ============================================================================

export interface BuyerJourneyWizardProps {
  brandId: string
  onComplete?: (journeyMap: BuyerJourneyMap) => void
  onCancel?: () => void
  uvpData?: any // Pre-population from UVP wizard
}

export interface JourneyVisualizationProps {
  journeyMap: BuyerJourneyMap
  interactive?: boolean
  highlightStage?: JourneyStage
}

export interface StageCardProps {
  stage: StageDetails
  touchpoints: Touchpoint[]
  painPoints: PainPoint[]
  opportunities: Opportunity[]
  onEdit?: () => void
}

// ============================================================================
// Analysis Types (for Customer Truth integration)
// ============================================================================

export interface ICPMatchAnalysis {
  expected_icp: IdealCustomerProfile
  actual_customer_data: {
    demographics: Demographics
    source: 'reviews' | 'analytics' | 'inferred'
  }
  match_percentage: number
  gaps: string[]
}

// ============================================================================
// SIMPLIFIED 4-STEP FLOW TYPES
// ============================================================================

/**
 * Simplified Customer Persona for 4-step wizard
 */
export interface CustomerPersona {
  id: string
  name: string // e.g., "Busy Homeowners", "Tech-Savvy Millennials"
  avatar_color: string // Hex color for visual
  industry: string // Which industry this persona belongs to
  quick_description: string // One-liner description

  // Key traits (3-5 items that orbit the avatar)
  key_traits: string[]

  // Simplified demographics
  demographics: {
    age_range: string
    income_range: string
    location_type: string
  }

  // Top 3 pain points
  pain_points: string[]

  // Top 3 goals
  goals: string[]
}

/**
 * Simplified Journey Stage (5 stages instead of 7)
 */
export type SimpleJourneyStage = 'discover' | 'research' | 'decide' | 'buy' | 'love'

export interface SimpleStageDetails {
  stage: SimpleJourneyStage
  label: string // "Discover", "Research", "Decide", "Buy", "Love"
  icon: string // Icon name from lucide-react
  color: string // Hex color

  // The ONE key concern for this stage
  key_concern: string

  // AI-suggested concerns from review data
  suggested_concerns: string[]
}

/**
 * Friction Point for drag-drop interface
 */
export interface FrictionPoint {
  id: string
  stage: SimpleJourneyStage
  description: string // The problem
  suggested_fix: string // The solution
  source: 'reviews' | 'analytics' | 'ai' // Where we found this
  priority: 'fix-now' | 'fix-later' | 'uncategorized'
}

/**
 * Action Item for final checklist
 */
export interface ActionItem {
  id: string
  title: string
  description: string
  stage: SimpleJourneyStage
  estimated_time: string // e.g., "1 hour", "1 day", "1 week"
  impact: 'high' | 'medium' | 'low'
  completed?: boolean // Track completion status (persisted to database)
}

/**
 * Simplified Journey Map (4-step version)
 */
export interface SimplifiedJourneyMap {
  id: string
  brand_id: string

  // Step 1: Customer
  selected_persona: CustomerPersona

  // Step 2: Journey
  stages: SimpleStageDetails[]

  // Step 3: Friction
  friction_points: FrictionPoint[]

  // Step 4: Action Plan
  action_items: ActionItem[]

  // Metadata
  is_complete: boolean
  completed_at?: string
  created_at: string
  updated_at: string
}

/**
 * Simplified Wizard Steps
 */
export type SimplifiedWizardStep = 'customer' | 'journey' | 'friction' | 'action'

export interface SimplifiedWizardProgress {
  current_step: SimplifiedWizardStep
  completed_steps: SimplifiedWizardStep[]
}

// ============================================================================
// Helper/Utility Types
// ============================================================================

export const SIMPLIFIED_JOURNEY_STAGES: SimpleStageDetails[] = [
  {
    stage: 'discover',
    label: 'Discover',
    icon: 'Search',
    color: '#3b82f6', // blue
    key_concern: '',
    suggested_concerns: [
      'Do I have a problem worth solving?',
      'Who can help me with this?',
      'Is this urgent or can it wait?',
    ],
  },
  {
    stage: 'research',
    label: 'Research',
    icon: 'BookOpen',
    color: '#8b5cf6', // purple
    key_concern: '',
    suggested_concerns: [
      'What are my options?',
      'Who is trustworthy and credible?',
      'What will this cost me?',
    ],
  },
  {
    stage: 'decide',
    label: 'Decide',
    icon: 'CheckCircle2',
    color: '#ec4899', // pink
    key_concern: '',
    suggested_concerns: [
      'Is this the right choice?',
      'Can I trust them with my money?',
      'What if it doesn\'t work out?',
    ],
  },
  {
    stage: 'buy',
    label: 'Buy',
    icon: 'ShoppingCart',
    color: '#f59e0b', // amber
    key_concern: '',
    suggested_concerns: [
      'Is this transaction secure?',
      'What happens next?',
      'When will I receive the service?',
    ],
  },
  {
    stage: 'love',
    label: 'Love',
    icon: 'Heart',
    color: '#10b981', // green
    key_concern: '',
    suggested_concerns: [
      'Did I get my money\'s worth?',
      'Should I tell others about this?',
      'Would I use them again?',
    ],
  },
]

export const JOURNEY_STAGES: StageDetails[] = [
  {
    stage: 'awareness',
    label: 'Awareness',
    description: 'Customer becomes aware of a problem or need',
    customer_questions: [
      'Do I have a problem?',
      'Is this urgent?',
      'Who can help?',
    ],
    customer_emotions: ['Curious', 'Concerned', 'Overwhelmed'],
  },
  {
    stage: 'consideration',
    label: 'Consideration',
    description: 'Customer researches and evaluates potential solutions',
    customer_questions: [
      'What are my options?',
      'Who is credible?',
      'What will this cost?',
    ],
    customer_emotions: ['Analytical', 'Cautious', 'Hopeful'],
  },
  {
    stage: 'decision',
    label: 'Decision',
    description: 'Customer chooses a provider and commits',
    customer_questions: [
      'Is this the right choice?',
      'Can I trust them?',
      'What if it doesn\'t work out?',
    ],
    customer_emotions: ['Anxious', 'Excited', 'Determined'],
  },
  {
    stage: 'purchase',
    label: 'Purchase',
    description: 'Customer completes the transaction',
    customer_questions: [
      'Is this secure?',
      'What happens next?',
      'When will this start?',
    ],
    customer_emotions: ['Relieved', 'Anticipating', 'Trusting'],
  },
  {
    stage: 'delivery',
    label: 'Delivery',
    description: 'Customer receives and experiences the service',
    customer_questions: [
      'Is this what I expected?',
      'Am I getting my money\'s worth?',
      'Should I have gone elsewhere?',
    ],
    customer_emotions: ['Evaluating', 'Satisfied', 'Critical'],
  },
  {
    stage: 'post-purchase',
    label: 'Post-Purchase',
    description: 'After service completion, ongoing relationship',
    customer_questions: [
      'Should I leave a review?',
      'Would I use them again?',
      'Should I recommend them?',
    ],
    customer_emotions: ['Grateful', 'Indifferent', 'Disappointed'],
  },
  {
    stage: 'advocacy',
    label: 'Advocacy',
    description: 'Customer becomes a repeat buyer and referrer',
    customer_questions: [
      'Who else needs this?',
      'What else do they offer?',
      'How can I get a deal?',
    ],
    customer_emotions: ['Loyal', 'Enthusiastic', 'Connected'],
  },
]

export const FRICTION_TYPE_LABELS: Record<FrictionType, string> = {
  information: 'Hard to find information',
  trust: 'Trust or credibility concerns',
  complexity: 'Too complex or confusing',
  time: 'Takes too long',
  cost: 'Price concerns',
  access: 'Hard to reach or contact',
  comparison: 'Difficult to compare options',
  decision: 'Decision paralysis',
  other: 'Other friction',
}

export const OPPORTUNITY_TYPE_LABELS: Record<OpportunityType, string> = {
  'quick-win': 'Quick Win',
  'strategic': 'Strategic',
  'nice-to-have': 'Nice to Have',
  'transformational': 'Transformational',
}
