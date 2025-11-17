# Week 2 Merge Strategy - Parallel Execution

**Timeline:** November 18-19, 2025 (2 days)
**MVP Progress:** 85% → 95%
**Strategy:** Maximum parallelization with final integration step

---

## Overview

Week 2 merges the two most critical remaining workstreams:
- **Workstream A**: Campaign Generation Pipeline (2,362 lines)
- **Workstream D**: Analytics Tracking (1,059 lines)
- **Bonus**: Fix pre-existing TypeScript errors in ProductReview.tsx

**Key Challenge:** Both workstreams modify OnboardingPageV5.tsx

**Solution:** Build core services in parallel, integrate UI changes in final step

---

## Parallel Execution Architecture

### Phase 1: Parallel Builds (12-16 hours)

Two Claude instances running simultaneously in separate git worktrees:

**Track 1: Campaign Generation Core Services**
- Worktree: `/Users/byronhudson/Projects/Synapse-campaign-gen`
- Branch: `feature/campaign-generation`
- Focus: Merge all campaign generation services EXCEPT OnboardingPageV5.tsx changes
- Zero file conflicts with Track 2

**Track 2: Analytics + TypeScript Fixes**
- Worktree: `/Users/byronhudson/Projects/Synapse-analytics`
- Branch: `feature/analytics-tracking`
- Focus: Merge analytics services + fix ProductReview.tsx EXCEPT OnboardingPageV5.tsx changes
- Zero file conflicts with Track 1

### Phase 2: Integration (6-8 hours)

After both tracks complete:

**Track 3: UI Integration**
- Worktree: main repository
- Focus: Integrate both campaign generation and analytics into OnboardingPageV5.tsx
- Resolve any final conflicts
- Wire everything together

---

## Track 1: Campaign Generation Core Services

**Estimated Time:** 6-8 hours
**Branch:** feature/campaign-generation
**Lead File:** CampaignGenerator.ts (2,362 lines)

### Files to Merge

**Core Services (8 files):**
```
src/services/campaign/
├── CampaignGenerator.ts                    (2,362 lines) ← PRIMARY
├── ContentGenerator.ts                     (856 lines)
├── BreakthroughInsightMatcher.ts          (423 lines)
├── PlatformAdapterFactory.ts              (312 lines)
└── content-generators/
    ├── CustomerSuccessGenerator.ts         (287 lines)
    ├── ServiceSpotlightGenerator.ts        (265 lines)
    ├── BehindTheScenesGenerator.ts         (243 lines)
    └── ThoughtLeadershipGenerator.ts       (231 lines)
```

**Supporting Files:**
```
src/types/campaign-generation.types.ts      (418 lines)
src/utils/platform-formatters.ts            (156 lines)
docs/CAMPAIGN_GENERATOR_ERROR_HANDLING.md   (319 lines)
```

### Integration Points

**With Week 1 Workstreams:**
- ✅ Error Handling: Apply changes from CAMPAIGN_GENERATOR_ERROR_HANDLING.md
- ✅ Publishing: CampaignGenerator → AutoScheduler integration
- ✅ Analytics: Track generation events

### Changes to Defer

**DO NOT modify in Track 1:**
- `src/pages/OnboardingPageV5.tsx` (defer to Track 3)

**Rationale:** OnboardingPageV5.tsx is modified by both Track 1 and Track 2. We'll integrate both sets of changes together in Track 3.

### Error Handling Integration

**Required:** Apply all changes from `docs/CAMPAIGN_GENERATOR_ERROR_HANDLING.md`

Key changes:
1. Wrap `contentGenerator.generate()` with `ErrorHandlerService.executeWithRetry()`
2. Add retry callbacks to `generateCampaign()` and `generatePost()` methods
3. Add Bannerbear error handling with fallback
4. Implement partial results saving
5. Create template-based fallback for complete failures

### Task Checklist

**Setup (5 min):**
- [ ] Create worktree: `git worktree add ../Synapse-campaign-gen feature/campaign-generation`
- [ ] Install dependencies: `cd ../Synapse-campaign-gen && npm install`

**Merge Core Services (3-4 hours):**
- [ ] Merge CampaignGenerator.ts
- [ ] Merge ContentGenerator.ts
- [ ] Merge BreakthroughInsightMatcher.ts
- [ ] Merge PlatformAdapterFactory.ts
- [ ] Merge all 4 content generators

**Apply Error Handling (2-3 hours):**
- [ ] Add ErrorHandlerService import
- [ ] Update generateCampaign() with retry logic
- [ ] Update generatePost() with retry logic
- [ ] Add Bannerbear error handling
- [ ] Add partial results saving
- [ ] Create template-based fallback method
- [ ] Add user-facing error messages

**Integration Wiring (1-2 hours):**
- [ ] Wire CampaignGenerator to CampaignOrchestrator
- [ ] Wire to AutoScheduler (publishing)
- [ ] Add analytics event tracking
- [ ] Update CampaignWorkflow to call CampaignGenerator

**Testing (1 hour):**
- [ ] TypeScript compilation passes
- [ ] All imports resolve
- [ ] No runtime errors
- [ ] Services instantiate correctly

**Commit & Tag:**
- [ ] Commit: "feat: Merge campaign generation core services"
- [ ] Tag: `week2-track1-complete`
- [ ] Push to main

### Success Criteria

✅ **Track 1 Complete When:**
1. All campaign generation services merged
2. Error handling fully integrated
3. Services wired to orchestrator
4. TypeScript compiles with zero errors
5. OnboardingPageV5.tsx NOT modified (deferred to Track 3)
6. Committed and tagged

---

## Track 2: Analytics + TypeScript Fixes

**Estimated Time:** 6-8 hours
**Branch:** feature/analytics-tracking
**Bonus:** Fix ProductReview.tsx errors

### Files to Merge

**Analytics Services (7 files):**
```
src/services/analytics/
├── campaign-analytics.service.ts           (523 lines) ← PRIMARY
├── conversion-tracking.service.ts          (312 lines)
└── analytics-dashboard.service.ts          (224 lines)

src/components/analytics/
├── CampaignAnalyticsDashboard.tsx          (456 lines)
├── ConversionFunnel.tsx                    (287 lines)
└── MetricsChart.tsx                        (198 lines)

supabase/migrations/
└── 20251117_add_campaign_analytics.sql     (89 lines)
```

**TypeScript Fixes:**
```
src/components/onboarding/ProductReview.tsx (9 errors to fix)
```

### Changes to Defer

**DO NOT modify in Track 2:**
- `src/pages/OnboardingPageV5.tsx` (defer to Track 3)

**Rationale:** Same as Track 1 - we'll integrate all UI changes together in Track 3.

### Task Checklist

**Setup (5 min):**
- [ ] Create worktree: `git worktree add ../Synapse-analytics feature/analytics-tracking`
- [ ] Install dependencies: `cd ../Synapse-analytics && npm install`

**Merge Analytics Services (3-4 hours):**
- [ ] Merge campaign-analytics.service.ts
- [ ] Merge conversion-tracking.service.ts
- [ ] Merge analytics-dashboard.service.ts
- [ ] Merge SQL migration
- [ ] Run migration: `supabase db push`

**Merge Analytics Components (2-3 hours):**
- [ ] Merge CampaignAnalyticsDashboard.tsx
- [ ] Merge ConversionFunnel.tsx
- [ ] Merge MetricsChart.tsx
- [ ] Update imports and types

**Fix ProductReview.tsx (30 min):**
- [ ] Fix 9 JSX closing tag syntax errors
- [ ] Verify ProductReview component renders
- [ ] Add to ProductScanner workflow if needed

**Integration Wiring (1 hour):**
- [ ] Wire analytics services to CampaignOrchestrator
- [ ] Add event tracking to campaign workflow
- [ ] Connect to ErrorHandler for error tracking

**Testing (1 hour):**
- [ ] TypeScript compilation passes (including ProductReview.tsx)
- [ ] All imports resolve
- [ ] Analytics services instantiate
- [ ] Database migration succeeds

**Commit & Tag:**
- [ ] Commit: "feat: Merge analytics tracking services and fix ProductReview errors"
- [ ] Tag: `week2-track2-complete`
- [ ] Push to main

### Success Criteria

✅ **Track 2 Complete When:**
1. All analytics services merged
2. Analytics components merged
3. ProductReview.tsx errors fixed
4. Database migration applied
5. TypeScript compiles with zero errors
6. OnboardingPageV5.tsx NOT modified (deferred to Track 3)
7. Committed and tagged

---

## Track 3: UI Integration

**Estimated Time:** 6-8 hours
**Prerequisites:** Both Track 1 AND Track 2 complete
**Branch:** Work directly on main

### Integration Tasks

**Campaign Generation UI Integration (2-3 hours):**
- [ ] Add campaign generation controls to OnboardingPageV5.tsx
- [ ] Wire "Generate Campaign" button to CampaignOrchestrator
- [ ] Add GenerationProgress component
- [ ] Add RetryProgress display
- [ ] Handle generation errors

**Analytics UI Integration (2-3 hours):**
- [ ] Add analytics dashboard to OnboardingPageV5.tsx
- [ ] Add conversion tracking events
- [ ] Wire analytics events to campaign workflow
- [ ] Add metrics display

**Conflict Resolution (1-2 hours):**
- [ ] Resolve OnboardingPageV5.tsx conflicts between campaign gen and analytics
- [ ] Ensure both features work together
- [ ] Test complete workflow end-to-end

**Final Testing (2 hours):**
- [ ] Complete campaign generation flow works
- [ ] Analytics tracking captures all events
- [ ] Error handling shows retry progress
- [ ] Publishing integration works
- [ ] E2E tests pass
- [ ] TypeScript compilation clean

**Commit & Tag:**
- [ ] Commit: "feat: Integrate campaign generation and analytics into OnboardingPageV5"
- [ ] Tag: `week2-complete`
- [ ] Push to main

### Success Criteria

✅ **Week 2 Complete When:**
1. Campaign generation fully integrated
2. Analytics fully integrated
3. OnboardingPageV5.tsx has both features working
4. All E2E tests pass
5. TypeScript compiles with zero errors
6. MVP progress: 95%
7. Ready for Week 3 polish

---

## Parallel Execution Timeline

### Day 1 - Parallel Build Day

**Morning (4 hours):**
- 9:00 AM - Kick off Track 1 (Campaign Gen) in Claude instance 1
- 9:00 AM - Kick off Track 2 (Analytics) in Claude instance 2
- Both run simultaneously with zero conflicts

**Afternoon (4 hours):**
- Continue parallel builds
- Monitor both instances
- Handle any issues independently

**Evening (4 hours):**
- Complete Track 1
- Complete Track 2
- Both commit and tag independently

### Day 2 - Integration Day

**Morning (3 hours):**
- Start Track 3 integration
- Merge campaign gen UI changes

**Afternoon (3 hours):**
- Merge analytics UI changes
- Resolve OnboardingPageV5.tsx conflicts

**Evening (2 hours):**
- Final testing
- E2E test verification
- Week 2 completion

---

## Risk Management

### Risk 1: Track 1 or Track 2 Fails
**Mitigation:** Each track is independent. If one fails, the other can still merge.
**Fallback:** Complete successful track, debug failed track separately.

### Risk 2: Integration Conflicts Too Complex
**Mitigation:** Both tracks defer OnboardingPageV5.tsx changes, making integration predictable.
**Fallback:** Manual conflict resolution with clear git history from both tracks.

### Risk 3: Database Migration Issues
**Mitigation:** Track 2 includes migration testing before integration.
**Fallback:** Rollback migration, fix issues, re-apply.

### Risk 4: Campaign Generator Performance
**Mitigation:** Error handling includes timeout handling and partial results.
**Fallback:** Reduce batch size, increase timeouts in config.

---

## Testing Strategy

### Track 1 Testing
```bash
# In Synapse-campaign-gen worktree
npm run type-check
npm run build
npm run test src/services/campaign/
```

### Track 2 Testing
```bash
# In Synapse-analytics worktree
npm run type-check
npm run build
npm run test src/services/analytics/
supabase db reset --local
```

### Track 3 Integration Testing
```bash
# In main repository
npm run type-check
npm run build
npm run test
npm run test:e2e
```

---

## Success Metrics

**Week 2 Goals:**
- ✅ Campaign generation pipeline: 100% complete
- ✅ Analytics tracking: 100% complete
- ✅ ProductReview.tsx: TypeScript errors fixed
- ✅ OnboardingPageV5.tsx: Both features integrated
- ✅ Error handling: Applied to campaign generation
- ✅ MVP Progress: 85% → 95%
- ✅ Code Added: ~4,500 lines
- ✅ Zero blocking bugs

**Week 2 Deliverables:**
1. Fully functional campaign generation
2. Complete analytics tracking system
3. Clean TypeScript compilation
4. All E2E tests passing
5. Ready for Week 3 polish and launch

---

## Post-Week 2 State

After Week 2, main branch will have:
- ✅ Complete campaign workflow (A-Z)
- ✅ Publishing automation
- ✅ Error handling with retry
- ✅ Analytics tracking
- ✅ E2E testing infrastructure
- ✅ All 5 workstreams merged

**Ready for Week 3:**
- Performance optimization
- UI polish
- Documentation
- Launch preparation

---

**Next:** Create WEEK2_PROMPTS.md with 3 parallel-execution-ready prompts
