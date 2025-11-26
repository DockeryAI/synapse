/**
 * React Hook for Optimized API Data Loading
 * Implements Netflix/Spotify-style progressive loading with cache-first display
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { optimizedAPILoader } from '@/services/intelligence/optimized-api-loader.service.ts'
import { apiCache } from '@/services/intelligence/api-cache.service.ts'
import type { Brand } from '@/types'

interface APIDataState {
  // Phase tracking
  currentPhase: string
  phases: {
    name: string
    status: 'pending' | 'loading' | 'complete' | 'error'
    progress: number
    startTime?: number
    endTime?: number
  }[]

  // Data by API type
  data: Map<string, {
    value: any
    isStale: boolean
    timestamp: number
    loadTime?: number
  }>

  // Loading state
  isInitialLoad: boolean
  totalProgress: number
  loadedCount: number
  totalCount: number

  // Performance metrics
  metrics: {
    firstDataTime?: number
    fiftyPercentTime?: number
    ninetyPercentTime?: number
    completeTime?: number
    cacheHitRate?: number
  }

  // Error tracking
  errors: Map<string, Error>
}

interface UseOptimizedAPIDataOptions {
  // Enable/disable specific APIs
  enabledAPIs?: string[]
  // Auto-prefetch for next likely brand
  prefetchNext?: Brand
  // Callback when data updates
  onDataUpdate?: (apiType: string, data: any, isStale: boolean) => void
  // Callback on phase complete
  onPhaseComplete?: (phaseName: string) => void
  // Callback on load complete
  onLoadComplete?: (metrics: any) => void
}

export function useOptimizedAPIData(
  brand: Brand | null,
  options: UseOptimizedAPIDataOptions = {}
) {
  const [state, setState] = useState<APIDataState>({
    currentPhase: 'idle',
    phases: [],
    data: new Map(),
    isInitialLoad: true,
    totalProgress: 0,
    loadedCount: 0,
    totalCount: 0,
    metrics: {},
    errors: new Map()
  })

  const loadingRef = useRef(false)
  const brandRef = useRef<Brand | null>(null)

  // Load data when brand changes
  useEffect(() => {
    if (!brand || brand === brandRef.current) return
    if (loadingRef.current) return

    brandRef.current = brand
    loadingRef.current = true

    // Reset state for new brand
    setState(prev => ({
      ...prev,
      currentPhase: 'loading',
      phases: [],
      data: new Map(),
      isInitialLoad: true,
      totalProgress: 0,
      loadedCount: 0,
      totalCount: 0,
      metrics: {},
      errors: new Map()
    }))

    // Start optimized loading
    loadData(brand)

    return () => {
      // Cleanup listeners
      optimizedAPILoader.removeAllListeners()
    }
  }, [brand])

  // Prefetch next brand data
  useEffect(() => {
    if (options.prefetchNext) {
      optimizedAPILoader.prefetchForBrand(options.prefetchNext)
    }
  }, [options.prefetchNext])

  const loadData = async (brand: Brand) => {
    console.log('[useOptimizedAPIData] Starting load for:', brand.name)

    // Set up event listeners
    optimizedAPILoader.on('cache-loaded', handleCacheLoaded)
    optimizedAPILoader.on('phase-start', handlePhaseStart)
    optimizedAPILoader.on('phase-complete', handlePhaseComplete)
    optimizedAPILoader.on('api-update', handleAPIUpdate)
    optimizedAPILoader.on('progress', handleProgress)
    optimizedAPILoader.on('load-complete', handleLoadComplete)
    optimizedAPILoader.on('phase-error', handlePhaseError)

    try {
      // Start optimized loading
      await optimizedAPILoader.loadDataOptimized(brand)
    } catch (error) {
      console.error('[useOptimizedAPIData] Load failed:', error)
      setState(prev => ({
        ...prev,
        currentPhase: 'error',
        errors: new Map(prev.errors).set('global', error as Error)
      }))
    } finally {
      loadingRef.current = false
    }
  }

  // Event handlers
  const handleCacheLoaded = useCallback((event: any) => {
    console.log('[useOptimizedAPIData] Cache loaded:', event.type)

    setState(prev => {
      const newData = new Map(prev.data)
      newData.set(event.type, {
        value: event.data,
        isStale: event.isStale,
        timestamp: event.timestamp
      })

      return {
        ...prev,
        data: newData,
        isInitialLoad: false // We have some data now
      }
    })
  }, [])

  const handlePhaseStart = useCallback((event: any) => {
    console.log('[useOptimizedAPIData] Phase started:', event.name)

    setState(prev => ({
      ...prev,
      currentPhase: event.name,
      phases: [
        ...prev.phases.filter(p => p.name !== event.name),
        {
          name: event.name,
          status: 'loading',
          progress: 0,
          startTime: performance.now()
        }
      ]
    }))
  }, [])

  const handlePhaseComplete = useCallback((event: any) => {
    console.log('[useOptimizedAPIData] Phase complete:', event.name)

    setState(prev => ({
      ...prev,
      phases: prev.phases.map(p =>
        p.name === event.name
          ? {
              ...p,
              status: 'complete',
              progress: 100,
              endTime: performance.now()
            }
          : p
      )
    }))

    options.onPhaseComplete?.(event.name)
  }, [options])

  const handleAPIUpdate = useCallback((event: any) => {
    console.log('[useOptimizedAPIData] API update:', event.type, 'stale:', event.isStale)

    setState(prev => {
      const newData = new Map(prev.data)
      newData.set(event.type, {
        value: event.data,
        isStale: event.isStale,
        timestamp: event.timestamp,
        loadTime: performance.now()
      })

      return {
        ...prev,
        data: newData
      }
    })

    options.onDataUpdate?.(event.type, event.data, event.isStale)
  }, [options])

  const handleProgress = useCallback((event: any) => {
    setState(prev => ({
      ...prev,
      totalProgress: event.totalProgress,
      loadedCount: event.loaded,
      totalCount: event.total,
      phases: prev.phases.map(p =>
        p.name === event.phase
          ? { ...p, progress: event.phaseProgress }
          : p
      )
    }))
  }, [])

  const handleLoadComplete = useCallback((event: any) => {
    console.log('[useOptimizedAPIData] Load complete:', event.metrics)

    setState(prev => ({
      ...prev,
      currentPhase: 'complete',
      metrics: event.metrics.summary
    }))

    options.onLoadComplete?.(event.metrics)
  }, [options])

  const handlePhaseError = useCallback((event: any) => {
    console.error('[useOptimizedAPIData] Phase error:', event)

    setState(prev => ({
      ...prev,
      phases: prev.phases.map(p =>
        p.name === event.name
          ? { ...p, status: 'error' }
          : p
      ),
      errors: new Map(prev.errors).set(event.name, event.error)
    }))
  }, [])

  // Helper functions
  const getAPIData = useCallback((apiType: string) => {
    return state.data.get(apiType)
  }, [state.data])

  const refreshAPI = useCallback(async (apiType: string) => {
    if (!brand) return

    const cacheKey = apiCache.generateKey(apiType, {
      brand: brand.name,
      industry: brand.industry?.code
    })

    // Force refresh
    await apiCache.getWithSWR(
      cacheKey,
      () => optimizedAPILoader['fetchAPIData'](apiType, brand),
      {
        forceRefresh: true,
        onFresh: (data) => {
          handleAPIUpdate({
            type: apiType,
            data,
            isStale: false,
            timestamp: Date.now()
          })
        }
      }
    )
  }, [brand, handleAPIUpdate])

  const clearCache = useCallback(() => {
    apiCache.clear()
    setState(prev => ({
      ...prev,
      data: new Map()
    }))
  }, [])

  const getCacheStats = useCallback(() => {
    return apiCache.getStats()
  }, [])

  return {
    // State
    ...state,

    // Loading states
    isLoading: state.currentPhase === 'loading',
    hasData: state.data.size > 0,
    isComplete: state.currentPhase === 'complete',
    hasError: state.errors.size > 0,

    // Phase status
    phaseStatus: {
      cache: state.phases.find(p => p.name === 'cache')?.status || 'pending',
      critical: state.phases.find(p => p.name === 'critical-context')?.status || 'pending',
      psychological: state.phases.find(p => p.name === 'psychological-triggers')?.status || 'pending',
      analysis: state.phases.find(p => p.name === 'deep-analysis')?.status || 'pending',
      industry: state.phases.find(p => p.name === 'industry-specific')?.status || 'pending'
    },

    // Helper methods
    getAPIData,
    refreshAPI,
    clearCache,
    getCacheStats,

    // Typed data accessors
    searchData: getAPIData('serper-search')?.value,
    youtubeData: getAPIData('youtube-trending')?.value,
    seoData: getAPIData('semrush-keywords')?.value,
    reviewData: getAPIData('outscraper-reviews')?.value,
    twitterData: getAPIData('apify-twitter')?.value,
    quoraData: getAPIData('apify-quora')?.value,
    linkedinData: getAPIData('linkedin-company')?.value,
    weatherData: getAPIData('weather-current')?.value,
    perplexityData: getAPIData('perplexity-research')?.value
  }
}

// Hook for monitoring performance
export function useAPILoadingMetrics() {
  const [metrics, setMetrics] = useState({
    firstPaint: 0,
    firstDataTime: 0,
    fiftyPercentTime: 0,
    ninetyPercentTime: 0,
    completeTime: 0,
    phaseTimings: new Map<string, number>(),
    apiTimings: new Map<string, number>(),
    cacheStats: {
      entries: 0,
      hitRate: 0,
      staleRate: 0,
      totalSize: 0
    }
  })

  useEffect(() => {
    // Track first paint
    if (typeof window !== 'undefined' && window.performance) {
      const paintEntries = performance.getEntriesByType('paint')
      const fcp = paintEntries.find(e => e.name === 'first-contentful-paint')
      if (fcp) {
        setMetrics(prev => ({ ...prev, firstPaint: fcp.startTime }))
      }
    }

    // Listen for load metrics
    const handleLoadComplete = (event: any) => {
      setMetrics(prev => ({
        ...prev,
        ...event.metrics.summary,
        phaseTimings: event.metrics.phaseEndTimes,
        apiTimings: event.metrics.apiLoadTimes,
        cacheStats: apiCache.getStats()
      }))
    }

    optimizedAPILoader.on('load-complete', handleLoadComplete)

    // Update cache stats periodically
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        cacheStats: apiCache.getStats()
      }))
    }, 5000)

    return () => {
      optimizedAPILoader.off('load-complete', handleLoadComplete)
      clearInterval(interval)
    }
  }, [])

  return metrics
}