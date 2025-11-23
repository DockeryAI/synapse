# Week 5 Concise Prompts - Copy & Paste Ready

Use these prompts to execute Week 5 tracks in parallel across 4 Claude instances.

---

## PROMPT 1 - TRACK P: REACT INTEGRATION

```
You are building Track P: React Integration Layer for Synapse UVP V2 - Week 5.

PROJECT: /Users/byronhudson/Projects/Synapse
BRANCH: feature/uvp-v2-optimization (current)

TASK:
Create custom React hooks and context providers that bridge V2 services with UI components.

DETAILED INSTRUCTIONS:
Read the complete build instructions here: .buildrunner/TRACK_P_DETAILS.md

This file contains:
- Complete file structure to create
- Detailed API designs for all hooks
- Implementation requirements
- Testing requirements
- Success criteria

DELIVERABLES:
- useUVPGeneration, useStreamingText, useInlineEdit hooks
- UVPGenerationContext, PerformanceContext providers
- Full test coverage (>80%)
- TypeScript strict mode passing

TIME ESTIMATE: 10 hours

START: Read .buildrunner/TRACK_P_DETAILS.md then begin implementation.
```

---

## PROMPT 2 - TRACK Q: END-TO-END FLOW

```
You are building Track Q: End-to-End Flow for Synapse UVP V2 - Week 5.

PROJECT: /Users/byronhudson/Projects/Synapse
BRANCH: feature/uvp-v2-optimization (current)

TASK:
Build the complete user journey from URL input to UVP approval.

DETAILED INSTRUCTIONS:
Read the complete build instructions here: .buildrunner/TRACK_Q_DETAILS.md

This file contains:
- Complete component structure
- Detailed requirements for each flow step
- Accessibility guidelines
- Responsive design specs
- Integration points

DEPENDENCIES:
- Uses hooks from Track P (can mock if not ready)

DELIVERABLES:
- UVPGenerationFlow orchestrator
- OnboardingWizard, GenerationPhase, ResultsReview components
- Mobile responsive & accessible
- End-to-end tests passing

TIME ESTIMATE: 10 hours

START: Read .buildrunner/TRACK_Q_DETAILS.md then begin implementation.
```

---

## PROMPT 3 - TRACK R: ERROR HANDLING

```
You are building Track R: Error Handling & Resilience for Synapse UVP V2 - Week 5.

PROJECT: /Users/byronhudson/Projects/Synapse
BRANCH: feature/uvp-v2-optimization (current)

TASK:
Build production-grade error handling with intelligent retry and graceful degradation.

DETAILED INSTRUCTIONS:
Read the complete build instructions here: .buildrunner/TRACK_R_DETAILS.md

This file contains:
- Complete service architecture
- Retry strategies with exponential backoff
- Error classification and user messages
- Fallback orchestration patterns
- Circuit breaker implementation

DELIVERABLES:
- RetryStrategy, ErrorClassifier, FallbackOrchestrator services
- CircuitBreaker service
- ErrorBoundary, ErrorRecovery components
- Full test coverage with edge cases

TIME ESTIMATE: 10 hours

START: Read .buildrunner/TRACK_R_DETAILS.md then begin implementation.
```

---

## PROMPT 4 - TRACK S: MONITORING & ANALYTICS

```
You are building Track S: Monitoring & Analytics for Synapse UVP V2 - Week 5.

PROJECT: /Users/byronhudson/Projects/Synapse
BRANCH: feature/uvp-v2-optimization (current)

TASK:
Implement comprehensive monitoring to track performance, costs, quality, and user behavior.

DETAILED INSTRUCTIONS:
Read the complete build instructions here: .buildrunner/TRACK_S_DETAILS.md

This file contains:
- Complete monitoring architecture
- Metrics to track (performance, cost, quality)
- Event collection and batching
- Dashboard component structure
- Integration with Datadog/GA4

DELIVERABLES:
- PerformanceMonitor, CostTracker, QualityTracker services
- EventCollector with batching
- AnalyticsDashboard with charts
- Zero performance impact on users

TIME ESTIMATE: 10 hours

START: Read .buildrunner/TRACK_S_DETAILS.md then begin implementation.
```

---

## HOW TO USE THESE PROMPTS

### Parallel Execution (Recommended - 2-3 Days)

1. **Set up 4 branches:**
   ```bash
   git checkout -b week5/track-p-react
   git checkout -b week5/track-q-flow
   git checkout -b week5/track-r-errors
   git checkout -b week5/track-s-monitoring
   ```

2. **Open 4 Claude Code sessions**

3. **Copy each prompt above into a different instance**

4. **Let all 4 work simultaneously**

5. **Merge when complete:**
   ```bash
   git checkout main
   git merge week5/track-p-react
   git merge week5/track-s-monitoring
   git merge week5/track-r-errors
   git merge week5/track-q-flow  # Last (depends on P)
   ```

### Sequential Execution (5 Days)

If running solo with one instance:
- Day 1: Track P (foundation)
- Day 2: Track Q (uses P)
- Day 3: Track R (independent)
- Day 4: Track S (independent)
- Day 5: Integration testing

---

## FILES REFERENCE

All detailed instructions are in `.buildrunner/`:
- `TRACK_P_DETAILS.md` - React Integration Layer
- `TRACK_Q_DETAILS.md` - End-to-End Flow
- `TRACK_R_DETAILS.md` - Error Handling & Resilience
- `TRACK_S_DETAILS.md` - Monitoring & Analytics

---

## SUCCESS CRITERIA

Each track complete when:
- [ ] All files created per detailed instructions
- [ ] TypeScript strict mode passing
- [ ] Tests > 80% coverage
- [ ] Build succeeds
- [ ] Manual testing passes

Week 5 complete when:
- [ ] All 4 tracks merged
- [ ] End-to-end flow works
- [ ] Performance targets met (< 15s total)
- [ ] Cost per user < $0.10
- [ ] Ready for user testing
