# Phase 4: Enhanced Data Collection - Atomic Tasks

**Goal**: Get better insights from existing APIs (no new APIs)
**Duration**: 6 hours
**Dependencies**: None (parallel to other phases)

---

## Task 4.1: Create SmartQueryBuilder Service (2 hours)

### 4.1.1: Create service file structure
- [ ] Create `/src/services/content/SmartQueryBuilder.service.ts`
- [ ] Define QueryTemplate interface
- [ ] Define QueryCategory enum
- [ ] Define BuilderResult interface
- [ ] Import business profile types

### 4.1.2: Create industry-agnostic query templates
- [ ] Create template: "Why do people choose [industry] [location]"
- [ ] Create template: "[industry] [location] customer complaints"
- [ ] Create template: "What customers look for in [industry]"
- [ ] Create template: "[industry] vs [industry] comparison"
- [ ] Create template: "[industry] [location] reviews"
- [ ] Add 10+ more generic templates

### 4.1.3: Create customer perspective query builder
- [ ] Create `buildCustomerQuery()` method
- [ ] Focus on customer decision factors
- [ ] Focus on customer pain points
- [ ] Focus on customer comparison behavior
- [ ] Return customer-focused queries

### 4.1.4: Create competitor comparison query builder
- [ ] Create `buildCompetitorQuery()` method
- [ ] Query for "[business] vs competitors"
- [ ] Query for "[industry] alternatives"
- [ ] Query for "[business] reviews vs [competitor] reviews"
- [ ] Return competitor-focused queries

### 4.1.5: Create location-aware query builder
- [ ] Create `buildLocalQuery()` method
- [ ] Incorporate city/region into queries
- [ ] Query for local events affecting business
- [ ] Query for local news mentions
- [ ] Query for local customer sentiment
- [ ] Return location-enhanced queries

### 4.1.6: Create query optimizer
- [ ] Create `optimizeQuery()` method
- [ ] Remove redundant keywords
- [ ] Add relevant modifiers
- [ ] Ensure query specificity
- [ ] Return optimized query string

### 4.1.7: Unit tests
- [ ] Test query template rendering
- [ ] Test customer query builder
- [ ] Test competitor query builder
- [ ] Test location-aware queries
- [ ] Test query optimization

---

## Task 4.2: Enhance Serper Queries (1.5 hours)

### 4.2.1: Add site-specific Quora queries
- [ ] Create `queryQuora()` method
- [ ] Use "site:quora.com [industry] questions"
- [ ] Use "site:quora.com why [customer problem]"
- [ ] Use "site:quora.com [industry] recommendations"
- [ ] Parse Quora results for customer questions
- [ ] Return structured customer questions

### 4.2.2: Add site-specific Reddit queries
- [ ] Create `queryReddit()` method
- [ ] Use "site:reddit.com [industry] [location]"
- [ ] Use "site:reddit.com [business name] review"
- [ ] Use "site:reddit.com best [industry] [location]"
- [ ] Parse Reddit results for candid feedback
- [ ] Return structured reddit insights

### 4.2.3: Add competitor review queries
- [ ] Create `queryCompetitorReviews()` method
- [ ] Query "[competitor] reviews [location]"
- [ ] Query "[competitor] complaints"
- [ ] Query "[business] vs [competitor]"
- [ ] Parse for competitive insights
- [ ] Return competitor intel

### 4.2.4: Add local news/events queries
- [ ] Create `queryLocalNews()` method
- [ ] Query "[location] events [date range]"
- [ ] Query "[location] news [industry]"
- [ ] Query "[location] trends"
- [ ] Parse for local context
- [ ] Return local insights

### 4.2.5: Add decision factor queries
- [ ] Create `queryDecisionFactors()` method
- [ ] Query "why do people choose [industry]"
- [ ] Query "what makes a good [industry]"
- [ ] Query "how to pick [industry]"
- [ ] Parse for customer priorities
- [ ] Return decision factors

### 4.2.6: Update serper-api.ts integration
- [ ] Import SmartQueryBuilder
- [ ] Replace hardcoded queries with builder
- [ ] Add new query methods
- [ ] Maintain existing functionality
- [ ] Add rate limit handling

---

## Task 4.3: Enhance Perplexity Prompts (1.5 hours)

### 4.3.1: Create customer decision prompts
- [ ] Prompt: "What factors do customers consider when choosing [industry]?"
- [ ] Prompt: "What are the top 5 things customers care about in [industry]?"
- [ ] Prompt: "How do customers compare different [industry] options?"
- [ ] Structure response for parsing
- [ ] Extract decision factors

### 4.3.2: Create trend prompts
- [ ] Prompt: "What trends are affecting [industry] customers in [year]?"
- [ ] Prompt: "How are customer expectations changing in [industry]?"
- [ ] Prompt: "What are customers looking for in [industry] now?"
- [ ] Focus on customer perspective
- [ ] Extract actionable trends

### 4.3.3: Create complaint analysis prompts
- [ ] Prompt: "What are common customer complaints in [industry]?"
- [ ] Prompt: "What frustrates customers about [industry]?"
- [ ] Prompt: "What do customers wish [industry] would improve?"
- [ ] Extract pain points
- [ ] Return structured complaints

### 4.3.4: Create comparison behavior prompts
- [ ] Prompt: "How do customers compare [business] vs competitors?"
- [ ] Prompt: "What makes customers switch from [competitor] to [business]?"
- [ ] Prompt: "What differentiates [business] from alternatives?"
- [ ] Extract competitive intel
- [ ] Return comparison insights

### 4.3.5: Create industry-specific prompt generator
- [ ] Create `generatePerplexityPrompt()` method
- [ ] Accept business profile + query type
- [ ] Generate contextual prompt
- [ ] Ensure industry-agnostic approach
- [ ] Return optimized prompt

### 4.3.6: Update Perplexity integration
- [ ] Modify perplexity API calls
- [ ] Use new prompt generator
- [ ] Add customer perspective prompts
- [ ] Maintain response parsing
- [ ] Add error handling

---

## Task 4.4: Create QueryOrchestrator Service (0.5 hours)

### 4.4.1: Create service file structure
- [ ] Create `/src/services/content/QueryOrchestrator.service.ts`
- [ ] Import SmartQueryBuilder
- [ ] Import API services (Serper, Perplexity)
- [ ] Define OrchestrationPlan interface
- [ ] Define AggregatedResults interface

### 4.4.2: Implement parallel query execution
- [ ] Create `executeQueriesParallel()` method
- [ ] Accept array of queries
- [ ] Execute all queries concurrently
- [ ] Use Promise.all for parallelization
- [ ] Handle individual query failures
- [ ] Return all results

### 4.4.3: Implement result aggregation
- [ ] Create `aggregateResults()` method
- [ ] Combine results from multiple sources
- [ ] Merge duplicate insights
- [ ] Weight by source credibility
- [ ] Return unified result set

### 4.4.4: Implement deduplication
- [ ] Create `deduplicateResults()` method
- [ ] Detect duplicate content
- [ ] Detect similar insights (>80% similarity)
- [ ] Keep highest quality version
- [ ] Remove exact duplicates
- [ ] Return deduplicated results

### 4.4.5: Unit tests
- [ ] Test parallel execution
- [ ] Test aggregation logic
- [ ] Test deduplication
- [ ] Test failure handling
- [ ] Test performance

---

## Task 4.5: Update orchestration.service.ts (0.5 hours)

### 4.5.1: Import new services
- [ ] Import SmartQueryBuilder
- [ ] Import QueryOrchestrator
- [ ] Initialize in constructor

### 4.5.2: Replace hardcoded queries
- [ ] Find all hardcoded query strings
- [ ] Replace with SmartQueryBuilder calls
- [ ] Use appropriate query types
- [ ] Maintain existing flow

### 4.5.3: Add new query types
- [ ] Add Quora queries to flow
- [ ] Add Reddit queries to flow
- [ ] Add competitor queries to flow
- [ ] Add decision factor queries to flow
- [ ] Integrate with existing sources

### 4.5.4: Implement parallel orchestration
- [ ] Use QueryOrchestrator for parallel execution
- [ ] Execute independent queries concurrently
- [ ] Aggregate results before processing
- [ ] Maintain overall performance

### 4.5.5: Add quality checks
- [ ] Verify query results are non-empty
- [ ] Check for API errors
- [ ] Fallback to alternative queries if needed
- [ ] Log query success rates

---

## Task 4.6: Testing (0.5 hours)

### 4.6.1: Validate query quality
- [ ] Test queries across 5 industries
- [ ] Verify queries are specific
- [ ] Check for customer perspective
- [ ] Ensure no hardcoded assumptions
- [ ] Validate query optimization

### 4.6.2: Check API rate limits
- [ ] Test with high query volume
- [ ] Verify rate limit handling
- [ ] Test retry logic
- [ ] Ensure no API blocks
- [ ] Monitor API costs

### 4.6.3: Measure insight improvement
- [ ] Compare data richness before/after
- [ ] Count unique insights per query
- [ ] Measure customer perspective frequency
- [ ] Calculate improvement percentage
- [ ] Target: 50%+ more customer insights

### 4.6.4: Performance testing
- [ ] Measure query execution time
- [ ] Test parallel vs sequential
- [ ] Verify no performance regression
- [ ] Target: < 3 seconds total query time
- [ ] Optimize if needed

---

## Acceptance Criteria

- [ ] SmartQueryBuilder generates industry-agnostic queries
- [ ] Quora queries returning customer questions
- [ ] Reddit queries returning candid feedback
- [ ] Competitor queries returning competitive intel
- [ ] Decision factor queries returning customer priorities
- [ ] Perplexity prompts focused on customer perspective
- [ ] QueryOrchestrator executes queries in parallel
- [ ] Deduplication removes duplicates
- [ ] No performance regression (< 3s total)
- [ ] API rate limits respected
- [ ] 50%+ increase in customer insights
- [ ] Works across 5+ industries

---

## Files Created
- `/src/services/content/SmartQueryBuilder.service.ts`
- `/src/services/content/QueryOrchestrator.service.ts`
- `/src/__tests__/content-fix/enhanced-data-collection.test.ts`

## Files Modified
- `/src/services/intelligence/orchestration.service.ts`
- `/src/services/intelligence/serper-api.ts`
- Perplexity API integration (if separate file)

## Dependencies
- None (can run parallel to other phases)
- Existing API services (Serper, Perplexity)

## API Considerations
- Respect Serper rate limits
- Respect Perplexity rate limits
- Monitor API costs
- Implement caching where appropriate
