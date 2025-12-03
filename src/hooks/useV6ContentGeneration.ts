// PRD Feature: SYNAPSE-V6
/**
 * V6 Content Generation Hook
 *
 * React hook for generating content from V6 insights.
 * Wires the V1 content generation pipeline to the UI.
 */

import { useState, useCallback } from 'react';
import {
  generateV6Content,
  generateAllFormatsForInsight,
  getFormatRecommendation,
  type V6ContentGenerationOptions,
  type V6GenerationResult,
} from '@/services/synapse-v6/v6-content-generation.service';
import type { V6Insight } from '@/services/synapse-v6/v6-insight-types';
import type { BusinessProfile, ContentFormat, SynapseContent } from '@/types/synapseContent.types';

export interface ContentGenerationState {
  isGenerating: boolean;
  content: SynapseContent[];
  result: V6GenerationResult | null;
  selectedFormat: ContentFormat | null;
  formatRecommendation: {
    primary: ContentFormat;
    alternatives: ContentFormat[];
    reason: string;
  } | null;
  error: string | null;
}

export interface UseV6ContentGenerationReturn extends ContentGenerationState {
  generateContent: (
    insights: V6Insight[],
    business: BusinessProfile,
    options?: V6ContentGenerationOptions
  ) => Promise<void>;
  generateForInsight: (
    insight: V6Insight,
    business: BusinessProfile
  ) => Promise<void>;
  getRecommendation: (insight: V6Insight) => void;
  selectFormat: (format: ContentFormat) => void;
  clearContent: () => void;
}

export function useV6ContentGeneration(): UseV6ContentGenerationReturn {
  const [state, setState] = useState<ContentGenerationState>({
    isGenerating: false,
    content: [],
    result: null,
    selectedFormat: null,
    formatRecommendation: null,
    error: null,
  });

  /**
   * Generate content from multiple insights
   */
  const generateContent = useCallback(async (
    insights: V6Insight[],
    business: BusinessProfile,
    options?: V6ContentGenerationOptions
  ) => {
    if (insights.length === 0) {
      setState(prev => ({
        ...prev,
        error: 'No insights selected for content generation',
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isGenerating: true,
      error: null,
    }));

    try {
      const result = await generateV6Content(insights, business, options);

      setState({
        isGenerating: false,
        content: result.content,
        result,
        selectedFormat: null,
        formatRecommendation: null,
        error: null,
      });

      console.log('[useV6ContentGeneration] Generated content:', {
        count: result.content.length,
        formats: result.stats.byFormat,
        avgScores: result.stats.averageScores,
      });

    } catch (error) {
      console.error('[useV6ContentGeneration] Generation failed:', error);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Content generation failed',
      }));
    }
  }, []);

  /**
   * Generate all format options for a single insight
   */
  const generateForInsight = useCallback(async (
    insight: V6Insight,
    business: BusinessProfile
  ) => {
    setState(prev => ({
      ...prev,
      isGenerating: true,
      error: null,
    }));

    try {
      // Get format recommendation first
      const recommendation = getFormatRecommendation(insight);

      // Generate all formats
      const content = await generateAllFormatsForInsight(insight, business);

      setState({
        isGenerating: false,
        content,
        result: null,
        selectedFormat: recommendation.primary,
        formatRecommendation: recommendation,
        error: null,
      });

      console.log('[useV6ContentGeneration] Generated formats for insight:', {
        insightId: insight.id,
        formats: content.map(c => c.format),
        recommended: recommendation.primary,
      });

    } catch (error) {
      console.error('[useV6ContentGeneration] Generation failed:', error);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Content generation failed',
      }));
    }
  }, []);

  /**
   * Get format recommendation for an insight
   */
  const getRecommendation = useCallback((insight: V6Insight) => {
    const recommendation = getFormatRecommendation(insight);
    setState(prev => ({
      ...prev,
      formatRecommendation: recommendation,
      selectedFormat: recommendation.primary,
    }));
  }, []);

  /**
   * Select a content format
   */
  const selectFormat = useCallback((format: ContentFormat) => {
    setState(prev => ({
      ...prev,
      selectedFormat: format,
    }));
  }, []);

  /**
   * Clear generated content
   */
  const clearContent = useCallback(() => {
    setState({
      isGenerating: false,
      content: [],
      result: null,
      selectedFormat: null,
      formatRecommendation: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    generateContent,
    generateForInsight,
    getRecommendation,
    selectFormat,
    clearContent,
  };
}

export default useV6ContentGeneration;
