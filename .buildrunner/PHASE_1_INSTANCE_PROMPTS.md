# PHASE 1 INSTANCE PROMPTS - CLAUDE OPTIMIZED

## 🎯 PROMPT FOR INSTANCE A: INTELLIGENCE PIPELINE

```
You are implementing Phase 1 Intelligence Pipeline for Synapse V2 Dashboard.

ATOMIC TASK LIST: .buildrunner/PHASE_1_INSTANCE_A_TASKS.md

HOW TO USE THE TASK LIST:
1. Read each task's CONTEXT section first to understand what exists
2. Review the EXAMPLE CODE to see the exact pattern expected
3. Implement following the example structure exactly
4. Verify against the VALIDATION checklist before proceeding
5. Test incrementally - don't wait until the end

MISSION:
Execute every task in the atomic list sequentially. Your goal is to transform the intelligence pipeline from mock data to real, unique, multiplied content that users can immediately deploy.

CRITICAL SUCCESS FACTORS:
✅ Follow existing code patterns exactly (check Read tool results)
✅ Preserve all TypeScript types strictly (no 'any' types)
✅ Match Tailwind styling conventions from existing files
✅ Test each task before moving to the next
✅ Real breakthrough titles must be contextual and varied
✅ Zero mock data must remain anywhere

YOUR DELIVERABLES (2 days):

DAY 1:
- 50+ breakthrough title templates categorized by insight type
- Smart template selection with uniqueness tracking
- Real breakthroughs wired to Smart Picks (no mocks)
- Provenance display: "Validated by X data points"
- Prominent cluster validation in UI
- All TypeScript compiling, tests passing

DAY 2:
- Content multiplication engine: 1 breakthrough → 3-5 angles → platform variants
- Platform-specific content (LinkedIn, Instagram, Facebook, Email, Twitter)
- Weekly content calendar with optimal posting times
- ContentMultiplier UI component with copy-to-clipboard
- Integration into PowerMode
- Comprehensive unit tests
- PR created with screenshots

BRANCH SETUP:
Base: feature/dashboard-v2-week2
Your branch: feature/phase1-intelligence-pipeline

QUALITY STANDARDS:
- Breakthrough titles include business context (location, audience, industry)
- Platform content reads naturally (not template-sounding)
- Each platform has appropriate tone (LinkedIn professional, Instagram visual)
- Twitter content stays under 280 characters
- Email includes subject lines
- Copy button provides user feedback (checkmark)

EXECUTION PROTOCOL:
1. Start with TASK 0.1 environment setup
2. Read files listed in TASK 0.2 before coding
3. Follow each task's CONTEXT → EXAMPLE → VALIDATION sequence
4. Check off validation items before moving forward
5. Run tests frequently (npm test)
6. At end of Day 1, notify Instance B: "✅ Breakthrough types ready"
7. Complete Day 2, commit, push, create PR
8. Add screenshots to PR showing real breakthroughs

ANTI-PATTERNS TO AVOID:
❌ Don't skip reading existing files first
❌ Don't use placeholder or mock data
❌ Don't create generic titles without context
❌ Don't batch all testing until the end
❌ Don't modify code you haven't read
❌ Don't use 'any' type - infer proper types

READ THE FULL TASK LIST BEFORE STARTING.
Check off each validation item as you go.
Test incrementally.

START NOW.
```

---

## 🎨 PROMPT FOR INSTANCE B: POWER VISUALIZATIONS

```
You are implementing Phase 1 Power Visualizations for Synapse V2 Dashboard.

ATOMIC TASK LIST: .buildrunner/PHASE_1_INSTANCE_B_TASKS.md

HOW TO USE THE TASK LIST:
1. Read each task's CONTEXT section first
2. Study the EXAMPLE CODE patterns exactly
3. Implement following D3/Recharts best practices
4. Verify against VALIDATION checklist
5. Test visual output in browser frequently

MISSION:
Create three compelling, interactive visualizations that transform raw intelligence into immediately actionable insights. Make the dashboard "beautiful, intuitive, and impressive."

⚠️ CRITICAL DEPENDENCY:
WAIT for Instance A to complete Day 1 before starting Day 2.
Once notified, pull their branch to get updated Breakthrough types:
```bash
git fetch origin feature/phase1-intelligence-pipeline
git checkout feature/phase1-intelligence-pipeline
# Review breakthrough-generator.service.ts
git checkout feature/phase1-power-visualizations
```

YOUR DELIVERABLES (3 days, starting Day 2):

DAY 2 - OPPORTUNITY RADAR:
- D3 interactive radar with three concentric zones
- Blips positioned by confidence (x) and impact (y)
- Red (urgent), Orange (high-value), Green (evergreen) zones
- Click blips to open detail modal
- Animated blip appearance
- Hover effects showing breakthrough titles
- Mobile responsive + dark mode

DAY 3 - CAMPAIGN TIMELINE:
- SVG horizontal timeline with connected nodes
- Display 5-7 campaign pieces as nodes
- Emotional progression graph overlay
- Phase labels (Awareness, Consideration, Decision)
- Expected engagement bars per piece
- Click nodes for details
- Smooth animations

DAY 4 - PERFORMANCE DASHBOARD & INTEGRATION:
- Recharts comparison bars (predicted vs industry avg)
- Animated metric counters
- ROI projection display
- Confidence bands visualization
- Full integration into Easy/Power modes
- Component tests
- Mobile responsive
- PR with screenshots

BRANCH SETUP:
Base: feature/dashboard-v2-week2
Your branch: feature/phase1-power-visualizations

DEPENDENCIES TO INSTALL:
```bash
npm install d3 @types/d3 recharts
```

QUALITY STANDARDS FOR VISUALIZATIONS:
- D3 animations smooth at 60fps
- Colors match design system (purple/blue gradients)
- Dark mode colors readable and beautiful
- Mobile radar scales down gracefully
- No hardcoded dimensions (use SVG viewBox or responsive containers)
- Timeline nodes connected with animated lines
- Performance bars compare meaningfully
- Interactive elements have hover states
- Loading states while data fetches

D3 BEST PRACTICES:
- Clear previous renders: svg.selectAll('*').remove()
- Use scales for positioning (never hardcode coordinates)
- Responsive: recalculate on window resize
- Separate data transformation from rendering
- Consistent transition durations (600-800ms)
- Sequential animations with delays (i * 100ms)

EXECUTION PROTOCOL:
1. Setup environment (Day 1 evening or Day 2 morning)
2. WAIT for Instance A notification
3. Pull Instance A's branch to see Breakthrough types
4. Start DAY 2 tasks (Opportunity Radar)
5. Test radar in browser frequently
6. Proceed to DAY 3 (Campaign Timeline)
7. Complete DAY 4 (Performance Dashboard + Integration)
8. Write component tests
9. Capture screenshots of all three visualizations
10. Create PR noting dependency on Instance A

VISUALIZATION VALIDATION CHECKLIST:

Opportunity Radar:
- [ ] Three concentric circles rendered
- [ ] Blips appear at correct positions
- [ ] Colors match category (red/orange/green)
- [ ] Click opens modal with full breakthrough details
- [ ] Hover shows breakthrough title
- [ ] Animations stagger (i * 100ms delay)
- [ ] Responsive on mobile (375px width)
- [ ] Dark mode looks good

Campaign Timeline:
- [ ] Nodes positioned horizontally
- [ ] Lines connect nodes
- [ ] Emotional progression curve overlays
- [ ] Phase labels visible (Awareness/Consideration/Decision)
- [ ] Engagement bars display correctly
- [ ] Animations smooth
- [ ] Mobile scrolls horizontally or scales

Performance Dashboard:
- [ ] Bars compare predicted vs industry
- [ ] Counters animate from 0 to value
- [ ] ROI projection displays
- [ ] Recharts renders without errors
- [ ] Tooltips show on hover
- [ ] Legend clear and readable

Integration:
- [ ] OpportunityRadar in EasyMode
- [ ] All three in PowerMode
- [ ] Layout doesn't break
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Tests pass

ANTI-PATTERNS TO AVOID:
❌ Don't use hardcoded pixel positions
❌ Don't skip responsive testing
❌ Don't ignore dark mode styling
❌ Don't create animations longer than 1 second
❌ Don't forget to remove previous renders
❌ Don't use inline styles (use className)
❌ Don't skip the detail modal for radar

READ THE FULL TASK LIST BEFORE STARTING.
Study the D3 examples carefully.
Test in browser after each major section.

WAIT FOR INSTANCE A DAY 1, THEN START.
```

---

## 📊 SUCCESS METRICS FOR BOTH INSTANCES

### Technical Completion:
- [x] 50+ unique breakthrough titles
- [x] Zero mock data visible
- [x] All visualizations interactive
- [x] <30 second dashboard load time
- [x] All TypeScript compiles (no errors)
- [x] All tests pass (unit + component)

### User Value Delivered:
- [x] 3+ campaigns ready to launch
- [x] 21+ content pieces generated (7 breakthroughs × 3 angles)
- [x] Clear validation provenance everywhere
- [x] Industry benchmarks compared
- [x] Opportunity urgency immediately visible

### Visual Quality:
- [x] Radar makes opportunities scannable at a glance
- [x] Timeline clarifies campaign path
- [x] Performance predictions build confidence
- [x] Mobile experience is excellent
- [x] Dark mode is beautiful

---

## 🔄 COORDINATION PROTOCOL

### Instance A → Instance B Handoff

**When Instance A completes Day 1 (title templates + Smart Picks):**

Instance A posts:
```
✅ Instance A Day 1 complete.
Breakthrough types ready at: feature/phase1-intelligence-pipeline

Key changes:
- 50+ title templates in breakthrough-generator.service.ts
- Breakthrough interface unchanged
- Real breakthroughs flowing to SmartPicks

Ready for Instance B to start Day 2 visualizations.
```

**Instance B Response:**
```
✅ Received. Pulling breakthrough types now.
Starting Opportunity Radar implementation.
```

### Both Instances Complete

**When both PRs ready:**

1. **Review Instance A PR first** (it's the dependency)
   - Check: Title variety, no mock data, tests passing
   - Check: Content multiplication working
   - Merge to `feature/dashboard-v2-week2`

2. **Instance B rebases on updated base**
   ```bash
   git checkout feature/dashboard-v2-week2
   git pull
   git checkout feature/phase1-power-visualizations
   git rebase feature/dashboard-v2-week2
   ```

3. **Review Instance B PR**
   - Check: All visualizations working
   - Check: Integration clean
   - Check: Screenshots show quality
   - Merge to `feature/dashboard-v2-week2`

4. **Celebrate Phase 1 completion! 🎉**
   - Dashboard now at ~95% completion
   - Real intelligence flowing
   - Beautiful visualizations
   - Ready for Phase 2

---

## 🔧 TROUBLESHOOTING GUIDE

### Instance A Issues

**Problem: Title templates still repetitive**
- Check: Template selection using `usedTemplates` Set
- Check: Interpolation actually replacing variables
- Solution: Add console.log to see which templates selected

**Problem: SmartPicks not showing breakthroughs**
- Check: DashboardPage passing breakthroughs prop
- Check: Orchestration adding breakthroughs to context
- Check: No TypeScript errors in transformation function

**Problem: Content multiplication not appearing**
- Check: Orchestration calling contentMultiplierService
- Check: multipliedContent added to DeepContext
- Check: PowerMode checking for context.multipliedContent

**Problem: Tests failing**
- Check: Mock data matches actual data structure
- Check: All imports correct
- Run: `npm test -- --reporter=verbose` for details

### Instance B Issues

**Problem: D3 radar not rendering**
- Check: SVG ref attached correctly
- Check: Data transformation creates valid x/y coordinates
- Check: useEffect dependencies include breakthroughs
- Solution: Add console.log(blips) to verify data

**Problem: Blips not clickable**
- Check: .on('click', handler) attached to blipGroups
- Check: Event not being stopped by parent
- Solution: Test with simpler onClick first

**Problem: Timeline not responsive**
- Check: SVG width set to parent container width
- Check: xScale using percentage of width, not fixed pixels
- Solution: Add window resize listener

**Problem: Recharts not displaying**
- Check: Data array has correct shape for Recharts
- Check: ResponsiveContainer has height set
- Check: dataKey props match data object keys

**Problem: Performance slow**
- Check: Not recreating D3 visualization on every render
- Check: Using React.memo for expensive components
- Solution: Move data transformation to useMemo

---

## 🎯 PHASE 1 GOAL

**Current State:** 81% complete
**Target State:** 95% complete
**Timeline:** 4 working days
**Outcome:** Users can generate campaigns in seconds with compelling visualizations

**What We're Building:**
- Intelligence that feels magical (validated, contextual, unique)
- Visualizations that make decisions obvious
- Content ready to publish immediately
- An experience that's faster than manual research

**After Phase 1:**
- Real breakthroughs, no mocks
- Beautiful radar, timeline, and performance views
- Content multiplication working
- Ready for Phase 2 (competitive analysis & polish)

---

**INSTANCES: READ YOUR ATOMIC TASK LISTS AND BEGIN!**
