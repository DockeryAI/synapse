/**
 * TriggerCardV4 Component - Triggers 4.0
 *
 * Dark theme square cards with expandable provenance.
 *
 * PREVIEW STATE (collapsed):
 * +-----------------------------------+
 * | [icon] CATEGORY                   |
 * | Title text that fills the space   |
 * | without wasted whitespace...      |
 * |                                   |
 * | "Actual quote from source..."     |
 * | — G2 Review                       |
 * | 87%              3 srcs    [v]    |
 * +-----------------------------------+
 *
 * EXPANDED STATE:
 * +-----------------------------------+
 * | [icon] CATEGORY              [^]  |
 * | Title text...                     |
 * |-----------------------------------|
 * | EXECUTIVE SUMMARY                 |
 * | Full summary text here...         |
 * |-----------------------------------|
 * | UVP ALIGNMENT                     |
 * | * Target Customer Match           |
 * | * Key Benefit Alignment           |
 * |-----------------------------------|
 * | PROVENANCE (3 sources)            |
 * | "Quote 1..." — Reddit r/saas      |
 * | "Quote 2..." — G2 Review          |
 * | "Quote 3..." — HackerNews         |
 * +-----------------------------------+
 *
 * Created: 2025-12-01
 * Updated: 2025-12-02
 */

import { useState } from 'react';
import {
  Flame,
  Speech,
  AlertTriangle,
  ShieldQuestion,
  Target,
  Shield,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckCircle,
  Users,
  TrendingUp,
  Search,
  MapPin,
  Zap,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BorderBeam } from '@/components/ui/border-beam';
import type { ConsolidatedTrigger, TriggerCategory, EvidenceItem } from '@/services/triggers/trigger-consolidation.service';

// ============================================================================
// TYPES
// ============================================================================

export interface TriggerCardV4Props {
  trigger: ConsolidatedTrigger;
  /** Card variant */
  variant?: 'default' | 'compact' | 'expanded';
  /** Click handler */
  onClick?: (trigger: ConsolidatedTrigger) => void;
  /** Whether card is selected */
  isSelected?: boolean;
  /** Custom class name */
  className?: string;
}

// ============================================================================
// CATEGORY CONFIG - DARK THEME
// ============================================================================

interface CategoryConfig {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  ringColor: string;
}

const CATEGORY_CONFIG: Record<TriggerCategory, CategoryConfig> = {
  fear: {
    icon: AlertTriangle,
    label: 'Fear',
    color: 'text-red-400',
    bgColor: 'bg-red-950/80',
    borderColor: 'border-red-700',
    ringColor: 'ring-red-500',
  },
  desire: {
    icon: Speech,
    label: 'Desire',
    color: 'text-pink-400',
    bgColor: 'bg-pink-950/80',
    borderColor: 'border-pink-700',
    ringColor: 'ring-pink-500',
  },
  pain: {
    icon: Flame,
    label: 'Pain',
    color: 'text-orange-400',
    bgColor: 'bg-orange-950/80',
    borderColor: 'border-orange-700',
    ringColor: 'ring-orange-500',
  },
  trust: {
    icon: Shield,
    label: 'Trust',
    color: 'text-blue-400',
    bgColor: 'bg-blue-950/80',
    borderColor: 'border-blue-700',
    ringColor: 'ring-blue-500',
  },
  urgency: {
    icon: Clock,
    label: 'Urgency',
    color: 'text-purple-400',
    bgColor: 'bg-purple-950/80',
    borderColor: 'border-purple-700',
    ringColor: 'ring-purple-500',
  },
  authority: {
    icon: Shield,
    label: 'Authority',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-950/80',
    borderColor: 'border-indigo-700',
    ringColor: 'ring-indigo-500',
  },
  social_proof: {
    icon: Users,
    label: 'Social Proof',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-950/80',
    borderColor: 'border-emerald-700',
    ringColor: 'ring-emerald-500',
  },
  scarcity: {
    icon: Clock,
    label: 'Scarcity',
    color: 'text-amber-400',
    bgColor: 'bg-amber-950/80',
    borderColor: 'border-amber-700',
    ringColor: 'ring-amber-500',
  },
  curiosity: {
    icon: Search,
    label: 'Curiosity',
    color: 'text-violet-400',
    bgColor: 'bg-violet-950/80',
    borderColor: 'border-violet-700',
    ringColor: 'ring-violet-500',
  },
  convenience: {
    icon: Zap,
    label: 'Convenience',
    color: 'text-lime-400',
    bgColor: 'bg-lime-950/80',
    borderColor: 'border-lime-700',
    ringColor: 'ring-lime-500',
  },
  value: {
    icon: Target,
    label: 'Value',
    color: 'text-green-400',
    bgColor: 'bg-green-950/80',
    borderColor: 'border-green-700',
    ringColor: 'ring-green-500',
  },
  status: {
    icon: Star,
    label: 'Status',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-950/80',
    borderColor: 'border-yellow-700',
    ringColor: 'ring-yellow-500',
  },
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get the best quote from evidence items for preview
 */
function getBestQuote(evidence: EvidenceItem[]): { text: string; source: string } | null {
  if (evidence.length === 0) return null;

  // Sort by length and pick the most substantive (50-200 chars ideal)
  const sorted = [...evidence].sort((a, b) => {
    const aLen = a.text.length;
    const bLen = b.text.length;
    const aScore = aLen >= 50 && aLen <= 200 ? 100 : Math.abs(125 - aLen);
    const bScore = bLen >= 50 && bLen <= 200 ? 100 : Math.abs(125 - bLen);
    return bScore - aScore;
  });

  const best = sorted[0];
  if (!best?.text) return null;

  // V6 format - just use source directly
  const source = best.source;

  return { text: best.text, source };
}


/**
 * Get source count color based on number of sources (dark theme)
 * Phase 5: Replace confidence theater with honest source count metric
 */
function getSourceCountColor(sourceCount: number): string {
  if (sourceCount >= 4) return 'text-green-400';
  if (sourceCount >= 2) return 'text-yellow-400';
  return 'text-gray-400';
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TriggerCardV4({
  trigger,
  variant = 'default',
  onClick,
  isSelected = false,
  className,
}: TriggerCardV4Props) {
  const [isExpanded, setIsExpanded] = useState(variant === 'expanded');

  // Get category config
  const config = CATEGORY_CONFIG[trigger.category] || CATEGORY_CONFIG['pain'];
  const CategoryIcon = config.icon;

  // V1-STYLE: Use evidence directly, no registry lookup
  // Source count is simply the number of evidence items
  const sourceCount = trigger.evidence.length;

  // Get best quote for preview
  const bestQuote = getBestQuote(trigger.evidence);

  // Phase 5: Remove confidence theater - use source count only
  // Confidence display removed in favor of honest "Backed by X sources"

  const handleCardClick = () => {
    if (onClick) {
      onClick(trigger);
    }
  };

  const handleExpandToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('[TriggerCardV4] Expand toggled:', !isExpanded);
    setIsExpanded(!isExpanded);
  };

  // COLLAPSED VIEW - Compact card with title, quote, source (no aspect-square)
  if (!isExpanded) {
    return (
      <div
        className={cn(
          // Base dark card styling
          'rounded-lg border transition-all duration-200',
          config.borderColor,
          config.bgColor,
          // Selection state
          isSelected ? `ring-2 ${config.ringColor} ring-offset-1 ring-offset-gray-900` : '',
          onClick ? 'cursor-pointer hover:brightness-110' : '',
          // Compact height instead of square
          'flex flex-col h-auto min-h-[180px]',
          variant === 'compact' ? 'p-2' : 'p-3',
          className
        )}
        onClick={handleCardClick}
      >
        {/* Category Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className={cn('p-1 rounded', config.bgColor)}>
            <CategoryIcon className={cn('h-3.5 w-3.5', config.color)} />
          </div>
          <span className={cn('text-[10px] font-bold uppercase tracking-wider', config.color)}>
            {config.label}
          </span>
        </div>

        {/* Title - no flex-1, natural height */}
        <h3 className="text-sm font-semibold text-gray-100 line-clamp-3 leading-snug mb-2">
          {trigger.text}
        </h3>

        {/* Quote + Source Attribution - flex-1 to push expand button to bottom */}
        <div className="flex-1">
          {bestQuote && (
            <div>
              <p className="text-[11px] text-gray-400 italic line-clamp-2 leading-tight">
                "{bestQuote.text.slice(0, 100)}{bestQuote.text.length > 100 ? '...' : ''}"
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                — {bestQuote.source}
              </p>
            </div>
          )}
        </div>

        {/* Bottom Stats Row - ALWAYS at bottom, clickable expand */}
        <div
          className="flex items-center justify-between text-[10px] mt-2 pt-2 border-t border-gray-600"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleExpandToggle}
            className={cn(
              'font-semibold cursor-pointer hover:underline py-2 px-3 -ml-3 -mb-1 rounded',
              'hover:bg-gray-700/50 active:bg-gray-600/50',
              'select-none',
              getSourceCountColor(sourceCount)
            )}
          >
            {isExpanded ? '▲ Collapse' : `▼ Backed by ${sourceCount} source${sourceCount !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    );
  }

  // EXPANDED VIEW - Full details with provenance
  // Spans full width when expanded to push other cards down
  return (
    <div
      className={cn(
        // Base dark card styling - spans full grid width when expanded
        'rounded-lg border transition-all duration-200',
        config.borderColor,
        config.bgColor,
        isSelected ? `ring-2 ${config.ringColor} ring-offset-1 ring-offset-gray-900` : '',
        onClick ? 'cursor-pointer' : '',
        'p-4',
        // Span full width when expanded
        'col-span-full',
        className
      )}
      onClick={handleCardClick}
    >
      {/* Category Header with Collapse Button - Phase 5: Removed UVP Match badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn('p-1.5 rounded', config.bgColor)}>
            <CategoryIcon className={cn('h-4 w-4', config.color)} />
          </div>
          <span className={cn('text-xs font-bold uppercase tracking-wider', config.color)}>
            {config.label}
          </span>
        </div>
        <button
          onClick={handleExpandToggle}
          className="text-gray-400 hover:text-gray-200 p-1 rounded hover:bg-gray-700/50"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-gray-100 mb-3 leading-snug">
        {trigger.text}
      </h3>


      {/* Full Provenance */}
      <div>
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
          Provenance ({sourceCount} source{sourceCount !== 1 ? 's' : ''})
        </h4>
        <div className="space-y-3">
          {trigger.evidence.map((evidence, idx) => (
            <div key={evidence.id || idx} className="border-l-2 border-gray-700 pl-3">
              <p className="text-sm text-gray-300 italic leading-relaxed">
                "{evidence.text}"
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-gray-500">
                  — {evidence.source}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Stats - Phase 5: Source count only, no confidence theater */}
      <div className="flex items-center justify-end text-xs mt-4 pt-3 border-t border-gray-700/50">
        <span className={cn('font-semibold', getSourceCountColor(sourceCount))}>
          Backed by {sourceCount} verified source{sourceCount !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// GRID COMPONENT
// ============================================================================

export interface TriggerCardGridProps {
  triggers: ConsolidatedTrigger[];
  /** Number of columns */
  columns?: 2 | 3 | 4;
  /** Card variant */
  variant?: 'default' | 'compact';
  /** Selected trigger IDs */
  selectedIds?: Set<string>;
  /** Click handler */
  onTriggerClick?: (trigger: ConsolidatedTrigger) => void;
  /** Custom class name */
  className?: string;
}

export function TriggerCardGrid({
  triggers,
  columns = 3,
  variant = 'default',
  selectedIds = new Set(),
  onTriggerClick,
  className,
}: TriggerCardGridProps) {
  // Responsive columns: 1 on mobile, 2 on sm, 3 on md, 4 on lg/xl
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-3', gridCols[columns], className)}>
      {triggers.map((trigger) => (
        <TriggerCardV4
          key={trigger.id}
          trigger={trigger}
          variant={variant}
          isSelected={selectedIds.has(trigger.id)}
          onClick={onTriggerClick}
        />
      ))}
    </div>
  );
}

// ============================================================================
// SKELETON COMPONENT - Loading state matching TriggerCardV4 dark theme
// ============================================================================

export interface TriggerCardSkeletonProps {
  /** Pass type label for the loading state */
  passLabel?: string;
  /** Custom class name */
  className?: string;
}

/**
 * Dark-themed skeleton card that matches TriggerCardV4 layout.
 * Shows a centered spinner animation with optional pass label.
 * Uses BorderBeam for premium animated border effect.
 */
export function TriggerCardSkeleton({
  passLabel,
  className,
}: TriggerCardSkeletonProps) {
  return (
    <div
      className={cn(
        // Match TriggerCardV4 collapsed styling
        'rounded-lg border transition-all duration-200',
        'border-gray-700/50 bg-gray-900/80',
        'flex flex-col h-auto min-h-[180px] p-3',
        'relative overflow-hidden',
        className
      )}
    >
      {/* Premium animated border beam effect */}
      <BorderBeam
        size={120}
        duration={8}
        borderWidth={1.5}
        colorFrom="#a855f7"
        colorTo="#3b82f6"
        delay={Math.random() * 4}
      />

      {/* Shimmer overlay */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-gray-700/20 to-transparent" />

      {/* Category Header Skeleton */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded bg-gray-700/50 animate-pulse" />
        <div className="h-3 w-16 rounded bg-gray-700/50 animate-pulse" />
      </div>

      {/* Title Skeleton */}
      <div className="space-y-1.5 mb-2">
        <div className="h-4 w-full rounded bg-gray-700/50 animate-pulse" />
        <div className="h-4 w-3/4 rounded bg-gray-700/50 animate-pulse" />
      </div>

      {/* Center Spinner */}
      <div className="flex-1 flex flex-col items-center justify-center py-4">
        <div className="relative">
          {/* Outer ring with glow */}
          <div className="w-10 h-10 rounded-full border-2 border-gray-700/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]" />
          {/* Spinning ring with gradient */}
          <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-transparent border-t-purple-500 border-r-blue-500 animate-spin" />
          {/* Inner glow */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-500/10 to-blue-500/10" />
        </div>
        {passLabel && (
          <span className="mt-3 text-[10px] text-gray-400 animate-pulse font-medium">
            {passLabel}
          </span>
        )}
      </div>

      {/* Bottom Stats Row Skeleton */}
      <div className="flex items-center justify-between text-[10px] pt-2 border-t border-gray-700">
        <div className="h-3 w-8 rounded bg-gray-700/50" />
        <div className="h-3 w-12 rounded bg-gray-700/50" />
        <div className="h-3 w-4 rounded bg-gray-700/50" />
      </div>
    </div>
  );
}

// ============================================================================
// PROGRESSIVE LOADING GRID
// ============================================================================

export interface ProgressiveLoadingGridProps {
  /** Currently loaded triggers */
  triggers: ConsolidatedTrigger[];
  /** Number of columns */
  columns?: 2 | 3 | 4;
  /** Card variant */
  variant?: 'default' | 'compact';
  /** Selected trigger IDs */
  selectedIds?: Set<string>;
  /** Click handler */
  onTriggerClick?: (trigger: ConsolidatedTrigger) => void;
  /** Whether loading is in progress */
  isLoading?: boolean;
  /** Current pass being loaded (for label) */
  currentPass?: 'pain-fear' | 'desire-motivation' | 'objection-trust' | 'competitor';
  /** Number of skeleton cards to show while loading */
  skeletonCount?: number;
  /** Custom class name */
  className?: string;
}

const PASS_LABELS: Record<string, string> = {
  'pain-fear': 'Analyzing pain points...',
  'desire-motivation': 'Finding desires...',
  'objection-trust': 'Identifying objections...',
  'competitor': 'Researching competitors...',
};

/**
 * Grid that displays real trigger cards + skeleton cards during progressive loading.
 * As passes complete, real cards appear and skeletons shrink until all done.
 */
export function ProgressiveLoadingGrid({
  triggers,
  columns = 3,
  variant = 'default',
  selectedIds = new Set(),
  onTriggerClick,
  isLoading = false,
  currentPass,
  skeletonCount = 6,
  className,
}: ProgressiveLoadingGridProps) {
  // Responsive columns
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  };

  const passLabel = currentPass ? PASS_LABELS[currentPass] : 'Loading triggers...';

  return (
    <div className={cn('space-y-4', className)}>
      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 px-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <span>{passLabel}</span>
          </div>
          <span>{triggers.length} triggers loaded</span>
        </div>
      )}

      {/* Grid with real cards + skeletons */}
      <div className={cn('grid gap-3', gridCols[columns])}>
        {/* Real trigger cards */}
        {triggers.map((trigger) => (
          <TriggerCardV4
            key={trigger.id}
            trigger={trigger}
            variant={variant}
            isSelected={selectedIds.has(trigger.id)}
            onClick={onTriggerClick}
          />
        ))}

        {/* Skeleton cards while loading */}
        {isLoading &&
          Array.from({ length: skeletonCount }).map((_, idx) => (
            <TriggerCardSkeleton key={`skeleton-${idx}`} passLabel={idx === 0 ? passLabel : undefined} />
          ))}
      </div>

      {/* Completion indicator */}
      {!isLoading && triggers.length > 0 && (
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 py-2">
          All {triggers.length} triggers loaded
        </div>
      )}
    </div>
  );
}

export default TriggerCardV4;
