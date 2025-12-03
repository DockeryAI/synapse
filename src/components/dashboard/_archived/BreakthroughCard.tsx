/**
 * Breakthrough Card Component
 * Displays a breakthrough insight with quality scoring and Synapse generation
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, TrendingUp, Brain, ChevronRight, Clock, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { SynapseInsight } from '@/types/synapse/synapse.types';

export interface BreakthroughCardProps {
  insight: SynapseInsight;
  onGenerateWithSynapse?: (insight: SynapseInsight) => void;
  onClick?: (insight: SynapseInsight) => void;
  showQualityScore?: boolean;
  compact?: boolean;
  className?: string;
}

// Quality score color coding
const getQualityColor = (score: number) => {
  if (score >= 80) return { bg: 'bg-green-500', text: 'text-green-700 dark:text-green-300', label: 'Excellent' };
  if (score >= 60) return { bg: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-300', label: 'Good' };
  if (score >= 40) return { bg: 'bg-yellow-500', text: 'text-yellow-700 dark:text-yellow-300', label: 'Fair' };
  return { bg: 'bg-red-500', text: 'text-red-700 dark:text-red-300', label: 'Needs Work' };
};

// Confidence color coding
const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) return 'text-green-600';
  if (confidence >= 0.6) return 'text-blue-600';
  if (confidence >= 0.4) return 'text-yellow-600';
  return 'text-red-600';
};

export function BreakthroughCard({
  insight,
  onGenerateWithSynapse,
  onClick,
  showQualityScore = true,
  compact = false,
  className,
}: BreakthroughCardProps) {
  const qualityScore = insight.qualityScore?.total || 0;
  const qualityStyle = getQualityColor(qualityScore);
  const confidencePercentage = Math.round(insight.confidence * 100);

  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={className}
      >
        <Card
          className="group hover:shadow-md transition-all cursor-pointer border-l-4 border-l-blue-500"
          onClick={() => onClick?.(insight)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {insight.insight}
                </p>
                {insight.frameworkUsed && (
                  <Badge variant="outline" className="mt-2 text-xs">
                    {insight.frameworkUsed.name}
                  </Badge>
                )}
              </div>
              {showQualityScore && insight.qualityScore && (
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${qualityStyle.bg} text-white`}>
                    {qualityScore}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      <Card
        className="group hover:shadow-xl transition-all cursor-pointer border-l-4 border-l-blue-500 overflow-hidden"
        onClick={() => onClick?.(insight)}
      >
        {/* Quality Score Header */}
        {showQualityScore && insight.qualityScore && (
          <div className={`${qualityStyle.bg} h-2`} />
        )}

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <Badge variant="secondary" className="text-xs">
                  {insight.type.replace(/_/g, ' ')}
                </Badge>
                {insight.frameworkUsed && (
                  <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {insight.frameworkUsed.name}
                  </Badge>
                )}
              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {insight.insight}
              </h3>
            </div>

            {showQualityScore && insight.qualityScore && (
              <div className="flex-shrink-0 text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg ${qualityStyle.bg} text-white shadow-lg`}>
                  {qualityScore}
                </div>
                <p className={`text-xs font-medium mt-1 ${qualityStyle.text}`}>
                  {qualityStyle.label}
                </p>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Why Profound */}
          {insight.whyProfound && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Zap className="w-4 h-4 text-purple-600" />
                <span>Why This Matters</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 pl-6">
                {insight.whyProfound}
              </p>
            </div>
          )}

          {/* Why Now */}
          {insight.whyNow && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Why Now</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 pl-6">
                {insight.whyNow}
              </p>
            </div>
          )}

          {/* Expected Reaction */}
          {insight.expectedReaction && (
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300">
                <Target className="w-4 h-4" />
                <span>Expected Reaction</span>
              </div>
              <span className="text-sm text-blue-600 dark:text-blue-400">
                {insight.expectedReaction}
              </span>
            </div>
          )}

          {/* Confidence Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Confidence</span>
              <span className={`font-semibold ${getConfidenceColor(insight.confidence)}`}>
                {confidencePercentage}%
              </span>
            </div>
            <Progress value={confidencePercentage} className="h-2" />
          </div>

          {/* Quality Breakdown */}
          {showQualityScore && insight.qualityScore && insight.qualityScore.breakdown && (
            <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Quality Breakdown</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Relevance</span>
                  <span className="font-medium">{insight.qualityScore.breakdown.customerRelevance}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Actionability</span>
                  <span className="font-medium">{insight.qualityScore.breakdown.actionability}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Uniqueness</span>
                  <span className="font-medium">{insight.qualityScore.breakdown.uniqueness}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Emotional Pull</span>
                  <span className="font-medium">{insight.qualityScore.breakdown.emotionalPull}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Generate with Synapse Button */}
          {onGenerateWithSynapse && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onGenerateWithSynapse(insight);
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white group/btn"
              size="sm"
            >
              <Sparkles className="w-4 h-4 mr-2 group-hover/btn:animate-spin" />
              Generate with Synapse
              <ChevronRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default BreakthroughCard;
