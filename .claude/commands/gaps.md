---
description: Comprehensive gap detection and self-healing - analyzes build plan, detects issues, fixes them iteratively
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Gap Detection & Self-Healing

You are performing a comprehensive audit of the codebase against the current build plan.

---

## Step 1: Read Current Build Plan

@.buildrunner/builds/BUILD_synapse6.md

---

## Step 2: Determine Current Phase

Based on the build plan above, identify:
- Which phases are COMPLETE
- Which phase is IN PROGRESS
- Which phases are NOT STARTED

**Only check items up to and including the current phase.** Don't flag missing items from future phases.

---

## Step 3: Run Automated Detection Checks

Execute these checks and collect results:

### 3.1 TODOs/FIXMEs Left Behind
```bash
grep -rn "TODO\|FIXME\|HACK\|XXX" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -50
```

### 3.2 Stub Functions
```bash
grep -rn "throw.*[Nn]ot.*[Ii]mplement\|NotImplementedError\|// stub\|// TODO: implement" src/ --include="*.ts" --include="*.tsx" 2>/dev/null
```

### 3.3 TypeScript Errors
```bash
npx tsc --noEmit 2>&1 | head -50
```

### 3.4 Type Safety Violations
```bash
grep -rn "@ts-ignore\|@ts-expect-error\|: any\|as any" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -30
```

### 3.5 Console.logs in Production Code
```bash
grep -rn "console\.log\|console\.error\|console\.warn" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "// debug\|// TODO: remove" | head -30
```

### 3.6 Direct Database Calls in Frontend (Should Use Edge Functions)
```bash
grep -rn "supabase\.from\|\.from(" src/components src/app src/pages --include="*.tsx" 2>/dev/null | head -20
```

### 3.7 Components Not Connected to Routes
```bash
# List components that might be orphaned
ls src/components/**/*.tsx 2>/dev/null | head -20
```

### 3.8 Missing Error Handling
```bash
grep -rn "await.*fetch\|await.*supabase" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "try\|catch\|error" | head -20
```

### 3.9 Security: Exposed Secrets
```bash
grep -rn "sk_live\|sk_test\|apikey.*=.*['\"]" src/ --include="*.ts" --include="*.tsx" --include="*.env*" 2>/dev/null
```

### 3.10 LLM Model Changes (Unauthorized)
```bash
grep -rn "model.*=\|model:\|\"model\":" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -20
```

---

## Step 4: Check Build Plan Compliance

Compare what EXISTS in codebase vs what the build plan REQUIRES for completed phases:

For each completed phase in the build plan:
1. List required deliverables
2. Verify each exists in codebase
3. Flag any missing items as CRITICAL gaps

---

## Step 5: Run Tests

```bash
npm test 2>&1 | tail -50
```

Check for:
- Failing tests (CRITICAL)
- Missing test coverage for new features (HIGH)

---

## Step 6: Check RLS Policies (If Database Phase Complete)

If database schema exists, verify RLS:
```bash
# Check if RLS tests exist
ls supabase/tests/*.sql 2>/dev/null || ls tests/*rls* 2>/dev/null || echo "No RLS tests found"
```

---

## Step 7: Generate Gap Report

Create a prioritized report using this format:

```markdown
# Gap Report - Synapse V6
Generated: [current date/time]
Build Phase: [current phase from build plan]
Completeness Score: [calculate based on findings]

## Summary
- Critical: [count]
- High: [count]
- Medium: [count]
- Low: [count]

## 🔴 CRITICAL (Fix Immediately)

[For each critical gap:]
### [Gap Title]
- **File:** [path:line]
- **Issue:** [description]
- **Required by:** [which phase/requirement]
- **Fix:** [suggested action]

## 🟠 HIGH (Fix Soon)

[List high priority gaps]

## 🟡 MEDIUM (Fix Before Review)

[List medium priority gaps]

## 🟢 LOW (Nice to Have)

[List low priority gaps]

## Phase Compliance

| Phase | Status | Gaps |
|-------|--------|------|
| Phase 1 | ✓/✗ | [count] |
| Phase 2 | ✓/✗ | [count] |
...

## Action Plan

1. [First gap to fix - most critical]
2. [Second gap to fix]
3. [Continue in priority order]
```

---

## Step 8: Offer Self-Healing

After presenting the report, ask:

> "Found [N] gaps ([critical] critical, [high] high priority). Options:
>
> 1. **Fix all** - I'll work through gaps in priority order, testing after each fix
> 2. **Fix critical only** - Address only blocking issues
> 3. **Review first** - Let's discuss specific gaps before fixing
> 4. **Export report** - Save to .buildrunner/gap-report.md
>
> Which approach?"

---

## Step 9: Self-Healing Loop (If User Chooses Fix)

For each gap in priority order:

1. **Read** the affected file(s)
2. **Implement** the fix
3. **Run tests** to verify
4. **If tests pass:** Mark resolved, move to next gap
5. **If tests fail:**
   - Analyze failure
   - Try alternative fix (max 2 more attempts)
   - If still failing after 3 attempts: Document and skip, escalate to user

After fixing all gaps:
- Re-run full gap detection
- Compare before/after scores
- Report: "Resolved [X] gaps. Score improved from [Y] to [Z]. [Remaining issues if any]."

---

## Severity Classification

| Issue Type | Severity | Why |
|------------|----------|-----|
| Build plan requirement missing | CRITICAL | Blocks phase completion |
| Direct DB calls in frontend | CRITICAL | Security risk |
| RLS policy failures | CRITICAL | Data exposure risk |
| Failing tests | CRITICAL | Broken functionality |
| LLM model unauthorized change | CRITICAL | User explicitly chose model |
| Exposed secrets in code | CRITICAL | Security breach |
| Stub functions in completed phase | HIGH | Incomplete implementation |
| Components not connected | HIGH | Dead code |
| Missing error handling | HIGH | Poor UX, crashes |
| TypeScript errors | MEDIUM | Type safety |
| @ts-ignore usage | MEDIUM | Hidden type issues |
| TODO comments | MEDIUM | Technical debt |
| Console.logs | LOW | Clean code |
| Missing tests for new code | MEDIUM | Regression risk |

---

## Completeness Score Calculation

```
Score = (
  (Requirements Coverage × 0.25) +
  (Code Quality × 0.20) +
  (Integration × 0.20) +
  (Security × 0.20) +
  (Test Coverage × 0.15)
) × 100

Where:
- Requirements: % of build plan items implemented
- Code Quality: 100 - (TODOs + stubs + type errors) penalties
- Integration: % of components properly connected
- Security: RLS + no secrets + edge functions
- Test Coverage: % from test runner

Thresholds:
- 90+: Production ready ✅
- 70-89: Needs work ⚠️
- <70: Not ready ❌
```

---

## IMPORTANT RULES

1. **Phase-aware:** Only check up to current phase
2. **Be specific:** Include file paths and line numbers
3. **Prioritize correctly:** Critical = blocking/security, not just annoying
4. **Max 3 fix attempts:** Then escalate, don't spin forever
5. **Test after every fix:** Verify before moving on
6. **Track progress:** Update checklist as you go
7. **Re-run detection:** After fixes, confirm gaps resolved
