# Week 1 Claude Instance Prompts

## Execution Order

1. **SETUP** - Run Prompt 0 first (creates worktrees)
2. **PARALLEL** - Run Prompts 1-4 simultaneously in separate terminals
3. **INTEGRATION** - Run Prompt 5 after all parallel builds complete
4. **CLEANUP** - Run Prompt 6 to merge and cleanup

---

## PROMPT 0: SETUP (Run First)

```
You are working on the Synapse project Dashboard V2 enhancement. Your task is to set up the Week 1 build environment with git worktrees for parallel development.

TASKS:
1. Ensure you're on main branch and it's clean
2. Run npm install to get dependencies
3. Run npm run build to verify everything works
4. Create feature branch: feature/dashboard-v2-week1
5. Create 4 git worktrees in ../synapse-worktrees/:
   - wt-infrastructure (branch: wt1/infrastructure)
   - wt-theme-extraction (branch: wt1/theme-extraction)
   - wt-content-templates (branch: wt1/content-templates)
   - wt-campaign-templates (branch: wt1/campaign-templates)
6. Verify all worktrees exist with git worktree list

REFERENCE: Read .buildrunner/WEEK1_ATOMIC_TASKS.md for full task details.

When complete, output the worktree list and confirm all 4 are ready for parallel development.
```

---

## PROMPT 1: Infrastructure Worktree (Parallel)

```
You are working on the Synapse project Dashboard V2 - Infrastructure worktree.

WORKING DIRECTORY: /Users/byronhudson/Projects/synapse-worktrees/wt-infrastructure
BRANCH: wt1/infrastructure

REFERENCE FILES:
- Read .buildrunner/Dashboard_V2.md for architecture details
- Read .buildrunner/WEEK1_ATOMIC_TASKS.md for task list
- Read src/types/ for existing type patterns
- Read src/contexts/ for context patterns

YOUR TASKS (Complete all before committing):

1. Create campaign data model types in src/types/v2/campaign.types.ts:
   - CampaignMode, CampaignPurpose, CampaignArc types
   - CampaignPiece, Campaign interfaces
   - Timeline and narrative continuity types

2. Create content data model types in src/types/v2/content.types.ts:
   - ContentMode, ContentPurpose types
   - SingleContent interface
   - Connection mapping types

3. Create template data model types in src/types/v2/template.types.ts:
   - TemplateType, TemplateCategory enums
   - ContentTemplate, CampaignTemplate interfaces
   - PerformancePrediction type

4. Create Supabase migration for campaign storage:
   - supabase/migrations/[timestamp]_campaign_tables.sql
   - Tables: campaigns, campaign_pieces, campaign_templates
   - Include RLS policies

5. Create mode toggle component src/components/v2/ModeToggle.tsx:
   - Toggle between Content and Campaign mode
   - Visual indicator of current mode
   - Use existing UI patterns (shadcn/radix)

6. Create mode context provider src/contexts/v2/ModeContext.tsx:
   - Mode state management
   - Mode switching logic
   - Persist mode preference

7. Create campaign storage service src/services/v2/campaign-storage.service.ts:
   - CRUD operations for campaigns
   - Campaign piece management
   - Use existing Supabase patterns

8. Write unit tests for data models in src/__tests__/v2/

9. Commit with message: "feat(v2): add infrastructure for dual-mode system"

IMPORTANT:
- Follow existing code patterns and conventions
- Use TypeScript strict mode
- Export all types and services properly
- Do NOT merge - just commit to your branch
```

---

## PROMPT 2: Theme Extraction Worktree (Parallel)

```
You are working on the Synapse project Dashboard V2 - Theme Extraction worktree.

WORKING DIRECTORY: /Users/byronhudson/Projects/synapse-worktrees/wt-theme-extraction
BRANCH: wt1/theme-extraction

REFERENCE FILES:
- Read .buildrunner/Dashboard_V2.md for architecture details
- Read .buildrunner/WEEK1_ATOMIC_TASKS.md for task list
- Read src/services/intelligence/embedding.service.ts for embedding patterns
- Read existing theme/synthesis services for patterns

YOUR TASKS (Complete all before committing):

1. Create enhanced theme extraction service src/services/v2/theme-extraction.service.ts:
   - Main service class with dependency injection
   - Public methods for theme extraction

2. Implement content-based analysis:
   - Parse actual data point content (not just metadata)
   - Extract meaningful themes from text content
   - Migrate away from metadata-only approach

3. Add keyword extraction from actual data points:
   - Extract key phrases and terms
   - Weight by frequency and relevance
   - Support multi-word phrases

4. Implement semantic clustering using embeddings:
   - Use existing embedding.service.ts
   - Cluster similar themes together
   - Identify pattern groups

5. Add theme uniqueness enforcement:
   - Track used themes per session
   - Ensure no duplicate titles
   - Semantic similarity checking

6. Create theme types src/types/v2/theme.types.ts:
   - Theme, ThemeCluster interfaces
   - ExtractionResult type
   - UniquenessScore type

7. Write unit tests in src/__tests__/v2/theme-extraction.test.ts:
   - Test content-based extraction
   - Test uniqueness enforcement
   - Test clustering accuracy

8. Commit with message: "feat(v2): add content-based theme extraction system"

IMPORTANT:
- Integrate with existing embedding service
- Ensure themes are diverse and non-repetitive
- Follow existing service patterns
- Do NOT merge - just commit to your branch
```

---

## PROMPT 3: Content Templates Worktree (Parallel)

```
You are working on the Synapse project Dashboard V2 - Content Templates worktree.

WORKING DIRECTORY: /Users/byronhudson/Projects/synapse-worktrees/wt-content-templates
BRANCH: wt1/content-templates

REFERENCE FILES:
- Read .buildrunner/Dashboard_V2.md for complete template specifications
- Read .buildrunner/WEEK1_ATOMIC_TASKS.md for task list
- Read content-writing-guide/ULTIMATE-CONTENT-WRITING-BIBLE-FINAL.md for framework details
- Read existing content generation services for patterns

YOUR TASKS (Complete all before committing):

1. Create template base service src/services/v2/templates/template-base.service.ts:
   - Abstract base class for all templates
   - Common generation logic
   - Performance prediction interface

2. Implement Hook-based templates (4) in src/services/v2/templates/content/:
   - CuriosityGapTemplate.ts: Known + Unknown + Stakes
   - PatternInterruptTemplate.ts: Belief + Contradiction + Possibility
   - SpecificNumberTemplate.ts: Number + Outcome + Timeframe
   - ContrarianTemplate.ts: Norm + Why Wrong + Better Way

3. Implement Problem-Solution templates (3):
   - MistakeExposerTemplate.ts: Mistake + Why + Fix + Result
   - HiddenCostTemplate.ts: Problem + Impact + Solution
   - QuickWinTemplate.ts: Change + Result + Proof + How-to

4. Implement Story-based templates (3):
   - TransformationTemplate.ts: Before + Journey + After + Lesson
   - FailureToSuccessTemplate.ts: Failure + Learning + New Approach
   - BehindTheScenesTemplate.ts: Success + Process + Challenges

5. Implement Educational templates (3):
   - MythBusterTemplate.ts: Myth + Why Believed + Truth
   - GuideSnippetTemplate.ts: Promise + Credibility + Process
   - ComparisonTemplate.ts: A vs B + Criteria + Winner

6. Implement Urgency templates (3):
   - TrendJackerTemplate.ts: Event + Connection + Solution
   - DeadlineDriverTemplate.ts: Opportunity + Window + Action
   - SeasonalTemplate.ts: Trigger + Problem + Solution

7. Implement Authority templates (3):
   - DataRevelationTemplate.ts: Statistic + Meaning + Action
   - ExpertRoundupTemplate.ts: Question + Answers + Synthesis
   - CaseStudyTemplate.ts: Challenge + Strategy + Results

8. Implement Engagement template (1):
   - ChallengePostTemplate.ts: Problem + Challenge + Framework

9. Add performance prediction metadata for each template:
   - Expected CTR improvement (27-52%)
   - Engagement multiplier
   - Best use cases

10. Create content template registry src/services/v2/templates/content-template-registry.ts:
    - Register all 20 templates
    - Lookup by type/category
    - Get template metadata

11. Write unit tests for all 20 templates in src/__tests__/v2/templates/

12. Commit with message: "feat(v2): implement 20 universal content templates"

IMPORTANT:
- Each template must have generate() method
- Include performance predictions
- Follow Content Bible frameworks exactly
- Do NOT merge - just commit to your branch
```

---

## PROMPT 4: Campaign Templates Worktree (Parallel)

```
You are working on the Synapse project Dashboard V2 - Campaign Templates worktree.

WORKING DIRECTORY: /Users/byronhudson/Projects/synapse-worktrees/wt-campaign-templates
BRANCH: wt1/campaign-templates

REFERENCE FILES:
- Read .buildrunner/Dashboard_V2.md for complete campaign template specifications
- Read .buildrunner/WEEK1_ATOMIC_TASKS.md for task list
- Read content-writing-guide/CONTENT-BIBLE-CAMPAIGNS-MASTERY.md for campaign frameworks
- Read existing content generation services for patterns

YOUR TASKS (Complete all before committing):

1. Create campaign template base src/services/v2/templates/campaign-template-base.service.ts:
   - Abstract base class for campaign templates
   - Multi-piece generation logic
   - Timeline and arc management
   - Narrative continuity engine

2. Implement Core Journey campaigns (5) in src/services/v2/templates/campaigns/:
   - RACEJourneyTemplate.ts: 7 pieces, 21 days (Reach → Act → Convert → Engage)
   - PASSeriesTemplate.ts: 5 pieces, 14 days (Problem → Agitate → Solve)
   - BABCampaignTemplate.ts: 6 pieces, 18 days (Before → After → Bridge)
   - TrustLadderTemplate.ts: 7 pieces, 28 days (Progressive trust building)
   - HerosJourneyTemplate.ts: 8 pieces, 30 days (Story-based transformation)

3. Implement Launch campaigns (2):
   - ProductLaunchTemplate.ts: 7 pieces, 14 days (Tease → Reveal → Close)
   - SeasonalUrgencyTemplate.ts: 5 pieces, 10 days (Time-sensitive push)

4. Implement Authority campaigns (3):
   - AuthorityBuilderTemplate.ts: 6 pieces, 21 days (Expertise establishment)
   - ComparisonCampaignTemplate.ts: 5 pieces, 14 days (Competitive positioning)
   - EducationFirstTemplate.ts: 7 pieces, 21 days (Complex sale support)

5. Implement Conversion campaigns (5):
   - SocialProofTemplate.ts: 6 pieces, 18 days (Credibility cascade)
   - ObjectionCrusherTemplate.ts: 5 pieces, 14 days (Barrier removal)
   - QuickWinCampaignTemplate.ts: 4 pieces, 7 days (Momentum building)
   - ScarcitySequenceTemplate.ts: 5 pieces, 10 days (Urgency creation)
   - ValueStackTemplate.ts: 6 pieces, 14 days (ROI demonstration)

6. Add performance prediction and ROI estimates for each campaign:
   - Expected ROI (3-5x baseline)
   - Conversion improvement
   - Engagement timeline

7. Create campaign template registry src/services/v2/templates/campaign-template-registry.ts:
   - Register all 15 campaign templates
   - Lookup by purpose/type
   - Get campaign metadata and timelines

8. Write unit tests for all 15 campaign templates in src/__tests__/v2/campaigns/

9. Commit with message: "feat(v2): implement 15 universal campaign templates"

IMPORTANT:
- Each campaign must define all pieces with emotional progression
- Include timing/spacing between pieces
- Ensure narrative continuity across pieces
- Follow RACE, PAS, BAB frameworks from Content Bible
- Do NOT merge - just commit to your branch
```

---

## PROMPT 5: Integration (Run After Parallel Phase Completes)

```
You are working on the Synapse project Dashboard V2 - Integration phase.

WORKING DIRECTORY: /Users/byronhudson/Projects/Synapse (main worktree)
BRANCH: feature/dashboard-v2-week1

REFERENCE FILES:
- Read .buildrunner/Dashboard_V2.md for architecture
- Read .buildrunner/WEEK1_ATOMIC_TASKS.md for task list

PREREQUISITE: All 4 parallel worktrees must be committed and ready.

YOUR TASKS:

1. Merge all worktree branches (in order):
   ```bash
   git checkout feature/dashboard-v2-week1
   git merge wt1/infrastructure --no-ff -m "merge: infrastructure layer"
   git merge wt1/theme-extraction --no-ff -m "merge: theme extraction system"
   git merge wt1/content-templates --no-ff -m "merge: 20 content templates"
   git merge wt1/campaign-templates --no-ff -m "merge: 15 campaign templates"
   ```

2. Resolve any merge conflicts carefully

3. Create template selector service src/services/v2/template-selector.service.ts:
   - Import all template registries
   - Implement connection type detection (2-way vs 3+ way)
   - Add pattern matching for automatic template selection:
     * Trending topics → TrendJackerTemplate
     * Competitor gaps → ContrarianTemplate
     * Customer pain → HiddenCostTemplate
     * Success stories → TransformationTemplate
   - Add breakthrough score-based assignment:
     * Score 85+ → Campaign templates (Hero's Journey, RACE)
     * Score 70-84 → Authority templates (Data Revelation, Case Study)
     * Score 60-69 → Quick win templates

4. Create performance predictor service src/services/v2/performance-predictor.service.ts:
   - Aggregate predictions from templates
   - Calculate combined performance metrics
   - Industry benchmark comparisons

5. Create prediction display component src/components/v2/PerformancePrediction.tsx:
   - Visual display of predictions
   - Factor breakdown
   - Benchmark comparison

6. Write integration tests for:
   - Template selection logic
   - Performance prediction accuracy
   - End-to-end flow

7. Run full test suite: npm run test
8. Run build: npm run build

9. Commit with message: "feat(v2): add template selection and performance prediction"

10. Push to remote: git push origin feature/dashboard-v2-week1

IMPORTANT:
- Ensure all tests pass
- Resolve conflicts preserving all functionality
- Test mode toggle end-to-end
```

---

## PROMPT 6: Cleanup & Documentation (Final)

```
You are completing the Synapse project Dashboard V2 - Week 1 build.

WORKING DIRECTORY: /Users/byronhudson/Projects/Synapse

YOUR TASKS:

1. Run the full testing checklist:
   - [ ] Verify mode toggle works
   - [ ] Test theme extraction produces meaningful content
   - [ ] Confirm title uniqueness across 20+ generations
   - [ ] Validate all 35 templates generate properly
   - [ ] Test template selection logic
   - [ ] Verify performance predictions display

2. Document any issues found in .buildrunner/WEEK1_ISSUES.md

3. Remove worktrees:
   ```bash
   git worktree remove ../synapse-worktrees/wt-infrastructure
   git worktree remove ../synapse-worktrees/wt-theme-extraction
   git worktree remove ../synapse-worktrees/wt-content-templates
   git worktree remove ../synapse-worktrees/wt-campaign-templates
   rmdir ../synapse-worktrees
   ```

4. Delete local worktree branches:
   ```bash
   git branch -d wt1/infrastructure
   git branch -d wt1/theme-extraction
   git branch -d wt1/content-templates
   git branch -d wt1/campaign-templates
   ```

5. Create WEEK1_COMPLETION.md in .buildrunner/ with:
   - Summary of what was built
   - List of all new files created
   - Test results
   - Any issues or blockers for Week 2
   - Recommendations for improvements

6. Update .buildrunner/DashboardV2BuildPlan.md:
   - Mark Week 1 tasks as complete
   - Add actual completion date
   - Note any deviations from plan
   - Update dependencies for Week 2

7. Push final changes: git push origin feature/dashboard-v2-week1

REMINDER: First full user testing is in Week 3, not Week 1.
Week 2 builds Campaign Builder Interface and Industry Customization.
```

---

## Quick Reference: Parallel Execution

Open 4 terminal windows and run Prompts 1-4 simultaneously:

| Terminal | Worktree | Prompt |
|----------|----------|--------|
| Terminal 1 | wt-infrastructure | Prompt 1 |
| Terminal 2 | wt-theme-extraction | Prompt 2 |
| Terminal 3 | wt-content-templates | Prompt 3 |
| Terminal 4 | wt-campaign-templates | Prompt 4 |

After all 4 complete, run Prompt 5 (Integration) then Prompt 6 (Cleanup).
