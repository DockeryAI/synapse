# WEEK 1 BUILD PROMPTS
**Security Migration - Atomic Task Execution**

---

## 📌 IMPORTANT: Execution Order

Run prompts in this exact order:
1. **PROMPT 1** (ENV-CONFIG) - MUST complete first
2. **PROMPT 2** (AI-PROXY) - MUST complete before parallel tasks
3. **PROMPTS 3-6** (Parallel) - Run simultaneously after Prompt 2 completes

---

## 🚀 PROMPT 1: ENV-CONFIG (Day 1 - Sequential)
**Estimated Time**: 2-3 hours
**Prerequisites**: None

```
Execute TASK 1: ENV-CONFIG from WEEK1_BUILD_STRATEGY.md. Follow the atomic task list exactly. Create secure .env.example with correct VITE_ prefix patterns per SECURITY_AUDIT_REPORT.md Phase 3.1. Remove all VITE_ prefixed API keys except Supabase public vars. Add comprehensive security comments. Update README.md setup instructions. Commit with message "security: Update environment configuration with correct VITE_ patterns". WAIT for my review before proceeding.
```

**Review Checklist**:
- [ ] .env.example has ONLY VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- [ ] All sensitive keys removed from VITE_ prefix
- [ ] Security comments explain public vs private pattern
- [ ] README updated

---

## 🚀 PROMPT 2: AI-PROXY (Day 1-2 - Sequential)
**Estimated Time**: 3-4 hours
**Prerequisites**: PROMPT 1 completed and merged

```
Execute TASK 2: AI-PROXY from WEEK1_BUILD_STRATEGY.md. Create worktree worktrees/ai-proxy on branch feature/ai-proxy-edge-function. Build universal AI proxy Edge Function at supabase/functions/ai-proxy/index.ts supporting OpenRouter, Perplexity, and OpenAI per SECURITY_AUDIT_REPORT.md Phase 2.1. Include error handling, CORS, logging. Test locally with supabase functions serve. Deploy with supabase functions deploy ai-proxy. Create README with usage examples. Commit "feat: Add universal AI proxy Edge Function for secure API calls". Push branch and WAIT for my review.
```

**Review Checklist**:
- [ ] Edge Function deployed successfully to Supabase
- [ ] Supports all 3 providers (OpenRouter, Perplexity, OpenAI)
- [ ] CORS configured for development and production
- [ ] Test curl command succeeds
- [ ] README has clear usage examples

---

## 🚀 PROMPT 3: UVP-WIZARD (Day 3-5 - Parallel)
**Estimated Time**: 4-6 hours
**Prerequisites**: PROMPT 2 completed and merged

```
Execute TASK 3: UVP-WIZARD from WEEK1_BUILD_STRATEGY.md. Create worktree worktrees/security-uvp on branch security/migrate-uvp-wizard. Migrate 6 UVP Wizard files to use ai-proxy Edge Function. Replace all VITE_OPENROUTER_API_KEY references with fetch to ${VITE_SUPABASE_URL}/functions/v1/ai-proxy. Update request format per ai-proxy interface. Run type check, tests, manual UI test. Commit "security: Migrate UVP Wizard services to Edge Function proxy". Create TEST_RESULTS_UVP.md. Push and WAIT for review.
```

---

## 🚀 PROMPT 4: INDUSTRY (Day 3-5 - Parallel)
**Estimated Time**: 3-4 hours
**Prerequisites**: PROMPT 2 completed and merged

```
Execute TASK 4: INDUSTRY from WEEK1_BUILD_STRATEGY.md. Create worktree worktrees/security-industry on branch security/migrate-industry. Migrate 4 Industry Detection service files to use ai-proxy Edge Function. Replace all VITE_OPENROUTER_API_KEY with Edge Function calls. Test industry detection in onboarding flow. Run type check and tests. Commit "security: Migrate Industry Detection services to Edge Function proxy". Create TEST_RESULTS_INDUSTRY.md. Push and WAIT for review.
```

---

## 🚀 PROMPT 5: INTELLIGENCE (Day 3-5 - Parallel)
**Estimated Time**: 2-3 hours
**Prerequisites**: PROMPT 2 completed and merged

```
Execute TASK 5: INTELLIGENCE from WEEK1_BUILD_STRATEGY.md. Create worktree worktrees/security-intelligence on branch security/migrate-intelligence. Migrate 2 Intelligence service files to use ai-proxy Edge Function. Replace all VITE_OPENROUTER_API_KEY with Edge Function calls. Test website analysis features. Run type check and tests. Commit "security: Migrate Intelligence services to Edge Function proxy". Create TEST_RESULTS_INTELLIGENCE.md. Push and WAIT for review.
```

---

## 🚀 PROMPT 6: SYNAPSE (Day 3-5 - Parallel)
**Estimated Time**: 4-5 hours
**Prerequisites**: PROMPT 2 completed and merged

```
Execute TASK 6: SYNAPSE from WEEK1_BUILD_STRATEGY.md. Create worktree worktrees/security-synapse on branch security/migrate-synapse. Migrate 6 Synapse service files (excluding _ARCHIVED) to use ai-proxy Edge Function. Replace all VITE_OPENROUTER_API_KEY with Edge Function calls. Test campaign generation in UI. Run type check and tests. Commit "security: Migrate Synapse services to Edge Function proxy". Create TEST_RESULTS_SYNAPSE.md. Push and WAIT for review.
```

---

## 🔄 POST-MERGE INTEGRATION TEST
**Run after all 6 tasks reviewed and merged**

```
Execute Integration Testing from WEEK1_BUILD_STRATEGY.md. Switch to main, pull all merges. Clean install dependencies. Run full type check, all tests, E2E tests. Build production bundle. Security scan dist/ for leaked keys. Manual smoke test: UVP Wizard, industry detection, campaign generation. Verify browser Network tab shows all AI calls to ai-proxy not openrouter.ai. Create WEEK1_INTEGRATION_TEST_REPORT.md. Tag release security-migration-week1 and push.
```

**Final Verification**:
- [ ] All type checks pass
- [ ] All unit tests pass
- [ ] All E2E tests pass (33/33)
- [ ] `grep -r "VITE_OPENROUTER\|sk-or-v1" dist/` returns empty
- [ ] All features work end-to-end
- [ ] No calls to openrouter.ai from browser
- [ ] No console errors

---

## 📊 MONITORING DASHBOARD

I will monitor builds automatically and notify you when:
- ✅ Build completes successfully → Ready for your review
- ⚠️ Build encounters errors → Requires your attention
- 🔄 Build is still in progress → Status update every 30 min

After you approve each build, I will:
1. Run additional integration tests
2. Merge branch to main
3. Delete worktree
4. Update build tracker
5. Provide next prompt if all parallel tasks complete

---

## 🎯 WEEK 1 EXECUTION PLAN

### Day 1-2 (Sequential)
```bash
# You run:
PROMPT 1  → I monitor → You review → I merge → PROMPT 2 → I monitor → You review → I merge
```

### Day 3-5 (Parallel - Run all 4 simultaneously)
```bash
# You run:
PROMPT 3 (in new Claude Code window)
PROMPT 4 (in new Claude Code window)
PROMPT 5 (in new Claude Code window)
PROMPT 6 (in new Claude Code window)

# I monitor all 4 builds → Notify you when complete → You review all 4 → I merge all 4
```

### Integration Test
```bash
# After all merges:
POST-MERGE INTEGRATION TEST → I monitor → You review → I tag release
```

---

## ✅ SUCCESS METRICS

**Week 1 Complete When**:
- [x] 18 files migrated (6 + 4 + 2 + 6)
- [x] 8 Edge Function deployed (1 new ai-proxy + 7 existing)
- [x] Zero VITE_OPENROUTER_API_KEY in migrated files
- [x] All 33 E2E tests passing
- [x] Production bundle verified secure
- [x] Git tag: security-migration-week1 pushed

**Deliverables**:
1. Secure .env.example
2. AI proxy Edge Function
3. 4 test reports (UVP, Industry, Intelligence, Synapse)
4. Integration test report
5. Git tag with all changes

---

## 🆘 IF SOMETHING FAILS

**Build fails during execution**:
```
Stop the build. Check error logs. Report to me. I'll assess if we need to rollback or fix.
```

**Test failures after merge**:
```
git revert HEAD
Analyze failure
Create fix in new worktree
Re-test before re-merging
```

**Critical issue found in production bundle**:
```
git reset --hard [last-known-good-commit]
Review SECURITY_AUDIT_REPORT.md Phase 4.1 security scan steps
Identify leak source
Fix before proceeding
```

---

## 📝 NEXT STEPS FOR YOU

1. **Read** SECURITY_AUDIT_REPORT.md to understand the security issues
2. **Review** WEEK1_BUILD_STRATEGY.md to understand the plan
3. **Run PROMPT 1** in Claude Code when ready to begin
4. **Wait for my notification** that build is complete
5. **Review the changes** (I'll provide summary)
6. **Approve merge** or request changes
7. **Repeat for PROMPT 2**
8. **Run PROMPTS 3-6 in parallel** (4 separate Claude Code windows)
9. **Review all 4** when I notify they're complete
10. **Approve all merges**
11. **Run POST-MERGE TEST**
12. **Celebrate Week 1 completion** 🎉

---

**Ready to begin?**

Say: **"Start Week 1 Build"** and I'll guide you through PROMPT 1.
