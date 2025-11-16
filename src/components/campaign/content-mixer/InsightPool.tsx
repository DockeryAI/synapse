/**
 * Insight Pool Component
 *
 * Left sidebar showing available insights organized by category tabs
 * Users drag insights from here into the Selection Area
 */

import { useState } from 'react';
import { Search } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { InsightCard } from './InsightCard';
import type { InsightPool as InsightPoolType, InsightCategory, CategorizedInsight } from '@/types/content-mixer.types';

interface InsightPoolProps {
  pool: InsightPoolType;
  selectedInsightIds: string[];
  onInsightClick?: (insight: CategorizedInsight) => void;
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

export function InsightPool({ pool, selectedInsightIds, onInsightClick }: InsightPoolProps) {
  const [activeTab, setActiveTab] = useState<InsightCategory>('trending');
  const [searchFilter, setSearchFilter] = useState('');

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

  // Filter out already selected insights
  const availableInsights = filteredInsights.filter(
    insight => !selectedInsightIds.includes(insight.id)
  );

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

      {/* Active Tab Description */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <p className="text-xs text-gray-600">
          {categoryDescriptions[activeTab]}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Available: {availableInsights.length} insights
        </p>
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
