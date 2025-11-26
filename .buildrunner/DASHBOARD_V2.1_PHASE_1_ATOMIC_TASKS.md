# Dashboard V2.1 - Phase 1 Atomic Tasks
**Display Components Creation & Integration**

## Context
Create 5 missing UI components that will display framework-enhanced cluster data and breakthrough insights, then integrate them into the existing PowerMode component.

## Prerequisites
- Existing types in `src/types/synapse/synapse.types.ts` for InsightCluster
- PowerMode component at `src/components/dashboard/intelligence-v2/PowerMode.tsx`
- BreakthroughScoreCard exists at `src/components/v2/intelligence/BreakthroughScoreCard.tsx`

---

## Task 1: Create ClusterPatternCard Component
**File:** `src/components/dashboard/ClusterPatternCard.tsx`
**Purpose:** Display a cluster with framework, coherence, sources, and data points

**Requirements:**
- Accept InsightCluster type with frameworkUsed field
- Display cluster theme as title
- Show framework badge if frameworkUsed exists
- Display coherence score as progress bar (0-100%)
- List unique sources with badges
- Show dominant sentiment with color coding
- Display data point count
- Add "Generate Campaign" button
- Use Framer Motion for enter animation
- Match existing dashboard design system (Tailwind)

**Dependencies:** None

---

## Task 2: Create BreakthroughCard Component
**File:** `src/components/dashboard/BreakthroughCard.tsx`
**Purpose:** Display a breakthrough insight with quality score and Synapse button

**Requirements:**
- Accept SynapseInsight type with qualityScore field
- Display insight text prominently
- Show quality score badge (0-100 with color coding)
- Display framework used if available
- Show confidence score
- Add "Generate with Synapse" button with sparkle icon
- Show whyProfound and whyNow if available
- Include expected reaction indicator
- Use Framer Motion for hover effects
- Match existing card design

**Dependencies:** None

---

## Task 3: Create EQScoreBadge Component
**File:** `src/components/dashboard/EQScoreBadge.tsx`
**Purpose:** Reusable badge to display emotional intelligence scores

**Requirements:**
- Accept score (0-100) as prop
- Accept variant: 'compact' | 'detailed'
- Compact: Just colored circle with number
- Detailed: Include label and score breakdown tooltip
- Color coding: 80+ green, 60-79 blue, 40-59 yellow, <40 red
- Small, lightweight component
- Accessible (ARIA labels)
- TypeScript strict mode

**Dependencies:** None

---

## Task 4: Create CelebrationAnimation Component
**File:** `src/components/dashboard/CelebrationAnimation.tsx`
**Purpose:** Framer Motion celebration for high-scoring content

**Requirements:**
- Accept trigger prop (boolean)
- Accept score (number) to determine intensity
- Three intensity levels: 80-85 (mild), 85-90 (moderate), 90+ (intense)
- Animations: Confetti, sparkles, scale pulse
- Auto-dismiss after 3 seconds
- Portal rendering (fixed position overlay)
- Non-blocking (doesn't interrupt user flow)
- Respects prefers-reduced-motion
- Sound effect optional prop

**Dependencies:** None

---

## Task 5: Create CampaignTimeline Component
**File:** `src/components/dashboard/CampaignTimeline.tsx`
**Purpose:** Dashboard-embedded timeline view for campaigns

**Requirements:**
- Accept campaign data with phases and pieces
- Horizontal timeline layout (compact)
- Show 3-5 key milestones
- Display emotional arc with icons
- Click to expand full timeline view
- Mobile responsive (vertical on small screens)
- Uses existing CampaignTimelineViz logic where possible
- Matches dashboard aesthetic

**Dependencies:** None

---

## Task 6: Wire ClusterPatternCard into PowerMode
**File:** `src/components/dashboard/intelligence-v2/PowerMode.tsx`

**Requirements:**
- Import ClusterPatternCard
- Replace existing "Hidden Pattern" card rendering (lines 370-389)
- Pass InsightCluster data to ClusterPatternCard
- Map cluster data to proper props
- Handle "Generate Campaign" button click
- Maintain existing selection functionality
- Keep grid layout intact
- Add loading skeleton for clusters

**Dependencies:** Task 1 complete

---

## Task 7: Integrate BreakthroughCard for Top Insights
**File:** `src/components/dashboard/intelligence-v2/PowerMode.tsx`

**Requirements:**
- Import BreakthroughCard
- Add new section "Top Breakthroughs" above clusters
- Display top 3 insights with highest quality scores
- Use BreakthroughCard for rendering
- Handle "Generate with Synapse" button
- Add EQScoreBadge to each card
- Trigger CelebrationAnimation on scores 85+

**Dependencies:** Tasks 2, 3, 4 complete

---

## Task 8: Add Quality Score Indicators
**File:** `src/components/dashboard/intelligence-v2/PowerMode.tsx`

**Requirements:**
- Import EQScoreBadge
- Add to all insight cards in grid
- Show framework badge on insights with frameworkUsed
- Sort insights by quality score (highest first)
- Add filter toggle for "High Quality Only" (80+)
- Update header to show quality stats

**Dependencies:** Task 3 complete

---

## Task 9: Create Component Export Index
**File:** `src/components/dashboard/index.ts`

**Requirements:**
- Export all 5 new components
- Export existing dashboard components
- Organize by category
- Add JSDoc comments for each export

**Dependencies:** Tasks 1-5 complete

---

## Task 10: Update TypeScript Types
**File:** `src/types/dashboard.types.ts` (create if doesn't exist)

**Requirements:**
- Add ClusterPatternCardProps interface
- Add BreakthroughCardProps interface
- Add EQScoreBadgeProps interface
- Add CelebrationAnimationProps interface
- Add CampaignTimelineProps interface
- Export all types

**Dependencies:** Tasks 1-5 complete

---

## Success Criteria
- [ ] All 5 new components created and rendering correctly
- [ ] PowerMode displays clusters with ClusterPatternCard
- [ ] Framework badges visible on all applicable insights
- [ ] Quality scores visible via EQScoreBadge
- [ ] Celebration animation triggers on high scores
- [ ] No TypeScript errors
- [ ] Components match design system
- [ ] Mobile responsive
- [ ] Accessible (keyboard nav, screen readers)

---

## Testing Checklist
- [ ] Navigate to /dashboard and switch to Power Mode
- [ ] Verify clusters render with framework data
- [ ] Check quality scores display correctly
- [ ] Trigger celebration by generating 90+ score content
- [ ] Test "Generate Campaign" button on cluster
- [ ] Test "Generate with Synapse" button on breakthrough
- [ ] Verify mobile responsiveness
- [ ] Check dark mode compatibility

---

## Estimated Time: 4-6 hours
