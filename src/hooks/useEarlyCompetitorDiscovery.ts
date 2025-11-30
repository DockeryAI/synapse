/**
 * useEarlyCompetitorDiscovery Hook
 *
 * Triggers competitor discovery early during UVP extraction (non-blocking).
 * Runs in parallel with UVP flow to pre-warm competitor data.
 *
 * Key Features:
 * - Triggers at 30% UVP progress (after target customer defined)
 * - Non-blocking: Uses streaming architecture
 * - Caches discovered competitors for later gap extraction
 * - Deduplicates calls (only runs once per brand/session)
 *
 * Task 6.7: Early trigger implementation for non-blocking UVP
 * Created: 2025-11-28
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import { competitorStreamingManager } from '@/services/intelligence/competitor-streaming-manager';
import { competitorIntelligence } from '@/services/intelligence/competitor-intelligence.service';
import { shouldBlockApiCalls } from '@/config/gap-tab-cache.config';
import type { CompetitorProfile, DiscoveredCompetitor } from '@/types/competitor-intelligence.types';
import type { DeepContext } from '@/types/synapse/deepContext.types';
import type { CompetitorStreamEvent } from '@/services/intelligence/competitor-streaming-manager';

// ============================================================================
// TYPES
// ============================================================================

interface EarlyDiscoveryState {
  status: 'idle' | 'discovering' | 'discovered' | 'scanning' | 'complete' | 'error';
  discoveredCompetitors: DiscoveredCompetitor[];
  savedCompetitors: CompetitorProfile[];
  progress: number;
  error: string | null;
  startedAt: number | null;
  completedAt: number | null;
}

interface UseEarlyCompetitorDiscoveryOptions {
  /** Auto-start discovery when conditions are met */
  autoStart?: boolean;
  /** Progress threshold to trigger discovery (0-100) */
  triggerAtProgress?: number;
}

interface UseEarlyCompetitorDiscoveryResult {
  /** Current discovery state */
  state: EarlyDiscoveryState;
  /** Manually trigger discovery */
  triggerDiscovery: (brandId: string, deepContext: DeepContext) => Promise<void>;
  /** Start full analysis (discovery + scanning) */
  startFullAnalysis: (brandId: string, deepContext: DeepContext) => Promise<void>;
  /** Check if discovery has already run for this brand */
  hasRunForBrand: (brandId: string) => boolean;
  /** Reset state for a new brand */
  reset: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Progress threshold at which to trigger early discovery (30%) */
const DEFAULT_TRIGGER_PROGRESS = 30;

/** Session key for tracking discovery status */
const SESSION_KEY = 'early_competitor_discovery';

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useEarlyCompetitorDiscovery(
  options: UseEarlyCompetitorDiscoveryOptions = {}
): UseEarlyCompetitorDiscoveryResult {
  const { autoStart = false, triggerAtProgress = DEFAULT_TRIGGER_PROGRESS } = options;

  // State
  const [state, setState] = useState<EarlyDiscoveryState>({
    status: 'idle',
    discoveredCompetitors: [],
    savedCompetitors: [],
    progress: 0,
    error: null,
    startedAt: null,
    completedAt: null
  });

  // Refs for deduplication
  const triggeredBrandsRef = useRef<Set<string>>(new Set());
  const isRunningRef = useRef(false);

  // ==========================================================================
  // EVENT LISTENERS
  // ==========================================================================

  useEffect(() => {
    const handleStreamEvent = (event: CompetitorStreamEvent) => {
      switch (event.type) {
        case 'discovery-started':
          setState(prev => ({
            ...prev,
            status: 'discovering',
            progress: 10,
            startedAt: Date.now()
          }));
          break;

        case 'competitor-found':
          if (event.data) {
            setState(prev => ({
              ...prev,
              discoveredCompetitors: [...prev.discoveredCompetitors, event.data as DiscoveredCompetitor],
              progress: Math.min(prev.progress + 5, 40)
            }));
          }
          break;

        case 'discovery-completed':
          setState(prev => ({
            ...prev,
            status: 'discovered',
            progress: 40
          }));
          break;

        case 'scan-started':
          setState(prev => ({
            ...prev,
            status: 'scanning',
            progress: Math.min(prev.progress + 5, 80)
          }));
          break;

        case 'scan-progress':
          setState(prev => ({
            ...prev,
            progress: 40 + (event.progress || 0) * 40 // 40-80% during scanning
          }));
          break;

        case 'gap-saved':
          // Gaps are being saved - progress toward completion
          setState(prev => ({
            ...prev,
            progress: Math.min(prev.progress + 2, 95)
          }));
          break;

        case 'all-scans-completed':
          setState(prev => ({
            ...prev,
            status: 'complete',
            progress: 100,
            completedAt: Date.now()
          }));
          break;

        case 'error':
          setState(prev => ({
            ...prev,
            status: 'error',
            error: event.error || 'Discovery failed'
          }));
          break;
      }
    };

    competitorStreamingManager.on('stream-event', handleStreamEvent);

    return () => {
      competitorStreamingManager.off('stream-event', handleStreamEvent);
    };
  }, []);

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  const hasRunForBrand = useCallback((brandId: string): boolean => {
    // Check in-memory tracking
    if (triggeredBrandsRef.current.has(brandId)) {
      return true;
    }

    // Check session storage
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        return data.brandId === brandId && data.status === 'complete';
      }
    } catch {
      // Ignore storage errors
    }

    return false;
  }, []);

  const persistState = useCallback((brandId: string, status: string) => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        brandId,
        status,
        timestamp: Date.now()
      }));
    } catch {
      // Ignore storage errors
    }
  }, []);

  // ==========================================================================
  // DISCOVERY TRIGGER
  // ==========================================================================

  const triggerDiscovery = useCallback(async (
    brandId: string,
    deepContext: DeepContext
  ): Promise<void> => {
    // Block if API calls are disabled
    if (shouldBlockApiCalls()) {
      console.log('[EarlyDiscovery] Blocked - CACHE_ONLY_MODE enabled');
      return;
    }

    // Prevent duplicate runs
    if (isRunningRef.current) {
      console.log('[EarlyDiscovery] Already running, skipping');
      return;
    }

    if (hasRunForBrand(brandId)) {
      console.log('[EarlyDiscovery] Already completed for brand:', brandId);
      return;
    }

    // Validate we have enough context
    const profile = deepContext.business?.profile;
    if (!profile?.name || !profile?.industry) {
      console.log('[EarlyDiscovery] Insufficient context, waiting...');
      return;
    }

    console.log('[EarlyDiscovery] Starting early discovery for:', profile.name);
    isRunningRef.current = true;
    triggeredBrandsRef.current.add(brandId);

    setState(prev => ({
      ...prev,
      status: 'discovering',
      startedAt: Date.now(),
      error: null
    }));

    try {
      // Start early discovery (just competitor identification, not full scanning)
      const discovered = await competitorStreamingManager.startEarlyDiscovery(
        brandId,
        deepContext
      );

      // Save discovered competitors to database
      const saved = await competitorIntelligence.saveCompetitors(brandId, discovered);

      setState(prev => ({
        ...prev,
        status: 'discovered',
        discoveredCompetitors: discovered,
        savedCompetitors: saved,
        progress: 50
      }));

      persistState(brandId, 'discovered');
      console.log('[EarlyDiscovery] Discovery complete:', saved.length, 'competitors saved');

    } catch (err) {
      console.error('[EarlyDiscovery] Failed:', err);
      setState(prev => ({
        ...prev,
        status: 'error',
        error: err instanceof Error ? err.message : 'Discovery failed'
      }));
    } finally {
      isRunningRef.current = false;
    }
  }, [hasRunForBrand, persistState]);

  // ==========================================================================
  // FULL ANALYSIS
  // ==========================================================================

  const startFullAnalysis = useCallback(async (
    brandId: string,
    deepContext: DeepContext
  ): Promise<void> => {
    // Block if API calls are disabled
    if (shouldBlockApiCalls()) {
      console.log('[EarlyDiscovery] Full analysis blocked - CACHE_ONLY_MODE enabled');
      return;
    }

    // Prevent duplicate runs
    if (isRunningRef.current) {
      console.log('[EarlyDiscovery] Already running, skipping');
      return;
    }

    console.log('[EarlyDiscovery] Starting FULL streaming analysis');
    isRunningRef.current = true;
    triggeredBrandsRef.current.add(brandId);

    setState(prev => ({
      ...prev,
      status: 'discovering',
      startedAt: Date.now(),
      error: null
    }));

    try {
      // Run full streaming analysis (discovery + scanning + gap extraction)
      const { competitors, gaps } = await competitorStreamingManager.runStreamingAnalysis(
        brandId,
        deepContext,
        { existingCompetitors: state.savedCompetitors.length > 0 ? state.savedCompetitors : undefined }
      );

      setState(prev => ({
        ...prev,
        status: 'complete',
        savedCompetitors: competitors,
        progress: 100,
        completedAt: Date.now()
      }));

      persistState(brandId, 'complete');
      console.log('[EarlyDiscovery] Full analysis complete:', {
        competitors: competitors.length,
        gaps: gaps.length
      });

    } catch (err) {
      console.error('[EarlyDiscovery] Full analysis failed:', err);
      setState(prev => ({
        ...prev,
        status: 'error',
        error: err instanceof Error ? err.message : 'Analysis failed'
      }));
    } finally {
      isRunningRef.current = false;
    }
  }, [state.savedCompetitors, persistState]);

  // ==========================================================================
  // RESET
  // ==========================================================================

  const reset = useCallback(() => {
    setState({
      status: 'idle',
      discoveredCompetitors: [],
      savedCompetitors: [],
      progress: 0,
      error: null,
      startedAt: null,
      completedAt: null
    });
    triggeredBrandsRef.current.clear();
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    state,
    triggerDiscovery,
    startFullAnalysis,
    hasRunForBrand,
    reset
  };
}

export default useEarlyCompetitorDiscovery;
