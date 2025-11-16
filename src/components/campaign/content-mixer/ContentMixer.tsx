/**
 * Content Mixer Container
 *
 * Main component orchestrating the 3-column drag-and-drop interface:
 * - Left: Insight Pool (categorized insights)
 * - Middle: Selection Area (drag insights here)
 * - Right: Live Preview (real-time campaign preview)
 */

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { InsightPool } from './InsightPool';
import { SelectionArea } from './SelectionArea';
import { LivePreview } from './LivePreview';
import { InsightCard } from './InsightCard';
import type { CategorizedInsight, InsightPool as InsightPoolType } from '@/types/content-mixer.types';

interface ContentMixerProps {
  /** Available insights organized by category */
  pool: InsightPoolType;

  /** Callback when user generates campaign */
  onGenerate: (selectedInsights: CategorizedInsight[]) => void | Promise<void>;

  /** Maximum insights allowed in selection */
  maxInsights?: number;
}

export function ContentMixer({ pool, onGenerate, maxInsights = 5 }: ContentMixerProps) {
  const [selectedInsights, setSelectedInsights] = useState<CategorizedInsight[]>([]);
  const [activeInsight, setActiveInsight] = useState<CategorizedInsight | null>(null);
  const [platform, setPlatform] = useState<'linkedin' | 'facebook' | 'instagram' | 'twitter' | 'tiktok'>('linkedin');

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8 // 8px movement required to start drag
      }
    })
  );

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

  // Handle generate button
  const handleGenerate = useCallback(() => {
    if (selectedInsights.length > 0) {
      onGenerate(selectedInsights);
    }
  }, [selectedInsights, onGenerate]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* 3-Column Layout */}
      <div className="h-full flex flex-col lg:flex-row gap-0">
        {/* Left Column: Insight Pool */}
        <div className="w-full lg:w-80 xl:w-96 lg:h-full flex-shrink-0">
          <InsightPool
            pool={pool}
            selectedInsightIds={selectedInsights.map(i => i.id)}
          />
        </div>

        {/* Middle Column: Selection Area */}
        <div className="w-full lg:w-80 xl:w-96 lg:h-full flex-shrink-0">
          <SelectionArea
            selectedInsights={selectedInsights}
            maxInsights={maxInsights}
            onRemoveInsight={handleRemoveInsight}
            onClearAll={handleClearAll}
          />
        </div>

        {/* Right Column: Live Preview */}
        <div className="flex-1 lg:h-full">
          <LivePreview
            selectedInsights={selectedInsights}
            platform={platform}
            onPlatformChange={setPlatform}
            onGenerate={handleGenerate}
          />
        </div>
      </div>

      {/* Drag Overlay (shows while dragging) */}
      <DragOverlay>
        {activeInsight ? (
          <div className="rotate-3 scale-105 opacity-90">
            <InsightCard
              insight={activeInsight}
              draggable={false}
              inSelection={false}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
