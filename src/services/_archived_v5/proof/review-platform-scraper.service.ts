/**
 * Review Platform Scraper Service
 *
 * Scrapes G2, Capterra, TrustRadius, Clutch for B2B software reviews
 * Uses Serper API to search and extract review data
 *
 * Created: 2025-11-29 (Phase 7.1)
 */

import { SerperAPI } from '@/services/intelligence/serper-api';

// ============================================================================
// TYPES
// ============================================================================

export interface ReviewPlatformReview {
  platform: 'g2' | 'capterra' | 'trustradius' | 'clutch' | 'trustpilot';
  rating?: number;           // Star rating 1-5
  reviewCount?: number;      // Total reviews on platform
  quote?: string;            // Extracted review quote
  reviewerName?: string;     // Reviewer name
  reviewerCompany?: string;  // Reviewer's company
  reviewerRole?: string;     // Reviewer's role
  reviewDate?: string;       // Date of review
  sourceUrl: string;         // Link to source
  badges?: string[];         // G2 Leader, High Performer, etc.
  categories?: string[];     // Software categories
  verified?: boolean;        // Verified review
}

export interface PlatformSummary {
  platform: 'g2' | 'capterra' | 'trustradius' | 'clutch' | 'trustpilot';
  found: boolean;
  profileUrl?: string;
  overallRating?: number;
  totalReviews?: number;
  badges?: string[];
  topReviews: ReviewPlatformReview[];
}

export interface ReviewPlatformResult {
  brandName: string;
  g2?: PlatformSummary;
  capterra?: PlatformSummary;
  trustradius?: PlatformSummary;
  clutch?: PlatformSummary;
  trustpilot?: PlatformSummary;
  allReviews: ReviewPlatformReview[];
  fetchedAt: Date;
}

// ============================================================================
// EXTRACTION PATTERNS
// ============================================================================

const RATING_PATTERNS = [
  /(\d+\.?\d*)\s*(?:out of\s*)?(?:\/\s*)?5(?:\s*stars?)?/i,
  /(\d+\.?\d*)\s*stars?/i,
  /rating[:\s]+(\d+\.?\d*)/i,
  /(\d+\.?\d*)★/i,
];

const REVIEW_COUNT_PATTERNS = [
  /(\d+,?\d*)\s*reviews?/i,
  /(\d+,?\d*)\s*ratings?/i,
  /based on\s*(\d+,?\d*)/i,
];

const G2_BADGE_PATTERNS = [
  /leader/i,
  /high performer/i,
  /momentum leader/i,
  /best usability/i,
  /best results/i,
  /best relationship/i,
  /easiest to use/i,
  /best support/i,
  /users love us/i,
  /top 50/i,
  /top 100/i,
];

// ============================================================================
// SERVICE
// ============================================================================

class ReviewPlatformScraperService {
  private serperApi = SerperAPI;

  /**
   * Main entry point - scrape all relevant platforms for a brand
   */
  async scrapeAllPlatforms(brandName: string): Promise<ReviewPlatformResult> {
    console.log('[ReviewPlatformScraper] Starting scrape for:', brandName);

    const result: ReviewPlatformResult = {
      brandName,
      allReviews: [],
      fetchedAt: new Date()
    };

    // Fire all platform searches in parallel
    const [g2Result, capterraResult, trustradiusResult, clutchResult, trustpilotResult] = await Promise.allSettled([
      this.scrapeG2(brandName),
      this.scrapeCapterra(brandName),
      this.scrapeTrustRadius(brandName),
      this.scrapeClutch(brandName),
      this.scrapeTrustpilot(brandName)
    ]);

    // Process G2
    if (g2Result.status === 'fulfilled' && g2Result.value) {
      result.g2 = g2Result.value;
      result.allReviews.push(...g2Result.value.topReviews);
      console.log('[ReviewPlatformScraper] G2:', g2Result.value.found ? 'Found' : 'Not found');
    }

    // Process Capterra
    if (capterraResult.status === 'fulfilled' && capterraResult.value) {
      result.capterra = capterraResult.value;
      result.allReviews.push(...capterraResult.value.topReviews);
      console.log('[ReviewPlatformScraper] Capterra:', capterraResult.value.found ? 'Found' : 'Not found');
    }

    // Process TrustRadius
    if (trustradiusResult.status === 'fulfilled' && trustradiusResult.value) {
      result.trustradius = trustradiusResult.value;
      result.allReviews.push(...trustradiusResult.value.topReviews);
      console.log('[ReviewPlatformScraper] TrustRadius:', trustradiusResult.value.found ? 'Found' : 'Not found');
    }

    // Process Clutch
    if (clutchResult.status === 'fulfilled' && clutchResult.value) {
      result.clutch = clutchResult.value;
      result.allReviews.push(...clutchResult.value.topReviews);
      console.log('[ReviewPlatformScraper] Clutch:', clutchResult.value.found ? 'Found' : 'Not found');
    }

    // Process Trustpilot
    if (trustpilotResult.status === 'fulfilled' && trustpilotResult.value) {
      result.trustpilot = trustpilotResult.value;
      result.allReviews.push(...trustpilotResult.value.topReviews);
      console.log('[ReviewPlatformScraper] Trustpilot:', trustpilotResult.value.found ? 'Found' : 'Not found');
    }

    console.log('[ReviewPlatformScraper] Total reviews found:', result.allReviews.length);
    return result;
  }

  /**
   * Scrape G2 reviews
   */
  async scrapeG2(brandName: string): Promise<PlatformSummary> {
    const summary: PlatformSummary = {
      platform: 'g2',
      found: false,
      topReviews: []
    };

    try {
      // Search for G2 profile page
      const query = `"${brandName}" site:g2.com reviews`;
      const results = await this.serperApi.searchGoogle(query);

      if (results.length === 0) {
        return summary;
      }

      // Find the main G2 product page
      const g2Result = results.find(r =>
        r.link.includes('g2.com/products/') ||
        r.link.includes('g2.com/categories/')
      ) || results[0];

      if (!g2Result.link.includes('g2.com')) {
        return summary;
      }

      summary.found = true;
      summary.profileUrl = g2Result.link;

      // Extract rating from snippet
      const ratingMatch = this.extractRating(g2Result.snippet + ' ' + g2Result.title);
      if (ratingMatch) summary.overallRating = ratingMatch;

      // Extract review count
      const reviewCount = this.extractReviewCount(g2Result.snippet + ' ' + g2Result.title);
      if (reviewCount) summary.totalReviews = reviewCount;

      // Extract badges from snippet
      summary.badges = this.extractG2Badges(g2Result.snippet + ' ' + g2Result.title);

      // Create a review entry from the main result
      if (g2Result.snippet) {
        summary.topReviews.push({
          platform: 'g2',
          quote: g2Result.snippet,
          sourceUrl: g2Result.link,
          rating: summary.overallRating,
          reviewCount: summary.totalReviews,
          badges: summary.badges,
          verified: true
        });
      }

      // Search for additional G2 reviews
      const reviewQuery = `"${brandName}" site:g2.com/products reviews`;
      const reviewResults = await this.serperApi.searchGoogle(reviewQuery);

      for (const review of reviewResults.slice(0, 3)) {
        if (review.link !== g2Result.link && review.snippet) {
          summary.topReviews.push({
            platform: 'g2',
            quote: review.snippet,
            sourceUrl: review.link,
            verified: true
          });
        }
      }

    } catch (error) {
      console.warn('[ReviewPlatformScraper] G2 scrape error:', error);
    }

    return summary;
  }

  /**
   * Scrape Capterra reviews
   */
  async scrapeCapterra(brandName: string): Promise<PlatformSummary> {
    const summary: PlatformSummary = {
      platform: 'capterra',
      found: false,
      topReviews: []
    };

    try {
      const query = `"${brandName}" site:capterra.com reviews`;
      const results = await this.serperApi.searchGoogle(query);

      if (results.length === 0) {
        return summary;
      }

      const capterraResult = results.find(r => r.link.includes('capterra.com')) || results[0];

      if (!capterraResult.link.includes('capterra.com')) {
        return summary;
      }

      summary.found = true;
      summary.profileUrl = capterraResult.link;

      // Extract rating and review count
      const combinedText = capterraResult.snippet + ' ' + capterraResult.title;
      summary.overallRating = this.extractRating(combinedText);
      summary.totalReviews = this.extractReviewCount(combinedText);

      if (capterraResult.snippet) {
        summary.topReviews.push({
          platform: 'capterra',
          quote: capterraResult.snippet,
          sourceUrl: capterraResult.link,
          rating: summary.overallRating,
          reviewCount: summary.totalReviews,
          verified: true
        });
      }

      // Get more reviews
      const reviewResults = await this.serperApi.searchGoogle(`"${brandName}" site:capterra.com/reviews`);
      for (const review of reviewResults.slice(0, 3)) {
        if (review.link !== capterraResult.link && review.snippet) {
          summary.topReviews.push({
            platform: 'capterra',
            quote: review.snippet,
            sourceUrl: review.link,
            verified: true
          });
        }
      }

    } catch (error) {
      console.warn('[ReviewPlatformScraper] Capterra scrape error:', error);
    }

    return summary;
  }

  /**
   * Scrape TrustRadius reviews
   */
  async scrapeTrustRadius(brandName: string): Promise<PlatformSummary> {
    const summary: PlatformSummary = {
      platform: 'trustradius',
      found: false,
      topReviews: []
    };

    try {
      const query = `"${brandName}" site:trustradius.com`;
      const results = await this.serperApi.searchGoogle(query);

      if (results.length === 0) {
        return summary;
      }

      const trResult = results.find(r => r.link.includes('trustradius.com/products/')) || results[0];

      if (!trResult.link.includes('trustradius.com')) {
        return summary;
      }

      summary.found = true;
      summary.profileUrl = trResult.link;

      const combinedText = trResult.snippet + ' ' + trResult.title;
      summary.overallRating = this.extractRating(combinedText);
      summary.totalReviews = this.extractReviewCount(combinedText);

      if (trResult.snippet) {
        summary.topReviews.push({
          platform: 'trustradius',
          quote: trResult.snippet,
          sourceUrl: trResult.link,
          rating: summary.overallRating,
          reviewCount: summary.totalReviews,
          verified: true
        });
      }

    } catch (error) {
      console.warn('[ReviewPlatformScraper] TrustRadius scrape error:', error);
    }

    return summary;
  }

  /**
   * Scrape Clutch reviews (for agencies)
   */
  async scrapeClutch(brandName: string): Promise<PlatformSummary> {
    const summary: PlatformSummary = {
      platform: 'clutch',
      found: false,
      topReviews: []
    };

    try {
      const query = `"${brandName}" site:clutch.co`;
      const results = await this.serperApi.searchGoogle(query);

      if (results.length === 0) {
        return summary;
      }

      const clutchResult = results.find(r => r.link.includes('clutch.co/profile/')) || results[0];

      if (!clutchResult.link.includes('clutch.co')) {
        return summary;
      }

      summary.found = true;
      summary.profileUrl = clutchResult.link;

      const combinedText = clutchResult.snippet + ' ' + clutchResult.title;
      summary.overallRating = this.extractRating(combinedText);
      summary.totalReviews = this.extractReviewCount(combinedText);

      if (clutchResult.snippet) {
        summary.topReviews.push({
          platform: 'clutch',
          quote: clutchResult.snippet,
          sourceUrl: clutchResult.link,
          rating: summary.overallRating,
          reviewCount: summary.totalReviews,
          verified: true
        });
      }

    } catch (error) {
      console.warn('[ReviewPlatformScraper] Clutch scrape error:', error);
    }

    return summary;
  }

  /**
   * Scrape Trustpilot reviews
   */
  async scrapeTrustpilot(brandName: string): Promise<PlatformSummary> {
    const summary: PlatformSummary = {
      platform: 'trustpilot',
      found: false,
      topReviews: []
    };

    try {
      const query = `"${brandName}" site:trustpilot.com`;
      const results = await this.serperApi.searchGoogle(query);

      if (results.length === 0) {
        return summary;
      }

      // Find the main Trustpilot review page
      const trustpilotResult = results.find(r =>
        r.link.includes('trustpilot.com/review/') ||
        r.link.includes('trustpilot.com/reviews/')
      ) || results[0];

      if (!trustpilotResult.link.includes('trustpilot.com')) {
        return summary;
      }

      summary.found = true;
      summary.profileUrl = trustpilotResult.link;

      const combinedText = trustpilotResult.snippet + ' ' + trustpilotResult.title;
      summary.overallRating = this.extractRating(combinedText);
      summary.totalReviews = this.extractReviewCount(combinedText);

      // Extract TrustScore if present (Trustpilot specific format)
      const trustScoreMatch = combinedText.match(/trustscore[:\s]+(\d+\.?\d*)/i);
      if (trustScoreMatch) {
        summary.overallRating = parseFloat(trustScoreMatch[1]);
      }

      if (trustpilotResult.snippet) {
        summary.topReviews.push({
          platform: 'trustpilot',
          quote: trustpilotResult.snippet,
          sourceUrl: trustpilotResult.link,
          rating: summary.overallRating,
          reviewCount: summary.totalReviews,
          verified: true
        });
      }

      // Get more Trustpilot reviews
      const reviewQuery = `"${brandName}" site:trustpilot.com/review reviews`;
      const reviewResults = await this.serperApi.searchGoogle(reviewQuery);

      for (const review of reviewResults.slice(0, 3)) {
        if (review.link !== trustpilotResult.link && review.snippet && review.link.includes('trustpilot.com')) {
          summary.topReviews.push({
            platform: 'trustpilot',
            quote: review.snippet,
            sourceUrl: review.link,
            verified: true
          });
        }
      }

    } catch (error) {
      console.warn('[ReviewPlatformScraper] Trustpilot scrape error:', error);
    }

    return summary;
  }

  // ============================================================================
  // EXTRACTION HELPERS
  // ============================================================================

  private extractRating(text: string): number | undefined {
    for (const pattern of RATING_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        const rating = parseFloat(match[1]);
        if (rating >= 1 && rating <= 5) {
          return Math.round(rating * 10) / 10; // Round to 1 decimal
        }
      }
    }
    return undefined;
  }

  private extractReviewCount(text: string): number | undefined {
    for (const pattern of REVIEW_COUNT_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        const count = parseInt(match[1].replace(/,/g, ''), 10);
        if (count > 0) {
          return count;
        }
      }
    }
    return undefined;
  }

  private extractG2Badges(text: string): string[] {
    const badges: string[] = [];
    const lowerText = text.toLowerCase();

    for (const pattern of G2_BADGE_PATTERNS) {
      if (pattern.test(lowerText)) {
        const match = lowerText.match(pattern);
        if (match) {
          // Capitalize first letter of each word
          const badge = match[0].split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
          badges.push(badge);
        }
      }
    }

    return [...new Set(badges)]; // Remove duplicates
  }
}

export const reviewPlatformScraperService = new ReviewPlatformScraperService();
export default reviewPlatformScraperService;
