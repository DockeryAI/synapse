/**
 * useStreamingProof Hook
 *
 * Streams proof data from APIs progressively.
 * Each API completion triggers re-consolidation.
 * Uses EventEmitter architecture - no blocking.
 *
 * Mirrors useStreamingTriggers pattern for consistency.
 * Now also supports new ProofStreamingManager for early loading.
 *
 * Created: 2025-11-29
 * Updated: 2025-11-29 - Added ProofStreamingManager support
 */

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { streamingApiManager, ApiEventType, ApiUpdate } from '../services/intelligence/streaming-api-manager';
import {
  proofConsolidationService,
  ConsolidatedProof,
  ProofConsolidationResult
} from '../services/proof/proof-consolidation.service';
import { proofStreamingManager, ProofUpdate } from '../services/proof/proof-streaming-manager';
import type { DeepContext } from '../types/synapse/deepContext.types';
import type { CompleteUVP } from '../types/uvp-flow.types';
import type { Brand } from '../contexts/BrandContext';
import type { BusinessProfileType } from '@/services/triggers';

export interface StreamingProofResult {
  proofs: ConsolidatedProof[];
  consolidationResult: ProofConsolidationResult | null;
  deepContext: DeepContext | null;
  isLoading: boolean;
  loadingStatus: string;
  loadedSources: string[];
  totalSources: number;
  percentComplete: number;
  error: string | null;
}

// Map API events to human-readable source names for proof
const PROOF_SOURCE_NAMES: Partial<Record<ApiEventType, string>> = {
  'outscraper-reviews': 'Google Reviews',
  'apify-g2-reviews': 'G2 Reviews',
  'apify-trustpilot-reviews': 'Trustpilot',
  'website-analysis': 'Website',
  'apify-linkedin-b2b': 'LinkedIn',
  'serper-search': 'Search Results',
};

// All possible proof sources (used for listening to events)
const ALL_PROOF_SOURCES: ApiEventType[] = [
  'outscraper-reviews',
  'apify-g2-reviews',
  'apify-trustpilot-reviews',
  'website-analysis',
  'apify-linkedin-b2b',
];

/**
 * Get proof-relevant sources based on profile type
 * Uses the streaming API manager's gating configuration
 */
function getProofSourcesForProfile(profileType: BusinessProfileType): ApiEventType[] {
  const gating = streamingApiManager.getProofAPIGatingForProfile(profileType);
  const sources: ApiEventType[] = [];

  // Always include website analysis for testimonials
  if (gating.useWebsiteTestimonials) {
    sources.push('website-analysis');
  }

  // Google Reviews (OutScraper)
  if (gating.useGoogleReviews) {
    sources.push('outscraper-reviews');
  }

  // G2 Reviews
  if (gating.useG2Reviews) {
    sources.push('apify-g2-reviews');
  }

  // Trustpilot
  if (gating.useTrustpilot) {
    sources.push('apify-trustpilot-reviews');
  }

  // LinkedIn (for B2B proof)
  if (gating.useLinkedIn) {
    sources.push('apify-linkedin-b2b');
  }

  // Return sources in priority order from gating config
  return gating.priority.filter(p => sources.includes(p));
}

// Cache keys for localStorage
const PROOF_CACHE_KEY = 'proofDevPage_deepContext_v1';
const PROOF_RESULTS_KEY = 'proofDevPage_proofs_v1';

export function useStreamingProof(
  brand: Brand | null,
  uvp: CompleteUVP | null,
  enabled: boolean = true,
  profileType: BusinessProfileType = 'national-saas-b2b'
): StreamingProofResult {
  const [deepContext, setDeepContext] = useState<DeepContext | null>(null);
  const [proofs, setProofs] = useState<ConsolidatedProof[]>([]);
  const [consolidationResult, setConsolidationResult] = useState<ProofConsolidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('Waiting to start...');
  const [loadedSources, setLoadedSources] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const hasInitialized = useRef(false);
  const contextRef = useRef<Partial<DeepContext>>({});
  const consolidationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConsolidatingRef = useRef(false);
  const lastConsolidationTimeRef = useRef(0);
  const CONSOLIDATION_COOLDOWN_MS = 2000; // Min 2 seconds between consolidations

  // Get profile-specific proof sources (dynamic based on profileType)
  const proofSources = useMemo(() => {
    const sources = getProofSourcesForProfile(profileType);
    console.log(`[StreamingProof] Profile ${profileType} uses sources:`, sources);
    return sources;
  }, [profileType]);

  // Load from cache on mount
  useEffect(() => {
    if (!enabled) return;

    try {
      const cachedContext = localStorage.getItem(PROOF_CACHE_KEY);
      const cachedProofs = localStorage.getItem(PROOF_RESULTS_KEY);

      if (cachedContext) {
        const parsed = JSON.parse(cachedContext);
        setDeepContext(parsed);
        contextRef.current = parsed;
        console.log('[StreamingProof] Loaded cached DeepContext');

        // Also consolidate cached data
        if (uvp) {
          const result = proofConsolidationService.consolidate(parsed, uvp, profileType);
          setProofs(result.proofs);
          setConsolidationResult(result);
          console.log(`[StreamingProof] Consolidated ${result.proofs.length} proofs from cache`);
        }
      }

      if (cachedProofs) {
        const parsed = JSON.parse(cachedProofs);
        if (parsed.length > 0 && proofs.length === 0) {
          setProofs(parsed);
          console.log('[StreamingProof] Loaded cached proofs');
        }
      }
    } catch (err) {
      console.warn('[StreamingProof] Failed to load cache:', err);
    }
  }, [enabled]);

  // RESET state when disabled
  useEffect(() => {
    if (!enabled) {
      console.log('[StreamingProof] Disabled - resetting state');
      setDeepContext(null);
      setProofs([]);
      setConsolidationResult(null);
      setIsLoading(false);
      setLoadedSources([]);
      setError(null);
      contextRef.current = {};
      hasInitialized.current = false;
      isConsolidatingRef.current = false;
    }
  }, [enabled]);

  // Re-consolidate proofs when context updates - DEBOUNCED + THROTTLED
  const consolidateProofs = useCallback((context: DeepContext, immediate: boolean = false) => {
    if (!uvp) {
      console.log('[StreamingProof] No UVP - skipping consolidation');
      return;
    }

    // Clear any pending consolidation
    if (consolidationTimeoutRef.current) {
      clearTimeout(consolidationTimeoutRef.current);
    }

    const doConsolidate = () => {
      // Guard: Skip if already consolidating
      if (isConsolidatingRef.current) {
        console.log('[StreamingProof] ⚠️ Skipping - consolidation already in progress');
        return;
      }

      // Throttle: Check cooldown (except for immediate calls)
      const now = Date.now();
      const timeSinceLast = now - lastConsolidationTimeRef.current;
      if (!immediate && timeSinceLast < CONSOLIDATION_COOLDOWN_MS) {
        const remainingCooldown = CONSOLIDATION_COOLDOWN_MS - timeSinceLast;
        console.log(`[StreamingProof] ⏳ Throttled - scheduling in ${remainingCooldown}ms`);
        consolidationTimeoutRef.current = setTimeout(doConsolidate, remainingCooldown);
        return;
      }

      try {
        isConsolidatingRef.current = true;
        lastConsolidationTimeRef.current = now;
        console.log('[StreamingProof] Re-consolidating proofs with new data');

        const result = proofConsolidationService.consolidate(context, uvp, profileType);

        setProofs(result.proofs);
        setConsolidationResult(result);

        // Cache results
        try {
          localStorage.setItem(PROOF_RESULTS_KEY, JSON.stringify(result.proofs));
        } catch (e) {
          console.warn('[StreamingProof] Failed to cache proofs');
        }

        console.log(`[StreamingProof] Consolidated: ${result.proofs.length} proofs`);
      } catch (err) {
        console.error('[StreamingProof] Consolidation error:', err);
        // Don't crash - keep existing proofs
      } finally {
        isConsolidatingRef.current = false;
      }
    };

    if (immediate) {
      doConsolidate();
    } else {
      // Debounce: Wait 500ms before consolidating
      consolidationTimeoutRef.current = setTimeout(doConsolidate, 500);
    }
  }, [uvp, profileType]);

  // Handle API updates
  const handleApiUpdate = useCallback((update: ApiUpdate) => {
    const eventType = update.type as ApiEventType;

    // Only process proof-relevant sources for this profile
    // Listen to ALL possible proof sources but filter in consolidation
    if (!ALL_PROOF_SOURCES.includes(eventType)) {
      return;
    }

    const sourceName = PROOF_SOURCE_NAMES[eventType] || eventType;
    console.log(`[StreamingProof] Received update from ${sourceName}:`, update.status);

    if (update.status === 'complete' && update.data) {
      // Merge data into context
      const newContext = { ...contextRef.current };

      // Map API data to DeepContext structure
      switch (eventType) {
        case 'outscraper-reviews':
          if (update.data.reviews) {
            newContext.reviews = {
              ...newContext.reviews,
              ...update.data.reviews
            };
          }
          if (update.data.rawDataPoints) {
            newContext.rawDataPoints = [
              ...(newContext.rawDataPoints || []),
              ...update.data.rawDataPoints
            ];
          }
          break;

        case 'apify-g2-reviews':
        case 'apify-trustpilot-reviews':
          if (update.data.rawDataPoints) {
            newContext.rawDataPoints = [
              ...(newContext.rawDataPoints || []),
              ...update.data.rawDataPoints
            ];
          }
          break;

        case 'website-analysis':
          if (update.data.business?.websiteAnalysis) {
            newContext.business = {
              ...newContext.business,
              websiteAnalysis: update.data.business.websiteAnalysis
            };
          }
          if (update.data.synthesis) {
            newContext.synthesis = update.data.synthesis;
          }
          break;

        case 'apify-linkedin-b2b':
          if (update.data.rawDataPoints) {
            newContext.rawDataPoints = [
              ...(newContext.rawDataPoints || []),
              ...update.data.rawDataPoints
            ];
          }
          break;
      }

      contextRef.current = newContext;
      setDeepContext(newContext as DeepContext);

      // Cache context
      try {
        localStorage.setItem(PROOF_CACHE_KEY, JSON.stringify(newContext));
      } catch (e) {
        console.warn('[StreamingProof] Failed to cache context');
      }

      // Update loaded sources
      setLoadedSources(prev => {
        if (!prev.includes(sourceName)) {
          return [...prev, sourceName];
        }
        return prev;
      });

      setLoadingStatus(`Loaded ${sourceName}`);

      // Trigger consolidation
      consolidateProofs(newContext as DeepContext);
    } else if (update.status === 'error') {
      console.error(`[StreamingProof] Error from ${sourceName}:`, update.error);
      // Don't fail - continue with other sources
    }
  }, [consolidateProofs]);

  // Handle streaming complete
  const handleComplete = useCallback(() => {
    console.log('[StreamingProof] All APIs complete');
    setIsLoading(false);
    setLoadingStatus(`Complete: ${proofs.length} proof points found`);

    // Final consolidation
    if (contextRef.current && uvp) {
      consolidateProofs(contextRef.current as DeepContext, true);
    }
  }, [uvp, proofs.length, consolidateProofs]);

  // Subscribe to streaming events
  useEffect(() => {
    if (!enabled || !brand?.id) {
      return;
    }

    // Subscribe to events
    const updateHandler = (update: ApiUpdate) => handleApiUpdate(update);
    const completeHandler = () => handleComplete();

    // Listen to ALL possible proof API events (filter happens in handleApiUpdate)
    // This ensures we don't miss events if profile changes mid-stream
    ALL_PROOF_SOURCES.forEach(source => {
      streamingApiManager.on(source, updateHandler);
    });
    streamingApiManager.on('complete', completeHandler);

    console.log(`[StreamingProof] Subscribed to streaming events for profile: ${profileType}`);

    return () => {
      ALL_PROOF_SOURCES.forEach(source => {
        streamingApiManager.off(source, updateHandler);
      });
      streamingApiManager.off('complete', completeHandler);
      console.log('[StreamingProof] Unsubscribed from streaming events');
    };
  }, [enabled, brand?.id, handleApiUpdate, handleComplete, profileType]);

  // Calculate progress - based on profile-specific sources
  const percentComplete = useMemo(() => {
    if (loadedSources.length === 0) return 0;
    // Filter loaded sources to only count those relevant for this profile
    const relevantLoaded = loadedSources.filter(name => {
      const eventType = Object.entries(PROOF_SOURCE_NAMES).find(([_, n]) => n === name)?.[0] as ApiEventType;
      return eventType && proofSources.includes(eventType);
    });
    return Math.round((relevantLoaded.length / proofSources.length) * 100);
  }, [loadedSources, proofSources]);

  // Re-consolidate when UVP changes
  useEffect(() => {
    if (uvp && deepContext) {
      consolidateProofs(deepContext, true);
    }
  }, [uvp, profileType]);

  // Also subscribe to new ProofStreamingManager for early-loaded data
  useEffect(() => {
    if (!enabled || !brand?.id) return;

    // Check if ProofStreamingManager has early-loaded data
    if (proofStreamingManager.hasEarlyData(brand.id)) {
      console.log('[StreamingProof] Using early-loaded proof data');
      const earlyData = proofStreamingManager.getAccumulatedData();

      // Merge early data into context
      const newContext = {
        ...contextRef.current,
        reviewPlatforms: earlyData.reviewPlatforms,
        pressMentions: earlyData.pressMentions
      } as DeepContext;

      contextRef.current = newContext;
      setDeepContext(newContext);

      // Consolidate with early data
      consolidateProofs(newContext, true);
    }

    // Subscribe to proof streaming manager updates
    const handleProofUpdate = (update: ProofUpdate) => {
      console.log(`[StreamingProof] ProofStreamingManager update: ${update.source}`);

      if (update.source === 'consolidation' && update.data) {
        // Direct consolidation result from manager
        setProofs(update.data.proofs || []);
        setConsolidationResult(update.data);
        setLoadingStatus(`Consolidated ${update.proofCount || 0} proofs`);
      } else if (update.data) {
        // Individual source update - merge into context
        const newContext = {
          ...contextRef.current,
          [update.source === 'review-platforms' ? 'reviewPlatforms' : 'pressMentions']: update.data
        } as DeepContext;

        contextRef.current = newContext;
        setDeepContext(newContext);

        // Update loaded sources
        const sourceName = update.source === 'review-platforms' ? 'Review Platforms' : 'Press Mentions';
        setLoadedSources(prev => prev.includes(sourceName) ? prev : [...prev, sourceName]);
        setLoadingStatus(`Loaded ${sourceName}`);

        // Trigger consolidation
        consolidateProofs(newContext);
      }
    };

    proofStreamingManager.on('proof-update', handleProofUpdate);

    return () => {
      proofStreamingManager.off('proof-update', handleProofUpdate);
    };
  }, [enabled, brand?.id, consolidateProofs]);

  return {
    proofs,
    consolidationResult,
    deepContext,
    isLoading,
    loadingStatus,
    loadedSources,
    totalSources: proofSources.length,
    percentComplete,
    error
  };
}

export default useStreamingProof;
