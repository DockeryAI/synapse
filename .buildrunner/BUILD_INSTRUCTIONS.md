# BUILD INSTRUCTIONS
## Mandatory Rules for All Implementation Sessions

**Created**: November 26, 2025
**Applies To**: IMPROVED_CONTENT_CORRELATION_PLAN.md
**Status**: ACTIVE - Reference at start of EVERY session

---

## SESSION START PROTOCOL

Every Claude session MUST begin with:

1. **Read this file** (`BUILD_INSTRUCTIONS.md`)
2. **Read current phase file** (e.g., `PHASE_A_FIX_CORE.md`)
3. **Read relevant source files** before any edits
4. **State**: "Working on Item #X: [Task Name]"
5. **Verify**: Current item status and last checkpoint

---

## CRITICAL SAFETY RULES

### Rule 1: NO API KEYS IN CODE
- **NEVER** expose API keys, secrets, or credentials in source code
- All API calls go through Supabase Edge Functions
- Use `import.meta.env.VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` only
- If you see an API key in code, STOP and report it

### Rule 2: READ BEFORE WRITE
- **ALWAYS** read the full file before making any edits
- Understand existing patterns, imports, and dependencies
- Identify what functions/methods already exist
- Never assume - verify current implementation first

### Rule 3: INTEGRATE, DON'T REDESIGN
- Work within the current architecture
- Add new methods, don't replace working ones
- Extend existing patterns, don't introduce new paradigms
- If tempted to "refactor" - STOP and ask first

### Rule 4: ONE ITEM AT A TIME
- Complete one atomic task before starting the next
- Run build after EVERY file change
- Commit after EVERY completed item
- Never batch multiple items without testing between

### Rule 5: PROTECT EXISTING FEATURES
- Before editing a file, note all existing exports/functions
- After editing, verify all original exports still work
- Never delete code unless explicitly part of the task
- If unsure whether something is used - assume it IS used

---

## FILE PROTECTION LIST

These files are HIGH RISK - extra caution required:

| File | Risk Level | Approach |
|------|------------|----------|
| `streaming-deepcontext-builder.service.ts` | CRITICAL | Add methods, don't modify existing |
| `DashboardPage.tsx` | HIGH | Minimal changes, test thoroughly |
| `connection-discovery.service.ts` | HIGH | Extend, don't refactor |
| `PowerMode.tsx` | HIGH | UI changes only if necessary |
| `InsightGrid.tsx` | MEDIUM | Careful with data flow |
| `marba-uvp.service.ts` | HIGH | UVP is working - don't break it |

---

## CODE REVIEW CHECKLIST (Before Starting Each Item)

- [ ] Read all files listed in "Files to Read First"
- [ ] Identify existing function signatures
- [ ] Note current import structure
- [ ] Understand data flow (where does data come from/go to?)
- [ ] Check for existing similar functionality (don't duplicate)
- [ ] Verify no hardcoded API keys or secrets

---

## UVP SYSTEM INTEGRATION

All changes must integrate with the existing UVP flow:

```
OnboardingPageV5.tsx → UVP Synthesis → marba_uvps table
                                            ↓
DashboardPage.tsx ← loads UVP → streaming-deepcontext-builder.service.ts
                                            ↓
                                   API calls with UVP context
                                            ↓
                                   InsightGrid.tsx / PowerMode.tsx
```

**Key Files to Understand**:
- `src/pages/OnboardingPageV5.tsx` - UVP creation flow
- `src/services/database/marba-uvp.service.ts` - UVP persistence
- `src/types/uvp-flow.types.ts` - UVP data structures
- `src/types/synapse/deepContext.types.ts` - Intelligence types

---

## COMMIT CONVENTIONS

Format: `feat(correlation): Item #X - [brief description]`

Examples:
- `feat(correlation): Item #1 - Fix UVP timing in streaming builder`
- `feat(correlation): Item #5 - Integrate Reddit pain point mining`

Always include:
```
🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## VERIFICATION COMMANDS

After every change:
```bash
npm run build          # Must pass - no exceptions
```

Before committing:
```bash
git diff               # Review all changes
git status             # Verify correct files staged
```

---

## ROLLBACK PROCEDURES

If something breaks:

1. **Immediate**: `git checkout -- [file]` to revert single file
2. **Item-level**: `git revert [commit]` for last commit
3. **Phase-level**: `git reset --hard pre-correlation-enhancement` (tag)

**Before starting Phase A**, create safety tag:
```bash
git tag pre-correlation-enhancement
```

---

## SESSION END PROTOCOL

Every session MUST end with:

1. **Update phase file** - Mark item status (COMPLETE/IN PROGRESS)
2. **Commit changes** - With proper format
3. **Run build** - Verify still passing
4. **Note next item** - What's next in the phase file
5. **Report summary** - What was done, what's remaining

---

## RED FLAGS - STOP AND ASK

If you encounter any of these, STOP and ask before proceeding:

- [ ] Need to modify more than 3 files for one item
- [ ] Existing tests are failing
- [ ] Import structure needs significant changes
- [ ] Feature seems to require redesigning existing code
- [ ] Unsure if something is used elsewhere
- [ ] Task seems larger than expected
- [ ] Found API keys or secrets in code

---

## FORBIDDEN ACTIONS

- ❌ Deleting exports without verifying they're unused
- ❌ Changing function signatures of existing methods
- ❌ Introducing new dependencies without asking
- ❌ Modifying database schema
- ❌ Changing authentication/authorization logic
- ❌ Exposing any API keys in client code
- ❌ Skipping build verification
- ❌ Batching multiple items in one commit

---

*These instructions are MANDATORY for all implementation sessions.*
*Violating these rules risks breaking production code.*
