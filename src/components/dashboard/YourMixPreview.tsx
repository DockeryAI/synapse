/**
 * Your Mix Preview Component
 * Shows combined intelligence insights with synthesis and cluster patterns
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  TrendingUp,
  Users,
  Target,
  Brain,
  FileText,
  Zap,
  Globe,
  AlertCircle,
} from 'lucide-react';
import type { DeepContext } from '@/types/synapse/deepContext.types';

export interface YourMixPreviewProps {
  context: DeepContext | null;
  onCreateCampaign?: () => void;
  className?: string;
}

export const YourMixPreview: React.FC<YourMixPreviewProps> = ({
  context,
  onCreateCampaign,
  className,
}) => {
  if (!context) {
    return (
      <div className={cn('h-full flex items-center justify-center bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-700 p-6', className)}>
        <div className="text-center">
          <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Intelligence Data
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Generate intelligence to see your content mix
          </p>
        </div>
      </div>
    );
  }

  // Calculate synthesis metrics
  const totalInsights = (context.industry?.trends?.length || 0) +
    (context.customerPsychology?.unarticulated?.length || 0) +
    (context.competitiveIntel?.blindSpots?.length || 0);

  const highValueInsights = (context.competitiveIntel?.blindSpots?.filter(b => b.opportunityScore >= 80).length || 0) +
    (context.industry?.trends?.filter(t => t.impact === 'high').length || 0);

  return (
    <div className={cn('h-full flex flex-col bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-700', className)}>
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Your Mix
          </h2>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Combined intelligence synthesis
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Synthesis Overview */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Intelligence Synthesis
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Brain className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Total Insights</span>
              </div>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{totalInsights}</p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-medium text-purple-700 dark:text-purple-300">High Value</span>
              </div>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{highValueInsights}</p>
            </div>
          </div>
        </div>

        {/* Industry Trends */}
        {context.industry?.trends && context.industry.trends.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              Industry Trends
            </h3>
            <div className="space-y-2">
              {context.industry.trends.slice(0, 3).map((trend, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-700 rounded-lg"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">
                        {trend.trend}
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
                        {trend.direction} • {trend.impact} impact
                      </p>
                    </div>
                    <Badge className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-300">
                      {Math.round(trend.strength * 100)}%
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Customer Pain Points */}
        {context.customerPsychology?.unarticulated && context.customerPsychology.unarticulated.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-600" />
              Customer Pain Points
            </h3>
            <div className="space-y-2">
              {context.customerPsychology.unarticulated.slice(0, 2).map((need, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-700 rounded-lg"
                >
                  <p className="text-sm font-medium text-orange-900 dark:text-orange-100 mb-1">
                    {need.need}
                  </p>
                  <p className="text-xs text-orange-700 dark:text-orange-300">
                    {need.marketingAngle}
                  </p>
                  <div className="mt-2 flex items-center gap-1">
                    <div className="text-xs text-orange-600 dark:text-orange-400">
                      {need.emotionalDriver}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Competitive Blind Spots */}
        {context.competitiveIntel?.blindSpots && context.competitiveIntel.blindSpots.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-red-600" />
              Competitive Blind Spots
            </h3>
            <div className="space-y-2">
              {context.competitiveIntel.blindSpots.slice(0, 2).map((blindSpot, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-700 rounded-lg"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-900 dark:text-red-100">
                        {blindSpot.topic}
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
                        {blindSpot.actionableInsight}
                      </p>
                    </div>
                    <Badge className="text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-300">
                      {blindSpot.opportunityScore}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Cluster Patterns */}
        <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600" />
            Content Clusters
          </h3>
          <div className="grid gap-2">
            {context.competitiveIntel?.opportunities && context.competitiveIntel.opportunities.length > 0 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-700 rounded-lg">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">Competitive Positioning</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  {context.competitiveIntel.opportunities.length} differentiation opportunities
                </p>
              </div>
            )}
            {context.customerPsychology?.emotional && context.customerPsychology.emotional.length > 0 && (
              <div className="p-3 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-700 rounded-lg">
                <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1">Emotional Triggers</p>
                <p className="text-xs text-purple-600 dark:text-purple-400">
                  {context.customerPsychology.emotional.length} engagement opportunities
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex-shrink-0 p-6 border-t border-gray-200 dark:border-slate-700">
        <Button
          onClick={onCreateCampaign}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
          size="lg"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Build Campaign from Mix
        </Button>
      </div>
    </div>
  );
};

export default YourMixPreview;
