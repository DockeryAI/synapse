/**
 * V5 Content Orchestrator
 *
 * Main entry point for V5 content generation.
 * Coordinates the full pipeline: Load → Select → Populate → Enhance → Score → Gate → Dedupe
 *
 * Pipeline:
 * 1. Load Context (Industry + UVP + EQ + Intelligence)
 * 2. Select Template (by customer category, platform, content type)
 * 3. Populate Template (with UVP + Intelligence variables)
 * 4. AI Enhance (constrained: 500 tokens, 0.7 temp)
 * 5. Score (6 dimensions)
 * 6. Gate (≥75 or retry with hints)
 * 7. Deduplicate (check against recent content)
 *
 * Created: 2025-12-01
 */

import { v4 as uuidv4 } from 'uuid';
import { industryProfileService } from './industry-profile.service';
import { uvpProviderService } from './uvp-provider.service';
import { eqIntegrationService } from './eq-integration.service';
import { templateService } from './template.service';
import { synapseScorerService } from './synapse-scorer.service';
import { aiEnhancerService } from './ai-enhancer.service';
import { intelligenceService } from './intelligence.service';
import { embeddingsService } from './embeddings.service';
import type {
  Platform,
  ContentType,
  CustomerCategory,
  V5GeneratedContent,
  V5GenerationRequest,
  V5GenerationResult,
  ContentScore,
  IndustryPsychology,
  UVPVariables,
  EQProfile,
  UniversalTemplate,
  PLATFORM_CONSTRAINTS,
} from './types';

// ============================================================================
// ORCHESTRATOR TYPES
// ============================================================================

export interface V5Context {
  industryPsychology: IndustryPsychology;
  uvpVariables: UVPVariables;
  eqProfile: EQProfile;
  customerCategory: CustomerCategory;
}

export interface GenerationOptions {
  platform: Platform;
  contentType?: ContentType;
  customerCategory?: CustomerCategory;  // Override auto-detected
  brandId?: string;
  industrySlug?: string;
  eqScore?: number;
  skipAI?: boolean;
  skipDeduplication?: boolean;
  maxRetries?: number;
  campaignId?: string;
}

export interface GenerationProgress {
  step: 'loading-context' | 'selecting-template' | 'populating' | 'enhancing' | 'scoring' | 'gating' | 'deduplicating' | 'complete' | 'error';
  progress: number;  // 0-100
  message: string;
}

export type ProgressCallback = (progress: GenerationProgress) => void;

// ============================================================================
// CONTENT ORCHESTRATOR
// ============================================================================

class ContentOrchestrator {
  private readonly qualityThreshold = 75;
  private readonly maxRetries = 2;

  /**
   * Main generation entry point
   */
  async generate(
    options: GenerationOptions,
    onProgress?: ProgressCallback
  ): Promise<V5GenerationResult> {
    const startTime = Date.now();

    try {
      // Step 1: Load Context
      this.reportProgress(onProgress, 'loading-context', 10, 'Loading context...');
      const context = await this.loadContext(options);

      // Step 2: Select Template
      this.reportProgress(onProgress, 'selecting-template', 25, 'Selecting template...');
      const template = await this.selectTemplate(
        options.platform,
        context.customerCategory,
        options.contentType
      );

      if (!template) {
        throw new Error(`No template found for ${options.platform}/${context.customerCategory}`);
      }

      // Step 3: Populate Template
      this.reportProgress(onProgress, 'populating', 40, 'Populating template...');
      const populatedContent = templateService.populateTemplate(
        template.template,
        context.uvpVariables
      );

      // Step 4: AI Enhance (unless skipped)
      let enhancedContent: string;
      if (options.skipAI) {
        enhancedContent = populatedContent;
        this.reportProgress(onProgress, 'enhancing', 60, 'Skipping AI enhancement...');
      } else {
        this.reportProgress(onProgress, 'enhancing', 55, 'AI enhancing...');
        enhancedContent = await aiEnhancerService.enhance({
          content: populatedContent,
          platform: options.platform,
          industryPsychology: context.industryPsychology,
          uvpVariables: context.uvpVariables,
          customerCategory: context.customerCategory,
        });
      }

      // Step 5: Score
      this.reportProgress(onProgress, 'scoring', 70, 'Scoring content...');
      let score = synapseScorerService.score(enhancedContent, {
        industryPsychology: context.industryPsychology,
        customerCategory: context.customerCategory,
        platform: options.platform,
      });

      // Step 6: Quality Gate with Retry
      let attempts = 1;
      const maxRetries = options.maxRetries ?? this.maxRetries;

      while (score.total < this.qualityThreshold && attempts < maxRetries && !options.skipAI) {
        this.reportProgress(
          onProgress,
          'gating',
          70 + attempts * 5,
          `Score ${score.total} < ${this.qualityThreshold}, retrying...`
        );

        // Retry with hints
        enhancedContent = await aiEnhancerService.enhance({
          content: populatedContent,
          platform: options.platform,
          industryPsychology: context.industryPsychology,
          uvpVariables: context.uvpVariables,
          customerCategory: context.customerCategory,
          hints: score.hints,
        });

        score = synapseScorerService.score(enhancedContent, {
          industryPsychology: context.industryPsychology,
          customerCategory: context.customerCategory,
          platform: options.platform,
        });

        attempts++;
      }

      // Parse enhanced content into structure
      const parsed = this.parseContent(enhancedContent, options.platform);

      // Build generated content object
      const generatedContent: V5GeneratedContent = {
        id: uuidv4(),
        headline: parsed.headline,
        body: parsed.body,
        cta: parsed.cta,
        hashtags: parsed.hashtags,
        score,
        metadata: {
          platform: options.platform,
          contentType: options.contentType || 'promotional',
          customerCategory: context.customerCategory,
          templateId: template.id,
          attempts,
          generatedAt: new Date(),
          characterCount: enhancedContent.length,
          generationTimeMs: Date.now() - startTime,
        },
      };

      // Step 7: Deduplication check
      if (!options.skipDeduplication) {
        this.reportProgress(onProgress, 'deduplicating', 90, 'Checking for duplicates...');
        const dupCheck = await embeddingsService.checkDuplicate(generatedContent, {
          brandId: options.brandId,
          campaignId: options.campaignId,
        });

        if (dupCheck.isDuplicate) {
          // If duplicate and we have retries left, try with a different template
          if (attempts < maxRetries) {
            // For now, just mark it and continue - in production would retry
            console.warn('Duplicate detected:', dupCheck.reason);
          }
        }

        // Add to cache for future dedup checks
        embeddingsService.addToCache(generatedContent, {
          brandId: options.brandId,
          campaignId: options.campaignId,
        });
      }

      this.reportProgress(onProgress, 'complete', 100, 'Generation complete!');

      return {
        success: true,
        content: generatedContent,
        context: {
          industrySlug: context.industryPsychology.industrySlug,
          customerCategory: context.customerCategory,
          templateUsed: template.id,
        },
      };
    } catch (error) {
      this.reportProgress(onProgress, 'error', 0, `Error: ${(error as Error).message}`);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Generate batch of content (for campaigns)
   */
  async generateBatch(
    options: GenerationOptions,
    count: number,
    onProgress?: (index: number, total: number, result: V5GenerationResult) => void
  ): Promise<V5GenerationResult[]> {
    const results: V5GenerationResult[] = [];

    // Load context once for all
    const context = await this.loadContext(options);

    for (let i = 0; i < count; i++) {
      // Vary content type for mix
      const contentTypes: ContentType[] = ['promotional', 'educational', 'community', 'authority', 'engagement'];
      const contentType = contentTypes[i % contentTypes.length];

      const result = await this.generate({
        ...options,
        contentType,
        skipDeduplication: false,  // Always check within batch
      });

      results.push(result);
      onProgress?.(i + 1, count, result);
    }

    return results;
  }

  /**
   * Load all context needed for generation
   */
  async loadContext(options: GenerationOptions): Promise<V5Context> {
    // Load in parallel where possible
    const [industryPsychology, eqProfile] = await Promise.all([
      options.industrySlug
        ? industryProfileService.loadProfile(options.industrySlug)
        : this.getDefaultIndustryPsychology(),
      options.eqScore !== undefined
        ? eqIntegrationService.getProfileFromScore(options.eqScore)
        : this.getDefaultEQProfile(),
    ]);

    // Load UVP (may depend on brand ID)
    let uvpVariables = options.brandId
      ? await uvpProviderService.loadFromBrand(options.brandId)
      : uvpProviderService.getDefaultVariables();

    // Enrich with intelligence if available
    if (options.brandId) {
      try {
        const intelligence = await intelligenceService.loadFullContext(
          options.brandId,
          options.industrySlug
        );
        uvpVariables = intelligenceService.mergeIntoVariables(uvpVariables, intelligence);
      } catch (e) {
        // Graceful degradation - continue without intelligence
        console.warn('Intelligence loading failed, continuing without:', e);
      }
    }

    // Determine customer category
    const customerCategory = options.customerCategory ||
      eqIntegrationService.mapToCustomerCategory(eqProfile);

    return {
      industryPsychology,
      uvpVariables,
      eqProfile,
      customerCategory,
    };
  }

  /**
   * Select best template for generation
   */
  private async selectTemplate(
    platform: Platform,
    customerCategory: CustomerCategory,
    contentType?: ContentType
  ): Promise<UniversalTemplate | null> {
    const templates = templateService.filterTemplates({
      platform,
      customerCategories: [customerCategory],
      contentType,
    });

    if (templates.length === 0) {
      // Fallback to any template for platform
      const fallback = templateService.filterTemplates({ platform });
      return fallback.length > 0 ? fallback[0] : null;
    }

    // Return highest scoring template
    return templates.sort((a, b) =>
      (b.averageSynapseScore || 0) - (a.averageSynapseScore || 0)
    )[0];
  }

  /**
   * Parse enhanced content into structured format
   */
  private parseContent(
    content: string,
    platform: Platform
  ): {
    headline: string;
    body: string;
    cta: string;
    hashtags: string[];
  } {
    const lines = content.split('\n').filter(line => line.trim());

    // Extract hashtags
    const hashtagRegex = /#[\w]+/g;
    const hashtags = content.match(hashtagRegex) || [];

    // Remove hashtags from content for parsing
    const contentWithoutHashtags = content.replace(hashtagRegex, '').trim();
    const cleanLines = contentWithoutHashtags.split('\n').filter(line => line.trim());

    // Heuristic parsing
    let headline = cleanLines[0] || '';
    let body = '';
    let cta = '';

    if (cleanLines.length === 1) {
      // Single line - it's all headline/body
      body = headline;
    } else if (cleanLines.length === 2) {
      // Two lines - first is headline, second is body/cta combined
      body = cleanLines[1];
    } else {
      // Multiple lines - first is headline, last is CTA, middle is body
      body = cleanLines.slice(1, -1).join('\n');
      cta = cleanLines[cleanLines.length - 1];
    }

    // Detect CTA patterns
    const ctaPatterns = [
      /^(book|call|click|visit|learn|get|start|join|sign up|register|download|try)/i,
      /\?$/,  // Questions at end often are CTAs
      /(today|now|free)$/i,
    ];

    if (cta && !ctaPatterns.some(p => p.test(cta))) {
      // Last line doesn't look like CTA, merge it into body
      body = body + '\n' + cta;
      cta = '';
    }

    return {
      headline: headline.substring(0, 200),  // Limit headline length
      body: body.substring(0, 2000),
      cta,
      hashtags: hashtags.slice(0, 10),
    };
  }

  /**
   * Report progress to callback
   */
  private reportProgress(
    callback: ProgressCallback | undefined,
    step: GenerationProgress['step'],
    progress: number,
    message: string
  ): void {
    callback?.({ step, progress, message });
  }

  /**
   * Default industry psychology for when no profile is loaded
   */
  private getDefaultIndustryPsychology(): IndustryPsychology {
    return {
      industrySlug: 'general',
      industryName: 'General Business',
      naicsCode: '000000',
      powerWords: ['results', 'proven', 'trusted', 'expert', 'quality', 'value', 'success', 'professional'],
      avoidWords: ['cheap', 'discount', 'deal'],
      customerTriggers: [
        { trigger: 'Need reliable service', urgency: 7 },
        { trigger: 'Looking for quality', urgency: 6 },
      ],
      urgencyDrivers: ['limited time', 'exclusive offer', 'book now'],
      transformations: [
        { from: 'Uncertain', to: 'Confident', emotionalValue: 'Peace of mind' },
      ],
      hookLibrary: {
        numberHooks: ['3 ways to', '5 reasons why'],
        questionHooks: ['Are you struggling with', 'What if you could'],
        storyHooks: ['A client came to us', 'We recently helped'],
        fearHooks: ['Don\'t make this mistake', 'Most people get this wrong'],
        howtoHooks: ['How to get', 'The secret to'],
      },
      contentTemplates: {},
      loadedAt: new Date(),
    };
  }

  /**
   * Default EQ profile
   */
  private getDefaultEQProfile(): EQProfile {
    return {
      score: 70,
      primaryTrigger: 'value',
      secondaryTrigger: 'trust',
      emotionalTemperature: 0.6,
      classification: 'balanced',
    };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const contentOrchestrator = new ContentOrchestrator();

// Export class for testing
export { ContentOrchestrator };

export default contentOrchestrator;
