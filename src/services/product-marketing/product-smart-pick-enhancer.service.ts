/**
 * Product-Enhanced Smart Pick Service
 *
 * Enhances the existing SmartPicks system with product recommendations.
 * Adds "Promote your [Product] because [Insight]" style recommendations.
 *
 * Part of Phase 5: AI Picks Enhancement
 */

import type { DeepContext } from '@/types/synapse/deepContext.types';
import type { DataPoint } from '@/types/connections.types';
import type { SmartPick, DataSourceInfo } from '@/types/smart-picks.types';
import type { Product } from '@/features/product-marketing/types/product.types';
import { ProductRecommendationService, type ProductRecommendation } from './product-recommendation.service';
import { productInsightMatcher, type ProductInsightPairing } from './product-insight-matcher.service';
import { PRODUCT_CAMPAIGN_TEMPLATES, selectTemplateForProduct, generateProductContent } from '@/data/templates/product-campaign-templates';

// ============================================================================
// TYPES
// ============================================================================

export interface ProductEnhancedSmartPick extends SmartPick {
  /** Product being promoted */
  product?: Product;
  /** Why this product matches the insight */
  productMatchReason?: string;
  /** Suggested campaign template */
  suggestedTemplate?: string;
  /** Full action statement */
  actionStatement?: string;
  /** Whether this is a product-focused pick */
  isProductPick: boolean;
}

export interface ProductSmartPickConfig {
  /** Include product-insight pairings */
  includeProductPicks?: boolean;
  /** Maximum product picks to include */
  maxProductPicks?: number;
  /** Minimum match score for products */
  minProductScore?: number;
  /** Boost seasonal products */
  boostSeasonal?: boolean;
  /** Boost bestsellers */
  boostBestsellers?: boolean;
}

// ============================================================================
// MAIN SERVICE
// ============================================================================

export class ProductSmartPickEnhancer {
  private recommendationService: ProductRecommendationService;
  private config: Required<ProductSmartPickConfig>;

  constructor(config: ProductSmartPickConfig = {}) {
    this.config = {
      includeProductPicks: config.includeProductPicks ?? true,
      maxProductPicks: config.maxProductPicks ?? 3,
      minProductScore: config.minProductScore ?? 50,
      boostSeasonal: config.boostSeasonal ?? true,
      boostBestsellers: config.boostBestsellers ?? true,
    };

    this.recommendationService = new ProductRecommendationService({
      maxRecommendations: this.config.maxProductPicks,
      minScore: this.config.minProductScore,
      includeSeasonalProducts: this.config.boostSeasonal,
      includeBestsellers: this.config.boostBestsellers,
    });
  }

  /**
   * Enhance existing smart picks with product recommendations
   */
  async enhanceSmartPicks(
    brandId: string,
    existingPicks: SmartPick[],
    context: DeepContext
  ): Promise<ProductEnhancedSmartPick[]> {
    if (!this.config.includeProductPicks) {
      return existingPicks.map(pick => ({ ...pick, isProductPick: false }));
    }

    console.log('[ProductSmartPickEnhancer] Enhancing smart picks with product recommendations...');

    // Extract data points from context
    const dataPoints = this.extractDataPointsFromContext(context);

    // Generate product recommendations
    const productRecs = await this.recommendationService.generateRecommendations(brandId, dataPoints);

    console.log(`[ProductSmartPickEnhancer] Generated ${productRecs.length} product recommendations`);

    // Convert product recommendations to smart picks
    const productPicks = productRecs.map(rec => this.productRecToSmartPick(rec, context));

    // Combine: product picks first (they're more actionable), then existing picks
    const enhancedExisting = existingPicks.map(pick => ({
      ...pick,
      isProductPick: false,
    }));

    // Interleave: put 1-2 product picks at top, rest after existing picks
    const topProductPicks = productPicks.slice(0, 2);
    const remainingProductPicks = productPicks.slice(2);

    const combined = [
      ...topProductPicks,
      ...enhancedExisting,
      ...remainingProductPicks,
    ];

    // Deduplicate by ID
    const seen = new Set<string>();
    const deduped = combined.filter(pick => {
      if (seen.has(pick.id)) return false;
      seen.add(pick.id);
      return true;
    });

    return deduped;
  }

  /**
   * Generate product-only smart picks (for product-focused campaign mode)
   */
  async generateProductSmartPicks(
    brandId: string,
    context: DeepContext
  ): Promise<ProductEnhancedSmartPick[]> {
    console.log('[ProductSmartPickEnhancer] Generating product-focused smart picks...');

    // Extract data points from context
    const dataPoints = this.extractDataPointsFromContext(context);

    // Generate product recommendations
    const productRecs = await this.recommendationService.generateRecommendations(brandId, dataPoints);

    // Convert all to smart picks
    return productRecs.map(rec => this.productRecToSmartPick(rec, context));
  }

  /**
   * Convert a ProductRecommendation to a ProductEnhancedSmartPick
   */
  private productRecToSmartPick(
    rec: ProductRecommendation,
    context: DeepContext
  ): ProductEnhancedSmartPick {
    // Get suggested template
    const template = selectTemplateForProduct(rec.campaignType, rec.product);

    // Generate preview content
    const previewContent = generateProductContent(template, {
      product: rec.product,
      insight: rec.reason,
      targetCustomer: context.business?.uvp?.targetCustomer || 'customers',
    }, 'instagram');

    // Map urgency to timeliness
    const timeliness = rec.urgency === 'high' ? 0.9 : rec.urgency === 'medium' ? 0.7 : 0.5;

    // Calculate overall score
    const overallScore = rec.score / 100;

    return {
      id: rec.id,
      campaignType: this.mapCampaignType(rec.campaignType),
      title: rec.headline,
      description: rec.actionStatement,
      insights: rec.relatedInsight ? [{
        id: `insight-${rec.id}`,
        type: 'unexpected_connection' as const,
        thinkingStyle: 'analytical' as const,
        insight: rec.reason,
        whyProfound: rec.reason,
        whyNow: rec.timing || 'Good opportunity now',
        contentAngle: previewContent.headline,
        expectedReaction: 'Customers will see their specific product as the solution',
        evidence: [],
        confidence: rec.score / 100,
        metadata: {
          generatedAt: new Date(),
          model: 'product-matcher',
        },
      }] : [],
      preview: {
        headline: previewContent.headline,
        hook: previewContent.hook,
        platform: template.platforms[0] || 'Instagram',
      },
      confidence: rec.score / 100,
      relevance: rec.score / 100,
      timeliness,
      evidenceQuality: 0.7,
      overallScore,
      dataSources: [{
        source: 'industry' as const, // Using 'industry' as closest match for product catalog
        icon: 'Package',
        label: 'Product Catalog',
        verified: true,
        freshness: 'daily' as const,
        dataPoints: 1,
      }],
      reasoning: rec.reason,
      expectedPerformance: {
        engagement: rec.urgency === 'high' ? 'high' : 'medium',
        reach: 'medium',
        conversions: rec.campaignType === 'seasonal_push' ? 'high' : 'medium',
      },
      metadata: {
        generatedAt: new Date(),
        expiresAt: rec.urgency === 'high' ? this.getExpirationDate(7) : undefined,
      },
      // Product-specific fields
      product: rec.product,
      productMatchReason: rec.reason,
      suggestedTemplate: template.name,
      actionStatement: rec.actionStatement,
      isProductPick: true,
    };
  }

  /**
   * Map product campaign type to SmartPick campaign type
   */
  private mapCampaignType(productCampaignType: string): 'authority-builder' | 'social-proof' | 'local-pulse' {
    switch (productCampaignType) {
      case 'product_launch':
      case 'feature_spotlight':
      case 'comparison':
        return 'authority-builder';
      case 'seasonal_push':
      case 'trending_topic':
        return 'local-pulse';
      case 'problem_solver':
      case 'social_proof':
      case 'bundle_promotion':
      default:
        return 'social-proof';
    }
  }

  /**
   * Extract DataPoints from DeepContext for matching
   */
  private extractDataPointsFromContext(context: DeepContext): DataPoint[] {
    const dataPoints: DataPoint[] = [];

    // Extract from real-time cultural context
    if (context.realTimeCultural?.currentContext) {
      for (const item of context.realTimeCultural.currentContext) {
        dataPoints.push({
          id: `cultural-${Date.now()}-${Math.random()}`,
          type: 'trending_topic',
          content: typeof item === 'string' ? item : (item as any).description || '',
          source: 'reddit', // Using reddit as proxy for cultural data
          createdAt: new Date(),
          metadata: {},
        });
      }
    }

    // Extract from industry context (via industry.trends)
    if (context.industry?.trends) {
      for (const trend of context.industry.trends) {
        dataPoints.push({
          id: `industry-${Date.now()}-${Math.random()}`,
          type: 'trending_topic',
          content: typeof trend === 'string' ? trend : trend.trend || '',
          source: 'perplexity', // Using perplexity as proxy for industry data
          createdAt: new Date(),
          metadata: {},
        });
      }
    }

    return dataPoints;
  }

  /**
   * Get expiration date from now
   */
  private getExpirationDate(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const productSmartPickEnhancer = new ProductSmartPickEnhancer();

/**
 * Quick function to enhance smart picks with products
 */
export async function enhanceSmartPicksWithProducts(
  brandId: string,
  existingPicks: SmartPick[],
  context: DeepContext,
  config?: ProductSmartPickConfig
): Promise<ProductEnhancedSmartPick[]> {
  const enhancer = new ProductSmartPickEnhancer(config);
  return enhancer.enhanceSmartPicks(brandId, existingPicks, context);
}

/**
 * Quick function to generate product-focused picks
 */
export async function generateProductFocusedPicks(
  brandId: string,
  context: DeepContext,
  config?: ProductSmartPickConfig
): Promise<ProductEnhancedSmartPick[]> {
  const enhancer = new ProductSmartPickEnhancer(config);
  return enhancer.generateProductSmartPicks(brandId, context);
}
