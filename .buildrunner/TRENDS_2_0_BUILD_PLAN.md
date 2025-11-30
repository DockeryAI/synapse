# Trends 2.0 Build Plan

## Overview
Transform the Trends tab from a generic industry trend viewer into a brand-specific, category-aware trend intelligence engine that scales across 6 SMB business categories.

---

## API Stack Inventory (Full Capabilities)

### Currently Used in TrendsDevPage
| API | Method | Current Use | Trend Capability |
|-----|--------|-------------|------------------|
| SerperAPI | `searchGoogle()` | Generic industry search | Search trends, autocomplete, related queries |
| SerperAPI | `getNews()` | Industry news | Breaking news, industry alerts |
| YouTubeAPI | `searchVideos()` | Video search | Video trends, view velocity, engagement |
| RedditAPI | `mineIntelligence()` | Reddit discussions | Community pulse, emerging discussions |
| PerplexityAPI | `getIndustryInsights()` | AI synthesis | Trend synthesis, predictions |

### Available But NOT Used (Expansion Opportunities)
| API | Method | Trend Capability | Business Category Fit |
|-----|--------|------------------|----------------------|
| **SerperAPI** | `getTrends()` | Keyword trend direction, growth % | All categories |
| **SerperAPI** | `getAutocomplete()` | "People also ask", related searches | All categories |
| **SerperAPI** | `getPlaces()` | Local business trends, competitor activity | Local B2B/B2C (1,2,4) |
| **SerperAPI** | `getVideos()` | Video content trends | All categories |
| **SerperAPI** | `getShopping()` | Product/pricing trends | Retail/E-commerce (4,6) |
| **NewsAPI** | `getIndustryNews()` | Industry-specific news filtering | All categories |
| **NewsAPI** | `getLocalNews()` | Local news, events | Local (1,2,4) |
| **WeatherAPI** | `detectWeatherOpportunities()` | Weather-triggered trends | Local services (1,2) |
| **SemrushAPI** | `getTrends()` | SEO keyword trends, volume | National (5,6) |
| **SemrushAPI** | `getKeywordOpportunities()` | Rising keywords | All categories |
| **OutScraperAPI** | `getBusinessListings()` | Competitor trend analysis | Local (1,2,4) |
| **OutScraperAPI** | `getLinkedInPosts()` | B2B thought leadership trends | B2B (1,3,5) |
| **OutScraperAPI** | `getLinkedInCompanies()` | Industry company trends | B2B (3,5) |

---

## 6 Business Categories & Data Source Mapping

### Category 1: Local Service B2B (Commercial HVAC, IT Services)
**Characteristics:** Local + B2B + Services

| Trend Type | Primary Sources | Secondary Sources |
|------------|-----------------|-------------------|
| Industry Trends | Perplexity AI, NewsAPI (industry) | Serper search |
| Local Market | WeatherAPI, NewsAPI (local) | Serper places |
| Competitor Activity | OutScraper places | Serper competitors |
| Customer Voice | Reddit (subreddits: r/smallbusiness, r/HVAC) | YouTube comments |
| Professional Trends | LinkedIn posts (OutScraper) | Industry news |
| Seasonal/Weather | WeatherAPI | Local news |

**Unique Data Points:**
- Weather-triggered service demand
- Local business district activity
- Commercial building permits/developments
- B2B networking event trends

---

### Category 2: Local Service B2C (Dental, Salon, Restaurant)
**Characteristics:** Local + B2C + Regulated + Services

| Trend Type | Primary Sources | Secondary Sources |
|------------|-----------------|-------------------|
| Consumer Trends | Serper search + autocomplete | YouTube |
| Local Events | NewsAPI (local), Serper news | Local event calendars |
| Competitor Analysis | OutScraper reviews, Serper places | Google trends |
| Review Sentiment | OutScraper (rating tier analysis) | Reddit discussions |
| Seasonal Demand | WeatherAPI, Calendar events | News trends |
| Health/Wellness | Perplexity AI | Industry news |

**Unique Data Points:**
- Local event calendar integration
- Seasonal service demand patterns
- Competitor review velocity
- Regulatory/health trend monitoring
- Consumer spending sentiment

---

### Category 3: Regional B2B Agency (Marketing, Accounting, Consulting)
**Characteristics:** Regional + B2B + Professional Services

| Trend Type | Primary Sources | Secondary Sources |
|------------|-----------------|-------------------|
| Industry Thought Leadership | LinkedIn posts (OutScraper) | Perplexity AI |
| Service Demand Trends | Serper search + autocomplete | SemrushAPI keywords |
| Client Industry Trends | NewsAPI (multi-industry) | Reddit |
| Competitive Positioning | LinkedIn companies | Serper competitors |
| Technology Trends | YouTube, Reddit | Perplexity AI |
| Regulatory/Compliance | NewsAPI, Perplexity | Industry publications |

**Unique Data Points:**
- LinkedIn engagement trends
- Client industry health indicators
- Service category demand shifts
- Professional certification trends
- Regional economic indicators

---

### Category 4: Regional Retail/E-commerce B2C (Multi-location Retail)
**Characteristics:** Regional + B2C + Products + Franchise

| Trend Type | Primary Sources | Secondary Sources |
|------------|-----------------|-------------------|
| Product Trends | Serper shopping | YouTube reviews |
| Consumer Behavior | Reddit, YouTube | Serper autocomplete |
| Pricing/Competition | Serper shopping | Competitor websites |
| Local Market Conditions | NewsAPI local, WeatherAPI | Serper places |
| E-commerce Trends | Perplexity AI | Industry news |
| Seasonal Demand | Calendar + Weather | Shopping trends |

**Unique Data Points:**
- Product category velocity
- Price sensitivity indicators
- Multi-location performance correlation
- Inventory trend signals
- Local vs online shopping shifts

---

### Category 5: National SaaS B2B (OpenDialog-type)
**Characteristics:** National + B2B + SaaS + Complex

| Trend Type | Primary Sources | Secondary Sources |
|------------|-----------------|-------------------|
| Technology Trends | Reddit (r/SaaS, industry subs) | Perplexity AI |
| Competitor Activity | LinkedIn, SemrushAPI | Serper news |
| Market Demand | SemrushAPI keywords | Serper autocomplete |
| Industry News | NewsAPI, Perplexity | LinkedIn posts |
| Developer/Tech Trends | Reddit, YouTube | GitHub trends |
| Enterprise Buying Signals | LinkedIn | Industry reports |

**Unique Data Points:**
- Feature request trends (Reddit, G2)
- Integration demand signals
- Competitor feature announcements
- Enterprise buying cycle indicators
- Technology adoption curves

---

### Category 6: National Product B2C/B2B2C (Consumer Brand, Manufacturer)
**Characteristics:** National + B2C + Products + Hybrid Channels

| Trend Type | Primary Sources | Secondary Sources |
|------------|-----------------|-------------------|
| Consumer Trends | YouTube, Reddit | Serper search |
| Product Demand | Serper shopping | SemrushAPI |
| Channel Trends | LinkedIn (B2B), YouTube (B2C) | Industry news |
| Competitor Activity | Serper shopping, YouTube | News |
| Influencer/Social | YouTube, Reddit | Perplexity AI |
| Retail Partner Trends | LinkedIn, NewsAPI | Industry reports |

**Unique Data Points:**
- Product review velocity
- Influencer mention trends
- Retail partner health signals
- Channel preference shifts
- Price elasticity indicators

---

## Architecture: Trend Category Router

```typescript
interface TrendSourceConfig {
  category: BusinessCategory;
  primarySources: TrendSource[];
  secondarySources: TrendSource[];
  uniqueDataPoints: string[];
  refreshInterval: number; // minutes
}

type BusinessCategory =
  | 'local_b2b_service'    // Cat 1
  | 'local_b2c_service'    // Cat 2
  | 'regional_b2b_agency'  // Cat 3
  | 'regional_b2c_retail'  // Cat 4
  | 'national_saas_b2b'    // Cat 5
  | 'national_product_b2c' // Cat 6;

// Router selects appropriate APIs based on category
function getTrendSources(category: BusinessCategory): TrendSourceConfig;
```

---

## Implementation Phases

### Phase 1: UVP-Informed Query Generation
**Goal:** Replace generic queries with brand-specific queries

**Tasks:**
1. Extract keywords from UVP (pain points, differentiators, target customer)
2. Build query generator that combines:
   - Industry keywords
   - Pain point keywords
   - Target customer descriptors
   - Location (if local)
3. Generate 5-10 focused queries per API call

**Example:**
```
Before: "marketing trends 2024"
After:  "SMB marketing automation ROI tracking trends Austin Texas"
```

---

### Phase 2: Multi-Source Validation
**Goal:** Only surface trends that appear in 2+ sources

**Tasks:**
1. Create trend deduplication/matching algorithm
2. Implement cross-source validation scoring
3. Filter: Only trends appearing in 2+ sources pass through
4. Expected noise reduction: ~70%

---

### Phase 3: Brand Relevance Scoring
**Goal:** Score each trend against UVP keywords

**Tasks:**
1. Implement keyword similarity scoring (TF-IDF or cosine)
2. Score trends against:
   - UVP pain points
   - UVP differentiators
   - Target customer description
   - Industry keywords
3. Filter trends below relevance threshold (< 50%)
4. Display relevance score on trend cards

---

### Phase 4: EQ-Weighted Prioritization
**Goal:** Apply psychological trigger weights

**Tasks:**
1. Connect to EQ data from brand context
2. Map trends to psychological triggers:
   - Fear → urgency/risk trends
   - Desire → opportunity/growth trends
   - Trust → credibility/proof trends
3. Weight trend scores by EQ priorities
4. Add "Why This Matters" context per trend

---

### Phase 5: Trend Lifecycle Detection
**Goal:** Classify trends by lifecycle stage

**Tasks:**
1. Implement velocity scoring (growth rate over time)
2. Classify trends:
   - 🔥 Emerging (< 2 weeks, high growth)
   - 📈 Peak (sustained high interest)
   - 📉 Declining (negative growth)
3. Add "Act Now" urgency indicators
4. First-mover opportunity signals

---

### Phase 6: Triggers Integration
**Goal:** Auto-match trends with customer triggers

**Tasks:**
1. Connect Trends with Triggers tab data
2. Auto-suggest content angles combining:
   - Trend topic
   - Customer trigger/emotion
   - UVP differentiator
3. Output: "Trend + Trigger + Suggested Hook" cards
4. One-click content generation

---

### Phase 7: Product-Centric Query Layer
**Goal:** Generate product-specific trend queries by extracting use cases from product descriptions

**Problem Solved:**
- Products like "Selma" (AI sales assistant for insurance) are tokenized into generic keywords
- Product descriptions contain valuable use case context that's being ignored
- Queries skew toward generic industry terms (e.g., "contact center") instead of product-specific use cases (e.g., "AI insurance sales")

**Tasks:**
1. Extract product use cases from UVP:
   - Parse each product's `description` field for use case keywords (sales, support, analytics, etc.)
   - Map product `category` to trend query templates
   - Store as `productUseCases: { name: string, useCase: string, category: string }[]`

2. Generate product-specific queries:
   - For each major product: `[use case] + [industry] + trends`
   - Example: "AI insurance sales assistant trends 2025"
   - Example: "sales automation insurance trends"

3. Query distribution rebalancing:
   - 40% Industry-level queries (existing)
   - 40% Product-specific queries (new - one per major product, max 3)
   - 20% Pain point queries (existing)

4. Category-specific product query templates:
   | Category | Template Pattern |
   |----------|-----------------|
   | Local B2C/B2B | `[product use case] + [location] + trends` |
   | Regional | `[product use case] + [industry vertical] + trends` |
   | National SaaS | `[product use case] + [market segment] + trends` |
   | National Product | `[product use case] + [consumer segment] + trends` |

**Expected Outcome:**
- "Selma" generates: "AI insurance sales assistant trends", "sales automation insurance trends"
- NOT: "ai agents trends" (too generic)

---

### Phase 8: Deep Mining + Time-Series Velocity
**Goal:** Scale data collection 3-5x and add true trend velocity detection

**Problem Solved:**
- Currently only ~35 data points per scan → low validation rate (7%)
- No actual velocity data (can't tell if trend is truly rising/falling)
- Underutilizing Serper API quota (using 2-3 queries out of 100/day)
- Missing free APIs: Autocomplete, Trends, HackerNews

**Tasks:**

1. **Query Multiplication (50-100 queries)**
   - Generate 3x query variations per core topic
   - Add synonym expansion for key terms
   - Include "vs", "alternatives", "problems with" variations
   - Target: 50-100 queries per scan (vs current 21)

2. **Add Serper Autocomplete (Free)**
   - Call `getAutocomplete()` for each core topic
   - Reveals "what people are actually searching"
   - Extract related queries for additional mining
   - Expected: +20-30 data points per scan

3. **Add Serper Trends (Google Trends data)**
   - Call `getTrends()` for top keywords
   - Get actual growth percentage over time
   - Replace estimated velocity with real data
   - Tag trends: 🚀 +50%+ | 📈 +10-50% | ➡️ stable | 📉 declining

4. **Time-Bucketed Queries**
   - Run same queries with time filters: `tbs=qdr:w` (7d), `qdr:m` (30d), `qdr:y` (90d)
   - Compare results across time windows
   - Calculate velocity: (7d mentions / 30d mentions) ratio
   - Detect: "new this week" vs "established trend"

5. **Add HackerNews API (Free)**
   - Search HN for industry topics
   - High signal for tech/B2B trends
   - API: `https://hn.algolia.com/api/v1/search`
   - Filter by points/comments for quality

6. **Parallel API Execution**
   - Run all APIs concurrently (not sequentially)
   - Use Promise.allSettled for fault tolerance
   - Add timeout per API (5s) to prevent blocking
   - Expected: Same wall-clock time, 3x data

**Expected Outcomes:**
| Metric | Before | After |
|--------|--------|-------|
| Raw data points | 35 | 100-150 |
| Validated trends | 2 (7%) | 15-25 (15-20%) |
| Velocity accuracy | Estimated | Real (Google Trends) |
| Time to scan | ~8s | ~10s (parallel) |
| "What people search" | ❌ None | ✅ Autocomplete data |

**New Services:**
- `src/services/trends/time-series-analyzer.service.ts` - Time-bucketed comparison
- Update `useStreamingTrends.ts` - Add autocomplete, trends, HN, parallel execution

---

### Phase 9: Multi-Source as Credibility Badge (Not Filter) ✅ COMPLETE
**Status:** ✅ Completed 2025-11-30
**Goal:** Stop filtering by multi-source validation, use it as a credibility signal instead

**Problem Solved:**
- Multi-source validation designed for breaking news, not trend discovery
- Different platforms discuss same industry but rarely exact same trend
- YouTube/Reddit timeouts cause 90% of trends to be single-source
- Filtering by 2+ sources removes legitimate high-quality trends

**New Approach:**
1. **Remove multi-source as a filter requirement**
2. **Keep multi-source as a credibility badge** ("🔥 Seen in 3 sources")
3. **Prioritize by quality signals instead:**
   - Recency (last 7-30 days)
   - Engagement (points, views, comments)
   - Source authority (HN, industry publications > random blogs)
   - UVP relevance (already built)

**UI Changes:**
- Remove "Multi-Source (0)" filter tab
- Remove lifecycle stage filters (Emerging/Peak/Stable/Declining)
- Keep only Type filters: All Types | Product | Industry | Pain Points
- Show multi-source count as badge on trend cards when > 1

**Expected Outcome:**
- All 69 trends visible (vs 1 with strict validation)
- Multi-source trends highlighted with badge
- Better signal-to-noise via engagement + relevance scoring

---

### Phase 10: Use Case & Outcome-Centric Query Layer ✅ COMPLETE (Revised)
**Status:** ✅ Completed 2025-11-30 - Revised with dynamic extraction for cross-industry scaling
**Goal:** Diversify trend results by generating queries based on use cases and outcomes, not just industry keywords

**Problem Solved:**
- Current queries are 90% industry-focused (e.g., "contact center AI trends")
- Results are too narrow - missing trends about specific use cases like claims management, lead follow-up, sales automation
- Industry-heavy queries don't scale well across different business types

**Initial Implementation Issue:**
The first implementation used hardcoded patterns (SPECIFIC_USE_CASE_PATTERNS, OUTCOME_PATTERNS, PERSONA_PATTERNS) that only work for specific industries like insurance/contact center. These don't scale across the 6 business categories:

| Category | Type | Example |
|----------|------|---------|
| 1 | Local Service B2B | Commercial HVAC, IT Services |
| 2 | Local Service B2C | Dental, Salon, Restaurant |
| 3 | Regional B2B Agency | Marketing, Accounting |
| 4 | Regional Retail B2C | Multi-location Retail |
| 5 | National SaaS B2B | OpenDialog-type |
| 6 | National Product B2C | Consumer Brand |

**Revised Solution: Dynamic Extraction (No Hardcoded Patterns)**

| Query Type | Weight | Source | Extraction Method |
|------------|--------|--------|-------------------|
| **Use Cases** | 40% | UVP Products | Parse action verbs from product names/descriptions (install, repair, clean, schedule, process, automate) |
| **Industry** | 30% | UVP Target Customer | Existing industry detection (already works) |
| **Outcomes** | 20% | UVP Transformation Goal | Parse "before → after" text for measurable changes |
| **Persona** | 10% | UVP Target Customer | Parse role/title from target customer description |

**Dynamic Extraction Implementation:**

1. **Use Cases from Products** (`extractUseCasesFromProducts()`)
   - Parse each product name for action verbs: install, repair, clean, manage, schedule, process, automate, track, monitor, etc.
   - Parse product description for task-level keywords
   - Example: "Commercial HVAC Installation" → use case: "installation"
   - Example: "Appointment Scheduling System" → use case: "appointment scheduling"
   - NO hardcoded industry-specific patterns

2. **Outcomes from Transformation** (`extractOutcomesFromTransformation()`)
   - Parse `transformationGoal.before` for problems (pain points)
   - Parse `transformationGoal.after` for desired states (outcomes)
   - Extract action phrases: "reduce X", "increase Y", "automate Z", "improve W"
   - Example: "from spending hours on manual scheduling" → outcome: "reduce manual scheduling time"
   - Example: "to automated 24/7 booking" → outcome: "24/7 automated booking"

3. **Personas from Target Customer** (`extractPersonasFromTarget()`)
   - Parse `targetCustomer.role` for job titles
   - Parse `targetCustomer.statement` for organizational roles
   - Extract decision-maker titles dynamically
   - Example: "Operations managers at commercial properties" → persona: "Operations manager"
   - NO hardcoded title lists

4. **Query Generation Pattern:**
   ```
   Use Case Query:  "[extracted action] [industry] trends [year]"
   Outcome Query:   "[extracted outcome] automation trends"
   Persona Query:   "[extracted role] priorities [industry] [year]"
   ```

**Files to Update:**
- `src/services/trends/uvp-query-generator.service.ts`
  - Remove SPECIFIC_USE_CASE_PATTERNS (hardcoded)
  - Remove OUTCOME_PATTERNS (hardcoded)
  - Remove PERSONA_PATTERNS (hardcoded)
  - Add extractUseCasesFromProducts() - dynamic
  - Add extractOutcomesFromTransformation() - dynamic
  - Add extractPersonasFromTarget() - dynamic
  - Update generateBalancedQueries() to use dynamic extractors

**Expected Outcome:**
- Works for HVAC brand: "installation trends", "repair automation", "scheduling commercial HVAC"
- Works for Dental: "appointment scheduling dental", "patient intake automation"
- Works for SaaS: "claims processing automation", "lead qualification AI"
- Scales across ALL 6 business categories without code changes

---

### Phase 11: Outcome-Driven Trend Discovery 🚧 NEW
**Status:** 🚧 In Progress (2025-11-30)
**Goal:** Shift from keyword-centric to outcome-centric trend discovery

**Problem Analysis (from TREND_ANALYSIS_RESEARCH.md):**
The current approach searches for **what we sell** (AI, chatbot, insurance) instead of **what customers need** (reduce handle time, improve CSAT, 24/7 availability). This creates noise because:
- A trend about "Coinbase complaints" matches "customer support" keywords but is irrelevant
- A trend about "reduce insurance claim processing time" is highly relevant but might not match product keywords

**Research Foundation:**
- Section 2.6 (VoC Integration): Query by **customer pain expressions**, not product keywords
- Section 3.2 (Supply & Demand Model): "Analyze what's demanded by relevant segments"
- Section 3.4 (Relevance Engineering): Beyond keyword matching → semantic relevance at entity level

**Core Principle:**
> Query by what buyers are **trying to accomplish**, not what we **sell**.

---

**Outcome-Driven Query Types (All 6 Categories):**

| Query Type | Description | Example Template |
|------------|-------------|------------------|
| **Transformation** | What's the customer's desired end state? | `"how to [desired outcome] in [industry]"` |
| **Problem State** | What pain are they trying to escape? | `"[industry] [pain point] problems 2024"` |
| **Buyer Priority** | What does the decision-maker care about? | `"[buyer role] [industry] priorities"` |
| **Competitor Gap** | What can't current solutions do? | `"limitations of [competitor alternative] for [use case]"` |
| **Outcome Metric** | What KPI are they trying to improve? | `"improving [metric] [industry] [context]"` |

---

**Category-Specific Query Examples:**

#### Category 1: Local Service B2B (Commercial HVAC)
| Query Type | Example Query |
|------------|---------------|
| Transformation | "how to reduce commercial HVAC downtime" |
| Problem State | "commercial building HVAC failure problems" |
| Buyer Priority | "facilities manager HVAC priorities 2024" |
| Competitor Gap | "problems with preventive maintenance contracts HVAC" |
| Outcome Metric | "improving energy efficiency commercial buildings" |

#### Category 2: Local Service B2C (Dental Practice)
| Query Type | Example Query |
|------------|---------------|
| Transformation | "how to reduce patient wait times dental" |
| Problem State | "dental practice no-show problems" |
| Buyer Priority | "dental practice owner patient retention priorities" |
| Competitor Gap | "limitations of dental scheduling software" |
| Outcome Metric | "improving patient satisfaction dental clinic" |

#### Category 3: Regional B2B Agency (Marketing Agency)
| Query Type | Example Query |
|------------|---------------|
| Transformation | "how to prove marketing ROI to clients" |
| Problem State | "marketing agency client churn problems" |
| Buyer Priority | "CMO marketing agency expectations 2024" |
| Competitor Gap | "problems with traditional marketing agencies" |
| Outcome Metric | "improving client retention marketing agency" |

#### Category 4: Regional Retail B2C (Multi-location Retail)
| Query Type | Example Query |
|------------|---------------|
| Transformation | "how to increase foot traffic retail stores" |
| Problem State | "multi-location retail inventory problems" |
| Buyer Priority | "retail operations manager priorities 2024" |
| Competitor Gap | "limitations of retail POS systems" |
| Outcome Metric | "improving same-store sales retail" |

#### Category 5: National SaaS B2B (OpenDialog/Conversational AI)
| Query Type | Example Query |
|------------|---------------|
| Transformation | "how to reduce insurance claim processing time" |
| Problem State | "insurance customer service complaints 2024" |
| Buyer Priority | "VP customer experience insurance priorities" |
| Competitor Gap | "limitations of rule-based chatbots insurance" |
| Outcome Metric | "improving CSAT scores insurance contact center" |

#### Category 6: National Product B2C (Consumer Brand)
| Query Type | Example Query |
|------------|---------------|
| Transformation | "how to build brand loyalty consumer products" |
| Problem State | "consumer brand differentiation problems" |
| Buyer Priority | "brand manager DTC priorities 2024" |
| Competitor Gap | "problems with Amazon-only brands" |
| Outcome Metric | "improving customer lifetime value DTC" |

---

**Implementation Tasks:**

1. **Add Outcome Query Generator** (`outcome-query-generator.service.ts`)
   - Extract transformation goal from UVP (`transformationGoal.before` → `transformationGoal.after`)
   - Extract buyer role from target customer
   - Extract measurable outcomes from differentiators
   - Generate 5 query types per scan

2. **Update Query Distribution**
   | Query Type | Current | New |
   |------------|---------|-----|
   | Industry | 30% | 15% |
   | Product/Use Case | 40% | 20% |
   | Pain Point | 20% | 15% |
   | **Outcome/Transformation** | 0% | **30%** |
   | **Buyer Priority** | 0% | **10%** |
   | **Competitor Gap** | 10% | **10%** |

3. **Update Relevance Scorer** (`trend-relevance-scorer.service.ts`)
   - Add new scoring dimension: `outcomeAlignment`
   - Validate against **core product function** (what problem does the product solve?)
   - Weight outcome alignment at 25% of total relevance score

4. **Add Core Function Validator**
   - Extract the **primary job** the product does (e.g., "automate customer conversations")
   - Reject trends that don't relate to this core function
   - Example: OpenDialog's core function = "automate customer interactions"
     - ✅ "reducing handle time" → relates to automation efficiency
     - ❌ "Coinbase complaint" → doesn't relate to automation

5. **Category-Aware Outcome Templates**
   - Store outcome query templates per business category
   - Dynamic slot filling from UVP data
   - Fall back to generic outcome patterns if UVP data insufficient

---

**Expected Outcomes:**

| Metric | Before (Keyword-Centric) | After (Outcome-Driven) |
|--------|-------------------------|------------------------|
| Relevant trends | ~30% | ~70%+ |
| Generic news noise | High (Coinbase, SEO, etc.) | Low (filtered by core function) |
| Customer-centric | No | Yes |
| Buyer role alignment | No | Yes |
| Cross-category scaling | Hardcoded patterns | Dynamic from UVP |

---

**Files to Create/Update:**

| File | Action | Purpose |
|------|--------|---------|
| `outcome-query-generator.service.ts` | Create | Generate outcome-driven queries |
| `uvp-query-generator.service.ts` | Update | Add outcome query integration |
| `trend-relevance-scorer.service.ts` | Update | Add outcome alignment scoring + core function validation |
| `trend-category-router.service.ts` | Update | Add category-specific outcome templates |
| `useStreamingTrends.ts` | Update | Integrate new query distribution |

---

## Category-Specific API Wiring

### Local Categories (1, 2, 4)
```typescript
// MUST include these APIs:
- WeatherAPI.detectWeatherOpportunities()
- NewsAPI.getLocalNews()
- SerperAPI.getPlaces()
- OutScraperAPI.getBusinessListings()
```

### B2B Categories (1, 3, 5)
```typescript
// MUST include these APIs:
- OutScraperAPI.getLinkedInPosts()
- OutScraperAPI.getLinkedInCompanies()
- NewsAPI.getIndustryNews()
```

### National Categories (5, 6)
```typescript
// MUST include these APIs:
- SemrushAPI.getKeywordOpportunities()
- SemrushAPI.getTrends()
- SerperAPI.getShopping() // for products
```

### All Categories
```typescript
// Always include:
- SerperAPI.searchGoogle()
- SerperAPI.getNews()
- SerperAPI.getAutocomplete()
- YouTubeAPI.searchVideos()
- RedditAPI.mineIntelligence()
- PerplexityAPI.getIndustryInsights()
```

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    TRENDS 2.0 DATA FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐                                               │
│  │   UVP Data   │──┐                                            │
│  │  Pain Points │  │                                            │
│  │ Differentiators│  │    ┌────────────────────┐                │
│  │Target Customer│  ├───▶│ Query Generator    │                │
│  │   Industry   │  │    │ (UVP-informed)     │                │
│  └──────────────┘  │    └─────────┬──────────┘                │
│                    │              │                            │
│  ┌──────────────┐  │              ▼                            │
│  │   Category   │──┘    ┌────────────────────┐                │
│  │   Detector   │       │  API Router        │                │
│  │  (1-6 types) │       │  (category-aware)  │                │
│  └──────────────┘       └─────────┬──────────┘                │
│                                   │                            │
│                    ┌──────────────┼──────────────┐             │
│                    ▼              ▼              ▼             │
│           ┌────────────┐ ┌────────────┐ ┌────────────┐        │
│           │  Serper    │ │  YouTube   │ │  Reddit    │        │
│           │  News API  │ │  API       │ │  API       │        │
│           │  Weather   │ │            │ │            │        │
│           └─────┬──────┘ └─────┬──────┘ └─────┬──────┘        │
│                 │              │              │                │
│           ┌────────────┐ ┌────────────┐ ┌────────────┐        │
│           │ LinkedIn   │ │ Perplexity │ │  Semrush   │        │
│           │ OutScraper │ │    AI      │ │  (SEO)     │        │
│           └─────┬──────┘ └─────┬──────┘ └─────┬──────┘        │
│                 │              │              │                │
│                 └──────────────┼──────────────┘                │
│                                ▼                               │
│                   ┌────────────────────┐                       │
│                   │  Multi-Source      │                       │
│                   │  Validator         │                       │
│                   │  (2+ sources req)  │                       │
│                   └─────────┬──────────┘                       │
│                             ▼                                  │
│                   ┌────────────────────┐                       │
│                   │  Relevance Scorer  │                       │
│                   │  (UVP matching)    │                       │
│                   └─────────┬──────────┘                       │
│                             ▼                                  │
│                   ┌────────────────────┐                       │
│                   │  EQ Prioritizer    │                       │
│                   │  (psych triggers)  │                       │
│                   └─────────┬──────────┘                       │
│                             ▼                                  │
│                   ┌────────────────────┐                       │
│                   │  Lifecycle Tagger  │                       │
│                   │  (emerging/peak)   │                       │
│                   └─────────┬──────────┘                       │
│                             ▼                                  │
│                   ┌────────────────────┐                       │
│                   │  Triggers Matcher  │                       │
│                   │  (content angles)  │                       │
│                   └─────────┬──────────┘                       │
│                             ▼                                  │
│                   ┌────────────────────┐                       │
│                   │   TREND CARDS      │                       │
│                   │   (UI Display)     │                       │
│                   └────────────────────┘                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Service Files to Create

1. `src/services/trends/trend-category-router.service.ts`
2. `src/services/trends/uvp-query-generator.service.ts`
3. `src/services/trends/multi-source-validator.service.ts`
4. `src/services/trends/trend-relevance-scorer.service.ts`
5. `src/services/trends/eq-trend-prioritizer.service.ts`
6. `src/services/trends/trend-lifecycle-detector.service.ts`
7. `src/services/trends/triggers-trend-matcher.service.ts`
8. `src/hooks/useStreamingTrends.ts`

---

## Expected Outcomes

| Metric | Before | After |
|--------|--------|-------|
| Relevance | ~20% useful | ~80% useful |
| Signal/Noise | High noise | Low noise |
| Brand Specificity | Generic | Brand-specific |
| Actionability | "Here's a trend" | "Trend + Why + Content Angle" |
| Category Awareness | None | 6 categories |
| Cross-Source Validation | None | 2+ source requirement |

---

## Build Status Tracking

- [x] Phase 1: UVP-Informed Query Generation ✅ (2025-11-29)
- [x] Phase 2: Multi-Source Validation ✅ (2025-11-29)
- [x] Phase 3: Brand Relevance Scoring ✅ (2025-11-29)
- [x] Phase 4: EQ-Weighted Prioritization ✅ (2025-11-29)
- [x] Phase 5: Trend Lifecycle Detection ✅ (2025-11-29)
- [x] Phase 6: Triggers Integration ✅ (2025-11-29)
- [x] **Phase 7: Product-Centric Query Layer** ✅ (2025-11-30)
- [x] **Phase 8: Deep Mining + Time-Series Velocity** ✅ (2025-11-30)
- [x] Phase 9: Multi-Source as Credibility Badge ✅ (2025-11-30)
- [x] **Phase 10: Use Case & Outcome-Centric (Revised with Dynamic Extraction)** ✅ (2025-11-30)
- [ ] **Phase 11: Outcome-Driven Trend Discovery** 🚧 (2025-11-30)
- [x] Category Router Implementation ✅ (2025-11-29)
- [x] TrendsDevPage.tsx Full Wiring ✅ (2025-11-29)
- [x] Category-Specific API Routing ✅ (2025-11-29)
- [x] Content Generation Integration ✅ (2025-11-29)
- [x] APIs Used Display in Stats Panel ✅ (2025-11-29)
- [x] Intent Type Filter (Product/Industry/Pain Points) ✅ (2025-11-30)
- [x] Dynamic Extraction (Cross-Industry Scaling) ✅ (2025-11-30)

---

## Implementation Summary (2025-11-29)

### Files Created

**Services (`src/services/trends/`):**
1. `uvp-query-generator.service.ts` - Extracts UVP keywords and generates brand-specific queries
2. `trend-category-router.service.ts` - Routes to appropriate APIs based on 6 business categories
3. `multi-source-validator.service.ts` - Validates trends appearing in 2+ sources (70% noise reduction)
4. `trend-relevance-scorer.service.ts` - Scores trends against UVP with TF-IDF matching
5. `eq-trend-prioritizer.service.ts` - Applies psychological trigger weights (fear/desire/trust/etc)
6. `trend-lifecycle-detector.service.ts` - Classifies emerging/peak/stable/declining with urgency
7. `triggers-trend-matcher.service.ts` - Matches trends with customer triggers for content angles
8. `trend-content-generator.service.ts` - Bridges trends with content generation (headline, body, CTA, hashtags)

**Hooks (`src/hooks/`):**
1. `useStreamingTrends.ts` - Master orchestration hook for the full pipeline

**Pages (`src/pages/`):**
1. `TrendsDevPage.tsx` - Complete rewrite with Trends 2.0 UI and pipeline integration

### Architecture

```
UVP Data → Query Generator → Category Router → API Fetching
                                                    ↓
Multi-Source Validator ← Raw Trends (serper/youtube/reddit/perplexity/news)
        ↓
Relevance Scorer (UVP keyword matching)
        ↓
EQ Prioritizer (psychological triggers)
        ↓
Lifecycle Detector (emerging/peak/stable/declining)
        ↓
Triggers Matcher (content angle generation)
        ↓
Final Trends with hooks, angles, and "Generate" buttons
```

### Key Features Implemented

1. **UVP-Informed Queries**: Generates 15-25 targeted queries per run using pain points, differentiators, and customer descriptors
2. **6 Business Categories**: Local B2B Service, Local B2C Service, Regional B2B Agency, Regional Retail, National SaaS, National Product
3. **Multi-Source Validation**: Jaccard similarity clustering with 2+ source requirement
4. **Relevance Scoring**: 6-dimension scoring (industry, pain points, differentiators, customer, products, emotional)
5. **EQ Triggers**: 7 psychological trigger types with framing recommendations
6. **Lifecycle Detection**: 4 stages with velocity estimation and first-mover detection
7. **Content Angles**: Auto-generated hooks and 5 content angle types per trend

### UI Features

- Pipeline progress bar with stage indicators
- Filter tabs: All / Content Ready / Validated / Emerging
- Lifecycle filter: All Stages / Emerging / Peak / Stable / Declining
- Stats panel with funnel visualization and **APIs Used display**
- Trend cards with lifecycle badges, relevance scores, suggested hooks
- "Generate" button on content-ready trends with loading state
- **Content generation modal** with headline, body, CTA, hashtags, and copy-to-clipboard

### Category-Specific API Routing (100% Complete)

The `useStreamingTrends` hook now routes to different APIs based on detected business category:

| Category | Additional APIs Called |
|----------|----------------------|
| Local (1,2,4) | WeatherAPI, Serper Places |
| B2B (1,3,5) | LinkedIn Search |
| National (5,6) | SemrushAPI Keywords |
| Retail (4,6) | Serper Shopping |
| All | Serper Autocomplete, Search, News, YouTube, Reddit, Perplexity |

### Content Generation (100% Complete)

- **trend-content-generator.service.ts**: Generates platform-optimized content
- Supports: LinkedIn, Instagram, Facebook, Twitter, Blog
- Outputs: headline, content body, call-to-action, hashtags
- Includes estimated engagement scoring
- Modal displays generated content with copy functionality
