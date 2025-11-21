/**
 * Your Mix - Selected insights panel with compatibility indicators
 */

import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Trash2, FileText, Zap, ChevronDown, ChevronUp, Mail, BookOpen, Newspaper, Globe, TrendingUp, CheckCircle2, Shield, Heart, Database } from 'lucide-react';
import type { InsightCard } from './types';
import { contentSynthesis, type SynthesizedContent } from '@/services/intelligence/content-synthesis.service';
import type { DeepContext } from '@/types/synapse/deepContext.types';

export interface YourMixProps {
  selectedInsights: InsightCard[];
  context: DeepContext;
  onRemove: (insightId: string) => void;
  onClear: () => void;
  onGenerate: () => void;
}

interface ContentPreview {
  title: string;
  hook: string;
  body: string[];
  cta: string;
}

type ContentType = 'post' | 'blog' | 'newsletter' | 'email' | 'landing-page' | 'campaign';

export function YourMix({ selectedInsights, context, onRemove, onClear, onGenerate }: YourMixProps) {
  const hasSelection = selectedInsights.length > 0;
  const [showContentMenu, setShowContentMenu] = useState(false);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [synthesizedContent, setSynthesizedContent] = useState<SynthesizedContent | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // Synthesize content when insights change
  useEffect(() => {
    if (selectedInsights.length > 0) {
      setIsSynthesizing(true);
      contentSynthesis.synthesizeContent(selectedInsights, context)
        .then(content => {
          setSynthesizedContent(content);
          setIsSynthesizing(false);
        })
        .catch(error => {
          console.error('[YourMix] Synthesis error:', error);
          setIsSynthesizing(false);
        });
    } else {
      setSynthesizedContent(null);
    }
  }, [selectedInsights, context]);

  // Calculate average confidence
  const avgConfidence = hasSelection
    ? selectedInsights.reduce((sum, i) => sum + i.confidence, 0) / selectedInsights.length
    : 0;

  // Calculate compatibility score between two insights
  const calculateCompatibility = (insight1: InsightCard, insight2: InsightCard): number => {
    let score = 50; // Base score

    // Same type insights have moderate synergy
    if (insight1.type === insight2.type) {
      score += 10;
    }

    // High synergy combinations
    if (
      (insight1.type === 'customer' && insight2.type === 'opportunity') ||
      (insight1.type === 'opportunity' && insight2.type === 'customer')
    ) {
      score += 40; // Customer needs + opportunities = excellent combo
    }

    if (
      (insight1.type === 'local' && insight2.type === 'customer') ||
      (insight1.type === 'customer' && insight2.type === 'local')
    ) {
      score += 35; // Local events + customer insights = great timing
    }

    if (
      (insight1.type === 'competition' && insight2.type === 'opportunity') ||
      (insight1.type === 'opportunity' && insight2.type === 'competition')
    ) {
      score += 38; // Competitor gaps + opportunities = strong positioning
    }

    if (
      (insight1.type === 'market' && insight2.type === 'customer') ||
      (insight1.type === 'customer' && insight2.type === 'market')
    ) {
      score += 30; // Market trends + customer needs = relevant content
    }

    // Good fit combinations
    if (
      (insight1.type === 'local' && insight2.type === 'opportunity') ||
      (insight1.type === 'opportunity' && insight2.type === 'local')
    ) {
      score += 25;
    }

    if (
      (insight1.type === 'market' && insight2.type === 'opportunity') ||
      (insight1.type === 'opportunity' && insight2.type === 'market')
    ) {
      score += 20;
    }

    // Time sensitivity bonus
    if (insight1.isTimeSensitive && insight2.isTimeSensitive) {
      score += 10;
    } else if (insight1.isTimeSensitive || insight2.isTimeSensitive) {
      score += 5;
    }

    // Confidence impact
    const avgConfidence = (insight1.confidence + insight2.confidence) / 2;
    score += avgConfidence * 10;

    // Potential conflicts (lower synergy)
    if (insight1.type === 'competition' && insight2.type === 'customer') {
      score -= 10; // Talking about competitors while addressing customer needs can be tricky
    }

    return Math.min(100, Math.max(0, score));
  };

  // Get compatibility color
  const getCompatibilityColor = (score: number): { bg: string; text: string; label: string } => {
    if (score >= 90) {
      return { bg: 'bg-green-500', text: 'text-green-700 dark:text-green-300', label: 'High Synergy' };
    } else if (score >= 70) {
      return { bg: 'bg-yellow-500', text: 'text-yellow-700 dark:text-yellow-300', label: 'Good Fit' };
    } else {
      return { bg: 'bg-red-500', text: 'text-red-700 dark:text-red-300', label: 'Potential Conflict' };
    }
  };

  // Use synthesized content or fallback to simple preview
  const contentPreview = useMemo((): ContentPreview | null => {
    if (!synthesizedContent) return null;

    return {
      title: synthesizedContent.title,
      hook: synthesizedContent.hook,
      body: synthesizedContent.body,
      cta: synthesizedContent.cta
    };
  }, [synthesizedContent]);

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
              className="text-xs text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {selectedInsights.length} selected
        </p>
      </div>

      {/* Selected Insights */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence>
          {selectedInsights.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full text-center p-4"
            >
              <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                <Sparkles className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select insights to start mixing
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {/* Live Content Preview - TOP PRIORITY */}
              {contentPreview && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="relative bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg"
                >
                  {/* Condensed Preview */}
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                          Live Preview
                        </h4>
                      </div>
                      <button
                        onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
                        className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded transition-colors"
                      >
                        {isPreviewExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        )}
                      </button>
                    </div>

                    {/* Condensed Title */}
                    <div className="flex items-start gap-2">
                      <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 flex-1">
                        {contentPreview.title}
                      </p>
                      {/* EQ Score Badge */}
                      {synthesizedContent && (
                        <div className="flex-shrink-0 flex items-center gap-1 px-2 py-1 bg-pink-100 dark:bg-pink-900/30 rounded-full">
                          <Heart className="w-3 h-3 text-pink-600" />
                          <span className="text-xs font-bold text-pink-700 dark:text-pink-300">
                            {synthesizedContent.eqScore}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded Preview Details */}
                  <AnimatePresence>
                    {isPreviewExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden border-t border-blue-200 dark:border-blue-700"
                      >
                        <div className="p-4 space-y-4">
                          {/* Title Section */}
                          <div className="bg-white dark:bg-slate-800 p-3 rounded-lg">
                            <h5 className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-2 uppercase tracking-wider">
                              Title
                            </h5>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {contentPreview.title}
                            </p>
                          </div>

                          {/* Hook Section */}
                          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                            <h5 className="text-xs font-bold text-purple-700 dark:text-purple-300 mb-2 uppercase tracking-wider">
                              Hook
                            </h5>
                            <p className="text-sm italic text-gray-700 dark:text-gray-300">
                              {contentPreview.hook}
                            </p>
                          </div>

                          {/* Body Section */}
                          <div>
                            <h5 className="text-xs font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wider">
                              Key Points
                            </h5>
                            <ul className="space-y-2">
                              {contentPreview.body.map((point, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <Zap className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                  <span className="text-sm text-gray-700 dark:text-gray-300">{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* CTA Section */}
                          <div>
                            <h5 className="text-xs font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wider">
                              Call to Action
                            </h5>
                            <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-center shadow-md">
                              <p className="text-sm font-bold">
                                {contentPreview.cta}
                              </p>
                            </div>
                          </div>

                          {/* Provenance Section */}
                          {synthesizedContent?.provenance && (
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Database className="w-4 h-4 text-blue-600" />
                                  <h5 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                                    Data Provenance
                                  </h5>
                                </div>
                                {/* Validation Badge */}
                                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                                  synthesizedContent.provenance.validation === 'triple-validated'
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                    : synthesizedContent.provenance.validation === 'cross-validated'
                                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                                }`}>
                                  <Shield className="w-3 h-3" />
                                  {synthesizedContent.provenance.validation === 'triple-validated' && '3-Way'}
                                  {synthesizedContent.provenance.validation === 'cross-validated' && '2-Way'}
                                  {synthesizedContent.provenance.validation === 'single-source' && '1-Way'}
                                </div>
                              </div>

                              {/* Sources List */}
                              <div className="space-y-2">
                                {synthesizedContent.provenance.sources.map((source, idx) => (
                                  <div key={idx} className="bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-start gap-2">
                                      <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-gray-900 dark:text-white">
                                          {source.name}
                                        </p>
                                        {source.quote && (
                                          <p className="text-xs text-gray-600 dark:text-gray-400 italic mt-1 line-clamp-2">
                                            "{source.quote}"
                                          </p>
                                        )}
                                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                          Confidence: {Math.round(source.confidence * 100)}%
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Data Points Summary */}
                              <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                                  Based on {synthesizedContent.provenance.dataPoints} data point{synthesizedContent.provenance.dataPoints !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Insights List */}
              <div className="space-y-2">
                {selectedInsights.map((insight, idx) => (
                  <motion.div
                    key={insight.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: idx * 0.03 }}
                    className="relative group"
                  >
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg">
                      {/* Remove Button */}
                      <button
                        onClick={() => onRemove(insight.id)}
                        className="absolute top-2 right-2 p-1 bg-white dark:bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                      </button>

                      {/* Content */}
                      <p className="text-xs font-medium text-gray-900 dark:text-white pr-6 mb-1">
                        {insight.title}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {insight.category}
                        </span>
                        <span className="text-xs font-bold text-purple-600">
                          {Math.round(insight.confidence * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Compatibility Indicator (between insights) */}
                    {idx < selectedInsights.length - 1 && (() => {
                      const nextInsight = selectedInsights[idx + 1];
                      const compatScore = calculateCompatibility(insight, nextInsight);
                      const compat = getCompatibilityColor(compatScore);

                      return (
                        <motion.div
                          initial={{ opacity: 0, scaleY: 0 }}
                          animate={{ opacity: 1, scaleY: 1 }}
                          transition={{ delay: 0.2 }}
                          className="flex items-center justify-center py-2 gap-2"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-1 h-8 ${compat.bg} rounded-full`} />
                            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded px-2 py-1">
                              <p className={`text-xs font-bold ${compat.text}`}>
                                {Math.round(compatScore)}%
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {compat.label}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })()}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer with Stats and Create Now Button */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-slate-700 space-y-3">
        {hasSelection && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400">Avg. Confidence</span>
            <span className="font-bold text-purple-600">
              {Math.round(avgConfidence * 100)}%
            </span>
          </div>
        )}

        {/* Create Now Split Button */}
        <div className="relative">
          <div className="flex gap-1">
            {/* Main Action Button */}
            <motion.button
              whileHover={{ scale: hasSelection ? 1.02 : 1 }}
              whileTap={{ scale: hasSelection ? 0.98 : 1 }}
              onClick={onGenerate}
              disabled={!hasSelection}
              className={`flex-1 py-3 rounded-l-lg font-bold transition-all ${
                hasSelection
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md hover:shadow-lg'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                Create Now
              </span>
            </motion.button>

            {/* Dropdown Toggle */}
            <motion.button
              whileHover={{ scale: hasSelection ? 1.02 : 1 }}
              whileTap={{ scale: hasSelection ? 0.98 : 1 }}
              onClick={() => hasSelection && setShowContentMenu(!showContentMenu)}
              disabled={!hasSelection}
              className={`px-3 rounded-r-lg font-bold transition-all border-l border-white/20 ${
                hasSelection
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md hover:shadow-lg'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed'
              }`}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Content Type Menu */}
          <AnimatePresence>
            {showContentMenu && hasSelection && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-full mb-2 left-0 right-0 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden z-10"
              >
                {[
                  { type: 'post' as ContentType, label: 'Quick Post', icon: FileText, desc: 'Social media post' },
                  { type: 'blog' as ContentType, label: 'Blog', icon: BookOpen, desc: 'Blog article' },
                  { type: 'newsletter' as ContentType, label: 'Newsletter', icon: Newspaper, desc: 'Newsletter content' },
                  { type: 'email' as ContentType, label: 'Email Campaign', icon: Mail, desc: '3-email sequence' },
                  { type: 'landing-page' as ContentType, label: 'Landing Page', icon: Globe, desc: 'Page with talking points' },
                  { type: 'campaign' as ContentType, label: 'Campaign Builder', icon: TrendingUp, desc: 'Multi-channel campaign' },
                ].map((option, idx) => (
                  <button
                    key={option.type}
                    onClick={() => {
                      onGenerate();
                      setShowContentMenu(false);
                      // TODO: Pass content type to onGenerate
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors border-b border-gray-100 dark:border-slate-700 last:border-b-0"
                  >
                    <div className="flex items-start gap-3">
                      <option.icon className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {option.label}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {option.desc}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
