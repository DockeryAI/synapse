# Keywords 2.0 Build Plan

## Overview
Extract intent-based keywords (what the brand is TRYING to rank for based on site content) and validate with SEMrush for search volume. Following streaming architecture pattern - parallel loading at earliest UVP time.

## Architecture Pattern
Following established patterns from:
- `streaming-api-manager.ts` - EventEmitter-based progressive loading
- `early-trigger-loader.service.ts` - Start loading as soon as brandId/URL available
- `semrush-api.ts` - SEMrush Edge Function proxy

## Data Sources

### Primary: On-Site Intent Extraction
Extract keywords the brand WANTS to rank for from:
1. **Meta tags**: `<meta name="keywords">`, `<meta name="description">`
2. **Title tag**: `<title>` - often contains primary target keyword
3. **H1 headings**: Primary page topics
4. **Schema.org data**: `@type`, `about`, `keywords` properties
5. **OG tags**: `og:description`, `og:title`

### Secondary: SEMrush Validation
Validate extracted keywords with real search data:
1. **Search volume** - Monthly searches
2. **Difficulty** - Competition level (KD score)
3. **Position** - Current ranking if any
4. **Traffic** - Estimated organic traffic

## Implementation Phases

### Phase 1: Early Keyword Extraction Service
**Status**: [ ] Pending

Create `keyword-extraction.service.ts`:
```typescript
// Extracts intent keywords from website HTML
interface ExtractedKeywords {
  source: 'meta' | 'title' | 'h1' | 'schema' | 'og';
  keyword: string;
  weight: number; // 1-10 priority
}

// Fire as soon as brandId/URL available (parallel with other scans)
// Uses same pattern as earlyTriggerLoaderService
```

Tasks:
- [ ] Create `src/services/keywords/keyword-extraction.service.ts`
- [ ] Extract from HTML response (use existing Apify website scrape)
- [ ] Deduplicate and rank by weight/frequency
- [ ] Emit 'keywords-extracted' event

### Phase 2: SEMrush Validation Hook
**Status**: [ ] Pending

Extend `semrush-api.ts` with batch keyword lookup:
```typescript
// Validate keywords with search volume
async validateKeywords(domain: string, keywords: string[]): Promise<ValidatedKeyword[]>

interface ValidatedKeyword {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  position?: number;
  isRanking: boolean;
}
```

Tasks:
- [ ] Add `validateKeywords` method to SemrushAPI
- [ ] Use domain_organic endpoint for position check
- [ ] Use keyword_overview for volume/difficulty
- [ ] Handle rate limits (batch requests)

### Phase 3: Early Loading Integration
**Status**: [ ] Pending

Wire into streaming architecture for parallel loading:

```typescript
// In streaming-api-manager.ts
// Add 'keywords-intent' to ApiEventType
// Fire keywords extraction as soon as brandId available

// Timeline:
// T+0ms: UVP flow starts, brandId known
// T+100ms: Fire keyword extraction (parallel)
// T+500ms: Fire SEMrush validation (parallel)
// T+2s: Keywords ready for sidebar
```

Tasks:
- [ ] Add 'keywords-intent' event type to streaming-api-manager
- [ ] Fire extraction in parallel at earliest UVP time
- [ ] Cache results in localStorage (1hr TTL)
- [ ] Stream validated keywords to sidebar

### Phase 4: Sidebar Integration
**Status**: [ ] Pending

Update `V4PowerModePanel.tsx` Keywords section:

Current implementation (lines 3776-3833) extracts from:
- `deepContext.business.profile.keywords`
- `deepContext.business.websiteAnalysis.keywords`
- UVP fallbacks

New implementation:
```typescript
interface KeywordItem {
  id: string;
  keyword: string;
  searchVolume?: number;
  difficulty?: number;
  position?: number;
  source: 'intent' | 'ranking' | 'uvp';
}

// Show loading skeleton while fetching
// Display with volume/difficulty badges
// Sort by relevance (intent > high-volume > ranking)
```

Tasks:
- [ ] Update keywordItems useMemo to use validated keywords
- [ ] Add loading state for keywords section
- [ ] Show search volume badge on each keyword chip
- [ ] Add "Fetch Keywords" button for refresh

## Caching Strategy

```typescript
// LocalStorage keys
'keywords_intent_${brandId}' // Extracted from site
'keywords_validated_${brandId}' // SEMrush enriched
'keywords_timestamp_${brandId}' // Cache timestamp

// TTL: 1 hour (same as other streaming data)
```

## Timeline / Parallel Loading

```
UVP Flow Start (T+0)
│
├── [T+100ms] Keyword Extraction (parallel)
│   └── Uses existing website scrape data
│
├── [T+500ms] SEMrush Validation (parallel)
│   └── Batch validate top 20 extracted keywords
│
├── [T+2s] First keywords arrive
│   └── Emit 'keywords-intent' event
│
└── [T+5s] Validated keywords ready
    └── Emit 'keywords-validated' event
```

## Files to Create/Modify

### New Files
1. `src/services/keywords/keyword-extraction.service.ts` - Extract from HTML
2. `src/services/keywords/keyword-validation.service.ts` - SEMrush wrapper
3. `src/hooks/useKeywords.ts` - React hook for sidebar

### Modified Files
1. `src/services/intelligence/streaming-api-manager.ts` - Add keywords event type
2. `src/services/intelligence/semrush-api.ts` - Add validateKeywords method
3. `src/components/v4/V4PowerModePanel.tsx` - Update keywords section

## Acceptance Criteria

1. Keywords load in parallel at T+100ms (not blocking UVP)
2. Sidebar shows keywords within 5s of UVP start
3. Each keyword displays search volume when available
4. Keywords are intent-based (what they want to rank for)
5. Cached results show immediately on repeat visits
6. Clear loading/skeleton state while fetching

## Execution Status

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Extraction Service | [x] Complete | Created `src/services/keywords/keyword-extraction.service.ts` |
| Phase 2: SEMrush Validation | [x] Complete | Created `src/services/keywords/keyword-validation.service.ts` |
| Phase 3: Early Loading | [x] Complete | Created `src/hooks/useKeywords.ts` with caching |
| Phase 4: Sidebar Integration | [x] Complete | Updated `V4PowerModePanel.tsx` with search volume badges |

## Implementation Summary (2025-11-30)

### Files Created
1. `src/services/keywords/keyword-extraction.service.ts`
   - EventEmitter-based service for extracting intent keywords
   - Extracts from meta tags, title, h1s, OG tags, schema data
   - Weights keywords by source priority (meta=10, title=9, h1=8, etc.)
   - 1-hour localStorage cache

2. `src/services/keywords/keyword-validation.service.ts`
   - Validates extracted keywords with SEMrush API
   - Gets search volume, difficulty, current position
   - Merges intent keywords with high-value ranking keywords
   - 1-hour localStorage cache

3. `src/hooks/useKeywords.ts`
   - React hook combining extraction + validation
   - Cache-first loading (shows cached immediately)
   - Streams fresh data as it arrives
   - Provides loading/validating states

### Files Modified
1. `src/components/v4/V4PowerModePanel.tsx`
   - Added `useKeywords` hook import
   - Added `brandId` prop to UVPBuildingBlocks
   - Replaced legacy keywordItems useMemo with hook-based implementation
   - Updated Keywords (SEO) section UI:
     - Loading spinner during extraction/validation
     - Search volume badges on keyword chips (e.g., "1k")
     - Green highlight for keywords currently ranking
     - Summary stats (total monthly searches, ranking count)
     - Tooltip with full details on hover

### Architecture
- Keywords load in parallel when deepContext.websiteAnalysis becomes available
- Cache-first approach: cached results show < 1 second
- SEMrush validation runs async, UI updates progressively
- No blocking of other sidebar data
