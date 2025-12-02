/**
 * Easy Mode - V5 One-Click Campaign Generation
 *
 * Phase 8: Wired to useV5EasyModeGeneration for full V5 content engine.
 * Auto-loads context and generates 4-week campaign with content mix strategy.
 *
 * Updated: 2025-12-01
 */

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  TrendingUp,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  BarChart3,
  Target,
  Save
} from 'lucide-react';
import type { DeepContext } from '@/types/synapse/deepContext.types';
import { useV5EasyModeGeneration, type CampaignPost } from '@/hooks/useV5EasyModeGeneration';
import { ScoreDisplayPanel } from '@/components/v5/ScoreDisplayPanel';
import { CampaignPreviewModal } from '@/components/v5/CampaignPreviewModal';

export interface EasyModeProps {
  context: DeepContext;
  onGenerate: (selectedInsights: string[]) => void;
}

export function EasyMode({ context, onGenerate }: EasyModeProps) {
  const [showResults, setShowResults] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // V5 Easy Mode hook
  const {
    isGenerating,
    error,
    contextStatus,
    campaign,
    generateFullCampaign,
    clearCampaign,
    clearError,
  } = useV5EasyModeGeneration();

  // Extract brand info from context
  const brandId = context.business?.profile?.id || 'default-brand';
  const industrySlug = context.business?.profile?.industry;

  // Derive EQ score from breakthroughs (same logic as V4PowerModePanel)
  const derivedEqScore = useMemo(() => {
    const breakthroughs = context.synthesis?.breakthroughs || [];
    if (breakthroughs.length === 0) return undefined;
    const maxEq = Math.max(...breakthroughs.map(b => b.eqScore || 0));
    return maxEq > 0 ? maxEq : undefined;
  }, [context.synthesis?.breakthroughs]);

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

  // Calculate campaign stats
  const campaignStats = useMemo(() => {
    if (campaign.length === 0) return null;
    const totalScore = campaign.reduce((sum, p) => sum + (p.content?.score?.total || 0), 0);
    const avgScore = Math.round(totalScore / campaign.length);
    const platforms = new Set(campaign.map(p => p.platform));
    const contentTypes = new Set(campaign.map(p => p.contentType));
    return {
      totalPosts: campaign.length,
      avgScore,
      platforms: platforms.size,
      contentTypes: contentTypes.size,
      weeks: Math.max(...campaign.map(p => p.week)),
    };
  }, [campaign]);

  const handleGenerate = async () => {
    clearError();
    clearCampaign();
    setShowResults(true);

    const result = await generateFullCampaign({
      brandId,
      industrySlug,
      eqScore: derivedEqScore,
      weeks: 4,
      postsPerWeek: 4,
    });

    if (result.success) {
      // Also call the parent onGenerate for compatibility
      onGenerate([]);
    }
  };

  const handleReset = () => {
    clearCampaign();
    clearError();
    setShowResults(false);
  };

  // Show results view after generation starts
  if (showResults) {
    return (
      <div className="h-full flex flex-col p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl w-full mx-auto flex-1 flex flex-col"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {isGenerating ? 'Generating Your Campaign...' : error ? 'Generation Error' : 'Campaign Generated!'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {isGenerating
                ? `Creating ${campaign.length > 0 ? campaign.length : '...'} posts across 4 weeks`
                : error
                ? error
                : `${campaignStats?.totalPosts || 0} posts ready for your calendar`}
            </p>
          </div>

          {/* Progress / Results */}
          <div className="flex-1 overflow-auto">
            {isGenerating ? (
              // Loading state with progress
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-8">
                {/* Context Loading */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Loading Context ({contextStatus.completeness}%)
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {['Industry', 'UVP', 'EQ', 'Intelligence'].map((item, idx) => {
                      const loaded = [
                        contextStatus.industryLoaded,
                        contextStatus.uvpLoaded,
                        contextStatus.eqLoaded,
                        contextStatus.intelligenceLoaded,
                      ][idx];
                      return (
                        <div
                          key={item}
                          className={`px-3 py-2 rounded-lg text-xs font-medium text-center ${
                            loaded
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500'
                          }`}
                        >
                          {loaded && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                          {item}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Post Progress */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Generating Posts
                    </span>
                    <span className="text-sm text-purple-600 font-bold">
                      {campaign.length} / 16
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${(campaign.length / 16) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  {/* Live post feed */}
                  {campaign.length > 0 && (
                    <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                      <AnimatePresence mode="popLayout">
                        {campaign.slice(-3).map((post, idx) => (
                          <motion.div
                            key={`${post.week}-${post.day}-${post.platform}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex items-center gap-3 px-3 py-2 bg-gray-50 dark:bg-slate-800 rounded-lg text-sm"
                          >
                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span className="text-gray-500 dark:text-gray-400">Week {post.week}, Day {post.day}</span>
                            <span className="capitalize font-medium text-gray-700 dark:text-gray-300">{post.platform}</span>
                            <span className="text-xs text-purple-600 ml-auto">
                              Score: {post.content?.score?.total || '--'}
                            </span>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            ) : error ? (
              // Error state
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-700 dark:text-red-400 mb-4">{error}</p>
                <button
                  onClick={handleReset}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : campaignStats ? (
              // Success state with results
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4 text-center">
                    <Calendar className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{campaignStats.weeks}</div>
                    <div className="text-xs text-gray-500">Weeks</div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4 text-center">
                    <Sparkles className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{campaignStats.totalPosts}</div>
                    <div className="text-xs text-gray-500">Posts</div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4 text-center">
                    <BarChart3 className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{campaignStats.avgScore}</div>
                    <div className="text-xs text-gray-500">Avg Score</div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4 text-center">
                    <Target className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{campaignStats.platforms}</div>
                    <div className="text-xs text-gray-500">Platforms</div>
                  </div>
                </div>

                {/* Campaign Preview */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Campaign Preview</h3>
                  <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(week => (
                      <div key={week} className="space-y-2">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Week {week}
                        </div>
                        {campaign
                          .filter(p => p.week === week)
                          .map(post => (
                            <div
                              key={`${post.week}-${post.day}`}
                              className="px-2 py-1.5 bg-gray-50 dark:bg-slate-800 rounded text-xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="capitalize font-medium text-gray-700 dark:text-gray-300">
                                  {post.platform}
                                </span>
                                <span className={`font-bold ${
                                  (post.content?.score?.total || 0) >= 75
                                    ? 'text-green-600'
                                    : (post.content?.score?.total || 0) >= 50
                                    ? 'text-amber-600'
                                    : 'text-red-600'
                                }`}>
                                  {post.content?.score?.total || '--'}
                                </span>
                              </div>
                              <div className="text-gray-500 dark:text-gray-500 capitalize truncate">
                                {post.contentType}
                              </div>
                            </div>
                          ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* First Post Score Preview */}
                {campaign[0]?.content?.score && (
                  <ScoreDisplayPanel
                    score={campaign[0].content.score}
                    isCompact={true}
                    showHints={false}
                    className="max-w-md"
                  />
                )}

                {/* Actions */}
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Generate New Campaign
                  </button>
                  <button
                    onClick={() => setShowPreviewModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors flex items-center gap-2 font-medium"
                  >
                    <Save className="w-5 h-5" />
                    Save to Calendar
                  </button>
                </div>
              </div>
            ) : null}

            {/* Campaign Preview Modal */}
            <CampaignPreviewModal
              isOpen={showPreviewModal}
              onClose={() => setShowPreviewModal(false)}
              campaign={campaign}
              brandId={brandId}
              onSaveComplete={(savedCount) => {
                setShowPreviewModal(false);
              }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  // Default landing view
  return (
    <div className="h-full flex items-center justify-center p-8">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-2xl w-full"
      >
        {/* Main Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-12 text-center border border-gray-200 dark:border-slate-700">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mb-6">
            <Sparkles className="w-10 h-10 text-white" />
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Your AI Strategy for Today
          </h2>

          {/* Description */}
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            We've analyzed your business intelligence and selected the most impactful insights.
            Click below to generate your complete 4-week campaign strategy.
          </p>

          {/* V5 Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 border border-purple-200 dark:border-purple-700 rounded-full text-sm text-purple-700 dark:text-purple-300 mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="font-medium">V5 Content Engine</span>
            <span className="text-purple-500">|</span>
            <span>6-Dimension Scoring</span>
          </div>

          {/* Generate Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full max-w-md mx-auto py-6 px-8 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xl font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="flex items-center justify-center gap-3">
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  Generate My Campaign
                </>
              )}
            </span>
          </motion.button>

          {/* Stats */}
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <TrendingUp className="w-4 h-4" />
                <span>
                  <strong className="text-gray-900 dark:text-white">{insightCount}</strong> insights
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Sparkles className="w-4 h-4" />
                <span>
                  <strong className="text-gray-900 dark:text-white">{sourceCount}</strong> sources
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
        </div>

        {/* Hint Text */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-500 mt-6">
          Want more control? Switch to Power Mode using the toggle above.
        </p>
      </motion.div>
    </div>
  );
}
