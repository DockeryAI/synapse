// PRD Feature: SYNAPSE-V6
/**
 * V6 Content Generation Page
 *
 * Main page for Synapse V6 Content Engine.
 * Uses V6 API orchestrator with profile-based routing.
 *
 * 3-Column Layout:
 * - Left: UVP Building Blocks sidebar (280px)
 * - Center: V6 Insight Tabs with cards
 * - Right: YourMix Preview panel (320px)
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
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBrand } from '@/hooks/useBrand';
import { getUVPByBrand, recoverDriversFromSession, scanBrandWebsiteForVoice } from '@/services/database/marba-uvp.service';
import { OnboardingV5DataService } from '@/services/supabase/onboarding-v5-data.service';
import type { BuyerPersona } from '@/types/buyer-persona.types';

// V6 Data Layer
import { useV6TabData } from '@/hooks/useV6TabData';
import { adaptTabToInsights } from '@/services/synapse-v6/tab-data-adapter.service';
import type { InsightTab } from '@/services/synapse-v6/brand-profile.service';

// V5 UI Components (reused)
import { UVPBuildingBlocks } from '@/components/v5/UVPBuildingBlocks';
import { InsightTabs, type EnabledTabs, type UVPData } from '@/components/v5/InsightTabs';
import { type Insight } from '@/components/v5/InsightCards';
import { YourMixPreview, type GeneratedContentPreview, type PsychologyFramework } from '@/components/v5/YourMixPreview';
import { ContentToolbar, type Platform, type FunnelStage, type InsightRecipe } from '@/components/v5/ContentToolbar';

import type { CompleteUVP } from '@/types/uvp-flow.types';

// Recipe presets
const TEMPLATE_RECIPES: InsightRecipe[] = [
  {
    id: 'authority',
    name: 'Authority Builder',
    description: 'Build credibility with data-driven content',
    emoji: '🎯',
    insightTypes: ['trends', 'gaps', 'proof'],
    minInsights: 3,
    maxInsights: 6,
    primaryFramework: 'AIDA',
    targetFunnelStage: 'TOFU',
    suggestedPlatforms: { b2b: ['linkedin'], b2c: ['facebook', 'instagram'] },
    compatibleTemplates: ['Authority Builder', 'Education First'],
  },
  {
    id: 'trust',
    name: 'Trust Builder',
    description: 'Build confidence with social proof',
    emoji: '🤝',
    insightTypes: ['conversations', 'proof'],
    minInsights: 3,
    maxInsights: 5,
    primaryFramework: 'StoryBrand',
    targetFunnelStage: 'MOFU',
    suggestedPlatforms: { b2b: ['linkedin', 'facebook'], b2c: ['instagram', 'facebook'] },
    compatibleTemplates: ['Social Proof', 'Trust Ladder'],
  },
  {
    id: 'problem-solver',
    name: 'Problem Solver',
    description: 'Address pain points with PAS framework',
    emoji: '💡',
    insightTypes: ['triggers', 'conversations', 'gaps'],
    minInsights: 3,
    maxInsights: 6,
    primaryFramework: 'PAS',
    targetFunnelStage: 'TOFU',
    suggestedPlatforms: { b2b: ['linkedin', 'twitter'], b2c: ['facebook', 'instagram'] },
    compatibleTemplates: ['PAS Series', 'Quick Win'],
  },
];

// Context Status Display
function ContextStatusDisplay({ uvp, profileType }: { uvp: CompleteUVP | null; profileType?: string }) {
  const status = useMemo(() => [
    { label: 'UVP', loaded: !!uvp, icon: Target },
    { label: 'Profile', loaded: !!profileType, icon: BarChart3 },
    { label: 'V6', loaded: true, icon: Zap },
  ], [uvp, profileType]);

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
      {profileType && (
        <div className="mt-2 text-xs text-purple-600 font-medium">
          Profile: {profileType}
        </div>
      )}
    </div>
  );
}

// Main Page Component
export function V6ContentPage() {
  const navigate = useNavigate();
  const { currentBrand: brand, loading: brandLoading } = useBrand();

  const [uvp, setUvp] = useState<CompleteUVP | null>(null);
  const [buyerPersonas, setBuyerPersonas] = useState<BuyerPersona[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [scanningVoice, setScanningVoice] = useState(false);
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [voiceScanResult, setVoiceScanResult] = useState<{ success: boolean; tone?: string[]; error?: string } | null>(null);

  // V6 Data Layer
  const {
    state: v6State,
    loadTab,
    loadAllTabs,
    refresh: refreshV6,
    isTabLoading,
  } = useV6TabData({
    brandId: brand?.id || '',
    uvp: uvp as CompleteUVP,
    autoLoad: false, // Manual load after UVP is ready
  });

  // Derived insights from V6 tab data
  const insights = useMemo((): Insight[] => {
    const allInsights: Insight[] = [];
    v6State.tabs.forEach((tabData) => {
      const adapted = adaptTabToInsights(tabData);
      allInsights.push(...adapted);
    });
    return allInsights;
  }, [v6State.tabs]);

  const [selectedInsightIds, setSelectedInsightIds] = useState<Set<string>>(new Set());

  // Enabled tabs from V6 profile
  const enabledTabs = useMemo((): EnabledTabs => {
    const profile = v6State.profile;
    if (!profile) {
      return {
        triggers: true,
        proof: true,
        trends: true,
        conversations: true,
        competitors: true,
        local: false,
        weather: false,
      };
    }

    return {
      triggers: profile.enabled_tabs.includes('voc'),
      proof: profile.enabled_tabs.includes('community'),
      trends: profile.enabled_tabs.includes('trends'),
      conversations: profile.enabled_tabs.includes('community'),
      competitors: profile.enabled_tabs.includes('competitive'),
      local: profile.enabled_tabs.includes('local_timing'),
      weather: profile.enabled_tabs.includes('local_timing'),
    };
  }, [v6State.profile]);

  // Content generation state
  const [generatedContent, setGeneratedContent] = useState<GeneratedContentPreview | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Toolbar state
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<Platform>>(new Set(['linkedin']));
  const [framework, setFramework] = useState<PsychologyFramework>('AIDA');
  const [funnelStage, setFunnelStage] = useState<FunnelStage>('TOFU');
  const [selectedRecipe, setSelectedRecipe] = useState<InsightRecipe | null>(null);

  const selectedInsights = useMemo(() => insights.filter(i => selectedInsightIds.has(i.id)), [insights, selectedInsightIds]);

  // Load UVP and buyer personas
  useEffect(() => {
    async function loadUVPAndPersonas() {
      if (brandLoading) return;
      if (!brand?.id) { setError('No brand selected'); setLoading(false); return; }

      try {
        // Load UVP and buyer personas in parallel
        const [uvpData, personas] = await Promise.all([
          getUVPByBrand(brand.id),
          OnboardingV5DataService.loadBuyerPersonas(brand.id).catch(() => [] as BuyerPersona[]),
        ]);

        if (!uvpData) { setError('No UVP found. Please complete onboarding first.'); setLoading(false); return; }

        const hasDrivers = (uvpData.targetCustomer?.emotionalDrivers?.length || 0) > 0;
        if (!hasDrivers) {
          const recoveryResult = await recoverDriversFromSession(brand.id);
          if (recoveryResult.updated) {
            const refreshedUvp = await getUVPByBrand(brand.id);
            if (refreshedUvp) setUvp(refreshedUvp);
          } else {
            setUvp(uvpData);
          }
        } else {
          setUvp(uvpData);
        }

        // Set buyer personas (10 detailed profiles from database)
        if (personas.length > 0) {
          console.log('[V6ContentPage] Loaded', personas.length, 'buyer personas from database');
          setBuyerPersonas(personas);
        }

        setLoading(false);
      } catch (err) {
        setError('Failed to load UVP data');
        setLoading(false);
      }
    }
    loadUVPAndPersonas();
  }, [brand?.id, brandLoading]);

  // Load V6 data after UVP is ready
  useEffect(() => {
    if (uvp && brand?.id && !v6State.profile) {
      console.log('[V6ContentPage] UVP ready, loading V6 tabs...');
      loadAllTabs();
    }
  }, [uvp, brand?.id, v6State.profile, loadAllTabs]);

  // Handlers
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

  const handleSelectRecipe = useCallback((recipe: InsightRecipe) => {
    setSelectedRecipe(recipe);
    setFramework(recipe.primaryFramework as PsychologyFramework);
    setFunnelStage(recipe.targetFunnelStage as FunnelStage);
    const suggestedPlatforms = recipe.suggestedPlatforms.b2b || [];
    setSelectedPlatforms(new Set(suggestedPlatforms as Platform[]));
  }, []);

  const handleClearRecipe = useCallback(() => {
    setSelectedRecipe(null);
    setFramework('AIDA');
    setFunnelStage('TOFU');
    setSelectedPlatforms(new Set(['linkedin']));
  }, []);

  const handleGenerate = useCallback(async () => {
    if (selectedInsights.length === 0) return;
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setGeneratedContent({
        headline: `Transform Your Business with ${framework}-Driven Content`,
        hook: 'What if you could 3x your engagement with psychology-backed messaging?',
        body: `Based on ${selectedInsights.length} key insights from V6 analysis.\n\nLeveraging the ${framework} framework for ${funnelStage} conversion.`,
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
        setVoiceScanResult({ success: true, tone: result.brandVoice?.tone });
        const updatedUvp = await getUVPByBrand(brand.id);
        if (updatedUvp) setUvp(updatedUvp);
      } else {
        setVoiceScanResult({ success: false, error: result.error });
      }
    } catch (err) {
      setVoiceScanResult({ success: false, error: err instanceof Error ? err.message : 'Scan failed' });
    } finally { setScanningVoice(false); }
  }, [brand?.id]);

  const handleRefreshAll = useCallback(async () => {
    console.log('[V6ContentPage] Refreshing all V6 data...');
    await refreshV6();
  }, [refreshV6]);

  const handleRefreshTab = useCallback(async (insightType: string) => {
    // Map legacy tab names to V6 tab names
    const tabMap: Record<string, InsightTab> = {
      'trigger': 'voc',
      'proof': 'community',
      'trend': 'trends',
      'competitor': 'competitive',
      'local': 'local_timing',
      'weather': 'local_timing',
    };
    const v6Tab = tabMap[insightType];
    if (v6Tab) {
      console.log(`[V6ContentPage] Refreshing ${v6Tab} tab...`);
      await loadTab(v6Tab);
    }
  }, [loadTab]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading Synapse V6 Engine...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !uvp) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">UVP Required</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'Please complete onboarding first.'}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate('/dashboard')}><ArrowLeft className="w-4 h-4 mr-2" />Dashboard</Button>
              <Button onClick={() => navigate('/onboarding')}>Start Onboarding</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-slate-900">
      {/* V6 Banner */}
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
                  {scanningVoice ? <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Scanning...</> : <><Volume2 className="w-3 h-3 mr-1.5" />Scan Voice</>}
                </Button>
              )}
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full">{uvp.targetCustomer?.industry || 'General'}</span>
              <span className="text-xs bg-purple-500/50 px-3 py-1 rounded-full font-bold">V6 Engine</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRefreshAll}
                disabled={v6State.isLoading}
                className="bg-white/20 hover:bg-white/30 text-white text-xs h-7"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${v6State.isLoading ? 'animate-spin' : ''}`} />
                {v6State.isLoading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </div>
          {voiceScanResult && (
            <div className={`mt-2 text-xs px-3 py-2 rounded ${voiceScanResult.success ? 'bg-green-500/20 text-green-100' : 'bg-red-500/20 text-red-100'}`}>
              {voiceScanResult.success ? `Brand voice: ${voiceScanResult.tone?.join(', ')}` : `Error: ${voiceScanResult.error}`}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area - 3 Column Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar - UVP Building Blocks */}
        <AnimatePresence initial={false}>
          {!leftSidebarCollapsed && (
            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0 border-r border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
              <div className="w-[280px] h-full flex flex-col">
                <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-slate-700">
                  <ContextStatusDisplay uvp={uvp} profileType={v6State.profile?.profile_type} />
                </div>
                <ScrollArea className="flex-1">
                  <UVPBuildingBlocks uvp={uvp} buyerPersonas={buyerPersonas} onSelectItem={(item) => console.log('[V6] UVP item:', item)} />
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

        {/* Left Toggle */}
        <button
          onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
          className={`absolute top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-5 h-10 bg-purple-600 hover:bg-purple-700 text-white rounded-r-md shadow-md transition-all ${
            leftSidebarCollapsed ? 'left-0' : 'left-[280px]'
          }`}
        >
          <ChevronRight className={`w-4 h-4 transition-transform ${leftSidebarCollapsed ? '' : 'rotate-180'}`} />
        </button>

        {/* Center Panel - Insights Grid */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-slate-900">
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
              enabledTabs={enabledTabs}
              selectedInsights={selectedInsightIds}
              onToggleInsight={handleToggleInsight}
              onUseInsight={handleUseInsight}
              isLoading={v6State.isLoading}
              onRefreshTab={handleRefreshTab}
              refreshingTab={null}
              uvpData={{
                target_customer: uvp?.targetCustomer?.statement,
                key_benefit: uvp?.keyBenefit?.statement,
                unique_solution: uvp?.uniqueSolution?.statement,
                transformation: uvp?.transformationGoal?.statement,
              }}
            />
          </div>
        </div>

        {/* Right Sidebar - YourMix Preview */}
        <div className="flex-shrink-0 w-[320px] border-l border-gray-200 dark:border-slate-700 overflow-hidden">
          <YourMixPreview selectedInsights={selectedInsights} generatedContent={generatedContent} isGenerating={isGenerating} framework={framework} onRemove={handleRemoveInsight} onClear={handleClearSelection} onGenerate={handleGenerate} onSave={handleSaveContent} />
        </div>
      </div>
    </div>
  );
}

export default V6ContentPage;
