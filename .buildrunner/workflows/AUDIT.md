# BR3 First-Run Compliance Audit

**When:** First launch after `br attach` (skip if `.buildrunner/compliance_report.md` exists)

## Phase 1: Discovery

1. Read `.buildrunner/governance.yaml` completely
2. Audit codebase:
   - Security: SQL injection, XSS, secrets in code
   - Missing PRD headers
   - Test coverage gaps
   - Type hints missing
3. Database audit: RLS policies, indexes, connection security
4. Git audit: Secrets in history, .gitignore coverage

## Phase 2: Fix (on branch `br3-compliance-audit`)

Priority order:
1. **CRITICAL:** Security vulnerabilities
2. **HIGH:** Structure improvements (without moving files)
3. **MEDIUM:** Missing tests, type hints
4. **LOW:** Documentation

For each fix:
- Apply fix → Run tests → Commit if pass → Revert if fail

## Phase 3: Report

Create `.buildrunner/compliance_report.md` with:
- Before/after metrics
- Changes made
- Remaining manual tasks

## Safety Rules
- Test after EVERY change
- One fix per commit
- Never delete code unless provably unused
- Ask before directory restructuring
