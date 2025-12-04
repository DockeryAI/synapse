# Directory Restructuring Workflow

**Trigger:** User types `directory`

## Step 1: Analysis

1. Detect framework (React, Vue, etc.)
2. Map current structure vs best practices
3. Identify misplaced files
4. Map all import dependencies

## Step 2: Report & Approval

Present findings, then ask:
> "Restructure directories? (high risk) [yes/no]"

If NO: Save report to `.buildrunner/directory_analysis.md`, stop.
If YES: Continue.

## Step 3: Restructure (branch: `directory-restructure`)

For each file move (max 3-5 at a time):
1. Grep for all references
2. Move file(s)
3. Update ALL imports immediately
4. Update configs (tsconfig, webpack, vite)
5. Run tests
6. Commit
7. If tests fail: Revert, try different approach

**Checkpoint every 5 moves:** Ask user to continue.

## Step 4: Final validation

Full test suite + build verification.

## Safety Rules
- Never move all files at once
- Test after EVERY move
- Update paths BEFORE next move
- Revert on failure, don't fix in place
