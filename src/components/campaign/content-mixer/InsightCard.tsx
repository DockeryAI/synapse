/**
 * Draggable Insight Card Component
 *
 * Displays a single insight with drag-and-drop capability
 * Used in both the Insight Pool and Selection Area
 */

import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, TrendingUp, MapPin, Calendar, Building2, Star, Users, Zap } from 'lucide-react';
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
  local: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30',
  trending: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/30',
  seasonal: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30',
  industry: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/30',
  reviews: 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/30',
  competitive: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30'
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

  // Confidence badge color (purple/blue theme)
  const confidenceColor =
    insight.confidence >= 0.8 ? 'bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 dark:from-purple-900/30 dark:to-blue-900/30 dark:text-purple-300' :
    insight.confidence >= 0.6 ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
    'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      whileHover={draggable ? { scale: 1.02 } : undefined}
      className={`
        group relative rounded-xl border bg-white dark:bg-slate-800 p-3 shadow-lg
        transition-all duration-200
        ${draggable ? 'cursor-grab active:cursor-grabbing hover:shadow-xl hover:border-purple-300 dark:hover:border-purple-600' : ''}
        ${isDragging ? 'shadow-2xl ring-2 ring-purple-400' : ''}
        ${inSelection ? 'border-purple-200 dark:border-purple-700 bg-gradient-to-br from-purple-50/30 via-blue-50/30 to-violet-50/30 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-violet-900/20' : 'border-purple-200 dark:border-purple-700'}
      `}
    >
      {/* Drag Handle */}
      {draggable && (
        <motion.div
          {...listeners}
          {...attributes}
          whileHover={{ scale: 1.1 }}
          className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-4 w-4 text-purple-400 dark:text-purple-500" />
        </motion.div>
      )}

      {/* Remove Button (if in selection) */}
      {inSelection && onRemove && (
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={onRemove}
          className="absolute right-2 top-2 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Remove insight"
        >
          <X className="h-4 w-4" />
        </motion.button>
      )}

      <div className={`${draggable ? 'pl-6' : ''} ${inSelection ? 'pr-6' : ''}`}>
        {/* Header: Category Icon + Title */}
        <div className="flex items-start gap-2 mb-2">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className={`rounded-full p-1.5 ${colorClass} shadow-sm`}
          >
            <Icon className="h-4 w-4" />
          </motion.div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
              {insight.displayTitle}
            </h4>
          </div>
        </div>

        {/* Insight Content */}
        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2 pl-9">
          {insight.insight}
        </p>

        {/* Footer: Confidence + Data Source */}
        <div className="flex items-center justify-between pl-9 text-xs">
          {/* Data Source */}
          <span className="text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
            <Zap size={10} className="text-purple-500" />
            {insight.dataSource}
          </span>

          {/* Confidence Badge */}
          <span className={`px-2 py-0.5 rounded-full font-medium ${confidenceColor} border border-purple-200 dark:border-purple-700`}>
            {Math.round(insight.confidence * 100)}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}
