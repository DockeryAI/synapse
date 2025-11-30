/**
 * Trends Panel Component
 *
 * Embeddable Trends 2.0 panel for use in V4 PowerMode dashboard.
 * Receives UVP as prop and handles all trend discovery, filtering, and display.
 *
 * Based on TrendsDevPage but designed for embedding in dashboard tabs.
 *
 * Created: 2025-11-30
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStreamingTrends } from '@/hooks/useStreamingTrends';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2,
  Sparkles,
  Trash2,
  Target,
  TrendingUp,
  ChevronDown,
  Heart,
  BarChart3,
  Package,
  Building2,
  ExternalLink,
  Youtube,
  MessageSquare,
  Newspaper,
  Search,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Flame,
  TrendingDown,
  RefreshCcw,
  Brain,
  Users,
  Shield,
  Lightbulb,
  ArrowRight,
  Link as LinkIcon
} from 'lucide-react';
import type { CompleteUVP } from '@/types/uvp-flow.types';
import type { TrendWithMatches } from '@/services/trends/triggers-trend-matcher.service';
import type { LifecycleStage } from '@/services/trends/trend-lifecycle-detector.service';
import type { PsychologicalTrigger } from '@/services/trends/eq-trend-prioritizer.service';
import { CATEGORY_CONFIGS, type BusinessCategory } from '@/services/trends/trend-category-router.service';
import { TrendContentGenerator, type GeneratedTrendContent } from '@/services/trends/trend-content-generator.service';

// ============================================================================
// PROPS
// ============================================================================

interface TrendsPanelProps {
  uvp: CompleteUVP;
  brandName?: string;
  onSelectTrend?: (trend: TrendWithMatches) => void;
}

// ============================================================================
// FILTER TYPES
// ============================================================================

type MainFilter = 'all' | 'content_ready';
type IntentFilter = 'all' | 'product' | 'industry' | 'pain_point' | 'use_case' | 'outcome' | 'persona';

const MAIN_FILTER_CONFIG: Record<MainFilter, { label: string; icon: React.ElementType; color: string }> = {
  all: { label: 'All Trends', icon: BarChart3, color: 'purple' },
  content_ready: { label: 'Suggested', icon: CheckCircle2, color: 'green' }
};

const INTENT_FILTER_CONFIG: Record<IntentFilter, { label: string; icon: React.ElementType; color: string }> = {
  all: { label: 'All Types', icon: BarChart3, color: 'gray' },
  use_case: { label: 'Use Cases', icon: Target, color: 'purple' },
  product: { label: 'Product', icon: Package, color: 'green' },
  industry: { label: 'Industry', icon: Building2, color: 'blue' },
  outcome: { label: 'Outcomes', icon: TrendingUp, color: 'emerald' },
  persona: { label: 'Persona', icon: Users, color: 'pink' },
  pain_point: { label: 'Pain Points', icon: AlertTriangle, color: 'orange' }
};

const LIFECYCLE_ICONS: Record<LifecycleStage, React.ElementType> = {
  emerging: Flame,
  peak: TrendingUp,
  stable: RefreshCcw,
  declining: TrendingDown
};

const TRIGGER_ICONS: Record<PsychologicalTrigger, React.ElementType> = {
  fear: AlertTriangle,
  desire: Heart,
  trust: Shield,
  urgency: Clock,
  curiosity: Lightbulb,
  social: Users,
  practical: Target
};

// ============================================================================
// TREND CARD COMPONENT
// ============================================================================

interface TrendCardProps {
  trend: TrendWithMatches;
  isSelected: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onToggleExpand: () => void;
}

const TrendCard = React.forwardRef<HTMLDivElement, TrendCardProps>(function TrendCard(
  { trend, isSelected, isExpanded, onToggle, onToggleExpand },
  ref
) {
  const [sourcesExpanded, setSourcesExpanded] = useState(false);
  const LifecycleIcon = LIFECYCLE_ICONS[trend.lifecycle.stage];
  const TriggerIcon = TRIGGER_ICONS[trend.primaryTrigger];

  // Generate opportunity statement
  const opportunityStatement = useMemo(() => {
    const triggerLabel = trend.primaryTrigger.charAt(0).toUpperCase() + trend.primaryTrigger.slice(1);

    if (trend.lifecycle.stage === 'emerging') {
      return `Early-mover opportunity: Position your brand as a thought leader on this emerging trend.`;
    } else if (trend.lifecycle.stage === 'peak') {
      return `High-visibility opportunity: This trend is at peak attention. Create timely content now.`;
    } else if (trend.lifecycle.stage === 'stable') {
      return `Evergreen opportunity: Build foundational content for long-term SEO value.`;
    } else {
      return `Strategic opportunity: Counter-position against this declining trend.`;
    }
  }, [trend.lifecycle.stage, trend.primaryTrigger]);

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`rounded-xl border-2 overflow-hidden transition-all ${
        isExpanded ? 'col-span-full' : ''
      } ${
        isSelected
          ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-lg ring-2 ring-green-500/50'
          : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-green-300 hover:shadow-md'
      }`}
    >
      {/* Header Row */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
        <div className="flex items-center justify-between">
          {/* Left: Lifecycle + Trigger */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
              trend.lifecycle.stage === 'emerging' ? 'bg-orange-100 text-orange-700' :
              trend.lifecycle.stage === 'peak' ? 'bg-green-100 text-green-700' :
              trend.lifecycle.stage === 'stable' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              <LifecycleIcon className="w-3 h-3" />
              {trend.lifecycle.stageLabel}
              {trend.lifecycle.isFirstMover && (
                <span className="ml-1 px-1 bg-yellow-200 text-yellow-800 rounded text-[10px]">1st</span>
              )}
            </div>

            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              trend.primaryTrigger === 'fear' ? 'bg-red-100 text-red-600' :
              trend.primaryTrigger === 'desire' ? 'bg-pink-100 text-pink-600' :
              trend.primaryTrigger === 'trust' ? 'bg-blue-100 text-blue-600' :
              trend.primaryTrigger === 'urgency' ? 'bg-orange-100 text-orange-600' :
              trend.primaryTrigger === 'curiosity' ? 'bg-purple-100 text-purple-600' :
              trend.primaryTrigger === 'social' ? 'bg-green-100 text-green-600' :
              'bg-gray-100 text-gray-600'
            }`}>
              <TriggerIcon className="w-3 h-3" />
              {trend.primaryTrigger}
            </div>
          </div>

          {/* Right: Expand button */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
          >
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Collapsed Content - Title and Description */}
      <div className="p-4 cursor-pointer" onClick={onToggle}>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
          {trend.title}
        </h4>
        {!isExpanded && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {trend.description}
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
              {/* Executive Summary */}
              <div className={`p-4 rounded-lg border ${
                trend.lifecycle.stage === 'emerging' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' :
                trend.lifecycle.stage === 'peak' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                trend.lifecycle.stage === 'stable' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
                'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
              }`}>
                <h5 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5" />
                  Executive Summary
                </h5>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                  {trend.description}
                </p>
                {trend.whyThisMatters && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
                    {trend.whyThisMatters}
                  </p>
                )}
              </div>

              {/* Opportunity */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
                <h5 className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  Opportunity
                </h5>
                <p className="text-sm text-green-800 dark:text-green-200 leading-relaxed">
                  {opportunityStatement}
                </p>
                {trend.bestMatch?.suggestedHook && (
                  <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
                    <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">Suggested Hook:</p>
                    <p className="text-sm font-medium text-green-900 dark:text-green-100 italic">
                      "{trend.bestMatch.suggestedHook}"
                    </p>
                  </div>
                )}
              </div>

              {/* Sources - Collapsible */}
              <div className="rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                <button
                  onClick={(e) => { e.stopPropagation(); setSourcesExpanded(!sourcesExpanded); }}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-blue-500" />
                    Sources ({trend.sources.length})
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${sourcesExpanded ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {sourcesExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 space-y-2 bg-gray-50 dark:bg-slate-800/30 max-h-48 overflow-y-auto">
                        {trend.sources.map((source, idx) => (
                          <div
                            key={idx}
                            className="p-2 bg-white dark:bg-slate-700 rounded-lg border border-gray-100 dark:border-slate-600"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{source.source}</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{source.title}</p>
                              </div>
                              {source.url && (
                                <a
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

// ============================================================================
// MAIN PANEL COMPONENT
// ============================================================================

export function TrendsPanel({ uvp, brandName, onSelectTrend }: TrendsPanelProps) {
  const [selectedTrends, setSelectedTrends] = useState<string[]>([]);
  const [expandedTrends, setExpandedTrends] = useState<Set<string>>(new Set());

  // Filters
  const [mainFilter, setMainFilter] = useState<MainFilter>('all');
  const [intentFilter, setIntentFilter] = useState<IntentFilter>('all');

  // Use Trends 2.0 hook
  const {
    state,
    result,
    hasCachedData,
    executePipeline,
    clearCache,
    isLoading,
    isComplete,
    hasError
  } = useStreamingTrends();

  // Filter trends
  const filteredTrends = useMemo(() => {
    if (!result?.trends) return [];

    let filtered = [...result.trends];

    // Main filter
    if (mainFilter === 'content_ready') {
      filtered = filtered.filter(t => t.isContentReady);
    }

    // Intent filter
    if (intentFilter !== 'all') {
      if (intentFilter === 'industry') {
        filtered = filtered.filter(t => t.queryIntent === 'industry' || t.queryIntent === 'trend');
      } else {
        filtered = filtered.filter(t => t.queryIntent === intentFilter);
      }
    }

    return filtered;
  }, [result, mainFilter, intentFilter]);

  // Get intent counts for filter badges
  const intentCounts = useMemo(() => {
    if (!result?.trends) return { all: 0, product: 0, industry: 0, pain_point: 0, use_case: 0, outcome: 0, persona: 0 };

    return {
      all: result.trends.length,
      use_case: result.trends.filter(t => t.queryIntent === 'use_case').length,
      product: result.trends.filter(t => t.queryIntent === 'product').length,
      industry: result.trends.filter(t => t.queryIntent === 'industry' || t.queryIntent === 'trend').length,
      outcome: result.trends.filter(t => t.queryIntent === 'outcome').length,
      persona: result.trends.filter(t => t.queryIntent === 'persona').length,
      pain_point: result.trends.filter(t => t.queryIntent === 'pain_point').length
    };
  }, [result?.trends]);

  // Handlers
  const handleFetchTrends = useCallback(async () => {
    if (!uvp) {
      console.error('[TrendsPanel] No UVP data available');
      return;
    }
    await executePipeline(uvp);
  }, [uvp, executePipeline]);

  const handleToggle = useCallback((id: string) => {
    setSelectedTrends(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
    // Also notify parent if callback provided
    if (onSelectTrend) {
      const trend = result?.trends.find(t => t.id === id);
      if (trend) onSelectTrend(trend);
    }
  }, [result?.trends, onSelectTrend]);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedTrends(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Header Bar */}
      <div className="flex-shrink-0 px-4 py-3 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          {/* Left: Title & Status */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                Trends 2.0
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-green-100 text-green-700 rounded">NEW</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isLoading ? (
                  <span className="text-green-600">{state.statusMessage}</span>
                ) : hasCachedData ? (
                  <span className="text-green-600">
                    {result?.trends.length} trends found
                  </span>
                ) : (
                  'UVP-informed trend intelligence'
                )}
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {hasCachedData && (
              <button
                onClick={clearCache}
                className="flex items-center gap-1.5 px-2 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            )}

            <button
              onClick={handleFetchTrends}
              disabled={isLoading || !uvp}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-semibold transition-all ${
                isLoading
                  ? 'bg-green-100 text-green-600 cursor-wait'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-sm disabled:opacity-50'
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
                  Scan Trends
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2"
          >
            <div className="h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${state.progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Filter Tabs */}
      {result?.trends && result.trends.length > 0 && (
        <>
          {/* Main Filter */}
          <div className="flex-shrink-0 px-4 py-2 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              {(Object.keys(MAIN_FILTER_CONFIG) as MainFilter[]).map((filter) => {
                const config = MAIN_FILTER_CONFIG[filter];
                const Icon = config.icon;
                const count = filter === 'all' ? (result?.trends.length || 0) :
                              filter === 'content_ready' ? (result?.stats.contentReadyCount || 0) : 0;

                return (
                  <button
                    key={filter}
                    onClick={() => setMainFilter(filter)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                      mainFilter === filter
                        ? 'bg-green-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-green-100'
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

          {/* Intent Filter */}
          <div className="flex-shrink-0 px-4 py-2 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-1 overflow-x-auto">
              <span className="text-[10px] font-medium text-gray-500 mr-1 whitespace-nowrap">Filter by Type:</span>
              {(Object.keys(INTENT_FILTER_CONFIG) as IntentFilter[]).map((intent) => {
                const config = INTENT_FILTER_CONFIG[intent];
                const Icon = config.icon;
                const count = intentCounts[intent];

                return (
                  <button
                    key={intent}
                    onClick={() => setIntentFilter(intent)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all whitespace-nowrap ${
                      intentFilter === intent
                        ? config.color === 'green' ? 'bg-green-600 text-white shadow-sm' :
                          config.color === 'blue' ? 'bg-blue-600 text-white shadow-sm' :
                          config.color === 'orange' ? 'bg-orange-600 text-white shadow-sm' :
                          config.color === 'purple' ? 'bg-purple-600 text-white shadow-sm' :
                          config.color === 'emerald' ? 'bg-emerald-600 text-white shadow-sm' :
                          config.color === 'pink' ? 'bg-pink-600 text-white shadow-sm' :
                          'bg-gray-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600'
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
        </>
      )}

      {/* Content Area */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {!hasCachedData ? (
            <div className="flex flex-col items-center justify-center py-12 bg-white dark:bg-slate-800 rounded-xl">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Trends 2.0 Ready
              </h2>
              <p className="text-sm text-gray-500 text-center max-w-sm mb-4">
                Discover UVP-informed trends with multi-source validation and ready-to-use content angles.
              </p>
              <div className="flex items-center gap-3 mb-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Brain className="w-3 h-3" />
                  UVP-Informed
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Multi-Source
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Content Ready
                </div>
              </div>
              <button
                onClick={handleFetchTrends}
                disabled={!uvp}
                className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 font-semibold text-sm flex items-center gap-2 shadow-lg shadow-green-500/25 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                Run Trends 2.0
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredTrends.map((trend) => (
                  <TrendCard
                    key={trend.id}
                    trend={trend}
                    isSelected={selectedTrends.includes(trend.id)}
                    isExpanded={expandedTrends.has(trend.id)}
                    onToggle={() => handleToggle(trend.id)}
                    onToggleExpand={() => handleToggleExpand(trend.id)}
                  />
                ))}
              </AnimatePresence>

              {filteredTrends.length === 0 && (
                <div className="col-span-2 flex flex-col items-center justify-center py-12 bg-white dark:bg-slate-800 rounded-xl">
                  <Target className="w-12 h-12 text-gray-300 mb-4" />
                  <p className="text-gray-500">No trends match the current filters</p>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default TrendsPanel;
