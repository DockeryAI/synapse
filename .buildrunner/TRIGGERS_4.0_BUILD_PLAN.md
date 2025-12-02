# Triggers 4.0 Build Plan

## Problem Statement
V4/V5 trigger insights show hallucinated sources, fake quotes, and invented author names. Only 1 of 24 sources verified as real. The LLM synthesis step destroys provenance by inventing evidence.

## Root Cause
- Stage 1 (Data Collection): Works correctly - Perplexity/scrapers return real posts
- Stage 2 (LLM Synthesis): Breaks provenance - asks LLM to "synthesize" triggers including evidence objects, causing hallucination of URLs, quotes, and authors

## Solution: Source-First Architecture
Preserve raw scraped data through the entire pipeline. LLM scores and categorizes but NEVER generates evidence.

---

## Phase 1: Source Preservation Layer (Priority: CRITICAL)

### Objective
Create immutable source records that flow through the entire pipeline unchanged.

### Tasks
1. **Define VerifiedSource interface**
   ```typescript
   interface VerifiedSource {
     originalUrl: string;        // Exactly as scraped
     originalAuthor: string;     // Exactly as scraped
     originalContent: string;    // Verbatim quote
     platform: 'reddit' | 'twitter' | 'youtube' | 'hackernews' | 'g2' | 'trustpilot' | 'capterra';
     scrapedAt: string;          // ISO timestamp
     verified: boolean;          // URL validation result
   }
   ```

2. **Modify scraper outputs** to emit VerifiedSource objects
3. **Update trigger-synthesizer** to pass sources through unchanged
4. **Add URL validation** before display

### Files to Modify
- `src/types/triggers.types.ts` - Add VerifiedSource interface
- `src/services/triggers/llm-trigger-synthesizer.service.ts` - Preserve sources
- `src/services/intelligence/data-collector.service.ts` - Emit VerifiedSource

---

## Phase 2: LLM Role Reduction

### Objective
Restrict LLM to scoring, categorization, and summary - NEVER evidence generation.

### New LLM Responsibilities
- Score relevance (0-100) based on UVP match
- Categorize trigger type (pain point, competitor mention, buying signal, etc.)
- Generate 1-sentence summary of the insight
- Extract psychological triggers (urgency, frustration, comparison)

### Blocked LLM Actions
- Generate URLs
- Create quotes
- Invent author names
- Fabricate platform sources

### Prompt Template Update
```
Given these REAL posts with verified sources, score and categorize each.
DO NOT generate new quotes, URLs, or author information.
ONLY use the exact data provided in the source objects.

Sources: [raw scraped data]

For each source, provide:
- relevance_score: 0-100
- trigger_type: pain_point | competitor_mention | buying_signal | feature_request
- summary: 1 sentence
- psychological_triggers: string[]
```

---

## Phase 3: Expanded Data Collection

### Objective
Scale to 50+ triggers across all 6 business profile types with real sources.

### Data Sources by Profile Type

| Profile Type | Primary Sources | Secondary Sources |
|--------------|-----------------|-------------------|
| local-service-b2b | Google Reviews, LinkedIn, Yelp | Reddit, Twitter |
| local-service-b2c | Google Reviews, Yelp, Facebook | Reddit, Nextdoor |
| regional-b2b-agency | LinkedIn, G2, Clutch | Twitter, Reddit |
| regional-retail-b2c | Google Reviews, Instagram, Facebook | Reddit, TikTok |
| national-saas-b2b | G2, Capterra, HackerNews | Reddit, Twitter, ProductHunt |
| global-saas-b2b | G2, Gartner, HackerNews | Reddit, Twitter, LinkedIn |

### Scraper Enhancements
- Reddit: Expand subreddit coverage per industry
- Twitter/X: Add competitor mention tracking
- YouTube: Parse video comments for pain points
- Review Sites: G2, Capterra, Trustpilot integration

---

## Phase 4: Multi-Signal Triangulation

### Objective
Require 2+ independent sources for high-confidence triggers.

### Confidence Scoring
```
HIGH (80-100): 3+ sources mentioning same pain point
MEDIUM (50-79): 2 sources with similar signals
LOW (20-49): 1 source only
UNVERIFIED (<20): Cannot validate source
```

### Weighted Relevance (from V1)
```
Total Score = (UVP Match × 50%) + (Profile Fit × 30%) + (Geographic × 20%)
```

### Deduplication
- Hash content for exact matches
- Semantic similarity for near-duplicates
- Merge sources when referencing same pain point

---

## Phase 5: Verification Layer

### Objective
Validate sources before display to user.

### Verification Steps
1. **URL Validation**: HTTP HEAD request, check for 200/301/302
2. **Platform Matching**: Confirm URL domain matches claimed platform
3. **Freshness Check**: Reject sources older than 90 days
4. **Author Validation**: Cross-reference with platform APIs where possible

### Fallback Behavior
- Unverifiable URL → Show content but hide/gray out source link
- Invalid author → Show "Anonymous"
- Old content → Show with "Archived" badge

---

## Phase 6: UI Update

### Objective
Square card layout matching V4 with expandable source details.

### Card Design
```
┌─────────────────────────────────┐
│ 🔥 Pain Point                   │
│ "Exact quote from source..."    │
│                                 │
│ Score: 87  │  3 sources         │
│ ─────────────────────────────── │
│ ▼ View Sources                  │
│   • reddit.com/r/... - @user1   │
│   • twitter.com/... - @user2    │
│   • g2.com/... - Verified User  │
└─────────────────────────────────┘
```

### Features
- Expandable source list (collapsed by default)
- Source verification badges (✓ verified, ⚠ unverified)
- Click-through to original posts
- Filter by trigger type, confidence level, platform

---

## Implementation Order

1. **Phase 1**: Source Preservation (foundation - must complete first)
2. **Phase 2**: LLM Role Reduction (immediately after Phase 1)
3. **Phase 5**: Verification Layer (validates Phase 1-2 work)
4. **Phase 3**: Expanded Collection (increases trigger count)
5. **Phase 4**: Multi-Signal Triangulation (improves confidence)
6. **Phase 6**: UI Update (user-facing improvements last)

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Source verification rate | 4% (1/24) | 95%+ |
| Trigger count | 15-20 | 50+ |
| Hallucinated sources | 23/24 | 0 |
| Click-through validity | Unknown | 100% |
| Multi-source triggers | 0% | 40%+ |

---

## Risk Mitigation

1. **Fewer triggers initially**: Accept quality over quantity during transition
2. **Scraper rate limits**: Implement respectful delays, rotate IPs if needed
3. **LLM prompt injection**: Sanitize all scraped content before LLM processing
4. **Stale data**: Implement refresh cycles based on profile type

---

## Files to Create/Modify

### New Files
- `src/types/verified-source.types.ts`
- `src/services/triggers/source-preservation.service.ts`
- `src/services/triggers/source-verifier.service.ts`
- `src/components/v5/TriggerCardV4.tsx` (square layout)

### Modified Files
- `src/services/triggers/llm-trigger-synthesizer.service.ts`
- `src/services/intelligence/data-collector.service.ts`
- `src/hooks/v5/useTriggerInsights.ts`
- `src/types/triggers.types.ts`

---

## Status

- [x] Build plan documented
- [x] Phase 1: Source Preservation Layer (2025-12-01)
  - Created `src/types/verified-source.types.ts` with VerifiedSource, SourceScoring, TriangulatedTrigger
  - Created `src/services/triggers/source-preservation.service.ts` with SourceRegistry
  - Modified `src/services/triggers/llm-trigger-synthesizer.service.ts` to use sampleIds
- [x] Phase 2: LLM Role Reduction (2025-12-01)
  - Updated prompt to output sampleIds instead of evidence objects
  - LLM now only scores/categorizes, never generates URLs/quotes/authors
  - convertToConsolidatedTriggers now looks up REAL data from sampleIds
- [ ] Phase 3: Expanded Data Collection
- [ ] Phase 4: Multi-Signal Triangulation (partial - confidence scoring in types)
- [x] Phase 5: Verification Layer (2025-12-01)
  - Created `src/services/triggers/source-verifier.service.ts`
  - Platform-URL validation, freshness checks, hallucination pattern detection
- [ ] Phase 6: UI Update
