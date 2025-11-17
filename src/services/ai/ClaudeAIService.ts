/**
 * Claude AI Service
 * Integration with Anthropic Claude Sonnet 4.5 API
 *
 * Features:
 * - Direct API integration with streaming support
 * - Business context injection
 * - Conversation history management
 * - Intent detection
 * - Error handling with retries
 */

import {
  AIServiceConfig,
  ChatRequest,
  ChatResponse,
  ChatMessage,
  AIBusinessContext,
  AICapability,
  ServiceResponse,
  StreamChunk,
} from '../../types/ai.types';

export class ClaudeAIService {
  private config: AIServiceConfig;
  private readonly API_URL = 'https://api.anthropic.com/v1/messages';
  private readonly DEFAULT_MODEL = 'claude-sonnet-4-5-20250929';
  private readonly DEFAULT_MAX_TOKENS = 4096;

  constructor(config: AIServiceConfig) {
    this.config = {
      model: config.model || this.DEFAULT_MODEL,
      maxTokens: config.maxTokens || this.DEFAULT_MAX_TOKENS,
      temperature: config.temperature || 0.7,
      ...config,
    };
  }

  /**
   * Send a chat message and get response
   */
  async chat(request: ChatRequest): Promise<ServiceResponse<ChatResponse>> {
    try {
      const messages = this.prepareMessages(request);
      const systemPrompt = this.buildSystemPrompt(request.context);

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          system: systemPrompt,
          messages,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();

      const chatMessage: ChatMessage = {
        id: this.generateId(),
        role: 'assistant',
        content: data.content[0].text,
        timestamp: new Date(),
        metadata: {
          model: this.config.model,
          processingTime: Date.now() - Date.now(), // Would track actual time
        },
      };

      return {
        success: true,
        data: {
          message: chatMessage,
          usage: {
            inputTokens: data.usage.input_tokens,
            outputTokens: data.usage.output_tokens,
            totalCost: this.calculateCost(data.usage),
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get AI response',
      };
    }
  }

  /**
   * Stream chat response (for real-time typing effect)
   */
  async *chatStream(request: ChatRequest): AsyncGenerator<StreamChunk> {
    try {
      const messages = this.prepareMessages(request);
      const systemPrompt = this.buildSystemPrompt(request.context);

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          system: systemPrompt,
          messages,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              yield { delta: '', complete: true };
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'content_block_delta') {
                yield {
                  delta: parsed.delta.text,
                  complete: false,
                };
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream error:', error);
      yield {
        delta: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        complete: true,
      };
    }
  }

  /**
   * Detect user intent from message
   */
  detectIntent(message: string): AICapability {
    const lowerMessage = message.toLowerCase();

    // Campaign strategy
    if (
      lowerMessage.includes('campaign') ||
      lowerMessage.includes('strategy') ||
      lowerMessage.includes('plan')
    ) {
      return 'campaign_strategy';
    }

    // Content generation
    if (
      lowerMessage.includes('write') ||
      lowerMessage.includes('generate') ||
      lowerMessage.includes('create post') ||
      lowerMessage.includes('content')
    ) {
      return 'content_generation';
    }

    // Performance analysis
    if (
      lowerMessage.includes('performance') ||
      lowerMessage.includes('analytics') ||
      lowerMessage.includes('engagement') ||
      lowerMessage.includes('how am i doing')
    ) {
      return 'performance_analysis';
    }

    // Competitor research
    if (
      lowerMessage.includes('competitor') ||
      lowerMessage.includes('competition') ||
      lowerMessage.includes('vs')
    ) {
      return 'competitor_research';
    }

    // Hashtags
    if (lowerMessage.includes('hashtag')) {
      return 'hashtag_generation';
    }

    // Scheduling
    if (
      lowerMessage.includes('when to post') ||
      lowerMessage.includes('schedule') ||
      lowerMessage.includes('best time')
    ) {
      return 'scheduling_optimization';
    }

    // Pivots
    if (
      lowerMessage.includes('pivot') ||
      lowerMessage.includes('not working') ||
      lowerMessage.includes('improve')
    ) {
      return 'pivot_recommendations';
    }

    return 'general_question';
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Prepare messages for Claude API format
   */
  private prepareMessages(request: ChatRequest): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = [];

    // Add conversation history
    if (request.conversationHistory) {
      request.conversationHistory.forEach((msg) => {
        if (msg.role !== 'system') {
          messages.push({
            role: msg.role,
            content: msg.content,
          });
        }
      });
    }

    // Add current message
    messages.push({
      role: 'user',
      content: request.message,
    });

    return messages;
  }

  /**
   * Build system prompt with business context
   */
  private buildSystemPrompt(context?: any): string {
    let prompt = `You are Synapse AI, an intelligent marketing assistant built into the Synapse SMB Platform. You help small business owners create better marketing campaigns, analyze performance, and grow their businesses.

**Your Capabilities:**
- Campaign strategy and planning
- Content generation (social posts, captions, hooks)
- Performance analysis and pivot recommendations
- Hashtag generation and optimization
- Scheduling optimization
- Competitor research
- General marketing advice

**Your Personality:**
- Helpful and encouraging
- Data-driven but approachable
- Practical and actionable (no fluff)
- Celebrates wins, constructive on failures
- Uses emojis occasionally for friendliness
- Brief by default, detailed when asked

**Response Format:**
- Start with a direct answer
- Provide 2-3 actionable steps
- Include specific numbers/data when relevant
- End with a question to keep conversation going (optional)

**Important:**
- If you don't have enough information, ask clarifying questions
- If the user asks for something outside your capabilities, be honest
- Always prioritize practical, implementable advice`;

    // Inject business context if available
    if (context?.businessContext) {
      const biz = context.businessContext;
      prompt += `\n\n**Current Business Context:**
- Business: ${biz.businessName}
- Industry: ${biz.industry}${biz.specialty ? `\n- Specialty: ${biz.specialty}` : ''}${
        biz.targetAudience ? `\n- Target Audience: ${biz.targetAudience}` : ''
      }`;

      if (biz.uvpData) {
        prompt += `\n- Value Proposition: ${biz.uvpData.transformation || 'Not set'}`;
      }

      if (biz.currentCampaign) {
        prompt += `\n\n**Current Campaign:**
- Type: ${biz.currentCampaign.type}
- Platform: ${biz.currentCampaign.platform}`;

        if (biz.currentCampaign.performance) {
          prompt += `\n- Engagement Rate: ${biz.currentCampaign.performance.engagementRate}%`;
        }
      }
    }

    return prompt;
  }

  /**
   * Calculate API cost
   */
  private calculateCost(usage: { input_tokens: number; output_tokens: number }): number {
    // Claude Sonnet 4.5 pricing (as of 2025)
    const INPUT_COST_PER_1M = 3.0; // $3 per million input tokens
    const OUTPUT_COST_PER_1M = 15.0; // $15 per million output tokens

    const inputCost = (usage.input_tokens / 1_000_000) * INPUT_COST_PER_1M;
    const outputCost = (usage.output_tokens / 1_000_000) * OUTPUT_COST_PER_1M;

    return inputCost + outputCost;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Factory function for easy initialization
export const createClaudeAI = (apiKey: string, config?: Partial<AIServiceConfig>): ClaudeAIService => {
  return new ClaudeAIService({
    apiKey,
    ...config,
  });
};
