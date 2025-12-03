/**
 * V5 Power Mode Generation Hook
 *
 * Phase 7: Wires Power Mode UI to V5 content engine.
 * Transforms selected insights from all 7 tabs into V5 variables and context.
 *
 * Full data stack: Industry Profile + UVP + EQ + Intelligence APIs
 *
 * Created: 2025-12-01
 */

import { useState, useCallback, useRef } from 'react';
import { contentOrchestrator } from '@/services/v5/content-orchestrator';
import { industryProfileService } from '@/services/v5/industry-profile.service';
import { uvpProviderService } from '@/services/v5/uvp-provider.service';
import { eqIntegrationService } from '@/services/v5/eq-integration.service';
import { intelligenceService } from '@/services/v5/intelligence.service';
import { synapseScorerService } from '@/services/v5/synapse-scorer.service';
import type {
  Platform,
  CustomerCategory,
  ContentType,
  V5GeneratedContent,
  V5GenerationResult,
  UVPVariables,
  IndustryPsychology,
  ContentScore,
} from '@/services/v5/types';

// ============================================================================
// TYPES
// ============================================================================

export interface SelectedInsight {
  id: string;
  type: 'trigger' | 'proof' | 'trend' | 'conversation' | 'competitor' | 'local' | 'weather';
  title: string;
  description?: string;
  category?: string;
  confidence?: number;
  data?: Record<string, unknown>;
}

export interface PowerModeOptions {
  platform: Platform;
  contentType?: ContentType;
  customerCategory?: CustomerCategory;
  brandId?: string;
  industrySlug?: string;
  eqScore?: number;
  selectedInsights?: SelectedInsight[];
  skipAI?: boolean;
}

export interface PowerModeResult {
  success: boolean;
  content?: V5GeneratedContent;
  error?: string;
  context?: {
    industrySlug: string;
    customerCategory: CustomerCategory;
    templateUsed: string;
    insightsUsed: string[];
  };
}

export interface UseV5PowerModeGenerationReturn {
  // State
  isGenerating: boolean;
  error: string | null;
  generatedContent: V5GeneratedContent | null;
  lastScore: ContentScore | null;

  // Generation functions
  generateWithInsights: (options: PowerModeOptions) => Promise<PowerModeResult>;
  generateQuickPreview: (options: PowerModeOptions) => Promise<PowerModeResult>;
  regenerate: () => Promise<PowerModeResult>;

  // Score functions
  scoreContent: (content: string) => ContentScore;
  getImprovementHints: () => string[];

  // Utilities
  clearContent: () => void;
  clearError: () => void;
}

// ============================================================================
// INSIGHT TO VARIABLE MAPPING
// ============================================================================

function mapInsightsToVariables(
  insights: SelectedInsight[],
  baseVariables: UVPVariables
): UVPVariables {
  const enriched = { ...baseVariables };

  for (const insight of insights) {
    switch (insight.type) {
      case 'trigger':
        // Add trigger to pain point or transformation
        if (insight.description) {
          enriched.painPoint = insight.description;
        }
        break;

      case 'proof':
        // Add proof point
        enriched.proofPoint = insight.title;
        if (insight.data?.metric) {
          enriched.proofMetric = String(insight.data.metric);
        }
        if (insight.data?.testimonial) {
          enriched.testimonial = String(insight.data.testimonial);
        }
        break;

      case 'trend':
        // Add trending topic
        enriched.trend = insight.title;
        if (insight.data?.hook) {
          enriched.trendHook = String(insight.data.hook);
        }
        break;

      case 'conversation':
        // Add customer language
        if (insight.data?.phrase) {
          enriched.customerPhrase = String(insight.data.phrase);
        }
        if (insight.data?.sentiment) {
          enriched.customerSentiment = String(insight.data.sentiment);
        }
        break;

      case 'competitor':
        // Add competitive edge
        enriched.competitiveEdge = insight.title;
        if (insight.data?.gap) {
          enriched.competitorGap = String(insight.data.gap);
        }
        break;

      case 'local':
        // Add local context
        enriched.localEvent = insight.title;
        if (insight.data?.location) {
          enriched.location = String(insight.data.location);
        }
        enriched.communityHook = insight.description || insight.title;
        break;

      case 'weather':
        // Add weather context
        enriched.weatherContext = insight.title;
        if (insight.data?.condition) {
          enriched.weatherCondition = String(insight.data.condition);
        }
        break;
    }
  }

  return enriched;
}

function mapInsightsToPowerWords(
  insights: SelectedInsight[],
  basePowerWords: string[]
): string[] {
  const additionalWords: string[] = [];

  for (const insight of insights) {
    // Extract power words from conversation insights
    if (insight.type === 'conversation' && insight.data?.phrases) {
      const phrases = insight.data.phrases as string[];
      additionalWords.push(...phrases.slice(0, 3));
    }

    // Extract from trigger keywords
    if (insight.type === 'trigger' && insight.data?.keywords) {
      const keywords = insight.data.keywords as string[];
      additionalWords.push(...keywords.slice(0, 3));
    }
  }

  return [...new Set([...basePowerWords, ...additionalWords])];
}

function mapInsightToCustomerCategory(insights: SelectedInsight[]): CustomerCategory | undefined {
  // Check for explicit category signals in insights
  for (const insight of insights) {
    if (insight.type === 'trigger') {
      // Pain-focused triggers → pain-driven
      if (insight.category === 'pain' || insight.title.toLowerCase().includes('problem')) {
        return 'pain-driven';
      }
      // Goal-focused triggers → aspiration-driven
      if (insight.category === 'aspiration' || insight.title.toLowerCase().includes('goal')) {
        return 'aspiration-driven';
      }
    }

    if (insight.type === 'proof') {
      // Trust signals → trust-seeking
      return 'trust-seeking';
    }

    if (insight.type === 'local') {
      // Local engagement → community-driven
      return 'community-driven';
    }
  }

  return undefined;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useV5PowerModeGeneration(): UseV5PowerModeGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<V5GeneratedContent | null>(null);
  const [lastScore, setLastScore] = useState<ContentScore | null>(null);

  const lastOptionsRef = useRef<PowerModeOptions | null>(null);
  const contextRef = useRef<{
    industryPsychology?: IndustryPsychology;
    uvpVariables?: UVPVariables;
  }>({});

  /**
   * Main generation with selected insights
   */
  const generateWithInsights = useCallback(async (
    options: PowerModeOptions
  ): Promise<PowerModeResult> => {
    setIsGenerating(true);
    setError(null);
    lastOptionsRef.current = options;

    try {
      // 1. Load industry psychology
      const industryPsychology = options.industrySlug
        ? await industryProfileService.loadProfile(options.industrySlug)
        : industryProfileService.getDefaultPsychology();

      contextRef.current.industryPsychology = industryPsychology;

      // 2. Load UVP variables
      let uvpVariables = options.brandId
        ? await uvpProviderService.loadFromBrand(options.brandId)
        : uvpProviderService.getDefaultVariables();

      // 3. Enrich with intelligence (graceful degradation)
      if (options.brandId) {
        try {
          const intelligence = await intelligenceService.loadFullContext(
            options.brandId,
            options.industrySlug
          );
          uvpVariables = intelligenceService.mergeIntoVariables(uvpVariables, intelligence);
        } catch {
          // Continue without intelligence
        }
      }

      // 4. Map selected insights to variables
      if (options.selectedInsights && options.selectedInsights.length > 0) {
        uvpVariables = mapInsightsToVariables(options.selectedInsights, uvpVariables);

        // Also enrich power words from conversation insights
        const enrichedPowerWords = mapInsightsToPowerWords(
          options.selectedInsights,
          industryPsychology.powerWords
        );
        industryPsychology.powerWords = enrichedPowerWords;
      }

      contextRef.current.uvpVariables = uvpVariables;

      // 5. Determine customer category from insights or EQ
      const insightCategory = options.selectedInsights
        ? mapInsightToCustomerCategory(options.selectedInsights)
        : undefined;

      const customerCategory = options.customerCategory
        || insightCategory
        || (options.eqScore !== undefined
          ? eqIntegrationService.mapToCustomerCategory(
              eqIntegrationService.getProfileFromScore(options.eqScore)
            )
          : 'value-driven');

      // 6. Generate via V5 orchestrator
      const result = await contentOrchestrator.generate({
        platform: options.platform,
        contentType: options.contentType,
        customerCategory,
        brandId: options.brandId,
        industrySlug: options.industrySlug,
        eqScore: options.eqScore,
        skipAI: options.skipAI,
      });

      if (result.success && result.content) {
        setGeneratedContent(result.content);
        setLastScore(result.content.score);

        return {
          success: true,
          content: result.content,
          context: {
            industrySlug: result.context?.industrySlug || 'general',
            customerCategory: result.context?.customerCategory || customerCategory,
            templateUsed: result.context?.templateUsed || 'unknown',
            insightsUsed: options.selectedInsights?.map(i => i.id) || [],
          },
        };
      }

      throw new Error(result.error || 'Generation failed');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsGenerating(false);
    }
  }, []);

  /**
   * Quick preview generation (skips retries for speed)
   */
  const generateQuickPreview = useCallback(async (
    options: PowerModeOptions
  ): Promise<PowerModeResult> => {
    return generateWithInsights({
      ...options,
      skipAI: false,
    });
  }, [generateWithInsights]);

  /**
   * Regenerate with last options
   */
  const regenerate = useCallback(async (): Promise<PowerModeResult> => {
    if (!lastOptionsRef.current) {
      return { success: false, error: 'No previous generation to regenerate' };
    }
    return generateWithInsights(lastOptionsRef.current);
  }, [generateWithInsights]);

  /**
   * Score arbitrary content
   */
  const scoreContent = useCallback((content: string): ContentScore => {
    return synapseScorerService.score(content, {
      industryPsychology: contextRef.current.industryPsychology,
      customerCategory: lastOptionsRef.current?.customerCategory,
      platform: lastOptionsRef.current?.platform,
    });
  }, []);

  /**
   * Get improvement hints from last score
   */
  const getImprovementHints = useCallback((): string[] => {
    return lastScore?.hints || [];
  }, [lastScore]);

  /**
   * Clear generated content
   */
  const clearContent = useCallback(() => {
    setGeneratedContent(null);
    setLastScore(null);
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isGenerating,
    error,
    generatedContent,
    lastScore,
    generateWithInsights,
    generateQuickPreview,
    regenerate,
    scoreContent,
    getImprovementHints,
    clearContent,
    clearError,
  };
}

export default useV5PowerModeGeneration;
