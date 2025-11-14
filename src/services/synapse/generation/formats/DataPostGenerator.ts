/**
 * Data Post Generator
 *
 * Generates data-driven, authority-building content using the AIDA framework
 * with evidence-based arguments and statistics.
 *
 * Framework: AIDA (Attention-Interest-Desire-Action)
 * - Attention: Lead with compelling data/stat
 * - Interest: Explain what it means
 * - Desire: Show why it matters
 * - Action: Clear next step
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
import { AIDA_SOCIAL, type ContentFramework } from '../ContentFrameworkLibrary';
import { detectTargetAudience, getCleanEvidence } from '../utils/audienceDetection';

export class DataPostGenerator {
  private powerWordOptimizer: PowerWordOptimizer;
  private framework: ContentFramework;

  constructor() {
    this.powerWordOptimizer = new PowerWordOptimizer();
    this.framework = AIDA_SOCIAL;
  }

  /**
   * Generate a data-driven post from an insight
   */
  async generate(
    insight: BreakthroughInsight,
    business: BusinessProfile
  ): Promise<SynapseContent> {
    // Detect actual target audience
    const targetAudience = detectTargetAudience(business);

    // Get clean evidence for provenance tracking
    const cleanEvidence = getCleanEvidence(insight.evidence, 5);

    // Generate draft following AIDA framework
    const draft = this.generateFrameworkGuidedDraft(insight, business, targetAudience);

    // Optimize with power words (light touch for data posts)
    const optimized = await this.powerWordOptimizer.optimize(draft, business);

    // Build complete content object
    const content: SynapseContent = {
      id: `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      insightId: insight.id,
      format: 'data-post',

      content: {
        headline: optimized.headline,
        hook: optimized.hook,
        body: optimized.body,
        cta: optimized.cta,
        hashtags: this.generateHashtags(insight, business)
      },

      psychology: {
        principle: 'Social Proof + Authority',
        trigger: {
          type: 'curiosity',
          strength: 0.8,
          target: 'credibility'
        },
        persuasionTechnique: 'Data-Driven Authority',
        expectedReaction: insight.expectedReaction || 'These numbers tell a compelling story'
      },

      optimization: {
        powerWords: this.powerWordOptimizer.extractPowerWords(
          `${optimized.headline} ${optimized.hook} ${optimized.body}`
        ),
        framingDevice: this.framework.name,
        narrativeStructure: this.framework.stages.map(s => s.name).join(' → '),
        pacing: 'Medium-Fast (data-driven)'
      },

      meta: {
        platform: ['LinkedIn', 'Twitter'],
        tone: 'authoritative',
        targetAudience
      },

      prediction: {
        engagementScore: 0.7,
        viralPotential: 0.6,
        leadGeneration: 0.75,
        brandImpact: 'positive' as const,
        confidenceLevel: insight.confidence
      },

      framework: {
        id: this.framework.id,
        name: this.framework.name,
        stages: this.framework.stages.map(s => s.name),
        reasoning: 'AIDA framework perfect for data-driven content that builds authority and drives action'
      },

      provenance: {
        // DEEP PROVENANCE: Merge from insight generation
        ...((insight as any).deepProvenance || {}),

        // Standard provenance tracking
        dataSourcesUsed: insight.dataUsed || [],
        psychologyTrigger: 'Social Proof + Authority - Data-driven credibility',
        trendingTopicMatched: insight.title,

        frameworkStagesUsed: [
          {
            stage: 'Attention (Hook)',
            sourceField: insight.whyProfound && insight.whyProfound.length > 30 ? 'whyProfound' : 'insight',
            content: draft.hook.substring(0, 100)
          },
          {
            stage: 'Interest + Desire (Body)',
            sourceField: cleanEvidence.length > 0 ? 'evidence + whyNow' : 'insight + whyNow',
            content: draft.body.substring(0, 100)
          },
          {
            stage: 'Action (CTA)',
            sourceField: 'business.industry (industry-specific CTA)',
            content: draft.cta
          }
        ],

        contentAssembly: {
          headline: {
            source: 'insight.contentAngle (first sentence, 120 char limit)',
            field: 'contentAngle',
            preview: optimized.headline.substring(0, 80)
          },
          hook: {
            source: insight.whyProfound && insight.whyProfound.length > 30
              ? 'insight.whyProfound'
              : 'insight.insight',
            field: insight.whyProfound && insight.whyProfound.length > 30 ? 'whyProfound' : 'insight',
            preview: optimized.hook.substring(0, 80)
          },
          body: {
            source: cleanEvidence.length > 0
              ? 'insight.evidence + insight.whyNow'
              : 'insight.insight + insight.whyNow',
            field: cleanEvidence.length > 0 ? 'evidence + whyNow' : 'insight + whyNow',
            preview: optimized.body.substring(0, 80)
          },
          cta: {
            source: `Industry: ${business.industry}`,
            field: 'business.industry',
            preview: optimized.cta
          }
        },

        decisions: {
          whyThisFormat: 'Data post format chosen for evidence-based insights that build authority',
          whyThisTone: 'Authoritative tone to establish credibility with data and statistics',
          whyThisCTA: this.explainCTAChoice(business)
        }
      },

      metadata: {
        generatedAt: new Date(),
        model: 'DataPostGenerator',
        iterationCount: 1,
        impactScore: insight.confidence
      }
    };

    return content;
  }

  /**
   * Generate draft following AIDA framework
   */
  private generateFrameworkGuidedDraft(
    insight: BreakthroughInsight,
    business: BusinessProfile,
    targetAudience: string
  ): ContentDraft {
    // Get clean evidence
    const cleanEvidence = getCleanEvidence(insight.evidence, 5);

    // STAGE 1: ATTENTION
    // Purpose: Grab attention with compelling data
    const attention = this.buildAttentionStage(insight, targetAudience);

    // STAGE 2: INTEREST
    // Purpose: Explain what the data means
    const interest = this.buildInterestStage(insight);

    // STAGE 3: DESIRE
    // Purpose: Show why it matters (evidence)
    const desire = this.buildDesireStage(insight, cleanEvidence);

    // STAGE 4: ACTION
    // Purpose: Clear next step
    const action = this.buildActionStage(business, targetAudience);

    // Assemble into content structure
    const headline = this.buildHeadline(insight);
    const hook = attention;

    // Build body from non-empty parts
    const bodyParts = [interest, desire].filter(part => part.length > 0);
    const body = bodyParts.join('\n\n');

    const cta = action;

    return {
      format: 'data-post',
      headline,
      hook,
      body,
      cta
    };
  }

  /**
   * STAGE 1: Build Attention (The Data Hook)
   *
   * IMPORTANT: Hook should be different from headline - provide context/setup
   */
  private buildAttentionStage(insight: BreakthroughInsight, targetAudience: string): string {
    // Use whyProfound as the hook to provide context (not repeat the headline)
    if (insight.whyProfound && insight.whyProfound.length > 30) {
      return insight.whyProfound;
    }

    // Fall back to insight
    return insight.insight;
  }

  /**
   * STAGE 2: Build Interest (What It Means)
   *
   * NO TEMPLATES - Just output the actual content
   * IMPORTANT: Provide evidence/data, not repeat the hook
   */
  private buildInterestStage(insight: BreakthroughInsight): string {
    // Return empty - we'll put all content in the Desire stage to avoid repetition
    return '';
  }

  /**
   * STAGE 3: Build Desire (Why It Matters)
   *
   * NO TEMPLATES - Just output the actual content
   * IMPORTANT: Build substantial body content to avoid thin posts
   * CRITICAL: Avoid repeating what's already in the hook
   */
  private buildDesireStage(insight: BreakthroughInsight, cleanEvidence: string[]): string {
    const parts: string[] = [];

    // Skip insight entirely if whyProfound was used for hook (they're related concepts)
    // This prevents repetition between hook and body

    // Prioritize evidence (provides concrete substantiation without repeating concepts)
    if (cleanEvidence.length > 0) {
      cleanEvidence.forEach(evidence => {
        parts.push(evidence);
      });
    }

    // Add timing/urgency if present
    if (insight.whyNow && insight.whyNow.length > 15) {
      parts.push(insight.whyNow);
    }

    // Only if we have NOTHING else, fall back to insight
    if (parts.length === 0 && insight.insight) {
      parts.push(insight.insight);
    }

    return parts.join('\n\n');
  }

  /**
   * STAGE 4: Build Action (The CTA)
   *
   * NO TEMPLATES - Industry-specific actionable CTAs
   * Checks INDUSTRY FIRST to prevent content keywords from triggering wrong CTAs
   */
  private buildActionStage(business: BusinessProfile, targetAudience: string): string {
    const industry = business.industry.toLowerCase();

    // Industry-specific CTAs - check business type FIRST
    if (industry.includes('cleaning') || industry.includes('janitorial') || industry.includes('facility')) {
      return `${business.name} delivers professional results every time. Schedule your service today.`;
    } else if (industry.includes('bar') || industry.includes('pub') || industry.includes('nightclub')) {
      return `Experience it at ${business.name}. Stop by and see for yourself.`;
    } else if (industry.includes('coffee') || industry.includes('cafe')) {
      return `Try ${business.name} and taste the difference. Visit us today.`;
    } else if (industry.includes('mattress') || industry.includes('furniture')) {
      return `Visit ${business.name} and find your perfect match. We're here to help.`;
    } else if (industry.includes('restaurant') || industry.includes('food')) {
      return `Taste it at ${business.name}. Reserve your table today.`;
    } else if (industry.includes('event')) {
      return `${business.name} handles the details. Let's talk about your next event.`;
    }

    // Generic fallback - more direct
    return `Visit ${business.name} today. We're ready when you are.`;
  }

  /**
   * Build headline
   */
  private buildHeadline(insight: BreakthroughInsight): string {
    // Clean meta-instructions helper
    const cleanInstructions = (text: string): string => {
      let cleaned = text;

      // Log original for debugging
      if (cleaned.toLowerCase().includes('start with') || cleaned.toLowerCase().includes('secret')) {
        console.warn('[DataPost] Found meta-instruction in contentAngle:', cleaned);
      }

      // More aggressive patterns - match any variant
      const patterns = [
        /^Start with ["']?secret["']?\s*/i,
        /^Start with ["'][^"']*["']\s*/i,
        /^Start with\s+/i,
        /^Begin with\s+/i,
        /^Create (a|an)\s+/i,
        /^Post (a|an)\s+/i,
        /^Share (a|an)\s+/i,
        /^Video series:\s*/i,
        /^POV:\s*/i,
        /^"?secret"?\s*/i
      ];

      for (const pattern of patterns) {
        const before = cleaned;
        cleaned = cleaned.replace(pattern, '');
        if (before !== cleaned) {
          console.warn('[DataPost] Pattern matched and removed:', pattern, 'Result:', cleaned.substring(0, 50));
        }
      }

      // Capitalize first letter if we cleaned something
      if (cleaned !== text && cleaned.length > 0) {
        cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      }

      return cleaned;
    };

    // Use contentAngle if available (cleaned)
    if (insight.contentAngle && insight.contentAngle.length > 10) {
      let cleaned = cleanInstructions(insight.contentAngle);

      // Headlines should be punchy, not paragraphs - take first sentence only
      const firstSentence = cleaned.split('.')[0];

      // Limit to 120 characters max (social media best practice)
      if (firstSentence.length > 120) {
        cleaned = firstSentence.substring(0, 117) + '...';
      } else {
        cleaned = firstSentence;
      }

      console.log('[DataPost] Built headline from contentAngle:', cleaned);
      return cleaned;
    }

    // Use first sentence of insight (cleaned)
    const firstSentence = cleanInstructions(insight.insight.split('.')[0]);
    return firstSentence.length > 120 ? firstSentence.substring(0, 117) + '...' : firstSentence;
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
      'data',
      'insights',
      'research',
      'trends'
    ].slice(0, 5);
  }

  /**
   * Explain why a specific CTA was chosen
   */
  private explainCTAChoice(business: BusinessProfile): string {
    const industry = business.industry.toLowerCase();

    if (industry.includes('cleaning') || industry.includes('janitorial') || industry.includes('facility')) {
      return 'Cleaning service CTA emphasizes professional results and reliability - key factors for commercial clients';
    } else if (industry.includes('bar') || industry.includes('pub') || industry.includes('nightclub')) {
      return 'Bar/pub CTA invites immediate experience - driving foot traffic with social proof';
    } else if (industry.includes('coffee') || industry.includes('cafe')) {
      return 'Coffee CTA focuses on taste differentiation - sensory appeal for quality-conscious customers';
    } else if (industry.includes('mattress') || industry.includes('furniture')) {
      return 'Furniture CTA emphasizes personal fit and help - crucial for high-consideration purchases';
    } else if (industry.includes('restaurant') || industry.includes('food')) {
      return 'Restaurant CTA drives reservations - immediate action for dining experience';
    } else if (industry.includes('event')) {
      return 'Event service CTA focuses on detail handling - key trust factor for important occasions';
    }

    // Generic
    return 'Generic CTA chosen - using direct action prompt as no industry-specific pattern matched';
  }
}
