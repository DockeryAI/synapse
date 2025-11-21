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
   */
  private async generateVariants(
    baseTitle: string,
    baseHook: string,
    context: DeepContext
  ): Promise<ContentVariant[]> {
    const variants: ContentVariant[] = [];

    // Define psychological trigger transformations
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

    // Generate variants with different psychological triggers
    for (const trigger of triggers) {
      // Extract the core message from base title (remove existing prefixes)
      const coreTitle = baseTitle.replace(/^(What|Why|How|Stop|Before|Finally|Get|Proven)[^:]*:\s*/i, '');
      const coreHook = baseHook.replace(/^[^.!?]+[.!?]\s*/i, '');

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
   * Calculate EQ score using pattern matching
   */
  private async calculateEQScore(title: string, hook: string): Promise<number> {
    const text = `${title} ${hook}`.toLowerCase();

    // Psychological trigger patterns
    const triggers = {
      curiosity: [/why\s/i, /what\s/i, /how\s/i, /\d+\s+things/i, /reveal/i, /secret/i, /won't tell you/i],
      fear: [/stop\s/i, /avoid/i, /mistake/i, /gap/i, /missing/i, /risk/i, /lose/i],
      urgency: [/before\s/i, /now\s/i, /deadline/i, /season/i, /limited/i],
      achievement: [/finally/i, /master/i, /unlock/i, /discover/i],
      desire: [/want/i, /need/i, /wish/i],
      trust: [/proven/i, /verified/i, /based on/i, /\d+\s+(reviews|customers)/i],
      belonging: [/everyone/i, /people like you/i, /join/i]
    };

    let score = 50; // Base score

    // Check each trigger category
    for (const [category, patterns] of Object.entries(triggers)) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          score += 8;
          break; // Only count once per category
        }
      }
    }

    // Bonus for specificity
    if (/\d+/.test(title)) score += 10; // Numbers in title
    if (text.length > 50) score += 5; // Detailed content

    return Math.min(100, Math.max(0, score));
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
