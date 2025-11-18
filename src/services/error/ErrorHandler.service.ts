/**
 * Centralized Error Handler
 *
 * Provides consistent error handling, retry logic with exponential backoff,
 * and error reporting across the application.
 */

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface ErrorContext {
  operation: string;
  metadata?: Record<string, any>;
  userId?: string;
  brandId?: string;
}

export class ErrorHandlerService {
  private static instance: ErrorHandlerService;

  private defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  };

  private constructor() {}

  static getInstance(): ErrorHandlerService {
    if (!ErrorHandlerService.instance) {
      ErrorHandlerService.instance = new ErrorHandlerService();
    }
    return ErrorHandlerService.instance;
  }

  /**
   * Execute an operation with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    config?: Partial<RetryConfig>
  ): Promise<T> {
    const retryConfig = { ...this.defaultRetryConfig, ...config };
    let lastError: Error | null = null;
    let delay = retryConfig.initialDelay;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on last attempt
        if (attempt === retryConfig.maxRetries) {
          break;
        }

        // Log retry attempt
        console.warn(
          `[ErrorHandler] Retry ${attempt + 1}/${retryConfig.maxRetries} for ${context.operation}`,
          { error: lastError.message, delay }
        );

        // Wait before retrying
        await this.sleep(delay);

        // Calculate next delay with exponential backoff
        delay = Math.min(delay * retryConfig.backoffMultiplier, retryConfig.maxDelay);
      }
    }

    // All retries exhausted
    this.handleError(lastError!, context);
    throw lastError;
  }

  /**
   * Handle an error (log, report, etc.)
   */
  handleError(error: Error, context: ErrorContext): void {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      operation: context.operation,
      metadata: context.metadata,
      userId: context.userId,
      brandId: context.brandId,
      timestamp: new Date().toISOString()
    };

    // Log to console
    console.error('[ErrorHandler]', errorInfo);

    // TODO: Send to error tracking service (Sentry, etc.)
    // await this.reportToSentry(errorInfo);

    // TODO: Store in database for analytics
    // await this.storeError(errorInfo);
  }

  /**
   * Check if an error is retryable
   */
  isRetryable(error: Error): boolean {
    const retryableErrors = [
      'ETIMEDOUT',
      'ECONNRESET',
      'ENOTFOUND',
      'ECONNREFUSED',
      'Network request failed',
      'fetch failed',
      'timeout'
    ];

    return retryableErrors.some(msg =>
      error.message.toLowerCase().includes(msg.toLowerCase())
    );
  }

  /**
   * Create a user-friendly error message
   */
  getUserMessage(error: Error): string {
    // Network errors
    if (this.isRetryable(error)) {
      return 'Network connection issue. Please check your internet connection and try again.';
    }

    // API errors
    if (error.message.includes('API')) {
      return 'Service temporarily unavailable. Please try again in a moment.';
    }

    // Rate limiting
    if (error.message.includes('rate limit')) {
      return 'Too many requests. Please wait a moment and try again.';
    }

    // Generic fallback
    return 'Something went wrong. Please try again or contact support if the issue persists.';
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const errorHandler = ErrorHandlerService.getInstance();
