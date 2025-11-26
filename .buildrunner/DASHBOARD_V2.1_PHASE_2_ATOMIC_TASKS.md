# Dashboard V2.1 - Phase 2 Atomic Tasks
**Intelligence Enhancement - Quality Pipeline Integration**

**Duration:** Day 2 (Morning + Afternoon)
**Goal:** Wire content quality services into intelligence generation pipeline

---

## MORNING: Quality Pipeline Integration

### Task 1: Wire FrameworkSelector into Clustering Service
**File:** `src/services/intelligence/clustering.service.ts`

**Requirements:**
- Import FrameworkSelector service
- Call selectFramework() for each cluster after theme generation
- Store framework selection in cluster.frameworkUsed
- Pass cluster context (theme, dataPoints, sources) to framework selector
- Handle framework selection errors gracefully
- Log framework selections for debugging

**Dependencies:** None

---

### Task 2: Integrate CustomerTitleGenerator into Content Synthesis
**File:** `src/services/intelligence/content-synthesis.service.ts`

**Requirements:**
- Import CustomerTitleGenerator
- Replace generic title generation with customer-focused titles
- Pass business context (industry, audience, goals) to generator
- Apply to all synthesized content titles
- Maintain fallback to original title if generation fails
- Log title transformations

**Dependencies:** None

---

### Task 3: Add TitleQualityValidator to Content Pipeline
**File:** `src/services/intelligence/content-synthesis.service.ts`

**Requirements:**
- Import TitleQualityValidator
- Validate all generated titles before final output
- Store validation results in content metadata
- Retry title generation if validation fails (max 2 attempts)
- Track validation pass/fail rates
- Add quality score to title metadata

**Dependencies:** Task 2 complete

---

### Task 4: Integrate ContentQualityScorer into Synapse Generation
**File:** `src/services/synapse/SynapseGenerator.ts`

**Requirements:**
- Import ContentQualityScorer
- Score all generated insights before return
- Store quality scores in insight.qualityScore field
- Include full breakdown (relevance, actionability, uniqueness, emotional pull)
- Filter out insights with scores < 40 (optional flag)
- Log score distribution statistics

**Dependencies:** None

---

## AFTERNOON: Data Enhancement

### Task 5: Connect SmartQueryBuilder to DeepContext Builder
**File:** `src/services/intelligence/deepContextBuilder.ts` (or orchestration.service.ts)

**Requirements:**
- Import SmartQueryBuilder
- Generate enhanced search queries for each data source
- Use industry + location + goals to build smarter queries
- Apply query enhancement before API calls
- Log query transformations
- Track query improvement metrics

**Dependencies:** None

---

### Task 6: Enhance Cluster Generation with Quality Data
**File:** `src/services/intelligence/clustering.service.ts`

**Requirements:**
- Add quality metadata to each cluster
- Calculate average quality score across cluster dataPoints
- Track framework alignment percentage
- Store enhancement metadata in cluster
- Update cluster ranking to factor quality scores
- Log cluster quality distribution

**Dependencies:** Tasks 1, 4 complete

---

### Task 7: Add Quality Scoring to DeepContext Synthesis
**File:** `src/services/intelligence/orchestration.service.ts`

**Requirements:**
- Score all synthesis outputs (keyInsights, recommendedAngles)
- Add quality metadata to DeepContext.synthesis
- Calculate overall synthesis quality score
- Track quality improvements over baseline
- Store quality metrics in DeepContext.metadata
- Log quality score summary

**Dependencies:** Task 4 complete

---

### Task 8: Update PowerMode to Display Enhanced Quality Data
**File:** `src/components/dashboard/intelligence-v2/PowerMode.tsx`

**Requirements:**
- Display framework badges on ALL insights (not just clusters)
- Show quality breakdown tooltips on hover
- Add quality trend indicators (improving/stable/declining)
- Display synthesis quality score in header
- Add "Framework Distribution" chart
- Show quality improvement metrics vs baseline

**Dependencies:** Tasks 6, 7 complete

---

## Success Criteria
- [ ] All clusters have framework assignments
- [ ] All titles pass quality validation (or have validation scores)
- [ ] All insights have quality scores with breakdowns
- [ ] PowerMode displays enhanced quality data
- [ ] Smart queries improve data retrieval quality
- [ ] Quality metrics tracked and logged
- [ ] No performance degradation (< 10% slower)
- [ ] All TypeScript errors resolved
- [ ] HMR updates working correctly

---

## Performance Targets
- Framework selection: < 500ms per cluster
- Title generation: < 1s per title
- Quality scoring: < 300ms per insight
- Total overhead: < 3s for full pipeline

---

## Testing Checklist
- [ ] Generate content with quality pipeline active
- [ ] Verify framework assignments are appropriate
- [ ] Check quality scores are realistic (20-95 range)
- [ ] Ensure validation catches poor titles
- [ ] Confirm smart queries improve results
- [ ] Test error handling for all services
- [ ] Verify fallbacks work when services fail
