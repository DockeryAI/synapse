# Specialty Triggers Build Plan

**Created:** 2025-12-02
**Status:** In Progress
**Goal:** Generate V1-quality triggers for specialty businesses that don't match existing NAICS codes

## Problem Statement

V5 Triggers produce poor quality results because:
1. V1 used curated industry profiles with specific `commonBuyingTriggers`, `commonPainPoints`
2. V5 asks LLM to synthesize triggers from noisy API data
3. V5 completely ignores V1 industry profiles
4. Specialty businesses (e.g., "CAI platform for insurance") have no matching NAICS code

## Solution

Dynamic Specialty Profile Generation system that:
- Detects specialty businesses during onboarding
- Generates V1-quality profiles using multipass methodology
- Stores in Supabase for persistence
- Never silently falls back to generic NAICS

---

## Phase 1: Database & Schema ✅ COMPLETE
**Estimate: 2-4 hours**

- [x] Add `specialty_profiles` table to Supabase
- [x] Add `profile_generation_status` enum (pending, generating, failed, complete, needs_human)
- [x] Create indexes for fast lookup by brand_id and specialty_hash
- [x] Create TypeScript types in `src/types/specialty-profile.types.ts`

**Files created:**
- `supabase/migrations/20251202000001_specialty_profiles.sql`
- `src/types/specialty-profile.types.ts`

### Schema
```sql
CREATE TABLE specialty_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id),
  specialty_hash TEXT UNIQUE NOT NULL,
  profile_data JSONB NOT NULL,
  generation_status TEXT DEFAULT 'complete',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_specialty_profiles_brand ON specialty_profiles(brand_id);
CREATE INDEX idx_specialty_profiles_hash ON specialty_profiles(specialty_hash);
```

---

## Phase 2: Specialty Detection Enhancement ✅ COMPLETE
**Estimate: 3-5 hours**

- [x] Extend `SpecialtyDetectionService` to return confidence score + specialty hash
- [x] Add logic to check if specialty_profile exists in DB
- [x] Return profile if exists, flag for generation if not

### Files Modified
- `src/services/specialty-detection.service.ts`

### Implementation Summary
Added `detectSpecialtyEnhanced()` method with:
- 7 business profile type classification (local-service-b2c, local-service-b2b, regional-b2b-agency, regional-retail-b2c, national-saas-b2b, national-product-b2c, global-saas-b2b)
- Specialty hash generation for deduplication
- Supabase lookup for existing specialty profiles
- `needsGeneration` flag for multipass pipeline
- `createPendingSpecialtyProfile()` helper
- `linkProfileToBrand()` helper

---

## Phase 3: Multipass Profile Generator (Edge Function) ✅ COMPLETE
**Estimate: 8-12 hours**

- [x] Create Supabase Edge Function `generate-specialty-profile`
- [x] Implement 3-pass methodology from brandock scripts:
  - Pass 1: Generate initial profile structure
  - Pass 2: Validate against V1 quality standards
  - Pass 3: Refine triggers, pain points, buying triggers
- [x] Validation checks between passes (retry up to 3x per pass)
- [x] Human intervention request if all retries fail

**Files created:**
- `supabase/functions/generate-specialty-profile/index.ts`

### Implementation Summary
- 3-pass multipass generation with up to 3 retries per pass
- Pass 1: Initial profile structure generation (requires industry, triggers, urgency_drivers, objection_handlers)
- Pass 2: Quality enhancement (more triggers, power_words, detailed content)
- Pass 3: Trigger refinement (specificity checks, urgency validation)
- Validation scoring system (0-100) based on content quality metrics
- Auto-flags for human intervention after all retries fail
- Uses Claude Sonnet 4 via OpenRouter for speed + quality balance

---

## Phase 4: Async Generation Pipeline ✅ COMPLETE
**Estimate: 4-6 hours**

- [x] Hook into UVP onboarding after specialty detection
- [x] Fire-and-forget Edge Function call
- [x] Poll for completion status (every 3s, max 30s)
- [x] Store result in `specialty_profiles` table on success

### Files Created/Modified
- `src/services/specialty-detection.service.ts` - Added async generation methods
- `src/hooks/useSpecialtyGeneration.ts` - New React hook for UI integration

### Implementation Summary
Added to `SpecialtyDetectionService`:
- `triggerSpecialtyGeneration()` - Calls Edge Function via `supabase.functions.invoke()`
- `pollGenerationStatus()` - Polls `specialty_profiles` table for status
- `waitForGeneration()` - Polls every 3s for up to 30s (10 attempts)
- `generateSpecialtyProfileAsync()` - Full async flow: create → trigger → poll → link

Created `useSpecialtyGeneration` React hook with:
- `detect()` - Run enhanced specialty detection
- `generate()` - Trigger async profile generation
- `detectAndGenerate()` - Full flow combining both
- Progress tracking (stage, progress %, message)
- Error handling with user-friendly messages

---

## Phase 5: Trigger Integration ✅ COMPLETE
**Estimate: 3-4 hours**

- [x] Update `llm-trigger-synthesizer.service.ts` to check for specialty profile first
- [x] Use specialty profile triggers instead of synthesizing from API data
- [x] Fallback hierarchy: specialty_profile → V1 industry_profile → human intervention (never generic)

### Files Modified
- `src/services/triggers/llm-trigger-synthesizer.service.ts`

### Implementation Summary
Added to `LLMTriggerSynthesizer`:
- `brandId` parameter to `TriggerSynthesisInput` interface
- `lookupSpecialtyProfile()` - Queries Supabase for specialty profile by brand_id
- `convertSpecialtyProfileToTriggers()` - Converts specialty profile data to ConsolidatedTrigger[]
  - Converts `customer_triggers` with urgency/frequency metadata
  - Converts `common_pain_points` to pain-point category triggers
  - Converts `common_buying_triggers` to desire category triggers
  - Converts `urgency_drivers` to fear category triggers (time-sensitive)
- `inferCategoryFromTrigger()` - Infers TriggerCategory from text
- Modified `synthesize()` to check specialty profile FIRST before LLM synthesis
- Returns specialty profile triggers directly if found (no LLM call needed)

---

## Phase 6: UVP → Specialty Profile Transform ✅ COMPLETE
**Estimate: 1.5 hours**

- [x] Create `src/services/specialty/uvp-to-specialty.transform.ts`
- [x] Direct mapping (NO LLM required):

| UVP Field | → | Specialty Profile Field |
|-----------|---|------------------------|
| `customerProfiles[].emotionalDrivers` | → | `common_pain_points` |
| `customerProfiles[].functionalDrivers` | → | `common_buying_triggers` |
| `customerProfiles[]` (full) | → | `customer_triggers` (add urgency/frequency) |
| `transformation.before` | → | `urgency_drivers` |
| `differentiators[]` | → | `competitive_advantages` |
| `benefits[]` | → | `trust_builders` / `proof_points` |
| `uniqueSolution` | → | `risk_mitigation` |

---

## Phase 7: Single-Pass LLM for Missing Fields ✅ COMPLETE
**Estimate: 2 hours**

- [x] Modify Edge Function to accept UVP-derived data (`generate-specialty-profile-hybrid`)
- [x] Generate ONLY missing fields (not full profile):

| Missing Field | Generation Strategy |
|---------------|---------------------|
| `market_trends` | Industry + target customer → 5 trends |
| `seasonal_patterns` | Industry + profile type → timing patterns |
| `geographic_variations` | Profile type → regional factors (if local/regional) |
| `headline_templates` | UVP + pain points → 10 templates |
| `hook_library` | Pain points + benefits → hooks per category |
| `power_words` / `avoid_words` | Industry + tone → word lists |
| `innovation_opportunities` | Industry + trends → opportunities |

- [x] Target: 5-10 seconds (vs 15-45 seconds multipass)
- [x] Merge UVP-derived + LLM-generated = Complete profile

---

## Phase 8: Move Generation to Post-UVP ✅ COMPLETE
**Estimate: 1 hour**

- [x] Moved specialty detection to `generateSpecialtyProfileFromUVP()` in OnboardingPageV5
- [x] Add generation trigger AFTER UVP synthesis complete (after `saveCompleteUVP`)
- [x] Pass full `CompleteUVP` object to transform + generation
- [x] Fire-and-forget async (don't block user flow)

---

## Phase 9: Wire TRIGGERS Tab ✅ COMPLETE
**Estimate: 30 min**

- [x] `llm-trigger-synthesizer.service.ts` has `convertSpecialtyProfileToTriggers()`
- [x] Converts: `customer_triggers`, `common_pain_points`, `common_buying_triggers`, `urgency_drivers`
- [x] Verified `brandId` passes through from `streaming-api-manager`
- [x] Verified lookup query works with applied migration

---

## Phase 10: Wire PROOF Tab ✅ COMPLETE
**Estimate: 1.5 hours**

- [x] Updated `src/services/proof/proof-consolidation.service.ts`
- [x] Added `lookupSpecialtyProfile(brandId)` check
- [x] Added `convertSpecialtyProfileToProofs()` method
- [x] Added `consolidateWithSpecialty()` async method
- [x] Convert specialty data to proof format:

| Specialty Field | → | Proof Type |
|-----------------|---|------------|
| `risk_reversal.proof_points` | → | Social proof items |
| `risk_reversal.guarantees` | → | Trust signals |
| `objection_handlers[].response` | → | Objection-handling proof |
| `profile_data.success_metrics` | → | Metric-based proof |

- [x] Fall back to API scraping only if no specialty profile

---

## Phase 11: Wire TRENDS Tab ✅ COMPLETE
**Estimate: 1.5 hours**

- [x] Updated `insight-loader.service.ts` with specialty profile lookup
- [x] Added `lookupSpecialtyProfile()` method
- [x] Added `convertSpecialtyProfileToTrends()` method
- [x] Convert specialty data to trends format:

| Specialty Field | → | Trend Type |
|-----------------|---|------------|
| `profile_data.market_trends` | → | Industry trends |
| `profile_data.innovation_opportunities` | → | Opportunity trends |
| `profile_data.seasonal_patterns` | → | Timing-based trends |

- [x] Fall back to Perplexity/news APIs only if no specialty profile

---

## Phase 12: Wire COMPETITION Tab ✅ COMPLETE
**Estimate: 1.5 hours**

- [x] Updated `loadCompetitors()` in `insight-loader.service.ts`
- [x] Added `convertSpecialtyProfileToCompetitors()` method
- [x] Convert specialty data to competition format:

| Specialty Field | → | Competition Insight |
|-----------------|---|---------------------|
| `profile_data.competitive_advantages` | → | Your advantages |
| `profile_data.differentiators` | → | Differentiation points |
| `objection_handlers` | → | Competitor objection responses |
| `profile_data.value_propositions` | → | Positioning statements |

- [x] Fall back to SEMrush/competitor APIs only if no specialty profile

---

## Phase 13: Wire LOCAL/WEATHER Tabs ✅ COMPLETE
**Estimate: 1 hour**

- [x] Updated `loadLocalNews()` in `insight-loader.service.ts`
- [x] Updated `loadWeather()` in `insight-loader.service.ts`
- [x] Added `convertSpecialtyProfileToLocal()` method
- [x] Added `convertSpecialtyProfileToWeather()` method
- [x] **Local tab** (if `enabledTabs.local`):
  - Convert `profile_data.geographic_variations` to local insights
  - Supplement with real-time local news/events API
- [x] **Weather tab** (if `enabledTabs.weather`):
  - Convert `profile_data.seasonal_patterns` to weather triggers
  - Supplement with real-time weather API

---

## Phase 14: Profile-Type Tab Gating ✅ COMPLETE
**Estimate: 1 hour**

- [x] Enforce 6 business profile types across system:

| Profile Type | Enabled Tabs | Priority Sources |
|--------------|--------------|------------------|
| Local Service B2C | All + Local + Weather | Google Reviews, Yelp, Facebook |
| Local Service B2B | All + Local + Weather | Google Reviews, LinkedIn Local |
| Regional B2B Agency | All + Local | LinkedIn, Clutch, G2 |
| Regional Retail B2C | All + Local + Weather | Google Reviews, Social |
| National SaaS B2B | All (no Local/Weather) | G2, Reddit, HackerNews |
| National Product B2C | All (no Local/Weather) | Amazon, TikTok, Reddit |

- [x] Use `enabledTabs` from specialty profile via `useSpecialtyProfile` hook
- [x] Enhanced hook to use direct `brand_id` lookup (not just FK)
- [x] Apply source weighting per profile type via `getEnabledTabsForProfileType()`

---

## Phase 15: Fix React Render Loop ✅ COMPLETE
**Estimate: 1 hour**

- [x] Diagnosed render cascade caused by unmemoized context values
- [x] Root causes fixed:
  - BrandContext.tsx: Added `useMemo()` to context value object
  - BrandProfileContext.tsx: Added `useMemo()` to context value object
- [x] Verified proper dependency arrays in useEffect hooks
- [x] Stable context values prevent cascading re-renders

---

## Phase 16: Admin & Monitoring
**Estimate: 3-4 hours** (OPTIONAL - post-launch)

- [ ] Add admin UI to view pending/failed generations
- [ ] Manual retry button for failed generations
- [ ] Human intervention queue for unresolvable specialties

---

## Phase 17: Remove Detection Gate - Always Generate ✅ COMPLETE
**Estimate: 30 min**

**Problem:** Detection returns `isSpecialty=false` for SaaS businesses like OpenDialog, bypassing the entire specialty pipeline. The detection logic uses naive keyword matching that fails for businesses that don't self-identify with exact strings like "b2b" or "enterprise".

**Solution:** Remove the `if (isSpecialty && needsGeneration)` gate. Generate specialty profile for ALL brands after UVP completes.

- [x] Set `needsGeneration = true` always in `specialty-detection.service.ts`
- [x] Always call `generate-specialty-profile-hybrid` Edge Function
- [x] Deduplication still works via `specialty_hash` - same business type reuses existing profile

**Why this is safe:**
- Every business IS a specialty - "Plumber in Denver" benefits as much as "CAI for Insurance"
- UVP data is real extracted content, not hallucinations
- Worst case = redundant profile with more specific triggers (better than NAICS fallback)

**Files Modified:**
- `src/services/specialty-detection.service.ts` - Line 545: `needsGeneration = true`

---

## Phase 18: Fix Profile Type Detection Using UVP Fields ✅ COMPLETE
**Estimate: 30 min**

**Problem:** `detectBusinessProfileType()` uses naive keyword matching. OpenDialog classified as `regional-retail-b2c` instead of `national-saas-b2b`.

**Solution:** Derive profile type directly from structured UVP fields we already extracted:

| UVP Field | Maps To |
|-----------|---------|
| `targetCustomer.customerType` | b2b / b2c / b2b2c |
| `targetCustomer.marketGeography.scope` | local / regional / national / global |
| Combine → | Correct profile type |

- [x] Added `uvp` field to `SpecialtyDetectionInput` interface
- [x] Updated `classifyBusinessProfileType()` to prioritize UVP structured data
- [x] Pass structured UVP data from `OnboardingPageV5.tsx`
- [x] Improved fallback defaults (national-saas-b2b instead of regional-retail-b2c)

**Files Modified:**
- `src/types/specialty-profile.types.ts` - Added `uvp` field with customerType, geographicScope, isSaaS, isService
- `src/services/specialty-detection.service.ts` - Rewrote `classifyBusinessProfileType()` to use UVP first
- `src/pages/OnboardingPageV5.tsx` - Extract and pass UVP structured fields to detection

---

## Phase 19: Remove Garbage UI Keyword Alignment ✅ COMPLETE
**Estimate: 20 min**

**Problem:** `generateUVPAlignments()` in `InsightTabs.tsx` uses naive 4-char keyword matching. Words like "leader", "customer" pass filter but are semantically meaningless. Results in garbage like "Target Customer - mentions 'leader', 'leader'".

**Solution:** Remove the UI-level keyword matching entirely. Only display alignments from `trigger.uvpAlignments` array (already computed properly by consolidation service with real match scoring).

- [x] Disabled `generateUVPAlignments()` function - now returns empty array
- [x] Real alignments come from `trigger.uvpAlignments` via consolidation service
- [x] No more garbage keyword matching in UI

**Files Modified:**
- `src/components/v5/InsightTabs.tsx` - `generateUVPAlignments()` now returns `[]`

---

## Phase 20: Fix Source URLs for Specialty Triggers ✅ COMPLETE
**Estimate: 20 min**

**Problem:** `convertSpecialtyProfileToTriggers()` creates evidence with missing/invalid URLs. Sources show as "unknown" and aren't clickable.

**Solution:** For specialty-derived triggers, set honest source attribution:

- [x] Updated all evidence objects in `convertSpecialtyProfileToTriggers()`:
  - `platform: 'uvp-analysis'`
  - `source: 'UVP Analysis'`
  - `quote`: Uses trigger text directly (not meta-quote)
  - `url`: Intentionally omitted (no fake URLs)
- [x] Updated `TriggerCardV4.tsx` `formatSourceAttribution()` to display "UVP Analysis" nicely

**Files Modified:**
- `src/services/triggers/llm-trigger-synthesizer.service.ts` - Updated all 4 evidence blocks
- `src/components/v5/TriggerCardV4.tsx` - Added 'uvpanalysis' to platform map

---

## ✅ IMPLEMENTATION STATUS

| Phase | Task | Status |
|-------|------|--------|
| 1-5 | Database + Detection + Multipass + Pipeline + Integration | ✅ COMPLETE |
| 6 | UVP → V1 transform (no LLM) | ✅ COMPLETE |
| 7 | Single-pass LLM for missing fields | ✅ COMPLETE |
| 8 | Move generation to post-UVP | ✅ COMPLETE |
| 9 | Wire Triggers tab | ✅ COMPLETE |
| 10 | Wire Proof tab | ✅ COMPLETE |
| 11 | Wire Trends tab | ✅ COMPLETE |
| 12 | Wire Competition tab | ✅ COMPLETE |
| 13 | Wire Local/Weather tabs | ✅ COMPLETE |
| 14 | Profile-type tab gating | ✅ COMPLETE |
| 15 | Fix React render loop | ✅ COMPLETE |
| 16 | Admin & Monitoring | OPTIONAL (post-launch) |
| **17** | **Remove detection gate** | ✅ COMPLETE |
| **18** | **Fix profile type from UVP fields** | ✅ COMPLETE |
| **19** | **Remove UI keyword alignment** | ✅ COMPLETE |
| **20** | **Fix source URLs** | ✅ COMPLETE |

---

## Key Principles

1. **Never silently fall back** - Request human intervention if specialty can't be detected
2. **UVP-first** - Transform real UVP data, only LLM-generate missing ~30-40%
3. **Single-pass for speed** - 5-10 seconds vs 15-45 seconds multipass
4. **Supabase persistence** - Not localStorage, persists across sessions
5. **Async generation** - Runs after UVP synthesis, doesn't block user flow
6. **V1 quality standard** - Generated profiles must match curated profile quality
7. **All tabs benefit** - Triggers, Proof, Trends, Competition, Local, Weather

---

## Expected Outcome

After implementation:

1. ✅ NEW specialty profile created per brand (not modifying NAICS profiles)
2. ✅ All 6 tabs receive V1-quality data from specialty profile
3. ✅ Data derived from REAL UVP extraction (no hallucinations)
4. ✅ LLM generates only missing ~30-40% (trends, seasonal, etc.)
5. ✅ Single-pass generation: 5-10 seconds
6. ✅ Works for all 6 business profile types
7. ✅ Graceful fallback to API scraping if no profile exists
8. ✅ Render loop fixed, stable UI
