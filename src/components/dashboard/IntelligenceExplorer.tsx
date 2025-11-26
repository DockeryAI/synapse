/**
 * Intelligence Explorer Component
 * Left: Clickable clusters, trends, pain points, blind spots
 * Right: Content ideas based on selection
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  Users,
  Target,
  Zap,
  Sparkles,
  ChevronRight,
  Lightbulb,
  FileText,
} from 'lucide-react';
import type { DeepContext } from '@/types/synapse/deepContext.types';

export interface IntelligenceExplorerProps {
  context: DeepContext | null;
  onGenerateContent?: (item: any) => void;
  className?: string;
}

type ExplorerItem = {
  id: string;
  type: 'trend' | 'cluster' | 'pain-point' | 'blind-spot';
  title: string;
  description: string;
  strength?: number;
  impact?: string;
  opportunityScore?: number;
  metadata?: any;
};

type ContentIdea = {
  id: string;
  title: string;
  hook: string;
  angle: string;
  platforms: string[];
  reasoning: string;
};

export const IntelligenceExplorer: React.FC<IntelligenceExplorerProps> = ({
  context,
  onGenerateContent,
  className,
}) => {
  const [selectedItem, setSelectedItem] = React.useState<ExplorerItem | null>(null);
  const [contentIdeas, setContentIdeas] = React.useState<ContentIdea[]>([]);

  // Convert DeepContext to ExplorerItems
  const explorerItems = React.useMemo((): ExplorerItem[] => {
    if (!context) return [];

    const items: ExplorerItem[] = [];

    // Add industry trends
    context.industry?.trends?.forEach((trend, idx) => {
      items.push({
        id: `trend-${idx}`,
        type: 'trend',
        title: trend.trend,
        description: trend.implication || '',
        strength: Math.round((trend.strength || 0) * 100),
        impact: trend.impact,
        metadata: trend,
      });
    });

    // Add customer pain points
    context.customerPsychology?.unarticulated?.forEach((need, idx) => {
      items.push({
        id: `pain-${idx}`,
        type: 'pain-point',
        title: need.need,
        description: need.marketingAngle || '',
        metadata: need,
      });
    });

    // Add competitive blind spots
    context.competitiveIntel?.blindSpots?.forEach((blindSpot, idx) => {
      items.push({
        id: `blindspot-${idx}`,
        type: 'blind-spot',
        title: blindSpot.topic,
        description: blindSpot.actionableInsight || '',
        opportunityScore: blindSpot.opportunityScore,
        metadata: blindSpot,
      });
    });

    // Add content clusters (from opportunities/market gaps)
    // MarketGap type uses 'gap' and 'positioning' (not 'opportunity' and 'approach')
    context.competitiveIntel?.opportunities?.forEach((opp, idx) => {
      items.push({
        id: `cluster-${idx}`,
        type: 'cluster',
        title: opp.gap, // Correct property name from MarketGap type
        description: opp.positioning || '', // Correct property name from MarketGap type
        metadata: opp,
      });
    });

    return items;
  }, [context]);

  // Generate content ideas when an item is selected
  React.useEffect(() => {
    if (!selectedItem) {
      setContentIdeas([]);
      return;
    }

    // Generate contextual content ideas based on item type
    const ideas: ContentIdea[] = [];

    switch (selectedItem.type) {
      case 'trend':
        ideas.push({
          id: 'idea-1',
          title: `Why ${selectedItem.title} Matters Now`,
          hook: `Industry shift alert: ${selectedItem.title.toLowerCase()}`,
          angle: 'Educational thought leadership',
          platforms: ['LinkedIn', 'Blog'],
          reasoning: 'Position as an early adopter and industry expert',
        });
        ideas.push({
          id: 'idea-2',
          title: `How to Capitalize on ${selectedItem.title}`,
          hook: 'Most businesses are missing this opportunity',
          angle: 'Actionable guide',
          platforms: ['Email', 'Newsletter'],
          reasoning: 'Provide practical steps to take advantage',
        });
        ideas.push({
          id: 'idea-3',
          title: `${selectedItem.title}: What You Need to Know`,
          hook: 'Stay ahead of the curve',
          angle: 'Quick industry update',
          platforms: ['Twitter', 'Instagram'],
          reasoning: 'Quick-hit social content for awareness',
        });
        break;

      case 'pain-point':
        ideas.push({
          id: 'idea-1',
          title: `The Hidden Problem: ${selectedItem.title}`,
          hook: 'If you feel this way, you\'re not alone',
          angle: 'Empathy + understanding',
          platforms: ['Blog', 'Facebook'],
          reasoning: 'Connect emotionally by validating their pain',
        });
        ideas.push({
          id: 'idea-2',
          title: `Solving ${selectedItem.title}`,
          hook: 'Here\'s how we help customers overcome this',
          angle: 'Solution-focused case study',
          platforms: ['Landing Page', 'Email'],
          reasoning: 'Direct path from pain to solution',
        });
        ideas.push({
          id: 'idea-3',
          title: `Stop Struggling With ${selectedItem.title}`,
          hook: 'There\'s a better way',
          angle: 'Problem-agitation-solution',
          platforms: ['Video', 'Social Media'],
          reasoning: 'Short-form content addressing frustration',
        });
        break;

      case 'blind-spot':
        ideas.push({
          id: 'idea-1',
          title: `What Competitors Won't Tell You About ${selectedItem.title}`,
          hook: `We're breaking the silence on ${selectedItem.title.toLowerCase()}`,
          angle: 'Competitive differentiation',
          platforms: ['LinkedIn', 'Blog'],
          reasoning: 'Position as the honest, transparent choice',
        });
        ideas.push({
          id: 'idea-2',
          title: `The ${selectedItem.title} Gap: Your Advantage`,
          hook: 'Turn their weakness into your strength',
          angle: 'Strategic positioning',
          platforms: ['Email', 'Webinar'],
          reasoning: 'Deep dive into competitive advantage',
        });
        ideas.push({
          id: 'idea-3',
          title: `${selectedItem.title}: The Untapped Opportunity`,
          hook: 'While others ignore this, we focus on it',
          angle: 'Unique value proposition',
          platforms: ['Landing Page', 'Case Study'],
          reasoning: 'Demonstrate differentiated value',
        });
        break;

      case 'cluster':
        ideas.push({
          id: 'idea-1',
          title: `Content Series: ${selectedItem.title}`,
          hook: 'A comprehensive guide to this opportunity',
          angle: 'Multi-part content pillar',
          platforms: ['Blog', 'Newsletter'],
          reasoning: 'Build authority with in-depth coverage',
        });
        ideas.push({
          id: 'idea-2',
          title: `Quick Win: ${selectedItem.title}`,
          hook: 'Get started with this immediately',
          angle: 'Fast-action content',
          platforms: ['Email', 'Social Media'],
          reasoning: 'Lower barrier to entry with quick tips',
        });
        ideas.push({
          id: 'idea-3',
          title: `${selectedItem.title}: Full Campaign`,
          hook: 'Launch a complete campaign around this theme',
          angle: 'Multi-channel campaign',
          platforms: ['All channels'],
          reasoning: 'Maximize reach with coordinated effort',
        });
        break;
    }

    setContentIdeas(ideas);
  }, [selectedItem]);

  // Get icon and color for item type
  const getItemConfig = (type: ExplorerItem['type']) => {
    switch (type) {
      case 'trend':
        return {
          icon: TrendingUp,
          color: 'text-green-600',
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-700',
        };
      case 'pain-point':
        return {
          icon: Users,
          color: 'text-orange-600',
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          border: 'border-orange-200 dark:border-orange-700',
        };
      case 'blind-spot':
        return {
          icon: Target,
          color: 'text-red-600',
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-700',
        };
      case 'cluster':
        return {
          icon: Zap,
          color: 'text-blue-600',
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-700',
        };
    }
  };

  if (!context) {
    return (
      <div className={cn('h-full flex items-center justify-center bg-white dark:bg-slate-900 p-6', className)}>
        <div className="text-center">
          <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Intelligence Data
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Generate intelligence to explore insights
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('h-full flex', className)}>
      {/* Left Panel: Explorer Items */}
      <div className="w-1/2 flex flex-col bg-gray-50 dark:bg-slate-950 border-r border-gray-200 dark:border-slate-700">
        <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Intelligence Library
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {explorerItems.length} items • Click to explore
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Group by type */}
          {['trend', 'pain-point', 'blind-spot', 'cluster'].map((type) => {
            const items = explorerItems.filter((i) => i.type === type);
            if (items.length === 0) return null;

            const typeLabel = {
              trend: 'Industry Trends',
              'pain-point': 'Customer Pain Points',
              'blind-spot': 'Competitive Blind Spots',
              cluster: 'Content Clusters',
            }[type];

            return (
              <div key={type}>
                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
                  {typeLabel}
                </h4>
                <div className="space-y-2">
                  {items.map((item) => {
                    const config = getItemConfig(item.type);
                    const Icon = config.icon;
                    const isSelected = selectedItem?.id === item.id;

                    return (
                      <motion.div
                        key={item.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <button
                          onClick={() => setSelectedItem(item)}
                          className={cn(
                            'w-full text-left p-3 rounded-lg border transition-all',
                            config.bg,
                            config.border,
                            isSelected
                              ? 'ring-2 ring-purple-500 shadow-md'
                              : 'hover:shadow-sm'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', config.color)} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {item.title}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-1">
                                {item.description}
                              </p>
                              {item.strength && (
                                <Badge className="mt-2 text-xs">{item.strength}% strength</Badge>
                              )}
                              {item.opportunityScore && (
                                <Badge className="mt-2 text-xs">{item.opportunityScore} score</Badge>
                              )}
                            </div>
                            <ChevronRight
                              className={cn(
                                'w-4 h-4 text-gray-400 transition-transform',
                                isSelected && 'rotate-90'
                              )}
                            />
                          </div>
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Panel: Content Ideas */}
      <div className="w-1/2 flex flex-col bg-white dark:bg-slate-900">
        <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Content Ideas
            </h3>
          </div>
          {selectedItem && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Based on: {selectedItem.title}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            {!selectedItem ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full text-center"
              >
                <FileText className="w-16 h-16 text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Select an item to see content ideas
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={selectedItem.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {contentIdeas.map((idea, idx) => (
                  <motion.div
                    key={idea.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-purple-600">{idx + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                              {idea.title}
                            </h4>
                            <p className="text-xs text-gray-700 dark:text-gray-300 italic mb-2">
                              "{idea.hook}"
                            </p>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                {idea.angle}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {idea.platforms.map((platform) => (
                                <span
                                  key={platform}
                                  className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
                                >
                                  {platform}
                                </span>
                              ))}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              💡 {idea.reasoning}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default IntelligenceExplorer;
