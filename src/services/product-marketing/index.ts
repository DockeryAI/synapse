/**
 * Product Marketing Services
 *
 * Centralized exports for all product marketing functionality.
 * Enables product-centric marketing campaigns powered by intelligence.
 */

// UVP Product Sync
export {
  syncUVPProductsToCatalog,
  type SyncOptions,
  type SyncResult,
} from './uvp-product-sync.service';

// Product-Insight Matching
export {
  ProductInsightMatcher,
  productInsightMatcher,
  createProductInsightMatcher,
  matchInsightsToProducts,
  type InsightCluster,
  type ProductMatch,
  type ProductInsightPairing,
  type CampaignType,
  type MatchingConfig,
} from './product-insight-matcher.service';

// Product Recommendations
export {
  ProductRecommendationService,
  productRecommendationService,
  getProductRecommendations,
  type ProductRecommendation,
  type RecommendationConfig,
} from './product-recommendation.service';

// Smart Pick Enhancement
export {
  ProductSmartPickEnhancer,
  productSmartPickEnhancer,
  enhanceSmartPicksWithProducts,
  generateProductFocusedPicks,
  type ProductEnhancedSmartPick,
  type ProductSmartPickConfig,
} from './product-smart-pick-enhancer.service';
