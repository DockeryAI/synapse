/**
 * Quality Types - Quality scoring and metrics
 */

export interface QualityScore {
  overall: number;
  breakdown: Record<string, number>;
}

export interface QualityMetrics {
  score: number;
  confidence: number;
  factors: string[];
}
