/**
 * Selection Area Component
 *
 * Middle column where users drop and reorder selected insights
 * Supports drag-to-reorder and removal
 */

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Trash2, Sparkles } from 'lucide-react';
import { InsightCard } from './InsightCard';
import type { CategorizedInsight } from '@/types/content-mixer.types';

interface SelectionAreaProps {
  selectedInsights: CategorizedInsight[];
  maxInsights: number;
  onRemoveInsight: (insightId: string) => void;
  onClearAll: () => void;
}

export function SelectionArea({
  selectedInsights,
  maxInsights,
  onRemoveInsight,
  onClearAll
}: SelectionAreaProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'selection-area'
  });

  const isEmpty = selectedInsights.length === 0;
  const isFull = selectedInsights.length >= maxInsights;

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-gray-900">
            Selected Insights
          </h2>
          {!isEmpty && (
            <button
              onClick={onClearAll}
              className="text-xs text-gray-600 hover:text-red-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              Clear all
            </button>
          )}
        </div>
        <p className="text-sm text-gray-600">
          {selectedInsights.length} of {maxInsights} insights selected
        </p>

        {/* Progress Bar */}
        <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isFull ? 'bg-green-500' :
              selectedInsights.length > 0 ? 'bg-blue-500' :
              'bg-gray-300'
            }`}
            style={{ width: `${(selectedInsights.length / maxInsights) * 100}%` }}
          />
        </div>
      </div>

      {/* Drop Zone */}
      <SortableContext
        items={selectedInsights.map(i => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={`
            flex-1 overflow-y-auto p-4
            ${isOver ? 'bg-blue-50' : ''}
            ${isEmpty ? 'flex items-center justify-center' : 'space-y-3'}
          `}
        >
          {isEmpty ? (
            /* Empty State */
            <div className="text-center max-w-xs">
              <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                No insights selected yet
              </h3>
              <p className="text-sm text-gray-600">
                Drag insights from the pool on the left to start building your campaign
              </p>
            </div>
          ) : (
            /* Selected Insights */
            selectedInsights.map(insight => (
              <InsightCard
                key={insight.id}
                insight={insight}
                draggable={true}
                inSelection={true}
                onRemove={() => onRemoveInsight(insight.id)}
              />
            ))
          )}
        </div>
      </SortableContext>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600">
          {isFull ? (
            <p className="text-green-700">
              ✓ Maximum insights selected. Ready to generate!
            </p>
          ) : selectedInsights.length > 0 ? (
            <p>
              💡 Add {maxInsights - selectedInsights.length} more insight{maxInsights - selectedInsights.length !== 1 ? 's' : ''} or generate now
            </p>
          ) : (
            <p>
              Select 1-{maxInsights} insights to build your campaign
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
