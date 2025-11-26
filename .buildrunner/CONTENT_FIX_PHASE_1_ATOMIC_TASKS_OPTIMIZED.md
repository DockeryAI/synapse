# Phase 1: Framework Integration Core - OPTIMIZED

**Goal**: Connect ContentFrameworkLibrary to generation pipeline
**Duration**: 8 hours
**Dependencies**: None

**ACTUAL FILES TO MODIFY**:
- `/src/services/synapse/SynapseGenerator.ts` (exists - generates synapses via Claude Opus)
- `/src/services/intelligence/clustering.service.ts` (exists - generates cluster themes)

**ACTUAL FILES TO CREATE**:
- `/src/services/content/FrameworkSelector.service.ts`
- `/src/services/content/FrameworkRouter.service.ts`

---

## Task 1.1: Create FrameworkSelector Service (2 hours)

### Context
The ContentFrameworkLibrary exists with AIDA, PAS, BAB, Hook-Story-Offer frameworks but is NOT connected to generation.
We need a service that analyzes data and selects the best framework.

### 1.1.1: Create service file with types
- [ ] Create `/src/services/content/FrameworkSelector.service.ts`
- [ ] Import from `@/services/synapse/generation/ContentFrameworkLibrary`
- [ ] Import types: `FrameworkType`, `ContentFramework`, `ContentChannel`, `ContentGoal`
- [ ] Import `DataPoint` from `@/types/connections.types`
- [ ] Define `DataPattern` type: `{type: 'problem' | 'desire' | 'comparison' | 'urgency' | 'transformation', confidence: number, keywords: string[]}`
- [ ] Define `FrameworkScore` interface: `{framework: ContentFramework, score: number, reasoning: string}`
- [ ] Define `FrameworkSelectionResult` interface: `{selected: ContentFramework, alternatives: ContentFramework[], confidence: number, reasoning: string, dataPattern: DataPattern}`

### 1.1.2: Implement data pattern analyzer
- [ ] Create `analyzeDataPattern(dataPoints: DataPoint[]): DataPattern` method
- [ ] Detect problem-focused: complaints, negative sentiment, pain point keywords
- [ ] Detect desire-focused: positive aspirations, "want", "wish", opportunity keywords
- [ ] Detect comparison: "vs", "better than", before/after language
- [ ] Detect urgency: time-sensitive words, seasonal, event-driven, trending
- [ ] Detect transformation: change language, results, outcomes
- [ ] Calculate confidence based on keyword density and sentiment
- [ ] Return pattern object with type, confidence, and extracted keywords

### 1.1.3: Implement framework compatibility scorer
- [ ] Create `scoreFrameworkCompatibility(pattern: DataPattern, framework: ContentFramework): number` method
- [ ] Problem pattern → high scores for PAS (Problem-Agitate-Solution)
- [ ] Desire pattern → high scores for AIDA (Attention-Interest-Desire-Action)
- [ ] Comparison pattern → high scores for BAB (Before-After-Bridge)
- [ ] Urgency pattern → high scores for Hook-Story-Offer
- [ ] Transformation pattern → high scores for BAB
- [ ] Weight by framework's conversionFocus and engagementFocus
- [ ] Return score 0-100

### 1.1.4: Implement framework selector
- [ ] Create `selectBestFramework(dataPoints: DataPoint[], channel: ContentChannel = 'social', goal: ContentGoal = 'engagement'): FrameworkSelectionResult` method
- [ ] Call `analyzeDataPattern(dataPoints)` to get pattern
- [ ] Get frameworks for channel from ContentFrameworkLibrary
- [ ] Score each framework using `scoreFrameworkCompatibility()`
- [ ] Sort by score descending
- [ ] Select top framework
- [ ] Get top 2 alternatives
- [ ] Generate reasoning string explaining selection
- [ ] Return FrameworkSelectionResult with all metadata

### 1.1.5: Add explainer method
- [ ] Create `explainSelection(result: FrameworkSelectionResult): string` method
- [ ] Format: "Selected [Framework] because [data shows X pattern], which aligns with [framework strength]. Data keywords: [keywords]"
- [ ] Include confidence level
- [ ] Reference specific data points
- [ ] Return formatted explanation string

### 1.1.6: Export singleton
- [ ] Create singleton instance: `export const frameworkSelector = new FrameworkSelector()`
- [ ] Add JSDoc comments to all public methods
- [ ] Add console.log for debugging framework selection

### 1.1.7: Unit tests
- [ ] Create `/src/__tests__/content-fix/framework-selector.test.ts`
- [ ] Test `analyzeDataPattern()` with problem-focused data (complaints)
- [ ] Test `analyzeDataPattern()` with desire-focused data (wants, aspirations)
- [ ] Test `analyzeDataPattern()` with urgency data (time-sensitive, trending)
- [ ] Test `scoreFrameworkCompatibility()` matches correctly
- [ ] Test `selectBestFramework()` returns PAS for problems
- [ ] Test `selectBestFramework()` returns AIDA for opportunities
- [ ] Test `selectBestFramework()` returns BAB for transformations
- [ ] Test confidence scoring is reasonable (0.5-1.0 range)
- [ ] Test fallback when no clear pattern

---

## Task 1.2: Create FrameworkRouter Service (2 hours)

### Context
Once we know which framework to use, we need to route generation through that framework's structure.
This service translates framework structure into generation guidelines.

### 1.2.1: Create service file with types
- [ ] Create `/src/services/content/FrameworkRouter.service.ts`
- [ ] Import `ContentFramework`, `FrameworkStage` from ContentFrameworkLibrary
- [ ] Import `DataPoint` from `@/types/connections.types`
- [ ] Define `GenerationGuidelines` interface: `{framework: ContentFramework, stageGuidelines: Map<string, string[]>, toneAdjustments: string[], ctaStyle: string}`
- [ ] Define `TitleGenerationContext` interface: `{dataPoints: DataPoint[], framework: ContentFramework, customerFocus: boolean}`

### 1.2.2: Implement framework-to-guidelines mapper
- [ ] Create `buildGenerationGuidelines(framework: ContentFramework): GenerationGuidelines` method
- [ ] Extract guidelines from each framework stage
- [ ] Map AIDA stages → [Attention, Interest, Desire, Action] guidelines
- [ ] Map PAS stages → [Problem, Agitate, Solution] guidelines
- [ ] Map BAB stages → [Before, After, Bridge] guidelines
- [ ] Map Hook-Story-Offer → [Hook, Story, Offer] guidelines
- [ ] Include psychology principles from each stage
- [ ] Return structured guidelines object

### 1.2.3: Implement title routing with customer focus
- [ ] Create `routeTitleGeneration(context: TitleGenerationContext): string` method
- [ ] Use framework's example formulas from first stage
- [ ] For AIDA: use attention-grabbing formulas
- [ ] For PAS: use problem identification formulas
- [ ] For BAB: use transformation formulas
- [ ] For Hook-Story-Offer: use hook formulas
- [ ] **CRITICAL**: Ensure customer perspective (not business owner)
- [ ] Example transformations:
  - Business: "How to improve your bakery operations"
  - Customer: "Why your weekend croissants taste better here"
- [ ] Return customer-focused title guidance

### 1.2.4: Implement synapse generation routing
- [ ] Create `routeSynapseGeneration(dataPoints: DataPoint[], framework: ContentFramework): {titleGuidance: string, hookGuidance: string, bodyGuidance: string, ctaGuidance: string}` method
- [ ] Extract relevant stage guidelines from framework
- [ ] Title: use first stage formulas
- [ ] Hook: use opening stage principles + psychology
- [ ] Body: use middle stages (Interest/Agitate/After)
- [ ] CTA: use final stage (Action/Solution/Offer)
- [ ] Format as guidance strings for prompt injection
- [ ] Return structured guidance object

### 1.2.5: Implement cluster naming routing
- [ ] Create `routeClusterNaming(dataPoints: DataPoint[], framework: ContentFramework): string` method
- [ ] Apply framework structure to cluster name
- [ ] Problem pattern → "[Specific Customer Pain]: [How It Manifests]"
- [ ] Desire pattern → "[Customer Want] + [What Makes It Possible]"
- [ ] Transform pattern → "[Before State] → [After State]"
- [ ] Ensure specific, not generic
- [ ] Return cluster naming guidance

### 1.2.6: Add framework metadata tracking
- [ ] Create `attachMetadata(framework: ContentFramework, confidence: number): object` method
- [ ] Track framework ID and name
- [ ] Track selection confidence
- [ ] Track timestamp of routing
- [ ] Return metadata object for attaching to generated content

### 1.2.7: Export singleton and tests
- [ ] Export singleton: `export const frameworkRouter = new FrameworkRouter()`
- [ ] Create `/src/__tests__/content-fix/framework-router.test.ts`
- [ ] Test `buildGenerationGuidelines()` extracts all stages
- [ ] Test `routeTitleGeneration()` with AIDA
- [ ] Test `routeTitleGeneration()` with PAS
- [ ] Test `routeSynapseGeneration()` returns all sections
- [ ] Test customer focus is maintained
- [ ] Test metadata attachment

---

## Task 1.3: Integrate with SynapseGenerator.ts (2 hours)

### Context
SynapseGenerator currently builds a large prompt and calls Claude Opus.
We need to inject framework selection and routing BEFORE generation.

### 1.3.1: Import new services
- [ ] Add imports at top of `/src/services/synapse/SynapseGenerator.ts`:
  ```typescript
  import { frameworkSelector } from '@/services/content/FrameworkSelector.service';
  import { frameworkRouter } from '@/services/content/FrameworkRouter.service';
  import type { FrameworkSelectionResult } from '@/services/content/FrameworkSelector.service';
  ```

### 1.3.2: Create data point extraction helper
- [ ] Create `extractDataPointsFromIntelligence(intelligence: any): DataPoint[]` function
- [ ] Extract from `intelligence.realTimeCultural.trending.topics`
- [ ] Extract from `intelligence.competitiveIntel.opportunities`
- [ ] Extract from `intelligence.customerPsychology.behavioral`
- [ ] Extract from `intelligence.customerPsychology.unarticulated`
- [ ] Format as DataPoint array with source, content, metadata
- [ ] Return DataPoint[]

### 1.3.3: Add framework selection before prompt building
- [ ] In `generateSynapses()` function, after Step 2 (connection hints)
- [ ] Add new Step 2.5: Framework Selection
- [ ] Call `extractDataPointsFromIntelligence(input.intelligence)`
- [ ] Call `frameworkSelector.selectBestFramework(dataPoints, 'social', 'engagement')`
- [ ] Store result in `selectedFramework: FrameworkSelectionResult`
- [ ] Log framework selection: `console.log('[Synapse] Selected framework:', selectedFramework.selected.name, 'confidence:', selectedFramework.confidence)`

### 1.3.4: Inject framework into prompt
- [ ] In `buildSynapsePrompt()` function
- [ ] Add new parameter: `selectedFramework: FrameworkSelectionResult`
- [ ] Add new section to prompt BEFORE "YOUR TASK":
  ```
  ### CONTENT FRAMEWORK TO USE: [Framework Name]

  **Framework Structure:**
  [Stages and guidelines from framework]

  **Why this framework:** [Reasoning from selection]

  **Apply this framework structure to ALL generated content.**
  ```
- [ ] Get framework stages from `selectedFramework.selected.stages`
- [ ] Format stages as guidelines
- [ ] Inject customer perspective reminders

### 1.3.5: Add framework metadata to synapses
- [ ] In `parseClaudeResponse()` function
- [ ] Add framework metadata to each synapse:
  ```typescript
  frameworkUsed: {
    id: selectedFramework.selected.id,
    name: selectedFramework.selected.name,
    confidence: selectedFramework.confidence,
    reasoning: selectedFramework.reasoning
  }
  ```
- [ ] This enables tracking which framework was applied

### 1.3.6: Update SynapseInsight type
- [ ] Add to `/src/types/synapse/synapse.types.ts` (or wherever SynapseInsight is defined):
  ```typescript
  frameworkUsed?: {
    id: string;
    name: string;
    confidence: number;
    reasoning: string;
  }
  ```

### 1.3.7: Integration tests
- [ ] Test `generateSynapses()` with problem-focused intelligence
- [ ] Verify PAS framework is selected
- [ ] Verify framework appears in prompt
- [ ] Verify synapse has framework metadata
- [ ] Test with opportunity-focused intelligence
- [ ] Verify AIDA framework is selected
- [ ] Test framework selection doesn't break existing generation

---

## Task 1.4: Integrate with clustering.service.ts (1.5 hours)

### Context
clustering.service.ts generates cluster themes in `generateTheme()` method.
Need to apply framework structure to theme generation.

### 1.4.1: Read current generateTheme implementation
- [ ] Locate `generateTheme()` method in `/src/services/intelligence/clustering.service.ts`
- [ ] Understand current logic (likely concatenates keywords or uses simple naming)
- [ ] Identify where customer perspective is missing

### 1.4.2: Import framework services
- [ ] Add imports:
  ```typescript
  import { frameworkSelector } from '@/services/content/FrameworkSelector.service';
  import { frameworkRouter } from '@/services/content/FrameworkRouter.service';
  ```

### 1.4.3: Update generateTheme() with framework routing
- [ ] Modify `generateTheme(clusterPoints: DataPoint[]): string` method
- [ ] Call `frameworkSelector.selectBestFramework(clusterPoints, 'social', 'engagement')`
- [ ] Call `frameworkRouter.routeClusterNaming(clusterPoints, framework)`
- [ ] Use routing guidance to format theme name
- [ ] Ensure customer-focused perspective:
  - Bad: "Product Quality Loved"
  - Good: "Customers Choose Us For Freshness"
- [ ] Ensure specific, not generic:
  - Bad: "Bakery Best Pattern"
  - Good: "Weekend Wait Times Peak At 30 Minutes"
- [ ] Return framework-routed theme name

### 1.4.4: Add framework metadata to clusters
- [ ] Update `InsightCluster` interface to include:
  ```typescript
  frameworkUsed?: {
    id: string;
    name: string;
  }
  ```
- [ ] Attach framework metadata when building clusters
- [ ] Log framework used: `console.log('[Clustering] Cluster theme framework:', framework.name)`

### 1.4.5: Handle AI enrichment (if exists)
- [ ] Search for `enrichWithAI()` or similar methods
- [ ] If found, inject framework guidelines into AI prompt
- [ ] Ensure AI enrichment also follows framework structure
- [ ] If not found, skip this step

### 1.4.6: Integration tests
- [ ] Test cluster theme generation with problem data
- [ ] Verify customer-focused themes (not generic)
- [ ] Verify specific outcomes (not vague patterns)
- [ ] Test framework metadata is attached
- [ ] Compare old vs new theme quality

---

## Task 1.5: Integration Testing & Validation (0.5 hours)

### 1.5.1: Create comprehensive integration test
- [ ] Create `/src/__tests__/content-fix/phase1-integration.test.ts`
- [ ] Test full synapse generation flow with framework integration
- [ ] Test full clustering flow with framework integration
- [ ] Verify framework selection works end-to-end
- [ ] Verify framework metadata appears in all outputs

### 1.5.2: Test with real-world data
- [ ] Use sample business intelligence (bakery example from vision doc)
- [ ] Generate synapses and verify:
  - Framework is selected
  - Framework appears in prompt
  - Output follows framework structure
  - Customer perspective maintained
  - No keyword concatenation
- [ ] Generate clusters and verify:
  - Themes are customer-focused
  - Themes are specific
  - No generic patterns like "Product Quality Loved"

### 1.5.3: Backward compatibility check
- [ ] Verify existing synapse generation still works
- [ ] Verify no breaking changes to types
- [ ] Verify dashboard still displays synapses
- [ ] Check for TypeScript errors: `npm run typecheck`

### 1.5.4: Performance validation
- [ ] Measure generation time before/after changes
- [ ] Target: < 200ms overhead for framework selection
- [ ] If > 200ms, optimize framework selection logic
- [ ] Log timing: `console.log('[Framework] Selection took Xms')`

---

## Acceptance Criteria

**Must achieve ALL of these:**

- [ ] FrameworkSelector service created and working
- [ ] FrameworkRouter service created and working
- [ ] SynapseGenerator.ts integrates framework selection
- [ ] clustering.service.ts integrates framework routing
- [ ] All synapses have `frameworkUsed` metadata
- [ ] All clusters have framework-routed themes
- [ ] Themes are customer-focused, not generic
- [ ] No keyword concatenation in titles
- [ ] Framework selection is traceable (logged)
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] Backward compatibility maintained
- [ ] Performance < 200ms overhead
- [ ] TypeScript compilation succeeds
- [ ] No console errors when generating content

**Quality Checks:**
- [ ] Sample synapse title: customer-focused, not business advice
- [ ] Sample cluster theme: specific outcome, not "X Loved" pattern
- [ ] Framework appears in generation prompts
- [ ] Framework metadata visible in output objects

---

## Files Created
1. `/src/services/content/FrameworkSelector.service.ts`
2. `/src/services/content/FrameworkRouter.service.ts`
3. `/src/__tests__/content-fix/framework-selector.test.ts`
4. `/src/__tests__/content-fix/framework-router.test.ts`
5. `/src/__tests__/content-fix/phase1-integration.test.ts`

## Files Modified
1. `/src/services/synapse/SynapseGenerator.ts` - add framework selection before generation
2. `/src/services/intelligence/clustering.service.ts` - update theme generation
3. `/src/types/synapse/synapse.types.ts` - add frameworkUsed field
4. `/src/services/intelligence/clustering.service.ts` - update InsightCluster interface

## Dependencies Used
- `@/services/synapse/generation/ContentFrameworkLibrary` (exists)
- `@/types/connections.types` (exists)
- All other types exist in codebase

---

## Next Steps After Phase 1

Once Phase 1 is complete and accepted:
1. Do comprehensive gap analysis
2. Address any gaps found
3. Proceed to Phase 2: Customer-First Title Generation
4. Update CONTENT_FIX_EXECUTION_INSTRUCTIONS.md with Phase 1 status
