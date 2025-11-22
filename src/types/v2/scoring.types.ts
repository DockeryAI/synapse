/**
 * Breakthrough Scoring Types
 * Types for the 11-factor scoring system
 */

export type ScoringFactorId =
  | 'timing'
  | 'uniqueness'
  | 'validation'
  | 'eq_match'
  | 'market_gap'
  | 'audience_alignment'
  | 'competitive_edge'
  | 'trend_relevance'
  | 'engagement_potential'
  | 'conversion_likelihood'
  | 'brand_consistency';

export interface ScoringFactor {
  id: ScoringFactorId;
  name: string;
  description: string;
  weight: number; // 0-1, all weights should sum to 1
  score: number; // 0-100
  weightedScore: number; // score * weight
  explanation: string;
  improvementSuggestion?: string;
}

export interface ScoreBreakdown {
  factors: ScoringFactor[];
  totalScore: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  percentile: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  overallExplanation: string;
}

export interface BreakthroughScore {
  id: string;
  contentId: string;
  timestamp: Date;
  breakdown: ScoreBreakdown;
  industryId?: string;
  segmentId?: string;
  metadata: {
    scoringVersion: string;
    calculationTimeMs: number;
    inputFactors: number;
  };
}

export interface ScoringInput {
  content: {
    title: string;
    hook: string;
    body: string;
    cta: string;
    templateType?: string;
  };
  context: {
    industryId?: string;
    targetAudience?: string;
    customerSegment?: string;
    platform?: string;
    campaignGoal?: string;
  };
  signals?: {
    trendingTopics?: string[];
    competitorContent?: string[];
    seasonalTriggers?: string[];
    historicalPerformance?: number;
  };
  eqProfile?: {
    emotionalTriggers?: Record<string, number>;
    tonePreference?: string;
    valueProposition?: string;
  };
}

export interface ScoringConfig {
  factorWeights?: Partial<Record<ScoringFactorId, number>>;
  industryOverrides?: Record<string, Partial<Record<ScoringFactorId, number>>>;
  minimumScore?: number;
  enableExplanations?: boolean;
}

export interface ScoreHistory {
  scores: BreakthroughScore[];
  averageScore: number;
  trend: 'improving' | 'stable' | 'declining';
  bestScore: BreakthroughScore | null;
}

export interface ScoreComparison {
  currentScore: BreakthroughScore;
  previousScore?: BreakthroughScore;
  improvement: number;
  factorChanges: Array<{
    factorId: ScoringFactorId;
    previousScore: number;
    currentScore: number;
    change: number;
  }>;
}

// Radar chart data for visualization
export interface RadarChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }>;
}

// Component props types
export interface BreakthroughScoreCardProps {
  score: BreakthroughScore;
  showRadar?: boolean;
  showSuggestions?: boolean;
  compact?: boolean;
  onFactorClick?: (factorId: ScoringFactorId) => void;
}
