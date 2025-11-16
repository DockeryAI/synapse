# Content Selection Interface - Worktree Task

**Feature:** Content Selection Interface (Smart Picks + Content Mixer)
**Worktree:** `feature/content-selection-interface`
**Estimated Time:** 25 hours
**Dependencies:** Intelligence Gatherer, Campaign Generator, Business Profile
**Status:** 🟡 Not Started

---

## Overview

Replace the current "show 3 AI-picked ideas" approach with a two-mode interface that gives users control over content generation:

1. **Smart Picks Mode (Easy Button):** AI recommends 3-5 best content combinations with one-click generation
2. **Content Mixer Mode (Power User):** Three-column drag-and-drop interface to combine insights from multiple data sources

---

## Implementation Tasks

### 1. Smart Picks UI (8 hours)

**Goal:** Create the "Easy Button" mode where AI selects the best content combinations

**Tasks:**
- [ ] Create `SmartPicks.tsx` component (2h)
  - Grid of 3-5 recommendation cards
  - Each card shows: Title, Preview, Trust Indicators, Expected Engagement
  - One-click "Generate This" button per card
  - Visual indicators (🔥 trending, 📍 local, 📊 data-driven, ⚡ seasonal)

- [ ] Build AI recommendation engine (4h)
  - `SmartPicksService.ts` - Analyzes all available insights
  - Scoring algorithm: Relevance + Timing + Engagement Potential
  - Combination logic: pairs compatible insights (local + trending, seasonal + industry)
  - Returns top 5 ranked combinations with reasoning

- [ ] Add trust indicators & previews (2h)
  - Show WHY AI picked each combination
  - Preview text showing what content would look like
  - Estimated engagement metrics (based on insight scores)
  - Category badges (Thought Leadership, Community Focus, Viral Potential)

**Files Created:**
- `src/components/content-selection/SmartPicks.tsx`
- `src/components/content-selection/SmartPickCard.tsx`
- `src/services/content-selection/SmartPicksService.ts`

**Acceptance Criteria:**
- User sees 3-5 AI-recommended content combinations
- Each card shows preview, trust indicators, and expected engagement
- Clicking "Generate This" creates content immediately
- Recommendations update when new intelligence data arrives

---

### 2. Content Mixer Interface (12 hours)

**Goal:** Three-column drag-and-drop interface for power users to create custom combinations

**Tasks:**
- [ ] Build Insight Pool (Left Column) (4h)
  - `InsightPool.tsx` component
  - Categorized tabs: Local Issues | Trending Topics | Seasonal | Industry News
  - Each insight shows: Title, Impact Score, Data Source, Category
  - Multi-select checkboxes
  - Search/filter functionality
  - Visual indicators for insight types

- [ ] Build Selected Mix (Center Column) (4h)
  - `SelectedMix.tsx` component
  - Drag & drop reordering (react-beautiful-dnd or @dnd-kit)
  - Combine up to 3 insights per content piece
  - AI compatibility warnings ("These insights may conflict")
  - AI suggestions ("Add seasonal insight for better engagement")
  - Clear/reset button

- [ ] Build Content Preview (Right Column) (4h)
  - `ContentPreview.tsx` component
  - Live preview as selections change
  - Platform simulator tabs (LinkedIn, Facebook, Instagram, Twitter)
  - Character count per platform
  - Estimated engagement metrics
  - "Generate Content" button
  - Save combination as template button

**Files Created:**
- `src/components/content-selection/ContentMixer.tsx`
- `src/components/content-selection/InsightPool.tsx`
- `src/components/content-selection/SelectedMix.tsx`
- `src/components/content-selection/ContentPreview.tsx`
- `src/services/content-selection/InsightCompatibility.ts`

**Acceptance Criteria:**
- User can browse all available insights by category
- Drag insights to center column to create combinations
- AI warns about incompatible combinations
- Live preview updates as selections change
- Can generate content from custom mix
- Can save favorite combinations as templates

---

### 3. Insight Pool & Categorization (5 hours)

**Goal:** Organize all intelligence data into browsable categories

**Tasks:**
- [ ] Create categorization service (2h)
  - `InsightCategorizer.ts` - Analyzes and tags all insights
  - Categories: Local Issues, Trending Topics, Seasonal, Industry News, Competitive Intel
  - Auto-tag based on data source and content
  - Impact scoring algorithm

- [ ] Build filter/search system (2h)
  - Multi-filter support (category + source + score)
  - Keyword search across insight titles and content
  - Sort by: Relevance, Impact Score, Recency, Engagement Potential
  - Save filter presets

- [ ] Create insight detail modal (1h)
  - `InsightDetailModal.tsx` - Show full insight data
  - Data provenance (which APIs contributed)
  - Full evidence/reasoning
  - Related insights
  - Quick add to mix button

**Files Created:**
- `src/services/content-selection/InsightCategorizer.ts`
- `src/services/content-selection/InsightFilter.ts`
- `src/components/content-selection/InsightDetailModal.tsx`

**Acceptance Criteria:**
- All insights auto-categorized on data load
- User can filter by multiple criteria simultaneously
- Search finds relevant insights quickly
- Can view full detail before adding to mix

---

## Database Schema Updates

### New Tables

```sql
-- Save user's favorite content combinations
CREATE TABLE content_combinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  business_profile_id UUID REFERENCES business_profiles(id),
  name TEXT NOT NULL,
  insight_ids TEXT[] NOT NULL,
  platform TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Track which combinations perform best
CREATE TABLE combination_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  combination_id UUID REFERENCES content_combinations(id),
  engagement_rate DECIMAL,
  click_rate DECIMAL,
  conversion_rate DECIMAL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User preferences for Smart Picks
CREATE TABLE smart_pick_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  preferred_categories TEXT[],
  avoid_categories TEXT[],
  min_impact_score DECIMAL DEFAULT 0.7,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Integration Points

### With Intelligence Gatherer
- Consumes all insight data from existing intelligence services
- Subscribes to real-time updates when new data arrives
- Uses existing impact scores and categorizations

### With Campaign Generator
- Passes selected insight combinations to content generator
- Supports both Smart Picks and Custom Mix modes
- Maintains provenance tracking for generated content

### With Business Profile
- Filters insights by business relevance
- Uses industry and location to prioritize local/relevant insights
- Personalizes Smart Picks based on business type

---

## UI/UX Specifications

### Layout
```
┌─────────────────────────────────────────────────────┐
│  Content Selection                    [Smart Picks] │
│                                    [Content Mixer]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  SMART PICKS MODE:                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ 🔥📍     │  │ 📊⚡     │  │ 🔥📍     │         │
│  │ Card 1   │  │ Card 2   │  │ Card 3   │         │
│  │          │  │          │  │          │         │
│  │ Generate │  │ Generate │  │ Generate │         │
│  └──────────┘  └──────────┘  └──────────┘         │
│                                                     │
│  CONTENT MIXER MODE:                                │
│  ┌────────┬──────────┬───────────┐                │
│  │ Pool   │ Selected │ Preview   │                │
│  │        │          │           │                │
│  │ Local  │ Drag     │ LinkedIn  │                │
│  │ ☐ A    │ here     │ ┌───────┐ │                │
│  │ ☐ B    │          │ │       │ │                │
│  │        │          │ │       │ │                │
│  │ Trend  │          │ └───────┘ │                │
│  │ ☐ C    │          │           │                │
│  │ ☐ D    │          │ Generate  │                │
│  └────────┴──────────┴───────────┘                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Color Coding
- 🔥 **Red/Orange** - Trending topics
- 📍 **Blue** - Local issues
- 📊 **Purple** - Data-driven insights
- ⚡ **Yellow** - Seasonal/timely
- 🎯 **Green** - High impact score

### Animations
- Smooth tab transitions (Framer Motion)
- Drag-and-drop visual feedback
- Live preview fade-in on selection change
- Success animation on content generation

---

## Testing Requirements

### Unit Tests
- [ ] SmartPicksService scoring algorithm
- [ ] InsightCategorizer auto-tagging
- [ ] InsightCompatibility warning logic
- [ ] Filter/search functionality

### Integration Tests
- [ ] Smart Picks generates valid content
- [ ] Content Mixer combinations work correctly
- [ ] Preview updates match actual generated content
- [ ] Database saves/loads combinations

### E2E Tests
- [ ] User can generate content from Smart Picks
- [ ] User can create custom mix and generate
- [ ] Filters work correctly
- [ ] Saved combinations reload properly

---

## Performance Targets

- Smart Picks load in <500ms
- Insight Pool renders 100+ insights without lag
- Live preview updates in <200ms
- Search/filter results in <100ms
- Drag-and-drop feels instant (<50ms)

---

## Success Metrics

### User Engagement
- % of users who try Content Mixer vs only use Smart Picks
- Average number of custom combinations created per user
- % of generated content using custom vs AI-picked combinations

### Content Performance
- Engagement rate: Smart Picks vs Custom Mix
- Which categories get combined most frequently
- Which combinations perform best (for future Smart Picks)

---

## Future Enhancements (Phase 2+)

- **Preset Templates:** "Weekly Roundup", "Thought Leadership", "Community Focus"
- **Batch Operations:** Generate multiple content pieces at once
- **A/B Testing:** Test different combinations simultaneously
- **Scheduling:** Schedule different mixes for different days
- **Learning System:** AI learns from user's custom combinations

---

## Dependencies

**Required Before Starting:**
- Intelligence Gatherer must be complete
- Business Profile Management functional
- Campaign Generator core ready

**API/Library Requirements:**
- @dnd-kit/core (drag and drop)
- framer-motion (animations)
- react-query (data fetching)
- zustand or jotai (state management)

---

## Deployment Checklist

- [ ] Database migrations applied
- [ ] All components tested
- [ ] Performance targets met
- [ ] Mobile responsive
- [ ] Accessibility (WCAG AA)
- [ ] Documentation updated
- [ ] User guide created
- [ ] Beta users onboarded
- [ ] Analytics tracking configured

---

**Last Updated:** 2025-11-15
**Status:** Ready to Build
**Parallel Work:** Can be built alongside Campaign Generator (separate UI layer)
