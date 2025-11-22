# Week 1: Foundation & Infrastructure - Atomic Task List

## Build Overview
**Duration:** Week 1 of 8
**Goal:** Establish dual-mode system foundation with comprehensive template library
**Testing:** Internal checkpoint at end of Week 1 (Note: First full user testing is Week 3)

---

## PHASE 0: SETUP (Sequential - Main Branch)

### Task 0.1: Environment Preparation
```bash
cd /Users/byronhudson/Projects/Synapse

# Ensure main is clean and up to date
git stash
git checkout main
git pull origin main

# Install any new dependencies that might be needed
npm install

# Verify build works before starting
npm run build
```

### Task 0.2: Create Week 1 Feature Branch
```bash
# Create main feature branch for Week 1
git checkout -b feature/dashboard-v2-week1

# Push branch to remote
git push -u origin feature/dashboard-v2-week1
```

### Task 0.3: Create Git Worktrees
```bash
# Create worktree directory
mkdir -p ../synapse-worktrees

# Create 4 parallel worktrees
git worktree add ../synapse-worktrees/wt-infrastructure feature/dashboard-v2-week1 -b wt1/infrastructure
git worktree add ../synapse-worktrees/wt-theme-extraction feature/dashboard-v2-week1 -b wt1/theme-extraction
git worktree add ../synapse-worktrees/wt-content-templates feature/dashboard-v2-week1 -b wt1/content-templates
git worktree add ../synapse-worktrees/wt-campaign-templates feature/dashboard-v2-week1 -b wt1/campaign-templates

# Verify worktrees
git worktree list
```

---

## PHASE 1: PARALLEL DEVELOPMENT (4 Worktrees)

### 🔧 WORKTREE 1: Infrastructure (wt-infrastructure)
**Location:** `../synapse-worktrees/wt-infrastructure`
**Branch:** `wt1/infrastructure`

**Tasks:**
- [ ] 1.1 Create campaign data model types in `src/types/v2/campaign.types.ts`
- [ ] 1.2 Create content data model types in `src/types/v2/content.types.ts`
- [ ] 1.3 Create template data model types in `src/types/v2/template.types.ts`
- [ ] 1.4 Create Supabase migration for campaign storage `supabase/migrations/[timestamp]_campaign_tables.sql`
- [ ] 1.5 Add mode toggle component `src/components/v2/ModeToggle.tsx`
- [ ] 1.6 Add mode context provider `src/contexts/v2/ModeContext.tsx`
- [ ] 1.7 Create campaign storage service `src/services/v2/campaign-storage.service.ts`
- [ ] 1.8 Write unit tests for data models
- [ ] 1.9 Commit with message: "feat(v2): add infrastructure for dual-mode system"

---

### 🎯 WORKTREE 2: Theme Extraction (wt-theme-extraction)
**Location:** `../synapse-worktrees/wt-theme-extraction`
**Branch:** `wt1/theme-extraction`

**Tasks:**
- [ ] 2.1 Create enhanced theme extraction service `src/services/v2/theme-extraction.service.ts`
- [ ] 2.2 Implement content-based analysis (migrate from metadata-based)
- [ ] 2.3 Add keyword extraction from actual data point content
- [ ] 2.4 Implement semantic clustering using embeddings
- [ ] 2.5 Add theme uniqueness enforcement (no duplicate titles)
- [ ] 2.6 Create theme types `src/types/v2/theme.types.ts`
- [ ] 2.7 Write unit tests for theme extraction
- [ ] 2.8 Commit with message: "feat(v2): add content-based theme extraction system"

---

### 📝 WORKTREE 3: Content Templates (wt-content-templates)
**Location:** `../synapse-worktrees/wt-content-templates`
**Branch:** `wt1/content-templates`

**Tasks:**
- [ ] 3.1 Create template base service `src/services/v2/templates/template-base.service.ts`
- [ ] 3.2 Implement Hook-based templates (4):
  - Curiosity Gap, Pattern Interrupt, Specific Number, Contrarian
- [ ] 3.3 Implement Problem-Solution templates (3):
  - Mistake Exposer, Hidden Cost, Quick Win
- [ ] 3.4 Implement Story-based templates (3):
  - Transformation, Failure-to-Success, Behind-the-Scenes
- [ ] 3.5 Implement Educational templates (3):
  - Myth Buster, Guide Snippet, Comparison
- [ ] 3.6 Implement Urgency templates (3):
  - Trend Jacker, Deadline Driver, Seasonal
- [ ] 3.7 Implement Authority templates (3):
  - Data Revelation, Expert Roundup, Case Study
- [ ] 3.8 Implement Engagement template (1):
  - Challenge Post
- [ ] 3.9 Add performance prediction metadata for each template
- [ ] 3.10 Create content template registry `src/services/v2/templates/content-template-registry.ts`
- [ ] 3.11 Write unit tests for all 20 templates
- [ ] 3.12 Commit with message: "feat(v2): implement 20 universal content templates"

---

### 🎪 WORKTREE 4: Campaign Templates (wt-campaign-templates)
**Location:** `../synapse-worktrees/wt-campaign-templates`
**Branch:** `wt1/campaign-templates`

**Tasks:**
- [ ] 4.1 Create campaign template base `src/services/v2/templates/campaign-template-base.service.ts`
- [ ] 4.2 Implement Core Journey campaigns (5):
  - RACE Journey (7 pieces, 21 days)
  - PAS Series (5 pieces, 14 days)
  - BAB Campaign (6 pieces, 18 days)
  - Trust Ladder (7 pieces, 28 days)
  - Hero's Journey (8 pieces, 30 days)
- [ ] 4.3 Implement Launch campaigns (2):
  - Product Launch (7 pieces, 14 days)
  - Seasonal Urgency (5 pieces, 10 days)
- [ ] 4.4 Implement Authority campaigns (3):
  - Authority Builder (6 pieces, 21 days)
  - Comparison (5 pieces, 14 days)
  - Education-First (7 pieces, 21 days)
- [ ] 4.5 Implement Conversion campaigns (5):
  - Social Proof (6 pieces, 18 days)
  - Objection Crusher (5 pieces, 14 days)
  - Quick Win (4 pieces, 7 days)
  - Scarcity Sequence (5 pieces, 10 days)
  - Value Stack (6 pieces, 14 days)
- [ ] 4.6 Add performance prediction and ROI estimates for each campaign
- [ ] 4.7 Create campaign template registry `src/services/v2/templates/campaign-template-registry.ts`
- [ ] 4.8 Write unit tests for all 15 campaign templates
- [ ] 4.9 Commit with message: "feat(v2): implement 15 universal campaign templates"

---

## PHASE 2: INTEGRATION (Sequential - After Parallel Phase)

### Task 5: Merge Worktrees
```bash
# Back to main worktree
cd /Users/byronhudson/Projects/Synapse

# Merge all branches in order
git checkout feature/dashboard-v2-week1
git merge wt1/infrastructure --no-ff -m "merge: infrastructure layer"
git merge wt1/theme-extraction --no-ff -m "merge: theme extraction system"
git merge wt1/content-templates --no-ff -m "merge: 20 content templates"
git merge wt1/campaign-templates --no-ff -m "merge: 15 campaign templates"
```

### Task 6: Template Selection Logic
**Location:** Main worktree after merges
- [ ] 6.1 Create template selector service `src/services/v2/template-selector.service.ts`
- [ ] 6.2 Implement connection type detection (2-way vs 3+ way)
- [ ] 6.3 Add pattern matching for automatic template selection:
  - Trending topics → Trend Jacker
  - Competitor gaps → Contrarian Take
  - Customer pain → Hidden Cost Revealer
  - Success stories → Transformation Story
- [ ] 6.4 Add breakthrough score-based template assignment:
  - Score 85+ → Premium campaign templates
  - Score 70-84 → Authority templates
  - Score 60-69 → Quick win templates
- [ ] 6.5 Write integration tests for template selection
- [ ] 6.6 Commit with message: "feat(v2): add smart template selection logic"

### Task 7: Performance Prediction System
- [ ] 7.1 Create performance predictor service `src/services/v2/performance-predictor.service.ts`
- [ ] 7.2 Add prediction display component `src/components/v2/PerformancePrediction.tsx`
- [ ] 7.3 Implement benchmark comparisons based on Content Bible data
- [ ] 7.4 Write tests for prediction accuracy
- [ ] 7.5 Commit with message: "feat(v2): add performance prediction system"

---

## PHASE 3: TESTING CHECKPOINT

### Task 8: Internal Testing
- [ ] 8.1 Run full test suite: `npm run test`
- [ ] 8.2 Run build: `npm run build`
- [ ] 8.3 Manual testing checklist:
  - [ ] Verify mode toggle works
  - [ ] Test theme extraction produces meaningful content
  - [ ] Confirm title uniqueness across 20+ generations
  - [ ] Validate all 35 templates generate properly
  - [ ] Test template selection logic (trending → Trend Jacker, competitor gap → Contrarian)
  - [ ] Verify performance predictions display for each template
- [ ] 8.4 Document any issues found in `/.buildrunner/WEEK1_ISSUES.md`

### Task 9: Cleanup and Documentation
- [ ] 9.1 Remove worktrees:
```bash
git worktree remove ../synapse-worktrees/wt-infrastructure
git worktree remove ../synapse-worktrees/wt-theme-extraction
git worktree remove ../synapse-worktrees/wt-content-templates
git worktree remove ../synapse-worktrees/wt-campaign-templates
rmdir ../synapse-worktrees
```
- [ ] 9.2 Delete local worktree branches:
```bash
git branch -d wt1/infrastructure
git branch -d wt1/theme-extraction
git branch -d wt1/content-templates
git branch -d wt1/campaign-templates
```
- [ ] 9.3 Push Week 1 branch: `git push origin feature/dashboard-v2-week1`
- [ ] 9.4 Update DashboardV2BuildPlan.md with completion status
- [ ] 9.5 Create WEEK1_COMPLETION.md with summary

---

## Testing Schedule Reminder

**Week 1:** Internal testing checkpoint (current)
**Week 2:** Build continues (Campaign Builder, Industry Customization)
**Week 3:** 🔴 FIRST FULL USER TESTING & GAP ANALYSIS
- Test campaign creation flow with 5-10 users
- Evaluate mode switching intuitiveness
- Assess recipe template effectiveness
- Gather feedback on theme extraction quality
- Document missing features
- Identify UI/UX pain points

---

## Success Criteria for Week 1

1. ✅ Mode toggle switches between Content and Campaign mode
2. ✅ Theme extraction produces unique, content-based themes
3. ✅ All 20 content templates generate properly
4. ✅ All 15 campaign templates generate properly
5. ✅ Template selection logic correctly matches patterns to templates
6. ✅ Performance predictions display for each template
7. ✅ All tests pass
8. ✅ Build succeeds without errors
