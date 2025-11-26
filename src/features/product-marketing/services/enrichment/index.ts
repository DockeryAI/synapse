/**
 * Enrichment Services Index
 *
 * Exports all product enrichment services.
 */

// Categorization
export {
  categorizeProduct,
  categorizeProducts,
  suggestNewCategories,
  type CategorizationResult,
  type CategorizationConfig,
} from './categorization.service';

// Feature Extraction
export {
  extractProductFeatures,
  extractFeaturesForProducts,
  generateFeatureSummary,
  compareProductFeatures,
  type ExtractedFeature,
  type FeatureExtractionResult,
  type FeatureExtractionConfig,
} from './feature-extraction.service';

// Seasonal Tagging
export {
  analyzeSeasonality,
  analyzeProductsSeasonality,
  getCurrentSeason,
  getUpcomingHolidays,
  isProductInSeason,
  type Season,
  type Holiday,
  type SeasonalTag,
  type SeasonalAnalysisResult,
  type SeasonalConfig,
} from './seasonal-tagging.service';
