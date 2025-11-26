/**
 * Campaign Timeline Component (Dashboard Compact Version)
 * Embedded timeline view showing key campaign milestones
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Flag, Target, TrendingUp, ChevronRight, Maximize2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TimelineVisualizationData, TimelineMilestone } from '@/types/v2/preview.types';

export interface CampaignTimelineProps {
  data: TimelineVisualizationData;
  campaignName?: string;
  onExpand?: () => void;
  onMilestoneClick?: (milestone: TimelineMilestone) => void;
  compact?: boolean;
  className?: string;
}

// Milestone colors based on type
const milestoneColors: Record<string, { bg: string; text: string; border: string }> = {
  checkpoint: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-500' },
  phase_transition: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-500' },
  campaign_end: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', border: 'border-green-500' },
};

// Emotional trigger colors
const emotionalColors: Record<string, string> = {
  curiosity: '#3B82F6',
  fear: '#EF4444',
  desire: '#EC4899',
  belonging: '#8B5CF6',
  achievement: '#10B981',
  trust: '#06B6D4',
  urgency: '#F59E0B',
};

export function CampaignTimeline({
  data,
  campaignName,
  onExpand,
  onMilestoneClick,
  compact = false,
  className,
}: CampaignTimelineProps) {
  const [hoveredMilestone, setHoveredMilestone] = useState<number | null>(null);

  // Get milestone icon
  const getMilestoneIcon = (type: string) => {
    switch (type) {
      case 'checkpoint':
        return Target;
      case 'phase_transition':
        return TrendingUp;
      case 'campaign_end':
        return Flag;
      default:
        return Calendar;
    }
  };

  // Get key milestones (up to 5)
  const keyMilestones = compact
    ? data.milestones.slice(0, 3)
    : data.milestones.slice(0, 5);

  // Calculate timeline positions
  const getPositionPercentage = (dayNumber: number) => {
    return (dayNumber / data.totalDuration) * 100;
  };

  if (compact) {
    return (
      <div className={cn('space-y-3', className)}>
        {/* Compact horizontal timeline */}
        <div className="relative h-16 bg-gradient-to-r from-blue-50 via-purple-50 to-green-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-green-950/20 rounded-lg overflow-hidden">
          {/* Timeline base line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-300 dark:bg-gray-700" />

          {/* Emotional arc gradient */}
          <div className="absolute top-0 left-0 right-0 h-8 flex">
            {data.emotionalProgression.map((band, index) => (
              <div
                key={index}
                className="transition-all"
                style={{
                  width: `${((band.endDay - band.startDay) / data.totalDuration) * 100}%`,
                  backgroundColor: emotionalColors[band.trigger] || '#6B7280',
                  opacity: 0.3 + (band.intensity / 100) * 0.4,
                }}
              />
            ))}
          </div>

          {/* Milestones */}
          {keyMilestones.map((milestone, index) => {
            const Icon = getMilestoneIcon(milestone.type);
            const colors = milestoneColors[milestone.type] || milestoneColors.checkpoint;
            const position = getPositionPercentage(milestone.dayNumber);

            return (
              <motion.div
                key={index}
                className="absolute top-1/2 transform -translate-y-1/2 cursor-pointer"
                style={{ left: `${position}%` }}
                whileHover={{ scale: 1.2 }}
                onClick={() => onMilestoneClick?.(milestone)}
              >
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-md',
                  colors.bg,
                  colors.border
                )}>
                  <Icon className={cn('w-4 h-4', colors.text)} />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Duration badge */}
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>Day 1</span>
          <Badge variant="secondary">
            {data.totalDuration} days • {keyMilestones.length} milestones
          </Badge>
          <span>Day {data.totalDuration}</span>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            <CardTitle className="text-lg">
              {campaignName || 'Campaign Timeline'}
            </CardTitle>
          </div>
          {onExpand && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onExpand}
              className="gap-2"
            >
              <Maximize2 className="w-4 h-4" />
              Expand
            </Button>
          )}
        </div>
        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
          <span>{data.totalDuration} days</span>
          <span>•</span>
          <span>{data.milestones.length} milestones</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Horizontal Timeline */}
        <div className="relative h-24 bg-gradient-to-r from-blue-50 via-purple-50 to-green-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-green-950/20 rounded-lg p-4">
          {/* Timeline base line */}
          <div className="absolute top-12 left-4 right-4 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />

          {/* Emotional progression bands */}
          <div className="absolute top-4 left-4 right-4 h-4 flex rounded-full overflow-hidden">
            {data.emotionalProgression.map((band, index) => (
              <div
                key={index}
                className="transition-all hover:opacity-100"
                style={{
                  width: `${((band.endDay - band.startDay) / data.totalDuration) * 100}%`,
                  backgroundColor: emotionalColors[band.trigger] || '#6B7280',
                  opacity: 0.4 + (band.intensity / 100) * 0.4,
                }}
                title={`${band.trigger}: ${band.intensity}% intensity`}
              />
            ))}
          </div>

          {/* Milestones */}
          {keyMilestones.map((milestone, index) => {
            const Icon = getMilestoneIcon(milestone.type);
            const colors = milestoneColors[milestone.type] || milestoneColors.checkpoint;
            const position = getPositionPercentage(milestone.dayNumber);

            return (
              <motion.div
                key={index}
                className="absolute top-10 transform -translate-y-1/2 cursor-pointer"
                style={{ left: `calc(${position}% + 1rem)` }}
                whileHover={{ scale: 1.15 }}
                onHoverStart={() => setHoveredMilestone(index)}
                onHoverEnd={() => setHoveredMilestone(null)}
                onClick={() => onMilestoneClick?.(milestone)}
              >
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center border-3 shadow-lg transition-all',
                  colors.bg,
                  colors.border,
                  hoveredMilestone === index && 'ring-4 ring-offset-2 ring-purple-300'
                )}>
                  <Icon className={cn('w-5 h-5', colors.text)} />
                </div>

                {/* Tooltip on hover */}
                {hoveredMilestone === index && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap z-10"
                  >
                    <p className="font-semibold">{milestone.label}</p>
                    {milestone.description && (
                      <p className="text-gray-300 mt-1">{milestone.description}</p>
                    )}
                    <p className="text-gray-400 mt-1">Day {milestone.dayNumber}</p>
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
                      <div className="border-4 border-transparent border-b-gray-900"></div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Milestone List */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Key Milestones</p>
          <div className="space-y-2">
            {keyMilestones.map((milestone, index) => {
              const Icon = getMilestoneIcon(milestone.type);
              const colors = milestoneColors[milestone.type] || milestoneColors.checkpoint;

              return (
                <motion.div
                  key={index}
                  whileHover={{ x: 4 }}
                  className={cn(
                    'flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors',
                    colors.bg
                  )}
                  onClick={() => onMilestoneClick?.(milestone)}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center border-2', colors.border)}>
                      <Icon className={cn('w-4 h-4', colors.text)} />
                    </div>
                    <div>
                      <p className={cn('text-sm font-medium', colors.text)}>{milestone.label}</p>
                      {milestone.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">{milestone.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      Day {milestone.dayNumber}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default CampaignTimeline;
