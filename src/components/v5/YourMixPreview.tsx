/**
 * Your Mix Preview Component - V5 Standalone Version
 *
 * Right sidebar panel showing selected insights and generated content.
 * Matches V4 YourMixPreview design with:
 * - Selected insights list with remove functionality
 * - AI suggestions section (optional)
 * - Generated content preview with expandable details
 * - Generate button with loading state
 * - Average confidence display
 *
 * Created: 2025-12-01
 */

import React, { useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  X,
  Loader2,
  ChevronUp,
  ChevronDown,
  FileText,
  Lightbulb,
  Check,
  Save,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Insight } from './InsightCards';

// ============================================================================
// TYPES
// ============================================================================

export interface GeneratedContentPreview {
  headline: string;
  hook: string;
  body: string;
  cta: string;
  score: {
    total: number;
    breakdown?: {
      relevance?: number;
      emotion?: number;
      clarity?: number;
      cta?: number;
    };
  };
}

export interface SuggestionItem {
  id: string;
  reason: string;
  insight: Insight;
}

export type PsychologyFramework = 'AIDA' | 'PAS' | 'BAB' | 'FAB' | '4Ps';

export interface YourMixPreviewProps {
  selectedInsights: Insight[];
  generatedContent?: GeneratedContentPreview | null;
  isGenerating?: boolean;
  framework?: PsychologyFramework;
  onRemove: (id: string) => void;
  onClear: () => void;
  onGenerate: () => void;
  onSave?: () => void;
  /** AI-suggested insights */
  suggestions?: SuggestionItem[];
  isLoadingSuggestions?: boolean;
  onAcceptSuggestion?: (id: string) => void;
  onDismissSuggestion?: (id: string) => void;
}

// ============================================================================
// TYPE CONFIG FOR INSIGHT COLORS
// ============================================================================

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  trigger: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-800' },
  proof: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-800' },
  trend: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
  competitor: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' },
  local: { bg: 'bg-cyan-50 dark:bg-cyan-900/20', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-200 dark:border-cyan-800' },
  weather: { bg: 'bg-sky-50 dark:bg-sky-900/20', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-800' },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const YourMixPreview = memo(function YourMixPreview({
  selectedInsights,
  generatedContent,
  isGenerating = false,
  framework = 'AIDA',
  onRemove,
  onClear,
  onGenerate,
  onSave,
  suggestions = [],
  isLoadingSuggestions = false,
  onAcceptSuggestion,
  onDismissSuggestion,
}: YourMixPreviewProps) {
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const hasSelection = selectedInsights.length > 0;

  // Calculate average confidence
  const avgConfidence = useMemo(() => {
    if (!hasSelection) return 0;
    const total = selectedInsights.reduce((sum, insight) => {
      const conf = 'confidence' in insight ? (insight as any).confidence :
                   'relevanceScore' in insight ? (insight as any).relevanceScore :
                   'qualityScore' in insight ? (insight as any).qualityScore : 50;
      return sum + conf;
    }, 0);
    return total / selectedInsights.length;
  }, [selectedInsights, hasSelection]);

  return (
    <div className="h-full bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            Your Mix
          </h3>
          {hasSelection && (
            <button
              onClick={onClear}
              className="text-xs text-gray-600 dark:text-gray-400 hover:text-red-600 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Clear all
            </button>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {selectedInsights.length} selected
          </p>
          <span className="text-xs font-medium text-purple-600 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">
            {framework}
          </span>
        </div>
      </div>

      {/* AI Suggestions Section */}
      {(suggestions.length > 0 || isLoadingSuggestions) && (
        <div className="flex-shrink-0 border-b border-gray-200 dark:border-slate-700">
          <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                AI Suggestions
              </span>
              {isLoadingSuggestions && (
                <Loader2 className="w-3 h-3 text-amber-600 animate-spin ml-auto" />
              )}
            </div>
            {suggestions.length > 0 ? (
              <div className="space-y-2">
                {suggestions.map((suggestion) => (
                  <motion.div
                    key={suggestion.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="p-2 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700/50 rounded-lg"
                  >
                    <p className="text-xs font-medium text-gray-900 dark:text-white mb-1">
                      {suggestion.insight.text.substring(0, 60)}...
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 italic mb-2">
                      "{suggestion.reason}"
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onAcceptSuggestion?.(suggestion.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 rounded transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        Accept
                      </button>
                      <button
                        onClick={() => onDismissSuggestion?.(suggestion.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded transition-colors"
                      >
                        <X className="w-3 h-3" />
                        Dismiss
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : isLoadingSuggestions ? (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Finding complementary insights...
              </p>
            ) : null}
          </div>
        </div>
      )}

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <AnimatePresence mode="wait">
            {!hasSelection ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-8 text-center"
              >
                <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                  <Sparkles className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Select insights or choose a template
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Generation Loading */}
                {isGenerating && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          Generating with V5 Engine...
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Synthesizing {selectedInsights.length} insights
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Generated Content Preview */}
                {generatedContent && !isGenerating && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg"
                  >
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                            Live Preview
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            generatedContent.score.total >= 80
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : generatedContent.score.total >= 60
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                          }`}>
                            {generatedContent.score.total}/100
                          </span>
                          <button
                            onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
                            className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded"
                          >
                            {isPreviewExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2">
                        {generatedContent.headline}
                      </p>
                    </div>

                    <AnimatePresence>
                      {isPreviewExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-blue-200 dark:border-blue-700"
                        >
                          <div className="p-4 space-y-3">
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                              <h5 className="text-xs font-bold text-purple-700 dark:text-purple-300 mb-1 uppercase">
                                Hook
                              </h5>
                              <p className="text-sm italic text-gray-700 dark:text-gray-300">
                                {generatedContent.hook}
                              </p>
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-gray-900 dark:text-white mb-1 uppercase">
                                Body
                              </h5>
                              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {generatedContent.body}
                              </p>
                            </div>
                            <div className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-center">
                              <p className="text-sm font-bold">{generatedContent.cta}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* Selected Insights List */}
                <div className="space-y-2">
                  {selectedInsights.map((insight) => {
                    const colors = TYPE_COLORS[insight.type] || TYPE_COLORS.trigger;
                    return (
                      <motion.div
                        key={insight.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="relative group"
                      >
                        <div className={`p-3 ${colors.bg} border ${colors.border} rounded-lg`}>
                          <button
                            onClick={() => onRemove(insight.id)}
                            className="absolute top-2 right-2 p-1 bg-white dark:bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                          >
                            <X className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                          </button>
                          <p className="text-xs font-medium text-gray-900 dark:text-white pr-6 mb-1 line-clamp-2">
                            {insight.text}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className={`text-xs capitalize ${colors.text}`}>
                              {insight.type}
                            </span>
                            {insight.source && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {insight.source}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-slate-700 space-y-3">
        {hasSelection && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400">Avg. Confidence</span>
            <span className="font-bold text-purple-600">{Math.round(avgConfidence)}%</span>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={onGenerate}
            disabled={!hasSelection || isGenerating}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate
              </>
            )}
          </Button>
          {generatedContent && onSave && (
            <Button variant="outline" onClick={onSave} className="flex-shrink-0">
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

export default YourMixPreview;
