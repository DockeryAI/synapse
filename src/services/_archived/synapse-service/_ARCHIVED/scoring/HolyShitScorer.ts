/**
 * Holy Shit Scorer
 *
 * Main scoring system that predicts "holy shit" reactions based on
 * 5 dimensions: unexpectedness, truthfulness, actionability, uniqueness, virality
 *
 * Created: 2025-11-10
 */

import {
  BreakthroughInsight,
  RankedInsight
} from '../../../types/breakthrough.types';
import { DeepContext } from '../../../types/deepContext.types';
import {
  HolyShitScore,
  DetailedScore,
  ScoringWeights,
  DEFAULT_SCORING_WEIGHTS,
  Reaction,
  REACTION_THRESHOLDS,
  BatchScoringResult
} from '../../../types/scoring.types';
import { DimensionScorers } from './DimensionScorers';
import { ReactionPredictor } from './ReactionPredictor';

const SCORER_VERSION = '1.0.0';

export class HolyShitScorer {
  private weights: ScoringWeights;
  private dimensionScorers: DimensionScorers;
  private predictor: ReactionPredictor;

  constructor(weights?: Partial<ScoringWeights>) {
    this.weights = { ...DEFAULT_SCORING_WEIGHTS, ...weights };
    this.dimensionScorers = new DimensionScorers();
    this.predictor = new ReactionPredictor();
  }

  /**
   * Score a single breakthrough insight
   */
  async scoreBreakthrough(
    insight: BreakthroughInsight,
    context: DeepContext
  ): Promise<HolyShitScore> {
    console.log(`[HolyShitScorer] Scoring insight: ${insight.insight.substring(0, 50)}...`);

    // Score all 5 dimensions in parallel
    const [
      unexpectednessScore,
      truthfulnessScore,
      actionabilityScore,
      uniquenessScore,
      viralityScore
    ] = await Promise.all([
      this.dimensionScorers.scoreUnexpectedness(insight, context),
      this.dimensionScorers.scoreTruthfulness(insight, context),
      this.dimensionScorers.scoreActionability(insight, context),
      this.dimensionScorers.scoreUniqueness(insight, context),
      this.dimensionScorers.scoreViralPotential(insight, context)
    ]);

    // Build breakdown
    const breakdown = {
      unexpectedness: unexpectednessScore.score,
      truthfulness: truthfulnessScore.score,
      actionability: actionabilityScore.score,
      uniqueness: uniquenessScore.score,
      virality: viralityScore.score
    };

    // Calculate weighted total (out of 100)
    const total = this.calculateTotalScore(breakdown);

    // Calculate confidence
    const confidence = this.calculateConfidence(insight, breakdown);

    // Predict reaction
    const prediction = this.predictor.predictReaction(total);

    // Generate reasoning
    const reasoning = this.predictor.explainPrediction(
      { total, breakdown, confidence, prediction } as HolyShitScore,
      insight
    );

    const score: HolyShitScore = {
      total: Math.round(total),
      breakdown,
      confidence,
      prediction,
      reasoning,
      metadata: {
        scoredAt: new Date(),
        version: SCORER_VERSION,
        weightsUsed: this.weights
      }
    };

    console.log(`[HolyShitScorer] Score: ${score.total}/100, Prediction: ${prediction}`);

    return score;
  }

  /**
   * Score with full detailed breakdown
   */
  async scoreBreakthroughDetailed(
    insight: BreakthroughInsight,
    context: DeepContext
  ): Promise<DetailedScore> {
    // Get all dimension scores
    const [
      unexpectednessScore,
      truthfulnessScore,
      actionabilityScore,
      uniquenessScore,
      viralityScore
    ] = await Promise.all([
      this.dimensionScorers.scoreUnexpectedness(insight, context),
      this.dimensionScorers.scoreTruthfulness(insight, context),
      this.dimensionScorers.scoreActionability(insight, context),
      this.dimensionScorers.scoreUniqueness(insight, context),
      this.dimensionScorers.scoreViralPotential(insight, context)
    ]);

    // Build basic score
    const basicScore = await this.scoreBreakthrough(insight, context);

    // Identify strengths and weaknesses
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (unexpectednessScore.normalized >= 0.8) strengths.push('Highly unexpected');
    else if (unexpectednessScore.normalized < 0.5) weaknesses.push('Could be more surprising');

    if (truthfulnessScore.normalized >= 0.8) strengths.push('Very well-evidenced');
    else if (truthfulnessScore.normalized < 0.5) weaknesses.push('Needs stronger evidence');

    if (actionabilityScore.normalized >= 0.8) strengths.push('Immediately actionable');
    else if (actionabilityScore.normalized < 0.6) weaknesses.push('Action steps unclear');

    if (uniquenessScore.normalized >= 0.8) strengths.push('Highly unique perspective');
    else if (uniquenessScore.normalized < 0.5) weaknesses.push('Similar to existing content');

    if (viralityScore.normalized >= 0.7) strengths.push('High viral potential');

    // Comparison to average (assume average is 60)
    const averageScore = 60;
    const percentile = this.calculatePercentile(basicScore.total, averageScore);
    const topPerformerIn: string[] = [];

    if (unexpectednessScore.normalized >= 0.8) topPerformerIn.push('unexpectedness');
    if (truthfulnessScore.normalized >= 0.8) topPerformerIn.push('truthfulness');
    if (actionabilityScore.normalized >= 0.8) topPerformerIn.push('actionability');
    if (uniquenessScore.normalized >= 0.8) topPerformerIn.push('uniqueness');
    if (viralityScore.normalized >= 0.8) topPerformerIn.push('virality');

    const detailedScore: DetailedScore = {
      ...basicScore,
      dimensions: {
        unexpectedness: unexpectednessScore,
        truthfulness: truthfulnessScore,
        actionability: actionabilityScore,
        uniqueness: uniquenessScore,
        virality: viralityScore
      },
      strengths,
      weaknesses,
      comparisonToAverage: {
        percentile,
        aboveAverage: basicScore.total > averageScore,
        topPerformerIn
      }
    };

    return detailedScore;
  }

  /**
   * Batch score multiple insights
   */
  async scoreBatch(
    insights: BreakthroughInsight[],
    context: DeepContext
  ): Promise<BatchScoringResult> {
    const startTime = Date.now();

    console.log(`[HolyShitScorer] Batch scoring ${insights.length} insights...`);

    // Score all insights
    const scores = await Promise.all(
      insights.map(insight => this.scoreBreakthrough(insight, context))
    );

    // Calculate statistics
    const totalScores = scores.map(s => s.total);
    const averageScore = totalScores.reduce((sum, s) => sum + s, 0) / totalScores.length;
    const sortedScores = [...totalScores].sort((a, b) => b - a);
    const medianScore = sortedScores[Math.floor(sortedScores.length / 2)];

    // Distribution by reaction
    const distribution: Record<Reaction, number> = {
      'holy shit': scores.filter(s => s.prediction === 'holy shit').length,
      'great': scores.filter(s => s.prediction === 'great').length,
      'good': scores.filter(s => s.prediction === 'good').length,
      'meh': scores.filter(s => s.prediction === 'meh').length
    };

    // Top scorers
    const topScorers = [...scores]
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const processingTimeMs = Date.now() - startTime;

    console.log(`[HolyShitScorer] Batch complete in ${processingTimeMs}ms`);
    console.log(`[HolyShitScorer] Average: ${averageScore.toFixed(1)}, Median: ${medianScore}`);
    console.log(`[HolyShitScorer] Distribution:`, distribution);

    return {
      scores,
      stats: {
        totalScored: insights.length,
        averageScore,
        medianScore,
        distribution,
        topScorers
      },
      metadata: {
        scoredAt: new Date(),
        processingTimeMs,
        version: SCORER_VERSION
      }
    };
  }

  /**
   * Score ranked insights (from BreakthroughRanker)
   */
  async scoreRankedInsights(
    rankedInsights: RankedInsight[],
    context: DeepContext
  ): Promise<Array<RankedInsight & { holyShitScore: HolyShitScore }>> {
    console.log(`[HolyShitScorer] Scoring ${rankedInsights.length} ranked insights...`);

    const scored = await Promise.all(
      rankedInsights.map(async (rankedInsight) => {
        const holyShitScore = await this.scoreBreakthrough(rankedInsight, context);
        return {
          ...rankedInsight,
          holyShitScore
        };
      })
    );

    return scored;
  }

  /**
   * Calculate total weighted score
   */
  private calculateTotalScore(breakdown: Record<string, number>): number {
    const total =
      breakdown.unexpectedness * this.weights.unexpectedness +
      breakdown.truthfulness * this.weights.truthfulness +
      breakdown.actionability * this.weights.actionability +
      breakdown.uniqueness * this.weights.uniqueness +
      breakdown.virality * this.weights.virality;

    // Normalize to 0-100 scale
    const maxPossible =
      30 * this.weights.unexpectedness +
      25 * this.weights.truthfulness +
      20 * this.weights.actionability +
      15 * this.weights.uniqueness +
      10 * this.weights.virality;

    return (total / maxPossible) * 100;
  }

  /**
   * Calculate confidence in the prediction
   */
  private calculateConfidence(
    insight: BreakthroughInsight,
    breakdown: Record<string, number>
  ): number {
    let confidence = 0.5; // Start neutral

    // Higher confidence if backed by evidence
    if (insight.evidence && insight.evidence.length >= 3) confidence += 0.2;
    else if (insight.evidence && insight.evidence.length >= 2) confidence += 0.1;

    // Higher confidence if multiple models agreed (convergence)
    const convergence = (insight.metadata as any).convergence || 1;
    if (convergence >= 4) confidence += 0.2;
    else if (convergence >= 3) confidence += 0.15;
    else if (convergence >= 2) confidence += 0.05;

    // Higher confidence if scores are consistent (not all over the place)
    const scores = Object.values(breakdown);
    const normalizedScores = [
      breakdown.unexpectedness / 30,
      breakdown.truthfulness / 25,
      breakdown.actionability / 20,
      breakdown.uniqueness / 15,
      breakdown.virality / 10
    ];

    const average = normalizedScores.reduce((sum, s) => sum + s, 0) / normalizedScores.length;
    const variance = normalizedScores.reduce((sum, s) => sum + Math.pow(s - average, 2), 0) / normalizedScores.length;
    const standardDeviation = Math.sqrt(variance);

    // Low variance = more confidence (scores are consistent)
    if (standardDeviation < 0.15) confidence += 0.1;
    else if (standardDeviation > 0.3) confidence -= 0.1;

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Calculate percentile relative to average
   */
  private calculatePercentile(score: number, average: number): number {
    // Simplified percentile calculation
    // Assumes normal distribution with mean=60, std=15
    const stdDev = 15;
    const zScore = (score - average) / stdDev;

    // Convert z-score to percentile (simplified)
    if (zScore >= 2) return 97.5;
    if (zScore >= 1.5) return 93;
    if (zScore >= 1) return 84;
    if (zScore >= 0.5) return 69;
    if (zScore >= 0) return 50;
    if (zScore >= -0.5) return 31;
    if (zScore >= -1) return 16;
    return 10;
  }

  /**
   * Update weights
   */
  updateWeights(weights: Partial<ScoringWeights>): void {
    this.weights = { ...this.weights, ...weights };
    console.log('[HolyShitScorer] Updated weights:', this.weights);
  }

  /**
   * Get current weights
   */
  getWeights(): ScoringWeights {
    return { ...this.weights };
  }

  /**
   * Reset to default weights
   */
  resetWeights(): void {
    this.weights = { ...DEFAULT_SCORING_WEIGHTS };
    console.log('[HolyShitScorer] Reset to default weights');
  }
}
