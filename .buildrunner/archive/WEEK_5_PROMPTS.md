# Week 5 Claude Instance Prompts

Complete, copy-paste ready prompts for each track.

---

## Track P: React Integration Layer

```markdown
You are building the React Integration Layer for Synapse UVP V2 - Week 5 Track P.

PROJECT CONTEXT:
- Location: /Users/byronhudson/Projects/Synapse
- Branch: Current branch (already on feature/uvp-v2-optimization)
- Building on Weeks 1-4: Orchestration, Extractors, UI, Synthesis complete

YOUR TASK:
Create custom React hooks and context providers that bridge the V2 services with UI components. These hooks provide a clean, idiomatic React API for using the V2 UVP generation system.

CRITICAL RULES:
1. All code goes in /src/hooks/v2/ and /src/contexts/v2/
2. ZERO V1 imports - only use V2 services from /src/services/v2/
3. Follow React Hooks best practices
4. Use TypeScript strict mode
5. Include comprehensive tests

FILES TO CREATE:
├── src/hooks/v2/
│   ├── index.ts (barrel export)
│   ├── useUVPGeneration.ts
│   ├── useStreamingText.ts
│   ├── useInlineEdit.ts
│   ├── useQualityScore.ts
│   ├── useExtraction.ts
│   └── __tests__/
│       ├── useUVPGeneration.test.ts
│       ├── useStreamingText.test.ts
│       └── useInlineEdit.test.ts
│
└── src/contexts/v2/
    ├── index.ts
    ├── UVPGenerationContext.tsx
    ├── PerformanceContext.tsx
    └── __tests__/
        ├── UVPGenerationContext.test.tsx
        └── PerformanceContext.test.tsx

TASK BREAKDOWN:

1. CREATE useUVPGeneration HOOK (2 hours)
   Purpose: Main orchestration hook for complete UVP generation flow

   API Design:
   ```typescript
   const {
     generateUVP,      // Start generation
     isGenerating,     // Loading state
     progress,         // 0-100 percentage
     currentPhase,     // 'extraction' | 'synthesis' | etc.
     result,           // Final UVP result
     error,            // Error if failed
     retry,            // Retry after error
     cancel            // Cancel ongoing generation
   } = useUVPGeneration();
   ```

   Implementation Requirements:
   - Import Week4Orchestrator from /src/services/v2/integration/Week4Orchestrator
   - Use useReducer for complex state management
   - Wrap callbacks in useCallback for stability
   - Subscribe to orchestrator events (phase:started, phase:completed, etc.)
   - Clean up subscriptions on unmount
   - Handle concurrent generation requests gracefully
   - Persist state to sessionStorage for navigation resilience

   State Machine:
   ```typescript
   type State =
     | { status: 'idle' }
     | { status: 'generating', progress: number, phase: Phase }
     | { status: 'complete', result: UVPResult }
     | { status: 'error', error: Error };
   ```

2. CREATE useStreamingText HOOK (1.5 hours)
   Purpose: Subscribe to and display streaming text updates

   API Design:
   ```typescript
   const {
     text,           // Accumulated text
     isStreaming,    // Is currently streaming
     progress,       // Estimated progress
     subscribe,      // Subscribe to stream URL
     unsubscribe     // Clean up subscription
   } = useStreamingText(streamUrl);
   ```

   Implementation Requirements:
   - Use StreamingHandler from /src/services/v2/streaming/
   - Create EventSource connection to stream URL
   - Buffer chunks for smooth character-by-character display
   - Calculate progress from token count
   - Handle reconnection on connection drop
   - Clean up EventSource on unmount
   - Support multiple concurrent streams with unique IDs

3. CREATE useInlineEdit HOOK (1.5 hours)
   Purpose: Manage inline editing state with auto-save

   API Design:
   ```typescript
   const {
     value,        // Current value
     isDirty,      // Has unsaved changes
     isEditing,    // In edit mode
     isSaving,     // Save in progress
     edit,         // Enter edit mode
     save,         // Save changes
     cancel,       // Cancel and revert
     reset         // Reset to initial
   } = useInlineEdit(initialValue, {
     onSave: async (value) => { /* save logic */ },
     debounceMs: 500,
     autoSave: true
   });
   ```

   Implementation Requirements:
   - Use useState for value and flags
   - Implement debounce for auto-save
   - Track original value for cancel/isDirty
   - Handle save errors gracefully
   - Support async onSave callbacks
   - Prevent race conditions with pending saves

4. CREATE UVPGenerationContext (1.5 hours)
   Purpose: Global state for UVP generation across components

   API Design:
   ```typescript
   <UVPGenerationProvider>
     {/* Children can access state */}
   </UVPGenerationProvider>

   const context = useUVPGenerationContext();
   ```

   State Structure:
   ```typescript
   interface UVPGenerationState {
     // Session info
     sessionId: string;
     brandId: string;
     websiteUrl: string;

     // Current phase
     phase: Phase;
     progress: number;

     // Results
     extractionResults: ExtractionResult[];
     synthesis: SynthesisResult | null;
     quality: QualityScore | null;
     enhancements: EnhancementResult[];

     // Status
     status: 'idle' | 'generating' | 'complete' | 'error';
     error: Error | null;

     // Actions
     startGeneration: (url: string) => Promise<void>;
     retryGeneration: () => Promise<void>;
     cancelGeneration: () => void;
     updateBrand: (brandId: string) => void;
   }
   ```

   Implementation Requirements:
   - Use useReducer for state management
   - Persist to sessionStorage for page refresh
   - Emit custom events for analytics
   - Integrate with PerformanceContext for metrics
   - Handle concurrent requests properly

5. CREATE PerformanceContext (1.5 hours)
   Purpose: Track performance metrics across all operations

   State Structure:
   ```typescript
   interface PerformanceState {
     metrics: {
       phase1Duration: number;
       phase2Duration: number;
       phase3Duration: number;
       phase4Duration: number;
       totalDuration: number;
       cacheHitRate: number;
       modelUpgrades: number;
     };
     costs: {
       haikuCalls: number;
       sonnetCalls: number;
       opusCalls: number;
       totalCost: number;
     };
     startTimer: (label: string) => void;
     endTimer: (label: string) => number;
     recordMetric: (name: string, value: number) => void;
   }
   ```

6. WRITE COMPREHENSIVE TESTS (1.5 hours)
   - Test all hook APIs
   - Test error states
   - Test cleanup on unmount
   - Test concurrent operations
   - Test state persistence
   - Use @testing-library/react-hooks
   - Mock V2 services appropriately

TESTING REQUIREMENTS:
- Use vitest and @testing-library/react
- Mock Week4Orchestrator and other services
- Test happy paths and error scenarios
- Verify cleanup functions called
- Check re-render counts (should be minimal)
- Test concurrent hook usage

IMPORT STRUCTURE:
```typescript
// ✅ ALLOWED
import { Week4Orchestrator } from '@/services/v2/integration/Week4Orchestrator';
import { StreamingHandler } from '@/services/v2/streaming/streaming-handler.service';
import type { UVPResult } from '@/types/v2/synthesis.types';

// ❌ FORBIDDEN
import { anything } from '@/services/uvp-extractors/...';  // V1
import { anything } from '@/services/intelligence/...';    // V1
```

DELIVERABLES CHECKLIST:
□ useUVPGeneration hook with full orchestration
□ useStreamingText hook with buffering
□ useInlineEdit hook with debouncing
□ useQualityScore hook for metrics display
□ useExtraction hook for phase 1-2 data
□ UVPGenerationContext with session persistence
□ PerformanceContext with timing tracking
□ Full test coverage (>80%)
□ TypeScript strict mode passing
□ JSDoc comments for all public APIs
□ Example usage in Storybook (optional but nice)

COMPLETION SIGNAL:
When done, run:
```bash
npm run typecheck  # Should pass
npm test -- hooks/v2  # All tests passing
npm run build  # Should succeed
```

Start by creating the directory structure, then build useUVPGeneration as the most critical hook. Ask questions if you need clarification on Week 1-4 services.
```

---

## Track Q: End-to-End Flow

```markdown
You are building the End-to-End Flow Components for Synapse UVP V2 - Week 5 Track Q.

PROJECT CONTEXT:
- Location: /Users/byronhudson/Projects/Synapse
- Branch: Current branch (already on feature/uvp-v2-optimization)
- Depends on: Track P hooks (can mock if not ready)

YOUR TASK:
Build the complete user journey from entering a website URL to approving the final UVP. These components integrate all Week 1-4 functionality into a cohesive user experience.

CRITICAL RULES:
1. All code goes in /src/components/v2/flows/
2. Use hooks from Track P (useUVPGeneration, etc.)
3. Integrate Week 3 UI components (StreamingText, ProgressiveCards, etc.)
4. Follow accessibility guidelines (WCAG 2.1 AA)
5. Mobile-first responsive design

FILES TO CREATE:
├── src/components/v2/flows/
│   ├── index.ts
│   ├── UVPGenerationFlow.tsx (main orchestrator)
│   ├── OnboardingWizard.tsx (URL input + validation)
│   ├── GenerationPhase.tsx (in-progress display)
│   ├── ResultsReview.tsx (approval interface)
│   ├── ApprovalInterface.tsx (multi-select + editing)
│   └── __tests__/
│       ├── UVPGenerationFlow.test.tsx
│       ├── OnboardingWizard.test.tsx
│       └── ResultsReview.test.tsx

TASK BREAKDOWN:

1. CREATE UVPGenerationFlow COMPONENT (2.5 hours)
   Purpose: Main orchestration component that manages the entire flow

   Component Structure:
   ```typescript
   export function UVPGenerationFlow({
     websiteUrl?: string,
     brandId?: string,
     onComplete?: (result: UVPResult) => void,
     onError?: (error: Error) => void,
     onCancel?: () => void
   }: Props) {
     const {
       generateUVP,
       isGenerating,
       progress,
       currentPhase,
       result,
       error
     } = useUVPGeneration();

     // Phase-based rendering
     if (!websiteUrl) return <OnboardingWizard onSubmit={startGeneration} />;
     if (isGenerating) return <GenerationPhase phase={currentPhase} progress={progress} />;
     if (error) return <ErrorRecovery error={error} onRetry={generateUVP} />;
     if (result) return <ResultsReview result={result} onApprove={onComplete} />;

     return null;
   }
   ```

   Implementation Requirements:
   - Manage phase transitions smoothly
   - Show appropriate loading states
   - Handle errors with recovery options
   - Support cancellation mid-generation
   - Persist state across page refreshes
   - Track analytics events (generation_started, etc.)

2. CREATE OnboardingWizard COMPONENT (2 hours)
   Purpose: URL input, validation, and business preview

   Steps:
   1. URL Input
      - Text input with validation
      - "Paste website URL" placeholder
      - Auto-detect https://
      - Show loading indicator on submit

   2. Business Preview (if extractable)
      - Show extracted business name
      - Show detected industry
      - Show preview screenshot
      - "Looks good" / "Edit details" buttons

   3. Confirmation
      - Review details
      - "Start generating" CTA button

   Validation Rules:
   - Must be valid URL format
   - Must be publicly accessible
   - Must not be localhost/IP (in production)
   - Check against blocked domains

3. CREATE GenerationPhase COMPONENT (1.5 hours)
   Purpose: Display progress during generation

   Visual Elements:
   - Large progress bar (0-100%)
   - Current phase indicator
   - Estimated time remaining
   - Preview of extracted data as it arrives
   - Cancel button (with confirmation)

   Phase-Specific Messaging:
   ```typescript
   const phaseMessages = {
     extraction: "Analyzing your website...",
     analysis: "Understanding your customers...",
     synthesis: "Crafting your unique message...",
     enhancement: "Polishing the details..."
   };
   ```

   Progressive Reveal:
   - Show business name when extracted
   - Show products as they're found
   - Stream UVP text word-by-word
   - Animate cards sliding in

4. CREATE ResultsReview COMPONENT (2 hours)
   Purpose: Display generated UVP with approval interface

   Sections:
   a) UVP Display
      - Primary statement (large, bold)
      - Secondary statements (bullets)
      - Quality score badge
      - "Edit" button for inline editing

   b) Customer Profiles
      - Card grid (3 columns desktop, 1 mobile)
      - Each card shows: segment name, description, pain points
      - Multi-select checkboxes
      - Pre-select highest confidence

   c) Transformations
      - Swipeable cards on mobile
      - Show before → after arrows
      - Confidence indicators
      - Drag to reorder

   d) Benefits
      - Editable list
      - Inline editing per benefit
      - Add/remove buttons
      - Category tags

   e) Action Buttons
      - "Approve & Continue" (primary)
      - "Regenerate" (secondary)
      - "Edit More" (tertiary)
      - "Save Draft"

5. CREATE ApprovalInterface COMPONENT (1.5 hours)
   Purpose: Multi-select and bulk actions for approving components

   Features:
   - Select/deselect any customer profile
   - Edit transformations inline
   - Reorder benefits via drag-drop
   - "Approve Selected" button
   - "Approve All" quick action
   - "None of these" for custom input

   State Management:
   ```typescript
   const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
   const [editedTransformations, setEditedTransformations] = useState<Map<string, string>>();
   const [benefitOrder, setBenefitOrder] = useState<string[]>([]);
   ```

6. WRITE INTEGRATION TESTS (1.5 hours)
   Test Scenarios:
   - Complete happy path from URL to approval
   - Cancel mid-generation
   - Error recovery at each phase
   - Edit and regenerate
   - Mobile responsive behavior
   - Keyboard navigation
   - Screen reader compatibility

ACCESSIBILITY REQUIREMENTS:
- All interactive elements keyboard accessible
- ARIA labels on all buttons/inputs
- Focus management between steps
- Screen reader announcements for phase changes
- Error messages associated with inputs
- Sufficient color contrast (4.5:1)

RESPONSIVE DESIGN:
- Mobile: Single column, stacked cards
- Tablet: 2 columns where appropriate
- Desktop: 3 columns for cards
- Touch targets: Minimum 44x44px
- Swipe gestures on mobile

INTEGRATION POINTS:
- Uses useUVPGeneration from Track P
- Displays StreamingText from Week 3
- Shows ProgressiveCards from Week 3
- Displays QualityIndicatorBadge from Week 4
- Uses MultiSelectEditor from Week 3

DELIVERABLES CHECKLIST:
□ UVPGenerationFlow main orchestrator
□ OnboardingWizard with URL validation
□ GenerationPhase with progress display
□ ResultsReview with all sections
□ ApprovalInterface with multi-select
□ End-to-end integration tests
□ Mobile responsive (test on real device)
□ Accessibility audit passing
□ Storybook stories for all components
□ Error states handled gracefully

COMPLETION SIGNAL:
```bash
npm run typecheck  # Pass
npm test -- flows  # All tests pass
npm run storybook  # Can view all stories
npm run build  # Success
```

Start with UVPGenerationFlow as the main component, then build the sub-components. Use placeholder hooks if Track P isn't ready yet.
```

---

## Track R: Error Handling & Resilience

```markdown
You are building the Error Handling & Resilience Layer for Synapse UVP V2 - Week 5 Track R.

PROJECT CONTEXT:
- Location: /Users/byronhudson/Projects/Synapse
- Branch: Current branch (already on feature/uvp-v2-optimization)
- Critical for production reliability

YOUR TASK:
Build production-grade error handling that gracefully degrades when services fail, retries intelligently, and always provides users a path forward. No user should ever see "Something went wrong" without a clear action.

CRITICAL RULES:
1. All services go in /src/services/v2/error-handling/
2. All components go in /src/components/v2/error/
3. Never throw errors without handling them
4. Always provide user recovery options
5. Log all errors for monitoring

FILES TO CREATE:
├── src/services/v2/error-handling/
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
├── src/components/v2/error/
│   ├── index.ts
│   ├── ErrorBoundary.tsx
│   ├── ErrorRecovery.tsx
│   ├── FallbackUI.tsx
│   └── __tests__/
│       ├── ErrorBoundary.test.tsx
│       └── ErrorRecovery.test.tsx
│
└── src/types/v2/
    └── error-handling.types.ts

TASK BREAKDOWN:

1. CREATE RetryStrategy SERVICE (2 hours)
   Purpose: Intelligent retry with exponential backoff

   API Design:
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

   Implementation Requirements:
   - Exponential backoff: delay = baseDelay * (exponentialBase ^ attempt)
   - Add jitter: random(0, delay) to prevent thundering herd
   - Circuit breaker: stop retrying after threshold failures
   - Track retry count per operation
   - Respect max delay cap
   - Different strategies per error type

   Error Classification:
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

2. CREATE ErrorClassifier SERVICE (1.5 hours)
   Purpose: Classify errors and generate user-friendly messages

   API Design:
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

   User Messages:
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

3. CREATE FallbackOrchestrator SERVICE (2.5 hours)
   Purpose: Graceful degradation when services fail

   Degradation Levels:
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

   Fallback Logic:
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

4. CREATE CircuitBreaker SERVICE (1.5 hours)
   Purpose: Stop calling failing services temporarily

   States:
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

5. CREATE ErrorBoundary COMPONENT (1.5 hours)
   Purpose: Catch React component errors

   Implementation:
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

6. CREATE ErrorRecovery COMPONENT (1 hour)
   Purpose: User-facing error UI with recovery options

   Structure:
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

7. WRITE COMPREHENSIVE TESTS (1 hour)
   Test Scenarios:
   - Retry succeeds after transient error
   - Circuit breaker opens after failures
   - Fallback orchestrator degrades correctly
   - Error boundary catches errors
   - User can recover from each error type
   - Exponential backoff timing correct
   - Jitter prevents thundering herd

MONITORING INTEGRATION:
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

DELIVERABLES CHECKLIST:
□ RetryStrategy with exponential backoff
□ ErrorClassifier with user messages
□ FallbackOrchestrator with degradation levels
□ CircuitBreaker with state management
□ ErrorBoundary catching React errors
□ ErrorRecovery UI with clear actions
□ FallbackUI for graceful degradation
□ Full test coverage including edge cases
□ Integration with monitoring service
□ User documentation for error states

COMPLETION SIGNAL:
```bash
npm run typecheck  # Pass
npm test -- error-handling  # All pass
# Manually test: disconnect network, verify retry
# Manually test: cause error, verify recovery UI
```

Start with RetryStrategy and ErrorClassifier as they're used by all other components.
```

---

## Track S: Monitoring & Analytics

```markdown
You are building the Monitoring & Analytics Layer for Synapse UVP V2 - Week 5 Track S.

PROJECT CONTEXT:
- Location: /Users/byronhudson/Projects/Synapse
- Branch: Current branch (already on feature/uvp-v2-optimization)
- Essential for production observability

YOUR TASK:
Implement comprehensive monitoring to track performance, costs, quality, and user behavior. Every operation should be measured, and metrics should be easily accessible to the team.

CRITICAL RULES:
1. All services go in /src/services/v2/monitoring/
2. Dashboard goes in /src/components/v2/admin/
3. Zero performance impact on user experience
4. Aggregate metrics locally, send in batches
5. Never block user operations for logging

FILES TO CREATE:
├── src/services/v2/monitoring/
│   ├── index.ts
│   ├── performance-monitor.service.ts
│   ├── cost-tracker.service.ts
│   ├── quality-tracker.service.ts
│   ├── event-collector.service.ts
│   ├── metrics-aggregator.service.ts
│   └── __tests__/
│       ├── performance-monitor.test.ts
│       ├── cost-tracker.test.ts
│       └── event-collector.test.ts
│
├── src/components/v2/admin/
│   ├── index.ts
│   ├── AnalyticsDashboard.tsx
│   ├── PerformanceCharts.tsx
│   ├── CostMonitor.tsx
│   ├── QualityMetrics.tsx
│   └── __tests__/
│       └── AnalyticsDashboard.test.tsx
│
└── src/types/v2/
    └── monitoring.types.ts

TASK BREAKDOWN:

1. CREATE PerformanceMonitor SERVICE (2 hours)
   Purpose: Track timing for all operations

   API Design:
   ```typescript
   class PerformanceMonitor {
     // Timer management
     startTimer(label: string): string;
     endTimer(timerId: string): number;

     // Mark timing
     mark(label: string): void;
     measure(name: string, startMark: string, endMark: string): number;

     // Record metrics
     recordMetric(name: string, value: number, unit?: string): void;
     recordPhaseTime(phase: Phase, duration: number): void;

     // Retrieve metrics
     getMetrics(): PerformanceMetrics;
     getPhaseMetrics(): PhaseMetrics;
     getSummary(): PerformanceSummary;

     // Export
     exportToDatadog(): void;
     exportToJSON(): string;
   }
   ```

   Metrics to Track:
   ```typescript
   interface PerformanceMetrics {
     // Phase timing
     phase1Duration: number;  // Extraction
     phase2Duration: number;  // Analysis
     phase3Duration: number;  // Synthesis
     phase4Duration: number;  // Enhancement
     totalDuration: number;

     // User perception
     timeToFirstByte: number;      // < 500ms target
     timeToFirstContent: number;   // < 2s target
     timeToInteractive: number;    // < 7s target
     timeToComplete: number;       // < 15s target

     // Cache performance
     cacheHits: number;
     cacheMisses: number;
     cacheHitRate: number;         // hits / (hits + misses)

     // Throughput
     requestsPerSecond: number;
     concurrentRequests: number;
     queueDepth: number;

     // Percentiles
     p50Duration: number;
     p95Duration: number;
     p99Duration: number;
   }
   ```

   Implementation:
   - Use Performance API (performance.now())
   - Store timings in Map<string, number>
   - Calculate percentiles from duration array
   - Non-blocking: use requestIdleCallback for aggregation
   - Batch metrics every 30 seconds

2. CREATE CostTracker SERVICE (1.5 hours)
   Purpose: Track API costs in real-time

   Model Costs:
   ```typescript
   const MODEL_COSTS = {
     haiku: {
       input: 0.80,   // per 1M tokens
       output: 4.00
     },
     sonnet: {
       input: 3.00,
       output: 15.00
     },
     opus: {
       input: 15.00,
       output: 75.00
     }
   };
   ```

   API Design:
   ```typescript
   class CostTracker {
     recordModelCall(
       model: ModelTier,
       inputTokens: number,
       outputTokens: number
     ): number;

     getCosts(): CostMetrics;
     getDailyCosts(): DailyCostSummary;
     getBudgetStatus(): BudgetStatus;

     // Alerts
     setDailyBudget(amount: number): void;
     onBudgetThreshold(callback: (percent: number) => void): void;
   }

   interface CostMetrics {
     // Model usage
     haikuCalls: number;
     sonnetCalls: number;
     opusCalls: number;
     totalCalls: number;

     // Token usage
     haikuTokens: { input: number; output: number };
     sonnetTokens: { input: number; output: number };
     opusTokens: { input: number; output: number };

     // Costs
     haikuCost: number;
     sonnetCost: number;
     opusCost: number;
     totalCost: number;

     // Per-user metrics
     costPerUser: number;
     averageTokensPerUser: number;

     // Budget
     dailyBudget: number;
     dailySpend: number;
     budgetRemaining: number;
     percentUsed: number;
   }
   ```

   Alert Thresholds:
   - 50% budget: Warning
   - 80% budget: Alert
   - 90% budget: Critical
   - 100% budget: Stop new requests

3. CREATE QualityTracker SERVICE (2 hours)
   Purpose: Track quality metrics and user satisfaction

   API Design:
   ```typescript
   class QualityTracker {
     recordQualityScore(score: QualityScore): void;
     recordUserAction(action: UserAction): void;
     recordApproval(approved: boolean, editsMade: number): void;

     getQualityMetrics(): QualityMetrics;
     getAcceptanceRate(): number;
     getEditRate(): number;
   }

   interface QualityMetrics {
     // Quality scores
     averageQualityScore: number;
     scoreDistribution: {
       excellent: number;  // 90-100
       good: number;       // 70-89
       fair: number;       // 50-69
       poor: number;       // < 50
     };

     // User actions
     acceptanceRate: number;     // % approved without edits
     editRate: number;           // % edited before approval
     regenerationRate: number;   // % regenerated
     abandonmentRate: number;    // % canceled

     // Confidence
     averageConfidence: number;
     lowConfidenceCount: number; // < 70%
     upgradeRate: number;        // % upgraded to better model

     // Time to action
     timeToApproval: number;     // Median time
     timeToFirstEdit: number;

     // Satisfaction (if collected)
     userSatisfaction: number;   // 1-5 rating
     nps: number;               // Net Promoter Score
   }
   ```

4. CREATE EventCollector SERVICE (1.5 hours)
   Purpose: Collect and aggregate user interaction events

   Events to Track:
   ```typescript
   enum EventType {
     // Generation
     GENERATION_STARTED = 'generation_started',
     PHASE_STARTED = 'phase_started',
     PHASE_COMPLETED = 'phase_completed',
     GENERATION_COMPLETED = 'generation_completed',
     GENERATION_FAILED = 'generation_failed',
     GENERATION_CANCELED = 'generation_canceled',

     // User Actions
     UVP_APPROVED = 'uvp_approved',
     UVP_EDITED = 'uvp_edited',
     UVP_REGENERATED = 'uvp_regenerated',
     PROFILE_SELECTED = 'profile_selected',
     PROFILE_DESELECTED = 'profile_deselected',
     TRANSFORMATION_EDITED = 'transformation_edited',
     BENEFIT_REORDERED = 'benefit_reordered',

     // Performance
     CACHE_HIT = 'cache_hit',
     CACHE_MISS = 'cache_miss',
     MODEL_UPGRADED = 'model_upgraded',
     STREAM_STARTED = 'stream_started',
     STREAM_COMPLETED = 'stream_completed',

     // Errors
     ERROR_OCCURRED = 'error_occurred',
     RETRY_ATTEMPTED = 'retry_attempted',
     RETRY_SUCCEEDED = 'retry_succeeded',
     RETRY_FAILED = 'retry_failed',
     FALLBACK_TRIGGERED = 'fallback_triggered',
     CIRCUIT_BREAKER_OPENED = 'circuit_breaker_opened'
   }

   interface Event {
     type: EventType;
     timestamp: number;
     sessionId: string;
     userId?: string;
     data: Record<string, any>;
   }
   ```

   API Design:
   ```typescript
   class EventCollector {
     track(eventType: EventType, data?: Record<string, any>): void;
     flush(): Promise<void>;  // Send batched events
     getEvents(): Event[];
     clearEvents(): void;
   }
   ```

   Batching Strategy:
   - Buffer events in memory
   - Flush every 30 seconds OR when buffer reaches 50 events
   - Use sendBeacon() for reliable delivery
   - Retry failed sends with exponential backoff

5. CREATE AnalyticsDashboard COMPONENT (2 hours)
   Purpose: Admin view of all metrics

   Dashboard Sections:
   ```typescript
   export function AnalyticsDashboard() {
     return (
       <div className="analytics-dashboard">
         {/* Overview */}
         <section className="overview">
           <MetricCard title="Total Generations" value={stats.totalGenerations} />
           <MetricCard title="Success Rate" value={`${stats.successRate}%`} />
           <MetricCard title="Avg Duration" value={`${stats.avgDuration}s`} />
           <MetricCard title="Cost/User" value={`$${stats.costPerUser}`} />
         </section>

         {/* Performance */}
         <section className="performance">
           <h2>Performance Metrics</h2>
           <PerformanceCharts />
           <LatencyPercentiles />
           <CacheHitRateChart />
         </section>

         {/* Costs */}
         <section className="costs">
           <h2>Cost Analysis</h2>
           <CostMonitor />
           <ModelDistributionChart />
           <BudgetProgressBar />
         </section>

         {/* Quality */}
         <section className="quality">
           <h2>Quality Metrics</h2>
           <QualityMetrics />
           <AcceptanceRateChart />
           <EditFrequencyChart />
         </section>

         {/* System Health */}
         <section className="health">
           <h2>System Health</h2>
           <ErrorRateChart />
           <CircuitBreakerStatus />
           <ActiveRequestsGauge />
         </section>
       </div>
     );
   }
   ```

   Charts to Include:
   - Line chart: Duration over time
   - Bar chart: Model usage distribution
   - Pie chart: Quality score distribution
   - Gauge: Budget usage
   - Table: Recent errors

6. WRITE TESTS (1 hour)
   Test Coverage:
   - Metrics collection accuracy
   - Event batching and flushing
   - Cost calculations correct
   - Dashboard renders all sections
   - Real-time updates work
   - Export functions generate valid data

INTEGRATION WITH MONITORING SERVICES:

Datadog Integration:
```typescript
function sendToDatadog(metrics: PerformanceMetrics) {
  if (window.DD_RUM) {
    window.DD_RUM.addTiming('phase1_duration', metrics.phase1Duration);
    window.DD_RUM.addTiming('phase2_duration', metrics.phase2Duration);
    window.DD_RUM.addTiming('total_duration', metrics.totalDuration);
    window.DD_RUM.addAction('generation_completed', {
      cost: metrics.totalCost,
      quality: metrics.averageQuality
    });
  }
}
```

Analytics Integration (Google Analytics 4):
```typescript
function sendToGA4(event: Event) {
  if (window.gtag) {
    window.gtag('event', event.type, {
      session_id: event.sessionId,
      ...event.data
    });
  }
}
```

DELIVERABLES CHECKLIST:
□ PerformanceMonitor tracking all phases
□ CostTracker with budget alerts
□ QualityTracker measuring outcomes
□ EventCollector with batching
□ MetricsAggregator for statistics
□ AnalyticsDashboard with all charts
□ Integration with Datadog/GA4
□ Admin documentation
□ Alert configuration
□ Export to CSV/JSON

COMPLETION SIGNAL:
```bash
npm run typecheck  # Pass
npm test -- monitoring  # All pass
npm run storybook  # View dashboard
# Manually verify: metrics update in real-time
# Manually verify: costs calculated correctly
```

Start with PerformanceMonitor and CostTracker as they're the most critical for production.
```

---

## Summary

These four tracks can be worked on in parallel or sequentially:

**Recommended Order:**
1. **Track P (React Integration)** - Provides foundation for Track Q
2. **Track Q (End-to-End Flow)** - Uses hooks from Track P
3. **Track R (Error Handling)** - Wraps everything with resilience
4. **Track S (Monitoring)** - Observes the complete system

**Alternative (Parallel):**
- Assign each track to a different Claude instance
- They can work simultaneously with minimal conflicts
- Merge order: P → Q → R → S

**Time Estimate:**
- Each track: 10 hours
- Total: 40 hours (1 week)
- Plus integration testing: 8 hours
- **Grand total: 48 hours**
