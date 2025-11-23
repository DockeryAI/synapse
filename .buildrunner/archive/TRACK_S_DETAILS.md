# Track S: Monitoring & Analytics - Detailed Instructions

## Overview
Implement comprehensive monitoring to track performance, costs, quality, and user behavior. Every operation should be measured.

## Location
- **Services:** `/src/services/v2/monitoring/`
- **Dashboard:** `/src/components/v2/admin/`
- **Types:** `/src/types/v2/monitoring.types.ts`

## Critical Rules
1. Zero performance impact on user experience
2. Aggregate metrics locally, send in batches
3. Never block user operations for logging
4. All operations must be measured
5. Metrics easily accessible to team

## Files to Create

```
src/
├── services/v2/monitoring/
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
├── components/v2/admin/
│   ├── index.ts
│   ├── AnalyticsDashboard.tsx
│   ├── PerformanceCharts.tsx
│   ├── CostMonitor.tsx
│   ├── QualityMetrics.tsx
│   └── __tests__/
│       └── AnalyticsDashboard.test.tsx
│
└── types/v2/
    └── monitoring.types.ts
```

## Task 1: PerformanceMonitor Service (2 hours)

**Purpose:** Track timing for all operations

**API Design:**
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

**Metrics to Track:**
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

**Implementation:**
- Use Performance API (`performance.now()`)
- Store timings in `Map<string, number>`
- Calculate percentiles from duration array
- Non-blocking: use `requestIdleCallback` for aggregation
- Batch metrics every 30 seconds

## Task 2: CostTracker Service (1.5 hours)

**Purpose:** Track API costs in real-time

**Model Costs:**
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

**API Design:**
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

**Alert Thresholds:**
- 50% budget: Warning
- 80% budget: Alert
- 90% budget: Critical
- 100% budget: Stop new requests

## Task 3: QualityTracker Service (2 hours)

**Purpose:** Track quality metrics and user satisfaction

**API Design:**
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

## Task 4: EventCollector Service (1.5 hours)

**Purpose:** Collect and aggregate user interaction events

**Events to Track:**
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

**API Design:**
```typescript
class EventCollector {
  track(eventType: EventType, data?: Record<string, any>): void;
  flush(): Promise<void>;  // Send batched events
  getEvents(): Event[];
  clearEvents(): void;
}
```

**Batching Strategy:**
- Buffer events in memory
- Flush every 30 seconds OR when buffer reaches 50 events
- Use `sendBeacon()` for reliable delivery
- Retry failed sends with exponential backoff

## Task 5: AnalyticsDashboard Component (2 hours)

**Purpose:** Admin view of all metrics

**Dashboard Sections:**
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

**Charts to Include:**
- Line chart: Duration over time
- Bar chart: Model usage distribution
- Pie chart: Quality score distribution
- Gauge: Budget usage
- Table: Recent errors

## Task 6: Tests (1 hour)

**Test Coverage:**
- Metrics collection accuracy
- Event batching and flushing
- Cost calculations correct
- Dashboard renders all sections
- Real-time updates work
- Export functions generate valid data

## Integration with Monitoring Services

**Datadog Integration:**
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

**Analytics Integration (Google Analytics 4):**
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

## Deliverables Checklist

- [ ] PerformanceMonitor tracking all phases
- [ ] CostTracker with budget alerts
- [ ] QualityTracker measuring outcomes
- [ ] EventCollector with batching
- [ ] MetricsAggregator for statistics
- [ ] AnalyticsDashboard with all charts
- [ ] Integration with Datadog/GA4
- [ ] Admin documentation
- [ ] Alert configuration
- [ ] Export to CSV/JSON

## Completion Validation

```bash
npm run typecheck  # Pass
npm test -- monitoring  # All pass
npm run storybook  # View dashboard
# Manually verify: metrics update in real-time
# Manually verify: costs calculated correctly
```

## Implementation Order

1. PerformanceMonitor (most critical)
2. CostTracker (budget management)
3. QualityTracker
4. EventCollector
5. MetricsAggregator
6. AnalyticsDashboard
7. Tests
8. Integration with external services
