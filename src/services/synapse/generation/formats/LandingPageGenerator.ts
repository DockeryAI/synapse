/**
 * Landing Page Generator
 *
 * Generates conversion-optimized landing page content using:
 * - Hero Section: Above-the-fold conversion formula
 * - PASTOR: Full sales page framework
 *
 * Created: 2025-11-11
 */

import type { BreakthroughInsight } from '@/types/breakthrough.types';
import type {
  SynapseContent,
  BusinessProfile
} from '@/types/synapseContent.types';
import { LANDING_HERO, LANDING_PASTOR } from '../ContentFrameworkLibrary';

export class LandingPageGenerator {
  async generate(
    insight: BreakthroughInsight,
    business: BusinessProfile,
    pageType: 'hero' | 'sales' = 'hero'
  ): Promise<SynapseContent> {
    const framework = pageType === 'sales' ? LANDING_PASTOR : LANDING_HERO;

    const headline = this.generateHeadline(insight, business);
    const subheadline = this.generateSubheadline(insight, business);
    const body = this.generateLandingPageBody(insight, business, pageType);
    const cta = this.generateCTA(business);
    const bulletPoints = this.generateBulletPoints(insight);
    const socialProof = this.generateSocialProof(business);

    const format = pageType === 'hero' ? 'landing-hero' : 'landing-sales';

    return {
      id: `landing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      insightId: insight.id,
      format: format as any,

      content: {
        headline,
        hook: subheadline,
        body,
        cta,
        subheadline,
        bulletPoints,
        socialProof
      },

      psychology: {
        principle: pageType === 'sales' ? 'Loss Aversion' : 'Clarity + Relevance',
        trigger: {
          type: pageType === 'sales' ? 'fear' : 'aspiration',
          strength: 0.95,
          target: 'conversion'
        },
        persuasionTechnique: framework.name,
        expectedReaction: 'This is exactly what I need'
      },

      optimization: {
        powerWords: this.extractPowerWords(headline + body),
        framingDevice: framework.name,
        narrativeStructure: framework.stages.map(s => s.name).join(' → '),
        pacing: 'Fast (conversion-focused)'
      },

      meta: {
        platform: ['Web'],
        tone: 'professional',
        targetAudience: business.targetAudience
      },

      prediction: {
        engagementScore: 0.6,
        viralPotential: 0.2,
        leadGeneration: 1.0, // Maximum conversion focus
        brandImpact: 'positive',
        confidenceLevel: insight.confidence
      },

      framework: {
        id: framework.id,
        name: framework.name,
        stages: framework.stages.map(s => s.name),
        reasoning: `${framework.name} is proven for ${pageType} landing page conversion`
      },

      metadata: {
        generatedAt: new Date(),
        model: 'LandingPageGenerator',
        iterationCount: 1,
        impactScore: insight.confidence
      }
    };
  }

  private generateHeadline(insight: BreakthroughInsight, business: BusinessProfile): string {
    return `${insight.contentAngle || insight.insight} | ${business.name}`;
  }

  private generateSubheadline(insight: BreakthroughInsight, business: BusinessProfile): string {
    return `${business.name} helps ${business.targetAudience} ${insight.whyProfound.toLowerCase()}`;
  }

  private generateLandingPageBody(
    insight: BreakthroughInsight,
    business: BusinessProfile,
    pageType: string
  ): string {
    if (pageType === 'sales') {
      return `## The Problem

${insight.insight}

## Why It Matters

${insight.whyProfound}

## The Proof

${insight.evidence.map((e, i) => `**${i + 1}.** ${e}`).join('\n\n')}

## How ${business.name} Solves This

We've developed a proven approach that delivers results.

${insight.whyNow ? `\n## Act Now\n\n${insight.whyNow}` : ''}`;
    }

    return `${insight.whyProfound}

${insight.evidence.map(e => `✓ ${e}`).join('\n')}

${insight.whyNow || ''}`;
  }

  private generateCTA(business: BusinessProfile): string {
    return `Get Started with ${business.name}`;
  }

  private generateBulletPoints(insight: BreakthroughInsight): string[] {
    return insight.evidence.slice(0, 3);
  }

  private generateSocialProof(business: BusinessProfile): string[] {
    return [
      `Trusted by ${business.industry} leaders`,
      'Proven results',
      '100% satisfaction guarantee'
    ];
  }

  private extractPowerWords(text: string): string[] {
    const powerWords = ['proven', 'guaranteed', 'results', 'now', 'limited', 'exclusive'];
    return powerWords.filter(word => text.toLowerCase().includes(word));
  }
}
