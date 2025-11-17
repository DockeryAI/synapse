# Build Prompts: Week 2 Merge → Week 5 Beta

**Purpose:** Concise prompts to kick off each week's build with Claude Code
**Format:** Copy-paste prompts with all context Claude needs

---

## 🚨 WEEK 2 MERGE (Do This First)

**Status:** Week 2 trees completed but built to old spec (before V3 research)
**Action:** Merge all three trees, update to V3 spec where needed

### Prompt:

```
Read .buildrunner/WEEK2_MERGE_PLAN.md and execute the merge strategy.

Context:
- Three completed Week 2 trees: Product Scanner, UVP Integration, Bannerbear
- All built to old spec (before V3 research-validated plan)
- Need to merge as-is, then update for V3 compatibility

Tasks:
1. Tuesday: Merge feature/product-scanner → main
   - Run migrations
   - Test product detection end-to-end
   - Verify onboarding wizard integration

2. Wednesday: Merge feature/uvp-integration → main
   - Test wizard pre-population with Product Scanner data
   - Verify UVP quality and validation flow
   - Check DeepContext → UVP mapping accuracy

3. Thursday: Merge feature/bannerbear-integration → main
   - Update template names to V3 campaign types:
     - 'authority-builder' stays (now 7 days)
     - 'social-proof' → 'trust-builder'
     - 'local-pulse' → 'community-champion'
     - Add placeholders for: 'revenue-rush', 'viral-spark'
   - Remove any "live selling" references
   - Test visual generation with updated templates

4. Friday: Integration testing
   - Full end-to-end: URL input → product scan → UVP wizard → campaign generation → visual preview
   - Fix any integration bugs
   - Verify Week 1 + Week 2 work seamlessly

Success criteria:
✅ All three trees merged without breaking changes
✅ Product Scanner enables Revenue Rush campaigns
✅ UVP Integration speeds onboarding (20min → 5min)
✅ Bannerbear templates match V3 campaign types
✅ Ready for Week 3 build (video system, GMB, immediate wins)

After completion, report status and confirm ready for Week 3.
```

---

## WEEK 3: VIDEO-FIRST + IMMEDIATE WIN TACTICS

**Prerequisites:** Week 2 trees merged
**Duration:** 5 days (Mon-Fri)
**Worktrees:** 4 parallel tracks

### Prompt:

```
Read .buildrunner/WEEK3_ATOMIC_TASKS.md and execute the build plan using git worktrees for parallel development.

Context:
- V3 plan based on SMB best practices research (see: SMB_CAMPAIGN_BEST_PRACTICES_2025.md)
- Focus: Copy-paste tactics SMBs can use Monday morning
- 4 PARALLEL worktrees (work on all simultaneously)

WORKFLOW:
1. Create 4 worktrees from main branch:
   - git worktree add ../synapse-video-system feature/video-content-system
   - git worktree add ../synapse-gmb-commerce feature/gmb-social-commerce
   - git worktree add ../synapse-immediate-wins feature/immediate-win-tactics
   - git worktree add ../synapse-mobile-opt feature/mobile-optimization

2. Work in parallel (multiple Claude instances or sequential):
   - Worktree 1 (Mon-Tue, 16h): Video Content System
   - Worktree 2 (Wed, 12h): GMB + Social Commerce
   - Worktree 3 (Thu, 12h): Immediate Win Tactics
   - Worktree 4 (Fri AM, 8h): Mobile Optimization

3. Merge worktrees sequentially (Fri PM, 4h):
   - Merge feature/video-content-system → main
   - Merge feature/gmb-social-commerce → main
   - Merge feature/immediate-win-tactics → main
   - Merge feature/mobile-optimization → main
   - Resolve conflicts, test integration
   - Remove worktrees: git worktree remove ../synapse-*

Key deliverables:
1. Video Content System
   - 15-60 second vertical videos (9:16)
   - Stories ads templates ($0.50-$2 CPM)
   - Auto-captions (Whisper API)
   - Trending audio suggestions

2. Google My Business + Social Commerce
   - GMB API integration (5x local visibility)
   - 2x/week GMB post scheduling
   - Instagram Shopping + Facebook Shop
   - Product tagging in posts/Stories

3. Immediate Win Tactics
   - UGC contest templates (30% engagement boost)
   - Strategic hashtag formula (3 branded + 10 niche + 5 trending)
   - Email capture landing pages (2-5% conversion)
   - Seasonal calendar detector (Q4 = 40% revenue)

4. Mobile Optimization
   - Mobile-first preview mode
   - Thumb-scroll stopping test (70%+ score)
   - Format validation (9:16, text size, speed)
   - All components responsive

Execute all tasks following the atomic task list. Work in parallel using worktrees. Test each worktree independently. Merge all at end of week. Report completion and confirm ready for Week 4.
```

---

## WEEK 4: CAMPAIGN INTELLIGENCE + BENCHMARKS

**Prerequisites:** Week 3 merged
**Duration:** 5 days (Mon-Fri)
**Worktrees:** 3 parallel tracks

### Prompt:

```
Read .buildrunner/WEEK4_ATOMIC_TASKS.md and execute the build plan using git worktrees for parallel development.

Context:
- V3 campaign types with concrete performance benchmarks
- Focus: 5 campaign types (7-14 days), simplified platform selection, "what good looks like"
- 3 PARALLEL worktrees (work on all simultaneously)

WORKFLOW:
1. Create 3 worktrees from main branch:
   - git worktree add ../synapse-campaign-types-v3 feature/campaign-types-v3
   - git worktree add ../synapse-benchmarks feature/performance-benchmarks
   - git worktree add ../synapse-calendar-v3 feature/campaign-calendar-v3

2. Work in parallel (multiple Claude instances or sequential):
   - Worktree 1 (Mon-Tue, 16h): Campaign Types + Platform Selection
   - Worktree 2 (Wed-Thu, 16h): Performance Benchmarks + Day 3 Pivots
   - Worktree 3 (Fri AM, 12h): Campaign Calendar + Orchestration

3. Merge worktrees sequentially (Fri PM, 4h):
   - Merge feature/campaign-types-v3 → main
   - Merge feature/performance-benchmarks → main
   - Merge feature/campaign-calendar-v3 → main
   - Resolve conflicts, test integration
   - Remove worktrees: git worktree remove ../synapse-*

Key deliverables:
1. Campaign Types + Platform Selection
   - 5 campaign types: Authority (7d), Community (14d), Trust (10d), Revenue (5d), Viral (7d)
   - Simplified platform selection (business-type matching)
   - Goal-first selection UI
   - Enforce 2-3 platform maximum
   - Remove live selling complexity

2. Performance Benchmarks + Day 3 Pivots
   - Industry-standard benchmarks: Engagement (FB 1-2%, IG 2-3%, TikTok 5-8%)
   - Ad costs: Stories $0.50-$2, Feed $8-$15
   - Conversion rates: Social→Email 2-5%
   - Day 3 pivot logic (engagement < 2% = adjust)
   - Benchmark dashboard (what "good" looks like)
   - Auto-scheduling optimization

3. Campaign Calendar + Orchestration
   - 5-14 day campaign calendars
   - Platform orchestration (2-3 max)
   - Edit/approve workflow
   - GMB post integration (2x/week)
   - Schedule to SocialPilot

Execute all tasks following the atomic task list. Work in parallel using worktrees. Test each worktree independently. Merge all at end of week. Report completion and confirm ready for Week 5.
```

---

## WEEK 5: TESTING + BETA LAUNCH

**Prerequisites:** Week 4 merged
**Duration:** 5 days (Mon-Fri)
**Worktrees:** 2 parallel tracks (Testing + Polish)

### Prompt:

```
Read .buildrunner/WEEK5_ATOMIC_TASKS.md and execute the build plan using git worktrees for parallel development.

Context:
- End-to-end testing, polish, and beta launch preparation
- Focus: Quality assurance, mobile optimization, alpha testing with 5 SMB users
- 2 PARALLEL worktrees (work on both simultaneously)

WORKFLOW:
1. Create 2 worktrees from main branch:
   - git worktree add ../synapse-e2e-testing feature/e2e-testing
   - git worktree add ../synapse-polish feature/polish-optimization

2. Work in parallel (Mon-Wed, both running simultaneously):
   - Worktree 1 (24h): End-to-End Testing
   - Worktree 2 (20h): Polish & Optimization

3. Merge worktrees sequentially (Wed PM, 2h):
   - Merge feature/e2e-testing → main
   - Merge feature/polish-optimization → main
   - Resolve conflicts, run full test suite
   - Remove worktrees: git worktree remove ../synapse-*

4. Alpha Testing (Thu-Fri, 16h):
   - NO worktree needed (testing in main)
   - Test with 5 real SMB users
   - Collect feedback
   - Fix critical issues
   - Prepare beta launch

Key deliverables:
1. End-to-End Testing (Mon-Wed)
   - Video system tests (15-60s, Stories ads, captions)
   - GMB tests (OAuth, 2x/week scheduling)
   - Social commerce tests (Instagram Shopping, Facebook Shop)
   - Immediate win tactics tests (UGC, hashtags, email capture)
   - Mobile optimization tests (responsive, thumb-scroll)
   - Campaign flow tests (all 5 types, 2-3 platforms)
   - Performance benchmark tests (Day 3 pivots)
   - Integration tests (Week 1-4 compatibility)

2. Polish & Optimization (Mon-Wed)
   - Mobile UX optimization (< 375px width)
   - Social commerce checkout flow polish
   - Video preview optimization (all devices)
   - GMB post scheduling polish
   - Performance optimization (< 3s load time)
   - Error handling and edge cases
   - Accessibility improvements (WCAG AA)

3. Alpha Testing (Thu-Fri)
   - 5 SMB users test end-to-end
   - Onboarding → campaign creation → scheduling
   - Collect feedback (Google Form + Loom)
   - Analyze feedback and prioritize issues
   - Fix critical issues in main branch
   - Prepare beta launch (20-30 users)

Success criteria:
✅ All E2E tests passing
✅ Mobile optimized (all devices)
✅ Performance < 3s load time
✅ 5 alpha users tested successfully
✅ Critical issues fixed
✅ Beta launch materials ready (email, demo video, user list)
✅ READY FOR BETA LAUNCH

Execute all tasks following the atomic task list. Work in parallel using worktrees for testing & polish. Test thoroughly with real SMB users. Report completion and beta launch readiness.
```

---

## Quick Reference: Prompt Usage

**Step 1: Week 2 Merge (Do First)**
```bash
# Copy Week 2 Merge prompt from above
# Give to Claude Code
# Wait for completion and review
# Confirm all tests pass before proceeding
```

**Step 2: Week 3 Build**
```bash
# After Week 2 merged and tested
# Copy Week 3 prompt from above
# Give to Claude Code
# Wait for completion (4 worktrees in parallel)
# Review and test each deliverable
# Merge when satisfied
```

**Step 3: Week 4 Build**
```bash
# After Week 3 merged and tested
# Copy Week 4 prompt from above
# Give to Claude Code
# Wait for completion (3 worktrees in parallel)
# Review and test each deliverable
# Merge when satisfied
```

**Step 4: Week 5 Build**
```bash
# After Week 4 merged and tested
# Copy Week 5 prompt from above
# Give to Claude Code
# Wait for completion (testing + polish)
# Review alpha test results
# Fix critical issues
# LAUNCH BETA
```

---

## Context Files for Claude

**Planning Documents (Read These First):**
- `MVP_ROADMAP_V3.md` - Overall V3 plan with timeline
- `SMB_CAMPAIGN_BEST_PRACTICES_2025.md` - Research ground truth
- `DESIGN_STANDARDS.md` - UI/UX standards (purple/blue gradient, dark mode)
- `CAMPAIGN_ARCHITECTURE_V2.md` - Multi-touch narrative system

**Week-Specific Task Lists:**
- `WEEK2_MERGE_PLAN.md` - Week 2 merge strategy
- `WEEK3_ATOMIC_TASKS.md` - Video + immediate wins tasks
- `WEEK4_ATOMIC_TASKS.md` - Campaign intelligence + benchmarks tasks
- `WEEK5_ATOMIC_TASKS.md` - Testing + beta launch tasks

**Current State:**
- `STATUS.md` - Current project status
- `features.json` - All features and campaign types

---

## Success Indicators Per Week

**Week 2 Merge:**
- ✅ Product Scanner merged (enables Revenue Rush)
- ✅ UVP Integration merged (5-minute onboarding)
- ✅ Bannerbear merged (V3 template names)

**Week 3:**
- ✅ Video generation (10x+ engagement)
- ✅ GMB integration (5x visibility)
- ✅ Social commerce (Instagram/Facebook Shop)
- ✅ Immediate win tactics (UGC, hashtags, email)

**Week 4:**
- ✅ 5 campaign types (7-14 days)
- ✅ Concrete benchmarks (what good looks like)
- ✅ Day 3 pivots (engagement < 2%)
- ✅ 2-3 platform enforcement

**Week 5:**
- ✅ All tests passing
- ✅ Mobile optimized
- ✅ 5 alpha users successful
- ✅ Beta launch ready

---

## Emergency Contacts

**If build blocked:**
1. Check prerequisites (previous week merged?)
2. Check context files (planning docs up to date?)
3. Check Week 2 trees (merged successfully?)
4. Review best practices doc (research-validated?)

**If tests failing:**
1. Check Week 1 + Week 2 integration
2. Verify no breaking changes
3. Check mobile responsiveness
4. Review error logs

**If unclear requirements:**
1. Reference `SMB_CAMPAIGN_BEST_PRACTICES_2025.md`
2. Reference `MVP_ROADMAP_V3.md`
3. Ask user for clarification
