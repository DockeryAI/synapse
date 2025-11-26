/**
 * Review Extractor Service
 *
 * Extracts products and services from Google Reviews data.
 * Analyzes review text to identify mentioned offerings.
 */

import {
  BaseExtractor,
  type ExtractorContext,
  type ExtractorConfig,
} from './base-extractor';
import type {
  ExtractedProduct,
  SingleExtractionResult,
  ReviewExtractionOptions,
} from '../../types';
import { isFeatureEnabled } from '../../config/feature-flags';
import { getPMSupabaseClient } from '../catalog/supabase-pm.client';

// ============================================================================
// REVIEW EXTRACTOR CLASS
// ============================================================================

class ReviewExtractor extends BaseExtractor {
  private options: ReviewExtractionOptions;

  constructor(config: ExtractorConfig = {}, options: ReviewExtractionOptions = {}) {
    super('reviews', config);
    this.options = {
      minMentions: options.minMentions ?? 2,
      includeSentiment: options.includeSentiment ?? true,
    };
  }

  async extract(context: ExtractorContext): Promise<SingleExtractionResult> {
    const startTime = Date.now();

    if (!isFeatureEnabled('EXTRACTION_REVIEWS_ENABLED')) {
      return this.createErrorResult(
        'Review extraction is disabled',
        Date.now() - startTime
      );
    }

    try {
      this.checkAborted(context.signal);

      // Fetch review data
      const reviews = await this.fetchReviewData(context.brandId);

      if (!reviews || reviews.length === 0) {
        return this.createSuccessResult([], Date.now() - startTime, {
          reason: 'No reviews found for brand',
        });
      }

      this.checkAborted(context.signal);

      // Extract products from reviews
      const products = await this.extractFromReviews(reviews);

      // Filter and limit
      const filtered = this.filterByConfidence(products);
      const limited = this.limitProducts(filtered);

      return this.createSuccessResult(limited, Date.now() - startTime, {
        reviewsAnalyzed: reviews.length,
        totalExtracted: products.length,
        afterFiltering: filtered.length,
      });
    } catch (error) {
      return this.createErrorResult(
        error instanceof Error ? error.message : 'Review extraction failed',
        Date.now() - startTime
      );
    }
  }

  /**
   * Fetch review data from intelligence cache
   */
  private async fetchReviewData(brandId: string): Promise<ReviewRecord[]> {
    const client = getPMSupabaseClient();

    // Try intelligence cache first
    const { data: cacheData } = await client
      .from('intelligence_cache')
      .select('*')
      .eq('brand_id', brandId)
      .in('cache_type', ['google_reviews', 'reviews', 'outscraper_reviews'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (cacheData && cacheData.length > 0) {
      return this.parseReviewCache(cacheData[0].cached_data);
    }

    // Fallback to check for direct review data
    const { data: reviewData } = await client
      .from('brand_reviews')
      .select('*')
      .eq('brand_id', brandId)
      .order('review_date', { ascending: false })
      .limit(100);

    if (reviewData) {
      return reviewData.map(r => ({
        id: r.id,
        text: r.review_text || r.text || '',
        rating: r.rating,
        date: r.review_date || r.created_at,
      }));
    }

    return [];
  }

  /**
   * Parse review cache data
   */
  private parseReviewCache(data: unknown): ReviewRecord[] {
    if (!data) return [];

    let reviews: unknown[] = [];

    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        reviews = Array.isArray(parsed) ? parsed : (parsed.reviews || []);
      } catch {
        return [];
      }
    } else if (Array.isArray(data)) {
      reviews = data;
    } else if (typeof data === 'object' && data !== null) {
      const obj = data as Record<string, unknown>;
      reviews = Array.isArray(obj.reviews) ? obj.reviews : [];
    }

    return reviews.map((r: unknown) => {
      const review = r as Record<string, unknown>;
      return {
        id: String(review.id || review.reviewId || ''),
        text: String(review.text || review.review_text || review.snippet || ''),
        rating: typeof review.rating === 'number' ? review.rating : undefined,
        date: String(review.date || review.publishedAtDate || ''),
      };
    }).filter(r => r.text.length > 10);
  }

  /**
   * Extract products from review data
   */
  private async extractFromReviews(reviews: ReviewRecord[]): Promise<ExtractedProduct[]> {
    // Collect all mentions
    const mentions = new Map<string, MentionData>();

    for (const review of reviews) {
      const extracted = this.extractMentionsFromText(review.text);

      for (const mention of extracted) {
        const key = mention.name.toLowerCase();
        const existing = mentions.get(key);

        if (existing) {
          existing.count++;
          existing.contexts.push(review.text.slice(0, 200));
          if (review.rating !== undefined) {
            existing.ratings.push(review.rating);
          }
        } else {
          mentions.set(key, {
            name: mention.name,
            isService: mention.isService,
            count: 1,
            contexts: [review.text.slice(0, 200)],
            ratings: review.rating !== undefined ? [review.rating] : [],
          });
        }
      }
    }

    // Convert mentions to products
    const products: ExtractedProduct[] = [];

    for (const [, mention] of mentions) {
      // Only include if mentioned enough times
      if (mention.count >= (this.options.minMentions ?? 2)) {
        const confidence = this.calculateConfidence(mention);
        const sentiment = this.options.includeSentiment
          ? this.calculateSentiment(mention.ratings)
          : undefined;

        products.push(this.createExtractedProduct(
          this.normalizeName(mention.name),
          confidence,
          {
            isService: mention.isService,
            description: this.generateDescription(mention),
            tags: [
              ...this.generateTags({ name: mention.name, isService: mention.isService }),
              sentiment ? `sentiment-${sentiment}` : undefined,
            ].filter((t): t is string => Boolean(t)),
            rawData: {
              source: 'reviews',
              mentionCount: mention.count,
              averageRating: mention.ratings.length > 0
                ? mention.ratings.reduce((a, b) => a + b, 0) / mention.ratings.length
                : undefined,
              sentiment,
            },
          }
        ));
      }
    }

    return products;
  }

  /**
   * Extract product/service mentions from review text
   */
  private extractMentionsFromText(text: string): Array<{ name: string; isService: boolean }> {
    const mentions: Array<{ name: string; isService: boolean }> = [];

    // Patterns for product/service mentions in reviews
    const patterns = [
      // "their X was excellent"
      /their\s+([A-Za-z][A-Za-z\s]{2,25}?)\s+(?:was|were|is|are)\s+(?:excellent|great|amazing|wonderful|fantastic|good|decent|okay|poor|terrible)/gi,
      // "the X service"
      /the\s+([A-Za-z][A-Za-z\s]{2,25}?)\s+service/gi,
      // "loved the X"
      /(?:loved|enjoyed|appreciated|liked|hated|disliked)\s+(?:the\s+)?([A-Za-z][A-Za-z\s]{2,25})/gi,
      // "X was/were [adjective]"
      /([A-Z][A-Za-z]{2,20}(?:\s+[A-Za-z]{2,15})?)\s+(?:was|were)\s+(?:excellent|great|amazing|terrible|poor|good)/g,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const name = match[1].trim();
        if (name.length >= 3 && name.split(' ').length <= 4) {
          // Skip common false positives
          const skipWords = ['staff', 'team', 'people', 'experience', 'place', 'location', 'everyone', 'everything', 'nothing', 'something'];
          if (!skipWords.includes(name.toLowerCase())) {
            mentions.push({
              name,
              isService: this.detectIsService(name),
            });
          }
        }
      }
    }

    return mentions;
  }

  /**
   * Calculate confidence based on mention data
   */
  private calculateConfidence(mention: MentionData): number {
    let confidence = 0.5;

    // More mentions = higher confidence
    if (mention.count >= 10) confidence += 0.3;
    else if (mention.count >= 5) confidence += 0.2;
    else if (mention.count >= 3) confidence += 0.1;

    // Consistent ratings = higher confidence
    if (mention.ratings.length >= 3) {
      const avg = mention.ratings.reduce((a, b) => a + b, 0) / mention.ratings.length;
      const variance = mention.ratings.reduce((sum, r) => sum + Math.pow(r - avg, 2), 0) / mention.ratings.length;
      if (variance < 1) confidence += 0.1;
    }

    return Math.min(0.95, confidence);
  }

  /**
   * Calculate sentiment from ratings
   */
  private calculateSentiment(ratings: number[]): 'positive' | 'negative' | 'neutral' | undefined {
    if (ratings.length === 0) return undefined;

    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;

    if (avg >= 4) return 'positive';
    if (avg <= 2) return 'negative';
    return 'neutral';
  }

  /**
   * Generate description from mention data
   */
  private generateDescription(mention: MentionData): string {
    const sentiment = this.calculateSentiment(mention.ratings);
    const sentimentText = sentiment === 'positive' ? 'highly rated'
      : sentiment === 'negative' ? 'needs improvement'
      : 'mentioned';

    return `${sentimentText} in ${mention.count} customer review${mention.count > 1 ? 's' : ''}`;
  }
}

// ============================================================================
// TYPES
// ============================================================================

interface ReviewRecord {
  id: string;
  text: string;
  rating?: number;
  date: string;
}

interface MentionData {
  name: string;
  isService: boolean;
  count: number;
  contexts: string[];
  ratings: number[];
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createReviewExtractor(
  config?: ExtractorConfig,
  options?: ReviewExtractionOptions
): ReviewExtractor {
  return new ReviewExtractor(config, options);
}

export { ReviewExtractor };
