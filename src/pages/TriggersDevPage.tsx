/**
 * Triggers Dev Page - Dashboard Mirror
 *
 * Exact replica of V4PowerModePanel for isolated Triggers 2.0 testing.
 * Uses cached data from previous API runs - APIs disabled by default.
 *
 * Created: 2025-11-28
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TriggersPanelV2 } from '@/components/v4/TriggersPanelV2';
import { UVPBuildingBlocks } from '@/components/v4/V4PowerModePanel';
import { useBrand } from '@/hooks/useBrand';
import { useStreamingTriggers } from '@/hooks/useStreamingTriggers';
import { getUVPByBrand } from '@/services/database/marba-uvp.service';
import { profileDetectionService, type BusinessProfileType } from '@/services/triggers/profile-detection.service';
import { triggerConsolidationService } from '@/services/triggers/trigger-consolidation.service';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Database,
  Zap,
  Trash2,
  CheckCircle,
  Target,
  Users,
  TrendingUp,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Heart,
  Shield,
  Award,
  BarChart3,
  Radio,
  Play
} from 'lucide-react';
import type { DeepContext } from '@/types/synapse/deepContext.types';
import type { CompleteUVP } from '@/types/uvp-flow.types';

// ============================================================================
// PERSISTENT CACHE - Saves API data to localStorage for debugging
// ============================================================================

const TRIGGERS_DEV_CACHE_KEY = 'triggersDevPage_deepContext_v3';
const TRIGGERS_DEV_TRIGGERS_KEY = 'triggersDevPage_triggers_v3';
const TRIGGERS_DEV_BRAND_KEY = 'triggersDevPage_brand_v3';
const API_DISABLED_KEY = 'triggersDevPage_apiDisabled_v3';
const RAW_DATA_BUFFER_KEY = 'triggersDevPage_rawDataBuffer_v3';

// Helper to load cached DeepContext from localStorage
function loadCachedDeepContext(): DeepContext | null {
  try {
    const cached = localStorage.getItem(TRIGGERS_DEV_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      console.log('[TriggersDevPage] Loaded cached DeepContext:', {
        triggers: parsed?.customerPsychology?.emotional?.length || 0,
        insights: parsed?.correlatedInsights?.length || 0,
        rawPoints: parsed?.rawDataPoints?.length || 0
      });
      return parsed;
    }
  } catch (err) {
    console.warn('[TriggersDevPage] Failed to load cached data:', err);
  }
  return null;
}

// Helper to save DeepContext to localStorage
function saveCachedDeepContext(data: DeepContext): void {
  try {
    localStorage.setItem(TRIGGERS_DEV_CACHE_KEY, JSON.stringify(data));
    console.log('[TriggersDevPage] 💾 Saved DeepContext to localStorage:', {
      triggers: data?.customerPsychology?.emotional?.length || 0,
      insights: data?.correlatedInsights?.length || 0,
      rawPoints: data?.rawDataPoints?.length || 0
    });
  } catch (err) {
    console.error('[TriggersDevPage] Failed to save cached data:', err);
  }
}

// Helper to load cached triggers from localStorage
function loadCachedTriggers(): any[] | null {
  try {
    const cached = localStorage.getItem(TRIGGERS_DEV_TRIGGERS_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      console.log('[TriggersDevPage] Loaded cached triggers:', parsed?.length || 0);
      return parsed;
    }
  } catch (err) {
    console.warn('[TriggersDevPage] Failed to load cached triggers:', err);
  }
  return null;
}

// Helper to save triggers to localStorage
function saveCachedTriggers(triggers: any[]): void {
  try {
    localStorage.setItem(TRIGGERS_DEV_TRIGGERS_KEY, JSON.stringify(triggers));
    console.log('[TriggersDevPage] 💾 Saved triggers to localStorage:', triggers.length);
  } catch (err) {
    console.error('[TriggersDevPage] Failed to save triggers:', err);
  }
}

// Check if APIs are disabled
function isApiDisabled(): boolean {
  return localStorage.getItem(API_DISABLED_KEY) === 'true';
}

// Set API disabled state
function setApiDisabled(disabled: boolean): void {
  localStorage.setItem(API_DISABLED_KEY, disabled ? 'true' : 'false');
  console.log(`[TriggersDevPage] API calls ${disabled ? 'DISABLED' : 'ENABLED'}`);
}

// ============================================================================
// FILTER TYPES (matching real dashboard)
// ============================================================================

type FilterType = 'all' | 'triggers' | 'proof' | 'trends' | 'gaps';

const FILTER_CONFIG: Record<FilterType, { label: string; icon: React.ElementType; color: string }> = {
  all: { label: 'All', icon: BarChart3, color: 'purple' },
  triggers: { label: 'Triggers', icon: Heart, color: 'red' },
  proof: { label: 'Proof', icon: Award, color: 'blue' },
  trends: { label: 'Trends', icon: TrendingUp, color: 'green' },
  gaps: { label: 'Gaps', icon: Target, color: 'orange' }
};

// ============================================================================
// UVP is now loaded from database (same as V4ContentPage)
// ============================================================================

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TriggersDevPage() {
  const { currentBrand } = useBrand();
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [uvp, setUvp] = useState<CompleteUVP | null>(null);
  const [uvpLoading, setUvpLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('triggers');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load UVP from database (same as V4ContentPage)
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
          console.log('[TriggersDevPage] Loaded UVP from database:', {
            targetCustomer: uvpData.targetCustomer?.statement?.substring(0, 50),
            differentiators: uvpData.uniqueSolution?.differentiators?.length || 0,
            benefits: uvpData.keyBenefit?.statement?.substring(0, 50)
          });
        }
      } catch (err) {
        console.error('[TriggersDevPage] Failed to load UVP:', err);
      } finally {
        setUvpLoading(false);
      }
    }

    loadUVP();
  }, [currentBrand?.id]);

  // API disabled state - persists across page refreshes
  const [apiDisabled, setApiDisabledState] = useState(() => isApiDisabled());

  // Cached deep context from localStorage
  const [cachedContext, setCachedContext] = useState<DeepContext | null>(() => loadCachedDeepContext());

  // Cached triggers from localStorage (separate from DeepContext)
  const [cachedTriggers, setCachedTriggers] = useState<any[] | null>(() => loadCachedTriggers());

  // Streaming mode - DISABLED by default, only fires when user clicks Refresh
  const [streamingEnabled, setStreamingEnabled] = useState(false);

  // Detect business profile from UVP for intelligent API gating
  const detectedProfile = useMemo((): BusinessProfileType | undefined => {
    if (!uvp) return undefined;
    const analysis = profileDetectionService.detectProfile(uvp, currentBrand ? { name: currentBrand.name, industry: currentBrand.naicsCode } : undefined);
    console.log('[TriggersDevPage] Detected profile:', analysis.profileType, '| Signals:', analysis.signals.slice(0, 3));
    return analysis.profileType;
  }, [uvp, currentBrand]);

  // Use streaming hook when enabled AND APIs are not disabled
  // Now passes profileType for intelligent API gating (weather, LinkedIn, G2, etc.)
  const streamingResult = useStreamingTriggers(
    currentBrand,
    uvp,
    streamingEnabled && !apiDisabled,
    detectedProfile // Pass profile for API gating
  );

  // Force re-render key - incremented on cache clear
  const [renderKey, setRenderKey] = useState(0);

  // Use cached data OR streaming data
  const deepContext = cachedContext || streamingResult.deepContext;
  // Use cached triggers OR streaming triggers - CACHED TAKES PRIORITY
  const triggers = cachedTriggers && cachedTriggers.length > 0
    ? cachedTriggers
    : streamingResult.triggers;
  // NEVER show loading if we have cached triggers - render immediately
  const hasCachedData = cachedTriggers && cachedTriggers.length > 0;
  const isLoading = hasCachedData ? false : (streamingResult.isLoading && !apiDisabled);

  // Save streaming DeepContext INCREMENTALLY as data arrives (survive HMR/refresh)
  useEffect(() => {
    if (streamingResult.deepContext && streamingEnabled) {
      const data = streamingResult.deepContext;
      const hasData = (data.customerPsychology?.emotional?.length || 0) > 0 ||
                      (data.correlatedInsights?.length || 0) > 0 ||
                      (data.rawDataPoints?.length || 0) > 0;

      if (hasData) {
        // Save IMMEDIATELY - don't wait for loading to complete
        saveCachedDeepContext(data);
        setCachedContext(data);
        console.log('[TriggersDevPage] 📦 Saved DeepContext incrementally (rawPoints:', data.rawDataPoints?.length || 0, ')');
      }

      // Only disable APIs when loading is COMPLETE
      if (!streamingResult.isLoading && hasData) {
        setApiDisabled(true);
        setApiDisabledState(true);
        setStreamingEnabled(false);
        console.log('[TriggersDevPage] ✅ Streaming complete! APIs now DISABLED. Use "Clear Cache" to re-enable.');
      }
    }
  }, [streamingResult.deepContext, streamingResult.isLoading, streamingEnabled]);

  // Save triggers SEPARATELY when they arrive (survive HMR/refresh)
  useEffect(() => {
    if (streamingResult.triggers && streamingResult.triggers.length > 0 && streamingEnabled) {
      saveCachedTriggers(streamingResult.triggers);
      setCachedTriggers(streamingResult.triggers);
      console.log('[TriggersDevPage] 🎯 Saved', streamingResult.triggers.length, 'triggers to localStorage');
    }
  }, [streamingResult.triggers, streamingEnabled]);

  // AUTO-RECONSOLIDATE: When UVP loads and we have cached triggers, recalculate UVP alignments
  const hasAutoReconsolidated = useRef(false);
  useEffect(() => {
    // Only run once when both UVP and cached triggers are available
    if (uvp && cachedTriggers && cachedTriggers.length > 0 && cachedContext && !hasAutoReconsolidated.current) {
      hasAutoReconsolidated.current = true;
      console.log('[TriggersDevPage] 🔄 Auto-reconsolidating cached triggers with UVP alignment...');

      try {
        const result = triggerConsolidationService.consolidate(
          cachedContext,
          uvp,
          currentBrand ? { name: currentBrand.name, industry: currentBrand.naicsCode } : undefined
        );

        // Update cached triggers with UVP alignments
        saveCachedTriggers(result.triggers);
        setCachedTriggers(result.triggers);

        const withAlignments = result.triggers.filter(t => t.uvpAlignments && t.uvpAlignments.length > 0);
        console.log(`[TriggersDevPage] ✅ Auto-reconsolidated ${result.triggers.length} triggers, ${withAlignments.length} have UVP alignments`);
      } catch (err) {
        console.error('[TriggersDevPage] Auto-reconsolidation error:', err);
      }
    }
  }, [uvp, cachedTriggers, cachedContext, currentBrand]);

  // Derived state (no logging in render - causes re-renders)
  const loadingStatus = `${streamingResult.loadingStatus} (${streamingResult.loadedSources.length}/${streamingResult.totalSources} sources)`;
  const dataStatus = apiDisabled && cachedContext ? 'cached' : streamingResult.isLoading ? 'loading' : streamingResult.error ? 'error' : 'fresh';
  const brandName = currentBrand?.name || 'Brand';

  // ============================================================================
  // FETCH LIVE DATA - Only works if APIs are enabled
  // ============================================================================

  const handleRefreshData = useCallback(() => {
    if (apiDisabled) {
      alert('APIs are disabled. Click "Clear Cache & Enable APIs" first.');
      return;
    }

    if (!currentBrand?.id) {
      alert('No brand selected. Please complete onboarding first.');
      return;
    }

    console.log('[TriggersDevPage] 🚀 Starting API data fetch');

    // Clear streaming API manager cache
    import('@/services/intelligence/streaming-api-manager').then(({ streamingApiManager }) => {
      streamingApiManager.clearCache();
      console.log('[TriggersDevPage] Streaming cache cleared, enabling streaming');
      setStreamingEnabled(true);
    }).catch(err => {
      console.warn('[TriggersDevPage] Could not clear cache:', err);
      setStreamingEnabled(true);
    });
  }, [apiDisabled, currentBrand]);

  // ============================================================================
  // CLEAR CACHE & ENABLE APIs
  // ============================================================================

  const handleClearCache = useCallback(async () => {
    console.log('[TriggersDevPage] 🗑️ NUCLEAR CACHE CLEAR - removing ALL cached data');

    // Clear ALL localStorage keys related to triggers
    localStorage.removeItem(TRIGGERS_DEV_CACHE_KEY);
    localStorage.removeItem(TRIGGERS_DEV_TRIGGERS_KEY);
    localStorage.removeItem(RAW_DATA_BUFFER_KEY);

    // Clear all versioned cache keys
    const keysToRemove = [
      'triggersDevPage_deepContext_v1', 'triggersDevPage_triggers_v1', 'triggersDevPage_rawDataBuffer_v1',
      'triggersDevPage_deepContext_v2', 'triggersDevPage_triggers_v2', 'triggersDevPage_rawDataBuffer_v2',
      'triggersDevPage_deepContext_v3', 'triggersDevPage_triggers_v3', 'triggersDevPage_rawDataBuffer_v3',
      'triggersDevPage_brand_v3', 'triggersDevPage_apiDisabled_v3',
    ];
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Also clear brand-specific caches
    if (currentBrand?.id) {
      localStorage.removeItem(`deepContext_${currentBrand.id}`);
      localStorage.removeItem(`deep-context-${currentBrand.id}`);
      localStorage.removeItem(`conversations_${currentBrand.id}`);
    }

    // Clear streaming API manager caches
    try {
      const { streamingApiManager } = await import('@/services/intelligence/streaming-api-manager');
      streamingApiManager.clearCache();
      console.log('[TriggersDevPage] ✅ StreamingAPI cache cleared');
    } catch (e) {
      console.warn('[TriggersDevPage] Could not clear StreamingAPI cache:', e);
    }

    // Reset all state
    setApiDisabled(false);
    setApiDisabledState(false);
    setCachedContext(null);
    setCachedTriggers(null);
    setStreamingEnabled(false);
    setRenderKey(prev => prev + 1);

    console.log('[TriggersDevPage] ✅ ALL caches cleared - ready for fresh data');
  }, [currentBrand?.id]);

  // Re-consolidate cached data to recalculate UVP alignments
  const handleReconsolidate = useCallback(() => {
    if (!cachedContext || !uvp) {
      console.warn('[TriggersDevPage] Cannot re-consolidate: missing cachedContext or UVP');
      return;
    }

    console.log('[TriggersDevPage] 🔄 Re-consolidating triggers with UVP alignment...');
    try {
      const result = triggerConsolidationService.consolidate(
        cachedContext,
        uvp,
        currentBrand ? { name: currentBrand.name, industry: currentBrand.naicsCode } : undefined
      );

      // Save the re-consolidated triggers
      saveCachedTriggers(result.triggers);
      setCachedTriggers(result.triggers);
      console.log(`[TriggersDevPage] ✅ Re-consolidated ${result.triggers.length} triggers`);

      // Check if any have UVP alignments
      const withAlignments = result.triggers.filter(t => t.uvpAlignments && t.uvpAlignments.length > 0);
      console.log(`[TriggersDevPage] 📊 ${withAlignments.length} triggers have UVP alignments`);
    } catch (err) {
      console.error('[TriggersDevPage] Re-consolidation error:', err);
    }
  }, [cachedContext, uvp, currentBrand]);

  const handleToggle = (triggerId: string) => {
    setSelectedTriggers(prev =>
      prev.includes(triggerId)
        ? prev.filter(x => x !== triggerId)
        : [...prev, triggerId]
    );
  };

  // Get insight counts for tabs - use CONSOLIDATED trigger count, not raw data
  const consolidatedTriggerCount = streamingResult.triggers?.length || cachedTriggers?.length || 0;
  const insightCounts = useMemo(() => {
    return {
      all: consolidatedTriggerCount,
      triggers: consolidatedTriggerCount, // Use actual consolidated count
      proof: deepContext?.synthesis?.keyInsights?.length || 0,
      trends: deepContext?.industry?.trends?.length || 0,
      gaps: deepContext?.competitiveIntel?.blindSpots?.length || 0
    };
  }, [consolidatedTriggerCount, deepContext]);

  // Status config
  const statusConfig = {
    loading: { color: 'bg-gray-100 text-gray-700' },
    cached: { color: 'bg-blue-100 text-blue-700' },
    fresh: { color: 'bg-green-100 text-green-700' },
    error: { color: 'bg-red-100 text-red-700' }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-slate-900">
      {/* Top Bar - Matches real dashboard */}
      <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Title & Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Triggers 2.0</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {uvpLoading ? (
                    <span className="text-yellow-600 dark:text-yellow-400">Loading UVP...</span>
                  ) : !uvp ? (
                    <span className="text-red-600 dark:text-red-400">No UVP found - complete onboarding first</span>
                  ) : isLoading ? (
                    <span className="text-green-600 dark:text-green-400">Loading • {streamingResult.percentComplete}% complete</span>
                  ) : apiDisabled && cachedContext ? (
                    <span className="text-blue-600 dark:text-blue-400">📦 Using cached data (APIs disabled)</span>
                  ) : deepContext ? (
                    <span className="text-green-600 dark:text-green-400">✅ Data loaded</span>
                  ) : (
                    <span>Click "Fetch Live Data" to load triggers</span>
                  )}
                </p>
              </div>
            </div>

            <div className="h-6 w-px bg-gray-200 dark:bg-slate-700" />

            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-500">Brand:</span>
              <span className="font-medium text-gray-900 dark:text-white">{brandName}</span>
              <span className={`px-2 py-0.5 text-xs rounded ${statusConfig[dataStatus].color}`}>
                {dataStatus === 'cached' ? 'Using Cache' : dataStatus === 'fresh' ? 'Fresh Data' : dataStatus}
              </span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Re-consolidate button - recalculate UVP alignments from cached data */}
            {cachedContext && uvp && (
              <button
                onClick={handleReconsolidate}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg font-medium"
                title="Recalculate UVP alignments from cached data"
              >
                <Target className="w-4 h-4" />
                Re-consolidate
              </button>
            )}

            {/* Clear Cache button - only show when cache exists */}
            {(cachedContext || apiDisabled) && (
              <button
                onClick={handleClearCache}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Clear Cache
              </button>
            )}

            {/* Fetch Live Data button */}
            <button
              onClick={handleRefreshData}
              disabled={isLoading || !currentBrand?.id || apiDisabled}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-medium ${
                apiDisabled
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : apiDisabled ? (
                <>
                  <Database className="w-4 h-4" />
                  APIs Disabled
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Fetch Live Data
                </>
              )}
            </button>
          </div>
        </div>

        {/* Loading Bar - Shows when streaming is enabled */}
        {(isLoading || streamingEnabled) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3"
          >
            <div className="flex items-center gap-3 mb-2">
              <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
              <span className="text-sm text-gray-600 dark:text-gray-400">{loadingStatus}</span>
            </div>
            {/* Progress bar */}
            <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-violet-500"
                initial={{ width: 0 }}
                animate={{ width: `${streamingResult.percentComplete}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <div className="flex items-center justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span>{streamingResult.loadedSources.length} sources loaded</span>
              <span>{streamingResult.percentComplete}%</span>
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
                  {/* Use exact same UVPBuildingBlocks component from V4PowerModePanel */}
                  {uvp && (
                    <UVPBuildingBlocks
                      uvp={uvp}
                      deepContext={deepContext}
                      onSelectItem={(item) => {
                        console.log('[TriggersDevPage] UVP item selected:', item);
                      }}
                    />
                  )}
                  {!uvp && uvpLoading && (
                    <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
                      Loading UVP data...
                    </div>
                  )}
                  {!uvp && !uvpLoading && (
                    <div className="p-4 text-sm text-red-500 dark:text-red-400">
                      No UVP found. Complete onboarding first.
                    </div>
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
          {/* Filter Tabs */}
          <div className="flex-shrink-0 px-4 py-3 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              {(Object.keys(FILTER_CONFIG) as FilterType[]).map((filter) => {
                const config = FILTER_CONFIG[filter];
                const Icon = config.icon;
                const count = insightCounts[filter] || 0;

                return (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      activeFilter === filter
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/20'
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

          {/* Content Area */}
          <div className="flex-1 overflow-auto p-4">
            {/* Show triggers if we have them (from cache or streaming), otherwise show empty state */}
            {/* Also show empty state if deepContext exists but has no valid URLs (stale cache) */}
            {(!triggers?.length && !streamingResult.triggers?.length) ? (
              <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-slate-800 rounded-xl">
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-4">
                  <Zap className="w-8 h-8 text-orange-500" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {cachedContext && !triggers?.length
                    ? 'Stale Cache - No Valid Sources'
                    : apiDisabled
                      ? 'No Cached Data'
                      : 'Ready to Load Triggers'
                  }
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md mb-4">
                  {cachedContext && !triggers?.length
                    ? 'The cached data has no verifiable source URLs. Clear cache and fetch fresh data to get triggers with real, clickable sources from Reddit, G2, Trustpilot, etc.'
                    : apiDisabled
                      ? 'APIs are disabled but no cached data exists. Click "Clear Cache" to enable API calls, then fetch live data.'
                      : 'Click the orange "Fetch Live Data" button above to start loading psychological triggers from G2, Trustpilot, Reddit, and other sources.'
                  }
                </p>
                {(apiDisabled || (cachedContext && !triggers?.length)) ? (
                  <button
                    onClick={handleClearCache}
                    className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium flex items-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    Clear Cache & Enable APIs
                  </button>
                ) : (
                  <button
                    onClick={handleRefreshData}
                    disabled={!currentBrand?.id}
                    className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 font-medium flex items-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Fetch Live Data
                  </button>
                )}
              </div>
            ) : activeFilter === 'triggers' ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                <TriggersPanelV2
                  key={`triggers-panel-${renderKey}`}
                  deepContext={deepContext}
                  uvp={uvp}
                  brandData={{ name: brandName, industry: deepContext?.business?.profile?.industry || 'Conversational AI' }}
                  selectedTriggers={selectedTriggers}
                  isLoading={isLoading}
                  loadingStatus={loadingStatus}
                  onToggle={handleToggle}
                  preConsolidatedTriggers={cachedTriggers || streamingResult.triggers}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-slate-800 rounded-xl">
                <Zap className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {FILTER_CONFIG[activeFilter].label} Tab
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Switch to "Triggers" to see Triggers 2.0
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Selected Triggers Panel */}
        <div className="w-72 flex-shrink-0 bg-white dark:bg-slate-800 border-l border-gray-200 dark:border-slate-700 p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Selected Triggers</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Click triggers to select for content generation
          </p>

          {selectedTriggers.length === 0 ? (
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6 text-center">
              <MessageSquare className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No triggers selected
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedTriggers.map((id) => (
                <div
                  key={id}
                  className="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
                >
                  <span className="text-xs text-purple-900 dark:text-purple-100 truncate flex-1 mr-2">
                    {id.replace('trigger-', '')}
                  </span>
                  <button
                    onClick={() => handleToggle(id)}
                    className="text-purple-500 hover:text-purple-700 dark:hover:text-purple-300"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}

              <button className="w-full mt-4 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-lg hover:from-purple-700 hover:to-violet-700 font-medium transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2">
                <Zap className="w-4 h-4" />
                Generate Content
              </button>

              <button
                onClick={() => setSelectedTriggers([])}
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

export default TriggersDevPage;
