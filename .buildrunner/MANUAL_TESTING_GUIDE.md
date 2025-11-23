# Manual Testing Guide - Dashboard V2

**Date:** 2025-11-22
**Status:** Ready to test
**Prerequisites:** Merged to main ✅

---

## Quick Start

### Terminal 1: Start Development Server
```bash
npm run dev
```

**Wait for:** "Local: http://localhost:5173/"

### Terminal 2: Run E2E Tests (Optional)
```bash
npm run test:e2e
```

---

## Testing Checklist

### Priority 1: E2E Flow Testing (15-20 min)

**What:** Validate complete user journeys work end-to-end

**Test 1: Onboarding Flow**
- [ ] Navigate to http://localhost:5173/
- [ ] Should see "Welcome to Synapse" or onboarding page
- [ ] Enter website URL (e.g., "www.example.com")
- [ ] Select industry from dropdown
- [ ] Complete location/platform selections
- [ ] Click "Continue" or "Next"
- [ ] Verify: Redirects to dashboard

**Expected:** Complete flow in < 3 minutes

---

**Test 2: Campaign Generation from Smart Suggestions**
- [ ] On dashboard, locate "Smart Suggestions" or "AI Picks" panel
- [ ] Click on a suggested campaign
- [ ] Should show campaign details with:
  - Campaign name
  - Number of pieces
  - Timeline
  - Emotional progression
- [ ] Click "Generate Campaign" or "Use This Template"
- [ ] Wait for generation (10-15s)
- [ ] Verify: Campaign pieces appear in calendar

**Expected:** Generated campaign with 5-10 pieces

---

**Test 3: Single Post Generation**
- [ ] Click "Create Single Post" or "Quick Post"
- [ ] Select post type (Customer Success, Service Spotlight, etc.)
- [ ] If Customer Success Story: Verify asks for source/testimonial
- [ ] Fill in required fields
- [ ] Click "Generate"
- [ ] Should see live preview updating
- [ ] Click "Save" or "Publish"

**Expected:** Post generated with proper content, no fabricated data

---

**Test 4: Campaign Editing & Preview**
- [ ] Navigate to existing campaign
- [ ] Click "Edit" on a campaign piece
- [ ] Modify title or content
- [ ] Should see live preview update in real-time
- [ ] Click "Save Changes"
- [ ] Verify: Changes persist after refresh

**Expected:** Real-time preview, changes saved

---

**Test 5: Mobile Preview**
- [ ] In campaign builder, click "Mobile Preview" or device toggle
- [ ] Should see mobile view with:
  - Smaller dimensions
  - Touch-friendly buttons
  - Readable text
- [ ] Test different platforms (Instagram, LinkedIn, Facebook)
- [ ] Verify: Each platform shows proper formatting

**Expected:** Mobile layouts render correctly

---

### Priority 2: Campaign Generation Quality (20-30 min)

**What:** Manually review AI-generated content quality

**Test 6: Generate 3 Campaigns with Different Templates**

**Campaign 1: RACE Journey (Reach, Act, Convert, Engage)**
- [ ] Navigate to Campaign Builder
- [ ] Select "RACE Journey" template
- [ ] Set target audience: "B2B SaaS buyers"
- [ ] Industry: "SaaS"
- [ ] Click "Generate Campaign"
- [ ] Review all generated pieces (expect 7 pieces)

**Quality Checks:**
- [ ] Emotional progression flows naturally (Curiosity → Desire → Urgency → Trust)
- [ ] Content matches B2B SaaS tone
- [ ] Each piece has clear CTA
- [ ] No generic/vague language
- [ ] Industry-specific terminology present

---

**Campaign 2: Trust Ladder**
- [ ] Select "Trust Ladder" template
- [ ] Set target audience: "Healthcare professionals"
- [ ] Industry: "Healthcare"
- [ ] Click "Generate Campaign"
- [ ] Review all generated pieces (expect 5 pieces)

**Quality Checks:**
- [ ] Trust-building language throughout
- [ ] Healthcare compliance-aware (no medical claims)
- [ ] Professional, credible tone
- [ ] Builds from awareness to decision
- [ ] Social proof elements included

---

**Campaign 3: Product Launch**
- [ ] Select "Product Launch" template
- [ ] Set target audience: "Small business owners"
- [ ] Industry: "Professional Services"
- [ ] Click "Generate Campaign"
- [ ] Review all generated pieces (expect 6 pieces)

**Quality Checks:**
- [ ] Excitement/anticipation built early
- [ ] Value proposition clear
- [ ] Launch timeline logical
- [ ] Urgency appropriate (not fake scarcity)
- [ ] Call-to-actions are specific

---

**Overall Quality Assessment:**

Rate each campaign 1-10:
- Content originality: ___/10
- Emotional resonance: ___/10
- Industry fit: ___/10
- CTA quality: ___/10
- Narrative coherence: ___/10

**Average Score:** ___/10

**Target:** 7+ average across all campaigns

---

### Priority 3: UI Levels Testing (15-20 min)

**What:** Test all three UI complexity levels

**Test 7: Simple Mode**
- [ ] Navigate to Settings or Profile
- [ ] Set UI Level to "Simple" or "Beginner"
- [ ] Go to Campaign Builder
- [ ] Should see:
  - Minimal options (3-5 max)
  - "Quick Start" or "Guided" workflows
  - No advanced settings visible
  - Large, clear buttons
- [ ] Create a campaign using Simple Mode
- [ ] Verify: No overwhelm, intuitive flow

**Expected:** Suitable for first-time users, < 5 options per screen

---

**Test 8: Custom Mode**
- [ ] Set UI Level to "Custom" or "Intermediate"
- [ ] Go to Campaign Builder
- [ ] Should see:
  - More options than Simple (10-15)
  - Emotional trigger selector
  - Platform customization
  - Template variations
- [ ] Create a campaign using Custom Mode
- [ ] Verify: More control without being overwhelming

**Expected:** Balanced options, clear categories

---

**Test 9: Power Mode**
- [ ] Set UI Level to "Power" or "Advanced"
- [ ] Go to Campaign Builder
- [ ] Should see:
  - ALL options available
  - Manual arc editing
  - Connection builder between pieces
  - Advanced scheduling
  - Custom emotional progression
- [ ] Create a campaign using Power Mode
- [ ] Test advanced features:
  - [ ] Manually reorder pieces (drag-drop)
  - [ ] Create connection between 2 pieces
  - [ ] Add new phase to arc
  - [ ] Customize emotional trigger per piece

**Expected:** Full control, expert-level features

---

**UI Level Transition Testing:**
- [ ] Switch from Simple → Custom (should preserve data)
- [ ] Switch from Custom → Power (should preserve data)
- [ ] Switch from Power → Simple (should warn about hidden features)

**Expected:** Smooth transitions, no data loss

---

### Priority 4: Customer Segment Testing (15 min)

**What:** Test segment alignment and persona matching

**Test 10: Create Customer Personas**
- [ ] Navigate to Segments or Personas
- [ ] Click "Create Persona"
- [ ] Fill in:
  - Name: "Tech-Savvy Manager"
  - Industry: "SaaS"
  - Decision-making style: "Analytical"
  - Pain points: "Manual processes, data silos"
  - Goals: "Automation, efficiency"
- [ ] Save persona
- [ ] Repeat for 2 more personas (different styles)

**Expected:** 3 personas created with different profiles

---

**Test 11: Generate Content for Personas**
- [ ] Select Persona 1 (Analytical)
- [ ] Generate a post targeting this persona
- [ ] Review Segment Match Score
  - [ ] Should show high "Purchase Stage Alignment"
  - [ ] Should show high "EQ Trigger Fit"
  - [ ] Should provide improvement suggestions
- [ ] Check recommendations make sense
- [ ] Apply a recommended adjustment
- [ ] Regenerate content
- [ ] Verify: Score improved

**Expected:** Match scores 70%+, actionable recommendations

---

**Test 12: EQ Weight Adjustments**
- [ ] Navigate to Segment EQ Adjuster
- [ ] Select a persona
- [ ] Should see sliders for emotional triggers:
  - Fear, Trust, Security, Efficiency, etc.
- [ ] Adjust "Trust" to 90%
- [ ] Adjust "Fear" to 20%
- [ ] Generate content
- [ ] Verify: Content emphasizes trust, minimizes fear

**Expected:** Content adapts to EQ weights

---

### Priority 5: Platform Preview Testing (10 min)

**What:** Test platform-specific previews

**Test 13: Platform Previews**
- [ ] Create or edit a post
- [ ] Switch preview to "LinkedIn"
  - [ ] Check character count (max 3,000)
  - [ ] Verify professional tone
  - [ ] Check formatting
- [ ] Switch preview to "Instagram"
  - [ ] Check character count (max 2,200)
  - [ ] Verify visual/aspirational tone
  - [ ] Check hashtags
- [ ] Switch preview to "Facebook"
  - [ ] Check community focus
  - [ ] Verify conversational tone
- [ ] Switch preview to "Twitter"
  - [ ] Check character count (max 280)
  - [ ] Verify concise, punchy language

**Expected:** Each platform shows appropriate formatting and tone

---

### Priority 6: Performance Testing (10-15 min)

**What:** Test with realistic data volume

**Test 14: Load Testing**
- [ ] Create 10+ campaigns (use templates)
- [ ] Create 5+ personas
- [ ] Navigate between pages
- [ ] Monitor:
  - Page load times (< 2s)
  - Switching between campaigns (< 1s)
  - Generating new content (< 15s)
- [ ] Open browser DevTools → Performance tab
- [ ] Record performance during:
  - Campaign generation
  - Switching UI levels
  - Editing multiple pieces
- [ ] Check for:
  - [ ] Memory leaks (Memory tab)
  - [ ] Slow scripts (> 500ms)
  - [ ] Excessive re-renders

**Expected:** Smooth performance, no lag with 10+ campaigns

---

## Bug Reporting

If you find issues, document:

### Bug Template
```markdown
**Issue:** [Brief description]
**Steps to Reproduce:**
1.
2.
3.

**Expected:** [What should happen]
**Actual:** [What actually happened]
**Screenshots:** [If applicable]
**Browser:** [Chrome/Firefox/Safari + version]
**Console Errors:** [Copy from browser console]
```

**Report to:** `.buildrunner/BUGS_FOUND.md`

---

## Success Criteria

### Must Pass (Blocking)
- [ ] Onboarding completes without errors
- [ ] Can generate at least 1 campaign
- [ ] Can edit and save campaign pieces
- [ ] All 3 UI levels accessible
- [ ] No console errors during normal use

### Should Pass (Important)
- [ ] All 3 campaign templates generate quality content
- [ ] Segment match scores are accurate
- [ ] Platform previews render correctly
- [ ] Performance is acceptable (< 15s generation)

### Nice to Have (Optional)
- [ ] E2E tests pass automatically
- [ ] All personas create different content
- [ ] EQ adjustments visibly impact content

---

## Quick Test (If Short on Time)

**5-Minute Smoke Test:**
1. Start dev server
2. Complete onboarding
3. Generate 1 campaign
4. Edit 1 piece
5. Preview on mobile
6. Switch UI level
7. Verify no errors

**If this passes:** Core functionality works ✅

---

## After Testing

### Document Results
Create `.buildrunner/MANUAL_TEST_RESULTS.md`:

```markdown
# Manual Test Results

**Date:** 2025-11-22
**Tester:** [Your name]
**Duration:** [How long testing took]

## Results Summary
- E2E Tests: PASS/FAIL
- Campaign Quality: [Score]/10
- UI Levels: PASS/FAIL
- Segments: PASS/FAIL
- Performance: PASS/FAIL

## Issues Found
1. [Issue 1]
2. [Issue 2]

## Recommendations
- [Recommendation 1]
- [Recommendation 2]
```

---

**Ready to start?** Run `npm run dev` and begin with Priority 1!
