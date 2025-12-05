/**
 * Connection Discovery Types
 * For Phase 6: AI-powered connection discovery between disparate data points
 */

// Data sources for connection discovery
export type DataSource =
  | 'youtube'
  | 'outscraper'
  | 'news'
  | 'weather'
  | 'serper'
  | 'reddit'
  | 'quora'
  | 'g2'
  | 'trustpilot'
  | 'twitter'
  | 'apify'
  | 'perplexity'
  | 'semrush'
  | 'website'
  | 'linkedin'
  | 'tiktok'
  | 'google_trends'
  | 'whisper'
  | 'yelp';

// Data point types for categorization
export type DataPointType =
  | 'customer_trigger'
  | 'trending_topic'
  | 'competitive_gap'
  | 'timing'
  | 'market_trend'
  | 'sentiment'
  | 'behavior_pattern'
  | 'local_event'
  | 'pain_point'
  | 'unarticulated_need'
  | 'competitor_weakness'
  | 'competitor_mention'
  | 'keyword_gap'
  | 'question'
  | 'people_also_ask'
  | 'search_intent'
  | 'news_story'
  | 'weather_trigger'
  | 'service_offering'
  | 'brand_voice'
  | 'community_discussion'; // Reddit conversations from UVP pain point mining

// Embedding model configuration
export const EMBEDDING_MODEL = 'text-embedding-3-small';
export const EMBEDDING_DIMENSIONS = 1536;
export const EMBEDDING_COST_PER_1M_TOKENS = 0.02;

// Data point interface with embeddings
export interface DataPoint {
  id: string;
  source: DataSource;
  type: DataPointType;
  content: string;
  metadata: {
    domain?: 'psychology' | 'timing' | 'competitive' | 'content_gap' | 'search_intent' | 'community';
    sentiment?: 'positive' | 'negative' | 'neutral';
    volume?: number;
    relevance?: number;
    timing?: 'immediate' | 'soon' | 'seasonal';
    competition?: 'low' | 'medium' | 'high';
    certainty?: number;
    [key: string]: any;
  };
  createdAt: Date;
  embedding?: number[];
}

// Embedding cache entry
export interface EmbeddingCacheEntry {
  text: string;
  embedding: number[];
  cachedAt: Date;
  model: string;
}

// Embedding cache stats
export interface EmbeddingCacheStats {
  size: number;
  hits: number;
  misses: number;
  totalCost: number;
}

// Connection type
export type ConnectionType =
  | 'cross_domain'
  | 'temporal'
  | 'causal'
  | 'contradictory'
  | 'location_event'
  | 'local_trend'
  | 'cultural_moment'
  | 'trending_topic'
  | 'seasonal_pattern'
  | 'competitive_gap'
  | 'customer_insight';

// Connection strength
export type ConnectionStrength =
  | 'weak'
  | 'moderate'
  | 'strong';

// Expected impact
export type ExpectedImpact =
  | 'low'
  | 'medium'
  | 'high'
  | 'holy shit';

// Connection relationship details
export interface ConnectionRelationship {
  semanticSimilarity: number;
  unexpectedness: number;
  strength: ConnectionStrength;
  explanation: string;
}

// Breakthrough potential assessment
export interface BreakthroughPotential {
  score: number;
  reasoning: string[];
  contentAngle: string;
  expectedImpact: ExpectedImpact;
}

// Connection sources (2-way or 3-way)
export interface ConnectionSources {
  primary: DataPoint;
  secondary: DataPoint;
  tertiary?: DataPoint;
}

// Main Connection interface
export interface Connection {
  id: string;
  type: ConnectionType;
  sources: ConnectionSources;
  relationship: ConnectionRelationship;
  breakthroughPotential: BreakthroughPotential;
  discoveredAt: Date;
  confidence: number;
}

// Legacy Connection interface for backwards compatibility
export interface LegacyConnection {
  id: string
  brand_id: string
  type: '2-way' | '3-way' | '4-way' | '5-way'
  title: string
  description: string
  data_points: DataPoint[]
  confidence: number // 0-1
  impact_score: number // 0-100
  breakthrough_score: number // 0-1 (how unexpected/valuable)
  content_angle: string
  suggested_actions: Array<{
    action_type: 'create_content' | 'adjust_strategy' | 'target_audience' | 'timing' | 'platform_shift'
    description: string
    priority: 'critical' | 'high' | 'medium' | 'low'
    estimated_effort: string
    potential_impact: number
    implementation_steps?: string[]
  }>
  created_at: string
  expires_at?: string
}

// Re-export DeepContext from the main types file
export type { DeepContext } from './synapse/deepContext.types';

export interface ConnectionDiscoveryOptions {
  minBreakthroughScore?: number // 0-100, default 70
  maxConnections?: number // default 20
  includeWeakSignals?: boolean // default true
  focusAreas?: Array<'customer_psychology' | 'market_trends' | 'competitive_gaps' | 'timing' | 'channels'>
  minSimilarity?: number // 0-1, default 0.6
  requireDifferentSources?: boolean // default true
  enableThreeWay?: boolean // default true
  maxPerPair?: number // default 10
}

// Default options for connection discovery
export const DEFAULT_DISCOVERY_OPTIONS: Required<ConnectionDiscoveryOptions> = {
  minBreakthroughScore: 70,
  maxConnections: 20,
  includeWeakSignals: true,
  focusAreas: ['customer_psychology', 'market_trends', 'competitive_gaps', 'timing', 'channels'],
  minSimilarity: 0.6,
  requireDifferentSources: true,
  enableThreeWay: true,
  maxPerPair: 10
}

// Connection discovery result statistics
export interface ConnectionDiscoveryStats {
  totalDataPoints: number;
  twoWayConnections: number;
  threeWayConnections: number;
  averageSimilarity: number;
  averageBreakthroughScore: number;
  holyShitCount: number;
}

// Connection discovery result metadata
export interface ConnectionDiscoveryMetadata {
  discoveredAt: Date;
  processingTimeMs: number;
  embeddingsCached: number;
  embeddingsGenerated: number;
  estimatedCost: number;
}

// Main discovery result
export interface ConnectionDiscoveryResult {
  connections: Connection[];
  breakthroughs: Connection[];
  stats: ConnectionDiscoveryStats;
  metadata: ConnectionDiscoveryMetadata;
}

// Legacy result for backwards compatibility
export interface LegacyConnectionDiscoveryResult {
  connections: LegacyConnection[]
  summary: {
    total_connections: number
    high_confidence_count: number
    breakthrough_insights: number
    categories: Record<string, number>
  }
  processing_time_ms: number
  data_sources_used: string[]
}

// Scoring weights for breakthrough potential calculation
export interface ScoringWeights {
  semanticSimilarity: number;
  unexpectedness: number;
  psychology: number;
  competitive: number;
  timeliness: number;
  threeWay: number;
}

// Default scoring weights (multipliers for weighted scoring)
export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  semanticSimilarity: 1.0,
  unexpectedness: 1.0,
  psychology: 1.0,
  competitive: 1.0,
  timeliness: 1.0,
  threeWay: 1.0,
};

// ============================================
// INSIGHT DIMENSIONS (V2 - Variety Framework)
// ============================================

// Buyer Journey Stage
export type JourneyStage =
  | 'AWARENESS'
  | 'CONSIDERATION'
  | 'DECISION'
  | 'RETENTION'
  | 'ADVOCACY';

// V5 EmotionTrigger removed - use V1 psychology principles instead

// Content Format
export type ContentFormat =
  | 'HOWTO'
  | 'COMPARISON'
  | 'CASE_STUDY'
  | 'CHECKLIST'
  | 'DATA'
  | 'CONTROVERSY'
  | 'STORY'
  | 'FAQ'
  | 'TOOL'
  | 'TESTIMONIAL';

// Target Persona
export type TargetPersona =
  | 'DECISION_MAKER'
  | 'INFLUENCER'
  | 'USER'
  | 'BLOCKER'
  | 'CHAMPION';

// Objection Type
export type ObjectionType =
  | 'OBJ_PRICE'
  | 'OBJ_TIMING'
  | 'OBJ_AUTHORITY'
  | 'OBJ_NEED'
  | 'OBJ_TRUST'
  | 'OBJ_COMPETITOR';

// Content Angle
export type ContentAngle =
  | 'CONTRARIAN'
  | 'DATA_DRIVEN'
  | 'STORY_DRIVEN'
  | 'EXPERT'
  | 'TRENDING'
  | 'COMPARISON'
  | 'BEHIND_SCENES'
  | 'PREDICTION';

// CTA Type
export type CTAType =
  | 'CTA_DOWNLOAD'
  | 'CTA_DEMO'
  | 'CTA_TRIAL'
  | 'CTA_PRICING'
  | 'CTA_CONSULT'
  | 'CTA_WEBINAR'
  | 'CTA_ASSESS'
  | 'CTA_CALL'
  | 'CTA_VISIT'
  | 'CTA_BOOK';

// Urgency Level
export type UrgencyLevel =
  | 'URGENT_CRITICAL'
  | 'URGENT_HIGH'
  | 'URGENT_MEDIUM'
  | 'URGENT_LOW';

// Source Confidence
export type SourceConfidence =
  | 'CONF_5WAY'
  | 'CONF_4WAY'
  | 'CONF_3WAY'
  | 'CONF_2WAY'
  | 'CONF_SINGLE';

// Competitive Position
export type CompetitivePosition =
  | 'POS_LEADER'
  | 'POS_CHALLENGER'
  | 'POS_NICHE'
  | 'POS_INNOVATOR'
  | 'POS_VALUE';

// Content Lifecycle
export type ContentLifecycle =
  | 'LIFE_EVERGREEN'
  | 'LIFE_SEASONAL'
  | 'LIFE_TRENDING'
  | 'LIFE_REACTIVE';

// Business Segment
export type BusinessSegment =
  | 'SMB_LOCAL'
  | 'SMB_REGIONAL'
  | 'B2B_NATIONAL'
  | 'B2B_GLOBAL';

// Hook Formula Type
export type HookFormula =
  | 'NUMBER'
  | 'QUESTION'
  | 'CONTRARIAN'
  | 'STORY'
  | 'DATA'
  | 'URGENCY'
  | 'CURIOSITY'
  | 'FEAR'
  | 'DESIRE'
  | 'SOCIAL_PROOF'
  | 'HOWTO'
  | 'COMPARISON'
  | 'MISTAKE'
  | 'SECRET'
  | 'PREDICTION';

// Content Pillar (Topic Authority Areas)
export type ContentPillar =
  | 'PILLAR_EXPERTISE'      // Technical knowledge, how-to
  | 'PILLAR_TRUST'          // Reviews, testimonials, credentials
  | 'PILLAR_VALUE'          // Pricing, ROI, cost savings
  | 'PILLAR_DIFFERENTIATION' // What makes you unique vs competitors
  | 'PILLAR_TRENDS'         // Industry news, market changes
  | 'PILLAR_COMMUNITY';     // Local events, partnerships, culture

// Complete Insight Dimensions (12 dimensions + pillar)
export interface InsightDimensions {
  journeyStage: JourneyStage;
  // emotion: EmotionTrigger; // V5 DEPRECATED - use V1 psychology principles
  format: ContentFormat;
  persona: TargetPersona;
  objection?: ObjectionType;
  angle: ContentAngle;
  cta: CTAType;
  urgency: UrgencyLevel;
  confidence: SourceConfidence;
  position?: CompetitivePosition;
  lifecycle: ContentLifecycle;
  segment: BusinessSegment;
  hookFormula: HookFormula;
  pillar: ContentPillar;  // Added: Content pillar for topic authority
}

// Source-to-Dimension Default Mappings
export const SOURCE_DIMENSION_DEFAULTS: Record<DataSource, Partial<InsightDimensions>> = {
  youtube: { journeyStage: 'AWARENESS', format: 'HOWTO', pillar: 'PILLAR_EXPERTISE' },
  outscraper: { journeyStage: 'DECISION', format: 'TESTIMONIAL', pillar: 'PILLAR_TRUST' },
  news: { lifecycle: 'LIFE_TRENDING', pillar: 'PILLAR_TRENDS' },
  weather: { lifecycle: 'LIFE_SEASONAL', urgency: 'URGENT_HIGH', pillar: 'PILLAR_COMMUNITY' },
  serper: { journeyStage: 'AWARENESS', format: 'FAQ', pillar: 'PILLAR_EXPERTISE' },
  reddit: { journeyStage: 'AWARENESS', pillar: 'PILLAR_COMMUNITY' },
  quora: { journeyStage: 'AWARENESS', format: 'FAQ', pillar: 'PILLAR_EXPERTISE' },
  g2: { journeyStage: 'DECISION', format: 'COMPARISON', pillar: 'PILLAR_DIFFERENTIATION', persona: 'INFLUENCER' },
  trustpilot: { journeyStage: 'DECISION', format: 'TESTIMONIAL', pillar: 'PILLAR_TRUST' },
  twitter: { lifecycle: 'LIFE_TRENDING', pillar: 'PILLAR_TRENDS' },
  apify: { journeyStage: 'CONSIDERATION', pillar: 'PILLAR_EXPERTISE' },
  perplexity: { journeyStage: 'AWARENESS', format: 'FAQ', pillar: 'PILLAR_EXPERTISE' },
  semrush: { journeyStage: 'CONSIDERATION', format: 'DATA', pillar: 'PILLAR_DIFFERENTIATION', angle: 'DATA_DRIVEN' },
  website: { journeyStage: 'CONSIDERATION', pillar: 'PILLAR_EXPERTISE' },
  linkedin: { journeyStage: 'CONSIDERATION', persona: 'DECISION_MAKER', pillar: 'PILLAR_TRENDS' },
  tiktok: { journeyStage: 'AWARENESS', lifecycle: 'LIFE_TRENDING', pillar: 'PILLAR_COMMUNITY' },
  google_trends: { lifecycle: 'LIFE_TRENDING', pillar: 'PILLAR_TRENDS' }, // V5 emotion removed
  whisper: { format: 'STORY', pillar: 'PILLAR_COMMUNITY' }, // V5 emotion removed
  yelp: { journeyStage: 'DECISION', format: 'TESTIMONIAL', pillar: 'PILLAR_TRUST' }, // V5 emotion removed
};

// Hook Templates for Title Generation
export const HOOK_TEMPLATES: Record<HookFormula, string> = {
  NUMBER: '{count} {topic} That {outcome}',
  QUESTION: 'Are You Making This {topic} Mistake?',
  CONTRARIAN: 'Why Most {topic} Actually {negative_outcome}',
  STORY: 'How {company} {achieved_outcome} in {timeframe}',
  DATA: 'New Data: {percentage} {metric_change}',
  URGENCY: '{event} Is Coming—Here\'s How to Prepare',
  CURIOSITY: 'The Hidden Reason Your {topic} {problem}',
  FEAR: 'Is Your {topic} Putting You at Risk?',
  DESIRE: 'Imagine {positive_outcome} Without {pain}',
  SOCIAL_PROOF: '{count}+ {audience} Trust This {approach}',
  HOWTO: 'How to {achieve_outcome} (Step-by-Step)',
  COMPARISON: '{product_a} vs {product_b}: Which Wins?',
  MISTAKE: 'The #1 Mistake {audience} Make with {topic}',
  SECRET: 'The {topic} Secret {competitors} Don\'t Share',
  PREDICTION: '{count} {industry} Trends That Will Define {year}',
};

// Dimension Distribution Requirements (for variety enforcement)
export interface VarietyDistribution {
  journeyStage: Record<JourneyStage, { min: number; max: number }>;
  // emotion: Record<EmotionTrigger, { min: number }>; // V5 REMOVED - use V1 psychology principles
  format: Record<ContentFormat, { min: number }>;
}

export const REQUIRED_DISTRIBUTION: VarietyDistribution = {
  journeyStage: {
    AWARENESS: { min: 0.30, max: 0.40 },
    CONSIDERATION: { min: 0.25, max: 0.35 },
    DECISION: { min: 0.20, max: 0.25 },
    RETENTION: { min: 0.05, max: 0.10 },
    ADVOCACY: { min: 0.05, max: 0.10 },
  },
  // V5 emotion distribution removed - use V1 psychology principles
  format: {
    HOWTO: { min: 0.15 },
    COMPARISON: { min: 0.12 },
    CASE_STUDY: { min: 0.12 },
    CHECKLIST: { min: 0.05 },
    DATA: { min: 0.08 },
    CONTROVERSY: { min: 0.05 },
    STORY: { min: 0.10 },
    FAQ: { min: 0.12 },
    TOOL: { min: 0.05 },
    TESTIMONIAL: { min: 0.08 },
  },
};

// SMB vs B2B Defaults
export const SEGMENT_DEFAULTS: Record<BusinessSegment, Partial<InsightDimensions>> = {
  SMB_LOCAL: {
    journeyStage: 'AWARENESS',
    // emotion: 'TRUST', // V5 REMOVED - use V1 psychology principles
    format: 'FAQ',
    persona: 'DECISION_MAKER',
    cta: 'CTA_CALL',
    urgency: 'URGENT_MEDIUM',
    lifecycle: 'LIFE_SEASONAL',
  },
  SMB_REGIONAL: {
    journeyStage: 'CONSIDERATION',
    // emotion: 'TRUST', // V5 REMOVED - use V1 psychology principles
    format: 'COMPARISON',
    persona: 'DECISION_MAKER',
    cta: 'CTA_BOOK',
    urgency: 'URGENT_MEDIUM',
    lifecycle: 'LIFE_EVERGREEN',
  },
  B2B_NATIONAL: {
    journeyStage: 'CONSIDERATION',
    // emotion: 'FEAR', // V5 REMOVED - use V1 psychology principles
    format: 'CASE_STUDY',
    persona: 'INFLUENCER',
    cta: 'CTA_DEMO',
    urgency: 'URGENT_MEDIUM',
    lifecycle: 'LIFE_EVERGREEN',
  },
  B2B_GLOBAL: {
    journeyStage: 'CONSIDERATION',
    // emotion: 'ANTICIPATION', // V5 REMOVED - use V1 psychology principles
    format: 'DATA',
    persona: 'DECISION_MAKER',
    cta: 'CTA_CONSULT',
    urgency: 'URGENT_LOW',
    lifecycle: 'LIFE_EVERGREEN',
  },
};
