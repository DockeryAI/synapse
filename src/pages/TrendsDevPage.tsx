/**
 * Trends Dev Page - Dashboard Mirror
 *
 * Isolated testing page for Trends tab development.
 * Uses manual API fetch - APIs only fire when button is clicked.
 * Shares UVP sidebar design with main dashboard.
 *
 * Created: 2025-11-29
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UVPBuildingBlocks } from '@/components/v4/V4PowerModePanel';
import { useBrand } from '@/hooks/useBrand';
import { getUVPByBrand } from '@/services/database/marba-uvp.service';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2,
  RefreshCw,
  Sparkles,
  Database,
  Zap,
  Trash2,
  Target,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Heart,
  Award,
  BarChart3,
  Download,
  ExternalLink,
  Calendar,
  Globe,
  Youtube,
  MessageSquare,
  Newspaper,
  Search
} from 'lucide-react';
import type { DeepContext } from '@/types/synapse/deepContext.types';
import type { CompleteUVP } from '@/types/uvp-flow.types';

// Import APIs for trend data
import { SerperAPI } from '@/services/intelligence/serper-api';
import { YouTubeAPI } from '@/services/intelligence/youtube-api';
import { redditAPI } from '@/services/intelligence/reddit-apify-api';
import { perplexityAPI } from '@/services/uvp-wizard/perplexity-api';

// ============================================================================
// PERSISTENT CACHE - Saves trend data to localStorage
// ============================================================================

const TRENDS_DEV_CACHE_KEY = 'trendsDevPage_trends_v1';
const TRENDS_DEV_CONTEXT_KEY = 'trendsDevPage_context_v1';

interface TrendItem {
  id: string;
  title: string;
  description: string;
  source: 'serper' | 'youtube' | 'reddit' | 'perplexity' | 'news';
  sourceUrl?: string;
  relevanceScore: number;
  growthRate?: number;
  volume?: number;
  date?: string;
  metadata?: Record<string, any>;
}

interface TrendsCache {
  trends: TrendItem[];
  fetchedAt: string;
  brandName: string;
  industry?: string;
}

function loadCachedTrends(): TrendsCache | null {
  try {
    const cached = localStorage.getItem(TRENDS_DEV_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      console.log('[TrendsDevPage] Loaded cached trends:', parsed.trends?.length || 0);
      return parsed;
    }
  } catch (err) {
    console.warn('[TrendsDevPage] Failed to load cached trends:', err);
  }
  return null;
}

function saveCachedTrends(cache: TrendsCache): void {
  try {
    localStorage.setItem(TRENDS_DEV_CACHE_KEY, JSON.stringify(cache));
    console.log('[TrendsDevPage] Saved trends to cache:', cache.trends.length);
  } catch (err) {
    console.error('[TrendsDevPage] Failed to save trends:', err);
  }
}

function loadCachedContext(): DeepContext | null {
  try {
    const cached = localStorage.getItem(TRENDS_DEV_CONTEXT_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    console.warn('[TrendsDevPage] Failed to load cached context:', err);
  }
  return null;
}

function saveCachedContext(context: DeepContext): void {
  try {
    localStorage.setItem(TRENDS_DEV_CONTEXT_KEY, JSON.stringify(context));
  } catch (err) {
    console.error('[TrendsDevPage] Failed to save context:', err);
  }
}

// ============================================================================
// FILTER TYPES
// ============================================================================

type FilterType = 'all' | 'triggers' | 'proof' | 'trends' | 'gaps';
type TrendSourceFilter = 'all' | 'serper' | 'youtube' | 'reddit' | 'perplexity' | 'news';

const FILTER_CONFIG: Record<FilterType, { label: string; icon: React.ElementType; color: string }> = {
  all: { label: 'All', icon: BarChart3, color: 'purple' },
  triggers: { label: 'Triggers', icon: Heart, color: 'red' },
  proof: { label: 'Proof', icon: Award, color: 'blue' },
  trends: { label: 'Trends', icon: TrendingUp, color: 'green' },
  gaps: { label: 'Gaps', icon: Target, color: 'orange' }
};

const SOURCE_FILTER_CONFIG: Record<TrendSourceFilter, { label: string; icon: React.ElementType }> = {
  all: { label: 'All Sources', icon: Globe },
  serper: { label: 'Search Trends', icon: Search },
  youtube: { label: 'YouTube', icon: Youtube },
  reddit: { label: 'Reddit', icon: MessageSquare },
  perplexity: { label: 'AI Insights', icon: Sparkles },
  news: { label: 'News', icon: Newspaper }
};

// ============================================================================
// TREND CARD COMPONENT
// ============================================================================

interface TrendCardProps {
  trend: TrendItem;
  isSelected: boolean;
  onToggle: () => void;
}

function TrendCard({ trend, isSelected, onToggle }: TrendCardProps) {
  const sourceConfig = SOURCE_FILTER_CONFIG[trend.source] || SOURCE_FILTER_CONFIG.all;
  const SourceIcon = sourceConfig.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      onClick={onToggle}
      className={`p-4 rounded-xl border cursor-pointer transition-all ${
        isSelected
          ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-md'
          : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-green-300 hover:shadow-sm'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            trend.source === 'youtube' ? 'bg-red-100 text-red-600' :
            trend.source === 'reddit' ? 'bg-orange-100 text-orange-600' :
            trend.source === 'perplexity' ? 'bg-purple-100 text-purple-600' :
            trend.source === 'news' ? 'bg-blue-100 text-blue-600' :
            'bg-green-100 text-green-600'
          }`}>
            <SourceIcon className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {sourceConfig.label}
          </span>
        </div>
        {trend.relevanceScore > 0 && (
          <span className={`px-2 py-0.5 text-xs font-medium rounded ${
            trend.relevanceScore >= 80 ? 'bg-green-100 text-green-700' :
            trend.relevanceScore >= 60 ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {trend.relevanceScore}% relevant
          </span>
        )}
      </div>

      {/* Title */}
      <h4 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
        {trend.title}
      </h4>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-3">
        {trend.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          {trend.growthRate && (
            <span className="flex items-center gap-1 text-green-600">
              <TrendingUp className="w-3 h-3" />
              +{trend.growthRate}%
            </span>
          )}
          {trend.volume && (
            <span>{trend.volume.toLocaleString()} searches</span>
          )}
          {trend.date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {trend.date}
            </span>
          )}
        </div>
        {trend.sourceUrl && (
          <a
            href={trend.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-blue-500 hover:text-blue-700"
          >
            <ExternalLink className="w-3 h-3" />
            Source
          </a>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TrendsDevPage() {
  const { currentBrand } = useBrand();
  const [selectedTrends, setSelectedTrends] = useState<string[]>([]);
  const [uvp, setUvp] = useState<CompleteUVP | null>(null);
  const [uvpLoading, setUvpLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('trends');
  const [sourceFilter, setSourceFilter] = useState<TrendSourceFilter>('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Cached data
  const [trendsCache, setTrendsCache] = useState<TrendsCache | null>(() => loadCachedTrends());
  const [cachedContext, setCachedContext] = useState<DeepContext | null>(() => loadCachedContext());

  // Load UVP from database
  useEffect(() => {
    async function loadUVP() {
      if (!currentBrand?.id) {
        setUvpLoading(false);
        return;
      }

      try {
        const uvpData = await getUVPByBrand(currentBrand.id);
        if (uvpData) {
          setUvp(uvpData);
          console.log('[TrendsDevPage] Loaded UVP from database');
        }
      } catch (err) {
        console.error('[TrendsDevPage] Failed to load UVP:', err);
      } finally {
        setUvpLoading(false);
      }
    }

    loadUVP();
  }, [currentBrand?.id]);

  // Derived state
  const brandName = currentBrand?.name || 'Brand';
  const industry = uvp?.targetCustomer?.industry || currentBrand?.naicsCode || 'Technology';
  const hasCachedData = trendsCache && trendsCache.trends.length > 0;
  const dataStatus = hasCachedData ? 'cached' : 'empty';

  // Filter trends by source
  const filteredTrends = useMemo(() => {
    if (!trendsCache?.trends) return [];
    if (sourceFilter === 'all') return trendsCache.trends;
    return trendsCache.trends.filter(t => t.source === sourceFilter);
  }, [trendsCache, sourceFilter]);

  // Source counts
  const sourceCounts = useMemo(() => {
    if (!trendsCache?.trends) return { all: 0, serper: 0, youtube: 0, reddit: 0, perplexity: 0, news: 0 };
    return {
      all: trendsCache.trends.length,
      serper: trendsCache.trends.filter(t => t.source === 'serper').length,
      youtube: trendsCache.trends.filter(t => t.source === 'youtube').length,
      reddit: trendsCache.trends.filter(t => t.source === 'reddit').length,
      perplexity: trendsCache.trends.filter(t => t.source === 'perplexity').length,
      news: trendsCache.trends.filter(t => t.source === 'news').length
    };
  }, [trendsCache]);

  // ============================================================================
  // FETCH TRENDS - Manual API calls
  // ============================================================================

  const handleFetchTrends = useCallback(async () => {
    if (!currentBrand?.id) {
      alert('No brand selected. Please complete onboarding first.');
      return;
    }

    setIsLoading(true);
    setLoadingProgress(0);
    const allTrends: TrendItem[] = [];

    try {
      // 1. Serper Search Trends (20%)
      setLoadingStatus('Fetching search trends...');
      setLoadingProgress(10);
      try {
        const searchQuery = `${industry} trends 2024`;
        const searchResults = await SerperAPI.searchGoogle(searchQuery);

        if (searchResults && searchResults.length > 0) {
          const serperTrends: TrendItem[] = searchResults.slice(0, 10).map((result, idx) => ({
            id: `serper-${Date.now()}-${idx}`,
            title: result.title || 'Search Trend',
            description: result.snippet || '',
            source: 'serper' as const,
            sourceUrl: result.link,
            relevanceScore: Math.max(60, 100 - idx * 5),
            date: new Date().toLocaleDateString()
          }));
          allTrends.push(...serperTrends);
          console.log('[TrendsDevPage] Serper trends:', serperTrends.length);
        }
      } catch (err) {
        console.warn('[TrendsDevPage] Serper search failed:', err);
      }

      // 2. Serper News (40%)
      setLoadingStatus('Fetching news trends...');
      setLoadingProgress(30);
      try {
        const newsQuery = `${industry} latest news trends`;
        const newsResults = await SerperAPI.getNews(newsQuery);

        if (newsResults && newsResults.length > 0) {
          const newsTrends: TrendItem[] = newsResults.slice(0, 10).map((result, idx) => ({
            id: `news-${Date.now()}-${idx}`,
            title: result.title || 'News Trend',
            description: result.snippet || '',
            source: 'news' as const,
            sourceUrl: result.link,
            relevanceScore: Math.max(65, 100 - idx * 4),
            date: result.date || new Date().toLocaleDateString()
          }));
          allTrends.push(...newsTrends);
          console.log('[TrendsDevPage] News trends:', newsTrends.length);
        }
      } catch (err) {
        console.warn('[TrendsDevPage] News search failed:', err);
      }

      // 3. YouTube Video Trends (60%)
      setLoadingStatus('Fetching YouTube trends...');
      setLoadingProgress(50);
      try {
        const ytQuery = `${industry} trends`;
        const ytResults = await YouTubeAPI.searchVideos([ytQuery]);

        if (ytResults && ytResults.length > 0) {
          const ytTrends: TrendItem[] = ytResults.slice(0, 8).map((video, idx) => ({
            id: `youtube-${Date.now()}-${idx}`,
            title: video.title || 'YouTube Trend',
            description: video.description || `Video about ${industry} trends`,
            source: 'youtube' as const,
            sourceUrl: `https://youtube.com/watch?v=${video.id}`,
            relevanceScore: Math.max(60, 95 - idx * 5),
            volume: video.viewCount,
            date: video.publishedAt || new Date().toLocaleDateString()
          }));
          allTrends.push(...ytTrends);
          console.log('[TrendsDevPage] YouTube trends:', ytTrends.length);
        }
      } catch (err) {
        console.warn('[TrendsDevPage] YouTube search failed:', err);
      }

      // 4. Reddit Discussions (80%)
      setLoadingStatus('Fetching Reddit discussions...');
      setLoadingProgress(70);
      try {
        const redditQuery = `${industry} trends`;
        const redditResults = await redditAPI.mineIntelligence(redditQuery, { limit: 10 });

        if (redditResults && redditResults.insights && redditResults.insights.length > 0) {
          const redditTrends: TrendItem[] = redditResults.insights.slice(0, 8).map((insight, idx) => ({
            id: `reddit-${Date.now()}-${idx}`,
            title: insight.painPoint || insight.desire || 'Reddit Discussion',
            description: insight.context?.substring(0, 200) || `Discussion about ${industry}`,
            source: 'reddit' as const,
            sourceUrl: insight.url,
            relevanceScore: Math.max(55, 90 - idx * 5),
            volume: insight.upvotes,
            date: new Date().toLocaleDateString()
          }));
          allTrends.push(...redditTrends);
          console.log('[TrendsDevPage] Reddit trends:', redditTrends.length);
        }
      } catch (err) {
        console.warn('[TrendsDevPage] Reddit search failed:', err);
      }

      // 5. Perplexity AI Insights (100%)
      setLoadingStatus('Generating AI insights...');
      setLoadingProgress(85);
      try {
        const aiQuery = `What are the top 5 emerging trends in ${industry} that businesses should know about in 2024? Include specific data points.`;
        const aiResult = await perplexityAPI.getIndustryInsights({
          query: aiQuery,
          context: { industry },
          max_results: 5
        });

        if (aiResult && aiResult.insights && aiResult.insights.length > 0) {
          const aiTrends: TrendItem[] = aiResult.insights.slice(0, 5).map((insight, idx) => ({
            id: `perplexity-${Date.now()}-${idx}`,
            title: insight.substring(0, 100).replace(/^\d+\.\s*/, '').trim(),
            description: insight.length > 100 ? insight.substring(100) : `AI-identified trend in ${industry}`,
            source: 'perplexity' as const,
            relevanceScore: Math.max(70, 95 - idx * 5),
            date: new Date().toLocaleDateString()
          }));
          allTrends.push(...aiTrends);
          console.log('[TrendsDevPage] Perplexity trends:', aiTrends.length);
        }
      } catch (err) {
        console.warn('[TrendsDevPage] Perplexity failed:', err);
      }

      // Sort by relevance
      allTrends.sort((a, b) => b.relevanceScore - a.relevanceScore);

      // Save to cache
      const cache: TrendsCache = {
        trends: allTrends,
        fetchedAt: new Date().toISOString(),
        brandName,
        industry
      };
      saveCachedTrends(cache);
      setTrendsCache(cache);

      setLoadingStatus('Complete!');
      setLoadingProgress(100);
      console.log('[TrendsDevPage] Total trends fetched:', allTrends.length);

    } catch (err) {
      console.error('[TrendsDevPage] Fetch failed:', err);
      setLoadingStatus('Error fetching trends');
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        setLoadingStatus('');
        setLoadingProgress(0);
      }, 500);
    }
  }, [currentBrand, brandName, industry]);

  // ============================================================================
  // CLEAR CACHE
  // ============================================================================

  const handleClearCache = useCallback(() => {
    console.log('[TrendsDevPage] Clearing cache...');
    localStorage.removeItem(TRENDS_DEV_CACHE_KEY);
    localStorage.removeItem(TRENDS_DEV_CONTEXT_KEY);
    setTrendsCache(null);
    setCachedContext(null);
    setSelectedTrends([]);
    console.log('[TrendsDevPage] Cache cleared');
  }, []);

  // Toggle trend selection
  const handleToggle = useCallback((id: string) => {
    setSelectedTrends(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  }, []);

  // Status config
  const statusConfig = {
    loading: { color: 'bg-gray-100 text-gray-700' },
    cached: { color: 'bg-green-100 text-green-700' },
    fresh: { color: 'bg-blue-100 text-blue-700' },
    empty: { color: 'bg-gray-100 text-gray-500' }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-slate-900">
      {/* Top Bar */}
      <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Title & Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Trends 2.0</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {uvpLoading ? (
                    <span className="text-yellow-600">Loading UVP...</span>
                  ) : !uvp ? (
                    <span className="text-red-600">No UVP found</span>
                  ) : isLoading ? (
                    <span className="text-green-600">Loading... {loadingProgress}%</span>
                  ) : hasCachedData ? (
                    <span className="text-green-600">{trendsCache.trends.length} trends loaded</span>
                  ) : (
                    <span>Click "Fetch Trends" to load</span>
                  )}
                </p>
              </div>
            </div>

            <div className="h-6 w-px bg-gray-200 dark:bg-slate-700" />

            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-500">Brand:</span>
              <span className="font-medium text-gray-900 dark:text-white">{brandName}</span>
              <span className={`px-2 py-0.5 text-xs rounded ${statusConfig[dataStatus].color}`}>
                {dataStatus === 'cached' ? 'Cached' : 'No Data'}
              </span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Clear Cache button */}
            {hasCachedData && (
              <button
                onClick={handleClearCache}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Clear Cache
              </button>
            )}

            {/* Fetch Trends button */}
            <button
              onClick={handleFetchTrends}
              disabled={isLoading || !currentBrand?.id}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-semibold transition-all ${
                isLoading
                  ? 'bg-green-100 text-green-600 cursor-wait'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-md hover:shadow-lg disabled:opacity-50'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {loadingStatus}
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Fetch Trends
                </>
              )}
            </button>
          </div>
        </div>

        {/* Loading Bar */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3"
          >
            <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${loadingProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
              <span>{loadingStatus}</span>
              <span>{loadingProgress}%</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Main Content - Three Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - UVP Building Blocks */}
        <AnimatePresence initial={false}>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0 border-r border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden"
            >
              <div className="w-[280px] h-full flex flex-col">
                <ScrollArea className="flex-1">
                  {uvp && (
                    <UVPBuildingBlocks
                      uvp={uvp}
                      deepContext={cachedContext}
                      onSelectItem={(item) => {
                        console.log('[TrendsDevPage] UVP item selected:', item);
                      }}
                    />
                  )}
                  {!uvp && uvpLoading && (
                    <div className="p-4 text-sm text-gray-500">Loading UVP data...</div>
                  )}
                  {!uvp && !uvpLoading && (
                    <div className="p-4 text-sm text-red-500">No UVP found. Complete onboarding first.</div>
                  )}
                </ScrollArea>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sidebar Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="flex-shrink-0 w-6 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center justify-center border-r border-gray-200 dark:border-slate-700"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {/* Middle: Filter Tabs + Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Filter Tabs - Main */}
          <div className="flex-shrink-0 px-4 py-3 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              {(Object.keys(FILTER_CONFIG) as FilterType[]).map((filter) => {
                const config = FILTER_CONFIG[filter];
                const Icon = config.icon;
                const count = filter === 'trends' ? (trendsCache?.trends.length || 0) : 0;

                return (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      activeFilter === filter
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-green-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {config.label}
                    <span className="text-xs opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Source Filter Tabs (when on Trends tab) */}
          {activeFilter === 'trends' && (
            <div className="flex-shrink-0 px-4 py-2 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-1 overflow-x-auto">
                {(Object.keys(SOURCE_FILTER_CONFIG) as TrendSourceFilter[]).map((source) => {
                  const config = SOURCE_FILTER_CONFIG[source];
                  const Icon = config.icon;
                  const count = sourceCounts[source];

                  return (
                    <button
                      key={source}
                      onClick={() => setSourceFilter(source)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all whitespace-nowrap ${
                        sourceFilter === source
                          ? 'bg-green-600 text-white'
                          : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-green-100'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {config.label}
                      <span className="opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-auto p-4">
            {activeFilter !== 'trends' ? (
              <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-slate-800 rounded-xl">
                <Zap className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {FILTER_CONFIG[activeFilter].label} Tab
                </h2>
                <p className="text-sm text-gray-500">
                  Switch to "Trends" to see Trends 2.0
                </p>
              </div>
            ) : !hasCachedData ? (
              <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-slate-800 rounded-xl">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Ready to Load Trends
                </h2>
                <p className="text-sm text-gray-500 text-center max-w-md mb-4">
                  Click "Fetch Trends" to load industry trends from search engines, YouTube, Reddit, and AI insights.
                </p>
                <button
                  onClick={handleFetchTrends}
                  disabled={!currentBrand?.id}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 font-medium flex items-center gap-2 shadow-lg"
                >
                  <Download className="w-5 h-5" />
                  Fetch Trends
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredTrends.map((trend) => (
                    <TrendCard
                      key={trend.id}
                      trend={trend}
                      isSelected={selectedTrends.includes(trend.id)}
                      onToggle={() => handleToggle(trend.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Right: Selected Trends Panel */}
        <div className="w-72 flex-shrink-0 bg-white dark:bg-slate-800 border-l border-gray-200 dark:border-slate-700 p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Selected Trends</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Click trends to select for content generation
          </p>

          {selectedTrends.length === 0 ? (
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6 text-center">
              <TrendingUp className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No trends selected
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedTrends.map((id) => {
                const trend = trendsCache?.trends.find(t => t.id === id);
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                  >
                    <span className="text-xs text-green-900 dark:text-green-100 truncate flex-1 mr-2">
                      {trend?.title || id}
                    </span>
                    <button
                      onClick={() => handleToggle(id)}
                      className="text-green-500 hover:text-green-700 dark:hover:text-green-300"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}

              <button className="w-full mt-4 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-medium transition-all shadow-lg shadow-green-500/25 flex items-center justify-center gap-2">
                <Zap className="w-4 h-4" />
                Generate Content
              </button>

              <button
                onClick={() => setSelectedTrends([])}
                className="w-full px-4 py-2 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TrendsDevPage;
