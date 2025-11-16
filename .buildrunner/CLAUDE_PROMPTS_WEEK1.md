# Week 1 Claude Instance Prompts - Autonomous Execution

**Instructions:** Copy each prompt into a separate Claude Code instance
**Working Directory:** `/Users/byronhudson/Projects/Synapse`
**Timeline:** Each track completes in 1-2 days
**Integration:** All 5 merge on Friday

---

## PROMPT 1: Campaign Type Selector

```
You are building the Campaign Type Selector feature for Synapse. Work autonomously end-to-end until complete.

WORKING DIRECTORY: /Users/byronhudson/Projects/Synapse

INSTRUCTIONS:
1. Read .buildrunner/ATOMIC_TASK_LIST.md - find "Worktree 1: Campaign Type Selector"
2. Read .buildrunner/MVP_GAP_ANALYSIS.md for context on what's already built
3. Read .buildrunner/WEEK_BY_WEEK_PLAN.md for integration strategy
4. Create worktree: ../synapse-campaign-selector on branch feature/campaign-selector
5. Execute ALL tasks listed in the atomic task list for Worktree 1
6. Test your implementation thoroughly
7. Commit with descriptive message
8. Report completion

KEY DELIVERABLES (see atomic task list for details):
- Campaign type definitions (Authority Builder, Social Proof, Local Pulse)
- AI recommendation service using DeepContext
- CampaignTypeCard component
- CampaignTypeSelector container
- All TypeScript compiling with no errors

EXPLORATION GUIDANCE:
- Examine existing DeepContext type in src/types/intelligence.types.ts
- Study existing components in src/components/ for styling patterns
- Check src/services/ for service architecture patterns

AUTONOMY LEVEL: FULL
Install dependencies, create files, test, commit - everything end-to-end without asking.

WORK UNTIL COMPLETE. Report when done.
```

---

## PROMPT 2: Smart Picks UI

```
You are building the Smart Picks UI feature for Synapse. Work autonomously end-to-end until complete.

WORKING DIRECTORY: /Users/byronhudson/Projects/Synapse

INSTRUCTIONS:
1. Read .buildrunner/ATOMIC_TASK_LIST.md - find "Worktree 2: Smart Picks UI"
2. Read .buildrunner/MVP_GAP_ANALYSIS.md for context
3. Read .buildrunner/WEEK_BY_WEEK_PLAN.md for integration strategy
4. Create worktree: ../synapse-smart-picks on branch feature/smart-picks
5. Execute ALL tasks in the atomic list for Worktree 2
6. Test thoroughly
7. Commit with descriptive message
8. Report completion

KEY DELIVERABLES (see atomic task list for details):
- SmartPick type definitions
- SmartPickGenerator service with scoring logic (relevance, timeliness, evidence)
- SmartPickCard component with trust indicators
- SmartPicks container component
- Shows 3-5 AI-recommended campaigns per type

EXPLORATION GUIDANCE:
- Examine existing BreakthroughInsight type in src/types/synapse.types.ts
- Study how Synapse insights are generated in src/services/synapse/
- Review existing intelligence services for data access patterns

AUTONOMY LEVEL: FULL
Install dependencies, create files, test, commit - everything end-to-end without asking.

WORK UNTIL COMPLETE. Report when done.
```

---

## PROMPT 3: Content Mixer

```
You are building the Content Mixer feature for Synapse. Work autonomously end-to-end until complete.

WORKING DIRECTORY: /Users/byronhudson/Projects/Synapse

INSTRUCTIONS:
1. Read .buildrunner/ATOMIC_TASK_LIST.md - find "Worktree 3: Content Mixer"
2. Read .buildrunner/MVP_GAP_ANALYSIS.md for context
3. Read .buildrunner/WEEK_BY_WEEK_PLAN.md for integration strategy
4. Create worktree: ../synapse-content-mixer on branch feature/content-mixer
5. Execute ALL tasks in the atomic list for Worktree 3
6. Install @dnd-kit/core and @dnd-kit/sortable for drag-and-drop
7. Test thoroughly
8. Commit with descriptive message
9. Report completion

KEY DELIVERABLES (see atomic task list for details):
- 3-column drag-and-drop interface
- Insight Pool with categorized tabs (Local, Trending, Seasonal, Industry, Reviews, Competitive)
- Selection Area (drop zone for chosen insights)
- Live Preview (real-time campaign preview)
- ContentMixer container component

EXPLORATION GUIDANCE:
- Study existing Synapse insights structure
- Review @dnd-kit documentation for drag-and-drop patterns
- Check existing UI components for consistent styling

AUTONOMY LEVEL: FULL
Install dependencies, create files, test, commit - everything end-to-end without asking.

WORK UNTIL COMPLETE. Report when done.
```

---

## PROMPT 4: Campaign Preview/Approval

```
You are building the Campaign Preview and Approval feature for Synapse. Work autonomously end-to-end until complete.

WORKING DIRECTORY: /Users/byronhudson/Projects/Synapse

INSTRUCTIONS:
1. Read .buildrunner/ATOMIC_TASK_LIST.md - find "Worktree 4: Campaign Preview/Approval"
2. Read .buildrunner/MVP_GAP_ANALYSIS.md for context
3. Read .buildrunner/WEEK_BY_WEEK_PLAN.md for integration strategy
4. Create worktree: ../synapse-campaign-preview on branch feature/campaign-preview
5. Execute ALL tasks in the atomic list for Worktree 4
6. Test thoroughly
7. Commit with descriptive message
8. Report completion

KEY DELIVERABLES (see atomic task list for details):
- Multi-platform preview (LinkedIn, Facebook, Instagram, X, TikTok, YouTube)
- Platform tabs component
- Preview cards with platform-specific formatting
- Edit section functionality (regenerate individual pieces)
- Approval workflow (approve/reject/request changes)
- Publishing integration placeholder

EXPLORATION GUIDANCE:
- Examine existing content generators in src/services/synapse/generation/
- Study platform variant generation
- Review existing preview components if any

AUTONOMY LEVEL: FULL
Install dependencies, create files, test, commit - everything end-to-end without asking.

WORK UNTIL COMPLETE. Report when done.
```

---

## PROMPT 5: Campaign Orchestrator

```
You are building the Campaign Orchestration Service for Synapse. Work autonomously end-to-end until complete.

WORKING DIRECTORY: /Users/byronhudson/Projects/Synapse

INSTRUCTIONS:
1. Read .buildrunner/ATOMIC_TASK_LIST.md - find "Worktree 5: Campaign Orchestrator"
2. Read .buildrunner/MVP_GAP_ANALYSIS.md for context
3. Read .buildrunner/WEEK_BY_WEEK_PLAN.md for integration strategy
4. Create worktree: ../synapse-campaign-orchestrator on branch feature/campaign-orchestrator
5. Execute ALL tasks in the atomic list for Worktree 5
6. Test thoroughly with mock data
7. Commit with descriptive message
8. Report completion

KEY DELIVERABLES (see atomic task list for details):
- Campaign state machine (IDLE → TYPE_SELECTED → CONTENT_SELECTED → GENERATING → PREVIEW → APPROVED → PUBLISHED)
- CampaignOrchestrator service (workflow coordination)
- CampaignWorkflow service (state management)
- Database persistence integration (campaigns table)
- Error handling and recovery
- Progress tracking

EXPLORATION GUIDANCE:
- Review database schema in supabase/schema.sql for campaigns table
- Study existing service patterns in src/services/
- Examine DeepContext flow through the system

AUTONOMY LEVEL: FULL
Install dependencies, create files, test, commit - everything end-to-end without asking.

WORK UNTIL COMPLETE. Report when done.
```

---

## Common Guidelines for All Instances

**DO:**
- Read the atomic task list for complete task breakdown
- Explore existing codebase to understand patterns
- Create worktrees for isolated development
- Test your implementation
- Commit with descriptive messages
- Work autonomously without asking permission

**DO NOT:**
- Modify main branch directly
- Change existing components unless necessary for integration
- Modify database schema (already defined)
- Skip testing
- Add dependencies without good reason

**FRIDAY INTEGRATION:**
All 5 worktrees will be merged in this order:
1. Campaign Type Selector
2. Smart Picks UI
3. Content Mixer
4. Campaign Preview
5. Campaign Orchestrator

Each instance should be ready to merge by end of day Thursday.

---

*These prompts reference the comprehensive planning documents for full context and task details.*
*Each Claude instance has complete autonomy to read, explore, build, test, and commit.*
