# Week 7 Build Prompts: Discovery-First Smart Onboarding

**Total Duration:** 14 hours (2 parallel worktrees + integration)
**Approach:** Discovery Intelligence as WOW factor + Path Flexibility

---

## Prompt 1: Smart Detection Engine (Mon-Tue, 8h)

**Worktree:** `feature/smart-uvp-detection`

```
Build the Smart UVP Detection system with SOURCE VERIFICATION - CORE PRINCIPLE: NEVER FABRICATE DATA

CORE AUTHENTICITY PRINCIPLE:
- ALL extracted data MUST include source URL attribution
- NO fabricated statistics, facts, or stories allowed
- Content generation BLOCKED without verified sources
- This principle enforces authenticity across entire platform

REQUIREMENTS:
1. Create SmartUVPExtractor.ts service that extends existing website analyzer
2. Extract and return with confidence scores AND SOURCE URLS:
   - Customer types (from targeting language, "we serve", "for" statements) + SOURCE URL
   - Services/products (from navigation, services pages, product listings) + SOURCE URL
   - Problems solved (from headlines, value props, pain point statements) + SOURCE URL
   - Testimonials/success stories (from reviews, case studies, testimonials) + SOURCE URL
   - Differentiators (from "why us", "unique", competitive positioning) + SOURCE URL

   Data structure example:
   {
     text: "Small business owners",
     confidence: 0.85,
     sourceUrl: "https://example.com/about",
     sourceContext: "Found in 'Who We Serve' section"
   }

3. Create SourceVerificationService.ts:
   - Validates all AI-generated content has source attribution
   - Blocks content without verified sources
   - Enforces authenticity principle platform-wide
   - Provides "verifyContent()" and "requiresSource()" methods

4. Create SmartConfirmation.tsx component:
   - Display extracted data in 3 collapsible sections WITH SOURCE LINKS
   - Each item shows: Checkbox + Text + Confidence + "View Source" link
   - "View Source" opens source URL in new tab
   - Checkboxes for each extracted item with confidence indicators
   - "Add custom" button for each section
   - "Skip" option on every section
   - Mobile-responsive, green theme, card-based design
   - Real-time preview updates as user confirms/changes
   - Source attribution visible for transparency

5. Create QuickRefinement.tsx modal:
   - Priority selector: "Which is your #1 customer?" (radio buttons)
   - Differentiator: Show 3 AI-generated suggestions (source-verified) + custom input
   - Success story: Pre-filled with best testimonial (with source) or quick text input
   - All fields optional and pre-populated
   - Clean, fast UI - should take < 10 seconds to complete

INTEGRATION:
- Use existing DeepContextBuilder for website analysis
- Use OpenRouter AI for extraction intelligence
- Wire extracted UVP data WITH SOURCE ATTRIBUTION into campaign generation context
- Store confidence scores AND source URLs for quality and transparency
- SourceVerificationService validates all AI outputs

DELIVERABLES:
- SmartUVPExtractor.ts (~450 lines - includes source tracking)
- SourceVerificationService.ts (~200 lines)
- SmartConfirmation.tsx (~400 lines - includes source links UI)
- QuickRefinement.tsx (~250 lines)
- smart-uvp.types.ts (~250 lines - includes source fields)

TESTING:
- Test with thephoenixinsurance.com (insurance)
- Test with local restaurant site
- Test with B2B SaaS site
- Verify >70% extraction accuracy
- Verify ALL extracted data has source URLs
- Verify "View Source" links work correctly
- Test SourceVerificationService blocks unverified content
```

---

## Prompt 2: Path Selection & Content Generation (Wed-Thu, 6h)

**Worktree:** `feature/path-selection`

```
Build the path selection flow with SOURCE VERIFICATION for all content types:

CORE AUTHENTICITY PRINCIPLE (APPLIES TO ALL COMPONENTS):
- Customer Success Stories REQUIRE user input or source link - NO FABRICATION
- All facts, statistics, and claims must have verified sources
- Service/Product/Problem/Differentiator content uses source-verified data from Worktree 1
- Content generation validates sources before allowing save/copy

REQUIREMENTS:
1. Create OnboardingFlow.tsx landing page:
   - Single large URL input field (centered, prominent)
   - Progressive status indicators that update during detection:
     * "Analyzing website..."
     * "Finding services..."
     * "Identifying customers..."
     * "Analyzing competitors..."
   - Auto-transition to SmartConfirmation when detection completes
   - Remove ALL manual form fields (industry, location, etc.)
   - Mobile-first design with thumb-friendly targets

2. Create PathSelector.tsx component:
   - Two clear path options presented as cards:
     * "Generate Full Campaign" - Multi-post calendar with scheduling
     * "Create Single Post" - Quick single piece of content
   - Show benefits of each path with icons
   - Clean, mobile-friendly selection interface
   - Triggers appropriate flow based on selection

3. Create SinglePostTypeSelector.tsx component with SOURCE REQUIREMENTS:
   - 5 post types based on best practices guide:
     * **Customer Success Story** - REQUIRES CustomerStoryInputModal (see below)
       - Badge: "User Input Required"
       - Clicking opens modal to capture real story details
     * Service Spotlight (uses verified website data with source attribution)
       - Badge: "Source Verified"
     * Problem/Solution Post (uses verified pain points with source attribution)
       - Badge: "Source Verified"
     * Value Proposition Post (uses verified differentiators with source attribution)
       - Badge: "Source Verified"
     * Community Engagement (fact-based questions only, no fabricated stats)
       - Badge: "Fact-Based"
   - Each type shows mini preview example
   - Source requirement badges displayed prominently
   - Clear descriptions of when to use each type
   - Maps selections to content generation prompts with source validation

4. Create CustomerStoryInputModal.tsx component:
   - Modal with two input options (tabs):
     TAB 1: Manual Entry
       - Customer name (required)
       - Problem they faced (required)
       - Solution you provided (required)
       - Results achieved (required - specific numbers/outcomes)
       - Optional: Testimonial quote, date
     TAB 2: Source Link
       - URL input field
       - "Fetch details" button extracts info from link
       - Validates URL points to real testimonial/review/case study
   - Form validation: All fields required OR valid source link provided
   - "Save Story" button disabled until requirements met
   - Clear message: "We never fabricate customer stories. Please provide real details."

5. Create ContentPreview.tsx component with SOURCE ATTRIBUTION:
   - Display generated content (campaign OR single post)
   - **Source attribution section visible for ALL content:**
     - "Sources:" with list of URLs/references used
     - "View Sources" expandable section
     - Authenticity badge: "All facts verified"
   - For campaigns: Show calendar view with all posts
   - For single posts: Show single post preview card
   - "Copy & Post Now" button (uses Clipboard API)
   - "Save to Calendar" button (integrates with calendar system)
   - Email capture modal after save
   - Success state with full calendar access

FLOW:
URL Input → Detection (5s) → Smart Confirmation (10s) → Quick Refinement (10s)
→ Path Selection (5s) → [Campaign OR Single Post Type] →
  IF Customer Success Story: CustomerStoryInputModal → Generate (5s)
  ELSE: Generate (5s)
→ Preview & Save with Source Attribution (10s) → Email Capture

INTEGRATION:
- Use SmartUVPExtractor WITH SOURCE DATA from Worktree 1
- Use SourceVerificationService from Worktree 1 to validate all content
- Campaign path: Use CampaignTypeEngine for auto-selection (source-verified)
- Single post path: Use content generation + calendar integration (source-verified)
- Wire both paths to orchestration layer
- Wire email capture to Supabase (store source attribution)
- Ensure calendar system handles both campaigns and single posts

DELIVERABLES:
- OnboardingFlow.tsx (~250 lines)
- PathSelector.tsx (~200 lines)
- SinglePostTypeSelector.tsx (~300 lines - includes source badges)
- CustomerStoryInputModal.tsx (~350 lines - NEW)
- ContentPreview.tsx (~350 lines - includes source attribution UI)

TESTING:
- Full 45-second flow test for both paths
- Campaign path: Verify CampaignTypeEngine integration with sources
- Single post path: Verify all 5 post types generate correctly
  * Customer Success Story: Test modal with both manual entry AND source link
  * Other types: Verify source attribution displayed
- Verify CustomerStoryInputModal blocks submission without complete data
- Verify ContentPreview shows source attribution for all content
- Calendar integration for both paths
- Mobile responsiveness check
- Copy-to-clipboard verification
- Email capture success rate
- SOURCE VERIFICATION: Test that content cannot be generated without sources
```

---

## Prompt 3: Integration & Polish (Fri, 2h)

**Merge both worktrees into main**

```
Integrate Smart UVP Detection + Path Selection and polish the complete experience:

TASKS:
1. Merge both worktrees:
   - feature/smart-uvp-detection → main
   - feature/path-selection → main
   - Resolve any conflicts

2. Update routing:
   - Set OnboardingFlow.tsx as default landing page
   - Update App.tsx routes
   - Add proper navigation flow

3. Wire up connections:
   - SmartUVPExtractor → SmartConfirmation → QuickRefinement
   - QuickRefinement → PathSelector
   - Campaign path: PathSelector → CampaignTypeEngine → ContentPreview
   - Single post path: PathSelector → SinglePostTypeSelector → ContentPreview
   - ContentPreview → Calendar integration (both paths)
   - ContentPreview → Email Capture → Supabase

4. Integration with existing systems AND SOURCE VERIFICATION:
   - Wire Campaign path to CampaignTypeEngine (with source verification)
   - Wire Single post path to content generation services (with source verification)
   - Ensure both paths integrate with calendar system
   - Connect orchestration layer for scheduling
   - **CRITICAL:** Apply SourceVerificationService to ALL content generation across platform
   - Update existing campaign creation to include source attribution
   - Verify existing features now show source links

5. Create email_captures table WITH SOURCE TRACKING:
   - Email, website, industry, detected_uvp (with sources), content_preview (campaign or post), path_chosen, source_urls (JSONB array)
   - Add RLS policies for data security

6. Add analytics:
   - Track funnel conversion: URL → Confirmation → Refinement → Path Choice → Email
   - Track which path users choose (campaign vs single post)
   - Track time-to-value metric
   - Track email capture rate by path

7. Polish & test SOURCE VERIFICATION ENFORCEMENT:
   - Test complete 45-second flow end-to-end for BOTH paths
   - Campaign path: Verify CampaignTypeEngine creates full campaign WITH SOURCES
   - Single post path: Test all 5 post types
     * Customer Success Story: Verify modal BLOCKS without complete data
     * Other types: Verify source attribution displayed
   - **CRITICAL SOURCE TESTS:**
     * Verify SourceVerificationService blocks content without sources
     * Try to generate content with fabricated data - should be blocked
     * Verify all "View Source" links work correctly
     * Verify source attribution displayed in ALL generated content
   - Verify calendar shows content correctly for both paths
   - Verify mobile experience (iOS + Android)
   - Check all copy buttons work
   - Verify email capture stores correctly WITH source URLs
   - Test with 3 different business types
   - Test existing features to ensure source verification applies platform-wide

8. Clean up:
   - Remove old multi-field onboarding form
   - Remove unused imports
   - Update documentation
   - Remove worktrees

DELIVERABLES:
- Fully integrated onboarding flow with path flexibility
- Campaign path integrated with CampaignTypeEngine
- Single post path integrated with calendar
- Email capture working for both paths
- Analytics tracking active
- All tests passing
- Documentation updated

SUCCESS CRITERIA:
- [ ] URL to first content in < 45 seconds (both paths)
- [ ] Campaign path generates full campaign via CampaignTypeEngine WITH SOURCES
- [ ] Single post path generates all 5 post types correctly WITH SOURCE VERIFICATION
- [ ] Customer Success Story REQUIRES user input or source link (no fabrication possible)
- [ ] SourceVerificationService blocks ALL content without verified sources
- [ ] Source attribution displayed in ALL generated content
- [ ] "View Source" links work for all extracted data
- [ ] Both paths integrate with calendar system
- [ ] Zero manual typing required (except Customer Success Story details)
- [ ] Mobile responsive and fast
- [ ] Email capture functional and stores source URLs
- [ ] Works for e-commerce, local, and B2B sites
- [ ] **AUTHENTICITY ENFORCED:** Cannot generate fabricated content anywhere in platform
```

---

## Build Order

**Day 1-2 (Parallel):**
- Run Prompt 1 in one Claude instance
- Run Prompt 2 in another Claude instance

**Day 3:**
- Run Prompt 3 to integrate everything

**Total:** 3 prompts, 14 hours, 2 parallel builds + integration

---

## Quick Start Commands

**Setup Worktree 1:**
```bash
git worktree add ../synapse-smart-detection feature/smart-uvp-detection
cd ../synapse-smart-detection
npm install
```

**Setup Worktree 2:**
```bash
git worktree add ../synapse-path-selection feature/path-selection
cd ../synapse-path-selection
npm install
```

**After completion:**
```bash
cd /path/to/synapse
git merge feature/smart-uvp-detection --no-edit
git merge feature/path-selection --no-edit
git worktree remove ../synapse-smart-detection
git worktree remove ../synapse-path-selection
```

---

## Expected Output

**Before Week 7:**
- User fills 5+ form fields manually
- Industry selection required
- Location entry required
- Platform selection required
- 3-5 minutes to first value

**After Week 7:**
- User enters URL only
- Discovery intelligence creates WOW moment
- Quick confirmations (optional)
- Choose campaign OR single post
- 45 seconds to copy-ready content
- Calendar integration for both paths
- Email captured at peak excitement
