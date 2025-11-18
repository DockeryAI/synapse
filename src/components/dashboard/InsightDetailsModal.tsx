/**
 * Insight Details Modal
 *
 * Shows full psychological trigger details when user clicks on a Smart Pick
 * - Complete trigger information
 * - Source citations
 * - Quick action to generate campaign/content
 * - Add to calendar option
 *
 * Created: 2025-11-18
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Target, Lightbulb, ExternalLink, Loader2, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SmartPick } from '@/types/smart-picks.types';
import type { DeepContext } from '@/types/synapse/deepContext.types';

export interface InsightDetailsModalProps {
  /** The smart pick to display details for */
  pick: SmartPick;

  /** Deep context for generation */
  context: DeepContext;

  /** Close modal callback */
  onClose: () => void;

  /** Generate campaign/content callback */
  onGenerate?: (pick: SmartPick) => void;

  /** Schedule to calendar callback */
  onSchedule?: (pick: SmartPick) => void;
}

export function InsightDetailsModal({
  pick,
  context,
  onClose,
  onGenerate,
  onSchedule,
}: InsightDetailsModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);

    // Call parent generate handler
    if (onGenerate) {
      await onGenerate(pick);
    }

    setIsGenerating(false);
    setGenerated(true);

    // Auto-close after showing success
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const handleSchedule = () => {
    if (onSchedule) {
      onSchedule(pick);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-slate-700">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  {pick.campaignType === 'multi-post' ? 'Campaign Idea' : 'Content Idea'}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {pick.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Description */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                Overview
              </h3>
              <p className="text-gray-900 dark:text-gray-100 leading-relaxed">
                {pick.description}
              </p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900 dark:text-purple-200">
                    Confidence
                  </span>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(pick.confidence * 100)}%
                </div>
              </div>

              {pick.opportunityScore && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
                      Opportunity Score
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {pick.opportunityScore.toFixed(1)}
                  </div>
                </div>
              )}
            </div>

            {/* Psychological Trigger */}
            {pick.psychologicalTrigger && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Psychological Trigger
                </h3>
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs font-semibold text-amber-900 dark:text-amber-200 mb-1">
                        PAIN POINT
                      </div>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {pick.psychologicalTrigger.painPoint}
                      </p>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-amber-900 dark:text-amber-200 mb-1">
                        DESIRE
                      </div>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {pick.psychologicalTrigger.desire}
                      </p>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-amber-900 dark:text-amber-200 mb-1">
                        SOURCE
                      </div>
                      <div className="flex items-center gap-1">
                        <ExternalLink className="w-3 h-3 text-amber-600" />
                        <span className="text-sm text-amber-700 dark:text-amber-300">
                          {pick.psychologicalTrigger.source}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Evidence Sources */}
            {pick.evidenceSources && pick.evidenceSources.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                  Evidence Sources ({pick.evidenceSources.length})
                </h3>
                <div className="space-y-2">
                  {pick.evidenceSources.map((source, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-700 rounded-lg p-3"
                    >
                      <ExternalLink className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{source}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rationale */}
            {pick.rationale && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  Why This Works
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {pick.rationale}
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
            <div className="flex gap-3">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || generated}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : generated ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Generated!
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate {pick.campaignType === 'multi-post' ? 'Campaign' : 'Content'}
                  </>
                )}
              </Button>
              <Button
                onClick={handleSchedule}
                variant="outline"
                disabled={isGenerating}
                className="border-2"
              >
                Schedule Later
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
