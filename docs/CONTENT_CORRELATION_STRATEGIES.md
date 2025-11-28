# Content Correlation Strategies
## MASTER GUIDE - Comprehensive Research & Implementation Framework

**Date**: November 26, 2025
**Version**: 2.0 MERGED - Complete Framework
**Priority**: HIGHEST - Core Platform Differentiator
**Objective**: 400+ UNIQUE, VARIED insights across multiple angles that drive leads and revenue

---

# SECTION A: CURRENT STATE ANALYSIS

## A.1 What Makes Synapse Unique (Current Architecture)

| Capability | Description | Status |
|------------|-------------|--------|
| **UVP-Seeded Clustering** | Uses customer's pain points as cluster centers instead of random k-means | Built, NOT USED |
| **Multi-Source Correlation** | 2/3/4/5-way connections across different data sources | Built, PARTIALLY USED |
| **Psychological Pattern Extraction** | 7 core triggers (curiosity, fear, desire, belonging, achievement, trust, urgency) | Built, UNDERUTILIZED |
| **Semantic Embedding + Deduplication** | OpenAI embeddings with 0.92 similarity threshold | Working |
| **Connection Discovery Engine** | Finds breakthrough angles from multi-source validation | Built, OUTPUT LIMITED |
| **EQ Scoring** | Emotional Quotient scoring for content prioritization | Built |

## A.2 Available APIs (Built but Underutilized)

| API Service | Current Usage | Potential Data |
|-------------|---------------|----------------|
| **Serper (Google Search)** | Generic industry searches | Customer language, question patterns, SERP features |
| **YouTube (Apify)** | Trending videos only | Comments = goldmine of "I wish/hate" patterns |
| **SEMrush** | Domain keywords only | Topic clusters, keyword questions, content gaps |
| **OutScraper (Google Reviews)** | Competitor reviews | 1-2 star = pain points, 5 star = desires |
| **Perplexity** | Industry insights | Real-time competitive intelligence, trends |
| **News API** | General news | Timing hooks, urgency triggers |
| **Weather API** | Local conditions | Seasonal patterns (local businesses) |
| **LinkedIn** | B2B signals | Decision-maker pain points, buyer intent |

## A.3 Built But NOT Connected to Streaming Builder

| Service | File Location | Why Not Used |
|---------|---------------|--------------|
| **Reddit Scraper (Apify)** | `reddit-apify-api.ts` | Never integrated into streaming flow |
| **Twitter Sentiment** | `apify-social-scraper.service.ts` | Function exists, never called |
| **Quora Insights** | `apify-social-scraper.service.ts` | Function exists, never called |
| **TrustPilot Reviews** | `apify-social-scraper.service.ts` | Function exists, never called |
| **G2 Reviews** | `apify-social-scraper.service.ts` | Function exists, never called |
| **Content Gap Analyzer** | `content-gap-analyzer.ts` | Not integrated |
| **Psychological Pattern Extractor** | `psychological-pattern-extractor.service.ts` | Exists, underused |

## A.4 THE CORE PROBLEM

The current system produces **duplicate insights** because:
1. All insights center on the SAME UVP pain points
2. No differentiation by CONTENT PURPOSE (awareness vs decision)
3. No differentiation by CUSTOMER JOURNEY STAGE
4. No differentiation by CONTENT FORMAT
5. Generic titles using type names, not actual content
6. Same data processed into 200 identical cards

---

# SECTION B: INDUSTRY BENCHMARKS & RESEARCH

## B.1 How Leading Platforms Generate Data

| Platform | Data Volume | Methodology |
|----------|-------------|-------------|
| **SparkToro** | 1B+ profiles, 11 social networks | Clickstream + social engagement + rankings |
| **BuzzSumo** | 8B articles, 300T engagements | Content performance + social shares + backlinks |
| **Brandwatch** | 1.4T posts, 100M sources | Firehose access + sentiment ML + emotion AI |
| **Clearbit** | 100+ attributes, 250 sources | Public data + crowdsourcing + ML enrichment |

**Key Insight**: These platforms succeed by **combining multiple data sources** and using **AI to find patterns humans miss**.

## B.2 Reddit Pain Point Extraction

**Trigger Phrases to Mine**:
- "I wish there was..."
- "It's frustrating when..."
- "I hate that I have to..."
- "Why isn't there..."
- "This is so frustrating..."
- "Yeah, but that doesn't solve..."

**Volume Potential**: 800 posts/minute without comments, 100 posts/minute with comments

## B.3 YouTube Comment Psychology Mining

**Pattern Categories**:
- `"I wish/hate when"` - Direct pain points
- `"Finally found/exactly what I needed"` - Desires satisfied
- `"How do I/What is"` - Knowledge gaps = content opportunities
- `"I tried X but"` - Solution failures = competitive intelligence

**Volume**: 10 videos × 100 comments = 1,000 data points per YouTube call

## B.4 Google Reviews Sentiment Stratification

| Rating Tier | What It Reveals | Content Strategy |
|-------------|-----------------|------------------|
| 1-2 Stars | Pain points, deal-breakers | Address objections, show empathy |
| 3 Stars | Missed expectations, "almost" moments | Highlight differentiators |
| 4-5 Stars | Desires satisfied, wow factors | Social proof, testimonials |

## B.5 Content Atomization Strategy

**Key Example**: SAP's "Digital Chop Shop" atomized ONE whitepaper into **650 derivative pieces** across 25+ verticals, generating **$23M in pipeline**.

**Multiplier**: 100 raw insights → 500+ content pieces through systematic atomization.

---

# SECTION C: THE 12 INSIGHT DIMENSIONS (THE FIX)

Every insight must be tagged across these 12 dimensions to ensure variety:

## C.1 BUYER JOURNEY STAGE

| Stage | Content Goal | CTA Type |
|-------|-------------|----------|
| **Awareness** | Educate about the problem | "Learn more" |
| **Consideration** | Compare solutions | "See how" |
| **Decision** | Convince to buy | "Start free trial" |
| **Retention** | Keep customers happy | "Unlock feature" |
| **Advocacy** | Turn into promoters | "Share your story" |

## C.2 PSYCHOLOGICAL TRIGGER (Plutchik's 8 + Extensions)

| Primary Emotion | Opposite | Combined Dyads |
|-----------------|----------|----------------|
| **Joy** | Sadness | Joy + Trust = Love |
| **Trust** | Disgust | Trust + Fear = Submission |
| **Fear** | Anger | Fear + Surprise = Awe |
| **Surprise** | Anticipation | Surprise + Sadness = Disapproval |
| **Sadness** | Joy | Sadness + Disgust = Remorse |
| **Disgust** | Trust | Disgust + Anger = Contempt |
| **Anger** | Fear | Anger + Anticipation = Aggressiveness |
| **Anticipation** | Surprise | Anticipation + Joy = Optimism |

**Extended Triggers**:
- Loss Aversion (fear of missing out)
- Social Currency (making them look good)
- Curiosity Gap (incomplete information)
- Belonging (tribal identity)
- Achievement (progress and mastery)

## C.3 CONTENT FORMAT

| Format | Best For | Engagement Level |
|--------|----------|------------------|
| **How-To Guide** | Awareness | High (educational) |
| **Comparison Post** | Consideration | Very High (decision aid) |
| **Case Study** | Decision | Highest (proof) |
| **Checklist** | Consideration | High (practical) |
| **Data/Research** | Awareness | Medium (authority) |
| **Controversy/Hot Take** | Awareness | Viral potential |
| **Story/Narrative** | All stages | Emotional connection |
| **FAQ** | Decision | Trust building |
| **Tool/Calculator** | Consideration | Lead capture |
| **Testimonial** | Decision | Social proof |

## C.4 CONTENT PILLAR (Topic Authority)

Each business should have 4-6 content pillars. Example for B2B SaaS:
1. **Industry Trends** (thought leadership)
2. **Customer Experience** (transformation)
3. **Compliance & Trust** (differentiator)
4. **Digital Sales** (outcomes)
5. **ROI & Efficiency** (business case)
6. **Implementation & Success** (proof)

## C.5 PERSONA TARGET

| Persona | Pain Points | Content Angle |
|---------|-------------|---------------|
| **Decision Maker** (C-suite) | ROI, risk, competitive advantage | Executive summary, business case |
| **Influencer** (VP/Director) | Implementation, team impact | How-to, comparison |
| **User** (Day-to-day) | Ease of use, time savings | Tutorials, tips |
| **Blocker** (Finance/Legal) | Compliance, cost | FAQ, objection handling |
| **Champion** (Internal advocate) | Proof points, success stories | Case studies, testimonials |

## C.6 OBJECTION HANDLING

| Objection Type | Content Response |
|----------------|------------------|
| **Price** | ROI calculator, cost comparison, payment options |
| **Timing** | Urgency content, cost of delay, seasonal hooks |
| **Authority** | Stakeholder guides, internal pitch deck |
| **Need** | Problem education, competitor gaps |
| **Trust** | Case studies, testimonials, certifications |
| **Competitor** | Comparison content, switching guides |

## C.7 CONTENT ANGLE TYPE

| Angle | Description | Example |
|-------|-------------|---------|
| **Contrarian** | Challenge conventional wisdom | "Why most AI chatbots fail" |
| **Data-Driven** | Original research/stats | "We analyzed 1000 insurance quotes" |
| **Story-Driven** | Customer transformation | "How ABC Insurance 2x'd conversions" |
| **Expert Opinion** | Thought leadership | "The future of insurance in 2025" |
| **Trending** | Timely news hook | "What the new AI regulation means" |
| **Comparison** | Us vs them | "OpenDialog vs LivePerson" |
| **Behind-the-Scenes** | How we do it | "How we built compliant AI" |
| **Prediction** | Future trends | "5 insurance trends for 2025" |

## C.8 CTA TYPE (Lead Generation Focus)

| CTA | Funnel Position | Lead Quality |
|-----|-----------------|--------------|
| **Download Guide** | TOFU | Low |
| **Watch Demo** | MOFU | Medium |
| **Start Trial** | BOFU | High |
| **Request Pricing** | BOFU | Highest |
| **Book Consultation** | BOFU | Highest |
| **Join Webinar** | MOFU | Medium |
| **Get Assessment** | MOFU | Medium-High |

## C.9 URGENCY LEVEL

| Level | Trigger | Content Treatment |
|-------|---------|-------------------|
| **Critical** | Regulatory deadline, competitor move | "Act now before..." |
| **High** | Seasonal peak, market shift | "This quarter..." |
| **Medium** | Trend acceleration | "Early adopters are..." |
| **Low** | Evergreen opportunity | "Here's how..." |

## C.10 SOURCE COMBINATION

| Combo | Confidence | Label |
|-------|------------|-------|
| **5-way** (5+ sources agree) | Highest | "Multi-Validated Breakthrough" |
| **4-way** (4 sources agree) | Very High | "Cross-Platform Insight" |
| **3-way** (3 sources agree) | High | "Validated Pattern" |
| **2-way** (2 sources agree) | Medium | "Emerging Signal" |
| **Single source** | Lower | "Early Indicator" |

## C.11 COMPETITIVE POSITIONING

| Position | Content Angle |
|----------|---------------|
| **Leader** | "Why we're #1 in..." |
| **Challenger** | "The better alternative to..." |
| **Niche** | "Built specifically for..." |
| **Innovator** | "The first to..." |
| **Value** | "Enterprise features at SMB prices" |

## C.12 CONTENT LIFECYCLE

| Type | Description | Refresh Rate |
|------|-------------|--------------|
| **Evergreen** | Always relevant | Annual review |
| **Seasonal** | Recurring peaks | Quarterly |
| **Trending** | News/event driven | Days-weeks |
| **Reactive** | Competitor moves | Immediate |

---

# SECTION D: SMB vs B2B DIFFERENTIATION

## D.1 Dimension Adjustments by Segment

| Dimension | SMB Local | SMB Regional | B2B National | B2B Global |
|-----------|-----------|--------------|--------------|------------|
| **Journey Stage** | Awareness + Decision heavy | All stages | Consideration heavy | All stages |
| **Triggers** | Trust, Fear, Urgency | Trust, Social Proof | Fear, Achievement | All |
| **Formats** | FAQ, Testimonial, How-To | Comparison, Story | Case Study, Data | All |
| **Personas** | Owner, Customer | Owner, Manager | VP, Director, C-suite | All |
| **Objections** | Price, Trust, Timing | Price, Location | ROI, Implementation | All |
| **CTAs** | Call, Visit, Book | Contact, Quote | Demo, Trial, Consult | All |
| **Urgency** | Seasonal, Weather, Local Events | Regional Events | Industry Trends | Global Trends |

## D.2 SMB-Specific Content Types

1. **Local SEO Angles**: "Best [service] in [city]", "Near me" content
2. **Review Response Content**: Templates for 1-star, 5-star responses
3. **Seasonal Hooks**: Weather-triggered, holiday-triggered
4. **Community Content**: Local events, sponsorships, partnerships
5. **Before/After Content**: Visual transformation stories
6. **Price Transparency**: "Cost of [service] in [area]"

## D.3 B2B-Specific Content Types

1. **Thought Leadership**: Industry predictions, contrarian takes
2. **Competitor Comparison**: Feature matrices, switching guides
3. **ROI Calculators**: Business case builders
4. **Compliance Content**: Regulatory updates, certification guides
5. **Implementation Guides**: Migration paths, integration docs
6. **Executive Briefs**: Board-ready summaries

---

# SECTION E: INSIGHT GENERATION RULES

## E.1 Variety Enforcement Rules

1. **No Two Insights Can Share ALL Dimensions** - Must differ in at least 2 dimensions
2. **Every Content Pillar Gets Representation** - Distribute evenly across 4-6 pillars
3. **Every Persona Gets Addressed** - At least 10% of insights per persona type
4. **Every Objection Gets Content** - At least 5 insights per major objection
5. **Funnel Balance is Mandatory** - No stage >40%, none <15%
6. **Title Must Be Unique and Specific** - No generic "A New Angle" titles
7. **Every Insight Must Have a Clear CTA** - Actionable next step required

## E.2 Required Variety Distribution (per 400 insights)

| Category | Minimum | Maximum |
|----------|---------|---------|
| **Awareness Stage** | 120 (30%) | 160 (40%) |
| **Consideration Stage** | 100 (25%) | 140 (35%) |
| **Decision Stage** | 80 (20%) | 100 (25%) |
| **Retention/Advocacy** | 40 (10%) | 60 (15%) |

| Emotion Distribution | Minimum |
|---------------------|---------|
| Joy/Optimism | 15% |
| Fear/Loss Aversion | 20% |
| Trust/Authority | 20% |
| Curiosity | 15% |
| Anticipation | 15% |
| Anger (competitive) | 10% |
| Achievement | 5% |

| Format Distribution | Minimum |
|--------------------|---------|
| How-To | 20% |
| Comparison | 15% |
| Case Study/Story | 15% |
| Data/Research | 10% |
| FAQ/Objection | 15% |
| Thought Leadership | 10% |
| Trending/News | 10% |
| Checklist/Tool | 5% |

---

# SECTION F: 15 HOOK FORMULAS (Rotate for Variety)

Instead of generic titles, rotate these hooks:

1. **Number Hook**: "7 Reasons Insurance Companies Lose 70% of Online Quotes"
2. **Question Hook**: "Are You Making This $1M Mistake in Digital Sales?"
3. **Contrarian Hook**: "Why Most AI Chatbots Actually HURT Conversions"
4. **Story Hook**: "How ABC Insurance Doubled Conversions in 30 Days"
5. **Data Hook**: "New Data: 40% Improvement in Customer Satisfaction"
6. **Urgency Hook**: "Insurance Regulators Are Cracking Down—Here's How to Prepare"
7. **Curiosity Hook**: "The Hidden Reason Your Quotes Are Abandoned"
8. **Fear Hook**: "Is Your AI Compliance Putting You at Risk?"
9. **Desire Hook**: "Imagine Converting 15% More Quotes Without Extra Staff"
10. **Social Proof Hook**: "1000+ Insurance Companies Trust This Approach"
11. **How-To Hook**: "How to Reduce Quote Abandonment by 50% (Step-by-Step)"
12. **Comparison Hook**: "OpenDialog vs LivePerson: Which Wins for Insurance?"
13. **Mistake Hook**: "The #1 Mistake Insurance CTOs Make with AI"
14. **Secret Hook**: "The Compliance Secret Enterprise Insurers Don't Share"
15. **Prediction Hook**: "5 Insurance AI Trends That Will Define 2025"

---

# SECTION G: JOBS TO BE DONE (JTBD) FRAMEWORK

## G.1 Primary Job Categories

| Job Category | Job Statement | Content Opportunity |
|--------------|---------------|---------------------|
| **Functional** | "Help me DO something" | How-to, tutorial, guide |
| **Emotional** | "Help me FEEL something" | Story, testimonial, vision |
| **Social** | "Help me BE SEEN as something" | Thought leadership, case study |

## G.2 JTBD Content Formula

> "When I [situation], I want to [motivation], so I can [expected outcome]."

**Example JTBD Insights**:
1. "When I'm losing online quotes, I want to understand why, so I can fix conversion"
2. "When I'm evaluating AI vendors, I want to compare compliance features, so I can choose safely"
3. "When I'm presenting to the board, I want ROI proof, so I can get budget approval"

---

# SECTION H: CONTENT ATOMIZATION ENGINE

## H.1 From 1 Core Insight, Generate 6-10 Variations

| Variation | Format | Channel |
|-----------|--------|---------|
| **Blog Post** | Long-form (1500+ words) | Website SEO |
| **LinkedIn Post** | Short-form (150-300 words) | LinkedIn |
| **Twitter Thread** | 5-10 tweets | Twitter/X |
| **Email Subject** | <50 characters | Email marketing |
| **Ad Headline** | <30 characters | Paid ads |
| **Video Script** | 60-90 seconds | YouTube/TikTok |
| **Infographic** | Visual data | Pinterest/LinkedIn |
| **Podcast Outline** | 5-10 talking points | Audio |
| **Carousel** | 5-10 slides | Instagram/LinkedIn |
| **FAQ Entry** | Q&A format | Website/Chatbot |

**Atomization Formula**: 100 unique insights × 6 variations = 600 content pieces

---

# SECTION I: VIRAL CONTENT TRIGGERS (STEPPS Framework)

| Trigger | Description | Content Type |
|---------|-------------|--------------|
| **Social Currency** | Makes sharer look smart | Original research, counter-intuitive insights |
| **Triggers** | Stays top-of-mind | Seasonal hooks, recurring pain points |
| **Emotion** | High-arousal feelings | Awe, anger, anxiety, excitement |
| **Public** | Visible, imitable | Challenges, benchmarks, standards |
| **Practical Value** | Genuinely useful | Calculators, templates, checklists |
| **Stories** | Narrative structure | Customer journeys, founder stories |

---

# SECTION J: COMPETITOR GAP CONTENT

## J.1 Gap Types to Identify

| Gap Type | Source | Content Opportunity |
|----------|--------|---------------------|
| **Feature Gap** | G2/TrustPilot complaints | "Why we built X when others didn't" |
| **Support Gap** | Negative reviews | "24/7 support vs 9-5" |
| **Price Gap** | Pricing pages | "Enterprise features, SMB pricing" |
| **Industry Gap** | Case studies | "Built for insurance, not retrofitted" |
| **Compliance Gap** | Product pages | "SOC 2 + HIPAA from day 1" |

## J.2 Competitor Content Framework

1. **Why Switch** (from specific competitor)
2. **Alternative To** (generic category)
3. **Comparison** (feature-by-feature)
4. **Migration Guide** (how to move)
5. **Cost Analysis** (TCO comparison)

---

# SECTION K: BLUE OCEAN CONTENT STRATEGY

## K.1 Finding Untapped Content Angles

| Method | How | Output |
|--------|-----|--------|
| **Adjacent Markets** | Look at related industries | Cross-industry insights |
| **Negative Reviews** | What competitors do wrong | Solution content |
| **Reddit Mining** | Unmet needs | "I wish" content |
| **Question Forums** | Unanswered questions | FAQ domination |
| **Search Gaps** | Keywords with no good content | SEO opportunities |

## K.2 Blue Ocean Questions

1. What features can we ELIMINATE that competitors obsess over?
2. What features can we REDUCE below industry standard?
3. What features can we RAISE above industry standard?
4. What features can we CREATE that the industry has never offered?

---

# SECTION L: IMPLEMENTATION ARCHITECTURE

## L.1 Insight Generation Pipeline

```
Step 1: Data Collection (500+ raw data points)
    ↓
Step 2: Deduplication (0.92 similarity threshold)
    ↓
Step 3: Dimension Tagging (12 dimensions per insight)
    ↓
Step 4: Variety Enforcement (distribution rules)
    ↓
Step 5: Title Generation (hook formulas, unique & specific)
    ↓
Step 6: CTA Assignment (matched to funnel stage)
    ↓
Step 7: Content Atomization (6-10 variations)
    ↓
Step 8: Quality Scoring (EQ + UVP match + variety)
```

## L.2 Deduplication Rules

1. **Content Hash**: First 100 chars normalized → no duplicates
2. **Title Hash**: First 40 chars normalized → no duplicates
3. **Dimension Hash**: Same 8+ dimensions → merge into one
4. **Source Diversity**: Same title from different sources → keep both (validates)

## L.3 Quality Scoring Framework (0-100)

| Factor | Weight | Measurement |
|--------|--------|-------------|
| **UVP Relevance** | 25% | Semantic similarity to UVP pain points |
| **Source Count** | 20% | Number of validating sources |
| **Emotional Intensity** | 15% | Strength of psychological trigger |
| **Actionability** | 15% | Clarity of CTA and next step |
| **Uniqueness** | 15% | Distance from other insights |
| **Timeliness** | 10% | Relevance to current events/season |

---

# SECTION M: DATA MULTIPLICATION STRATEGIES

## M.1 UVP-First API Orchestration

**Required Flow**:
```
UVP Loaded FIRST → UVP Pain Points → Generate Search Queries → APIs Run with UVP Context → Relevant Results
```

## M.2 Activate Dormant Social APIs

| Business Type | Add These APIs |
|---------------|----------------|
| B2B-Global | Reddit, Quora, G2, TrustPilot |
| B2B-National | Reddit, LinkedIn, G2 |
| Local | Reddit, Google Reviews (deeper), Yelp |

## M.3 Expected Data Increase

- Reddit: +50-200 pain point posts per subreddit
- Quora: +20-50 questions with psychological triggers
- G2/TrustPilot: +100-500 B2B software reviews
- YouTube comments: +1,000 data points per 10 videos
- SEMrush expansion: +400 keyword opportunities

---

# SECTION N: EXPECTED OUTCOMES

## N.1 Before vs After

| Metric | Before | After |
|--------|--------|-------|
| Unique Insights | 30-50 | 400+ |
| Duplicate Rate | 80%+ | <5% |
| Funnel Coverage | TOFU only | All stages |
| Persona Coverage | Generic | All 5 types |
| Format Variety | None | 10+ formats |
| Lead Gen Content | Low | 3x more |
| UVP Relevance | 20% | 80%+ |

## N.2 Business Impact

| Outcome | Expected Improvement |
|---------|---------------------|
| **Content Variety** | 10x more unique angles |
| **Lead Generation** | 3x more conversion-focused content |
| **SEO Coverage** | 5x more keyword opportunities |
| **Sales Enablement** | 4x more objection-handling content |
| **Customer Retention** | 2x more advocacy content |

---

# APPENDIX A: DIMENSION TAG REFERENCE

### Stage Tags
`AWARENESS`, `CONSIDERATION`, `DECISION`, `RETENTION`, `ADVOCACY`

### Emotion Tags
`JOY`, `TRUST`, `FEAR`, `SURPRISE`, `SADNESS`, `DISGUST`, `ANGER`, `ANTICIPATION`, `CURIOSITY`, `BELONGING`, `ACHIEVEMENT`, `LOSS_AVERSION`

### Format Tags
`HOWTO`, `COMPARISON`, `CASE_STUDY`, `CHECKLIST`, `DATA`, `CONTROVERSY`, `STORY`, `FAQ`, `TOOL`, `TESTIMONIAL`

### Persona Tags
`DECISION_MAKER`, `INFLUENCER`, `USER`, `BLOCKER`, `CHAMPION`

### Objection Tags
`OBJ_PRICE`, `OBJ_TIMING`, `OBJ_AUTHORITY`, `OBJ_NEED`, `OBJ_TRUST`, `OBJ_COMPETITOR`

### Angle Tags
`CONTRARIAN`, `DATA_DRIVEN`, `STORY_DRIVEN`, `EXPERT`, `TRENDING`, `COMPARISON`, `BEHIND_SCENES`, `PREDICTION`

### CTA Tags
`CTA_DOWNLOAD`, `CTA_DEMO`, `CTA_TRIAL`, `CTA_PRICING`, `CTA_CONSULT`, `CTA_WEBINAR`, `CTA_ASSESS`

### Urgency Tags
`URGENT_CRITICAL`, `URGENT_HIGH`, `URGENT_MEDIUM`, `URGENT_LOW`

### Confidence Tags
`CONF_5WAY`, `CONF_4WAY`, `CONF_3WAY`, `CONF_2WAY`, `CONF_SINGLE`

### Position Tags
`POS_LEADER`, `POS_CHALLENGER`, `POS_NICHE`, `POS_INNOVATOR`, `POS_VALUE`

### Lifecycle Tags
`LIFE_EVERGREEN`, `LIFE_SEASONAL`, `LIFE_TRENDING`, `LIFE_REACTIVE`

---

# APPENDIX B: API STACK INVENTORY

### Currently Active in Streaming Builder

| API | Service File | Edge Function | Status |
|-----|--------------|---------------|--------|
| Serper | `serper-api.ts` | `serper-proxy` | Active |
| YouTube | `youtube-api.ts` | `apify-scraper` | Active |
| SEMrush | `semrush-api.ts` | `semrush-proxy` | Active |
| OutScraper | `outscraper-api.ts` | `outscraper-proxy` | Active |
| News | `news-api.ts` | `news-proxy` | Active |
| Weather | `weather-api.ts` | `weather-proxy` | Active |
| LinkedIn | `linkedin-alternative.service.ts` | Perplexity+Serper | Active |
| Perplexity | Edge Function only | `perplexity-proxy` | Active |

### Built But NOT Active

| API | Service File | Edge Function | Status |
|-----|--------------|---------------|--------|
| Reddit | `reddit-apify-api.ts` | `apify-scraper` | DORMANT |
| Twitter | `apify-social-scraper.service.ts` | `apify-scraper` | DORMANT |
| Quora | `apify-social-scraper.service.ts` | `apify-scraper` | DORMANT |
| TrustPilot | `apify-social-scraper.service.ts` | `apify-scraper` | DORMANT |
| G2 | `apify-social-scraper.service.ts` | `apify-scraper` | DORMANT |

### Intelligence Services (Built, Underused)

| Service | File | Purpose |
|---------|------|---------|
| Psychological Pattern Extractor | `psychological-pattern-extractor.service.ts` | 7 core triggers |
| Content Gap Analyzer | `content-gap-analyzer.ts` | Competitor content gaps |
| Connection Discovery | `connection-discovery.service.ts` | Multi-source correlations |
| Clustering Service | `clustering.service.ts` | Semantic grouping |
| Embedding Service | `embedding.service.ts` | OpenAI embeddings |

---

# APPENDIX C: SOURCES & REFERENCES

### Content Strategy
- [Foleon: Mapping Content to Buyer's Journey](https://www.foleon.com/blog/how-to-map-your-content-to-the-buyers-journey)
- [HubSpot: Content for Every Funnel Stage](https://blog.hubspot.com/marketing/content-for-every-funnel-stage)
- [Content Marketing Institute: Jobs to be Done](https://contentmarketinginstitute.com/articles/audience-jobs-to-be-done-formula)
- [Semrush: Content Gap Analysis](https://www.semrush.com/blog/content-gap-analysis/)

### Psychology
- [Neil Patel: 15 Psychological Triggers](https://neilpatel.com/blog/15-psychological-triggers/)
- [Six Seconds: Plutchik's Wheel of Emotions](https://www.6seconds.org/2025/02/06/plutchik-wheel-emotions/)
- [Wharton: What Makes Content Viral](https://faculty.wharton.upenn.edu/wp-content/uploads/2011/11/Virality.pdf)

### Differentiation
- [Growth Method: Content Differentiation Formula](https://growthmethod.com/content-differentiation/)
- [Valchanova: Remarkable Content Angles](https://valchanova.me/remarkable-content-angles/)
- [Skyword: Fresh Perspectives](https://www.skyword.com/contentstandard/how-to-bring-fresh-differentiated-perspectives-to-well-worn-content-marketing-topics/)

### Lead Generation
- [Orbit Media: 17 Content Formats for Lead Gen](https://www.orbitmedia.com/blog/content-marketing-formats-funnels/)
- [Ten Speed: Bottom of Funnel Content](https://www.tenspeed.io/blog/bottom-of-the-funnel-content)
- [Copy.ai: BOFU Content Examples](https://www.copy.ai/blog/bottom-of-funnel-content-examples)

### Thought Leadership
- [EC-PR: Thought Leadership 2025](https://ec-pr.com/thought-leadership-content-what-works-in-2025/)
- [Fame: B2B Thought Leadership Examples](https://www.fame.so/post/8-potent-thought-leadership-content-examples-for-b2b-leaders)
- [Animalz: How to Do Thought Leadership](https://www.animalz.co/blog/thought-leadership-content)

### Blue Ocean
- [Blue Ocean Strategy Official](https://www.blueoceanstrategy.com/what-is-blue-ocean-strategy/)
- [Strategy Institute: Finding Untapped Markets](https://www.thestrategyinstitute.org/insights/finding-untapped-markets-an-introduction-to-blue-ocean-strategy)

### Industry Research
- [SparkToro Audience Research](https://sparktoro.com/)
- [BuzzSumo Content Research](https://buzzsumo.com/content-research/)
- [Brandwatch Social Listening](https://www.brandwatch.com/products/listen/)
- [MarTech Content Atomization](https://martech.org/content-atomization-maximize-roi-by-repurposing-your-best-ideas/)

---

*Document Version: 2.0 MERGED*
*Created: November 26, 2025*
*Status: COMPREHENSIVE MASTER GUIDE - Ready for Implementation*
*Total Sections: 14 + 3 Appendices*
*Estimated Pages: ~20*
