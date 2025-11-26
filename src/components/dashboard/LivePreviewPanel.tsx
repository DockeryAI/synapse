/**
 * Live Preview Panel
 * Right 40% panel showing real-time content preview as insights are selected
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  FileText,
  ChevronDown,
  ChevronUp,
  Check,
  AlertCircle,
  Target,
  Zap,
  Clock,
  TrendingUp,
} from 'lucide-react';
import type { OpportunityAlert } from '@/types/v2/intelligence.types';
import type { SmartPick } from '@/types/smart-picks.types';

export interface SelectedInsight {
  id: string;
  type: 'opportunity' | 'ai-pick' | 'intelligence';
  title: string;
  description: string;
  content?: {
    headline?: string;
    hook?: string;
    body?: string;
    cta?: string;
  };
  source?: string;
  metadata?: Record<string, any>;
}

export interface LivePreviewPanelProps {
  selectedInsights: SelectedInsight[];
  onCreateContent?: () => void;
  onCreateCampaign?: () => void;
  className?: string;
}

export const LivePreviewPanel: React.FC<LivePreviewPanelProps> = ({
  selectedInsights,
  onCreateContent,
  onCreateCampaign,
  className,
}) => {
  const [showProvenance, setShowProvenance] = React.useState(false);

  // Generate combined preview from selected insights
  const combinedPreview = React.useMemo(() => {
    if (selectedInsights.length === 0) {
      return null;
    }

    const hasOpportunity = selectedInsights.some(i => i.type === 'opportunity');
    const hasAIPick = selectedInsights.some(i => i.type === 'ai-pick');
    const hasIntelligence = selectedInsights.some(i => i.type === 'intelligence');

    // Generate real article title
    const mainInsight = selectedInsights[0];
    const title = selectedInsights.length === 1
      ? mainInsight.title
      : `${mainInsight.title}${selectedInsights.length > 1 ? `: ${selectedInsights.length} Insights Combined` : ''}`;

    // Generate opening hook paragraph
    const hook = hasOpportunity
      ? `While your competitors miss this opportunity, you can stand out by addressing what customers really want. ${mainInsight.description}`
      : hasAIPick
      ? `This campaign combines proven strategies with timely insights to maximize engagement. ${mainInsight.description}`
      : `Here's what the data reveals: ${mainInsight.description}`;

    // Generate body with actual points
    const bodyPoints = selectedInsights.map((insight, idx) => {
      if (insight.type === 'opportunity') {
        return `**Gap Analysis**: ${insight.description} - Your competitors aren't addressing this, giving you a clear differentiation opportunity.`;
      } else if (insight.type === 'ai-pick') {
        return `**Strategic Approach**: ${insight.content?.hook || insight.description}`;
      } else {
        return `**Key Insight #${idx + 1}**: ${insight.description}`;
      }
    });

    // Extract key points with source attribution
    const keyPoints = selectedInsights.map(insight => ({
      point: insight.description,
      source: insight.source || insight.type,
    }));

    // Generate specific CTA
    const cta = hasOpportunity && hasAIPick
      ? 'Launch this campaign now to capture market share before competitors catch on.'
      : hasOpportunity
      ? 'Act on this competitive gap today - share this insight across your channels.'
      : hasAIPick
      ? 'Start this campaign to engage your audience with proven strategies.'
      : 'Turn these insights into compelling content your audience will love.';

    // Recommend platforms based on content type
    const platforms = [];
    if (hasOpportunity) {
      platforms.push({ name: 'LinkedIn', reason: 'Professional audience values competitive insights' });
      platforms.push({ name: 'Blog', reason: 'Long-form analysis of market gaps' });
    }
    if (hasAIPick) {
      platforms.push({ name: 'Email', reason: 'Campaign sequence for nurturing' });
      platforms.push({ name: 'Social Media', reason: 'Multi-post campaign rollout' });
    }
    if (hasIntelligence || platforms.length === 0) {
      platforms.push({ name: 'Twitter', reason: 'Quick industry insights' });
      platforms.push({ name: 'LinkedIn', reason: 'Thought leadership positioning' });
      platforms.push({ name: 'Blog', reason: 'Deep-dive analysis' });
    }

    return {
      title,
      hook,
      bodyPoints,
      keyPoints,
      cta,
      platforms: platforms.slice(0, 3), // Top 3 recommended
    };
  }, [selectedInsights]);

  return (
    <div className={cn('h-full flex flex-col bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-700', className)}>
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Live Preview
            </h2>
          </div>
          {selectedInsights.length > 0 && (
            <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700">
              {selectedInsights.length} selected
            </Badge>
          )}
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          {selectedInsights.length === 0
            ? 'Click insights to build content'
            : 'Real-time preview of combined content'}
        </p>
      </div>

      {/* Content Preview */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {selectedInsights.length === 0 ? (
            /* Empty State */
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full flex items-center justify-center"
            >
              <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Start Building Content
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Click on opportunities, AI picks, or intelligence items to see them combined here in real-time
                </p>
                <div className="space-y-2 text-left bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
                  <div className="flex items-start gap-2 text-xs">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Smart compatibility checking shows which insights work together
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-xs">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">
                      See complete content with title, hook, key points, and CTA
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-xs">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">
                      View source data and provenance for full transparency
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Preview Content */
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Combined Title */}
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                  Content Title
                </label>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                  {combinedPreview?.title}
                </h3>
              </div>

              {/* Hook */}
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                  Opening Hook
                </label>
                <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                  {combinedPreview?.hook}
                </p>
              </div>

              {/* Body Description */}
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                  Content Body
                </label>
                <div className="space-y-2">
                  {combinedPreview?.bodyPoints.map((point, idx) => (
                    <p key={idx} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {point}
                    </p>
                  ))}
                </div>
              </div>

              {/* Platform Recommendations */}
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                  Recommended Platforms
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {combinedPreview?.platforms.map((platform, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg"
                    >
                      <div className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded flex items-center justify-center text-xs font-bold mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                          {platform.name}
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          {platform.reason}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Points with Source Attribution */}
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 block">
                  Key Points
                </label>
                <div className="space-y-3">
                  {combinedPreview?.keyPoints.map((point, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700"
                    >
                      <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white mb-1">
                          {point.point}
                        </p>
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                            From: {point.source}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Call-to-Action */}
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                  Call-to-Action
                </label>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700 rounded-lg">
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                    {combinedPreview?.cta}
                  </p>
                </div>
              </div>

              {/* Data Provenance (Expandable) */}
              <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
                <button
                  onClick={() => setShowProvenance(!showProvenance)}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Source Data & Provenance
                    </span>
                  </div>
                  {showProvenance ? (
                    <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  )}
                </button>

                <AnimatePresence>
                  {showProvenance && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 space-y-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                        {selectedInsights.map((insight, idx) => (
                          <div
                            key={insight.id}
                            className="p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg"
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                {insight.title}
                              </h4>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-xs capitalize',
                                  insight.type === 'opportunity' && 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700',
                                  insight.type === 'ai-pick' && 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700',
                                  insight.type === 'intelligence' && 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                                )}
                              >
                                {insight.type}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                              {insight.description}
                            </p>
                            {insight.source && (
                              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <Clock className="w-3 h-3" />
                                <span>Source: {insight.source}</span>
                              </div>
                            )}
                            {insight.metadata && Object.keys(insight.metadata).length > 0 && (
                              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(insight.metadata).slice(0, 3).map(([key, value]) => (
                                    <span
                                      key={key}
                                      className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 rounded"
                                    >
                                      {key}: {String(value).slice(0, 20)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Metrics Preview */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Impact</span>
                  </div>
                  <p className="text-lg font-bold text-blue-900 dark:text-blue-100">High</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-medium text-green-700 dark:text-green-300">Urgency</span>
                  </div>
                  <p className="text-lg font-bold text-green-900 dark:text-green-100">
                    {selectedInsights.some(i => i.type === 'opportunity') ? 'Now' : 'Medium'}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Quality</span>
                  </div>
                  <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                    {selectedInsights.length >= 2 ? 'A+' : 'A'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      {selectedInsights.length > 0 && (
        <div className="flex-shrink-0 p-6 border-t border-gray-200 dark:border-slate-700 space-y-3">
          <Button
            onClick={onCreateContent}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            size="lg"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Create Content Now
          </Button>
          <Button
            onClick={onCreateCampaign}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <FileText className="w-4 h-4 mr-2" />
            Build Full Campaign
          </Button>
        </div>
      )}
    </div>
  );
};

export default LivePreviewPanel;
