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

import React, { useState, useMemo, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  CheckCircle2,
  TrendingUp,
  Target,
  MapPin,
  Cloud,
  Sparkles,
  SortDesc,
  Search,
  RefreshCw,
  Users,
  Zap,
  Loader2,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { InsightCard, type Insight, type InsightType, type TriggerInsight, type V6SourceTab } from './InsightCards';

// V6: Use new V6 insight types and components (no emotion pipeline)
import { V6InsightGrid } from '@/components/v6/V6InsightCard';
import { toV6Insight, type V6Insight } from '@/services/synapse-v6/v6-insight-types';
import { useV6ConnectionDiscovery } from '@/hooks/useV6ConnectionDiscovery';
import type { PassType } from '@/services/triggers/trigger-synthesis.service';

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

/** UVP data for alignment checking */
export interface UVPData {
  target_customer?: string;
  key_benefit?: string;
  unique_solution?: string;
  transformation?: string;
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
  /** Brand UVP data for alignment calculation */
  uvpData?: UVPData;
  /** Multi-pass loading state for progressive trigger loading */
  triggerLoadingState?: {
    isLoading: boolean;
    currentPass?: PassType;
    completedPasses: number;
    totalPasses: number;
  };
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

// V6 Tab Configuration - Per Build Plan Phase 4
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
    label: 'Voice of Customer',
    icon: Heart,
    color: 'text-red-600',
    activeColor: 'bg-red-600',
    description: 'Direct customer language from reviews & testimonials',
  },
  {
    id: 'proof',
    label: 'Community',
    icon: CheckCircle2,
    color: 'text-green-600',
    activeColor: 'bg-green-600',
    description: 'Organic conversations from Reddit, forums, social',
  },
  {
    id: 'competition',
    label: 'Competitive',
    icon: Target,
    color: 'text-orange-600',
    activeColor: 'bg-orange-600',
    description: 'Competitor positioning and gaps',
  },
  {
    id: 'trends',
    label: 'Industry Trends',
    icon: TrendingUp,
    color: 'text-blue-600',
    activeColor: 'bg-blue-600',
    description: 'Emerging patterns and market shifts',
  },
];

// V6 Extended Tabs - Search Intent + Local/Timing
const EXTENDED_TABS: TabConfig[] = [
  {
    id: 'local',
    label: 'Search Intent',
    icon: Search,
    color: 'text-cyan-600',
    activeColor: 'bg-cyan-600',
    description: 'What prospects are searching for',
  },
  {
    id: 'weather',
    label: 'Local/Timing',
    icon: MapPin,
    color: 'text-sky-600',
    activeColor: 'bg-sky-600',
    description: 'Weather, events, seasonal signals',
  },
];

// ============================================================================
// SORT OPTIONS
// Phase 7 V5 Simplified: Sort by source count only (honest metric)
// ============================================================================

type SortOption = 'sources' | 'recency';

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'sources', label: 'Sources' },
  { id: 'recency', label: 'Recency' },
];

// ============================================================================
// V6 INSIGHT ADAPTER
// ============================================================================

/**
 * V6: Convert generic Insights to V6Insight format
 * NO emotion categorization - just source-based tabs
 */
function insightsToV6(insights: Insight[]): V6Insight[] {
  return insights.map(insight => toV6Insight(insight));
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
  uvpData,
  triggerLoadingState,
}: InsightTabsProps) {
  // Default to 'triggers' tab so users see ProgressiveLoadingGrid with BorderBeam animation on load
  const [activeFilter, setActiveFilter] = useState<FilterType>('triggers');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('sources');
  const [showFilters, setShowFilters] = useState(false);

  // V6 Connection Discovery - V1 engine integration
  const {
    isAnalyzing: isAnalyzingConnections,
    insights: connectedInsights,
    stats: connectionStats,
    threeWayConnections,
    error: connectionError,
    analyzeConnections,
    clearConnections,
  } = useV6ConnectionDiscovery();
  const [showConnections, setShowConnections] = useState(false);

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
  // V6: Map UI filter tabs to sourceTab values
  const filterToSourceTab = (filter: FilterType): V6SourceTab | null => {
    switch (filter) {
      case 'triggers': return 'voc';
      case 'proof': return 'community';
      case 'competition': return 'competitive';
      case 'trends': return 'trends';
      case 'local': return 'search';
      case 'weather': return 'local_timing';
      default: return null;
    }
  };

  // Legacy: Map to insight type for V5 fallback
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

    // Filter by tab - V6 uses sourceTab, fallback to type for V5
    if (activeFilter !== 'all') {
      const sourceTab = filterToSourceTab(activeFilter);
      const insightType = filterToInsightType(activeFilter);

      filtered = filtered.filter(i => {
        // V6: Check sourceTab first
        if (i.sourceTab) {
          return i.sourceTab === sourceTab;
        }
        // V5 fallback: Check insight type
        return i.type === insightType;
      });
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(i => {
        const textMatch = i.text?.toLowerCase().includes(query);
        // Handle source as string or object
        const sourceStr = typeof i.source === 'object'
          ? (i.source as any)?.name || ''
          : i.source || '';
        const sourceMatch = sourceStr.toLowerCase().includes(query);
        return textMatch || sourceMatch;
      });
    }

    // Sort - Phase 7 V5 Simplified: Sort by source count (honest metric)
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'sources':
          // Sort by evidence/source count (higher is better)
          const aSources = 'evidence' in a ? (a as any).evidence?.length || 0 : 0;
          const bSources = 'evidence' in b ? (b as any).evidence?.length || 0 : 0;
          return bSources - aSources;
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

  // Count insights by sourceTab (V6) with fallback to type (V5)
  const insightCounts = useMemo(() => {
    const countBySourceTab = (sourceTab: V6SourceTab, fallbackType: InsightType) => {
      return insights.filter(i => i.sourceTab ? i.sourceTab === sourceTab : i.type === fallbackType).length;
    };

    return {
      all: insights.length,
      triggers: countBySourceTab('voc', 'trigger'),
      proof: countBySourceTab('community', 'proof'),
      trends: countBySourceTab('trends', 'trend'),
      competition: countBySourceTab('competitive', 'competitor'),
      local: countBySourceTab('search', 'local'),
      weather: countBySourceTab('local_timing', 'weather'),
    };
  }, [insights]);

  // V6: Convert all insights to V6 format (no emotion categorization)
  // Use connected insights when available (after connection analysis)
  const v6Insights = useMemo(() => {
    if (showConnections && connectedInsights.length > 0) {
      // Filter connected insights by current tab/search
      const filteredIds = new Set(filteredInsights.map(i => i.id));
      return connectedInsights.filter(ci => filteredIds.has(ci.id));
    }
    return insightsToV6(filteredInsights);
  }, [filteredInsights, showConnections, connectedInsights]);

  // Handler for Find Connections button
  const handleFindConnections = useCallback(async () => {
    const allV6 = insightsToV6(insights);
    await analyzeConnections(allV6);
    setShowConnections(true);
  }, [insights, analyzeConnections]);

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

        {/* V6: Find Connections Button */}
        <button
          onClick={handleFindConnections}
          disabled={isAnalyzingConnections || insights.length < 2}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-all ${
            showConnections
              ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
              : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300'
          } ${isAnalyzingConnections ? 'opacity-70' : ''}`}
          title="Find cross-domain connections using V1 engine"
        >
          {isAnalyzingConnections ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
          <span>{showConnections ? 'Connections On' : 'Find Connections'}</span>
          {connectionStats && (
            <span className="text-xs opacity-70">({connectionStats.totalConnections})</span>
          )}
        </button>

        {/* Selected Count */}
        {selectedInsights.size > 0 && (
          <div className="px-2.5 py-1 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
            {selectedInsights.size} selected
          </div>
        )}
      </div>

      {/* V6: Connection Stats Bar (when connections active) */}
      {showConnections && connectionStats && (
        <div className="flex-shrink-0 flex items-center gap-4 px-4 py-2 border-b border-yellow-500/30 bg-yellow-500/10">
          <div className="flex items-center gap-1.5 text-sm text-yellow-400">
            <Zap className="w-4 h-4" />
            <span className="font-medium">{connectionStats.totalConnections} connections</span>
          </div>
          <div className="text-xs text-yellow-400/70">
            {connectionStats.crossDomainConnections} cross-domain
          </div>
          {threeWayConnections.length > 0 && (
            <div className="text-xs text-yellow-300 font-medium">
              ⚡ {threeWayConnections.length} breakthrough{threeWayConnections.length !== 1 ? 's' : ''}!
            </div>
          )}
          <button
            onClick={() => {
              setShowConnections(false);
              clearConnections();
            }}
            className="ml-auto text-xs text-yellow-400/70 hover:text-yellow-300"
          >
            Clear
          </button>
        </div>
      )}

      {/* Content Area - V6: All tabs use V6InsightGrid (no emotion pipeline) */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {isLoading ? (
            // Loading skeletons
            <div className="grid grid-cols-3 gap-3">
              <InsightSkeleton />
              <InsightSkeleton />
              <InsightSkeleton />
              <InsightSkeleton />
              <InsightSkeleton />
              <InsightSkeleton />
            </div>
          ) : v6Insights.length === 0 ? (
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
            // V6: Single unified grid for all tabs - source-based, no emotion categories
            <V6InsightGrid
              insights={v6Insights}
              selectedIds={selectedInsights}
              onSelect={onToggleInsight}
              columns={3}
              showConnections={showConnections}
            />
          )}
        </div>
      </ScrollArea>
    </div>
  );
});

export default InsightTabs;
