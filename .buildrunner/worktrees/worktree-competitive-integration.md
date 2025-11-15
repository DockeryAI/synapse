# Worktree Task: Competitive Intelligence Integration (MVP)

**Feature ID:** `competitive-intelligence-integration`
**Branch:** `feature/competitive-integration`
**Estimated Time:** 6 hours
**Priority:** CRITICAL (MVP - Powers Competitor Crusher Campaign)
**Dependencies:** None (Competitive Intelligence Service already exists!)
**Worktree Path:** `../synapse-competitive`

---

## Context

**Integration of existing Competitive Intelligence Service** into the campaign generation flow. This service is **already built** at `src/services/intelligence/competitive-intelligence.service.ts` - it just needs to be wired into campaigns and enhanced with SEMrush keyword opportunities.

**What This Enables:**
- **Competitor Crusher Campaign** - one of 4 strategic MVP campaign types
- Content gap analysis (what competitors aren't covering)
- Keyword opportunity detection (quick wins, high-value targets)
- Counter-messaging and differentiation angles
- Market positioning insights

**Example Content:**
- "Unlike [competitor trend], we believe in [your unique angle]"
- "Addressing the [pain point competitors ignore]"
- "Why we don't [common competitor practice]"

---

## What Already Exists

### Existing Code (Ready to Use):

**`src/services/intelligence/competitive-intelligence.service.ts`**
- Competitor profiling
- Serper integration (rankings, news, videos)
- Website analyzer integration (competitor messaging)
- Basic Apify integration (competitor reviews)

**What It Does:**
- Discovers competitors via search
- Analyzes competitor web presence
- Extracts competitor messaging
- Identifies content patterns

**What It Needs:**
- Integration into campaign generation flow
- Enhanced SEMrush usage (keyword opportunities)
- Content gap detection logic
- UI for displaying competitive insights

---

## Setup

```bash
cd /Users/byronhudson/Projects/Synapse
git worktree add ../synapse-competitive feature/competitive-integration
cd ../synapse-competitive
npm install

# No new packages needed - all APIs already integrated
```

Verify `.env` has:
```
VITE_SEMRUSH_API_KEY=your-key
VITE_SERPER_API_KEY=your-key
VITE_APIFY_API_KEY=your-key
```

---

## Task Checklist

### Part 1: Enhance SEMrush Service (2 hours)

#### File: `src/services/intelligence/semrush-api.ts` (extend existing)

**Add New Methods:**

- [ ] `getKeywordOpportunities(domain: string): Promise<KeywordOpportunity[]>`
  - Call SEMrush position tracking
  - Identify keywords ranking 11-20 (quick wins)
  - Identify high-volume, low-rank keywords (high-value)
  - Identify growing keywords (long-term opportunities)
  - Return prioritized list

- [ ] `getKeywordGaps(yourDomain: string, competitorDomain: string): Promise<KeywordGap[]>`
  - Compare your rankings vs competitor
  - Find keywords competitor ranks for but you don't
  - Identify content gap opportunities
  - Return actionable keyword list

- [ ] `getDomainOverview(domain: string): Promise<DomainMetrics>`
  - Get authority score
  - Get backlink count
  - Get organic traffic estimate
  - Compare competitive strength

**Implementation Pattern:**
```typescript
export const SEMrushEnhanced = {
  async getKeywordOpportunities(domain: string) {
    // Get all keyword rankings
    const rankings = await SEMrushAPI.getKeywordRankings(domain)

    // Categorize opportunities
    const quickWins = rankings.filter(k => k.position >= 11 && k.position <= 20)
    const highValue = rankings.filter(k => k.searchVolume > 1000 && k.position > 20)

    return {
      quickWins: quickWins.slice(0, 10),
      highValue: highValue.slice(0, 10),
      totalOpportunities: quickWins.length + highValue.length
    }
  },

  async getKeywordGaps(yourDomain, competitorDomain) {
    const yourKeywords = await SEMrushAPI.getKeywordRankings(yourDomain)
    const theirKeywords = await SEMrushAPI.getKeywordRankings(competitorDomain)

    // Find keywords they rank for but you don't
    const gaps = theirKeywords.filter(theirKw =>
      !yourKeywords.some(yourKw => yourKw.keyword === theirKw.keyword)
    )

    return gaps.slice(0, 20) // Top 20 gaps
  }
}
```

---

### Part 2: Competitive Intelligence Integrator (2 hours)

#### File: `src/services/competitive-intelligence-integrator.service.ts` (new)

- [ ] `analyzeCompetitiveLandscape(businessProfile: BusinessProfile): Promise<CompetitiveLandscape>`
  - Use existing Competitive Intelligence Service
  - Discover top 3-5 competitors
  - Analyze their content strategies
  - Identify messaging patterns
  - Detect content gaps

- [ ] `generateContentGaps(competitors: Competitor[]): Promise<ContentGap[]>`
  - Analyze what topics competitors cover
  - Identify what they DON'T cover
  - Rank gaps by opportunity size
  - Return content ideas to fill gaps

- [ ] `generateDifferentiationAngles(businessProfile, competitors): Promise<DifferentiationAngle[]>`
  - Compare your UVP to competitor messaging
  - Find unique positioning opportunities
  - Generate counter-messaging ideas
  - Return differentiation content angles

- [ ] `combineWithSEMrush(domain: string, competitors: Competitor[]): Promise<CompetitiveInsights>`
  - Get keyword opportunities from SEMrush
  - Get keyword gaps for each competitor
  - Combine with content gap analysis
  - Return unified competitive intelligence

**Integration Pattern:**
```typescript
export const CompetitiveIntelligenceIntegrator = {
  async analyzeCompetitiveLandscape(businessProfile) {
    // Use existing service
    const competitors = await CompetitiveIntelligenceService.discoverCompetitors(
      businessProfile.businessName,
      businessProfile.industry
    )

    // Enhance with SEMrush
    const keywordGaps = await Promise.all(
      competitors.map(c => SEMrushEnhanced.getKeywordGaps(
        businessProfile.website,
        c.domain
      ))
    )

    // Generate content gaps
    const contentGaps = await this.generateContentGaps(competitors)

    return {
      competitors,
      keywordGaps: keywordGaps.flat(),
      contentGaps,
      opportunities: this.rankOpportunities(keywordGaps, contentGaps)
    }
  }
}
```

---

### Part 3: UI Components (1.5 hours)

#### File: `src/components/competitive/CompetitorGaps.tsx`

- [ ] Display top competitors
- [ ] Show content gaps (what they don't cover)
- [ ] Display keyword opportunities
- [ ] "Use This Angle" buttons to add to campaign

#### File: `src/components/competitive/KeywordOpportunities.tsx`

- [ ] Show quick wins (position 11-20)
- [ ] Show high-value keywords
- [ ] Display search volume and difficulty
- [ ] Filter by opportunity type

**UI Structure:**
```
┌─────────────────────────────────────┐
│ Competitive Intelligence            │
├─────────────────────────────────────┤
│ Top Competitors:                    │
│ • Competitor A (Authority: 65)      │
│ • Competitor B (Authority: 58)      │
├─────────────────────────────────────┤
│ Content Gaps They Miss:             │
│ 🎯 [Topic they don't cover]         │
│    Opportunity: High                │
│    [Create Content]                 │
├─────────────────────────────────────┤
│ Keyword Opportunities:              │
│ 🚀 "keyword phrase" (Rank 14)       │
│    Quick Win - 2,400 searches/mo    │
│    [Target This]                    │
└─────────────────────────────────────┘
```

---

### Part 4: Database Schema (30 minutes)

#### Migration: `supabase/migrations/20251115000003_competitive_intelligence.sql`

```sql
-- Competitor profiles
create table competitor_profiles (
  id uuid default gen_random_uuid() primary key,
  business_profile_id uuid references business_profiles(id),
  competitor_name text not null,
  competitor_domain text,
  authority_score int,
  analyzed_at timestamp with time zone default now(),
  messaging_summary jsonb,
  content_topics jsonb
);

-- Keyword opportunities from SEMrush
create table keyword_opportunities (
  id uuid default gen_random_uuid() primary key,
  business_profile_id uuid references business_profiles(id),
  keyword text not null,
  current_position int,
  search_volume int,
  opportunity_type text, -- quick_win, high_value, long_term
  difficulty int,
  created_at timestamp with time zone default now()
);

-- Content gaps identified
create table content_gaps (
  id uuid default gen_random_uuid() primary key,
  business_profile_id uuid references business_profiles(id),
  gap_topic text not null,
  opportunity_size text, -- high, medium, low
  competitor_coverage jsonb, -- which competitors cover it
  content_suggestions jsonb,
  status text default 'pending',
  created_at timestamp with time zone default now()
);

-- Indexes
create index competitor_profiles_business_idx on competitor_profiles(business_profile_id);
create index keyword_opportunities_business_idx on keyword_opportunities(business_profile_id);
create index content_gaps_business_idx on content_gaps(business_profile_id);
```

---

## Integration with Campaign Generator

```typescript
// In campaign-generator.service.ts
async function generateCompetitorCrusherCampaign(businessProfile) {
  // Analyze competitive landscape
  const landscape = await CompetitiveIntelligenceIntegrator
    .analyzeCompetitiveLandscape(businessProfile)

  // Get content gaps
  const gaps = landscape.contentGaps.filter(g => g.opportunitySize === 'high')

  // Get keyword opportunities
  const keywords = landscape.keywordGaps.slice(0, 10)

  // Generate differentiation content
  const posts = []

  // Gap-filling posts
  for (const gap of gaps) {
    posts.push({
      content: await generateGapFillingPost(gap, businessProfile),
      contentType: 'competitor_gap',
      keywords: gap.relatedKeywords
    })
  }

  // Counter-messaging posts
  const angles = await CompetitiveIntelligenceIntegrator
    .generateDifferentiationAngles(businessProfile, landscape.competitors)

  for (const angle of angles) {
    posts.push({
      content: await generateCounterMessagingPost(angle, businessProfile),
      contentType: 'differentiation'
    })
  }

  return posts
}
```

---

## Type Definitions

```typescript
export interface KeywordOpportunity {
  keyword: string
  currentPosition: number
  searchVolume: number
  opportunityType: 'quick_win' | 'high_value' | 'long_term'
  difficulty: number
  estimatedTrafficGain: number
}

export interface ContentGap {
  gapTopic: string
  opportunitySize: 'high' | 'medium' | 'low'
  competitorCoverage: string[] // competitor names
  contentSuggestions: string[]
  relatedKeywords: string[]
}

export interface CompetitiveLandscape {
  competitors: Competitor[]
  keywordGaps: KeywordOpportunity[]
  contentGaps: ContentGap[]
  opportunities: RankedOpportunity[]
}

export interface DifferentiationAngle {
  angle: string
  counterMessage: string
  uniqueValue: string
  targetAudience: string
}
```

---

## Testing

```typescript
describe('Competitive Intelligence Integration', () => {
  it('discovers competitors', async () => {
    const landscape = await CompetitiveIntelligenceIntegrator
      .analyzeCompetitiveLandscape(mockProfile)
    expect(landscape.competitors.length).toBeGreaterThan(0)
  })

  it('identifies keyword gaps', async () => {
    const gaps = await SEMrushEnhanced.getKeywordGaps(
      'yourdomain.com',
      'competitor.com'
    )
    expect(gaps.length).toBeGreaterThan(0)
  })

  it('generates content gap suggestions', async () => {
    const gaps = await CompetitiveIntelligenceIntegrator
      .generateContentGaps(mockCompetitors)
    expect(gaps[0]).toHaveProperty('contentSuggestions')
  })
})
```

---

## Completion Criteria

- [ ] SEMrush enhanced with keyword opportunities
- [ ] Competitive Intelligence Service integrated
- [ ] Content gap detection working
- [ ] Differentiation angle generation functional
- [ ] UI components display insights
- [ ] Database migration applied
- [ ] Integrated with Competitor Crusher campaign
- [ ] Tested with real competitors
- [ ] No TypeScript errors

---

## Commit & Merge

```bash
git add .
git commit -m "feat: Integrate competitive intelligence into MVP campaigns

SEMrush Enhancements:
- Keyword opportunity detection (quick wins, high-value, long-term)
- Keyword gap analysis vs competitors
- Domain authority and metrics

Competitive Intelligence Integration:
- Use existing Competitive Intelligence Service
- Content gap detection
- Differentiation angle generation
- Counter-messaging suggestions

Database:
- competitor_profiles table
- keyword_opportunities table
- content_gaps table

UI:
- Competitor gaps display
- Keyword opportunities list
- One-click opportunity usage

Powers Competitor Crusher campaign - one of 4 MVP campaign types.
Implements competitive-intelligence-integration feature"

git push origin feature/competitive-integration
cd /Users/byronhudson/Projects/Synapse
git merge --no-ff feature/competitive-integration
git push origin main
git worktree remove ../synapse-competitive
```

---

## Cost Estimates

**SEMrush API:**
- Already have subscription
- No additional cost for enhanced usage

**Existing APIs (Serper, Apify):**
- Already integrated in Competitive Intelligence Service
- ~$0.10-0.15 per competitor analysis

**Monthly (50 businesses, avg 3 competitors each):**
- Competitor analysis: ~$22.50
- **Total: ~$22.50/month** (absorbed in existing intelligence budget)

---

*This is leveraging code we already built! The Competitive Intelligence Service is sitting there unused. Just needs to be wired into campaigns and SEMrush needs keyword opportunities added.*
