/**
 * Early Trigger Preloader Service
 *
 * Starts Phase 1 API calls (Perplexity + Reddit) in background when V4 dashboard loads.
 * This gives triggers a head start so they're ready when user clicks the Triggers tab.
 *
 * Architecture:
 * - Phase 1 (Early): Perplexity + Reddit - fast, high-quality data
 * - Phase 2 (On-demand): G2, Trustpilot, Twitter, LinkedIn, YouTube - triggered by manual "Fetch Fresh"
 *
 * Uses same localStorage cache as TriggersPanelV2 for seamless handoff.
 *
 * Created: 2025-11-29
 */

import { perplexityAPI } from '@/services/uvp-wizard/perplexity-api';
import { redditAPI } from '@/services/intelligence/reddit-apify-api';
import { aiInsightSynthesizer } from '@/services/intelligence/ai-insight-synthesizer.service';
import { profileDetectionService, type BusinessProfileType } from '@/services/triggers/profile-detection.service';
import type { CompleteUVP } from '@/types/uvp-flow.types';
import type { DeepContext } from '@/types/synapse/deepContext.types';

// Same cache keys as TriggersPanelV2 for seamless handoff
const TRIGGERS_CACHE_KEY = 'triggersPanel_deepContext_v1';
const PRELOADER_STATUS_KEY = 'earlyTriggerPreloader_status_v1';

interface PreloaderStatus {
  isRunning: boolean;
  phase1Complete: boolean;
  startedAt: number;
  completedAt?: number;
  brandId?: string;
  error?: string;
}

class EarlyTriggerPreloaderService {
  private isPreloading = false;
  private abortController: AbortController | null = null;

  /**
   * Check if we have cached DeepContext data
   */
  hasCachedData(): boolean {
    try {
      const cached = localStorage.getItem(TRIGGERS_CACHE_KEY);
      if (!cached) return false;

      const data = JSON.parse(cached) as DeepContext;
      // Check if we have meaningful data
      return (
        (data.correlatedInsights?.length || 0) > 0 ||
        (data.rawDataPoints?.length || 0) > 0 ||
        (data.customerPsychology?.emotional?.length || 0) > 0
      );
    } catch {
      return false;
    }
  }

  /**
   * Get preloader status
   */
  getStatus(): PreloaderStatus | null {
    try {
      const status = localStorage.getItem(PRELOADER_STATUS_KEY);
      return status ? JSON.parse(status) : null;
    } catch {
      return null;
    }
  }

  /**
   * Update preloader status
   */
  private updateStatus(updates: Partial<PreloaderStatus>): void {
    const current = this.getStatus() || {
      isRunning: false,
      phase1Complete: false,
      startedAt: Date.now()
    };

    localStorage.setItem(PRELOADER_STATUS_KEY, JSON.stringify({
      ...current,
      ...updates
    }));
  }

  /**
   * Start Phase 1 preloading (Perplexity + Reddit)
   * Only runs if no cached data exists
   */
  async startPhase1(
    brandId: string,
    uvp: CompleteUVP,
    options?: {
      force?: boolean; // Force preload even if cached data exists
      onProgress?: (source: string, complete: boolean) => void;
    }
  ): Promise<boolean> {
    // Check if already running
    if (this.isPreloading) {
      console.log('[EarlyPreloader] Already running, skipping');
      return false;
    }

    // Check if we have cached data (unless force is true)
    if (!options?.force && this.hasCachedData()) {
      console.log('[EarlyPreloader] Cached data exists, skipping preload');
      return false;
    }

    // Check for recent preload attempt
    const status = this.getStatus();
    if (status?.brandId === brandId && status.phase1Complete) {
      const ageMs = Date.now() - (status.completedAt || 0);
      if (ageMs < 5 * 60 * 1000) { // Less than 5 minutes old
        console.log('[EarlyPreloader] Recent preload exists, skipping');
        return false;
      }
    }

    this.isPreloading = true;
    this.abortController = new AbortController();

    console.log('[EarlyPreloader] 🚀 Starting Phase 1 preload for brand:', brandId);
    this.updateStatus({
      isRunning: true,
      phase1Complete: false,
      startedAt: Date.now(),
      brandId
    });

    try {
      // Detect business profile for search query optimization
      const profileAnalysis = profileDetectionService.detectProfile(uvp);
      const profile = profileAnalysis.profileType;

      // Build search context from UVP
      const searchContext = this.buildSearchContext(uvp, profile);

      // Run Perplexity and Reddit in parallel (Phase 1)
      const [perplexityResult, redditResult] = await Promise.allSettled([
        this.fetchPerplexity(searchContext, uvp),
        this.fetchReddit(searchContext, uvp)
      ]);

      // Report progress
      options?.onProgress?.('Perplexity', perplexityResult.status === 'fulfilled');
      options?.onProgress?.('Reddit', redditResult.status === 'fulfilled');

      // Build partial DeepContext from Phase 1 results
      const partialContext = await this.buildPartialDeepContext(
        perplexityResult.status === 'fulfilled' ? perplexityResult.value : null,
        redditResult.status === 'fulfilled' ? redditResult.value : null,
        uvp
      );

      // Save to localStorage (same cache as TriggersPanelV2)
      if (partialContext) {
        localStorage.setItem(TRIGGERS_CACHE_KEY, JSON.stringify(partialContext));
        console.log('[EarlyPreloader] ✅ Phase 1 complete - saved to cache');
      }

      this.updateStatus({
        isRunning: false,
        phase1Complete: true,
        completedAt: Date.now()
      });

      return true;
    } catch (error) {
      console.error('[EarlyPreloader] ❌ Phase 1 error:', error);
      this.updateStatus({
        isRunning: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    } finally {
      this.isPreloading = false;
      this.abortController = null;
    }
  }

  /**
   * Cancel ongoing preload
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.isPreloading = false;
      console.log('[EarlyPreloader] Cancelled');
    }
  }

  /**
   * Build search context from UVP data
   */
  private buildSearchContext(uvp: CompleteUVP, profile: BusinessProfileType): {
    industry: string;
    targetCustomer: string;
    productService: string;
    painPoints: string[];
  } {
    const industry = uvp.productService?.category || uvp.productService?.primaryService || 'business';
    const targetCustomer = uvp.targetCustomer?.statement || uvp.targetCustomer?.idealCustomer || '';
    const productService = uvp.productService?.primaryService || uvp.productService?.primaryProduct || '';

    // Extract pain points from UVP
    const painPoints: string[] = [];
    if (uvp.targetCustomer?.painPoints) {
      painPoints.push(...uvp.targetCustomer.painPoints);
    }
    if (uvp.transformationGoal?.emotionalDrivers) {
      painPoints.push(...uvp.transformationGoal.emotionalDrivers.map(d => d.driver || d.label || ''));
    }

    return { industry, targetCustomer, productService, painPoints };
  }

  /**
   * Fetch Perplexity data
   */
  private async fetchPerplexity(
    context: ReturnType<typeof this.buildSearchContext>,
    uvp: CompleteUVP
  ): Promise<any[]> {
    console.log('[EarlyPreloader] Fetching Perplexity...');

    // Build search queries focused on pain points and triggers
    const queries = [
      `What are the biggest frustrations ${context.targetCustomer} have with ${context.industry}?`,
      `Common complaints about ${context.productService} from ${context.targetCustomer}`,
    ];

    const results: any[] = [];

    for (const query of queries) {
      try {
        const response = await perplexityAPI.searchWithCitations(query, {
          maxCitations: 5,
          focusAreas: ['pain_points', 'customer_complaints', 'buying_triggers']
        });

        if (response?.insights) {
          results.push(...response.insights);
        }
      } catch (err) {
        console.warn('[EarlyPreloader] Perplexity query failed:', err);
      }
    }

    console.log('[EarlyPreloader] Perplexity returned', results.length, 'insights');
    return results;
  }

  /**
   * Fetch Reddit data
   */
  private async fetchReddit(
    context: ReturnType<typeof this.buildSearchContext>,
    uvp: CompleteUVP
  ): Promise<any[]> {
    console.log('[EarlyPreloader] Fetching Reddit...');

    // Build Reddit search query
    const searchQuery = `${context.industry} ${context.targetCustomer} problems frustrations`;

    try {
      const posts = await redditAPI.searchPosts(searchQuery, {
        limit: 20,
        sort: 'relevance',
        timeFilter: 'year'
      });

      console.log('[EarlyPreloader] Reddit returned', posts?.length || 0, 'posts');
      return posts || [];
    } catch (err) {
      console.warn('[EarlyPreloader] Reddit fetch failed:', err);
      return [];
    }
  }

  /**
   * Build partial DeepContext from Phase 1 results
   */
  private async buildPartialDeepContext(
    perplexityInsights: any[] | null,
    redditPosts: any[] | null,
    uvp: CompleteUVP
  ): Promise<DeepContext | null> {
    // Convert to DeepContext structure
    const correlatedInsights: any[] = [];
    const rawDataPoints: any[] = [];

    // Process Perplexity insights
    if (perplexityInsights && perplexityInsights.length > 0) {
      perplexityInsights.forEach((insight, idx) => {
        correlatedInsights.push({
          id: `perplexity-${idx}`,
          insight: insight.text || insight.insight || insight.content,
          sources: insight.sources || [],
          sourceDetails: insight.citations || [],
          confidence: insight.confidence || 0.8,
          category: 'pain_point'
        });
      });
    }

    // Process Reddit posts
    if (redditPosts && redditPosts.length > 0) {
      redditPosts.forEach((post, idx) => {
        rawDataPoints.push({
          id: `reddit-${idx}`,
          content: post.title || post.selftext || post.body,
          source: 'Reddit',
          type: 'community_discussion',
          metadata: {
            platform: 'Reddit',
            subreddit: post.subreddit,
            url: post.url || post.permalink,
            author: post.author,
            score: post.score,
            numComments: post.num_comments
          }
        });
      });
    }

    if (correlatedInsights.length === 0 && rawDataPoints.length === 0) {
      return null;
    }

    // Return partial DeepContext
    return {
      correlatedInsights,
      rawDataPoints,
      customerPsychology: {
        emotional: [],
        functional: [],
        social: []
      },
      synthesis: {
        breakthroughs: [],
        patterns: []
      },
      // Mark as partial for TriggersPanelV2 to know more data can be fetched
      _preloaderMeta: {
        phase1Only: true,
        preloadedAt: Date.now(),
        sources: ['Perplexity', 'Reddit']
      }
    } as DeepContext & { _preloaderMeta: any };
  }
}

// Singleton instance
export const earlyTriggerPreloader = new EarlyTriggerPreloaderService();
