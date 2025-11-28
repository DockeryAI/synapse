/**
 * Insight Pool Component
 *
 * Left sidebar showing available insights organized by category tabs
 * Users drag insights from here into the Selection Area
 * V3.2: Added EQ-weighted sorting via orchestrator
 */

import { useState, useMemo } from 'react';
import { Search, ArrowUpDown, Brain } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { InsightCard } from './InsightCard';
import { analyticsService } from '@/services/analytics.service';
import type { InsightPool as InsightPoolType, InsightCategory, CategorizedInsight } from '@/types/content-mixer.types';

interface InsightPoolProps {
  pool: InsightPoolType;
  selectedInsightIds: string[];
  onInsightClick?: (insight: CategorizedInsight) => void;
  /** V3.2: EQ scores for each insight (from orchestrator scoring) */
  eqScores?: Record<string, number>;
  /** V3.2: Whether EQ scoring is available */
  hasEQContext?: boolean;
}

const categoryLabels: Record<InsightCategory, string> = {
  local: 'Local',
  trending: 'Trending',
  seasonal: 'Seasonal',
  industry: 'Industry',
  reviews: 'Reviews',
  competitive: 'Competitive'
};

const categoryDescriptions: Record<InsightCategory, string> = {
  local: 'Location-based insights and local events',
  trending: 'Viral moments and cultural trends',
  seasonal: 'Seasonal patterns and holidays',
  industry: 'Industry news and expert insights',
  reviews: 'Customer feedback and testimonials',
  competitive: 'Market gaps and opportunities'
};

export function InsightPool({
  pool,
  selectedInsightIds,
  onInsightClick,
  eqScores = {},
  hasEQContext = false
}: InsightPoolProps) {
  const [activeTab, setActiveTab] = useState<InsightCategory>('trending');
  const [searchFilter, setSearchFilter] = useState('');
  const [sortByEQ, setSortByEQ] = useState(false);

  // Make the pool droppable (for returning insights)
  const { setNodeRef } = useDroppable({
    id: 'insight-pool'
  });

  // Get insights for active category
  const categoryInsights = pool.byCategory[activeTab] || [];

  // Filter insights based on search
  const filteredInsights = categoryInsights.filter(insight => {
    if (!searchFilter) return true;
    const search = searchFilter.toLowerCase();
    return (
      insight.displayTitle.toLowerCase().includes(search) ||
      insight.insight.toLowerCase().includes(search) ||
      insight.dataSource.toLowerCase().includes(search)
    );
  });

  // Filter out already selected insights and optionally sort by EQ
  const availableInsights = useMemo(() => {
    let insights = filteredInsights.filter(
      insight => !selectedInsightIds.includes(insight.id)
    );

    // V3.2: Sort by EQ score if enabled and scores are available
    if (sortByEQ && hasEQContext && Object.keys(eqScores).length > 0) {
      insights = [...insights].sort((a, b) => {
        const scoreA = eqScores[a.id] || 50;
        const scoreB = eqScores[b.id] || 50;
        return scoreB - scoreA;
      });
    }

    return insights;
  }, [filteredInsights, selectedInsightIds, sortByEQ, hasEQContext, eqScores]);

  const categories: InsightCategory[] = ['local', 'trending', 'seasonal', 'industry', 'reviews', 'competitive'];

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Insight Pool
        </h2>
        <p className="text-sm text-gray-600">
          Drag insights to build your campaign
        </p>

        {/* Search */}
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search insights..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="border-b border-gray-200 px-2 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {categories.map(category => {
            const count = pool.countByCategory[category] || 0;
            const isActive = activeTab === category;

            return (
              <button
                key={category}
                onClick={() => setActiveTab(category)}
                className={`
                  px-3 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap
                  ${isActive
                    ? 'bg-blue-50 text-blue-700 border-t border-x border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                {categoryLabels[category]}
                <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs ${isActive ? 'bg-blue-100' : 'bg-gray-200'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tab Description + V3.2 EQ Sort Toggle */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600">
              {categoryDescriptions[activeTab]}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Available: {availableInsights.length} insights
            </p>
          </div>
          {/* V3.2: EQ Sort Toggle */}
          {hasEQContext && (
            <button
              onClick={() => {
                const newValue = !sortByEQ;
                setSortByEQ(newValue);
                analyticsService.trackEQSortToggle({
                  enabled: newValue,
                  component: 'InsightPool',
                  insightCount: availableInsights.length,
                });
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                sortByEQ
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              }`}
            >
              <Brain size={12} />
              <span>EQ</span>
              <ArrowUpDown size={10} />
            </button>
          )}
        </div>
      </div>

      {/* Insights List */}
      <div ref={setNodeRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {availableInsights.length > 0 ? (
          availableInsights.map(insight => (
            <InsightCard
              key={insight.id}
              insight={insight}
              draggable={true}
              inSelection={false}
              onRemove={undefined}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">
              {searchFilter ? (
                <>No insights match "{searchFilter}"</>
              ) : selectedInsightIds.length > 0 ? (
                <>All {categoryLabels[activeTab].toLowerCase()} insights are selected</>
              ) : (
                <>No {categoryLabels[activeTab].toLowerCase()} insights available</>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
