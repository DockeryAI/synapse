/**
 * BrandContext
 * Manages current brand selection and brand-related data
 *
 * STREAMING ARCHITECTURE:
 * When a brand is selected, we immediately start prefetching API data
 * in the background. This means triggers and intelligence data is ready
 * by the time the user reaches the dashboard.
 *
 * EARLY TRIGGER LOADING (Phase 8.7):
 * Trigger discovery can start as soon as Target Customer section is populated.
 * The earlyTriggerLoaderService emits events that the streaming manager
 * can listen to for starting profile-specific API queries in parallel.
 */

import * as React from 'react'
import { streamingApiManager } from '@/services/intelligence/streaming-api-manager'
import { earlyTriggerLoaderService } from '@/services/triggers/early-trigger-loader.service'
import type { CustomerProfile, ProductServiceData, CompleteUVP } from '@/types/uvp-flow.types'

export interface Brand {
  id: string
  name: string
  industry: string
  naicsCode?: string  // NAICS code for industry-specific API selection
  description?: string
  logo_url?: string
  website?: string
  location?: string   // Used for weather API
  founded?: string
  size?: string
  created_at?: string
  updated_at?: string
}

export interface BrandContextValue {
  currentBrand: Brand | null
  brands: Brand[]
  loading: boolean
  error: Error | null
  setCurrentBrand: (brand: Brand) => void
  refreshBrands: () => Promise<void>
  refreshBrand: () => Promise<void>
  // Early trigger loading hooks
  notifyTargetCustomerReady: (customer: CustomerProfile) => void
  notifyProductsReady: (products: ProductServiceData, customer?: CustomerProfile | null) => void
  notifyFullUVPReady: (uvp: CompleteUVP) => void
}

// Export context for use in useBrand.ts hook (separate file for HMR compatibility)
export const BrandContext = React.createContext<BrandContextValue | undefined>(undefined)

interface BrandProviderProps {
  children: React.ReactNode
  initialBrand?: Brand
}

export const BrandProvider: React.FC<BrandProviderProps> = ({
  children,
  initialBrand
}) => {
  // Load brand from localStorage on mount
  const [currentBrand, setCurrentBrandState] = React.useState<Brand | null>(() => {
    if (initialBrand) {
      console.log('[BrandContext] Using initialBrand:', initialBrand.id)
      return initialBrand
    }
    const stored = localStorage.getItem('currentBrand')
    if (stored) {
      const brand = JSON.parse(stored)
      console.log('[BrandContext] Loaded brand from localStorage:', brand.id)
      return brand
    }
    console.log('[BrandContext] No brand in localStorage')
    return null
  })
  const [brands, setBrands] = React.useState<Brand[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  // Validate localStorage brand exists in database on mount
  React.useEffect(() => {
    const validateStoredBrand = async () => {
      const stored = localStorage.getItem('currentBrand')
      if (!stored) return

      try {
        const brand = JSON.parse(stored)
        const { default: supabase } = await import('@/lib/supabase').then(m => ({ default: m.supabase }))
        const { data, error } = await supabase
          .from('brands')
          .select('id')
          .eq('id', brand.id)
          .maybeSingle()

        // Only clear if we got a successful response with no data
        // Don't clear on error - could be transient network/DB issue
        if (!error && !data) {
          console.warn('[BrandContext] ⚠️ Stored brand no longer exists in database, clearing localStorage')
          localStorage.removeItem('currentBrand')
          localStorage.removeItem('temp_brand_id')
          setCurrentBrandState(null)
        } else if (error) {
          console.warn('[BrandContext] DB error during validation (keeping brand):', error.message)
        }
      } catch (err) {
        // Network error - don't clear brand, just log
        console.warn('[BrandContext] Network error validating brand (keeping brand):', err)
      }
    }

    validateStoredBrand()
  }, [])

  // Persist brand to localStorage when it changes
  const setCurrentBrand = React.useCallback((brand: Brand) => {
    setCurrentBrandState(brand)
    localStorage.setItem('currentBrand', JSON.stringify(brand))
    console.log('[BrandContext] Brand set and persisted:', brand.id)

    // PROOF PREFETCH: Start early proof collection at brand selection (Phase 3.1)
    // This is the earliest point in UVP flow - we have brand ID and URL
    // Website testimonials + Google Reviews can start immediately
    console.log('[BrandContext] 🔍 Proof prefetch ready for:', brand.id)

    // Check if we have cached proof data first
    const cachedProofKey = `proofDevPage_deepContext_v1`
    const cachedProof = localStorage.getItem(cachedProofKey)
    if (cachedProof) {
      console.log('[BrandContext] ✅ Found cached proof data')
    } else {
      console.log('[BrandContext] No cached proof - will load when streaming enabled')
      // Note: Actual API calls are gated by user action (streaming toggle in ProofDevPage)
      // This hook-in point allows the streaming manager to start proof APIs early
      // when we implement full auto-prefetch
    }

    // PREFETCH DISABLED: Enable when streaming architecture is fully tested
    // The TriggersDevPage has a "Start Streaming" button to manually trigger API loads
    // console.log('[BrandContext] 🚀 Starting background prefetch for triggers...')
    // streamingApiManager.loadAllApis(brand.id, brand).catch(err => {
    //   console.warn('[BrandContext] Background prefetch error (will retry later):', err.message)
    // })
  }, [])

  const refreshBrands = React.useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch brands from Supabase
      const { default: supabase } = await import('@/lib/supabase').then(m => ({ default: m.supabase }))
      const { data, error: fetchError } = await supabase
        .from('brands')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (fetchError) {
        console.error('[BrandContext] Error fetching brands:', fetchError)
        throw fetchError
      }

      console.log('[BrandContext] Loaded', data?.length || 0, 'brands from database')
      setBrands((data as Brand[]) || [])

      // If we have brands but no currentBrand, select the most recent one
      if (data && data.length > 0 && !currentBrand) {
        const mostRecent = data[0] as Brand
        console.log('[BrandContext] Auto-selecting most recent brand:', mostRecent.id)
        setCurrentBrand(mostRecent)
      }
    } catch (err) {
      console.error('[BrandContext] Failed to load brands:', err)
      setError(err instanceof Error ? err : new Error('Failed to load brands'))
      setBrands([])
    } finally {
      setLoading(false)
    }
  }, [currentBrand, setCurrentBrand])

  const refreshBrand = React.useCallback(async () => {
    if (!currentBrand?.id) return

    try {
      const { default: supabase } = await import('@/lib/supabase').then(m => ({ default: m.supabase }))
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('id', currentBrand.id)
        .single()

      if (error) throw error
      if (data) {
        setCurrentBrand(data as Brand)
      }
    } catch (err) {
      console.error('[BrandContext] Failed to refresh brand:', err)
    }
  }, [currentBrand?.id, setCurrentBrand])

  // ============================================================================
  // EARLY TRIGGER LOADING (Phase 8.7)
  // These callbacks notify the early trigger loader when UVP data becomes available
  // ============================================================================

  /**
   * Called when Target Customer section is completed in UVP flow
   * This is the EARLIEST point we can start trigger discovery
   */
  const notifyTargetCustomerReady = React.useCallback((customer: CustomerProfile) => {
    if (!currentBrand?.id) {
      console.log('[BrandContext] Cannot start early loading - no brand selected')
      return
    }

    console.log('[BrandContext] 🎯 Target customer ready - starting early trigger discovery')

    earlyTriggerLoaderService.onTargetCustomerAvailable(
      customer,
      currentBrand.id,
      {
        targetCustomer: customer,
        businessName: currentBrand.name,
        industry: currentBrand.industry,
        naicsCode: currentBrand.naicsCode
      }
    )
  }, [currentBrand])

  /**
   * Called when Products/Services section is completed
   * Refines the profile detection for better query targeting
   */
  const notifyProductsReady = React.useCallback((products: ProductServiceData, customer?: CustomerProfile | null) => {
    console.log('[BrandContext] 📦 Products/services ready - refining profile detection')

    earlyTriggerLoaderService.onProductsServicesAvailable(products, customer)

    // PROOF PHASE 3.2: Refine at Business Type Detection
    // When business type becomes known from products/services:
    // 1. Detect profile type from business info
    // 2. Fire profile-specific proof APIs
    // 3. Update proof consolidation with profile weighting
    console.log('[BrandContext] 🔍 Business type detected - proof API gating ready')

    // Store profile info for proof page
    try {
      const profileInfo = {
        products,
        customer,
        timestamp: Date.now()
      }
      localStorage.setItem('proofDevPage_profile_v1', JSON.stringify(profileInfo))
    } catch (e) {
      console.warn('[BrandContext] Failed to cache profile for proof')
    }
  }, [])

  /**
   * Called when full UVP is synthesized
   * Final refinement and triggers ready for display
   */
  const notifyFullUVPReady = React.useCallback((uvp: CompleteUVP) => {
    if (!currentBrand?.id) {
      console.log('[BrandContext] Cannot notify full UVP - no brand selected')
      return
    }

    console.log('[BrandContext] ✅ Full UVP ready - finalizing trigger queries')

    earlyTriggerLoaderService.onFullUVPAvailable(uvp, currentBrand.id)

    // PROOF PHASE 3.3: Final scoring at UVP complete
    // When full UVP is available, we can:
    // 1. Re-score proof against UVP claims
    // 2. Match proof to specific differentiators
    // 3. Flag proof that validates UVP statements
    console.log('[BrandContext] 🔍 Full UVP ready - proof alignment scoring enabled')

    // Store UVP in localStorage for proof page to use
    try {
      localStorage.setItem('proofDevPage_uvp_v1', JSON.stringify(uvp))
    } catch (e) {
      console.warn('[BrandContext] Failed to cache UVP for proof')
    }
  }, [currentBrand])

  // Reset early loader and streaming manager when brand changes
  React.useEffect(() => {
    if (currentBrand?.id) {
      earlyTriggerLoaderService.reset()
      streamingApiManager.resetEarlyLoading()
    }
  }, [currentBrand?.id])

  // Load brands on mount
  React.useEffect(() => {
    refreshBrands()
  }, [refreshBrands])

  // Phase 15: Memoize context value to prevent unnecessary re-renders
  const value = React.useMemo<BrandContextValue>(() => ({
    currentBrand,
    brands,
    loading,
    error,
    setCurrentBrand,
    refreshBrands,
    refreshBrand,
    // Early trigger loading hooks
    notifyTargetCustomerReady,
    notifyProductsReady,
    notifyFullUVPReady
  }), [
    currentBrand,
    brands,
    loading,
    error,
    setCurrentBrand,
    refreshBrands,
    refreshBrand,
    notifyTargetCustomerReady,
    notifyProductsReady,
    notifyFullUVPReady
  ])

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>
}

// NOTE: useBrand hook has been moved to src/hooks/useBrand.ts
// This separation is required for Vite HMR compatibility.
// .tsx files must only export React components for Fast Refresh to work.
// See: docs/PAGE_RESET_RESEARCH.md
