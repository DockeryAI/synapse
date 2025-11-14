/**
 * Story Post Generator
 *
 * Generates narrative-driven content using the Before-After-Bridge framework
 * to create emotional connection through transformation stories.
 *
 * Framework: Before-After-Bridge (BAB)
 * - Before: The old situation/problem
 * - After: The new reality/solution
 * - Bridge: How the transformation happened
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
import { BEFORE_AFTER_BRIDGE, type ContentFramework } from '../ContentFrameworkLibrary';
import { detectTargetAudience, getCleanEvidence } from '../utils/audienceDetection';

export class StoryPostGenerator {
  private powerWordOptimizer: PowerWordOptimizer;
  private framework: ContentFramework;

  constructor() {
    this.powerWordOptimizer = new PowerWordOptimizer();
    this.framework = BEFORE_AFTER_BRIDGE;
  }

  /**
   * Generate a story-based post from an insight
   */
  async generate(
    insight: BreakthroughInsight,
    business: BusinessProfile
  ): Promise<SynapseContent> {
    // Detect actual target audience
    const targetAudience = detectTargetAudience(business);

    // Generate draft following Before-After-Bridge framework
    const draft = this.generateFrameworkGuidedDraft(insight, business, targetAudience);

    // Optimize with power words
    const optimized = await this.powerWordOptimizer.optimize(draft, business);

    // Build complete content object
    const content: SynapseContent = {
      id: `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      insightId: insight.id,
      format: 'story-post',

      content: {
        headline: optimized.headline,
        hook: optimized.hook,
        body: optimized.body,
        cta: optimized.cta,
        hashtags: this.generateHashtags(insight, business)
      },

      psychology: {
        principle: 'Narrative Transportation',
        trigger: {
          type: 'aspiration',
          strength: 0.85,
          target: 'connection'
        },
        persuasionTechnique: 'Storytelling',
        expectedReaction: insight.expectedReaction || 'I can relate to this journey'
      },

      optimization: {
        powerWords: this.powerWordOptimizer.extractPowerWords(
          `${optimized.headline} ${optimized.hook} ${optimized.body}`
        ),
        framingDevice: this.framework.name,
        narrativeStructure: this.framework.stages.map(s => s.name).join(' → '),
        pacing: 'Medium (story-driven)'
      },

      meta: {
        platform: ['LinkedIn', 'Facebook'],
        tone: 'inspirational',
        targetAudience
      },

      prediction: {
        engagementScore: 0.75,
        viralPotential: 0.65,
        leadGeneration: 0.7,
        brandImpact: 'positive' as const,
        confidenceLevel: insight.confidence
      },

      framework: {
        id: this.framework.id,
        name: this.framework.name,
        stages: this.framework.stages.map(s => s.name),
        reasoning: 'Before-After-Bridge perfect for showing transformation and building emotional connection'
      },

      metadata: {
        generatedAt: new Date(),
        model: 'StoryPostGenerator',
        iterationCount: 1,
        impactScore: insight.confidence
      }
    };

    return content;
  }

  /**
   * Generate draft following Before-After-Bridge framework
   */
  private generateFrameworkGuidedDraft(
    insight: BreakthroughInsight,
    business: BusinessProfile,
    targetAudience: string
  ): ContentDraft {
    // Get clean evidence
    const cleanEvidence = getCleanEvidence(insight.evidence, 3);

    // STAGE 1: BEFORE
    // Purpose: Show the old situation/problem
    const before = this.buildBeforeStage(insight, targetAudience);

    // STAGE 2: AFTER
    // Purpose: Show the new reality/solution
    const after = this.buildAfterStage(insight, cleanEvidence);

    // STAGE 3: BRIDGE
    // Purpose: Explain how the transformation happened
    const bridge = this.buildBridgeStage(insight, business, targetAudience);

    // Assemble into content structure
    const headline = this.buildHeadline(insight);
    const hook = before;
    const body = `${after}

${bridge}`;
    const cta = `Want to make this transformation yourself? Let's connect.`;

    return {
      format: 'story-post',
      headline,
      hook,
      body,
      cta
    };
  }

  /**
   * STAGE 1: Build Before (The Old Situation)
   */
  private buildBeforeStage(insight: BreakthroughInsight, targetAudience: string): string {
    // Frame the pre-insight state as the hook
    return `Here's what I see happening with many ${targetAudience}...`;
  }

  /**
   * STAGE 2: Build After (The New Reality)
   */
  private buildAfterStage(insight: BreakthroughInsight, cleanEvidence: string[]): string {
    const parts: string[] = [];

    // Present the insight as the transformation
    parts.push(`**The Insight:**\n${insight.insight}`);

    // Show why this creates a new reality
    if (insight.whyProfound) {
      parts.push(`\n**Why This Changes Everything:**\n${insight.whyProfound}`);
    }

    // Add evidence if available
    if (cleanEvidence.length > 0) {
      parts.push(`\n**What I've Seen:**`);
      cleanEvidence.forEach(evidence => {
        parts.push(`• ${evidence}`);
      });
    }

    return parts.join('\n');
  }

  /**
   * STAGE 3: Build Bridge (How Transformation Happens)
   */
  private buildBridgeStage(
    insight: BreakthroughInsight,
    business: BusinessProfile,
    targetAudience: string
  ): string {
    const parts: string[] = [];

    // Show timing/opportunity if present
    if (insight.whyNow && insight.whyNow.length > 15) {
      parts.push(`**The Timing:**\n${insight.whyNow}`);
    }

    // Connect to business value
    parts.push(`\n${business.name} is built on helping ${targetAudience} make transformations like this.`);

    return parts.join('\n');
  }

  /**
   * Build headline
   */
  private buildHeadline(insight: BreakthroughInsight): string {
    // Use contentAngle if available
    if (insight.contentAngle && insight.contentAngle.length > 10) {
      return insight.contentAngle;
    }

    // Use first sentence of insight
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

    return [
      industry,
      'transformation',
      'growth',
      'journey',
      'success'
    ].slice(0, 5);
  }
}
