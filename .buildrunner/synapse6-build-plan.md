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
| **TOTAL** | | **36-52 hrs** |

---

## Critical Constraints

1. **DO NOT** change UI look/feel/structure
2. **DO NOT** delete industry_profiles table
3. **DO NOT** modify Competition tab
4. **DO NOT** change UVP sidebar data points
5. **DO** preserve exact V1 engine logic
6. **DO** keep all 19 APIs available
7. **DO** maintain provenance tracking
