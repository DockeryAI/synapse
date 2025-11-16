/**
 * Draggable Insight Card Component
 *
 * Displays a single insight with drag-and-drop capability
 * Used in both the Insight Pool and Selection Area
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, TrendingUp, MapPin, Calendar, Building2, Star, Users } from 'lucide-react';
import type { CategorizedInsight } from '@/types/content-mixer.types';

interface InsightCardProps {
  insight: CategorizedInsight;
  draggable?: boolean;
  inSelection?: boolean;
  onRemove?: () => void;
}

const categoryIcons = {
  local: MapPin,
  trending: TrendingUp,
  seasonal: Calendar,
  industry: Building2,
  reviews: Star,
  competitive: Users
};

const categoryColors = {
  local: 'text-blue-600 bg-blue-50',
  trending: 'text-purple-600 bg-purple-50',
  seasonal: 'text-green-600 bg-green-50',
  industry: 'text-orange-600 bg-orange-50',
  reviews: 'text-yellow-600 bg-yellow-50',
  competitive: 'text-red-600 bg-red-50'
};

export function InsightCard({ insight, draggable = true, inSelection = false, onRemove }: InsightCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: insight.id,
    disabled: !draggable
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const Icon = categoryIcons[insight.category];
  const colorClass = categoryColors[insight.category];

  // Confidence badge color
  const confidenceColor =
    insight.confidence >= 0.8 ? 'bg-green-100 text-green-800' :
    insight.confidence >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
    'bg-gray-100 text-gray-800';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative rounded-lg border bg-white p-3 shadow-sm
        transition-all duration-200
        ${draggable ? 'cursor-grab active:cursor-grabbing hover:shadow-md hover:border-blue-300' : ''}
        ${isDragging ? 'shadow-lg ring-2 ring-blue-400' : ''}
        ${inSelection ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'}
      `}
    >
      {/* Drag Handle */}
      {draggable && (
        <div
          {...listeners}
          {...attributes}
          className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
      )}

      {/* Remove Button (if in selection) */}
      {inSelection && onRemove && (
        <button
          onClick={onRemove}
          className="absolute right-2 top-2 p-1 rounded-full hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Remove insight"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      <div className={`${draggable ? 'pl-6' : ''} ${inSelection ? 'pr-6' : ''}`}>
        {/* Header: Category Icon + Title */}
        <div className="flex items-start gap-2 mb-2">
          <div className={`rounded-full p-1.5 ${colorClass}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
              {insight.displayTitle}
            </h4>
          </div>
        </div>

        {/* Insight Content */}
        <p className="text-xs text-gray-600 line-clamp-2 mb-2 pl-9">
          {insight.insight}
        </p>

        {/* Footer: Confidence + Data Source */}
        <div className="flex items-center justify-between pl-9 text-xs">
          {/* Data Source */}
          <span className="text-gray-500 truncate">
            {insight.dataSource}
          </span>

          {/* Confidence Badge */}
          <span className={`px-2 py-0.5 rounded-full font-medium ${confidenceColor}`}>
            {Math.round(insight.confidence * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}
