# Synapse Alpha Testing Guide

**Duration:** Thu-Fri (16 hours)
**Participants:** 5 SMB owners
**Goal:** Validate Weeks 1-5 functionality with real users

---

## Alpha Test Participants

### Target Mix:
1. **Local Business** (Restaurant, Salon, or Retail)
2. **E-commerce** (Online store, Shopify/WooCommerce)
3. **B2B/Professional Services** (Consultant, Agency, SaaS)
4. **Service Business** (Plumber, Contractor, Fitness)
5. **Content Creator** (Influencer, Blogger, Coach)

### Recruitment Criteria:
- Active on social media (at least 1-2 platforms)
- 1-50 employees (true SMB)
- Not currently using sophisticated marketing tools
- Willing to provide honest feedback
- Available for 2-3 hours of testing

---

## Alpha Test Accounts

**Setup:**
```
User 1: alpha-local@synapse-test.com / AlphaTest2025!
User 2: alpha-ecommerce@synapse-test.com / AlphaTest2025!
User 3: alpha-b2b@synapse-test.com / AlphaTest2025!
User 4: alpha-service@synapse-test.com / AlphaTest2025!
User 5: alpha-creator@synapse-test.com / AlphaTest2025!
```

**Database Setup:**
- [ ] Create 5 test accounts in Supabase
- [ ] Pre-load sample business data (optional)
- [ ] Set up analytics tracking for each user
- [ ] Enable feedback collection hooks

---

## Test Scenarios

### Scenario 1: Onboarding (30 minutes)

**Goal:** Complete onboarding in under 10 minutes

**Steps:**
1. Navigate to https://synapse.app (or localhost:5173)
2. Create account / sign in with test credentials
3. Enter business URL
4. Wait for DeepContext analysis
5. Complete UVP wizard
6. Review intelligence auto-population
7. Confirm business profile

**Success Metrics:**
- ✅ Onboarding completed in < 10 minutes
- ✅ DeepContext accurately analyzed business
- ✅ UVP wizard pre-populated correctly
- ✅ User understands their business profile

**Feedback Questions:**
- Was onboarding fast or slow?
- Was the UVP wizard confusing or clear?
- Did the AI understand your business?
- What was missing or unclear?

---

### Scenario 2: Campaign Creation (60 minutes)

**Goal:** Create complete campaign from goal → scheduled posts

**Steps:**
1. Click "Create Campaign"
2. Select goal (Authority, Community, Trust, Revenue, or Viral)
3. Review AI-suggested campaign type
4. Confirm platform selection (2-3 platforms)
5. Review campaign calendar preview
6. Edit 2-3 posts (test editing workflow)
7. Approve remaining posts
8. Schedule campaign to SocialPilot
9. View benchmark dashboard
10. Test AI chat widget (ask questions)

**Success Metrics:**
- ✅ Goal selection was intuitive
- ✅ AI suggestion made sense
- ✅ Platform selection matched business type
- ✅ Calendar showed 5-14 day campaign
- ✅ Posts were editable and relevant
- ✅ Benchmarks were understandable
- ✅ AI chat widget responded helpfully

**Feedback Questions:**
- Did the campaign types make sense?
- Were the AI suggestions helpful?
- Was platform selection clear?
- Were the generated posts relevant?
- Could you easily edit posts?
- Did benchmarks help you understand "what good looks like"?
- Did you use the AI chat? Was it helpful?

---

### Scenario 3: Immediate Win Tactics (30 minutes)

**Goal:** Test copy-paste tactics for immediate value

**Steps:**
1. Navigate to "Immediate Win Tactics" (or similar section)
2. Test UGC contest generator
3. Test hashtag formula builder (3+10+5)
4. Test email capture landing page
5. Test seasonal calendar
6. Ask AI chat: "Give me campaign ideas for [business type]"

**Success Metrics:**
- ✅ UGC contest template generated correctly
- ✅ Hashtag formula made sense
- ✅ Email capture page looked professional
- ✅ Seasonal calendar showed relevant opportunities
- ✅ AI provided actionable campaign ideas

**Feedback Questions:**
- Would you actually use these tactics?
- Was the value clear?
- Were instructions easy to follow?
- What tactics were missing?

---

### Scenario 4: Mobile Experience (30 minutes)

**Goal:** Test full workflow on mobile device

**Steps:**
1. Open Synapse on mobile (iPhone or Android)
2. Create campaign on mobile
3. Edit posts on mobile
4. Test mobile preview mode
5. Test thumb-scroll stopping test
6. Test AI chat widget on mobile
7. Test voice input in AI chat

**Success Metrics:**
- ✅ All features work on mobile
- ✅ Mobile preview is accurate
- ✅ Thumb-scroll test runs smoothly
- ✅ AI chat is usable on mobile
- ✅ Voice input works

**Feedback Questions:**
- Was mobile experience smooth or frustrating?
- Could you complete everything on mobile?
- Did mobile preview help?
- Did voice input work well?

---

### Scenario 5: Performance & Benchmarks (30 minutes)

**Goal:** Understand benchmark dashboard and Day 3 pivots

**Steps:**
1. View benchmark dashboard
2. Review engagement benchmarks (FB 1-2%, IG 2-3%, etc.)
3. Review ad cost benchmarks (Stories $0.50-$2 CPM)
4. Review conversion benchmarks (Social→Email 2-5%)
5. Simulate Day 3 checkpoint (mock low engagement)
6. Review pivot recommendations
7. Ask AI chat: "Why am I below average?" (if applicable)

**Success Metrics:**
- ✅ Benchmarks were clear and understandable
- ✅ User understands "what good looks like"
- ✅ Day 3 pivot logic makes sense
- ✅ Pivot recommendations are actionable
- ✅ AI explains benchmarks clearly

**Feedback Questions:**
- Did benchmarks help you understand performance?
- Were Day 3 pivots helpful or confusing?
- Did you understand what to improve?
- Did AI chat explain benchmarks clearly?

---

## Feedback Collection

### Tools:

**1. Google Form** (Post-Test Survey)
- Overall satisfaction (1-5 stars)
- Likelihood to recommend (NPS score)
- Most valuable features (select multiple)
- Most confusing features (select multiple)
- Missing features (open text)
- General feedback (open text)

**2. Loom Videos** (During Testing)
- Ask users to record screen + voice while testing
- Capture real-time reactions and confusion
- Review videos for UX issues

**3. One-on-One Interviews** (After Testing - 30 min each)
- Scheduled Zoom/call with each alpha tester
- Dig deeper into feedback
- Understand business context
- Identify critical issues vs nice-to-haves

---

## Critical Issue Criteria

**Block Beta Launch:**
- Onboarding fails or takes > 15 minutes
- Campaign creation broken or extremely confusing
- Mobile experience completely broken
- AI chat doesn't work
- Major data loss or security issues

**Fix Before Beta (Not Blockers):**
- Minor UX improvements
- Wording/copy clarifications
- Edge case bugs
- Performance optimizations

**Post-Beta (Nice-to-Haves):**
- Feature requests
- Advanced functionality
- UI polish
- Additional integrations

---

## Alpha Testing Schedule

### Thursday (8 hours)
- **9-11 AM:** Test with User 1 (Local Business)
- **11 AM-12 PM:** Review feedback, take notes
- **12-2 PM:** Test with User 2 (E-commerce)
- **2-3 PM:** Review feedback, take notes
- **3-5 PM:** Test with User 3 (B2B/Professional)
- **5-6 PM:** Review feedback, analyze patterns

### Friday (8 hours)
- **9-11 AM:** Test with User 4 (Service Business)
- **11 AM-12 PM:** Review feedback, take notes
- **12-2 PM:** Test with User 5 (Content Creator)
- **2-3 PM:** Review all feedback, identify patterns
- **3-5 PM:** Fix critical issues in main branch
- **5-6 PM:** Prepare beta launch materials

---

## Post-Alpha Deliverables

1. **Feedback Analysis Document**
   - Common pain points
   - Feature gaps
   - Critical issues
   - Nice-to-haves
   - Quotes from users

2. **Critical Issue Fixes**
   - List of issues fixed
   - PRs/commits for each fix
   - Re-test confirmation

3. **Beta Launch Plan**
   - Beta user list (20-30 SMBs)
   - Beta onboarding email
   - Demo video (Loom)
   - Feedback collection process
   - Weekly check-in schedule

4. **Updated Roadmap**
   - Post-beta features (based on alpha feedback)
   - Timeline for public launch
   - Feature prioritization

---

## Success Criteria

**Alpha testing is successful if:**
- ✅ 4 out of 5 users complete onboarding successfully
- ✅ 4 out of 5 users create at least one campaign
- ✅ Average satisfaction score ≥ 4/5
- ✅ No critical blockers discovered
- ✅ Clear feedback patterns identified
- ✅ Users express excitement about the product
- ✅ At least 3 users say they would use this regularly

**Ready for beta launch if:**
- All critical issues fixed
- Mobile experience functional
- AI chat working reliably
- Campaign creation flow smooth
- Benchmarks clearly communicated
- Demo video prepared
- 20-30 beta users recruited

---

## Next: Beta Launch (Week 6+)

After successful alpha testing:
1. Recruit 20-30 beta users
2. Send beta onboarding email
3. Provide demo video and getting started guide
4. Set up weekly feedback sessions
5. Monitor usage and performance
6. Iterate based on feedback
7. Prepare for public launch (4-6 weeks after beta)
