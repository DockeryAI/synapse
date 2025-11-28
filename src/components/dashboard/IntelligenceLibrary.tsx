/**
 * Intelligence Library
 *
 * Center panel showing all insights with filtering and selection
 * Users can select multiple insights to create custom campaigns/content
 * V3.2: Integrated with ContentSynthesisOrchestrator for EQ-weighted scoring
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Users, Lightbulb, Target, Zap, CheckSquare, Square, Brain, ArrowUpDown } from 'lucide-react';
import { SynthesisErrorBanner } from '@/components/synthesis/SynthesisErrorBanner';
import { analyticsService } from '@/services/analytics.service';
import type { DeepContext } from '@/types/synapse/deepContext.types';
import { useContentSynthesis } from '@/hooks/useContentSynthesis';
import type { BusinessSegment } from '@/services/intelligence/content-synthesis-orchestrator.service';

export interface InsightCard {
  id: string;
  type: 'trend' | 'customer' | 'competition' | 'opportunity';
  title: string;
  description: string;
  confidence?: number;
  metadata?: Record<string, any>;
  /** V3.2: EQ alignment score from orchestrator */
  eqAlignment?: number;
}

export interface IntelligenceLibraryProps {
  context: DeepContext;
  selectedInsights: string[];
  onToggleInsight: (insightId: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  /** V3.2: Business segment for EQ scoring */
  segment?: BusinessSegment;
  /** V3.2: Brand data for orchestrator context */
  brandData?: {
    name?: string;
    industry?: string;
    naicsCode?: string;
  };
}

type FilterType = 'all' | 'trend' | 'customer' | 'competition' | 'opportunity';

export function IntelligenceLibrary({
  context,
  selectedInsights,
  onToggleInsight,
  onSelectAll,
  onClearAll,
  segment = 'smb_local',
  brandData
}: IntelligenceLibraryProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortByEQ, setSortByEQ] = useState(false);
  const [scoredInsights, setScoredInsights] = useState<InsightCard[]>([]);

  // V3.2: Use ContentSynthesisOrchestrator for EQ-weighted scoring
  const {
    enrichedContext,
    loadContext,
    scoreInsights,
    contextError,
    retryLoadContext,
    clearErrors,
    isContextLoading,
  } = useContentSynthesis({
    brandName: brandData?.name || context?.business?.profile?.name || 'Unknown',
    industry: brandData?.industry || context?.business?.profile?.industry || 'General',
    naicsCode: brandData?.naicsCode,
    segment,
    uvpData: {
      target_customer: context?.business?.uvp?.targetCustomer,
      key_benefit: context?.business?.uvp?.keyBenefit,
      transformation: context?.business?.uvp?.desiredOutcome
    }
  });

  // Load enriched context on mount
  useEffect(() => {
    if (brandData?.name || context?.business?.profile?.name) {
      loadContext();
    }
  }, [brandData?.name, context?.business?.profile?.name, loadContext]);

  // Convert DeepContext into InsightCards
  const allInsights = useMemo(() => {
    const insights: InsightCard[] = [];

    console.log('[IntelligenceLibrary] Converting DeepContext to InsightCards:', {
      hasIndustry: !!context.industry,
      hasCustomerPsychology: !!context.customerPsychology,
      hasCompetitiveIntel: !!context.competitiveIntel,
      hasSynthesis: !!context.synthesis,
    });

    // Industry Trends
    context.industry?.trends?.forEach((trend, idx) => {
      insights.push({
        id: `trend-${idx}`,
        type: 'trend',
        title: trend.trend,
        description: `${trend.direction} trend with ${trend.impact} impact`,
        confidence: trend.strength,
        metadata: trend
      });
    });

    // Customer Psychology - Unarticulated Needs
    context.customerPsychology?.unarticulated?.forEach((need, idx) => {
      insights.push({
        id: `customer-need-${idx}`,
        type: 'customer',
        title: need.need,
        description: `Emotional driver: ${need.emotionalDriver}`,
        confidence: need.confidence,
        metadata: need
      });
    });

    // Customer Psychology - Emotional Triggers
    context.customerPsychology?.emotional?.forEach((trigger, idx) => {
      insights.push({
        id: `customer-trigger-${idx}`,
        type: 'customer',
        title: trigger.trigger,
        description: trigger.context,
        confidence: trigger.strength,
        metadata: trigger
      });
    });

    // Competitive Intelligence - Blind Spots
    context.competitiveIntel?.blindSpots?.forEach((blindspot, idx) => {
      insights.push({
        id: `competition-blindspot-${idx}`,
        type: 'competition',
        title: `Competitor Blind Spot: ${blindspot.topic}`,
        description: blindspot.reasoning,
        confidence: blindspot.opportunityScore / 100,
        metadata: blindspot
      });
    });

    // Competitive Intelligence - Market Gaps
    context.competitiveIntel?.opportunities?.forEach((gap, idx) => {
      insights.push({
        id: `opportunity-gap-${idx}`,
        type: 'opportunity',
        title: `Market Gap: ${gap.gap}`,
        description: gap.positioning,
        metadata: gap
      });
    });

    // Synthesis - Key Insights
    context.synthesis?.keyInsights?.forEach((insight, idx) => {
      insights.push({
        id: `synthesis-${idx}`,
        type: 'opportunity',
        title: `Key Insight`,
        description: insight,
        confidence: context.synthesis.confidenceLevel,
        metadata: { insight }
      });
    });

    // Hidden Patterns
    context.synthesis?.hiddenPatterns?.forEach((pattern, idx) => {
      insights.push({
        id: `pattern-${idx}`,
        type: 'opportunity',
        title: `${pattern.type.charAt(0).toUpperCase() + pattern.type.slice(1)} Pattern`,
        description: pattern.pattern,
        confidence: pattern.confidence,
        metadata: pattern
      });
    });

    console.log('[IntelligenceLibrary] Total insights extracted:', insights.length, {
      byType: {
        trend: insights.filter(i => i.type === 'trend').length,
        customer: insights.filter(i => i.type === 'customer').length,
        competition: insights.filter(i => i.type === 'competition').length,
        opportunity: insights.filter(i => i.type === 'opportunity').length,
      }
    });

    return insights;
  }, [context]);

  // V3.2: Score insights with EQ alignment when enriched context is available
  useEffect(() => {
    if (enrichedContext && allInsights.length > 0) {
      // Convert InsightCards to format expected by scoreInsights
      const insightsForScoring = allInsights.map(insight => ({
        id: insight.id,
        title: insight.title,
        hook: insight.description || '',
        body: [] as string[],
        cta: 'Learn more',
        scores: { breakthrough: (insight.confidence || 0.5) * 100 }
      }));

      // Score insights with orchestrator
      const scored = scoreInsights(insightsForScoring as any);

      // Map EQ scores back to InsightCards
      const insightsWithEQ = allInsights.map(insight => {
        const scoredInsight = scored.find(s => s.id === insight.id);
        return {
          ...insight,
          eqAlignment: scoredInsight?.eqAlignment || 50
        };
      });

      setScoredInsights(insightsWithEQ);
      console.log('[IntelligenceLibrary] V3.2: Insights scored with EQ alignment');
    } else {
      setScoredInsights(allInsights);
    }
  }, [allInsights, enrichedContext, scoreInsights]);

  // Filter and optionally sort by EQ
  const filteredInsights = useMemo(() => {
    let insights = scoredInsights.length > 0 ? scoredInsights : allInsights;

    // Apply type filter
    if (activeFilter !== 'all') {
      insights = insights.filter(i => i.type === activeFilter);
    }

    // V3.2: Sort by EQ alignment if enabled
    if (sortByEQ && enrichedContext) {
      insights = [...insights].sort((a, b) => (b.eqAlignment || 0) - (a.eqAlignment || 0));
    }

    return insights;
  }, [scoredInsights, allInsights, activeFilter, sortByEQ, enrichedContext]);

  const getTypeIcon = (type: InsightCard['type']) => {
    switch (type) {
      case 'trend':
        return <TrendingUp className="w-4 h-4" />;
      case 'customer':
        return <Users className="w-4 h-4" />;
      case 'competition':
        return <Target className="w-4 h-4" />;
      case 'opportunity':
        return <Zap className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: InsightCard['type']) => {
    switch (type) {
      case 'trend':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700';
      case 'customer':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700';
      case 'competition':
        return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700';
      case 'opportunity':
        return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-slate-800">
      {/* V3.2: Synthesis Error Banner */}
      {contextError && (
        <div className="p-3 bg-white dark:bg-slate-900">
          <SynthesisErrorBanner
            error={contextError}
            onRetry={retryLoadContext}
            onDismiss={clearErrors}
            isRetrying={isContextLoading}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Intelligence Library
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {filteredInsights.length} insights available
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* V3.2: EQ indicator and sort toggle */}
            {enrichedContext && (
              <button
                onClick={() => {
                  const newValue = !sortByEQ;
                  setSortByEQ(newValue);
                  analyticsService.trackEQSortToggle({
                    enabled: newValue,
                    component: 'IntelligenceLibrary',
                    insightCount: filteredInsights.length,
                  });
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  sortByEQ
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 hover:bg-purple-200 dark:hover:bg-purple-800/40'
                }`}
              >
                <Brain size={14} />
                <span>EQ:{enrichedContext.eqProfile.emotional_weight}%</span>
                <ArrowUpDown size={12} />
              </button>
            )}
            {selectedInsights.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Clear selection
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { key: 'all' as const, label: 'All', count: allInsights.length },
            { key: 'trend' as const, label: 'Trends', count: allInsights.filter(i => i.type === 'trend').length },
            { key: 'customer' as const, label: 'Customer', count: allInsights.filter(i => i.type === 'customer').length },
            { key: 'competition' as const, label: 'Competition', count: allInsights.filter(i => i.type === 'competition').length },
            { key: 'opportunity' as const, label: 'Opportunities', count: allInsights.filter(i => i.type === 'opportunity').length },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeFilter === key
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-slate-600 hover:border-purple-400 dark:hover:border-purple-500'
              }`}
            >
              {label} {count > 0 && `(${count})`}
            </button>
          ))}
        </div>
      </div>

      {/* Insights Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredInsights.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Lightbulb className="w-12 h-12 text-gray-400 mb-3" />
            <p className="text-gray-600 dark:text-gray-400">
              No insights available in this category
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <AnimatePresence mode="popLayout">
              {filteredInsights.map((insight, idx) => {
                const isSelected = selectedInsights.includes(insight.id);
                return (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: idx * 0.02 }}
                    onClick={() => onToggleInsight(insight.id)}
                    className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 shadow-md'
                        : `border ${getTypeColor(insight.type)} hover:shadow-md`
                    }`}
                  >
                    {/* Checkbox */}
                    <div className="absolute top-3 right-3">
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-purple-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="pr-8">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-1.5 rounded ${getTypeColor(insight.type)}`}>
                          {getTypeIcon(insight.type)}
                        </div>
                        <span className={`text-xs font-semibold uppercase tracking-wide ${getTypeColor(insight.type)}`}>
                          {insight.type}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                        {insight.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {insight.description}
                      </p>
                      {/* V3.2: Show EQ alignment if available, otherwise show confidence */}
                      <div className="mt-2 flex items-center gap-2">
                        {insight.eqAlignment !== undefined && enrichedContext && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-pink-100 dark:bg-pink-900/30 rounded-full">
                            <Brain size={10} className="text-pink-600" />
                            <span className="text-[10px] font-bold text-pink-700 dark:text-pink-300">
                              EQ:{insight.eqAlignment}
                            </span>
                          </div>
                        )}
                        {insight.confidence !== undefined && (
                          <div className="flex-1 flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-purple-600 rounded-full transition-all"
                                style={{ width: `${insight.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                              {Math.round(insight.confidence * 100)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
