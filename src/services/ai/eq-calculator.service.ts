/**
 * Emotional Quotient (EQ) Calculator Service
 *
 * Analyzes text for emotional language and calculates EQ scores
 * based on MARBA methodology:
 * - Emotional Resonance (40%): Emotion words / total words
 * - Identity Alignment (35%): Identity language detection
 * - Urgency Signals (25%): Urgency/scarcity indicators
 *
 * Created: 2025-11-18
 */

export interface EQScore {
  overall: number; // 0-100 composite score
  emotional_resonance: number; // 0-100
  identity_alignment: number; // 0-100
  urgency_signals: number; // 0-100
  breakdown: {
    emotionalWords: number;
    totalWords: number;
    identityPhrases: number;
    urgencyPhrases: number;
  };
  classification: 'highly-emotional' | 'emotional' | 'balanced' | 'rational' | 'highly-rational';
  reasoning: string;
}

/**
 * Emotional word dictionaries
 */
const EMOTIONAL_WORDS = {
  // High-arousal positive emotions
  positive: [
    'amazing', 'incredible', 'outstanding', 'exceptional', 'remarkable',
    'thrilled', 'excited', 'passionate', 'inspired', 'motivated',
    'love', 'adore', 'treasure', 'cherish', 'delighted',
    'fantastic', 'wonderful', 'brilliant', 'spectacular', 'magnificent',
    'joy', 'happiness', 'bliss', 'euphoria', 'ecstatic'
  ],

  // High-arousal negative emotions
  negative: [
    'frustrated', 'annoyed', 'angry', 'furious', 'outraged',
    'terrified', 'horrified', 'devastated', 'crushed', 'heartbroken',
    'anxious', 'worried', 'stressed', 'overwhelmed', 'panicked',
    'desperate', 'hopeless', 'helpless', 'powerless', 'defeated',
    'hate', 'despise', 'loathe', 'resent', 'bitter'
  ],

  // Transformation emotions
  transformation: [
    'relieved', 'liberated', 'empowered', 'confident', 'proud',
    'accomplished', 'successful', 'victorious', 'triumphant', 'achieved',
    'transformed', 'renewed', 'reborn', 'revitalized', 'energized'
  ],

  // Aspiration emotions
  aspiration: [
    'dream', 'aspire', 'desire', 'yearn', 'crave',
    'imagine', 'envision', 'hope', 'wish', 'long for'
  ]
};

/**
 * Identity language patterns
 */
const IDENTITY_PATTERNS = {
  // Self-concept phrases
  selfConcept: [
    "I'm the type of person who",
    "I see myself as",
    "I identify as",
    "I'm someone who",
    "people like me",
    "as a [professional/parent/leader]"
  ],

  // Social proof / belonging
  belonging: [
    "people like us",
    "our community",
    "we believe",
    "join us",
    "become part of",
    "belong to",
    "member of"
  ],

  // Status / achievement
  status: [
    "elite", "exclusive", "premium", "luxury", "prestigious",
    "leader", "top tier", "industry-leading", "award-winning",
    "recognized", "celebrated", "renowned", "distinguished"
  ]
};

/**
 * Urgency signal patterns
 */
const URGENCY_PATTERNS = {
  // Time-based urgency
  time: [
    "now", "today", "immediately", "right away", "urgent",
    "limited time", "expires", "deadline", "last chance",
    "hurry", "quick", "fast", "instant", "asap"
  ],

  // Scarcity
  scarcity: [
    "only", "limited", "exclusive", "rare", "scarce",
    "running out", "selling fast", "few left", "almost gone",
    "while supplies last", "limited availability"
  ],

  // FOMO (Fear of Missing Out)
  fomo: [
    "don't miss", "missing out", "everyone is", "join millions",
    "be left behind", "before it's too late", "last opportunity"
  ]
};

/**
 * EQ Calculator Service
 */
class EQCalculator {
  /**
   * Calculate EQ score for a given text
   */
  calculateEQ(text: string): EQScore {
    const normalized = text.toLowerCase();
    const words = this.tokenize(normalized);
    const totalWords = words.length;

    // 1. Emotional Resonance (40%)
    const emotionalWords = this.countEmotionalWords(words);
    const emotionalResonance = totalWords > 0
      ? Math.min(100, (emotionalWords / totalWords) * 100 * 3) // Scale up for visibility
      : 0;

    // 2. Identity Alignment (35%)
    const identityPhrases = this.detectIdentityLanguage(normalized);
    const identityAlignment = Math.min(100, identityPhrases * 15); // Each phrase worth 15 points

    // 3. Urgency Signals (25%)
    const urgencyPhrases = this.detectUrgencySignals(normalized);
    const urgencySignals = Math.min(100, urgencyPhrases * 12); // Each phrase worth 12 points

    // Calculate composite score (weighted average)
    const overall = Math.round(
      (emotionalResonance * 0.4) +
      (identityAlignment * 0.35) +
      (urgencySignals * 0.25)
    );

    // Classify
    const classification = this.classifyEQ(overall);

    // Generate reasoning
    const reasoning = this.generateReasoning(
      overall,
      emotionalResonance,
      identityAlignment,
      urgencySignals,
      emotionalWords,
      totalWords
    );

    return {
      overall,
      emotional_resonance: Math.round(emotionalResonance),
      identity_alignment: Math.round(identityAlignment),
      urgency_signals: Math.round(urgencySignals),
      breakdown: {
        emotionalWords,
        totalWords,
        identityPhrases,
        urgencyPhrases
      },
      classification,
      reasoning
    };
  }

  /**
   * Batch calculate EQ for multiple texts and return average
   */
  calculateBatchEQ(texts: string[]): EQScore {
    if (texts.length === 0) {
      return this.createZeroScore();
    }

    const scores = texts.map(text => this.calculateEQ(text));

    // Average all components
    const avgOverall = Math.round(
      scores.reduce((sum, s) => sum + s.overall, 0) / scores.length
    );

    const avgEmotional = Math.round(
      scores.reduce((sum, s) => sum + s.emotional_resonance, 0) / scores.length
    );

    const avgIdentity = Math.round(
      scores.reduce((sum, s) => sum + s.identity_alignment, 0) / scores.length
    );

    const avgUrgency = Math.round(
      scores.reduce((sum, s) => sum + s.urgency_signals, 0) / scores.length
    );

    const totalBreakdown = scores.reduce(
      (acc, s) => ({
        emotionalWords: acc.emotionalWords + s.breakdown.emotionalWords,
        totalWords: acc.totalWords + s.breakdown.totalWords,
        identityPhrases: acc.identityPhrases + s.breakdown.identityPhrases,
        urgencyPhrases: acc.urgencyPhrases + s.breakdown.urgencyPhrases
      }),
      { emotionalWords: 0, totalWords: 0, identityPhrases: 0, urgencyPhrases: 0 }
    );

    return {
      overall: avgOverall,
      emotional_resonance: avgEmotional,
      identity_alignment: avgIdentity,
      urgency_signals: avgUrgency,
      breakdown: totalBreakdown,
      classification: this.classifyEQ(avgOverall),
      reasoning: `Average of ${texts.length} text samples analyzed`
    };
  }

  /**
   * Tokenize text into words
   */
  private tokenize(text: string): string[] {
    return text
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 2); // Filter out very short words
  }

  /**
   * Count emotional words in text
   */
  private countEmotionalWords(words: string[]): number {
    const allEmotionalWords = [
      ...EMOTIONAL_WORDS.positive,
      ...EMOTIONAL_WORDS.negative,
      ...EMOTIONAL_WORDS.transformation,
      ...EMOTIONAL_WORDS.aspiration
    ];

    return words.filter(word =>
      allEmotionalWords.some(emotionalWord =>
        word.includes(emotionalWord) || emotionalWord.includes(word)
      )
    ).length;
  }

  /**
   * Detect identity language patterns
   */
  private detectIdentityLanguage(text: string): number {
    let count = 0;

    // Check all identity pattern categories
    Object.values(IDENTITY_PATTERNS).forEach(patterns => {
      patterns.forEach(pattern => {
        if (text.includes(pattern.toLowerCase())) {
          count++;
        }
      });
    });

    return count;
  }

  /**
   * Detect urgency signals
   */
  private detectUrgencySignals(text: string): number {
    let count = 0;

    // Check all urgency pattern categories
    Object.values(URGENCY_PATTERNS).forEach(patterns => {
      patterns.forEach(pattern => {
        if (text.includes(pattern.toLowerCase())) {
          count++;
        }
      });
    });

    return count;
  }

  /**
   * Classify EQ score into category
   */
  private classifyEQ(score: number): EQScore['classification'] {
    if (score >= 80) return 'highly-emotional';
    if (score >= 60) return 'emotional';
    if (score >= 40) return 'balanced';
    if (score >= 20) return 'rational';
    return 'highly-rational';
  }

  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(
    overall: number,
    emotional: number,
    identity: number,
    urgency: number,
    emotionalWords: number,
    totalWords: number
  ): string {
    const parts: string[] = [];

    // Emotional component
    if (emotional > 60) {
      parts.push(`Strong emotional language (${emotionalWords} emotional words in ${totalWords} total)`);
    } else if (emotional > 30) {
      parts.push(`Moderate emotional language`);
    } else {
      parts.push(`Minimal emotional language`);
    }

    // Identity component
    if (identity > 60) {
      parts.push('clear identity positioning');
    } else if (identity > 30) {
      parts.push('some identity signals');
    }

    // Urgency component
    if (urgency > 60) {
      parts.push('high urgency indicators');
    } else if (urgency > 30) {
      parts.push('moderate urgency');
    }

    const description = parts.join(', ');

    // Overall assessment
    if (overall >= 70) {
      return `Highly emotional content with ${description}. Appeals primarily to feelings and desires.`;
    } else if (overall >= 50) {
      return `Emotionally engaging content with ${description}. Balances emotion with information.`;
    } else if (overall >= 30) {
      return `Balanced content with ${description}. Mix of emotional and rational appeals.`;
    } else {
      return `Rational content with ${description}. Emphasizes logic and facts over emotion.`;
    }
  }

  /**
   * Create zero score (for empty inputs)
   */
  private createZeroScore(): EQScore {
    return {
      overall: 0,
      emotional_resonance: 0,
      identity_alignment: 0,
      urgency_signals: 0,
      breakdown: {
        emotionalWords: 0,
        totalWords: 0,
        identityPhrases: 0,
        urgencyPhrases: 0
      },
      classification: 'highly-rational',
      reasoning: 'No text provided for analysis'
    };
  }
}

// Export singleton instance
export const eqCalculator = new EQCalculator();
