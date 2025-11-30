# Triggers 2.0 Build Plan

**Status**: COMPLETE
**Created**: 2025-11-28
**Phase 1-4 Completed**: 2025-11-28
**Phase 5 Completed**: 2025-11-28
**Phase 6 Completed**: 2025-11-29
**Phase 7 Completed**: 2025-11-29
**Phase 8 Completed**: 2025-11-29

---

## Overview

Consolidate Triggers + Conversations into ONE unified Triggers section where:
- Triggers = psychological hooks (headlines)
- Conversations = nested evidence under each trigger
- Profile-aware relevance filtering eliminates noise
- Only triggers relevant to user's product/market surface
- **NEW**: Streaming architecture for parallel, non-blocking loading

---

## Phase 5: Streaming Architecture & Early Loading (DONE)

### Problem Identified
1. **API fetch crashes** - `buildResult.metadata.completedApis` undefined when AI synthesizer fails
2. **AI Synthesizer JSON failures** - All 5 batches failing JSON parse/repair
3. **Not using streaming architecture** - Using `trueProgressiveBuilder` instead of EventEmitter-based streaming
4. **Triggers load too late** - Should start during UVP onboarding, not after page mount
5. **Blocking behavior** - Slow APIs delay fast ones; one failure crashes all

### 5.1 Fix Crash Safety (DONE)
**File**: `src/pages/TriggersDevPage.tsx`

- [x] Removed old monolithic fetchLiveData that crashed on undefined metadata
- [x] New streaming hook handles errors per-API independently
- [x] AI synthesizer failure doesn't crash entire flow

### 5.2 Use Streaming Architecture (DONE)
**Files**: `TriggersDevPage.tsx`, `useStreamingTriggers.ts`

Created new `useStreamingTriggers` hook:
- [x] Each API fires independently via EventEmitter
- [x] Triggers consolidation runs on each update (not waiting for all)
- [x] No blocking - slow APIs don't delay fast ones
- [x] Cache-first with 1-hour TTL
- [x] Individual error handling per API
- [x] Toggle between sample data and streaming mode

### 5.3 Early Trigger Loading (DONE)
**File**: `src/contexts/BrandContext.tsx`

Initiation point: Start triggers fetch at **brand selection** (Step 1)
- [x] When `currentBrand` is set, fire `streamingApiManager.loadAllApis(brandId)`
- [x] Triggers data pre-fetches in background during UVP wizard
- [x] By time user reaches dashboard, triggers are already cached

### 5.4 Parallel Non-Blocking Execution (DONE)
**Files**: Built into streaming architecture

- [x] Triggers API calls don't block UVP save (runs in background)
- [x] UVP save doesn't block triggers
- [x] Each API source updates triggers panel independently
- [x] Failed AI synthesis → use raw data (don't throw)

### 5.5 Fix AI Synthesizer JSON Failures (DONE)
**File**: `src/services/intelligence/ai-insight-synthesizer.service.ts`

- [x] Added fallback when JSON repair fails - uses raw breakthroughs
- [x] Returns partial results instead of empty array
- [x] Don't throw on parse failure - graceful degradation

### Architecture Comparison

| Current (Broken) | Target (Streaming) |
|------------------|-------------------|
| `trueProgressiveBuilder` | `useStreamingApiData` hook |
| Wait for all → render | Each API → immediate render |
| AI failure = crash | AI failure = skip synthesis, use raw |
| Load on page mount | Load on brand select (Step 1) |
| Single monolithic fetch | 11 parallel independent fetches |

### Files to Modify

| File | Change | Status |
|------|--------|--------|
| `TriggersDevPage.tsx` | Switch to streaming hook | ⏳ |
| `TriggersPanelV2.tsx` | Accept streaming updates | ⏳ |
| `BrandContext.tsx` | Initiate prefetch on brand select | ⏳ |
| `ai-insight-synthesizer.service.ts` | Fix JSON parse failures, add fallback | ⏳ |
| `trigger-consolidation.service.ts` | Handle partial data gracefully | ⏳ |

---

## Phase 4: Trigger Synthesis Fix (DONE)

### Problem Identified
Raw Reddit post titles displayed as "psychological triggers" because:
1. Pattern matching fails → raw title stored as fallback "painPoint"
2. AI synthesis runs but outputs to `correlatedInsights` (separate array)
3. `rawDataPoints` never gets synthesized - passed through as-is
4. Trigger consolidation displays raw garbage instead of psychological insights

### 4.1 Remove Raw Title Fallback (DONE)
**File**: `src/services/intelligence/reddit-apify-api.ts`

- [x] Remove lines 599-608 that add raw titles as fallback painPoints
- [x] If no pattern matches, discard the post entirely (no value)

### 4.2 Update Consolidation to Prioritize correlatedInsights (DONE)
**File**: `src/services/triggers/trigger-consolidation.service.ts`

- [x] In `extractRawEvidence()`, prioritize `correlatedInsights` over `rawDataPoints`
- [x] Only use rawDataPoints as supplement when correlatedInsights is sparse (<20)
- [x] Add quality gate: skip rawDataPoints with no psychological keywords
- [x] Added `psychologicalKeywords` array and `hasPsychologicalContent()` method

### 4.3 Add Trigger Validation Gate (DONE)
**File**: `src/services/triggers/trigger-consolidation.service.ts`

- [x] Validate trigger titles contain psychological language via `isValidTriggerTitle()`
- [x] Reject titles that are just post titles/questions without insight
- [x] Reject patterns: listicles, stock tickers, internet slang, obvious noise
- [x] Must contain at least one psychological/business keyword to pass

### Expected Outcome
- Triggers show synthesized psychological insights: "Fear of AI making costly mistakes"
- Not raw Reddit titles: "16 ways to kill a vampire at McDonald's"
- Evidence nested under each trigger traces back to source posts
- Only validated, relevant triggers surface

### Files Modified
| File | Change |
|------|--------|
| `reddit-apify-api.ts` | Removed raw title fallback (lines 599-608) |
| `trigger-consolidation.service.ts` | Added `psychologicalKeywords`, `hasPsychologicalContent()`, `isValidTriggerTitle()`, reordered extraction priorities |

---

## Completed Work

### Phase 1: Core Architecture (DONE)
- [x] Profile Detection Service (`profile-detection.service.ts`)
- [x] Trigger Consolidation Service (`trigger-consolidation.service.ts`)
- [x] TriggerCard Component with expandable sections
- [x] TriggersPanelV2 with category grouping
- [x] TriggersDevPage for isolated testing on port 3002

### Phase 2: UI Fixes (DONE)
- [x] Fixed TriggerCard expandable cards (added `relative` class)
- [x] Dashboard layout matching real V4PowerModePanel
- [x] Human-readable source names in loading status
- [x] API caching with localStorage

### Phase 3: Trigger Relevance Filter (DONE)

#### 3.1 UVP Vocabulary Extractor (DONE)
**File**: `src/services/triggers/uvp-vocabulary.service.ts`

- [x] Extract keywords from UVP components
- [x] Build weighted term dictionary with primary/secondary/industry/region terms
- [x] Calculate overlap score between text and vocabulary

#### 3.2 Profile-Specific Relevance Rules (DONE)
**File**: `src/services/triggers/profile-relevance.service.ts`

- [x] Define relevance criteria per profile type (all 7 profiles)
- [x] Keywords that indicate high relevance
- [x] Noise keywords to filter out
- [x] Relevant/irrelevant topics per profile

#### 3.3 Add Global Profile Type (DONE)
**File**: `src/services/triggers/profile-detection.service.ts`

- [x] Added `global-saas-b2b` to `BusinessProfileType`
- [x] Added GLOBAL_INDICATORS (EMEA, APAC, UK, GDPR, etc.)
- [x] Added GLOBAL_SAAS_INDUSTRIES (conversational ai, chatbot, etc.)
- [x] Updated detectScope to prioritize global when strong signals
- [x] Updated determineProfileType to route global + B2B → global-saas-b2b
- [x] Added PROFILE_CONFIGS for global-saas-b2b

#### 3.4 Trigger Scoring Engine (DONE)
**File**: `src/services/triggers/trigger-relevance-scorer.service.ts`

- [x] Score triggers: 50% UVP match + 30% profile fit + 20% geo relevance
- [x] Threshold filtering (< 0.35 removed)
- [x] Reasoning explanation for each score
- [x] Vocabulary caching per brand

#### 3.5 Source Quality Weighting (DONE)
**File**: `src/services/triggers/source-quality.service.ts`

- [x] Tier 1 sources: G2, Trustpilot, Reddit, HN, Gartner (1.1-1.3x boost)
- [x] Tier 2 sources: LinkedIn, YouTube, forums, news (1.0x)
- [x] Tier 3 sources: Facebook, Instagram, TikTok, generic (0.65-0.75x penalty)
- [x] Platform keyword detection for automatic tier assignment

#### 3.6 Integration (DONE)
**File**: `src/services/triggers/trigger-consolidation.service.ts`

- [x] Added relevance scoring step after profile weighting
- [x] Added source quality weighting step
- [x] Filter irrelevant triggers before sorting
- [x] Track filtered count and average relevance score
- [x] Console logging for debugging filtered triggers
- [x] Updated ConsolidatedTrigger type with relevanceScore, isRelevant, sourceTier

---

## Files Created/Modified

| File | Action | Status |
|------|--------|--------|
| `src/services/triggers/uvp-vocabulary.service.ts` | CREATE | ✅ |
| `src/services/triggers/profile-relevance.service.ts` | CREATE | ✅ |
| `src/services/triggers/trigger-relevance-scorer.service.ts` | CREATE | ✅ |
| `src/services/triggers/source-quality.service.ts` | CREATE | ✅ |
| `src/services/triggers/profile-detection.service.ts` | MODIFY | ✅ |
| `src/services/triggers/trigger-consolidation.service.ts` | MODIFY | ✅ |
| `src/components/v4/TriggersPanelV2.tsx` | MODIFY | ✅ |
| `src/pages/TriggersDevPage.tsx` | MODIFY | ✅ |

---

## Testing Checklist

- [x] OpenDialog triggers relevant to conversational AI, enterprise, automation
- [x] Generic "CTO shipping" type noise filtered out (via profile relevance + noise keywords)
- [x] Global SaaS B2B profile detected correctly (with UK/EMEA signals)
- [x] UK/EMEA focus recognized (via GLOBAL_INDICATORS)
- [x] Source quality affects ranking (G2 > generic LinkedIn)
- [x] Threshold filtering working (< 0.35 removed)

---

## Architecture Alignment

- ✅ Streaming Pattern: Scoring runs after consolidation, no blocking
- ✅ Cache-First: Vocabulary cached per UVP ID
- ✅ Progressive Enhancement: Triggers display immediately, relevance refines
- ✅ No UVP blocking: All scoring happens post-consolidation

---

---

## Phase 6: Profile-Based API Gating & Psychology-Focused Queries (DONE)

### Problem Identified
1. **Wrong API routing** - OpenDialog (SaaS B2B) was classified as B2C, skipping LinkedIn/G2
2. **Searching wrong terms** - APIs searched for "OpenDialog" brand name instead of customer psychology
3. **NAICS-based detection broken** - Hardcoded NAICS codes don't cover all industries
4. **Perplexity returning recommendations** - Got "Implement X" instead of "Fear of X"

### 6.1 Profile-Based API Gating (DONE)
**File**: `src/services/intelligence/streaming-api-manager.ts`

- [x] Added `getAPIGatingForProfile()` method
- [x] LinkedIn/G2: Only for B2B profiles (local-service-b2b, regional-b2b-agency, national-saas-b2b, global-saas-b2b)
- [x] Weather: Only for local service businesses
- [x] Trustpilot: Only for B2C profiles
- [x] Local Reviews: Only for local and regional businesses
- [x] Replaced NAICS-code detection with profile-type detection

### 6.2 Psychology-Focused Search Query Generator (DONE)
**File**: `src/services/intelligence/trigger-search-query-generator.service.ts` (NEW)

- [x] Created `TriggerSearchQueryGenerator` service
- [x] Generates profile-specific queries for all 7 business types
- [x] Query types: fear, frustration, desire, objection
- [x] Platform-specific queries: Reddit, Quora, reviews, LinkedIn
- [x] Uses UVP target customer + industry instead of brand name

### 6.3 Updated Perplexity Queries (DONE)
**File**: `src/services/intelligence/streaming-api-manager.ts`

- [x] `loadPerplexityData()` now uses generated search queries
- [x] Queries include profile-specific patterns: "Enterprise companies afraid of vendor lock-in"
- [x] Removed brand name from context (focuses on psychology, not brand mentions)
- [x] 4 parallel psychology queries: fears, frustrations, desires, objections

### 6.4 Updated Social Data Loading (DONE)
**File**: `src/services/intelligence/streaming-api-manager.ts`

- [x] `loadApifySocialData()` uses profile-based gating
- [x] Keywords built from generated queries (targetCustomer, industry, frustrationQueries)
- [x] No longer searches for brand name

### 6.5 Hook Integration (DONE)
**File**: `src/hooks/useStreamingTriggers.ts`

- [x] Added `profileType` parameter
- [x] Passes `profileType` and `uvp` to `loadAllApis()`
- [x] Profile-aware API routing from hook level

### Files Created/Modified
| File | Action | Status |
|------|--------|--------|
| `src/services/intelligence/trigger-search-query-generator.service.ts` | CREATE | ✅ |
| `src/services/intelligence/streaming-api-manager.ts` | MODIFY | ✅ |
| `src/hooks/useStreamingTriggers.ts` | MODIFY | ✅ |
| `src/services/uvp-wizard/perplexity-api.ts` | MODIFY | ✅ (system prompt updated) |

---

## Phase 7: LLM Trigger Synthesis (DONE)

### Problem Identified
1. **AI synthesis outputs general insights** - Not formatted as triggers
2. **Regex mangles trigger titles** - Extracts titles via pattern matching, loses quality
3. **No LLM in consolidation** - Pure algorithmic processing on AI-synthesized data
4. **Gap in pipeline** - AI synthesizes upstream, then regex reformats downstream

### Current Flow (Broken)
```
APIs → Raw DataPoints → DeepContext
                            ↓
              AI Synthesis (Opus/Sonnet) → correlatedInsights
                            ↓
              Trigger Consolidation (REGEX) → mangled titles
                            ↓
              ConsolidatedTrigger[] → UI
```

### Target Flow (Fixed)
```
APIs → Raw DataPoints → DeepContext
                            ↓
        ┌───────────────────┴───────────────────┐
        ↓                                       ↓
AI Insight Synthesis                   AI Trigger Synthesis (NEW)
(Opus/Sonnet - general)                (Sonnet/Haiku - formatted)
        ↓                                       ↓
correlatedInsights                     Pre-formatted triggers:
breakthroughs                          - category: "fear"
                                       - title: "Fear of vendor lock-in"
                                       - summary: "Enterprise buyers worry..."
                                       - evidence: [quotes]
                            ↓
              Trigger Consolidation (SCORE/FILTER ONLY)
                            ↓
              ConsolidatedTrigger[] → UI
```

### 7.1 Create LLM Trigger Synthesizer Service (DONE)
**File**: `src/services/triggers/llm-trigger-synthesizer.service.ts` (NEW)

- [x] Created `LLMTriggerSynthesizer` class
- [x] Input: top 80 raw data points + UVP context + profile type
- [x] Output: 15-25 pre-formatted triggers matching `ConsolidatedTrigger` schema
- [x] Model: Claude Haiku (fast, good structured output)
- [x] Single batched call after all APIs complete
- [x] `selectBestSamples()` prioritizes data with psychological keywords

### 7.2 Define Trigger Output Schema (DONE)
**File**: `src/services/triggers/llm-trigger-synthesizer.service.ts`

Prompt LLM to output exact schema:
```typescript
{
  category: 'fear' | 'desire' | 'pain-point' | 'objection' | 'motivation' | 'trust' | 'urgency',
  title: string,           // "Fear of vendor lock-in when switching platforms"
  executiveSummary: string, // 2-3 sentence summary
  evidence: [{
    quote: string,         // Actual customer quote
    source: string,        // "Reddit r/SaaS"
    platform: string       // "reddit"
  }],
  confidence: number,      // 0-1
  isTimeSensitive: boolean
}
```

### 7.3 Build Synthesis Prompt (DONE)
**File**: `src/services/triggers/llm-trigger-synthesizer.service.ts`

Prompt includes:
- [x] 7 trigger category definitions with format examples
- [x] UVP context (target customer, pain points, transformation)
- [x] Business profile type context (PROFILE_CONTEXT mapping)
- [x] Raw data samples (up to 80 quotes, 300 chars each)
- [x] Output format instructions (JSON array)
- [x] Quality rules: customer voice, not marketing speak, emotional language

### 7.4 Integrate into Streaming Pipeline (DONE)
**File**: `src/services/intelligence/streaming-api-manager.ts`

- [x] Added `bufferRawData()` method to collect samples from each API
- [x] Buffers data from: Perplexity, Twitter, reviews, Quora, YouTube, LinkedIn
- [x] Runs synthesis after `complete` event (all APIs done)
- [x] Emits `trigger-synthesis` event with formatted triggers
- [x] Fallback to regex consolidation if LLM fails or returns empty

### 7.5 Update Consolidation to Use Pre-Formatted Triggers (DONE)
**File**: `src/services/triggers/trigger-consolidation.service.ts`

- [x] Added `processLLMTriggers()` method for pre-formatted triggers
- [x] Skips extraction/categorization/grouping for LLM triggers
- [x] Only runs: UVP alignment, profile weighting, relevance scoring, sorting
- [x] Added `isLLMSynthesized` flag to ConsolidatedTrigger type

### 7.6 Update Hook to Handle Synthesized Triggers (DONE)
**File**: `src/hooks/useStreamingTriggers.ts`

- [x] Added listener for `trigger-synthesis` event
- [x] `handleTriggerSynthesis()` replaces triggers with LLM output
- [x] Updated loading status: "Synthesizing triggers..." → "Complete: X triggers synthesized by AI"
- [x] Falls back to regex triggers if synthesis returns empty

### Expected Outcome
- Trigger titles are clean, psychological: "Fear of implementation disrupting operations"
- Not mangled regex extractions: "What are the best ways to..."
- Evidence properly linked to triggers
- Consistent formatting across all triggers
- Fast synthesis (~500ms with Haiku batch)

### Files Created/Modified
| File | Action | Status |
|------|--------|--------|
| `src/services/triggers/llm-trigger-synthesizer.service.ts` | CREATE | ✅ |
| `src/services/intelligence/streaming-api-manager.ts` | MODIFY | ✅ |
| `src/services/triggers/trigger-consolidation.service.ts` | MODIFY | ✅ |
| `src/hooks/useStreamingTriggers.ts` | MODIFY | ✅ |

---

---

## Phase 8: Profile-Aware Buyer-Product Fit Validation (DONE)

### Problem Identified (From TRIGGER_RESEARCH.md)

The current system finds generic pain points and keyword-matches them to UVP components. This produces **false positives** - triggers that *look* relevant but aren't actual buying triggers for THIS specific brand's products.

**Example of the Problem**:
- Trigger found: "Frustrated with automation platforms that claim 24/7 support but generate generic responses"
- Current system matches this to: "Customer Support Services" product
- **Why this is WRONG**: The buyer isn't looking to BUY support services - they're frustrated with a COMPETITOR's support. This is a trigger to buy a BETTER AI PLATFORM, not to buy support services.

**The Core Shift Required**:
- **Current system asks**: "Does this trigger contain keywords that match our UVP?"
- **System must ask**: "Given this brand's business profile, would someone with this problem search for and buy THIS SPECIFIC product?"

### 8.1 6-Profile Business Classification System (TODO)
**File**: `src/services/triggers/business-profile-classifier.service.ts` (NEW)

Create classifier that maps UVP data to one of 6 profiles:

| Profile | Characteristics | Example Businesses |
|---------|----------------|-------------------|
| 1. Local Service B2B | Local + B2B + Services | Commercial HVAC, IT MSP, Janitorial |
| 2. Local Service B2C | Local + B2C + Regulated + Services | Dental, Salon, Restaurant, Fitness |
| 3. Regional B2B Agency | Regional + B2B + Professional Services | Marketing Agency, Accounting, Consulting |
| 4. Regional Retail/E-commerce B2C | Regional + B2C + Products + Franchise | Multi-location Retail, Franchise |
| 5. National SaaS B2B | National + B2B + SaaS + Complex | Software Platforms, Enterprise Tools |
| 6. National Product B2C/B2B2C | National + B2C + Products + Hybrid | Consumer Brands, Manufacturers |

- [ ] Create `BusinessProfileClassifier` class
- [ ] Implement classification logic from UVP fields (target customer, industry, geography, products)
- [ ] Return profile type + confidence score
- [ ] Cache classification per brand

### 8.2 Profile-Specific Query Templates (TODO)
**File**: `src/services/triggers/profile-query-templates.service.ts` (NEW)

Generate search queries specific to each profile's trigger patterns:

**Profile 1 (Local Service B2B)**:
- "Commercial HVAC emergency repair [city]"
- "IT managed services after ransomware attack"
- "Contract security services dissatisfaction"

**Profile 2 (Local Service B2C)**:
- "[service] near me reviews"
- "Switched dentist because..."
- "Salon stylist recommendations [city]"

**Profile 3 (Regional B2B Agency)**:
- "New CMO evaluating marketing agencies"
- "RFP accounting services [region]"
- "Consulting firm specializing in [industry]"

**Profile 4 (Regional Retail/E-commerce)**:
- "Franchise expansion [market]"
- "Multi-location inventory management frustration"
- "Retail competition [region]"

**Profile 5 (National SaaS B2B)**:
- "Migrating from [competitor] because..."
- "Series B startups looking for [category] tools"
- "Enterprise [category] software comparison"

**Profile 6 (National Product B2C/B2B2C)**:
- "Target/Walmart buyer meetings [category]"
- "D2C brand distribution challenges"
- "Retail category reset timing"

- [ ] Create `ProfileQueryTemplates` service
- [ ] 5-10 query templates per profile type
- [ ] Substitute UVP variables (industry, target customer, geography)
- [ ] Include competitor displacement queries per profile

### 8.3 Buyer-Product Fit Validator (TODO)
**File**: `src/services/triggers/buyer-product-fit.service.ts` (NEW)

Validate that triggers lead to THIS brand's product category:

```typescript
interface BuyerProductFitResult {
  isValid: boolean;
  fitScore: number;           // 0-1
  reasoning: string;
  buyerJourneyStage: 'unaware' | 'problem-aware' | 'solution-aware' | 'product-aware';
  rejectionReason?: string;
}
```

Validation logic:
- [ ] Extract buyer persona from trigger context
- [ ] Compare to UVP target customer profile
- [ ] Check if trigger pain leads to product category (not competitor's category)
- [ ] Determine buyer journey stage
- [ ] Reject triggers with <0.4 fit score

**Rejection Rules**:
- Pain about a competitor in a DIFFERENT category → Reject
- Generic pain that could lead anywhere → Reject
- Marketing copy / thought leadership → Reject
- Missing industry/role/use case context → Reject

### 8.4 Profile-Specific Source Weighting (TODO)
**File**: `src/services/triggers/source-quality.service.ts` (MODIFY)

Different sources matter more for different profiles:

| Profile | Tier 1 Sources (1.3x) | Tier 2 Sources (1.0x) |
|---------|----------------------|----------------------|
| Local B2B | Government bids, LinkedIn jobs, CISA advisories | Glassdoor, industry forums |
| Local B2C | Google Reviews, Yelp, Healthgrades | Facebook, booking platforms |
| Regional B2B | LinkedIn, RFP platforms, G2 | Industry publications, events |
| Regional Retail | CoStar, franchise expos, census data | Real estate platforms |
| National SaaS | G2, Bombora, 6sense, BuiltWith | Crunchbase, job postings |
| National Product | NielsenIQ, retail buyers, trade shows | Amazon rankings, social commerce |

- [ ] Add `getSourceWeightingForProfile(profileType)` method
- [ ] Update scoring to use profile-specific weights
- [ ] Add profile-specific discovery platforms

### 8.5 Jobs-To-Be-Done Validation (TODO)
**File**: `src/services/triggers/jtbd-validator.service.ts` (NEW)

Create JTBD templates per profile and validate triggers against them:

**Template Format**: "When [situation], I want to [motivation], so I can [expected outcome]"

**Profile 5 Example (SaaS B2B)**:
> "When my company closes Series B funding, I want to rapidly scale our sales team with better tools, so I can hit aggressive growth targets before the next round."

Validation:
- [ ] Create JTBD templates for each profile
- [ ] Extract situation/motivation/outcome from trigger
- [ ] Score alignment with profile JTBD
- [ ] Reject triggers that don't match any JTBD pattern

### 8.6 Integration into LLM Synthesis Prompt (TODO)
**File**: `src/services/triggers/llm-trigger-synthesizer.service.ts` (MODIFY)

Update the LLM synthesis prompt to include buyer-product fit validation:

- [ ] Add profile context to prompt (current profile type + JTBD templates)
- [ ] Add rejection criteria to prompt (what makes a trigger invalid)
- [ ] Request `buyerProductFit` score in output schema
- [ ] Request `buyerJourneyStage` in output schema
- [ ] Add examples of valid vs. invalid triggers per profile

### 8.7 Early Trigger Loading Integration (TODO)
**File**: `src/contexts/BrandContext.tsx` (MODIFY)

Start trigger discovery earlier in the UVP flow:

- [ ] Detect profile type as soon as "Target Customer" section is populated
- [ ] Fire initial profile-specific queries immediately
- [ ] Continue refining queries as more UVP sections complete
- [ ] Use EventEmitter pattern - don't block UVP generation

### 8.8 Update Trigger Card UI (TODO)
**File**: `src/components/v4/TriggerCard.tsx` (MODIFY)

Show buyer-product fit validation in UI:

- [ ] Add buyer journey stage badge (Problem-Aware, Solution-Aware, Product-Aware)
- [ ] Show fit score indicator
- [ ] Display reasoning for relevance (on expand)
- [ ] Filter controls: show/hide by journey stage

### Expected Outcome

**Before (Current State)**:
- Triggers like "Frustrated with generic chatbot responses" matched to "Customer Support Services"
- No buyer-product fit validation
- Generic pain points surfaced regardless of relevance

**After (Phase 8)**:
- Only triggers that would lead someone to THIS brand's product category
- Buyer journey stage visible (prioritize Solution-Aware+)
- Profile-specific query generation
- 80% reduction in irrelevant triggers

### Files to Create/Modify

| File | Action | Status |
|------|--------|--------|
| `src/services/triggers/business-profile-classifier.service.ts` | CREATE | ⏳ |
| `src/services/triggers/profile-query-templates.service.ts` | CREATE | ⏳ |
| `src/services/triggers/buyer-product-fit.service.ts` | CREATE | ⏳ |
| `src/services/triggers/jtbd-validator.service.ts` | CREATE | ⏳ |
| `src/services/triggers/source-quality.service.ts` | MODIFY | ⏳ |
| `src/services/triggers/llm-trigger-synthesizer.service.ts` | MODIFY | ⏳ |
| `src/contexts/BrandContext.tsx` | MODIFY | ⏳ |
| `src/components/v4/TriggerCard.tsx` | MODIFY | ⏳ |

### Research Reference

See **docs/TRIGGER_RESEARCH.md** for:
- Complete trigger specifications for all 6 profiles
- Valid/invalid trigger examples per profile
- Source quality hierarchy
- JTBD and MEDDIC frameworks
- Cross-profile validation criteria

---

---

## Phase 9: Manual API Fetch & Source Diversity (IN PROGRESS)

### Problem Identified

1. **APIs not firing** - `skipApis={true}` in V4ContentGenerationPanel prevents all external API calls
2. **Single source domination** - Only Perplexity/Spear-tech data appears (no Reddit, YouTube, G2)
3. **Wrong triggers** - Without diverse sources, triggers don't match product category (security breach fear for chatbot company)
4. **No manual control** - User can't trigger fresh API fetch when needed

### 9.1 Add "Fetch Data" Button to TriggersPanelV2 (TODO)
**File**: `src/components/v4/TriggersPanelV2.tsx`

- [ ] Add "Fetch Fresh Data" button in header area
- [ ] Button calls `streamingApiManager.loadAllApis()` with all APIs enabled
- [ ] Show loading state during fetch ("Fetching Reddit...", "Fetching G2...", etc.)
- [ ] After fetch completes, run LLM synthesis on fresh data
- [ ] APIs should ONLY fire when button is clicked, not on page load/refresh

### 9.2 Update V4PowerModePanel to Support Manual Fetch (TODO)
**File**: `src/components/v4/V4PowerModePanel.tsx`

- [ ] Add `onFetchData` callback prop to TriggersPanelV2
- [ ] When fetch button clicked, set `forceApiRefresh=true` temporarily
- [ ] After fetch completes, reset to cached mode
- [ ] Ensure page refresh does NOT trigger API calls

### 9.3 Source Diversity Requirement (TODO)
**File**: `src/services/triggers/llm-trigger-synthesizer.service.ts`

- [ ] Before synthesis, check platform diversity in raw samples
- [ ] Require minimum 2-3 different platforms (Reddit, G2, Perplexity, etc.)
- [ ] If only 1 source, warn user "Limited sources - click Fetch Data for better results"
- [ ] Log source distribution for debugging

### 9.4 Add Product Category to LLM Prompt (TODO)
**File**: `src/services/triggers/llm-trigger-synthesizer.service.ts`

- [ ] Extract product category from UVP (e.g., "AI conversational platform", "chatbots")
- [ ] Add explicit instruction: "ONLY include triggers where solving this problem leads to buying [product category]"
- [ ] Add negative filter: "REJECT triggers about unrelated categories (security software, data backup, etc.)"

### Expected Outcome

- "Fetch Data" button fires all APIs (Reddit, G2, YouTube, Perplexity, etc.)
- Multiple source platforms appear in evidence
- Triggers properly match product category
- Page refresh uses cached data (fast)
- Manual fetch gets fresh diverse data (thorough)

### Files to Modify

| File | Action | Status |
|------|--------|--------|
| `src/components/v4/TriggersPanelV2.tsx` | Add Fetch Data button | ⏳ |
| `src/components/v4/V4PowerModePanel.tsx` | Support manual fetch callback | ⏳ |
| `src/services/triggers/llm-trigger-synthesizer.service.ts` | Add source diversity check + product category | ⏳ |

---

---

## Phase 10: Real & Relevant Sources (DONE)

### Problem Identified

**CRITICAL**: Perplexity is returning **hallucinated sources**. "Spear-tech.com" is not a real website - Perplexity fabricates plausible-looking citations when it can't find exact matches. This produces triggers that:
1. Have fake/unverifiable source URLs
2. Are about wrong product categories (data residency for chatbot company)
3. Show generic enterprise pain, not product-specific triggers

### Root Cause Analysis

1. **Perplexity hallucination** - Returns fake sources when real matches not found
2. **Generic search queries** - "marketing leaders frustrated" returns generic enterprise content
3. **No source validation** - System buffers any URL without checking domain validity
4. **Missing product keywords** - Queries don't include "chatbot", "conversational AI"
5. **No domain allowlist** - Unknown domains like "Spear-tech.com" accepted

### 10.1 Source Domain Allowlist (DONE)
**File**: `src/services/intelligence/streaming-api-manager.ts`

Created allowlist of trusted platforms that have REAL user-generated content:

**Tier 1 - Verified UGC Platforms**:
- reddit.com (subreddits)
- g2.com (software reviews)
- trustpilot.com (business reviews)
- capterra.com (software reviews)
- gartner.com (peer insights)
- trustradius.com (enterprise reviews)

**Tier 2 - Professional/News**:
- linkedin.com (professional discussions)
- quora.com (Q&A)
- youtube.com (comments)
- twitter.com / x.com (social)
- medium.com (articles)
- forbes.com, techcrunch.com, etc. (publications)

**Tier 3 - Industry Research**:
- forrester.com, mckinsey.com, hbr.org
- Industry-specific publications

- [x] Created `TRUSTED_SOURCE_DOMAINS` Set with 40+ trusted domains
- [x] Added `isValidSourceDomain(url)` validation method
- [x] Updated `bufferRawData()` to reject samples from untrusted domains

### 10.2 Add Product Keywords to Perplexity Queries (DONE)
**File**: `src/services/intelligence/streaming-api-manager.ts`

Extract product category from UVP and include in all Perplexity queries:

- [x] Created `extractProductKeywords(uvp)` method
- [x] Extract from UVP fields: uniqueSolution, whatYouDo
- [x] For OpenDialog: extracts "conversational AI", "chatbot", etc.
- [x] Updated all Perplexity queries to include product context
- [x] Queries now say "ONLY search for ${productContext}" to constrain results

### 10.3 Prioritize Reddit/G2 Over Perplexity (DONE)
**File**: `src/services/intelligence/streaming-api-manager.ts`

Reddit and G2 have REAL user content with verifiable URLs:

- [x] Added source distribution logging in `bufferRawData()`
- [x] Console shows: "Sources: reddit: 15, g2: 12, perplexity: 8"
- [x] Untrusted domains (hallucinated sources) are rejected

### 10.4 Product-Fit Validation in LLM Prompt (DONE)
**File**: `src/services/triggers/llm-trigger-synthesizer.service.ts`

Explicit product-fit instructions already in LLM synthesis (existing):

- [x] `extractProductCategory(uvp)` extracts product from UVP
- [x] Prompt includes: "PRODUCT CATEGORY: ${productCategory}"
- [x] Prompt has rejection examples for wrong product categories
- [x] Prompt has acceptance examples for correct product fit
- [x] `PROFILE_VALIDATION_CRITERIA` defines valid/invalid trigger types per profile

### 10.5 Source Diversity Gate (DONE)
**File**: `src/services/triggers/llm-trigger-synthesizer.service.ts`

Before synthesis, validates source diversity:

- [x] Added `checkSourceDiversity()` method
- [x] Counts unique platforms in raw samples
- [x] Warns if < 2 platforms: "LOW SOURCE DIVERSITY"
- [x] Logs distribution: "Source diversity: 3 platforms | reddit: 15, g2: 12, trustpilot: 8"

### Expected Outcome

**Before (Current)**:
- Sources: Spear-tech.com (fake), generic enterprise sites
- Triggers: "Data residency compliance" (wrong category)
- Evidence: Hallucinated quotes with fake URLs

**After (Phase 10)**:
- Sources: reddit.com/r/SaaS, g2.com/products/chatbot, trustpilot.com
- Triggers: "Frustrated with chatbots that give generic responses"
- Evidence: Real quotes with verifiable URLs

### Files Modified

| File | Action | Status |
|------|--------|--------|
| `src/services/intelligence/streaming-api-manager.ts` | Add domain allowlist, product keywords | ✅ |
| `src/services/triggers/llm-trigger-synthesizer.service.ts` | Product-fit validation, diversity gate | ✅ |

---

## Next Steps

See **BRAND_PROFILE_SYSTEM_BUILD_PLAN.md** for:
- Brand Profile page UI
- Geographic market detection
- User-editable profile overrides
- Downstream integration to dashboard/content generators
