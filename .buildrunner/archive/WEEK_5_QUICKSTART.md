# Week 5 Quick Start Guide

**Status:** Ready to Start
**Est. Duration:** 40 hours (1 week)
**Prerequisites:** Weeks 1-4 Complete ✅

---

## 🎯 What We're Building

Week 5 integrates all isolated V2 components into a cohesive, production-ready system:

```
Week 1 (Foundation) ──┐
Week 2 (Extractors) ──┼──> React Hooks ──> Context ──> UI Flow ──> Production App
Week 3 (UI) ──────────┤
Week 4 (Synthesis) ───┘
```

**End Result:**
- Complete UVP generation flow from URL input to approval
- Production-grade error handling and recovery
- Real-time performance and cost monitoring
- Ready for user testing

---

## 📋 Pre-Flight Checklist

Before starting Week 5, verify:

```bash
# 1. All Week 1-4 code is present
ls -la src/services/v2/
# Should see: orchestration, ai, streaming, cache, extractors, synthesis, enhancement, quality, cache-warming, integration

ls -la src/components/v2/
# Should see: streaming, progressive, inline-edit, quality

# 2. All tests passing
npm test 2>&1 | grep -E "(Tests|PASS|FAIL)"
# Should see majority passing (some timing issues ok)

# 3. TypeScript clean
npm run typecheck 2>&1 | grep "error TS" | grep -E "v2|V2" | wc -l
# Should output: 0 (no V2 errors)

# 4. Build succeeds
npm run build
# Should complete without errors
```

**If any checks fail:**
- Week 1-4 incomplete → Review `.buildrunner/UVP_V2_OPTIMIZATION_PLAN.md`
- TypeScript errors → Run `npm run typecheck` and fix
- Build fails → Check console for specific errors

---

## 🚀 Getting Started

### Option 1: Sequential (Recommended for Solo Work)

Work through tracks in order, each building on the previous:

**Monday: Track P (React Integration)**
```bash
# Create branch
git checkout -b week5/react-integration

# Start development
code src/hooks/v2/
```

**Tuesday: Track Q (End-to-End Flow)**
```bash
git checkout -b week5/end-to-end-flow
code src/components/v2/flows/
```

**Wednesday: Track R (Error Handling)**
```bash
git checkout -b week5/error-handling
code src/services/v2/error-handling/
```

**Thursday: Track S (Monitoring)**
```bash
git checkout -b week5/monitoring
code src/services/v2/monitoring/
```

**Friday: Integration & Testing**
```bash
git checkout -b week5/integration
# Run full integration tests
npm test -- --coverage
```

### Option 2: Parallel (4 Claude Instances)

Run all tracks simultaneously for faster completion:

**Setup 4 separate Claude Code sessions:**

1. **Instance 1 - Track P:** React Integration
   - Prompt: Copy from `.buildrunner/WEEK_5_PROMPTS.md` → Track P
   - Branch: `week5/track-p-react`

2. **Instance 2 - Track Q:** End-to-End Flow
   - Prompt: Copy from `.buildrunner/WEEK_5_PROMPTS.md` → Track Q
   - Branch: `week5/track-q-flow`

3. **Instance 3 - Track R:** Error Handling
   - Prompt: Copy from `.buildrunner/WEEK_5_PROMPTS.md` → Track R
   - Branch: `week5/track-r-errors`

4. **Instance 4 - Track S:** Monitoring
   - Prompt: Copy from `.buildrunner/WEEK_5_PROMPTS.md` → Track S
   - Branch: `week5/track-s-monitoring`

**Merge Order:**
```bash
# Merge in dependency order
git checkout main
git merge week5/track-p-react     # No dependencies
git merge week5/track-s-monitoring # No dependencies
git merge week5/track-r-errors    # No dependencies
git merge week5/track-q-flow      # Depends on P
```

---

## 📦 Directory Structure (What Gets Created)

```
src/
├── hooks/v2/                          # Track P
│   ├── useUVPGeneration.ts           # Main orchestration
│   ├── useStreamingText.ts           # Streaming display
│   ├── useInlineEdit.ts              # Editing
│   ├── useQualityScore.ts            # Quality metrics
│   ├── useExtraction.ts              # Extraction data
│   └── __tests__/
│
├── contexts/v2/                       # Track P
│   ├── UVPGenerationContext.tsx      # Global state
│   ├── PerformanceContext.tsx        # Metrics tracking
│   └── __tests__/
│
├── components/v2/flows/               # Track Q
│   ├── UVPGenerationFlow.tsx         # Main flow
│   ├── OnboardingWizard.tsx          # URL input
│   ├── GenerationPhase.tsx           # In-progress UI
│   ├── ResultsReview.tsx             # Approval
│   ├── ApprovalInterface.tsx         # Multi-select
│   └── __tests__/
│
├── components/v2/error/               # Track R
│   ├── ErrorBoundary.tsx             # React errors
│   ├── ErrorRecovery.tsx             # User-facing
│   ├── FallbackUI.tsx                # Degraded mode
│   └── __tests__/
│
├── services/v2/error-handling/        # Track R
│   ├── retry-strategy.service.ts     # Smart retry
│   ├── error-classifier.service.ts   # Error types
│   ├── fallback-orchestrator.service.ts # Degradation
│   ├── circuit-breaker.service.ts    # Stop failing calls
│   └── __tests__/
│
├── services/v2/monitoring/            # Track S
│   ├── performance-monitor.service.ts # Timing
│   ├── cost-tracker.service.ts        # API costs
│   ├── quality-tracker.service.ts     # User actions
│   ├── event-collector.service.ts     # Analytics
│   └── __tests__/
│
├── components/v2/admin/               # Track S
│   ├── AnalyticsDashboard.tsx        # Metrics view
│   ├── PerformanceCharts.tsx         # Charts
│   ├── CostMonitor.tsx               # Budget
│   └── __tests__/
│
└── types/v2/
    ├── error-handling.types.ts        # Track R
    └── monitoring.types.ts            # Track S
```

---

## 🔧 Implementation Steps

### Step 1: Choose Your Approach

**Solo Developer (Sequential):**
- Estimate: 5 days, 8 hours each
- Follow Monday-Friday schedule above
- Test after each track

**Team/Parallel (Concurrent):**
- Estimate: 2 days if all tracks run simultaneously
- Requires coordination at merge time
- Higher risk of merge conflicts

### Step 2: Set Up Your Environment

```bash
# Ensure you're on the right branch
git checkout -b week5/integration

# Install any missing dependencies
npm install

# Run existing tests to establish baseline
npm test 2>&1 | tee test-results-before-week5.txt

# Start dev server in background
npm run dev &
```

### Step 3: Start First Track

**Track P Example (React Integration):**

```bash
# 1. Create directories
mkdir -p src/hooks/v2/__tests__
mkdir -p src/contexts/v2/__tests__

# 2. Copy prompt
cat .buildrunner/WEEK_5_PROMPTS.md
# Copy the "Track P: React Integration Layer" section

# 3. Open Claude Code and paste prompt

# 4. Let Claude build all files

# 5. Test as you go
npm test -- hooks/v2

# 6. Verify TypeScript
npm run typecheck
```

### Step 4: Track Q (End-to-End Flow)

Uses hooks from Track P. If Track P isn't done, mock the hooks:

```typescript
// Temporary mock for useUVPGeneration
const mockUseUVPGeneration = () => ({
  generateUVP: vi.fn(),
  isGenerating: false,
  progress: 0,
  currentPhase: 'idle',
  result: null,
  error: null,
  retry: vi.fn(),
  cancel: vi.fn()
});
```

### Step 5: Track R (Error Handling)

Independent of other tracks. Can be built anytime.

Key: Test with real network errors:
```typescript
// In tests, simulate real conditions
describe('RetryStrategy', () => {
  it('retries on network error', async () => {
    let attempts = 0;
    const fn = vi.fn(async () => {
      attempts++;
      if (attempts < 3) throw new NetworkError();
      return 'success';
    });

    const result = await retryStrategy.execute(fn);
    expect(attempts).toBe(3);
    expect(result).toBe('success');
  });
});
```

### Step 6: Track S (Monitoring)

Independent. Build anytime.

Key: Ensure zero performance impact:
```typescript
// Batch metrics, don't block operations
class PerformanceMonitor {
  private buffer: Metric[] = [];

  recordMetric(name: string, value: number) {
    this.buffer.push({ name, value, timestamp: Date.now() });

    // Flush in background
    if (this.buffer.length >= 50) {
      requestIdleCallback(() => this.flush());
    }
  }
}
```

### Step 7: Integration Testing

After all tracks complete:

```bash
# 1. Merge all tracks
git checkout main
git merge week5/track-p-react
git merge week5/track-q-flow
git merge week5/track-r-errors
git merge week5/track-s-monitoring

# 2. Run full test suite
npm test -- --coverage

# 3. Manual end-to-end test
npm run dev
# Navigate to: http://localhost:5173/uvp-wizard
# Enter URL: https://example.com
# Complete flow: Input → Generation → Approval

# 4. Check metrics
# Open: http://localhost:5173/admin/analytics
# Verify metrics displaying

# 5. Test error handling
# Disconnect network
# Retry generation
# Verify error recovery UI

# 6. Performance check
npm run build
npm run preview
# Use Chrome DevTools → Performance tab
# Record a full generation
# Verify: Time to Interactive < 7s
```

---

## 📊 Success Criteria

Before marking Week 5 complete, verify:

### Functional Requirements
- [ ] Can generate UVP from URL input
- [ ] All phases execute in order
- [ ] Streaming text displays smoothly
- [ ] Quality indicators show correctly
- [ ] Can edit inline and save
- [ ] Can approve and save to database
- [ ] Errors show user-friendly messages
- [ ] Can retry after errors
- [ ] Metrics tracked for all operations

### Performance Requirements
- [ ] Time to First Byte < 500ms
- [ ] Time to Interactive < 7s
- [ ] Total generation < 15s
- [ ] Cache hit rate > 40%
- [ ] Cost per user < $0.10

### Quality Requirements
- [ ] TypeScript strict mode passing
- [ ] Test coverage > 80%
- [ ] No console errors in production build
- [ ] Accessibility audit clean (WCAG 2.1 AA)
- [ ] Mobile responsive (test on real device)
- [ ] Cross-browser (Chrome, Safari, Firefox)

### Monitoring Requirements
- [ ] All phases timed
- [ ] API costs tracked
- [ ] Quality scores recorded
- [ ] User actions logged
- [ ] Admin dashboard displays metrics

---

## 🐛 Common Issues & Solutions

### Issue 1: Hook Dependencies Warning
```
Warning: useEffect has a missing dependency
```

**Solution:**
```typescript
// ❌ Bad
useEffect(() => {
  doSomething(prop);
}, []);

// ✅ Good
useEffect(() => {
  doSomething(prop);
}, [prop]);

// ✅ Or use useCallback
const memoizedFn = useCallback(() => {
  doSomething(prop);
}, [prop]);

useEffect(() => {
  memoizedFn();
}, [memoizedFn]);
```

### Issue 2: State Updates on Unmounted Component
```
Warning: Can't perform a React state update on an unmounted component
```

**Solution:**
```typescript
useEffect(() => {
  let isMounted = true;

  async function fetchData() {
    const data = await api.fetch();
    if (isMounted) {
      setState(data);
    }
  }

  fetchData();

  return () => {
    isMounted = false;
  };
}, []);
```

### Issue 3: Infinite Re-renders
```
Error: Too many re-renders
```

**Solution:**
```typescript
// ❌ Bad - creates new object every render
<Component onChange={{ handler: fn }} />

// ✅ Good - stable reference
const config = useMemo(() => ({ handler: fn }), [fn]);
<Component onChange={config} />
```

### Issue 4: Slow Test Suite
```
Tests taking > 1 minute
```

**Solution:**
```typescript
// Use fake timers
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// Fast-forward time
vi.advanceTimersByTime(1000);
```

### Issue 5: Race Conditions in Tests
```
Tests fail randomly
```

**Solution:**
```typescript
// Use waitFor from testing-library
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
}, { timeout: 3000 });

// Or use findBy (includes waiting)
const element = await screen.findByText('Success');
```

---

## 📚 Additional Resources

### Documentation
- **Full Plan:** `.buildrunner/WEEK_5_INTEGRATION_PLAN.md`
- **Prompts:** `.buildrunner/WEEK_5_PROMPTS.md`
- **Overall Roadmap:** `.buildrunner/UVP_V2_OPTIMIZATION_PLAN.md`

### Testing Guides
- React Testing Library: https://testing-library.com/react
- Vitest: https://vitest.dev
- React Hooks Testing: https://react-hooks-testing-library.com

### Performance Tools
- Chrome DevTools Performance: https://developer.chrome.com/docs/devtools/performance
- Web Vitals: https://web.dev/vitals
- Lighthouse: https://developers.google.com/web/tools/lighthouse

### Error Handling Patterns
- React Error Boundaries: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
- Circuit Breaker Pattern: https://martinfowler.com/bliki/CircuitBreaker.html
- Retry Patterns: https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter

---

## 🎬 Next Steps

1. **Review this guide** and choose sequential vs parallel approach
2. **Set up your environment** with the pre-flight checklist
3. **Start Track P** (React Integration) - foundation for everything
4. **Build each track** following the detailed prompts
5. **Test continuously** - don't wait until the end
6. **Integrate and validate** - run full e2e tests
7. **Document learnings** - update this guide with discoveries

**Estimated Timeline:**
- Solo (Sequential): 5 days @ 8 hours = 40 hours
- Team (Parallel): 2-3 days with coordination
- Integration: +1 day for testing and fixes
- **Total: 6-7 days**

**When Week 5 is Complete:**
- All V2 components integrated ✅
- Production-ready error handling ✅
- Comprehensive monitoring ✅
- Ready for Week 6: User Testing & Optimization

---

## 💡 Tips for Success

1. **Test Early, Test Often**
   - Don't write all code then test
   - Test each hook/component as you build it
   - Fix issues immediately

2. **Mock Strategically**
   - Mock external services (AI, database)
   - Don't mock your own code
   - Use real implementations when possible

3. **Keep It Simple**
   - Start with basic version
   - Add features incrementally
   - Don't over-engineer

4. **Document As You Go**
   - Add JSDoc comments
   - Update README files
   - Note any deviations from plan

5. **Watch Performance**
   - Profile regularly
   - Check re-render counts
   - Measure timing metrics

6. **Handle Errors Gracefully**
   - Every error needs a recovery path
   - User-friendly messages
   - Log for debugging

7. **Think Mobile First**
   - Test on real devices
   - Touch targets 44x44px minimum
   - Swipe gestures intuitive

Good luck! 🚀

---

*Questions? Issues? Update this guide as you discover solutions.*
