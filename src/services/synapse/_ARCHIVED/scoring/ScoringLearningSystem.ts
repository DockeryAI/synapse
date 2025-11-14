/**
 * Scoring Learning System
 *
 * Machine learning-ready system that learns from actual outcomes
 * to improve prediction accuracy over time
 *
 * Created: 2025-11-10
 */

import {
  BreakthroughOutcome,
  LearningData,
  ErrorPattern,
  ScoringWeights,
  DEFAULT_SCORING_WEIGHTS,
  Reaction
} from '../../../types/scoring.types';

export class ScoringLearningSystem {
  private learningData: LearningData;

  constructor() {
    this.learningData = this.initializeLearningData();
  }

  /**
   * Learn from a batch of outcomes
   */
  async learn(outcomes: BreakthroughOutcome[]): Promise<void> {
    console.log(`[ScoringLearningSystem] Learning from ${outcomes.length} outcomes...`);

    // Add outcomes to history
    this.learningData.outcomes.push(...outcomes);

    // Analyze errors
    const errorPatterns = this.analyzeErrors(outcomes);
    this.learningData.errorPatterns = errorPatterns;

    // Optimize weights based on what actually predicts success
    const newWeights = this.optimizeWeights(outcomes);
    this.learningData.currentWeights = newWeights;

    // Calculate performance metrics
    this.learningData.performance = this.calculatePerformance(outcomes);

    // Update timestamp
    this.learningData.lastUpdated = new Date();

    console.log('[ScoringLearningSystem] Learning complete');
    console.log('  New weights:', newWeights);
    console.log('  Performance:', this.learningData.performance);
    console.log('  Error patterns found:', errorPatterns.length);
  }

  /**
   * Analyze systematic errors
   */
  private analyzeErrors(outcomes: BreakthroughOutcome[]): ErrorPattern[] {
    const errorPatterns: ErrorPattern[] = [];

    if (outcomes.length < 10) {
      console.log('[ScoringLearningSystem] Not enough data for error analysis (need 10+)');
      return errorPatterns;
    }

    // Calculate errors for each dimension
    const dimensions: Array<keyof ScoringWeights> = [
      'unexpectedness',
      'truthfulness',
      'actionability',
      'uniqueness',
      'virality'
    ];

    for (const dimension of dimensions) {
      const errors = outcomes.map(o => {
        const predicted = o.predictedScore.breakdown[dimension];
        // Estimate actual dimension score from overall feedback
        const actual = this.estimateActualDimensionScore(o, dimension);
        return actual - predicted;
      });

      const averageError = errors.reduce((sum, e) => sum + e, 0) / errors.length;
      const absAverageError = Math.abs(averageError);

      // Only flag if error is significant
      if (absAverageError > 3) {
        const errorType: 'overestimate' | 'underestimate' | 'inconsistent' =
          averageError > 0 ? 'underestimate' : 'overestimate';

        // Calculate consistency (standard deviation)
        const variance = errors.reduce((sum, e) => sum + Math.pow(e - averageError, 2), 0) / errors.length;
        const stdDev = Math.sqrt(variance);
        const isInconsistent = stdDev > 5;

        errorPatterns.push({
          dimension,
          errorType: isInconsistent ? 'inconsistent' : errorType,
          averageError,
          sampleSize: outcomes.length,
          confidence: Math.min(outcomes.length / 50, 1.0), // Higher confidence with more data
          suggestedFix: this.suggestFix(dimension, errorType, averageError)
        });
      }
    }

    return errorPatterns;
  }

  /**
   * Optimize weights based on what actually predicts success
   */
  private optimizeWeights(outcomes: BreakthroughOutcome[]): ScoringWeights {
    if (outcomes.length < 20) {
      console.log('[ScoringLearningSystem] Not enough data for weight optimization (need 20+)');
      return this.learningData.currentWeights;
    }

    // Calculate correlation between each dimension and actual success
    const dimensions: Array<keyof ScoringWeights> = [
      'unexpectedness',
      'truthfulness',
      'actionability',
      'uniqueness',
      'virality'
    ];

    const correlations = dimensions.map(dimension => ({
      dimension,
      correlation: this.calculateCorrelation(outcomes, dimension)
    }));

    // Normalize correlations to weights (sum to 1.0)
    const totalCorrelation = correlations.reduce((sum, c) => sum + Math.abs(c.correlation), 0);

    if (totalCorrelation === 0) {
      console.log('[ScoringLearningSystem] No correlation found, keeping current weights');
      return this.learningData.currentWeights;
    }

    const newWeights: ScoringWeights = {} as ScoringWeights;

    correlations.forEach(({ dimension, correlation }) => {
      // Use absolute correlation for weight (direction doesn't matter)
      newWeights[dimension] = Math.abs(correlation) / totalCorrelation;
    });

    // Smooth with existing weights (don't change too dramatically)
    const smoothingFactor = 0.3; // 30% new, 70% old
    const smoothedWeights: ScoringWeights = {} as ScoringWeights;

    dimensions.forEach(dimension => {
      smoothedWeights[dimension] =
        newWeights[dimension] * smoothingFactor +
        this.learningData.currentWeights[dimension] * (1 - smoothingFactor);
    });

    return smoothedWeights;
  }

  /**
   * Calculate correlation between dimension and success
   */
  private calculateCorrelation(
    outcomes: BreakthroughOutcome[],
    dimension: keyof ScoringWeights
  ): number {
    if (outcomes.length < 2) return 0;

    const x = outcomes.map(o => o.predictedScore.breakdown[dimension]);
    const y = outcomes.map(o => this.outcomeToScore(o));

    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    if (denominator === 0) return 0;

    return numerator / denominator;
  }

  /**
   * Convert outcome to numeric score
   */
  private outcomeToScore(outcome: BreakthroughOutcome): number {
    // Use actual score if available
    if (outcome.actualScore) return outcome.actualScore;

    // Otherwise use reaction
    const reactionScores: Record<Reaction, number> = {
      'holy shit': 90,
      'great': 75,
      'good': 60,
      'meh': 40
    };

    let score = reactionScores[outcome.userReaction] || 50;

    // Adjust based on engagement if available
    if (outcome.outcome.engagement) {
      const { views, likes, shares, comments } = outcome.outcome.engagement;
      const engagementRate = ((likes + shares + comments) / views) * 100;

      if (engagementRate > 10) score += 10;
      else if (engagementRate > 5) score += 5;
      else if (engagementRate < 1) score -= 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Estimate actual dimension score from overall outcome
   */
  private estimateActualDimensionScore(
    outcome: BreakthroughOutcome,
    dimension: keyof ScoringWeights
  ): number {
    const overallScore = this.outcomeToScore(outcome);

    // Simple estimation: proportional to overall score
    const maxScores = {
      unexpectedness: 30,
      truthfulness: 25,
      actionability: 20,
      uniqueness: 15,
      virality: 10
    };

    return (overallScore / 100) * maxScores[dimension];
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformance(outcomes: BreakthroughOutcome[]): {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  } {
    if (outcomes.length === 0) {
      return { accuracy: 0, precision: 0, recall: 0, f1Score: 0 };
    }

    // Calculate accuracy (predicted reaction === actual reaction)
    const correct = outcomes.filter(o =>
      o.predictedScore.prediction === o.userReaction
    ).length;

    const accuracy = correct / outcomes.length;

    // Calculate precision and recall for "holy shit" predictions
    const predictedHolyShit = outcomes.filter(o =>
      o.predictedScore.prediction === 'holy shit'
    );

    const actualHolyShit = outcomes.filter(o =>
      o.userReaction === 'holy shit'
    );

    const truePositives = outcomes.filter(o =>
      o.predictedScore.prediction === 'holy shit' &&
      o.userReaction === 'holy shit'
    ).length;

    const precision = predictedHolyShit.length > 0
      ? truePositives / predictedHolyShit.length
      : 0;

    const recall = actualHolyShit.length > 0
      ? truePositives / actualHolyShit.length
      : 0;

    const f1Score = (precision + recall) > 0
      ? 2 * (precision * recall) / (precision + recall)
      : 0;

    return { accuracy, precision, recall, f1Score };
  }

  /**
   * Suggest fix for error pattern
   */
  private suggestFix(
    dimension: keyof ScoringWeights,
    errorType: 'overestimate' | 'underestimate',
    averageError: number
  ): string {
    const direction = errorType === 'overestimate' ? 'lower' : 'higher';

    return `${dimension} scores tend to be ${errorType}d by ~${Math.abs(averageError).toFixed(1)} points. Consider adjusting scoring thresholds ${direction}.`;
  }

  /**
   * Initialize learning data
   */
  private initializeLearningData(): LearningData {
    return {
      outcomes: [],
      currentWeights: { ...DEFAULT_SCORING_WEIGHTS },
      errorPatterns: [],
      performance: {
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1Score: 0
      },
      lastUpdated: new Date()
    };
  }

  /**
   * Get learning data
   */
  getLearningData(): LearningData {
    return { ...this.learningData };
  }

  /**
   * Get current optimized weights
   */
  getOptimizedWeights(): ScoringWeights {
    return { ...this.learningData.currentWeights };
  }

  /**
   * Export learning data for persistence
   */
  exportLearningData(): string {
    return JSON.stringify({
      ...this.learningData,
      outcomes: this.learningData.outcomes.map(o => ({
        ...o,
        timestamp: o.timestamp.toISOString()
      })),
      lastUpdated: this.learningData.lastUpdated.toISOString()
    }, null, 2);
  }

  /**
   * Import learning data
   */
  importLearningData(json: string): void {
    try {
      const data = JSON.parse(json);

      this.learningData = {
        ...data,
        outcomes: data.outcomes.map((o: any) => ({
          ...o,
          timestamp: new Date(o.timestamp)
        })),
        lastUpdated: new Date(data.lastUpdated)
      };

      console.log(`[ScoringLearningSystem] Imported learning data with ${this.learningData.outcomes.length} outcomes`);
    } catch (error) {
      console.error('[ScoringLearningSystem] Failed to import learning data:', error);
    }
  }

  /**
   * Reset learning data
   */
  reset(): void {
    this.learningData = this.initializeLearningData();
    console.log('[ScoringLearningSystem] Reset learning data');
  }
}
