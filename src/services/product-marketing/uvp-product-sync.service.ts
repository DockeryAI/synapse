/**
 * UVP Product Sync Service
 *
 * Syncs products extracted during UVP onboarding to the product catalog.
 * Maps UVP ProductService format to pm_products table format.
 *
 * Part of Phase 1.1: Auto-Extraction During UVP
 */

import type { ProductService, ProductServiceCategory, ProductServiceData } from '@/types/uvp-flow.types';
import type { CreateProductDTO, Product } from '@/features/product-marketing/types/product.types';
import { bulkCreateProducts, listProducts } from '@/features/product-marketing/services/catalog/product-crud.service';
import { createCategory, listCategories, ensureDefaultCategories } from '@/features/product-marketing/services/catalog/category.service';
import { isFeatureEnabled } from '@/features/product-marketing/config/feature-flags';
import { supabase } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface SyncResult {
  success: boolean;
  productsCreated: number;
  productsSkipped: number;
  categoriesCreated: number;
  errors: string[];
  products: Product[];
}

export interface SyncOptions {
  /** Only sync confirmed products (default: true) */
  confirmedOnly?: boolean;
  /** Skip products that already exist (default: true) */
  skipExisting?: boolean;
  /** Minimum confidence score to sync (default: 0.5) */
  minConfidence?: number;
}

// ============================================================================
// MAIN SYNC FUNCTION
// ============================================================================

/**
 * Sync products from UVP extraction to the product catalog
 */
export async function syncUVPProductsToCatalog(
  brandId: string,
  productData: ProductServiceData,
  options: SyncOptions = {}
): Promise<SyncResult> {
  const {
    confirmedOnly = true,
    skipExisting = true,
    minConfidence = 0.5,
  } = options;

  const result: SyncResult = {
    success: false,
    productsCreated: 0,
    productsSkipped: 0,
    categoriesCreated: 0,
    errors: [],
    products: [],
  };

  console.log('[UVP Product Sync] Starting sync for brand:', brandId);
  console.log('[UVP Product Sync] Categories to process:', productData.categories.length);

  // Check if feature is enabled (gracefully handle if not)
  let featureEnabled = true;
  try {
    featureEnabled = isFeatureEnabled('PRODUCT_MARKETING_ENABLED');
  } catch {
    // Feature flags may not be configured, proceed anyway
    console.log('[UVP Product Sync] Feature flags not configured, proceeding with sync');
  }

  if (!featureEnabled) {
    console.log('[UVP Product Sync] Product marketing feature disabled, skipping sync');
    result.success = true;
    return result;
  }

  try {
    // 1. Ensure default categories exist
    await ensureDefaultCategoriesForBrand();

    // 2. Get existing products to avoid duplicates
    let existingProducts: Product[] = [];
    if (skipExisting) {
      try {
        const existing = await listProducts(brandId, undefined, undefined, { page: 1, limit: 1000 });
        existingProducts = existing.data;
        console.log('[UVP Product Sync] Found existing products:', existingProducts.length);
      } catch (err) {
        console.warn('[UVP Product Sync] Could not fetch existing products:', err);
      }
    }

    // 3. Get or create categories
    const categoryMap = await ensureCategoriesExist(productData.categories, result);

    // 4. Collect products to create
    const productsToCreate: CreateProductDTO[] = [];

    for (const category of productData.categories) {
      for (const product of category.items) {
        // Skip unconfirmed if option set
        if (confirmedOnly && !product.confirmed) {
          result.productsSkipped++;
          continue;
        }

        // Skip low confidence
        if (product.confidence < minConfidence * 100) {
          result.productsSkipped++;
          continue;
        }

        // Skip if already exists (by name match)
        if (skipExisting && existingProducts.some(p =>
          p.name.toLowerCase() === product.name.toLowerCase()
        )) {
          result.productsSkipped++;
          continue;
        }

        // Map to CreateProductDTO
        const dto = mapUVPProductToDTO(product, brandId, categoryMap[category.id]);
        productsToCreate.push(dto);
      }
    }

    console.log('[UVP Product Sync] Products to create:', productsToCreate.length);
    console.log('[UVP Product Sync] Products skipped:', result.productsSkipped);

    // 5. Bulk create products
    if (productsToCreate.length > 0) {
      const createResult = await bulkCreateProducts(productsToCreate);
      result.productsCreated = createResult.created.length;
      result.products = createResult.created;

      if (createResult.errors.length > 0) {
        result.errors.push(...createResult.errors.map(e => e.error));
      }
    }

    result.success = true;
    console.log('[UVP Product Sync] Sync complete:', {
      created: result.productsCreated,
      skipped: result.productsSkipped,
      categories: result.categoriesCreated,
      errors: result.errors.length,
    });

  } catch (error) {
    console.error('[UVP Product Sync] Sync failed:', error);
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  return result;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Ensure default categories exist in the system
 */
async function ensureDefaultCategoriesForBrand(): Promise<void> {
  try {
    await ensureDefaultCategories();
  } catch (err) {
    console.warn('[UVP Product Sync] Could not ensure default categories:', err);
  }
}

/**
 * Ensure categories from UVP data exist in the catalog
 */
async function ensureCategoriesExist(
  uvpCategories: ProductServiceCategory[],
  result: SyncResult
): Promise<Record<string, string | null>> {
  const categoryMap: Record<string, string | null> = {};

  try {
    // Get existing categories
    const existingCategories = await listCategories();
    const existingByName = new Map(
      existingCategories.map(c => [c.name.toLowerCase(), c.id])
    );

    for (const uvpCat of uvpCategories) {
      const catNameLower = uvpCat.name.toLowerCase();

      if (existingByName.has(catNameLower)) {
        categoryMap[uvpCat.id] = existingByName.get(catNameLower)!;
      } else {
        // Create new category
        try {
          const newCat = await createCategory({
            name: uvpCat.name,
            description: `Auto-created from UVP extraction`,
            isActive: true,
          });
          categoryMap[uvpCat.id] = newCat.id;
          result.categoriesCreated++;
        } catch (err) {
          console.warn('[UVP Product Sync] Could not create category:', uvpCat.name, err);
          categoryMap[uvpCat.id] = null;
        }
      }
    }
  } catch (err) {
    console.warn('[UVP Product Sync] Category mapping failed:', err);
    // Map all to null (uncategorized)
    for (const uvpCat of uvpCategories) {
      categoryMap[uvpCat.id] = null;
    }
  }

  return categoryMap;
}

/**
 * Map UVP ProductService to CreateProductDTO
 */
function mapUVPProductToDTO(
  product: ProductService,
  brandId: string,
  categoryId: string | null
): CreateProductDTO {
  // Extract features from description if possible
  const features = extractFeaturesFromDescription(product.description);

  // Determine if this is a service vs product
  const isService = detectIfService(product.name, product.description, product.category);

  return {
    brandId,
    categoryId: categoryId || undefined,
    name: product.name,
    description: product.description,
    shortDescription: truncateDescription(product.description, 150),
    features,
    benefits: [], // Will be enriched later
    status: 'active',
    isService,
    isFeatured: false,
    isBestseller: false,
    isSeasonal: detectSeasonal(product.name, product.description),
    tags: generateTags(product),
    metadata: {
      uvpSource: product.source,
      uvpConfidence: product.confidence,
      uvpSourceUrl: product.sourceUrl,
      uvpSourceExcerpt: product.sourceExcerpt,
      extractedAt: new Date().toISOString(),
    },
  };
}

/**
 * Extract features from product description
 */
function extractFeaturesFromDescription(description: string): string[] {
  if (!description) return [];

  const features: string[] = [];

  // Look for bullet points or numbered lists
  const bulletPatterns = [
    /[•\-\*]\s*(.+)/g,
    /\d+\.\s*(.+)/g,
  ];

  for (const pattern of bulletPatterns) {
    const matches = description.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length < 100) {
        features.push(match[1].trim());
      }
    }
  }

  // If no bullets, try to extract key phrases
  if (features.length === 0) {
    const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 10);
    features.push(...sentences.slice(0, 3).map(s => s.trim()));
  }

  return features.slice(0, 5); // Max 5 features
}

/**
 * Detect if product is likely a service
 */
function detectIfService(name: string, description: string, category: string): boolean {
  const serviceKeywords = [
    'service', 'consulting', 'support', 'maintenance', 'training',
    'installation', 'repair', 'cleaning', 'delivery', 'subscription',
    'membership', 'coaching', 'therapy', 'treatment', 'session',
  ];

  const text = `${name} ${description} ${category}`.toLowerCase();
  return serviceKeywords.some(kw => text.includes(kw));
}

/**
 * Detect if product is seasonal
 */
function detectSeasonal(name: string, description: string): boolean {
  const seasonalKeywords = [
    'holiday', 'christmas', 'thanksgiving', 'easter', 'halloween',
    'summer', 'winter', 'spring', 'fall', 'autumn', 'seasonal',
    'limited time', 'special edition', 'valentines', 'mothers day',
  ];

  const text = `${name} ${description}`.toLowerCase();
  return seasonalKeywords.some(kw => text.includes(kw));
}

/**
 * Generate tags from product data
 */
function generateTags(product: ProductService): string[] {
  const tags: string[] = [];

  // Add category as tag
  if (product.category) {
    tags.push(product.category.toLowerCase());
  }

  // Add source as tag
  tags.push(`source:${product.source}`);

  // Add confidence level tag
  if (product.confidence >= 90) {
    tags.push('high-confidence');
  } else if (product.confidence >= 70) {
    tags.push('medium-confidence');
  } else {
    tags.push('low-confidence');
  }

  return tags;
}

/**
 * Truncate description to specified length
 */
function truncateDescription(description: string, maxLength: number): string {
  if (!description || description.length <= maxLength) return description;
  return description.substring(0, maxLength - 3) + '...';
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if products have been synced for a brand
 */
export async function hasProductsForBrand(brandId: string): Promise<boolean> {
  try {
    const { count } = await supabase
      .from('pm_products')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brandId);

    return (count || 0) > 0;
  } catch {
    return false;
  }
}

/**
 * Get sync status for a brand
 */
export async function getProductSyncStatus(brandId: string): Promise<{
  hasProducts: boolean;
  productCount: number;
  lastSyncedAt: string | null;
}> {
  try {
    const { data, count } = await supabase
      .from('pm_products')
      .select('created_at', { count: 'exact' })
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })
      .limit(1);

    return {
      hasProducts: (count || 0) > 0,
      productCount: count || 0,
      lastSyncedAt: data?.[0]?.created_at || null,
    };
  } catch {
    return {
      hasProducts: false,
      productCount: 0,
      lastSyncedAt: null,
    };
  }
}
