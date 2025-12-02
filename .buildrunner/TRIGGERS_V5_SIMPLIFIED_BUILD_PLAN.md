# Triggers V5 Simplified Build Plan

**Created:** 2025-12-02
**Updated:** 2025-12-02
**Branch:** `feature/uvp-sidebar-ui`
**Goal:** V1-style provenance with scaled output across 6 business profiles

---

## The Problem

V5 triggers have:
- 96% hallucinated sources (23/24 fake URLs)
- 35+ services with complex scoring middleware
- Post-hoc source lookup (too late to prevent hallucination)
- Misleading confidence scores
- Quantity over quality (30-50 triggers, thin evidence)

V1 Synapse had:
- Deep provenance baked into prompt schema
- Single Claude call
- 3 outputs with required source citations
- VOC phrases preserved verbatim
- No post-hoc reconstruction

---

## The 6 Business Profile Categories

| # | Profile | Primary Sources | Trigger Focus |
|---|---------|-----------------|---------------|
| 1 | **Local Service B2B** | Google Reviews, LinkedIn, BBB | Reliability, Downtime, Compliance |
| 2 | **Local Service B2C** | Google Reviews, Yelp, Facebook | Trust/Safety, Convenience, Price |
| 3 | **Regional B2B Agency** | LinkedIn, Clutch, G2 | ROI Skepticism, Expertise, Past Failures |
| 4 | **Regional Retail B2C** | Google Reviews, Social, Local News | Availability, Consistency, Value |
| 5 | **National SaaS B2B** | G2, Reddit, HackerNews | Integration Fear, Adoption Risk, Vendor Lock-in |
| 6 | **National Product B2C** | Amazon, TikTok, Reddit | Quality Doubt, Comparison, Social Proof |

---

## Architecture: Multi-Pass Scaling

### How It Works
Run 4 focused passes per brand, each with same V1 constraints:
- Single Claude call per pass
- 2+ source citations required
- Reasoning field required
- No post-hoc source lookup

### The 4 Passes

| Pass | Lens | Prompt Focus | Expected Output |
|------|------|--------------|-----------------|
| 1 | **Pain + Fear** | "Find pain points and fears from these samples" | 6-10 triggers |
| 2 | **Desire + Motivation** | "Find desires and motivations from these samples" | 6-10 triggers |
| 3 | **Objection + Trust** | "Find objections and trust concerns from these samples" | 6-10 triggers |
| 4 | **Competitor** | "Find competitor mentions and comparisons" (filtered samples) | 4-8 triggers |

### Total Output: 22-38 triggers with full provenance

---

## Phase 1: Consolidate to Single Synthesis Service
**Est: 4-6 hours**

- Merge `llm-trigger-synthesizer`, `trigger-consolidation`, `source-quality`, `category-balancing` into ONE service
- Single entry point: `generateTriggers(brandProfile, rawSamples, passType)`
- Single Claude call per pass
- Delete scoring middleware

---

## Phase 2: V1 Prompt Structure
**Est: 2-3 hours**

- Format input samples with numbered IDs before prompt
- Required output schema:
  ```
  {
    "title": string,
    "category": "pain-point" | "fear" | "desire" | etc,
    "sampleIds": [3, 7, 12],  // REQUIRED: 2+ IDs
    "verbatimQuote": string,   // REQUIRED: exact quote from sample
    "reasoning": string        // REQUIRED: why these samples support this
  }
  ```
- Hard constraint: "You may ONLY reference sample IDs from the input"

---

## Phase 3: Profile-Aware Data Collection
**Est: 3-4 hours**

- Pre-filter samples by profile type before synthesis
- Profile-specific source priorities:

| Profile | Tier 1 Sources | Tier 2 Sources |
|---------|----------------|----------------|
| Local B2B | Google Reviews, LinkedIn | Reddit, BBB |
| Local B2C | Google Reviews, Yelp | Facebook, NextDoor |
| Regional B2B | LinkedIn, Clutch, G2 | Reddit, Twitter |
| Regional B2C | Google Reviews, Instagram | Reddit, Local News |
| National SaaS | G2, Capterra, HackerNews | Reddit, ProductHunt |
| National B2C | Amazon, Reddit, YouTube | TikTok, Trustpilot |

- Mark Perplexity data as "unverified" - weight lower

---

## Phase 4: Enforce Source-First Flow
**Est: 2-3 hours**

- Pre-filter: Only samples with real URLs/quotes enter prompt
- Reject any trigger where LLM doesn't cite 2+ sample IDs
- No post-hoc source lookup
- Dedup across passes by sample ID overlap (>50% same samples = merge)

---

## Phase 5: Remove Confidence Theater
**Est: 1-2 hours**

- Delete: `confidence`, `uvpAlignmentScore`, `categoryWeightMultiplier`, `sourceQualityMultiplier`, `triangulationMultiplier`
- Keep only: `sourceCount` (honest metric)
- UI shows "Backed by X sources"

---

## Phase 6: Fix V4 Card Rendering + Progressive Loading (BLOCKING)
**Est: 2-3 hours**

**Problem:** V4 cards only render on "Triggers" tab. Rest of UI shows old InsightCards.

**Root Cause:** In `InsightTabs.tsx`, V4 cards only render when `activeFilter === 'triggers'`. Insights with `type !== 'trigger'` fall through to standard cards.

**Fix Part A - Card Rendering:**
- Audit where triggers are displayed outside InsightTabs
- Ensure `TriggerCardV4` used everywhere triggers appear
- Check `type: 'trigger'` is set correctly
- Verify `insightsToConsolidatedTriggers()` called before rendering

**Fix Part B - Progressive Loading:**
- Cards render progressively as each pass completes
- Pass 1 (Pain/Fear) cards appear first → user sees results immediately
- Pass 2-4 cards stream in as they complete
- Loading skeleton/animation between passes
- "Loading more triggers..." indicator until all 4 passes complete
- Final count badge: "32 triggers loaded"

**UX Flow:**
1. User triggers research
2. Pass 1 completes → 6-10 cards render immediately
3. Spinner + "Analyzing desires..." text
4. Pass 2 completes → cards append to grid
5. Repeat for Pass 3, 4
6. Spinner removed, "All triggers loaded" state

**Files to check:**
- `src/components/v5/InsightTabs.tsx` (lines 511-543)
- Any other component rendering trigger data
- Multi-pass orchestrator (new)

---

## Phase 7: Simplified UI
**Est: 2-3 hours**

- Remove filter complexity
- Sort by source count only
- Expand sources by default (provenance visible)
- Group by pass type (Pain/Fear, Desire/Motivation, etc.)
- Remove "UVP Match" badge

---

## Phase 8: Multi-Pass Orchestrator
**Est: 2-3 hours**

- Create orchestrator that runs 4 passes sequentially
- Dedup logic: merge triggers citing >50% same samples
- Combine results into single trigger list
- Profile-aware pass configuration

---

## Phase 9: Archive Dead Services
**Est: 1-2 hours**

Archive:
- `source-quality.service.ts`
- `profile-detection.service.ts` (API gating)
- `trigger-title-generator.service.ts`
- Category balancing logic
- Triangulation logic

Keep:
- `source-verifier.service.ts` (URL validation)
- `source-preservation.service.ts` (registry pattern)

---

## Total Estimate: 18-26 hours

---

## Before/After Comparison

| Aspect | V5 Current | V5 Simplified |
|--------|------------|---------------|
| Services | 35+ | 5-7 |
| LLM calls | 3-4 chained | 4 focused passes |
| Output count | 30-50 (thin evidence) | 22-38 (deep evidence) |
| Confidence score | Calculated (misleading) | None (source count only) |
| Provenance | Post-hoc lookup | Required in prompt |
| Source requirement | Soft (0.9x penalty) | Hard (2+ or rejected) |
| Profile support | Complex gating | Simple source filtering |
| Dedup | None | Sample ID overlap |

---

## Scaling Strategy

### More Data = More Triggers
- Expand scraper coverage per profile
- Google Reviews direct scrape
- G2/Capterra review mining
- YouTube comment extraction

### More Passes = More Coverage
- Could add Pass 5: "Buying Signals" (filtered to purchase-intent samples)
- Could add Pass 6: "Seasonal/Time-Sensitive" (filtered by recency)

### Never Loosen Constraints
- Always require 2+ sources
- Always require reasoning
- Always require verbatim quote
- Scale by running constrained process more, not by removing constraints

---

## Risk

Trade-off: 4 Claude calls instead of 1. Cost ~4x per brand.
Mitigation: Quality justifies cost. Each trigger defensible.

---

## Status

- [x] Phase 1: Consolidate services ✅ `trigger-synthesis.service.ts` created
- [x] Phase 2: V1 prompt structure ✅ Hard constraints: 2+ sampleIds, verbatimQuote, reasoning required
- [ ] Phase 3: Profile-aware data collection
- [x] Phase 4: Source-first flow ✅ Evidence built from cited sampleIds only
- [ ] Phase 5: Remove confidence theater (simplified: source count only)
- [x] Phase 6: Fix V4 card rendering ✅ TriggerCardV4 on all tabs
- [x] Phase 6B: Progressive loading UI ✅ `TriggerCardSkeleton` + `ProgressiveLoadingGrid` components
- [ ] Phase 7: Simplified UI
- [x] Phase 8: Multi-pass orchestrator ✅ `runMultiPass()` with progressive callback
- [ ] Phase 9: Archive dead services
