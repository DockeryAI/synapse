# Phase 2: Customer-First Title Generation - Atomic Tasks

**Goal**: Generate titles that make CUSTOMERS want to click, not business owners
**Duration**: 10 hours
**Dependencies**: Phase 1 (Framework Integration)

---

## Task 2.1: Create CustomerTitleGenerator Service (3 hours)

### 2.1.1: Create service file structure
- [ ] Create `/src/services/content/CustomerTitleGenerator.service.ts`
- [ ] Import FrameworkSelector
- [ ] Import ContentPsychologyEngine
- [ ] Define CustomerDesire interface
- [ ] Define TitleFormula interface

### 2.1.2: Implement customer desire identification
- [ ] Create `identifyCustomerDesire()` method
- [ ] Analyze data points for customer pain points
- [ ] Detect customer aspirations (what they want)
- [ ] Identify urgency triggers (FOMO, scarcity)
- [ ] Map business data to customer emotion
- [ ] Return CustomerDesire object

### 2.1.3: Implement problem-to-benefit translator
- [ ] Create `translateProblemToBenefit()` method
- [ ] Convert "long wait times" → "skip the line"
- [ ] Convert "price complaints" → "value you get"
- [ ] Convert "quality issues" → "why we're different"
- [ ] Industry-agnostic translation patterns
- [ ] Return customer-focused benefit

### 2.1.4: Implement urgency/scarcity integrator
- [ ] Create `addUrgencyTrigger()` method
- [ ] Detect time-sensitive data (weather, events)
- [ ] Apply scarcity psychology (limited availability)
- [ ] Add urgency without creating fake offers
- [ ] Return urgency-enhanced title

### 2.1.5: Implement title assembly
- [ ] Create `assembleTitleFormula()` method
- [ ] Combine [Customer Desire] + [Unique Solution] + [Benefit]
- [ ] Apply framework structure from Phase 1
- [ ] Ensure 60-80 character optimal length
- [ ] Return assembled title

### 2.1.6: Unit tests
- [ ] Test customer desire identification
- [ ] Test problem-to-benefit translation
- [ ] Test urgency integration
- [ ] Test title assembly with different formulas

---

## Task 2.2: Create Industry-Agnostic Title Formulas (2 hours)

### 2.2.1: Create title formula library
- [ ] Create `/src/services/content/TitleFormulaLibrary.ts`
- [ ] Define formula categories (problem-solution, benefit-driven, curiosity)
- [ ] Define formula templates with placeholders
- [ ] Map formulas to frameworks (AIDA, PAS, BAB)

### 2.2.2: Implement problem-solution formulas
- [ ] "How [Business] Fixed [Customer Problem]"
- [ ] "The [Number] Minute Solution to [Customer Pain]"
- [ ] "Why [Customer Struggle] Happens (And How to Fix It)"
- [ ] "Stop [Negative Experience], Start [Positive Outcome]"
- [ ] Add variations for different industries

### 2.2.3: Implement benefit-driven formulas
- [ ] "What [Number]% of [Customers] Don't Know About [Benefit]"
- [ ] "[Benefit] Without [Common Trade-off]"
- [ ] "The Secret to [Desired Outcome] at [Business]"
- [ ] "Why [Unique Feature] Makes All the Difference"
- [ ] Add variations for different industries

### 2.2.4: Implement curiosity formulas
- [ ] "The Truth About [Topic] (And Why It Matters)"
- [ ] "What Nobody Tells You About [Topic]"
- [ ] "Have You Noticed [Observation]? Here's Why"
- [ ] "[Number] Things You Didn't Know About [Topic]"
- [ ] Add variations for different industries

### 2.2.5: Implement platform-specific variations
- [ ] Social media (short, emoji-friendly)
- [ ] Email subject lines (benefit-first)
- [ ] Blog titles (SEO-friendly, longer)
- [ ] Ad copy (action-oriented)

### 2.2.6: Create formula selector
- [ ] Create `selectBestFormula()` method
- [ ] Match formula to data pattern
- [ ] Consider framework from Phase 1
- [ ] Consider platform requirements
- [ ] Return best formula with confidence

---

## Task 2.3: Update generateTitle() in breakthrough-generator (2 hours)

### 2.3.1: Remove keyword concatenation
- [ ] Identify all keyword concatenation logic
- [ ] Remove direct keyword joining
- [ ] Remove pattern like "keyword1 + keyword2 = result"
- [ ] Clean up legacy title generation code

### 2.3.2: Integrate CustomerTitleGenerator
- [ ] Import CustomerTitleGenerator
- [ ] Call identifyCustomerDesire() first
- [ ] Pass desire to title generation
- [ ] Apply framework structure from Phase 1
- [ ] Use formula library for templates

### 2.3.3: Implement title validation
- [ ] Check title length (60-80 chars optimal)
- [ ] Verify customer perspective (not business advice)
- [ ] Ensure actionability
- [ ] Check for keyword soup patterns
- [ ] Reject and regenerate if invalid

### 2.3.4: Add A/B title generation
- [ ] Generate 2-3 title variations
- [ ] Use different formulas from library
- [ ] Score each variation
- [ ] Return highest scoring title
- [ ] Log alternatives for analysis

### 2.3.5: Integration tests
- [ ] Test with problem-focused data
- [ ] Test with benefit-focused data
- [ ] Test with urgency data
- [ ] Verify no keyword concatenation
- [ ] Ensure customer perspective

---

## Task 2.4: Update generateClusterName() in cluster-intelligence (2 hours)

### 2.4.1: Implement customer perspective naming
- [ ] Remove business-focused patterns
- [ ] Add "Your [Stakeholder] Will [Outcome]" patterns
- [ ] Add "[Specific Benefit] That [Customers] Love" patterns
- [ ] Add "[Problem] Solved: [Specific Solution]" patterns
- [ ] Ensure names are specific, not generic

### 2.4.2: Implement specific outcome naming
- [ ] Remove vague names like "Product Quality Loved"
- [ ] Add specific metrics when available
- [ ] Add customer-visible outcomes
- [ ] Format: "[Specific Outcome]: [How/Why]"
- [ ] Example: "Skip the Line: Text Orders Ready in 5 Min"

### 2.4.3: Create cluster naming validator
- [ ] Create `validateClusterName()` method
- [ ] Reject generic patterns ("X Loved", "Y Best")
- [ ] Require specific customer benefit
- [ ] Require actionable insight
- [ ] Score name quality (0-10)

### 2.4.4: Implement cluster name scoring
- [ ] Customer relevance score (0-10)
- [ ] Specificity score (0-10)
- [ ] Actionability score (0-10)
- [ ] Threshold: minimum 7/10 each
- [ ] Regenerate if below threshold

### 2.4.5: Integration tests
- [ ] Test cluster naming with customer data
- [ ] Verify no generic patterns
- [ ] Ensure specific outcomes
- [ ] Test validator rejects bad names
- [ ] Test scoring accuracy

---

## Task 2.5: Create Title Quality Validator (0.5 hours)

### 2.5.1: Create validator service
- [ ] Create `/src/services/content/TitleQualityValidator.service.ts`
- [ ] Define validation rules
- [ ] Define rejection patterns
- [ ] Define quality scoring rubric

### 2.5.2: Implement keyword concatenation detector
- [ ] Check for pattern: "word1 + word2"
- [ ] Check for pattern: "word1: word2 = word3"
- [ ] Check for multiple keywords joined with "+"
- [ ] Return true if concatenation detected

### 2.5.3: Implement customer focus verifier
- [ ] Check for business advice language
- [ ] Check for operation-focused terms
- [ ] Check for customer benefit presence
- [ ] Check for customer action presence
- [ ] Return customer focus score (0-10)

### 2.5.4: Implement actionability checker
- [ ] Verify clear next step for customer
- [ ] Check for vague language ("improve", "enhance")
- [ ] Check for specific outcomes
- [ ] Return actionability score (0-10)

### 2.5.5: Create composite validator
- [ ] Create `validateTitle()` method
- [ ] Run all checks
- [ ] Return validation result object
- [ ] Include specific failure reasons
- [ ] Include improvement suggestions

---

## Task 2.6: Integration Testing (0.5 hours)

### 2.6.1: Test across 5 industries
- [ ] Restaurant/Food Service titles
- [ ] Healthcare/Dental titles
- [ ] Retail titles
- [ ] Professional Services titles
- [ ] Home Services titles
- [ ] Verify customer perspective maintained
- [ ] Verify no business advice

### 2.6.2: Validate customer perspective
- [ ] Review all generated titles
- [ ] Confirm customer is target audience
- [ ] Confirm customer action is clear
- [ ] Confirm customer benefit is visible
- [ ] No business owner language

### 2.6.3: Test title quality at scale
- [ ] Generate 50 titles across industries
- [ ] Run quality validator on all
- [ ] Calculate average score
- [ ] Target: > 8/10 average
- [ ] Identify and fix failure patterns

---

## Acceptance Criteria

- [ ] Zero keyword concatenation in titles
- [ ] 100% customer-focused titles (not business owner)
- [ ] Titles work across 5+ different industries
- [ ] Average quality score > 8/10
- [ ] Customer action clear in every title
- [ ] Customer benefit immediately visible
- [ ] No business advice in any title
- [ ] Title length optimized (60-80 chars)
- [ ] Framework structure applied to all titles
- [ ] A/B variations generated for each insight

---

## Files Created
- `/src/services/content/CustomerTitleGenerator.service.ts`
- `/src/services/content/TitleFormulaLibrary.ts`
- `/src/services/content/TitleQualityValidator.service.ts`
- `/src/__tests__/content-fix/customer-title-generation.test.ts`

## Files Modified
- `/src/services/v3-async/breakthrough-generator.service.ts`
- `/src/services/v3-intelligence/cluster-intelligence.service.ts`

## Dependencies
- Phase 1 complete (framework integration)
- ContentPsychologyEngine.ts (exists)
- FrameworkSelector from Phase 1
