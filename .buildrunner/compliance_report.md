# BR3 Compliance Audit Report

**Project:** Synapse
**Audit Date:** 2025-12-03
**Auditor:** Roy (the burnt-out sysadmin)
**Safety Backup ID:** 20251203_092451
**Branch:** br3-compliance-audit

---

## Executive Summary

**Overall Compliance Score: 35/100** 🔴 CRITICAL

This codebase has some serious security issues that need immediate attention. I've seen kernel panics with more stability than this security posture.

### Critical Issues (Fix Immediately)
1. **29 files with hardcoded Supabase service keys** - Already committed to git history
2. **50 DISABLE RLS statements** across 18 migration files
3. **~5% test coverage** (24 active tests vs 1,093 source files)

### High Priority Issues
4. Massive tech debt with multiple version folders (v2, v4, v5)
5. 2.8MB of archived code still in src/_archive

### What's Working
- .env files properly gitignored ✅
- No direct external API calls in frontend ✅
- Basic directory structure follows React conventions ✅

---

## Phase 1: Discovery & Analysis

### 1.1 Governance Rules Scan

**Location:** `.buildrunner/governance/governance.yaml`

**Thresholds Defined:**
| Metric | Target | Current Status |
|--------|--------|----------------|
| Overall | 70 | ~35 (FAIL) |
| Structure | 60 | ~50 (FAIL) |
| Testing | 80 | ~5 (CRITICAL FAIL) |
| Documentation | 50 | Unknown |
| Security | 90 | ~20 (CRITICAL FAIL) |
| Performance | 60 | Unknown |

---

### 1.2 Security Audit - CRITICAL FINDINGS

#### 1.2.1 Hardcoded Service Keys (CRITICAL)

**29 files contain hardcoded Supabase JWT service keys:**

The following pattern was found across these files:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Affected Files:**
1. scripts/test-uvp-transform.mjs
2. scripts/full-uvp-check.mjs
3. scripts/test-data-flow.mjs
4. scripts/check-db.mjs
5. scripts/test-uvp-flow.mjs
6. scripts/verify-naics-update.mjs
7. scripts/test-fuzzy-matching.mjs
8. scripts/test-helper-function.mjs
9. scripts/test-profile-access.mjs
10. scripts/test-session-restoration.js
11. scripts/fix-sessions-directly.js
12. scripts/import-all-naics-codes.mjs
13. scripts/import-marba-profiles.mjs
14. scripts/find-missing-industries.mjs
15. scripts/fix-400-errors-now.mjs
16. scripts/check-latest-session.js
17. scripts/check-marba-profiles.js
18. scripts/check-marba-profiles.mjs
19. scripts/check-new-car-profile.mjs
20. scripts/check-profile-exists.mjs
21. scripts/check-tax-industries.mjs
22. scripts/apply-session-migration.js
23. scripts/check-new-profile-structure.ts
24. scripts/check-recent-profiles.ts
25. scripts/check-full-profile.ts
26. scripts/test-ai-proxy.ts
27. scripts/check-industry-profile.ts
28. scripts/apply-rls-onboarding.ts
29. scripts/execute-migrations.ts

**Risk Level:** CRITICAL
**Impact:** Anyone with git access can extract service keys and access/modify ALL data
**Already in Git History:** YES (committed in d0f4f732)

**Required Action:**
1. ROTATE ALL SUPABASE KEYS IMMEDIATELY in Supabase dashboard
2. Remove hardcoded keys from all 29 files
3. Use environment variables instead
4. Consider git history rewrite (BFG Repo-Cleaner) if repo is public

---

#### 1.2.2 Row Level Security Violations

**50 DISABLE ROW LEVEL SECURITY statements found across 18 migrations:**

| Migration File | Disable Count |
|---------------|---------------|
| 20251112000006_disable_rls_temporarily.sql | 7 |
| 20251112000007_force_schema_refresh.sql | 7 |
| 20251122000012_disable_rls_critical_tables.sql | 5 |
| 20251121145000_fix_uvp_sessions_rls.sql | 5 |
| 20251121180000_fix_all_406_and_400_errors.sql | 4 |
| 20251115210000_fix_rls_406_errors.sql | 3 |
| 20251120051645_force_create_tables.sql | 3 |
| 20251120051054_create_marba_uvps_table.sql | 3 |
| + 10 more files | Various |

**Tables with RLS Disabled:**
- brands
- marba_uvps
- brand_sessions
- uvp_sessions
- intelligence_cache
- value_statements
- uvp_components
- uvp_ab_tests
- brand_uvps
- industry_profiles
- location_detection_cache

**Risk Level:** HIGH
**Impact:** All data accessible without authentication

**Required Action:**
1. Create new migration to re-enable RLS on all tables
2. Create proper RLS policies that allow app functionality
3. Test thoroughly before deploying

---

### 1.3 Test Coverage Audit

**Test Files Found:** 57 total
- **Active Tests:** 24 files
- **Archived Tests:** 33 files (in src/_archive/)

**Source Files:** 1,093 TypeScript/TSX files

**Coverage Ratio:** ~2.2% (active tests only)

**Governance Target:** 80%
**Current Status:** CRITICAL FAIL

---

### 1.4 Directory Structure Analysis

**Framework:** React with TypeScript (Vite)

#### Problems Identified:

1. **Excessive Versioning (Major Tech Debt)**
   - Multiple parallel version folders: v2/, v4/, v5/
   - Version-suffixed files: *-v2.ts, *-v3.ts, *-v5.ts
   - Indicates incomplete migrations

2. **Large Archive Directory (2.8MB)**
   - src/_archive/ contains:
     - v2-components/
     - v2-hooks/
     - v2-services/
     - v2-tests/
     - v4-components/ (27 directories)
     - v4-services/ (19 directories)

3. **Duplicate Folder Structures**
   - layout/ AND layouts/
   - onboarding/ AND onboarding-v5/
   - campaign/, campaigns/, campaign-v3/, campaigns/v3/

4. **Intelligence Services Bloat**
   - 104 files in /src/services/intelligence/
   - No sub-categorization

5. **Services Sprawl**
   - 346 service files across 48+ directories

#### What's Working:
- UI components well-organized
- Type system comprehensive
- Config separation clean
- Path aliases (@/) configured

---

## Phase 2: Required Actions

### CRITICAL (Do within 24 hours)

#### Action 1: Rotate Supabase Keys
```
1. Go to Supabase Dashboard > Settings > API
2. Regenerate service_role key
3. Update .env with new key
4. Verify app still works
```

#### Action 2: Remove Hardcoded Secrets
Replace hardcoded keys in all 29 scripts with:
```javascript
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY required');
```

#### Action 3: Re-enable RLS
Create migration `20251204000001_reenable_rls_all_tables.sql`:
```sql
-- Re-enable RLS on all critical tables
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marba_uvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uvp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intelligence_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.value_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uvp_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uvp_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_uvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industry_profiles ENABLE ROW LEVEL SECURITY;

-- Then create proper policies for each table
```

### HIGH PRIORITY (Do within 1 week)

1. Add test coverage for critical paths
2. Consolidate version folders (pick V5, archive others to git)
3. Clean up src/_archive (move to git history)

### MEDIUM PRIORITY

1. Restructure intelligence services into sub-folders
2. Resolve duplicate folder structures
3. Add barrel exports (index.ts) to component folders

---

## Phase 3: Verification Checklist

After fixes are applied, verify:

- [ ] All Supabase keys rotated
- [ ] No hardcoded secrets in codebase (grep returns 0)
- [ ] RLS enabled on all tables (check via Supabase dashboard)
- [ ] App functionality unchanged
- [ ] Tests still pass
- [ ] Build succeeds

---

## Appendix A: Git Security

**.gitignore Status:** ✅ PASS
- .env properly ignored
- .env.local properly ignored

**Secrets in Git History:** ⚠️ YES
- Service keys committed in d0f4f732
- Consider BFG Repo-Cleaner if repo is public

---

## Appendix B: Metrics Summary

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Security Score | 90 | 20 | 🔴 FAIL |
| Test Coverage | 80% | 5% | 🔴 FAIL |
| Structure Score | 60 | 50 | 🟡 WARN |
| RLS Compliance | 100% | 0% | 🔴 FAIL |
| Secrets in Code | 0 | 29 files | 🔴 FAIL |

---

*Report generated by BR3 Compliance Audit*
*"The server's not down, it's just practicing mindfulness."*
