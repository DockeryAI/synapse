/**
 * Easy Mode - Simple one-click strategy generation
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Clock } from 'lucide-react';
import type { DeepContext } from '@/types/synapse/deepContext.types';
import { CompetitiveGaps } from './CompetitiveGaps';

export interface EasyModeProps {
  context: DeepContext;
  onGenerate: (selectedInsights: string[]) => void;
}

export function EasyMode({ context, onGenerate }: EasyModeProps) {
  // Count total insights available
  const insightCount =
    (context.industry?.trends?.length || 0) +
    (context.customerPsychology?.unarticulated?.length || 0) +
    (context.customerPsychology?.emotional?.length || 0) +
    (context.competitiveIntel?.blindSpots?.length || 0) +
    (context.competitiveIntel?.opportunities?.length || 0) +
    (context.synthesis?.keyInsights?.length || 0) +
    (context.synthesis?.hiddenPatterns?.length || 0);

  const sourceCount = context.metadata?.dataSourcesUsed?.length || 0;

  const handleGenerate = () => {
    // AI selects best insights automatically
    onGenerate([]);
  };

  return (
    <div className="h-full p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Competitive Gaps Section (if available) */}
        {context.competitiveAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-slate-700"
          >
            <CompetitiveGaps analysis={context.competitiveAnalysis} />
          </motion.div>
        )}

        {/* Main Strategy Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full"
        >
        {/* Main Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-12 text-center border border-gray-200 dark:border-slate-700">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mb-6">
            <Sparkles className="w-10 h-10 text-white" />
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Your AI Strategy for Today
          </h2>

          {/* Description */}
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            We've analyzed your business intelligence and selected the most impactful insights.
            Click below to generate your complete campaign strategy.
          </p>

          {/* Generate Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerate}
            className="w-full max-w-md mx-auto py-6 px-8 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xl font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <span className="flex items-center justify-center gap-3">
              <Sparkles className="w-6 h-6" />
              Generate My Campaign
            </span>
          </motion.button>

          {/* Stats */}
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <TrendingUp className="w-4 h-4" />
                <span>
                  <strong className="text-gray-900 dark:text-white">{insightCount}</strong> insights
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Sparkles className="w-4 h-4" />
                <span>
                  <strong className="text-gray-900 dark:text-white">{sourceCount}</strong> sources
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                <span>
                  Updated {new Date(context.metadata?.aggregatedAt || new Date()).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Hint Text */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-500 mt-6">
          Want more control? Switch to Power Mode using the toggle above.
        </p>
        </motion.div>
      </div>
    </div>
  );
}
