/**
 * Hook Post Generator
 *
 * Generates social media content using the Hook-Story-Offer framework
 * for maximum engagement and conversion.
 *
 * Framework: Hook-Story-Offer (Social Media Standard)
 * - Hook: Stop the scroll with pattern interrupt
 * - Story: Build connection through narrative
 * - Offer: Clear call-to-action with value
 *
 * Created: 2025-11-10
 * Updated: 2025-11-11 - COMPLETE REWRITE to use framework-guided generation
 */

import type { BreakthroughInsight } from '@/types/breakthrough.types';
import type {
  ContentDraft,
  SynapseContent,
  BusinessProfile
} from '@/types/synapseContent.types';
import { PowerWordOptimizer } from '../PowerWordOptimizer';
import { HOOK_STORY_OFFER, type ContentFramework } from '../ContentFrameworkLibrary';
import { detectTargetAudience, getCleanEvidence } from '../utils/audienceDetection';

export class HookPostGenerator {
  private powerWordOptimizer: PowerWordOptimizer;
  private framework: ContentFramework;

  constructor() {
    this.powerWordOptimizer = new PowerWordOptimizer();
    this.framework = HOOK_STORY_OFFER;
  }

  /**
   * Generate a hook-based post from an insight
   */
  async generate(
    insight: BreakthroughInsight,
    business: BusinessProfile
  ): Promise<SynapseContent> {
    // Detect actual target audience
    const targetAudience = detectTargetAudience(business);

    // Generate draft following Hook-Story-Offer framework stages
    const draft = this.generateFrameworkGuidedDraft(insight, business, targetAudience);

    // Optimize with power words
    const optimized = await this.powerWordOptimizer.optimize(draft, business);

    // Build complete content object
    const content: SynapseContent = {
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
        expectedReaction: insight.expectedReaction || 'I need to know more about this'
      },

      optimization: {
        powerWords: this.powerWordOptimizer.extractPowerWords(
          `${optimized.headline} ${optimized.hook} ${optimized.body}`
        ),
        framingDevice: this.framework.name,
        narrativeStructure: this.framework.stages.map(s => s.name).join(' → '),
        pacing: 'Fast (curiosity-driven)'
      },

      meta: {
        platform: ['LinkedIn', 'Instagram'],
        tone: 'professional',
        targetAudience
      },

      prediction: {
        engagementScore: this.predictEngagement(insight, optimized),
        viralPotential: this.predictViralPotential(insight),
        leadGeneration: this.predictLeadGeneration(targetAudience),
        brandImpact: 'positive' as const,
        confidenceLevel: insight.confidence
      },

      framework: {
        id: this.framework.id,
        name: this.framework.name,
        stages: this.framework.stages.map(s => s.name),
        reasoning: 'Hook-Story-Offer is the gold standard for social media engagement. Creates pattern interrupt, builds connection, drives action.'
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
   * Generate draft following Hook-Story-Offer framework stages
   *
   * This is the KEY METHOD - it walks through the framework stages
   * and uses the stage guidelines to construct content from the insight
   */
  private generateFrameworkGuidedDraft(
    insight: BreakthroughInsight,
    business: BusinessProfile,
    targetAudience: string
  ): ContentDraft {
    // Get clean evidence (filter out search keywords)
    const cleanEvidence = getCleanEvidence(insight.evidence, 3);

    // STAGE 1: HOOK
    // Purpose: Stop the scroll - create pattern interrupt
    // Guidelines: First 1-2 lines must grab attention
    const hook = this.buildHookStage(insight, targetAudience);

    // STAGE 2: STORY
    // Purpose: Build connection through narrative
    // Guidelines: Use insight as story driver, show transformation
    const story = this.buildStoryStage(insight, cleanEvidence);

    // STAGE 3: OFFER
    // Purpose: Clear call-to-action with value
    // Guidelines: Make offer clear and specific
    const offer = this.buildOfferStage(insight, business, targetAudience);

    // Assemble into content structure
    const headline = this.extractHeadline(insight);
    const body = `${story}`;
    const cta = offer;

    return {
      format: 'hook-post',
      headline,
      hook,
      body,
      cta
    };
  }

  /**
   * STAGE 1: Build Hook
   *
   * Framework guideline: "Stop the scroll - create pattern interrupt"
   * Uses: insight.insight, insight.contentAngle
   */
  private buildHookStage(insight: BreakthroughInsight, targetAudience: string): string {
    // Use the content angle as the primary hook
    if (insight.contentAngle && insight.contentAngle.length > 10) {
      return insight.contentAngle;
    }

    // Fall back to the core insight
    return insight.insight.split('.')[0] + '.';
  }

  /**
   * STAGE 2: Build Story
   *
   * Framework guideline: "Build connection through narrative"
   * Uses: insight.whyProfound, evidence, whyNow
   */
  private buildStoryStage(insight: BreakthroughInsight, cleanEvidence: string[]): string {
    const parts: string[] = [];

    // Start with why this is profound
    if (insight.whyProfound) {
      parts.push(insight.whyProfound);
    }

    // Add evidence if available (real evidence, not search keywords)
    if (cleanEvidence.length > 0) {
      parts.push('\n\nWhat we\'re seeing:');
      cleanEvidence.forEach(evidence => {
        parts.push(`• ${evidence}`);
      });
    }

    // Add urgency/timing if present
    if (insight.whyNow && insight.whyNow.length > 15) {
      parts.push(`\n\n${insight.whyNow}`);
    }

    return parts.join('\n');
  }

  /**
   * STAGE 3: Build Offer
   *
   * Framework guideline: "Clear call-to-action with value"
   * Uses: business context, targetAudience
   */
  private buildOfferStage(
    insight: BreakthroughInsight,
    business: BusinessProfile,
    targetAudience: string
  ): string {
    // Create specific, value-driven CTAs
    const offers = [
      `Want to explore how this applies to your business? Let's connect.`,
      `This insight changes everything. DM me to discuss how ${business.name} can help.`,
      `Ready to capitalize on this? Reach out and let's talk strategy.`,
      `${business.name} specializes in helping ${targetAudience} leverage insights like this. Let's chat.`
    ];

    // Select based on insight type
    if (insight.type === 'predictive_opportunity') {
      return `This opportunity won't last forever. ${offers[2]}`;
    } else if (insight.type === 'counter_intuitive') {
      return offers[1];
    } else {
      return offers[0];
    }
  }

  /**
   * Extract headline from insight
   */
  private extractHeadline(insight: BreakthroughInsight): string {
    // Priority: contentAngle > first sentence of insight
    if (insight.contentAngle && insight.contentAngle.length > 10) {
      return insight.contentAngle.split('.')[0];
    }

    // Use first sentence of core insight
    const firstSentence = insight.insight.split('.')[0];
    return firstSentence.length > 100 ? firstSentence.substring(0, 97) + '...' : firstSentence;
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
      'growth'
    ];

    const insightHashtags: Record<string, string[]> = {
      'unexpected_connection': ['innovation', 'insights'],
      'counter_intuitive': ['mindset', 'strategy'],
      'predictive_opportunity': ['trends', 'opportunity'],
      'deep_psychology': ['psychology', 'customers'],
      'cultural_moment': ['trending', 'relevant']
    };

    const relevantHashtags = insightHashtags[insight.type] || ['insights'];

    return [...baseHashtags, ...relevantHashtags].slice(0, 5);
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
  private predictViralPotential(insight: BreakthroughInsight): number {
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
  private predictLeadGeneration(targetAudience: string): number {
    let score = 0.65; // Base score for curiosity-driven content

    // B2B audiences see higher lead gen from educational content
    if (targetAudience.toLowerCase().includes('business') ||
        targetAudience.toLowerCase().includes('professional')) {
      score += 0.15;
    }

    return Math.min(score, 1.0);
  }
}
