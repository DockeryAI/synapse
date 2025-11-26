/**
 * Product Marketing Types - Main Export
 *
 * Re-exports all type definitions from the types directory.
 */

// Product types
export type {
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
  ProductRow,
  CategoryRow,
  ProductSourceRow,
  ExtractionLogRow,
} from './product.types';

export {
  mapRowToProduct,
  mapRowToCategory,
  mapRowToSource,
  mapRowToExtractionLog,
} from './product.types';

// Extraction types
export type {
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
} from './extraction.types';

export { validateExtractedProduct } from './extraction.types';
