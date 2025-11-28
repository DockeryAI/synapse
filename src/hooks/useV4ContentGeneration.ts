/**
 * useV4ContentGeneration Hook
 *
 * React hook for integrating V4 Content Engine with UI components.
 * Provides easy and power mode content generation with full UVP integration.
 *
 * Created: 2025-11-27
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { CompleteUVP } from '@/types/uvp-flow.types';
import type {
  GeneratedContent,
  ContentPillar,
  PsychologyFramework,
  FunnelStage,
  ContentMixCategory,
  CampaignTemplateType,
  ContentMixRule
} from '@/services/v4/types';

import {
  easyMode,
  powerMode,
  contentMixer,
  pillarGenerator,
  contentOrchestrator,
  psychologyEngine,
  contentScorer,
  intelligenceIntegration,
  intelligencePopulator,
  type IntelligenceContext
} from '@/services/v4';

// ============================================================================
// TYPES
// ============================================================================

export interface V4ContentGenerationOptions {
  uvp: CompleteUVP;
  brandId?: string;  // Required for intelligence population and persistence
  mode: 'easy' | 'power';
}

export interface EasyModeOptions {
  weeks?: number;
  postsPerWeek?: number;
  platform?: 'linkedin' | 'instagram' | 'twitter' | 'facebook' | 'tiktok';
}

export interface PowerModeOptions {
  pillar?: ContentPillar;
  framework?: PsychologyFramework;
  funnelStage?: FunnelStage;
  mixCategory?: ContentMixCategory;
  platform?: 'linkedin' | 'instagram' | 'twitter' | 'facebook' | 'tiktok';
  tone?: 'professional' | 'casual' | 'authoritative' | 'friendly';
}

export interface CampaignResult {
  success: boolean;
  pillars: ContentPillar[];
  content: GeneratedContent[];
  campaign: {
    template: CampaignTemplateType;
    mixRule: ContentMixRule;
    weekCount: number;
  };
  summary: string;
  recommendations: string[];
}

export interface QuickPostResult {
  success: boolean;
  content: GeneratedContent;
  alternatives?: GeneratedContent[];
}

export interface IntelligenceStatus {
  completeness: number;
  sources: {
    website: boolean;
    trends: boolean;
    competitors: boolean;
    social: boolean;
    brandKit: boolean;
    userPreferences: boolean;
  };
  isPopulating: boolean;
}

export interface UseV4ContentGenerationReturn {
  // State
  isGenerating: boolean;
  error: string | null;
  generatedContent: GeneratedContent[];
  pillars: ContentPillar[];
  intelligenceStatus: IntelligenceStatus;

  // Easy Mode
  generateFullCampaign: (options?: EasyModeOptions) => Promise<CampaignResult>;
  generateQuickPost: (platform?: 'linkedin' | 'instagram' | 'twitter' | 'facebook' | 'tiktok') => Promise<QuickPostResult>;
  generateWeeklyPlan: (postsPerWeek?: number) => Promise<GeneratedContent[]>;

  // Power Mode
  generateWithControl: (options: PowerModeOptions) => Promise<GeneratedContent>;
  generateBatch: (count: number, options?: Partial<PowerModeOptions>) => Promise<GeneratedContent[]>;
  generateABVariations: (frameworks?: PsychologyFramework[]) => Promise<{
    variations: GeneratedContent[];
    recommendation: GeneratedContent;
    reasoning: string;
  }>;

  // Content Mixer
  adaptForPlatforms: (content: GeneratedContent, platforms: string[]) => Promise<{ platform: string; content: GeneratedContent }[]>;

  // Utilities
  getPillars: () => ContentPillar[];
  getFrameworkOptions: () => { framework: PsychologyFramework; name: string; description: string }[];
  scoreContent: (content: { headline?: string; hook?: string; body: string; cta?: string }) => ReturnType<typeof contentScorer.score>;
  regenerateContent: (content: GeneratedContent) => Promise<GeneratedContent>;

  // Clear state
  clearError: () => void;
  clearContent: () => void;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useV4ContentGeneration(
  options: V4ContentGenerationOptions
): UseV4ContentGenerationReturn {
  const { uvp, brandId, mode } = options;

  // State
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);
  const [pillars, setPillars] = useState<ContentPillar[]>([]);
  const [intelligenceStatus, setIntelligenceStatus] = useState<IntelligenceStatus>({
    completeness: 0,
    sources: {
      website: false,
      trends: false,
      competitors: false,
      social: false,
      brandKit: false,
      userPreferences: false
    },
    isPopulating: false
  });

  // Memoize pillars from UVP
  const memoizedPillars = useMemo(() => {
    if (!uvp) return [];
    return pillarGenerator.generatePillars(uvp);
  }, [uvp?.id]);

  // ============================================================================
  // INTELLIGENCE POPULATION EFFECT (with deduplication guard)
  // ============================================================================

  const populateCalledRef = useRef(false);

  useEffect(() => {
    if (!brandId) return;
    // PERFORMANCE FIX: Only run once per component mount to prevent repeated calls
    if (populateCalledRef.current) {
      console.log('[useV4ContentGeneration] Skipping duplicate intelligence population');
      return;
    }
    populateCalledRef.current = true;

    const populateIntelligence = async () => {
      setIntelligenceStatus(prev => ({ ...prev, isPopulating: true }));

      try {
        // Populate intelligence in background
        const result = await intelligencePopulator.populateAll({
          brandId,
          industry: uvp?.targetCustomer?.industry
        });

        // Update status based on what was populated
        const sources = {
          website: false,  // Website analysis comes from brand metadata
          trends: result.populated.includes('trends'),
          competitors: result.populated.includes('competitors'),
          social: result.populated.includes('social'),
          brandKit: false, // Brand kit is from DB
          userPreferences: !!uvp  // True if UVP exists
        };

        // Calculate completeness
        const completeness = Math.round(
          (Object.values(sources).filter(Boolean).length / Object.keys(sources).length) * 100
        );

        setIntelligenceStatus({
          completeness,
          sources,
          isPopulating: false
        });

        console.log(`[useV4ContentGeneration] Intelligence populated: ${completeness}% complete`);
      } catch (err) {
        console.error('[useV4ContentGeneration] Intelligence population failed:', err);
        setIntelligenceStatus(prev => ({ ...prev, isPopulating: false }));
      }
    };

    populateIntelligence();
  }, [brandId]); // Simplified dependency - only run on brandId change

  // ============================================================================
  // EASY MODE FUNCTIONS
  // ============================================================================

  const generateFullCampaign = useCallback(async (
    campaignOptions?: EasyModeOptions
  ): Promise<CampaignResult> => {
    if (!uvp) {
      const errorResult: CampaignResult = {
        success: false,
        pillars: [],
        content: [],
        campaign: { template: 'evergreen', mixRule: '70-20-10', weekCount: 0 },
        summary: 'No UVP provided',
        recommendations: []
      };
      return errorResult;
    }

    setIsGenerating(true);
    setError(null);

    try {
      console.log('[useV4ContentGeneration] Generating full campaign...');
      const result = await easyMode.generateFullCampaign(uvp, campaignOptions);

      setPillars(result.pillars);
      setGeneratedContent(result.content);

      console.log(`[useV4ContentGeneration] Campaign generated: ${result.content.length} pieces`);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Campaign generation failed';
      setError(errorMessage);
      console.error('[useV4ContentGeneration] Campaign generation failed:', err);

      return {
        success: false,
        pillars: [],
        content: [],
        campaign: { template: 'evergreen', mixRule: '70-20-10', weekCount: 0 },
        summary: errorMessage,
        recommendations: []
      };
    } finally {
      setIsGenerating(false);
    }
  }, [uvp]);

  const generateQuickPost = useCallback(async (
    platform: 'linkedin' | 'instagram' | 'twitter' | 'facebook' | 'tiktok' = 'linkedin'
  ): Promise<QuickPostResult> => {
    if (!uvp) {
      throw new Error('No UVP provided');
    }

    setIsGenerating(true);
    setError(null);

    try {
      console.log(`[useV4ContentGeneration] Generating quick post for ${platform}...`);
      const result = await easyMode.generateQuickPost(uvp, {
        platform,
        generateAlternatives: true
      });

      setGeneratedContent(prev => [...prev, result.content]);

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Quick post generation failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [uvp]);

  const generateWeeklyPlan = useCallback(async (
    postsPerWeek: number = 5
  ): Promise<GeneratedContent[]> => {
    if (!uvp) {
      throw new Error('No UVP provided');
    }

    setIsGenerating(true);
    setError(null);

    try {
      console.log(`[useV4ContentGeneration] Generating weekly plan (${postsPerWeek} posts)...`);
      const result = await easyMode.generateWeeklyPlan(uvp, { postsPerWeek });

      setGeneratedContent(prev => [...prev, ...result.posts]);

      return result.posts;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Weekly plan generation failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [uvp]);

  // ============================================================================
  // POWER MODE FUNCTIONS
  // ============================================================================

  const generateWithControl = useCallback(async (
    powerOptions: PowerModeOptions
  ): Promise<GeneratedContent> => {
    if (!uvp) {
      throw new Error('No UVP provided');
    }

    setIsGenerating(true);
    setError(null);

    try {
      console.log('[useV4ContentGeneration] Generating with control...', powerOptions);
      const content = await powerMode.generateWithControl(uvp, powerOptions);

      setGeneratedContent(prev => [...prev, content]);

      return content;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Content generation failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [uvp]);

  const generateBatch = useCallback(async (
    count: number,
    batchOptions?: Partial<PowerModeOptions>
  ): Promise<GeneratedContent[]> => {
    if (!uvp) {
      throw new Error('No UVP provided');
    }

    setIsGenerating(true);
    setError(null);

    try {
      console.log(`[useV4ContentGeneration] Generating batch of ${count}...`);
      const result = await powerMode.generateBatch(uvp, {
        count,
        pillars: batchOptions?.pillar ? [batchOptions.pillar] : undefined,
        frameworks: batchOptions?.framework ? [batchOptions.framework] : undefined,
        funnelStages: batchOptions?.funnelStage ? [batchOptions.funnelStage] : undefined,
        platform: batchOptions?.platform
      });

      setGeneratedContent(prev => [...prev, ...result.content]);

      return result.content;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Batch generation failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [uvp]);

  const generateABVariations = useCallback(async (
    frameworks?: PsychologyFramework[]
  ): Promise<{
    variations: GeneratedContent[];
    recommendation: GeneratedContent;
    reasoning: string;
  }> => {
    if (!uvp) {
      throw new Error('No UVP provided');
    }

    setIsGenerating(true);
    setError(null);

    try {
      console.log('[useV4ContentGeneration] Generating A/B variations...');
      const result = await powerMode.generateABVariations(uvp, { frameworks });

      setGeneratedContent(prev => [...prev, ...result.variations]);

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'A/B generation failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [uvp]);

  // ============================================================================
  // CONTENT MIXER FUNCTIONS
  // ============================================================================

  const adaptForPlatforms = useCallback(async (
    content: GeneratedContent,
    platforms: string[]
  ): Promise<{ platform: string; content: GeneratedContent }[]> => {
    setIsGenerating(true);
    setError(null);

    try {
      console.log(`[useV4ContentGeneration] Adapting for platforms: ${platforms.join(', ')}...`);
      const adaptations = await contentMixer.adaptForPlatforms(
        content,
        platforms as ('linkedin' | 'instagram' | 'twitter' | 'facebook' | 'tiktok')[]
      );

      return adaptations;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Platform adaptation failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const getPillars = useCallback((): ContentPillar[] => {
    if (pillars.length > 0) return pillars;
    return memoizedPillars;
  }, [pillars, memoizedPillars]);

  const getFrameworkOptions = useCallback(() => {
    return psychologyEngine.getAllFrameworks().map(f => ({
      framework: f.framework,
      name: f.definition.name,
      description: f.definition.description
    }));
  }, []);

  const scoreContent = useCallback((
    content: { headline?: string; hook?: string; body: string; cta?: string }
  ) => {
    return contentScorer.score(content);
  }, []);

  const regenerateContent = useCallback(async (
    content: GeneratedContent
  ): Promise<GeneratedContent> => {
    if (!uvp) {
      throw new Error('No UVP provided');
    }

    setIsGenerating(true);
    setError(null);

    try {
      console.log('[useV4ContentGeneration] Regenerating content...');
      // Cycle to next framework
      const frameworks: PsychologyFramework[] = ['AIDA', 'PAS', 'BAB', 'CuriosityGap', 'PatternInterrupt', 'StoryBrand'];
      const currentIndex = frameworks.indexOf(content.psychology.framework);
      const nextFramework = frameworks[(currentIndex + 1) % frameworks.length];

      const newContent = await contentOrchestrator.regenerate(content, uvp, {
        framework: nextFramework
      });

      // Replace in state
      setGeneratedContent(prev =>
        prev.map(c => c.id === content.id ? newContent : c)
      );

      return newContent;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Regeneration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [uvp]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearContent = useCallback(() => {
    setGeneratedContent([]);
  }, []);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // State
    isGenerating,
    error,
    generatedContent,
    pillars: pillars.length > 0 ? pillars : memoizedPillars,
    intelligenceStatus,

    // Easy Mode
    generateFullCampaign,
    generateQuickPost,
    generateWeeklyPlan,

    // Power Mode
    generateWithControl,
    generateBatch,
    generateABVariations,

    // Content Mixer
    adaptForPlatforms,

    // Utilities
    getPillars,
    getFrameworkOptions,
    scoreContent,
    regenerateContent,

    // Clear
    clearError,
    clearContent
  };
}

export default useV4ContentGeneration;
