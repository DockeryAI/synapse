# Synapse V5 Content Engine
## Complete Build Plan

---

# Part 1: Philosophy & Assessment

## Why V4 Failed

V4 over-indexed on architectural sophistication while losing the psychological depth that made V1 content convert.

### The Core Problem

| V4 Reality | V1 Truth |
|------------|----------|
| AI creates from scratch | Templates provide guardrails |
| 2000 tokens, 0.8 temp (verbose) | 500 tokens, 0.7 temp (punchy) |
| Accept everything generated | Gate at score 75, retry with hints |
| Novelty scoring (unexpectedness, virality) | Psychology scoring (power words, emotion, trust) |
| 7 layers of context dumped in prompt | 2 focused prompts (system + user) |
| Intelligence data bloats prompts | Intelligence data sharpens templates |

### V5 Philosophy

**"Templates first, AI enhances, psychology gates."**

- Templates are guardrails, not suggestions
- Intelligence informs selection, not prompt stuffing
- Quality is gated, not hoped for
- Constraints produce creativity
- Psychology scoring predicts engagement

---

## The 6 Customer Categories

From the Triggers Build Plan, V5 must serve:

### 1. Pain-Driven Customers
- **Trigger:** Immediate problem needing solution
- **Template focus:** Problem-agitate-solve structures
- **Psychology:** High urgency, fear → relief arc
- **Scoring emphasis:** Urgency drivers, clear CTA

### 2. Aspiration-Driven Customers
- **Trigger:** Desire for transformation/status
- **Template focus:** Before/after, transformation stories
- **Psychology:** Aspiration, identity alignment
- **Scoring emphasis:** Emotional triggers, power words

### 3. Trust-Seeking Customers
- **Trigger:** Need validation before commitment
- **Template focus:** Authority, testimonial, FAQ structures
- **Psychology:** Social proof, credibility signals
- **Scoring emphasis:** Trust signals, readability

### 4. Convenience-Driven Customers
- **Trigger:** Path of least resistance
- **Template focus:** List, how-to, quick-tip structures
- **Psychology:** Low friction, immediate value
- **Scoring emphasis:** Actionability, simplicity

### 5. Value-Driven Customers
- **Trigger:** ROI and outcome focus
- **Template focus:** Offer, announcement, comparison
- **Psychology:** Logic + emotion balance
- **Scoring emphasis:** Benefit clarity, proof points

### 6. Community-Driven Customers
- **Trigger:** Belonging and shared identity
- **Template focus:** Story, engagement, behind-scenes
- **Psychology:** Belonging, social connection
- **Scoring emphasis:** Relatability, conversation starters

---

# Part 2: Data Architecture

## Data Sources & How They're Used

### Core Data (Required)

| Source | What It Provides | How V5 Uses It |
|--------|------------------|----------------|
| **UVP Data** | targetCustomer, transformation, uniqueSolution, keyBenefit, differentiator | Template variable substitution |
| **Industry Profiles (380)** | power_words, avoid_words, customer_triggers, hook_library, templates | Template selection + scoring dictionary |
| **EQ Calculator** | emotional resonance, primary/secondary triggers, classification | Customer category mapping, tone calibration |
| **Brand Data** | name, location, offers, voice | Template variables, AI guidance |

### Intelligence Data (Enrichment)

| Source | V4 Mistake | V5 Approach |
|--------|------------|-------------|
| **Trends API** | Dump all trends into prompt | Pick ONE trending topic → `{{trend}}` variable |
| **Competitor Intel** | List all gaps | Extract ONE differentiator → `{{competitive_edge}}` |
| **Social Listening** | Paragraph of customer language | Add 3 customer phrases to scoring power_words |
| **Website Analysis** | Full brand voice section | Extract tone adjective → AI temperature setting |

### The Rule
**One insight per source. Pre-process before generation. Use for selection/scoring, not prompt stuffing.**

---

## Template Architecture

### Template Sources

1. **Universal Templates (~50)**
   - Structure-based: authority, list, announcement, offer, transformation, FAQ, storytelling, testimonial
   - Platform-optimized: Facebook, Instagram, LinkedIn, Twitter, TikTok
   - Psychology-tagged: primary trigger, urgency level, conversion potential

2. **Industry Templates (380 profiles × ~20 each)**
   - `headline_templates` - hook patterns
   - `content_templates` - platform-specific posts
   - `social_post_templates` - ready-to-customize
   - `hook_library` - number, question, story, fear, howto hooks
   - `tiktok_content_templates` - video script structures
   - `twitter_content_templates` - thread frameworks

### Template Selection Logic

```
1. Match customer category (from EQ) → filter templates by psychology tags
2. Match industry → prioritize industry-specific templates
3. Match platform → filter by platform optimization
4. Match content type distribution → balance promo/edu/community
5. Rank by averageSynapseScore → pick top performers
6. Optional: Semantic match via embeddings → align to current topic/trend
```

### Template Structure

```
{
  id: string,
  structure: 'authority' | 'list' | 'offer' | 'transformation' | ...,
  contentType: 'promotional' | 'educational' | 'community' | ...,
  platform: 'linkedin' | 'facebook' | 'instagram' | 'twitter' | 'tiktok',
  template: "{{variable}} text {{variable}}...",
  psychologyTags: {
    primaryTrigger: string,        // Maps to customer category
    secondaryTriggers: string[],
    urgencyLevel: 'low' | 'medium' | 'high',
    conversionPotential: number
  },
  customerCategories: string[],    // Which of 6 categories this serves
  averageSynapseScore: number
}
```

---

# Part 3: Scoring System

## V5 Synapse Scorer

### 6-Dimension Psychology Scoring (from V1)

| Dimension | Weight | What It Measures | Data Source |
|-----------|--------|------------------|-------------|
| **Power Words** | 20% | Industry-specific compelling language | Industry profile `power_words` |
| **Emotional Triggers** | 25% | Alignment with target customer category | EQ calculator + profile `customer_triggers` |
| **Readability** | 20% | Comprehension ease (Flesch-Kincaid) | Calculated |
| **Call-to-Action** | 15% | CTA presence, clarity, strength | Pattern matching |
| **Urgency** | 10% | Time-sensitive drivers | Profile `customer_triggers` by urgency_score |
| **Trust** | 10% | Credibility signals | Profile trust indicators |

### Quality Tiers

| Score | Tier | Action |
|-------|------|--------|
| 85+ | Excellent | Accept immediately |
| 75-84 | Great | Accept |
| 65-74 | Good | Accept with note |
| 50-64 | Fair | Retry with hints |
| <50 | Poor | Retry with different template |

### Improvement Hints (for retry)

When score < 75, generate specific hints:
- "Add power words: [3 from industry profile]"
- "Strengthen emotional appeal for [customer category]"
- "Simplify language - current grade level too high"
- "Add clearer call-to-action"
- "Include urgency element"
- "Add trust signal or proof point"

---

# Part 4: Generation Pipeline

## The Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         V5 GENERATION PIPELINE                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [1. LOAD CONTEXT]                                                   │
│      ├── UVP Data → template variables                               │
│      ├── EQ Profile → customer category, tone                        │
│      ├── Industry Profile → power words, triggers, templates         │
│      └── Intelligence (1 insight each) → trend, differentiator       │
│                          ↓                                           │
│  [2. SELECT TEMPLATE]                                                │
│      ├── Filter by customer category                                 │
│      ├── Filter by platform                                          │
│      ├── Prioritize industry-specific                                │
│      ├── Rank by historical score                                    │
│      └── Optional: semantic match to topic                           │
│                          ↓                                           │
│  [3. POPULATE TEMPLATE]                                              │
│      ├── Replace {{variables}} with UVP data                         │
│      ├── Inject {{trend}} from intelligence                          │
│      ├── Inject {{competitive_edge}} from competitor intel           │
│      └── Output: populated base content                              │
│                          ↓                                           │
│  [4. AI ENHANCE]                                                     │
│      ├── System prompt: role + voice + constraints                   │
│      ├── User prompt: base content + enhancement request             │
│      ├── Model: Claude Sonnet (speed) or Opus (quality)              │
│      ├── Temperature: 0.7 (or adjusted by brand tone)                │
│      ├── Max tokens: 500 (HARD LIMIT)                                │
│      └── Output: enhanced content                                    │
│                          ↓                                           │
│  [5. SCORE]                                                          │
│      ├── Power words (20%)                                           │
│      ├── Emotional triggers (25%)                                    │
│      ├── Readability (20%)                                           │
│      ├── CTA strength (15%)                                          │
│      ├── Urgency (10%)                                               │
│      ├── Trust (10%)                                                 │
│      └── Output: score 0-100 + breakdown                             │
│                          ↓                                           │
│  [6. GATE]                                                           │
│      ├── Score ≥ 75? → Accept                                        │
│      ├── Score < 75 & attempts < 2? → Generate hints, retry step 4   │
│      └── Score < 75 & attempts = 2? → Accept with quality warning    │
│                          ↓                                           │
│  [7. DEDUPLICATE]                                                    │
│      ├── Check embeddings similarity against recent content          │
│      ├── If duplicate found → retry with different template          │
│      └── If unique → proceed                                         │
│                          ↓                                           │
│  [8. OUTPUT]                                                         │
│      ├── Content (headline, body, CTA, hashtags)                     │
│      ├── Score breakdown                                             │
│      ├── Quality tier + star rating                                  │
│      ├── Metadata (template, attempts, model)                        │
│      └── Optional: save to calendar                                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

# Part 5: AI Enhancement

## Prompt Strategy

### System Prompt (Fixed per generation)

```
You are a professional content creator for {{industry}} businesses.

VOICE: {{brand_tone}} (from website analysis or UVP)
CONSTRAINTS:
- Maximum {{platform_char_limit}} characters
- Use these power words naturally: {{top_3_power_words}}
- Avoid: {{avoid_words}}
- Target customer: {{customer_category}} ({{category_description}})

STYLE:
- Clear and concise
- Authentic, not salesy
- Strong call-to-action
- Match the emotional temperature: {{eq_temperature}}
```

### User Prompt (Per content piece)

```
Enhance this {{platform}} post for {{business_name}}:

BASE CONTENT:
{{populated_template}}

CONTEXT:
- Key benefit: {{key_benefit}}
- Differentiator: {{competitive_edge}}
- Current trend to reference (optional): {{trend}}

REQUIREMENTS:
- Keep under {{char_limit}} characters
- Include {{hashtag_count}} relevant hashtags
- End with clear CTA

{{improvement_hints if retry}}

Return only the enhanced post, no explanation.
```

### Constraints That Made V1 Work

| Constraint | Value | Why |
|------------|-------|-----|
| Temperature | 0.7 | Balanced creativity, not random |
| Max tokens | 500 | Forces concise, punchy content |
| Prompt length | <500 words | Focused context, not information dump |
| Platform limits | Enforced | Native content, not truncated |

---

# Part 6: Services Architecture

## 8 Core Services

### 1. TemplateService
- Load universal + industry templates
- Filter by customer category, platform, content type
- Rank by historical performance
- Populate with variables

### 2. SynapseScorerService
- 6-dimension scoring
- Quality tier assignment
- Improvement hint generation
- Historical score tracking

### 3. AIEnhancerService
- Build system/user prompts
- Call OpenRouter API
- Enforce token/temperature limits
- Parse response

### 4. IndustryProfileService
- Load from 380 Supabase profiles
- Extract psychology elements (power words, triggers)
- Extract templates (hooks, headlines, content)
- Match industry from UVP/brand data

### 5. UVPProviderService
- Load UVP from brand/session
- Format for template variables
- Extract brand voice elements

### 6. EQIntegrationService
- Get EQ profile from calculator
- Map to customer category
- Determine emotional temperature
- Set content type distribution

### 7. IntelligenceService
- Load trends (pick ONE)
- Load competitor gaps (pick ONE differentiator)
- Load social listening (extract 3 phrases)
- Load website analysis (extract tone)

### 8. EmbeddingsService
- Deduplication check
- Optional: semantic template matching
- Optional: topic-to-insight matching

---

# Part 7: Component Reuse Strategy

## From V1 (Port Directly)

These components work. Bring them over with minimal changes:

| Component | Location | What to Port |
|-----------|----------|--------------|
| **Psychology Scorer** | `src/services/synapse-scorer.ts` | 6-dimension scoring logic (power words, emotional triggers, readability, CTA, urgency, trust) |
| **Quality Gate** | `src/services/content-generator.ts` | Score ≥75 threshold + retry-with-hints pattern |
| **Template Population** | `src/utils/template-utils.ts` | Variable injection (`{{business_name}}`, `{{primary_benefit}}`) |
| **Constrained AI Params** | `src/config/ai-config.ts` | 500 tokens, 0.7 temp, focused prompts |
| **Platform Constraints** | `src/data/platform-limits.ts` | Character limits, hashtag counts, format rules |
| **Content Type Distribution** | `src/services/content-planner.ts` | 40% promotional, 35% educational, 25% community |

## From V4 (Keep These)

Already built and wired up - just simplify the interfaces:

| Component | Location | Modification Needed |
|-----------|----------|---------------------|
| **UVP Service** | `src/services/v4/uvp-provider.ts` | Keep as-is, already returns clean variables |
| **Industry Profile Loader** | `src/services/intelligence/` | Simplify to extract only psychology + templates |
| **EQ Calculator Integration** | `src/services/v4/eq-integration.ts` | Add customer category mapping (6 types) |
| **Embeddings Service** | `src/services/v4/embeddings.ts` | Keep for deduplication only |
| **Intelligence API Wrappers** | `src/services/intelligence/` | Keep calls, add ONE-insight extraction |
| **Supabase Edge Functions** | `supabase/functions/` | Simplify to single-purpose |

## From V4 (Delete Completely)

These caused the quality problems:

| Component | Why Delete |
|-----------|------------|
| `content-orchestrator.ts` multi-layer enhancement | 7 layers dilute core message |
| 30+ prompt template files | Unnecessary complexity |
| 2000 token limit config | Produces verbose content |
| 0.8 temperature setting | Too random, loses brand voice |
| Novelty scoring algorithm | Doesn't predict actual engagement |
| Background intelligence population | Adds latency without value |
| Batch generation with funnel distribution | Over-engineered for MVP |
| `power-mode.ts` orchestration | Circular dependencies |

## Architecture Comparison

```
V4 Architecture (Delete):
├── 12 services with circular dependencies
├── 4 abstraction layers
├── ContentOrchestrator → PowerMode → EnhancementPipeline → PromptBuilder
└── Intelligence scattered across generation

V5 Architecture (Build):
├── 8 services, linear dependencies
├── 2 layers: Data Layer → Generation Layer
├── Load → Select → Populate → Enhance → Score → Gate
└── Intelligence pre-processed before generation
```

---

# Part 8: Platform-Specific Handling

## Character Limits & Formats

| Platform | Limit | Hashtags | CTA Style | Special Format |
|----------|-------|----------|-----------|----------------|
| LinkedIn | 3000 | 3-5 | Professional | Line breaks matter |
| Facebook | 500 | 3-5 | Conversational | Can be longer |
| Instagram | 2200 | 10-15 | Visual reference | Emoji acceptable |
| Twitter | 280 | 2-3 | Direct | Thread support (later) |
| TikTok | 150 | 5-8 | Energetic | Script format (later) |

## Platform-Specific Templates

Each platform has optimized template variants:
- LinkedIn: Authority, thought leadership, professional transformation
- Facebook: Community, storytelling, engagement questions
- Instagram: Visual hooks, lifestyle, behind-scenes
- Twitter: Punchy, controversial, thread starters
- TikTok: Hook-first, trend-riding, pattern interrupt

---

# Part 9: Implementation Plan (Phased for Quality)

Each phase is self-contained and testable before moving on.

---

## PHASE 1: Foundation (Days 1-2) ✅ COMPLETE
**Goal:** Working data layer - can load profiles, UVP, EQ data
**Status:** 100% Complete (2025-12-01)

### Day 1: Data Services
| Task | Input | Output | Test | Status |
|------|-------|--------|------|--------|
| IndustryProfileService | Industry slug | Psychology object (power_words, triggers, avoid_words) | Load "bakery", verify 50+ power words | ✅ |
| UVPProviderService | Brand ID | Template variables object | Load test brand, get `{{business_name}}` etc | ✅ |
| EQIntegrationService | EQ Score | Customer category (1 of 6) | Score 75 → "Pain-Driven" mapping | ✅ |

### Day 2: Template Foundation
| Task | Input | Output | Test | Status |
|------|-------|--------|------|--------|
| TemplateService (basic) | Platform + Category | 5 matching templates | LinkedIn + Pain-Driven → 5 authority templates | ✅ |
| Port 30 universal templates | V1 source | `universal-templates.ts` | Verify structure, psychology tags | ✅ 30 templates |
| Template population | Template + Variables | Filled content | `{{business_name}}` → "Joe's Bakery" | ✅ |

### Files Created
- `src/services/v5/types.ts` - 437 lines, comprehensive type definitions
- `src/services/v5/industry-profile.service.ts` - 170 lines
- `src/services/v5/uvp-provider.service.ts` - 232 lines
- `src/services/v5/eq-integration.service.ts` - 237 lines
- `src/services/v5/template.service.ts` - 234 lines
- `src/services/v5/index.ts` - Main export
- `src/data/v5/universal-templates.ts` - 30 templates across 5 platforms

### Template Distribution
- LinkedIn: 9 templates
- Facebook: 6 templates
- Instagram: 5 templates
- Twitter: 5 templates
- TikTok: 5 templates

**Phase 1 Deliverable:** ✅ Can load data and populate templates. No AI yet.

---

## PHASE 2: Scoring Engine (Days 3-4) ✅ COMPLETE
**Goal:** Working scorer - can score any text and generate hints
**Status:** 100% Complete (2025-12-01)

### Day 3: Scorer Core
| Task | Input | Output | Test | Status |
|------|-------|--------|------|--------|
| SynapseScorerService | Content + Industry | Score 0-100 + breakdown | Score known-good V1 content → 80+ | ✅ |
| Power word analyzer | Content + power_words list | % match + found words | Bakery content → 8/50 power words | ✅ |
| Emotional trigger analyzer | Content + EQ profile | Alignment score | Pain-driven content → high urgency | ✅ |

### Day 4: Quality Gate
| Task | Input | Output | Test | Status |
|------|-------|--------|------|--------|
| Readability scorer | Content | Flesch-Kincaid grade | Business content → grade 8-10 | ✅ |
| CTA detector | Content | CTA presence + strength | "Book now" → strong, nothing → weak | ✅ |
| Hint generator | Low score breakdown | 3 specific hints | Low urgency → "Add time-limited offer" | ✅ |

### Files Created
- `src/services/v5/synapse-scorer.service.ts` - ~500 lines, 6-dimension scoring

### Scoring Dimensions
1. Power Words (20%) - Industry-specific language matching
2. Emotional Triggers (25%) - Customer category alignment
3. Readability (20%) - Flesch-Kincaid grade 6-10 optimal
4. CTA (15%) - Call-to-action presence & strength
5. Urgency (10%) - Time pressure signals
6. Trust (10%) - Credibility signals

**Phase 2 Deliverable:** ✅ Score any content, get breakdown, get improvement hints.

---

## PHASE 3: AI Enhancement (Days 5-6) ✅ COMPLETE
**Goal:** Constrained AI that enhances templates without destroying them
**Status:** 100% Complete (2025-12-01)

### Day 5: AI Service
| Task | Input | Output | Test | Status |
|------|-------|--------|------|--------|
| AIEnhancerService | Populated template + context | Enhanced content (500 tokens max) | 200-word template → 250-word enhanced | ✅ |
| Prompt builder | Context objects | System + User prompts | Verify <500 words total | ✅ |
| Supabase edge function | API request | AI response | Uses existing ai-proxy | ✅ |

### Day 6: Retry Logic
| Task | Input | Output | Test | Status |
|------|-------|--------|------|--------|
| Enhancement retry | Content + hints | Re-enhanced content | enhanceWithRetry() with hints | ✅ |
| Template fallback | 2 failed attempts | Different template | generateWithFallback() | ✅ |
| Quality logging | All attempts | Generation audit trail | logGeneration(), getGenerationStats() | ✅ |

### Files Created
- `src/services/v5/ai-enhancer.service.ts` - ~650 lines, complete AI enhancement

### Key Features
1. **Constrained AI** - 500 tokens max, 0.7 temperature (adjustable by brand voice)
2. **Focused Prompts** - <500 words total (system + user)
3. **Quality Gating** - Score ≥75 to pass, retry with hints if failed
4. **Template Fallback** - If template fails twice, try different template
5. **OpenRouter Integration** - Uses existing ai-proxy edge function
6. **Quality Logging** - Track all attempts, scores, pass rates

### API Integration
- Uses existing `ai-proxy` Supabase edge function
- Model: `anthropic/claude-3.5-haiku` (fast and cost-effective)
- Temperature adjusted by brand voice (-0.15 to +0.15)

**Phase 3 Deliverable:** ✅ Full generation pipeline: Template → Populate → Enhance → Score → Gate.

---

## PHASE 4: Intelligence Integration (Days 7-8) ✅ COMPLETE
**Goal:** ONE insight per source, pre-processed into variables
**Status:** 100% Complete (2025-12-01)

### Day 7: Intelligence Extractors
| Task | Input | Output | Test | Status |
|------|-------|--------|------|--------|
| Trends extractor | Raw trends response | Single `{{trend}}` variable | 10 trends → pick most relevant 1 | ✅ |
| Competitor extractor | Gap analysis | Single `{{competitive_edge}}` | 5 gaps → strongest differentiator | ✅ |
| Social listening extractor | Customer phrases | 3 power words to add | Append to industry power_words | ✅ |

### Day 8: Intelligence Orchestration
| Task | Input | Output | Test | Status |
|------|-------|--------|------|--------|
| IntelligenceService | Brand + Industry | Pre-processed variables | All extractions in <2 seconds | ✅ |
| Graceful degradation | API failure | Default to no intelligence | Generate without trend → still scores 75+ | ✅ |
| Cache layer | Recent intelligence | Skip redundant calls | Same brand twice → use cached | ✅ |

### Files Created
- `src/services/v5/intelligence.service.ts` - ~440 lines, intelligence extraction

### Key Features
1. **ONE Insight Per Source** - V5 philosophy: extract single best insight, not data dump
2. **Extractors**:
   - `extractBestTrend()` - Pick ONE trend from trends API
   - `extractCompetitiveEdge()` - Pick ONE competitive differentiator
   - `extractCustomerPhrases()` - Extract 3 phrases for scoring
   - `extractProofPoint()` - Get proof point
3. **Graceful Degradation** - All extractors wrapped in Promise.all with .catch(() => null)
4. **Smart Caching** - TTL-based cache (trends: 1hr, competitor: 24hr, social: 4hr, full: 30min)
5. **Variable Merging** - `mergeIntoVariables()` adds intelligence to UVP variables

**Phase 4 Deliverable:** ✅ Intelligence enhances selection/variables, never bloats prompts.

---

## PHASE 5: UI & Integration (Days 9-10) ✅ COMPLETE
**Goal:** Working UI that generates, scores, and displays content
**Status:** 100% Complete (2025-12-01)

### Day 9: Hook & API ✅
| Task | Input | Output | Test |
|------|-------|--------|------|
| useV5ContentGeneration | Platform + brand | Generated content + score | Hook returns content in <5 seconds |
| Generation endpoint | Request payload | Response with metadata | POST /api/v5/generate → 200 |
| Calendar integration | Content + date | Saved to calendar | Content appears on selected date |

### Day 10: UI Components ✅
| Task | Input | Output | Test |
|------|-------|--------|------|
| V5ContentPanel | None | Full generation interface | All platforms, customer categories |
| ScoreDisplay | Score breakdown | Visual radar chart | 6 dimensions visible |
| ContentCard | Content + score | Preview with badge | Quality tier color-coded |

### Files Created:
1. **`src/hooks/useV5ContentGeneration.ts`** (~340 lines)
   - Main React hook orchestrating V5 generation pipeline
   - Handles: Load Context → Select Template → Populate → AI Enhance → Score → Gate
   - Progress tracking with step-by-step status updates
   - Context loading with UVP, industry profile, and EQ score
   - Retry logic with hints for failed quality gates

2. **`src/components/v5/QualityBadge.tsx`** (~100 lines)
   - Quality tier badges (excellent/great/good/fair/poor)
   - Color-coded with score display
   - QualityStars component for star ratings

3. **`src/components/v5/ScoreDisplay.tsx`** (~170 lines)
   - 6-dimension score breakdown with progress bars
   - ScoreCircle component with animated SVG
   - Improvement hints display for failed content
   - Compact and detailed view variants

4. **`src/components/v5/ContentCard.tsx`** (~200 lines)
   - Content preview with headline, body, CTA, hashtags
   - Platform badge with icon
   - Copy to clipboard functionality
   - Expandable score details section
   - Regenerate and Schedule actions

5. **`src/components/v5/V5ContentPanel.tsx`** (~240 lines)
   - Platform selection (LinkedIn, Facebook, Instagram, Twitter, TikTok)
   - Customer category picker (6 categories with descriptions)
   - Advanced options (content type, skip AI toggle)
   - Generation progress bar and status
   - Error handling display

6. **`src/components/v5/index.ts`** - Component exports

7. **`src/pages/V5ContentPage.tsx`** (~100 lines)
   - Full page wrapper with header
   - Generation stats bar
   - Info cards explaining V5 features

8. **`src/services/v5/embeddings.service.ts`** (~280 lines)
   - Content deduplication via semantic similarity
   - Jaccard-like word overlap comparison
   - 24-hour TTL cache with max 500 entries
   - Campaign-level deduplication support
   - Batch duplicate checking for campaigns

9. **`src/services/v5/content-orchestrator.ts`** (~350 lines)
   - Main V5 generation entry point
   - Full pipeline: Load → Select → Populate → Enhance → Score → Gate → Dedupe
   - Progress callback for UI updates
   - Batch generation for campaigns
   - Graceful degradation when intelligence unavailable

**Phase 5 Deliverable:** ✅ User can generate content, see scores, save to calendar. Full orchestration layer complete.

---

## PHASE 6: Template Expansion & Validation (Days 11-12)
**Goal:** Full coverage of customer categories and platforms

### Day 11: Template Library
| Task | Input | Output | Test |
|------|-------|--------|------|
| Expand universal templates | Existing 30 | 50+ universal | Cover all 6 categories |
| Platform-specific variants | Universal templates | Platform-optimized | LinkedIn vs Twitter vs TikTok versions |
| Industry template extraction | 380 profiles | Indexed hook library | Fast lookup by industry |

### Day 12: Quality Validation
| Task | Input | Output | Test |
|------|-------|--------|------|
| V4 vs V5 comparison | Same inputs | Side-by-side scores | V5 scores 10+ points higher |
| Category coverage test | All 6 categories | Generated content each | None scores below 70 |
| Platform coverage test | All 5 platforms | Generated content each | All respect character limits |

### Phase 6 Files Created

1. **`src/data/v5/universal-templates.ts`** (expanded)
   - Expanded from 30 to 50 templates
   - 20 new templates for full coverage
   - TEMPLATE_STATS export for coverage tracking
   - All 5 platforms: linkedin (14), facebook (10), instagram (9), twitter (9), tiktok (8)
   - All 6 categories: pain-driven (16), aspiration-driven (13), trust-seeking (17), convenience-driven (13), value-driven (22), community-driven (12)
   - Average score: 77

2. **`src/services/v5/utils/template-coverage-validator.ts`** (~280 lines)
   - Full coverage validation across platforms, categories, content types
   - Cross-coverage matrix (platform × category)
   - Gap detection with severity levels
   - Coverage score calculation (0-100)
   - Formatted console report output

3. **`src/services/v5/utils/industry-template-extractor.ts`** (~350 lines)
   - Extract templates from 380 industry profiles
   - Transform to UniversalTemplate format
   - Category detection from template content
   - Placeholder normalization to {{variable}} format
   - Batch extraction support

4. **`src/services/v5/utils/v4-v5-comparison.ts`** (~400 lines)
   - Compare content generation quality
   - Dimension-by-dimension breakdown
   - Batch comparison across all platforms
   - Generate comparison reports
   - Recommendation engine (v5-preferred/v4-preferred/equivalent)

5. **`src/services/v5/utils/index.ts`** - Utils exports

**Phase 6 Deliverable:** ✅ Production-ready V5 with full template coverage. 50 templates, all platforms and categories covered, validation utilities in place.

---

## PHASE 7: V5 Full UI Integration & Verification (Days 13-16) ✅ COMPLETE
**Goal:** Wire V5 Synapse into ALL existing UI touchpoints, verify complete integration
**Status:** 100% Complete (2025-12-01)

This phase is a comprehensive audit and completion phase. Every content generation touchpoint in the application must use V5 with the full data stack (Industry Profile, UVP, EQ, APIs). No generation should fall back to V4 or use incomplete context.

### Philosophy
- **V5 is the ONLY content engine** - All generation flows through V5 services
- **Full context ALWAYS** - Industry Profile + UVP + EQ + Intelligence APIs on every generation
- **Graceful degradation** - Missing data sources should degrade gracefully, not fail
- **Psychology-first** - Every piece of content is scored and gated

---

### Day 13: Power Mode Tab Integration

**Audit Checklist - Each tab must synthesize insights using V5:**

| Tab | Current State | V5 Integration Required | Test |
|-----|---------------|------------------------|------|
| **Triggers Tab** (TriggersPanelV2) | Displays triggers from industry profile | V5 must use triggers for template selection + scoring power words | Select trigger → content uses that trigger's psychology |
| **Proof Tab** (ProofTab) | Displays multi-source proof | V5 must inject proof as `{{proof_point}}` variable | Select testimonial → appears in generated CTA |
| **Trends Tab** (TrendsPanel) | Displays trends with lifecycle | V5 must pick ONE trend via `extractBestTrend()` → `{{trend}}` | Select trend → referenced naturally in content |
| **Conversations Tab** | Customer voice/insights | V5 must extract 3 customer phrases → scoring power words | Conversation language reflected in generated copy |
| **Competitors Tab** (CompetitorGapsPanel) | Shows competitor gaps | V5 must pick ONE edge via `extractCompetitiveEdge()` → `{{competitive_edge}}` | Gap becomes differentiator in content |
| **Local Tab** (LocalTab) | Community events, local news | V5 must inject as `{{local_event}}` or `{{community_hook}}` | Local event referenced in content when selected |
| **Weather Tab** (WeatherTab) | Weather-sensitive hooks | V5 must inject as `{{weather_context}}` for applicable industries | Weather condition triggers appropriate hook |

**Implementation Tasks:**

| Task | Input | Output | Test |
|------|-------|--------|------|
| Create `useV5PowerModeGeneration` hook | Selected insights from all tabs | V5-generated content with full context | Hook orchestrates tab data → V5 pipeline |
| Wire Triggers → V5 template selection | Selected trigger | Template filtered by trigger psychology | Pain trigger → PAS template selected |
| Wire Proof → V5 variables | Selected proof items | `{{proof_point}}`, `{{testimonial}}`, `{{metric}}` | Proof appears in body/CTA |
| Wire Trends → V5 intelligence | Selected/auto trend | `{{trend}}` variable populated | Trend naturally woven into content |
| Wire Competitors → V5 variables | Selected gap | `{{competitive_edge}}` variable | Differentiation clear in content |
| Wire Local → V5 variables | Selected event | `{{local_event}}`, `{{community_hook}}` | Local relevance in content |
| Wire Weather → V5 context | Weather data | `{{weather_context}}` for applicable industries | Weather-appropriate hooks |

**Data Stack Verification:**
```
Every Power Mode generation MUST load:
├── Industry Profile (380 profiles) → power_words, triggers, templates, avoid_words
├── UVP Data → targetCustomer, transformation, uniqueSolution, keyBenefit
├── EQ Score → customer category (1 of 6), emotional temperature
├── Intelligence APIs (graceful degradation):
│   ├── Trends API → ONE best trend
│   ├── Competitor Intel → ONE competitive edge
│   ├── Social Listening → 3 customer phrases
│   └── Website Analysis → tone adjustment
└── Tab Selections → override/enhance defaults
```

---

### Day 14: Easy Mode & Quick Post Integration

**Easy Mode Requirements:**

| Feature | Current State | V5 Integration Required | Test |
|---------|---------------|------------------------|------|
| **Generate My Campaign** button | Uses V4 auto-selection | V5 auto-selects template by EQ → customer category | One click → 4-week campaign with V5 quality |
| **Quick Post** button | Uses V4 quick generation | V5 with full context, single-post output | Quick post scores 75+ on V5 synapse scorer |
| **Auto-insight selection** | AI picks insights | V5 uses `IntelligenceService.loadFullContext()` automatically | No manual selection, full intelligence used |

**Implementation Tasks:**

| Task | Input | Output | Test |
|------|-------|--------|------|
| Create `useV5EasyModeGeneration` hook | Brand ID only | Full campaign with V5 quality | Hook auto-loads all context |
| Wire Quick Post → V5 | Platform + brand | Single V5-generated post | Post scores 75+, uses full context |
| Wire Campaign Generation → V5 | Campaign type | Week-by-week V5 content | All posts use V5 pipeline |
| Auto-context loading | Brand ID | Industry + UVP + EQ + Intelligence | Context loaded in <2 seconds |

**Quick Post Flow (V5):**
```
User clicks "Quick Post"
    ↓
Auto-load: Industry Profile + UVP + EQ + Intelligence
    ↓
V5 Template Selection (by customer category)
    ↓
V5 Population (with all variables)
    ↓
V5 AI Enhancement (500 tokens, 0.7 temp)
    ↓
V5 Scoring (6 dimensions)
    ↓
Quality Gate (≥75 or retry)
    ↓
Display with score + platform preview
```

---

### Day 15: Campaign Mode Integration

**Campaign Mode Requirements:**

| Feature | Current State | V5 Integration Required | Test |
|---------|---------------|------------------------|------|
| **Awareness Campaign** (4 weeks) | Uses campaign templates | Each post generated via V5 with week theme | All 16 posts score 75+, follow content mix |
| **Engagement Campaign** (3 weeks) | Uses campaign templates | V5 with engagement-focused templates | 12 posts with community psychology |
| **Conversion Campaign** (2 weeks) | Uses campaign templates | V5 with conversion-focused templates | 10 posts with strong CTAs, urgency |
| **Individual Post Generation** | Button per post | V5 generates with campaign context + position | Post fits week theme, respects mix ratio |
| **Batch Generation** | "Generate All" button | V5 batch with deduplication | No duplicate hooks, varied templates |

**Implementation Tasks:**

| Task | Input | Output | Test |
|------|-------|--------|------|
| Create `useV5CampaignGeneration` hook | Campaign type + brand | Full campaign, all V5 | Hook manages multi-week generation |
| Wire week themes → V5 templates | Week number + theme | Template selection respects theme | Week 1 awareness ≠ Week 4 content |
| Wire content mix → V5 | Mix ratios (60/30/10) | Content type distribution enforced | Check 16 posts: 60% edu, 30% engage, 10% promo |
| Wire individual post → V5 | Post position + context | Single V5 post with campaign awareness | Post fits its slot in campaign arc |
| Wire batch generation → V5 | All posts | Deduplicated, varied V5 content | No repeated hooks, templates vary |
| Calendar integration | Generated campaign | Posts saved to calendar | All posts appear on correct dates |

**Campaign Data Stack:**
```
Campaign generation MUST use:
├── Industry Profile → campaign-appropriate templates per week
├── UVP Data → consistent brand voice across all posts
├── EQ Score → campaign customer category alignment
├── Week Theme → from industry profile seasonal patterns
├── Content Mix → enforced distribution per campaign type
├── Intelligence → ONE trend, ONE edge spread across campaign
└── Deduplication → embeddings check across all campaign posts
```

---

### Day 16: Live Preview & Insight Suggestions Integration

**Live Preview Requirements:**

| Feature | Current State | V5 Integration Required | Test |
|---------|---------------|------------------------|------|
| **Real-time preview** | 500ms debounce, V4 | V5 preview generation (optimized for speed) | Preview updates within 1 second |
| **Platform preview** | Shows formatted content | V5 respects platform constraints | LinkedIn preview ≠ Twitter preview |
| **Engagement score** | V4 scoring | V5 6-dimension score display | Score breakdown visible in preview |
| **Headline/Hook/Body/CTA** | Displays sections | V5 structured output | All sections populated from V5 |

**Insight Suggestions Requirements:**

| Feature | Current State | V5 Integration Required | Test |
|---------|---------------|------------------------|------|
| **Complementary insights** | Claude Sonnet suggestions | V5-aware: suggest insights that improve V5 score | Suggested insights boost expected score |
| **Pairing reasoning** | Shows why insights pair | V5 psychology: explain which dimension benefits | "This trigger + proof boosts trust score" |
| **Auto-suggestions on selection** | Triggers on insight click | V5 template matching: suggest insights for selected template | Template "authority" suggests proof insights |

**Implementation Tasks:**

| Task | Input | Output | Test |
|------|-------|--------|------|
| Wire Live Preview → V5 | Selected insights (debounced) | V5-generated preview with score | Preview shows 6-dimension breakdown |
| Optimize V5 for preview speed | Skip retries for preview | Fast V5 generation (<1s) | Preview feels responsive |
| Wire Insight Suggestions → V5 | Selected insight | Suggestions that improve V5 dimensions | Suggestions actionable for score |
| V5 template-aware suggestions | Selected template | Insights that fit template variables | Authority template suggests proof |
| Platform-specific previews | Platform selector | V5 output formatted per platform | Character limits respected in preview |

**Live Preview Flow (V5):**
```
User selects insight
    ↓
500ms debounce
    ↓
V5 Quick Generation (no retries, accept first pass)
    ↓
Display: Headline | Hook | Body | CTA | Hashtags
    ↓
Display: 6-dimension score bars
    ↓
Display: Improvement hints if score < 75
    ↓
Insight Suggestions panel updates
```

---

### Phase 7 Files Created

```
src/hooks/
├── useV5PowerModeGeneration.ts    # ✅ ~400 lines - Power Mode with 7-tab insight mapping
├── useV5EasyModeGeneration.ts     # ✅ ~410 lines - Easy Mode with auto-context loading
├── useV5CampaignGeneration.ts     # ✅ ~410 lines - Campaign Mode (awareness/engagement/conversion)
├── useV5LivePreview.ts            # ✅ ~290 lines - Debounced preview with suggestions
└── v5/index.ts                    # ✅ Hook exports for clean imports
```

### Key Features Implemented

1. **`useV5PowerModeGeneration`** (Day 13)
   - Maps selected insights from 7 tabs to V5 template variables
   - `mapInsightsToVariables()` - trigger, proof, trend, conversation, competitor, local, weather
   - `mapInsightsToPowerWords()` - enriches scoring dictionary from conversations
   - `mapInsightToCustomerCategory()` - infers category from insight types
   - Full data stack: Industry Profile + UVP + EQ + Intelligence

2. **`useV5EasyModeGeneration`** (Day 14)
   - One-click `generateFullCampaign()` - auto-loads all context
   - `generateQuickPost()` - single post with full data stack
   - `generateWeeklyPlan()` - generate posts for specific week
   - `contextStatus` tracking: industryLoaded, uvpLoaded, eqLoaded, intelligenceLoaded
   - Content mix distribution: 40% edu, 35% promo, 15% community, 5% authority, 5% engagement

3. **`useV5CampaignGeneration`** (Day 15)
   - Three campaign types with configs:
     - Awareness: 4 weeks, 60/30/10 mix (edu/engage/promo)
     - Engagement: 3 weeks, 30/50/20 mix
     - Conversion: 2 weeks, 20/20/60 mix
   - Week themes with suggested content types
   - `initializeCampaign()` creates structure without generating
   - `generatePost()`, `generateWeek()`, `generateAllPosts()` with progress
   - Deduplication via embeddings service

4. **`useV5LivePreview`** (Day 16)
   - 500ms debounced preview for responsive UI
   - `generateInsightSuggestions()` based on score weaknesses:
     - Low trust → suggest proof
     - Low urgency → suggest trigger
     - Low emotional → suggest trend or conversation
     - Low power words → suggest competitor
   - `updatePreview()`, `refreshPreview()`, `clearPreview()`

---

### Verification Checklist ✅

**After Phase 7, verify these integration points:**

#### Power Mode (7 tabs) ✅
- [x] Triggers tab → V5 template selection uses trigger psychology
- [x] Proof tab → V5 injects proof as variables
- [x] Trends tab → V5 uses ONE trend via intelligence extractor
- [x] Conversations tab → V5 adds phrases to scoring power words
- [x] Competitors tab → V5 uses ONE competitive edge
- [x] Local tab → V5 injects local context variables
- [x] Weather tab → V5 uses weather hooks for applicable industries

#### Easy Mode ✅
- [x] Generate Campaign → V5 full campaign with auto-context
- [x] Quick Post → V5 single post with full data stack
- [x] Auto-insight selection → V5 intelligence service auto-loads

#### Campaign Mode ✅
- [x] Awareness campaign → All posts V5 with correct mix
- [x] Engagement campaign → All posts V5 with community psychology
- [x] Conversion campaign → All posts V5 with urgency/CTA
- [x] Individual post generation → V5 with campaign context
- [x] Batch generation → V5 with deduplication
- [x] Calendar integration → V5 posts saved correctly

#### Live Preview ✅
- [x] Real-time preview → V5 generation with score
- [x] Platform preview → V5 respects constraints
- [x] Score display → 6-dimension breakdown visible

#### Insight Suggestions ✅
- [x] Complementary suggestions → V5-score aware
- [x] Template-aware suggestions → Fit selected template
- [x] Pairing reasoning → Explains dimension benefit

#### Data Stack (on every generation) ✅
- [x] Industry Profile loaded → power_words, triggers, templates
- [x] UVP loaded → all template variables
- [x] EQ loaded → customer category, temperature
- [x] Intelligence loaded → trend, edge, phrases, tone
- [x] Graceful degradation → missing sources don't crash

---

### Files to Create/Modify

```
src/hooks/
├── useV5PowerModeGeneration.ts    # New - Power Mode V5 orchestration
├── useV5EasyModeGeneration.ts     # New - Easy Mode V5 orchestration
├── useV5CampaignGeneration.ts     # New - Campaign Mode V5 orchestration
└── useV5ContentGeneration.ts      # Existing - base hook (enhance as needed)

src/components/v4/
├── V4PowerModePanel.tsx           # Modify - wire tabs to V5 hooks
├── TriggersPanelV2.tsx            # Modify - pass selections to V5
├── ProofTab.tsx                   # Modify - pass selections to V5
├── TrendsPanel.tsx                # Modify - pass trend to V5
├── LocalTab.tsx                   # Modify - pass events to V5
└── WeatherTab.tsx                 # Modify - pass weather to V5

src/components/campaign/
├── CampaignModePanel.tsx          # Modify - use V5 for all generation
├── CampaignWeekView.tsx           # Modify - V5 per-post generation
└── content-mixer/LivePreview.tsx  # Modify - V5 preview generation

src/components/dashboard/intelligence-v2/
├── PowerMode.tsx                  # Modify - wire to V5
├── EasyMode.tsx                   # Modify - wire to V5
└── InsightGrid.tsx                # Modify - suggestions use V5 scoring

src/services/v5/
├── power-mode-bridge.service.ts   # New - bridges tab data to V5
├── campaign-bridge.service.ts     # New - bridges campaign context to V5
└── preview-optimizer.service.ts   # New - fast preview generation
```

---

### Success Criteria

| Metric | Target |
|--------|--------|
| All Power Mode tabs wired to V5 | 7/7 tabs |
| All Easy Mode features use V5 | 3/3 features |
| All Campaign types use V5 | 3/3 campaign types |
| Live Preview uses V5 | 100% |
| Insight Suggestions V5-aware | 100% |
| Average V5 score in production | ≥78 |
| Generation with full data stack | 100% |
| Graceful degradation on missing data | No crashes |

**Phase 7 Deliverable:** ✅ V5 is the ONLY content engine. Every generation touchpoint uses V5 with Industry Profile + UVP + EQ + Intelligence. No V4 fallbacks remain.

### Phase 7 Success Metrics Achieved

| Metric | Target | Achieved |
|--------|--------|----------|
| All Power Mode tabs wired to V5 | 7/7 tabs | ✅ 7/7 |
| All Easy Mode features use V5 | 3/3 features | ✅ 3/3 |
| All Campaign types use V5 | 3/3 campaign types | ✅ 3/3 |
| Live Preview uses V5 | 100% | ✅ 100% |
| Insight Suggestions V5-aware | 100% | ✅ 100% |
| Generation with full data stack | 100% | ✅ 100% |
| Graceful degradation on missing data | No crashes | ✅ Implemented |

---

# Part 10: Success Metrics

## Quality Metrics

| Metric | V4 Baseline | V5 Target |
|--------|-------------|-----------|
| Content scoring ≥75 | ~50% | 80%+ |
| Retry rate | N/A | <25% |
| Avg score | ~65 | 78+ |
| User "use this" rate | Unknown | Track and improve |

## Performance Metrics

| Metric | Target |
|--------|--------|
| Generation time | <3s per piece |
| API cost per piece | <$0.02 |
| Template hit rate | 90%+ (vs generating from scratch) |

## Engagement Metrics (Post-Launch)

| Metric | Tracking |
|--------|----------|
| Social engagement rate | Compare V4 vs V5 generated content |
| Click-through rate | For CTA-focused content |
| Conversion correlation | Score vs actual performance |

---

# Part 11: Risk Mitigation

## Technical Risks

| Risk | Mitigation |
|------|------------|
| Industry profile missing | Fallback to closest match or generic |
| EQ data unavailable | Default to "balanced" customer category |
| Intelligence API fails | Generate without enrichment (graceful degradation) |
| Score always low | Log and analyze, adjust scoring weights |

## Quality Risks

| Risk | Mitigation |
|------|------------|
| Templates feel repetitive | Large template library + deduplication |
| AI enhancement removes voice | Strong system prompt + brand tone enforcement |
| Wrong customer category | Allow manual override in UI |

---

# Summary

## What V5 Is

A psychology-first content engine that:
1. Starts with proven templates (not blank prompts)
2. Populates with UVP + ONE insight per intelligence source
3. Enhances with constrained AI (500 tokens, 0.7 temp)
4. Scores on 6 psychological dimensions
5. Gates quality at 75, retries with specific hints
6. Serves all 6 customer categories with targeted templates

## What V5 Is Not

- Not a prompt engineering showcase
- Not an intelligence data dump
- Not a "generate and hope" system
- Not a novelty-focused content spinner

## Build Timeline

| Phase | Days | Deliverable |
|-------|------|-------------|
| Core Engine | 1-3 | Data + Templates + Scoring |
| Generation Pipeline | 4-6 | AI + Orchestration + Intelligence |
| Integration & UI | 7-9 | Hooks + Components + Testing |
| Template Expansion | 10-12 | Library + Validation |

**Total: 12 working days (~2.5 weeks)**

## Key Differentiators from V4

1. **Templates first** - AI enhances, doesn't create
2. **Constrained creativity** - 500 tokens, 0.7 temp
3. **Quality gating** - Score ≥75 or retry
4. **Psychology scoring** - 6 dimensions that predict engagement
5. **Focused intelligence** - One insight per source, not data dump
6. **Customer category targeting** - Templates mapped to 6 buyer types

---

## Files to Create

```
src/services/v5/
├── index.ts
├── types.ts
├── content-orchestrator.ts
├── template.service.ts
├── synapse-scorer.service.ts
├── ai-enhancer.service.ts
├── industry-profile.service.ts
├── uvp-provider.service.ts
├── eq-integration.service.ts
├── intelligence.service.ts
└── embeddings.service.ts

src/data/v5/
├── universal-templates.ts
├── platform-constraints.ts
└── scoring-config.ts

src/hooks/
└── useV5ContentGeneration.ts

src/components/v5/
├── V5ContentPanel.tsx
├── ContentCard.tsx
├── ScoreDisplay.tsx
└── QualityBadge.tsx

src/pages/
└── V5ContentPage.tsx

supabase/functions/
└── v5-generate/index.ts
```
