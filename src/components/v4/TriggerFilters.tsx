/**
 * Trigger Filters Component
 *
 * Comprehensive filtering and sorting UI for triggers:
 * - Filter by confidence level (high/medium/low)
 * - Filter by trigger category (fear, desire, pain-point, etc.)
 * - Filter by source platform (reddit, g2, linkedin, etc.)
 * - Filter by buying stage
 * - Filter by recency
 * - Sort options (confidence, recency, relevance)
 *
 * Created: 2025-12-01
 */

import React, { memo, useState, useCallback, useMemo } from 'react';
import {
  Filter,
  ChevronDown,
  X,
  SortAsc,
  SortDesc,
  Heart,
  AlertCircle,
  Sparkles,
  Shield,
  Zap,
  Clock,
  Award,
  Calendar,
  Building2,
  Target,
  Activity,
  TrendingUp,
  CheckCircle2,
  Search,
  ShoppingCart,
  Users,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import type { TriggerCategory } from '@/services/triggers/trigger-consolidation.service';
import type { ConfidenceLevel } from '@/services/triggers/confidence-scorer.service';
import type { BuyingStage } from '@/services/triggers/buying-stage-classifier.service';

// ============================================================================
// TYPES
// ============================================================================

export type SortOption = 'confidence' | 'recency' | 'relevance' | 'sources';
export type SortDirection = 'asc' | 'desc';

export type RecencyFilter = 'all' | 'fresh' | 'recent' | 'aging' | 'stale';

export interface TriggerFilterState {
  confidenceLevels: ConfidenceLevel[];
  categories: TriggerCategory[];
  sources: string[];
  buyingStages: BuyingStage[];
  recency: RecencyFilter;
  hasCompetitorMention: boolean | null;
  hasSurgeDetected: boolean | null;
  isTimeSensitive: boolean | null;
  searchQuery: string;
}

export interface TriggerSortState {
  option: SortOption;
  direction: SortDirection;
}

export interface TriggerFiltersProps {
  filters: TriggerFilterState;
  sort: TriggerSortState;
  onFiltersChange: (filters: TriggerFilterState) => void;
  onSortChange: (sort: TriggerSortState) => void;
  availableSources: string[];
  totalCount: number;
  filteredCount: number;
  className?: string;
}

// ============================================================================
// FILTER CONFIGS
// ============================================================================

const CONFIDENCE_OPTIONS: { value: ConfidenceLevel; label: string; color: string }[] = [
  { value: 'high', label: 'High (70%+)', color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
  { value: 'medium', label: 'Medium (45-69%)', color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
  { value: 'low', label: 'Low (<45%)', color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
];

const CATEGORY_OPTIONS: { value: TriggerCategory; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'fear', label: 'Fear', icon: AlertCircle, color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
  { value: 'desire', label: 'Desire', icon: Sparkles, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
  { value: 'pain-point', label: 'Pain Point', icon: Heart, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
  { value: 'objection', label: 'Objection', icon: Shield, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
  { value: 'motivation', label: 'Motivation', icon: Zap, color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
  { value: 'trust', label: 'Trust', icon: Award, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
  { value: 'urgency', label: 'Urgency', icon: Clock, color: 'text-rose-600 bg-rose-100 dark:bg-rose-900/30' },
];

const BUYING_STAGE_OPTIONS: { value: BuyingStage; label: string; icon: React.ElementType }[] = [
  { value: 'unaware', label: 'Unaware', icon: Search },
  { value: 'problem-aware', label: 'Problem Aware', icon: AlertCircle },
  { value: 'solution-aware', label: 'Solution Aware', icon: Search },
  { value: 'vendor-aware', label: 'Vendor Aware', icon: Building2 },
  { value: 'decision', label: 'Decision', icon: ShoppingCart },
  { value: 'customer-expansion', label: 'Expansion', icon: TrendingUp },
  { value: 'customer-retention', label: 'Retention', icon: Users },
  { value: 'customer-churn-risk', label: 'Churn Risk', icon: AlertTriangle },
];

const RECENCY_OPTIONS: { value: RecencyFilter; label: string; description: string }[] = [
  { value: 'all', label: 'All Time', description: 'Show all signals' },
  { value: 'fresh', label: 'Fresh (0-14 days)', description: 'Peak recency signals' },
  { value: 'recent', label: 'Recent (15-30 days)', description: 'Still highly relevant' },
  { value: 'aging', label: 'Aging (30-60 days)', description: 'Moderate relevance' },
  { value: 'stale', label: 'Stale (60+ days)', description: 'Lower relevance' },
];

const SORT_OPTIONS: { value: SortOption; label: string; icon: React.ElementType }[] = [
  { value: 'confidence', label: 'Confidence', icon: BarChart3 },
  { value: 'recency', label: 'Recency', icon: Calendar },
  { value: 'relevance', label: 'Relevance', icon: Target },
  { value: 'sources', label: 'Source Count', icon: Activity },
];

// ============================================================================
// DEFAULT FILTER STATE
// ============================================================================

export const DEFAULT_FILTER_STATE: TriggerFilterState = {
  confidenceLevels: [],
  categories: [],
  sources: [],
  buyingStages: [],
  recency: 'all',
  hasCompetitorMention: null,
  hasSurgeDetected: null,
  isTimeSensitive: null,
  searchQuery: '',
};

export const DEFAULT_SORT_STATE: TriggerSortState = {
  option: 'confidence',
  direction: 'desc',
};

// ============================================================================
// FILTER DROPDOWN COMPONENT
// ============================================================================

interface FilterDropdownProps {
  label: string;
  icon: React.ElementType;
  isOpen: boolean;
  onToggle: () => void;
  activeCount: number;
  children: React.ReactNode;
}

const FilterDropdown = memo(function FilterDropdown({
  label,
  icon: Icon,
  isOpen,
  onToggle,
  activeCount,
  children,
}: FilterDropdownProps) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={`
          inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors text-sm
          ${isOpen
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
            : activeCount > 0
              ? 'border-purple-300 bg-purple-50 dark:bg-purple-900/10 text-purple-600 dark:text-purple-400'
              : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-slate-600'
          }
        `}
      >
        <Icon className="w-4 h-4" />
        <span>{label}</span>
        {activeCount > 0 && (
          <span className="px-1.5 py-0.5 text-xs bg-purple-500 text-white rounded-full">
            {activeCount}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
          {children}
        </div>
      )}
    </div>
  );
});

// ============================================================================
// CHECKBOX OPTION COMPONENT
// ============================================================================

interface CheckboxOptionProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  icon?: React.ElementType;
  color?: string;
  description?: string;
}

const CheckboxOption = memo(function CheckboxOption({
  checked,
  onChange,
  label,
  icon: Icon,
  color,
  description,
}: CheckboxOptionProps) {
  return (
    <label className="flex items-start gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 rounded border-gray-300 dark:border-slate-600 text-purple-600 focus:ring-purple-500"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {Icon && <Icon className={`w-4 h-4 ${color || 'text-gray-500'}`} />}
          <span className={`text-sm font-medium ${color ? color.split(' ')[0] : 'text-gray-700 dark:text-gray-300'}`}>
            {label}
          </span>
        </div>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
        )}
      </div>
    </label>
  );
});

// ============================================================================
// ACTIVE FILTER PILL
// ============================================================================

interface ActiveFilterPillProps {
  label: string;
  onRemove: () => void;
}

const ActiveFilterPill = memo(function ActiveFilterPill({ label, onRemove }: ActiveFilterPillProps) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
      {label}
      <button
        onClick={onRemove}
        className="hover:bg-purple-200 dark:hover:bg-purple-800/50 rounded-full p-0.5"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
});

// ============================================================================
// MAIN TRIGGER FILTERS COMPONENT
// ============================================================================

export const TriggerFilters = memo(function TriggerFilters({
  filters,
  sort,
  onFiltersChange,
  onSortChange,
  availableSources,
  totalCount,
  filteredCount,
  className = '',
}: TriggerFiltersProps) {
  // Dropdown states
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Toggle dropdown
  const toggleDropdown = useCallback((dropdown: string) => {
    setOpenDropdown((prev) => (prev === dropdown ? null : dropdown));
  }, []);

  // Close all dropdowns
  const closeDropdowns = useCallback(() => {
    setOpenDropdown(null);
  }, []);

  // Filter change handlers
  const toggleConfidence = useCallback(
    (level: ConfidenceLevel) => {
      const newLevels = filters.confidenceLevels.includes(level)
        ? filters.confidenceLevels.filter((l) => l !== level)
        : [...filters.confidenceLevels, level];
      onFiltersChange({ ...filters, confidenceLevels: newLevels });
    },
    [filters, onFiltersChange]
  );

  const toggleCategory = useCallback(
    (category: TriggerCategory) => {
      const newCategories = filters.categories.includes(category)
        ? filters.categories.filter((c) => c !== category)
        : [...filters.categories, category];
      onFiltersChange({ ...filters, categories: newCategories });
    },
    [filters, onFiltersChange]
  );

  const toggleSource = useCallback(
    (source: string) => {
      const newSources = filters.sources.includes(source)
        ? filters.sources.filter((s) => s !== source)
        : [...filters.sources, source];
      onFiltersChange({ ...filters, sources: newSources });
    },
    [filters, onFiltersChange]
  );

  const toggleBuyingStage = useCallback(
    (stage: BuyingStage) => {
      const newStages = filters.buyingStages.includes(stage)
        ? filters.buyingStages.filter((s) => s !== stage)
        : [...filters.buyingStages, stage];
      onFiltersChange({ ...filters, buyingStages: newStages });
    },
    [filters, onFiltersChange]
  );

  const setRecency = useCallback(
    (recency: RecencyFilter) => {
      onFiltersChange({ ...filters, recency });
      closeDropdowns();
    },
    [filters, onFiltersChange, closeDropdowns]
  );

  const setSearchQuery = useCallback(
    (searchQuery: string) => {
      onFiltersChange({ ...filters, searchQuery });
    },
    [filters, onFiltersChange]
  );

  const toggleBooleanFilter = useCallback(
    (key: 'hasCompetitorMention' | 'hasSurgeDetected' | 'isTimeSensitive') => {
      const currentValue = filters[key];
      const newValue = currentValue === null ? true : currentValue === true ? false : null;
      onFiltersChange({ ...filters, [key]: newValue });
    },
    [filters, onFiltersChange]
  );

  // Sort handler
  const handleSortChange = useCallback(
    (option: SortOption) => {
      if (sort.option === option) {
        // Toggle direction
        onSortChange({ option, direction: sort.direction === 'desc' ? 'asc' : 'desc' });
      } else {
        // New option, default to desc
        onSortChange({ option, direction: 'desc' });
      }
      closeDropdowns();
    },
    [sort, onSortChange, closeDropdowns]
  );

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    onFiltersChange(DEFAULT_FILTER_STATE);
  }, [onFiltersChange]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.confidenceLevels.length > 0) count += filters.confidenceLevels.length;
    if (filters.categories.length > 0) count += filters.categories.length;
    if (filters.sources.length > 0) count += filters.sources.length;
    if (filters.buyingStages.length > 0) count += filters.buyingStages.length;
    if (filters.recency !== 'all') count++;
    if (filters.hasCompetitorMention !== null) count++;
    if (filters.hasSurgeDetected !== null) count++;
    if (filters.isTimeSensitive !== null) count++;
    if (filters.searchQuery) count++;
    return count;
  }, [filters]);

  // Get active filter pills
  const activeFilterPills = useMemo(() => {
    const pills: { key: string; label: string; onRemove: () => void }[] = [];

    filters.confidenceLevels.forEach((level) => {
      pills.push({
        key: `confidence-${level}`,
        label: `${level} confidence`,
        onRemove: () => toggleConfidence(level),
      });
    });

    filters.categories.forEach((category) => {
      pills.push({
        key: `category-${category}`,
        label: category,
        onRemove: () => toggleCategory(category),
      });
    });

    filters.sources.forEach((source) => {
      pills.push({
        key: `source-${source}`,
        label: source,
        onRemove: () => toggleSource(source),
      });
    });

    filters.buyingStages.forEach((stage) => {
      pills.push({
        key: `stage-${stage}`,
        label: stage.replace(/-/g, ' '),
        onRemove: () => toggleBuyingStage(stage),
      });
    });

    if (filters.recency !== 'all') {
      const recencyOption = RECENCY_OPTIONS.find((o) => o.value === filters.recency);
      pills.push({
        key: 'recency',
        label: recencyOption?.label || filters.recency,
        onRemove: () => setRecency('all'),
      });
    }

    if (filters.hasCompetitorMention !== null) {
      pills.push({
        key: 'competitor',
        label: filters.hasCompetitorMention ? 'Has competitor' : 'No competitor',
        onRemove: () => onFiltersChange({ ...filters, hasCompetitorMention: null }),
      });
    }

    if (filters.hasSurgeDetected !== null) {
      pills.push({
        key: 'surge',
        label: filters.hasSurgeDetected ? 'Has surge' : 'No surge',
        onRemove: () => onFiltersChange({ ...filters, hasSurgeDetected: null }),
      });
    }

    if (filters.isTimeSensitive !== null) {
      pills.push({
        key: 'timeSensitive',
        label: filters.isTimeSensitive ? 'Time-sensitive' : 'Not time-sensitive',
        onRemove: () => onFiltersChange({ ...filters, isTimeSensitive: null }),
      });
    }

    return pills;
  }, [filters, toggleConfidence, toggleCategory, toggleSource, toggleBuyingStage, setRecency, onFiltersChange]);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search triggers..."
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Confidence filter */}
        <FilterDropdown
          label="Confidence"
          icon={BarChart3}
          isOpen={openDropdown === 'confidence'}
          onToggle={() => toggleDropdown('confidence')}
          activeCount={filters.confidenceLevels.length}
        >
          <div className="py-1">
            {CONFIDENCE_OPTIONS.map((option) => (
              <CheckboxOption
                key={option.value}
                checked={filters.confidenceLevels.includes(option.value)}
                onChange={() => toggleConfidence(option.value)}
                label={option.label}
                color={option.color}
              />
            ))}
          </div>
        </FilterDropdown>

        {/* Category filter */}
        <FilterDropdown
          label="Category"
          icon={Heart}
          isOpen={openDropdown === 'category'}
          onToggle={() => toggleDropdown('category')}
          activeCount={filters.categories.length}
        >
          <div className="py-1 max-h-64 overflow-y-auto">
            {CATEGORY_OPTIONS.map((option) => (
              <CheckboxOption
                key={option.value}
                checked={filters.categories.includes(option.value)}
                onChange={() => toggleCategory(option.value)}
                label={option.label}
                icon={option.icon}
                color={option.color}
              />
            ))}
          </div>
        </FilterDropdown>

        {/* Buying Stage filter */}
        <FilterDropdown
          label="Buying Stage"
          icon={Target}
          isOpen={openDropdown === 'stage'}
          onToggle={() => toggleDropdown('stage')}
          activeCount={filters.buyingStages.length}
        >
          <div className="py-1 max-h-64 overflow-y-auto">
            {BUYING_STAGE_OPTIONS.map((option) => (
              <CheckboxOption
                key={option.value}
                checked={filters.buyingStages.includes(option.value)}
                onChange={() => toggleBuyingStage(option.value)}
                label={option.label}
                icon={option.icon}
              />
            ))}
          </div>
        </FilterDropdown>

        {/* Source filter */}
        {availableSources.length > 0 && (
          <FilterDropdown
            label="Source"
            icon={Building2}
            isOpen={openDropdown === 'source'}
            onToggle={() => toggleDropdown('source')}
            activeCount={filters.sources.length}
          >
            <div className="py-1 max-h-64 overflow-y-auto">
              {availableSources.map((source) => (
                <CheckboxOption
                  key={source}
                  checked={filters.sources.includes(source)}
                  onChange={() => toggleSource(source)}
                  label={source}
                />
              ))}
            </div>
          </FilterDropdown>
        )}

        {/* Recency filter */}
        <FilterDropdown
          label="Recency"
          icon={Calendar}
          isOpen={openDropdown === 'recency'}
          onToggle={() => toggleDropdown('recency')}
          activeCount={filters.recency !== 'all' ? 1 : 0}
        >
          <div className="py-1">
            {RECENCY_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setRecency(option.value)}
                className={`w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 ${
                  filters.recency === option.value ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  {filters.recency === option.value && (
                    <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    filters.recency === option.value
                      ? 'text-purple-700 dark:text-purple-300'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {option.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 ml-6">
                  {option.description}
                </p>
              </button>
            ))}
          </div>
        </FilterDropdown>

        {/* More filters dropdown */}
        <FilterDropdown
          label="More"
          icon={Filter}
          isOpen={openDropdown === 'more'}
          onToggle={() => toggleDropdown('more')}
          activeCount={
            (filters.hasCompetitorMention !== null ? 1 : 0) +
            (filters.hasSurgeDetected !== null ? 1 : 0) +
            (filters.isTimeSensitive !== null ? 1 : 0)
          }
        >
          <div className="py-1">
            <button
              onClick={() => toggleBooleanFilter('hasCompetitorMention')}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-slate-700/50"
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Competitor Mentions
                </span>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                  filters.hasCompetitorMention === true
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : filters.hasCompetitorMention === false
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400'
                }`}>
                  {filters.hasCompetitorMention === true ? 'Yes' : filters.hasCompetitorMention === false ? 'No' : 'Any'}
                </span>
              </div>
            </button>

            <button
              onClick={() => toggleBooleanFilter('hasSurgeDetected')}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-slate-700/50"
            >
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Surge Detected
                </span>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                  filters.hasSurgeDetected === true
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : filters.hasSurgeDetected === false
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400'
                }`}>
                  {filters.hasSurgeDetected === true ? 'Yes' : filters.hasSurgeDetected === false ? 'No' : 'Any'}
                </span>
              </div>
            </button>

            <button
              onClick={() => toggleBooleanFilter('isTimeSensitive')}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-slate-700/50"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Time-Sensitive
                </span>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                  filters.isTimeSensitive === true
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : filters.isTimeSensitive === false
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400'
                }`}>
                  {filters.isTimeSensitive === true ? 'Yes' : filters.isTimeSensitive === false ? 'No' : 'Any'}
                </span>
              </div>
            </button>
          </div>
        </FilterDropdown>

        {/* Sort dropdown */}
        <FilterDropdown
          label={`Sort: ${SORT_OPTIONS.find((o) => o.value === sort.option)?.label || 'Confidence'}`}
          icon={sort.direction === 'desc' ? SortDesc : SortAsc}
          isOpen={openDropdown === 'sort'}
          onToggle={() => toggleDropdown('sort')}
          activeCount={0}
        >
          <div className="py-1">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSortChange(option.value)}
                className={`w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 ${
                  sort.option === option.value ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <option.icon className={`w-4 h-4 ${
                    sort.option === option.value ? 'text-purple-600' : 'text-gray-500'
                  }`} />
                  <span className={`text-sm font-medium ${
                    sort.option === option.value
                      ? 'text-purple-700 dark:text-purple-300'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {option.label}
                  </span>
                  {sort.option === option.value && (
                    <span className="ml-auto text-xs text-purple-600 dark:text-purple-400">
                      {sort.direction === 'desc' ? '↓ High to Low' : '↑ Low to High'}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </FilterDropdown>

        {/* Clear filters button */}
        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            Clear all
          </button>
        )}
      </div>

      {/* Active filter pills */}
      {activeFilterPills.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 dark:text-gray-400">Active filters:</span>
          {activeFilterPills.map((pill) => (
            <ActiveFilterPill key={pill.key} label={pill.label} onRemove={pill.onRemove} />
          ))}
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>
          Showing {filteredCount} of {totalCount} triggers
          {activeFilterCount > 0 && ` (${activeFilterCount} filters active)`}
        </span>
      </div>
    </div>
  );
});

export default TriggerFilters;
