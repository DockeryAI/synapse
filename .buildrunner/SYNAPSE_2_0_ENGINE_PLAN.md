# Synapse 2.0 Content Engine Plan

**Status**: STRATEGIC BLUEPRINT
**Created**: 2025-11-30
**Goal**: The most insightful, unique, and powerful content engine on the market

---

## Executive Summary

Synapse 2.0 combines V1's proven streaming architecture with V4's modular psychology engine, unified by a new **Intelligence Router** that correlates signals across 13+ data sources to generate content no competitor can match.

**Core Differentiator**: While competitors generate content from prompts, Synapse generates content from **correlated intelligence**—real customer language, live market signals, proven hooks, and competitive gaps discovered in real-time.

---

## Part 1: Architecture Overview

### The Three-Layer Stack

```
┌─────────────────────────────────────────────────────────────────────┐
│                    LAYER 3: CONTENT GENERATION                       │
│   Psychology Engine → Framework Selection → Platform Optimization    │
├─────────────────────────────────────────────────────────────────────┤
│                    LAYER 2: INTELLIGENCE ROUTER                      │
│   Signal Correlation → Constraint Solver → Variety Enforcement       │
├─────────────────────────────────────────────────────────────────────┤
│                    LAYER 1: DATA COLLECTION (Pluggable APIs)         │
│   YouTube │ Reddit │ Reviews │ News │ SERP │ Trends │ Social │ SEO  │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Request → Business Profile Detection → Segment Rules Applied
     ↓
API Wave 1 (Critical) → API Wave 2 (Enrichment) → API Wave 3 (Optional)
     ↓
Raw Signals → Intelligence Router → Correlated Insights
     ↓
Constraint Matrix → Variety Enforcement → Dimension Tagging
     ↓
Psychology Engine → Framework Selection → Platform Optimization
     ↓
Generated Content (tagged with source attribution)
```

---

## Part 2: Preserve From V1 (What Worked)

### 1. Streaming-First Architecture
- Netflix-style progressive loading with wave-based execution
- Users see value in <3 seconds, full insights in 15-30 seconds
- **Keep**: `streaming-deepcontext-builder.service.ts` pattern

### 2. Wave-Based Parallel Execution
```typescript
Wave 1 (0-3s): YouTube, Google Trends, Weather (fastest, most reliable)
Wave 2 (3-8s): Reddit, News, OutScraper reviews (medium latency)
Wave 3 (8-15s): SEMrush, Perplexity, LinkedIn (slower, optional)
```

### 3. Graceful Degradation
- If any API fails, system continues with available data
- Quality scoring adjusts based on data completeness
- **Keep**: `try-catch` wrappers with fallback content

### 4. Multi-Source Validation
- Same insight from 3+ sources = high confidence
- Conflicting signals trigger deeper analysis
- **Keep**: Source attribution in all insights

### 5. Connection Discovery Engine
- AI-powered pattern recognition across disparate data
- Non-obvious correlations (weather + sentiment + timing)
- **Keep**: `ConnectionDiscoveryEngine.ts` core logic

---

## Part 3: Fix From V4 (Current Gaps)

### Gap 1: Intelligence Pipeline Not Integrated
**Problem**: V4's content-orchestrator doesn't consume insights from the intelligence pipeline
**Fix**: Create `IntelligenceConsumer` that feeds correlated insights to content generation

### Gap 2: No Segment Awareness
**Problem**: Same content strategy for bakery and SaaS company
**Fix**: Implement 6 Business Category presets with different API priorities, content mix ratios, and constraint rules

### Gap 3: Limited Industry Profile Wiring
**Problem**: 377 enhanced profiles exist but aren't fully utilized
**Fix**: Wire `enhanced-profile-loader.service.ts` into content generation prompts

### Gap 4: No Competitive Positioning
**Problem**: Content doesn't differentiate from competitors
**Fix**: Add competitive gap analysis to every content generation cycle

### Gap 5: Deduplication Weak
**Problem**: Similar insights repeated across suggestions
**Fix**: Implement semantic deduplication with embedding similarity scoring

---

## Part 4: New Intelligence Router

The **Intelligence Router** is the brain of Synapse 2.0—it correlates signals from all APIs into actionable content directions.

### Core Components

#### 4.1 Signal Correlator
```typescript
interface CorrelatedInsight {
  insight: string;
  sources: string[];           // ['youtube', 'reddit', 'reviews']
  confidence: number;          // 0.0-1.0 based on source count
  dimensions: DimensionTags;   // 12-dimension tagging
  uniqueAngle?: string;        // Contrarian/unexpected take
  seoRelevance?: number;       // Search volume correlation
}
```

#### 4.2 Constraint Solver
Applies business rules to ensure content variety:
- Stage ↔ CTA mapping (TOFU never gets "Buy Now")
- Format ↔ Stage rules (Case studies only for MOFU/BOFU)
- Emotion ↔ Angle constraints (Fear → Solution-focused)
- Persona ↔ Format matching (C-Suite → Data-heavy)

#### 4.3 Variety Enforcement Algorithm
```
1. Define target mix (60% educational, 30% engagement, 10% promotional)
2. Generate seed insights from correlated signals
3. Tag each with 12 dimensions
4. Score for variety (penalize dimension clusters)
5. Backfill underrepresented dimensions
6. Return diverse content queue
```

### 4.4 The 12 Insight Dimensions

| Dimension | Purpose | Example Values |
|-----------|---------|----------------|
| Stage | Funnel position | TOFU, MOFU, BOFU |
| Emotion | Psychological trigger | Fear, Aspiration, Curiosity |
| Format | Content structure | How-to, Story, List, Comparison |
| Pillar | Topic category | Authority, Trust, Education |
| Persona | Target audience | Decision Maker, Influencer, User |
| Objection | Barrier addressed | Price, Time, Trust, Complexity |
| Angle | Unique perspective | Contrarian, Data-driven, Personal |
| CTA | Desired action | Learn, Engage, Convert |
| Urgency | Time sensitivity | Evergreen, Seasonal, Breaking |
| Confidence | Data backing | High (3+ sources), Medium, Low |
| Position | Competitive stance | Leader, Challenger, Niche |
| Lifecycle | Customer stage | Prospect, Customer, Advocate |

---

## Part 5: Unique Angle Discovery Engine

**This is Synapse's moat.** While competitors regurgitate common takes, Synapse surfaces angles that make readers think "I didn't consider that."

### 5 Angle Discovery Methods

#### Method 1: Contrarian Flip
- Find consensus opinion from reviews/Reddit
- Generate supported opposing viewpoint
- Example: "Everyone says post daily → Data shows 3x/week outperforms"

#### Method 2: Adjacent Industry Transplant
- Identify successful patterns in related industries
- Apply to user's industry with attribution
- Example: "SaaS onboarding applied to consulting client intake"

#### Method 3: Hidden Data Mining
- Extract non-obvious insights from available data
- Combine weather + sentiment + timing patterns
- Example: "Your customers complain 40% more on Mondays → Solution content"

#### Method 4: Semantic Gap Analysis
- Compare competitor content to customer voice
- Find topics customers discuss that no one addresses
- Example: "Everyone talks features, customers want implementation help"

#### Method 5: Predictive Trend Mapping
- Identify emerging signals before mainstream
- 2-4 week lead time on trends
- Example: "Search volume rising 300% for X, no content exists yet"

---

## Part 6: SEO Content Strategy

### 6.1 SERP Intelligence Integration

```typescript
interface SERPInsight {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  currentRankers: string[];
  contentGaps: string[];           // Topics rankers miss
  peopleAlsoAsk: string[];         // PAA questions
  featuredSnippetOpportunity: boolean;
}
```

### 6.2 PAA (People Also Ask) Extraction
- Every content piece addresses 2-3 PAA questions
- Structured for featured snippet capture
- Question → Direct answer → Expanded explanation

### 6.3 Keyword Cluster Mapping
```
Primary Topic: "Business Consulting"
     ↓
Cluster 1: Strategy (strategic planning, business strategy, growth strategy)
Cluster 2: Operations (process improvement, efficiency, workflows)
Cluster 3: Finance (cash flow, profitability, pricing strategy)
     ↓
Content Calendar: Rotate clusters weekly for topical authority
```

### 6.4 Content Gap Analysis
- Analyze top 10 SERP results for target keywords
- Identify sections/topics they ALL miss
- Generate content that fills those gaps

### 6.5 Search Intent Matching
| Intent Type | Content Format | CTA Type |
|-------------|----------------|----------|
| Informational | How-to, Guide, Explainer | Newsletter, Resource |
| Commercial | Comparison, Review, Best-of | Demo, Free Trial |
| Transactional | Landing page, Case study | Buy, Contact |
| Navigational | About, FAQ | Direct link |

---

## Part 7: Business Segment Presets

### 6 Business Categories

#### 1. Local B2B Service (Accounting, Legal, Consulting)
```yaml
api_priority: [outscraper_reviews, google_trends, youtube]
content_mix: {educational: 50%, trust: 30%, promotional: 20%}
primary_platforms: [linkedin, google_business]
key_signals: [local_reviews, competitor_reviews, seasonal_patterns]
seo_focus: local_pack, service_pages
```

#### 2. Local B2C Service (Restaurant, Salon, Fitness)
```yaml
api_priority: [outscraper_reviews, weather_api, google_trends]
content_mix: {engagement: 40%, promotional: 35%, educational: 25%}
primary_platforms: [instagram, facebook, google_business]
key_signals: [review_sentiment, weather_correlation, local_events]
seo_focus: local_pack, gmb_posts
```

#### 3. Regional B2B Agency (Marketing, Design, Development)
```yaml
api_priority: [youtube, reddit, semrush, linkedin]
content_mix: {authority: 45%, educational: 35%, case_study: 20%}
primary_platforms: [linkedin, twitter, blog]
key_signals: [industry_trends, competitor_content, thought_leadership]
seo_focus: long_tail_keywords, pillar_pages
```

#### 4. Regional B2C Retail (E-commerce, Boutique)
```yaml
api_priority: [google_trends, instagram, tiktok, reviews]
content_mix: {promotional: 40%, engagement: 35%, educational: 25%}
primary_platforms: [instagram, tiktok, pinterest]
key_signals: [trend_velocity, seasonal_demand, ugc_patterns]
seo_focus: product_pages, category_optimization
```

#### 5. National SaaS B2B (Software, Platform)
```yaml
api_priority: [reddit, g2_reviews, youtube, semrush, linkedin]
content_mix: {educational: 45%, authority: 30%, case_study: 25%}
primary_platforms: [linkedin, blog, youtube]
key_signals: [feature_requests, competitor_gaps, integration_demand]
seo_focus: comparison_pages, integration_guides, use_cases
```

#### 6. National Product B2C (DTC Brand, Consumer)
```yaml
api_priority: [tiktok, instagram, amazon_reviews, google_trends]
content_mix: {engagement: 35%, ugc: 30%, promotional: 35%}
primary_platforms: [tiktok, instagram, youtube]
key_signals: [viral_trends, influencer_content, review_themes]
seo_focus: product_reviews, best_lists, how_to_use
```

---

## Part 8: Modular API Architecture

### Design Principles

1. **Pluggable**: Add/remove APIs without touching core logic
2. **Weighted**: Each API has configurable importance per segment
3. **Fallback-Ready**: System works with any subset of APIs
4. **Cost-Aware**: Expensive APIs called only when high-value

### API Interface Contract

```typescript
interface ContentAPI {
  id: string;
  name: string;
  category: 'voice' | 'trends' | 'competitive' | 'seo' | 'social';

  // Execution
  fetch(params: APIParams): Promise<RawSignal[]>;
  transform(raw: RawSignal[]): CorrelatedInsight[];

  // Configuration
  priority: number;                    // 1-10, higher = more important
  segmentWeights: Record<Segment, number>;  // Per-segment importance
  costTier: 'free' | 'low' | 'medium' | 'high';
  avgLatency: number;                  // ms

  // Fallback
  fallbackAPIs: string[];              // IDs of backup APIs
  minDataForValue: number;             // Minimum results to be useful
}
```

### API Registry Pattern

```typescript
class APIRegistry {
  private apis: Map<string, ContentAPI> = new Map();

  register(api: ContentAPI): void;
  unregister(id: string): void;

  getForSegment(segment: Segment): ContentAPI[];
  getByCategory(category: string): ContentAPI[];

  // Smart execution
  executeWave(wave: number, segment: Segment): Promise<RawSignal[]>;
  executeWithBudget(maxCost: number): Promise<RawSignal[]>;
}
```

### Adding a New API (Example: BuzzSumo)

```typescript
const buzzsumoAPI: ContentAPI = {
  id: 'buzzsumo',
  name: 'BuzzSumo',
  category: 'social',

  async fetch(params) {
    // Implementation
  },

  transform(raw) {
    return raw.map(item => ({
      insight: item.headline,
      sources: ['buzzsumo'],
      confidence: 0.7,
      dimensions: this.tagDimensions(item)
    }));
  },

  priority: 7,
  segmentWeights: {
    'national_saas_b2b': 0.9,
    'regional_b2b_agency': 0.8,
    'local_b2b_service': 0.3,
    // ...
  },
  costTier: 'medium',
  avgLatency: 2000,
  fallbackAPIs: ['reddit', 'youtube'],
  minDataForValue: 5
};

// Register
apiRegistry.register(buzzsumoAPI);
```

---

## Part 9: API Strategy (Ranked by Value)

### Tier 1: Critical (Must Have) ★★★★★

| API | Purpose | Current Status |
|-----|---------|----------------|
| **YouTube Data API** | Video trends, competitor content, hooks | ✅ Active |
| **OutScraper Reviews** | Customer voice extraction | ✅ Active |
| **Serper (Google Search)** | SERP data, PAA, rankings | ✅ Active |
| **Reddit API** | Community sentiment, pain points | ✅ Active |
| **Google Trends** | Trend velocity, seasonality | ✅ Active |

### Tier 2: High Value (Add Soon) ★★★★☆

| API | Purpose | Impact | Effort |
|-----|---------|--------|--------|
| **SparkToro** | Audience intelligence, where they hang out | HIGH | Medium |
| **BuzzSumo** | Top-performing content, share data | HIGH | Low |
| **Answer the Public** | Question mining, content gaps | HIGH | Low |
| **Clearbit** | Company enrichment, firmographics | HIGH | Medium |

### Tier 3: Medium Value (Add Later) ★★★☆☆

| API | Purpose | Impact | Effort |
|-----|---------|--------|--------|
| **Ahrefs/SEMrush API** | Backlink data, keyword difficulty | MEDIUM | Medium |
| **Twitter/X API** | Real-time sentiment, trending topics | MEDIUM | Medium |
| **TikTok Research API** | Video trends, sounds, hashtags | MEDIUM | High |
| **Seeking Alpha** | Financial/market sentiment (B2B) | MEDIUM | Low |
| **Crunchbase** | Company data, funding, competitors | MEDIUM | Medium |

### Tier 4: Nice to Have ★★☆☆☆

| API | Purpose | Impact | Effort |
|-----|---------|--------|--------|
| **Hunter.io** | Email patterns, decision makers | LOW | Low |
| **BuiltWith** | Tech stack detection | LOW | Low |
| **SimilarWeb** | Traffic estimates, referrers | LOW | Medium |
| **PredictLeads** | Hiring signals, growth indicators | LOW | Medium |

### Tier 5: Experimental ★☆☆☆☆

| API | Purpose | Notes |
|-----|---------|-------|
| **Podcast APIs** | Audio content trends | Limited availability |
| **Patent APIs** | Innovation signals | Niche use cases |
| **Job Board APIs** | Hiring = growth signals | Indirect correlation |

---

## Part 10: Content Quality Ladder

Every piece of content is scored against this ladder:

### Level 5: Category-Defining (Target: 10%)
- Creates new frameworks others adopt
- Cited as reference by industry
- Generates significant earned media
- Example: "The 5 Content Pillars Framework"

### Level 4: Insight-Rich (Target: 30%)
- Contains non-obvious data or angles
- Challenges conventional wisdom with proof
- Highly shareable among peers
- Example: "Why Daily Posting Hurts Your Engagement (Data from 10K accounts)"

### Level 3: Actionable (Target: 40%)
- Clear takeaways readers can implement
- Solves a specific problem
- Good engagement, saves, shares
- Example: "5-Step Process to Audit Your LinkedIn Profile"

### Level 2: Informative (Target: 15%)
- Accurate, well-organized information
- Commodity content, widely available
- Acceptable for consistency
- Example: "What is SEO? A Beginner's Guide"

### Level 1: Filler (Target: 5%)
- Generic, obvious content
- Low engagement, low value
- Only for maintaining presence
- Example: "Happy Monday! What are you working on?"

---

## Part 11: Implementation Phases

### Phase 1: Intelligence Router (2 weeks)
1. Create `IntelligenceRouter` class with signal correlation
2. Implement 12-dimension tagging system
3. Build constraint solver with business rules
4. Add variety enforcement algorithm
5. Wire to existing API outputs

### Phase 2: V4 Integration (1 week)
1. Connect `IntelligenceRouter` to `content-orchestrator.ts`
2. Pipe correlated insights into prompt construction
3. Add source attribution to generated content
4. Implement quality scoring against Content Ladder

### Phase 3: Unique Angle Engine (2 weeks)
1. Implement Contrarian Flip algorithm
2. Build Adjacent Industry matching
3. Add Semantic Gap Analysis
4. Create Predictive Trend Mapping
5. Wire to content suggestions

### Phase 4: SEO Integration (1 week)
1. Add PAA extraction to Serper calls
2. Implement keyword cluster mapping
3. Build content gap analyzer
4. Add search intent classification
5. Wire SEO signals to content prompts

### Phase 5: Segment Presets (1 week)
1. Define 6 business category configurations
2. Implement segment detection from UVP
3. Wire segment to API priorities
4. Customize content mix per segment
5. Test with diverse user profiles

### Phase 6: API Expansion (Ongoing)
1. Add SparkToro integration
2. Add BuzzSumo integration
3. Add Answer the Public
4. Evaluate and add Tier 3 APIs
5. Build usage analytics for API value measurement

---

## Part 12: Success Metrics

### Content Quality
| Metric | Current | Target |
|--------|---------|--------|
| Level 4-5 Content | ~10% | 40% |
| Unique Angles per batch | 0-1 | 3-5 |
| Source attribution | Rare | 100% |
| Dimension diversity | Low | High (all 12) |

### User Value
| Metric | Current | Target |
|--------|---------|--------|
| Time to first insight | 5-10s | <3s |
| "I didn't think of that" reactions | Unknown | Track & grow |
| Content generation quality rating | Good | Excellent |
| Repeat usage rate | Unknown | >80% |

### Technical
| Metric | Current | Target |
|--------|---------|--------|
| API success rate | ~85% | >95% |
| Graceful degradation | Partial | 100% |
| New API integration time | Days | Hours |
| Cost per content batch | Unknown | Track & optimize |

---

## Part 13: The Synapse Moat

### Why Competitors Can't Copy This

1. **Data Correlation Depth**: 13+ APIs correlated through Intelligence Router—not just aggregated, but cross-referenced for non-obvious insights.

2. **Industry Profile Library**: 377 enhanced profiles with research-grounded templates, hooks, and benchmarks. Years of work to replicate.

3. **Constraint Intelligence**: Business rules encoded from content marketing expertise. Not just "generate content" but "generate the RIGHT content for THIS stage, audience, and goal."

4. **Unique Angle Discovery**: Algorithms that surface contrarian takes, adjacent industry patterns, and semantic gaps. This is the "magic" that makes content feel insightful vs. generic.

5. **Segment-Aware Orchestration**: A bakery and a SaaS company get completely different API priorities, content mixes, and platform strategies—automatically.

6. **Source Attribution**: Every insight traced to real data (reviews, trends, discussions). Builds trust and enables validation.

7. **Continuous Learning Loop**: User feedback → Angle effectiveness scoring → Algorithm refinement. Gets smarter with use.

---

## Appendix A: Quick Reference

### API Categories
- **Voice**: OutScraper, Reddit, G2 Reviews, Amazon Reviews
- **Trends**: Google Trends, BuzzSumo, TikTok
- **Competitive**: SEMrush, SimilarWeb, SparkToro
- **SEO**: Serper, Ahrefs, Answer the Public
- **Social**: YouTube, Twitter, LinkedIn, Instagram

### Content Types by Stage
- **TOFU**: Educational, How-to, Myth-busting, Trend commentary
- **MOFU**: Comparison, Case study, ROI calculator, Framework
- **BOFU**: Demo, Free trial, Consultation, Pricing guide

### Emotion-CTA Mapping
- **Fear** → "Protect yourself", "Avoid these mistakes"
- **Aspiration** → "Achieve your goals", "Join the leaders"
- **Curiosity** → "Learn the secret", "Discover why"
- **Frustration** → "Finally, a solution", "Stop struggling"
- **Pride** → "Show off your results", "Be recognized"

---

*Document Version: 1.0*
*Created: 2025-11-30*
*Status: READY FOR IMPLEMENTATION*
