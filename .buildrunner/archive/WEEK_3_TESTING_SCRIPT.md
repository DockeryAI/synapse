# Week 3 Testing Script - Dashboard V2

## Overview
Testing checkpoint for Weeks 1-2 foundation. Complete all sections before proceeding to Week 4.

---

## 1. User Testing Sessions

### A. Content Template Flow
**Test URL**: `/v2-test` or `/campaign-builder`

| Test | Steps | Expected | Pass/Fail |
|------|-------|----------|-----------|
| Template Selection | 1. Navigate to content mode<br>2. Select 5 different templates | All 20 templates accessible and distinct | [ ] |
| Title Uniqueness | 1. Generate content from same input with 3 templates<br>2. Compare titles | All titles unique, no duplicates | [ ] |
| Industry Adaptation | 1. Set industry to "Healthcare"<br>2. Generate content<br>3. Change to "SaaS"<br>4. Generate again | Tone/language adapts to industry | [ ] |
| Platform Optimization | 1. Generate for LinkedIn<br>2. Generate for Twitter<br>3. Generate for Instagram | Length/format matches platform norms | [ ] |

### B. Campaign Builder Flow

| Test | Steps | Expected | Pass/Fail |
|------|-------|----------|-----------|
| Campaign Creation | 1. Go to `/campaign-builder`<br>2. Select template<br>3. Set purpose | Campaign initializes correctly | [ ] |
| Arc Visualization | 1. Create campaign with 5+ pieces<br>2. View timeline | Phases display with dates | [ ] |
| Piece Generation | 1. Generate all pieces<br>2. Check emotional triggers | Each piece has unique trigger | [ ] |
| Mode Toggle | 1. Switch content/campaign modes<br>2. Verify context changes | Mode persists, UI updates | [ ] |

### C. Brand Context

| Test | Steps | Expected | Pass/Fail |
|------|-------|----------|-----------|
| Brand Loading | 1. Navigate with brand in context<br>2. Check brand name display | Brand info populates correctly | [ ] |
| No Brand Handling | 1. Clear brand context<br>2. Navigate to campaign builder | Graceful redirect to onboarding | [ ] |

---

## 2. Integration Testing

### A. Service Integration

```bash
# Run all V2 tests
npm test -- --grep "v2"

# Expected: 400+ tests pass
```

| Service | Test Command | Target | Status |
|---------|-------------|--------|--------|
| Purpose Detection | `npm test purpose-detection` | 100% | [ ] |
| Industry Customization | `npm test industry-customization` | 100% | [ ] |
| Arc Generator | `npm test arc-generator` | 100% | [ ] |
| Narrative Engine | `npm test narrative-engine` | 100% | [ ] |
| Campaign Builder | `npm test campaign-builder` | 100% | [ ] |

### B. Database Integration

```sql
-- Run in Supabase SQL editor

-- Test campaigns table exists
SELECT COUNT(*) FROM campaigns;

-- Test campaign_pieces table exists
SELECT COUNT(*) FROM campaign_pieces;

-- Test RLS policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('campaigns', 'campaign_pieces');
```

| Test | Expected | Status |
|------|----------|--------|
| Campaigns table created | Table exists with all columns | [ ] |
| Campaign pieces table created | Table exists with all columns | [ ] |
| RLS enabled | Policies active on both tables | [ ] |
| Indexes created | 6 indexes on campaign tables | [ ] |

### C. Route Integration

| Route | Component | Works | Status |
|-------|-----------|-------|--------|
| `/campaign-builder` | CampaignBuilderPage | Loads correctly | [ ] |
| `/v2-test` | V2TestPage | Loads correctly | [ ] |
| Back to dashboard | Navigation | Returns to `/dashboard` | [ ] |

---

## 3. Performance Benchmarks

### A. Generation Speed

| Operation | Target | Measured | Status |
|-----------|--------|----------|--------|
| Content template generation | < 100ms | ___ms | [ ] |
| Campaign arc generation | < 500ms | ___ms | [ ] |
| 5-piece campaign creation | < 2s | ___ms | [ ] |
| Industry customization | < 50ms | ___ms | [ ] |

### B. Memory & Load

| Metric | Target | Measured | Status |
|--------|--------|----------|--------|
| Initial page load | < 3s | ___s | [ ] |
| Bundle size increase | < 50KB | ___KB | [ ] |
| Memory usage | Stable | ___MB | [ ] |

### C. Test Suite Performance

```bash
# Run full test suite with timing
time npm test

# Expected: < 60 seconds
```

---

## 4. Gap Identification

### A. Feature Completeness Checklist

**Week 1 - Foundation**
- [ ] ModeContext implemented and working
- [ ] 20 content templates registered
- [ ] 15 campaign templates registered
- [ ] Purpose detection service functional
- [ ] Industry customization service functional
- [ ] Title uniqueness tests passing

**Week 2 - Campaign Core**
- [ ] Arc generator creates emotional progression
- [ ] Narrative engine generates coherent content
- [ ] Campaign builder UI functional
- [ ] Phase management working
- [ ] Piece ordering maintained
- [ ] Database migrations applied

### B. Known Issues to Document

| Issue | Severity | Notes |
|-------|----------|-------|
| | | |
| | | |
| | | |

### C. Improvement Opportunities

| Area | Current | Ideal | Priority |
|------|---------|-------|----------|
| | | | |
| | | | |

---

## 5. Test Execution Commands

```bash
# Full V2 test suite
npm test -- src/__tests__/v2/

# Individual test files
npm test -- src/__tests__/v2/title-uniqueness.test.ts
npm test -- src/__tests__/v2/purpose-detection.test.ts
npm test -- src/__tests__/v2/industry-customization.test.ts
npm test -- src/__tests__/v2/arc-generator.test.ts
npm test -- src/__tests__/v2/narrative-engine.test.ts
npm test -- src/__tests__/v2/campaign-builder.test.ts

# TypeScript check
npx tsc --noEmit

# Lint (if configured)
npm run lint
```

---

## 6. Sign-off

### Test Summary

| Category | Tests | Pass | Fail | Notes |
|----------|-------|------|------|-------|
| User Testing | 12 | | | |
| Integration | 8 | | | |
| Performance | 7 | | | |
| **Total** | **27** | | | |

### Approval

- [ ] All critical tests pass
- [ ] Performance within targets
- [ ] No blocking issues
- [ ] Ready for Week 4

**Tester**: _________________
**Date**: _________________
**Notes**: _________________

---

## Next Steps After Week 3

If all tests pass:
1. Merge to main branch
2. Tag release v0.2.0-week3
3. Begin Week 4 (Publishing Pipeline)

If tests fail:
1. Document failures in gap analysis
2. Create fix tasks
3. Re-test before proceeding
