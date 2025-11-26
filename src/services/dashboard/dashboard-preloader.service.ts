/**
 * Dashboard Preloader Service
 *
 * Pre-loads dashboard intelligence data during UVP synthesis
 * so the dashboard is ready when user completes the UVP flow.
 *
 * Usage:
 * 1. Call `preloadDashboard(brandId)` during UVP synthesis step
 * 2. Dashboard checks `getPreloadedContext()` before building fresh
 * 3. If preloaded data exists, use it immediately
 */

import { DeepContext } from '@/types/synapse/deepContext.types';
import { trueProgressiveBuilder, ProgressCallback } from '@/services/intelligence/deepcontext-builder-progressive.service';
import { supabase } from '@/lib/supabase';

interface PreloadState {
  brandId: string;
  context: DeepContext | null;
  isLoading: boolean;
  startTime: number;
  error: string | null;
}

class DashboardPreloaderService {
  private preloadState: PreloadState | null = null;
  private progressCallbacks: Set<ProgressCallback> = new Set();

  /**
   * Start pre-loading dashboard data for a brand
   * Called during UVP synthesis step
   */
  async preloadDashboard(brandId: string): Promise<void> {
    // Don't restart if already loading for this brand
    if (this.preloadState?.brandId === brandId && this.preloadState.isLoading) {
      console.log('[DashboardPreloader] Already preloading for brand:', brandId);
      return;
    }

    console.log('[DashboardPreloader] Starting preload for brand:', brandId);

    this.preloadState = {
      brandId,
      context: null,
      isLoading: true,
      startTime: Date.now(),
      error: null,
    };

    try {
      // Clear old cache first
      console.log('[DashboardPreloader] Clearing intelligence cache...');
      await supabase
        .from('intelligence_cache')
        .delete()
        .eq('brand_id', brandId);

      // Build context with progressive loading
      const result = await trueProgressiveBuilder.buildTrueProgressive(
        {
          brandId,
          cacheResults: true,
          forceFresh: true,
          includeYouTube: true,
          includeOutScraper: true,
          includeSerper: true,
          includeWebsiteAnalysis: true,
          includeSEMrush: true,
          includeNews: true,
          includeWeather: true,
          includeLinkedIn: true,
          includePerplexity: true,
          includeApify: true,
        },
        (context, metadata) => {
          // Update preload state as data streams in
          if (this.preloadState && this.preloadState.brandId === brandId) {
            this.preloadState.context = context;
            console.log(`[DashboardPreloader] Progress: ${metadata.completedApis.length} APIs done, ${metadata.dataPointsCollected} data points`);

            // Notify any registered callbacks (e.g., if dashboard mounted during preload)
            this.progressCallbacks.forEach(cb => cb(context, metadata));
          }
        }
      );

      // Final update
      if (this.preloadState && this.preloadState.brandId === brandId) {
        this.preloadState.context = result.context;
        this.preloadState.isLoading = false;

        const duration = Date.now() - this.preloadState.startTime;
        console.log(`[DashboardPreloader] Preload complete in ${duration}ms for brand:`, brandId);
      }
    } catch (error) {
      console.error('[DashboardPreloader] Preload failed:', error);
      if (this.preloadState && this.preloadState.brandId === brandId) {
        this.preloadState.error = error instanceof Error ? error.message : 'Unknown error';
        this.preloadState.isLoading = false;
      }
    }
  }

  /**
   * Get preloaded context if available
   * Returns null if no preload exists or brand doesn't match
   */
  getPreloadedContext(brandId: string): DeepContext | null {
    if (!this.preloadState) {
      console.log('[DashboardPreloader] No preload state exists');
      return null;
    }

    if (this.preloadState.brandId !== brandId) {
      console.log('[DashboardPreloader] Brand mismatch:', {
        preloaded: this.preloadState.brandId,
        requested: brandId
      });
      return null;
    }

    if (this.preloadState.context) {
      console.log('[DashboardPreloader] ✅ Returning preloaded context for brand:', brandId);
      return this.preloadState.context;
    }

    console.log('[DashboardPreloader] Preload exists but context not ready yet');
    return null;
  }

  /**
   * Check if preload is in progress for a brand
   */
  isPreloading(brandId: string): boolean {
    return this.preloadState?.brandId === brandId && this.preloadState.isLoading;
  }

  /**
   * Subscribe to preload progress updates
   * Returns unsubscribe function
   */
  subscribeToProgress(callback: ProgressCallback): () => void {
    this.progressCallbacks.add(callback);
    return () => this.progressCallbacks.delete(callback);
  }

  /**
   * Clear preloaded data
   */
  clearPreload(): void {
    console.log('[DashboardPreloader] Clearing preload state');
    this.preloadState = null;
    this.progressCallbacks.clear();
  }
}

// Export singleton instance
export const dashboardPreloader = new DashboardPreloaderService();
