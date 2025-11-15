# Worktree Task: Dynamic Industry Profile Auto-Generation

**Feature ID:** `industry-profile-auto-generation`
**Branch:** `feature/industry-autogen`
**Estimated Time:** 10 hours
**Priority:** CRITICAL
**Dependencies:** Foundation
**Worktree Path:** `../synapse-industry`
**Special:** Requires finding/adapting Brandock profile generator script

---

## Context

Auto-generate comprehensive industry profiles using Claude Opus when user enters an unknown industry. NAICS code detection → user confirmation → 2-3 minute profile build with real-time progress → permanent storage.

**8 Profile Sections (2-3 min total):**
1. Industry Overview (10-15s)
2. Target Demographics (15-20s)
3. Competitive Landscape (20-25s)
4. Customer Psychology & Pain Points (25-30s)
5. Content Pillars & Topics (20-25s)
6. Seasonal Trends & Events (15-20s)
7. Platform Preferences (10-15s)
8. Messaging Framework (15-20s)

---

## Setup

```bash
cd /Users/byronhudson/Projects/Synapse
git worktree add ../synapse-industry feature/industry-autogen
cd ../synapse-industry
npm install
```

**IMPORTANT:** Find Brandock profile generator script
```bash
# Look in Brandock project folder
ls ~/Projects/Brandock/scripts/
# Or search for industry profile generation
grep -r "industry profile" ~/Projects/Brandock/
```

---

## Task Checklist

### Part 1: NAICS Detection

#### File: `src/services/naics-detector.service.ts`

- [ ] `detectNAICSCode(industryInput: string): Promise<NAICSCandidate[]>`
  - Send industry name to Claude Opus
  - Prompt: "What NAICS code best matches: '[industryInput]'? Provide top 3 matches with confidence scores."
  - Return candidates with code, title, confidence

- [ ] `validateNAICSCode(code: string): Promise<boolean>`
  - Check if code exists in `naics_codes` table
  - Return true/false

- [ ] `saveNAICSMapping(userInput: string, naicsCode: string)`
  - Save to `naics_mappings` table for fuzzy matching
  - Future users typing same industry get instant match

### Part 2: Profile Generation

#### File: `src/services/industry-profile-generator.service.ts`

**Adapt from Brandock script:**
- [ ] `generateIndustryProfile(naicsCode: string, industryName: string): Promise<IndustryProfile>`
  - Orchestrates 8-phase generation
  - Uses Claude Opus for each section
  - Emits progress events
  - Saves to database

**8 Generation Functions:**
- [ ] `generateIndustryOverview(industry: string): Promise<string>`
- [ ] `generateDemographics(industry: string): Promise<Demographics>`
- [ ] `generateCompetitiveLandscape(industry: string): Promise<string>`
- [ ] `generateCustomerPsychology(industry: string): Promise<PainPoints>`
- [ ] `generateContentPillars(industry: string): Promise<string[]>`
- [ ] `generateSeasonalTrends(industry: string): Promise<SeasonalEvent[]>`
- [ ] `generatePlatformPreferences(industry: string): Promise<Platform[]>`
- [ ] `generateMessagingFramework(industry: string): Promise<MessagingGuidelines>`

**Progress Tracking:**
```typescript
export class ProfileGenerator extends EventEmitter {
  async generate(naics: string, name: string) {
    this.emit('progress', { phase: 'Industry Overview', percent: 10 })
    const overview = await generateIndustryOverview(name)

    this.emit('progress', { phase: 'Target Demographics', percent: 25 })
    const demographics = await generateDemographics(name)

    // ... continue for all 8 phases

    this.emit('complete', { profile })
  }
}
```

### Part 3: Real-Time Progress UI

#### File: `src/components/industry/ProfileGenerationProgress.tsx`

- [ ] Modal overlay showing progress
- [ ] Progress bar (0-100%)
- [ ] Current phase display with icon
- [ ] Time elapsed and ETA
- [ ] Phase checklist (✓ completed, 🔄 in progress, ⏳ pending)
- [ ] Confetti animation on completion
- [ ] "Customize Profile" button when done

#### File: `src/components/industry/NAICSConfirmation.tsx`

- [ ] Show detected NAICS code candidates
- [ ] User selects correct one or enters custom
- [ ] Confirm before starting generation
- [ ] "This will take 2-3 minutes" messaging

### Part 4: Database & Caching

**Check before generating:**
```typescript
// Does NAICS already have a profile?
const existing = await supabase
  .from('industry_profiles')
  .select('*')
  .eq('naics_code', code)
  .single()

if (existing) return existing // Skip generation
```

**Save after generation:**
```typescript
await supabase.from('industry_profiles').insert({
  naics_code: code,
  industry_name: name,
  profile_data: generatedProfile,
  generated_at: new Date(),
  profile_version: '1.0'
})
```

**Queue system:**
- [ ] Use `profile_generation_queue` table
- [ ] Prevent duplicate simultaneous generations
- [ ] If user A starts "mobile pet grooming", user B waits for result

---

## Type Definitions

```typescript
export interface IndustryProfile {
  naicsCode: string
  industryName: string
  overview: string
  demographics: Demographics
  competitiveLandscape: string
  customerPsychology: PainPoints
  contentPillars: string[]
  seasonalTrends: SeasonalEvent[]
  platformPreferences: Platform[]
  messagingFramework: MessagingGuidelines
  generatedAt: Date
  version: string
}

export interface NAICSCandidate {
  code: string
  title: string
  description: string
  confidence: number
}

// ... more types
```

---

## Opus Prompts (Key to Quality)

**Industry Overview:**
```
Analyze the [industry name] industry. Provide:
- Market size and growth trends
- Key characteristics
- Typical business models
- Regulatory considerations
- Technology adoption level

Format as structured markdown.
```

**Customer Psychology:**
```
For businesses in [industry name], identify:
- Primary pain points customers experience
- Motivations for purchasing
- Buying triggers and decision factors
- Common objections
- Emotional drivers

Focus on actionable insights for content marketing.
```

*(Adapt from Brandock script if found)*

---

## Edge Cases

1. **No matching NAICS:**
   - Let user enter free text
   - Opus generates closest match
   - Save as custom industry

2. **Opus timeout:**
   - Save partial progress
   - Retry failed sections
   - Allow manual completion

3. **Duplicate requests:**
   - Check queue before starting
   - Show "Already generating..." message
   - Notify when complete

---

## Testing

```typescript
it('detects NAICS for common industries', async () => {
  const result = await detectNAICSCode('dental practice')
  expect(result[0].code).toBe('621210') // Dentist offices
  expect(result[0].confidence).toBeGreaterThan(0.8)
})

it('generates complete profile in under 3 minutes', async () => {
  const start = Date.now()
  const profile = await generateIndustryProfile('812990', 'mobile pet grooming')
  const duration = Date.now() - start

  expect(duration).toBeLessThan(180000) // 3 min
  expect(profile.contentPillars).toHaveLength(5)
})

it('caches generated profiles', async () => {
  // First generation
  await generateIndustryProfile('621210', 'dentist')

  // Second request should use cache
  const start = Date.now()
  const cached = await generateIndustryProfile('621210', 'dentist')
  const duration = Date.now() - start

  expect(duration).toBeLessThan(100) // Instant
})
```

---

## Completion Criteria

- [ ] NAICS detection working with Opus
- [ ] All 8 profile sections generate correctly
- [ ] Real-time progress UI functional
- [ ] Profiles save to database
- [ ] Caching prevents duplicate generation
- [ ] Queue system handles concurrent requests
- [ ] User confirmation flow complete
- [ ] Tested with 3+ industries
- [ ] Brandock script adapted (if found)
- [ ] No TS errors

---

## Commit & Merge

```bash
git add .
git commit -m "feat: Add dynamic industry profile auto-generation

- NAICS code detection with Claude Opus
- 8-phase profile generation (2-3 min)
- Real-time progress UI with phase tracking
- Profile caching and queue system
- User confirmation flow
- Permanent storage for reuse

Implements industry-profile-auto-generation feature"

git push origin feature/industry-autogen
cd /Users/byronhudson/Projects/Synapse
git merge --no-ff feature/industry-autogen
git worktree remove ../synapse-industry
```

---

**FIND THAT BRANDOCK SCRIPT FIRST.** Don't reinvent the wheel if it exists.
