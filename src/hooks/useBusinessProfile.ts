/**
 * useBusinessProfile Hook
 *
 * React hook that provides access to the resolved business profile,
 * including competitor-aware gaps, industry profile content, and segment features.
 *
 * Usage:
 * ```tsx
 * const { profile, isLoading, gaps, hooks, features } = useBusinessProfile(deepContext, uvp);
 * ```
 *
 * Created: 2025-11-28
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  businessProfileResolver,
  ResolvedBusinessProfile,
  CompetitorAwareGap,
  DiscoveredCompetitor
} from '@/services/intelligence/business-profile-resolver.service';
import type { DeepContext } from '@/types/synapse/deepContext.types';
import type { CompleteUVP } from '@/types/uvp-flow.types';

interface UseBusinessProfileOptions {
  /** Skip Perplexity competitor discovery (use only UVP + DeepContext competitors) */
  skipPerplexityDiscovery?: boolean;
  /** Auto-refresh when context changes */
  autoRefresh?: boolean;
}

interface UseBusinessProfileResult {
  /** The fully resolved business profile */
  profile: ResolvedBusinessProfile | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message if resolution failed */
  error: string | null;
  /** Competitor-aware gaps (shortcut to profile.gaps) */
  gaps: CompetitorAwareGap[];
  /** Discovered competitors (shortcut to profile.competitors) */
  competitors: DiscoveredCompetitor[];
  /** Hook library from industry profile */
  hooks: Record<string, string[]>;
  /** Feature flags based on segment */
  features: ResolvedBusinessProfile['features'] | null;
  /** Segment label (e.g., "B2B National") */
  segmentLabel: string | null;
  /** Force refresh the profile */
  refresh: () => Promise<void>;
  /** Get hooks by type */
  getHooks: (type: 'number_hooks' | 'question_hooks' | 'story_hooks' | 'fear_hooks' | 'howto_hooks') => string[];
}

/**
 * Hook to access the resolved business profile with competitor-aware gaps
 */
export function useBusinessProfile(
  deepContext: DeepContext | null,
  uvp?: CompleteUVP | null,
  options: UseBusinessProfileOptions = {}
): UseBusinessProfileResult {
  const [profile, setProfile] = useState<ResolvedBusinessProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref to track if we've already resolved for this context
  const resolvedForRef = useRef<string | null>(null);

  // Extract UVP data for the resolver - memoized to prevent infinite loops
  // Note: CompleteUVP may not have competitors - we extract from uniqueSolution or DeepContext
  const uvpData = useMemo(() => uvp ? {
    competitors: (uvp as any).competitors || [], // competitors may be added dynamically
    unique_solution: uvp.uniqueSolution?.statement || '',
    key_benefit: uvp.keyBenefit?.statement || ''
  } : undefined, [uvp?.uniqueSolution?.statement, uvp?.keyBenefit?.statement]);

  // Resolve profile function
  // NOTE: We intentionally DON'T include `profile` in deps to avoid infinite loops
  const resolveProfile = useCallback(async () => {
    if (!deepContext) {
      setProfile(null);
      return;
    }

    // Create a cache key based on context
    const cacheKey = `${deepContext.business?.profile?.name}-${deepContext.business?.profile?.industry}`;

    // Skip if already resolved for this context (unless forced)
    if (resolvedForRef.current === cacheKey) {
      console.log('[useBusinessProfile] Already resolved for this context, skipping');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[useBusinessProfile] Resolving business profile...');
      const resolved = await businessProfileResolver.resolve(deepContext, uvpData);

      setProfile(resolved);
      resolvedForRef.current = cacheKey;

      console.log('[useBusinessProfile] Resolved:', {
        segment: resolved.segmentLabel,
        industry: resolved.industryProfile?.industry,
        gapsCount: resolved.gaps.length,
        competitorsCount: resolved.competitors.length
      });
    } catch (err) {
      console.error('[useBusinessProfile] Failed to resolve:', err);
      setError(err instanceof Error ? err.message : 'Failed to resolve business profile');
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepContext, uvpData]);

  // Auto-resolve when context changes
  useEffect(() => {
    if (options.autoRefresh !== false && deepContext) {
      resolveProfile();
    }
  }, [deepContext, options.autoRefresh, resolveProfile]);

  // Force refresh function
  const refresh = useCallback(async () => {
    resolvedForRef.current = null; // Clear cache key to force refresh
    businessProfileResolver.clearCache();
    await resolveProfile();
  }, [resolveProfile]);

  // Helper to get hooks by type
  const getHooks = useCallback((type: 'number_hooks' | 'question_hooks' | 'story_hooks' | 'fear_hooks' | 'howto_hooks'): string[] => {
    if (!profile) return [];
    return businessProfileResolver.getHooksByType(profile, type);
  }, [profile]);

  return {
    profile,
    isLoading,
    error,
    gaps: profile?.gaps || [],
    competitors: profile?.competitors || [],
    hooks: profile?.hooks || {},
    features: profile?.features || null,
    segmentLabel: profile?.segmentLabel || null,
    refresh,
    getHooks
  };
}

/**
 * Hook to get competitor-aware gaps formatted for UI display
 */
export function useCompetitorGaps(
  deepContext: DeepContext | null,
  uvp?: CompleteUVP | null
): {
  gaps: Array<{
    id: string;
    title: string;
    theVoid: string;
    theDemand: string;
    yourAngle: string;
    competitors: string[];
    confidence: number;
    source: string;
  }>;
  isLoading: boolean;
} {
  const { gaps, isLoading } = useBusinessProfile(deepContext, uvp);

  // Format gaps for UI display
  const formattedGaps = gaps.map(gap => ({
    id: gap.id,
    title: gap.title,
    theVoid: gap.theVoid,
    theDemand: gap.theDemand,
    yourAngle: gap.yourAngle,
    competitors: gap.competitors,
    confidence: gap.confidence,
    source: gap.source
  }));

  return { gaps: formattedGaps, isLoading };
}

export default useBusinessProfile;
