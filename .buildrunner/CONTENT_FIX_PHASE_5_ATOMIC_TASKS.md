# Phase 5: Industry Pattern Library - Atomic Tasks

**Goal**: Reusable patterns for ANY industry
**Duration**: 4 hours
**Dependencies**: Phase 1 (Framework Integration)

---

## Task 5.1: Create IndustryPatternLibrary Service (1.5 hours)

### 5.1.1: Create service file structure
- [ ] Create `/src/services/content/IndustryPatternLibrary.service.ts`
- [ ] Define IndustryCategory enum
- [ ] Define IndustryPattern interface
- [ ] Define PatternMetadata interface
- [ ] Define CustomerPsychology interface

### 5.1.2: Define service industry patterns
- [ ] Pattern: Time/convenience driven
- [ ] Pattern: Trust/relationship driven
- [ ] Pattern: Expertise/specialization driven
- [ ] Pattern: Availability/accessibility driven
- [ ] Examples: restaurants, salons, healthcare, consulting
- [ ] Return ServiceIndustryPattern object

### 5.1.3: Define product industry patterns
- [ ] Pattern: Quality/value driven
- [ ] Pattern: Selection/variety driven
- [ ] Pattern: Price/comparison driven
- [ ] Pattern: Brand/status driven
- [ ] Examples: retail, ecommerce, manufacturing
- [ ] Return ProductIndustryPattern object

### 5.1.4: Define digital industry patterns
- [ ] Pattern: Ease/speed driven
- [ ] Pattern: Features/capabilities driven
- [ ] Pattern: Integration/compatibility driven
- [ ] Pattern: Support/reliability driven
- [ ] Examples: SaaS, apps, platforms
- [ ] Return DigitalIndustryPattern object

### 5.1.5: Define local industry patterns
- [ ] Pattern: Trust/community driven
- [ ] Pattern: Proximity/convenience driven
- [ ] Pattern: Reputation/word-of-mouth driven
- [ ] Pattern: Local knowledge driven
- [ ] Examples: contractors, local services, local retail
- [ ] Return LocalIndustryPattern object

### 5.1.6: Create pattern registry
- [ ] Create `getPatternForCategory()` method
- [ ] Map industry to category
- [ ] Return appropriate pattern
- [ ] Include fallback logic
- [ ] Cache pattern lookups

### 5.1.7: Unit tests
- [ ] Test service pattern retrieval
- [ ] Test product pattern retrieval
- [ ] Test digital pattern retrieval
- [ ] Test local pattern retrieval
- [ ] Test pattern mapping accuracy

---

## Task 5.2: Define Customer Psychology Patterns (1 hour)

### 5.2.1: Define time/convenience psychology
- [ ] Create `timeConveniencePsychology()` method
- [ ] Key trigger: "I don't have time for this"
- [ ] Solution angle: Speed, efficiency, convenience
- [ ] Content hook: "Save [X] minutes/hours"
- [ ] CTA focus: Fast action, immediate benefit
- [ ] Return psychology profile

### 5.2.2: Define quality/value psychology
- [ ] Create `qualityValuePsychology()` method
- [ ] Key trigger: "Is this worth the price?"
- [ ] Solution angle: Quality justification, value proof
- [ ] Content hook: "Why [feature] makes all the difference"
- [ ] CTA focus: Experience quality, see value
- [ ] Return psychology profile

### 5.2.3: Define ease/speed psychology
- [ ] Create `easeSpeedPsychology()` method
- [ ] Key trigger: "Is this hard to use?"
- [ ] Solution angle: Simplicity, no learning curve
- [ ] Content hook: "Start in [X] minutes"
- [ ] CTA focus: Try it now, easy first step
- [ ] Return psychology profile

### 5.2.4: Define trust/community psychology
- [ ] Create `trustCommunityPsychology()` method
- [ ] Key trigger: "Can I trust them?"
- [ ] Solution angle: Social proof, local reputation
- [ ] Content hook: "[X]% of neighbors choose us"
- [ ] CTA focus: Join community, see testimonials
- [ ] Return psychology profile

### 5.2.5: Create psychology selector
- [ ] Create `selectPsychology()` method
- [ ] Accept industry pattern
- [ ] Return appropriate psychology
- [ ] Include confidence score
- [ ] Support multiple psychology blend

### 5.2.6: Map psychology to triggers
- [ ] Create trigger detection logic
- [ ] Map customer pain to psychology
- [ ] Map customer desire to psychology
- [ ] Map data points to psychology
- [ ] Return matched psychology

---

## Task 5.3: Create PatternMatcher Service (0.5 hours)

### 5.3.1: Create service file structure
- [ ] Create `/src/services/content/PatternMatcher.service.ts`
- [ ] Import IndustryPatternLibrary
- [ ] Define MatchResult interface
- [ ] Define MatchConfidence interface

### 5.3.2: Implement business to pattern matcher
- [ ] Create `matchBusinessToPattern()` method
- [ ] Accept business profile
- [ ] Analyze industry keywords
- [ ] Analyze business model
- [ ] Analyze customer base
- [ ] Return matched pattern with confidence

### 5.3.3: Implement pattern applicator
- [ ] Create `applyPattern()` method
- [ ] Accept matched pattern + data
- [ ] Apply pattern psychology
- [ ] Apply pattern content structure
- [ ] Apply pattern CTA style
- [ ] Return pattern-enhanced content

### 5.3.4: Create multi-pattern support
- [ ] Support businesses with multiple patterns
- [ ] Example: Restaurant (service + local)
- [ ] Example: SaaS (digital + product)
- [ ] Blend patterns appropriately
- [ ] Return blended pattern profile

### 5.3.5: Unit tests
- [ ] Test pattern matching accuracy
- [ ] Test pattern application
- [ ] Test multi-pattern support
- [ ] Test confidence scoring

---

## Task 5.4: Integration with Frameworks (0.5 hours)

### 5.4.1: Connect patterns to FrameworkSelector
- [ ] Import PatternMatcher in FrameworkSelector
- [ ] Call pattern matcher before framework selection
- [ ] Use pattern psychology to inform framework choice
- [ ] Weight framework scores by pattern compatibility
- [ ] Return pattern-optimized framework

### 5.4.2: Map patterns to frameworks
- [ ] Time/convenience → AIDA (urgent action)
- [ ] Quality/value → PAS (problem agitation)
- [ ] Ease/speed → BAB (before/after contrast)
- [ ] Trust/community → Story frameworks
- [ ] Create pattern-framework mapping table

### 5.4.3: Auto-select best framework
- [ ] Create `autoSelectFramework()` method
- [ ] Use pattern + data to select framework
- [ ] Calculate pattern-framework fit score
- [ ] Return best framework with reasoning
- [ ] Include alternatives

### 5.4.4: Optimize for industry
- [ ] Create `optimizeForIndustry()` method
- [ ] Accept industry category
- [ ] Apply industry-specific optimizations
- [ ] Adjust language/tone
- [ ] Adjust urgency levels
- [ ] Return industry-optimized content

### 5.4.5: Integration tests
- [ ] Test pattern → framework selection
- [ ] Test across multiple industries
- [ ] Verify optimization works
- [ ] Ensure consistency

---

## Task 5.5: Testing Across Industries (0.5 hours)

### 5.5.1: Validate patterns work generically
- [ ] Test pattern library with no hardcoded assumptions
- [ ] Verify patterns apply to any business in category
- [ ] Check for industry-specific leakage
- [ ] Ensure truly industry-agnostic
- [ ] Fix any hardcoded elements

### 5.5.2: Test 10+ industry types
- [ ] Restaurant/Food Service
- [ ] Healthcare/Dental
- [ ] Professional Services (law, accounting)
- [ ] Retail (clothing, electronics)
- [ ] SaaS/Digital products
- [ ] Home Services (plumbing, HVAC)
- [ ] Fitness/Wellness
- [ ] Education/Training
- [ ] Real Estate
- [ ] Automotive
- [ ] Manufacturing
- [ ] Hospitality

### 5.5.3: Verify pattern matching accuracy
- [ ] Test pattern matcher with each industry
- [ ] Verify correct category assigned
- [ ] Check confidence scores are reasonable
- [ ] Validate psychology mapping
- [ ] Target: >90% accuracy

### 5.5.4: Ensure quality maintained
- [ ] Generate content for each industry
- [ ] Run through quality scorer
- [ ] Verify average score >40/50
- [ ] Check customer perspective maintained
- [ ] Validate frameworks applied correctly

### 5.5.5: Cross-industry comparison
- [ ] Compare content quality across industries
- [ ] Ensure no industry bias
- [ ] Verify consistent pattern application
- [ ] Check for edge cases
- [ ] Document findings

---

## Acceptance Criteria

- [ ] Pattern library covers 10+ different industries
- [ ] No hardcoded industry assumptions
- [ ] Patterns are truly reusable
- [ ] Psychology mapping works for all categories
- [ ] Pattern matcher accuracy >90%
- [ ] Quality maintained across all industries (>40/50)
- [ ] Customer perspective consistent
- [ ] Framework selection optimized by pattern
- [ ] Multi-pattern support works
- [ ] Integration with Phase 1 frameworks complete

---

## Files Created
- `/src/services/content/IndustryPatternLibrary.service.ts`
- `/src/services/content/PatternMatcher.service.ts`
- `/src/__tests__/content-fix/industry-patterns.test.ts`

## Files Modified
- `/src/services/content/FrameworkSelector.service.ts` (from Phase 1)

## Dependencies
- Phase 1 complete (framework integration)
- ContentPsychologyEngine.ts (exists)

## Industry Coverage
Must support:
- Service industries (restaurants, salons, healthcare, etc.)
- Product industries (retail, ecommerce, manufacturing, etc.)
- Digital industries (SaaS, apps, platforms, etc.)
- Local industries (contractors, local services, etc.)
- Hybrid industries (combinations of above)

## Pattern Validation
Each pattern must:
- Have clear customer psychology profile
- Map to appropriate frameworks
- Work without industry-specific assumptions
- Maintain quality across use cases
- Support blending with other patterns
