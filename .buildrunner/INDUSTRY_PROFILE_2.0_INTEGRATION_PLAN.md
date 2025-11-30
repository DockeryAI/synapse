# Industry Profile 2.0 Integration Plan

**Status**: PENDING
**Created**: 2025-11-29
**Branch**: feature/uvp-sidebar-ui
**Dependencies**: 377 enhanced industry profiles in `/Users/byronhudson/brandock/industry-enhancement/output/`

---

## Executive Summary

Integrate 377 enhanced industry profiles with extended social media templates, campaign structures, and research-grounded content into the V4 Content Dashboard. This adds industry-specific intelligence to dropdowns, enables campaign mode, and removes generic templates in favor of NAICS-matched content.

---

## Current State

### What We Have
- V4PowerModePanel with UVP sidebar, insight cards, content preview
- Generic content goal/audience/platform dropdowns
- Templates button in UVP sidebar (wrong location)
- Single-post generation only

### What We're Adding
- 377 industry profiles with 50+ fields each
- Campaign templates (4-week structured campaigns)
- Platform-specific content templates (Instagram, LinkedIn, TikTok, Twitter)
- Hook library with 6+ categories
- Research briefs with platform benchmarks and customer voice data

---

## UI Design Specification

### 1. Top Toggle: Content | Campaign

```
┌─────────────────────────────────────────────────────────────────┐
│  [Content]  [Campaign]              [Use Industry Template ▼]  │
├─────────────────────────────────────────────────────────────────┤
```

- **Content Mode**: Current single-post generation with insights below
- **Campaign Mode**: Multi-week calendar view with expandable posts
- **Industry Template**: Dropdown moved from sidebar, opens template picker

### 2. Content Mode Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  CONTENT PREVIEW                                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ [Generated post content with industry-specific hook]      │  │
│  │                                                            │  │
│  │ Hook: Your strategic plan is gathering dust because...    │  │
│  │ Body: Most businesses fail at execution, not strategy...  │  │
│  │ CTA: Download our Strategy Execution Checklist            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  INSIGHTS THAT BUILT THIS                                       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │ Gap Insight  │ │ Voice Quote  │ │ Industry     │            │
│  │ from profile │ │ from profile │ │ Trend        │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Campaign Mode Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  CAMPAIGN: Thought Leadership Authority Builder                 │
│  4 weeks • 20 posts • 60/30/10 mix                             │
│                                                                  │
│  Campaign Type: [Awareness ▼]  Duration: [4 weeks ▼]           │
│                                                                  │
│  ▼ WEEK 1: Establish Expertise                    [Generate]   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Day 1 [Educational] Your strategic plan is gathering...  ▸│  │
│  │ Day 2 [Engagement]  Be honest: What's the biggest gap... ▸│  │
│  │ Day 3 [Educational] The 80/20 rule everyone gets wrong...▸│  │
│  │ Day 4 [Educational] Your leadership team is making...    ▸│  │
│  │ Day 5 [Engagement]  Unpopular opinion: Most change...    ▸│  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ▸ WEEK 2: Build Trust                                          │
│  ▸ WEEK 3: Demonstrate Results                                  │
│  ▸ WEEK 4: Convert                                              │
│                                                                  │
│  [Generate All Posts] [Add to Calendar] [Export]               │
└─────────────────────────────────────────────────────────────────┘
```

### 4. Expanded Post View (within Campaign Mode)

```
┌───────────────────────────────────────────────────────────────┐
│ DAY 1 - EDUCATIONAL                              [Collapse ▲] │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ Hook: Your strategic plan is gathering dust because...    │ │
│ │                                                            │ │
│ │ Body: Most businesses fail at execution, not strategy.    │ │
│ │ The missing piece? Translating strategy into actionable   │ │
│ │ quarterly objectives with clear ownership...              │ │
│ │                                                            │ │
│ │ CTA: Download our Strategy Execution Checklist            │ │
│ └───────────────────────────────────────────────────────────┘ │
│                                                                │
│ Platform: LinkedIn (2.1% avg engagement for your industry)   │
│ Template: campaign_templates.awareness.sample_posts[0]       │
│                                                                │
│ [Edit Post] [Regenerate] [Change Platform] [Remove]          │
└───────────────────────────────────────────────────────────────┘
```

### 5. Industry Template Picker Modal

```
┌───────────────────────────────────────────────────────────────┐
│ SELECT INDUSTRY TEMPLATE                               [X]    │
│                                                                │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ HOOKS                                                    │   │
│ │ ├─ Curiosity Hooks (6)                                  │   │
│ │ ├─ Authority Hooks (6)                                  │   │
│ │ ├─ Pain Point Hooks (6)                                 │   │
│ │ ├─ Data Hooks (6)                                       │   │
│ │ └─ Contrarian Hooks (6)                                 │   │
│ ├─────────────────────────────────────────────────────────┤   │
│ │ CONTENT TEMPLATES                                        │   │
│ │ ├─ LinkedIn (educational, authority, case_study)        │   │
│ │ ├─ Instagram (educational, authority, case_study)       │   │
│ │ ├─ TikTok (6 video scripts)                             │   │
│ │ └─ Twitter (threads, engagement, growth)                │   │
│ ├─────────────────────────────────────────────────────────┤   │
│ │ CAMPAIGN POSTS                                           │   │
│ │ ├─ Awareness Campaign (20 posts)                        │   │
│ │ ├─ Engagement Campaign (20 posts)                       │   │
│ │ └─ Conversion Campaign (20 posts)                       │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                │
│ Preview: [Selected template preview here]                     │
│                                                                │
│ [Cancel] [Use This Template]                                  │
└───────────────────────────────────────────────────────────────┘
```

---

## Dropdown Enhancement Specification

### Content Goal Dropdown

**Current (Generic):**
- Educate
- Engage
- Promote
- Build Trust
- Drive Action

**Enhanced (Industry-Specific):**

| Base Category | Industry Label (from profile) | Source Field |
|---------------|-------------------------------|--------------|
| Educate | "Educate: Strategy Execution Frameworks" | `campaign_templates.awareness.industry_themes[0]` |
| Engage | "Engage: Business Challenge Poll" | `campaign_templates.engagement.industry_themes[0]` |
| Promote | "Promote: Client Transformation Story" | `campaign_templates.conversion.industry_themes[0]` |
| Build Trust | "Build Trust: ROI Case Study" | `content_templates.linkedin.case_study` |
| Drive Action | "Drive Action: Consultation Booking" | `campaign_templates.conversion.cta` |

**Logic:**
```typescript
function getContentGoals(profile: EnhancedIndustryProfile): ContentGoal[] {
  return [
    { id: 'educate', label: `Educate: ${profile.campaign_templates.awareness.industry_themes[0]}` },
    { id: 'engage', label: `Engage: ${profile.campaign_templates.engagement?.industry_themes[0] || 'Community Discussion'}` },
    { id: 'promote', label: `Promote: ${profile.campaign_templates.conversion?.industry_themes[0] || 'Client Success'}` },
    { id: 'trust', label: `Build Trust: ${profile.content_templates.linkedin.case_study ? 'Case Study' : 'Social Proof'}` },
    { id: 'action', label: `Drive Action: ${profile.campaign_templates.conversion?.cta || 'Consultation'}` },
  ];
}
```

### Audience Dropdown

**Current (Generic):**
- Decision Makers
- Budget Holders
- End Users
- Influencers

**Enhanced (Industry-Specific):**

| Base Category | Industry Label (from profile) | Source Field |
|---------------|-------------------------------|--------------|
| Decision Makers | "C-Suite: Exhausted from working IN the business" | `customer_triggers.emotional_drivers[0].trigger` |
| Budget Holders | "PE-Backed Leaders: Operational improvement mandate" | `customer_triggers.emotional_drivers[1].trigger` |
| Pain Seekers | "Revenue Plateau: Stuck at same level for quarters" | `customer_triggers.emotional_drivers[3].trigger` |
| Solution Ready | "Failed Initiative: Needs expert intervention" | `research_brief.customer_voice.decision_triggers[2]` |

**Logic:**
```typescript
function getAudienceSegments(profile: EnhancedIndustryProfile): AudienceSegment[] {
  const emotionalDrivers = profile.customer_triggers.emotional_drivers || [];
  const decisionTriggers = profile.research_brief.customer_voice.decision_triggers || [];

  return [
    { id: 'decision_makers', label: emotionalDrivers[0]?.trigger || 'Decision Makers', subtext: emotionalDrivers[0]?.internal_dialogue },
    { id: 'budget_holders', label: emotionalDrivers[1]?.trigger || 'Budget Holders', subtext: emotionalDrivers[1]?.internal_dialogue },
    { id: 'pain_seekers', label: emotionalDrivers[3]?.trigger || 'Pain Aware', subtext: emotionalDrivers[3]?.internal_dialogue },
    { id: 'solution_ready', label: decisionTriggers[0] || 'Solution Ready', subtext: 'High-intent buyers' },
  ];
}
```

### Platform Dropdown

**Current (Generic):**
- LinkedIn
- Instagram
- Facebook
- Twitter

**Enhanced (Industry-Prioritized):**

| Platform | Industry Enhancement | Source Field |
|----------|---------------------|--------------|
| LinkedIn | "LinkedIn (2.1% avg engagement - Recommended)" | `research_brief.platform_benchmarks.linkedin.avg_engagement_rate` |
| Instagram | "Instagram (1.8% avg - Carousel posts best)" | `research_brief.platform_benchmarks.instagram` |
| TikTok | "TikTok (NEW - 6 script templates available)" | `tiktok_content_templates` |
| Twitter | "Twitter (Thread frameworks available)" | `twitter_content_templates` |
| Facebook | "Facebook (Community-focused)" | `content_templates.facebook` |

**Logic:**
```typescript
function getPlatformOptions(profile: EnhancedIndustryProfile): PlatformOption[] {
  const benchmarks = profile.research_brief.platform_benchmarks || {};

  return Object.entries(benchmarks)
    .map(([platform, data]) => ({
      id: platform,
      label: platform.charAt(0).toUpperCase() + platform.slice(1),
      engagementRate: data.avg_engagement_rate,
      bestFormat: data.best_performing_format,
      hasTemplates: !!profile.content_templates[platform] || !!profile[`${platform}_content_templates`],
    }))
    .sort((a, b) => parseFloat(b.engagementRate) - parseFloat(a.engagementRate));
}
```

---

## Data Architecture

### Profile Loading

**File:** `src/services/industry/enhanced-profile-loader.service.ts`

```typescript
interface EnhancedProfileLoader {
  // Load profile by exact NAICS code
  loadByNaics(naicsCode: string): Promise<EnhancedIndustryProfile | null>;

  // Load profile by industry name (fuzzy match)
  loadByIndustryName(name: string): Promise<EnhancedIndustryProfile | null>;

  // Get closest match if exact not found
  findClosestMatch(naicsCode: string): Promise<EnhancedIndustryProfile>;

  // List all available profiles
  listAvailableProfiles(): Promise<{ naics: string; name: string }[]>;
}
```

**Profile Source:**
- Copy from: `/Users/byronhudson/brandock/industry-enhancement/output/multipass/*/final-profile.json`
- Copy to: `/Users/byronhudson/Projects/Synapse/public/data/enhanced-profiles/`
- Total: 234 multipass profiles (prioritize these - they have extended social)

### Profile Type Definition

**File:** `src/types/enhanced-industry-profile.types.ts`

```typescript
interface EnhancedIndustryProfile {
  // Core Identity
  industry: string;
  industry_name: string;
  naics_code: string;
  category: string;
  subcategory: string;

  // Research Foundation
  research_brief: {
    top_performing_examples: PerformingExample[];
    platform_benchmarks: Record<string, PlatformBenchmark>;
    proven_hooks: ProvenHook[];
    customer_voice: CustomerVoice;
    competitive_gaps: CompetitiveGap[];
  };

  // Customer Psychology
  customer_triggers: {
    emotional_drivers: EmotionalDriver[];
    rational_validators: string[];
  };
  customer_journey: CustomerJourney;

  // Content Assets
  campaign_templates: Record<CampaignType, CampaignTemplate>;
  content_templates: Record<Platform, PlatformContentTemplates>;
  hook_library: Record<HookType, string[]>;

  // Platform-Specific
  tiktok_content_templates: TikTokTemplate[];
  tiktok_hooks: string[];
  twitter_content_templates: TwitterTemplate[];
  twitter_thread_frameworks: string[];

  // Additional
  video_scripts: VideoScript[];
  ugc_prompts: string[];
  viral_triggers: ViralTrigger[];
  social_post_templates: SocialPostTemplate[];
}

interface CampaignTemplate {
  name: string;
  duration: string;
  posts_per_week: number;
  industry_themes: string[];
  content_mix: { educational: number; promotional: number; engagement: number };
  sample_posts: SamplePost[];
}

interface SamplePost {
  day: number;
  type: 'educational' | 'engagement' | 'promotional';
  hook: string;
  body: string;
  cta: string;
}
```

---

## Implementation Phases

### Phase 1: Profile Infrastructure (Day 1)

**Tasks:**
1. Copy 234 multipass profiles to Synapse `public/data/enhanced-profiles/`
2. Create `enhanced-industry-profile.types.ts` with full type definitions
3. Create `enhanced-profile-loader.service.ts` with NAICS lookup
4. Add NAICS code to brand context (from UVP industry field)
5. Create `useEnhancedProfile` hook for component access

**Files:**
- NEW: `src/types/enhanced-industry-profile.types.ts`
- NEW: `src/services/industry/enhanced-profile-loader.service.ts`
- NEW: `src/hooks/useEnhancedProfile.ts`
- MODIFY: `src/contexts/BrandContext.tsx` (add NAICS resolution)

**Validation:**
- [ ] Profile loads for OpenDialog brand (Software Publishers NAICS)
- [ ] Fallback works when exact NAICS not found
- [ ] All 234 profiles parse without error

---

### Phase 2: Dropdown Enhancement (Day 2)

**Tasks:**
1. Create `useIndustryDropdowns` hook that returns enhanced options
2. Modify Content Goal dropdown to use industry-specific labels
3. Modify Audience dropdown to use emotional triggers
4. Modify Platform dropdown to show engagement rates and sort by performance
5. Add "Recommended" badge to highest-engagement platform

**Files:**
- NEW: `src/hooks/useIndustryDropdowns.ts`
- MODIFY: `src/components/v4/V4PowerModePanel.tsx` (dropdown integration)

**Validation:**
- [ ] Content Goal shows industry-specific themes
- [ ] Audience shows emotional triggers with subtext
- [ ] Platform sorted by engagement rate with badges
- [ ] Falls back to generic if no profile loaded

---

### Phase 3: Template Picker & Sidebar Cleanup (Day 3)

**Tasks:**
1. Remove Templates button from UVP sidebar
2. Add Content/Campaign toggle to preview header
3. Add "Use Industry Template" dropdown to header
4. Create TemplatePickerModal component
5. Implement template injection into insight cards

**Files:**
- MODIFY: `src/components/v4/V4PowerModePanel.tsx` (remove templates, add toggle)
- NEW: `src/components/v4/TemplatePickerModal.tsx`
- NEW: `src/components/v4/ContentCampaignToggle.tsx`

**Validation:**
- [ ] Templates button removed from sidebar
- [ ] Toggle switches between Content and Campaign mode
- [ ] Template picker modal opens and shows categories
- [ ] Selected template populates insight cards

---

### Phase 4: Campaign Mode UI (Day 4-5)

**Tasks:**
1. Create CampaignPreview component (replaces ContentPreview when in campaign mode)
2. Implement week accordion with expandable days
3. Create CampaignPostCard component for individual posts
4. Add campaign type selector (Awareness, Engagement, Conversion)
5. Implement "Generate All Posts" functionality
6. Add "Add to Calendar" integration

**Files:**
- NEW: `src/components/v4/CampaignPreview.tsx`
- NEW: `src/components/v4/CampaignWeekAccordion.tsx`
- NEW: `src/components/v4/CampaignPostCard.tsx`
- NEW: `src/components/v4/CampaignTypeSelector.tsx`
- MODIFY: `src/components/v4/V4PowerModePanel.tsx` (conditional rendering)

**Validation:**
- [ ] Campaign mode shows 4-week structure
- [ ] Weeks expand/collapse correctly
- [ ] Posts show hook/body/CTA structure
- [ ] Campaign type changes update content
- [ ] Generate All creates posts for all 4 weeks

---

### Phase 5: Content Generation Integration (Day 6)

**Tasks:**
1. Modify content generation to use industry templates as base
2. Inject `hook_library` hooks into generation prompts
3. Use `customer_voice.problem_phrases` for pain point content
4. Apply `transformations` for outcome statements
5. Fill `[PLACEHOLDER]` tokens with UVP data

**Files:**
- MODIFY: `src/services/v4/content-orchestrator.ts`
- MODIFY: `src/components/v4/V4ContentGenerationPanel.tsx`
- NEW: `src/services/industry/template-injector.service.ts`

**Template Token Replacement:**
```typescript
const tokens = {
  '[INDUSTRY]': uvp.industry,
  '[COMPANY_TYPE]': uvp.targetCustomer.companySize,
  '[PAIN_POINT]': profile.customer_voice.problem_phrases[0],
  '[OUTCOME]': uvp.transformationGoal.statement,
  '[METRIC]': uvp.keyBenefit.metrics[0]?.value,
  '[TIMEFRAME]': '90 days',
  '[NUMBER]': profile.research_brief.top_performing_examples.length,
};
```

**Validation:**
- [ ] Generated content uses industry-specific hooks
- [ ] Placeholders replaced with UVP data
- [ ] Content quality matches or exceeds current output
- [ ] TikTok scripts generate correctly

---

### Phase 6: TikTok & Twitter Expansion (Day 7)

**Tasks:**
1. Add TikTok to platform dropdown
2. Add Twitter to platform dropdown
3. Create TikTok script preview component (with timing markers)
4. Create Twitter thread preview component
5. Implement TikTok-specific generation using `tiktok_content_templates`
6. Implement Twitter thread generation using `twitter_thread_frameworks`

**Files:**
- NEW: `src/components/v4/TikTokScriptPreview.tsx`
- NEW: `src/components/v4/TwitterThreadPreview.tsx`
- MODIFY: Platform dropdown logic

**TikTok Script Format:**
```
┌───────────────────────────────────────────────────────────────┐
│ TIKTOK SCRIPT: Red Flag Client Reveal                        │
│ Duration: 30 seconds                                          │
│                                                                │
│ [0-3s] HOOK                                                   │
│ "If a client says this, RUN"                                  │
│                                                                │
│ [3-15s] REVEAL                                                │
│ Show the red flag statement on screen                         │
│                                                                │
│ [15-25s] EXPLANATION                                          │
│ Quick explanation of why it's problematic                     │
│                                                                │
│ [25-30s] CTA                                                  │
│ "Comment your worst client red flag"                          │
│                                                                │
│ Sounds: dramatic reveal, oh no                                │
│ Hashtags: #businessconsulting #redflags #smallbusinessowner   │
└───────────────────────────────────────────────────────────────┘
```

**Validation:**
- [ ] TikTok appears in platform dropdown
- [ ] TikTok generates video script format
- [ ] Twitter generates thread format
- [ ] Hashtag strategies included

---

## File Changes Summary

### New Files (13)

| File | Purpose |
|------|---------|
| `src/types/enhanced-industry-profile.types.ts` | Full type definitions |
| `src/services/industry/enhanced-profile-loader.service.ts` | Profile loading by NAICS |
| `src/services/industry/template-injector.service.ts` | Token replacement |
| `src/hooks/useEnhancedProfile.ts` | Profile access hook |
| `src/hooks/useIndustryDropdowns.ts` | Enhanced dropdown options |
| `src/components/v4/ContentCampaignToggle.tsx` | Mode toggle component |
| `src/components/v4/TemplatePickerModal.tsx` | Template selection modal |
| `src/components/v4/CampaignPreview.tsx` | Campaign mode preview |
| `src/components/v4/CampaignWeekAccordion.tsx` | Week expandable section |
| `src/components/v4/CampaignPostCard.tsx` | Individual post card |
| `src/components/v4/CampaignTypeSelector.tsx` | Campaign type dropdown |
| `src/components/v4/TikTokScriptPreview.tsx` | TikTok script format |
| `src/components/v4/TwitterThreadPreview.tsx` | Twitter thread format |

### Modified Files (5)

| File | Changes |
|------|---------|
| `src/components/v4/V4PowerModePanel.tsx` | Remove templates button, add toggle, integrate dropdowns |
| `src/components/v4/V4ContentGenerationPanel.tsx` | Use template injection |
| `src/services/v4/content-orchestrator.ts` | Inject industry templates |
| `src/contexts/BrandContext.tsx` | Add NAICS resolution |
| `public/data/enhanced-profiles/*.json` | 234 new profile files |

---

## Data Migration

### Profile Copy Script

```bash
# Copy multipass profiles (preferred - have extended social)
cp /Users/byronhudson/brandock/industry-enhancement/output/multipass/*/final-profile.json \
   /Users/byronhudson/Projects/Synapse/public/data/enhanced-profiles/

# Rename to use industry slug
for f in public/data/enhanced-profiles/final-profile.json; do
  dir=$(dirname "$f")
  slug=$(basename "$dir")
  mv "$f" "public/data/enhanced-profiles/${slug}.json"
done
```

### NAICS Mapping

Create mapping file for brand industry → NAICS code:

```typescript
// src/data/industry-naics-map.ts
export const INDUSTRY_NAICS_MAP: Record<string, string> = {
  'Software Publishers': '511210',
  'Business Consulting': '541618',
  'Dental Practice': '621210',
  'HVAC Services': '238220',
  // ... 230+ more
};
```

---

## Testing Checklist

### Phase 1: Profile Infrastructure
- [ ] Profile loads for known NAICS code
- [ ] Fallback to closest match works
- [ ] Type validation passes for all 234 profiles
- [ ] useEnhancedProfile hook returns data in components

### Phase 2: Dropdowns
- [ ] Content Goal shows 5 industry-specific options
- [ ] Audience shows 4 emotional trigger options
- [ ] Platform sorted by engagement rate
- [ ] "Recommended" badge shows on top platform
- [ ] Generic fallback works when no profile

### Phase 3: Template Picker
- [ ] Templates button removed from sidebar
- [ ] Toggle switches modes correctly
- [ ] Modal opens and displays all categories
- [ ] Template selection populates content

### Phase 4: Campaign Mode
- [ ] 4 weeks display correctly
- [ ] Week accordion expands/collapses
- [ ] Post cards show hook/body/CTA
- [ ] Campaign type changes content
- [ ] Generate All works for full campaign

### Phase 5: Content Generation
- [ ] Industry hooks injected into content
- [ ] Placeholders replaced correctly
- [ ] Quality equals or exceeds current output
- [ ] No broken placeholder tokens in output

### Phase 6: TikTok & Twitter
- [ ] TikTok in dropdown, generates script format
- [ ] Twitter in dropdown, generates thread format
- [ ] Hashtag strategies included
- [ ] Video timing markers correct

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Dropdown relevance | Generic | Industry-specific |
| Campaign creation time | N/A (not possible) | <30 seconds |
| Content generation quality | Good | Excellent (template-guided) |
| Platform coverage | 4 (LinkedIn, IG, FB, Twitter) | 5 (+ TikTok) |
| Template options | 0 industry-specific | 50+ per industry |
| Campaign types available | 0 | 4 (Awareness, Engagement, Conversion, Retention) |

---

## Dependencies

- 377 enhanced profiles generated (COMPLETE - in brandock)
- UVP data available for brand (COMPLETE - existing)
- V4PowerModePanel functional (COMPLETE - existing)
- Content generation working (COMPLETE - existing)

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Profile missing for brand's industry | Medium | Medium | Fallback to closest NAICS match |
| Large bundle size from 234 profiles | Low | Medium | Lazy-load profiles on demand |
| Template tokens not replaced | Low | High | Validate all tokens before generation |
| Campaign mode complexity | Medium | Low | Keep single-post as default |

---

## Timeline

| Phase | Duration | Effort |
|-------|----------|--------|
| Phase 1: Profile Infrastructure | 1 day | Medium |
| Phase 2: Dropdown Enhancement | 1 day | Low |
| Phase 3: Template Picker | 1 day | Medium |
| Phase 4: Campaign Mode UI | 2 days | High |
| Phase 5: Content Generation | 1 day | Medium |
| Phase 6: TikTok & Twitter | 1 day | Low |
| **Total** | **7 days** | |

---

*Document created: 2025-11-29*
*Ready for execution*
