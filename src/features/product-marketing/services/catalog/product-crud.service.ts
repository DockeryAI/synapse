/**
 * Product CRUD Service
 *
 * Full create, read, update, delete operations for products.
 * Includes filtering, pagination, and bulk operations.
 */

import {
  getPMSupabaseClient,
  PM_TABLES,
  toPMError,
  isDuplicateError,
} from './supabase-pm.client';
import { requireFeature } from '../../config/feature-flags';
import {
  type Product,
  type ProductRow,
  type CreateProductDTO,
  type UpdateProductDTO,
  type ProductFilters,
  type ProductSortOptions,
  type PaginatedResult,
  type ProductStatus,
  mapRowToProduct,
} from '../../types';

// ============================================================================
// SLUG GENERATION
// ============================================================================

/**
 * Generate URL-safe slug from name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 200);
}

/**
 * Generate unique slug (appends number if duplicate)
 */
async function generateUniqueSlug(
  brandId: string,
  name: string,
  excludeId?: string
): Promise<string> {
  const baseSlug = generateSlug(name);
  const client = getPMSupabaseClient();

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    let query = client
      .from(PM_TABLES.PRODUCTS)
      .select('id')
      .eq('brand_id', brandId)
      .eq('slug', slug);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data } = await query.single();

    if (!data) {
      return slug;
    }

    counter++;
    slug = `${baseSlug}-${counter}`;

    // Safety limit
    if (counter > 100) {
      slug = `${baseSlug}-${Date.now()}`;
      break;
    }
  }

  return slug;
}

// ============================================================================
// CREATE OPERATIONS
// ============================================================================

/**
 * Create a new product
 */
export async function createProduct(dto: CreateProductDTO): Promise<Product> {
  requireFeature('PRODUCT_MARKETING_ENABLED', 'createProduct');

  if (!dto.brandId) {
    throw new Error('brandId is required to create a product');
  }

  const client = getPMSupabaseClient();

  // Generate slug if not provided
  const slug = dto.slug || await generateUniqueSlug(dto.brandId, dto.name);

  const productData = {
    brand_id: dto.brandId,
    category_id: dto.categoryId || null,
    name: dto.name,
    slug,
    description: dto.description || null,
    short_description: dto.shortDescription || null,
    price: dto.price ?? null,
    price_display: dto.priceDisplay || null,
    currency: dto.currency || 'USD',
    features: dto.features || [],
    benefits: dto.benefits || [],
    images: dto.images || [],
    status: dto.status || 'active',
    is_service: dto.isService ?? false,
    is_featured: dto.isFeatured ?? false,
    is_bestseller: dto.isBestseller ?? false,
    is_seasonal: dto.isSeasonal ?? false,
    seasonal_start: dto.seasonalStart || null,
    seasonal_end: dto.seasonalEnd || null,
    tags: dto.tags || [],
    external_id: dto.externalId || null,
    metadata: dto.metadata || {},
  };

  const { data, error } = await client
    .from(PM_TABLES.PRODUCTS)
    .insert(productData)
    .select()
    .single();

  if (error) {
    const pmError = toPMError(error);
    if (isDuplicateError(error)) {
      throw new Error(`Product with slug "${slug}" already exists for this brand`);
    }
    throw new Error(`Failed to create product: ${pmError.message}`);
  }

  return mapRowToProduct(data as ProductRow);
}

/**
 * Bulk create products
 */
export async function bulkCreateProducts(
  products: CreateProductDTO[]
): Promise<{ created: Product[]; errors: Array<{ index: number; error: string }> }> {
  requireFeature('PRODUCT_MARKETING_ENABLED', 'bulkCreateProducts');

  const created: Product[] = [];
  const errors: Array<{ index: number; error: string }> = [];

  // Process in batches of 50
  const batchSize = 50;
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);

    const results = await Promise.allSettled(
      batch.map((dto, batchIndex) =>
        createProduct(dto).then(product => ({
          index: i + batchIndex,
          product,
        }))
      )
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        created.push(result.value.product);
      } else {
        const index = created.length + errors.length;
        errors.push({
          index,
          error: result.reason?.message || 'Unknown error',
        });
      }
    }
  }

  return { created, errors };
}

// ============================================================================
// READ OPERATIONS
// ============================================================================

/**
 * Get product by ID
 */
export async function getProduct(id: string): Promise<Product | null> {
  requireFeature('PRODUCT_MARKETING_ENABLED', 'getProduct');

  const client = getPMSupabaseClient();

  const { data, error } = await client
    .from(PM_TABLES.PRODUCTS)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get product: ${toPMError(error).message}`);
  }

  return mapRowToProduct(data as ProductRow);
}

/**
 * Get product by slug
 */
export async function getProductBySlug(
  brandId: string,
  slug: string
): Promise<Product | null> {
  requireFeature('PRODUCT_MARKETING_ENABLED', 'getProductBySlug');

  const client = getPMSupabaseClient();

  const { data, error } = await client
    .from(PM_TABLES.PRODUCTS)
    .select('*')
    .eq('brand_id', brandId)
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get product: ${toPMError(error).message}`);
  }

  return mapRowToProduct(data as ProductRow);
}

/**
 * List products with filters
 */
export async function listProducts(
  brandId: string,
  filters?: ProductFilters,
  sort?: ProductSortOptions,
  pagination?: { page: number; limit: number }
): Promise<PaginatedResult<Product>> {
  requireFeature('PRODUCT_MARKETING_ENABLED', 'listProducts');

  const client = getPMSupabaseClient();
  const page = pagination?.page || 1;
  const limit = pagination?.limit || 20;
  const offset = (page - 1) * limit;

  // Build query
  let query = client
    .from(PM_TABLES.PRODUCTS)
    .select('*', { count: 'exact' })
    .eq('brand_id', brandId);

  // Apply filters
  if (filters) {
    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }

    if (filters.isFeatured !== undefined) {
      query = query.eq('is_featured', filters.isFeatured);
    }

    if (filters.isBestseller !== undefined) {
      query = query.eq('is_bestseller', filters.isBestseller);
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }

    if (filters.priceMin !== undefined) {
      query = query.gte('price', filters.priceMin);
    }

    if (filters.priceMax !== undefined) {
      query = query.lte('price', filters.priceMax);
    }

    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      );
    }
  }

  // Apply sorting
  const sortField = sort?.field || 'createdAt';
  const sortDirection = sort?.direction || 'desc';
  const dbSortField = sortField === 'createdAt' ? 'created_at' :
                      sortField === 'updatedAt' ? 'updated_at' :
                      sortField;
  query = query.order(dbSortField, { ascending: sortDirection === 'asc' });

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to list products: ${toPMError(error).message}`);
  }

  const products = (data || []).map(row => mapRowToProduct(row as ProductRow));
  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    data: products,
    total,
    page,
    limit,
    totalPages,
    hasMore: page < totalPages,
  };
}

/**
 * Count products with filters
 */
export async function countProducts(
  brandId: string,
  filters?: ProductFilters
): Promise<number> {
  requireFeature('PRODUCT_MARKETING_ENABLED', 'countProducts');

  const client = getPMSupabaseClient();

  let query = client
    .from(PM_TABLES.PRODUCTS)
    .select('id', { count: 'exact', head: true })
    .eq('brand_id', brandId);

  // Apply same filters as listProducts
  if (filters) {
    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(`Failed to count products: ${toPMError(error).message}`);
  }

  return count || 0;
}

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

/**
 * Update a product
 */
export async function updateProduct(
  id: string,
  dto: UpdateProductDTO
): Promise<Product> {
  requireFeature('PRODUCT_MARKETING_ENABLED', 'updateProduct');

  const client = getPMSupabaseClient();

  // Build update object (only include defined fields)
  const updateData: Record<string, unknown> = {};

  if (dto.categoryId !== undefined) updateData.category_id = dto.categoryId;
  if (dto.name !== undefined) updateData.name = dto.name;
  if (dto.slug !== undefined) updateData.slug = dto.slug;
  if (dto.description !== undefined) updateData.description = dto.description;
  if (dto.shortDescription !== undefined) updateData.short_description = dto.shortDescription;
  if (dto.price !== undefined) updateData.price = dto.price;
  if (dto.priceDisplay !== undefined) updateData.price_display = dto.priceDisplay;
  if (dto.currency !== undefined) updateData.currency = dto.currency;
  if (dto.features !== undefined) updateData.features = dto.features;
  if (dto.benefits !== undefined) updateData.benefits = dto.benefits;
  if (dto.images !== undefined) updateData.images = dto.images;
  if (dto.status !== undefined) updateData.status = dto.status;
  if (dto.isService !== undefined) updateData.is_service = dto.isService;
  if (dto.isFeatured !== undefined) updateData.is_featured = dto.isFeatured;
  if (dto.isBestseller !== undefined) updateData.is_bestseller = dto.isBestseller;
  if (dto.isSeasonal !== undefined) updateData.is_seasonal = dto.isSeasonal;
  if (dto.seasonalStart !== undefined) updateData.seasonal_start = dto.seasonalStart;
  if (dto.seasonalEnd !== undefined) updateData.seasonal_end = dto.seasonalEnd;
  if (dto.tags !== undefined) updateData.tags = dto.tags;
  if (dto.externalId !== undefined) updateData.external_id = dto.externalId;
  if (dto.metadata !== undefined) updateData.metadata = dto.metadata;

  const { data, error } = await client
    .from(PM_TABLES.PRODUCTS)
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    const pmError = toPMError(error);
    if (pmError.code === 'PGRST116') {
      throw new Error(`Product with ID "${id}" not found`);
    }
    throw new Error(`Failed to update product: ${pmError.message}`);
  }

  return mapRowToProduct(data as ProductRow);
}

/**
 * Bulk update product status
 */
export async function bulkUpdateStatus(
  ids: string[],
  status: ProductStatus
): Promise<number> {
  requireFeature('PRODUCT_MARKETING_ENABLED', 'bulkUpdateStatus');

  const client = getPMSupabaseClient();

  const { data, error } = await client
    .from(PM_TABLES.PRODUCTS)
    .update({ status })
    .in('id', ids)
    .select('id');

  if (error) {
    throw new Error(`Failed to update products: ${toPMError(error).message}`);
  }

  return data?.length || 0;
}

// ============================================================================
// DELETE OPERATIONS
// ============================================================================

/**
 * Delete a product
 */
export async function deleteProduct(id: string): Promise<boolean> {
  requireFeature('PRODUCT_MARKETING_ENABLED', 'deleteProduct');

  const client = getPMSupabaseClient();

  const { error } = await client
    .from(PM_TABLES.PRODUCTS)
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete product: ${toPMError(error).message}`);
  }

  return true;
}

/**
 * Bulk delete products
 */
export async function bulkDeleteProducts(ids: string[]): Promise<number> {
  requireFeature('PRODUCT_MARKETING_ENABLED', 'bulkDeleteProducts');

  const client = getPMSupabaseClient();

  const { data, error } = await client
    .from(PM_TABLES.PRODUCTS)
    .delete()
    .in('id', ids)
    .select('id');

  if (error) {
    throw new Error(`Failed to delete products: ${toPMError(error).message}`);
  }

  return data?.length || 0;
}
