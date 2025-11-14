/**
 * MirrorContext
 * Manages MIRROR framework state and data flow between sections
 */

import * as React from 'react'
import { useBrand } from './BrandContext'

// Section data types
export interface MeasureData {
  brandHealth?: number
  industry?: string
  currentMetrics?: Record<string, number>
  marketPosition?: any
  competitiveLandscape?: any
  assets?: any
}

export interface IntendData {
  goals?: any[]
  objectives?: any[]
  targets?: any[]
}

export interface ReimagineData {
  brandStrategy?: any
  audienceStrategy?: any
  contentStrategy?: any
  competitiveStrategy?: any
  uvps?: any[]
}

export interface ReachData {
  channels?: any[]
  campaigns?: any[]
  tactics?: any[]
}

export interface OptimizeData {
  actions?: any[]
  timeline?: any
  priorities?: any[]
}

export interface ReflectData {
  kpis?: any[]
  insights?: any[]
  recommendations?: any[]
}

export interface MirrorState {
  measure: MeasureData
  intend: IntendData
  reimagine: ReimagineData
  reach: ReachData
  optimize: OptimizeData
  reflect: ReflectData
  lastSaved?: string
  isDirty: boolean
}

interface MirrorContextValue {
  state: MirrorState
  updateMeasure: (data: Partial<MeasureData>) => void
  updateIntend: (data: Partial<IntendData>) => void
  updateReimagine: (data: Partial<ReimagineData>) => void
  updateReach: (data: Partial<ReachData>) => void
  updateOptimize: (data: Partial<OptimizeData>) => void
  updateReflect: (data: Partial<ReflectData>) => void
  saveToServer: () => Promise<void>
  loadFromServer: (brandId: string) => Promise<void>
  reset: () => void
  loading: boolean
  error: Error | null
}

const MirrorContext = React.createContext<MirrorContextValue | undefined>(undefined)

const initialState: MirrorState = {
  measure: {},
  intend: {},
  reimagine: {},
  reach: {},
  optimize: {},
  reflect: {},
  isDirty: false
}

interface MirrorProviderProps {
  children: React.ReactNode
  brandId?: string
}

export const MirrorProvider: React.FC<MirrorProviderProps> = ({
  children,
  brandId: brandIdProp
}) => {
  const [state, setState] = React.useState<MirrorState>(initialState)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  // Get brandId from BrandContext if not provided as prop
  const { currentBrand } = useBrand()
  const brandId = brandIdProp || currentBrand?.id

  // Auto-save debounced
  const saveTimeoutRef = React.useRef<NodeJS.Timeout>()

  const updateSection = React.useCallback((
    section: keyof Omit<MirrorState, 'lastSaved' | 'isDirty'>,
    data: any
  ) => {
    setState(prev => {
      const newState = {
        ...prev,
        [section]: { ...prev[section], ...data },
        isDirty: true
      }

      // Trigger session auto-save with updated state
      // Note: We'll import SessionService dynamically to avoid circular deps
      import('@/services/session/session.service').then(({ SessionService }) => {
        if (brandId && currentBrand) {
          const urlSlug = SessionService.generateUrlSlug(currentBrand.name)
          SessionService.saveSession({
            brandId,
            sessionName: currentBrand.name,
            urlSlug,
            mirrorState: newState,
          })
        }
      })

      return newState
    })

    // Debounced auto-save to mirror_sections table
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveToServer()
    }, 2000)
  }, [brandId, currentBrand])

  const updateMeasure = React.useCallback((data: Partial<MeasureData>) => {
    updateSection('measure', data)
  }, [updateSection])

  const updateIntend = React.useCallback((data: Partial<IntendData>) => {
    updateSection('intend', data)
  }, [updateSection])

  const updateReimagine = React.useCallback((data: Partial<ReimagineData>) => {
    updateSection('reimagine', data)
  }, [updateSection])

  const updateReach = React.useCallback((data: Partial<ReachData>) => {
    updateSection('reach', data)
  }, [updateSection])

  const updateOptimize = React.useCallback((data: Partial<OptimizeData>) => {
    updateSection('optimize', data)
  }, [updateSection])

  const updateReflect = React.useCallback((data: Partial<ReflectData>) => {
    updateSection('reflect', data)
  }, [updateSection])

  const saveToServer = React.useCallback(async () => {
    if (!brandId) return

    try {
      setLoading(true)
      setError(null)

      console.log('[MirrorContext] Saving MIRROR state for brand:', brandId)

      // Save each section to Supabase
      const { supabase } = await import('@/lib/supabase')

      const sections = ['measure', 'intend', 'reimagine', 'reach', 'optimize', 'reflect']
      const savePromises = sections.map(async (section) => {
        const sectionKey = section as keyof Omit<MirrorState, 'lastSaved' | 'isDirty'>
        const sectionData = state[sectionKey]

        if (!sectionData || Object.keys(sectionData).length === 0) {
          console.log(`[MirrorContext] Skipping empty section: ${section}`)
          return
        }

        console.log(`[MirrorContext] Saving section: ${section}`, Object.keys(sectionData))

        const { error } = await supabase
          .from('mirror_sections')
          .upsert({
            brand_id: brandId,
            section: section,
            data: sectionData,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'brand_id,section'
          })

        if (error) {
          console.error(`[MirrorContext] Error saving ${section}:`, error)
          throw error
        }
      })

      await Promise.all(savePromises)
      console.log('[MirrorContext] All sections saved successfully')

      setState(prev => ({
        ...prev,
        lastSaved: new Date().toISOString(),
        isDirty: false
      }))
    } catch (err) {
      console.error('[MirrorContext] Save error:', err)
      setError(err instanceof Error ? err : new Error('Failed to save'))
    } finally {
      setLoading(false)
    }
  }, [brandId, state])

  const loadFromServer = React.useCallback(async (loadBrandId: string) => {
    try {
      setLoading(true)
      setError(null)

      // Load MIRROR sections from Supabase
      const { supabase } = await import('@/lib/supabase')
      const { data: sections, error: fetchError } = await supabase
        .from('mirror_sections')
        .select('section, data')
        .eq('brand_id', loadBrandId)

      if (fetchError) {
        console.error('Error loading MIRROR sections:', fetchError)
        throw fetchError
      }

      if (sections && sections.length > 0) {
        // Transform sections array into state object
        const loadedState: Partial<MirrorState> = {}
        sections.forEach(s => {
          if (s.section && s.data) {
            loadedState[s.section as keyof MirrorState] = s.data
          }
        })

        console.log('Loaded MIRROR state for brand:', loadBrandId, loadedState)

        setState(prev => ({
          ...initialState,
          ...loadedState,
          lastSaved: new Date().toISOString(),
          isDirty: false
        }))
      } else {
        console.log('No MIRROR sections found for brand:', loadBrandId)
      }
    } catch (err) {
      console.error('Failed to load MIRROR data:', err)
      setError(err instanceof Error ? err : new Error('Failed to load'))
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = React.useCallback(() => {
    setState(initialState)
  }, [])

  // Load data on mount if brandId provided
  React.useEffect(() => {
    if (brandId) {
      console.log('[MirrorProvider] Loading MIRROR data for brand:', brandId)
      loadFromServer(brandId)
    } else {
      console.log('[MirrorProvider] No brandId available yet')
    }
  }, [brandId, loadFromServer])

  // Cleanup auto-save timeout
  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const value: MirrorContextValue = {
    state,
    updateMeasure,
    updateIntend,
    updateReimagine,
    updateReach,
    updateOptimize,
    updateReflect,
    saveToServer,
    loadFromServer,
    reset,
    loading,
    error
  }

  return <MirrorContext.Provider value={value}>{children}</MirrorContext.Provider>
}

export const useMirror = (): MirrorContextValue => {
  const context = React.useContext(MirrorContext)
  if (!context) {
    throw new Error('useMirror must be used within a MirrorProvider')
  }
  return context
}
