/**
 * Connection Scorer
 *
 * V1's scoring algorithm for ranking connections by breakthrough potential.
 *
 * Weights:
 * - Semantic Similarity: 30%
 * - Unexpectedness: 25%
 * - Psychology Relevance: 15%
 * - Competitive Advantage: 15%
 * - Timeliness: 10%
 * - Three-Way Bonus: +40%
 *
 * Impact Levels:
 * - ≥85: "Holy shit" breakthrough
 * - ≥80: High value
 * - ≥60: Good insight
 * - <60: Supporting evidence only
 */

import { type ConnectionHint } from './connection-hint-generator';
import { type ThreeWayConnection } from './three-way-detector';
import { type FilteredInsight } from '../dictionary-filter.service';

export interface ConnectionScore {
  semanticSimilarity: number;   // 0-100, 30% weight
  unexpectedness: number;       // 0-100, 25% weight
  psychologyRelevance: number;  // 0-100, 15% weight
  competitiveAdvantage: number; // 0-100, 15% weight
  timeliness: number;           // 0-100, 10% weight
  threeWayBonus: number;        // 0 or 40
  finalScore: number;           // 0-140 (100 base + 40 bonus max)
  impactLevel: 'breakthrough' | 'high' | 'good' | 'supporting';
}

export interface ScoredConnection {
  type: 'two-way' | 'three-way';
  insights: FilteredInsight[];
  score: ConnectionScore;
  formattedExplanation: string;
}

/**
 * Scoring weights
 */
const WEIGHTS = {
  semanticSimilarity: 0.30,
  unexpectedness: 0.25,
  psychologyRelevance: 0.15,
  competitiveAdvantage: 0.15,
  timeliness: 0.10,
};

const THREE_WAY_BONUS = 40;

/**
 * Score a two-way connection hint
 */
export function scoreTwoWayConnection(
  hint: ConnectionHint,
  psychologyRelevance: number = 50,
  competitiveAdvantage: number = 50,
  timeliness: number = 50
): ConnectionScore {
  const semanticSimilarity = hint.similarity * 100;
  const unexpectedness = hint.unexpectedness;

  const baseScore =
    semanticSimilarity * WEIGHTS.semanticSimilarity +
    unexpectedness * WEIGHTS.unexpectedness +
    psychologyRelevance * WEIGHTS.psychologyRelevance +
    competitiveAdvantage * WEIGHTS.competitiveAdvantage +
    timeliness * WEIGHTS.timeliness;

  const finalScore = baseScore; // No three-way bonus

  return {
    semanticSimilarity,
    unexpectedness,
    psychologyRelevance,
    competitiveAdvantage,
    timeliness,
    threeWayBonus: 0,
    finalScore,
    impactLevel: getImpactLevel(finalScore),
  };
}

/**
 * Score a three-way connection
 */
export function scoreThreeWayConnection(
  connection: ThreeWayConnection,
  psychologyRelevance: number = 50,
  competitiveAdvantage: number = 50,
  timeliness: number = 50
): ConnectionScore {
  const semanticSimilarity = connection.averageSimilarity * 100;

  // Three-way connections are inherently cross-domain, so high unexpectedness
  const unexpectedness = 90;

  const baseScore =
    semanticSimilarity * WEIGHTS.semanticSimilarity +
    unexpectedness * WEIGHTS.unexpectedness +
    psychologyRelevance * WEIGHTS.psychologyRelevance +
    competitiveAdvantage * WEIGHTS.competitiveAdvantage +
    timeliness * WEIGHTS.timeliness;

  const finalScore = baseScore + THREE_WAY_BONUS;

  return {
    semanticSimilarity,
    unexpectedness,
    psychologyRelevance,
    competitiveAdvantage,
    timeliness,
    threeWayBonus: THREE_WAY_BONUS,
    finalScore,
    impactLevel: getImpactLevel(finalScore),
  };
}

/**
 * Get impact level from score
 */
function getImpactLevel(score: number): ConnectionScore['impactLevel'] {
  if (score >= 85) return 'breakthrough';
  if (score >= 80) return 'high';
  if (score >= 60) return 'good';
  return 'supporting';
}

/**
 * Connection Scorer Service
 */
export class ConnectionScorer {
  /**
   * Score and rank all connections (two-way and three-way)
   */
  scoreAll(
    twoWayHints: ConnectionHint[],
    threeWayConnections: ThreeWayConnection[]
  ): ScoredConnection[] {
    const scored: ScoredConnection[] = [];

    // Score two-way connections
    for (const hint of twoWayHints) {
      const score = scoreTwoWayConnection(hint);

      scored.push({
        type: 'two-way',
        insights: [hint.insight1, hint.insight2],
        score,
        formattedExplanation: this.formatExplanation('two-way', score, [hint.insight1, hint.insight2]),
      });
    }

    // Score three-way connections
    for (const conn of threeWayConnections) {
      const score = scoreThreeWayConnection(conn);

      scored.push({
        type: 'three-way',
        insights: conn.insights,
        score,
        formattedExplanation: this.formatExplanation('three-way', score, conn.insights),
      });
    }

    // Sort by final score descending
    return scored.sort((a, b) => b.score.finalScore - a.score.finalScore);
  }

  /**
   * Get only breakthrough connections (≥85)
   */
  getBreakthroughs(scored: ScoredConnection[]): ScoredConnection[] {
    return scored.filter(s => s.score.impactLevel === 'breakthrough');
  }

  /**
   * Get high value connections (≥80)
   */
  getHighValue(scored: ScoredConnection[]): ScoredConnection[] {
    return scored.filter(s =>
      s.score.impactLevel === 'breakthrough' || s.score.impactLevel === 'high'
    );
  }

  /**
   * Format score explanation
   */
  private formatExplanation(
    type: 'two-way' | 'three-way',
    score: ConnectionScore,
    insights: FilteredInsight[]
  ): string {
    const emoji = score.impactLevel === 'breakthrough' ? '🔥' :
                  score.impactLevel === 'high' ? '⭐' :
                  score.impactLevel === 'good' ? '✓' : '·';

    const bonusText = score.threeWayBonus > 0 ? ` (+${score.threeWayBonus}% bonus)` : '';

    const lines = [
      `${emoji} ${score.impactLevel.toUpperCase()} ${type} connection (${score.finalScore.toFixed(1)}${bonusText})`,
      `   Similarity: ${score.semanticSimilarity.toFixed(0)}% | Unexpectedness: ${score.unexpectedness.toFixed(0)}%`,
    ];

    for (const insight of insights) {
      lines.push(`   • [${insight.source}] ${insight.text.substring(0, 70)}...`);
    }

    return lines.join('\n');
  }

  /**
   * Get summary statistics
   */
  getSummary(scored: ScoredConnection[]): {
    total: number;
    byImpact: Record<ConnectionScore['impactLevel'], number>;
    byType: { twoWay: number; threeWay: number };
    topScore: number;
  } {
    const byImpact = {
      breakthrough: 0,
      high: 0,
      good: 0,
      supporting: 0,
    };

    let twoWay = 0;
    let threeWay = 0;
    let topScore = 0;

    for (const conn of scored) {
      byImpact[conn.score.impactLevel]++;
      if (conn.type === 'two-way') twoWay++;
      else threeWay++;
      if (conn.score.finalScore > topScore) topScore = conn.score.finalScore;
    }

    return {
      total: scored.length,
      byImpact,
      byType: { twoWay, threeWay },
      topScore,
    };
  }
}
