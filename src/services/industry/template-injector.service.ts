/**
 * Template Injector Service
 *
 * Replaces [PLACEHOLDER] tokens in industry templates with actual UVP data.
 * Used by content generation to personalize industry-specific templates.
 *
 * Tokens supported:
 * - [INDUSTRY] - The brand's industry
 * - [COMPANY_TYPE] - Target customer company size/type
 * - [PAIN_POINT] - Primary customer pain point
 * - [TRANSFORMATION] - Before → After transformation
 * - [BENEFIT] - Key benefit statement
 * - [CUSTOMER] - Target customer description
 * - [SOLUTION] - Unique solution approach
 * - [URGENCY] - Urgency driver
 * - [PROOF] - Proof point or social proof
 * - [CTA] - Call to action
 *
 * Created: 2025-11-29
 * Phase: Industry Profile 2.0 Integration - Phase 5
 */

import type { CompleteUVP } from '@/types/uvp-flow.types';
import type { EnhancedIndustryProfile } from '@/types/industry-profile.types';

// =============================================================================
// TYPES
// =============================================================================

export interface TokenContext {
  uvp: CompleteUVP;
  profile?: EnhancedIndustryProfile | null;
  weekTheme?: string;
  contentType?: string;
}

export interface TokenReplacementResult {
  text: string;
  tokensReplaced: string[];
  tokensNotFound: string[];
}

// =============================================================================
// TOKEN DEFINITIONS
// =============================================================================

type TokenResolver = (ctx: TokenContext) => string;

const TOKEN_RESOLVERS: Record<string, TokenResolver> = {
  '[INDUSTRY]': (ctx) => {
    return (ctx.uvp as any)?.industry ||
           ctx.uvp?.targetCustomer?.industry ||
           ctx.profile?.industry_name ||
           'your industry';
  },

  '[COMPANY_TYPE]': (ctx) => {
    return ctx.uvp?.targetCustomer?.companySize ||
           ctx.uvp?.targetCustomer?.statement?.split(' ')[0] ||
           'businesses';
  },

  '[CUSTOMER]': (ctx) => {
    return ctx.uvp?.targetCustomer?.statement ||
           ctx.uvp?.targetCustomer?.description ||
           'your ideal customers';
  },

  '[PAIN_POINT]': (ctx) => {
    // Try profile customer voice first
    const problemPhrases = (ctx.profile as any)?.customer_voice?.problem_phrases;
    if (problemPhrases?.length > 0) {
      return problemPhrases[0];
    }
    // Fall back to transformation before state
    return ctx.uvp?.transformationGoal?.before ||
           ctx.uvp?.keyBenefit?.painAddressed ||
           'the challenges they face';
  },

  '[TRANSFORMATION]': (ctx) => {
    const tg = ctx.uvp?.transformationGoal;
    if (tg?.before && tg?.after) {
      return `from ${tg.before} to ${tg.after}`;
    }
    // Try profile transformations
    const transforms = ctx.profile?.transformations;
    if (transforms?.length > 0) {
      const t = transforms[0];
      if (typeof t === 'object' && 'from' in t && 'to' in t) {
        return `from ${t.from} to ${t.to}`;
      }
    }
    return 'transformation';
  },

  '[BEFORE_STATE]': (ctx) => {
    return ctx.uvp?.transformationGoal?.before ||
           'current challenges';
  },

  '[AFTER_STATE]': (ctx) => {
    return ctx.uvp?.transformationGoal?.after ||
           'desired outcomes';
  },

  '[BENEFIT]': (ctx) => {
    return ctx.uvp?.keyBenefit?.statement ||
           ctx.uvp?.keyBenefit?.description ||
           'key benefits';
  },

  '[SOLUTION]': (ctx) => {
    return ctx.uvp?.uniqueSolution?.approach ||
           ctx.uvp?.uniqueSolution?.statement ||
           'our unique approach';
  },

  '[URGENCY]': (ctx) => {
    const urgencyDrivers = ctx.profile?.urgency_drivers;
    if (urgencyDrivers && Array.isArray(urgencyDrivers) && urgencyDrivers.length > 0) {
      return urgencyDrivers[0];
    }
    return ctx.uvp?.transformationGoal?.urgencyFactor ||
           'the need for change';
  },

  '[PROOF]': (ctx) => {
    const proofPoints = (ctx.profile as any)?.risk_reversal?.proof_points;
    if (proofPoints?.length > 0) {
      return proofPoints[0];
    }
    return ctx.uvp?.keyBenefit?.proofPoints?.[0] ||
           'proven results';
  },

  '[CTA]': (ctx) => {
    const ctaTemplates = ctx.profile?.call_to_action_templates;
    if (ctaTemplates && Array.isArray(ctaTemplates) && ctaTemplates.length > 0) {
      return ctaTemplates[0];
    }
    return 'Learn more';
  },

  '[WEEK_THEME]': (ctx) => {
    return ctx.weekTheme || 'this week\'s focus';
  },

  '[CONTENT_TYPE]': (ctx) => {
    return ctx.contentType || 'content';
  },

  '[EMOTIONAL_VALUE]': (ctx) => {
    const transforms = ctx.profile?.transformations;
    if (transforms?.length > 0) {
      const t = transforms[0];
      if (typeof t === 'object' && 'emotional_value' in t) {
        return t.emotional_value;
      }
    }
    return ctx.uvp?.transformationGoal?.emotionalDrivers?.[0] ||
           'peace of mind';
  },

  '[TRIGGER]': (ctx) => {
    const triggers = ctx.profile?.customer_triggers;
    if (triggers?.length > 0) {
      const t = triggers[0];
      if (typeof t === 'object' && 'trigger' in t) {
        return t.trigger;
      }
      if (typeof t === 'string') {
        return t;
      }
    }
    return 'the moment of need';
  },

  '[POWER_WORD]': (ctx) => {
    const powerWords = ctx.profile?.power_words;
    if (powerWords && Array.isArray(powerWords) && powerWords.length > 0) {
      // Return a random power word for variety
      return powerWords[Math.floor(Math.random() * powerWords.length)];
    }
    return 'transform';
  },
};

// Additional aliases for common variations
const TOKEN_ALIASES: Record<string, string> = {
  '[TARGET_CUSTOMER]': '[CUSTOMER]',
  '[TARGET]': '[CUSTOMER]',
  '[PROBLEM]': '[PAIN_POINT]',
  '[PAIN]': '[PAIN_POINT]',
  '[OUTCOME]': '[AFTER_STATE]',
  '[VALUE]': '[BENEFIT]',
  '[KEY_BENEFIT]': '[BENEFIT]',
  '[UNIQUE_SOLUTION]': '[SOLUTION]',
  '[APPROACH]': '[SOLUTION]',
  '[CALL_TO_ACTION]': '[CTA]',
  '[ACTION]': '[CTA]',
  '[THEME]': '[WEEK_THEME]',
  '[TYPE]': '[CONTENT_TYPE]',
};

// =============================================================================
// MAIN SERVICE
// =============================================================================

class TemplateInjectorService {
  /**
   * Replace all tokens in a template string with UVP/profile data
   */
  replaceTokens(template: string, context: TokenContext): TokenReplacementResult {
    let result = template;
    const tokensReplaced: string[] = [];
    const tokensNotFound: string[] = [];

    // Find all tokens in the template
    const tokenRegex = /\[([A-Z_]+)\]/g;
    const foundTokens = new Set<string>();
    let match;

    while ((match = tokenRegex.exec(template)) !== null) {
      foundTokens.add(match[0]);
    }

    // Replace each token
    for (const token of foundTokens) {
      // Check for alias first
      const resolvedToken = TOKEN_ALIASES[token] || token;
      const resolver = TOKEN_RESOLVERS[resolvedToken];

      if (resolver) {
        try {
          const value = resolver(context);
          result = result.replaceAll(token, value);
          tokensReplaced.push(token);
        } catch (err) {
          console.warn(`[TemplateInjector] Failed to resolve token ${token}:`, err);
          tokensNotFound.push(token);
        }
      } else {
        tokensNotFound.push(token);
      }
    }

    if (tokensNotFound.length > 0) {
      console.warn(`[TemplateInjector] Unresolved tokens: ${tokensNotFound.join(', ')}`);
    }

    return {
      text: result,
      tokensReplaced,
      tokensNotFound,
    };
  }

  /**
   * Replace tokens in multiple template fields (hook, body, cta)
   */
  replaceInContent(
    content: { hook?: string; body?: string; cta?: string },
    context: TokenContext
  ): { hook: string; body: string; cta: string; allTokensReplaced: string[] } {
    const allTokensReplaced: string[] = [];

    const hookResult = content.hook
      ? this.replaceTokens(content.hook, context)
      : { text: '', tokensReplaced: [], tokensNotFound: [] };

    const bodyResult = content.body
      ? this.replaceTokens(content.body, context)
      : { text: '', tokensReplaced: [], tokensNotFound: [] };

    const ctaResult = content.cta
      ? this.replaceTokens(content.cta, context)
      : { text: '', tokensReplaced: [], tokensNotFound: [] };

    allTokensReplaced.push(
      ...hookResult.tokensReplaced,
      ...bodyResult.tokensReplaced,
      ...ctaResult.tokensReplaced
    );

    return {
      hook: hookResult.text,
      body: bodyResult.text,
      cta: ctaResult.text,
      allTokensReplaced: [...new Set(allTokensReplaced)],
    };
  }

  /**
   * Get list of all supported tokens
   */
  getSupportedTokens(): string[] {
    return [
      ...Object.keys(TOKEN_RESOLVERS),
      ...Object.keys(TOKEN_ALIASES),
    ];
  }

  /**
   * Check if a template contains any tokens
   */
  hasTokens(template: string): boolean {
    return /\[([A-Z_]+)\]/.test(template);
  }

  /**
   * Extract all tokens from a template
   */
  extractTokens(template: string): string[] {
    const tokens: string[] = [];
    const tokenRegex = /\[([A-Z_]+)\]/g;
    let match;

    while ((match = tokenRegex.exec(template)) !== null) {
      if (!tokens.includes(match[0])) {
        tokens.push(match[0]);
      }
    }

    return tokens;
  }

  /**
   * Preview token replacements without modifying template
   */
  previewReplacements(template: string, context: TokenContext): Record<string, string> {
    const tokens = this.extractTokens(template);
    const preview: Record<string, string> = {};

    for (const token of tokens) {
      const resolvedToken = TOKEN_ALIASES[token] || token;
      const resolver = TOKEN_RESOLVERS[resolvedToken];

      if (resolver) {
        try {
          preview[token] = resolver(context);
        } catch {
          preview[token] = `[ERROR: ${token}]`;
        }
      } else {
        preview[token] = `[UNKNOWN: ${token}]`;
      }
    }

    return preview;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const templateInjector = new TemplateInjectorService();
export default templateInjector;
