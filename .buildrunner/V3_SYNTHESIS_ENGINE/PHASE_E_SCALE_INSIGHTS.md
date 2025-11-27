# PHASE E: SCALE TO 500+ INSIGHTS

**Branch**: `feat/v3-scale-insights`
**Estimated Time**: 1.5 hours
**Depends On**: Phase B, C complete
**Blocks**: Phase F

## SUCCESS CRITERIA
- [ ] 500+ unique insights displayed
- [ ] 50+ breakthroughs
- [ ] Atomization: 1 breakthrough → 6 format variations
- [ ] Raw data points surfaced as "Early Indicators"
- [ ] Variety across journey stages

## ITEMS

### E.1 - Increase breakthrough generation limits
**Status**: [ ] NOT STARTED
**File**: `src/services/intelligence/connection-discovery.service.ts`
**Current**: 150 max breakthroughs
**New**: 300 max breakthroughs
**Location**: `generateBreakthroughAngles()` slice limit
**Test**: Verify more breakthroughs generated
**Commit**: `V3-E.1: Increase breakthrough limit to 300`

---

### E.2 - Create atomization function
**Status**: [ ] NOT STARTED
**File**: `src/services/intelligence/connection-discovery.service.ts`
**Action**: Add `atomizeBreakthrough()` function
**Logic**: Take 1 breakthrough, generate 6 format variations via AI:
1. Hook format (attention-grabbing)
2. Data format (statistic-led)
3. Story format (narrative)
4. FAQ format (question-answer)
5. Comparison format (vs competitors)
6. Controversial format (contrarian take)
**Test**: 50 breakthroughs → 300 atomized insights
**Commit**: `V3-E.2: Add breakthrough atomization`

---

### E.3 - Surface raw data points as Early Indicators
**Status**: [ ] NOT STARTED
**File**: `src/components/dashboard/intelligence-v2/PowerMode.tsx`
**Action**: Display uncorrelated data points with "Early Indicator" badge
**Purpose**: Show all 400+ data points, not just correlated ones
**Test**: Raw data points appear in grid
**Commit**: `V3-E.3: Surface raw data points as Early Indicators`

---

### E.4 - Add journey stage variety enforcement
**Status**: [ ] NOT STARTED
**File**: `src/services/intelligence/connection-discovery.service.ts`
**Action**: Ensure distribution:
- Awareness: 30-40%
- Consideration: 25-35%
- Decision: 20-25%
- Retention: 10-15%
**Test**: Count insights per stage, verify distribution
**Commit**: `V3-E.4: Add journey stage variety enforcement`

---

### E.5 - Verify 500+ insights
**Status**: [ ] NOT STARTED
**Test**:
1. Force refresh OpenDialog
2. Count total insights displayed
3. Must be 500+
4. Verify variety (no repetition)
5. All stages represented
**Commit**: `V3-E.5: Phase E complete - 500+ insights achieved`

---

## CURRENT ITEM: Not started (waiting for Phase B, C)

## LAST CHECKPOINT: N/A

## NEXT SESSION: Complete Phase B, C first
