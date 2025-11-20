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
    // Check if we already have a temp brand in localStorage
    const existingTempBrandId = localStorage.getItem('temp_brand_id');

    if (existingTempBrandId) {
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

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Create anonymous session for onboarding
      const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();

      if (anonError || !anonData.user) {
        console.error('[TempBrand] Failed to create anonymous session:', anonError);
        return {
          success: false,
          error: 'Failed to create session for onboarding'
        };
      }

      console.log('[TempBrand] Created anonymous session:', anonData.user.id);
    }

    // Get current user (anonymous or real)
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
      return {
        success: false,
        error: 'No authenticated session available'
      };
    }

    // Create temporary brand
    const tempBrandData = {
      user_id: currentUser.id,
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
    localStorage.setItem('temp_brand_user_id', currentUser.id);

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