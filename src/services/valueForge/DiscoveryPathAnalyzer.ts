/**
 * Discovery Path Analyzer Service
 *
 * Analyzes and scores the 5 discovery paths:
 * 1. Search - Found through search engines
 * 2. Trust - Recommended by trusted sources
 * 3. Share - Discovered through social sharing
 * 4. Interrupt - Encountered through ads/outreach
 * 5. Browse - Found while exploring/browsing
 */

import type { ValueForgeContext, DiscoveryPath } from '@/types/valueForge';

export interface DiscoveryPathScore {
  path: 'search' | 'trust' | 'share' | 'interrupt' | 'browse';
  score: number; // 0-100
  strength: 'weak' | 'moderate' | 'strong';
  opportunities: string[];
  currentPerformance: string;
  industryAverage: number;
}

export class DiscoveryPathAnalyzerService {
  /**
   * Analyze all 5 discovery paths from context
   */
  analyzeDiscoveryPaths(context: ValueForgeContext): DiscoveryPathScore[] {
    return [
      this.analyzeSearch(context),
      this.analyzeTrust(context),
      this.analyzeShare(context),
      this.analyzeInterrupt(context),
      this.analyzeBrowse(context)
    ];
  }

  /**
   * Analyze Search path (SEO, keywords, search visibility)
   */
  private analyzeSearch(context: ValueForgeContext): DiscoveryPathScore {
    let score = 50; // Base score
    const opportunities: string[] = [];

    const marbaScore = context.businessIntel?.marba_score || 0;
    const competitive = context.businessIntel?.competitive;
    const websiteAnalysis = context.businessIntel?.website_analysis;

    // Check SEO strength from MARBA
    if (marbaScore >= 70) {
      score += 20;
    } else if (marbaScore < 50) {
      opportunities.push('Improve SEO and keyword targeting');
    }

    // Check keyword gaps
    if (competitive?.keywordGaps && competitive.keywordGaps.length > 0) {
      score -= 15;
      opportunities.push(`Target ${competitive.keywordGaps.length} missed keyword opportunities`);
    } else {
      score += 15;
    }

    // Check content relevance
    if (websiteAnalysis?.valuePropositions && websiteAnalysis.valuePropositions.length > 2) {
      score += 10;
    } else {
      opportunities.push('Expand content to cover more search queries');
    }

    // Industry benchmarking
    const industryAverage = this.getIndustryAverage(context, 'search');

    return {
      path: 'search',
      score: Math.max(0, Math.min(100, score)),
      strength: this.getStrength(score),
      opportunities: opportunities.length > 0 ? opportunities : ['Maintain strong search presence'],
      currentPerformance: this.getPerformanceDescription('search', score),
      industryAverage
    };
  }

  /**
   * Analyze Trust path (referrals, reviews, reputation)
   */
  private analyzeTrust(context: ValueForgeContext): DiscoveryPathScore {
    let score = 50; // Base score
    const opportunities: string[] = [];

    const reviews = context.businessIntel?.reviews;
    const socialProof = context.businessIntel?.website_analysis?.proofPoints;

    // Check review presence and sentiment
    if (reviews) {
      if (reviews.positive && reviews.positive.length > 10) {
        score += 20;
      } else if (!reviews.positive || reviews.positive.length < 5) {
        score -= 15;
        opportunities.push('Collect more customer reviews and testimonials');
      }

      if (reviews.negative && reviews.negative.length > 5) {
        score -= 10;
        opportunities.push('Address negative review themes');
      }
    } else {
      score -= 20;
      opportunities.push('Establish review collection process');
    }

    // Check social proof on website
    if (socialProof && socialProof.length > 3) {
      score += 15;
    } else {
      opportunities.push('Add more trust signals to website');
    }

    // Industry benchmarking
    const industryAverage = this.getIndustryAverage(context, 'trust');

    return {
      path: 'trust',
      score: Math.max(0, Math.min(100, score)),
      strength: this.getStrength(score),
      opportunities: opportunities.length > 0 ? opportunities : ['Maintain trust-building activities'],
      currentPerformance: this.getPerformanceDescription('trust', score),
      industryAverage
    };
  }

  /**
   * Analyze Share path (social media, viral content, word-of-mouth)
   */
  private analyzeShare(context: ValueForgeContext): DiscoveryPathScore {
    let score = 40; // Lower base - harder to achieve
    const opportunities: string[] = [];

    const websiteAnalysis = context.businessIntel?.website_analysis;

    // Check for shareable content
    if (websiteAnalysis?.differentiators && websiteAnalysis.differentiators.length > 2) {
      score += 15;
    } else {
      opportunities.push('Create unique, shareable content');
    }

    // Check for social presence indicators
    // (In production, would check actual social media presence)
    opportunities.push('Develop share-worthy brand stories');
    opportunities.push('Encourage customer advocacy');

    // Industry benchmarking
    const industryAverage = this.getIndustryAverage(context, 'share');

    return {
      path: 'share',
      score: Math.max(0, Math.min(100, score)),
      strength: this.getStrength(score),
      opportunities,
      currentPerformance: this.getPerformanceDescription('share', score),
      industryAverage
    };
  }

  /**
   * Analyze Interrupt path (ads, outreach, cold outbound)
   */
  private analyzeInterrupt(context: ValueForgeContext): DiscoveryPathScore {
    let score = 30; // Lower base - requires active investment
    const opportunities: string[] = [];

    // This would require data about ad spend, campaigns, etc.
    // For now, provide strategic opportunities
    opportunities.push('Consider targeted advertising campaigns');
    opportunities.push('Develop outbound prospecting strategy');
    opportunities.push('Test interrupt tactics with strong value proposition');

    // Industry benchmarking
    const industryAverage = this.getIndustryAverage(context, 'interrupt');

    return {
      path: 'interrupt',
      score,
      strength: this.getStrength(score),
      opportunities,
      currentPerformance: this.getPerformanceDescription('interrupt', score),
      industryAverage
    };
  }

  /**
   * Analyze Browse path (discovery through exploration, marketplaces, directories)
   */
  private analyzeBrowse(context: ValueForgeContext): DiscoveryPathScore {
    let score = 45; // Moderate base
    const opportunities: string[] = [];

    const industryProfile = context.industryProfile;

    // Check industry directory presence
    if (industryProfile?.directories && industryProfile.directories.length > 0) {
      opportunities.push(`List in industry directories: ${industryProfile.directories.slice(0, 2).join(', ')}`);
    }

    // Generic browse opportunities
    opportunities.push('Optimize for category browsing');
    opportunities.push('Ensure presence on relevant marketplaces/directories');

    // Industry benchmarking
    const industryAverage = this.getIndustryAverage(context, 'browse');

    return {
      path: 'browse',
      score,
      strength: this.getStrength(score),
      opportunities,
      currentPerformance: this.getPerformanceDescription('browse', score),
      industryAverage
    };
  }

  /**
   * Get strength classification from score
   */
  private getStrength(score: number): 'weak' | 'moderate' | 'strong' {
    if (score >= 70) return 'strong';
    if (score >= 50) return 'moderate';
    return 'weak';
  }

  /**
   * Get performance description
   */
  private getPerformanceDescription(path: string, score: number): string {
    const descriptions: Record<string, Record<string, string>> = {
      search: {
        strong: 'Strong organic search presence with good keyword coverage',
        moderate: 'Moderate search visibility with room for improvement',
        weak: 'Limited search visibility, significant SEO opportunity'
      },
      trust: {
        strong: 'Strong reputation with abundant social proof',
        moderate: 'Building trust, need more reviews and testimonials',
        weak: 'Limited social proof, trust signals needed'
      },
      share: {
        strong: 'Highly shareable content driving word-of-mouth',
        moderate: 'Some viral potential, needs amplification',
        weak: 'Low shareability, need compelling stories'
      },
      interrupt: {
        strong: 'Effective paid acquisition and outbound',
        moderate: 'Some interrupt activities, needs optimization',
        weak: 'Minimal interrupt marketing, untapped channel'
      },
      browse: {
        strong: 'Prominent in discovery browsing experiences',
        moderate: 'Present but not optimized for browsing',
        weak: 'Missing from key browsing opportunities'
      }
    };

    const strength = this.getStrength(score);
    return descriptions[path]?.[strength] || 'Performance data unavailable';
  }

  /**
   * Get industry average for path
   */
  private getIndustryAverage(context: ValueForgeContext, path: string): number {
    // Industry-specific benchmarks
    const defaults: Record<string, number> = {
      search: 60,
      trust: 55,
      share: 40,
      interrupt: 35,
      browse: 45
    };

    // Could vary by industry in production
    return defaults[path] || 50;
  }

  /**
   * Get top priority paths
   */
  getTopPriorityPaths(scores: DiscoveryPathScore[], count: number = 2): DiscoveryPathScore[] {
    // Prioritize paths with:
    // 1. Highest potential (gap from industry average)
    // 2. Current weakness (low score)
    return [...scores]
      .sort((a, b) => {
        const gapA = a.industryAverage - a.score;
        const gapB = b.industryAverage - b.score;
        return gapB - gapA;
      })
      .slice(0, count);
  }
}

export const discoveryPathAnalyzer = new DiscoveryPathAnalyzerService();
