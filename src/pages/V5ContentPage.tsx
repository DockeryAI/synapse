/**
 * V5 Content Generation Page
 *
 * Main page for V5 Synapse Content Engine after UVP completion.
 * 3-Column Layout matching V4 design:
 * - Left: UVP Building Blocks sidebar (280px)
 * - Center: Insight Tabs with cards
 * - Right: YourMix Preview panel (320px)
 *
 * Created: 2025-12-01
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Volume2,
  RefreshCw,
  Zap,
  Target,
  BarChart3,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBrand } from '@/hooks/useBrand';
import { getUVPByBrand, recoverDriversFromSession, scanBrandWebsiteForVoice } from '@/services/database/marba-uvp.service';
import { getGenerationStats } from '@/services/v5/ai-enhancer.service';

// V5 Components
import { UVPBuildingBlocks } from '@/components/v5/UVPBuildingBlocks';
import { InsightTabs, type EnabledTabs, type UVPData } from '@/components/v5/InsightTabs';
import { type Insight } from '@/components/v5/InsightCards';
import { YourMixPreview, type GeneratedContentPreview, type PsychologyFramework } from '@/components/v5/YourMixPreview';
import { ContentToolbar, type Platform, type FunnelStage, type InsightRecipe } from '@/components/v5/ContentToolbar';

import type { CompleteUVP } from '@/types/uvp-flow.types';

// V5 Insight Loader Service - connects to real data sources via edge functions
import { insightLoaderService, type LoadedInsights } from '@/services/v5/insight-loader.service';

// Default enabled tabs - will be overridden by industry profile
const DEFAULT_ENABLED_TABS: EnabledTabs = {
  triggers: true,
  proof: true,
  trends: true,
  conversations: true,
  competitors: true,
  local: false,
  weather: false,
};

// Recipe presets from V4 - one-click content configuration
const TEMPLATE_RECIPES: InsightRecipe[] = [
  {
    id: 'authority',
    name: 'Authority Builder',
    description: 'Build credibility and expertise with data-driven content',
    emoji: '🎯',
    insightTypes: ['trends', 'gaps', 'proof'],
    minInsights: 3,
    maxInsights: 6,
    primaryFramework: 'AIDA',
    targetFunnelStage: 'TOFU',
    suggestedPlatforms: { b2b: ['linkedin'], b2c: ['facebook', 'instagram'] },
    compatibleTemplates: ['Authority Builder', 'Education First', 'Comparison Campaign'],
  },
  {
    id: 'trust',
    name: 'Trust Builder',
    description: 'Build customer confidence with social proof and stories',
    emoji: '🤝',
    insightTypes: ['conversations', 'proof'],
    minInsights: 3,
    maxInsights: 5,
    primaryFramework: 'StoryBrand',
    targetFunnelStage: 'MOFU',
    suggestedPlatforms: { b2b: ['linkedin', 'facebook'], b2c: ['instagram', 'facebook'] },
    compatibleTemplates: ['Social Proof', 'Trust Ladder', "Hero's Journey"],
  },
  {
    id: 'problem-solver',
    name: 'Problem Solver',
    description: 'Address pain points directly with PAS framework',
    emoji: '💡',
    insightTypes: ['triggers', 'conversations', 'gaps'],
    minInsights: 3,
    maxInsights: 6,
    primaryFramework: 'PAS',
    targetFunnelStage: 'TOFU',
    suggestedPlatforms: { b2b: ['linkedin', 'twitter'], b2c: ['facebook', 'instagram'] },
    compatibleTemplates: ['PAS Series', 'BAB Campaign', 'Quick Win'],
  },
];

// ============================================================================
// CONTEXT STATUS DISPLAY
// ============================================================================

function ContextStatusDisplay({ uvp, industrySlug, eqScore }: { uvp: CompleteUVP | null; industrySlug?: string; eqScore?: number }) {
  const status = useMemo(() => [
    { label: 'UVP', loaded: !!uvp, icon: Target },
    { label: 'Industry', loaded: !!industrySlug, icon: BarChart3 },
    { label: 'EQ', loaded: eqScore !== undefined, icon: Users },
  ], [uvp, industrySlug, eqScore]);

  const completeness = status.filter(s => s.loaded).length / status.length * 100;

  return (
    <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500">Context Loaded</span>
        <span className="text-xs font-bold text-green-600">{Math.round(completeness)}%</span>
      </div>
      <div className="flex gap-2">
        {status.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${item.loaded ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
              <Icon className="w-3 h-3" />
              {item.label}
              {item.loaded && <CheckCircle2 className="w-3 h-3" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export function V5ContentPage() {
  const navigate = useNavigate();
  const { currentBrand: brand, loading: brandLoading } = useBrand();
  const [uvp, setUvp] = useState<CompleteUVP | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [scanningVoice, setScanningVoice] = useState(false);
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [voiceScanResult, setVoiceScanResult] = useState<{ success: boolean; tone?: string[]; storiesCount?: number; error?: string } | null>(null);

  // Insight state - loaded from real data sources via edge functions
  const [insights, setInsights] = useState<Insight[]>([]);
  const [selectedInsightIds, setSelectedInsightIds] = useState<Set<string>>(new Set());
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [refreshingTab, setRefreshingTab] = useState<string | null>(null);

  // Content generation state
  const [generatedContent, setGeneratedContent] = useState<GeneratedContentPreview | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Toolbar state
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<Platform>>(new Set(['linkedin']));
  const [framework, setFramework] = useState<PsychologyFramework>('AIDA');
  const [funnelStage, setFunnelStage] = useState<FunnelStage>('TOFU');
  const [selectedRecipe, setSelectedRecipe] = useState<InsightRecipe | null>(null);

  // Recipe selection handler - applies recipe's framework, funnel stage, and suggested platforms
  const handleSelectRecipe = useCallback((recipe: InsightRecipe) => {
    setSelectedRecipe(recipe);
    setFramework(recipe.primaryFramework as PsychologyFramework);
    setFunnelStage(recipe.targetFunnelStage as FunnelStage);
    // Apply suggested platforms (use b2b by default, could detect from brand later)
    const suggestedPlatforms = recipe.suggestedPlatforms.b2b || recipe.suggestedPlatforms.b2c || [];
    setSelectedPlatforms(new Set(suggestedPlatforms as Platform[]));
  }, []);

  const handleClearRecipe = useCallback(() => {
    setSelectedRecipe(null);
    // Reset to defaults
    setFramework('AIDA');
    setFunnelStage('TOFU');
    setSelectedPlatforms(new Set(['linkedin']));
  }, []);

  const stats = getGenerationStats();
  const industrySlug = uvp?.targetCustomer?.industry?.toLowerCase().replace(/\s+/g, '-') || undefined;
  const eqScore = brand?.eqScore || undefined;
  const selectedInsights = useMemo(() => insights.filter(i => selectedInsightIds.has(i.id)), [insights, selectedInsightIds]);

  // Load UVP
  useEffect(() => {
    async function loadUVP() {
      if (brandLoading) return;
      if (!brand?.id) { setError('No brand selected'); setLoading(false); return; }

      try {
        let uvpData = await getUVPByBrand(brand.id);
        if (!uvpData) { setError('No UVP found. Please complete the onboarding first.'); setLoading(false); return; }

        const hasDrivers = (uvpData.targetCustomer?.emotionalDrivers?.length || 0) > 0 || (uvpData.transformationGoal?.emotionalDrivers?.length || 0) > 0;
        if (!hasDrivers) {
          const recoveryResult = await recoverDriversFromSession(brand.id);
          if (recoveryResult.updated) uvpData = await getUVPByBrand(brand.id) || uvpData;
        }
        setUvp(uvpData);
        setLoading(false);
      } catch (err) {
        setError('Failed to load UVP data');
        setLoading(false);
      }
    }
    loadUVP();
  }, [brand?.id, brandLoading]);

  // Load insights from real data sources after UVP is loaded
  // Use refs to prevent re-initialization
  const hasInitializedRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (!brand?.id || !uvp) return;

    // CRITICAL: Only initialize ONCE per brand - prevents API calls on every re-render
    // Using a ref survives re-renders, and the service singleton survives HMR
    if (hasInitializedRef.current === brand.id) {
      console.log('[V5ContentPage] Already initialized for this brand, just subscribing');
      // Still need to subscribe to get updates
      const unsubscribe = insightLoaderService.subscribe((data: LoadedInsights) => {
        setInsights(data.insights);
        setIsLoadingInsights(data.loading);
      });
      return () => unsubscribe();
    }

    console.log('[V5ContentPage] First-time initialization for brand:', brand.id);
    hasInitializedRef.current = brand.id;

    // Initialize the insight loader with brand and UVP context
    insightLoaderService.initialize({
      brandId: brand.id,
      brand,
      uvp,
      enabledTabs: DEFAULT_ENABLED_TABS,
    });

    // Subscribe to insight updates
    const unsubscribe = insightLoaderService.subscribe((data: LoadedInsights) => {
      setInsights(data.insights);
      setIsLoadingInsights(data.loading);
    });

    // Start loading all insights - this will use cache if available
    insightLoaderService.loadAllInsights();

    // Cleanup on unmount - DON'T clear insights, keep them cached
    return () => {
      unsubscribe();
      // DO NOT call insightLoaderService.clear() - we want to keep the data cached
    };
  }, [brand?.id, uvp]);

  const handleToggleInsight = useCallback((insightId: string) => {
    setSelectedInsightIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(insightId)) newSet.delete(insightId);
      else newSet.add(insightId);
      return newSet;
    });
  }, []);

  const handleRemoveInsight = useCallback((insightId: string) => {
    setSelectedInsightIds(prev => { const newSet = new Set(prev); newSet.delete(insightId); return newSet; });
  }, []);

  const handleClearSelection = useCallback(() => setSelectedInsightIds(new Set()), []);

  const handleUseInsight = useCallback((insight: Insight) => {
    if (!selectedInsightIds.has(insight.id)) setSelectedInsightIds(prev => new Set([...prev, insight.id]));
  }, [selectedInsightIds]);

  const handleGenerate = useCallback(async () => {
    if (selectedInsights.length === 0) return;
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setGeneratedContent({
        headline: `Transform Your Business with ${framework}-Driven Content`,
        hook: 'What if you could 3x your engagement with psychology-backed messaging?',
        body: `Based on ${selectedInsights.length} key insights, we've crafted content that speaks directly to your audience's deepest motivations.\n\nLeveraging the ${framework} framework, this post is optimized for ${funnelStage} conversion.`,
        cta: 'Start Your Free Trial Today',
        score: { total: 85, breakdown: { relevance: 90, emotion: 82, clarity: 88, cta: 80 } },
      });
    } finally { setIsGenerating(false); }
  }, [selectedInsights, framework, funnelStage]);

  const handleSaveContent = useCallback(() => { if (generatedContent) setSavedCount(prev => prev + 1); }, [generatedContent]);

  const handleScanBrandVoice = useCallback(async () => {
    if (!brand?.id) return;
    setScanningVoice(true);
    setVoiceScanResult(null);
    try {
      const result = await scanBrandWebsiteForVoice(brand.id);
      if (result.success) {
        setVoiceScanResult({ success: true, tone: result.brandVoice?.tone, storiesCount: result.customerStoriesCount });
        const updatedUvp = await getUVPByBrand(brand.id);
        if (updatedUvp) setUvp(updatedUvp);
      } else {
        setVoiceScanResult({ success: false, error: result.error });
      }
    } catch (err) {
      setVoiceScanResult({ success: false, error: err instanceof Error ? err.message : 'Scan failed' });
    } finally { setScanningVoice(false); }
  }, [brand?.id]);

  // Handle global refresh - clears database and reloads fresh data from APIs
  const handleRefreshAll = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      console.log('[V5ContentPage] Starting global refresh...');
      await insightLoaderService.refreshAllInsights();
      setLastRefreshTime(new Date());
      console.log('[V5ContentPage] Global refresh complete');
    } catch (err) {
      console.error('[V5ContentPage] Refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  // Handle per-tab refresh - refreshes only specific insight type
  const handleRefreshTab = useCallback(async (insightType: string) => {
    if (refreshingTab) return;
    setRefreshingTab(insightType);
    try {
      console.log(`[V5ContentPage] Refreshing ${insightType} insights...`);
      await insightLoaderService.refreshInsightType(insightType as any);
      console.log(`[V5ContentPage] ${insightType} refresh complete`);
    } catch (err) {
      console.error(`[V5ContentPage] ${insightType} refresh error:`, err);
    } finally {
      setRefreshingTab(null);
    }
  }, [refreshingTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading Synapse V5 Engine...</p>
        </div>
      </div>
    );
  }

  if (error || !uvp) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">UVP Required</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'Please complete the onboarding flow to create your UVP first.'}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate('/dashboard')}><ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard</Button>
              <Button onClick={() => navigate('/onboarding')}>Start Onboarding</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-slate-900">
      {/* UVP Summary Banner */}
      <div className="flex-shrink-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-full px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 mr-4">
              <p className="text-xs font-medium text-purple-200 mb-0.5">Your Value Proposition</p>
              <p className="text-sm font-medium line-clamp-1">{uvp.valuePropositionStatement}</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {uvp.brandVoice ? (
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span className="text-xs">{uvp.brandVoice.tone?.join(', ') || 'Detected'}</span>
                  <button onClick={handleScanBrandVoice} disabled={scanningVoice} className="ml-1 hover:bg-white/20 rounded p-0.5">
                    <RefreshCw className={`w-3 h-3 ${scanningVoice ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              ) : (
                <Button size="sm" variant="ghost" onClick={handleScanBrandVoice} disabled={scanningVoice} className="bg-white/20 hover:bg-white/30 text-white text-xs h-7">
                  {scanningVoice ? <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Scanning...</> : <><Volume2 className="w-3 h-3 mr-1.5" />Scan Brand Voice</>}
                </Button>
              )}
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full">{uvp.targetCustomer?.industry || 'General'}</span>
              <span className="text-xs bg-green-500/30 px-3 py-1 rounded-full font-bold">V5 Engine</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRefreshAll}
                disabled={isRefreshing || isLoadingInsights}
                className="bg-white/20 hover:bg-white/30 text-white text-xs h-7"
                title={lastRefreshTime ? `Last refresh: ${lastRefreshTime.toLocaleTimeString()}` : 'Refresh all insights from APIs'}
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh All'}
              </Button>
            </div>
          </div>
          {voiceScanResult && (
            <div className={`mt-2 text-xs px-3 py-2 rounded ${voiceScanResult.success ? 'bg-green-500/20 text-green-100' : 'bg-red-500/20 text-red-100'}`}>
              {voiceScanResult.success ? <>Brand voice detected: {voiceScanResult.tone?.join(', ')}{voiceScanResult.storiesCount && voiceScanResult.storiesCount > 0 && <span className="ml-2">+ {voiceScanResult.storiesCount} customer stories</span>}</> : <span>Scan failed: {voiceScanResult.error}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      {stats.totalGenerations > 0 && (
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
          <div className="px-4 py-2">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><BarChart3 className="w-4 h-4" /><span>{stats.totalGenerations} generated</span></div>
              <div className="flex items-center gap-2 text-green-600"><Target className="w-4 h-4" /><span>{stats.passRate.toFixed(0)}% pass rate</span></div>
              <div className="flex items-center gap-2 text-blue-600"><Zap className="w-4 h-4" /><span>Avg score: {stats.averageScore.toFixed(0)}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area - 3 Column Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar - UVP Building Blocks */}
        <AnimatePresence initial={false}>
          {!leftSidebarCollapsed && (
            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0 border-r border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
              <div className="w-[280px] h-full flex flex-col">
                <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-slate-700">
                  <ContextStatusDisplay uvp={uvp} industrySlug={industrySlug} eqScore={eqScore} />
                </div>
                <ScrollArea className="flex-1">
                  <UVPBuildingBlocks uvp={uvp} onSelectItem={(item) => console.log('[V5] UVP item selected:', item)} />
                </ScrollArea>
                <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Saved to Calendar</span>
                    <span className="font-bold text-green-600">{savedCount}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Left Toggle - Purple Chevron Tab (V4 Style) */}
        <button
          onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
          className={`absolute top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-5 h-10 bg-purple-600 hover:bg-purple-700 text-white rounded-r-md shadow-md transition-all ${
            leftSidebarCollapsed ? 'left-0' : 'left-[280px]'
          }`}
          title={leftSidebarCollapsed ? 'Show UVP Sidebar' : 'Hide UVP Sidebar'}
        >
          <ChevronRight className={`w-4 h-4 transition-transform ${leftSidebarCollapsed ? '' : 'rotate-180'}`} />
        </button>

        {/* Center Panel - Insights Grid */}
        <div className={`flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-slate-900 transition-all ${leftSidebarCollapsed ? 'ml-0' : 'ml-0'}`}>
          <ContentToolbar
            selectedPlatforms={selectedPlatforms}
            onPlatformChange={setSelectedPlatforms}
            framework={framework}
            onFrameworkChange={setFramework}
            funnelStage={funnelStage}
            onFunnelStageChange={setFunnelStage}
            recipes={TEMPLATE_RECIPES}
            selectedRecipe={selectedRecipe}
            onSelectRecipe={handleSelectRecipe}
            onClearRecipe={handleClearRecipe}
            selectedInsightsCount={selectedInsightIds.size}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
          <div className="flex-1 overflow-hidden">
            <InsightTabs
                insights={insights}
                enabledTabs={DEFAULT_ENABLED_TABS}
                selectedInsights={selectedInsightIds}
                onToggleInsight={handleToggleInsight}
                onUseInsight={handleUseInsight}
                isLoading={isLoadingInsights}
                onRefreshTab={handleRefreshTab}
                refreshingTab={refreshingTab as any}
                uvpData={{
                  target_customer: uvp?.targetCustomer?.statement,
                  key_benefit: uvp?.keyBenefit?.statement,
                  unique_solution: uvp?.uniqueSolution?.statement,
                  transformation: uvp?.transformationGoal?.statement,
                }}
              />
          </div>
        </div>

        {/* Right Sidebar - YourMix Preview (always visible) */}
        <div className="flex-shrink-0 w-[320px] border-l border-gray-200 dark:border-slate-700 overflow-hidden">
          <YourMixPreview selectedInsights={selectedInsights} generatedContent={generatedContent} isGenerating={isGenerating} framework={framework} onRemove={handleRemoveInsight} onClear={handleClearSelection} onGenerate={handleGenerate} onSave={handleSaveContent} />
        </div>
      </div>
    </div>
  );
}

export default V5ContentPage;
