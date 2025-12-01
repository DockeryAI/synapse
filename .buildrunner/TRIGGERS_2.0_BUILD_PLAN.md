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

---

## CRITICAL FIX: Profile-Aware Source Selection (Added 2025-11-30)

### The Problem

Current implementation is fetching triggers from wrong sources:
1. **YouTube searches for brand name** - Returns company marketing videos, not customer voice
2. **Generic Serper searches** - Returns marketing content, not pain signals
3. **No profile-specific source gating** - B2B SaaS brands don't need Yelp, local service brands don't need G2/Gartner

**Evidence from console**: Searching "OpenDialog" on YouTube returns videos like "What Is The Technology Behind OpenDialog?" - this is marketing content, not customer voice.

### Root Cause Analysis

Three disconnected pieces exist but aren't wired together:

1. **`TriggerSearchQueryGeneratorService`** - Has profile-specific query patterns for all 6 profiles (GOOD)
2. **`CustomerVoiceExtractorService`** - Has competitor VoC data with pain_points, desires, objections, switching_triggers (GOLD MINE - NOT USED)
3. **`StreamingApiManager`** - Fires ALL APIs in parallel without profile-based gating (BAD)

### The Fix Plan

#### Phase A: Wire Customer Voice Data to Triggers (HIGH VALUE)

The competitor intel already extracts EXACTLY what we need:
- `pain_points`: Customer frustrations with competitors
- `desires`: What customers wish they had
- `objections`: Why they hesitate to buy
- `switching_triggers`: What makes customers leave

**Files to modify:**
- `src/hooks/useStreamingTriggers.ts` - Add event listener for competitor voice data
- `src/services/triggers/trigger-consolidation.service.ts` - Accept VoC data as input
- `src/services/intelligence/streaming-api-manager.ts` - Emit competitor VoC as trigger source

**Implementation:**
```typescript
// In useStreamingTriggers.ts - handle competitor voice data
streamingApiManager.on('competitor-voice', (voiceData: CustomerVoiceResult) => {
  // Convert VoC fields to EvidenceItems
  const voiceEvidence = convertVoiceToEvidence(voiceData);
  // Merge into context.correlatedInsights
  contextRef.current.correlatedInsights.push(...voiceEvidence);
  // Re-consolidate
  consolidateTriggers(contextRef.current);
});
```

#### Phase B: Profile-Aware API Source Gating

Add source gating based on detected profile type:

| Profile | Enable | Disable/Deprioritize |
|---------|--------|---------------------|
| Local Service B2B | Google Reviews, LinkedIn Local, Industry Forums | G2, Gartner, YouTube |
| Local Service B2C | Google Reviews, Yelp, Facebook, NextDoor | LinkedIn, G2, HackerNews |
| Regional B2B Agency | LinkedIn, Clutch, G2 | Yelp, NextDoor, YouTube |
| Regional Retail B2C | Google Reviews, Social, Local News | G2, HackerNews, Gartner |
| National SaaS B2B | G2, Reddit, LinkedIn, HackerNews | Yelp, NextDoor, Local |
| Global SaaS B2B | G2, Gartner, Reddit, LinkedIn, Trustpilot | Yelp, Local, YouTube brand search |
| National Product B2C | Amazon Reviews, TikTok, Reddit, YouTube | G2, LinkedIn, B2B sources |

**Files to modify:**
- `src/services/intelligence/streaming-api-manager.ts` - Add `shouldRunApi(profileType, apiType)` gate
- `src/services/triggers/profile-detection.service.ts` - Add `getEnabledApis(profileType)` method

#### Phase C: Fix Query Generation for Perplexity

Perplexity is our best source - but we're sending generic queries instead of psychology-focused queries.

**Current (BAD):**
```
"OpenDialog customer feedback"
```

**Fixed (GOOD):**
```
"What frustrations do enterprise customers have with conversational AI platforms like Cognigy, Kore.ai, or Botpress? Include specific complaints from G2, Reddit, and LinkedIn"
```

**Files to modify:**
- `src/services/uvp-wizard/perplexity-api.ts` - Use `TriggerSearchQueryGeneratorService` for query generation
- Pass profile type and UVP context to generate psychology-focused queries

#### Phase D: Source Quality Multipliers in Consolidation

Apply source quality weights per profile type during trigger consolidation:

**Files to modify:**
- `src/services/triggers/source-quality.service.ts` - Add profile-specific multipliers

```typescript
const PROFILE_SOURCE_WEIGHTS: Record<BusinessProfileType, Record<string, number>> = {
  'national-saas-b2b': {
    'G2': 1.3,
    'Capterra': 1.3,
    'Reddit': 1.2,
    'LinkedIn': 1.1,
    'HackerNews': 1.1,
    'YouTube': 0.5,  // Deprioritize for B2B SaaS
    'Yelp': 0.3,     // Not relevant
    'Facebook': 0.3, // Not relevant
  },
  'local-service-b2c': {
    'Google Reviews': 1.3,
    'Yelp': 1.3,
    'Facebook': 1.1,
    'NextDoor': 1.1,
    'G2': 0.3,       // Not relevant for local B2C
    'HackerNews': 0.3,
  },
  // ... other profiles
};
```

---

## Implementation Order

1. **Phase A: Wire Customer Voice (2hr)** - Highest value, lowest risk
2. **Phase B: API Source Gating (1hr)** - Reduce noise, speed up loading
3. **Phase C: Perplexity Query Fix (1hr)** - Better quality from existing source
4. **Phase D: Source Weights (30min)** - Fine-tune ranking

**Total Additional Work: ~4.5 hours**

---

## Expected Outcomes

| Before Fix | After Fix |
|------------|-----------|
| YouTube videos of brand marketing | Competitor reviews from G2 |
| Generic pain points | Actual customer quotes with URLs |
| 15-20 API calls (many irrelevant) | 8-10 targeted API calls |
| Load time: 45-60 seconds | Load time: 20-30 seconds |
| Triggers: "Fear of implementation" (generic) | Triggers: "Customers leave [competitor] because support takes 48+ hours" (specific) |

---

## Files Changed Summary

| File | Change Type | Risk |
|------|-------------|------|
| `src/hooks/useStreamingTriggers.ts` | EDIT - Add VoC integration | Low |
| `src/services/triggers/trigger-consolidation.service.ts` | EDIT - Accept VoC input | Low |
| `src/services/intelligence/streaming-api-manager.ts` | EDIT - Add profile gating | Medium |
| `src/services/triggers/profile-detection.service.ts` | EDIT - Add getEnabledApis() | Low |
| `src/services/uvp-wizard/perplexity-api.ts` | EDIT - Use query generator | Low |
| `src/services/triggers/source-quality.service.ts` | EDIT - Add profile weights | Low |

---

## CRITICAL FIX: Semantic Inversion & Title Generation (Added 2025-11-30)

### The 5 Critical Bugs Identified

Based on detailed research and code analysis, the current triggers implementation has these showstopper bugs:

#### Bug 1: Semantic Inversion in Title Generation
**Location:** `trigger-consolidation.service.ts:1205` - `extractTitle()` method

**The Problem:**
When a customer complains: "The platform is too complex and pricing doesn't align"
The system generates: "Buyers want platform complexity and pricing that doesn't align"

This is SEMANTICALLY WRONG. Buyers don't WANT complexity - they're COMPLAINING about it.

**Root Cause:** The `categoryVerbs` mapping blindly prepends verbs:
```typescript
const categoryVerbs = {
  'desire': 'want',        // ← Used for complaints!
  'pain-point': 'struggle with',  // ← "Buyers struggle with not coping..."
};
```

**The Fix:** Add sentiment detection BEFORE verb selection:
- Negative sentiment (complaints) → "frustrated by", "struggling with"
- Positive sentiment (desires) → "want", "looking for"
- Comparison sentiment → "evaluating", "comparing"

#### Bug 2: LLM Synthesis JSON Parse Error
**Location:** `llm-trigger-synthesizer.service.ts`

**The Problem:** LLM returns markdown code fences, JSON.parse fails:
```
SyntaxError: Unexpected token '`', "```json
```

**The Fix:** Strip markdown code fences before parsing:
```typescript
const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');
```

#### Bug 3: VoC Data Flooding (93% Rejection Rate)
**Location:** `streaming-api-manager.ts` + `trigger-consolidation.service.ts`

**The Problem:**
- VoC loads 382 items from `brand_competitor_voice` table
- `correlatedInsights` capped at 100 items
- VoC floods out other sources (Reddit, LinkedIn, Twitter = 0 representation)
- Then 93 of 99 evidence items rejected by `isValidTriggerTitle()`
- Result: Only 6 triggers from G2, all others lost

**The Fix:** Diversified source loading:
- Cap each source at 20 items max
- Ensure representation from all sources
- Source diversity > source volume

#### Bug 4: Missing Competitor Attribution
**Location:** `trigger-consolidation.service.ts:1210`

**The Problem:** `[Competitor]` placeholder stripped but actual competitor name never preserved:
```typescript
.replace(/\[Competitor\]\s*/gi, '') // Removes but doesn't store
```

Users see: "Buyers frustrated by platform complexity"
Should see: "HubSpot users frustrated by platform complexity"

**The Fix:** Store competitor name on evidence item, include in title generation.

#### Bug 5: Overly Strict Validation
**Location:** `trigger-consolidation.service.ts:767` - `isValidTriggerTitle()`

**The Problem:**
- 80-char limit truncates mid-sentence → rejected as incomplete
- Required keyword check too strict
- VoC quotes are ALREADY customer voice - shouldn't need keyword validation

**The Fix:**
- Allow VoC quotes as-is (they're already validated customer voice)
- Increase char limit or use LLM for title extraction
- Skip keyword check for VoC data

---

## Phase E: Title Generation Fix (Priority 1)

### E.1: Add Sentiment Detection

Create `detectComplaintSentiment()` method in `trigger-consolidation.service.ts`:

```typescript
private detectComplaintSentiment(text: string): 'complaint' | 'desire' | 'comparison' | 'neutral' {
  const lowerText = text.toLowerCase();

  // High-intent comparison patterns (switching intent)
  const comparisonPatterns = [
    /evaluating|comparing|vs|versus|alternative|migrating from|switching from/i,
    /contract is up|looking at|considering/i
  ];
  if (comparisonPatterns.some(p => p.test(lowerText))) return 'comparison';

  // Complaint patterns (negative sentiment about current state)
  const complaintPatterns = [
    /frustrated|annoyed|hate|struggling|difficult|problem|issue|broken/i,
    /doesn't work|failed|waste|inefficient|tedious|stuck|limited/i,
    /too complex|too expensive|too slow|takes too long|not working/i,
    /can't|won't|doesn't|isn't|aren't|wasn't/i // Negation words
  ];
  if (complaintPatterns.some(p => p.test(lowerText))) return 'complaint';

  // Desire patterns (positive seeking)
  const desirePatterns = [
    /want|wish|hope|looking for|searching for|need|would love/i,
    /excited about|interested in|motivated by/i
  ];
  if (desirePatterns.some(p => p.test(lowerText))) return 'desire';

  return 'neutral';
}
```

### E.2: Fix extractTitle() to Use Sentiment

```typescript
private extractTitle(text: string, category: TriggerCategory, competitorName?: string): string {
  let cleaned = text
    .replace(/^["']|["']$/g, '')
    .replace(/\[Competitor\]\s*/gi, competitorName ? `${competitorName} ` : '')
    .replace(/\[Company\]\s*/gi, '')
    .replace(/^\[[^\]]+\]\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Detect actual sentiment, don't rely on category alone
  const sentiment = this.detectComplaintSentiment(cleaned);

  // Select verb based on SENTIMENT, not category
  const sentimentVerbs = {
    'complaint': 'frustrated by',
    'desire': 'seeking',
    'comparison': 'evaluating alternatives due to',
    'neutral': 'concerned about'
  };

  // Add subject if missing
  const hasSubject = /^(buyers|customers|users|teams|companies|businesses|they|we|i)\s/i.test(cleaned);

  if (hasSubject) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  // Add competitor name if known
  const subject = competitorName ? `${competitorName} users` : 'Buyers';
  return `${subject} ${sentimentVerbs[sentiment]} ${cleaned.toLowerCase()}`.substring(0, 80);
}
```

---

## Phase F: LLM JSON Parse Fix (Priority 2)

### F.1: Fix JSON Parsing in llm-trigger-synthesizer.service.ts

Locate the JSON.parse call and add markdown fence stripping:

```typescript
private parseResponse(response: string): SynthesizedTrigger[] {
  // Strip markdown code fences that LLM sometimes includes
  let cleaned = response
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  // Handle case where response starts with text before JSON
  const jsonStart = cleaned.indexOf('[');
  if (jsonStart > 0) {
    cleaned = cleaned.substring(jsonStart);
  }

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('[LLMTriggerSynthesizer] JSON parse failed:', error);
    return []; // Fallback to empty, let regex consolidation handle it
  }
}
```

---

## Phase G: Source Diversification (Priority 3)

### G.1: Cap Per-Source Items in streaming-api-manager.ts

```typescript
private readonly MAX_ITEMS_PER_SOURCE = 20;

private addToCorrelatedInsights(items: any[], source: string): void {
  // Cap this source's contribution
  const cappedItems = items.slice(0, this.MAX_ITEMS_PER_SOURCE);

  // Tag with source
  const taggedItems = cappedItems.map(item => ({
    ...item,
    _source: source
  }));

  this.correlatedInsights.push(...taggedItems);
}
```

### G.2: Ensure Source Diversity in Consolidation

```typescript
private diversifySources(items: EvidenceItem[]): EvidenceItem[] {
  const bySource = new Map<string, EvidenceItem[]>();

  // Group by source
  items.forEach(item => {
    const source = item.platform || 'unknown';
    if (!bySource.has(source)) bySource.set(source, []);
    bySource.get(source)!.push(item);
  });

  // Take max 20 from each source
  const diversified: EvidenceItem[] = [];
  bySource.forEach((sourceItems, source) => {
    diversified.push(...sourceItems.slice(0, 20));
  });

  return diversified;
}
```

---

## Phase H: Competitor Attribution (Priority 4)

### H.1: Add competitorName Field to EvidenceItem

```typescript
export interface EvidenceItem {
  id: string;
  source: string;
  platform: string;
  quote: string;
  url?: string;
  author?: string;
  timestamp?: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  competitorName?: string; // NEW: Which competitor this is about
}
```

### H.2: Extract Competitor Name from VoC Data

In the VoC loading code, preserve competitor name:

```typescript
// When loading from brand_competitor_voice
const evidence: EvidenceItem = {
  ...baseEvidence,
  competitorName: vocRow.competitor_name || vocRow.source_competitor,
};
```

### H.3: Pass to Title Generation

```typescript
const title = this.extractTitle(
  primaryEvidence.quote,
  category,
  primaryEvidence.competitorName // Pass competitor name
);
```

---

## Phase I: Relax Validation for VoC (Priority 5)

### I.1: Skip Keyword Check for VoC Data

```typescript
private isValidTriggerTitle(title: string, isVoC: boolean = false): boolean {
  // VoC quotes are already customer voice - skip strict validation
  if (isVoC && title.length >= 15 && title.length <= 100) {
    // Just check basic quality
    if (this.isMarketingCopy(title)) return false;
    return true; // Accept VoC without keyword check
  }

  // Original validation for non-VoC...
}
```

---

## Implementation Order

| Phase | Description | Impact | Time |
|-------|-------------|--------|------|
| **E** | Semantic inversion fix | Critical - fixes wrong titles | 30 min |
| **F** | LLM JSON parse fix | High - enables LLM path | 15 min |
| **G** | Source diversification | High - shows all sources | 30 min |
| **H** | Competitor attribution | Medium - context for users | 30 min |
| **I** | Relax validation | Medium - more triggers shown | 15 min |

**Total: ~2 hours**

---

## Expected Results After Fix

| Metric | Before | After |
|--------|--------|-------|
| Triggers shown | 6 | 30-50 |
| Sources represented | 1 (G2 only) | 6+ (G2, Reddit, LinkedIn, Twitter, etc.) |
| Title accuracy | Wrong ("Buyers want complexity") | Correct ("HubSpot users frustrated by complexity") |
| Competitor attribution | None | Shown on each trigger |
| LLM synthesis | Failing (JSON error) | Working |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/services/triggers/trigger-consolidation.service.ts` | Add `detectComplaintSentiment()`, fix `extractTitle()`, update `isValidTriggerTitle()` |
| `src/services/triggers/llm-trigger-synthesizer.service.ts` | Fix JSON parsing to strip markdown fences |
| `src/services/intelligence/streaming-api-manager.ts` | Add per-source caps, source diversification |
| `src/types/synapse/deepContext.types.ts` | Add `competitorName` to EvidenceItem (if needed) |

---

## CRITICAL FIX: Multi-Source Integration (Added 2025-11-30)

### The Problem

Current system is 95%+ VoC data from G2 reviews - this is only ONE signal type. The research doc identifies multiple signal types we're missing:

| Signal Type | Current Coverage | What's Missing |
|-------------|-----------------|----------------|
| Competitor VoC (G2) | ✅ Over-indexed (95%) | N/A |
| Community VoC (Reddit) | ❌ Not feeding triggers | Pain point discussions |
| Tech Community (HackerNews) | ❌ Not connected | Tool switching signals |
| Trigger EVENTS | ❌ Missing entirely | Funding, hiring, leadership changes |
| News Signals | ❌ Not connected | Industry trends, regulations |
| LinkedIn Signals | ❌ Not used | Job postings, executive moves |

### Root Cause

All these APIs exist in the codebase but are NOT wired to the Triggers pipeline:
- `serper-api.ts` - Has `getNews()` method but not used for triggers
- `hackernews-api.ts` - Fully coded, not connected
- `reddit-apify-api.ts` - Has `mineConversations()` method, not used
- `linkedin-alternative.service.ts` - Parses executive signals, not used
- `news-api.ts` - Has industry news, not connected to triggers

### The Fix Plan

---

## Phase J: Multi-Source Integration

### J.1: Add Serper News to Trigger Pipeline

**Purpose:** Capture trigger EVENTS (funding, acquisitions, leadership changes)

**File:** `src/services/intelligence/streaming-api-manager.ts`

```typescript
import { SerperAPI } from './serper-api';

// In collectTriggerData() method:
private async collectNewsEventTriggers(competitors: string[], industry: string): Promise<RawDataSample[]> {
  const eventQueries = competitors.slice(0, 3).map(comp =>
    `"${comp}" (funding OR acquired OR launches OR hires OR layoffs OR announces)`
  );

  const samples: RawDataSample[] = [];

  for (const query of eventQueries) {
    try {
      const news = await SerperAPI.getNews(query);

      news.slice(0, 10).forEach(article => {
        // Only include recent news (last 30 days)
        const articleDate = new Date(article.date);
        const daysAgo = (Date.now() - articleDate.getTime()) / (1000 * 60 * 60 * 24);

        if (daysAgo <= 30) {
          samples.push({
            id: `news-${article.link}`,
            text: `${article.title}. ${article.snippet}`,
            platform: 'News',
            sourceType: 'event', // NEW: Source type for triangulation
            url: article.link,
            timestamp: article.date,
            author: article.source,
            engagement: 0, // News doesn't have engagement metrics
            competitorName: this.extractCompetitorFromQuery(query)
          });
        }
      });
    } catch (err) {
      console.warn('[StreamingApiManager] News fetch failed:', err);
    }
  }

  return samples;
}
```

### J.2: Add HackerNews to Trigger Pipeline

**Purpose:** Capture tool switching signals and tech community discussions

**File:** `src/services/intelligence/streaming-api-manager.ts`

```typescript
import { HackerNewsAPI } from './hackernews-api';

private async collectHackerNewsTriggers(industry: string, competitors: string[]): Promise<RawDataSample[]> {
  // Only for tech/SaaS profiles
  if (!this.isTechProfile(industry)) return [];

  const switchingQueries = [
    `${industry} switching alternative`,
    `${industry} frustrated hate`,
    `${industry} vs comparison`,
    ...competitors.slice(0, 2).map(c => `${c} alternative`)
  ];

  try {
    const results = await HackerNewsAPI.searchMultiple(switchingQueries, {
      hitsPerTopic: 5,
      minPoints: 10
    });

    return results.slice(0, 20).map(hit => ({
      id: `hn-${hit.id}`,
      text: `${hit.title}. ${hit.description}`,
      platform: 'HackerNews',
      sourceType: 'community', // Community VoC
      url: hit.url,
      timestamp: hit.date,
      author: hit.author,
      engagement: hit.engagementScore
    }));
  } catch (err) {
    console.warn('[StreamingApiManager] HackerNews fetch failed:', err);
    return [];
  }
}
```

### J.3: Enable Reddit mineConversations

**Purpose:** Feed UVP pain points to get community validation

**File:** `src/services/intelligence/streaming-api-manager.ts`

```typescript
import { redditAPI } from './reddit-apify-api';

private async collectRedditConversations(painPoints: string[], industry: string): Promise<RawDataSample[]> {
  try {
    const result = await redditAPI.mineConversations(
      painPoints.slice(0, 5), // Top 5 pain points from UVP
      industry,
      { limit: 15, timeFilter: 'month' }
    );

    const samples: RawDataSample[] = [];

    // Convert insights to samples
    result.insights.forEach(insight => {
      samples.push({
        id: `reddit-insight-${insight.url}`,
        text: insight.painPoint || insight.desire || insight.context,
        platform: 'Reddit',
        sourceType: 'community', // Community VoC
        url: insight.url,
        engagement: insight.upvotes,
        author: insight.subreddit
      });
    });

    // Convert triggers to samples
    result.triggers.forEach(trigger => {
      samples.push({
        id: `reddit-trigger-${trigger.url}`,
        text: trigger.text,
        platform: 'Reddit',
        sourceType: 'community',
        url: trigger.url,
        engagement: trigger.upvotes,
        triggerType: trigger.type
      });
    });

    return samples.slice(0, 30); // Cap at 30 to maintain diversity
  } catch (err) {
    console.warn('[StreamingApiManager] Reddit conversation mining failed:', err);
    return [];
  }
}
```

### J.4: Add LinkedIn Alternative Executive Signals

**Purpose:** Capture leadership changes, funding announcements, hiring surges

**File:** `src/services/intelligence/streaming-api-manager.ts`

```typescript
import { linkedInAlternativeService, needsLinkedInData } from './linkedin-alternative.service';

private async collectLinkedInSignals(competitors: string[], industry: string): Promise<RawDataSample[]> {
  // Only for B2B profiles
  if (!needsLinkedInData(industry)) return [];

  const samples: RawDataSample[] = [];

  for (const competitor of competitors.slice(0, 3)) {
    try {
      const insights = await linkedInAlternativeService.getInsights(competitor, industry);

      // Convert buyer intent signals to trigger samples
      insights.buyer_intent_signals.forEach((signal, idx) => {
        samples.push({
          id: `linkedin-intent-${competitor}-${idx}`,
          text: signal.signal,
          platform: 'LinkedIn',
          sourceType: 'executive', // Executive/professional signal
          competitorName: competitor,
          confidence: signal.strength
        });
      });

      // Convert professional pain points
      insights.professional_pain_points.forEach((pp, idx) => {
        samples.push({
          id: `linkedin-pain-${competitor}-${idx}`,
          text: pp.text,
          platform: 'LinkedIn',
          sourceType: 'executive',
          competitorName: competitor,
          confidence: pp.intensity
        });
      });
    } catch (err) {
      console.warn(`[StreamingApiManager] LinkedIn signals for ${competitor} failed:`, err);
    }
  }

  return samples.slice(0, 20);
}
```

### J.5: Add Source Type Tagging to RawDataSample

**Purpose:** Enable multi-signal triangulation in consolidation

**File:** `src/services/triggers/llm-trigger-synthesizer.service.ts`

```typescript
export interface RawDataSample {
  id: string;
  text: string;
  platform: string;
  sourceType: 'voc' | 'community' | 'event' | 'executive' | 'news'; // NEW
  url?: string;
  timestamp?: string;
  author?: string;
  engagement?: number;
  competitorName?: string;
  confidence?: number;
  triggerType?: string;
}
```

### J.6: Multi-Signal Triangulation in Consolidation

**Purpose:** Require 2+ source TYPES for high confidence

**File:** `src/services/triggers/trigger-consolidation.service.ts`

```typescript
private calculateConfidenceWithTriangulation(
  evidence: EvidenceItem[],
  baseConfidence: number
): number {
  // Get unique source types
  const sourceTypes = new Set(evidence.map(e => e.sourceType || 'unknown'));

  // Triangulation bonus: 2+ source types = higher confidence
  let triangulationMultiplier = 1.0;

  if (sourceTypes.size >= 3) {
    triangulationMultiplier = 1.3; // HIGH confidence
  } else if (sourceTypes.size >= 2) {
    triangulationMultiplier = 1.15; // MEDIUM-HIGH confidence
  } else {
    triangulationMultiplier = 0.9; // Single source = lower confidence
  }

  // Apply multiplier
  return Math.min(1.0, baseConfidence * triangulationMultiplier);
}
```

---

## Implementation Order

| Phase | Description | Impact | Time |
|-------|-------------|--------|------|
| **J.1** | Add Serper News | HIGH - trigger events | 30 min |
| **J.2** | Add HackerNews | HIGH - tech switching signals | 30 min |
| **J.3** | Enable Reddit conversations | MEDIUM - community validation | 30 min |
| **J.4** | LinkedIn Alternative | MEDIUM - B2B executive signals | 30 min |
| **J.5** | Source type tagging | HIGH - enables triangulation | 15 min |
| **J.6** | Triangulation logic | HIGH - confidence calculation | 30 min |

**Total: ~2.5 hours**

---

## Expected Results After Multi-Source Integration

| Metric | Before | After |
|--------|--------|-------|
| Source types | 1 (G2 VoC) | 5+ (G2, Reddit, HN, News, LinkedIn) |
| Trigger events | 0 | 10-20 (funding, hiring, launches) |
| Community signals | 0 | 15-30 (Reddit + HN discussions) |
| Triangulated triggers | 0 | 30-50 (2+ source types) |
| Single-source triggers | 50 | 10-20 (lower confidence) |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/services/intelligence/streaming-api-manager.ts` | Add all 4 new data collectors (News, HN, Reddit, LinkedIn) |
| `src/services/triggers/llm-trigger-synthesizer.service.ts` | Add `sourceType` to RawDataSample interface |
| `src/services/triggers/trigger-consolidation.service.ts` | Add triangulation confidence calculation |

---

## CRITICAL FIX: Garbage In = Garbage Out (Added 2025-11-30)

### The Real Root Cause

The research document nails it:

> **Current system asks**: "Does this trigger contain keywords that match our UVP?"
> **System must ask**: "Given this brand's business profile, would someone with this problem search for and buy THIS SPECIFIC product?"

**The garbage triggers like "Capterra shines in product content..." and "Reddit discussions from r/SaaS..." are META-DESCRIPTIONS about data sources, not actual customer insights.** Perplexity is returning what it found *about* sources, not *from* sources.

No amount of post-processing filtering can fix this. We need to fix the QUERIES.

---

## Phase K: Fix Perplexity Queries (Priority 0 - Must Fix First)

### K.1: The Problem with Current Queries

**Current queries (lines 1816-1894 in streaming-api-manager.ts):**
```
"Find REAL customer quotes and reviews about ${productContext} from G2, Capterra..."
```

**What Perplexity returns:**
- "Capterra shines in product content, providing detailed information..."
- "Reddit discussions from r/SaaS, r/startups about these tools"
- "G2 reviews discuss platform complexity..."

These are DESCRIPTIONS OF SOURCES, not QUOTES FROM SOURCES.

### K.2: Fixed Query Template

Replace vague "find quotes" with explicit rejection criteria:

```typescript
const TRIGGER_QUERY_TEMPLATE = `
Find EXACT quotes from customers who express frustration, fear, or desire related to ${productContext}.

CRITICAL REQUIREMENTS:
1. Each response MUST be a direct quote from a real person (with "quotation marks")
2. MUST contain emotional language (frustrated, hate, wish, struggle, switched, fear, worried)
3. MUST describe a SPECIFIC problem, outcome, or decision

REJECT THESE PATTERNS (they are meta-descriptions, not quotes):
- "G2 reviews discuss..."
- "Reddit threads mention..."
- "Capterra shines in..."
- "Users often say..."
- "Discussions about..."
- "Reviews show that..."
- "Forums contain..."
- "Technology professionals seek..."
- "Companies evaluate..."

ACCEPT THESE PATTERNS (real quotes with emotion):
- "We switched from X because their support took 3 weeks to respond"
- "I'm frustrated that we can't integrate with our existing CRM"
- "After 6 months, we realized the hidden costs were unsustainable"
- "Our team wasted 40 hours trying to configure the automation"

Return 10 quotes in this EXACT format:
[
  {"quote": "exact words in quotes", "source": "platform name", "emotion": "frustrated|worried|excited|etc", "problem": "specific issue"}
]
`;
```

### K.3: Add High-Intent Language Detection

From research doc Part 3.5:

**High-Intent Patterns (KEEP):**
```typescript
const HIGH_INTENT_PATTERNS = [
  /we're evaluating|we're looking at/i,
  /has anyone (migrated|switched) from/i,
  /what's the best alternative to/i,
  /we're switching from/i,
  /our contract is up and/i,
  /we've decided to move away from/i,
];
```

**Low-Intent Patterns (REJECT):**
```typescript
const LOW_INTENT_PATTERNS = [
  /I wish \[?\w*\]? would/i,        // Venting, not switching
  /why doesn't \[?\w*\]? have/i,    // Feature request, not buying signal
  /anyone else annoyed by/i,         // Commiseration, not action
  /\[?\w*\]? sucks because/i,       // Complaint, not evaluation
];
```

### K.4: Buyer-Product Fit Validation

Before displaying ANY trigger, ask:

```typescript
private isBuyingTriggerForThisBrand(
  trigger: string,
  uvp: CompleteUVP,
  profileType: BusinessProfileType
): boolean {
  // The key question from research doc:
  // "Would someone with this problem search for and buy THIS SPECIFIC product?"

  // Extract the product category from UVP
  const productCategory = uvp.solution?.toLowerCase() || '';

  // Check if trigger relates to OUR product category
  const triggerLower = trigger.toLowerCase();

  // Profile-specific product keywords (from research doc Part 6)
  const PROFILE_PRODUCT_KEYWORDS: Record<BusinessProfileType, string[]> = {
    'local-service-b2b': ['hvac', 'it support', 'cybersecurity', 'managed services', 'cleaning', 'maintenance'],
    'local-service-b2c': ['dental', 'salon', 'restaurant', 'fitness', 'spa', 'clinic'],
    'regional-b2b-agency': ['marketing', 'consulting', 'accounting', 'legal', 'agency'],
    'regional-retail-b2c': ['retail', 'franchise', 'store', 'location', 'shop'],
    'national-saas-b2b': ['software', 'platform', 'saas', 'integration', 'automation', 'ai', 'chatbot'],
    'national-product-b2c': ['product', 'brand', 'd2c', 'consumer', 'retail'],
  };

  const relevantKeywords = PROFILE_PRODUCT_KEYWORDS[profileType] || [];

  // Does the trigger mention our product category?
  const mentionsCategory = relevantKeywords.some(kw =>
    triggerLower.includes(kw) || productCategory.includes(kw)
  );

  // Does the trigger describe a problem our product solves?
  const uvpPainPoints = uvp.customerProblem?.toLowerCase() || '';
  const addressesPain = uvpPainPoints.split(/[,.]/).some(pain =>
    triggerLower.includes(pain.trim().slice(0, 20)) // First 20 chars of each pain
  );

  return mentionsCategory || addressesPain;
}
```

### K.5: Meta-Description Rejection at Source

Add to `streaming-api-manager.ts` BEFORE adding to correlatedInsights:

```typescript
const META_DESCRIPTION_PATTERNS = [
  /^reddit discussions/i,
  /^linkedin posts/i,
  /^g2 reviews (show|discuss|contain|mention)/i,
  /^capterra (shines|provides|offers|shows)/i,
  /^trustpilot reviews/i,
  /^youtube videos/i,
  /^quora questions/i,
  /^forum (discussions|posts|threads)/i,
  /provides (detailed|comprehensive|in-depth) information/i,
  /reveals competitive advantages/i,
  /mentions? the product/i,
  /about these tools/i,
  /about this (ai|software|platform)/i,
  /technology professionals seek/i,
  /companies (seek|evaluate|compare)/i,
  /founders (constantly )?(compare|evaluate|explore)/i,
  /professionals seek peer insights/i,
  /innovative software solutions/i,
];

private isMetaDescription(text: string): boolean {
  return META_DESCRIPTION_PATTERNS.some(p => p.test(text));
}

// Use in data processing:
if (this.isMetaDescription(insight)) {
  console.log(`[StreamingAPI] Rejected meta-description: "${insight.slice(0, 50)}..."`);
  continue; // Skip this item entirely
}
```

---

## Implementation Order (Updated)

| Phase | Description | Impact | Time |
|-------|-------------|--------|------|
| **K.1** | Rewrite Perplexity queries with explicit rejection criteria | CRITICAL - fixes source data | 45 min |
| **K.3** | Add high-intent language detection | HIGH - filters low-value signals | 30 min |
| **K.5** | Meta-description rejection at source | HIGH - prevents garbage | 20 min |
| **K.4** | Buyer-product fit validation | MEDIUM - ensures relevance | 30 min |
| **E** | Semantic inversion fix (already documented) | HIGH - fixes title generation | 30 min |

**Total Phase K: ~2.5 hours**

---

## Files to Modify for Phase K

| File | Changes |
|------|---------|
| `src/services/intelligence/streaming-api-manager.ts` | Rewrite Perplexity queries (K.1), add meta-description filter (K.5) |
| `src/services/triggers/trigger-consolidation.service.ts` | Add buyer-product fit validation (K.4) |
| `src/services/triggers/llm-trigger-synthesizer.service.ts` | Add high-intent patterns (K.3) |

---

## Key Insight from Research Doc

> "The LANGUAGE pattern matters more than sentiment. 'I hate [X]' is lower intent than 'Has anyone switched from [X] to [Y]?'"

We should prioritize:
1. **Switching intent**: "We're moving from X to..." (GOLD)
2. **Active evaluation**: "Comparing X against alternatives" (HIGH)
3. **Feature gaps**: "X doesn't have Y, looking for..." (MEDIUM)
4. **General frustration**: "X is frustrating" (LOW - often not actionable)

---

## CRITICAL FIX: Structured Quote Extraction (Added 2025-11-30)

### The Fundamental Problem

Previous fixes (K.1-K.5) used regex filtering to catch garbage after Perplexity returns it. But this is endless whack-a-mole:
- LLMs can express "no data found" in infinite ways
- "No significant customer narratives were discovered" → filtered
- "Limited customer feedback requires strategic interpretation" → slips through
- "Generate a JSON array based on the limited customer feedback..." → literal prompt leakage

**The regex approach is fundamentally flawed.** We can't filter infinitely creative garbage with finite regex patterns.

### The Root Cause

Perplexity returns **meta-commentary** when it can't find real quotes:
1. "No customer quotes are available expressing frustration..." (no-data response)
2. "G2 reviews discuss platform complexity..." (description of sources, not quotes)
3. "Generate a JSON array based on..." (prompt instruction leakage)

All three look different but share one trait: **they are NOT real customer quotes**.

### The Solution: Structured Extraction + Validation

Instead of filtering garbage AFTER receiving it, we:
1. **Demand structured JSON output** with explicit required fields
2. **Validate each "quote" is actually a quote** using a fast LLM check
3. **Require URL + attribution** as minimum viable trigger
4. **Fail gracefully** with fewer but REAL triggers

---

## Phase M: Back to V1 Architecture (Priority 0 - Critical Fix)

**Status:** IN PROGRESS
**Problem:** Phase L broke everything by trying to pre-validate data before LLM synthesis.

### The Core Problem

We over-engineered the trigger pipeline:
1. Asked Perplexity for pre-formatted JSON triggers → Returns garbage meta-commentary
2. Added URL validation at collection time → Rejected all scraper data
3. Raw tweets/posts displayed AS triggers without synthesis → "Luna crypto goddess" nonsense

### The V1 Pattern That Worked

```
1. Profile detection → Generate profile-specific search queries
2. Scrape: Reddit, G2, Twitter, HackerNews (raw data collection)
3. Pass ALL raw data to LLM synthesizer (the magic happens here)
4. LLM extracts REAL psychological triggers from raw posts
5. Apply JTBD validation + UVP matching AFTER synthesis
```

**Key Insight:** The LLM synthesizer is where intelligence extraction happens. Stop trying to pre-filter. Let the synthesizer do its job.

### M.1: Remove Pre-Filtering (Revert Phase L)

**Files to clean up:**
- `streaming-api-manager.ts` - Remove structured JSON query nonsense
- `trigger-consolidation.service.ts` - Remove URL validation that blocks scraper data
- Delete `quote-validator.service.ts` (unused over-engineering)

**What to keep:**
- Trusted scraper source list (for weighting, not blocking)
- Basic garbage pattern rejection (marketing copy, "no data" responses)

### M.2: Fix the LLM Synthesizer Flow

The current flow is broken:
```
streaming-api-manager → collects raw data → tries to display as triggers (WRONG)
```

The correct flow:
```
streaming-api-manager → collects raw data → llm-trigger-synthesizer → synthesized triggers
```

**Changes to `streaming-api-manager.ts`:**
1. Remove all Perplexity "structured JSON" query attempts
2. Collect raw data from scrapers without validation
3. Pass ALL raw samples to `llm-trigger-synthesizer.service.ts`
4. Only display triggers AFTER LLM synthesis

### M.3: Enhance LLM Synthesizer Prompts

The synthesizer needs to do the heavy lifting. From TRIGGER_RESEARCH.md:

**Profile-Specific Query Enhancement:**
- Use competitor displacement patterns: "switching from [competitor]", "alternatives to [competitor]"
- Mine for specific trigger events per profile (see Part 5-6 of research)
- Apply source quality tiers (G2/Reddit = 1.3x, random Twitter = 0.7x)

**Trigger Title Generation Rules (Part 9.5):**
- Complaints are NOT desires: "frustrated by X" not "want X"
- Preserve semantic meaning from original quote
- Include competitor name when known
- No truncated sentences

### M.4: Apply Research Insights to Query Generation

From TRIGGER_RESEARCH.md, generate better search queries:

**High-Intent Language Patterns to Search For:**
```
"We're evaluating..." / "We're looking at..."
"Has anyone migrated from..."
"What's the best alternative to..."
"We're switching from..."
"Our contract is up and..."
```

**Profile-Specific Trigger Events:**
| Profile | Key Triggers to Search |
|---------|------------------------|
| Local Service B2B | Equipment failure, compliance deadlines, contract cycles |
| Local Service B2C | Bad reviews, life events, provider changes |
| Regional B2B Agency | Leadership changes, RFP windows, budget cycles |
| National SaaS B2B | Funding rounds, hiring surges, tech stack changes |

### M.5: Post-Synthesis Validation (Light Touch)

Apply validation AFTER the LLM synthesizer outputs triggers:

1. **JTBD Match:** Does trigger align with brand's jobs-to-be-done?
2. **UVP Relevance:** Does it connect to a specific UVP component?
3. **Semantic Sanity:** Title makes grammatical sense?

**Do NOT filter on:**
- URL presence (scraper data doesn't have URLs)
- Pre-defined quote patterns (LLM handles this)

---

## Implementation Steps

### Step 1: Revert Phase L Changes (30 min)

```typescript
// trigger-consolidation.service.ts
// REMOVE: isMinimumViableTrigger, hasValidSourceUrl, URL filtering
// KEEP: filterValidEvidence but simplify to just quote quality checks

private filterValidEvidence(evidence: EvidenceItem[]): EvidenceItem[] {
  return evidence.filter(e => {
    // Just basic sanity checks - LLM synthesis handles the rest
    if (!e.quote || e.quote.length < 15) return false;
    if (this.isNoDataResponse(e.quote)) return false;
    if (this.isMarketingCopy(e.quote)) return false;
    return true;
  });
}
```

### Step 2: Fix Streaming API to Pass Data to Synthesizer (45 min)

```typescript
// streaming-api-manager.ts
// CHANGE: Don't try to validate Perplexity JSON
// CHANGE: Collect ALL scraper data without blocking
// CHANGE: Call llm-trigger-synthesizer with raw samples

// After all APIs complete:
if (this.bufferedSamples.length > 0) {
  const synthesizedTriggers = await llmTriggerSynthesizer.synthesize(
    this.bufferedSamples,
    uvp,
    profileType
  );
  this.emitUpdate('triggers-synthesized', synthesizedTriggers);
}
```

### Step 3: Enhance LLM Synthesizer Prompt (1 hr)

```typescript
// llm-trigger-synthesizer.service.ts
// The prompt should extract psychological triggers from raw data

const SYNTHESIS_PROMPT = `
You are analyzing raw social media posts and reviews to extract psychological buying triggers.

Brand Context:
- Industry: ${industry}
- Target Customer: ${targetCustomer}
- Key Products: ${products}
- Value Proposition: ${uvpStatement}

Raw Data (${samples.length} posts/reviews):
${samples.map(s => `[${s.platform}] ${s.text}`).join('\n')}

Extract 5-15 psychological triggers. Each trigger should:
1. Be a SPECIFIC pain point or desire that would make someone buy THIS product
2. Have a title that preserves sentiment (complaints = "frustrated by", not "want")
3. Include which competitor's users are affected (if known)
4. Map to a psychological category: frustration, desire, fear, trust, urgency, motivation

Format each trigger as:
{
  "title": "HubSpot users frustrated by limited automation workflows",
  "category": "frustration",
  "summary": "2-3 sentence executive summary explaining the trigger",
  "evidence": [
    {"quote": "actual quote from raw data", "platform": "source platform"}
  ],
  "competitor": "HubSpot" or null,
  "uvpMatch": "which UVP component this addresses"
}

RULES:
- Extract REAL insights from the data, don't make things up
- If a post is irrelevant (crypto, spam, off-topic), skip it
- Complaints should NOT become desires - preserve the original sentiment
- Include competitor name when the complaint is about a specific product
`;
```

### Step 4: Remove Perplexity Trigger Attempts (30 min)

Stop asking Perplexity for triggers. Use it ONLY for industry research if needed.

```typescript
// streaming-api-manager.ts
// REMOVE: loadPerplexityTriggers, STRUCTURED_JSON_FORMAT, etc.
// KEEP: Perplexity for general industry insights (optional)
```

---

## Expected Results After Phase M

| Metric | Before (Phase L) | After (Phase M) |
|--------|------------------|-----------------|
| Triggers displayed | 1-2 garbage | 10-20 real |
| Luna crypto tweets | Yes (displayed as trigger) | No (filtered by synthesizer) |
| Meta-commentary | Rejected everything | Handled by LLM |
| Real psychological insights | None | Extracted from raw data |
| User trust | Broken | Restored |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/services/triggers/trigger-consolidation.service.ts` | Simplify filtering, remove URL checks |
| `src/services/intelligence/streaming-api-manager.ts` | Remove Perplexity JSON, pass data to synthesizer |
| `src/services/intelligence/llm-trigger-synthesizer.service.ts` | Enhanced synthesis prompt |
| `src/services/triggers/quote-validator.service.ts` | DELETE (not needed) |

---

## Key Principle

> "The LLM synthesizer is where the magic happens. Stop trying to be smart at collection time."

Phase M restores the V1 pattern: collect raw data, let LLM extract intelligence, validate AFTER synthesis.
