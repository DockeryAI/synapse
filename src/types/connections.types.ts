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
  | 'apify';

// Data point types for categorization
export type DataPointType =
  | 'customer_trigger'
  | 'trending_topic'
  | 'competitive_gap'
  | 'timing'
  | 'market_trend'
  | 'sentiment'
  | 'behavior_pattern';

// Embedding model configuration
export const EMBEDDING_MODEL = 'text-embedding-3-small';
export const EMBEDDING_DIMENSIONS = 1536;
export const EMBEDDING_COST_PER_1M_TOKENS = 0.02;

// Data point interface with embeddings
export interface DataPoint {
  source: DataSource;
  type: DataPointType;
  content: string;
  metadata?: Record<string, any>;
  timestamp: string;
  confidence: number;
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

export interface Connection {
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

export interface DeepContext {
  brand_id: string
  industry: string
  keywords: string[]
  triggers: string[]
  competitors: any[]
  content_gaps: any[]
  current_opportunities: any[]
  seo_data: any
  weather_data: any
  trend_data: any
  archetype: string
  brand_voice: string
  target_personas: any[]
  benchmarks: any
}

export interface ConnectionDiscoveryOptions {
  minBreakthroughScore?: number // 0-1, default 0.7
  maxConnections?: number // default 20
  includeWeakSignals?: boolean // default true
  focusAreas?: Array<'customer_psychology' | 'market_trends' | 'competitive_gaps' | 'timing' | 'channels'>
}

// Default options for connection discovery
export const DEFAULT_DISCOVERY_OPTIONS: Required<ConnectionDiscoveryOptions> = {
  minBreakthroughScore: 0.7,
  maxConnections: 20,
  includeWeakSignals: true,
  focusAreas: ['customer_psychology', 'market_trends', 'competitive_gaps', 'timing', 'channels']
}

export interface ConnectionDiscoveryResult {
  connections: Connection[]
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
  psychologyInvolvement: number;
  competitiveAdvantage: number;
  timeliness: number;
  threeWayBonus: number;
}

// Default scoring weights (must sum to ~100%)
export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  semanticSimilarity: 0.30,
  unexpectedness: 0.25,
  psychologyInvolvement: 0.15,
  competitiveAdvantage: 0.15,
  timeliness: 0.10,
  threeWayBonus: 0.40, // Applied separately for 3+ way connections
};

// Breakthrough potential assessment
export interface BreakthroughPotential {
  score: number; // 0-1
  reasoning: string;
  factors: {
    semanticSimilarity: number;
    unexpectedness: number;
    psychologyInvolvement: number;
    competitiveAdvantage: number;
    timeliness: number;
  };
}

// Expected impact categories
export type ExpectedImpact = 'low' | 'medium' | 'high' | 'breakthrough';
