/**
 * Content Quality Scorer Service
 *
 * Comprehensive quality scoring system with 5 dimensions:
 * 1. Customer Relevance (0-10)
 * 2. Actionability (0-10)
 * 3. Uniqueness (0-10)
 * 4. Framework Alignment (0-10)
 * 5. Emotional Pull (0-10)
 *
 * Total: 0-50, threshold: 35
 *
 * Phase 3: Quality Scoring & Filtering
 */

import type { SynapseInsight } from '@/types/synapse/synapse.types';
import type { InsightCluster } from '@/services/intelligence/clustering.service';

export interface QualityScore {
  total: number;  // 0-50
  passed: boolean;  // total >= 35
  breakdown: {
    customerRelevance: number;  // 0-10
    actionability: number;  // 0-10
    uniqueness: number;  // 0-10
    frameworkAlignment: number;  // 0-10
    emotionalPull: number;  // 0-10
  };
  reasons: string[];
  rejectionReasons?: string[];
}

class ContentQualityScorer {
  private readonly PASS_THRESHOLD = 35;  // out of 50

  /**
   * Rejection patterns that immediately fail content
   */
  private readonly REJECTION_PATTERNS = [
    // Generic patterns
    { pattern: /(product|service) quality loved/i, reason: 'Generic "Product Quality Loved" pattern' },
    { pattern: /best.*pattern/i, reason: 'Generic "Best Pattern" phrase' },
    { pattern: /loved.*pattern/i, reason: 'Generic "Loved Pattern" phrase' },

    // Keyword concatenation
    { pattern: /\w+\s*[\+\=]\s*\w+/i, reason: 'Keyword concatenation detected' },

    // Business advice (not customer-focused)
    { pattern: /(how to|ways to) (improve|optimize|grow) your (business|restaurant|shop|store)/i, reason: 'Business operations advice (not customer-focused)' },
    { pattern: /(increase|boost|maximize) your (profit|revenue|efficiency)/i, reason: 'Business operations focus' },

    // Invented specials/promotions
    { pattern: /(new|special|limited) (offer|deal|promotion|discount) (available|starting|ending)/i, reason: 'Potentially invented promotion' },

    // Vague generic claims
    { pattern: /^(we are|we're) (the )?best/i, reason: 'Vague "we are the best" claim' },
    { pattern: /number one (in|for)/i, reason: 'Unsubstantiated "number one" claim' }
  ];

  /**
   * Score complete synapse insight
   */
  scoreSynapse(synapse: SynapseInsight): QualityScore {
    const breakdown = {
      customerRelevance: this.scoreCustomerRelevance(synapse.insight, synapse.contentAngle),
      actionability: this.scoreActionability(synapse.contentAngle, synapse.expectedReaction),
      uniqueness: this.scoreUniqueness(synapse.insight, synapse.whyProfound),
      frameworkAlignment: this.scoreFrameworkAlignment(synapse),
      emotionalPull: this.scoreEmotionalPull(synapse.insight, synapse.expectedReaction)
    };

    const total = Object.values(breakdown).reduce((sum, score) => sum + score, 0);
    const passed = total >= this.PASS_THRESHOLD;

    // Check rejection patterns
    const rejectionReasons = this.checkRejectionPatterns(synapse.insight);
    const finalPassed = passed && rejectionReasons.length === 0;

    const reasons = this.generateScoreReasons(breakdown, total, rejectionReasons);

    return {
      total,
      passed: finalPassed,
      breakdown,
      reasons,
      rejectionReasons: rejectionReasons.length > 0 ? rejectionReasons : undefined
    };
  }

  /**
   * Score cluster theme
   */
  scoreClusterTheme(theme: string, dataPoints: any[] = []): QualityScore {
    const breakdown = {
      customerRelevance: this.scoreCustomerRelevance(theme, ''),
      actionability: this.scoreActionability(theme, ''),
      uniqueness: this.scoreUniqueness(theme, ''),
      frameworkAlignment: 5,  // Neutral for clusters (frameworks applied to synapses)
      emotionalPull: this.scoreEmotionalPull(theme, '')
    };

    const total = Object.values(breakdown).reduce((sum, score) => sum + score, 0);
    const passed = total >= this.PASS_THRESHOLD;

    const rejectionReasons = this.checkRejectionPatterns(theme);
    const finalPassed = passed && rejectionReasons.length === 0;

    const reasons = this.generateScoreReasons(breakdown, total, rejectionReasons);

    return {
      total,
      passed: finalPassed,
      breakdown,
      reasons,
      rejectionReasons: rejectionReasons.length > 0 ? rejectionReasons : undefined
    };
  }

  /**
   * Score customer relevance (0-10)
   * Does this matter to customers? Is it from their perspective?
   */
  private scoreCustomerRelevance(insight: string, contentAngle: string): number {
    let score = 5;  // Start at neutral

    const combined = (insight + ' ' + contentAngle).toLowerCase();

    // Positive signals (customer-focused language)
    const customerSignals = [
      /\byou\b/i, /\byour\b/i, /customers?/i, /people/i,
      /get|save|enjoy|notice|feel|experience/i,
      /for you|helps you|gives you/i
    ];

    for (const signal of customerSignals) {
      if (signal.test(combined)) {
        score += 1;
        if (score >= 10) break;
      }
    }

    // Negative signals (business-focused language)
    const businessSignals = [
      /your (business|restaurant|shop|store)/i,
      /operations?|efficiency|workflow|process/i,
      /profit|revenue|ROI/i,
      /manage|optimize|streamline/i
    ];

    for (const signal of businessSignals) {
      if (signal.test(combined)) {
        score -= 2;
      }
    }

    return Math.max(0, Math.min(10, score));
  }

  /**
   * Score actionability (0-10)
   * Can customers take action? Is there a clear next step?
   */
  private scoreActionability(contentAngle: string, expectedReaction: string): number {
    let score = 5;  // Start at neutral

    const combined = (contentAngle + ' ' + expectedReaction).toLowerCase();

    // Action verbs
    const actionVerbs = [
      /\b(try|visit|call|book|order|buy|join|sign up|check out|discover|explore)\b/i,
      /\b(get|grab|claim|reserve|schedule|request)\b/i
    ];

    for (const verb of actionVerbs) {
      if (verb.test(combined)) {
        score += 2;
        if (score >= 10) break;
      }
    }

    // Call-to-action phrases
    if (/come (in|by|see)|stop (by|in)|give .* a (try|call)/i.test(combined)) {
      score += 2;
    }

    // Specific outcomes
    if (/save \d+|in \d+ minutes?|before \d+|within \d+/i.test(combined)) {
      score += 1;
    }

    return Math.max(0, Math.min(10, score));
  }

  /**
   * Score uniqueness (0-10)
   * Is this novel? Not generic or obvious?
   */
  private scoreUniqueness(insight: string, whyProfound: string): number {
    let score = 5;  // Start at neutral

    const combined = (insight + ' ' + whyProfound).toLowerCase();

    // Generic phrases reduce score
    const genericPhrases = [
      /\bgreat\b|\bgood\b|\bnice\b|\bbest\b/i,
      /quality|service|products?/i,
      /amazing|awesome|excellent/i
    ];

    let genericCount = 0;
    for (const phrase of genericPhrases) {
      if (phrase.test(combined)) {
        genericCount++;
      }
    }

    score -= genericCount;

    // Specific details increase score
    if (/\d+\s*(minutes?|hours?|days?|%|percent|dollars?)/i.test(combined)) {
      score += 2;  // Specific numbers
    }

    if (combined.length > 50 && combined.split(/\s+/).length > 8) {
      score += 1;  // Detailed content
    }

    // Unexpected/novel language
    const noveltyIndicators = [
      /why .*(different|unique|special)/i,
      /hidden|secret|unexpected|surprising/i,
      /most don't (know|realize|notice)/i,
      /unlike|different from|compared to/i
    ];

    for (const indicator of noveltyIndicators) {
      if (indicator.test(combined)) {
        score += 1.5;
      }
    }

    return Math.max(0, Math.min(10, score));
  }

  /**
   * Score framework alignment (0-10)
   * Does this follow the selected framework's structure?
   */
  private scoreFrameworkAlignment(synapse: SynapseInsight): number {
    let score = 5;  // Start at neutral

    // If framework was used and has high confidence, boost score
    if (synapse.frameworkUsed) {
      const confidence = synapse.frameworkUsed.confidence || 0;
      score += confidence * 5;  // Max +5 for perfect confidence
    }

    // Check if insight structure matches framework
    // e.g., PAS should have problem → agitate → solution
    if (synapse.frameworkUsed?.id === 'problem-agitate-solution') {
      if (/problem|issue|challenge/i.test(synapse.insight) &&
          /solution|fix|answer/i.test(synapse.contentAngle)) {
        score += 2;
      }
    }

    // AIDA should have attention → interest → desire → action
    if (synapse.frameworkUsed?.id === 'aida') {
      if (/attention|notice|see|look/i.test(synapse.insight) &&
          /action|try|visit|get/i.test(synapse.contentAngle)) {
        score += 2;
      }
    }

    return Math.max(0, Math.min(10, score));
  }

  /**
   * Score emotional pull (0-10)
   * Does this evoke emotion or create connection?
   */
  private scoreEmotionalPull(insight: string, expectedReaction: string): number {
    let score = 5;  // Start at neutral

    const combined = (insight + ' ' + expectedReaction).toLowerCase();

    // Emotion words
    const emotionWords = [
      /love|hate|fear|excited?|surprised?|shocked?/i,
      /frustrated?|annoyed|happy|sad|angry/i,
      /curious|interested|fascinated|intrigued/i,
      /worried|concerned|relieved|satisfied/i
    ];

    for (const emotion of emotionWords) {
      if (emotion.test(combined)) {
        score += 1.5;
        if (score >= 10) break;
      }
    }

    // Personal/relatable language
    if (/you know (that|when|how)/i.test(combined) ||
        /ever (noticed?|wondered?|felt)/i.test(combined) ||
        /remember (when|that|how)/i.test(combined)) {
      score += 1;
    }

    // Sensory language
    if (/taste|smell|feel|see|hear|sounds? like|looks? like/i.test(combined)) {
      score += 1;
    }

    return Math.max(0, Math.min(10, score));
  }

  /**
   * Check content against rejection patterns
   */
  private checkRejectionPatterns(content: string): string[] {
    const rejections: string[] = [];

    for (const { pattern, reason } of this.REJECTION_PATTERNS) {
      if (pattern.test(content)) {
        rejections.push(reason);
      }
    }

    return rejections;
  }

  /**
   * Generate human-readable score reasons
   */
  private generateScoreReasons(breakdown: any, total: number, rejectionReasons: string[]): string[] {
    const reasons: string[] = [];

    // Overall assessment
    if (total >= 40) {
      reasons.push('✅ High quality content');
    } else if (total >= 35) {
      reasons.push('✓ Acceptable quality');
    } else if (total >= 25) {
      reasons.push('⚠️  Below quality threshold');
    } else {
      reasons.push('❌ Poor quality');
    }

    // Breakdown highlights
    for (const [dimension, score] of Object.entries(breakdown)) {
      const numScore = score as number;
      if (numScore >= 8) {
        reasons.push(`Strong ${dimension}`);
      } else if (numScore <= 3) {
        reasons.push(`Weak ${dimension}`);
      }
    }

    // Rejection reasons
    if (rejectionReasons.length > 0) {
      reasons.push(...rejectionReasons.map(r => `🚫 ${r}`));
    }

    return reasons;
  }

  /**
   * Get detailed explanation of score
   */
  explainScore(score: QualityScore): string {
    let explanation = `**Content Quality Score**: ${score.total}/50 (${score.passed ? 'PASSED ✅' : 'FAILED ❌'})\n\n`;

    explanation += `**Breakdown**:\n`;
    explanation += `- Customer Relevance: ${score.breakdown.customerRelevance}/10\n`;
    explanation += `- Actionability: ${score.breakdown.actionability}/10\n`;
    explanation += `- Uniqueness: ${score.breakdown.uniqueness}/10\n`;
    explanation += `- Framework Alignment: ${score.breakdown.frameworkAlignment}/10\n`;
    explanation += `- Emotional Pull: ${score.breakdown.emotionalPull}/10\n\n`;

    if (score.rejectionReasons && score.rejectionReasons.length > 0) {
      explanation += `**Rejection Reasons**:\n`;
      for (const reason of score.rejectionReasons) {
        explanation += `🚫 ${reason}\n`;
      }
      explanation += `\n`;
    }

    explanation += `**Assessment**: ${score.reasons.join(', ')}\n`;

    return explanation;
  }
}

export const contentQualityScorer = new ContentQualityScorer();
