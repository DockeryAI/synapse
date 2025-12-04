/**
 * MARBA UVP Migration Service
 *
 * Handles migration of UVP data from localStorage to database
 * after user completes signup/login during onboarding.
 */

import { supabase } from '@/lib/supabase';
import { saveCompleteUVP } from './marba-uvp.service';
import { OnboardingV5DataService } from '@/services/supabase/onboarding-v5-data.service';
import type { CompleteUVP } from '@/types/uvp-flow.types';
import type { BuyerPersona } from '@/types/buyer-persona.types';

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
 * Check if there's pending buyer personas in localStorage
 */
export function hasPendingBuyerPersonas(): boolean {
  const sessionId = localStorage.getItem('marba_session_id');
  if (!sessionId) return false;
  return localStorage.getItem(`marba_buyer_personas_${sessionId}`) !== null;
}

/**
 * Get pending buyer personas from localStorage
 */
export function getPendingBuyerPersonas(): BuyerPersona[] | null {
  const sessionId = localStorage.getItem('marba_session_id');
  if (!sessionId) return null;

  const personasData = localStorage.getItem(`marba_buyer_personas_${sessionId}`);
  if (!personasData) return null;

  try {
    return JSON.parse(personasData) as BuyerPersona[];
  } catch {
    return null;
  }
}

/**
 * Save buyer personas to localStorage during onboarding
 */
export function savePendingBuyerPersonas(personas: BuyerPersona[]): void {
  const sessionId = localStorage.getItem('marba_session_id') || crypto.randomUUID();
  localStorage.setItem('marba_session_id', sessionId);
  localStorage.setItem(`marba_buyer_personas_${sessionId}`, JSON.stringify(personas));
  console.log('[UVP Migration] Saved buyer personas to localStorage:', personas.length);
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

  if (!result.success) {
    console.error('[UVP Migration] Failed to migrate UVP:', result.error);
    return false;
  }

  console.log('[UVP Migration] Successfully migrated UVP to database');

  // Also migrate buyer personas if they exist
  if (hasPendingBuyerPersonas()) {
    const pendingPersonas = getPendingBuyerPersonas();
    if (pendingPersonas && pendingPersonas.length > 0) {
      console.log('[UVP Migration] Found pending buyer personas, migrating:', pendingPersonas.length);

      try {
        await OnboardingV5DataService.saveBuyerPersonas(brandId, pendingPersonas);
        console.log('[UVP Migration] Successfully migrated buyer personas to database');
      } catch (error) {
        console.error('[UVP Migration] Failed to migrate buyer personas:', error);
        // Don't fail the entire migration if personas fail - UVP is more critical
      }
    } else {
      console.log('[UVP Migration] No valid buyer personas to migrate');
    }
  } else {
    console.log('[UVP Migration] No pending buyer personas found');
  }

  clearPendingUVP();
  return true;
}

/**
 * Clear pending UVP data from localStorage
 */
export function clearPendingUVP(): void {
  const sessionId = localStorage.getItem('marba_session_id');

  if (sessionId) {
    localStorage.removeItem(`marba_uvp_${sessionId}`);
    localStorage.removeItem(`marba_buyer_personas_${sessionId}`);
  }

  localStorage.removeItem('marba_uvp_pending');
  localStorage.removeItem('marba_session_id');
  localStorage.removeItem('temp_brand_id');
  localStorage.removeItem('temp_brand_user_id');

  console.log('[UVP Migration] Cleared pending UVP and buyer personas data');
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