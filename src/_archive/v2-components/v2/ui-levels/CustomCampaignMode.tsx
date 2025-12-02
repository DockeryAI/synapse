/**
 * Custom Campaign Mode - Level 2: Customization
 * Timeline editing with drag-drop reordering and emotional trigger selection
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Calendar,
  Edit3,
  GripVertical,
  Heart,
  AlertCircle,
  Zap,
  Target,
  Eye,
  Save,
  X
} from 'lucide-react';
import type {
  CampaignPiece,
  EmotionalTrigger,
  TimelineReorderEvent,
  EmotionalTriggerAdjustment,
  CustomModeConfig
} from '@/types/v2';
import { uiLevelManager } from '@/services/v2/ui-level-manager.service';

export interface CustomCampaignModeProps {
  brandId: string;
  campaignId?: string;
  pieces: CampaignPiece[];
  onPiecesUpdate: (pieces: CampaignPiece[]) => void;
  onPieceReorder: (event: TimelineReorderEvent) => void;
  onEmotionalTriggerChange: (adjustment: EmotionalTriggerAdjustment) => void;
  onPieceEdit: (pieceId: string, updates: Partial<CampaignPiece>) => void;
  showPreview?: boolean;
  className?: string;
}

export const CustomCampaignMode: React.FC<CustomCampaignModeProps> = ({
  brandId,
  campaignId,
  pieces: initialPieces,
  onPiecesUpdate,
  onPieceReorder,
  onEmotionalTriggerChange,
  onPieceEdit,
  showPreview = true,
  className,
}) => {
  const [pieces, setPieces] = React.useState<CampaignPiece[]>(initialPieces);
  const [editingPiece, setEditingPiece] = React.useState<string | null>(null);
  const [draggedPiece, setDraggedPiece] = React.useState<string | null>(null);
  const [config] = React.useState<CustomModeConfig>(uiLevelManager.getCustomModeConfig());
  const [viewMode, setViewMode] = React.useState<'timeline' | 'list'>('timeline');

  React.useEffect(() => {
    setPieces(initialPieces);
  }, [initialPieces]);

  const handleDragStart = (e: React.DragEvent, piece: CampaignPiece) => {
    if (!config.enableDragDrop) return;
    setDraggedPiece(piece.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetPiece: CampaignPiece) => {
    e.preventDefault();
    if (!draggedPiece || draggedPiece === targetPiece.id) {
      setDraggedPiece(null);
      return;
    }

    const oldIndex = pieces.findIndex(p => p.id === draggedPiece);
    const newIndex = pieces.findIndex(p => p.id === targetPiece.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newPieces = [...pieces];
    const [movedPiece] = newPieces.splice(oldIndex, 1);
    newPieces.splice(newIndex, 0, movedPiece);

    // Update order numbers
    const reorderedPieces = newPieces.map((p, i) => ({
      ...p,
      order: i
    }));

    setPieces(reorderedPieces);
    onPiecesUpdate(reorderedPieces);

    onPieceReorder({
      pieceId: draggedPiece,
      oldIndex,
      newIndex,
      oldDate: pieces[oldIndex].scheduledDate,
      newDate: reorderedPieces[newIndex].scheduledDate
    });

    setDraggedPiece(null);

    // Track usage
    uiLevelManager.updateUsageStats(brandId, {
      totalPiecesEdited: 1
    } as any);
  };

  const handleEmotionalTriggerChange = (piece: CampaignPiece, newTrigger: EmotionalTrigger) => {
    if (!config.showEmotionalTriggers) return;

    const updatedPieces = pieces.map(p =>
      p.id === piece.id ? { ...p, emotionalTrigger: newTrigger } : p
    );

    setPieces(updatedPieces);
    onPiecesUpdate(updatedPieces);

    onEmotionalTriggerChange({
      pieceId: piece.id,
      oldTrigger: piece.emotionalTrigger,
      newTrigger,
      reason: 'user_customization'
    });

    // Track usage
    uiLevelManager.updateUsageStats(brandId, {
      advancedFeaturesUsed: 1
    } as any);
  };

  const handlePieceEdit = (piece: CampaignPiece, updates: Partial<CampaignPiece>) => {
    if (!config.enableInlineEdit) return;

    const updatedPieces = pieces.map(p =>
      p.id === piece.id ? { ...p, ...updates } : p
    );

    setPieces(updatedPieces);
    onPiecesUpdate(updatedPieces);
    onPieceEdit(piece.id, updates);

    // Track usage
    uiLevelManager.updateUsageStats(brandId, {
      totalPiecesEdited: 1
    } as any);
  };

  const startEditing = (pieceId: string) => {
    if (config.enableInlineEdit) {
      setEditingPiece(pieceId);
    }
  };

  const stopEditing = () => {
    setEditingPiece(null);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Customize Campaign</h2>
          <p className="text-sm text-muted-foreground">
            Edit pieces, adjust timing, and fine-tune emotional triggers
          </p>
        </div>

        {/* View Mode Toggle */}
        {config.showTimeline && (
          <div className="flex items-center gap-2 border rounded-md p-1">
            <button
              onClick={() => setViewMode('timeline')}
              className={cn(
                'px-3 py-1.5 text-sm rounded transition-colors',
                viewMode === 'timeline'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              )}
            >
              <Calendar className="w-4 h-4 inline mr-1" />
              Timeline
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'px-3 py-1.5 text-sm rounded transition-colors',
                viewMode === 'list'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              )}
            >
              List
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Total Pieces"
          value={pieces.length}
          icon={<Target className="w-4 h-4" />}
        />
        <StatCard
          label="Duration"
          value={`${calculateDuration(pieces)} days`}
          icon={<Calendar className="w-4 h-4" />}
        />
        <StatCard
          label="Edited"
          value={pieces.filter(p => p.status === 'generated').length}
          icon={<Edit3 className="w-4 h-4" />}
        />
      </div>

      {/* Timeline or List View */}
      {viewMode === 'timeline' && config.showTimeline ? (
        <TimelineView
          pieces={pieces}
          editingPiece={editingPiece}
          draggedPiece={draggedPiece}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onEdit={startEditing}
          onSave={handlePieceEdit}
          onCancel={stopEditing}
          onEmotionalTriggerChange={handleEmotionalTriggerChange}
          config={config}
        />
      ) : (
        <ListView
          pieces={pieces}
          editingPiece={editingPiece}
          draggedPiece={draggedPiece}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onEdit={startEditing}
          onSave={handlePieceEdit}
          onCancel={stopEditing}
          onEmotionalTriggerChange={handleEmotionalTriggerChange}
          config={config}
        />
      )}
    </div>
  );
};

/**
 * Stat Card Component
 */
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon }) => {
  return (
    <div className="border rounded-lg p-4 space-y-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
};

/**
 * Timeline View Component
 */
interface TimelineViewProps {
  pieces: CampaignPiece[];
  editingPiece: string | null;
  draggedPiece: string | null;
  onDragStart: (e: React.DragEvent, piece: CampaignPiece) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, piece: CampaignPiece) => void;
  onEdit: (pieceId: string) => void;
  onSave: (piece: CampaignPiece, updates: Partial<CampaignPiece>) => void;
  onCancel: () => void;
  onEmotionalTriggerChange: (piece: CampaignPiece, trigger: EmotionalTrigger) => void;
  config: CustomModeConfig;
}

const TimelineView: React.FC<TimelineViewProps> = (props) => {
  // Group pieces by day
  const groupedPieces = React.useMemo(() => {
    const groups = new Map<string, CampaignPiece[]>();
    props.pieces.forEach(piece => {
      const date = piece.scheduledDate.split('T')[0];
      if (!groups.has(date)) {
        groups.set(date, []);
      }
      groups.get(date)!.push(piece);
    });
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [props.pieces]);

  return (
    <div className="space-y-4">
      {groupedPieces.map(([date, piecesForDay]) => (
        <div key={date} className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{new Date(date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            })}</span>
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
              {piecesForDay.length} {piecesForDay.length === 1 ? 'piece' : 'pieces'}
            </span>
          </div>
          <div className="space-y-2 ml-6">
            {piecesForDay.map(piece => (
              <PieceCard
                key={piece.id}
                piece={piece}
                editing={props.editingPiece === piece.id}
                dragged={props.draggedPiece === piece.id}
                onDragStart={props.onDragStart}
                onDragOver={props.onDragOver}
                onDrop={props.onDrop}
                onEdit={props.onEdit}
                onSave={props.onSave}
                onCancel={props.onCancel}
                onEmotionalTriggerChange={props.onEmotionalTriggerChange}
                config={props.config}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * List View Component
 */
const ListView: React.FC<TimelineViewProps> = (props) => {
  return (
    <div className="space-y-2">
      {props.pieces.map(piece => (
        <PieceCard
          key={piece.id}
          piece={piece}
          editing={props.editingPiece === piece.id}
          dragged={props.draggedPiece === piece.id}
          onDragStart={props.onDragStart}
          onDragOver={props.onDragOver}
          onDrop={props.onDrop}
          onEdit={props.onEdit}
          onSave={props.onSave}
          onCancel={props.onCancel}
          onEmotionalTriggerChange={props.onEmotionalTriggerChange}
          config={props.config}
        />
      ))}
    </div>
  );
};

/**
 * Piece Card Component
 */
interface PieceCardProps {
  piece: CampaignPiece;
  editing: boolean;
  dragged: boolean;
  onDragStart: (e: React.DragEvent, piece: CampaignPiece) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, piece: CampaignPiece) => void;
  onEdit: (pieceId: string) => void;
  onSave: (piece: CampaignPiece, updates: Partial<CampaignPiece>) => void;
  onCancel: () => void;
  onEmotionalTriggerChange: (piece: CampaignPiece, trigger: EmotionalTrigger) => void;
  config: CustomModeConfig;
}

const PieceCard: React.FC<PieceCardProps> = ({
  piece,
  editing,
  dragged,
  onDragStart,
  onDragOver,
  onDrop,
  onEdit,
  onSave,
  onCancel,
  onEmotionalTriggerChange,
  config,
}) => {
  const [editedContent, setEditedContent] = React.useState(piece.content);
  const [editedTitle, setEditedTitle] = React.useState(piece.title);

  const handleSave = () => {
    onSave(piece, {
      title: editedTitle,
      content: editedContent
    });
  };

  return (
    <div
      draggable={config.enableDragDrop}
      onDragStart={(e) => onDragStart(e, piece)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, piece)}
      className={cn(
        'border rounded-lg p-4 space-y-3 transition-all bg-card',
        dragged && 'opacity-50',
        config.enableDragDrop && 'cursor-move hover:shadow-md'
      )}
    >
      <div className="flex items-start gap-3">
        {config.enableDragDrop && (
          <GripVertical className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
        )}

        <div className="flex-1 space-y-3">
          {/* Title */}
          {editing && config.enableInlineEdit ? (
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-md font-medium"
            />
          ) : (
            <h4 className="font-medium">{piece.title}</h4>
          )}

          {/* Content */}
          {editing && config.enableInlineEdit ? (
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border rounded-md text-sm resize-none"
            />
          ) : (
            <p className="text-sm text-muted-foreground line-clamp-3">{piece.content}</p>
          )}

          {/* Emotional Trigger Selector */}
          {config.showEmotionalTriggers && (
            <EmotionalTriggerSelector
              currentTrigger={piece.emotionalTrigger}
              onChange={(trigger) => onEmotionalTriggerChange(piece, trigger)}
              disabled={editing}
            />
          )}

          {/* Metadata */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{piece.channel}</span>
            <span>•</span>
            <span>Day {piece.order + 1}</span>
            <span>•</span>
            <span className={cn(
              'px-2 py-0.5 rounded-full',
              piece.status === 'published' ? 'bg-green-100 text-green-800' :
              piece.status === 'generated' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            )}>
              {piece.status}
            </span>
          </div>
        </div>

        {/* Actions */}
        {!editing && config.enableInlineEdit && (
          <button
            onClick={() => onEdit(piece.id)}
            className="p-2 hover:bg-muted rounded-md transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        )}

        {editing && (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="p-2 hover:bg-green-100 text-green-600 rounded-md transition-colors"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-red-100 text-red-600 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Emotional Trigger Selector Component
 */
interface EmotionalTriggerSelectorProps {
  currentTrigger: EmotionalTrigger;
  onChange: (trigger: EmotionalTrigger) => void;
  disabled?: boolean;
}

const EmotionalTriggerSelector: React.FC<EmotionalTriggerSelectorProps> = ({
  currentTrigger,
  onChange,
  disabled
}) => {
  const triggers: Array<{ value: EmotionalTrigger; label: string; icon: React.ReactNode; color: string }> = [
    { value: 'trust', label: 'Trust', icon: <Heart />, color: 'text-blue-600' },
    { value: 'fear', label: 'Fear', icon: <AlertCircle />, color: 'text-red-600' },
    { value: 'urgency', label: 'Urgency', icon: <Zap />, color: 'text-orange-600' },
    { value: 'hope', label: 'Hope', icon: <Heart />, color: 'text-green-600' },
    { value: 'curiosity', label: 'Curiosity', icon: <Eye />, color: 'text-purple-600' },
    { value: 'authority', label: 'Authority', icon: <Target />, color: 'text-indigo-600' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {triggers.map(trigger => (
        <button
          key={trigger.value}
          onClick={() => !disabled && onChange(trigger.value)}
          disabled={disabled}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full transition-all',
            currentTrigger === trigger.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <span className={cn('w-3 h-3', currentTrigger === trigger.value ? '' : trigger.color)}>
            {React.cloneElement(trigger.icon as React.ReactElement, { className: 'w-3 h-3' })}
          </span>
          <span>{trigger.label}</span>
        </button>
      ))}
    </div>
  );
};

/**
 * Helper function to calculate campaign duration
 */
function calculateDuration(pieces: CampaignPiece[]): number {
  if (pieces.length === 0) return 0;

  const dates = pieces.map(p => new Date(p.scheduledDate).getTime());
  const min = Math.min(...dates);
  const max = Math.max(...dates);

  return Math.ceil((max - min) / (1000 * 60 * 60 * 24)) + 1;
}
