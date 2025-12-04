/**
 * SYNAPSE CORE SERVICE
 *
 * The hidden psychology engine that scores and optimizes content.
 * This is our secret weapon - users never see the complexity.
 *
 * Philosophy: "Build it complex, present it simple"
 */

import type {
  SynapseScore,
  SynapseBreakdown,
  PowerWord,
  PowerWordCategory,
  PowerWordAnalysis,
  EmotionalTrigger,
  EmotionalTriggerType,
  EmotionalTriggerAnalysis,
  ReadabilityScore,
  CallToActionAnalysis,
  CTAType,
  ContentOptimizationRequest,
  ContentOptimizationResult,
  SynapseConfig,
  ContentQualityIndicator,
} from '../../types/synapse.types';

import { synapseToUserFacing } from '../../types/synapse.types';

// ============================================================================
// POWER WORD LIBRARY
// ============================================================================

const POWER_WORDS: PowerWord[] = [
  // Urgency
  { word: 'now', category: 'urgency', intensity: 8, emotionalImpact: 'positive' },
  { word: 'today', category: 'urgency', intensity: 7, emotionalImpact: 'positive' },
  { word: 'limited', category: 'urgency', intensity: 9, emotionalImpact: 'positive' },
  { word: 'hurry', category: 'urgency', intensity: 8, emotionalImpact: 'positive' },
  { word: 'deadline', category: 'urgency', intensity: 7, emotionalImpact: 'neutral' },
  { word: 'last chance', category: 'urgency', intensity: 10, emotionalImpact: 'positive' },

  // Exclusivity
  { word: 'exclusive', category: 'exclusivity', intensity: 9, emotionalImpact: 'positive' },
  { word: 'members only', category: 'exclusivity', intensity: 8, emotionalImpact: 'positive' },
  { word: 'vip', category: 'exclusivity', intensity: 9, emotionalImpact: 'positive' },
  { word: 'private', category: 'exclusivity', intensity: 7, emotionalImpact: 'positive' },
  { word: 'invitation', category: 'exclusivity', intensity: 8, emotionalImpact: 'positive' },

  // Trust
  { word: 'proven', category: 'trust', intensity: 8, emotionalImpact: 'positive' },
  { word: 'guaranteed', category: 'trust', intensity: 9, emotionalImpact: 'positive' },
  { word: 'certified', category: 'trust', intensity: 7, emotionalImpact: 'positive' },
  { word: 'trusted', category: 'trust', intensity: 7, emotionalImpact: 'positive' },
  { word: 'authentic', category: 'trust', intensity: 8, emotionalImpact: 'positive' },
  { word: 'official', category: 'trust', intensity: 6, emotionalImpact: 'positive' },

  // Emotion
  { word: 'amazing', category: 'emotion', intensity: 7, emotionalImpact: 'positive' },
  { word: 'incredible', category: 'emotion', intensity: 8, emotionalImpact: 'positive' },
  { word: 'stunning', category: 'emotion', intensity: 7, emotionalImpact: 'positive' },
  { word: 'beautiful', category: 'emotion', intensity: 6, emotionalImpact: 'positive' },
  { word: 'perfect', category: 'emotion', intensity: 8, emotionalImpact: 'positive' },
  { word: 'love', category: 'emotion', intensity: 9, emotionalImpact: 'positive' },

  // Action
  { word: 'discover', category: 'action', intensity: 7, emotionalImpact: 'positive' },
  { word: 'unlock', category: 'action', intensity: 8, emotionalImpact: 'positive' },
  { word: 'transform', category: 'action', intensity: 9, emotionalImpact: 'positive' },
  { word: 'achieve', category: 'action', intensity: 7, emotionalImpact: 'positive' },
  { word: 'master', category: 'action', intensity: 8, emotionalImpact: 'positive' },
  { word: 'create', category: 'action', intensity: 6, emotionalImpact: 'positive' },

  // Social
  { word: 'popular', category: 'social', intensity: 7, emotionalImpact: 'positive' },
  { word: 'trending', category: 'social', intensity: 8, emotionalImpact: 'positive' },
  { word: 'loved', category: 'social', intensity: 7, emotionalImpact: 'positive' },
  { word: 'favorite', category: 'social', intensity: 6, emotionalImpact: 'positive' },
  { word: 'community', category: 'social', intensity: 7, emotionalImpact: 'positive' },

  // Authority
  { word: 'expert', category: 'authority', intensity: 8, emotionalImpact: 'positive' },
  { word: 'professional', category: 'authority', intensity: 7, emotionalImpact: 'positive' },
  { word: 'leading', category: 'authority', intensity: 7, emotionalImpact: 'positive' },
  { word: 'award-winning', category: 'authority', intensity: 9, emotionalImpact: 'positive' },
  { word: 'recognized', category: 'authority', intensity: 6, emotionalImpact: 'positive' },
];

// ============================================================================
// EMOTIONAL TRIGGER PATTERNS
// ============================================================================

const EMOTIONAL_PATTERNS: Array<{ pattern: RegExp; type: EmotionalTriggerType; intensity: number }> = [
  // Curiosity
  { pattern: /you won't believe|won't believe|secret to|find out|discover how/i, type: 'curiosity', intensity: 8 },
  { pattern: /how to|learn|the truth about|revealed/i, type: 'curiosity', intensity: 6 },

  // Fear
  { pattern: /avoid|mistake|warning|don't|never|stop/i, type: 'fear', intensity: 7 },
  { pattern: /risk|danger|problem|lose/i, type: 'fear', intensity: 6 },

  // Desire
  { pattern: /imagine|dream|achieve|get|want|wish/i, type: 'desire', intensity: 7 },
  { pattern: /enjoy|experience|feel/i, type: 'desire', intensity: 5 },

  // Belonging
  { pattern: /join us|community|together|family|belong/i, type: 'belonging', intensity: 8 },
  { pattern: /we|our|us|everyone/i, type: 'belonging', intensity: 4 },

  // Achievement
  { pattern: /success|victory|accomplished|winner|champion/i, type: 'achievement', intensity: 8 },
  { pattern: /reach|goal|milestone|succeed/i, type: 'achievement', intensity: 6 },

  // Trust
  { pattern: /honest|transparent|authentic|real|genuine/i, type: 'trust', intensity: 7 },
  { pattern: /promise|commitment|dedicated/i, type: 'trust', intensity: 6 },

  // Urgency
  { pattern: /last chance|running out|limited time|act now|don't miss/i, type: 'urgency', intensity: 9 },
  { pattern: /today|now|immediately|hurry/i, type: 'urgency', intensity: 7 },
];

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

const DEFAULT_CONFIG: SynapseConfig = {
  weights: {
    powerWords: 20,
    emotionalTriggers: 25,
    readability: 20,
    callToAction: 15,
    urgency: 10,
    trust: 10,
  },
  thresholds: {
    excellent: 85,
    good: 70,
    acceptable: 50,
    poor: 0,
  },
  powerWordDensity: {
    min: 2,
    max: 8,
    optimal: 5,
  },
};

// ============================================================================
// SYNAPSE CORE SERVICE
// ============================================================================

export class SynapseCoreService {
  private config: SynapseConfig;

  constructor(config?: Partial<SynapseConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Main entry point: Score content holistically
   * Returns detailed internal score
   */
  scoreContent(content: string): SynapseScore {
    const powerWordsAnalysis = this.analyzePowerWords(content);
    const emotionalAnalysis = this.detectEmotionalTriggers(content);
    const readability = this.calculateReadability(content);
    const ctaAnalysis = this.analyzeCallToAction(content);

    // Calculate component scores
    const powerWordsScore = powerWordsAnalysis.score;
    const emotionalScore = emotionalAnalysis.score;
    const readabilityScore = readability.score;
    const ctaScore = ctaAnalysis.strength;

    // Urgency score (combination of urgency triggers + urgency words)
    const urgencyScore = this.calculateUrgencyScore(emotionalAnalysis, powerWordsAnalysis);

    // Trust score (trust triggers + trust words + readability)
    const trustScore = this.calculateTrustScore(emotionalAnalysis, powerWordsAnalysis, readability);

    // Calculate weighted overall score
    const overall = this.calculateOverallScore({
      powerWords: powerWordsScore,
      emotionalTriggers: emotionalScore,
      readability: readabilityScore,
      callToAction: ctaScore,
      urgency: urgencyScore,
      trust: trustScore,
    });

    // Build breakdown for internal analysis
    const breakdown: SynapseBreakdown = {
      powerWordCount: powerWordsAnalysis.totalCount,
      emotionalTriggerCount: emotionalAnalysis.triggers.length,
      sentenceComplexity: this.calculateSentenceComplexity(content),
      wordCount: this.countWords(content),
      averageWordLength: this.calculateAverageWordLength(content),
      fleschReadingEase: readability.fleschReadingEase,

      // Psychology markers
      hasUrgency: urgencyScore > 50,
      hasSocialProof: this.hasSocialProof(content),
      hasAuthority: powerWordsAnalysis.byCategory.authority > 0,
      hasScarcity: this.hasScarcity(content),
      hasReciprocity: this.hasReciprocity(content),
    };

    // Generate improvement suggestions
    const suggestions = this.generateSuggestions({
      powerWords: powerWordsScore,
      emotional: emotionalScore,
      readability: readabilityScore,
      cta: ctaScore,
    });

    return {
      overall,
      powerWords: powerWordsScore,
      emotionalTriggers: emotionalScore,
      readability: readabilityScore,
      callToAction: ctaScore,
      urgency: urgencyScore,
      trust: trustScore,
      breakdown,
      suggestions,
    };
  }

  /**
   * User-facing API: Convert score to simple quality indicator
   * Hides all psychology - just shows stars and simple metrics
   */
  getQualityIndicator(content: string): ContentQualityIndicator {
    const score = this.scoreContent(content);
    return synapseToUserFacing(score);
  }

  /**
   * Analyze power words in content
   */
  analyzePowerWords(content: string): PowerWordAnalysis {
    const lowerContent = content.toLowerCase();
    const words = this.extractWords(content);
    const totalWords = words.length;

    const detectedWords: PowerWord[] = [];
    const byCategory: Record<PowerWordCategory, number> = {
      urgency: 0,
      exclusivity: 0,
      trust: 0,
      emotion: 0,
      action: 0,
      social: 0,
      authority: 0,
    };

    // Detect power words
    for (const powerWord of POWER_WORDS) {
      if (lowerContent.includes(powerWord.word)) {
        detectedWords.push(powerWord);
        byCategory[powerWord.category]++;
      }
    }

    const totalCount = detectedWords.length;
    const density = totalWords > 0 ? (totalCount / totalWords) * 100 : 0;

    // Calculate score based on density and intensity
    let score = 0;
    if (density >= this.config.powerWordDensity.min && density <= this.config.powerWordDensity.max) {
      // Good density range
      const avgIntensity = detectedWords.reduce((sum, pw) => sum + pw.intensity, 0) / Math.max(totalCount, 1);
      score = Math.min(100, (density / this.config.powerWordDensity.optimal) * avgIntensity * 10);
    } else if (density > this.config.powerWordDensity.max) {
      // Too many = spammy
      score = 40;
    } else {
      // Too few
      score = density * 20;
    }

    // Balance check
    const isBalanced = density <= this.config.powerWordDensity.max;
    const warning = !isBalanced ? 'Too many power words - may appear spammy' : undefined;

    return {
      totalCount,
      density,
      byCategory,
      detectedWords,
      score: Math.round(score),
      isBalanced,
      warning,
    };
  }

  /**
   * Detect emotional triggers
   */
  detectEmotionalTriggers(content: string): EmotionalTriggerAnalysis {
    const triggers: EmotionalTrigger[] = [];
    const emotionalBalance: Record<EmotionalTriggerType, number> = {
      curiosity: 0,
      fear: 0,
      desire: 0,
      belonging: 0,
      achievement: 0,
      trust: 0,
      urgency: 0,
    };

    // Detect patterns
    for (const pattern of EMOTIONAL_PATTERNS) {
      const match = content.match(pattern.pattern);
      if (match) {
        triggers.push({
          type: pattern.type,
          text: match[0],
          intensity: pattern.intensity,
          position: match.index || 0,
        });
        emotionalBalance[pattern.type]++;
      }
    }

    // Find dominant emotion
    let dominantEmotion: EmotionalTriggerType | null = null;
    let maxCount = 0;
    for (const [emotion, count] of Object.entries(emotionalBalance)) {
      if (count > maxCount) {
        maxCount = count;
        dominantEmotion = emotion as EmotionalTriggerType;
      }
    }

    // Calculate score based on trigger count and intensity
    const avgIntensity = triggers.reduce((sum, t) => sum + t.intensity, 0) / Math.max(triggers.length, 1);
    const score = Math.min(100, triggers.length * avgIntensity * 5);

    return {
      triggers,
      dominantEmotion,
      emotionalBalance,
      score: Math.round(score),
    };
  }

  /**
   * Calculate readability score
   */
  calculateReadability(content: string): ReadabilityScore {
    const sentences = this.splitIntoSentences(content);
    const words = this.extractWords(content);
    const syllables = this.countSyllables(content);

    const sentenceCount = sentences.length;
    const wordCount = words.length;
    const syllableCount = syllables;

    // Flesch Reading Ease
    const fleschReadingEase = this.calculateFleschReadingEase(wordCount, sentenceCount, syllableCount);

    // Flesch-Kincaid Grade Level
    const fleschKincaidGrade = this.calculateFleschKincaidGrade(wordCount, sentenceCount, syllableCount);

    // Average metrics
    const averageSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0;
    const averageWordLength = this.calculateAverageWordLength(content);

    // Complex words (3+ syllables)
    const complexWordCount = words.filter((word) => this.countWordSyllables(word) >= 3).length;

    // Determine level
    let level: ReadabilityScore['level'];
    if (fleschReadingEase >= 80) level = 'very-easy';
    else if (fleschReadingEase >= 60) level = 'easy';
    else if (fleschReadingEase >= 40) level = 'moderate';
    else if (fleschReadingEase >= 20) level = 'difficult';
    else level = 'very-difficult';

    // Score (higher readability = better)
    const score = Math.max(0, Math.min(100, fleschReadingEase));

    return {
      fleschReadingEase,
      fleschKincaidGrade,
      averageSentenceLength,
      averageWordLength,
      complexWordCount,
      level,
      score: Math.round(score),
    };
  }

  /**
   * Analyze call-to-action
   */
  analyzeCallToAction(content: string): CallToActionAnalysis {
    const ctaPatterns = {
      soft: /learn more|find out|read more|see more|discover|explore/i,
      medium: /get started|try now|sign up|join now|start|begin/i,
      hard: /buy now|book today|order now|purchase|reserve|claim/i,
      social: /share|follow|like|comment|tag|subscribe/i,
    };

    let hasCTA = false;
    let ctaText: string | undefined;
    let ctaType: CTAType | undefined;
    let position: CallToActionAnalysis['position'] = 'none';

    // Check for CTAs
    for (const [type, pattern] of Object.entries(ctaPatterns)) {
      const match = content.match(pattern);
      if (match) {
        hasCTA = true;
        ctaText = match[0];
        ctaType = type as CTAType;

        // Determine position
        const matchPosition = match.index || 0;
        if (matchPosition < content.length * 0.33) {
          position = 'start';
        } else if (matchPosition > content.length * 0.67) {
          position = 'end';
        } else {
          position = 'middle';
        }
        break;
      }
    }

    // Calculate strength
    let strength = 0;
    if (hasCTA) {
      const typeStrength = { soft: 50, medium: 75, hard: 100, social: 60 };
      const positionBonus = position === 'end' ? 10 : 0; // CTAs better at end
      strength = Math.min(100, (typeStrength[ctaType!] || 50) + positionBonus);
    }

    // Calculate clarity (is it obvious what to do?)
    const clarity = hasCTA ? strength : 0;

    // Suggestions
    const suggestions: string[] = [];
    if (!hasCTA) {
      suggestions.push('Add a clear call-to-action');
    } else if (position === 'start') {
      suggestions.push('Consider moving CTA to the end');
    }

    return {
      hasCTA,
      ctaText,
      ctaType,
      position,
      strength,
      clarity,
      suggestions,
    };
  }

  /**
   * Optimize content to reach target score
   * (Simplified version - full implementation would be more complex)
   */
  optimizeContent(request: ContentOptimizationRequest): ContentOptimizationResult {
    const { content, targetScore } = request;
    const scoreBefore = this.scoreContent(content);

    // For MVP, we'll just return suggestions without actually modifying
    // Full implementation would use AI to rewrite
    const improvements: ContentOptimizationResult['improvements'] = [];

    // Add power words if score is low
    if (scoreBefore.powerWords < targetScore) {
      improvements.push({
        type: 'power-word',
        description: 'Add more compelling language',
        impact: targetScore - scoreBefore.powerWords,
        position: 0,
      });
    }

    // Add CTA if missing
    if (scoreBefore.callToAction < targetScore && !this.analyzeCallToAction(content).hasCTA) {
      improvements.push({
        type: 'cta',
        description: 'Add a clear call-to-action at the end',
        impact: 15,
        position: content.length,
      });
    }

    return {
      original: content,
      optimized: content, // For MVP, return original
      improvements,
      scoreBefore,
      scoreAfter: scoreBefore, // For MVP, same as before
      changesMade: 0,
      significantChanges: false,
    };
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  private calculateOverallScore(scores: {
    powerWords: number;
    emotionalTriggers: number;
    readability: number;
    callToAction: number;
    urgency: number;
    trust: number;
  }): number {
    const { weights } = this.config;
    const overall =
      (scores.powerWords * weights.powerWords +
        scores.emotionalTriggers * weights.emotionalTriggers +
        scores.readability * weights.readability +
        scores.callToAction * weights.callToAction +
        scores.urgency * weights.urgency +
        scores.trust * weights.trust) /
      100;

    return Math.round(overall);
  }

  private calculateUrgencyScore(emotional: EmotionalTriggerAnalysis, powerWords: PowerWordAnalysis): number {
    const urgencyTriggers = emotional.emotionalBalance.urgency;
    const urgencyWords = powerWords.byCategory.urgency;
    return Math.min(100, (urgencyTriggers * 20 + urgencyWords * 15));
  }

  private calculateTrustScore(
    emotional: EmotionalTriggerAnalysis,
    powerWords: PowerWordAnalysis,
    readability: ReadabilityScore
  ): number {
    const trustTriggers = emotional.emotionalBalance.trust;
    const trustWords = powerWords.byCategory.trust;
    const readabilityBonus = readability.score > 70 ? 10 : 0;
    return Math.min(100, trustTriggers * 20 + trustWords * 15 + readabilityBonus);
  }

  private calculateSentenceComplexity(content: string): number {
    const sentences = this.splitIntoSentences(content);
    const words = this.extractWords(content);
    const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
    return avgWordsPerSentence;
  }

  private hasSocialProof(content: string): boolean {
    return /\d+\s*(customers|clients|users|people|reviews)/i.test(content);
  }

  private hasScarcity(content: string): boolean {
    return /(limited|only \d+ left|while supplies last|few remaining)/i.test(content);
  }

  private hasReciprocity(content: string): boolean {
    return /(free|gift|bonus|complimentary)/i.test(content);
  }

  private generateSuggestions(scores: {
    powerWords: number;
    emotional: number;
    readability: number;
    cta: number;
  }): string[] {
    const suggestions: string[] = [];

    if (scores.powerWords < 50) {
      suggestions.push('Add more compelling power words to increase impact');
    }

    if (scores.emotional < 50) {
      suggestions.push('Incorporate emotional triggers to connect with readers');
    }

    if (scores.readability < 60) {
      suggestions.push('Simplify language and shorten sentences');
    }

    if (scores.cta < 60) {
      suggestions.push('Add a stronger call-to-action');
    }

    return suggestions;
  }

  // Text analysis utilities
  private extractWords(text: string): string[] {
    return text.match(/\b[a-z]+\b/gi) || [];
  }

  private countWords(text: string): number {
    return this.extractWords(text).length;
  }

  private splitIntoSentences(text: string): string[] {
    return text.match(/[^.!?]+[.!?]+/g) || [text];
  }

  private calculateAverageWordLength(text: string): number {
    const words = this.extractWords(text);
    if (words.length === 0) return 0;
    const totalLength = words.reduce((sum, word) => sum + word.length, 0);
    return totalLength / words.length;
  }

  private countSyllables(text: string): number {
    const words = this.extractWords(text);
    return words.reduce((sum, word) => sum + this.countWordSyllables(word), 0);
  }

  private countWordSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  }

  private calculateFleschReadingEase(words: number, sentences: number, syllables: number): number {
    if (words === 0 || sentences === 0) return 0;
    const asl = words / sentences;
    const asw = syllables / words;
    return 206.835 - 1.015 * asl - 84.6 * asw;
  }

  private calculateFleschKincaidGrade(words: number, sentences: number, syllables: number): number {
    if (words === 0 || sentences === 0) return 0;
    const asl = words / sentences;
    const asw = syllables / words;
    return 0.39 * asl + 11.8 * asw - 15.59;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const synapseCoreService = new SynapseCoreService();
