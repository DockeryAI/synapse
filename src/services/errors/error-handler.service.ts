/**
 * Error Handler Service
 *
 * Centralized error handling with exponential backoff retry logic,
 * fallback strategies, and user-friendly error messages.
 *
 * Features:
 * - Exponential backoff retry with configurable attempts
 * - Error categorization (retryable vs fatal)
 * - Fallback strategies (cache, degraded mode)
 * - User-friendly error messages
 * - Progress callbacks for retry UI
 *
 * Created: Nov 17, 2025 - Week 2 Workstream C
 */

// ============================================================================
// TYPES
// ============================================================================

export type ErrorCategory =
  | 'network'
  | 'api_limit'
  | 'authentication'
  | 'validation'
  | 'timeout'
  | 'server_error'
  | 'unknown';

export type ErrorSeverity = 'fatal' | 'retryable' | 'warning';

export interface AppError {
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  originalError: Error;
  retryable: boolean;
  timestamp: Date;
  context?: Record<string, any>;
}

export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableCategories: ErrorCategory[];
}

export interface RetryProgress {
  attempt: number;
  maxAttempts: number;
  nextRetryIn?: number; // milliseconds
  error?: AppError;
}

export interface FallbackStrategy<T> {
  name: string;
  execute: () => Promise<T>;
  description: string;
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableCategories: ['network', 'api_limit', 'timeout', 'server_error'],
};

// ============================================================================
// ERROR HANDLER SERVICE
// ============================================================================

export class ErrorHandlerService {
  /**
   * Execute an async operation with retry logic
   */
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    onProgress?: (progress: RetryProgress) => void,
    fallbackStrategies: FallbackStrategy<T>[] = []
  ): Promise<T> {
    const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    let lastError: AppError | null = null;

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        // Notify progress
        if (onProgress) {
          onProgress({
            attempt,
            maxAttempts: retryConfig.maxAttempts,
            error: lastError || undefined,
          });
        }

        // Execute the operation
        const result = await operation();
        return result;
      } catch (error) {
        // Categorize the error
        const appError = this.categorizeError(error);
        lastError = appError;

        console.error(`[ErrorHandler] Attempt ${attempt}/${retryConfig.maxAttempts} failed:`, {
          category: appError.category,
          message: appError.message,
          retryable: appError.retryable,
        });

        // Check if error is retryable
        if (!this.isRetryable(appError, retryConfig)) {
          console.error('[ErrorHandler] Non-retryable error encountered:', appError);
          break; // Exit retry loop
        }

        // If this was the last attempt, break
        if (attempt === retryConfig.maxAttempts) {
          console.error('[ErrorHandler] Max retry attempts reached');
          break;
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateBackoffDelay(
          attempt,
          retryConfig.initialDelayMs,
          retryConfig.maxDelayMs,
          retryConfig.backoffMultiplier
        );

        console.log(`[ErrorHandler] Retrying in ${delay}ms...`);

        // Notify progress with next retry time
        if (onProgress) {
          onProgress({
            attempt,
            maxAttempts: retryConfig.maxAttempts,
            nextRetryIn: delay,
            error: appError,
          });
        }

        // Wait before retrying
        await this.sleep(delay);
      }
    }

    // All retries failed, try fallback strategies
    if (fallbackStrategies.length > 0) {
      console.log(`[ErrorHandler] Attempting ${fallbackStrategies.length} fallback strategies...`);

      for (const strategy of fallbackStrategies) {
        try {
          console.log(`[ErrorHandler] Trying fallback: ${strategy.name}`);
          const result = await strategy.execute();
          console.log(`[ErrorHandler] Fallback "${strategy.name}" succeeded`);
          return result;
        } catch (error) {
          console.error(`[ErrorHandler] Fallback "${strategy.name}" failed:`, error);
        }
      }
    }

    // Everything failed, throw the last error
    throw lastError || new Error('Operation failed with unknown error');
  }

  /**
   * Categorize an error into AppError format
   */
  static categorizeError(error: unknown): AppError {
    const timestamp = new Date();

    // If it's already an AppError, return it
    if (this.isAppError(error)) {
      return error;
    }

    // Convert to Error object if needed
    const err = error instanceof Error ? error : new Error(String(error));

    // Categorize based on error message and type
    let category: ErrorCategory = 'unknown';
    let severity: ErrorSeverity = 'retryable';
    let userMessage = 'An unexpected error occurred. Please try again.';

    const errorMessage = err.message.toLowerCase();

    // Network errors
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('ETIMEDOUT')
    ) {
      category = 'network';
      userMessage =
        'Network connection issue. Please check your internet connection and try again.';
    }
    // API rate limit errors
    else if (
      errorMessage.includes('rate limit') ||
      errorMessage.includes('too many requests') ||
      errorMessage.includes('429')
    ) {
      category = 'api_limit';
      userMessage = 'Service is busy. We\'ll retry automatically in a moment.';
    }
    // Authentication errors
    else if (
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('authentication') ||
      errorMessage.includes('401') ||
      errorMessage.includes('403')
    ) {
      category = 'authentication';
      severity = 'fatal';
      userMessage = 'Authentication failed. Please check your credentials.';
    }
    // Validation errors
    else if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
      category = 'validation';
      severity = 'fatal';
      userMessage = 'Invalid input. Please check your data and try again.';
    }
    // Timeout errors
    else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
      category = 'timeout';
      userMessage = 'Request timed out. Retrying...';
    }
    // Server errors
    else if (
      errorMessage.includes('500') ||
      errorMessage.includes('502') ||
      errorMessage.includes('503') ||
      errorMessage.includes('server error')
    ) {
      category = 'server_error';
      userMessage = 'Server error. We\'re retrying automatically.';
    }

    const retryable =
      severity === 'retryable' &&
      ['network', 'api_limit', 'timeout', 'server_error'].includes(category);

    return {
      category,
      severity,
      message: err.message,
      userMessage,
      originalError: err,
      retryable,
      timestamp,
    };
  }

  /**
   * Check if an error is retryable
   */
  private static isRetryable(error: AppError, config: RetryConfig): boolean {
    if (error.severity === 'fatal') {
      return false;
    }

    return config.retryableCategories.includes(error.category);
  }

  /**
   * Calculate exponential backoff delay
   */
  private static calculateBackoffDelay(
    attempt: number,
    initialDelay: number,
    maxDelay: number,
    multiplier: number
  ): number {
    const delay = initialDelay * Math.pow(multiplier, attempt - 1);
    // Add jitter (±25%)
    const jitter = delay * 0.25 * (Math.random() * 2 - 1);
    const finalDelay = Math.min(delay + jitter, maxDelay);

    return Math.floor(finalDelay);
  }

  /**
   * Sleep for specified milliseconds
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Type guard for AppError
   */
  private static isAppError(error: unknown): error is AppError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'category' in error &&
      'severity' in error &&
      'userMessage' in error
    );
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: unknown): string {
    const appError = this.categorizeError(error);
    return appError.userMessage;
  }

  /**
   * Log error for debugging
   */
  static logError(error: unknown, context?: Record<string, any>): void {
    const appError = this.categorizeError(error);

    console.error('[ErrorHandler]', {
      timestamp: appError.timestamp.toISOString(),
      category: appError.category,
      severity: appError.severity,
      message: appError.message,
      userMessage: appError.userMessage,
      retryable: appError.retryable,
      context,
    });

    // In production, send to error tracking service (e.g., Sentry)
    // if (import.meta.env.PROD) {
    //   Sentry.captureException(appError.originalError, { extra: context });
    // }
  }

  /**
   * Create a cache fallback strategy
   */
  static createCacheFallback<T>(
    cacheKey: string,
    getCachedData: (key: string) => Promise<T | null>
  ): FallbackStrategy<T> {
    return {
      name: 'cache',
      description: 'Use cached data from previous request',
      execute: async () => {
        const cachedData = await getCachedData(cacheKey);
        if (!cachedData) {
          throw new Error('No cached data available');
        }
        return cachedData;
      },
    };
  }

  /**
   * Create a degraded mode fallback strategy
   */
  static createDegradedModeFallback<T>(
    getMinimalData: () => Promise<T>,
    description: string = 'Use minimal data in degraded mode'
  ): FallbackStrategy<T> {
    return {
      name: 'degraded_mode',
      description,
      execute: getMinimalData,
    };
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Retry an API call with exponential backoff
 */
export async function retryApiCall<T>(
  apiCall: () => Promise<T>,
  maxAttempts: number = 3,
  onProgress?: (progress: RetryProgress) => void
): Promise<T> {
  return ErrorHandlerService.executeWithRetry(
    apiCall,
    { maxAttempts },
    onProgress
  );
}

/**
 * Retry with cache fallback
 */
export async function retryWithCacheFallback<T>(
  operation: () => Promise<T>,
  cacheKey: string,
  getCachedData: (key: string) => Promise<T | null>,
  onProgress?: (progress: RetryProgress) => void
): Promise<T> {
  return ErrorHandlerService.executeWithRetry(
    operation,
    {},
    onProgress,
    [ErrorHandlerService.createCacheFallback(cacheKey, getCachedData)]
  );
}

/**
 * Get user-friendly error message
 */
export function getUserErrorMessage(error: unknown): string {
  return ErrorHandlerService.getUserMessage(error);
}

/**
 * Log error with context
 */
export function logError(error: unknown, context?: Record<string, any>): void {
  ErrorHandlerService.logError(error, context);
}
