/**
 * Hook Post Generator
 *
 * Generates curiosity gap content that creates an information gap
 * the brain feels compelled to close.
 *
 * Techniques:
 * - Open loops
 * - Pattern interrupts
 * - Unexpected contradictions
 * - "What nobody tells you" frameworks
 *
 * Created: 2025-11-10
 */

import type { BreakthroughInsight } from '@/types/breakthrough.types';
import type { BusinessProfile } from '@/types/deepContext.types';
import type {
  ContentDraft,
  BreakthroughContent,
  ContentFormat
} from '@/types/breakthroughContent.types';
import { PowerWordOptimizer } from '../PowerWordOptimizer';
import { ContentPsychologyEngine } from '../ContentPsychologyEngine';

export class HookPostGenerator {
  private powerWordOptimizer: PowerWordOptimizer;
  private psychologyEngine: ContentPsychologyEngine;

  constructor() {
    this.powerWordOptimizer = new PowerWordOptimizer();
    this.psychologyEngine = new ContentPsychologyEngine();
  }

  /**
   * Generate a hook-based post from an insight
   */
  async generate(
    insight: BreakthroughInsight,
    business: BusinessProfile
  ): Promise<BreakthroughContent> {
    const startTime = Date.now();

    // 1. Generate initial draft using curiosity gap techniques
    const draft = this.generateDraft(insight, business);

    // 2. Optimize with power words
    const optimized = await this.powerWordOptimizer.optimize(draft, business);

    // 3. Build complete content object
    const content: BreakthroughContent = {
      id: `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      insightId: insight.id,
      format: 'hook-post',

      content: {
        headline: optimized.headline,
        hook: optimized.hook,
        body: optimized.body,
        cta: optimized.cta,
        hashtags: this.generateHashtags(insight, business)
      },

      psychology: {
        principle: 'Curiosity Gap',
        trigger: {
          type: 'curiosity',
          strength: 0.9,
          target: 'discovery'
        },
        persuasionTechnique: 'Pattern Interrupt',
        expectedReaction: 'Wait, what? I need to know more about this...'
      },

      optimization: {
        powerWords: this.powerWordOptimizer.extractPowerWords(
          `${optimized.headline} ${optimized.hook} ${optimized.body}`
        ),
        framingDevice: this.selectFramingDevice(insight),
        narrativeStructure: 'Hook → Gap → Resolution',
        pacing: 'Fast (curiosity-driven)'
      },

      meta: {
        platform: this.selectPlatforms(business),
        tone: this.selectTone(business),
        length: this.calculateLength(optimized.body),
        targetAudience: business.targetMarket.primarySegments[0]?.description || 'business owners'
      },

      prediction: {
        engagementScore: this.predictEngagement(insight, optimized),
        viralPotential: this.predictViralPotential(insight, optimized),
        leadGeneration: this.predictLeadGeneration(insight, business),
        brandImpact: this.predictBrandImpact(insight),
        confidenceInterval: [0.7, 0.95]
      },

      metadata: {
        generatedAt: new Date(),
        model: 'HookPostGenerator',
        iterationCount: 1,
        impactScore: insight.confidence
      }
    };

    return content;
  }

  /**
   * Generate initial draft using curiosity gap frameworks
   */
  private generateDraft(
    insight: BreakthroughInsight,
    business: BusinessProfile
  ): ContentDraft {
    // Select the best curiosity framework
    const framework = this.selectCuriosityFramework(insight);

    // Generate headline with curiosity gap
    const headline = this.generateCuriosityHeadline(insight, business, framework);

    // Generate hook that deepens the gap
    const hook = this.generateCuriosityHook(insight, business, framework);

    // Generate body that resolves the gap
    const body = this.generateCuriosityBody(insight, business);

    // Generate CTA that maintains momentum
    const cta = this.generateCuriosityCTA(insight, business);

    return { headline, hook, body, cta };
  }

  /**
   * Select the best curiosity framework for this insight
   */
  private selectCuriosityFramework(insight: BreakthroughInsight): CuriosityFramework {
    const frameworks: CuriosityFramework[] = [
      'what-nobody-tells-you',
      'surprising-truth',
      'hidden-connection',
      'counter-intuitive',
      'secret-reason',
      'what-if'
    ];

    // Match framework to insight type
    const frameworkMap: Record<string, CuriosityFramework> = {
      'unexpected_connection': 'hidden-connection',
      'counter_intuitive': 'counter-intuitive',
      'predictive_opportunity': 'what-if',
      'deep_psychology': 'secret-reason',
      'cultural_moment': 'surprising-truth',
      'hidden_pattern': 'what-nobody-tells-you'
    };

    return frameworkMap[insight.type] || 'surprising-truth';
  }

  /**
   * Generate headline using curiosity gap techniques
   */
  private generateCuriosityHeadline(
    insight: BreakthroughInsight,
    business: BusinessProfile,
    framework: CuriosityFramework
  ): string {
    const industry = business.industry;
    const coreInsight = insight.insight;
    const topic = this.extractTopic(coreInsight);

    const templates: Record<CuriosityFramework, string[]> = {
      'what-nobody-tells-you': [
        `What ${industry} companies don't tell you about ${topic}`,
        `The ${industry} secret that changes everything`,
        `Why most ${industry} businesses miss this about ${topic}`
      ],
      'surprising-truth': [
        `The surprising truth about ${this.extractTopic(coreInsight)}`,
        `Why everything you know about ${this.extractTopic(coreInsight)} is wrong`,
        `The unexpected reality of ${this.extractTopic(coreInsight)}`
      ],
      'hidden-connection': [
        `The hidden link between ${this.extractFirstConcept(coreInsight)} and ${this.extractSecondConcept(coreInsight)}`,
        `Why ${this.extractTopic(coreInsight)} is connected to ${industry} success`,
        `The invisible pattern nobody sees in ${industry}`
      ],
      'counter-intuitive': [
        `Why ${this.extractAction(coreInsight)} might be hurting your business`,
        `The counterintuitive truth about ${this.extractTopic(coreInsight)}`,
        `Stop ${this.extractAction(coreInsight)}. Do this instead.`
      ],
      'secret-reason': [
        `The real reason ${this.extractTopic(coreInsight)} matters`,
        `Why your customers secretly want ${this.extractTopic(coreInsight)}`,
        `The hidden psychology behind ${this.extractTopic(coreInsight)}`
      ],
      'what-if': [
        `What if ${this.extractPrediction(coreInsight)}?`,
        `The future of ${industry}: ${this.extractPrediction(coreInsight)}`,
        `Prepare for this: ${this.extractPrediction(coreInsight)}`
      ]
    };

    const options = templates[framework];
    return options[0]; // Use first template (could be randomized)
  }

  /**
   * Generate hook that deepens the curiosity gap
   */
  private generateCuriosityHook(
    insight: BreakthroughInsight,
    business: BusinessProfile,
    framework: CuriosityFramework
  ): string {
    const hooks: Record<CuriosityFramework, string> = {
      'what-nobody-tells-you': `Most ${business.industry} businesses are missing a critical insight. It's not what you think. Here's what's really happening...`,
      'surprising-truth': `I spent 10 years believing the conventional wisdom. Then I discovered something that changed everything.`,
      'hidden-connection': `There's a pattern that 99% of ${business.industry} businesses miss. Once you see it, you can't unsee it.`,
      'counter-intuitive': `Everything you've been taught about this is backwards. And it's costing you customers.`,
      'secret-reason': `Your customers won't tell you this. But their behavior reveals a hidden truth.`,
      'what-if': `What I'm about to share sounds impossible. But the data is undeniable.`
    };

    return hooks[framework];
  }

  /**
   * Generate body that resolves the curiosity gap
   */
  private generateCuriosityBody(
    insight: BreakthroughInsight,
    business: BusinessProfile
  ): string {
    // Structure: Setup → Revelation → Proof → Implication
    const setup = `Here's what I discovered:`;
    const revelation = insight.insight;
    const proof = insight.evidence.slice(0, 2).map(e => `• ${e}`).join('\n');
    const implication = insight.whyProfound;

    return `${setup}\n\n${revelation}\n\n${proof}\n\n${implication}`;
  }

  /**
   * Generate CTA that maintains momentum
   */
  private generateCuriosityCTA(
    insight: BreakthroughInsight,
    business: BusinessProfile
  ): string {
    const ctas = [
      `Want to learn how to apply this to your business? Let's talk.`,
      `This is just the beginning. DM me to discover the full strategy.`,
      `Ready to see how this changes everything? Comment "INSIGHT" below.`,
      `I'm sharing the complete framework next week. Follow for more.`,
      `This insight transformed our approach. Want to see the results?`
    ];

    return ctas[0]; // Could be randomized or selected based on business goal
  }

  /**
   * Generate relevant hashtags
   */
  private generateHashtags(
    insight: BreakthroughInsight,
    business: BusinessProfile
  ): string[] {
    const industry = business.industry.toLowerCase().replace(/\s+/g, '');
    const baseHashtags = [
      industry,
      'business',
      'marketing',
      'growth'
    ];

    const insightHashtags: Record<string, string[]> = {
      'unexpected_connection': ['innovation', 'insights', 'breakthrough'],
      'counter_intuitive': ['mindset', 'strategy', 'truth'],
      'predictive_opportunity': ['future', 'trends', 'opportunity'],
      'deep_psychology': ['psychology', 'behavior', 'customers'],
      'cultural_moment': ['culture', 'trending', 'relevant']
    };

    const relevantHashtags = insightHashtags[insight.type] || ['insights'];

    return [...baseHashtags, ...relevantHashtags].slice(0, 5);
  }

  /**
   * Select platforms based on business profile
   */
  private selectPlatforms(business: BusinessProfile): string[] {
    // Default to LinkedIn for B2B, Instagram for B2C
    const platforms: string[] = [];

    if (business.targetMarket.primarySegments.some(s =>
      s.description.toLowerCase().includes('business') ||
      s.description.toLowerCase().includes('professional')
    )) {
      platforms.push('LinkedIn');
    }

    platforms.push('Instagram', 'Twitter');

    return platforms.slice(0, 2);
  }

  /**
   * Select tone based on business profile
   */
  private selectTone(business: BusinessProfile): string {
    // Default to professional-conversational for most B2B
    return 'professional-conversational';
  }

  /**
   * Calculate content length
   */
  private calculateLength(body: string): number {
    return body.length;
  }

  /**
   * Select framing device
   */
  private selectFramingDevice(insight: BreakthroughInsight): string {
    const devices: Record<string, string> = {
      'unexpected_connection': 'Hidden pattern revelation',
      'counter_intuitive': 'Myth-busting',
      'predictive_opportunity': 'Future prediction',
      'deep_psychology': 'Psychology deep-dive',
      'cultural_moment': 'Cultural observation'
    };

    return devices[insight.type] || 'Curiosity gap';
  }

  /**
   * Predict engagement score
   */
  private predictEngagement(
    insight: BreakthroughInsight,
    draft: ContentDraft
  ): number {
    let score = 0.7; // Base score for curiosity gap format

    // Boost for high confidence insights
    score += insight.confidence * 0.2;

    // Boost for power words in headline
    const powerWords = this.powerWordOptimizer.extractPowerWords(draft.headline);
    score += Math.min(powerWords.length * 0.02, 0.1);

    return Math.min(score, 1.0);
  }

  /**
   * Predict viral potential
   */
  private predictViralPotential(
    insight: BreakthroughInsight,
    draft: ContentDraft
  ): number {
    let score = 0.6; // Base score for hook posts

    // Counter-intuitive insights have higher viral potential
    if (insight.type === 'counter_intuitive') {
      score += 0.15;
    }

    // Unexpected connections are shareable
    if (insight.type === 'unexpected_connection') {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Predict lead generation potential
   */
  private predictLeadGeneration(
    insight: BreakthroughInsight,
    business: BusinessProfile
  ): number {
    let score = 0.65; // Base score for curiosity-driven content

    // B2B businesses see higher lead gen from educational content
    if (business.targetMarket.primarySegments.some(s =>
      s.description.toLowerCase().includes('business')
    )) {
      score += 0.15;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Predict brand impact
   */
  private predictBrandImpact(insight: BreakthroughInsight): number {
    // High confidence insights build authority
    return 0.7 + (insight.confidence * 0.25);
  }

  // Utility methods for extracting concepts from insights
  private extractTopic(text: string): string {
    // Simple extraction - could be enhanced with NLP
    const words = text.toLowerCase().split(' ');
    const stopWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on', 'at'];
    const meaningful = words.filter(w => !stopWords.includes(w) && w.length > 3);
    return meaningful.slice(0, 3).join(' ');
  }

  private extractFirstConcept(text: string): string {
    const concepts = text.split(/and|between|with/);
    return this.extractTopic(concepts[0] || text);
  }

  private extractSecondConcept(text: string): string {
    const concepts = text.split(/and|between|with/);
    return this.extractTopic(concepts[1] || text);
  }

  private extractAction(text: string): string {
    // Extract verb phrases
    const verbs = ['doing', 'using', 'focusing', 'investing', 'building', 'creating'];
    for (const verb of verbs) {
      if (text.toLowerCase().includes(verb)) {
        const index = text.toLowerCase().indexOf(verb);
        return text.substring(index, index + 20).trim();
      }
    }
    return 'this approach';
  }

  private extractPrediction(text: string): string {
    // Extract future-oriented phrases
    if (text.toLowerCase().includes('will')) {
      const index = text.toLowerCase().indexOf('will');
      return text.substring(index).split('.')[0];
    }
    return text.split('.')[0];
  }
}

type CuriosityFramework =
  | 'what-nobody-tells-you'
  | 'surprising-truth'
  | 'hidden-connection'
  | 'counter-intuitive'
  | 'secret-reason'
  | 'what-if';
