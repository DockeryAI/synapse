/**
 * V5 Content Generation Hook
 *
 * React hook for generating psychology-first content using V5 engine.
 * Orchestrates: Template Selection → Population → AI Enhancement → Scoring → Gating
 *
 * Created: 2025-12-01
 */

import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type {
  Platform,
  CustomerCategory,
  ContentType,
  V5GeneratedContent,
  V5GenerationRequest,
  IndustryPsychology,
  UVPVariables,
  EQProfile,
  ContentScore,
} from '@/services/v5/types';

// Import V5 services
import { industryProfileService } from '@/services/v5/industry-profile.service';
import { uvpProviderService, formatForTemplate } from '@/services/v5/uvp-provider.service';
import { eqIntegrationService } from '@/services/v5/eq-integration.service';
import { selectTemplate, populateTemplate, getTemplateById } from '@/services/v5/template.service';
import { scoreSync, generateHints } from '@/services/v5/synapse-scorer.service';
import {
  enhance,
  enhanceWithRetry,
  generateWithFallback,
  logGeneration,
  type PromptContext,
  type EnhancementWithRetryResult,
} from '@/services/v5/ai-enhancer.service';
import { getIntelligence, mergeIntoVariables } from '@/services/v5/intelligence.service';

// ============================================================================
// TYPES
// ============================================================================

export interface V5GenerationState {
  isGenerating: boolean;
  currentStep: GenerationStep;
  progress: number; // 0-100
  error?: string;
}

export type GenerationStep =
  | 'idle'
  | 'loading-data'
  | 'selecting-template'
  | 'populating-template'
  | 'enhancing'
  | 'scoring'
  | 'complete'
  | 'error';

export interface V5GenerationOptions {
  platform: Platform;
  contentType?: ContentType;
  customerCategory?: CustomerCategory;
  brandId?: string;
  industrySlug?: string;
  eqScore?: number;
  skipAI?: boolean;
  maxRetries?: number;
}

export interface V5GenerationResult {
  success: boolean;
  content?: V5GeneratedContent;
  error?: string;
  attempts?: number;
  usedFallback?: boolean;
}

export interface UseV5ContentGenerationReturn {
  // State
  state: V5GenerationState;
  generatedContent: V5GeneratedContent | null;
  history: V5GeneratedContent[];

  // Actions
  generate: (options: V5GenerationOptions) => Promise<V5GenerationResult>;
  regenerate: () => Promise<V5GenerationResult>;
  clear: () => void;

  // Data loading helpers
  loadContext: (options: { brandId?: string; industrySlug?: string; eqScore?: number }) => Promise<{
    uvpVariables?: UVPVariables;
    industryPsychology?: IndustryPsychology;
    eqProfile?: EQProfile;
  }>;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useV5ContentGeneration(): UseV5ContentGenerationReturn {
  // State
  const [state, setState] = useState<V5GenerationState>({
    isGenerating: false,
    currentStep: 'idle',
    progress: 0,
  });

  const [generatedContent, setGeneratedContent] = useState<V5GeneratedContent | null>(null);
  const [history, setHistory] = useState<V5GeneratedContent[]>([]);
  const [lastOptions, setLastOptions] = useState<V5GenerationOptions | null>(null);

  // Update step with progress
  const updateStep = useCallback((step: GenerationStep, progress: number) => {
    setState(prev => ({
      ...prev,
      currentStep: step,
      progress,
    }));
  }, []);

  // Set error state
  const setError = useCallback((error: string) => {
    setState({
      isGenerating: false,
      currentStep: 'error',
      progress: 0,
      error,
    });
  }, []);

  /**
   * Load context data (UVP, Industry Psychology, EQ Profile)
   */
  const loadContext = useCallback(async (options: {
    brandId?: string;
    industrySlug?: string;
    eqScore?: number;
  }) => {
    const result: {
      uvpVariables?: UVPVariables;
      industryPsychology?: IndustryPsychology;
      eqProfile?: EQProfile;
    } = {};

    // Load UVP variables
    if (options.brandId) {
      const uvp = await uvpProviderService.getVariables(options.brandId);
      if (uvp) {
        result.uvpVariables = uvp;
      }
    }

    // Load industry psychology
    if (options.industrySlug) {
      const psychology = await industryProfileService.loadPsychology(options.industrySlug);
      if (psychology) {
        result.industryPsychology = psychology;
      }
    }

    // Get EQ profile
    if (options.eqScore !== undefined) {
      result.eqProfile = eqIntegrationService.getProfile(options.eqScore, options.industrySlug);
    }

    return result;
  }, []);

  /**
   * Main generation function
   */
  const generate = useCallback(async (options: V5GenerationOptions): Promise<V5GenerationResult> => {
    setLastOptions(options);

    try {
      setState({
        isGenerating: true,
        currentStep: 'loading-data',
        progress: 10,
      });

      // ========================================
      // STEP 1: Load Context Data
      // ========================================
      updateStep('loading-data', 20);

      const { uvpVariables, industryPsychology, eqProfile } = await loadContext({
        brandId: options.brandId,
        industrySlug: options.industrySlug,
        eqScore: options.eqScore,
      });

      // Fallback to defaults if data not loaded
      const finalUvp: UVPVariables = uvpVariables || {
        businessName: 'Your Business',
        targetCustomer: 'customers',
        transformation: 'better results',
        uniqueSolution: 'our approach',
        keyBenefit: 'quality service',
        differentiator: 'personalized attention',
      };

      const finalIndustry: IndustryPsychology = industryPsychology || {
        industrySlug: options.industrySlug || 'general',
        industryName: 'Business',
        naicsCode: '',
        powerWords: ['transform', 'results', 'proven', 'expert', 'trusted'],
        avoidWords: ['cheap', 'discount', 'basic'],
        customerTriggers: [],
        urgencyDrivers: [],
        transformations: [],
        hookLibrary: {
          numberHooks: [],
          questionHooks: [],
          storyHooks: [],
          fearHooks: [],
          howtoHooks: [],
        },
        contentTemplates: {},
        loadedAt: new Date(),
      };

      const finalCategory: CustomerCategory = options.customerCategory ||
        eqProfile?.customerCategory ||
        'pain-driven';

      // ========================================
      // STEP 2: Load Intelligence (ONE insight per source)
      // ========================================
      updateStep('loading-data', 30);

      let enrichedUvp = finalUvp;
      try {
        const intelligence = await getIntelligence({
          brandId: options.brandId,
          industrySlug: finalIndustry.industrySlug,
          industry: finalIndustry.industryName,
        });
        enrichedUvp = mergeIntoVariables(finalUvp, intelligence);
      } catch (error) {
        console.warn('[V5 Hook] Intelligence loading failed, continuing without:', error);
      }

      // ========================================
      // STEP 3: Select Template
      // ========================================
      updateStep('selecting-template', 40);

      const template = await selectTemplate({
        platform: options.platform,
        customerCategory: finalCategory,
        contentType: options.contentType,
        industrySlug: options.industrySlug,
      });

      if (!template) {
        setError('No template found for this platform/category combination');
        return { success: false, error: 'No template found' };
      }

      // ========================================
      // STEP 4: Populate Template
      // ========================================
      updateStep('populating-template', 50);

      const templateVariables = formatForTemplate(enrichedUvp);
      const populatedContent = populateTemplate(template, templateVariables);

      // If skipping AI, score and return
      if (options.skipAI) {
        updateStep('scoring', 80);

        const score = scoreSync(populatedContent, {
          industryPsychology: finalIndustry,
          customerCategory: finalCategory,
          platform: options.platform,
        });

        const content = buildGeneratedContent({
          populatedContent,
          template,
          score,
          platform: options.platform,
          customerCategory: finalCategory,
          contentType: options.contentType || 'promotional',
          attempts: 0,
        });

        setGeneratedContent(content);
        setHistory(prev => [...prev.slice(-19), content]); // Keep last 20

        setState({
          isGenerating: false,
          currentStep: 'complete',
          progress: 100,
        });

        return { success: true, content, attempts: 0 };
      }

      // ========================================
      // STEP 5: AI Enhancement with Retry
      // ========================================
      updateStep('enhancing', 60);

      const promptContext: PromptContext = {
        platform: options.platform,
        customerCategory: finalCategory,
        industryPsychology: finalIndustry,
        uvpVariables: enrichedUvp,
        eqProfile,
        populatedTemplate: populatedContent,
      };

      let enhancementResult: EnhancementWithRetryResult & { templateId?: string };

      // Use generateWithFallback for full retry + template fallback
      enhancementResult = await generateWithFallback(
        {
          populatedTemplate: populatedContent,
          context: promptContext,
          templateId: template.id,
          uvpVariables: templateVariables,
        },
        options.maxRetries || 2
      );

      updateStep('scoring', 90);

      // ========================================
      // STEP 6: Build Final Content
      // ========================================
      const finalTemplateId = enhancementResult.templateId || template.id;
      const finalTemplate = getTemplateById(finalTemplateId) || template;

      const content = buildGeneratedContent({
        populatedContent: enhancementResult.finalContent,
        template: finalTemplate,
        score: enhancementResult.finalScore,
        platform: options.platform,
        customerCategory: finalCategory,
        contentType: options.contentType || template.contentType,
        attempts: enhancementResult.attempts.length,
        aiModel: 'anthropic/claude-3.5-haiku',
      });

      // Log generation
      logGeneration({
        id: content.id,
        timestamp: new Date(),
        platform: options.platform,
        customerCategory: finalCategory,
        industrySlug: finalIndustry.industrySlug,
        templateId: finalTemplate.id,
        attempts: enhancementResult.attempts,
        finalScore: enhancementResult.finalScore?.total,
        passed: enhancementResult.success,
        usedFallback: enhancementResult.usedFallback,
        model: 'anthropic/claude-3.5-haiku',
      });

      // Update state
      setGeneratedContent(content);
      setHistory(prev => [...prev.slice(-19), content]);

      setState({
        isGenerating: false,
        currentStep: 'complete',
        progress: 100,
      });

      return {
        success: enhancementResult.success,
        content,
        attempts: enhancementResult.attempts.length,
        usedFallback: enhancementResult.usedFallback,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Generation failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [loadContext, updateStep, setError]);

  /**
   * Regenerate with last options
   */
  const regenerate = useCallback(async (): Promise<V5GenerationResult> => {
    if (!lastOptions) {
      return { success: false, error: 'No previous generation to regenerate' };
    }
    return generate(lastOptions);
  }, [lastOptions, generate]);

  /**
   * Clear generated content
   */
  const clear = useCallback(() => {
    setGeneratedContent(null);
    setState({
      isGenerating: false,
      currentStep: 'idle',
      progress: 0,
    });
  }, []);

  return {
    state,
    generatedContent,
    history,
    generate,
    regenerate,
    clear,
    loadContext,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

interface BuildContentParams {
  populatedContent: string;
  template: { id: string; structure: string; contentType: ContentType; platform: Platform };
  score?: ContentScore;
  platform: Platform;
  customerCategory: CustomerCategory;
  contentType: ContentType;
  attempts: number;
  aiModel?: string;
}

function buildGeneratedContent(params: BuildContentParams): V5GeneratedContent {
  const { populatedContent, template, score, platform, customerCategory, contentType, attempts, aiModel } = params;

  // Parse content into parts
  const lines = populatedContent.split('\n').filter(Boolean);
  const hashtagMatch = populatedContent.match(/#\w+/g);

  // Extract headline (first line or first sentence)
  const headline = lines[0] || populatedContent.slice(0, 100);

  // Extract CTA (look for common CTA patterns)
  const ctaPatterns = [
    /(?:click|tap|learn more|book now|get started|sign up|contact us|call|visit|shop|order|try|discover|explore|join).*/i,
  ];
  let cta = '';
  for (const line of lines.reverse()) {
    for (const pattern of ctaPatterns) {
      if (pattern.test(line)) {
        cta = line;
        break;
      }
    }
    if (cta) break;
  }

  // Body is everything else
  const body = lines.slice(1, -1).join('\n') || populatedContent;

  return {
    id: uuidv4(),
    headline,
    body,
    cta: cta || 'Learn more today!',
    hashtags: hashtagMatch || [],
    score: score || {
      total: 0,
      breakdown: {
        powerWords: 0,
        emotionalTriggers: 0,
        readability: 0,
        cta: 0,
        urgency: 0,
        trust: 0,
      },
      tier: 'fair',
      passed: false,
      hints: [],
    },
    metadata: {
      templateId: template.id,
      templateStructure: template.structure as any,
      platform,
      contentType,
      customerCategory,
      generatedAt: new Date(),
      attempts,
      aiModel,
      characterCount: populatedContent.length,
    },
  };
}

export default useV5ContentGeneration;
