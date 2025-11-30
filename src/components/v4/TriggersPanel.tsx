/**
 * Triggers Panel
 *
 * Displays psychological triggers with expandable cards:
 * - Emotional Triggers (fear, desire, frustration)
 * - Pain Points (what's broken)
 * - Desires (what customers want to become)
 * - Objections (barriers to conversion)
 *
 * Isolated component for the Triggers tab in V4PowerModePanel.
 * Uses same InsightCard interface for seamless integration.
 *
 * Created: 2025-11-28
 */

import React, { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Flame,
  Target,
  Shield,
  Loader2,
  Quote,
  Zap,
  Brain,
  TrendingUp
} from 'lucide-react';

// ============================================================================
// TYPES - Matching V4PowerModePanel InsightCard structure exactly
// ============================================================================

type InsightType = 'triggers' | 'proof' | 'trends' | 'conversations' | 'gaps';

interface InsightSource {
  source: string;
  quote?: string;
  timestamp?: string;
  url?: string;
  author?: string;
  subreddit?: string;
  platform?: string;
}

interface InsightCard {
  id: string;
  type: InsightType;
  title: string;
  category: string;
  confidence: number;
  isTimeSensitive?: boolean;
  description: string;
  actionableInsight?: string;
  evidence?: string[];
  sources?: InsightSource[];
  rawData?: any;
  uvpAlignment?: {
    component: 'target_customer' | 'key_benefit' | 'transformation' | 'unique_solution';
    matchScore: number;
  };
  contentPillars?: string[];
  correlatedSources?: string[];
}

// ============================================================================
// PROPS
// ============================================================================

interface TriggersPanelProps {
  /** Filtered insights of type 'triggers' */
  triggers: InsightCard[];
  /** Currently selected insight IDs */
  selectedInsights: string[];
  /** Loading state */
  isLoading?: boolean;
  /** Callback when a trigger is toggled (selected/deselected) */
  onToggle: (id: string) => void;
  /** Optional: segment label for context */
  segmentLabel?: string | null;
}

// ============================================================================
// TRIGGER CATEGORY CONFIG
// ============================================================================

const TRIGGER_CATEGORIES: Record<string, {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  description: string;
}> = {
  'Emotional Trigger': {
    label: 'Emotional',
    icon: Heart,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    description: 'Feelings that drive decisions'
  },
  'Pain Point': {
    label: 'Pain Point',
    icon: AlertCircle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    description: 'Frustrations and problems'
  },
  'Desire': {
    label: 'Desire',
    icon: Sparkles,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    description: 'Aspirations and goals'
  },
  'Objection': {
    label: 'Objection',
    icon: Shield,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    description: 'Barriers to conversion'
  },
  'Fear': {
    label: 'Fear',
    icon: Flame,
    color: 'text-rose-600',
    bgColor: 'bg-rose-100 dark:bg-rose-900/30',
    description: 'What they want to avoid'
  },
  'Motivation': {
    label: 'Motivation',
    icon: Zap,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    description: 'What drives action'
  }
};

// Default fallback for unknown categories
const DEFAULT_CATEGORY = {
  label: 'Trigger',
  icon: Brain,
  color: 'text-red-600',
  bgColor: 'bg-red-100 dark:bg-red-900/30',
  description: 'Psychological hook'
};

// Source display name mapper
const SOURCE_DISPLAY_NAMES: Record<string, string> = {
  'profile': 'Industry Profile',
  'perplexity': 'Web Research',
  'uvp-correlation': 'UVP Analysis',
  'reddit': 'Reddit',
  'g2': 'G2 Reviews',
  'trustpilot': 'TrustPilot',
  'google-reviews': 'Google Reviews',
  'ai-synthesis': 'AI Analysis',
  'customer-psychology': 'Customer Psychology',
  'deep-context': 'Deep Context',
};

function getSourceDisplayName(source: string): string {
  const lower = source.toLowerCase();
  return SOURCE_DISPLAY_NAMES[lower] || SOURCE_DISPLAY_NAMES[source] || source;
}

function getCategoryConfig(category: string) {
  // Try exact match first
  if (TRIGGER_CATEGORIES[category]) {
    return TRIGGER_CATEGORIES[category];
  }
  // Try partial match
  const lowerCategory = category.toLowerCase();
  for (const [key, config] of Object.entries(TRIGGER_CATEGORIES)) {
    if (lowerCategory.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerCategory)) {
      return config;
    }
  }
  return DEFAULT_CATEGORY;
}

// ============================================================================
// TRIGGER CARD COMPONENT
// ============================================================================

interface TriggerCardProps {
  trigger: InsightCard;
  isSelected: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onExpand: (e: React.MouseEvent) => void;
}

const TriggerCard = memo(function TriggerCard({
  trigger,
  isSelected,
  isExpanded,
  onToggle,
  onExpand
}: TriggerCardProps) {
  const categoryConfig = getCategoryConfig(trigger.category);
  const Icon = categoryConfig.icon;

  const confidenceColor = trigger.confidence >= 0.8
    ? 'from-green-500 to-emerald-600'
    : trigger.confidence >= 0.6
      ? 'from-yellow-500 to-amber-600'
      : 'from-orange-500 to-red-600';

  return (
    <div
      className={`
        relative rounded-xl border-2 overflow-hidden transition-all duration-200
        ${isExpanded ? 'col-span-2' : ''}
        ${isSelected
          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 shadow-lg'
          : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-red-300 dark:hover:border-red-700 hover:shadow-md'
        }
      `}
    >
      {/* Main Card Content - Clickable to select */}
      <button
        onClick={onToggle}
        className="w-full p-4 text-left"
      >
        {/* Confidence Badge */}
        <div className={`absolute top-3 right-3 px-2 py-0.5 bg-gradient-to-r ${confidenceColor} rounded-full`}>
          <span className="text-xs font-bold text-white">
            {Math.round(trigger.confidence * 100)}%
          </span>
        </div>

        {/* Category Icon */}
        <div className={`inline-flex items-center justify-center w-8 h-8 ${categoryConfig.bgColor} rounded-lg mb-3`}>
          <Icon className={`w-4 h-4 ${categoryConfig.color}`} />
        </div>

        {/* Title */}
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white pr-12 mb-2 line-clamp-2">
          {trigger.title}
        </h4>

        {/* Category Badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2 py-0.5 text-xs rounded-full ${categoryConfig.bgColor} ${categoryConfig.color} font-medium`}>
            {categoryConfig.label}
          </span>
          {trigger.sources && trigger.sources.length > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              via {getSourceDisplayName(trigger.sources[0].source)}
            </span>
          )}
        </div>

        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute top-3 left-3 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
        )}
      </button>

      {/* Expand/Collapse Button */}
      <button
        onClick={onExpand}
        className="absolute bottom-3 right-3 p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
      >
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        )}
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-slate-700 p-4 space-y-4 bg-gray-50 dark:bg-slate-800/50">
          {/* Description / The Hook */}
          {trigger.description && (
            <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-slate-700">
              <h5 className="text-xs font-bold text-gray-900 dark:text-white mb-2 uppercase flex items-center gap-1.5">
                <Brain className="w-3 h-3" />
                The Psychology
              </h5>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {trigger.description}
              </p>
            </div>
          )}

          {/* Actionable Insight - How to Use This */}
          {trigger.actionableInsight && (
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
              <h5 className="text-xs font-bold text-red-700 dark:text-red-300 mb-2 uppercase flex items-center gap-1.5">
                <Target className="w-3 h-3" />
                How to Use This
              </h5>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {trigger.actionableInsight}
              </p>
            </div>
          )}

          {/* Evidence */}
          {trigger.evidence && trigger.evidence.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
              <h5 className="text-xs font-bold text-amber-700 dark:text-amber-300 mb-2 uppercase flex items-center gap-1.5">
                <Quote className="w-3 h-3" />
                Evidence
              </h5>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                {trigger.evidence.slice(0, 3).map((ev, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>
                    <span className="leading-relaxed">{ev}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* UVP Alignment */}
          {trigger.uvpAlignment && (
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
              <h5 className="text-xs font-bold text-purple-700 dark:text-purple-300 mb-2 uppercase flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3" />
                UVP Alignment
              </h5>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300 rounded">
                  {trigger.uvpAlignment.component.replace(/_/g, ' ')}
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {Math.round(trigger.uvpAlignment.matchScore * 100)}% match
                </span>
              </div>
            </div>
          )}

          {/* Sources */}
          {trigger.sources && trigger.sources.length > 0 && (
            <div className="pt-2 border-t border-gray-200 dark:border-slate-700">
              <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Sources:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {trigger.sources.map((src, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 rounded"
                  >
                    {getSourceDisplayName(src.source)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// ============================================================================
// MAIN TRIGGERS PANEL COMPONENT
// ============================================================================

export const TriggersPanel = memo(function TriggersPanel({
  triggers,
  selectedInsights,
  isLoading = false,
  onToggle,
  segmentLabel
}: TriggersPanelProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const handleToggleExpand = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCard(prev => prev === id ? null : id);
  }, []);

  // Group triggers by category for optional section headers
  const categoryCounts = triggers.reduce((acc, t) => {
    const cat = getCategoryConfig(t.category).label;
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-3" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading psychological triggers...</p>
      </div>
    );
  }

  if (triggers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
          <Heart className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Triggers Found
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
          Psychological triggers will appear here once we analyze your customer data.
          These are emotional hooks that drive purchase decisions.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Category Summary */}
      <div className="flex flex-wrap gap-2 mb-4 px-1">
        {Object.entries(categoryCounts).map(([cat, count]) => {
          const config = getCategoryConfig(cat);
          return (
            <div
              key={cat}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${config.bgColor}`}
            >
              <config.icon className={`w-3 h-3 ${config.color}`} />
              <span className={`text-xs font-medium ${config.color}`}>
                {cat}: {count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Segment Context */}
      {segmentLabel && (
        <div className="mb-4 px-1">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Triggers for: <span className="font-medium text-gray-700 dark:text-gray-300">{segmentLabel}</span>
          </p>
        </div>
      )}

      {/* Trigger Cards Grid */}
      <div className="grid grid-cols-2 gap-3 p-1">
        {triggers.map((trigger) => (
          <TriggerCard
            key={trigger.id}
            trigger={trigger}
            isSelected={selectedInsights.includes(trigger.id)}
            isExpanded={expandedCard === trigger.id}
            onToggle={() => onToggle(trigger.id)}
            onExpand={(e) => handleToggleExpand(trigger.id, e)}
          />
        ))}
      </div>
    </div>
  );
});

export default TriggersPanel;

// ============================================================================
// TYPE EXPORTS for parent components
// ============================================================================

export type { InsightCard, InsightType, InsightSource, TriggersPanelProps };
