/**
 * Dashboard Smart Picks Component
 *
 * Compact version of SmartPicks for dashboard display:
 * - Top 3 campaign recommendations
 * - Top 3 content ideas
 * - Click to see full details and generate
 *
 * Created: 2025-11-18
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, FileText, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import type { DeepContext } from '@/types/synapse/deepContext.types';
import type { SmartPick } from '@/types/smart-picks.types';
import { generateSmartPicks } from '@/services/campaign/SmartPickGenerator';

export interface DashboardSmartPicksProps {
  /** Deep context with business intelligence */
  context: DeepContext;

  /** Callback when user clicks on a pick */
  onPickClick?: (pick: SmartPick) => void;
}

export function DashboardSmartPicks({ context, onPickClick }: DashboardSmartPicksProps) {
  const [campaignPicks, setCampaignPicks] = useState<SmartPick[]>([]);
  const [contentPicks, setContentPicks] = useState<SmartPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate picks on mount
  useEffect(() => {
    async function generate() {
      try {
        setLoading(true);
        setError(null);

        console.log('[DashboardSmartPicks] Generating picks');

        // Generate campaign recommendations
        const campaignResult = await generateSmartPicks(context, 'multi-post', {
          maxPicks: 3,
          minConfidence: 0.6,
          preferTimely: true,
          includePreview: false,
        });

        // Generate single content recommendations
        const contentResult = await generateSmartPicks(context, 'single-post', {
          maxPicks: 3,
          minConfidence: 0.6,
          preferTimely: true,
          includePreview: false,
        });

        setCampaignPicks(campaignResult.picks.slice(0, 3));
        setContentPicks(contentResult.picks.slice(0, 3));
      } catch (err) {
        console.error('[DashboardSmartPicks] Generation failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to generate picks');
      } finally {
        setLoading(false);
      }
    }

    generate();
  }, [context]);

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-3" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Analyzing your intelligence...
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-8 h-8 text-red-600 mb-3" />
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  // Empty state
  if (campaignPicks.length === 0 && contentPicks.length === 0) {
    return (
      <div className="text-center py-12">
        <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-400">
          No recommendations available yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Campaign Recommendations */}
      {campaignPicks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Campaign Ideas
            </h3>
          </div>
          <div className="space-y-3">
            {campaignPicks.map((pick, idx) => (
              <motion.button
                key={pick.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onPickClick?.(pick)}
                className="w-full text-left group bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-200 dark:border-purple-700 rounded-xl p-4 hover:border-purple-400 dark:hover:border-purple-500 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                        {pick.title}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {pick.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                        {Math.round(pick.confidence * 100)}% confidence
                      </span>
                      {pick.opportunityScore && (
                        <>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            Score: {pick.opportunityScore.toFixed(1)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Content Ideas */}
      {contentPicks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Content Ideas
            </h3>
          </div>
          <div className="space-y-3">
            {contentPicks.map((pick, idx) => (
              <motion.button
                key={pick.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (campaignPicks.length + idx) * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onPickClick?.(pick)}
                className="w-full text-left group bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-900/20 dark:to-violet-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4 hover:border-blue-400 dark:hover:border-blue-500 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                        {pick.title}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {pick.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                        {Math.round(pick.confidence * 100)}% confidence
                      </span>
                      {pick.opportunityScore && (
                        <>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            Score: {pick.opportunityScore.toFixed(1)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
