# Worktree Task: Perplexity Local Intelligence & Events

**Feature ID:** `perplexity-local-intelligence`
**Branch:** `feature/perplexity-local`
**Estimated Time:** 4 hours
**Priority:** CRITICAL (MVP - Powers Local Pulse Campaign)
**Dependencies:** Location Detection (should be complete)
**Worktree Path:** `../synapse-perplexity`

---

## Context

**Perplexity API integration for real-time local event discovery.** This powers the **Local Pulse Campaign** type - one of 4 strategic campaign types in the MVP.

**What This Enables:**
- Discover local festivals, events, community happenings
- Monitor local news for engagement opportunities
- Identify local causes and charities to support
- Detect trending local topics
- Combine with weather for hyper-local relevance

**Example Content Opportunities:**
- "Join us at [Annual Food Festival] this weekend!"
- "Proud to support [Local Charity Drive for shelter]"
- "Stay warm with our cozy [product/service] during [weather event]"

---

## Prerequisites

- Perplexity API key (add to .env)
- Location Detection service complete (provides city, state for queries)
- Basic database schema setup

---

## Setup

```bash
cd /Users/byronhudson/Projects/Synapse
git worktree add ../synapse-perplexity feature/perplexity-local
cd ../synapse-perplexity
npm install

# No additional packages needed - use fetch or axios
```

Add to `.env`:
```
VITE_PERPLEXITY_API_KEY=your-key-here
```

---

## Task Checklist

### Part 1: Perplexity API Service (2 hours)

#### File: `src/services/intelligence/perplexity-api.ts`

- [ ] `searchLocalEvents(location: string, radius?: string): Promise<LocalEvent[]>`
  - Query: "upcoming events in [city, state] this week"
  - Parse response for festivals, community events, celebrations
  - Return structured event data

- [ ] `searchLocalNews(location: string): Promise<LocalNews[]>`
  - Query: "local news [city, state] last 24 hours"
  - Extract headlines, topics, relevance
  - Filter for business-relevant news

- [ ] `searchLocalCauses(location: string): Promise<LocalCause[]>`
  - Query: "local charities and community causes in [city, state]"
  - Find ongoing charity drives, fundraisers, community initiatives
  - Return opportunities for business involvement

- [ ] `searchTrendingLocal(location: string): Promise<TrendingTopic[]>`
  - Query: "trending topics [city, state]"
  - Detect what's popular in the local area
  - Return content angles

**Implementation Pattern:**
```typescript
import { PerplexityAPI } from '@/lib/perplexity'

export const PerplexityLocalService = {
  async searchLocalEvents(location: string, radius = '25 miles') {
    const query = `upcoming local events, festivals, and community gatherings in ${location} within the next 30 days`

    const response = await PerplexityAPI.search(query, {
      focus: 'local',
      recency_filter: 'month'
    })

    // Parse response into structured events
    return parseEventsFromResponse(response)
  },

  async searchLocalNews(location: string) {
    const query = `local news ${location} last 24 hours`

    const response = await PerplexityAPI.search(query, {
      focus: 'news',
      recency_filter: 'day'
    })

    return parseNewsFromResponse(response)
  }
}
```

---

### Part 2: Local Event Detector (1 hour)

#### File: `src/services/local-event-detector.service.ts`

- [ ] `detectOpportunities(businessProfile: BusinessProfile): Promise<EventOpportunity[]>`
  - Get location from business profile
  - Search Perplexity for local events
  - Match events to business type
  - Rank by relevance
  - Return content opportunities

- [ ] `matchEventToBusiness(event: LocalEvent, businessType: string): number`
  - Score event relevance (0-100)
  - Consider: event type, business industry, audience overlap
  - Return relevance score

- [ ] `generateContentSuggestions(opportunity: EventOpportunity): ContentSuggestion[]`
  - Create post ideas based on event
  - Examples: "Join us at [event]", "Supporting [cause]", "Perfect for [event attendees]"
  - Return actionable content suggestions

---

### Part 3: Database Integration (30 minutes)

#### Migration: `supabase/migrations/20251115000002_perplexity_local.sql`

```sql
-- Local events discovered by Perplexity
create table local_events (
  id uuid default gen_random_uuid() primary key,
  location text not null,
  event_name text not null,
  event_date date,
  description text,
  event_type text, -- festival, fundraiser, community, seasonal
  source_url text,
  discovered_at timestamp with time zone default now(),
  relevance_score int
);

-- Local news items
create table local_news (
  id uuid default gen_random_uuid() primary key,
  location text not null,
  headline text not null,
  summary text,
  published_at timestamp with time zone,
  source text,
  discovered_at timestamp with time zone default now()
);

-- Event opportunities matched to businesses
create table event_opportunities (
  id uuid default gen_random_uuid() primary key,
  business_profile_id uuid references business_profiles(id),
  event_id uuid references local_events(id),
  relevance_score int,
  content_suggestions jsonb,
  status text default 'pending', -- pending, used, dismissed
  created_at timestamp with time zone default now()
);

-- Indexes
create index local_events_location_idx on local_events(location);
create index local_events_date_idx on local_events(event_date);
create index local_news_location_idx on local_news(location);
create index event_opportunities_business_idx on event_opportunities(business_profile_id);
```

---

### Part 4: UI Component (30 minutes)

#### File: `src/components/local/EventOpportunities.tsx`

- [ ] Display upcoming local events for business location
- [ ] Show relevance scores
- [ ] Display content suggestions
- [ ] "Use This Event" button to add to campaign
- [ ] Filter by event type

**UI Structure:**
```
┌─────────────────────────────────────┐
│ Local Events & Opportunities        │
├─────────────────────────────────────┤
│ 📅 Annual Food Festival             │
│    This Weekend • High Relevance    │
│    💡 "Join us before/after fest!"  │
│    [Use This Event]                 │
├─────────────────────────────────────┤
│ 💚 Local Shelter Charity Drive      │
│    Next Week • Medium Relevance     │
│    💡 "Proud to support..."         │
│    [Use This Event]                 │
└─────────────────────────────────────┘
```

---

## Type Definitions

```typescript
export interface LocalEvent {
  id: string
  location: string
  eventName: string
  eventDate: Date
  description: string
  eventType: 'festival' | 'fundraiser' | 'community' | 'seasonal' | 'other'
  sourceUrl?: string
  discoveredAt: Date
  relevanceScore: number
}

export interface LocalNews {
  id: string
  location: string
  headline: string
  summary: string
  publishedAt: Date
  source: string
  discoveredAt: Date
}

export interface EventOpportunity {
  id: string
  businessProfileId: string
  event: LocalEvent
  relevanceScore: number
  contentSuggestions: ContentSuggestion[]
  status: 'pending' | 'used' | 'dismissed'
  createdAt: Date
}

export interface ContentSuggestion {
  text: string
  tone: string
  platform: string[]
  estimatedReach: number
}
```

---

## Integration with Campaign Generator

```typescript
// In campaign-generator.service.ts
async function generateLocalPulseCampaign(businessProfile) {
  // Get local opportunities
  const opportunities = await LocalEventDetector.detectOpportunities(businessProfile)

  // Filter by relevance
  const topOpportunities = opportunities.filter(o => o.relevanceScore > 70)

  // Generate posts using event data
  const posts = topOpportunities.map(opp => ({
    content: opp.contentSuggestions[0].text,
    scheduledDate: opp.event.eventDate,
    platform: opp.contentSuggestions[0].platform,
    contentType: 'local_event_tie_in'
  }))

  return posts
}
```

---

## Testing

```typescript
describe('Perplexity Local Intelligence', () => {
  it('discovers local events', async () => {
    const events = await PerplexityLocalService.searchLocalEvents('Austin, TX')
    expect(events.length).toBeGreaterThan(0)
    expect(events[0]).toHaveProperty('eventName')
  })

  it('matches events to business type', async () => {
    const event = { eventType: 'food_festival', ... }
    const score = matchEventToBusiness(event, 'restaurant')
    expect(score).toBeGreaterThan(70) // High relevance
  })

  it('generates content suggestions', async () => {
    const opportunity = { event: mockEvent, ... }
    const suggestions = generateContentSuggestions(opportunity)
    expect(suggestions[0].text).toContain(mockEvent.eventName)
  })
})
```

---

## Completion Criteria

- [ ] Perplexity API service functional
- [ ] Local events discovered and stored
- [ ] Local news monitored
- [ ] Event opportunities matched to businesses
- [ ] Content suggestions generated
- [ ] UI component displays opportunities
- [ ] Database migration applied
- [ ] Integrated with Local Pulse campaign type
- [ ] Tested with real locations
- [ ] No TypeScript errors

---

## Commit & Merge

```bash
git add .
git commit -m "feat: Add Perplexity local intelligence for Local Pulse campaigns

Perplexity API Integration:
- Real-time local event discovery
- Local news monitoring
- Community cause detection
- Trending local topics

Event Opportunity Detection:
- Match events to business type
- Relevance scoring
- Content suggestion generation

Database:
- local_events table
- local_news table
- event_opportunities table

UI:
- Event opportunities display
- Content suggestions preview
- One-click event usage

Powers Local Pulse campaign type - one of 4 MVP campaign types.
Implements perplexity-local-intelligence feature"

git push origin feature/perplexity-local
cd /Users/byronhudson/Projects/Synapse
git merge --no-ff feature/perplexity-local
git push origin main
git worktree remove ../synapse-perplexity
```

---

## Cost Estimates

**Perplexity API:**
- ~$0.01 per search query
- Typical usage: 5 queries per business onboarding
- **Cost per business:** ~$0.05

**Monthly (50 businesses):**
- Onboarding: $2.50
- Weekly refreshes: ~$10
- **Total: ~$12.50/month**

Very affordable for the value added to Local Pulse campaigns.

---

*This is a quick-win feature. Perplexity provides unique local intelligence that competitors don't have. Local businesses will love this.*
