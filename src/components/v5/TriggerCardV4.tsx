/**
 * TriggerCardV4 Component - Triggers 4.0
 *
 * V4-style square card layout with expandable verified sources.
 * Uses SourceRegistry for all source data - never LLM output.
 *
 * Design:
 * +-----------------------------------+
 * | [icon] Category                   |
 * | "Exact quote from source..."      |
 * |                                   |
 * | Score: 87  |  3 sources           |
 * | --------------------------------- |
 * | v View Sources                    |
 * |   * reddit.com/r/... - @user1     |
 * |   * twitter.com/... - @user2      |
 * +-----------------------------------+
 *
 * Created: 2025-12-01
 */

import { useState, useMemo } from 'react';
import {
  Flame,
  Heart,
  AlertTriangle,
  ShieldQuestion,
  Target,
  Shield,
  Clock,
  ChevronDown,
  ChevronUp,
  Quote,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConsolidatedTrigger, TriggerCategory, EvidenceItem } from '@/services/triggers/trigger-consolidation.service';
import { useResolvedSources, type ResolvedSource } from '@/hooks/v5/useResolvedSources';
import { SourceLink, SourceList } from './SourceLink';

// ============================================================================
// TYPES
// ============================================================================

export interface TriggerCardV4Props {
  trigger: ConsolidatedTrigger;
  /** Show confidence score */
  showScore?: boolean;
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
// CATEGORY CONFIG
// ============================================================================

interface CategoryConfig {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const CATEGORY_CONFIG: Record<TriggerCategory, CategoryConfig> = {
  fear: {
    icon: AlertTriangle,
    label: 'Fear',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  desire: {
    icon: Heart,
    label: 'Desire',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
  },
  'pain-point': {
    icon: Flame,
    label: 'Pain Point',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  objection: {
    icon: ShieldQuestion,
    label: 'Objection',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
  motivation: {
    icon: Target,
    label: 'Motivation',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  trust: {
    icon: Shield,
    label: 'Trust',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  urgency: {
    icon: Clock,
    label: 'Urgency',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get the best quote from evidence items
 * Prefers longer, more substantive quotes
 */
function getBestQuote(evidence: EvidenceItem[]): string {
  if (evidence.length === 0) return '';

  // Sort by length and pick the most substantive
  const sorted = [...evidence].sort((a, b) => {
    // Prefer quotes between 50-200 chars
    const aLen = a.quote.length;
    const bLen = b.quote.length;
    const aScore = aLen >= 50 && aLen <= 200 ? 100 : Math.abs(125 - aLen);
    const bScore = bLen >= 50 && bLen <= 200 ? 100 : Math.abs(125 - bLen);
    return bScore - aScore;
  });

  return sorted[0]?.quote || '';
}

/**
 * Get confidence color based on score
 */
function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return 'text-green-600';
  if (confidence >= 60) return 'text-yellow-600';
  return 'text-gray-500';
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TriggerCardV4({
  trigger,
  showScore = true,
  variant = 'default',
  onClick,
  isSelected = false,
  className,
}: TriggerCardV4Props) {
  const [isExpanded, setIsExpanded] = useState(variant === 'expanded');

  // Get category config
  const config = CATEGORY_CONFIG[trigger.category] || CATEGORY_CONFIG['pain-point'];
  const CategoryIcon = config.icon;

  // Extract verifiedSourceIds from evidence
  const sourceIds = useMemo(() => {
    return trigger.evidence
      .map(e => e.verifiedSourceId)
      .filter((id): id is string => !!id);
  }, [trigger.evidence]);

  // Resolve sources from registry
  const { sources, hasUnresolved } = useResolvedSources(sourceIds);

  // Get best quote for display
  const displayQuote = getBestQuote(trigger.evidence);

  // Confidence display
  const confidencePercent = Math.round(trigger.confidence * 100);

  const handleCardClick = () => {
    if (onClick) {
      onClick(trigger);
    }
  };

  const handleExpandToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className={cn(
        'rounded-lg border transition-all duration-200',
        config.borderColor,
        isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : '',
        onClick ? 'cursor-pointer hover:shadow-md' : '',
        variant === 'compact' ? 'p-3' : 'p-4',
        className
      )}
      onClick={handleCardClick}
    >
      {/* Header: Category Badge + Title */}
      <div className="flex items-start gap-3 mb-3">
        <div className={cn('p-2 rounded-lg', config.bgColor)}>
          <CategoryIcon className={cn('h-4 w-4', config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('text-xs font-medium uppercase tracking-wide', config.color)}>
              {config.label}
            </span>
            {/* PHASE F: UVP Alignment Badge */}
            {trigger.isHighUVPAlignment && (
              <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">
                UVP Match
              </span>
            )}
            {trigger.isTimeSensitive && (
              <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                Time Sensitive
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
            {trigger.title}
          </h3>
        </div>
      </div>

      {/* Quote */}
      {displayQuote && variant !== 'compact' && (
        <div className="mb-3 pl-2 border-l-2 border-gray-200">
          <div className="flex items-start gap-1">
            <Quote className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-600 italic line-clamp-3">
              {displayQuote}
            </p>
          </div>
        </div>
      )}

      {/* Executive Summary (if no quote) */}
      {!displayQuote && variant !== 'compact' && trigger.executiveSummary && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {trigger.executiveSummary}
        </p>
      )}

      {/* Stats Row */}
      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
        <div className="flex items-center gap-3">
          {showScore && (
            <span className={cn('font-medium', getConfidenceColor(confidencePercent))}>
              Score: {confidencePercent}
            </span>
          )}
          <span>
            {sources.length} source{sources.length !== 1 ? 's' : ''}
            {hasUnresolved && ' (some unavailable)'}
          </span>
        </div>
        {trigger.buyerJourneyStage && (
          <span className="text-gray-400 capitalize">
            {trigger.buyerJourneyStage.replace('-', ' ')}
          </span>
        )}
      </div>

      {/* Expand/Collapse Sources */}
      {sources.length > 0 && (
        <>
          <button
            onClick={handleExpandToggle}
            className="w-full flex items-center justify-between py-2 border-t border-gray-100 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span>{isExpanded ? 'Hide Sources' : 'View Sources'}</span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {isExpanded && (
            <div className="pt-2 border-t border-gray-100">
              <SourceList
                sources={sources}
                maxVisible={5}
                compact
                verifyOnMount={false}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================================
// GRID COMPONENT
// ============================================================================

export interface TriggerCardGridProps {
  triggers: ConsolidatedTrigger[];
  /** Number of columns */
  columns?: 1 | 2 | 3 | 4;
  /** Card variant */
  variant?: 'default' | 'compact';
  /** Selected trigger ID */
  selectedId?: string;
  /** Click handler */
  onTriggerClick?: (trigger: ConsolidatedTrigger) => void;
  /** Custom class name */
  className?: string;
}

export function TriggerCardGrid({
  triggers,
  columns = 2,
  variant = 'default',
  selectedId,
  onTriggerClick,
  className,
}: TriggerCardGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {triggers.map((trigger) => (
        <TriggerCardV4
          key={trigger.id}
          trigger={trigger}
          variant={variant}
          isSelected={trigger.id === selectedId}
          onClick={onTriggerClick}
        />
      ))}
    </div>
  );
}

export default TriggerCardV4;
