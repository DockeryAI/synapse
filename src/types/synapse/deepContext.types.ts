/**
 * Deep Context Type Definitions
 *
 * Rich, multi-source context aggregation for breakthrough content generation
 * Combines business data, industry intelligence, cultural signals, competitive analysis,
 * and customer psychology into actionable insights
 *
 * Created: 2025-11-10
 */

// Temporary stub for cultural intelligence data
// TODO: Create proper culturalIntelligence.types.ts file
export interface NormalizedCulturalData {
  trends?: any[];
  moments?: any[];
  signals?: any[];
  [key: string]: any;
}

// ============================================================================
// BUSINESS CONTEXT
// ============================================================================

export interface BusinessProfile {
  id: string;
  name: string;
  industry: string;
  naicsCode?: string;
  website: string;
  location: {
    city: string;
    state: string;
    country: string;
    lat?: number;
    lon?: number;
  };
  keywords: string[];
  competitors?: string[];
}

export interface BrandVoiceProfile {
  tone: ('professional' | 'friendly' | 'authoritative' | 'casual' | 'inspiring')[];
  values: string[];
  personality: string[];
  avoidWords: string[];
  signaturePhrases: string[];
}

export interface BusinessGoal {
  goal: string;
  priority: 'primary' | 'secondary' | 'tertiary';
  timeframe: string;
  metrics: string[];
}

export interface UVPContext {
  targetCustomer: string; // WHO we serve
  customerProblem: string; // Their BEFORE state (pain)
  desiredOutcome: string; // Their AFTER state (goal)
  uniqueSolution: string; // HOW we help (our approach)
  keyBenefit: string; // WHY it matters (transformation)
  completeStatement?: string; // Full UVP statement
  emotionalDrivers?: string[]; // What they FEEL (fears, desires)
  functionalDrivers?: string[]; // What they NEED (practical)
}

export interface BusinessContext {
  profile: BusinessProfile;
  brandVoice: BrandVoiceProfile;
  uniqueAdvantages: string[];
  goals: BusinessGoal[];
  uvp?: UVPContext; // Target customer and value proposition
}

// ============================================================================
// INDUSTRY CONTEXT
// ============================================================================

export interface IndustryTrend {
  trend: string;
  direction: 'rising' | 'declining' | 'stable';
  strength: number; // 0-1
  timeframe: string;
  impact: 'high' | 'medium' | 'low';
  source?: string; // Platform name (e.g., "Google Reviews", "YouTube")
  sources?: string[]; // Deprecated: use source and evidence instead
  evidence?: string | string[]; // Actual quotes or data points
  timestamp?: string; // When this was observed
  sampleSize?: number; // How many data points support this
  implication?: string; // What this trend means for content strategy
}

export interface SeasonalPattern {
  month: string;
  variation: string; // e.g., "+25% volume"
  reason: string;
  keywords?: string[];
  bestPostingTime?: string;
  expectedEngagement: number;
}

export interface CompetitorAnalysis {
  topCompetitors: {
    name: string;
    domain: string;
    strengths: string[];
    weaknesses: string[];
    marketShare: number;
  }[];
  marketConcentration: 'fragmented' | 'moderate' | 'concentrated';
  barrierToEntry: 'low' | 'medium' | 'high';
}

export interface EconomicIndicator {
  indicator: string;
  value: number;
  trend: 'improving' | 'declining' | 'stable';
  impact: string;
}

export interface IndustryContext {
  profile: any; // IndustryProfile from existing system
  trends: IndustryTrend[];
  seasonality: SeasonalPattern[];
  competitiveLandscape: CompetitorAnalysis;
  economicFactors: EconomicIndicator[];
}

// ============================================================================
// COMPETITIVE INTELLIGENCE
// ============================================================================

export interface CompetitorBlindSpot {
  /** Topic competitors are ignoring */
  topic: string;

  /** Customer interest level (0-1) */
  customerInterest?: number;

  /** How often customers ask about this */
  frequency?: number;

  /** Opportunity score (0-100) */
  opportunityScore?: number;

  /** Why this is a blind spot */
  reasoning?: string;

  /** Evidence from customer data */
  evidence?: string | string[];

  /** Actionable insight */
  actionableInsight?: string;

  /** Platform source (e.g., "Google Reviews", "YouTube") */
  source?: string;

  /** When this was observed */
  timestamp?: string;

  /** Sample size supporting this insight */
  sampleSize?: number;
}

export interface CompetitorMistake {
  /** What mistake they're making */
  mistake: string;

  /** Which competitors are making this mistake */
  competitors: string[];

  /** Frequency of mistake */
  frequency: number;

  /** How to capitalize on this */
  opportunity: string;

  /** Customer pain point this creates */
  painPoint?: string;
}

export interface MarketGap {
  /** Description of the gap */
  gap: string;

  /** Market size/potential */
  marketSize?: 'large' | 'medium' | 'small';

  /** How defensible this position is */
  defensibility?: 'high' | 'medium' | 'low';

  /** Difficulty to execute */
  difficulty?: 'easy' | 'medium' | 'hard';

  /** Recommended positioning */
  positioning?: string;

  /** Evidence from customer data */
  evidence?: string | string[];

  /** Platform source (e.g., "Google Reviews", "YouTube") */
  source?: string;

  /** When this was observed */
  timestamp?: string;

  /** Sample size supporting this insight */
  sampleSize?: number;

  /** Confidence in this insight (0-1) */
  confidence?: number;
}

export interface ContentOpportunity {
  /** Type of content missing */
  contentType: string;

  /** Estimated search volume */
  searchVolume: number;

  /** Competition level */
  competition: 'low' | 'medium' | 'high';

  /** Why this is an opportunity */
  reasoning: string;

  /** Suggested content formats */
  formats: string[];
}

export interface CompetitiveIntelligence {
  /** What competitors don't talk about */
  blindSpots: CompetitorBlindSpot[];

  /** What they're doing wrong */
  mistakes: CompetitorMistake[];

  /** Gaps in the market */
  opportunities: MarketGap[];

  /** Missing content types */
  contentGaps: ContentOpportunity[];

  /** Weak positioning angles */
  positioningWeaknesses: string[];
}

// ============================================================================
// CUSTOMER PSYCHOLOGY
// ============================================================================

export interface UnarticuatedNeed {
  /** The unspoken need */
  need: string;

  /** Confidence in this inference (0-1) */
  confidence: number;

  /** Evidence supporting this */
  evidence: string | string[];

  /** How to address this need */
  approach?: string;

  /** Marketing angle */
  marketingAngle?: string;

  /** Emotional driver behind this */
  emotionalDriver?: string;

  /** Platform source (e.g., "Google Reviews", "YouTube") */
  source?: string;

  /** When this was observed */
  timestamp?: string;

  /** Sample size supporting this insight */
  sampleSize?: number;
}

export interface EmotionalTrigger {
  /** The trigger emotion */
  trigger: string;

  /** Strength of trigger (0-1) */
  strength: number;

  /** When this trigger activates */
  context: string;

  /** How to leverage this */
  leverage: string;

  /** Warning/ethical considerations */
  ethicalNote?: string;
}

export interface BehaviorPattern {
  /** Observed behavior */
  behavior: string;

  /** Frequency of behavior */
  frequency: 'common' | 'occasional' | 'rare';

  /** What this reveals about psychology */
  insight: string;

  /** How to align content with this */
  contentAlignment: string;
}

export interface IdentityDesire {
  /** Identity they want to project */
  desire: string;

  /** Strength of desire (0-1) */
  strength: number;

  /** Age/demographic correlation */
  demographics?: string[];

  /** How to speak to this identity */
  messaging: string;
}

export interface PurchaseMotivation {
  /** The real motivation */
  motivation: string;

  /** Category */
  category: 'functional' | 'emotional' | 'social' | 'economic';

  /** Strength (0-1) */
  strength: number;

  /** How to address this in content */
  contentStrategy: string;
}

export interface CustomerObjection {
  /** The objection */
  objection: string;

  /** How common this is */
  frequency: 'common' | 'occasional' | 'rare';

  /** Underlying fear/concern */
  underlyingConcern: string;

  /** How to address proactively */
  resolution: string;
}

export interface CustomerPsychology {
  /** Unarticulated needs inferred by AI */
  unarticulated: UnarticuatedNeed[];

  /** Emotional triggers */
  emotional: EmotionalTrigger[];

  /** Behavioral patterns */
  behavioral: BehaviorPattern[];

  /** Identity desires */
  identityDesires: IdentityDesire[];

  /** Purchase motivations */
  purchaseMotivations: PurchaseMotivation[];

  /** Objections and concerns */
  objections: CustomerObjection[];
}

// ============================================================================
// PATTERNS & SYNTHESIS
// ============================================================================

export interface Pattern {
  /** Type of pattern */
  type: 'contradiction' | 'emerging' | 'causal' | 'correlation';

  /** Pattern description */
  pattern: string;

  /** Significance score (0-1) */
  significance: number;

  /** Supporting evidence */
  evidence: string[];

  /** What this means for content */
  implication: string;

  /** Confidence in pattern (0-1) */
  confidence: number;
}

export interface ContentAngle {
  /** Angle title */
  title: string;

  /** Detailed description */
  description: string;

  /** Why this angle works */
  rationale: string;

  /** Target platforms */
  platforms: string[];

  /** Expected impact */
  expectedImpact: 'high' | 'medium' | 'low';

  /** Confidence (0-1) */
  confidence: number;

  /** Keywords to use */
  keywords: string[];

  /** Emotional hooks */
  emotionalHooks: string[];
}

export interface Synthesis {
  /** Top 3-5 key insights */
  keyInsights: string[];

  /** Hidden patterns detected */
  hiddenPatterns: Pattern[];

  /** Overall opportunity score (0-100) */
  opportunityScore: number;

  /** Recommended content angles */
  recommendedAngles: ContentAngle[];

  /** Overall confidence level (0-1) */
  confidenceLevel: number;

  /** Generated timestamp */
  generatedAt: Date;

  /** Breakthrough opportunities - high-value multi-source connections */
  breakthroughs?: BreakthroughOpportunity[];
}

/** Breakthrough opportunity from correlation engine */
export interface BreakthroughOpportunity {
  id: string;
  title: string;
  hook: string;
  score: number; // 0-100
  connectionType: '2-way' | '3-way' | '4-way' | '5-way';
  sources: string[];
  uvpValidation?: {
    painPoint: string;
    matchScore: number;
    evidence: string[];
  };
  psychology: {
    triggerCategory: string;
    emotion: string;
    urgency: 'low' | 'medium' | 'high' | 'critical';
  };
  timing?: {
    isTimeSensitive: boolean;
    deadline?: string;
    reason?: string;
  };
  competitive?: {
    gap: string;
    competitors: string[];
  };
  actionPlan: string;
  eqScore: number; // Emotional Quotient 0-100
  confidenceStars: 1 | 2 | 3 | 4 | 5; // Visual star rating
}

// ============================================================================
// MAIN DEEP CONTEXT INTERFACE
// ============================================================================

export interface DeepContext {
  /** Business information and goals */
  business: BusinessContext;

  /** Industry trends and competitive landscape */
  industry: IndustryContext;

  /** Real-time cultural intelligence */
  realTimeCultural: NormalizedCulturalData;

  /** Competitive intelligence analysis */
  competitiveIntel: CompetitiveIntelligence;

  /** Customer psychology insights */
  customerPsychology: CustomerPsychology;

  /** Synthesized insights and recommendations */
  synthesis: Synthesis;

  /** ALL raw data points for direct display - bypasses categorization limits */
  rawDataPoints?: RawDataPoint[];

  /** Correlated insights - multi-source validated opportunities */
  correlatedInsights?: CorrelatedInsight[];

  /** Metadata */
  metadata: {
    aggregatedAt: Date;
    dataSourcesUsed: string[];
    processingTimeMs: number;
    version: string;
  };
}

/** Raw data point for direct display */
export interface RawDataPoint {
  id: string;
  source: string;
  type: string;
  content: string;
  metadata?: {
    domain?: 'psychology' | 'timing' | 'competitive' | 'content_gap' | 'search_intent';
    triggerCategory?: 'pain_point' | 'aspiration' | 'fear' | 'opportunity' | 'urgency' | 'social_proof';
    emotion?: string;
    urgency?: 'immediate' | 'soon' | 'eventual';
    confidence?: number;
    uvpMatch?: string; // Which UVP pain point this validates
    correlationScore?: number; // How many sources confirm this
    [key: string]: any;
  };
  createdAt: Date;
  embedding?: number[];
}

/** Correlated insight - validated by multiple sources */
export interface CorrelatedInsight {
  id: string;
  type: 'validated_pain' | 'timing_opportunity' | 'competitive_gap' | 'psychological_breakthrough' | 'hidden_pattern';
  title: string;
  description: string;
  uvpMatch?: string; // Which UVP element this validates
  sources: {
    source: string;
    content: string;
    confidence: number;
  }[];
  psychology?: {
    triggerCategory: string;
    emotion: string;
    urgency: string;
  };
  breakthroughScore: number; // 0-100
  actionableInsight: string;
  timeSensitive: boolean;
}

// ============================================================================
// ENRICHMENT & PROCESSING
// ============================================================================

export interface EnrichedContext {
  business: BusinessContext;
  industry: IndustryContext;
  cultural: NormalizedCulturalData;
  competitive: CompetitiveIntelligence;
  psychology: CustomerPsychology;
  crossReferences: CrossReference[];
}

export interface CrossReference {
  /** Source data points being connected */
  sources: string[];

  /** The connection found */
  connection: string;

  /** Strength of connection (0-1) */
  strength: number;

  /** Insight from this connection */
  insight: string;
}

// ============================================================================
// ANALYZER OPTIONS
// ============================================================================

export interface AggregatorOptions {
  /** Enable/disable specific analyzers */
  analyzers?: {
    competitive?: boolean;
    psychology?: boolean;
    patterns?: boolean;
  };

  /** Use AI for inference */
  useAI?: boolean;

  /** Focus areas */
  focusAreas?: ('competitive' | 'psychology' | 'trends' | 'content')[];

  /** Minimum confidence threshold */
  minConfidence?: number;

  /** Maximum insights to return */
  maxInsights?: number;
}

// ============================================================================
// NOTE: All types are already exported with 'export interface' above
// No need for duplicate export type block
// ============================================================================
