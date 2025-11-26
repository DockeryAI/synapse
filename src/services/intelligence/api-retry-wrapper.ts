/**
 * API Retry Wrapper with Exponential Backoff
 *
 * Provides robust error handling, retry logic, and fallback data
 * for all API calls to ensure the system continues working even
 * when Edge Functions or external APIs fail.
 */

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  timeout: number;
  fallbackData?: any;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  timeout: 30000,
};

export class ApiRetryWrapper {
  private static instance: ApiRetryWrapper;
  private failureCache: Map<string, { count: number; lastAttempt: number }> = new Map();
  private successCache: Map<string, { data: any; timestamp: number }> = new Map();
  private CACHE_TTL = 60 * 60 * 1000; // 1 hour
  private FAILURE_COOLDOWN = 5 * 60 * 1000; // 5 minutes

  static getInstance(): ApiRetryWrapper {
    if (!ApiRetryWrapper.instance) {
      ApiRetryWrapper.instance = new ApiRetryWrapper();
    }
    return ApiRetryWrapper.instance;
  }

  /**
   * Execute API call with retry logic and exponential backoff
   */
  async executeWithRetry<T>(
    apiCall: () => Promise<T>,
    cacheKey: string,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    // Check success cache first
    const cached = this.getCached(cacheKey);
    if (cached) {
      console.log(`[ApiRetry] Returning cached data for ${cacheKey}`);
      return cached;
    }

    // Check if this API has been failing repeatedly
    const failureInfo = this.failureCache.get(cacheKey);
    if (failureInfo) {
      const timeSinceLastAttempt = Date.now() - failureInfo.lastAttempt;
      if (timeSinceLastAttempt < this.FAILURE_COOLDOWN && failureInfo.count >= 3) {
        console.log(`[ApiRetry] API ${cacheKey} in cooldown period, returning fallback`);
        if (finalConfig.fallbackData) {
          return finalConfig.fallbackData;
        }
        throw new Error(`API ${cacheKey} temporarily unavailable (in cooldown)`);
      }
    }

    let lastError: Error | null = null;
    let delay = finalConfig.initialDelayMs;

    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        // Add timeout to API call
        const result = await this.withTimeout(apiCall(), finalConfig.timeout);

        // Success - cache the result and clear failure count
        this.setCache(cacheKey, result);
        this.failureCache.delete(cacheKey);

        console.log(`[ApiRetry] Success for ${cacheKey} on attempt ${attempt + 1}`);
        return result;
      } catch (error) {
        lastError = error as Error;
        console.warn(`[ApiRetry] Attempt ${attempt + 1} failed for ${cacheKey}:`, error);

        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          console.error(`[ApiRetry] Non-retryable error for ${cacheKey}:`, error);
          break;
        }

        // Wait before retrying (except on last attempt)
        if (attempt < finalConfig.maxRetries) {
          console.log(`[ApiRetry] Waiting ${delay}ms before retry...`);
          await this.sleep(delay);
          delay = Math.min(delay * finalConfig.backoffMultiplier, finalConfig.maxDelayMs);
        }
      }
    }

    // All retries failed - update failure cache
    const currentFailures = failureInfo?.count || 0;
    this.failureCache.set(cacheKey, {
      count: currentFailures + 1,
      lastAttempt: Date.now(),
    });

    // Return fallback data if available
    if (finalConfig.fallbackData) {
      console.log(`[ApiRetry] Returning fallback data for ${cacheKey}`);
      return finalConfig.fallbackData;
    }

    throw lastError || new Error(`API call failed after ${finalConfig.maxRetries} retries`);
  }

  /**
   * Execute multiple API calls in parallel with individual retry logic
   */
  async executeParallel<T extends Record<string, () => Promise<any>>>(
    apiCalls: T,
    configs?: Partial<Record<keyof T, Partial<RetryConfig>>>
  ): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> | null }> {
    const results = {} as any;

    await Promise.allSettled(
      Object.entries(apiCalls).map(async ([key, apiCall]) => {
        try {
          const config = configs?.[key] || {};
          results[key] = await this.executeWithRetry(
            apiCall as () => Promise<any>,
            key,
            config
          );
        } catch (error) {
          console.error(`[ApiRetry] Failed to execute ${key}:`, error);
          results[key] = configs?.[key]?.fallbackData || null;
        }
      })
    );

    return results;
  }

  /**
   * Add timeout to a promise
   */
  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
      ),
    ]);
  }

  /**
   * Check if error should not be retried
   */
  private isNonRetryableError(error: any): boolean {
    if (!error) return false;

    // Don't retry on client errors (4xx)
    if (error.status >= 400 && error.status < 500) {
      return true;
    }

    // Don't retry on specific error messages
    const message = error.message?.toLowerCase() || '';
    const nonRetryableMessages = [
      'api key',
      'unauthorized',
      'forbidden',
      'invalid request',
      'bad request',
    ];

    return nonRetryableMessages.some(msg => message.includes(msg));
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get cached data if still valid
   */
  private getCached(key: string): any | null {
    const cached = this.successCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    this.successCache.delete(key);
    return null;
  }

  /**
   * Cache successful result
   */
  private setCache(key: string, data: any): void {
    this.successCache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.successCache.clear();
    this.failureCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { successCount: number; failureCount: number } {
    return {
      successCount: this.successCache.size,
      failureCount: this.failureCache.size,
    };
  }
}

// Export singleton instance
export const apiRetryWrapper = ApiRetryWrapper.getInstance();