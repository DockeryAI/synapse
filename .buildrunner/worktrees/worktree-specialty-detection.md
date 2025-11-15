# Worktree Task: Deep Specialty Detection Engine

**Feature ID:** `specialty-detection-engine`
**Branch:** `feature/specialty-detection`
**Estimated Time:** 6 hours
**Priority:** CRITICAL
**Dependencies:** Foundation, Intelligence Gatherer
**Worktree Path:** `../synapse-specialty`

---

## Context

Detect business specialties/niches vs generic industry. "Wedding bakery" not just "bakery", "antique car insurance" not just "insurance". Enables hyper-targeted content.

---

## Setup

```bash
cd /Users/byronhudson/Projects/Synapse
git worktree add ../synapse-specialty feature/specialty-detection
cd ../synapse-specialty
npm install
```

---

## Task Checklist

### File: `src/services/specialty-detection.service.ts`

- [ ] `detectSpecialty(websiteData: WebsiteData, industry: string): Promise<SpecialtyResult>`
  - Analyze website content from Intelligence Gatherer
  - Use Claude Opus to identify specialty keywords
  - Compare against generic industry terms
  - Return specialty classification

- [ ] `extractSpecialtyKeywords(content: string[]): Promise<string[]>`
  - Find repeated specialty terms
  - Weight by frequency and prominence
  - Filter out generic industry words

- [ ] `classifyNicheLevel(specialty: SpecialtyResult): 'generic' | 'specialized' | 'hyper-niche'`
  - Generic: "bakery", "insurance", "dentist"
  - Specialized: "wedding bakery", "auto insurance", "cosmetic dentist"
  - Hyper-niche: "vegan wedding cake bakery", "antique car insurance", "sedation dentistry for anxious patients"

### Opus Prompt

```typescript
const prompt = `
Analyze this business and identify its specialty/niche:

Industry: ${industry}
Website Content: ${websiteContent}
Services Offered: ${services}

Determine:
1. Is this a generic business or specialized?
2. What is their specific niche/specialty?
3. Key differentiating keywords
4. Target market specificity

Return JSON: { specialty: string, keywords: string[], nicheLevel: string, targetMarket: string }
`
```

---

## Type Definitions

```typescript
export interface SpecialtyResult {
  specialty: string // "vegan wedding cake bakery"
  genericIndustry: string // "bakery"
  keywords: string[] // ["vegan", "wedding", "custom cakes"]
  nicheLevel: 'generic' | 'specialized' | 'hyper-niche'
  targetMarket: string // "health-conscious couples planning weddings"
  confidence: number
}
```

---

## Integration

**Used by:**
- UVP Wizard (specialty informs UVP suggestions)
- Campaign Generator (content tailored to specialty)
- Industry Profile (specialty-specific content pillars)

**Exports:**
```typescript
export const SpecialtyDetector = {
  detectSpecialty,
  extractSpecialtyKeywords,
  classifyNicheLevel
}
```

---

## Testing

```typescript
it('detects wedding bakery specialty', async () => {
  const result = await detectSpecialty(websiteData, 'bakery')
  expect(result.specialty).toContain('wedding')
  expect(result.nicheLevel).toBe('specialized')
})

it('identifies hyper-niche businesses', async () => {
  const result = await detectSpecialty(veganWeddingData, 'bakery')
  expect(result.nicheLevel).toBe('hyper-niche')
  expect(result.keywords).toContain('vegan')
})
```

---

## Completion Criteria

- [ ] Specialty detection working with Opus
- [ ] Niche classification accurate
- [ ] Keyword extraction functional
- [ ] Integrates with Intelligence Gatherer
- [ ] Types exported
- [ ] Tested with 3+ businesses
- [ ] No TS errors

---

## Commit

```bash
git commit -m "feat: Add deep specialty detection engine

- Niche vs generic classification
- Specialty keyword extraction
- 3-tier niche level system
- Claude Opus analysis integration
- Target market identification

Implements specialty-detection-engine feature"
```
