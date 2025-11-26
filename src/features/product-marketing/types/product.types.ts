/**
 * Product Marketing - Core Product Types
 *
 * Type definitions for products, categories, and related entities.
 * Matches database schema exactly for type safety.
 */

// ============================================================================
// ENUMS
// ============================================================================

/** Product status options */
export type ProductStatus = 'active' | 'inactive' | 'seasonal' | 'discontinued' | 'draft';

/** Source types for product extraction */
export type SourceType = 'uvp' | 'website' | 'reviews' | 'keywords' | 'manual' | 'api';

/** Extraction log status */
export type ExtractionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

/** Extraction types */
export type ExtractionType = 'uvp' | 'website' | 'reviews' | 'keywords' | 'full' | 'manual';

/** Metadata value types */
export type MetadataValueType = 'string' | 'number' | 'boolean' | 'json' | 'date' | 'array';

// ============================================================================
// CORE ENTITIES
// ============================================================================

/** Product image structure */
export interface ProductImage {
  url: string;
  alt?: string;
  isPrimary?: boolean;
  width?: number;
  height?: number;
}

/** Product category */
export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentCategoryId: string | null;
  displayOrder: number;
  icon: string | null;
  color: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Main product entity */
export interface Product {
  id: string;
  brandId: string;
  categoryId: string | null;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  price: number | null;
  priceDisplay: string | null;
  currency: string;
  features: string[];
  benefits: string[];
  images: ProductImage[];
  status: ProductStatus;
  isService: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
  isSeasonal: boolean;
  seasonalStart: string | null;
  seasonalEnd: string | null;
  tags: string[];
  externalId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;

  // Joined relations (optional)
  category?: ProductCategory;
  sources?: ProductSource[];
}

/** Product source tracking */
export interface ProductSource {
  id: string;
  productId: string;
  sourceType: SourceType;
  sourceUrl: string | null;
  sourceData: Record<string, unknown> | null;
  confidenceScore: number;
  extractedAt: string;
  isPrimary: boolean;
}

/** Product metadata key-value */
export interface ProductMetadata {
  id: string;
  productId: string;
  key: string;
  value: string | null;
  valueType: MetadataValueType;
  createdAt: string;
}

/** Extraction log entry */
export interface ExtractionLog {
  id: string;
  brandId: string;
  extractionType: ExtractionType;
  status: ExtractionStatus;
  productsFound: number;
  productsCreated: number;
  productsUpdated: number;
  productsSkipped: number;
  errorMessage: string | null;
  errorDetails: Record<string, unknown> | null;
  startedAt: string;
  completedAt: string | null;
  metadata: Record<string, unknown>;
}

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

/** Create product input */
export interface CreateProductDTO {
  brandId?: string; // Can be passed separately
  categoryId?: string;
  name: string;
  slug?: string; // Auto-generated if not provided
  description?: string;
  shortDescription?: string;
  price?: number;
  priceDisplay?: string;
  currency?: string;
  features?: string[];
  benefits?: string[];
  images?: ProductImage[];
  status?: ProductStatus;
  isService?: boolean;
  isFeatured?: boolean;
  isBestseller?: boolean;
  isSeasonal?: boolean;
  seasonalStart?: string;
  seasonalEnd?: string;
  tags?: string[];
  externalId?: string;
  metadata?: Record<string, unknown>;
}

/** Update product input */
export interface UpdateProductDTO {
  categoryId?: string | null;
  name?: string;
  slug?: string;
  description?: string | null;
  shortDescription?: string | null;
  price?: number | null;
  priceDisplay?: string | null;
  currency?: string;
  features?: string[];
  benefits?: string[];
  images?: ProductImage[];
  status?: ProductStatus;
  isService?: boolean;
  isFeatured?: boolean;
  isBestseller?: boolean;
  isSeasonal?: boolean;
  seasonalStart?: string | null;
  seasonalEnd?: string | null;
  tags?: string[];
  externalId?: string | null;
  metadata?: Record<string, unknown>;
}

/** Create category input */
export interface CreateCategoryDTO {
  name: string;
  slug?: string;
  description?: string;
  parentCategoryId?: string;
  displayOrder?: number;
  icon?: string;
  color?: string;
  isActive?: boolean;
}

/** Update category input */
export interface UpdateCategoryDTO {
  name?: string;
  slug?: string;
  description?: string | null;
  parentCategoryId?: string | null;
  displayOrder?: number;
  icon?: string | null;
  color?: string | null;
  isActive?: boolean;
}

// ============================================================================
// QUERY TYPES
// ============================================================================

/** Product filter options */
export interface ProductFilters {
  categoryId?: string;
  status?: ProductStatus | ProductStatus[];
  isFeatured?: boolean;
  isBestseller?: boolean;
  isSeasonal?: boolean;
  tags?: string[];
  priceMin?: number;
  priceMax?: number;
  search?: string;
}

/** Product sort options */
export interface ProductSortOptions {
  field: 'name' | 'price' | 'createdAt' | 'updatedAt';
  direction: 'asc' | 'desc';
}

/** Pagination options */
export interface PaginationOptions {
  page: number;
  limit: number;
}

/** Paginated result */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

// ============================================================================
// CATEGORY TREE
// ============================================================================

/** Category with children for tree view */
export interface CategoryTreeNode extends ProductCategory {
  children: CategoryTreeNode[];
  productCount?: number;
}

/** Flat category with depth for indentation */
export interface FlatCategoryNode extends ProductCategory {
  depth: number;
  path: string[];
}

// ============================================================================
// DATABASE ROW TYPES (snake_case for direct DB mapping)
// ============================================================================

/** Raw database row for pm_products */
export interface ProductRow {
  id: string;
  brand_id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number | null;
  price_display: string | null;
  currency: string;
  features: string[];
  benefits: string[];
  images: ProductImage[];
  status: ProductStatus;
  is_service: boolean;
  is_featured: boolean;
  is_bestseller: boolean;
  is_seasonal: boolean;
  seasonal_start: string | null;
  seasonal_end: string | null;
  tags: string[];
  external_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/** Raw database row for pm_categories */
export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_category_id: string | null;
  display_order: number;
  icon: string | null;
  color: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Raw database row for pm_product_sources */
export interface ProductSourceRow {
  id: string;
  product_id: string;
  source_type: SourceType;
  source_url: string | null;
  source_data: Record<string, unknown> | null;
  confidence_score: number;
  extracted_at: string;
  is_primary: boolean;
}

/** Raw database row for pm_extraction_logs */
export interface ExtractionLogRow {
  id: string;
  brand_id: string;
  extraction_type: ExtractionType;
  status: ExtractionStatus;
  products_found: number;
  products_created: number;
  products_updated: number;
  products_skipped: number;
  error_message: string | null;
  error_details: Record<string, unknown> | null;
  started_at: string;
  completed_at: string | null;
  metadata: Record<string, unknown>;
}

// ============================================================================
// TYPE MAPPERS
// ============================================================================

/** Convert database row to Product entity */
export function mapRowToProduct(row: ProductRow): Product {
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
    currency: row.currency,
    features: row.features || [],
    benefits: row.benefits || [],
    images: row.images || [],
    status: row.status,
    isService: row.is_service || false,
    isFeatured: row.is_featured,
    isBestseller: row.is_bestseller,
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

/** Convert database row to ProductCategory entity */
export function mapRowToCategory(row: CategoryRow): ProductCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    parentCategoryId: row.parent_category_id,
    displayOrder: row.display_order,
    icon: row.icon,
    color: row.color,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Convert database row to ProductSource entity */
export function mapRowToSource(row: ProductSourceRow): ProductSource {
  return {
    id: row.id,
    productId: row.product_id,
    sourceType: row.source_type,
    sourceUrl: row.source_url,
    sourceData: row.source_data,
    confidenceScore: row.confidence_score,
    extractedAt: row.extracted_at,
    isPrimary: row.is_primary,
  };
}

/** Convert database row to ExtractionLog entity */
export function mapRowToExtractionLog(row: ExtractionLogRow): ExtractionLog {
  return {
    id: row.id,
    brandId: row.brand_id,
    extractionType: row.extraction_type,
    status: row.status,
    productsFound: row.products_found,
    productsCreated: row.products_created,
    productsUpdated: row.products_updated,
    productsSkipped: row.products_skipped,
    errorMessage: row.error_message,
    errorDetails: row.error_details,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    metadata: row.metadata || {},
  };
}
