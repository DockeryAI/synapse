# Local 2.0 Build Plan

## Overview

The **Local Tab** surfaces community events, local news, and neighborhood happenings that businesses can leverage for timely, relevant content. This is separate from the Weather Tab (atmospheric conditions) - Local focuses on **community pulse**.

**Target Industries:** Local B2B Service, Local B2C Service, Regional B2C Retail
**Not For:** National SaaS, National Consumer Products, Regional B2B Agencies

---

## Architecture

### Data Flow

```
UVP Data → Location Extraction → Query Generation → API Calls → Validation → Relevance Scoring → UI Display
    ↓              ↓                    ↓                ↓            ↓              ↓
 Brand ID    city/state/zip     location-aware      Serper News   De-dupe      Industry match
             neighborhood        queries            Serper Places  Freshness    Timing score
             industry                               Perplexity     Source       Location proximity
```

### API Stack (No Weather - Handled by Weather Tab)

| API | Method | Purpose |
|-----|--------|---------|
| **Serper News** | `getNews(topic, location)` | Local news articles |
| **Serper Places** | `getPlaces(query, location)` | Event venues, happenings |
| **Perplexity** | AI synthesis | Community event discovery |

---

## File Structure

```
src/
├── pages/
│   └── LocalDevPage.tsx                    # Isolated dev page
├── hooks/
│   └── useStreamingLocal.ts                # Data fetching + caching
├── services/
│   └── local/
│       ├── local-query-generator.service.ts    # UVP → queries
│       ├── local-relevance-scorer.service.ts   # Score insights
│       ├── local-insight-processor.service.ts  # Process raw → structured
│       └── types.ts                            # TypeScript types
└── components/
    └── v4/
        └── LocalInsightCard.tsx            # Card component (if needed)
```

---

## Phase 1: Types & Query Generator

### 1.1 Types (`src/services/local/types.ts`)

```typescript
export type LocalInsightType = 'event' | 'news' | 'community' | 'school' | 'sports' | 'charity';

export interface LocalInsight {
  id: string;
  type: LocalInsightType;
  title: string;
  description: string;
  date?: string;
  location: string;
  relevanceScore: number;
  urgency: 'high' | 'medium' | 'low';
  timing: {
    isUpcoming: boolean;
    daysUntil?: number;
    isOngoing: boolean;
    isPast: boolean;
  };
  contentAngles: string[];
  sources: Array<{
    name: string;
    url?: string;
    type: 'serper_news' | 'serper_places' | 'perplexity';
  }>;
}

export interface LocalQueryConfig {
  location: {
    city: string;
    state: string;
    neighborhood?: string;
  };
  industry: string;
  businessName?: string;
}

export interface LocalPipelineResult {
  insights: LocalInsight[];
  stats: {
    rawCount: number;
    validatedCount: number;
    highRelevanceCount: number;
    byType: Record<LocalInsightType, number>;
  };
  apisUsed: string[];
  location: string;
}
```

### 1.2 Query Generator (`src/services/local/local-query-generator.service.ts`)

Generate location-aware queries from UVP data:

```typescript
export function generateLocalQueries(config: LocalQueryConfig): string[] {
  const { city, state, neighborhood } = config.location;
  const { industry } = config;

  const queries = [
    // Event discovery
    `${city} events this week`,
    `${city} ${state} upcoming events`,
    `${city} community events`,

    // Industry-specific local
    `${city} ${industry} news`,
    `${industry} events ${city}`,

    // School/sports (B2C relevance)
    `${city} school events`,
    `${city} high school sports`,

    // Community
    `${city} charity events`,
    `${city} festivals`,
    `${city} grand openings`,

    // Neighborhood if available
    ...(neighborhood ? [
      `${neighborhood} ${city} events`,
      `${neighborhood} community news`
    ] : [])
  ];

  return queries;
}
```

---

## Phase 2: Hook & Pipeline

### 2.1 useStreamingLocal Hook (`src/hooks/useStreamingLocal.ts`)

```typescript
interface UseStreamingLocalReturn {
  state: {
    stage: string;
    progress: number;
    statusMessage: string;
  };
  result: LocalPipelineResult | null;
  hasCachedData: boolean;
  executePipeline: (uvp: CompleteUVP) => Promise<void>;
  clearCache: () => void;
  isLoading: boolean;
  isComplete: boolean;
  hasError: boolean;
}
```

**Pipeline Stages:**
1. Extract location from UVP (10%)
2. Generate queries (20%)
3. Call Serper News API (40%)
4. Call Serper Places API (60%)
5. Call Perplexity for synthesis (80%)
6. Score & validate insights (90%)
7. Complete (100%)

### 2.2 Relevance Scoring

```typescript
function scoreLocalInsight(insight: RawInsight, config: LocalQueryConfig): number {
  let score = 50; // Base score

  // Industry match: +30
  if (matchesIndustry(insight, config.industry)) score += 30;

  // Location proximity: +20
  if (isInCity(insight, config.location.city)) score += 20;
  if (isInNeighborhood(insight, config.location.neighborhood)) score += 10;

  // Timing: +15 for upcoming, -10 for past
  if (insight.timing.isUpcoming && insight.timing.daysUntil <= 14) score += 15;
  if (insight.timing.isPast) score -= 10;

  // Source quality: +5 for multiple sources
  if (insight.sources.length > 1) score += 5;

  return Math.min(100, Math.max(0, score));
}
```

---

## Phase 3: LocalDevPage

### 3.1 Page Structure (Matching TrendsDevPage)

```
┌─────────────────────────────────────────────────────────────────┐
│ Top Bar: Local 2.0 | Brand: {name} | Location: {city, state}    │
│ [Clear Cache] [Run Local 2.0]                                   │
├──────────┬────────────────────────────────────┬─────────────────┤
│          │ Filter Tabs:                       │                 │
│   UVP    │ [All] [Events] [News] [Community]  │    Stats        │
│ Building │ [School] [Sports] [Charity]        │    Panel        │
│  Blocks  │                                    │                 │
│          │ ┌─────────┐ ┌─────────┐           │  Raw: 45        │
│          │ │ Insight │ │ Insight │           │  Valid: 28      │
│          │ │  Card   │ │  Card   │           │  High: 12       │
│          │ └─────────┘ └─────────┘           │                 │
│          │ ┌─────────┐ ┌─────────┐           │  By Type:       │
│          │ │ Insight │ │ Insight │           │  Events: 8      │
│          │ │  Card   │ │  Card   │           │  News: 10       │
│          │ └─────────┘ └─────────┘           │  Community: 5   │
└──────────┴────────────────────────────────────┴─────────────────┘
```

### 3.2 Key Features

1. **No API calls on load** - Only fires when button pressed
2. **Clear Cache button** - Wipes local storage cache
3. **Filter by type** - Events, News, Community, School, Sports, Charity
4. **Expandable cards** - Show content angles, sources
5. **Generate Content button** - Create post from insight

### 3.3 Card Display

Each LocalInsightCard shows:
- Type icon (🎪 event, 📰 news, 🏫 school, ⚽ sports, 💝 charity)
- Title
- Date/timing badge ("In 5 days", "This weekend", "Ongoing")
- Location
- Relevance score (badge)
- Expandable: Content angles, suggested hooks, sources

---

## Phase 4: Content Generation

### 4.1 Content Angles by Type

| Type | Content Angles |
|------|----------------|
| **Event** | Participation, tie-in offer, before/after coverage |
| **News** | Commentary, support, community pride |
| **School** | Student/teacher appreciation, scheduling around |
| **Sports** | Game day specials, team support, sponsorship |
| **Charity** | Donation match, volunteer spotlight, cause alignment |

### 4.2 Hook Templates

```typescript
const HOOK_TEMPLATES: Record<LocalInsightType, string[]> = {
  event: [
    "Join us at {event}!",
    "Stop by before/after {event} for {offer}",
    "Proud to be part of {event}",
  ],
  news: [
    "Exciting news for {city}!",
    "What {news} means for our community",
    "Supporting {topic} in our neighborhood",
  ],
  school: [
    "Teachers get {offer} all month!",
    "Back-to-school ready at {business}",
    "Congrats to {school} graduates!",
  ],
  sports: [
    "Game day special: {offer}",
    "Go {team}! Show your colors for {discount}",
    "Proud sponsor of {team}",
  ],
  charity: [
    "Proud to support {charity}",
    "We're matching donations to {cause}",
    "Join us at {charity_event}",
  ],
};
```

---

## Implementation Checklist

### Phase 1: Foundation
- [x] Create `src/services/local/types.ts` ✅ 2025-11-30
- [x] Create `src/services/local/local-query-generator.service.ts` ✅ 2025-11-30
- [x] Create `src/services/local/local-relevance-scorer.service.ts` ✅ 2025-11-30

### Phase 2: Pipeline
- [x] Create `src/hooks/useStreamingLocal.ts` ✅ 2025-11-30
- [x] Implement caching (localStorage) ✅ 2025-11-30
- [x] Wire up Serper News API ✅ 2025-11-30
- [ ] Wire up Serper Places API (skipped - news + perplexity sufficient)
- [x] Wire up Perplexity synthesis ✅ 2025-11-30

### Phase 3: UI
- [x] Create `src/pages/LocalDevPage.tsx` ✅ 2025-11-30
- [x] Add route to router (`/local-dev`) ✅ 2025-11-30
- [x] Implement filter tabs (main + type filters) ✅ 2025-11-30
- [x] Implement insight cards (expandable with content angles) ✅ 2025-11-30
- [x] Add stats panel ✅ 2025-11-30

### Phase 4: Polish
- [x] Content angle generation (per type) ✅ 2025-11-30
- [x] Generate Content button (UI placeholder) ✅ 2025-11-30
- [x] Error handling ✅ 2025-11-30
- [x] Loading states (progress bar) ✅ 2025-11-30
- [x] Manual location override ✅ 2025-11-30

### Phase 5: Content Generation (Added 2025-11-30)
- [x] Create `src/services/local/local-content-generator.service.ts` ✅ 2025-11-30
- [x] Wire Generate Content button to content service ✅ 2025-11-30
- [x] Add content modal to display generated content ✅ 2025-11-30
- [x] Add hook template variable interpolation ✅ 2025-11-30

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Insights per scan | 15-25 |
| High-relevance (>70) | >40% |
| API response time | <10s total |
| Content generation rate | >25% of insights |

---

## Dependencies

- `useBrand` hook (existing)
- `getUVPByBrand` service (existing)
- `SerperAPI` service (existing)
- `PerplexityAPI` service (existing)
- `UVPBuildingBlocks` component (existing)

---

*Created: 2025-11-29*
*Status: ✅ BUILT - Live at /local-dev*
*Completed: 2025-11-30*
