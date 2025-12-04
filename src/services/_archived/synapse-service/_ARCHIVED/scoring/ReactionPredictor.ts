/**
 * Reaction Predictor
 *
 * Predicts audience reactions ('meh', 'good', 'great', 'holy shit')
 * based on Holy Shit Scores
 *
 * Created: 2025-11-10
 */

import {
  Reaction,
  HolyShitScore,
  REACTION_THRESHOLDS
} from '../../../types/scoring.types';
import { BreakthroughInsight } from '../../../types/breakthrough.types';

export class ReactionPredictor {
  /**
   * Predict reaction based on total score
   */
  predictReaction(score: number): Reaction {
    if (score >= REACTION_THRESHOLDS['holy shit']) return 'holy shit';
    if (score >= REACTION_THRESHOLDS['great']) return 'great';
    if (score >= REACTION_THRESHOLDS['good']) return 'good';
    return 'meh';
  }

  /**
   * Explain the prediction with detailed reasoning
   */
  explainPrediction(score: HolyShitScore, insight: BreakthroughInsight): string[] {
    const reasons: string[] = [];

    // Add prediction context
    reasons.push(this.getPredictionContext(score.prediction, score.total));

    // Analyze strengths (positive contributors)
    const strengths = this.identifyStrengths(score);
    reasons.push(...strengths);

    // Analyze weaknesses (areas for improvement)
    const weaknesses = this.identifyWeaknesses(score);
    reasons.push(...weaknesses);

    // Add confidence note if low
    if (score.confidence < 0.6) {
      reasons.push(`⚠️ Moderate confidence (${Math.round(score.confidence * 100)}%) - prediction may vary`);
    }

    return reasons;
  }

  /**
   * Get context for the prediction
   */
  private getPredictionContext(prediction: Reaction, score: number): string {
    switch (prediction) {
      case 'holy shit':
        return `🔥 HOLY SHIT (${score}/100) - This is breakthrough content that will genuinely wow your audience`;
      case 'great':
        return `⭐ GREAT (${score}/100) - Strong content that will perform well and generate engagement`;
      case 'good':
        return `✓ GOOD (${score}/100) - Solid content that will provide value to your audience`;
      case 'meh':
        return `⚡ MEH (${score}/100) - This content needs strengthening before publishing`;
    }
  }

  /**
   * Identify strengths from breakdown
   */
  private identifyStrengths(score: HolyShitScore): string[] {
    const strengths: string[] = [];

    // Check each dimension against thresholds
    if (score.breakdown.unexpectedness >= 25) {
      strengths.push('✨ Highly unexpected - will genuinely surprise audience');
    } else if (score.breakdown.unexpectedness >= 20) {
      strengths.push('✨ Unexpected - brings fresh perspective');
    }

    if (score.breakdown.truthfulness >= 20) {
      strengths.push('📊 Very well-evidenced - strong credibility');
    } else if (score.breakdown.truthfulness >= 17) {
      strengths.push('📊 Well-supported - good evidence base');
    }

    if (score.breakdown.actionability === 20) {
      strengths.push('🎯 Perfectly actionable - ready to execute immediately');
    } else if (score.breakdown.actionability >= 16) {
      strengths.push('🎯 Highly actionable - clear next steps');
    }

    if (score.breakdown.uniqueness >= 12) {
      strengths.push('💎 Highly unique - competitors aren\'t doing this');
    } else if (score.breakdown.uniqueness >= 10) {
      strengths.push('💎 Unique angle - differentiates from competition');
    }

    if (score.breakdown.virality >= 8) {
      strengths.push('🔥 High viral potential - likely to spread organically');
    } else if (score.breakdown.virality >= 6) {
      strengths.push('🔥 Good shareability - will generate social engagement');
    }

    return strengths;
  }

  /**
   * Identify weaknesses from breakdown
   */
  private identifyWeaknesses(score: HolyShitScore): string[] {
    const weaknesses: string[] = [];

    // Check each dimension for low scores
    if (score.breakdown.unexpectedness < 15) {
      weaknesses.push('⚠️ Could be more unexpected - try stronger contrast or surprising connection');
    }

    if (score.breakdown.truthfulness < 13) {
      weaknesses.push('⚠️ Needs stronger evidence - add specific data, examples, or research');
    }

    if (score.breakdown.actionability < 12) {
      weaknesses.push('⚠️ Action steps unclear - make the "what to do" more specific');
    }

    if (score.breakdown.uniqueness < 8) {
      weaknesses.push('⚠️ Similar to existing content - find a more unique angle');
    }

    if (score.breakdown.virality < 4) {
      weaknesses.push('⚠️ Low viral potential - add controversy, emotion, or social currency');
    }

    return weaknesses;
  }

  /**
   * Get improvement suggestions
   */
  getImprovementSuggestions(score: HolyShitScore): string[] {
    const suggestions: string[] = [];

    // Prioritize improvements by impact
    const improvements = [
      { dimension: 'unexpectedness', current: score.breakdown.unexpectedness, max: 30 },
      { dimension: 'truthfulness', current: score.breakdown.truthfulness, max: 25 },
      { dimension: 'actionability', current: score.breakdown.actionability, max: 20 },
      { dimension: 'uniqueness', current: score.breakdown.uniqueness, max: 15 },
      { dimension: 'virality', current: score.breakdown.virality, max: 10 }
    ];

    // Sort by gap from maximum
    improvements.sort((a, b) => {
      const gapA = (a.max - a.current) / a.max;
      const gapB = (b.max - b.current) / b.max;
      return gapB - gapA;
    });

    // Provide suggestions for top 3 weakest dimensions
    improvements.slice(0, 3).forEach(imp => {
      const suggestion = this.getSuggestionFor(imp.dimension as keyof HolyShitScore['breakdown']);
      if (suggestion) suggestions.push(suggestion);
    });

    return suggestions;
  }

  /**
   * Get specific suggestion for a dimension
   */
  private getSuggestionFor(dimension: keyof HolyShitScore['breakdown']): string | null {
    switch (dimension) {
      case 'unexpectedness':
        return '💡 To increase unexpectedness: Challenge conventional wisdom, connect disparate concepts, or reveal hidden patterns';
      case 'truthfulness':
        return '📊 To increase truthfulness: Add specific statistics, case studies, or expert quotes as evidence';
      case 'actionability':
        return '🎯 To increase actionability: Provide a clear step-by-step plan, template, or framework';
      case 'uniqueness':
        return '💎 To increase uniqueness: Research what competitors are saying and take the opposite angle';
      case 'virality':
        return '🔥 To increase virality: Add controversy (but keep it defensible), emotional resonance, or "social currency"';
      default:
        return null;
    }
  }

  /**
   * Predict confidence level
   */
  predictConfidenceLevel(confidence: number): 'high' | 'medium' | 'low' {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
  }

  /**
   * Compare to benchmarks
   */
  compareToBenchmark(score: number): {
    percentile: number;
    comparison: string;
  } {
    // Benchmarks based on typical distribution
    if (score >= 85) {
      return {
        percentile: 95,
        comparison: 'Top 5% - Truly exceptional content'
      };
    }
    if (score >= 75) {
      return {
        percentile: 80,
        comparison: 'Top 20% - Very strong content'
      };
    }
    if (score >= 65) {
      return {
        percentile: 60,
        comparison: 'Above average - Good content'
      };
    }
    if (score >= 50) {
      return {
        percentile: 40,
        comparison: 'Average - Decent content'
      };
    }
    return {
      percentile: 20,
      comparison: 'Below average - Needs improvement'
    };
  }
}
