/**
 * useStreamingLocal Hook
 *
 * Fetches and processes local events/news data for the Local 2.0 tab.
 * Similar pattern to useStreamingTrends but focused on community pulse.
 */

import { useState, useCallback, useRef } from 'react';
import type { CompleteUVP } from '@/types/uvp-flow.types';
import type {
  LocalPipelineResult,
  LocalPipelineState,
  LocalInsight,
  LocalQueryConfig,
  LocalLocation,
  RawSerperNewsItem,
  RawPerplexityInsight,
} from '@/services/local/types';
import {
  buildLocalQueryConfig,
  buildLocalQueryConfigWithLocation,
  generateLocalQueries,
} from '@/services/local/local-query-generator.service';
import {
  processNewsItem,
  processPerplexityInsight,
  deduplicateInsights,
} from '@/services/local/local-relevance-scorer.service';
import { SerperAPI } from '@/services/intelligence/serper-api';
import { PerplexityAPI } from '@/services/uvp-wizard/perplexity-api';

// ============================================================================
// CONSTANTS
// ============================================================================

const CACHE_KEY = 'synapse_local_2_0_cache';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// ============================================================================
// CACHE HELPERS
// ============================================================================

interface CachedData {
  result: LocalPipelineResult;
  timestamp: number;
  location: string;
}

function getCachedData(location: string): LocalPipelineResult | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data: CachedData = JSON.parse(cached);

    // Check if expired
    if (Date.now() - data.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    // Check if same location
    if (data.location !== location) {
      return null;
    }

    return data.result;
  } catch {
    return null;
  }
}

function setCachedData(result: LocalPipelineResult, location: string): void {
  try {
    const data: CachedData = {
      result,
      timestamp: Date.now(),
      location,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('[useStreamingLocal] Failed to cache data:', err);
  }
}

function clearCachedData(): void {
  localStorage.removeItem(CACHE_KEY);
}

// ============================================================================
// HOOK
// ============================================================================

interface UseStreamingLocalOptions {
  manualLocation?: LocalLocation;
}

export interface UseStreamingLocalReturn {
  state: LocalPipelineState;
  result: LocalPipelineResult | null;
  hasCachedData: boolean;
  executePipeline: (uvp: CompleteUVP) => Promise<void>;
  clearCache: () => void;
  isLoading: boolean;
  isComplete: boolean;
  hasError: boolean;
}

export function useStreamingLocal(options: UseStreamingLocalOptions = {}): UseStreamingLocalReturn {
  const { manualLocation } = options;

  const [state, setState] = useState<LocalPipelineState>({
    stage: 'idle',
    progress: 0,
    statusMessage: 'Ready to scan local events',
  });

  const [result, setResult] = useState<LocalPipelineResult | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check for cached data
  const locationKey = manualLocation ? `${manualLocation.city}, ${manualLocation.state}` : 'unknown';
  const cachedResult = getCachedData(locationKey);
  const hasCachedData = !!cachedResult || !!result;

  // Initialize with cached data if available
  if (cachedResult && !result) {
    setResult(cachedResult);
  }

  const updateState = useCallback((updates: Partial<LocalPipelineState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const executePipeline = useCallback(async (uvp: CompleteUVP) => {
    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const apisUsed: string[] = [];
    const allInsights: LocalInsight[] = [];

    try {
      // Stage 1: Extract location
      updateState({
        stage: 'extracting',
        progress: 10,
        statusMessage: 'Extracting location from UVP...',
      });

      let config: LocalQueryConfig | null;

      if (manualLocation) {
        config = buildLocalQueryConfigWithLocation(uvp, manualLocation);
      } else {
        config = buildLocalQueryConfig(uvp);
      }

      if (!config) {
        throw new Error('Could not extract location from UVP. Please provide location manually.');
      }

      const locationString = `${config.location.city}, ${config.location.state}`;
      console.log('[useStreamingLocal] Location:', locationString);
      console.log('[useStreamingLocal] Industry:', config.industry);

      // Stage 2: Generate queries
      updateState({
        stage: 'generating_queries',
        progress: 20,
        statusMessage: 'Generating location-aware queries...',
      });

      const queries = generateLocalQueries(config);
      console.log('[useStreamingLocal] Generated queries:', queries);

      // Stage 3: Fetch news
      updateState({
        stage: 'fetching_news',
        progress: 35,
        statusMessage: 'Fetching local news...',
      });

      try {
        // Run first 3 news queries
        const newsPromises = queries.newsQueries.slice(0, 3).map(async (query) => {
          const results = await SerperAPI.getNews(query, config!.location.city);
          return results;
        });

        const newsResults = await Promise.all(newsPromises);
        const allNews = newsResults.flat() as RawSerperNewsItem[];
        apisUsed.push('serper_news');

        console.log(`[useStreamingLocal] Fetched ${allNews.length} news items`);

        // Process news items - pass UVP for alignment scoring
        // Filter out null results (negative news, garbage content)
        for (const item of allNews) {
          const insight = processNewsItem(item, config!, uvp);
          if (insight) {
            allInsights.push(insight);
          }
        }
      } catch (err) {
        console.warn('[useStreamingLocal] News fetch failed:', err);
      }

      updateState({
        stage: 'fetching_news',
        progress: 50,
        statusMessage: `Found ${allInsights.length} news items...`,
      });

      // Stage 4: Fetch places (for event venues)
      updateState({
        stage: 'fetching_places',
        progress: 60,
        statusMessage: 'Searching for local events and venues...',
      });

      // Note: Places API is more for business discovery than events
      // We'll skip it for now and rely on news + perplexity
      // Could be enabled later for venue discovery

      // Stage 5: Perplexity synthesis
      updateState({
        stage: 'fetching_perplexity',
        progress: 70,
        statusMessage: 'AI-powered local event discovery...',
      });

      try {
        const perplexityQuery = queries.perplexityQueries[0];
        const perplexity = new PerplexityAPI();

        const response = await perplexity.getIndustryInsights({
          query: perplexityQuery,
          context: {
            industry: config.industry,
          },
          max_results: 10,
        });

        apisUsed.push('perplexity');

        // Try to parse as JSON array
        for (const insight of response.insights) {
          try {
            // Check if it's JSON
            if (insight.startsWith('{') || insight.startsWith('[')) {
              const parsed = JSON.parse(insight);
              const items = Array.isArray(parsed) ? parsed : [parsed];

              for (const item of items) {
                if (item.title && item.description) {
                  const processed = processPerplexityInsight(item as RawPerplexityInsight, config!, uvp);
                  if (processed) {
                    allInsights.push(processed);
                  }
                }
              }
            } else {
              // Plain text insight - create basic insight
              const processed = processPerplexityInsight({
                title: insight.substring(0, 100),
                description: insight,
              }, config!, uvp);
              if (processed) {
                allInsights.push(processed);
              }
            }
          } catch {
            // Plain text fallback
            const processed = processPerplexityInsight({
              title: insight.substring(0, 100),
              description: insight,
            }, config!, uvp);
            if (processed) {
              allInsights.push(processed);
            }
          }
        }

        console.log(`[useStreamingLocal] Perplexity added ${response.insights.length} insights`);
      } catch (err) {
        console.warn('[useStreamingLocal] Perplexity fetch failed:', err);
      }

      // Stage 6: Scoring and validation
      updateState({
        stage: 'scoring',
        progress: 85,
        statusMessage: 'Scoring and validating insights...',
      });

      // Deduplicate
      const deduped = deduplicateInsights(allInsights);
      console.log(`[useStreamingLocal] Deduplicated: ${allInsights.length} → ${deduped.length}`);

      // Sort by relevance score
      const sorted = deduped.sort((a, b) => b.relevanceScore - a.relevanceScore);

      // Calculate stats
      const stats = {
        rawCount: allInsights.length,
        validatedCount: sorted.length,
        highRelevanceCount: sorted.filter(i => i.relevanceScore >= 70).length,
        byType: {
          event: sorted.filter(i => i.type === 'event').length,
          news: sorted.filter(i => i.type === 'news').length,
          community: sorted.filter(i => i.type === 'community').length,
          school: sorted.filter(i => i.type === 'school').length,
          sports: sorted.filter(i => i.type === 'sports').length,
          charity: sorted.filter(i => i.type === 'charity').length,
        },
      };

      // Build result
      const pipelineResult: LocalPipelineResult = {
        insights: sorted,
        stats,
        apisUsed,
        location: locationString,
        generatedAt: new Date().toISOString(),
      };

      // Cache result
      setCachedData(pipelineResult, locationString);

      // Update state
      setResult(pipelineResult);
      updateState({
        stage: 'complete',
        progress: 100,
        statusMessage: `Found ${sorted.length} local insights`,
      });

      console.log('[useStreamingLocal] Pipeline complete:', stats);

    } catch (err) {
      console.error('[useStreamingLocal] Pipeline error:', err);
      updateState({
        stage: 'error',
        progress: 0,
        statusMessage: 'Pipeline failed',
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }, [manualLocation, updateState]);

  const clearCache = useCallback(() => {
    clearCachedData();
    setResult(null);
    setState({
      stage: 'idle',
      progress: 0,
      statusMessage: 'Cache cleared. Ready to scan.',
    });
  }, []);

  return {
    state,
    result: result || cachedResult,
    hasCachedData,
    executePipeline,
    clearCache,
    isLoading: ['extracting', 'generating_queries', 'fetching_news', 'fetching_places', 'fetching_perplexity', 'scoring'].includes(state.stage),
    isComplete: state.stage === 'complete',
    hasError: state.stage === 'error',
  };
}

export default useStreamingLocal;
