// PRD Feature: SYNAPSE-V6
/**
 * V6 Insight Card - Redesigned
 *
 * NEW STRUCTURE:
 * - Preview: Title (theme) + Quote (actual customer words) + Source (linked)
 * - Expanded: Title + Executive Summary + UVP Alignment bullets + Quote + Related Quotes + Source
 *
 * Cards expand by pushing others aside (like V5).
 * Colors: VoC = violet, Competitive = red (reversed from before)
 */

import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Speech,
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
  Quote,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { V6Insight, V6SourceTab } from '@/services/synapse-v6/v6-insight-types';
import { V6_TAB_CONFIGS } from '@/services/synapse-v6/v6-insight-types';

// Icon mapping - Speech icon for VoC (person speaking with soundwave)
const ICON_MAP: Record<string, React.ElementType> = {
  Speech,                 // VoC icon - person speaking with soundwave
  MessageCircle,
  Users,
  Target,
  TrendingUp,
  Search,
  MapPin,
};

// Platform colors for quote sources - V6 expanded
const PLATFORM_COLORS: Record<string, string> = {
  Reddit: 'text-orange-400',
  Twitter: 'text-sky-400',
  G2: 'text-red-400',
  Capterra: 'text-emerald-400',
  Yelp: 'text-rose-400',
  LinkedIn: 'text-blue-400',
  HackerNews: 'text-amber-400',
  YouTube: 'text-red-500',
  Trustpilot: 'text-green-400',
  TrustRadius: 'text-indigo-400',
  Quora: 'text-red-600',
  ProductHunt: 'text-orange-500',
  IndieHackers: 'text-blue-500',
  Research: 'text-purple-400',
  Web: 'text-slate-400',
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
  const IconComponent = ICON_MAP[config.icon] || MessageCircle;
  const platformColor = PLATFORM_COLORS[insight.source.platform] || PLATFORM_COLORS.Web;

  const hasConnections = insight.connections && insight.connections.length > 0;
  const highBreakthrough = insight.connections?.some(c => c.breakthroughScore >= 80);
  const hasRelatedQuotes = insight.relatedQuotes && insight.relatedQuotes.length > 0;

  // V1 Three-Way Connection Detection (≥85 score + 3+ sources = breakthrough)
  const hasThreeWay = (insight.connections?.length || 0) >= 3;
  const avgBreakthroughScore = hasConnections
    ? insight.connections!.reduce((sum, c) => sum + c.breakthroughScore, 0) / insight.connections!.length
    : 0;
  const isBreakthrough = hasThreeWay && avgBreakthroughScore >= 85;
  const hasCrossDomain = insight.connections?.some(c => c.connectionType === 'cross-domain');

  // Use quote if available, otherwise fall back to text
  const displayQuote = insight.quote || insight.text;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ layout: { duration: 0.3, ease: 'easeInOut' } }}
      className={cn(
        'relative rounded-xl border overflow-hidden transition-all cursor-pointer',
        'bg-slate-900/60 backdrop-blur-sm hover:bg-slate-800/70',
        isSelected
          ? 'border-purple-500 ring-2 ring-purple-500/30'
          : 'border-slate-700/50 hover:border-slate-600',
        isBreakthrough && 'ring-2 ring-amber-400/50 border-amber-500/50',
        highBreakthrough && !isBreakthrough && 'ring-1 ring-yellow-500/30',
        isExpanded && 'col-span-2 row-span-2'
      )}
      onClick={() => onSelect?.(insight.id)}
    >
      {/* Header - Source Badge */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <div className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
            config.bgColor,
            config.color
          )}>
            <IconComponent className="w-3.5 h-3.5" />
            <span>{config.label}</span>
          </div>

          <div className="flex items-center gap-2">
            {isBreakthrough && (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                <Sparkles className="w-3 h-3" />
                <span>Breakthrough</span>
              </div>
            )}
            {hasCrossDomain && !isBreakthrough && (
              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 text-xs">
                <Link2 className="w-3 h-3" />
              </div>
            )}
            {hasRelatedQuotes && (
              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 text-xs">
                <Quote className="w-3 h-3" />
                <span>+{insight.relatedQuotes!.length}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 pb-3">
        {/* Title - Theme Summary */}
        <h4 className="text-sm font-semibold text-white mb-2 line-clamp-2">
          {insight.title}
        </h4>

        {/* Quote Block */}
        <div className="relative pl-3 border-l-2 border-violet-500/50 mb-3">
          <Quote className="absolute -left-2.5 -top-1 w-4 h-4 text-violet-400/60 bg-slate-900" />
          <p className={cn(
            'text-sm text-slate-300 italic',
            isExpanded ? '' : 'line-clamp-3'
          )}>
            "{displayQuote}"
          </p>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 mt-3"
            >
              {/* Executive Summary */}
              {insight.executiveSummary && (
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <h5 className="text-xs font-medium text-slate-400 mb-1 uppercase tracking-wide">Summary</h5>
                  <p className="text-sm text-slate-300">{insight.executiveSummary}</p>
                </div>
              )}

              {/* UVP Alignment - REMOVED per Phase 17: Focus on quality summaries instead */}

              {/* Related Quotes from other sources */}
              {hasRelatedQuotes && (
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <h5 className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide flex items-center gap-1">
                    <Quote className="w-3 h-3" />
                    Similar from {insight.relatedQuotes!.length} other sources
                  </h5>
                  <div className="space-y-2">
                    {insight.relatedQuotes!.map((rq, idx) => (
                      <div key={idx} className="border-l-2 border-slate-600 pl-2">
                        <p className="text-xs text-slate-400 italic mb-1">"{rq.quote}"</p>
                        {rq.url ? (
                          <a
                            href={rq.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className={cn(
                              'text-xs hover:underline',
                              PLATFORM_COLORS[rq.platform] || 'text-slate-500'
                            )}
                          >
                            — {rq.platform}
                          </a>
                        ) : (
                          <span className={cn('text-xs', PLATFORM_COLORS[rq.platform] || 'text-slate-500')}>
                            — {rq.platform}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expand/Collapse Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="flex items-center gap-1 mt-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Show less</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Show more</span>
            </>
          )}
        </button>
      </div>

      {/* Footer - Source Link */}
      <div className="px-4 py-2.5 bg-slate-950/50 border-t border-slate-700/30 flex items-center justify-between">
        {/* Source Link - only render as anchor if URL exists */}
        {insight.source.url ? (
          <a
            href={insight.source.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'flex items-center gap-1.5 text-xs font-medium hover:underline transition-colors',
              platformColor
            )}
          >
            <ExternalLink className="w-3 h-3" />
            <span>{insight.source.platform}</span>
          </a>
        ) : (
          <span className={cn('flex items-center gap-1.5 text-xs font-medium', platformColor)}>
            <span>{insight.source.platform}</span>
          </span>
        )}

        <div className="flex items-center gap-2">
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
              <span>{insight.connections!.length}</span>
            </button>
          )}

          {/* Selected indicator */}
          {isSelected && (
            <div className="flex items-center gap-1 text-xs text-purple-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

// Grid component for V6 insights - responsive with masonry-like behavior
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
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4 auto-rows-min', gridCols[columns])}>
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
