# PHASE F: CUSTOMER-FIRST CONTENT FOCUS

**Branch**: `feat/v3-customer-focus`
**Estimated Time**: 30 minutes
**Depends On**: Phase E complete
**Blocks**: Nothing (final phase)

## SUCCESS CRITERIA
- [ ] All content written FOR the customer, not ABOUT the business
- [ ] Customer is hero, business is guide
- [ ] CTAs aligned with UVP transformation
- [ ] Zero "Company X increased Y by Z%" titles

## ITEMS

### F.1 - Update AI synthesis prompts for customer focus
**Status**: [ ] NOT STARTED
**File**: `src/services/intelligence/connection-discovery.service.ts`
**Location**: AI title/hook generation prompts
**Add to prompt**:
```
Write content for [BUSINESS]'s CUSTOMERS to read.
The customer is the hero. The business is the guide.
Focus on what the CUSTOMER wants to achieve, fears, and needs.
Never write "Company increased X by Y" - write what the customer gets.
```
**Test**: Generated titles focus on customer outcomes
**Commit**: `V3-F.1: Add customer-first prompt instructions`

---

### F.2 - Add UVP-aligned CTA generation
**Status**: [ ] NOT STARTED
**File**: `src/services/intelligence/connection-discovery.service.ts`
**Action**: Generate CTAs that tie to brand's transformation promise
**Input**: UVP transformation, key benefit
**Output**: CTA that speaks to customer's desired outcome
**Test**: CTAs match funnel stage and UVP
**Commit**: `V3-F.2: Add UVP-aligned CTA generation`

---

### F.3 - Final verification
**Status**: [ ] NOT STARTED
**Test**:
1. Force refresh OpenDialog
2. Read 20 random insight titles
3. All should be customer-focused
4. None should be "Company X did Y"
5. CTAs should match transformation promise
**Commit**: `V3-F.3: Phase F complete - customer-first content`

---

## CURRENT ITEM: Not started (waiting for Phase E)

## LAST CHECKPOINT: N/A

## NEXT SESSION: Complete Phase E first

---

# FINAL GAP ANALYSIS CHECKLIST

After Phase F, verify ALL success criteria from BUILD_INSTRUCTIONS.md:

| Criteria | Target | Actual | Pass? |
|----------|--------|--------|-------|
| Insights | 500+ | | |
| Breakthroughs | 50+ | | |
| Unique titles | 100% | | |
| Build time | <30s | | |
| AI synthesis | Working | | |
| Clustering errors | Zero | | |
| Customer focus | 100% | | |

If any fail, document gaps and create fix items.
