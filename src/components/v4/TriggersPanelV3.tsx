/**
 * Triggers Panel V3
 *
 * Enhanced triggers panel integrating all Triggers 3.0 Phase 5 components:
 * - TriggerCardV2 with confidence scores, source badges, recency, surge detection
 * - TriggerFilters for advanced filtering and sorting
 * - TriggerConfidenceBadge for visual confidence indicators
 * - trigger-cache.service for intelligent caching
 *
 * Features:
 * - Advanced filtering by confidence, category, source, buying stage
 * - Multi-signal stacking indicators
 * - Surge detection badges
 * - Competitor mention highlighting
 * - Profile-aware weighting and filtering
 * - Cache-first loading with background refresh
 *
 * Created: 2025-12-01
 */

import React, { memo, useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  AlertCircle,
  Sparkles,
  Shield,
  Zap,
  Clock,
  Award,
  Loader2,
  ChevronDown,
  Target,
  Play,
  Trash2,
  RefreshCw,
  BarChart3,
} from 'lucide-react';
import { TriggerCardV2, type TriggerCardV2Data } from './TriggerCardV2';
import {
  TriggerFilters,
  type TriggerFilterState,
  type TriggerSortState,
  DEFAULT_FILTER_STATE,
  DEFAULT_SORT_STATE,
} from './TriggerFilters';
import { TriggerConfidenceBadge, TriggerConfidenceBar } from './TriggerConfidenceBadge';
import {
  triggerCacheService,
  createTriggerCacheKey,
} from '@/services/triggers/trigger-cache.service';
import type {
  ConsolidatedTrigger,
  TriggerCategory,
} from '@/services/triggers/trigger-consolidation.service';
import {
  profileDetectionService,
  type BusinessProfileType,
  PROFILE_CONFIGS,
} from '@/services/triggers';
import type { DeepContext } from '@/types/synapse/deepContext.types';
import type { CompleteUVP } from '@/types/uvp-flow.types';

// ============================================================================
// TYPES
// ============================================================================

export interface TriggersPanelV3Props {
  deepContext: DeepContext | null;
  uvp: CompleteUVP | null;
  brandData?: Record<string, unknown>;
  selectedTriggers: string[];
  isLoading?: boolean;
  loadingStatus?: string;
  onToggle: (triggerId: string) => void;
  onSelectTrigger?: (trigger: ConsolidatedTrigger) => void;
  preConsolidatedTriggers?: ConsolidatedTrigger[] | null;
  onTriggerCountChange?: (count: number) => void;
  profileId?: string;
  showAdvancedFilters?: boolean;
}

// ============================================================================
// CATEGORY CONFIG
// ============================================================================

interface CategoryConfig {
  icon: React.ElementType;
  label: string;
  color: string;
  bgColor: string;
}

const CATEGORY_CONFIG: Record<TriggerCategory, CategoryConfig> = {
  fear: { icon: AlertCircle, label: 'Fear', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  desire: { icon: Sparkles, label: 'Desire', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  'pain-point': { icon: Heart, label: 'Pain Points', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  objection: { icon: Shield, label: 'Objections', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  motivation: { icon: Zap, label: 'Motivation', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  trust: { icon: Award, label: 'Trust', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  urgency: { icon: Clock, label: 'Urgency', color: 'text-rose-600', bgColor: 'bg-rose-100 dark:bg-rose-900/30' },
};

const CATEGORY_ORDER: TriggerCategory[] = [
  'pain-point',
  'fear',
  'desire',
  'objection',
  'motivation',
  'trust',
  'urgency',
];

const PROFILE_LABELS: Record<BusinessProfileType, string> = {
  'local-service-b2b': 'Local B2B Service',
  'local-service-b2c': 'Local B2C Service',
  'regional-b2b-agency': 'Regional B2B Agency',
  'regional-retail-b2c': 'Regional Retail',
  'national-saas-b2b': 'National SaaS B2B',
  'national-product-b2c': 'National Product B2C',
  'global-saas-b2b': 'Global SaaS B2B',
};

// ============================================================================
// HELPER: Convert ConsolidatedTrigger to TriggerCardV2Data
// ============================================================================

function convertToV2Data(trigger: ConsolidatedTrigger): TriggerCardV2Data {
  // Extract unique sources from evidence
  const uniqueSources = new Set(trigger.evidence?.map((e) => e.platform) || []);

  // Detect competitors from evidence
  const competitors = trigger.evidence
    ?.filter((e) => e.competitors && e.competitors.length > 0)
    .flatMap((e) => e.competitors || [])
    .filter((v, i, arr) => arr.indexOf(v) === i) || [];

  // Determine competitor sentiment from evidence
  const negativeCount = trigger.evidence?.filter((e) => e.sentiment === 'negative').length || 0;
  const positiveCount = trigger.evidence?.filter((e) => e.sentiment === 'positive').length || 0;
  const competitorSentiment =
    negativeCount > positiveCount
      ? 'negative'
      : positiveCount > negativeCount
        ? 'positive'
        : 'neutral';

  return {
    ...trigger,
    uniqueSources: uniqueSources.size,
    competitors: competitors.slice(0, 3),
    competitorSentiment: competitorSentiment as 'positive' | 'negative' | 'neutral',
    // Phase 4 fields - these would be populated by signal-stacker, surge-detector, etc.
    surgeDetected: trigger.isTimeSensitive,
    surgeSeverity: trigger.isTimeSensitive ? 'moderate' : undefined,
  };
}

// ============================================================================
// HELPER: Apply filters to triggers
// ============================================================================

function applyFilters(
  triggers: ConsolidatedTrigger[],
  filters: TriggerFilterState
): ConsolidatedTrigger[] {
  let filtered = [...triggers];

  // Search query filter
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.title.toLowerCase().includes(query) ||
        t.executiveSummary?.toLowerCase().includes(query) ||
        t.evidence?.some((e) => e.quote.toLowerCase().includes(query))
    );
  }

  // Confidence level filter
  if (filters.confidenceLevels.length > 0) {
    filtered = filtered.filter((t) => {
      const level =
        t.confidence >= 0.7 ? 'high' : t.confidence >= 0.45 ? 'medium' : 'low';
      return filters.confidenceLevels.includes(level);
    });
  }

  // Category filter
  if (filters.categories.length > 0) {
    filtered = filtered.filter((t) => filters.categories.includes(t.category));
  }

  // Source filter
  if (filters.sources.length > 0) {
    filtered = filtered.filter((t) =>
      t.evidence?.some((e) => filters.sources.includes(e.platform))
    );
  }

  // Buying stage filter
  if (filters.buyingStages.length > 0) {
    filtered = filtered.filter(
      (t) =>
        t.buyerJourneyStage && filters.buyingStages.includes(t.buyerJourneyStage as never)
    );
  }

  // Recency filter
  if (filters.recency !== 'all') {
    const now = Date.now();
    filtered = filtered.filter((t) => {
      const timestamp = t.evidence?.[0]?.timestamp;
      if (!timestamp) return filters.recency === 'all';
      const age = now - new Date(timestamp).getTime();
      const days = age / (1000 * 60 * 60 * 24);

      switch (filters.recency) {
        case 'fresh':
          return days <= 14;
        case 'recent':
          return days > 14 && days <= 30;
        case 'aging':
          return days > 30 && days <= 60;
        case 'stale':
          return days > 60;
        default:
          return true;
      }
    });
  }

  // Competitor mention filter
  if (filters.hasCompetitorMention !== null) {
    filtered = filtered.filter((t) => {
      const hasCompetitor = t.evidence?.some(
        (e) => e.competitors && e.competitors.length > 0
      );
      return filters.hasCompetitorMention ? hasCompetitor : !hasCompetitor;
    });
  }

  // Surge detected filter
  if (filters.hasSurgeDetected !== null) {
    filtered = filtered.filter((t) =>
      filters.hasSurgeDetected ? t.isTimeSensitive : !t.isTimeSensitive
    );
  }

  // Time-sensitive filter
  if (filters.isTimeSensitive !== null) {
    filtered = filtered.filter((t) =>
      filters.isTimeSensitive ? t.isTimeSensitive : !t.isTimeSensitive
    );
  }

  return filtered;
}

// ============================================================================
// HELPER: Apply sorting to triggers
// ============================================================================

function applySorting(
  triggers: ConsolidatedTrigger[],
  sort: TriggerSortState
): ConsolidatedTrigger[] {
  const sorted = [...triggers];
  const direction = sort.direction === 'desc' ? -1 : 1;

  sorted.sort((a, b) => {
    switch (sort.option) {
      case 'confidence':
        return (a.confidence - b.confidence) * direction;
      case 'recency': {
        const aTime = a.evidence?.[0]?.timestamp
          ? new Date(a.evidence[0].timestamp).getTime()
          : 0;
        const bTime = b.evidence?.[0]?.timestamp
          ? new Date(b.evidence[0].timestamp).getTime()
          : 0;
        return (aTime - bTime) * direction;
      }
      case 'relevance':
        return ((a.relevanceScore || 0) - (b.relevanceScore || 0)) * direction;
      case 'sources':
        return (a.evidenceCount - b.evidenceCount) * direction;
      default:
        return 0;
    }
  });

  return sorted;
}

// ============================================================================
// CATEGORY GROUP COMPONENT
// ============================================================================

interface CategoryGroupProps {
  category: TriggerCategory;
  triggers: TriggerCardV2Data[];
  selectedTriggers: string[];
  expandedCard: string | null;
  onToggle: (id: string) => void;
  onToggleExpand: (id: string, e: React.MouseEvent) => void;
  showAdvancedMetrics: boolean;
}

const CategoryGroup = memo(function CategoryGroup({
  category,
  triggers,
  selectedTriggers,
  expandedCard,
  onToggle,
  onToggleExpand,
  showAdvancedMetrics,
}: CategoryGroupProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const config = CATEGORY_CONFIG[category];
  const Icon = config.icon;

  if (triggers.length === 0) return null;

  // Calculate average confidence for this category
  const avgConfidence =
    triggers.reduce((sum, t) => sum + t.confidence, 0) / triggers.length;

  return (
    <div className="mb-6">
      {/* Category Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center gap-3 mb-3 group"
      >
        <div
          className={`w-8 h-8 ${config.bgColor} rounded-lg flex items-center justify-center`}
        >
          <Icon className={`w-4 h-4 ${config.color}`} />
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              {config.label}
            </h3>
            <TriggerConfidenceBadge score={avgConfidence} size="sm" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {triggers.length} trigger{triggers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
        />
      </button>

      {/* Trigger Cards */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="grid grid-cols-2 gap-3">
              {triggers.map((trigger) => (
                <TriggerCardV2
                  key={trigger.id}
                  trigger={trigger}
                  isSelected={selectedTriggers.includes(trigger.id)}
                  isExpanded={expandedCard === trigger.id}
                  onToggleSelect={() => onToggle(trigger.id)}
                  onToggleExpand={(e) => onToggleExpand(trigger.id, e)}
                  showAdvancedMetrics={showAdvancedMetrics}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ============================================================================
// MAIN PANEL COMPONENT
// ============================================================================

export const TriggersPanelV3 = memo(function TriggersPanelV3({
  deepContext,
  uvp,
  brandData,
  selectedTriggers,
  isLoading = false,
  loadingStatus = 'Loading triggers...',
  onToggle,
  onSelectTrigger,
  preConsolidatedTriggers,
  onTriggerCountChange,
  profileId,
  showAdvancedFilters = true,
}: TriggersPanelV3Props) {
  // State
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [filters, setFilters] = useState<TriggerFilterState>(DEFAULT_FILTER_STATE);
  const [sort, setSort] = useState<TriggerSortState>(DEFAULT_SORT_STATE);
  const [showFilters, setShowFilters] = useState(false);

  // Get triggers from props or cache
  const rawTriggers = useMemo(() => {
    if (preConsolidatedTriggers && preConsolidatedTriggers.length > 0) {
      return preConsolidatedTriggers;
    }

    // Try cache
    if (profileId) {
      const cacheKey = createTriggerCacheKey(profileId);
      const cached = triggerCacheService.get<ConsolidatedTrigger[]>(cacheKey);
      if (cached.data) {
        return cached.data;
      }
    }

    return [];
  }, [preConsolidatedTriggers, profileId]);

  // Detect business profile
  const detectedProfile = useMemo((): BusinessProfileType | undefined => {
    if (!uvp) return undefined;
    const analysis = profileDetectionService.detectProfile(uvp, brandData);
    return analysis.profileType;
  }, [uvp, brandData]);

  // Extract available sources from triggers
  const availableSources = useMemo(() => {
    const sources = new Set<string>();
    rawTriggers.forEach((t) => {
      t.evidence?.forEach((e) => {
        if (e.platform) sources.add(e.platform);
      });
    });
    return Array.from(sources).sort();
  }, [rawTriggers]);

  // Apply filters and sorting
  const filteredTriggers = useMemo(() => {
    let result = applyFilters(rawTriggers, filters);
    result = applySorting(result, sort);
    return result;
  }, [rawTriggers, filters, sort]);

  // Convert to V2 data format
  const v2Triggers = useMemo(() => {
    return filteredTriggers.map(convertToV2Data);
  }, [filteredTriggers]);

  // Group by category
  const groupedTriggers = useMemo(() => {
    const grouped = new Map<TriggerCategory, TriggerCardV2Data[]>();
    CATEGORY_ORDER.forEach((cat) => grouped.set(cat, []));

    v2Triggers.forEach((trigger) => {
      const list = grouped.get(trigger.category) || [];
      list.push(trigger);
      grouped.set(trigger.category, list);
    });

    return grouped;
  }, [v2Triggers]);

  // Report trigger count to parent
  useEffect(() => {
    if (onTriggerCountChange) {
      onTriggerCountChange(filteredTriggers.length);
    }
  }, [filteredTriggers.length, onTriggerCountChange]);

  // Handlers
  const handleToggleExpand = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCard((prev) => (prev === id ? null : id));
  }, []);

  const handleFiltersChange = useCallback((newFilters: TriggerFilterState) => {
    setFilters(newFilters);
  }, []);

  const handleSortChange = useCallback((newSort: TriggerSortState) => {
    setSort(newSort);
  }, []);

  const handleClearCache = useCallback(() => {
    if (profileId) {
      triggerCacheService.invalidateProfile(profileId);
    } else {
      triggerCacheService.clear();
    }
  }, [profileId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Loading Triggers...
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          {loadingStatus}
        </p>
      </div>
    );
  }

  // No triggers state
  if (rawTriggers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-purple-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Triggers Found
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
          Complete the UVP flow and fetch data to discover psychological triggers.
        </p>
      </div>
    );
  }

  // Calculate stats
  const avgConfidence =
    rawTriggers.reduce((sum, t) => sum + t.confidence, 0) / rawTriggers.length;
  const highConfidenceCount = rawTriggers.filter((t) => t.confidence >= 0.7).length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 mb-4">
        {/* Profile Badge and Stats */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Profile:</span>
            <span className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg">
              {PROFILE_LABELS[detectedProfile || 'global-saas-b2b']}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Stats */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {filteredTriggers.length} of {rawTriggers.length} triggers
              </span>
              <TriggerConfidenceBadge score={avgConfidence} size="sm" />
              <span className="text-xs text-green-600 dark:text-green-400">
                {highConfidenceCount} high
              </span>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                showFilters
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              <BarChart3 className="w-3 h-3" />
              Filters
            </button>

            {/* Clear Cache */}
            <button
              onClick={handleClearCache}
              className="flex items-center gap-1 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              title="Clear cached data"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && showAdvancedFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pb-4 border-b border-gray-200 dark:border-slate-700 mb-4">
                <TriggerFilters
                  filters={filters}
                  sort={sort}
                  onFiltersChange={handleFiltersChange}
                  onSortChange={handleSortChange}
                  availableSources={availableSources}
                  totalCount={rawTriggers.length}
                  filteredCount={filteredTriggers.length}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Category Filter (always visible) */}
        {!showFilters && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() =>
                setFilters({ ...filters, categories: [] })
              }
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                filters.categories.length === 0
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-purple-100 dark:hover:bg-purple-900/20'
              }`}
            >
              All ({rawTriggers.length})
            </button>
            {CATEGORY_ORDER.map((cat) => {
              const count = rawTriggers.filter((t) => t.category === cat).length;
              if (count === 0) return null;
              const config = CATEGORY_CONFIG[cat];
              const isActive =
                filters.categories.length === 1 && filters.categories[0] === cat;
              return (
                <button
                  key={cat}
                  onClick={() =>
                    setFilters({
                      ...filters,
                      categories: isActive ? [] : [cat],
                    })
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-purple-600 text-white'
                      : `${config.bgColor} ${config.color} hover:opacity-80`
                  }`}
                >
                  <config.icon className="w-3 h-3" />
                  {config.label} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Triggers Grid */}
      <div className="flex-1 overflow-y-auto">
        {filters.categories.length === 0 || filters.categories.length > 1 ? (
          // Show grouped view
          CATEGORY_ORDER.map((category) => (
            <CategoryGroup
              key={category}
              category={category}
              triggers={groupedTriggers.get(category) || []}
              selectedTriggers={selectedTriggers}
              expandedCard={expandedCard}
              onToggle={onToggle}
              onToggleExpand={handleToggleExpand}
              showAdvancedMetrics={showAdvancedFilters}
            />
          ))
        ) : (
          // Show flat grid for single category
          <div className="grid grid-cols-2 gap-3">
            {v2Triggers.map((trigger) => (
              <TriggerCardV2
                key={trigger.id}
                trigger={trigger}
                isSelected={selectedTriggers.includes(trigger.id)}
                isExpanded={expandedCard === trigger.id}
                onToggleSelect={() => onToggle(trigger.id)}
                onToggleExpand={(e) => handleToggleExpand(trigger.id, e)}
                showAdvancedMetrics={showAdvancedFilters}
              />
            ))}
          </div>
        )}

        {/* Empty filtered state */}
        {filteredTriggers.length === 0 && rawTriggers.length > 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
              <Target className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              No Matching Triggers
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
              Try adjusting your filters to see more results.
            </p>
            <button
              onClick={() => setFilters(DEFAULT_FILTER_STATE)}
              className="mt-3 px-3 py-1.5 text-xs font-medium text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default TriggersPanelV3;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { TriggerFilterState, TriggerSortState };
