# New Profile System Build Plan

## Overview

Replace the current dual-profile system (NAICS industry profiles + specialty profiles) with a unified UVP-driven brand profile system. Every brand gets a custom profile generated from their UVP data that powers all insight tabs. Industry profiles become optional "content boosters" matched automatically, not required input.

## Current State Problems

1. **Industry dropdown is friction** - User must pick from 385 options before starting
2. **Specialty profiles underutilized** - Created but not fully integrated
3. **Insight tabs use generic searches** - Not informed by UVP context
4. **Two profile systems to maintain** - Redundant and confusing

## Target Architecture

```
[URL Input] → [Auto-scrape] → [Auto-match industry (silent)]
     ↓
[UVP Flow] → [Brand Profile created from UVP]
     ↓
[Brand Profile powers ALL insight tabs]
     ↓
[Industry Profile (if matched) supplements content generation only]
```

---

## Phase 1: Remove Industry Selection Friction

### 1.1 Modify Onboarding First Page
- Remove industry dropdown from URL input page
- URL-only input with "Analyze" button
- Industry matching happens silently after scrape

### 1.2 Auto-Match Industry (Silent)
- After website scrape, LLM classifies against 385 industry list
- Returns top 3 matches with confidence scores
- Store best match in brand record (not displayed yet)

### 1.3 Industry Confirmation (Deferred)
- Show confirmation AFTER UVP products page: "We detected: [Industry]. Correct?"
- If confidence < 50%: "Describe your business in 1-2 sentences" input
- User can confirm, change, or enter custom description
- Confirmation is non-blocking - UVP continues either way

---

## Phase 2: Rename & Consolidate Profile System

### 2.1 Rename specialty_profiles → brand_profiles
- Database migration to rename table
- Update all service references
- Clearer naming: this IS the brand's profile

### 2.2 Expand Brand Profile Schema
- Ensure `full_uvp` contains ALL UVP data (already done)
- Add `matched_industry_slug` field (nullable)
- Add `industry_confidence` field
- Add `custom_industry_description` field (for non-matches)

### 2.3 Brand Profile = Single Source of Truth
- All insight tabs read from brand_profiles
- Industry profile only accessed for content generation
- Remove industry profile lookups from insight services

---

## Phase 3: UVP Powers All Insight Tabs

### 3.1 Inject UVP Context into Search Queries
**Triggers Tab:**
- Already uses specialty profile (keep as-is)

**Proof Tab:**
- Search queries use: brand name + `products_services` + `target_customer_industry`
- Filter results by relevance to `differentiators`

**Trends Tab:**
- Search queries use: `products_services` keywords + `transformation_before/after` themes
- Filter for relevance to `key_benefit`

**Conversations Tab:**
- Reddit/HN queries use: `common_pain_points` + `common_buying_triggers`
- Filter discussions matching `target_customer_statement`

**Competitors Tab:**
- Search: companies solving same `transformation_before → after`
- Use `differentiators` to identify differentiation gaps

**Local Tab:**
- Only enabled if `geographic_scope` = local/regional
- Use brand location data, not industry patterns

### 3.2 UVP Alignment Scoring
- Every insight scored against UVP for relevance (0-100)
- High-alignment insights surfaced first
- Display "Aligns with: [differentiator]" badges

---

## Phase 4: Industry Profile as Content Booster

### 4.1 Content Generation Flow
```
[Brand Profile] → Primary source for all content context
       +
[Industry Profile] → Optional supplement if matched
       ↓
[Content with UVP messaging + industry best practices]
```

### 4.2 What Industry Profile Adds
- `bestPostingTimes` - Platform + industry benchmarks
- `postingFrequency` - Industry norms
- `contentThemes` - Proven topics for category
- `customerSegments` - Additional personas for variety

### 4.3 Fallback When No Industry Match
- Content generation uses brand profile only
- Edge function generates posting times/themes from UVP context
- No degradation in quality, just less industry-specific guidance

---

## Phase 5: Cleanup & Deprecation

### 5.1 Remove Deprecated Code
- Delete industry selection from OnboardingFlow
- Remove mandatory industry requirement from brand creation
- Archive old specialty-detection service complexity

### 5.2 Simplify Data Flow
- Single profile lookup per brand
- No more "check specialty then fall back to industry" logic
- Clear separation: brand_profiles (insights) vs industry_profiles (content)

### 5.3 Fix Current Errors
- Fix `toLowerCase()` null crash in trigger synthesizer
- Fix `v5_insights` float→integer type mismatch
- Remove `naics_codes.level` query (column doesn't exist)

---

## Expected Outcomes

1. **Faster onboarding** - No industry dropdown, just URL
2. **Better insights** - All tabs powered by UVP-specific context
3. **Higher relevance** - Triggers and conversations match actual business
4. **Simpler architecture** - One profile system, clear responsibilities
5. **Graceful handling** - Works for industries in AND out of 385 list

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Onboarding steps before UVP | 1 (URL only) |
| Industry match accuracy | 80%+ for standard industries |
| Trigger relevance | 90%+ align with UVP |
| Insight tabs using UVP context | 6/6 tabs |
| Zero "unknown source" triggers | 100% attributed |
| No industry-related errors in console | 0 errors |

---

## Time Estimate

| Phase | Effort |
|-------|--------|
| Phase 1: Remove industry friction | 2-3 hours |
| Phase 2: Profile consolidation | 2-3 hours |
| Phase 3: UVP powers insight tabs | 4-6 hours |
| Phase 4: Industry as content booster | 2-3 hours |
| Phase 5: Cleanup & fixes | 2-3 hours |
| **Total** | **12-18 hours** |

---

## Dependencies

- Edge function `generate-specialty-profile-hybrid` (already updated)
- `full_uvp` extraction in transform service (already done)
- Database access for brand_profiles table rename

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| LLM misclassifies industry | User confirmation step + works without match |
| API sources still failing | Brand profile triggers work standalone |
| Content quality drops without industry | Edge function generates all needed fields |
| Migration breaks existing brands | Keep specialty_profiles as alias during transition |
