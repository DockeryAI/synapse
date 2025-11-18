# Claude Code Execution Prompts
**Quick Reference:** Copy-paste these prompts to execute each workstream

---

## 📋 WEEK 1: CRITICAL PATH

### Workstream A: Campaign Generation (26h) - START FIRST
```
Execute Week 1 Workstream A: Campaign Generation Pipeline.

Read the full plan at /Users/byronhudson/Projects/Synapse/docs/builds/WEEK1_WORKSTREAM_A.md

Key objectives:
1. Create CampaignGenerator service to generate real campaigns
2. Wire SmartSuggestions buttons to actual content generation
3. Replace all placeholder content with real AI-generated copy
4. Integrate with Bannerbear for visuals
5. Save to database

Setup the git worktree, complete all 5 tasks, run tests, and wait for review before merging.

Context:
- Gap analysis: COMPREHENSIVE_GAP_ANALYSIS_NOV17.md (Section 7, Gaps #1-3)
- Current onboarding: src/pages/OnboardingPageV5.tsx (lines 204-258)
- Existing orchestrator: src/services/campaign/CampaignOrchestrator.ts

Estimated time: 26 hours over 3-4 days
```

### Workstream B: Publishing Integration (14h) - RUN IN PARALLEL
```
Execute Week 1 Workstream B: Publishing Integration (can run in parallel with Workstream A).

Read the full plan at /Users/byronhudson/Projects/Synapse/docs/builds/WEEK1_WORKSTREAM_B.md

Key objectives:
1. Create AutoScheduler service for bulk campaign scheduling
2. Respect platform limits (Instagram 1/day, Facebook 3/day, etc.)
3. Auto-schedule campaigns after generation
4. Track publishing analytics
5. Create schedule confirmation UI

Use PORT=3001 to avoid conflicts if running parallel with Workstream A.

Context:
- Current publishing: src/services/socialpilot.service.ts
- Publishing automation: src/services/publishing-automation.service.ts
- Gap analysis: COMPREHENSIVE_GAP_ANALYSIS_NOV17.md (Section 3)

Estimated time: 14 hours over 1.5-2 days
```

---

## 📋 WEEK 2: POLISH & RELIABILITY

### Workstream C: Error Handling (10h)
```
Execute Week 2 Workstream C: Error Handling & Retry Logic.

Read the full plan at /Users/byronhudson/Projects/Synapse/docs/builds/WEEK2_WORKSTREAMS.md (Workstream C section)

Key objectives:
1. Create centralized error handler with exponential backoff
2. Add retry logic to UVP extraction (max 3 attempts)
3. Add retry logic to campaign generation
4. Use cached data as fallback when APIs fail
5. Show retry progress to users

Prerequisites: Week 1 Workstreams A & B must be merged to main.

Estimated time: 10 hours
```

### Workstream D: Analytics & Tracking (8h) - RUN IN PARALLEL WITH C
```
Execute Week 2 Workstream D: Analytics & Funnel Tracking (can run in parallel with Workstream C).

Read the full plan at /Users/byronhudson/Projects/Synapse/docs/builds/WEEK2_WORKSTREAMS.md (Workstream D section)

Key objectives:
1. Create funnel tracker service
2. Track all onboarding steps
3. Track campaign generation events
4. Track publishing events
5. Create analytics dashboard showing conversion rates

Use PORT=3002 to avoid conflicts with other workstreams.

Prerequisites: Week 1 Workstreams A & B must be merged to main.

Estimated time: 8 hours
```

### Workstream E: End-to-End Testing (12h)
```
Execute Week 2 Workstream E: End-to-End Testing with Playwright.

Read the full plan at /Users/byronhudson/Projects/Synapse/docs/builds/WEEK2_WORKSTREAMS.md (Workstream E section)

Key objectives:
1. Install Playwright and configure
2. Write E2E tests for onboarding flow (4 hours)
3. Write E2E tests for campaign generation (4 hours)
4. Write E2E tests for publishing (4 hours)
5. Achieve >80% coverage on critical paths

Prerequisites: ALL Week 1 and Week 2 workstreams (A, B, C, D) must be complete and merged.

Estimated time: 12 hours
```

---

## 📋 WEEK 3: LAUNCH

### Workstream F: Documentation & Launch (16h)
```
Execute Week 3 Workstream F: Launch Preparation.

Read the full plan at /Users/byronhudson/Projects/Synapse/docs/builds/WEEK3_LAUNCH_PREP.md

Key objectives:
1. Write user documentation (USER_GUIDE, FAQ, TROUBLESHOOTING)
2. Write API documentation (API_DOCS, ARCHITECTURE)
3. Coordinate beta testing with 5 users
4. Deploy to production (Vercel)
5. Set up monitoring dashboard
6. Launch! 🚀

Prerequisites: ALL Week 1 and Week 2 workstreams must be complete, tested, and merged.

Estimated time: 16 hours over 5-6 days
```

---

## 🎯 EXECUTION ORDER

**Week 1 (Nov 18-24):**
1. Start Workstream A in one Claude instance
2. Start Workstream B in another Claude instance (parallel)
3. Wait for both to complete
4. Review, merge A, then B
5. Test end-to-end flow

**Week 2 (Nov 25 - Dec 1):**
1. Start Workstream C
2. Start Workstream D (parallel with C)
3. Merge C and D
4. Start Workstream E (after C & D merged)
5. Merge E

**Week 3 (Dec 2-8):**
1. Start Workstream F
2. Run beta tests
3. Deploy to production
4. Monitor and launch! 🚀

---

## 📊 PROGRESS TRACKING

After each workstream:
- [ ] Week 1 Workstream A ✅ (Campaign Generation)
- [ ] Week 1 Workstream B ✅ (Publishing Integration)
- [ ] Week 2 Workstream C ✅ (Error Handling)
- [ ] Week 2 Workstream D ✅ (Analytics)
- [ ] Week 2 Workstream E ✅ (E2E Testing)
- [ ] Week 3 Workstream F ✅ (Launch Prep)

**Current Status:** 75% complete
**Target:** 100% MVP by December 8, 2025
**Time Remaining:** 86 hours (16-19 days)

---

## 🚀 LAUNCH CHECKLIST

- [ ] All 6 workstreams complete
- [ ] All E2E tests passing
- [ ] Beta testing complete (5 users)
- [ ] Production deployment stable
- [ ] Documentation published
- [ ] <4 minute onboarding time achieved
- [ ] >95% content generation success rate
- [ ] >99% publishing success rate
- [ ] LAUNCH! 🎉

---

**NEXT ACTION:** Copy Workstream A prompt and give to Claude Code to start Week 1
