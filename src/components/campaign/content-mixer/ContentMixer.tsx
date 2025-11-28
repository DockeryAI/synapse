/**
 * Content Mixer Container
 *
 * Main component orchestrating the 3-column drag-and-drop interface:
 * - Left: Insight Pool (categorized insights)
 * - Middle: Selection Area (drag insights here)
 * - Right: Live Preview (real-time campaign preview)
 *
 * V3.1: Integrated with ContentSynthesisOrchestrator for:
 * - EQ-weighted insight scoring
 * - Dynamic re-synthesis on filter changes
 * - UVP-aligned CTA generation
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Brain, RefreshCw, AlertCircle } from 'lucide-react';
import { SynthesisErrorBanner } from '@/components/synthesis/SynthesisErrorBanner';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
  closestCenter
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { InsightPool } from './InsightPool';
import { SelectionArea } from './SelectionArea';
import { LivePreview } from './LivePreview';
import { InsightCard } from './InsightCard';
import { UVPContentOptions } from './UVPContentOptions';
import { useContentSynthesis } from '@/hooks/useContentSynthesis';
import type { CategorizedInsight, InsightPool as InsightPoolType } from '@/types/content-mixer.types';
import type { DeepContext } from '@/types/synapse/deepContext.types';
import type { JourneyStage } from '@/services/intelligence/content-synthesis-orchestrator.service';

interface ContentMixerProps {
  /** Available insights organized by category */
  pool: InsightPoolType;

  /** Callback when user generates campaign */
  onGenerate: (selectedInsights: CategorizedInsight[]) => void | Promise<void>;

  /** Maximum insights allowed in selection */
  maxInsights?: number;

  /** DeepContext for UVP-powered content generation (Phase D) */
  context?: DeepContext | null;

  /** Business segment for UVP features */
  segment?: 'smb_local' | 'smb_regional' | 'b2b_national' | 'b2b_global';

  /** Show UVP content tools panel */
  showUVPTools?: boolean;

  /** V3.1: Brand data for orchestrator context */
  brandData?: {
    name?: string;
    industry?: string;
    naicsCode?: string;
  };

  /** V3.1: UVP data for orchestrator context */
  uvpData?: {
    target_customer?: string;
    key_benefit?: string;
    transformation?: string;
    unique_mechanism?: string;
    proof_points?: string[];
  };
}

export function ContentMixer({
  pool,
  onGenerate,
  maxInsights = 5,
  context = null,
  segment = 'smb_local',
  showUVPTools = true,
  brandData,
  uvpData
}: ContentMixerProps) {
  const [selectedInsights, setSelectedInsights] = useState<CategorizedInsight[]>([]);
  const [activeInsight, setActiveInsight] = useState<CategorizedInsight | null>(null);
  const [platform, setPlatform] = useState<'linkedin' | 'facebook' | 'instagram' | 'twitter' | 'tiktok'>('linkedin');
  const [journeyStage, setJourneyStage] = useState<JourneyStage>('awareness');
  const [reSynthesizedInsights, setReSynthesizedInsights] = useState<CategorizedInsight[]>([]);

  // V3.1: Use ContentSynthesisOrchestrator for EQ-weighted scoring and re-synthesis
  const {
    enrichedContext,
    isContextLoading,
    loadContext,
    scoreInsights,
    reSynthesizeForStage,
    isReSynthesizing,
    generateUVPCTA,
    getRecommendedFramework,
    contextError,
    reSynthesisError,
    retryLoadContext,
    clearErrors
  } = useContentSynthesis({
    brandName: brandData?.name || context?.business?.profile?.name || 'Unknown',
    industry: brandData?.industry || context?.business?.profile?.industry || 'General',
    naicsCode: brandData?.naicsCode,
    segment: segment as 'smb_local' | 'smb_regional' | 'b2b_national' | 'b2b_global',
    uvpData: uvpData || {
      target_customer: context?.business?.uvp?.targetCustomer,
      key_benefit: context?.business?.uvp?.keyBenefit,
      transformation: context?.business?.uvp?.desiredOutcome
    }
  });

  // Load enriched context on mount
  useEffect(() => {
    if (brandData?.name || context?.business?.profile?.name) {
      loadContext();
    }
  }, [brandData?.name, context?.business?.profile?.name, loadContext]);

  // Re-synthesize insights when journey stage changes
  useEffect(() => {
    const reSynthesize = async () => {
      if (!enrichedContext || selectedInsights.length === 0) return;

      const reSynthesized = await reSynthesizeForStage(selectedInsights, journeyStage);
      // Map orchestrated insights back to CategorizedInsight format
      const mapped = reSynthesized.map(insight => {
        const original = selectedInsights.find(si => si.id === (insight as any).id);
        return {
          ...original,
          ...insight,
          id: insight.id || original?.id || `resynth-${Date.now()}`,
          category: original?.category || 'industry',
          displayTitle: insight.title || original?.displayTitle,
          dataSource: original?.dataSource || 'AI Synthesis'
        } as CategorizedInsight;
      });
      setReSynthesizedInsights(mapped);
    };

    reSynthesize();
  }, [journeyStage, enrichedContext, selectedInsights.length, reSynthesizeForStage, selectedInsights]);

  // Configure drag sensors - optimized for both mouse and touch
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8 // 8px movement required to start drag on desktop
      }
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 200ms hold before drag starts on touch
        tolerance: 5 // Allow 5px of movement during hold
      }
    })
  );

  // Get display insights (re-synthesized if available, otherwise original)
  const displayInsights = useMemo(() => {
    if (reSynthesizedInsights.length > 0 && reSynthesizedInsights.length === selectedInsights.length) {
      return reSynthesizedInsights;
    }
    return selectedInsights;
  }, [reSynthesizedInsights, selectedInsights]);

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const insightId = event.active.id as string;

    // Find insight in pool or selection
    let insight: CategorizedInsight | undefined;

    // Check selected insights first
    insight = selectedInsights.find(i => i.id === insightId);

    // If not in selection, search pool
    if (!insight) {
      for (const category of Object.keys(pool.byCategory)) {
        const found = pool.byCategory[category as keyof typeof pool.byCategory]?.find(
          i => i.id === insightId
        );
        if (found) {
          insight = found;
          break;
        }
      }
    }

    setActiveInsight(insight || null);
  }, [selectedInsights, pool.byCategory]);

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    setActiveInsight(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the active insight
    let activeInsight: CategorizedInsight | undefined;

    // Check if it's from selection
    const fromSelection = selectedInsights.find(i => i.id === activeId);
    if (fromSelection) {
      activeInsight = fromSelection;
    } else {
      // Find in pool
      for (const category of Object.keys(pool.byCategory)) {
        const found = pool.byCategory[category as keyof typeof pool.byCategory]?.find(
          i => i.id === activeId
        );
        if (found) {
          activeInsight = found;
          break;
        }
      }
    }

    if (!activeInsight) return;

    // Case 1: Dropped on selection area (adding new insight)
    if (overId === 'selection-area') {
      // Don't add if already in selection or selection is full
      if (selectedInsights.some(i => i.id === activeId)) return;
      if (selectedInsights.length >= maxInsights) return;

      setSelectedInsights(prev => [...prev, activeInsight!]);
      return;
    }

    // Case 2: Dropped on insight pool (removing from selection)
    if (overId === 'insight-pool') {
      setSelectedInsights(prev => prev.filter(i => i.id !== activeId));
      return;
    }

    // Case 3: Reordering within selection
    if (selectedInsights.some(i => i.id === activeId) && selectedInsights.some(i => i.id === overId)) {
      const oldIndex = selectedInsights.findIndex(i => i.id === activeId);
      const newIndex = selectedInsights.findIndex(i => i.id === overId);

      if (oldIndex !== -1 && newIndex !== -1) {
        setSelectedInsights(prev => arrayMove(prev, oldIndex, newIndex));
      }
    }
  }, [selectedInsights, pool.byCategory, maxInsights]);

  // Handle removing an insight
  const handleRemoveInsight = useCallback((insightId: string) => {
    setSelectedInsights(prev => prev.filter(i => i.id !== insightId));
  }, []);

  // Handle clearing all insights
  const handleClearAll = useCallback(() => {
    setSelectedInsights([]);
  }, []);

  // Handle generate button - use display insights (re-synthesized if available)
  const handleGenerate = useCallback(() => {
    if (displayInsights.length > 0) {
      onGenerate(displayInsights);
    }
  }, [displayInsights, onGenerate]);

  // Journey stage options for the filter
  const journeyStageOptions: { value: JourneyStage; label: string; description: string }[] = [
    { value: 'awareness', label: 'Awareness', description: 'Problem recognition' },
    { value: 'consideration', label: 'Consideration', description: 'Solution evaluation' },
    { value: 'decision', label: 'Decision', description: 'Purchase confidence' },
    { value: 'retention', label: 'Retention', description: 'Value reinforcement' }
  ];

  // Combined error for display
  const synthesisError = contextError || reSynthesisError;

  return (
    <div className="h-full bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      {/* V3.2: Synthesis Error Banner */}
      {synthesisError && (
        <div className="px-4 pt-3">
          <SynthesisErrorBanner
            error={synthesisError}
            onRetry={retryLoadContext}
            onDismiss={clearErrors}
            isRetrying={isContextLoading}
          />
        </div>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 sm:px-6 py-3 sm:py-4 border-b border-purple-200 dark:border-purple-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <motion.div
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className="p-1.5 sm:p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg shadow-lg flex-shrink-0"
            >
              <Sparkles className="text-white" size={20} />
            </motion.div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Content Mixer
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                Drag insights to create your perfect campaign mix
              </p>
            </div>
          </div>

          {/* V3.1: Journey Stage Filter - triggers re-synthesis */}
          <div className="flex items-center gap-2">
            {isReSynthesizing && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <RefreshCw size={16} className="text-purple-500" />
              </motion.div>
            )}
            {enrichedContext && (
              <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <Brain size={14} className="text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                  EQ: {enrichedContext.eqProfile.emotional_weight}%
                </span>
              </div>
            )}
            <select
              value={journeyStage}
              onChange={(e) => setJourneyStage(e.target.value as JourneyStage)}
              className="text-sm px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {journeyStageOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* 3-Column Layout */}
        <div className="h-[calc(100%-80px)] flex flex-col lg:flex-row gap-0">
          {/* Left Column: Insight Pool */}
          <div className="w-full lg:w-80 xl:w-96 lg:h-full flex-shrink-0">
            <InsightPool
              pool={pool}
              selectedInsightIds={selectedInsights.map(i => i.id)}
            />
          </div>

          {/* Middle Column: Selection Area - shows re-synthesized insights */}
          <div className="w-full lg:w-80 xl:w-96 lg:h-full flex-shrink-0 border-x border-purple-200 dark:border-purple-700">
            <SelectionArea
              selectedInsights={displayInsights}
              maxInsights={maxInsights}
              onRemoveInsight={handleRemoveInsight}
              onClearAll={handleClearAll}
            />
          </div>

          {/* Right Column: Live Preview - uses re-synthesized content */}
          <div className="flex-1 lg:h-full">
            <LivePreview
              selectedInsights={displayInsights}
              platform={platform}
              onPlatformChange={setPlatform}
              onGenerate={handleGenerate}
            />
          </div>

          {/* UVP Content Tools Panel (Phase D - Item #30) */}
          {showUVPTools && (
            <div className="w-full lg:w-80 xl:w-96 lg:h-full flex-shrink-0">
              <UVPContentOptions
                selectedInsights={displayInsights}
                context={context}
                segment={segment}
              />
            </div>
          )}
        </div>

        {/* Drag Overlay (shows while dragging) */}
        <DragOverlay>
          {activeInsight ? (
            <motion.div
              initial={{ rotate: 0, scale: 1 }}
              animate={{ rotate: 3, scale: 1.05 }}
              className="opacity-90"
            >
              <InsightCard
                insight={activeInsight}
                draggable={false}
                inSelection={false}
              />
            </motion.div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
