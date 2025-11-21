/**
 * Topic Explorer Service
 *
 * Discovers trending topics and generates actionable content ideas using Perplexity API.
 * Natural language queries like "Find topics about current shoe trends" become 5-10 content ideas.
 *
 * Features:
 * - Real-time trend research via Perplexity
 * - Content idea generation per topic
 * - Trending hashtag recommendations
 * - Content idea bank storage
 * - Platform-specific suggestions
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  TopicExplorationRequest,
  TopicExplorationResult,
  TopicResult,
  ContentIdea,
  ServiceResponse,
  ITopicExplorer,
} from '../../../types/ai-commands.types';

export class TopicExplorerService implements ITopicExplorer {
  private anthropicApiKey: string;
  private perplexityApiKey: string;
  private anthropic: Anthropic;

  constructor(anthropicApiKey: string, perplexityApiKey?: string) {
    this.anthropicApiKey = anthropicApiKey;
    this.perplexityApiKey = perplexityApiKey || '';
    this.anthropic = new Anthropic({ apiKey: anthropicApiKey });
  }

  /**
   * Explore topics and generate content ideas
   */
  async explore(request: TopicExplorationRequest): Promise<ServiceResponse<TopicExplorationResult>> {
    const startTime = Date.now();

    try {
      const topicResults: TopicResult[] = [];

      // Process each topic
      for (const topic of request.topics) {
        // Get trend research from Perplexity (or mock if no API key)
        const trendData = await this.getTrendResearch(topic, request.industry);

        // Generate content ideas using Claude
        const contentIdeas = await this.generateContentIdeas(
          topic,
          request.businessContext || '',
          request.ideasPerTopic || 5,
          trendData
        );

        // Generate hashtags
        const hashtags = await this.generateHashtags(topic, request.industry);

        const topicResult: TopicResult = {
          topic,
          relevance: trendData.relevance,
          isTrending: trendData.isTrending,
          trendScore: trendData.trendScore,
          contentIdeas,
          hashtags,
          sources: trendData.sources,
        };

        topicResults.push(topicResult);
      }

      const result: TopicExplorationResult = {
        request,
        topics: topicResults,
        totalIdeas: topicResults.reduce((sum, t) => sum + t.contentIdeas.length, 0),
        generatedAt: new Date(),
      };

      return {
        success: true,
        data: result,
        metadata: {
          timestamp: new Date(),
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to explore topics',
        metadata: {
          timestamp: new Date(),
          duration: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Get trending topics for an industry
   */
  async getTrendingTopics(
    industry: string,
    count: number = 10
  ): Promise<ServiceResponse<TopicResult[]>> {
    const startTime = Date.now();

    try {
      // Use Perplexity to discover trending topics
      const query = `What are the top ${count} trending topics in the ${industry} industry right now? Include social media trends, industry news, and consumer interests.`;

      const topics = await this.discoverTopics(query, industry);

      // Generate content ideas for each trending topic
      const topicResults: TopicResult[] = [];

      for (const topic of topics.slice(0, count)) {
        const trendData = await this.getTrendResearch(topic, industry);
        const contentIdeas = await this.generateContentIdeas(topic, industry, 5, trendData);
        const hashtags = await this.generateHashtags(topic, industry);

        topicResults.push({
          topic,
          relevance: trendData.relevance,
          isTrending: true,
          trendScore: trendData.trendScore,
          contentIdeas,
          hashtags,
          sources: trendData.sources,
        });
      }

      return {
        success: true,
        data: topicResults,
        metadata: {
          timestamp: new Date(),
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get trending topics',
        metadata: {
          timestamp: new Date(),
          duration: Date.now() - startTime,
        },
      };
    }
  }

  // ============================================================================
  // PRIVATE METHODS - Perplexity API Integration
  // ============================================================================

  /**
   * Get trend research from Perplexity API
   */
  private async getTrendResearch(
    topic: string,
    industry?: string
  ): Promise<{
    relevance: string;
    isTrending: boolean;
    trendScore: number;
    sources: string[];
  }> {
    if (!this.perplexityApiKey) {
      // Mock response if no Perplexity API key
      return this.mockTrendResearch(topic);
    }

    try {
      const query = industry
        ? `Is "${topic}" currently trending in the ${industry} industry? What's the current conversation around it? Provide sources.`
        : `Is "${topic}" currently trending? What's the current conversation? Provide sources.`;

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.perplexityApiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'user',
              content: query,
            },
          ],
          return_citations: true,
          return_images: false,
          search_recency_filter: 'week',
        }),
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';
      const citations = data.citations || [];

      // Parse Perplexity response
      const isTrending = this.detectTrendingFromResponse(content);
      const trendScore = isTrending ? this.calculateTrendScore(content) : 50;

      return {
        relevance: content.substring(0, 200) + '...',
        isTrending,
        trendScore,
        sources: citations.slice(0, 3),
      };
    } catch (error) {
      console.warn('[TopicExplorer] Perplexity API failed, using mock:', error);
      return this.mockTrendResearch(topic);
    }
  }

  /**
   * Discover topics using Perplexity
   */
  private async discoverTopics(query: string, industry: string): Promise<string[]> {
    if (!this.perplexityApiKey) {
      // Mock topics if no API key
      return this.mockDiscoverTopics(industry);
    }

    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.perplexityApiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'user',
              content: query,
            },
          ],
          search_recency_filter: 'week',
        }),
      });

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';

      // Extract topics from response
      return this.extractTopicsFromText(content);
    } catch (error) {
      console.warn('[TopicExplorer] Perplexity discovery failed, using mock:', error);
      return this.mockDiscoverTopics(industry);
    }
  }

  /**
   * Detect if topic is trending from Perplexity response
   */
  private detectTrendingFromResponse(content: string): boolean {
    const trendingKeywords = [
      'trending',
      'viral',
      'popular',
      'hot topic',
      'growing',
      'surge',
      'momentum',
      'buzz',
    ];

    const lowerContent = content.toLowerCase();
    return trendingKeywords.some((keyword) => lowerContent.includes(keyword));
  }

  /**
   * Calculate trend score from content
   */
  private calculateTrendScore(content: string): number {
    // Simple heuristic based on positive/trending language
    const lowerContent = content.toLowerCase();

    let score = 50; // Baseline

    if (lowerContent.includes('viral')) score += 30;
    if (lowerContent.includes('trending')) score += 25;
    if (lowerContent.includes('popular')) score += 20;
    if (lowerContent.includes('growing')) score += 15;
    if (lowerContent.includes('surge')) score += 15;
    if (lowerContent.includes('momentum')) score += 10;

    return Math.min(score, 100);
  }

  /**
   * Extract topics from text
   */
  private extractTopicsFromText(text: string): string[] {
    // Simple extraction - look for numbered list or bullet points
    const lines = text.split('\n').filter((line) => line.trim().length > 0);

    const topics: string[] = [];

    for (const line of lines) {
      // Match: 1. Topic, - Topic, * Topic, etc.
      const match = line.match(/^[\d\-\*\•]\s*\.?\s*(.+)/);
      if (match) {
        topics.push(match[1].trim().replace(/[:\-].*$/, '').trim());
      }
    }

    return topics.length > 0 ? topics : this.mockDiscoverTopics('general');
  }

  // ============================================================================
  // PRIVATE METHODS - Content Idea Generation
  // ============================================================================

  /**
   * Generate content ideas using Claude
   */
  private async generateContentIdeas(
    topic: string,
    businessContext: string,
    count: number,
    trendData: any
  ): Promise<ContentIdea[]> {
    const systemPrompt = `You are a content strategist generating actionable content ideas.

**Task:** Generate ${count} specific, actionable content ideas about "${topic}" for a business in this context: ${businessContext || 'general business'}

**Trend Context:**
${trendData.relevance}

**For each idea, provide:**
1. Title (catchy, specific)
2. Concept (what the content is about, 2-3 sentences)
3. Platform (instagram, facebook, linkedin, twitter, or tiktok)
4. Format (post, story, reel, video, or carousel)
5. Expected engagement (low, medium, high, or viral)
6. Reasoning (why this will work)

Return as JSON array:
\`\`\`json
[
  {
    "title": "...",
    "concept": "...",
    "platform": "instagram",
    "format": "reel",
    "expectedEngagement": "high",
    "reasoning": "..."
  }
]
\`\`\``;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Generate ${count} content ideas about "${topic}". Return JSON only.`,
          },
        ],
      });

      const textContent = response.content.find((c) => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        return this.mockContentIdeas(topic, count);
      }

      // Extract JSON from response
      const jsonMatch =
        textContent.text.match(/```json\n([\s\S]*?)\n```/) ||
        textContent.text.match(/(\[[\s\S]*\])/);

      if (!jsonMatch) {
        return this.mockContentIdeas(topic, count);
      }

      const ideas = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      return ideas;
    } catch (error) {
      console.warn('[TopicExplorer] Content idea generation failed, using mock:', error);
      return this.mockContentIdeas(topic, count);
    }
  }

  /**
   * Generate hashtags for a topic
   */
  private async generateHashtags(topic: string, industry?: string): Promise<string[]> {
    // Simple hashtag generation - in production, use trending hashtag API
    const baseTags = [
      topic.replace(/\s+/g, ''),
      topic.split(' ')[0],
      industry?.replace(/\s+/g, ''),
    ].filter(Boolean);

    const contextTags = ['SmallBusiness', 'Marketing', 'ContentCreation', 'SocialMedia'];

    return [...baseTags, ...contextTags.slice(0, 5 - baseTags.length)].slice(0, 5);
  }

  // ============================================================================
  // PRIVATE METHODS - Mock Data (Fallbacks)
  // ============================================================================

  /**
   * Mock trend research (fallback when Perplexity unavailable)
   */
  private mockTrendResearch(topic: string): {
    relevance: string;
    isTrending: boolean;
    trendScore: number;
    sources: string[];
  } {
    return {
      relevance: `${topic} is currently being discussed across social media and industry publications. Content about this topic is generating engagement.`,
      isTrending: true,
      trendScore: 75,
      sources: [
        'https://example.com/trends/1',
        'https://example.com/trends/2',
        'https://example.com/trends/3',
      ],
    };
  }

  /**
   * Mock topic discovery
   */
  private mockDiscoverTopics(industry: string): string[] {
    const topicsByIndustry: Record<string, string[]> = {
      restaurant: [
        'Farm-to-table ingredients',
        'Seasonal menu specials',
        'Behind-the-scenes kitchen',
        'Customer favorites',
        'Local partnerships',
      ],
      retail: [
        'New arrivals',
        'Style guides',
        'Customer testimonials',
        'Sustainable products',
        'Limited editions',
      ],
      'professional services': [
        'Industry insights',
        'Case studies',
        'Expert tips',
        'Client success stories',
        'Thought leadership',
      ],
    };

    return topicsByIndustry[industry.toLowerCase()] || topicsByIndustry.retail;
  }

  /**
   * Mock content ideas
   */
  private mockContentIdeas(topic: string, count: number): ContentIdea[] {
    const ideas: ContentIdea[] = [];

    for (let i = 0; i < count; i++) {
      ideas.push({
        title: `${topic} Idea ${i + 1}`,
        concept: `Create engaging content about ${topic} that resonates with your audience. Focus on storytelling and authenticity.`,
        platform: ['instagram', 'facebook', 'linkedin', 'twitter', 'tiktok'][i % 5] as any,
        format: ['post', 'story', 'reel', 'video', 'carousel'][i % 5] as any,
        expectedEngagement: ['medium', 'high', 'high', 'medium', 'viral'][i % 5] as any,
        reasoning: `This format performs well for ${topic} content and will engage your target audience.`,
      });
    }

    return ideas;
  }
}

/**
 * Factory function to create TopicExplorerService
 */
export const createTopicExplorer = (
  anthropicApiKey: string,
  perplexityApiKey?: string
): TopicExplorerService => {
  return new TopicExplorerService(anthropicApiKey, perplexityApiKey);
};
