/**
 * Opportunity Radar Detail Modal
 * Shows full breakthrough details when clicking a radar blip
 */

import React from 'react';
import { X, AlertCircle, TrendingUp, CheckCircle, Target, Database, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Breakthrough } from '@/services/intelligence/breakthrough-generator.service';

export interface OpportunityRadarDetailProps {
  breakthrough: Breakthrough | null;
  onClose: () => void;
}

export function OpportunityRadarDetail({ breakthrough, onClose }: OpportunityRadarDetailProps) {
  if (!breakthrough) return null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'urgent': return AlertCircle;
      case 'high-value': return TrendingUp;
      case 'evergreen': return CheckCircle;
      default: return Target;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'urgent': return 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'high-value': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case 'evergreen': return 'text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      default: return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
    }
  };

  const CategoryIcon = getCategoryIcon(breakthrough.category);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {breakthrough.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {breakthrough.description}
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-4 p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {breakthrough.score}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Overall Score
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {breakthrough.validation.totalDataPoints}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Data Points
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-600">
                  {breakthrough.emotionalResonance.eqScore}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  EQ Score
                </div>
              </div>
            </div>

            {/* Category Badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${getCategoryColor(breakthrough.category)}`}>
              <CategoryIcon className="w-4 h-4" />
              <span className="font-medium capitalize">{breakthrough.category}</span>
            </div>

            {/* Validation */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Validation</h3>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {breakthrough.validation.validationStatement}
              </p>
            </div>

            {/* Suggested Angles */}
            {breakthrough.suggestedAngles && breakthrough.suggestedAngles.length > 0 && (
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-purple-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Content Angles</h3>
                </div>
                <ul className="space-y-1">
                  {breakthrough.suggestedAngles.map((angle, idx) => (
                    <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                      <span className="text-purple-600 mt-1">•</span>
                      <span>{angle}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Timing */}
            {breakthrough.timing.urgency && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-red-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Time-Sensitive</h3>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  This opportunity has time-sensitive elements.
                  {breakthrough.timing.seasonal && ' Seasonal relevance detected.'}
                </p>
              </div>
            )}

            {/* Competitive Advantage */}
            {breakthrough.competitiveAdvantage.hasGap && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-orange-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Competitive Gap</h3>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {breakthrough.competitiveAdvantage.gapDescription || 'Competitors are not addressing this opportunity.'}
                </p>
              </div>
            )}

            {/* Emotional Resonance */}
            <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-pink-600" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Emotional Resonance</h3>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Dominant Emotion:</span> {breakthrough.emotionalResonance.dominantEmotion}
                </p>
                {breakthrough.emotionalResonance.triggers.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Triggers:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {breakthrough.emotionalResonance.triggers.map((trigger, idx) => (
                        <span
                          key={idx}
                          className="inline-block px-2 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 text-xs rounded"
                        >
                          {trigger}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Provenance */}
            <div className="text-xs text-gray-500 dark:text-gray-500 bg-gray-50 dark:bg-slate-800 rounded p-3">
              <span className="font-medium">Source:</span> {breakthrough.provenance}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
