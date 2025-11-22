/**
 * Timeline Visualizer - Drag-drop piece arrangement
 * Visual timeline for campaign pieces with emotional progression
 */

import * as React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { CampaignPieceCard } from './CampaignPieceCard';
import type { CampaignPiece, EmotionalTrigger } from '@/types/v2';

export interface TimelineVisualizerProps {
  pieces: CampaignPiece[];
  onReorder: (pieces: CampaignPiece[]) => void;
  onPieceUpdate: (pieces: CampaignPiece[]) => void;
  className?: string;
}

// Emotional trigger colors for visualization
const TRIGGER_COLORS: Record<EmotionalTrigger, string> = {
  curiosity: 'bg-purple-500',
  fear: 'bg-red-500',
  hope: 'bg-green-500',
  desire: 'bg-pink-500',
  urgency: 'bg-orange-500',
  trust: 'bg-blue-500',
  frustration: 'bg-red-400',
  triumph: 'bg-yellow-500',
  inspiration: 'bg-indigo-500',
  excitement: 'bg-amber-500',
  confidence: 'bg-teal-500',
  understanding: 'bg-cyan-500',
  clarity: 'bg-sky-500',
  acknowledgment: 'bg-slate-500',
  resolution: 'bg-emerald-500',
  satisfaction: 'bg-lime-500',
  respect: 'bg-violet-500',
};

export const TimelineVisualizer: React.FC<TimelineVisualizerProps> = ({
  pieces,
  onReorder,
  onPieceUpdate,
  className,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = pieces.findIndex(p => p.id === active.id);
      const newIndex = pieces.findIndex(p => p.id === over.id);

      const newPieces = arrayMove(pieces, oldIndex, newIndex).map((piece, idx) => ({
        ...piece,
        pieceOrder: idx,
      }));

      onReorder(newPieces);
    }
  };

  const handlePieceEdit = (pieceId: string) => {
    // Edit functionality - could open a modal
    console.log('Edit piece:', pieceId);
  };

  const handlePieceDelete = (pieceId: string) => {
    const newPieces = pieces
      .filter(p => p.id !== pieceId)
      .map((piece, idx) => ({ ...piece, pieceOrder: idx }));
    onPieceUpdate(newPieces);
  };

  if (pieces.length === 0) {
    return (
      <div className={cn('p-8 text-center border rounded-lg bg-muted/50', className)}>
        <p className="text-muted-foreground">
          No pieces generated yet. Select a template and configure your campaign.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Emotional Progression Bar */}
      <div className="p-4 border rounded-lg">
        <h4 className="text-sm font-medium mb-3">Emotional Progression</h4>
        <div className="flex gap-1">
          {pieces.map((piece, idx) => (
            <div
              key={piece.id}
              className="flex-1 flex flex-col items-center"
            >
              <div
                className={cn(
                  'w-full h-2 rounded-full',
                  TRIGGER_COLORS[piece.emotionalTrigger] || 'bg-gray-400'
                )}
              />
              <span className="text-[10px] text-muted-foreground mt-1 capitalize truncate w-full text-center">
                {piece.emotionalTrigger}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">
          Campaign Timeline ({pieces.length} pieces)
        </h4>
        <span className="text-xs text-muted-foreground">
          Drag to reorder
        </span>
      </div>

      {/* Sortable Pieces */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={pieces.map(p => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {pieces.map((piece, index) => (
              <div key={piece.id} className="relative">
                {/* Timeline connector */}
                {index < pieces.length - 1 && (
                  <div className="absolute left-6 top-full w-0.5 h-3 bg-border" />
                )}
                <CampaignPieceCard
                  piece={piece}
                  index={index}
                  onEdit={() => handlePieceEdit(piece.id)}
                  onDelete={() => handlePieceDelete(piece.id)}
                />
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Timeline Summary */}
      <div className="p-3 bg-muted rounded-lg">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Start</span>
            <div className="font-medium">
              {pieces[0]?.scheduledDate
                ? new Date(pieces[0].scheduledDate).toLocaleDateString()
                : 'Not set'}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">End</span>
            <div className="font-medium">
              {pieces[pieces.length - 1]?.scheduledDate
                ? new Date(pieces[pieces.length - 1].scheduledDate).toLocaleDateString()
                : 'Not set'}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Duration</span>
            <div className="font-medium">
              {calculateDuration(pieces)} days
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function calculateDuration(pieces: CampaignPiece[]): number {
  if (pieces.length < 2) return 0;
  const start = new Date(pieces[0].scheduledDate).getTime();
  const end = new Date(pieces[pieces.length - 1].scheduledDate).getTime();
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
}

export default TimelineVisualizer;
