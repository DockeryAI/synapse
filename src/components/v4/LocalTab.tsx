/**
 * LocalTab Component
 *
 * Embeddable Local tab for V4PowerModePanel.
 * Surfaces community events, local news, and neighborhood happenings.
 * Based on LocalDevPage but simplified for tab embedding.
 *
 * Created: 2025-11-30
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBrand } from '@/hooks/useBrand';
import { getUVPByBrand } from '@/services/database/marba-uvp.service';
import { useStreamingLocal } from '@/hooks/useStreamingLocal';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2,
  Sparkles,
  Trash2,
  MapPin,
  ChevronDown,
  Calendar,
  Newspaper,
  Users,
  GraduationCap,
  Trophy,
  Heart,
  Clock,
  CheckCircle2,
  Zap,
  Target,
  ExternalLink,
} from 'lucide-react';
import type { CompleteUVP } from '@/types/uvp-flow.types';
import type {
  LocalInsight,
  LocalInsightType,
  LocalMainFilter,
} from '@/services/local/types';
import { LOCAL_INSIGHT_TYPE_CONFIG, LOCAL_URGENCY_CONFIG } from '@/services/local/types';

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
// INSIGHT CARD COMPONENT
// ============================================================================

interface LocalInsightCardProps {
  insight: LocalInsight;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const LocalInsightCard: React.FC<LocalInsightCardProps> = ({
  insight,
  isExpanded,
  onToggleExpand,
}) => {
  const TypeIcon = TYPE_ICONS[insight.type];
  const typeConfig = LOCAL_INSIGHT_TYPE_CONFIG[insight.type];
  const urgencyConfig = LOCAL_URGENCY_CONFIG[insight.urgency];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`rounded-xl border-2 overflow-hidden transition-all ${
        isExpanded ? 'col-span-full' : ''
      } border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-cyan-300 hover:shadow-md`}
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

              {/* Content Angles */}
              {insight.contentAngles.length > 0 && (
                <div className="p-4 rounded-lg bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20 border border-cyan-200 dark:border-cyan-800">
                  <h5 className="text-xs font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    Content Angles
                  </h5>
                  <ul className="space-y-1">
                    {insight.contentAngles.map((angle, idx) => (
                      <li key={idx} className="text-sm text-cyan-800 dark:text-cyan-200 flex items-start gap-2">
                        <span className="text-cyan-500">→</span>
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed Footer */}
      {!isExpanded && insight.contentAngles.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-700 bg-gray-50/30 dark:bg-slate-800/30">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Zap className="w-3 h-3" />
            {insight.contentAngles.length} content angles
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface LocalTabProps {
  uvp: CompleteUVP | null;
  brandId?: string;
}

export function LocalTab({ uvp: providedUvp, brandId }: LocalTabProps) {
  const { currentBrand } = useBrand();
  const [uvp, setUvp] = useState<CompleteUVP | null>(providedUvp);
  const [uvpLoading, setUvpLoading] = useState(!providedUvp);
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());
  const [mainFilter, setMainFilter] = useState<LocalMainFilter>('all');

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
  } = useStreamingLocal();

  // Load UVP from database if not provided
  useEffect(() => {
    async function loadUVP() {
      if (providedUvp) {
        setUvp(providedUvp);
        setUvpLoading(false);
        return;
      }

      const id = brandId || currentBrand?.id;
      if (!id) {
        setUvpLoading(false);
        return;
      }

      try {
        const uvpData = await getUVPByBrand(id);
        if (uvpData) {
          setUvp(uvpData);
        }
      } catch (err) {
        console.error('[LocalTab] Failed to load UVP:', err);
      } finally {
        setUvpLoading(false);
      }
    }

    loadUVP();
  }, [providedUvp, brandId, currentBrand?.id]);

  // Filter insights
  const filteredInsights = useMemo(() => {
    if (!result?.insights) return [];

    let filtered = [...result.insights];

    if (mainFilter === 'high_relevance') {
      filtered = filtered.filter(i => i.relevanceScore >= 70);
    } else if (mainFilter === 'upcoming') {
      filtered = filtered.filter(i => i.timing.isUpcoming);
    } else if (mainFilter === 'this_week') {
      filtered = filtered.filter(i => i.timing.isUpcoming && i.timing.daysUntil !== undefined && i.timing.daysUntil <= 7);
    }

    return filtered;
  }, [result, mainFilter]);

  const handleFetchLocal = useCallback(async () => {
    if (!uvp) {
      alert('No UVP data available.');
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

  // Loading state
  if (uvpLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
        <span className="ml-2 text-sm text-gray-500">Loading UVP data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Local Intelligence</h3>
            <p className="text-xs text-gray-500">
              {result ? `${result.insights.length} local insights • ${result.location}` : 'Community events & local news'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasCachedData && (
            <button
              onClick={clearCache}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          )}

          <button
            onClick={handleFetchLocal}
            disabled={isLoading || !uvp}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg font-semibold transition-all ${
              isLoading
                ? 'bg-cyan-100 text-cyan-600 cursor-wait'
                : 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:from-cyan-600 hover:to-teal-600 shadow-md'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                {state.progress}%
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3" />
                Scan Local
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {isLoading && (
        <div className="space-y-1">
          <div className="h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-teal-500"
              initial={{ width: 0 }}
              animate={{ width: `${state.progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-xs text-gray-500">{state.statusMessage}</p>
        </div>
      )}

      {/* Filter Tabs */}
      {result && result.insights.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['all', 'high_relevance', 'upcoming', 'this_week'] as LocalMainFilter[]).map((filter) => {
            const labels: Record<LocalMainFilter, string> = {
              all: 'All',
              high_relevance: 'High Match',
              upcoming: 'Upcoming',
              this_week: 'This Week'
            };
            return (
              <button
                key={filter}
                onClick={() => setMainFilter(filter)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  mainFilter === filter
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-cyan-100'
                }`}
              >
                {labels[filter]}
              </button>
            );
          })}
        </div>
      )}

      {/* Content Area */}
      {!hasCachedData ? (
        <div className="flex flex-col items-center justify-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-100 to-teal-100 dark:from-cyan-900/30 dark:to-teal-900/30 rounded-2xl flex items-center justify-center mb-4">
            <MapPin className="w-8 h-8 text-cyan-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            Local Intelligence Ready
          </h3>
          <p className="text-sm text-gray-500 text-center max-w-sm mb-4">
            Discover community events, local news, and neighborhood happenings for timely content.
          </p>
          <button
            onClick={handleFetchLocal}
            disabled={!uvp}
            className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-lg hover:from-cyan-600 hover:to-teal-600 font-semibold flex items-center gap-2 shadow-lg shadow-cyan-500/25 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            Scan Local Events
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
                onToggleExpand={() => handleToggleExpand(insight.id)}
              />
            ))}
          </AnimatePresence>

          {filteredInsights.length === 0 && (
            <div className="col-span-2 flex flex-col items-center justify-center py-12 bg-white dark:bg-slate-800 rounded-xl">
              <Target className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-500">No insights match the current filter</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LocalTab;
