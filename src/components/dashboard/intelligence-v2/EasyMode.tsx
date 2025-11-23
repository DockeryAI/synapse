/**
 * Easy Mode - Simple one-click strategy generation
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Clock } from 'lucide-react';
import type { DeepContext } from '@/types/synapse/deepContext.types';
import type { InsightCluster } from '@/services/intelligence/clustering.service';
import type { Breakthrough } from '@/services/intelligence/breakthrough-generator.service';
import { IntelligenceInsights } from '../IntelligenceInsights';
import { OpportunityRadar } from './OpportunityRadar';
import { CampaignTimeline, transformCampaignForTimeline } from './CampaignTimeline';
import { PerformanceDashboard, transformPerformancePredictions } from './PerformanceDashboard';

export interface EasyModeProps {
  context: DeepContext;
  onGenerate: (selectedInsights: string[]) => void;
  clusters?: InsightCluster[];
  breakthroughs?: Breakthrough[];
}

export function EasyMode({ context, onGenerate, clusters = [], breakthroughs = [] }: EasyModeProps) {
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
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        {/* Opportunity Radar */}
        {breakthroughs.length > 0 && (
          <div className="mb-6">
            <OpportunityRadar
              breakthroughs={breakthroughs}
              onBlipClick={(bt) => console.log('Clicked:', bt.title)}
            />
          </div>
        )}

        {/* Campaign Timeline (if campaign generated) */}
        {(context as any).generatedCampaign && (
          <div className="mb-6">
            <CampaignTimeline
              campaign={transformCampaignForTimeline((context as any).generatedCampaign)}
            />
          </div>
        )}

        {/* Performance Predictions */}
        {(context as any).performancePredictions && (
          <div className="mb-6">
            <PerformanceDashboard
              predictions={transformPerformancePredictions((context as any).performancePredictions)}
            />
          </div>
        )}

        {/* Intelligence Insights Component */}
        <IntelligenceInsights
          clusters={clusters}
          breakthroughs={breakthroughs}
          loading={false}
        />

        {/* Generate Campaign CTA (if we have insights) */}
        {(breakthroughs.length > 0 || clusters.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 p-8 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800 text-center"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              Ready to Turn Insights Into Action?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              AI will automatically select the best insights and generate your campaign strategy
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerate}
              className="w-full max-w-md mx-auto py-4 px-8 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <span className="flex items-center justify-center gap-3">
                <Sparkles className="w-5 h-5" />
                Generate My Campaign
              </span>
            </motion.button>

            {/* Stats */}
            <div className="mt-6 pt-6 border-t border-purple-200 dark:border-purple-700">
              <div className="flex items-center justify-center gap-6 text-sm flex-wrap">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <TrendingUp className="w-4 h-4" />
                  <span>
                    <strong className="text-gray-900 dark:text-white">{breakthroughs.length}</strong> breakthroughs
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Sparkles className="w-4 h-4" />
                  <span>
                    <strong className="text-gray-900 dark:text-white">{clusters.length}</strong> patterns
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
          </motion.div>
        )}
      </div>
    </div>
  );
}
