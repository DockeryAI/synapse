/**
 * Insight Grid - 3x4 grid of insight cards with filters
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, TrendingUp, Target, Zap, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import type { InsightCard, InsightType } from './types';

export interface InsightGridProps {
  insights: InsightCard[];
  selectedInsights: string[];
  onToggleInsight: (insightId: string) => void;
  activeFilter: 'all' | InsightType;
  onFilterChange: (filter: 'all' | InsightType) => void;
}

const FILTERS = [
  { key: 'all' as const, label: 'All', icon: TrendingUp },
  { key: 'customer' as const, label: 'Customer', icon: Users },
  { key: 'market' as const, label: 'Market', icon: TrendingUp },
  { key: 'competition' as const, label: 'Competition', icon: Target },
  { key: 'local' as const, label: 'Local', icon: MapPin },
  { key: 'opportunity' as const, label: 'Opportunity', icon: Zap },
];

const getTypeColor = (type: InsightType) => {
  switch (type) {
    case 'customer':
      return 'from-green-500 to-emerald-500';
    case 'market':
      return 'from-blue-500 to-cyan-500';
    case 'competition':
      return 'from-orange-500 to-red-500';
    case 'local':
      return 'from-purple-500 to-pink-500';
    case 'opportunity':
      return 'from-yellow-500 to-amber-500';
  }
};

const getTypeIcon = (type: InsightType) => {
  switch (type) {
    case 'customer':
      return Users;
    case 'market':
      return TrendingUp;
    case 'competition':
      return Target;
    case 'local':
      return MapPin;
    case 'opportunity':
      return Zap;
  }
};

export function InsightGrid({
  insights,
  selectedInsights,
  onToggleInsight,
  activeFilter,
  onFilterChange,
}: InsightGridProps) {
  // Show all insights
  const visibleInsights = insights;
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCard(expandedCard === id ? null : id);
  };

  return (
    <div className="h-full bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 flex flex-col">
      {/* Header with Filters */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            Insights
          </h3>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {insights.length} insights
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {FILTERS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => onFilterChange(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeFilter === key
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {visibleInsights.map((insight, idx) => {
              const isSelected = selectedInsights.includes(insight.id);
              const isExpanded = expandedCard === insight.id;
              const Icon = getTypeIcon(insight.type);
              const gradientColor = getTypeColor(insight.type);
              const hasDetails = insight.description || insight.evidence || insight.actionableInsight;

              return (
                <motion.div
                  key={insight.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: idx * 0.02 }}
                  className={`relative rounded-lg border-2 transition-all ${
                    isExpanded ? 'col-span-3' : ''
                  } ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 shadow-md'
                      : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-sm'
                  }`}
                >
                  {/* Condensed View */}
                  <button
                    onClick={() => onToggleInsight(insight.id)}
                    className="w-full p-3 text-left"
                  >
                    {/* Confidence Badge */}
                    <div className={`absolute top-2 right-2 px-2 py-0.5 bg-gradient-to-r ${gradientColor} rounded-full`}>
                      <span className="text-xs font-bold text-white">
                        {Math.round(insight.confidence * 100)}%
                      </span>
                    </div>

                    {/* Icon */}
                    <div className={`inline-flex items-center justify-center w-6 h-6 bg-gradient-to-br ${gradientColor} rounded-lg mb-2`}>
                      <Icon className="w-3 h-3 text-white" />
                    </div>

                    {/* Title - Single concise statement */}
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white pr-8 line-clamp-2">
                      {insight.title}
                    </h4>

                    {/* Selection Indicator */}
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 left-2 w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center"
                      >
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </motion.div>
                    )}
                  </button>

                  {/* Expand Button - Always show */}
                  <button
                    onClick={(e) => toggleExpand(insight.id, e)}
                    className="absolute bottom-2 right-2 p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    )}
                  </button>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden border-t border-gray-200 dark:border-slate-700"
                      >
                        <div className="p-4 space-y-4">
                          {/* Category Badge */}
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 bg-gradient-to-r ${gradientColor} text-white text-xs font-bold rounded-full`}>
                              {insight.category}
                            </span>
                            {insight.isTimeSensitive && (
                              <span className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                                Time Sensitive
                              </span>
                            )}
                          </div>

                          {/* Customer Segments (WHO/WHAT) */}
                          {insight.customerSegments && (insight.customerSegments.who || insight.customerSegments.what) && (
                            <div className="grid grid-cols-2 gap-3">
                              {insight.customerSegments.who && insight.customerSegments.who.length > 0 && (
                                <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded-lg border border-green-200 dark:border-green-900">
                                  <h5 className="text-xs font-bold text-green-700 dark:text-green-300 mb-2 uppercase tracking-wider">
                                    Who They Are
                                  </h5>
                                  <ul className="space-y-1">
                                    {insight.customerSegments.who.map((who, i) => (
                                      <li key={i} className="flex items-start gap-2">
                                        <span className="w-1 h-1 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{who}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {insight.customerSegments.what && insight.customerSegments.what.length > 0 && (
                                <div className="bg-purple-50 dark:bg-purple-900/10 p-3 rounded-lg border border-purple-200 dark:border-purple-900">
                                  <h5 className="text-xs font-bold text-purple-700 dark:text-purple-300 mb-2 uppercase tracking-wider">
                                    What They Want
                                  </h5>
                                  <ul className="space-y-1">
                                    {insight.customerSegments.what.map((what, i) => (
                                      <li key={i} className="flex items-start gap-2">
                                        <span className="w-1 h-1 bg-purple-500 rounded-full mt-1.5 flex-shrink-0" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{what}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Overview Section */}
                          {insight.description && !insight.customerSegments && (
                            <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">
                              <h5 className="text-xs font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wider">
                                What This Means
                              </h5>
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {insight.description}
                              </p>
                            </div>
                          )}

                          {/* What To Do Section */}
                          {insight.actionableInsight && (
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                              <h5 className="text-xs font-bold text-purple-700 dark:text-purple-300 mb-2 uppercase tracking-wider">
                                What To Do
                              </h5>
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {insight.actionableInsight}
                              </p>
                            </div>
                          )}

                          {/* Evidence Section */}
                          {insight.evidence && insight.evidence.length > 0 && (
                            <div>
                              <h5 className="text-xs font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wider">
                                Evidence
                              </h5>
                              <ul className="space-y-2">
                                {insight.evidence.map((item, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 flex-shrink-0" />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Source Section - Show where this came from */}
                          {insight.sources && insight.sources.length > 0 && (
                            <div>
                              <h5 className="text-xs font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wider">
                                Where This Came From
                              </h5>
                              <div className="space-y-3">
                                {insight.sources.map((src, i) => (
                                  <div key={i} className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-200 dark:border-blue-900">
                                    {/* Quote First - Most Important */}
                                    {src.quote && (
                                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 font-medium">
                                        "{src.quote}"
                                      </p>
                                    )}

                                    {/* Platform and timestamp */}
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                                        {src.source}
                                      </span>
                                      {src.timestamp && (
                                        <span className="text-xs text-gray-500">
                                          · {src.timestamp}
                                        </span>
                                      )}
                                    </div>

                                    {src.url && (
                                      <a
                                        href={src.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                                      >
                                        View source →
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Raw Data Section (for debugging) */}
                          {insight.rawData && Object.keys(insight.rawData).length > 0 && (
                            <details className="text-xs">
                              <summary className="font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                                Raw Data
                              </summary>
                              <pre className="mt-2 p-2 bg-gray-100 dark:bg-slate-900 rounded overflow-x-auto text-xs">
                                {JSON.stringify(insight.rawData, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {visibleInsights.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Zap className="w-12 h-12 text-gray-400 mb-3" />
            <p className="text-gray-600 dark:text-gray-400">
              No insights in this category
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
