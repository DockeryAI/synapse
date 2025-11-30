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

- [ ] Phase 1: UVP-Informed Query Generation
- [ ] Phase 2: Multi-Source Validation
- [ ] Phase 3: Brand Relevance Scoring
- [ ] Phase 4: EQ-Weighted Prioritization
- [ ] Phase 5: Trend Lifecycle Detection
- [ ] Phase 6: Triggers Integration
- [ ] Category Router Implementation
- [ ] TrendsDevPage.tsx Full Wiring
