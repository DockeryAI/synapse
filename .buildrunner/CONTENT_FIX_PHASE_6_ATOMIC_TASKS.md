# Phase 6: Connection Engine Enhancement - Atomic Tasks

**Goal**: Deeper, more meaningful connections between data points
**Duration**: 6 hours
**Dependencies**: Phase 4 (Enhanced Data Collection)

---

## Task 6.1: Create ConnectionPathTracer Service (2 hours)

### 6.1.1: Create service file structure
- [ ] Create `/src/services/content/ConnectionPathTracer.service.ts`
- [ ] Define ConnectionPath interface
- [ ] Define ConnectionHop interface
- [ ] Define PathMetadata interface
- [ ] Import existing Connection types

### 6.1.2: Implement multi-hop connection tracking
- [ ] Create `traceConnectionPath()` method
- [ ] Accept starting data point
- [ ] Find direct connections (A→B)
- [ ] Find second-degree connections (A→B→C)
- [ ] Find third-degree connections (A→B→C→D)
- [ ] Return full connection path
- [ ] Include hop metadata

### 6.1.3: Implement causation chain tracking
- [ ] Create `buildCausationChain()` method
- [ ] Identify cause → effect relationships
- [ ] Link multiple cause-effect pairs
- [ ] Build full causal chain
- [ ] Weight by causation strength
- [ ] Return structured chain

### 6.1.4: Implement path visualization data
- [ ] Create `generatePathVisualization()` method
- [ ] Create graph structure (nodes + edges)
- [ ] Include connection weights
- [ ] Include hop distances
- [ ] Format for D3.js or similar
- [ ] Return visualization-ready data

### 6.1.5: Implement path scoring
- [ ] Create `scoreConnectionPath()` method
- [ ] Score by path length (shorter = clearer)
- [ ] Score by connection strength (stronger = better)
- [ ] Score by unexpectedness (non-obvious = valuable)
- [ ] Weight composite score
- [ ] Return path quality score

### 6.1.6: Implement path pruning
- [ ] Create `pruneWeakConnections()` method
- [ ] Remove low-strength connections
- [ ] Remove circular paths
- [ ] Remove redundant paths
- [ ] Keep only strongest paths
- [ ] Return pruned path set

### 6.1.7: Unit tests
- [ ] Test single-hop tracking
- [ ] Test multi-hop tracking
- [ ] Test causation chain building
- [ ] Test path scoring
- [ ] Test path pruning

---

## Task 6.2: Create CustomerEmotionMapper Service (1.5 hours)

### 6.2.1: Create service file structure
- [ ] Create `/src/services/content/CustomerEmotionMapper.service.ts`
- [ ] Define EmotionMapping interface
- [ ] Define EmotionTrigger interface
- [ ] Define EmotionChain interface
- [ ] Import IndustryPatternLibrary

### 6.2.2: Implement data to emotion mapper
- [ ] Create `mapDataToEmotion()` method
- [ ] Map weather data → customer mood
- [ ] Map event data → customer excitement/anticipation
- [ ] Map trend data → customer FOMO
- [ ] Map complaint data → customer frustration
- [ ] Return emotion mapping

### 6.2.3: Implement weather-mood mapping
- [ ] Create `weatherToMood()` method
- [ ] Sunny → energetic, optimistic
- [ ] Rainy → cozy, comfort-seeking
- [ ] Cold → warm, indulgent
- [ ] Hot → refreshing, cooling
- [ ] Return mood profile

### 6.2.4: Implement event-behavior mapping
- [ ] Create `eventToBehavior()` method
- [ ] Holiday → celebration, gift-giving
- [ ] Weekend → relaxation, leisure
- [ ] Sports event → gathering, social
- [ ] Season change → renewal, change
- [ ] Return behavior profile

### 6.2.5: Implement emotion-need mapping
- [ ] Create `emotionToNeed()` method
- [ ] Frustration → solution, relief
- [ ] Excitement → participation, experience
- [ ] Anxiety → reassurance, trust
- [ ] FOMO → inclusion, access
- [ ] Return customer need

### 6.2.6: Implement need-opportunity mapping
- [ ] Create `needToOpportunity()` method
- [ ] Customer need → content angle
- [ ] Customer need → product positioning
- [ ] Customer need → messaging tone
- [ ] Return content opportunity

### 6.2.7: Create emotion chain
- [ ] Create `buildEmotionChain()` method
- [ ] Chain: Data → Emotion → Need → Opportunity
- [ ] Example: Rain → Cozy → Comfort food → "Warm soup on rainy days"
- [ ] Include full reasoning
- [ ] Return emotion chain

### 6.2.8: Unit tests
- [ ] Test weather-mood mapping
- [ ] Test event-behavior mapping
- [ ] Test emotion-need mapping
- [ ] Test need-opportunity mapping
- [ ] Test full emotion chain

---

## Task 6.3: Update connection-discovery.service.ts (1 hour)

### 6.3.1: Import new services
- [ ] Import ConnectionPathTracer at top
- [ ] Import CustomerEmotionMapper at top
- [ ] Initialize services in constructor
- [ ] Add types for enhanced connections

### 6.3.2: Implement multi-hop connection discovery
- [ ] Modify `findConnections()` method
- [ ] Call ConnectionPathTracer for each connection
- [ ] Track full path, not just A→B
- [ ] Store path metadata
- [ ] Return enhanced connections

### 6.3.3: Add emotion mapping to connections
- [ ] In `findConnections()`, call CustomerEmotionMapper
- [ ] Map data to emotions
- [ ] Build emotion chains
- [ ] Attach emotion metadata to connections
- [ ] Include in connection output

### 6.3.4: Implement connection depth tracking
- [ ] Track connection hop count
- [ ] Store full path in connection object
- [ ] Add depth metadata
- [ ] Use depth for prioritization

### 6.3.5: Update connection scoring
- [ ] Factor in path depth (deeper = more insightful)
- [ ] Factor in unexpectedness
- [ ] Factor in emotion strength
- [ ] Weight composite connection score
- [ ] Sort connections by new score

### 6.3.6: Integration tests
- [ ] Test multi-hop connection discovery
- [ ] Test emotion mapping integration
- [ ] Test path tracking
- [ ] Test connection scoring
- [ ] Verify performance

---

## Task 6.4: Create ConnectionExplainer Service (1 hour)

### 6.4.1: Create service file structure
- [ ] Create `/src/services/content/ConnectionExplainer.service.ts`
- [ ] Define Explanation interface
- [ ] Define ExplanationStyle enum
- [ ] Import connection types

### 6.4.2: Implement human-readable explainer
- [ ] Create `explainConnection()` method
- [ ] Accept connection path
- [ ] Generate natural language explanation
- [ ] Format: "Because X happened, customers feel Y, creating opportunity for Z"
- [ ] Include specific data references
- [ ] Return explanation string

### 6.4.3: Implement causation explainer
- [ ] Create `explainCausation()` method
- [ ] Describe cause-effect relationships
- [ ] Use transition words (therefore, consequently)
- [ ] Make reasoning explicit
- [ ] Include confidence level
- [ ] Return causation explanation

### 6.4.4: Implement emotion explainer
- [ ] Create `explainEmotionChain()` method
- [ ] Describe emotion mapping
- [ ] Explain why emotion leads to need
- [ ] Explain why need creates opportunity
- [ ] Use customer-focused language
- [ ] Return emotion explanation

### 6.4.5: Implement provenance displayer
- [ ] Create `generateProvenanceDisplay()` method
- [ ] List all data sources in path
- [ ] Show connection hops
- [ ] Display confidence scores
- [ ] Format for UI display
- [ ] Return provenance object

### 6.4.6: Create explanation formatter
- [ ] Create `formatForDisplay()` method
- [ ] Format for tooltip
- [ ] Format for expanded view
- [ ] Format for detail panel
- [ ] Support markdown formatting
- [ ] Return formatted explanation

### 6.4.7: Unit tests
- [ ] Test connection explanation
- [ ] Test causation explanation
- [ ] Test emotion explanation
- [ ] Test provenance display
- [ ] Test formatting

---

## Task 6.5: Add Connection Depth Scoring (0.5 hours)

### 6.5.1: Implement depth scorer
- [ ] Create `scoreConnectionDepth()` method
- [ ] 1-hop = baseline score
- [ ] 2-hop = 1.5x multiplier
- [ ] 3-hop = 2x multiplier
- [ ] 4+ hop = 2.5x multiplier
- [ ] Return depth score

### 6.5.2: Implement unexpectedness scorer
- [ ] Create `scoreUnexpectedness()` method
- [ ] Obvious connections = low score
- [ ] Non-obvious connections = high score
- [ ] Use pattern recognition to detect obvious
- [ ] Weight by industry expectations
- [ ] Return unexpectedness score

### 6.5.3: Prioritize non-obvious patterns
- [ ] Create `prioritizeConnections()` method
- [ ] Sort by composite score
- [ ] Weight: depth + unexpectedness + strength
- [ ] Boost non-obvious patterns
- [ ] De-boost obvious insights
- [ ] Return prioritized connections

### 6.5.4: Integration with breakthrough generator
- [ ] Update synapse generation to use depth scores
- [ ] Prioritize deeper connections
- [ ] Include depth in metadata
- [ ] Display depth indicator in UI

---

## Task 6.6: Testing (1 hour)

### 6.6.1: Validate connection quality
- [ ] Generate 50 connections with new system
- [ ] Compare to old system
- [ ] Measure depth increase
- [ ] Measure insight quality increase
- [ ] Target: 50%+ improvement

### 6.6.2: Ensure traceability
- [ ] Verify all connections have full path
- [ ] Check provenance is complete
- [ ] Validate explanations are clear
- [ ] Test UI display of paths
- [ ] Ensure no broken chains

### 6.6.3: Performance optimization
- [ ] Measure path tracing time
- [ ] Measure emotion mapping time
- [ ] Measure explanation generation time
- [ ] Total overhead target: < 300ms
- [ ] Optimize if needed

### 6.6.4: Cross-industry validation
- [ ] Test connection discovery across 5 industries
- [ ] Verify emotion mapping works universally
- [ ] Check explanation quality consistency
- [ ] Ensure no industry bias

### 6.6.5: Integration testing
- [ ] Test full pipeline end-to-end
- [ ] Verify all phases work together
- [ ] Check data flows correctly
- [ ] Validate final output quality

---

## Acceptance Criteria

- [ ] Connection paths are traceable (A→B→C→D)
- [ ] Full causation chains documented
- [ ] Emotion mapping works for weather/events/trends
- [ ] Emotion chains build correctly (Data→Emotion→Need→Opportunity)
- [ ] Explanations are human-readable
- [ ] Provenance display shows all sources
- [ ] Depth scoring prioritizes deeper insights
- [ ] Unexpectedness scoring works
- [ ] Non-obvious patterns prioritized
- [ ] Performance overhead < 300ms
- [ ] Works across all industries
- [ ] Integration with existing connection discovery complete
- [ ] UI can display connection paths
- [ ] Quality improvement >50% vs old system

---

## Files Created
- `/src/services/content/ConnectionPathTracer.service.ts`
- `/src/services/content/CustomerEmotionMapper.service.ts`
- `/src/services/content/ConnectionExplainer.service.ts`
- `/src/__tests__/content-fix/connection-enhancement.test.ts`

## Files Modified
- `/src/services/intelligence/connection-discovery.service.ts`
- `/src/services/v3-async/breakthrough-generator.service.ts` (to use depth scores)

## Dependencies
- Phase 4 complete (enhanced data collection provides richer data)
- IndustryPatternLibrary (from Phase 5)
- Existing connection-discovery.service.ts

## Visualization Support
- Generate D3.js-compatible graph data
- Support connection path display in UI
- Provide data for provenance tooltips
- Enable interactive path exploration

## Metrics to Track
- Average connection depth (target: >2 hops)
- Unexpectedness score distribution
- Explanation clarity (qualitative review)
- Performance overhead
- Quality improvement vs baseline
