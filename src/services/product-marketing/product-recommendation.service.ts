/**
 * Product Recommendation Service
 *
 * Generates smart product recommendations for AI Picks.
 * Transforms insights into actionable product promotion suggestions.
 *
 * Part of Phase 5: AI Picks Enhancement
 */

import { supabase } from '@/lib/supabase';
import { productInsightMatcher, type ProductInsightPairing, type CampaignType } from './product-insight-matcher.service';
import type { Product } from '@/features/product-marketing/types/product.types';
import type { DataPoint } from '@/types/connections.types';

// ============================================================================
// TYPES
// ============================================================================

export interface ProductRecommendation {
  id: string;
  product: Product;
  headline: string; // "Promote your Apple Turnovers"
  reason: string; // "Fall baking trend surging (Cluster #3)"
  actionStatement: string; // Full actionable statement
  urgency: 'high' | 'medium' | 'low';
  score: number;
  campaignType: CampaignType;
  relatedInsight?: DataPoint;
  suggestedTemplates: string[];
  timing?: string; // "Post this week" | "Schedule for holiday"
}

export interface RecommendationConfig {
  /** Maximum recommendations to return */
  maxRecommendations?: number;
  /** Minimum match score to include */
  minScore?: number;
  /** Include seasonal products even without matching insights */
  includeSeasonalProducts?: boolean;
  /** Include bestsellers even without matching insights */
  includeBestsellers?: boolean;
}

// ============================================================================
// SEASONAL DETECTION
// ============================================================================

const SEASONAL_PERIODS: Record<string, { start: number; end: number; keywords: string[] }> = {
  winter_holidays: { start: 11, end: 12, keywords: ['christmas', 'holiday', 'gift', 'festive'] },
  valentines: { start: 2, end: 2, keywords: ['valentine', 'love', 'romantic', 'heart'] },
  easter: { start: 3, end: 4, keywords: ['easter', 'spring', 'bunny'] },
  summer: { start: 6, end: 8, keywords: ['summer', 'beach', 'vacation', 'outdoor'] },
  fall: { start: 9, end: 11, keywords: ['fall', 'autumn', 'pumpkin', 'harvest', 'thanksgiving'] },
  back_to_school: { start: 8, end: 9, keywords: ['school', 'student', 'education', 'learning'] },
};

function getCurrentSeason(): string | null {
  const month = new Date().getMonth() + 1; // 1-12
  for (const [season, config] of Object.entries(SEASONAL_PERIODS)) {
    if (month >= config.start && month <= config.end) {
      return season;
    }
  }
  return null;
}

function getSeasonalKeywords(): string[] {
  const season = getCurrentSeason();
  if (!season) return [];
  return SEASONAL_PERIODS[season]?.keywords || [];
}

// ============================================================================
// RECOMMENDATION SERVICE
// ============================================================================

export class ProductRecommendationService {
  private config: Required<RecommendationConfig>;

  constructor(config: RecommendationConfig = {}) {
    this.config = {
      maxRecommendations: config.maxRecommendations ?? 10,
      minScore: config.minScore ?? 40,
      includeSeasonalProducts: config.includeSeasonalProducts ?? true,
      includeBestsellers: config.includeBestsellers ?? true,
    };
  }

  /**
   * Generate product recommendations for a brand based on insights
   */
  async generateRecommendations(
    brandId: string,
    dataPoints: DataPoint[]
  ): Promise<ProductRecommendation[]> {
    const recommendations: ProductRecommendation[] = [];

    // 1. Get insight-based recommendations
    await productInsightMatcher.loadProducts(brandId);
    const pairings = await productInsightMatcher.getProductRecommendations(brandId, dataPoints);

    // Convert pairings to recommendations
    for (const pairing of pairings) {
      for (const match of pairing.matchedProducts) {
        if (match.score >= this.config.minScore) {
          recommendations.push(this.pairingToRecommendation(pairing, match));
        }
      }
    }

    // 2. Add seasonal product recommendations
    if (this.config.includeSeasonalProducts) {
      const seasonalRecs = await this.getSeasonalRecommendations(brandId);
      recommendations.push(...seasonalRecs);
    }

    // 3. Add bestseller recommendations (if not already included)
    if (this.config.includeBestsellers) {
      const bestsellerRecs = await this.getBestsellerRecommendations(brandId);
      for (const rec of bestsellerRecs) {
        if (!recommendations.some(r => r.product.id === rec.product.id)) {
          recommendations.push(rec);
        }
      }
    }

    // Sort by score and urgency, then limit
    return recommendations
      .sort((a, b) => {
        // High urgency first
        const urgencyOrder = { high: 3, medium: 2, low: 1 };
        const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
        if (urgencyDiff !== 0) return urgencyDiff;
        // Then by score
        return b.score - a.score;
      })
      .slice(0, this.config.maxRecommendations);
  }

  /**
   * Get seasonal product recommendations
   */
  private async getSeasonalRecommendations(brandId: string): Promise<ProductRecommendation[]> {
    const season = getCurrentSeason();
    if (!season) return [];

    const { data: products } = await supabase
      .from('pm_products')
      .select('*')
      .eq('brand_id', brandId)
      .eq('status', 'active')
      .eq('is_seasonal', true)
      .limit(5);

    if (!products || products.length === 0) return [];

    const seasonName = season.replace('_', ' ');
    return products.map(row => ({
      id: `seasonal-${row.id}`,
      product: this.mapRowToProduct(row),
      headline: `Promote your ${row.name}`,
      reason: `${seasonName} season is here - perfect timing for seasonal products`,
      actionStatement: `Promote your ${row.name} - ${seasonName} demand is starting`,
      urgency: 'high' as const,
      score: 80,
      campaignType: 'seasonal_push' as CampaignType,
      suggestedTemplates: ['Seasonal Push', 'Limited Time Offer'],
      timing: `Post this ${seasonName} season`,
    }));
  }

  /**
   * Get bestseller recommendations
   */
  private async getBestsellerRecommendations(brandId: string): Promise<ProductRecommendation[]> {
    const { data: products } = await supabase
      .from('pm_products')
      .select('*')
      .eq('brand_id', brandId)
      .eq('status', 'active')
      .eq('is_bestseller', true)
      .limit(3);

    if (!products || products.length === 0) return [];

    return products.map(row => ({
      id: `bestseller-${row.id}`,
      product: this.mapRowToProduct(row),
      headline: `Feature your bestselling ${row.name}`,
      reason: 'Bestsellers drive engagement and social proof',
      actionStatement: `Feature your bestselling ${row.name} - proven customer favorite`,
      urgency: 'medium' as const,
      score: 70,
      campaignType: 'feature_spotlight' as CampaignType,
      suggestedTemplates: ['Feature Spotlight', 'Customer Favorite'],
      timing: 'Anytime - evergreen content',
    }));
  }

  /**
   * Convert a pairing to a recommendation
   */
  private pairingToRecommendation(
    pairing: ProductInsightPairing,
    match: { product: Product; score: number; matchReasons: string[]; suggestedAction: string; urgency: 'high' | 'medium' | 'low' }
  ): ProductRecommendation {
    return {
      id: `insight-${match.product.id}-${Date.now()}`,
      product: match.product,
      headline: `Promote your ${match.product.name}`,
      reason: pairing.insightSummary,
      actionStatement: pairing.actionStatement,
      urgency: match.urgency,
      score: match.score,
      campaignType: pairing.recommendedCampaignType,
      relatedInsight: 'content' in pairing.insight ? pairing.insight as DataPoint : undefined,
      suggestedTemplates: this.getTemplatesForCampaignType(pairing.recommendedCampaignType),
      timing: this.getTimingSuggestion(match.urgency),
    };
  }

  /**
   * Get suggested templates for a campaign type
   */
  private getTemplatesForCampaignType(campaignType: CampaignType): string[] {
    const templateMap: Record<CampaignType, string[]> = {
      product_launch: ['Product Launch', 'New Arrival', 'Introducing'],
      feature_spotlight: ['Feature Spotlight', 'Product Benefits', 'Why Choose'],
      seasonal_push: ['Seasonal Push', 'Limited Time', 'Holiday Special'],
      problem_solver: ['Problem Solution', 'Customer Success', 'How We Help'],
      comparison: ['Comparison', 'Why We\'re Different', 'Vs Competition'],
      bundle_promotion: ['Bundle Deal', 'Package Offer', 'Complete Solution'],
      trending_topic: ['Trending Now', 'Hot Topic', 'What\'s Popular'],
      competitor_gap: ['Unique Advantage', 'Only We Offer', 'Exclusive'],
    };
    return templateMap[campaignType] || ['Feature Spotlight'];
  }

  /**
   * Get timing suggestion based on urgency
   */
  private getTimingSuggestion(urgency: 'high' | 'medium' | 'low'): string {
    switch (urgency) {
      case 'high': return 'Post within 24-48 hours';
      case 'medium': return 'Schedule for this week';
      case 'low': return 'Add to content calendar';
    }
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
// EXPORTS
// ============================================================================

export const productRecommendationService = new ProductRecommendationService();

/**
 * Quick function to get product recommendations
 */
export async function getProductRecommendations(
  brandId: string,
  dataPoints: DataPoint[],
  config?: RecommendationConfig
): Promise<ProductRecommendation[]> {
  const service = new ProductRecommendationService(config);
  return service.generateRecommendations(brandId, dataPoints);
}
