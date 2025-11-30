# Synapse 2.0 Engine Build Plan

**Status**: BUILD READY
**Created**: 2025-11-30
**Updated**: 2025-11-30 (Added embeddings layer + API maximization)
**Branch**: TBD (feature/synapse-2-engine)
**Dependencies**: V4 Content Page, existing API services, Content Correlation Strategies guide

---

## Executive Summary

Build the Intelligence Router that correlates signals from all existing APIs using **semantic embeddings**, implements 12-dimension tagging, enforces content variety, and surfaces correlated opportunities in the right preview panel. Users see synthesized insights instead of raw data, with one-click content generation from discovered opportunities.

**Key Addition**: Embedding-based semantic correlation catches connections that keyword matching misses ("slow response" + "takes forever to hear back" = same pain point).

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           V4 CONTENT PAGE                                │
├────────────────────────────────┬─────────────────────────────────────────┤
│      LEFT: DATA EXPLORER       │       RIGHT: INTELLIGENCE PREVIEW       │
│                                │                                         │
│  [Triggers] [Proof] [Trends]   │   🎯 OPPORTUNITIES (correlated)        │
│  [Competitors] [Local]         │   💡 UNIQUE ANGLES (discovered)        │
│                                │   📊 CONTENT QUEUE (ready to gen)      │
│  Raw signals from APIs         │                                         │
│  Browse, filter, explore       │   ─────────────────────────────         │
│                                │   GENERATED CONTENT (after click)      │
│                                │   + Source attribution                  │
│                                │   + Dimension tags                      │
└────────────────────────────────┴─────────────────────────────────────────┘
                                        ▲
                                        │
                    ┌───────────────────┴───────────────────┐
                    │        INTELLIGENCE ROUTER            │
                    │                                       │
                    │  Signal Correlator → Dimension Tagger │
                    │  Constraint Solver → Variety Engine   │
                    │  Unique Angle Discovery               │
                    └───────────────────┬───────────────────┘
                                        │
        ┌───────────┬───────────┬───────┴───────┬───────────┬───────────┐
        │           │           │               │           │           │
    [YouTube]  [Reviews]   [Reddit]        [Serper]    [Trends]   [News]
        │           │           │               │           │           │
        └───────────┴───────────┴───────┬───────┴───────────┴───────────┘
                                        │
                         15 APIs (ALL MAXIMIZED)
```

---

## CURRENT API STACK (15 APIs) - Full Utilization Plan

### Tier 1: Voice APIs (Customer Language)
| API | Service File | Current Use | NOW ADDING |
|-----|--------------|-------------|------------|
| **OutScraper** | `outscraper-api.ts` | Reviews, sentiment | Q&A mining, photo sentiment, popular times + sentiment correlation |
| **Reddit** | `reddit-apify-api.ts` | Pain points, triggers | Cross-subreddit validation, user karma weighting, award signals |
| **Apify Social** | `apify-social-scraper.service.ts` | Multi-platform triggers | Thread conversations, influencer authority chains, hashtag velocity |
| **G2/Trustpilot** | via Apify | Review extraction | Sentiment timeline (improvement/decline), feature-rating correlation |

### Tier 2: Trend APIs (What's Happening)
| API | Service File | Current Use | NOW ADDING |
|-----|--------------|-------------|------------|
| **YouTube** | `youtube-api.ts` | Trending videos, comments | Transcripts via Whisper, comment sentiment by timestamp, view velocity |
| **Google Trends** | via Serper | Trend velocity | Seasonal patterns, related queries expansion, geo breakdown |
| **News API** | `news-api.ts` | Industry news | Source authority scoring, article sentiment, share count correlation |
| **HackerNews** | `hackernews-api.ts` | Tech trends | Ask HN = real problems, Show HN = early validation, engagement decay |

### Tier 3: Competitive APIs (Market Position)
| API | Service File | Current Use | NOW ADDING |
|-----|--------------|-------------|------------|
| **Serper** | `serper-api.ts` | Web search, PAA | Featured snippet analysis, SERP feature mapping, knowledge panel extraction |
| **SEMrush** | `semrush-api.ts` | Keywords, domain authority | Traffic seasonality, backlink anchor themes, content gap mapping |
| **LinkedIn** | `linkedin-alternative.service.ts` | Company research | Job posting analysis = growth/pivot signals, executive moves |

### Tier 4: Context APIs (Timing & Location)
| API | Service File | Current Use | NOW ADDING |
|-----|--------------|-------------|------------|
| **Weather** | `weather-api.ts` | Conditions, industry mapping | 5-day proactive content triggers, severe weather alerts, seasonal prep |
| **Perplexity** | `perplexity-api.ts` | AI research synthesis | Source citation authority ranking, confidence score extraction |
| **Whisper** | `whisper-api.ts` | Video transcription | Emotion detection per segment, speaker identification, key moment timestamps |

### Tier 5: Performance APIs (NEW - What Actually Works)
| API | Service File | Current Use | NOW ADDING |
|-----|--------------|-------------|------------|
| **BuzzSumo** | `buzzsumo-api.ts` (NEW) | N/A | Top-performing content, share data, headline patterns, format winners, backlink magnets |

---

## BuzzSumo Integration Points

### 1. Trends Panel Enhancement
**Current**: Shows trending topics from news/web without engagement validation
**With BuzzSumo**: Each trend shows real engagement data
```
┌─────────────────────────────────────────────────┐
│ TREND: AI in Small Business                     │
│ 📈 Velocity: Rising fast                        │
│ 🔥 BuzzSumo: 45K shares this week              │  ← NEW
│ 📊 Top performing angle: "How to start"        │  ← NEW
│ [View Top Content] [Generate]                   │
└─────────────────────────────────────────────────┘
```

### 2. Competitor Content Performance (New Section)
**Add to Competitor Intelligence Panel**:
```
┌─────────────────────────────────────────────────┐
│ COMPETITOR: Acme Consulting                     │
│                                                 │
│ TOP PERFORMING CONTENT (Last 30 days)          │
│ ┌─────────────────────────────────────────────┐│
│ │ "5 Signs Your Strategy Is Failing"          ││
│ │ 12.4K shares • 890 comments • LinkedIn      ││
│ │ Angle: Fear-based • Format: List            ││
│ └─────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────┐│
│ │ "The Real Cost of Bad Hiring"               ││
│ │ 8.2K shares • 456 comments • Blog           ││
│ │ Angle: Data-driven • Format: Analysis       ││
│ └─────────────────────────────────────────────┘│
│                                                 │
│ CONTENT THEMES: Strategy (40%), Hiring (25%)   │
│ WEAK SPOTS: No content on pricing, operations  │
└─────────────────────────────────────────────────┘
```

### 3. Dashboard "What's Working Now" Widget
**Add to Dashboard Intelligence Library**:
```
┌─────────────────────────────────────────────────┐
│ 🔥 WHAT'S WORKING NOW (Your Industry)          │
├─────────────────────────────────────────────────┤
│ 1. "Why consultants fail" - 23K shares         │
│ 2. "Hidden costs of DIY" - 18K shares          │
│ 3. "2024 strategy mistakes" - 15K shares       │
│                                                 │
│ TRENDING FORMATS: Lists (42%), How-to (28%)    │
│ TRENDING EMOTIONS: Fear (35%), Curiosity (30%) │
│                                                 │
│ [Generate Similar] [View All Trending]         │
└─────────────────────────────────────────────────┘
```

### 4. Competitor Gaps Validation
**Enhance existing gap cards**:
```
┌─────────────────────────────────────────────────┐
│ GAP: Implementation Support                     │
│                                                 │
│ The Void: Competitors sell strategy, not help  │
│ The Demand: 23 reviews mention "left hanging"  │
│                                                 │
│ 📊 BUZZSUMO VALIDATION:                        │  ← NEW
│ • 0 competitor content on implementation       │
│ • Industry content on this: 12K avg shares     │
│ • Verdict: VALIDATED - High opportunity        │
└─────────────────────────────────────────────────┘
```

---

## Phase 0: Embedding Layer (NEW - Critical Foundation)

**Goal**: Enable semantic matching that catches what keyword matching misses

### 0.1 Embedding Service
**File**: `src/services/intelligence/embedding.service.ts`

**Purpose**: Convert all signals to vector embeddings for semantic clustering

**Implementation**:
```typescript
interface EmbeddedSignal extends RawSignal {
  embedding: number[];  // 1536-dim vector from text-embedding-3-small
  clusterId?: string;   // Assigned after clustering
}

class EmbeddingService {
  // Embed single signal
  async embed(content: string): Promise<number[]>;

  // Batch embed for efficiency (up to 100 at once)
  async embedBatch(contents: string[]): Promise<number[][]>;

  // Calculate similarity between two embeddings
  cosineSimilarity(a: number[], b: number[]): number;

  // Cluster signals by semantic similarity
  clusterSignals(signals: EmbeddedSignal[], threshold: number): SignalCluster[];
}
```

**Clustering Algorithm**:
1. Embed all normalized signals (50-200 per session)
2. Calculate pairwise cosine similarity
3. Group signals with similarity > 0.75 into clusters
4. Each cluster with 2+ different sources = correlated insight

**Why This Matters**:
```
WITHOUT EMBEDDINGS:
  "setup was confusing" + "onboarding took forever" = NO MATCH (no shared keywords)

WITH EMBEDDINGS:
  "setup was confusing"      → [0.82, 0.14, 0.67, ...]
  "onboarding took forever"  → [0.79, 0.18, 0.71, ...]
  Cosine similarity: 0.91    → MATCH (same semantic meaning)
```

### 0.2 Vector Storage
**Option A**: In-memory (faster, session-scoped)
**Option B**: Supabase pgvector (persistent, enables cross-session learning)

**Recommendation**: Start with in-memory, add pgvector for caching frequent patterns.

---

## Phase 1: Intelligence Router Core

**Goal**: Create the brain that correlates signals from existing APIs

### 1.1 Signal Correlator Service
**File**: `src/services/intelligence/signal-correlator.service.ts`

**Purpose**: Takes raw outputs from all APIs and finds meaningful overlaps

**Input**:
```typescript
interface RawSignal {
  source: string;           // 'youtube' | 'reddit' | 'reviews' | etc.
  type: string;             // 'pain_point' | 'trend' | 'competitor_gap' | etc.
  content: string;          // The actual insight text
  metadata: Record<string, any>;  // Source-specific data
  timestamp: Date;
  confidence: number;       // 0-1 based on source reliability
}
```

**Output**:
```typescript
interface CorrelatedInsight {
  id: string;
  title: string;            // "Onboarding Gap"
  description: string;      // Why this matters
  signals: RawSignal[];     // Contributing signals (2+)
  signalCount: number;
  sources: string[];        // ['youtube', 'reviews', 'trends']
  confidence: number;       // Aggregate confidence
  opportunityScore: number; // 0-100, ranked by actionability
  suggestedAngles: string[];
  dimensions: DimensionTags;
}
```

**Correlation Logic**:
1. Semantic similarity matching (same topic across sources)
2. Keyword co-occurrence (same terms in different contexts)
3. Temporal alignment (multiple sources spiking same time)
4. Gap detection (customer wants X + no competitor does X)

### 1.2 Dimension Tagger Service
**File**: `src/services/intelligence/dimension-tagger.service.ts`

**Purpose**: Tags every insight with 12 dimensions for variety enforcement

**The 12 Dimensions**:
```typescript
interface DimensionTags {
  stage: 'TOFU' | 'MOFU' | 'BOFU';
  emotion: 'fear' | 'aspiration' | 'curiosity' | 'frustration' | 'pride';
  format: 'how-to' | 'story' | 'list' | 'comparison' | 'case-study' | 'myth-bust';
  pillar: 'authority' | 'trust' | 'education' | 'engagement' | 'conversion';
  persona: 'decision-maker' | 'influencer' | 'user' | 'budget-holder';
  objection: 'price' | 'time' | 'trust' | 'complexity' | 'none';
  angle: 'contrarian' | 'data-driven' | 'personal' | 'trend-based' | 'standard';
  cta: 'learn' | 'engage' | 'convert' | 'share';
  urgency: 'evergreen' | 'seasonal' | 'breaking';
  confidence: 'high' | 'medium' | 'low';
  position: 'leader' | 'challenger' | 'niche';
  lifecycle: 'prospect' | 'customer' | 'advocate';
}
```

**Tagging Method**: LLM classification with few-shot examples per dimension

### 1.3 Constraint Solver Service
**File**: `src/services/intelligence/constraint-solver.service.ts`

**Purpose**: Enforces business rules to prevent bad combinations

**Constraint Rules**:
```typescript
const constraints = {
  // Stage ↔ CTA
  'TOFU': { allowedCTAs: ['learn', 'engage'], blockedCTAs: ['convert'] },
  'BOFU': { allowedCTAs: ['convert', 'engage'], blockedCTAs: [] },

  // Format ↔ Stage
  'case-study': { allowedStages: ['MOFU', 'BOFU'], blockedStages: ['TOFU'] },
  'how-to': { allowedStages: ['TOFU', 'MOFU'], blockedStages: [] },

  // Emotion ↔ Angle
  'fear': { preferredAngles: ['data-driven', 'standard'], avoidAngles: ['personal'] },
  'aspiration': { preferredAngles: ['story', 'personal'], avoidAngles: [] },

  // Persona ↔ Format
  'decision-maker': { preferredFormats: ['case-study', 'comparison', 'data-driven'] },
  'user': { preferredFormats: ['how-to', 'list', 'tutorial'] },
};
```

### 1.4 Variety Enforcement Engine
**File**: `src/services/intelligence/variety-engine.service.ts`

**Purpose**: Ensures diverse content queue, no clustering on same dimensions

**Algorithm**:
1. Define target mix per segment (e.g., 50% educational, 30% engagement, 20% promotional)
2. Score each insight for dimension diversity against already-selected items
3. Penalize insights that cluster on same dimension values
4. Backfill underrepresented dimensions if needed
5. Return ranked, diverse content queue

**Diversity Score Formula**:
```
diversity_score = base_score - (cluster_penalty * overlap_count)
```

---

## Phase 2: Unique Angle Discovery

**Goal**: Surface "I didn't think of that" insights

### 2.1 Angle Discovery Service
**File**: `src/services/intelligence/angle-discovery.service.ts`

**Methods**:

#### Contrarian Flip
- Find consensus opinion from reviews/Reddit
- Generate supported opposing viewpoint
- Flag with high novelty score

#### Adjacent Industry Transplant
- Match user's industry to related industries in profile library
- Find successful patterns in adjacent industries
- Suggest adaptation to user's context

#### Semantic Gap Analysis
- Compare competitor content topics to customer voice topics
- Identify themes customers discuss that no one addresses
- High opportunity score for unmet needs

#### Hidden Data Correlation
- Combine signals that don't obviously connect
- Weather + sentiment, timing + engagement, news + pain points
- Flag non-obvious but valid correlations

#### Predictive Trend Detection
- Identify signals with rising velocity (not yet mainstream)
- 2-4 week lead time on emerging topics
- Flag as "emerging opportunity"

### 2.2 Angle Scoring
**File**: `src/services/intelligence/angle-scorer.service.ts`

```typescript
interface AngleScore {
  novelty: number;        // How unexpected (0-100)
  relevance: number;      // How aligned to business (0-100)
  actionability: number;  // How easy to create content (0-100)
  confidence: number;     // Data backing (0-100)
  composite: number;      // Weighted average
}
```

---

## Phase 3: Preview Panel Redesign

**Goal**: Transform right panel from static preview to intelligence dashboard

### 3.1 New Preview Panel Component
**File**: `src/components/v4/IntelligencePreviewPanel.tsx`

**States**:

#### Idle State (No Content Generated)
```
┌─────────────────────────────────────────────────┐
│  🎯 TOP OPPORTUNITIES                    [↻]   │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ Onboarding Gap                    92 ⚡  │   │
│  │ 3 signals: Trend ↑40% • Reviews • Gap   │   │
│  │ [Generate]                              │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ Pricing Confusion                 78 ⚡  │   │
│  │ 2 signals: Reddit • Competitor gap      │   │
│  │ [Generate]                              │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ Q1 Planning Season               71 ⚡  │   │
│  │ 2 signals: Trend spike • Weather        │   │
│  │ [Generate]                              │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
├─────────────────────────────────────────────────┤
│  💡 UNIQUE ANGLES                              │
├─────────────────────────────────────────────────┤
│                                                 │
│  ▸ Contrarian: "Daily posting hurts"           │
│    Based on: 10K account analysis              │
│                                                 │
│  ▸ Gap: No one covers implementation           │
│    23 reviews mention, 0 competitor content    │
│                                                 │
│  ▸ Adjacent: SaaS onboarding → your intake     │
│    From: Software industry patterns            │
│                                                 │
├─────────────────────────────────────────────────┤
│  📊 CONTENT QUEUE (12 ready)          [View]   │
│  ████████░░░░ 67% diverse                      │
└─────────────────────────────────────────────────┘
```

#### Loading State
```
┌─────────────────────────────────────────────────┐
│  🔄 Correlating signals...                     │
│                                                 │
│  ✓ YouTube (7 signals)                         │
│  ✓ Reviews (23 signals)                        │
│  ⋯ Reddit (scanning...)                        │
│  ○ Trends (pending)                            │
│  ○ Competitors (pending)                       │
│                                                 │
│  Finding correlations...                       │
└─────────────────────────────────────────────────┘
```

#### Generated State (After Click)
```
┌─────────────────────────────────────────────────┐
│  ← Back to Opportunities                       │
├─────────────────────────────────────────────────┤
│  Generated from: Onboarding Gap                │
│  Sources: YouTube (3) • Reviews (23) • Trends  │
├─────────────────────────────────────────────────┤
│                                                 │
│  HOOK                                          │
│  "Your onboarding is costing you clients.      │
│  Here's what 23 reviews revealed..."           │
│                                                 │
│  BODY                                          │
│  [Generated content with source callouts]      │
│                                                 │
│  CTA                                           │
│  "Comment your biggest onboarding challenge"   │
│                                                 │
│  #onboarding #clientexperience #consulting     │
│                                                 │
├─────────────────────────────────────────────────┤
│  Dimensions: TOFU • Educational • Curiosity    │
│  Quality: Level 4 (Insight-Rich)               │
├─────────────────────────────────────────────────┤
│  [Copy] [Add to Calendar] [Regenerate]         │
└─────────────────────────────────────────────────┘
```

### 3.2 Opportunity Card Component
**File**: `src/components/v4/OpportunityCard.tsx`

**Props**:
```typescript
interface OpportunityCardProps {
  insight: CorrelatedInsight;
  onGenerate: (insight: CorrelatedInsight) => void;
  isGenerating: boolean;
}
```

**Display**:
- Title with opportunity score badge
- Signal count and source icons
- One-click generate button
- Expandable to show contributing signals

### 3.3 Unique Angle Card Component
**File**: `src/components/v4/UniqueAngleCard.tsx`

**Props**:
```typescript
interface UniqueAngleCardProps {
  angle: DiscoveredAngle;
  onUseAngle: (angle: DiscoveredAngle) => void;
}
```

**Display**:
- Angle type badge (Contrarian, Gap, Adjacent, etc.)
- Brief description
- Data backing summary
- Click to inject into generation

### 3.4 Content Queue Drawer
**File**: `src/components/v4/ContentQueueDrawer.tsx`

**Purpose**: Show full list of ready-to-generate content ideas with dimension diversity visualization

**Features**:
- List all correlated insights
- Filter by dimension
- Diversity meter showing coverage
- Bulk generate option

---

## Phase 4: Integration Layer

**Goal**: Connect Intelligence Router to existing systems

### 4.1 API Output Normalizer
**File**: `src/services/intelligence/api-normalizer.service.ts`

**Purpose**: Transform each API's output into standard RawSignal format

**Normalizers needed**:
- `normalizeYouTubeSignals()`
- `normalizeRedditSignals()`
- `normalizeReviewSignals()`
- `normalizeTrendSignals()`
- `normalizeNewsSignals()`
- `normalizeCompetitorSignals()`
- `normalizeWeatherSignals()`
- `normalizeLocalSignals()`

### 4.2 Intelligence Context Provider
**File**: `src/contexts/IntelligenceContext.tsx`

**Purpose**: Make correlated insights available to all components

**State**:
```typescript
interface IntelligenceState {
  rawSignals: RawSignal[];
  correlatedInsights: CorrelatedInsight[];
  uniqueAngles: DiscoveredAngle[];
  contentQueue: QueuedContent[];
  isCorrelating: boolean;
  lastCorrelatedAt: Date | null;
  diversityScore: number;
}
```

**Actions**:
- `correlateSignals()` - Run correlation on current raw signals
- `refreshSignals()` - Re-fetch from APIs and correlate
- `generateFromInsight(insight)` - Create content from specific insight
- `generateFromAngle(angle)` - Create content using specific angle

### 4.3 Content Generation Enhancement
**File**: `src/services/v4/content-orchestrator.ts` (modify existing)

**Changes**:
- Accept `CorrelatedInsight` as input (not just user selections)
- Include source attribution in prompts
- Add dimension tags to output
- Include confidence level in generation context

**New Prompt Structure**:
```
Generate content based on this correlated insight:

INSIGHT: {insight.title}
DESCRIPTION: {insight.description}

SUPPORTING SIGNALS:
- {signal1.source}: "{signal1.content}"
- {signal2.source}: "{signal2.content}"
- {signal3.source}: "{signal3.content}"

CONFIDENCE: {insight.confidence}
SUGGESTED ANGLE: {insight.suggestedAngles[0]}

TARGET DIMENSIONS:
- Stage: {dimensions.stage}
- Emotion: {dimensions.emotion}
- Format: {dimensions.format}

Generate a {platform} post that:
1. References the real data ("Based on X reviews...", "Trending up 40%...")
2. Uses the {dimensions.emotion} emotional driver
3. Follows {dimensions.format} format
4. Ends with {dimensions.cta} CTA
```

---

## Phase 5: Segment-Aware Orchestration

**Goal**: Different behavior based on business type

### 5.1 Segment Detector Service
**File**: `src/services/intelligence/segment-detector.service.ts`

**Purpose**: Classify business into one of 6 segments from UVP data

**Segments**:
1. `local_b2b_service` - Accounting, Legal, Consulting
2. `local_b2c_service` - Restaurant, Salon, Fitness
3. `regional_b2b_agency` - Marketing, Design, Development
4. `regional_b2c_retail` - E-commerce, Boutique
5. `national_saas_b2b` - Software, Platform
6. `national_product_b2c` - DTC Brand, Consumer

**Detection Logic**:
- Industry NAICS code mapping
- Target customer geography
- Business model indicators
- Service vs product classification

### 5.2 Segment Configuration
**File**: `src/config/segment-presets.config.ts`

**Per-Segment Settings**:
```typescript
interface SegmentPreset {
  segment: Segment;
  apiPriorities: Record<string, number>;  // Which APIs matter most
  contentMix: {
    educational: number;
    engagement: number;
    promotional: number;
    authority: number;
  };
  primaryPlatforms: string[];
  correlationWeights: {
    reviews: number;
    trends: number;
    competitors: number;
    social: number;
  };
  seoFocus: string[];
}
```

### 5.3 Segment-Aware Correlation
Modify Signal Correlator to weight signals based on segment:
- Local B2C: Reviews weighted 2x, weather weighted 1.5x
- National SaaS: Reddit weighted 2x, competitor gaps weighted 1.5x
- etc.

---

## Phase 6: SEO Integration

**Goal**: Bake search intelligence into every insight

### 6.1 PAA Extractor Enhancement
**File**: `src/services/intelligence/paa-extractor.service.ts`

**Purpose**: Extract People Also Ask questions from Serper results

**Output**:
```typescript
interface PAAInsight {
  question: string;
  searchVolume: number;
  difficulty: number;
  currentlyRanking: boolean;
  featuredSnippetOpportunity: boolean;
}
```

### 6.2 Keyword Cluster Service
**File**: `src/services/intelligence/keyword-cluster.service.ts`

**Purpose**: Group related keywords for topical authority

**Output**:
```typescript
interface KeywordCluster {
  primary: string;
  related: string[];
  totalVolume: number;
  avgDifficulty: number;
  contentGaps: string[];
}
```

### 6.3 SEO Signal Integration
Add SEO signals to correlation:
- Rising search volume = trend signal
- PAA without answer = gap signal
- Competitor ranking + low quality = opportunity signal

---

## Phase 7: Quality Assurance

### 7.1 Content Quality Scorer
**File**: `src/services/intelligence/quality-scorer.service.ts`

**Quality Ladder Scoring**:
- Level 5: Category-Defining (90-100)
- Level 4: Insight-Rich (70-89)
- Level 3: Actionable (50-69)
- Level 2: Informative (30-49)
- Level 1: Filler (0-29)

**Scoring Factors**:
- Source count and confidence
- Angle novelty
- Data specificity
- Actionability
- Uniqueness vs existing content

### 7.2 Diversity Validator
**File**: `src/services/intelligence/diversity-validator.service.ts`

**Purpose**: Ensure content queue has good dimension spread

**Validation**:
- No more than 40% on any single dimension value
- All 12 dimensions represented
- Stage distribution matches target mix
- Flag low-diversity queues for backfill

---

## Implementation Phases

### Phase 1: Core Intelligence Router (Week 1)
1. Signal Correlator service
2. Dimension Tagger service
3. API Output Normalizers (all existing APIs)
4. Intelligence Context Provider

**Deliverable**: Correlated insights generated from existing API data

### Phase 2: Preview Panel Redesign (Week 1-2)
1. IntelligencePreviewPanel component
2. OpportunityCard component
3. UniqueAngleCard component
4. Loading and generated states
5. Wire to Intelligence Context

**Deliverable**: Right panel shows opportunities instead of empty state

### Phase 3: Unique Angle Discovery (Week 2)
1. Angle Discovery service (all 5 methods)
2. Angle Scorer service
3. Integration with preview panel

**Deliverable**: Unique angles surfaced in preview panel

### Phase 4: Constraint & Variety (Week 2-3)
1. Constraint Solver service
2. Variety Enforcement engine
3. Content Queue Drawer
4. Diversity visualization

**Deliverable**: Diverse content queue with constraint validation

### Phase 5: Segment Awareness (Week 3)
1. Segment Detector service
2. Segment Configuration presets
3. Segment-aware correlation weights
4. Segment-aware content mix

**Deliverable**: Different experience per business type

### Phase 6: SEO Integration (Week 3-4)
1. PAA Extractor enhancement
2. Keyword Cluster service
3. SEO signals in correlation
4. Search intent classification

**Deliverable**: SEO intelligence baked into opportunities

### Phase 7: Quality & Polish (Week 4)
1. Content Quality Scorer
2. Diversity Validator
3. Source attribution in generated content
4. Quality level badges
5. Testing and refinement

**Deliverable**: Production-ready Intelligence Router

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/services/intelligence/embedding.service.ts` | Vector embeddings + semantic clustering |
| `src/services/intelligence/buzzsumo-api.ts` | Content performance data + headline patterns |
| `src/services/intelligence/signal-correlator.service.ts` | Core correlation logic (uses embeddings) |
| `src/services/intelligence/dimension-tagger.service.ts` | 12-dimension tagging |
| `src/services/intelligence/constraint-solver.service.ts` | Business rule enforcement |
| `src/services/intelligence/variety-engine.service.ts` | Diversity enforcement |
| `src/services/intelligence/angle-discovery.service.ts` | Unique angle methods |
| `src/services/intelligence/angle-scorer.service.ts` | Angle quality scoring |
| `src/services/intelligence/api-normalizer.service.ts` | Standardize API outputs |
| `src/services/intelligence/segment-detector.service.ts` | Business classification |
| `src/services/intelligence/quality-scorer.service.ts` | Content quality ladder |
| `src/services/intelligence/diversity-validator.service.ts` | Queue diversity check |
| `src/services/intelligence/paa-extractor.service.ts` | PAA question mining |
| `src/services/intelligence/keyword-cluster.service.ts` | Keyword grouping |
| `src/contexts/IntelligenceContext.tsx` | State management |
| `src/components/v4/IntelligencePreviewPanel.tsx` | New right panel |
| `src/components/v4/OpportunityCard.tsx` | Opportunity display |
| `src/components/v4/UniqueAngleCard.tsx` | Angle display |
| `src/components/v4/ContentQueueDrawer.tsx` | Full queue view |
| `src/config/segment-presets.config.ts` | Segment configurations |
| `src/types/intelligence.types.ts` | All new types |

## Files to Modify

| File | Changes |
|------|---------|
| `src/services/v4/content-orchestrator.ts` | Accept CorrelatedInsight, add attribution |
| `src/pages/V4ContentPage.tsx` | Integrate IntelligencePreviewPanel |
| `src/components/v4/V4PowerModePanel.tsx` | Wire to Intelligence Context |

---

## Success Criteria

### Technical
- [ ] All existing APIs normalized to RawSignal format
- [ ] Correlation finds 3-5 opportunities from typical data set
- [ ] Dimension tagging accuracy >85%
- [ ] Constraint solver prevents invalid combinations
- [ ] Variety engine maintains target mix ±10%

### User Experience
- [ ] Right panel shows opportunities within 3 seconds of data load
- [ ] One-click generation from any opportunity
- [ ] Source attribution visible in all generated content
- [ ] Diversity meter shows queue coverage
- [ ] Quality level badge on generated content

### Content Quality
- [ ] 40%+ of generated content scores Level 4-5
- [ ] Unique angles surface in 80%+ of sessions
- [ ] No duplicate dimension clusters in content queue
- [ ] SEO signals present in 60%+ of opportunities

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Correlation too slow | Cache intermediate results, progressive loading |
| Poor angle quality | Human review of angle templates, confidence thresholds |
| Segment misclassification | Manual override option, fuzzy matching |
| Dimension tagging errors | Few-shot examples, validation layer |
| API failures | Graceful degradation, minimum signal thresholds |
| Embedding costs | Batch embedding, cache frequent patterns |

---

## API Maximization Strategies

### High-Impact Quick Wins (Implement First)

**1. Cross-Platform Pain Point Validation**
- Same insight from Reddit + YouTube + Reviews + G2 = high confidence
- Signal strength multiplier: 1 source = 1x, 2 sources = 2.5x, 3+ sources = 4x
- Implementation: Part of embedding clustering

**2. Weather-Triggered Proactive Content**
- Use 5-day forecast to suggest content 3-7 days ahead
- "Cold front coming Friday → furnace maintenance content by Wednesday"
- Implementation: Extend weather-api.ts to emit future signals

**3. PAA → Reddit Validation Loop**
- Serper returns "People Also Ask" questions
- Check if same questions appear in Reddit discussions
- If yes = validated curiosity, high-value content opportunity
- Implementation: Cross-reference in Signal Correlator

**4. Sentiment Timeline Analysis**
- Track review sentiment over 6-12 months per competitor
- Declining sentiment = weakness to exploit
- Improving sentiment = threat to monitor
- Implementation: Extend OutScraper normalization

### Medium-Effort High-Value

**5. YouTube Transcript Mining**
- Whisper transcribe top videos in industry
- Extract exact phrases customers use
- Map to pain points for authentic language
- Implementation: New transcript-miner.service.ts

**6. Job Posting Analysis**
- LinkedIn job posts = company priorities
- "Hiring 5 SDRs" = growth mode, content angle: scaling
- "Hiring Head of Customer Success" = churn problem, content angle: retention
- Implementation: Extend linkedin-alternative.service.ts

**7. HackerNews Problem Mining**
- "Ask HN" posts = real unfiltered problems
- High engagement = validated pain point
- Cross-reference with industry for relevance
- Implementation: Extend hackernews-api.ts normalizer

### Future Enhancements

**8. Influencer Authority Mapping**
- Track who gets engagement in each platform
- Weight signals from high-authority users
- Implementation: Add author scoring to social normalizers

**9. Content Decay Detection**
- Track when competitor content was last updated
- Stale content = opportunity to provide fresher take
- Implementation: Add timestamps to competitive signals

**10. Geographic Signal Clustering**
- Different regions have different pain points
- Enable geo-targeted content suggestions
- Implementation: Add geo dimension to all signals

---

## Signal Strength Matrix

Every signal is scored (1-10) based on:

| Factor | Weight | Scoring |
|--------|--------|---------|
| **Source Tier** | 30% | Verified customer = 10, Reddit = 7, News = 5 |
| **Recency** | 25% | <7 days = 10, 30 days = 5, 90+ days = 2 |
| **Engagement** | 25% | 50+ interactions = 10, 10+ = 7, <10 = 4 |
| **Cross-Platform** | 20% | 3+ platforms = 10, 2 = 7, 1 = 4 |

**Opportunity Threshold**: Combined score > 7.0 = surface as opportunity

---

*Document Version: 2.0*
*Created: 2025-11-30*
*Updated: 2025-11-30 (Embeddings + API Maximization)*
*Status: BUILD READY*
