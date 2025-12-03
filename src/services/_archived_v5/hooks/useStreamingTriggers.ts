/**
 * useStreamingTriggers Hook
 *
 * Streams trigger data from APIs progressively.
 * Each API completion triggers re-consolidation.
 * Uses EventEmitter architecture - no blocking.
 *
 * Created: 2025-11-28
 */

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { streamingApiManager, ApiEventType, ApiUpdate } from '@/services/intelligence/streaming-api-manager';
import { triggerConsolidationService, ConsolidatedTrigger, TriggerConsolidationResult } from '@/services/triggers/trigger-consolidation.service';
import { triggerTitleRewriterService } from '@/services/triggers/trigger-title-rewriter.service';
import { synapseDataProvider } from '@/services/v4/synapse-data-provider.service';
import type { TriggerSynthesisResult } from '@/services/triggers/llm-trigger-synthesizer.service';
import type { DeepContext } from '@/types/synapse/deepContext.types';
import type { CompleteUVP } from '@/types/uvp-flow.types';
import type { Brand } from '@/contexts/BrandContext';
import type { BusinessProfileType } from '@/services/triggers';

export interface StreamingTriggersResult {
  triggers: ConsolidatedTrigger[];
  consolidationResult: TriggerConsolidationResult | null;
  deepContext: DeepContext | null;
  isLoading: boolean;
  /** True when triggers have been processed and titles rewritten - safe to display */
  isReady: boolean;
  loadingStatus: string;
  loadedSources: string[];
  totalSources: number;
  percentComplete: number;
  error: string | null;
}

// Map API events to human-readable source names
const SOURCE_NAMES: Partial<Record<ApiEventType, string>> = {
  'apify-twitter-sentiment': 'Twitter',
  'apify-trustpilot-reviews': 'Trustpilot',
  'apify-g2-reviews': 'G2 Reviews',
  'apify-quora-insights': 'Quora',
  'apify-linkedin-b2b': 'LinkedIn',
  'serper-search': 'Google Search',
  'serper-quora': 'Quora Q&A',
  'serper-news': 'News',
  'perplexity-research': 'Perplexity AI',
  'website-analysis': 'Website',
  'youtube-comments': 'YouTube',
  'outscraper-reviews': 'Google Reviews',
  'news-breaking': 'Breaking News',
  'news-trending': 'Trending News',
  'competitor-voice': 'Competitor Reviews',  // HIGH VALUE: VoC from competitor intel
};

// Sources relevant for triggers (not all 23 APIs are useful)
const TRIGGER_SOURCES: ApiEventType[] = [
  'competitor-voice',  // PRIORITY: Load competitor VoC first (highest quality)
  'apify-twitter-sentiment',
  'apify-trustpilot-reviews',
  'apify-g2-reviews',
  'apify-quora-insights',
  'apify-linkedin-b2b',
  'serper-quora',
  'perplexity-research',
  'youtube-comments',
  'outscraper-reviews',
];

export function useStreamingTriggers(
  brand: Brand | null,
  uvp: CompleteUVP | null,
  enabled: boolean = true,
  profileType?: BusinessProfileType
): StreamingTriggersResult {
  const [deepContext, setDeepContext] = useState<DeepContext | null>(null);
  const [triggers, setTriggers] = useState<ConsolidatedTrigger[]>([]);
  const [consolidationResult, setConsolidationResult] = useState<TriggerConsolidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false); // True after title rewriting completes
  const [loadingStatus, setLoadingStatus] = useState('Waiting to start...');
  const [loadedSources, setLoadedSources] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const hasInitialized = useRef(false);
  const contextRef = useRef<Partial<DeepContext>>({});
  const consolidationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConsolidatingRef = useRef(false);

  // RESET state when disabled - ensures sample data is used in TriggersDevPage
  useEffect(() => {
    if (!enabled) {
      console.log('[StreamingTriggers] Disabled - resetting state');
      setDeepContext(null);
      setTriggers([]);
      setConsolidationResult(null);
      setIsLoading(false);
      setIsReady(false);
      setLoadedSources([]);
      setError(null);
      contextRef.current = {};
      hasInitialized.current = false;
      isConsolidatingRef.current = false;
    }
  }, [enabled]);

  // Re-consolidate triggers when context updates - DEBOUNCED + THROTTLED to prevent excessive re-runs
  // Progressive consolidation: Show triggers as data arrives, replace with LLM synthesis when ready
  const consolidateTriggers = useCallback((context: DeepContext, immediate: boolean = false) => {
    if (!uvp) {
      console.log('[StreamingTriggers] No UVP - skipping consolidation');
      return;
    }

    // Check if we have ANY usable data (not just Perplexity correlatedInsights)
    // CRITICAL FIX: Don't block on Perplexity - use Reddit, Twitter, HackerNews, etc. directly
    const hasCorrelatedInsights = (context.correlatedInsights?.length || 0) > 0;
    const hasRawData = (context.rawData?.length || 0) > 0;
    const hasSocialData = (context.socialListening?.reddit?.length || 0) > 0 ||
                          (context.socialListening?.twitter?.length || 0) > 0 ||
                          (context.socialListening?.hackernews?.length || 0) > 0;
    const hasAnyData = hasCorrelatedInsights || hasRawData || hasSocialData;

    // Progressive mode: Allow consolidation when we have ANY data source
    // This prevents blocking on Perplexity when Reddit/Twitter/HackerNews have data
    if (!immediate && !hasAnyData) {
      console.log('[StreamingTriggers] ⏳ No data yet - waiting for any source (Reddit, Twitter, HN, Perplexity)');
      return;
    }

    if (!hasCorrelatedInsights && hasAnyData) {
      console.log(`[StreamingTriggers] 🔄 Using alternate data sources: rawData=${context.rawData?.length || 0}, social=${hasSocialData}`);
    }

    // Clear any pending consolidation
    if (consolidationTimeoutRef.current) {
      clearTimeout(consolidationTimeoutRef.current);
    }

    const doConsolidate = async () => {
      // Guard: Skip if already consolidating
      if (isConsolidatingRef.current) {
        console.log('[StreamingTriggers] ⚠️ Skipping - consolidation already in progress');
        return;
      }

      try {
        isConsolidatingRef.current = true;
        console.log('[StreamingTriggers] Processing triggers data (progressive consolidation)');
        const result = triggerConsolidationService.consolidate(
          context,
          uvp,
          brand ? { name: brand.name, industry: brand.naicsCode } : undefined
        );

        // PROGRESSIVE LOADING FIX: Only update triggers if we have results
        // This prevents early batches (without correlatedInsights) from clearing triggers
        if (result.triggers.length > 0) {
          // REWRITE TITLES: Use LLM to clean up trigger titles
          console.log('[StreamingTriggers] Rewriting trigger titles with LLM...');
          const triggersToRewrite = result.triggers.map(t => ({
            id: t.id,
            rawTitle: t.title,
            rawQuote: t.evidence[0]?.quote,
            category: t.category
          }));

          try {
            const rewrittenMap = await triggerTitleRewriterService.rewriteTitles(triggersToRewrite);

            // Apply rewritten titles
            const cleanedTriggers = result.triggers.map(trigger => {
              const rewritten = rewrittenMap.get(trigger.id);
              if (rewritten) {
                return { ...trigger, title: rewritten.title };
              }
              return trigger;
            });

            setTriggers(cleanedTriggers);
            setConsolidationResult({ ...result, triggers: cleanedTriggers });
            setIsReady(true); // Mark as ready AFTER title rewriting completes
            console.log(`[StreamingTriggers] ✅ Consolidated: ${cleanedTriggers.length} triggers (titles rewritten, isReady=true)`);

            // FALLBACK: Also push consolidated triggers to synapseDataProvider
            // (LLM synthesis will overwrite these when complete, but this ensures data is available early)
            synapseDataProvider.setTriggers(cleanedTriggers);
            console.log(`[StreamingTriggers] Pushed ${cleanedTriggers.length} fallback triggers to SynapseDataProvider`);
          } catch (rewriteError) {
            // Fallback: use original titles if rewriting fails
            console.warn('[StreamingTriggers] Title rewriting failed, using original titles:', rewriteError);
            setTriggers(result.triggers);
            setConsolidationResult(result);
            setIsReady(true); // Still mark as ready, just with original titles
          }
        } else {
          console.log('[StreamingTriggers] Skipping update - consolidation returned 0 triggers');
        }
      } catch (err) {
        console.error('[StreamingTriggers] Consolidation error:', err);
        // Don't crash - keep existing triggers
      } finally {
        isConsolidatingRef.current = false;
      }
    };

    // Run consolidation (progressive mode - runs when correlatedInsights are available)
    doConsolidate();
  }, [uvp, brand]);

  // Track enabled state in ref so callbacks can check it
  const enabledRef = useRef(enabled);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // Handle API data updates - merge into context and re-consolidate
  const handleApiUpdate = useCallback((update: ApiUpdate) => {
    // Don't process updates if streaming is disabled
    if (!enabledRef.current) {
      console.log('[StreamingTriggers] Ignoring API update - streaming disabled');
      return;
    }

    const sourceName = SOURCE_NAMES[update.type];
    if (!sourceName) return; // Not a trigger-relevant source

    console.log(`[StreamingTriggers] Received data from ${sourceName}`);

    // Merge into accumulated context
    const newContext = mergeApiDataIntoContext(contextRef.current, update);
    contextRef.current = newContext;

    // Update state
    const fullContext = newContext as DeepContext;
    setDeepContext(fullContext);

    // Track loaded sources
    setLoadedSources(prev => {
      if (!prev.includes(sourceName)) {
        return [...prev, sourceName];
      }
      return prev;
    });

    // Update status
    setLoadingStatus(`Loaded ${sourceName}`);

    // Re-consolidate with new data
    consolidateTriggers(fullContext);
  }, [consolidateTriggers]);

  // Sanitize cached data to prevent memory bloat from old large caches
  const sanitizeCachedData = useCallback((data: any): any => {
    const MAX_CACHED_INSIGHTS = 100;
    const MAX_CACHED_RAW_DATA = 50;

    if (!data) return data;

    const sanitized = { ...data };

    // Cap correlatedInsights
    if (sanitized.correlatedInsights?.length > MAX_CACHED_INSIGHTS) {
      console.log(`[StreamingTriggers] Capping cached correlatedInsights from ${sanitized.correlatedInsights.length} to ${MAX_CACHED_INSIGHTS}`);
      sanitized.correlatedInsights = sanitized.correlatedInsights
        .sort((a: any, b: any) => (b.confidence || 0.85) - (a.confidence || 0.85))
        .slice(0, MAX_CACHED_INSIGHTS);
    }

    // Cap rawDataPoints
    if (sanitized.rawDataPoints?.length > MAX_CACHED_RAW_DATA) {
      console.log(`[StreamingTriggers] Capping cached rawDataPoints from ${sanitized.rawDataPoints.length} to ${MAX_CACHED_RAW_DATA}`);
      sanitized.rawDataPoints = sanitized.rawDataPoints.slice(0, MAX_CACHED_RAW_DATA);
    }

    return sanitized;
  }, []);

  // Handle cached data - only process if enabled
  const handleCacheLoaded = useCallback((cachedData: any) => {
    // Don't load cache if streaming is disabled
    if (!enabled) {
      console.log('[StreamingTriggers] Ignoring cached data - streaming disabled');
      return;
    }

    console.log('[StreamingTriggers] Loading cached data');

    if (cachedData) {
      // Sanitize to prevent memory bloat from old large caches
      const sanitizedData = sanitizeCachedData(cachedData);
      contextRef.current = sanitizedData;
      setDeepContext(sanitizedData as DeepContext);

      // Consolidate IMMEDIATELY with cached data (no debounce)
      consolidateTriggers(sanitizedData as DeepContext, true);
      setLoadingStatus('Loaded from cache - fetching fresh data...');
    }
  }, [consolidateTriggers, enabled, sanitizeCachedData]);

  // Handle errors gracefully
  const handleApiError = useCallback((errorInfo: { type: ApiEventType; error: Error }) => {
    const sourceName = SOURCE_NAMES[errorInfo.type];
    console.warn(`[StreamingTriggers] Error from ${sourceName || errorInfo.type}:`, errorInfo.error.message);
    // Don't set error state - just skip this source
    // Other sources will still work
  }, []);

  // Handle completion - all APIs loaded, now waiting for LLM synthesis
  const handleComplete = useCallback(() => {
    setLoadingStatus('Synthesizing triggers with AI...');
    // Keep isLoading true - synthesis still running
  }, []);

  // Handle LLM-synthesized triggers from Sonnet 4
  const handleTriggerSynthesis = useCallback((result: TriggerSynthesisResult) => {
    console.log(`[StreamingTriggers] Received ${result.triggers.length} Sonnet 4-synthesized triggers`);

    if (result.triggers.length > 0) {
      // Use Sonnet 4 synthesized triggers directly
      setTriggers(result.triggers);
      setLoadingStatus(`Complete: ${result.triggers.length} triggers synthesized`);
      setIsReady(true); // Mark as ready - we have quality synthesized triggers

      // CRITICAL: Push triggers to synapseDataProvider for content generation
      // This ensures ALL content generation can access the full Synapse 2.0 API data
      synapseDataProvider.setTriggers(result.triggers);
      console.log(`[StreamingTriggers] Pushed ${result.triggers.length} triggers to SynapseDataProvider`);
    } else {
      // Sonnet 4 returned no triggers - show empty state
      console.warn('[StreamingTriggers] Sonnet 4 synthesis returned no triggers');
      setLoadingStatus(`No triggers synthesized - check raw data quality`);
    }

    setIsLoading(false);
  }, []);

  // Initialize streaming
  useEffect(() => {
    if (!brand || !enabled || hasInitialized.current) {
      return;
    }

    hasInitialized.current = true;
    setIsLoading(true);
    setError(null);
    setLoadingStatus('Connecting to data sources...');

    console.log('[StreamingTriggers] Starting streaming for brand:', brand.name);

    // Set up event listeners
    streamingApiManager.on('cache-loaded', handleCacheLoaded);
    streamingApiManager.on('api-update', handleApiUpdate);
    streamingApiManager.on('api-error', handleApiError);
    streamingApiManager.on('complete', handleComplete);
    streamingApiManager.on('trigger-synthesis', handleTriggerSynthesis);

    // Start loading with profile type and UVP for intelligent API gating
    streamingApiManager.loadAllApis(brand.id, brand, {
      profileType,
      uvp,
    }).catch(err => {
      console.error('[StreamingTriggers] Failed to start streaming:', err);
      setError(err.message);
      setIsLoading(false);
    });

    // Cleanup
    return () => {
      streamingApiManager.off('cache-loaded', handleCacheLoaded);
      streamingApiManager.off('api-update', handleApiUpdate);
      streamingApiManager.off('api-error', handleApiError);
      streamingApiManager.off('complete', handleComplete);
      streamingApiManager.off('trigger-synthesis', handleTriggerSynthesis);
      hasInitialized.current = false;
      // Clear any pending consolidation timeout
      if (consolidationTimeoutRef.current) {
        clearTimeout(consolidationTimeoutRef.current);
      }
    };
  }, [brand, enabled, profileType, uvp, handleCacheLoaded, handleApiUpdate, handleApiError, handleComplete, handleTriggerSynthesis]);

  // Calculate progress
  const totalSources = TRIGGER_SOURCES.length;
  const percentComplete = Math.round((loadedSources.length / totalSources) * 100);

  return {
    triggers,
    consolidationResult,
    deepContext,
    isLoading,
    isReady,
    loadingStatus,
    loadedSources,
    totalSources,
    percentComplete,
    error,
  };
}

/**
 * Merge API update data into accumulated DeepContext
 */
function mergeApiDataIntoContext(
  existing: Partial<DeepContext>,
  update: ApiUpdate
): Partial<DeepContext> {
  const merged = { ...existing };

  // Initialize arrays if needed
  if (!merged.rawDataPoints) merged.rawDataPoints = [];
  if (!merged.correlatedInsights) merged.correlatedInsights = [];
  if (!merged.customerPsychology) {
    merged.customerPsychology = { emotional: [], functional: [], decisionFactors: [] };
  }

  // Map API data to DeepContext structure based on source type
  switch (update.type) {
    case 'apify-trustpilot-reviews':
    case 'apify-g2-reviews':
    case 'outscraper-reviews':
      // Review data → customerPsychology.emotional + rawDataPoints
      if (update.data?.reviews) {
        update.data.reviews.forEach((review: any) => {
          if (review.text || review.content) {
            merged.rawDataPoints!.push({
              id: `${update.type}-${Date.now()}-${Math.random()}`,
              type: 'customer_trigger',
              content: review.text || review.content,
              source: SOURCE_NAMES[update.type] || update.type,
              metadata: {
                confidence: review.rating ? review.rating / 5 : 0.7,
                author: review.author,
                url: review.url,
              }
            });
          }
        });
      }
      break;

    case 'apify-twitter-sentiment':
      // Twitter data → rawDataPoints
      if (update.data?.tweets) {
        update.data.tweets.forEach((tweet: any) => {
          merged.rawDataPoints!.push({
            id: `twitter-${tweet.id || Date.now()}`,
            type: 'community_discussion',
            content: tweet.text || tweet.content,
            source: 'Twitter',
            metadata: {
              confidence: 0.75,
              author: tweet.author,
              url: tweet.url,
            }
          });
        });
      }
      break;

    case 'perplexity-research':
      // Perplexity insights → correlatedInsights
      // NEW FORMAT: { insightsWithSources: [{insight, sources: [{title, url, excerpt}]}], ... }
      // OLD FORMAT: { insights: string[], sources: [{title, url, excerpt}], ... }
      const MAX_PERPLEXITY_INSIGHTS = 100;

      // PREFER new format with per-insight sources
      if (update.data?.insightsWithSources && Array.isArray(update.data.insightsWithSources)) {
        const totalInsights = update.data.insightsWithSources.length;
        const cappedInsights = update.data.insightsWithSources.slice(0, MAX_PERPLEXITY_INSIGHTS);
        console.log(`[StreamingTriggers] Processing ${cappedInsights.length} of ${totalInsights} Perplexity insights WITH per-insight sources`);

        let sourcesFoundCount = 0;
        cappedInsights.forEach((item: { insight: string; sources: Array<{ title: string; url: string; excerpt: string }> }, idx: number) => {
          if (item.insight && item.insight.length > 10) {
            const insightSources = item.sources || [];
            if (insightSources.length > 0 && insightSources[0]?.url) {
              sourcesFoundCount++;
            }
            merged.correlatedInsights!.push({
              id: `perplexity-${Date.now()}-${idx}`,
              type: 'validated_pain',
              insight: item.insight,
              confidence: update.data.confidence || 0.85,
              // Use PER-INSIGHT sources (not global)
              sources: insightSources.map((s: any) => s.title || s.url || 'Perplexity'),
              // Store full source details with URLs for this specific insight
              sourceDetails: insightSources.map((s: any) => ({
                title: s.title || 'Source',
                url: s.url || '',
                excerpt: s.excerpt || ''
              })),
              evidenceCount: 1,
            });
          }
        });
        console.log(`[StreamingTriggers] Added ${merged.correlatedInsights!.length} correlatedInsights, ${sourcesFoundCount} have source URLs`);
      }
      // FALLBACK: Old format without per-insight sources (will be filtered out later)
      else if (update.data?.insights && Array.isArray(update.data.insights)) {
        console.log(`[StreamingTriggers] ⚠️ Perplexity returned OLD format without per-insight sources - these will be filtered`);
        const totalInsights = update.data.insights.length;
        const cappedInsights = update.data.insights.slice(0, MAX_PERPLEXITY_INSIGHTS);
        const perplexitySources = update.data.sources || [];
        cappedInsights.forEach((insight: string | any, idx: number) => {
          const insightText = typeof insight === 'string' ? insight : (insight.text || insight.content || String(insight));
          if (insightText && insightText.length > 10) {
            merged.correlatedInsights!.push({
              id: `perplexity-${Date.now()}-${idx}`,
              type: 'validated_pain',
              insight: insightText,
              confidence: update.data.confidence || 0.85,
              sources: perplexitySources.length > 0
                ? perplexitySources.map((s: any) => s.title || s.url || 'Perplexity')
                : ['Perplexity AI'],
              sourceDetails: perplexitySources.map((s: any) => ({
                title: s.title || 'Source',
                url: s.url || '',
                excerpt: s.excerpt || ''
              })),
              evidenceCount: 1,
            });
          }
        });
        console.log(`[StreamingTriggers] Added ${merged.correlatedInsights!.length} correlatedInsights (OLD FORMAT - no per-insight URLs)`);
      }
      break;

    case 'youtube-comments':
      // YouTube comments → rawDataPoints
      if (update.data?.comments) {
        update.data.comments.forEach((comment: any) => {
          merged.rawDataPoints!.push({
            id: `youtube-${comment.id || Date.now()}`,
            type: 'community_discussion',
            content: comment.text || comment.content,
            source: 'YouTube',
            metadata: {
              confidence: 0.7,
              author: comment.author,
            }
          });
        });
      }
      break;

    case 'serper-quora':
    case 'apify-quora-insights':
      // Quora Q&A → rawDataPoints
      if (update.data?.questions || update.data?.answers) {
        const items = [...(update.data.questions || []), ...(update.data.answers || [])];
        items.forEach((item: any) => {
          merged.rawDataPoints!.push({
            id: `quora-${item.id || Date.now()}`,
            type: 'pain_point',
            content: item.text || item.content || item.question || item.answer,
            source: 'Quora',
            metadata: {
              confidence: 0.8,
              url: item.url,
            }
          });
        });
      }
      break;

    case 'competitor-voice':
      // HIGH VALUE: Voice of Customer data from competitor intelligence
      // Contains pain_points, desires, objections, switching_triggers from competitor reviews
      if (update.data?.insightsWithSources && Array.isArray(update.data.insightsWithSources)) {
        const insights = update.data.insightsWithSources;
        console.log(`[StreamingTriggers] Processing ${insights.length} competitor voice insights (HIGH VALUE)`);

        insights.forEach((item: { insight: string; sources: Array<{ title: string; url: string; excerpt: string }>; category?: string }, idx: number) => {
          if (item.insight && item.insight.length > 10) {
            const insightSources = item.sources || [];
            merged.correlatedInsights!.push({
              id: `competitor-voice-${Date.now()}-${idx}`,
              type: 'validated_pain',  // Competitor VoC is validated customer feedback
              insight: item.insight,
              confidence: update.data.confidence || 0.9,  // High confidence - real customer quotes
              sources: insightSources.map((s: any) => s.title || 'Competitor Review'),
              sourceDetails: insightSources.map((s: any) => ({
                title: s.title || 'Competitor Review',
                url: s.url || '',
                excerpt: s.excerpt || ''
              })),
              evidenceCount: 1,
              // Pass through category if provided (pain-point, desire, objection, fear)
              category: item.category,
            });
          }
        });
        console.log(`[StreamingTriggers] Added ${insights.length} competitor voice insights to correlatedInsights`);
      }
      break;

    default:
      // Generic handling for other sources
      if (update.data?.items || update.data?.results) {
        const items = update.data.items || update.data.results;
        items.forEach((item: any) => {
          if (item.text || item.content || item.description) {
            merged.rawDataPoints!.push({
              id: `${update.type}-${Date.now()}-${Math.random()}`,
              type: 'customer_trigger',
              content: item.text || item.content || item.description,
              source: SOURCE_NAMES[update.type] || update.type,
              metadata: { confidence: 0.7 }
            });
          }
        });
      }
  }

  return merged;
}
