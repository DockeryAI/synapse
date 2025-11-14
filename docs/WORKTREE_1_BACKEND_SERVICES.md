# Worktree 1: Backend Services - Complete Build Guide

**Branch:** `feature/backend-services`
**Timeline:** Week 1-2 (10 days)
**Estimated Lines:** 1,750
**Your Role:** Build all core backend intelligence services

---

## 📋 QUICK START

You are Claude Instance #1. Your job is to build the backend intelligence services that power Synapse. Read this entire document, then execute tasks in order.

**Status Tracking:** Update `.buildrunner/features.json` after each task completion.

---

## 🎯 YOUR MISSION

Build 5 critical backend services that gather and process business intelligence from 16 data sources in parallel:

1. **Universal URL Parser** - Handle any URL format globally
2. **Parallel Intelligence Orchestrator** - Run 16 APIs simultaneously
3. **Specialty Detection Engine** - Identify business niche
4. **Calendar Population Service** - Generate 30 content ideas
5. **Content Ideas Generator** - Create platform-specific suggestions

**Success Criteria:**
- All services pass unit tests (80% coverage)
- Intelligence gathering completes in <30 seconds
- Graceful degradation when APIs fail
- Zero conflicts with other worktrees

---

## 🚀 SETUP INSTRUCTIONS

### Step 1: Create Your Worktree

```bash
cd /Users/byronhudson/Projects/Synapse

# Create your worktree
git worktree add ../Synapse-backend -b feature/backend-services

# Navigate to your worktree
cd /Users/byronhudson/Projects/Synapse-backend

# Verify you're on the right branch
git branch
# Should show: * feature/backend-services
```

### Step 2: Install Dependencies

```bash
# Install all npm packages
npm install

# Verify installation
npm run build
# Should complete successfully
```

### Step 3: Read Context Documents

Before starting, read these files in your worktree:
1. `SYNAPSE_PRODUCT_OVERVIEW.md` - Full product vision
2. `SYNAPSE_CALENDAR_BUILD_PLAN.md` - Technical specifications
3. `PARALLEL_BUILD_SUMMARY.md` - Coordination strategy
4. `docs/SYNAPSE_MVP_SCOPE.md` - MVP requirements

---

## ⚠️ CRITICAL PREREQUISITE: INDUSTRY DATABASE

**STOP! DO NOT START TASKS UNTIL THIS IS COMPLETE.**

### Why This Matters
Tasks 3 (Specialty Detection) and 5 (Content Ideas Generator) **require** the industry database:
- **380 NAICS Codes** - For industry classification
- **147 Industry Profiles** - For power words, emotional triggers, content themes

Without this data, your services will fail.

### Database Migration Status Check

Before starting, verify the database is ready:

```typescript
// scripts/verify-industry-database.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

async function verifyDatabase() {
  console.log('Checking industry database...')

  const { count: naicsCount } = await supabase
    .from('naics_codes')
    .select('*', { count: 'exact', head: true })

  const { count: profilesCount } = await supabase
    .from('industry_profiles')
    .select('*', { count: 'exact', head: true })

  if (naicsCount !== 380) {
    throw new Error(`❌ NAICS Codes: ${naicsCount}/380 - MIGRATION INCOMPLETE!`)
  }

  if (profilesCount !== 147) {
    throw new Error(`❌ Industry Profiles: ${profilesCount}/147 - MIGRATION INCOMPLETE!`)
  }

  console.log('✅ NAICS Codes: 380/380')
  console.log('✅ Industry Profiles: 147/147')
  console.log('✅ Industry database ready!')
}

verifyDatabase().catch(console.error)
```

Run verification:
```bash
npm run verify:industry-db
```

**If verification fails:** Contact the project lead. The database migration from MARBA must be completed first. See `SYNAPSE_CALENDAR_BUILD_PLAN.md` section "Critical: Industry Database Migration" for migration steps.

**Expected output:**
```
Checking industry database...
✅ NAICS Codes: 380/380
✅ Industry Profiles: 147/147
✅ Industry database ready!
```

Once verified, proceed to tasks.

---

## 📝 ATOMIC TASK LIST

**CRITICAL:** Complete tasks in order. Update BuildRunner after each task.

### TASK 1: Universal URL Parser
**File:** `src/services/url-parser.service.ts`
**Lines:** ~200
**Status:** ⏸️ Not Started

**Requirements:**
- Parse any URL format: example.com, www.example.com, https://example.com
- Handle international TLDs: .co.uk, .com.au, .de, etc (50+ countries)
- Extract: domain, subdomain, path, TLD, protocol
- Normalize to canonical format
- Validate URL structure
- Handle edge cases: IP addresses, localhost, ports

**Implementation:**
```typescript
export interface ParsedURL {
  original: string;
  normalized: string;
  domain: string;
  subdomain?: string;
  path: string;
  tld: string;
  protocol: string;
  isValid: boolean;
}

export class URLParserService {
  parse(url: string): ParsedURL;
  normalize(url: string): string;
  validate(url: string): boolean;
}
```

**Test Cases (minimum 50):**
- http://example.com
- www.example.com (add protocol)
- https://example.co.uk
- https://subdomain.example.com/path
- example.com:8080
- Invalid URLs should return isValid: false

**Acceptance Criteria:**
- [ ] All test cases pass
- [ ] Handles 50+ TLD formats
- [ ] Normalizes consistently
- [ ] Type-safe (no `any` types)
- [ ] JSDoc documentation complete

**Git Commit:**
```bash
git add src/services/url-parser.service.ts
git commit -m "feat(backend): Add Universal URL Parser with 50+ TLD support

- Parse any URL format globally
- Extract domain, subdomain, path, TLD
- Normalize to canonical format
- 50 test cases covering edge cases
- Type-safe implementation"
git push origin feature/backend-services
```

**Update BuildRunner:**
```bash
# Edit .buildrunner/features.json
# Find "Backend Services" sub-feature
# Update completionPercentage: 20
node .buildrunner/scripts/generate-status.mjs
git add .buildrunner/
git commit -m "chore: Update BuildRunner - URL Parser complete (20%)"
git push origin feature/backend-services
```

---

### TASK 2: Parallel Intelligence Orchestrator
**File:** `src/services/parallel-intelligence.service.ts`
**Lines:** ~500
**Status:** ⏸️ Not Started
**Dependencies:** URL Parser (Task 1)

**Requirements:**
Run 16 data sources in parallel with graceful degradation:

**16 Data Sources:**
1. Apify (web scraping)
2. OutScraper (Google Business)
3. OutScraper (Reviews)
4. Serper Search
5. Serper News
6. Serper Trends
7. Serper Autocomplete
8. Serper Places
9. Serper Images
10. Serper Videos
11. Serper Shopping
12. SEMrush (keywords)
13. YouTube API (trending)
14. News API (articles)
15. Weather API (forecast)
16. Google Maps (geocoding)

**Implementation Pattern:**
```typescript
export interface IntelligenceResult {
  source: string;
  data: any;
  success: boolean;
  error?: Error;
  duration: number;
}

export class ParallelIntelligenceService {
  async gather(url: string): Promise<IntelligenceResult[]> {
    const results = await Promise.allSettled([
      this.fetchApify(url),
      this.fetchOutScraper(url),
      // ... all 16 sources
    ]);

    const successful = results.filter(r => r.status === 'fulfilled');

    // Graceful degradation: minimum 8 sources required
    if (successful.length < 8) {
      throw new InsufficientDataError('Need at least 8 data sources');
    }

    return this.processResults(results);
  }
}
```

**Error Handling Strategy:**
- Critical sources: Apify, OutScraper, Serper Search, Claude AI (must succeed)
- Non-critical: Weather, YouTube, News (can fail)
- Minimum viable: 8 out of 16 sources
- All failures logged with severity

**Performance Requirements:**
- Complete in <30 seconds total
- Use Promise.allSettled (not Promise.all)
- Timeout each API at 15 seconds
- Cache results for 1 hour

**Acceptance Criteria:**
- [ ] All 16 APIs integrated
- [ ] Graceful degradation works
- [ ] Completes in <30 seconds
- [ ] Handles 50% failure rate
- [ ] Caching implemented
- [ ] Comprehensive error logging

**Git Commit:**
```bash
git add src/services/parallel-intelligence.service.ts
git commit -m "feat(backend): Add Parallel Intelligence Orchestrator

- Integrate 16 data sources in parallel
- Graceful degradation (min 8 sources)
- Complete in <30 seconds
- Error handling with retry logic
- Intelligent caching (1h TTL)"
git push origin feature/backend-services
```

**Update BuildRunner:** Set completionPercentage: 40

---

### TASK 3: Specialty Detection Engine
**File:** `src/services/specialty-detection.service.ts`
**Lines:** ~300
**Status:** ⏸️ Not Started
**Dependencies:**
- Intelligence Orchestrator (Task 2)
- **CRITICAL:** Industry Database (380 NAICS + 147 profiles in Supabase)

**Requirements:**
Identify business niche vs generic industry using AI analysis + industry database:

**Examples:**
- "wedding bakery" not "bakery"
- "antique car insurance" not "insurance"
- "pediatric dentist" not "dentist"
- "vegan restaurant" not "restaurant"

**Implementation:**
```typescript
export interface SpecialtyDetection {
  industry: string;           // "bakery"
  naicsCode: string;          // "722514" (from 380 NAICS codes)
  industryProfileId: string;  // "restaurant" (from 147 profiles)
  specialty: string;          // "wedding cakes"
  nicheKeywords: string[];    // ["custom cakes", "wedding events"]
  targetMarket: string;       // "engaged couples"
  confidence: number;         // 0-100
  reasoning: string;          // Why this specialty was detected
}

export class SpecialtyDetectionService {
  private supabase = createClient(...)

  async detectSpecialty(
    intelligenceData: IntelligenceResult[],
    businessName: string
  ): Promise<SpecialtyDetection> {
    // 1. Match to NAICS code using keywords
    const naicsCode = await this.matchNAICSCode(intelligenceData)

    // 2. Get industry profile from database
    const industryProfile = await this.getIndustryProfile(naicsCode)

    // 3. Detect specialty within that industry
    const specialty = await this.detectNiche(intelligenceData, industryProfile)

    return {
      industry: industryProfile.name,
      naicsCode,
      industryProfileId: industryProfile.id,
      specialty,
      ...
    }
  }

  private async matchNAICSCode(intelligence: IntelligenceResult[]): Promise<string> {
    // Extract keywords from intelligence data
    const keywords = this.extractKeywords(intelligence)

    // Query Supabase for matching NAICS codes
    const { data } = await this.supabase
      .from('naics_codes')
      .select('*')
      .contains('keywords', keywords)
      .order('level', { ascending: false }) // Prefer more specific codes
      .limit(1)

    return data?.[0]?.code || 'generic'
  }

  private async getIndustryProfile(naicsCode: string): Promise<IndustryProfile> {
    const { data } = await this.supabase
      .from('industry_profiles')
      .select('*')
      .eq('naics_code', naicsCode)
      .single()

    return data
  }
}
```

**Detection Algorithm:**
1. Extract keywords from all 16 intelligence sources
2. **Match to NAICS code** using keyword search in database (380 codes)
3. **Fetch industry profile** from database (147 profiles)
4. Use industry profile's power words + keywords to detect specialty
5. Analyze website content for specialty indicators
6. Check reviews for repeated specialty mentions
7. Use Claude AI to synthesize specialty from all sources
8. Validate specialty is more specific than industry

**Test Cases (minimum 100 businesses):**
- Generic businesses (no specialty detected)
- Clear specialty (wedding bakery)
- Multiple specialties (pick primary)
- Ambiguous cases (use AI judgment)

**Acceptance Criteria:**
- [ ] Successfully queries Supabase industry database
- [ ] Matches to NAICS code from 380 options
- [ ] Fetches industry profile from 147 profiles
- [ ] Detects specialty accurately (>90%)
- [ ] Returns confidence score
- [ ] Provides reasoning
- [ ] Handles edge cases (no match, multiple matches)
- [ ] Type-safe implementation
- [ ] Database queries complete in <10ms

**Git Commit:**
```bash
git add src/services/specialty-detection.service.ts
git commit -m "feat(backend): Add Specialty Detection Engine

- Identify business niche vs generic industry
- AI-powered analysis of all intelligence sources
- Confidence scoring and reasoning
- 100 test cases with 90% accuracy"
git push origin feature/backend-services
```

**Update BuildRunner:** Set completionPercentage: 60

---

### TASK 4: Calendar Population Service
**File:** `src/services/calendar-population.service.ts`
**Lines:** ~400
**Status:** ⏸️ Not Started
**Dependencies:** Specialty Detection (Task 3)

**Requirements:**
Generate 30 content ideas for the calendar based on business intelligence and specialty.

**Content Distribution:**
- 60% Educational content
- 30% Promotional content
- 10% Engagement content

**Implementation:**
```typescript
export interface ContentIdea {
  id: string;
  topic: string;
  platform: Platform;
  contentType: 'educational' | 'promotional' | 'engagement';
  specialty: string;
  scheduledDate: string;
  reasoning: string;
}

export class CalendarPopulationService {
  async populate(
    brandId: string,
    specialty: SpecialtyDetection,
    intelligenceData: IntelligenceResult[]
  ): Promise<ContentIdea[]> {
    // Generate 30 ideas
    const ideas = [];

    // Day 1-18: Educational (60%)
    // Day 19-27: Promotional (30%)
    // Day 28-30: Engagement (10%)

    return ideas;
  }
}
```

**Content Idea Examples (Wedding Bakery):**
- Educational: "How to choose your wedding cake flavor"
- Promotional: "Book your tasting session today"
- Engagement: "What's your dream wedding cake? 🎂"

**Platform Distribution:**
- Instagram: 40%
- Facebook: 30%
- LinkedIn: 10%
- Twitter: 20%

**Acceptance Criteria:**
- [ ] Generates exactly 30 ideas
- [ ] Proper distribution (60/30/10)
- [ ] Specialty-aware content
- [ ] Platform-optimized
- [ ] Unique ideas (no duplicates)

**Git Commit:**
```bash
git add src/services/calendar-population.service.ts
git commit -m "feat(backend): Add Calendar Population Service

- Generate 30 content ideas
- 60/30/10 distribution (educational/promotional/engagement)
- Specialty-aware content
- Platform optimization
- Intelligence-driven suggestions"
git push origin feature/backend-services
```

**Update BuildRunner:** Set completionPercentage: 80

---

### TASK 5: Content Ideas Generator
**File:** `src/services/content-ideas-generator.service.ts`
**Lines:** ~350
**Status:** ⏸️ Not Started
**Dependencies:**
- Calendar Population (Task 4)
- **CRITICAL:** Industry Database (uses power words, content themes, tone from 147 profiles)

**Requirements:**
Transform content ideas into platform-specific suggestions with industry-optimized psychology.

**Implementation:**
```typescript
export interface ContentSuggestion {
  idea: ContentIdea;
  platforms: {
    [platform: string]: {
      headline: string;
      body: string;
      hashtags: string[];
      callToAction: string;
      estimatedEngagement: number;
      powerWordsUsed: string[];  // From industry profile
      emotionalTriggers: string[]; // From industry profile
    }
  };
  buyerPersona: string;
  synapseScore: number;
  industryBenchmark: number;  // From industry profile
}

export class ContentIdeasGeneratorService {
  private supabase = createClient(...)

  async generateSuggestions(
    ideas: ContentIdea[],
    specialty: SpecialtyDetection,
    buyerPersonas: BuyerPersona[]
  ): Promise<ContentSuggestion[]> {
    // 1. Fetch industry profile for power words and themes
    const industryProfile = await this.getIndustryProfile(specialty.industryProfileId)

    // 2. Generate content using industry-specific optimization
    const suggestions = await Promise.all(ideas.map(idea =>
      this.optimizeContent(idea, industryProfile, buyerPersonas)
    ))

    return suggestions
  }

  private async getIndustryProfile(profileId: string): Promise<IndustryProfile> {
    const { data } = await this.supabase
      .from('industry_profiles')
      .select('*')
      .eq('id', profileId)
      .single()

    return data
  }

  private async optimizeContent(
    idea: ContentIdea,
    profile: IndustryProfile,
    personas: BuyerPersona[]
  ): Promise<ContentSuggestion> {
    // Use profile's power words in content
    const powerWords = profile.power_words

    // Use profile's emotional triggers
    const triggers = profile.psychology_profile.primaryTriggers

    // Use profile's tone of voice
    const tone = profile.tone_of_voice

    // Use profile's content themes
    const themes = profile.content_themes

    // Generate platform-specific content with industry optimization
    return {
      ...generateWithPsychology(idea, powerWords, triggers, tone, themes),
      industryBenchmark: profile.typical_engagement_rate
    }
  }
}
```

**Platform Customization:**
- **Instagram:** Visual focus, hashtags, emojis
- **LinkedIn:** Professional tone, industry insights
- **Twitter:** Concise, trending hashtags
- **Facebook:** Conversational, community-building

**Acceptance Criteria:**
- [ ] Fetches industry profile from Supabase
- [ ] Uses power words from industry database
- [ ] Applies emotional triggers from industry profile
- [ ] Matches tone of voice to industry standards
- [ ] Platform-specific formatting
- [ ] Buyer persona alignment
- [ ] Hashtag suggestions
- [ ] CTA included
- [ ] Engagement prediction vs industry benchmark

**Git Commit:**
```bash
git add src/services/content-ideas-generator.service.ts
git commit -m "feat(backend): Add Content Ideas Generator

- Transform ideas into platform-specific content
- Buyer persona alignment
- Hashtag and CTA suggestions
- Engagement prediction
- Multi-platform optimization"
git push origin feature/backend-services
```

**Update BuildRunner:** Set completionPercentage: 100

---

## 🧪 TESTING REQUIREMENTS

### Unit Tests (Required)

Create test files for each service:
- `url-parser.service.test.ts` (50 test cases)
- `parallel-intelligence.service.test.ts` (mock all APIs)
- `specialty-detection.service.test.ts` (100 sample businesses)
- `calendar-population.service.test.ts` (verify distribution)
- `content-ideas-generator.service.test.ts` (platform checks)

### Coverage Target: 80%

```bash
npm run test:coverage
# Must show ≥80% coverage
```

### Integration Tests

Test the full pipeline:
```typescript
describe('Backend Services Integration', () => {
  it('should process URL through full pipeline', async () => {
    const url = 'https://weddingcakes.com';

    // 1. Parse URL
    const parsed = await urlParser.parse(url);

    // 2. Gather intelligence
    const intelligence = await intelligenceOrchestrator.gather(parsed);

    // 3. Detect specialty
    const specialty = await specialtyDetector.detect(intelligence);

    // 4. Populate calendar
    const ideas = await calendarPopulator.populate(specialty, intelligence);

    // 5. Generate suggestions
    const suggestions = await ideasGenerator.generate(ideas, specialty);

    expect(suggestions).toHaveLength(30);
    expect(specialty.specialty).toContain('wedding');
  });
});
```

---

## ✅ QUALITY GATES

Before pushing any code, verify:

```bash
# TypeScript type checking
npm run typecheck
# Must pass with 0 errors

# Linting
npm run lint
# Must pass with 0 errors

# Tests
npm run test
# Must pass 100%

# Coverage
npm run test:coverage
# Must be ≥80%

# Build
npm run build
# Must complete successfully
```

---

## 🚫 WHAT NOT TO DO

**DO NOT modify these files (other developers own them):**
- `pages/SynapsePage.tsx` (Developer 4)
- `components/calendar/*` (Already exists)
- `components/uvp-wizard/*` (Developer 4)
- Any SocialPilot related files (Developer 3)

**DO create these directories if needed:**
- `services/mocks/` (for testing)
- `services/utils/` (for helpers)
- `types/backend/` (for your types)

---

## 📊 PROGRESS TRACKING

### Daily Updates

**9:00 AM:** Post standup update in `#synapse-backend`:
```
Day X Progress:
- Completed: [task name]
- Today: [task name]
- Blockers: [none/details]
- Completion: X%
```

**5:00 PM:** Push all code and update BuildRunner:
```bash
git add .
git commit -m "chore: Daily progress update - [what you did]"
git push origin feature/backend-services
```

### BuildRunner Updates

After each task, update `.buildrunner/features.json`:
```json
{
  "name": "Backend Services",
  "status": "in_progress",
  "completionPercentage": 40,  // Update this
  "lastUpdated": "2025-11-XX"
}
```

Then regenerate status:
```bash
node .buildrunner/scripts/generate-status.mjs
git add .buildrunner/
git commit -m "chore: Update BuildRunner - [task name] complete (X%)"
git push origin feature/backend-services
```

---

## 🔄 MERGE STRATEGY

**Week 2 End:** Your worktree will be merged to main.

**Before merge, ensure:**
- [ ] All 5 tasks complete
- [ ] All tests passing
- [ ] 80% code coverage
- [ ] TypeScript strict mode passes
- [ ] No console.log statements
- [ ] Documentation complete
- [ ] BuildRunner at 100%

**Merge command (done by project lead):**
```bash
cd /Users/byronhudson/Projects/Synapse
git checkout main
git merge feature/backend-services
npm run build
git push origin main
```

---

## 📞 GETTING HELP

**Slack Channels:**
- `#synapse-backend` - Your updates
- `#synapse-blockers` - Urgent help

**Dependency Issues:**
If you need code from another developer:
1. Create a mock interface (Day 1-3)
2. Cherry-pick their commit (Day 4+)
3. Wait for merge (Week 2+)

**Example Mock:**
```typescript
// services/mocks/calendar.mock.ts
export const calendarMock = {
  getItems: async () => [],
  createItem: async () => ({ id: 'test' })
}
```

---

## 🎯 SUCCESS CRITERIA

You're done when:
- [ ] All 5 services implemented
- [ ] All tests passing (80% coverage)
- [ ] BuildRunner shows 100%
- [ ] No TypeScript errors
- [ ] Code reviewed by team
- [ ] Ready for merge to main

**Estimated Time:** 10 days (Week 1-2)

**Your Impact:** These services power the entire Synapse platform!

---

## 📚 REFERENCE DOCUMENTS

In your worktree:
- `SYNAPSE_PRODUCT_OVERVIEW.md` - Product vision
- `SYNAPSE_CALENDAR_BUILD_PLAN.md` - Technical specs
- `PARALLEL_BUILD_SUMMARY.md` - Team coordination
- `docs/SYNAPSE_MVP_SCOPE.md` - MVP requirements
- `.buildrunner/features.json` - Feature tracking

---

**Ready to start? Begin with TASK 1: Universal URL Parser**

**Questions? Check `#synapse-backend` Slack channel**

**Good luck! 🚀**
