---
description: Load all session context - decisions, progress, build plans, governance, and project background
allowed-tools: Read, Bash(br:*), Bash(tail:*), Bash(cat:*), Glob, Grep
---

# Session Context Loading

You are starting or resuming a session. Read and process ALL context files below.

---

## 0. CLAUDE.md (Project Instructions)

@CLAUDE.md

---

## 1. PROJECT BACKGROUND & LESSONS LEARNED

@.buildrunner/context/additional-context.md

---

## 2. RECENT DECISIONS

@.buildrunner/context/decisions.log

---

## 3. SESSION PROGRESS

@claude-progress.txt

---

## 4. CURRENT WORK STATUS

@.buildrunner/context/current-work.md

---

## 5. ACTIVE BLOCKERS

@.buildrunner/context/blockers.md

---

## 6. VISION

@.buildrunner/VISION.md

---

## 7. ARCHITECTURE

@.buildrunner/ARCHITECTURE.md

---

## 8. GOVERNANCE RULES

@.buildrunner/governance.yaml

---

## 9. BUILD PLANS

After reading all files above, run this command to see build plans:
```
br build plans
```

---

## 10. FEATURE STATUS

After reading all files above, run this command to see features:
```
br feature list
```

---

## 11. BLOCKED LIBRARIES (from CLAUDE.md)

These UI libraries are FORBIDDEN - use ~/Projects/ui-libraries/ instead:
- @chakra-ui, @mui/material, antd, @nextui-org, @mantine, @headlessui, react-bootstrap

---

## 12. KEY CONSTRAINTS

- **RLS Required**: Never disable Row Level Security
- **Integration Verification**: Features must be end-to-end connected before complete
- **Model Changes**: Never change LLM model without user permission
- **No Direct API Calls**: Frontend must use edge functions, not direct API calls

---

## YOUR TASK

After reading ALL the content above:

1. **Run `br build plans`** to see current build plans
2. **Run `br feature list`** to see feature status
3. **Identify the current build plan** - which one is marked as current?
4. **Note the last decision** - what was the most recent logged decision?
5. **Understand blockers** - are there any active blockers?
6. **Check progress** - what was the last session working on?
7. **Review governance** - what rules apply to current work?

Then **announce your understanding** to the user:

> "Session loaded. Current build: [BUILD_NAME]. Last decision: [DECISION]. [BLOCKERS if any]. Governance: [KEY_RULES]. Ready to continue with [NEXT_TASK]."

**DO NOT** just say "context loaded" - demonstrate you understand the project state by summarizing what you read.
