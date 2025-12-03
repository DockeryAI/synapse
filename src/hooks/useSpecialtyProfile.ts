/**
 * useSpecialtyProfile Hook
 *
 * Fetches specialty profile data for a brand, including enabledTabs configuration.
 * Used by V5ContentPage to dynamically show/hide tabs based on business profile type.
 *
 * Phase 6: Cross-Tab Integration
 *
 * @example
 * ```tsx
 * const { specialtyProfile, enabledTabs, loading } = useSpecialtyProfile(brandId);
 *
 * // Pass enabledTabs to InsightTabs
 * <InsightTabs enabledTabs={enabledTabs} ... />
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  SpecialtyProfileRow,
  BusinessProfileType,
  EnabledTabs
} from '@/types/specialty-profile.types';
import { getEnabledTabsForProfileType } from '@/types/specialty-profile.types';

// ============================================================================
// DEFAULT ENABLED TABS
// ============================================================================

const DEFAULT_ENABLED_TABS: EnabledTabs = {
  triggers: true,
  proof: true,
  trends: true,
  conversations: true,
  competitors: true,
  local: false,
  weather: false,
};

// ============================================================================
// TYPES
// ============================================================================

export interface UseSpecialtyProfileReturn {
  /** The specialty profile data (null if not found or loading) */
  specialtyProfile: SpecialtyProfileRow | null;

  /** Enabled tabs configuration (defaults if no profile) */
  enabledTabs: EnabledTabs;

  /** Business profile type (7 categories) */
  businessProfileType: BusinessProfileType | null;

  /** Is the profile being loaded */
  loading: boolean;

  /** Error message if one occurred */
  error: string | null;

  /** Refresh the profile data */
  refresh: () => Promise<void>;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Fetch specialty profile for a brand
 *
 * @param brandId - The brand ID to fetch profile for
 * @returns Specialty profile data with enabledTabs
 */
export function useSpecialtyProfile(brandId: string | undefined): UseSpecialtyProfileReturn {
  const [specialtyProfile, setSpecialtyProfile] = useState<SpecialtyProfileRow | null>(null);
  const [enabledTabs, setEnabledTabs] = useState<EnabledTabs>(DEFAULT_ENABLED_TABS);
  const [businessProfileType, setBusinessProfileType] = useState<BusinessProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch specialty profile from database
   * Phase 14: Try both direct brand_id lookup AND specialty_profile_id FK
   */
  const fetchProfile = useCallback(async () => {
    if (!brandId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Strategy 1: Direct lookup by brand_id (new implementation)
      const { data: directProfile, error: directError } = await supabase
        .from('specialty_profiles')
        .select('*')
        .eq('brand_id', brandId)
        .eq('generation_status', 'complete')
        .maybeSingle();

      if (!directError && directProfile) {
        console.log('[useSpecialtyProfile] Found profile via direct brand_id lookup');
        // Profile found - update state
        const typedProfile = directProfile as SpecialtyProfileRow;
        setSpecialtyProfile(typedProfile);

        // Set business profile type
        if (typedProfile.business_profile_type) {
          setBusinessProfileType(typedProfile.business_profile_type);
        }

        // Set enabledTabs from profile or derive from profile type
        if (typedProfile.enabled_tabs) {
          console.log('[useSpecialtyProfile] Using enabledTabs from profile:', typedProfile.enabled_tabs);
          setEnabledTabs(typedProfile.enabled_tabs);
        } else if (typedProfile.business_profile_type) {
          const derivedTabs = getEnabledTabsForProfileType(typedProfile.business_profile_type);
          console.log('[useSpecialtyProfile] Derived enabledTabs from profile type:', derivedTabs);
          setEnabledTabs(derivedTabs);
        }

        console.log('[useSpecialtyProfile] Loaded profile:', typedProfile.specialty_name);
        setLoading(false);
        return;
      }

      // Strategy 2 (fallback): Get brand's specialty_profile_id FK
      const { data: brand, error: brandError } = await supabase
        .from('brands')
        .select('specialty_profile_id')
        .eq('id', brandId)
        .single();

      if (brandError) {
        console.warn('[useSpecialtyProfile] Brand lookup error:', brandError.message);
        setLoading(false);
        return;
      }

      if (!brand?.specialty_profile_id) {
        console.log('[useSpecialtyProfile] No specialty profile linked to brand via FK');
        setLoading(false);
        return;
      }

      // Fetch the specialty profile via FK
      const { data: profile, error: profileError } = await supabase
        .from('specialty_profiles')
        .select('*')
        .eq('id', brand.specialty_profile_id)
        .single();

      if (profileError) {
        console.warn('[useSpecialtyProfile] Profile lookup error:', profileError.message);
        setError(profileError.message);
        setLoading(false);
        return;
      }

      if (!profile) {
        console.log('[useSpecialtyProfile] Specialty profile not found');
        setLoading(false);
        return;
      }

      // Profile found - update state
      const typedProfile = profile as SpecialtyProfileRow;
      setSpecialtyProfile(typedProfile);

      // Set business profile type
      if (typedProfile.business_profile_type) {
        setBusinessProfileType(typedProfile.business_profile_type);
      }

      // Set enabledTabs from profile or derive from profile type
      if (typedProfile.enabled_tabs) {
        console.log('[useSpecialtyProfile] Using enabledTabs from profile:', typedProfile.enabled_tabs);
        setEnabledTabs(typedProfile.enabled_tabs);
      } else if (typedProfile.business_profile_type) {
        // Derive from business profile type
        const derivedTabs = getEnabledTabsForProfileType(typedProfile.business_profile_type);
        console.log('[useSpecialtyProfile] Derived enabledTabs from profile type:', derivedTabs);
        setEnabledTabs(derivedTabs);
      }

      console.log('[useSpecialtyProfile] Loaded profile:', typedProfile.specialty_name);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[useSpecialtyProfile] Error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  // Fetch on mount and when brandId changes
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    specialtyProfile,
    enabledTabs,
    businessProfileType,
    loading,
    error,
    refresh: fetchProfile,
  };
}

/**
 * Get enabled tabs for a brand by ID (one-shot, not a hook)
 *
 * @param brandId - The brand ID
 * @returns EnabledTabs configuration
 */
export async function getEnabledTabsForBrand(brandId: string): Promise<EnabledTabs> {
  try {
    // Get brand's specialty_profile_id
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('specialty_profile_id')
      .eq('id', brandId)
      .single();

    if (brandError || !brand?.specialty_profile_id) {
      console.log('[getEnabledTabsForBrand] No specialty profile for brand, using defaults');
      return DEFAULT_ENABLED_TABS;
    }

    // Fetch specialty profile
    const { data: profile, error: profileError } = await supabase
      .from('specialty_profiles')
      .select('enabled_tabs, business_profile_type')
      .eq('id', brand.specialty_profile_id)
      .single();

    if (profileError || !profile) {
      console.log('[getEnabledTabsForBrand] Profile not found, using defaults');
      return DEFAULT_ENABLED_TABS;
    }

    // Return enabled_tabs from profile or derive from type
    if (profile.enabled_tabs) {
      return profile.enabled_tabs as EnabledTabs;
    }

    if (profile.business_profile_type) {
      return getEnabledTabsForProfileType(profile.business_profile_type as BusinessProfileType);
    }

    return DEFAULT_ENABLED_TABS;
  } catch (err) {
    console.error('[getEnabledTabsForBrand] Error:', err);
    return DEFAULT_ENABLED_TABS;
  }
}

export default useSpecialtyProfile;
