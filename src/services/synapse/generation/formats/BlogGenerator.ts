/**
 * Blog Generator
 *
 * Generates SEO-optimized blog content using proven frameworks:
 * - How-To Guide: Step-by-step educational content
 * - Listicle: Numbered list format for easy scanning
 *
 * Created: 2025-11-11
 */

import type { BreakthroughInsight } from '@/types/breakthrough.types';
import type {
  SynapseContent,
  BusinessProfile
} from '@/types/synapseContent.types';
import { BLOG_HOW_TO, BLOG_LISTICLE } from '../ContentFrameworkLibrary';

export class BlogGenerator {
  async generate(
    insight: BreakthroughInsight,
    business: BusinessProfile,
    blogType: 'how-to' | 'listicle' | 'case-study' = 'how-to'
  ): Promise<SynapseContent> {
    const framework = blogType === 'listicle' ? BLOG_LISTICLE : BLOG_HOW_TO;

    const headline = this.generateSEOHeadline(insight, business, blogType);
    const metaDescription = this.generateMetaDescription(insight);
    const slug = this.generateSlug(headline);
    const body = this.generateBlogBody(insight, business, blogType);

    const format = blogType === 'how-to'
      ? 'blog-how-to'
      : blogType === 'listicle'
        ? 'blog-listicle'
        : 'blog-case-study';

    return {
      id: `blog-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      insightId: insight.id,
      format: format as any,

      content: {
        headline,
        hook: `## Introduction\n\n${insight.whyProfound}`,
        body,
        cta: `\n\n## Conclusion\n\nReady to implement these insights? [Contact ${business.name}](#) to learn more.`,
        seoTitle: headline,
        metaDescription,
        slug
      },

      psychology: {
        principle: 'Social Proof + Authority',
        trigger: {
          type: 'curiosity',
          strength: 0.75,
          target: 'education'
        },
        persuasionTechnique: 'Educational Authority',
        expectedReaction: 'This is valuable, actionable content'
      },

      optimization: {
        powerWords: this.extractPowerWords(headline + body),
        framingDevice: framework.name,
        narrativeStructure: framework.stages.map(s => s.name).join(' → '),
        pacing: 'Slow (comprehensive)'
      },

      meta: {
        platform: ['Blog', 'LinkedIn'],
        tone: 'educational',
        targetAudience: business.targetAudience
      },

      prediction: {
        engagementScore: 0.7,
        viralPotential: 0.5,
        leadGeneration: 0.8,
        brandImpact: 'positive',
        confidenceLevel: insight.confidence
      },

      framework: {
        id: framework.id,
        name: framework.name,
        stages: framework.stages.map(s => s.name),
        reasoning: `${framework.name} selected for SEO and educational value`
      },

      metadata: {
        generatedAt: new Date(),
        model: 'BlogGenerator',
        iterationCount: 1,
        impactScore: insight.confidence
      }
    };
  }

  private generateSEOHeadline(
    insight: BreakthroughInsight,
    business: BusinessProfile,
    type: string
  ): string {
    if (type === 'listicle') {
      return `5 ${business.industry} Insights That ${insight.expectedReaction}`;
    }
    return `How to ${insight.contentAngle || insight.insight.substring(0, 60)}`;
  }

  private generateMetaDescription(insight: BreakthroughInsight): string {
    return `${insight.insight.substring(0, 140)}...`;
  }

  private generateSlug(headline: string): string {
    return headline
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 60);
  }

  private generateBlogBody(
    insight: BreakthroughInsight,
    business: BusinessProfile,
    type: string
  ): string {
    if (type === 'listicle') {
      return `## The Insights

### 1. ${insight.insight}

${insight.whyProfound}

${insight.evidence.map((e, i) => `**Evidence ${i + 1}:** ${e}`).join('\n\n')}

### 2-5. [Additional insights would be generated from other synapses]

## Why This Matters

${insight.whyNow || insight.expectedReaction}`;
    }

    return `## Understanding the Challenge

${insight.insight}

## Why This Matters

${insight.whyProfound}

## The Evidence

${insight.evidence.map((e, i) => `${i + 1}. ${e}`).join('\n')  }

## Taking Action

${insight.contentAngle || 'Here\'s how to apply this insight to your business.'}

${insight.whyNow ? `\n## Timing is Critical\n\n${insight.whyNow}` : ''}`;
  }

  private extractPowerWords(text: string): string[] {
    const powerWords = ['ultimate', 'complete', 'proven', 'essential', 'powerful', 'expert'];
    return powerWords.filter(word => text.toLowerCase().includes(word));
  }
}
