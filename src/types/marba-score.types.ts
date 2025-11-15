// Type definitions for MARBA Scoring System
// MARBA = Messaging + Authenticity + Relevance + Brand Alignment + Action

export interface MARBAScore {
  overall: number;
  breakdown: MARBABreakdown;
  insights: MARBAInsight[];
  recommendations: string[];
  calculated_at: string;
  version: string;
}

export interface MARBABreakdown {
  messaging: MessagingScore;
  authenticity: AuthenticityScore;
  relevance: RelevanceScore;
  brand_alignment: BrandAlignmentScore;
  action: ActionScore;
}

// M - Messaging (20 points)
export interface MessagingScore {
  total: number;
  max: 20;
  components: {
    clarity: ComponentScore;
    value_proposition: ComponentScore;
    differentiation: ComponentScore;
    consistency: ComponentScore;
  };
  details: string[];
}

// A - Authenticity (20 points)
export interface AuthenticityScore {
  total: number;
  max: 20;
  components: {
    brand_voice: ComponentScore;
    transparency: ComponentScore;
    human_connection: ComponentScore;
    social_proof: ComponentScore;
  };
  details: string[];
}

// R - Relevance (20 points)
export interface RelevanceScore {
  total: number;
  max: 20;
  components: {
    audience_alignment: ComponentScore;
    timeliness: ComponentScore;
    context_awareness: ComponentScore;
    personalization: ComponentScore;
  };
  details: string[];
}

// B - Brand Alignment (20 points)
export interface BrandAlignmentScore {
  total: number;
  max: 20;
  components: {
    visual_consistency: ComponentScore;
    tone_match: ComponentScore;
    values_alignment: ComponentScore;
    positioning: ComponentScore;
  };
  details: string[];
}

// A - Action (20 points)
export interface ActionScore {
  total: number;
  max: 20;
  components: {
    clear_cta: ComponentScore;
    urgency: ComponentScore;
    friction_reduction: ComponentScore;
    conversion_optimization: ComponentScore;
  };
  details: string[];
}

export interface ComponentScore {
  score: number;
  max: number;
  weight: number;
  rationale: string;
  improvement_suggestions?: string[];
}

export interface MARBAInsight {
  category: 'strength' | 'weakness' | 'opportunity' | 'threat';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact_on_score: number;
  action_items?: string[];
}

// Analysis Context
export interface MARBAAnalysisContext {
  content_type: string;
  platform: string;
  target_audience?: string[];
  industry?: string;
  competitors?: string[];
  brand_guidelines?: BrandGuidelines;
}

export interface BrandGuidelines {
  voice_attributes: string[];
  core_values: string[];
  visual_identity: {
    primary_colors: string[];
    fonts: string[];
    logo_usage: string;
  };
  messaging_pillars: string[];
  prohibited_terms?: string[];
}

// Historical Tracking
export interface MARBAScoreHistory {
  content_item_id: string;
  scores: MARBAScoreSnapshot[];
  trend: 'improving' | 'declining' | 'stable';
  average_score: number;
  best_performing_category: string;
  worst_performing_category: string;
}

export interface MARBAScoreSnapshot {
  score: MARBAScore;
  timestamp: string;
  version: string;
  context?: Record<string, any>;
}

// Benchmarking
export interface MARBABenchmark {
  industry_average: number;
  top_quartile: number;
  account_average: number;
  similar_content_average: number;
  percentile_rank: number;
}

// Optimization Suggestions
export interface MARBAOptimization {
  current_score: number;
  potential_score: number;
  quick_wins: OptimizationSuggestion[];
  long_term_improvements: OptimizationSuggestion[];
  estimated_impact: number;
}

export interface OptimizationSuggestion {
  category: keyof MARBABreakdown;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimated_score_increase: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  implementation_steps?: string[];
}

// Content Comparison
export interface MARBAComparison {
  content_a_id: string;
  content_b_id: string;
  score_a: MARBAScore;
  score_b: MARBAScore;
  winner: 'a' | 'b' | 'tie';
  key_differences: string[];
  recommendation: string;
}

// A/B Testing
export interface MARBAABTest {
  id: string;
  variant_a: {
    content: string;
    score: MARBAScore;
    performance?: ContentPerformanceMetrics;
  };
  variant_b: {
    content: string;
    score: MARBAScore;
    performance?: ContentPerformanceMetrics;
  };
  winner?: 'a' | 'b' | 'inconclusive';
  confidence_level?: number;
  started_at: string;
  ended_at?: string;
}

export interface ContentPerformanceMetrics {
  impressions: number;
  engagement_rate: number;
  click_through_rate: number;
  conversion_rate: number;
  cost_per_result?: number;
}

// Real-time Scoring
export interface RealtimeMARBAScore {
  content: string;
  score: MARBAScore;
  streaming: boolean;
  partial?: boolean;
  confidence: number;
}
