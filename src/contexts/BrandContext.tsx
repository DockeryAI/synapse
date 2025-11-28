/**
 * BrandContext
 * Manages current brand selection and brand-related data
 */

import * as React from 'react'

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

interface BrandContextValue {
  currentBrand: Brand | null
  brands: Brand[]
  loading: boolean
  error: Error | null
  setCurrentBrand: (brand: Brand) => void
  refreshBrands: () => Promise<void>
  refreshBrand: () => Promise<void>
}

const BrandContext = React.createContext<BrandContextValue | undefined>(undefined)

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

        if (error || !data) {
          console.warn('[BrandContext] ⚠️ Stored brand no longer exists in database, clearing localStorage')
          localStorage.removeItem('currentBrand')
          localStorage.removeItem('temp_brand_id')
          setCurrentBrandState(null)
        }
      } catch (err) {
        console.error('[BrandContext] Error validating stored brand:', err)
      }
    }

    validateStoredBrand()
  }, [])

  // Persist brand to localStorage when it changes
  const setCurrentBrand = React.useCallback((brand: Brand) => {
    setCurrentBrandState(brand)
    localStorage.setItem('currentBrand', JSON.stringify(brand))
    console.log('[BrandContext] Brand set and persisted:', brand.id)
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

  // Load brands on mount
  React.useEffect(() => {
    refreshBrands()
  }, [refreshBrands])

  const value: BrandContextValue = {
    currentBrand,
    brands,
    loading,
    error,
    setCurrentBrand,
    refreshBrands,
    refreshBrand
  }

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>
}

export const useBrand = (): BrandContextValue => {
  const context = React.useContext(BrandContext)
  if (!context) {
    throw new Error('useBrand must be used within a BrandProvider')
  }
  return context
}
