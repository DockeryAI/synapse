/**
 * Intelligence Insights Component
 *
 * Displays validated clusters and breakthrough insights from the orchestration pipeline
 * Shows cluster themes with validation counts and breakthrough cards with scores
 *
 * Created: 2025-11-23
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  Sparkles,
  Database,
  Target
} from 'lucide-react';
import type { InsightCluster } from '@/services/intelligence/clustering.service';
import type { Breakthrough } from '@/services/intelligence/breakthrough-generator.service';

export interface IntelligenceInsightsProps {
  clusters: InsightCluster[];
  breakthroughs: Breakthrough[];
  loading?: boolean;
}

export function IntelligenceInsights({ clusters, breakthroughs, loading }: IntelligenceInsightsProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Brain className="w-12 h-12 text-purple-600 animate-pulse mx-auto mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Discovering patterns...
          </p>
        </div>
      </div>
    );
  }

  if (clusters.length === 0 && breakthroughs.length === 0) {
    return (
      <div className="text-center py-12">
        <Brain className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-400">
          No intelligence insights available yet
        </p>
      </div>
    );
  }

  // Get urgency color
  const getUrgencyColor = (category: string) => {
    switch (category) {
      case 'urgent': return 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'high-value': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case 'evergreen': return 'text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  // Get urgency icon
  const getUrgencyIcon = (category: string) => {
    switch (category) {
      case 'urgent': return AlertCircle;
      case 'high-value': return TrendingUp;
      case 'evergreen': return CheckCircle;
      default: return Sparkles;
    }
  };

  // Get category label
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'urgent': return 'Urgent';
      case 'high-value': return 'High Value';
      case 'evergreen': return 'Evergreen';
      default: return category;
    }
  };

  // Sort breakthroughs by score
  const sortedBreakthroughs = [...breakthroughs].sort((a, b) => b.score - a.score);
  const topBreakthroughs = sortedBreakthroughs.slice(0, 5);

  // Sort clusters by size
  const sortedClusters = [...clusters].sort((a, b) => b.size - a.size);
  const topClusters = sortedClusters.slice(0, 8);

  return (
    <div className="space-y-8">
      {/* Breakthrough Insights */}
      {topBreakthroughs.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Breakthrough Insights
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Top {topBreakthroughs.length} opportunities
            </span>
          </div>

          <div className="space-y-3">
            {topBreakthroughs.map((breakthrough, idx) => {
              const UrgencyIcon = getUrgencyIcon(breakthrough.category);
              const urgencyColor = getUrgencyColor(breakthrough.category);

              return (
                <motion.div
                  key={breakthrough.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-xl p-4 hover:border-purple-400 dark:hover:border-purple-600 transition-all"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white text-sm font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {breakthrough.title}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {breakthrough.description}
                      </p>
                    </div>

                    {/* Score Badge */}
                    <div className="flex-shrink-0 text-right">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {breakthrough.score}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Score
                      </div>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {/* Category Badge */}
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${urgencyColor}`}>
                      <UrgencyIcon className="w-3 h-3" />
                      {getCategoryLabel(breakthrough.category)}
                    </span>

                    {/* Validation */}
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      <Database className="w-3 h-3" />
                      {breakthrough.validation.totalDataPoints} data points
                    </span>

                    {/* EQ Score */}
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800">
                      <Target className="w-3 h-3" />
                      EQ {breakthrough.emotionalResonance.eqScore}
                    </span>

                    {/* Timing */}
                    {breakthrough.timing.urgency && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                        <Clock className="w-3 h-3" />
                        Time-sensitive
                      </span>
                    )}
                  </div>

                  {/* Validation Statement */}
                  <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-900 rounded-lg p-2">
                    <span className="font-medium">Validation:</span> {breakthrough.validation.validationStatement}
                  </div>

                  {/* Provenance */}
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                    {breakthrough.provenance}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pattern Clusters */}
      {topClusters.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Pattern Clusters
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {topClusters.length} validated patterns
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {topClusters.map((cluster, idx) => (
              <motion.div
                key={cluster.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 hover:border-purple-400 dark:hover:border-purple-600 transition-all"
              >
                {/* Theme */}
                <div className="font-semibold text-sm text-gray-900 dark:text-white mb-2">
                  {cluster.theme}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {cluster.size} points
                  </span>
                  <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                    {Math.round(cluster.coherence * 100)}% coherence
                  </span>
                </div>

                {/* Sources */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {cluster.sources.slice(0, 3).map((source, i) => (
                    <span
                      key={i}
                      className="inline-block px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded text-[10px] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-slate-700"
                    >
                      {source}
                    </span>
                  ))}
                  {cluster.sources.length > 3 && (
                    <span className="inline-block px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded text-[10px] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-slate-700">
                      +{cluster.sources.length - 3}
                    </span>
                  )}
                </div>

                {/* Validation Statement */}
                {cluster.validationStatement && (
                  <div className="text-[10px] text-gray-500 dark:text-gray-500 bg-white dark:bg-slate-900 rounded p-1.5 line-clamp-2">
                    {cluster.validationStatement}
                  </div>
                )}

                {/* Emotional Trigger */}
                {cluster.emotionalTrigger && (
                  <div className="mt-1 text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                    {cluster.emotionalTrigger}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
