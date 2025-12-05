# V1 WIRING BUILD PLAN

**Created:** 2025-12-04
**Purpose:** STOP BUILDING NEW SERVICES. WIRE EXISTING ONES.
**Success Criteria:** VoC tab shows outcome-relevant content, not generic industry keywords.

---

## THE PROBLEM (Why Previous 10 Builds Failed)

Every build said "wire outcome detection" but then:
1. Added more features to OutcomeDetectionService
2. Created more types and interfaces
3. Built more query construction layers
4. Never actually called the service from where queries are built

**Root Cause:** We optimized the engine but never connected it to the wheels.

---

## PHASE 1: THE ONE WIRING FIX (Do This First, Test Before Moving On)

### 1.1 Import Outcome Detection into StreamingDeepContextBuilder

**File:** `src/services/intelligence/streaming-deepcontext-builder.service.ts`

**Line ~30 (imports section):**
```typescript
// ADD THIS IMPORT
import { outcomeDetectionService, type DetectedOutcome, type OutcomeDetectionResult } from '@/services/synapse-v6/outcome-detection.service';
```

### 1.2 Store Detected Outcomes on Brand Load

**File:** `src/services/intelligence/streaming-deepcontext-builder.service.ts`

**Find the method that loads UVP data (likely around line 150-200)**

After UVP is loaded, add:
```typescript
// Detect outcomes from UVP customer profiles
private detectedOutcomes: DetectedOutcome[] = [];

// In the method that loads UVP:
if (this.uvpData?.customerProfiles) {
  const result = outcomeDetectionService.detectOutcomes(this.uvpData);
  this.detectedOutcomes = result.outcomes;
  console.log(`[V1 WIRING] Detected ${this.detectedOutcomes.length} customer outcomes`);
}
```

### 1.3 Pass Outcomes to Query Builder

**File:** `src/services/synapse-v6/uvp-context-builder.service.ts`

**Find `extractShortQuery()` function**

Modify signature:
```typescript
export function extractShortQuery(
  uvp: CompleteUVP,
  tab: string,
  detectedOutcomes?: DetectedOutcome[]  // NEW PARAM
): string
```

Inside the function, if detectedOutcomes exist, use them:
```typescript
if (detectedOutcomes && detectedOutcomes.length > 0) {
  // Get top 3 outcomes by impact score
  const topOutcomes = detectedOutcomes
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, 3)
    .map(o => o.statement)
    .join(' ');
  return topOutcomes.substring(0, 100); // Respect API limits
}
// Else fall back to existing keyword extraction
```

### 1.4 Wire It Through API Orchestrator

**File:** `src/services/synapse-v6/api-orchestrator.service.ts`

**Line ~19 (imports):**
```typescript
// ADD THIS IMPORT
import { outcomeDetectionService, type DetectedOutcome } from './outcome-detection.service';
```

**In the orchestrator class, store outcomes:**
```typescript
private detectedOutcomes: DetectedOutcome[] = [];
```

**In the init/start method, detect outcomes:**
```typescript
// After loading brand profile with UVP
if (brandProfile.uvp?.customerProfiles) {
  const result = outcomeDetectionService.detectOutcomes(brandProfile.uvp);
  this.detectedOutcomes = result.outcomes;
}
```

**In the query building, pass outcomes:**
```typescript
// When calling extractShortQuery or buildTabQuery
const query = extractShortQuery(uvp, tab, this.detectedOutcomes);
```

---

## VERIFICATION CHECKPOINT (STOP HERE AND TEST)

Before moving to Phase 2:

1. Run the app
2. Load a brand with customer profiles (OpenDialog)
3. Open browser console
4. Look for: `[V1 WIRING] Detected X customer outcomes`
5. Check VoC tab API calls - do they contain outcome statements?

**If YES:** Proceed to Phase 2
**If NO:** Debug Phase 1 before adding more complexity

---

## PHASE 2: PSYCHOLOGY PRINCIPLE ROUTING (Only After Phase 1 Works)

### 2.1 Import ContentPsychologyEngine into Content Generation

**File:** `src/services/synapse-v6/v6-content-generation.service.ts`

```typescript
import { contentPsychologyEngine } from './generation/ContentPsychologyEngine';
```

### 2.2 Route Format by Principle Instead of Tab

Replace source-tab-based format selection with:
```typescript
function selectFormatByPrinciple(insight: V6Insight, dominantPrinciple: string): FormatType {
  const principleToFormat = {
    'curiosity_gap': 'hook-post',
    'loss_aversion': 'data-post',
    'narrative_transportation': 'story-post',
    'cognitive_dissonance': 'controversial-post',
    'social_proof': 'data-post',
    'authority': 'data-post',
    'pattern_interrupt': 'hook-post',
  };
  return principleToFormat[dominantPrinciple] || 'hook-post';
}
```

---

## PHASE 3: COMPLETE V1 CHAIN (Only After Phase 2 Works)

### 3.1 Re-activate ContrarianAngleDetector
- Move from `_ARCHIVED/analysis/` to active `analysis/`
- Import in v6-content-generation.service.ts
- Call after connection discovery

### 3.2 Wire CostEquivalenceCalculator
- Already exists in `helpers/CostEquivalenceCalculator.ts`
- Import in v6-content-generation.service.ts
- Call for "reduce cost" outcomes

### 3.3 Pass ConnectionHints to Generation
- ConnectionHintGenerator already calculates hints
- Pass hint.unexpectedness + hint.novelty to LLM prompt context

---

## ANTI-PATTERNS (Do NOT Do These)

1. ❌ Create new services
2. ❌ Add new types without using them
3. ❌ Build more query construction layers
4. ❌ Mark phases complete without testing
5. ❌ Move to Phase 2 before Phase 1 works

---

## SUCCESS METRICS

### Phase 1 Success:
- [ ] Console shows "Detected X customer outcomes" on brand load
- [ ] VoC API queries contain outcome statements, not industry keywords
- [ ] For OpenDialog: queries include "sales automation" or "lead recovery" not just "insurance software"

### Phase 2 Success:
- [ ] Hook posts generated for curiosity gap insights
- [ ] Story posts generated for cross-domain connections
- [ ] Format selection logged with principle reasoning

### Phase 3 Success:
- [ ] Content includes cost equivalence hooks ("$X/day if ignored")
- [ ] Contrarian angles surface in competitive insights
- [ ] Connection hints visible in generated content metadata

---

## ESTIMATED TIME

- Phase 1: 2-3 hours (4 file changes, ~50 lines total)
- Phase 2: 2 hours (2 file changes, ~30 lines)
- Phase 3: 3 hours (3 file changes, ~60 lines)

**Total: 7-8 hours of actual wiring, not building**

---

## WHY THIS WILL WORK

1. **Concrete file paths and line numbers** - No ambiguity
2. **Verification checkpoints** - Can't skip ahead
3. **Minimal code changes** - Adding imports and 5-10 line blocks
4. **Uses existing services** - No new classes or types
5. **Console logging** - Visible proof it's working

---

*This plan wires existing services. Do NOT add features. Do NOT create types. Wire. Test. Move on.*
