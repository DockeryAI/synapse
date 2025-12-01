/**
 * Trigger Card V2 Component
 *
 * Enhanced trigger card with Triggers 3.0 features:
 * - Confidence score display with visual indicators
 * - Source attribution badges
 * - Recency indicators with freshness styling
 * - Competitor mention highlighting
 * - Buying stage classification
 * - Signal stacking indicators
 * - Surge detection badges
 *
 * Created: 2025-12-01
 */

import React, { memo, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronRight,
  Heart,
  AlertCircle,
  Sparkles,
  Shield,
  Zap,
  Clock,
  Award,
  Quote,
  ExternalLink,
  Target,
  CheckCircle2,
  MessageSquare,
  Calendar,
  TrendingUp,
  Building2,
  Layers,
  Activity,
  Users,
  DollarSign,
  ShoppingCart,
  Search,
  BarChart3,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import type {
  ConsolidatedTrigger,
  TriggerCategory,
  EvidenceItem,
  UVPAlignment,
  BuyerJourneyStage,
} from '@/services/triggers/trigger-consolidation.service';
import { recencyCalculatorService } from '@/services/triggers/recency-calculator.service';
import type { ConfidenceLevel } from '@/services/triggers/confidence-scorer.service';
import type { BuyingStage } from '@/services/triggers/buying-stage-classifier.service';
import type { SurgeSeverity } from '@/services/triggers/surge-detector.service';
import type { IntentType } from '@/services/triggers/signal-stacker.service';
import { TriggerConfidenceBadge } from './TriggerConfidenceBadge';

// ============================================================================
// CATEGORY CONFIG
// ============================================================================

interface CategoryConfig {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  gradient: string;
}

const CATEGORY_CONFIG: Record<TriggerCategory, CategoryConfig> = {
  fear: {
    icon: AlertCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    borderColor: 'border-red-200 dark:border-red-800',
    gradient: 'from-red-500 to-rose-600',
  },
  desire: {
    icon: Sparkles,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    borderColor: 'border-purple-200 dark:border-purple-800',
    gradient: 'from-purple-500 to-violet-600',
  },
  'pain-point': {
    icon: Heart,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    borderColor: 'border-orange-200 dark:border-orange-800',
    gradient: 'from-orange-500 to-amber-600',
  },
  objection: {
    icon: Shield,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
    gradient: 'from-amber-500 to-yellow-600',
  },
  motivation: {
    icon: Zap,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    borderColor: 'border-green-200 dark:border-green-800',
    gradient: 'from-green-500 to-emerald-600',
  },
  trust: {
    icon: Award,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    gradient: 'from-blue-500 to-cyan-600',
  },
  urgency: {
    icon: Clock,
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-100 dark:bg-rose-900/30',
    borderColor: 'border-rose-200 dark:border-rose-800',
    gradient: 'from-rose-500 to-pink-600',
  },
};

const CATEGORY_LABELS: Record<TriggerCategory, string> = {
  fear: 'Fear',
  desire: 'Desire',
  'pain-point': 'Pain Point',
  objection: 'Objection',
  motivation: 'Motivation',
  trust: 'Trust',
  urgency: 'Urgency',
};

// ============================================================================
// BUYING STAGE CONFIG (Enhanced with Triggers 3.0 stages)
// ============================================================================

interface BuyingStageConfig {
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  bgColor: string;
  icon: React.ElementType;
}

const BUYING_STAGE_CONFIG: Record<BuyingStage | BuyerJourneyStage, BuyingStageConfig> = {
  unaware: {
    label: 'Unaware',
    shortLabel: 'Unaware',
    description: "Buyer doesn't know they have a problem yet",
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    icon: Search,
  },
  'problem-aware': {
    label: 'Problem Aware',
    shortLabel: 'Problem',
    description: 'Buyer knows they have a problem, exploring options',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    icon: AlertCircle,
  },
  'solution-aware': {
    label: 'Solution Aware',
    shortLabel: 'Solution',
    description: 'Buyer is actively comparing solutions',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    icon: Search,
  },
  'vendor-aware': {
    label: 'Vendor Aware',
    shortLabel: 'Vendor',
    description: 'Buyer is evaluating specific vendors',
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    icon: Building2,
  },
  'product-aware': {
    label: 'Product Aware',
    shortLabel: 'Product',
    description: 'Buyer knows your product, considering purchase',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    icon: Target,
  },
  decision: {
    label: 'Decision',
    shortLabel: 'Decision',
    description: 'Buyer is ready to make a purchase decision',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    icon: ShoppingCart,
  },
  'customer-expansion': {
    label: 'Expansion',
    shortLabel: 'Expand',
    description: 'Existing customer looking to expand usage',
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
    icon: TrendingUp,
  },
  'customer-retention': {
    label: 'Retention',
    shortLabel: 'Retain',
    description: 'Customer at risk or needing engagement',
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    icon: Users,
  },
  'customer-churn-risk': {
    label: 'Churn Risk',
    shortLabel: 'Churn',
    description: 'Customer showing signs of churning',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    icon: AlertTriangle,
  },
};

// ============================================================================
// INTENT TYPE CONFIG
// ============================================================================

interface IntentConfig {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ElementType;
}

const INTENT_TYPE_CONFIG: Record<IntentType, IntentConfig> = {
  'churn-from-competitor': {
    label: 'Competitor Churn',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    icon: TrendingUp,
  },
  'active-evaluation': {
    label: 'Active Evaluation',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    icon: Search,
  },
  'pain-point-expression': {
    label: 'Pain Point',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    icon: Heart,
  },
  'feature-comparison': {
    label: 'Feature Comparison',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    icon: BarChart3,
  },
  'budget-allocation': {
    label: 'Budget Ready',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    icon: DollarSign,
  },
  'vendor-search': {
    label: 'Vendor Search',
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    icon: Building2,
  },
  'implementation-planning': {
    label: 'Implementation',
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
    icon: Layers,
  },
  'contract-renewal': {
    label: 'Contract Renewal',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    icon: Clock,
  },
  'growth-expansion': {
    label: 'Growth',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    icon: TrendingUp,
  },
  'compliance-need': {
    label: 'Compliance',
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-100 dark:bg-rose-900/30',
    icon: Shield,
  },
};

// ============================================================================
// SURGE SEVERITY CONFIG
// ============================================================================

const SURGE_SEVERITY_CONFIG: Record<
  SurgeSeverity,
  { label: string; color: string; bgColor: string }
> = {
  minor: {
    label: 'Minor Surge',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  moderate: {
    label: 'Moderate Surge',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  significant: {
    label: 'Significant Surge',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  critical: {
    label: 'Critical Surge',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
};

// ============================================================================
// RECENCY BADGE COMPONENT
// ============================================================================

interface RecencyBadgeProps {
  timestamp?: string;
  compact?: boolean;
}

const RecencyBadge = memo(function RecencyBadge({
  timestamp,
  compact = true,
}: RecencyBadgeProps) {
  const recency = useMemo(() => {
    return recencyCalculatorService.calculateRecency(timestamp);
  }, [timestamp]);

  if (recency.daysOld === -1) {
    return null;
  }

  const getRecencyStyle = () => {
    if (recency.isPeak) {
      return {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-700 dark:text-green-300',
        border: 'border-green-200 dark:border-green-800',
        icon: Flame,
      };
    } else if (recency.multiplier >= 0.7) {
      return {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800',
        icon: Calendar,
      };
    } else if (recency.multiplier >= 0.5) {
      return {
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800',
        icon: Clock,
      };
    } else {
      return {
        bg: 'bg-gray-100 dark:bg-gray-800',
        text: 'text-gray-600 dark:text-gray-400',
        border: 'border-gray-200 dark:border-gray-700',
        icon: Calendar,
      };
    }
  };

  const style = getRecencyStyle();
  const IconComponent = style.icon;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${style.bg} ${style.text} font-medium`}
        title={`${recency.ageLabel} (${Math.round(recency.multiplier * 100)}% recency score)`}
      >
        <IconComponent className="w-3 h-3" />
        <span>{recency.ageLabel}</span>
      </span>
    );
  }

  return (
    <div className={`p-2 rounded-lg border ${style.bg} ${style.border}`}>
      <div className="flex items-center gap-2">
        <IconComponent className={`w-4 h-4 ${style.text}`} />
        <div className="flex-1">
          <span className={`text-sm font-medium ${style.text}`}>{recency.ageLabel}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
            ({Math.round(recency.multiplier * 100)}% weight)
          </span>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// SOURCE BADGE COMPONENT
// ============================================================================

interface SourceBadgeProps {
  source: string;
  platform?: string;
  count?: number;
}

const SourceBadge = memo(function SourceBadge({ source, platform, count }: SourceBadgeProps) {
  const PLATFORM_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
    reddit: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', icon: '🔴' },
    g2: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', icon: '⭐' },
    capterra: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', icon: '✓' },
    trustpilot: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', icon: '✓' },
    linkedin: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', icon: '💼' },
    youtube: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', icon: '▶' },
    yelp: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-300', icon: '⭐' },
    google: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', icon: '🔍' },
    perplexity: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', icon: '🔮' },
    hackernews: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', icon: '📰' },
    default: { bg: 'bg-gray-100 dark:bg-slate-700', text: 'text-gray-600 dark:text-gray-400', icon: '📄' },
  };

  const key = (platform || source).toLowerCase().replace(/\s+/g, '');
  const style = PLATFORM_STYLES[key] || PLATFORM_STYLES['default'];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${style.bg} ${style.text} font-medium`}>
      <span>{style.icon}</span>
      <span>{platform || source}</span>
      {count && count > 1 && (
        <span className="ml-1 px-1.5 py-0.5 bg-white/50 dark:bg-black/20 rounded-full text-[10px]">
          {count}
        </span>
      )}
    </span>
  );
});

// ============================================================================
// SIGNAL STACKING INDICATOR
// ============================================================================

interface SignalStackingIndicatorProps {
  sourceCount: number;
  uniqueSources: number;
  clusterStrength?: 'weak' | 'moderate' | 'strong' | 'very-strong';
}

const SignalStackingIndicator = memo(function SignalStackingIndicator({
  sourceCount,
  uniqueSources,
  clusterStrength,
}: SignalStackingIndicatorProps) {
  const isMultiSource = uniqueSources >= 2;
  const strengthConfig = {
    weak: { color: 'text-gray-500', label: 'Weak' },
    moderate: { color: 'text-blue-500', label: 'Moderate' },
    strong: { color: 'text-green-500', label: 'Strong' },
    'very-strong': { color: 'text-emerald-500', label: 'Very Strong' },
  };

  const strength = clusterStrength ? strengthConfig[clusterStrength] : null;

  return (
    <div className="flex items-center gap-2">
      <span
        className={`text-xs flex items-center gap-1 ${
          isMultiSource ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
        }`}
        title={isMultiSource ? 'Multi-source signal (higher confidence)' : 'Single-source signal'}
      >
        <Layers className="w-3 h-3" />
        {sourceCount} source{sourceCount !== 1 ? 's' : ''}
        {isMultiSource && <TrendingUp className="w-3 h-3 ml-0.5" />}
      </span>
      {strength && (
        <span className={`text-xs ${strength.color} font-medium`}>
          {strength.label}
        </span>
      )}
    </div>
  );
});

// ============================================================================
// SURGE INDICATOR
// ============================================================================

interface SurgeIndicatorProps {
  severity: SurgeSeverity;
  percentAboveBaseline?: number;
}

const SurgeIndicator = memo(function SurgeIndicator({
  severity,
  percentAboveBaseline,
}: SurgeIndicatorProps) {
  const config = SURGE_SEVERITY_CONFIG[severity];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${config.bgColor} ${config.color} font-medium`}
      title={percentAboveBaseline ? `${percentAboveBaseline}% above baseline` : config.label}
    >
      <Activity className="w-3 h-3" />
      <span>{config.label}</span>
      {percentAboveBaseline && (
        <span className="opacity-75">+{percentAboveBaseline}%</span>
      )}
    </span>
  );
});

// ============================================================================
// COMPETITOR MENTION BADGE
// ============================================================================

interface CompetitorMentionBadgeProps {
  competitors: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
}

const CompetitorMentionBadge = memo(function CompetitorMentionBadge({
  competitors,
  sentiment = 'neutral',
}: CompetitorMentionBadgeProps) {
  if (competitors.length === 0) return null;

  const sentimentConfig = {
    positive: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
    negative: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
    neutral: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' },
  };

  const style = sentimentConfig[sentiment];
  const displayCompetitors = competitors.slice(0, 2);
  const moreCount = competitors.length - 2;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${style.bg} ${style.text} font-medium`}
      title={`Mentions: ${competitors.join(', ')}`}
    >
      <Building2 className="w-3 h-3" />
      <span>{displayCompetitors.join(', ')}</span>
      {moreCount > 0 && <span className="opacity-75">+{moreCount}</span>}
    </span>
  );
});

// ============================================================================
// EVIDENCE ITEM COMPONENT
// ============================================================================

const EvidenceItemCard = memo(function EvidenceItemCard({
  evidence,
}: {
  evidence: EvidenceItem;
}) {
  const sentimentColor = {
    positive: 'border-l-green-500',
    negative: 'border-l-red-500',
    neutral: 'border-l-gray-400',
  }[evidence.sentiment];

  const hasRealUrl = evidence.url && evidence.url.startsWith('http');

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 border-l-4 ${sentimentColor} p-3`}
    >
      <div className="flex items-start gap-3">
        <Quote className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
            "{evidence.quote}"
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            <SourceBadge source={evidence.source} platform={evidence.platform} />

            {evidence.author && (
              <span className="text-xs text-gray-500 dark:text-gray-500">
                — {evidence.author}
              </span>
            )}

            {hasRealUrl && (
              <a
                href={evidence.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3 h-3" />
                View Source
              </a>
            )}

            <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
              {Math.round(evidence.confidence > 1 ? evidence.confidence : evidence.confidence * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// BUYING STAGE BADGE COMPONENT
// ============================================================================

interface BuyStageBadgeProps {
  stage: BuyingStage | BuyerJourneyStage;
  compact?: boolean;
  conversionProbability?: number;
}

const BuyStageBadge = memo(function BuyStageBadge({
  stage,
  compact = true,
  conversionProbability,
}: BuyStageBadgeProps) {
  const config = BUYING_STAGE_CONFIG[stage];
  if (!config) return null;

  const IconComponent = config.icon;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${config.bgColor} ${config.color} font-medium`}
        title={config.description}
      >
        <IconComponent className="w-3 h-3" />
        <span>{config.shortLabel}</span>
        {conversionProbability !== undefined && (
          <span className="opacity-75">{Math.round(conversionProbability * 100)}%</span>
        )}
      </span>
    );
  }

  return (
    <div className={`p-3 rounded-lg border ${config.bgColor} border-opacity-50`}>
      <div className="flex items-center gap-2 mb-1">
        <IconComponent className={`w-5 h-5 ${config.color}`} />
        <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
        {conversionProbability !== undefined && (
          <span className="ml-auto px-2 py-0.5 text-xs bg-white/50 dark:bg-slate-700/50 rounded-full text-gray-600 dark:text-gray-400">
            {Math.round(conversionProbability * 100)}% conv.
          </span>
        )}
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400">{config.description}</p>
    </div>
  );
});

// ============================================================================
// INTENT TYPE BADGE
// ============================================================================

interface IntentBadgeProps {
  intent: IntentType;
}

const IntentBadge = memo(function IntentBadge({ intent }: IntentBadgeProps) {
  const config = INTENT_TYPE_CONFIG[intent];
  if (!config) return null;

  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${config.bgColor} ${config.color} font-medium`}
    >
      <IconComponent className="w-3 h-3" />
      <span>{config.label}</span>
    </span>
  );
});

// ============================================================================
// UVP ALIGNMENT BADGE
// ============================================================================

const UVPAlignmentBadge = memo(function UVPAlignmentBadge({
  alignment,
}: {
  alignment: UVPAlignment;
}) {
  const componentConfig: Record<string, { label: string; icon: string; color: string; bg: string }> = {
    target_customer: {
      label: 'Target Customer',
      icon: '👤',
      color: 'text-blue-700 dark:text-blue-300',
      bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    },
    key_benefit: {
      label: 'Key Benefit',
      icon: '✨',
      color: 'text-green-700 dark:text-green-300',
      bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    },
    transformation: {
      label: 'Transformation',
      icon: '🔄',
      color: 'text-orange-700 dark:text-orange-300',
      bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
    },
    unique_solution: {
      label: 'Product/Service',
      icon: '🎯',
      color: 'text-purple-700 dark:text-purple-300',
      bg: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    },
  };

  const config = componentConfig[alignment.component] || {
    label: alignment.component,
    icon: '📌',
    color: 'text-gray-700 dark:text-gray-300',
    bg: 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600',
  };

  return (
    <div className={`p-3 rounded-lg border ${config.bg}`}>
      <div className="flex items-start gap-2">
        <span className="text-lg">{config.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
            <span className="px-2 py-0.5 text-xs bg-white/50 dark:bg-slate-700/50 rounded-full text-gray-600 dark:text-gray-400">
              {Math.round(alignment.matchScore * 100)}% match
            </span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {alignment.matchReason}
          </p>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// EXTENDED TRIGGER TYPE (with Triggers 3.0 fields)
// ============================================================================

export interface TriggerCardV2Data extends Omit<ConsolidatedTrigger, 'buyerJourneyStage'> {
  buyerJourneyStage?: BuyerJourneyStage | BuyingStage;
  buyingStage?: BuyingStage;
  conversionProbability?: number;
  intentType?: IntentType;
  competitors?: string[];
  competitorSentiment?: 'positive' | 'negative' | 'neutral';
  surgeDetected?: boolean;
  surgeSeverity?: SurgeSeverity;
  surgePercentAboveBaseline?: number;
  clusterStrength?: 'weak' | 'moderate' | 'strong' | 'very-strong';
  uniqueSources?: number;
}

// ============================================================================
// PROPS
// ============================================================================

interface TriggerCardV2Props {
  trigger: TriggerCardV2Data;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleSelect: () => void;
  onToggleExpand: (e: React.MouseEvent) => void;
  showAdvancedMetrics?: boolean;
}

// ============================================================================
// MAIN TRIGGER CARD V2 COMPONENT
// ============================================================================

export const TriggerCardV2 = memo(function TriggerCardV2({
  trigger,
  isSelected,
  isExpanded,
  onToggleSelect,
  onToggleExpand,
  showAdvancedMetrics = true,
}: TriggerCardV2Props) {
  const [showAllEvidence, setShowAllEvidence] = useState(false);
  const [evidenceExpanded, setEvidenceExpanded] = useState(false);
  const [uvpExpanded, setUvpExpanded] = useState(false);

  const config = CATEGORY_CONFIG[trigger.category];
  const Icon = config.icon;
  const categoryLabel = CATEGORY_LABELS[trigger.category];

  const displayedEvidence = showAllEvidence
    ? trigger.evidence
    : trigger.evidence.slice(0, 5);
  const hasMoreEvidence = trigger.evidence.length > 5;

  const uniqueSources = trigger.uniqueSources ?? new Set(trigger.evidence?.map((e) => e.platform) || []).size;
  const stage = trigger.buyingStage || trigger.buyerJourneyStage;

  return (
    <div
      className={`
        relative rounded-xl border-2 overflow-hidden transition-all duration-200
        ${isExpanded ? 'col-span-2' : ''}
        ${
          isSelected
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg ring-2 ring-purple-500/20'
            : `border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md`
        }
      `}
    >
      {/* Header - Clickable to select */}
      <button onClick={onToggleSelect} className="w-full p-4 text-left">
        {/* Top Row: Icon, Title, Badges */}
        <div className="flex items-start gap-3">
          {/* Category Icon */}
          <div
            className={`flex-shrink-0 w-10 h-10 ${config.bgColor} rounded-lg flex items-center justify-center`}
          >
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>

          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white pr-16">
              {trigger.title}
            </h3>

            {/* Meta Row - Badges */}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span
                className={`px-2 py-0.5 text-xs rounded-full ${config.bgColor} ${config.color} font-medium`}
              >
                {categoryLabel}
              </span>

              {/* Buying Stage */}
              {stage && <BuyStageBadge stage={stage} compact conversionProbability={trigger.conversionProbability} />}

              {/* Recency */}
              {trigger.evidence?.[0]?.timestamp && (
                <RecencyBadge timestamp={trigger.evidence[0].timestamp} compact />
              )}

              {/* Intent Type */}
              {trigger.intentType && <IntentBadge intent={trigger.intentType} />}

              {/* Surge Indicator */}
              {trigger.surgeDetected && trigger.surgeSeverity && (
                <SurgeIndicator
                  severity={trigger.surgeSeverity}
                  percentAboveBaseline={trigger.surgePercentAboveBaseline}
                />
              )}

              {/* Competitor Mentions */}
              {trigger.competitors && trigger.competitors.length > 0 && (
                <CompetitorMentionBadge
                  competitors={trigger.competitors}
                  sentiment={trigger.competitorSentiment}
                />
              )}

              {/* Time-Sensitive */}
              {trigger.isTimeSensitive && (
                <span className="px-2 py-0.5 text-xs bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full">
                  Time-Sensitive
                </span>
              )}
            </div>

            {/* Signal Stacking Row */}
            {showAdvancedMetrics && (
              <div className="mt-2">
                <SignalStackingIndicator
                  sourceCount={trigger.evidenceCount}
                  uniqueSources={uniqueSources}
                  clusterStrength={trigger.clusterStrength}
                />
              </div>
            )}

            {/* UVP Alignment Preview */}
            {trigger.uvpAlignments.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {trigger.uvpAlignments.slice(0, 2).map((alignment, idx) => {
                  const componentLabels: Record<string, { label: string; icon: string }> = {
                    target_customer: { label: 'Target Customer', icon: '👤' },
                    key_benefit: { label: 'Key Benefit', icon: '✨' },
                    transformation: { label: 'Transformation', icon: '🔄' },
                    unique_solution: { label: 'Product/Service', icon: '🎯' },
                  };
                  const labelConfig = componentLabels[alignment.component] || {
                    label: alignment.component,
                    icon: '📌',
                  };
                  return (
                    <span
                      key={idx}
                      className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg border border-purple-200 dark:border-purple-800"
                      title={alignment.matchReason}
                    >
                      {labelConfig.icon} {labelConfig.label}
                    </span>
                  );
                })}
                {trigger.uvpAlignments.length > 2 && (
                  <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 rounded-lg">
                    +{trigger.uvpAlignments.length - 2} more
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Confidence Badge */}
          <div className="absolute top-3 right-3">
            <TriggerConfidenceBadge score={trigger.confidence} size="md" />
          </div>
        </div>

        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute top-3 left-3 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-3 h-3 text-white" />
          </div>
        )}
      </button>

      {/* Expand Button */}
      <button
        onClick={onToggleExpand}
        className="absolute bottom-3 right-3 p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors z-10"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        )}
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-200 dark:border-slate-700"
          >
            <div className="p-4 space-y-4">
              {/* Executive Summary */}
              <div className={`p-4 rounded-lg ${config.bgColor} border ${config.borderColor}`}>
                <h4
                  className={`text-xs font-bold ${config.color} mb-2 uppercase tracking-wide flex items-center gap-1.5`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  Executive Summary
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {trigger.executiveSummary}
                </p>
              </div>

              {/* Supporting Evidence - Collapsible */}
              <div className="rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEvidenceExpanded(!evidenceExpanded);
                  }}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Quote className="w-4 h-4 text-gray-500" />
                    Supporting Evidence ({trigger.evidenceCount})
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-500 transition-transform ${evidenceExpanded ? 'rotate-180' : ''}`}
                  />
                </button>

                <AnimatePresence>
                  {evidenceExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 space-y-2 bg-gray-50 dark:bg-slate-800/30">
                        {displayedEvidence.map((evidence) => (
                          <EvidenceItemCard key={evidence.id} evidence={evidence} />
                        ))}

                        {hasMoreEvidence && !showAllEvidence && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowAllEvidence(true);
                            }}
                            className="w-full py-2 text-sm text-purple-600 dark:text-purple-400 hover:underline"
                          >
                            Show {trigger.evidence.length - 5} more sources
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* UVP Alignment - Collapsible */}
              {trigger.uvpAlignments.length > 0 && (
                <div className="rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setUvpExpanded(!uvpExpanded);
                    }}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Target className="w-4 h-4 text-purple-500" />
                      Value Proposition Match ({trigger.uvpAlignments.length})
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-500 transition-transform ${uvpExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <AnimatePresence>
                    {uvpExpanded && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 space-y-2 bg-gray-50 dark:bg-slate-800/30">
                          {trigger.uvpAlignments.map((alignment, idx) => (
                            <UVPAlignmentBadge key={idx} alignment={alignment} />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Buying Stage & Fit Section */}
              {(stage || trigger.buyerProductFit !== undefined) && (
                <div className="rounded-lg border border-gray-200 dark:border-slate-700 p-3 space-y-3">
                  <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Buyer Intelligence
                  </h4>

                  {stage && (
                    <BuyStageBadge
                      stage={stage}
                      compact={false}
                      conversionProbability={trigger.conversionProbability}
                    />
                  )}

                  {!stage && trigger.buyerProductFit !== undefined && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">Buyer-Product Fit</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              trigger.buyerProductFit >= 0.7
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                                : trigger.buyerProductFit >= 0.4
                                  ? 'bg-gradient-to-r from-yellow-500 to-amber-600'
                                  : 'bg-gradient-to-r from-orange-500 to-red-600'
                            }`}
                            style={{ width: `${trigger.buyerProductFit * 100}%` }}
                          />
                        </div>
                        <span
                          className={`font-medium ${
                            trigger.buyerProductFit >= 0.7
                              ? 'text-green-600 dark:text-green-400'
                              : trigger.buyerProductFit >= 0.4
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {Math.round(trigger.buyerProductFit * 100)}%
                        </span>
                      </div>
                    </div>
                  )}

                  {trigger.buyerProductFitReasoning && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 italic border-l-2 border-purple-300 dark:border-purple-700 pl-2">
                      {trigger.buyerProductFitReasoning}
                    </p>
                  )}
                </div>
              )}

              {/* Profile Relevance */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-slate-700">
                <span>Profile Relevance</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
                      style={{ width: `${trigger.profileRelevance * 100}%` }}
                    />
                  </div>
                  <span>{Math.round(trigger.profileRelevance * 100)}%</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default TriggerCardV2;
