/**
 * Content Synthesis Service
 *
 * Bridges Intelligence Dashboard → Connection Discovery → Real Content Generation
 *
 * Replaces generic "Unlock New Growth" placeholders with specific, breakthrough content like:
 * "3 Things Storm Season Reveals About Your Coverage Gaps"
 *
 * Uses:
 * - Connection Discovery Engine for 3-way breakthrough connections
 * - EQ Calculator for emotional scoring
 * - Multi-source provenance for credibility
 *
 * Created: November 20, 2025
 */

import type { DeepContext } from '@/types/synapse/deepContext.types';
import type { InsightCard } from '@/components/dashboard/intelligence-v2/types';
import { jtbdTransformer } from './jtbd-transformer.service';
import type { FrameworkType } from '@/services/synapse/generation/ContentFrameworkLibrary';

// Content generation options
export interface ContentSynthesisOptions {
  humorLevel?: number; // 0-3: Serious, Light, Witty, Very Funny
  framework?: FrameworkType; // PAS, AIDA, etc.
  ctaStyle?: 'soft' | 'direct' | 'urgent';
  ctaOutcome?: CTAOutcome; // Specific tangible outcome
}

// Outcome-driven CTA types with tangible results
export type CTAOutcome =
  | 'get-quote'      // "Get Your Free Quote in 60 Seconds"
  | 'save-money'     // "Start Saving $500/mo Today"
  | 'book-call'      // "Book Your Strategy Call"
  | 'free-trial'     // "Start Your 14-Day Free Trial"
  | 'download'       // "Download Your Free Guide"
  | 'schedule'       // "Schedule Your Free Consultation"
  | 'learn-more'     // "See How It Works"
  | 'compare'        // "Compare Your Options"
  | 'calculate'      // "Calculate Your Savings"
  | 'audit'          // "Get Your Free Audit"
  | 'demo'           // "Watch the Demo"
  | 'join'           // "Join 10,000+ Happy Customers"
  | 'custom';        // Custom CTA

// Outcome-driven CTA templates with specific, tangible results
const CTA_OUTCOME_TEMPLATES: Record<CTAOutcome, { templates: string[]; icon?: string }> = {
  'get-quote': {
    templates: [
      'Get Your Free Quote in 60 Seconds',
      'See Your Custom Quote Now',
      'Get Your Personalized Rate',
      'Instant Quote → No Commitment'
    ],
    icon: '💰'
  },
  'save-money': {
    templates: [
      'Start Saving Today',
      'See How Much You Could Save',
      'Unlock Your Savings Now',
      'Calculate Your Savings'
    ],
    icon: '💵'
  },
  'book-call': {
    templates: [
      'Book Your Free Strategy Call',
      'Schedule Your 15-Min Consultation',
      'Talk to an Expert Today',
      'Get Expert Advice → Free Call'
    ],
    icon: '📞'
  },
  'free-trial': {
    templates: [
      'Start Your 14-Day Free Trial',
      'Try It Free for 30 Days',
      'Get Started Free → No Card Required',
      'Experience It Free Today'
    ],
    icon: '✨'
  },
  'download': {
    templates: [
      'Download Your Free Guide',
      'Get the Complete Checklist',
      'Download Now → Instant Access',
      'Grab Your Free Resource'
    ],
    icon: '📥'
  },
  'schedule': {
    templates: [
      'Schedule Your Free Consultation',
      'Book Your Appointment Today',
      'Reserve Your Spot Now',
      'Pick Your Time → Free Consultation'
    ],
    icon: '📅'
  },
  'learn-more': {
    templates: [
      'See How It Works',
      'Learn the Full Story',
      'Discover the Details',
      'Explore Your Options'
    ],
    icon: '🔍'
  },
  'compare': {
    templates: [
      'Compare Your Options Side-by-Side',
      'See How We Stack Up',
      'View the Comparison',
      'Find Your Best Fit'
    ],
    icon: '⚖️'
  },
  'calculate': {
    templates: [
      'Calculate Your ROI',
      'See Your Potential Savings',
      'Run the Numbers',
      'Get Your Custom Analysis'
    ],
    icon: '🧮'
  },
  'audit': {
    templates: [
      'Get Your Free Audit',
      'Request Your Assessment',
      'Get Your Personalized Report',
      'See Where You Stand'
    ],
    icon: '📊'
  },
  'demo': {
    templates: [
      'Watch the Demo',
      'See It in Action',
      'Take a Tour',
      'Experience the Platform'
    ],
    icon: '▶️'
  },
  'join': {
    templates: [
      'Join 10,000+ Happy Customers',
      'Become Part of Our Community',
      'Start Your Journey Today',
      'Join the Movement'
    ],
    icon: '🤝'
  },
  'custom': {
    templates: [
      'Get Started Today',
      'Take the Next Step',
      'Begin Your Journey',
      'Make It Happen'
    ]
  }
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Industry-specific trigger weight profiles
// Weights multiply base trigger scores (1.0 = neutral, >1 = boost, <1 = reduce)
const INDUSTRY_EQ_WEIGHTS: Record<string, Record<string, number>> = {
  insurance: {
    curiosity: 0.8,
    fear: 1.4,       // Risk aversion is key
    urgency: 1.2,
    achievement: 0.7,
    desire: 0.8,
    trust: 1.5,      // Trust is paramount
    belonging: 0.9
  },
  saas: {
    curiosity: 1.3,  // How does it work?
    fear: 0.8,
    urgency: 1.0,
    achievement: 1.4, // Efficiency gains
    desire: 1.2,
    trust: 1.0,
    belonging: 0.9
  },
  healthcare: {
    curiosity: 0.9,
    fear: 1.1,
    urgency: 1.0,
    achievement: 1.0,
    desire: 0.8,
    trust: 1.5,      // Trust in healthcare
    belonging: 1.3   // Care and compassion
  },
  legal: {
    curiosity: 0.8,
    fear: 1.3,       // Legal consequences
    urgency: 1.1,
    achievement: 1.2, // Case results
    desire: 0.7,
    trust: 1.5,      // Trust in attorney
    belonging: 0.8
  },
  finance: {
    curiosity: 1.0,
    fear: 1.4,       // Financial loss
    urgency: 1.1,
    achievement: 1.3, // Wealth growth
    desire: 1.2,
    trust: 1.4,
    belonging: 0.8
  },
  realestate: {
    curiosity: 1.0,
    fear: 1.1,
    urgency: 1.3,    // Hot market
    achievement: 1.2,
    desire: 1.4,     // Dream home
    trust: 1.2,
    belonging: 1.1   // Community
  },
  retail: {
    curiosity: 1.1,
    fear: 0.9,
    urgency: 1.4,    // Sales, limited time
    achievement: 0.8,
    desire: 1.3,     // Want the product
    trust: 1.0,
    belonging: 1.2   // Brand community
  },
  restaurant: {
    curiosity: 1.2,
    fear: 0.7,
    urgency: 1.1,
    achievement: 0.8,
    desire: 1.4,     // Craving
    trust: 1.1,
    belonging: 1.3   // Social dining
  },
  fitness: {
    curiosity: 1.0,
    fear: 1.1,       // Health fears
    urgency: 1.0,
    achievement: 1.5, // Transformation
    desire: 1.3,
    trust: 1.0,
    belonging: 1.4   // Gym community
  },
  education: {
    curiosity: 1.4,  // Learning
    fear: 1.0,
    urgency: 0.9,
    achievement: 1.4, // Success
    desire: 1.2,
    trust: 1.2,
    belonging: 1.1   // Student community
  },
  technology: {
    curiosity: 1.5,  // Innovation
    fear: 0.8,
    urgency: 1.0,
    achievement: 1.3,
    desire: 1.2,
    trust: 1.0,
    belonging: 0.9
  },
  consulting: {
    curiosity: 1.0,
    fear: 1.1,
    urgency: 0.9,
    achievement: 1.3,
    desire: 0.9,
    trust: 1.5,      // Expertise trust
    belonging: 0.8
  },
  default: {
    curiosity: 1.0,
    fear: 1.0,
    urgency: 1.0,
    achievement: 1.0,
    desire: 1.0,
    trust: 1.0,
    belonging: 1.0
  }
};

export interface SynthesizedContent {
  title: string; // Specific, curiosity-driven
  hook: string; // Emotional opening line
  body: string[]; // 3-5 key points
  cta: string; // Clear call to action
  provenance: ContentProvenance;
  eqScore: number; // 0-100
  breakthroughScore?: number; // 0-100 if from Connection Discovery
  variants?: ContentVariant[]; // A/B testing variants
}

export interface ContentVariant {
  id: string;
  title: string;
  hook: string;
  triggerType: 'curiosity' | 'fear' | 'urgency' | 'achievement' | 'desire' | 'trust';
  eqScore: number;
}

export interface ContentProvenance {
  sources: Array<{
    name: string; // "Google Reviews", "Weather API", "YouTube"
    quote?: string; // Actual customer quote or data point
    confidence: number; // 0-1
  }>;
  dataPoints: number; // How many data points support this
  validation: 'single-source' | 'cross-validated' | 'triple-validated';
}

// ============================================================================
// ITEM #24: CONTENT ATOMIZATION - 1 insight → 6 platform variations
// ============================================================================

export type ContentPlatform = 'twitter' | 'linkedin' | 'instagram' | 'blog' | 'email' | 'video';

export interface AtomizedContent {
  platform: ContentPlatform;
  format: string;
  content: string;
  characterCount: number;
  hashtags?: string[];
  emoji?: string;
  cta?: string;
  thumbnailIdea?: string;
}

export interface ContentAtomizationResult {
  sourceInsight: {
    title: string;
    type: string;
    source: string;
  };
  atoms: AtomizedContent[];
  generatedAt: Date;
}

// ============================================================================
// ITEM #25: LOCAL KEYWORD TEMPLATES - Types for local SEO optimization
// ============================================================================

export type LocalKeywordType = 'near_me' | 'city' | 'state' | 'neighborhood' | 'qualified' | 'question';
export type SearchIntent = 'high' | 'medium' | 'low' | 'immediate' | 'research';
export type SearchVolume = 'high' | 'medium' | 'low';

export interface LocalKeyword {
  keyword: string;
  type: LocalKeywordType;
  intent: SearchIntent;
  searchVolume: SearchVolume;
}

export interface LocalContentIdea {
  title: string;
  type: 'listicle' | 'guide' | 'testimonial_roundup' | 'pricing_guide' | 'emergency_guide' | 'comparison';
  targetKeywords: string[];
  outline: string[];
}

export interface LocalKeywordResult {
  service: string;
  location: {
    city: string;
    state: string;
    neighborhood: string;
  };
  keywords: LocalKeyword[];
  contentIdeas: LocalContentIdea[];
  generatedAt: Date;
}

// ============================================================================
// ITEM #26: CASE STUDY FRAMEWORK - Types for review-to-case-study conversion
// ============================================================================

export interface ReviewCaseStudy {
  id: string;
  title: string;
  challenge: string;
  solution: string;
  result: string;
  quote: string;
  customerType: string;
  serviceProvided: string;
  metrics?: {
    timeframe?: string;
    improvement?: string;
    satisfaction?: string;
  };
  contentVariations: {
    socialPost: string;
    testimonialCard: string;
    blogSection: string;
    emailSnippet: string;
  };
  sourceReview: {
    text: string;
    rating: number;
    source: string;
    date?: string;
  };
  generatedAt: Date;
}

export interface CaseStudyFrameworkResult {
  caseStudies: ReviewCaseStudy[];
  summary: {
    totalReviewsProcessed: number;
    caseStudiesGenerated: number;
    averageRating: number;
    topThemes: string[];
  };
  generatedAt: Date;
}

// ============================================================================
// ITEM #27: REVIEW RESPONSE GENERATOR - Types for contextual review responses
// ============================================================================

export type ReviewSentiment = 'positive' | 'neutral' | 'negative';
export type ReviewResponseTone = 'professional' | 'warm' | 'empathetic' | 'apologetic';

export interface ReviewResponse {
  id: string;
  reviewId?: string;
  sentiment: ReviewSentiment;
  tone: ReviewResponseTone;
  response: string;
  alternativeResponses: string[];
  keyPoints: string[];
  actionItems?: string[];
  sourceReview: {
    text: string;
    rating: number;
    source: string;
  };
  generatedAt: Date;
}

export interface ReviewResponseBatchResult {
  responses: ReviewResponse[];
  summary: {
    totalProcessed: number;
    positiveCount: number;
    neutralCount: number;
    negativeCount: number;
  };
  generatedAt: Date;
}

// ============================================================================
// ITEM #28: THOUGHT LEADERSHIP ANGLES - Types for B2B executive content
// ============================================================================

export type ThoughtLeadershipType =
  | 'industry_trend'
  | 'contrarian_take'
  | 'future_prediction'
  | 'best_practice'
  | 'competitive_landscape';

export interface ThoughtLeadershipAngle {
  id: string;
  type: ThoughtLeadershipType;
  title: string;
  hook: string;
  mainArgument: string;
  supportingPoints: string[];
  dataPoints: string[];
  callToAction: string;
  targetAudience: string;
  linkedInPost: string;
  twitterThread: string[];
  blogOutline: string[];
  emailSubject: string;
  confidence: number;
  generatedAt: Date;
}

export interface ThoughtLeadershipResult {
  angles: ThoughtLeadershipAngle[];
  industry: string;
  targetSegment: string;
  summary: {
    totalAngles: number;
    byType: Record<ThoughtLeadershipType, number>;
  };
  generatedAt: Date;
}

class ContentSynthesisService {

  /**
   * Synthesize breakthrough content from selected insights
   */
  async synthesizeContent(
    selectedInsights: InsightCard[],
    context: DeepContext,
    options: ContentSynthesisOptions = {}
  ): Promise<SynthesizedContent> {
    const { humorLevel = 1, framework, ctaStyle = 'direct' } = options;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn('[ContentSynthesis] No Supabase config - using fallback');
      return this.fallbackSynthesis(selectedInsights, context, options);
    }

    try {
      console.log(`[ContentSynthesis] Synthesizing content from ${selectedInsights.length} insights (humor: ${humorLevel}, framework: ${framework || 'auto'})`);

      // Build synthesis prompt with humor and framework instructions
      const prompt = this.buildSynthesisPrompt(selectedInsights, context, options);

      // No timeout - let AI complete naturally for complete data
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: 'openrouter',
          model: 'anthropic/claude-3-5-sonnet-20241022', // Fixed model name for OpenRouter
          messages: [{
            role: 'user',
            content: prompt
          }],
          max_tokens: 2000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`AI Proxy error: ${response.status}`);
      }

      const data = await response.json();
      const contentText = data.choices[0].message.content;

      // Parse JSON response
      let content = contentText;
      if (contentText.includes('```json')) {
        content = contentText
          .replace(/```json\s*/g, '')
          .replace(/```\s*/g, '')
          .trim();
      }

      const synthesized = JSON.parse(content);

      // Build provenance from sources
      const provenance = this.buildProvenance(selectedInsights);

      // Calculate EQ score
      const eqScore = await this.calculateEQScore(synthesized.title, synthesized.hook);

      // Generate A/B testing variants
      const variants = await this.generateVariants(synthesized.title, synthesized.hook, context);

      return {
        title: synthesized.title,
        hook: synthesized.hook,
        body: synthesized.body || [],
        cta: synthesized.cta,
        provenance,
        eqScore,
        breakthroughScore: synthesized.breakthroughScore,
        variants
      };

    } catch (error) {
      console.error('[ContentSynthesis] Error:', error);
      return this.fallbackSynthesis(selectedInsights, context);
    }
  }

  /**
   * Generate content variants for A/B testing
   * Uses AI to generate contextually appropriate prefixes for each psychological trigger
   */
  private async generateVariants(
    baseTitle: string,
    baseHook: string,
    context: DeepContext
  ): Promise<ContentVariant[]> {
    const variants: ContentVariant[] = [];

    // Extract the core message from base title (remove existing prefixes)
    const coreTitle = baseTitle.replace(/^(What|Why|How|Stop|Before|Finally|Get|Proven)[^:]*:\s*/i, '');
    const coreHook = baseHook.replace(/^[^.!?]+[.!?]\s*/i, '');

    // Try AI-generated variants first
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      try {
        console.log('[ContentSynthesis] Generating AI-powered variants...');

        const prompt = `You are a psychological copywriting expert. Generate 6 compelling variants of this content, each optimized for a different psychological trigger.

BUSINESS: ${context.business.profile.name}
INDUSTRY: ${context.business.profile.industry}

ORIGINAL CONTENT:
Title: ${coreTitle}
Hook: ${coreHook || baseHook}

Generate variants for these psychological triggers:
1. CURIOSITY - Create intrigue with what they don't know
2. FEAR - Highlight risks and mistakes to avoid
3. URGENCY - Emphasize time-sensitivity and scarcity
4. ACHIEVEMENT - Focus on success and accomplishment
5. DESIRE - Appeal to wants and aspirations
6. TRUST - Emphasize proof and credibility

For each variant, create:
- A unique title prefix (5-8 words ending with ":")
- A unique hook prefix (one sentence ending with ". ")

CRITICAL: Make prefixes industry-specific and contextual. Not generic templates.

OUTPUT FORMAT (JSON only, no markdown):
{
  "variants": [
    {
      "type": "curiosity",
      "titlePrefix": "Your unique curiosity prefix: ",
      "hookPrefix": "Your unique hook opener. "
    },
    ...
  ]
}`;

        // No timeout - let AI complete naturally
        const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            provider: 'openrouter',
            model: 'anthropic/claude-3-haiku-20240307', // Fast model for variants
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 1000,
            temperature: 0.8
          })
        });

        if (response.ok) {
          const data = await response.json();
          let contentText = data.choices[0].message.content;

          // Parse JSON response
          if (contentText.includes('```json')) {
            contentText = contentText
              .replace(/```json\s*/g, '')
              .replace(/```\s*/g, '')
              .trim();
          }

          const aiVariants = JSON.parse(contentText);

          // Generate variants from AI prefixes
          for (const aiVariant of aiVariants.variants) {
            const variantTitle = `${aiVariant.titlePrefix}${coreTitle}`;
            const variantHook = `${aiVariant.hookPrefix}${coreHook || baseHook}`;

            const eqScore = await this.calculateEQScore(variantTitle, variantHook);

            variants.push({
              id: `variant-${aiVariant.type}-${Date.now()}`,
              title: variantTitle,
              hook: variantHook,
              triggerType: aiVariant.type,
              eqScore
            });
          }

          console.log(`[ContentSynthesis] ✅ Generated ${variants.length} AI-powered variants`);
        }
      } catch (error) {
        console.warn('[ContentSynthesis] AI variant generation failed, using fallback:', error);
      }
    }

    // Fallback to template prefixes if AI fails or no config
    if (variants.length === 0) {
      const triggers: Array<{
        type: ContentVariant['triggerType'];
        titlePrefix: string;
        hookPrefix: string;
      }> = [
        {
          type: 'curiosity',
          titlePrefix: 'What Most People Don\'t Know: ',
          hookPrefix: 'Here\'s the surprising truth: '
        },
        {
          type: 'fear',
          titlePrefix: 'Stop Making This Mistake: ',
          hookPrefix: 'Are you unknowingly risking everything? '
        },
        {
          type: 'urgency',
          titlePrefix: 'Before It\'s Too Late: ',
          hookPrefix: 'Time is running out. '
        },
        {
          type: 'achievement',
          titlePrefix: 'Finally: ',
          hookPrefix: 'Success is within reach. '
        },
        {
          type: 'desire',
          titlePrefix: 'Get What You Really Want: ',
          hookPrefix: 'Imagine having this solved. '
        },
        {
          type: 'trust',
          titlePrefix: 'Proven: ',
          hookPrefix: 'Based on real results: '
        }
      ];

      for (const trigger of triggers) {
        const variantTitle = `${trigger.titlePrefix}${coreTitle}`;
        const variantHook = `${trigger.hookPrefix}${coreHook || baseHook}`;

        const eqScore = await this.calculateEQScore(variantTitle, variantHook);

        variants.push({
          id: `variant-${trigger.type}-${Date.now()}`,
          title: variantTitle,
          hook: variantHook,
          triggerType: trigger.type,
          eqScore
        });
      }
    }

    // Sort by EQ score (highest first)
    variants.sort((a, b) => b.eqScore - a.eqScore);

    // Return top 4 variants
    return variants.slice(0, 4);
  }

  /**
   * Build synthesis prompt for AI
   */
  private buildSynthesisPrompt(insights: InsightCard[], context: DeepContext, options: ContentSynthesisOptions = {}): string {
    const { humorLevel = 1, framework, ctaStyle = 'direct', ctaOutcome } = options;
    const insightTypes = insights.map(i => i.type);

    // Identify the connection pattern
    let connectionPattern = '';
    if (insightTypes.includes('customer') && insightTypes.includes('opportunity') && insightTypes.includes('local')) {
      connectionPattern = 'Customer Need + Opportunity + Timely Event (3-way breakthrough)';
    } else if (insightTypes.includes('customer') && insightTypes.includes('opportunity')) {
      connectionPattern = 'Customer Need + Market Opportunity';
    } else if (insightTypes.includes('local') && insightTypes.includes('customer')) {
      connectionPattern = 'Timely Event + Customer Need';
    } else if (insightTypes.includes('competition') && insightTypes.includes('opportunity')) {
      connectionPattern = 'Competitor Gap + Opportunity';
    } else {
      connectionPattern = 'General insights';
    }

    // Humor level instructions
    const humorInstructions = {
      0: 'TONE: Serious and professional. No humor. Focus on facts and credibility.',
      1: 'TONE: Light and approachable. Subtle wit is okay. Keep it professional but friendly.',
      2: 'TONE: Witty and clever. Use smart humor, wordplay, and memorable phrases. Make it entertaining.',
      3: 'TONE: Very funny and bold. Use strong humor, emojis where appropriate, and entertaining language. Make readers smile.'
    }[humorLevel] || 'TONE: Light and approachable.';

    // Framework instructions
    let frameworkInstructions = '';
    if (framework) {
      const frameworkGuides: Record<string, string> = {
        'problem-agitate-solution': 'FRAMEWORK: PAS (Problem-Agitate-Solve). First identify the problem, then agitate the pain, then present the solution.',
        'aida': 'FRAMEWORK: AIDA. Attention (grab them), Interest (engage them), Desire (make them want it), Action (tell them what to do).',
        'before-after-bridge': 'FRAMEWORK: BAB (Before-After-Bridge). Show the before state, paint the after state, bridge with your solution.',
        'hook-story-offer': 'FRAMEWORK: Hook-Story-Offer. Hook them with a bold statement, tell a relatable story, make an irresistible offer.',
        'curiosity-gap': 'FRAMEWORK: Curiosity Gap. Create intrigue by revealing partial information that makes them need to know more.'
      };
      frameworkInstructions = frameworkGuides[framework] || '';
    }

    // CTA style instructions
    const ctaStyleInstructions = {
      soft: 'CTA STYLE: Soft and inviting.',
      direct: 'CTA STYLE: Direct and clear.',
      urgent: 'CTA STYLE: Urgent and action-oriented.'
    }[ctaStyle] || 'CTA STYLE: Direct and clear.';

    // Outcome-driven CTA instructions
    let ctaOutcomeInstructions = '';
    if (ctaOutcome && CTA_OUTCOME_TEMPLATES[ctaOutcome]) {
      const templates = CTA_OUTCOME_TEMPLATES[ctaOutcome].templates;
      ctaOutcomeInstructions = `
CTA OUTCOME: ${ctaOutcome.toUpperCase()}
Generate a CTA that drives this specific outcome. Examples:
${templates.map(t => `- "${t}"`).join('\n')}
The CTA MUST include a specific, tangible outcome (time, money saved, result achieved).`;
    } else {
      // Auto-select best CTA outcome based on industry and insight types
      const autoOutcome = this.selectBestCTAOutcome(context.business.profile.industry, insightTypes);
      const templates = CTA_OUTCOME_TEMPLATES[autoOutcome].templates;
      ctaOutcomeInstructions = `
CTA OUTCOME: Generate an OUTCOME-DRIVEN CTA with tangible results.
Best fit for this content: ${autoOutcome.toUpperCase()}
Examples:
${templates.slice(0, 2).map(t => `- "${t}"`).join('\n')}
CRITICAL: The CTA must promise a SPECIFIC, TANGIBLE outcome (e.g., "Get Your Free Quote in 60 Seconds" not just "Contact Us")`;
    }

    const ctaInstructions = `${ctaStyleInstructions}
${ctaOutcomeInstructions}`;

    return `You are a PhD-level content strategist trained on THE CONTENT WRITING BIBLE. You combine multiple data sources to create specific, high-impact content that drives measurable business results.

BUSINESS CONTEXT:
Name: ${context.business.profile.name}
Industry: ${context.business.profile.industry}
Location: ${context.business.profile.location?.city}, ${context.business.profile.location?.state}

=== TARGET CUSTOMER (CRITICAL - All content is FOR this audience) ===
${context.business.uvp ? `
TARGET CUSTOMER: ${context.business.uvp.targetCustomer}
THEIR PROBLEM (Before State): ${context.business.uvp.customerProblem}
THEIR DESIRED OUTCOME (After State): ${context.business.uvp.desiredOutcome}
OUR UNIQUE SOLUTION: ${context.business.uvp.uniqueSolution}
KEY BENEFIT/TRANSFORMATION: ${context.business.uvp.keyBenefit}

CONTENT DIRECTION (JTBD Framework):
- When [${context.business.uvp.customerProblem}],
- They want to [${context.business.uvp.desiredOutcome}],
- So they can [${context.business.uvp.keyBenefit}]

GOLDEN CIRCLE (Start with WHY):
- WHY: Help ${context.business.uvp.targetCustomer} achieve ${context.business.uvp.desiredOutcome}
- HOW: Through ${context.business.uvp.uniqueSolution}
- WHAT: ${context.business.profile.name}'s solution
` : `No UVP data - use industry: ${context.business.profile.industry}`}

CONNECTION PATTERN: ${connectionPattern}

${humorInstructions}
${frameworkInstructions}
${ctaInstructions}

=== CONTENT WRITING BIBLE PRINCIPLES ===

NEUROLOGICAL HOOK FORMULAS (use one):
1. CURIOSITY GAP: "[Known Element] + [Unknown Element] + [Stakes]" → +27% CTR
   Example: "The marketing mistake 91% of brands make"
2. SPECIFIC NUMBER: "[Number] + [Specific Outcome] + [Timeframe]" → +36% engagement
   Example: "3 emails generated $157,283 in 72 hours"
3. PATTERN INTERRUPT: "[Common Belief] + [Contradiction] + [New Possibility]" → +52% engagement
   Example: "Why your best sales calls are failing (and how to fix them)"
4. DATA SHOCK: Start with a surprising statistic → +36% CTR
   Example: "83% of your competitors are using this (and you're not)"
5. QUESTION THAT HURTS: Target loss aversion → +52% engagement
   Example: "How much money are you losing by ignoring this?"

PSYCHOLOGICAL TRIGGERS TO WEAVE IN:
- Novelty (dopamine release): Use unexpected angles
- Threat Detection (amygdala): Highlight risks of inaction
- Social Proof (mirror neurons): Reference numbers/testimonials
- Curiosity Gap (nucleus accumbens): Create information gaps
- Loss Aversion: What they'll lose by not acting

BODY CONTENT RULES:
- Each point must include EVIDENCE (number, quote, or data)
- Use the "so what" test: Every point must answer "why should I care?"
- Specificity > Generality: "$50,000" beats "a lot of money"
- Include at least one contrarian insight that challenges assumptions

=== SELECTED INSIGHTS ===
${insights.map((insight, i) => `
${i + 1}. [${insight.type.toUpperCase()}] ${insight.title}
   ${insight.description || ''}
   Sources: ${insight.sources?.map(s => s.source).join(', ') || 'Internal'}
   ${insight.sources?.[0]?.quote ? `Quote: "${insight.sources[0].quote}"` : ''}
`).join('\n')}

=== YOUR TASK ===
Create SPECIFIC, breakthrough content that would score 80+ on the Synapse EQ scale.

REQUIREMENTS:
1. TITLE: Use a proven hook formula. Include numbers/specifics. No generic titles.
   ❌ "Unlock New Growth" | ✅ "3 Things Storm Season Reveals About Your Coverage Gaps"
   ❌ "Tips for Success" | ✅ "The $50K Mistake Most Collectors Make With Coverage"

2. HOOK: Trigger ONE neurological response in the first sentence.
   - Must create curiosity gap OR challenge an assumption OR present surprising data

3. BODY: 3-4 evidence-backed points that build toward the CTA.
   - Each point references real data from the insights
   - Include specific numbers, quotes, or percentages

4. CTA: Outcome-driven with tangible result.
   ❌ "Contact us" | ✅ "Get Your Free Quote in 60 Seconds"

5. BREAKTHROUGH SCORE: Rate based on insight connection quality.
   - 3-way connection (customer + opportunity + local/market) = 85-100
   - 2-way connection = 70-84
   - Single insight type = 60-69

OUTPUT FORMAT (JSON only, no markdown):
{
  "title": "Hook-formula-driven title with specific numbers/outcomes",
  "hook": "Neurologically-optimized opening that creates immediate interest",
  "body": [
    "Evidence-backed point 1 with specific data",
    "Evidence-backed point 2 referencing source",
    "Evidence-backed point 3 with contrarian angle"
  ],
  "cta": "Outcome-driven action with tangible result",
  "breakthroughScore": 85
}`;
  }

  /**
   * Select best CTA outcome based on industry and insight types
   */
  private selectBestCTAOutcome(industry: string, insightTypes: string[]): CTAOutcome {
    const industryLower = industry?.toLowerCase() || '';

    // Industry-specific CTA outcomes
    const industryOutcomes: Record<string, CTAOutcome> = {
      'insurance': 'get-quote',
      'finance': 'calculate',
      'financial': 'calculate',
      'banking': 'schedule',
      'saas': 'free-trial',
      'software': 'demo',
      'technology': 'demo',
      'healthcare': 'schedule',
      'medical': 'schedule',
      'legal': 'book-call',
      'law': 'book-call',
      'consulting': 'book-call',
      'real estate': 'schedule',
      'realestate': 'schedule',
      'retail': 'save-money',
      'ecommerce': 'save-money',
      'e-commerce': 'save-money',
      'restaurant': 'schedule',
      'fitness': 'free-trial',
      'gym': 'free-trial',
      'education': 'download',
      'training': 'download',
      'marketing': 'audit',
      'agency': 'audit'
    };

    // Check for industry match
    for (const [key, outcome] of Object.entries(industryOutcomes)) {
      if (industryLower.includes(key)) {
        return outcome;
      }
    }

    // Insight-type based fallbacks
    if (insightTypes.includes('competition')) {
      return 'compare';
    }
    if (insightTypes.includes('local') || insightTypes.includes('opportunity')) {
      return 'schedule';
    }
    if (insightTypes.includes('customer')) {
      return 'book-call';
    }

    // Default
    return 'learn-more';
  }

  /**
   * Build provenance from insight sources
   */
  private buildProvenance(insights: InsightCard[]): ContentProvenance {
    const sources: ContentProvenance['sources'] = [];
    const uniqueSources = new Set<string>();

    for (const insight of insights) {
      if (insight.sources) {
        for (const source of insight.sources) {
          if (!uniqueSources.has(source.source)) {
            uniqueSources.add(source.source);
            sources.push({
              name: source.source,
              quote: source.quote,
              confidence: insight.confidence
            });
          }
        }
      }
    }

    // Determine validation level
    let validation: ContentProvenance['validation'] = 'single-source';
    if (sources.length >= 3) {
      validation = 'triple-validated';
    } else if (sources.length === 2) {
      validation = 'cross-validated';
    }

    return {
      sources,
      dataPoints: insights.length,
      validation
    };
  }

  /**
   * Calculate EQ score using comprehensive pattern matching
   * Enhanced scoring with 7 psychological triggers, specificity bonuses, and combination multipliers
   * Now supports industry-specific trigger weighting
   */
  private async calculateEQScore(title: string, hook: string, industry?: string): Promise<number> {
    const text = `${title} ${hook}`.toLowerCase();
    const titleLower = title.toLowerCase();

    // Get industry-specific weights
    const industryKey = industry?.toLowerCase().replace(/[^a-z]/g, '') || 'default';
    const industryWeights = INDUSTRY_EQ_WEIGHTS[industryKey] || INDUSTRY_EQ_WEIGHTS.default;

    // Comprehensive psychological trigger patterns (expanded)
    const triggers = {
      curiosity: [
        /why\s/i, /what\s/i, /how\s/i, /\d+\s+things/i, /reveal/i, /secret/i,
        /won't tell you/i, /truth about/i, /really\s/i, /actually\s/i,
        /surprising/i, /unexpected/i, /hidden/i, /discover/i, /learn/i
      ],
      fear: [
        /stop\s/i, /avoid/i, /mistake/i, /gap/i, /missing/i, /risk/i, /lose/i,
        /danger/i, /warning/i, /don't\s/i, /never\s/i, /worst/i, /fail/i,
        /wrong/i, /problem/i, /nightmare/i, /costly/i, /expensive mistake/i
      ],
      urgency: [
        /before\s/i, /now\s/i, /deadline/i, /season/i, /limited/i,
        /today/i, /immediately/i, /running out/i, /last chance/i, /hurry/i,
        /don't wait/i, /act fast/i, /time-sensitive/i, /expires/i, /soon/i
      ],
      achievement: [
        /finally/i, /master/i, /unlock/i, /discover/i, /success/i,
        /achieve/i, /accomplish/i, /breakthrough/i, /transform/i, /level up/i,
        /expert/i, /pro\s/i, /advanced/i, /elite/i, /winning/i
      ],
      desire: [
        /want/i, /need/i, /wish/i, /dream/i, /imagine/i,
        /get\s/i, /have\s/i, /own\s/i, /enjoy/i, /experience/i,
        /love to/i, /perfect/i, /ideal/i, /best\s/i, /ultimate/i
      ],
      trust: [
        /proven/i, /verified/i, /based on/i, /\d+\s+(reviews|customers)/i,
        /data shows/i, /research/i, /studies/i, /experts/i, /guaranteed/i,
        /tested/i, /certified/i, /trusted/i, /reliable/i, /authentic/i
      ],
      belonging: [
        /everyone/i, /people like you/i, /join/i, /community/i, /together/i,
        /we\s/i, /our\s/i, /you're not alone/i, /others/i, /customers say/i,
        /members/i, /family/i, /tribe/i, /network/i, /fellow/i
      ]
    };

    let score = 40; // Base score (lowered to allow more room for bonuses)
    let triggersFound = 0;

    // Check each trigger category with industry-weighted scoring
    for (const [category, patterns] of Object.entries(triggers)) {
      let categoryMatches = 0;
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          categoryMatches++;
        }
      }
      if (categoryMatches > 0) {
        triggersFound++;
        // Apply industry weight to trigger score
        const weight = industryWeights[category] || 1.0;
        const baseScore = 7 + Math.min(3, (categoryMatches - 1) * 2);
        score += Math.round(baseScore * weight);
      }
    }

    // Multi-trigger combination bonus (emotional resonance)
    if (triggersFound >= 4) score += 10; // 4+ triggers = highly emotional
    else if (triggersFound >= 3) score += 6; // 3 triggers = strong emotional
    else if (triggersFound >= 2) score += 3; // 2 triggers = good emotional

    // Specificity bonuses
    if (/\d+/.test(titleLower)) score += 8; // Numbers in title (specific)
    if (/\$\d+/.test(text)) score += 5; // Dollar amounts (concrete value)
    if (/%/.test(text)) score += 4; // Percentages (measurable)

    // Length and detail bonuses
    if (text.length > 100) score += 4; // Detailed content
    else if (text.length > 50) score += 2;

    // Action orientation bonus
    if (/^(how to|why|what|stop|get|discover|learn|master|avoid)/i.test(titleLower)) {
      score += 5; // Action-oriented opening
    }

    // Question format bonus (engages reader)
    if (/\?/.test(title)) score += 3;

    // Power word combinations (fear + urgency, desire + achievement)
    const hasFear = triggers.fear.some(p => p.test(text));
    const hasUrgency = triggers.urgency.some(p => p.test(text));
    const hasDesire = triggers.desire.some(p => p.test(text));
    const hasAchievement = triggers.achievement.some(p => p.test(text));

    if (hasFear && hasUrgency) score += 5; // FOMO combination
    if (hasDesire && hasAchievement) score += 4; // Aspiration combination

    return Math.min(100, Math.max(0, Math.round(score)));
  }

  // ============================================================================
  // ITEM #24: CONTENT ATOMIZATION
  // Transform 1 insight into 6 platform-specific content variations
  // ============================================================================

  /**
   * Atomize a single insight into 6 platform-optimized content pieces
   */
  atomizeInsight(
    insight: InsightCard,
    context: DeepContext
  ): ContentAtomizationResult {
    const businessName = context.business.profile.name || 'Your Business';
    const industry = context.business.profile.industry || 'business';
    const city = context.business.profile.location?.city || '';

    const atoms: AtomizedContent[] = [
      // 1. Twitter/X - Thread starter (280 chars max)
      this.generateTwitterAtom(insight, businessName, industry),

      // 2. LinkedIn - Professional post
      this.generateLinkedInAtom(insight, businessName, industry),

      // 3. Instagram - Caption with emoji hook
      this.generateInstagramAtom(insight, businessName, industry),

      // 4. Blog - Intro paragraph
      this.generateBlogAtom(insight, businessName, industry),

      // 5. Email - Subject + preview
      this.generateEmailAtom(insight, businessName, industry),

      // 6. Video - Script hook (15-30 sec)
      this.generateVideoAtom(insight, businessName, industry)
    ];

    return {
      sourceInsight: {
        title: insight.title,
        type: insight.type,
        source: insight.source || 'intelligence'
      },
      atoms,
      generatedAt: new Date()
    };
  }

  /**
   * Atomize multiple insights into platform content
   */
  atomizeInsights(
    insights: InsightCard[],
    context: DeepContext
  ): ContentAtomizationResult[] {
    return insights.map(insight => this.atomizeInsight(insight, context));
  }

  private generateTwitterAtom(insight: InsightCard, businessName: string, industry: string): AtomizedContent {
    const title = insight.title;
    const type = insight.type;

    // Create engaging thread starter based on insight type
    let content = '';
    let hashtags: string[] = [];

    switch (type) {
      case 'customer':
        content = `Here's what ${industry} customers actually want (most businesses miss this):\n\n${this.truncate(title, 180)}\n\nThread 🧵`;
        hashtags = [`#${industry.replace(/\s+/g, '')}`, '#CustomerInsights', '#Marketing'];
        break;
      case 'competitor':
        content = `Your competitors don't want you to know this about ${industry}:\n\n${this.truncate(title, 180)}`;
        hashtags = ['#CompetitiveAdvantage', '#BusinessStrategy'];
        break;
      case 'opportunity':
        content = `Spotted: A massive opportunity in ${industry} that no one's talking about.\n\n${this.truncate(title, 160)}`;
        hashtags = ['#GrowthHacking', '#Opportunity'];
        break;
      case 'local':
        content = `Local ${industry} insight: ${this.truncate(title, 200)}\n\nTiming matters.`;
        hashtags = ['#LocalBusiness', '#SmallBusiness'];
        break;
      default:
        content = `${this.truncate(title, 220)}\n\nHere's what it means for you 👇`;
        hashtags = [`#${industry.replace(/\s+/g, '')}`];
    }

    return {
      platform: 'twitter',
      format: 'Thread Starter',
      content,
      characterCount: content.length,
      hashtags,
      emoji: '🧵'
    };
  }

  private generateLinkedInAtom(insight: InsightCard, businessName: string, industry: string): AtomizedContent {
    const title = insight.title;

    // Professional tone for LinkedIn
    const hooks = [
      `I've been analyzing ${industry} trends, and this stood out:`,
      `After reviewing hundreds of data points in ${industry}:`,
      `Here's an insight that's changing how we think about ${industry}:`,
      `The data doesn't lie. In ${industry}, we're seeing:`
    ];

    const hook = hooks[Math.floor(Math.random() * hooks.length)];
    const content = `${hook}\n\n${title}\n\nWhat this means for your business:\n\n→ The market is shifting\n→ Early movers will win\n→ Action beats analysis\n\nWhat's your take? Have you noticed this trend?\n\n#${industry.replace(/\s+/g, '')} #BusinessInsights #Strategy`;

    return {
      platform: 'linkedin',
      format: 'Professional Post',
      content,
      characterCount: content.length,
      hashtags: [`#${industry.replace(/\s+/g, '')}`, '#BusinessInsights', '#Strategy'],
      cta: 'What\'s your take?'
    };
  }

  private generateInstagramAtom(insight: InsightCard, businessName: string, industry: string): AtomizedContent {
    const title = insight.title;

    // Instagram needs emotional hooks and emojis
    const emojiMap: Record<string, string> = {
      customer: '💡',
      competitor: '🎯',
      opportunity: '🚀',
      local: '📍',
      trend: '📈',
      default: '✨'
    };

    const emoji = emojiMap[insight.type] || emojiMap.default;

    const content = `${emoji} ${title}\n\n.\n.\n.\n\nDrop a ${emoji} if this resonates with you!\n\n—\n📲 Save this for later\n💬 Share with someone who needs this\n👉 Follow @${businessName.toLowerCase().replace(/\s+/g, '')} for more ${industry} insights`;

    return {
      platform: 'instagram',
      format: 'Caption',
      content,
      characterCount: content.length,
      emoji,
      hashtags: [
        `#${industry.replace(/\s+/g, '')}`,
        '#BusinessTips',
        '#Entrepreneur',
        '#SmallBusiness',
        '#GrowthMindset'
      ],
      thumbnailIdea: `Bold text overlay: "${this.truncate(title, 50)}" on gradient background`
    };
  }

  private generateBlogAtom(insight: InsightCard, businessName: string, industry: string): AtomizedContent {
    const title = insight.title;

    const content = `# ${title}

In today's rapidly evolving ${industry} landscape, staying ahead of the curve isn't just an advantage—it's a necessity.

Our latest analysis reveals a critical insight that could reshape how you approach your business strategy: **${title}**

Here's why this matters:

1. **Market Dynamics**: The ${industry} sector is experiencing unprecedented shifts
2. **Customer Expectations**: What worked yesterday may not work tomorrow
3. **Competitive Pressure**: Early adopters are already capitalizing on this trend

In the sections below, we'll break down exactly what this means for your business and provide actionable steps you can implement today.

*Ready to dive deeper? Let's explore the data behind this insight.*`;

    return {
      platform: 'blog',
      format: 'Intro Paragraph',
      content,
      characterCount: content.length,
      cta: 'Read the full analysis'
    };
  }

  private generateEmailAtom(insight: InsightCard, businessName: string, industry: string): AtomizedContent {
    const title = insight.title;

    // Generate compelling subject lines
    const subjects = [
      `${this.truncate(title, 40)}... [New Data Inside]`,
      `The ${industry} insight your competitors hope you miss`,
      `Quick question about your ${industry} strategy`,
      `[Data Alert] ${this.truncate(title, 35)}`
    ];

    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    const preview = `We analyzed the data. Here's what we found...`;

    const content = `Subject: ${subject}
Preview: ${preview}

---

Hi [First Name],

I wanted to share something interesting we discovered:

${title}

This isn't just another industry report—it's actionable intelligence that could impact your strategy this quarter.

Here's the quick version:
• What we found
• Why it matters
• What you can do about it

[CTA BUTTON: See the Full Analysis]

To your success,
${businessName}`;

    return {
      platform: 'email',
      format: 'Subject + Preview + Body',
      content,
      characterCount: content.length,
      cta: 'See the Full Analysis'
    };
  }

  private generateVideoAtom(insight: InsightCard, businessName: string, industry: string): AtomizedContent {
    const title = insight.title;

    // 15-30 second hook script
    const content = `[VIDEO SCRIPT - 15-30 seconds]

HOOK (0-3 sec):
"Stop scrolling. If you're in ${industry}, you need to hear this."

PROBLEM (3-10 sec):
"Most people in our industry are missing something huge right now..."

INSIGHT (10-20 sec):
"${title}"

TEASE (20-25 sec):
"And here's the thing—the businesses that act on this first? They're going to dominate."

CTA (25-30 sec):
"Follow for more ${industry} insights. Link in bio for the full breakdown."

---
VISUAL NOTES:
- Direct to camera, high energy
- Use text overlay for key stats
- Cut to B-roll for "insight" section
- End with logo/CTA card`;

    return {
      platform: 'video',
      format: 'Hook Script (15-30 sec)',
      content,
      characterCount: content.length,
      thumbnailIdea: `You + shocked face + text: "${this.truncate(title, 30)}"`
    };
  }

  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  // ============================================================================
  // ITEM #25: LOCAL KEYWORD TEMPLATES
  // Generate local SEO-optimized content variations for SMB businesses
  // ============================================================================

  /**
   * Generate local SEO keyword variations for a service/topic
   */
  generateLocalKeywordTemplates(
    service: string,
    context: DeepContext
  ): LocalKeywordResult {
    const city = context.business.profile.location?.city || '';
    const state = context.business.profile.location?.state || '';
    const neighborhood = context.business.profile.location?.neighborhood || '';
    const businessName = context.business.profile.name || '';

    if (!city) {
      console.warn('[LocalKeywords] No city in context, returning minimal templates');
      return {
        service,
        location: { city: '', state: '', neighborhood: '' },
        keywords: [],
        contentIdeas: [],
        generatedAt: new Date()
      };
    }

    const keywords = this.buildLocalKeywords(service, city, state, neighborhood);
    const contentIdeas = this.buildLocalContentIdeas(service, city, state, businessName);

    return {
      service,
      location: { city, state, neighborhood },
      keywords,
      contentIdeas,
      generatedAt: new Date()
    };
  }

  /**
   * Generate local keywords for multiple services
   */
  generateLocalKeywordsForServices(
    services: string[],
    context: DeepContext
  ): LocalKeywordResult[] {
    return services.map(service => this.generateLocalKeywordTemplates(service, context));
  }

  private buildLocalKeywords(
    service: string,
    city: string,
    state: string,
    neighborhood: string
  ): LocalKeyword[] {
    const keywords: LocalKeyword[] = [];
    const serviceLower = service.toLowerCase();
    const cityLower = city.toLowerCase();

    // High-intent "near me" variations
    keywords.push(
      { keyword: `${serviceLower} near me`, type: 'near_me', intent: 'high', searchVolume: 'high' },
      { keyword: `${serviceLower} near me open now`, type: 'near_me', intent: 'immediate', searchVolume: 'medium' },
      { keyword: `best ${serviceLower} near me`, type: 'near_me', intent: 'high', searchVolume: 'high' }
    );

    // City-specific variations
    keywords.push(
      { keyword: `${serviceLower} in ${cityLower}`, type: 'city', intent: 'high', searchVolume: 'high' },
      { keyword: `${cityLower} ${serviceLower}`, type: 'city', intent: 'high', searchVolume: 'high' },
      { keyword: `best ${serviceLower} in ${cityLower}`, type: 'city', intent: 'high', searchVolume: 'medium' },
      { keyword: `top rated ${serviceLower} ${cityLower}`, type: 'city', intent: 'high', searchVolume: 'medium' },
      { keyword: `${serviceLower} ${cityLower} reviews`, type: 'city', intent: 'research', searchVolume: 'medium' }
    );

    // State variations for broader reach
    if (state) {
      const stateLower = state.toLowerCase();
      keywords.push(
        { keyword: `${serviceLower} ${stateLower}`, type: 'state', intent: 'medium', searchVolume: 'medium' },
        { keyword: `best ${serviceLower} in ${stateLower}`, type: 'state', intent: 'medium', searchVolume: 'low' }
      );
    }

    // Neighborhood variations for hyper-local
    if (neighborhood) {
      const neighborhoodLower = neighborhood.toLowerCase();
      keywords.push(
        { keyword: `${serviceLower} ${neighborhoodLower}`, type: 'neighborhood', intent: 'high', searchVolume: 'low' },
        { keyword: `${serviceLower} near ${neighborhoodLower}`, type: 'neighborhood', intent: 'high', searchVolume: 'low' }
      );
    }

    // Service-specific qualifiers
    const qualifiers = ['affordable', 'emergency', 'same day', '24 hour', 'licensed', 'certified'];
    qualifiers.forEach(qual => {
      keywords.push({
        keyword: `${qual} ${serviceLower} ${cityLower}`,
        type: 'qualified',
        intent: 'high',
        searchVolume: 'low'
      });
    });

    // Question-based (PAA targets)
    keywords.push(
      { keyword: `how much does ${serviceLower} cost in ${cityLower}`, type: 'question', intent: 'research', searchVolume: 'medium' },
      { keyword: `who is the best ${serviceLower} in ${cityLower}`, type: 'question', intent: 'research', searchVolume: 'low' },
      { keyword: `what to look for in a ${serviceLower}`, type: 'question', intent: 'research', searchVolume: 'medium' }
    );

    return keywords;
  }

  private buildLocalContentIdeas(
    service: string,
    city: string,
    state: string,
    businessName: string
  ): LocalContentIdea[] {
    return [
      {
        title: `Top 5 Things to Look for in a ${service} in ${city}`,
        type: 'listicle',
        targetKeywords: [`${service.toLowerCase()} ${city.toLowerCase()}`, `best ${service.toLowerCase()} ${city.toLowerCase()}`],
        outline: [
          'Introduction: Why choosing the right provider matters',
          'Point 1: Licensing and credentials',
          'Point 2: Reviews and reputation',
          'Point 3: Response time and availability',
          'Point 4: Pricing transparency',
          'Point 5: Guarantees and warranties',
          `Conclusion: Why ${businessName} checks all the boxes`
        ]
      },
      {
        title: `${city} ${service} Guide: What Local Residents Need to Know`,
        type: 'guide',
        targetKeywords: [`${service.toLowerCase()} in ${city.toLowerCase()}`, `${city.toLowerCase()} ${service.toLowerCase()} guide`],
        outline: [
          `Overview of ${service.toLowerCase()} needs in ${city}`,
          'Common issues faced by local residents',
          'Seasonal considerations',
          'Average costs in the area',
          'How to choose the right provider',
          'Red flags to watch out for'
        ]
      },
      {
        title: `Why ${city} Residents Choose ${businessName} for ${service}`,
        type: 'testimonial_roundup',
        targetKeywords: [`${businessName.toLowerCase()} reviews`, `${service.toLowerCase()} ${city.toLowerCase()} reviews`],
        outline: [
          'Customer success stories',
          'Before and after examples',
          'Common praise points from reviews',
          'Our commitment to the community',
          'Special offers for local residents'
        ]
      },
      {
        title: `${service} Costs in ${city}: What to Expect in ${new Date().getFullYear()}`,
        type: 'pricing_guide',
        targetKeywords: [`${service.toLowerCase()} cost ${city.toLowerCase()}`, `how much does ${service.toLowerCase()} cost`],
        outline: [
          'Average pricing overview',
          'Factors that affect pricing',
          'Budget vs premium options',
          'Hidden costs to watch for',
          'How to get the best value',
          'Our transparent pricing'
        ]
      },
      {
        title: `Emergency ${service} in ${city}: What to Do When You Need Help Fast`,
        type: 'emergency_guide',
        targetKeywords: [`emergency ${service.toLowerCase()} ${city.toLowerCase()}`, `24 hour ${service.toLowerCase()} ${city.toLowerCase()}`],
        outline: [
          'Signs you need emergency service',
          'What to do while waiting for help',
          'How to find reliable emergency providers',
          'Questions to ask before they arrive',
          `Why ${businessName} offers 24/7 service`
        ]
      }
    ];
  }

  // ============================================================================
  // ITEM #26: CASE STUDY FRAMEWORK
  // Transform positive reviews into structured mini case studies
  // ============================================================================

  /**
   * Generate case studies from positive reviews (4-5 stars)
   */
  generateCaseStudiesFromReviews(
    reviews: Array<{ text: string; rating: number; source: string; date?: string }>,
    context: DeepContext
  ): CaseStudyFrameworkResult {
    const businessName = context.business.profile.name || 'Our Team';
    const industry = context.business.profile.industry || 'business';
    const services = context.business.profile.services || [industry];

    // Filter to positive reviews only (4-5 stars)
    const positiveReviews = reviews.filter(r => r.rating >= 4);

    if (positiveReviews.length === 0) {
      return {
        caseStudies: [],
        summary: {
          totalReviewsProcessed: reviews.length,
          caseStudiesGenerated: 0,
          averageRating: 0,
          topThemes: []
        },
        generatedAt: new Date()
      };
    }

    // Generate case studies
    const caseStudies = positiveReviews
      .slice(0, 10) // Limit to top 10
      .map((review, idx) => this.transformReviewToCaseStudy(
        review,
        businessName,
        industry,
        services[0] || industry,
        idx
      ));

    // Extract themes from reviews
    const topThemes = this.extractReviewThemes(positiveReviews);

    return {
      caseStudies,
      summary: {
        totalReviewsProcessed: reviews.length,
        caseStudiesGenerated: caseStudies.length,
        averageRating: positiveReviews.reduce((sum, r) => sum + r.rating, 0) / positiveReviews.length,
        topThemes
      },
      generatedAt: new Date()
    };
  }

  private transformReviewToCaseStudy(
    review: { text: string; rating: number; source: string; date?: string },
    businessName: string,
    industry: string,
    service: string,
    index: number
  ): ReviewCaseStudy {
    const reviewText = review.text;

    // Extract components from review
    const challenge = this.extractChallenge(reviewText, industry);
    const solution = this.extractSolution(reviewText, businessName, service);
    const result = this.extractResult(reviewText);
    const quote = this.extractBestQuote(reviewText);
    const customerType = this.inferCustomerType(reviewText, industry);

    // Generate title
    const title = this.generateCaseStudyTitle(challenge, result, customerType);

    // Generate content variations
    const contentVariations = this.generateCaseStudyVariations(
      title,
      challenge,
      solution,
      result,
      quote,
      businessName,
      customerType
    );

    return {
      id: `case-study-${Date.now()}-${index}`,
      title,
      challenge,
      solution,
      result,
      quote,
      customerType,
      serviceProvided: service,
      metrics: this.extractMetrics(reviewText),
      contentVariations,
      sourceReview: {
        text: reviewText,
        rating: review.rating,
        source: review.source,
        date: review.date
      },
      generatedAt: new Date()
    };
  }

  private extractChallenge(reviewText: string, industry: string): string {
    // Look for problem indicators
    const problemPatterns = [
      /(?:had|was having|experienced|dealing with|struggled with|needed help with)\s+([^.!?]+)/i,
      /(?:problem|issue|trouble|difficulty)\s+(?:with|was)\s+([^.!?]+)/i,
      /(?:before|initially|originally)\s+([^.!?]+)/i
    ];

    for (const pattern of problemPatterns) {
      const match = reviewText.match(pattern);
      if (match) {
        return `Customer faced ${match[1].trim().toLowerCase()}`;
      }
    }

    // Generic fallback based on industry
    const industryProblems: Record<string, string> = {
      plumbing: 'Customer needed urgent plumbing repair',
      dental: 'Customer sought quality dental care',
      restaurant: 'Customer was looking for a great dining experience',
      insurance: 'Customer needed reliable coverage options',
      legal: 'Customer faced a complex legal situation',
      default: `Customer needed reliable ${industry} services`
    };

    return industryProblems[industry.toLowerCase()] || industryProblems.default;
  }

  private extractSolution(reviewText: string, businessName: string, service: string): string {
    // Look for solution/action indicators
    const solutionPatterns = [
      /(?:they|he|she|the team)\s+([^.!?]*(?:fixed|solved|helped|resolved|provided|delivered)[^.!?]*)/i,
      /(?:came out|arrived|showed up)\s+([^.!?]+)/i,
      /(?:service|work|job)\s+(?:was|included)\s+([^.!?]+)/i
    ];

    for (const pattern of solutionPatterns) {
      const match = reviewText.match(pattern);
      if (match) {
        return `${businessName} ${match[1].trim().toLowerCase()}`;
      }
    }

    return `${businessName} provided professional ${service.toLowerCase()} services`;
  }

  private extractResult(reviewText: string): string {
    // Look for outcome indicators
    const resultPatterns = [
      /(?:now|result|outcome|finally)\s+([^.!?]+)/i,
      /(?:so happy|very pleased|extremely satisfied|couldn't be happier)\s*(?:with|that)?\s*([^.!?]*)/i,
      /(?:works|working)\s+([^.!?]*(?:perfectly|great|amazing|well)[^.!?]*)/i
    ];

    for (const pattern of resultPatterns) {
      const match = reviewText.match(pattern);
      if (match && match[1]) {
        return `Customer achieved ${match[1].trim().toLowerCase()}`;
      }
    }

    // Check for positive sentiment fallback
    if (/highly recommend|5 stars?|excellent|amazing|fantastic/i.test(reviewText)) {
      return 'Customer achieved complete satisfaction and recommends the service';
    }

    return 'Customer received excellent service and results';
  }

  private extractBestQuote(reviewText: string): string {
    // Extract the most impactful sentence
    const sentences = reviewText.split(/[.!?]+/).filter(s => s.trim().length > 10);

    // Score sentences by impact
    const scoredSentences = sentences.map(sentence => {
      let score = 0;
      if (/highly recommend|best|amazing|excellent|fantastic|outstanding/i.test(sentence)) score += 3;
      if (/saved|helped|fixed|solved|delivered/i.test(sentence)) score += 2;
      if (/5 stars?|perfect|couldn't be happier/i.test(sentence)) score += 2;
      if (sentence.length > 30 && sentence.length < 150) score += 1; // Prefer medium-length
      return { sentence: sentence.trim(), score };
    });

    // Return highest scoring sentence
    scoredSentences.sort((a, b) => b.score - a.score);
    return scoredSentences[0]?.sentence || reviewText.substring(0, 100);
  }

  private inferCustomerType(reviewText: string, industry: string): string {
    // Look for customer type indicators
    if (/home|house|residential|family/i.test(reviewText)) return 'Homeowner';
    if (/business|office|commercial|company/i.test(reviewText)) return 'Business Owner';
    if (/emergency|urgent|same day/i.test(reviewText)) return 'Emergency Customer';
    if (/first time|new customer|just moved/i.test(reviewText)) return 'First-Time Customer';
    if (/years|long time|regular|always/i.test(reviewText)) return 'Loyal Customer';

    // Industry-specific fallbacks
    const industryCustomers: Record<string, string> = {
      dental: 'Patient',
      restaurant: 'Diner',
      legal: 'Client',
      insurance: 'Policyholder',
      default: 'Customer'
    };

    return industryCustomers[industry.toLowerCase()] || industryCustomers.default;
  }

  private generateCaseStudyTitle(challenge: string, result: string, customerType: string): string {
    const templates = [
      `How We Helped a ${customerType} Achieve Outstanding Results`,
      `${customerType} Success Story: From Challenge to Solution`,
      `Real Results: A ${customerType}'s Journey to Satisfaction`,
      `Why This ${customerType} Recommends Our Services`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  private generateCaseStudyVariations(
    title: string,
    challenge: string,
    solution: string,
    result: string,
    quote: string,
    businessName: string,
    customerType: string
  ): ReviewCaseStudy['contentVariations'] {
    return {
      socialPost: `"${quote}"\n\n— A satisfied ${customerType.toLowerCase()}\n\nThis is why we do what we do. Ready to be our next success story?\n\n#CustomerSuccess #${businessName.replace(/\s+/g, '')}`,

      testimonialCard: `★★★★★\n\n"${quote}"\n\n${customerType}\n${businessName} Customer`,

      blogSection: `## ${title}\n\n**The Challenge:** ${challenge}\n\n**Our Solution:** ${solution}\n\n**The Result:** ${result}\n\n> "${quote}"\n\n*— Satisfied ${customerType}*`,

      emailSnippet: `Here's what one of our recent customers had to say:\n\n"${quote}"\n\nThis ${customerType.toLowerCase()} came to us facing a challenge. We delivered a solution. And the results speak for themselves.\n\nReady to experience the same level of service?`
    };
  }

  private extractMetrics(reviewText: string): ReviewCaseStudy['metrics'] | undefined {
    const metrics: ReviewCaseStudy['metrics'] = {};

    // Look for timeframes
    const timeMatch = reviewText.match(/(\d+)\s*(minutes?|hours?|days?|weeks?)/i);
    if (timeMatch) {
      metrics.timeframe = `${timeMatch[1]} ${timeMatch[2]}`;
    }

    // Look for percentages or improvements
    const improvementMatch = reviewText.match(/(\d+)%?\s*(better|improvement|increase|faster|cheaper)/i);
    if (improvementMatch) {
      metrics.improvement = `${improvementMatch[1]}% ${improvementMatch[2]}`;
    }

    // Rating as satisfaction
    if (/5 stars?|excellent|perfect/i.test(reviewText)) {
      metrics.satisfaction = '5/5 satisfaction';
    }

    return Object.keys(metrics).length > 0 ? metrics : undefined;
  }

  private extractReviewThemes(reviews: Array<{ text: string }>): string[] {
    const themeKeywords: Record<string, string[]> = {
      'Fast Service': ['fast', 'quick', 'same day', 'prompt', 'on time'],
      'Professional': ['professional', 'expert', 'knowledgeable', 'skilled'],
      'Friendly Staff': ['friendly', 'nice', 'courteous', 'helpful', 'patient'],
      'Fair Pricing': ['fair price', 'reasonable', 'affordable', 'good value', 'worth'],
      'Quality Work': ['quality', 'thorough', 'excellent work', 'great job', 'well done'],
      'Communication': ['communication', 'explained', 'kept us informed', 'responsive'],
      'Clean Work': ['clean', 'tidy', 'neat', 'cleaned up'],
      'Reliability': ['reliable', 'dependable', 'trustworthy', 'showed up']
    };

    const themeCounts: Record<string, number> = {};

    reviews.forEach(review => {
      const text = review.text.toLowerCase();
      Object.entries(themeKeywords).forEach(([theme, keywords]) => {
        if (keywords.some(kw => text.includes(kw))) {
          themeCounts[theme] = (themeCounts[theme] || 0) + 1;
        }
      });
    });

    // Return top 5 themes
    return Object.entries(themeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([theme]) => theme);
  }

  // ============================================================================
  // ITEM #27: REVIEW RESPONSE GENERATOR
  // Generate contextual responses to customer reviews
  // ============================================================================

  /**
   * Generate a response to a single review
   */
  generateReviewResponse(
    review: { text: string; rating: number; source: string; reviewId?: string },
    context: DeepContext
  ): ReviewResponse {
    const businessName = context.business.profile.name || 'Our Team';
    const ownerName = context.business.profile.ownerName || 'The Team';

    const sentiment = this.classifyReviewSentiment(review.rating);
    const tone = this.selectResponseTone(sentiment);
    const keyPoints = this.extractReviewKeyPoints(review.text);

    let response: string;
    let alternativeResponses: string[];
    let actionItems: string[] | undefined;

    switch (sentiment) {
      case 'positive':
        response = this.generatePositiveResponse(review.text, businessName, ownerName, keyPoints);
        alternativeResponses = this.generatePositiveAlternatives(review.text, businessName, ownerName);
        break;
      case 'neutral':
        response = this.generateNeutralResponse(review.text, businessName, ownerName, keyPoints);
        alternativeResponses = this.generateNeutralAlternatives(review.text, businessName, ownerName);
        actionItems = ['Follow up to understand concerns better', 'Offer to discuss ways to improve'];
        break;
      case 'negative':
        response = this.generateNegativeResponse(review.text, businessName, ownerName, keyPoints);
        alternativeResponses = this.generateNegativeAlternatives(review.text, businessName, ownerName);
        actionItems = [
          'Contact customer directly to resolve issue',
          'Document incident for internal review',
          'Follow up after resolution'
        ];
        break;
    }

    return {
      id: `response-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      reviewId: review.reviewId,
      sentiment,
      tone,
      response,
      alternativeResponses,
      keyPoints,
      actionItems,
      sourceReview: {
        text: review.text,
        rating: review.rating,
        source: review.source
      },
      generatedAt: new Date()
    };
  }

  /**
   * Generate responses for multiple reviews
   */
  generateReviewResponses(
    reviews: Array<{ text: string; rating: number; source: string; reviewId?: string }>,
    context: DeepContext
  ): ReviewResponseBatchResult {
    const responses = reviews.map(review => this.generateReviewResponse(review, context));

    return {
      responses,
      summary: {
        totalProcessed: reviews.length,
        positiveCount: responses.filter(r => r.sentiment === 'positive').length,
        neutralCount: responses.filter(r => r.sentiment === 'neutral').length,
        negativeCount: responses.filter(r => r.sentiment === 'negative').length
      },
      generatedAt: new Date()
    };
  }

  private classifyReviewSentiment(rating: number): ReviewSentiment {
    if (rating >= 4) return 'positive';
    if (rating === 3) return 'neutral';
    return 'negative';
  }

  private selectResponseTone(sentiment: ReviewSentiment): ReviewResponseTone {
    switch (sentiment) {
      case 'positive': return 'warm';
      case 'neutral': return 'professional';
      case 'negative': return 'apologetic';
    }
  }

  private extractReviewKeyPoints(reviewText: string): string[] {
    const keyPoints: string[] = [];
    const text = reviewText.toLowerCase();

    // Extract mentioned staff
    const staffMatch = reviewText.match(/([A-Z][a-z]+)\s+(?:was|helped|assisted|took care)/);
    if (staffMatch) {
      keyPoints.push(`Staff mentioned: ${staffMatch[1]}`);
    }

    // Extract services mentioned
    const serviceKeywords = ['repair', 'installation', 'cleaning', 'consultation', 'service', 'treatment', 'appointment'];
    serviceKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        keyPoints.push(`Service: ${keyword}`);
      }
    });

    // Extract timing mentions
    if (/same day|next day|quick|fast|on time|early/i.test(text)) {
      keyPoints.push('Timing praised');
    }

    // Extract price mentions
    if (/price|cost|affordable|expensive|cheap|value/i.test(text)) {
      keyPoints.push('Pricing mentioned');
    }

    // Extract specific issues for negative reviews
    if (/wait|delay|late|slow/i.test(text)) {
      keyPoints.push('Issue: Wait time/delays');
    }
    if (/rude|unprofessional|attitude/i.test(text)) {
      keyPoints.push('Issue: Staff behavior');
    }
    if (/wrong|mistake|error|incorrect/i.test(text)) {
      keyPoints.push('Issue: Service error');
    }

    return keyPoints.slice(0, 5); // Limit to 5 key points
  }

  private generatePositiveResponse(
    reviewText: string,
    businessName: string,
    ownerName: string,
    keyPoints: string[]
  ): string {
    const staffMention = keyPoints.find(k => k.startsWith('Staff mentioned:'));
    const staffName = staffMention ? staffMention.replace('Staff mentioned: ', '') : null;

    const openings = [
      'Thank you so much for taking the time to share your experience!',
      'We really appreciate your kind words and thoughtful review!',
      'Thank you for this wonderful feedback!'
    ];

    const acknowledgments = staffName
      ? `We'll be sure to share your kind words with ${staffName} – they'll be thrilled to hear this!`
      : 'Our team works hard to provide the best possible experience, and reviews like yours make it all worthwhile.';

    const closings = [
      `We look forward to serving you again!\n\nWarmly,\n${ownerName} at ${businessName}`,
      `Thank you for being a valued customer!\n\nBest regards,\n${ownerName}`,
      `We can't wait to see you again!\n\n— The ${businessName} Team`
    ];

    const opening = openings[Math.floor(Math.random() * openings.length)];
    const closing = closings[Math.floor(Math.random() * closings.length)];

    return `${opening}\n\n${acknowledgments}\n\n${closing}`;
  }

  private generatePositiveAlternatives(
    reviewText: string,
    businessName: string,
    ownerName: string
  ): string[] {
    return [
      `Wow, thank you for this amazing review! It means the world to our team. We're so glad we could exceed your expectations. See you next time!\n\n— ${businessName}`,
      `This made our day! Thank you for sharing your experience. We're committed to providing excellent service, and customers like you are why we love what we do.\n\nWith gratitude,\n${ownerName}`
    ];
  }

  private generateNeutralResponse(
    reviewText: string,
    businessName: string,
    ownerName: string,
    keyPoints: string[]
  ): string {
    return `Thank you for taking the time to share your feedback with us. We appreciate your honest review and take all customer input seriously.

We're always looking for ways to improve, and your insights help us do just that. If there's anything specific we can do to earn a 5-star experience next time, please don't hesitate to reach out directly.

We'd love the opportunity to exceed your expectations.

Best regards,
${ownerName} at ${businessName}`;
  }

  private generateNeutralAlternatives(
    reviewText: string,
    businessName: string,
    ownerName: string
  ): string[] {
    return [
      `Thank you for your review. We value all feedback and would love to hear more about how we can improve your experience. Please feel free to contact us directly.\n\n— ${businessName}`,
      `We appreciate you sharing your thoughts. Your feedback is important to us, and we're committed to continuous improvement. We hope to serve you again soon and provide an even better experience.\n\nSincerely,\n${ownerName}`
    ];
  }

  private generateNegativeResponse(
    reviewText: string,
    businessName: string,
    ownerName: string,
    keyPoints: string[]
  ): string {
    // Identify specific issues
    const issues = keyPoints.filter(k => k.startsWith('Issue:'));
    const issueAcknowledgment = issues.length > 0
      ? `We understand your concerns regarding ${issues.map(i => i.replace('Issue: ', '').toLowerCase()).join(' and ')}, and we take this very seriously.`
      : 'We take your feedback very seriously and are committed to addressing your concerns.';

    return `We sincerely apologize that your experience did not meet the high standards we set for ourselves.

${issueAcknowledgment}

This is not the level of service we strive to provide, and we would appreciate the opportunity to make things right. Please contact us directly at your earliest convenience so we can discuss this further and find a resolution.

Your satisfaction is our top priority, and we hope you'll give us another chance to serve you.

Sincerely,
${ownerName}
${businessName}`;
  }

  private generateNegativeAlternatives(
    reviewText: string,
    businessName: string,
    ownerName: string
  ): string[] {
    return [
      `We're truly sorry to hear about your experience. This falls short of our standards, and we want to make it right. Please reach out to us directly so we can address your concerns personally.\n\nWith apologies,\n${ownerName} at ${businessName}`,
      `Thank you for bringing this to our attention. We apologize for the inconvenience and disappointment you experienced. We've shared your feedback with our team and are taking steps to ensure this doesn't happen again. We hope you'll allow us to regain your trust.\n\n— ${businessName} Management`
    ];
  }

  // ============================================================================
  // ITEM #28: THOUGHT LEADERSHIP ANGLES
  // Generate executive-level B2B content angles
  // ============================================================================

  /**
   * Generate thought leadership angles for B2B content
   */
  generateThoughtLeadershipAngles(
    insights: InsightCard[],
    context: DeepContext
  ): ThoughtLeadershipResult {
    const industry = context.business.profile.industry || 'technology';
    const businessName = context.business.profile.name || 'Your Company';
    const targetCustomer = context.business.profile.targetCustomer || 'enterprise decision-makers';

    const angles: ThoughtLeadershipAngle[] = [];

    // Generate angles for each type
    angles.push(this.generateIndustryTrendAngle(insights, industry, businessName, targetCustomer));
    angles.push(this.generateContrarianTakeAngle(insights, industry, businessName, targetCustomer));
    angles.push(this.generateFuturePredictionAngle(insights, industry, businessName, targetCustomer));
    angles.push(this.generateBestPracticeAngle(insights, industry, businessName, targetCustomer));
    angles.push(this.generateCompetitiveLandscapeAngle(insights, industry, businessName, targetCustomer));

    // Count by type
    const byType = angles.reduce((acc, angle) => {
      acc[angle.type] = (acc[angle.type] || 0) + 1;
      return acc;
    }, {} as Record<ThoughtLeadershipType, number>);

    return {
      angles,
      industry,
      targetSegment: targetCustomer,
      summary: {
        totalAngles: angles.length,
        byType
      },
      generatedAt: new Date()
    };
  }

  private generateIndustryTrendAngle(
    insights: InsightCard[],
    industry: string,
    businessName: string,
    targetCustomer: string
  ): ThoughtLeadershipAngle {
    const trendInsights = insights.filter(i =>
      i.type === 'trend' || i.type === 'opportunity' || /trend|shift|change|evolv/i.test(i.title)
    );

    const title = `The ${industry} Landscape Is Shifting: What Leaders Need to Know in ${new Date().getFullYear()}`;
    const hook = `The rules of ${industry} are being rewritten. Here's what the data reveals.`;

    const mainArgument = trendInsights.length > 0
      ? `Recent analysis reveals key shifts: ${trendInsights.slice(0, 2).map(i => i.title).join('; ')}`
      : `The ${industry} sector is experiencing unprecedented transformation driven by technology, customer expectations, and market dynamics.`;

    return {
      id: `tl-trend-${Date.now()}`,
      type: 'industry_trend',
      title,
      hook,
      mainArgument,
      supportingPoints: [
        'Market forces driving change',
        'Customer behavior evolution',
        'Technology enablers',
        'Regulatory landscape shifts'
      ],
      dataPoints: trendInsights.slice(0, 3).map(i => i.title),
      callToAction: 'Position your organization to lead, not follow, these trends.',
      targetAudience: targetCustomer,
      linkedInPost: this.generateLinkedInThoughtPost(title, hook, mainArgument, businessName),
      twitterThread: this.generateTwitterThread(title, hook, mainArgument),
      blogOutline: this.generateBlogOutline(title, 'industry_trend'),
      emailSubject: `${industry} Trends: What Top Leaders Are Watching`,
      confidence: trendInsights.length > 0 ? 85 : 70,
      generatedAt: new Date()
    };
  }

  private generateContrarianTakeAngle(
    insights: InsightCard[],
    industry: string,
    businessName: string,
    targetCustomer: string
  ): ThoughtLeadershipAngle {
    const competitorInsights = insights.filter(i =>
      i.type === 'competitor' || /competitor|industry|common|myth|wrong/i.test(i.title)
    );

    const title = `Unpopular Opinion: Why the ${industry} Industry Has It Backwards`;
    const hook = `Everyone's doing it this way. Here's why that's a mistake.`;

    const mainArgument = `While conventional wisdom in ${industry} suggests following established patterns, our data reveals a counterintuitive truth that leading organizations are beginning to leverage.`;

    return {
      id: `tl-contrarian-${Date.now()}`,
      type: 'contrarian_take',
      title,
      hook,
      mainArgument,
      supportingPoints: [
        'The conventional approach and its limitations',
        'Hidden costs of "industry best practices"',
        'Evidence from early adopters of alternative approaches',
        'The psychology behind industry groupthink'
      ],
      dataPoints: competitorInsights.slice(0, 3).map(i => i.title),
      callToAction: 'Challenge your assumptions. Question the "obvious" answers.',
      targetAudience: targetCustomer,
      linkedInPost: this.generateLinkedInThoughtPost(title, hook, mainArgument, businessName),
      twitterThread: this.generateTwitterThread(title, hook, mainArgument),
      blogOutline: this.generateBlogOutline(title, 'contrarian_take'),
      emailSubject: `Contrarian Take: What ${industry} Gets Wrong`,
      confidence: competitorInsights.length > 0 ? 80 : 65,
      generatedAt: new Date()
    };
  }

  private generateFuturePredictionAngle(
    insights: InsightCard[],
    industry: string,
    businessName: string,
    targetCustomer: string
  ): ThoughtLeadershipAngle {
    const futureYear = new Date().getFullYear() + 3;
    const title = `${industry} in ${futureYear}: 5 Predictions That Will Shape Your Strategy`;
    const hook = `The future isn't as far away as you think. Are you prepared?`;

    const mainArgument = `Based on current trajectories and emerging signals, we've identified five developments that will fundamentally reshape ${industry} within the next 3 years.`;

    return {
      id: `tl-prediction-${Date.now()}`,
      type: 'future_prediction',
      title,
      hook,
      mainArgument,
      supportingPoints: [
        'Prediction 1: Technology-driven transformation',
        'Prediction 2: Customer expectation evolution',
        'Prediction 3: Competitive landscape reshuffling',
        'Prediction 4: Regulatory and compliance shifts',
        'Prediction 5: Talent and skill requirements'
      ],
      dataPoints: insights.slice(0, 3).map(i => i.title),
      callToAction: `Start building your ${futureYear} strategy today.`,
      targetAudience: targetCustomer,
      linkedInPost: this.generateLinkedInThoughtPost(title, hook, mainArgument, businessName),
      twitterThread: this.generateTwitterThread(title, hook, mainArgument),
      blogOutline: this.generateBlogOutline(title, 'future_prediction'),
      emailSubject: `${industry} ${futureYear}: What You Need to Know Now`,
      confidence: 75,
      generatedAt: new Date()
    };
  }

  private generateBestPracticeAngle(
    insights: InsightCard[],
    industry: string,
    businessName: string,
    targetCustomer: string
  ): ThoughtLeadershipAngle {
    const successInsights = insights.filter(i =>
      i.type === 'customer' || /success|achieve|result|improve|best/i.test(i.title)
    );

    const title = `The ${industry} Playbook: Proven Strategies from High-Performing Organizations`;
    const hook = `What separates the top 10% from everyone else? We analyzed the data.`;

    const mainArgument = `After studying successful ${industry} organizations, we've identified the key differentiators that consistently drive superior results.`;

    return {
      id: `tl-bestpractice-${Date.now()}`,
      type: 'best_practice',
      title,
      hook,
      mainArgument,
      supportingPoints: [
        'Strategic alignment and focus',
        'Customer-centric operations',
        'Technology leverage and integration',
        'Talent development and retention',
        'Measurement and continuous improvement'
      ],
      dataPoints: successInsights.slice(0, 3).map(i => i.title),
      callToAction: 'Audit your organization against these best practices today.',
      targetAudience: targetCustomer,
      linkedInPost: this.generateLinkedInThoughtPost(title, hook, mainArgument, businessName),
      twitterThread: this.generateTwitterThread(title, hook, mainArgument),
      blogOutline: this.generateBlogOutline(title, 'best_practice'),
      emailSubject: `Best Practices: How Top ${industry} Organizations Win`,
      confidence: successInsights.length > 0 ? 85 : 70,
      generatedAt: new Date()
    };
  }

  private generateCompetitiveLandscapeAngle(
    insights: InsightCard[],
    industry: string,
    businessName: string,
    targetCustomer: string
  ): ThoughtLeadershipAngle {
    const competitorInsights = insights.filter(i =>
      i.type === 'competitor' || /competitor|market|alternative|switch|compare/i.test(i.title)
    );

    const title = `${industry} Competitive Analysis: Understanding Your Market Position`;
    const hook = `Know your competition—and more importantly, know what makes you different.`;

    const mainArgument = `The ${industry} competitive landscape is evolving rapidly. Understanding where you stand—and where opportunities exist—is critical for strategic planning.`;

    return {
      id: `tl-competitive-${Date.now()}`,
      type: 'competitive_landscape',
      title,
      hook,
      mainArgument,
      supportingPoints: [
        'Market positioning overview',
        'Key differentiators analysis',
        'Emerging competitors and disruptors',
        'Gap analysis and opportunities',
        'Strategic recommendations'
      ],
      dataPoints: competitorInsights.slice(0, 3).map(i => i.title),
      callToAction: 'Conduct a competitive analysis for your specific market segment.',
      targetAudience: targetCustomer,
      linkedInPost: this.generateLinkedInThoughtPost(title, hook, mainArgument, businessName),
      twitterThread: this.generateTwitterThread(title, hook, mainArgument),
      blogOutline: this.generateBlogOutline(title, 'competitive_landscape'),
      emailSubject: `Competitive Intel: ${industry} Market Analysis`,
      confidence: competitorInsights.length > 0 ? 80 : 65,
      generatedAt: new Date()
    };
  }

  private generateLinkedInThoughtPost(
    title: string,
    hook: string,
    mainArgument: string,
    businessName: string
  ): string {
    return `${hook}

${mainArgument}

Here's what this means for your organization:

→ Adapt your strategy before the market forces you to
→ Invest in capabilities that will matter tomorrow
→ Build relationships and partnerships proactively

The organizations that thrive will be those that see around corners.

What trends are you watching most closely?

#ThoughtLeadership #Strategy #BusinessInsights`;
  }

  private generateTwitterThread(
    title: string,
    hook: string,
    mainArgument: string
  ): string[] {
    return [
      `🧵 ${hook}\n\nThread on ${title.toLowerCase()}:`,
      `1/ ${mainArgument.substring(0, 250)}...`,
      `2/ The first major shift: Customers expect more than ever before. Speed, personalization, and seamless experiences are table stakes.`,
      `3/ The second shift: Technology is no longer optional. It's the foundation for competitive advantage.`,
      `4/ The third shift: Talent wars are intensifying. Winning organizations invest in their people.`,
      `5/ What does this mean for you?\n\n→ Audit your current position\n→ Identify gaps\n→ Act decisively\n\nThe best time to start was yesterday. The second best time is now.`,
      `6/ If this was valuable, follow for more insights.\n\nRetweet the first tweet to help others. 🙏`
    ];
  }

  private generateBlogOutline(
    title: string,
    type: ThoughtLeadershipType
  ): string[] {
    const baseOutline = [
      `# ${title}`,
      '',
      '## Executive Summary',
      '- Key takeaways',
      '- Why this matters now',
      '',
      '## Introduction',
      '- Set the context',
      '- State the thesis',
      ''
    ];

    const typeSpecificSections: Record<ThoughtLeadershipType, string[]> = {
      'industry_trend': [
        '## The Current Landscape',
        '## Key Trends Reshaping the Industry',
        '## What the Data Reveals',
        '## Implications for Organizations'
      ],
      'contrarian_take': [
        '## The Conventional Wisdom',
        '## Why It\'s Wrong',
        '## A Better Approach',
        '## Evidence and Results'
      ],
      'future_prediction': [
        '## Where We Are Today',
        '## Signals of Change',
        '## Our Predictions',
        '## How to Prepare'
      ],
      'best_practice': [
        '## What Top Performers Do Differently',
        '## The Core Practices',
        '## Implementation Guide',
        '## Measuring Success'
      ],
      'competitive_landscape': [
        '## Market Overview',
        '## Key Players Analysis',
        '## Gaps and Opportunities',
        '## Strategic Positioning'
      ]
    };

    const conclusion = [
      '',
      '## Conclusion',
      '- Summarize key points',
      '- Call to action',
      '',
      '## About the Author',
      '## Additional Resources'
    ];

    return [...baseOutline, ...typeSpecificSections[type], ...conclusion];
  }

  /**
   * Fallback synthesis when AI unavailable
   */
  private fallbackSynthesis(insights: InsightCard[], context: DeepContext, options: ContentSynthesisOptions = {}): SynthesizedContent {
    const { humorLevel = 1 } = options;
    const types = insights.map(i => i.type);

    let title = '';
    let hook = '';
    let body: string[] = [];
    let cta = '';

    // Humor modifiers for fallback content
    const humorSuffixes = {
      0: '',
      1: '',
      2: ' (And yes, we checked twice.)',
      3: ' 🎯 (Spoiler: It\'s good news!)'
    };
    const humorSuffix = humorSuffixes[humorLevel as keyof typeof humorSuffixes] || '';

    // Generate based on insight combination
    if (types.includes('customer') && types.includes('opportunity')) {
      const customerInsight = insights.find(i => i.type === 'customer');
      title = `What ${context.business.profile.name} Customers Really Want: ${customerInsight?.title || 'Key Insights'}`;
      hook = `Your customers are telling you something important. Are you listening?`;
      body = insights.map(i => i.title);
      cta = 'Discover how we deliver on what you need';
    } else if (types.includes('local')) {
      title = `Right Now in ${context.business.profile.location?.city}: ${insights[0].title}`;
      hook = `Timing is everything. Here's why this matters to your business.`;
      body = insights.map(i => i.title);
      cta = 'Act now while this moment is fresh';
    } else {
      title = `${insights.length} Insights About ${context.business.profile.industry}`;
      hook = `We analyzed the data. Here's what matters.`;
      body = insights.map(i => i.title);
      cta = 'Learn more';
    }

    const provenance = this.buildProvenance(insights);
    const eqScore = 65; // Moderate fallback score

    return {
      title,
      hook,
      body,
      cta,
      provenance,
      eqScore
    };
  }
}

export const contentSynthesis = new ContentSynthesisService();
