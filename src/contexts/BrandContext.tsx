/**
 * BrandContext
 * Manages current brand selection and brand-related data
 */

import * as React from 'react'

export interface Brand {
  id: string
  name: string
  industry: string
  description?: string
  logo_url?: string
  website?: string
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
      // TODO: Fetch brands from Supabase
      // const { data, error } = await supabase
      //   .from('brands')
      //   .select('*')
      //   .order('name')
      // if (error) throw error
      // setBrands(data || [])

      throw new Error('Supabase connection not configured. Please set up Supabase to load brands.')
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load brands'))
      setBrands([])
    } finally {
      setLoading(false)
    }
  }, [])

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
