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
import { Zap, Settings, Target, Sparkles, Lightbulb, Database, Package, RefreshCw } from 'lucide-react';
import type { DeepContext } from '@/types/synapse/deepContext.types';
import type { OpportunityAlert } from '@/types/v2/intelligence.types';
import { EasyMode } from './intelligence-v2/EasyMode';
import { PowerMode } from './intelligence-v2/PowerMode';
import { OpportunityRadar } from './OpportunityRadar';
import { AiPicksPanel } from './AiPicksPanel';
import { ProductsTab } from './intelligence-v2/ProductsTab';
import { SegmentAwarePanel } from './SegmentAwarePanel';
import type { SmartPick } from '@/types/smart-picks.types';

// Lazy load heavy components
const IntelligenceExplorer = lazy(() => import('./IntelligenceExplorer').then(m => ({ default: m.IntelligenceExplorer })));
const YourMixPreview = lazy(() => import('./YourMixPreview').then(m => ({ default: m.YourMixPreview })));

export interface IntelligenceLibraryV2Props {
  context: DeepContext;
  onGenerateCampaign: (selectedInsights: string[]) => void;
  onRefreshIntelligence?: () => void;
  isRefreshing?: boolean;
}

type ViewTab = 'opportunities' | 'ai-picks' | 'content-mix' | 'intelligence' | 'products';
type ViewMode = 'easy' | 'power';

const MODE_STORAGE_KEY = 'intelligence_library_mode';
const TAB_STORAGE_KEY = 'intelligence_library_tab';

export function IntelligenceLibraryV2({ context, onGenerateCampaign, onRefreshIntelligence, isRefreshing }: IntelligenceLibraryV2Props) {
  // Load tab from localStorage or default to 'content-mix'
  const [activeTab, setActiveTab] = useState<ViewTab>(() => {
    const stored = localStorage.getItem(TAB_STORAGE_KEY);
    return (stored === 'opportunities' || stored === 'ai-picks' || stored === 'content-mix' || stored === 'intelligence' || stored === 'products') ? stored : 'content-mix';
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

  // Calculate data metrics - use raw data points if available for accurate count
  const rawDataPointCount = context.rawDataPoints?.length || 0;
  const correlatedInsightCount = context.correlatedInsights?.length || 0;
  const breakthroughCount = context.synthesis?.breakthroughs?.length || 0;
  const dataPoints = context.metadata?.dataSourcesUsed?.length || 0;
  const totalInsights = rawDataPointCount > 0 ? rawDataPointCount :
    (context.industry?.trends?.length || 0) +
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

  // Generate AI picks from context insights
  const aiPicks = useMemo((): SmartPick[] => {
    const picks: SmartPick[] = [];
    const uvp = context.business?.uvp;
    const targetCustomer = uvp?.targetCustomer || 'your customers';

    // Create picks based on different insight types
    // Authority Builder - from competitive gaps
    if (context.competitiveIntel?.blindSpots?.length) {
      const blindSpot = context.competitiveIntel.blindSpots[0];
      picks.push({
        id: 'ai-authority-1',
        title: `Position as the Expert: ${blindSpot.topic?.substring(0, 50) || 'Industry Leadership'}`,
        description: `Build authority by addressing what competitors miss. ${blindSpot.actionableInsight || ''}`,
        campaignType: 'authority-builder',
        confidence: 0.85,
        relevance: 0.9,
        timeliness: 0.7,
        evidenceQuality: 0.8,
        overallScore: 0.85,
        insights: [blindSpot.topic || ''],
        dataSources: ['Competitive Analysis'],
        preview: {
          headline: blindSpot.topic || 'Industry Expertise',
          hook: blindSpot.reasoning || 'Why this matters to your customers',
          platform: 'LinkedIn',
        },
        reasoning: `Competitors aren't addressing: ${blindSpot.topic}`,
        expectedPerformance: { engagement: 'high', reach: 'medium', conversions: 'medium' },
        metadata: { generatedAt: new Date() },
      });
    }

    // Problem Solver - from customer psychology
    if (context.customerPsychology?.unarticulated?.length) {
      const need = context.customerPsychology.unarticulated[0];
      picks.push({
        id: 'ai-problem-1',
        title: `Address Hidden Pain: ${need.need?.substring(0, 50) || 'Customer Challenge'}`,
        description: `Create content that speaks directly to ${targetCustomer}'s unspoken needs.`,
        campaignType: 'social-proof',
        confidence: 0.8,
        relevance: 0.85,
        timeliness: 0.65,
        evidenceQuality: 0.75,
        overallScore: 0.78,
        insights: [need.need || ''],
        dataSources: ['Customer Research'],
        preview: {
          headline: need.marketingAngle || need.need || 'Solution for your challenges',
          hook: need.emotionalDriver || 'We understand your frustration',
          platform: 'Facebook',
        },
        reasoning: `${targetCustomer} experience: ${need.need}`,
        expectedPerformance: { engagement: 'high', reach: 'high', conversions: 'medium' },
        metadata: { generatedAt: new Date() },
      });
    }

    // Trend Rider - from market trends
    if (context.industry?.trends?.length) {
      const trend = context.industry.trends.find(t => t.direction === 'rising') || context.industry.trends[0];
      picks.push({
        id: 'ai-trend-1',
        title: `Ride the Wave: ${trend.trend?.substring(0, 50) || 'Market Trend'}`,
        description: `Position as an early adopter of ${trend.trend}. Perfect timing for ${targetCustomer}.`,
        campaignType: 'multi-post',
        confidence: 0.75,
        relevance: 0.8,
        timeliness: 0.9,
        evidenceQuality: 0.7,
        overallScore: 0.8,
        insights: [trend.trend],
        dataSources: [trend.source || 'Industry Research'],
        preview: {
          headline: trend.trend,
          hook: trend.implication || 'Why this matters now',
          platform: 'Twitter',
        },
        reasoning: `Rising trend: ${trend.trend}`,
        expectedPerformance: { engagement: 'medium', reach: 'high', conversions: 'low' },
        metadata: { generatedAt: new Date() },
      });
    }

    // Trust Builder - from opportunities
    if (context.competitiveIntel?.opportunities?.length) {
      const opportunity = context.competitiveIntel.opportunities[0];
      picks.push({
        id: 'ai-trust-1',
        title: `Build Trust: ${opportunity.gap?.substring(0, 50) || 'Customer Confidence'}`,
        description: `Show ${targetCustomer} why they can trust you with ${opportunity.positioning || 'their business'}.`,
        campaignType: 'social-proof',
        confidence: 0.82,
        relevance: 0.88,
        timeliness: 0.6,
        evidenceQuality: 0.8,
        overallScore: 0.77,
        insights: [opportunity.gap || ''],
        dataSources: ['Market Analysis'],
        preview: {
          headline: opportunity.positioning || 'Why customers choose us',
          hook: 'Real results from real customers',
          platform: 'Instagram',
        },
        reasoning: `Market gap: ${opportunity.gap}`,
        expectedPerformance: { engagement: 'high', reach: 'medium', conversions: 'high' },
        metadata: { generatedAt: new Date() },
      });
    }

    // Local Champion - if there are local insights
    const localMoments = context.realTimeCultural?.moments || [];
    if (localMoments.length > 0) {
      const moment = localMoments[0];
      const momentText = typeof moment === 'string' ? moment : moment.description;
      picks.push({
        id: 'ai-local-1',
        title: `Local Relevance: ${momentText?.substring(0, 50) || 'Community Connection'}`,
        description: `Connect with ${targetCustomer} through local relevance and community.`,
        campaignType: 'local-pulse',
        confidence: 0.78,
        relevance: 0.85,
        timeliness: 0.95,
        evidenceQuality: 0.7,
        overallScore: 0.82,
        insights: [momentText || ''],
        dataSources: ['Local Intelligence'],
        preview: {
          headline: momentText || 'Your local solution',
          hook: 'Right here, right now',
          platform: 'Facebook',
        },
        reasoning: `Local opportunity: ${momentText}`,
        expectedPerformance: { engagement: 'high', reach: 'low', conversions: 'high' },
        metadata: { generatedAt: new Date() },
      });
    }

    // Sort by overall score
    return picks.sort((a, b) => b.overallScore - a.overallScore);
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
                <span>{totalInsights} insights from {dataPoints}+ sources</span>
              </div>
              {correlatedInsightCount > 0 && (
                <div className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-medium">
                  {correlatedInsightCount} correlated | {breakthroughCount} breakthroughs
                </div>
              )}
              {onRefreshIntelligence && (
                <button
                  onClick={() => {
                    console.log('[IntelligenceLibrary] 🔄 Force refresh triggered');
                    console.log(`[IntelligenceLibrary] Current stats: ${totalInsights} insights, ${correlatedInsightCount} correlated, ${breakthroughCount} breakthroughs`);
                    onRefreshIntelligence();
                  }}
                  disabled={isRefreshing}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                    isRefreshing
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/30'
                  }`}
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Force Refresh'}
                </button>
              )}
              <div className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs font-bold">
                ✅ v2.2 {new Date().toLocaleTimeString()}
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
          <button
            onClick={() => handleTabChange('products')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
              activeTab === 'products'
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            Products
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Segment-Aware Dashboard Panel (Phase D - Item #32) */}
                <div className="lg:col-span-1">
                  <SegmentAwarePanel context={context} />
                </div>

                {/* Opportunity Radar */}
                <div className="lg:col-span-2">
                  <OpportunityRadar
                    alerts={opportunities}
                    onCreateContent={(alert) => {
                      console.log('[OpportunityRadar] Create content for:', alert);
                      // Future: Trigger content generation flow
                    }}
                    maxVisible={20}
                    hideHidden={true}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'ai-picks' && (
            <motion.div
              key="ai-picks"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full p-6 overflow-auto"
            >
              <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    AI-Recommended Content
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Based on your target customer insights and competitive gaps
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {aiPicks.map((pick) => (
                    <div
                      key={pick.id}
                      className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 cursor-pointer transition-all group"
                      onClick={() => {
                        console.log('[AI Pick] Selected:', pick);
                        handleTabChange('content-mix');
                      }}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${
                          pick.campaignType === 'authority-builder' ? 'from-blue-500 to-blue-600' :
                          pick.campaignType === 'social-proof' ? 'from-yellow-500 to-yellow-600' :
                          pick.campaignType === 'local-pulse' ? 'from-green-500 to-green-600' :
                          'from-purple-500 to-purple-600'
                        } flex items-center justify-center`}>
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 line-clamp-2">
                            {pick.title}
                          </h4>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {pick.campaignType.replace('-', ' ')}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {pick.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 w-20">
                            <div
                              className="bg-purple-600 h-1.5 rounded-full"
                              style={{ width: `${pick.overallScore * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{Math.round(pick.overallScore * 100)}%</span>
                        </div>
                        <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                          {pick.preview?.platform || 'Multi-platform'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {aiPicks.length === 0 && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Loading AI recommendations...</p>
                  </div>
                )}
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

          {activeTab === 'products' && (
            <motion.div
              key="products"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full p-6 overflow-auto"
            >
              <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Product Catalog
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your products and services extracted from UVP onboarding. Select products to create targeted content.
                  </p>
                </div>
                <ProductsTab
                  brandId={context.business?.profile?.id || ''}
                  onSelectProduct={(product) => {
                    console.log('[Products] Selected:', product);
                  }}
                  onPromoteProduct={(product) => {
                    console.log('[Products] Promote:', product);
                    // Switch to content-mix tab to create content for this product
                    handleTabChange('content-mix');
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
