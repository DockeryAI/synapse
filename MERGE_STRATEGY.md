# Synapse Workstream Merge Strategy
**Date:** November 17, 2025
**Status:** Ready to Execute
**Estimated Time:** 12-16 hours total

---

## SITUATION

You have **5 completed feature branches** with ~5,800 lines of production code that need to be merged into main:

1. `feature/campaign-generation-pipeline` (Workstream A) - 2,362 lines
2. `feature/publishing-integration` (Workstream B) - 1,611 lines
3. `feature/error-handling` (Workstream C) - 1,209 lines
4. `feature/analytics-tracking` (Workstream D) - 1,059 lines
5. `feature/e2e-tests` (Workstream E) - 864 lines

**Critical Issue:** Multiple branches modify `OnboardingPageV5.tsx` causing merge conflicts.

---

## MERGE ORDER (CRITICAL)

### Phase 1: Foundation (Low Conflict Risk)

#### Step 1: Merge Publishing Integration (2 hours)
**Branch:** `feature/publishing-integration`
**Why First:** New directories, minimal conflicts
**Conflicts:** None expected (creates new `/src/services/publishing/` directory)

```bash
git checkout main
git pull origin main
git merge feature/publishing-integration --no-ff
# Resolve any conflicts (unlikely)
npm install
npm run build
git commit -m "Merge Workstream B: Publishing automation"
git push origin main
```

**Verification:**
- [ ] Build succeeds
- [ ] New services exist: `auto-scheduler.service.ts`, `publishing-analytics.service.ts`
- [ ] Migration file present: `supabase/migrations/20251117_add_analytics_events_table.sql`
- [ ] Run migration: `npx supabase db push`

---

#### Step 2: Merge E2E Tests (1 hour)
**Branch:** `feature/e2e-tests`
**Why Second:** No conflicts, sets up testing infrastructure
**Conflicts:** None expected (creates new test files)

```bash
git merge feature/e2e-tests --no-ff
npm install @playwright/test
npx playwright install
git commit -m "Merge Workstream E: E2E testing infrastructure"
git push origin main
```

**Verification:**
- [ ] Playwright installed
- [ ] Test files exist in `src/__tests__/e2e/`
- [ ] `npm run test:e2e` command available (will fail until other merges complete)

---

### Phase 2: Service Layer (Moderate Conflict Risk)

#### Step 3: Merge Error Handling (3 hours)
**Branch:** `feature/error-handling`
**Why Third:** Modifies existing services, OnboardingPageV5
**Conflicts:** Expected in:
- `src/services/campaign/SmartPickGenerator.ts`
- `src/services/uvp-wizard/SmartUVPExtractor.ts`
- `src/pages/OnboardingPageV5.tsx` (CRITICAL)

```bash
git merge feature/error-handling --no-ff
# EXPECT CONFLICTS - Resolve carefully
```

**Conflict Resolution:**
1. **OnboardingPageV5.tsx:**
   - Keep error handling additions
   - Keep retry progress state
   - Keep extractUVPWithCache call
   - Document line numbers for next merge

2. **SmartPickGenerator.ts:**
   - Accept ALL error handling improvements
   - Keep retry logic
   - Keep template-based fallbacks

3. **SmartUVPExtractor.ts:**
   - Accept retry logic additions
   - Keep cache fallback methods
   - Keep graceful degradation

**After Resolution:**
```bash
npm run build
# Test error handling manually
git commit -m "Merge Workstream C: Error handling & retry logic"
git push origin main
```

**Verification:**
- [ ] Build succeeds
- [ ] Error handler service exists: `src/services/errors/error-handler.service.ts`
- [ ] RetryProgress component exists
- [ ] Retry logic in SmartUVPExtractor works

---

### Phase 3: Campaign Generation (HIGH Conflict Risk)

#### Step 4: Merge Campaign Generation (6 hours)
**Branch:** `feature/campaign-generation-pipeline`
**Why Fourth:** Largest changes to OnboardingPageV5.tsx
**Conflicts:** GUARANTEED in:
- `src/pages/OnboardingPageV5.tsx` (MAJOR)

```bash
git merge feature/campaign-generation-pipeline --no-ff
# EXPECT MAJOR CONFLICTS in OnboardingPageV5.tsx
```

**Conflict Resolution Strategy for OnboardingPageV5.tsx:**

This is the most critical merge. You need to combine:
- Main branch: 538 lines (has error handling from Step 3)
- Campaign branch: 800+ lines (has campaign generation)

**Approach:**
1. **Accept campaign branch version as base** (more complete)
2. **Manually merge error handling** from current main
3. **Verify all handlers are present:**
   - ✅ `handleCampaignSelected` (from campaign branch)
   - ✅ `handlePostSelected` (from campaign branch)
   - ✅ `handleBuildCustom` (from campaign branch)
   - ✅ Retry progress state (from error handling)
   - ✅ `extractUVPWithCache` call (from error handling)

**Step-by-step:**
```bash
# 1. Accept campaign branch version
git checkout --theirs src/pages/OnboardingPageV5.tsx

# 2. Manually add error handling sections
# Open file and add:
#   - retryProgress state (from error-handling branch)
#   - RetryProgress component import
#   - RetryProgress in render (around line 400)

# 3. Ensure all new components imported:
#   - GenerationProgress
#   - OnboardingCampaignPreview
#   - OnboardingSinglePostPreview
#   - RetryProgress

# 4. Verify state variables:
const [isGenerating, setIsGenerating] = useState(false);
const [generatedCampaign, setGeneratedCampaign] = useState<GeneratedCampaign | null>(null);
const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);
const [retryProgress, setRetryProgress] = useState<RetryProgress | null>(null);
```

**After Resolution:**
```bash
npm run build
# CRITICAL: Test full onboarding flow
# 1. Enter URL
# 2. Go through confirmation
# 3. Click campaign suggestion
# 4. Verify real content generates
# 5. Verify preview shows
git commit -m "Merge Workstream A: Campaign generation pipeline"
git push origin main
```

**Verification:**
- [ ] Build succeeds
- [ ] CampaignGenerator service exists
- [ ] All preview components exist
- [ ] OnboardingPageV5 has NO TODOs in handlers
- [ ] Manual test: URL → Campaign → Preview works
- [ ] Manual test: URL → Single Post → Preview works

---

### Phase 4: Analytics (Low Conflict Risk)

#### Step 5: Merge Analytics Tracking (2 hours)
**Branch:** `feature/analytics-tracking`
**Why Last:** Depends on analytics_events table from Step 1
**Conflicts:** Possible in OnboardingPageV5 (minor)

```bash
git merge feature/analytics-tracking --no-ff
# May have minor conflicts in OnboardingPageV5
```

**Note:** This branch only has Part 1 (service + dashboard). Part 2 (tracking calls) needs to be done manually.

**After Resolution:**
```bash
npm run build
git commit -m "Merge Workstream D: Analytics tracking infrastructure"
git push origin main
```

**Verification:**
- [ ] Build succeeds
- [ ] FunnelTracker service exists
- [ ] FunnelDashboard component exists

---

## POST-MERGE TASKS

### Task 1: Complete Analytics Integration (4 hours)
**File:** `src/pages/OnboardingPageV5.tsx`

Add tracking calls:
```typescript
import { FunnelTracker } from '@/services/analytics/funnel-tracker.service';

const tracker = new FunnelTracker();

// In handleUrlSubmit:
await tracker.trackOnboardingStep({
  step: 'url_input',
  data: { url, industry }
});

// In handleConfirmationComplete:
await tracker.trackOnboardingStep({
  step: 'confirmation_confirmed',
  data: refinedData
});

// Continue for all 12 onboarding steps...
```

**Verification:**
- [ ] Events appear in analytics_events table
- [ ] FunnelDashboard shows data

---

### Task 2: Fix Database Type Adapters (2 hours)
**File:** `src/services/campaign/CampaignGenerator.ts`

Current issue (lines 519-539):
```typescript
// TODO: Type adapter needed
```

**Solution:**
Create adapter function:
```typescript
function adaptGeneratedCampaignToWorkflow(
  generated: GeneratedCampaign
): CampaignWorkflow {
  return {
    // Map fields...
  };
}
```

Or extend CampaignDB:
```typescript
async saveGeneratedCampaign(campaign: GeneratedCampaign): Promise<void> {
  // New method that handles GeneratedCampaign type
}
```

---

### Task 3: Run E2E Tests (2 hours)

```bash
npm run test:e2e
```

**Expected:**
- Some tests will fail initially
- Fix bugs discovered
- Re-run until all pass

---

### Task 4: Fix Unit Tests (4 hours)

```bash
npm test
```

**Current failures:**
- synapse-core.service.test.ts: 18/20 failing
- url-parser.service.test.ts: 49/49 failing

**Fix:**
1. Update OpenRouter API mocks
2. Fix URL parser test expectations
3. Add tests for new services

---

## ROLLBACK STRATEGY

If anything goes wrong:

```bash
# Rollback last merge
git reset --hard HEAD~1

# Or rollback to specific commit
git reset --hard 50f29b3  # Current main

# Force push (CAREFUL - only do this if not in production)
git push origin main --force
```

**Better approach:**
```bash
# Create rollback branch
git checkout -b rollback/pre-merge 50f29b3
git push origin rollback/pre-merge

# Now you can always get back to this point
```

---

## TESTING CHECKLIST

### After Each Merge
- [ ] `npm install` succeeds
- [ ] `npm run build` succeeds
- [ ] No TypeScript errors
- [ ] Dev server starts (`npm run dev`)
- [ ] No console errors on page load

### After All Merges
- [ ] Full onboarding flow works
- [ ] Campaign generation works
- [ ] Publishing scheduling works
- [ ] Error retry works
- [ ] Analytics tracking works
- [ ] E2E tests pass

---

## ESTIMATED TIMELINE

### Day 1 (8 hours)
- **Hour 1-2:** Merge Workstream B (publishing)
- **Hour 3:** Merge Workstream E (E2E tests)
- **Hour 4-6:** Merge Workstream C (error handling)
- **Hour 7-8:** Test and fix issues

### Day 2 (8 hours)
- **Hour 1-6:** Merge Workstream A (campaign generation) - CRITICAL
- **Hour 7-8:** Merge Workstream D (analytics)

### Day 3 (4 hours)
- **Hour 1-2:** Complete analytics integration
- **Hour 3-4:** Fix database type adapters

### Day 4 (4 hours)
- **Hour 1-2:** Run E2E tests
- **Hour 3-4:** Fix discovered bugs

**Total: 24 hours over 4 days**

---

## SUCCESS CRITERIA

### Merge Complete When:
- [ ] All 5 branches merged to main
- [ ] Build succeeds with no errors
- [ ] No TODO comments in OnboardingPageV5 handlers
- [ ] Campaign generation works end-to-end
- [ ] Publishing automation works
- [ ] Error handling visible to users
- [ ] Analytics tracking data flows
- [ ] E2E tests pass (>80%)

### Ready for Launch When:
- [ ] All success criteria above met
- [ ] Database migrations run
- [ ] Bannerbear templates configured
- [ ] 5 beta users tested successfully
- [ ] No critical bugs
- [ ] Performance benchmarks met

---

## RISK MITIGATION

### High Risk: OnboardingPageV5 Merge Conflict
**Mitigation:**
1. Keep all versions open side-by-side
2. Use visual diff tool (GitKraken, VS Code)
3. Test after each conflict resolution
4. Have rollback ready

### Medium Risk: Database Type Mismatches
**Mitigation:**
1. Fix type adapters immediately after merge
2. Test database saves end-to-end
3. Check Supabase logs for errors

### Low Risk: Breaking Changes in Dependencies
**Mitigation:**
1. Run `npm install` after each merge
2. Check for peer dependency warnings
3. Update package-lock.json

---

## COMMUNICATION PLAN

### Before Starting
- [ ] Backup current main branch
- [ ] Create rollback branch
- [ ] Notify team (if applicable)
- [ ] Set aside uninterrupted time

### During Merges
- [ ] Commit after each successful merge
- [ ] Document any issues encountered
- [ ] Take notes on conflict resolutions

### After Completion
- [ ] Update project documentation
- [ ] Create release notes
- [ ] Update gap analysis
- [ ] Schedule beta testing

---

## NEXT STEPS

1. **Review this strategy** - Understand the merge order
2. **Prepare workspace** - Clean working directory
3. **Create rollback branch** - Safety first
4. **Execute Phase 1** - Start with publishing + E2E tests
5. **Execute Phase 2** - Error handling (expect conflicts)
6. **Execute Phase 3** - Campaign generation (major conflicts)
7. **Execute Phase 4** - Analytics (minor conflicts)
8. **Post-merge tasks** - Analytics integration, type adapters
9. **Testing** - E2E tests, unit tests, manual testing
10. **Launch prep** - Beta testing, production deployment

---

**Status:** Ready to execute
**Estimated completion:** 2-4 days
**Confidence:** 90%

*Generated by Claude Code - Merge Strategy System*
