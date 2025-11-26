/**
 * Insight Selection Hook
 * Manages multi-select state with smart compatibility checking
 */

import { useState, useCallback, useMemo } from 'react';
import type { SelectedInsight } from '@/components/dashboard/LivePreviewPanel';
import type { OpportunityAlert } from '@/types/v2/intelligence.types';
import type { SmartPick } from '@/types/smart-picks.types';

export type CompatibilityStatus = 'compatible' | 'partial' | 'conflict';

export interface InsightCompatibility {
  status: CompatibilityStatus;
  reason?: string;
}

export interface UseInsightSelectionReturn {
  selectedInsights: SelectedInsight[];
  selectedIds: Set<string>;
  isSelected: (id: string) => boolean;
  toggleSelection: (insight: SelectedInsight) => void;
  clearSelection: () => void;
  selectAll: (insights: SelectedInsight[]) => void;
  checkCompatibility: (insight: SelectedInsight) => InsightCompatibility;
  getCompatibilityColor: (status: CompatibilityStatus) => string;
}

/**
 * Check if two insights are compatible
 */
function areInsightsCompatible(
  existing: SelectedInsight[],
  newInsight: SelectedInsight
): InsightCompatibility {
  if (existing.length === 0) {
    return { status: 'compatible' };
  }

  // Check type compatibility
  const types = existing.map(i => i.type);

  // Opportunities + AI Picks = Compatible (great combination)
  const hasOpportunity = types.includes('opportunity') || newInsight.type === 'opportunity';
  const hasAIPick = types.includes('ai-pick') || newInsight.type === 'ai-pick';

  if (hasOpportunity && hasAIPick) {
    return {
      status: 'compatible',
      reason: 'Opportunities pair well with AI picks for high-impact content',
    };
  }

  // Opportunities + Intelligence = Compatible
  const hasIntelligence = types.includes('intelligence') || newInsight.type === 'intelligence';

  if (hasOpportunity && hasIntelligence) {
    return {
      status: 'compatible',
      reason: 'Intelligence enriches opportunity-based content',
    };
  }

  // AI Picks + Intelligence = Partial (can work but needs review)
  if (hasAIPick && hasIntelligence) {
    return {
      status: 'partial',
      reason: 'AI picks and intelligence can work together but may need adjustment',
    };
  }

  // Multiple opportunities = Partial (might be too much to combine)
  if (types.filter(t => t === 'opportunity').length >= 2 && newInsight.type === 'opportunity') {
    return {
      status: 'partial',
      reason: 'Multiple opportunities can be combined but may dilute focus',
    };
  }

  // Multiple AI picks = Conflict (should focus on one campaign)
  if (types.filter(t => t === 'ai-pick').length >= 1 && newInsight.type === 'ai-pick') {
    return {
      status: 'conflict',
      reason: 'Multiple AI picks may conflict - focus on one campaign theme',
    };
  }

  // Default to compatible
  return {
    status: 'compatible',
    reason: 'These insights can be combined effectively',
  };
}

/**
 * Custom hook for managing insight selection with compatibility checking
 */
export function useInsightSelection(): UseInsightSelectionReturn {
  const [selectedInsights, setSelectedInsights] = useState<SelectedInsight[]>([]);

  const selectedIds = useMemo(() => {
    return new Set(selectedInsights.map(i => i.id));
  }, [selectedInsights]);

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  const toggleSelection = useCallback((insight: SelectedInsight) => {
    setSelectedInsights(prev => {
      const isCurrentlySelected = prev.some(i => i.id === insight.id);

      if (isCurrentlySelected) {
        // Remove from selection
        return prev.filter(i => i.id !== insight.id);
      } else {
        // Add to selection
        return [...prev, insight];
      }
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedInsights([]);
  }, []);

  const selectAll = useCallback((insights: SelectedInsight[]) => {
    setSelectedInsights(insights);
  }, []);

  const checkCompatibility = useCallback(
    (insight: SelectedInsight): InsightCompatibility => {
      // If already selected, it's compatible (user can deselect)
      if (selectedIds.has(insight.id)) {
        return { status: 'compatible', reason: 'Already selected' };
      }

      return areInsightsCompatible(selectedInsights, insight);
    },
    [selectedInsights, selectedIds]
  );

  const getCompatibilityColor = useCallback((status: CompatibilityStatus): string => {
    switch (status) {
      case 'compatible':
        return 'border-green-500 dark:border-green-400';
      case 'partial':
        return 'border-yellow-500 dark:border-yellow-400';
      case 'conflict':
        return 'border-red-500 dark:border-red-400';
      default:
        return 'border-gray-300 dark:border-gray-600';
    }
  }, []);

  return {
    selectedInsights,
    selectedIds,
    isSelected,
    toggleSelection,
    clearSelection,
    selectAll,
    checkCompatibility,
    getCompatibilityColor,
  };
}

/**
 * Helper functions to convert various types to SelectedInsight
 */
export function opportunityToInsight(alert: OpportunityAlert): SelectedInsight {
  return {
    id: alert.id,
    type: 'opportunity',
    title: alert.title,
    description: alert.description,
    source: alert.source,
    metadata: {
      tier: alert.tier,
      urgencyScore: alert.urgencyScore,
      potentialImpact: alert.potentialImpact,
      suggestedTemplates: alert.suggestedTemplates,
      ...alert.metadata,
    },
  };
}

export function aiPickToInsight(pick: SmartPick): SelectedInsight {
  return {
    id: pick.id,
    type: 'ai-pick',
    title: pick.title,
    description: pick.description,
    content: pick.preview
      ? {
          headline: pick.preview.headline,
          hook: pick.preview.hook,
        }
      : undefined,
    source: 'ai-recommendation',
    metadata: {
      campaignType: pick.campaignType,
      confidence: pick.confidence,
      relevance: pick.relevance,
      expectedPerformance: pick.expectedPerformance,
    },
  };
}

export function intelligenceToInsight(
  id: string,
  title: string,
  description: string,
  source: string,
  metadata?: Record<string, any>
): SelectedInsight {
  return {
    id,
    type: 'intelligence',
    title,
    description,
    source,
    metadata,
  };
}
