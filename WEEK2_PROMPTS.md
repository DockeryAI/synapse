# Week 2 Prompts - Parallel Execution

**⚠️ IMPORTANT:** Run Prompt 1 and Prompt 2 **SIMULTANEOUSLY** in separate Claude Code instances. Only run Prompt 3 after BOTH are complete.

---

## 🚀 Prompt 1: Campaign Generation Core Services

**Claude Instance:** #1 (Parallel)
**Estimated Time:** 6-8 hours
**Git Worktree:** Yes

```
WEEK 2 - TRACK 1: CAMPAIGN GENERATION CORE SERVICES

Project: /Users/byronhudson/Projects/Synapse
Task: Merge feature/campaign-generation branch (2,362 lines) with error handling integration

READ THESE FIRST:
1. /Users/byronhudson/Projects/Synapse/docs/builds/WEEK2_MERGE_STRATEGY.md (full strategy)
2. /Users/byronhudson/Projects/Synapse/docs/CAMPAIGN_GENERATOR_ERROR_HANDLING.md (integration requirements)

YOUR MISSION:
Merge all campaign generation services from feature/campaign-generation branch, apply error handling per CAMPAIGN_GENERATOR_ERROR_HANDLING.md, and wire to existing orchestrator. DO NOT modify OnboardingPageV5.tsx (deferred to Track 3).

EXECUTION STEPS:

1. CREATE WORKTREE
   cd /Users/byronhudson/Projects/Synapse
   git worktree add ../Synapse-campaign-gen feature/campaign-generation
   cd ../Synapse-campaign-gen
   npm install

2. MERGE FILES (in this order):
   - src/types/campaign-generation.types.ts
   - src/services/campaign/CampaignGenerator.ts (2,362 lines - PRIMARY)
   - src/services/campaign/ContentGenerator.ts
   - src/services/campaign/BreakthroughInsightMatcher.ts
   - src/services/campaign/PlatformAdapterFactory.ts
   - src/services/campaign/content-generators/*.ts (all 4 files)
   - src/utils/platform-formatters.ts

3. APPLY ERROR HANDLING (per CAMPAIGN_GENERATOR_ERROR_HANDLING.md):
   - Add ErrorHandlerService import to CampaignGenerator.ts
   - Wrap contentGenerator.generate() with ErrorHandlerService.executeWithRetry()
   - Add retry callbacks to generateCampaign() and generatePost()
   - Add Bannerbear error handling with fallback
   - Implement partial results saving
   - Create template-based fallback method

4. WIRE INTEGRATIONS:
   - Import CampaignGenerator in src/services/campaign/CampaignWorkflow.ts
   - Update CampaignOrchestrator.ts generateCampaign() to call CampaignGenerator
   - Add analytics event tracking (import from analytics service)
   - Wire to AutoScheduler for publishing

5. TEST:
   npm run type-check
   npm run build
   npm run test src/services/campaign/

6. COMMIT TO MAIN:
   cd /Users/byronhudson/Projects/Synapse
   git worktree remove ../Synapse-campaign-gen
   git add .
   git commit -m "feat: Merge campaign generation core services with error handling

   - Add CampaignGenerator.ts (2,362 lines) with retry logic
   - Add ContentGenerator.ts with platform adapters
   - Add 4 content generators (customer success, service spotlight, etc.)
   - Integrate ErrorHandlerService for robust generation
   - Wire to CampaignOrchestrator and AutoScheduler
   - Add partial results saving and fallback strategies

   🤖 Generated with Claude Code

   Co-Authored-By: Claude <noreply@anthropic.com>"

   git tag week2-track1-complete
   git push origin main --tags

CRITICAL RULES:
- DO NOT modify src/pages/OnboardingPageV5.tsx (deferred to Track 3)
- Follow CAMPAIGN_GENERATOR_ERROR_HANDLING.md exactly
- All AI generation calls must have retry logic
- Commit only when TypeScript compiles with zero errors

SUCCESS CRITERIA:
✅ All campaign generation services merged
✅ Error handling fully integrated per documentation
✅ Services wired to orchestrator
✅ TypeScript compiles: zero errors
✅ OnboardingPageV5.tsx NOT modified
✅ Committed with tag week2-track1-complete

WHEN COMPLETE:
Report "Track 1 Complete" and wait for Track 2 to finish before proceeding.
```

---

## 🚀 Prompt 2: Analytics + TypeScript Fixes

**Claude Instance:** #2 (Parallel)
**Estimated Time:** 6-8 hours
**Git Worktree:** Yes

```
WEEK 2 - TRACK 2: ANALYTICS TRACKING + TYPESCRIPT FIXES

Project: /Users/byronhudson/Projects/Synapse
Task: Merge feature/analytics-tracking branch (1,059 lines) + fix ProductReview.tsx errors

READ THIS FIRST:
1. /Users/byronhudson/Projects/Synapse/docs/builds/WEEK2_MERGE_STRATEGY.md (full strategy)

YOUR MISSION:
Merge all analytics services from feature/analytics-tracking branch, fix pre-existing TypeScript errors in ProductReview.tsx, and wire to existing campaign workflow. DO NOT modify OnboardingPageV5.tsx (deferred to Track 3).

EXECUTION STEPS:

1. CREATE WORKTREE
   cd /Users/byronhudson/Projects/Synapse
   git worktree add ../Synapse-analytics feature/analytics-tracking
   cd ../Synapse-analytics
   npm install

2. MERGE ANALYTICS SERVICES (in this order):
   - src/services/analytics/campaign-analytics.service.ts (523 lines - PRIMARY)
   - src/services/analytics/conversion-tracking.service.ts
   - src/services/analytics/analytics-dashboard.service.ts
   - supabase/migrations/20251117_add_campaign_analytics.sql

3. APPLY DATABASE MIGRATION:
   supabase db push

4. MERGE ANALYTICS COMPONENTS:
   - src/components/analytics/CampaignAnalyticsDashboard.tsx
   - src/components/analytics/ConversionFunnel.tsx
   - src/components/analytics/MetricsChart.tsx

5. FIX PRODUCTREVIEW.TSX ERRORS:
   File: src/components/onboarding/ProductReview.tsx
   Problem: 9 JSX closing tag syntax errors
   Action: Fix all closing tags (e.g., </div> instead of <div/>)
   Verify: Component renders without errors

6. WIRE INTEGRATIONS:
   - Import analytics services in src/services/campaign/CampaignOrchestrator.ts
   - Add event tracking to CampaignWorkflow.ts
   - Connect to ErrorHandler for error event tracking
   - Wire conversion tracking to publishing events

7. TEST:
   npm run type-check
   npm run build
   npm run test src/services/analytics/
   npm run test src/components/onboarding/ProductReview.test.tsx

8. COMMIT TO MAIN:
   cd /Users/byronhudson/Projects/Synapse
   git worktree remove ../Synapse-analytics
   git add .
   git commit -m "feat: Merge analytics tracking services and fix ProductReview errors

   - Add campaign-analytics.service.ts (523 lines)
   - Add conversion-tracking and analytics-dashboard services
   - Add analytics components (dashboard, funnel, charts)
   - Apply database migration for campaign analytics
   - Fix 9 TypeScript errors in ProductReview.tsx
   - Wire analytics to CampaignOrchestrator and workflow

   🤖 Generated with Claude Code

   Co-Authored-By: Claude <noreply@anthropic.com>"

   git tag week2-track2-complete
   git push origin main --tags

CRITICAL RULES:
- DO NOT modify src/pages/OnboardingPageV5.tsx (deferred to Track 3)
- Fix ALL TypeScript errors in ProductReview.tsx
- Run database migration successfully
- Commit only when TypeScript compiles with zero errors

SUCCESS CRITERIA:
✅ All analytics services merged
✅ Analytics components merged
✅ ProductReview.tsx: zero TypeScript errors
✅ Database migration applied successfully
✅ TypeScript compiles: zero errors
✅ OnboardingPageV5.tsx NOT modified
✅ Committed with tag week2-track2-complete

WHEN COMPLETE:
Report "Track 2 Complete" and wait for Track 1 to finish before proceeding.
```

---

## 🚀 Prompt 3: UI Integration

**Claude Instance:** #3 (Sequential - Run AFTER Tracks 1 & 2)
**Estimated Time:** 6-8 hours
**Prerequisites:** week2-track1-complete AND week2-track2-complete tags exist

```
WEEK 2 - TRACK 3: UI INTEGRATION

Project: /Users/byronhudson/Projects/Synapse
Task: Integrate campaign generation and analytics into OnboardingPageV5.tsx

PREREQUISITES CHECK:
Verify both tags exist:
git tag | grep week2-track1-complete
git tag | grep week2-track2-complete

If either is missing, STOP and wait for parallel tracks to complete.

READ THIS FIRST:
1. /Users/byronhudson/Projects/Synapse/docs/builds/WEEK2_MERGE_STRATEGY.md (Track 3 section)

YOUR MISSION:
Integrate both campaign generation UI and analytics UI into OnboardingPageV5.tsx, resolve any conflicts, and ensure complete end-to-end workflow.

EXECUTION STEPS:

1. VERIFY PREREQUISITES:
   cd /Users/byronhudson/Projects/Synapse
   git pull origin main
   npm install
   Verify: week2-track1-complete and week2-track2-complete tags exist

2. READ EXISTING IMPLEMENTATIONS:
   - Read src/services/campaign/CampaignGenerator.ts to understand API
   - Read src/services/analytics/campaign-analytics.service.ts to understand tracking
   - Read src/pages/OnboardingPageV5.tsx to see current state
   - Read src/components/campaign/preview/CampaignPreview.tsx for context

3. INTEGRATE CAMPAIGN GENERATION UI:
   In src/pages/OnboardingPageV5.tsx:
   - Import CampaignOrchestrator
   - Add "Generate Campaign" button in appropriate step
   - Wire button to orchestrator.generateCampaign()
   - Add GenerationProgress component
   - Add RetryProgress component for error handling
   - Handle generation errors with user-friendly messages

4. INTEGRATE ANALYTICS UI:
   In src/pages/OnboardingPageV5.tsx:
   - Import campaign-analytics.service
   - Add analytics event tracking to workflow steps
   - Add CampaignAnalyticsDashboard component
   - Wire conversion tracking to publishing events
   - Add metrics display in appropriate section

5. RESOLVE CONFLICTS:
   - Check for any merge conflicts in OnboardingPageV5.tsx
   - Ensure both campaign generation and analytics work together
   - Verify state management doesn't conflict
   - Test component re-renders

6. WIRE COMPLETE WORKFLOW:
   Test this end-to-end flow:
   1. Initialize campaign (DeepContext)
   2. Select campaign type
   3. Generate campaign content (Track 1 feature)
   4. Track analytics event (Track 2 feature)
   5. Preview content
   6. Approve campaign
   7. Publish to platforms
   8. View analytics dashboard

7. TEST EVERYTHING:
   npm run type-check
   npm run build
   npm run test
   npm run test:e2e

8. COMMIT TO MAIN:
   git add .
   git commit -m "feat: Integrate campaign generation and analytics into OnboardingPageV5

   - Add campaign generation controls to onboarding flow
   - Wire GenerationProgress and RetryProgress components
   - Add analytics dashboard and event tracking
   - Integrate conversion funnel visualization
   - Resolve OnboardingPageV5.tsx conflicts between features
   - Complete end-to-end campaign workflow integration

   Week 2 Complete: MVP 95%

   🤖 Generated with Claude Code

   Co-Authored-By: Claude <noreply@anthropic.com>"

   git tag week2-complete
   git push origin main --tags

CRITICAL RULES:
- Only run this AFTER both Track 1 and Track 2 are complete
- Both features must work together in OnboardingPageV5.tsx
- Complete workflow must be tested end-to-end
- All E2E tests must pass
- Commit only when everything works

SUCCESS CRITERIA:
✅ Campaign generation fully integrated
✅ Analytics fully integrated
✅ OnboardingPageV5.tsx has both features working
✅ Complete workflow tested end-to-end
✅ All E2E tests pass
✅ TypeScript compiles: zero errors
✅ MVP progress: 95%
✅ Committed with tag week2-complete

WHEN COMPLETE:
Report "Week 2 Complete - Ready for Week 3" with summary of:
- Total lines merged
- Features integrated
- Tests passing
- MVP completion percentage
```

---

## 📋 Execution Instructions

### Step 1: Launch Parallel Tracks (Day 1 Morning)

**Open TWO Claude Code instances simultaneously:**

**Instance 1:**
```bash
# Copy-paste Prompt 1 into Claude Code instance 1
# Let it run for 6-8 hours
```

**Instance 2:**
```bash
# Copy-paste Prompt 2 into Claude Code instance 2
# Let it run for 6-8 hours
```

Both will work in separate git worktrees with ZERO conflicts.

### Step 2: Monitor Progress (Day 1)

Check both instances periodically:
- Instance 1: Watch for "Track 1 Complete"
- Instance 2: Watch for "Track 2 Complete"

Both should complete within 8 hours.

### Step 3: Launch Integration (Day 2 Morning)

**After BOTH tracks complete:**

**Open new Claude Code instance:**
```bash
# Copy-paste Prompt 3 into Claude Code
# Let it run for 6-8 hours
```

This will integrate both features into OnboardingPageV5.tsx.

### Step 4: Verify Week 2 Complete (Day 2 Evening)

Check for success tag:
```bash
git tag | grep week2-complete
```

If tag exists, Week 2 is done! MVP is at 95%.

---

## ⚙️ Parallel Execution Benefits

**Time Savings:**
- Sequential execution: 18-24 hours
- Parallel execution: 12-16 hours
- **Savings: 6-8 hours (33% faster)**

**Safety:**
- Track 1 and Track 2 modify completely different files
- Zero merge conflicts during parallel work
- Only Track 3 resolves the single conflict point (OnboardingPageV5.tsx)

**Risk Mitigation:**
- If Track 1 fails, Track 2 still succeeds (and vice versa)
- Each track can be debugged independently
- Track 3 has clean git history from both tracks

---

## 🏁 Week 2 Success Metrics

After all 3 prompts complete:

**Code Metrics:**
- Lines merged: ~4,500
- Files modified: ~20
- Commits: 3 (one per track)
- Tags: 3 (week2-track1-complete, week2-track2-complete, week2-complete)

**Feature Metrics:**
- Campaign generation: 100% complete
- Analytics tracking: 100% complete
- Error handling: Integrated
- Publishing: Integrated
- E2E tests: Passing

**Quality Metrics:**
- TypeScript errors: 0
- Failing tests: 0
- MVP completion: 95%
- Ready for Week 3: ✅

---

**Ready to execute? Copy Prompt 1 and Prompt 2 into separate Claude instances and let them run in parallel!**
