# Content Fix Execution Instructions

**CRITICAL: Read this before every phase execution. If conversation compacts, follow these instructions exactly.**

---

## Execution Process (DO NOT DEVIATE)

### For Each Phase:

1. **Optimize Task List**
   - Review atomic task list for current phase
   - Ensure nothing is missing
   - Optimize for highest quality code output
   - Ensure tasks are perfectly sized for Claude

2. **Execute Phase**
   - Complete ALL tasks in the atomic list
   - Follow dashboard loading rules (async, suspense, error boundaries)
   - Maintain existing architecture patterns
   - Test as you build

3. **Gap Analysis (MANDATORY)**
   - Do comprehensive gap analysis after phase completion
   - Compare what was built vs what was planned
   - Identify ALL gaps, no matter how small
   - Document gaps clearly

4. **Address Gaps Iteratively**
   - Fix each gap found
   - Do another gap analysis
   - Repeat until ZERO gaps remain
   - Do not move to next phase with gaps

5. **Test Phase**
   - Run unit tests for all new services
   - Run integration tests
   - Verify no regressions
   - Test across multiple industries

6. **Update Build Plan**
   - Mark phase as COMPLETE in build plan
   - Document what was built
   - Note any deviations from plan
   - Track progress for recovery

7. **Build Next Phase Task List**
   - Create optimized atomic task list for next phase
   - Review and optimize before executing
   - Repeat entire process

---

## Critical Requirements

### Dashboard Loading Rules (MUST FOLLOW)
- **Async components**: Use React.lazy() + Suspense
- **Error boundaries**: Wrap all async components
- **Loading states**: Show loading UI during data fetch
- **Performance**: Lazy load heavy components
- **Code splitting**: Split by route and feature
- **React Query**: Use for all data fetching
- **Optimistic updates**: Where appropriate
- **Stale-while-revalidate**: For better UX

### Code Quality Standards
- **TypeScript**: Strict types, no `any`
- **Error handling**: Comprehensive try-catch
- **Logging**: Log important operations
- **Testing**: Unit + integration tests
- **Documentation**: JSDoc for all public methods
- **Performance**: Monitor and optimize
- **Security**: No hardcoded secrets, input validation

### Testing Requirements
- **Unit tests**: Every new service
- **Integration tests**: Cross-service interactions
- **Industry tests**: 5+ industries per phase
- **Regression tests**: Existing features still work
- **Performance tests**: No significant degradation
- **Final validation**: CI pipeline + Playwright

---

## Phase Tracking

### Phase 1: Framework Integration Core
- **Status**: 95% COMPLETE (TypeScript test fixes remaining)
- **Files Created**:
  - `/src/services/content/FrameworkSelector.service.ts`
  - `/src/services/content/FrameworkRouter.service.ts`
  - `/src/__tests__/content-fix/framework-selector.test.ts`
  - `/src/__tests__/content-fix/framework-router.test.ts`
  - `/src/__tests__/content-fix/phase1-integration.test.ts`
- **Files Modified**:
  - `/src/services/synapse/SynapseGenerator.ts`
  - `/src/services/intelligence/clustering.service.ts`
  - `/src/types/synapse/synapse.types.ts`
- **Tests Added**: 3 test files with comprehensive coverage
- **Gaps Found**: TypeScript enum errors in tests (see PHASE_1_GAP_ANALYSIS.md)
- **Completion Date**: 2025-11-24

### Phase 2: Customer-First Title Generation
- **Status**: NOT STARTED
- **Files Created**:
- **Files Modified**:
- **Tests Added**:
- **Gaps Found**:
- **Completion Date**:

### Phase 3: Quality Scoring & Filtering
- **Status**: NOT STARTED
- **Files Created**:
- **Files Modified**:
- **Tests Added**:
- **Gaps Found**:
- **Completion Date**:

### Phase 4: Enhanced Data Collection
- **Status**: NOT STARTED
- **Files Created**:
- **Files Modified**:
- **Tests Added**:
- **Gaps Found**:
- **Completion Date**:

### Phase 5: Industry Pattern Library
- **Status**: NOT STARTED
- **Files Created**:
- **Files Modified**:
- **Tests Added**:
- **Gaps Found**:
- **Completion Date**:

### Phase 6: Connection Engine Enhancement
- **Status**: NOT STARTED
- **Files Created**:
- **Files Modified**:
- **Tests Added**:
- **Gaps Found**:
- **Completion Date**:

---

## Recovery Instructions (If Context Lost)

1. Read this file first
2. Check phase tracking above
3. Read THE_CONTENT_PROBLEM_FIX.md
4. Read last completed phase atomic task list
5. Check execution instructions for current phase
6. Continue from last incomplete phase

---

## Final Validation (After All Phases)

1. **Run Full Test Suite**
   - All unit tests pass
   - All integration tests pass
   - All industry tests pass
   - No regressions

2. **CI Pipeline**
   - Build succeeds
   - Type checking passes
   - Linting passes
   - Tests pass

3. **Playwright Tests**
   - All E2E tests pass
   - No UI regressions
   - Performance acceptable

4. **Manual Validation**
   - Test 5+ industries manually
   - Verify quality scores >40/50
   - Confirm customer perspective
   - Check framework application

5. **Report**
   - Concise summary of all changes
   - Files created/modified
   - Test results
   - Quality improvements
   - Known issues (if any)

---

## DO NOT FORGET

- ✅ One phase at a time
- ✅ Gap analysis after every phase
- ✅ Update this file after every phase
- ✅ Follow dashboard loading rules
- ✅ No pausing until 100% complete
- ✅ Test everything at the end
- ✅ Concise summary when done
