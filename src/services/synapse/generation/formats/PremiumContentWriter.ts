/**
 * PREMIUM CONTENT WRITER
 *
 * High-quality content generation using advanced copywriting frameworks
 * and storytelling techniques for engaging, professional content.
 */

import { chat } from '@/lib/openrouter';
import type { SynapseInsight } from '@/types/synapse/synapse.types';
import type { BusinessProfile } from '@/types/synapseContent.types';

export interface PremiumContent {
  headline: string;
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
}

export class PremiumContentWriter {
  /**
   * Generate high-quality content using Claude Opus for superior writing
   */
  async generatePremiumContent(
    insight: SynapseInsight,
    business: BusinessProfile,
    platform: 'linkedin' | 'facebook' | 'instagram' | 'twitter'
  ): Promise<PremiumContent> {
    const prompt = this.buildPremiumPrompt(insight, business, platform);

    try {
      // Use Sonnet 4.5 for fast, high-quality writing
      const response = await chat([
        {
          role: 'user',
          content: prompt
        }
      ], {
        model: 'anthropic/claude-sonnet-4.5',
        temperature: 0.7,
        maxTokens: 1500
      });

      return this.parseResponse(response);
    } catch (error) {
      console.error('[PremiumContentWriter] Generation failed:', error);
      // Fallback to basic content if premium fails
      return this.generateFallbackContent(insight, business);
    }
  }

  private buildPremiumPrompt(
    insight: SynapseInsight,
    business: BusinessProfile,
    platform: string
  ): string {
    const platformConfigs = {
      linkedin: {
        tone: 'professional yet personable',
        length: '1200-1500 characters',
        style: 'thought leadership',
        hashtagCount: 5
      },
      facebook: {
        tone: 'friendly and conversational',
        length: '800-1000 characters',
        style: 'storytelling',
        hashtagCount: 3
      },
      instagram: {
        tone: 'inspiring and visual',
        length: '500-800 characters',
        style: 'emotional storytelling',
        hashtagCount: 10
      },
      twitter: {
        tone: 'punchy and provocative',
        length: '250-280 characters',
        style: 'hook-driven',
        hashtagCount: 2
      }
    };

    const platformConfig = platformConfigs[platform as keyof typeof platformConfigs] || platformConfigs.linkedin;

    return `You are a world-class copywriter specializing in ${platform} content for ${business.industry} businesses.

BUSINESS CONTEXT:
- Business: ${business.name}
- Industry: ${business.industry}

BREAKTHROUGH INSIGHT TO LEVERAGE:
- Core Insight: ${insight.insight}
- Why It Matters: ${insight.whyProfound}
- Content Angle: ${insight.contentAngle || insight.insight}
- Evidence: ${insight.evidence?.join('; ')}
- Timing: ${insight.whyNow}

WRITING REQUIREMENTS:
- Platform: ${platform}
- Tone: ${platformConfig.tone}
- Length: ${platformConfig.length}
- Style: ${platformConfig.style}

Create compelling content using the StoryBrand framework:

1. HEADLINE (one powerful line that stops scrolling)
   - Hook attention immediately
   - Make them curious
   - Promise value

2. HOOK (2-3 sentences that create emotional connection)
   - Identify the problem
   - Empathize with their pain
   - Hint at the solution

3. BODY (flowing narrative, NOT bullet points)
   - Tell a mini-story or paint a picture
   - Use specific examples and scenarios
   - Build desire for the solution
   - Include social proof if relevant
   - Create urgency without being pushy
   - Write in active voice
   - Use power words and emotional triggers
   - Include transitions between ideas

4. CTA (clear, specific action)
   - Tell them exactly what to do
   - Make it easy and appealing
   - Create FOMO if appropriate

5. HASHTAGS (${platformConfig.hashtagCount} relevant tags)
   - Mix branded, industry, and trending

CRITICAL RULES:
- Write flowing paragraphs, NOT disconnected bullet points
- Use storytelling and emotion, not just facts
- Connect ideas with smooth transitions
- Be specific, not generic
- Show, don't tell
- Use "you" to speak directly to the reader
- Include sensory details when relevant

CRITICAL: Respond with ONLY valid JSON. No preamble, no explanation, no markdown. Just the JSON object.

{
  "headline": "attention-grabbing headline",
  "hook": "emotional hook that creates connection",
  "body": "compelling narrative body (multiple paragraphs)",
  "cta": "specific call to action",
  "hashtags": ["tag1", "tag2", ...]
}`;
  }

  private parseResponse(response: string): PremiumContent {
    try {
      let jsonStr = response.trim();

      // Try 1: Remove markdown code blocks
      if (jsonStr.includes('```json')) {
        const match = jsonStr.match(/```json\s*([\s\S]*?)\s*```/);
        if (match) {
          jsonStr = match[1].trim();
        }
      } else if (jsonStr.includes('```')) {
        const match = jsonStr.match(/```\s*([\s\S]*?)\s*```/);
        if (match) {
          jsonStr = match[1].trim();
        }
      }

      // Try 2: Extract JSON object even if there's text before/after
      if (!jsonStr.startsWith('{')) {
        const match = jsonStr.match(/\{[\s\S]*\}/);
        if (match) {
          jsonStr = match[0];
        }
      }

      // Try 3: Fix common JSON errors before parsing
      // This is a more robust approach to fix JSON with embedded newlines
      try {
        // First attempt: direct parse
        const json = JSON.parse(jsonStr);
        return {
          headline: json.headline || '',
          hook: json.hook || '',
          body: json.body || '',
          cta: json.cta || '',
          hashtags: json.hashtags || []
        };
      } catch (firstError) {
        // Second attempt: Fix newlines inside string values
        // Match each field and escape newlines within it
        const fixedJson = jsonStr.replace(
          /"(headline|hook|body|cta)":\s*"((?:[^"\\]|\\.)*)"/g,
          (match, key, value) => {
            // Escape unescaped newlines
            const escapedValue = value
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r')
              .replace(/\t/g, '\\t');
            return `"${key}": "${escapedValue}"`;
          }
        );

        const json = JSON.parse(fixedJson);
        return {
          headline: json.headline || '',
          hook: json.hook || '',
          body: json.body || '',
          cta: json.cta || '',
          hashtags: json.hashtags || []
        };
      }
    } catch (error) {
      console.error('[PremiumContentWriter] Failed to parse response:', error);
      console.log('[PremiumContentWriter] Raw response:', response.substring(0, 500));

      // Try to return partial data if some fields are present
      try {
        // Sometimes the response is truncated - try to extract what we can
        const headlineMatch = response.match(/"headline":\s*"([^"]+)"/);
        const hookMatch = response.match(/"hook":\s*"([^"]+)"/);
        const bodyMatch = response.match(/"body":\s*"([^"]+)"/);
        const ctaMatch = response.match(/"cta":\s*"([^"]+)"/);

        if (headlineMatch || hookMatch) {
          console.warn('[PremiumContentWriter] Using partial response data');
          return {
            headline: headlineMatch?.[1] || 'Content ready',
            hook: hookMatch?.[1] || '',
            body: bodyMatch?.[1] || '',
            cta: ctaMatch?.[1] || 'Learn more',
            hashtags: []
          };
        }
      } catch (recoveryError) {
        // Ignore recovery errors
      }

      throw error;
    }
  }

  private generateFallbackContent(
    insight: SynapseInsight,
    business: BusinessProfile
  ): PremiumContent {
    // Basic fallback if API fails
    return {
      headline: insight.contentAngle || insight.insight,
      hook: insight.whyProfound || 'Discover what matters most.',
      body: `${insight.evidence?.join('. ')}. ${insight.whyNow}`,
      cta: `Learn more at ${business.name}.`,
      hashtags: business.industry.toLowerCase().split(' ').filter(w => w.length > 3)
    };
  }

  /**
   * Enhance existing content with better writing
   */
  async enhanceContent(
    existingContent: {
      headline: string;
      hook: string;
      body: string;
      cta: string;
    },
    business: BusinessProfile,
    platform: string
  ): Promise<PremiumContent> {
    const prompt = `You are a world-class copy editor. Rewrite this content to be more engaging and professional.

CURRENT CONTENT:
Headline: ${existingContent.headline}
Hook: ${existingContent.hook}
Body: ${existingContent.body}
CTA: ${existingContent.cta}

REQUIREMENTS:
- Platform: ${platform}
- Business: ${business.name} (${business.industry})
- Transform choppy bullet points into flowing narrative
- Add emotional resonance and storytelling
- Use active voice and power words
- Create smooth transitions
- Make it conversational yet professional

Rewrite this content to be compelling and engaging. Focus on storytelling, emotion, and clear value.

CRITICAL: Respond with ONLY valid JSON. No preamble, no explanation, no markdown. Just the JSON object.

{
  "headline": "improved headline",
  "hook": "improved hook",
  "body": "improved body with flowing narrative",
  "cta": "improved cta",
  "hashtags": ["relevant", "tags"]
}`;

    try {
      const response = await chat([
        {
          role: 'user',
          content: prompt
        }
      ], {
        model: 'anthropic/claude-sonnet-4.5',
        temperature: 0.7,
        maxTokens: 1000
      });

      return this.parseResponse(response);
    } catch (error) {
      console.error('[PremiumContentWriter] Enhancement failed:', error);
      return {
        ...existingContent,
        hashtags: []
      };
    }
  }
}