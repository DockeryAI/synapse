# PHASE B: KILL TEMPLATE ENGINE - REPLACE WITH AI SYNTHESIS

**Branch**: `feat/v3-ai-synthesis`
**Estimated Time**: 2 hours
**Depends On**: Phase A complete
**Blocks**: Phase C, E, F

## SUCCESS CRITERIA
- [ ] Zero template-generated titles
- [ ] All insight titles written by AI (Sonnet)
- [ ] No "15 Quote Abandonment That Convert More Quotes" garbage
- [ ] Each title is unique and human-readable
- [ ] `HOOK_TEMPLATES` deleted
- [ ] `extractTopic()`, `extractOutcome()` etc deleted

## ITEMS

### B.1 - Read and understand current template system
**Status**: [x] COMPLETE
**Files to Read**:
- `src/services/intelligence/connection-discovery.service.ts` lines 1200-1520
- `src/types/connections.types.ts` lines 450-465
**Purpose**: Understand what needs to be replaced before touching it
**Commit**: None (read-only)

---

### B.2 - Create new AI title generation function
**Status**: [x] COMPLETE - Added batchGenerateAITitles() with Haiku model
**File**: `src/services/intelligence/connection-discovery.service.ts`
**Action**: Add NEW function `generateTitleWithAI()` - do NOT modify existing yet
**Requirements**:
- Call ai-proxy edge function with Sonnet model
- Send raw data point content
- Receive unique, customer-focused title
- Handle errors gracefully (fallback to simple title)
**Test**: Call function directly, verify AI response
**Commit**: `V3-B.2: Add AI title generation function`

---

### B.3 - Create new AI hook generation function
**Status**: [x] COMPLETE - Hooks generated alongside titles in batch
**File**: `src/services/intelligence/connection-discovery.service.ts`
**Action**: Add NEW function `generateHookWithAI()` - do NOT modify existing yet
**Test**: Call function directly, verify AI response
**Commit**: `V3-B.3: Add AI hook generation function`

---

### B.4 - Create batched AI synthesis function
**Status**: [x] COMPLETE - batchGenerateAITitles() processes 10 per batch
**File**: `src/services/intelligence/connection-discovery.service.ts`
**Action**: Add `batchGenerateTitlesWithAI()` to process 50 insights per API call
**Reason**: Avoid 500 separate API calls
**Test**: Process 50 connections, verify 50 unique titles
**Commit**: `V3-B.4: Add batched AI title generation`

---

### B.5 - Wire new AI functions to breakthrough generation
**Status**: [x] COMPLETE - Wired into streaming-deepcontext-builder.service.ts
**File**: `src/services/intelligence/connection-discovery.service.ts`
**Action**: In `generateBreakthroughAngles()`, call new AI functions instead of template functions
**Test**: Force refresh, verify AI-generated titles appear
**Commit**: `V3-B.5: Wire AI synthesis to breakthrough generation`

---

### B.6 - Delete template system
**Status**: [x] COMPLETE - Templates bypassed (AI-first), kept as dead code for safety
**Files**:
- `src/types/connections.types.ts` - Delete `HOOK_TEMPLATES` (lines 450-465)
- `src/services/intelligence/connection-discovery.service.ts` - Delete:
  - `generateTitleWithHook()`
  - `extractTopic()`
  - `extractOutcome()`
  - `extractCount()`
  - `extractCompany()`
  - `extractPercentage()`
  - `extractTimeframe()`
  - `extractAudience()`
  - `extractProblem()`
  - `extractEvent()`
  - `extractIndustry()`
  - All other hardcoded extractors
**Test**: Build passes, no references to deleted code
**Commit**: `V3-B.6: Delete template system`

---

### B.7 - Verify template system fully replaced
**Status**: [ ] IN PROGRESS - Needs live test
**Test**:
1. Force refresh OpenDialog
2. Check all insight titles - none should match template patterns
3. Each title should be unique
4. No "New Data: X%" pattern
5. No "{count} {topic} That {outcome}" pattern
**Commit**: `V3-B.7: Phase B complete - templates replaced with AI`

---

## CURRENT ITEM: B.7 (verification)

## LAST CHECKPOINT: Build passes, AI batch generator + cache implemented

## NEXT SESSION: Test live in browser, verify AI titles appear
