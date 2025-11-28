/**
 * V4 Content Orchestrator
 *
 * Thin orchestration layer that coordinates all V4 components:
 * - Prompt Library (breakthrough prompts)
 * - Content Scorer (quality scoring)
 * - Psychology Engine (framework selection)
 * - Intelligence Integration (website, trends, competitors, social, brand kit)
 *
 * Single entry point for content generation.
 * All API calls go through ai-proxy edge function.
 *
 * Created: 2025-11-26
 * Updated: 2025-11-27 - Added intelligence integration, error recovery, deduplication
 */

import type { CompleteUVP } from '@/types/uvp-flow.types';
import type {
  ContentRequest,
  GeneratedContent,
  ContentScore,
  PsychologyProfile,
  ContentMixCategory,
  FunnelStage,
  PsychologyFramework
} from './types';

import { promptLibrary } from './prompt-library';
import { contentScorer } from './content-scorer';
import { psychologyEngine } from './psychology-engine';
import { industryProfiles, type IndustryProfile } from '@/services/v2/data/industry-profiles';
import { intelligenceIntegration, type IntelligenceContext } from './intelligence-integration';
import { v4CalendarIntegration } from './calendar-integration';
import { intelligencePopulator } from './intelligence-populator';

// ============================================================================
// INDUSTRY CONTEXT TYPES
// ============================================================================

interface IndustryContext {
  profile: IndustryProfile | null;
  emotionalWeights: Record<string, number>;
  preferredTerms: string[];
  powerWords: string[];
  seasonalTriggers: string[];
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const DEFAULT_MODEL = 'anthropic/claude-sonnet-4'; // Fast, high-quality (OpenRouter format)
const PREMIUM_MODEL = 'anthropic/claude-opus-4';   // Best quality for premium content (OpenRouter format)

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const RETRY_BACKOFF_MULTIPLIER = 2;

// Deduplication configuration
const MAX_DEDUP_RETRIES = 3;

// Platform character limits
const PLATFORM_LIMITS: Record<string, { body: number; headline: number }> = {
  twitter: { body: 280, headline: 100 },
  linkedin: { body: 3000, headline: 200 },
  instagram: { body: 2200, headline: 125 },
  facebook: { body: 63206, headline: 255 },
  tiktok: { body: 2200, headline: 150 }
};

// ============================================================================
// CONTENT ORCHESTRATOR CLASS
// ============================================================================

class ContentOrchestrator {
  private generationCount = 0;
  private industryContext: IndustryContext | null = null;
  private intelligenceContext: IntelligenceContext | null = null;

  /**
   * Load industry context from UVP
   */
  private loadIndustryContext(uvp: CompleteUVP): IndustryContext {
    const industry = uvp.targetCustomer?.industry?.toLowerCase() || '';

    // Try to find matching industry profile
    let profile: IndustryProfile | null = null;
    for (const [key, p] of Object.entries(industryProfiles)) {
      if (industry.includes(key) || key.includes(industry)) {
        profile = p;
        break;
      }
    }

    // Build context with or without profile
    if (profile) {
      console.log(`[V4 Orchestrator] Found industry profile: ${profile.name}`);
      return {
        profile,
        emotionalWeights: profile.emotionalTriggers as unknown as Record<string, number>,
        preferredTerms: profile.vocabulary.preferredTerms,
        powerWords: profile.vocabulary.powerWords,
        seasonalTriggers: profile.seasonalTriggers
      };
    }

    // Default context when no profile found
    console.log('[V4 Orchestrator] Using default industry context');
    return {
      profile: null,
      emotionalWeights: { trust: 25, efficiency: 25, growth: 25, innovation: 25 },
      preferredTerms: [],
      powerWords: ['transform', 'unlock', 'discover', 'achieve', 'proven'],
      seasonalTriggers: []
    };
  }

  /**
   * Enhance prompt with industry context
   */
  private enhancePromptWithIndustry(prompt: string, context: IndustryContext): string {
    if (!context.profile) return prompt;

    const industryHints = [
      `\n\nINDUSTRY CONTEXT:`,
      `Industry: ${context.profile.name}`,
      `Power words to use: ${context.powerWords.slice(0, 5).join(', ')}`,
      `Preferred terms: ${context.preferredTerms.slice(0, 5).join(', ')}`,
      `Emotional emphasis: ${Object.entries(context.emotionalWeights)
        .filter(([_, weight]) => weight > 20)
        .map(([emotion]) => emotion)
        .join(', ')}`
    ];

    return prompt + industryHints.join('\n');
  }

  /**
   * Generate content from UVP
   *
   * Main entry point for content generation with full intelligence integration
   */
  async generate(
    request: ContentRequest & { brandId?: string; _dedupAttempt?: number; autoSave?: boolean }
  ): Promise<GeneratedContent> {
    console.log('[V4 Orchestrator] Starting content generation...');
    const startTime = Date.now();
    const dedupAttempt = request._dedupAttempt || 0;

    try {
      // 0. Load industry context
      this.industryContext = this.loadIndustryContext(request.uvp);

      // 1. Populate intelligence cache if needed (runs in background, non-blocking for first request)
      if (request.brandId) {
        // Fire-and-forget population - don't wait for it
        intelligencePopulator.populateAll({
          brandId: request.brandId,
          industry: request.uvp.targetCustomer?.industry
        }).catch(err => console.warn('[V4 Orchestrator] Background intelligence population failed:', err));
      }

      // 2. Load intelligence context (website, trends, competitors, social, brand kit)
      if (request.brandId) {
        try {
          this.intelligenceContext = await intelligenceIntegration.loadIntelligenceContext(
            request.brandId,
            request.uvp
          );
          console.log(`[V4 Orchestrator] Intelligence context loaded (${this.intelligenceContext.completeness}% complete)`);
        } catch (error) {
          console.warn('[V4 Orchestrator] Intelligence context failed, continuing without:', error);
          this.intelligenceContext = null;
        }
      }

      // 2. Build psychology profile
      const profile = psychologyEngine.buildProfile(
        this.inferGoal(request),
        request.funnelStage || 'TOFU'
      );

      // 3. Select prompt template
      const templateId = this.selectTemplate(request, profile);
      let prompt = promptLibrary.buildPrompt(templateId, request.uvp);

      // 4. Enhance with industry context
      prompt = this.enhancePromptWithIndustry(prompt, this.industryContext);

      // 5. Enhance with intelligence context (website, trends, competitors, etc.)
      if (this.intelligenceContext) {
        const intelligenceEnhancement = intelligenceIntegration.buildPromptEnhancement(this.intelligenceContext);
        if (intelligenceEnhancement) {
          prompt += intelligenceEnhancement;
        }
      }

      // 6. Add platform constraints to prompt
      const platformLimits = PLATFORM_LIMITS[request.platform] || PLATFORM_LIMITS.linkedin;
      prompt += `\n\nPLATFORM CONSTRAINTS:\n- Maximum body length: ${platformLimits.body} characters\n- Maximum headline length: ${platformLimits.headline} characters\n- Keep content concise and within these limits.`;

      // 7. Call AI via edge function WITH RETRY
      const rawResponse = await this.callAIWithRetry(prompt, DEFAULT_MODEL);

      // 8. Parse response
      let parsed = this.parseResponse(rawResponse, templateId);

      // 9. Validate and truncate for platform limits
      parsed = this.enforceplatformLimits(parsed, request.platform);

      // 10. Score content
      const score = contentScorer.score(parsed);

      // 11. Check for duplicate content (with recursion limit)
      if (request.brandId && dedupAttempt < MAX_DEDUP_RETRIES) {
        const { isDuplicate, similarContent } = await intelligenceIntegration.checkDuplication(
          request.brandId,
          { headline: parsed.headline || '', hook: parsed.hook, body: parsed.body }
        );

        if (isDuplicate && similarContent) {
          console.log(`[V4 Orchestrator] Duplicate detected (attempt ${dedupAttempt + 1}/${MAX_DEDUP_RETRIES}), regenerating...`);
          const alternativeFramework = this.getAlternativeFramework(profile.framework);
          return this.generate({
            ...request,
            framework: alternativeFramework,
            _dedupAttempt: dedupAttempt + 1
          });
        }
      } else if (dedupAttempt >= MAX_DEDUP_RETRIES) {
        console.warn(`[V4 Orchestrator] Max deduplication attempts reached, returning content with potential similarity`);
      }

      // 12. Compute content hash for deduplication persistence
      const contentForHash = {
        headline: parsed.headline || '',
        hook: parsed.hook || '',
        body: parsed.body || ''
      };
      const contentHash = this.computeContentHash(contentForHash);

      // 13. Build final result
      const result: GeneratedContent = {
        id: `content-${Date.now()}-${++this.generationCount}`,
        headline: parsed.headline || parsed.hook?.substring(0, 60) || '',
        hook: parsed.hook || '',
        body: parsed.body || '',
        cta: parsed.cta || '',
        hashtags: parsed.hashtags || [],
        score,
        psychology: profile,
        mixCategory: request.contentMixCategory || 'value',
        funnelStage: request.funnelStage || 'TOFU',
        pillarId: request.pillar?.id,
        contentHash,
        metadata: {
          generatedAt: new Date(),
          model: DEFAULT_MODEL,
          platform: request.platform,
          characterCount: (parsed.hook + parsed.body + parsed.cta).length
        }
      };

      // 13. Auto-save to calendar if brandId provided and autoSave enabled
      if (request.brandId && request.autoSave !== false) {
        try {
          await v4CalendarIntegration.saveToCalendar(result, request.brandId);
          console.log(`[V4 Orchestrator] Content auto-saved to calendar`);
        } catch (saveError) {
          console.warn('[V4 Orchestrator] Failed to auto-save to calendar:', saveError);
          // Don't throw - content generation succeeded, save failed
        }
      }

      const elapsed = Date.now() - startTime;
      console.log(`[V4 Orchestrator] Generated in ${elapsed}ms, score: ${score.total}/100`);

      return result;

    } catch (error) {
      console.error('[V4 Orchestrator] Generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate multiple content pieces (for campaigns) with failure safeguards
   */
  async generateBatch(
    uvp: CompleteUVP,
    count: number,
    options?: {
      platform?: string;
      mixRule?: '70-20-10' | '4-1-1' | '5-3-2';
      funnelBalance?: boolean;
      brandId?: string;
      autoSave?: boolean;
      stopOnConsecutiveFailures?: number;
    }
  ): Promise<{ results: GeneratedContent[]; errors: { index: number; error: string }[] }> {
    console.log(`[V4 Orchestrator] Generating batch of ${count} content pieces...`);

    const results: GeneratedContent[] = [];
    const errors: { index: number; error: string }[] = [];
    const templates = promptLibrary.getAll();

    // Distribute across funnel stages if enabled
    const funnelStages: FunnelStage[] = options?.funnelBalance
      ? this.distributeFunnelStages(count)
      : Array(count).fill('TOFU');

    // Pre-calculate content mix categories for accurate distribution
    const mixCategories = Array.from({ length: count }, (_, i) =>
      this.getMixCategory(i, count, options?.mixRule)
    );

    let consecutiveFailures = 0;
    const maxConsecutiveFailures = options?.stopOnConsecutiveFailures || 5;

    for (let i = 0; i < count; i++) {
      try {
        // Rotate templates for variety
        const templateIndex = i % templates.length;

        const result = await this.generate({
          uvp,
          platform: (options?.platform || 'linkedin') as any,
          funnelStage: funnelStages[i],
          contentMixCategory: mixCategories[i],
          brandId: options?.brandId,
          autoSave: options?.autoSave
        });

        results.push(result);
        consecutiveFailures = 0; // Reset on success

        // Small delay to avoid rate limits
        await this.delay(500);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[V4 Orchestrator] Failed to generate item ${i + 1}:`, errorMessage);
        errors.push({ index: i, error: errorMessage });
        consecutiveFailures++;

        // Stop if too many consecutive failures
        if (consecutiveFailures >= maxConsecutiveFailures) {
          console.error(`[V4 Orchestrator] Stopping batch: ${maxConsecutiveFailures} consecutive failures`);
          break;
        }

        // Continue with next item
        await this.delay(1000); // Longer delay after failure
      }
    }

    console.log(`[V4 Orchestrator] Batch complete: ${results.length}/${count} generated, ${errors.length} failed`);
    return { results, errors };
  }

  /**
   * Regenerate with different parameters
   */
  async regenerate(
    originalContent: GeneratedContent,
    uvp: CompleteUVP,
    changes?: {
      framework?: PsychologyFramework;
      tone?: string;
      funnelStage?: FunnelStage;
    }
  ): Promise<GeneratedContent> {
    console.log('[V4 Orchestrator] Regenerating content...');

    // Build new prompt with specified framework
    const framework = changes?.framework || originalContent.psychology.framework;
    const templates = promptLibrary.getByFramework(framework);
    const template = templates[0] || promptLibrary.getRandomTemplate();

    const prompt = promptLibrary.buildPrompt(template.id, uvp);

    const rawResponse = await this.callAI(prompt, DEFAULT_MODEL);
    const parsed = this.parseResponse(rawResponse, template.id);
    const score = contentScorer.score(parsed);

    return {
      id: `content-${Date.now()}-${++this.generationCount}`,
      headline: parsed.headline || '',
      hook: parsed.hook || '',
      body: parsed.body || '',
      cta: parsed.cta || '',
      hashtags: parsed.hashtags || [],
      score,
      psychology: {
        framework,
        primaryTrigger: psychologyEngine.selectTrigger(framework),
        intensity: originalContent.psychology.intensity
      },
      mixCategory: originalContent.mixCategory,
      funnelStage: changes?.funnelStage || originalContent.funnelStage,
      pillarId: originalContent.pillarId,
      metadata: {
        generatedAt: new Date(),
        model: DEFAULT_MODEL,
        platform: originalContent.metadata.platform,
        characterCount: (parsed.hook + parsed.body + parsed.cta).length
      }
    };
  }

  /**
   * Score existing content (without generation)
   */
  scoreContent(content: { headline?: string; hook?: string; body: string; cta?: string }): ContentScore {
    return contentScorer.score(content);
  }

  /**
   * Get content improvement suggestions
   */
  getImprovements(score: ContentScore): string[] {
    const improvements: string[] = [];

    if (score.breakdown.unexpectedness < 20) {
      improvements.push('Add a more surprising hook or contrarian angle');
    }
    if (score.breakdown.truthfulness < 15) {
      improvements.push('Include specific data, statistics, or examples');
    }
    if (score.breakdown.actionability < 12) {
      improvements.push('Make the call-to-action clearer and more specific');
    }
    if (score.breakdown.uniqueness < 10) {
      improvements.push('Find a unique angle that competitors aren\'t using');
    }
    if (score.breakdown.virality < 5) {
      improvements.push('Add emotional resonance or shareable elements');
    }

    return improvements;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Compute content hash for deduplication persistence
   */
  private computeContentHash(content: { headline: string; hook: string; body: string }): string {
    const combined = `${content.headline}|${content.hook}|${content.body}`.toLowerCase();
    // Simple hash for deduplication (same algorithm as intelligence-integration)
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  /**
   * Call AI via edge function (NO EXPOSED APIs)
   */
  private async callAI(prompt: string, model: string): Promise<string> {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        provider: 'openrouter',
        model: model.startsWith('anthropic/') ? model : `anthropic/${model}`,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.8
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI call failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Handle different response formats
    if (data.content?.[0]?.text) {
      return data.content[0].text;
    }
    if (data.choices?.[0]?.message?.content) {
      return data.choices[0].message.content;
    }
    if (typeof data === 'string') {
      return data;
    }

    throw new Error('Unexpected AI response format');
  }

  /**
   * Call AI with exponential backoff retry logic
   */
  private async callAIWithRetry(prompt: string, model: string): Promise<string> {
    let lastError: Error | null = null;
    let delay = RETRY_DELAY_MS;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await this.callAI(prompt, model);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const errorMessage = lastError.message;

        // Don't retry on certain errors
        if (errorMessage.includes('401') || errorMessage.includes('403')) {
          console.error('[V4 Orchestrator] Auth error, not retrying');
          throw lastError;
        }

        if (attempt < MAX_RETRIES) {
          console.warn(`[V4 Orchestrator] AI call failed (attempt ${attempt}/${MAX_RETRIES}), retrying in ${delay}ms...`);
          await this.delay(delay);
          delay *= RETRY_BACKOFF_MULTIPLIER;
        }
      }
    }

    console.error(`[V4 Orchestrator] AI call failed after ${MAX_RETRIES} attempts`);
    throw lastError || new Error('AI call failed after retries');
  }

  /**
   * Select template based on request
   */
  private selectTemplate(request: ContentRequest, profile: PsychologyProfile): string {
    // If framework specified, use it
    if (request.framework) {
      const templates = promptLibrary.getByFramework(request.framework);
      if (templates.length > 0) return templates[0].id;
    }

    // Otherwise use psychology engine selection
    const templates = promptLibrary.getByFramework(profile.framework);
    if (templates.length > 0) return templates[0].id;

    // Fallback to goal-based selection
    const goal = this.inferGoal(request);
    return promptLibrary.selectTemplate(goal).id;
  }

  /**
   * Infer content goal from request
   */
  private inferGoal(request: ContentRequest): 'engagement' | 'conversion' | 'authority' | 'awareness' {
    // Mix category based inference
    if (request.contentMixCategory === 'promo' || request.contentMixCategory === 'hard_sell') {
      return 'conversion';
    }
    if (request.contentMixCategory === 'curated') {
      return 'authority';
    }

    // Funnel stage based inference
    if (request.funnelStage === 'BOFU') return 'conversion';
    if (request.funnelStage === 'MOFU') return 'authority';

    return 'engagement'; // Default
  }

  /**
   * Parse AI response to content structure
   */
  private parseResponse(response: string, templateId: string): {
    headline?: string;
    hook: string;
    body: string;
    cta: string;
    hashtags: string[];
  } {
    try {
      // Try JSON parse first
      let cleaned = response.trim();

      // Remove markdown code blocks if present
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // Find JSON object in response
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        return {
          headline: parsed.headline || parsed.hook?.substring(0, 60),
          hook: parsed.hook || parsed.opening_line || parsed.openingLine || '',
          body: this.buildBody(parsed),
          cta: parsed.cta || parsed.engagement_prompt || '',
          hashtags: parsed.hashtags || []
        };
      }

      // Fallback: treat as plain text
      return {
        hook: response.substring(0, 150),
        body: response,
        cta: '',
        hashtags: []
      };

    } catch (error) {
      console.error('[V4 Orchestrator] Parse error:', error);
      return {
        hook: response.substring(0, 150),
        body: response,
        cta: '',
        hashtags: []
      };
    }
  }

  /**
   * Build body from various parsed fields
   */
  private buildBody(parsed: any): string {
    const parts: string[] = [];

    // Story structure
    if (parsed.struggle) parts.push(parsed.struggle);
    if (parsed.turning_point) parts.push(parsed.turning_point);
    if (parsed.transformation) parts.push(parsed.transformation);
    if (parsed.lesson) parts.push(parsed.lesson);

    // Data structure
    if (parsed.context) parts.push(parsed.context);
    if (parsed.insight) parts.push(parsed.insight);
    if (parsed.actionable_tip) parts.push(parsed.actionable_tip);

    // Controversial structure
    if (parsed.conventional_wisdom) parts.push(`Most people believe: ${parsed.conventional_wisdom}`);
    if (parsed.why_wrong) {
      if (Array.isArray(parsed.why_wrong)) {
        parts.push(parsed.why_wrong.join('\n'));
      } else {
        parts.push(parsed.why_wrong);
      }
    }
    if (parsed.better_approach) parts.push(`Instead: ${parsed.better_approach}`);

    // Hook structure
    if (parsed.buildup) parts.push(parsed.buildup);
    if (parsed.reveal) parts.push(parsed.reveal);
    if (parsed.value_add) parts.push(parsed.value_add);

    // Tip structure
    if (parsed.tip) parts.push(parsed.tip);
    if (parsed.how_to) {
      if (Array.isArray(parsed.how_to)) {
        parts.push(parsed.how_to.join('\n'));
      } else {
        parts.push(parsed.how_to);
      }
    }
    if (parsed.why_it_works) parts.push(parsed.why_it_works);
    if (parsed.encouragement) parts.push(parsed.encouragement);

    // Fallback
    if (parts.length === 0 && parsed.body) {
      return parsed.body;
    }

    return parts.join('\n\n');
  }

  /**
   * Distribute content across funnel stages (60/30/10)
   */
  private distributeFunnelStages(count: number): FunnelStage[] {
    const stages: FunnelStage[] = [];

    const tofuCount = Math.round(count * 0.6);
    const mofuCount = Math.round(count * 0.3);
    const bofuCount = count - tofuCount - mofuCount;

    for (let i = 0; i < tofuCount; i++) stages.push('TOFU');
    for (let i = 0; i < mofuCount; i++) stages.push('MOFU');
    for (let i = 0; i < bofuCount; i++) stages.push('BOFU');

    // Shuffle for variety
    return this.shuffle(stages);
  }

  /**
   * Get content mix category based on position and rule
   */
  private getMixCategory(
    index: number,
    total: number,
    rule?: '70-20-10' | '4-1-1' | '5-3-2'
  ): ContentMixCategory {
    if (!rule || rule === '70-20-10') {
      // 70% value, 20% curated, 10% promo
      const position = index / total;
      if (position < 0.7) return 'value';
      if (position < 0.9) return 'curated';
      return 'promo';
    }

    if (rule === '4-1-1') {
      // 4 value, 1 soft, 1 hard per 6
      const cyclePosition = index % 6;
      if (cyclePosition < 4) return 'value';
      if (cyclePosition === 4) return 'soft_sell';
      return 'hard_sell';
    }

    if (rule === '5-3-2') {
      // 5 curated, 3 original, 2 personal per 10
      const cyclePosition = index % 10;
      if (cyclePosition < 5) return 'curated';
      if (cyclePosition < 8) return 'value';
      return 'personal';
    }

    return 'value';
  }

  /**
   * Shuffle array
   */
  private shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Enforce platform character limits
   */
  private enforceplatformLimits(
    parsed: { headline?: string; hook: string; body: string; cta: string; hashtags: string[] },
    platform: string
  ): { headline?: string; hook: string; body: string; cta: string; hashtags: string[] } {
    const limits = PLATFORM_LIMITS[platform] || PLATFORM_LIMITS.linkedin;

    // Truncate headline if needed
    let headline = parsed.headline;
    if (headline && headline.length > limits.headline) {
      headline = headline.substring(0, limits.headline - 3) + '...';
      console.warn(`[V4 Orchestrator] Headline truncated to ${limits.headline} chars for ${platform}`);
    }

    // Calculate total body content
    const fullBody = [parsed.hook, parsed.body, parsed.cta].filter(Boolean).join('\n\n');

    // If body exceeds limit, prioritize hook and CTA, trim body
    if (fullBody.length > limits.body) {
      const hookLength = parsed.hook.length;
      const ctaLength = parsed.cta.length;
      const separators = 8; // '\n\n' between sections
      const availableForBody = limits.body - hookLength - ctaLength - separators - 3;

      let body = parsed.body;
      if (availableForBody > 100) {
        body = parsed.body.substring(0, availableForBody) + '...';
      } else {
        // Not enough space, truncate everything proportionally
        const totalOriginal = fullBody.length;
        const ratio = limits.body / totalOriginal;
        body = parsed.body.substring(0, Math.floor(parsed.body.length * ratio) - 3) + '...';
      }

      console.warn(`[V4 Orchestrator] Body truncated from ${parsed.body.length} to ${body.length} chars for ${platform}`);

      return {
        headline,
        hook: parsed.hook,
        body,
        cta: parsed.cta,
        hashtags: parsed.hashtags
      };
    }

    return { ...parsed, headline };
  }

  /**
   * Get an alternative framework to avoid duplicates
   */
  private getAlternativeFramework(currentFramework: PsychologyFramework): PsychologyFramework {
    const alternatives: Record<PsychologyFramework, PsychologyFramework> = {
      AIDA: 'PAS',
      PAS: 'BAB',
      BAB: 'PASTOR',
      PASTOR: 'StoryBrand',
      StoryBrand: 'CuriosityGap',
      CuriosityGap: 'PatternInterrupt',
      PatternInterrupt: 'SocialProof',
      SocialProof: 'Scarcity',
      Scarcity: 'Reciprocity',
      Reciprocity: 'LossAversion',
      LossAversion: 'Authority',
      Authority: 'FAB',
      FAB: 'AIDA'
    };
    return alternatives[currentFramework] || 'AIDA';
  }
}

// Export singleton instance
export const contentOrchestrator = new ContentOrchestrator();

// Export class for testing
export { ContentOrchestrator };
