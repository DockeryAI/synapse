/**
 * Press & News Scraper Service
 *
 * Searches for brand mentions in press, news articles, and industry publications.
 * Uses Serper API to find and extract media coverage.
 *
 * Created: 2025-11-29 (Phase 7.3)
 */

import { SerperAPI } from '@/services/intelligence/serper-api';

// ============================================================================
// TYPES
// ============================================================================

export interface PressMention {
  title: string;                    // Article title
  snippet: string;                  // Extract/quote from article
  publicationName: string;          // Forbes, TechCrunch, etc.
  publicationType: 'major' | 'trade' | 'local' | 'blog';
  sourceUrl: string;
  publishDate?: string;
  authorName?: string;
  authorityScore: number;           // 0-100 based on publication
  relevanceScore: number;           // How relevant to the brand
  isFeaturedArticle: boolean;       // Brand is main subject vs mention
  topics: string[];                 // What the article covers
}

export interface PressResult {
  brandName: string;
  mentions: PressMention[];
  totalFound: number;
  majorPublicationCount: number;
  tradePublicationCount: number;
  fetchedAt: Date;
}

// ============================================================================
// AUTHORITY SCORING FOR PUBLICATIONS
// ============================================================================

const MAJOR_PUBLICATIONS: Record<string, number> = {
  'forbes.com': 95,
  'wsj.com': 95,
  'nytimes.com': 95,
  'bloomberg.com': 95,
  'reuters.com': 95,
  'techcrunch.com': 90,
  'wired.com': 90,
  'theverge.com': 88,
  'businessinsider.com': 88,
  'inc.com': 85,
  'entrepreneur.com': 85,
  'fastcompany.com': 85,
  'fortune.com': 90,
  'cnn.com': 90,
  'bbc.com': 92,
  'theguardian.com': 88,
  'washingtonpost.com': 92,
  'usatoday.com': 85,
  'huffpost.com': 75,
  'mashable.com': 75,
  'venturebeat.com': 82,
  'zdnet.com': 80,
  'cnet.com': 82,
  'engadget.com': 78
};

const TRADE_PUBLICATION_PATTERNS: { pattern: RegExp; score: number }[] = [
  { pattern: /crm|marketing|sales/i, score: 80 },
  { pattern: /saas|software|tech/i, score: 78 },
  { pattern: /fintech|finance/i, score: 82 },
  { pattern: /health|medical|pharma/i, score: 82 },
  { pattern: /hr|human resources|workforce/i, score: 78 },
  { pattern: /manufacturing|industrial/i, score: 78 },
  { pattern: /retail|ecommerce|commerce/i, score: 78 },
  { pattern: /real estate|property/i, score: 78 },
  { pattern: /legal|law/i, score: 80 },
  { pattern: /education|edtech|learning/i, score: 78 }
];

// ============================================================================
// SERVICE
// ============================================================================

class PressNewsScraperService {
  private serperApi = SerperAPI;

  /**
   * Main entry point - search for press mentions
   */
  async scrapePressMentions(brandName: string): Promise<PressResult> {
    console.log('[PressNewsScraper] Starting search for:', brandName);

    const result: PressResult = {
      brandName,
      mentions: [],
      totalFound: 0,
      majorPublicationCount: 0,
      tradePublicationCount: 0,
      fetchedAt: new Date()
    };

    try {
      // Run multiple search strategies in parallel
      const [newsResults, featuredResults, prResults] = await Promise.allSettled([
        this.searchNews(brandName),
        this.searchFeaturedArticles(brandName),
        this.searchPressReleases(brandName)
      ]);

      // Combine all results
      const allMentions: PressMention[] = [];

      if (newsResults.status === 'fulfilled') {
        allMentions.push(...newsResults.value);
      }
      if (featuredResults.status === 'fulfilled') {
        allMentions.push(...featuredResults.value);
      }
      if (prResults.status === 'fulfilled') {
        allMentions.push(...prResults.value);
      }

      // Deduplicate by URL
      const seenUrls = new Set<string>();
      result.mentions = allMentions.filter(m => {
        if (seenUrls.has(m.sourceUrl)) return false;
        seenUrls.add(m.sourceUrl);
        return true;
      });

      // Sort by authority score
      result.mentions.sort((a, b) => b.authorityScore - a.authorityScore);

      // Count by type
      result.totalFound = result.mentions.length;
      result.majorPublicationCount = result.mentions.filter(m => m.publicationType === 'major').length;
      result.tradePublicationCount = result.mentions.filter(m => m.publicationType === 'trade').length;

      console.log('[PressNewsScraper] Found:', {
        total: result.totalFound,
        major: result.majorPublicationCount,
        trade: result.tradePublicationCount
      });

    } catch (error) {
      console.warn('[PressNewsScraper] Error:', error);
    }

    return result;
  }

  /**
   * Search Google News for brand mentions
   */
  private async searchNews(brandName: string): Promise<PressMention[]> {
    const mentions: PressMention[] = [];

    try {
      // Search for news articles about the brand
      const query = `"${brandName}" news article`;
      const results = await this.serperApi.searchGoogle(query);

      for (const result of results.slice(0, 10)) {
        const mention = this.parseSearchResult(result, brandName);
        if (mention) {
          mentions.push(mention);
        }
      }
    } catch (error) {
      console.warn('[PressNewsScraper] News search error:', error);
    }

    return mentions;
  }

  /**
   * Search for featured articles about the brand
   */
  private async searchFeaturedArticles(brandName: string): Promise<PressMention[]> {
    const mentions: PressMention[] = [];

    try {
      // Search for profile pieces, interviews, case studies
      const queries = [
        `"${brandName}" CEO interview`,
        `"${brandName}" "case study"`,
        `"${brandName}" profile company`
      ];

      for (const query of queries) {
        const results = await this.serperApi.searchGoogle(query);

        for (const result of results.slice(0, 5)) {
          const mention = this.parseSearchResult(result, brandName, true);
          if (mention) {
            mentions.push(mention);
          }
        }
      }
    } catch (error) {
      console.warn('[PressNewsScraper] Featured articles search error:', error);
    }

    return mentions;
  }

  /**
   * Search for press releases
   */
  private async searchPressReleases(brandName: string): Promise<PressMention[]> {
    const mentions: PressMention[] = [];

    try {
      const query = `"${brandName}" (site:prnewswire.com OR site:businesswire.com OR site:globenewswire.com)`;
      const results = await this.serperApi.searchGoogle(query);

      for (const result of results.slice(0, 5)) {
        const mention = this.parseSearchResult(result, brandName);
        if (mention) {
          // Press releases get lower authority since company-generated
          mention.authorityScore = Math.min(mention.authorityScore, 65);
          mention.publicationType = 'trade';
          mentions.push(mention);
        }
      }
    } catch (error) {
      console.warn('[PressNewsScraper] Press release search error:', error);
    }

    return mentions;
  }

  /**
   * Parse a search result into a PressMention
   */
  private parseSearchResult(
    result: { title: string; snippet: string; link: string },
    brandName: string,
    isFeatured: boolean = false
  ): PressMention | null {
    if (!result.link || !result.snippet) return null;

    // Extract domain for publication detection
    let domain = '';
    try {
      const url = new URL(result.link);
      domain = url.hostname.replace('www.', '');
    } catch {
      return null;
    }

    // Skip social media and forums
    if (/facebook|twitter|linkedin|reddit|quora|youtube/i.test(domain)) {
      return null;
    }

    // Determine publication type and authority
    let publicationType: 'major' | 'trade' | 'local' | 'blog' = 'blog';
    let authorityScore = 50; // Default for unknown

    // Check major publications
    for (const [pubDomain, score] of Object.entries(MAJOR_PUBLICATIONS)) {
      if (domain.includes(pubDomain.replace('.com', ''))) {
        publicationType = 'major';
        authorityScore = score;
        break;
      }
    }

    // Check trade publications by topic patterns
    if (publicationType !== 'major') {
      for (const { pattern, score } of TRADE_PUBLICATION_PATTERNS) {
        if (pattern.test(domain) || pattern.test(result.title)) {
          publicationType = 'trade';
          authorityScore = Math.max(authorityScore, score);
          break;
        }
      }
    }

    // Local/regional news
    if (/news|journal|times|tribune|herald|gazette|post|sun/i.test(domain)) {
      publicationType = publicationType === 'blog' ? 'local' : publicationType;
      authorityScore = Math.max(authorityScore, 65);
    }

    // Extract publication name from domain
    const publicationName = this.extractPublicationName(domain, result.title);

    // Calculate relevance - how central is brand to the article
    const brandMentions = (result.title + ' ' + result.snippet)
      .toLowerCase()
      .split(brandName.toLowerCase()).length - 1;
    const relevanceScore = Math.min(100, 50 + (brandMentions * 20));

    // Extract topics
    const topics = this.extractTopics(result.title + ' ' + result.snippet);

    return {
      title: result.title,
      snippet: result.snippet,
      publicationName,
      publicationType,
      sourceUrl: result.link,
      authorityScore,
      relevanceScore,
      isFeaturedArticle: isFeatured || relevanceScore > 80,
      topics
    };
  }

  /**
   * Extract a readable publication name from domain
   */
  private extractPublicationName(domain: string, title: string): string {
    // Common patterns
    const domainClean = domain
      .replace('.com', '')
      .replace('.co', '')
      .replace('.io', '')
      .replace('.org', '')
      .replace('.net', '');

    // Capitalize appropriately
    const words = domainClean.split(/[-._]/);
    const name = words
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    // Handle known publications
    const known: Record<string, string> = {
      'techcrunch': 'TechCrunch',
      'theverge': 'The Verge',
      'businessinsider': 'Business Insider',
      'fastcompany': 'Fast Company',
      'huffpost': 'HuffPost',
      'nytimes': 'The New York Times',
      'wsj': 'The Wall Street Journal',
      'washingtonpost': 'The Washington Post',
      'theguardian': 'The Guardian',
      'bbc': 'BBC News',
      'cnn': 'CNN',
      'prnewswire': 'PR Newswire',
      'businesswire': 'Business Wire',
      'globenewswire': 'Globe Newswire'
    };

    for (const [key, displayName] of Object.entries(known)) {
      if (domain.toLowerCase().includes(key)) {
        return displayName;
      }
    }

    return name;
  }

  /**
   * Extract topics from article text
   */
  private extractTopics(text: string): string[] {
    const topics: string[] = [];
    const lowerText = text.toLowerCase();

    const topicPatterns: { pattern: RegExp; topic: string }[] = [
      { pattern: /funding|investment|raise|series [a-z]|valuation/i, topic: 'Funding' },
      { pattern: /launch|announce|release|introduce|new product/i, topic: 'Product Launch' },
      { pattern: /partner|integration|collaboration/i, topic: 'Partnership' },
      { pattern: /acquire|merger|acquisition|buy/i, topic: 'M&A' },
      { pattern: /award|winner|recognized|honor/i, topic: 'Award' },
      { pattern: /hire|appoint|join|new ceo|new cto/i, topic: 'Leadership' },
      { pattern: /growth|revenue|customer|expand/i, topic: 'Growth' },
      { pattern: /security|compliance|privacy|gdpr|soc/i, topic: 'Security' },
      { pattern: /ai|machine learning|automation/i, topic: 'AI/ML' },
      { pattern: /innovation|breakthrough|disrupt/i, topic: 'Innovation' }
    ];

    for (const { pattern, topic } of topicPatterns) {
      if (pattern.test(lowerText)) {
        topics.push(topic);
      }
    }

    return topics.slice(0, 3); // Max 3 topics
  }
}

export const pressNewsScraperService = new PressNewsScraperService();
export default pressNewsScraperService;
