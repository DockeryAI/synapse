/**
 * Review Source Router Service
 *
 * Intelligently routes review fetching to appropriate sources based on business segment.
 * Part of Gap Tab 2.0 - Phase 2 (Reviews & Ads)
 *
 * Source Matrix:
 * - Local SMB: Google Maps Reviews, Yelp
 * - B2B Local: Google Maps, Avvo/Clutch (via Perplexity)
 * - B2B National: G2, Capterra, TrustRadius
 * - B2B Global: G2 Enterprise, TrustRadius, Gartner Peer Insights
 * - DTC National: Trustpilot, Amazon Reviews, BBB
 * - DTC Local: Yelp, Google, Facebook Reviews
 *
 * Created: 2025-11-28 (Day 2)
 */

import { SerperAPI, PlaceResult, PlaceReview } from './serper-api';
import type {
  SegmentType,
  BusinessType,
  ScanType,
  CompetitorProfile
} from '@/types/competitor-intelligence.types';

// ============================================================================
// JSON SANITIZER - Handles malformed LLM responses
// ============================================================================

/**
 * Safely parse JSON from LLM responses that may contain:
 * - Markdown code blocks
 * - Citation markers [1], [2]
 * - Trailing text after JSON
 * - Truncated responses
 */
function safeParseJSON<T = any>(content: string, fallback: T): T {
  if (!content || typeof content !== 'string') {
    return fallback;
  }

  // Step 1: Remove markdown code blocks
  let cleaned = content
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  // Step 2: Extract JSON array or object
  const jsonMatch = cleaned.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
  if (!jsonMatch) {
    console.warn('[JSON Sanitizer] No JSON structure found in response');
    return fallback;
  }

  let jsonStr = jsonMatch[1];

  // Step 3: Remove citation markers like [1], [2] that break JSON
  jsonStr = jsonStr.replace(/\[\d+\]/g, '');

  // Step 4: Fix common JSON issues
  jsonStr = jsonStr
    // Fix trailing commas before closing brackets
    .replace(/,\s*([}\]])/g, '$1')
    // Fix unquoted keys (simple cases)
    .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
    // Fix single quotes to double quotes (careful with apostrophes)
    .replace(/'([^']*)'(\s*[,}\]])/g, '"$1"$2');

  // Step 5: Attempt to repair truncated JSON
  const openBrackets = (jsonStr.match(/\[/g) || []).length;
  const closeBrackets = (jsonStr.match(/\]/g) || []).length;
  const openBraces = (jsonStr.match(/\{/g) || []).length;
  const closeBraces = (jsonStr.match(/\}/g) || []).length;

  // Add missing closing brackets/braces
  for (let i = 0; i < openBraces - closeBraces; i++) {
    jsonStr += '}';
  }
  for (let i = 0; i < openBrackets - closeBrackets; i++) {
    jsonStr += ']';
  }

  // Step 6: Try to parse
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.warn('[JSON Sanitizer] Parse failed after sanitization:', (e as Error).message);

    // Step 7: Last resort - try to extract valid JSON objects from the string
    try {
      const objects: any[] = [];
      const objectRegex = /\{[^{}]*\}/g;
      let match;
      while ((match = objectRegex.exec(jsonStr)) !== null) {
        try {
          objects.push(JSON.parse(match[0]));
        } catch {
          // Skip invalid objects
        }
      }
      if (objects.length > 0) {
        console.log('[JSON Sanitizer] Recovered', objects.length, 'objects via fallback extraction');
        return objects as T;
      }
    } catch {
      // Final fallback
    }

    return fallback;
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface ReviewSource {
  platform: ScanType;
  display_name: string;
  priority: number; // 1 = highest priority
  requires_location: boolean;
  data_quality: 'high' | 'medium' | 'low';
}

export interface FetchedReview {
  id: string;
  platform: string;
  author: string;
  rating: number | null;
  text: string;
  date: string;
  helpful_count?: number;
  verified?: boolean;
  response?: string; // Business response if any
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export interface ReviewFetchResult {
  platform: string;
  competitor_id: string;
  competitor_name: string;
  reviews: FetchedReview[];
  summary: ReviewSummary;
  raw_data?: unknown;
  error?: string;
  fetch_time_ms: number;
}

export interface ReviewSummary {
  total_reviews: number;
  average_rating: number | null;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  top_complaints: string[];
  top_praises: string[];
  sentiment_score: number; // -1 to 1
}

export interface ReviewRouterConfig {
  max_reviews_per_source: number;
  enable_sentiment_analysis: boolean;
  fallback_to_perplexity: boolean;
  parallel_fetches: number;
}

// ============================================================================
// SOURCE DEFINITIONS
// ============================================================================

const REVIEW_SOURCES: Record<ScanType, ReviewSource> = {
  'reviews-google': {
    platform: 'reviews-google',
    display_name: 'Google Reviews',
    priority: 1,
    requires_location: true,
    data_quality: 'high'
  },
  'reviews-yelp': {
    platform: 'reviews-yelp',
    display_name: 'Yelp',
    priority: 2,
    requires_location: true,
    data_quality: 'high'
  },
  'reviews-g2': {
    platform: 'reviews-g2',
    display_name: 'G2',
    priority: 1,
    requires_location: false,
    data_quality: 'high'
  },
  'reviews-capterra': {
    platform: 'reviews-capterra',
    display_name: 'Capterra',
    priority: 2,
    requires_location: false,
    data_quality: 'high'
  },
  'reviews-trustpilot': {
    platform: 'reviews-trustpilot',
    display_name: 'Trustpilot',
    priority: 3,
    requires_location: false,
    data_quality: 'medium'
  },
  // These are handled by other scan types but including for completeness
  'website': {
    platform: 'website',
    display_name: 'Website',
    priority: 99,
    requires_location: false,
    data_quality: 'low'
  },
  'perplexity-research': {
    platform: 'perplexity-research',
    display_name: 'Web Research',
    priority: 99,
    requires_location: false,
    data_quality: 'medium'
  },
  'ads-meta': {
    platform: 'ads-meta',
    display_name: 'Meta Ads',
    priority: 99,
    requires_location: false,
    data_quality: 'medium'
  },
  'ads-linkedin': {
    platform: 'ads-linkedin',
    display_name: 'LinkedIn Ads',
    priority: 99,
    requires_location: false,
    data_quality: 'medium'
  }
};

/**
 * Get review sources for a segment/business type combination
 */
function getSourcesForSegment(
  segment: SegmentType,
  businessType: BusinessType
): ReviewSource[] {
  const sources: ReviewSource[] = [];

  switch (segment) {
    case 'local':
      // Local businesses: Google Maps + Yelp primary
      sources.push(REVIEW_SOURCES['reviews-google']);
      sources.push(REVIEW_SOURCES['reviews-yelp']);
      if (businessType === 'b2b') {
        // B2B local (law firms, consultants) may also be on G2
        sources.push(REVIEW_SOURCES['reviews-g2']);
      }
      break;

    case 'regional':
      // Regional: Mix of local and national sources
      sources.push(REVIEW_SOURCES['reviews-google']);
      sources.push(REVIEW_SOURCES['reviews-yelp']);
      if (businessType === 'b2b') {
        sources.push(REVIEW_SOURCES['reviews-g2']);
        sources.push(REVIEW_SOURCES['reviews-capterra']);
      }
      break;

    case 'national':
    case 'global':
      if (businessType === 'b2b') {
        // B2B National/Global: G2 + Capterra primary
        sources.push(REVIEW_SOURCES['reviews-g2']);
        sources.push(REVIEW_SOURCES['reviews-capterra']);
        sources.push(REVIEW_SOURCES['reviews-trustpilot']);
      } else if (businessType === 'dtc') {
        // DTC: Trustpilot + Google + Amazon (via Perplexity)
        sources.push(REVIEW_SOURCES['reviews-trustpilot']);
        sources.push(REVIEW_SOURCES['reviews-google']);
      } else {
        // Mixed/B2C National: All major platforms
        sources.push(REVIEW_SOURCES['reviews-google']);
        sources.push(REVIEW_SOURCES['reviews-trustpilot']);
        sources.push(REVIEW_SOURCES['reviews-yelp']);
      }
      break;
  }

  // Sort by priority
  return sources.sort((a, b) => a.priority - b.priority);
}

// ============================================================================
// REVIEW SOURCE ROUTER SERVICE
// ============================================================================

class ReviewSourceRouterService {
  private config: ReviewRouterConfig = {
    max_reviews_per_source: 50,
    enable_sentiment_analysis: true,
    fallback_to_perplexity: true,
    parallel_fetches: 3
  };

  /**
   * Configure the router
   */
  configure(config: Partial<ReviewRouterConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get appropriate review sources for a competitor based on their segment
   */
  getSourcesForCompetitor(competitor: CompetitorProfile): ReviewSource[] {
    const segment = competitor.segment_type || 'national';
    const businessType = competitor.business_type || 'mixed';
    return getSourcesForSegment(segment, businessType);
  }

  /**
   * Fetch reviews from all appropriate sources for a competitor
   */
  async fetchReviews(
    competitor: CompetitorProfile,
    location?: string
  ): Promise<ReviewFetchResult[]> {
    const sources = this.getSourcesForCompetitor(competitor);
    const results: ReviewFetchResult[] = [];

    console.log(`[ReviewRouter] Fetching reviews for ${competitor.name} from ${sources.length} sources`);

    // Fetch from each source in parallel (up to config.parallel_fetches)
    const chunks = this.chunkArray(sources, this.config.parallel_fetches);

    for (const chunk of chunks) {
      const chunkResults = await Promise.allSettled(
        chunk.map(source => this.fetchFromSource(competitor, source, location))
      );

      for (const result of chunkResults) {
        if (result.status === 'fulfilled' && result.value) {
          results.push(result.value);
        }
      }
    }

    // If no results and fallback enabled, try Perplexity
    if (results.length === 0 && this.config.fallback_to_perplexity) {
      console.log(`[ReviewRouter] No results, falling back to Perplexity research`);
      const perplexityResult = await this.fetchFromPerplexity(competitor);
      if (perplexityResult) {
        results.push(perplexityResult);
      }
    }

    return results;
  }

  /**
   * Fetch reviews from a specific source
   */
  private async fetchFromSource(
    competitor: CompetitorProfile,
    source: ReviewSource,
    location?: string
  ): Promise<ReviewFetchResult | null> {
    const startTime = Date.now();

    try {
      let reviews: FetchedReview[] = [];

      switch (source.platform) {
        case 'reviews-google':
          reviews = await this.fetchGoogleReviews(competitor, location);
          break;

        case 'reviews-yelp':
          reviews = await this.fetchYelpReviews(competitor, location);
          break;

        case 'reviews-g2':
          reviews = await this.fetchG2Reviews(competitor);
          break;

        case 'reviews-capterra':
          reviews = await this.fetchCapterraReviews(competitor);
          break;

        case 'reviews-trustpilot':
          reviews = await this.fetchTrustpilotReviews(competitor);
          break;

        default:
          console.warn(`[ReviewRouter] Unknown source: ${source.platform}`);
          return null;
      }

      // Analyze sentiment if enabled
      if (this.config.enable_sentiment_analysis) {
        reviews = this.analyzeSentiment(reviews);
      }

      // Generate summary
      const summary = this.generateSummary(reviews);

      return {
        platform: source.display_name,
        competitor_id: competitor.id,
        competitor_name: competitor.name,
        reviews,
        summary,
        fetch_time_ms: Date.now() - startTime
      };

    } catch (error) {
      console.error(`[ReviewRouter] Error fetching from ${source.platform}:`, error);
      return {
        platform: source.display_name,
        competitor_id: competitor.id,
        competitor_name: competitor.name,
        reviews: [],
        summary: this.emptySum(),
        error: error instanceof Error ? error.message : 'Fetch failed',
        fetch_time_ms: Date.now() - startTime
      };
    }
  }

  // ==========================================================================
  // SOURCE-SPECIFIC FETCHERS
  // ==========================================================================

  /**
   * Fetch Google Reviews via Serper Places API
   */
  private async fetchGoogleReviews(
    competitor: CompetitorProfile,
    location?: string
  ): Promise<FetchedReview[]> {
    const searchLocation = location || 'United States';

    // First, find the place
    const places = await SerperAPI.getPlaces(competitor.name, searchLocation);

    if (places.length === 0) {
      console.log(`[ReviewRouter] No Google Places found for ${competitor.name}`);
      return [];
    }

    // Get the most relevant place
    const place = places[0];

    if (!place.placeId) {
      console.log(`[ReviewRouter] No place_id for ${competitor.name}, using basic place data`);
      // Return basic data without detailed reviews
      return [];
    }

    // Fetch reviews for the place
    const reviews = await SerperAPI.getPlaceReviews(place.placeId);

    return reviews.map((review, index) => ({
      id: `google-${competitor.id}-${index}`,
      platform: 'Google',
      author: review.author,
      rating: review.rating,
      text: review.text,
      date: review.date,
      sentiment: this.quickSentiment(review.rating, review.text)
    }));
  }

  /**
   * Fetch Yelp Reviews via Apify
   */
  private async fetchYelpReviews(
    competitor: CompetitorProfile,
    location?: string
  ): Promise<FetchedReview[]> {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/apify-scraper`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            scraperType: 'YELP',
            input: {
              searchTerms: [competitor.name],
              location: location || 'United States',
              maxItems: this.config.max_reviews_per_source
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Yelp scraper error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.data) {
        return [];
      }

      // Parse Yelp results
      return (data.data as any[])
        .filter((item: any) => item.reviews)
        .flatMap((item: any, bizIndex: number) =>
          (item.reviews || []).map((review: any, revIndex: number) => ({
            id: `yelp-${competitor.id}-${bizIndex}-${revIndex}`,
            platform: 'Yelp',
            author: review.userName || 'Anonymous',
            rating: review.rating || null,
            text: review.text || '',
            date: review.date || new Date().toISOString(),
            sentiment: this.quickSentiment(review.rating, review.text)
          }))
        )
        .slice(0, this.config.max_reviews_per_source);

    } catch (error) {
      console.error('[ReviewRouter] Yelp fetch error:', error);
      return [];
    }
  }

  /**
   * Fetch G2 Reviews via Perplexity (no direct API access)
   */
  private async fetchG2Reviews(competitor: CompetitorProfile): Promise<FetchedReview[]> {
    return this.fetchReviewsViaPerplexity(competitor, 'G2', 'g2.com');
  }

  /**
   * Fetch Capterra Reviews via Perplexity (no direct API access)
   */
  private async fetchCapterraReviews(competitor: CompetitorProfile): Promise<FetchedReview[]> {
    return this.fetchReviewsViaPerplexity(competitor, 'Capterra', 'capterra.com');
  }

  /**
   * Fetch Trustpilot Reviews via Perplexity (no direct API access)
   */
  private async fetchTrustpilotReviews(competitor: CompetitorProfile): Promise<FetchedReview[]> {
    return this.fetchReviewsViaPerplexity(competitor, 'Trustpilot', 'trustpilot.com');
  }

  /**
   * Generic review fetcher using Perplexity for sites without direct API
   */
  private async fetchReviewsViaPerplexity(
    competitor: CompetitorProfile,
    platformName: string,
    siteDomain: string
  ): Promise<FetchedReview[]> {
    const prompt = `Find the most recent negative reviews for "${competitor.name}" on ${platformName} (site:${siteDomain}).

For each review found, extract:
1. The reviewer's name/handle
2. Their rating (1-5 stars)
3. The full review text
4. The date of the review

Focus on negative reviews (3 stars or below) that highlight:
- Customer complaints
- Service issues
- Product problems
- Support failures

Return as a JSON array with this structure:
[
  {
    "author": "reviewer name",
    "rating": 2,
    "text": "full review text",
    "date": "2025-01-15"
  }
]

Only include real reviews you can cite. Maximum 10 reviews.`;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            provider: 'perplexity',
            model: 'sonar-pro',
            messages: [
              {
                role: 'system',
                content: 'You are a competitive intelligence analyst. Find and extract real customer reviews. Return valid JSON only.'
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.2,
            max_tokens: 2000
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Perplexity error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '[]';

      // Parse JSON from response using safe parser
      const reviews = safeParseJSON<any[]>(content, []);

      return reviews.map((review, index) => ({
        id: `${platformName.toLowerCase()}-${competitor.id}-${index}`,
        platform: platformName,
        author: review.author || 'Anonymous',
        rating: review.rating || null,
        text: review.text || '',
        date: review.date || new Date().toISOString(),
        sentiment: this.quickSentiment(review.rating, review.text)
      }));

    } catch (error) {
      console.error(`[ReviewRouter] ${platformName} fetch error:`, error);
      return [];
    }
  }

  /**
   * Fallback: Fetch general review summary via Perplexity
   */
  private async fetchFromPerplexity(competitor: CompetitorProfile): Promise<ReviewFetchResult | null> {
    const startTime = Date.now();

    const prompt = `Find customer reviews and complaints about "${competitor.name}" (${competitor.website || 'no website'}).

Search across review sites, forums, social media, and complaint boards.

For each complaint/negative review found, provide:
1. Source (where it was found)
2. Quote or summary
3. Rating if available
4. Date if available
5. The complaint type (service, product, support, pricing, etc.)

Return as JSON array:
[
  {
    "source": "Reddit r/software",
    "text": "complaint text",
    "rating": null,
    "date": "2025-01",
    "type": "support"
  }
]`;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            provider: 'perplexity',
            model: 'sonar-pro',
            messages: [
              {
                role: 'system',
                content: 'You are a competitive intelligence analyst. Find real customer complaints. Return valid JSON.'
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 2000
          })
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '[]';

      // Parse JSON from response using safe parser
      const reviews = safeParseJSON<any[]>(content, []);

      const fetchedReviews: FetchedReview[] = reviews.map((r, i) => ({
        id: `perplexity-${competitor.id}-${i}`,
        platform: r.source || 'Web Research',
        author: 'Customer',
        rating: r.rating || null,
        text: r.text || '',
        date: r.date || new Date().toISOString(),
        sentiment: 'negative' as const
      }));

      return {
        platform: 'Web Research (Perplexity)',
        competitor_id: competitor.id,
        competitor_name: competitor.name,
        reviews: fetchedReviews,
        summary: this.generateSummary(fetchedReviews),
        fetch_time_ms: Date.now() - startTime
      };

    } catch (error) {
      console.error('[ReviewRouter] Perplexity fallback error:', error);
      return null;
    }
  }

  // ==========================================================================
  // ANALYSIS HELPERS
  // ==========================================================================

  /**
   * Quick sentiment analysis based on rating and text
   */
  private quickSentiment(rating: number | null, text: string): 'positive' | 'negative' | 'neutral' {
    // Rating-based
    if (rating !== null) {
      if (rating >= 4) return 'positive';
      if (rating <= 2) return 'negative';
      return 'neutral';
    }

    // Text-based fallback
    const textLower = text.toLowerCase();
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'disappointed', 'frustrat', 'angry', 'problem', 'issue', 'bug', 'broken', 'fail', 'slow', 'expensive'];
    const positiveWords = ['great', 'excellent', 'amazing', 'love', 'best', 'awesome', 'fantastic', 'helpful', 'recommend', 'easy', 'fast', 'reliable'];

    let negScore = 0;
    let posScore = 0;

    for (const word of negativeWords) {
      if (textLower.includes(word)) negScore++;
    }
    for (const word of positiveWords) {
      if (textLower.includes(word)) posScore++;
    }

    if (negScore > posScore) return 'negative';
    if (posScore > negScore) return 'positive';
    return 'neutral';
  }

  /**
   * Analyze sentiment for reviews
   */
  private analyzeSentiment(reviews: FetchedReview[]): FetchedReview[] {
    return reviews.map(review => ({
      ...review,
      sentiment: review.sentiment || this.quickSentiment(review.rating, review.text)
    }));
  }

  /**
   * Generate summary from reviews
   */
  private generateSummary(reviews: FetchedReview[]): ReviewSummary {
    if (reviews.length === 0) {
      return this.emptySum();
    }

    const withRatings = reviews.filter(r => r.rating !== null);
    const avgRating = withRatings.length > 0
      ? withRatings.reduce((sum, r) => sum + (r.rating || 0), 0) / withRatings.length
      : null;

    const positive = reviews.filter(r => r.sentiment === 'positive').length;
    const negative = reviews.filter(r => r.sentiment === 'negative').length;
    const neutral = reviews.filter(r => r.sentiment === 'neutral').length;

    // Extract top complaints (negative reviews)
    const negativeReviews = reviews.filter(r => r.sentiment === 'negative');
    const topComplaints = this.extractTopThemes(negativeReviews.map(r => r.text), 5);

    // Extract top praises (positive reviews)
    const positiveReviews = reviews.filter(r => r.sentiment === 'positive');
    const topPraises = this.extractTopThemes(positiveReviews.map(r => r.text), 5);

    // Sentiment score: -1 (all negative) to +1 (all positive)
    const sentimentScore = reviews.length > 0
      ? (positive - negative) / reviews.length
      : 0;

    return {
      total_reviews: reviews.length,
      average_rating: avgRating ? Math.round(avgRating * 10) / 10 : null,
      positive_count: positive,
      negative_count: negative,
      neutral_count: neutral,
      top_complaints: topComplaints,
      top_praises: topPraises,
      sentiment_score: Math.round(sentimentScore * 100) / 100
    };
  }

  /**
   * Extract common themes from text
   */
  private extractTopThemes(texts: string[], maxThemes: number): string[] {
    // Common complaint/praise indicators
    const themePatterns = {
      'customer support': /support|service|help desk|customer care/gi,
      'pricing': /price|cost|expensive|cheap|value|money/gi,
      'ease of use': /easy|simple|intuitive|complex|difficult|confusing/gi,
      'reliability': /reliable|stable|crash|bug|error|down/gi,
      'performance': /slow|fast|performance|speed|lag/gi,
      'features': /feature|function|capability|missing|lack/gi,
      'integration': /integrat|connect|api|sync/gi,
      'documentation': /document|guide|tutorial|help/gi,
      'implementation': /implement|setup|install|onboard/gi,
      'quality': /quality|poor|great|excellent|bad/gi
    };

    const themeCounts: Record<string, number> = {};

    for (const text of texts) {
      for (const [theme, pattern] of Object.entries(themePatterns)) {
        if (pattern.test(text)) {
          themeCounts[theme] = (themeCounts[theme] || 0) + 1;
        }
      }
    }

    return Object.entries(themeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxThemes)
      .map(([theme]) => theme);
  }

  /**
   * Empty summary helper
   */
  private emptySum(): ReviewSummary {
    return {
      total_reviews: 0,
      average_rating: null,
      positive_count: 0,
      negative_count: 0,
      neutral_count: 0,
      top_complaints: [],
      top_praises: [],
      sentiment_score: 0
    };
  }

  /**
   * Chunk array for parallel processing
   */
  private chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Get all available review sources
   */
  getAvailableSources(): ReviewSource[] {
    return Object.values(REVIEW_SOURCES).filter(
      s => s.platform.startsWith('reviews-')
    );
  }

  /**
   * Check if a source is available for a segment
   */
  isSourceAvailable(source: ScanType, segment: SegmentType, businessType: BusinessType): boolean {
    const sources = getSourcesForSegment(segment, businessType);
    return sources.some(s => s.platform === source);
  }
}

// Export singleton
export const reviewSourceRouter = new ReviewSourceRouterService();
export default reviewSourceRouter;
