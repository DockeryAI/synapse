/**
 * V5 Live Preview Hook
 *
 * Phase 7: Real-time content preview with V5 scoring.
 * Debounced generation for responsive UI updates.
 *
 * Created: 2025-12-01
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { contentOrchestrator } from '@/services/v5/content-orchestrator';
import { synapseScorerService } from '@/services/v5/synapse-scorer.service';
import { templateService } from '@/services/v5/template.service';
import type {
  Platform,
  V5GeneratedContent,
  ContentScore,
  CustomerCategory,
  UniversalTemplate,
} from '@/services/v5/types';
import type { SelectedInsight } from './useV5PowerModeGeneration';

// ============================================================================
// TYPES
// ============================================================================

export interface PreviewOptions {
  platform: Platform;
  brandId?: string;
  industrySlug?: string;
  eqScore?: number;
  selectedInsights?: SelectedInsight[];
  customerCategory?: CustomerCategory;
}

export interface PreviewContent {
  headline: string;
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
  score: ContentScore;
  templateId?: string;
}

export interface InsightSuggestion {
  type: SelectedInsight['type'];
  reason: string;
  expectedScoreBoost: number;
  dimensionBoosted: keyof ContentScore['dimensions'];
}

export interface UseV5LivePreviewReturn {
  // State
  isLoading: boolean;
  preview: PreviewContent | null;
  suggestions: InsightSuggestion[];

  // Functions
  updatePreview: (options: PreviewOptions) => void;
  refreshPreview: () => Promise<void>;
  getTemplateForPreview: (platform: Platform, category: CustomerCategory) => UniversalTemplate | null;

  // Utilities
  clearPreview: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEBOUNCE_MS = 500;

// ============================================================================
// INSIGHT SUGGESTION LOGIC
// ============================================================================

function generateInsightSuggestions(
  currentScore: ContentScore,
  selectedInsights: SelectedInsight[],
  _platform: Platform
): InsightSuggestion[] {
  const suggestions: InsightSuggestion[] = [];
  const selectedTypes = new Set(selectedInsights.map(i => i.type));

  // Check which dimensions need improvement
  const { dimensions } = currentScore;

  // Trust dimension low → suggest proof
  if (dimensions.trust < 15 && !selectedTypes.has('proof')) {
    suggestions.push({
      type: 'proof',
      reason: 'Add social proof to boost credibility',
      expectedScoreBoost: 8,
      dimensionBoosted: 'trust',
    });
  }

  // Urgency low → suggest trigger
  if (dimensions.urgency < 8 && !selectedTypes.has('trigger')) {
    suggestions.push({
      type: 'trigger',
      reason: 'Add a pain point trigger to create urgency',
      expectedScoreBoost: 6,
      dimensionBoosted: 'urgency',
    });
  }

  // Emotional triggers low → suggest trend or conversation
  if (dimensions.emotionalTriggers < 20) {
    if (!selectedTypes.has('trend')) {
      suggestions.push({
        type: 'trend',
        reason: 'Include a trending topic to increase relevance',
        expectedScoreBoost: 7,
        dimensionBoosted: 'emotionalTriggers',
      });
    }
    if (!selectedTypes.has('conversation')) {
      suggestions.push({
        type: 'conversation',
        reason: 'Use customer language for better resonance',
        expectedScoreBoost: 5,
        dimensionBoosted: 'emotionalTriggers',
      });
    }
  }

  // Power words low → suggest competitor edge
  if (dimensions.powerWords < 15 && !selectedTypes.has('competitor')) {
    suggestions.push({
      type: 'competitor',
      reason: 'Add competitive differentiation',
      expectedScoreBoost: 6,
      dimensionBoosted: 'powerWords',
    });
  }

  // Community engagement → suggest local
  if (!selectedTypes.has('local') && suggestions.length < 3) {
    suggestions.push({
      type: 'local',
      reason: 'Add local context for community connection',
      expectedScoreBoost: 4,
      dimensionBoosted: 'emotionalTriggers',
    });
  }

  // Sort by expected boost and take top 3
  return suggestions
    .sort((a, b) => b.expectedScoreBoost - a.expectedScoreBoost)
    .slice(0, 3);
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useV5LivePreview(): UseV5LivePreviewReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewContent | null>(null);
  const [suggestions, setSuggestions] = useState<InsightSuggestion[]>([]);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastOptionsRef = useRef<PreviewOptions | null>(null);

  /**
   * Clean up on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  /**
   * Generate preview content
   */
  const generatePreview = useCallback(async (options: PreviewOptions) => {
    setIsLoading(true);

    try {
      // Use quick generation (no retries for speed)
      const result = await contentOrchestrator.generate({
        platform: options.platform,
        brandId: options.brandId,
        industrySlug: options.industrySlug,
        eqScore: options.eqScore,
        customerCategory: options.customerCategory,
        skipAI: false,
        maxRetries: 1, // Limit retries for preview speed
      });

      if (result.success && result.content) {
        const previewContent: PreviewContent = {
          headline: result.content.headline,
          hook: result.content.headline, // Hook is often the headline
          body: result.content.body,
          cta: result.content.cta,
          hashtags: result.content.hashtags,
          score: result.content.score,
          templateId: result.context?.templateUsed,
        };

        setPreview(previewContent);

        // Generate suggestions based on current score
        const newSuggestions = generateInsightSuggestions(
          result.content.score,
          options.selectedInsights || [],
          options.platform
        );
        setSuggestions(newSuggestions);
      }
    } catch (err) {
      // Silently fail for preview - don't block UI
      console.warn('Preview generation failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Debounced preview update
   */
  const updatePreview = useCallback((options: PreviewOptions) => {
    lastOptionsRef.current = options;

    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new debounced call
    debounceRef.current = setTimeout(() => {
      generatePreview(options);
    }, DEBOUNCE_MS);
  }, [generatePreview]);

  /**
   * Force immediate preview refresh
   */
  const refreshPreview = useCallback(async () => {
    if (lastOptionsRef.current) {
      // Cancel any pending debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      await generatePreview(lastOptionsRef.current);
    }
  }, [generatePreview]);

  /**
   * Get template for preview display
   */
  const getTemplateForPreview = useCallback((
    platform: Platform,
    category: CustomerCategory
  ): UniversalTemplate | null => {
    const templates = templateService.filterTemplates({
      platform,
      customerCategories: [category],
    });
    return templates.length > 0 ? templates[0] : null;
  }, []);

  /**
   * Clear preview
   */
  const clearPreview = useCallback(() => {
    setPreview(null);
    setSuggestions([]);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, []);

  return {
    isLoading,
    preview,
    suggestions,
    updatePreview,
    refreshPreview,
    getTemplateForPreview,
    clearPreview,
  };
}

export default useV5LivePreview;
