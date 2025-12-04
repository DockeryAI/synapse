/**
 * Controversial Post Generator
 *
 * Generates debate-starting content that challenges conventional wisdom
 * while maintaining authenticity and avoiding cheap controversy.
 *
 * Techniques:
 * - Bold contrarian takes (with evidence)
 * - Sacred cow challenging
 * - Industry dogma questioning
 * - Polarizing but principled positions
 *
 * Safety checks:
 * - Validates controversy is substantive, not performative
 * - Ensures position is defensible
 * - Maintains professionalism
 *
 * Created: 2025-11-10
 */

import type { BreakthroughInsight } from '@/types/breakthrough.types';
import type { BusinessProfile } from '@/types/deepContext.types';
import type {
  ContentDraft,
  BreakthroughContent
} from '@/types/breakthroughContent.types';
import { PowerWordOptimizer } from '../PowerWordOptimizer';
import { ContentPsychologyEngine } from '../ContentPsychologyEngine';

export class ControversialPostGenerator {
  private powerWordOptimizer: PowerWordOptimizer;
  private psychologyEngine: ContentPsychologyEngine;

  constructor() {
    this.powerWordOptimizer = new PowerWordOptimizer();
    this.psychologyEngine = new ContentPsychologyEngine();
  }

  /**
   * Generate a controversial post from an insight
   */
  async generate(
    insight: BreakthroughInsight,
    business: BusinessProfile
  ): Promise<BreakthroughContent> {
    const startTime = Date.now();

    // 1. Validate this insight is suitable for controversy
    const validation = this.validateControversy(insight);
    if (!validation.valid) {
      throw new Error(`Insight not suitable for controversy: ${validation.reason}`);
    }

    // 2. Select controversy approach
    const approach = this.selectControversyApproach(insight);

    // 3. Generate initial draft
    const draft = this.generateDraft(insight, business, approach);

    // 4. Optimize with power words (careful - don't make it clickbait)
    const optimized = await this.powerWordOptimizer.optimize(draft, business);

    // 5. Build complete content object
    const content: BreakthroughContent = {
      id: `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      insightId: insight.id,
      format: 'controversial-post',

      content: {
        headline: optimized.headline,
        hook: optimized.hook,
        body: optimized.body,
        cta: optimized.cta,
        hashtags: this.generateHashtags(insight, business)
      },

      psychology: {
        principle: 'Cognitive Dissonance',
        trigger: {
          type: 'challenge',
          strength: 0.95,
          target: 'engagement'
        },
        persuasionTechnique: 'Contrarian Challenge',
        expectedReaction: 'Wait, is this true? I need to think about this... *comments*'
      },

      optimization: {
        powerWords: this.powerWordOptimizer.extractPowerWords(
          `${optimized.headline} ${optimized.hook} ${optimized.body}`
        ),
        framingDevice: approach,
        narrativeStructure: this.describeStructure(approach),
        pacing: 'Fast (debate-driving)'
      },

      meta: {
        platform: this.selectPlatforms(business),
        tone: 'bold-professional',
        length: this.calculateLength(optimized.body),
        targetAudience: business.targetMarket.primarySegments[0]?.description || 'business owners'
      },

      prediction: {
        engagementScore: this.predictEngagement(insight, approach),
        viralPotential: this.predictViralPotential(insight, approach),
        leadGeneration: this.predictLeadGeneration(approach),
        brandImpact: this.predictBrandImpact(insight, approach),
        confidenceInterval: [0.85, 0.98]
      },

      metadata: {
        generatedAt: new Date(),
        model: 'ControversialPostGenerator',
        iterationCount: 1,
        impactScore: insight.confidence
      }
    };

    return content;
  }

  /**
   * Validate that controversy is substantive, not performative
   */
  private validateControversy(insight: BreakthroughInsight): ControversyValidation {
    // Must be counter-intuitive or challenge conventional wisdom
    if (insight.type !== 'counter_intuitive' && !insight.whyProfound.toLowerCase().includes('conventional')) {
      return {
        valid: false,
        reason: 'Insight does not challenge conventional wisdom'
      };
    }

    // Must have strong evidence
    if (insight.evidence.length < 2) {
      return {
        valid: false,
        reason: 'Insufficient evidence to support controversial position'
      };
    }

    // Must have high confidence
    if (insight.confidence < 0.7) {
      return {
        valid: false,
        reason: 'Confidence too low for controversial stance'
      };
    }

    return { valid: true };
  }

  /**
   * Select controversy approach
   */
  private selectControversyApproach(insight: BreakthroughInsight): ControversyApproach {
    const approaches: Record<string, ControversyApproach> = {
      'counter_intuitive': 'sacred-cow',
      'unexpected_connection': 'paradigm-shift',
      'predictive_opportunity': 'early-adopter',
      'deep_psychology': 'uncomfortable-truth',
      'hidden_pattern': 'expose-myth'
    };

    return approaches[insight.type] || 'hot-take';
  }

  /**
   * Generate draft using controversy techniques
   */
  private generateDraft(
    insight: BreakthroughInsight,
    business: BusinessProfile,
    approach: ControversyApproach
  ): ContentDraft {
    const generators: Record<ControversyApproach, () => ContentDraft> = {
      'sacred-cow': () => this.generateSacredCow(insight, business),
      'hot-take': () => this.generateHotTake(insight, business),
      'paradigm-shift': () => this.generateParadigmShift(insight, business),
      'uncomfortable-truth': () => this.generateUncomfortableTruth(insight, business),
      'expose-myth': () => this.generateExposeMyth(insight, business),
      'early-adopter': () => this.generateEarlyAdopter(insight, business)
    };

    return generators[approach]();
  }

  /**
   * Sacred Cow: Challenge industry's most cherished belief
   */
  private generateSacredCow(
    insight: BreakthroughInsight,
    business: BusinessProfile
  ): ContentDraft {
    const headline = `Unpopular Opinion: ${this.extractControversialTake(insight, business)}`;

    const hook = `I'm about to say something that will make most ${business.industry} professionals angry. But someone needs to say it.`;

    const body = this.buildControversialNarrative([
      {
        beat: 'Setup',
        content: `Everyone in ${business.industry} believes that ${this.extractConventionalWisdom(insight)}.`
      },
      {
        beat: 'Challenge',
        content: `I'm here to tell you: that's wrong. And it's costing you.`
      },
      {
        beat: 'Truth',
        content: `Here's what's actually true:\n\n${insight.insight}`
      },
      {
        beat: 'Evidence',
        content: `Don't take my word for it. Look at the evidence:\n${insight.evidence.map(e => `• ${e}`).join('\n')}`
      },
      {
        beat: 'Why',
        content: `Why does everyone get this wrong? ${insight.whyProfound}`
      },
      {
        beat: 'Stakes',
        content: `The businesses that keep believing the old way will fall behind. The ones that embrace this truth will dominate.`
      }
    ]);

    const cta = `Disagree? Good. Let's debate in the comments. I'll respond to every argument.`;

    return { headline, hook, body, cta };
  }

  /**
   * Hot Take: Bold, defensible opinion
   */
  private generateHotTake(
    insight: BreakthroughInsight,
    business: BusinessProfile
  ): ContentDraft {
    const headline = `Hot Take: ${this.extractHotTake(insight, business)}`;

    const hook = `This will be controversial. I don't care. It needs to be said.`;

    const body = this.buildControversialNarrative([
      {
        beat: 'Position',
        content: `My position: ${insight.insight}`
      },
      {
        beat: 'Why This Matters',
        content: `Why this matters: ${insight.whyProfound}`
      },
      {
        beat: 'Why Now',
        content: `Why now: ${insight.whyNow}`
      },
      {
        beat: 'Evidence',
        content: `Why I'm right:\n${insight.evidence.map((e, i) => `${i + 1}. ${e}`).join('\n')}`
      },
      {
        beat: 'Conclusion',
        content: `You can disagree. But you can't ignore the data.`
      }
    ]);

    const cta = `Change my mind. I'm listening.`;

    return { headline, hook, body, cta };
  }

  /**
   * Paradigm Shift: Challenge the entire framework
   */
  private generateParadigmShift(
    insight: BreakthroughInsight,
    business: BusinessProfile
  ): ContentDraft {
    const headline = `We've Been Thinking About ${business.industry} All Wrong`;

    const hook = `The entire ${business.industry} industry is operating on an outdated paradigm. Time for a new one.`;

    const body = this.buildControversialNarrative([
      {
        beat: 'Old Paradigm',
        content: `The old way: ${this.extractOldParadigm(insight, business)}`
      },
      {
        beat: 'Why It Fails',
        content: `Why that doesn't work anymore: ${insight.whyNow}`
      },
      {
        beat: 'New Paradigm',
        content: `The new paradigm:\n\n${insight.insight}`
      },
      {
        beat: 'Evidence',
        content: `Proof this works:\n${insight.evidence.map(e => `• ${e}`).join('\n')}`
      },
      {
        beat: 'Transition',
        content: `How to make the shift: ${insight.contentAngle}`
      }
    ]);

    const cta = `Ready to embrace the new paradigm? Or comfortable with the old one? Your choice.`;

    return { headline, hook, body, cta };
  }

  /**
   * Uncomfortable Truth: Say what others won't
   */
  private generateUncomfortableTruth(
    insight: BreakthroughInsight,
    business: BusinessProfile
  ): ContentDraft {
    const headline = `The Truth About ${business.industry} That Nobody Wants to Hear`;

    const hook = `This is uncomfortable. But pretending it's not true won't make it go away.`;

    const body = this.buildControversialNarrative([
      {
        beat: 'Uncomfortable Truth',
        content: `Here's what nobody wants to admit:\n\n${insight.insight}`
      },
      {
        beat: 'Why Hidden',
        content: `Why nobody talks about this: ${insight.whyProfound}`
      },
      {
        beat: 'Reality',
        content: `But the data doesn't lie:\n${insight.evidence.map(e => `• ${e}`).join('\n')}`
      },
      {
        beat: 'Cost of Denial',
        content: `Ignoring this truth has a cost. And you're paying it every day.`
      },
      {
        beat: 'Path Forward',
        content: `What to do instead: ${insight.contentAngle}`
      }
    ]);

    const cta = `Ready to face the truth? Or more comfortable with the lie?`;

    return { headline, hook, body, cta };
  }

  /**
   * Expose Myth: Debunk industry mythology
   */
  private generateExposeMyth(
    insight: BreakthroughInsight,
    business: BusinessProfile
  ): ContentDraft {
    const headline = `Stop Believing This ${business.industry} Myth`;

    const hook = `Everyone repeats this. Everyone believes it. And it's completely false.`;

    const body = this.buildControversialNarrative([
      {
        beat: 'Myth',
        content: `The myth: "${this.extractMyth(insight, business)}"`
      },
      {
        beat: 'Why Believed',
        content: `Why everyone believes it: It sounds good. It's been repeated forever. And challenging it feels risky.`
      },
      {
        beat: 'Reality',
        content: `The reality:\n\n${insight.insight}`
      },
      {
        beat: 'Proof',
        content: `Here's the proof:\n${insight.evidence.map((e, i) => `${i + 1}. ${e}`).join('\n')}`
      },
      {
        beat: 'Impact',
        content: `Why this matters: ${insight.whyProfound}`
      }
    ]);

    const cta = `Still believe the myth? Show me your data.`;

    return { headline, hook, body, cta };
  }

  /**
   * Early Adopter: Stake out cutting-edge position
   */
  private generateEarlyAdopter(
    insight: BreakthroughInsight,
    business: BusinessProfile
  ): ContentDraft {
    const headline = `${business.industry} Is About To Change. Are You Ready?`;

    const hook = `Most people won't believe this until it's too late. I'm staking my reputation on it now.`;

    const body = this.buildControversialNarrative([
      {
        beat: 'Prediction',
        content: `My controversial prediction:\n\n${insight.insight}`
      },
      {
        beat: 'Why Coming',
        content: `Why this is inevitable: ${insight.whyNow}`
      },
      {
        beat: 'Early Signals',
        content: `The early signals are already here:\n${insight.evidence.map(e => `• ${e}`).join('\n')}`
      },
      {
        beat: 'Impact',
        content: `What this means: ${insight.whyProfound}`
      },
      {
        beat: 'Action',
        content: `Smart businesses are preparing now. Laggards will scramble later.`
      }
    ]);

    const cta = `I'm positioning my business for this future. Are you?`;

    return { headline, hook, body, cta };
  }

  /**
   * Build controversial narrative
   */
  private buildControversialNarrative(beats: NarrativeBeat[]): string {
    return beats.map(beat => beat.content).join('\n\n');
  }

  /**
   * Describe narrative structure
   */
  private describeStructure(approach: ControversyApproach): string {
    const descriptions: Record<ControversyApproach, string> = {
      'sacred-cow': 'Setup → Challenge → Truth → Evidence → Stakes',
      'hot-take': 'Position → Evidence → Defense',
      'paradigm-shift': 'Old → Why Failed → New → Proof',
      'uncomfortable-truth': 'Truth → Why Hidden → Reality → Path',
      'expose-myth': 'Myth → Reality → Proof → Impact',
      'early-adopter': 'Prediction → Signals → Preparation'
    };

    return descriptions[approach];
  }

  /**
   * Generate hashtags
   */
  private generateHashtags(
    insight: BreakthroughInsight,
    business: BusinessProfile
  ): string[] {
    const industry = business.industry.toLowerCase().replace(/\s+/g, '');
    return [
      industry,
      'unpopularopinion',
      'hottake',
      'truth',
      'debate'
    ];
  }

  /**
   * Select platforms (controversial content works on Twitter and LinkedIn)
   */
  private selectPlatforms(business: BusinessProfile): string[] {
    return ['LinkedIn', 'Twitter'];
  }

  /**
   * Calculate content length
   */
  private calculateLength(body: string): number {
    return body.length;
  }

  /**
   * Predict engagement (controversy drives engagement)
   */
  private predictEngagement(
    insight: BreakthroughInsight,
    approach: ControversyApproach
  ): number {
    let score = 0.9; // Base score for controversial content

    // Sacred cows generate the most engagement
    if (approach === 'sacred-cow') {
      score = 0.95;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Predict viral potential (controversy spreads)
   */
  private predictViralPotential(
    insight: BreakthroughInsight,
    approach: ControversyApproach
  ): number {
    let score = 0.85; // High viral potential for controversy

    // Paradigm shifts and uncomfortable truths have highest viral potential
    if (approach === 'paradigm-shift' || approach === 'uncomfortable-truth') {
      score = 0.92;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Predict lead generation (mixed - polarizing)
   */
  private predictLeadGeneration(approach: ControversyApproach): number {
    // Controversy attracts aligned leads but repels others
    return 0.7;
  }

  /**
   * Predict brand impact (strong positioning)
   */
  private predictBrandImpact(
    insight: BreakthroughInsight,
    approach: ControversyApproach
  ): number {
    // Taking a stand builds strong brand identity
    return 0.88;
  }

  // Utility methods
  private extractControversialTake(insight: BreakthroughInsight, business: BusinessProfile): string {
    return `${business.industry} businesses are doing ${this.extractAction(insight.insight)} all wrong`;
  }

  private extractHotTake(insight: BreakthroughInsight, business: BusinessProfile): string {
    return insight.insight.split('.')[0];
  }

  private extractConventionalWisdom(insight: BreakthroughInsight): string {
    const text = insight.insight.toLowerCase();
    if (text.includes('not')) {
      // Extract the opposite
      return text.replace('not', '').split('.')[0];
    }
    return 'following the standard approach is best';
  }

  private extractOldParadigm(insight: BreakthroughInsight, business: BusinessProfile): string {
    return `Success in ${business.industry} comes from following established best practices`;
  }

  private extractMyth(insight: BreakthroughInsight, business: BusinessProfile): string {
    return `To succeed in ${business.industry}, you must ${this.extractAction(insight.insight)}`;
  }

  private extractAction(text: string): string {
    // Extract action phrases
    const verbs = ['focus on', 'invest in', 'prioritize', 'follow', 'adopt'];
    for (const verb of verbs) {
      if (text.toLowerCase().includes(verb)) {
        const index = text.toLowerCase().indexOf(verb);
        return text.substring(index, index + 30).trim();
      }
    }
    return 'do things the traditional way';
  }
}

type ControversyApproach =
  | 'sacred-cow'
  | 'hot-take'
  | 'paradigm-shift'
  | 'uncomfortable-truth'
  | 'expose-myth'
  | 'early-adopter';

interface NarrativeBeat {
  beat: string;
  content: string;
}

interface ControversyValidation {
  valid: boolean;
  reason?: string;
}
