/**
 * AI Router Types - AI request routing and management
 */

export interface AIRouterConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIRequest {
  prompt: string;
  config?: AIRouterConfig;
}

export interface AIResponse {
  content: string;
  metadata: Record<string, unknown>;
}
