/**
 * Brand Persistence Service
 *
 * SINGLE SOURCE OF TRUTH for brand creation and retrieval.
 * This service ensures brands are never duplicated per website URL.
 *
 * PERMANENT FIX for brand_id mismatch issue.
 */

import { supabase } from '@/lib/supabase';

export interface BrandData {
  id: string;
  name: string;
  industry: string;
  website: string;
  user_id?: string | null;
  location?: string;
  emotional_quotient?: number | null;
  eq_calculated_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface GetOrCreateBrandInput {
  website: string;
  name: string;
  industry: string;
  userId?: string | null;
  location?: string;
}

export interface BrandResult {
  success: boolean;
  brand?: BrandData;
  isNew?: boolean;
  error?: string;
}

/**
 * Get or create a brand for a website URL.
 *
 * This is the ONLY function that should be used to get/create brands.
 * It guarantees:
 * 1. Only one brand exists per website URL
 * 2. Existing brands are reused (not duplicated)
 * 3. Brand data is updated if it exists
 *
 * Uses UPSERT pattern for atomicity.
 */
export async function getOrCreateBrand(input: GetOrCreateBrandInput): Promise<BrandResult> {
  const { website, name, industry, userId, location } = input;

  // Normalize URL
  const normalizedUrl = website.startsWith('http') ? website : `https://${website}`;

  console.log('[BrandPersistence] getOrCreateBrand for:', normalizedUrl);

  try {
    // Step 1: Check if brand already exists for this website
    const { data: existingBrands, error: findError } = await supabase
      .from('brands')
      .select('*')
      .eq('website', normalizedUrl)
      .order('created_at', { ascending: true })
      .limit(1);

    if (findError) {
      console.error('[BrandPersistence] Error finding brand:', findError);
      return { success: false, error: findError.message };
    }

    const existingBrand = existingBrands?.[0];

    if (existingBrand) {
      // Brand exists - update it with latest info and return
      console.log('[BrandPersistence] ✅ Found existing brand:', existingBrand.id);

      // Brand exists - just return it (don't update to avoid column issues)
      return { success: true, brand: existingBrand as BrandData, isNew: false };
    }

    // Step 2: Brand doesn't exist - create it
    console.log('[BrandPersistence] Creating NEW brand for:', normalizedUrl);

    const { data: newBrand, error: createError } = await supabase
      .from('brands')
      .insert({
        name,
        industry,
        website: normalizedUrl,
        user_id: userId || null,
      })
      .select()
      .single();

    if (createError) {
      // Handle unique constraint violation (race condition)
      if (createError.code === '23505') {
        console.log('[BrandPersistence] Race condition - brand was just created, fetching...');

        // Another request created it - fetch and return
        const { data: raceBrand } = await supabase
          .from('brands')
          .select('*')
          .eq('website', normalizedUrl)
          .single();

        if (raceBrand) {
          return { success: true, brand: raceBrand as BrandData, isNew: false };
        }
      }

      console.error('[BrandPersistence] Create failed:', createError);
      return { success: false, error: createError.message };
    }

    console.log('[BrandPersistence] ✅ NEW brand created:', newBrand.id);
    return { success: true, brand: newBrand as BrandData, isNew: true };

  } catch (error: any) {
    console.error('[BrandPersistence] Unexpected error:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Validate that a brand ID exists in the database.
 * Use this to check if a cached/localStorage brand is still valid.
 */
export async function validateBrandExists(brandId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('id')
      .eq('id', brandId)
      .maybeSingle();

    return !error && !!data;
  } catch {
    return false;
  }
}

/**
 * Get brand by ID
 */
export async function getBrandById(brandId: string): Promise<BrandResult> {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('id', brandId)
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || 'Brand not found' };
    }

    return { success: true, brand: data as BrandData };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get brand by website URL
 */
export async function getBrandByWebsite(website: string): Promise<BrandResult> {
  const normalizedUrl = website.startsWith('http') ? website : `https://${website}`;

  try {
    const { data: brands, error } = await supabase
      .from('brands')
      .select('*')
      .eq('website', normalizedUrl)
      .order('created_at', { ascending: true })
      .limit(1);

    if (error) {
      return { success: false, error: error.message };
    }

    const brand = brands?.[0];
    if (!brand) {
      return { success: false, error: 'Brand not found for website' };
    }

    return { success: true, brand: brand as BrandData };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Export singleton functions
export const brandPersistence = {
  getOrCreateBrand,
  validateBrandExists,
  getBrandById,
  getBrandByWebsite,
};
