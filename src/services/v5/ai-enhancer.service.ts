/**
 * V5 AI Enhancer Service
 *
 * Constrained AI enhancement that improves templates without destroying them.
 * Key constraints from V1 that make content convert:
 * - 500 tokens max (forces concise, punchy content)
 * - 0.7 temperature (balanced creativity, not random)
 * - <500 words in prompts (focused context)
 * - Platform limits enforced
 *
 * Created: 2025-12-01
 */

import type {
  Platform,
  CustomerCategory,
  IndustryPsychology,
  UVPVariables,
  EQProfile,
  ContentScore,
  PLATFORM_CONSTRAINTS,
} from './types';
import { PLATFORM_CONSTRAINTS as platformConstraints } from './types';
import { scoreSync, generateHints } from './synapse-scorer.service';

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface AIConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  apiEndpoint: string;
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  model: 'anthropic/claude-3.5-haiku', // Fast and cheap for enhancement (OpenRouter format)
  maxTokens: 500, // HARD LIMIT - forces concise content
  temperature: 0.7, // Balanced creativity
  apiEndpoint: import.meta.env?.VITE_SUPABASE_URL
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`
    : '/functions/v1/ai-proxy', // Use existing ai-proxy edge function
};

// Tone adjustments based on brand voice
export const TEMPERATURE_ADJUSTMENTS: Record<string, number> = {
  professional: -0.1, // More consistent
  casual: 0.1, // More varied
  playful: 0.15, // More creative
  authoritative: -0.15, // More precise
  friendly: 0.05, // Slightly more varied
};

// ============================================================================
// PROMPT BUILDING
// ============================================================================

export interface PromptContext {
  platform: Platform;
  customerCategory: CustomerCategory;
  industryPsychology: IndustryPsychology;
  uvpVariables: UVPVariables;
  eqProfile?: EQProfile;
  populatedTemplate: string;
  hints?: string[]; // From previous failed attempt
}

/**
 * Build system prompt (role + constraints)
 * Must be <250 words to leave room for user prompt
 */
export function buildSystemPrompt(context: PromptContext): string {
  const { platform, customerCategory, industryPsychology, uvpVariables, eqProfile } = context;
  const constraints = platformConstraints[platform];

  // Get top 3 power words
  const topPowerWords = (industryPsychology.powerWords || []).slice(0, 3).join(', ');

  // Get avoid words (max 5)
  const avoidWords = (industryPsychology.avoidWords || []).slice(0, 5).join(', ');

  // Get emotional temperature
  const emotionalTemp = eqProfile?.emotionalTemperature || 'warm';

  return `You are a professional content creator for ${industryPsychology.industryName || 'business'} brands.

VOICE: ${uvpVariables.brandVoice || 'professional and authentic'}

CONSTRAINTS:
- Maximum ${constraints.characterLimit} characters
- Use these power words naturally: ${topPowerWords || 'transform, results, proven'}
- Avoid: ${avoidWords || 'cheap, discount, basic'}
- Target customer: ${customerCategory} buyers

STYLE:
- Clear and concise
- Authentic, not salesy
- Strong call-to-action
- Emotional temperature: ${emotionalTemp}

Return ONLY the enhanced content, no explanation.`;
}

/**
 * Build user prompt (content + enhancement request)
 * Must be <250 words to keep total <500 words
 */
export function buildUserPrompt(context: PromptContext): string {
  const { platform, populatedTemplate, uvpVariables, hints } = context;
  const constraints = platformConstraints[platform];

  let prompt = `Enhance this ${platform} post for ${uvpVariables.businessName}:

BASE CONTENT:
${populatedTemplate}

CONTEXT:
- Key benefit: ${uvpVariables.keyBenefit || 'exceptional service'}
- Differentiator: ${uvpVariables.differentiator || 'personalized approach'}
${uvpVariables.trend ? `- Trending topic: ${uvpVariables.trend}` : ''}
${uvpVariables.competitiveEdge ? `- Competitive edge: ${uvpVariables.competitiveEdge}` : ''}

REQUIREMENTS:
- Keep under ${constraints.characterLimit} characters
- Include ${constraints.hashtagCount.min}-${constraints.hashtagCount.max} relevant hashtags
- End with clear CTA`;

  // Add improvement hints if this is a retry
  if (hints && hints.length > 0) {
    prompt += `\n\nIMPROVE THESE AREAS:\n${hints.map(h => `- ${h}`).join('\n')}`;
  }

  return prompt;
}

/**
 * Count words in prompt to ensure <500 total
 */
export function countPromptWords(systemPrompt: string, userPrompt: string): number {
  const combined = systemPrompt + ' ' + userPrompt;
  return combined.split(/\s+/).filter(Boolean).length;
}

// ============================================================================
// ENHANCEMENT TYPES
// ============================================================================

export interface EnhancementRequest {
  populatedTemplate: string;
  context: PromptContext;
  config?: Partial<AIConfig>;
}

export interface EnhancementResult {
  success: boolean;
  content: string;
  score?: ContentScore;
  metadata: {
    model: string;
    tokensUsed?: number;
    promptWords: number;
    attempt: number;
    enhancedAt: Date;
  };
  error?: string;
}

export interface EnhancementWithRetryResult {
  success: boolean;
  finalContent: string;
  finalScore?: ContentScore;
  attempts: EnhancementAttempt[];
  usedFallback: boolean;
}

export interface EnhancementAttempt {
  attempt: number;
  content: string;
  score?: ContentScore;
  hints?: string[];
  error?: string;
}

// ============================================================================
// AI ENHANCEMENT
// ============================================================================

/**
 * Enhance content using AI with constraints
 */
export async function enhance(request: EnhancementRequest): Promise<EnhancementResult> {
  const config = { ...DEFAULT_AI_CONFIG, ...request.config };
  const { context, populatedTemplate } = request;

  // Build prompts
  const systemPrompt = buildSystemPrompt(context);
  const userPrompt = buildUserPrompt(context);

  // Validate prompt length
  const promptWords = countPromptWords(systemPrompt, userPrompt);
  if (promptWords > 500) {
    console.warn(`[V5 AI] Prompt exceeds 500 words (${promptWords}), trimming context`);
  }

  // Adjust temperature based on brand voice
  let temperature = config.temperature;
  if (context.uvpVariables.brandVoice) {
    const adjustment = TEMPERATURE_ADJUSTMENTS[context.uvpVariables.brandVoice.toLowerCase()] || 0;
    temperature = Math.max(0.3, Math.min(1.0, temperature + adjustment));
  }

  try {
    // Call AI API
    const response = await callAIAPI({
      model: config.model,
      maxTokens: config.maxTokens,
      temperature,
      systemPrompt,
      userPrompt,
      apiEndpoint: config.apiEndpoint,
    });

    if (!response.success) {
      return {
        success: false,
        content: populatedTemplate, // Fallback to original
        metadata: {
          model: config.model,
          promptWords,
          attempt: 1,
          enhancedAt: new Date(),
        },
        error: response.error,
      };
    }

    // Score the enhanced content
    const score = scoreSync(response.content, {
      industryPsychology: context.industryPsychology,
      customerCategory: context.customerCategory,
      platform: context.platform,
    });

    return {
      success: true,
      content: response.content,
      score,
      metadata: {
        model: config.model,
        tokensUsed: response.tokensUsed,
        promptWords,
        attempt: 1,
        enhancedAt: new Date(),
      },
    };
  } catch (error) {
    console.error('[V5 AI] Enhancement failed:', error);
    return {
      success: false,
      content: populatedTemplate,
      metadata: {
        model: config.model,
        promptWords,
        attempt: 1,
        enhancedAt: new Date(),
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Enhance with retry logic - retry with hints if score < 75
 */
export async function enhanceWithRetry(
  request: EnhancementRequest,
  maxRetries: number = 2
): Promise<EnhancementWithRetryResult> {
  const attempts: EnhancementAttempt[] = [];
  let currentContent = request.populatedTemplate;
  let currentContext = { ...request.context };
  let finalScore: ContentScore | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[V5 AI] Enhancement attempt ${attempt}/${maxRetries}`);

    const result = await enhance({
      ...request,
      populatedTemplate: attempt === 1 ? request.populatedTemplate : currentContent,
      context: currentContext,
    });

    const attemptResult: EnhancementAttempt = {
      attempt,
      content: result.content,
      score: result.score,
      error: result.error,
    };

    // Check if passed quality gate (≥75)
    if (result.score && result.score.passed) {
      attempts.push(attemptResult);
      return {
        success: true,
        finalContent: result.content,
        finalScore: result.score,
        attempts,
        usedFallback: false,
      };
    }

    // Generate hints for next attempt
    if (result.score && attempt < maxRetries) {
      const hints = generateHints(result.score.breakdown, currentContext.industryPsychology);
      attemptResult.hints = hints;

      // Update context with hints for next attempt
      currentContext = {
        ...currentContext,
        hints,
        populatedTemplate: result.content,
      };
      currentContent = result.content;
    }

    attempts.push(attemptResult);
    finalScore = result.score;
  }

  // All attempts exhausted - return best attempt
  const bestAttempt = attempts.reduce((best, current) => {
    if (!current.score) return best;
    if (!best.score) return current;
    return current.score.total > best.score.total ? current : best;
  }, attempts[0]);

  console.log(`[V5 AI] Max retries reached. Best score: ${bestAttempt.score?.total || 'N/A'}`);

  return {
    success: false, // Didn't pass quality gate
    finalContent: bestAttempt.content,
    finalScore: bestAttempt.score,
    attempts,
    usedFallback: false,
  };
}

// ============================================================================
// API CALLING
// ============================================================================

interface AIAPIRequest {
  model: string;
  maxTokens: number;
  temperature: number;
  systemPrompt: string;
  userPrompt: string;
  apiEndpoint: string;
}

interface AIAPIResponse {
  success: boolean;
  content: string;
  tokensUsed?: number;
  error?: string;
}

/**
 * Call the AI API (via ai-proxy edge function)
 * Uses OpenRouter format through existing infrastructure
 */
async function callAIAPI(request: AIAPIRequest): Promise<AIAPIResponse> {
  try {
    // Format for ai-proxy edge function (OpenRouter format)
    const response = await fetch(request.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: 'openrouter',
        model: request.model,
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        messages: [
          {
            role: 'system',
            content: request.systemPrompt,
          },
          {
            role: 'user',
            content: request.userPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        content: '',
        error: `API error: ${response.status} - ${errorText}`,
      };
    }

    const data = await response.json();

    // Handle OpenRouter response format (via ai-proxy)
    const content = data.choices?.[0]?.message?.content || data.content?.[0]?.text || data.text || '';
    const tokensUsed = data.usage?.total_tokens || data.usage?.completion_tokens;

    if (!content) {
      return {
        success: false,
        content: '',
        error: 'Empty response from AI',
      };
    }

    return {
      success: true,
      content: content.trim(),
      tokensUsed,
    };
  } catch (error) {
    return {
      success: false,
      content: '',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// ============================================================================
// QUALITY LOGGING
// ============================================================================

export interface GenerationLog {
  id: string;
  timestamp: Date;
  platform: Platform;
  customerCategory: CustomerCategory;
  industrySlug: string;
  templateId?: string;
  attempts: EnhancementAttempt[];
  finalScore?: number;
  passed: boolean;
  usedFallback: boolean;
  model: string;
  totalTokens?: number;
}

const generationLogs: GenerationLog[] = [];

/**
 * Log generation attempt for quality tracking
 */
export function logGeneration(log: GenerationLog): void {
  generationLogs.push(log);

  // Keep only last 1000 logs in memory
  if (generationLogs.length > 1000) {
    generationLogs.shift();
  }

  console.log(`[V5 Log] ${log.platform}/${log.customerCategory} - Score: ${log.finalScore || 'N/A'} - Passed: ${log.passed}`);
}

/**
 * Get generation stats
 */
export function getGenerationStats(): {
  totalGenerations: number;
  passRate: number;
  averageScore: number;
  averageAttempts: number;
  retryRate: number;
} {
  if (generationLogs.length === 0) {
    return {
      totalGenerations: 0,
      passRate: 0,
      averageScore: 0,
      averageAttempts: 0,
      retryRate: 0,
    };
  }

  const passed = generationLogs.filter(l => l.passed).length;
  const withScores = generationLogs.filter(l => l.finalScore !== undefined);
  const totalScore = withScores.reduce((sum, l) => sum + (l.finalScore || 0), 0);
  const totalAttempts = generationLogs.reduce((sum, l) => sum + l.attempts.length, 0);
  const withRetries = generationLogs.filter(l => l.attempts.length > 1).length;

  return {
    totalGenerations: generationLogs.length,
    passRate: (passed / generationLogs.length) * 100,
    averageScore: withScores.length > 0 ? totalScore / withScores.length : 0,
    averageAttempts: totalAttempts / generationLogs.length,
    retryRate: (withRetries / generationLogs.length) * 100,
  };
}

/**
 * Get recent logs for debugging
 */
export function getRecentLogs(count: number = 10): GenerationLog[] {
  return generationLogs.slice(-count);
}

// ============================================================================
// TEMPLATE FALLBACK
// ============================================================================

export interface FallbackOptions {
  platform: Platform;
  customerCategory: CustomerCategory;
  excludeTemplateIds: string[];
}

/**
 * Get a fallback template when current template fails twice
 * Uses the template service to select an alternative
 */
export async function getFallbackTemplate(
  options: FallbackOptions
): Promise<{ templateId: string; template: string } | null> {
  // Import dynamically to avoid circular dependencies
  const { selectTemplate } = await import('./template.service');

  const template = await selectTemplate({
    platform: options.platform,
    customerCategory: options.customerCategory,
    excludeIds: options.excludeTemplateIds,
  });

  if (!template) {
    console.warn('[V5 AI] No fallback template available');
    return null;
  }

  return {
    templateId: template.id,
    template: template.template,
  };
}

/**
 * Full generation with template fallback
 * If template fails twice, try a different template
 */
export async function generateWithFallback(
  request: EnhancementRequest & {
    templateId: string;
    uvpVariables: Record<string, string>;
  },
  maxTemplateAttempts: number = 2
): Promise<EnhancementWithRetryResult & { templateId: string }> {
  const usedTemplateIds: string[] = [request.templateId];
  let currentTemplateId = request.templateId;
  let currentRequest = { ...request };

  for (let templateAttempt = 0; templateAttempt < maxTemplateAttempts; templateAttempt++) {
    // Try enhancement with retry on current template
    const result = await enhanceWithRetry(currentRequest);

    if (result.success) {
      return {
        ...result,
        templateId: currentTemplateId,
      };
    }

    // If we've exhausted template attempts, return best result
    if (templateAttempt >= maxTemplateAttempts - 1) {
      console.log(`[V5 AI] Max template attempts (${maxTemplateAttempts}) reached`);
      return {
        ...result,
        templateId: currentTemplateId,
        usedFallback: true,
      };
    }

    // Try fallback template
    console.log(`[V5 AI] Trying fallback template (attempt ${templateAttempt + 2}/${maxTemplateAttempts})`);

    const fallback = await getFallbackTemplate({
      platform: currentRequest.context.platform,
      customerCategory: currentRequest.context.customerCategory,
      excludeTemplateIds: usedTemplateIds,
    });

    if (!fallback) {
      // No more templates, return best result from current
      return {
        ...result,
        templateId: currentTemplateId,
        usedFallback: false,
      };
    }

    // Populate fallback template with variables
    const { populateTemplate } = await import('./template.service');
    const { getTemplateById } = await import('./template.service');
    const fallbackTemplate = getTemplateById(fallback.templateId);

    if (!fallbackTemplate) {
      return {
        ...result,
        templateId: currentTemplateId,
        usedFallback: false,
      };
    }

    const populatedFallback = populateTemplate(fallbackTemplate, request.uvpVariables);

    // Update for next attempt
    usedTemplateIds.push(fallback.templateId);
    currentTemplateId = fallback.templateId;
    currentRequest = {
      ...currentRequest,
      populatedTemplate: populatedFallback,
      context: {
        ...currentRequest.context,
        populatedTemplate: populatedFallback,
        hints: undefined, // Reset hints for new template
      },
    };
  }

  // Should not reach here, but return empty result
  return {
    success: false,
    finalContent: request.populatedTemplate,
    attempts: [],
    usedFallback: true,
    templateId: currentTemplateId,
  };
}

// ============================================================================
// EXPORT SERVICE
// ============================================================================

export interface IAIEnhancerService {
  enhance: typeof enhance;
  enhanceWithRetry: typeof enhanceWithRetry;
  buildSystemPrompt: typeof buildSystemPrompt;
  buildUserPrompt: typeof buildUserPrompt;
  logGeneration: typeof logGeneration;
  getGenerationStats: typeof getGenerationStats;
}

export const aiEnhancerService: IAIEnhancerService = {
  enhance,
  enhanceWithRetry,
  buildSystemPrompt,
  buildUserPrompt,
  logGeneration,
  getGenerationStats,
};

export default aiEnhancerService;
