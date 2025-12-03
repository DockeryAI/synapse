# Synapse V6 Build Plan

## Executive Summary

Archive V5 engine, restore V1 from MARBA, implement UVP-driven brand profiles, add 19-API data layer with embedding-based connection discovery. Tabs become INPUT sources, not OUTPUT categories.

---

## Phase 1: Archive & Codebase Setup

### Phase 1A: Archive V5 Engine (1-2 hours)

**Actions:**
- Move `src/services/triggers/` → `src/services/_archived_v5/triggers/`
- Move `src/services/proof/` → `src/services/_archived_v5/proof/`
- Move `src/hooks/useStreamingTriggers.ts` → `src/services/_archived_v5/`
- Move `src/hooks/useStreamingProof.ts` → `src/services/_archived_v5/`
- Keep V5 UI components (InsightTabs, TriggerCardV4, etc.) - will rewire

**Risk:** LOW - just moving files, UI untouched

### Phase 1B: Copy V1 Engine from MARBA (2-3 hours)

**Actions:**
- Copy `~/Projects/MARBA/src/services/synapse/` → `src/services/synapse-v6/`
- Files to copy:
  - `SynapseGenerator.ts` - main orchestrator
  - `helpers/ConnectionHintGenerator.ts` - embeddings + unexpectedness
  - `helpers/CostEquivalenceCalculator.ts` - behavioral economics
  - `analysis/ContrarianAngleDetector.ts` - differentiation angles
  - `generation/ContentPsychologyEngine.ts` - 9 psychology principles
  - `generation/PowerWordOptimizer.ts` - weak word replacement
  - `generation/HumorOptimizer.ts` - edginess scale
  - `generation/formatters/` - HookPost, DataPost, StoryPost, etc.
- Update import paths for new location
- Verify OpenAI embeddings integration works

**Risk:** MEDIUM - imports may need adjustment

### Phase 1C: Copy UI Components (1 hour)

**Actions:**
- Copy from `~/Projects/ui-libraries/` to `src/components/ui/`:
  - `aceternity/spotlight.tsx` - card hover effects
  - `magic-ui/border-beam.tsx` - selected card borders
  - `magic-ui/animated-beam.tsx` - connection visualization
  - `magic-ui/shimmer-button.tsx` - generation CTAs
  - `aceternity/sparkles.tsx` - high-breakthrough indicators

**Risk:** LOW - additive only

---

## Phase 2: New Profile System (UVP-Driven)

### Phase 2A: Remove Industry Dropdown (2-3 hours)

**Actions:**
- Onboarding page 1: URL only (no industry selection)
- Silent auto-match against 385 NAICS profiles
- Confidence threshold ≥0.7 = auto-accept
- Below threshold = show optional confirmation UI
- Never block user flow for industry selection

**Risk:** LOW - simplifies UX

### Phase 2B: Create brand_profiles Table (2-3 hours)

**Actions:**
- Create new `brand_profiles` table (keep `industry_profiles` untouched)
- Schema:
  ```sql
  brand_id (FK to brands)
  profile_hash (dedup key)
  uvp_data (full CompleteUVP JSON)
  industry_match (optional NAICS reference)
  profile_type (6 types: local-b2c, local-b2b, regional-agency, regional-retail, national-saas, national-product)
  enabled_tabs (which tabs apply to this profile type)
  api_priorities (ordered list per tab)
  ```
- DO NOT delete or modify `industry_profiles` table

**Risk:** LOW - additive schema change

### Phase 2C: UVP Context Injection (3-4 hours)

**Actions:**
- Every API query includes UVP context:
  - Target customer description
  - Key benefit/transformation
  - Differentiators
  - Pain points from customer profiles
- UVP customizes queries, does NOT filter results
- All 6 tabs receive UVP-contextualized queries

**Risk:** MEDIUM - touches all API calls

### Phase 2D: Industry Profiles as Boosters Only (1-2 hours)

**Actions:**
- 385 NAICS profiles become optional content enrichment
- Add headline_templates, hook_library, power_words from matched industry
- Never required - works with or without match
- Specialty businesses (no match) use pure UVP-derived content

**Risk:** LOW - optional enhancement

---

## Phase 3: API Stack & Tab Mapping

### API Orchestrator (4-6 hours)

**19 Verified APIs:**

| API | Data Sources | Edge Function |
|-----|--------------|---------------|
| Serper | Google Search, Places, News, LinkedIn, Quora | fetch-serper |
| Perplexity | Web research with citations | perplexity-proxy |
| Apify | YouTube, Twitter, Reddit, TikTok, Instagram, LinkedIn, Google Maps, Yelp, Facebook | apify-scraper |
| OutScraper | Google Maps, Yelp, Business Reviews | fetch-outscraper |
| SEMrush | Keywords, Domain analytics, Competitors | fetch-seo-metrics |
| OpenWeather | Weather + 20 industry triggers | fetch-weather |
| NewsAPI | 40,000+ news sources | fetch-news |
| YouTube API | Videos, Comments, Trends | fetch-youtube |
| Reddit API | Subreddit posts, Comments | reddit-oauth |
| HackerNews | Tech discussions | Algolia (free) |
| SEC EDGAR | Company filings | sec-edgar-proxy |
| Meta Ad Library | Facebook/Instagram ads | Direct API |
| OpenRouter | Claude, GPT-4, Gemini, Llama | ai-proxy |
| OpenAI | Embeddings (text-embedding-3-small) | Direct |

**Risk:** MEDIUM - complex routing logic

---

## Phase 4: Tab Configuration

### 6 Tabs (Same UI, Different Data)

| Tab | Purpose | B2C Local APIs | B2B SaaS APIs |
|-----|---------|----------------|---------------|
| Voice of Customer | Direct customer language | OutScraper (Google/Yelp), Apify (Facebook) | Apify (G2, Capterra), Reddit, HackerNews |
| Community | Organic conversations | Apify (Facebook, Nextdoor), Reddit | Reddit, HackerNews, Apify (Twitter) |
| Competitive | Competitor positioning | SEMrush, Meta Ad Library | SEMrush, Meta Ad Library |
| Industry Trends | Emerging patterns | NewsAPI (local), OpenWeather | NewsAPI (tech), HackerNews, Perplexity |
| Search Intent | What prospects search for | SEMrush, Serper (autocomplete) | SEMrush, Serper (autocomplete) |
| Local/Timing | Weather, events, seasons | OpenWeather, Serper (events) | NewsAPI (funding), SEC EDGAR |

**UI Changes:** Tab titles only - structure/cards/layout UNCHANGED

**Competition Tab:** NO CHANGES - keep exactly as V5

**Risk:** LOW - data changes only

---

## Phase 5: Port Connection Engine (3-4 hours)

### V1 Core Mechanics (Preserved Exactly)

1. **Embedding Generation:** OpenAI text-embedding-3-small (1536 dims)
2. **Cosine Similarity:** Threshold ≥0.65 for connections
3. **Unexpectedness Scoring:**
   - Same domain (review↔review): 30-50%
   - Adjacent domain (review↔trend): 50-80%
   - Cross-domain (review↔weather): 80-100%
4. **Three-Way Bonus:** +40% when connecting 3+ insights
5. **Breakthrough Score:** 0-100 based on novelty + relevance

### Connection Scorer Weights
- Semantic Similarity: 30%
- Unexpectedness: 25%
- Psychology relevance: 15%
- Competitive advantage: 15%
- Timeliness: 10%
- Three-way bonus: +40%

**Risk:** MEDIUM - core engine port

---

## Phase 6: Port Content Pipeline (4-6 hours)

### V1 Generators to Port

1. **Cost Equivalence Calculator**
   - B2C: 28 items (lattes, Netflix, gym)
   - B2B: New additions (dev salary, bad hire cost, churn impact)

2. **Content Psychology Engine** (9 principles)
   - Curiosity Gap, Narrative Transportation, Social Proof + Authority
   - Cognitive Dissonance, Pattern Interrupt, Scarcity
   - Reciprocity, Commitment/Consistency, Loss Aversion

3. **Format Generators**
   - HookPost, DataPost, StoryPost, ControversialPost
   - Email, Blog, LandingPage

4. **Power Word Optimizer** - weak word replacement
5. **Humor Optimizer** - edginess scale 0-100
6. **Contrarian Angle Detector** - differentiation angles

**Risk:** MEDIUM - multiple file ports

---

## Phase 7: UI Integration (2-3 hours)

### Subtle Enhancements Only

From ui-libraries:
- SpotlightCard: Mouse-following highlight on hover
- BorderBeam: Animated border on selected cards
- AnimatedBeam: SVG beams connecting insights in preview
- ShimmerButton: Shimmer on "Generate" CTAs
- Sparkles: Subtle effect on high-breakthrough connections

### UNCHANGED (Critical)
- Overall layout (left sidebar, center tabs, right preview)
- Card structure (title, quote, expandable summary + provenance)
- Color scheme and typography
- Tab navigation mechanics
- Competition tab - completely unchanged
- UVP sidebar - all same data points

**Risk:** LOW - additive visual polish

---

## Phase 8: E2E Testing (3-4 hours)

### Test All 6 Profile Types

1. B2C Local (plumber, restaurant)
2. B2B SaaS (OpenDialog.ai style)
3. B2B Agency (marketing agency)
4. B2C National (e-commerce)
5. Regional Retail (multi-location)
6. Global Enterprise (Fortune 500)

### Success Criteria
- ✅ 90%+ trigger relevance to UVP
- ✅ Zero "unknown source" triggers
- ✅ 6/6 tabs using UVP context
- ✅ All insights have valid provenance
- ✅ Embeddings + cosine similarity working
- ✅ Three-way connection bonus functional
- ✅ Cost equivalence generating hooks

**Risk:** MEDIUM - integration issues possible

---

## Phase 9: Cleanup (2-3 hours)

**Actions:**
- Remove dead imports pointing to archived V5
- Fix any TypeScript errors
- Update documentation
- Verify no regressions in existing features

**Risk:** LOW - housekeeping

---

## Data Flow Architecture

```
USER INPUT (URL only)
        │
        ▼
UVP EXTRACTION (same as V5)
        │
        ▼
BRAND PROFILE CREATION
├── Profile type detection (from UVP fields)
├── Silent industry auto-match (optional)
├── Store in brand_profiles table
└── Determine enabled_tabs + api_priorities
        │
        ▼
PARALLEL API CALLS (6 tabs)
├── VoC: Reviews, testimonials
├── Community: Reddit, forums, social
├── Competitive: SEMrush, Meta Ads (UNCHANGED)
├── Trends: News, weather, market shifts
├── Search: Keywords, PAA, autocomplete
└── Local/Timing: Weather, events, seasons
        │
        ▼
INSIGHT EXTRACTION
├── Claude processes raw data → structured insights
├── Each insight gets OpenAI embedding (1536 dims)
└── Insights tagged with tab source + confidence
        │
        ▼
TAB DISPLAY (UI UNCHANGED)
├── Cards: Title | Source Quote | Expandable Summary
├── User selects 2-5 insights across any tabs
└── No filtering - all data visible
        │
        ▼
CONNECTION ENGINE (V1)
├── Cosine similarity ≥0.65
├── Unexpectedness scoring (cross-domain = highest)
├── Three-way connection bonus (+40%)
├── Breakthrough score 0-100
└── Suggests combinations, user accepts/rejects
        │
        ▼
CONTENT GENERATION (V1 Pipeline)
├── Cost Equivalence → relatable hooks
├── Contrarian Angle → differentiation
├── Psychology Engine → 9 principles
├── Format Generator → best format match
├── Power Word Optimizer → impact words
└── Humor Optimizer → edginess 0-100
        │
        ▼
PREVIEW PANEL
├── Generated content with connection beams
├── Edit/regenerate/export
└── Provenance tracking
```

---

## What V6 Avoids (V5 Mistakes)

- ❌ No emotional keyword filtering
- ❌ No 4 separate LLM passes by emotion
- ❌ No "reject if not emotional" logic
- ❌ Tabs are not OUTPUT categories
- ❌ No embeddings bypass

## V1 Integration Chain (Preserved)

```
Cross-domain embeddings → Unexpectedness scoring → Cost equivalences →
Contrarian angles → Psychology principles → Power words → Humor →
Format selection → Provenance tracking
```

---

## Estimated Timeline

| Phase | Task | Estimate |
|-------|------|----------|
| 1A | Archive V5 engine | 1-2 hrs |
| 1B | Copy V1 from MARBA | 2-3 hrs |
| 1C | Copy UI components | 1 hr |
| 2A | Remove industry dropdown | 2-3 hrs |
| 2B | Create brand_profiles table | 2-3 hrs |
| 2C | UVP context injection | 3-4 hrs |
| 2D | Industry profiles as boosters | 1-2 hrs |
| 3 | API orchestrator | 4-6 hrs |
| 4 | Wire 6 tabs to API layer | 6-8 hrs |
| 5 | Port Connection Engine | 3-4 hrs |
| 6 | Port Content Pipeline | 4-6 hrs |
| 7 | UI integration | 2-3 hrs |
| 8 | E2E testing | 3-4 hrs |
| 9 | Cleanup | 2-3 hrs |
| 10 | VoC Tab Enhancement | 60-80 hrs |
| **TOTAL** | | **96-132 hrs** |

---

## Critical Constraints

1. **DO NOT** change UI look/feel/structure
2. **DO NOT** delete industry_profiles table
3. **DO NOT** modify Competition tab
4. **DO NOT** change UVP sidebar data points
5. **DO** preserve exact V1 engine logic
6. **DO** keep all 19 APIs available
7. **DO** maintain provenance tracking

---

## Phase 10: VoC Tab Enhancement (8-10 days)

### Overview
Restore VoC tab to 100% V6 build plan compliance and enhance with SEMrush/BuzzSumo intelligence for complete customer intelligence.

### Phase 10A: V6 Build Plan Compliance (3-4 days)

**Day 1: UVP Context Injection (6-8 hours)**
- Target customer integration into VoC queries
- Pain point context from UVP profiles
- Industry-specific VoC source selection
- Geographic context for local VoC sources

**Day 2: V1 Connection Engine Integration (6-8 hours)**
- OpenAI embeddings (1536-dim) for VoC insights
- Cosine similarity ≥0.65 threshold connections
- Cross-domain signals (VoC + weather/trends/events)
- Three-way connection bonus scoring

**Day 3: Customer Profile Flow (6-8 hours)**
- UVP customer personas → VoC source priorities
- Customer language adaptation in queries
- Journey stage context for API selection
- B2B vs B2C customer type routing

**Day 4: Data Source Enhancement (6-8 hours)**
- Fix Reddit actor configuration (perchance/reddit-scraper)
- Debug G2/Capterra empty response issues
- Verify Twitter noResults filtering
- Enhance Apify review sentiment mining

### Phase 10B: SEMrush VoC Enhancement (2 days)

**Day 1: Search Intent Intelligence (6-8 hours)**
- Keyword research for real customer language
- Search intent analysis (navigational/informational/transactional)
- "People also ask" question mining
- Geographic search variation analysis

**Day 2: Competitive Customer Intelligence (6-8 hours)**
- Competitor keyword gaps analysis
- Customer journey search progression mapping
- Seasonal customer search pattern analysis
- Local vs national customer need variations

### Phase 10C: BuzzSumo VoC Enhancement (2 days)

**Day 1: Social Conversation Mining (6-8 hours)**
- Social listening for brand/industry keywords
- Viral customer pain point identification
- Solution research conversation tracking
- Influencer customer insight analysis

**Day 2: Content Engagement Analysis (6-8 hours)**
- Customer problem content performance analysis
- Engagement pattern timing optimization
- Share trigger psychology analysis
- Viral customer story identification

### Phase 10D: V1 Cross-Domain Connections (1-2 days)

**Day 1: VoC Connection Discovery (6-8 hours)**
- VoC + weather/seasonal behavior connections
- VoC + local events impact analysis
- VoC + industry trend correlation
- Social vs search behavior pattern mapping

**Day 2: Enhanced Insight Generation (4-6 hours)**
- V1 psychology principle integration
- Cost equivalence customer problem framing
- Contrarian angle customer insight detection
- Breakthrough connection scoring

### Phase 10E: Integration Testing (1 day)

**VoC Tab Validation (6-8 hours)**
- UVP context flow verification
- SEMrush search intelligence testing
- BuzzSumo social conversation validation
- Cross-domain connection quality testing
- API response data quality assurance

### Success Metrics
- ✅ 90%+ VoC relevance to UVP customer profiles
- ✅ Zero empty API responses (all sources working)
- ✅ 5+ cross-domain connections per analysis
- ✅ Real customer language integration
- ✅ Search + social intelligence combined
- ✅ Sub-10s generation time maintained

**Estimated Total: 60-80 hours (8-10 days)**

---

## Phase 11: Query Builder Fix (CRITICAL)

### Problem Identified (2025-12-03)

The `buildTabQuery()` function sends full UVP statements (2000+ chars) to APIs that expect short keywords:
- Serper: max 2048 chars
- Weather: expects city name only
- SEMrush: expects domain name only

Result: All V6 API calls fail with "Query too long" or "city not found".

### Fix: Smart Query Extraction

**File 1: `uvp-context-builder.service.ts`**

Add `extractShortQuery()` function:
- Extract 3-5 keywords from UVP (industry, role, core benefit)
- Max 100 characters for search APIs
- Keep `fullContext` for LLM prompt injection only

**File 2: `api-orchestrator.service.ts`**

Use API-specific query formats:
- **Weather**: Use brand location from `marba_uvps.target_customer.marketGeography` or brand.location
- **Serper/Reddit**: Use `shortQuery` (3-5 keywords)
- **SEMrush**: Use competitor domain or brand website
- **Apify scrapers**: Use industry + customer role keywords
- **LLM calls**: Use `fullContext` for prompt enrichment

### Example Correct Queries

| API | Current (BROKEN) | Fixed |
|-----|------------------|-------|
| Weather | "Insurance broker/agency owner seeking to..." (2000 chars) | "San Francisco" |
| Serper | Full UVP statement | "insurance agency AI sales automation" |
| Reddit | Full UVP statement | "independent insurance agent technology" |
| SEMrush | Full UVP statement | "opendialog.ai" |

### Implementation Steps

1. Add `extractShortQuery(uvp, tab)` to uvp-context-builder.service.ts
2. Add `extractLocation(uvp, brand)` for weather/local APIs
3. Update api-orchestrator to use appropriate query type per API
4. Add query length validation (fail fast if > 500 chars for search APIs)

**Risk:** MEDIUM - touches all API calls but logic is straightforward

---

## Phase 11: V6 DRIFT CORRECTION (CRITICAL - 2025-12-03)

### Problem Identified

Phase 1B was never executed. V1 engine from MARBA was never copied. We kept patching V5 instead of replacing it, causing:

1. **V5 emotion pipeline still active** - `insightsToConsolidatedTriggers()` runs emotion categorization
2. **No V1 core components** - ConnectionHintGenerator, CostEquivalenceCalculator, ContentPsychologyEngine missing
3. **No embeddings** - Cosine similarity, unexpectedness scoring never implemented
4. **Tabs as outputs** - Still treating tabs as emotion OUTPUT categories, not INPUT sources

### What Exists in Current synapse-v6/

- api-orchestrator.service.ts (data fetching - KEEP)
- tab-data-adapter.service.ts (API → Insight conversion - KEEP)
- uvp-context-builder.service.ts (query building - KEEP)
- brand-profile.service.ts (profile types - KEEP)
- industry-booster.service.ts (NAICS matching - KEEP)

### What's Missing (Must Port from MARBA)

| File | Purpose |
|------|---------|
| ConnectionHintGenerator.ts | Embeddings + unexpectedness scoring |
| CostEquivalenceCalculator.ts | Behavioral economics hooks |
| ContentPsychologyEngine.ts | 9 psychology principles |
| ContrarianAngleDetector.ts | Differentiation angles |
| PowerWordOptimizer.ts | Weak word replacement |
| HumorOptimizer.ts | Edginess scale 0-100 |
| formatters/* | HookPost, DataPost, StoryPost, etc. |

### What Must Be Removed from UI

| File | Remove |
|------|--------|
| InsightTabs.tsx | `insightsToConsolidatedTriggers()` function |
| trigger-consolidation.service.ts | Emotion categorization logic |
| TriggerCardV4.tsx | Emotion category configs (keep source configs) |
| InsightCards.tsx | TriggerCategory emotion types |

### Corrected Build Sequence

**Phase 11A: Archive Current Drift (1 hr)**
- Move current `synapse-v6/` → `_archived_v6_drift/`
- Keep: api-orchestrator, tab-data-adapter, uvp-context-builder, brand-profile, industry-booster

**Phase 11B: Port V1 Engine from MARBA (3-4 hrs)**
- Copy `~/Projects/MARBA/src/services/synapse/helpers/` → `synapse-v6/connection-engine/`
- Copy `~/Projects/MARBA/src/services/synapse/generation/` → `synapse-v6/content-generation/`
- Copy `~/Projects/MARBA/src/services/synapse/analysis/` → `synapse-v6/analysis/`
- Update imports for new location
- Verify OpenAI embeddings work

**Phase 11C: Remove V5 Emotion Pipeline (2 hrs)**
- Delete `insightsToConsolidatedTriggers()` from InsightTabs.tsx
- Remove emotion types from TriggerCategory (keep source types only)
- Cards show SOURCE badge, not EMOTION badge
- Remove emotion category configs from TriggerCardV4.tsx

**Phase 11D: Wire Connection Engine (3-4 hrs)**
- Generate embeddings for each insight on load
- Add "Find Connections" button
- When user selects insights, run cosine similarity
- Show breakthrough score and suggested connections

**Phase 11E: Wire Content Generators (2-3 hrs)**
- Connect selected insights → CostEquivalenceCalculator
- Connect → ContentPsychologyEngine
- Connect → PowerWordOptimizer
- Connect → Format generators
- Output to preview panel

### Phase 11 Status: COMPLETE ✅ (2025-12-03)

- [x] **11A:** Archive drift code
- [x] **11B:** Port V1 engine (verified - already existed)
- [x] **11C:** Remove V5 emotion pipeline from UI (insightsToConsolidatedTriggers removed)
- [x] **11D:** Wire Connection Engine (embeddings, cosine similarity, unexpectedness, 3-way detection)
- [x] **11E:** Wire Content Generators (formats, psychology, cost equivalence)
- [x] **11F:** Fix buyer personas (sidebar now shows 10 profiles from database)

### Success Criteria (Phase 11)

- ✅ V1 engine files exist in synapse-v6/
- ✅ No emotion categorization in display layer
- ✅ Embeddings generated for insights
- ✅ Cross-domain connections scored by unexpectedness
- ✅ Three-way connection bonus (+40%) working
- ✅ Content generation uses all V1 pipeline stages

---

## Phase 12: Content Generation Drift Fix (PLANNED)

**Created:** 2025-12-03
**Status:** PLANNED
**Why:** Post-Phase 11 audit revealed V6 is ~65% aligned. Connection discovery (physics) is V1-correct, but content generation (chemistry) still uses V5 emotion labels instead of V1 psychology principles.

### Root Cause Analysis

**What's V1-correct:**
- Tab architecture = INPUT sources (VoC, Community, Competitive, Trends, Search, Local/Timing) ✅
- Connection Engine = Embeddings + cosine similarity + unexpectedness ✅
- Cross-domain priority = Weather + review = breakthrough ✅
- Cost Equivalence Calculator = Working ✅

**What's still drifted:**
- `ContentPsychologyEngine.ts:201-211` maps to emotions (fear, belonging) not V1 principles
- `synapse-core.service.ts:100-105` has fear/desire pattern detection
- `EmailGenerator.ts:65` hardcodes `type: 'fear'`
- Format selection ignores connection type
- Three-way connections detected but not differentiated in output
- Connection hints calculated but not fed into generation prompts

### Phase 12 Tasks

#### Priority 1: CRITICAL

**12A: Replace Emotion Triggers with Psychology Principles**
- [ ] `ContentPsychologyEngine.ts` - Remove emotion mapping (fear, desire, belonging, achievement)
- [ ] Replace with V1's 9 principles: Curiosity Gap, Narrative Transportation, Social Proof, Authority, Cognitive Dissonance, Pattern Interrupt, Scarcity, Reciprocity, Loss Aversion
- [ ] `synapse-core.service.ts` - Remove fear/desire pattern detection (lines 100-105)
- [ ] Score content by principle activation, not emotional resonance

**12B: Connection-Aware Format Selection**
- [ ] `SynapseContentGenerator.ts` - Add format routing based on connection type:
  - Cross-domain (weather + review) → Story Post (narrative transportation)
  - Counter-intuitive data → Controversial Post (cognitive dissonance)
  - Predictive/timing → Data Post (authority + proof)
  - Cultural moment → Story Post (emotional connection)
  - Unexpected connection → Hook Post (curiosity gap)
- [ ] `v6-content-generation.service.ts` - Pass connection metadata to format selector

**12C: Three-Way Connection "Holy Shit" Output**
- [ ] When breakthrough score ≥85 (three-way connection):
  - Special formatting/badge in UI
  - Generate premium content variations
  - Flag as "breakthrough angle"

#### Priority 2: HIGH

**12D: Wire Connection Hints into Generation**
- [ ] `v6-content-generation.service.ts` - Pass hint data into generation prompts
- [ ] Use hints to inform angle and positioning
- [ ] Include similarity score, unexpectedness, connection type in prompt context

**12E: Verify Humor Optimizer Integration**
- [ ] Audit each format generator for humor optimizer call
- [ ] Add edginess parameter based on brand tone
- [ ] Default: 25-50 (approachable)

#### Priority 3: MEDIUM

**12F: Remove V5 Naming Remnants**
- [ ] `InsightTabs.tsx` - Change `id: 'triggers'` → `id: 'voc'`
- [ ] `v6-content-generation.service.ts` - Remove BreakthroughInsight type mapping abstraction
- [ ] Simplify flow: insight + connections → psychology engine → format → content

### Files to Modify

| File | Changes | Priority |
|------|---------|----------|
| `ContentPsychologyEngine.ts` | Replace emotion→principle mapping | CRITICAL |
| `synapse-core.service.ts` | Remove fear/desire detection | CRITICAL |
| `SynapseContentGenerator.ts` | Add connection-aware format routing | CRITICAL |
| `v6-content-generation.service.ts` | Wire hints, simplify types | HIGH |
| `EmailGenerator.ts` | Remove `type: 'fear'` hardcode | MEDIUM |
| `InsightTabs.tsx` | Fix ID naming | LOW |

### Success Criteria (Phase 12)

- [ ] No emotion labels (fear, desire, belonging) in content generation code
- [ ] Format selection based on connection type, not insight category
- [ ] Three-way breakthroughs get special treatment
- [ ] Connection hints flow into generation prompts
- [ ] V6 alignment score: 65% → 90%+

---

## Safeguards to Prevent Future Drift

1. **Archive toxic code** - Move `trigger-consolidation.service.ts` to archived, it's V5 DNA
2. **Remove TriggerCategory emotion types** - Delete fear/desire/pain-point/objection from types
3. **Rename to be explicit** - `V1InsightCard` not `TriggerCard`
4. **Block imports** - Any import from `_archived_v5` should fail build
5. **Single source of truth** - All insight processing through V1 engine only

---

## B2B Considerations

V1 mechanics work for B2B with different data sources:
- **VoC:** G2, Capterra instead of Yelp
- **Local/Timing:** SEC filings, funding news instead of weather
- **Cost Equivalence:** B2B database (dev salary, churn cost) instead of lattes

Connection engine works identically - cross-domain connections are valuable regardless of B2C/B2B
