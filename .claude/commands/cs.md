---
description: Save context before compaction - extracts decisions and updates progress files
allowed-tools: Read, Edit, Write, Bash(br:*), Bash(tail:*), Bash(date:*), Bash(ls:*), Bash(head:*)
---

# Context Preservation - Save Session State

Context is getting high. You MUST extract all decisions and update progress files NOW.

## Last Decision Timestamp

@.buildrunner/context/decisions.log

**Find the last timestamp above** - extract decisions made AFTER that time.

---

## Step 0: Check Log Size

First, check if decisions log needs rotation:

```bash
br decision status
```

If it shows "Rotation recommended", run:

```bash
br decision rotate
```

This archives old entries and keeps summaries, preventing memory bloat.

---

## YOUR TASK - EXECUTE IMMEDIATELY

### Step 1: Scan This Conversation

Review the ENTIRE conversation history still in your context. Look for ALL of these:

- **Architectural decisions** - chose X over Y because...
- **Bug fixes** - fixed X by doing Y
- **Design choices** - implemented X approach for Y reason
- **Trade-offs made** - sacrificed X for Y because...
- **Problems solved** - resolved X issue by...
- **Refactoring** - restructured X to improve Y
- **Debug insights** - discovered X was causing Y

### Step 2: Log EACH Decision

For EVERY decision found, run this command:

```bash
br decision log "description of decision" --type TYPE
```

**⚠️ CRITICAL: The command is `br decision log` (with "log" subcommand), NOT `br decision`**

**Types available:**
- `DECISION` - General architectural/design decisions
- `FIX` - Bug fixes and their solutions
- `ARCHITECTURE` - Structural/system design choices
- `REFACTOR` - Code restructuring decisions
- `DEBUG` - Debugging discoveries and root causes

**Examples:**
```bash
br decision log "Switched from REST to GraphQL for better type safety" --type ARCHITECTURE
br decision log "Fixed race condition in auth by adding mutex" --type FIX
br decision log "Removed unused EmotionalTrigger import" --type DEBUG
```

### Step 3: Update Current Work File

Edit `.buildrunner/context/current-work.md` with:

```markdown
# Current Work

Last updated: [TODAY'S DATE]

## Active Feature

[What feature/task is currently being worked on]

## Current Phase

[Planning / Building / Testing / Blocked]

## Files Being Modified

- [List key files currently being changed]

## Immediate Next Step

[The very next thing to do when resuming]
```

### Step 4: Update Progress File

Edit `claude-progress.txt` with:

```markdown
# Claude Progress File

*Last Updated: [TODAY'S DATE AND TIME]*

## Current Session

[Brief summary of what was accomplished this session]

## Last Session Summary

[Move previous "Current Session" content here]

## Active Feature

[Current feature being worked on]

## Where We Stopped

[Exact point where work stopped - file, function, line if relevant]

## Next Steps

1. [Immediate next action]
2. [Following action]
3. [etc.]

## Blockers

[Any blockers, or "None"]
```

### Step 5: Update Build Plan Progress

Find the current build plan:

```bash
ls -t .buildrunner/builds/BUILD_*.md 2>/dev/null | head -1
```

Read the build plan and update it with progress:

1. **Mark completed items** - Check off deliverables that were finished this session
2. **Update phase status** - Change phase status if applicable:
   - `not_started` → `in_progress` (if work began)
   - `in_progress` → `completed` (if phase finished)
3. **Add session notes** - Append to Technical Notes section:

```markdown
## Session Progress Log

### [TODAY'S DATE]
- Completed: [list items finished]
- In Progress: [current work]
- Blocked: [any blockers]
- Next: [immediate next steps]
```

4. **Update feature status** - For any features completed:
```bash
br feature update [FEATURE_ID] --status complete
```

### Step 6: Confirm Completion

Tell the user:

> "Context saved. Extracted [N] decisions. Updated:
> - current-work.md
> - claude-progress.txt
> - BUILD_[name].md ([X] items checked, phase status updated)
>
> Last decision: [SUMMARY]. Safe to /compact now."

---

**⚠️ CRITICAL: DO NOT ask what to do. EXECUTE these steps NOW.**

You have full conversation access RIGHT NOW. After compaction, details will be lost. Extract everything while you still can.
