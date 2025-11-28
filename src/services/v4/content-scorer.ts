/**
 * V4 Content Scorer
 *
 * Scores content quality based on 5 dimensions:
 * 1. Unexpectedness (0-30) - How surprising is the insight?
 * 2. Truthfulness (0-25) - How well-evidenced is it?
 * 3. Actionability (0-20) - Can they act on it immediately?
 * 4. Uniqueness (0-15) - Is this different from competitors?
 * 5. Virality (0-10) - Will people share this?
 *
 * PLUS: Emotional Quotient (EQ) integration for emotional resonance scoring
 *
 * Extracted and refined from V1 HolyShitScorer.
 *
 * Created: 2025-11-26
 * Updated: 2025-11-27 - Added EQ integration
 */

import type {
  ContentScore,
  ScoreBreakdown,
  ScoringWeights,
  Reaction,
  EQScoreIntegrated
} from './types';
import { DEFAULT_SCORING_WEIGHTS } from './types';
import { eqCalculator } from '@/services/ai/eq-calculator.service';

// ============================================================================
// POWER WORDS DATABASE
// ============================================================================

const POWER_WORDS = {
  curiosity: ['secret', 'hidden', 'discover', 'revealed', 'unlock', 'truth', 'surprising', 'unexpected', 'shocking', 'unbelievable'],
  urgency: ['now', 'today', 'immediately', 'limited', 'hurry', 'last chance', 'deadline', 'urgent', 'act fast', 'before'],
  transformation: ['transform', 'change', 'revolutionize', 'breakthrough', 'unlock', 'master', 'dominate', 'achieve', 'succeed'],
  authority: ['proven', 'research', 'study', 'expert', 'science', 'data', 'evidence', 'guaranteed', 'certified', 'official'],
  emotion: ['amazing', 'incredible', 'stunning', 'love', 'hate', 'fear', 'hope', 'dream', 'nightmare', 'perfect'],
  exclusivity: ['exclusive', 'private', 'members', 'vip', 'insider', 'secret', 'invitation', 'elite', 'premium']
};

const CHALLENGE_WORDS = ['contrary', 'opposite', 'actually', 'myth', 'wrong', 'not true', 'doesn\'t work', 'lie', 'mistake', 'fail'];
const PATTERN_WORDS = ['pattern', 'trend', 'always', 'consistently', 'repeatedly', 'correlation', 'data shows'];
const EMOTIONAL_WORDS = ['surprise', 'shock', 'amaz', 'excit', 'wow', 'realiz', 'discover', 'fear', 'worry', 'hope', 'desire'];

// ============================================================================
// CONTENT SCORER CLASS
// ============================================================================

class ContentScorer {
  private weights: ScoringWeights;

  constructor(weights?: Partial<ScoringWeights>) {
    this.weights = { ...DEFAULT_SCORING_WEIGHTS, ...weights };
  }

  /**
   * Score content and return full analysis
   */
  score(content: {
    headline?: string;
    hook?: string;
    body: string;
    cta?: string;
  }): ContentScore {
    const fullText = [content.headline, content.hook, content.body, content.cta]
      .filter(Boolean)
      .join(' ');

    // Score all 5 dimensions
    const breakdown: ScoreBreakdown = {
      unexpectedness: this.scoreUnexpectedness(fullText),
      truthfulness: this.scoreTruthfulness(fullText),
      actionability: this.scoreActionability(fullText, content.cta),
      uniqueness: this.scoreUniqueness(fullText),
      virality: this.scoreVirality(fullText, content.headline || '')
    };

    // Calculate EQ score
    const eqResult = eqCalculator.calculateEQ(fullText);
    const eq: EQScoreIntegrated = {
      overall: eqResult.overall,
      emotional_resonance: eqResult.emotional_resonance,
      identity_alignment: eqResult.identity_alignment,
      urgency_signals: eqResult.urgency_signals,
      classification: eqResult.classification
    };

    // Calculate total (with EQ boost)
    let total = this.calculateTotal(breakdown);

    // EQ adjustment: boost score for emotionally resonant content
    if (eq.overall >= 60) {
      total = Math.min(100, total + (eq.overall - 50) * 0.1);
    }

    // Predict reaction
    const prediction = this.predictReaction(total);

    // Calculate confidence (factor in EQ consistency)
    let confidence = this.calculateConfidence(breakdown);
    if (eq.classification === 'balanced') {
      confidence = Math.min(0.95, confidence + 0.05);
    }

    // Generate reasoning
    const { strengths, weaknesses, reasoning } = this.generateAnalysis(breakdown, prediction, eq);

    return {
      total: Math.round(total),
      breakdown,
      confidence,
      prediction,
      reasoning,
      strengths,
      weaknesses,
      eq
    };
  }

  /**
   * Quick score for filtering (faster, less detailed)
   */
  quickScore(text: string): number {
    const powerWordCount = this.countPowerWords(text);
    const hasChallenge = this.containsWords(text, CHALLENGE_WORDS);
    const hasEmotional = this.containsWords(text, EMOTIONAL_WORDS);
    const wordCount = text.split(/\s+/).length;

    let score = 50; // Base score

    // Power words bonus (up to 20 points)
    score += Math.min(powerWordCount * 4, 20);

    // Challenge/contrarian bonus (10 points)
    if (hasChallenge) score += 10;

    // Emotional resonance bonus (10 points)
    if (hasEmotional) score += 10;

    // Length penalty (too short or too long)
    if (wordCount < 50) score -= 10;
    if (wordCount > 500) score -= 5;

    return Math.max(0, Math.min(100, score));
  }

  // ============================================================================
  // DIMENSION SCORERS
  // ============================================================================

  /**
   * DIMENSION 1: UNEXPECTEDNESS (0-30)
   */
  private scoreUnexpectedness(text: string): number {
    let score = 0;
    const lowerText = text.toLowerCase();

    // Challenges conventional wisdom (+10)
    if (this.containsWords(lowerText, CHALLENGE_WORDS)) {
      score += 10;
    }

    // Contains curiosity words (+8)
    const curiosityCount = this.countWordsFromList(lowerText, POWER_WORDS.curiosity);
    score += Math.min(curiosityCount * 2, 8);

    // Reveals hidden pattern (+7)
    if (this.containsWords(lowerText, PATTERN_WORDS)) {
      score += 7;
    }

    // Counter-intuitive structure (+5)
    if (lowerText.includes('but') || lowerText.includes('however') || lowerText.includes('actually')) {
      score += 5;
    }

    return Math.min(score, 30);
  }

  /**
   * DIMENSION 2: TRUTHFULNESS (0-25)
   */
  private scoreTruthfulness(text: string): number {
    let score = 0;
    const lowerText = text.toLowerCase();

    // Contains authority/data words (+10)
    const authorityCount = this.countWordsFromList(lowerText, POWER_WORDS.authority);
    score += Math.min(authorityCount * 3, 10);

    // Contains numbers/statistics (+8)
    const hasNumbers = /\d+%|\d+x|\d+ (times|people|customers|users|businesses)/i.test(text);
    if (hasNumbers) score += 8;

    // Specific examples (+7)
    const hasExamples = /for example|case study|when we|after implementing|client|customer story/i.test(text);
    if (hasExamples) score += 7;

    return Math.min(score, 25);
  }

  /**
   * DIMENSION 3: ACTIONABILITY (0-20)
   */
  private scoreActionability(text: string, cta?: string): number {
    let score = 0;
    const lowerText = text.toLowerCase();

    // Has clear CTA (+8)
    if (cta && cta.length > 5) {
      score += 8;
    }

    // Contains action words (+6)
    const actionWords = ['try', 'start', 'begin', 'implement', 'apply', 'use', 'do this', 'step'];
    if (this.containsWords(lowerText, actionWords)) {
      score += 6;
    }

    // Has specific steps/instructions (+6)
    const hasSteps = /step \d|first|second|third|here's how|follow these/i.test(text);
    if (hasSteps) score += 6;

    return Math.min(score, 20);
  }

  /**
   * DIMENSION 4: UNIQUENESS (0-15)
   */
  private scoreUniqueness(text: string): number {
    let score = 7; // Default moderate uniqueness
    const lowerText = text.toLowerCase();

    // Novel approach language (+5)
    const novelWords = ['new way', 'different approach', 'unique', 'innovative', 'fresh', 'unlike'];
    if (this.containsWords(lowerText, novelWords)) {
      score += 5;
    }

    // First-person experience (+3)
    if (/i (discovered|learned|found|realized)/i.test(text)) {
      score += 3;
    }

    return Math.min(score, 15);
  }

  /**
   * DIMENSION 5: VIRALITY (0-10)
   */
  private scoreVirality(text: string, headline: string): number {
    let score = 0;
    const lowerText = text.toLowerCase();
    const lowerHeadline = headline.toLowerCase();

    // Controversial but defensible (+3)
    if (this.containsWords(lowerText, CHALLENGE_WORDS)) {
      score += 3;
    }

    // Makes sharers look smart (curiosity/exclusive) (+3)
    const smartWords = [...POWER_WORDS.curiosity, ...POWER_WORDS.exclusivity];
    if (this.containsWords(lowerHeadline, smartWords)) {
      score += 3;
    }

    // Clear narrative/story structure (+2)
    if (/here's what happened|story|learned|realized|discovered/i.test(lowerText)) {
      score += 2;
    }

    // Emotional resonance (+2)
    if (this.containsWords(lowerText, EMOTIONAL_WORDS)) {
      score += 2;
    }

    return Math.min(score, 10);
  }

  // ============================================================================
  // CALCULATION HELPERS
  // ============================================================================

  /**
   * Calculate weighted total score
   */
  private calculateTotal(breakdown: ScoreBreakdown): number {
    const weighted =
      breakdown.unexpectedness * this.weights.unexpectedness +
      breakdown.truthfulness * this.weights.truthfulness +
      breakdown.actionability * this.weights.actionability +
      breakdown.uniqueness * this.weights.uniqueness +
      breakdown.virality * this.weights.virality;

    // Normalize to 0-100
    const maxPossible =
      30 * this.weights.unexpectedness +
      25 * this.weights.truthfulness +
      20 * this.weights.actionability +
      15 * this.weights.uniqueness +
      10 * this.weights.virality;

    return (weighted / maxPossible) * 100;
  }

  /**
   * Calculate confidence in the score
   */
  private calculateConfidence(breakdown: ScoreBreakdown): number {
    // Normalize each dimension
    const normalized = [
      breakdown.unexpectedness / 30,
      breakdown.truthfulness / 25,
      breakdown.actionability / 20,
      breakdown.uniqueness / 15,
      breakdown.virality / 10
    ];

    // Calculate variance
    const average = normalized.reduce((sum, s) => sum + s, 0) / normalized.length;
    const variance = normalized.reduce((sum, s) => sum + Math.pow(s - average, 2), 0) / normalized.length;
    const stdDev = Math.sqrt(variance);

    // Low variance = high confidence
    let confidence = 0.7;
    if (stdDev < 0.15) confidence += 0.15;
    else if (stdDev > 0.3) confidence -= 0.15;

    // Higher scores = higher confidence
    const totalNormalized = average;
    if (totalNormalized > 0.7) confidence += 0.1;
    else if (totalNormalized < 0.4) confidence -= 0.1;

    return Math.max(0.3, Math.min(0.95, confidence));
  }

  /**
   * Predict reaction based on total score
   */
  private predictReaction(score: number): Reaction {
    if (score >= 85) return 'holy shit';
    if (score >= 70) return 'great';
    if (score >= 50) return 'good';
    return 'meh';
  }

  /**
   * Generate analysis with strengths/weaknesses
   */
  private generateAnalysis(breakdown: ScoreBreakdown, prediction: Reaction, eq?: EQScoreIntegrated): {
    strengths: string[];
    weaknesses: string[];
    reasoning: string[];
  } {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const reasoning: string[] = [];

    // Unexpectedness
    if (breakdown.unexpectedness >= 25) {
      strengths.push('Highly unexpected - will genuinely surprise audience');
    } else if (breakdown.unexpectedness >= 20) {
      strengths.push('Unexpected - brings fresh perspective');
    } else if (breakdown.unexpectedness < 15) {
      weaknesses.push('Could be more surprising - try stronger contrast');
    }

    // Truthfulness
    if (breakdown.truthfulness >= 20) {
      strengths.push('Very well-evidenced - strong credibility');
    } else if (breakdown.truthfulness >= 17) {
      strengths.push('Well-supported - good evidence base');
    } else if (breakdown.truthfulness < 13) {
      weaknesses.push('Needs stronger evidence - add data or examples');
    }

    // Actionability
    if (breakdown.actionability >= 17) {
      strengths.push('Highly actionable - ready to execute');
    } else if (breakdown.actionability >= 14) {
      strengths.push('Actionable - clear next steps');
    } else if (breakdown.actionability < 12) {
      weaknesses.push('Action steps unclear - make the "what to do" specific');
    }

    // Uniqueness
    if (breakdown.uniqueness >= 12) {
      strengths.push('Highly unique - competitors aren\'t doing this');
    } else if (breakdown.uniqueness >= 10) {
      strengths.push('Unique angle - differentiates from competition');
    } else if (breakdown.uniqueness < 8) {
      weaknesses.push('Similar to existing content - find a more unique angle');
    }

    // Virality
    if (breakdown.virality >= 8) {
      strengths.push('High viral potential - likely to spread');
    } else if (breakdown.virality >= 6) {
      strengths.push('Good shareability - will generate engagement');
    } else if (breakdown.virality < 4) {
      weaknesses.push('Low viral potential - add emotion or controversy');
    }

    // EQ analysis
    if (eq) {
      if (eq.overall >= 70) {
        strengths.push(`High emotional resonance (EQ: ${eq.overall}) - connects deeply with audience`);
      } else if (eq.overall >= 50) {
        strengths.push(`Good emotional balance (EQ: ${eq.overall}) - effective emotional appeal`);
      } else if (eq.overall < 30) {
        weaknesses.push(`Low emotional resonance (EQ: ${eq.overall}) - add emotional language or identity signals`);
      }

      // Specific EQ dimension feedback
      if (eq.identity_alignment >= 50) {
        strengths.push('Strong identity alignment - speaks to who they want to be');
      }
      if (eq.urgency_signals >= 60) {
        strengths.push('Good urgency signals - creates motivation to act');
      } else if (eq.urgency_signals < 20 && eq.classification !== 'highly-rational') {
        weaknesses.push('Consider adding urgency elements for stronger call-to-action');
      }
    }

    // Overall reasoning
    const total = this.calculateTotal(breakdown);
    switch (prediction) {
      case 'holy shit':
        reasoning.push(`🔥 HOLY SHIT (${Math.round(total)}/100) - Breakthrough content that will wow your audience`);
        break;
      case 'great':
        reasoning.push(`⭐ GREAT (${Math.round(total)}/100) - Strong content that will perform well`);
        break;
      case 'good':
        reasoning.push(`✓ GOOD (${Math.round(total)}/100) - Solid content that provides value`);
        break;
      case 'meh':
        reasoning.push(`⚡ MEH (${Math.round(total)}/100) - Needs strengthening before publishing`);
        break;
    }

    // Add EQ classification to reasoning
    if (eq) {
      reasoning.push(`Emotional Profile: ${eq.classification.replace('-', ' ')} (${eq.overall}/100 EQ)`);
    }

    return { strengths, weaknesses, reasoning };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private countPowerWords(text: string): number {
    const lowerText = text.toLowerCase();
    let count = 0;
    for (const category of Object.values(POWER_WORDS)) {
      count += this.countWordsFromList(lowerText, category);
    }
    return count;
  }

  private countWordsFromList(text: string, words: string[]): number {
    return words.filter(word => text.includes(word.toLowerCase())).length;
  }

  private containsWords(text: string, words: string[]): boolean {
    return words.some(word => text.includes(word.toLowerCase()));
  }

  /**
   * Update scoring weights
   */
  updateWeights(weights: Partial<ScoringWeights>): void {
    this.weights = { ...this.weights, ...weights };
  }

  /**
   * Get current weights
   */
  getWeights(): ScoringWeights {
    return { ...this.weights };
  }
}

// Export singleton instance
export const contentScorer = new ContentScorer();

// Export class for testing
export { ContentScorer };
