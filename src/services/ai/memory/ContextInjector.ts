/**
 * Context Injector
 *
 * Injects business context, tone preferences, and learnings into every AI conversation.
 * Formats context for Claude API system message.
 */

import { BusinessContextService } from './BusinessContextService';
import { TonePreferenceService } from './TonePreferenceService';
import { ContentLearningService } from './ContentLearningService';
import type {
  AIContextPayload,
  ContextInjectionResult,
  MemoryRetrievalOptions,
} from '../../../types/ai-memory.types';

export class ContextInjector {
  /**
   * Get full context payload for AI
   */
  static async getContextPayload(
    userId: string,
    options: MemoryRetrievalOptions = {}
  ): Promise<AIContextPayload> {
    const {
      include_business_context = true,
      include_tone_preferences = true,
      include_content_patterns = true,
      include_campaign_preferences = true,
      include_recent_performance = false,
      include_learnings = true,
      max_learnings = 5,
      max_patterns = 10,
    } = options;

    const payload: AIContextPayload = {
      business_context: {
        name: '',
        industry: '',
        type: '',
      },
      tone_preferences: {
        formality: 3,
        humor: 1,
        enthusiasm: 3,
      },
      successful_patterns: {
        topics: [],
        formats: [],
        hooks: [],
        ctas: [],
      },
    };

    // Fetch business context
    if (include_business_context) {
      const businessContext = await BusinessContextService.getContextForAI(userId);
      if (businessContext) {
        payload.business_context = businessContext;
      }
    }

    // Fetch tone preferences
    if (include_tone_preferences) {
      const tonePrefs = await TonePreferenceService.getToneForAI(userId);
      if (tonePrefs) {
        payload.tone_preferences = tonePrefs;
      }
    }

    // Fetch successful content patterns
    if (include_content_patterns) {
      const patterns = await ContentLearningService.getPatternsForAI(userId);
      payload.successful_patterns = patterns;
    }

    // Fetch campaign preferences
    if (include_campaign_preferences) {
      const businessContext = await BusinessContextService.getContext(userId);
      if (businessContext?.campaign_preferences) {
        payload.campaign_preferences = {
          preferred_types: businessContext.campaign_preferences.preferred_campaign_types || [],
          preferred_platforms: businessContext.campaign_preferences.preferred_platforms || [],
          avoid_topics: businessContext.campaign_preferences.avoid_topics,
        };
      }
    }

    // Fetch recent performance (placeholder)
    if (include_recent_performance) {
      // This would fetch from analytics service
      payload.recent_performance = {
        avg_engagement_rate: 0.05, // Placeholder
        best_performing_content_type: 'video',
        best_performing_platform: 'instagram',
      };
    }

    // Fetch learnings
    if (include_learnings) {
      const learnings = await ContentLearningService.getLearningsForAI(userId, max_learnings);
      payload.learnings = learnings;
    }

    return payload;
  }

  /**
   * Format context as Claude API system message
   */
  static formatSystemMessage(payload: AIContextPayload): string {
    const sections: string[] = [];

    // Business Context
    if (payload.business_context.name) {
      sections.push(`# Business Context`);
      sections.push(`You are creating content for ${payload.business_context.name}, a ${payload.business_context.industry} business (${payload.business_context.type}).`);

      if (payload.business_context.location) {
        sections.push(`Location: ${payload.business_context.location}`);
      }

      if (payload.business_context.target_audience) {
        sections.push(`Target Audience: ${payload.business_context.target_audience}`);
      }

      if (payload.business_context.usp) {
        sections.push(`Unique Selling Proposition: ${payload.business_context.usp}`);
      }

      if (payload.business_context.brand_personality) {
        sections.push(`Brand Personality: ${payload.business_context.brand_personality}`);
      }
    }

    // Brand Voice Samples
    if (payload.business_context.voice_samples && payload.business_context.voice_samples.length > 0) {
      sections.push(`\n## Brand Voice Examples`);
      sections.push('Write in a similar style to these examples:');
      payload.business_context.voice_samples.forEach((sample, i) => {
        sections.push(`${i + 1}. "${sample}"`);
      });
    }

    // Tone Preferences
    sections.push(`\n## Tone Preferences`);
    if (payload.tone_preferences.preset) {
      sections.push(`Use a ${payload.tone_preferences.preset} tone.`);
    }
    if (payload.tone_preferences.custom_description) {
      sections.push(`Tone: ${payload.tone_preferences.custom_description}`);
    }

    sections.push(`Formality level: ${payload.tone_preferences.formality}/5 (1=very casual, 5=very formal)`);
    sections.push(`Humor level: ${payload.tone_preferences.humor}/3 (0=serious, 3=very funny)`);
    sections.push(`Enthusiasm level: ${payload.tone_preferences.enthusiasm}/5 (1=reserved, 5=very enthusiastic)`);

    if (payload.tone_preferences.examples && payload.tone_preferences.examples.length > 0) {
      sections.push('\nTone Examples:');
      payload.tone_preferences.examples.forEach((example, i) => {
        sections.push(`${i + 1}. "${example}"`);
      });
    }

    // Successful Content Patterns
    const hasPatterns =
      payload.successful_patterns.topics.length > 0 ||
      payload.successful_patterns.formats.length > 0 ||
      payload.successful_patterns.hooks.length > 0 ||
      payload.successful_patterns.ctas.length > 0;

    if (hasPatterns) {
      sections.push(`\n## What Works for This Business`);
      sections.push('Based on past performance data, incorporate these proven patterns when relevant:');

      if (payload.successful_patterns.topics.length > 0) {
        sections.push(`\n### High-Performing Topics`);
        payload.successful_patterns.topics.forEach((topic) => {
          sections.push(`- ${topic}`);
        });
      }

      if (payload.successful_patterns.formats.length > 0) {
        sections.push(`\n### Best-Performing Formats`);
        payload.successful_patterns.formats.forEach((format) => {
          sections.push(`- ${format}`);
        });
      }

      if (payload.successful_patterns.hooks.length > 0) {
        sections.push(`\n### Effective Hooks`);
        payload.successful_patterns.hooks.forEach((hook) => {
          sections.push(`- ${hook}`);
        });
      }

      if (payload.successful_patterns.ctas.length > 0) {
        sections.push(`\n### Successful CTAs`);
        payload.successful_patterns.ctas.forEach((cta) => {
          sections.push(`- ${cta}`);
        });
      }
    }

    // Campaign Preferences
    if (payload.campaign_preferences) {
      sections.push(`\n## Campaign Preferences`);

      if (payload.campaign_preferences.preferred_types.length > 0) {
        sections.push(`Preferred Campaign Types: ${payload.campaign_preferences.preferred_types.join(', ')}`);
      }

      if (payload.campaign_preferences.preferred_platforms.length > 0) {
        sections.push(`Preferred Platforms: ${payload.campaign_preferences.preferred_platforms.join(', ')}`);
      }

      if (payload.campaign_preferences.avoid_topics && payload.campaign_preferences.avoid_topics.length > 0) {
        sections.push(`Topics to Avoid: ${payload.campaign_preferences.avoid_topics.join(', ')}`);
      }
    }

    // Recent Performance
    if (payload.recent_performance) {
      sections.push(`\n## Recent Performance`);
      sections.push(`Average Engagement Rate: ${(payload.recent_performance.avg_engagement_rate * 100).toFixed(1)}%`);
      sections.push(`Best Content Type: ${payload.recent_performance.best_performing_content_type}`);
      sections.push(`Best Platform: ${payload.recent_performance.best_performing_platform}`);
    }

    // AI Learnings
    if (payload.learnings && payload.learnings.length > 0) {
      sections.push(`\n## Key Insights`);
      payload.learnings.forEach((learning, i) => {
        sections.push(`${i + 1}. ${learning.insight}`);
        if (learning.recommendation) {
          sections.push(`   → Recommendation: ${learning.recommendation}`);
        }
      });
    }

    // Footer
    sections.push(`\n## Instructions`);
    sections.push('Use all the above context to create content that feels authentic to this business.');
    sections.push('Match the tone, incorporate successful patterns, and align with their preferences.');
    sections.push('IMPORTANT: Apply these preferences to ALL content you generate, not just the first response.');

    return sections.join('\n');
  }

  /**
   * Inject context into AI conversation
   * Returns formatted system message ready for Claude API
   */
  static async injectContext(
    userId: string,
    options: MemoryRetrievalOptions = {}
  ): Promise<ContextInjectionResult> {
    const payload = await this.getContextPayload(userId, options);
    const systemMessage = this.formatSystemMessage(payload);

    // Estimate token count (rough approximation: ~4 chars per token)
    const tokensUsed = Math.ceil(systemMessage.length / 4);

    // Identify which components were included
    const componentsIncluded: string[] = [];
    if (payload.business_context.name) componentsIncluded.push('business_context');
    if (payload.tone_preferences) componentsIncluded.push('tone_preferences');
    if (payload.successful_patterns.topics.length > 0) componentsIncluded.push('content_patterns');
    if (payload.campaign_preferences) componentsIncluded.push('campaign_preferences');
    if (payload.recent_performance) componentsIncluded.push('recent_performance');
    if (payload.learnings && payload.learnings.length > 0) componentsIncluded.push('learnings');

    return {
      system_message: systemMessage,
      context_payload: payload,
      tokens_used: tokensUsed,
      components_included: componentsIncluded,
    };
  }

  /**
   * Get lightweight context (minimal tokens)
   * Use when token budget is tight
   */
  static async injectLightweightContext(userId: string): Promise<ContextInjectionResult> {
    return this.injectContext(userId, {
      include_business_context: true,
      include_tone_preferences: true,
      include_content_patterns: false,
      include_campaign_preferences: false,
      include_recent_performance: false,
      include_learnings: false,
    });
  }

  /**
   * Get full context (all components)
   * Use for important content generation
   */
  static async injectFullContext(userId: string): Promise<ContextInjectionResult> {
    return this.injectContext(userId, {
      include_business_context: true,
      include_tone_preferences: true,
      include_content_patterns: true,
      include_campaign_preferences: true,
      include_recent_performance: true,
      include_learnings: true,
      max_learnings: 10,
      max_patterns: 15,
    });
  }

  /**
   * Preview context without making database calls
   * Useful for debugging
   */
  static previewContext(payload: AIContextPayload): string {
    return this.formatSystemMessage(payload);
  }

  /**
   * Estimate token usage without full context retrieval
   */
  static async estimateTokenUsage(userId: string): Promise<number> {
    const summary = await BusinessContextService.getContextSummary(userId);
    const tonePrefs = await TonePreferenceService.getTonePreference(userId);

    // Rough estimates
    let tokens = 0;

    if (summary.hasContext) {
      tokens += 150; // Base business context
      tokens += (summary.voiceSampleCount || 0) * 50; // Voice samples
    }

    if (tonePrefs) {
      tokens += 100; // Tone preferences
      tokens += (tonePrefs.examples?.length || 0) * 30; // Tone examples
    }

    if (summary.hasPreferences) {
      tokens += 50; // Campaign preferences
    }

    return tokens;
  }
}
