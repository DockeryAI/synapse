# Worktree Workflow & Merge Safety

**Purpose:** Prevent lost work by ensuring all feature branches are merged before new development

---

## The Problem

When working with git worktrees for parallel development, it's easy to:
- Create feature branches with significant work
- Forget to merge them back to main
- Start new work assuming everything is integrated
- **Lose track of completed but unmerged features**

**Real Example:** We almost lost 2,362 lines of completed campaign generation integration because `feature/campaign-generation-pipeline` wasn't merged!

---

## The Solution: Pre-Phase Checklist

**ALWAYS run this before starting a new development phase:**

```bash
./scripts/check-unmerged-work.sh
```

This script:
- ✅ Checks all feature branches for unmerged commits
- ✅ Shows what files were changed
- ✅ Provides merge commands
- ✅ Blocks if unmerged work is found

---

## Workflow Rules

### Rule 1: Check Before Starting
**Before ANY new phase/prompt/development:**

```bash
# 1. Check for unmerged work
./scripts/check-unmerged-work.sh

# 2. If unmerged work found, merge it
git merge feature/branch-name --no-ff

# 3. Fix any merge conflicts

# 4. Re-run check
./scripts/check-unmerged-work.sh

# 5. Only proceed when script exits 0
```

### Rule 2: Document Worktree Status
When creating worktrees, document them in `WORKTREE_STATUS.md`:

```markdown
## Active Worktrees

| Branch | Purpose | Files Changed | Status |
|--------|---------|---------------|--------|
| feature/campaign-gen | Campaign integration | 6 | ⚠️ NOT MERGED |
| feature/analytics | Analytics tracking | 3 | ✅ MERGED |
```

### Rule 3: Merge Frequently
Don't let branches get stale:
- Merge to main when feature is complete
- Don't wait for "perfect" code
- Fix issues in follow-up commits
- Tag merged commits for tracking

### Rule 4: Delete After Merge
After successful merge:

```bash
# 1. Verify merge
git log main..feature/branch-name
# Should show nothing

# 2. Tag the merge
git tag feature-branch-name-merged

# 3. Delete the branch
git branch -d feature/branch-name

# 4. Remove worktree
git worktree remove worktrees/branch-name
```

---

## Integration Checklist

Before starting ANY new integration work:

- [ ] Run `./scripts/check-unmerged-work.sh`
- [ ] Review all branches marked as unmerged
- [ ] Decide: merge now or skip?
- [ ] If merging: resolve conflicts, test, commit
- [ ] If skipping: document why in WORKTREE_STATUS.md
- [ ] Re-run check script until it passes
- [ ] THEN proceed with new work

---

## Current Status Commands

**Check what branches exist:**
```bash
git branch --all | grep feature
```

**Check what's merged:**
```bash
git branch --merged main | grep feature
```

**Check what's NOT merged:**
```bash
git branch --no-merged main | grep feature
```

**See unmerged commits in a branch:**
```bash
git log main..feature/branch-name --oneline
```

**See files changed in a branch:**
```bash
git diff --name-only main...feature/branch-name
```

---

## Emergency Recovery

If you discover unmerged work AFTER starting new development:

### Option A: Merge Immediately
```bash
# 1. Commit current work
git stash

# 2. Merge the old branch
git merge feature/old-branch --no-ff

# 3. Fix conflicts (keep both changes)
git add .
git commit

# 4. Re-apply current work
git stash pop

# 5. Fix any new conflicts
git add .
git commit
```

### Option B: Merge into New Branch
```bash
# 1. Create integration branch
git checkout -b integration/merge-old-work

# 2. Merge old branch
git merge feature/old-branch --no-ff

# 3. Fix conflicts

# 4. Test thoroughly

# 5. Merge back to main
git checkout main
git merge integration/merge-old-work --no-ff
```

---

## Automation

Add to git hooks for extra safety:

**`.git/hooks/pre-push`**
```bash
#!/bin/bash
# Run unmerged work check before pushing

./scripts/check-unmerged-work.sh
exit_code=$?

if [ $exit_code -ne 0 ]; then
  echo ""
  echo "❌ Push blocked: Unmerged work detected"
  echo "Run: ./scripts/check-unmerged-work.sh"
  exit 1
fi

exit 0
```

---

## Best Practices

1. **Small, focused branches** - Easier to merge
2. **Merge often** - Don't let work accumulate
3. **Test after merge** - Catch conflicts early
4. **Tag merges** - Track what's been integrated
5. **Clean up** - Delete merged branches
6. **Check before starting** - Always run the script
7. **Document** - Keep WORKTREE_STATUS.md updated

---

## Common Mistakes to Avoid

❌ **Don't:** Start new work without checking
❌ **Don't:** Assume branches are merged
❌ **Don't:** Let branches sit unmerged for days
❌ **Don't:** Skip the pre-phase checklist
❌ **Don't:** Ignore the check script output

✅ **Do:** Run check script before every phase
✅ **Do:** Merge work as soon as it's testable
✅ **Do:** Document worktree status
✅ **Do:** Clean up after merging
✅ **Do:** Use tags to track merges

---

## Quick Reference

**Before starting new work:**
```bash
./scripts/check-unmerged-work.sh && echo "✅ Safe to proceed"
```

**To merge a branch:**
```bash
git merge feature/branch-name --no-ff
git tag feature-branch-name-merged
git push origin main --tags
```

**To check a specific branch:**
```bash
git log main..feature/branch-name --oneline
```

**To see changes in a branch:**
```bash
git diff main...feature/branch-name --stat
```

---

**Remember:** 5 minutes of checking can save hours of lost work! 🛡️
