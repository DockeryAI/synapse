# Week 7: Discovery-First Smart Onboarding

## Goal
Transform first-time user experience from 3-5 minutes to 45 seconds with Discovery Intelligence as the WOW factor

---

## User Journey

**Step 1 (0-5s):** URL input → Auto-detection begins
**Step 2 (5-15s):** WOW MOMENT → Show extracted intelligence (customers, services, problems, testimonials, differentiators) with confidence scores
**Step 3 (15-25s):** Quick confirmation → User confirms/adjusts discovered data
**Step 4 (25-30s):** Choose path → "Generate Full Campaign" OR "Create Single Post"
**Step 5 (30-45s):** Preview & save → Generated content + calendar integration + email capture

---

## Build Structure

### Worktree 1: Smart Detection Engine (8h)
**What:** Extract business intelligence automatically from website
**Deliverables:**
- SmartUVPExtractor.ts - AI-powered extraction service
- SmartConfirmation.tsx - Checkbox confirmation UI
- QuickRefinement.tsx - Priority/differentiator selector

### Worktree 2: Path Selection & Content Generation (6h)
**What:** Let users choose campaign or single post, then generate with calendar integration
**Deliverables:**
- OnboardingFlow.tsx - Single URL input landing
- PathSelector.tsx - Choose campaign vs single post
- SinglePostTypeSelector.tsx - Select post type from best practices
- ContentPreview.tsx - Preview + save + email capture

### Integration (2h)
**What:** Merge, connect, and polish
**Tasks:** Routing, Supabase email table, analytics, testing

---

## Key Features

**Smart Extraction (Source-Verified):**
- Detects customer types from website language (with source URLs)
- Finds services/products from menus and pages (with source URLs)
- Identifies problems from headlines and value props (with source URLs)
- Pulls testimonials and success stories (with source URLs)
- Extracts differentiators from competitive positioning (with source URLs)
- ALL extracted data includes source attribution
- NO fabricated content or made-up statistics

**Path Flexibility (Authenticity-First):**
- Choose Full Campaign (feeds into CampaignTypeEngine)
- OR Choose Single Post with source requirements:
  - Customer Success Story (requires user input or source link - NO fabrication)
  - Service Spotlight (uses verified website data)
  - Problem/Solution Post (uses verified pain points)
  - Value Prop Post (uses verified differentiators)
  - Community Engagement (fact-based questions only)
- Both paths integrate with calendar and orchestration
- Source attribution displayed in all content
- One-click copy to clipboard
- Email capture at peak excitement

**Mobile-First:**
- Thumb-friendly touch targets (44px min)
- Progressive disclosure (one step at a time)
- Fast loading with optimistic UI
- Works offline after initial load

---

## Technical Approach

**Parallel Development:**
- Day 1-2: Build both worktrees simultaneously
- Day 3: Merge and integrate

**Reuse Existing:**
- DeepContextBuilder (website analysis)
- LocationDetectionService (already working)
- IndustryMatchingService (NAICS detection)
- CampaignTypeEngine (campaign auto-selection)
- OpenRouter AI (extraction intelligence)

**New Components:**
- 5 UI components (~1,300 lines)
- 1 extraction service with source tracking (~450 lines)
- 1 source verification service (~200 lines)
- Source input modal for Customer Success Stories
- Integration with CampaignTypeEngine, Calendar, Orchestration
- 1 Supabase table (includes source attribution)
- Analytics tracking

---

## Success Metrics

**Speed:** < 45 seconds URL to first post
**Accuracy:** >70% extraction accuracy
**Conversion:** >40% email capture rate
**UX:** Zero manual typing required
**Mobile:** Fully responsive, fast

---

## What Changes

**Before:**
```
Landing → Manual form (URL, industry, location, platforms)
→ Wait for processing → Campaign list → Select and customize
Time: 3-5 minutes
```

**After:**
```
Landing → URL only → Discovery WOW (10s) → Quick confirms (10s)
→ Choose path (5s) → Generate content (10s) → Preview + save (10s)
Time: 45 seconds, Calendar integration included
```

---

## Next Steps

**To Execute:**
1. Review WEEK7_SMART_ONBOARDING.md (detailed plan)
2. Review WEEK7_BUILD_PROMPTS.md (3 prompts)
3. Run Prompts 1 & 2 in parallel
4. Run Prompt 3 to integrate
5. Test and deploy

**Files Created:**
- ✅ WEEK7_SMART_ONBOARDING.md (detailed plan)
- ✅ WEEK7_BUILD_PROMPTS.md (build instructions)
- ✅ WEEK7_SUMMARY.md (this file)

**Ready to start:** Yes - all planning complete
