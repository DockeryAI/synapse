---
description: Resume current build with parallel subagents where safe
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Task
---

# Resume Build with Parallel Execution

You are resuming the current build, using subagents to parallelize work where it won't impact quality.

---

## Step 1: Load Build Context

### 1.1 Find Current Build Plan
```bash
ls -t .buildrunner/builds/BUILD_*.md 2>/dev/null | head -1
```

Read the current build plan:
@.buildrunner/builds/BUILD_*.md

### 1.2 Load Supporting Context
Read these files to understand project state:

@.buildrunner/governance.yaml
@.buildrunner/ARCHITECTURE.md
@.buildrunner/context/decisions.log
@.buildrunner/features.json

---

## Step 2: Analyze Build Progress

From the build plan, identify:

### 2.1 Phase Status
For each phase in the build plan:
- **COMPLETE** - All deliverables checked off
- **IN PROGRESS** - Some deliverables done, some pending
- **NOT STARTED** - No deliverables checked off

### 2.2 Pending Work
List all unchecked deliverables from:
1. Current IN PROGRESS phase
2. All NOT STARTED phases

### 2.3 Feature Status
Cross-reference with features.json:
```bash
br feature list 2>/dev/null || cat .buildrunner/features.json
```

Map each pending deliverable to its feature status.

---

## Step 3: Conflict Detection

**CRITICAL: Identify features that CANNOT run in parallel.**

### 3.1 File Overlap Analysis
For each pair of pending features:
1. List files each feature will modify (from build plan or infer from description)
2. Check for overlaps:
   - Same component files
   - Same API routes
   - Same database tables
   - Same utility functions
   - Shared configuration files

### 3.2 Dependency Analysis
Check if any feature depends on another:
- Feature B needs Feature A's output
- Feature B imports from Feature A's files
- Feature B uses API created by Feature A
- Shared database migrations (order matters)

### 3.3 Build Conflict Map
Create a conflict map:
```
Feature A: [files it touches]
Feature B: [files it touches]
Conflict: [overlapping files] → MUST BE SEQUENTIAL

Feature C: [files it touches]
Feature D: [files it touches]
No conflict → CAN PARALLELIZE
```

---

## Step 4: Create Parallel Execution Plan

### 4.1 Group Features
Based on conflict analysis:

**Parallel Group 1:** [Features with no conflicts between them]
**Parallel Group 2:** [Features that depend on Group 1]
**Sequential Queue:** [Features with complex dependencies or same-file conflicts]

### 4.2 Assign Work to Subagents
For each feature in a parallel group, create a specific task:

**Good task assignment:**
```
Build the user authentication feature:
- Create src/components/LoginForm.tsx
- Create src/api/auth.ts
- Add login route to src/app/login/page.tsx
- Feature must pass TypeScript check
```

**Bad task assignment:**
```
Continue working on the project
```

### 4.3 Context Package for Subagents
Each subagent MUST receive:
1. **Governance rules** - What's forbidden (blocked libraries, RLS requirements)
2. **Architecture patterns** - How to structure code in this project
3. **Relevant decisions** - Past decisions affecting this feature
4. **File conventions** - Naming patterns, import styles
5. **Quality requirements** - Must pass tsc, no console.logs, etc.

---

## Step 5: Present Resume Plan

Show the user:

```markdown
## Resume Plan for [BUILD_NAME]

**Current Status:**
- Phase 1: ✅ Complete
- Phase 2: 🔄 In Progress (3/7 deliverables)
- Phase 3: ⏳ Not Started

**Pending Work:** [N] features/deliverables

**Parallel Analysis:**
- Parallel-safe: [X] features across [Y] groups
- Sequential-required: [Z] features (file conflicts or dependencies)
- Estimated speedup: ~[X]x faster than sequential

**Conflict Detection:**
| Feature A | Feature B | Conflict | Resolution |
|-----------|-----------|----------|------------|
| Auth | Profile | src/api/user.ts | Sequential |
| Dashboard | Settings | None | Parallel OK |

**Execution Plan:**

**Group 1 (Parallel):**
- Feature: [name] → Subagent task: [specific deliverables]
- Feature: [name] → Subagent task: [specific deliverables]

**Group 2 (After Group 1):**
- Feature: [name] → Subagent task: [specific deliverables]

**Sequential (One at a time):**
- Feature: [name] - Reason: [why can't parallelize]

**Quality Gates:**
- After each parallel group: Run tests, verify no regressions
- Update BUILD_*.md with completion status
- Run /gaps if any failures

Ready to resume? (yes/no)
```

---

## Step 6: Execute Parallel Resume

**On user confirmation ("yes", "go", "continue"):**

### 6.1 Spawn Parallel Group

Use the Task tool to spawn subagents for all features in Group 1.

**CRITICAL: Spawn ALL subagents in ONE message using multiple Task tool invocations.**

For each subagent, use this prompt template:

```
You are building a specific feature for [PROJECT_NAME].

## Your Task
[SPECIFIC DELIVERABLES - files to create, functions to implement]

## Governance Rules (MUST FOLLOW)
- Never disable RLS
- Use components from ~/Projects/ui-libraries/ only
- No direct API calls in frontend - use edge functions
- No console.logs in production code
- All database tables need RLS policies

## Architecture
[RELEVANT PATTERNS from ARCHITECTURE.md]

## Relevant Decisions
[PAST DECISIONS that affect this feature]

## File Conventions
[NAMING PATTERNS, import styles from this project]

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

### 6.2 Wait for Completion

After spawning, wait for all subagents to report back.

### 6.3 Quality Gate

After Group 1 completes:

1. **Run tests:**
```bash
npm test 2>&1 | tail -30 || pytest 2>&1 | tail -30
```

2. **Check TypeScript:**
```bash
npx tsc --noEmit 2>&1 | head -20
```

3. **If tests pass:**
   - Update BUILD_*.md - check off completed deliverables
   - Log decisions from subagent reports
   - Continue to Group 2

4. **If tests fail:**
   - Identify which subagent's work caused failure
   - Revert that work or fix sequentially
   - Move feature to sequential queue
   - Continue with remaining parallel work

### 6.4 Progress Checkpoint

After each parallel group, update the build plan:

```markdown
## Session Progress Log

### [TODAY'S DATE] - Parallel Resume Session
- **Group 1 completed:** [features]
- **Tests:** ✅ Passed / ❌ Failed ([details])
- **Reverted:** [any features moved to sequential]
- **Next:** Group 2 / Sequential queue
```

### 6.5 Repeat for Remaining Groups

Continue through all parallel groups, then sequential queue.

---

## Step 7: Completion Report

After all work completes:

```markdown
## Resume Session Complete

**Executed:**
- Parallel Groups: [N]
- Subagents Spawned: [total]
- Sequential Items: [count]

**Results:**
- Features Completed: [list]
- Features Remaining: [list if any]
- Tests: ✅ All passing

**Build Progress:**
- Phase 1: ✅ Complete
- Phase 2: ✅ Complete (was in progress)
- Phase 3: 🔄 In Progress

**Time Savings:** ~[X]x faster than sequential

**Next Steps:**
[What to work on next, or "Build complete!"]
```

---

## Safety Rules

1. **Max 5 subagents** per parallel group - more causes diminishing returns
2. **Never parallelize same-file work** - causes merge conflicts
3. **Test after every group** - catch regressions early
4. **Inject context to every subagent** - they need governance/architecture
5. **Specific task assignments** - vague tasks produce vague results
6. **Update build plan progress** - track what's done
7. **Log subagent decisions** - preserve context for future sessions
8. **Revert on failure** - don't try to fix parallel failures in place

---

## Conflict Detection Patterns

### Always Sequential (File Conflicts):
- Multiple features touching same component
- Multiple features modifying same API route
- Multiple features adding to same database migration
- Multiple features updating same configuration

### Always Sequential (Dependencies):
- Feature B imports from Feature A
- Feature B uses API created by Feature A
- Feature B needs database table from Feature A
- Feature B extends component from Feature A

### Safe to Parallelize:
- Features in completely separate directories
- Features touching different API domains
- Features with no shared imports
- Independent UI components with no shared state

