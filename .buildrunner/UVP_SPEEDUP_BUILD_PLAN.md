# UVP Speed Up Build Plan

**Goal:** Reduce initial scan from 60+ seconds to under 30 seconds
**Model:** Claude Opus 4.5 (`claude-sonnet-4-5-20250929`)
**Status:** Ready to Build

---

## Problem Summary

Current initial scan runs **sequentially** through 5 stages:
1. Website Analysis (10-15s)
2. Industry Detection (3-5s)
3. NAICS Lookup/Opus Detection (2-5s)
4. Profile Generation (15-30s)
5. Deep Context Build (5-10s)

**Total: 35-65+ seconds of serial waiting**

Infrastructure exists but is unused:
- 4-key parallel OpenRouter architecture (16x concurrency available)
- `parallelChat()` function ready but rarely called
- EventEmitter streaming architecture (built for dashboard, not initial scan)
- Cache-first patterns with 1-hour TTL

---

## Phase 1: Parallel Orchestration (Primary Win)

**Objective:** Fire independent API calls simultaneously instead of sequentially

### Tasks

#### 1.1 Create Parallel Scan Orchestrator
- New service: `parallel-scan-orchestrator.service.ts`
- Coordinates all initial scan calls using `Promise.all()` and `parallelChat()`
- Handles partial failures gracefully with `parallelChatWithPartialResults()`

#### 1.2 Identify Independent Calls
Calls that can run in parallel (no dependencies):
- Website scraping (Apify)
- Cache warmup check
- Industry keyword extraction (local regex)

Calls that depend on website data:
- NAICS detection
- Deep context build
- Industry profile lookup

#### 1.3 Implement 2-Wave Parallel Pattern
```
Wave 1 (T=0): Website + Cache Check + Local Industry Match
Wave 2 (T=5-8s): NAICS + DeepContext + Profile (all parallel)
Merge (T=15-20s): Combine results
```

#### 1.4 Update Entry Points
- Modify onboarding flow to use new orchestrator
- Add error boundaries per parallel call
- Ensure graceful degradation if one call fails

**Time Estimate:** 4-6 hours

---

## Phase 2: Model Upgrade to Opus 4.5

**Objective:** Replace fictional `claude-opus-4.1` with real `claude-sonnet-4-5-20250929`

### Tasks

#### 2.1 Update Model Constants
Files requiring model string updates:
- `/src/lib/constants.ts` (OPENROUTER_MODELS)
- `/src/config/openrouter-keys.config.ts`
- `/src/services/uvp-wizard/openrouter-ai.ts`
- `/src/services/industry/NAICSDetector.service.ts`
- `/src/services/industry/IndustryCodeDetectionService.ts`
- `/src/services/industry/IndustryProfileGenerator.service.ts`
- `/src/services/industry/OnDemandProfileGeneration.ts`
- `/src/services/intelligence/website-analyzer.service.ts`
- All UVP extractor services (6 files)

#### 2.2 Create Model Config
- Centralize model selection in single config
- Environment variable override for testing
- Fallback chain: Opus 4.5 → Opus 4 → Sonnet 3.5

#### 2.3 Adjust Token Limits
- Opus 4.5 has different optimal token settings
- Update `max_tokens` from 1200 to 4096 for complex synthesis
- Reduce temperature slightly (0.7 → 0.5) for more consistent JSON

#### 2.4 Test Response Parsing
- Opus 4.5 may format JSON differently
- Validate all JSON extraction regex patterns
- Update any model-specific response handling

**Time Estimate:** 2-3 hours

---

## Phase 3: Intelligent Preloading

**Objective:** Start work before user needs it

### Tasks

#### 3.1 Welcome Screen Preload
- Fire website analysis during welcome/splash screen
- User reads intro text while Apify runs
- Store result in memory cache for immediate use

#### 3.2 Speculative NAICS Caching
- Pre-warm top 50 NAICS codes on app init
- Background fetch of industry profiles for common codes
- LRU cache with 100 profile limit

#### 3.3 Local Industry Matcher Enhancement
- Build in-memory fuzzy index from `complete-naics-codes.ts`
- Instant local matching before Opus call
- Skip Opus detection for 70%+ of cases

#### 3.4 URL Input Preload Trigger
- Start website analysis on URL input blur (not submit)
- Debounce 500ms to avoid wasted calls
- Cancel if user changes URL

**Time Estimate:** 3-4 hours

---

## Phase 4: Progressive UI (Streaming)

**Objective:** Show progress instead of spinner

### Tasks

#### 4.1 Apply Streaming Architecture to Initial Scan
- Reuse existing `streaming-api-manager.ts` pattern
- EventEmitter for each scan stage
- Independent state slices per data source

#### 4.2 Create Scan Progress Component
- Skeleton loaders for each section
- Real-time status indicators
- Estimated time remaining

#### 4.3 Progressive Data Display
- Show website data immediately when ready
- Show industry match as soon as detected
- Show profile sections as they generate

#### 4.4 Error State Per Section
- One failed call doesn't block others
- Show retry button per section
- Graceful degradation messaging

**Time Estimate:** 3-4 hours

---

## Phase 5: 4-Key Distribution

**Objective:** Maximize parallel throughput using all 4 OpenRouter keys

### Tasks

#### 5.1 Verify Key Deployment
- Confirm all 4 keys in Supabase Edge Function secrets
- Test each key individually
- Verify ai-proxy keyIndex routing works

#### 5.2 Update Parallel Calls to Use Key Distribution
- All `parallelChat()` calls auto-distribute via round-robin
- Manual `keyIndex` assignment for priority calls
- Load balancing across keys

#### 5.3 Add Key Health Monitoring
- Track success/failure rate per key
- Automatic failover on key errors
- Console logging for debugging

**Time Estimate:** 1-2 hours

---

## Implementation Order

| Order | Phase | Effort | Impact | Cumulative Time Savings |
|-------|-------|--------|--------|------------------------|
| 1 | Phase 1: Parallel Orchestration | 4-6h | HIGH | 60s → 25-30s |
| 2 | Phase 2: Model Upgrade | 2-3h | MEDIUM | 25s → 20-25s |
| 3 | Phase 5: 4-Key Distribution | 1-2h | MEDIUM | 20s → 18-22s |
| 4 | Phase 3: Preloading | 3-4h | HIGH | 18s → 12-15s |
| 5 | Phase 4: Progressive UI | 3-4h | UX | Perceived: instant |

**Total Estimated Effort:** 13-19 hours

---

## Success Metrics

| Metric | Current | Target | Stretch |
|--------|---------|--------|---------|
| Initial scan time | 60+ sec | < 30 sec | < 20 sec |
| Time to first data | 60+ sec | < 10 sec | < 5 sec |
| Perceived load time | 60+ sec | < 5 sec | Instant |
| API calls (parallel) | 1 | 4-6 | 8+ |
| Key utilization | 25% | 75% | 100% |

---

## Risk Mitigation

### Race Conditions
- Use `parallelChatWithPartialResults()` for fault tolerance
- Mutex on shared state updates
- Atomic result merging

### Model Cost Increase
- Opus 4.5 is ~2x faster but same cost/token
- Net API spend similar due to fewer retries
- Monitor with OpenRouter dashboard

### Cache Invalidation
- 1-hour TTL on website analysis (existing)
- Force refresh button for users
- Background refresh on re-visit after 24h

### Backward Compatibility
- Feature flag for new orchestrator
- Fallback to sequential if parallel fails
- A/B test with subset of users

---

## Files to Create

1. `/src/services/parallel-scan-orchestrator.service.ts` - Main orchestrator
2. `/src/hooks/useParallelScan.ts` - React hook for scan state
3. `/src/components/scan/ScanProgress.tsx` - Progressive UI component
4. `/src/config/models.config.ts` - Centralized model configuration

## Files to Modify

1. `/src/lib/openrouter.ts` - Default model update
2. `/src/lib/constants.ts` - Model constants
3. `/src/config/openrouter-keys.config.ts` - Model config
4. `/src/services/uvp-wizard/openrouter-ai.ts` - Model strings
5. `/src/services/industry/NAICSDetector.service.ts` - Parallel + model
6. `/src/services/industry/IndustryProfileGenerator.service.ts` - Model
7. `/src/services/industry/OnDemandProfileGeneration.ts` - Model
8. `/src/services/intelligence/website-analyzer.service.ts` - Model + preload
9. `/src/components/onboarding-v5/` - Preload triggers
10. 6x UVP extractor services - Model updates

---

## Definition of Done

- [ ] Initial scan completes in under 30 seconds (p95)
- [ ] First data visible in under 10 seconds
- [ ] All API calls use `claude-sonnet-4-5-20250929`
- [ ] Parallel orchestrator handles 4+ concurrent calls
- [ ] Progressive UI shows real-time scan progress
- [ ] All 4 OpenRouter keys utilized
- [ ] Error handling graceful per section
- [ ] Feature flagged for rollback

---

*Build Plan Created: 2025-12-02*
*Target Model: Claude Opus 4.5 (claude-sonnet-4-5-20250929)*
*Estimated Effort: 13-19 hours*
