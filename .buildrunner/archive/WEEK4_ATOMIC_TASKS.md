# Week 4 Atomic Task List: Campaign Intelligence + Benchmarks

**Focus:** 5 campaign types with concrete performance benchmarks
**Duration:** 5 days (Mon-Fri)
**Worktrees:** 3 parallel tracks
**Prerequisites:** Week 3 merged (Video System, GMB, Immediate Wins, Mobile Opt)

---

## Worktree 1: Campaign Types + Platform Selection (Mon-Tue, 16h)
**Branch:** `feature/campaign-types-v3`
**Path:** `../synapse-campaign-types-v3`

### Atomic Tasks:

1. **Setup & Dependencies (30min)**
   - [ ] Create worktree from main
   - [ ] Create directory: `src/services/campaigns/v3/`
   - [ ] Create types: `src/types/campaigns-v3.types.ts`
   - [ ] Review best practices document (SMB_CAMPAIGN_BEST_PRACTICES_2025.md)

2. **Campaign Type Definitions (2h)**
   - [ ] Create `src/services/campaigns/v3/CampaignTypeRegistry.ts`
   - [ ] Define 5 campaign types:
     - Authority Builder (7 days, B2B/consultants)
     - Community Champion (14 days, local businesses)
     - Trust Builder (10 days, new businesses)
     - Revenue Rush (5 days, retail/e-commerce)
     - Viral Spark (7 days, all SMBs seeking visibility)
   - [ ] Each type: goal, duration, post count, ideal for, story arc phases
   - [ ] Remove live selling references (not proven in US/Europe)
   - [ ] Export campaign type registry

3. **Platform Selection Service (4h)**
   - [ ] Create `src/services/campaigns/v3/PlatformSelectionService.ts`
   - [ ] Simplified business-type matching:
     - Local Business → Facebook + Google My Business
     - Retail/E-commerce → Instagram + TikTok (if under-40) + Facebook Shop
     - B2B/Professional → LinkedIn + Facebook
     - Service Business → Facebook + Google My Business
   - [ ] Enforce 2-3 platform maximum
   - [ ] Skip low-ROI platforms (e.g., LinkedIn for non-B2B)
   - [ ] Reasoning explanation for each selection
   - [ ] Unit tests for platform selection logic

4. **Goal-First Selection UI (3h)**
   - [ ] Create `src/components/campaigns/v3/GoalSelector.tsx`
   - [ ] Simple UI: "What's your primary goal right now?"
   - [ ] Options: Build Authority, Drive Local Traffic, Build Trust, Drive Sales, Increase Awareness
   - [ ] Each option shows: clear outcome, timeline, example results
   - [ ] Auto-suggest campaign type based on goal
   - [ ] Business type detection (from UVP wizard data)
   - [ ] Platform auto-selection display

5. **Campaign Type Cards V3 (2h)**
   - [ ] Create `src/components/campaigns/v3/CampaignTypeCardV3.tsx`
   - [ ] Display: Icon, name, goal, duration, post count
   - [ ] Story arc phases visualization
   - [ ] Platform icons (2-3 max)
   - [ ] "Ideal for" business types
   - [ ] Expected outcomes (engagement, reach, conversions)
   - [ ] "Recommended" badge if AI-selected

6. **Campaign Builder UI V3 (3h)**
   - [ ] Create `src/components/campaigns/v3/CampaignBuilderV3.tsx`
   - [ ] Step 1: Goal selection
   - [ ] Step 2: Campaign type (AI-suggested + manual)
   - [ ] Step 3: Platform confirmation (2-3 max, editable)
   - [ ] Step 4: Calendar preview (5-14 days)
   - [ ] Simplified flow (no complex multi-step)
   - [ ] Clear CTAs: "Continue", "Generate Campaign"

7. **AI Assistant Foundation (2h)**
   - [ ] Create `src/services/ai/AssistantService.ts`
   - [ ] Natural language → campaign type selection
   - [ ] Examples: "Create a viral campaign for my bakery"
   - [ ] Parse intent and map to campaign types
   - [ ] Connect to existing Claude Sonnet 4.5 integration
   - [ ] Store conversation context in memory

8. **Testing & Verification (1h)**
   - [ ] Test all 5 campaign types
   - [ ] Verify platform selection logic
   - [ ] Test goal-first flow
   - [ ] Verify 2-3 platform enforcement
   - [ ] Test business-type matching
   - [ ] Commit and prepare for review

---

## Worktree 2: Performance Benchmarks + Day 3 Pivots (Wed-Thu, 16h)
**Branch:** `feature/performance-benchmarks`
**Path:** `../synapse-benchmarks`

### Atomic Tasks:

1. **Setup & Dependencies (30min)**
   - [ ] Create worktree from main
   - [ ] Create directory: `src/services/benchmarks/`
   - [ ] Create types: `src/types/benchmarks.types.ts`
   - [ ] Review concrete benchmarks from best practices

2. **Benchmark Data Registry (2h)**
   - [ ] Create `src/services/benchmarks/BenchmarkRegistry.ts`
   - [ ] Define industry-standard benchmarks:
     - Engagement rates: FB 1-2%, IG 2-3%, TikTok 5-8%, LinkedIn 2-3%
     - Ad costs: Stories $0.50-$2 CPM, Feed $8-$15 CPM
     - Conversions: Social→Email 2-5%, Email→Sale 2-3%, Social→Sale 0.5-1%
     - Stories Ad CTR: 3-5%
   - [ ] Benchmarks by business type and campaign type
   - [ ] Export benchmark registry

3. **Performance Tracking Service (4h)**
   - [ ] Create `src/services/benchmarks/PerformanceTrackingService.ts`
   - [ ] Track per campaign: engagement, reach, clicks, conversions
   - [ ] Integration with SocialPilot API (fetch metrics)
   - [ ] Calculate: engagement rate, CTR, conversion rate, cost per acquisition
   - [ ] Compare actual vs benchmark (color-coded: green/yellow/red)
   - [ ] Store performance data in database
   - [ ] Historical tracking (campaign-over-campaign improvement)

4. **Day 3 Pivot Logic (3h)**
   - [ ] Create `src/services/benchmarks/Day3PivotService.ts`
   - [ ] Check performance at Day 3 of campaign
   - [ ] Pivot indicators:
     - Engagement below 2% → adjust content
     - Reach not growing → try different format/timing
     - Negative comments → reassess messaging
   - [ ] Auto-generate pivot recommendations
   - [ ] Alert user: "Your campaign needs adjustment"
   - [ ] Suggested actions: change hook, try video, adjust timing
   - [ ] Unit tests for pivot logic

5. **Benchmark Dashboard Component (4h)**
   - [ ] Create `src/components/benchmarks/BenchmarkDashboard.tsx`
   - [ ] Display: "What Good Looks Like"
   - [ ] Show benchmarks by platform (engagement, costs, conversions)
   - [ ] Current campaign performance vs benchmark
   - [ ] Color-coded indicators (green = above benchmark)
   - [ ] Charts: engagement over time, reach growth
   - [ ] Day 3 checkpoint alert (if pivot needed)
   - [ ] Cost per acquisition tracking

6. **Auto-Scheduling Optimization (2h)**
   - [ ] Create `src/services/benchmarks/SchedulingOptimizer.ts`
   - [ ] Optimal posting times by platform:
     - Facebook: Weekdays 1-3 PM
     - Instagram: Weekdays 11 AM - 1 PM
     - TikTok: Evenings 7-9 PM
     - LinkedIn: Tue-Thu 8-10 AM
   - [ ] Adjust based on audience data (if available)
   - [ ] Timezone detection (business location)
   - [ ] Auto-schedule campaign posts at optimal times

7. **AI Benchmark Insights (2h)**
   - [ ] Create `src/services/ai/BenchmarkExplainerService.ts`
   - [ ] Natural language explanations of benchmark data
   - [ ] Examples: "Why am I below average?", "How do I improve engagement?"
   - [ ] Context-aware responses based on campaign performance
   - [ ] Proactive suggestions when below benchmark
   - [ ] Connect to Claude Sonnet 4.5 for intelligent explanations

8. **Testing & Verification (1h)**
   - [ ] Test benchmark data display
   - [ ] Verify Day 3 pivot logic
   - [ ] Test performance tracking
   - [ ] Verify auto-scheduling optimization
   - [ ] Test dashboard UI
   - [ ] Commit and prepare for review

---

## Worktree 3: Campaign Calendar + Orchestration (Fri, 12h)
**Branch:** `feature/campaign-calendar-v3`
**Path:** `../synapse-calendar-v3`

### Atomic Tasks:

1. **Setup & Dependencies (30min)**
   - [ ] Create worktree from main
   - [ ] Install: `@fullcalendar/react` (calendar UI)
   - [ ] Create directory: `src/components/campaigns/calendar/`
   - [ ] Create types: `src/types/calendar.types.ts`

2. **Campaign Calendar Generator (3h)**
   - [ ] Create `src/services/campaigns/v3/CampaignCalendarGenerator.ts`
   - [ ] Generate 5-14 day campaign schedule
   - [ ] Story arc phase mapping (Days 1-2 hook, Days 3-5 build, etc.)
   - [ ] Post frequency by campaign type (Authority: 7-10 posts, Revenue Rush: 8-12)
   - [ ] Platform rotation (if 2+ platforms)
   - [ ] Optimal timing per post (from SchedulingOptimizer)
   - [ ] Include GMB posts (2x/week for local)
   - [ ] Export calendar as JSON

3. **Platform Orchestration Service (3h)**
   - [ ] Create `src/services/campaigns/v3/PlatformOrchestrator.ts`
   - [ ] Enforce 2-3 platform maximum
   - [ ] Content adaptation per platform:
     - Video length (TikTok 21-34s, Instagram 15-60s)
     - Caption length (Twitter 280, LinkedIn 300)
     - Hashtags (IG 18 max, LinkedIn 3-5)
   - [ ] Platform-specific formatting
   - [ ] Cross-posting strategy (lead platform + secondary)
   - [ ] GMB post integration for local businesses

4. **Calendar Preview Component (3h)**
   - [ ] Create `src/components/campaigns/calendar/CampaignCalendarView.tsx`
   - [ ] Full campaign calendar visualization (5-14 days)
   - [ ] Timeline view showing story arc progression
   - [ ] Platform icons per post
   - [ ] Post time stamps
   - [ ] Day 3 checkpoint indicator
   - [ ] Post details on hover/click
   - [ ] Edit post button
   - [ ] Drag-and-drop to reschedule (optional)

5. **Edit/Approve Workflow (2h)**
   - [ ] Create `src/components/campaigns/calendar/PostEditor.tsx`
   - [ ] Edit individual post: text, image, video, timing
   - [ ] Preview post on selected platform
   - [ ] Approve/reject post
   - [ ] Bulk approve all posts
   - [ ] "Schedule Campaign" final button
   - [ ] Integration with SocialPilot API (schedule posts)

6. **GMB Post Integration (1h)**
   - [ ] Add GMB posts to campaign calendar
   - [ ] Auto-generate GMB content from campaign theme
   - [ ] 2x/week GMB post scheduling
   - [ ] GMB post types: Update, Offer, Event
   - [ ] Preview GMB post in calendar

7. **AI Calendar Editor (2h)**
   - [ ] Create `src/services/ai/CalendarEditorService.ts`
   - [ ] Natural language calendar modifications
   - [ ] Examples: "Make next week more casual", "Add more videos"
   - [ ] Parse intent and update calendar posts
   - [ ] Preserve campaign narrative arc
   - [ ] Connect to Claude Sonnet 4.5 for intelligent editing

8. **Testing & Verification (30min)**
   - [ ] Test calendar generation (5, 7, 10, 14 day campaigns)
   - [ ] Verify platform orchestration (2-3 platforms)
   - [ ] Test edit/approve workflow
   - [ ] Verify GMB post integration
   - [ ] Test scheduling to SocialPilot
   - [ ] Commit and prepare for review

---

## Integration & Testing (Fri afternoon, 4h)

**All Worktrees Merged:**

1. **Cross-Feature Integration (2h)**
   - [ ] Merge Worktree 1 (Campaign Types + Platform Selection)
   - [ ] Merge Worktree 2 (Performance Benchmarks)
   - [ ] Merge Worktree 3 (Campaign Calendar)
   - [ ] Resolve any merge conflicts
   - [ ] Verify no breaking changes

2. **End-to-End Testing (2h)**
   - [ ] Test: Goal selection → Campaign type → Platform selection → Calendar
   - [ ] Test: All 5 campaign types generate correctly
   - [ ] Test: Benchmark dashboard shows correct data
   - [ ] Test: Day 3 pivot logic triggers correctly
   - [ ] Test: Calendar edit/approve workflow
   - [ ] Test: GMB posts in calendar
   - [ ] Test: Schedule campaign to SocialPilot
   - [ ] Verify 2-3 platform enforcement throughout

3. **Documentation & Review (30min)**
   - [ ] Update README with Week 4 features
   - [ ] Document campaign types and story arcs
   - [ ] Document benchmarks and Day 3 pivot logic
   - [ ] Create user guide for campaign builder V3

---

## Success Criteria

**Campaign Types:**
- ✅ 5 campaign types (7-14 days max, no 30-day)
- ✅ Goal-first selection UI (simple, clear outcomes)
- ✅ Simplified platform selection (business-type matching)
- ✅ No live selling complexity
- ✅ 2-3 platform maximum enforced

**Performance Benchmarks:**
- ✅ Industry-standard benchmarks displayed
- ✅ Engagement rates: FB 1-2%, IG 2-3%, TikTok 5-8%
- ✅ Ad costs: Stories $0.50-$2, Feed $8-$15
- ✅ Conversion rates: Social→Email 2-5%
- ✅ Day 3 pivot logic (engagement < 2% = adjust)
- ✅ Benchmark dashboard (what "good" looks like)

**Campaign Calendar:**
- ✅ 5-14 day campaign calendars
- ✅ Platform orchestration (2-3 max)
- ✅ Edit/approve workflow
- ✅ GMB post integration (2x/week)
- ✅ Schedule to SocialPilot

---

## Week 4 Deliverables

**SMBs can now:**
1. Select goal-first (Authority, Community, Trust, Revenue, Viral)
2. Get AI-suggested campaign type based on goal + business type
3. See auto-selected 2-3 platforms (no overload)
4. View full campaign calendar (5-14 days)
5. See concrete benchmarks (what good looks like)
6. Get Day 3 pivot recommendations (if engagement < 2%)
7. Edit/approve all posts before scheduling
8. Include GMB posts automatically (local businesses)
9. Schedule entire campaign to SocialPilot in one click
10. Track performance vs industry benchmarks

**Ready for Week 5:** Testing + beta launch
