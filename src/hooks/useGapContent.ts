/**
 * useGapContent Hook
 *
 * Phase 4 - Gap Tab 2.0
 * React hook for generating content from competitive gaps.
 * Provides state management, loading states, and content history.
 *
 * Created: 2025-11-28
 */

import { useState, useCallback, useMemo } from 'react';
import {
  gapContentGenerator,
  type GapContentType,
  type GapContentRequest,
  type GapContentResult,
  type ContentTemplate
} from '@/services/intelligence/gap-content-generator.service';
import type { CompetitorGap, CompetitorProfile } from '@/types/competitor-intelligence.types';
import type { DeepContext } from '@/types/synapse/deepContext.types';

// ============================================================================
// TYPES
// ============================================================================

interface UseGapContentOptions {
  defaultPlatform?: GapContentRequest['platform'];
  defaultTone?: GapContentRequest['tone'];
}

interface UseGapContentResult {
  // Templates
  templates: ContentTemplate[];
  getTemplate: (type: GapContentType) => ContentTemplate | undefined;
  getRecommendedTypes: (gap: CompetitorGap) => GapContentType[];

  // Generation
  generateContent: (
    gap: CompetitorGap,
    contentType: GapContentType,
    options?: Partial<GapContentRequest>
  ) => Promise<GapContentResult>;
  generateAllContent: (
    gap: CompetitorGap,
    options?: Partial<GapContentRequest>
  ) => Promise<GapContentResult[]>;

  // State
  isGenerating: boolean;
  currentGapId: string | null;
  currentContentType: GapContentType | null;
  error: string | null;

  // Results
  generatedContent: Map<string, GapContentResult[]>;
  getContentForGap: (gapId: string) => GapContentResult[];
  clearContent: (gapId?: string) => void;

  // History
  history: GapContentResult[];
  clearHistory: () => void;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useGapContent(
  competitors: CompetitorProfile[],
  deepContext: DeepContext | null,
  options: UseGapContentOptions = {}
): UseGapContentResult {
  const { defaultPlatform = 'linkedin', defaultTone = 'professional' } = options;

  // State
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentGapId, setCurrentGapId] = useState<string | null>(null);
  const [currentContentType, setCurrentContentType] = useState<GapContentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<Map<string, GapContentResult[]>>(new Map());
  const [history, setHistory] = useState<GapContentResult[]>([]);

  // Get templates
  const templates = useMemo(() => gapContentGenerator.getTemplates(), []);

  const getTemplate = useCallback((type: GapContentType) => {
    return gapContentGenerator.getTemplate(type);
  }, []);

  const getRecommendedTypes = useCallback((gap: CompetitorGap) => {
    return gapContentGenerator.getRecommendedContentTypes(gap);
  }, []);

  // Generate content for a single type
  const generateContent = useCallback(async (
    gap: CompetitorGap,
    contentType: GapContentType,
    requestOptions: Partial<GapContentRequest> = {}
  ): Promise<GapContentResult> => {
    setIsGenerating(true);
    setCurrentGapId(gap.id);
    setCurrentContentType(contentType);
    setError(null);

    try {
      const result = await gapContentGenerator.generateContent({
        gap,
        contentType,
        competitors,
        deepContext,
        platform: requestOptions.platform || defaultPlatform,
        tone: requestOptions.tone || defaultTone,
        ...requestOptions
      });

      // Store result
      setGeneratedContent(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(gap.id) || [];
        // Replace if same type exists, otherwise add
        const filtered = existing.filter(r => r.contentType !== contentType);
        newMap.set(gap.id, [...filtered, result]);
        return newMap;
      });

      // Add to history
      setHistory(prev => [result, ...prev.slice(0, 49)]); // Keep last 50

      console.log('[useGapContent] Generated content:', {
        gapId: gap.id,
        contentType,
        headline: result.headline.substring(0, 50)
      });

      return result;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      setError(message);
      console.error('[useGapContent] Generation error:', err);
      throw err;

    } finally {
      setIsGenerating(false);
      setCurrentGapId(null);
      setCurrentContentType(null);
    }
  }, [competitors, deepContext, defaultPlatform, defaultTone]);

  // Generate all content types for a gap
  const generateAllContent = useCallback(async (
    gap: CompetitorGap,
    requestOptions: Partial<GapContentRequest> = {}
  ): Promise<GapContentResult[]> => {
    setIsGenerating(true);
    setCurrentGapId(gap.id);
    setError(null);

    try {
      const results = await gapContentGenerator.generateAllContent(
        gap,
        competitors,
        deepContext,
        {
          platform: requestOptions.platform || defaultPlatform,
          tone: requestOptions.tone || defaultTone,
          ...requestOptions
        }
      );

      // Store all results
      setGeneratedContent(prev => {
        const newMap = new Map(prev);
        newMap.set(gap.id, results);
        return newMap;
      });

      // Add all to history
      setHistory(prev => [...results, ...prev.slice(0, 50 - results.length)]);

      console.log('[useGapContent] Generated all content:', {
        gapId: gap.id,
        count: results.length
      });

      return results;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      setError(message);
      console.error('[useGapContent] Generation error:', err);
      throw err;

    } finally {
      setIsGenerating(false);
      setCurrentGapId(null);
      setCurrentContentType(null);
    }
  }, [competitors, deepContext, defaultPlatform, defaultTone]);

  // Get content for a specific gap
  const getContentForGap = useCallback((gapId: string): GapContentResult[] => {
    return generatedContent.get(gapId) || [];
  }, [generatedContent]);

  // Clear content
  const clearContent = useCallback((gapId?: string) => {
    if (gapId) {
      setGeneratedContent(prev => {
        const newMap = new Map(prev);
        newMap.delete(gapId);
        return newMap;
      });
    } else {
      setGeneratedContent(new Map());
    }
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    // Templates
    templates,
    getTemplate,
    getRecommendedTypes,

    // Generation
    generateContent,
    generateAllContent,

    // State
    isGenerating,
    currentGapId,
    currentContentType,
    error,

    // Results
    generatedContent,
    getContentForGap,
    clearContent,

    // History
    history,
    clearHistory
  };
}

export default useGapContent;
