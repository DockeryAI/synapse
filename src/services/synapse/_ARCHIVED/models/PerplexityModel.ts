/**
 * Perplexity (Sonar) Model Implementation
 *
 * Handles Sonar Pro for real-time cultural connections with web search
 *
 * Created: 2025-11-10
 */

import {
  AIModelInterface,
  AIModelResponse,
  ModelConfig
} from '../../../types/breakthrough.types';

export class PerplexityModel implements AIModelInterface {
  private apiKey: string;
  private endpoint: string;

  constructor(apiKey?: string) {
    // Use OpenRouter for unified API access
    this.apiKey = apiKey || import.meta.env.VITE_OPENROUTER_API_KEY || '';
    this.endpoint = 'https://openrouter.ai/api/v1/chat/completions';

    if (!this.apiKey) {
      console.warn('[PerplexityModel] No API key provided');
    }
  }

  async generate(prompt: string, config: ModelConfig): Promise<AIModelResponse> {
    const startTime = Date.now();

    console.log(`[PerplexityModel] Generating with ${config.model}...`);

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
              content: 'You are a cultural intelligence AI with real-time web access. Find authentic connections to current cultural moments. Always respond with valid JSON.'
            },
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
        throw new Error(`Perplexity API error: ${response.status} ${error}`);
      }

      const data = await response.json();
      const generationTime = Date.now() - startTime;

      console.log(`[PerplexityModel] Generated in ${generationTime}ms`);

      return {
        text: data.choices[0].message.content,
        tokensUsed: data.usage?.total_tokens,
        model: config.model,
        finishReason: data.choices[0].finish_reason,
        raw: data
      };
    } catch (error) {
      console.error('[PerplexityModel] Generation failed:', error);
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  getInfo() {
    return {
      provider: 'perplexity',
      models: [
        'sonar-pro',
        'sonar',
        'sonar-medium',
        'sonar-small'
      ],
      rateLimit: 50 // requests per minute
    };
  }

  /**
   * Map model names to OpenRouter format
   */
  private mapModelName(model: string): string {
    const mapping: Record<string, string> = {
      'sonar-pro': 'perplexity/sonar-pro',
      'sonar': 'perplexity/sonar',
      'sonar-medium': 'perplexity/sonar-medium-online',
      'sonar-small': 'perplexity/sonar-small-online'
    };

    return mapping[model] || model;
  }
}
