/**
 * Refinement Dialog Component
 *
 * Modal for users to correct/refine AI-generated suggestions
 * Provides structured feedback that improves future suggestions
 *
 * Created: 2025-11-18
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertTriangle, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';

export interface RefinementRequest {
  id: string;
  type: 'value-prop' | 'trigger' | 'persona' | 'transformation';
  originalContent: string;
  issueType?: 'inaccurate' | 'incomplete' | 'tone' | 'other';
  userCorrection?: string;
  additionalContext?: string;
}

interface RefinementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: RefinementRequest['type'];
  originalContent: string;
  onSubmit: (refinement: RefinementRequest) => void;
}

export function RefinementDialog({
  isOpen,
  onClose,
  type,
  originalContent,
  onSubmit
}: RefinementDialogProps) {
  const [issueType, setIssueType] = useState<RefinementRequest['issueType']>('inaccurate');
  const [userCorrection, setUserCorrection] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getTypeLabel = () => {
    switch (type) {
      case 'value-prop':
        return 'Value Proposition';
      case 'trigger':
        return 'Customer Trigger';
      case 'persona':
        return 'Buyer Persona';
      case 'transformation':
        return 'Customer Transformation';
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const refinement: RefinementRequest = {
      id: `ref-${Date.now()}`,
      type,
      originalContent,
      issueType,
      userCorrection,
      additionalContext
    };

    await onSubmit(refinement);

    setIsSubmitting(false);
    handleClose();
  };

  const handleClose = () => {
    setIssueType('inaccurate');
    setUserCorrection('');
    setAdditionalContext('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-gray-200 dark:border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Refine {getTypeLabel()}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Help us improve this suggestion
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Original Content */}
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                Original Suggestion
              </label>
              <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600">
                <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                  "{originalContent}"
                </p>
              </div>
            </div>

            {/* Issue Type */}
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">
                What's the issue?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setIssueType('inaccurate')}
                  className={`
                    p-4 rounded-lg border-2 transition-all text-left
                    ${issueType === 'inaccurate'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Inaccurate
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Contains incorrect information
                  </p>
                </button>

                <button
                  onClick={() => setIssueType('incomplete')}
                  className={`
                    p-4 rounded-lg border-2 transition-all text-left
                    ${issueType === 'incomplete'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Incomplete
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Missing important details
                  </p>
                </button>

                <button
                  onClick={() => setIssueType('tone')}
                  className={`
                    p-4 rounded-lg border-2 transition-all text-left
                    ${issueType === 'tone'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Wrong Tone
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Doesn't match our voice
                  </p>
                </button>

                <button
                  onClick={() => setIssueType('other')}
                  className={`
                    p-4 rounded-lg border-2 transition-all text-left
                    ${issueType === 'other'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Other
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Something else
                  </p>
                </button>
              </div>
            </div>

            {/* User Correction */}
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                Your Correction
              </label>
              <textarea
                value={userCorrection}
                onChange={(e) => setUserCorrection(e.target.value)}
                placeholder="Provide the corrected or improved version..."
                className="w-full p-4 border-2 border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors"
                rows={4}
              />
            </div>

            {/* Additional Context */}
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                Additional Context (Optional)
              </label>
              <textarea
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="Any additional information that might help improve future suggestions..."
                className="w-full p-4 border-2 border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors"
                rows={3}
              />
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 Your feedback helps improve AI suggestions for everyone. We'll use this to refine our models.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 p-6 flex items-center justify-between">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleSubmit}
                disabled={!userCorrection.trim() || isSubmitting}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
                Regenerate
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={!userCorrection.trim() || isSubmitting}
                className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600"
              >
                <Check className="w-4 h-4" />
                Submit Refinement
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
