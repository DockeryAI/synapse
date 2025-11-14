/**
 * OpenAI (GPT) Model Implementation
 *
 * Handles GPT-4 Turbo for analytical thinking and deep pattern analysis
 *
 * Created: 2025-11-10
 */

import {
  AIModelInterface,
  AIModelResponse,
  ModelConfig
} from '../../../types/breakthrough.types';

export class OpenAIModel implements AIModelInterface {
  private apiKey: string;
  private endpoint: string;

  constructor(apiKey?: string) {
    // Use OpenRouter for unified API access
    this.apiKey = apiKey || import.meta.env.VITE_OPENROUTER_API_KEY || '';
    this.endpoint = 'https://openrouter.ai/api/v1/chat/completions';

    if (!this.apiKey) {
      console.warn('[OpenAIModel] No API key provided');
    }
  }

  async generate(prompt: string, config: ModelConfig): Promise<AIModelResponse> {
    const startTime = Date.now();

    console.log(`[OpenAIModel] Generating with ${config.model}...`);

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
              role: 'system',
              content: 'You are an analytical AI that finds deep patterns and hidden insights. Always respond with valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: config.temperature,
          max_tokens: config.maxTokens || 2000,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} ${error}`);
      }

      const data = await response.json();
      const generationTime = Date.now() - startTime;

      console.log(`[OpenAIModel] Generated in ${generationTime}ms`);

      return {
        text: data.choices[0].message.content,
        tokensUsed: data.usage?.total_tokens,
        model: config.model,
        finishReason: data.choices[0].finish_reason,
        raw: data
      };
    } catch (error) {
      console.error('[OpenAIModel] Generation failed:', error);
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  getInfo() {
    return {
      provider: 'openai',
      models: [
        'gpt-4-turbo',
        'gpt-4',
        'gpt-4-32k',
        'gpt-3.5-turbo'
      ],
      rateLimit: 60 // requests per minute
    };
  }

  /**
   * Map model names to OpenRouter format
   */
  private mapModelName(model: string): string {
    const mapping: Record<string, string> = {
      'gpt-4-turbo': 'openai/gpt-4-turbo',
      'gpt-4': 'openai/gpt-4',
      'gpt-4-32k': 'openai/gpt-4-32k',
      'gpt-3.5-turbo': 'openai/gpt-3.5-turbo'
    };

    return mapping[model] || model;
  }
}
