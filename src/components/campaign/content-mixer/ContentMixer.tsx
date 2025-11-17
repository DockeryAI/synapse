/**
 * Content Mixer - Simplified Click-to-Select Interface
 *
 * Much simpler UX:
 * - Left: Grid of insight cards (click to add)
 * - Right: Selected insights + Generate button
 * - Visual, intuitive, no drag-and-drop confusion
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, X, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CategorizedInsight, InsightPool as InsightPoolType, InsightCategory } from '@/types/content-mixer.types';

interface ContentMixerProps {
  pool: InsightPoolType;
  onGenerate: (selectedInsights: CategorizedInsight[]) => void | Promise<void>;
  maxInsights?: number;
}

const categoryIcons: Record<InsightCategory, string> = {
  local: '📍',
  trending: '🔥',
  seasonal: '🌸',
  industry: '💼',
  reviews: '⭐',
  competitive: '⚔️'
};

const categoryColors: Record<InsightCategory, string> = {
  local: 'from-green-500 to-emerald-600',
  trending: 'from-red-500 to-orange-600',
  seasonal: 'from-pink-500 to-purple-600',
  industry: 'from-blue-500 to-indigo-600',
  reviews: 'from-yellow-500 to-amber-600',
  competitive: 'from-violet-500 to-purple-600'
};

export function ContentMixer({ pool, onGenerate, maxInsights = 5 }: ContentMixerProps) {
  const [selectedInsights, setSelectedInsights] = useState<CategorizedInsight[]>([]);
  const [activeCategory, setActiveCategory] = useState<InsightCategory>('trending');
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

  // Get all insights from pool for active category
  const categoryInsights = pool.byCategory[activeCategory] || [];

  // Toggle insight selection
  const toggleInsight = (insight: CategorizedInsight) => {
    const isSelected = selectedInsights.some(i => i.id === insight.id);

    if (isSelected) {
      setSelectedInsights(prev => prev.filter(i => i.id !== insight.id));
    } else if (selectedInsights.length < maxInsights) {
      setSelectedInsights(prev => [...prev, insight]);
    }
  };

  const isSelected = (insightId: string) => selectedInsights.some(i => i.id === insightId);
  const canGenerate = selectedInsights.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 py-6 border-b border-purple-200 dark:border-purple-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg">
                <Sparkles className="text-white" size={28} />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Content Mixer
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Select {maxInsights} insights to build your campaign
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {selectedInsights.length}/{maxInsights}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">insights selected</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Insight Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Category Tabs */}
            <Card className="bg-white dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Choose Your Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-6">
                  {(Object.keys(pool.byCategory) as InsightCategory[]).map(category => {
                    const count = pool.countByCategory[category] || 0;
                    if (count === 0) return null;

                    return (
                      <button
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        className={`
                          px-4 py-2 rounded-lg font-medium transition-all
                          ${activeCategory === category
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg scale-105'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                          }
                        `}
                      >
                        <span className="mr-2">{categoryIcons[category]}</span>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                        <Badge variant="secondary" className="ml-2 bg-white/20">
                          {count}
                        </Badge>
                      </button>
                    );
                  })}
                </div>

                {/* Insight Cards Grid */}
                <div className="space-y-3">
                  <AnimatePresence mode="wait">
                    {categoryInsights.map((insight, index) => {
                      const selected = isSelected(insight.id);
                      const isFull = selectedInsights.length >= maxInsights && !selected;

                      const isExpanded = expandedInsight === insight.id;

                      return (
                        <motion.div
                          key={insight.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.05 }}
                          className={`
                            w-full rounded-xl border-2 transition-all overflow-hidden
                            ${selected
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg'
                              : isFull
                                ? 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 opacity-50'
                                : 'border-gray-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md'
                            }
                          `}
                        >
                          {/* Main Card - Clickable to select */}
                          <button
                            onClick={() => !isFull && toggleInsight(insight)}
                            disabled={isFull}
                            className="w-full text-left p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-2xl">{categoryIcons[insight.category]}</span>
                                  <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {insight.displayTitle}
                                  </h3>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                  {insight.insight}
                                </p>
                                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                  <span>📊 {insight.dataSource}</span>
                                  <span>•</span>
                                  <span>✨ {Math.round(insight.confidence * 100)}% confidence</span>
                                </div>
                              </div>

                              {/* Selection Indicator */}
                              <motion.div
                                initial={false}
                                animate={{ scale: selected ? 1 : 0.8 }}
                                className={`
                                  w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                                  ${selected
                                    ? 'bg-gradient-to-br from-purple-600 to-blue-600'
                                    : 'bg-gray-200 dark:bg-slate-700'
                                  }
                                `}
                              >
                                {selected ? (
                                  <Check className="text-white" size={18} />
                                ) : (
                                  <span className="text-gray-400 dark:text-gray-500 text-xs">
                                    {selectedInsights.length + 1 <= maxInsights && !isFull ? selectedInsights.length + 1 : ''}
                                  </span>
                                )}
                              </motion.div>
                            </div>
                          </button>

                          {/* Expand/Collapse Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedInsight(isExpanded ? null : insight.id);
                            }}
                            className="w-full px-4 py-2 text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-colors flex items-center justify-center gap-2"
                          >
                            {isExpanded ? '▲ Hide Details' : '▼ Show Psychological Triggers & Narrative'}
                          </button>

                          {/* Expanded Details */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="border-t border-purple-200 dark:border-purple-700 bg-white/50 dark:bg-slate-800/50"
                              >
                                <div className="p-4 space-y-3">
                                  {/* Why Profound */}
                                  <div>
                                    <h4 className="text-xs font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wide mb-1">
                                      🧠 Psychological Trigger
                                    </h4>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                      {insight.whyProfound}
                                    </p>
                                  </div>

                                  {/* Why Now */}
                                  <div>
                                    <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wide mb-1">
                                      ⏰ Urgency Factor
                                    </h4>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                      {insight.whyNow}
                                    </p>
                                  </div>

                                  {/* Content Angle */}
                                  <div>
                                    <h4 className="text-xs font-bold text-green-900 dark:text-green-300 uppercase tracking-wide mb-1">
                                      📝 Content Angle
                                    </h4>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                      {insight.contentAngle}
                                    </p>
                                  </div>

                                  {/* Expected Reaction */}
                                  <div>
                                    <h4 className="text-xs font-bold text-orange-900 dark:text-orange-300 uppercase tracking-wide mb-1">
                                      💭 Expected Reaction
                                    </h4>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                      {insight.expectedReaction}
                                    </p>
                                  </div>

                                  {/* Evidence */}
                                  {insight.evidence && insight.evidence.length > 0 && (
                                    <div>
                                      <h4 className="text-xs font-bold text-gray-900 dark:text-gray-300 uppercase tracking-wide mb-1">
                                        📚 Evidence
                                      </h4>
                                      <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                        {insight.evidence.map((ev, i) => (
                                          <li key={i} className="flex items-start gap-2">
                                            <span className="text-purple-500">•</span>
                                            <span>{ev}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {categoryInsights.length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <Zap className="mx-auto mb-3 opacity-50" size={48} />
                      <p>No insights available in this category</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Selected Insights + Generate */}
          <div className="space-y-6">
            <Card className="bg-white dark:bg-slate-800 sticky top-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-gray-900 dark:text-white">Your Selection</CardTitle>
                  {selectedInsights.length > 0 && (
                    <button
                      onClick={() => setSelectedInsights([])}
                      className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Selected Insights */}
                <AnimatePresence mode="popLayout">
                  {selectedInsights.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-8 text-gray-500 dark:text-gray-400"
                    >
                      <Sparkles className="mx-auto mb-3 opacity-50" size={48} />
                      <p className="text-sm">Select insights to get started</p>
                    </motion.div>
                  ) : (
                    selectedInsights.map((insight, index) => (
                      <motion.div
                        key={insight.id}
                        initial={{ opacity: 0, scale: 0.8, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className="relative p-3 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700"
                      >
                        <div className="flex items-start gap-2">
                          <div className={`
                            w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
                            bg-gradient-to-br ${categoryColors[insight.category]} text-white text-xs font-bold
                          `}>
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                              {insight.displayTitle}
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                              {insight.insight}
                            </p>
                          </div>
                          <button
                            onClick={() => toggleInsight(insight)}
                            className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 flex items-center justify-center transition-colors"
                          >
                            <X size={14} className="text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>

                {/* Generate Button */}
                <Button
                  size="lg"
                  disabled={!canGenerate}
                  onClick={() => onGenerate(selectedInsights)}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {canGenerate ? (
                    <>
                      <Zap className="mr-2" size={18} />
                      Generate Campaign
                      <ArrowRight className="ml-2" size={18} />
                    </>
                  ) : (
                    'Select at least 1 insight'
                  )}
                </Button>

                {canGenerate && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-center text-gray-600 dark:text-gray-400"
                  >
                    AI will create content based on your {selectedInsights.length} selected insight{selectedInsights.length > 1 ? 's' : ''}
                  </motion.p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
