/**
 * Reasoning Modal Component
 *
 * Displays AI reasoning, data sources, and confidence breakdown
 * Shows "why" behind AI recommendations and analysis
 *
 * Created: 2025-11-18
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Brain, Lightbulb, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfidenceScore, ConfidenceMeter } from './ConfidenceMeter';
import { DataSource, SourceCitation } from './SourceCitation';

interface ReasoningModalProps {
  isOpen: boolean;
  onClose: () => void;
  reasoning: string;
  sources: DataSource[];
  confidence: ConfidenceScore;
  title?: string;
  subtitle?: string;
  recommendations?: string[];
  warnings?: string[];
}

export function ReasoningModal({
  isOpen,
  onClose,
  reasoning,
  sources,
  confidence,
  title = 'AI Reasoning',
  subtitle = 'How we arrived at this analysis',
  recommendations = [],
  warnings = [],
}: ReasoningModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
            <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
            {subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Confidence Score */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <ConfidenceMeter score={confidence} showBreakdown={true} />
          </motion.div>

          {/* AI Reasoning */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Analysis Reasoning
              </h3>
            </div>

            <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {reasoning}
              </p>
            </div>
          </motion.div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recommendations
                </h3>
              </div>

              <ul className="space-y-2">
                {recommendations.map((rec, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.1 }}
                    className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {idx + 1}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {rec}
                    </p>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Important Notes
                </h3>
              </div>

              <ul className="space-y-2">
                {warnings.map((warning, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + idx * 0.1 }}
                    className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-700"
                  >
                    <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {warning}
                    </p>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Data Sources */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <SourceCitation sources={sources} showExcerpts={true} />
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="pt-4 border-t border-gray-200 dark:border-slate-700"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Analysis generated using multiple AI models and verified data sources
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Got it
              </button>
            </div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Compact Reasoning Button - Trigger to open modal
 */
export function ViewReasoningButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/20 hover:bg-purple-200 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-medium transition-colors"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Brain className="w-3.5 h-3.5" />
      <span>View AI Reasoning</span>
    </motion.button>
  );
}

/**
 * Inline Reasoning Snippet - Shows brief reasoning with expand button
 */
export function InlineReasoning({
  reasoning,
  onViewFull,
}: {
  reasoning: string;
  onViewFull: () => void;
}) {
  const preview = reasoning.slice(0, 150) + (reasoning.length > 150 ? '...' : '');

  return (
    <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
      <div className="flex items-start gap-2 mb-2">
        <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{preview}</p>
        </div>
      </div>
      <button
        onClick={onViewFull}
        className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
      >
        View full reasoning →
      </button>
    </div>
  );
}
