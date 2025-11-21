/**
 * Intelligence Library
 *
 * Center panel showing all insights with filtering and selection
 * Users can select multiple insights to create custom campaigns/content
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Users, Lightbulb, Target, Zap, CheckSquare, Square } from 'lucide-react';
import type { DeepContext } from '@/types/synapse/deepContext.types';

export interface InsightCard {
  id: string;
  type: 'trend' | 'customer' | 'competition' | 'opportunity';
  title: string;
  description: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface IntelligenceLibraryProps {
  context: DeepContext;
  selectedInsights: string[];
  onToggleInsight: (insightId: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

type FilterType = 'all' | 'trend' | 'customer' | 'competition' | 'opportunity';

export function IntelligenceLibrary({
  context,
  selectedInsights,
  onToggleInsight,
  onSelectAll,
  onClearAll
}: IntelligenceLibraryProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

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

  // Filter insights
  const filteredInsights = useMemo(() => {
    if (activeFilter === 'all') return allInsights;
    return allInsights.filter(i => i.type === activeFilter);
  }, [allInsights, activeFilter]);

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
          {selectedInsights.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Clear selection
            </button>
          )}
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
                      {insight.confidence !== undefined && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2">
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
                        </div>
                      )}
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
