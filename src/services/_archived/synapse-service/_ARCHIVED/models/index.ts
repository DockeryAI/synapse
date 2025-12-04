/**
 * AI Model Implementations
 *
 * Export all model implementations
 *
 * Created: 2025-11-10
 */

export { AnthropicModel } from './AnthropicModel';
export { OpenAIModel } from './OpenAIModel';
export { GoogleModel } from './GoogleModel';
export { PerplexityModel } from './PerplexityModel';

import { AnthropicModel } from './AnthropicModel';
import { OpenAIModel } from './OpenAIModel';
import { GoogleModel } from './GoogleModel';
import { PerplexityModel } from './PerplexityModel';
import { AIModelInterface, ThinkingStyle } from '../../../types/breakthrough.types';

/**
 * Factory to create appropriate model for thinking style
 */
export function createModelForThinkingStyle(
  thinkingStyle: ThinkingStyle,
  apiKey?: string
): AIModelInterface {
  switch (thinkingStyle) {
    case 'lateral':
      return new AnthropicModel(apiKey);
    case 'analytical':
      return new OpenAIModel(apiKey);
    case 'creative':
      // Using OpenAI instead of Google (not yet integrated)
      return new OpenAIModel(apiKey);
    case 'cultural':
      // Using Anthropic instead of Perplexity (removed from API)
      return new AnthropicModel(apiKey);
    default:
      throw new Error(`Unknown thinking style: ${thinkingStyle}`);
  }
}
