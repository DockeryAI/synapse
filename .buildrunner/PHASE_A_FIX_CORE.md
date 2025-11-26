# PHASE A: FIX CORE
## Priority: P0 - CRITICAL
## Estimated Duration: 1-2 days

**Prerequisites**:
- Read `BUILD_INSTRUCTIONS.md` before starting
- Create safety tag: `git tag pre-correlation-enhancement`

---

## PHASE OBJECTIVE

Fix the root cause preventing UVP data from flowing into the intelligence engine. Currently UVP is loaded AFTER APIs run, resulting in generic irrelevant results.

---

## ITEM #1: Fix UVP Timing in Streaming Builder

### Problem
Console shows:
```
[Streaming/serper] Searching for TARGET CUSTOMER insights: {targetCustomer: '', customerSearchTerm: 'Software Publishers'}
```
Empty `targetCustomer` = UVP not loaded when APIs start.

### Files to Read First
- `src/services/intelligence/streaming-deepcontext-builder.service.ts` (lines 1-200, 1200-1300)
- `src/services/database/marba-uvp.service.ts` (getUVPByBrand function)
- `src/types/uvp-flow.types.ts` (CompleteUVP interface)

### Task
1. Load UVP from `marba_uvps` table at START of `buildContext()` method
2. Store UVP data in class property before any API calls
3. Pass UVP context (targetCustomer, painPoints) to `getApisForBusinessType()`

### Acceptance Criteria
- [ ] Console shows `[Streaming/uvp] UVP loaded with X pain points BEFORE APIs`
- [ ] `targetCustomer` is populated in Serper/YouTube search logs
- [ ] No empty string for customerSearchTerm

### Verification
```bash
npm run build
# Then refresh dashboard and check console for UVP loading order
```

### Status: COMPLETE

**Changes Made:**
- Added clear logging block with `========== UVP LOADING START/END ==========`
- Added UVP state verification BEFORE APIs fire
- Integrated `recoverUVPFromSession()` fallback if UVP not found in marba_uvps
- Console now shows: `✅ UVP LOADED SUCCESSFULLY` or `⚠️ NO UVP DATA`

---

## ITEM #2: Pass UVP Context to All API Methods

### Problem
Even if UVP loads, individual API methods don't receive UVP context.

### Files to Read First
- `src/services/intelligence/streaming-deepcontext-builder.service.ts` (runApiWithCallback, case statements)
- `src/services/intelligence/serper-api.ts` (search methods)
- `src/services/intelligence/youtube-api.ts` (search methods)

### Task
1. Add UVP parameter to `runApiWithCallback()` method
2. Pass UVP pain points to Serper search queries
3. Pass UVP target customer to YouTube search queries
4. Pass UVP context to SEMrush keyword filtering

### Acceptance Criteria
- [ ] Serper searches include UVP pain point terms
- [ ] YouTube searches reference target customer
- [ ] API data points return relevant to UVP, not generic industry

### Verification
```bash
npm run build
# Check console for search queries containing UVP terms
```

### Status: COMPLETE

**Changes Made:**
- Added ✅/⚠️ logging to Serper, YouTube, LinkedIn, Perplexity API methods
- Each API now clearly shows if using UVP-TARGETED or FALLBACK generic search
- Console shows actual search terms being used
- No code logic changed - APIs already used `this.uvpData`, just added visibility

---

## ITEM #3: Generate UVP Seed Embeddings

### Problem
Console shows: `Running UVP-seeded clustering with 0 seed centers`
UVP pain points not being converted to embeddings for clustering.

### Files to Read First
- `src/services/intelligence/streaming-deepcontext-builder.service.ts` (generateUVPSeedEmbeddings method)
- `src/services/intelligence/embedding.service.ts` (embed methods)
- `src/types/uvp-flow.types.ts` (pain point structure)

### Task
1. Fix `generateUVPSeedEmbeddings()` to extract pain points from loaded UVP
2. Generate embeddings for each pain point
3. Store in `uvpSeedEmbeddings` class property
4. Verify clustering uses these seeds

### Acceptance Criteria
- [ ] Console shows `Generated X UVP seed embeddings as cluster centers` (X > 0)
- [ ] `performUVPSeededClustering()` receives actual seed centers
- [ ] Clusters form around customer pain points

### Verification
```bash
npm run build
# Check console for seed embedding count > 0
```

### Status: NOT STARTED

---

## ITEM #4: UVP-Filtered Keyword Validation

### Problem
SEMrush returns generic keywords like "dialogue ai", "chatui" that don't relate to UVP.

### Files to Read First
- `src/services/intelligence/streaming-deepcontext-builder.service.ts` (SEMrush data processing)
- `src/services/intelligence/semrush-api.ts` (keyword methods)
- Current UVP pain points for OpenDialog (insurance, compliance, regulated industries)

### Task
1. After SEMrush returns keywords, filter by UVP relevance
2. Score each keyword against UVP pain points (embedding similarity or keyword match)
3. Only keep keywords with >30% relevance score
4. Log filtered vs total count

### Acceptance Criteria
- [ ] Console shows `SEMrush filtered: X/Y keywords passed UVP relevance`
- [ ] No generic keywords like "dialogue ai" in results
- [ ] Keywords relate to compliance, insurance, regulated industries (for OpenDialog)

### Verification
```bash
npm run build
# Check Insights panel - should show relevant keywords only
```

### Status: NOT STARTED

---

## PHASE A COMPLETION CHECKLIST

Before moving to Phase B:

- [ ] All 4 items marked COMPLETE
- [ ] All acceptance criteria verified
- [ ] Build passes with no errors
- [ ] Manual test with real brand (OpenDialog) shows relevant results
- [ ] Commit all changes with proper format
- [ ] Console shows:
  ```
  ✅ [Streaming/uvp] UVP loaded with X pain points BEFORE APIs
  ✅ [Streaming/serper] Searching with UVP context: {targetCustomer: '...'}
  ✅ [Streaming] Generated X UVP seed embeddings (X > 0)
  ✅ [Streaming] SEMrush filtered: X/Y keywords passed UVP relevance
  ```

---

## NOTES / BLOCKERS

(Update this section during implementation)

---

*Phase A must be 100% complete before starting Phase B*
