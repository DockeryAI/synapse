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
  | 'twitter'
  | 'apify'
  | 'perplexity'
  | 'semrush'
  | 'website'
  | 'linkedin'
  | 'tiktok'
  | 'google_trends';

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
  | 'keyword_gap'
  | 'question'
  | 'people_also_ask'
  | 'search_intent'
  | 'news_story'
  | 'weather_trigger';

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
    domain?: 'psychology' | 'timing' | 'competitive' | 'content_gap' | 'search_intent';
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
