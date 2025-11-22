# Week 6: Integration & Refinement Plan

**Start Date:** 2025-11-21
**Status:** In Progress
**Goal:** Wire all V2 components together while maintaining strict isolation

---

## Isolation Principles (CRITICAL)

✅ **V2 Code Rules:**
- ❌ NO imports from V1 code
- ❌ NO modifications to V1 code
- ✅ V2 services remain standalone
- ✅ Progressive enhancement approach
- ✅ All V2 code in dedicated v2/ directories

---

## Phase 1: Wire Flow Components to Hooks (2 hours)

### Objective
Connect React Flow components to custom hooks for full functionality.

### Tasks

**1.1 Wire UVPGenerationFlow → useUVPGeneration**
```typescript
// In: src/components/v2/flows/UVPGenerationFlow.tsx
// Connect flow orchestrator to generation hook
import { useUVPGeneration } from '@/hooks/v2';

// Replace placeholder with real hook
const { generateUVP, isGenerating, progress, currentPhase, result } = useUVPGeneration();
```

**1.2 Wire GenerationPhase → useStreamingText**
```typescript
// In: src/components/v2/flows/GenerationPhase.tsx
// Connect to streaming for real-time updates
import { useStreamingText } from '@/hooks/v2';

// Stream synthesis results
const { text, isStreaming, subscribe, unsubscribe } = useStreamingText();
```

**1.3 Wire ResultsReview → useInlineEdit**
```typescript
// In: src/components/v2/flows/ResultsReview.tsx
// Enable inline editing of UVP components
import { useInlineEdit } from '@/hooks/v2';

// Each editable field gets its own hook instance
const primaryUVP = useInlineEdit(result.uvp.primary, { onSave: handleSave });
```

**1.4 Add Quality Score Display**
```typescript
// In: src/components/v2/flows/ResultsReview.tsx
// Show quality indicators
import { useQualityScore } from '@/hooks/v2';

const { level, indicator, overallScore } = useQualityScore(result.quality);
```

**1.5 Wrap with Contexts**
```typescript
// In: src/components/v2/flows/UVPGenerationFlow.tsx
// Provide global state
import { UVPGenerationProvider, PerformanceProvider } from '@/contexts/v2';

export function UVPGenerationFlowWithProviders(props) {
  return (
    <PerformanceProvider>
      <UVPGenerationProvider>
        <UVPGenerationFlow {...props} />
      </UVPGenerationProvider>
    </PerformanceProvider>
  );
}
```

---

## Phase 2: Error Handling Integration (1.5 hours)

### Objective
Wrap critical operations with retry logic and circuit breakers.

### Tasks

**2.1 Wrap Week4Orchestrator Calls**
```typescript
// In: src/hooks/v2/useUVPGeneration.ts
import { RetryStrategy } from '@/services/v2/error-handling';

const retryStrategy = RetryStrategy.getInstance();

// Wrap orchestrator call
const result = await retryStrategy.execute(
  () => orchestrator.orchestrate(brandId, extractionResults, options),
  {
    maxAttempts: 3,
    baseDelay: 1000,
    retryableErrors: [ErrorCategory.NETWORK, ErrorCategory.RATE_LIMIT],
  }
);
```

**2.2 Add Circuit Breaker to AI Router**
```typescript
// In: src/services/v2/ai/multi-model-router.service.ts
// Check circuit breaker before API calls
if (retryStrategy.isCircuitBreakerOpen('openrouter-api')) {
  throw new Error('Circuit breaker open - service temporarily unavailable');
}
```

**2.3 Implement Fallback Strategies**
```typescript
// In: src/services/v2/integration/Week4Orchestrator.ts
import { FallbackOrchestrator } from '@/services/v2/error-handling';

// If Opus fails, fall back to Sonnet
const fallback = new FallbackOrchestrator();
const result = await fallback.executeWithFallback(
  () => opusSynthesis(),
  () => sonnetSynthesis(),
  () => cachedResult()
);
```

**2.4 Add Error Boundaries to Flow Components**
```typescript
// In: src/components/v2/flows/UVPGenerationFlow.tsx
import { ErrorBoundary } from '@/components/v2/error';

<ErrorBoundary fallback={<ErrorRecovery onRetry={retry} />}>
  <GenerationPhase ... />
</ErrorBoundary>
```

---

## Phase 3: Monitoring Instrumentation (1.5 hours)

### Objective
Track performance, costs, and quality metrics throughout the system.

### Tasks

**3.1 Connect PerformanceContext to PerformanceMonitor**
```typescript
// In: src/contexts/v2/PerformanceContext.tsx
import { PerformanceMonitor } from '@/services/v2/monitoring';

const monitor = PerformanceMonitor.getInstance();

// Sync context metrics to monitor
useEffect(() => {
  monitor.recordMetric('timeToInteractive', metrics.timeToInteractive);
  monitor.recordMetric('totalDuration', metrics.totalDuration);
}, [metrics]);
```

**3.2 Track Phase Durations**
```typescript
// In: src/hooks/v2/useUVPGeneration.ts
import { Phase } from '@/types/v2/monitoring.types';

const { startTimer, endTimer } = usePerformanceContext();

// Track each phase
const extractionTimer = startTimer('extraction');
// ... do extraction ...
endTimer(extractionTimer);
```

**3.3 Track Cost per Generation**
```typescript
// In: src/services/v2/synthesis/OpusSynthesisService.ts
import { CostTracker } from '@/services/v2/monitoring';

const costTracker = CostTracker.getInstance();

// After each model call
costTracker.recordModelCall(
  model,
  usage.promptTokens,
  usage.completionTokens
);
```

**3.4 Track Quality Scores**
```typescript
// In: src/components/v2/flows/ResultsReview.tsx
import { QualityTracker } from '@/services/v2/monitoring';

const qualityTracker = QualityTracker.getInstance();

// When user approves/edits
qualityTracker.recordQualityScore(result.quality);
qualityTracker.recordUserAction('approved', { editsMade: 0 });
```

**3.5 Collect Analytics Events**
```typescript
// In: src/contexts/v2/UVPGenerationContext.tsx
import { EventCollector, EventType } from '@/services/v2/monitoring';

const events = EventCollector.getInstance();

// Track generation lifecycle
events.trackEvent(EventType.GENERATION_STARTED, { brandId, sessionId });
events.trackEvent(EventType.PHASE_COMPLETED, { phase: 'extraction', duration });
events.trackEvent(EventType.GENERATION_COMPLETED, { totalDuration, qualityScore });
```

---

## Phase 4: Manual Testing (2 hours)

### Test Cases

**4.1 Happy Path: Full UVP Generation**
1. Start at onboarding wizard
2. Enter website URL: `https://example.com`
3. Verify URL validation works
4. Watch real-time streaming during generation
5. See quality scores displayed
6. Edit UVP inline
7. Verify auto-save works
8. Approve final UVP
9. Confirm save to database

**Expected Results:**
- ✅ Streaming text appears character-by-character
- ✅ Progress bar updates through phases
- ✅ Quality indicators show (excellent/good/fair/poor)
- ✅ Inline editing saves automatically
- ✅ Final result persists to database

**4.2 Error Recovery Flow**
1. Start generation with mock network failure
2. Verify retry logic kicks in
3. See progress spinner with retry indicator
4. Confirm successful retry
5. Generation completes successfully

**Expected Results:**
- ✅ Retry happens automatically (up to 3 times)
- ✅ User sees "Retrying..." message
- ✅ Generation eventually succeeds
- ✅ No data loss

**4.3 Circuit Breaker Test**
1. Trigger 5 consecutive failures
2. Verify circuit breaker opens
3. See "Service temporarily unavailable" message
4. Wait for circuit breaker timeout
5. Verify circuit breaker closes
6. Generation works again

**Expected Results:**
- ✅ Circuit opens after threshold failures
- ✅ Fast-fail behavior (no long waits)
- ✅ Circuit auto-closes after timeout
- ✅ Recovery message displayed

**4.4 Session Persistence Test**
1. Start generation
2. Refresh page mid-generation
3. Verify state restores
4. See "Generation interrupted" error
5. Click "Retry"
6. Generation continues from last good state

**Expected Results:**
- ✅ Session ID persists across refreshes
- ✅ Progress/state recovers
- ✅ No duplicate generations
- ✅ Graceful error handling

**4.5 Quality Threshold Test**
1. Generate UVP with low-quality inputs
2. Verify quality score < 70
3. See quality warnings displayed
4. Get recommendations for improvement
5. Option to regenerate shown

**Expected Results:**
- ✅ Quality scores calculated correctly
- ✅ Warnings show for low scores
- ✅ Recommendations are actionable
- ✅ Regenerate option available

---

## Phase 5: Performance Validation (1 hour)

### Metrics to Measure

**5.1 Time to First Byte (TTFB)**
```bash
# Target: < 500ms
# Measure: Time from request start to first response byte
```

**5.2 Time to Interactive (TTI)**
```bash
# Target: < 7s
# Measure: Time until user can interact with UI
```

**5.3 Total Generation Time**
```bash
# Target: < 15s
# Measure: Full URL → Final UVP
```

**5.4 Cache Hit Rate**
```bash
# Target: > 40%
# Measure: (Cache hits / Total requests) * 100
```

**5.5 Cost per Generation**
```bash
# Target: < $0.10
# Measure: Sum of all model costs for one UVP
```

### Validation Script
```typescript
// Run this in browser console
const performance = await testUVPGeneration('https://example.com');
console.log('TTFB:', performance.ttfb, 'ms');
console.log('TTI:', performance.tti, 'ms');
console.log('Total:', performance.total, 'ms');
console.log('Cache hit rate:', performance.cacheHitRate, '%');
console.log('Cost:', '$' + performance.cost.toFixed(4));
```

---

## Phase 6: Fix Remaining Test Failures (Optional, 1-2 hours)

### Known Issues

**6.1 Analytics Event Timing**
```typescript
// In flow component tests
// Issue: waitFor timeout on analytics events
// Fix: Increase timeout or use different assertion strategy
await waitFor(() => {
  expect(consoleSpy).toHaveBeenCalled();
}, { timeout: 5000 }); // Increase from default 1000ms
```

**6.2 Percentile Edge Cases**
```typescript
// In performance-monitor.test.ts
// Issue: p99 = p95 when sample size < 100
// Fix: Add sample size check
if (durations.length < 100) {
  // Use simpler percentile calculation
}
```

**6.3 Satisfaction Rounding**
```typescript
// In quality-tracker.test.ts
// Issue: Average calculation rounding
// Fix: Use toBeCloseTo() instead of toBe()
expect(metrics.userSatisfaction).toBeCloseTo(4, 0); // Allow rounding
```

---

## Phase 7: Documentation (Optional, 2-3 hours)

### Documents to Create

**7.1 V2 API Documentation**
```markdown
# V2 Services API Reference
- Week4Orchestrator
- OpusSynthesisService
- BackgroundEnhancementService
- QualityScorer
- CacheWarmingService
```

**7.2 Integration Guide**
```markdown
# How to Integrate V2 into Your App
1. Install providers
2. Wire hooks
3. Add error boundaries
4. Enable monitoring
```

**7.3 Troubleshooting Guide**
```markdown
# Common Issues and Solutions
- Generation fails with RATE_LIMIT_EXCEEDED
- Circuit breaker stuck open
- Quality scores always low
- Cache not working
```

---

## Success Criteria

### Functional Requirements ✅
- [ ] Can generate UVP from URL input
- [ ] Streaming displays in real-time
- [ ] Inline editing works with auto-save
- [ ] Quality scores show correctly
- [ ] Error recovery handles failures gracefully
- [ ] Session persists across page refreshes
- [ ] Results save to database

### Performance Requirements ✅
- [ ] TTFB < 500ms
- [ ] TTI < 7s
- [ ] Total generation < 15s
- [ ] Cache hit rate > 40%
- [ ] Cost per user < $0.10

### Quality Requirements ✅
- [ ] 0 TypeScript errors (V2 code)
- [ ] Test coverage > 80%
- [ ] No console errors in production
- [ ] All critical user flows tested manually

### Isolation Requirements ✅
- [ ] No V1 imports in V2 code
- [ ] V2 services remain standalone
- [ ] Progressive enhancement pattern
- [ ] Can disable V2 without breaking V1

---

## Timeline

**Day 1 (3-4 hours):**
- ✅ Phase 1: Wire Flow → Hooks
- ✅ Phase 2: Error Handling

**Day 2 (3-4 hours):**
- ✅ Phase 3: Monitoring
- ✅ Phase 4: Manual Testing

**Day 3 (2-3 hours):**
- ✅ Phase 5: Performance Validation
- ✅ Phase 6: Fix Remaining Issues (optional)
- ✅ Phase 7: Documentation (optional)

**Total Estimate:** 8-11 hours

---

## Rollback Plan

If any integration breaks V2 isolation:

1. **Revert the change immediately**
2. **Create a new isolated approach**
3. **Test isolation with:** `grep -r "from.*services/[^v2]" src/services/v2/`
4. **Verify no V1 imports**

---

## Notes

- Focus on getting end-to-end flow working first
- Performance optimization can come later
- Documentation is nice-to-have, not required
- Maintain V2 isolation at all costs
- Use progressive enhancement pattern
- Test manually before automating

---

**Plan Created:** 2025-11-21
**Status:** Ready to Execute
**Next Step:** Phase 1.1 - Wire UVPGenerationFlow to useUVPGeneration
