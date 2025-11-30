/**
 * Trend Content Generator Service
 *
 * Bridges Trends 2.0 with the content generation system.
 * Takes a trend with its matched triggers and generates ready-to-post content.
 *
 * Created: 2025-11-29
 */

import type { CompleteUVP } from '@/types/uvp-flow.types';
import type { TrendWithMatches, ContentAngle } from './triggers-trend-matcher.service';
import { chat } from '@/lib/openrouter';
import type { OpenRouterMessage } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export interface TrendContentRequest {
  trend: TrendWithMatches;
  uvp: CompleteUVP;
  platform: 'linkedin' | 'instagram' | 'facebook' | 'twitter' | 'blog';
  angle?: ContentAngle;
  tone?: 'professional' | 'casual' | 'inspirational' | 'educational';
}

export interface GeneratedTrendContent {
  /** The generated post content */
  content: string;
  /** Headline/hook */
  headline: string;
  /** Call to action */
  callToAction: string;
  /** Suggested hashtags */
  hashtags: string[];
  /** Content type */
  contentType: 'post' | 'carousel' | 'story' | 'article';
  /** Estimated engagement */
  estimatedEngagement: 'low' | 'medium' | 'high';
  /** Platform optimized for */
  platform: string;
  /** Source trend data */
  sourceTrend: {
    title: string;
    trigger: string;
    lifecycle: string;
  };
  /** Generation metadata */
  metadata: {
    generatedAt: string;
    angleUsed: string;
    tokensUsed?: number;
  };
}

export interface BatchContentRequest {
  trends: TrendWithMatches[];
  uvp: CompleteUVP;
  platforms: ('linkedin' | 'instagram' | 'facebook' | 'twitter' | 'blog')[];
  maxPosts?: number;
}

export interface BatchContentResult {
  content: GeneratedTrendContent[];
  stats: {
    requested: number;
    generated: number;
    failed: number;
    avgEngagement: string;
  };
}

// ============================================================================
// PLATFORM CONFIGS
// ============================================================================

const PLATFORM_CONFIGS: Record<string, { maxLength: number; hashtagCount: number; style: string }> = {
  linkedin: {
    maxLength: 2000,
    hashtagCount: 5,
    style: 'professional, thought-leadership oriented, includes insights and takeaways'
  },
  instagram: {
    maxLength: 2200,
    hashtagCount: 15,
    style: 'visual-first, engaging, conversational, emoji-friendly'
  },
  facebook: {
    maxLength: 1500,
    hashtagCount: 3,
    style: 'conversational, community-focused, shareable'
  },
  twitter: {
    maxLength: 280,
    hashtagCount: 2,
    style: 'punchy, concise, provocative or insightful'
  },
  blog: {
    maxLength: 5000,
    hashtagCount: 0,
    style: 'in-depth, SEO-optimized, educational with clear structure'
  }
};

// ============================================================================
// CONTENT GENERATION
// ============================================================================

/**
 * Generate content for a single trend
 */
export async function generateTrendContent(
  request: TrendContentRequest
): Promise<GeneratedTrendContent> {
  const { trend, uvp, platform, angle, tone = 'professional' } = request;

  const platformConfig = PLATFORM_CONFIGS[platform] || PLATFORM_CONFIGS.linkedin;
  const selectedAngle = angle || trend.bestMatch?.contentAngles[0];

  // Build the prompt
  const systemPrompt = `You are an expert content creator specializing in ${platform} content.
You create engaging, on-brand content that drives engagement and conversions.
Your content is ${platformConfig.style}.
Maximum length: ${platformConfig.maxLength} characters.`;

  const userPrompt = `Create a ${platform} post about this trending topic for the following brand:

## TREND INFORMATION
Title: ${trend.title}
Description: ${trend.description}
Why It Matters: ${trend.whyThisMatters}
Lifecycle Stage: ${trend.lifecycle.stageLabel} (${trend.lifecycle.stage})
Primary Trigger: ${trend.primaryTrigger}
${trend.bestMatch ? `Suggested Hook: "${trend.bestMatch.suggestedHook}"` : ''}
${selectedAngle ? `Content Angle: ${selectedAngle.type} - ${selectedAngle.headline}` : ''}

## BRAND CONTEXT
Value Proposition: ${uvp.valuePropositionStatement || ''}
Target Customer: ${uvp.targetCustomer?.statement || ''}
Key Differentiator: ${uvp.uniqueSolution?.statement || ''}
Key Benefit: ${uvp.keyBenefit?.statement || ''}

## REQUIREMENTS
- Tone: ${tone}
- Platform: ${platform}
- Max Length: ${platformConfig.maxLength} characters
- Include ${platformConfig.hashtagCount} relevant hashtags
- Include a clear call-to-action
- Make it feel authentic, not salesy
- Connect the trend to the brand's expertise

## OUTPUT FORMAT
Return a JSON object with:
{
  "headline": "The hook/headline (first line that grabs attention)",
  "content": "The full post content",
  "callToAction": "The CTA at the end",
  "hashtags": ["hashtag1", "hashtag2", ...],
  "contentType": "post" | "carousel" | "story" | "article",
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
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseErr) {
      // Fallback: create structured content from raw text
      parsed = {
        headline: trend.bestMatch?.suggestedHook || trend.title,
        content: content.substring(0, platformConfig.maxLength),
        callToAction: 'Learn more in the comments below!',
        hashtags: extractHashtags(content, platformConfig.hashtagCount),
        contentType: 'post',
        estimatedEngagement: 'medium'
      };
    }

    return {
      content: parsed.content || '',
      headline: parsed.headline || '',
      callToAction: parsed.callToAction || '',
      hashtags: parsed.hashtags || [],
      contentType: parsed.contentType || 'post',
      estimatedEngagement: parsed.estimatedEngagement || 'medium',
      platform,
      sourceTrend: {
        title: trend.title,
        trigger: trend.primaryTrigger,
        lifecycle: trend.lifecycle.stage
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        angleUsed: selectedAngle?.type || 'default',
        tokensUsed: response.usage?.total_tokens
      }
    };

  } catch (err) {
    console.error('[TrendContentGenerator] Generation failed:', err);
    throw err;
  }
}

/**
 * Extract hashtags from text
 */
function extractHashtags(text: string, count: number): string[] {
  const hashtagRegex = /#(\w+)/g;
  const matches = text.match(hashtagRegex) || [];
  return matches.slice(0, count).map(h => h.replace('#', ''));
}

/**
 * Generate content for multiple trends in batch
 */
export async function generateBatchContent(
  request: BatchContentRequest
): Promise<BatchContentResult> {
  const { trends, uvp, platforms, maxPosts = 10 } = request;

  const contentReadyTrends = trends
    .filter(t => t.isContentReady)
    .slice(0, maxPosts);

  const results: GeneratedTrendContent[] = [];
  let failed = 0;

  for (const trend of contentReadyTrends) {
    // Pick the best platform for this trend's angle
    const platform = selectBestPlatform(trend, platforms);

    try {
      const content = await generateTrendContent({
        trend,
        uvp,
        platform
      });
      results.push(content);
    } catch (err) {
      console.warn('[TrendContentGenerator] Failed to generate for trend:', trend.title);
      failed++;
    }
  }

  // Calculate avg engagement
  const engagementScores = { low: 1, medium: 2, high: 3 };
  const avgScore = results.reduce((sum, r) => sum + engagementScores[r.estimatedEngagement], 0) / results.length;
  const avgEngagement = avgScore >= 2.5 ? 'high' : avgScore >= 1.5 ? 'medium' : 'low';

  return {
    content: results,
    stats: {
      requested: contentReadyTrends.length,
      generated: results.length,
      failed,
      avgEngagement
    }
  };
}

/**
 * Select best platform based on trend characteristics
 */
function selectBestPlatform(
  trend: TrendWithMatches,
  availablePlatforms: string[]
): 'linkedin' | 'instagram' | 'facebook' | 'twitter' | 'blog' {
  const angle = trend.bestMatch?.contentAngles[0];

  if (!angle) {
    return (availablePlatforms[0] as any) || 'linkedin';
  }

  // Match angle type to preferred platform
  const platformPreferences: Record<string, string[]> = {
    educational: ['linkedin', 'blog', 'facebook'],
    emotional: ['instagram', 'facebook', 'twitter'],
    social_proof: ['linkedin', 'twitter', 'facebook'],
    urgency: ['twitter', 'instagram', 'facebook'],
    authority: ['linkedin', 'blog', 'twitter']
  };

  const preferred = platformPreferences[angle.type] || ['linkedin'];

  for (const p of preferred) {
    if (availablePlatforms.includes(p)) {
      return p as any;
    }
  }

  return (availablePlatforms[0] as any) || 'linkedin';
}

/**
 * Quick content preview (no AI call)
 */
export function generateQuickPreview(trend: TrendWithMatches): string {
  const hook = trend.bestMatch?.suggestedHook || trend.title;
  const angle = trend.bestMatch?.contentAngles[0];

  return `🔥 ${hook}

${trend.description.substring(0, 200)}...

${trend.whyThisMatters}

${angle ? `💡 Suggested angle: ${angle.headline}` : ''}

#trending #${trend.primaryTrigger}`;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const TrendContentGenerator = {
  generate: generateTrendContent,
  generateBatch: generateBatchContent,
  quickPreview: generateQuickPreview
};

export default TrendContentGenerator;
