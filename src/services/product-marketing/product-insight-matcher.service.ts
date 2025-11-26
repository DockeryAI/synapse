/**
 * Product-Insight Matcher Service
 *
 * The brain that connects market insights to specific products.
 * Enables "Promote your Product X because Insight Y shows demand"
 *
 * Part of Phase 2: Intelligence-Product Matching Engine
 */

import { supabase } from '@/lib/supabase';
import type { Product } from '@/features/product-marketing/types/product.types';
import type { DataPoint } from '@/types/connections.types';

// ============================================================================
// TYPES
// ============================================================================

export interface InsightCluster {
  id: string;
  name: string;
  keywords: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  urgency: number; // 0-100
  dataPoints: DataPoint[];
}

export interface ProductMatch {
  product: Product;
  score: number; // 0-100 match score
  matchReasons: string[];
  suggestedAction: string;
  urgency: 'high' | 'medium' | 'low';
}

export interface ProductInsightPairing {
  insight: InsightCluster | DataPoint;
  insightSummary: string;
  matchedProducts: ProductMatch[];
  recommendedCampaignType: CampaignType;
  actionStatement: string; // "Promote your X because Y"
}

export type CampaignType =
  | 'product_launch'
  | 'feature_spotlight'
  | 'seasonal_push'
  | 'problem_solver'
  | 'comparison'
  | 'bundle_promotion'
  | 'trending_topic'
  | 'competitor_gap';

export interface MatchingConfig {
  /** Minimum score to include a product match (default: 30) */
  minMatchScore?: number;
  /** Maximum products to match per insight (default: 3) */
  maxMatchesPerInsight?: number;
  /** Consider seasonal relevance (default: true) */
  considerSeasonality?: boolean;
  /** Boost featured/bestseller products (default: true) */
  boostFeaturedProducts?: boolean;
}

// ============================================================================
// KEYWORD MAPPINGS
// ============================================================================

/** Keywords that indicate specific product categories */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  food: ['menu', 'dish', 'meal', 'food', 'cuisine', 'restaurant', 'eat', 'taste', 'flavor', 'recipe'],
  bakery: ['bake', 'bread', 'pastry', 'cake', 'cookie', 'dessert', 'sweet', 'pie', 'croissant'],
  beverage: ['drink', 'coffee', 'tea', 'juice', 'smoothie', 'beverage', 'espresso', 'latte'],
  service: ['service', 'consult', 'support', 'maintenance', 'repair', 'install', 'training'],
  software: ['software', 'app', 'platform', 'tool', 'system', 'solution', 'integration'],
  retail: ['product', 'item', 'buy', 'shop', 'purchase', 'order', 'stock'],
};

/** Keywords that indicate timing/urgency */
const TIMING_KEYWORDS: Record<string, string[]> = {
  urgent: ['now', 'today', 'immediate', 'urgent', 'asap', 'quick', 'fast', 'limited'],
  seasonal: ['holiday', 'christmas', 'thanksgiving', 'summer', 'winter', 'spring', 'fall', 'season'],
  trending: ['trend', 'popular', 'hot', 'viral', 'buzz', 'growing', 'surge'],
};

/** Keywords that indicate customer problems/needs */
const PROBLEM_KEYWORDS: string[] = [
  'need', 'want', 'looking for', 'problem', 'issue', 'challenge', 'struggle',
  'pain', 'frustration', 'difficult', 'expensive', 'slow', 'complicated',
];

// ============================================================================
// MAIN MATCHING CLASS
// ============================================================================

export class ProductInsightMatcher {
  private products: Product[] = [];
  private config: Required<MatchingConfig>;

  constructor(config: MatchingConfig = {}) {
    this.config = {
      minMatchScore: config.minMatchScore ?? 30,
      maxMatchesPerInsight: config.maxMatchesPerInsight ?? 3,
      considerSeasonality: config.considerSeasonality ?? true,
      boostFeaturedProducts: config.boostFeaturedProducts ?? true,
    };
  }

  /**
   * Load products for a brand
   */
  async loadProducts(brandId: string): Promise<void> {
    const { data, error } = await supabase
      .from('pm_products')
      .select('*')
      .eq('brand_id', brandId)
      .eq('status', 'active')
      .order('is_featured', { ascending: false })
      .order('is_bestseller', { ascending: false });

    if (error) {
      console.error('[ProductMatcher] Failed to load products:', error);
      this.products = [];
      return;
    }

    this.products = (data || []).map(this.mapRowToProduct);
    console.log(`[ProductMatcher] Loaded ${this.products.length} products`);
  }

  /**
   * Match a single insight/data point to products
   */
  matchInsightToProducts(insight: DataPoint | InsightCluster): ProductInsightPairing {
    const insightText = this.extractInsightText(insight);
    const insightKeywords = this.extractKeywords(insightText);
    const insightSentiment = this.detectSentiment(insightText);
    const insightUrgency = this.detectUrgency(insightText);

    // Score each product against this insight
    const scoredProducts: ProductMatch[] = this.products
      .map(product => this.scoreProductMatch(product, insightKeywords, insightText, insightUrgency))
      .filter(match => match.score >= this.config.minMatchScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, this.config.maxMatchesPerInsight);

    // Determine campaign type based on insight characteristics
    const campaignType = this.determineCampaignType(insightText, insightUrgency, insightSentiment);

    // Generate action statement
    const actionStatement = this.generateActionStatement(
      scoredProducts[0]?.product,
      insightText,
      campaignType
    );

    return {
      insight,
      insightSummary: this.summarizeInsight(insightText),
      matchedProducts: scoredProducts,
      recommendedCampaignType: campaignType,
      actionStatement,
    };
  }

  /**
   * Match multiple insights to products
   */
  matchInsightsToProducts(insights: (DataPoint | InsightCluster)[]): ProductInsightPairing[] {
    return insights.map(insight => this.matchInsightToProducts(insight));
  }

  /**
   * Get product recommendations based on all available data
   */
  async getProductRecommendations(
    brandId: string,
    dataPoints: DataPoint[]
  ): Promise<ProductInsightPairing[]> {
    // Load products if not already loaded
    if (this.products.length === 0) {
      await this.loadProducts(brandId);
    }

    // Filter to relevant insights (not product data points themselves)
    const insights = dataPoints.filter(dp =>
      !dp.metadata?.productId &&
      (dp.type === 'trending_topic' || dp.type === 'customer_trigger' ||
       dp.type === 'competitive_gap' || dp.type === 'pain_point')
    );

    // Match insights to products
    const pairings = this.matchInsightsToProducts(insights);

    // Filter to only pairings with actual matches
    return pairings.filter(p => p.matchedProducts.length > 0);
  }

  // ============================================================================
  // SCORING METHODS
  // ============================================================================

  /**
   * Score how well a product matches an insight
   */
  private scoreProductMatch(
    product: Product,
    insightKeywords: string[],
    insightText: string,
    insightUrgency: number
  ): ProductMatch {
    let score = 0;
    const matchReasons: string[] = [];

    // 1. Keyword matching (up to 40 points)
    const productText = `${product.name} ${product.description || ''} ${product.features?.join(' ') || ''} ${product.benefits?.join(' ') || ''} ${product.tags?.join(' ') || ''}`.toLowerCase();

    const keywordMatches = insightKeywords.filter(kw => productText.includes(kw));
    if (keywordMatches.length > 0) {
      const keywordScore = Math.min(keywordMatches.length * 10, 40);
      score += keywordScore;
      matchReasons.push(`Matches keywords: ${keywordMatches.slice(0, 3).join(', ')}`);
    }

    // 2. Category relevance (up to 20 points)
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      const categoryMatch = keywords.some(kw =>
        insightText.toLowerCase().includes(kw) && productText.includes(kw)
      );
      if (categoryMatch) {
        score += 20;
        matchReasons.push(`Category match: ${category}`);
        break;
      }
    }

    // 3. Seasonal relevance (up to 15 points)
    if (this.config.considerSeasonality && product.isSeasonal) {
      const seasonalKeywords = TIMING_KEYWORDS.seasonal;
      if (seasonalKeywords.some(kw => insightText.toLowerCase().includes(kw))) {
        score += 15;
        matchReasons.push('Seasonal relevance');
      }
    }

    // 4. Featured/bestseller boost (up to 15 points)
    if (this.config.boostFeaturedProducts) {
      if (product.isFeatured) {
        score += 10;
        matchReasons.push('Featured product');
      }
      if (product.isBestseller) {
        score += 5;
        matchReasons.push('Bestseller');
      }
    }

    // 5. Problem-solution alignment (up to 10 points)
    if (product.benefits && product.benefits.length > 0) {
      const hasProblemKeyword = PROBLEM_KEYWORDS.some(kw =>
        insightText.toLowerCase().includes(kw)
      );
      if (hasProblemKeyword) {
        score += 10;
        matchReasons.push('Addresses customer need');
      }
    }

    // Determine urgency based on score and insight urgency
    const urgency: 'high' | 'medium' | 'low' =
      score >= 70 && insightUrgency >= 70 ? 'high' :
      score >= 50 || insightUrgency >= 50 ? 'medium' : 'low';

    // Generate suggested action
    const suggestedAction = this.generateSuggestedAction(product, matchReasons, urgency);

    return {
      product,
      score: Math.min(score, 100),
      matchReasons,
      suggestedAction,
      urgency,
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private extractInsightText(insight: DataPoint | InsightCluster): string {
    if ('content' in insight) {
      return insight.content;
    }
    if ('dataPoints' in insight) {
      return insight.dataPoints.map(dp => dp.content).join(' ');
    }
    return '';
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - split on whitespace, filter short words
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3);

    // Deduplicate and return top keywords
    return [...new Set(words)].slice(0, 20);
  }

  private detectSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['great', 'love', 'best', 'amazing', 'excellent', 'perfect', 'good'];
    const negativeWords = ['bad', 'worst', 'terrible', 'hate', 'poor', 'awful', 'problem'];

    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(w => lowerText.includes(w)).length;
    const negativeCount = negativeWords.filter(w => lowerText.includes(w)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private detectUrgency(text: string): number {
    const urgentWords = TIMING_KEYWORDS.urgent;
    const lowerText = text.toLowerCase();
    const urgentCount = urgentWords.filter(w => lowerText.includes(w)).length;
    return Math.min(urgentCount * 25, 100);
  }

  private determineCampaignType(
    insightText: string,
    urgency: number,
    sentiment: 'positive' | 'negative' | 'neutral'
  ): CampaignType {
    const lowerText = insightText.toLowerCase();

    // Check for specific indicators
    if (TIMING_KEYWORDS.seasonal.some(kw => lowerText.includes(kw))) {
      return 'seasonal_push';
    }
    if (TIMING_KEYWORDS.trending.some(kw => lowerText.includes(kw))) {
      return 'trending_topic';
    }
    if (PROBLEM_KEYWORDS.some(kw => lowerText.includes(kw))) {
      return 'problem_solver';
    }
    if (lowerText.includes('competitor') || lowerText.includes('vs') || lowerText.includes('compare')) {
      return 'comparison';
    }
    if (lowerText.includes('new') || lowerText.includes('launch') || lowerText.includes('introducing')) {
      return 'product_launch';
    }
    if (lowerText.includes('feature') || lowerText.includes('benefit')) {
      return 'feature_spotlight';
    }
    if (lowerText.includes('bundle') || lowerText.includes('package') || lowerText.includes('combo')) {
      return 'bundle_promotion';
    }

    // Default based on urgency
    if (urgency >= 70) return 'trending_topic';
    return 'feature_spotlight';
  }

  private generateSuggestedAction(
    product: Product,
    matchReasons: string[],
    urgency: 'high' | 'medium' | 'low'
  ): string {
    const urgencyPrefix = urgency === 'high' ? 'Urgently promote' :
                         urgency === 'medium' ? 'Promote' : 'Consider promoting';

    if (matchReasons.includes('Seasonal relevance')) {
      return `${urgencyPrefix} ${product.name} for seasonal demand`;
    }
    if (matchReasons.includes('Addresses customer need')) {
      return `${urgencyPrefix} ${product.name} as the solution`;
    }
    if (matchReasons.includes('Bestseller')) {
      return `${urgencyPrefix} your bestselling ${product.name}`;
    }
    return `${urgencyPrefix} ${product.name}`;
  }

  private generateActionStatement(
    product: Product | undefined,
    insightText: string,
    campaignType: CampaignType
  ): string {
    if (!product) {
      return 'No matching products found for this insight';
    }

    const insightSummary = this.summarizeInsight(insightText);

    switch (campaignType) {
      case 'seasonal_push':
        return `Promote your ${product.name} - seasonal demand is trending (${insightSummary})`;
      case 'problem_solver':
        return `Promote your ${product.name} - it solves the customer need: ${insightSummary}`;
      case 'trending_topic':
        return `Promote your ${product.name} - topic is trending now: ${insightSummary}`;
      case 'competitor_gap':
        return `Promote your ${product.name} - fills a gap competitors miss`;
      case 'comparison':
        return `Position your ${product.name} against competitors based on: ${insightSummary}`;
      case 'bundle_promotion':
        return `Bundle your ${product.name} with related items`;
      default:
        return `Promote your ${product.name} because: ${insightSummary}`;
    }
  }

  private summarizeInsight(text: string): string {
    // Truncate to first sentence or 100 chars
    const firstSentence = text.split(/[.!?]/)[0];
    if (firstSentence.length <= 100) return firstSentence;
    return firstSentence.substring(0, 97) + '...';
  }

  private mapRowToProduct(row: any): Product {
    return {
      id: row.id,
      brandId: row.brand_id,
      categoryId: row.category_id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      shortDescription: row.short_description,
      price: row.price,
      priceDisplay: row.price_display,
      currency: row.currency || 'USD',
      features: row.features || [],
      benefits: row.benefits || [],
      images: row.images || [],
      status: row.status,
      isService: row.is_service || false,
      isFeatured: row.is_featured || false,
      isBestseller: row.is_bestseller || false,
      isSeasonal: row.is_seasonal || false,
      seasonalStart: row.seasonal_start,
      seasonalEnd: row.seasonal_end,
      tags: row.tags || [],
      externalId: row.external_id,
      metadata: row.metadata || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a new product insight matcher
 */
export function createProductInsightMatcher(config?: MatchingConfig): ProductInsightMatcher {
  return new ProductInsightMatcher(config);
}

/**
 * Quick match insights to products for a brand
 */
export async function matchInsightsToProducts(
  brandId: string,
  dataPoints: DataPoint[],
  config?: MatchingConfig
): Promise<ProductInsightPairing[]> {
  const matcher = createProductInsightMatcher(config);
  return matcher.getProductRecommendations(brandId, dataPoints);
}

// Export singleton for convenience
export const productInsightMatcher = new ProductInsightMatcher();
