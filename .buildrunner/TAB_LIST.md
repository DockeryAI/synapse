# Power Mode Tab List

## 6 Business Profile Types & Power Mode Tabs

| # | Profile | Example Businesses | Power Mode Tabs Available |
|---|---------|-------------------|---------------------------|
| **1** | **Local Service B2B** | Commercial HVAC, IT Services, B2B Cleaning | Triggers, Proof, Trends, Gaps, Weather, Local |
| **2** | **Local Service B2C** | Dental, Salon, Restaurant, Plumber, Roofer | Triggers, Proof, Trends, Gaps, Weather, Local |
| **3** | **Regional B2B Agency** | Marketing Agency, Consulting, Legal | Triggers, Proof, Trends, Gaps |
| **4** | **Regional Retail B2C** | Multi-location Retail, Franchise | Triggers, Proof, Trends, Gaps, Weather, Local |
| **5** | **National SaaS B2B** | OpenDialog, HubSpot, Slack | Triggers, Proof, Trends, Gaps |
| **6** | **National Product B2C** | Consumer Brands, D2C, E-commerce | Triggers, Proof, Trends, Gaps |

---

## Tab Availability Matrix

| Tab | Local B2B | Local B2C | Regional Agency | Regional Retail | National SaaS | National Product |
|-----|-----------|-----------|-----------------|-----------------|---------------|------------------|
| **Triggers** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Proof** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Trends** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Gaps** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Weather** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Local** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |

---

## Tab Definitions

### 1. TRIGGERS (Psychological Hooks)
Emotional drivers, pain points, desires, objections, customer conversations.

| Sub-Tab | Description |
|---------|-------------|
| Pain Points | Customer frustrations, fears, problems |
| Desires | What customers want to become/achieve |
| Objections | Barriers to conversion, hesitations |
| Emotional Drivers | Deep psychological motivations |
| Conversations | Forums, social mentions, support tickets |

### 2. PROOF (Trust & Validation)
Testimonials, metrics, case studies, reviews, third-party validation.

| Sub-Tab | Description |
|---------|-------------|
| Testimonials | Customer success quotes |
| Case Studies | Detailed success stories |
| Reviews | Third-party platform reviews (Google, G2, Yelp) |
| Metrics | Numbers, statistics, ROI data |
| Awards/Certifications | Industry recognition |

### 3. TRENDS (Timely Relevance)
Industry trends, cultural moments, news hooks, market shifts.

| Sub-Tab | Description |
|---------|-------------|
| Industry News | Breaking news, regulation changes |
| Cultural Moments | Seasonal, holidays, current events |
| Hashtags | Trending topics on social |
| Market Shifts | Economic factors, industry changes |

### 4. GAPS (Competitive Intelligence)
Competitor weaknesses, blindspots, unmet needs, positioning opportunities.

| Sub-Tab | Description |
|---------|-------------|
| Competitor Weaknesses | What competitors do poorly |
| Blindspots | Areas competitors ignore |
| Unmet Needs | Customer needs no one addresses |
| Positioning Opportunities | White space in market |

### 5. WEATHER (Weather-Triggered Content)
*Available for: Local Service B2B, Local Service B2C, Regional Retail B2C*

| Sub-Tab | Description |
|---------|-------------|
| Current Conditions | Real-time weather opportunities |
| Forecast Alerts | Proactive "prepare now" content |
| Regional Deviation | Unusual weather for the area |
| Industry Triggers | Weather mapped to industry actions |

### 6. LOCAL (Geo-Targeted Intelligence)
*Available for: Local Service B2B, Local Service B2C, Regional Retail B2C*

| Sub-Tab | Description |
|---------|-------------|
| Local Events | Community happenings, festivals |
| Neighborhood | Hyper-local relevance |
| Regional Trends | Location-specific timing |
| Community | Local news, civic events |

---

## Profile Detection

Profile is automatically detected from UVP data:
- **Industry** (NAICS code, business type)
- **Geography** (local, regional, national, global)
- **Target Customer** (B2B vs B2C)
- **Service vs Product** (service business vs product/SaaS)

No user input required - system reads UVP and applies appropriate tabs.

---

## Dev Pages (Isolated Testing)

| Route | Tab | Status |
|-------|-----|--------|
| `/triggers-dev` | Triggers | Built |
| `/proof-dev` | Proof | Built |
| `/trends-dev` | Trends | Built |
| `/weather-dev` | Weather | Built |
| `/local-dev` | Local | Built |
| `/gaps-dev` | Gaps | In V4PowerModePanel |

---

## Campaign Types by Business Profile

### 1. Local Service B2B (Commercial HVAC, IT Services)

| Campaign Type | Goal | Duration | Content Focus |
|--------------|------|----------|---------------|
| **Authority Builder** | Build expertise | 7 days | Educational, industry insights, thought leadership |
| **Trust Builder** | Social proof | 10 days | Testimonials, case studies, certifications |
| **Local Pulse** | Drive local traffic | 7 days | Local events, community, seasonal |
| **Weather Alert** | Weather-triggered | 3-5 days | Emergency services, seasonal prep |
| **Competitor Crusher** | Differentiation | 7 days | Gap-filling, counter-messaging |

### 2. Local Service B2C (Dental, Salon, Restaurant, Plumber)

| Campaign Type | Goal | Duration | Content Focus |
|--------------|------|----------|---------------|
| **Community Champion** | Local engagement | 14 days | Community, behind-scenes, personality |
| **Trust Builder** | Build credibility | 10 days | Reviews, testimonials, before/after |
| **Local Pulse** | Local traffic | 7 days | Events, neighborhood, partnerships |
| **Weather Alert** | Weather-triggered | 3-5 days | Weather-based offers, emergencies |
| **Revenue Rush** | Drive sales | 5 days | Promotions, flash sales, urgency |
| **Viral Spark** | Social growth | 7 days | TikTok/Reels, trending, fun content |

### 3. Regional B2B Agency (Marketing, Consulting, Legal)

| Campaign Type | Goal | Duration | Content Focus |
|--------------|------|----------|---------------|
| **Authority Builder** | Thought leadership | 7 days | Industry insights, expertise, data |
| **Trust Builder** | Credibility | 10 days | Case studies, results, certifications |
| **Competitor Crusher** | Differentiation | 7 days | Unique methodology, counter-positioning |
| **FAQ Dominator** | Answer questions | 7 days | Common objections, how-to guides |
| **Video Authority** | Video presence | 7 days | Webinars, tutorials, expert talks |

### 4. Regional Retail B2C (Multi-location, Franchise)

| Campaign Type | Goal | Duration | Content Focus |
|--------------|------|----------|---------------|
| **Revenue Rush** | Drive sales | 5 days | Promotions, shoppable posts, urgency |
| **Local Pulse** | Store traffic | 7 days | Store events, local tie-ins, community |
| **Weather Alert** | Weather-triggered | 3-5 days | Seasonal products, weather deals |
| **Viral Visual** | Brand awareness | 7 days | Product lifestyle, UGC, Instagram |
| **Seasonal Surge** | Seasonal peaks | 7-14 days | Holiday, back-to-school, Q4 push |
| **Community Champion** | Loyalty | 14 days | Customer features, local partnerships |

### 5. National SaaS B2B (OpenDialog-type)

| Campaign Type | Goal | Duration | Content Focus |
|--------------|------|----------|---------------|
| **Authority Builder** | Thought leadership | 7 days | Industry insights, research, data |
| **Trust Builder** | Social proof | 10 days | Case studies, metrics, testimonials |
| **Competitor Crusher** | Differentiation | 7 days | Feature comparison, migration stories |
| **Product Launch** | Launch new feature | 14 days | Teaser, demo, early access, results |
| **FAQ Dominator** | Reduce objections | 7 days | Integration guides, security FAQs |
| **Video Authority** | Video presence | 7 days | Demos, webinars, tutorials |

### 6. National Product B2C (Consumer Brand, D2C, E-commerce)

| Campaign Type | Goal | Duration | Content Focus |
|--------------|------|----------|---------------|
| **Revenue Rush** | Drive sales | 5 days | Flash sales, shoppable posts, FOMO |
| **Viral Visual** | Brand awareness | 7 days | Lifestyle content, UGC, influencer |
| **Viral Spark** | Social growth | 7 days | TikTok/Reels, challenges, trending |
| **Trust Builder** | Build credibility | 10 days | Reviews, unboxing, customer photos |
| **Seasonal Surge** | Seasonal peaks | 7-14 days | Black Friday, holiday, seasonal |
| **Product Launch** | New product | 14 days | Teaser, reveal, early access, reviews |
| **Influencer Collab** | Reach expansion | 7 days | Micro-influencer partnerships |

---

## Campaign Availability Matrix

| Campaign | Local B2B | Local B2C | Regional Agency | Regional Retail | National SaaS | National Product |
|----------|-----------|-----------|-----------------|-----------------|---------------|------------------|
| **Authority Builder** | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | ⚠️ |
| **Trust Builder** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Local Pulse** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Weather Alert** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Community Champion** | ✅ | ✅ | ⚠️ | ✅ | ❌ | ⚠️ |
| **Revenue Rush** | ⚠️ | ✅ | ❌ | ✅ | ⚠️ | ✅ |
| **Viral Spark** | ⚠️ | ✅ | ❌ | ✅ | ❌ | ✅ |
| **Viral Visual** | ❌ | ⚠️ | ❌ | ✅ | ❌ | ✅ |
| **Competitor Crusher** | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | ⚠️ |
| **FAQ Dominator** | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | ⚠️ |
| **Video Authority** | ⚠️ | ⚠️ | ✅ | ⚠️ | ✅ | ⚠️ |
| **Seasonal Surge** | ⚠️ | ✅ | ⚠️ | ✅ | ⚠️ | ✅ |
| **Product Launch** | ❌ | ❌ | ⚠️ | ⚠️ | ✅ | ✅ |
| **Influencer Collab** | ❌ | ⚠️ | ❌ | ✅ | ❌ | ✅ |

✅ = Primary (shown by default) | ⚠️ = Available (show on request) | ❌ = Not applicable

---

## Master Campaign Type List (All 14 Types)

| Campaign | Duration | Goal | Best For |
|----------|----------|------|----------|
| **Authority Builder** | 7 days | Build expertise | B2B, services, consultants |
| **Trust Builder** | 10 days | Build credibility | New businesses, high-consideration |
| **Local Pulse** | 7 days | Local traffic | Local businesses, brick-and-mortar |
| **Weather Alert** | 3-5 days | Weather-triggered | Service businesses, seasonal retail |
| **Community Champion** | 14 days | Engagement/loyalty | Local businesses, community brands |
| **Revenue Rush** | 5 days | Drive sales | Retail, e-commerce, promotions |
| **Viral Spark** | 7 days | Social growth | B2C, younger demos, fun brands |
| **Viral Visual** | 7 days | Brand awareness | Product companies, lifestyle brands |
| **Competitor Crusher** | 7 days | Differentiation | Competitive markets |
| **FAQ Dominator** | 7 days | Answer questions | Complex products/services |
| **Video Authority** | 7 days | Video presence | Educators, thought leaders |
| **Seasonal Surge** | 7-14 days | Seasonal peaks | Retail, seasonal businesses |
| **Product Launch** | 14 days | Launch features | SaaS, product companies |
| **Influencer Collab** | 7 days | Reach expansion | D2C, consumer brands |

---

## Campaign Content Mix Templates

### Authority Builder (7 days)
- Educational posts (40%)
- Industry insights (30%)
- Expertise demonstration (20%)
- Thought leadership (10%)

### Trust Builder (10 days)
- Review highlights (40%)
- Customer stories (30%)
- Testimonials (20%)
- Before/after transformations (10%)

### Local Pulse (7 days)
- Event tie-ins (35%)
- Community involvement (25%)
- Seasonal relevance (25%)
- Local partnerships (15%)

### Weather Alert (3-5 days)
- Urgent service offers (40%)
- Preparation tips (30%)
- Safety messaging (20%)
- Follow-up care (10%)

### Community Champion (14 days)
- Behind-the-scenes (30%)
- Customer features (25%)
- Local partnerships (25%)
- Team/personality (20%)

### Revenue Rush (5 days)
- Flash sale posts (40%)
- Urgency/scarcity (25%)
- Social proof (20%)
- Last chance (15%)

### Viral Spark (7 days)
- Trending audio (35%)
- Challenge participation (25%)
- Behind-scenes fun (25%)
- User duets/responses (15%)

### Competitor Crusher (7 days)
- Gap-filling content (35%)
- Counter-messaging (25%)
- Differentiation posts (25%)
- Unique value emphasis (15%)

---

*Created: 2025-11-30*
*Reference: TRIGGERS_2.0_BUILD_PLAN.md, SMB_CAMPAIGN_BEST_PRACTICES_2025.md, CONTENT-BIBLE-CAMPAIGNS-MASTERY.md*
