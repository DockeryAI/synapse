/**
 * Anthropic (Claude) Model Implementation
 *
 * Handles Claude Opus 4 for lateral thinking and unexpected connections
 *
 * Created: 2025-11-10
 */

import {
  AIModelInterface,
  AIModelResponse,
  ModelConfig
} from '../../../types/breakthrough.types';

export class AnthropicModel implements AIModelInterface {
  private apiKey: string;
  private endpoint: string;

  constructor(apiKey?: string) {
    // Use OpenRouter for unified API access
    this.apiKey = apiKey || import.meta.env.VITE_OPENROUTER_API_KEY || '';
    this.endpoint = 'https://openrouter.ai/api/v1/chat/completions';

    if (!this.apiKey) {
      console.warn('[AnthropicModel] No API key provided');
    }
  }

  async generate(prompt: string, config: ModelConfig): Promise<AIModelResponse> {
    const startTime = Date.now();

    console.log(`[AnthropicModel] Generating with ${config.model}...`);

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'MARBA Breakthrough Orchestra'
        },
        body: JSON.stringify({
          model: this.mapModelName(config.model),
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: config.temperature,
          max_tokens: config.maxTokens || 2000,
          response_format: { type: 'json_object' } // Request JSON output
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Anthropic API error: ${response.status} ${error}`);
      }

      const data = await response.json();
      const generationTime = Date.now() - startTime;

      console.log(`[AnthropicModel] Generated in ${generationTime}ms`);

      return {
        text: data.choices[0].message.content,
        tokensUsed: data.usage?.total_tokens,
        model: config.model,
        finishReason: data.choices[0].finish_reason,
        raw: data
      };
    } catch (error) {
      console.error('[AnthropicModel] Generation failed:', error);
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  getInfo() {
    return {
      provider: 'anthropic',
      models: [
        'claude-opus-4',
        'claude-sonnet-4',
        'claude-3-opus',
        'claude-3-sonnet'
      ],
      rateLimit: 50 // requests per minute
    };
  }

  /**
   * Map model names to OpenRouter format
   */
  private mapModelName(model: string): string {
    const mapping: Record<string, string> = {
      'claude-opus-4': 'anthropic/claude-opus-4',
      'claude-sonnet-4': 'anthropic/claude-sonnet-4',
      'claude-3-opus': 'anthropic/claude-3-opus',
      'claude-3-sonnet': 'anthropic/claude-3-sonnet'
    };

    return mapping[model] || model;
  }
}
