/**
 * Optimized API Loader Service
 * Implements Netflix/Spotify-style progressive loading architecture
 * with cache-first display and phased API execution
 */

import { EventEmitter } from 'events'
import { apiCache } from './api-cache.service.ts'
import { concurrencyLimiter, Priority } from './concurrency-limiter.service.ts'
import { industryApiSelector } from './industry-api-selector.service.ts'
import { streamingApiManager } from './streaming-api-manager.ts'
import type { Brand } from '@/types'

interface LoadPhase {
  name: string
  priority: number
  startTime: number
  endTime: number
  apis: string[]
  status: 'pending' | 'loading' | 'complete' | 'error'
  results?: Map<string, any>
}

interface LoadMetrics {
  phaseStartTimes: Map<string, number>
  phaseEndTimes: Map<string, number>
  apiLoadTimes: Map<string, number>
  firstDataTime?: number
  fiftyPercentTime?: number
  ninetyPercentTime?: number
  completeTime?: number
}

export class OptimizedAPILoader extends EventEmitter {
  private metrics: LoadMetrics = {
    phaseStartTimes: new Map(),
    phaseEndTimes: new Map(),
    apiLoadTimes: new Map()
  }

  private loadStartTime = 0
  private totalAPIs = 0
  private loadedAPIs = 0

  /**
   * Load all data with optimized phasing following research recommendations
   */
  async loadDataOptimized(brand: Brand): Promise<void> {
    console.log('[OptimizedAPILoader] Starting optimized load for:', brand.name)
    this.loadStartTime = performance.now()
    this.loadedAPIs = 0

    // Phase 0: Display cached data immediately (0-100ms)
    await this.executePhase0CacheDisplay(brand)

    // Determine which APIs to load based on industry
    const industryAPIs = this.determineIndustryAPIs(brand)
    this.totalAPIs = industryAPIs.size

    // Execute loading phases in parallel groups
    const phases = this.createLoadPhases(brand, industryAPIs)

    // Start all phases according to timing
    this.executeAllPhases(phases, brand)
  }

  /**
   * Phase 0: Cache Display (0-100ms)
   * Show ALL cached data immediately
   */
  private async executePhase0CacheDisplay(brand: Brand): Promise<void> {
    const phaseStart = performance.now()
    console.log('[Phase 0] Displaying cached data...')

    // Get all cached data
    const cachedData = apiCache.getAllCachedData()

    // Emit cached data immediately for each API
    for (const [key, entry] of cachedData) {
      if (entry.data) {
        const apiType = this.extractAPIType(key)
        this.emit('cache-loaded', {
          type: apiType,
          data: entry.data,
          isStale: entry.isStale,
          timestamp: entry.timestamp
        })

        // Also emit to streaming API manager for compatibility
        streamingApiManager.emit(apiType as any, {
          status: 'cache',
          data: entry.data,
          progress: 100,
          isStale: entry.isStale
        })
      }
    }

    const phaseTime = performance.now() - phaseStart
    console.log(`[Phase 0] Cache displayed in ${phaseTime.toFixed(0)}ms`)
    this.metrics.phaseEndTimes.set('phase0-cache', phaseTime)

    // Record first data time if we had cache
    if (cachedData.size > 0 && !this.metrics.firstDataTime) {
      this.metrics.firstDataTime = phaseTime
    }
  }

  /**
   * Determine which APIs to load based on industry
   */
  private determineIndustryAPIs(brand: Brand): Set<string> {
    const apis = new Set<string>()

    // Universal APIs (all industries)
    apis.add('serper-search')
    apis.add('youtube-trending')
    apis.add('youtube-comments')
    apis.add('semrush-keywords')
    apis.add('outscraper-reviews')
    apis.add('apify-twitter')
    apis.add('apify-quora')
    apis.add('perplexity-research')
    apis.add('openrouter-analysis')

    // Industry-specific APIs
    const naicsCode = brand.industry?.naics_code || brand.naics_code

    // DISABLED: Weather API (per user request)
    // if (industryApiSelector.shouldUseWeatherAPI(naicsCode)) {
    //   apis.add('weather-current')
    // }

    if (industryApiSelector.shouldUseLinkedInAPI(naicsCode)) {
      apis.add('linkedin-company')
      apis.add('linkedin-network')
      apis.add('apify-linkedin')
      apis.add('apify-g2')
    }

    // TrustPilot for both B2B and B2C
    apis.add('apify-trustpilot')

    // DISABLED: Reddit APIs (per user request)
    // apis.add('reddit-trending')
    // apis.add('reddit-sentiment')

    // DISABLED: Hume AI (per user request)
    // apis.add('hume-emotion')
    // apis.add('hume-voice')

    console.log(`[OptimizedAPILoader] Loading ${apis.size} APIs for industry ${naicsCode}`)
    return apis
  }

  /**
   * Create phased load plan
   */
  private createLoadPhases(brand: Brand, apis: Set<string>): LoadPhase[] {
    const phases: LoadPhase[] = []

    // Phase 1: Critical Context (100ms-3s)
    if (apis.has('serper-search') || apis.has('youtube-trending') || apis.has('semrush-keywords')) {
      phases.push({
        name: 'critical-context',
        priority: Priority.CRITICAL,
        startTime: 100,
        endTime: 3000,
        apis: ['serper-search', 'youtube-trending', 'semrush-keywords'].filter(api => apis.has(api)),
        status: 'pending'
      })
    }

    // Phase 2: Psychological Triggers (3s-15s)
    const psychAPIs = [
      'outscraper-reviews',
      'youtube-comments',
      'apify-twitter',
      'apify-quora'
    ].filter(api => apis.has(api))

    if (psychAPIs.length > 0) {
      phases.push({
        name: 'psychological-triggers',
        priority: Priority.HIGH,
        startTime: 3000,
        endTime: 15000,
        apis: psychAPIs,
        status: 'pending'
      })
    }

    // Phase 3: Deep Analysis (15s-30s)
    const analysisAPIs = [
      'perplexity-research',
      'openrouter-analysis'
    ].filter(api => apis.has(api))

    if (analysisAPIs.length > 0) {
      phases.push({
        name: 'deep-analysis',
        priority: Priority.MEDIUM,
        startTime: 15000,
        endTime: 30000,
        apis: analysisAPIs,
        status: 'pending'
      })
    }

    // Phase 4: Industry-Specific (30s-60s)
    const industryAPIs = [
      'linkedin-company',
      'linkedin-network',
      'apify-linkedin',
      'apify-g2',
      'apify-trustpilot',
      'weather-current'
    ].filter(api => apis.has(api))

    if (industryAPIs.length > 0) {
      phases.push({
        name: 'industry-specific',
        priority: Priority.LOW,
        startTime: 30000,
        endTime: 60000,
        apis: industryAPIs,
        status: 'pending'
      })
    }

    return phases
  }

  /**
   * Execute all phases with proper timing
   */
  private async executeAllPhases(phases: LoadPhase[], brand: Brand): Promise<void> {
    console.log(`[OptimizedAPILoader] Executing ${phases.length} phases`)

    // Schedule each phase to start at its designated time
    for (const phase of phases) {
      const delay = Math.max(0, phase.startTime - (performance.now() - this.loadStartTime))

      setTimeout(() => {
        this.executePhase(phase, brand)
      }, delay)
    }
  }

  /**
   * Execute a single phase
   */
  private async executePhase(phase: LoadPhase, brand: Brand): Promise<void> {
    const phaseStart = performance.now()
    console.log(`[Phase: ${phase.name}] Starting with ${phase.apis.length} APIs`)

    phase.status = 'loading'
    this.metrics.phaseStartTimes.set(phase.name, phaseStart - this.loadStartTime)

    // Emit phase start event
    this.emit('phase-start', {
      name: phase.name,
      apis: phase.apis,
      priority: phase.priority
    })

    // Create tasks for this phase
    const tasks = phase.apis.map(apiType => ({
      fn: () => this.loadAPIWithCache(apiType, brand),
      id: apiType,
      priority: phase.priority
    }))

    try {
      // Execute with concurrency limiting (max 6 parallel)
      const results = await concurrencyLimiter.executeMany(
        tasks,
        (completed, total) => {
          this.loadedAPIs++
          const progress = (this.loadedAPIs / this.totalAPIs) * 100

          // Emit progress update
          this.emit('progress', {
            phase: phase.name,
            phaseProgress: (completed / total) * 100,
            totalProgress: progress,
            loaded: this.loadedAPIs,
            total: this.totalAPIs
          })

          // Track milestone times
          if (progress >= 50 && !this.metrics.fiftyPercentTime) {
            this.metrics.fiftyPercentTime = performance.now() - this.loadStartTime
            console.log(`[Metrics] 50% loaded in ${this.metrics.fiftyPercentTime.toFixed(0)}ms`)
          }

          if (progress >= 90 && !this.metrics.ninetyPercentTime) {
            this.metrics.ninetyPercentTime = performance.now() - this.loadStartTime
            console.log(`[Metrics] 90% loaded in ${this.metrics.ninetyPercentTime.toFixed(0)}ms`)
          }
        }
      )

      phase.status = 'complete'
      phase.results = new Map(results.map((r, i) => [phase.apis[i], r]))

      const phaseTime = performance.now() - phaseStart
      this.metrics.phaseEndTimes.set(phase.name, phaseTime)

      console.log(`[Phase: ${phase.name}] Completed in ${phaseTime.toFixed(0)}ms`)

      // Emit phase complete event
      this.emit('phase-complete', {
        name: phase.name,
        duration: phaseTime,
        results: phase.results
      })

    } catch (error) {
      phase.status = 'error'
      console.error(`[Phase: ${phase.name}] Failed:`, error)

      this.emit('phase-error', {
        name: phase.name,
        error
      })
    }

    // Check if all phases complete
    if (this.loadedAPIs >= this.totalAPIs) {
      this.metrics.completeTime = performance.now() - this.loadStartTime
      console.log(`[Metrics] All APIs loaded in ${this.metrics.completeTime.toFixed(0)}ms`)

      this.emit('load-complete', {
        metrics: this.getMetrics(),
        brand
      })
    }
  }

  /**
   * Load API with cache (SWR pattern)
   */
  private async loadAPIWithCache(apiType: string, brand: Brand): Promise<any> {
    const startTime = performance.now()

    // Generate cache key
    const cacheKey = apiCache.generateKey(apiType, {
      brand: brand.name,
      industry: brand.industry?.code
    })

    // Use SWR pattern - return cache immediately, revalidate in background
    const result = await apiCache.getWithSWR(
      cacheKey,
      () => this.fetchAPIData(apiType, brand),
      {
        onStale: (data) => {
          // Emit stale data immediately
          this.emitAPIUpdate(apiType, data, true)
        },
        onFresh: (data) => {
          // Emit fresh data when ready
          this.emitAPIUpdate(apiType, data, false)
        }
      }
    )

    const loadTime = performance.now() - startTime
    this.metrics.apiLoadTimes.set(apiType, loadTime)

    // Record first data time
    if (!this.metrics.firstDataTime) {
      this.metrics.firstDataTime = performance.now() - this.loadStartTime
    }

    return result.data
  }

  /**
   * Fetch fresh API data
   */
  private async fetchAPIData(apiType: string, brand: Brand): Promise<any> {
    // Route to appropriate API method in streaming API manager
    switch (apiType) {
      case 'serper-search':
        return await streamingApiManager['loadSearchData'](brand)
      case 'youtube-trending':
        return await streamingApiManager['loadYouTubeData'](brand)
      case 'youtube-comments':
        return await streamingApiManager['loadYouTubeComments'](brand)
      case 'semrush-keywords':
        return await streamingApiManager['loadSEOData'](brand)
      case 'outscraper-reviews':
        return await streamingApiManager['loadReviewData'](brand)
      case 'weather-current':
        return await streamingApiManager['loadWeatherData'](brand)
      case 'linkedin-company':
      case 'linkedin-network':
        return await streamingApiManager['loadLinkedInData'](brand)
      case 'apify-twitter':
      case 'apify-quora':
      case 'apify-linkedin':
      case 'apify-trustpilot':
      case 'apify-g2':
        return await streamingApiManager['loadApifySocialData'](brand)
      case 'perplexity-research':
        return await streamingApiManager['loadAIInsights'](brand)
      case 'openrouter-analysis':
        return await streamingApiManager['loadAIAnalysis'](brand)
      default:
        throw new Error(`Unknown API type: ${apiType}`)
    }
  }

  /**
   * Emit API update event
   */
  private emitAPIUpdate(apiType: string, data: any, isStale: boolean): void {
    // Emit to our event system
    this.emit('api-update', {
      type: apiType,
      data,
      isStale,
      timestamp: Date.now()
    })

    // Also emit to streaming API manager for compatibility
    streamingApiManager.emit(apiType as any, {
      status: isStale ? 'stale' : 'success',
      data,
      progress: 100
    })
  }

  /**
   * Extract API type from cache key
   */
  private extractAPIType(key: string): string {
    // Key format: "apitype-hash"
    const parts = key.split('-')
    return parts.slice(0, -1).join('-')
  }

  /**
   * Get loading metrics
   */
  getMetrics(): LoadMetrics & {
    summary: {
      totalTime: number
      apisLoaded: number
      cacheHitRate: number
      averageAPITime: number
    }
  } {
    const apiTimes = Array.from(this.metrics.apiLoadTimes.values())
    const avgAPITime = apiTimes.length > 0
      ? apiTimes.reduce((a, b) => a + b, 0) / apiTimes.length
      : 0

    return {
      ...this.metrics,
      summary: {
        totalTime: this.metrics.completeTime || 0,
        apisLoaded: this.loadedAPIs,
        cacheHitRate: apiCache.getStats().staleRate,
        averageAPITime: avgAPITime
      }
    }
  }

  /**
   * Prefetch data for likely next requests
   */
  async prefetchForBrand(brand: Brand): Promise<void> {
    console.log('[OptimizedAPILoader] Prefetching data for:', brand.name)

    const apis = this.determineIndustryAPIs(brand)

    // Prefetch critical APIs only
    const criticalAPIs = ['serper-search', 'youtube-trending', 'semrush-keywords']
      .filter(api => apis.has(api))

    for (const apiType of criticalAPIs) {
      const cacheKey = apiCache.generateKey(apiType, {
        brand: brand.name,
        industry: brand.industry?.code
      })

      apiCache.prefetch(
        cacheKey,
        () => this.fetchAPIData(apiType, brand)
      ).catch(console.error)
    }
  }
}

// Export singleton instance
export const optimizedAPILoader = new OptimizedAPILoader()

// Export types
export type { LoadPhase, LoadMetrics }