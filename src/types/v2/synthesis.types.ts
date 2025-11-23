/**
 * Synthesis Types - Data synthesis and combination
 */

export interface SynthesisConfig {
  sources: string[];
  weights?: Record<string, number>;
}

export interface SynthesisResult {
  combined: string;
  sources: string[];
  confidence: number;
}
