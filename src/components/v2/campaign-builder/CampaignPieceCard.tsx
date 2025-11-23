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
  curiosity: { bg: 'bg-purple-100', text: 'text-purple-700' },
  fear: { bg: 'bg-red-100', text: 'text-red-700' },
  hope: { bg: 'bg-green-100', text: 'text-green-700' },
  desire: { bg: 'bg-pink-100', text: 'text-pink-700' },
  urgency: { bg: 'bg-orange-100', text: 'text-orange-700' },
  trust: { bg: 'bg-blue-100', text: 'text-blue-700' },
  frustration: { bg: 'bg-red-50', text: 'text-red-600' },
  triumph: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  inspiration: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  excitement: { bg: 'bg-amber-100', text: 'text-amber-700' },
  confidence: { bg: 'bg-teal-100', text: 'text-teal-700' },
  understanding: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  clarity: { bg: 'bg-sky-100', text: 'text-sky-700' },
  acknowledgment: { bg: 'bg-slate-100', text: 'text-slate-700' },
  resolution: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  satisfaction: { bg: 'bg-lime-100', text: 'text-lime-700' },
  respect: { bg: 'bg-violet-100', text: 'text-violet-700' },
  security: { bg: 'bg-blue-50', text: 'text-blue-600' },
  efficiency: { bg: 'bg-green-50', text: 'text-green-600' },
  innovation: { bg: 'bg-purple-50', text: 'text-purple-600' },
  opportunity: { bg: 'bg-yellow-50', text: 'text-yellow-600' },
  safety: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  growth: { bg: 'bg-teal-50', text: 'text-teal-600' },
  authority: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
  pride: { bg: 'bg-pink-50', text: 'text-pink-600' },
  belonging: { bg: 'bg-cyan-50', text: 'text-cyan-600' },
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  generated: 'bg-blue-100 text-blue-600',
  published: 'bg-green-100 text-green-600',
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
        'flex items-start gap-3 p-4 border rounded-lg bg-background',
        isDragging && 'opacity-50 shadow-lg',
        className
      )}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="mt-1 p-1 cursor-grab active:cursor-grabbing hover:bg-muted rounded"
        aria-label="Drag to reorder"
      >
        <GripIcon className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* Piece Number */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
        <span className="text-sm font-medium text-primary">{index + 1}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm truncate">{piece.title}</h4>
          <span className={cn('px-2 py-0.5 text-xs rounded-full', STATUS_STYLES[piece.status])}>
            {piece.status}
          </span>
        </div>

        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {piece.content.substring(0, 100)}...
        </p>

        <div className="flex items-center gap-2 mt-2">
          <span className={cn('px-2 py-0.5 text-xs rounded-full capitalize', triggerStyle.bg, triggerStyle.text)}>
            {piece.emotionalTrigger}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(piece.scheduledDate).toLocaleDateString()}
          </span>
          {piece.performancePrediction && (
            <span className="text-xs text-muted-foreground">
              CTR: {piece.performancePrediction.expectedCTR}%
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1">
        <button
          onClick={onEdit}
          className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
          aria-label="Edit piece"
        >
          <EditIcon className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 hover:bg-red-50 rounded text-muted-foreground hover:text-red-600"
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
