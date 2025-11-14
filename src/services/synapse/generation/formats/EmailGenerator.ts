/**
 * Email Generator
 *
 * Generates conversion-optimized email content using proven frameworks:
 * - Email AIDA: Classic attention-interest-desire-action
 * - Email PAS: Problem-agitate-solution for pain-driven conversion
 *
 * Created: 2025-11-11
 */

import type { BreakthroughInsight } from '@/types/breakthrough.types';
import type {
  ContentDraft,
  SynapseContent,
  BusinessProfile
} from '@/types/synapseContent.types';
import { frameworkLibrary, EMAIL_AIDA, EMAIL_PAS } from '../ContentFrameworkLibrary';

export class EmailGenerator {
  /**
   * Generate email content from insight
   */
  async generate(
    insight: BreakthroughInsight,
    business: BusinessProfile,
    emailType: 'newsletter' | 'promo' | 'sequence' = 'newsletter'
  ): Promise<SynapseContent> {
    // Select framework based on insight type and goal
    const framework = insight.type === 'counter_intuitive'
      ? EMAIL_PAS
      : EMAIL_AIDA;

    // Generate content following framework stages
    const subjectLine = this.generateSubjectLine(insight, business, framework.id);
    const preheader = this.generatePreheader(insight);
    const body = this.generateEmailBody(insight, business, framework.id);
    const cta = this.generateCTA(insight, business);
    const ps = this.generatePS(insight);

    const format = emailType === 'newsletter'
      ? 'email-newsletter'
      : emailType === 'promo'
        ? 'email-promo'
        : 'email-sequence';

    return {
      id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      insightId: insight.id,
      format: format as any,

      content: {
        headline: subjectLine,
        hook: preheader,
        body,
        cta,
        subjectLine,
        preheader,
        ps
      },

      psychology: {
        principle: framework.id === 'email-pas' ? 'Loss Aversion' : 'Curiosity Gap',
        trigger: {
          type: framework.id === 'email-pas' ? 'fear' : 'curiosity',
          strength: 0.85,
          target: 'conversion'
        },
        persuasionTechnique: framework.id === 'email-pas' ? 'Problem Amplification' : 'AIDA',
        expectedReaction: 'I need to click this and learn more'
      },

      optimization: {
        powerWords: this.extractPowerWords(subjectLine + body),
        framingDevice: framework.name,
        narrativeStructure: framework.stages.map(s => s.name).join(' → '),
        pacing: 'Medium (email-optimized)'
      },

      meta: {
        platform: ['Email'],
        tone: 'professional',
        targetAudience: business.targetAudience
      },

      prediction: {
        engagementScore: 0.75,
        viralPotential: 0.3, // Email doesn't go viral
        leadGeneration: 0.9, // Email is excellent for lead gen
        brandImpact: 'positive',
        confidenceLevel: insight.confidence
      },

      framework: {
        id: framework.id,
        name: framework.name,
        stages: framework.stages.map(s => s.name),
        reasoning: `${framework.name} selected because it's proven for ${emailType} emails`
      },

      metadata: {
        generatedAt: new Date(),
        model: 'EmailGenerator',
        iterationCount: 1,
        impactScore: insight.confidence
      }
    };
  }

  private generateSubjectLine(
    insight: BreakthroughInsight,
    business: BusinessProfile,
    frameworkId: string
  ): string {
    if (frameworkId === 'email-pas') {
      return `${business.name}: ${insight.insight.split('.')[0].substring(0, 50)}?`;
    }
    return insight.contentAngle || insight.insight.substring(0, 60);
  }

  private generatePreheader(insight: BreakthroughInsight): string {
    return insight.whyProfound.substring(0, 100);
  }

  private generateEmailBody(
    insight: BreakthroughInsight,
    business: BusinessProfile,
    frameworkId: string
  ): string {
    if (frameworkId === 'email-pas') {
      return `Hey there,

${insight.insight}

${insight.whyProfound}

${insight.evidence.slice(0, 2).map(e => `• ${e}`).join('\n')}

${insight.whyNow ? `Why this matters now: ${insight.whyNow}` : ''}

Ready to take action?`;
    }

    // AIDA structure
    return `Hi,

${insight.insight}

Here's why this matters:
${insight.whyProfound}

The evidence:
${insight.evidence.slice(0, 3).map(e => `• ${e}`).join('\n')}

${insight.whyNow ? `\n${insight.whyNow}` : ''}`;
  }

  private generateCTA(insight: BreakthroughInsight, business: BusinessProfile): string {
    return `Learn more about how ${business.name} can help →`;
  }

  private generatePS(insight: BreakthroughInsight): string {
    return `P.S. ${insight.expectedReaction}`;
  }

  private extractPowerWords(text: string): string[] {
    const powerWords = ['discover', 'proven', 'exclusive', 'new', 'secret', 'now', 'today'];
    return powerWords.filter(word => text.toLowerCase().includes(word));
  }
}
