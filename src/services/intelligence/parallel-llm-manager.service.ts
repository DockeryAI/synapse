/**
 * Parallel LLM Manager Service
 *
 * Manages parallel LLM execution across 4 OpenRouter API keys.
 * Enables 4x speed improvement for batch operations without quality loss.
 *
 * Key Features:
 * - Round-robin key selection with load balancing
 * - Parallel execution with configurable concurrency (up to 16 total)
 * - Automatic retry with exponential backoff
 * - Key failover when budget exhausted or errors
 * - Rate limiting per key
 */

import {
  OPENROUTER_KEYS,
  OPENROUTER_CONFIG,
  getActiveKeys,
  getKeyByIndex,
  type OpenRouterKeyConfig
} from '@/config/openrouter-keys.config';

// ============================================================================
// Types
// ============================================================================

export interface LLMRequest {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
}

export interface LLMResponse<T = string> {
  success: boolean;
  data?: T;
  error?: string;
  keyId: string;
  latencyMs: number;
  tokensUsed?: number;
}

export interface BatchResult<T> {
  results: LLMResponse<T>[];
  totalLatencyMs: number;
  successCount: number;
  failureCount: number;
  keysUsed: string[];
}

interface KeyState {
  keyId: string;
  inFlight: number;
  lastUsed: number;
  consecutiveErrors: number;
  isAvailable: boolean;
}

// ============================================================================
// Parallel LLM Manager
// ============================================================================

class ParallelLLMManager {
  private keyStates: Map<string, KeyState> = new Map();
  private requestQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;
  private currentKeyIndex = 0;

  constructor() {
    this.initializeKeyStates();
  }

  /**
   * Initialize tracking state for each API key
   */
  private initializeKeyStates(): void {
    OPENROUTER_KEYS.forEach(key => {
      this.keyStates.set(key.id, {
        keyId: key.id,
        inFlight: 0,
        lastUsed: 0,
        consecutiveErrors: 0,
        isAvailable: key.status === 'active',
      });
    });
  }

  /**
   * Execute a single LLM request
   */
  async execute<T = string>(request: LLMRequest): Promise<LLMResponse<T>> {
    const key = this.selectNextKey();
    if (!key) {
      return {
        success: false,
        error: 'No available API keys',
        keyId: 'none',
        latencyMs: 0,
      };
    }

    return this.executeWithKey<T>(request, key);
  }

  /**
   * Execute multiple LLM requests in parallel across all 4 keys
   * This is the primary method for batch operations
   */
  async executeParallel<T = string>(
    requests: LLMRequest[],
    options: {
      maxConcurrent?: number;
      onProgress?: (completed: number, total: number) => void;
    } = {}
  ): Promise<BatchResult<T>> {
    const startTime = Date.now();
    const maxConcurrent = options.maxConcurrent || OPENROUTER_CONFIG.totalMaxConcurrent;

    console.log(`[ParallelLLM] Starting parallel execution of ${requests.length} requests (max concurrent: ${maxConcurrent})`);

    const results: LLMResponse<T>[] = [];
    const keysUsed = new Set<string>();
    let completed = 0;

    // Process in chunks based on max concurrency
    const chunks = this.chunkArray(requests, maxConcurrent);

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (request, idx) => {
        // Round-robin across keys for this chunk
        const keyIndex = idx % getActiveKeys().length;
        const key = getActiveKeys()[keyIndex];

        if (!key) {
          return {
            success: false,
            error: 'No available keys',
            keyId: 'none',
            latencyMs: 0,
          } as LLMResponse<T>;
        }

        keysUsed.add(key.id);
        const result = await this.executeWithKey<T>(request, key);

        completed++;
        options.onProgress?.(completed, requests.length);

        return result;
      });

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }

    const totalLatencyMs = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    console.log(`[ParallelLLM] ✅ Completed ${requests.length} requests in ${(totalLatencyMs / 1000).toFixed(1)}s (${successCount} success, ${failureCount} failed)`);

    return {
      results,
      totalLatencyMs,
      successCount,
      failureCount,
      keysUsed: Array.from(keysUsed),
    };
  }

  /**
   * Execute a batch of requests with a single key
   * Useful when you want to use one key for related requests
   */
  async executeBatch<T = string>(
    requests: LLMRequest[],
    keyId?: string
  ): Promise<BatchResult<T>> {
    const startTime = Date.now();
    const key = keyId
      ? OPENROUTER_KEYS.find(k => k.id === keyId)
      : this.selectNextKey();

    if (!key) {
      return {
        results: requests.map(() => ({
          success: false,
          error: 'No available keys',
          keyId: 'none',
          latencyMs: 0,
        })),
        totalLatencyMs: 0,
        successCount: 0,
        failureCount: requests.length,
        keysUsed: [],
      };
    }

    console.log(`[ParallelLLM] Executing batch of ${requests.length} with key ${key.id}`);

    // Execute with limited concurrency per key
    const results: LLMResponse<T>[] = [];
    const chunks = this.chunkArray(requests, OPENROUTER_CONFIG.maxConcurrentPerKey);

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(request => this.executeWithKey<T>(request, key))
      );
      results.push(...chunkResults);
    }

    return {
      results,
      totalLatencyMs: Date.now() - startTime,
      successCount: results.filter(r => r.success).length,
      failureCount: results.filter(r => !r.success).length,
      keysUsed: [key.id],
    };
  }

  /**
   * Execute request with specific key, handling retries
   */
  private async executeWithKey<T>(
    request: LLMRequest,
    key: OpenRouterKeyConfig
  ): Promise<LLMResponse<T>> {
    const startTime = Date.now();
    const state = this.keyStates.get(key.id)!;

    // Update state
    state.inFlight++;
    state.lastUsed = Date.now();

    let lastError: string | undefined;

    for (let attempt = 1; attempt <= OPENROUTER_CONFIG.retryAttempts; attempt++) {
      try {
        const response = await this.callOpenRouter<T>(request, key);

        // Success - reset error count
        state.consecutiveErrors = 0;
        state.inFlight--;

        return {
          success: true,
          data: response.data,
          keyId: key.id,
          latencyMs: Date.now() - startTime,
          tokensUsed: response.tokensUsed,
        };
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        console.warn(`[ParallelLLM] Key ${key.id} attempt ${attempt} failed: ${lastError}`);

        // Check for budget exhaustion
        if (lastError.includes('budget') || lastError.includes('402')) {
          state.isAvailable = false;
          break;
        }

        // Exponential backoff
        if (attempt < OPENROUTER_CONFIG.retryAttempts) {
          const backoffMs = OPENROUTER_CONFIG.initialBackoffMs *
            Math.pow(OPENROUTER_CONFIG.backoffMultiplier, attempt - 1);
          await this.sleep(backoffMs);
        }
      }
    }

    // All retries failed
    state.consecutiveErrors++;
    state.inFlight--;

    // Disable key after too many consecutive errors
    if (state.consecutiveErrors >= 5) {
      console.error(`[ParallelLLM] Key ${key.id} disabled after ${state.consecutiveErrors} consecutive errors`);
      state.isAvailable = false;
    }

    return {
      success: false,
      error: lastError,
      keyId: key.id,
      latencyMs: Date.now() - startTime,
    };
  }

  /**
   * Make the actual API call to OpenRouter
   */
  private async callOpenRouter<T>(
    request: LLMRequest,
    key: OpenRouterKeyConfig
  ): Promise<{ data: T; tokensUsed: number }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), OPENROUTER_CONFIG.timeoutMs);

    try {
      const messages = [];

      if (request.systemPrompt) {
        messages.push({ role: 'system', content: request.systemPrompt });
      }
      messages.push({ role: 'user', content: request.prompt });

      const response = await fetch(`${OPENROUTER_CONFIG.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key.key}`,
          ...OPENROUTER_CONFIG.headers,
        },
        body: JSON.stringify({
          model: OPENROUTER_CONFIG.model,
          messages,
          temperature: request.temperature ?? OPENROUTER_CONFIG.defaultTemperature,
          max_tokens: request.maxTokens ?? OPENROUTER_CONFIG.defaultMaxTokens,
          ...(request.responseFormat === 'json' && {
            response_format: { type: 'json_object' }
          }),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      const tokensUsed = data.usage?.total_tokens || 0;

      // Parse JSON if requested
      if (request.responseFormat === 'json') {
        try {
          return { data: JSON.parse(content) as T, tokensUsed };
        } catch {
          throw new Error('Failed to parse JSON response');
        }
      }

      return { data: content as T, tokensUsed };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Select next available key using round-robin with load balancing
   */
  private selectNextKey(): OpenRouterKeyConfig | null {
    const activeKeys = getActiveKeys();
    if (activeKeys.length === 0) return null;

    // Find key with lowest in-flight requests
    let bestKey: OpenRouterKeyConfig | null = null;
    let lowestInFlight = Infinity;

    for (let i = 0; i < activeKeys.length; i++) {
      const idx = (this.currentKeyIndex + i) % activeKeys.length;
      const key = activeKeys[idx];
      const state = this.keyStates.get(key.id);

      if (state?.isAvailable && state.inFlight < OPENROUTER_CONFIG.maxConcurrentPerKey) {
        if (state.inFlight < lowestInFlight) {
          lowestInFlight = state.inFlight;
          bestKey = key;
        }
      }
    }

    if (bestKey) {
      this.currentKeyIndex = (activeKeys.indexOf(bestKey) + 1) % activeKeys.length;
    }

    return bestKey;
  }

  /**
   * Get current status of all keys
   */
  getKeyStatus(): Array<{
    keyId: string;
    isAvailable: boolean;
    inFlight: number;
    consecutiveErrors: number;
  }> {
    return Array.from(this.keyStates.values()).map(state => ({
      keyId: state.keyId,
      isAvailable: state.isAvailable,
      inFlight: state.inFlight,
      consecutiveErrors: state.consecutiveErrors,
    }));
  }

  /**
   * Reset a disabled key (e.g., after adding budget)
   */
  resetKey(keyId: string): void {
    const state = this.keyStates.get(keyId);
    if (state) {
      state.isAvailable = true;
      state.consecutiveErrors = 0;
      console.log(`[ParallelLLM] Key ${keyId} has been reset`);
    }
  }

  /**
   * Helper to chunk array for batch processing
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Helper for exponential backoff delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const parallelLLMManager = new ParallelLLMManager();

// Export class for testing
export { ParallelLLMManager };
