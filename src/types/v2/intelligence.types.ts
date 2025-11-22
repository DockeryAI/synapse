/**
 * Intelligence Layer Types
 * Types for Opportunity Radar, Competitive Analysis, and Breakthrough Scoring
 */

// Opportunity Radar Types
export type OpportunityTier = 'urgent' | 'high-value' | 'evergreen';

export type OpportunitySource =
  | 'trending-topic'
  | 'weather-trigger'
  | 'seasonal'
  | 'competitor-gap'
  | 'customer-pain'
  | 'market-shift'
  | 'news-event';

export interface OpportunityAlert {
  id: string;
  tier: OpportunityTier;
  title: string;
  description: string;
  source: OpportunitySource;
  urgencyScore: number; // 0-100
  potentialImpact: number; // 0-100
  relevanceScore: number; // 0-100
  suggestedTemplates: string[];
  suggestedTriggers: string[];
  expiresAt?: string;
  detectedAt: string;
  metadata: {
    keywords?: string[];
    trendData?: {
      volume: number;
      growth: number;
      peak?: string;
    };
    weatherData?: {
      condition: string;
      temperature: number;
      location: string;
    };
    competitorData?: {
      competitor: string;
      gap: string;
    };
  };
}

export interface OpportunityRadarConfig {
  refreshInterval: number; // ms
  maxAlerts: number;
  tierThresholds: {
    urgent: number; // urgency score threshold
    highValue: number;
  };
  enabledSources: OpportunitySource[];
  industryFilter?: string;
}

export interface OpportunityRadarState {
  alerts: OpportunityAlert[];
  lastUpdated: string;
  isLoading: boolean;
  error?: string;
}

// Competitive Analysis Types
export interface CompetitorTheme {
  theme: string;
  frequency: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  examples: string[];
  lastSeen: string;
}

export interface CompetitorProfile {
  id: string;
  name: string;
  themes: CompetitorTheme[];
  contentFrequency: number; // posts per week
  engagement: {
    avgLikes: number;
    avgComments: number;
    avgShares: number;
  };
  lastAnalyzed: string;
}

export interface WhiteSpaceOpportunity {
  id: string;
  theme: string;
  description: string;
  competitorCoverage: number; // 0-100, how much competitors cover this
  yourCoverage: number; // 0-100
  opportunityScore: number; // 0-100
  suggestedAngles: string[];
}

export interface DifferentiationScore {
  overall: number; // 0-100
  factors: {
    uniqueThemes: number;
    voiceDifferentiation: number;
    audienceAlignment: number;
    contentQuality: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

// Breakthrough Scoring Types
export type ScoringFactorName =
  | 'timing'
  | 'uniqueness'
  | 'validation'
  | 'eq-match'
  | 'market-gap'
  | 'competitor-differentiation'
  | 'audience-alignment'
  | 'trend-relevance'
  | 'seasonal-fit'
  | 'pain-urgency'
  | 'solution-clarity';

export interface ScoringFactor {
  name: ScoringFactorName;
  weight: number; // 0-1, sum of all weights = 1
  score: number; // 0-100
  explanation: string;
  improvementTips?: string[];
}

export interface BreakthroughScore {
  overall: number; // 0-100
  tier: 'exceptional' | 'strong' | 'moderate' | 'weak';
  factors: ScoringFactor[];
  summary: string;
  topStrengths: string[];
  topWeaknesses: string[];
  industryBenchmark?: number;
  predictedPerformance: {
    engagement: number;
    reach: number;
    conversion: number;
  };
}

export interface ScoringConfig {
  industryWeights?: Partial<Record<ScoringFactorName, number>>;
  minimumScore?: number;
  benchmarkData?: {
    industry: string;
    avgScore: number;
    topPerformerScore: number;
  };
}

// Export all types
export type {
  OpportunityTier,
  OpportunitySource,
  OpportunityAlert,
  OpportunityRadarConfig,
  OpportunityRadarState,
  CompetitorTheme,
  CompetitorProfile,
  WhiteSpaceOpportunity,
  DifferentiationScore,
  ScoringFactorName,
  ScoringFactor,
  BreakthroughScore,
  ScoringConfig,
};
