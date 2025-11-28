/**
 * useContentSynthesis Hook
 *
 * Provides Content Mixer components with access to the ContentSynthesisOrchestrator.
 * Enables dynamic re-synthesis when users change filters (journey stage, persona, format).
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  contentSynthesisOrchestrator,
  type EnrichedContext,
  type OrchestratedInsight,
  type BusinessSegment,
  type JourneyStage,
  type ContentFormat
} from '@/services/intelligence/content-synthesis-orchestrator.service';
import type { CategorizedInsight } from '@/types/content-mixer.types';
import type { SynthesizedInsight } from '@/services/intelligence/ai-insight-synthesizer.service';
import { analyticsService } from '@/services/analytics.service';

// Session-level cache for enriched contexts (survives component remounts)
const SESSION_CACHE_KEY = 'synapse_synthesis_context';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface CachedContext {
  context: EnrichedContext;
  cacheKey: string;
  timestamp: number;
}

function getCachedContext(cacheKey: string): EnrichedContext | null {
  try {
    const cached = sessionStorage.getItem(SESSION_CACHE_KEY);
    if (!cached) return null;

    const data: CachedContext = JSON.parse(cached);
    const isExpired = Date.now() - data.timestamp > CACHE_TTL_MS;
    const keyMatches = data.cacheKey === cacheKey;

    if (!isExpired && keyMatches) {
      console.log('[useContentSynthesis] Using cached context');
      return data.context;
    }
    return null;
  } catch {
    return null;
  }
}

function setCachedContext(cacheKey: string, context: EnrichedContext): void {
  try {
    const data: CachedContext = {
      context,
      cacheKey,
      timestamp: Date.now()
    };
    sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('[useContentSynthesis] Failed to cache context:', e);
  }
}

export interface UseContentSynthesisOptions {
  brandName: string;
  industry: string;
  naicsCode?: string;
  segment: BusinessSegment;
  uvpData: {
    target_customer?: string;
    key_benefit?: string;
    transformation?: string;
    unique_mechanism?: string;
    proof_points?: string[];
  };
}

export interface UseContentSynthesisReturn {
  // Enriched context (loaded once)
  enrichedContext: EnrichedContext | null;
  isContextLoading: boolean;
  contextError: string | null;

  // Scoring and ranking
  scoreInsights: (insights: SynthesizedInsight[]) => OrchestratedInsight[];

  // Dynamic re-synthesis
  reSynthesizeForStage: (
    insights: Array<CategorizedInsight | SynthesizedInsight>,
    targetStage: JourneyStage
  ) => Promise<OrchestratedInsight[]>;
  isReSynthesizing: boolean;
  reSynthesisError: string | null;

  // UVP-aligned CTA generation
  generateUVPCTA: (insight: SynthesizedInsight) => string;

  // Recommended framework for current context
  getRecommendedFramework: (journeyStage: JourneyStage) => string;

  // Load enriched context
  loadContext: () => Promise<void>;

  // Retry after error
  retryLoadContext: () => Promise<void>;

  // Clear errors
  clearErrors: () => void;
}

export function useContentSynthesis(options: UseContentSynthesisOptions): UseContentSynthesisReturn {
  // Generate cache key from options
  const cacheKey = useMemo(() =>
    `${options.brandName}:${options.industry}:${options.segment}:${options.naicsCode || ''}`,
    [options.brandName, options.industry, options.segment, options.naicsCode]
  );

  const [enrichedContext, setEnrichedContext] = useState<EnrichedContext | null>(() =>
    // Initialize from session cache if available
    getCachedContext(cacheKey)
  );
  const [isContextLoading, setIsContextLoading] = useState(false);
  const [contextError, setContextError] = useState<string | null>(null);
  const [isReSynthesizing, setIsReSynthesizing] = useState(false);
  const [reSynthesisError, setReSynthesisError] = useState<string | null>(null);

  // Ref to prevent duplicate loads
  const loadingRef = useRef(false);

  // Check cache on mount/key change
  useEffect(() => {
    const cached = getCachedContext(cacheKey);
    if (cached && !enrichedContext) {
      setEnrichedContext(cached);
    }
  }, [cacheKey]);

  // Load enriched context
  const loadContext = useCallback(async () => {
    if (loadingRef.current || enrichedContext) return;

    // Check session cache first
    const cached = getCachedContext(cacheKey);
    if (cached) {
      setEnrichedContext(cached);
      // Track cache hit
      analyticsService.trackSynthesisContextLoaded({
        segment: options.segment,
        industry: options.industry,
        eqWeight: cached.eqProfile.emotional_weight,
        fromCache: true,
      });
      return;
    }

    loadingRef.current = true;
    setIsContextLoading(true);
    setContextError(null);
    const startTime = Date.now();

    try {
      const context = await contentSynthesisOrchestrator.buildEnrichedContext({
        brandName: options.brandName,
        industry: options.industry,
        naicsCode: options.naicsCode,
        uvpData: options.uvpData,
        segment: options.segment
      });

      setEnrichedContext(context);
      // Cache for session
      setCachedContext(cacheKey, context);

      // Track successful load
      analyticsService.trackSynthesisContextLoaded({
        segment: options.segment,
        industry: options.industry,
        eqWeight: context.eqProfile.emotional_weight,
        fromCache: false,
        loadTimeMs: Date.now() - startTime,
      });

      console.log('[useContentSynthesis] Enriched context loaded & cached:', {
        eqWeight: context.eqProfile.emotional_weight,
        jtbdFocus: context.eqProfile.jtbd_focus,
        segment: context.segment,
        hasIndustryProfile: !!context.industryProfile
      });
    } catch (error) {
      console.error('[useContentSynthesis] Failed to load context:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load context';
      setContextError(errorMessage);

      // Track error
      analyticsService.trackSynthesisError({
        errorType: 'context_load',
        errorMessage,
        segment: options.segment,
      });
    } finally {
      setIsContextLoading(false);
      loadingRef.current = false;
    }
  }, [options.brandName, options.industry, options.naicsCode, options.segment, options.uvpData, enrichedContext, cacheKey]);

  // Score insights based on EQ alignment
  const scoreInsights = useCallback((insights: SynthesizedInsight[]): OrchestratedInsight[] => {
    if (!enrichedContext) {
      // Return insights with default scores if no context
      return insights.map(insight => ({
        ...insight,
        eqAlignment: 50,
        industryRelevance: 50,
        segmentFit: 50,
        uvpAlignment: null,
        recommendedPriority: insight.scores?.breakthrough || 50
      }));
    }

    const scored = contentSynthesisOrchestrator.scoreInsights(insights, enrichedContext);

    // Track EQ score distribution
    if (scored.length > 0) {
      const eqScores = scored.map(s => s.eqAlignment);
      analyticsService.trackEQScoreDistribution({
        insightCount: scored.length,
        avgEQScore: Math.round(eqScores.reduce((a, b) => a + b, 0) / eqScores.length),
        minEQScore: Math.min(...eqScores),
        maxEQScore: Math.max(...eqScores),
        segment: options.segment,
      });
    }

    return scored;
  }, [enrichedContext, options.segment]);

  // Re-synthesize insights for a different journey stage
  const reSynthesizeForStage = useCallback(async (
    insights: Array<CategorizedInsight | SynthesizedInsight>,
    targetStage: JourneyStage
  ): Promise<OrchestratedInsight[]> => {
    if (!enrichedContext) {
      console.warn('[useContentSynthesis] Cannot re-synthesize without enriched context');
      return insights.map(i => ({
        ...(i as SynthesizedInsight),
        eqAlignment: 50,
        industryRelevance: 50,
        segmentFit: 50,
        uvpAlignment: null,
        recommendedPriority: 50
      }));
    }

    setIsReSynthesizing(true);
    setReSynthesisError(null);
    const startTime = Date.now();

    try {
      const results = await contentSynthesisOrchestrator.batchReSynthesize(
        insights,
        targetStage,
        enrichedContext,
        3 // Max 3 concurrent re-synthesis calls
      );

      // Track successful re-synthesis
      analyticsService.trackReSynthesis({
        journeyStage: targetStage,
        insightCount: results.length,
        durationMs: Date.now() - startTime,
        success: true,
      });

      console.log(`[useContentSynthesis] Re-synthesized ${results.length} insights for ${targetStage}`);
      return results;
    } catch (error) {
      console.error('[useContentSynthesis] Re-synthesis failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Re-synthesis failed';
      setReSynthesisError(errorMessage);

      // Track error
      analyticsService.trackSynthesisError({
        errorType: 'resynthesis',
        errorMessage,
        segment: options.segment,
      });
      analyticsService.trackReSynthesis({
        journeyStage: targetStage,
        insightCount: insights.length,
        durationMs: Date.now() - startTime,
        success: false,
      });

      // Return original insights with default scores
      return insights.map(i => ({
        ...(i as SynthesizedInsight),
        eqAlignment: 50,
        industryRelevance: 50,
        segmentFit: 50,
        uvpAlignment: null,
        recommendedPriority: 50
      }));
    } finally {
      setIsReSynthesizing(false);
    }
  }, [enrichedContext, options.segment]);

  // Generate UVP-aligned CTA
  const generateUVPCTA = useCallback((insight: SynthesizedInsight): string => {
    if (!enrichedContext) {
      return insight.cta || 'Learn more';
    }

    return contentSynthesisOrchestrator.generateUVPAlignedCTA(insight, enrichedContext);
  }, [enrichedContext]);

  // Get recommended framework for journey stage
  const getRecommendedFramework = useCallback((journeyStage: JourneyStage): string => {
    if (!enrichedContext) {
      return 'aida';
    }

    return contentSynthesisOrchestrator.getRecommendedFramework(enrichedContext, journeyStage);
  }, [enrichedContext]);

  // Retry loading context after an error (clears cache and forces reload)
  const retryLoadContext = useCallback(async () => {
    // Clear any cached context
    try {
      sessionStorage.removeItem(SESSION_CACHE_KEY);
    } catch {}

    // Reset state
    setEnrichedContext(null);
    setContextError(null);
    loadingRef.current = false;

    // Force reload
    setIsContextLoading(true);
    try {
      const context = await contentSynthesisOrchestrator.buildEnrichedContext({
        brandName: options.brandName,
        industry: options.industry,
        naicsCode: options.naicsCode,
        uvpData: options.uvpData,
        segment: options.segment
      });

      setEnrichedContext(context);
      setCachedContext(cacheKey, context);
      console.log('[useContentSynthesis] Context reloaded after retry');
    } catch (error) {
      console.error('[useContentSynthesis] Retry failed:', error);
      setContextError(error instanceof Error ? error.message : 'Failed to load context');
    } finally {
      setIsContextLoading(false);
    }
  }, [options.brandName, options.industry, options.naicsCode, options.segment, options.uvpData, cacheKey]);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setContextError(null);
    setReSynthesisError(null);
  }, []);

  return {
    enrichedContext,
    isContextLoading,
    contextError,
    scoreInsights,
    reSynthesizeForStage,
    isReSynthesizing,
    reSynthesisError,
    generateUVPCTA,
    getRecommendedFramework,
    loadContext,
    retryLoadContext,
    clearErrors
  };
}
