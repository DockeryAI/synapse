# Build Plan: Universal Intelligence Engine

**Created:** 2025-12-05
**Status:** Planning
**Branch:** feature/synapse-v6-engine

---

## Overview

One engine, multiple configurations. Dictionary filters eliminate noise before V1's connection engine (embeddings + unexpectedness scoring) finds breakthrough angles.

### Architecture Summary

```
UVP Entered
    │
    ▼
BusinessPurposeDetector builds dictionaries
    │
    ▼
Profile detected → API Source Map selected
    │
    ▼
APIs called with source-specific queries
    │
    ▼
┌─────────────────────────────────┐
│  DICTIONARY FILTER LAYER        │
│  - Industry (from UVP)          │
│  - Audience (from UVP)          │
│  - Pain (source-specific)       │
│  - Category boost (optional)    │
│  Must match ≥1 filter to pass   │
└─────────────────────────────────┘
    │
    ▼ (50-200 filtered insights)
┌─────────────────────────────────┐
│  V1 CONNECTION ENGINE           │
│  - Embeddings (text-embedding-3-small)
│  - Cosine similarity ≥0.65      │
│  - Cross-domain unexpectedness  │
│  - Three-way bonus (+40%)       │
└─────────────────────────────────┘
    │
    ▼
Top connections → Cortex (profile-weighted)
    │
    ▼
Content generation with cost equivalences
```

---

## Phase 1: Dictionary Infrastructure

### 1A: Industry Dictionary Builder
**File:** `src/services/synapse-v6/dictionaries/industry.dictionary.ts` (NEW)
**Priority:** CRITICAL

```typescript
interface IndustryDictionary {
  primary: string[];      // "insurance"
  synonyms: string[];     // "insurer", "carrier", "underwriter"
  related: string[];      // "policy", "premium", "claims"
  companies?: string[];   // "MetLife", "Prudential" (optional)
  sicCodes?: string[];    // "6311", "6321" (for SEC filtering)
}
```

Builds from: `uvp.targetCustomer.industry`
Expands using: Pre-built industry term maps

### 1B: Audience Dictionary Builder
**File:** `src/services/synapse-v6/dictionaries/audience.dictionary.ts` (NEW)
**Priority:** CRITICAL

```typescript
interface AudienceDictionary {
  roles: string[];        // "sales leader", "VP sales", "CRO"
  departments: string[];  // "sales", "revenue", "operations"
  functions: string[];    // "quota", "pipeline", "conversion"
}
```

Builds from: `uvp.targetCustomer.role`, `uvp.customerProfiles[].role`

### 1C: Pain Dictionary (Source-Specific)
**File:** `src/services/synapse-v6/dictionaries/pain.dictionary.ts` (NEW)
**Priority:** CRITICAL

```typescript
const painDictionaries: Record<SourceType, string[]> = {
  'consumer-reviews': ['terrible', 'worst', 'waste', 'disappointed', 'never again'],
  'b2b-reviews': ['lacks', 'missing', 'wish', 'clunky', 'no support', 'cons'],
  'social-emotional': ['frustrated', 'hate', 'struggling', 'nightmare', 'help', 'rant'],
  'social-professional': ['lessons learned', 'challenge', 'pivot', 'transformation'],
  'sec-filings': ['risk', 'challenge', 'headwind', 'investing in', 'priority'],
  'job-postings': ['hiring', 'seeking', 'building team', 'scaling', 'urgent'],
  'earnings': ['below expectations', 'headwinds', 'need to improve', 'focusing on'],
};
```

Global per source, NOT per brand.

### 1D: Category Dictionary Builder
**File:** `src/services/synapse-v6/dictionaries/category.dictionary.ts` (NEW)
**Priority:** HIGH

```typescript
interface CategoryDictionary {
  primary: string[];      // "AI", "artificial intelligence"
  productType: string[];  // "chatbot", "automation", "agent"
  outcomes: string[];     // "automate", "self-service", "digital transformation"
}
```

Builds from: `uvp.productsServices`, `uvp.uniqueSolution`
Used for: Boost scoring (1.1-1.3x), NOT hard filtering

---

## Phase 2: Filter Layer

### 2A: Dictionary Filter Service
**File:** `src/services/synapse-v6/dictionary-filter.service.ts` (NEW)
**Priority:** CRITICAL

```typescript
interface FilterResult {
  passes: boolean;
  matchedFilters: ('industry' | 'audience' | 'pain')[];
  categoryBoost: number;  // 1.0 - 1.3
}

function filterInsight(
  insight: RawInsight,
  industryDict: IndustryDictionary,
  audienceDict: AudienceDictionary,
  source: SourceType
): FilterResult;
```

Logic:
- Must match ≥1 of: Industry OR Audience OR Pain
- Category gives optional boost
- Source determines which pain dictionary to use

### 2B: Integration with API Orchestrator
**File:** `src/services/synapse-v6/api-orchestrator.service.ts` (MODIFY)
**Priority:** CRITICAL

Add filter step after API calls, before connection engine:

```typescript
// After collecting raw results
const filteredResults = rawResults.filter(result =>
  dictionaryFilterService.filterInsight(result, industryDict, audienceDict, result.source).passes
);
```

---

## Phase 3: Connection Engine (V1 Mechanics)

### 3A: Embedding Service
**File:** `src/services/synapse-v6/connections/EmbeddingService.ts` (EXISTS - verify/enhance)
**Priority:** CRITICAL

Requirements:
- OpenAI text-embedding-3-small (1536 dimensions)
- Batch processing for efficiency
- Caching for repeated comparisons

### 3B: Connection Hint Generator
**File:** `src/services/synapse-v6/connections/connection-hint-generator.ts` (NEW)
**Priority:** CRITICAL

```typescript
interface ConnectionHint {
  insight1: FilteredInsight;
  insight2: FilteredInsight;
  similarity: number;           // Cosine similarity (≥0.65 threshold)
  unexpectedness: number;       // 0-100 based on domain difference
  domains: [string, string];    // e.g., ['sec-filings', 'job-postings']
}
```

Unexpectedness scoring:
- Same domain (review ↔ review): 30-50%
- Cross domain (SEC ↔ job posting): 80-100%

### 3C: Three-Way Connection Detector
**File:** `src/services/synapse-v6/connections/three-way-detector.ts` (NEW)
**Priority:** HIGH

```typescript
interface ThreeWayConnection {
  insights: [FilteredInsight, FilteredInsight, FilteredInsight];
  domains: [string, string, string];  // All must be different
  averageSimilarity: number;
  bonus: 0.4;  // +40% breakthrough bonus
  totalScore: number;
}
```

Three unique domains = "holy shit" moment

### 3D: Connection Scorer
**File:** `src/services/synapse-v6/connections/connection-scorer.ts` (NEW)
**Priority:** CRITICAL

```typescript
interface ConnectionScore {
  semanticSimilarity: number;   // 30% weight
  unexpectedness: number;       // 25% weight
  psychologyRelevance: number;  // 15% weight
  competitiveAdvantage: number; // 15% weight
  timeliness: number;           // 10% weight
  threeWayBonus: number;        // +40% if applicable
  finalScore: number;           // 0-100
}
```

Impact levels:
- ≥85: "Holy shit" breakthrough
- ≥80: High value
- ≥60: Good insight
- <60: Supporting evidence only

---

## Phase 4: Domain Configuration

### 4A: B2C Domain Map
**File:** `src/services/synapse-v6/domains/b2c-domains.ts` (NEW)
**Priority:** HIGH

```typescript
const b2cDomains = {
  weather: ['weather-api'],
  localEvents: ['events-api', 'local-news'],
  reviews: ['yelp', 'google-maps'],
  socialTrends: ['twitter', 'tiktok', 'reddit'],
  news: ['serper-news', 'newsapi'],
};
```

### 4B: B2B Domain Map
**File:** `src/services/synapse-v6/domains/b2b-domains.ts` (NEW)
**Priority:** HIGH

```typescript
const b2bDomains = {
  corporateFilings: ['sec-api-io', 'companies-house'],
  talentSignals: ['job-postings'],  // Future: LinkedIn Jobs API
  fundingMA: ['crunchbase', 'news'],
  executiveVoice: ['linkedin-serper', 'earnings'],
  community: ['g2', 'capterra', 'hackernews', 'reddit-professional'],
};
```

### 4C: Domain-to-Source Mapper
**File:** `src/services/synapse-v6/domains/domain-mapper.ts` (NEW)
**Priority:** HIGH

Maps each API source to its domain for unexpectedness calculation.

---

## Phase 5: Cortex Weights by Profile

### 5A: B2B Cortex Principles
**File:** `src/services/synapse-v6/cortex/b2b-principles.ts` (NEW)
**Priority:** MEDIUM

Add 5 B2B principles to existing 9:

```typescript
const b2bPrinciples = {
  careerSafety: "Never be blamed for this decision",
  consensusEnabling: "Easy to defend to stakeholders",
  statusQuoRisk: "The cost of doing nothing is X",
  personalValue: "Career advancement, reduced stress",
  riskMitigation: "Pilot programs, phased rollouts, guarantees",
};
```

### 5B: Profile-Based Cortex Weights
**File:** `src/services/synapse-v6/cortex/cortex-weights.ts` (NEW)
**Priority:** MEDIUM

```typescript
const cortexWeights: Record<ProfileType, CortexWeights> = {
  'local-b2c': {
    curiosityGap: 90, scarcity: 85, lossAversion: 80,
    careerSafety: 10, consensusEnabling: 5,
  },
  'national-saas-b2b': {
    curiosityGap: 50, scarcity: 20, lossAversion: 90,
    careerSafety: 95, consensusEnabling: 90,
  },
  // ... other profiles
};
```

---

## Phase 6: Cost Equivalence Extension

### 6A: B2B Cost Equivalence Database
**File:** `src/services/synapse-v6/cost-equivalences/b2b-costs.ts` (NEW)
**Priority:** MEDIUM

```typescript
const b2bCostEquivalences = [
  { item: 'Junior developer salary', monthly: 8000, annual: 96000, emotionalWeight: 'HIGH', targetPersona: 'CTO' },
  { item: 'Customer churn (1%)', formula: 'revenue * 0.01', emotionalWeight: 'VERY_HIGH', targetPersona: 'CEO/Board' },
  { item: 'Failed implementation', annual: 500000, emotionalWeight: 'VERY_HIGH', targetPersona: 'All B2B' },
  { item: 'Compliance penalty', annual: 'exposure', emotionalWeight: 'VERY_HIGH', targetPersona: 'CFO/Legal' },
  { item: 'Extra sales cycle month', formula: 'pipeline * 0.08', emotionalWeight: 'HIGH', targetPersona: 'CRO' },
];
```

### 6B: Hook Generator Extension
**File:** `src/services/synapse-v6/cost-equivalences/hook-generator.ts` (MODIFY)
**Priority:** MEDIUM

Add B2B hook templates:
- "Your 2% churn costs more than 3 senior developers"
- "Every extra month in your sales cycle = 8% of pipeline at risk"

---

## Phase 7: BusinessPurposeDetector Enhancement

### 7A: Dictionary Generation Integration
**File:** `src/services/intelligence/business-purpose-detector.service.ts` (MODIFY)
**Priority:** CRITICAL

Add method to build all dictionaries from UVP:

```typescript
interface BrandDictionaries {
  industry: IndustryDictionary;
  audience: AudienceDictionary;
  category: CategoryDictionary;
  profile: ProfileType;
  domains: DomainMap;  // B2C or B2B based on profile
}

function buildBrandDictionaries(uvp: CompleteUVP): BrandDictionaries;
```

---

## Implementation Order

| Phase | Component | Files | Priority | Est. Lines |
|-------|-----------|-------|----------|------------|
| 1A | Industry Dictionary | industry.dictionary.ts | CRITICAL | ~100 |
| 1B | Audience Dictionary | audience.dictionary.ts | CRITICAL | ~80 |
| 1C | Pain Dictionary | pain.dictionary.ts | CRITICAL | ~60 |
| 1D | Category Dictionary | category.dictionary.ts | HIGH | ~60 |
| 2A | Filter Service | dictionary-filter.service.ts | CRITICAL | ~120 |
| 2B | Orchestrator Integration | api-orchestrator.service.ts | CRITICAL | ~50 |
| 3A | Embedding Service | EmbeddingService.ts | CRITICAL | Exists |
| 3B | Connection Generator | connection-hint-generator.ts | CRITICAL | ~150 |
| 3C | Three-Way Detector | three-way-detector.ts | HIGH | ~80 |
| 3D | Connection Scorer | connection-scorer.ts | CRITICAL | ~100 |
| 4A | B2C Domains | b2c-domains.ts | HIGH | ~30 |
| 4B | B2B Domains | b2b-domains.ts | HIGH | ~30 |
| 4C | Domain Mapper | domain-mapper.ts | HIGH | ~50 |
| 5A | B2B Principles | b2b-principles.ts | MEDIUM | ~40 |
| 5B | Cortex Weights | cortex-weights.ts | MEDIUM | ~80 |
| 6A | B2B Cost Database | b2b-costs.ts | MEDIUM | ~60 |
| 6B | Hook Generator | hook-generator.ts | MEDIUM | ~40 |
| 7A | BusinessPurpose | business-purpose-detector.service.ts | CRITICAL | ~100 |

**Total new code:** ~1,230 lines across 15 files + modifications to 2 existing

---

## Success Criteria

1. **Filtering works:** 1000 raw results → 50-200 relevant insights
2. **Connections found:** Cross-domain links with unexpectedness scores
3. **Three-way bonus:** Triple-domain connections get +40%
4. **B2B signals:** SEC + Job postings + LinkedIn = valid connection
5. **Profile-appropriate:** B2B profiles weight Career Safety high, Scarcity low
6. **Cost hooks:** B2B costs generate enterprise-relevant hooks

---

## Dependencies

- OpenAI API (embeddings) - EXISTS
- SEC API - EXISTS
- Companies House - EXISTS
- Job postings API - FUTURE (Phase 8)
- Earnings call data - FUTURE (Phase 9)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Embedding costs | Batch processing, caching, filter first |
| SEC rate limits | Existing rate limiting in sec-api-io |
| Cold start (no industry terms) | Fallback to raw UVP terms |
| Low filter match rate | Log and tune dictionary expansions |

---

*This file persists build planning decisions and should be referenced throughout implementation.*
