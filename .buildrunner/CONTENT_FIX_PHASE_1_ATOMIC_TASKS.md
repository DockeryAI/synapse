# Phase 1: Framework Integration Core - Atomic Tasks

**Goal**: Connect ContentFrameworkLibrary to generation pipeline
**Duration**: 8 hours
**Dependencies**: None

---

## Task 1.1: Create FrameworkSelector Service (2 hours)

### 1.1.1: Create service file structure
- [ ] Create `/src/services/content/FrameworkSelector.service.ts`
- [ ] Import ContentFrameworkLibrary types
- [ ] Import DataPoint and Connection types
- [ ] Define FrameworkScore interface
- [ ] Define FrameworkSelectionResult interface

### 1.1.2: Implement data pattern analyzer
- [ ] Create `analyzeDataPattern()` method
- [ ] Detect problem-focused patterns (complaints, pain points)
- [ ] Detect desire-focused patterns (wants, aspirations)
- [ ] Detect comparison patterns (before/after scenarios)
- [ ] Detect urgency patterns (time-sensitive, trending)
- [ ] Return pattern classification object

### 1.1.3: Implement framework scorer
- [ ] Create `scoreFrameworkCompatibility()` method
- [ ] Score AIDA compatibility (attention-grabbing data)
- [ ] Score PAS compatibility (problem-agitate-solve)
- [ ] Score BAB compatibility (before-after-bridge)
- [ ] Score Hook-Story-Offer compatibility
- [ ] Weight scores by data strength
- [ ] Return sorted framework scores

### 1.1.4: Implement framework selector
- [ ] Create `selectBestFramework()` method
- [ ] Accept data points and insight type as input
- [ ] Call analyzeDataPattern()
- [ ] Call scoreFrameworkCompatibility()
- [ ] Return top framework with confidence score
- [ ] Include fallback logic for low confidence

### 1.1.5: Add selection explainer
- [ ] Create `explainSelection()` method
- [ ] Generate human-readable explanation
- [ ] Reference specific data points that influenced choice
- [ ] Return explanation object with framework + reasoning

### 1.1.6: Unit tests
- [ ] Test pattern analyzer with problem-focused data
- [ ] Test pattern analyzer with desire-focused data
- [ ] Test framework scorer accuracy
- [ ] Test fallback logic
- [ ] Test explanation generation

---

## Task 1.2: Create FrameworkRouter Service (2 hours)

### 1.2.1: Create service file structure
- [ ] Create `/src/services/content/FrameworkRouter.service.ts`
- [ ] Import FrameworkSelector
- [ ] Import ContentFrameworkLibrary
- [ ] Import generation types
- [ ] Define RoutedGeneration interface

### 1.2.2: Implement title routing
- [ ] Create `routeTitleGeneration()` method
- [ ] Accept data points and selected framework
- [ ] Map to ContentFrameworkLibrary.generateTitle()
- [ ] Pass framework structure as template
- [ ] Return framework-structured title

### 1.2.3: Implement cluster naming routing
- [ ] Create `routeClusterNaming()` method
- [ ] Accept cluster data and selected framework
- [ ] Apply framework structure to cluster name
- [ ] Ensure customer-focused perspective
- [ ] Return framework-structured cluster name

### 1.2.4: Implement synapse routing
- [ ] Create `routeSynapseGeneration()` method
- [ ] Accept connection and selected framework
- [ ] Route title through framework
- [ ] Route hook through framework
- [ ] Route description through framework
- [ ] Route CTA through framework
- [ ] Return complete structured synapse

### 1.2.5: Add framework metadata tracking
- [ ] Create `attachMetadata()` method
- [ ] Track which framework was used
- [ ] Track framework selection confidence
- [ ] Track framework application success
- [ ] Return metadata object

### 1.2.6: Unit tests
- [ ] Test title routing with AIDA
- [ ] Test title routing with PAS
- [ ] Test cluster routing with BAB
- [ ] Test synapse routing end-to-end
- [ ] Test metadata tracking

---

## Task 1.3: Modify breakthrough-generator.service.ts (2 hours)

### 1.3.1: Import new services
- [ ] Import FrameworkSelector at top of file
- [ ] Import FrameworkRouter at top of file
- [ ] Initialize services in constructor
- [ ] Add framework metadata to GeneratedSynapse interface

### 1.3.2: Update generateSynapse() method
- [ ] Call FrameworkSelector.selectBestFramework() before generation
- [ ] Pass selected framework to title generation
- [ ] Pass selected framework to hook generation
- [ ] Pass selected framework to description generation
- [ ] Store framework metadata in result

### 1.3.3: Update generateTitle() to use framework
- [ ] Accept framework parameter
- [ ] Call FrameworkRouter.routeTitleGeneration()
- [ ] Remove direct keyword concatenation logic
- [ ] Ensure framework structure is followed
- [ ] Maintain customer focus

### 1.3.4: Update generateHook() to use framework
- [ ] Accept framework parameter
- [ ] Call FrameworkRouter.routeSynapseGeneration() for hook
- [ ] Apply framework structure
- [ ] Ensure emotional connection
- [ ] Keep customer perspective

### 1.3.5: Update generateDescription() to use framework
- [ ] Accept framework parameter
- [ ] Route through framework structure
- [ ] Explain business opportunity within framework
- [ ] Maintain marketing focus

### 1.3.6: Update generateCTA() to use framework
- [ ] Accept framework parameter
- [ ] Apply framework structure to CTA
- [ ] Ensure specific, actionable CTA
- [ ] No invented offers

### 1.3.7: Integration tests
- [ ] Test full synapse generation with framework
- [ ] Verify framework metadata is attached
- [ ] Ensure backward compatibility
- [ ] Test with multiple framework types

---

## Task 1.4: Modify cluster-intelligence.service.ts (1.5 hours)

### 1.4.1: Import new services
- [ ] Import FrameworkSelector at top of file
- [ ] Import FrameworkRouter at top of file
- [ ] Initialize services in appropriate methods

### 1.4.2: Update generateClusterName() method
- [ ] Call FrameworkSelector before naming
- [ ] Pass cluster data to framework selector
- [ ] Route naming through FrameworkRouter
- [ ] Apply framework structure to cluster name
- [ ] Maintain customer perspective

### 1.4.3: Update enrichWithAI() method
- [ ] Pass selected framework to AI prompt
- [ ] Include framework structure in system message
- [ ] Request framework-aligned insights
- [ ] Validate AI output follows framework

### 1.4.4: Add framework tracking to clusters
- [ ] Add framework metadata to cluster object
- [ ] Track framework selection reasoning
- [ ] Store framework application success

### 1.4.5: Integration tests
- [ ] Test cluster naming with frameworks
- [ ] Test AI enrichment with framework context
- [ ] Verify framework metadata storage
- [ ] Ensure customer-focused output

---

## Task 1.5: Test Framework Routing (0.5 hours)

### 1.5.1: Create integration test file
- [ ] Create `/src/__tests__/content-fix/framework-routing.test.ts`
- [ ] Import all modified services
- [ ] Setup test data fixtures

### 1.5.2: Test end-to-end routing
- [ ] Test synapse generation routes through framework
- [ ] Test cluster naming routes through framework
- [ ] Test AI picks route through framework
- [ ] Verify framework metadata in all outputs

### 1.5.3: Validate framework selection
- [ ] Test framework selector with problem data
- [ ] Test framework selector with desire data
- [ ] Test framework selector with urgency data
- [ ] Verify correct framework is chosen

### 1.5.4: Test backward compatibility
- [ ] Verify existing generation still works
- [ ] Test fallback behavior
- [ ] Ensure no breaking changes
- [ ] Performance regression check

---

## Acceptance Criteria

- [ ] All generation routes through ContentFrameworkLibrary
- [ ] Framework selection is traceable and logged
- [ ] Framework metadata attached to all outputs
- [ ] Tests pass for framework routing
- [ ] No keyword concatenation without framework
- [ ] Customer perspective maintained
- [ ] Performance < 200ms overhead per generation
- [ ] Backward compatibility maintained

---

## Files Created
- `/src/services/content/FrameworkSelector.service.ts`
- `/src/services/content/FrameworkRouter.service.ts`
- `/src/__tests__/content-fix/framework-routing.test.ts`

## Files Modified
- `/src/services/v3-async/breakthrough-generator.service.ts`
- `/src/services/v3-intelligence/cluster-intelligence.service.ts`

## Dependencies Required
- ContentFrameworkLibrary.ts (exists)
- DataPoint types (exists)
- Connection types (exists)
