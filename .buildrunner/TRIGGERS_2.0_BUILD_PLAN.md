# Triggers 2.0 Build Plan

**Created:** 2025-11-28
**Branch:** `feature/uvp-sidebar-ui`
**Status:** In Progress

---

## Overview

Consolidate Triggers and Conversations tabs into a single unified Triggers section where psychological hooks are the headline and raw quotes/conversations are nested evidence supporting each trigger.

---

## Business Problem

- Triggers and Conversations tabs show overlapping data with inconsistent categorization
- Same Reddit quote could appear in either tab depending on upstream tagging
- Business owners need instant recognition of valuable triggers, not duplicate data

---

## Solution

One unified "Triggers" section:
- **Triggers** = headline (the psychological hook)
- **Conversations/quotes** = evidence (nested inside, supporting the trigger)

### New Trigger Card Structure

```
┌─────────────────────────────────────────┐
│ [Icon] Fear of Being Ignored        85% │  ← Concise title, instant recognition
├─────────────────────────────────────────┤
│ EXPANDED:                               │
│                                         │
│ Executive Summary                       │  ← What it is, why it matters to YOUR business
│ "Customers fear unresponsive service.   │
│  Your 24hr response guarantee directly  │
│  addresses this anxiety."               │
│                                         │
│ ▶ Supporting Evidence (3)               │  ← Expandable accordion
│   • Reddit r/insurance: "Nobody returns │
│     my calls after 3 weeks..."          │
│   • Google Review (2★): "Left on hold   │
│     for 45 minutes..."                  │
│   • LinkedIn: "Why do agencies ghost    │
│     their clients?"                     │
│                                         │
│ ▶ UVP Alignment                         │  ← Which parts of their UVP this maps to
│   • Key Benefit: "24/7 Support"         │
│   • Transformation: "From ignored →     │
│     prioritized"                        │
│                                         │
│ [Select for Content Generation]         │  ← Feeds into Synapse engine
└─────────────────────────────────────────┘
```

---

## Profile-Specific Trigger Variants

| # | Profile | Trigger Focus | Evidence Sources | UVP Emphasis |
|---|---------|---------------|------------------|--------------|
| 1 | **Local Service B2B** (Commercial HVAC, IT) | Reliability, Downtime Fear, Compliance | Google Reviews, Industry Forums, Local LinkedIn | Response Time, SLAs, Local Reputation |
| 2 | **Local Service B2C** (Dental, Salon, Restaurant) | Trust/Safety, Convenience, Price Anxiety | Google Reviews, Yelp, Facebook, NextDoor | Proximity, Reviews, Personal Touch |
| 3 | **Regional B2B Agency** (Marketing, Consulting) | ROI Skepticism, Expertise Doubt, Past Failures | LinkedIn, Clutch/G2, Case Studies | Results, Industry Expertise, Process |
| 4 | **Regional Retail B2C** (Multi-location, Franchise) | Availability, Consistency, Value | Google Reviews, Social, Local News | Locations, Promotions, Brand Trust |
| 5 | **National SaaS B2B** (OpenDialog-type) | Integration Fear, Adoption Risk, Vendor Lock-in | G2, Reddit, HackerNews, LinkedIn | Security, Support, Migration Path |
| 6 | **National Product B2C** (Consumer Brand) | Quality Doubt, Comparison Shopping, Social Proof | Amazon Reviews, TikTok, Influencer, Reddit | Differentiation, Social Proof, Value |

---

## Data Loading Strategy

### Earliest Start Point
After `saveCompleteUVP()` succeeds (line 1849 in OnboardingPageV5.tsx)

### Current Flow
```
UVP Synthesis Complete → saveCompleteUVP() → dashboardPreloader.preloadDashboard() → All APIs fire in parallel
```

### Key Insight
- `dashboardPreloader` already fires ALL APIs in parallel (Reddit, Perplexity, OutScraper, YouTube, etc.)
- Data streams back via `onProgress` callback
- Triggers/conversations already extracted from `customerPsychology.emotional[]`, Reddit, Reviews, etc.
- **No new API calls needed** - just better consolidation/grouping of existing data

### Architecture
- Add trigger consolidation layer that groups raw evidence under synthesized triggers
- Profile-based filtering/weighting applied AFTER data arrives (not during fetch)
- Triggers 2.0 panel subscribes to preloader progress, renders incrementally

---

## Build Phases

### Phase 1: Setup Isolated Dev Environment (15 min)
- [ ] Kill dev server on 3001
- [ ] Start fresh on port 3002
- [ ] Add `/triggers-dev` route for isolated testing
- [ ] Ensure no interference with other instance on 3000

### Phase 2: Trigger Consolidation Service (1.5 hr)
- [ ] Create `src/services/triggers/trigger-consolidation.service.ts`
- [ ] Group conversations as evidence under triggers
- [ ] Deduplicate overlapping data
- [ ] Synthesize executive summaries per trigger
- [ ] Map raw sources to parent trigger categories

### Phase 3: Profile Detection Utility (45 min)
- [ ] Create `src/services/triggers/profile-detection.service.ts`
- [ ] Auto-detect from UVP: local/regional/national scope
- [ ] Detect B2B vs B2C
- [ ] Detect service vs product business
- [ ] Return profile type enum

### Phase 4: Profile-Aware Trigger Weighting (1 hr)
- [ ] Filter triggers by relevance to profile type
- [ ] Weight/prioritize evidence sources that matter for profile
- [ ] Customize executive summary language per profile
- [ ] Sort by weighted confidence score

### Phase 5: New Trigger Card Component (2 hr)
- [ ] Create `src/components/v4/TriggerCard.tsx`
- [ ] Concise title with instant recognition
- [ ] Expandable executive summary
- [ ] Nested evidence accordion (max 5, "show more" if needed)
- [ ] UVP alignment display
- [ ] Selection state for content generation

### Phase 6: TriggersPanel 2.0 (1.5 hr)
- [ ] Rewrite `src/components/v4/TriggersPanel.tsx`
- [ ] Group triggers by type (Fear, Desire, Pain, Objection, etc.)
- [ ] Sort by confidence within each type group
- [ ] Empty states per profile type
- [ ] Loading states with progressive reveal

### Phase 7: Wire to Preloader Stream (45 min)
- [ ] Subscribe TriggersPanel to `dashboardPreloader` progress
- [ ] Render triggers incrementally as data arrives
- [ ] Handle partial data gracefully
- [ ] Show "gathering evidence" state per trigger

### Phase 8: Kill Conversations Tab (15 min)
- [ ] Remove 'conversations' from filter tabs
- [ ] Migrate any unique conversations logic to Triggers consolidation
- [ ] Update type definitions

### Phase 9: Content Engine Integration (1 hr)
- [ ] Ensure selected triggers include all nested evidence
- [ ] Pass consolidated trigger to Synapse content generation
- [ ] Update live preview to show trigger + evidence context
- [ ] Test content quality with new data structure

### Phase 10: Testing & Polish (1 hr)
- [ ] Test with all 6 business profile types
- [ ] Test empty states
- [ ] Test partial data loading
- [ ] Test content generation with triggers
- [ ] Performance testing with large evidence sets

---

## File Changes

| File | Type | Conflict Risk |
|------|------|---------------|
| `src/services/triggers/trigger-consolidation.service.ts` | NEW | None |
| `src/services/triggers/profile-detection.service.ts` | NEW | None |
| `src/components/v4/TriggersPanel.tsx` | REWRITE | None (our file) |
| `src/components/v4/TriggerCard.tsx` | NEW | None |
| `src/components/v4/V4PowerModePanel.tsx` | EDIT | Low |
| `App.tsx` | EDIT | Low |

---

## Key Decisions

1. **No new API calls** - Reuse existing streaming data from `dashboardPreloader`
2. **Consolidation happens client-side** - Service groups raw data into trigger hierarchies
3. **Profile detection is automatic** - Reads UVP data, no user input needed
4. **Evidence limit: 5 per trigger** - "Show more" if needed
5. **Grouped by type** - Fear, Desire, Pain, etc. - sorted by confidence within each group
6. **Kill Conversations tab** - All conversation data becomes evidence under triggers

---

## Total Estimate: ~10 hours

---

## Merge Strategy

- All new files (services, components) have zero conflict risk
- Minimal edits to V4PowerModePanel.tsx (different section than Gaps work)
- Clean merge back to `feature/uvp-sidebar-ui` when complete
