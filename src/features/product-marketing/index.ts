/**
 * Product Marketing Feature - Main Export
 *
 * This is the main entry point for the product marketing feature.
 * All public APIs should be exported from here.
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

export {
  getProductMarketingFlags,
  isFeatureEnabled,
  isProductMarketingEnabled,
  isExtractionEnabled,
  isUIEnabled,
  isEnrichmentEnabled,
  requireFeature,
  withFeatureFlag,
  productMarketingFlags,
  FEATURE_FLAGS,
  type ProductMarketingFlags,
  type FeatureFlag,
} from './config/feature-flags';

// ============================================================================
// TYPES
// ============================================================================

export type {
  // Product types
  ProductStatus,
  SourceType,
  ExtractionStatus,
  ExtractionType,
  MetadataValueType,
  ProductImage,
  ProductCategory,
  Product,
  ProductSource,
  ProductMetadata,
  ExtractionLog,
  CreateProductDTO,
  UpdateProductDTO,
  CreateCategoryDTO,
  UpdateCategoryDTO,
  ProductFilters,
  ProductSortOptions,
  PaginationOptions,
  PaginatedResult,
  CategoryTreeNode,
  FlatCategoryNode,
  // Extraction types
  ExtractionSourcesConfig,
  ExtractionConfig,
  UVPExtractionOptions,
  WebsiteExtractionOptions,
  ReviewExtractionOptions,
  KeywordExtractionOptions,
  ExtractedProduct,
  UVPExtractionData,
  WebsiteExtractionData,
  ReviewExtractionData,
  KeywordExtractionData,
  SingleExtractionResult,
  ExtractionStats,
  ExtractionResult,
  ExtractionProgress,
  ExtractionProgressCallback,
  DeduplicationMatch,
  MergedProduct,
  ProductValidation,
} from './types';

export {
  mapRowToProduct,
  mapRowToCategory,
  mapRowToSource,
  mapRowToExtractionLog,
  validateExtractedProduct,
} from './types';

// ============================================================================
// CATALOG SERVICES
// ============================================================================

export {
  // Supabase client
  getPMSupabaseClient,
  PM_TABLES,
  toPMError,
  // Product CRUD
  createProduct,
  bulkCreateProducts,
  getProduct,
  getProductBySlug,
  listProducts,
  countProducts,
  updateProduct,
  bulkUpdateStatus,
  deleteProduct,
  bulkDeleteProducts,
  // Categories
  createCategory,
  getCategory,
  getCategoryBySlug,
  listCategories,
  getCategoryTree,
  getFlatCategoryList,
  updateCategory,
  reorderCategories,
  deleteCategory,
  ensureDefaultCategories,
  // Search
  searchProducts,
  filterByCategory,
  filterByStatus,
  filterByPriceRange,
  getSeasonalProducts,
  getInSeasonProducts,
  getBestsellers,
  getFeaturedProducts,
  searchByTags,
  getProductFacets,
  getSearchSuggestions,
  getRelatedProducts,
  type ProductSearchOptions,
  type ProductSearchParams,
  type ProductSearchResult,
  type ProductFacets,
} from './services/catalog';

// ============================================================================
// EXTRACTION SERVICES
// ============================================================================

export {
  // Base
  BaseExtractor,
  type ExtractorContext,
  type ExtractorConfig,
  type ExtractorFactory,
  // Extractors
  createUVPExtractor,
  createWebsiteExtractor,
  createReviewExtractor,
  createKeywordExtractor,
  // Orchestrator
  ExtractionOrchestrator,
  createExtractionOrchestrator,
  quickExtract,
  fullExtract,
} from './services/extraction';

// ============================================================================
// ENRICHMENT SERVICES
// ============================================================================

export {
  // Categorization
  categorizeProduct,
  categorizeProducts,
  suggestNewCategories,
  type CategorizationResult,
  type CategorizationConfig,
  // Feature extraction
  extractProductFeatures,
  extractFeaturesForProducts,
  generateFeatureSummary,
  compareProductFeatures,
  type ExtractedFeature,
  type FeatureExtractionResult,
  type FeatureExtractionConfig,
  // Seasonal tagging
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
} from './services/enrichment';

// ============================================================================
// REACT HOOKS
// ============================================================================

export {
  useProductCatalog,
  useProductExtraction,
  type UseProductCatalogOptions,
  type UseProductCatalogReturn,
  type UseProductExtractionOptions,
  type UseProductExtractionReturn,
} from './hooks';

// ============================================================================
// UI COMPONENTS
// ============================================================================

export {
  ProductCard,
  ProductGrid,
  ProductEditor,
  ExtractionPanel,
  type ProductCardProps,
  type ProductGridProps,
  type ProductEditorProps,
  type ExtractionPanelProps,
} from './components';
