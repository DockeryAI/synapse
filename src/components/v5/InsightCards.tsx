/**
 * Insight Card Components - V5 Standalone Version
 *
 * Expandable cards for displaying different insight types matching V4 design.
 * - TriggerCard: Psychological triggers with category, confidence, buying stage
 * - ProofCard: Social proof with quality score, type badge
 * - TrendCard: Trends with lifecycle stage, first-mover indicator
 * - CompetitorCard: Competitor gaps and opportunities
 * - LocalCard: Location-based insights
 * - WeatherCard: Weather-triggered opportunities
 *
 * Created: 2025-12-01
 */

import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  Heart,
  Target,
  AlertTriangle,
  Zap,
  Shield,
  Clock,
  ThumbsUp,
  TrendingUp,
  TrendingDown,
  Star,
  Quote,
  MapPin,
  Cloud,
  Check,
  Plus,
  ExternalLink,
  Sparkles,
  MessageSquare,
  Award,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export type InsightType = 'trigger' | 'proof' | 'trend' | 'competitor' | 'local' | 'weather';

// Base insight with all optional fields to handle loose data from API
export interface BaseInsight {
  id: string;
  type: InsightType;
  text: string;
  source?: string;
  sourceUrl?: string; // URL to the original source (for clickable links)
  timestamp?: string;
  // Common scores that may be present
  confidence?: number;
  urgency?: number;
  category?: string;
}

// All insight types now extend BaseInsight with OPTIONAL type-specific fields
// This allows rendering even when API data is incomplete
export interface TriggerInsight extends BaseInsight {
  type: 'trigger';
  category?: string; // Made optional, defaults to 'motivation'
  confidence?: number; // Made optional, defaults to 50
  buyingStage?: string;
  recencyDays?: number;
  isSurge?: boolean;
  competitorMention?: string;
}

export interface ProofInsight extends BaseInsight {
  type: 'proof';
  proofType?: string; // Made optional, defaults to 'review'
  qualityScore?: number; // Made optional, defaults to 50
  value?: string;
  attribution?: string;
  verifiedCustomer?: boolean;
  recencyDays?: number;
}

export interface TrendInsight extends BaseInsight {
  type: 'trend';
  lifecycle?: string; // Made optional, defaults to 'emerging'
  primaryTrigger?: string;
  isFirstMover?: boolean;
  relevanceScore?: number; // Made optional, defaults to 50
  velocity?: number;
  sources?: string[];
  recencyDays?: number;
}

export interface CompetitorInsight extends BaseInsight {
  type: 'competitor';
  competitorName?: string; // Made optional
  gapType?: string; // Made optional
  opportunity?: string; // Made optional - will use text if missing
  sentiment?: string;
  strengthScore?: number;
}

export interface LocalInsight extends BaseInsight {
  type: 'local';
  localType?: string; // Made optional, defaults to 'event'
  timing?: string; // Made optional, defaults to 'upcoming'
  relevance?: number; // Made optional, defaults to 50
  localRelevance?: number;
  location?: string;
  date?: string;
  eventDate?: string;
}

export interface WeatherInsight extends BaseInsight {
  type: 'weather';
  weatherType?: string; // Made optional, defaults to 'forecast-alert'
  urgency?: number | string; // Can be number or string
  forecast?: string;
  temperature?: string;
  temp?: number;
}

export type Insight = TriggerInsight | ProofInsight | TrendInsight | CompetitorInsight | LocalInsight | WeatherInsight;

interface InsightCardProps {
  insight: Insight;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onUseInsight?: (insight: Insight) => void;
}

// ============================================================================
// TRIGGER CATEGORY STYLING
// ============================================================================

const triggerCategoryStyles: Record<TriggerInsight['category'], {
  color: string;
  bg: string;
  border: string;
  icon: React.ElementType;
  gradient: string;
}> = {
  fear: {
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-700/50',
    icon: AlertTriangle,
    gradient: 'from-red-500 to-rose-600'
  },
  desire: {
    color: 'text-pink-600 dark:text-pink-400',
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    border: 'border-pink-200 dark:border-pink-700/50',
    icon: Heart,
    gradient: 'from-pink-500 to-rose-500'
  },
  'pain-point': {
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-700/50',
    icon: Target,
    gradient: 'from-orange-500 to-amber-600'
  },
  objection: {
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-700/50',
    icon: Shield,
    gradient: 'from-amber-500 to-yellow-600'
  },
  motivation: {
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-700/50',
    icon: Zap,
    gradient: 'from-green-500 to-emerald-600'
  },
  trust: {
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-700/50',
    icon: ThumbsUp,
    gradient: 'from-blue-500 to-cyan-600'
  },
  urgency: {
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-700/50',
    icon: Clock,
    gradient: 'from-purple-500 to-violet-600'
  },
};

// ============================================================================
// CONFIDENCE BADGE - V4-style gradient badge
// ============================================================================

function ConfidenceBadge({ score }: { score: number }) {
  // V4-style gradient confidence badge
  const getStyle = () => {
    if (score >= 70) return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white';
    if (score >= 45) return 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white';
    return 'bg-gradient-to-r from-orange-500 to-red-600 text-white';
  };

  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${getStyle()}`}>
      {score}%
    </span>
  );
}

// ============================================================================
// RECENCY BADGE
// ============================================================================

function RecencyBadge({ days }: { days: number }) {
  const getLabel = () => {
    if (days <= 14) return { text: 'Fresh', color: 'bg-green-100 text-green-700' };
    if (days <= 30) return { text: 'Recent', color: 'bg-blue-100 text-blue-700' };
    if (days <= 60) return { text: 'Aging', color: 'bg-amber-100 text-amber-700' };
    return { text: 'Stale', color: 'bg-gray-100 text-gray-500' };
  };

  const { text, color } = getLabel();
  return (
    <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${color}`}>
      {text}
    </span>
  );
}

// ============================================================================
// TRIGGER CARD
// ============================================================================

export const TriggerCard = memo(function TriggerCard({
  insight,
  isSelected,
  onToggleSelect,
  onUseInsight,
}: InsightCardProps & { insight: TriggerInsight }) {
  const [isExpanded, setIsExpanded] = useState(false);
  // Use defaults for missing fields
  const category = (insight.category?.toLowerCase() || 'motivation') as keyof typeof triggerCategoryStyles;
  const style = triggerCategoryStyles[category] || triggerCategoryStyles.motivation;
  const IconComponent = style.icon;
  const confidence = insight.confidence ?? 50;

  return (
    <div className={`relative rounded-xl border-2 overflow-hidden transition-all duration-200 ${
      isSelected
        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg ring-2 ring-purple-500/20'
        : `border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md`
    }`}>
      {/* Selection Indicator - V4 style */}
      {isSelected && (
        <div className="absolute top-3 left-3 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center z-10">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}

      {/* Confidence Badge - V4 style top-right */}
      <div className="absolute top-3 right-3 z-10">
        <ConfidenceBadge score={confidence} />
      </div>

      {/* Card Header - V4 style */}
      <div className={`p-4 ${style.bg}`}>
        <div className="flex items-start gap-3">
          {/* Category Icon - V4 larger icon */}
          <div className={`flex-shrink-0 w-10 h-10 ${style.bg} border ${style.border} rounded-lg flex items-center justify-center`}>
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${style.gradient} flex items-center justify-center`}>
              <IconComponent className="w-5 h-5 text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pr-12">
            {/* Title */}
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
              {insight.text}
            </h3>

            {/* Meta Row - Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 text-xs rounded-full ${style.bg} ${style.color} font-medium border ${style.border}`}>
                {(insight.category || 'insight').replace('-', ' ')}
              </span>

              {/* Buying Stage */}
              {insight.buyingStage && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 capitalize">
                  {insight.buyingStage.replace('-', ' ')}
                </span>
              )}

              {insight.recencyDays !== undefined && (
                <RecencyBadge days={insight.recencyDays} />
              )}
              {insight.isSurge && (
                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 flex items-center gap-0.5">
                  <TrendingUp className="w-2.5 h-2.5" /> Surge
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expand Button - V4 style bottom-right */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute bottom-3 right-3 p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors z-10"
      >
        <ChevronRight className={`w-4 h-4 ${style.color} transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
      </button>

      {/* Expanded Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="p-3 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3">
              {/* Full Text */}
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {insight.text}
              </p>

              {/* Competitor Mention */}
              {insight.competitorMention && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">Mentions:</span>
                  <span className="px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs">
                    {insight.competitorMention}
                  </span>
                </div>
              )}

              {/* Source */}
              {insight.source && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <ExternalLink className="w-3 h-3" />
                  {insight.sourceUrl ? (
                    <a
                      href={insight.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                    >
                      {insight.source}
                    </a>
                  ) : (
                    <span>{insight.source}</span>
                  )}
                </div>
              )}

              {/* Action Button */}
              {onUseInsight && (
                <button
                  onClick={() => onUseInsight(insight)}
                  className={`w-full py-2 rounded-lg bg-gradient-to-r ${style.gradient} text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2`}
                >
                  <Plus className="w-4 h-4" />
                  Use This Trigger
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ============================================================================
// PROOF CARD
// ============================================================================

const proofTypeStyles: Record<ProofInsight['proofType'], { icon: React.ElementType; color: string }> = {
  rating: { icon: Star, color: 'text-yellow-500' },
  testimonial: { icon: Quote, color: 'text-blue-500' },
  metric: { icon: TrendingUp, color: 'text-green-500' },
  certification: { icon: Award, color: 'text-purple-500' },
  review: { icon: MessageSquare, color: 'text-cyan-500' },
  press: { icon: ExternalLink, color: 'text-pink-500' },
  award: { icon: Award, color: 'text-amber-500' },
};

export const ProofCard = memo(function ProofCard({
  insight,
  isSelected,
  onToggleSelect,
  onUseInsight,
}: InsightCardProps & { insight: ProofInsight }) {
  const [isExpanded, setIsExpanded] = useState(false);
  // Use defaults for missing fields
  const proofType = (insight.proofType || 'review') as keyof typeof proofTypeStyles;
  const typeStyle = proofTypeStyles[proofType] || proofTypeStyles.review;
  const IconComponent = typeStyle.icon;
  const qualityScore = insight.qualityScore ?? 50;

  return (
    <div className={`rounded-lg border border-green-200 dark:border-green-700/50 overflow-hidden ${isSelected ? 'ring-2 ring-purple-500' : ''}`}>
      {/* Card Header */}
      <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {/* Select Checkbox */}
            {onToggleSelect && (
              <button
                onClick={() => onToggleSelect(insight.id)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                  isSelected
                    ? 'bg-purple-600 border-purple-600 text-white'
                    : 'border-gray-300 hover:border-purple-400'
                }`}
              >
                {isSelected && <Check className="w-3 h-3" />}
              </button>
            )}

            {/* Type Icon */}
            <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center flex-shrink-0 shadow-sm">
              <IconComponent className={`w-4 h-4 ${typeStyle.color}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-semibold text-green-700 dark:text-green-400 capitalize">
                  {proofType}
                </span>
                <ConfidenceBadge score={qualityScore} />
              </div>
              <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">
                {insight.value || insight.text}
              </p>
            </div>
          </div>

          {/* Expand Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-white/50 dark:hover:bg-slate-700/50 rounded transition-colors flex-shrink-0"
          >
            <ChevronRight className={`w-4 h-4 text-green-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="p-3 border-t border-green-200 dark:border-green-700/50 bg-white dark:bg-slate-800 space-y-3">
              {/* Full Quote */}
              <blockquote className="text-sm text-gray-700 dark:text-gray-300 italic border-l-2 border-green-400 pl-3">
                "{insight.text}"
              </blockquote>

              {/* Attribution */}
              {insight.attribution && (
                <p className="text-xs text-gray-500">
                  — {insight.attribution}
                </p>
              )}

              {/* Action Button */}
              {onUseInsight && (
                <button
                  onClick={() => onUseInsight(insight)}
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Use This Proof
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ============================================================================
// TREND CARD
// ============================================================================

const lifecycleStyles: Record<TrendInsight['lifecycle'], { color: string; bg: string; icon: React.ElementType }> = {
  emerging: { color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', icon: TrendingUp },
  peak: { color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', icon: Sparkles },
  stable: { color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', icon: Target },
  declining: { color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-800', icon: TrendingDown },
};

export const TrendCard = memo(function TrendCard({
  insight,
  isSelected,
  onToggleSelect,
  onUseInsight,
}: InsightCardProps & { insight: TrendInsight }) {
  const [isExpanded, setIsExpanded] = useState(false);
  // Use defaults for missing fields
  const lifecycle = (insight.lifecycle || 'emerging') as keyof typeof lifecycleStyles;
  const lifecycleStyle = lifecycleStyles[lifecycle] || lifecycleStyles.emerging;
  const LifecycleIcon = lifecycleStyle.icon;
  const relevanceScore = insight.relevanceScore ?? 50;

  return (
    <div className={`rounded-lg border border-blue-200 dark:border-blue-700/50 overflow-hidden ${isSelected ? 'ring-2 ring-purple-500' : ''}`}>
      {/* Card Header */}
      <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {/* Select Checkbox */}
            {onToggleSelect && (
              <button
                onClick={() => onToggleSelect(insight.id)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                  isSelected
                    ? 'bg-purple-600 border-purple-600 text-white'
                    : 'border-gray-300 hover:border-purple-400'
                }`}
              >
                {isSelected && <Check className="w-3 h-3" />}
              </button>
            )}

            {/* Trend Icon */}
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${lifecycleStyle.bg} ${lifecycleStyle.color} flex items-center gap-1`}>
                  <LifecycleIcon className="w-2.5 h-2.5" />
                  {lifecycle}
                </span>
                <ConfidenceBadge score={relevanceScore} />
                {insight.isFirstMover && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    First Mover
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">
                {insight.text}
              </p>
            </div>
          </div>

          {/* Expand Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-white/50 dark:hover:bg-slate-700/50 rounded transition-colors flex-shrink-0"
          >
            <ChevronRight className={`w-4 h-4 text-blue-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="p-3 border-t border-blue-200 dark:border-blue-700/50 bg-white dark:bg-slate-800 space-y-3">
              {/* Full Text */}
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {insight.text}
              </p>

              {/* Primary Trigger */}
              {insight.primaryTrigger && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Primary Trigger:</span>
                  <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs capitalize">
                    {insight.primaryTrigger}
                  </span>
                </div>
              )}

              {/* Sources */}
              {insight.sources && insight.sources.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-500">Sources:</span>
                  {insight.sources.slice(0, 3).map((source, i) => (
                    <span key={i} className="text-xs text-gray-600 dark:text-gray-400">
                      {source}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Button */}
              {onUseInsight && (
                <button
                  onClick={() => onUseInsight(insight)}
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Use This Trend
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ============================================================================
// COMPETITOR CARD
// ============================================================================

export const CompetitorCard = memo(function CompetitorCard({
  insight,
  isSelected,
  onToggleSelect,
  onUseInsight,
}: InsightCardProps & { insight: CompetitorInsight }) {
  const [isExpanded, setIsExpanded] = useState(false);
  // Use defaults for missing fields
  const competitorName = insight.competitorName || 'Competitor';
  const gapType = insight.gapType || 'gap';
  const opportunity = insight.opportunity || insight.text;

  const sentimentColors: Record<string, string> = {
    positive: 'text-green-600 bg-green-100',
    negative: 'text-red-600 bg-red-100',
    neutral: 'text-gray-600 bg-gray-100',
  };
  const sentimentColor = sentimentColors[insight.sentiment || 'neutral'] || sentimentColors.neutral;

  return (
    <div className={`rounded-lg border border-orange-200 dark:border-orange-700/50 overflow-hidden ${isSelected ? 'ring-2 ring-purple-500' : ''}`}>
      {/* Card Header */}
      <div className="p-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {/* Select Checkbox */}
            {onToggleSelect && (
              <button
                onClick={() => onToggleSelect(insight.id)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                  isSelected
                    ? 'bg-purple-600 border-purple-600 text-white'
                    : 'border-gray-300 hover:border-purple-400'
                }`}
              >
                {isSelected && <Check className="w-3 h-3" />}
              </button>
            )}

            {/* Competitor Icon */}
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center flex-shrink-0">
              <Target className="w-4 h-4 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-semibold text-orange-700 dark:text-orange-400">
                  {competitorName}
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 capitalize">
                  {gapType}
                </span>
                {insight.sentiment && (
                  <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${sentimentColor}`}>
                    {insight.sentiment}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">
                {opportunity}
              </p>
            </div>
          </div>

          {/* Expand Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-white/50 dark:hover:bg-slate-700/50 rounded transition-colors flex-shrink-0"
          >
            <ChevronRight className={`w-4 h-4 text-orange-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="p-3 border-t border-orange-200 dark:border-orange-700/50 bg-white dark:bg-slate-800 space-y-3">
              {/* Full Text */}
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {insight.text}
              </p>

              {/* Opportunity */}
              <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                <p className="text-xs font-medium text-orange-800 dark:text-orange-200">
                  Opportunity: {opportunity}
                </p>
              </div>

              {/* Action Button */}
              {onUseInsight && (
                <button
                  onClick={() => onUseInsight(insight)}
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600 text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Use This Gap
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ============================================================================
// LOCAL CARD
// ============================================================================

const localTypeEmojis: Record<LocalInsight['localType'], string> = {
  event: '📅',
  news: '📰',
  community: '🏘️',
  school: '🎓',
  sports: '⚽',
  charity: '💝',
};

export const LocalCard = memo(function LocalCard({
  insight,
  isSelected,
  onToggleSelect,
  onUseInsight,
}: InsightCardProps & { insight: LocalInsight }) {
  const [isExpanded, setIsExpanded] = useState(false);
  // Use defaults for missing fields
  const localType = (insight.localType || 'event') as keyof typeof localTypeEmojis;
  const timing = insight.timing || 'upcoming';
  const relevance = insight.relevance ?? 50;

  const timingStyles: Record<string, string> = {
    upcoming: 'bg-green-100 text-green-700',
    ongoing: 'bg-blue-100 text-blue-700',
    past: 'bg-gray-100 text-gray-500',
  };
  const timingStyle = timingStyles[timing] || timingStyles.upcoming;

  return (
    <div className={`rounded-lg border border-cyan-200 dark:border-cyan-700/50 overflow-hidden ${isSelected ? 'ring-2 ring-purple-500' : ''}`}>
      {/* Card Header */}
      <div className="p-3 bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {/* Select Checkbox */}
            {onToggleSelect && (
              <button
                onClick={() => onToggleSelect(insight.id)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                  isSelected
                    ? 'bg-purple-600 border-purple-600 text-white'
                    : 'border-gray-300 hover:border-purple-400'
                }`}
              >
                {isSelected && <Check className="w-3 h-3" />}
              </button>
            )}

            {/* Type Emoji */}
            <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center flex-shrink-0 shadow-sm text-lg">
              {localTypeEmojis[localType] || '📍'}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-400 capitalize">
                  {localType}
                </span>
                <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${timingStyle}`}>
                  {timing}
                </span>
                <ConfidenceBadge score={relevance} />
              </div>
              <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">
                {insight.text}
              </p>
            </div>
          </div>

          {/* Expand Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-white/50 dark:hover:bg-slate-700/50 rounded transition-colors flex-shrink-0"
          >
            <ChevronRight className={`w-4 h-4 text-cyan-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="p-3 border-t border-cyan-200 dark:border-cyan-700/50 bg-white dark:bg-slate-800 space-y-3">
              {/* Full Text */}
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {insight.text}
              </p>

              {/* Location & Date */}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                {insight.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {insight.location}
                  </span>
                )}
                {insight.date && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {insight.date}
                  </span>
                )}
              </div>

              {/* Action Button */}
              {onUseInsight && (
                <button
                  onClick={() => onUseInsight(insight)}
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-600 text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Use This Local Insight
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ============================================================================
// WEATHER CARD
// ============================================================================

const weatherTypeIcons: Record<WeatherInsight['weatherType'], string> = {
  'heat-wave': '🔥',
  'cold-snap': '❄️',
  'storm': '⛈️',
  'precipitation': '🌧️',
  'seasonal': '🍂',
  'forecast-alert': '⚠️',
};

export const WeatherCard = memo(function WeatherCard({
  insight,
  isSelected,
  onToggleSelect,
  onUseInsight,
}: InsightCardProps & { insight: WeatherInsight }) {
  const [isExpanded, setIsExpanded] = useState(false);
  // Use defaults for missing fields
  const weatherType = (insight.weatherType || 'forecast-alert') as keyof typeof weatherTypeIcons;
  // Handle urgency as number or string
  const urgencyValue = typeof insight.urgency === 'number'
    ? (insight.urgency >= 80 ? 'critical' : insight.urgency >= 60 ? 'high' : insight.urgency >= 40 ? 'medium' : 'low')
    : (insight.urgency || 'medium');

  const urgencyStyles: Record<string, string> = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-gray-100 text-gray-600',
  };
  const urgencyStyle = urgencyStyles[urgencyValue] || urgencyStyles.medium;

  return (
    <div className={`rounded-lg border border-sky-200 dark:border-sky-700/50 overflow-hidden ${isSelected ? 'ring-2 ring-purple-500' : ''}`}>
      {/* Card Header */}
      <div className="p-3 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {/* Select Checkbox */}
            {onToggleSelect && (
              <button
                onClick={() => onToggleSelect(insight.id)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                  isSelected
                    ? 'bg-purple-600 border-purple-600 text-white'
                    : 'border-gray-300 hover:border-purple-400'
                }`}
              >
                {isSelected && <Check className="w-3 h-3" />}
              </button>
            )}

            {/* Weather Icon */}
            <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center flex-shrink-0 shadow-sm text-lg">
              {weatherTypeIcons[weatherType] || '🌤️'}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-semibold text-sky-700 dark:text-sky-400 capitalize">
                  {weatherType.replace('-', ' ')}
                </span>
                <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${urgencyStyle}`}>
                  {urgencyValue}
                </span>
              </div>
              <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">
                {insight.text}
              </p>
            </div>
          </div>

          {/* Expand Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-white/50 dark:hover:bg-slate-700/50 rounded transition-colors flex-shrink-0"
          >
            <ChevronRight className={`w-4 h-4 text-sky-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="p-3 border-t border-sky-200 dark:border-sky-700/50 bg-white dark:bg-slate-800 space-y-3">
              {/* Full Text */}
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {insight.text}
              </p>

              {/* Weather Details */}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                {insight.temperature && (
                  <span className="flex items-center gap-1">
                    <Cloud className="w-3 h-3" />
                    {insight.temperature}
                  </span>
                )}
                {insight.forecast && (
                  <span>{insight.forecast}</span>
                )}
              </div>

              {/* Action Button */}
              {onUseInsight && (
                <button
                  onClick={() => onUseInsight(insight)}
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Use This Weather Opportunity
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ============================================================================
// GENERIC INSIGHT CARD (Routes to specific card type)
// ============================================================================

export const InsightCard = memo(function InsightCard(props: InsightCardProps) {
  const { insight } = props;

  switch (insight.type) {
    case 'trigger':
      return <TriggerCard {...props} insight={insight as TriggerInsight} />;
    case 'proof':
      return <ProofCard {...props} insight={insight as ProofInsight} />;
    case 'trend':
      return <TrendCard {...props} insight={insight as TrendInsight} />;
    case 'competitor':
      return <CompetitorCard {...props} insight={insight as CompetitorInsight} />;
    case 'local':
      return <LocalCard {...props} insight={insight as LocalInsight} />;
    case 'weather':
      return <WeatherCard {...props} insight={insight as WeatherInsight} />;
    default:
      return null;
  }
});

export default InsightCard;
