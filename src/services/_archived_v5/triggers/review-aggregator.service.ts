/**
 * Review Aggregator Service
 *
 * Cross-platform review aggregation and analysis for trigger discovery.
 * Unifies reviews from Google, Yelp, G2, Capterra, Trustpilot into
 * a consistent format for trigger extraction.
 *
 * Features:
 * - Multi-platform review normalization
 * - Competitor review monitoring
 * - Sentiment analysis and categorization
 * - Pain point extraction from reviews
 * - Review recency weighting
 *
 * Created: 2025-12-01
 * Phase: Triggers 3.0 - Phase 2 (SMB Signal Pipeline)
 */

import type { BusinessProfileType } from './_archived/profile-detection.service';
import { recencyCalculatorService } from './recency-calculator.service';
import { competitorAttributionService } from './competitor-attribution.service';

// ============================================================================
// TYPES
// ============================================================================

export type ReviewPlatform =
  | 'google'
  | 'yelp'
  | 'g2'
  | 'capterra'
  | 'trustpilot'
  | 'trustradius'
  | 'facebook'
  | 'bbb'
  | 'amazon'
  | 'glassdoor';

export interface NormalizedReview {
  /** Unique identifier */
  id: string;
  /** Source platform */
  platform: ReviewPlatform;
  /** Rating (normalized to 1-5 scale) */
  rating: number;
  /** Review title if available */
  title?: string;
  /** Review body text */
  body: string;
  /** Reviewer name/alias */
  reviewerName?: string;
  /** Reviewer role/title if available (B2B) */
  reviewerRole?: string;
  /** Company name if available (B2B) */
  companyName?: string;
  /** Company size if available */
  companySize?: string;
  /** Review date */
  date: string;
  /** Source URL */
  url: string;
  /** Pros mentioned (G2/Capterra style) */
  pros?: string[];
  /** Cons mentioned (G2/Capterra style) */
  cons?: string[];
  /** Use case mentioned */
  useCase?: string;
  /** Verified purchase/user flag */
  isVerified: boolean;
  /** Helpful votes count */
  helpfulVotes?: number;
}

export interface ReviewSentimentAnalysis {
  /** Overall sentiment */
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  /** Sentiment score (-1 to 1) */
  sentimentScore: number;
  /** Key positive themes */
  positiveThemes: string[];
  /** Key negative themes */
  negativeThemes: string[];
  /** Extracted pain points */
  painPoints: string[];
  /** Extracted desires/wishes */
  desires: string[];
  /** Feature mentions */
  featureMentions: string[];
  /** Competitor mentions */
  competitorMentions: string[];
}

export interface AggregatedReviewData {
  /** Company/product being reviewed */
  entityName: string;
  /** Entity type */
  entityType: 'own' | 'competitor';
  /** All normalized reviews */
  reviews: NormalizedReview[];
  /** Platform breakdown */
  platformBreakdown: Record<ReviewPlatform, number>;
  /** Rating summary */
  ratingSummary: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<1 | 2 | 3 | 4 | 5, number>;
    recentTrend: 'improving' | 'declining' | 'stable';
  };
  /** Aggregated sentiment analysis */
  aggregatedSentiment: ReviewSentimentAnalysis;
  /** Top pain points across all reviews */
  topPainPoints: Array<{ painPoint: string; frequency: number; examples: string[] }>;
  /** Top desires across all reviews */
  topDesires: Array<{ desire: string; frequency: number; examples: string[] }>;
  /** Recency stats */
  recencyStats: {
    last7Days: number;
    last30Days: number;
    last90Days: number;
    older: number;
  };
  /** Last updated */
  lastUpdated: string;
}

export interface ReviewAggregationConfig {
  /** Platforms to aggregate from */
  platforms: ReviewPlatform[];
  /** Maximum reviews per platform */
  maxReviewsPerPlatform: number;
  /** Minimum rating to include (for filtering noise) */
  minRating?: number;
  /** Maximum rating to include (for competitor pain mining) */
  maxRating?: number;
  /** Only include verified reviews */
  verifiedOnly: boolean;
  /** Recency filter (days) */
  maxAgeDays?: number;
}

// ============================================================================
// PLATFORM CONFIGURATIONS
// ============================================================================

/**
 * Platform-specific configurations
 */
const PLATFORM_CONFIG: Record<ReviewPlatform, {
  ratingScale: number;
  hasVerifiedPurchase: boolean;
  hasProsConsFormat: boolean;
  hasCompanyInfo: boolean;
  trustWeight: number;
}> = {
  'google': {
    ratingScale: 5,
    hasVerifiedPurchase: false,
    hasProsConsFormat: false,
    hasCompanyInfo: false,
    trustWeight: 0.9,
  },
  'yelp': {
    ratingScale: 5,
    hasVerifiedPurchase: false,
    hasProsConsFormat: false,
    hasCompanyInfo: false,
    trustWeight: 0.85,
  },
  'g2': {
    ratingScale: 5,
    hasVerifiedPurchase: true,
    hasProsConsFormat: true,
    hasCompanyInfo: true,
    trustWeight: 1.0,
  },
  'capterra': {
    ratingScale: 5,
    hasVerifiedPurchase: true,
    hasProsConsFormat: true,
    hasCompanyInfo: true,
    trustWeight: 0.95,
  },
  'trustpilot': {
    ratingScale: 5,
    hasVerifiedPurchase: true,
    hasProsConsFormat: false,
    hasCompanyInfo: false,
    trustWeight: 0.9,
  },
  'trustradius': {
    ratingScale: 10,
    hasVerifiedPurchase: true,
    hasProsConsFormat: true,
    hasCompanyInfo: true,
    trustWeight: 0.95,
  },
  'facebook': {
    ratingScale: 5,
    hasVerifiedPurchase: false,
    hasProsConsFormat: false,
    hasCompanyInfo: false,
    trustWeight: 0.7,
  },
  'bbb': {
    ratingScale: 5,
    hasVerifiedPurchase: false,
    hasProsConsFormat: false,
    hasCompanyInfo: false,
    trustWeight: 0.8,
  },
  'amazon': {
    ratingScale: 5,
    hasVerifiedPurchase: true,
    hasProsConsFormat: false,
    hasCompanyInfo: false,
    trustWeight: 0.85,
  },
  'glassdoor': {
    ratingScale: 5,
    hasVerifiedPurchase: false,
    hasProsConsFormat: true,
    hasCompanyInfo: true,
    trustWeight: 0.75, // Employee reviews, different context
  },
};

/**
 * Profile to platform mapping
 */
const PROFILE_PLATFORMS: Record<BusinessProfileType, ReviewPlatform[]> = {
  'local-service-b2b': ['google', 'yelp', 'facebook', 'bbb'],
  'local-service-b2c': ['google', 'yelp', 'facebook', 'bbb'],
  'regional-b2b-agency': ['g2', 'capterra', 'google', 'facebook'],
  'regional-retail-b2c': ['google', 'yelp', 'facebook', 'trustpilot'],
  'national-saas-b2b': ['g2', 'capterra', 'trustradius', 'trustpilot'],
  'national-product-b2c': ['amazon', 'trustpilot', 'google', 'facebook'],
  'global-saas-b2b': ['g2', 'capterra', 'trustradius', 'trustpilot', 'gartner' as any],
};

/**
 * Pain point extraction patterns
 */
const PAIN_POINT_PATTERNS: Array<{ pattern: RegExp; category: string }> = [
  { pattern: /(?:hate|hated|hating) (?:that|how|when)/i, category: 'frustration' },
  { pattern: /(?:frustrat|annoying|annoyed)/i, category: 'frustration' },
  { pattern: /(?:too slow|takes forever|slow response|long wait)/i, category: 'speed' },
  { pattern: /(?:too expensive|overpriced|not worth|waste of money)/i, category: 'pricing' },
  { pattern: /(?:poor support|no support|terrible support|bad customer service)/i, category: 'support' },
  { pattern: /(?:buggy|crashes|glitchy|doesn't work|broken)/i, category: 'reliability' },
  { pattern: /(?:confusing|complicated|hard to use|steep learning curve)/i, category: 'usability' },
  { pattern: /(?:missing feature|wish it had|would be nice if|need)/i, category: 'features' },
  { pattern: /(?:outdated|old|hasn't been updated|needs update)/i, category: 'maintenance' },
  { pattern: /(?:hidden fees|unexpected charges|billing issues)/i, category: 'billing' },
];

/**
 * Desire extraction patterns
 */
const DESIRE_PATTERNS: Array<{ pattern: RegExp; category: string }> = [
  { pattern: /(?:wish|wished|wishing) (?:it|they|there)/i, category: 'wish' },
  { pattern: /(?:would be nice|would love|would be great) if/i, category: 'wish' },
  { pattern: /(?:need|needed|needs) (?:a |more |better )/i, category: 'need' },
  { pattern: /(?:looking for|searching for|want) (?:a |an |something)/i, category: 'seeking' },
  { pattern: /(?:hope|hoping|hopefully) (?:they|it|this)/i, category: 'hope' },
];

// ============================================================================
// SERVICE
// ============================================================================

class ReviewAggregatorService {
  /**
   * Get recommended platforms for a business profile
   */
  getPlatformsForProfile(profileType: BusinessProfileType): ReviewPlatform[] {
    return PROFILE_PLATFORMS[profileType] || ['google', 'trustpilot'];
  }

  /**
   * Normalize a review from any platform to standard format
   */
  normalizeReview(
    rawReview: any,
    platform: ReviewPlatform,
    sourceUrl: string
  ): NormalizedReview {
    const config = PLATFORM_CONFIG[platform];

    // Normalize rating to 5-point scale
    const rawRating = rawReview.rating || rawReview.score || rawReview.stars || 3;
    const normalizedRating = config.ratingScale === 5
      ? rawRating
      : Math.round((rawRating / config.ratingScale) * 5);

    return {
      id: rawReview.id || `${platform}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      platform,
      rating: Math.min(5, Math.max(1, normalizedRating)),
      title: rawReview.title || rawReview.headline || undefined,
      body: rawReview.body || rawReview.text || rawReview.content || rawReview.review || '',
      reviewerName: rawReview.author || rawReview.reviewer || rawReview.user || rawReview.name || 'Anonymous',
      reviewerRole: rawReview.role || rawReview.title || rawReview.jobTitle || undefined,
      companyName: rawReview.company || rawReview.organization || undefined,
      companySize: rawReview.companySize || rawReview.employeeCount || undefined,
      date: this.normalizeDate(rawReview.date || rawReview.createdAt || rawReview.timestamp),
      url: rawReview.url || sourceUrl,
      pros: rawReview.pros || rawReview.positives || undefined,
      cons: rawReview.cons || rawReview.negatives || undefined,
      useCase: rawReview.useCase || rawReview.usage || undefined,
      isVerified: rawReview.verified || rawReview.isVerified || false,
      helpfulVotes: rawReview.helpful || rawReview.helpfulVotes || rawReview.upvotes || 0,
    };
  }

  /**
   * Aggregate reviews from multiple platforms
   */
  aggregateReviews(
    reviews: NormalizedReview[],
    entityName: string,
    entityType: 'own' | 'competitor' = 'competitor'
  ): AggregatedReviewData {
    // Platform breakdown
    const platformBreakdown: Record<ReviewPlatform, number> = {} as any;
    for (const review of reviews) {
      platformBreakdown[review.platform] = (platformBreakdown[review.platform] || 0) + 1;
    }

    // Rating summary
    const ratings = reviews.map(r => r.rating);
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>;
    for (const rating of ratings) {
      const roundedRating = Math.round(rating) as 1 | 2 | 3 | 4 | 5;
      ratingDistribution[roundedRating]++;
    }

    const averageRating = ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0;

    // Recency trend
    const recentReviews = reviews.filter(r => {
      const recency = recencyCalculatorService.calculateRecency(r.date);
      return recency.daysOld <= 30;
    });
    const olderReviews = reviews.filter(r => {
      const recency = recencyCalculatorService.calculateRecency(r.date);
      return recency.daysOld > 30 && recency.daysOld <= 90;
    });

    const recentAvg = recentReviews.length > 0
      ? recentReviews.reduce((a, b) => a + b.rating, 0) / recentReviews.length
      : averageRating;
    const olderAvg = olderReviews.length > 0
      ? olderReviews.reduce((a, b) => a + b.rating, 0) / olderReviews.length
      : averageRating;

    let recentTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (recentAvg - olderAvg > 0.3) recentTrend = 'improving';
    if (olderAvg - recentAvg > 0.3) recentTrend = 'declining';

    // Recency stats
    const recencyStats = {
      last7Days: 0,
      last30Days: 0,
      last90Days: 0,
      older: 0,
    };
    for (const review of reviews) {
      const recency = recencyCalculatorService.calculateRecency(review.date);
      if (recency.daysOld <= 7) recencyStats.last7Days++;
      else if (recency.daysOld <= 30) recencyStats.last30Days++;
      else if (recency.daysOld <= 90) recencyStats.last90Days++;
      else recencyStats.older++;
    }

    // Sentiment analysis
    const aggregatedSentiment = this.analyzeReviewsSentiment(reviews);

    // Extract top pain points
    const topPainPoints = this.extractTopPainPoints(reviews);

    // Extract top desires
    const topDesires = this.extractTopDesires(reviews);

    return {
      entityName,
      entityType,
      reviews,
      platformBreakdown,
      ratingSummary: {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: reviews.length,
        ratingDistribution,
        recentTrend,
      },
      aggregatedSentiment,
      topPainPoints,
      topDesires,
      recencyStats,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Analyze sentiment across reviews
   */
  analyzeReviewsSentiment(reviews: NormalizedReview[]): ReviewSentimentAnalysis {
    const positiveThemes: Map<string, number> = new Map();
    const negativeThemes: Map<string, number> = new Map();
    const painPoints: string[] = [];
    const desires: string[] = [];
    const featureMentions: string[] = [];
    const competitorMentions: string[] = [];

    let sentimentSum = 0;

    for (const review of reviews) {
      // Calculate sentiment from rating
      const reviewSentiment = (review.rating - 3) / 2; // Maps 1-5 to -1 to 1
      sentimentSum += reviewSentiment;

      // Extract from pros/cons if available
      if (review.pros) {
        for (const pro of review.pros) {
          const key = this.normalizeTheme(pro);
          positiveThemes.set(key, (positiveThemes.get(key) || 0) + 1);
        }
      }
      if (review.cons) {
        for (const con of review.cons) {
          const key = this.normalizeTheme(con);
          negativeThemes.set(key, (negativeThemes.get(key) || 0) + 1);
        }
      }

      // Extract pain points from body
      const bodyPainPoints = this.extractPainPointsFromText(review.body);
      painPoints.push(...bodyPainPoints);

      // Extract desires from body
      const bodyDesires = this.extractDesiresFromText(review.body);
      desires.push(...bodyDesires);

      // Check for competitor mentions
      const competitors = competitorAttributionService.extractCompetitorMentions(review.body);
      if (competitors.primaryCompetitor) {
        competitorMentions.push(competitors.primaryCompetitor);
      }
    }

    const avgSentiment = reviews.length > 0 ? sentimentSum / reviews.length : 0;
    let sentiment: ReviewSentimentAnalysis['sentiment'] = 'neutral';
    if (avgSentiment > 0.3) sentiment = 'positive';
    else if (avgSentiment < -0.3) sentiment = 'negative';
    else if (positiveThemes.size > 0 && negativeThemes.size > 0) sentiment = 'mixed';

    return {
      sentiment,
      sentimentScore: Math.round(avgSentiment * 100) / 100,
      positiveThemes: this.getTopThemes(positiveThemes, 5),
      negativeThemes: this.getTopThemes(negativeThemes, 5),
      painPoints: [...new Set(painPoints)].slice(0, 10),
      desires: [...new Set(desires)].slice(0, 10),
      featureMentions: [...new Set(featureMentions)].slice(0, 10),
      competitorMentions: [...new Set(competitorMentions)],
    };
  }

  /**
   * Extract pain points from text
   */
  extractPainPointsFromText(text: string): string[] {
    const painPoints: string[] = [];

    for (const { pattern, category } of PAIN_POINT_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        const matchIndex = text.indexOf(match[0]);
        const start = Math.max(0, matchIndex - 20);
        const end = Math.min(text.length, matchIndex + match[0].length + 60);
        const context = text.slice(start, end).trim();
        painPoints.push(`[${category}] ${context}`);
      }
    }

    return painPoints;
  }

  /**
   * Extract desires from text
   */
  extractDesiresFromText(text: string): string[] {
    const desires: string[] = [];

    for (const { pattern, category } of DESIRE_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        const matchIndex = text.indexOf(match[0]);
        const start = Math.max(0, matchIndex);
        const end = Math.min(text.length, matchIndex + 100);
        const context = text.slice(start, end).trim();
        desires.push(`[${category}] ${context}`);
      }
    }

    return desires;
  }

  /**
   * Extract and rank top pain points across all reviews
   */
  extractTopPainPoints(
    reviews: NormalizedReview[]
  ): Array<{ painPoint: string; frequency: number; examples: string[] }> {
    const painPointMap: Map<string, { count: number; examples: string[] }> = new Map();

    for (const review of reviews) {
      // From cons
      if (review.cons) {
        for (const con of review.cons) {
          const normalized = this.normalizeTheme(con);
          const existing = painPointMap.get(normalized) || { count: 0, examples: [] };
          existing.count++;
          if (existing.examples.length < 3) {
            existing.examples.push(con);
          }
          painPointMap.set(normalized, existing);
        }
      }

      // From body text
      const bodyPainPoints = this.extractPainPointsFromText(review.body);
      for (const pp of bodyPainPoints) {
        const normalized = this.normalizeTheme(pp);
        const existing = painPointMap.get(normalized) || { count: 0, examples: [] };
        existing.count++;
        if (existing.examples.length < 3) {
          existing.examples.push(review.body.slice(0, 200));
        }
        painPointMap.set(normalized, existing);
      }
    }

    // Sort by frequency
    return Array.from(painPointMap.entries())
      .map(([painPoint, data]) => ({
        painPoint,
        frequency: data.count,
        examples: data.examples,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  }

  /**
   * Extract and rank top desires across all reviews
   */
  extractTopDesires(
    reviews: NormalizedReview[]
  ): Array<{ desire: string; frequency: number; examples: string[] }> {
    const desireMap: Map<string, { count: number; examples: string[] }> = new Map();

    for (const review of reviews) {
      const bodyDesires = this.extractDesiresFromText(review.body);
      for (const desire of bodyDesires) {
        const normalized = this.normalizeTheme(desire);
        const existing = desireMap.get(normalized) || { count: 0, examples: [] };
        existing.count++;
        if (existing.examples.length < 3) {
          existing.examples.push(review.body.slice(0, 200));
        }
        desireMap.set(normalized, existing);
      }
    }

    return Array.from(desireMap.entries())
      .map(([desire, data]) => ({
        desire,
        frequency: data.count,
        examples: data.examples,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  }

  /**
   * Filter reviews for competitor pain mining
   * (Low ratings from competitor reviews = trigger opportunities)
   */
  getCompetitorPainReviews(
    aggregatedData: AggregatedReviewData,
    maxRating: number = 3
  ): NormalizedReview[] {
    return aggregatedData.reviews
      .filter(r => r.rating <= maxRating)
      .sort((a, b) => {
        // Prioritize recent, helpful reviews
        const recencyA = recencyCalculatorService.calculateRecency(a.date);
        const recencyB = recencyCalculatorService.calculateRecency(b.date);
        const scoreA = recencyA.multiplier * (a.helpfulVotes || 1);
        const scoreB = recencyB.multiplier * (b.helpfulVotes || 1);
        return scoreB - scoreA;
      });
  }

  /**
   * Get default aggregation config for a profile
   */
  getDefaultConfig(profileType: BusinessProfileType): ReviewAggregationConfig {
    return {
      platforms: this.getPlatformsForProfile(profileType),
      maxReviewsPerPlatform: 50,
      verifiedOnly: false,
      maxAgeDays: 180,
    };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Normalize a date to ISO string
   */
  private normalizeDate(date: string | number | Date | undefined): string {
    if (!date) return new Date().toISOString();

    try {
      if (typeof date === 'number') {
        // Unix timestamp
        return new Date(date * 1000).toISOString();
      }
      if (date instanceof Date) {
        return date.toISOString();
      }
      return new Date(date).toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  /**
   * Normalize theme text for grouping
   */
  private normalizeTheme(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 50);
  }

  /**
   * Get top themes from a frequency map
   */
  private getTopThemes(themeMap: Map<string, number>, limit: number): string[] {
    return Array.from(themeMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([theme]) => theme);
  }
}

// Export singleton
export const reviewAggregatorService = new ReviewAggregatorService();

// Export class for testing
export { ReviewAggregatorService };
