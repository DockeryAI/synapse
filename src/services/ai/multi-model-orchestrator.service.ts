/**
 * Multi-Model AI Orchestrator
 *
 * Coordinates a 3-tier AI system for maximum quality and cost-efficiency:
 * - Haiku (Fast): Extract raw data points
 * - Sonnet (Balanced): Analyze and structure
 * - Opus (Premium): Synthesize and validate
 *
 * Created: 2025-11-18
 */

import { supabase } from '@/lib/supabase';

// Model definitions
export const AI_MODELS = {
  HAIKU: 'anthropic/claude-3.5-haiku',
  SONNET: 'anthropic/claude-3.5-sonnet',
  OPUS: 'anthropic/claude-opus-4'
} as const;

export type AIModel = typeof AI_MODELS[keyof typeof AI_MODELS];

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIRequest {
  model: AIModel;
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  structuredOutput?: boolean; // Request JSON output
}

export interface AIResponse<T = string> {
  content: T;
  model: AIModel;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCost: number; // in USD
  };
  latency: number; // in milliseconds
  success: boolean;
  error?: string;
}

export interface ExtractionResult {
  dataPoints: string[];
  sources: string[];
  raw: any;
}

export interface AnalysisResult {
  structured: any;
  patterns: string[];
  confidence: number;
  reasoning: string;
}

export interface SynthesisResult {
  final: any;
  validation: {
    passed: boolean;
    issues: string[];
    confidence: number;
  };
}

/**
 * Multi-Model Orchestration Service
 */
class MultiModelOrchestrator {
  private aiProxyUrl: string;

  constructor() {
    // Use Supabase edge function for AI proxy
    this.aiProxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`;
  }

  /**
   * Call AI model via proxy
   */
  private async callAI<T = string>(request: AIRequest): Promise<AIResponse<T>> {
    const startTime = Date.now();

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(this.aiProxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({
          provider: 'openrouter',
          model: request.model,
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI proxy error: ${response.statusText}`);
      }

      const data = await response.json();

      // Extract content from OpenRouter response format
      const content = request.structuredOutput
        ? this.parseJSON<T>(data.choices[0].message.content)
        : data.choices[0].message.content as T;

      const latency = Date.now() - startTime;

      return {
        content,
        model: request.model,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
          estimatedCost: this.calculateCost(
            request.model,
            data.usage?.prompt_tokens || 0,
            data.usage?.completion_tokens || 0
          ),
        },
        latency,
        success: true,
      };
    } catch (error) {
      console.error('[AI Orchestrator] Error calling AI:', error);

      return {
        content: '' as T,
        model: request.model,
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          estimatedCost: 0,
        },
        latency: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Parse JSON with error handling
   */
  private parseJSON<T>(text: string): T {
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : text;
      return JSON.parse(jsonText.trim());
    } catch (error) {
      console.error('[AI Orchestrator] JSON parse error:', error);
      console.error('[AI Orchestrator] Failed text:', text);
      throw new Error('Failed to parse AI response as JSON');
    }
  }

  /**
   * Calculate estimated cost based on model and token usage
   */
  private calculateCost(model: AIModel, promptTokens: number, completionTokens: number): number {
    // Pricing per million tokens (approximate, as of 2025)
    const pricing: Record<AIModel, { input: number; output: number }> = {
      [AI_MODELS.HAIKU]: { input: 0.80, output: 4.00 }, // $0.80 / $4.00 per million
      [AI_MODELS.SONNET]: { input: 3.00, output: 15.00 }, // $3 / $15 per million
      [AI_MODELS.OPUS]: { input: 15.00, output: 75.00 }, // $15 / $75 per million
    };

    const rates = pricing[model];
    const inputCost = (promptTokens / 1_000_000) * rates.input;
    const outputCost = (completionTokens / 1_000_000) * rates.output;

    return inputCost + outputCost;
  }

  /**
   * TIER 1: Extract - Use Haiku for fast data extraction
   */
  async extract(prompt: string, context?: string): Promise<AIResponse<ExtractionResult>> {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are a data extraction specialist. Extract structured data points from the provided context.
Output JSON format:
{
  "dataPoints": ["array", "of", "extracted", "facts"],
  "sources": ["array", "of", "source", "identifiers"],
  "raw": { any other relevant data }
}`,
      },
      {
        role: 'user',
        content: context ? `Context:\n${context}\n\n${prompt}` : prompt,
      },
    ];

    return this.callAI<ExtractionResult>({
      model: AI_MODELS.HAIKU,
      messages,
      temperature: 0.3, // Low temperature for factual extraction
      maxTokens: 2000,
      structuredOutput: true,
    });
  }

  /**
   * TIER 2: Analyze - Use Sonnet for structured analysis
   */
  async analyze(extractedData: ExtractionResult, prompt: string): Promise<AIResponse<AnalysisResult>> {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are an analytical AI that identifies patterns and structures data.
Output JSON format:
{
  "structured": { structured data object },
  "patterns": ["array", "of", "identified", "patterns"],
  "confidence": 0-100,
  "reasoning": "explanation of analysis"
}`,
      },
      {
        role: 'user',
        content: `Extracted Data:\n${JSON.stringify(extractedData, null, 2)}\n\n${prompt}`,
      },
    ];

    return this.callAI<AnalysisResult>({
      model: AI_MODELS.SONNET,
      messages,
      temperature: 0.5, // Medium temperature for balanced analysis
      maxTokens: 3000,
      structuredOutput: true,
    });
  }

  /**
   * TIER 3: Synthesize - Use Opus for high-quality synthesis and validation
   */
  async synthesize(analysisResult: AnalysisResult, prompt: string): Promise<AIResponse<SynthesisResult>> {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are a synthesis expert who creates coherent, high-quality outputs from analyzed data.
Validate the analysis and produce a final, polished result.
Output JSON format:
{
  "final": { final synthesized output },
  "validation": {
    "passed": boolean,
    "issues": ["array", "of", "validation", "issues"],
    "confidence": 0-100
  }
}`,
      },
      {
        role: 'user',
        content: `Analysis:\n${JSON.stringify(analysisResult, null, 2)}\n\n${prompt}`,
      },
    ];

    return this.callAI<SynthesisResult>({
      model: AI_MODELS.OPUS,
      messages,
      temperature: 0.7, // Higher temperature for creative synthesis
      maxTokens: 4000,
      structuredOutput: true,
    });
  }

  /**
   * Full Pipeline: Extract → Analyze → Synthesize
   */
  async runFullPipeline<T>(
    extractPrompt: string,
    analyzePrompt: string,
    synthesizePrompt: string,
    context?: string
  ): Promise<{
    result: T | null;
    stages: {
      extract: AIResponse<ExtractionResult>;
      analyze: AIResponse<AnalysisResult>;
      synthesize: AIResponse<SynthesisResult>;
    };
    totalCost: number;
    totalLatency: number;
  }> {
    console.log('[AI Orchestrator] Starting full pipeline...');

    // Stage 1: Extract
    console.log('[AI Orchestrator] Stage 1: Extracting with Haiku...');
    const extractResponse = await this.extract(extractPrompt, context);
    if (!extractResponse.success) {
      throw new Error(`Extraction failed: ${extractResponse.error}`);
    }

    // Stage 2: Analyze
    console.log('[AI Orchestrator] Stage 2: Analyzing with Sonnet...');
    const analyzeResponse = await this.analyze(extractResponse.content, analyzePrompt);
    if (!analyzeResponse.success) {
      throw new Error(`Analysis failed: ${analyzeResponse.error}`);
    }

    // Stage 3: Synthesize
    console.log('[AI Orchestrator] Stage 3: Synthesizing with Opus...');
    const synthesizeResponse = await this.synthesize(analyzeResponse.content, synthesizePrompt);
    if (!synthesizeResponse.success) {
      throw new Error(`Synthesis failed: ${synthesizeResponse.error}`);
    }

    const totalCost =
      extractResponse.usage.estimatedCost +
      analyzeResponse.usage.estimatedCost +
      synthesizeResponse.usage.estimatedCost;

    const totalLatency =
      extractResponse.latency + analyzeResponse.latency + synthesizeResponse.latency;

    console.log('[AI Orchestrator] Pipeline complete!');
    console.log(`Total cost: $${totalCost.toFixed(4)}`);
    console.log(`Total latency: ${totalLatency}ms`);

    return {
      result: synthesizeResponse.content.final as T,
      stages: {
        extract: extractResponse,
        analyze: analyzeResponse,
        synthesize: synthesizeResponse,
      },
      totalCost,
      totalLatency,
    };
  }

  /**
   * Retry with fallback model on failure
   */
  async callWithRetry<T = string>(
    request: AIRequest,
    retries: number = 2,
    fallbackModel?: AIModel
  ): Promise<AIResponse<T>> {
    let lastError: string | undefined;

    for (let i = 0; i < retries; i++) {
      const response = await this.callAI<T>(request);

      if (response.success) {
        return response;
      }

      lastError = response.error;
      console.warn(`[AI Orchestrator] Retry ${i + 1}/${retries} failed:`, lastError);

      // Wait before retry (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
    }

    // Final attempt with fallback model if provided
    if (fallbackModel && fallbackModel !== request.model) {
      console.warn(`[AI Orchestrator] Falling back to ${fallbackModel}`);
      return this.callAI<T>({ ...request, model: fallbackModel });
    }

    // All retries failed
    return {
      content: '' as T,
      model: request.model,
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCost: 0 },
      latency: 0,
      success: false,
      error: lastError || 'Max retries exceeded',
    };
  }
}

// Export singleton instance
export const aiOrchestrator = new MultiModelOrchestrator();
