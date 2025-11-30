/**
 * Gap Content Generator Service
 *
 * Phase 4 - Gap Tab 2.0
 * Generates competitive content from gaps:
 * - Attack Ads: Direct comparative ads highlighting competitor weaknesses
 * - Comparison Posts: Side-by-side comparison content
 * - Switching Guides: Content to help customers switch from competitors
 *
 * Created: 2025-11-28
 */

import type {
  CompetitorGap,
  CompetitorProfile,
  SegmentType,
  BusinessType
} from '@/types/competitor-intelligence.types';
import type { DeepContext } from '@/types/synapse/deepContext.types';

// ============================================================================
// TYPES
// ============================================================================

export type GapContentType = 'attack-ad' | 'comparison-post' | 'switching-guide';

export interface GapContentRequest {
  gap: CompetitorGap;
  contentType: GapContentType;
  competitors: CompetitorProfile[];
  deepContext: DeepContext | null;
  segmentType?: SegmentType;
  businessType?: BusinessType;
  platform?: 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'blog';
  tone?: 'professional' | 'casual' | 'bold' | 'empathetic';
}

export interface GapContentResult {
  contentType: GapContentType;
  headline: string;
  body: string;
  callToAction: string;
  hashtags?: string[];
  imagePrompt?: string;
  platform: string;
  wordCount: number;
  readingTime: string;
  gapId: string;
  competitorNames: string[];
  confidence: number;
}

export interface ContentTemplate {
  type: GapContentType;
  label: string;
  description: string;
  icon: string;
  promptTemplate: string;
  platforms: string[];
  estimatedTime: string;
}

// ============================================================================
// CONTENT TEMPLATES
// ============================================================================

const CONTENT_TEMPLATES: ContentTemplate[] = [
  {
    type: 'attack-ad',
    label: 'Attack Ad',
    description: 'Direct comparative ad highlighting the competitor gap',
    icon: 'target',
    platforms: ['facebook', 'instagram', 'linkedin'],
    estimatedTime: '30 seconds',
    promptTemplate: `You are an expert copywriter creating a competitive attack ad.

## Gap Intelligence
**The Void (Competitor Weakness):** {{theVoid}}
**The Demand (Customer Need):** {{theDemand}}
**Your Angle (Positioning):** {{yourAngle}}
**Competitors Affected:** {{competitors}}
**Gap Type:** {{gapType}}

## Brand Context
**Brand Name:** {{brandName}}
**UVP:** {{uvp}}
**Target Audience:** {{targetAudience}}
**Industry:** {{industry}}

## Platform: {{platform}}
## Tone: {{tone}}

## Task
Create a punchy, competitive ad that:
1. Opens with a pattern interrupt highlighting the competitor weakness (The Void)
2. Connects to the customer pain (The Demand)
3. Positions your brand as the solution (Your Angle)
4. Includes a clear call-to-action

## Rules
- DO NOT name competitors directly - use phrases like "other solutions" or "the competition"
- Focus on what you DO offer, not just what they lack
- Keep it punchy and scannable
- Maximum 150 words for social, 250 for blog
- Match the platform conventions (hashtags for IG, professional for LinkedIn)

## Output Format (JSON)
{
  "headline": "Attention-grabbing headline (max 10 words)",
  "body": "Main ad copy",
  "callToAction": "CTA button text",
  "hashtags": ["relevant", "hashtags"],
  "imagePrompt": "Suggested image concept for visual"
}`
  },
  {
    type: 'comparison-post',
    label: 'Comparison Post',
    description: 'Side-by-side comparison showing your advantages',
    icon: 'columns',
    platforms: ['linkedin', 'blog', 'facebook'],
    estimatedTime: '2 minutes',
    promptTemplate: `You are an expert content strategist creating a comparison post.

## Gap Intelligence
**The Void (Competitor Weakness):** {{theVoid}}
**The Demand (Customer Need):** {{theDemand}}
**Your Angle (Positioning):** {{yourAngle}}
**Competitors Affected:** {{competitors}}
**Gap Type:** {{gapType}}

## Brand Context
**Brand Name:** {{brandName}}
**UVP:** {{uvp}}
**Key Benefits:** {{keyBenefits}}
**Target Audience:** {{targetAudience}}
**Industry:** {{industry}}

## Platform: {{platform}}
## Tone: {{tone}}

## Task
Create an educational comparison post that:
1. Frames the problem customers face when evaluating options
2. Provides objective-sounding criteria based on the gap
3. Highlights your differentiation without being salesy
4. Helps readers make an informed decision

## Rules
- Use a fair, educational tone (not attack-y)
- Include a checklist or comparison table format
- Reference "typical solutions" not specific competitors
- End with a soft CTA (learn more, see how we're different)
- 200-400 words depending on platform

## Output Format (JSON)
{
  "headline": "Educational headline positioning the comparison",
  "body": "Comparison content with table/checklist format",
  "callToAction": "Soft CTA text",
  "hashtags": ["relevant", "hashtags"],
  "imagePrompt": "Suggested comparison visual concept"
}`
  },
  {
    type: 'switching-guide',
    label: 'Switching Guide',
    description: 'Help customers switch from competitor to you',
    icon: 'arrow-right-circle',
    platforms: ['blog', 'linkedin', 'email'],
    estimatedTime: '5 minutes',
    promptTemplate: `You are an expert content strategist creating a switching guide.

## Gap Intelligence
**The Void (Competitor Weakness):** {{theVoid}}
**The Demand (Customer Need):** {{theDemand}}
**Your Angle (Positioning):** {{yourAngle}}
**Competitors Affected:** {{competitors}}
**Gap Type:** {{gapType}}
**Source Quotes:** {{sourceQuotes}}

## Brand Context
**Brand Name:** {{brandName}}
**UVP:** {{uvp}}
**Key Benefits:** {{keyBenefits}}
**Target Audience:** {{targetAudience}}
**Industry:** {{industry}}

## Platform: {{platform}}
## Tone: {{tone}}

## Task
Create a switching guide that:
1. Acknowledges the pain points driving the switch (empathy)
2. Validates their decision to explore alternatives
3. Provides a clear roadmap for switching
4. Addresses common concerns about switching
5. Highlights what they gain by switching to you

## Rules
- Lead with empathy, not attack
- Make switching feel low-risk and easy
- Include specific steps they can take
- Address the gap directly as a key switching reason
- 300-500 words

## Output Format (JSON)
{
  "headline": "Empathetic headline acknowledging the switch",
  "body": "Guide content with clear sections",
  "callToAction": "Clear next step CTA",
  "hashtags": ["relevant", "hashtags"],
  "imagePrompt": "Suggested visual showing transformation/journey"
}`
  }
];

// ============================================================================
// GAP CONTENT GENERATOR CLASS
// ============================================================================

class GapContentGeneratorService {
  /**
   * Get available content templates
   */
  getTemplates(): ContentTemplate[] {
    return CONTENT_TEMPLATES;
  }

  /**
   * Get a specific template by type
   */
  getTemplate(type: GapContentType): ContentTemplate | undefined {
    return CONTENT_TEMPLATES.find(t => t.type === type);
  }

  /**
   * Build the prompt for content generation
   */
  buildPrompt(request: GapContentRequest): string {
    const template = this.getTemplate(request.contentType);
    if (!template) {
      throw new Error(`Unknown content type: ${request.contentType}`);
    }

    const { gap, competitors, deepContext } = request;

    // Extract brand context from deepContext
    const brandName = deepContext?.business?.profile?.name || 'Your Brand';
    const uvp = deepContext?.business?.uvp?.uniqueSolution || '';
    const keyBenefits = deepContext?.business?.uvp?.keyBenefit || '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const targetAudience = (deepContext?.business?.profile as any)?.targetAudience || '';
    const industry = deepContext?.business?.profile?.industry || '';

    // Get competitor names
    const competitorNames = gap.competitor_names.length > 0
      ? gap.competitor_names.join(', ')
      : competitors.filter(c => gap.competitor_ids.includes(c.id)).map(c => c.name).join(', ');

    // Get source quotes if available
    const sourceQuotes = gap.source_quotes
      ?.map(q => `"${q.quote}" - ${q.source}`)
      .join('\n') || '';

    // Build prompt from template
    let prompt = template.promptTemplate
      .replace('{{theVoid}}', gap.the_void || '')
      .replace('{{theDemand}}', gap.the_demand || '')
      .replace('{{yourAngle}}', gap.your_angle || '')
      .replace('{{competitors}}', competitorNames)
      .replace('{{gapType}}', gap.gap_type || 'general')
      .replace('{{brandName}}', brandName)
      .replace('{{uvp}}', uvp)
      .replace('{{keyBenefits}}', keyBenefits)
      .replace('{{targetAudience}}', targetAudience)
      .replace('{{industry}}', industry)
      .replace('{{platform}}', request.platform || 'linkedin')
      .replace('{{tone}}', request.tone || 'professional')
      .replace('{{sourceQuotes}}', sourceQuotes);

    return prompt;
  }

  /**
   * Generate content from a gap using AI
   */
  async generateContent(request: GapContentRequest): Promise<GapContentResult> {
    const prompt = this.buildPrompt(request);
    const template = this.getTemplate(request.contentType)!;

    try {
      // Dynamic import to avoid circular dependencies
      const { chat } = await import('@/lib/openrouter');

      const messages = [
        {
          role: 'system' as const,
          content: 'You are a world-class copywriter specializing in competitive marketing content. Output valid JSON only.'
        },
        {
          role: 'user' as const,
          content: prompt
        }
      ];

      const response = await chat(messages, {
        model: 'anthropic/claude-sonnet-4',
        temperature: 0.7,
        maxTokens: 2000
      });

      // Parse the JSON response - chat() returns string directly
      const content = response || '';

      // Extract JSON from response (handle potential markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response as JSON');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Calculate word count and reading time
      const fullText = `${parsed.headline} ${parsed.body} ${parsed.callToAction}`;
      const wordCount = fullText.split(/\s+/).length;
      const readingTime = `${Math.ceil(wordCount / 200)} min read`;

      return {
        contentType: request.contentType,
        headline: parsed.headline || '',
        body: parsed.body || '',
        callToAction: parsed.callToAction || '',
        hashtags: parsed.hashtags || [],
        imagePrompt: parsed.imagePrompt || '',
        platform: request.platform || 'linkedin',
        wordCount,
        readingTime,
        gapId: request.gap.id,
        competitorNames: request.gap.competitor_names,
        confidence: request.gap.confidence_score
      };

    } catch (error) {
      console.error('[GapContentGenerator] Generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate all content types for a gap
   */
  async generateAllContent(
    gap: CompetitorGap,
    competitors: CompetitorProfile[],
    deepContext: DeepContext | null,
    options: Partial<GapContentRequest> = {}
  ): Promise<GapContentResult[]> {
    const results: GapContentResult[] = [];

    for (const template of CONTENT_TEMPLATES) {
      try {
        const result = await this.generateContent({
          gap,
          contentType: template.type,
          competitors,
          deepContext,
          platform: template.platforms[0] as GapContentRequest['platform'],
          ...options
        });
        results.push(result);
      } catch (error) {
        console.error(`[GapContentGenerator] Failed to generate ${template.type}:`, error);
      }
    }

    return results;
  }

  /**
   * Get recommended content types for a gap based on its characteristics
   */
  getRecommendedContentTypes(gap: CompetitorGap): GapContentType[] {
    const recommendations: GapContentType[] = [];

    // Always recommend attack ad for high-confidence gaps
    if (gap.confidence_score >= 0.7) {
      recommendations.push('attack-ad');
    }

    // Recommend comparison for feature/pricing gaps
    if (gap.gap_type === 'feature-gap' || gap.gap_type === 'pricing-gap') {
      recommendations.push('comparison-post');
    }

    // Recommend switching guide for service/support gaps
    if (gap.gap_type === 'service-gap' || gap.gap_type === 'support-gap') {
      recommendations.push('switching-guide');
    }

    // Ensure at least one recommendation
    if (recommendations.length === 0) {
      recommendations.push('comparison-post');
    }

    return recommendations;
  }
}

// Singleton export
export const gapContentGenerator = new GapContentGeneratorService();

export default gapContentGenerator;
