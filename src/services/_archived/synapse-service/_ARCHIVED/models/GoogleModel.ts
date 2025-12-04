/**
 * Google (Gemini) Model Implementation
 *
 * Handles Gemini Ultra for creative thinking and novel approaches
 *
 * Created: 2025-11-10
 */

import {
  AIModelInterface,
  AIModelResponse,
  ModelConfig
} from '../../../types/breakthrough.types';

export class GoogleModel implements AIModelInterface {
  private apiKey: string;
  private endpoint: string;

  constructor(apiKey?: string) {
    // Use OpenRouter for unified API access
    this.apiKey = apiKey || import.meta.env.VITE_OPENROUTER_API_KEY || '';
    this.endpoint = 'https://openrouter.ai/api/v1/chat/completions';

    if (!this.apiKey) {
      console.warn('[GoogleModel] No API key provided');
    }
  }

  async generate(prompt: string, config: ModelConfig): Promise<AIModelResponse> {
    const startTime = Date.now();

    console.log(`[GoogleModel] Generating with ${config.model}...`);

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
          max_tokens: config.maxTokens || 2000
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Google API error: ${response.status} ${error}`);
      }

      const data = await response.json();
      const generationTime = Date.now() - startTime;

      console.log(`[GoogleModel] Generated in ${generationTime}ms`);

      return {
        text: data.choices[0].message.content,
        tokensUsed: data.usage?.total_tokens,
        model: config.model,
        finishReason: data.choices[0].finish_reason,
        raw: data
      };
    } catch (error) {
      console.error('[GoogleModel] Generation failed:', error);
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  getInfo() {
    return {
      provider: 'google',
      models: [
        'gemini-ultra',
        'gemini-pro',
        'gemini-1.5-pro',
        'gemini-1.5-flash'
      ],
      rateLimit: 60 // requests per minute
    };
  }

  /**
   * Map model names to OpenRouter format
   */
  private mapModelName(model: string): string {
    const mapping: Record<string, string> = {
      'gemini-ultra': 'google/gemini-pro-1.5', // Ultra not yet available, use Pro 1.5
      'gemini-pro': 'google/gemini-pro',
      'gemini-1.5-pro': 'google/gemini-pro-1.5',
      'gemini-1.5-flash': 'google/gemini-flash-1.5'
    };

    return mapping[model] || model;
  }
}
