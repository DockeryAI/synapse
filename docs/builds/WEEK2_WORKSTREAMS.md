# Week 2: Polish & Reliability Workstreams
**Total Time:** 30 hours (can run in parallel)
**Dependencies:** Week 1 must be complete

---

## WORKSTREAM C: Error Handling & Retry Logic (10 hours)

### Setup:
```bash
git worktree add worktrees/error-handling -b feature/error-handling
cd worktrees/error-handling
npm install
npm run dev
```

### Tasks:

**1. Create Error Handler Service (3h)**
File: `src/services/errors/error-handler.service.ts`
- Exponential backoff retry logic
- Fallback strategies (use cache if API fails)
- User-friendly error messages
- Error categorization (retryable vs fatal)

**2. Add Extraction Retry Logic (3h)**
Files: `src/services/uvp-wizard/SmartUVPExtractor.ts`, `src/pages/OnboardingPageV5.tsx`
- Retry failed API calls (max 3 attempts)
- Use cached data as fallback
- Show retry progress to user
- Graceful degradation

**3. Add Campaign Generation Error Handling (4h)**
Files: `src/services/campaign/CampaignGenerator.ts`
- Handle AI generation failures
- Retry with different prompts
- Show user options on persistent failure
- Save partial results

### Success Criteria:
- [ ] Failed API calls auto-retry
- [ ] Users see retry progress
- [ ] Fallback to cache works
- [ ] No unhandled promise rejections

### Merge Command:
```bash
git checkout main && git pull
git merge feature/error-handling
npm run build && npm test
git push origin main
git worktree remove worktrees/error-handling
```

---

## WORKSTREAM D: Analytics & Tracking (8 hours)

### Setup:
```bash
git worktree add worktrees/analytics -b feature/analytics-tracking
cd worktrees/analytics
npm install
PORT=3002 npm run dev
```

### Tasks:

**1. Create Funnel Tracker Service (3h)**
File: `src/services/analytics/funnel-tracker.service.ts`
- Track onboarding steps (URL input, extraction, confirmation, insights, suggestions, generation)
- Track campaign creation funnel
- Track publishing funnel
- Store in Supabase `analytics_events` table

**2. Add Tracking Calls (3h)**
Files: Multiple (OnboardingPageV5, CampaignPage, etc.)
- Onboarding: track each step completion
- Campaign: track type selection, generation, editing
- Publishing: track scheduling, publishing success/failure
- Use consistent event naming convention

**3. Create Analytics Dashboard (2h)**
File: `src/components/analytics/FunnelDashboard.tsx`
- Show onboarding conversion rates
- Show campaign generation success rates
- Show publishing success rates
- Show drop-off points

### Success Criteria:
- [ ] All key events tracked
- [ ] Events stored in database
- [ ] Dashboard shows metrics
- [ ] Conversion rates calculated

### Merge Command:
```bash
git checkout main && git pull
git merge feature/analytics-tracking
npm run build && npm test
git push origin main
git worktree remove worktrees/analytics
```

---

## WORKSTREAM E: End-to-End Testing (12 hours)

### Setup:
```bash
git worktree add worktrees/e2e-testing -b feature/e2e-tests
cd worktrees/e2e-testing
npm install @playwright/test
npx playwright install
npm run dev
```

### Tasks:

**1. Onboarding Flow Tests (4h)**
File: `src/__tests__/e2e/onboarding.spec.ts`
- Test: URL input → extraction → confirmation → insights → suggestions
- Test: Campaign selection → generation → preview
- Test: Post selection → generation → preview
- Test: Error handling (invalid URL, API failures)

**2. Campaign Generation Tests (4h)**
File: `src/__tests__/e2e/campaign-generation.spec.ts`
- Test: SmartPicks flow end-to-end
- Test: ContentMixer flow end-to-end
- Test: Campaign preview and editing
- Test: Campaign scheduling

**3. Publishing Flow Tests (4h)**
File: `src/__tests__/e2e/publishing.spec.ts`
- Test: Schedule single post
- Test: Schedule campaign (bulk)
- Test: Publishing queue
- Test: Publishing failure handling

### Playwright Config:
```typescript
// playwright.config.ts
export default {
  testDir: './src/__tests__/e2e',
  timeout: 60000,
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ]
};
```

### Success Criteria:
- [ ] All E2E tests passing
- [ ] >80% test coverage on critical paths
- [ ] Tests run in CI/CD pipeline
- [ ] No flaky tests

### Merge Command:
```bash
git checkout main && git pull
git merge feature/e2e-tests
npm run build && npm test
git push origin main
git worktree remove worktrees/e2e-testing
```

---

## WEEK 2 EXECUTION ORDER

**Days 1-2 (Mon-Tue):**
- Run Workstream C & D in parallel (different files)
- 18 hours total work

**Days 3-4 (Wed-Thu):**
- Merge C & D
- Start Workstream E (requires C & D complete)
- 8 hours of E

**Days 5-6 (Fri-Sat):**
- Complete Workstream E
- Fix any bugs discovered by tests
- 4 hours

**Day 7 (Sun):**
- Final merge and review
- Prepare for Week 3

---

## DEPENDENCIES

**Workstream C:** No dependencies (can start immediately)
**Workstream D:** No dependencies (can run parallel with C)
**Workstream E:** Requires Workstreams A, B, C, D complete

---

## NOTES

- Workstreams C & D touch different files - safe to run in parallel
- Workstream E is validation - must run last
- All workstreams should merge to main incrementally
- Test each merge before proceeding

---

**STATUS:** Ready to execute after Week 1 complete
**TIMELINE:** 6-7 days
