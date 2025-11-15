/**
 * SearchSocialGenerator - AI-powered content generation for Search & Social
 *
 * Generates ready-to-post content for:
 * - Search Visibility (Google My Business posts)
 * - Social Presence (Facebook, Instagram, LinkedIn posts)
 *
 * Uses Claude AI + industry intelligence + competitive advantages to create
 * personalized content that passes ContentValidator quality checks.
 *
 * NOTE: This is ADDITIVE to existing nested scoring breakdown in cards.
 * Content pieces appear alongside the data drill-down, not replacing it.
 */

import type {
  BusinessIntelligence,
  ContentPiece,
  ContentBadge,
  OpportunityType,
} from '../types';

import type { ScoredOpportunity } from '../scorer';
import { ContentValidator } from '../validator';
import { OPPORTUNITY_TO_BADGE } from '../types';

/**
 * Generates AI-powered content for Search Visibility and Social Presence
 */
export class SearchSocialGenerator {
  private validator: ContentValidator;

  constructor() {
    this.validator = new ContentValidator();
  }

  /**
   * Generate 3 Google My Business posts for Search Visibility
   * Targets: keyword gaps, content gaps, trending topics, weather alerts
   */
  async generateSearchVisibilityContent(
    businessIntel: BusinessIntelligence,
    topOpportunities: ScoredOpportunity[]
  ): Promise<ContentPiece[]> {
    console.log('[SearchSocialGenerator] Generating Search Visibility content...');

    // Filter to search-relevant opportunities
    const searchOpportunities = topOpportunities
      .filter((opp) =>
        ['weather_alert', 'local_news', 'competitor_gap', 'content_gap', 'trending', 'seasonal'].includes(
          opp.type
        )
      )
      .slice(0, 5); // Top 5 for context

    try {
      // Build AI prompt with full business context
      const prompt = this.buildSearchVisibilityPrompt(businessIntel, searchOpportunities);

      // Call AI to generate content
      const aiResponse = await this.callAI(prompt);

      // Parse AI response into ContentPiece objects
      const contentPieces = this.parseContentResponse(aiResponse, 'search_visibility', businessIntel);

      // Validate all pieces (must pass 6/7 checks)
      const validPieces = this.validator.filterValid(contentPieces, businessIntel);

      console.log(`[SearchSocialGenerator] Generated ${validPieces.length}/3 valid pieces`);

      // Return 3 best pieces (or fill with fallback if needed)
      if (validPieces.length >= 3) {
        return validPieces.slice(0, 3);
      } else {
        const fallbackNeeded = 3 - validPieces.length;
        const fallbacks = this.generateFallbackContent(
          'search_visibility',
          businessIntel,
          searchOpportunities,
          fallbackNeeded
        );
        return [...validPieces, ...fallbacks];
      }
    } catch (error) {
      console.error('[SearchSocialGenerator] Generation failed:', error);
      // Return fallback content on error
      return this.generateFallbackContent('search_visibility', businessIntel, searchOpportunities, 3);
    }
  }

  /**
   * Generate 3 social media posts for Social Presence
   * Targets: platform gaps, timing gaps, customer successes, trending discussions
   */
  async generateSocialPresenceContent(
    businessIntel: BusinessIntelligence,
    topOpportunities: ScoredOpportunity[]
  ): Promise<ContentPiece[]> {
    console.log('[SearchSocialGenerator] Generating Social Presence content...');

    // Filter to social-relevant opportunities
    const socialOpportunities = topOpportunities
      .filter((opp) =>
        [
          'platform_gap',
          'timing_gap',
          'format_gap',
          'recent_review',
          'review_advantage',
          'trending',
          'reddit_discussion',
        ].includes(opp.type)
      )
      .slice(0, 5);

    try {
      const prompt = this.buildSocialPresencePrompt(businessIntel, socialOpportunities);
      const aiResponse = await this.callAI(prompt);
      const contentPieces = this.parseContentResponse(aiResponse, 'social_presence', businessIntel);
      const validPieces = this.validator.filterValid(contentPieces, businessIntel);

      console.log(`[SearchSocialGenerator] Generated ${validPieces.length}/3 valid pieces`);

      if (validPieces.length >= 3) {
        return validPieces.slice(0, 3);
      } else {
        const fallbackNeeded = 3 - validPieces.length;
        const fallbacks = this.generateFallbackContent(
          'social_presence',
          businessIntel,
          socialOpportunities,
          fallbackNeeded
        );
        return [...validPieces, ...fallbacks];
      }
    } catch (error) {
      console.error('[SearchSocialGenerator] Generation failed:', error);
      return this.generateFallbackContent('social_presence', businessIntel, socialOpportunities, 3);
    }
  }

  // =========================================================================
  // PRIVATE HELPER METHODS
  // =========================================================================

  /**
   * Build comprehensive AI prompt for Search Visibility content
   * Includes: business context, industry intelligence, competitive gaps, opportunities
   */
  private buildSearchVisibilityPrompt(
    businessIntel: BusinessIntelligence,
    opportunities: ScoredOpportunity[]
  ): string {
    const { business, industryProfile, competitive, searchData } = businessIntel;

    return `You are a local SEO expert creating Google My Business posts for ${business.name}.

BUSINESS CONTEXT:
- Industry: ${business.industry}
- Location: ${business.location.city}, ${business.location.state}
- Website: ${business.url}
- Current ranking: ${searchData.topKeyword?.keyword || 'Not ranking'} (#${searchData.topKeyword?.position || 'N/A'})

INDUSTRY INTELLIGENCE (Proven patterns from ${industryProfile.businessCount} ${business.industry} businesses):

Customer Triggers (what drives calls/bookings):
${industryProfile.customerTriggers
  .slice(0, 5)
  .map((t) => `- "${t.trigger}" (urgency: ${t.urgencyScore}/10, best time: ${t.bestTimeToUse})`)
  .join('\n')}

Power Words (proven to increase engagement):
${industryProfile.powerWords
  .slice(0, 10)
  .map((w) => `- "${w.word}" (${w.placement}, +${w.conversionLift}% lift)`)
  .join('\n')}

Proven CTAs:
${industryProfile.provenCTAs
  .slice(0, 3)
  .map((c) => `- "${c.text}" (${c.conversionRate}% conversion, ${c.urgencyLevel})`)
  .join('\n')}

COMPETITIVE ADVANTAGES:

Keyword Gaps (competitors rank, you can capture):
${competitive.searchOpportunities.keywordGaps
  .slice(0, 3)
  .map((gap) => `- "${gap.keyword}" (${gap.searchVolume}/mo searches, difficulty: ${gap.difficulty}/100)`)
  .join('\n')}

Content Gaps (topics to own):
${competitive.searchOpportunities.contentGaps
  .slice(0, 3)
  .map((gap) => `- "${gap.topic}" (${gap.searchVolume}/mo, ${gap.competitorsCover}/3 competitors cover it)`)
  .join('\n')}

TIMELY OPPORTUNITIES:
${opportunities.map((opp) => `- ${opp.type}: ${opp.reasoning} (score: ${opp.score}/100, urgency: ${opp.urgency})`).join('\n')}

YOUR TASK:
Generate 3 Google My Business posts (200-500 characters each) that:
1. Exploit the opportunities above
2. Use local references (${business.location.city})
3. Include business name (${business.name})
4. Use proven power words from the industry
5. Have clear CTAs from proven list
6. Sound authentic (not AI-generated)
7. Use ONLY opportunity-focused language (never: "missing", "behind", "weak", "need to", "must")

CRITICAL TONE RULES:
✅ ALWAYS use: opportunity, ready, discover, capture, enhance, positioned, available
❌ NEVER use: missing, lacking, behind, weak, must, need to, have to, beating you

Format your response as JSON:
{
  "posts": [
    {
      "title": "5-8 word opportunity-focused headline",
      "reason": "One sentence explaining why this works",
      "content": "200-500 char post text with emoji, local reference, CTA",
      "opportunity": {
        "type": "weather_alert|competitor_gap|etc",
        "trigger": "which customer trigger this addresses",
        "powerWords": ["word1", "word2"],
        "cta": "which proven CTA used",
        "gap": "specific gap being exploited"
      }
    }
  ]
}

Generate 3 posts now. Make them READY TO POST (no placeholders, complete, authentic).`;
  }

  /**
   * Build comprehensive AI prompt for Social Presence content
   * Focuses on: customer stories, platform gaps, emotional transformation
   */
  private buildSocialPresencePrompt(
    businessIntel: BusinessIntelligence,
    opportunities: ScoredOpportunity[]
  ): string {
    const { business, industryProfile, competitive, reviewData } = businessIntel;

    // Get best social platforms for this industry
    const bestPlatforms = industryProfile.bestPlatforms
      .filter((p) => ['facebook', 'instagram', 'linkedin'].includes(p))
      .slice(0, 3);

    // Get recent positive reviews
    const recentReviews = reviewData.recentReviews.filter((r) => r.rating >= 4).slice(0, 3);

    return `You are a social media strategist creating posts for ${business.name}.

BUSINESS CONTEXT:
- Industry: ${business.industry}
- Location: ${business.location.city}, ${business.location.state}
- Rating: ${reviewData.rating}★ (${reviewData.reviewCount} reviews)
- Best platforms for ${business.industry}: ${bestPlatforms.join(', ')}

INDUSTRY SOCIAL PATTERNS:

Best Content Types:
${industryProfile.contentTypes.slice(0, 5).map((type) => `- ${type}`).join('\n')}

Emotional Transformations (customer journey):
${industryProfile.transformations
  .slice(0, 3)
  .map((t) => `- ${t.painPoint} → ${t.desiredOutcome} (${t.emotionalValue})`)
  .join('\n')}

Seasonal Best Times to Post:
${industryProfile.seasonalTrends[0]?.bestPostingTime || 'Weekday evenings'}

COMPETITIVE OPPORTUNITIES:

Platform Gaps:
${competitive.socialOpportunities.platformGaps
  .slice(0, 2)
  .map((gap) => `- ${gap.platform}: ${gap.opportunity}`)
  .join('\n')}

Timing Gaps:
${competitive.socialOpportunities.timingGaps
  .slice(0, 2)
  .map((gap) => `- ${gap.timeSlot}: ${gap.opportunity}`)
  .join('\n')}

Format Gaps:
${competitive.socialOpportunities.formatGaps
  .slice(0, 2)
  .map((gap) => `- ${gap.format}: ${gap.opportunity}`)
  .join('\n')}

RECENT CUSTOMER SUCCESSES:
${recentReviews.map((review) => `- ${review.rating}★: "${review.text.substring(0, 100)}..."`).join('\n')}

YOUR STRENGTHS VS COMPETITORS:
${competitive.reviewOpportunities.advantages
  .slice(0, 3)
  .map((adv) => `- ${adv.metric}: Your ${adv.yourValue} vs competitor avg ${adv.competitorAvg}`)
  .join('\n')}

TIMELY OPPORTUNITIES:
${opportunities.map((opp) => `- ${opp.type}: ${opp.reasoning} (score: ${opp.score}/100)`).join('\n')}

YOUR TASK:
Generate 3 social media posts (200-500 characters each) that:
1. Celebrate customer successes or showcase strengths
2. Exploit platform/timing/format gaps
3. Use emotional transformation messaging
4. Include local references
5. Have clear CTAs
6. Feel authentic and personal
7. Use ONLY opportunity-focused language

CRITICAL TONE RULES:
✅ ALWAYS use: discover, celebrate, achieve, unlock, ready, positioned, success
❌ NEVER use: missing, lacking, behind, weak, failed, need to, must, beating you

Format as JSON:
{
  "posts": [
    {
      "title": "5-8 word headline",
      "reason": "One sentence why this works",
      "content": "200-500 char post with emoji, storytelling, CTA",
      "platform": "facebook|instagram|linkedin",
      "hashtags": ["tag1", "tag2", "tag3"],
      "opportunity": {
        "type": "platform_gap|recent_review|etc",
        "gap": "specific gap exploited",
        "advantage": "your competitive edge"
      }
    }
  ]
}

Generate 3 posts now.`;
  }

  /**
   * Parse AI JSON response into ContentPiece objects
   * Handles malformed JSON, extracts from markdown code blocks
   */
  private parseContentResponse(
    aiResponse: string,
    category: 'search_visibility' | 'social_presence',
    businessIntel: BusinessIntelligence
  ): ContentPiece[] {
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = aiResponse.match(/\{[\s\S]*"posts"[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('[SearchSocialGenerator] No JSON found in AI response');
        return [];
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const posts = parsed.posts || [];

      return posts.map((post: any, index: number): ContentPiece => {
        const contentPiece: ContentPiece = {
          id: `${category}-${Date.now()}-${index}`,
          title: post.title || 'Untitled',
          reason: post.reason || 'Generated content',
          badge: this.determineBadge(post.opportunity?.type || 'evergreen'),
          content: {
            platform:
              post.platform || (category === 'search_visibility' ? 'google_my_business' : 'facebook'),
            postText: post.content || '',
            hashtags: post.hashtags || [],
            optimalTime: this.determineOptimalTime(businessIntel, post.opportunity?.type),
            source: `${post.opportunity?.type || 'AI'} + Industry intelligence`,
          },
          industryContext: {
            trigger: post.opportunity?.trigger || 'General',
            powerWordsUsed: post.opportunity?.powerWords || [],
            ctaUsed: post.opportunity?.cta || 'contact',
          },
          competitiveEdge: {
            gap: post.opportunity?.gap || 'Timing advantage',
            advantage: post.opportunity?.advantage || 'First to post',
          },
        };

        return contentPiece;
      });
    } catch (error) {
      console.error('[SearchSocialGenerator] Failed to parse AI response:', error);
      return [];
    }
  }

  /**
   * Determine UI badge from opportunity type
   */
  private determineBadge(opportunityType: string): ContentBadge {
    return OPPORTUNITY_TO_BADGE[opportunityType as OpportunityType] || 'Growth Opportunity';
  }

  /**
   * Determine optimal posting time based on opportunity urgency
   */
  private determineOptimalTime(businessIntel: BusinessIntelligence, opportunityType?: string): string {
    // Immediate for urgent signals
    if (['weather_alert', 'local_news'].includes(opportunityType || '')) {
      return 'Today at 4 PM';
    }

    // Today for trending
    if (['trending', 'reddit_discussion'].includes(opportunityType || '')) {
      return 'Today at 6 PM';
    }

    // Use industry best time if available
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
    const seasonalTrends = businessIntel.industryProfile?.seasonalTrends ?? [];
    const seasonalTrend = seasonalTrends.find((t) => t.month === currentMonth);

    if (seasonalTrend?.bestPostingTime) {
      return seasonalTrend.bestPostingTime;
    }

    // Default
    return 'Tomorrow at 10 AM';
  }

  /**
   * Generate safe fallback content when AI fails or validation fails
   * Uses proven templates with business data
   */
  private generateFallbackContent(
    category: 'search_visibility' | 'social_presence',
    businessIntel: BusinessIntelligence,
    opportunities: ScoredOpportunity[],
    count: number
  ): ContentPiece[] {
    const fallbacks: ContentPiece[] = [];
    const { business, industryProfile, reviewData } = businessIntel;

    // Fallback templates (safe, proven patterns)
    const templates =
      category === 'search_visibility'
        ? [
            {
              title: 'Serving Your Community',
              template: `${business.name} is ready to serve ${business.location.city} residents. Rated ${reviewData.rating}★ with ${reviewData.reviewCount}+ reviews. Discover quality ${business.industry} service today.`,
            },
            {
              title: 'Local Expertise Ready',
              template: `Discover quality ${business.industry} service in ${business.location.city}. Our team is positioned to deliver exceptional results. Contact ${business.name} to explore how we can help.`,
            },
            {
              title: 'Community Partnership',
              template: `${business.name} continues to enhance ${business.location.city}'s ${business.industry} experience. Ready to achieve your goals? Call us today.`,
            },
          ]
        : [
            {
              title: 'Customer Success Story',
              template: `Another ${business.location.city} customer achieved their goals with ${business.name}! We're excited to help more families discover quality ${business.industry} service. Ready to join them?`,
            },
            {
              title: 'Community Impact',
              template: `Proud to serve ${business.location.city}! ${business.name} continues to deliver ${industryProfile.transformations[0]?.desiredOutcome || 'exceptional service'}. Discover how we can help you today.`,
            },
            {
              title: 'Growth Milestone',
              template: `${business.name} is positioned to serve more ${business.location.city} families. With ${reviewData.reviewCount}+ reviews at ${reviewData.rating}★, we're ready to help you achieve success.`,
            },
          ];

    for (let i = 0; i < Math.min(count, templates.length); i++) {
      fallbacks.push({
        id: `fallback-${category}-${Date.now()}-${i}`,
        title: templates[i].title,
        reason: 'Safe fallback content using proven patterns',
        badge: 'Growth Opportunity',
        content: {
          platform: category === 'search_visibility' ? 'google_my_business' : 'facebook',
          postText: templates[i].template,
          hashtags: [`#${business.location.city}`, `#${business.industry.replace(/\s+/g, '')}`],
          optimalTime: 'Tomorrow at 10 AM',
          source: 'Fallback template',
        },
        industryContext: {
          trigger: industryProfile.customerTriggers[0]?.trigger || 'general',
          powerWordsUsed: ['ready', 'discover', 'quality'],
          ctaUsed: 'contact us',
        },
        competitiveEdge: {
          gap: 'Consistent posting',
          advantage: 'Reliable presence',
        },
      });
    }

    return fallbacks;
  }

  /**
   * Call AI API to generate content
   * Uses OpenRouter with Claude 3.5 Sonnet
   */
  private async callAI(prompt: string): Promise<string> {
    const apiKey = process.env.VITE_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'anthropic/claude-opus-4',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('[SearchSocialGenerator] AI call failed:', error);
      throw error;
    }
  }
}
