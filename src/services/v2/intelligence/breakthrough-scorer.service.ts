/**
 * Breakthrough Scorer Service
 * 11-factor scoring system for content breakthrough potential
 */

import {
  BreakthroughScore,
  ScoringFactor,
  ScoringFactorId,
  ScoreBreakdown,
  ScoringInput,
  ScoringConfig,
  RadarChartData,
} from '../../../types/v2/scoring.types';
import { v4 as uuidv4 } from 'uuid';

// Default weights for each factor (sum to 1.0)
const DEFAULT_WEIGHTS: Record<ScoringFactorId, number> = {
  timing: 0.08,
  uniqueness: 0.12,
  validation: 0.08,
  eq_match: 0.12,
  market_gap: 0.10,
  audience_alignment: 0.12,
  competitive_edge: 0.08,
  trend_relevance: 0.08,
  engagement_potential: 0.10,
  conversion_likelihood: 0.08,
  brand_consistency: 0.04,
};

// Industry-specific weight adjustments
const INDUSTRY_WEIGHT_OVERRIDES: Record<string, Partial<Record<ScoringFactorId, number>>> = {
  insurance: {
    eq_match: 0.15,
    validation: 0.12,
    brand_consistency: 0.08,
  },
  saas: {
    uniqueness: 0.15,
    competitive_edge: 0.12,
    conversion_likelihood: 0.12,
  },
  healthcare: {
    validation: 0.15,
    brand_consistency: 0.10,
    eq_match: 0.14,
  },
  ecommerce: {
    timing: 0.12,
    trend_relevance: 0.12,
    engagement_potential: 0.14,
  },
  finance: {
    validation: 0.14,
    brand_consistency: 0.10,
    eq_match: 0.14,
  },
};

// Factor metadata
const FACTOR_METADATA: Record<ScoringFactorId, { name: string; description: string }> = {
  timing: {
    name: 'Timing',
    description: 'How well the content aligns with current timing, seasons, and events',
  },
  uniqueness: {
    name: 'Uniqueness',
    description: 'How differentiated and original the content is from competitors',
  },
  validation: {
    name: 'Validation',
    description: 'Presence of data, proof points, and credibility markers',
  },
  eq_match: {
    name: 'EQ Match',
    description: 'Alignment with industry emotional triggers and brand voice',
  },
  market_gap: {
    name: 'Market Gap',
    description: 'How well content addresses unmet needs or underserved topics',
  },
  audience_alignment: {
    name: 'Audience Alignment',
    description: 'Match between content and target audience preferences',
  },
  competitive_edge: {
    name: 'Competitive Edge',
    description: 'Strength of differentiation from competitor content',
  },
  trend_relevance: {
    name: 'Trend Relevance',
    description: 'Connection to current trends and timely topics',
  },
  engagement_potential: {
    name: 'Engagement Potential',
    description: 'Likelihood of driving comments, shares, and interactions',
  },
  conversion_likelihood: {
    name: 'Conversion Likelihood',
    description: 'Probability of driving desired actions and conversions',
  },
  brand_consistency: {
    name: 'Brand Consistency',
    description: 'Alignment with brand voice, values, and messaging guidelines',
  },
};

export class BreakthroughScorerService {
  private static instance: BreakthroughScorerService;
  private config: ScoringConfig;

  private constructor() {
    this.config = {
      enableExplanations: true,
      minimumScore: 0,
    };
  }

  static getInstance(): BreakthroughScorerService {
    if (!BreakthroughScorerService.instance) {
      BreakthroughScorerService.instance = new BreakthroughScorerService();
    }
    return BreakthroughScorerService.instance;
  }

  /**
   * Calculate breakthrough score for content
   */
  calculateScore(input: ScoringInput, config?: ScoringConfig): BreakthroughScore {
    const startTime = Date.now();
    const mergedConfig = { ...this.config, ...config };

    // Get weights (with industry overrides if applicable)
    const weights = this.getWeights(input.context.industryId, mergedConfig);

    // Calculate each factor
    const factors: ScoringFactor[] = [
      this.scoreTiming(input, weights.timing),
      this.scoreUniqueness(input, weights.uniqueness),
      this.scoreValidation(input, weights.validation),
      this.scoreEqMatch(input, weights.eq_match),
      this.scoreMarketGap(input, weights.market_gap),
      this.scoreAudienceAlignment(input, weights.audience_alignment),
      this.scoreCompetitiveEdge(input, weights.competitive_edge),
      this.scoreTrendRelevance(input, weights.trend_relevance),
      this.scoreEngagementPotential(input, weights.engagement_potential),
      this.scoreConversionLikelihood(input, weights.conversion_likelihood),
      this.scoreBrandConsistency(input, weights.brand_consistency),
    ];

    // Calculate total score
    const totalScore = Math.round(
      factors.reduce((sum, factor) => sum + factor.weightedScore, 0)
    );

    // Generate breakdown
    const breakdown = this.generateBreakdown(factors, totalScore);

    return {
      id: uuidv4(),
      contentId: uuidv4(),
      timestamp: new Date(),
      breakdown,
      industryId: input.context.industryId,
      segmentId: input.context.customerSegment,
      metadata: {
        scoringVersion: '2.0.0',
        calculationTimeMs: Date.now() - startTime,
        inputFactors: 11,
      },
    };
  }

  /**
   * Get weights with industry overrides
   */
  private getWeights(
    industryId?: string,
    config?: ScoringConfig
  ): Record<ScoringFactorId, number> {
    let weights = { ...DEFAULT_WEIGHTS };

    // Apply config overrides
    if (config?.factorWeights) {
      weights = { ...weights, ...config.factorWeights };
    }

    // Apply industry overrides
    if (industryId && INDUSTRY_WEIGHT_OVERRIDES[industryId]) {
      const industryWeights = INDUSTRY_WEIGHT_OVERRIDES[industryId];
      weights = { ...weights, ...industryWeights };

      // Normalize to ensure weights sum to 1
      const sum = Object.values(weights).reduce((a, b) => a + b, 0);
      for (const key of Object.keys(weights) as ScoringFactorId[]) {
        weights[key] = weights[key] / sum;
      }
    }

    return weights;
  }

  // Individual factor scoring methods

  private scoreTiming(input: ScoringInput, weight: number): ScoringFactor {
    let score = 50; // Base score
    const reasons: string[] = [];

    // Check for seasonal triggers
    if (input.signals?.seasonalTriggers?.length) {
      score += 20;
      reasons.push('Aligns with seasonal triggers');
    }

    // Check content for time-sensitive language
    const content = `${input.content.title} ${input.content.body}`.toLowerCase();
    const timingWords = ['now', 'today', 'limited', 'deadline', 'season', 'new year', 'summer', 'holiday'];
    const timingMatches = timingWords.filter(word => content.includes(word));
    if (timingMatches.length > 0) {
      score += Math.min(20, timingMatches.length * 7);
      reasons.push(`Contains timing language: ${timingMatches.join(', ')}`);
    }

    // Platform timing considerations
    if (input.context.platform) {
      score += 10;
      reasons.push('Platform-specific timing considered');
    }

    score = Math.min(100, Math.max(0, score));

    return this.createFactor('timing', score, weight, reasons);
  }

  private scoreUniqueness(input: ScoringInput, weight: number): ScoringFactor {
    let score = 60; // Base score
    const reasons: string[] = [];

    // Check for unique angles
    const content = `${input.content.title} ${input.content.hook}`.toLowerCase();
    const uniqueIndicators = ['secret', 'hidden', 'unconventional', 'contrarian', 'myth', 'mistake', 'surprising'];
    const matches = uniqueIndicators.filter(ind => content.includes(ind));
    if (matches.length > 0) {
      score += matches.length * 10;
      reasons.push('Contains unique angle indicators');
    }

    // Check template type for uniqueness potential
    const highUniqueTemplates = ['pattern-interrupt', 'contrarian', 'myth-buster', 'behind-the-scenes'];
    if (input.content.templateType && highUniqueTemplates.includes(input.content.templateType)) {
      score += 15;
      reasons.push('High-uniqueness template type');
    }

    // Penalize generic content
    const genericTerms = ['best practices', 'top tips', 'ultimate guide'];
    if (genericTerms.some(term => content.includes(term))) {
      score -= 15;
      reasons.push('Contains generic terms');
    }

    score = Math.min(100, Math.max(0, score));

    return this.createFactor('uniqueness', score, weight, reasons);
  }

  private scoreValidation(input: ScoringInput, weight: number): ScoringFactor {
    let score = 40; // Base score
    const reasons: string[] = [];

    const content = `${input.content.body} ${input.content.cta}`.toLowerCase();

    // Check for numbers/data
    const hasNumbers = /\d+%|\d+x|\d+ (hours|days|weeks|people|customers)/.test(content);
    if (hasNumbers) {
      score += 25;
      reasons.push('Contains specific data/numbers');
    }

    // Check for social proof indicators
    const proofIndicators = ['case study', 'testimonial', 'research', 'study shows', 'data', 'proven', 'results'];
    const proofMatches = proofIndicators.filter(ind => content.includes(ind));
    if (proofMatches.length > 0) {
      score += Math.min(25, proofMatches.length * 10);
      reasons.push('Contains validation markers');
    }

    // Historical performance bonus
    if (input.signals?.historicalPerformance && input.signals.historicalPerformance > 70) {
      score += 10;
      reasons.push('Strong historical performance');
    }

    score = Math.min(100, Math.max(0, score));

    return this.createFactor('validation', score, weight, reasons);
  }

  private scoreEqMatch(input: ScoringInput, weight: number): ScoringFactor {
    let score = 50; // Base score
    const reasons: string[] = [];

    // Check EQ profile alignment
    if (input.eqProfile?.emotionalTriggers) {
      const triggers = input.eqProfile.emotionalTriggers;
      const dominantTrigger = Object.entries(triggers)
        .sort(([, a], [, b]) => b - a)[0];

      if (dominantTrigger && dominantTrigger[1] > 20) {
        score += 20;
        reasons.push(`Strong ${dominantTrigger[0]} trigger alignment`);
      }
    }

    // Check tone alignment
    if (input.eqProfile?.tonePreference && input.context.platform) {
      score += 15;
      reasons.push('Tone matches platform expectations');
    }

    // Industry EQ match
    if (input.context.industryId) {
      score += 15;
      reasons.push('Industry emotional profile considered');
    }

    score = Math.min(100, Math.max(0, score));

    return this.createFactor('eq_match', score, weight, reasons);
  }

  private scoreMarketGap(input: ScoringInput, weight: number): ScoringFactor {
    let score = 55; // Base score
    const reasons: string[] = [];

    // Check if addressing competitor gaps
    if (input.signals?.competitorContent?.length) {
      score += 20;
      reasons.push('Competitive landscape analyzed');
    }

    // Check for problem-focused content
    const content = `${input.content.hook} ${input.content.body}`.toLowerCase();
    const problemWords = ['problem', 'challenge', 'struggle', 'pain', 'frustration', 'mistake', 'gap', 'missing'];
    const problemMatches = problemWords.filter(word => content.includes(word));
    if (problemMatches.length > 0) {
      score += Math.min(20, problemMatches.length * 7);
      reasons.push('Addresses market problems');
    }

    score = Math.min(100, Math.max(0, score));

    return this.createFactor('market_gap', score, weight, reasons);
  }

  private scoreAudienceAlignment(input: ScoringInput, weight: number): ScoringFactor {
    let score = 50; // Base score
    const reasons: string[] = [];

    // Target audience specified
    if (input.context.targetAudience) {
      score += 20;
      reasons.push('Target audience defined');
    }

    // Customer segment specified
    if (input.context.customerSegment) {
      score += 15;
      reasons.push('Customer segment identified');
    }

    // Check for audience language in content
    const content = `${input.content.hook} ${input.content.body}`.toLowerCase();
    const audienceWords = ['you', 'your', 'professionals', 'business owners', 'leaders', 'teams'];
    const audienceMatches = audienceWords.filter(word => content.includes(word));
    if (audienceMatches.length > 2) {
      score += 15;
      reasons.push('Strong audience-focused language');
    }

    score = Math.min(100, Math.max(0, score));

    return this.createFactor('audience_alignment', score, weight, reasons);
  }

  private scoreCompetitiveEdge(input: ScoringInput, weight: number): ScoringFactor {
    let score = 50; // Base score
    const reasons: string[] = [];

    // Competitor analysis done
    if (input.signals?.competitorContent?.length) {
      score += 25;
      reasons.push('Competitor content analyzed');
    }

    // Check for differentiation language
    const content = `${input.content.body}`.toLowerCase();
    const diffWords = ['unlike', 'different', 'instead', 'better', 'unique', 'only', 'first'];
    const diffMatches = diffWords.filter(word => content.includes(word));
    if (diffMatches.length > 0) {
      score += Math.min(20, diffMatches.length * 8);
      reasons.push('Contains differentiation language');
    }

    score = Math.min(100, Math.max(0, score));

    return this.createFactor('competitive_edge', score, weight, reasons);
  }

  private scoreTrendRelevance(input: ScoringInput, weight: number): ScoringFactor {
    let score = 45; // Base score
    const reasons: string[] = [];

    // Trending topics provided
    if (input.signals?.trendingTopics?.length) {
      score += 30;
      reasons.push('Aligned with trending topics');
    }

    // Check for trend language
    const content = `${input.content.title} ${input.content.hook}`.toLowerCase();
    const trendWords = ['trend', 'emerging', 'new', 'latest', '2024', '2025', 'breaking', 'hot'];
    const trendMatches = trendWords.filter(word => content.includes(word));
    if (trendMatches.length > 0) {
      score += Math.min(20, trendMatches.length * 8);
      reasons.push('Contains trend-relevant language');
    }

    score = Math.min(100, Math.max(0, score));

    return this.createFactor('trend_relevance', score, weight, reasons);
  }

  private scoreEngagementPotential(input: ScoringInput, weight: number): ScoringFactor {
    let score = 50; // Base score
    const reasons: string[] = [];

    // Check for engagement drivers
    const content = `${input.content.hook} ${input.content.cta}`.toLowerCase();
    const engagementWords = ['comment', 'share', 'tag', 'tell us', 'what do you think', 'agree or disagree'];
    const engagementMatches = engagementWords.filter(word => content.includes(word));
    if (engagementMatches.length > 0) {
      score += Math.min(25, engagementMatches.length * 10);
      reasons.push('Contains engagement prompts');
    }

    // Question in hook/title
    if (input.content.hook.includes('?') || input.content.title.includes('?')) {
      score += 15;
      reasons.push('Uses questions to drive engagement');
    }

    // Controversial/debate potential
    const debateWords = ['unpopular opinion', 'controversial', 'debate', 'agree'];
    if (debateWords.some(word => content.includes(word))) {
      score += 10;
      reasons.push('High debate potential');
    }

    score = Math.min(100, Math.max(0, score));

    return this.createFactor('engagement_potential', score, weight, reasons);
  }

  private scoreConversionLikelihood(input: ScoringInput, weight: number): ScoringFactor {
    let score = 45; // Base score
    const reasons: string[] = [];

    // Check CTA strength
    const cta = input.content.cta.toLowerCase();
    const strongCTAs = ['get', 'start', 'join', 'claim', 'book', 'schedule', 'download', 'try'];
    const ctaMatches = strongCTAs.filter(word => cta.includes(word));
    if (ctaMatches.length > 0) {
      score += 25;
      reasons.push('Strong call-to-action');
    }

    // Campaign goal alignment
    if (input.context.campaignGoal) {
      score += 15;
      reasons.push('Aligned with campaign goal');
    }

    // Value proposition present
    if (input.eqProfile?.valueProposition) {
      score += 15;
      reasons.push('Clear value proposition');
    }

    score = Math.min(100, Math.max(0, score));

    return this.createFactor('conversion_likelihood', score, weight, reasons);
  }

  private scoreBrandConsistency(input: ScoringInput, weight: number): ScoringFactor {
    let score = 60; // Base score - assume reasonable consistency
    const reasons: string[] = [];

    // Industry context provides brand guidelines
    if (input.context.industryId) {
      score += 15;
      reasons.push('Industry guidelines applied');
    }

    // Tone preference specified
    if (input.eqProfile?.tonePreference) {
      score += 15;
      reasons.push('Brand tone specified');
    }

    // Value prop alignment
    if (input.eqProfile?.valueProposition) {
      score += 10;
      reasons.push('Aligned with value proposition');
    }

    score = Math.min(100, Math.max(0, score));

    return this.createFactor('brand_consistency', score, weight, reasons);
  }

  // Helper methods

  private createFactor(
    id: ScoringFactorId,
    score: number,
    weight: number,
    reasons: string[]
  ): ScoringFactor {
    const metadata = FACTOR_METADATA[id];
    const weightedScore = score * weight;

    return {
      id,
      name: metadata.name,
      description: metadata.description,
      weight,
      score,
      weightedScore,
      explanation: reasons.length > 0 ? reasons.join('. ') : 'Standard scoring applied',
      improvementSuggestion: this.getImprovementSuggestion(id, score),
    };
  }

  private getImprovementSuggestion(factorId: ScoringFactorId, score: number): string | undefined {
    if (score >= 70) return undefined;

    const suggestions: Record<ScoringFactorId, string> = {
      timing: 'Add seasonal or time-sensitive language to increase relevance',
      uniqueness: 'Use a contrarian angle or reveal hidden insights to stand out',
      validation: 'Include specific data, case studies, or social proof',
      eq_match: 'Align content with industry emotional triggers',
      market_gap: 'Address specific pain points or unmet needs',
      audience_alignment: 'Use more direct audience-focused language',
      competitive_edge: 'Highlight what makes your approach different',
      trend_relevance: 'Connect content to current trends or events',
      engagement_potential: 'Add questions or calls for discussion',
      conversion_likelihood: 'Strengthen CTA with action-oriented language',
      brand_consistency: 'Ensure messaging aligns with brand guidelines',
    };

    return suggestions[factorId];
  }

  private generateBreakdown(factors: ScoringFactor[], totalScore: number): ScoreBreakdown {
    // Determine grade
    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (totalScore >= 90) grade = 'A';
    else if (totalScore >= 80) grade = 'B';
    else if (totalScore >= 70) grade = 'C';
    else if (totalScore >= 60) grade = 'D';
    else grade = 'F';

    // Calculate percentile (simplified)
    const percentile = Math.min(99, Math.max(1, totalScore));

    // Identify strengths (top 3 scores)
    const sortedFactors = [...factors].sort((a, b) => b.score - a.score);
    const strengths = sortedFactors
      .slice(0, 3)
      .filter(f => f.score >= 70)
      .map(f => `${f.name}: ${f.explanation}`);

    // Identify weaknesses (bottom 3 scores under 60)
    const weaknesses = sortedFactors
      .slice(-3)
      .filter(f => f.score < 60)
      .map(f => `${f.name}: ${f.improvementSuggestion || 'Needs improvement'}`);

    // Generate overall explanation
    const overallExplanation = this.generateOverallExplanation(totalScore, strengths, weaknesses);

    return {
      factors,
      totalScore,
      grade,
      percentile,
      strengths,
      weaknesses,
      overallExplanation,
    };
  }

  private generateOverallExplanation(
    score: number,
    strengths: string[],
    weaknesses: string[]
  ): string {
    if (score >= 80) {
      return `Excellent breakthrough potential. ${strengths.length} strong factors driving performance.`;
    } else if (score >= 65) {
      return `Good breakthrough potential with room for improvement. Focus on ${weaknesses.length > 0 ? 'weaker areas' : 'optimization'}.`;
    } else {
      return `Moderate breakthrough potential. Significant improvements needed in ${weaknesses.length} areas.`;
    }
  }

  /**
   * Generate radar chart data for visualization
   */
  generateRadarChartData(score: BreakthroughScore): RadarChartData {
    const factors = score.breakdown.factors;

    return {
      labels: factors.map(f => f.name),
      datasets: [
        {
          label: 'Score',
          data: factors.map(f => f.score),
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          borderColor: 'rgba(99, 102, 241, 1)',
        },
      ],
    };
  }

  /**
   * Get improvement suggestions sorted by impact
   */
  getImprovementSuggestions(score: BreakthroughScore): Array<{
    factor: string;
    suggestion: string;
    potentialGain: number;
  }> {
    return score.breakdown.factors
      .filter(f => f.score < 70 && f.improvementSuggestion)
      .map(f => ({
        factor: f.name,
        suggestion: f.improvementSuggestion!,
        potentialGain: Math.round((100 - f.score) * f.weight),
      }))
      .sort((a, b) => b.potentialGain - a.potentialGain);
  }
}

// Export singleton instance
export const breakthroughScorerService = BreakthroughScorerService.getInstance();
