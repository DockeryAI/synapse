# Week 4: Synthesis & Enhancement - Parallel Execution Prompts

## Overview
4 tracks to run in parallel (L, M, N, O). Each track is independent and can execute simultaneously.

---

## Track L: Opus Synthesis Service

```
Build V2 Opus synthesis service in /src/services/v2/synthesis/

ISOLATION: ZERO imports from V1 services. This is STANDALONE V2.

Create:
1. /src/types/v2/synthesis.types.ts
   - SynthesisRequest (aggregated extraction results)
   - SynthesisResult (consolidated UVP)
   - MegaPromptConfig
   - QualityScore (coherence, completeness, confidence)
   - SynthesisMetrics (timing, tokens, cache)

2. /src/services/v2/synthesis/MegaPromptGenerator.ts
   - Aggregate all 5 extractor results into single context
   - Build comprehensive Opus prompt with:
     * Customer segments from CustomerExtractor
     * Transformations from TransformationExtractor
     * Products/services from ProductExtractor
     * Benefits from BenefitExtractor
     * Solutions from SolutionExtractor
   - Include industry context and website analysis
   - Template system for synthesis modes (standard, enhanced, quick)

3. /src/services/v2/synthesis/OpusSynthesisService.ts
   - Accept ExtractionResult from orchestrator
   - Generate mega-prompt via MegaPromptGenerator
   - Call Opus model (via existing MultiModelRouter)
   - Parse synthesis response into structured UVP
   - Calculate quality scores (coherence, completeness, alignment)
   - Fallback to Sonnet if Opus unavailable
   - Emit synthesis events (start, progress, complete)
   - Target: < 5 second synthesis time

4. /src/services/v2/synthesis/SynthesisCache.ts
   - Extend ExtractionCache for synthesis results
   - 48-hour TTL (longer than extraction cache)
   - Cache by extraction fingerprint
   - Invalidation on re-extraction
   - Export cache stats

5. /src/services/v2/synthesis/__tests__/
   - Unit tests for mega-prompt generation
   - Mock Opus responses
   - Quality scoring tests
   - Cache behavior tests
   - Integration with extraction results

Use MultiModelRouter from Week 1 for Opus calls. Export from index.ts.

Reference: .buildrunner/WEEK_4_BUILD_PLAN.md Track L
```

---

## Track M: Background Enhancement System

```
Build V2 background enhancement system in /src/services/v2/enhancement/

ISOLATION: ZERO imports from V1 services. This is STANDALONE V2.

Create:
1. /src/types/v2/enhancement.types.ts
   - EnhancementTask interface
   - EnhancementType enum (tone_adjustment, clarity_boost, emotional_resonance, competitive_edge)
   - EnhancementPriority enum (low, medium, high, urgent)
   - EnhancementStatus enum (queued, processing, complete, failed)
   - EnhancementResult interface

2. /src/services/v2/enhancement/EnhancementQueue.ts
   - Priority queue implementation
   - Task scheduling by priority + age
   - Max 3 concurrent enhancements
   - Retry logic (3 attempts with exponential backoff)
   - Queue persistence to localStorage
   - Queue statistics (pending, processing, completed)

3. /src/services/v2/enhancement/BackgroundEnhancementService.ts
   - Accept synthesized UVP as input
   - Identify enhancement opportunities:
     * Low clarity scores → Clarity boost
     * Weak emotional resonance → Emotional enhancement
     * Generic positioning → Competitive edge
     * Inconsistent tone → Tone adjustment
   - Create enhancement tasks with priority
   - Enqueue and execute via Sonnet (cheaper than Opus)
   - Merge enhanced results back into UVP
   - Track enhancement history for undo/rollback
   - Target: < 3 seconds per enhancement

4. /src/services/v2/enhancement/EnhancementWorker.ts
   - Background worker using Web Workers API
   - Process enhancements without blocking UI
   - Report progress to main thread
   - Handle worker errors and timeouts
   - Graceful degradation if workers unavailable

5. /src/services/v2/enhancement/__tests__/
   - Unit tests for queue operations
   - Mock enhancement execution
   - Priority scheduling tests
   - Worker communication tests
   - Integration with synthesis results

Use MultiModelRouter for Sonnet calls. Web Workers for background processing. Export from index.ts.

Reference: .buildrunner/WEEK_4_BUILD_PLAN.md Track M
```

---

## Track N: Quality Indicator System

```
Build V2 quality scoring and display in /src/services/v2/quality/ and /src/components/v2/quality/

ISOLATION: ZERO imports from V1. This is STANDALONE V2.

Create:
1. /src/types/v2/quality.types.ts
   - QualityMetrics (clarity, coherence, completeness, confidence, emotional_resonance)
   - QualityScore (0-100 for each metric + overall)
   - QualityThreshold (min scores for green/yellow/red)
   - QualityRecommendation (suggestions to improve)
   - QualityTrend (historical tracking)

2. /src/services/v2/quality/QualityScorer.ts
   - Calculate clarity score (readability, jargon, complexity)
   - Calculate coherence score (consistency, flow, alignment)
   - Calculate completeness score (required fields, depth, coverage)
   - Calculate confidence score (extractor confidence, source quality, data points)
   - Calculate emotional resonance (emotional language, benefit articulation)
   - Generate recommendations for low scores
   - Target: < 100ms calculation time

3. /src/services/v2/quality/QualityThresholds.ts
   - Configurable quality standards
   - Default thresholds: green > 85, yellow 70-85, red < 70
   - Industry-specific thresholds
   - Export threshold configs

4. /src/components/v2/quality/QualityIndicatorBadge.tsx
   - Color-coded badge (green/yellow/red)
   - Single quality score display
   - Hover tooltip with breakdown
   - Click to expand full details
   - Animated score changes
   - Accessibility: ARIA labels, keyboard nav

5. /src/components/v2/quality/QualityBreakdown.tsx
   - Detailed panel showing all 5 metrics
   - Radar chart visualization (using recharts or similar)
   - Score history trend lines
   - Actionable recommendations list
   - "Enhance Now" button to trigger enhancements
   - Export quality report as JSON
   - Compare quality across UVP variants

6. /src/services/v2/quality/__tests__/ + /src/components/v2/quality/__tests__/
   - Unit tests for quality calculations
   - Component rendering tests
   - Threshold logic tests
   - Recommendation generation tests
   - Visual regression tests

Use React + Tailwind for components. Export from index.ts.

Reference: .buildrunner/WEEK_4_BUILD_PLAN.md Track N
```

---

## Track O: Cache Warming & Pre-computation

```
Build V2 cache warming system in /src/services/v2/cache-warming/

ISOLATION: ZERO imports from V1 services. This is STANDALONE V2.

Create:
1. /src/types/v2/cache-warming.types.ts
   - WarmingStrategy enum (industry_patterns, similar_businesses, popular_segments)
   - WarmingTask interface
   - WarmingPriority enum
   - IndustryPattern interface (common extractions per industry)
   - PredictionModel interface
   - CacheWarmingConfig interface

2. /src/services/v2/cache-warming/IndustryPatternDetector.ts
   - Analyze historical extractions by NAICS industry code
   - Identify common customer segments per industry
   - Identify common transformations per industry
   - Identify typical product/service categories
   - Build industry pattern library (JSON)
   - Update patterns as new data collected
   - Export patterns for cache warming

3. /src/services/v2/cache-warming/CacheWarmingService.ts
   - Accept new brand/website input
   - Predict likely extraction results based on:
     * Industry patterns
     * Similar business analysis
     * Popular segment data
   - Pre-generate extraction requests
   - Warm ExtractionCache and SynthesisCache with predictions
   - Schedule warming during idle time
   - Prioritize by likelihood score
   - Respect rate limits and quotas
   - Target: +20% cache hit rate improvement

4. /src/services/v2/cache-warming/PredictiveLoader.ts
   - Monitor user navigation patterns
   - Predict next likely actions
   - Prefetch data for predicted actions
   - Warm caches proactively
   - Use Idle Detection API to avoid blocking
   - Measure prediction accuracy

5. /src/services/v2/cache-warming/CacheAnalytics.ts
   - Track cache hit/miss rates by cache type
   - Monitor warming effectiveness (hits on warmed entries)
   - Calculate cost savings from cache hits
   - Identify eviction patterns
   - Generate performance reports
   - Export metrics to ExtractionMetrics

6. /src/services/v2/cache-warming/__tests__/
   - Unit tests for pattern detection
   - Mock warming execution
   - Prediction accuracy tests
   - Cache analytics calculations
   - Integration with existing caches

Use existing ExtractionCache and SynthesisCache. Integrate with ExtractionMetrics. Export from index.ts.

Reference: .buildrunner/WEEK_4_BUILD_PLAN.md Track O
```

---

## Integration Notes

### Track Dependencies:
- **Track L** (Opus Synthesis) outputs to → **Track M** (Enhancement) and **Track N** (Quality Scoring)
- **Track N** (Quality Scoring) triggers → **Track M** (Enhancement) when scores low
- **Track O** (Cache Warming) pre-populates → **Track L** (Synthesis Cache)
- All tracks use **MultiModelRouter** from Week 1
- All tracks use **ExtractionMetrics** from Week 2
- **Track N** UI components display results from **Track L** & **Track M**

### Execution Order:
1. Start all 4 tracks in parallel
2. Track L & O can begin immediately (independent)
3. Track M depends on Track L output (can mock initially)
4. Track N depends on Track L output (can mock initially)
5. Daily integration to connect tracks as they complete

### Testing Strategy:
- Each track tests independently with mocks
- Integration tests after all tracks complete
- End-to-end test: Extraction → Synthesis → Enhancement → Quality Display → Cache Warming

---

## Success Criteria

**By end of Week 4:**
- ✅ Opus synthesis working (< 5s)
- ✅ Background enhancements running (< 3s each)
- ✅ Quality indicators displaying (< 100ms calc)
- ✅ Cache warming improving hit rates (+20%)
- ✅ All 4 tracks tested and integrated
- ✅ 150+ new tests passing
- ✅ Zero V1 imports maintained

**Ready for Week 5:** Approval flow and final V2 integration

---

**Usage:** Copy each track prompt to kick off parallel development. All tracks can run simultaneously.
