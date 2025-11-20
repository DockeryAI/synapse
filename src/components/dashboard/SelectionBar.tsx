/**
 * Selection Bar
 *
 * Floating bottom bar that appears when insights are selected
 * Provides quick actions for selected insights
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, FileText, X, Shuffle } from 'lucide-react';

export interface SelectionBarProps {
  selectedCount: number;
  onCreateCampaign: () => void;
  onMixContent: () => void;
  onClear: () => void;
}

export function SelectionBar({
  selectedCount,
  onCreateCampaign,
  onMixContent,
  onClear
}: SelectionBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="bg-gray-900 dark:bg-slate-800 text-white rounded-2xl shadow-2xl px-6 py-4 border border-gray-700 dark:border-slate-600">
            <div className="flex items-center gap-6">
              {/* Selection Count */}
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-purple-600 rounded-full">
                  <span className="text-lg font-bold">{selectedCount}</span>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold">
                    {selectedCount} {selectedCount === 1 ? 'insight' : 'insights'} selected
                  </div>
                  <div className="text-xs text-gray-400">
                    Ready to create content
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-12 w-px bg-gray-700 dark:bg-slate-600" />

              {/* Actions */}
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onCreateCampaign}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors"
                >
                  <TrendingUp className="w-4 h-4" />
                  Create Campaign
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onMixContent}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
                >
                  <Shuffle className="w-4 h-4" />
                  Mix Content
                </motion.button>
              </div>

              {/* Close */}
              <button
                onClick={onClear}
                className="p-2 hover:bg-gray-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
                aria-label="Clear selection"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
