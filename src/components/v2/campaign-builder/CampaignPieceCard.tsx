/**
 * Campaign Piece Card - Individual piece display
 * Sortable card with drag handle and actions
 */

import * as React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import type { CampaignPiece, EmotionalTrigger } from '@/types/v2';

export interface CampaignPieceCardProps {
  piece: CampaignPiece;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
}

const TRIGGER_BADGES: Record<EmotionalTrigger, { bg: string; text: string }> = {
  curiosity: { bg: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-700 dark:text-purple-200' },
  fear: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-700 dark:text-red-200' },
  hope: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-700 dark:text-green-200' },
  desire: { bg: 'bg-pink-100 dark:bg-pink-900', text: 'text-pink-700 dark:text-pink-200' },
  urgency: { bg: 'bg-orange-100 dark:bg-orange-900', text: 'text-orange-700 dark:text-orange-200' },
  trust: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-700 dark:text-blue-200' },
  frustration: { bg: 'bg-red-50 dark:bg-red-900/70', text: 'text-red-600 dark:text-red-300' },
  triumph: { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-700 dark:text-yellow-200' },
  inspiration: { bg: 'bg-indigo-100 dark:bg-indigo-900', text: 'text-indigo-700 dark:text-indigo-200' },
  excitement: { bg: 'bg-amber-100 dark:bg-amber-900', text: 'text-amber-700 dark:text-amber-200' },
  confidence: { bg: 'bg-teal-100 dark:bg-teal-900', text: 'text-teal-700 dark:text-teal-200' },
  understanding: { bg: 'bg-cyan-100 dark:bg-cyan-900', text: 'text-cyan-700 dark:text-cyan-200' },
  clarity: { bg: 'bg-sky-100 dark:bg-sky-900', text: 'text-sky-700 dark:text-sky-200' },
  acknowledgment: { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-700 dark:text-slate-200' },
  resolution: { bg: 'bg-emerald-100 dark:bg-emerald-900', text: 'text-emerald-700 dark:text-emerald-200' },
  satisfaction: { bg: 'bg-lime-100 dark:bg-lime-900', text: 'text-lime-700 dark:text-lime-200' },
  respect: { bg: 'bg-violet-100 dark:bg-violet-900', text: 'text-violet-700 dark:text-violet-200' },
  security: { bg: 'bg-blue-50 dark:bg-blue-900/70', text: 'text-blue-600 dark:text-blue-300' },
  efficiency: { bg: 'bg-green-50 dark:bg-green-900/70', text: 'text-green-600 dark:text-green-300' },
  innovation: { bg: 'bg-purple-50 dark:bg-purple-900/70', text: 'text-purple-600 dark:text-purple-300' },
  opportunity: { bg: 'bg-yellow-50 dark:bg-yellow-900/70', text: 'text-yellow-600 dark:text-yellow-300' },
  safety: { bg: 'bg-emerald-50 dark:bg-emerald-900/70', text: 'text-emerald-600 dark:text-emerald-300' },
  growth: { bg: 'bg-teal-50 dark:bg-teal-900/70', text: 'text-teal-600 dark:text-teal-300' },
  authority: { bg: 'bg-indigo-50 dark:bg-indigo-900/70', text: 'text-indigo-600 dark:text-indigo-300' },
  pride: { bg: 'bg-pink-50 dark:bg-pink-900/70', text: 'text-pink-600 dark:text-pink-300' },
  belonging: { bg: 'bg-cyan-50 dark:bg-cyan-900/70', text: 'text-cyan-600 dark:text-cyan-300' },
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  generated: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300',
  published: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300',
};

export const CampaignPieceCard: React.FC<CampaignPieceCardProps> = ({
  piece,
  index,
  onEdit,
  onDelete,
  className,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: piece.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const triggerStyle = TRIGGER_BADGES[piece.emotionalTrigger] || {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-start gap-3 p-4 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800',
        isDragging && 'opacity-50 shadow-lg',
        className
      )}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="mt-1 p-1 cursor-grab active:cursor-grabbing hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
        aria-label="Drag to reorder"
      >
        <GripIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
      </button>

      {/* Piece Number */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
        <span className="text-sm font-medium text-primary">{index + 1}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">{piece.title}</h4>
          <span className={cn('px-2 py-0.5 text-xs rounded-full', STATUS_STYLES[piece.status])}>
            {piece.status}
          </span>
        </div>

        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
          {piece.content.substring(0, 100)}...
        </p>

        <div className="flex items-center gap-2 mt-2">
          <span className={cn('px-2 py-0.5 text-xs rounded-full capitalize', triggerStyle.bg, triggerStyle.text)}>
            {piece.emotionalTrigger}
          </span>
          <span className="text-xs text-gray-600 dark:text-gray-300">
            {new Date(piece.scheduledDate).toLocaleDateString()}
          </span>
          {piece.performancePrediction && (
            <span className="text-xs text-gray-600 dark:text-gray-300">
              CTR: {piece.performancePrediction.expectedCTR}%
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1">
        <button
          onClick={onEdit}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          aria-label="Edit piece"
        >
          <EditIcon className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
          aria-label="Delete piece"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Simple icon components
const GripIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
  </svg>
);

const EditIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export default CampaignPieceCard;
