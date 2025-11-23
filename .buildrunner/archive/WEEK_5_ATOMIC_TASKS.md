# Week 5: UI/UX Enhancement & Refinement - Atomic Task Lists

**Goal:** Progressive disclosure interface, live preview, customer segment alignment
**Strategy:** 3 parallel tracks using git worktrees
**Duration:** Week 5 (after Week 4 100% complete)

---

## Pre-Build Checklist

**Verify Week 4 Complete:**
- ✅ Intelligence Layer merged (Opportunity Radar, Competitive Analysis, Breakthrough Scoring)
- ✅ Campaign V3 merged (Goal Selector, Platform Selector, Calendar View)
- ✅ All 557 Week 4 tests passing
- ✅ TypeScript errors fixed (104 → 72, all Week 4 code at 0 errors)

**Clean Up Old Worktrees:**
```bash
cd /Users/byronhudson/Projects/Synapse
git worktree remove /Users/byronhudson/Projects/synapse-worktrees/wt-breakthrough-scoring --force
git worktree remove /Users/byronhudson/Projects/wt-competitive-analysis --force
git worktree remove /Users/byronhudson/Projects/wt-opportunity-radar --force
git branch -d feature/v2-breakthrough-scoring
git branch -d feature/v2-competitive-analysis
git branch -d feature/v2-opportunity-radar
```

---

## Parallel Execution Strategy

**3 Independent Tracks (can run simultaneously):**

### Track A: Progressive Disclosure UI
- **Worktree:** `wt-progressive-ui`
- **Branch:** `feature/v2-progressive-ui`
- **Duration:** ~4-6 hours
- **Lines:** ~2,000 lines (3 UI levels + orchestration)

### Track B: Live Preview Enhancement
- **Worktree:** `wt-live-preview`
- **Branch:** `feature/v2-live-preview`
- **Duration:** ~3-4 hours
- **Lines:** ~1,200 lines (split view + visualizations)

### Track C: Customer Segment Alignment
- **Worktree:** `wt-segment-alignment`
- **Branch:** `feature/v2-segment-alignment`
- **Duration:** ~3-4 hours
- **Lines:** ~1,500 lines (persona mapping + scoring)

**Total:** ~4,700 lines across 3 tracks

---

## TRACK A: Progressive Disclosure UI

### Standalone Prompt for Track A

```
Build the Progressive Disclosure UI system for Dashboard V2 (Week 5, Track A).

CONTEXT: You are working in an isolated git worktree. Week 4 is complete with Intelligence Layer and Campaign V3 merged. This track builds the 3-level progressive disclosure interface.

SETUP:
1. Create worktree: git worktree add -b feature/v2-progressive-ui ../wt-progressive-ui
2. cd ../wt-progressive-ui
3. npm install
4. Verify tests run: npm test

BUILD REQUIREMENTS:

Level 1: AI Suggestion Mode (Simple)
- Component: src/components/v2/ui-levels/SimpleCampaignMode.tsx
- One-click campaign generation from AI suggestions
- Show 3 recommended campaigns based on business context
- "Generate Campaign" button → full campaign created
- Minimal configuration (just approve/edit)
- Hide all advanced options
- Features:
  * Display smart picks from OpportunityRadar
  * Show campaign preview cards
  * One-click generate with sensible defaults
  * Quick edit modal for title/dates only

Level 2: Customization Mode (Custom)
- Component: src/components/v2/ui-levels/CustomCampaignMode.tsx
- Timeline and piece-level adjustments
- Show campaign calendar with drag-drop reordering
- Edit individual pieces inline
- Adjust emotional triggers per piece
- Platform selection (already built, integrate here)
- Features:
  * Inline piece editing
  * Timeline visualization
  * Drag-drop piece reordering
  * Emotional trigger selector per piece
  * Preview updates in real-time

Level 3: Power User Mode (Power)
- Component: src/components/v2/ui-levels/PowerCampaignMode.tsx
- Full connection builder (all controls exposed)
- Manual phase creation
- Custom emotional progression
- Advanced scheduling options
- Competitive insights integration
- Breakthrough score tuning
- Features:
  * Full campaign arc editor
  * Manual connection/causality builder
  * Advanced EQ trigger matrix
  * Custom timing controls
  * Integration with all Week 4 intelligence features

UI Level Orchestrator
- Component: src/components/v2/ui-levels/UILevelSelector.tsx
- Service: src/services/v2/ui-level-manager.service.ts
- Detects user expertise level (first-time, intermediate, power)
- Smooth transitions between levels
- Remember user's preferred level
- Progressive hints to upgrade to next level
- Features:
  * Auto-detect based on usage patterns
  * Manual level switcher (toggle in header)
  * Onboarding tooltips for each level
  * Usage analytics (track which level used most)

TYPES:
Create src/types/v2/ui-levels.types.ts:
- UILevel: 'simple' | 'custom' | 'power'
- UserExpertiseProfile
- UILevelConfig
- ProgressiveDisclosureSettings

TESTS:
- src/__tests__/v2/ui-levels/simple-mode.test.tsx (15 tests)
- src/__tests__/v2/ui-levels/custom-mode.test.tsx (20 tests)
- src/__tests__/v2/ui-levels/power-mode.test.tsx (25 tests)
- src/__tests__/v2/ui-levels/ui-level-manager.test.ts (18 tests)

INTEGRATION:
- Connect SimpleCampaignMode to OpportunityRadar smart picks
- Connect CustomCampaignMode to CampaignCalendarView
- Connect PowerCampaignMode to BreakthroughScorer and CompetitiveInsights

VALIDATION:
- All 78 tests must pass
- TypeScript 0 errors
- Build succeeds: npm run build

COMPLETION:
1. Run tests: npm test
2. Run TypeScript check: npx tsc --noEmit
3. Commit: git add . && git commit -m "feat(v2): progressive disclosure UI with 3 levels

- Simple mode: One-click AI campaigns
- Custom mode: Timeline and piece editing
- Power mode: Full connection builder
- UI level manager with auto-detection

Week 5 Track A - 78 tests passing"
4. Return to main: cd /Users/byronhudson/Projects/Synapse
5. Report status: echo "Track A complete. Ready to merge when all tracks done."

DO NOT merge yet. Wait for Tracks B and C to complete.
```

---

## TRACK B: Live Preview Enhancement

### Standalone Prompt for Track B

```
Build the Live Preview Enhancement system for Dashboard V2 (Week 5, Track B).

CONTEXT: You are working in an isolated git worktree. Week 4 is complete. This track builds the split-view interface with real-time preview.

SETUP:
1. Create worktree: git worktree add -b feature/v2-live-preview ../wt-live-preview
2. cd ../wt-live-preview
3. npm install
4. Verify tests run: npm test

BUILD REQUIREMENTS:

Split-View Interface
- Component: src/components/v2/preview/SplitViewEditor.tsx
- Left pane: Campaign editor (form/timeline)
- Right pane: Live preview (updates in real-time)
- Resizable divider between panes
- Responsive: Stack vertically on mobile
- Features:
  * Adjustable split ratio (40/60, 50/50, 60/40)
  * Collapse/expand either pane
  * Full-screen preview mode
  * Sync scroll between editor and preview

Campaign Timeline Visualization
- Component: src/components/v2/preview/CampaignTimelineViz.tsx
- Visual timeline showing all campaign pieces
- Color-coded by emotional trigger
- Day markers with piece count
- Hover shows piece preview
- Click to jump to that piece in editor
- Features:
  * Horizontal timeline (day 1 → day N)
  * Emotional trigger color bands
  * Milestone markers (Day 3 checkpoint, campaign end)
  * Mini preview on hover
  * Interactive: click to edit that piece

Real-Time Content Preview
- Component: src/components/v2/preview/LiveContentPreview.tsx
- Service: src/services/v2/preview-renderer.service.ts
- Platform-specific rendering (Facebook, Instagram, LinkedIn, etc.)
- Character count with platform limits
- Hashtag highlighting
- Link preview generation
- Image/video placeholder rendering
- Features:
  * Platform switcher (preview on different platforms)
  * Character counter with warnings
  * Emoji support
  * Link card preview
  * Mobile/desktop preview toggle

Mobile Responsive Preview
- Component: src/components/v2/preview/MobilePreview.tsx
- iPhone/Android frame rendering
- Accurate mobile dimensions
- Touch interaction simulation
- Platform-specific UI elements
- Features:
  * Device selector (iPhone 14, Galaxy S23, etc.)
  * Orientation toggle (portrait/landscape)
  * Safe area visualization
  * Mobile-specific platform rendering

Preview State Management
- Service: src/services/v2/preview-state.service.ts
- Hook: src/hooks/v2/usePreview.ts
- Debounced updates (300ms delay)
- Change detection and diffing
- Preview cache for performance
- Features:
  * Auto-save preview state
  * Undo/redo for preview changes
  * Preview snapshots (save preview versions)
  * Export preview as image

TYPES:
Create src/types/v2/preview.types.ts:
- SplitViewConfig
- TimelineVisualizationData
- PlatformPreviewOptions
- MobileDeviceSpec
- PreviewState

TESTS:
- src/__tests__/v2/preview/split-view.test.tsx (12 tests)
- src/__tests__/v2/preview/timeline-viz.test.tsx (15 tests)
- src/__tests__/v2/preview/live-preview.test.tsx (20 tests)
- src/__tests__/v2/preview/mobile-preview.test.tsx (10 tests)
- src/__tests__/v2/services/preview-renderer.test.ts (15 tests)

INTEGRATION:
- Connect SplitViewEditor to CampaignBuilder
- Connect LiveContentPreview to platform-specific renderers
- Connect TimelineViz to CampaignCalendarView data

VALIDATION:
- All 72 tests must pass
- TypeScript 0 errors
- Build succeeds: npm run build

COMPLETION:
1. Run tests: npm test
2. Run TypeScript check: npx tsc --noEmit
3. Commit: git add . && git commit -m "feat(v2): live preview enhancement with split view

- Split-view editor with resizable panes
- Campaign timeline visualization
- Real-time platform previews
- Mobile responsive preview

Week 5 Track B - 72 tests passing"
4. Return to main: cd /Users/byronhudson/Projects/Synapse
5. Report status: echo "Track B complete. Ready to merge when all tracks done."

DO NOT merge yet. Wait for Tracks A and C to complete.
```

---

## TRACK C: Customer Segment Alignment

### Standalone Prompt for Track C

```
Build the Customer Segment Alignment system for Dashboard V2 (Week 5, Track C).

CONTEXT: You are working in an isolated git worktree. Week 4 is complete. This track builds persona mapping and segment-specific content optimization.

SETUP:
1. Create worktree: git worktree add -b feature/v2-segment-alignment ../wt-segment-alignment
2. cd ../wt-segment-alignment
3. npm install
4. Verify tests run: npm test

BUILD REQUIREMENTS:

Persona Mapping System
- Component: src/components/v2/segments/PersonaMapper.tsx
- Service: src/services/v2/persona-mapping.service.ts
- Define customer personas from business data
- Map personas to emotional triggers
- Assign pieces to target personas
- Features:
  * Auto-detect personas from buyer intelligence
  * Manual persona creation/editing
  * Persona cards with demographics, goals, pain points
  * Drag-drop assign pieces to personas
  * Persona match score for each piece

EQ Trigger Adjustments per Segment
- Component: src/components/v2/segments/SegmentEQAdjuster.tsx
- Service: src/services/v2/segment-eq-optimizer.service.ts
- Override default EQ triggers based on segment
- Segment-specific emotional intensity
- A/B test different triggers per segment
- Features:
  * EQ trigger matrix per persona
  * Intensity slider (subtle → strong)
  * Historical performance by segment
  * Recommended triggers based on segment data

Purchase Stage Scoring
- Service: src/services/v2/purchase-stage-scorer.service.ts
- Component: src/components/v2/segments/PurchaseStageIndicator.tsx
- Detect purchase stage: awareness / consideration / decision
- Score content fit for each stage
- Recommend content adjustments for stage
- Features:
  * Stage detection from content analysis
  * Stage-specific content guidelines
  * Visual stage funnel
  * Stage transition recommendations

Segment Match Factor Integration
- Service: src/services/v2/segment-match-calculator.service.ts
- Calculate how well content matches target segment
- Integrate with BreakthroughScorer (Week 4)
- Add segment match as scoring factor
- Features:
  * Segment match score (0-100)
  * Match breakdown (persona, stage, EQ fit)
  * Improvement suggestions
  * Segment performance predictions

Segment Analytics
- Component: src/components/v2/segments/SegmentPerformance.tsx
- Service: src/services/v2/segment-analytics.service.ts
- Track which segments perform best
- Compare EQ triggers across segments
- Identify under-served segments
- Features:
  * Performance heatmap by segment
  * Segment engagement trends
  * Trigger effectiveness by segment
  * Gap analysis (which segments need content)

TYPES:
Create src/types/v2/segments.types.ts:
- CustomerPersona
- PersonaProfile
- PurchaseStage: 'awareness' | 'consideration' | 'decision'
- SegmentEQMapping
- SegmentMatchScore
- SegmentPerformanceData

TESTS:
- src/__tests__/v2/segments/persona-mapper.test.tsx (15 tests)
- src/__tests__/v2/segments/segment-eq-adjuster.test.tsx (12 tests)
- src/__tests__/v2/services/purchase-stage-scorer.test.ts (18 tests)
- src/__tests__/v2/services/segment-match-calculator.test.ts (20 tests)
- src/__tests__/v2/segments/segment-analytics.test.tsx (15 tests)

INTEGRATION:
- Connect PersonaMapper to buyer intelligence data (Week 4)
- Connect SegmentMatchCalculator to BreakthroughScorer
- Connect PurchaseStageScorer to content analysis pipeline
- Update PerformancePrediction to include segment match factor

VALIDATION:
- All 80 tests must pass
- TypeScript 0 errors
- Build succeeds: npm run build

COMPLETION:
1. Run tests: npm test
2. Run TypeScript check: npx tsc --noEmit
3. Commit: git add . && git commit -m "feat(v2): customer segment alignment system

- Persona mapping with auto-detection
- Segment-specific EQ trigger optimization
- Purchase stage scoring (awareness/consideration/decision)
- Segment match factor integration

Week 5 Track C - 80 tests passing"
4. Return to main: cd /Users/byronhudson/Projects/Synapse
5. Report status: echo "Track C complete. Ready to merge when all tracks done."

DO NOT merge yet. Wait for Tracks A and B to complete.
```

---

## Integration & Merge (After All Tracks Complete)

### Standalone Prompt for Integration

```
Integrate and merge all Week 5 tracks (Progressive UI, Live Preview, Segment Alignment).

PREREQUISITES:
- Track A (wt-progressive-ui) complete with 78 tests passing
- Track B (wt-live-preview) complete with 72 tests passing
- Track C (wt-segment-alignment) complete with 80 tests passing

INTEGRATION STEPS:

1. Return to main worktree:
cd /Users/byronhudson/Projects/Synapse
git checkout feature/dashboard-v2-week2

2. Merge Track A (Progressive UI):
git merge --no-ff feature/v2-progressive-ui -m "Merge Week 5 Track A: Progressive Disclosure UI

- Simple mode: One-click AI campaigns
- Custom mode: Timeline editing
- Power mode: Full connection builder
- 78 tests passing"

3. Merge Track B (Live Preview):
git merge --no-ff feature/v2-live-preview -m "Merge Week 5 Track B: Live Preview Enhancement

- Split-view editor
- Campaign timeline visualization
- Real-time platform previews
- 72 tests passing"

4. Merge Track C (Segment Alignment):
git merge --no-ff feature/v2-segment-alignment -m "Merge Week 5 Track C: Customer Segment Alignment

- Persona mapping system
- Segment EQ optimization
- Purchase stage scoring
- 80 tests passing"

5. Resolve any merge conflicts (unlikely since tracks are independent)

6. Run full test suite:
npm test

Expected: 787 tests passing (557 Week 4 + 230 Week 5)

7. Run TypeScript check:
npx tsc --noEmit

Expected: 72 errors (all legacy, 0 in Week 5 code)

8. Run production build:
npm run build

Expected: SUCCESS

9. Integration testing:
npm run test:integration

Test that:
- SimpleCampaignMode integrates with OpportunityRadar
- CustomCampaignMode integrates with LivePreview
- PowerCampaignMode integrates with SegmentAlignment
- All 3 UI levels accessible via UILevelSelector

10. Update build plan:
Update .buildrunner/DashboardV2BuildPlan.md:
- Mark Week 5 as ✅ COMPLETE
- Update completion percentage
- Document any deviations

11. Create completion report:
Create .buildrunner/WEEK_5_COMPLETE.md documenting:
- All features delivered
- Test coverage (230 new tests)
- Lines of code added (~4,700)
- Integration status
- Any issues encountered

12. Clean up worktrees:
git worktree remove ../wt-progressive-ui
git worktree remove ../wt-live-preview
git worktree remove ../wt-segment-alignment

13. Commit integration:
git add .
git commit -m "feat(v2): Week 5 complete - UI/UX enhancement & refinement

Progressive Disclosure UI:
- 3-level interface (Simple/Custom/Power)
- Smart UI level detection
- 78 tests passing

Live Preview Enhancement:
- Split-view editor
- Real-time preview
- 72 tests passing

Customer Segment Alignment:
- Persona mapping
- Segment EQ optimization
- Purchase stage scoring
- 80 tests passing

Total: 230 new tests, 4,700 lines
Week 5 100% complete, ready for Week 6 testing"

VALIDATION:
✅ 787 total tests passing (557 + 230)
✅ TypeScript: 0 errors in Week 5 code
✅ Production build succeeds
✅ All 3 tracks integrated
✅ Worktrees cleaned up
✅ Build plan updated
```

---

## Week 5 Summary

**Deliverables:**
1. Progressive Disclosure UI (3 levels)
2. Live Preview Enhancement (split view, timeline viz, platform previews)
3. Customer Segment Alignment (personas, EQ optimization, purchase stages)

**Test Coverage:**
- Track A: 78 tests
- Track B: 72 tests
- Track C: 80 tests
- **Total:** 230 new tests
- **Cumulative:** 787 tests (557 Week 4 + 230 Week 5)

**Lines of Code:**
- Track A: ~2,000 lines
- Track B: ~1,200 lines
- Track C: ~1,500 lines
- **Total:** ~4,700 lines

**Duration:** 10-14 hours (3-5 hours per track in parallel)

**Next:** Week 6 - Testing & Gap Analysis #2

---

## Concise Prompts for Parallel Execution

### Start Track A (Progressive UI)
```
Build Week 5 Track A: Progressive Disclosure UI (Simple/Custom/Power modes). Follow TRACK A prompt from WEEK_5_ATOMIC_TASKS.md. Create worktree, build 3 UI levels, 78 tests. DO NOT merge.
```

### Start Track B (Live Preview)
```
Build Week 5 Track B: Live Preview Enhancement (split view, timeline viz, platform previews). Follow TRACK B prompt from WEEK_5_ATOMIC_TASKS.md. Create worktree, build preview system, 72 tests. DO NOT merge.
```

### Start Track C (Segment Alignment)
```
Build Week 5 Track C: Customer Segment Alignment (personas, EQ optimization, purchase stages). Follow TRACK C prompt from WEEK_5_ATOMIC_TASKS.md. Create worktree, build segment system, 80 tests. DO NOT merge.
```

### Integrate All Tracks
```
Integrate Week 5 Tracks A, B, C. Follow Integration prompt from WEEK_5_ATOMIC_TASKS.md. Merge all 3 branches, run 787 tests, update build plan, clean worktrees.
```
