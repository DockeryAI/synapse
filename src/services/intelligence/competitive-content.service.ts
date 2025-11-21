/**
 * Competitive Content Analysis Service
 *
 * Analyzes competitor messaging and identifies differentiation opportunities.
 *
 * Created: November 21, 2025
 */

import { ApifyAPI } from './apify-api';
import { intelligenceCache } from './intelligence-cache.service';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface CompetitorContent {
  url: string;
  title: string;
  themes: string[];
  claims: string[];
  tone: 'formal' | 'casual' | 'technical' | 'emotional';
  triggerTypes: string[];
  uniqueAngles: string[];
}

export interface ContentGap {
  topic: string;
  competitorCoverage: number; // 0-100
  opportunityScore: number; // 0-100
  suggestedAngles: string[];
}

export interface DifferentiationAnalysis {
  competitors: CompetitorContent[];
  commonThemes: string[];
  saturatedTopics: string[];
  whiteSpaceOpportunities: ContentGap[];
  differentiationScore: number; // 0-100
  recommendations: string[];
}

// Common messaging themes by industry
const INDUSTRY_THEMES: Record<string, string[]> = {
  insurance: ['coverage', 'protection', 'claims', 'value', 'trust', 'experience', 'service'],
  saas: ['efficiency', 'automation', 'integration', 'scale', 'productivity', 'ROI'],
  healthcare: ['care', 'expertise', 'outcomes', 'compassion', 'technology', 'experience'],
  legal: ['expertise', 'results', 'dedication', 'trust', 'experience', 'advocacy'],
  finance: ['returns', 'security', 'growth', 'expertise', 'trust', 'planning'],
  realestate: ['dream home', 'investment', 'local expertise', 'market knowledge', 'service'],
  retail: ['quality', 'value', 'selection', 'service', 'experience', 'convenience'],
  restaurant: ['fresh', 'quality', 'atmosphere', 'service', 'taste', 'experience'],
  fitness: ['results', 'transformation', 'community', 'expertise', 'motivation', 'health'],
  education: ['outcomes', 'success', 'expertise', 'support', 'innovation', 'growth']
};

class CompetitiveContentService {
  /**
   * Analyze competitor content and identify differentiation opportunities
   */
  async analyzeCompetitors(
    competitorUrls: string[],
    industry: string,
    brandId: string
  ): Promise<DifferentiationAnalysis> {
    console.log(`[CompetitiveContent] Analyzing ${competitorUrls.length} competitors...`);

    // Check cache
    const cacheKey = `competitive:${brandId}:${competitorUrls.slice(0, 3).join('-')}`;
    const cached = await intelligenceCache.get<DifferentiationAnalysis>(cacheKey);
    if (cached) {
      console.log('[CompetitiveContent] Returning cached analysis');
      return cached;
    }

    const competitors: CompetitorContent[] = [];

    // Scrape and analyze each competitor
    for (const url of competitorUrls.slice(0, 5)) { // Limit to 5
      try {
        const content = await this.scrapeAndAnalyze(url, industry);
        if (content) {
          competitors.push(content);
        }
      } catch (error) {
        console.warn(`[CompetitiveContent] Failed to analyze ${url}:`, error);
      }
    }

    if (competitors.length === 0) {
      return this.getEmptyAnalysis();
    }

    // Extract common themes
    const themeFrequency = new Map<string, number>();
    for (const competitor of competitors) {
      for (const theme of competitor.themes) {
        themeFrequency.set(theme, (themeFrequency.get(theme) || 0) + 1);
      }
    }

    const commonThemes = Array.from(themeFrequency.entries())
      .filter(([_, count]) => count >= competitors.length * 0.5)
      .map(([theme]) => theme);

    // Identify saturated topics (everyone covers)
    const saturatedTopics = Array.from(themeFrequency.entries())
      .filter(([_, count]) => count >= competitors.length * 0.8)
      .map(([theme]) => theme);

    // Find white space opportunities
    const industryThemes = INDUSTRY_THEMES[industry.toLowerCase()] || INDUSTRY_THEMES.retail;
    const whiteSpaceOpportunities = this.findWhiteSpace(
      industryThemes,
      themeFrequency,
      competitors.length
    );

    // Calculate differentiation score
    const differentiationScore = this.calculateDifferentiationScore(
      competitors,
      whiteSpaceOpportunities
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      commonThemes,
      saturatedTopics,
      whiteSpaceOpportunities,
      competitors
    );

    const analysis: DifferentiationAnalysis = {
      competitors,
      commonThemes,
      saturatedTopics,
      whiteSpaceOpportunities,
      differentiationScore,
      recommendations
    };

    // Cache the result
    await intelligenceCache.set(cacheKey, analysis, {
      dataType: 'competitive_content',
      sourceApi: 'competitive-content',
      brandId,
      ttlMinutes: 1440 // 24 hours
    });

    console.log(`[CompetitiveContent] ✅ Analysis complete: ${differentiationScore}/100 differentiation score`);
    return analysis;
  }

  /**
   * Scrape and analyze a single competitor's content
   */
  private async scrapeAndAnalyze(
    url: string,
    industry: string
  ): Promise<CompetitorContent | null> {
    try {
      // Try Apify scraping
      const scraped = await ApifyAPI.scrapeWebsiteContent(url);

      if (!scraped || !scraped.text) {
        return null;
      }

      const contentLower = scraped.text.toLowerCase();

      // Extract themes
      const themes = this.extractThemes(contentLower, industry);

      // Extract claims (statements with "we", "our")
      const claims = this.extractClaims(scraped.text);

      // Detect tone
      const tone = this.detectTone(contentLower);

      // Identify trigger types used
      const triggerTypes = this.identifyTriggers(contentLower);

      // Find unique angles (headings, titles)
      const uniqueAngles = this.extractAngles(scraped.headings || [], scraped.title || '');

      return {
        url,
        title: scraped.title || url,
        themes,
        claims,
        tone,
        triggerTypes,
        uniqueAngles
      };
    } catch (error) {
      console.warn(`[CompetitiveContent] Scraping failed for ${url}:`, error);
      return null;
    }
  }

  /**
   * Extract themes from content
   */
  private extractThemes(content: string, industry: string): string[] {
    const themes: string[] = [];
    const industryThemes = INDUSTRY_THEMES[industry.toLowerCase()] || INDUSTRY_THEMES.retail;

    for (const theme of industryThemes) {
      if (content.includes(theme)) {
        themes.push(theme);
      }
    }

    // Add generic themes
    const genericThemes = [
      'quality', 'service', 'experience', 'value', 'trust', 'expertise',
      'innovation', 'results', 'support', 'community', 'personalized'
    ];

    for (const theme of genericThemes) {
      if (content.includes(theme) && !themes.includes(theme)) {
        themes.push(theme);
      }
    }

    return themes.slice(0, 10);
  }

  /**
   * Extract claims (we/our statements)
   */
  private extractClaims(content: string): string[] {
    const claims: string[] = [];
    const sentences = content.split(/[.!?]+/);

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (
        (trimmed.toLowerCase().startsWith('we ') ||
          trimmed.toLowerCase().includes(' we ') ||
          trimmed.toLowerCase().startsWith('our ')) &&
        trimmed.length > 20 &&
        trimmed.length < 200
      ) {
        claims.push(trimmed);
      }
    }

    return claims.slice(0, 5);
  }

  /**
   * Detect content tone
   */
  private detectTone(content: string): 'formal' | 'casual' | 'technical' | 'emotional' {
    const scores = {
      formal: 0,
      casual: 0,
      technical: 0,
      emotional: 0
    };

    // Formal indicators
    if (content.includes('therefore') || content.includes('furthermore')) scores.formal += 2;
    if (content.includes('pursuant') || content.includes('regarding')) scores.formal += 2;

    // Casual indicators
    if (content.includes('awesome') || content.includes('cool')) scores.casual += 2;
    if (content.includes("let's") || content.includes('hey')) scores.casual += 2;

    // Technical indicators
    if (content.includes('integration') || content.includes('api')) scores.technical += 2;
    if (content.includes('scalable') || content.includes('infrastructure')) scores.technical += 2;

    // Emotional indicators
    if (content.includes('love') || content.includes('passion')) scores.emotional += 2;
    if (content.includes('dream') || content.includes('transform')) scores.emotional += 2;

    const maxScore = Math.max(...Object.values(scores));
    if (maxScore === 0) return 'casual';

    return Object.entries(scores).find(([_, score]) => score === maxScore)![0] as any;
  }

  /**
   * Identify psychological triggers used
   */
  private identifyTriggers(content: string): string[] {
    const triggers: string[] = [];

    if (/why|what|how|secret|reveal/.test(content)) triggers.push('curiosity');
    if (/stop|avoid|risk|lose|danger/.test(content)) triggers.push('fear');
    if (/now|limited|hurry|deadline/.test(content)) triggers.push('urgency');
    if (/finally|success|achieve|master/.test(content)) triggers.push('achievement');
    if (/want|need|imagine|dream/.test(content)) triggers.push('desire');
    if (/proven|guaranteed|trusted|expert/.test(content)) triggers.push('trust');

    return triggers;
  }

  /**
   * Extract unique angles from headings
   */
  private extractAngles(headings: string[], title: string): string[] {
    const angles: string[] = [];

    if (title) {
      angles.push(title);
    }

    for (const heading of headings.slice(0, 5)) {
      if (heading.length > 10 && heading.length < 100) {
        angles.push(heading);
      }
    }

    return angles;
  }

  /**
   * Find white space opportunities
   */
  private findWhiteSpace(
    industryThemes: string[],
    themeFrequency: Map<string, number>,
    competitorCount: number
  ): ContentGap[] {
    const gaps: ContentGap[] = [];

    for (const theme of industryThemes) {
      const coverage = themeFrequency.get(theme) || 0;
      const coveragePercent = (coverage / competitorCount) * 100;

      if (coveragePercent < 50) {
        const opportunityScore = 100 - coveragePercent;

        gaps.push({
          topic: theme,
          competitorCoverage: Math.round(coveragePercent),
          opportunityScore: Math.round(opportunityScore),
          suggestedAngles: this.generateAnglesForTopic(theme)
        });
      }
    }

    return gaps.sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, 5);
  }

  /**
   * Generate content angles for a topic
   */
  private generateAnglesForTopic(topic: string): string[] {
    const templates = [
      `Why ${topic} matters more than you think`,
      `The hidden truth about ${topic}`,
      `${topic}: What nobody tells you`,
      `How to evaluate ${topic} like a pro`,
      `${topic} mistakes to avoid`
    ];

    return templates.slice(0, 3);
  }

  /**
   * Calculate differentiation score
   */
  private calculateDifferentiationScore(
    competitors: CompetitorContent[],
    whiteSpace: ContentGap[]
  ): number {
    let score = 50; // Base score

    // More white space = more opportunity
    score += whiteSpace.length * 5;

    // High opportunity scores = more differentiation potential
    const avgOpportunity = whiteSpace.reduce((sum, gap) => sum + gap.opportunityScore, 0) /
      (whiteSpace.length || 1);
    score += avgOpportunity * 0.2;

    // Fewer competitors = less competitive
    if (competitors.length < 3) score += 10;

    return Math.min(100, Math.max(0, Math.round(score)));
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    commonThemes: string[],
    saturatedTopics: string[],
    whiteSpace: ContentGap[],
    competitors: CompetitorContent[]
  ): string[] {
    const recommendations: string[] = [];

    // White space recommendations
    if (whiteSpace.length > 0) {
      const topGap = whiteSpace[0];
      recommendations.push(
        `Opportunity: "${topGap.topic}" - only ${topGap.competitorCoverage}% competitor coverage`
      );
    }

    // Avoid saturated topics
    if (saturatedTopics.length > 0) {
      recommendations.push(
        `Differentiate from: "${saturatedTopics[0]}" - all competitors emphasize this`
      );
    }

    // Tone differentiation
    const tones = competitors.map(c => c.tone);
    const dominantTone = tones.sort((a, b) =>
      tones.filter(t => t === b).length - tones.filter(t => t === a).length
    )[0];

    if (dominantTone) {
      const alternativeTone = dominantTone === 'formal' ? 'casual' :
        dominantTone === 'casual' ? 'formal' : 'emotional';
      recommendations.push(
        `Consider ${alternativeTone} tone - competitors are mostly ${dominantTone}`
      );
    }

    // Trigger differentiation
    const allTriggers = competitors.flatMap(c => c.triggerTypes);
    const triggerCounts = new Map<string, number>();
    for (const trigger of allTriggers) {
      triggerCounts.set(trigger, (triggerCounts.get(trigger) || 0) + 1);
    }

    const underusedTriggers = ['curiosity', 'achievement', 'belonging'].filter(
      t => (triggerCounts.get(t) || 0) < competitors.length * 0.3
    );

    if (underusedTriggers.length > 0) {
      recommendations.push(
        `Use ${underusedTriggers[0]} triggers - underutilized by competitors`
      );
    }

    return recommendations.slice(0, 5);
  }

  /**
   * Empty analysis fallback
   */
  private getEmptyAnalysis(): DifferentiationAnalysis {
    return {
      competitors: [],
      commonThemes: [],
      saturatedTopics: [],
      whiteSpaceOpportunities: [],
      differentiationScore: 50,
      recommendations: ['Unable to analyze competitors - provide competitor URLs']
    };
  }

  /**
   * Score content for competitive differentiation
   */
  scoreForDifferentiation(
    content: string,
    analysis: DifferentiationAnalysis
  ): number {
    let score = 50;
    const contentLower = content.toLowerCase();

    // Bonus for white space topics
    for (const gap of analysis.whiteSpaceOpportunities) {
      if (contentLower.includes(gap.topic.toLowerCase())) {
        score += gap.opportunityScore * 0.1;
      }
    }

    // Penalty for saturated topics as primary focus
    for (const topic of analysis.saturatedTopics) {
      const regex = new RegExp(topic, 'gi');
      const matches = contentLower.match(regex);
      if (matches && matches.length > 3) {
        score -= 5;
      }
    }

    return Math.min(100, Math.max(0, Math.round(score)));
  }
}

export const competitiveContent = new CompetitiveContentService();
