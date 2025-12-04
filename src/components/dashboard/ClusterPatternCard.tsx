/**
 * Cluster Pattern Card Component
 * Displays a semantic cluster with framework, coherence, and pattern insights
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Users, TrendingUp, Target, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { InsightCluster } from '@/services/intelligence/clustering.service';

export interface ClusterPatternCardProps {
  cluster: InsightCluster;
  onGenerateCampaign?: (cluster: InsightCluster) => void;
  onClick?: (cluster: InsightCluster) => void;
  className?: string;
}

// Sentiment colors
const sentimentColors: Record<string, { bg: string; text: string; icon: string }> = {
  positive: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', icon: '😊' },
  negative: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', icon: '😟' },
  neutral: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', icon: '😐' },
  mixed: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', icon: '🤔' },
};

export function ClusterPatternCard({
  cluster,
  onGenerateCampaign,
  onClick,
  className,
}: ClusterPatternCardProps) {
  const sentimentStyle = sentimentColors[cluster.dominantSentiment] || sentimentColors.neutral;
  const coherencePercentage = Math.round(cluster.coherence * 100);

  // Determine coherence quality
  const getCoherenceQuality = (coherence: number) => {
    if (coherence >= 0.8) return { label: 'Excellent', color: 'text-green-600' };
    if (coherence >= 0.6) return { label: 'Good', color: 'text-blue-600' };
    if (coherence >= 0.4) return { label: 'Fair', color: 'text-yellow-600' };
    return { label: 'Weak', color: 'text-red-600' };
  };

  const coherenceQuality = getCoherenceQuality(cluster.coherence);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card
        className="group hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-purple-500"
        onClick={() => onClick?.(cluster)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {cluster.theme}
              </h3>

              {/* Framework Badge */}
              {(cluster as any).frameworkUsed && (
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {(cluster as any).frameworkUsed.name}
                  </Badge>
                </div>
              )}
            </div>

            {/* Data Point Count */}
            <div className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400">
              <Users className="w-4 h-4" />
              <span>{cluster.size}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Coherence Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">Pattern Strength</span>
              </div>
              <span className={`font-semibold ${coherenceQuality.color}`}>
                {coherencePercentage}% · {coherenceQuality.label}
              </span>
            </div>
            <Progress value={coherencePercentage} className="h-2" />
          </div>

          {/* Dominant Sentiment */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Sentiment</span>
            <Badge className={`${sentimentStyle.bg} ${sentimentStyle.text} border-0`}>
              <span className="mr-1">{sentimentStyle.icon}</span>
              {cluster.dominantSentiment}
            </Badge>
          </div>

          {/* Sources */}
          {cluster.sources && cluster.sources.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Target className="w-4 h-4" />
                <span>Sources ({cluster.sources.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {cluster.sources.slice(0, 4).map((source, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  >
                    {source.length > 20 ? source.substring(0, 20) + '...' : source}
                  </Badge>
                ))}
                {cluster.sources.length > 4 && (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  >
                    +{cluster.sources.length - 4} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Action Button */}
          {onGenerateCampaign && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onGenerateCampaign(cluster);
              }}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white group/btn"
              size="sm"
            >
              <Sparkles className="w-4 h-4 mr-2 group-hover/btn:animate-pulse" />
              Generate Campaign from Pattern
              <ChevronRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default ClusterPatternCard;
