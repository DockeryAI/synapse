# Additional Project Context

Last updated: 2025-12-03

## Project Background

Synapse is an AI-powered marketing intelligence platform that generates buyer insights and ad copy triggers. The core goal is to find **unexpected connections** between diverse data sources to create breakthrough marketing angles.

**The Original Vision:** Keep the same engine and exact process that V1 used, but **deconstruct it** so the user can interact with individual components and create their own unique content using the Synapse engine. That's why we created tabs - to see all the data Synapse collected, then used to find unique angles and content ideas.

**What Went Wrong:** Along the way we completely lost the entire narrative of how V1 worked. Now it's something completely different and inferior.

---

## CRITICAL: What We Want Now

1. **Archive all current Synapse code and start fresh using V1 code**
2. **The magic is connections between data sources** - tabs must collect THE RIGHT data points, UVP customizes relevance for specific business
3. **Stop focusing on emotion, focus on V1 triggers** - context, timing, cross-domain signals
4. **Fill tabs with V1-style insights** - user selects tabs, Synapse engine uses embeddings to suggest potential connections, user can use them or not
5. **All content generated must use V1 method exactly**
6. **Consider how this works across all 6 major industry categories** - B2B may need different data sources

---

## V1's Unique Mechanics - Complete Breakdown

### 1. CONNECTION HINT GENERATOR (The Secret Sauce)

How it finds non-obvious angles:

1. **Embedding Generation:** Uses OpenAI text-embedding-3-small (1536-dimensional vectors)
2. **Cosine Similarity:** Compares all data points pairwise (≥0.65 threshold)
3. **Unexpectedness Scoring:**
   - Cross-domain (weather ↔ review): 80-100% unexpected
   - Same-domain (review ↔ review): 30-50% unexpected
4. **Three-Way Connections:** When 3 different source types connect = "holy shit" moment (40% bonus)

**Example:** Weather trigger "cold snap coming" + Review pain point "customers avoid emergency calls" + Trending topic "#CozyVibes" = breakthrough content angle competitors would never find.

---

### 2. COST EQUIVALENCE CALCULATOR (Behavioral Economics)

**Consumer Expenses Database (~28 items):**
- Daily: Starbucks ($6.50/day), Fast food ($12/day)
- Weekly: Takeout ($45×2/week), Happy hour ($30×2/week)
- Monthly: Gym ($50), Netflix ($15), Spotify ($11)
- Annual: Concert tickets ($800), Vacation dining ($1,000)

**Emotional Value Weighting:**
- HIGH: Coffee, happy hour, takeout (emotional attachment)
- MEDIUM: Gym, Netflix
- LOW: Utilities

**Sweet Spot:** 3-12 months equivalence (feels reasonable, not too long)

**Hook Generation:** "Why your daily latte habit proves you can afford this $1,200 service"

**Psychology:** Exploits loss aversion - framing as "what you'll stop spending" vs "what you'll start spending"

---

### 3. CONTENT PSYCHOLOGY ENGINE (9 Principles)

| Principle | Brain Response | Application |
|-----------|---------------|-------------|
| Curiosity Gap | Dopamine release | "You won't believe what we found about X" |
| Narrative Transportation | Multiple brain regions | Story structure problem→insight→solution |
| Social Proof + Authority | Decision shortcuts | "Research shows X. Leaders do Y." |
| Cognitive Dissonance | Conflict detection | "Everything you know about X is backwards" |
| Pattern Interrupt | Switches autopilot off | Unexpected opening statement |
| Scarcity | Amygdala activation | "Only X spots available" |
| Reciprocity | Social bonding | Give value first |
| Commitment/Consistency | Identity protection | "You said you wanted X, so..." |
| Loss Aversion | 2.5x stronger than gain | "Don't miss X" beats "Get X" |

---

### 4. POWER WORD OPTIMIZER

**Categories with Impact Scores:**
- URGENCY: "now," "limited," "last chance" (7-10 intensity)
- EXCLUSIVITY: "VIP," "members only," "invitation" (8-9)
- TRUST: "proven," "guaranteed," "certified" (6-9)
- ACTION: "discover," "unlock," "transform" (6-9)

**Weak Word Replacement:** "very good" → "exceptional", "really nice" → "stunning"

**Position-Based:** Headlines get curiosity words, CTAs get urgency words

---

### 5. CONTRARIAN ANGLE DETECTOR

**Process:**
1. Extract competitor claims from data
2. Generate "everyone says X, but actually Y" angles
3. Verify truthfulness (must be defensible)
4. Risk assessment (avoids "never," "always," "scam")

**Output:** Differentiation angles competitors can't copy because they're true to YOUR brand

---

### 6. HUMOR OPTIMIZER (Edginess Scale 0-100)

| Level | Style | Example |
|-------|-------|---------|
| 0-25 | Professional | "Your lawn has strong opinions about summer" |
| 26-50 | Approachable | "When 'I'll handle it tomorrow' becomes a lifestyle" |
| 51-75 | Casual | "We're the 'where have you been all my life' of [service]" |
| 76-100 | Edgy | "That lawn isn't going to passively-aggressively grow into an HOA violation... oh wait" |

**Safety Rails:** No profanity, politics, customer mockery, liability content

---

### 7. CONNECTION SCORER (Breakthrough Potential 0-100)

**Weights:**
- Semantic Similarity: 30%
- Unexpectedness: 25%
- Psychology relevance: 15%
- Competitive advantage: 15%
- Timeliness: 10%
- Three-way bonus: +40%

**Impact Levels:**
- ≥85: "Holy shit" (three-way breakthrough)
- ≥80: High value opportunity
- ≥60: Good insight
- <60: Supporting evidence only

---

### 8. FORMAT-PSYCHOLOGY MAPPING

| Insight Type | Best Format | Why |
|--------------|-------------|-----|
| Unexpected connection | Hook Post | Curiosity gap |
| Counter-intuitive | Controversial Post | Cognitive dissonance |
| Predictive opportunity | Data Post | Authority + proof |
| Deep psychology | Story Post | Narrative transportation |
| Cultural moment | Story Post | Emotional connection |

---

## V1 vs V5 - The Critical Difference

### V1's Integration Chain:
Cross-domain embeddings → Unexpectedness scoring → Cost equivalences → Contrarian angles → Psychology principles → Power words → Humor → Format selection → Provenance tracking

### V5's Chain:
Keyword filtering ("frustrated," "afraid") → 4 emotional passes → Source validation → Reject if not emotional enough

**V1 finds:** "Cold snap + customer anxiety + trending topic = opportunity"
**V5 finds:** "People are frustrated about X" (if emotional enough to pass filter)

**V1 creates connections. V5 extracts emotions.**

---

## V1 (MARBA/Synapse) - CONTENT GENERATION SYSTEM

### Purpose
Generate 3 marketing content ideas ("synapses") with hooks, CTAs, and psychology principles from business intelligence.

### Flow After URL Entry

**Step 1: Location Detection (800ms debounce)**
- Auto-detect city/state from URL hostname and path
- Validate against industry patterns

**Step 2: Data Collection (7 parallel API calls, 5-15 seconds)**

| API | Data Collected |
|-----|----------------|
| YouTube | Trending videos, content angles |
| OutScraper | Competitor Google Reviews (20-60 reviews) |
| Serper (8 endpoints) | News, trends, autocomplete, places, videos |
| NewsAPI | 10 industry news articles |
| Weather API | Location-based timing opportunities |
| SEMrush | Keyword opportunities |
| Website Analyzer (Claude) | Value props, target audience, differentiators |

**Step 3: Cost Equivalence Calculation**
- Maps service costs to consumer spending (lattes, Netflix, gym membership)
- Creates behavioral economics hooks: "Why your daily lattes prove you can afford our $1200 plan"

**Step 4: Connection Hint Generation**
- Uses OpenAI embeddings to find semantic connections across data sources
- Finds non-obvious links: "Cold snap + Customer anxiety = opportunity"
- Cross-domain connections weighted higher (weather + reviews = unexpected)

**Step 5: Single Claude 3.5 Sonnet Call**

Prompt focus:
- "DRIVES CUSTOMER ACTION"
- "Business-focused content that connects behavioral insights to customer action"
- Requires: clear CTAs, professional tone, legally safe
- Bans: viral memes, irresponsible content, ROI/cost-saving angles

**Output:** 3 SynapseInsights with:
- Hook-style title
- Behavioral insight
- Why it matters NOW (timing/seasonality)
- Psychology principle
- Content angle (ready-to-use headline)
- Call to action

**Step 6: Content Generation**
- Transforms insights into 15 content pieces across formats (Hook Post, Story Post, Email, Blog, etc.)
- Ranks by predicted engagement/viral potential

---

## V5 (Synapse) - TRIGGER DISCOVERY SYSTEM (What We Built Wrong)

### Purpose
Find 20-30 buying triggers (customer pain points, fears, desires, objections) from online conversations.

### Flow After URL Entry

**Step 1: Profile Detection**
- Classifies business into 7 types: local-service-b2b, national-saas-b2b, etc.
- Profile determines which APIs to call and source priorities

**Step 2: UVP Extraction (during onboarding)**
- Extracts Target Customer, Key Benefit, Transformation, Unique Solution
- Used for relevance filtering later

**Step 3: Data Collection (10-15 APIs based on profile)**

| Tier | APIs (profile-dependent) |
|------|--------------------------|
| Tier 1 | G2, Capterra, Google Reviews, LinkedIn |
| Tier 2 | Reddit, Twitter, HackerNews, Quora |
| Tier 3 | Perplexity (unverified), News |

**Step 4: Source Filtering**
- Only accepts URLs from TRUSTED_SOURCE_DOMAINS
- Rejects hallucinated domains (aiplatform-reviews.com)
- Perplexity marked as "unverified" and weighted lower

**Step 5: Sample Selection by Profile Tier**
- 60% from Tier 1 sources (highest priority for profile)
- 30% from Tier 2
- 10% from Tier 3
- Cap: 50 samples max per pass

**Step 6: 4-Pass LLM Synthesis**

| Pass | Focus | Keywords |
|------|-------|----------|
| 1. Pain-Fear | pain points, fears | frustrated, hate, afraid, scared, nightmare |
| 2. Desire-Motivation | wants, drivers | want, hope, need, excited, opportunity |
| 3. Objection-Trust | hesitations, proof needed | expensive, doubt, trust, proven, safe |
| 4. Competitor | switching triggers | competitor, vs, switch, compare |

**V1-Style Hard Constraints:**
- Must cite 2+ sample IDs
- Must include verbatim quote from samples
- Must provide reasoning
- Line 499: "Reject samples that don't clearly express emotion"

**Step 7: Validation & Filtering**
- Verify quotes exist in cited samples
- Check UVP alignment
- Classify buyer journey stage
- Deduplicate (50%+ sample overlap = merge)

---

## KEY DIFFERENCES TABLE

| Aspect | V1 (MARBA) | V5 (Synapse) |
|--------|------------|--------------|
| Goal | Generate marketing content | Find buying triggers |
| Output | 3 content ideas with CTAs | 20-30 triggers with evidence |
| API Sources | Weather, YouTube, Local Events, Reviews | G2, Reddit, Capterra, HackerNews |
| Filtering | Minimal - uses all data | Heavy - emotional keywords, source tiers |
| Prompt Focus | "Business action, professional tone" | "Emotions: frustrated, afraid, scared" |
| Key Constraint | "Clear CTA that drives action" | "Reject if not emotional" |
| Intelligence Type | Local/timing (weather, events) | Voice of customer (reviews, discussions) |
| Cost Equivalences | ✓ Behavioral economics hooks | ✗ Not used |
| Connection Hints | ✓ Semantic embeddings | ✗ Not used |

---

## WHY V1 PRODUCED BETTER RESULTS

**V1 asked for:**
- "Thursday nights in Uptown - when 'one drink' turns into reconnecting with your college friends"
- Business-focused hooks with clear CTAs
- Weather/timing opportunities → action

**V5 asked for:**
- "frustrated", "hate", "afraid", "worried", "scared", "nightmare"
- Emotional filtering rejected buying signals that weren't "emotional enough"
- "Looking for a new CRM" → rejected (not emotional)
- "Migrating from Salesforce" → rejected (not emotional)

**The core problem:** V5's prompt (line 499) explicitly says "Reject samples that don't clearly express emotion" - so rational buying signals get filtered out, leaving only emotional complaints that may not be actionable buying triggers.

**V1:** Yes - uses OpenAI embeddings in ConnectionHintGenerator to find semantic connections across data sources (cosine similarity ≥ 0.65, prioritizes cross-domain connections)

**V5:** No - no embeddings. Uses keyword matching and LLM synthesis only.

---

## How V1 Finds Signals

V1 doesn't "find" signals in the same sense as V5. It collects context then asks Claude to create content ideas from that context.

**Data Collection (7 sources):**
- Weather → timing opportunities
- Local Events → relevance hooks
- Reviews (OutScraper) → pain points, praise
- Trending Topics → cultural relevance
- Search Keywords (SEMrush) → what people are searching
- Competitor Gaps → differentiation angles
- Website Analysis → brand messaging

**No grouping/categorization** - all data flows into a single prompt as context sections:
```
### Weather Context
### Local Events
### Customer Pain Points (from reviews)
### Trending Topics
### Search Opportunity Keywords
### What Competitors Are Missing
```

Claude sees ALL context at once and picks what's most actionable for content.

---

## V5 Tab Structure vs V1 Context

| V5 Tabs | V1 Equivalent |
|---------|---------------|
| Triggers (pain, fear, desire, objection) | Customer Pain Points (from reviews) - but V1 doesn't categorize by emotion |
| Trends | Trending Topics + News |
| Proof | Reviews (positive sentiment) - but V1 doesn't separate proof |
| Competitors | Competitor Gaps + OutScraper competitor reviews |
| Local/Weather | Weather Context + Local Events |

**Key difference:** V1 presents everything as unified context for content creation. V5 separates into distinct tabs/categories, then runs 4 separate LLM passes with emotional filtering per category.

**V1's approach:** "Here's everything - make 3 great content ideas"
**V5's approach:** "Filter by emotion type → run 4 passes → categorize triggers"

---

## B2B Industry Considerations

The V1 mechanics work identically for B2B, but data sources change:

| Industry Category | Weather/Timing Equivalent | VoC Sources | Cost Equivalence Database |
|-------------------|---------------------------|-------------|---------------------------|
| Local Service B2C | Weather, local events | Yelp, Google Reviews | Consumer expenses (lattes, gym) |
| Local Service B2B | Weather, local events | Google Reviews, LinkedIn | SMB expenses (software, contractors) |
| National SaaS B2B | SEC filings, funding news, earnings | G2, Capterra, HackerNews | Enterprise expenses (dev salary, churn cost) |
| E-commerce B2C | Seasons, holidays, trends | Product reviews, Reddit | Consumer expenses |
| Enterprise B2B | Industry reports, M&A news | Gartner, Forrester, G2 | Enterprise TCO comparisons |
| Professional Services | Industry regulations, market shifts | LinkedIn, industry forums | Professional expenses |

**The connection engine works the same** - only the data sources and cost equivalence databases change per industry.

---

## VoC Intelligence Drift Analysis

### Where We're Aligned
- **Psychology principles exist** - V6 has the 9 principles from V1
- **Industry intelligence present** - V6 has industry profiles and customer data
- **UVP extraction working** - V6 captures business differentiators

### Critical Drift Points

#### 1. Signal Detection Replacement
**V1 Good**: 50+ real-time signals (weather alerts, trending topics, Reddit discussions, competitor gaps)
**V6 Bad**: Static keyword matching from UVP fields
**Loss**: No temporal relevance, no competitive opportunities, no customer conversations

#### 2. Outcome vs Framework Priority
**V1 Good**: "Customer wants to avoid freeze damage" → Generate preventive content
**V6 Bad**: "Customer fits B2B segment" → Route to Hook-Story-Offer framework
**Loss**: Content answers framework requirements, not customer needs

#### 3. Buying Signal Detection
**V1 Good**: Extracted pain points and desired outcomes from reviews, discussions, search data
**V6 Bad**: Extracts keywords from business description and routes through psychology patterns
**Loss**: We generate psychology-enhanced keywords instead of addressing real customer goals

#### 4. VoC Intelligence Purpose
**V1 Good**: 4 distinct categories feeding different content needs (SEO, Social, Reviews, Thought Leadership)
**V6 Bad**: Unified orchestrator returning generic "Voice of Customer" insights
**Loss**: Context-specific intelligence for different marketing channels

### The Core Problem
**V1 Good**: Asked "What outcome is this customer trying to achieve?"
**V6 Bad**: Asks "What framework should we use for this segment?"

### How We Get Back on Course

#### 1. Restore Outcome Detection (Immediate)
- Parse VoC for actual customer goals ("increase revenue", "reduce costs", "avoid compliance issues")
- Map outcomes to business differentiators
- Generate content addressing the outcome, not the keyword

#### 2. Resurrect Signal Processing (Next)
- Add real-time signals: trending topics, local news, competitive gaps
- Score signals by urgency and customer match
- Use signals to identify buying moments, not content frameworks

### Recovery Strategy: Outcome-First Architecture

**Core Strategy**: Outcomes First → Map to Differentiators → Generate Targeted Content

**Implementation Flow**:
1. **Parse Customer Profiles** - Extract actual goals ("reduce audit time", "increase conversion rates")
2. **Map to UVP Differentiators** - Connect outcomes to unique advantages with strength scores
3. **Add Industry Context** - Layer urgency triggers, seasonal patterns, competitive gaps
4. **Generate Outcome Queries** - API calls targeting conversations about specific business outcomes
5. **Store in Database** - Persist outcome mappings to customer profile for future content

**Database Schema**:
- `customer_outcomes` table - Core outcome data, UVP alignment, query generation
- `outcome_signal_mapping` table - Track which APIs/signals match which outcomes
- `buyer_personas` updates - Add desired outcomes and differentiator match scores

**VoC Tab Experience**: Single tab with outcome-based insights:
- Industry badges (Professional Services, Local, E-commerce, etc.)
- Outcome categories (Efficiency, Revenue, Compliance, Cost Reduction)
- Signal cards showing: Customer Goal → Your Advantage → Content Opportunity

**Key Difference**:
- **Before**: "Insurance CRM software" (keywords)
- **After**: "Reduce quote abandonment" (outcome) + "AI lead recovery" (differentiator) = targeted business conversations

**Bottom Line**: We turned V1's customer-outcome engine into V6's framework-routing system. We need to flip it back - signals first, outcomes second, frameworks last.

---

## VoC Query Targeting Crisis: Business Purpose Detection Gap

### The Core Issue
OpenDialog's VoC tab shows compliance content instead of sales automation signals because the system lacks a **business purpose detection layer**.

**Current Broken Flow:**
```
UVP Text → Industry Detection ("insurance") → Query Generation ("insurance trends")
Result: Compliance/regulatory content ❌
```

**Required Fix:**
```
UVP Text → Industry + Product Function → Business Purpose → Contextual Queries
Result: Sales automation content for insurance companies ✅
```

### Root Cause Analysis
The query generation system (uvp-query-generator.service.ts, serper-collector.ts, reddit-collector.ts) has a critical gap:

1. **Missing Business Context**: System sees "insurance" and searches for "insurance news" - doesn't understand OpenDialog sells TO insurance companies
2. **No Product Function Detection**: Doesn't distinguish between "compliance software FOR insurance" vs "sales automation sold TO insurance companies"
3. **Customer Role Blindness**: Searches for industry trends instead of operational challenges faced by insurance sales teams

### The Fix Required
Add business purpose detection that determines:
- **Product Function**: What does this software actually DO? (automation, compliance, analytics, etc.)
- **Customer Role**: Who in the organization buys this? (sales teams, compliance officers, operations)
- **Business Outcome**: What customer problem does it solve? (increase revenue, reduce costs, ensure compliance)

For OpenDialog specifically:
- Product Function: Conversational AI (automation/efficiency)
- Customer Role: Insurance sales teams (not compliance officers)
- Business Purpose: Help insurance companies sell more (not manage compliance)
- Correct Queries: "insurance sales automation", "AI agents insurance sales", "contact center efficiency"

This pattern applies to all B2B vertical SaaS - without business purpose detection, the system will always find industry compliance content instead of operational improvement signals.

---

## Current Build Plan
See: `.buildrunner/builds/BUILD_synapse6.md`

---
*This file persists across build plans and provides background context for Claude.*
