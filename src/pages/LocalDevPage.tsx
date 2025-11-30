/**
 * Local Dev Page - Local 2.0 Implementation
 *
 * Isolated development page for the Local tab.
 * Surfaces community events, local news, and neighborhood happenings.
 *
 * Features:
 * - No API calls on load (manual trigger only)
 * - Clear cache button
 * - Filter by insight type
 * - UVP Building Blocks sidebar
 * - Stats panel
 *
 * Created: 2025-11-30
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UVPBuildingBlocks } from '@/components/v4/V4PowerModePanel';
import { useBrand } from '@/hooks/useBrand';
import { getUVPByBrand } from '@/services/database/marba-uvp.service';
import { useStreamingLocal } from '@/hooks/useStreamingLocal';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2,
  Sparkles,
  Trash2,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  BarChart3,
  Calendar,
  Newspaper,
  Users,
  GraduationCap,
  Trophy,
  Heart,
  Building2,
  ExternalLink,
  Zap,
  Target,
  Clock,
  CheckCircle2,
  Download,
  X,
} from 'lucide-react';
import type { CompleteUVP } from '@/types/uvp-flow.types';
import type {
  LocalInsight,
  LocalInsightType,
  LocalMainFilter,
  LocalTypeFilter,
  LocalLocation,
} from '@/services/local/types';
import { LOCAL_INSIGHT_TYPE_CONFIG, LOCAL_URGENCY_CONFIG } from '@/services/local/types';
import { LocalContentGenerator, type LocalContentResult } from '@/services/local/local-content-generator.service';

// ============================================================================
// TYPE ICONS
// ============================================================================

const TYPE_ICONS: Record<LocalInsightType, React.ElementType> = {
  event: Calendar,
  news: Newspaper,
  community: Users,
  school: GraduationCap,
  sports: Trophy,
  charity: Heart,
};

// ============================================================================
// MAIN FILTER CONFIG
// ============================================================================

const MAIN_FILTER_CONFIG: Record<LocalMainFilter, { label: string; icon: React.ElementType }> = {
  all: { label: 'All Insights', icon: BarChart3 },
  high_relevance: { label: 'High Match', icon: Target },
  upcoming: { label: 'Upcoming', icon: Clock },
  this_week: { label: 'This Week', icon: Calendar },
};

// ============================================================================
// INSIGHT CARD COMPONENT
// ============================================================================

interface LocalInsightCardProps {
  insight: LocalInsight;
  isExpanded: boolean;
  isGenerating?: boolean;
  onToggleExpand: () => void;
  onGenerateContent: () => void;
}

const LocalInsightCard = React.forwardRef<HTMLDivElement, LocalInsightCardProps>(
  function LocalInsightCard({ insight, isExpanded, isGenerating, onToggleExpand, onGenerateContent }, ref) {
    const TypeIcon = TYPE_ICONS[insight.type];
    const typeConfig = LOCAL_INSIGHT_TYPE_CONFIG[insight.type];
    const urgencyConfig = LOCAL_URGENCY_CONFIG[insight.urgency];

    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`rounded-xl border-2 overflow-hidden transition-all ${
          isExpanded ? 'col-span-full' : ''
        } border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 hover:shadow-md`}
      >
        {/* Header Row */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between">
            {/* Left: Type + Timing */}
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${typeConfig.bgColor} ${typeConfig.color}`}>
                <span>{typeConfig.icon}</span>
                {typeConfig.label}
              </div>

              {insight.timing.displayDate && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  insight.timing.isOngoing ? 'bg-green-100 text-green-700' :
                  insight.timing.isUpcoming ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  <Clock className="w-3 h-3" />
                  {insight.timing.displayDate}
                </div>
              )}
            </div>

            {/* Right: Score + Expand */}
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                insight.relevanceScore >= 70 ? 'bg-green-100 text-green-700' :
                insight.relevanceScore >= 50 ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {insight.relevanceScore}% match
              </span>

              <span className={`px-2 py-0.5 text-xs font-medium rounded ${urgencyConfig.bgColor} ${urgencyConfig.color}`}>
                {urgencyConfig.label}
              </span>

              <button
                onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
              >
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Title + Description */}
        <div className="p-4 cursor-pointer" onClick={onToggleExpand}>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <TypeIcon className="w-4 h-4 text-gray-400" />
            {insight.title}
          </h4>
          {!isExpanded && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {insight.description}
            </p>
          )}
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-gray-200 dark:border-slate-700"
            >
              <div className="p-4 space-y-4">
                {/* Full Description */}
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {insight.description}
                  </p>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4" />
                  {insight.location}
                </div>

                {/* UVP Alignment - Only show when there's REAL alignment */}
                {(() => {
                  const uvpReasons = insight.relevanceReasons?.filter(r =>
                    r.includes('target audience') ||
                    r.includes('your service') ||
                    r.includes('differentiator') ||
                    r.includes('Directly relevant')
                  ) || [];
                  const otherReasons = insight.relevanceReasons?.filter(r =>
                    !r.includes('target audience') &&
                    !r.includes('your service') &&
                    !r.includes('differentiator') &&
                    !r.includes('Directly relevant')
                  ) || [];

                  return (
                    <>
                      {/* UVP Alignment Section - Only shown when there's genuine alignment */}
                      {uvpReasons.length > 0 && (
                        <div className="p-3 rounded-lg bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border border-purple-200 dark:border-purple-800">
                          <h5 className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5" />
                            UVP Alignment
                          </h5>
                          <ul className="space-y-1">
                            {uvpReasons.map((reason, idx) => (
                              <li key={idx} className="text-sm text-purple-800 dark:text-purple-200 flex items-start gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-purple-600" />
                                {reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Content Opportunity - General engagement reasons */}
                      {otherReasons.length > 0 && (
                        <div className="p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
                          <h5 className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            Content Opportunity
                          </h5>
                          <ul className="space-y-1">
                            {otherReasons.map((reason, idx) => (
                              <li key={idx} className="text-sm text-green-800 dark:text-green-200 flex items-start gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-green-600" />
                                {reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  );
                })()}

                {/* Content Angles */}
                {insight.contentAngles.length > 0 && (
                  <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800">
                    <h5 className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      Content Angles
                    </h5>
                    <ul className="space-y-1">
                      {insight.contentAngles.map((angle, idx) => (
                        <li key={idx} className="text-sm text-blue-800 dark:text-blue-200 flex items-start gap-2">
                          <span className="text-blue-500">→</span>
                          {angle}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Sources */}
                {insight.sources.length > 0 && (
                  <div className="pt-3 border-t border-gray-200 dark:border-slate-700">
                    <h5 className="text-xs font-medium text-gray-500 mb-2">Sources</h5>
                    <div className="flex flex-wrap gap-2">
                      {insight.sources.map((source, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <span className={`px-2 py-1 text-xs rounded ${
                            source.type === 'serper_news' ? 'bg-green-100 text-green-700' :
                            source.type === 'perplexity' ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {source.name}
                          </span>
                          {source.url && (
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-blue-600 hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); onGenerateContent(); }}
                    disabled={isGenerating}
                    className={`flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg shadow-sm ${
                      isGenerating
                        ? 'bg-gray-400 cursor-wait'
                        : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Generate Content
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed Footer */}
        {!isExpanded && insight.contentAngles.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-700 bg-gray-50/30 dark:bg-slate-800/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Zap className="w-3 h-3" />
                {insight.contentAngles.length} content angles
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onGenerateContent(); }}
                disabled={isGenerating}
                className={`flex items-center gap-1 px-3 py-1.5 text-white text-xs font-medium rounded-lg shadow-sm ${
                  isGenerating
                    ? 'bg-gray-400 cursor-wait'
                    : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
                }`}
              >
                {isGenerating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <>
                    <Zap className="w-3 h-3" />
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    );
  }
);

// ============================================================================
// STATS PANEL COMPONENT
// ============================================================================

interface StatsPanelProps {
  stats: LocalPipelineResult['stats'];
  location: string;
  apisUsed: string[];
}

function StatsPanel({ stats, location, apisUsed }: StatsPanelProps) {
  const API_DISPLAY: Record<string, { label: string; color: string }> = {
    serper_news: { label: 'News', color: 'bg-green-100 text-green-700' },
    serper_places: { label: 'Places', color: 'bg-blue-100 text-blue-700' },
    perplexity: { label: 'AI', color: 'bg-purple-100 text-purple-700' },
  };

  return (
    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Pipeline Stats</h3>

      {/* Location */}
      <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Location</p>
        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {location}
        </p>
      </div>

      {/* APIs Used */}
      {apisUsed.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-500 mb-2">APIs Called ({apisUsed.length})</p>
          <div className="flex flex-wrap gap-1">
            {apisUsed.map((api) => {
              const display = API_DISPLAY[api] || { label: api, color: 'bg-gray-100 text-gray-700' };
              return (
                <span
                  key={api}
                  className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${display.color}`}
                >
                  {display.label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Funnel */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Raw Fetched</span>
          <span className="font-medium">{stats.rawCount}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">After Dedup</span>
          <span className="font-medium text-blue-600">{stats.validatedCount}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">High Relevance</span>
          <span className="font-medium text-green-600">{stats.highRelevanceCount}</span>
        </div>
      </div>

      {/* By Type */}
      <div className="pt-3 border-t border-gray-100 dark:border-slate-700">
        <p className="text-xs font-medium text-gray-500 mb-2">By Type</p>
        <div className="space-y-1">
          {Object.entries(stats.byType).map(([type, count]) => {
            const config = LOCAL_INSIGHT_TYPE_CONFIG[type as LocalInsightType];
            return (
              <div key={type} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-gray-600">
                  <span>{config.icon}</span>
                  {config.label}
                </span>
                <span className="font-medium">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

// Import the result type
import type { LocalPipelineResult } from '@/services/local/types';

export function LocalDevPage() {
  const { currentBrand } = useBrand();
  const [uvp, setUvp] = useState<CompleteUVP | null>(null);
  const [uvpLoading, setUvpLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Manual location override
  const [manualLocation, setManualLocation] = useState<LocalLocation | undefined>(undefined);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [locationCity, setLocationCity] = useState('');
  const [locationState, setLocationState] = useState('');

  // Expanded insights tracking
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());

  // Filters
  const [mainFilter, setMainFilter] = useState<LocalMainFilter>('all');
  const [typeFilter, setTypeFilter] = useState<LocalTypeFilter>('all');

  // Content generation state
  const [generatingContent, setGeneratingContent] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<LocalContentResult | null>(null);
  const [showContentModal, setShowContentModal] = useState(false);

  // Use Local 2.0 hook
  const {
    state,
    result,
    hasCachedData,
    executePipeline,
    clearCache,
    isLoading,
    isComplete,
    hasError,
  } = useStreamingLocal({ manualLocation });

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
          console.log('[LocalDevPage] Loaded UVP from database');
        }
      } catch (err) {
        console.error('[LocalDevPage] Failed to load UVP:', err);
      } finally {
        setUvpLoading(false);
      }
    }

    loadUVP();
  }, [currentBrand?.id]);

  // Derived state
  const brandName = currentBrand?.name || 'Brand';

  // Filter insights
  const filteredInsights = useMemo(() => {
    if (!result?.insights) return [];

    let filtered = [...result.insights];

    // Main filter
    if (mainFilter === 'high_relevance') {
      filtered = filtered.filter(i => i.relevanceScore >= 70);
    } else if (mainFilter === 'upcoming') {
      filtered = filtered.filter(i => i.timing.isUpcoming);
    } else if (mainFilter === 'this_week') {
      filtered = filtered.filter(i => i.timing.isUpcoming && i.timing.daysUntil !== undefined && i.timing.daysUntil <= 7);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(i => i.type === typeFilter);
    }

    return filtered;
  }, [result, mainFilter, typeFilter]);

  // Type counts for filter badges
  const typeCounts = useMemo(() => {
    if (!result?.insights) return {};
    const counts: Record<string, number> = { all: result.insights.length };
    for (const insight of result.insights) {
      counts[insight.type] = (counts[insight.type] || 0) + 1;
    }
    return counts;
  }, [result?.insights]);

  // Handlers
  const handleFetchLocal = useCallback(async () => {
    if (!uvp) {
      alert('No UVP data available. Please complete onboarding first.');
      return;
    }

    await executePipeline(uvp);
  }, [uvp, executePipeline]);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedInsights(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleSetManualLocation = useCallback(() => {
    if (locationCity && locationState) {
      setManualLocation({
        city: locationCity,
        state: locationState,
      });
      setShowLocationInput(false);
    }
  }, [locationCity, locationState]);

  const handleGenerateContent = useCallback(async (insight: LocalInsight) => {
    if (!uvp) {
      alert('UVP data required for content generation');
      return;
    }

    console.log('[LocalDevPage] Generate content for:', insight.title);
    setGeneratingContent(insight.id);
    setGeneratedContent(null);

    try {
      const content = await LocalContentGenerator.generate({
        insight,
        uvp,
        platform: 'facebook', // Default to Facebook for local businesses
        tone: 'celebratory'
      });

      console.log('[LocalDevPage] Content generated:', content);
      setGeneratedContent(content);
      setShowContentModal(true);
    } catch (err) {
      console.error('[LocalDevPage] Content generation failed:', err);
      alert(`Content generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setGeneratingContent(null);
    }
  }, [uvp]);

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-slate-900">
      {/* Top Bar */}
      <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Title & Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  Local 2.0
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700 rounded">DEV</span>
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isLoading ? (
                    <span className="text-blue-600">{state.statusMessage}</span>
                  ) : hasCachedData ? (
                    <span className="text-green-600">
                      {result?.insights.length} insights · {result?.stats.highRelevanceCount} high match
                    </span>
                  ) : (
                    <span>Community events & local news</span>
                  )}
                </p>
              </div>
            </div>

            <div className="h-6 w-px bg-gray-200 dark:bg-slate-700" />

            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-500">Brand:</span>
              <span className="font-medium text-gray-900 dark:text-white">{brandName}</span>
              {result?.location && (
                <span className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-700 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {result.location}
                </span>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Manual Location */}
            <button
              onClick={() => setShowLocationInput(!showLocationInput)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-medium"
            >
              <MapPin className="w-4 h-4" />
              Set Location
            </button>

            {hasCachedData && (
              <button
                onClick={clearCache}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            )}

            <button
              onClick={handleFetchLocal}
              disabled={isLoading || !uvp}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-semibold transition-all ${
                isLoading
                  ? 'bg-blue-100 text-blue-600 cursor-wait'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 shadow-md hover:shadow-lg disabled:opacity-50'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {state.progress}%
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Run Local 2.0
                </>
              )}
            </button>
          </div>
        </div>

        {/* Manual Location Input */}
        <AnimatePresence>
          {showLocationInput && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700 overflow-hidden"
            >
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="City"
                  value={locationCity}
                  onChange={(e) => setLocationCity(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="State (e.g., TX)"
                  value={locationState}
                  onChange={(e) => setLocationState(e.target.value.toUpperCase())}
                  maxLength={2}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg w-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSetManualLocation}
                  disabled={!locationCity || !locationState}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Set
                </button>
                {manualLocation && (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    {manualLocation.city}, {manualLocation.state}
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Bar */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3"
          >
            <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                initial={{ width: 0 }}
                animate={{ width: `${state.progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
              <span>{state.statusMessage}</span>
              <span>{state.stage}</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Main Content */}
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
                      deepContext={null}
                      onSelectItem={(item) => {
                        console.log('[LocalDevPage] UVP item selected:', item);
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

        {/* Center: Filter Tabs + Insights Grid */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Main Filter Tabs */}
          <div className="flex-shrink-0 px-4 py-3 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              {(Object.keys(MAIN_FILTER_CONFIG) as LocalMainFilter[]).map((filter) => {
                const config = MAIN_FILTER_CONFIG[filter];
                const Icon = config.icon;
                let count = 0;
                if (filter === 'all') count = result?.insights.length || 0;
                else if (filter === 'high_relevance') count = result?.stats.highRelevanceCount || 0;
                else if (filter === 'upcoming') count = result?.insights.filter(i => i.timing.isUpcoming).length || 0;
                else if (filter === 'this_week') count = result?.insights.filter(i => i.timing.isUpcoming && i.timing.daysUntil !== undefined && i.timing.daysUntil <= 7).length || 0;

                return (
                  <button
                    key={filter}
                    onClick={() => setMainFilter(filter)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      mainFilter === filter
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100'
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

          {/* Type Filter */}
          {result?.insights && result.insights.length > 0 && (
            <div className="flex-shrink-0 px-4 py-2 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-1 overflow-x-auto">
                <span className="text-xs font-medium text-gray-500 mr-1">Type:</span>
                <button
                  onClick={() => setTypeFilter('all')}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all whitespace-nowrap ${
                    typeFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100'
                  }`}
                >
                  All ({typeCounts['all'] || 0})
                </button>
                {(['event', 'news', 'community', 'school', 'sports', 'charity'] as LocalInsightType[]).map((type) => {
                  const config = LOCAL_INSIGHT_TYPE_CONFIG[type];
                  const count = typeCounts[type] || 0;

                  return (
                    <button
                      key={type}
                      onClick={() => setTypeFilter(type)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all whitespace-nowrap ${
                        typeFilter === type
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100'
                      }`}
                    >
                      <span>{config.icon}</span>
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
            {!hasCachedData ? (
              <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-slate-800 rounded-xl">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-2xl flex items-center justify-center mb-6">
                  <MapPin className="w-10 h-10 text-blue-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Local 2.0 Ready
                </h2>
                <p className="text-sm text-gray-500 text-center max-w-md mb-6">
                  Discover community events, local news, and neighborhood happenings
                  to create timely, relevant content for your audience.
                </p>
                <div className="flex items-center gap-4 mb-6 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    Events
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Newspaper className="w-4 h-4" />
                    News
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    Community
                  </div>
                </div>
                <button
                  onClick={handleFetchLocal}
                  disabled={!uvp}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/25 disabled:opacity-50"
                >
                  <Sparkles className="w-5 h-5" />
                  Run Local 2.0 Pipeline
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredInsights.map((insight) => (
                    <LocalInsightCard
                      key={insight.id}
                      insight={insight}
                      isExpanded={expandedInsights.has(insight.id)}
                      isGenerating={generatingContent === insight.id}
                      onToggleExpand={() => handleToggleExpand(insight.id)}
                      onGenerateContent={() => handleGenerateContent(insight)}
                    />
                  ))}
                </AnimatePresence>

                {filteredInsights.length === 0 && (
                  <div className="col-span-2 flex flex-col items-center justify-center py-12 bg-white dark:bg-slate-800 rounded-xl">
                    <Target className="w-12 h-12 text-gray-300 mb-4" />
                    <p className="text-gray-500">No insights match the current filters</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Stats Panel */}
        <div className="w-72 flex-shrink-0 bg-gray-50 dark:bg-slate-900 border-l border-gray-200 dark:border-slate-700 p-4 overflow-y-auto">
          {result?.stats ? (
            <StatsPanel stats={result.stats} location={result.location} apisUsed={result.apisUsed} />
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-sm text-gray-500">Run the pipeline to see stats</p>
            </div>
          )}
        </div>
      </div>

      {/* Generated Content Modal */}
      <AnimatePresence>
        {showContentModal && generatedContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowContentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Generated Content</h3>
                    <p className="text-xs text-gray-500">
                      {generatedContent.platform} · {generatedContent.contentType}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowContentModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Source Insight */}
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50 text-sm">
                  <p className="text-xs font-medium text-gray-500 mb-1">Source Insight</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {generatedContent.sourceInsight.title}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                    <MapPin className="w-3 h-3" />
                    {generatedContent.sourceInsight.location}
                  </p>
                </div>

                {/* Headline */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Headline</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {generatedContent.headline}
                  </p>
                </div>

                {/* Content */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Content</p>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                      {generatedContent.content}
                    </p>
                  </div>
                </div>

                {/* Call to Action */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Call to Action</p>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {generatedContent.callToAction}
                  </p>
                </div>

                {/* Hashtags */}
                {generatedContent.hashtags.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Hashtags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {generatedContent.hashtags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats Row */}
                <div className="flex items-center gap-4 pt-3 border-t border-gray-200 dark:border-slate-700">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <span className={`px-2 py-0.5 rounded font-medium ${
                      generatedContent.estimatedEngagement === 'high' ? 'bg-green-100 text-green-700' :
                      generatedContent.estimatedEngagement === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {generatedContent.estimatedEngagement} engagement
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Angle: {generatedContent.metadata.angleUsed}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedContent.content);
                    alert('Content copied to clipboard!');
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600"
                >
                  <Download className="w-4 h-4" />
                  Copy Content
                </button>
                <button
                  onClick={() => setShowContentModal(false)}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg hover:from-blue-600 hover:to-cyan-600"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default LocalDevPage;
