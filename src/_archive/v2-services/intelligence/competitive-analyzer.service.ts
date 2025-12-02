/**
 * Competitive Analyzer Service
 *
 * Comprehensive competitive intelligence system that scrapes competitor content,
 * extracts messaging themes, identifies white space opportunities, and
 * calculates differentiation scores.
 */

import { v4 as uuidv4 } from 'uuid';
import { themeExtractorService } from './theme-extractor.service';
import {
  DEFAULT_COMPETITIVE_CONFIG,
  type Competitor,
  type CompetitorContent,
  type CompetitiveAnalysisConfig,
  type CompetitiveAnalysisInput,
  type CompetitiveAnalysisReport,
  type ContentGap,
  type DifferentiationScore,
  type ExtractedTheme,
  type WhiteSpaceOpportunity,
} from '@/types/v2/competitive.types';

// SECURITY: Use Edge Functions for secure API access
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const WEBSITE_CRAWLER_ACTOR = 'apify/website-content-crawler';

class CompetitiveAnalyzerService {
  /**
   * Run full competitive analysis
   */
  async analyzeCompetitors(input: CompetitiveAnalysisInput): Promise<CompetitiveAnalysisReport> {
    const config: CompetitiveAnalysisConfig = {
      ...DEFAULT_COMPETITIVE_CONFIG,
      ...input.config,
    };

    console.log(`[CompetitiveAnalyzer] Starting analysis for ${input.competitors.length} competitors`);

    // Scrape competitor content
    const competitorContent = await this.scrapeCompetitorContent(
      input.competitors,
      config
    );

    // Get or scrape your content
    const yourContent = input.brandContent || await this.scrapeContent(
      input.brandUrl,
      'your-brand',
      'Your Brand',
      config
    );

    // Extract themes from both
    const yourThemes = themeExtractorService.extractThemes({
      content: yourContent,
      minFrequency: 1,
    });

    const competitorThemeResult = themeExtractorService.extractThemes({
      content: competitorContent,
      minFrequency: config.minThemeFrequency,
    });

    // Find unique and common themes
    const uniqueThemes = themeExtractorService.findUniqueThemes(
      yourThemes.themes,
      competitorThemeResult.themes
    );

    const commonThemes = themeExtractorService.findCommonThemes(
      yourThemes.themes,
      competitorThemeResult.themes
    );

    // Calculate competitor coverage for clusters
    const clusters = competitorThemeResult.clusters.map(cluster => ({
      ...cluster,
      competitorCoverage: this.calculateCompetitorCoverage(
        cluster.themes,
        input.competitors.length
      ),
    }));

    // Identify white space opportunities
    const whiteSpaces = this.identifyWhiteSpaces(
      yourThemes.themes,
      competitorThemeResult.themes,
      clusters
    );

    // Identify content gaps
    const contentGaps = this.identifyContentGaps(
      yourThemes.themes,
      competitorThemeResult.themes,
      input.competitors.length
    );

    // Calculate differentiation score
    const differentiationScore = this.calculateDifferentiationScore(
      yourThemes.themes,
      competitorThemeResult.themes,
      uniqueThemes,
      commonThemes,
      yourContent
    );

    // Build report
    const report: CompetitiveAnalysisReport = {
      id: uuidv4(),
      brandId: input.brandId,
      analyzedAt: new Date(),
      competitors: input.competitors,
      yourContent,
      competitorContent,
      themes: {
        yours: yourThemes.themes,
        competitors: competitorThemeResult.themes,
        common: commonThemes,
        unique: uniqueThemes,
      },
      clusters,
      whiteSpaces,
      contentGaps,
      differentiationScore,
      summary: {
        totalCompetitors: input.competitors.length,
        totalContent: competitorContent.length + yourContent.length,
        averageCompetitorThemes: competitorThemeResult.themes.length / Math.max(1, input.competitors.length),
        yourThemeCount: yourThemes.themes.length,
        uniqueThemePercentage: yourThemes.themes.length > 0
          ? (uniqueThemes.length / yourThemes.themes.length) * 100
          : 0,
        topOpportunities: whiteSpaces.slice(0, 3).map(ws => ws.area),
      },
    };

    console.log(`[CompetitiveAnalyzer] Analysis complete. Differentiation score: ${differentiationScore.overall}`);

    return report;
  }

  /**
   * Scrape content from all competitors
   */
  private async scrapeCompetitorContent(
    competitors: Competitor[],
    config: CompetitiveAnalysisConfig
  ): Promise<CompetitorContent[]> {
    const allContent: CompetitorContent[] = [];

    for (const competitor of competitors.slice(0, config.maxCompetitors)) {
      try {
        const content = await this.scrapeContent(
          competitor.url,
          competitor.id,
          competitor.name,
          config
        );
        allContent.push(...content);
      } catch (error) {
        console.error(`[CompetitiveAnalyzer] Failed to scrape ${competitor.name}:`, error);
      }
    }

    return allContent;
  }

  /**
   * Scrape content from a single website using Apify
   */
  private async scrapeContent(
    url: string,
    competitorId: string,
    competitorName: string,
    config: CompetitiveAnalysisConfig
  ): Promise<CompetitorContent[]> {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn('[CompetitiveAnalyzer] Supabase credentials not configured, returning mock data');
      return this.getMockContent(competitorId, competitorName, url);
    }

    try {
      const input = {
        startUrls: [{ url }],
        maxCrawlPages: config.maxContentPerCompetitor,
        maxCrawlDepth: 2,
        includeUrlGlobs: [`${url}/**`],
      };

      // Use Edge Function for secure Apify access (no API keys exposed)
      const runResponse = await fetch(
        `${SUPABASE_URL}/functions/v1/apify-scraper`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            actorId: WEBSITE_CRAWLER_ACTOR,
            input
          }),
        }
      );

      if (!runResponse.ok) {
        throw new Error(`Failed to start Apify actor: ${runResponse.status}`);
      }

      // Edge Function handles polling and returns results directly
      const responseData = await runResponse.json();
      const results = responseData.success ? responseData.data : [];

      // Convert to CompetitorContent
      return results.map((item: any) => ({
        competitorId,
        competitorName,
        url: item.url,
        title: item.title || '',
        content: item.text || '',
        contentType: this.detectContentType(item.url),
        scrapedAt: new Date(),
        metadata: {
          author: item.metadata?.author,
          keywords: item.metadata?.keywords,
          description: item.description,
        },
      }));

    } catch (error) {
      console.error(`[CompetitiveAnalyzer] Scraping error for ${url}:`, error);
      return this.getMockContent(competitorId, competitorName, url);
    }
  }

  /**
   * Wait for Apify actor to complete
   */
  private async waitForActorResults(runId: string, timeout: number): Promise<any[]> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout * 1000) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const statusResponse = await fetch(
        `${APIFY_API_URL}/actor-runs/${runId}?token=${APIFY_API_KEY}`
      );

      if (!statusResponse.ok) continue;

      const statusData = await statusResponse.json();
      const status = statusData.data.status;

      if (status === 'SUCCEEDED') {
        const datasetId = statusData.data.defaultDatasetId;
        const datasetResponse = await fetch(
          `${APIFY_API_URL}/datasets/${datasetId}/items?token=${APIFY_API_KEY}`
        );

        if (datasetResponse.ok) {
          return await datasetResponse.json();
        }
      }

      if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) {
        throw new Error(`Actor run ${status}`);
      }
    }

    throw new Error('Scraping timed out');
  }

  /**
   * Get mock content for testing
   */
  private getMockContent(
    competitorId: string,
    competitorName: string,
    url: string
  ): CompetitorContent[] {
    return [
      {
        competitorId,
        competitorName,
        url: `${url}/`,
        title: `${competitorName} - Home`,
        content: `Welcome to ${competitorName}. We provide excellent service and innovative solutions for your business needs. Our team of experts delivers results-driven outcomes with customer satisfaction guarantee.`,
        contentType: 'landing',
        scrapedAt: new Date(),
      },
      {
        competitorId,
        competitorName,
        url: `${url}/about`,
        title: `About ${competitorName}`,
        content: `Learn about our company values and mission. We believe in quality, innovation, and customer success. Our proven track record speaks for itself with hundreds of satisfied clients.`,
        contentType: 'about',
        scrapedAt: new Date(),
      },
    ];
  }

  /**
   * Detect content type from URL
   */
  private detectContentType(url: string): CompetitorContent['contentType'] {
    const lower = url.toLowerCase();

    if (lower.includes('/blog') || lower.includes('/article')) return 'blog';
    if (lower.includes('/about') || lower.includes('/team')) return 'about';
    if (lower.includes('/product') || lower.includes('/pricing')) return 'product';
    if (lower.includes('/service')) return 'service';
    if (lower === '/' || lower.endsWith('.com') || lower.endsWith('.com/')) return 'landing';

    return 'other';
  }

  /**
   * Calculate competitor coverage percentage for a theme cluster
   */
  private calculateCompetitorCoverage(
    themes: ExtractedTheme[],
    totalCompetitors: number
  ): number {
    if (totalCompetitors === 0) return 0;

    const competitorIds = new Set(themes.flatMap(t => t.competitorIds));
    return (competitorIds.size / totalCompetitors) * 100;
  }

  /**
   * Identify white space opportunities
   */
  identifyWhiteSpaces(
    yourThemes: ExtractedTheme[],
    competitorThemes: ExtractedTheme[],
    clusters: any[]
  ): WhiteSpaceOpportunity[] {
    const opportunities: WhiteSpaceOpportunity[] = [];
    const yourThemeSet = new Set(yourThemes.map(t => t.theme.toLowerCase()));

    // Find themes competitors use heavily that you don't
    const heavyCompetitorThemes = competitorThemes
      .filter(t => t.frequency >= 3 && !yourThemeSet.has(t.theme.toLowerCase()));

    for (const theme of heavyCompetitorThemes) {
      const score = Math.min(100, theme.frequency * 15);

      opportunities.push({
        id: uuidv4(),
        area: theme.theme,
        description: `Competitors frequently discuss "${theme.theme}" but you don't cover this topic`,
        competitorGap: theme.competitorIds,
        yourCoverage: false,
        opportunityScore: score,
        priority: score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low',
        suggestedAngle: `Create content around ${theme.theme} to compete in this space`,
        keywords: theme.keywords,
      });
    }

    // Find underserved themes (low competitor coverage)
    const underservedThemes = competitorThemes
      .filter(t => t.frequency === 1 || t.competitorIds.length === 1);

    for (const theme of underservedThemes.slice(0, 5)) {
      opportunities.push({
        id: uuidv4(),
        area: theme.theme,
        description: `"${theme.theme}" is underserved by competitors - opportunity to own this space`,
        competitorGap: theme.competitorIds,
        yourCoverage: yourThemeSet.has(theme.theme.toLowerCase()),
        opportunityScore: 60,
        priority: 'medium',
        suggestedAngle: `Establish thought leadership in ${theme.theme}`,
        keywords: theme.keywords,
      });
    }

    // Sort by opportunity score
    opportunities.sort((a, b) => b.opportunityScore - a.opportunityScore);

    return opportunities;
  }

  /**
   * Identify content gaps
   */
  identifyContentGaps(
    yourThemes: ExtractedTheme[],
    competitorThemes: ExtractedTheme[],
    totalCompetitors: number
  ): ContentGap[] {
    const gaps: ContentGap[] = [];
    const yourThemeSet = new Set(yourThemes.map(t => t.theme.toLowerCase()));

    for (const compTheme of competitorThemes) {
      const competitorUsage = (compTheme.competitorIds.length / totalCompetitors) * 100;
      const yourUsage = yourThemeSet.has(compTheme.theme.toLowerCase());

      // Significant gap: >50% of competitors use it but you don't
      if (competitorUsage >= 50 && !yourUsage) {
        gaps.push({
          id: uuidv4(),
          theme: compTheme.theme,
          competitorUsage,
          yourUsage,
          gapType: 'missing',
          recommendation: `Add content about "${compTheme.theme}" - ${Math.round(competitorUsage)}% of competitors cover this`,
          impact: competitorUsage >= 70 ? 'high' : 'medium',
        });
      }

      // Moderate gap: 30-50% of competitors use it
      else if (competitorUsage >= 30 && competitorUsage < 50 && !yourUsage) {
        gaps.push({
          id: uuidv4(),
          theme: compTheme.theme,
          competitorUsage,
          yourUsage,
          gapType: 'opportunity',
          recommendation: `Consider adding "${compTheme.theme}" to your content mix`,
          impact: 'low',
        });
      }
    }

    // Sort by impact
    const impactOrder = { high: 0, medium: 1, low: 2 };
    gaps.sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact]);

    return gaps;
  }

  /**
   * Calculate differentiation score
   */
  calculateDifferentiationScore(
    yourThemes: ExtractedTheme[],
    competitorThemes: ExtractedTheme[],
    uniqueThemes: ExtractedTheme[],
    commonThemes: ExtractedTheme[],
    yourContent: CompetitorContent[]
  ): DifferentiationScore {
    // Unique themes score
    const uniqueThemesScore = yourThemes.length > 0
      ? (uniqueThemes.length / yourThemes.length) * 100
      : 0;

    // Messaging clarity (based on theme categorization)
    const categorizedThemes = yourThemes.filter(t => t.category).length;
    const messagingClarity = yourThemes.length > 0
      ? (categorizedThemes / yourThemes.length) * 100
      : 0;

    // Value proposition strength
    const valuePropThemes = yourThemes.filter(t =>
      t.category === 'value-prop' || t.category === 'benefit'
    ).length;
    const valueProposition = Math.min(100, valuePropThemes * 20);

    // Content quality (based on content diversity)
    const contentTypes = new Set(yourContent.map(c => c.contentType));
    const contentQuality = Math.min(100, contentTypes.size * 20);

    // Brand voice (based on consistent sentiment)
    const sentiments = yourThemes.map(t => t.sentiment);
    const dominantSentiment = this.getMostFrequent(sentiments);
    const consistentSentiments = sentiments.filter(s => s === dominantSentiment).length;
    const brandVoice = yourThemes.length > 0
      ? (consistentSentiments / yourThemes.length) * 100
      : 0;

    // Calculate overall score
    const overall = Math.round(
      uniqueThemesScore * 0.3 +
      messagingClarity * 0.2 +
      valueProposition * 0.2 +
      contentQuality * 0.15 +
      brandVoice * 0.15
    );

    // Identify strengths, weaknesses, opportunities
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const opportunities: string[] = [];

    if (uniqueThemesScore >= 50) {
      strengths.push(`Strong differentiation with ${uniqueThemes.length} unique themes`);
    } else {
      weaknesses.push(`Low differentiation - only ${Math.round(uniqueThemesScore)}% unique themes`);
    }

    if (valueProposition >= 60) {
      strengths.push('Clear value proposition messaging');
    } else {
      opportunities.push('Strengthen value proposition in content');
    }

    if (contentQuality >= 60) {
      strengths.push('Diverse content mix');
    } else {
      opportunities.push('Diversify content types');
    }

    if (commonThemes.length > 0) {
      weaknesses.push(`${commonThemes.length} themes overlap with competitors`);
    }

    return {
      overall,
      breakdown: {
        uniqueThemes: Math.round(uniqueThemesScore),
        messagingClarity: Math.round(messagingClarity),
        valueProposition: Math.round(valueProposition),
        contentQuality: Math.round(contentQuality),
        brandVoice: Math.round(brandVoice),
      },
      strengths,
      weaknesses,
      opportunities,
    };
  }

  /**
   * Get most frequent item in array
   */
  private getMostFrequent<T>(arr: T[]): T | undefined {
    const counts = new Map<T, number>();
    let maxCount = 0;
    let mostFrequent: T | undefined;

    for (const item of arr) {
      const count = (counts.get(item) || 0) + 1;
      counts.set(item, count);

      if (count > maxCount) {
        maxCount = count;
        mostFrequent = item;
      }
    }

    return mostFrequent;
  }
}

export const competitiveAnalyzerService = new CompetitiveAnalyzerService();
