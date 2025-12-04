/**
 * TriggerFilters Component - Triggers 4.0
 *
 * Filter controls for trigger cards by category, confidence, and platform.
 *
 * Created: 2025-12-01
 */

import { useState, useMemo } from 'react';
import {
  Filter,
  X,
  Flame,
  Heart,
  AlertTriangle,
  ShieldQuestion,
  Target,
  Shield,
  Clock,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConsolidatedTrigger, TriggerCategory } from '@/services/triggers/trigger-consolidation.service';
import type { SourcePlatform } from '@/types/verified-source.types';

// ============================================================================
// TYPES
// ============================================================================

export interface TriggerFiltersProps {
  triggers: ConsolidatedTrigger[];
  /** Currently applied filters */
  filters: TriggerFilterState;
  /** Filter change handler */
  onFiltersChange: (filters: TriggerFilterState) => void;
  /** Custom class name */
  className?: string;
}

export interface TriggerFilterState {
  categories: TriggerCategory[];
  minConfidence: number;
  platforms: SourcePlatform[];
  showTimeSensitiveOnly: boolean;
}

export const DEFAULT_FILTERS: TriggerFilterState = {
  categories: [],
  minConfidence: 0,
  platforms: [],
  showTimeSensitiveOnly: false,
};

// ============================================================================
// CATEGORY CONFIG
// ============================================================================

interface CategoryOption {
  value: TriggerCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: 'pain', label: 'Pain', icon: Flame, color: 'text-orange-600' },
  { value: 'fear', label: 'Fear', icon: AlertTriangle, color: 'text-red-600' },
  { value: 'desire', label: 'Desire', icon: Heart, color: 'text-pink-600' },
  { value: 'trust', label: 'Trust', icon: Shield, color: 'text-blue-600' },
  { value: 'urgency', label: 'Urgency', icon: Clock, color: 'text-purple-600' },
];

const CONFIDENCE_OPTIONS = [
  { value: 0, label: 'All' },
  { value: 50, label: '50+' },
  { value: 70, label: '70+' },
  { value: 85, label: '85+' },
];

const PLATFORM_OPTIONS: { value: SourcePlatform; label: string }[] = [
  { value: 'reddit', label: 'Reddit' },
  { value: 'twitter', label: 'X/Twitter' },
  { value: 'g2', label: 'G2' },
  { value: 'trustpilot', label: 'Trustpilot' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'hackernews', label: 'Hacker News' },
  { value: 'quora', label: 'Quora' },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Apply filters to triggers
 */
export function applyTriggerFilters(
  triggers: ConsolidatedTrigger[],
  filters: TriggerFilterState
): ConsolidatedTrigger[] {
  return triggers.filter((trigger) => {
    // Category filter
    if (filters.categories.length > 0 && !filters.categories.includes(trigger.category)) {
      return false;
    }

    // Strength filter (V6 uses strength 0-100, not confidence)
    if (filters.minConfidence > 0) {
      if (trigger.strength < filters.minConfidence) {
        return false;
      }
    }

    // Source filter (V6 uses source, not platform)
    if (filters.platforms.length > 0) {
      const triggerSources = new Set(
        trigger.evidence.map((e) => e.source.toLowerCase())
      );
      const hasMatchingSource = filters.platforms.some((p) =>
        triggerSources.has(p) || Array.from(triggerSources).some(s => s.includes(p))
      );
      if (!hasMatchingSource) {
        return false;
      }
    }

    // Time sensitive filter (V6 doesn't have isTimeSensitive property)
    // Commenting out until V6 adds this field
    // if (filters.showTimeSensitiveOnly && !trigger.isTimeSensitive) {
    //   return false;
    // }

    return true;
  });
}

/**
 * Get counts for each category
 */
function getCategoryCounts(triggers: ConsolidatedTrigger[]): Record<TriggerCategory, number> {
  const counts: Record<string, number> = {};
  for (const trigger of triggers) {
    counts[trigger.category] = (counts[trigger.category] || 0) + 1;
  }
  return counts as Record<TriggerCategory, number>;
}

/**
 * Get counts for each platform
 */
function getPlatformCounts(triggers: ConsolidatedTrigger[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const trigger of triggers) {
    const sources = new Set(trigger.evidence.map((e) => e.source.toLowerCase()));
    for (const source of sources) {
      counts[source] = (counts[source] || 0) + 1;
    }
  }
  return counts;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TriggerFilters({
  triggers,
  filters,
  onFiltersChange,
  className,
}: TriggerFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate counts
  const categoryCounts = useMemo(() => getCategoryCounts(triggers), [triggers]);
  const platformCounts = useMemo(() => getPlatformCounts(triggers), [triggers]);
  // V6 doesn't have isTimeSensitive property yet
  const timeSensitiveCount = useMemo(
    () => 0,
    [triggers]
  );

  // Count active filters
  const activeFilterCount =
    filters.categories.length +
    filters.platforms.length +
    (filters.minConfidence > 0 ? 1 : 0) +
    (filters.showTimeSensitiveOnly ? 1 : 0);

  // Toggle category
  const toggleCategory = (category: TriggerCategory) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];
    onFiltersChange({ ...filters, categories: newCategories });
  };

  // Toggle platform
  const togglePlatform = (platform: SourcePlatform) => {
    const newPlatforms = filters.platforms.includes(platform)
      ? filters.platforms.filter((p) => p !== platform)
      : [...filters.platforms, platform];
    onFiltersChange({ ...filters, platforms: newPlatforms });
  };

  // Set confidence
  const setConfidence = (confidence: number) => {
    onFiltersChange({ ...filters, minConfidence: confidence });
  };

  // Toggle time sensitive
  const toggleTimeSensitive = () => {
    onFiltersChange({ ...filters, showTimeSensitiveOnly: !filters.showTimeSensitiveOnly });
  };

  // Clear all filters
  const clearFilters = () => {
    onFiltersChange(DEFAULT_FILTERS);
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>

        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Clear all
          </button>
        )}
      </div>

      {/* Quick Filters (always visible) */}
      <div className="flex flex-wrap gap-2">
        {/* Category pills */}
        {CATEGORY_OPTIONS.slice(0, 4).map((option) => {
          const Icon = option.icon;
          const count = categoryCounts[option.value] || 0;
          const isActive = filters.categories.includes(option.value);

          return (
            <button
              key={option.value}
              onClick={() => toggleCategory(option.value)}
              disabled={count === 0}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors',
                isActive
                  ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                  : count > 0
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-gray-50 text-gray-400 cursor-not-allowed'
              )}
            >
              <Icon className={cn('h-3 w-3', isActive ? 'text-blue-600' : option.color)} />
              <span>{option.label}</span>
              <span className="text-gray-400">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="space-y-4 pt-2 border-t border-gray-100">
          {/* All Categories */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Categories
            </h4>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((option) => {
                const Icon = option.icon;
                const count = categoryCounts[option.value] || 0;
                const isActive = filters.categories.includes(option.value);

                return (
                  <button
                    key={option.value}
                    onClick={() => toggleCategory(option.value)}
                    disabled={count === 0}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                        : count > 0
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                    )}
                  >
                    <Icon className={cn('h-3 w-3', isActive ? 'text-blue-600' : option.color)} />
                    <span>{option.label}</span>
                    <span className="text-gray-400">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Confidence Filter */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Minimum Confidence
            </h4>
            <div className="flex gap-2">
              {CONFIDENCE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setConfidence(option.value)}
                  className={cn(
                    'px-3 py-1.5 rounded text-xs font-medium transition-colors',
                    filters.minConfidence === option.value
                      ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Platform Filter */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Source Platform
            </h4>
            <div className="flex flex-wrap gap-2">
              {PLATFORM_OPTIONS.map((option) => {
                const count = platformCounts[option.value] || 0;
                const isActive = filters.platforms.includes(option.value);

                return (
                  <button
                    key={option.value}
                    onClick={() => togglePlatform(option.value)}
                    disabled={count === 0}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                        : count > 0
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                    )}
                  >
                    {isActive && <Check className="h-3 w-3" />}
                    <span>{option.label}</span>
                    <span className="text-gray-400">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Sensitive Toggle */}
          {timeSensitiveCount > 0 && (
            <div>
              <button
                onClick={toggleTimeSensitive}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors',
                  filters.showTimeSensitiveOnly
                    ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                <Clock className="h-4 w-4" />
                <span>Show Time Sensitive Only</span>
                <span className="text-gray-400">({timeSensitiveCount})</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TriggerFilters;
