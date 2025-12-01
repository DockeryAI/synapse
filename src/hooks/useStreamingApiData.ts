/**
 * useStreamingApiData Hook
 *
 * Manages independent state slices for each API
 * Updates UI progressively as each API completes
 * Shows cached data immediately
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { streamingApiManager, ApiEventType, ApiUpdate, ApiStatus } from '../services/intelligence/streaming-api-manager';
import { Brand } from '../types/brand';

// Individual API data states
interface ApiDataStates {
  // YouTube (3 sources)
  youtubeTrending: any | null;
  youtubeComments: any | null;
  youtubeEngagement: any | null;

  // Apify (8 sources including new social/review sources)
  apifyWebsite: any | null;
  apifyMaps: any | null;
  apifyReviews: any | null;
  apifyInstagram: any | null;
  apifyTwitterSentiment: any | null;
  apifyQuoraInsights: any | null;
  apifyLinkedinB2b: any | null;
  apifyTrustpilotReviews: any | null;
  apifyG2Reviews: any | null;

  // OutScraper (2 sources)
  outscraperBusiness: any | null;
  outscraperReviews: any | null;

  // Serper (3 sources)
  serperSearch: any | null;
  serperQuora: any | null;
  serperNews: any | null;

  // SEMrush (4 sources)
  semrushDomain: any | null;
  semrushKeywords: any | null;
  semrushCompetitors: any | null;
  semrushBacklinks: any | null;

  // News (2 sources)
  newsBreaking: any | null;
  newsTrending: any | null;

  // Single sources
  weatherConditions: any | null;
  linkedinCompany: any | null;
  linkedinNetwork: any | null;
  perplexityResearch: any | null;
  websiteAnalysis: any | null;

  // Keywords 2.0 (2 sources)
  keywordsIntent: any | null;
  keywordsValidated: any | null;

  // Synapse 2.0 - Hidden data sources
  secEdgarIntelligence: any | null;  // SEC filings - risk factors, executive priorities
  buzzsumoPerformance: any | null;   // Content performance + trend timing
}

// Loading states for each API
interface ApiLoadingStates {
  [key: string]: boolean;
}

// Error states for each API
interface ApiErrorStates {
  [key: string]: Error | null;
}

export interface StreamingApiResult {
  data: ApiDataStates;
  loading: ApiLoadingStates;
  errors: ApiErrorStates;
  statuses: Map<ApiEventType, ApiStatus>;
  totalApis: number;
  loadedApis: number;
  failedApis: number;
  percentComplete: number;
}

export function useStreamingApiData(brand: Brand | null): StreamingApiResult {
  // Independent state slices for each API
  const [data, setData] = useState<ApiDataStates>({
    youtubeTrending: null,
    youtubeComments: null,
    youtubeEngagement: null,
    apifyWebsite: null,
    apifyMaps: null,
    apifyReviews: null,
    apifyInstagram: null,
    apifyTwitterSentiment: null,
    apifyQuoraInsights: null,
    apifyLinkedinB2b: null,
    apifyTrustpilotReviews: null,
    apifyG2Reviews: null,
    outscraperBusiness: null,
    outscraperReviews: null,
    serperSearch: null,
    serperQuora: null,
    serperNews: null,
    semrushDomain: null,
    semrushKeywords: null,
    semrushCompetitors: null,
    semrushBacklinks: null,
    newsBreaking: null,
    newsTrending: null,
    weatherConditions: null,
    linkedinCompany: null,
    linkedinNetwork: null,
    perplexityResearch: null,
    websiteAnalysis: null,
    keywordsIntent: null,
    keywordsValidated: null,
    // Synapse 2.0 - Hidden data sources
    secEdgarIntelligence: null,
    buzzsumoPerformance: null,
  });

  const [loading, setLoading] = useState<ApiLoadingStates>({});
  const [errors, setErrors] = useState<ApiErrorStates>({});
  const [statuses, setStatuses] = useState<Map<ApiEventType, ApiStatus>>(new Map());
  const hasInitialized = useRef(false);

  // Map API event types to state keys
  const eventToStateKey: Record<ApiEventType, keyof ApiDataStates> = {
    'youtube-trending': 'youtubeTrending',
    'youtube-comments': 'youtubeComments',
    'youtube-engagement': 'youtubeEngagement',
    'apify-website': 'apifyWebsite',
    'apify-maps': 'apifyMaps',
    'apify-reviews': 'apifyReviews',
    'apify-instagram': 'apifyInstagram',
    'apify-twitter-sentiment': 'apifyTwitterSentiment',
    'apify-quora-insights': 'apifyQuoraInsights',
    'apify-linkedin-b2b': 'apifyLinkedinB2b',
    'apify-trustpilot-reviews': 'apifyTrustpilotReviews',
    'apify-g2-reviews': 'apifyG2Reviews',
    'outscraper-business': 'outscraperBusiness',
    'outscraper-reviews': 'outscraperReviews',
    'serper-search': 'serperSearch',
    'serper-quora': 'serperQuora',
    'serper-news': 'serperNews',
    'semrush-domain': 'semrushDomain',
    'semrush-keywords': 'semrushKeywords',
    'semrush-competitors': 'semrushCompetitors',
    'semrush-backlinks': 'semrushBacklinks',
    'news-breaking': 'newsBreaking',
    'news-trending': 'newsTrending',
    'weather-conditions': 'weatherConditions',
    'linkedin-company': 'linkedinCompany',
    'linkedin-network': 'linkedinNetwork',
    'perplexity-research': 'perplexityResearch',
    'website-analysis': 'websiteAnalysis',
    'keywords-intent': 'keywordsIntent',
    'keywords-validated': 'keywordsValidated',
    // Synapse 2.0 - Hidden data sources
    'sec-edgar-intelligence': 'secEdgarIntelligence',
    'buzzsumo-performance': 'buzzsumoPerformance',
  };

  // Handle API updates - update ONLY the specific state slice
  const handleApiUpdate = useCallback((update: ApiUpdate) => {
    const stateKey = eventToStateKey[update.type];

    if (stateKey) {
      console.log(`[StreamingHook] Updating ${stateKey} with data`);

      // Update ONLY the specific data slice
      setData(prev => ({
        ...prev,
        [stateKey]: update.data
      }));

      // Clear loading state for this API
      setLoading(prev => ({
        ...prev,
        [update.type]: false
      }));

      // Clear any errors for this API
      setErrors(prev => ({
        ...prev,
        [update.type]: null
      }));
    }
  }, []);

  // Handle status updates
  const handleStatusUpdate = useCallback((status: ApiStatus) => {
    setStatuses(prev => {
      const newMap = new Map(prev);
      newMap.set(status.type, status);
      return newMap;
    });

    // Update loading state based on status
    if (status.status === 'loading') {
      setLoading(prev => ({
        ...prev,
        [status.type]: true
      }));
    } else if (status.status === 'success' || status.status === 'error') {
      setLoading(prev => ({
        ...prev,
        [status.type]: false
      }));

      if (status.error) {
        setErrors(prev => ({
          ...prev,
          [status.type]: status.error || null
        }));
      }
    }
  }, []);

  // Handle cached data - load ALL cached data immediately
  const handleCacheLoaded = useCallback((cachedData: any) => {
    console.log('[StreamingHook] Loading cached data for immediate display');

    // Map cached DeepContext structure to our independent states
    if (cachedData) {
      setData(prev => ({
        ...prev,
        // Update any cached data that exists
        ...(cachedData.youtube && {
          youtubeTrending: cachedData.youtube.trending,
          youtubeComments: cachedData.youtube.comments,
          youtubeEngagement: cachedData.youtube.engagement,
        }),
        ...(cachedData.apify && {
          apifyWebsite: cachedData.apify.website,
          apifyMaps: cachedData.apify.maps,
          apifyReviews: cachedData.apify.reviews,
          apifyInstagram: cachedData.apify.instagram,
        }),
        ...(cachedData.outscraper && {
          outscraperBusiness: cachedData.outscraper.business,
          outscraperReviews: cachedData.outscraper.reviews,
        }),
        ...(cachedData.serper && {
          serperSearch: cachedData.serper.search,
          serperQuora: cachedData.serper.quora,
          serperNews: cachedData.serper.news,
        }),
        ...(cachedData.semrush && {
          semrushDomain: cachedData.semrush.domain,
          semrushKeywords: cachedData.semrush.keywords,
          semrushCompetitors: cachedData.semrush.competitors,
          semrushBacklinks: cachedData.semrush.backlinks,
        }),
        ...(cachedData.news && {
          newsBreaking: cachedData.news.breaking,
          newsTrending: cachedData.news.trending,
        }),
        ...(cachedData.weather && {
          weatherConditions: cachedData.weather,
        }),
        ...(cachedData.linkedin && {
          linkedinCompany: cachedData.linkedin.company,
          linkedinNetwork: cachedData.linkedin.network,
        }),
        ...(cachedData.perplexity && {
          perplexityResearch: cachedData.perplexity,
        }),
        ...(cachedData.websiteAnalysis && {
          websiteAnalysis: cachedData.websiteAnalysis,
        }),
      }));
    }
  }, []);

  // Handle API errors
  const handleApiError = useCallback((error: { type: ApiEventType; error: Error }) => {
    console.error(`[StreamingHook] API error for ${error.type}:`, error.error);

    setErrors(prev => ({
      ...prev,
      [error.type]: error.error
    }));

    setLoading(prev => ({
      ...prev,
      [error.type]: false
    }));
  }, []);

  // Initialize streaming on mount
  useEffect(() => {
    if (!brand || hasInitialized.current) {
      return;
    }

    hasInitialized.current = true;
    console.log('[StreamingHook] Initializing streaming API data for brand:', brand.name);

    // Set up event listeners
    streamingApiManager.on('cache-loaded', handleCacheLoaded);
    streamingApiManager.on('api-update', handleApiUpdate);
    streamingApiManager.on('status-update', handleStatusUpdate);
    streamingApiManager.on('api-error', handleApiError);

    // Start loading all APIs in parallel
    streamingApiManager.loadAllApis(brand.id, brand).catch(error => {
      console.error('[StreamingHook] Failed to load APIs:', error);
    });

    // Cleanup
    return () => {
      streamingApiManager.off('cache-loaded', handleCacheLoaded);
      streamingApiManager.off('api-update', handleApiUpdate);
      streamingApiManager.off('status-update', handleStatusUpdate);
      streamingApiManager.off('api-error', handleApiError);
      streamingApiManager.reset();
      hasInitialized.current = false;
    };
  }, [brand, handleCacheLoaded, handleApiUpdate, handleStatusUpdate, handleApiError]);

  // Calculate metrics
  const totalApis = 25; // 23 original + 2 Synapse 2.0 (SEC EDGAR + BuzzSumo)
  const loadedApis = Object.values(data).filter(d => d !== null).length;
  const failedApis = Object.values(errors).filter(e => e !== null).length;
  const percentComplete = Math.round((loadedApis / totalApis) * 100);

  return {
    data,
    loading,
    errors,
    statuses,
    totalApis,
    loadedApis,
    failedApis,
    percentComplete
  };
}