/**
 * V4 Funnel Tagger
 *
 * Classifies and tags content by funnel stage:
 * - TOFU (Top of Funnel): Awareness, education, broad appeal
 * - MOFU (Middle of Funnel): Consideration, comparison, deeper engagement
 * - BOFU (Bottom of Funnel): Decision, conversion, direct CTA
 *
 * Also adjusts CTA intensity based on funnel stage.
 *
 * Default distribution: 60% TOFU, 30% MOFU, 10% BOFU
 *
 * Created: 2025-11-26
 */

import type {
  FunnelStage,
  FunnelConfig,
  GeneratedContent
} from './types';
import { FUNNEL_CONFIGS } from './types';

// ============================================================================
// FUNNEL ANALYSIS TYPES
// ============================================================================

interface FunnelAnalysis {
  content: { stage: FunnelStage; confidence: number }[];
  distribution: Record<FunnelStage, number>;
  isBalanced: boolean;
  imbalances: {
    stage: FunnelStage;
    current: number;
    target: number;
    difference: number;
  }[];
  recommendations: string[];
}

interface ContentFunnelScore {
  stage: FunnelStage;
  confidence: number;
  signals: {
    type: 'tofu' | 'mofu' | 'bofu';
    signal: string;
    weight: number;
  }[];
}

interface CTARecommendation {
  stage: FunnelStage;
  intensity: 'low' | 'medium' | 'high';
  suggestedCTAs: string[];
  avoid: string[];
}

// ============================================================================
// SIGNAL DEFINITIONS
// ============================================================================

const TOFU_SIGNALS = {
  // Educational/awareness content
  words: ['learn', 'discover', 'understand', 'what is', 'how does', 'why', 'guide', 'introduction', 'basics', '101', 'tips', 'mistakes', 'myths'],
  ctas: ['follow', 'subscribe', 'learn more', 'read more', 'explore', 'check out'],
  patterns: [/\d+ tips/i, /\d+ ways/i, /\d+ things/i, /beginner/i, /getting started/i]
};

const MOFU_SIGNALS = {
  // Consideration/evaluation content
  words: ['compare', 'vs', 'versus', 'review', 'case study', 'how to', 'step by step', 'implement', 'strategy', 'approach', 'method', 'framework', 'webinar', 'download'],
  ctas: ['download', 'get the guide', 'join webinar', 'watch demo', 'see how', 'get template', 'access'],
  patterns: [/step \d/i, /free (guide|template|checklist)/i, /how we/i, /our approach/i]
};

const BOFU_SIGNALS = {
  // Decision/conversion content
  words: ['buy', 'purchase', 'order', 'sign up', 'start', 'get started', 'try', 'free trial', 'demo', 'pricing', 'quote', 'contact', 'schedule', 'book', 'limited', 'offer', 'discount'],
  ctas: ['buy now', 'get started', 'start free trial', 'book demo', 'schedule call', 'contact us', 'get quote', 'sign up', 'try free'],
  patterns: [/limited (time|offer)/i, /\d+% off/i, /free trial/i, /money back/i, /guarantee/i]
};

// ============================================================================
// FUNNEL TAGGER CLASS
// ============================================================================

class FunnelTagger {
  private targetDistribution: Record<FunnelStage, number> = {
    TOFU: 60,
    MOFU: 30,
    BOFU: 10
  };

  /**
   * Set custom funnel distribution
   */
  setDistribution(distribution: Record<FunnelStage, number>): void {
    const total = distribution.TOFU + distribution.MOFU + distribution.BOFU;
    if (Math.abs(total - 100) > 1) {
      console.warn('[Funnel Tagger] Distribution does not sum to 100%, normalizing...');
      this.targetDistribution = {
        TOFU: Math.round((distribution.TOFU / total) * 100),
        MOFU: Math.round((distribution.MOFU / total) * 100),
        BOFU: Math.round((distribution.BOFU / total) * 100)
      };
    } else {
      this.targetDistribution = distribution;
    }
  }

  /**
   * Tag content with funnel stage
   */
  tagContent(content: { headline?: string; body: string; cta?: string }): ContentFunnelScore {
    const text = `${content.headline || ''} ${content.body}`.toLowerCase();
    const ctaText = (content.cta || '').toLowerCase();

    const signals: ContentFunnelScore['signals'] = [];
    let tofuScore = 0;
    let mofuScore = 0;
    let bofuScore = 0;

    // Check TOFU signals
    TOFU_SIGNALS.words.forEach(word => {
      if (text.includes(word)) {
        tofuScore += 10;
        signals.push({ type: 'tofu', signal: `Contains "${word}"`, weight: 10 });
      }
    });
    TOFU_SIGNALS.ctas.forEach(cta => {
      if (ctaText.includes(cta)) {
        tofuScore += 15;
        signals.push({ type: 'tofu', signal: `CTA: "${cta}"`, weight: 15 });
      }
    });
    TOFU_SIGNALS.patterns.forEach(pattern => {
      if (pattern.test(text)) {
        tofuScore += 12;
        signals.push({ type: 'tofu', signal: `Pattern match: ${pattern.source}`, weight: 12 });
      }
    });

    // Check MOFU signals
    MOFU_SIGNALS.words.forEach(word => {
      if (text.includes(word)) {
        mofuScore += 10;
        signals.push({ type: 'mofu', signal: `Contains "${word}"`, weight: 10 });
      }
    });
    MOFU_SIGNALS.ctas.forEach(cta => {
      if (ctaText.includes(cta)) {
        mofuScore += 15;
        signals.push({ type: 'mofu', signal: `CTA: "${cta}"`, weight: 15 });
      }
    });
    MOFU_SIGNALS.patterns.forEach(pattern => {
      if (pattern.test(text)) {
        mofuScore += 12;
        signals.push({ type: 'mofu', signal: `Pattern match: ${pattern.source}`, weight: 12 });
      }
    });

    // Check BOFU signals (weighted higher)
    BOFU_SIGNALS.words.forEach(word => {
      if (text.includes(word) || ctaText.includes(word)) {
        bofuScore += 15;
        signals.push({ type: 'bofu', signal: `Contains "${word}"`, weight: 15 });
      }
    });
    BOFU_SIGNALS.ctas.forEach(cta => {
      if (ctaText.includes(cta)) {
        bofuScore += 20;
        signals.push({ type: 'bofu', signal: `CTA: "${cta}"`, weight: 20 });
      }
    });
    BOFU_SIGNALS.patterns.forEach(pattern => {
      if (pattern.test(text) || pattern.test(ctaText)) {
        bofuScore += 18;
        signals.push({ type: 'bofu', signal: `Pattern match: ${pattern.source}`, weight: 18 });
      }
    });

    // Determine stage
    const totalScore = tofuScore + mofuScore + bofuScore;
    let stage: FunnelStage;
    let confidence: number;

    if (totalScore === 0) {
      // Default to TOFU if no signals detected
      stage = 'TOFU';
      confidence = 0.5;
    } else if (bofuScore >= mofuScore && bofuScore >= tofuScore) {
      stage = 'BOFU';
      confidence = bofuScore / totalScore;
    } else if (mofuScore >= tofuScore) {
      stage = 'MOFU';
      confidence = mofuScore / totalScore;
    } else {
      stage = 'TOFU';
      confidence = tofuScore / totalScore;
    }

    return {
      stage,
      confidence: Math.min(confidence, 0.95), // Cap at 95%
      signals: signals.slice(0, 5) // Top 5 signals
    };
  }

  /**
   * Analyze funnel distribution of content batch
   */
  analyzeFunnelDistribution(content: GeneratedContent[]): FunnelAnalysis {
    const contentAnalysis = content.map(c => {
      const score = this.tagContent({
        headline: c.headline,
        body: c.body,
        cta: c.cta
      });
      return {
        stage: c.funnelStage || score.stage,
        confidence: score.confidence
      };
    });

    // Count distribution
    const counts: Record<FunnelStage, number> = { TOFU: 0, MOFU: 0, BOFU: 0 };
    contentAnalysis.forEach(c => counts[c.stage]++);

    const total = content.length || 1;
    const distribution: Record<FunnelStage, number> = {
      TOFU: Math.round((counts.TOFU / total) * 100),
      MOFU: Math.round((counts.MOFU / total) * 100),
      BOFU: Math.round((counts.BOFU / total) * 100)
    };

    // Find imbalances
    const imbalances: FunnelAnalysis['imbalances'] = [];
    const stages: FunnelStage[] = ['TOFU', 'MOFU', 'BOFU'];

    for (const stage of stages) {
      const current = distribution[stage];
      const target = this.targetDistribution[stage];
      const difference = current - target;

      if (Math.abs(difference) > 10) { // 10% tolerance
        imbalances.push({ stage, current, target, difference });
      }
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(imbalances, distribution);

    return {
      content: contentAnalysis,
      distribution,
      isBalanced: imbalances.length === 0,
      imbalances,
      recommendations
    };
  }

  /**
   * Get CTA recommendations for funnel stage
   */
  getCTARecommendation(stage: FunnelStage): CTARecommendation {
    const config = FUNNEL_CONFIGS[stage];

    const recommendations: Record<FunnelStage, CTARecommendation> = {
      TOFU: {
        stage: 'TOFU',
        intensity: 'low',
        suggestedCTAs: [
          'Follow for more',
          'Save this for later',
          'Share with someone who needs this',
          'Comment your thoughts',
          'Learn more in bio',
          'What would you add?'
        ],
        avoid: ['Buy now', 'Sign up', 'Start trial', 'Get quote']
      },
      MOFU: {
        stage: 'MOFU',
        intensity: 'medium',
        suggestedCTAs: [
          'Download our free guide',
          'Join the webinar',
          'Get the template',
          'Watch the full video',
          'See how it works',
          'Access the resource'
        ],
        avoid: ['Buy now', 'Limited time offer', 'Discount code']
      },
      BOFU: {
        stage: 'BOFU',
        intensity: 'high',
        suggestedCTAs: [
          'Start your free trial',
          'Book a demo call',
          'Get started today',
          'Claim your spot',
          'Schedule a consultation',
          'Request a quote'
        ],
        avoid: [] // All CTAs appropriate at this stage
      }
    };

    return recommendations[stage];
  }

  /**
   * Get recommended funnel stage for next content
   */
  recommendNextStage(existingContent: GeneratedContent[]): {
    stage: FunnelStage;
    reason: string;
  } {
    const analysis = this.analyzeFunnelDistribution(existingContent);

    // Find most under-represented stage
    const underRepresented = analysis.imbalances
      .filter(i => i.difference < 0)
      .sort((a, b) => a.difference - b.difference);

    if (underRepresented.length > 0) {
      return {
        stage: underRepresented[0].stage,
        reason: `${underRepresented[0].stage} is ${Math.abs(underRepresented[0].difference)}% below target`
      };
    }

    // Default to TOFU (awareness content)
    return {
      stage: 'TOFU',
      reason: 'Balanced distribution - defaulting to awareness content'
    };
  }

  /**
   * Get funnel distribution for a batch count
   */
  getDistributionForCount(count: number): Record<FunnelStage, number> {
    return {
      TOFU: Math.round(count * (this.targetDistribution.TOFU / 100)),
      MOFU: Math.round(count * (this.targetDistribution.MOFU / 100)),
      BOFU: Math.round(count * (this.targetDistribution.BOFU / 100))
    };
  }

  /**
   * Adjust CTA based on funnel stage
   */
  adjustCTA(originalCTA: string, targetStage: FunnelStage): string {
    const recommendation = this.getCTARecommendation(targetStage);

    // If original CTA is too aggressive for stage, soften it
    const isAggressive = BOFU_SIGNALS.ctas.some(cta =>
      originalCTA.toLowerCase().includes(cta)
    );

    if (isAggressive && targetStage === 'TOFU') {
      // Return a softer alternative
      return recommendation.suggestedCTAs[
        Math.floor(Math.random() * recommendation.suggestedCTAs.length)
      ];
    }

    // If original CTA is too soft for BOFU, strengthen it
    const isSoft = TOFU_SIGNALS.ctas.some(cta =>
      originalCTA.toLowerCase().includes(cta)
    );

    if (isSoft && targetStage === 'BOFU') {
      return recommendation.suggestedCTAs[
        Math.floor(Math.random() * recommendation.suggestedCTAs.length)
      ];
    }

    return originalCTA; // Keep original if appropriate
  }

  /**
   * Get stage configuration
   */
  getStageConfig(stage: FunnelStage): FunnelConfig {
    return FUNNEL_CONFIGS[stage];
  }

  /**
   * Get all stage descriptions
   */
  getStageDescriptions(): Record<FunnelStage, {
    name: string;
    description: string;
    goal: string;
    contentTypes: string[];
  }> {
    return {
      TOFU: {
        name: 'Top of Funnel (TOFU)',
        description: 'Awareness stage - attracting new audience',
        goal: 'Educate, inspire, and build brand awareness',
        contentTypes: ['Educational posts', 'Tips & tricks', 'Industry insights', 'Entertaining content']
      },
      MOFU: {
        name: 'Middle of Funnel (MOFU)',
        description: 'Consideration stage - nurturing interest',
        goal: 'Build trust, demonstrate expertise, provide deeper value',
        contentTypes: ['How-to guides', 'Case studies', 'Webinars', 'Comparison content']
      },
      BOFU: {
        name: 'Bottom of Funnel (BOFU)',
        description: 'Decision stage - driving conversion',
        goal: 'Convert interested prospects into customers',
        contentTypes: ['Product demos', 'Testimonials', 'Limited offers', 'Direct CTAs']
      }
    };
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private generateRecommendations(
    imbalances: FunnelAnalysis['imbalances'],
    distribution: Record<FunnelStage, number>
  ): string[] {
    const recommendations: string[] = [];

    for (const imbalance of imbalances) {
      if (imbalance.difference < 0) {
        recommendations.push(
          `Create more ${imbalance.stage} content (+${Math.abs(imbalance.difference)}% needed)`
        );
      } else {
        recommendations.push(
          `Reduce ${imbalance.stage} content (-${imbalance.difference}% over target)`
        );
      }
    }

    // Check for common issues
    if (distribution.BOFU > 20) {
      recommendations.push('Warning: Too much promotional content may fatigue your audience');
    }

    if (distribution.TOFU < 40) {
      recommendations.push('Consider adding more awareness content to grow your audience');
    }

    if (recommendations.length === 0) {
      recommendations.push('Your funnel distribution is well-balanced!');
    }

    return recommendations;
  }
}

// Export singleton instance
export const funnelTagger = new FunnelTagger();

// Export class for testing
export { FunnelTagger };
