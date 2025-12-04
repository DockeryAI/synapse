/**
 * Breakthrough Ranker
 *
 * Ranks breakthrough insights by their breakthrough potential using
 * 6 weighted factors:
 * 1. Unexpectedness (25%)
 * 2. Actionability (20%)
 * 3. Timeliness (15%)
 * 4. Evidence Quality (15%)
 * 5. Convergence (15%) - how many models agreed
 * 6. Confidence (10%)
 *
 * Created: 2025-11-10
 */

import {
  BreakthroughInsight,
  RankedInsight,
  RankingWeights,
  DEFAULT_RANKING_WEIGHTS
} from '../../../types/breakthrough.types';
import { DeepContext } from '../../../types/deepContext.types';

export class BreakthroughRanker {
  private weights: RankingWeights;

  constructor(weights?: Partial<RankingWeights>) {
    this.weights = { ...DEFAULT_RANKING_WEIGHTS, ...weights };
  }

  /**
   * Rank insights by breakthrough potential
   */
  rankByBreakthroughPotential(
    insights: BreakthroughInsight[],
    context?: DeepContext
  ): RankedInsight[] {
    console.log(`[BreakthroughRanker] Ranking ${insights.length} insights...`);

    // Score each insight
    const ranked = insights.map(insight => this.scoreInsight(insight, context));

    // Sort by score (descending)
    ranked.sort((a, b) => b.rankingScore - a.rankingScore);

    console.log(`[BreakthroughRanker] Top score: ${ranked[0]?.rankingScore || 0}`);
    console.log(`[BreakthroughRanker] Average score: ${this.averageScore(ranked)}`);

    return ranked;
  }

  /**
   * Score a single insight
   */
  private scoreInsight(
    insight: BreakthroughInsight,
    context?: DeepContext
  ): RankedInsight {
    // Calculate individual factor scores
    const unexpectedness = this.scoreUnexpectedness(insight, context);
    const actionability = this.scoreActionability(insight);
    const timeliness = this.scoreTimeliness(insight, context);
    const evidence = this.scoreEvidence(insight);
    const convergence = this.scoreConvergence(insight);
    const confidence = insight.confidence;

    // Calculate weighted total (0-100 scale)
    const rankingScore =
      unexpectedness * this.weights.unexpectedness * 100 +
      actionability * this.weights.actionability * 100 +
      timeliness * this.weights.timeliness * 100 +
      evidence * this.weights.evidence * 100 +
      convergence * this.weights.convergence * 100 +
      confidence * this.weights.confidence * 100;

    return {
      ...insight,
      rankingScore: Math.round(rankingScore),
      ranking: {
        unexpectedness,
        actionability,
        timeliness,
        evidence,
        convergence,
        confidence
      },
      convergence: (insight.metadata as any).convergence || 1
    };
  }

  /**
   * FACTOR 1: Unexpectedness (0-1)
   * How surprising is this insight?
   */
  private scoreUnexpectedness(insight: BreakthroughInsight, context?: DeepContext): number {
    let score = 0.5; // Start neutral

    const insightLower = insight.insight.toLowerCase();

    // Check for unexpected language
    const unexpectedWords = [
      'unexpected', 'surprising', 'counter', 'opposite', 'contrary',
      'hidden', 'secret', 'missed', 'overlooked', 'paradox',
      'nobody', 'everyone thinks'
    ];

    const hasUnexpectedLanguage = unexpectedWords.some(word => insightLower.includes(word));
    if (hasUnexpectedLanguage) score += 0.2;

    // Check for counter-intuitive type
    if (insight.type === 'counter_intuitive') score += 0.2;

    // Check for cross-domain connections
    if (insight.sourceConnection) {
      const sources = [
        insight.sourceConnection.sources.primary.source,
        insight.sourceConnection.sources.secondary.source,
        insight.sourceConnection.sources.tertiary?.source
      ].filter(s => s);

      const uniqueSources = new Set(sources).size;
      if (uniqueSources >= 3) score += 0.3;
      else if (uniqueSources >= 2) score += 0.2;
    }

    // Penalty for obvious statements
    const obviousWords = ['obviously', 'clearly', 'naturally', 'of course'];
    if (obviousWords.some(word => insightLower.includes(word))) score -= 0.3;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * FACTOR 2: Actionability (0-1)
   * Can we act on this immediately?
   */
  private scoreActionability(insight: BreakthroughInsight): number {
    let score = 0.5;

    // Check content angle specificity
    if (insight.contentAngle.length > 30) score += 0.2; // Specific
    if (insight.contentAngle.length > 50) score += 0.1; // Very specific

    // Check for actionable language
    const actionableWords = [
      'create', 'write', 'post', 'publish', 'share',
      'how to', 'guide', 'template', 'framework', 'step'
    ];

    const contentAngleLower = insight.contentAngle.toLowerCase();
    const hasActionable = actionableWords.some(word => contentAngleLower.includes(word));
    if (hasActionable) score += 0.2;

    // Penalty for vague language
    const vagueWords = ['maybe', 'possibly', 'might', 'could consider', 'think about'];
    if (vagueWords.some(word => contentAngleLower.includes(word))) score -= 0.3;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * FACTOR 3: Timeliness (0-1)
   * How time-sensitive is this?
   */
  private scoreTimeliness(insight: BreakthroughInsight, context?: DeepContext): number {
    let score = 0.3; // Start low (most insights aren't immediately timely)

    const whyNowLower = insight.whyNow.toLowerCase();

    // Check for urgency language
    const urgentWords = [
      'now', 'today', 'this week', 'immediate', 'urgent',
      'right now', 'asap', 'quickly'
    ];

    if (urgentWords.some(word => whyNowLower.includes(word))) score += 0.3;

    // Check for cultural moment or predictive type
    if (insight.type === 'cultural_moment') score += 0.2;
    if (insight.type === 'predictive_opportunity') score += 0.25;

    // Check if connected to trending topics
    if (context?.realTimeCultural?.trendingTopics) {
      const trendingWords = context.realTimeCultural.trendingTopics
        .slice(0, 10)
        .map(t => t.topic.toLowerCase());

      const insightLower = insight.insight.toLowerCase();
      const connectsToTrending = trendingWords.some(word =>
        insightLower.includes(word.split(' ')[0])
      );

      if (connectsToTrending) score += 0.25;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * FACTOR 4: Evidence Quality (0-1)
   * How well-supported is this?
   */
  private scoreEvidence(insight: BreakthroughInsight): number {
    let score = 0.0;

    // Evidence quantity
    const evidenceCount = insight.evidence.length;
    if (evidenceCount >= 5) score += 0.4;
    else if (evidenceCount >= 3) score += 0.3;
    else if (evidenceCount >= 2) score += 0.2;
    else if (evidenceCount >= 1) score += 0.1;

    // Evidence quality (specificity)
    const avgLength = insight.evidence.reduce((sum, e) => sum + e.length, 0) / (evidenceCount || 1);
    if (avgLength > 60) score += 0.3; // Very specific
    else if (avgLength > 40) score += 0.2; // Specific
    else if (avgLength > 20) score += 0.1; // Somewhat specific

    // Bonus for connection to discovered data
    if (insight.sourceConnection) score += 0.3;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * FACTOR 5: Convergence (0-1)
   * How many models agreed on this?
   */
  private scoreConvergence(insight: BreakthroughInsight): number {
    const convergence = (insight.metadata as any).convergence || 1;

    // Map convergence count to score
    if (convergence >= 4) return 1.0; // All 4 models agreed - very strong
    if (convergence >= 3) return 0.85; // 3 models agreed - strong
    if (convergence >= 2) return 0.65; // 2 models agreed - moderate
    return 0.4; // Only 1 model - weak
  }

  /**
   * Calculate average score
   */
  private averageScore(insights: RankedInsight[]): number {
    if (insights.length === 0) return 0;
    const sum = insights.reduce((acc, i) => acc + i.rankingScore, 0);
    return Math.round(sum / insights.length);
  }

  /**
   * Filter by minimum score
   */
  filterByScore(insights: RankedInsight[], minScore: number): RankedInsight[] {
    return insights.filter(i => i.rankingScore >= minScore);
  }

  /**
   * Get top N insights
   */
  getTopN(insights: RankedInsight[], n: number): RankedInsight[] {
    return insights.slice(0, n);
  }

  /**
   * Update ranking weights
   */
  updateWeights(weights: Partial<RankingWeights>): void {
    this.weights = { ...this.weights, ...weights };
  }

  /**
   * Get current weights
   */
  getWeights(): RankingWeights {
    return { ...this.weights };
  }
}
