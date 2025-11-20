/**
 * Quick Launch Strip
 *
 * Prominent banner showing the #1 AI-recommended action
 * with immediate launch capability
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, ArrowRight } from 'lucide-react';
import type { SmartPick } from '@/types/smart-picks.types';

export interface QuickLaunchStripProps {
  topPick: SmartPick | null;
  onLaunch: (pick: SmartPick) => void;
}

export function QuickLaunchStrip({ topPick, onLaunch }: QuickLaunchStripProps) {
  if (!topPick) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 rounded-xl p-4 shadow-lg"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0">
            <Zap className="w-8 h-8 text-yellow-300" fill="currentColor" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-yellow-300 uppercase tracking-wide">
                Top Pick
              </span>
              <span className="text-xs text-white/80">
                {Math.round(topPick.confidence * 100)}% confidence
              </span>
            </div>
            <h3 className="text-lg font-bold text-white truncate">
              {topPick.title}
            </h3>
            <p className="text-sm text-white/90 line-clamp-1">
              {topPick.description}
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onLaunch(topPick)}
          className="flex-shrink-0 flex items-center gap-2 px-6 py-3 bg-white text-purple-700 font-semibold rounded-lg hover:bg-yellow-300 hover:text-purple-900 transition-colors shadow-lg"
        >
          Launch Now
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  );
}
