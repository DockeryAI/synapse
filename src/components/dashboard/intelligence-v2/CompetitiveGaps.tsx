/**
 * Competitive Gaps Visualization
 *
 * Displays competitive white spaces and differentiation strategies
 * Shows theme comparison and actionable recommendations
 *
 * Created: 2025-11-23
 */

import React, { useState } from 'react';
import { Target, TrendingUp, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import type {
  CompetitiveWhiteSpace,
  DifferentiationStrategy,
  CompetitiveAnalysisResult
} from '@/services/intelligence/competitive-analyzer.service';

export interface CompetitiveGapsProps {
  analysis: CompetitiveAnalysisResult;
}

export function CompetitiveGaps({ analysis }: CompetitiveGapsProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<DifferentiationStrategy | null>(null);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 dark:bg-red-900/20 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300';
      case 'medium': return 'bg-orange-100 dark:bg-orange-900/20 border-orange-300 dark:border-orange-800 text-orange-700 dark:text-orange-300';
      case 'low': return 'bg-green-100 dark:bg-green-900/20 border-green-300 dark:border-green-800 text-green-700 dark:text-green-300';
      default: return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'medium': return <Info className="w-4 h-4 text-orange-600" />;
      case 'hard': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-600" />
          Competitive Gaps & Opportunities
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Based on analysis of {analysis.competitors.length} competitors
        </p>
      </div>

      {/* White Spaces */}
      {analysis.whiteSpaces.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
            Market White Spaces
          </h4>
          <div className="space-y-3">
            {analysis.whiteSpaces.map((ws, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h5 className="font-semibold text-gray-900 dark:text-white flex-1">
                    {ws.gap}
                  </h5>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getUrgencyColor(ws.urgency)}`}>
                      {ws.urgency} urgency
                    </span>
                    {getDifficultyIcon(ws.difficulty)}
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {ws.description}
                </p>

                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                  <div className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">
                    Opportunity:
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {ws.opportunity}
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>Impact: {ws.potentialImpact}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {getDifficultyIcon(ws.difficulty)}
                    <span>Difficulty: {ws.difficulty}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Differentiation Strategies */}
      {analysis.differentiationStrategies.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
            Differentiation Strategies
          </h4>
          <div className="space-y-3">
            {analysis.differentiationStrategies.map((strategy, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 cursor-pointer hover:border-purple-400 dark:hover:border-purple-600 transition-all"
                onClick={() => setSelectedStrategy(selectedStrategy === strategy ? null : strategy)}
              >
                <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {strategy.strategy}
                </h5>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {strategy.rationale}
                </p>

                {selectedStrategy === strategy && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-3 pt-3 border-t border-blue-200 dark:border-blue-800"
                  >
                    <div>
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Implementation Steps:
                      </div>
                      <ul className="space-y-1">
                        {strategy.implementation.map((step, i) => (
                          <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                            <span className="text-purple-600 dark:text-purple-400">•</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-lg p-3">
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Expected Outcome:
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {strategy.expectedOutcome}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="font-medium text-green-700 dark:text-green-300 mb-1">
                          ✓ Competitors NOT doing this:
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                          {strategy.competitorsNotDoingThis.join(', ') || 'All'}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-red-700 dark:text-red-300 mb-1">
                          ✗ Competitors doing this:
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                          {strategy.competitorsDoingThis.join(', ') || 'None'}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Theme Comparison */}
      {Object.keys(analysis.themeComparison).length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
            Messaging Theme Comparison
          </h4>
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4">
            <div className="space-y-3">
              {Object.entries(analysis.themeComparison)
                .slice(0, 5)
                .map(([theme, counts], idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        {theme}
                      </span>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>You: {counts.yours}</span>
                        <span>Them: {counts.theirs}</span>
                      </div>
                    </div>
                    <div className="relative h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full bg-purple-500"
                        style={{ width: `${(counts.yours / (counts.yours + counts.theirs)) * 100}%` }}
                      />
                      <div
                        className="absolute right-0 top-0 h-full bg-gray-400"
                        style={{ width: `${(counts.theirs / (counts.yours + counts.theirs)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Analysis Metadata */}
      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        Analysis completed {new Date(analysis.analysisDate).toLocaleString()} •
        Confidence: {Math.round(analysis.confidence * 100)}%
      </div>
    </div>
  );
}
