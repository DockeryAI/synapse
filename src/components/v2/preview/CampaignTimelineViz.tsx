/**
 * CampaignTimelineViz - Visual timeline for campaign pieces
 *
 * Features:
 * - Horizontal timeline (day 1 → day N)
 * - Color-coded by emotional trigger
 * - Day markers with piece count
 * - Hover shows piece preview
 * - Click to jump to that piece in editor
 * - Milestone markers (checkpoints, campaign end)
 */

import React, { useState, useCallback } from 'react';
import { Calendar, Flag, Target, TrendingUp } from 'lucide-react';
import type {
  TimelineVisualizationData,
  TimelineDay,
  TimelineMilestone,
  TimelinePiecePreview,
} from '../../../types/v2/preview.types';
import { EMOTIONAL_TRIGGER_COLORS } from '../../../types/v2/preview.types';
import type { EmotionalTrigger } from '../../../types/v2/campaign.types';

interface CampaignTimelineVizProps {
  data: TimelineVisualizationData;
  onPieceClick?: (pieceId: string) => void;
  currentPieceId?: string | null;
  className?: string;
}

export const CampaignTimelineViz: React.FC<CampaignTimelineVizProps> = ({
  data,
  onPieceClick,
  currentPieceId,
  className = '',
}) => {
  const [hoveredPieceId, setHoveredPieceId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<TimelinePiecePreview | null>(null);

  // Handle piece hover
  const handlePieceHover = useCallback((piece: TimelinePiecePreview | null) => {
    setHoveredPieceId(piece?.pieceId || null);
    setPreviewData(piece);
  }, []);

  // Get milestone icon
  const getMilestoneIcon = (type: string) => {
    switch (type) {
      case 'checkpoint':
        return <Target className="w-4 h-4" />;
      case 'phase_transition':
        return <TrendingUp className="w-4 h-4" />;
      case 'campaign_end':
        return <Flag className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  // Calculate timeline width
  const timelineWidth = data.totalDuration * 80; // 80px per day

  return (
    <div className={`campaign-timeline-viz relative ${className}`}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Campaign Timeline</h3>
          <p className="text-sm text-gray-600">
            {data.totalDuration} days • {data.days.reduce((acc, day) => acc + day.pieces.length, 0)} pieces
          </p>
        </div>

        {/* Emotional trigger legend */}
        <div className="flex flex-wrap gap-2">
          {Array.from(new Set(data.emotionalProgression.map((band) => band.trigger))).map((trigger) => (
            <div key={trigger} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: EMOTIONAL_TRIGGER_COLORS[trigger] }}
              />
              <span className="text-xs text-gray-600 capitalize">
                {trigger.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline container */}
      <div className="relative overflow-x-auto pb-4">
        <div className="relative" style={{ width: `${timelineWidth}px`, minWidth: '100%' }}>
          {/* Emotional trigger bands (background) */}
          <div className="absolute top-0 left-0 right-0 h-24">
            {data.emotionalProgression.map((band, idx) => {
              const startX = (band.startDay - 1) * 80;
              const width = (band.endDay - band.startDay + 1) * 80;

              return (
                <div
                  key={`band-${idx}`}
                  className="absolute top-0 h-full opacity-10 rounded"
                  style={{
                    left: `${startX}px`,
                    width: `${width}px`,
                    backgroundColor: EMOTIONAL_TRIGGER_COLORS[band.trigger],
                  }}
                />
              );
            })}
          </div>

          {/* Timeline days */}
          <div className="relative flex gap-2 h-24">
            {data.days.map((day) => (
              <TimelineDay
                key={day.dayNumber}
                day={day}
                isCurrentDay={day.pieces.some((p) => p.id === currentPieceId)}
                onPieceHover={handlePieceHover}
                onPieceClick={onPieceClick}
              />
            ))}
          </div>

          {/* Milestones */}
          <div className="relative mt-2 h-8">
            {data.milestones.map((milestone) => {
              const posX = (milestone.dayNumber - 1) * 80 + 40; // Center of day

              return (
                <div
                  key={`milestone-${milestone.dayNumber}`}
                  className="absolute flex flex-col items-center"
                  style={{ left: `${posX}px`, transform: 'translateX(-50%)' }}
                  title={milestone.description}
                >
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500 text-white">
                    {getMilestoneIcon(milestone.type)}
                  </div>
                  <span className="text-xs text-gray-600 mt-1 whitespace-nowrap">
                    {milestone.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Piece preview popup */}
      {previewData && (
        <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-gray-900">{previewData.title}</h4>
            <span
              className="px-2 py-1 text-xs rounded-full text-white"
              style={{
                backgroundColor: EMOTIONAL_TRIGGER_COLORS[previewData.emotionalTrigger],
              }}
            >
              {previewData.emotionalTrigger}
            </span>
          </div>
          <p className="text-sm text-gray-600 line-clamp-3">{previewData.preview}</p>
        </div>
      )}
    </div>
  );
};

// Individual timeline day component
interface TimelineDayProps {
  day: TimelineDay;
  isCurrentDay: boolean;
  onPieceHover?: (piece: TimelinePiecePreview | null) => void;
  onPieceClick?: (pieceId: string) => void;
}

const TimelineDay: React.FC<TimelineDayProps> = ({
  day,
  isCurrentDay,
  onPieceHover,
  onPieceClick,
}) => {
  return (
    <div
      className={`timeline-day relative flex flex-col items-center justify-center w-20 h-24 border rounded-lg cursor-pointer transition-all ${
        isCurrentDay
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-gray-400 hover:shadow'
      }`}
    >
      {/* Day number */}
      <div className="text-xs font-semibold text-gray-500 mb-1">Day {day.dayNumber}</div>

      {/* Date */}
      <div className="text-xs text-gray-400 mb-2">
        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </div>

      {/* Pieces */}
      <div className="flex flex-wrap gap-1 justify-center">
        {day.pieces.map((piece) => {
          const preview: TimelinePiecePreview = {
            pieceId: piece.id,
            title: piece.title,
            content: piece.content,
            emotionalTrigger: piece.emotionalTrigger,
            preview: piece.content.substring(0, 150) + '...',
          };

          return (
            <div
              key={piece.id}
              className="w-2 h-2 rounded-full cursor-pointer hover:scale-150 transition-transform"
              style={{
                backgroundColor: EMOTIONAL_TRIGGER_COLORS[piece.emotionalTrigger],
              }}
              onMouseEnter={() => onPieceHover?.(preview)}
              onMouseLeave={() => onPieceHover?.(null)}
              onClick={() => onPieceClick?.(piece.id)}
              title={piece.title}
            />
          );
        })}
      </div>

      {/* Piece count badge */}
      {day.pieces.length > 0 && (
        <div className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full">
          {day.pieces.length}
        </div>
      )}

      {/* Milestone indicator */}
      {day.isMilestone && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-purple-500 rounded-full" />
      )}
    </div>
  );
};

export default CampaignTimelineViz;
