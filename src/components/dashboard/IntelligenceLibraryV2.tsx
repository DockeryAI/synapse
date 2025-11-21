/**
 * Intelligence Library V2 - "The Simple Power"
 *
 * Two modes:
 * - Easy Mode: One-click AI strategy generation
 * - Power Mode: Advanced insight selection with recipes
 *
 * Mode preference persists across sessions
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Settings } from 'lucide-react';
import type { DeepContext } from '@/types/synapse/deepContext.types';
import { EasyMode } from './intelligence-v2/EasyMode';
import { PowerMode } from './intelligence-v2/PowerMode';

export interface IntelligenceLibraryV2Props {
  context: DeepContext;
  onGenerateCampaign: (selectedInsights: string[]) => void;
}

type ViewMode = 'easy' | 'power';

const MODE_STORAGE_KEY = 'intelligence_library_mode';

export function IntelligenceLibraryV2({ context, onGenerateCampaign }: IntelligenceLibraryV2Props) {
  // Load mode from localStorage or default to 'easy'
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const stored = localStorage.getItem(MODE_STORAGE_KEY);
    return (stored === 'easy' || stored === 'power') ? stored : 'easy';
  });

  // Persist mode changes to localStorage
  const handleModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-slate-800">
      {/* Header with Mode Toggle */}
      <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Intelligence Library
              </h2>
              {context.business?.profile?.name && (
                <span className="text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-3 py-1 rounded-full">
                  {context.business.profile.name}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              {viewMode === 'easy'
                ? 'AI-powered strategy at the click of a button'
                : 'Advanced insight selection and mixing'
              }
            </p>
          </div>

          {/* Mode Toggle Switch */}
          <div className="flex items-center gap-3 bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => handleModeChange('easy')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                viewMode === 'easy'
                  ? 'bg-white dark:bg-slate-700 text-purple-600 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4" />
              Easy Mode
            </button>
            <button
              onClick={() => handleModeChange('power')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                viewMode === 'power'
                  ? 'bg-white dark:bg-slate-700 text-purple-600 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              Power Mode
            </button>
          </div>
        </div>
      </div>

      {/* Content Area - Switches between modes */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {viewMode === 'easy' ? (
            <motion.div
              key="easy-mode"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full"
            >
              <EasyMode context={context} onGenerate={onGenerateCampaign} />
            </motion.div>
          ) : (
            <motion.div
              key="power-mode"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full"
            >
              <PowerMode context={context} onGenerate={onGenerateCampaign} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
