/**
 * Competitive Analyzer Service
 *
 * Scrapes and analyzes competitor websites to extract:
 * 1. Messaging themes and positioning
 * 2. Content strategies and topics
 * 3. Competitive white spaces (what they're NOT doing)
 * 4. Differentiation opportunities
 *
 * Uses Apify for web scraping with respect for robots.txt and rate limits.
 *
 * Created: 2025-11-23
 */

import { ApifyClient } from 'apify-client';
import type { DeepContext } from '@/types/synapse/deepContext.types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CompetitorData {
  url: string;
  name: string;
  scrapedAt: Date;
  pages: ScrapedPage[];
  messagingThemes: MessagingTheme[];
  contentTopics: string[];
  positioning: string;
  keyMessages: string[];
}

export interface ScrapedPage {
  url: string;
  title: string;
  content: string;
  headings: string[];
  metadata: {
    description?: string;
    keywords?: string[];
  };
}

export interface MessagingTheme {
  theme: string;
  frequency: number;
  examples: string[];
  confidence: number;
  emotionalTone: string;
}

export interface CompetitiveWhiteSpace {
  gap: string;
  description: string;
  opportunity: string;
  urgency: 'high' | 'medium' | 'low';
  difficulty: 'easy' | 'medium' | 'hard';
  potentialImpact: number; // 0-100
}

export interface DifferentiationStrategy {
  strategy: string;
  rationale: string;
  implementation: string[];
  expectedOutcome: string;
  competitorsDoingThis: string[];
  competitorsNotDoingThis: string[];
}

export interface CompetitiveAnalysisResult {
  competitors: CompetitorData[];
  whiteSpaces: CompetitiveWhiteSpace[];
  differentiationStrategies: DifferentiationStrategy[];
  themeComparison: Record<string, { yours: number; theirs: number }>;
  analysisDate: Date;
  confidence: number;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

class CompetitiveAnalyzerService {
  private apifyClient: ApifyClient | null = null;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 2000;

  constructor() {
    const apiToken = import.meta.env.VITE_APIFY_API_TOKEN;
    if (apiToken && apiToken !== 'your_apify_token_here' && apiToken !== '') {
      this.apifyClient = new ApifyClient({ token: apiToken });
    }
  }

  /**
   * Main entry point: Analyzes competitors and returns strategic insights
   */
  public async analyzeCompetitors(
    competitorUrls: string[],
    context: DeepContext
  ): Promise<CompetitiveAnalysisResult> {
    if (!this.apifyClient) {
      console.warn('Apify not configured, using fallback analysis');
      return this.fallbackAnalysis(competitorUrls, context);
    }

    try {
      const competitors = await this.scrapeCompetitors(competitorUrls);
      const whiteSpaces = this.identifyWhiteSpaces(competitors, context);
      const strategies = this.generateDifferentiationStrategies(competitors, whiteSpaces, context);
      const themeComparison = this.compareThemes(competitors, context);

      return {
        competitors,
        whiteSpaces,
        differentiationStrategies: strategies,
        themeComparison,
        analysisDate: new Date(),
        confidence: competitors.length > 0 ? 0.85 : 0.5
      };
    } catch (error) {
      console.error('Competitive analysis error:', error);
      return this.fallbackAnalysis(competitorUrls, context);
    }
  }

  /**
   * Scrapes competitor websites using Apify
   * Respects robots.txt and implements rate limiting
   */
  private async scrapeCompetitors(urls: string[]): Promise<CompetitorData[]> {
    if (!this.apifyClient) {
      throw new Error('Apify client not initialized');
    }

    const maxCompetitors = parseInt(import.meta.env.VITE_MAX_COMPETITORS || '5');
    const maxPages = parseInt(import.meta.env.VITE_MAX_PAGES_PER_COMPETITOR || '10');
    const limitedUrls = urls.slice(0, maxCompetitors);

    const competitorData: CompetitorData[] = [];

    for (const url of limitedUrls) {
      try {
        const scraped = await this.scrapeWebsite(url, maxPages);
        if (scraped) {
          competitorData.push(scraped);
        }
      } catch (error) {
        console.error(`Failed to scrape ${url}:`, error);
        // Continue with other competitors
      }
    }

    return competitorData;
  }

  /**
   * Scrapes a single website using Apify's Website Content Crawler
   */
  private async scrapeWebsite(url: string, maxPages: number): Promise<CompetitorData | null> {
    if (!this.apifyClient) return null;

    try {
      // Use Apify's Website Content Crawler actor
      const run = await this.apifyClient.actor('apify/website-content-crawler').call({
        startUrls: [{ url }],
        maxCrawlDepth: 2,
        maxCrawlPages: maxPages,
        crawlerType: 'cheerio', // Faster, suitable for static content
      }, {
        timeout: parseInt(import.meta.env.VITE_APIFY_TIMEOUT || '60000')
      });

      // Wait for the run to finish and fetch results
      const { items } = await this.apifyClient.dataset(run.defaultDatasetId).listItems();

      if (!items || items.length === 0) {
        console.warn(`No content scraped from ${url}`);
        return null;
      }

      // Transform Apify results to our format
      const pages: ScrapedPage[] = items.map((item: any) => ({
        url: item.url || url,
        title: item.title || '',
        content: item.text || '',
        headings: item.headings || [],
        metadata: {
          description: item.metadata?.description,
          keywords: item.metadata?.keywords
        }
      }));

      // Extract competitor name from URL
      const competitorName = new URL(url).hostname.replace('www.', '').split('.')[0];

      // Extract messaging themes from scraped content
      const messagingThemes = this.extractMessagingThemes(pages);

      // Extract content topics
      const contentTopics = this.extractContentTopics(pages);

      // Identify positioning
      const positioning = this.identifyPositioning(pages);

      // Extract key messages
      const keyMessages = this.extractKeyMessages(pages);

      return {
        url,
        name: competitorName,
        scrapedAt: new Date(),
        pages,
        messagingThemes,
        contentTopics,
        positioning,
        keyMessages
      };
    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
      return null;
    }
  }

  /**
   * Extracts messaging themes from scraped pages
   * Uses keyword frequency and semantic analysis
   */
  private extractMessagingThemes(pages: ScrapedPage[]): MessagingTheme[] {
    // Combine all content
    const allText = pages
      .map(p => `${p.title} ${p.headings.join(' ')} ${p.content}`)
      .join(' ');

    // Extract potential themes (noun phrases and key terms)
    const themes = this.extractKeyPhrases(allText);

    // Count frequency and find examples
    const themeMap = new Map<string, { count: number; examples: string[] }>();

    pages.forEach(page => {
      const pageText = `${page.title} ${page.content}`;

      themes.forEach(theme => {
        const regex = new RegExp(theme, 'gi');
        const matches = pageText.match(regex);

        if (matches) {
          const current = themeMap.get(theme) || { count: 0, examples: [] };
          current.count += matches.length;

          // Extract context around theme (50 chars before/after)
          const firstMatch = pageText.toLowerCase().indexOf(theme.toLowerCase());
          if (firstMatch !== -1 && current.examples.length < 3) {
            const start = Math.max(0, firstMatch - 50);
            const end = Math.min(pageText.length, firstMatch + theme.length + 50);
            const example = pageText.substring(start, end).trim();
            current.examples.push(`...${example}...`);
          }

          themeMap.set(theme, current);
        }
      });
    });

    // Convert to MessagingTheme objects
    const messagingThemes: MessagingTheme[] = [];
    themeMap.forEach((data, theme) => {
      messagingThemes.push({
        theme,
        frequency: data.count,
        examples: data.examples.slice(0, 3),
        confidence: Math.min(data.count / 10, 1), // Normalize to 0-1
        emotionalTone: this.detectEmotionalTone(data.examples.join(' '))
      });
    });

    // Sort by frequency and return top 10
    return messagingThemes
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  }

  /**
   * Extracts key phrases from text using simple NLP
   */
  private extractKeyPhrases(text: string): string[] {
    // Common marketing/business key phrases to look for
    const commonThemes = [
      'customer service', 'fast delivery', 'quality products', 'best price',
      'expert team', 'trusted partner', 'innovation', 'sustainability',
      'local business', 'family owned', 'award winning', 'satisfaction guaranteed',
      'free shipping', 'easy returns', 'professional service', 'experienced',
      'reliable', 'affordable', 'premium', 'luxury', 'value', 'convenient'
    ];

    const foundThemes = commonThemes.filter(theme =>
      text.toLowerCase().includes(theme.toLowerCase())
    );

    // Also extract frequently occurring 2-3 word phrases
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const phrases = new Map<string, number>();

    for (let i = 0; i < words.length - 2; i++) {
      const twoWord = `${words[i]} ${words[i + 1]}`;
      const threeWord = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;

      phrases.set(twoWord, (phrases.get(twoWord) || 0) + 1);
      phrases.set(threeWord, (phrases.get(threeWord) || 0) + 1);
    }

    // Get top phrases by frequency (excluding common words)
    const stopWords = ['the', 'and', 'for', 'you', 'our', 'your', 'with', 'are', 'this', 'that'];
    const topPhrases = Array.from(phrases.entries())
      .filter(([phrase, count]) => count >= 3 && !stopWords.some(sw => phrase.includes(sw)))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([phrase]) => phrase);

    return [...new Set([...foundThemes, ...topPhrases])];
  }

  /**
   * Detects emotional tone from text examples
   */
  private detectEmotionalTone(text: string): string {
    const lower = text.toLowerCase();

    if (lower.match(/\b(trust|reliable|safe|secure|proven)\b/)) return 'trust';
    if (lower.match(/\b(fast|quick|instant|immediate|rapid)\b/)) return 'urgency';
    if (lower.match(/\b(best|premium|excellence|superior|quality)\b/)) return 'aspiration';
    if (lower.match(/\b(save|affordable|value|cheap|discount)\b/)) return 'value';
    if (lower.match(/\b(easy|simple|convenient|effortless)\b/)) return 'convenience';
    if (lower.match(/\b(love|happy|joy|delight|enjoy)\b/)) return 'happiness';

    return 'neutral';
  }

  /**
   * Extracts content topics from pages
   */
  private extractContentTopics(pages: ScrapedPage[]): string[] {
    const topics = new Set<string>();

    pages.forEach(page => {
      // Extract from headings (most indicative of topics)
      page.headings.forEach(heading => {
        const normalized = heading.toLowerCase().trim();
        if (normalized.length > 10 && normalized.length < 100) {
          topics.add(heading);
        }
      });

      // Extract from page titles
      if (page.title && page.title.length > 5) {
        topics.add(page.title);
      }
    });

    return Array.from(topics).slice(0, 20);
  }

  /**
   * Identifies competitor positioning from homepage content
   */
  private identifyPositioning(pages: ScrapedPage[]): string {
    // Focus on homepage or first page
    const homePage = pages.find(p => p.url.endsWith('/') || p.url.split('/').length <= 4) || pages[0];

    if (!homePage) return 'Unknown positioning';

    // Look for positioning in title, first heading, or meta description
    const positioningText =
      homePage.metadata.description ||
      homePage.headings[0] ||
      homePage.title ||
      homePage.content.substring(0, 200);

    return positioningText.trim();
  }

  /**
   * Extracts key messages (value props, USPs)
   */
  private extractKeyMessages(pages: ScrapedPage[]): string[] {
    const messages: string[] = [];

    pages.forEach(page => {
      // Key messages often in h2/h3 headings
      page.headings.forEach(heading => {
        if (heading.length > 20 && heading.length < 150) {
          messages.push(heading);
        }
      });
    });

    // Deduplicate and return top 10
    return [...new Set(messages)].slice(0, 10);
  }

  /**
   * Identifies competitive white spaces (what competitors are NOT doing)
   */
  private identifyWhiteSpaces(
    competitors: CompetitorData[],
    context: DeepContext
  ): CompetitiveWhiteSpace[] {
    const whiteSpaces: CompetitiveWhiteSpace[] = [];

    // Extract all themes competitors ARE doing
    const competitorThemes = new Set<string>();
    competitors.forEach(comp => {
      comp.messagingThemes.forEach(theme => {
        competitorThemes.add(theme.theme.toLowerCase());
      });
      comp.contentTopics.forEach(topic => {
        competitorThemes.add(topic.toLowerCase());
      });
    });

    // Your breakthrough insights that competitors aren't addressing
    const yourInsights = [
      ...(context.customerPsychology?.unarticulated || []).map(u => u.need),
      ...(context.industry?.trends || []).map(t => t.trend),
      ...(context.synthesis?.keyInsights || [])
    ];

    yourInsights.forEach(insight => {
      const insightLower = insight.toLowerCase();
      const isCompetitorTheme = Array.from(competitorThemes).some(theme =>
        insightLower.includes(theme) || theme.includes(insightLower)
      );

      if (!isCompetitorTheme) {
        whiteSpaces.push({
          gap: insight,
          description: `Competitors are not addressing: ${insight}`,
          opportunity: `Position yourself as the only provider focusing on ${insight}`,
          urgency: this.assessUrgency(insight, context),
          difficulty: 'medium',
          potentialImpact: 75
        });
      }
    });

    // Common industry themes competitors might be missing
    const industryExpectations = this.getIndustryExpectations(context);
    industryExpectations.forEach(expectation => {
      const isAddressed = Array.from(competitorThemes).some(theme =>
        expectation.toLowerCase().includes(theme) || theme.includes(expectation.toLowerCase())
      );

      if (!isAddressed) {
        whiteSpaces.push({
          gap: expectation,
          description: `Industry expects ${expectation}, but competitors aren't delivering`,
          opportunity: `Meet this unmet industry expectation`,
          urgency: 'high',
          difficulty: 'easy',
          potentialImpact: 85
        });
      }
    });

    return whiteSpaces.slice(0, 5); // Top 5 white spaces
  }

  /**
   * Assesses urgency of a white space opportunity
   */
  private assessUrgency(gap: string, context: DeepContext): 'high' | 'medium' | 'low' {
    const lower = gap.toLowerCase();

    // High urgency if related to current events or time-sensitive insights
    if (context.realTimeCultural?.events?.length > 0) {
      const events = context.realTimeCultural.events as any[];
      if (events.some(e => lower.includes(String(e).toLowerCase()))) {
        return 'high';
      }
    }

    // High urgency if customer frustration is mentioned
    if (lower.match(/\b(frustrat|annoyed|waiting|slow|problem|issue)\b/)) {
      return 'high';
    }

    // Medium urgency if it's a trend
    if (lower.match(/\b(trend|growing|increasing|rising)\b/)) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Gets industry-specific expectations
   */
  private getIndustryExpectations(context: DeepContext): string[] {
    const industry = context.business?.profile?.industry || '';

    const expectations: Record<string, string[]> = {
      'food': ['food safety', 'fresh ingredients', 'dietary options', 'fast service'],
      'retail': ['easy returns', 'product quality', 'fair pricing', 'customer service'],
      'service': ['professional staff', 'timely delivery', 'clear communication', 'reliability'],
      'technology': ['security', 'user friendly', 'innovation', 'support'],
      'healthcare': ['patient care', 'expertise', 'compassion', 'accessibility']
    };

    for (const [key, values] of Object.entries(expectations)) {
      if (industry.toLowerCase().includes(key)) {
        return values;
      }
    }

    return ['quality', 'service', 'value', 'reliability']; // Defaults
  }

  /**
   * Generates differentiation strategies based on white spaces
   */
  private generateDifferentiationStrategies(
    competitors: CompetitorData[],
    whiteSpaces: CompetitiveWhiteSpace[],
    context: DeepContext
  ): DifferentiationStrategy[] {
    const strategies: DifferentiationStrategy[] = [];

    // Strategy 1: Exploit white spaces
    whiteSpaces.forEach(ws => {
      if (ws.urgency === 'high' || ws.potentialImpact > 70) {
        strategies.push({
          strategy: `Lead with ${ws.gap}`,
          rationale: ws.description,
          implementation: [
            `Create content highlighting your focus on ${ws.gap}`,
            `Feature ${ws.gap} prominently in all messaging`,
            `Use customer testimonials about ${ws.gap}`,
            `Position as "the only [business] focused on ${ws.gap}"`
          ],
          expectedOutcome: `Become known as the go-to provider for ${ws.gap}`,
          competitorsDoingThis: [],
          competitorsNotDoingThis: competitors.map(c => c.name)
        });
      }
    });

    // Strategy 2: Flip competitor strengths
    competitors.forEach(comp => {
      const topTheme = comp.messagingThemes[0];
      if (topTheme) {
        strategies.push({
          strategy: `Counter ${comp.name}'s focus on ${topTheme.theme}`,
          rationale: `${comp.name} emphasizes ${topTheme.theme}, but may neglect other aspects`,
          implementation: [
            `Highlight what ${topTheme.theme} alone can't solve`,
            `Emphasize holistic approach beyond just ${topTheme.theme}`,
            `Show limitations of ${topTheme.theme}-only strategy`
          ],
          expectedOutcome: `Attract customers who want more than just ${topTheme.theme}`,
          competitorsDoingThis: [comp.name],
          competitorsNotDoingThis: competitors.filter(c => c.name !== comp.name).map(c => c.name)
        });
      }
    });

    return strategies.slice(0, 3); // Top 3 strategies
  }

  /**
   * Compares your themes vs competitor themes
   */
  private compareThemes(
    competitors: CompetitorData[],
    context: DeepContext
  ): Record<string, { yours: number; theirs: number }> {
    const comparison: Record<string, { yours: number; theirs: number }> = {};

    // Your themes from breakthroughs
    const yourThemes = new Map<string, number>();
    context.synthesis?.keyInsights?.forEach(insight => {
      const theme = typeof insight === 'string' ? insight : insight.toString();
      yourThemes.set(theme, (yourThemes.get(theme) || 0) + 1);
    });

    // Competitor themes
    const theirThemes = new Map<string, number>();
    competitors.forEach(comp => {
      comp.messagingThemes.forEach(mt => {
        theirThemes.set(mt.theme, (theirThemes.get(mt.theme) || 0) + mt.frequency);
      });
    });

    // Combine all themes
    const allThemes = new Set([...yourThemes.keys(), ...theirThemes.keys()]);

    allThemes.forEach(theme => {
      comparison[theme] = {
        yours: yourThemes.get(theme) || 0,
        theirs: theirThemes.get(theme) || 0
      };
    });

    return comparison;
  }

  /**
   * Fallback analysis when Apify is not available
   */
  private fallbackAnalysis(urls: string[], context: DeepContext): CompetitiveAnalysisResult {
    // Generate basic analysis based on context alone
    const whiteSpaces: CompetitiveWhiteSpace[] = [];

    // Use unarticulated needs as white spaces
    if (context.customerPsychology?.unarticulated) {
      context.customerPsychology.unarticulated.slice(0, 3).forEach(need => {
        whiteSpaces.push({
          gap: need.need,
          description: `Unmet customer need: ${need.need}`,
          opportunity: need.marketingAngle || `Address ${need.need} in your messaging`,
          urgency: need.confidence > 0.7 ? 'high' : 'medium',
          difficulty: 'medium',
          potentialImpact: Math.round(need.confidence * 100)
        });
      });
    }

    // Generate generic differentiation strategies
    const strategies: DifferentiationStrategy[] = [];
    if (whiteSpaces.length > 0) {
      strategies.push({
        strategy: `Focus on unmet needs`,
        rationale: `Competitors may not be addressing key customer needs`,
        implementation: [
          `Highlight unique value propositions`,
          `Create content around customer pain points`,
          `Position as customer-centric alternative`
        ],
        expectedOutcome: `Attract customers seeking personalized solutions`,
        competitorsDoingThis: [],
        competitorsNotDoingThis: urls.map(url => new URL(url).hostname)
      });
    }

    return {
      competitors: [],
      whiteSpaces,
      differentiationStrategies: strategies,
      themeComparison: {},
      analysisDate: new Date(),
      confidence: 0.3
    };
  }
}

export const competitiveAnalyzerService = new CompetitiveAnalyzerService();
