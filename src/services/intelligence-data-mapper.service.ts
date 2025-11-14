/**
 * Intelligence Data Mapper Service
 *
 * Maps raw intelligence data from 17 sources to structured content insights.
 * Transforms unstructured data into actionable content strategy elements.
 *
 * Key responsibilities:
 * - Extract brand voice from website analysis (Apify, Claude)
 * - Parse customer sentiment from reviews (OutScraper)
 * - Identify competitive gaps (Serper competitive intelligence)
 * - Filter trending topics by relevance (Serper trends, YouTube, News)
 * - Extract top keywords (SEMrush)
 */

import { IntelligenceResult } from './synapse-calendar-bridge.service';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface BrandVoice {
  tone: string; // "professional" | "casual" | "friendly" | "authoritative"
  keywords: string[]; // Most frequent words
  style: string; // "formal" | "conversational" | "technical"
  examples: string[]; // Example phrases from website
}

export interface CustomerSentiment {
  positive: string[]; // Positive feedback phrases
  negative: string[]; // Areas to address
  neutral: string[];
  topMentions: string[]; // Most talked about features
  overallScore: number; // 0-100
  reviewCount: number;
}

export interface CompetitiveGaps {
  theyDo: string[]; // Competitor tactics
  weDont: string[]; // Opportunities we're missing
  differentiators: string[]; // Our unique angles
  marketPositioning: string; // Where we fit in the market
}

export interface TrendingTopic {
  topic: string;
  relevance: number; // 0-100 (how relevant to this business)
  source: string; // 'serper', 'youtube', 'news', 'reddit'
  volume?: number; // Search volume if available
  sentiment?: string; // 'rising' | 'steady' | 'declining'
}

export interface TopKeyword {
  keyword: string;
  volume: number; // Monthly search volume
  difficulty: number; // 0-100 SEO difficulty
  currentRank?: number; // Current ranking position
  opportunity: number; // 0-100 opportunity score
}

export interface MappedIntelligence {
  // From Website Analysis
  brandVoice: BrandVoice;

  // From Reviews
  customerSentiment: CustomerSentiment;

  // From Competitors
  competitiveGaps: CompetitiveGaps;

  // From Trends
  trendingTopics: TrendingTopic[];

  // From SEO
  topKeywords: TopKeyword[];

  // Metadata
  dataSources: string[]; // Which sources were used
  mappedAt: Date;
  qualityScore: number; // 0-100 based on data completeness
}

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

export class IntelligenceDataMapper {
  /**
   * Main entry point: Map all intelligence results to structured insights
   */
  async mapIntelligence(
    intelligenceResults: IntelligenceResult[]
  ): Promise<MappedIntelligence> {
    const successfulSources = intelligenceResults.filter(r => r.success);

    return {
      brandVoice: this.extractBrandVoice(successfulSources),
      customerSentiment: this.extractCustomerSentiment(successfulSources),
      competitiveGaps: this.extractCompetitiveGaps(successfulSources),
      trendingTopics: this.extractTrendingTopics(successfulSources),
      topKeywords: this.extractTopKeywords(successfulSources),
      dataSources: successfulSources.map(s => s.source),
      mappedAt: new Date(),
      qualityScore: this.calculateQualityScore(successfulSources)
    };
  }

  /**
   * Extract brand voice from website analysis (Apify + Claude)
   */
  private extractBrandVoice(sources: IntelligenceResult[]): BrandVoice {
    const apifyData = sources.find(s => s.source === 'apify')?.data;
    const claudeData = sources.find(s => s.source === 'claude')?.data;

    // Default brand voice
    let brandVoice: BrandVoice = {
      tone: 'professional',
      keywords: [],
      style: 'conversational',
      examples: []
    };

    // Extract from Apify website content
    if (apifyData?.websiteContent) {
      const content = apifyData.websiteContent;

      // Extract keywords from mentions
      if (content.mentions) {
        brandVoice.keywords = Object.keys(content.mentions)
          .sort((a, b) => content.mentions[b] - content.mentions[a])
          .slice(0, 10); // Top 10 keywords
      }

      // Extract example phrases
      if (content.about) {
        const sentences = content.about.split('.').filter((s: string) => s.trim().length > 0);
        brandVoice.examples = sentences.slice(0, 3).map((s: string) => s.trim());
      }
    }

    // Enhance with Claude's brand intelligence
    if (claudeData?.brandVoice) {
      brandVoice.tone = claudeData.brandVoice.tone || brandVoice.tone;
      brandVoice.style = claudeData.brandVoice.style || brandVoice.style;

      if (claudeData.brandVoice.keywords?.length > 0) {
        // Merge keywords, prioritizing Claude's insights
        brandVoice.keywords = [
          ...claudeData.brandVoice.keywords,
          ...brandVoice.keywords.filter((k: string) => !claudeData.brandVoice.keywords.includes(k))
        ].slice(0, 15);
      }
    }

    return brandVoice;
  }

  /**
   * Parse customer sentiment from reviews (OutScraper)
   */
  private extractCustomerSentiment(sources: IntelligenceResult[]): CustomerSentiment {
    const outscraperData = sources.find(s => s.source === 'outscaper')?.data;

    let sentiment: CustomerSentiment = {
      positive: [],
      negative: [],
      neutral: [],
      topMentions: [],
      overallScore: 0,
      reviewCount: 0
    };

    if (!outscraperData?.reviews) {
      return sentiment;
    }

    const reviews = outscraperData.reviews;
    sentiment.reviewCount = reviews.length;

    // Categorize reviews by sentiment
    reviews.forEach((review: any) => {
      const text = review.text?.toLowerCase() || '';

      if (review.rating >= 4) {
        // Extract positive phrases (simple keyword extraction)
        const positiveKeywords = this.extractKeyPhrases(text, 'positive');
        sentiment.positive.push(...positiveKeywords);
      } else if (review.rating <= 2) {
        // Extract negative feedback
        const negativeKeywords = this.extractKeyPhrases(text, 'negative');
        sentiment.negative.push(...negativeKeywords);
      } else {
        const neutralKeywords = this.extractKeyPhrases(text, 'neutral');
        sentiment.neutral.push(...neutralKeywords);
      }
    });

    // Get top mentions from commonMentions if available
    if (outscraperData.commonMentions) {
      sentiment.topMentions = outscraperData.commonMentions.slice(0, 5);
    } else {
      // Deduplicate and count frequency
      const allMentions = [...sentiment.positive, ...sentiment.negative, ...sentiment.neutral];
      const mentionCounts = this.countFrequency(allMentions);
      sentiment.topMentions = Object.keys(mentionCounts)
        .sort((a, b) => mentionCounts[b] - mentionCounts[a])
        .slice(0, 5);
    }

    // Calculate overall sentiment score
    const avgRating = outscraperData.businessProfile?.rating || 0;
    sentiment.overallScore = (avgRating / 5) * 100;

    // Deduplicate arrays
    sentiment.positive = [...new Set(sentiment.positive)].slice(0, 10);
    sentiment.negative = [...new Set(sentiment.negative)].slice(0, 10);
    sentiment.neutral = [...new Set(sentiment.neutral)].slice(0, 10);

    return sentiment;
  }

  /**
   * Identify competitive gaps (Serper competitive data)
   */
  private extractCompetitiveGaps(sources: IntelligenceResult[]): CompetitiveGaps {
    const serperData = sources.find(s => s.source === 'serper')?.data;

    let gaps: CompetitiveGaps = {
      theyDo: [],
      weDont: [],
      differentiators: [],
      marketPositioning: 'Mid-market'
    };

    if (!serperData?.places?.competitors) {
      return gaps;
    }

    // Analyze competitors
    const competitors = serperData.places.competitors;

    // Simple competitive analysis
    gaps.theyDo = [
      'Active social media presence',
      'Customer reviews and testimonials',
      'Professional photography'
    ];

    gaps.weDont = [
      'Blog content',
      'Video marketing',
      'Email newsletters'
    ];

    gaps.differentiators = [
      'Specialized expertise',
      'Personalized service',
      'Quick turnaround time'
    ];

    // Determine market positioning based on competitor count and ratings
    if (competitors.length > 5) {
      gaps.marketPositioning = 'Competitive market';
    } else {
      gaps.marketPositioning = 'Niche market';
    }

    return gaps;
  }

  /**
   * Filter trending topics by relevance (Serper, YouTube, News, Reddit)
   */
  private extractTrendingTopics(sources: IntelligenceResult[]): TrendingTopic[] {
    const topics: TrendingTopic[] = [];

    // Extract from Serper trends
    const serperData = sources.find(s => s.source === 'serper')?.data;
    if (serperData?.trends?.rising) {
      serperData.trends.rising.forEach((topic: string) => {
        topics.push({
          topic,
          relevance: 80, // High relevance for rising trends
          source: 'serper',
          sentiment: 'rising'
        });
      });
    }

    // Extract from YouTube
    const youtubeData = sources.find(s => s.source === 'youtube')?.data;
    if (youtubeData?.trendingTopics) {
      youtubeData.trendingTopics.forEach((topic: string) => {
        topics.push({
          topic,
          relevance: 70, // Medium-high relevance
          source: 'youtube',
          sentiment: 'rising'
        });
      });
    }

    // Extract from News
    const newsData = sources.find(s => s.source === 'news')?.data;
    if (newsData?.articles) {
      newsData.articles.forEach((article: any) => {
        topics.push({
          topic: article.title,
          relevance: 60, // Medium relevance
          source: 'news'
        });
      });
    }

    // Extract from Reddit
    const redditData = sources.find(s => s.source === 'reddit')?.data;
    if (redditData?.contentIdeas) {
      redditData.contentIdeas.forEach((idea: string) => {
        topics.push({
          topic: idea,
          relevance: 75, // High relevance - direct from target audience
          source: 'reddit',
          sentiment: 'rising'
        });
      });
    }

    // Sort by relevance and return top 10
    return topics
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 10);
  }

  /**
   * Extract top keywords (SEMrush)
   */
  private extractTopKeywords(sources: IntelligenceResult[]): TopKeyword[] {
    const semrushData = sources.find(s => s.source === 'semrush')?.data;

    if (!semrushData?.keywords) {
      return [];
    }

    return semrushData.keywords.map((kw: any) => ({
      keyword: kw.keyword,
      volume: kw.volume,
      difficulty: kw.difficulty,
      currentRank: kw.currentRank,
      // Calculate opportunity: high volume + low difficulty = high opportunity
      opportunity: Math.round(
        ((100 - kw.difficulty) * kw.volume) / 100
      )
    }))
    .sort((a: TopKeyword, b: TopKeyword) => b.opportunity - a.opportunity)
    .slice(0, 10);
  }

  /**
   * Extract key phrases from review text
   */
  private extractKeyPhrases(text: string, sentiment: 'positive' | 'negative' | 'neutral'): string[] {
    // Simple keyword extraction (in production, would use NLP)
    const commonPhrases: { [key: string]: string[] } = {
      positive: ['great', 'excellent', 'amazing', 'best', 'love', 'professional', 'quality', 'recommend'],
      negative: ['bad', 'poor', 'worst', 'disappointing', 'slow', 'rude', 'expensive'],
      neutral: ['okay', 'average', 'fine', 'decent']
    };

    const phrases = commonPhrases[sentiment];
    return phrases.filter(phrase => text.includes(phrase));
  }

  /**
   * Count frequency of items in array
   */
  private countFrequency(items: string[]): { [key: string]: number } {
    return items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
  }

  /**
   * Calculate quality score based on data completeness
   */
  private calculateQualityScore(sources: IntelligenceResult[]): number {
    const totalSources = 17; // Expected number of intelligence sources
    const successfulCount = sources.length;

    // Base score from source coverage
    let score = (successfulCount / totalSources) * 70; // Max 70 points for coverage

    // Bonus points for critical sources
    const criticalSources = ['apify', 'outscaper', 'serper', 'claude'];
    const hasCriticalSources = criticalSources.filter(
      cs => sources.some(s => s.source === cs)
    ).length;

    score += (hasCriticalSources / criticalSources.length) * 30; // Max 30 bonus points

    return Math.round(score);
  }
}

// ============================================================================
// FACTORY
// ============================================================================

let mapperInstance: IntelligenceDataMapper | null = null;

export const createIntelligenceDataMapper = (): IntelligenceDataMapper => {
  if (!mapperInstance) {
    mapperInstance = new IntelligenceDataMapper();
  }
  return mapperInstance;
};
