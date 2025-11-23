/**
 * AI Picks Panel
 *
 * Left sidebar showing top AI-recommended campaigns and content
 * Compact, scrollable list of smart picks
 * Collapsible with state persistence
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, FileText, ArrowRight, Sparkles, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Star, MapPin, Grid, Zap, Clock, Rocket, Eye, BarChart3, Loader2 } from 'lucide-react';
import type { SmartPick } from '@/types/smart-picks.types';
import { CAMPAIGN_TYPES } from '@/types/smart-picks.types';

const COLLAPSED_KEY = 'ai_picks_collapsed';

// Helper functions for beautiful displays
function getUrgencyConfig(urgency?: 'low' | 'medium' | 'high' | 'critical') {
  switch (urgency) {
    case 'critical':
      return {
        icon: Zap,
        label: 'URGENT',
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-100 dark:bg-red-900/30',
        pulse: true,
        message: 'Launch within 24h for max impact'
      };
    case 'high':
      return {
        icon: Clock,
        label: 'This Week',
        color: 'text-orange-600 dark:text-orange-400',
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        pulse: false,
        message: 'Best executed this week'
      };
    case 'medium':
      return {
        icon: TrendingUp,
        label: 'Strategic',
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        pulse: false,
        message: 'Plan for next 2 weeks'
      };
    default:
      return {
        icon: Star,
        label: 'Evergreen',
        color: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-100 dark:bg-green-900/30',
        pulse: false,
        message: 'Use anytime'
      };
  }
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.85) return 'text-green-600 dark:text-green-400';
  if (confidence >= 0.70) return 'text-blue-600 dark:text-blue-400';
  if (confidence >= 0.60) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-gray-600 dark:text-gray-400';
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.85) return 'Very High';
  if (confidence >= 0.70) return 'High';
  if (confidence >= 0.60) return 'Good';
  return 'Moderate';
}

export interface AiPicksPanelProps {
  campaignPicks: SmartPick[];
  contentPicks: SmartPick[];
  onPickClick: (pick: SmartPick) => void;
  onViewMore?: () => void;
}

export function AiPicksPanel({ campaignPicks, contentPicks, onPickClick, onViewMore }: AiPicksPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    const stored = localStorage.getItem(COLLAPSED_KEY);
    return stored === 'true';
  });
  const [expandedPick, setExpandedPick] = useState<string | null>(null);

  const handleToggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem(COLLAPSED_KEY, String(newState));
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedPick(expandedPick === id ? null : id);
  };

  const getCampaignTypeColor = (type: SmartPick['campaignType']) => {
    const colors = {
      'authority-builder': 'from-blue-500 to-blue-600',
      'social-proof': 'from-yellow-500 to-yellow-600',
      'local-pulse': 'from-green-500 to-green-600',
      'multi-post': 'from-purple-500 to-purple-600',
      'single-post': 'from-gray-500 to-gray-600',
    };
    return colors[type] || colors['single-post'];
  };

  const getCampaignTypeIcon = (type: SmartPick['campaignType']) => {
    const icons = {
      'authority-builder': TrendingUp,
      'social-proof': Star,
      'local-pulse': MapPin,
      'multi-post': Grid,
      'single-post': FileText,
    };
    return icons[type] || FileText;
  };

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? '60px' : '300px' }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="h-full flex flex-col bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 relative"
    >
      {/* Collapse/Expand Button */}
      <button
        onClick={handleToggleCollapse}
        className="absolute top-4 -right-3 z-10 w-6 h-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-full flex items-center justify-center hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-700 transition-all shadow-sm"
        title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
      >
        {isCollapsed ? (
          <ChevronRight className="w-3 h-3 text-gray-600 dark:text-gray-400" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-gray-600 dark:text-gray-400" />
        )}
      </button>

      <AnimatePresence mode="wait">
        {isCollapsed ? (
          /* Collapsed View */
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full flex flex-col items-center py-4 gap-6"
          >
            {/* Vertical AI Picks Label */}
            <div className="flex flex-col items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <div
                className="text-xs font-semibold text-gray-900 dark:text-white tracking-wider"
                style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
              >
                AI PICKS
              </div>
            </div>

            {/* Campaign Count Badge */}
            {campaignPicks.length > 0 && (
              <div className="flex flex-col items-center gap-1">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                  {campaignPicks.length}
                </span>
              </div>
            )}

            {/* Content Count Badge */}
            {contentPicks.length > 0 && (
              <div className="flex flex-col items-center gap-1">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                  {contentPicks.length}
                </span>
              </div>
            )}
          </motion.div>
        ) : (
          /* Expanded View */
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full flex flex-col"
          >
            {/* Header */}
            <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-purple-600 rounded-lg">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  AI Marketing Command
                </h2>
              </div>
              <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                Your AI discovered <span className="text-purple-700 dark:text-purple-300 font-bold">{campaignPicks.length + contentPicks.length}</span> breakthrough opportunities
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Ready to launch with one click
              </p>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Empty State */}
              {campaignPicks.length === 0 && contentPicks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center animate-pulse">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                    AI Analyzing Your Business
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 text-center max-w-[200px]">
                    Your AI is discovering breakthrough opportunities from 200+ data points. This takes 30-60 seconds.
                  </p>
                  <div className="mt-4 flex flex-col gap-2 w-full">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Analyzing customer reviews</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Finding competitor gaps</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Discovering market trends</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Campaign Picks */}
              {campaignPicks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Campaigns
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {campaignPicks.slice(0, 3).map((pick, idx) => {
                      const isExpanded = expandedPick === pick.id;
                      const gradientColor = getCampaignTypeColor(pick.campaignType);
                      const campaignTypeInfo = CAMPAIGN_TYPES[pick.campaignType];
                      const urgency = getUrgencyConfig(pick.urgencyLevel);
                      const UrgencyIcon = urgency.icon;
                      const confidenceColor = getConfidenceColor(pick.confidence);
                      const confidenceLabel = getConfidenceLabel(pick.confidence);

                      return (
                        <motion.div
                          key={pick.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="relative bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-200 dark:border-purple-700 rounded-xl hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg transition-all overflow-hidden"
                        >
                          {/* Urgency Strip (if critical/high) */}
                          {urgency.pulse && (
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 animate-pulse" />
                          )}

                          <button
                            onClick={() => onPickClick(pick)}
                            className="w-full text-left p-3"
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 text-white text-xs font-bold flex items-center justify-center shadow-md">
                                  {idx + 1}
                                </span>
                                {/* Urgency Badge */}
                                <div className={`flex items-center gap-1 px-2 py-0.5 ${urgency.bg} rounded-full ${urgency.pulse ? 'animate-pulse' : ''}`}>
                                  <UrgencyIcon className={`w-3 h-3 ${urgency.color}`} />
                                  <span className={`text-xs font-bold ${urgency.color}`}>
                                    {urgency.label}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1 line-clamp-2 leading-snug">
                                {pick.title}
                              </h4>

                              {/* Campaign Type Badge */}
                              <div className={`inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r ${gradientColor} rounded-full mb-2`}>
                                <span className="text-xs font-bold text-white">
                                  {campaignTypeInfo.name}
                                </span>
                              </div>

                              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                                {pick.description}
                              </p>

                              {/* AI Confidence + Quick Stats */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  <Sparkles className={`w-3 h-3 ${confidenceColor}`} />
                                  <span className={`text-xs font-bold ${confidenceColor}`}>
                                    AI: {Math.round(pick.confidence * 100)}%
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {confidenceLabel}
                                  </span>
                                </div>
                                {pick.dataSources && pick.dataSources.length > 0 && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {pick.dataSources.length} sources
                                  </span>
                                )}
                              </div>

                              {/* Quick Action Hint */}
                              <div className="mt-2 flex items-center gap-1 text-purple-600 dark:text-purple-400">
                                <Rocket className="w-3 h-3" />
                                <span className="text-xs font-medium">Click to launch</span>
                              </div>
                            </div>
                          </button>

                          {/* Expand Button */}
                          <button
                            onClick={(e) => toggleExpand(pick.id, e)}
                            className="absolute bottom-2 right-2 p-1 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            )}
                          </button>

                          {/* Expanded Details */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden border-t-2 border-purple-200 dark:border-purple-700 bg-white/50 dark:bg-slate-900/50"
                              >
                                <div className="p-4 space-y-3">
                                  {/* Urgency Message */}
                                  {urgency.message && (
                                    <div className={`${urgency.bg} ${urgency.color} px-3 py-2 rounded-lg`}>
                                      <p className="text-xs font-semibold flex items-center gap-1">
                                        <UrgencyIcon className="w-3 h-3" />
                                        {urgency.message}
                                      </p>
                                    </div>
                                  )}

                                  {/* Performance Metrics */}
                                  {pick.performanceMetrics && pick.performanceMetrics.length > 0 && (
                                    <div>
                                      <div className="flex items-center gap-1 mb-2">
                                        <BarChart3 className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                                        <p className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                                          Expected Performance:
                                        </p>
                                      </div>
                                      <div className="space-y-2">
                                        {pick.performanceMetrics.map((metric, i) => (
                                          <div key={i} className="bg-gray-100 dark:bg-slate-800 rounded-lg p-2">
                                            <div className="flex items-center justify-between mb-1">
                                              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                {metric.metric}
                                              </span>
                                              <span className="text-xs font-bold text-green-600 dark:text-green-400">
                                                {metric.value}
                                              </span>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                              {metric.comparison}
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Preview */}
                                  {pick.preview && (
                                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-3">
                                      <div className="flex items-center gap-1 mb-2">
                                        <Eye className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                                        <p className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                                          Content Preview:
                                        </p>
                                      </div>
                                      <p className="text-xs text-gray-900 dark:text-white font-bold mb-1">
                                        {pick.preview.headline}
                                      </p>
                                      <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                                        "{pick.preview.hook}"
                                      </p>
                                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                                        Platform: {pick.preview.platform}
                                      </p>
                                    </div>
                                  )}

                                  {/* Reasoning */}
                                  {pick.reasoning && (
                                    <div>
                                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Why This Works:
                                      </p>
                                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                        {pick.reasoning}
                                      </p>
                                    </div>
                                  )}

                                  {/* Data Sources */}
                                  {pick.dataSources && pick.dataSources.length > 0 && (
                                    <div>
                                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Validated By:
                                      </p>
                                      <div className="flex flex-wrap gap-1">
                                        {pick.dataSources.map((source, i) => (
                                          <span key={i} className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                                            {source}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Content Picks */}
              {contentPicks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Content
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {contentPicks.slice(0, 3).map((pick, idx) => {
                      const isExpanded = expandedPick === pick.id;
                      const gradientColor = getCampaignTypeColor(pick.campaignType);
                      const campaignTypeInfo = CAMPAIGN_TYPES[pick.campaignType];
                      const urgency = getUrgencyConfig(pick.urgencyLevel);
                      const UrgencyIcon = urgency.icon;
                      const confidenceColor = getConfidenceColor(pick.confidence);
                      const confidenceLabel = getConfidenceLabel(pick.confidence);

                      return (
                        <motion.div
                          key={pick.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (campaignPicks.length + idx) * 0.05 }}
                          className="relative bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all overflow-hidden"
                        >
                          {urgency.pulse && (
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 animate-pulse" />
                          )}

                          <button
                            onClick={() => onPickClick(pick)}
                            className="w-full text-left p-3"
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white text-xs font-bold flex items-center justify-center shadow-md">
                                  {idx + 1}
                                </span>
                                <div className={`flex items-center gap-1 px-2 py-0.5 ${urgency.bg} rounded-full ${urgency.pulse ? 'animate-pulse' : ''}`}>
                                  <UrgencyIcon className={`w-3 h-3 ${urgency.color}`} />
                                  <span className={`text-xs font-bold ${urgency.color}`}>
                                    {urgency.label}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1 line-clamp-2 leading-snug">
                                {pick.title}
                              </h4>

                              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                                {pick.description}
                              </p>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  <Sparkles className={`w-3 h-3 ${confidenceColor}`} />
                                  <span className={`text-xs font-bold ${confidenceColor}`}>
                                    AI: {Math.round(pick.confidence * 100)}%
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {confidenceLabel}
                                  </span>
                                </div>
                                {pick.dataSources && pick.dataSources.length > 0 && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {pick.dataSources.length} sources
                                  </span>
                                )}
                              </div>

                              <div className="mt-2 flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                <Eye className="w-3 h-3" />
                                <span className="text-xs font-medium">Click to preview</span>
                              </div>
                            </div>
                          </button>

                          {/* Expand Button */}
                          <button
                            onClick={(e) => toggleExpand(pick.id, e)}
                            className="absolute bottom-2 right-2 p-1 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            )}
                          </button>

                          {/* Expanded Details */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden border-t border-blue-200 dark:border-blue-700"
                              >
                                <div className="p-4 space-y-3">
                                  {/* Preview */}
                                  {pick.preview && (
                                    <div>
                                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">
                                        Preview:
                                      </p>
                                      <p className="text-xs text-gray-900 dark:text-white font-medium">
                                        {pick.preview.headline}
                                      </p>
                                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                        {pick.preview.hook}
                                      </p>
                                    </div>
                                  )}

                                  {/* Reasoning */}
                                  {pick.reasoning && (
                                    <div>
                                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Why This Works:
                                      </p>
                                      <p className="text-xs text-gray-600 dark:text-gray-400">
                                        {pick.reasoning}
                                      </p>
                                    </div>
                                  )}

                                  {/* Expected Performance */}
                                  {pick.expectedPerformance && (
                                    <div>
                                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Expected Performance:
                                      </p>
                                      <div className="flex gap-2">
                                        <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                          Engagement: {pick.expectedPerformance.engagement}
                                        </span>
                                        <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                                          Reach: {pick.expectedPerformance.reach}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* View More Footer */}
            {onViewMore && (
              <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-slate-700">
                <button
                  onClick={onViewMore}
                  className="w-full py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                >
                  View All Recommendations
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
