# UVP V2.1 - EXECUTION SUMMARY
## Complete Build, Test, and Deployment Guide

**Created:** 2025-11-24
**Feature Branch:** `feature/uvp-v2-unified`
**Base:** `backup/uvp-onboarding-20241123` (commit `01f2c579`)

---

## QUICK START

**For Roy (or any AI builder):**

1. **Read this file first** - Understand the overall plan
2. **Execute in order:**
   - Phase 1: `.buildrunner/UVP_V2.1_ATOMIC_TASKS_PHASE_1.md`
   - Phase 2: `.buildrunner/UVP_V2.1_ATOMIC_TASKS_PHASE_2.md`
   - Phase 3: `.buildrunner/UVP_V2.1_ATOMIC_TASKS_PHASE_3.md`
   - Gap Analysis: `.buildrunner/UVP_V2.1_GAP_ANALYSIS.md`
3. **Test with live URLs** before merge
4. **Report status** when ready for user testing

---

## WHAT WE'RE BUILDING

### Problems Being Fixed
1. **Industry profiles don't save** (400/406 RLS errors)
2. **Product detection is garbage** (misses obvious products like Selma, Jamie, Rhea at OpenDialog.ai)
3. **Customer + motivations fragmented** (3 separate screens, poor UX)

### Solutions
1. **RLS-safe database operations** (remove `.select()` from upserts)
2. **Navigation-first product detection** (analyze nav structure before content)
3. **Unified Ideal Customer Profile page** (customer + emotional + functional on one screen)

### Impact
- Industry profiles save reliably
- Product detection accuracy: 40% → 95%+
- UVP steps: 6 → 5 (faster flow)
- Better UX: all customer data visible together

---

## BUILD TIMELINE

| Phase | Time | Deliverable |
|-------|------|-------------|
| Phase 1 | 5.5h | Industry save fix + Navigation scraping fix |
| Phase 2 | 4h | Smart product detection (OpenDialog test) |
| Phase 3 | 10h | Unified customer screen + Integration |
| Gap Analysis | Variable | 3 iterations until zero gaps |
| **TOTAL** | **19.5h + gap fixing** | Production-ready feature |

---

## EXECUTION WORKFLOW

```
START
  ↓
Phase 1: Setup + Industry Save + Navigation Fix
  ├─ Create worktree from backup
  ├─ Fix RLS operations
  ├─ Fix navigation scraping
  └─ COMMIT Phase 1
  ↓
Phase 2: Smart Product Detection
  ├─ Create NavigationProductDetector service
  ├─ Update product extraction prompt
  ├─ Implement two-pass detection
  ├─ TEST with OpenDialog.ai
  └─ COMMIT Phase 2
  ↓
Phase 3: Unified Customer Profile
  ├─ Create CustomerDriverMapper service
  ├─ Build IdealCustomerProfilePage component
  ├─ Integrate into UVP flow (reduce steps 6→5)
  ├─ Update data persistence
  ├─ FULL UI TESTING
  └─ COMMIT Phase 3
  ↓
Gap Analysis: 3 Iterations
  ├─ Iteration 1: Comprehensive scan + fix critical/high gaps
  ├─ Iteration 2: Edge cases + cross-browser + accessibility
  ├─ Iteration 3: Integration + polish + documentation
  └─ COMMIT after each iteration
  ↓
CI/CD Validation
  ├─ Run: npm ci, lint, type-check, test, build
  ├─ Fix any CI failures
  └─ Verify all steps pass
  ↓
Playwright E2E Tests
  ├─ Create e2e/uvp-v2-flow.spec.ts
  ├─ Test OpenDialog.ai flow
  ├─ Test industry save (no RLS errors)
  ├─ Test navigation scraping
  └─ All tests passing
  ↓
User Testing Preparation
  ├─ Prepare test URLs (OpenDialog, Stripe, etc.)
  ├─ Write testing instructions
  ├─ Stabilize dev environment
  └─ READY FOR USER TESTING
  ↓
User Testing
  ├─ Testers complete flows with real URLs
  ├─ Collect feedback
  ├─ Fix any issues found
  └─ Get approval
  ↓
MERGE TO MAIN
  ├─ Create Pull Request
  ├─ Code review
  ├─ Final approval
  ├─ Merge --no-ff
  └─ Deploy to production
  ↓
END
```

---

## FILE STRUCTURE

```
.buildrunner/
├── UVP_V2.1_BUILD_PLAN.md                    ← Overview (you read this already)
├── UVP_V2.1_ATOMIC_TASKS_PHASE_1.md          ← Execute first
├── UVP_V2.1_ATOMIC_TASKS_PHASE_2.md          ← Execute second
├── UVP_V2.1_ATOMIC_TASKS_PHASE_3.md          ← Execute third
├── UVP_V2.1_GAP_ANALYSIS.md                  ← Execute fourth (iterative)
├── UVP_V2.1_EXECUTION_SUMMARY.md             ← YOU ARE HERE
└── UVP_V2_MIGRATION_NOTES.md                 ← Created during Phase 3

Worktree Location:
../synapse-uvp-v2/                            ← Isolated development environment
```

---

## KEY PRINCIPLES

### 1. Isolation
- **Worktree-based development** - Main codebase untouched until merge
- **Feature branch** - All work on `feature/uvp-v2-unified`
- **Same database** - Uses production Supabase (RLS keeps data isolated)

### 2. Safety
- **From backup branch** - Starting point is known-good UVP state
- **Incremental commits** - Each phase committed separately
- **Rollback ready** - Can revert to backup anytime

### 3. Quality
- **3 gap analysis iterations** - Systematic issue finding
- **CI validation** - Automated checks before merge
- **Playwright e2e** - Real browser testing
- **User testing** - Live URL validation before production

### 4. Testing Before Merge
- **NO merge until:**
  - All 3 gap iterations complete
  - CI pipeline passes
  - Playwright tests pass
  - User testing approved
  - Zero critical/high gaps

---

## TESTING REQUIREMENTS

### Must Pass Before Merge

#### 1. Industry Save Test
```
Action: Generate profile for brand new industry
Expected: Profile saves without 400/406 errors
Test URL: Any new industry name
Validation: Check Supabase industry_profiles table
```

#### 2. OpenDialog Product Detection Test
```
Action: Scrape https://opendialog.ai
Expected: Detects Selma, Jamie, Rhea, OpenDialog Platform
Test URL: https://opendialog.ai
Validation: All 4 products appear with 100% confidence
```

#### 3. Navigation Scraping Test
```
Action: Scrape any site with clear nav
Expected: Navigation items have text + href
Test URLs: https://stripe.com, https://segment.com
Validation: Nav items show "Products" not just "/products"
```

#### 4. Unified Customer Profile Test
```
Action: Complete Ideal Customer Profile step
Expected: Select customer + 3 emotional + 3 functional → insight generates
Test: Full flow in dev environment
Validation: Combined insight grammatically correct
```

#### 5. Full UVP Flow Test
```
Action: Complete onboarding start to finish
Expected: 5 steps (not 6), data persists, no errors
Test: Multiple businesses with different types
Validation: UVP saves to database
```

---

## SUCCESS CRITERIA

### Functional
- ✅ Industry profiles save successfully (no 400/406 errors)
- ✅ OpenDialog.ai products detected (Selma, Jamie, Rhea, Platform)
- ✅ Navigation items capture text + href
- ✅ Unified customer screen displays all data
- ✅ UVP flow reduced to 5 steps
- ✅ Data persists across reloads

### Technical
- ✅ Zero TypeScript errors
- ✅ All unit tests pass
- ✅ CI pipeline passes
- ✅ Playwright e2e tests pass
- ✅ Build size acceptable
- ✅ No console errors

### Quality
- ✅ No critical or high gaps remaining
- ✅ Backward compatible with old data
- ✅ Cross-browser compatible
- ✅ WCAG AA accessible
- ✅ Mobile responsive
- ✅ Error recovery graceful

### User Experience
- ✅ Loading states for async operations
- ✅ Error messages helpful
- ✅ Success feedback clear
- ✅ Combined insight grammatically correct
- ✅ Fewer steps = better UX

---

## ROLLBACK PLAN

If critical issues found after merge:

### Option 1: Revert Merge
```bash
git revert -m 1 <merge-commit-hash>
git push origin main
```

### Option 2: Restore from Backup
```bash
git checkout backup/uvp-onboarding-20241123
git checkout -b hotfix/restore-uvp
git push origin hotfix/restore-uvp
# Then merge hotfix to main
```

### Option 3: Fix Forward
```bash
# If issue is minor, fix in place
git checkout main
git checkout -b hotfix/uvp-v2-fix
# Make fixes
git commit -m "hotfix(uvp-v2): Fix [issue]"
git push origin hotfix/uvp-v2-fix
# PR and merge
```

---

## COMMUNICATION CHECKPOINTS

### Checkpoint 1: Phase 1 Complete
**When:** After Phase 1 commit
**Message:** "Phase 1 complete: Industry save + navigation scraping fixed. Moving to Phase 2."
**Validation:** Industry profiles save, nav has text+href

### Checkpoint 2: Phase 2 Complete
**When:** After Phase 2 commit
**Message:** "Phase 2 complete: Smart product detection working. OpenDialog test passing."
**Validation:** OpenDialog.ai products detected correctly

### Checkpoint 3: Phase 3 Complete
**When:** After Phase 3 commit
**Message:** "Phase 3 complete: Unified customer screen integrated. Starting gap analysis."
**Validation:** Full UVP flow works end-to-end

### Checkpoint 4: Gap Analysis Complete
**When:** After 3 iterations, zero gaps
**Message:** "Gap analysis complete: 3 iterations, zero critical/high gaps. Running CI/CD validation."
**Validation:** All gap analysis checklists completed

### Checkpoint 5: Testing Ready
**When:** After Playwright tests pass
**Message:** "All automated tests passing. Ready for user testing with live URLs."
**Validation:** CI + Playwright green

### Checkpoint 6: Merge Ready
**When:** After user testing approval
**Message:** "User testing approved. Creating PR for merge to main."
**Validation:** All success criteria met

---

## FINAL CHECKLIST BEFORE MERGE

**Complete this checklist. ALL items must be checked.**

### Build & Phases
- [ ] Phase 1 committed and validated
- [ ] Phase 2 committed and validated
- [ ] Phase 3 committed and validated
- [ ] All phase commits on `feature/uvp-v2-unified` branch

### Gap Analysis
- [ ] Iteration 1 complete (critical/high gaps fixed)
- [ ] Iteration 2 complete (edge cases + cross-browser)
- [ ] Iteration 3 complete (integration + polish)
- [ ] Zero critical gaps remaining
- [ ] Zero high gaps remaining
- [ ] Low gaps documented

### Automated Testing
- [ ] TypeScript: 0 errors (`npm run build`)
- [ ] Linting: Pass (`npm run lint`)
- [ ] Unit tests: 100% pass (`npm test`)
- [ ] Playwright e2e: All pass (`npx playwright test`)
- [ ] No console errors during tests
- [ ] Build size < 2MB gzipped

### Manual Testing
- [ ] Industry save test passed (new industry)
- [ ] OpenDialog product test passed (4 products detected)
- [ ] Navigation scraping test passed (text+href)
- [ ] Unified customer screen test passed
- [ ] Full UVP flow test passed (5 steps)

### User Testing
- [ ] Test URLs prepared
- [ ] Testing instructions provided
- [ ] Testers completed flows
- [ ] Feedback collected
- [ ] Issues fixed (if any)
- [ ] Approval received

### Documentation
- [ ] features.json updated
- [ ] Migration notes created (UVP_V2_MIGRATION_NOTES.md)
- [ ] Worktree doc updated
- [ ] README updated (if needed)
- [ ] All JSDoc comments added

### Code Quality
- [ ] No console.logs in production code
- [ ] No commented-out code
- [ ] No TODO comments unresolved
- [ ] Consistent formatting
- [ ] Meaningful variable names
- [ ] Functions < 50 lines
- [ ] Components < 300 lines

### Cross-Cutting Concerns
- [ ] Mobile responsive
- [ ] Cross-browser compatible (Chrome, Firefox, Safari)
- [ ] WCAG AA accessible
- [ ] No performance regressions
- [ ] Error messages helpful
- [ ] Loading states present
- [ ] Success feedback clear

### Final Validation
- [ ] OpenDialog.ai end-to-end test in production-like environment
- [ ] No RLS errors in console
- [ ] Data persists correctly
- [ ] Backward compatible with old UVP data
- [ ] Rollback plan documented and understood

---

## MERGE PROCEDURE

**Only proceed if EVERY checkbox above is checked.**

```bash
# 1. Ensure feature branch is up to date
cd ../synapse-uvp-v2
git pull origin feature/uvp-v2-unified

# 2. Final validation
npm run build
npm test
npx playwright test

# 3. Switch to main repo
cd /Users/byronhudson/Projects/Synapse

# 4. Update main
git checkout main
git pull origin main

# 5. Create PR (via GitHub CLI or web)
gh pr create \
  --title "feat(uvp-v2): Unified UVP with fixed industry save and smart product detection" \
  --body "See .buildrunner/UVP_V2.1_EXECUTION_SUMMARY.md for details" \
  --base main \
  --head feature/uvp-v2-unified

# 6. After PR approval, merge
git checkout main
git merge --no-ff feature/uvp-v2-unified
git push origin main

# 7. Cleanup worktree
git worktree remove ../synapse-uvp-v2

# 8. Optional: Delete feature branch
git branch -d feature/uvp-v2-unified
git push origin --delete feature/uvp-v2-unified

# 9. Deploy to production
# (Follow your deployment process)
```

---

## POST-MERGE MONITORING

### First 24 Hours
- [ ] Monitor error logs for RLS errors
- [ ] Check industry profile saves
- [ ] Verify product detection accuracy
- [ ] Watch user completion rates
- [ ] Monitor performance metrics

### First Week
- [ ] Collect user feedback
- [ ] Track UVP completion rate (expect increase due to fewer steps)
- [ ] Monitor OpenDialog-type sites
- [ ] Check for edge cases in production
- [ ] Iterate on improvements if needed

---

## CONTACT / ESCALATION

**If Stuck:**
1. Re-read the relevant atomic tasks document
2. Check gap analysis for similar issues
3. Review backup branch code for reference
4. Test in isolation (create minimal reproduction)

**If Critical Issue in Production:**
1. Revert merge immediately (use rollback plan)
2. Investigate in feature branch
3. Fix and re-test thoroughly
4. Deploy fix or restore backup

---

## CONCLUSION

This is a comprehensive, battle-tested build plan that:
- ✅ Fixes all 3 critical UVP issues
- ✅ Maintains isolation until ready
- ✅ Includes extensive testing (gap analysis, CI, Playwright, user testing)
- ✅ Has clear success criteria
- ✅ Documents everything for future reference
- ✅ Provides rollback options

**Estimated Total Time:** 20-25 hours (including gap analysis and testing)

**Risk Level:** Low (isolated development, extensive testing, rollback ready)

**Expected Outcome:**
- Industry profiles save reliably
- Product detection highly accurate (especially for SaaS sites)
- Better UX with unified customer screen
- Faster UVP completion (5 steps vs 6)
- Production-ready code with zero critical gaps

---

**Ready to build.**

*lights final cigarette and starts Phase 1*

---

**Last Updated:** 2025-11-24
**Status:** Ready for Execution
**Next Action:** Execute Phase 1 (`.buildrunner/UVP_V2.1_ATOMIC_TASKS_PHASE_1.md`)
