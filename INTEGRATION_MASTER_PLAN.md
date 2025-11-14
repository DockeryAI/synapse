# Synapse Integration Master Plan
**Critical Integration Phase - Connecting Backend to UI**

**Status:** 🟡 IN PROGRESS
**Start Date:** November 14, 2025
**Estimated Completion:** November 17, 2025 (3 days)
**Current Phase:** Planning

---

## Mission

Connect all orphaned backend services to the UI to create a fully functional MVP where users can:
1. Input a URL and get intelligent business analysis
2. Generate a 30-day content calendar automatically
3. Publish content to SocialPilot

---

## Gap Summary from Analysis

- **8 services built but not connected to UI (73% orphaned)**
- **P0 critical user flows completely broken**
- **Only SocialPilot integration works**

---

## Integration Strategy

### Phase 1: Core Orchestration (CRITICAL - Days 1-2)
Build the "glue code" that connects services together and exposes them to UI.

### Phase 2: UI Wiring (CRITICAL - Day 2)
Wire orchestration hooks into existing UI components.

### Phase 3: Data Flow & Testing (CRITICAL - Day 3)
Verify end-to-end data flows and fix issues.

### Phase 4: Validation & Commit (Day 3)
Full gap analysis, endpoint verification, commit.

---

## Detailed Task Breakdown

### PHASE 1: CORE ORCHESTRATION HOOKS

#### Task 1.1: Create useOnboarding Hook
**File:** `src/hooks/useOnboarding.ts`
**Lines:** ~200
**Dependencies:** None
**Purpose:** Orchestrate URL → Parser → Intelligence → Specialty flow

**Requirements:**
- Import all Worktree 1 services
- Create state management for onboarding data
- Implement sequential flow: URL input → parse → gather intelligence → detect specialty
- Handle loading states
- Handle errors gracefully
- Return structured data for UI consumption

**Acceptance Criteria:**
- [ ] Hook exports `useOnboarding()` function
- [ ] Accepts `url: string` as input
- [ ] Returns `{ data, loading, error, execute }` interface
- [ ] Calls `urlParser.parse()` ✅
- [ ] Calls `parallelIntelligence.gather()` ✅
- [ ] Calls `specialtyDetector.detectSpecialty()` ✅
- [ ] Handles all error cases
- [ ] TypeScript types are complete
- [ ] JSDoc documentation added

**Integration Points:**
- Will be used by: SynapsePage.tsx

---

#### Task 1.2: Create useCalendarGeneration Hook
**File:** `src/hooks/useCalendarGeneration.ts`
**Lines:** ~150
**Dependencies:** Task 1.1 (needs specialty data)
**Purpose:** Orchestrate Specialty → Calendar Population → Content Ideas

**Requirements:**
- Import Calendar Population and Content Ideas Generator services
- Accept specialty detection results
- Generate 30 content ideas
- Enhance with platform-specific suggestions
- Return structured calendar data

**Acceptance Criteria:**
- [ ] Hook exports `useCalendarGeneration()` function
- [ ] Accepts `SpecialtyDetection` as input
- [ ] Returns `{ calendar, loading, error, generate }` interface
- [ ] Calls `calendarPopulator.populate()` ✅
- [ ] Calls `contentGenerator.generateSuggestions()` ✅
- [ ] Returns 30 content ideas
- [ ] Includes platform variations
- [ ] TypeScript types complete
- [ ] JSDoc documentation added

**Integration Points:**
- Will be used by: ContentCalendarHub.tsx

---

#### Task 1.3: Create useSynapseCalendarBridge Hook
**File:** `src/hooks/useSynapseCalendarBridge.ts`
**Lines:** ~100
**Dependencies:** Task 1.1, Task 1.2
**Purpose:** Bridge Synapse intelligence to Calendar system

**Requirements:**
- Import Synapse-Calendar Bridge service
- Transform intelligence data for calendar consumption
- Map intelligence to content pillars
- Extract opportunities

**Acceptance Criteria:**
- [ ] Hook exports `useSynapseCalendarBridge()` function
- [ ] Accepts intelligence results
- [ ] Calls `synapseBridge.transformIntelligence()` ✅
- [ ] Returns transformed data structure
- [ ] TypeScript types complete
- [ ] JSDoc documentation added

**Integration Points:**
- Will be used by: IntelligencePanel.tsx, ContentCalendarHub.tsx

---

#### Task 1.4: Create useIntelligenceDisplay Hook
**File:** `src/hooks/useIntelligenceDisplay.ts`
**Lines:** ~80
**Dependencies:** Task 1.1
**Purpose:** Format intelligence data for UI display

**Requirements:**
- Accept raw intelligence results
- Format for IntelligenceDisplay component
- Calculate confidence scores
- Group by source type

**Acceptance Criteria:**
- [ ] Hook exports `useIntelligenceDisplay()` function
- [ ] Accepts `IntelligenceResult[]` as input
- [ ] Returns formatted display data
- [ ] Calculates aggregate scores
- [ ] TypeScript types complete
- [ ] JSDoc documentation added

**Integration Points:**
- Will be used by: IntelligenceDisplay.tsx

---

#### Task 1.5: Create useRedditOpportunities Hook (Optional P1)
**File:** `src/hooks/useRedditOpportunities.ts`
**Lines:** ~100
**Dependencies:** Task 1.1
**Purpose:** Discover Reddit opportunities for business

**Requirements:**
- Import Reddit Opportunity service
- Accept specialty data
- Fetch opportunities
- Format for UI display

**Acceptance Criteria:**
- [ ] Hook exports `useRedditOpportunities()` function
- [ ] Calls `redditOpportunityService.discoverOpportunities()` ✅
- [ ] Returns opportunity data
- [ ] TypeScript types complete
- [ ] JSDoc documentation added

**Integration Points:**
- Will be used by: New "Opportunities" tab in Intelligence Panel

---

### PHASE 2: UI WIRING

#### Task 2.1: Wire SynapsePage to useOnboarding Hook
**File:** `src/pages/SynapsePage.tsx`
**Lines:** ~50 additions
**Dependencies:** Task 1.1
**Purpose:** Connect URL input to intelligence gathering

**Requirements:**
- Import useOnboarding hook
- Call hook with URL when user submits
- Display loading state during processing
- Show results when complete
- Handle errors

**Acceptance Criteria:**
- [ ] Imports `useOnboarding` hook
- [ ] Calls hook on form submit
- [ ] Displays loading spinner during processing
- [ ] Shows intelligence results on success
- [ ] Shows error message on failure
- [ ] URL input triggers full onboarding flow
- [ ] User sees specialty detection results
- [ ] Build succeeds
- [ ] No TypeScript errors

**Integration Points:**
- Triggers: useCalendarGeneration (next step in flow)

---

#### Task 2.2: Wire ContentCalendarHub to useCalendarGeneration Hook
**File:** `src/components/content-calendar/ContentCalendarHub.tsx`
**Lines:** ~60 additions
**Dependencies:** Task 1.2, Task 2.1
**Purpose:** Generate 30-day calendar from intelligence

**Requirements:**
- Import useCalendarGeneration hook
- Accept specialty data from SynapsePage
- Generate calendar on mount or button click
- Display 30 calendar items
- Wire to existing calendar UI

**Acceptance Criteria:**
- [ ] Imports `useCalendarGeneration` hook
- [ ] Accepts specialty data as prop
- [ ] Calls hook to generate calendar
- [ ] Displays 30 content items
- [ ] Shows loading state
- [ ] Handles errors
- [ ] Calendar items render correctly
- [ ] Build succeeds
- [ ] No TypeScript errors

**Integration Points:**
- Receives data from: SynapsePage (via routing/context)
- Displays in: CalendarView component

---

#### Task 2.3: Wire IntelligencePanel to useSynapseCalendarBridge Hook
**File:** `src/components/calendar/IntelligencePanel.tsx`
**Lines:** ~40 additions
**Dependencies:** Task 1.3
**Purpose:** Display intelligence data in calendar view

**Requirements:**
- Import useSynapseCalendarBridge hook
- Accept intelligence data as prop
- Transform and display
- Show content pillars
- Show opportunities

**Acceptance Criteria:**
- [ ] Imports `useSynapseCalendarBridge` hook
- [ ] Accepts intelligence data as prop
- [ ] Displays transformed data
- [ ] Shows content pillars
- [ ] Shows opportunities
- [ ] Build succeeds
- [ ] No TypeScript errors

**Integration Points:**
- Receives data from: ContentCalendarHub

---

#### Task 2.4: Wire IntelligenceDisplay to useIntelligenceDisplay Hook
**File:** `src/components/synapse/IntelligenceDisplay.tsx`
**Lines:** ~30 additions
**Dependencies:** Task 1.4
**Purpose:** Display raw intelligence results

**Requirements:**
- Import useIntelligenceDisplay hook
- Accept intelligence results as prop
- Format and display
- Show confidence scores

**Acceptance Criteria:**
- [ ] Imports `useIntelligenceDisplay` hook
- [ ] Accepts intelligence results as prop
- [ ] Displays formatted data
- [ ] Shows confidence scores
- [ ] Build succeeds
- [ ] No TypeScript errors

**Integration Points:**
- Receives data from: SynapsePage

---

#### Task 2.5: Create Data Flow Context (if needed)
**File:** `src/contexts/OnboardingContext.tsx`
**Lines:** ~150
**Dependencies:** Task 2.1, Task 2.2
**Purpose:** Share onboarding data between SynapsePage and ContentCalendarHub

**Requirements:**
- Create React Context for onboarding data
- Provide onboarding state to app
- Allow components to access specialty, intelligence, calendar data
- Persist during navigation

**Acceptance Criteria:**
- [ ] Context exports `OnboardingProvider`
- [ ] Context exports `useOnboardingContext` hook
- [ ] Stores specialty detection results
- [ ] Stores intelligence results
- [ ] Stores calendar data
- [ ] TypeScript types complete
- [ ] Build succeeds

**Integration Points:**
- Wraps: App or relevant route
- Used by: SynapsePage, ContentCalendarHub

---

### PHASE 3: DATA FLOW & TESTING

#### Task 3.1: End-to-End Flow Test - Onboarding
**File:** Manual testing + fixes
**Dependencies:** Task 2.1
**Purpose:** Verify URL → Intelligence → Specialty flow works

**Test Steps:**
1. Navigate to SynapsePage
2. Enter URL: "https://example.com"
3. Click Submit
4. Verify: Loading spinner appears
5. Verify: Intelligence gathering runs
6. Verify: Specialty detection completes
7. Verify: Results display on page
8. Check console for errors
9. Verify data structure is correct

**Acceptance Criteria:**
- [ ] URL input accepts text
- [ ] Submit button triggers hook
- [ ] Loading state displays
- [ ] No console errors
- [ ] Intelligence data returns
- [ ] Specialty detection returns
- [ ] Results render in UI
- [ ] Flow completes in <30 seconds

**Fixes Required:** TBD based on test results

---

#### Task 3.2: End-to-End Flow Test - Calendar Generation
**File:** Manual testing + fixes
**Dependencies:** Task 2.2
**Purpose:** Verify Specialty → Calendar Population → Content Ideas flow works

**Test Steps:**
1. Complete onboarding flow (Task 3.1)
2. Navigate to ContentCalendarHub
3. Verify: Calendar generation triggers
4. Verify: 30 content items generate
5. Verify: Platform variations exist
6. Verify: Items display in calendar UI
7. Check console for errors
8. Verify data structure is correct

**Acceptance Criteria:**
- [ ] Calendar generation triggers automatically or on button click
- [ ] Loading state displays
- [ ] No console errors
- [ ] Exactly 30 items generated
- [ ] Distribution: 60% educational, 30% promotional, 10% engagement
- [ ] Each item has platform variations
- [ ] Items render in calendar view
- [ ] Flow completes in <60 seconds

**Fixes Required:** TBD based on test results

---

#### Task 3.3: End-to-End Flow Test - Intelligence Display
**File:** Manual testing + fixes
**Dependencies:** Task 2.4
**Purpose:** Verify intelligence data displays correctly

**Test Steps:**
1. Complete onboarding flow
2. Navigate to IntelligenceDisplay component
3. Verify: Intelligence results display
4. Verify: Confidence scores shown
5. Verify: Sources grouped correctly
6. Check console for errors

**Acceptance Criteria:**
- [ ] Component receives data
- [ ] Data displays correctly
- [ ] No console errors
- [ ] Confidence scores calculate
- [ ] UI is responsive

**Fixes Required:** TBD based on test results

---

#### Task 3.4: End-to-End Flow Test - Full User Journey
**File:** Manual testing + fixes
**Dependencies:** Tasks 3.1, 3.2, 3.3
**Purpose:** Verify complete user journey works

**Test Scenario:**
1. User lands on app
2. User navigates to Synapse
3. User enters business URL
4. System gathers intelligence
5. System detects specialty
6. User navigates to calendar
7. System generates 30-day calendar
8. User views content items
9. User connects SocialPilot
10. User schedules posts

**Acceptance Criteria:**
- [ ] Full journey completes without errors
- [ ] Data flows between all steps
- [ ] User can complete all P0 features
- [ ] No broken links or navigation issues
- [ ] Loading states work
- [ ] Error handling works
- [ ] Can publish to SocialPilot

**Fixes Required:** TBD based on test results

---

#### Task 3.5: Performance Optimization
**File:** Various
**Dependencies:** All previous tasks
**Purpose:** Ensure performance meets requirements

**Requirements:**
- Intelligence gathering < 30 seconds
- Calendar generation < 60 seconds
- UI remains responsive
- No memory leaks

**Acceptance Criteria:**
- [ ] Intelligence gathering completes in <30s
- [ ] Calendar generation completes in <60s
- [ ] No console warnings about performance
- [ ] No memory leaks detected
- [ ] Build bundle size reasonable
- [ ] Page load times acceptable

**Optimizations:** TBD based on profiling

---

### PHASE 4: VALIDATION & COMMIT

#### Task 4.1: API Endpoint Verification
**File:** Testing script
**Dependencies:** All Phase 3 tasks
**Purpose:** Verify all API endpoints work correctly

**Endpoints to Test:**
- [ ] `urlParser.parse()` - Returns valid ParsedURL
- [ ] `parallelIntelligence.gather()` - Returns IntelligenceResult[]
- [ ] `specialtyDetector.detectSpecialty()` - Returns SpecialtyDetection
- [ ] `calendarPopulator.populate()` - Returns ContentIdea[]
- [ ] `contentGenerator.generateSuggestions()` - Returns ContentSuggestion[]
- [ ] `synapseBridge.transformIntelligence()` - Returns transformed data
- [ ] `socialPilotService` methods - All work correctly

**Acceptance Criteria:**
- [ ] All endpoints callable from UI
- [ ] All return expected data structures
- [ ] Error handling works
- [ ] No 404 or connection errors

---

#### Task 4.2: Database Connectivity Check
**File:** Testing script
**Dependencies:** None
**Purpose:** Verify database queries work

**Queries to Test:**
- [ ] NAICS codes query (specialty-detection.service.ts)
- [ ] Industry profiles query (content-ideas-generator.service.ts)
- [ ] SocialPilot accounts query (socialpilot.service.ts)
- [ ] Content calendar items query (if applicable)

**Acceptance Criteria:**
- [ ] All queries return data
- [ ] NAICS codes (273) accessible
- [ ] Industry profiles (147) accessible
- [ ] Query times < 100ms
- [ ] No connection errors

---

#### Task 4.3: TypeScript Type Safety Verification
**File:** Run `npm run typecheck`
**Dependencies:** All Phase 1-3 tasks
**Purpose:** Ensure no TypeScript errors

**Acceptance Criteria:**
- [ ] `npm run typecheck` passes with 0 errors
- [ ] No `any` types in new code
- [ ] All interfaces properly typed
- [ ] No missing imports
- [ ] No unused variables

---

#### Task 4.4: Build Verification
**File:** Run `npm run build`
**Dependencies:** All Phase 1-3 tasks
**Purpose:** Ensure production build succeeds

**Acceptance Criteria:**
- [ ] `npm run build` succeeds
- [ ] No build errors
- [ ] No build warnings (critical)
- [ ] Bundle size acceptable
- [ ] All assets generated

---

#### Task 4.5: Final Gap Analysis
**File:** `INTEGRATION_GAP_ANALYSIS_FINAL.md`
**Dependencies:** All previous tasks
**Purpose:** Compare final state vs. plan

**Analysis Areas:**
- [ ] All planned hooks created
- [ ] All UI components wired
- [ ] All services integrated
- [ ] All endpoints verified
- [ ] All tests passed
- [ ] No orphaned services
- [ ] P0 features functional

**Deliverable:** Comprehensive report comparing before/after

---

#### Task 4.6: Documentation & Commit
**File:** `INTEGRATION_COMPLETE_OVERVIEW.md`
**Dependencies:** Task 4.5
**Purpose:** Document what was built and commit

**Documentation Sections:**
- Executive summary
- What was built
- How it works
- How to test
- Known issues (if any)
- Next steps

**Commit Tasks:**
- [ ] All code committed
- [ ] All documentation committed
- [ ] Meaningful commit messages
- [ ] Push to main branch
- [ ] Update PARALLEL_BUILD_SUMMARY.md

**Acceptance Criteria:**
- [ ] All changes committed
- [ ] Documentation complete
- [ ] Code pushed to GitHub
- [ ] Build status updated

---

## Progress Tracking

### Phase 1: Core Orchestration Hooks
- [ ] Task 1.1: useOnboarding Hook
- [ ] Task 1.2: useCalendarGeneration Hook
- [ ] Task 1.3: useSynapseCalendarBridge Hook
- [ ] Task 1.4: useIntelligenceDisplay Hook
- [ ] Task 1.5: useRedditOpportunities Hook (Optional)

### Phase 2: UI Wiring
- [ ] Task 2.1: Wire SynapsePage
- [ ] Task 2.2: Wire ContentCalendarHub
- [ ] Task 2.3: Wire IntelligencePanel
- [ ] Task 2.4: Wire IntelligenceDisplay
- [ ] Task 2.5: Create OnboardingContext (if needed)

### Phase 3: Data Flow & Testing
- [ ] Task 3.1: Test Onboarding Flow
- [ ] Task 3.2: Test Calendar Generation
- [ ] Task 3.3: Test Intelligence Display
- [ ] Task 3.4: Test Full User Journey
- [ ] Task 3.5: Performance Optimization

### Phase 4: Validation & Commit
- [ ] Task 4.1: API Endpoint Verification
- [ ] Task 4.2: Database Connectivity Check
- [ ] Task 4.3: TypeScript Type Safety
- [ ] Task 4.4: Build Verification
- [ ] Task 4.5: Final Gap Analysis
- [ ] Task 4.6: Documentation & Commit

---

## Critical Success Factors

1. **Each task is atomic** - Can be completed independently
2. **Each task has clear acceptance criteria** - Know when done
3. **Tasks are ordered by dependency** - Can't skip ahead
4. **Any Claude can pick up at any task** - Full context in each task description
5. **Progress tracked in real-time** - Update checklist as you go

---

## Handoff Protocol

If another Claude takes over:
1. Read this document fully
2. Check Progress Tracking section to see what's complete
3. Start with first incomplete task
4. Follow task requirements exactly
5. Update checklist when task complete
6. Commit progress regularly

---

## Quality Standards

All code must:
- Be TypeScript strict mode compliant
- Have JSDoc documentation
- Have proper error handling
- Have loading states for async operations
- Follow existing code patterns
- Be tested manually before marking complete

---

**Next Step:** Begin Task 1.1 (Create useOnboarding Hook)
