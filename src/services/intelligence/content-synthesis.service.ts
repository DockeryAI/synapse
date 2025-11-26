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
