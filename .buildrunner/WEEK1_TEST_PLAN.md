# Week 1 Campaign Workflow - Test Plan

**Test Date:** 2025-11-15
**Test URL:** http://localhost:3002/campaign/new?businessId=demo
**Dev Server:** Running on port 3002

---

## 🧪 Test Objectives

1. Verify end-to-end campaign workflow functionality
2. Test AI campaign type recommendations
3. Validate Smart Picks vs Content Mixer paths
4. Confirm real content generation working
5. Check multi-platform preview
6. Verify database persistence
7. Identify any UX issues or bugs

---

## 📋 Pre-Test Checklist

- ✅ Dev server running on http://localhost:3002/
- ✅ Campaign page accessible at `/campaign/new`
- ✅ All components compiled successfully
- ✅ Database connection available
- ✅ OpenRouter API key configured (for content generation)

---

## 🔍 Test Scenarios

### Test 1: Campaign Type Selection

**URL:** http://localhost:3002/campaign/new?businessId=demo

**Steps:**
1. Navigate to campaign creation page
2. Observe AI campaign type recommendation
3. Review confidence scores for each type
4. Click on different campaign types to see previews
5. Select recommended campaign type

**Expected Results:**
- ✅ Page loads without errors
- ✅ AI recommendation badge visible
- ✅ Confidence scores displayed (0-100%)
- ✅ "Why this type?" reasoning shown
- ✅ Three campaign types visible: Authority Builder, Social Proof, Local Pulse
- ✅ Progress indicator shows 20% after selection

**What to Check:**
- Are the recommendations sensible based on demo business data?
- Is the reasoning clear and compelling?
- Do the campaign type descriptions make sense?
- Is the UI intuitive?

---

### Test 2: Smart Picks Path

**Pre-requisite:** Campaign type selected

**Steps:**
1. Click "Smart Picks" option
2. Review 3-5 AI-curated campaign recommendations
3. Read the insights and reasoning for each pick
4. Note the confidence scores
5. Click "Generate This Campaign" on one pick
6. Wait for generation to complete

**Expected Results:**
- ✅ Smart Picks interface loads
- ✅ 3-5 picks displayed with cards
- ✅ Each pick shows insights, reasoning, confidence
- ✅ "Generate This Campaign" button visible
- ✅ Loading spinner during generation
- ✅ Transitions to preview after ~5-10 seconds
- ✅ Progress indicator shows 60% → 80%

**What to Check:**
- Are Smart Picks compelling and relevant?
- Do confidence scores seem reasonable?
- Is the reasoning clear?
- Does generation complete successfully?
- Are there any errors in console?

---

### Test 3: Content Mixer Path (Alternative)

**Pre-requisite:** Campaign type selected

**Steps:**
1. Click "Content Mixer" option
2. Browse insights by category tabs
3. Drag 3-5 insights to selection area
4. Observe character count updates
5. Reorder insights via drag-and-drop
6. Remove an insight
7. Click "Generate Campaign"
8. Wait for generation

**Expected Results:**
- ✅ Content Mixer 3-column layout visible
- ✅ Left column: Categorized insights (Local, Trending, Seasonal, etc.)
- ✅ Middle column: Selection area with drop zone
- ✅ Right column: Live preview
- ✅ Drag-and-drop working smoothly
- ✅ Character count updating in real-time
- ✅ Progress bar showing selection count (0-5)
- ✅ Generation triggers successfully
- ✅ Transitions to preview after generation

**What to Check:**
- Is drag-and-drop intuitive?
- Do insights categorize correctly?
- Does live preview update?
- Can insights be reordered?
- Does removal work?
- Any console errors?

---

### Test 4: Multi-Platform Preview

**Pre-requisite:** Campaign generated successfully

**Steps:**
1. Review LinkedIn tab content
2. Switch to Facebook tab
3. Switch to Instagram tab
4. Switch to Twitter tab
5. Check character counts for each platform
6. Note headline, hook, body, CTA sections
7. Observe any character limit warnings

**Expected Results:**
- ✅ All 4 platform tabs visible and clickable
- ✅ Content displays for each platform
- ✅ Content is DIFFERENT per platform (tone, length)
- ✅ Character counts accurate
- ✅ Headlines are attention-grabbing
- ✅ Hooks create emotional connection
- ✅ Body content is flowing narrative (NOT bullet points)
- ✅ CTAs are clear and specific
- ✅ Hashtags appropriate per platform

**What to Check:**
- Does content quality feel "premium"?
- Is tone appropriate per platform?
  - LinkedIn: Professional yet personable
  - Facebook: Friendly and conversational
  - Instagram: Inspiring and visual
  - Twitter: Punchy and provocative
- Are character limits respected?
- Does content reference the selected insights?
- Would you publish this content?

---

### Test 5: Campaign Approval

**Pre-requisite:** Reviewing campaign preview

**Steps:**
1. Click "Approve Campaign" button
2. Observe confirmation message
3. Check if redirected to content calendar
4. Verify campaign saved to database

**Expected Results:**
- ✅ Approve button clickable
- ✅ Confirmation alert/message appears
- ✅ Redirect to `/content-calendar` (or success page)
- ✅ Campaign persisted to `marketing_campaigns` table
- ✅ Content pieces saved to `content_pieces` table
- ✅ State transitions to APPROVED
- ✅ Progress indicator shows 100%

**What to Check:**
- Does approval complete without errors?
- Is confirmation clear?
- Can you find the campaign in database?
- Does the workflow feel complete?

---

### Test 6: Error Handling

**Steps:**
1. Test without internet connection (if using real APIs)
2. Try to generate with no insights selected
3. Try to approve before generating
4. Refresh page mid-workflow

**Expected Results:**
- ✅ Graceful error messages
- ✅ Recovery options provided
- ✅ No crashes or blank screens
- ✅ Session recovery from localStorage works
- ✅ Console errors are meaningful

**What to Check:**
- Are error messages helpful?
- Can user recover from errors?
- Does session state persist across refreshes?

---

## 📊 Quality Checklist

### Content Quality (Rate 1-5)
- [ ] Headlines are attention-grabbing (Target: 4+)
- [ ] Hooks create emotional connection (Target: 4+)
- [ ] Body is flowing narrative, not bullets (Target: 4+)
- [ ] CTAs are clear and compelling (Target: 4+)
- [ ] Hashtags are relevant (Target: 4+)
- [ ] Overall professional quality (Target: 4+)

### UX Quality (Rate 1-5)
- [ ] Workflow is intuitive (Target: 4+)
- [ ] Loading states are clear (Target: 4+)
- [ ] Error handling is helpful (Target: 4+)
- [ ] Progress tracking is accurate (Target: 4+)
- [ ] Navigation is smooth (Target: 4+)
- [ ] Design is polished (Target: 4+)

### Technical Quality (Pass/Fail)
- [ ] No console errors (Pass/Fail)
- [ ] No TypeScript errors (Pass/Fail)
- [ ] Database saves working (Pass/Fail)
- [ ] API calls successful (Pass/Fail)
- [ ] State management working (Pass/Fail)
- [ ] Performance acceptable (<3s generation) (Pass/Fail)

---

## 🐛 Bug Tracking Template

If you find issues, document them here:

### Bug #1
- **Severity:** Critical / High / Medium / Low
- **Component:** Campaign Type Selector / Smart Picks / Content Mixer / Preview / Approval
- **Description:**
- **Steps to Reproduce:**
- **Expected Behavior:**
- **Actual Behavior:**
- **Console Errors:**
- **Screenshots:**

---

## ✅ Test Results Summary

**Test Execution Date:** _____________

### Overall Status
- [ ] All tests passed
- [ ] Some tests failed (see bugs above)
- [ ] Workflow is ready for alpha testing
- [ ] Workflow needs fixes before testing

### Workflow Completion Time
- Start to finish: ______ minutes
- Target: 5-10 minutes

### Content Quality Rating
- Overall: _____ / 5
- Would publish as-is: Yes / No / With minor edits

### UX Rating
- Overall intuitiveness: _____ / 5
- Likelihood to recommend: _____ / 10

### Critical Issues Found
- Count: ______
- Description:

### Nice-to-Have Improvements
- Count: ______
- Description:

---

## 🚀 Next Actions

Based on test results:

**If All Tests Pass:**
- [ ] Proceed with alpha testing (3-5 users)
- [ ] Create test script for alpha testers
- [ ] Set up feedback collection
- [ ] Start Week 2 development

**If Issues Found:**
- [ ] Prioritize critical bugs
- [ ] Create GitHub issues for tracking
- [ ] Fix critical issues before alpha
- [ ] Re-test after fixes

---

## 📝 Testing Notes

Use this space for any additional observations during testing:

```
[Notes here]
```

---

**Tester Name:** _____________
**Date Completed:** _____________
**Time Spent Testing:** _____________

