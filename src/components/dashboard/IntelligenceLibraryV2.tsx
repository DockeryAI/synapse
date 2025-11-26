/**
 * Intelligence Library V2 - "The Simple Power"
 *
 * Four tabs:
 * - Opportunities: Opportunity radar with competitive gaps
 * - AI Picks: Pre-generated campaign and content recommendations
 * - Content Mix: Intelligence insights with "Your Mix" preview
 * - Intelligence: Explore trends, clusters, pain points with content ideas
 *
 * Mode preference persists across sessions
 */

import React, { useState, useEffect, lazy, Suspense, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Settings, Target, Sparkles, Lightbulb, Database } from 'lucide-react';
import type { DeepContext } from '@/types/synapse/deepContext.types';
import type { OpportunityAlert } from '@/types/v2/intelligence.types';
import { EasyMode } from './intelligence-v2/EasyMode';
import { PowerMode } from './intelligence-v2/PowerMode';
import { OpportunityRadar } from './OpportunityRadar';

// Lazy load heavy components
const IntelligenceExplorer = lazy(() => import('./IntelligenceExplorer').then(m => ({ default: m.IntelligenceExplorer })));
const YourMixPreview = lazy(() => import('./YourMixPreview').then(m => ({ default: m.YourMixPreview })));

export interface IntelligenceLibraryV2Props {
  context: DeepContext;
  onGenerateCampaign: (selectedInsights: string[]) => void;
}

type ViewTab = 'opportunities' | 'ai-picks' | 'content-mix' | 'intelligence';
type ViewMode = 'easy' | 'power';

const MODE_STORAGE_KEY = 'intelligence_library_mode';
const TAB_STORAGE_KEY = 'intelligence_library_tab';

export function IntelligenceLibraryV2({ context, onGenerateCampaign }: IntelligenceLibraryV2Props) {
  // Load tab from localStorage or default to 'content-mix'
  const [activeTab, setActiveTab] = useState<ViewTab>(() => {
    const stored = localStorage.getItem(TAB_STORAGE_KEY);
    return (stored === 'opportunities' || stored === 'ai-picks' || stored === 'content-mix' || stored === 'intelligence') ? stored : 'content-mix';
  });

  // Load mode from localStorage or default to 'power'
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const stored = localStorage.getItem(MODE_STORAGE_KEY);
    return (stored === 'easy' || stored === 'power') ? stored : 'power';
  });

  // Persist tab changes to localStorage
  const handleTabChange = (tab: ViewTab) => {
    setActiveTab(tab);
    localStorage.setItem(TAB_STORAGE_KEY, tab);
  };

  // Persist mode changes to localStorage
  const handleModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  };

  // Calculate data metrics
  const dataPoints = context.metadata?.dataSourcesUsed?.length || 0;
  const totalInsights = (context.industry?.trends?.length || 0) +
    (context.customerPsychology?.unarticulated?.length || 0) +
    (context.competitiveIntel?.blindSpots?.length || 0);

  // Generate opportunity alerts from context
  const opportunities = useMemo((): OpportunityAlert[] => {
    const alerts: OpportunityAlert[] = [];

    // Convert blind spots into competitor-gap opportunities
    // Type uses 'topic' and 'reasoning'/'actionableInsight' (not 'blindSpot' and 'gap')
    context.competitiveIntel?.blindSpots?.forEach((blindSpot, idx) => {
      alerts.push({
        id: `blindspot-${idx}`,
        tier: 'high-value',
        title: blindSpot.topic, // Correct property name
        description: blindSpot.reasoning || blindSpot.actionableInsight || 'Competitive opportunity identified',
        source: 'competitor-gap',
        urgencyScore: blindSpot.opportunityScore || 75,
        potentialImpact: 80,
        relevanceScore: 85,
        suggestedTemplates: ['Authority Builder', 'Education First', 'Comparison Campaign'],
        suggestedTriggers: [],
        detectedAt: blindSpot.timestamp || new Date().toISOString(),
        metadata: {
          reasoning: blindSpot.actionableInsight || `Capitalize on this blind spot opportunity`,
          evidence: Array.isArray(blindSpot.evidence) ? blindSpot.evidence : [blindSpot.evidence].filter(Boolean) as string[],
          sourceLabel: blindSpot.source || 'Competitive Analysis',
          competitorData: {
            competitor: 'Competitors',
            gap: blindSpot.reasoning || blindSpot.topic
          }
        }
      });
    });

    // Convert emerging trends into market-shift opportunities
    context.industry?.trends?.filter(t => t.direction === 'rising').forEach((trend, idx) => {
      const urgency = trend.strength > 0.8 ? 85 : 65;
      alerts.push({
        id: `trend-${idx}`,
        tier: trend.strength > 0.8 ? 'urgent' : 'high-value',
        title: trend.trend,
        description: trend.implication || 'Emerging market opportunity',
        source: 'market-shift',
        urgencyScore: urgency,
        potentialImpact: trend.impact === 'high' ? 90 : 70,
        relevanceScore: Math.round(trend.strength * 100),
        suggestedTemplates: ['PAS Series', 'Product Launch', 'Seasonal Urgency'],
        suggestedTriggers: [],
        detectedAt: trend.timestamp || new Date().toISOString(),
        metadata: {
          reasoning: trend.implication || 'Position as an early adopter and industry expert',
          evidence: [trend.source || 'Industry analysis'],
          sourceLabel: trend.source || 'Market Research',
          sourceDate: trend.timestamp || new Date().toISOString(),
          trendData: {
            volume: Math.round(trend.strength * 1000),
            growth: trend.strength * 100,
            peak: trend.timeframe
          }
        }
      });
    });

    // Convert unarticulated needs into customer-pain opportunities
    // Type uses 'marketingAngle' and 'approach' (not 'underlyingDesire' and 'contentOpportunity')
    context.customerPsychology?.unarticulated?.forEach((need, idx) => {
      alerts.push({
        id: `pain-${idx}`,
        tier: 'evergreen',
        title: need.need,
        description: need.emotionalDriver || need.marketingAngle || need.need,
        source: 'customer-pain',
        urgencyScore: 60,
        potentialImpact: 75,
        relevanceScore: Math.round((need.confidence || 0.7) * 100),
        suggestedTemplates: ['Trust Ladder', 'Hero\'s Journey', 'Social Proof'],
        suggestedTriggers: [],
        detectedAt: need.timestamp || new Date().toISOString(),
        metadata: {
          reasoning: need.marketingAngle || need.approach || 'Address this unmet customer need to build trust and authority',
          evidence: Array.isArray(need.evidence) ? need.evidence : [need.evidence].filter(Boolean) as string[],
          sourceLabel: need.source || 'Customer Psychology Analysis'
        }
      });
    });

    return alerts;
  }, [context]);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-slate-800">
      {/* Header with Tab Navigation */}
      <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Intelligence Library
              </h2>
              {context.business?.profile?.name && (
                <span className="text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-3 py-1 rounded-full">
                  {context.business.profile.name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 mt-1">
              <div className="flex items-center gap-1">
                <Database className="w-3 h-3" />
                <span>{totalInsights} insights from {dataPoints}+ data sources</span>
              </div>
              <div className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs font-bold">
                ✅ UPDATED - v2.1 {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>

          {/* Mode Toggle Switch - Only show for Content Mix */}
          {activeTab === 'content-mix' && (
            <div className="flex items-center gap-3 bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => handleModeChange('easy')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                  viewMode === 'easy'
                    ? 'bg-white dark:bg-slate-700 text-purple-600 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Zap className="w-4 h-4" />
                Easy Mode
              </button>
              <button
                onClick={() => handleModeChange('power')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                  viewMode === 'power'
                    ? 'bg-white dark:bg-slate-700 text-purple-600 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4" />
                Power Mode
              </button>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTabChange('opportunities')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
              activeTab === 'opportunities'
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
          >
            <Target className="w-4 h-4" />
            Opportunities
          </button>
          <button
            onClick={() => handleTabChange('ai-picks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
              activeTab === 'ai-picks'
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            AI Picks
          </button>
          <button
            onClick={() => handleTabChange('content-mix')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
              activeTab === 'content-mix'
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            Content Mix
          </button>
          <button
            onClick={() => handleTabChange('intelligence')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
              activeTab === 'intelligence'
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            Intelligence
          </button>
        </div>
      </div>

      {/* Content Area - Switches between tabs */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'opportunities' && (
            <motion.div
              key="opportunities"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full p-6 overflow-auto"
            >
              <OpportunityRadar
                alerts={opportunities}
                onCreateContent={(alert) => {
                  console.log('[OpportunityRadar] Create content for:', alert);
                  // Future: Trigger content generation flow
                }}
                maxVisible={20}
                hideHidden={true}
              />
            </motion.div>
          )}

          {activeTab === 'ai-picks' && (
            <motion.div
              key="ai-picks"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full p-6"
            >
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                AI Picks Tab - Coming Soon
              </div>
            </motion.div>
          )}

          {activeTab === 'content-mix' && viewMode === 'easy' && (
            <motion.div
              key="easy-mode"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full"
            >
              <EasyMode context={context} onGenerate={onGenerateCampaign} />
            </motion.div>
          )}

          {activeTab === 'content-mix' && viewMode === 'power' && (
            <motion.div
              key="power-mode"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full"
            >
              <PowerMode context={context} onGenerate={onGenerateCampaign} />
            </motion.div>
          )}

          {activeTab === 'intelligence' && (
            <motion.div
              key="intelligence"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full"
            >
              <Suspense fallback={
                <div className="h-full flex items-center justify-center">
                  <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
                </div>
              }>
                <IntelligenceExplorer
                  context={context}
                  onGenerateContent={() => {}}
                />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
