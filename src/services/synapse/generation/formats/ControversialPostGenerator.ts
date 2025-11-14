/**
 * Controversial Post Generator
 *
 * Generates debate-starting content that challenges conventional wisdom
 * using the Problem-Agitate-Solution (PAS) framework.
 *
 * Framework: Problem-Agitate-Solution
 * - Problem: Identify the flawed conventional wisdom
 * - Agitate: Amplify the cost of believing it
 * - Solution: Present the counter-intuitive truth
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
import { PROBLEM_AGITATE_SOLUTION, type ContentFramework } from '../ContentFrameworkLibrary';
import { detectTargetAudience, getCleanEvidence } from '../utils/audienceDetection';

export class ControversialPostGenerator {
  private powerWordOptimizer: PowerWordOptimizer;
  private framework: ContentFramework;

  constructor() {
    this.powerWordOptimizer = new PowerWordOptimizer();
    this.framework = PROBLEM_AGITATE_SOLUTION;
  }

  /**
   * Generate a controversial post from an insight
   */
  async generate(
    insight: BreakthroughInsight,
    business: BusinessProfile
  ): Promise<SynapseContent> {
    // Detect actual target audience
    const targetAudience = detectTargetAudience(business);

    // Get clean evidence for provenance tracking
    const cleanEvidence = getCleanEvidence(insight.evidence, 3);

    // Generate draft following Problem-Agitate-Solution framework
    const draft = this.generateFrameworkGuidedDraft(insight, business, targetAudience);

    // Optimize with power words (careful - don't make it clickbait)
    const optimized = await this.powerWordOptimizer.optimize(draft, business);

    // Build complete content object
    const content: SynapseContent = {
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
          type: 'anger',
          strength: 0.85,
          target: 'engagement'
        },
        persuasionTechnique: 'Contrarian Challenge',
        expectedReaction: insight.expectedReaction || 'This challenges what I believe... let me think about it'
      },

      optimization: {
        powerWords: this.powerWordOptimizer.extractPowerWords(
          `${optimized.headline} ${optimized.hook} ${optimized.body}`
        ),
        framingDevice: this.framework.name,
        narrativeStructure: this.framework.stages.map(s => s.name).join(' → '),
        pacing: 'Fast (debate-driving)'
      },

      meta: {
        platform: ['LinkedIn', 'Twitter'],
        tone: 'controversial',
        targetAudience
      },

      prediction: {
        engagementScore: this.predictEngagement(insight),
        viralPotential: this.predictViralPotential(insight),
        leadGeneration: 0.55,
        brandImpact: this.predictBrandImpact(insight),
        confidenceLevel: insight.confidence
      },

      framework: {
        id: this.framework.id,
        name: this.framework.name,
        stages: this.framework.stages.map(s => s.name),
        reasoning: 'PAS framework perfect for challenging conventional wisdom with substantive arguments'
      },

      provenance: {
        // DEEP PROVENANCE: Merge from insight generation
        ...((insight as any).deepProvenance || {}),

        // Standard provenance tracking
        dataSourcesUsed: insight.dataUsed || [],
        psychologyTrigger: 'Cognitive Dissonance - Challenge conventional wisdom',
        trendingTopicMatched: insight.title,

        frameworkStagesUsed: [
          {
            stage: 'Problem (Hook)',
            sourceField: insight.whyProfound && insight.whyProfound.length > 30 ? 'whyProfound' : 'insight',
            content: draft.hook.substring(0, 100)
          },
          {
            stage: 'Agitate (Body)',
            sourceField: cleanEvidence.length > 0 ? 'evidence + whyNow' : 'insight + whyNow',
            content: draft.body.substring(0, 100)
          },
          {
            stage: 'Solution (CTA)',
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
          whyThisFormat: 'Controversial format chosen for counter-intuitive insights that challenge conventional wisdom',
          whyThisTone: 'Controversial tone to drive debate and engagement',
          whyThisCTA: this.explainCTAChoice(business, insight)
        }
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
   * Generate draft following Problem-Agitate-Solution framework
   *
   * This is the KEY METHOD - it walks through PAS framework stages
   * and uses the stage guidelines to construct controversial content
   */
  private generateFrameworkGuidedDraft(
    insight: BreakthroughInsight,
    business: BusinessProfile,
    targetAudience: string
  ): ContentDraft {
    // Get clean evidence (filter out search keywords)
    const cleanEvidence = getCleanEvidence(insight.evidence, 3);

    // STAGE 1: PROBLEM
    // Purpose: Identify the flawed conventional wisdom
    const problem = this.buildProblemStage(insight, targetAudience);

    // STAGE 2: AGITATE
    // Purpose: Amplify the cost/pain of believing the flawed wisdom
    const agitate = this.buildAgitateStage(insight, cleanEvidence);

    // STAGE 3: SOLUTION
    // Purpose: Present the counter-intuitive truth with evidence
    const solution = this.buildSolutionStage(insight);

    // Build business-specific CTA
    const cta = this.buildInsightSpecificCTA(insight, business, targetAudience);

    // Assemble into content structure
    const headline = this.buildHeadline(insight);
    const hook = problem;

    // Build body from non-empty parts
    const bodyParts = [agitate, solution].filter(part => part.length > 0);
    const body = bodyParts.join('\n\n');

    return {
      format: 'controversial-post',
      headline,
      hook,
      body,
      cta
    };
  }

  /**
   * STAGE 1: Build Problem (The Conventional Wisdom)
   *
   * Framework guideline: "Identify the problem"
   * Uses: insight as the truth, so we need to present what people WRONGLY believe
   *
   * IMPORTANT: Hook should provide CONTEXT/SETUP, not repeat the headline
   */
  private buildProblemStage(insight: BreakthroughInsight, targetAudience: string): string {
    // The hook should set up the problem/context, not repeat the headline
    // Use whyProfound or insight as setup if contentAngle is too similar to headline

    // If we have whyProfound, use that as the hook (it provides context)
    if (insight.whyProfound && insight.whyProfound.length > 30) {
      return insight.whyProfound;
    }

    // Otherwise, use the insight itself (not contentAngle, which is used for headline)
    return insight.insight;
  }

  /**
   * STAGE 2: Build Agitate (Amplify the Pain)
   *
   * Framework guideline: "Amplify the pain of the problem"
   * Uses: evidence, timing, and insight to build the case
   *
   * NO TEMPLATES - Just output the actual content
   * IMPORTANT: Build substantial body content to avoid thin posts
   * CRITICAL: Avoid repeating what's already in the hook
   */
  private buildAgitateStage(insight: BreakthroughInsight, cleanEvidence: string[]): string {
    const parts: string[] = [];

    // Skip insight entirely if whyProfound was used for hook (they're related concepts)
    // This prevents repetition like "timing anxiety" in hook and "worry about timing" in body

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
   * STAGE 3: Build Solution (The Path Forward)
   *
   * Framework guideline: "Provide the solution"
   * This stage is optional - CTA provides the actual solution/action
   *
   * NO TEMPLATES - Just output the actual content
   * IMPORTANT: Keep this minimal - the CTA is the real solution
   */
  private buildSolutionStage(insight: BreakthroughInsight): string {
    // Solution stage is optional for social posts - the CTA is the real solution
    // Return empty to avoid repetition with body content
    return '';
  }

  /**
   * Build an insight-specific CTA rather than generic "helps X do Y"
   */
  private buildInsightSpecificCTA(
    insight: BreakthroughInsight,
    business: BusinessProfile,
    targetAudience: string
  ): string {
    const industry = business.industry.toLowerCase();
    const angle = (insight.contentAngle || insight.insight).toLowerCase();

    // INDUSTRY FIRST - check business type before content matching
    // This prevents "office" content from triggering wrong CTAs for cleaning services
    if (industry.includes('cleaning') || industry.includes('janitorial') || industry.includes('facility')) {
      return `${business.name} keeps your space spotless and professional. Book your service today.`;
    } else if (industry.includes('bar') || industry.includes('pub') || industry.includes('nightclub')) {
      return `Stop by ${business.name} and experience it yourself. See you soon.`;
    } else if (industry.includes('coffee') || industry.includes('cafe')) {
      return `Try ${business.name} and taste the difference. Visit us today.`;
    } else if (industry.includes('mattress') || industry.includes('furniture')) {
      return `Visit ${business.name} and find your perfect match. Stop by today.`;
    } else if (industry.includes('restaurant') || industry.includes('food')) {
      return `Experience it at ${business.name}. Reserve your table today.`;
    }

    // Content-based CTAs only if industry didn't match
    if (angle.includes('wedding')) {
      return `Want this at your next event? ${business.name} brings the experience. DM us to book.`;
    } else if (angle.includes('office') || angle.includes('corporate')) {
      return `${business.name} handles the details. Let's talk about your needs.`;
    } else if (angle.includes('event')) {
      return `Planning something special? ${business.name} creates experiences people remember. Reach out.`;
    }

    // Generic fallback - more direct and actionable
    return `Visit ${business.name} and see the difference. We're ready when you are.`;
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
        console.warn('[ControversialPost] Found meta-instruction in contentAngle:', cleaned);
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
          console.warn('[ControversialPost] Pattern matched and removed:', pattern, 'Result:', cleaned.substring(0, 50));
        }
      }

      // Capitalize first letter if we cleaned something
      if (cleaned !== text && cleaned.length > 0) {
        cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      }

      return cleaned;
    };

    // Priority: contentAngle if it exists (cleaned)
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

      console.log('[ControversialPost] Built headline from contentAngle:', cleaned);
      return cleaned;
    }

    // Use first sentence of core insight (cleaned)
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
      'controversial',
      'truth',
      'mindset',
      'debate'
    ].slice(0, 5);
  }

  /**
   * Predict engagement score
   */
  private predictEngagement(insight: BreakthroughInsight): number {
    let score = 0.8; // Base score for controversial content

    // Counter-intuitive insights drive higher engagement
    if (insight.type === 'counter_intuitive') {
      score += 0.15;
    }

    // High confidence means defensible position = more engagement
    if (insight.confidence > 0.8) {
      score += 0.05;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Predict viral potential
   */
  private predictViralPotential(insight: BreakthroughInsight): number {
    let score = 0.75; // Base score for controversial content

    // Counter-intuitive insights are highly shareable
    if (insight.type === 'counter_intuitive') {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Predict brand impact
   */
  private predictBrandImpact(insight: BreakthroughInsight): 'positive' | 'neutral' | 'risky' {
    // High confidence controversial = positive (thought leadership)
    if (insight.confidence > 0.8) {
      return 'positive';
    }

    // Medium confidence = neutral (some risk but manageable)
    if (insight.confidence > 0.6) {
      return 'neutral';
    }

    // Lower confidence controversial = risky
    return 'risky';
  }

  /**
   * Explain why a specific CTA was chosen
   */
  private explainCTAChoice(business: BusinessProfile, insight: BreakthroughInsight): string {
    const industry = business.industry.toLowerCase();

    if (industry.includes('cleaning') || industry.includes('janitorial') || industry.includes('facility')) {
      return 'Cleaning service CTA emphasizes professionalism and reliability - key trust factors for commercial clients';
    } else if (industry.includes('bar') || industry.includes('pub') || industry.includes('nightclub')) {
      return 'Bar/pub CTA invites experience and visit - social proof driven for hospitality';
    } else if (industry.includes('coffee') || industry.includes('cafe')) {
      return 'Coffee CTA focuses on taste and quality differentiation - sensory appeal for beverage business';
    } else if (industry.includes('mattress') || industry.includes('furniture')) {
      return 'Furniture CTA emphasizes finding perfect match - personal fit is crucial for big purchases';
    } else if (industry.includes('restaurant') || industry.includes('food')) {
      return 'Restaurant CTA focuses on experience and reservation - driving immediate action';
    }

    // Generic
    return 'Generic CTA chosen - industry-specific patterns not found, using direct action prompt';
  }
}
