# Trigger Quality Enhancement Plan

**Created:** 2025-12-01
**Branch:** `feature/uvp-sidebar-ui`
**Status:** In Progress

---

## Overview

Enhance trigger quality across all 6 business profile categories with UVP-aligned psychological triggers, verified multi-source evidence, and V4 card UI.

---

## Current Problems

1. **V4 Cards Not Rendering** - Syntax error on line 512 of InsightTabs.tsx
2. **Low Trigger Count** - Only 11 triggers (target: 30-50)
3. **Poor UVP Alignment** - Generic AI complaints, not product-specific
4. **Missing Categories** - Only 3/7 psychological categories present
5. **Source Imbalance** - Reddit over-indexed, other sources underused

---

## The 6 Business Profile Categories

| # | Profile | Trigger Focus | Evidence Sources | UVP Emphasis |
|---|---------|---------------|------------------|--------------|
| 1 | **Local Service B2B** | Reliability, Downtime Fear, Compliance | Google Reviews, Industry Forums, Local LinkedIn | Response Time, SLAs, Local Reputation |
| 2 | **Local Service B2C** | Trust/Safety, Convenience, Price Anxiety | Google Reviews, Yelp, Facebook, NextDoor | Proximity, Reviews, Personal Touch |
| 3 | **Regional B2B Agency** | ROI Skepticism, Expertise Doubt, Past Failures | LinkedIn, Clutch/G2, Case Studies | Results, Industry Expertise, Process |
| 4 | **Regional Retail B2C** | Availability, Consistency, Value | Google Reviews, Social, Local News | Locations, Promotions, Brand Trust |
| 5 | **National SaaS B2B** | Integration Fear, Adoption Risk, Vendor Lock-in | G2, Reddit, HackerNews, LinkedIn | Security, Support, Migration Path |
| 6 | **National Product B2C** | Quality Doubt, Comparison Shopping, Social Proof | Amazon Reviews, TikTok, Influencer, Reddit | Differentiation, Social Proof, Value |

---

## The 7 Psychological Trigger Categories

1. **Pain Point** - Frustrations and struggles
2. **Fear** - Anxieties and concerns
3. **Desire** - Wants and aspirations
4. **Objection** - Hesitations and doubts
5. **Motivation** - Drivers and incentives
6. **Trust** - Credibility and reliability concerns
7. **Urgency** - Time-sensitive factors

---

## Build Phases

### Phase A: Fix V4 Cards UI ✅ COMPLETE
- [x] Verified syntax on line 512 of InsightTabs.tsx (no error found - comment is valid)
- [x] Verified TriggerCardV4 and TriggerFilters are properly imported (lines 38-40)
- [x] Verified V4 components render when `activeFilter === 'triggers'` (lines 511-543)
- [x] Verified conversion function `insightsToConsolidatedTriggers()` exists (lines 167-214)
- [ ] Runtime testing needed to confirm filter functionality

**Files:**
- `src/components/v5/InsightTabs.tsx` - V4 integration complete
- `src/components/v5/TriggerCardV4.tsx` - Component exists (10KB)
- `src/components/v5/TriggerFilters.tsx` - Component exists (13KB)
- `src/components/v5/SourceLink.tsx` - Component exists (10KB)

**Note:** If V4 cards don't render, the issue is likely:
1. User not on "Triggers" tab (V4 only shows there)
2. Insights passed have `type !== 'trigger'` falling through to standard cards

---

### Phase B: Profile-Aware Source Gating ✅ COMPLETE
- [x] Implemented `getEnabledApis(profileType)` method in profile-detection.service.ts
- [x] Implemented `shouldRunApi(profileType, apiType)` gate function
- [x] Implemented `getApiWeight(profileType, apiType)` for priority weighting
- [x] Implemented `getApiPriorityOrder(profileType)` for API call ordering
- [x] Created `PROFILE_API_GATING` config with enabled/disabled/priority per profile:
  - Local B2B → Google Reviews, LinkedIn, Industry Forums, BBB, Yelp, Reddit
  - Local B2C → Google Reviews, Yelp, Facebook, NextDoor, Reddit, Local News, Instagram
  - Regional B2B Agency → LinkedIn, Clutch, G2, Reddit, Industry Forum, Google Reviews
  - Regional Retail B2C → Google Reviews, Facebook, Yelp, Reddit, Local News, Instagram
  - National SaaS B2B → G2, Capterra, Reddit, HackerNews, LinkedIn, TrustRadius, YouTube, Trustpilot
  - National Product B2C → Reddit, Amazon Reviews, YouTube, TikTok, Instagram, Trustpilot, Twitter
  - Global SaaS B2B → G2, Gartner, Forrester, LinkedIn, Reddit, HackerNews, Capterra, Trustpilot

**Files:**
- `src/services/triggers/profile-detection.service.ts` - Added API gating functions (lines 573-720)

---

### Phase C: Profile-Specific Query Generation ✅ COMPLETE
- [x] Generate search queries per profile using TriggerSearchQueryGeneratorService
- [x] Add profile-specific trigger events:
  - Local B2B: Equipment failure, compliance deadlines, contract cycles
  - Local B2C: Bad reviews, life events, provider changes
  - Regional B2B: Leadership changes, RFP windows, budget cycles
  - National SaaS: Funding rounds, hiring surges, tech stack changes
  - National B2C: Influencer mentions, comparison shopping, seasonal demand
  - Global SaaS: GDPR compliance, data residency, global rollouts
- [x] Use high-intent language patterns in queries
- [x] Added `PROFILE_TRIGGER_EVENT_PATTERNS` constant with triggerEvents, highIntentSignals, seasonalTriggers per profile
- [x] Updated `TriggerSearchQueries` interface with triggerEventQueries, highIntentQueries, seasonalQueries
- [x] Updated `generateQueries()` to generate trigger event queries
- [x] Updated `getPerplexityContext()` to include trigger event context

**Files:**
- `src/services/intelligence/trigger-search-query-generator.service.ts` - Added PROFILE_TRIGGER_EVENT_PATTERNS (lines 114-283)

---

### Phase D: Multi-Signal Triangulation ✅ COMPLETE
- [x] Add `sourceType` field to RawDataSample: voc, community, event, executive, news (already existed at line 39-40)
- [x] Implemented `PLATFORM_TO_SOURCE_TYPE` mapping for 30+ platforms across 5 source types
- [x] Implemented `inferSourceType()` function with fuzzy matching
- [x] Implemented `calculateTriangulationMultiplier()`:
  - 3+ source types = 1.3x confidence multiplier (high triangulation)
  - 2 source types = 1.15x multiplier (moderate triangulation)
  - Single source = 0.9x (lower confidence - may be echo chamber)
- [x] Applied triangulation multiplier in `convertToConsolidatedTriggers()`
- [x] Added triangulation logging and stats tracking
- [x] Added `sourceTypeCount` and `triangulationMultiplier` fields to `ConsolidatedTrigger` interface

**Files:**
- `src/services/triggers/llm-trigger-synthesizer.service.ts` - Added lines 89-193 (source type mapping and triangulation logic)
- `src/services/triggers/trigger-consolidation.service.ts` - Added fields to ConsolidatedTrigger interface (lines 89-92)

---

### Phase E: Improve LLM Synthesis Across Profiles ✅ COMPLETE
- [x] Add profile-specific LLM prompts with context
  - Added `PROFILE_TRIGGER_EMPHASIS` constant (lines 253-321) with per-profile config:
    - primaryCategories, secondaryCategories for each profile type
    - typicalFears, typicalDesires, typicalPainPoints per profile
    - buyerTerms for audience targeting
- [x] Fix semantic inversion (complaints ≠ desires)
  - Added `SEMANTIC_INVERSION_RULES` constant (lines 324-349)
  - Patterns to detect complaint→pain-point, desire→complaint, fear inversions
  - Added `correctSemanticInversions()` method (lines 1291-1344)
  - Applied correction after LLM synthesis (line 1276)
- [x] Include competitor name in titles when known
  - Added guidance in LLM prompt to reference competitor names
- [x] Apply JTBD validation per profile type
  - Leverages existing PROFILE_VALIDATION_CRITERIA in trigger-consolidation.service.ts
- [x] Ensure all 7 trigger categories synthesized
  - Updated `buildPrompt()` to require all 7 categories with quotas (4-5 each)
  - Added category-specific prompting guidance in profile emphasis section

**Files:**
- `src/services/triggers/llm-trigger-synthesizer.service.ts` - Added PROFILE_TRIGGER_EMPHASIS, SEMANTIC_INVERSION_RULES, correctSemanticInversions()

---

### Phase F: UVP Alignment Scoring ✅ COMPLETE
- [x] Score each trigger against brand UVP keywords
  - Added `uvpAlignmentScore` field (0-1) - average of all UVP component match scores
  - Added `uvpAlignmentCount` field (0-4) - number of UVP components matched
  - Added `isHighUVPAlignment` field - true when score >= 0.5 with 2+ alignments
- [x] Implement profile-specific buyer-product fit validation
  - Leverages existing `calculateUVPAlignment()` which checks against target_customer, key_benefit, transformation, unique_solution
- [x] Add UVP match indicator to TriggerCardV4
  - Added emerald "UVP Match" badge in header when `isHighUVPAlignment === true`
- [x] Surface high-alignment triggers first in UI
  - Updated `sortTriggers()` to prioritize isHighUVPAlignment triggers first
  - Added uvpAlignmentScore with 20% weight to composite relevance score

**Files:**
- `src/services/triggers/trigger-consolidation.service.ts` - Added uvpAlignmentScore, uvpAlignmentCount, isHighUVPAlignment fields (lines 93-98), updated calculateUVPAlignment() and sortTriggers()
- `src/components/v5/TriggerCardV4.tsx` - Added UVP Match badge (lines 222-227)

---

### Phase G: Source Quality Multipliers ✅ COMPLETE
- [x] Implement profile-specific source weights in source-quality.service.ts:
  - Already had `PROFILE_SOURCE_WEIGHTS` with tier1/tier2/tier3 sources per profile
  - tier1=1.3x, tier2=1.0x, tier3=0.6x profile-specific multipliers
  - `getProfileAwareQualityAdjustment()` returns profile-specific weights
- [x] Weight evidence by source relevance to profile
  - Enhanced `applySourceQualityWeighting()` to weight ALL evidence items (not just primary)
  - Calculates weighted average multiplier across all evidence
  - Tracks tier distribution (tier1Count, tier2Count, tier3Count)
  - Determines dominant tier based on evidence distribution
- [x] Apply multipliers during consolidation
  - Added `sourceQualityMultiplier` field to ConsolidatedTrigger interface
  - Adjusts `relevanceScore` based on average profile-specific source quality
  - Added debug logging for first 3 triggers

**Files:**
- `src/services/triggers/source-quality.service.ts` - Already had PROFILE_SOURCE_WEIGHTS and getProfileAwareQualityAdjustment()
- `src/services/triggers/trigger-consolidation.service.ts` - Enhanced applySourceQualityWeighting() (lines 1993-2054), added sourceQualityMultiplier field (line 100)

---

### Phase H: Category Balancing Per Profile ✅ COMPLETE
- [x] Add profile-specific category quotas
  - Added `PROFILE_CATEGORY_WEIGHTS` constant with primaryCategories, secondaryCategories, and minTriggersPerCategory for all 7 profiles
- [x] Weight categories by profile:
  - Local B2C: Trust/Safety weighted higher (primaryCategories: trust, fear, desire)
  - National SaaS: Integration Fear/Vendor Lock-in weighted higher (primaryCategories: fear, objection, trust)
  - Primary categories get 1.25x weight boost
  - Secondary categories get 1.1x weight boost
  - Tertiary categories get 1.0x (no boost)
- [x] Track category weighting on ConsolidatedTrigger
  - Added `categoryWeightMultiplier` field (1.25, 1.1, or 1.0)
  - Added `isPrimaryCategory` field (boolean)
  - Added `isCategoryFill` field (boolean) - marks boosted triggers
- [x] Implemented `applyCategoryWeighting()` method
- [x] Implemented `analyzeCategoryDistribution()` returning `CategoryGapAnalysis`:
  - `underrepresentedCategories` - categories below minimum
  - `categoryGaps` - how many triggers each category needs
  - `totalGap` - total missing triggers
  - `needsRebalancing` - boolean flag
- [x] Implemented `enforceCategoryMinimums()` method:
  - Detects underrepresented categories
  - Boosts relevance (1.5x) for triggers in underrepresented categories
  - Marks boosted triggers with `isCategoryFill: true`
  - Logs rebalancing actions
- [x] Updated `sortTriggers()` to prioritize primary category triggers
- [x] Wired enforcement into consolidation pipeline (steps 6-7)

**Files:**
- `src/services/triggers/trigger-consolidation.service.ts` - Added PROFILE_CATEGORY_WEIGHTS, CategoryGapAnalysis interface, applyCategoryWeighting(), analyzeCategoryDistribution(), enforceCategoryMinimums(), updated pipeline

---

## Target Outcome

- 30-50 UVP-aligned triggers per brand
- Scaled across all 6 business profiles
- All 7 psychological categories represented
- Verified multi-source evidence
- Displayed in V4 card format with expandable sources

---

## Progress Log

| Date | Phase | Status | Notes |
|------|-------|--------|-------|
| 2025-12-01 | Plan Created | ✅ | Documented in .buildrunner |
| 2025-12-01 | Phase A | ✅ | V4 Cards UI verified - no syntax errors, proper imports |
| 2025-12-01 | Phase B | ✅ | Profile-Aware Source Gating - Added API gating functions to profile-detection.service.ts |
| 2025-12-01 | Phase C | ✅ | Profile-Specific Query Generation - Added PROFILE_TRIGGER_EVENT_PATTERNS with trigger events, high-intent signals, and seasonal triggers for all 7 profiles |
| 2025-12-01 | Phase B Wiring | ✅ | Wired Phase B gating into streaming-api-manager.ts - Now uses shouldRunApi(), getApiPriorityOrder(), getApiWeight() from profile-detection.service.ts |
| 2025-12-01 | Phase C Wiring | ✅ | Wired Phase C queries into Perplexity context - Added triggerEventQueries and highIntentQueries to psychologyQueries array |
| 2025-12-01 | Phase D | ✅ | Multi-Signal Triangulation - Added source type mapping, triangulation multipliers, and confidence adjustments |
| 2025-12-01 | Phase E | ✅ | Improve LLM Synthesis - Added PROFILE_TRIGGER_EMPHASIS, SEMANTIC_INVERSION_RULES, correctSemanticInversions(), all 7 category quotas |
| 2025-12-01 | Phase F | ✅ | UVP Alignment Scoring - Added uvpAlignmentScore, uvpAlignmentCount, isHighUVPAlignment fields; updated sortTriggers() to prioritize high-UVP triggers; added UVP Match badge to TriggerCardV4 |
| 2025-12-01 | Phase G | ✅ | Source Quality Multipliers - Enhanced applySourceQualityWeighting() to weight ALL evidence items, added sourceQualityMultiplier field, calculates weighted average multiplier across evidence |
| 2025-12-01 | Phase H | ✅ | Category Balancing Per Profile - Added PROFILE_CATEGORY_WEIGHTS with primary/secondary categories for all 7 profiles; applyCategoryWeighting() boosts primary (1.25x) and secondary (1.1x) categories; added categoryWeightMultiplier and isPrimaryCategory fields; updated sortTriggers() to prioritize primary categories |
| 2025-12-02 | Phase H Enhancement | ✅ | Added CategoryGapAnalysis interface, analyzeCategoryDistribution() returns gap data, enforceCategoryMinimums() boosts underrepresented triggers 1.5x, isCategoryFill field tracks boosted triggers, wired into pipeline steps 6-7 |
| | | | |

