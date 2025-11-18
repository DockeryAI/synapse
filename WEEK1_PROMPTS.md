# Week 1 Execution Prompts

**Goal:** Merge workstreams B, E, C to reach 85% MVP completion
**Duration:** 16 hours across 3 sequential tasks
**Current State:** 78% complete, 5 workstreams in separate branches

---

## Task Order

Run these tasks **sequentially** (not in parallel):
1. Task 1: Merge Workstream B (Publishing) - 2-3 hours
2. Task 2: Merge Workstream E (E2E Testing) - 1-2 hours
3. Task 3: Merge Workstream C (Error Handling) - 3-4 hours

**IMPORTANT:** Wait for each task to complete before starting the next one.

---

## 📋 Task 1: Merge Workstream B (Publishing Automation)

### Prompt for Claude Code:

```
Execute Week 1 Task 1: Merge Workstream B (Publishing Automation)

Read the full plan at /Users/byronhudson/Projects/Synapse/docs/builds/WEEK1_MERGE_STRATEGY.md (Task 1 section)

Key objectives:
1. Switch to main branch and ensure it's clean
2. Create backup branch: backup-before-b
3. Merge feature/publishing-automation into main
4. Resolve any conflicts (none expected)
5. Verify TypeScript builds successfully
6. Test AutoScheduler service integration
7. Verify publishing queue UI works
8. Run manual test: Schedule a test campaign
9. Commit merge with descriptive message
10. Create git tag: week1-task1-complete
11. Provide completion summary

Context:
- This merges 1,611 lines of publishing automation code
- Adds AutoScheduler service for bulk scheduling
- Adds publishing queue management
- No conflicts expected
- Critical for MVP launch

Success criteria:
- Zero TypeScript errors
- Publishing automation works end-to-end
- Can schedule campaigns to SocialPilot
- All tests pass

Working directory: /Users/byronhudson/Projects/Synapse

Do NOT proceed to Task 2 until I confirm Task 1 is complete.
```

**Expected Duration:** 2-3 hours
**Risk Level:** Low
**Conflicts Expected:** None

---

## 📋 Task 2: Merge Workstream E (E2E Testing)

### Prompt for Claude Code:

```
Execute Week 1 Task 2: Merge Workstream E (E2E Testing Infrastructure)

PREREQUISITES: Task 1 (Workstream B) must be complete before running this.

Read the full plan at /Users/byronhudson/Projects/Synapse/docs/builds/WEEK1_MERGE_STRATEGY.md (Task 2 section)

Key objectives:
1. Verify Task 1 merge is complete on main
2. Create backup branch: backup-before-e
3. Merge feature/e2e-tests into main
4. Install Playwright: npm install -D @playwright/test
5. Install Chromium: npx playwright install chromium
6. Verify test infrastructure works
7. Run test suite: npm run test:e2e (failures OK)
8. Verify port 3001 configuration
9. Commit merge with descriptive message
10. Create git tag: week1-task2-complete
11. Provide completion summary

Context:
- This merges 864 lines of E2E test infrastructure
- Adds Playwright with 31 comprehensive tests
- Tests may fail (features not integrated yet)
- Focus on infrastructure, not test results
- Isolated from main code (low conflict risk)

Success criteria:
- Playwright installs successfully
- Test infrastructure runs
- npm run test:e2e command works
- No conflicts with main code

Working directory: /Users/byronhudson/Projects/Synapse

Do NOT proceed to Task 3 until I confirm Task 2 is complete.
```

**Expected Duration:** 1-2 hours
**Risk Level:** Low
**Conflicts Expected:** None

---

## 📋 Task 3: Merge Workstream C (Error Handling)

### Prompt for Claude Code:

```
Execute Week 1 Task 3: Merge Workstream C (Error Handling)

PREREQUISITES: Tasks 1 (B) and 2 (E) must be complete before running this.

Read the full plan at /Users/byronhudson/Projects/Synapse/docs/builds/WEEK1_MERGE_STRATEGY.md (Task 3 section)

Key objectives:
1. Verify Tasks 1 and 2 merges are complete on main
2. Create backup branch: backup-before-c
3. Merge feature/error-handling into main
4. EXPECT conflict in SocialPilotClient.ts (B modified this file)
5. Resolve conflict: Combine B's scheduling + C's error handling
6. Integrate ErrorHandler into all services
7. Test retry logic with intentional API failure
8. Verify error boundaries work
9. Run TypeScript build - must have zero errors
10. Commit merge with descriptive message
11. Create git tag: week1-task3-complete
12. Provide Week 1 completion summary

Context:
- This merges 1,209 lines of error handling code
- Adds centralized ErrorHandler service
- Adds retry logic with exponential backoff
- Adds React error boundaries
- WILL conflict with B's SocialPilotClient changes

Conflict resolution strategy:
SocialPilotClient.ts - Combine both changes:
- Keep B's bulk scheduling methods
- Wrap them with C's error handling
- See WEEK1_MERGE_STRATEGY.md for example

Success criteria:
- Zero TypeScript errors
- All conflicts resolved correctly
- ErrorHandler integrated into all services
- Retry logic works on failures
- Error boundaries catch React errors
- Week 1 reaches 85% completion

Working directory: /Users/byronhudson/Projects/Synapse

After completion, provide summary of Week 1 achievements and next steps.
```

**Expected Duration:** 3-4 hours
**Risk Level:** Low-Medium (minor conflict expected)
**Conflicts Expected:** SocialPilotClient.ts (manageable)

---

## 📊 Execution Checklist

### Before Starting Week 1
- [ ] Read 100_PERCENT_MVP_PLAN.md
- [ ] Read WEEK1_MERGE_STRATEGY.md
- [ ] Verify all 5 workstreams exist in separate branches
- [ ] Ensure main branch is clean
- [ ] No uncommitted changes

### Task 1 Checklist
- [ ] Copy Task 1 prompt to Claude Code
- [ ] Wait for completion
- [ ] Verify publishing works
- [ ] Confirm success before Task 2

### Task 2 Checklist
- [ ] Verify Task 1 is merged successfully
- [ ] Copy Task 2 prompt to Claude Code
- [ ] Wait for completion
- [ ] Verify test infrastructure
- [ ] Confirm success before Task 3

### Task 3 Checklist
- [ ] Verify Tasks 1 and 2 are merged successfully
- [ ] Copy Task 3 prompt to Claude Code
- [ ] Wait for completion
- [ ] Verify error handling works
- [ ] Review Week 1 completion summary

### After Week 1 Complete
- [ ] Verify main branch at 85% completion
- [ ] All 3 workstreams merged
- [ ] Zero TypeScript errors
- [ ] Manual testing passes
- [ ] Ready for Week 2

---

## 🎯 Success Metrics

### After Week 1 Completion:
- **MVP Progress:** 78% → 85%
- **Workstreams Merged:** 3 of 5
- **Lines Integrated:** 3,684 lines
- **Features Working:**
  - ✅ Publishing automation
  - ✅ Error handling with retry
  - ✅ E2E test infrastructure
  - ❌ Campaign generation (Week 2)
  - ❌ Analytics tracking (Week 3)

### Technical State:
- ✅ AutoScheduler service integrated
- ✅ Bulk campaign scheduling works
- ✅ ErrorHandler prevents crashes
- ✅ Retry logic handles failures
- ✅ 31 E2E tests available
- ✅ Publishing queue UI complete

---

## 🚨 Monitoring Instructions for Claude Code

After each task completion:
1. ✅ Run `npm run build` - must succeed
2. ✅ Run `tsc --noEmit` - must have zero errors
3. ✅ Run manual verification tests
4. ✅ Create git tag for rollback point
5. ✅ Commit to main with descriptive message
6. ✅ Provide completion summary
7. ✅ Wait for user confirmation before next task

**Auto-merge policy:**
- If all tests pass → commit automatically
- If conflicts occur → resolve automatically (minor conflicts only)
- If complex issues → stop and ask for guidance

---

## 📝 Quick Reference

**Current State:** main branch at 78%
**Week 1 Goal:** Reach 85% by merging B, E, C
**Week 2 Goal:** Reach 95% by merging A (complex)
**Week 3 Goal:** Reach 100% by merging D and launch prep

**Documentation:**
- Overall plan: `/docs/100_PERCENT_MVP_PLAN.md`
- Week 1 details: `/docs/builds/WEEK1_MERGE_STRATEGY.md`
- Prompts: `/WEEK1_PROMPTS.md` (this file)

**Git Branches:**
- `main` - Target branch (currently 78%)
- `feature/publishing-automation` - Workstream B
- `feature/e2e-tests` - Workstream E
- `feature/error-handling` - Workstream C
- `feature/campaign-generation` - Workstream A (Week 2)
- `feature/analytics-tracking` - Workstream D (Week 3)

---

## 🎬 Ready to Start

Copy the Task 1 prompt above and paste into Claude Code to begin Week 1.

After Task 1 completes, I'll automatically test, commit, and provide the next prompt.

**Estimated total time:** 6-9 hours
**Estimated completion:** Today or tomorrow
