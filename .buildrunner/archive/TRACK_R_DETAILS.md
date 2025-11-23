# Track R: Error Handling & Resilience - Detailed Instructions

## Overview
Build production-grade error handling that gracefully degrades when services fail, retries intelligently, and always provides users a path forward.

## Location
- **Services:** `/src/services/v2/error-handling/`
- **Components:** `/src/components/v2/error/`
- **Types:** `/src/types/v2/error-handling.types.ts`

## Critical Rules
1. Never throw errors without handling them
2. Always provide user recovery options
3. Log all errors for monitoring
4. Graceful degradation when services fail
5. Zero "Something went wrong" messages without actions

## Files to Create

```
src/
├── services/v2/error-handling/
│   ├── index.ts
│   ├── retry-strategy.service.ts
│   ├── error-classifier.service.ts
│   ├── fallback-orchestrator.service.ts
│   ├── circuit-breaker.service.ts
│   └── __tests__/
│       ├── retry-strategy.test.ts
│       ├── error-classifier.test.ts
│       └── fallback-orchestrator.test.ts
│
├── components/v2/error/
│   ├── index.ts
│   ├── ErrorBoundary.tsx
│   ├── ErrorRecovery.tsx
│   ├── FallbackUI.tsx
│   └── __tests__/
│       ├── ErrorBoundary.test.tsx
│       └── ErrorRecovery.test.tsx
│
└── types/v2/
    └── error-handling.types.ts
```

## Task 1: RetryStrategy Service (2 hours)

**Purpose:** Intelligent retry with exponential backoff

**API Design:**
```typescript
class RetryStrategy {
  async execute<T>(
    fn: () => Promise<T>,
    options: RetryOptions
  ): Promise<T>;

  shouldRetry(error: Error, attempt: number): boolean;
  getBackoffDelay(attempt: number, jitter: boolean): number;
  openCircuitBreaker(serviceId: string): void;
  closeCircuitBreaker(serviceId: string): void;
}

interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBase: number;
  jitter: boolean;
  retryableErrors: ErrorType[];
}
```

**Implementation Requirements:**
- Exponential backoff: `delay = baseDelay * (exponentialBase ^ attempt)`
- Add jitter: `random(0, delay)` to prevent thundering herd
- Circuit breaker: stop retrying after threshold failures
- Track retry count per operation
- Respect max delay cap
- Different strategies per error type

**Error Classification:**
```typescript
const retryableErrors = [
  'NetworkError',      // Retry immediately
  'TimeoutError',      // Retry with longer timeout
  'RateLimitError',    // Retry after backoff
  'ServiceUnavailable' // Retry with exponential backoff
];

const nonRetryableErrors = [
  'ValidationError',   // Don't retry, fix input
  'AuthenticationError', // Don't retry, need new creds
  'NotFoundError',     // Don't retry, resource missing
  'InvalidRequestError' // Don't retry, malformed request
];
```

## Task 2: ErrorClassifier Service (1.5 hours)

**Purpose:** Classify errors and generate user-friendly messages

**API Design:**
```typescript
class ErrorClassifier {
  classify(error: Error): ClassifiedError;
  getUserMessage(error: ClassifiedError): string;
  getSuggestedAction(error: ClassifiedError): string;
  shouldRetry(error: ClassifiedError): boolean;
  shouldFallback(error: ClassifiedError): boolean;
}

interface ClassifiedError {
  category: ErrorCategory;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isRetryable: boolean;
  userMessage: string;
  suggestedAction: string;
  technicalDetails: string;
}

enum ErrorCategory {
  NETWORK = 'network',
  RATE_LIMIT = 'rate_limit',
  AI_FAILURE = 'ai_failure',
  TIMEOUT = 'timeout',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  UNKNOWN = 'unknown'
}
```

**User Messages:**
```typescript
const userMessages = {
  network: {
    title: "Connection Issue",
    message: "We're having trouble connecting. This usually resolves in a few seconds.",
    action: "Trying again automatically..."
  },
  rate_limit: {
    title: "Please Wait",
    message: "We're receiving a lot of requests right now.",
    action: "Retrying in {seconds} seconds..."
  },
  ai_failure: {
    title: "AI Service Busy",
    message: "Our AI is temporarily unavailable. We'll use an alternative approach.",
    action: "Switching to backup system..."
  },
  timeout: {
    title: "Taking Longer Than Expected",
    message: "Your request is still processing. Would you like to keep waiting?",
    action: "Continue waiting or start over"
  },
  validation: {
    title: "Invalid Input",
    message: "Please check your website URL and try again.",
    action: "Go back and fix"
  }
};
```

## Task 3: FallbackOrchestrator Service (2.5 hours)

**Purpose:** Graceful degradation when services fail

**Degradation Levels:**
```typescript
enum DegradationLevel {
  FULL = 'full',           // All features working
  DEGRADED = 'degraded',   // Skip optional features
  BASIC = 'basic',         // Minimal functionality
  EMERGENCY = 'emergency'  // V1 fallback
}

interface FallbackStrategy {
  level: DegradationLevel;
  features: {
    streaming: boolean;
    enhancement: boolean;
    caching: boolean;
    qualityScoring: boolean;
    modelUpgrade: boolean;
  };
  modelTier: 'haiku' | 'sonnet' | 'opus';
}
```

**Fallback Logic:**
```typescript
class FallbackOrchestrator {
  async generateWithFallback(
    request: UVPRequest
  ): Promise<UVPResult> {
    try {
      // Try full service
      return await this.fullService(request);
    } catch (error) {
      if (this.shouldDegrade(error)) {
        // Try degraded mode
        return await this.degradedService(request);
      }
      if (this.shouldUseFallback(error)) {
        // Use basic mode
        return await this.basicService(request);
      }
      // Last resort: V1 fallback
      return await this.v1Fallback(request);
    }
  }

  private async degradedService(request: UVPRequest) {
    // Skip: streaming, enhancement, cache warming
    // Keep: extraction, synthesis, quality scoring
  }

  private async basicService(request: UVPRequest) {
    // Haiku only, no streaming, no enhancement
    // Just extract and synthesize
  }
}
```

## Task 4: CircuitBreaker Service (1.5 hours)

**Purpose:** Stop calling failing services temporarily

**States:**
```typescript
enum CircuitState {
  CLOSED = 'closed',     // Normal operation
  OPEN = 'open',         // Failing, reject immediately
  HALF_OPEN = 'half_open' // Testing if recovered
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = CircuitState.HALF_OPEN;
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}
```

## Task 5: ErrorBoundary Component (1.5 hours)

**Purpose:** Catch React component errors

**Implementation:**
```typescript
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to monitoring service
    this.props.onError?.(error, errorInfo);

    // Track in analytics
    trackEvent('error_boundary_caught', {
      error: error.message,
      componentStack: errorInfo.componentStack
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <FallbackUI
          error={this.state.error}
          onReset={() => this.setState({ hasError: false })}
          onRetry={this.props.onRetry}
        />
      );
    }

    return this.props.children;
  }
}
```

## Task 6: ErrorRecovery Component (1 hour)

**Purpose:** User-facing error UI with recovery options

**Structure:**
```typescript
export function ErrorRecovery({ error, onRetry, onCancel }: Props) {
  const classified = useErrorClassifier(error);
  const { title, message, action } = classified.userMessage;

  return (
    <div className="error-recovery">
      <AlertCircle className="error-icon" />
      <h2>{title}</h2>
      <p>{message}</p>

      {classified.isRetryable && (
        <>
          <p className="action">{action}</p>
          <Button onClick={onRetry}>Try Again</Button>
        </>
      )}

      {!classified.isRetryable && (
        <Button onClick={onCancel}>Go Back</Button>
      )}

      <details>
        <summary>Technical Details</summary>
        <pre>{classified.technicalDetails}</pre>
      </details>
    </div>
  );
}
```

## Task 7: Comprehensive Tests (1 hour)

**Test Scenarios:**
- Retry succeeds after transient error
- Circuit breaker opens after failures
- Fallback orchestrator degrades correctly
- Error boundary catches errors
- User can recover from each error type
- Exponential backoff timing correct
- Jitter prevents thundering herd

## Monitoring Integration

Every error should be logged:
```typescript
function logError(error: ClassifiedError) {
  // Send to monitoring service
  if (window.Datadog) {
    window.Datadog.logger.error(error.userMessage, {
      category: error.category,
      severity: error.severity,
      technicalDetails: error.technicalDetails,
      timestamp: Date.now()
    });
  }

  // Send to analytics
  trackEvent('error_occurred', {
    category: error.category,
    isRetryable: error.isRetryable
  });
}
```

## Deliverables Checklist

- [ ] RetryStrategy with exponential backoff
- [ ] ErrorClassifier with user messages
- [ ] FallbackOrchestrator with degradation levels
- [ ] CircuitBreaker with state management
- [ ] ErrorBoundary catching React errors
- [ ] ErrorRecovery UI with clear actions
- [ ] FallbackUI for graceful degradation
- [ ] Full test coverage including edge cases
- [ ] Integration with monitoring service
- [ ] User documentation for error states

## Completion Validation

```bash
npm run typecheck  # Pass
npm test -- error-handling  # All pass
# Manually test: disconnect network, verify retry
# Manually test: cause error, verify recovery UI
```

## Implementation Order

1. RetryStrategy (foundation)
2. ErrorClassifier (used by all)
3. CircuitBreaker
4. FallbackOrchestrator
5. ErrorBoundary
6. ErrorRecovery
7. Tests
