# Phase 3: Quality Scoring & Filtering - Atomic Tasks

**Goal**: Prevent garbage content from reaching users
**Duration**: 4 hours
**Dependencies**: Phase 2 (Customer-First Titles)

---

## Task 3.1: Create ContentQualityScorer Service (2 hours)

### 3.1.1: Create service file structure
- [ ] Create `/src/services/content/ContentQualityScorer.service.ts`
- [ ] Define QualityScore interface (5 dimensions)
- [ ] Define ScoringResult interface
- [ ] Import necessary types

### 3.1.2: Implement Customer Relevance scorer (0-10)
- [ ] Create `scoreCustomerRelevance()` method
- [ ] Check if content addresses customer need
- [ ] Verify customer is target (not business owner)
- [ ] Check for customer action clarity
- [ ] Check for customer benefit visibility
- [ ] Weight: 10 points max
- [ ] Return score with reasoning

### 3.1.3: Implement Actionability scorer (0-10)
- [ ] Create `scoreActionability()` method
- [ ] Verify clear next step exists
- [ ] Check for specific vs vague language
- [ ] Verify actionability within customer control
- [ ] Check for concrete outcomes
- [ ] Weight: 10 points max
- [ ] Return score with reasoning

### 3.1.4: Implement Uniqueness scorer (0-10)
- [ ] Create `scoreUniqueness()` method
- [ ] Detect generic patterns ("Product Quality Loved")
- [ ] Check for obvious insights ("customers like good service")
- [ ] Verify insight is non-obvious
- [ ] Check for competitive differentiation
- [ ] Weight: 10 points max
- [ ] Return score with reasoning

### 3.1.5: Implement Framework Alignment scorer (0-10)
- [ ] Create `scoreFrameworkAlignment()` method
- [ ] Verify framework structure is followed
- [ ] Check framework application correctness
- [ ] Validate psychology principles applied
- [ ] Verify framework metadata exists
- [ ] Weight: 10 points max
- [ ] Return score with reasoning

### 3.1.6: Implement Emotional Pull scorer (0-10)
- [ ] Create `scoreEmotionalPull()` method
- [ ] Detect emotional language presence
- [ ] Check for customer pain/desire connection
- [ ] Verify urgency/scarcity when appropriate
- [ ] Check for story elements
- [ ] Weight: 10 points max
- [ ] Return score with reasoning

### 3.1.7: Create composite scorer
- [ ] Create `scoreContent()` method
- [ ] Run all 5 dimension scorers
- [ ] Calculate total score (0-50)
- [ ] Include dimension breakdown
- [ ] Include specific feedback for low scores
- [ ] Return comprehensive ScoringResult

### 3.1.8: Unit tests
- [ ] Test each dimension scorer independently
- [ ] Test composite scorer
- [ ] Test with known good content (should score >40)
- [ ] Test with known bad content (should score <30)
- [ ] Validate scoring consistency

---

## Task 3.2: Create ContentQualityFilter Service (1 hour)

### 3.2.1: Create service file structure
- [ ] Create `/src/services/content/ContentQualityFilter.service.ts`
- [ ] Import ContentQualityScorer
- [ ] Define FilterResult interface
- [ ] Define RejectionReason interface

### 3.2.2: Implement quality threshold filter
- [ ] Create `filterByQuality()` method
- [ ] Set threshold: 35/50 minimum
- [ ] Call ContentQualityScorer
- [ ] Accept if score >= 35
- [ ] Reject if score < 35
- [ ] Return FilterResult with pass/fail

### 3.2.3: Implement rejection logger
- [ ] Create `logRejection()` method
- [ ] Log rejected content
- [ ] Log rejection reason (dimension scores)
- [ ] Log timestamp and context
- [ ] Store for analysis
- [ ] Return logged rejection ID

### 3.2.4: Implement batch filtering
- [ ] Create `filterBatch()` method
- [ ] Accept array of content
- [ ] Score all items
- [ ] Filter by threshold
- [ ] Return passed items + rejection log
- [ ] Optimize for performance

### 3.2.5: Create rejection statistics
- [ ] Create `getRejectionStats()` method
- [ ] Calculate rejection rate
- [ ] Break down by rejection reason
- [ ] Identify common failure patterns
- [ ] Return stats object

### 3.2.6: Unit tests
- [ ] Test single item filtering
- [ ] Test batch filtering
- [ ] Test rejection logging
- [ ] Test statistics generation
- [ ] Test threshold boundary cases

---

## Task 3.3: Add Quality Gates to Generation Pipeline (0.5 hours)

### 3.3.1: Add to synapse generation
- [ ] Import ContentQualityFilter in breakthrough-generator.service.ts
- [ ] Filter synapses before display
- [ ] Reject synapses scoring < 35/50
- [ ] Log rejected synapses
- [ ] Regenerate if rejected (up to 3 attempts)

### 3.3.2: Add to cluster generation
- [ ] Import ContentQualityFilter in cluster-intelligence.service.ts
- [ ] Filter clusters before display
- [ ] Reject clusters scoring < 35/50
- [ ] Log rejected clusters
- [ ] Regenerate if rejected (up to 3 attempts)

### 3.3.3: Add to AI picks
- [ ] Import ContentQualityFilter in relevant AI picks service
- [ ] Filter AI picks before display
- [ ] Reject picks scoring < 35/50
- [ ] Log rejected picks
- [ ] Sort remaining picks by score

### 3.3.4: Add to all generation paths
- [ ] Identify all content generation endpoints
- [ ] Add quality filter to each
- [ ] Ensure consistent threshold (35/50)
- [ ] Log all rejections centrally

---

## Task 3.4: Create Rejection Patterns Library (0.5 hours)

### 3.4.1: Create library file
- [ ] Create `/src/services/content/RejectionPatternsLibrary.ts`
- [ ] Define RejectionPattern interface
- [ ] Define pattern matching rules
- [ ] Define auto-reject patterns

### 3.4.2: Define generic insight patterns
- [ ] "Product Quality Loved" → Auto reject
- [ ] "[X] Best" → Auto reject
- [ ] "Customers Like [Generic Thing]" → Auto reject
- [ ] "Improve Quality" → Auto reject
- [ ] Add more generic patterns

### 3.4.3: Define keyword soup patterns
- [ ] Detect "word1 + word2 = word3" → Auto reject
- [ ] Detect multiple keywords with "+" → Auto reject
- [ ] Detect concatenation without meaning → Auto reject
- [ ] Detect random word combinations → Auto reject

### 3.4.4: Define business advice patterns
- [ ] Detect "increase revenue" language → Auto reject
- [ ] Detect "improve operations" language → Auto reject
- [ ] Detect "hire more staff" language → Auto reject
- [ ] Detect strategy advice → Auto reject

### 3.4.5: Define invented offer patterns
- [ ] Detect "2-for-1" → Auto reject
- [ ] Detect "special price" → Auto reject
- [ ] Detect "new deal" → Auto reject
- [ ] Detect "discount" → Auto reject

### 3.4.6: Create pattern matcher
- [ ] Create `matchRejectionPattern()` method
- [ ] Check content against all patterns
- [ ] Return matched pattern if found
- [ ] Return null if no match
- [ ] Include pattern confidence score

---

## Task 3.5: Testing & Calibration (0.5 hours)

### 3.5.1: Validate scoring accuracy
- [ ] Create test set of 50 pieces (25 good, 25 bad)
- [ ] Run through quality scorer
- [ ] Calculate accuracy rate
- [ ] Target: >90% accuracy
- [ ] Adjust scoring weights if needed

### 3.5.2: Tune threshold
- [ ] Test with threshold = 30
- [ ] Test with threshold = 35
- [ ] Test with threshold = 40
- [ ] Calculate precision/recall for each
- [ ] Confirm 35/50 is optimal

### 3.5.3: Ensure good content passes
- [ ] Generate 20 high-quality pieces
- [ ] Run through filter
- [ ] Verify all pass (score >= 35)
- [ ] If any fail, adjust scoring
- [ ] Document any false negatives

### 3.5.4: Ensure bad content fails
- [ ] Collect 20 garbage pieces from current system
- [ ] Run through filter
- [ ] Verify all fail (score < 35)
- [ ] If any pass, tighten scoring
- [ ] Document any false positives

### 3.5.5: Cross-industry validation
- [ ] Test scoring across 5 industries
- [ ] Verify consistency
- [ ] Ensure no industry bias
- [ ] Adjust if needed

---

## Acceptance Criteria

- [ ] Quality gates prevent content scoring < 35/50
- [ ] All 5 dimensions scoring correctly
- [ ] "Product Quality Loved" type insights auto-rejected
- [ ] Keyword concatenation auto-rejected
- [ ] Business advice auto-rejected
- [ ] Invented offers auto-rejected
- [ ] Good content passes consistently (>95%)
- [ ] Bad content fails consistently (>95%)
- [ ] Rejection logging works
- [ ] Statistics tracking works
- [ ] Performance overhead < 50ms per piece
- [ ] Works across all industries

---

## Files Created
- `/src/services/content/ContentQualityScorer.service.ts`
- `/src/services/content/ContentQualityFilter.service.ts`
- `/src/services/content/RejectionPatternsLibrary.ts`
- `/src/__tests__/content-fix/quality-scoring.test.ts`

## Files Modified
- `/src/services/v3-async/breakthrough-generator.service.ts`
- `/src/services/v3-intelligence/cluster-intelligence.service.ts`
- Any AI picks generation services

## Dependencies
- Phase 1 complete (framework integration)
- Phase 2 complete (customer-first titles)

## Metrics to Track
- Average quality score (target: >40/50)
- Rejection rate (target: <20%)
- Rejection reason breakdown
- False positive rate (target: <5%)
- False negative rate (target: <5%)
