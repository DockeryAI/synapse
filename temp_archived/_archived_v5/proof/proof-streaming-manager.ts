/**
 * Proof Streaming Manager - EventEmitter-based Progressive Loading
 *
 * Loads proof from multiple sources in parallel, emitting updates as each completes.
 * Supports early loading at brand selection (Step 1 of UVP flow).
 * Uses profile-gated API selection for efficiency.
 *
 * Created: 2025-11-29 (Phase 7.7)
 */

import { EventEmitter } from 'events';
import type { BusinessProfileType } from '@/services/triggers';
import { reviewPlatformScraperService, ReviewPlatformResult } from './review-platform-scraper.service';
import { pressNewsScraperService, PressResult } from './press-news-scraper.service';
import { proofConsolidationService, ConsolidatedProof, ProofConsolidationResult } from './proof-consolidation.service';
import type { DeepContext } from '@/types/synapse/deepContext.types';
import type { CompleteUVP } from '@/types/uvp-flow.types';

// ============================================================================
// TYPES
// ============================================================================

export type ProofSourceType =
  | 'google-reviews'
  | 'review-platforms'
  | 'press-mentions'
  | 'website-analysis'
  | 'social-proof'
  | 'consolidation';

export interface ProofUpdate {
  source: ProofSourceType;
  data: any;
  timestamp: number;
  fromCache: boolean;
  proofCount?: number;
  error?: Error;
}

export interface ProofSourceStatus {
  source: ProofSourceType;
  status: 'idle' | 'loading' | 'success' | 'error';
  startTime?: number;
  endTime?: number;
  duration?: number;
  proofCount?: number;
  error?: Error;
}

// Profile-gated source selection
const PROFILE_PROOF_SOURCES: Record<BusinessProfileType, ProofSourceType[]> = {
  'local-service-b2b': ['google-reviews', 'website-analysis'],
  'local-service-b2c': ['google-reviews', 'website-analysis', 'social-proof'],
  'regional-b2b-agency': ['google-reviews', 'review-platforms', 'website-analysis'],
  'regional-retail-b2c': ['google-reviews', 'website-analysis', 'social-proof'],
  'national-saas-b2b': ['review-platforms', 'press-mentions', 'website-analysis'],
  'national-product-b2c': ['google-reviews', 'press-mentions', 'website-analysis', 'social-proof'],
  'global-saas-b2b': ['review-platforms', 'press-mentions', 'website-analysis']
};

// ============================================================================
// SERVICE
// ============================================================================

class ProofStreamingManager extends EventEmitter {
  private sourceStatuses: Map<ProofSourceType, ProofSourceStatus> = new Map();
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private CACHE_TTL = 30 * 60 * 1000; // 30 minutes for proof data

  // Event batching to prevent excessive re-renders
  private eventBuffer: Map<ProofSourceType, ProofUpdate> = new Map();
  private batchFlushTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly BATCH_WINDOW_MS = 150;

  // Current loading state
  private isLoading = false;
  private currentBrandId: string | null = null;
  private currentBrandName: string = '';
  private currentProfileType: BusinessProfileType = 'national-saas-b2b';

  // Accumulated data for consolidation
  private accumulatedData: {
    reviewPlatforms?: ReviewPlatformResult;
    pressMentions?: PressResult;
    googleReviews?: any[];
    websiteAnalysis?: any;
  } = {};

  // Early loading flag
  private earlyLoadingStarted = false;
  private earlyLoadBrandId: string | null = null;

  constructor() {
    super();
    this.setMaxListeners(30);
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Start early loading of proof at brand selection (Step 1)
   * This gets proof data loading before the user completes the UVP flow
   */
  async startEarlyLoading(
    brandId: string,
    brandName: string,
    profileType: BusinessProfileType = 'national-saas-b2b'
  ): Promise<void> {
    // Skip if already loading for this brand
    if (this.earlyLoadBrandId === brandId && this.earlyLoadingStarted) {
      console.log('[ProofStreamingManager] Early loading already started for:', brandName);
      return;
    }

    console.log('[ProofStreamingManager] 🚀 Starting EARLY proof loading for:', brandName);

    this.earlyLoadingStarted = true;
    this.earlyLoadBrandId = brandId;
    this.currentBrandId = brandId;
    this.currentBrandName = brandName;
    this.currentProfileType = profileType;
    this.accumulatedData = {};

    // Get profile-specific sources
    const sources = PROFILE_PROOF_SOURCES[profileType] || PROFILE_PROOF_SOURCES['national-saas-b2b'];
    console.log('[ProofStreamingManager] Profile sources:', sources);

    // Fire all relevant sources in parallel
    const promises: Promise<void>[] = [];

    if (sources.includes('review-platforms')) {
      promises.push(this.loadReviewPlatforms(brandName));
    }

    if (sources.includes('press-mentions')) {
      promises.push(this.loadPressMentions(brandName));
    }

    // Don't await - let them run in background
    Promise.allSettled(promises).then(() => {
      console.log('[ProofStreamingManager] ✅ Early loading complete for:', brandName);
      this.emitConsolidation();
    });
  }

  /**
   * Load all proof sources for a brand
   * Call this when the proof tab is opened
   */
  async loadAllProof(
    brandId: string,
    brandName: string,
    uvp: CompleteUVP | null,
    deepContext: DeepContext | null,
    profileType: BusinessProfileType = 'national-saas-b2b'
  ): Promise<void> {
    // If early loading already ran for this brand, use that data
    if (this.earlyLoadBrandId === brandId && Object.keys(this.accumulatedData).length > 0) {
      console.log('[ProofStreamingManager] Using early-loaded data for:', brandName);

      // Merge early data with deepContext and consolidate
      this.emitConsolidation(uvp, deepContext);
      return;
    }

    // Guard against duplicate loading
    if (this.isLoading && this.currentBrandId === brandId) {
      console.log('[ProofStreamingManager] Already loading for:', brandName);
      return;
    }

    console.log('[ProofStreamingManager] Loading all proof for:', brandName);

    this.isLoading = true;
    this.currentBrandId = brandId;
    this.currentBrandName = brandName;
    this.currentProfileType = profileType;
    this.accumulatedData = {};

    // Get profile-specific sources
    const sources = PROFILE_PROOF_SOURCES[profileType] || PROFILE_PROOF_SOURCES['national-saas-b2b'];

    // Fire all relevant sources in parallel
    const promises: Promise<void>[] = [];

    if (sources.includes('review-platforms')) {
      promises.push(this.loadReviewPlatforms(brandName));
    }

    if (sources.includes('press-mentions')) {
      promises.push(this.loadPressMentions(brandName));
    }

    // Wait for all to complete
    await Promise.allSettled(promises);

    console.log('[ProofStreamingManager] ✅ All sources loaded for:', brandName);
    this.isLoading = false;

    // Final consolidation
    this.emitConsolidation(uvp, deepContext);
  }

  /**
   * Get current loading status for all sources
   */
  getStatus(): { source: ProofSourceType; status: ProofSourceStatus['status'] }[] {
    return Array.from(this.sourceStatuses.entries()).map(([source, status]) => ({
      source,
      status: status.status
    }));
  }

  /**
   * Get accumulated data (for merging into DeepContext)
   */
  getAccumulatedData() {
    return { ...this.accumulatedData };
  }

  /**
   * Check if early loading has data ready
   */
  hasEarlyData(brandId: string): boolean {
    return this.earlyLoadBrandId === brandId && Object.keys(this.accumulatedData).length > 0;
  }

  /**
   * Clear cache and accumulated data
   */
  reset(): void {
    this.accumulatedData = {};
    this.earlyLoadingStarted = false;
    this.earlyLoadBrandId = null;
    this.currentBrandId = null;
    this.isLoading = false;
    this.sourceStatuses.clear();
  }

  // ==========================================================================
  // PRIVATE LOADERS
  // ==========================================================================

  private async loadReviewPlatforms(brandName: string): Promise<void> {
    const source: ProofSourceType = 'review-platforms';

    // Check cache
    const cacheKey = `review-platforms:${brandName}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.accumulatedData.reviewPlatforms = cached;
      this.emitUpdate(source, cached, true, cached.allReviews?.length || 0);
      return;
    }

    this.setSourceStatus(source, 'loading');

    try {
      const result = await reviewPlatformScraperService.scrapeAllPlatforms(brandName);
      this.accumulatedData.reviewPlatforms = result;
      this.setCache(cacheKey, result);
      this.setSourceStatus(source, 'success', result.allReviews?.length || 0);
      this.emitUpdate(source, result, false, result.allReviews?.length || 0);
    } catch (error) {
      console.error('[ProofStreamingManager] Review platforms error:', error);
      this.setSourceStatus(source, 'error', 0, error as Error);
      this.emitUpdate(source, null, false, 0, error as Error);
    }
  }

  private async loadPressMentions(brandName: string): Promise<void> {
    const source: ProofSourceType = 'press-mentions';

    // Check cache
    const cacheKey = `press-mentions:${brandName}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.accumulatedData.pressMentions = cached;
      this.emitUpdate(source, cached, true, cached.mentions?.length || 0);
      return;
    }

    this.setSourceStatus(source, 'loading');

    try {
      const result = await pressNewsScraperService.scrapePressMentions(brandName);
      this.accumulatedData.pressMentions = result;
      this.setCache(cacheKey, result);
      this.setSourceStatus(source, 'success', result.mentions?.length || 0);
      this.emitUpdate(source, result, false, result.mentions?.length || 0);
    } catch (error) {
      console.error('[ProofStreamingManager] Press mentions error:', error);
      this.setSourceStatus(source, 'error', 0, error as Error);
      this.emitUpdate(source, null, false, 0, error as Error);
    }
  }

  // ==========================================================================
  // CONSOLIDATION
  // ==========================================================================

  private emitConsolidation(uvp?: CompleteUVP | null, deepContext?: DeepContext | null): void {
    // Merge accumulated data into a consolidated DeepContext
    const mergedContext: DeepContext = {
      ...(deepContext || {}),
      reviewPlatforms: this.accumulatedData.reviewPlatforms,
      pressMentions: this.accumulatedData.pressMentions
    } as DeepContext;

    // Run consolidation
    const result = proofConsolidationService.consolidate(
      mergedContext,
      uvp || null,
      this.currentProfileType
    );

    console.log('[ProofStreamingManager] Consolidated', result.proofs.length, 'proofs');

    // Emit consolidation result
    this.emitUpdate('consolidation', result, false, result.proofs.length);
  }

  // ==========================================================================
  // EVENT HELPERS
  // ==========================================================================

  private emitUpdate(
    source: ProofSourceType,
    data: any,
    fromCache: boolean,
    proofCount: number = 0,
    error?: Error
  ): void {
    const update: ProofUpdate = {
      source,
      data,
      timestamp: Date.now(),
      fromCache,
      proofCount,
      error
    };

    // Buffer updates to batch them
    this.eventBuffer.set(source, update);

    if (!this.batchFlushTimeout) {
      this.batchFlushTimeout = setTimeout(() => this.flushEventBuffer(), this.BATCH_WINDOW_MS);
    }
  }

  private flushEventBuffer(): void {
    this.batchFlushTimeout = null;

    // Emit all buffered events at once
    const updates = Array.from(this.eventBuffer.values());
    this.eventBuffer.clear();

    if (updates.length > 0) {
      this.emit('batch-update', updates);

      // Also emit individual events for backward compatibility
      for (const update of updates) {
        this.emit('proof-update', update);
        this.emit(`proof:${update.source}`, update);
      }
    }
  }

  private setSourceStatus(
    source: ProofSourceType,
    status: ProofSourceStatus['status'],
    proofCount?: number,
    error?: Error
  ): void {
    const existing = this.sourceStatuses.get(source);
    const now = Date.now();

    const newStatus: ProofSourceStatus = {
      source,
      status,
      startTime: existing?.startTime || (status === 'loading' ? now : undefined),
      endTime: status === 'success' || status === 'error' ? now : undefined,
      duration: status === 'success' || status === 'error'
        ? now - (existing?.startTime || now)
        : undefined,
      proofCount,
      error
    };

    this.sourceStatuses.set(source, newStatus);
    this.emit('status-update', newStatus);
  }

  // ==========================================================================
  // CACHE HELPERS
  // ==========================================================================

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}

// Singleton export
export const proofStreamingManager = new ProofStreamingManager();
export default proofStreamingManager;
