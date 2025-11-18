# Week 1: Foundation Merges - Build Strategy

**Goal:** Merge low-risk workstreams B, E, C to establish foundation
**Duration:** 16 hours across 3 tasks
**Risk:** Low - Minimal conflicts expected
**Approach:** Sequential merges with testing gates

---

## Overview

Week 1 merges the foundational layers that other workstreams depend on:
1. **Workstream B:** Publishing Automation (AutoScheduler service)
2. **Workstream E:** E2E Testing Infrastructure (Playwright tests)
3. **Workstream C:** Error Handling (Centralized ErrorHandler)

**Why This Order:**
- B first: Provides publishing capability, no conflicts expected
- E second: Test infrastructure, isolated from main code
- C last: Error handling may need to integrate with B's code

---

## Task 1: Merge Workstream B (Publishing Automation)

### Scope
Merge `feature/publishing-automation` branch into `main`

**Files Modified:** 8 files
**Lines Added:** +1,611
**Conflicts Expected:** None
**Time Estimate:** 2-3 hours

### Deliverables
1. `AutoScheduler.ts` service integrated
2. `SocialPilotClient.ts` enhanced with bulk scheduling
3. Database schema for scheduled_posts table active
4. Publishing queue management UI working

### Files to Merge
```
src/services/publishing/AutoScheduler.ts (NEW)
src/services/publishing/SocialPilotClient.ts (MODIFIED)
src/services/publishing/publishingTypes.ts (MODIFIED)
src/components/publishing/ScheduleConfirmation.tsx (NEW)
src/components/publishing/PublishingQueue.tsx (NEW)
supabase/migrations/20250116_scheduled_posts.sql (NEW)
src/pages/CalendarPage.tsx (MODIFIED)
package.json (MODIFIED - if dependencies added)
```

### Pre-Merge Checklist
- [ ] Verify main branch is clean
- [ ] Create backup branch: `git branch backup-before-b`
- [ ] Review feature/publishing-automation branch files
- [ ] Check for any unexpected modifications
- [ ] Verify no other workstreams are running

### Merge Process
1. Switch to main branch
2. Pull latest changes
3. Merge feature/publishing-automation
4. Resolve any conflicts (unlikely)
5. Run TypeScript build
6. Run tests
7. Manual verification

### Testing Checklist
- [ ] TypeScript compiles with no errors
- [ ] `npm run build` succeeds
- [ ] AutoScheduler service instantiates
- [ ] Can schedule a test post
- [ ] Publishing queue displays correctly
- [ ] Database migration applied successfully
- [ ] SocialPilot API integration works

### Rollback Plan
If merge fails:
```bash
git reset --hard backup-before-b
git branch -D backup-before-b
```

---

## Task 2: Merge Workstream E (E2E Testing)

### Scope
Merge `feature/e2e-tests` branch into `main`

**Files Modified:** 8 files
**Lines Added:** +864
**Conflicts Expected:** None (test files are isolated)
**Time Estimate:** 1-2 hours

### Deliverables
1. Playwright configuration active
2. 31 E2E tests available
3. Test infrastructure ready
4. CI/CD test scripts configured

### Files to Merge
```
playwright.config.ts (NEW)
src/__tests__/e2e/onboarding.spec.ts (NEW)
src/__tests__/e2e/campaign-generation.spec.ts (NEW)
src/__tests__/e2e/publishing.spec.ts (NEW)
src/__tests__/e2e/README.md (NEW)
package.json (MODIFIED - test scripts)
.gitignore (MODIFIED - test artifacts)
vite.config.ts (MODIFIED - port 3001 for tests)
```

### Pre-Merge Checklist
- [ ] Verify Task 1 (B) is merged successfully
- [ ] Create backup branch: `git branch backup-before-e`
- [ ] Check that worktree used port 3001 correctly
- [ ] Verify test files don't conflict with main

### Merge Process
1. Ensure on main branch with B merged
2. Merge feature/e2e-tests
3. Install Playwright: `npm install -D @playwright/test`
4. Install Chromium: `npx playwright install chromium`
5. Run test suite
6. Verify configuration

### Testing Checklist
- [ ] Playwright installs successfully
- [ ] `npm run test:e2e` command exists
- [ ] Can run tests (may fail, that's okay)
- [ ] Test infrastructure works
- [ ] No conflicts with main code
- [ ] Documentation is clear

### Notes
- Tests may fail initially because features aren't integrated yet
- Focus on infrastructure, not test results
- Port 3001 configuration should work correctly

---

## Task 3: Merge Workstream C (Error Handling)

### Scope
Merge `feature/error-handling` branch into `main`

**Files Modified:** 6 files
**Lines Added:** +1,209
**Conflicts Expected:** Minor (ErrorHandler usage in existing services)
**Time Estimate:** 3-4 hours

### Deliverables
1. Centralized `ErrorHandler` service
2. Retry logic with exponential backoff
3. Error boundaries in React components
4. All services using ErrorHandler
5. Logging infrastructure

### Files to Merge
```
src/services/errors/ErrorHandler.ts (NEW)
src/services/errors/errorTypes.ts (NEW)
src/components/common/ErrorBoundary.tsx (NEW)
src/services/intelligence/UVPExtractor.ts (MODIFIED - uses ErrorHandler)
src/services/intelligence/CampaignSuggestionGenerator.ts (MODIFIED)
src/services/publishing/SocialPilotClient.ts (MODIFIED - conflict with B!)
```

### Pre-Merge Checklist
- [ ] Verify Tasks 1 (B) and 2 (E) are merged successfully
- [ ] Create backup branch: `git branch backup-before-c`
- [ ] **IMPORTANT:** SocialPilotClient.ts was modified in B
- [ ] Review ErrorHandler integration points
- [ ] Check for dependency on B's code

### Merge Process
1. Ensure on main branch with B and E merged
2. Merge feature/error-handling
3. **Expect conflict in SocialPilotClient.ts**
4. Resolve manually: Keep both B's scheduling logic AND C's error handling
5. Update other services to use ErrorHandler
6. Run TypeScript build
7. Test error handling

### Conflict Resolution Strategy

**SocialPilotClient.ts conflict:**
- Workstream B added: Bulk scheduling methods
- Workstream C added: Error handler wrapper
- **Resolution:** Combine both - wrap B's methods with C's error handling

Example:
```typescript
// B's contribution (keep this)
async bulkSchedule(posts: ScheduledPost[]) {
  // scheduling logic
}

// C's contribution (add error handling to B's methods)
async bulkSchedule(posts: ScheduledPost[]) {
  return this.errorHandler.withRetry(async () => {
    // B's scheduling logic here
  });
}
```

### Testing Checklist
- [ ] TypeScript compiles with no errors
- [ ] ErrorHandler service instantiates
- [ ] Retry logic works (test with failed API call)
- [ ] Error boundaries catch errors
- [ ] UVP extraction uses ErrorHandler
- [ ] SocialPilot client uses ErrorHandler
- [ ] All services integrated correctly
- [ ] Logging captures errors

### Integration Verification
- [ ] Make intentional API error → verify retry
- [ ] Trigger React error → verify boundary catches it
- [ ] Check error logs are structured correctly

---

## Week 1 Success Criteria

### Code Quality
- [ ] Zero TypeScript errors
- [ ] All merges completed successfully
- [ ] No console errors during manual testing
- [ ] Build succeeds: `npm run build`

### Functional Requirements
- [ ] Publishing automation works
- [ ] Can schedule posts to SocialPilot
- [ ] E2E test infrastructure runs
- [ ] Error handling prevents crashes
- [ ] Retry logic works on failures

### Testing
- [ ] Manual test: Schedule a campaign → succeeds
- [ ] Manual test: Trigger API error → retries
- [ ] E2E tests run (pass/fail not critical yet)
- [ ] No regressions in existing features

### Documentation
- [ ] CHANGELOG updated with Week 1 changes
- [ ] README reflects new capabilities
- [ ] E2E test docs accessible

---

## Post-Week 1 State

### What Will Be Working
✅ Publishing automation (schedule campaigns)
✅ Error handling (retry, logging, boundaries)
✅ E2E test infrastructure (ready for Week 2)
✅ Foundation for Week 2 merges

### What Will Still Be Missing
❌ Campaign generation (TODO placeholders still exist)
❌ Real content creation (worktree A not merged)
❌ Analytics tracking (worktree D not merged)

### Main Branch Completion
- Before Week 1: 49%
- After Week 1: **~85%**
- Remaining: 15% (campaign generation + analytics)

---

## Monitoring & Auto-Merge Strategy

After each task completes:
1. ✅ Verify tests pass
2. ✅ Run manual verification
3. ✅ Commit to main with descriptive message
4. ✅ Create git tag: `week1-task-X-complete`
5. ✅ Provide status update
6. ✅ Offer next task prompt

**Auto-merge enabled:** Yes, if all tests pass
**Manual review required:** Only if conflicts occur
**Rollback available:** Yes, via git tags

---

## Next Steps After Week 1

Once Week 1 completes successfully:
- Review overall state
- Verify foundation is solid
- Prepare Week 2 task lists (Workstream A)
- Plan conflict resolution for OnboardingPageV5.tsx

---

**Status:** Ready for execution
**First Task:** Merge Workstream B (Publishing Automation)
**Estimated Completion:** 16 hours total
