# Git Worktree Strategy - Parallel Development

**Last Updated:** 2025-11-15

---

## Current Worktree Status

### Active Worktrees (Need Cleanup)
```
/Users/byronhudson/Projects/synapse-auth           [feature/authentication] ✅ MERGED
/Users/byronhudson/Projects/Synapse-backend        [feature/backend-services] ✅ MERGED
/Users/byronhudson/Projects/Synapse-calendar       [feature/calendar-integration] ✅ MERGED
/Users/byronhudson/Projects/Synapse-social         [feature/socialpilot] ✅ MERGED
/Users/byronhudson/Projects/Synapse-ui             [feature/ui-enhancements] ✅ MERGED
```

**Status:** All branches merged to main, safe to remove

### Cleanup Commands

**Remove worktrees:**
```bash
cd /Users/byronhudson/Projects/Synapse

# Check for uncommitted changes first
git worktree list

# Remove (use --force if needed for uncommitted changes)
git worktree remove /Users/byronhudson/Projects/synapse-auth
git worktree remove /Users/byronhudson/Projects/Synapse-backend --force
git worktree remove /Users/byronhudson/Projects/Synapse-calendar
git worktree remove /Users/byronhudson/Projects/Synapse-social
git worktree remove /Users/byronhudson/Projects/Synapse-ui

# Delete merged branches
git branch -d feature/authentication
git branch -d feature/backend-services
git branch -d feature/calendar-integration
git branch -d feature/socialpilot
git branch -d feature/ui-enhancements

# Verify cleanup
git worktree list
```

---

## Parallel Development Opportunities by Phase

### Phase 1A: Core MVP (Weeks 1-3)

**Week 1 - 4 Parallel Worktrees:**
```bash
git worktree add ../synapse-foundation feature/foundation
git worktree add ../synapse-location feature/location-detection
git worktree add ../synapse-intelligence feature/intelligence-gatherer
git worktree add ../synapse-industry feature/industry-autogen
```
**Effort:** 40h → 10h (4x speedup)

**Week 2 - 4 Parallel Worktrees:**
```bash
git worktree add ../synapse-specialty feature/specialty-detection
git worktree add ../synapse-social feature/social-analyzer
git worktree add ../synapse-product-uvp feature/product-scanner-uvp
git worktree add ../synapse-bannerbear feature/bannerbear
```
**Effort:** 46h → 12h (4x speedup)

**Week 3 - 2 Parallel Worktrees:**
```bash
git worktree add ../synapse-profile feature/profile-management
git worktree add ../synapse-campaign feature/campaign-generator-core
```
**Effort:** 34h → 17h (2x speedup)

**Total Phase 1A:** 150h → 39h with parallel (3.8x speedup)

**Could Increase to 5-6 Parallel:**
- Split intelligence-gatherer into API groups (2 worktrees)
- Split social-analyzer into YouTube + Social (2 worktrees)
- Split campaign-generator into campaign logic + template system (2 worktrees)
- **Potential:** 150h → 25-30h (5-6x speedup)

---

### Phase 1B: Content Marketing (Weeks 4-5)

**4 Parallel Worktrees:**
```bash
git worktree add ../synapse-long-form feature/long-form-content
git worktree add ../synapse-landing-pages feature/landing-pages
git worktree add ../synapse-seo feature/seo-intelligence
git worktree add ../synapse-perplexity feature/perplexity-local
```
**Effort:** 80h → 20h (4x speedup)

**Could Increase to 6 Parallel:**
- Split SEO into SEO-optimizer + Local-SEO + Quick-wins (3 worktrees)
- Split landing-pages into templates + lead-capture (2 worktrees)
- **Potential:** 80h → 13-15h (5-6x speedup)

---

### Phase 1C: Video Capabilities (Weeks 6-7)

**2 Parallel Worktrees:**
```bash
git worktree add ../synapse-video-editor feature/video-editor
git worktree add ../synapse-video-formatter feature/video-formatter
```
**Effort:** 70h → 35h (2x speedup)

**Could Increase to 4-5 Parallel:**
- Split video-editor into UI + Processing + Effects + Captions (4 worktrees)
- Split formatter into Aspect-ratios + Platform-specific + Exports (3 worktrees)
- **Potential:** 70h → 14-18h (4-5x speedup)

---

### Phase 2A: Admin & Revenue (Month 2)

**4 Parallel Worktrees:**
```bash
git worktree add ../synapse-admin-core feature/admin-dashboard
git worktree add ../synapse-billing feature/stripe-billing
git worktree add ../synapse-moderation feature/content-moderation
git worktree add ../synapse-analytics feature/platform-analytics
```
**Effort:** 90h → 23h (4x speedup)

**Could Increase to 6 Parallel:**
- Split admin-core into User-mgmt + API-tracking + System-health (3 worktrees)
- Split analytics into Dashboard + MRR + User-analytics (3 worktrees)
- **Potential:** 90h → 15h (6x speedup)

---

### Phase 2B: White-Label MVP (Month 3)

**4 Parallel Worktrees:**
```bash
git worktree add ../synapse-multitenant feature/multi-tenant
git worktree add ../synapse-agency-hierarchy feature/agency-hierarchy
git worktree add ../synapse-branding feature/basic-branding
git worktree add ../synapse-subdomains feature/subdomain-support
```
**Effort:** 54h → 14h (4x speedup)

---

### Phase 2C: Growth & Automation (Months 4-5)

**3 Parallel Worktrees:**
```bash
git worktree add ../synapse-linkedin feature/linkedin-engine
git worktree add ../synapse-ai-video feature/ai-video-editor
git worktree add ../synapse-seo-automation feature/seo-automation
```
**Effort:** 140h → 47h (3x speedup)

**Could Increase to 8 Parallel:**
**LinkedIn (3 worktrees):**
- feature/linkedin-analyzer
- feature/linkedin-campaigns
- feature/linkedin-automation

**AI Video (3 worktrees):**
- feature/ai-highlight-detection
- feature/scene-detection
- feature/multi-version-gen

**SEO (2 worktrees):**
- feature/content-refresh
- feature/backlink-finder

**Potential:** 140h → 18-20h (7-8x speedup)

---

### Phase 2D: Full Platform (Months 6-7)

**4 Parallel Worktrees:**
```bash
git worktree add ../synapse-custom-domains feature/custom-domains
git worktree add ../synapse-full-theming feature/complete-theming
git worktree add ../synapse-agency-billing feature/agency-billing
git worktree add ../synapse-content-automation feature/content-intelligence
```
**Effort:** 99h → 25h (4x speedup)

**Could Increase to 6 Parallel:**
- Split content-automation into Newsletter + Blog + Landing + Leads (4 worktrees)
- **Potential:** 99h → 17h (6x speedup)

---

## Summary: Parallel Opportunities

| Phase | Current Parallel | Max Parallel | Current Time | Max Speed Time | Speedup |
|-------|------------------|--------------|--------------|----------------|---------|
| Phase 1A | 4 worktrees | 5-6 | 39h | 25-30h | 5-6x |
| Phase 1B | 4 worktrees | 6 | 20h | 13-15h | 5-6x |
| Phase 1C | 2 worktrees | 4-5 | 35h | 14-18h | 4-5x |
| Phase 2A | 4 worktrees | 6 | 23h | 15h | 6x |
| Phase 2B | 4 worktrees | 4 | 14h | 14h | 4x |
| Phase 2C | 3 worktrees | 8 | 47h | 18-20h | 7-8x |
| Phase 2D | 4 worktrees | 6 | 25h | 17h | 6x |

**Current Strategy:** ~203h total with 3-4 parallel worktrees
**Max Parallelization:** ~116-129h total with 5-8 parallel worktrees

**Recommendation:** Start with 4 parallel worktrees (current plan), increase to 5-6 if you have capacity.

---

## Worktree Best Practices

### Pre-Build Checklist
1. Clean up old worktrees (see cleanup commands above)
2. Ensure main branch is clean
3. Pull latest changes
4. Verify no merge conflicts pending

### Creating Worktrees
```bash
# Create worktree in parallel directory
git worktree add ../synapse-[feature-name] feature/[feature-name]

# Verify creation
git worktree list

# Work in the worktree
cd ../synapse-[feature-name]
```

### Merging Back
```bash
# From main project directory
cd /Users/byronhudson/Projects/Synapse

# Pull latest
git pull origin main

# Merge feature
git merge --no-ff feature/[feature-name]

# Push
git push origin main

# Remove worktree
git worktree remove ../synapse-[feature-name]

# Delete branch
git branch -d feature/[feature-name]
```

### Avoiding Conflicts
- Each worktree should work on different files
- Review task files to ensure no overlap
- Coordinate merge order if dependencies exist
- Use `--no-ff` for merge commits

---

## Task File References

All worktree task files located in `.buildrunner/worktrees/`:
- Phase 1A: 10 task files
- Phase 1B: 4 task files
- Phase 1C: 2 task files
- Phase 2A-D: Will be created as needed

**Next:** Review `.buildrunner/PHASED_FEATURE_SUMMARY.md` for complete phase breakdown.
