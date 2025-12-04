---
description: Gap detection with safeguards - analyzes build plan, reports issues, fixes only with confirmation
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Gap Detection & Self-Healing

**⚠️ SAFETY-FIRST GAP ANALYSIS**

---

## CRITICAL SAFEGUARDS (READ FIRST)

### Rule 1: Verify App Loads BEFORE Any Fixes
```bash
# For JS/TS projects
npm run dev &
sleep 5
curl -s http://localhost:3000 > /dev/null && echo "✅ App loads" || echo "❌ App broken - DO NOT proceed with fixes"
kill %1 2>/dev/null
```

**If app doesn't load: STOP. Do not run gap fixes. Help user restore working state first.**

### Rule 2: Report-Only by Default
- Default mode is **REPORT ONLY** - no automatic fixes
- User must explicitly say "fix" to enable any changes
- Always ask before fixing anything

### Rule 3: Maximum 2 Fix Rounds Per Session
- After 2 rounds of fixes, STOP and verify app still works
- If issues remain after 2 rounds, escalate to user - don't keep fixing

### Rule 4: Only Fix CRITICAL Issues Automatically
- **CRITICAL** = Security breaches, build failures, app won't start
- **Everything else** = Report only, ask user before fixing

### Rule 5: Ignore Cosmetic Issues
These are NOT gaps - do not report or fix:
- TODOs in working code
- Console.logs that don't break anything
- TypeScript warnings (not errors)
- Code style issues
- "Could be better" suggestions

---

## Step 1: Verify App Health First

**BEFORE any analysis, confirm the app works:**

```bash
# Check if dev server starts
timeout 10 npm run dev 2>&1 | head -20 || timeout 10 npm start 2>&1 | head -20
```

```bash
# Check for build errors
npm run build 2>&1 | tail -20 || npx tsc --noEmit 2>&1 | head -30
```

**If either fails with real errors (not warnings):**
> "⚠️ App has build errors. Fixing those first before gap analysis. Do you want me to focus on build errors only?"

**If app builds successfully:**
> "✅ App builds successfully. Proceeding with gap analysis in REPORT-ONLY mode."

---

## Step 2: Find Current Build Plan

```bash
ls -t .buildrunner/builds/BUILD_*.md 2>/dev/null | head -1
```

Read the build plan to understand what phase we're in.

---

## Step 3: Run MINIMAL Detection Checks

**Only check for REAL problems, not perfectionism:**

### 3.1 Build-Breaking Errors Only
```bash
# TypeScript ERRORS only (not warnings)
npx tsc --noEmit 2>&1 | grep -E "^src/.*error TS" | head -20
```

### 3.2 Security Issues (CRITICAL)
```bash
# Exposed secrets
grep -rn "sk_live\|sk_test\|apikey.*=.*['\"][a-zA-Z0-9]" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "process.env\|import.meta.env"
```

### 3.3 Failing Tests (CRITICAL)
```bash
npm test 2>&1 | grep -E "FAIL|Error:|failed" | head -20
```

### 3.4 Missing Build Plan Requirements (CRITICAL)
Compare completed phases against what actually exists in code.

---

## Step 4: Generate CONCISE Gap Report

```markdown
# Gap Report - [Project Name]

## App Health: ✅ Builds / ❌ Broken

## Summary
- 🔴 CRITICAL (must fix): [count]
- 🟡 Should fix: [count]
- ⚪ Cosmetic (ignore): [count]

## 🔴 CRITICAL Issues (Blocking)

[Only list issues that BREAK the app or are security risks]

### Issue 1: [Title]
- **File:** [path:line]
- **Why critical:** [app won't start / security risk / tests fail]
- **Fix:** [specific action]

## 🟡 Should Fix (Not Blocking)

[Issues worth fixing but app works without them]

## ⚪ Cosmetic (Ignored)

[List count only - do not fix these]
- TODOs: [X] found (not blocking)
- Console.logs: [X] found (not blocking)
- Type warnings: [X] found (not errors)
```

---

## Step 5: Present Options (ALWAYS ASK)

> "**Gap Analysis Complete**
>
> **App Status:** ✅ Working / ❌ Broken
>
> **Found:**
> - 🔴 [X] critical issues (blocking)
> - 🟡 [Y] should-fix issues (not blocking)
> - ⚪ [Z] cosmetic issues (ignoring)
>
> **Options:**
> 1. **Fix critical only** - Just the [X] blocking issues
> 2. **Report only** - Save report, fix nothing (default)
> 3. **Review each** - Go through issues one by one
>
> **What would you like to do?**"

**DO NOT offer "fix all" option.** That's what caused the problem.

---

## Step 6: Fix Mode (Only If User Confirms)

### Before EACH Fix:
1. Read the file
2. Show the specific change
3. Ask: "Apply this fix? (yes/no)"

### After EACH Fix:
1. Verify app still builds: `npm run build` or `npx tsc --noEmit`
2. If build fails: **IMMEDIATELY REVERT** and stop
3. If build passes: Continue to next fix

### After ALL Fixes (Max 2 Rounds):
1. Verify app loads in browser
2. Run tests
3. Report what was fixed
4. **STOP** - do not start another round automatically

---

## Step 7: Completion Report

```markdown
## Fix Session Complete

**Rounds:** [1-2] of 2 max
**App Status:** ✅ Still working / ❌ Broken (reverted)

**Fixed:**
- [List specific fixes made]

**Not Fixed (by design):**
- [X] cosmetic issues (TODOs, console.logs)
- [Y] warnings that don't break anything

**Remaining Critical:** [0 or list]

**Next Steps:**
- Test the app manually
- If issues found, run /gaps again (counts as new session)
```

---

## Severity Classification (STRICT)

| Issue | Severity | Auto-Fix? |
|-------|----------|-----------|
| App won't build | 🔴 CRITICAL | Ask first |
| App won't start | 🔴 CRITICAL | Ask first |
| Exposed secrets | 🔴 CRITICAL | Ask first |
| Failing tests | 🔴 CRITICAL | Ask first |
| Security vulnerabilities | 🔴 CRITICAL | Ask first |
| Missing required feature | 🟡 SHOULD FIX | Report only |
| TypeScript errors (real) | 🟡 SHOULD FIX | Report only |
| Missing error handling | 🟡 SHOULD FIX | Report only |
| TypeScript warnings | ⚪ COSMETIC | **IGNORE** |
| TODOs | ⚪ COSMETIC | **IGNORE** |
| Console.logs | ⚪ COSMETIC | **IGNORE** |
| @ts-ignore | ⚪ COSMETIC | **IGNORE** |
| Code style | ⚪ COSMETIC | **IGNORE** |

---

## ABSOLUTE RULES

1. **App health first** - Verify it works before touching anything
2. **Report by default** - Never auto-fix without explicit permission
3. **Max 2 rounds** - Stop after 2 fix rounds, reassess
4. **Revert on break** - If any fix breaks the build, revert immediately
5. **Ignore cosmetic** - TODOs, console.logs, warnings are NOT gaps
6. **Ask before each fix** - No batch fixing without confirmation
7. **Critical only by default** - Only offer to fix blocking issues

---

## What This Command Does NOT Do

- ❌ Auto-fix hundreds of issues
- ❌ Chase perfectionism
- ❌ Fix cosmetic issues
- ❌ Run multiple rounds without checking app health
- ❌ Treat warnings as errors
- ❌ Break working code to make it "cleaner"

---

## Emergency: App Broken After Fixes

If app stopped working after gap fixes:

```bash
# Check git status
git status

# Revert all uncommitted changes
git checkout -- .

# Or revert to last commit
git reset --hard HEAD
```

Then tell user: "Reverted changes. App should work again. Let's be more careful with fixes."
