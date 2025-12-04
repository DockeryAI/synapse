/**
 * Early Trigger Loader Service
 *
 * Starts trigger discovery as early as possible in the UVP flow.
 * Uses EventEmitter pattern to begin loading in parallel - doesn't block UVP generation.
 *
 * Timeline:
 * 1. As soon as Target Customer section is populated → Detect profile type
 * 2. Fire initial profile-specific queries immediately
 * 3. Continue refining queries as more UVP sections complete
 *
 * Created: 2025-11-29
 */

import { EventEmitter } from 'events';
import { profileDetectionService, type BusinessProfileType, type BusinessProfileAnalysis } from '@/services/triggers/_archived/profile-detection.service';
import { triggerSearchQueryGenerator, type TriggerSearchQueries } from '@/services/intelligence/trigger-search-query-generator.service';
import type { CompleteUVP, CustomerProfile, ProductServiceData } from '@/types/uvp-flow.types';

// ============================================================================
// TYPES
// ============================================================================

export interface EarlyTriggerEvent {
  type: 'profile-detected' | 'queries-ready' | 'loading-started' | 'refinement-available';
  data: any;
  timestamp: number;
}

export interface PartialUVPData {
  targetCustomer?: CustomerProfile | null;
  productsServices?: ProductServiceData | null;
  industry?: string;
  businessName?: string;
  naicsCode?: string;
}

export interface EarlyLoadingState {
  profileType: BusinessProfileType | null;
  profileAnalysis: BusinessProfileAnalysis | null;
  queries: TriggerSearchQueries | null;
  isLoading: boolean;
  loadingStartedAt: number | null;
  uvpCompleteness: number; // 0-100
}

// ============================================================================
// SERVICE
// ============================================================================

class EarlyTriggerLoaderService extends EventEmitter {
  private state: EarlyLoadingState = {
    profileType: null,
    profileAnalysis: null,
    queries: null,
    isLoading: false,
    loadingStartedAt: null,
    uvpCompleteness: 0
  };

  private brandId: string | null = null;

  /**
   * Reset state for a new brand/session
   */
  reset() {
    this.state = {
      profileType: null,
      profileAnalysis: null,
      queries: null,
      isLoading: false,
      loadingStartedAt: null,
      uvpCompleteness: 0
    };
    this.brandId = null;
    console.log('[EarlyTriggerLoader] State reset');
  }

  /**
   * Get current state
   */
  getState(): EarlyLoadingState {
    return { ...this.state };
  }

  /**
   * Called when Target Customer section is populated
   * This is the earliest point we can start loading
   */
  onTargetCustomerAvailable(
    customer: CustomerProfile,
    brandId: string,
    partialUVP?: PartialUVPData
  ) {
    console.log('[EarlyTriggerLoader] Target customer available:', customer.statement?.substring(0, 50));
    this.brandId = brandId;

    // Build partial UVP for profile detection
    const uvpForDetection: Partial<CompleteUVP> = {
      targetCustomer: customer,
      productsServices: partialUVP?.productsServices || undefined,
    };

    // Check cache first
    let profileAnalysis = profileDetectionService.getCachedProfile(brandId);

    if (!profileAnalysis) {
      // Detect profile type from partial data
      profileAnalysis = profileDetectionService.detectProfile(
        uvpForDetection as CompleteUVP,
        {
          name: partialUVP?.businessName,
          naicsCode: partialUVP?.naicsCode,
          industry: partialUVP?.industry
        }
      );

      // Cache for later
      profileDetectionService.cacheProfile(brandId, profileAnalysis);
    }

    this.state.profileType = profileAnalysis.profileType;
    this.state.profileAnalysis = profileAnalysis;
    this.state.uvpCompleteness = 25; // Customer = 25%

    console.log('[EarlyTriggerLoader] Profile detected:', profileAnalysis.profileType, profileAnalysis.signals);

    // Emit profile detection event
    this.emit('profile-detected', {
      type: 'profile-detected',
      data: {
        profileType: profileAnalysis.profileType,
        profileAnalysis,
        confidence: profileAnalysis.confidence
      },
      timestamp: Date.now()
    } as EarlyTriggerEvent);

    // Generate initial queries
    this.generateQueries(uvpForDetection as CompleteUVP);
  }

  /**
   * Called when Products/Services section is populated
   * Refines the profile detection
   */
  onProductsServicesAvailable(
    products: ProductServiceData,
    customer?: CustomerProfile | null
  ) {
    console.log('[EarlyTriggerLoader] Products/services available:', products.categories?.length, 'categories');

    // Update UVP completeness
    this.state.uvpCompleteness = Math.min(50, this.state.uvpCompleteness + 25);

    if (!customer && !this.state.profileAnalysis) {
      // No customer data yet - store products and wait
      return;
    }

    // Rebuild UVP with products
    const uvpForDetection: Partial<CompleteUVP> = {
      targetCustomer: customer || undefined,
      productsServices: products,
    };

    // Re-detect profile with richer data
    const profileAnalysis = profileDetectionService.detectProfile(
      uvpForDetection as CompleteUVP,
      {}
    );

    // Only update if confidence improved
    if (profileAnalysis.confidence > (this.state.profileAnalysis?.confidence || 0)) {
      this.state.profileType = profileAnalysis.profileType;
      this.state.profileAnalysis = profileAnalysis;

      console.log('[EarlyTriggerLoader] Profile refined:', profileAnalysis.profileType);

      // Regenerate queries with better data
      this.generateQueries(uvpForDetection as CompleteUVP);

      this.emit('refinement-available', {
        type: 'refinement-available',
        data: { profileType: profileAnalysis.profileType, uvpCompleteness: this.state.uvpCompleteness },
        timestamp: Date.now()
      } as EarlyTriggerEvent);
    }
  }

  /**
   * Called when full UVP is available
   * Final refinement before synthesis
   */
  onFullUVPAvailable(uvp: CompleteUVP, brandId: string) {
    console.log('[EarlyTriggerLoader] Full UVP available');
    this.brandId = brandId;
    this.state.uvpCompleteness = 100;

    // Final profile detection with complete data
    const profileAnalysis = profileDetectionService.detectProfile(uvp, {});

    this.state.profileType = profileAnalysis.profileType;
    this.state.profileAnalysis = profileAnalysis;

    console.log('[EarlyTriggerLoader] Final profile:', profileAnalysis.profileType, 'confidence:', profileAnalysis.confidence);

    // Generate final queries
    this.generateQueries(uvp);

    this.emit('refinement-available', {
      type: 'refinement-available',
      data: { profileType: profileAnalysis.profileType, uvpCompleteness: 100, isFinal: true },
      timestamp: Date.now()
    } as EarlyTriggerEvent);
  }

  /**
   * Generate profile-specific search queries
   */
  private generateQueries(partialUVP: Partial<CompleteUVP>) {
    if (!this.state.profileType) return;

    try {
      const queries = triggerSearchQueryGenerator.generateQueries({
        uvp: partialUVP as CompleteUVP,
        profileType: this.state.profileType,
        brand: { name: '', industry: '' }
      });

      this.state.queries = queries;

      const totalQueries = queries.fearQueries.length + queries.frustrationQueries.length +
        queries.desireQueries.length + queries.objectionQueries.length +
        queries.competitorDisplacementQueries.length;

      console.log('[EarlyTriggerLoader] Generated', totalQueries, 'queries for', this.state.profileType);

      this.emit('queries-ready', {
        type: 'queries-ready',
        data: {
          queries,
          profileType: this.state.profileType,
          brandId: this.brandId
        },
        timestamp: Date.now()
      } as EarlyTriggerEvent);
    } catch (err) {
      console.error('[EarlyTriggerLoader] Query generation failed:', err);
    }
  }

  /**
   * Mark loading as started (called by streaming manager)
   */
  markLoadingStarted() {
    this.state.isLoading = true;
    this.state.loadingStartedAt = Date.now();

    this.emit('loading-started', {
      type: 'loading-started',
      data: { brandId: this.brandId, profileType: this.state.profileType },
      timestamp: Date.now()
    } as EarlyTriggerEvent);
  }

  /**
   * Check if early loading can start
   */
  canStartLoading(): boolean {
    return !!(this.state.profileType && this.state.queries && this.brandId);
  }

  /**
   * Get queries for the streaming manager to use
   */
  getQueriesForStreaming(): { queries: TriggerSearchQueries; profileType: BusinessProfileType } | null {
    if (!this.state.queries || !this.state.profileType) return null;

    return {
      queries: this.state.queries,
      profileType: this.state.profileType
    };
  }
}

// Export singleton
export const earlyTriggerLoaderService = new EarlyTriggerLoaderService();
