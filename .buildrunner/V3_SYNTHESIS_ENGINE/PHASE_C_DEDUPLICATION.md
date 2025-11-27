# PHASE C: SEMANTIC DEDUPLICATION

**Branch**: `feat/v3-deduplication`
**Estimated Time**: 45 minutes
**Depends On**: Phase B complete
**Blocks**: Phase E

## SUCCESS CRITERIA
- [ ] No two insights with >70% semantic similarity
- [ ] Max 3 insights per core topic
- [ ] Zero duplicate titles
- [ ] Embedding-based comparison (not character matching)

## ITEMS

### C.1 - Add embedding similarity check to deduplication
**Status**: [ ] NOT STARTED
**File**: `src/services/intelligence/connection-discovery.service.ts`
**Location**: `generateBreakthroughAngles()` deduplication logic
**Current**: Character-based check on first 40 chars
**New**: Use `embeddingService.cosineSimilarity()` to compare
**Threshold**: Block if >0.70 similarity
**Test**: Generate insights, verify semantically similar ones blocked
**Commit**: `V3-C.1: Add semantic deduplication`

---

### C.2 - Add topic frequency cap
**Status**: [ ] NOT STARTED
**File**: `src/services/intelligence/connection-discovery.service.ts`
**Action**: Track topic occurrences, skip if topic appears >3 times
**Purpose**: Prevent 10 variations of "Quote Abandonment" insight
**Test**: Force refresh, count insights per topic
**Commit**: `V3-C.2: Add topic frequency cap`

---

### C.3 - Verify deduplication working
**Status**: [ ] NOT STARTED
**Test**:
1. Force refresh OpenDialog
2. No duplicate or near-duplicate titles
3. Topic variety across all insights
4. Console shows deduplication stats
**Commit**: `V3-C.3: Phase C complete - deduplication working`

---

## CURRENT ITEM: Not started (waiting for Phase B)

## LAST CHECKPOINT: N/A

## NEXT SESSION: Complete Phase B first
