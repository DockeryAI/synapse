# Campaign Intelligence Plan - MVP & Future Phases

**Last Updated:** 2025-11-15
**Status:** Integrated into Build Plans

---

## Executive Summary

Synapse MVP will launch with **4 strategic campaign types** powered by 20+ data sources. Each campaign type addresses a specific business goal with AI-powered suggestions based on business type, location, and competitive landscape.

**New in MVP:**
- ✅ Perplexity API for real-time local events
- ✅ Competitive Intelligence Service integration (already built, now wired in)
- ✅ Enhanced SEMrush with keyword opportunities
- ✅ AI campaign type suggestions

---

## MVP Campaign Types

### 1. Authority Builder Campaign
**Goal:** Build industry expertise and thought leadership

**Data Sources:**
- DeepContext (Reddit, News, Google Reviews)
- YouTube content analysis
- Industry-specific insights

**Triggers:**
- Default for new users
- AI suggests for service businesses (consultants, agencies, B2B)
- User selects "establish expertise" goal

**Content Mix:**
- Educational posts (40%)
- Industry insights (30%)
- Expertise demonstration (20%)
- Thought leadership (10%)

**Ideal For:** Professional services, consultants, B2B companies

**Example Posts:**
- "5 industry trends you need to know in 2025"
- "Why [industry myth] is costing you money"
- "Deep dive: How [industry concept] really works"

---

### 2. Local Pulse Campaign 🆕
**Goal:** Drive local traffic and community engagement

**Data Sources:**
- **Perplexity API** (local events - NEW IN MVP)
- Weather patterns
- Local news
- Google Reviews (community feedback)

**Triggers:**
- AI detects local business (brick-and-mortar)
- User selects "local focus" goal
- High local search intent detected

**Content Mix:**
- Event tie-ins (35%)
- Community involvement (25%)
- Seasonal relevance (25%)
- Local partnerships (15%)

**Ideal For:** Restaurants, retail, local services, franchises

**Example Posts:**
- "Join us at [Annual Food Festival detected by Perplexity] this weekend!"
- "Proud to support [Local Charity Drive from Perplexity]"
- "Perfect weather for [activity] - come see us!"
- "Celebrating [local team victory] with special offer"

**This Campaign Type is NEW** - powered entirely by Perplexity local intelligence.

---

### 3. Social Proof Campaign
**Goal:** Build trust and credibility

**Data Sources:**
- Google Reviews analysis
- Testimonials extraction
- Customer success stories
- Case study patterns

**Triggers:**
- Low trust score detected
- New businesses (<2 years)
- User selects "build credibility" goal
- High competition detected

**Content Mix:**
- Review highlights (40%)
- Customer stories (30%)
- Testimonials (20%)
- Before/after transformations (10%)

**Ideal For:** New businesses, high-consideration purchases, competitive markets

**Example Posts:**
- "⭐⭐⭐⭐⭐ 'Best service I've ever received' - Jane D."
- "How we helped [customer] achieve [result]"
- "47 customers mentioned our [feature] - here's why"

---

### 4. Competitor Crusher Campaign 🆕
**Goal:** Fill content gaps and differentiate from competitors

**Data Sources:**
- **Competitive Intelligence Service** (already built - NEW IN MVP)
- **SEMrush keyword gap analysis** (enhanced - NEW IN MVP)
- Competitor content patterns
- Market opportunity detection

**Triggers:**
- AI detects competitors during onboarding
- User requests "beat competitors" goal
- SEMrush identifies keyword opportunities
- Content gaps discovered

**Content Mix:**
- Gap-filling content (35%)
- Counter-messaging (25%)
- Differentiation posts (25%)
- Unique value emphasis (15%)

**Ideal For:** Competitive markets, established businesses, differentiation needs

**Example Posts:**
- "Unlike [competitor trend], we believe in [your unique angle]"
- "Addressing the [pain point competitors ignore]"
- "Why we don't [common competitor practice]"
- "The truth about [competitor claim]"

**Intelligence Sources:**
- Serper (competitor rankings, news, videos)
- SEMrush (keyword gaps, traffic comparison, quick wins)
- Apify (competitor reviews, website content)
- Website Analyzer (competitor messaging)

**This Campaign Type is NEW** - leverages existing Competitive Intelligence Service that wasn't integrated before.

---

## User Experience in MVP

### Onboarding Flow

**Step 1: Goal Selection**
Simple question during onboarding:

```
"What's your primary goal with content marketing?"

[ ] Build industry authority and expertise
[ ] Drive local traffic and engagement
[ ] Build trust and credibility
[ ] Stand out from competitors
```

**Step 2: AI Recommendation**
Based on:
- Business type (from industry detection)
- Location (from location detection)
- Stated goal (from step 1)

AI suggests: "We recommend **Local Pulse Campaign** for your restaurant in Austin, TX"

**Step 3: Campaign Selection**
Card-based UI showing all 4 types:

```
┌─────────────────────────────┐
│  🎯 Authority Builder       │
│  Build expertise            │
│  ✓ Best for: B2B, Services  │
│  [Preview] [Select]         │
└─────────────────────────────┘

┌─────────────────────────────┐
│  📍 Local Pulse  (NEW!)     │
│  Drive local traffic        │
│  ✓ Best for: Local biz      │
│  [Preview] [Select]         │
└─────────────────────────────┘

(etc for all 4 types)
```

**Step 4: Preview & Deploy**
- See 5-10 sample posts
- Adjust duration (7, 30, or 90 days)
- One-click deploy to SocialPilot

---

## AI Suggestion Logic

### MVP (Rule-Based)
Simple business logic:

```javascript
function suggestCampaign(businessProfile) {
  const { industry, hasLocation, ageInYears, competitorCount } = businessProfile

  // Local business with physical location
  if (hasLocation && ['restaurant', 'retail', 'salon'].includes(industry)) {
    return 'Local Pulse'
  }

  // New business needing trust
  if (ageInYears < 2) {
    return 'Social Proof'
  }

  // Competitive market
  if (competitorCount > 10) {
    return 'Competitor Crusher'
  }

  // Default: Authority Builder
  return 'Authority Builder'
}
```

### Future Phases (ML-Based)
- Performance predictions for each campaign type
- Multi-campaign orchestration (run 2-3 simultaneously)
- Automatic campaign switching based on results
- Seasonal suggestions ("Tax season approaching - switch to FAQ Dominator")

---

## Future Phases (Post-MVP)

### Phase 2: Visual & Social Intelligence (2-3 weeks after MVP)

**New Campaign Types:**

**5. Viral Visual Campaign**
- Uses: Instagram Scraper + Trending analysis
- For: B2C, product companies
- Goal: Grow social following

**6. Video Authority Campaign**
- Uses: Enhanced YouTube (comments + format analysis)
- For: Educators, thought leaders
- Goal: Establish video presence

**New Data Sources:**
- Apify Instagram Scraper
- Enhanced YouTube comment analysis

---

### Phase 3: Hyper-Personalized Campaigns (Month 2)

**New Campaign Types:**

**7. FAQ Dominator Campaign**
- Uses: Website FAQs + Google Maps Q&A + Reddit questions
- For: Complex products/services
- Goal: Preempt customer questions

**8. Seasonal Surge Campaign**
- Uses: Historical data + Perplexity events + Weather patterns
- For: Seasonal businesses
- Goal: Maximize seasonal opportunities

**9. Crisis Response Campaign**
- Uses: News API + Social sentiment + Review monitoring
- For: Any business
- Goal: Address negative events proactively

**New Data Sources:**
- Apify Website Crawler
- Apify Google Maps Scraper (enhanced)
- Full SEMrush suite

---

### Phase 4: AI Campaign Strategist (Month 3)

**Campaign Intelligence Layer:**
- Learn from performance across all users
- Automatically suggest campaign switches
- Predict campaign success probability
- Proactive alerts

**Features:**
- "Your Authority Campaign is plateauing, try Viral Visual"
- "Local festival in 2 weeks - prepare Local Pulse content"
- "Competitor launched new service - activate Competitor Crusher"
- Multi-campaign orchestration (60% authority, 30% local, 10% viral)

---

## Integration Points

### Campaign Generator
```typescript
// All campaign types feed into unified campaign generator
async function generateCampaign(type: CampaignType, businessProfile) {
  switch(type) {
    case 'Authority Builder':
      return generateAuthorityBuilderCampaign(businessProfile)

    case 'Local Pulse':
      // Uses Perplexity + Weather + Local News
      return generateLocalPulseCampaign(businessProfile)

    case 'Social Proof':
      return generateSocialProofCampaign(businessProfile)

    case 'Competitor Crusher':
      // Uses Competitive Intelligence + SEMrush
      return generateCompetitorCrusherCampaign(businessProfile)
  }
}
```

### Data Flow
```
User Onboarding
    ↓
Business Profile Detection
    ↓
Location Detection → Perplexity Local Events
    ↓
Competitor Detection → Competitive Intelligence
    ↓
AI Campaign Suggestion
    ↓
User Selects Campaign Type
    ↓
Campaign Generator
    ├─ Authority Builder (DeepContext + YouTube)
    ├─ Local Pulse (Perplexity + Weather)
    ├─ Social Proof (Reviews + Testimonials)
    └─ Competitor Crusher (Competitive Intelligence + SEMrush)
    ↓
Preview & Deploy
    ↓
SocialPilot Scheduling
```

---

## Technical Implementation

### New Features Added to MVP:

**1. Perplexity Local Intelligence**
- Feature ID: `perplexity-local-intelligence`
- Estimated: 4 hours
- Worktree: `feature/perplexity-local`
- Task File: `.buildrunner/worktrees/worktree-perplexity-local.md`

**2. Competitive Intelligence Integration**
- Feature ID: `competitive-intelligence-integration`
- Estimated: 6 hours
- Worktree: `feature/competitive-integration`
- Task File: `.buildrunner/worktrees/worktree-competitive-integration.md`

**3. Campaign Generator Updates**
- Extend existing campaign generator
- Add campaign type selection logic
- Add AI suggestion engine
- Add preview system

---

## Cost Analysis

### MVP Additional Costs:

**Perplexity API:**
- $0.01 per search
- ~5 searches per business onboarding
- ~$12.50/month for 50 businesses

**Competitive Intelligence:**
- Uses existing APIs (Serper, SEMrush, Apify)
- No additional cost (absorbed in current usage)

**Total New MVP Cost:** ~$12.50/month

**Value Added:**
- 2 new campaign types (Local Pulse + Competitor Crusher)
- Differentiation from competitors (no one else has Perplexity local intelligence)
- Higher engagement from timely, relevant local content
- Better market positioning from competitive intelligence

**ROI:** Massive - $12.50/month for unique local intelligence is a no-brainer.

---

## Summary of Changes

### features.json
- ✅ Updated campaign-generator feature with 4 MVP campaign types
- ✅ Added perplexity-local-intelligence feature
- ✅ Added competitive-intelligence-integration feature

### BUILD_PLAN.md
- ✅ Updated Track C with new features
- ✅ Added campaign type descriptions
- ✅ Updated time estimates (36 hours for Track C)

### Worktree Task Files
- ✅ Created worktree-perplexity-local.md
- ✅ Created worktree-competitive-integration.md
- ✅ Updated worktree-campaign-generator.md (implicitly)

### Total MVP Features: 24
- 22 original features
- +2 new MVP features (Perplexity + Competitive Intelligence)

---

## Next Steps

When you kick off parallel worktrees:

**Track C (Campaign System) now includes:**
1. Bannerbear Templates (10h)
2. **Perplexity Local Intelligence (4h)** 🆕
3. **Competitive Intelligence Integration (6h)** 🆕
4. AI Campaign Generator with 4 types (16h)

**Total Track C:** 36 hours (can run in parallel after Profile Management is complete)

The campaign generator will automatically use:
- Perplexity for Local Pulse campaigns
- Competitive Intelligence for Competitor Crusher campaigns
- Existing DeepContext for Authority Builder campaigns
- Reviews for Social Proof campaigns

All campaign types are AI-suggested based on business profile!

---

*This plan turns Synapse into a true campaign intelligence platform, not just a content generator. Users get strategic campaign types tailored to their goals, powered by unique data sources competitors don't have.*
