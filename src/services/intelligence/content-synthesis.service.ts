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

class ContentSynthesisService {

  /**
   * Synthesize breakthrough content from selected insights
   */
  async synthesizeContent(
    selectedInsights: InsightCard[],
    context: DeepContext
  ): Promise<SynthesizedContent> {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn('[ContentSynthesis] No Supabase config - using fallback');
      return this.fallbackSynthesis(selectedInsights, context);
    }

    try {
      console.log(`[ContentSynthesis] Synthesizing content from ${selectedInsights.length} insights`);

      // Build synthesis prompt
      const prompt = this.buildSynthesisPrompt(selectedInsights, context);

      // Call AI synthesis via Edge Function
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: 'openrouter',
          model: 'anthropic/claude-opus-4.1',
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
  private buildSynthesisPrompt(insights: InsightCard[], context: DeepContext): string {
    const insightTypes = insights.map(i => i.type);
    const insightTitles = insights.map(i => i.title);
    const insightSources = insights.flatMap(i => i.sources?.map(s => s.source) || []);

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

    return `You are a breakthrough content strategist combining multiple data sources to create specific, high-impact content angles.

BUSINESS CONTEXT:
Name: ${context.business.profile.name}
Industry: ${context.business.profile.industry}
Location: ${context.business.profile.location?.city}, ${context.business.profile.location?.state}

CONNECTION PATTERN: ${connectionPattern}

SELECTED INSIGHTS:
${insights.map((insight, i) => `
${i + 1}. [${insight.type.toUpperCase()}] ${insight.title}
   ${insight.description || ''}
   Sources: ${insight.sources?.map(s => s.source).join(', ') || 'Internal'}
   ${insight.sources?.[0]?.quote ? `Quote: "${insight.sources[0].quote}"` : ''}
`).join('\n')}

YOUR TASK:
Create a SPECIFIC, breakthrough content angle that connects these insights.

CRITICAL REQUIREMENTS:
1. SPECIFIC TITLE - Not generic "Unlock New Growth" but specific like:
   - "3 Things Storm Season Reveals About Your Coverage Gaps"
   - "Why Phoenix Collectors Are Switching Insurance Before May 15"
   - "The $50K Mistake Most Collectors Make With Coverage"

2. EMOTIONAL HOOK - Use psychological triggers:
   - Fear: "Stop wondering if..."
   - Curiosity: "What your agent won't tell you..."
   - Urgency: "Before storm season hits..."
   - Achievement: "Finally understand..."

3. REAL PROVENANCE - Reference actual sources:
   - "Based on 12 Google Reviews mentioning..."
   - "Weather alert shows..."
   - "0 of 10 competitors address..."

4. BREAKTHROUGH SCORE - If this is a 3-way connection, score 80-100. Otherwise 60-80.

OUTPUT FORMAT (JSON only, no markdown):
{
  "title": "Specific, curiosity-driven title with numbers/specifics",
  "hook": "Emotional opening line referencing real data",
  "body": [
    "First key point with evidence",
    "Second key point with evidence",
    "Third key point with evidence"
  ],
  "cta": "Clear call to action",
  "breakthroughScore": 85
}`;
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

  /**
   * Fallback synthesis when AI unavailable
   */
  private fallbackSynthesis(insights: InsightCard[], context: DeepContext): SynthesizedContent {
    const types = insights.map(i => i.type);
    const titles = insights.map(i => i.title);

    let title = '';
    let hook = '';
    let body: string[] = [];
    let cta = '';

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
