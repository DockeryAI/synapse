# WEEK 1 BUILD STRATEGY - Security Migration
**Goal**: Complete Phase 1 (Immediate Security) + Start Phase 2 (Backend Proxy Migration)
**Timeline**: 5 working days
**Approach**: Parallel worktree execution for independent tasks

---

## Build Overview

### Day 1-2: Foundation (Sequential)
1. **ENV-CONFIG** - Update environment configuration and .env.example
2. **AI-PROXY** - Create universal AI proxy Edge Function

### Day 3-5: Service Migration (Parallel Worktrees)
3. **UVP-WIZARD** - Migrate UVP Wizard services (6 files)
4. **INDUSTRY** - Migrate Industry Detection services (4 files)
5. **INTELLIGENCE** - Migrate Intelligence services (2 files)
6. **SYNAPSE** - Migrate Synapse services (6 files)

---

## Task Execution Order

```
Day 1-2:
  [main] → ENV-CONFIG → merge → AI-PROXY → merge

Day 3-5 (Parallel):
  [main] → ├── UVP-WIZARD (worktree)
           ├── INDUSTRY (worktree)
           ├── INTELLIGENCE (worktree)
           └── SYNAPSE (worktree)

  All complete → Review → Merge all → Integration test
```

---

## 📋 TASK 1: ENV-CONFIG (Day 1)
**Branch**: `main` (direct)
**Duration**: 2-3 hours
**Dependencies**: None
**Safe to parallelize**: NO (affects all other tasks)

### Atomic Task List
```markdown
1. Backup current .env.example to .env.example.backup
2. Create new secure .env.example with correct VITE_ prefix patterns
3. Add comprehensive security comments explaining public vs private variables
4. Remove all VITE_ prefixed API keys except Supabase URL/anon key
5. Add all server-side API keys without VITE_ prefix
6. Create .env.template for Supabase Edge Function secrets
7. Update README.md with new environment setup instructions
8. Commit changes: "security: Update environment configuration with correct VITE_ patterns"
9. WAIT FOR REVIEW before proceeding
```

### Success Criteria
- [ ] .env.example contains ONLY 2 VITE_ API-related vars (SUPABASE_URL, SUPABASE_ANON_KEY)
- [ ] All sensitive keys have NO VITE_ prefix
- [ ] Security comments explain public vs private pattern
- [ ] README updated with setup instructions

---

## 📋 TASK 2: AI-PROXY (Day 1-2)
**Branch**: `feature/ai-proxy-edge-function`
**Duration**: 3-4 hours
**Dependencies**: ENV-CONFIG completed
**Safe to parallelize**: NO (other tasks depend on this)

### Atomic Task List
```markdown
1. Create worktree: `git worktree add worktrees/ai-proxy feature/ai-proxy-edge-function`
2. cd worktrees/ai-proxy
3. Create supabase/functions/ai-proxy/index.ts
4. Implement universal AI proxy supporting OpenRouter, Perplexity, OpenAI
5. Add proper error handling and logging
6. Add CORS headers for development and production domains
7. Create supabase/functions/ai-proxy/README.md with usage examples
8. Test locally: supabase functions serve ai-proxy
9. Deploy to Supabase: supabase functions deploy ai-proxy
10. Test deployed function with curl
11. Commit: "feat: Add universal AI proxy Edge Function for secure API calls"
12. Push branch
13. WAIT FOR REVIEW
14. After approval: Merge to main, delete worktree
```

### Success Criteria
- [ ] Edge Function deployed successfully
- [ ] Supports OpenRouter, Perplexity, OpenAI providers
- [ ] Returns proper error messages
- [ ] CORS configured correctly
- [ ] Test curl command succeeds

---

## 📋 TASK 3: UVP-WIZARD (Day 3-5)
**Branch**: `security/migrate-uvp-wizard`
**Worktree**: `worktrees/security-uvp`
**Duration**: 4-6 hours
**Dependencies**: AI-PROXY deployed
**Safe to parallelize**: YES

### Files to Migrate (6 files)
1. `src/components/uvp-wizard/UVPWizard.tsx`
2. `src/services/uvp-wizard/openrouter-ai.ts`
3. `src/services/uvp-wizard/website-analyzer.ts`
4. `src/services/uvp-wizard/rhodes-ai.ts`
5. `src/services/uvp-wizard/SmartUVPExtractor.ts`
6. `src/services/uvp-wizard/perplexity-api.ts`

### Atomic Task List
```markdown
1. Create worktree: `git worktree add worktrees/security-uvp security/migrate-uvp-wizard`
2. cd worktrees/security-uvp
3. Install dependencies if needed: npm install
4. For each file:
   a. Replace all `import.meta.env.VITE_OPENROUTER_API_KEY` references
   b. Replace fetch to openrouter.ai with fetch to ai-proxy Edge Function
   c. Update request format to match ai-proxy interface
   d. Add error handling for Edge Function failures
   e. Test the feature locally
5. Update any related TypeScript interfaces/types
6. Run type check: npm run typecheck
7. Run tests: npm test -- --run uvp
8. Test UVP Wizard UI manually in browser
9. Commit: "security: Migrate UVP Wizard services to Edge Function proxy"
10. Push branch
11. Create test report: echo "UVP Wizard migration test results" > TEST_RESULTS_UVP.md
12. WAIT FOR REVIEW
13. After approval: Merge to main, delete worktree
```

### Success Criteria
- [ ] Zero references to `VITE_OPENROUTER_API_KEY` in migrated files
- [ ] All UVP Wizard features work via Edge Function
- [ ] No console errors
- [ ] Type check passes
- [ ] Manual UI test confirms AI suggestions still generate

---

## 📋 TASK 4: INDUSTRY (Day 3-5)
**Branch**: `security/migrate-industry`
**Worktree**: `worktrees/security-industry`
**Duration**: 3-4 hours
**Dependencies**: AI-PROXY deployed
**Safe to parallelize**: YES

### Files to Migrate (4 files)
1. `src/services/industry/OnDemandProfileGeneration.ts`
2. `src/services/industry/IndustryProfileGenerator.service.ts`
3. `src/services/industry/NAICSDetector.service.ts`
4. `src/services/industry/IndustryCodeDetectionService.ts`

### Atomic Task List
```markdown
1. Create worktree: `git worktree add worktrees/security-industry security/migrate-industry`
2. cd worktrees/security-industry
3. Install dependencies if needed: npm install
4. For each file:
   a. Replace all `import.meta.env.VITE_OPENROUTER_API_KEY` references
   b. Replace fetch to openrouter.ai with fetch to ai-proxy Edge Function
   c. Update request format to match ai-proxy interface
   d. Add error handling for Edge Function failures
   e. Test the feature locally
5. Update any related TypeScript interfaces/types
6. Run type check: npm run typecheck
7. Run tests: npm test -- --run industry
8. Test industry detection manually in browser (onboarding flow)
9. Commit: "security: Migrate Industry Detection services to Edge Function proxy"
10. Push branch
11. Create test report: echo "Industry Detection migration test results" > TEST_RESULTS_INDUSTRY.md
12. WAIT FOR REVIEW
13. After approval: Merge to main, delete worktree
```

### Success Criteria
- [ ] Zero references to `VITE_OPENROUTER_API_KEY` in migrated files
- [ ] Industry detection works via Edge Function
- [ ] No console errors
- [ ] Type check passes
- [ ] Manual UI test confirms industry suggestions still generate

---

## 📋 TASK 5: INTELLIGENCE (Day 3-5)
**Branch**: `security/migrate-intelligence`
**Worktree**: `worktrees/security-intelligence`
**Duration**: 2-3 hours
**Dependencies**: AI-PROXY deployed
**Safe to parallelize**: YES

### Files to Migrate (2 files)
1. `src/services/intelligence/product-scanner.service.ts`
2. `src/services/intelligence/website-analyzer.service.ts`

### Atomic Task List
```markdown
1. Create worktree: `git worktree add worktrees/security-intelligence security/migrate-intelligence`
2. cd worktrees/security-intelligence
3. Install dependencies if needed: npm install
4. For each file:
   a. Replace all `import.meta.env.VITE_OPENROUTER_API_KEY` references
   b. Replace fetch to openrouter.ai with fetch to ai-proxy Edge Function
   c. Update request format to match ai-proxy interface
   d. Add error handling for Edge Function failures
   e. Test the feature locally
5. Update any related TypeScript interfaces/types
6. Run type check: npm run typecheck
7. Run tests: npm test -- --run intelligence
8. Test intelligence gathering manually
9. Commit: "security: Migrate Intelligence services to Edge Function proxy"
10. Push branch
11. Create test report: echo "Intelligence services migration test results" > TEST_RESULTS_INTELLIGENCE.md
12. WAIT FOR REVIEW
13. After approval: Merge to main, delete worktree
```

### Success Criteria
- [ ] Zero references to `VITE_OPENROUTER_API_KEY` in migrated files
- [ ] Intelligence services work via Edge Function
- [ ] No console errors
- [ ] Type check passes
- [ ] Manual test confirms website analysis still works

---

## 📋 TASK 6: SYNAPSE (Day 3-5)
**Branch**: `security/migrate-synapse`
**Worktree**: `worktrees/security-synapse`
**Duration**: 4-5 hours
**Dependencies**: AI-PROXY deployed
**Safe to parallelize**: YES

### Files to Migrate (6 files - excluding _ARCHIVED)
1. `src/services/synapse/SynapseGenerator.ts`
2. `src/services/synapse/analysis/ContrarianAngleDetector.ts`
3. `src/services/synapse/ConnectionDiscoveryEngine.ts`
4. `src/services/parallel-intelligence.service.ts`
5. `src/services/buyer-journey-ai.service.ts`
6. `src/lib/openrouter.ts`

### Atomic Task List
```markdown
1. Create worktree: `git worktree add worktrees/security-synapse security/migrate-synapse`
2. cd worktrees/security-synapse
3. Install dependencies if needed: npm install
4. For each file:
   a. Replace all `import.meta.env.VITE_OPENROUTER_API_KEY` references
   b. Replace fetch to openrouter.ai with fetch to ai-proxy Edge Function
   c. Update request format to match ai-proxy interface
   d. Add error handling for Edge Function failures
   e. Test the feature locally
5. Update any related TypeScript interfaces/types
6. Run type check: npm run typecheck
7. Run tests: npm test -- --run synapse
8. Test Synapse content generation manually in browser
9. Commit: "security: Migrate Synapse services to Edge Function proxy"
10. Push branch
11. Create test report: echo "Synapse services migration test results" > TEST_RESULTS_SYNAPSE.md
12. WAIT FOR REVIEW
13. After approval: Merge to main, delete worktree
```

### Success Criteria
- [ ] Zero references to `VITE_OPENROUTER_API_KEY` in migrated files
- [ ] Synapse content generation works via Edge Function
- [ ] No console errors
- [ ] Type check passes
- [ ] Manual UI test confirms campaign generation still works

---

## Integration Testing (After All Merges)

### Atomic Task List
```markdown
1. Switch to main branch: git checkout main
2. Pull all merged changes: git pull origin main
3. Clean install: rm -rf node_modules && npm install
4. Run full type check: npm run typecheck
5. Run all tests: npm test
6. Run E2E tests: npm run test:e2e
7. Build production bundle: npm run build
8. Security scan: grep -r "VITE_OPENROUTER\|sk-or-v1" dist/
9. Manual smoke test all features:
   - UVP Wizard generates suggestions
   - Industry detection works
   - Campaign generation works
   - Content suggestions appear
10. Check browser DevTools Network tab - verify all AI calls go to ai-proxy
11. Create final report: WEEK1_INTEGRATION_TEST_REPORT.md
12. Commit integration test results
13. Tag release: git tag security-migration-week1
14. Push tag: git push origin security-migration-week1
```

### Success Criteria
- [ ] All type checks pass
- [ ] All unit tests pass
- [ ] All E2E tests pass (33/33)
- [ ] Production build contains zero API keys
- [ ] All features work end-to-end
- [ ] No calls to openrouter.ai from browser
- [ ] No console errors

---

## Rollback Plan

If any task fails critically:

```bash
# Rollback specific worktree
cd worktrees/[worktree-name]
git reset --hard origin/main
git checkout main
git worktree remove worktrees/[worktree-name]
git branch -D [branch-name]

# Rollback entire week
git reset --hard origin/main
git worktree prune
rm -rf worktrees/*
git tag -d security-migration-week1
```

---

## Week 1 Deliverables

1. ✅ Secure .env.example configuration
2. ✅ Universal AI proxy Edge Function deployed
3. ✅ 18 files migrated to Edge Function proxy (UVP + Industry + Intelligence + Synapse)
4. ✅ All tests passing
5. ✅ Production bundle verified secure (zero leaked keys)
6. ✅ Integration test report
7. ✅ Git tag: security-migration-week1

---

## Next Week Preview (Week 2)

**Remaining Files**: 18 files (other services + archived code + type definitions)
**Focus**: Complete Phase 2, start Phase 3 (Environment Cleanup)
**Approach**: Continue parallel worktree strategy
