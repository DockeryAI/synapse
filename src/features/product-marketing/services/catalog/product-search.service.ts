/**
 * Product Search Service
 *
 * Advanced search and filtering capabilities for products.
 * Supports full-text search, faceted filtering, and aggregations.
 */

import {
  getPMSupabaseClient,
  PM_TABLES,
  toPMError,
} from './supabase-pm.client';
import { requireFeature } from '../../config/feature-flags';
import {
  type Product,
  type ProductRow,
  type ProductStatus,
  mapRowToProduct,
} from '../../types';

// ============================================================================
// SEARCH TYPES
// ============================================================================

/** Search parameters (alias for backwards compatibility) */
export type ProductSearchParams = ProductSearchOptions;

/** Search options */
export interface ProductSearchOptions {
  /** Search query (searches name, description, tags) */
  query?: string;
  /** Filter by category ID */
  categoryId?: string;
  /** Filter by status(es) */
  status?: ProductStatus | ProductStatus[];
  /** Filter by featured flag */
  isFeatured?: boolean;
  /** Filter by bestseller flag */
  isBestseller?: boolean;
  /** Filter by tags (any match) */
  tags?: string[];
  /** Minimum price */
  priceMin?: number;
  /** Maximum price */
  priceMax?: number;
  /** Only include seasonal products */
  seasonalOnly?: boolean;
  /** Only include currently in-season products */
  inSeasonOnly?: boolean;
  /** Sort field */
  sortBy?: 'name' | 'price' | 'createdAt' | 'updatedAt' | 'relevance';
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
  /** Page number (1-indexed) */
  page?: number;
  /** Results per page */
  limit?: number;
}

/** Search result with metadata */
export interface ProductSearchResult {
  /** Matched products */
  products: Product[];
  /** Total matching products */
  total: number;
  /** Current page */
  page: number;
  /** Results per page */
  limit: number;
  /** Total pages */
  totalPages: number;
  /** Has more results */
  hasMore: boolean;
  /** Search facets/aggregations */
  facets?: ProductFacets;
}

/** Aggregated facets for filtering */
export interface ProductFacets {
  /** Category counts */
  categories: Array<{
    id: string;
    name: string;
    count: number;
  }>;
  /** Status counts */
  statuses: Array<{
    status: ProductStatus;
    count: number;
  }>;
  /** Price ranges */
  priceRanges: Array<{
    min: number;
    max: number | null;
    count: number;
  }>;
  /** Top tags */
  topTags: Array<{
    tag: string;
    count: number;
  }>;
}

// ============================================================================
// MAIN SEARCH FUNCTION
// ============================================================================

/**
 * Search products with advanced filtering
 */
export async function searchProducts(
  brandId: string,
  options: ProductSearchOptions = {}
): Promise<ProductSearchResult> {
  requireFeature('PRODUCT_MARKETING_ENABLED', 'searchProducts');

  const client = getPMSupabaseClient();

  const page = options.page || 1;
  const limit = options.limit || 20;
  const offset = (page - 1) * limit;

  // Build query
  let query = client
    .from(PM_TABLES.PRODUCTS)
    .select('*', { count: 'exact' })
    .eq('brand_id', brandId);

  // Text search
  if (options.query && options.query.trim()) {
    const searchTerm = options.query.trim();
    query = query.or(
      `name.ilike.%${searchTerm}%,` +
      `description.ilike.%${searchTerm}%,` +
      `short_description.ilike.%${searchTerm}%`
    );
  }

  // Category filter
  if (options.categoryId) {
    query = query.eq('category_id', options.categoryId);
  }

  // Status filter
  if (options.status) {
    if (Array.isArray(options.status)) {
      query = query.in('status', options.status);
    } else {
      query = query.eq('status', options.status);
    }
  }

  // Featured filter
  if (options.isFeatured !== undefined) {
    query = query.eq('is_featured', options.isFeatured);
  }

  // Bestseller filter
  if (options.isBestseller !== undefined) {
    query = query.eq('is_bestseller', options.isBestseller);
  }

  // Tags filter (any match)
  if (options.tags && options.tags.length > 0) {
    query = query.overlaps('tags', options.tags);
  }

  // Price range
  if (options.priceMin !== undefined) {
    query = query.gte('price', options.priceMin);
  }
  if (options.priceMax !== undefined) {
    query = query.lte('price', options.priceMax);
  }

  // Seasonal filters
  if (options.seasonalOnly) {
    query = query.eq('is_seasonal', true);
  }

  if (options.inSeasonOnly) {
    const today = new Date().toISOString().split('T')[0];
    query = query
      .or(`seasonal_start.is.null,seasonal_start.lte.${today}`)
      .or(`seasonal_end.is.null,seasonal_end.gte.${today}`);
  }

  // Sorting
  const sortField = options.sortBy || 'createdAt';
  const sortDirection = options.sortDirection || 'desc';

  const dbSortField =
    sortField === 'createdAt' ? 'created_at' :
    sortField === 'updatedAt' ? 'updated_at' :
    sortField === 'relevance' ? 'created_at' :
    sortField;

  query = query.order(dbSortField, { ascending: sortDirection === 'asc' });

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Search failed: ${toPMError(error).message}`);
  }

  const products = (data || []).map(row => mapRowToProduct(row as ProductRow));
  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    products,
    total,
    page,
    limit,
    totalPages,
    hasMore: page < totalPages,
  };
}

// ============================================================================
// SPECIALIZED SEARCH FUNCTIONS
// ============================================================================

/**
 * Search by category
 */
export async function filterByCategory(
  brandId: string,
  categoryId: string,
  limit = 20
): Promise<Product[]> {
  const result = await searchProducts(brandId, {
    categoryId,
    status: 'active',
    limit,
  });
  return result.products;
}

/**
 * Search by status
 */
export async function filterByStatus(
  brandId: string,
  status: ProductStatus,
  limit = 20
): Promise<Product[]> {
  const result = await searchProducts(brandId, {
    status,
    limit,
  });
  return result.products;
}

/**
 * Search by price range
 */
export async function filterByPriceRange(
  brandId: string,
  min: number,
  max: number,
  limit = 20
): Promise<Product[]> {
  const result = await searchProducts(brandId, {
    priceMin: min,
    priceMax: max,
    status: 'active',
    limit,
  });
  return result.products;
}

/**
 * Get seasonal products (with seasonal dates set)
 */
export async function getSeasonalProducts(brandId: string): Promise<Product[]> {
  const result = await searchProducts(brandId, {
    seasonalOnly: true,
    status: 'active',
    limit: 100,
  });
  return result.products;
}

/**
 * Get currently in-season products
 */
export async function getInSeasonProducts(brandId: string): Promise<Product[]> {
  const result = await searchProducts(brandId, {
    inSeasonOnly: true,
    status: ['active', 'seasonal'],
    limit: 100,
  });
  return result.products;
}

/**
 * Get bestsellers
 */
export async function getBestsellers(
  brandId: string,
  limit = 10
): Promise<Product[]> {
  const result = await searchProducts(brandId, {
    isBestseller: true,
    status: 'active',
    limit,
  });
  return result.products;
}

/**
 * Get featured products
 */
export async function getFeaturedProducts(
  brandId: string,
  limit = 10
): Promise<Product[]> {
  const result = await searchProducts(brandId, {
    isFeatured: true,
    status: 'active',
    limit,
  });
  return result.products;
}

/**
 * Search by tags
 */
export async function searchByTags(
  brandId: string,
  tags: string[],
  limit = 20
): Promise<Product[]> {
  const result = await searchProducts(brandId, {
    tags,
    status: 'active',
    limit,
  });
  return result.products;
}

// ============================================================================
// FACET AGGREGATIONS
// ============================================================================

/**
 * Get search facets for filtering UI
 */
export async function getProductFacets(
  brandId: string
): Promise<ProductFacets> {
  requireFeature('PRODUCT_MARKETING_ENABLED', 'getProductFacets');

  const client = getPMSupabaseClient();

  // Get all products for this brand
  const { data: products, error } = await client
    .from(PM_TABLES.PRODUCTS)
    .select('category_id, status, price, tags')
    .eq('brand_id', brandId);

  if (error) {
    throw new Error(`Failed to get facets: ${toPMError(error).message}`);
  }

  // Get categories
  const { data: categories } = await client
    .from(PM_TABLES.CATEGORIES)
    .select('id, name');

  // Aggregate category counts
  const categoryCounts = new Map<string, number>();
  for (const product of products || []) {
    if (product.category_id) {
      categoryCounts.set(
        product.category_id,
        (categoryCounts.get(product.category_id) || 0) + 1
      );
    }
  }

  const categoryFacets = (categories || [])
    .filter(c => categoryCounts.has(c.id))
    .map(c => ({
      id: c.id,
      name: c.name,
      count: categoryCounts.get(c.id) || 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Aggregate status counts
  const statusCounts = new Map<ProductStatus, number>();
  for (const product of products || []) {
    statusCounts.set(
      product.status,
      (statusCounts.get(product.status) || 0) + 1
    );
  }

  const statusFacets: ProductFacets['statuses'] = [];
  for (const [status, count] of statusCounts) {
    statusFacets.push({ status, count });
  }
  statusFacets.sort((a, b) => b.count - a.count);

  // Price ranges
  const priceRanges = [
    { min: 0, max: 25, count: 0 },
    { min: 25, max: 50, count: 0 },
    { min: 50, max: 100, count: 0 },
    { min: 100, max: 250, count: 0 },
    { min: 250, max: 500, count: 0 },
    { min: 500, max: null, count: 0 },
  ];

  for (const product of products || []) {
    if (product.price != null) {
      for (const range of priceRanges) {
        if (
          product.price >= range.min &&
          (range.max === null || product.price < range.max)
        ) {
          range.count++;
          break;
        }
      }
    }
  }

  // Top tags
  const tagCounts = new Map<string, number>();
  for (const product of products || []) {
    for (const tag of product.tags || []) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
  }

  const topTags = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  return {
    categories: categoryFacets,
    statuses: statusFacets,
    priceRanges: priceRanges.filter(r => r.count > 0),
    topTags,
  };
}

// ============================================================================
// AUTOCOMPLETE / SUGGESTIONS
// ============================================================================

/**
 * Get search suggestions based on partial query
 */
export async function getSearchSuggestions(
  brandId: string,
  query: string,
  limit = 5
): Promise<string[]> {
  requireFeature('PRODUCT_MARKETING_ENABLED', 'getSearchSuggestions');

  if (!query || query.length < 2) {
    return [];
  }

  const client = getPMSupabaseClient();

  const { data, error } = await client
    .from(PM_TABLES.PRODUCTS)
    .select('name')
    .eq('brand_id', brandId)
    .ilike('name', `%${query}%`)
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get suggestions: ${toPMError(error).message}`);
  }

  return (data || []).map(p => p.name);
}

/**
 * Get related products based on tags and category
 */
export async function getRelatedProducts(
  brandId: string,
  productId: string,
  limit = 5
): Promise<Product[]> {
  requireFeature('PRODUCT_MARKETING_ENABLED', 'getRelatedProducts');

  const client = getPMSupabaseClient();

  // Get the source product
  const { data: sourceProduct } = await client
    .from(PM_TABLES.PRODUCTS)
    .select('category_id, tags')
    .eq('id', productId)
    .single();

  if (!sourceProduct) {
    return [];
  }

  // Find products with same category or overlapping tags
  let query = client
    .from(PM_TABLES.PRODUCTS)
    .select('*')
    .eq('brand_id', brandId)
    .eq('status', 'active')
    .neq('id', productId)
    .limit(limit);

  if (sourceProduct.category_id) {
    query = query.eq('category_id', sourceProduct.category_id);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get related products: ${toPMError(error).message}`);
  }

  return (data || []).map(row => mapRowToProduct(row as ProductRow));
}
