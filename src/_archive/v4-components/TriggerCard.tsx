/**
 * Trigger Card Component
 *
 * Displays a consolidated trigger with:
 * - Concise title for instant recognition
 * - Expandable executive summary
 * - Nested evidence accordion (max 5, "show more" if needed)
 * - UVP alignment display
 * - Selection state for content generation
 *
 * Created: 2025-11-28
 */

import React, { memo, useState } from 'react';
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
  MessageSquare
} from 'lucide-react';
import type {
  ConsolidatedTrigger,
  TriggerCategory,
  EvidenceItem,
  UVPAlignment,
  BuyerJourneyStage
} from '@/services/triggers/trigger-consolidation.service';

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
  'fear': {
    icon: AlertCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    borderColor: 'border-red-200 dark:border-red-800',
    gradient: 'from-red-500 to-rose-600'
  },
  'desire': {
    icon: Sparkles,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    borderColor: 'border-purple-200 dark:border-purple-800',
    gradient: 'from-purple-500 to-violet-600'
  },
  'pain-point': {
    icon: Heart,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    borderColor: 'border-orange-200 dark:border-orange-800',
    gradient: 'from-orange-500 to-amber-600'
  },
  'objection': {
    icon: Shield,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
    gradient: 'from-amber-500 to-yellow-600'
  },
  'motivation': {
    icon: Zap,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    borderColor: 'border-green-200 dark:border-green-800',
    gradient: 'from-green-500 to-emerald-600'
  },
  'trust': {
    icon: Award,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    gradient: 'from-blue-500 to-cyan-600'
  },
  'urgency': {
    icon: Clock,
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-100 dark:bg-rose-900/30',
    borderColor: 'border-rose-200 dark:border-rose-800',
    gradient: 'from-rose-500 to-pink-600'
  }
};

const CATEGORY_LABELS: Record<TriggerCategory, string> = {
  'fear': 'Fear',
  'desire': 'Desire',
  'pain-point': 'Pain Point',
  'objection': 'Objection',
  'motivation': 'Motivation',
  'trust': 'Trust',
  'urgency': 'Urgency'
};

// ============================================================================
// BUYER JOURNEY STAGE CONFIG
// ============================================================================

interface JourneyStageConfig {
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  bgColor: string;
  icon: string;
}

const JOURNEY_STAGE_CONFIG: Record<BuyerJourneyStage, JourneyStageConfig> = {
  'unaware': {
    label: 'Unaware',
    shortLabel: 'Unaware',
    description: 'Buyer doesn\'t know they have a problem yet',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    icon: '💭'
  },
  'problem-aware': {
    label: 'Problem Aware',
    shortLabel: 'Problem',
    description: 'Buyer knows they have a problem, exploring options',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    icon: '⚡'
  },
  'solution-aware': {
    label: 'Solution Aware',
    shortLabel: 'Solution',
    description: 'Buyer is actively comparing solutions',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    icon: '🔍'
  },
  'product-aware': {
    label: 'Product Aware',
    shortLabel: 'Product',
    description: 'Buyer knows your product, considering purchase',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    icon: '🎯'
  }
};

// ============================================================================
// PROPS
// ============================================================================

interface TriggerCardProps {
  trigger: ConsolidatedTrigger;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleSelect: () => void;
  onToggleExpand: (e: React.MouseEvent) => void;
}

// ============================================================================
// EVIDENCE ITEM COMPONENT
// ============================================================================

// Platform badge colors for visual distinction
const PLATFORM_STYLES: Record<string, { bg: string; text: string; icon?: string }> = {
  'reddit': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', icon: '🔴' },
  'g2': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', icon: '⭐' },
  'trustpilot': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', icon: '✓' },
  'linkedin': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', icon: '💼' },
  'youtube': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', icon: '▶' },
  'quora': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', icon: '❓' },
  'perplexity': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', icon: '🔍' },
  'default': { bg: 'bg-gray-100 dark:bg-slate-700', text: 'text-gray-600 dark:text-gray-400' },
};

const getPlatformStyle = (platform: string) => {
  const key = platform.toLowerCase().replace(/\s+/g, '');
  return PLATFORM_STYLES[key] || PLATFORM_STYLES['default'];
};

const EvidenceItemCard = memo(function EvidenceItemCard({
  evidence,
  index
}: {
  evidence: EvidenceItem;
  index: number;
}) {
  const sentimentColor = {
    positive: 'border-l-green-500',
    negative: 'border-l-red-500',
    neutral: 'border-l-gray-400'
  }[evidence.sentiment];

  const platformStyle = getPlatformStyle(evidence.platform);

  // Only show source label if it's meaningful (not generic placeholders)
  const genericSources = ['perplexity', 'perplexity ai', 'industry research', 'research', 'multi-source', 'ai-generated'];
  const isGenericSource = !evidence.source || genericSources.includes(evidence.source.toLowerCase());
  const hasRealUrl = evidence.url && evidence.url.startsWith('http');

  // Format source display - only show if we have a real source with URL
  const sourceDisplay = !isGenericSource && evidence.source !== evidence.platform
    ? evidence.source
    : null;

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 border-l-4 ${sentimentColor} p-3`}
    >
      <div className="flex items-start gap-3">
        <Quote className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          {/* Quote text */}
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
            "{evidence.quote}"
          </p>

          {/* Source info row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Platform badge - only show if we have a real URL or it's a known platform */}
            {(hasRealUrl || !isGenericSource) && (
              <span className={`px-2 py-0.5 text-xs rounded font-medium ${platformStyle.bg} ${platformStyle.text}`}>
                {platformStyle.icon && <span className="mr-1">{platformStyle.icon}</span>}
                {evidence.platform}
              </span>
            )}

            {/* Descriptive source - only if real URL exists */}
            {sourceDisplay && hasRealUrl && (
              <span className="text-xs text-gray-600 dark:text-gray-400 italic">
                {sourceDisplay}
              </span>
            )}

            {/* Author if available */}
            {evidence.author && (
              <span className="text-xs text-gray-500 dark:text-gray-500">
                — {evidence.author}
              </span>
            )}

            {/* URL link - REQUIRED for all evidence */}
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

            {/* Confidence on the right */}
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
// BUYER JOURNEY BADGE COMPONENT
// ============================================================================

const BuyerJourneyBadge = memo(function BuyerJourneyBadge({
  stage,
  fitScore,
  compact = false
}: {
  stage: BuyerJourneyStage;
  fitScore?: number;
  compact?: boolean;
}) {
  const config = JOURNEY_STAGE_CONFIG[stage];

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${config.bgColor} ${config.color} font-medium`}
        title={config.description}
      >
        <span>{config.icon}</span>
        <span>{config.shortLabel}</span>
      </span>
    );
  }

  return (
    <div className={`p-3 rounded-lg border ${config.bgColor} border-opacity-50`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{config.icon}</span>
        <span className={`text-sm font-semibold ${config.color}`}>
          {config.label}
        </span>
        {fitScore !== undefined && (
          <span className="ml-auto px-2 py-0.5 text-xs bg-white/50 dark:bg-slate-700/50 rounded-full text-gray-600 dark:text-gray-400">
            {Math.round(fitScore * 100)}% fit
          </span>
        )}
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400">
        {config.description}
      </p>
    </div>
  );
});

// ============================================================================
// UVP ALIGNMENT COMPONENT
// ============================================================================

const UVPAlignmentBadge = memo(function UVPAlignmentBadge({
  alignment
}: {
  alignment: UVPAlignment;
}) {
  const componentConfig: Record<string, { label: string; icon: string; color: string; bg: string }> = {
    'target_customer': {
      label: 'Target Customer',
      icon: '👤',
      color: 'text-blue-700 dark:text-blue-300',
      bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
    },
    'key_benefit': {
      label: 'Key Benefit',
      icon: '✨',
      color: 'text-green-700 dark:text-green-300',
      bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
    },
    'transformation': {
      label: 'Transformation',
      icon: '🔄',
      color: 'text-orange-700 dark:text-orange-300',
      bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
    },
    'unique_solution': {
      label: 'Product/Service',
      icon: '🎯',
      color: 'text-purple-700 dark:text-purple-300',
      bg: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
    }
  };

  const config = componentConfig[alignment.component] || {
    label: alignment.component,
    icon: '📌',
    color: 'text-gray-700 dark:text-gray-300',
    bg: 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600'
  };

  return (
    <div className={`p-3 rounded-lg border ${config.bg}`}>
      <div className="flex items-start gap-2">
        <span className="text-lg">{config.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-sm font-semibold ${config.color}`}>
              {config.label}
            </span>
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
// MAIN TRIGGER CARD COMPONENT
// ============================================================================

export const TriggerCard = memo(function TriggerCard({
  trigger,
  isSelected,
  isExpanded,
  onToggleSelect,
  onToggleExpand
}: TriggerCardProps) {
  const [showAllEvidence, setShowAllEvidence] = useState(false);
  const [evidenceExpanded, setEvidenceExpanded] = useState(false);
  const [uvpExpanded, setUvpExpanded] = useState(false);

  const config = CATEGORY_CONFIG[trigger.category];
  const Icon = config.icon;
  const categoryLabel = CATEGORY_LABELS[trigger.category];

  // Show up to 5 evidence items initially (user requested verbatim quotes)
  const displayedEvidence = showAllEvidence
    ? trigger.evidence
    : trigger.evidence.slice(0, 5);
  const hasMoreEvidence = trigger.evidence.length > 5;

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
          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg ring-2 ring-purple-500/20'
          : `border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md`
        }
      `}
    >
      {/* Header - Clickable to select */}
      <button
        onClick={onToggleSelect}
        className="w-full p-4 text-left"
      >
        {/* Top Row: Icon, Title, Badges */}
        <div className="flex items-start gap-3">
          {/* Category Icon */}
          <div className={`flex-shrink-0 w-10 h-10 ${config.bgColor} rounded-lg flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>

          <div className="flex-1 min-w-0">
            {/* Title - Full display, no truncation */}
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white pr-16">
              {trigger.title}
            </h3>

            {/* Meta Row */}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`px-2 py-0.5 text-xs rounded-full ${config.bgColor} ${config.color} font-medium`}>
                {categoryLabel}
              </span>
              {/* Buyer Journey Stage Badge */}
              {trigger.buyerJourneyStage && (
                <BuyerJourneyBadge stage={trigger.buyerJourneyStage} compact />
              )}
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {trigger.evidenceCount} source{trigger.evidenceCount !== 1 ? 's' : ''}
              </span>
              {trigger.isTimeSensitive && (
                <span className="px-2 py-0.5 text-xs bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full">
                  Time-Sensitive
                </span>
              )}
            </div>

            {/* UVP Alignment Preview - Shows which UVP components this trigger connects to */}
            {trigger.uvpAlignments.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {trigger.uvpAlignments.slice(0, 2).map((alignment, idx) => {
                  const componentLabels: Record<string, { label: string; icon: string }> = {
                    'target_customer': { label: 'Target Customer', icon: '👤' },
                    'key_benefit': { label: 'Key Benefit', icon: '✨' },
                    'transformation': { label: 'Transformation', icon: '🔄' },
                    'unique_solution': { label: 'Product/Service', icon: '🎯' }
                  };
                  const labelConfig = componentLabels[alignment.component] || { label: alignment.component, icon: '📌' };
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
          <div className={`absolute top-3 right-3 px-2.5 py-1 bg-gradient-to-r ${confidenceColor} rounded-full`}>
            <span className="text-xs font-bold text-white">
              {Math.round(trigger.confidence * 100)}%
            </span>
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
                <h4 className={`text-xs font-bold ${config.color} mb-2 uppercase tracking-wide flex items-center gap-1.5`}>
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
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${evidenceExpanded ? 'rotate-180' : ''}`} />
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
                        {displayedEvidence.map((evidence, idx) => (
                          <EvidenceItemCard key={evidence.id} evidence={evidence} index={idx} />
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
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${uvpExpanded ? 'rotate-180' : ''}`} />
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

              {/* Buyer Journey & Fit Section */}
              {(trigger.buyerJourneyStage || trigger.buyerProductFit !== undefined) && (
                <div className="rounded-lg border border-gray-200 dark:border-slate-700 p-3 space-y-3">
                  <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Buyer Intelligence
                  </h4>

                  {/* Journey Stage - Full Display */}
                  {trigger.buyerJourneyStage && (
                    <BuyerJourneyBadge
                      stage={trigger.buyerJourneyStage}
                      fitScore={trigger.buyerProductFit}
                    />
                  )}

                  {/* Buyer-Product Fit Bar (if no journey stage but has fit score) */}
                  {!trigger.buyerJourneyStage && trigger.buyerProductFit !== undefined && (
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
                        <span className={`font-medium ${
                          trigger.buyerProductFit >= 0.7
                            ? 'text-green-600 dark:text-green-400'
                            : trigger.buyerProductFit >= 0.4
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-red-600 dark:text-red-400'
                        }`}>{Math.round(trigger.buyerProductFit * 100)}%</span>
                      </div>
                    </div>
                  )}

                  {/* Fit Reasoning */}
                  {trigger.buyerProductFitReasoning && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 italic border-l-2 border-purple-300 dark:border-purple-700 pl-2">
                      {trigger.buyerProductFitReasoning}
                    </p>
                  )}
                </div>
              )}

              {/* Profile Relevance Indicator */}
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

export default TriggerCard;
