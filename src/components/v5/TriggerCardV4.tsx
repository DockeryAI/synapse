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
  ExternalLink,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConsolidatedTrigger, TriggerCategory, EvidenceItem } from '@/services/triggers/trigger-consolidation.service';
import { useResolvedSources } from '@/hooks/v5/useResolvedSources';

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
    icon: Heart,
    label: 'Desire',
    color: 'text-pink-400',
    bgColor: 'bg-pink-950/80',
    borderColor: 'border-pink-700',
    ringColor: 'ring-pink-500',
  },
  'pain-point': {
    icon: Flame,
    label: 'Pain Point',
    color: 'text-orange-400',
    bgColor: 'bg-orange-950/80',
    borderColor: 'border-orange-700',
    ringColor: 'ring-orange-500',
  },
  objection: {
    icon: ShieldQuestion,
    label: 'Objection',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-950/80',
    borderColor: 'border-yellow-700',
    ringColor: 'ring-yellow-500',
  },
  motivation: {
    icon: Target,
    label: 'Motivation',
    color: 'text-green-400',
    bgColor: 'bg-green-950/80',
    borderColor: 'border-green-700',
    ringColor: 'ring-green-500',
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
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get the best quote from evidence items for preview
 */
function getBestQuote(evidence: EvidenceItem[]): { quote: string; source: string } | null {
  if (evidence.length === 0) return null;

  // Sort by length and pick the most substantive (50-200 chars ideal)
  const sorted = [...evidence].sort((a, b) => {
    const aLen = a.quote.length;
    const bLen = b.quote.length;
    const aScore = aLen >= 50 && aLen <= 200 ? 100 : Math.abs(125 - aLen);
    const bScore = bLen >= 50 && bLen <= 200 ? 100 : Math.abs(125 - bLen);
    return bScore - aScore;
  });

  const best = sorted[0];
  if (!best?.quote) return null;

  // Format the source attribution
  const source = formatSourceAttribution(best.platform, best.source);

  return { quote: best.quote, source };
}

/**
 * Format source attribution for display
 */
function formatSourceAttribution(platform?: string, source?: string): string {
  if (platform) {
    // Clean up platform names
    const platformMap: Record<string, string> = {
      'reddit': 'Reddit',
      'g2': 'G2 Review',
      'capterra': 'Capterra',
      'hackernews': 'HackerNews',
      'twitter': 'Twitter/X',
      'linkedin': 'LinkedIn',
      'youtube': 'YouTube',
      'trustpilot': 'Trustpilot',
      'google': 'Google Review',
      'yelp': 'Yelp',
      'amazon': 'Amazon Review',
      'facebook': 'Facebook',
      'tiktok': 'TikTok',
    };
    const cleanPlatform = platform.toLowerCase().replace(/[^a-z]/g, '');
    return platformMap[cleanPlatform] || platform;
  }
  if (source) {
    // Try to extract domain or meaningful name
    try {
      const url = new URL(source);
      return url.hostname.replace('www.', '');
    } catch {
      return source.slice(0, 30);
    }
  }
  return 'Source';
}

/**
 * Get confidence color based on score (dark theme)
 */
function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return 'text-green-400';
  if (confidence >= 60) return 'text-yellow-400';
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
  const config = CATEGORY_CONFIG[trigger.category] || CATEGORY_CONFIG['pain-point'];
  const CategoryIcon = config.icon;

  // Extract verifiedSourceIds from evidence
  const sourceIds = useMemo(() => {
    return trigger.evidence
      .map(e => e.verifiedSourceId)
      .filter((id): id is string => !!id);
  }, [trigger.evidence]);

  // Resolve sources from registry
  const { sources: registrySources } = useResolvedSources(sourceIds);

  // Source count
  const hasRegistrySources = registrySources.length > 0;
  const sourceCount = hasRegistrySources ? registrySources.length : trigger.evidence.length;

  // Get best quote for preview
  const bestQuote = getBestQuote(trigger.evidence);

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
          {trigger.title}
        </h3>

        {/* Quote + Source Attribution - directly after title */}
        {bestQuote && (
          <div className="mt-auto">
            <p className="text-[11px] text-gray-400 italic line-clamp-2 leading-tight">
              "{bestQuote.quote.slice(0, 100)}{bestQuote.quote.length > 100 ? '...' : ''}"
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5">
              — {bestQuote.source}
            </p>
          </div>
        )}

        {/* Bottom Stats Row */}
        <div className="flex items-center justify-between text-[10px] mt-2 pt-2 border-t border-gray-600">
          <span className={cn('font-semibold', getConfidenceColor(confidencePercent))}>
            {confidencePercent}%
          </span>
          <span className="text-gray-500">
            {sourceCount} src{sourceCount !== 1 ? 's' : ''}
          </span>
          <button
            onClick={handleExpandToggle}
            className="text-gray-400 hover:text-gray-200 p-0.5 rounded hover:bg-gray-700/50"
          >
            <ChevronDown className="h-3.5 w-3.5" />
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
      {/* Category Header with Collapse Button */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn('p-1.5 rounded', config.bgColor)}>
            <CategoryIcon className={cn('h-4 w-4', config.color)} />
          </div>
          <span className={cn('text-xs font-bold uppercase tracking-wider', config.color)}>
            {config.label}
          </span>
          {trigger.isHighUVPAlignment && (
            <span className="text-[9px] bg-emerald-900/50 text-emerald-400 px-1.5 py-0.5 rounded font-medium border border-emerald-700/50">
              UVP Match
            </span>
          )}
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
        {trigger.title}
      </h3>

      {/* Executive Summary - always show if exists and longer than title */}
      {trigger.executiveSummary && trigger.executiveSummary.length > trigger.title.length && (
        <div className="mb-4">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
            Executive Summary
          </h4>
          <p className="text-sm text-gray-300 leading-relaxed">
            {trigger.executiveSummary}
          </p>
        </div>
      )}

      {/* UVP Alignments */}
      {trigger.uvpAlignments && trigger.uvpAlignments.length > 0 && (
        <div className="mb-4">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
            UVP Alignment
          </h4>
          <div className="space-y-1">
            {trigger.uvpAlignments.map((alignment, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                <span>{alignment}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Provenance */}
      <div>
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
          Provenance ({sourceCount} source{sourceCount !== 1 ? 's' : ''})
        </h4>
        <div className="space-y-3">
          {trigger.evidence.map((evidence, idx) => (
            <div key={evidence.id || idx} className="border-l-2 border-gray-700 pl-3">
              <p className="text-sm text-gray-300 italic leading-relaxed">
                "{evidence.quote}"
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-gray-500">
                  — {formatSourceAttribution(evidence.platform, evidence.source)}
                </span>
                {evidence.url && (
                  <a
                    href={evidence.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-gray-500 hover:text-gray-300"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="flex items-center justify-between text-xs mt-4 pt-3 border-t border-gray-700/50">
        <span className={cn('font-semibold', getConfidenceColor(confidencePercent))}>
          Confidence: {confidencePercent}%
        </span>
        <span className="text-gray-500">
          {sourceCount} verified source{sourceCount !== 1 ? 's' : ''}
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

export default TriggerCardV4;
