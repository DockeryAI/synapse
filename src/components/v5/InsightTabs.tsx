/**
 * Insight Tabs Component - V5 Standalone Version
 *
 * Dynamic tabbed interface for displaying insights matching V4 design.
 * Tabs are dynamically shown based on industry profile enabledTabs.
 *
 * Tab Types:
 * - All: Shows all insight types
 * - Triggers: Psychological triggers
 * - Proof: Social proof points
 * - Trends: Industry trends
 * - Competition: Competitor gaps
 * - Local: Location-based (conditional)
 * - Weather: Weather-triggered (conditional)
 *
 * Created: 2025-12-01
 */

import React, { useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  CheckCircle2,
  TrendingUp,
  Target,
  MapPin,
  Cloud,
  Sparkles,
  Filter,
  SortDesc,
  Search,
  RefreshCw,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { InsightCard, type Insight, type InsightType, type TriggerInsight } from './InsightCards';

// Triggers 4.0 Components - Source-locked architecture
import { TriggerCardGrid } from './TriggerCardV4';
import { TriggerFilters, applyTriggerFilters, DEFAULT_FILTERS, type TriggerFilterState } from './TriggerFilters';
import type { ConsolidatedTrigger, TriggerCategory, EvidenceItem } from '@/services/triggers/trigger-consolidation.service';

// ============================================================================
// TYPES
// ============================================================================

export type FilterType = 'all' | 'triggers' | 'proof' | 'trends' | 'competition' | 'local' | 'weather';

export interface EnabledTabs {
  triggers: boolean;
  proof: boolean;
  trends: boolean;
  conversations: boolean;
  competitors: boolean;
  local: boolean;
  weather: boolean;
}

export interface InsightTabsProps {
  insights: Insight[];
  enabledTabs?: EnabledTabs;
  selectedInsights: Set<string>;
  onToggleInsight: (id: string) => void;
  onUseInsight?: (insight: Insight) => void;
  isLoading?: boolean;
  onRefreshTab?: (tabType: InsightType) => Promise<void>;
  refreshingTab?: InsightType | null;
}

// ============================================================================
// TAB CONFIGURATION
// ============================================================================

interface TabConfig {
  id: FilterType;
  label: string;
  icon: React.ElementType;
  color: string;
  activeColor: string;
  description: string;
}

const BASE_TABS: TabConfig[] = [
  {
    id: 'all',
    label: 'All',
    icon: Sparkles,
    color: 'text-gray-600',
    activeColor: 'bg-purple-600',
    description: 'All insight types combined',
  },
  {
    id: 'triggers',
    label: 'Triggers',
    icon: Heart,
    color: 'text-red-600',
    activeColor: 'bg-red-600',
    description: 'Psychological hooks and emotional drivers',
  },
  {
    id: 'proof',
    label: 'Proof',
    icon: CheckCircle2,
    color: 'text-green-600',
    activeColor: 'bg-green-600',
    description: 'Social proof, testimonials, metrics',
  },
  {
    id: 'trends',
    label: 'Trends',
    icon: TrendingUp,
    color: 'text-blue-600',
    activeColor: 'bg-blue-600',
    description: 'Timely topics and industry shifts',
  },
  {
    id: 'competition',
    label: 'Competition',
    icon: Target,
    color: 'text-orange-600',
    activeColor: 'bg-orange-600',
    description: 'Competitor gaps and opportunities',
  },
];

const EXTENDED_TABS: TabConfig[] = [
  {
    id: 'local',
    label: 'Local',
    icon: MapPin,
    color: 'text-cyan-600',
    activeColor: 'bg-cyan-600',
    description: 'Community events and local news',
  },
  {
    id: 'weather',
    label: 'Weather',
    icon: Cloud,
    color: 'text-sky-600',
    activeColor: 'bg-sky-600',
    description: 'Weather-triggered opportunities',
  },
];

// ============================================================================
// SORT OPTIONS
// ============================================================================

type SortOption = 'confidence' | 'recency' | 'relevance';

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'confidence', label: 'Confidence' },
  { id: 'recency', label: 'Recency' },
  { id: 'relevance', label: 'Relevance' },
];

// ============================================================================
// INSIGHT TO CONSOLIDATED TRIGGER ADAPTER
// ============================================================================

/**
 * Converts Insight[] (trigger type) to ConsolidatedTrigger[] format
 * for use with the V4 TriggerCardGrid component.
 *
 * This adapter bridges the generic Insight format from the API
 * to the rich ConsolidatedTrigger format expected by the V4 components.
 */
function insightsToConsolidatedTriggers(insights: Insight[]): ConsolidatedTrigger[] {
  return insights
    .filter((insight): insight is TriggerInsight => insight.type === 'trigger')
    .map((insight): ConsolidatedTrigger => {
      // Map category - normalize to valid TriggerCategory
      const categoryMap: Record<string, TriggerCategory> = {
        fear: 'fear',
        desire: 'desire',
        'pain-point': 'pain-point',
        objection: 'objection',
        motivation: 'motivation',
        trust: 'trust',
        urgency: 'urgency',
      };
      const category = categoryMap[insight.category?.toLowerCase() || 'motivation'] || 'motivation';

      // Build evidence array from the insight's source
      const evidence: EvidenceItem[] = [];
      if (insight.source || insight.sourceUrl) {
        evidence.push({
          id: `${insight.id}-evidence-1`,
          source: insight.source || 'Unknown',
          platform: extractPlatformFromSource(insight.source || insight.sourceUrl || ''),
          quote: insight.text,
          url: insight.sourceUrl,
          sentiment: 'neutral',
          confidence: (insight.confidence ?? 50) / 100,
          // verifiedSourceId would be set by the source preservation system
          // For now, we don't have it from the generic Insight format
        });
      }

      return {
        id: insight.id,
        category,
        title: insight.text.length > 100 ? insight.text.substring(0, 100) + '...' : insight.text,
        executiveSummary: insight.text,
        confidence: (insight.confidence ?? 50) / 100,
        evidenceCount: evidence.length,
        evidence,
        uvpAlignments: [],
        isTimeSensitive: insight.isSurge || false,
        profileRelevance: 0.5,
        rawSourceIds: [insight.id],
        buyerJourneyStage: insight.buyingStage as any,
      };
    });
}

/**
 * Extract platform name from source string or URL
 */
function extractPlatformFromSource(source: string): string {
  const lower = source.toLowerCase();
  if (lower.includes('reddit')) return 'reddit';
  if (lower.includes('twitter') || lower.includes('x.com')) return 'twitter';
  if (lower.includes('youtube')) return 'youtube';
  if (lower.includes('linkedin')) return 'linkedin';
  if (lower.includes('g2')) return 'g2';
  if (lower.includes('trustpilot')) return 'trustpilot';
  if (lower.includes('hackernews') || lower.includes('ycombinator')) return 'hackernews';
  if (lower.includes('quora')) return 'quora';
  return 'unknown';
}

// ============================================================================
// DEFAULT ENABLED TABS (all enabled for dev)
// ============================================================================

const DEFAULT_ENABLED_TABS: EnabledTabs = {
  triggers: true,
  proof: true,
  trends: true,
  conversations: true,
  competitors: true,
  local: true,
  weather: true,
};

// ============================================================================
// LOADING SKELETON
// ============================================================================

function InsightSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden animate-pulse">
      <div className="p-3 bg-gray-50 dark:bg-slate-800">
        <div className="flex items-start gap-2">
          <div className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-slate-700" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-4 w-16 bg-gray-200 dark:bg-slate-700 rounded" />
              <div className="h-4 w-10 bg-gray-200 dark:bg-slate-700 rounded" />
            </div>
            <div className="h-4 w-full bg-gray-200 dark:bg-slate-700 rounded" />
            <div className="h-4 w-2/3 bg-gray-200 dark:bg-slate-700 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const InsightTabs = memo(function InsightTabs({
  insights,
  enabledTabs = DEFAULT_ENABLED_TABS,
  selectedInsights,
  onToggleInsight,
  onUseInsight,
  isLoading = false,
  onRefreshTab,
  refreshingTab,
}: InsightTabsProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('confidence');
  const [showFilters, setShowFilters] = useState(false);

  // Triggers 4.0: Filter state for V4 trigger cards
  const [triggerFilters, setTriggerFilters] = useState<TriggerFilterState>(DEFAULT_FILTERS);

  // Build available tabs based on enabledTabs
  const availableTabs = useMemo(() => {
    const tabs = [...BASE_TABS];

    // Add conditional tabs
    if (enabledTabs.local) {
      tabs.push(EXTENDED_TABS[0]);
    }
    if (enabledTabs.weather) {
      tabs.push(EXTENDED_TABS[1]);
    }

    return tabs;
  }, [enabledTabs]);

  // Map filter type to insight type
  const filterToInsightType = (filter: FilterType): InsightType | null => {
    switch (filter) {
      case 'triggers': return 'trigger';
      case 'proof': return 'proof';
      case 'trends': return 'trend';
      case 'competition': return 'competitor';
      case 'local': return 'local';
      case 'weather': return 'weather';
      default: return null;
    }
  };

  // Filter insights
  const filteredInsights = useMemo(() => {
    let filtered = [...insights];

    // Filter by tab
    if (activeFilter !== 'all') {
      const insightType = filterToInsightType(activeFilter);
      if (insightType) {
        filtered = filtered.filter(i => i.type === insightType);
      }
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(i =>
        i.text.toLowerCase().includes(query) ||
        i.source?.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'confidence':
          const aConf = 'confidence' in a ? (a as any).confidence : ('relevanceScore' in a ? (a as any).relevanceScore : ('qualityScore' in a ? (a as any).qualityScore : 50));
          const bConf = 'confidence' in b ? (b as any).confidence : ('relevanceScore' in b ? (b as any).relevanceScore : ('qualityScore' in b ? (b as any).qualityScore : 50));
          return bConf - aConf;
        case 'recency':
          const aDays = 'recencyDays' in a ? (a as any).recencyDays : 999;
          const bDays = 'recencyDays' in b ? (b as any).recencyDays : 999;
          return aDays - bDays;
        default:
          return 0;
      }
    });

    return filtered;
  }, [insights, activeFilter, searchQuery, sortBy]);

  // Count insights by type
  const insightCounts = useMemo(() => {
    return {
      all: insights.length,
      triggers: insights.filter(i => i.type === 'trigger').length,
      proof: insights.filter(i => i.type === 'proof').length,
      trends: insights.filter(i => i.type === 'trend').length,
      competition: insights.filter(i => i.type === 'competitor').length,
      local: insights.filter(i => i.type === 'local').length,
      weather: insights.filter(i => i.type === 'weather').length,
    };
  }, [insights]);

  // Triggers 4.0: Convert insights to ConsolidatedTrigger format for V4 cards
  const consolidatedTriggers = useMemo(() => {
    const allTriggers = insightsToConsolidatedTriggers(insights);
    // Apply V4 trigger filters
    return applyTriggerFilters(allTriggers, triggerFilters);
  }, [insights, triggerFilters]);

  // Handler for trigger card click - toggles selection
  const handleTriggerClick = (trigger: ConsolidatedTrigger) => {
    onToggleInsight(trigger.id);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tab Bar */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-center gap-2 p-2 overflow-x-auto">
          {availableTabs.map((tab) => {
            const count = insightCounts[tab.id];
            const isActive = activeFilter === tab.id;
            const TabIcon = tab.icon;
            const insightType = filterToInsightType(tab.id);
            const isRefreshingThisTab = refreshingTab === insightType;

            return (
              <div key={tab.id} className="flex items-center gap-1">
                <button
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? tab.id === 'local' ? 'bg-cyan-600 text-white'
                      : tab.id === 'weather' ? 'bg-sky-600 text-white'
                      : 'bg-purple-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/20'
                  }`}
                  title={tab.description}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className="ml-1.5 text-xs opacity-70">
                      {count}
                    </span>
                  )}
                </button>
                {/* Per-tab refresh button (only for non-'all' tabs) */}
                {tab.id !== 'all' && onRefreshTab && insightType && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRefreshTab(insightType);
                    }}
                    disabled={isRefreshingThisTab || isLoading}
                    className={`p-1 rounded transition-colors ${
                      isRefreshingThisTab
                        ? 'text-purple-500 animate-pulse'
                        : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                    }`}
                    title={`Refresh ${tab.label} insights`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingThisTab ? 'animate-spin' : ''}`} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex-shrink-0 flex items-center gap-2 p-2 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search insights..."
            className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            <SortDesc className="w-4 h-4" />
            <span>{SORT_OPTIONS.find(s => s.id === sortBy)?.label}</span>
          </button>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute right-0 top-full mt-1 z-10 w-36 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-600 py-1"
              >
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      setSortBy(option.id);
                      setShowFilters(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 ${
                      sortBy === option.id ? 'text-purple-600 dark:text-purple-400 font-medium' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Selected Count */}
        {selectedInsights.size > 0 && (
          <div className="px-2.5 py-1 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
            {selectedInsights.size} selected
          </div>
        )}
      </div>

      {/* Content Area */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {isLoading ? (
            // Loading skeletons
            <>
              <InsightSkeleton />
              <InsightSkeleton />
              <InsightSkeleton />
              <InsightSkeleton />
            </>
          ) : activeFilter === 'triggers' ? (
            // TRIGGERS 4.0: V4-style trigger cards with filters
            <>
              {/* V4 Trigger Filters */}
              <TriggerFilters
                triggers={insightsToConsolidatedTriggers(insights)}
                filters={triggerFilters}
                onFiltersChange={setTriggerFilters}
                className="mb-4"
              />

              {/* V4 Trigger Card Grid */}
              {consolidatedTriggers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                    <Heart className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                    No triggers match filters
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Try adjusting your filter settings
                  </p>
                </div>
              ) : (
                <TriggerCardGrid
                  triggers={consolidatedTriggers}
                  columns={2}
                  variant="default"
                  selectedId={Array.from(selectedInsights)[0]}
                  onTriggerClick={handleTriggerClick}
                />
              )}
            </>
          ) : filteredInsights.length === 0 ? (
            // Empty state
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                No insights found
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : activeFilter !== 'all'
                    ? `No ${activeFilter} insights available`
                    : 'Insights will appear here once loaded'}
              </p>
            </div>
          ) : (
            // Insight cards (non-trigger types)
            filteredInsights.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                isSelected={selectedInsights.has(insight.id)}
                onToggleSelect={onToggleInsight}
                onUseInsight={onUseInsight}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
});

export default InsightTabs;
