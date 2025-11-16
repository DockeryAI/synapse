# Week-by-Week Execution Plan to MVP Launch

**Goal:** Functional revenue-generating product in 4 weeks
**Strategy:** Maximum parallelization with git worktrees
**Target:** $99/mo tier ready by Week 4

---

## Week 1: Campaign Generation Core (60h, 5 parallel tracks)

**Objective:** Build the missing campaign workflow so customers can generate content

### Parallel Track 1: Campaign Type Selector (16h)
**Worktree:** `../synapse-campaign-selector`
**Branch:** `feature/campaign-selector`

**Deliverables:**
- Campaign type selection UI (Authority Builder, Social Proof, Local Pulse)
- AI recommendation logic ("Best for you" badge)
- Campaign type cards with descriptions
- Preview of what each campaign type generates

**Files to Create:**
- `src/components/campaign/CampaignTypeSelector.tsx`
- `src/components/campaign/CampaignTypeCard.tsx`
- `src/services/campaign/CampaignRecommender.ts`

**Dependencies:** None (uses existing DeepContext)

---

### Parallel Track 2: Smart Picks UI (16h)
**Worktree:** `../synapse-smart-picks`
**Branch:** `feature/smart-picks`

**Deliverables:**
- AI-curated campaign suggestions (3-5 options)
- One-click "Generate This Campaign" button
- Trust indicators (confidence scores, data sources used)
- Quick preview of campaign output

**Files to Create:**
- `src/components/campaign/SmartPicks.tsx`
- `src/components/campaign/SmartPickCard.tsx`
- `src/services/campaign/SmartPickGenerator.ts`

**Dependencies:** Campaign Type Selector (can work in parallel, merge after)

---

### Parallel Track 3: Content Mixer (16h)
**Worktree:** `../synapse-content-mixer`
**Branch:** `feature/content-mixer`

**Deliverables:**
- 3-column drag-and-drop interface
- Left: Available insights (categorized tabs: Local, Trending, Seasonal, Industry)
- Middle: Selected insights (drag here)
- Right: Live preview of generated content
- "Generate Campaign" button

**Files to Create:**
- `src/components/campaign/ContentMixer.tsx`
- `src/components/campaign/InsightPool.tsx`
- `src/components/campaign/InsightCard.tsx` (draggable)
- `src/components/campaign/LivePreview.tsx`

**Dependencies:** None (uses existing Synapse insights)

---

### Parallel Track 4: Campaign Preview/Approval (12h)
**Worktree:** `../synapse-campaign-preview`
**Branch:** `feature/campaign-preview`

**Deliverables:**
- Full campaign preview with all platforms
- Platform tabs (LinkedIn, Instagram, Facebook, etc.)
- Edit capabilities (regenerate sections)
- Approve/Reject workflow
- "Publish to SocialPilot" button

**Files to Create:**
- `src/components/campaign/CampaignPreview.tsx`
- `src/components/campaign/PlatformTabs.tsx`
- `src/components/campaign/EditSection.tsx`
- `src/services/campaign/CampaignApproval.ts`

**Dependencies:** None (works with existing content generators)

---

### Parallel Track 5: Campaign Orchestration Service (16h)
**Worktree:** `../synapse-campaign-orchestrator`
**Branch:** `feature/campaign-orchestrator`

**Deliverables:**
- Campaign workflow state machine
- Connect: Type Selection → Smart Picks/Mixer → Content Generation → Preview → Publish
- Error handling & recovery
- Progress tracking
- Save draft campaigns

**Files to Create:**
- `src/services/campaign/CampaignOrchestrator.ts`
- `src/services/campaign/CampaignWorkflow.ts`
- `src/services/campaign/CampaignState.ts`
- `src/types/campaign.types.ts`

**Dependencies:** Integrates all 4 tracks above

---

### Week 1 Integration Day (Friday, 4h)
**Task:** Merge all 5 worktrees into main
**Process:**
1. Test each worktree independently
2. Merge in order: Selector → Smart Picks → Mixer → Preview → Orchestrator
3. Integration testing
4. Bug fixes

**Outcome:** End-to-end campaign generation works

---

## Week 2: Product Scanner + UVP + Bannerbear (48h, 3 parallel tracks)

**Objective:** Add product intelligence and visual generation

### Parallel Track 1: Product/Service Scanner (16h)
**Worktree:** `../synapse-product-scanner`
**Branch:** `feature/product-scanner`

**Deliverables:**
- Extract products/services from website content
- Categorize offerings (products vs services)
- Detect pricing tiers if available
- Match to industry standards
- Store in `business_services` table

**Files to Create:**
- `src/services/intelligence/product-scanner.service.ts`
- `src/components/onboarding/ProductReview.tsx`
- `src/types/product.types.ts`

**Dependencies:** Website Analyzer (already built)

---

### Parallel Track 2: UVP Wizard Intelligence Integration (16h)
**Worktree:** `../synapse-uvp-integration`
**Branch:** `feature/uvp-integration`

**Deliverables:**
- Connect UVP Wizard to DeepContext
- Auto-populate wizard with discovered intelligence
- Validation mode (user confirms AI findings)
- Faster wizard completion (5 min vs 20 min)

**Files to Modify:**
- `src/contexts/UVPWizardContext.tsx`
- `src/components/onboarding-v5/` (various wizard steps)

**Dependencies:** Product Scanner

---

### Parallel Track 3: Bannerbear Template Integration (16h)
**Worktree:** `../synapse-bannerbear-v2`
**Branch:** `feature/bannerbear-integration`

**Deliverables:**
- Create 3 Bannerbear templates (Authority, Social Proof, Local)
- API integration for visual generation
- Visual preview in campaign preview
- Auto-generate visuals for campaigns
- Store in `generated_visuals` table

**Files to Create:**
- `src/services/visuals/bannerbear.service.ts` (enhance existing)
- `src/components/campaign/VisualPreview.tsx`
- `src/templates/bannerbear/` (template configs)

**Dependencies:** None (parallel with above)

---

### Week 2 Integration + Testing (Friday + Weekend, 8h)
**Tasks:**
- Merge all 3 tracks
- End-to-end testing
- Campaign generation with product data + visuals
- UVP wizard intelligence validation

**Outcome:** Complete campaign with visuals ready for publishing

---

## Week 3: Authentication + Billing + Polish (40h, 2 parallel tracks)

**Objective:** Enable user accounts and payments

### Parallel Track 1: Enable Authentication (24h)
**Worktree:** `../synapse-auth-enable`
**Branch:** `feature/auth-enable`

**Deliverables:**
- Uncomment auth code in App.tsx
- Apply database migration (already written)
- Create admin user
- Test login/signup flow
- Protected routes working
- User session management

**Files to Modify:**
- `src/App.tsx` (uncomment auth)
- Test all auth flows

**Hours Breakdown:**
- Enable auth: 1h
- Testing: 8h
- Bug fixes: 8h
- User session improvements: 7h

**Dependencies:** None (code already written)

---

### Parallel Track 2: Basic Stripe Billing (16h)
**Worktree:** `../synapse-billing-basic`
**Branch:** `feature/billing-basic`

**Deliverables:**
- Stripe Connect integration
- $99/mo subscription tier
- Payment page
- Webhook handling (subscription events)
- Basic usage limits (10 campaigns/month)

**Files to Create:**
- `src/services/billing/stripe.service.ts`
- `src/pages/BillingPage.tsx`
- `src/components/billing/SubscriptionCard.tsx`
- `supabase/functions/stripe-webhook/` (Edge Function)

**Dependencies:** Authentication must be enabled first

---

### Week 3 Polish & Testing (Friday, 8h)
**Tasks:**
- End-to-end user flow testing
- New user signs up → generates campaign → publishes
- Billing flow testing
- Bug fixes
- Performance optimization

**Outcome:** Can onboard paying customers

---

## Week 4: Content Marketing Features + Launch Prep (48h, 3 parallel tracks)

**Objective:** Add blog/landing page features for $199/mo tier

### Parallel Track 1: Blog Article Expander UI (16h)
**Worktree:** `../synapse-blog-ui`
**Branch:** `feature/blog-ui`

**Deliverables:**
- UI to expand social posts into blog articles
- Editor with formatting options
- SEO fields (meta title, description, keywords)
- Save to content calendar
- Export to WordPress/Ghost

**Files to Create:**
- `src/components/content/BlogExpander.tsx`
- `src/components/content/BlogEditor.tsx`
- `src/services/content/blog-export.service.ts`

**Dependencies:** Blog generator service (already built)

---

### Parallel Track 2: Landing Page Builder UI (16h)
**Worktree:** `../synapse-landing-ui`
**Branch:** `feature/landing-ui`

**Deliverables:**
- 5 landing page templates (Service, Product, Event, Webinar, Download)
- Template selector
- Form builder (lead capture)
- Preview & publish
- Store submissions in DB

**Files to Create:**
- `src/components/landing/LandingPageBuilder.tsx`
- `src/components/landing/TemplateSelector.tsx`
- `src/components/landing/FormBuilder.tsx`
- `src/services/landing/landing-page.service.ts`

**Dependencies:** Landing page generator (already built)

---

### Parallel Track 3: SEO Intelligence Dashboard (16h)
**Worktree:** `../synapse-seo-dashboard`
**Branch:** `feature/seo-dashboard`

**Deliverables:**
- Real-time SEO scoring for content
- Keyword density checker
- Local SEO analyzer
- Quick wins finder (page 2→1 opportunities)
- SEO suggestions panel

**Files to Create:**
- `src/components/seo/SEODashboard.tsx`
- `src/components/seo/SEOScorer.tsx`
- `src/components/seo/KeywordAnalyzer.tsx`
- `src/services/seo/seo-analyzer.service.ts`

**Dependencies:** SEMrush API (already integrated)

---

### Week 4 Final Integration + Launch (Friday + Weekend, 12h)
**Tasks:**
- Merge all features
- Full platform testing
- Create demo video
- Write launch announcement
- Set up support systems
- Monitor first customers

**Outcome:** MVP LAUNCHED - Ready to charge $99-199/mo

---

## Parallelization Strategy

### Maximum Concurrent Worktrees

**Week 1:** 5 worktrees (Campaign core)
```bash
git worktree add ../synapse-campaign-selector feature/campaign-selector
git worktree add ../synapse-smart-picks feature/smart-picks
git worktree add ../synapse-content-mixer feature/content-mixer
git worktree add ../synapse-campaign-preview feature/campaign-preview
git worktree add ../synapse-campaign-orchestrator feature/campaign-orchestrator
```

**Week 2:** 3 worktrees (Product + UVP + Visuals)
```bash
git worktree add ../synapse-product-scanner feature/product-scanner
git worktree add ../synapse-uvp-integration feature/uvp-integration
git worktree add ../synapse-bannerbear-v2 feature/bannerbear-integration
```

**Week 3:** 2 worktrees (Auth + Billing)
```bash
git worktree add ../synapse-auth-enable feature/auth-enable
git worktree add ../synapse-billing-basic feature/billing-basic
```

**Week 4:** 3 worktrees (Content features)
```bash
git worktree add ../synapse-blog-ui feature/blog-ui
git worktree add ../synapse-landing-ui feature/landing-ui
git worktree add ../synapse-seo-dashboard feature/seo-dashboard
```

---

## Safe Parallelization Guidelines

### ✅ Safe to Parallelize (No Conflicts)

**Week 1 - All 5 tracks:**
- Different component directories
- Different service files
- All integrate with existing DeepContext (read-only)
- No shared state modifications

**Week 2 - All 3 tracks:**
- Product Scanner: New service + DB writes
- UVP Integration: Modifies onboarding components
- Bannerbear: New service + visual components
- No file overlap

**Week 3 - Sequential preferred:**
- Auth must be enabled before billing (1h, then parallel)
- After auth enabled, billing can proceed in parallel

**Week 4 - All 3 tracks:**
- Blog UI: New components
- Landing UI: New components
- SEO Dashboard: New components
- No overlap

---

## Risk Mitigation

### Integration Risks

**Week 1 Risk:** Campaign orchestration depends on all 4 UI tracks
**Mitigation:**
- Build orchestrator last (after other 4 complete)
- Use stub interfaces if needed
- Friday integration day with buffer time

**Week 2 Risk:** UVP wizard modifications could break existing wizard
**Mitigation:**
- Make changes additive (enhance, don't replace)
- Maintain backward compatibility
- Feature flag for new intelligence mode

**Week 3 Risk:** Auth changes could break entire app
**Mitigation:**
- Test thoroughly before enabling
- Keep auth disabled until fully validated
- Rollback plan ready

**Week 4 Risk:** Too many features at once
**Mitigation:**
- Each feature is isolated
- Can launch without all 3 if needed
- Blog/Landing/SEO are independent

---

## Testing Strategy

### Daily Testing (30 min/day)
- Smoke test main branch
- Verify no regressions
- Test new features in worktrees

### Friday Integration Testing (4h each week)
- Merge all worktrees
- End-to-end flow testing
- Cross-feature integration
- Bug fixing

### Weekend Buffer (4-8h each week)
- Catch-up on delays
- Extra polish
- Performance optimization
- Documentation

---

## Week 5+ (Optional Polish Before Launch)

### Polish Track (Optional, 20h)
- Onboarding tutorial
- Help documentation
- Video tutorials
- Email templates (welcome, campaign ready, etc.)
- Error message improvements
- Loading state polish

### Pre-Launch Checklist
- [ ] Can create account
- [ ] Can subscribe ($99/mo)
- [ ] Can enter business URL
- [ ] Can select industry
- [ ] Can choose campaign type
- [ ] Can generate campaign (Smart Picks)
- [ ] Can customize campaign (Content Mixer)
- [ ] Can preview campaign
- [ ] Can publish to SocialPilot
- [ ] Can expand to blog article
- [ ] Can create landing page
- [ ] Can see SEO score
- [ ] Stripe webhooks working
- [ ] Usage limits enforced

---

## Success Metrics

### Week 1 Success
- ✅ Can select campaign type
- ✅ Can see Smart Picks
- ✅ Can use Content Mixer
- ✅ Can preview campaign
- ✅ End-to-end generation works

### Week 2 Success
- ✅ Product scanner extracts offerings
- ✅ UVP wizard uses intelligence
- ✅ Bannerbear generates visuals
- ✅ Campaign includes visuals

### Week 3 Success
- ✅ Users can create accounts
- ✅ Users can subscribe
- ✅ Stripe webhooks working
- ✅ Usage limits enforced

### Week 4 Success
- ✅ Blog expansion works
- ✅ Landing pages generate
- ✅ SEO scoring functional
- ✅ Ready to launch

---

## Timeline Summary

| Week | Focus | Hours | Tracks | Outcome |
|------|-------|-------|--------|---------|
| 1 | Campaign Core | 60 | 5 parallel | Campaign generation works |
| 2 | Product + UVP + Visuals | 48 | 3 parallel | Complete campaigns with visuals |
| 3 | Auth + Billing | 40 | 2 parallel | Can charge customers |
| 4 | Content Marketing | 48 | 3 parallel | $199/mo tier ready |
| **Total** | **To Launch** | **196h** | **13 worktrees** | **MVP Revenue-Ready** |

**Timeline:**
- Best case: 4 weeks (with full parallelization)
- Realistic: 5-6 weeks (with testing/polish)
- Conservative: 7-8 weeks (with buffer for issues)

---

## Post-Launch Roadmap (Weeks 6-12)

### Week 6-7: Video Capabilities (Phase 1C)
- Video editor (40h)
- Platform formatting (30h)
- Unlock $399/mo tier

### Week 8-10: Admin Operations (Phase 2A)
- Admin dashboard (46h)
- Content moderation (8h)
- Analytics (14h)
- Usage tracking (8h)

### Week 11-12: White-Label MVP (Phase 2B)
- Multi-tenant architecture (16h)
- Agency hierarchy (12h)
- Basic branding (10h)
- Subdomain support (8h)

---

## Recommendations

### Start Immediately (Week 1)
1. Create 5 worktrees for campaign core
2. Assign to different Claude instances if possible
3. Set Friday as integration day

### Week 2 Strategy
- Wait for Week 1 integration before starting Week 2
- If Week 1 delays, start product scanner in parallel

### Week 3 Caution
- Auth is critical - test heavily before enabling
- Billing must be perfect - double-check Stripe integration

### Week 4 Flexibility
- Can launch with just blog OR landing OR SEO (not all 3 required)
- Prioritize based on customer feedback from Week 3 beta

---

## Conclusion

**Path to Revenue:** 4 weeks of focused development
**Parallelization:** 13 worktrees across 4 weeks
**Risk Level:** Low (features are isolated)
**Launch Confidence:** High (intelligence engine already proven)

**Critical Success Factor:** Week 1 campaign workflow
**Without Week 1:** No product (can't generate campaigns)
**With Week 1:** Functional MVP (can start testing)

**Go-to-Market:** Week 4
**Revenue Target:** 10 customers @ $99/mo = $990 MRR by end of Week 5
**Break-even:** 3 customers ($297 > $275 API costs)

---

*Last Updated: 2025-11-15*
*Execution plan assumes 8-hour work days, 5 days/week*
*Buffer time included for testing, integration, and bug fixes*
