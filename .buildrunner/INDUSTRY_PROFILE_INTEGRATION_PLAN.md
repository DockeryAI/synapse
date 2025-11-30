# Industry Profile 2.0 Integration Plan

**Status**: ✅ COMPLETE (All Phases Done)
**Created**: 2025-11-29
**Updated**: 2025-11-30
**Branch**: feature/uvp-sidebar-ui
**Dependencies**: 377 enhanced industry profiles in `/Users/byronhudson/brandock/industry-enhancement/output/`

---

## Executive Summary

Integrate 377 enhanced industry profiles with extended social media templates, campaign structures, and research-grounded content into the V4 Content Dashboard. This adds industry-specific intelligence to dropdowns, enables campaign mode, and removes generic templates in favor of NAICS-matched content.

---

## Progress Summary

### Completed ✅

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Profile Infrastructure | ✅ Complete |
| Phase 2 | Dropdown Enhancement Wiring | ✅ Complete |
| Phase 3 | Content/Campaign Toggle + Template Picker | ✅ Complete |
| Phase 4 | Campaign Mode UI | ✅ Complete |
| Phase 5 | Content Generation Integration | ✅ Complete |
| Phase 6 | TikTok & Twitter Templates + Calendar | ✅ Complete |

---

## Files Created

| File | Purpose |
|------|---------|
| `src/types/industry-profile.types.ts` | EnhancedIndustryProfile types (lines 291-544) |
| `src/services/intelligence/enhanced-profile-loader.service.ts` | Profile loader with NAICS matching |
| `src/hooks/useIndustryProfile.ts` | React hook for profile access + campaign generation |
| `src/components/campaign/CampaignModePanel.tsx` | Campaign type selector + overview UI |
| `src/components/campaign/CampaignWeekView.tsx` | Expandable week timeline component |
| `src/components/campaign/CampaignPostCard.tsx` | Individual post card with generate button |
| `src/components/campaign/index.ts` | Exports for campaign components |
| `src/services/industry/template-injector.service.ts` | Token replacement for [PLACEHOLDER] patterns |
| `src/components/v4/TikTokScriptPreview.tsx` | TikTok video script display |
| `src/components/v4/TwitterThreadPreview.tsx` | Twitter thread display |
| `src/components/v4/TemplatePickerModal.tsx` | Modal for browsing industry templates |

## Files Modified

| File | Changes |
|------|---------|
| `src/components/v4/V4PowerModePanel.tsx` | Content/Campaign toggle, useIndustryProfile hook, enhanced dropdowns |
| `src/services/v4/content-orchestrator.ts` | Template injection, TikTok/Twitter prompts |

---

## UI Design Specification

### 1. Top Toggle: Content | Campaign

```
┌─────────────────────────────────────────────────────────────────┐
│  [Content]  [Campaign]              [Use Industry Template ▼]  │
├─────────────────────────────────────────────────────────────────┤
```

- **Content Mode**: Single-post generation with insights below
- **Campaign Mode**: Multi-week calendar view with expandable posts
- **Industry Template**: Opens template picker modal

### 2. Campaign Mode Layout

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
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ▸ WEEK 2: Build Trust                                          │
│  ▸ WEEK 3: Demonstrate Results                                  │
│  ▸ WEEK 4: Convert                                              │
│                                                                  │
│  [Generate All Posts] [Add to Calendar] [Export]               │
└─────────────────────────────────────────────────────────────────┘
```

### 3. TikTok Script Format

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

---

## Dropdown Enhancement Specification

### Content Goal Dropdown

| Base Category | Industry Label (from profile) | Source Field |
|---------------|-------------------------------|--------------|
| Educate | "Educate: Strategy Execution Frameworks" | `campaign_templates.awareness.industry_themes[0]` |
| Engage | "Engage: Business Challenge Poll" | `campaign_templates.engagement.industry_themes[0]` |
| Promote | "Promote: Client Transformation Story" | `campaign_templates.conversion.industry_themes[0]` |
| Build Trust | "Build Trust: ROI Case Study" | `content_templates.linkedin.case_study` |
| Drive Action | "Drive Action: Consultation Booking" | `campaign_templates.conversion.cta` |

### Audience Dropdown

| Base Category | Industry Label (from profile) | Source Field |
|---------------|-------------------------------|--------------|
| Decision Makers | "C-Suite: Exhausted from working IN the business" | `customer_triggers.emotional_drivers[0].trigger` |
| Budget Holders | "PE-Backed Leaders: Operational improvement mandate" | `customer_triggers.emotional_drivers[1].trigger` |
| Pain Seekers | "Revenue Plateau: Stuck at same level" | `customer_triggers.emotional_drivers[3].trigger` |
| Solution Ready | "Failed Initiative: Needs expert intervention" | `research_brief.customer_voice.decision_triggers[2]` |

### Platform Dropdown

| Platform | Industry Enhancement | Source Field |
|----------|---------------------|--------------|
| LinkedIn | "LinkedIn (2.1% avg engagement - Recommended)" | `research_brief.platform_benchmarks.linkedin.avg_engagement_rate` |
| Instagram | "Instagram (1.8% avg - Carousel posts best)" | `research_brief.platform_benchmarks.instagram` |
| TikTok | "TikTok (NEW - 6 script templates available)" | `tiktok_content_templates` |
| Twitter | "Twitter (Thread frameworks available)" | `twitter_content_templates` |

---

## Data Architecture

### Profile Type Definition

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
```

### Template Token Replacement

```typescript
const tokens = {
  '[INDUSTRY]': uvp.industry,
  '[COMPANY_TYPE]': uvp.targetCustomer.companySize,
  '[PAIN_POINT]': profile.customer_voice.problem_phrases[0],
  '[OUTCOME]': uvp.transformationGoal.statement,
  '[METRIC]': uvp.keyBenefit.metrics[0]?.value,
  '[TIMEFRAME]': '90 days',
  '[NUMBER]': profile.research_brief.top_performing_examples.length,
  '[CUSTOMER]': uvp.targetCustomer.description,
  '[TRANSFORMATION]': profile.transformations[0],
  '[BENEFIT]': uvp.keyBenefit.statement,
  '[SOLUTION]': uvp.solution.description,
  '[URGENCY]': profile.urgency_drivers[0],
  '[PROOF]': profile.trust_signals[0],
  '[CTA]': profile.campaign_templates.conversion.cta,
};
```

---

## Implementation Phases (All Complete)

### Phase 1: Profile Infrastructure ✅

**Tasks Completed:**
- ✅ Extended `industry-profile.types.ts` with EnhancedIndustryProfile types
- ✅ Created `enhanced-profile-loader.service.ts` with NAICS lookup
- ✅ Created `useIndustryProfile.ts` hook for component access
- ✅ Implemented `findBestMatch()` - fuzzy matching by NAICS, name, keywords, category
- ✅ Implemented dropdown helper functions

### Phase 2: Dropdown Enhancement ✅

**Tasks Completed:**
- ✅ Wired useIndustryProfile hook into V4PowerModePanel
- ✅ Created `enhancedFrameworkTooltips` - industry content goals
- ✅ Created `enhancedFunnelTooltips` - industry audience segments
- ✅ Created `enhancedPlatformTooltips` - platform recommendations

### Phase 3: Template Picker & Toggle ✅

**Tasks Completed:**
- ✅ Added Content/Campaign toggle to preview header
- ✅ Added "Use Industry Template" button
- ✅ Created TemplatePickerModal component
- ✅ Integrated campaign mode rendering

### Phase 4: Campaign Mode UI ✅

**Tasks Completed:**
- ✅ Created CampaignModePanel component
- ✅ Implemented week view with expandable posts
- ✅ Created CampaignPostCard component
- ✅ Added campaign type selector (Awareness, Engagement, Conversion)
- ✅ Implemented "Generate All Posts" functionality

### Phase 5: Content Generation Integration ✅

**Tasks Completed:**
- ✅ Created template-injector.service.ts for token replacement
- ✅ Wired CampaignModePanel to generateWithControl()
- ✅ Mapped content type to framework (educational→Authority, etc.)
- ✅ Mapped content type to funnel stage
- ✅ Generated content displays in-card with hook, body, CTA, hashtags

### Phase 6: TikTok & Twitter Templates ✅

**Tasks Completed:**
- ✅ Created TikTokScriptPreview.tsx with timing markers
- ✅ Created TwitterThreadPreview.tsx with numbered tweets
- ✅ Added TikTok/Twitter prompt additions to content-orchestrator
- ✅ Implemented "Add to Calendar" button
- ✅ Calendar saves to content_calendar_items table

---

## Key Features Implemented

### Profile Matching
- NAICS code exact match
- Industry name fuzzy match
- Keyword matching
- Category fallback

### Campaign Generation
- 3 campaign types: Awareness, Engagement, Conversion
- 2-4 week durations
- Content mix ratios (60/30/10, 50/30/20, etc.)
- Per-post generation with loading states

### Content Type Mapping
| Content Type | Framework | Funnel Stage |
|--------------|-----------|--------------|
| educational | Authority | TOFU |
| engagement | CuriosityGap | TOFU |
| promotional | AIDA | BOFU |
| authority | StoryBrand | MOFU |
| case_study | BAB | MOFU |

### Platform Support
| Platform | Format |
|----------|--------|
| LinkedIn | Standard post with hook/body/CTA |
| Instagram | Carousel-ready, hashtags |
| TikTok | Video script with timing markers |
| Twitter | Thread format with numbered tweets |
| Facebook | Community-focused |

---

## Testing Checklist

### Profile Infrastructure ✅
- [x] Profile loads for known NAICS code
- [x] Fallback to closest match works
- [x] useIndustryProfile hook returns data

### Dropdowns ✅
- [x] Content Goal shows industry-specific options
- [x] Audience shows emotional triggers
- [x] Platform sorted by engagement rate
- [x] Generic fallback when no profile

### Campaign Mode ✅
- [x] 4 weeks display correctly
- [x] Week accordion expands/collapses
- [x] Post cards show hook/body/CTA
- [x] Campaign type changes content mix
- [x] Generate All works for full campaign

### Content Generation ✅
- [x] Industry hooks injected into content
- [x] Placeholders replaced correctly
- [x] TikTok generates script format
- [x] Twitter generates thread format
- [x] Calendar integration works

---

## Success Metrics

| Metric | Before | After |
|--------|--------|-------|
| Dropdown relevance | Generic | Industry-specific |
| Campaign creation time | N/A | <30 seconds |
| Content generation quality | Good | Template-guided |
| Platform coverage | 4 | 5 (+ TikTok) |
| Template options | 0 industry-specific | 50+ per industry |
| Campaign types | 0 | 3 (Awareness, Engagement, Conversion) |

---

## Profile Copy Script (For Reference)

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

---

## Phase 7: Industry-Based Tab Visibility (PENDING)

### Overview

Not all insight tabs are relevant to all industries. Local/Weather tabs should only appear for businesses where location and weather impact operations.

### Tab Visibility Rules

| Tab | Show For | Hide For |
|-----|----------|----------|
| **Triggers** | All industries | None |
| **Proof** | All industries | None |
| **Trends** | All industries | None |
| **Conversations** | All industries | None |
| **Competitors** | All industries | None |
| **Local** | Location-dependent businesses | Digital/remote services |
| **Weather** | Weather-sensitive industries | Indoor/digital services |

### Industries WITH Local + Weather Tabs (~95 profiles)

**Outdoor/Weather-Dependent Services:**
- garden-center, landscape-architecture, roofing-contractors, painting-contractors
- concrete-pouring, drywall-contractors, glass-glazing-contractors, masonry-contractors
- foundation-structure-contractors, framing-contractors, finish-carpentry, tile-contractors
- flooring-contractors, site-preparation-contractors, highway-street-construction
- water-sewer-construction, power-communication-line-construction, oil-gas-pipeline-construction
- heavy-construction, structural-steel-construction

**Local Retail/Food Service:**
- bar, brewery, distillery, winery, family-restaurant, buffet-restaurant
- ice-cream-shop, juice-bar, snack-bar, coffee-roasting, convenience-store
- supermarket, warehouse-club, department-store, discount-store, specialty-grocery
- fish-market, meat-market, fruit-vegetable-market, health-food-store

**Local Services:**
- automotive-services, general-automotive-repair, automotive-body-shops
- automotive-oil-change, automotive-paint-shops, automotive-exhaust-repair
- automotive-transmission-repair, specialized-auto-repair, car-rental, truck-rental
- equipment-rental, formal-wear-rental, party-supply-rental, general-rental-centers
- carpet-cleaning, janitorial-services, extermination-services, locksmith-services
- hvac-contractors, plumbing-contractors

**Local Healthcare:**
- pharmacy, diagnostic-imaging-center, hmo-medical-center, dermatology, cardiology
- endocrinology, gastroenterology, internal-medicine, neurology-practice
- orthopedic-practice, pediatric-medicine, pulmonology-practice, rheumatology-practice
- oncology-practice, urology-practice, pain-management-clinic, fertility-clinic
- family-planning-center, hearing-aid-specialist, naturopathic-medicine
- alternative-medicine, sleep-medicine, midwifery-practice, genetic-counseling
- speech-therapy, occupational-therapy

**Local Events/Community:**
- convention-planning, convention-services, tour-operator, travel-agency
- photography-services, commercial-photography, bridal-shop

### Industries WITHOUT Local/Weather Tabs (~140 profiles)

**B2B Professional Services:**
- business-consulting, management-consulting, process-consulting, scientific-consulting
- environmental-consulting, engineering-services, architecture, interior-design
- industrial-design, specialized-design, drafting-services, market-research
- public-relations, advertising-agency, marketing-services, media-buying-agency

**Digital/Remote Services:**
- software-publishers, r-d-in-technology, r-d-in-biotech, r-d-in-biotechnology
- r-d-in-nanotechnology, r-d-in-physical-sciences, social-science-research
- telemarketing, document-preparation, court-reporting, translation-services

**Staffing/Employment:**
- employment-agency, executive-search, temp-help-services, temp-staffing
- peo-services, payroll-services

**Education:**
- colleges-universities, business-schools, elementary-secondary-schools, junior-colleges
- technical-schools, cosmetology-schools, driving-schools, language-schools
- computer-training, exam-prep, apprenticeship-training, arts-instruction
- sports-instruction, professional-training

**Manufacturing:**
- bottled-water-manufacturing, soft-drink-manufacturing, juice-manufacturing
- commercial-bakery, frozen-bakery-products, cookie-cracker-manufacturing
- spice-seasoning-manufacturing, mayonnaise-dressing-manufacturing
- salsa-sauce-manufacturing, snack-food-manufacturing, perishable-food-preparation

**Financial/Insurance:**
- insurance-agencies-brokerages, insurance-carriers, credit-bureau
- collection-agency, tax-preparation-services

### Implementation Tasks

| Task | Effort | Status |
|------|--------|--------|
| 1. **Migrate 380 enhanced profiles to Supabase** (replace existing) | 2-3 hrs | ⬜ Pending |
| 2. Add `enabledTabs` field to EnhancedIndustryProfile type | 30 min | ⬜ Pending |
| 3. Create Local tab component with community events, local news | 2-3 hrs | ⬜ Pending |
| 4. Create Weather tab component with weather-based content triggers | 2-3 hrs | ⬜ Pending |
| 5. Update V4PowerModePanel to conditionally render tabs based on profile | 1 hr | ⬜ Pending |
| 6. Update 380 profiles with `enabledTabs` field (script) | 1-2 hrs | ⬜ Pending |
| 7. Test tab visibility across different industry profiles | 1 hr | ⬜ Pending |

**Total Estimated Effort: 11-14 hours**

---

### Task 1: Profile Migration to Supabase (CRITICAL)

**Objective**: Replace all existing industry profiles in Supabase with the 380 enhanced profiles containing new templates.

**Source Location**: `/Users/byronhudson/brandock/industry-enhancement/output/`
- Contains 380 NAICS-matched profiles with:
  - Extended social media templates (TikTok, Twitter threads)
  - Campaign structures (Awareness, Engagement, Conversion)
  - Research-grounded hooks and customer voice data
  - Platform benchmarks with engagement rates

**Target**: Supabase `industry_profiles` table (or equivalent)

**Migration Steps**:

1. **Backup existing Supabase profiles**
   ```bash
   # Export current profiles for rollback
   supabase db dump --data-only -t industry_profiles > backup_profiles_$(date +%Y%m%d).sql
   ```

2. **Validate local profile structure**
   ```bash
   # Count profiles and verify JSON structure
   find /Users/byronhudson/brandock/industry-enhancement/output -name "*.json" | wc -l
   # Should be 380

   # Validate JSON schema consistency
   for f in /Users/byronhudson/brandock/industry-enhancement/output/**/*.json; do
     jq -e '.naics_code and .industry_name and .research_brief' "$f" > /dev/null || echo "Invalid: $f"
   done
   ```

3. **Create migration script**
   ```typescript
   // scripts/migrate-profiles-to-supabase.ts
   import { createClient } from '@supabase/supabase-js';
   import * as fs from 'fs';
   import * as path from 'path';

   const PROFILES_DIR = '/Users/byronhudson/brandock/industry-enhancement/output';

   async function migrateProfiles() {
     const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

     // 1. Delete existing profiles
     console.log('Deleting existing profiles...');
     await supabase.from('industry_profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');

     // 2. Load and insert new profiles
     const profileFiles = fs.readdirSync(PROFILES_DIR, { recursive: true })
       .filter(f => f.toString().endsWith('.json'));

     console.log(`Found ${profileFiles.length} profiles to migrate`);

     for (const file of profileFiles) {
       const filePath = path.join(PROFILES_DIR, file.toString());
       const profile = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

       const { error } = await supabase.from('industry_profiles').upsert({
         naics_code: profile.naics_code,
         industry_name: profile.industry_name,
         industry_slug: profile.industry,
         category: profile.category,
         subcategory: profile.subcategory,
         profile_data: profile, // Store full JSON
         updated_at: new Date().toISOString()
       }, {
         onConflict: 'naics_code'
       });

       if (error) console.error(`Failed: ${profile.industry_name}`, error);
       else console.log(`Migrated: ${profile.industry_name}`);
     }

     console.log('Migration complete!');
   }

   migrateProfiles();
   ```

4. **Run migration**
   ```bash
   npx ts-node scripts/migrate-profiles-to-supabase.ts
   ```

5. **Verify migration**
   ```sql
   -- Check count
   SELECT COUNT(*) FROM industry_profiles;
   -- Should be 380

   -- Verify structure
   SELECT industry_name, naics_code,
          profile_data->'research_brief' IS NOT NULL as has_research,
          profile_data->'tiktok_content_templates' IS NOT NULL as has_tiktok
   FROM industry_profiles LIMIT 10;
   ```

**Rollback Plan**:
```bash
# If migration fails, restore from backup
psql $DATABASE_URL < backup_profiles_$(date +%Y%m%d).sql
```

### Type Definition Update

```typescript
// Add to EnhancedIndustryProfile
interface EnhancedIndustryProfile {
  // ... existing fields ...

  // Tab visibility configuration
  enabledTabs: {
    triggers: boolean;    // Always true
    proof: boolean;       // Always true
    trends: boolean;      // Always true
    conversations: boolean; // Always true
    competitors: boolean; // Always true
    local: boolean;       // true for location-dependent
    weather: boolean;     // true for weather-sensitive
  };
}
```

### Profile Update Script

```bash
# Script to add enabledTabs to all profiles
for profile in public/data/industry-profiles/*.json; do
  slug=$(basename "$profile" .json)

  # Check if weather-sensitive (outdoor services, construction, etc.)
  if echo "$slug" | grep -qE "(contractor|construction|roofing|painting|landscape|garden|hvac|plumbing)"; then
    weather=true
    local=true
  # Check if local service (retail, food, healthcare, etc.)
  elif echo "$slug" | grep -qE "(restaurant|bar|store|market|shop|pharmacy|clinic|automotive|rental)"; then
    weather=false
    local=true
  else
    weather=false
    local=false
  fi

  # Add enabledTabs to profile JSON
  jq --arg w "$weather" --arg l "$local" \
    '.enabledTabs = {triggers:true,proof:true,trends:true,conversations:true,competitors:true,local:($l=="true"),weather:($w=="true")}' \
    "$profile" > tmp.json && mv tmp.json "$profile"
done
```

---

## Related Documents

- **Content Correlation Strategies**: `.buildrunner/CONTENT_CORRELATION_STRATEGIES.md`
  - Contains: 12 insight dimensions, constraint matrices, variety algorithm, business profiles, campaign system

---

*Document Version: 2.1*
*Created: 2025-11-29*
*Updated: 2025-11-30*
*Status: Phase 7 PENDING - Tab Visibility*
