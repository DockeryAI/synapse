# Dashboard Tab List Per Industry Plan

## Overview
Power Mode tabs represent the main content building blocks the Synapse engine uses to generate unique content. Different business categories require different tabs based on their data sources and content needs.

---

## Tab Definitions

| Tab | Purpose | Content Type |
|-----|---------|--------------|
| **Triggers** | Customer psychology - fears, desires, frustrations, objections | WHY they buy |
| **Proof** | Social proof, testimonials, case studies, credibility signals | WHY trust you |
| **Trends** | Industry/market trends, timing signals, what's happening now | WHAT to talk about |
| **Gaps** | Competitor weaknesses, unmet needs, differentiation opportunities | WHERE you win |
| **Voice** | Community discussions, what customers are saying | HOW they talk |
| **Weather** | Weather-triggered demand and seasonal opportunities | WHEN to act (weather) |
| **Local** | Local events, news, community happenings | WHEN to act (local) |
| **Seasonal** | Calendar-based seasonal demand patterns | WHEN to act (calendar) |
| **Authority** | Expert positioning, thought leadership content | WHO you are |
| **Buzz** | Social/influencer activity, viral content, mentions | WHO's talking |

---

## Tabs by Business Category

### Category 1: Local B2B Service (Commercial HVAC, IT Services)
**Characteristics:** Local + B2B + Services

| Tab | Primary Sources | Content Use |
|-----|-----------------|-------------|
| Triggers | Reviews, Reddit, LinkedIn | Pain point content, objection handling |
| Proof | Google reviews, certifications, case studies | Trust building, credibility |
| Trends | Industry news, Perplexity AI | Thought leadership, relevance |
| **Weather** | WeatherAPI | Emergency service promos, seasonal prep |
| **Local** | Local news, events, permits | Community engagement, timing |
| Gaps | Review analysis, competitor profiles | Differentiation content |

**Tab Order:** Triggers → Proof → Trends → Weather → Local → Gaps

---

### Category 2: Local B2C Service (Dental, Salon, Restaurant)
**Characteristics:** Local + B2C + Regulated + Services

| Tab | Primary Sources | Content Use |
|-----|-----------------|-------------|
| Triggers | Reviews, social, Reddit | Emotional content, desire triggers |
| Proof | Google reviews, before/after, ratings | Social proof, FOMO |
| Trends | Consumer trends, health/wellness news | Relevance, education |
| **Seasonal** | Calendar events, holidays, school schedules | Promo timing, themed content |
| **Local** | Local events, community news | Community connection, relevance |
| Gaps | Competitor review sentiment | Service differentiation |

**Tab Order:** Triggers → Proof → Trends → Seasonal → Local → Gaps

---

### Category 3: Regional B2B Agency (Marketing, Accounting, Consulting)
**Characteristics:** Regional + B2B + Professional Services

| Tab | Primary Sources | Content Use |
|-----|-----------------|-------------|
| Triggers | LinkedIn, forums, client feedback | Pain point content, empathy |
| Proof | Case studies, client results, testimonials | Results-focused content |
| Trends | LinkedIn posts, industry news, Perplexity | Thought leadership, insights |
| **Authority** | LinkedIn content, publications, speaking | Expert positioning, credibility |
| Gaps | Competitor analysis, service gaps | Differentiation, positioning |

**Tab Order:** Triggers → Proof → Trends → Authority → Gaps

---

### Category 4: Regional B2C Retail (Multi-location)
**Characteristics:** Regional + B2C + Products + Franchise

| Tab | Primary Sources | Content Use |
|-----|-----------------|-------------|
| Triggers | Reviews, Reddit, YouTube | Purchase motivation content |
| Proof | Reviews, popularity signals, social | Social proof, bestsellers |
| Trends | Shopping APIs, product trends | What's hot, new arrivals |
| **Seasonal** | Calendar, weather, holidays | Seasonal promos, themed content |
| **Local** | Local news per location | Location-specific content |
| Gaps | Competitor pricing, product gaps | Competitive positioning |

**Tab Order:** Triggers → Proof → Trends → Seasonal → Local → Gaps

---

### Category 5: National SaaS B2B (OpenDialog-type)
**Characteristics:** National + B2B + SaaS + Complex

| Tab | Primary Sources | Content Use |
|-----|-----------------|-------------|
| Triggers | Reddit, G2, reviews, forums | Buyer psychology, objection handling |
| Proof | Case studies, metrics, testimonials | ROI content, trust building |
| Trends | Tech news, LinkedIn, Perplexity | Industry insights, relevance |
| Voice | Reddit, forums, community discussions | Customer language, empathy |
| Gaps | G2, Reddit, feature comparisons | Competitive differentiation |

**Tab Order:** Triggers → Proof → Trends → Voice → Gaps

---

### Category 6: National Product B2C/B2B2C (Consumer Brand)
**Characteristics:** National + B2C + Products + Hybrid Channels

| Tab | Primary Sources | Content Use |
|-----|-----------------|-------------|
| Triggers | Reviews, YouTube, Reddit | Purchase psychology, desire |
| Proof | Reviews, influencer mentions, ratings | Social proof, popularity |
| Trends | Shopping trends, YouTube, news | What's trending, relevance |
| **Buzz** | YouTube, social mentions, influencers | Viral content, social proof |
| Gaps | Competitor product reviews | Product differentiation |

**Tab Order:** Triggers → Proof → Trends → Buzz → Gaps

---

## Summary Matrix

| Category | Triggers | Proof | Trends | Gaps | Unique Tabs |
|----------|:--------:|:-----:|:------:|:----:|-------------|
| 1. Local B2B Service | ✓ | ✓ | ✓ | ✓ | Weather, Local |
| 2. Local B2C Service | ✓ | ✓ | ✓ | ✓ | Seasonal, Local |
| 3. Regional B2B Agency | ✓ | ✓ | ✓ | ✓ | Authority |
| 4. Regional B2C Retail | ✓ | ✓ | ✓ | ✓ | Seasonal, Local |
| 5. National SaaS B2B | ✓ | ✓ | ✓ | ✓ | Voice |
| 6. National Product B2C | ✓ | ✓ | ✓ | ✓ | Buzz |

**Universal Tabs (all categories):** Triggers, Proof, Trends, Gaps
**Category-Specific:** Weather, Local, Seasonal, Authority, Voice, Buzz

---

## Data Source Mapping Per Tab

### Triggers (All Categories)
- OutScraperAPI: Google reviews (rating tier analysis)
- RedditAPI: Pain point mining
- PerplexityAPI: Customer psychology research
- YouTubeAPI: Comment sentiment (B2C)
- LinkedIn (OutScraper): B2B pain points

### Proof (All Categories)
- OutScraperAPI: Review highlights, ratings
- Google reviews: Testimonial mining
- Case study database (internal)
- Certification/credential data

### Trends (All Categories)
- SerperAPI: Search trends, news
- NewsAPI: Industry news
- YouTubeAPI: Video trends
- PerplexityAPI: AI synthesis
- SemrushAPI: SEO trends (National)
- LinkedIn (OutScraper): B2B trends

### Gaps (All Categories)
- OutScraperAPI: Competitor review analysis
- SerperAPI: Competitor search
- PerplexityAPI: Gap identification
- SemrushAPI: Keyword gaps (National)

### Weather (Local B2B/B2C)
- WeatherAPI: Current + 5-day forecast
- Opportunity detection algorithm

### Local (Local + Regional B2C)
- NewsAPI: Local news
- SerperAPI: Local events
- Calendar integration (holidays, events)

### Seasonal (B2C Categories)
- Calendar data (holidays, seasons)
- WeatherAPI: Seasonal transitions
- Historical demand patterns

### Authority (B2B Agency)
- LinkedIn posts (OutScraper)
- Publication/speaking data
- Thought leadership content

### Voice (SaaS B2B)
- RedditAPI: Community discussions
- Forum scraping
- G2/review site comments

### Buzz (Consumer Product)
- YouTubeAPI: Influencer mentions
- Social listening
- Viral content detection

---

## Implementation Notes

1. **Tab Router Service** - Detect business category, return appropriate tab config
2. **Dynamic Tab Rendering** - PowerModePanel renders only relevant tabs
3. **Data Source Routing** - Each tab calls appropriate APIs based on category
4. **Tab State Persistence** - Remember last active tab per category

---

## Build Status

- [ ] Create tab configuration types
- [ ] Implement category detection from UVP/brand data
- [ ] Build tab router service
- [ ] Update PowerModePanel for dynamic tabs
- [ ] Wire data sources per tab per category
- [ ] Add tab-specific UI components (Weather, Local, etc.)
