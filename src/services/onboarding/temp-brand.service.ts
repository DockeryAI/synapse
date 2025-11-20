/**
 * Temporary Brand Service
 *
 * Handles creation of temporary brands during onboarding
 * to satisfy RLS policies before user completes signup
 */

import { supabase } from '@/lib/supabase';

export interface TempBrandResult {
  success: boolean;
  brandId?: string;
  error?: string;
}

/**
 * Create or get temporary brand for onboarding session
 */
export async function getOrCreateTempBrand(): Promise<TempBrandResult> {
  try {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // No authenticated user - return a localStorage-based temporary ID
      // This won't work with RLS, but we'll save to localStorage instead
      const tempId = localStorage.getItem('temp_brand_id') || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('temp_brand_id', tempId);

      console.log('[TempBrand] No authenticated user, using localStorage temp ID:', tempId);

      return {
        success: true,
        brandId: tempId
      };
    }

    // Check if we already have a temp brand in localStorage
    const existingTempBrandId = localStorage.getItem('temp_brand_id');

    if (existingTempBrandId && !existingTempBrandId.startsWith('temp_')) {
      // Verify it still exists in database
      const { data: existingBrand } = await supabase
        .from('brands')
        .select('id')
        .eq('id', existingTempBrandId)
        .maybeSingle();

      if (existingBrand) {
        console.log('[TempBrand] Using existing temp brand:', existingTempBrandId);
        return { success: true, brandId: existingTempBrandId };
      }
    }

    // Create temporary brand
    const tempBrandData = {
      user_id: user.id,
      name: 'Onboarding Business',
      industry: 'onboarding',
      website: 'https://onboarding.temp',
      is_active: false, // Mark as inactive until onboarding completes
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newBrand, error: createError } = await supabase
      .from('brands')
      .insert(tempBrandData)
      .select('id')
      .single();

    if (createError) {
      console.error('[TempBrand] Failed to create temp brand:', createError);
      return {
        success: false,
        error: `Failed to create temporary brand: ${createError.message}`
      };
    }

    // Store in localStorage
    localStorage.setItem('temp_brand_id', newBrand.id);
    localStorage.setItem('temp_brand_user_id', user.id);

    console.log('[TempBrand] Created new temp brand:', newBrand.id);

    return {
      success: true,
      brandId: newBrand.id
    };

  } catch (error: any) {
    console.error('[TempBrand] Unexpected error:', error);
    return {
      success: false,
      error: error.message || 'Unexpected error creating temporary brand'
    };
  }
}

/**
 * Clean up temporary brand after successful onboarding
 */
export async function cleanupTempBrand(tempBrandId: string): Promise<void> {
  try {
    // Delete the temporary brand
    await supabase
      .from('brands')
      .delete()
      .eq('id', tempBrandId);

    // Clear localStorage
    localStorage.removeItem('temp_brand_id');
    localStorage.removeItem('temp_brand_user_id');

    console.log('[TempBrand] Cleaned up temp brand:', tempBrandId);
  } catch (error) {
    console.error('[TempBrand] Cleanup error:', error);
  }
}

/**
 * Migrate data from temp brand to real brand
 */
export async function migrateTempBrandData(
  tempBrandId: string,
  realBrandId: string
): Promise<boolean> {
  try {
    // Update UVPs
    await supabase
      .from('marba_uvps')
      .update({ brand_id: realBrandId })
      .eq('brand_id', tempBrandId);

    // Update sessions
    await supabase
      .from('uvp_sessions')
      .update({ brand_id: realBrandId })
      .eq('brand_id', tempBrandId);

    // Clean up temp brand
    await cleanupTempBrand(tempBrandId);

    console.log('[TempBrand] Migrated data from', tempBrandId, 'to', realBrandId);
    return true;

  } catch (error) {
    console.error('[TempBrand] Migration error:', error);
    return false;
  }
}