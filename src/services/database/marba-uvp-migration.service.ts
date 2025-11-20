/**
 * MARBA UVP Migration Service
 *
 * Handles migration of UVP data from localStorage to database
 * after user completes signup/login during onboarding.
 */

import { supabase } from '@/lib/supabase';
import { saveCompleteUVP } from './marba-uvp.service';
import type { CompleteUVP } from '@/types/uvp-flow.types';

/**
 * Check if there's pending UVP data in localStorage
 */
export function hasPendingUVP(): boolean {
  return localStorage.getItem('marba_uvp_pending') === 'true';
}

/**
 * Get pending UVP data from localStorage
 */
export function getPendingUVP(): CompleteUVP | null {
  const sessionId = localStorage.getItem('marba_session_id');
  if (!sessionId) return null;

  const uvpData = localStorage.getItem(`marba_uvp_${sessionId}`);
  if (!uvpData) return null;

  try {
    return JSON.parse(uvpData) as CompleteUVP;
  } catch {
    return null;
  }
}

/**
 * Migrate pending UVP from localStorage to database
 */
export async function migratePendingUVP(brandId: string): Promise<boolean> {
  console.log('[UVP Migration] Checking for pending UVP data...');

  if (!hasPendingUVP()) {
    console.log('[UVP Migration] No pending UVP data found');
    return false;
  }

  const pendingUVP = getPendingUVP();
  if (!pendingUVP) {
    console.log('[UVP Migration] Failed to retrieve pending UVP data');
    clearPendingUVP();
    return false;
  }

  console.log('[UVP Migration] Found pending UVP, migrating to brand:', brandId);

  // Save to database with real brand ID
  const result = await saveCompleteUVP(pendingUVP, brandId);

  if (result.success) {
    console.log('[UVP Migration] Successfully migrated UVP to database');
    clearPendingUVP();
    return true;
  } else {
    console.error('[UVP Migration] Failed to migrate UVP:', result.error);
    return false;
  }
}

/**
 * Clear pending UVP data from localStorage
 */
export function clearPendingUVP(): void {
  const sessionId = localStorage.getItem('marba_session_id');

  if (sessionId) {
    localStorage.removeItem(`marba_uvp_${sessionId}`);
  }

  localStorage.removeItem('marba_uvp_pending');
  localStorage.removeItem('marba_session_id');
  localStorage.removeItem('temp_brand_id');
  localStorage.removeItem('temp_brand_user_id');

  console.log('[UVP Migration] Cleared pending UVP data');
}

/**
 * Hook to be called after successful authentication
 * Automatically migrates pending UVP if present
 */
export async function onAuthSuccess(userId: string, brandId?: string): Promise<void> {
  console.log('[UVP Migration] Auth success hook triggered');

  // If we have a brand ID, try to migrate
  if (brandId) {
    await migratePendingUVP(brandId);
  } else {
    // Try to get user's first brand
    const { data: brands } = await supabase
      .from('brands')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (brands && brands.length > 0) {
      await migratePendingUVP(brands[0].id);
    } else {
      console.log('[UVP Migration] No brand found for user, will migrate later');
    }
  }
}