/**
 * Local Content Generator Service
 *
 * Generates content from local insights (events, news, community happenings).
 * Bridges Local 2.0 with the content generation system.
 *
 * Created: 2025-11-30
 */

import type { CompleteUVP } from '@/types/uvp-flow.types';
import type { LocalInsight, LocalInsightType, GeneratedLocalContent } from './types';
import { chat } from '@/lib/openrouter';
import type { OpenRouterMessage } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export interface LocalContentRequest {
  insight: LocalInsight;
  uvp: CompleteUVP;
  platform: 'linkedin' | 'instagram' | 'facebook' | 'twitter' | 'google_business';
  tone?: 'celebratory' | 'supportive' | 'promotional' | 'informative';
}

export interface LocalContentResult {
  headline: string;
  content: string;
  callToAction: string;
  hashtags: string[];
  contentType: 'post' | 'story' | 'event_share';
  estimatedEngagement: 'low' | 'medium' | 'high';
  platform: string;
  sourceInsight: {
    title: string;
    type: LocalInsightType;
    location: string;
  };
  metadata: {
    generatedAt: string;
    angleUsed: string;
    tokensUsed?: number;
  };
}

// ============================================================================
// PLATFORM CONFIGS
// ============================================================================

const PLATFORM_CONFIGS: Record<string, { maxLength: number; hashtagCount: number; style: string }> = {
  linkedin: {
    maxLength: 2000,
    hashtagCount: 5,
    style: 'professional, community-oriented, authentic local business voice'
  },
  instagram: {
    maxLength: 2200,
    hashtagCount: 15,
    style: 'visual-first, engaging, community celebration, emoji-friendly'
  },
  facebook: {
    maxLength: 1500,
    hashtagCount: 3,
    style: 'conversational, community-focused, neighborhood-friendly'
  },
  twitter: {
    maxLength: 280,
    hashtagCount: 2,
    style: 'punchy, local pride, quick community update'
  },
  google_business: {
    maxLength: 1500,
    hashtagCount: 0,
    style: 'local SEO friendly, informative, includes location context'
  }
};

// ============================================================================
// TYPE-SPECIFIC TEMPLATES
// ============================================================================

const TYPE_PROMPTS: Record<LocalInsightType, string> = {
  event: `Focus on community participation and excitement. Options:
- Announce your involvement (booth, sponsorship, presence)
- Offer event-specific promotions ("Show your festival wristband for 15% off")
- Build anticipation with countdown-style content
- Encourage customers to find you at the event`,

  news: `Focus on community impact and local pride. Options:
- Share the positive development with your audience
- Connect it to your business's community commitment
- Express genuine excitement for the neighborhood
- Offer relevant tie-in if appropriate`,

  community: `Focus on neighborhood connection and belonging. Options:
- Celebrate being part of this community
- Highlight shared values with neighbors
- Share local stories that resonate
- Position as a community pillar`,

  school: `Focus on supporting students, teachers, and families. Options:
- Offer student/teacher appreciation discounts
- Celebrate local school achievements
- Support back-to-school or graduation
- Partner messaging with school activities`,

  sports: `Focus on team spirit and game-day energy. Options:
- Show support for local teams
- Offer game-day specials or watch party info
- Celebrate local athletic achievements
- Connect team pride to community pride`,

  charity: `Focus on giving back and community impact. Options:
- Announce partnership or sponsorship
- Share donation matching or volunteer involvement
- Highlight the cause and its local impact
- Invite customers to participate alongside you`
};

// ============================================================================
// CONTENT GENERATION
// ============================================================================

/**
 * Generate content for a local insight
 */
export async function generateLocalContent(
  request: LocalContentRequest
): Promise<LocalContentResult> {
  const { insight, uvp, platform, tone = 'celebratory' } = request;

  const platformConfig = PLATFORM_CONFIGS[platform] || PLATFORM_CONFIGS.facebook;
  const typePrompt = TYPE_PROMPTS[insight.type];
  const selectedAngle = insight.contentAngles[0] || 'Community connection';

  // Build the prompt
  const systemPrompt = `You are an expert local business content creator specializing in ${platform} content.
You create authentic, community-focused content that connects businesses with their local audience.
Your content is ${platformConfig.style}.
Maximum length: ${platformConfig.maxLength} characters.
Tone: ${tone}`;

  const userPrompt = `Create a ${platform} post about this local happening for the following business:

## LOCAL INSIGHT
Title: ${insight.title}
Description: ${insight.description}
Type: ${insight.type}
Location: ${insight.location}
Timing: ${insight.timing.displayDate || 'Upcoming'}
${insight.timing.isUpcoming ? `Days Until: ${insight.timing.daysUntil}` : ''}
Content Angles Available: ${insight.contentAngles.join(', ')}

## TYPE-SPECIFIC GUIDANCE
${typePrompt}

## BUSINESS CONTEXT
Value Proposition: ${uvp.valuePropositionStatement || ''}
Target Customer: ${uvp.targetCustomer?.statement || ''}
Key Differentiator: ${uvp.uniqueSolution?.statement || ''}
Industry: ${uvp.targetCustomer?.industry || 'local business'}

## REQUIREMENTS
- Tone: ${tone}
- Platform: ${platform}
- Max Length: ${platformConfig.maxLength} characters
- Include ${platformConfig.hashtagCount} relevant hashtags (mix of local + topic hashtags)
- Include a clear call-to-action
- Sound like a real local business owner, not a marketer
- Connect the local happening to your business authentically
- Do NOT over-commercialize - community first, business second
- Include location context when relevant

## OUTPUT FORMAT
Return a JSON object with:
{
  "headline": "The hook/first line that grabs attention",
  "content": "The full post content",
  "callToAction": "The CTA at the end",
  "hashtags": ["hashtag1", "hashtag2", ...],
  "contentType": "post" | "story" | "event_share",
  "estimatedEngagement": "low" | "medium" | "high"
}`;

  const messages: OpenRouterMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  try {
    const response = await chat(messages, {
      model: 'anthropic/claude-3-5-sonnet',
      temperature: 0.7,
      max_tokens: 1500
    });

    // Parse the JSON response
    const content = response.content || response;
    let parsed: any;

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseErr) {
      // Fallback: create structured content from raw text
      parsed = {
        headline: insight.contentAngles[0] || insight.title,
        content: content.substring(0, platformConfig.maxLength),
        callToAction: 'Stop by and say hello!',
        hashtags: generateLocalHashtags(insight, platformConfig.hashtagCount),
        contentType: 'post',
        estimatedEngagement: 'medium'
      };
    }

    return {
      headline: parsed.headline || '',
      content: parsed.content || '',
      callToAction: parsed.callToAction || '',
      hashtags: parsed.hashtags || [],
      contentType: parsed.contentType || 'post',
      estimatedEngagement: parsed.estimatedEngagement || 'medium',
      platform,
      sourceInsight: {
        title: insight.title,
        type: insight.type,
        location: insight.location
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        angleUsed: selectedAngle,
        tokensUsed: response.usage?.total_tokens
      }
    };

  } catch (err) {
    console.error('[LocalContentGenerator] Generation failed:', err);
    throw err;
  }
}

/**
 * Generate fallback hashtags for local content
 */
function generateLocalHashtags(insight: LocalInsight, count: number): string[] {
  const hashtags: string[] = [];

  // Location hashtag
  const city = insight.location.split(',')[0]?.trim().replace(/\s+/g, '');
  if (city) {
    hashtags.push(city);
  }

  // Type-specific hashtags
  const typeHashtags: Record<LocalInsightType, string[]> = {
    event: ['LocalEvents', 'CommunityEvent', 'WeekendPlans'],
    news: ['LocalNews', 'CommunityUpdate', 'Neighborhood'],
    community: ['Community', 'LocalBusiness', 'ShopLocal'],
    school: ['BackToSchool', 'LocalSchools', 'Education'],
    sports: ['LocalSports', 'GameDay', 'TeamSpirit'],
    charity: ['GiveBack', 'LocalCharity', 'Community']
  };

  hashtags.push(...(typeHashtags[insight.type] || ['Local', 'Community']));

  return hashtags.slice(0, count);
}

/**
 * Quick preview without AI call
 */
export function generateQuickPreview(insight: LocalInsight): string {
  const emoji = {
    event: '🎪',
    news: '📰',
    community: '🏘️',
    school: '🏫',
    sports: '⚽',
    charity: '💝'
  }[insight.type];

  return `${emoji} ${insight.contentAngles[0] || insight.title}

${insight.description.substring(0, 200)}...

📍 ${insight.location}
${insight.timing.displayDate ? `📅 ${insight.timing.displayDate}` : ''}

#Local #${insight.location.split(',')[0]?.trim().replace(/\s+/g, '') || 'Community'}`;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const LocalContentGenerator = {
  generate: generateLocalContent,
  quickPreview: generateQuickPreview
};

export default LocalContentGenerator;
