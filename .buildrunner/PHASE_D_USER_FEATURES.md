# PHASE D: USER FEATURES

**Started**: November 26, 2025
**Status**: IN PROGRESS
**Priority**: P3 - STANDARD

---

## OVERVIEW

Phase D exposes the intelligence engine capabilities to users through UI components and navigation. Makes UVP, insights, and content features accessible.

---

## ITEMS

| # | Task | Segments | Status | Notes |
|---|------|----------|--------|-------|
| 29 | UVP Profile Page (/brand-profile) | ALL | COMPLETE | BrandProfilePage.tsx with UVP display |
| 30 | Content Mixer UVP integration | ALL | COMPLETE | UVPContentOptions.tsx with Phase C features |
| 31 | AI Picks UVP scoring (<30% filtered) | ALL | PENDING | Filter low-relevance suggestions |
| 32 | Segment-aware dashboard | ALL | PENDING | Show segment-specific features |
| 33 | Nav item "Brand Profile" | ALL | COMPLETE | Added to AppLayout navigation |

---

## IMPLEMENTATION DETAILS

### Item #29: UVP Profile Page

**Goal**: Create /settings/uvp route showing UVP data

**Features**:
- Display current UVP (target customer, pain points, transformation)
- Show UVP relevance score
- Edit capability (triggers re-analysis)
- View data sources contributing to UVP

**Location**: New page in src/pages/ or src/components/settings/

---

### Item #30: Content Mixer UVP Integration

**Goal**: Wire Phase C content features into Content Mixer

**Features**:
- Content atomization (1→6 platforms) in content generation
- Local keyword injection for SMB
- Case study generation from reviews
- Review response templates
- Thought leadership angles for B2B

**Location**: Extend existing Content Mixer component

---

### Item #31: AI Picks UVP Scoring

**Goal**: Filter AI suggestions by UVP relevance

**Features**:
- Score each suggestion against UVP
- Hide suggestions <30% relevance
- Show relevance indicator on visible suggestions
- "Show all" toggle for power users

**Location**: AI Picks / Smart Picks component

---

### Item #32: Segment-Aware Dashboard

**Goal**: Customize dashboard based on business segment

**Features**:
- SMB Local: Show weather hooks, local SEO, Yelp data
- SMB Regional: Show regional comparisons, seasonal content
- B2B National: Show G2 reviews, LinkedIn insights
- B2B Global: Show enterprise vendor comparisons

**Location**: Dashboard components

---

### Item #33: Nav Item "Brand Profile"

**Goal**: Add navigation to brand/UVP settings

**Features**:
- New nav item in sidebar
- Links to UVP Profile Page
- Shows UVP completion status indicator

**Location**: Navigation component

---

## NEXT PHASE

Phase D is the final phase of the Content Correlation Enhancement plan.

After completion:
- Run validation tests against success criteria
- Measure data point counts, insight quality
- User testing with SMB and B2B brands

---

## PROGRESS LOG

| Date | Item | Action | Commit |
|------|------|--------|--------|
| 2025-11-26 | #29, #33 | UVP Profile Page + Brand Profile nav item | feat(correlation): Items #29, #33 UVP Profile Page |
| 2025-11-26 | #30 | Content Mixer UVP integration with Phase C features | feat(correlation): Item #30 Content Mixer UVP integration |

---

*Document created: November 26, 2025*
