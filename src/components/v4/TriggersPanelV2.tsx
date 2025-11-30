/**
 * Triggers Panel V2
 *
 * Consolidated triggers view with:
 * - Triggers grouped by category (Fear, Desire, Pain Point, etc.)
 * - Evidence nested inside each trigger (not separate tab)
 * - Profile-aware weighting and filtering
 * - Streams from dashboardPreloader for progressive loading
 *
 * Replaces both Triggers and Conversations tabs.
 *
 * Created: 2025-11-28
 */

import React, { memo, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  AlertCircle,
  Sparkles,
  Shield,
  Zap,
  Clock,
  Award,
  Loader2,
  RefreshCw,
  Filter,
  ChevronDown,
  Trash2,
  Target,
  Play
} from 'lucide-react';
import { TriggerCard } from './TriggerCard';
import {
  triggerConsolidationService,
  type ConsolidatedTrigger,
  type TriggerCategory,
  type TriggerConsolidationResult,
  type BuyerJourneyStage
} from '@/services/triggers/trigger-consolidation.service';
import {
  profileDetectionService,
  type BusinessProfileType,
  PROFILE_CONFIGS
} from '@/services/triggers/profile-detection.service';
import { llmTriggerSynthesizer, type RawDataSample } from '@/services/triggers/llm-trigger-synthesizer.service';
import { streamingApiManager } from '@/services/intelligence/streaming-api-manager';
import { useStreamingTriggers } from '@/hooks/useStreamingTriggers';
import { useBrandProfile } from '@/hooks/useBrandProfile';
import { useBrand } from '@/hooks/useBrand';
import type { DeepContext } from '@/types/synapse/deepContext.types';
import type { CompleteUVP } from '@/types/uvp-flow.types';

// ============================================================================
// PERSISTENT CACHE - Saves API data to localStorage (matches TriggersDevPage)
// ============================================================================

const TRIGGERS_CACHE_KEY = 'triggersPanel_deepContext_v1';
const TRIGGERS_DATA_KEY = 'triggersPanel_triggers_v1';

function loadCachedDeepContext(): DeepContext | null {
  try {
    const cached = localStorage.getItem(TRIGGERS_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      console.log('[TriggersPanelV2] Loaded cached DeepContext');
      return parsed;
    }
  } catch (err) {
    console.warn('[TriggersPanelV2] Failed to load cached data:', err);
  }
  return null;
}

function saveCachedDeepContext(data: DeepContext): void {
  try {
    localStorage.setItem(TRIGGERS_CACHE_KEY, JSON.stringify(data));
    console.log('[TriggersPanelV2] 💾 Saved DeepContext to localStorage');
  } catch (err) {
    console.error('[TriggersPanelV2] Failed to save cached data:', err);
  }
}

function loadCachedTriggers(): ConsolidatedTrigger[] | null {
  try {
    const cached = localStorage.getItem(TRIGGERS_DATA_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      console.log('[TriggersPanelV2] Loaded cached triggers:', parsed?.length || 0);
      return parsed;
    }
  } catch (err) {
    console.warn('[TriggersPanelV2] Failed to load cached triggers:', err);
  }
  return null;
}

function saveCachedTriggers(triggers: ConsolidatedTrigger[]): void {
  try {
    localStorage.setItem(TRIGGERS_DATA_KEY, JSON.stringify(triggers));
    console.log('[TriggersPanelV2] 💾 Saved triggers to localStorage:', triggers.length);
  } catch (err) {
    console.error('[TriggersPanelV2] Failed to save triggers:', err);
  }
}

// ============================================================================
// TYPES
// ============================================================================

interface TriggersPanelV2Props {
  /** Deep context with raw data */
  deepContext: DeepContext | null;
  /** UVP for profile detection and alignment */
  uvp: CompleteUVP | null;
  /** Brand data for additional context */
  brandData?: any;
  /** Currently selected trigger IDs */
  selectedTriggers: string[];
  /** Loading state */
  isLoading?: boolean;
  /** Loading status message */
  loadingStatus?: string;
  /** Callback when a trigger is toggled */
  onToggle: (triggerId: string) => void;
  /** Callback to get full trigger data for content generation */
  onSelectTrigger?: (trigger: ConsolidatedTrigger) => void;
  /** Pre-consolidated triggers (from LLM synthesis or cache) - skips re-consolidation */
  preConsolidatedTriggers?: ConsolidatedTrigger[] | null;
}

// ============================================================================
// CATEGORY CONFIG
// ============================================================================

interface CategoryConfig {
  icon: React.ElementType;
  label: string;
  color: string;
  bgColor: string;
}

const CATEGORY_CONFIG: Record<TriggerCategory, CategoryConfig> = {
  'fear': { icon: AlertCircle, label: 'Fear', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  'desire': { icon: Sparkles, label: 'Desire', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  'pain-point': { icon: Heart, label: 'Pain Points', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  'objection': { icon: Shield, label: 'Objections', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  'motivation': { icon: Zap, label: 'Motivation', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  'trust': { icon: Award, label: 'Trust', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  'urgency': { icon: Clock, label: 'Urgency', color: 'text-rose-600', bgColor: 'bg-rose-100 dark:bg-rose-900/30' }
};

const CATEGORY_ORDER: TriggerCategory[] = [
  'pain-point',
  'fear',
  'desire',
  'objection',
  'motivation',
  'trust',
  'urgency'
];

// ============================================================================
// JOURNEY STAGE CONFIG
// ============================================================================

interface JourneyStageConfig {
  label: string;
  shortLabel: string;
  icon: string;
  color: string;
  bgColor: string;
}

const JOURNEY_STAGE_CONFIG: Record<BuyerJourneyStage, JourneyStageConfig> = {
  'unaware': {
    label: 'Unaware',
    shortLabel: 'Unaware',
    icon: '💭',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800'
  },
  'problem-aware': {
    label: 'Problem Aware',
    shortLabel: 'Problem',
    icon: '⚡',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30'
  },
  'solution-aware': {
    label: 'Solution Aware',
    shortLabel: 'Solution',
    icon: '🔍',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30'
  },
  'product-aware': {
    label: 'Product Aware',
    shortLabel: 'Product',
    icon: '🎯',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30'
  }
};

const JOURNEY_STAGE_ORDER: BuyerJourneyStage[] = [
  'unaware',
  'problem-aware',
  'solution-aware',
  'product-aware'
];

const PROFILE_LABELS: Record<BusinessProfileType, string> = {
  'local-service-b2b': 'Local B2B Service',
  'local-service-b2c': 'Local B2C Service',
  'regional-b2b-agency': 'Regional B2B Agency',
  'regional-retail-b2c': 'Regional Retail',
  'national-saas-b2b': 'National SaaS B2B',
  'national-product-b2c': 'National Product B2C',
  'global-saas-b2b': 'Global SaaS B2B'
};

// ============================================================================
// CATEGORY GROUP COMPONENT
// ============================================================================

interface CategoryGroupProps {
  category: TriggerCategory;
  triggers: ConsolidatedTrigger[];
  selectedTriggers: string[];
  expandedCard: string | null;
  onToggle: (id: string) => void;
  onToggleExpand: (id: string, e: React.MouseEvent) => void;
}

const CategoryGroup = memo(function CategoryGroup({
  category,
  triggers,
  selectedTriggers,
  expandedCard,
  onToggle,
  onToggleExpand
}: CategoryGroupProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const config = CATEGORY_CONFIG[category];
  const Icon = config.icon;

  if (triggers.length === 0) return null;

  return (
    <div className="mb-6">
      {/* Category Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center gap-3 mb-3 group"
      >
        <div className={`w-8 h-8 ${config.bgColor} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${config.color}`} />
        </div>
        <div className="flex-1 text-left">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {config.label}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {triggers.length} trigger{triggers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
      </button>

      {/* Trigger Cards */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="grid grid-cols-2 gap-3">
              {triggers.map((trigger) => (
                <TriggerCard
                  key={trigger.id}
                  trigger={trigger}
                  isSelected={selectedTriggers.includes(trigger.id)}
                  isExpanded={expandedCard === trigger.id}
                  onToggleSelect={() => onToggle(trigger.id)}
                  onToggleExpand={(e) => onToggleExpand(trigger.id, e)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ============================================================================
// HELPER: Extract raw samples from DeepContext for LLM synthesis
// ============================================================================

function extractRawSamplesFromDeepContext(context: DeepContext): RawDataSample[] {
  const samples: RawDataSample[] = [];
  let id = 0;

  // 1. Correlated insights (highest quality - from Perplexity with citations)
  context.correlatedInsights?.forEach((ci: any) => {
    if (ci.insight) {
      const sourceDetails = ci.sourceDetails || [];
      samples.push({
        id: `ci-${id++}`,
        content: ci.insight,
        source: sourceDetails[0]?.title || ci.sources?.join(', ') || 'Research',
        platform: 'Perplexity Research',
        url: sourceDetails[0]?.url,
        sourceTitle: sourceDetails[0]?.title
      });
    }
  });

  // 2. Raw data points (direct API data)
  context.rawDataPoints?.forEach((dp: any) => {
    if (dp.content && (dp.type === 'pain_point' || dp.type === 'customer_trigger' || dp.type === 'community_discussion')) {
      samples.push({
        id: `rdp-${id++}`,
        content: dp.content,
        source: dp.source || 'API',
        platform: dp.metadata?.platform || dp.source || 'Unknown',
        url: dp.metadata?.url,
        author: dp.metadata?.author
      });
    }
  });

  // 3. Customer psychology emotional triggers
  context.customerPsychology?.emotional?.forEach((trigger: any) => {
    const text = typeof trigger === 'string' ? trigger : trigger.trigger || trigger.text;
    if (text) {
      samples.push({
        id: `psych-${id++}`,
        content: text,
        source: 'Customer Psychology',
        platform: typeof trigger === 'object' ? (trigger.context || 'Analysis') : 'Analysis'
      });
    }
  });

  // 4. Synthesis breakthroughs
  context.synthesis?.breakthroughs?.forEach((bo: any) => {
    const text = bo.hook || bo.title;
    if (text) {
      samples.push({
        id: `break-${id++}`,
        content: text,
        source: 'Breakthrough Analysis',
        platform: bo.sources?.join(', ') || 'Multi-source'
      });
    }
  });

  console.log(`[extractRawSamples] Extracted ${samples.length} raw samples from DeepContext`);
  return samples;
}

// ============================================================================
// MAIN PANEL COMPONENT
// ============================================================================

export const TriggersPanelV2 = memo(function TriggersPanelV2({
  deepContext: parentDeepContext,
  uvp,
  brandData,
  selectedTriggers,
  isLoading: parentIsLoading = false,
  loadingStatus: parentLoadingStatus = 'Loading triggers...',
  onToggle,
  onSelectTrigger,
  preConsolidatedTriggers
}: TriggersPanelV2Props) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Initialize consolidationResult from cached triggers to avoid empty state flash on page load
  const [consolidationResult, setConsolidationResult] = useState<TriggerConsolidationResult | null>(() => {
    const cached = loadCachedTriggers();
    if (cached && cached.length > 0) {
      console.log('[TriggersPanelV2] 📦 Initializing consolidationResult from cache:', cached.length, 'triggers');
      return {
        triggers: cached,
        profileType: 'global-saas-b2b', // Will be updated when UVP loads
        profileConfig: PROFILE_CONFIGS['global-saas-b2b'],
        totalEvidenceItems: cached.reduce((sum, t) => sum + (t.evidence?.length || 0), 0),
        deduplicatedCount: 0,
        filteredCount: 0,
        avgRelevanceScore: cached.reduce((sum, t) => sum + (t.relevanceScore || 0), 0) / cached.length
      };
    }
    return null;
  });

  const [filterCategory, setFilterCategory] = useState<TriggerCategory | 'all'>('all');
  const [filterJourneyStage, setFilterJourneyStage] = useState<BuyerJourneyStage | 'all'>('all');
  const [currentLoadingStep, setCurrentLoadingStep] = useState(0);

  // Get user's profile override from context (if they manually changed their market definition)
  const { profile, isAutoDetected } = useBrandProfile();
  const { currentBrand } = useBrand();

  // ============================================================================
  // LOCAL CACHE STATE (matches TriggersDevPage)
  // ============================================================================
  const [cachedContext, setCachedContext] = useState<DeepContext | null>(() => loadCachedDeepContext());
  const [cachedTriggers, setCachedTriggers] = useState<ConsolidatedTrigger[] | null>(() => loadCachedTriggers());
  const [streamingEnabled, setStreamingEnabled] = useState(false);

  // Build profile override if user has manual overrides
  const profileOverride = useMemo(() => {
    if (!profile || isAutoDetected) return undefined;
    return {
      profileType: profile.profileType,
      geographicScope: profile.geographicScope,
      primaryRegions: profile.primaryRegions,
    };
  }, [profile, isAutoDetected]);

  // Detect business profile from UVP for intelligent API gating
  const detectedProfile = useMemo((): BusinessProfileType | undefined => {
    if (!uvp) return undefined;
    const analysis = profileDetectionService.detectProfile(uvp, brandData);
    return profileOverride?.profileType || analysis.profileType;
  }, [uvp, brandData, profileOverride]);

  // ============================================================================
  // USE STREAMING TRIGGERS HOOK (same as TriggersDevPage)
  // Only enabled when user clicks "Fetch Fresh Data"
  // ============================================================================
  const streamingResult = useStreamingTriggers(
    currentBrand,
    uvp,
    streamingEnabled, // Only fires when button is clicked
    detectedProfile
  );

  // Use cached data OR streaming data
  const deepContext = cachedContext || streamingResult.deepContext || parentDeepContext;

  // Use cached triggers OR streaming triggers - CACHED TAKES PRIORITY
  const triggers = useMemo(() => {
    if (cachedTriggers && cachedTriggers.length > 0) return cachedTriggers;
    if (streamingResult.triggers && streamingResult.triggers.length > 0) return streamingResult.triggers;
    if (preConsolidatedTriggers && preConsolidatedTriggers.length > 0) return preConsolidatedTriggers;
    return [];
  }, [cachedTriggers, streamingResult.triggers, preConsolidatedTriggers]);

  // Loading state - never show loading if we have cached triggers
  const hasCachedData = cachedTriggers && cachedTriggers.length > 0;
  const isLoading = hasCachedData ? false : (streamingResult.isLoading || parentIsLoading);
  const loadingStatus = streamingResult.isLoading
    ? `${streamingResult.loadingStatus} (${streamingResult.loadedSources.length}/${streamingResult.totalSources} sources)`
    : parentLoadingStatus;

  // Loading step animation - runs only when isLoading is true
  useEffect(() => {
    if (!isLoading) {
      setCurrentLoadingStep(0);
      return;
    }
    const interval = setInterval(() => {
      setCurrentLoadingStep(prev => (prev + 1) % 6);
    }, 2500);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Save streaming DeepContext INCREMENTALLY as data arrives (matches TriggersDevPage)
  useEffect(() => {
    if (streamingResult.deepContext && streamingEnabled) {
      const data = streamingResult.deepContext;
      const hasData = (data.customerPsychology?.emotional?.length || 0) > 0 ||
                      (data.correlatedInsights?.length || 0) > 0 ||
                      (data.rawDataPoints?.length || 0) > 0;

      if (hasData) {
        saveCachedDeepContext(data);
        setCachedContext(data);
      }

      // NOTE: We do NOT disable streaming here - that happens in the triggers effect below
      // This prevents the race condition where streaming is disabled before consolidationResult is set
    }
  }, [streamingResult.deepContext, streamingEnabled]);

  // Save triggers SEPARATELY when they arrive (matches TriggersDevPage)
  // This effect also handles disabling streaming and setting consolidationResult
  useEffect(() => {
    if (streamingResult.triggers && streamingResult.triggers.length > 0 && streamingEnabled) {
      const newTriggers = streamingResult.triggers;

      // Save to localStorage
      saveCachedTriggers(newTriggers);
      setCachedTriggers(newTriggers);
      console.log('[TriggersPanelV2] 🎯 Saved', newTriggers.length, 'triggers to localStorage');

      // Set consolidationResult BEFORE disabling streaming to prevent empty state flash
      setConsolidationResult({
        triggers: newTriggers,
        profileType: detectedProfile || 'global-saas-b2b',
        profileConfig: PROFILE_CONFIGS[detectedProfile || 'global-saas-b2b'],
        totalEvidenceItems: newTriggers.reduce((sum, t) => sum + (t.evidence?.length || 0), 0),
        deduplicatedCount: 0,
        filteredCount: 0,
        avgRelevanceScore: newTriggers.reduce((sum, t) => sum + (t.relevanceScore || 0), 0) / newTriggers.length
      });

      // NOW disable streaming - after consolidationResult is set
      if (!streamingResult.isLoading) {
        setStreamingEnabled(false);
        console.log('[TriggersPanelV2] ✅ Streaming complete!');
      }
    }
  }, [streamingResult.triggers, streamingResult.isLoading, streamingEnabled, detectedProfile]);

  // Auto-reconsolidate: When UVP loads and we have cached triggers, recalculate UVP alignments
  const hasAutoReconsolidated = useRef(false);
  useEffect(() => {
    if (uvp && cachedTriggers && cachedTriggers.length > 0 && cachedContext && !hasAutoReconsolidated.current) {
      hasAutoReconsolidated.current = true;
      console.log('[TriggersPanelV2] 🔄 Auto-reconsolidating cached triggers with UVP alignment...');

      try {
        const result = triggerConsolidationService.consolidate(
          cachedContext,
          uvp,
          brandData
        );
        saveCachedTriggers(result.triggers);
        setCachedTriggers(result.triggers);
        setConsolidationResult(result);
      } catch (err) {
        console.error('[TriggersPanelV2] Auto-reconsolidation error:', err);
      }
    }
  }, [uvp, cachedTriggers, cachedContext, brandData]);

  // Update consolidation result when triggers change
  useEffect(() => {
    if (triggers.length > 0 && !consolidationResult) {
      setConsolidationResult({
        triggers: triggers,
        profileType: detectedProfile || 'global-saas-b2b',
        profileConfig: PROFILE_CONFIGS[detectedProfile || 'global-saas-b2b'],
        totalEvidenceItems: triggers.reduce((sum, t) => sum + (t.evidence?.length || 0), 0),
        deduplicatedCount: 0,
        filteredCount: 0,
        avgRelevanceScore: triggers.reduce((sum, t) => sum + (t.relevanceScore || 0), 0) / triggers.length
      });
    }
  }, [triggers, consolidationResult, detectedProfile]);

  const handleToggleExpand = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCard(prev => prev === id ? null : id);
  }, []);

  // ============================================================================
  // FETCH LIVE DATA - Uses streaming hook (matches TriggersDevPage)
  // ============================================================================
  const handleFetchData = useCallback(async () => {
    if (!currentBrand?.id || !uvp) return;

    console.log('[TriggersPanelV2] 🚀 Manual Fetch Data clicked - starting streaming');

    // PROGRESSIVE LOADING: Keep existing triggers visible during streaming
    // Don't clear consolidationResult - let new data replace it when ready
    // This prevents the flash to "Ready to Discover Triggers" empty state

    // Clear streaming API manager cache
    try {
      streamingApiManager.clearCache();
      console.log('[TriggersPanelV2] Streaming cache cleared');
    } catch (e) {
      console.warn('[TriggersPanelV2] Could not clear cache:', e);
    }

    // Enable streaming - this triggers the useStreamingTriggers hook
    setStreamingEnabled(true);
  }, [currentBrand, uvp]);

  // ============================================================================
  // CLEAR CACHE & RE-CONSOLIDATE (matches TriggersDevPage)
  // ============================================================================
  const handleClearCache = useCallback(async () => {
    console.log('[TriggersPanelV2] 🗑️ Clearing ALL cached data');

    // Clear localStorage
    localStorage.removeItem(TRIGGERS_CACHE_KEY);
    localStorage.removeItem(TRIGGERS_DATA_KEY);

    // Clear streaming API manager caches
    try {
      streamingApiManager.clearCache();
    } catch (e) {
      console.warn('[TriggersPanelV2] Could not clear StreamingAPI cache:', e);
    }

    // Reset state
    setCachedContext(null);
    setCachedTriggers(null);
    setConsolidationResult(null);
    setStreamingEnabled(false);
    hasAutoReconsolidated.current = false;

    console.log('[TriggersPanelV2] ✅ Cache cleared - ready for fresh data');
  }, []);

  const handleReconsolidate = useCallback(() => {
    if (!cachedContext || !uvp) return;

    console.log('[TriggersPanelV2] 🔄 Re-consolidating triggers with UVP alignment...');
    try {
      const result = triggerConsolidationService.consolidate(cachedContext, uvp, brandData);
      saveCachedTriggers(result.triggers);
      setCachedTriggers(result.triggers);
      setConsolidationResult(result);
      console.log(`[TriggersPanelV2] ✅ Re-consolidated ${result.triggers.length} triggers`);
    } catch (err) {
      console.error('[TriggersPanelV2] Re-consolidation error:', err);
    }
  }, [cachedContext, uvp, brandData]);

  // Filter triggers by category and journey stage
  const filteredTriggers = useMemo(() => {
    if (!consolidationResult) return [];

    let filtered = consolidationResult.triggers;

    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(t => t.category === filterCategory);
    }

    // Apply journey stage filter
    if (filterJourneyStage !== 'all') {
      filtered = filtered.filter(t => t.buyerJourneyStage === filterJourneyStage);
    }

    return filtered;
  }, [consolidationResult, filterCategory, filterJourneyStage]);

  // Group filtered triggers by category
  const groupedTriggers = useMemo(() => {
    const grouped = new Map<TriggerCategory, ConsolidatedTrigger[]>();
    CATEGORY_ORDER.forEach(cat => grouped.set(cat, []));

    filteredTriggers.forEach(trigger => {
      const list = grouped.get(trigger.category) || [];
      list.push(trigger);
      grouped.set(trigger.category, list);
    });

    return grouped;
  }, [filteredTriggers]);

  // Category counts for filter (based on journey-filtered triggers)
  const categoryCounts = useMemo(() => {
    if (!consolidationResult) return {};

    // If no journey filter, count all triggers
    // Otherwise, count triggers that match the journey filter
    const triggersToCount = filterJourneyStage === 'all'
      ? consolidationResult.triggers
      : consolidationResult.triggers.filter(t => t.buyerJourneyStage === filterJourneyStage);

    return triggersToCount.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [consolidationResult, filterJourneyStage]);

  // Journey stage counts for filter
  const journeyStageCounts = useMemo(() => {
    if (!consolidationResult) return {} as Record<BuyerJourneyStage, number>;

    // If no category filter, count all triggers
    // Otherwise, count triggers that match the category filter
    const triggersToCount = filterCategory === 'all'
      ? consolidationResult.triggers
      : consolidationResult.triggers.filter(t => t.category === filterCategory);

    return triggersToCount.reduce((acc, t) => {
      const stage = t.buyerJourneyStage || 'problem-aware';
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {} as Record<BuyerJourneyStage, number>);
  }, [consolidationResult, filterCategory]);

  // Loading steps configuration (defined outside conditional for consistency)
  const loadingSteps = useMemo(() => [
    { icon: '🔍', label: 'Scanning G2 Reviews', description: 'Finding what customers say about competitors' },
    { icon: '💬', label: 'Analyzing Trustpilot', description: 'Extracting pain points from reviews' },
    { icon: '🗣️', label: 'Mining Reddit Discussions', description: 'Discovering community frustrations' },
    { icon: '🎯', label: 'Processing LinkedIn Insights', description: 'Understanding B2B buyer psychology' },
    { icon: '📊', label: 'Correlating Patterns', description: 'Identifying psychological triggers' },
    { icon: '✨', label: 'Synthesizing Insights', description: 'Creating actionable trigger cards' },
  ], []);

  // Loading state - animated loading screen with step descriptions
  // PROGRESSIVE LOADING: Only show full loading screen if we have NO existing data
  // If we have existing triggers, show them with overlay progress indicator instead
  const hasExistingTriggers = consolidationResult && consolidationResult.triggers.length > 0;

  if ((isLoading || streamingEnabled) && !hasExistingTriggers) {
    const step = streamingEnabled
      ? { icon: '🧠', label: `${streamingResult.percentComplete}% - ${loadingStatus}`, description: 'Loading fresh data from all API sources...' }
      : loadingSteps[currentLoadingStep];

    return (
      <div className="flex flex-col items-center justify-center py-16 px-8">
        {/* Animated icon */}
        <motion.div
          key={streamingEnabled ? 'fetching' : currentLoadingStep}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="text-5xl mb-4"
        >
          {step.icon}
        </motion.div>

        {/* Spinning loader */}
        <div className="relative mb-4">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>

        {/* Step label */}
        <motion.h3
          key={`label-${streamingEnabled ? 'fetching' : currentLoadingStep}`}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-lg font-semibold text-gray-900 dark:text-white mb-2 text-center"
        >
          {step.label}
        </motion.h3>

        {/* Step description */}
        <motion.p
          key={`desc-${currentLoadingStep}`}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md mb-6"
        >
          {step.description}
        </motion.p>

        {/* Progress bar for streaming */}
        {streamingEnabled && (
          <div className="w-48 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${streamingResult.percentComplete}%` }}
            />
          </div>
        )}

        {/* Progress dots (only for non-streaming loading) */}
        {!streamingEnabled && (
          <div className="flex gap-2">
            {loadingSteps.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  idx === currentLoadingStep
                    ? 'bg-purple-500 scale-125'
                    : idx < currentLoadingStep
                    ? 'bg-purple-300'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
        )}

        {/* Loaded sources */}
        {streamingEnabled && streamingResult.loadedSources.length > 0 && (
          <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
            ✓ {streamingResult.loadedSources.join(', ')}
          </p>
        )}
      </div>
    );
  }

  // No data state - BUT skip this check if we have cached triggers
  // This allows showing cached triggers while UVP is still loading
  if ((!deepContext || !uvp) && !consolidationResult) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <Heart className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Data Available
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
          Complete the UVP flow to generate psychological triggers for your business.
        </p>
      </div>
    );
  }

  // Empty triggers state - prompt user to fetch fresh data
  if (!consolidationResult || consolidationResult.triggers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-purple-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Ready to Discover Triggers
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-6">
          Click the button below to fetch fresh data from Reddit, G2, YouTube and other sources to discover psychological triggers for your business.
        </p>
        <button
          onClick={handleFetchData}
          disabled={streamingEnabled || !currentBrand?.id}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
            streamingEnabled
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 cursor-wait'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
          }`}
        >
          {streamingEnabled ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {loadingStatus || 'Fetching...'}
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Fetch Fresh Data
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Streaming Progress Overlay - shows when refreshing with existing triggers */}
      {streamingEnabled && hasExistingTriggers && (
        <div className="mb-3 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-3">
            <Loader2 className="w-4 h-4 text-purple-600 animate-spin flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                  Refreshing data... {streamingResult.percentComplete}%
                </span>
                <span className="text-xs text-purple-500 dark:text-purple-400">
                  {streamingResult.loadedSources.length}/{streamingResult.totalSources} sources
                </span>
              </div>
              <div className="h-1.5 bg-purple-200 dark:bg-purple-900/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                  style={{ width: `${streamingResult.percentComplete}%` }}
                />
              </div>
            </div>
          </div>
          {streamingResult.loadedSources.length > 0 && (
            <p className="mt-2 text-xs text-purple-500 dark:text-purple-400 truncate">
              ✓ {streamingResult.loadedSources.slice(-3).join(', ')}
            </p>
          )}
        </div>
      )}

      {/* Header with Profile Badge and Filter */}
      <div className="flex-shrink-0 mb-4">
        {/* Profile Badge + Fetch Button */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Detected Profile:</span>
            <span className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg">
              {PROFILE_LABELS[consolidationResult.profileType]}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {consolidationResult.triggers.length} triggers • {consolidationResult.totalEvidenceItems} evidence
              {hasCachedData && (
                <span className="ml-1 text-blue-600 dark:text-blue-400">📦 cached</span>
              )}
            </div>

            {/* Re-consolidate button - recalculate UVP alignments from cached data */}
            {cachedContext && uvp && (
              <button
                onClick={handleReconsolidate}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50 rounded-lg font-medium"
                title="Recalculate UVP alignments"
              >
                <Target className="w-3 h-3" />
                Re-align
              </button>
            )}

            {/* Clear Cache button */}
            {(cachedContext || hasCachedData) && (
              <button
                onClick={handleClearCache}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 rounded-lg font-medium"
                title="Clear cached data"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            )}

            {/* Fetch Data Button */}
            <button
              onClick={handleFetchData}
              disabled={streamingEnabled || !currentBrand?.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                streamingEnabled
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 cursor-wait'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-sm'
              }`}
            >
              {streamingEnabled ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {streamingResult.percentComplete}%
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" />
                  Fetch Fresh
                </>
              )}
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              filterCategory === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-purple-100 dark:hover:bg-purple-900/20'
            }`}
          >
            All ({consolidationResult.triggers.length})
          </button>
          {CATEGORY_ORDER.map(cat => {
            const count = categoryCounts[cat] || 0;
            if (count === 0) return null;
            const config = CATEGORY_CONFIG[cat];
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  filterCategory === cat
                    ? 'bg-purple-600 text-white'
                    : `${config.bgColor} ${config.color} hover:opacity-80`
                }`}
              >
                <config.icon className="w-3 h-3" />
                {config.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Journey Stage Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mt-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 self-center mr-1">Stage:</span>
          <button
            onClick={() => setFilterJourneyStage('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              filterJourneyStage === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-purple-100 dark:hover:bg-purple-900/20'
            }`}
          >
            All
          </button>
          {JOURNEY_STAGE_ORDER.map(stage => {
            const count = journeyStageCounts[stage] || 0;
            const config = JOURNEY_STAGE_CONFIG[stage];
            return (
              <button
                key={stage}
                onClick={() => setFilterJourneyStage(stage)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                  filterJourneyStage === stage
                    ? 'bg-purple-600 text-white'
                    : count === 0
                      ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                      : `${config.bgColor} ${config.color} hover:opacity-80`
                }`}
                disabled={count === 0}
              >
                <span>{config.icon}</span>
                {config.shortLabel} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Triggers Grid - Grouped by Category */}
      <div className="flex-1 overflow-y-auto">
        {filterCategory === 'all' ? (
          // Show grouped view
          CATEGORY_ORDER.map(category => (
            <CategoryGroup
              key={category}
              category={category}
              triggers={groupedTriggers.get(category) || []}
              selectedTriggers={selectedTriggers}
              expandedCard={expandedCard}
              onToggle={onToggle}
              onToggleExpand={handleToggleExpand}
            />
          ))
        ) : (
          // Show flat grid for single category
          <div className="grid grid-cols-2 gap-3">
            {(groupedTriggers.get(filterCategory) || []).map((trigger) => (
              <TriggerCard
                key={trigger.id}
                trigger={trigger}
                isSelected={selectedTriggers.includes(trigger.id)}
                isExpanded={expandedCard === trigger.id}
                onToggleSelect={() => onToggle(trigger.id)}
                onToggleExpand={(e) => handleToggleExpand(trigger.id, e)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default TriggersPanelV2;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { TriggersPanelV2Props, ConsolidatedTrigger };
