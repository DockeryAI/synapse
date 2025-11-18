# Phase 2: Merge Campaign-Generation (UPDATED with Safety Checks)

**⚠️ CRITICAL:** This prompt includes safety checks to prevent lost work

---

## Pre-Flight Check (DO THIS FIRST!)

**BEFORE running Phase 2, verify no other unmerged work:**

```bash
# Run the safety check script
./scripts/check-unmerged-work.sh

# Should show:
# ⚠️  WARNING: feature/campaign-generation-pipeline has 1 unmerged commit(s)
# ✅ All other branches merged

# If OTHER branches show unmerged work, STOP and merge them first!
```

---

## PROMPT 2: MERGE CAMPAIGN-GENERATION & FIX (Single Instance)

```
MVP COMPLETION - PHASE 2: MERGE CAMPAIGN-GENERATION BRANCH & FIX

Project: /Users/byronhudson/Projects/Synapse
Task: Merge feature/campaign-generation-pipeline branch and fix any TypeScript errors

READ THIS FIRST:
1. /Users/byronhudson/Projects/Synapse/ACTUAL_STATUS_NOV18.md
2. /Users/byronhudson/Projects/Synapse/docs/builds/COMPLETION_PARALLEL_PLAN.md
3. /Users/byronhudson/Projects/Synapse/docs/development/WORKTREE_WORKFLOW.md

CRITICAL SAFETY CHECK:
Before starting, verify this is the ONLY unmerged branch:
./scripts/check-unmerged-work.sh

If other branches show unmerged work, STOP and report back!

SITUATION:
The feature/campaign-generation-pipeline branch contains complete integration work:
- OnboardingPageV5.tsx fully wired to CampaignGenerator
- 3 new preview components (GenerationProgress, CampaignPreview, SinglePostPreview)
- Full campaign generation flow already implemented
- 2,362 lines of working integration code

However, it's from before Phase 1 TypeScript fixes, so we need to merge and re-fix.

EXECUTION STEPS:

PART A: SAFETY VERIFICATION (5 min)

1. RUN UNMERGED WORK CHECK
   ./scripts/check-unmerged-work.sh

   Expected output:
   - ⚠️  feature/campaign-generation-pipeline: 1 unmerged commit
   - ✅ All other branches: fully merged

   If ANY other branch shows unmerged work:
   - STOP immediately
   - Report findings
   - Do NOT proceed with merge

2. REVIEW WHAT'S BEING MERGED
   git log main..feature/campaign-generation-pipeline --stat

   Verify it shows:
   - 1 commit: "Complete campaign generation pipeline"
   - 6 files changed
   - ~2,362 lines added

3. CHECK CURRENT STATE
   git status
   # Should be clean after Phase 1

PART B: MERGE THE BRANCH (30 min)

4. MERGE CAMPAIGN-GENERATION BRANCH
   git merge feature/campaign-generation-pipeline --no-ff -m "merge: Integrate campaign-generation-pipeline with Phase 1 fixes

   Merging complete campaign generation integration from feature branch.
   Includes OnboardingPageV5 wiring, preview components, and generation flow.

   Will apply Phase 1 TypeScript fixes to merged code.

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude <noreply@anthropic.com>"

5. RESOLVE MERGE CONFLICTS (if any)
   If conflicts occur, they'll likely be in:
   - src/pages/OnboardingPageV5.tsx
   - src/services/campaign/CampaignGenerator.ts
   - src/types/campaign-generation.types.ts

   Resolution strategy:
   - Keep Phase 1 type fixes (from main)
   - Keep integration logic (from feature branch)
   - Manually merge both changes

   After resolving:
   git add .
   git commit --no-edit

6. VERIFY MERGE SUCCEEDED
   git log -1
   # Should show merge commit

   # Verify branch is now merged
   git log main..feature/campaign-generation-pipeline
   # Should show nothing

PART C: RE-APPLY PHASE 1 TYPESCRIPT FIXES (1 hour)

7. CHECK FOR TYPESCRIPT ERRORS
   npm run typecheck 2>&1 | grep -E "(CampaignGenerator|SmartPickGenerator|campaign-templates|OnboardingPageV5)" | head -20

   Document any errors found

8. FIX CAMPAIGNGENERATOR.TS (if needed)
   The merged version might have old type issues. Re-apply Phase 1A fixes:

   Read: src/types/synapse/synapseContent.types.ts
   Read: src/types/campaign-generation.types.ts

   Fix any errors using Phase 1A patterns:
   - Property access corrections
   - InsightType enum values
   - RefinedBusinessData properties
   - Platform vs platforms

9. FIX ONBOARDINGPAGEV5.TSX
   The merged version has full integration but might have type errors.

   Common fixes needed:
   - Import statements for Phase 1 types
   - Property access on refined types
   - Type annotations on handlers

   Fix all TypeScript errors

10. FIX NEW PREVIEW COMPONENTS
    Check these files for errors:
    - src/components/onboarding-v5/GenerationProgress.tsx
    - src/components/onboarding-v5/OnboardingCampaignPreview.tsx
    - src/components/onboarding-v5/OnboardingSinglePostPreview.tsx

    Apply same type fixes

11. VERIFY ALL FIXES
    npm run typecheck

    Should show 0 errors in campaign-related files

PART D: INTEGRATE MISSING PIECES (1 hour)

12. ADD ERROR HANDLER INTEGRATION
    The merged code won't have ErrorHandler (we just created it).

    In OnboardingPageV5.tsx, wrap async operations:

    import { errorHandler } from '@/services/error/ErrorHandler.service';

    // Wrap campaign generation
    const campaign = await errorHandler.executeWithRetry(
      () => campaignGenerator.generateCampaign(input),
      { operation: 'campaign_generation' }
    );

    // Add error handling to all async calls

13. ADD ANALYTICS TRACKING
    The merged code might have FunnelTracker, verify it's complete.

    Ensure all key events tracked:
    - url_input
    - extraction_started
    - extraction_complete
    - campaign_type_selected
    - generation_started
    - generation_complete
    - publishing_started
    - publishing_complete

14. ADD PUBLISHING INTEGRATION
    Wire AutoScheduler to the preview components:

    In OnboardingCampaignPreview.tsx:
    import { autoScheduler } from '@/services/publishing/auto-scheduler.service';

    Add scheduling logic to schedule handlers

PART E: TEST INTEGRATION (1 hour)

15. BUILD AND TEST
    npm run build

    Should succeed

16. TEST END-TO-END FLOW
    Start dev server: npm run dev

    Test complete journey:
    a) Enter website URL
    b) Extract UVPs
    c) View insights dashboard
    d) Select campaign from smart suggestions
    e) Watch generation progress
    f) Preview generated campaign
    g) Verify all posts visible
    h) Test schedule buttons

    Document any issues found

17. FIX ANY RUNTIME ERRORS
    - Check browser console for errors
    - Fix broken imports
    - Fix undefined references
    - Test error scenarios

PART F: CLEANUP & COMMIT (15 min)

18. VERIFY NO OTHER UNMERGED WORK
    ./scripts/check-unmerged-work.sh

    Should now show:
    ✅ feature/campaign-generation-pipeline: fully merged
    ✅ All other branches: fully merged

19. TAG AND DELETE MERGED BRANCH
    git tag campaign-generation-merged
    git branch -d feature/campaign-generation-pipeline

    # Clean up worktree if it exists
    git worktree remove worktrees/campaign-generation 2>/dev/null || true

20. FINAL COMMIT
    git add .
    git commit -m "fix: Apply Phase 1 TypeScript fixes to merged campaign-generation

    - Re-apply all Phase 1 type fixes to merged code
    - Integrate ErrorHandler with retry logic
    - Complete FunnelTracker integration
    - Wire AutoScheduler to preview components
    - Fix all TypeScript errors in OnboardingPageV5
    - Fix errors in new preview components
    - Test complete end-to-end flow

    Phase 2: Merge Campaign-Generation & Fix Complete

    🤖 Generated with [Claude Code](https://claude.com/claude-code)

    Co-Authored-By: Claude <noreply@anthropic.com>"

    git tag phase2-merge-complete
    git push origin main --tags

21. FINAL VERIFICATION
    ./scripts/check-unmerged-work.sh

    Must show all branches merged before proceeding to Phase 3!

CRITICAL RULES:
- Run safety check FIRST
- Stop if unexpected unmerged work found
- Resolve merge conflicts carefully (keep both changes)
- Re-apply all Phase 1 type fixes
- Test thoroughly before committing
- Ensure ErrorHandler integrated everywhere
- Verify analytics tracking complete
- Clean up merged branches
- Run final check before completing

SUCCESS CRITERIA:
✅ Safety check passed (only expected branch unmerged)
✅ feature/campaign-generation-pipeline merged successfully
✅ All merge conflicts resolved
✅ TypeScript errors: 0 in campaign files
✅ ErrorHandler integrated
✅ Analytics tracking complete
✅ Publishing wired up
✅ End-to-end flow tested and working
✅ Build succeeds
✅ Branch deleted and worktree cleaned up
✅ Final check shows all branches merged
✅ Committed with tag phase2-merge-complete

WHEN COMPLETE:
Report "Phase 2 Complete - Campaign generation merged, fixed, integrated, and verified clean"
```

---

## After Phase 2 Completes

**Verify everything is merged:**
```bash
./scripts/check-unmerged-work.sh

# Should show:
# ✅ All feature branches merged - safe to proceed!
```

Then request Phase 3 prompts (Optimization).

---

**Key Change:** This updated prompt includes mandatory safety checks to prevent losing work again! 🛡️
