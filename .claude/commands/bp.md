---
description: Build Plan - Create or update build plans from conversation context
allowed-tools: Read, Write, Edit, Bash, AskUserQuestion
---

# Build Plan Creator

You are creating or updating a build plan based on the conversation.

---

## Step 1: Detect Mode

Check if a current build plan exists:

```bash
ls -la .buildrunner/builds/BUILD_*.md 2>/dev/null | head -5
```

**If build plans exist:** This is likely an UPDATE (confirm with user)
**If no build plans:** This is a CREATE

---

## Step 2: Scan Conversation

Extract from the conversation above:

### Requirements
- What features are being requested?
- What problems are being solved?
- What integrations are needed?

### Technical Decisions
- What stack/framework?
- What architecture patterns?
- What APIs/services?

### Success Criteria
- How do we know it's done?
- What are the acceptance criteria?
- What metrics matter?

### Constraints
- What can't change?
- What's out of scope?
- What dependencies exist?

---

## Step 3: Ask Clarifying Questions (If Needed)

If any of the following are unclear, use AskUserQuestion:

- **Scope:** "Should this include X or is that out of scope?"
- **Priority:** "Which features are must-have vs nice-to-have?"
- **Technical:** "Should we use X or Y approach?"
- **Timeline:** "Is this a quick MVP or full implementation?"

Only ask if truly ambiguous. Don't ask about things already discussed.

---

## Step 4: Generate Summary

**CRITICAL: Do NOT write any files yet. Present this summary and wait for "go".**

Present in this EXACT format:

```markdown
## Build Plan: [Name]

**Mode:** Create New / Update Existing
**Target Release:** [X.X] (now/next/later)
**Based on:** [Brief description of what was discussed]

---

### Features (Triage Before "go")

| # | Feature | Description | Priority | Horizon |
|---|---------|-------------|----------|---------|
| 1 | [Name] | [What it does] | High/Med/Low | now |
| 2 | [Name] | [What it does] | High/Med/Low | now |
| 3 | [Name] | [What it does] | High/Med/Low | now |

**💡 Before saying "go", you can move features to later releases:**
- "move 2,3 to next" → moves to next release
- "move 3 to 4.0" → moves to specific release
- "2 is later" → moves #2 to later horizon

Features moved to later will be added to ROADMAP.md instead of current build.

---

### Phases

| Phase | Name | Deliverables | Parallel? |
|-------|------|--------------|-----------|
| 1 | [Name] | [What's delivered] | [Yes/No - why] |
| 2 | [Name] | [What's delivered] | [Yes/No - why] |
| 3 | [Name] | [What's delivered] | [Yes/No - why] |

### Parallel Execution Plan

For each phase, analyze which features can run in parallel:

| Phase | Parallel Groups | Sequential Items | Reason |
|-------|-----------------|------------------|--------|
| 1 | [Features A,B] | [Feature C after A,B] | [A,B independent, C needs their output] |
| 2 | [All] | [None] | [No dependencies] |

**Parallelization Summary:**
- **Parallel-safe:** [N] features across [X] groups
- **Sequential-required:** [N] features (have dependencies)
- **Estimated speedup:** [X]x faster than sequential

---

### Success Criteria

- [ ] [Criterion 1 - measurable]
- [ ] [Criterion 2 - measurable]
- [ ] [Criterion 3 - measurable]

---

### Technical Approach

- **Stack:** [Framework, language, etc.]
- **Architecture:** [Key patterns]
- **Integrations:** [External services]
- **Key Decisions:** [Important choices made]

---

### Files to Update

- `.buildrunner/builds/BUILD_[name].md` - [create/update]
- `PROJECT_SPEC.md` - Add [X] features
- `features.json` - Add [X] items as planned
- `decisions.log` - Log plan creation

---

**Type "go" to execute, or provide feedback to adjust.**
```

---

## Step 5: Wait for "go" - Handle Triage

**DO NOT PROCEED until user says "go" or equivalent (yes, do it, proceed, etc.)**

### Handle Feature Triage Commands
If user says things like:
- "move 2,3 to next" → Update features 2,3 horizon to "next"
- "move 3 to 4.0" → Update feature 3 release to "4.0", horizon to "later"
- "2 is later" → Update feature 2 horizon to "later"
- "keep 1,4 only" → Move all others to later

After processing triage:
1. Update the feature table with new horizons
2. Re-present the summary showing changes
3. Wait for "go" again

### Handle Other Feedback
If user provides other feedback:
1. Adjust the plan based on feedback
2. Re-present the summary
3. Wait for "go" again

---

## Step 6: Execute (Only After "go")

### 6.0 Execute with Parallel Subagents

**Before building, apply the parallel execution plan:**

For each phase:
1. **Identify parallel groups** from the Parallel Execution Plan
2. **Spawn subagents** for independent features:
   - Each subagent gets ONE feature
   - Max 5 subagents at once (optimal based on research)
   - Each subagent inherits CLAUDE.md governance rules
3. **Wait for parallel group to complete**
4. **Run /gaps** to verify integration before next group
5. **Execute sequential items** (if any) after dependencies complete
6. **Repeat** for next parallel group or phase

**Subagent Spawn Pattern:**
```
"Build [Feature A] as a subagent - focus only on this feature, follow all CLAUDE.md rules"
"Build [Feature B] as a subagent - focus only on this feature, follow all CLAUDE.md rules"
[Wait for completion]
[Run /gaps]
[Continue to dependent features or next phase]
```

**Quality Gates Between Parallel Groups:**
- All subagent work must pass /gaps before proceeding
- If /gaps finds issues, fix before spawning next group
- Never start Phase N+1 until Phase N passes /gaps

### 6.1 Create/Update Build Plan

Write to `.buildrunner/builds/BUILD_[name].md`:

```markdown
# Build Plan: [Name]

**Created:** [DATE]
**Status:** In Progress
**Estimated Completion:** [Based on phases]

## Overview

[Brief description of what this build accomplishes]

## Parallel Execution Summary

| Phase | Parallel Groups | Sequential | Speedup |
|-------|-----------------|------------|---------|
| 1 | [Features A,B] | [Feature C] | ~2x |
| 2 | [All] | [None] | ~3x |

**Execution Pattern:**
1. Spawn subagents for parallel group (max 5)
2. Wait for completion
3. Run /gaps to verify
4. Execute sequential items
5. Repeat for next phase

**Quality Gates:** Run /gaps between every parallel group. Never proceed if gaps found.

## Features

### Feature 1: [Name]
**Priority:** [High/Med/Low]
**Status:** planned

[Description]

**Acceptance Criteria:**
- [ ] [Criterion]
- [ ] [Criterion]

[Repeat for each feature]

## Phases

### Phase 1: [Name]
**Status:** not_started

**Deliverables:**
- [ ] [Deliverable 1]
- [ ] [Deliverable 2]

**Parallel Execution:**
- **Group 1 (parallel):** [Features A, B] - spawn subagents
- **Sequential:** [Feature C] - after Group 1 completes
- **Quality gate:** Run /gaps before Phase 2

[Repeat for each phase]

## Success Criteria

- [ ] [Criterion 1]
- [ ] [Criterion 2]

## Technical Notes

[Key decisions, architecture notes, constraints]

---

*Generated by /bp command*
```

### 6.2 Update PROJECT_SPEC.md

Add or update features section. Read current file first:

@.buildrunner/PROJECT_SPEC.md

Then edit to add new features in the Features section.

### 6.3 Update features.json

For features staying in current build (horizon: now):
```bash
br feature add "[Feature Name]" --priority [high/medium/low] --status planned --horizon now --release [X.X]
```

For features moved to later (horizon: next/later):
```bash
br feature add "[Feature Name]" --priority [high/medium/low] --status planned --horizon [next/later] --release [X.X]
```

Run for each feature in the plan.

### 6.4 Update ROADMAP.md

For any features with horizon next/later:
- Add them to appropriate section in ROADMAP.md
- Don't include them in BUILD_*.md (they're on the roadmap, not current build)

### 6.5 Log Decision

```bash
br decision log "Created build plan: [Name] with [X] features across [Y] phases" --type ARCHITECTURE
```

---

## Step 7: Confirm Completion

Tell the user:

> "✅ Build plan created/updated.
>
> **Files updated:**
> - `.buildrunner/builds/BUILD_[name].md`
> - `PROJECT_SPEC.md` - Added [X] features
> - `features.json` - Added [X] planned items
> - `decisions.log` - Logged plan creation
>
> **Next steps:**
> 1. Review the build plan: `br build show [name]`
> 2. Start Phase 1 when ready
> 3. Use `/gaps` to track progress"

---

## Rules

1. **Always show summary first** - Never write without user confirmation
2. **Analyze parallelization** - Every build plan must include parallel execution analysis
3. **Be concise** - Summary should fit on one screen
4. **Detect mode** - Auto-detect create vs update, confirm with user
5. **Ask if unclear** - Don't guess on ambiguous requirements
6. **Sync all files** - Build plan, PROJECT_SPEC, features.json must stay in sync
7. **Use subagents for parallel work** - Spawn subagents for independent features (max 5)
8. **Quality gates** - Run /gaps between parallel groups, never skip
9. **No parallel for dependencies** - Features that depend on each other run sequentially

## Parallel Execution Guidelines

**Spawn subagents when:**
- 2+ features in a phase have zero dependencies
- Features don't modify the same files
- Each feature is self-contained

**Don't parallelize when:**
- Feature B needs Feature A's output
- Features share database tables being created
- Features modify the same components
- Single feature (nothing to parallelize)

**Dependency indicators:**
- "after X is done" = sequential
- "uses the X component" = check if X exists first
- "extends X" = sequential
- "independent module" = parallel-safe
- "new endpoint" = usually parallel-safe
- "new component" = usually parallel-safe

---

## Conflict Detection

**CRITICAL: Before spawning subagents, detect conflicts.**

### File Overlap Analysis
For each pair of features in a parallel group:
1. List files each feature will create/modify
2. Check for overlaps:
   - Same component files
   - Same API routes
   - Same database tables/migrations
   - Same utility functions
   - Shared configuration files

### Build Conflict Map
Include in summary:
```
| Feature A | Feature B | Conflict | Resolution |
|-----------|-----------|----------|------------|
| Auth | Profile | src/api/user.ts | Sequential |
| Dashboard | Settings | None | Parallel OK |
```

**If conflicts detected:** Move conflicting features to sequential queue.

---

## Context Injection for Subagents

**Every subagent MUST receive project context.**

### Required Context Package:
```
## Governance Rules (MUST FOLLOW)
[Extract from governance.yaml:]
- Blocked libraries list
- RLS requirements
- No direct API calls in frontend
- No console.logs in production

## Architecture Patterns
[Extract from ARCHITECTURE.md:]
- Directory structure
- Component patterns
- API conventions
- State management approach

## Relevant Decisions
[Extract from decisions.log:]
- Decisions affecting this feature
- Past choices to maintain consistency

## File Conventions
[Infer from codebase:]
- Naming patterns (camelCase, kebab-case, etc.)
- Import styles
- Export patterns
```

### Subagent Prompt Template:
```
You are building [FEATURE_NAME] for [PROJECT_NAME].

## Your Task
[SPECIFIC DELIVERABLES - files to create, functions to implement]

## Governance Rules (MUST FOLLOW)
- Never disable RLS
- Use components from ~/Projects/ui-libraries/ only
- No direct API calls in frontend - use edge functions
- No console.logs in production code
- [Other rules from governance.yaml]

## Architecture
[Patterns from ARCHITECTURE.md relevant to this feature]

## Relevant Decisions
[Past decisions that affect this feature]

## Quality Requirements
- Code must pass: npx tsc --noEmit
- No @ts-ignore or any types
- Include error handling

## Instructions
1. Read existing files to understand patterns
2. Implement the feature following conventions
3. Verify no TypeScript errors
4. Report what you created/modified

Do NOT:
- Run the full test suite (parent will do this)
- Modify files outside your assigned scope
- Make architectural decisions without noting them

Return: List of files created/modified and any decisions made.
```

---

## Progress Checkpoints

**Update BUILD_*.md after each parallel group completes.**

### After Each Parallel Group:
1. Check off completed deliverables in build plan
2. Add session progress entry:

```markdown
## Session Progress Log

### [TODAY'S DATE] - Build Session
**Parallel Group 1:**
- ✅ Feature A completed - [files created]
- ✅ Feature B completed - [files created]
- Tests: ✅ Passed

**Parallel Group 2:**
- ✅ Feature C completed
- ⚠️ Feature D - moved to sequential (test failure)
- Tests: ⚠️ 1 failure, fixed in sequential

**Sequential:**
- ✅ Feature D completed (after fix)

**Phase Status:** Complete
**Next:** Phase 2
```

### Progress Update Commands:
After each group, run:
```bash
# Update feature status
br feature update [FEATURE_ID] --status in_progress
br feature update [FEATURE_ID] --status complete

# Log significant decisions from subagent work
br decision log "[Decision made during build]" --type DECISION
```

### Checkpoint Before Next Phase:
Before starting next phase:
1. Verify all previous phase deliverables checked off
2. Run /gaps to ensure no regressions
3. Update phase status in BUILD_*.md
4. Only proceed if /gaps passes
