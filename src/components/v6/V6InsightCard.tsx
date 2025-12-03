// PRD Feature: SYNAPSE-V6
/**
 * V6 Insight Card
 *
 * Displays insights by SOURCE, not emotion.
 * Per Build Plan: "Cards: Title | Source Quote | Expandable Summary"
 *
 * No emotion badges - shows where data came from (VoC, Reddit, Weather, etc.)
 */

import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Users,
  Target,
  TrendingUp,
  Search,
  MapPin,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Zap,
  CheckCircle2,
  Sparkles,
  Link2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { V6Insight, V6SourceTab, V6Connection } from '@/services/synapse-v6/v6-insight-types';
import { V6_TAB_CONFIGS } from '@/services/synapse-v6/v6-insight-types';

// Icon mapping
const ICON_MAP: Record<string, React.ElementType> = {
  Heart,
  Users,
  Target,
  TrendingUp,
  Search,
  MapPin,
};

interface V6InsightCardProps {
  insight: V6Insight;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onViewConnections?: (insight: V6Insight) => void;
  showConnections?: boolean;
}

export const V6InsightCard = memo(function V6InsightCard({
  insight,
  isSelected = false,
  onSelect,
  onViewConnections,
  showConnections = false,
}: V6InsightCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const config = V6_TAB_CONFIGS[insight.sourceTab];
  const IconComponent = ICON_MAP[config.icon] || Heart;

  const hasConnections = insight.connections && insight.connections.length > 0;
  const highBreakthrough = insight.connections?.some(c => c.breakthroughScore >= 80);

  // V1 Three-Way Connection Detection (≥85 score + 3+ sources = breakthrough)
  const hasThreeWay = (insight.connections?.length || 0) >= 3;
  const avgBreakthroughScore = hasConnections
    ? insight.connections!.reduce((sum, c) => sum + c.breakthroughScore, 0) / insight.connections!.length
    : 0;
  const isBreakthrough = hasThreeWay && avgBreakthroughScore >= 85;
  const hasCrossDomain = insight.connections?.some(c => c.connectionType === 'cross-domain');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative rounded-lg border overflow-hidden transition-all cursor-pointer',
        'bg-slate-900/50 hover:bg-slate-800/70',
        isSelected
          ? 'border-purple-500 ring-2 ring-purple-500/30'
          : 'border-slate-700 hover:border-slate-600',
        // V1 Three-way breakthrough gets special golden glow
        isBreakthrough
          ? 'ring-2 ring-amber-400/50 border-amber-500/50'
          : highBreakthrough && 'ring-1 ring-yellow-500/30'
      )}
      onClick={() => onSelect?.(insight.id)}
    >
      {/* Header */}
      <div className="p-3">
        {/* Source Badge */}
        <div className="flex items-center justify-between mb-2">
          <div className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium',
            config.bgColor,
            config.color
          )}>
            <IconComponent className="w-3 h-3" />
            <span>{config.label}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Breakthrough badge for three-way connections */}
            {isBreakthrough && (
              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-xs font-medium">
                <Sparkles className="w-3 h-3" />
                <span>Breakthrough</span>
              </div>
            )}
            {/* Cross-domain badge */}
            {hasCrossDomain && !isBreakthrough && (
              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 text-xs">
                <Link2 className="w-3 h-3" />
              </div>
            )}
            {/* Platform badge */}
            <span className="text-xs text-slate-500">
              {insight.source.platform}
            </span>
          </div>
        </div>

        {/* Title */}
        <h4 className="text-sm font-medium text-white mb-1.5 line-clamp-2">
          {insight.title}
        </h4>

        {/* Quote/Text Preview */}
        <p className={cn(
          'text-xs text-slate-400',
          isExpanded ? '' : 'line-clamp-2'
        )}>
          {insight.text}
        </p>

        {/* Expand/Collapse */}
        {insight.text.length > 120 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="flex items-center gap-1 mt-1.5 text-xs text-slate-500 hover:text-slate-300"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                <span>Show less</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                <span>Show more</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 bg-slate-900/50 border-t border-slate-700/50 flex items-center justify-between">
        {/* Source link */}
        {insight.source.url && (
          <a
            href={insight.source.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-400"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Source</span>
          </a>
        )}

        {/* Connection indicator */}
        {showConnections && hasConnections && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewConnections?.(insight);
            }}
            className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded text-xs',
              highBreakthrough
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-purple-500/20 text-purple-400'
            )}
          >
            <Zap className="w-3 h-3" />
            <span>{insight.connections!.length} connections</span>
          </button>
        )}

        {/* Selected indicator */}
        {isSelected && (
          <div className="flex items-center gap-1 text-xs text-purple-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Selected</span>
          </div>
        )}
      </div>
    </motion.div>
  );
});

// Grid component for V6 insights
interface V6InsightGridProps {
  insights: V6Insight[];
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onViewConnections?: (insight: V6Insight) => void;
  columns?: 2 | 3 | 4;
  showConnections?: boolean;
}

export const V6InsightGrid = memo(function V6InsightGrid({
  insights,
  selectedIds,
  onSelect,
  onViewConnections,
  columns = 3,
  showConnections = false,
}: V6InsightGridProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  return (
    <div className={cn('grid gap-3', gridCols[columns])}>
      {insights.map((insight) => (
        <V6InsightCard
          key={insight.id}
          insight={insight}
          isSelected={selectedIds.has(insight.id)}
          onSelect={onSelect}
          onViewConnections={onViewConnections}
          showConnections={showConnections}
        />
      ))}
    </div>
  );
});

export default V6InsightCard;
