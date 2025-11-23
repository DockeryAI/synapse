# Week 7: Discovery-First Smart Onboarding

**Goal:** Transform first-time user experience with Discovery Intelligence as WOW factor
**Duration:** 14 hours (2 parallel worktrees)
**Approach:** Discovery-first with path flexibility (Campaign OR Single Post)

---

## User Journey (Target: 45 seconds to value)

**0-5 sec:** URL input → Auto-detection begins
**5-15 sec:** WOW MOMENT → Show extracted intelligence with confidence scores (customers, services, problems, testimonials, differentiators)
**15-25 sec:** Quick confirmation → User confirms/adjusts discovered data
**25-30 sec:** Choose path → "Generate Full Campaign" OR "Create Single Post" (with type selection)
**30-45 sec:** Preview & save → Generated content with calendar integration + email capture

---

## Worktree 1: Smart Detection Engine (Mon-Tue, 8h)

**Branch:** `feature/smart-uvp-detection`
**Location:** `../synapse-smart-detection`

### Tasks:

#### 1. Enhanced Website Analyzer with Source Attribution (3.5h)
- **File:** `src/services/uvp/SmartUVPExtractor.ts`
- Extend existing website analyzer to extract WITH SOURCE URLS:
  - Customer types (from "we serve", "for", targeting language) + source URL
  - Services/products (from menu, services page, product listings) + source URL
  - Problems solved (from headlines, value props, pain points) + source URL
  - Testimonials/success stories (from reviews, case studies) + source URL
  - Differentiators (from "why us", "unique", competitive language) + source URL
- Return structured data with confidence scores AND source attribution
- **Core Principle:** NEVER fabricate data - all extractions must include source
- **Integrates with:** Existing DeepContext service

#### 1b. Source Verification Service (0.5h)
- **File:** `src/services/uvp/SourceVerificationService.ts`
- Validates all AI-generated content has sources
- Blocks content without verified sources
- Enforces authenticity principle across entire platform

#### 2. Smart Confirmation UI Component (3h)
- **File:** `src/components/onboarding/SmartConfirmation.tsx`
- Display extracted data in 3 sections WITH SOURCE LINKS:
  - Customer segments (checkboxes, source link, add button)
  - Services/products (checkboxes, source link, add button)
  - Problems solved (checkboxes, source link, add button)
- Each item has confidence indicator AND "View Source" link
- "Skip" button on each section
- Real-time content preview updates on changes
- **Design:** Green theme, card-based, mobile-responsive
- **Authenticity:** Show source attribution for transparency

#### 3. Quick Refinement Modal (2h)
- **File:** `src/components/onboarding/QuickRefinement.tsx`
- Priority selector: "Which is your #1 customer?"
- Differentiator: 3 AI suggestions + custom input
- Success story: Extracted testimonial or quick text field
- All optional, all pre-filled
- **Integration:** Feeds into UVP context for content generation

---

## Worktree 2: Path Selection & Content Generation (Wed-Thu, 6h)

**Branch:** `feature/path-selection`
**Location:** `../synapse-path-selection`

### Tasks:

#### 1. Streamlined Landing Page (1.5h)
- **File:** `src/pages/OnboardingFlow.tsx`
- Single URL input (large, centered)
- Progressive status indicators:
  - "Analyzing website..."
  - "Finding services..."
  - "Identifying customers..."
  - "Analyzing competitors..."
- Auto-transitions to Smart Confirmation
- Remove all manual form fields

#### 2. Path Selection Component (1.5h)
- **File:** `src/components/onboarding/PathSelector.tsx`
- Two clear options:
  - "Generate Full Campaign" (multi-post, scheduled calendar)
  - "Create Single Post" (quick, immediate value)
- Show benefits of each path
- Triggers different flows based on selection

#### 3. Single Post Type Selector with Source Requirements (2h)
- **File:** `src/components/onboarding/SinglePostTypeSelector.tsx`
- 5 post types from best practices:
  - **Customer Success Story** - REQUIRES CustomerStoryInputModal
    - Modal captures: Customer name, problem, solution, results, OR source link
    - NO FABRICATION ALLOWED
  - Service Spotlight (uses verified website data)
  - Problem/Solution Post (uses verified pain points)
  - Value Proposition Post (uses verified differentiators)
  - Community Engagement (fact-based questions)
- Each shows preview example
- Source requirements displayed
- Maps to best practices guide

#### 3b. Customer Story Input Modal (0.5h)
- **File:** `src/components/onboarding/CustomerStoryInputModal.tsx`
- Two input options:
  - Manual entry: Customer name, problem faced, solution, results
  - Source link: Paste URL to testimonial/review/case study
- Form validation: All fields required OR valid source link
- Prevents fabricated stories

#### 4. Content Preview & Save with Source Attribution (2h)
- **File:** `src/components/onboarding/ContentPreview.tsx`
- Display generated content (campaign or single post)
- **Show source attribution** for all facts/statistics
- Source links displayed in metadata section
- Integrates with calendar for scheduling
- "Copy & Post Now" button (clipboard API)
- "Save to Calendar" button
- Email capture modal
- Success state with calendar view
- **Authenticity badge:** "All content verified from sources"

---

## Integration Tasks (Fri, 2h)

### Merge & Polish
1. Update routing to new onboarding flow
2. Connect Smart Detection → Quick Refinement → Path Selection
3. Wire Campaign path to CampaignTypeEngine
4. Wire Single Post path to content generation with calendar
5. Connect orchestration layer for both paths
6. Wire up email capture to Supabase
7. Add analytics tracking for conversion funnel
8. Test full 45-second flow for both paths

### Files to Update:
- `src/App.tsx` - Route to new onboarding
- `src/services/campaign-v3/CampaignTypeEngine.ts` - Campaign path integration
- `src/services/orchestration/*` - Single post + calendar integration
- `src/lib/supabase.ts` - Email capture table
- `src/types/uvp.types.ts` - Add SmartUVP interfaces

---

## Parallel Atom Lists

### Atom List A (Worktree 1 - Detection + Source Verification)
```
[x] Create SmartUVPExtractor.ts base service
[x] Add customer type extraction logic WITH source URLs
[x] Add service/product extraction logic WITH source URLs
[x] Add problem extraction logic WITH source URLs
[x] Add testimonial extraction logic WITH source URLs
[x] Add differentiator extraction logic WITH source URLs
[x] Create SourceVerificationService.ts
[x] Add source validation logic
[x] Add content blocking for unverified data
[x] Create SmartConfirmation.tsx component
[x] Add customer segment UI section with source links
[x] Add services/products UI section with source links
[x] Add problems UI section with source links
[x] Add "View Source" functionality
[x] Create QuickRefinement.tsx modal
[x] Add priority selector
[x] Add differentiator suggestions (source-verified)
[x] Add success story input
[x] Wire up to UVP context with source tracking
```

### Atom List B (Worktree 2 - Path Selection + Authenticity)
```
[x] Create OnboardingFlow.tsx page
[x] Single URL input UI
[x] Progressive status indicators
[x] Auto-transition logic
[x] Create PathSelector.tsx component
[x] Campaign path option
[x] Single post path option
[x] Path routing logic
[x] Create SinglePostTypeSelector.tsx with source requirements
[x] 5 post type options from best practices
[x] Customer Success Story: Add user input modal
[x] Customer Success Story: Add source link option
[x] Source requirement badges on each type
[x] Type preview examples
[x] Type selection handler with validation
[x] Create ContentPreview.tsx component
[x] Content display (campaign or post)
[x] Source attribution display in metadata
[x] "View Sources" functionality
[x] Authenticity badge display
[x] Calendar integration
[x] Copy-to-clipboard functionality
[x] Save to calendar functionality
[x] Email capture modal
[x] Success state with calendar
```

---

## Dependencies

**Existing Services Used:**
- DeepContextBuilder (website analysis)
- LocationDetectionService (already works)
- IndustryMatchingService (NAICS detection)
- CampaignTypeEngine (campaign selection)
- OpenRouter AI (extraction intelligence)

**New Supabase Table:**
```sql
CREATE TABLE email_captures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  website TEXT,
  industry TEXT,
  detected_uvp JSONB,
  campaign_preview JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Success Metrics

**Technical:**
- [ ] URL → First post preview in < 45 seconds
- [ ] Auto-extraction accuracy > 70%
- [ ] Mobile responsive (thumb-friendly)
- [ ] Email capture rate > 40%

**UX:**
- [ ] Zero manual typing required (all confirmations)
- [ ] Every step shows value building
- [ ] Can skip any refinement step
- [ ] Copy button on all outputs

---

## Testing Scenarios

1. **E-commerce site** (thephoenixinsurance.com)
   - Extract: Services, customer types, differentiators
   - Confirm: Quick selections
   - Generate: Insurance-specific campaign

2. **Local restaurant** (example.com/restaurant)
   - Extract: Menu items, local focus, testimonials
   - Generate: Community Champion campaign

3. **B2B SaaS** (example.com/software)
   - Extract: Features, enterprise focus, case studies
   - Generate: Authority Builder campaign

---

## File Structure

```
src/
├── pages/
│   └── OnboardingFlow.tsx (NEW)
├── components/
│   └── onboarding/
│       ├── SmartConfirmation.tsx (NEW - with source links)
│       ├── QuickRefinement.tsx (NEW)
│       ├── PathSelector.tsx (NEW)
│       ├── SinglePostTypeSelector.tsx (NEW - with source requirements)
│       ├── CustomerStoryInputModal.tsx (NEW - capture real story details)
│       └── ContentPreview.tsx (NEW - with source attribution)
├── services/
│   └── uvp/
│       ├── SmartUVPExtractor.ts (NEW - with source tracking)
│       └── SourceVerificationService.ts (NEW - enforces authenticity)
└── types/
    └── smart-uvp.types.ts (NEW - includes source fields)
```

---

## Estimated Lines of Code

- **Worktree 1:** ~1,400 lines (includes SourceVerificationService + source tracking)
- **Worktree 2:** ~1,200 lines (includes CustomerStoryInputModal + source attribution UI)
- **Integration:** ~250 lines (includes CampaignTypeEngine + Calendar + Orchestration wiring)
- **Total:** ~2,850 lines

---

## Next Steps After Week 7

**Week 8: Retention & Engagement**
- Day 3 check-in emails
- Proactive AI suggestions
- Competitor monitoring alerts
- Weekly performance reports

**Week 9: Quick Wins Library**
- UGC contest templates
- Hashtag formula builder
- Best posting times calculator
- Email capture landing pages
