# PHASE 2 INSTANCE PROMPTS - CLAUDE OPTIMIZED

## 🎯 PROMPT FOR INSTANCE C: COMPETITIVE ENHANCEMENT

```
You are implementing Phase 2C: Competitive Enhancement for Synapse V2 Dashboard.

ATOMIC TASK LIST: .buildrunner/PHASE_2_INSTANCE_C_TASKS.md

HOW TO USE THE TASK LIST:
1. Read each task's CONTEXT section to understand competitive analysis
2. Review EXAMPLE CODE for Apify integration patterns
3. Implement with respect for rate limits and robots.txt
4. Verify against VALIDATION checklist
5. Test with real competitor URLs incrementally

MISSION:
Build automated competitive intelligence that scrapes competitor websites, extracts messaging themes, identifies white spaces, and generates actionable differentiation strategies.

CRITICAL SUCCESS FACTORS:
✅ Apify integration must respect robots.txt and rate limits
✅ Theme extraction must be accurate (>80% relevance)
✅ White space identification must be actionable
✅ Differentiation strategies must be specific, not generic
✅ All competitive data must have clear provenance
✅ Fallback analysis must work when Apify unavailable

YOUR DELIVERABLES (2 days):

DAY 5 - COMPETITIVE SCRAPING & ANALYSIS:
- Apify SDK integration with error handling
- Web scraping of 1-5 competitor websites
- Messaging theme extraction (10+ themes per competitor)
- Content topic identification
- Positioning analysis
- Key message extraction

DAY 6 - WHITE SPACES & UI:
- Competitive white space identification
- Differentiation strategy generation (3-5 strategies)
- Theme comparison (yours vs theirs)
- CompetitiveGaps UI component
- Integration into Easy/Power modes
- Orchestration integration
- Comprehensive testing

BRANCH SETUP:
Base: feature/dashboard-v2-week2 (with Phase 1 merged)
Your branch: feature/phase2-competitive-enhancement

DEPENDENCIES:
```bash
npm install apify-client @types/apify-client
```

QUALITY STANDARDS:
- Scraping extracts meaningful themes (not just common words)
- White spaces are exploitable opportunities
- Strategies reference actual competitor data
- UI shows clear competitive advantages
- Error handling prevents crashes
- Fallback works without Apify token

APIFY BEST PRACTICES:
- Use 'Website Content Crawler' actor
- Set maxCrawlPages limit (default: 10)
- Configure timeout (default: 60 seconds)
- Implement retry logic (3 attempts)
- Handle rate limiting gracefully
- Clear error messages for users

EXECUTION PROTOCOL:
1. Setup environment and install Apify SDK
2. Configure environment variables (.env.local)
3. Create competitive-analyzer.service.ts
4. Implement web scraping with Apify
5. Build theme extraction algorithms
6. Identify white spaces vs your breakthroughs
7. Generate differentiation strategies
8. Create CompetitiveGaps visualization
9. Integrate into orchestration and UI
10. Test with real competitor URLs
11. Write comprehensive tests
12. Document setup and usage

ANTI-PATTERNS TO AVOID:
❌ Don't ignore rate limits (respect robots.txt)
❌ Don't extract generic themes like "quality" or "service"
❌ Don't generate vague strategies like "be better"
❌ Don't crash when Apify fails (implement fallback)
❌ Don't scrape social media (use websites only)
❌ Don't store sensitive competitor data insecurely

READ THE FULL TASK LIST BEFORE STARTING.
Test incrementally with real URLs.
Implement robust error handling.

START NOW.
```

---

## 🏁 PROMPT FOR INSTANCE D: POLISH & SHIP

```
You are implementing Phase 2D: Polish & Ship for Synapse V2 Dashboard.

ATOMIC TASK LIST: .buildrunner/PHASE_2_INSTANCE_D_TASKS.md

HOW TO USE THE TASK LIST:
1. Read each task's CONTEXT for production requirements
2. Review EXAMPLE CODE for error handling patterns
3. Implement with focus on user experience
4. Verify against VALIDATION checklist
5. Test edge cases and error scenarios thoroughly

MISSION:
Transform the dashboard from feature-complete to production-ready. Add A/B testing, performance tracking, loading states, error handling, accessibility, and complete documentation. Ship a polished product.

CRITICAL SUCCESS FACTORS:
✅ Every async operation must have loading state
✅ Every error must have user-friendly message
✅ Every component must handle missing data gracefully
✅ All interactions must provide feedback
✅ Performance must be optimized (<30s dashboard load)
✅ Documentation must be comprehensive

YOUR DELIVERABLES (2 days):

DAY 7 - A/B TESTING & PERFORMANCE:
- Variant generator service (FOMO, social proof, authority)
- Generate 2-3 meaningful variants per content
- VariantSelector UI with performance predictions
- Performance tracker service
- Learning feedback loop
- Actual vs predicted performance analysis
- Learning insights generation

DAY 8 - FINAL POLISH:
- Loading states for all async operations
- Error boundary for React errors
- Empty states with helpful messages
- Performance optimization (lazy loading, memoization)
- Accessibility (ARIA labels, keyboard nav)
- User guide documentation
- Deployment guide
- End-to-end testing
- Final QA checklist
- Production deployment ready

BRANCH SETUP:
Base: feature/dashboard-v2-week2 (with Phase 1 & Instance C merged)
Your branch: feature/phase2-polish-ship

QUALITY STANDARDS:
- A/B variants must be semantically different
- Loading skeletons match final component shape
- Error messages are user-friendly and actionable
- Empty states suggest next actions
- Keyboard navigation works for all interactions
- Documentation covers all features and deployment
- Lighthouse score >90
- WCAG AA compliant

PRODUCTION READINESS CHECKLIST:
- [ ] Dashboard loads in <30 seconds
- [ ] All features functional
- [ ] No console errors or warnings
- [ ] Mobile responsive (test 375px, 768px, 1024px)
- [ ] Dark mode beautiful
- [ ] All async operations have loading states
- [ ] All errors handled gracefully
- [ ] Empty states helpful
- [ ] Performance optimized
- [ ] Accessibility compliant
- [ ] Documentation complete
- [ ] All tests passing
- [ ] Deployment guide ready

EXECUTION PROTOCOL:
1. Create variant-generator.service.ts
2. Implement FOMO, social proof, authority strategies
3. Build VariantSelector UI
4. Create performance-tracker.service.ts
5. Implement learning feedback loop
6. Add loading states to all components
7. Create ErrorBoundary component
8. Add empty states everywhere
9. Implement code splitting and lazy loading
10. Memoize expensive computations
11. Add ARIA labels and keyboard navigation
12. Write user guide and deployment docs
13. Run full QA checklist
14. Final commit and PR

ANTI-PATTERNS TO AVOID:
❌ Don't show raw error messages to users
❌ Don't let components crash without error boundary
❌ Don't forget loading states on any async operation
❌ Don't skip empty states (they're critical UX)
❌ Don't ignore mobile users (test responsiveness)
❌ Don't skip accessibility (it's not optional)
❌ Don't deploy without documentation

ERROR HANDLING BEST PRACTICES:
- Wrap all async operations in try/catch
- Use ErrorBoundary for React component errors
- Show user-friendly messages (not stack traces)
- Provide "Try Again" buttons
- Log errors to console for debugging
- Graceful degradation when features unavailable

PERFORMANCE OPTIMIZATION:
- Lazy load heavy components (D3, Recharts)
- Memoize expensive calculations
- Use React.memo for pure components
- Implement code splitting
- Optimize bundle size
- Monitor Core Web Vitals

READ THE FULL TASK LIST BEFORE STARTING.
Test every error scenario.
Ensure production-ready quality.

START NOW.
```

---

## 📊 SUCCESS METRICS FOR PHASE 2

### Technical Completion:
- [x] Competitive scraping with Apify
- [x] 10+ themes extracted per competitor
- [x] White space identification
- [x] Differentiation strategies generated
- [x] A/B variants with 2-3 options
- [x] Performance tracking active
- [x] Loading states everywhere
- [x] Error handling robust
- [x] Performance <30s load
- [x] All tests passing

### User Value Delivered:
- [x] Clear competitive advantages shown
- [x] Actionable differentiation strategies
- [x] A/B test variants ready for each content
- [x] Performance feedback learning
- [x] Production-ready experience

### Production Readiness:
- [x] No crashes or console errors
- [x] Mobile responsive everywhere
- [x] Dark mode beautiful
- [x] Accessible (WCAG AA)
- [x] Documentation complete
- [x] Deployment guide ready

---

## 🔄 COORDINATION PROTOCOL

### Sequential Execution

**Instance C (Days 5-6):**
1. Competitive scraping and analysis
2. White space identification
3. Differentiation strategies
4. UI integration
5. Commit and push

**Instance D (Days 7-8) - Starts after Instance C:**
1. Pull Instance C's completed work
2. A/B variant generation
3. Performance tracking
4. Final polish and optimization
5. Documentation and deployment prep
6. Final commit and production deployment

### Handoff Verification

**When Instance C completes:**
- [ ] Competitive analyzer service exists
- [ ] CompetitiveGaps component working
- [ ] Integration in Easy/Power modes
- [ ] Tests passing
- [ ] Branch pushed: feature/phase2-competitive-enhancement

**Instance D begins after confirming:**
```bash
git fetch origin feature/phase2-competitive-enhancement
git log feature/phase2-competitive-enhancement
# Verify "Competitive enhancement" commit exists
```

---

## 🔧 TROUBLESHOOTING GUIDE

### Instance C Issues

**Problem: Apify scraping fails**
- Check: API token configured correctly
- Check: Timeout not too short (try 90 seconds)
- Solution: Use fallback analysis when scraping fails

**Problem: No themes extracted**
- Check: Competitor website has textual content (not all images)
- Check: extractKeyPhrases finding common business terms
- Solution: Adjust theme detection thresholds

**Problem: White spaces not meaningful**
- Check: Your breakthrough data has substance
- Check: Comparison logic actually comparing themes
- Solution: Improve semantic matching algorithm

### Instance D Issues

**Problem: Variants too similar**
- Check: FOMO, social proof, authority tactics applied
- Check: Not just prepending same phrase
- Solution: Increase semantic distance requirements

**Problem: Performance tracker not learning**
- Check: Performance data being recorded
- Check: Analysis actually running
- Solution: Add logging to verify learning loop

**Problem: Loading states not showing**
- Check: loading prop passed to components
- Check: Async operations setting loading state
- Solution: Add useState for loading in parent

---

## 🎯 PHASE 2 GOAL

**Current State:** 95% complete (after Phase 1)
**Target State:** 100% complete
**Timeline:** 4 working days (Days 5-8)
**Outcome:** Production-ready dashboard with competitive edge

**What We're Building:**
- Competitive intelligence that shows clear differentiation
- A/B testing to optimize every campaign
- Performance tracking that learns and improves
- Production polish that feels professional
- Complete documentation for deployment

**After Phase 2:**
- 100% feature complete ✅
- Production-ready ✅
- Documented ✅
- Ready for real users ✅

---

**INSTANCES: READ YOUR ATOMIC TASK LISTS AND EXECUTE!**
