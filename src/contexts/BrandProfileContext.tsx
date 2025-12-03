/**
 * BrandProfileContext
 *
 * Manages brand profile data including:
 * - Business profile type (B2B, B2C, etc.)
 * - Geographic scope and regions
 * - Auto-detection vs manual override state
 * - Syncs with Supabase brand_profiles table
 *
 * Created: 2025-11-28
 */

import * as React from 'react';
import { useBrand } from '@/hooks/useBrand';
import { profileScannerService, type ProfileScanResult } from '@/services/intelligence/profile-scanner.service';
import type { BusinessProfileType } from '@/services/triggers';
import type { MarketGeography, CompleteUVP } from '@/types/uvp-flow.types';

// ============================================================================
// TYPES
// ============================================================================

export interface BrandProfile {
  id: string;
  brandId: string;
  customerType: 'b2b' | 'b2c' | 'b2b2c';
  geographicScope: 'local' | 'regional' | 'national' | 'global';
  headquarters?: string;
  primaryRegions: string[];
  focusMarkets: string[];
  profileType: BusinessProfileType;
  isAutoDetected: boolean;
  detectionSignals: ProfileDetectionSignal[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfileDetectionSignal {
  source: 'domain' | 'content' | 'uvp' | 'brand' | 'geo';
  type: string;
  value: string;
  confidence: number;
}

export interface BrandProfileContextValue {
  profile: BrandProfile | null;
  scanResult: ProfileScanResult | null;
  isLoading: boolean;
  isScanning: boolean;
  isAutoDetected: boolean;
  error: string | null;
  updateProfile: (updates: Partial<BrandProfile>) => Promise<void>;
  resetToAutoDetected: () => Promise<void>;
  refreshDetection: (uvp?: CompleteUVP) => Promise<void>;
}

// ============================================================================
// CONTEXT
// ============================================================================

// Export context for use in useBrandProfile.ts hook (separate file for HMR compatibility)
export const BrandProfileContext = React.createContext<BrandProfileContextValue | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

interface BrandProfileProviderProps {
  children: React.ReactNode;
}

export const BrandProfileProvider: React.FC<BrandProfileProviderProps> = ({ children }) => {
  const { currentBrand } = useBrand();
  const [profile, setProfile] = React.useState<BrandProfile | null>(null);
  const [scanResult, setScanResult] = React.useState<ProfileScanResult | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isScanning, setIsScanning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load profile from database when brand changes
  React.useEffect(() => {
    if (!currentBrand?.id) {
      setProfile(null);
      setScanResult(null);
      return;
    }

    loadProfile(currentBrand.id);
  }, [currentBrand?.id]);

  // Load profile from Supabase
  const loadProfile = async (brandId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { default: supabase } = await import('@/lib/supabase').then(m => ({ default: m.supabase }));
      const { data, error: fetchError } = await supabase
        .from('brand_profiles')
        .select('*')
        .eq('brand_id', brandId)
        .maybeSingle();

      if (fetchError) {
        // Handle missing table gracefully (PGRST205 = table not in schema cache)
        if (fetchError.code === '42P01' || fetchError.code === 'PGRST205' || fetchError.message?.includes('relation') || fetchError.message?.includes('brand_profiles')) {
          console.log('[BrandProfileContext] brand_profiles table not found - using auto-detection only');
          setProfile(null);
          setIsLoading(false);
          return;
        }
        console.error('[BrandProfileContext] Error loading profile:', fetchError);
        throw fetchError;
      }

      if (data) {
        setProfile(mapDbToProfile(data));
        console.log('[BrandProfileContext] Loaded profile for brand:', brandId);
      } else {
        // No profile exists yet - will be created on first scan
        setProfile(null);
        console.log('[BrandProfileContext] No profile found for brand:', brandId);
      }
    } catch (err) {
      // Gracefully handle missing table or network errors
      console.log('[BrandProfileContext] Profile load failed (using auto-detection):', err);
      setProfile(null);
      // Don't set error state for missing table - just use auto-detection
    } finally {
      setIsLoading(false);
    }
  };

  // Map database row to BrandProfile type
  const mapDbToProfile = (data: any): BrandProfile => ({
    id: data.id,
    brandId: data.brand_id,
    customerType: data.customer_type || 'b2b',
    geographicScope: data.geographic_scope || 'national',
    headquarters: data.headquarters,
    primaryRegions: data.primary_regions || [],
    focusMarkets: data.focus_markets || [],
    profileType: data.profile_type || 'national-saas-b2b',
    isAutoDetected: data.is_auto_detected ?? true,
    detectionSignals: data.detection_signals || [],
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  });

  // Update profile in database
  const updateProfile = async (updates: Partial<BrandProfile>): Promise<void> => {
    if (!currentBrand?.id) {
      throw new Error('No brand selected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const { default: supabase } = await import('@/lib/supabase').then(m => ({ default: m.supabase }));

      const dbUpdates: any = {
        brand_id: currentBrand.id,
        updated_at: new Date().toISOString()
      };

      // Map profile fields to database columns
      if (updates.customerType !== undefined) dbUpdates.customer_type = updates.customerType;
      if (updates.geographicScope !== undefined) dbUpdates.geographic_scope = updates.geographicScope;
      if (updates.headquarters !== undefined) dbUpdates.headquarters = updates.headquarters;
      if (updates.primaryRegions !== undefined) dbUpdates.primary_regions = updates.primaryRegions;
      if (updates.focusMarkets !== undefined) dbUpdates.focus_markets = updates.focusMarkets;
      if (updates.profileType !== undefined) dbUpdates.profile_type = updates.profileType;
      if (updates.isAutoDetected !== undefined) dbUpdates.is_auto_detected = updates.isAutoDetected;
      if (updates.detectionSignals !== undefined) dbUpdates.detection_signals = updates.detectionSignals;

      // Use upsert to create or update
      const { data, error: upsertError } = await supabase
        .from('brand_profiles')
        .upsert(dbUpdates, { onConflict: 'brand_id' })
        .select()
        .single();

      if (upsertError) {
        console.error('[BrandProfileContext] Error updating profile:', upsertError);
        throw upsertError;
      }

      setProfile(mapDbToProfile(data));
      console.log('[BrandProfileContext] Profile updated for brand:', currentBrand.id);
    } catch (err) {
      console.error('[BrandProfileContext] Failed to update profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Reset profile to auto-detected values
  const resetToAutoDetected = async (): Promise<void> => {
    if (!currentBrand?.id || !scanResult) {
      throw new Error('No scan result available');
    }

    await updateProfile({
      customerType: scanResult.profileAnalysis.customerType,
      geographicScope: scanResult.geography.scope,
      headquarters: scanResult.geography.headquarters,
      primaryRegions: scanResult.geography.primaryRegions || [],
      focusMarkets: scanResult.geography.focusMarkets || [],
      profileType: scanResult.profileType,
      isAutoDetected: true,
      detectionSignals: scanResult.signals
    });
  };

  // Refresh profile detection (re-scan)
  const refreshDetection = async (uvp?: CompleteUVP): Promise<void> => {
    if (!currentBrand?.id) {
      throw new Error('No brand selected');
    }

    setIsScanning(true);
    setError(null);

    try {
      // Clear cache and force refresh
      profileScannerService.clearCache(currentBrand.id);

      const result = await profileScannerService.scan(currentBrand.id, {
        url: currentBrand.website,
        uvp,
        brandData: currentBrand,
        forceRefresh: true
      });

      setScanResult(result);
      console.log('[BrandProfileContext] Profile scan complete:', result.profileType);

      // If auto-detected, update the profile
      if (!profile || profile.isAutoDetected) {
        await updateProfile({
          customerType: result.profileAnalysis.customerType,
          geographicScope: result.geography.scope,
          headquarters: result.geography.headquarters,
          primaryRegions: result.geography.primaryRegions || [],
          focusMarkets: result.geography.focusMarkets || [],
          profileType: result.profileType,
          isAutoDetected: true,
          detectionSignals: result.signals
        });
      }
    } catch (err) {
      console.error('[BrandProfileContext] Detection failed:', err);
      setError(err instanceof Error ? err.message : 'Detection failed');
      throw err;
    } finally {
      setIsScanning(false);
    }
  };

  // Phase 15: Memoize context value to prevent unnecessary re-renders
  const value = React.useMemo<BrandProfileContextValue>(() => ({
    profile,
    scanResult,
    isLoading,
    isScanning,
    isAutoDetected: profile?.isAutoDetected ?? true,
    error,
    updateProfile,
    resetToAutoDetected,
    refreshDetection
  }), [
    profile,
    scanResult,
    isLoading,
    isScanning,
    error,
    updateProfile,
    resetToAutoDetected,
    refreshDetection
  ]);

  return (
    <BrandProfileContext.Provider value={value}>
      {children}
    </BrandProfileContext.Provider>
  );
};

// NOTE: useBrandProfile hook has been moved to src/hooks/useBrandProfile.ts
// This separation is required for Vite HMR compatibility.
// .tsx files must only export React components for Fast Refresh to work.
// See: docs/PAGE_RESET_RESEARCH.md
