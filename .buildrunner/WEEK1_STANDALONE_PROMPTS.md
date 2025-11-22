# Week 1 Standalone Claude Prompts

Each prompt is fully self-contained and end-to-end. Just copy-paste into a Claude instance.

---

## PROMPT 1: Infrastructure (End-to-End)

```
You are building the Infrastructure layer for Synapse Dashboard V2 Week 1.

SETUP:
1. cd /Users/byronhudson/Projects/Synapse
2. git fetch origin
3. git checkout main && git pull origin main
4. npm install
5. npm run build (verify it works)
6. mkdir -p ../synapse-worktrees
7. git worktree add ../synapse-worktrees/wt-infrastructure -b wt1/infrastructure
8. cd ../synapse-worktrees/wt-infrastructure
9. npm install

BUILD TASKS:
1. Create src/types/v2/campaign.types.ts - Campaign data models (CampaignMode, CampaignPurpose, CampaignArc, CampaignPiece, Campaign interfaces)
2. Create src/types/v2/content.types.ts - Content data models (ContentMode, SingleContent, connection mapping)
3. Create src/types/v2/template.types.ts - Template types (TemplateType enum, ContentTemplate, CampaignTemplate, PerformancePrediction)
4. Create supabase/migrations/[timestamp]_campaign_tables.sql - Tables for campaigns, campaign_pieces, campaign_templates with RLS
5. Create src/components/v2/ModeToggle.tsx - Toggle between Content/Campaign mode using shadcn patterns
6. Create src/contexts/v2/ModeContext.tsx - Mode state management and persistence
7. Create src/services/v2/campaign-storage.service.ts - CRUD for campaigns using Supabase patterns
8. Write tests in src/__tests__/v2/infrastructure/

REFERENCE: Read .buildrunner/Dashboard_V2.md for architecture details.

FINISH:
1. npm run test (ensure tests pass)
2. git add -A && git commit -m "feat(v2): add infrastructure for dual-mode system"
3. Confirm completion with list of files created
```

---

## PROMPT 2: Theme Extraction (End-to-End)

```
You are building the Theme Extraction system for Synapse Dashboard V2 Week 1.

SETUP:
1. cd /Users/byronhudson/Projects/Synapse
2. git fetch origin
3. git checkout main && git pull origin main
4. npm install
5. npm run build (verify it works)
6. mkdir -p ../synapse-worktrees
7. git worktree add ../synapse-worktrees/wt-theme-extraction -b wt1/theme-extraction
8. cd ../synapse-worktrees/wt-theme-extraction
9. npm install

BUILD TASKS:
1. Create src/types/v2/theme.types.ts - Theme, ThemeCluster, ExtractionResult, UniquenessScore types
2. Create src/services/v2/theme-extraction.service.ts with:
   - Content-based analysis (parse actual data point content, not metadata)
   - Keyword extraction from text with frequency weighting
   - Semantic clustering using existing embedding.service.ts
   - Theme uniqueness enforcement (track used themes, no duplicates, semantic similarity check)

REFERENCE:
- Read .buildrunner/Dashboard_V2.md for architecture
- Read src/services/intelligence/embedding.service.ts for embedding patterns

FINISH:
1. Write tests in src/__tests__/v2/theme-extraction.test.ts
2. npm run test (ensure tests pass)
3. git add -A && git commit -m "feat(v2): add content-based theme extraction system"
4. Confirm completion with list of files created
```

---

## PROMPT 3: Content Templates (End-to-End)

```
You are building 20 Content Templates for Synapse Dashboard V2 Week 1.

SETUP:
1. cd /Users/byronhudson/Projects/Synapse
2. git fetch origin
3. git checkout main && git pull origin main
4. npm install
5. npm run build (verify it works)
6. mkdir -p ../synapse-worktrees
7. git worktree add ../synapse-worktrees/wt-content-templates -b wt1/content-templates
8. cd ../synapse-worktrees/wt-content-templates
9. npm install

BUILD TASKS:
1. Create src/services/v2/templates/template-base.service.ts - Abstract base with generate() and performance prediction

2. Create 20 templates in src/services/v2/templates/content/:

Hook-based (4):
- CuriosityGapTemplate.ts: Known + Unknown + Stakes
- PatternInterruptTemplate.ts: Belief + Contradiction + Possibility
- SpecificNumberTemplate.ts: Number + Outcome + Timeframe
- ContrarianTemplate.ts: Norm + Why Wrong + Better Way

Problem-Solution (3):
- MistakeExposerTemplate.ts: Mistake + Why + Fix + Result
- HiddenCostTemplate.ts: Problem + Impact + Solution
- QuickWinTemplate.ts: Change + Result + Proof + How-to

Story-based (3):
- TransformationTemplate.ts: Before + Journey + After + Lesson
- FailureToSuccessTemplate.ts: Failure + Learning + New Approach
- BehindTheScenesTemplate.ts: Success + Process + Challenges

Educational (3):
- MythBusterTemplate.ts: Myth + Why Believed + Truth
- GuideSnippetTemplate.ts: Promise + Credibility + Process
- ComparisonTemplate.ts: A vs B + Criteria + Winner

Urgency (3):
- TrendJackerTemplate.ts: Event + Connection + Solution
- DeadlineDriverTemplate.ts: Opportunity + Window + Action
- SeasonalTemplate.ts: Trigger + Problem + Solution

Authority (3):
- DataRevelationTemplate.ts: Statistic + Meaning + Action
- ExpertRoundupTemplate.ts: Question + Answers + Synthesis
- CaseStudyTemplate.ts: Challenge + Strategy + Results

Engagement (1):
- ChallengePostTemplate.ts: Problem + Challenge + Framework

3. Each template must include performance prediction metadata (CTR improvement 27-52%)
4. Create src/services/v2/templates/content-template-registry.ts - Register all 20, lookup by type

REFERENCE: Read .buildrunner/Dashboard_V2.md and content-writing-guide/ULTIMATE-CONTENT-WRITING-BIBLE-FINAL.md

FINISH:
1. Write tests in src/__tests__/v2/templates/content/
2. npm run test (ensure tests pass)
3. git add -A && git commit -m "feat(v2): implement 20 universal content templates"
4. Confirm completion with list of all 20 templates
```

---

## PROMPT 4: Campaign Templates (End-to-End)

```
You are building 15 Campaign Templates for Synapse Dashboard V2 Week 1.

SETUP:
1. cd /Users/byronhudson/Projects/Synapse
2. git fetch origin
3. git checkout main && git pull origin main
4. npm install
5. npm run build (verify it works)
6. mkdir -p ../synapse-worktrees
7. git worktree add ../synapse-worktrees/wt-campaign-templates -b wt1/campaign-templates
8. cd ../synapse-worktrees/wt-campaign-templates
9. npm install

BUILD TASKS:
1. Create src/services/v2/templates/campaign-template-base.service.ts - Multi-piece generation, timeline, narrative continuity

2. Create 15 campaign templates in src/services/v2/templates/campaigns/:

Core Journey (5):
- RACEJourneyTemplate.ts: 7 pieces, 21 days (Reach → Act → Convert → Engage)
- PASSeriesTemplate.ts: 5 pieces, 14 days (Problem → Agitate → Solve)
- BABCampaignTemplate.ts: 6 pieces, 18 days (Before → After → Bridge)
- TrustLadderTemplate.ts: 7 pieces, 28 days (Progressive trust)
- HerosJourneyTemplate.ts: 8 pieces, 30 days (Story transformation)

Launch (2):
- ProductLaunchTemplate.ts: 7 pieces, 14 days (Tease → Reveal → Close)
- SeasonalUrgencyTemplate.ts: 5 pieces, 10 days (Time-sensitive)

Authority (3):
- AuthorityBuilderTemplate.ts: 6 pieces, 21 days (Expertise)
- ComparisonCampaignTemplate.ts: 5 pieces, 14 days (Competitive)
- EducationFirstTemplate.ts: 7 pieces, 21 days (Complex sale)

Conversion (5):
- SocialProofTemplate.ts: 6 pieces, 18 days (Credibility)
- ObjectionCrusherTemplate.ts: 5 pieces, 14 days (Barrier removal)
- QuickWinCampaignTemplate.ts: 4 pieces, 7 days (Momentum)
- ScarcitySequenceTemplate.ts: 5 pieces, 10 days (Urgency)
- ValueStackTemplate.ts: 6 pieces, 14 days (ROI demo)

3. Each campaign defines all pieces with emotional progression and timing
4. Include ROI estimates (3-5x baseline)
5. Create src/services/v2/templates/campaign-template-registry.ts - Register all 15

REFERENCE: Read .buildrunner/Dashboard_V2.md and content-writing-guide/CONTENT-BIBLE-CAMPAIGNS-MASTERY.md

FINISH:
1. Write tests in src/__tests__/v2/templates/campaigns/
2. npm run test (ensure tests pass)
3. git add -A && git commit -m "feat(v2): implement 15 universal campaign templates"
4. Confirm completion with list of all 15 campaigns
```

---

## PROMPT 5: Integration (Run After Prompts 1-4 Complete)

```
You are integrating Week 1 builds for Synapse Dashboard V2.

SETUP:
1. cd /Users/byronhudson/Projects/Synapse
2. npm install
3. Verify all 4 worktree branches exist: git branch -a | grep wt1

MERGE:
1. git checkout -b feature/dashboard-v2-week1 main
2. git merge wt1/infrastructure --no-ff -m "merge: infrastructure layer"
3. git merge wt1/theme-extraction --no-ff -m "merge: theme extraction system"
4. git merge wt1/content-templates --no-ff -m "merge: 20 content templates"
5. git merge wt1/campaign-templates --no-ff -m "merge: 15 campaign templates"
6. Resolve any conflicts preserving all functionality

BUILD TASKS:
1. Create src/services/v2/template-selector.service.ts:
   - Connection type detection (2-way → content template, 3+ way → campaign)
   - Pattern matching: trending → TrendJacker, competitor gap → Contrarian, pain → HiddenCost, success → Transformation
   - Score-based: 85+ → campaign (Hero's Journey, RACE), 70-84 → authority, 60-69 → quick win

2. Create src/services/v2/performance-predictor.service.ts:
   - Aggregate template predictions
   - Industry benchmark comparisons

3. Create src/components/v2/PerformancePrediction.tsx:
   - Visual prediction display with factor breakdown

FINISH:
1. npm run test && npm run build
2. git add -A && git commit -m "feat(v2): add template selection and performance prediction"
3. git push -u origin feature/dashboard-v2-week1
4. Confirm all tests pass
```

---

## PROMPT 6: Cleanup (Final)

```
You are completing Week 1 for Synapse Dashboard V2.

WORKING DIRECTORY: /Users/byronhudson/Projects/Synapse

TEST CHECKLIST:
- [ ] Mode toggle switches Content/Campaign
- [ ] Theme extraction produces unique content-based themes
- [ ] All 20 content templates generate properly
- [ ] All 15 campaign templates generate properly
- [ ] Template selection matches patterns correctly
- [ ] Performance predictions display for each template

TASKS:
1. Run manual testing, document issues in .buildrunner/WEEK1_ISSUES.md

2. Remove worktrees:
   git worktree remove ../synapse-worktrees/wt-infrastructure
   git worktree remove ../synapse-worktrees/wt-theme-extraction
   git worktree remove ../synapse-worktrees/wt-content-templates
   git worktree remove ../synapse-worktrees/wt-campaign-templates
   rmdir ../synapse-worktrees

3. Delete worktree branches:
   git branch -d wt1/infrastructure wt1/theme-extraction wt1/content-templates wt1/campaign-templates

4. Create .buildrunner/WEEK1_COMPLETION.md with:
   - Summary of what was built
   - All new files created
   - Test results
   - Issues for Week 2

5. Update .buildrunner/DashboardV2BuildPlan.md:
   - Mark Week 1 complete
   - Add completion date
   - Note any deviations

6. git push origin feature/dashboard-v2-week1

REMINDER: Week 3 is first full user testing, not Week 1.
```

---

## Quick Start

**Run Prompts 1-4 in parallel** (4 terminals), then **Prompt 5**, then **Prompt 6**.

Each prompt handles its own setup, dependencies, worktree creation, build, and commit.
