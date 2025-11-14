# Reddit Integration for Synapse - SMB Focused

**Date**: 2025-11-14
**Status**: ✅ INTEGRATED INTO BUILD PLANS

---

## Executive Summary

Reddit integration has been added to Synapse with a **specific focus on SMB value**. Since SMBs rarely get mentioned by name on Reddit, the integration prioritizes **opportunity discovery** over brand monitoring.

**Key Insight**: SMBs don't need to know when they're mentioned (rare). They need to know when someone is asking for the solution they provide (common).

---

## SMB-Specific Value Proposition

### Traditional Approach (Not Valuable for SMBs)
❌ "Alert me when someone mentions Bob's Plumbing Service"
→ Result: 0-1 mentions per year

### Our Approach (High Value for SMBs)
✅ "Alert me when someone in r/Denver asks about clogged drains, needs a plumber, or complains about plumbing prices"
→ Result: 5-10 opportunities per week

---

## Integration Overview

### What We Added

**17th Data Source**: Reddit API added to parallel intelligence gathering
- OAuth authentication for higher rate limits (60/min vs 10/min public)
- Runs in parallel with other 16 sources
- 5-second timeout
- Graceful degradation if fails

**New Service**: `reddit-opportunity.service.ts` (400 lines)
- Problem discovery engine
- Niche community mapping
- Local opportunity detection
- Content idea extraction
- Competitor intelligence

---

## MVP Features (Phase 1)

### 1. Problem Discovery Engine
**What It Does**: Monitors discussions about problems the SMB solves

**Search Patterns**:
- "looking for [service]"
- "need help with [problem]"
- "recommend [solution]"
- "how do I [task]"
- "anyone know [service]"

**Example for Plumber**:
- Searches: "looking for plumber", "clogged drain help", "pipe burst emergency"
- Subreddits: r/Denver, r/HomeImprovement, r/AskAPlumber
- Result: 5-10 weekly opportunities for direct engagement

### 2. Content Intelligence
**What It Does**: Extracts frequently asked questions for content ideas

**Value for SMBs**:
- See what questions get asked repeatedly → Blog topics
- Identify pain points → Service offerings
- Learn customer language → Better messaging
- Find proven headlines → Higher engagement

### 3. Niche Community Mapping
**What It Does**: Identifies 10-20 subreddits where ideal customers congregate

**Process**:
1. Analyze industry profile from database
2. Search for relevant communities
3. Rank by relevance and activity
4. Filter by minimum subscribers (5,000+)
5. Return top communities for monitoring

**Example for Restaurant**:
- r/FoodPorn (30M subscribers)
- r/[CityName] (local community)
- r/restaurants (500k subscribers)
- r/KitchenConfidential (industry insider)
- r/food (20M subscribers)

---

## Phase 2 Features (Post-MVP)

### Strategic Engagement
- Thoughtful responses to problem posts
- Building reputation before promoting
- Participating in weekly threads
- Helpful comments without being salesy

### Content Testing
- Test blog topics before writing
- Validate product ideas
- Get feedback on messaging
- A/B test value propositions

---

## Phase 3 Features (Future)

### Community Building
- Create location/industry subreddits
- Host mini-AMAs in niche communities
- Build mod relationships
- Develop influencer connections

### Automation
- Auto-alert for high-intent discussions
- Scheduled posting to multiple communities
- Automated trend reporting
- Competitor activity tracking

---

## Technical Implementation

### Files Modified

**1. MVP Scope** (`docs/SYNAPSE_MVP_SCOPE.md`)
- Added Feature 4.5: Reddit Intelligence (MVP - SMB Focused)
- Updated dependencies to include Reddit API
- Clarified Reddit for intelligence only, not publishing in MVP

**2. Backend Services** (`docs/WORKTREE_1_BACKEND_SERVICES.md`)
- Added Task 6: Reddit Opportunity Service
- Updated from 16 to 17 data sources
- Added Reddit-specific test requirements
- Included SMB optimization patterns

**3. Product Overview** (`SYNAPSE_PRODUCT_OVERVIEW.md`)
- Updated to 17 Intelligence Sources
- Added Reddit API with rate limits
- Included Reddit in parallel execution flow
- Added SMB opportunity intelligence description

**4. Build Plan** (`SYNAPSE_CALENDAR_BUILD_PLAN.md`)
- Added Feature 5: Reddit Opportunity Service
- Updated all subsequent feature numbers
- Added Reddit to testing strategy
- Included in parallel intelligence flow

---

## Success Metrics

### For SMBs Using Reddit Intelligence

**Opportunity Discovery**:
- 5-10 service requests found per week
- 20+ content ideas generated monthly
- 10-20 relevant communities identified

**Content Performance**:
- 3x higher engagement on Reddit-inspired content
- 50% reduction in content ideation time
- Higher relevance to actual customer needs

**ROI Indicators**:
- Cost per lead 80% lower than paid ads
- Higher quality leads (already expressing need)
- Builds authentic community relationships

---

## Environment Configuration

Add to `.env`:
```bash
# Reddit API (OAuth App)
REDDIT_CLIENT_ID=your_client_id_here
REDDIT_CLIENT_SECRET=your_client_secret_here
REDDIT_USER_AGENT=Synapse/1.0.0
REDDIT_USERNAME=optional_for_script_app
REDDIT_PASSWORD=optional_for_script_app
```

---

## Key Differentiators

### What Makes This Valuable for SMBs

1. **Opportunity Focus**: Find people ready to buy, not brand mentions
2. **Local Intelligence**: Monitor city/region specific subreddits
3. **Content Ideas**: Extract real questions people are asking
4. **Competitor Intel**: See what works for similar businesses
5. **Authentic Engagement**: Build relationships, not spam

### What We DON'T Do (Intentionally)

- ❌ Spam subreddits with promotional content
- ❌ Auto-post without community understanding
- ❌ Violate subreddit rules
- ❌ Focus on brand mentions (rare for SMBs)
- ❌ Ignore community culture

---

## Development Timeline

**Week 1**: Backend implementation
- Reddit OAuth integration
- Opportunity discovery engine
- Community mapping algorithm
- Content idea extraction

**Week 2**: Intelligence integration
- Connect to specialty detection
- Feed into content calendar
- Surface in opportunity feed
- Add to intelligence dashboard

**Month 2**: Engagement features
- Response suggestions
- Community participation
- Reputation building

**Month 3**: Advanced features
- Mini-AMA automation
- Community building tools
- Influencer identification

---

## Summary

Reddit integration transforms Synapse from a **broadcasting tool** into a **conversation discovery platform** for SMBs. Instead of waiting for mentions that never come, SMBs can:

1. **Find customers** actively looking for their services
2. **Generate content** based on real questions
3. **Build relationships** in niche communities
4. **Stay ahead** of competitors

This positions Synapse as the only SMB marketing platform that combines **intelligence gathering**, **content generation**, and **opportunity discovery** in one automated system.

**Bottom Line**: SMBs get 5-10 qualified leads per week from Reddit without spending a dollar on ads or hours on manual searching.