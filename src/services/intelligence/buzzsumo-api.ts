/**
 * BuzzSumo API Service
 *
 * Provides content performance intelligence:
 * - Top performing content by topic
 * - Trending content analysis
 * - Competitor content performance
 * - Headline pattern extraction
 *
 * API Key: BUZZSUMO_API_KEY (in .env)
 */

import { apiCache } from './api-cache.service';
import { apiRetryWrapper } from './api-retry-wrapper';

// ============================================================================
// Types
// ============================================================================

export interface BuzzSumoContent {
  id: string;
  url: string;
  title: string;
  publishedDate: string;
  author: string;
  domain: string;
  totalShares: number;
  facebookShares: number;
  twitterShares: number;
  pinterestShares: number;
  linkedinShares: number;
  redditEngagements: number;
  wordCount: number;
  thumbnail?: string;
}

export interface BuzzSumoTrend {
  topic: string;
  velocity: number; // Growth rate
  totalEngagements: number;
  avgEngagementsPerArticle: number;
  articleCount: number;
  topHeadlines: string[];
  peakDay: string;
}

export interface BuzzSumoCompetitor {
  domain: string;
  totalArticles: number;
  totalEngagements: number;
  avgEngagementsPerArticle: number;
  topPerformingUrls: string[];
  contentTypes: Record<string, number>;
  publishingFrequency: number; // articles per day
}

export interface BuzzSumoInfluencer {
  name: string;
  platform: string;
  followers: number;
  avgShares: number;
  topTopics: string[];
  engagementRate: number;
}

export interface ContentAnalysisResult {
  query: string;
  topContent: BuzzSumoContent[];
  avgEngagement: number;
  topHeadlinePatterns: string[];
  optimalWordCount: number;
  bestPublishDays: string[];
  performanceByFormat: Record<string, number>;
}

export interface TrendingResult {
  trends: BuzzSumoTrend[];
  emergingTopics: string[];
  decliningTopics: string[];
  timestamp: Date;
}

export interface CompetitorAnalysisResult {
  competitors: BuzzSumoCompetitor[];
  contentGaps: string[];
  opportunityTopics: string[];
  benchmark: {
    avgEngagement: number;
    topPerformingFormat: string;
    avgPublishFrequency: number;
  };
}

// ============================================================================
// Configuration
// ============================================================================

const BUZZSUMO_BASE_URL = 'https://api.buzzsumo.com/search';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// ============================================================================
// BuzzSumo API Service
// ============================================================================

class BuzzSumoAPIService {
  private apiKey: string | null = null;

  constructor() {
    this.apiKey = import.meta.env.VITE_BUZZSUMO_API_KEY || null;
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Analyze top performing content for a topic
   */
  async analyzeContent(
    query: string,
    options: {
      numResults?: number;
      days?: number;
      contentType?: 'articles' | 'videos' | 'infographics' | 'all';
    } = {}
  ): Promise<ContentAnalysisResult> {
    const { numResults = 20, days = 30, contentType = 'all' } = options;

    if (!this.apiKey) {
      return this.getMockContentAnalysis(query);
    }

    const cacheKey = `buzzsumo:content:${query}:${days}:${numResults}`;
    const cached = apiCache.get<ContentAnalysisResult>(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiRetryWrapper(async () => {
        const url = new URL(`${BUZZSUMO_BASE_URL}/articles.json`);
        url.searchParams.set('api_key', this.apiKey!);
        url.searchParams.set('q', query);
        url.searchParams.set('num_results', String(numResults));
        url.searchParams.set('num_days', String(days));

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`BuzzSumo API error: ${res.status}`);
        return res.json();
      });

      const result = this.processContentResponse(query, response);
      apiCache.set(cacheKey, result, CACHE_TTL);
      return result;
    } catch (error) {
      console.error('[BuzzSumo] Content analysis failed:', error);
      return this.getMockContentAnalysis(query);
    }
  }

  /**
   * Get trending topics and content
   */
  async getTrending(
    options: {
      topic?: string;
      hours?: number;
    } = {}
  ): Promise<TrendingResult> {
    const { topic, hours = 24 } = options;

    if (!this.apiKey) {
      return this.getMockTrending(topic);
    }

    const cacheKey = `buzzsumo:trending:${topic || 'general'}:${hours}`;
    const cached = apiCache.get<TrendingResult>(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiRetryWrapper(async () => {
        const url = new URL(`${BUZZSUMO_BASE_URL}/trending.json`);
        url.searchParams.set('api_key', this.apiKey!);
        if (topic) url.searchParams.set('q', topic);
        url.searchParams.set('hours', String(hours));

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`BuzzSumo API error: ${res.status}`);
        return res.json();
      });

      const result = this.processTrendingResponse(response);
      apiCache.set(cacheKey, result, CACHE_TTL / 2); // Shorter cache for trending
      return result;
    } catch (error) {
      console.error('[BuzzSumo] Trending fetch failed:', error);
      return this.getMockTrending(topic);
    }
  }

  /**
   * Analyze competitor content performance
   */
  async analyzeCompetitors(
    domains: string[],
    options: {
      days?: number;
    } = {}
  ): Promise<CompetitorAnalysisResult> {
    const { days = 30 } = options;

    if (!this.apiKey) {
      return this.getMockCompetitorAnalysis(domains);
    }

    const cacheKey = `buzzsumo:competitors:${domains.join(',')}:${days}`;
    const cached = apiCache.get<CompetitorAnalysisResult>(cacheKey);
    if (cached) return cached;

    try {
      const competitorData = await Promise.all(
        domains.map(domain => this.fetchDomainData(domain, days))
      );

      const result = this.processCompetitorData(competitorData);
      apiCache.set(cacheKey, result, CACHE_TTL);
      return result;
    } catch (error) {
      console.error('[BuzzSumo] Competitor analysis failed:', error);
      return this.getMockCompetitorAnalysis(domains);
    }
  }

  /**
   * Extract headline patterns from top performing content
   */
  async extractHeadlinePatterns(
    query: string,
    numResults: number = 50
  ): Promise<string[]> {
    const analysis = await this.analyzeContent(query, { numResults });
    return analysis.topHeadlinePatterns;
  }

  /**
   * Get "What's Working Now" data for a topic
   */
  async getWhatsWorking(topic: string): Promise<{
    topFormats: Array<{ format: string; avgEngagement: number }>;
    optimalLength: { min: number; max: number };
    bestHeadlineStarts: string[];
    topHashtags: string[];
    peakPublishTimes: string[];
  }> {
    const analysis = await this.analyzeContent(topic, { numResults: 100, days: 14 });

    return {
      topFormats: Object.entries(analysis.performanceByFormat)
        .map(([format, engagement]) => ({ format, avgEngagement: engagement }))
        .sort((a, b) => b.avgEngagement - a.avgEngagement)
        .slice(0, 5),
      optimalLength: {
        min: Math.max(500, analysis.optimalWordCount - 500),
        max: analysis.optimalWordCount + 500,
      },
      bestHeadlineStarts: analysis.topHeadlinePatterns.slice(0, 5),
      topHashtags: this.extractHashtagsFromHeadlines(analysis.topContent.map(c => c.title)),
      peakPublishTimes: analysis.bestPublishDays,
    };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private async fetchDomainData(domain: string, days: number): Promise<BuzzSumoCompetitor | null> {
    try {
      const url = new URL(`${BUZZSUMO_BASE_URL}/articles.json`);
      url.searchParams.set('api_key', this.apiKey!);
      url.searchParams.set('q', `site:${domain}`);
      url.searchParams.set('num_results', '100');
      url.searchParams.set('num_days', String(days));

      const res = await fetch(url.toString());
      if (!res.ok) return null;

      const data = await res.json();
      return this.processDomainResponse(domain, data);
    } catch {
      return null;
    }
  }

  private processContentResponse(query: string, response: unknown): ContentAnalysisResult {
    const articles = (response as { results?: BuzzSumoContent[] })?.results || [];

    const topContent = articles.slice(0, 20);
    const totalEngagements = topContent.reduce((sum, a) => sum + a.totalShares, 0);
    const avgEngagement = topContent.length > 0 ? totalEngagements / topContent.length : 0;

    // Extract headline patterns
    const patterns = this.extractHeadlinePatternsFromTitles(topContent.map(c => c.title));

    // Calculate optimal word count
    const wordCounts = topContent.map(c => c.wordCount).filter(w => w > 0);
    const optimalWordCount = wordCounts.length > 0
      ? Math.round(wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length)
      : 1200;

    // Analyze publish days
    const publishDays = this.analyzePublishDays(topContent);

    // Performance by format (inferred from titles)
    const performanceByFormat = this.inferFormatPerformance(topContent);

    return {
      query,
      topContent,
      avgEngagement,
      topHeadlinePatterns: patterns,
      optimalWordCount,
      bestPublishDays: publishDays,
      performanceByFormat,
    };
  }

  private processTrendingResponse(response: unknown): TrendingResult {
    const trends = (response as { trending?: BuzzSumoTrend[] })?.trending || [];

    const emergingTopics = trends
      .filter(t => t.velocity > 1.5)
      .map(t => t.topic)
      .slice(0, 10);

    const decliningTopics = trends
      .filter(t => t.velocity < 0.5)
      .map(t => t.topic)
      .slice(0, 5);

    return {
      trends,
      emergingTopics,
      decliningTopics,
      timestamp: new Date(),
    };
  }

  private processDomainResponse(domain: string, data: unknown): BuzzSumoCompetitor {
    const articles = (data as { results?: BuzzSumoContent[] })?.results || [];

    const totalEngagements = articles.reduce((sum, a) => sum + a.totalShares, 0);
    const avgEngagementsPerArticle = articles.length > 0 ? totalEngagements / articles.length : 0;

    return {
      domain,
      totalArticles: articles.length,
      totalEngagements,
      avgEngagementsPerArticle,
      topPerformingUrls: articles.slice(0, 5).map(a => a.url),
      contentTypes: this.inferContentTypes(articles),
      publishingFrequency: articles.length / 30, // Assuming 30-day window
    };
  }

  private processCompetitorData(competitors: (BuzzSumoCompetitor | null)[]): CompetitorAnalysisResult {
    const validCompetitors = competitors.filter((c): c is BuzzSumoCompetitor => c !== null);

    const avgEngagement = validCompetitors.length > 0
      ? validCompetitors.reduce((sum, c) => sum + c.avgEngagementsPerArticle, 0) / validCompetitors.length
      : 0;

    const avgPublishFrequency = validCompetitors.length > 0
      ? validCompetitors.reduce((sum, c) => sum + c.publishingFrequency, 0) / validCompetitors.length
      : 0;

    // Find top performing format across all competitors
    const allFormats: Record<string, number> = {};
    for (const comp of validCompetitors) {
      for (const [format, count] of Object.entries(comp.contentTypes)) {
        allFormats[format] = (allFormats[format] || 0) + count;
      }
    }
    const topPerformingFormat = Object.entries(allFormats)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'article';

    return {
      competitors: validCompetitors,
      contentGaps: [],
      opportunityTopics: [],
      benchmark: {
        avgEngagement,
        topPerformingFormat,
        avgPublishFrequency,
      },
    };
  }

  private extractHeadlinePatternsFromTitles(titles: string[]): string[] {
    const patterns: Record<string, number> = {};

    for (const title of titles) {
      // Extract common patterns
      if (/^\d+/.test(title)) patterns['Number-led'] = (patterns['Number-led'] || 0) + 1;
      if (/^How to/i.test(title)) patterns['How to...'] = (patterns['How to...'] || 0) + 1;
      if (/^Why/i.test(title)) patterns['Why...'] = (patterns['Why...'] || 0) + 1;
      if (/^What/i.test(title)) patterns['What...'] = (patterns['What...'] || 0) + 1;
      if (/^The (Ultimate|Complete|Definitive)/i.test(title)) patterns['The Ultimate/Complete...'] = (patterns['The Ultimate/Complete...'] || 0) + 1;
      if (/\?$/.test(title)) patterns['Question format'] = (patterns['Question format'] || 0) + 1;
      if (/(Guide|Tips|Secrets|Mistakes)/i.test(title)) patterns['Guide/Tips/Secrets'] = (patterns['Guide/Tips/Secrets'] || 0) + 1;
      if (/(vs|versus|compared)/i.test(title)) patterns['Comparison'] = (patterns['Comparison'] || 0) + 1;
      if (/(2024|2025)/i.test(title)) patterns['Year reference'] = (patterns['Year reference'] || 0) + 1;
    }

    return Object.entries(patterns)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([pattern]) => pattern);
  }

  private analyzePublishDays(content: BuzzSumoContent[]): string[] {
    const dayEngagements: Record<string, { total: number; count: number }> = {};

    for (const article of content) {
      const day = new Date(article.publishedDate).toLocaleDateString('en-US', { weekday: 'long' });
      if (!dayEngagements[day]) {
        dayEngagements[day] = { total: 0, count: 0 };
      }
      dayEngagements[day].total += article.totalShares;
      dayEngagements[day].count += 1;
    }

    return Object.entries(dayEngagements)
      .map(([day, stats]) => ({ day, avgEngagement: stats.total / stats.count }))
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 3)
      .map(d => d.day);
  }

  private inferFormatPerformance(content: BuzzSumoContent[]): Record<string, number> {
    const formats: Record<string, { total: number; count: number }> = {};

    for (const article of content) {
      let format = 'article';
      const title = article.title.toLowerCase();

      if (/\d+.*tips|list|reasons|ways/.test(title)) format = 'listicle';
      else if (/how to|guide|tutorial/.test(title)) format = 'how-to';
      else if (/vs|versus|compared|comparison/.test(title)) format = 'comparison';
      else if (/case study|success story/.test(title)) format = 'case-study';
      else if (/infographic|visual/.test(title)) format = 'infographic';
      else if (/data|research|study|statistics/.test(title)) format = 'data-driven';

      if (!formats[format]) {
        formats[format] = { total: 0, count: 0 };
      }
      formats[format].total += article.totalShares;
      formats[format].count += 1;
    }

    const result: Record<string, number> = {};
    for (const [format, stats] of Object.entries(formats)) {
      result[format] = stats.total / stats.count;
    }

    return result;
  }

  private inferContentTypes(articles: BuzzSumoContent[]): Record<string, number> {
    const types: Record<string, number> = {};

    for (const article of articles) {
      const title = article.title.toLowerCase();
      let type = 'article';

      if (/video|watch/.test(title)) type = 'video';
      else if (/infographic/.test(title)) type = 'infographic';
      else if (/podcast|episode/.test(title)) type = 'podcast';
      else if (/webinar/.test(title)) type = 'webinar';

      types[type] = (types[type] || 0) + 1;
    }

    return types;
  }

  private extractHashtagsFromHeadlines(headlines: string[]): string[] {
    const words: Record<string, number> = {};

    for (const headline of headlines) {
      const tokens = headline.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 4);

      for (const token of tokens) {
        words[token] = (words[token] || 0) + 1;
      }
    }

    return Object.entries(words)
      .filter(([word]) => !['these', 'those', 'their', 'about', 'which', 'where', 'would'].includes(word))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => `#${word}`);
  }

  // ============================================================================
  // Mock Data (for development/fallback)
  // ============================================================================

  private getMockContentAnalysis(query: string): ContentAnalysisResult {
    return {
      query,
      topContent: [],
      avgEngagement: 2500,
      topHeadlinePatterns: [
        'Number-led',
        'How to...',
        'Question format',
        'Guide/Tips/Secrets',
        'The Ultimate/Complete...',
      ],
      optimalWordCount: 1500,
      bestPublishDays: ['Tuesday', 'Wednesday', 'Thursday'],
      performanceByFormat: {
        'listicle': 3200,
        'how-to': 2800,
        'data-driven': 2500,
        'comparison': 2200,
        'case-study': 1800,
      },
    };
  }

  private getMockTrending(topic?: string): TrendingResult {
    return {
      trends: [],
      emergingTopics: topic
        ? [`${topic} automation`, `${topic} AI`, `${topic} best practices`]
        : ['AI productivity', 'remote work tools', 'automation strategies'],
      decliningTopics: ['legacy systems', 'manual processes'],
      timestamp: new Date(),
    };
  }

  private getMockCompetitorAnalysis(domains: string[]): CompetitorAnalysisResult {
    return {
      competitors: domains.map(domain => ({
        domain,
        totalArticles: 50,
        totalEngagements: 75000,
        avgEngagementsPerArticle: 1500,
        topPerformingUrls: [],
        contentTypes: { article: 40, listicle: 8, 'how-to': 2 },
        publishingFrequency: 1.5,
      })),
      contentGaps: ['implementation guides', 'ROI calculators', 'video tutorials'],
      opportunityTopics: ['automation workflows', 'integration guides', 'case studies'],
      benchmark: {
        avgEngagement: 1500,
        topPerformingFormat: 'listicle',
        avgPublishFrequency: 1.5,
      },
    };
  }
}

// Export singleton instance
export const buzzsumoAPI = new BuzzSumoAPIService();

// Export class for testing
export { BuzzSumoAPIService };
