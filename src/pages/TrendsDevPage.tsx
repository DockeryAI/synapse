/**
 * Trends Dev Page - Trends 2.0 Implementation
 *
 * Full Trends 2.0 pipeline with:
 * - UVP-informed query generation
 * - Category-aware API routing
 * - Multi-source validation (2+ sources required)
 * - Brand relevance scoring
 * - EQ-weighted prioritization
 * - Lifecycle detection (emerging/peak/stable/declining)
 * - Triggers integration with content angle generation
 *
 * Created: 2025-11-29
 * Updated: 2025-11-29 - Full Trends 2.0 implementation
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UVPBuildingBlocks } from '@/components/v4/V4PowerModePanel';
import { useBrand } from '@/hooks/useBrand';
import { getUVPByBrand } from '@/services/database/marba-uvp.service';
import { useStreamingTrends } from '@/hooks/useStreamingTrends';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2,
  Sparkles,
  Trash2,
  Target,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Heart,
  Award,
  BarChart3,
  Package,
  Building2,
  Download,
  ExternalLink,
  Calendar,
  Globe,
  Youtube,
  MessageSquare,
  Newspaper,
  Search,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Flame,
  TrendingDown,
  RefreshCcw,
  Brain,
  Users,
  Shield,
  Lightbulb,
  ArrowRight,
  Link as LinkIcon
} from 'lucide-react';
import type { CompleteUVP } from '@/types/uvp-flow.types';
import type { TrendWithMatches } from '@/services/trends/triggers-trend-matcher.service';
import type { LifecycleStage } from '@/services/trends/trend-lifecycle-detector.service';
import type { PsychologicalTrigger } from '@/services/trends/eq-trend-prioritizer.service';
import { CATEGORY_CONFIGS, type BusinessCategory } from '@/services/trends/trend-category-router.service';
import { TrendContentGenerator, type GeneratedTrendContent } from '@/services/trends/trend-content-generator.service';

// ============================================================================
// FILTER TYPES
// ============================================================================

// Phase 9: Simplified main filters - removed Multi-Source and Emerging (now in Type filter)
type MainFilter = 'all' | 'content_ready';
type LifecycleFilter = 'all' | LifecycleStage;
type TriggerFilter = 'all' | PsychologicalTrigger;
// Phase 10: Added use_case, outcome, persona for diversified trend filtering
type IntentFilter = 'all' | 'product' | 'industry' | 'pain_point' | 'use_case' | 'outcome' | 'persona';

const MAIN_FILTER_CONFIG: Record<MainFilter, { label: string; icon: React.ElementType; color: string }> = {
  all: { label: 'All Trends', icon: BarChart3, color: 'purple' },
  content_ready: { label: 'Suggested', icon: CheckCircle2, color: 'green' }
};

const INTENT_FILTER_CONFIG: Record<IntentFilter, { label: string; icon: React.ElementType; color: string }> = {
  all: { label: 'All Types', icon: BarChart3, color: 'gray' },
  use_case: { label: 'Use Cases', icon: Target, color: 'purple' },  // Phase 10
  product: { label: 'Product', icon: Package, color: 'green' },
  industry: { label: 'Industry', icon: Building2, color: 'blue' },
  outcome: { label: 'Outcomes', icon: TrendingUp, color: 'emerald' },  // Phase 10
  persona: { label: 'Persona', icon: Users, color: 'pink' },  // Phase 10
  pain_point: { label: 'Pain Points', icon: AlertTriangle, color: 'orange' }
};

const LIFECYCLE_ICONS: Record<LifecycleStage, React.ElementType> = {
  emerging: Flame,
  peak: TrendingUp,
  stable: RefreshCcw,
  declining: TrendingDown
};

const TRIGGER_ICONS: Record<PsychologicalTrigger, React.ElementType> = {
  fear: AlertTriangle,
  desire: Heart,
  trust: Shield,
  urgency: Clock,
  curiosity: Lightbulb,
  social: Users,
  practical: Target
};

// ============================================================================
// TREND CARD COMPONENT - Expandable with Exec Summary, UVP Correlation, Sources
// ============================================================================

interface TrendCard2Props {
  trend: TrendWithMatches;
  isSelected: boolean;
  isExpanded: boolean;
  isGenerating?: boolean;
  onToggle: () => void;
  onToggleExpand: () => void;
  onGenerateContent: () => void;
}

// Using forwardRef for AnimatePresence popLayout compatibility
const TrendCard2 = React.forwardRef<HTMLDivElement, TrendCard2Props>(function TrendCard2(
  { trend, isSelected, isExpanded, isGenerating, onToggle, onToggleExpand, onGenerateContent },
  ref
) {
  const [sourcesExpanded, setSourcesExpanded] = useState(false);
  const [uvpExpanded, setUvpExpanded] = useState(false);
  const LifecycleIcon = LIFECYCLE_ICONS[trend.lifecycle.stage];
  const TriggerIcon = TRIGGER_ICONS[trend.primaryTrigger];

  // Build UVP correlation data
  const uvpCorrelations = useMemo(() => {
    const correlations: { component: string; icon: string; color: string; reason: string; score: number }[] = [];

    // Get matched keywords for display
    const matchedKws = trend.relevance.matchedKeywords || [];

    // Check relevance breakdown (dimensions)
    if (trend.relevance.breakdown) {
      const dims = trend.relevance.breakdown;
      if (dims.industry > 0) {
        correlations.push({
          component: 'Industry',
          icon: '🏢',
          color: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300',
          reason: matchedKws.length > 0 ? `Matched: ${matchedKws.slice(0, 3).join(', ')}` : 'Matches your industry',
          score: dims.industry
        });
      }
      if (dims.painPoints > 0) {
        correlations.push({
          component: 'Pain Points',
          icon: '😣',
          color: 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-300',
          reason: matchedKws.length > 0 ? `Matched: ${matchedKws.slice(0, 3).join(', ')}` : 'Addresses pain points',
          score: dims.painPoints
        });
      }
      if (dims.differentiators > 0) {
        correlations.push({
          component: 'Differentiators',
          icon: '⭐',
          color: 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-300',
          reason: matchedKws.length > 0 ? `Matched: ${matchedKws.slice(0, 3).join(', ')}` : 'Relates to your differentiators',
          score: dims.differentiators
        });
      }
      if (dims.products > 0) {
        correlations.push({
          component: 'Products/Services',
          icon: '📦',
          color: 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300',
          reason: matchedKws.length > 0 ? `Matched: ${matchedKws.slice(0, 3).join(', ')}` : 'Connected to your products',
          score: dims.products
        });
      }
      if (dims.customerDescriptors > 0) {
        correlations.push({
          component: 'Target Customer',
          icon: '👤',
          color: 'bg-pink-50 border-pink-200 text-pink-700 dark:bg-pink-900/30 dark:border-pink-700 dark:text-pink-300',
          reason: matchedKws.length > 0 ? `Matched: ${matchedKws.slice(0, 3).join(', ')}` : 'Relevant to your target customer',
          score: dims.customerDescriptors
        });
      }
      if (dims.emotionalDrivers > 0) {
        correlations.push({
          component: 'Emotional Drivers',
          icon: '❤️',
          color: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300',
          reason: matchedKws.length > 0 ? `Matched: ${matchedKws.slice(0, 3).join(', ')}` : 'Connects with emotional drivers',
          score: dims.emotionalDrivers
        });
      }
    }

    return correlations.filter(c => c.score > 0).sort((a, b) => b.score - a.score);
  }, [trend.relevance.breakdown, trend.relevance.matchedKeywords]);

  // Generate opportunity statement
  const opportunityStatement = useMemo(() => {
    const triggerLabel = trend.primaryTrigger.charAt(0).toUpperCase() + trend.primaryTrigger.slice(1);

    if (trend.lifecycle.stage === 'emerging') {
      return `Early-mover opportunity: Position your brand as a thought leader on this emerging trend. Use ${triggerLabel.toLowerCase()} messaging to connect with prospects actively exploring this space.`;
    } else if (trend.lifecycle.stage === 'peak') {
      return `High-visibility opportunity: This trend is at peak attention. Create timely content to capture traffic and establish authority during this window of maximum engagement.`;
    } else if (trend.lifecycle.stage === 'stable') {
      return `Evergreen opportunity: Build foundational content around this stable trend for long-term SEO value and consistent lead generation.`;
    } else {
      return `Strategic opportunity: Counter-position against this declining trend by highlighting your differentiated approach and superior alternative.`;
    }
  }, [trend.lifecycle.stage, trend.primaryTrigger]);

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`rounded-xl border-2 overflow-hidden transition-all ${
        isExpanded ? 'col-span-full' : ''
      } ${
        isSelected
          ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-lg ring-2 ring-green-500/50'
          : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-green-300 hover:shadow-md'
      }`}
    >
      {/* Header Row */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
        <div className="flex items-center justify-between">
          {/* Left: Lifecycle + Trigger */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
              trend.lifecycle.stage === 'emerging' ? 'bg-orange-100 text-orange-700' :
              trend.lifecycle.stage === 'peak' ? 'bg-green-100 text-green-700' :
              trend.lifecycle.stage === 'stable' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              <LifecycleIcon className="w-3 h-3" />
              {trend.lifecycle.stageLabel}
              {trend.lifecycle.isFirstMover && (
                <span className="ml-1 px-1 bg-yellow-200 text-yellow-800 rounded text-[10px]">1st</span>
              )}
            </div>

            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              trend.primaryTrigger === 'fear' ? 'bg-red-100 text-red-600' :
              trend.primaryTrigger === 'desire' ? 'bg-pink-100 text-pink-600' :
              trend.primaryTrigger === 'trust' ? 'bg-blue-100 text-blue-600' :
              trend.primaryTrigger === 'urgency' ? 'bg-orange-100 text-orange-600' :
              trend.primaryTrigger === 'curiosity' ? 'bg-purple-100 text-purple-600' :
              trend.primaryTrigger === 'social' ? 'bg-green-100 text-green-600' :
              'bg-gray-100 text-gray-600'
            }`}>
              <TriggerIcon className="w-3 h-3" />
              {trend.primaryTrigger}
            </div>
          </div>

          {/* Right: Expand button only */}
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
            >
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Collapsed Content - Title and Description */}
      <div className="p-4 cursor-pointer" onClick={onToggle}>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
          {trend.title}
        </h4>
        {!isExpanded && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {trend.description}
          </p>
        )}
      </div>

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
              <div className={`p-4 rounded-lg border ${
                trend.lifecycle.stage === 'emerging' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' :
                trend.lifecycle.stage === 'peak' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                trend.lifecycle.stage === 'stable' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
                'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
              }`}>
                <h5 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5" />
                  Executive Summary
                </h5>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                  {trend.description}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
                  {trend.whyThisMatters}
                </p>
              </div>

              {/* Opportunity */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
                <h5 className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  Opportunity
                </h5>
                <p className="text-sm text-green-800 dark:text-green-200 leading-relaxed">
                  {opportunityStatement}
                </p>
                {trend.bestMatch && (
                  <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
                    <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">💡 Suggested Hook:</p>
                    <p className="text-sm font-medium text-green-900 dark:text-green-100 italic">
                      "{trend.bestMatch.suggestedHook}"
                    </p>
                  </div>
                )}
              </div>

              {/* UVP Correlation - Collapsible */}
              <div className="rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                <button
                  onClick={(e) => { e.stopPropagation(); setUvpExpanded(!uvpExpanded); }}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-500" />
                    UVP Correlation ({uvpCorrelations.length} matches)
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
                        {uvpCorrelations.length > 0 ? (
                          uvpCorrelations.map((corr, idx) => (
                            <div key={idx} className={`p-3 rounded-lg border ${corr.color}`}>
                              <div className="flex items-start gap-2">
                                <span className="text-lg">{corr.icon}</span>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-semibold">{corr.component}</span>
                                    <span className="px-2 py-0.5 text-xs bg-white/70 dark:bg-slate-700 rounded-full">
                                      {corr.score}% match
                                    </span>
                                  </div>
                                  <p className="text-sm opacity-90">{corr.reason}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                            No strong UVP correlations detected. Consider reviewing if this trend is relevant to your brand.
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Sources - Collapsible */}
              <div className="rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                <button
                  onClick={(e) => { e.stopPropagation(); setSourcesExpanded(!sourcesExpanded); }}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-blue-500" />
                    Sources ({trend.sources.length})
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${sourcesExpanded ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {sourcesExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 space-y-2 bg-gray-50 dark:bg-slate-800/30">
                        {trend.sources.map((source, idx) => (
                          <div key={idx} className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                            <div className="flex items-start gap-3">
                              <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                source.source === 'serper' ? 'bg-green-100 text-green-600' :
                                source.source === 'youtube' ? 'bg-red-100 text-red-600' :
                                source.source === 'reddit' ? 'bg-orange-100 text-orange-600' :
                                source.source === 'perplexity' ? 'bg-purple-100 text-purple-600' :
                                source.source === 'news' ? 'bg-blue-100 text-blue-600' :
                                source.source === 'linkedin' ? 'bg-sky-100 text-sky-600' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {source.source === 'youtube' ? <Youtube className="w-4 h-4" /> :
                                 source.source === 'reddit' ? <MessageSquare className="w-4 h-4" /> :
                                 source.source === 'serper' ? <Search className="w-4 h-4" /> :
                                 source.source === 'perplexity' ? <Brain className="w-4 h-4" /> :
                                 <Newspaper className="w-4 h-4" />}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-medium text-gray-500 uppercase">{source.source}</span>
                                  {(source as { contribution?: number }).contribution && (
                                    <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-slate-700 rounded">
                                      {Math.round((source as { contribution?: number }).contribution! * 100)}% contribution
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                                  {source.title || trend.title}
                                </p>
                                {source.url && (
                                  <a
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-1"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    View Source
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                {trend.isContentReady && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onGenerateContent(); }}
                    disabled={isGenerating}
                    className={`flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg shadow-sm ${
                      isGenerating
                        ? 'bg-gray-400 cursor-wait'
                        : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Generate Content
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed Footer - Only shown when not expanded */}
      {!isExpanded && (
        <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-700 bg-gray-50/30 dark:bg-slate-800/30">
          <div className="flex items-center justify-between">
            {/* Sources preview */}
            <div className="flex items-center gap-1">
              {trend.sources.slice(0, 3).map((source, idx) => (
                <span
                  key={idx}
                  className={`w-6 h-6 rounded flex items-center justify-center text-xs ${
                    source.source === 'serper' ? 'bg-green-100 text-green-600' :
                    source.source === 'youtube' ? 'bg-red-100 text-red-600' :
                    source.source === 'reddit' ? 'bg-orange-100 text-orange-600' :
                    source.source === 'perplexity' ? 'bg-purple-100 text-purple-600' :
                    'bg-blue-100 text-blue-600'
                  }`}
                  title={source.source}
                >
                  {source.source === 'youtube' ? <Youtube className="w-3 h-3" /> :
                   source.source === 'reddit' ? <MessageSquare className="w-3 h-3" /> :
                   source.source === 'serper' ? <Search className="w-3 h-3" /> :
                   source.source === 'perplexity' ? <Brain className="w-3 h-3" /> :
                   <Newspaper className="w-3 h-3" />}
                </span>
              ))}
              {trend.sources.length > 3 && (
                <span className="text-xs text-gray-500">+{trend.sources.length - 3}</span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {trend.isContentReady && (
                <button
                  onClick={(e) => { e.stopPropagation(); onGenerateContent(); }}
                  disabled={isGenerating}
                  className={`flex items-center gap-1 px-3 py-1.5 text-white text-xs font-medium rounded-lg shadow-sm ${
                    isGenerating
                      ? 'bg-gray-400 cursor-wait'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-3 h-3" />
                      Generate
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
});

// ============================================================================
// STATS PANEL COMPONENT
// ============================================================================

interface StatsPanelProps {
  stats: ReturnType<typeof useStreamingTrends>['result'] extends { stats: infer S } ? S : never;
  category: BusinessCategory;
  apisUsed?: string[];
}

function StatsPanel({ stats, category, apisUsed = [] }: StatsPanelProps) {
  if (!stats) return null;

  const categoryConfig = CATEGORY_CONFIGS[category];

  // API source icons/colors
  const API_DISPLAY: Record<string, { label: string; color: string }> = {
    serper_search: { label: 'Search', color: 'bg-green-100 text-green-700' },
    serper_news: { label: 'News', color: 'bg-blue-100 text-blue-700' },
    serper_autocomplete: { label: 'Related', color: 'bg-cyan-100 text-cyan-700' },
    serper_places: { label: 'Places', color: 'bg-amber-100 text-amber-700' },
    serper_shopping: { label: 'Shopping', color: 'bg-pink-100 text-pink-700' },
    serper_trends: { label: 'Trends', color: 'bg-indigo-100 text-indigo-700' },
    youtube: { label: 'YouTube', color: 'bg-red-100 text-red-700' },
    reddit: { label: 'Reddit', color: 'bg-orange-100 text-orange-700' },
    perplexity: { label: 'AI', color: 'bg-purple-100 text-purple-700' },
    weather: { label: 'Weather', color: 'bg-sky-100 text-sky-700' },
    linkedin_search: { label: 'LinkedIn', color: 'bg-blue-100 text-blue-700' },
    semrush: { label: 'SEO', color: 'bg-emerald-100 text-emerald-700' },
    mock: { label: 'Mock', color: 'bg-gray-100 text-gray-700' }
  };

  return (
    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Pipeline Stats</h3>

      {/* Category */}
      <div className="mb-4 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
        <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Detected Category</p>
        <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">{categoryConfig.label}</p>
      </div>

      {/* APIs Used */}
      {apisUsed.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-500 mb-2">APIs Called ({apisUsed.length})</p>
          <div className="flex flex-wrap gap-1">
            {apisUsed.map((api) => {
              const display = API_DISPLAY[api] || { label: api, color: 'bg-gray-100 text-gray-700' };
              return (
                <span
                  key={api}
                  className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${display.color}`}
                >
                  {display.label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Funnel */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Raw Fetched</span>
          <span className="font-medium">{stats.rawCount}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Multi-Source Validated</span>
          <span className="font-medium text-blue-600">{stats.validatedCount}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Brand Relevant</span>
          <span className="font-medium text-green-600">{stats.relevantCount}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Content Ready</span>
          <span className="font-medium text-emerald-600">{stats.contentReadyCount}</span>
        </div>
      </div>

      {/* Lifecycle Breakdown */}
      <div className="mb-4">
        <p className="text-xs font-medium text-gray-500 mb-2">Lifecycle</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(stats.lifecycleBreakdown).map(([stage, count]) => {
            const Icon = LIFECYCLE_ICONS[stage as LifecycleStage];
            return (
              <div key={stage} className="flex items-center gap-1.5 text-xs">
                <Icon className="w-3 h-3 text-gray-400" />
                <span className="text-gray-600 capitalize">{stage}</span>
                <span className="font-medium ml-auto">{count as number}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scores */}
      <div className="pt-3 border-t border-gray-100 dark:border-slate-700">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-500">Avg Relevance</span>
          <span className="font-medium">{stats.avgRelevance}%</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Avg Validation</span>
          <span className="font-medium">{stats.avgValidation}%</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TrendsDevPage() {
  const { currentBrand } = useBrand();
  const [uvp, setUvp] = useState<CompleteUVP | null>(null);
  const [uvpLoading, setUvpLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedTrends, setSelectedTrends] = useState<string[]>([]);

  // Content generation state
  const [generatingContent, setGeneratingContent] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedTrendContent | null>(null);
  const [showContentModal, setShowContentModal] = useState(false);

  // Expanded trends tracking
  const [expandedTrends, setExpandedTrends] = useState<Set<string>>(new Set());

  // Filters
  const [mainFilter, setMainFilter] = useState<MainFilter>('all');
  const [lifecycleFilter, setLifecycleFilter] = useState<LifecycleFilter>('all');
  const [intentFilter, setIntentFilter] = useState<IntentFilter>('all');

  // Use Trends 2.0 hook
  const {
    state,
    result,
    hasCachedData,
    executePipeline,
    clearCache,
    isLoading,
    isComplete,
    hasError
  } = useStreamingTrends(); // Real API calls

  // Load UVP from database
  useEffect(() => {
    async function loadUVP() {
      if (!currentBrand?.id) {
        setUvpLoading(false);
        return;
      }

      try {
        const uvpData = await getUVPByBrand(currentBrand.id);
        if (uvpData) {
          setUvp(uvpData);
          console.log('[TrendsDevPage] Loaded UVP from database:', {
            id: uvpData.id,
            hasProducts: !!uvpData.productsServices?.categories?.length,
            categories: uvpData.productsServices?.categories?.map(c => c.name) || [],
            targetCustomerIndustry: uvpData.targetCustomer?.industry,
            uniqueSolutionStatement: uvpData.uniqueSolution?.statement?.substring(0, 100)
          });
        }
      } catch (err) {
        console.error('[TrendsDevPage] Failed to load UVP:', err);
      } finally {
        setUvpLoading(false);
      }
    }

    loadUVP();
  }, [currentBrand?.id]);

  // Derived state
  const brandName = currentBrand?.name || 'Brand';

  // Filter trends
  const filteredTrends = React.useMemo(() => {
    if (!result?.trends) return [];

    let filtered = [...result.trends];

    // Main filter
    if (mainFilter === 'content_ready') {
      filtered = filtered.filter(t => t.isContentReady);
    }

    // Phase 9: Removed lifecycle filter (stage filters removed from UI)

    // Intent filter (Phase 10: Expanded to include use_case, outcome, persona)
    if (intentFilter !== 'all') {
      if (intentFilter === 'industry') {
        // Industry includes both 'industry' and 'trend' queryIntent
        filtered = filtered.filter(t => t.queryIntent === 'industry' || t.queryIntent === 'trend');
      } else {
        filtered = filtered.filter(t => t.queryIntent === intentFilter);
      }
    }

    return filtered;
  }, [result, mainFilter, intentFilter]);

  // Get intent counts for filter badges (Phase 10: Added use_case, outcome, persona)
  const intentCounts = React.useMemo(() => {
    if (!result?.trends) return { all: 0, product: 0, industry: 0, pain_point: 0, use_case: 0, outcome: 0, persona: 0 };

    return {
      all: result.trends.length,
      use_case: result.trends.filter(t => t.queryIntent === 'use_case').length,
      product: result.trends.filter(t => t.queryIntent === 'product').length,
      industry: result.trends.filter(t => t.queryIntent === 'industry' || t.queryIntent === 'trend').length, // Include 'trend' as industry
      outcome: result.trends.filter(t => t.queryIntent === 'outcome').length,
      persona: result.trends.filter(t => t.queryIntent === 'persona').length,
      pain_point: result.trends.filter(t => t.queryIntent === 'pain_point').length
    };
  }, [result?.trends]);

  // Handlers
  const handleFetchTrends = useCallback(async () => {
    if (!uvp) {
      alert('No UVP data available. Please complete onboarding first.');
      return;
    }

    // Debug: Log UVP data being used for the scan
    console.log('[TrendsDevPage] Starting scan with UVP:', {
      hasProducts: !!uvp.productsServices?.categories?.length,
      productCount: uvp.productsServices?.categories?.reduce((acc, cat) => acc + cat.items.length, 0) || 0,
      hasTargetCustomer: !!uvp.targetCustomer,
      hasTransformationGoal: !!uvp.transformationGoal,
      hasUniqueSolution: !!uvp.uniqueSolution,
      hasKeyBenefit: !!uvp.keyBenefit,
      valueProposition: uvp.valuePropositionStatement?.substring(0, 100)
    });

    // Log product names for debugging
    if (uvp.productsServices?.categories) {
      const productNames: string[] = [];
      uvp.productsServices.categories.forEach(cat => {
        productNames.push(`[${cat.name}]`);
        cat.items.forEach(item => productNames.push(item.name));
      });
      console.log('[TrendsDevPage] Products in UVP:', productNames);
    }

    await executePipeline(uvp);
  }, [uvp, executePipeline]);

  const handleToggle = useCallback((id: string) => {
    setSelectedTrends(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  }, []);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedTrends(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleGenerateContent = useCallback(async (trend: TrendWithMatches) => {
    if (!uvp) {
      alert('UVP data required for content generation');
      return;
    }

    console.log('[TrendsDevPage] Generate content for:', trend.title);
    setGeneratingContent(trend.id);
    setGeneratedContent(null);

    try {
      const content = await TrendContentGenerator.generate({
        trend,
        uvp,
        platform: 'linkedin', // Default to LinkedIn
        tone: 'professional'
      });

      console.log('[TrendsDevPage] Content generated:', content);
      setGeneratedContent(content);
      setShowContentModal(true);
    } catch (err) {
      console.error('[TrendsDevPage] Content generation failed:', err);
      alert(`Content generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setGeneratingContent(null);
    }
  }, [uvp]);

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-slate-900">
      {/* Top Bar */}
      <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Title & Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  Trends 2.0
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-green-100 text-green-700 rounded">NEW</span>
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isLoading ? (
                    <span className="text-green-600">{state.statusMessage}</span>
                  ) : hasCachedData ? (
                    <span className="text-green-600">
                      {result?.trends.length} trends · {result?.stats.contentReadyCount} content-ready
                    </span>
                  ) : (
                    <span>UVP-informed trend intelligence</span>
                  )}
                </p>
              </div>
            </div>

            <div className="h-6 w-px bg-gray-200 dark:bg-slate-700" />

            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-500">Brand:</span>
              <span className="font-medium text-gray-900 dark:text-white">{brandName}</span>
              {result?.category && (
                <span className="px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-700">
                  {CATEGORY_CONFIGS[result.category].label}
                </span>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {hasCachedData && (
              <button
                onClick={clearCache}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            )}

            <button
              onClick={handleFetchTrends}
              disabled={isLoading || !uvp}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-semibold transition-all ${
                isLoading
                  ? 'bg-green-100 text-green-600 cursor-wait'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-md hover:shadow-lg disabled:opacity-50'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {state.progress}%
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Run Trends 2.0
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3"
          >
            <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${state.progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
              <span>{state.statusMessage}</span>
              <span>{state.stage}</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - UVP Building Blocks */}
        <AnimatePresence initial={false}>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0 border-r border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden"
            >
              <div className="w-[280px] h-full flex flex-col">
                <ScrollArea className="flex-1">
                  {uvp && (
                    <UVPBuildingBlocks
                      uvp={uvp}
                      deepContext={null}
                      onSelectItem={(item) => {
                        console.log('[TrendsDevPage] UVP item selected:', item);
                      }}
                    />
                  )}
                  {!uvp && uvpLoading && (
                    <div className="p-4 text-sm text-gray-500">Loading UVP data...</div>
                  )}
                  {!uvp && !uvpLoading && (
                    <div className="p-4 text-sm text-red-500">No UVP found. Complete onboarding first.</div>
                  )}
                </ScrollArea>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sidebar Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="flex-shrink-0 w-6 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center justify-center border-r border-gray-200 dark:border-slate-700"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {/* Center: Filter Tabs + Trends Grid */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Main Filter Tabs */}
          <div className="flex-shrink-0 px-4 py-3 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              {(Object.keys(MAIN_FILTER_CONFIG) as MainFilter[]).map((filter) => {
                const config = MAIN_FILTER_CONFIG[filter];
                const Icon = config.icon;
                const count = filter === 'all' ? (result?.trends.length || 0) :
                              filter === 'content_ready' ? (result?.stats.contentReadyCount || 0) : 0;

                return (
                  <button
                    key={filter}
                    onClick={() => setMainFilter(filter)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      mainFilter === filter
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-green-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {config.label}
                    <span className="text-xs opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Type Filter (Phase 9: Simplified - removed stage filters) */}
          {result?.trends && result.trends.length > 0 && (
            <div className="flex-shrink-0 px-4 py-2 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 mr-1">Filter by Type:</span>
                {(Object.keys(INTENT_FILTER_CONFIG) as IntentFilter[]).map((intent) => {
                  const config = INTENT_FILTER_CONFIG[intent];
                  const Icon = config.icon;
                  const count = intentCounts[intent];

                  return (
                    <button
                      key={intent}
                      onClick={() => setIntentFilter(intent)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                        intentFilter === intent
                          ? config.color === 'green' ? 'bg-green-600 text-white shadow-md' :
                            config.color === 'blue' ? 'bg-blue-600 text-white shadow-md' :
                            config.color === 'orange' ? 'bg-orange-600 text-white shadow-md' :
                            config.color === 'purple' ? 'bg-purple-600 text-white shadow-md' :
                            config.color === 'emerald' ? 'bg-emerald-600 text-white shadow-md' :
                            config.color === 'pink' ? 'bg-pink-600 text-white shadow-md' :
                            'bg-gray-600 text-white shadow-md'
                          : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {config.label}
                      <span className="opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-auto p-4">
            {!hasCachedData ? (
              <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-slate-800 rounded-xl">
                <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl flex items-center justify-center mb-6">
                  <TrendingUp className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Trends 2.0 Ready
                </h2>
                <p className="text-sm text-gray-500 text-center max-w-md mb-6">
                  The new UVP-informed pipeline uses your brand data to find highly relevant trends,
                  validate them across sources, and generate ready-to-use content angles.
                </p>
                <div className="flex items-center gap-4 mb-6 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Brain className="w-4 h-4" />
                    UVP-Informed Queries
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-4 h-4" />
                    Multi-Source Validation
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4" />
                    Content Ready
                  </div>
                </div>
                <button
                  onClick={handleFetchTrends}
                  disabled={!uvp}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 font-semibold flex items-center gap-2 shadow-lg shadow-green-500/25 disabled:opacity-50"
                >
                  <Sparkles className="w-5 h-5" />
                  Run Trends 2.0 Pipeline
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredTrends.map((trend) => (
                    <TrendCard2
                      key={trend.id}
                      trend={trend}
                      isSelected={selectedTrends.includes(trend.id)}
                      isExpanded={expandedTrends.has(trend.id)}
                      isGenerating={generatingContent === trend.id}
                      onToggle={() => handleToggle(trend.id)}
                      onToggleExpand={() => handleToggleExpand(trend.id)}
                      onGenerateContent={() => handleGenerateContent(trend)}
                    />
                  ))}
                </AnimatePresence>

                {filteredTrends.length === 0 && (
                  <div className="col-span-2 flex flex-col items-center justify-center py-12 bg-white dark:bg-slate-800 rounded-xl">
                    <Target className="w-12 h-12 text-gray-300 mb-4" />
                    <p className="text-gray-500">No trends match the current filters</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Stats Panel */}
        <div className="w-72 flex-shrink-0 bg-gray-50 dark:bg-slate-900 border-l border-gray-200 dark:border-slate-700 p-4 overflow-y-auto">
          {result?.stats ? (
            <StatsPanel stats={result.stats} category={result.category} apisUsed={result.apisUsed} />
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-sm text-gray-500">Run the pipeline to see stats</p>
            </div>
          )}

          {/* Selected Trends */}
          {selectedTrends.length > 0 && (
            <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Selected ({selectedTrends.length})
              </h3>
              <div className="space-y-2 mb-4">
                {selectedTrends.slice(0, 3).map((id) => {
                  const trend = result?.trends.find(t => t.id === id);
                  return (
                    <div
                      key={id}
                      className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-xs text-green-800 dark:text-green-200 truncate"
                    >
                      {trend?.title || id}
                    </div>
                  );
                })}
                {selectedTrends.length > 3 && (
                  <p className="text-xs text-gray-500">+{selectedTrends.length - 3} more</p>
                )}
              </div>
              <button className="w-full px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-medium text-sm flex items-center justify-center gap-2">
                <Zap className="w-4 h-4" />
                Generate Content
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content Generation Modal */}
      <AnimatePresence>
        {showContentModal && generatedContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowContentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-green-500 to-emerald-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Generated Content</h3>
                      <p className="text-sm text-white/80">{generatedContent.platform} • {generatedContent.contentType}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowContentModal(false)}
                    className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <ScrollArea className="max-h-[60vh]">
                <div className="p-6 space-y-4">
                  {/* Headline */}
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                    <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">Headline</p>
                    <p className="text-lg font-semibold text-green-900 dark:text-green-100">{generatedContent.headline}</p>
                  </div>

                  {/* Content */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Content</p>
                    <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-xl whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
                      {generatedContent.content}
                    </div>
                  </div>

                  {/* CTA */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Call to Action</p>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{generatedContent.callToAction}</p>
                  </div>

                  {/* Hashtags */}
                  {generatedContent.hashtags.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">Hashtags</p>
                      <div className="flex flex-wrap gap-1">
                        {generatedContent.hashtags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Source */}
                  <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                    <p className="text-xs text-gray-500">
                      Based on: {generatedContent.sourceTrend.title} • {generatedContent.sourceTrend.trigger} trigger • {generatedContent.sourceTrend.lifecycle} stage
                    </p>
                  </div>
                </div>
              </ScrollArea>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    generatedContent.estimatedEngagement === 'high' ? 'bg-green-100 text-green-700' :
                    generatedContent.estimatedEngagement === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    Est. engagement: {generatedContent.estimatedEngagement}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `${generatedContent.headline}\n\n${generatedContent.content}\n\n${generatedContent.callToAction}\n\n${generatedContent.hashtags.map(h => `#${h}`).join(' ')}`
                        );
                        alert('Content copied to clipboard!');
                      }}
                      className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 font-medium text-sm flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Copy
                    </button>
                    <button
                      onClick={() => setShowContentModal(false)}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 font-medium text-sm"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TrendsDevPage;
