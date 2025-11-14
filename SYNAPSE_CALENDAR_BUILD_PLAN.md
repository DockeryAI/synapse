# Synapse + Content Calendar - Unified Build Plan
**Vision:** Create calendar of content ideas → Automate posting to social media
**Timeline:** 4 weeks parallel development
**Current Status:** 15% complete (infrastructure ready)

---

## 🎯 END GOAL

**User Flow:**
1. Enter business URL → Synapse analyzes everything (3 min)
2. Click "Generate Content Calendar" → 30 days of ideas created (1 min)
3. Review & approve → Content auto-schedules to SocialPilot
4. Done. Content posts automatically for 30 days.

**Tech Flow:**
```
URL → Intelligence Gathering → Specialty Detection → UVP Building
  → Content Generation (30 posts) → Calendar Population
  → SocialPilot Scheduling → Automated Publishing → Analytics
```

---

## 📊 CURRENT STATE

### Already Built (In MARBA, copied to Synapse)
✅ **Content Calendar Components** (17 files, 4,500 lines)
- CalendarView with drag-and-drop
- ContentGenerator (MARBA/Synapse dual mode)
- BulkContentGenerator (30-day generation)
- PublishingQueue (scheduling engine)
- OpportunityFeed (intelligence-driven ideas)
- ContentItem cards with engagement tracking
- All services and types

✅ **Synapse Services** (Partial)
- SynapseContentGenerator
- DeepContextBuilder
- LocationDetectionService (5-strategy global detection)
- CompetitiveIntelligence

### Not Yet Built (Critical Path)
❌ Universal URL Parser
❌ Parallel Intelligence Gatherer
❌ Specialty Detection Engine
❌ Enhanced UVP Wizard
❌ SocialPilot Integration
❌ Calendar ↔ Synapse Integration
❌ Automated Publishing Pipeline

---

## 🏗️ UNIFIED ARCHITECTURE

### Phase 1: Smart Onboarding (Backend Heavy)
**Goal:** URL → Business Intelligence → Content Strategy

**Components to Build:**
1. **Universal URL Parser Service**
   - Handles any URL format globally
   - Normalizes international TLDs
   - File: `services/url-parser.service.ts`
   - Lines: ~200

2. **Parallel Intelligence Orchestrator**
   - Runs 16 data sources simultaneously
   - Apify, OutScraper, Serper (8 endpoints), SEMrush, YouTube, News, Weather, Claude, Maps in parallel
   - File: `services/parallel-intelligence.service.ts`
   - Lines: ~500
   - Speed: 30 seconds total

3. **Specialty Detection Engine**
   - "wedding bakery" vs "bakery"
   - "antique car insurance" vs "insurance"
   - File: `services/specialty-detection.service.ts`
   - Lines: ~300

4. **Enhanced UVP Wizard**
   - Evidence-based suggestions
   - "Found on About page", "Mentioned 47 times"
   - File: `components/uvp-wizard/EnhancedUVPWizard.tsx`
   - Lines: ~600

### Phase 2: Content Calendar Integration (Frontend + Backend)
**Goal:** Synapse Intelligence → Calendar Population

**Components to Build:**
1. **Calendar Population Service**
   - Takes Synapse intelligence + specialty data
   - Generates 30 content ideas
   - File: `services/calendar-population.service.ts`
   - Lines: ~400

2. **Content Ideas Generator**
   - Uses specialty + buyer personas
   - Creates content suggestions
   - File: `services/content-ideas-generator.service.ts`
   - Lines: ~350

3. **Synapse → Calendar Bridge**
   - Connects intelligence to calendar
   - File: `services/synapse-calendar-bridge.service.ts`
   - Lines: ~250

4. **Enhanced SynapsePage**
   - Add "Generate Calendar" button
   - Show content preview
   - File: `pages/SynapsePage.tsx` (expand from 57 → 500 lines)

### Phase 3: SocialPilot Integration (Backend + API)
**Goal:** Calendar → Automated Posting

**Components to Build:**
1. **SocialPilot API Service**
   - OAuth connection
   - Account sync
   - Post scheduling
   - File: `services/socialpilot.service.ts`
   - Lines: ~450

2. **Publishing Automation Engine**
   - Monitors publishing queue
   - Auto-publishes at scheduled times
   - File: `services/publishing-automation.service.ts`
   - Lines: ~400

3. **SocialPilot Sync Component**
   - UI for connecting accounts
   - File: `components/calendar/SocialPilotSync.tsx`
   - Lines: ~300

4. **Post Status Tracker**
   - Real-time publishing status
   - Error handling & retry
   - File: `services/post-status-tracker.service.ts`
   - Lines: ~250

### Phase 4: Integration & Polish (Full Stack)
**Goal:** Everything works end-to-end

**Tasks:**
1. End-to-end flow testing
2. Error handling throughout
3. Loading states & animations
4. Analytics integration
5. Performance optimization
6. Mobile responsiveness
7. Documentation
8. Demo mode with sample data

---

## 📋 COMPLETE FEATURE BREAKDOWN

### Feature 1: Universal URL Parser ⚡ CRITICAL
**Status:** Pending
**Priority:** P0 (blocks everything)
**Estimated Lines:** 200

**Files:**
- `services/url-parser.service.ts`

**Capabilities:**
- Parse example.com, www.example.com, https://example.com
- Handle .co.uk, .com.au, .de, etc (50+ TLDs)
- Extract domain, subdomain, path
- Validate URL structure
- Normalize for consistency

**Dependencies:** None
**Can Build in Parallel:** Yes (no dependencies)

---

### Feature 2: Parallel Intelligence Gatherer ⚡ CRITICAL
**Status:** Pending
**Priority:** P0 (core functionality)
**Estimated Lines:** 500

**Files:**
- `services/parallel-intelligence.service.ts`

**APIs:**
- Apify (web scraping)
- OutScraper (Google Business + reviews)
- Serper (search intelligence)
- OpenRouter (Claude synthesis)
- Reddit (opportunity discovery)

**Flow:**
```typescript
// Graceful degradation pattern with error handling
const results = await Promise.allSettled([
  apifyService.scrapeWebsite(url),
  outscraperService.getBusinessProfile(businessName),
  outscraperService.getReviews(businessName),
  serperService.searchBusiness(businessName),
  serperService.findCompetitors(industry),
  serperService.getNews(industry),
  serperService.getTrends(location),
  serperService.getAutocomplete(query),
  serperService.getPlaces(location),
  serperService.getImages(brandName),
  serperService.getVideos(industry),
  serperService.getShopping(products),
  semrushService.getKeywords(domain),
  youtubeAPI.getTrending(industry),
  newsAPI.getArticles(industry),
  weatherAPI.getForecast(location),
  redditService.discoverOpportunities(specialty, location),
])

// Minimum viable data threshold
const successful = results.filter(r => r.status === 'fulfilled')
if (successful.length < 8) {
  throw new InsufficientDataError('Need at least 8 data sources')
}
```

**Output:** Deep business intelligence in 30 seconds

**Error Handling Strategy:**
- Minimum 8 sources required (50% threshold)
- Critical sources: Apify, OutScraper, Serper Search, Claude AI
- Non-critical can fail: Weather, YouTube, News
- All failures logged with severity levels

**Dependencies:** URL Parser
**Can Build in Parallel:** Yes (after URL Parser)

---

### Feature 3: Specialty Detection Engine ⚡ CRITICAL
**Status:** Pending
**Priority:** P0 (content quality)
**Estimated Lines:** 300

**Files:**
- `services/specialty-detection.service.ts`

**Function:**
```typescript
detectSpecialty(websiteContent, businessName) {
  // Returns: "wedding bakery" not "bakery"
  // Returns: "antique car insurance" not "insurance"
  return {
    industry: "bakery",
    specialty: "wedding cakes",
    niche_keywords: ["custom cakes", "wedding events"],
    target_market: "engaged couples"
  }
}
```

**Dependencies:** Parallel Intelligence data
**Can Build in Parallel:** Yes (after Intelligence Gatherer)

---

### Feature 4: Enhanced UVP Wizard 🎨 HIGH
**Status:** Pending
**Priority:** P1 (user experience)
**Estimated Lines:** 600

**Files:**
- `components/uvp-wizard/EnhancedUVPWizard.tsx`
- `components/uvp-wizard/EvidenceTag.tsx`

**Features:**
- Evidence citations ("Found on About page")
- Frequency tracking ("Mentioned 47 times")
- AI-powered suggestions
- Interactive editing
- Progress tracking

**Dependencies:** Intelligence data, Specialty detection
**Can Build in Parallel:** Yes (frontend can be built independently)

---

### Feature 5: Reddit Opportunity Service 🔍 HIGH
**Status:** Pending
**Priority:** P1 (SMB intelligence)
**Estimated Lines:** 400

**Files:**
- `services/reddit-opportunity.service.ts`

**Function:**
```typescript
discoverOpportunities(specialty, location) {
  // Find people asking for services the SMB provides
  // Not looking for brand mentions (SMBs rarely mentioned)
  return {
    opportunities: RedditOpportunity[], // Service requests
    topCommunities: string[],          // 10-20 relevant subreddits
    contentIdeas: string[]             // FAQs from discussions
  }
}
```

**SMB-Specific Features:**
- Problem discovery ("looking for", "need help with" posts)
- Niche community mapping (find where customers congregate)
- Local opportunity detection (city/region subreddits)
- Content idea extraction (frequently asked questions)
- Competitor intelligence (what works for similar businesses)

**Dependencies:** Specialty detection, Reddit OAuth
**Can Build in Parallel:** Yes (after Specialty detection)

---

### Feature 6: Calendar Population Service ⚡ CRITICAL
**Status:** Pending
**Priority:** P0 (core integration)
**Estimated Lines:** 400

**Files:**
- `services/calendar-population.service.ts`

**Function:**
```typescript
populateCalendar(brandId, intelligenceData, specialty, redditOpportunities) {
  // Generate 30 content ideas for calendar
  // Mix of promotional, educational, engagement
  // Based on specialty + intelligence + Reddit insights
  return ContentItem[] // 30 posts
}
```

**Dependencies:** Specialty detection, Reddit opportunities, Calendar components
**Can Build in Parallel:** Partially (needs specialty data)

---

### Feature 7: SocialPilot Integration ⚡ CRITICAL
**Status:** Pending
**Priority:** P0 (automation goal)
**Estimated Lines:** 450

**Files:**
- `services/socialpilot.service.ts`
- `components/calendar/SocialPilotSync.tsx`

**Features:**
- OAuth authentication
- Account synchronization
- Multi-platform posting (Instagram, Facebook, Twitter, LinkedIn)
- Schedule management
- Status tracking

**API Endpoints:**
- POST /oauth/connect
- GET /accounts/list
- POST /posts/create
- POST /posts/schedule
- GET /posts/status

**Dependencies:** Calendar system
**Can Build in Parallel:** Yes (API integration is independent)

---

### Feature 8: Publishing Automation Engine ⚡ CRITICAL
**Status:** Pending
**Priority:** P0 (automation goal)
**Estimated Lines:** 400

**Files:**
- `services/publishing-automation.service.ts`
- `services/post-status-tracker.service.ts`

**Function:**
- Background job runs every 5 minutes
- Checks publishing queue for posts due now
- Publishes via SocialPilot
- Updates status in real-time
- Handles errors & retry logic

**Dependencies:** SocialPilot integration
**Can Build in Parallel:** Yes (after SocialPilot service)

---

### Feature 9: Enhanced SynapsePage 🎨 HIGH
**Status:** Pending (placeholder exists)
**Priority:** P1 (main UI)
**Estimated Lines:** 500

**Files:**
- `pages/SynapsePage.tsx` (expand from 57 → 500 lines)

**New Features:**
- "Generate Calendar" button
- Real-time intelligence preview
- Content preview cards
- Calendar integration
- SocialPilot connection status

**Dependencies:** All backend services
**Can Build in Parallel:** Partially (can build UI, wire later)

---

## 🧪 TESTING STRATEGY

### Phase 1 Tests: Core Intelligence (Backend)
**Unit Tests:**
- URL Parser: 50 test cases for different formats
- Intelligence Orchestrator: Mock all 17 APIs (including Reddit)
- Specialty Detection: 100 sample businesses
- Reddit Opportunity Service: Mock OAuth and API responses
- Code Coverage Target: 80%

**Integration Tests:**
- Parallel execution with timeout handling
- Graceful degradation with 50% API failures
- Cache hit/miss scenarios
- Rate limit handling

**Load Tests:**
- 100 concurrent URL processing
- 1000 requests/minute capacity
- Memory leak detection
- Database connection pooling

### Phase 2 Tests: Calendar System
**Unit Tests:**
- CRUD operations for all entities
- Calendar view rendering
- Drag-drop event handling
- Content generation variations

**Integration Tests:**
- End-to-end content creation flow
- Cross-browser compatibility (Chrome, Safari, Firefox)
- Mobile responsiveness
- Timezone handling

**Performance Tests:**
- 10,000 calendar items rendering
- Bulk operations (100 posts)
- Real-time updates via WebSockets

### Phase 3 Tests: SocialPilot
**Unit Tests:**
- OAuth flow mocking
- API response handling
- Error recovery logic

**Integration Tests:**
- Full OAuth round-trip
- Multi-platform posting
- Rate limit compliance
- Retry mechanism

### Phase 4 Tests: End-to-End
**Smoke Tests:**
- Critical path: URL → Intelligence → Content → Publish
- All UI interactions
- API integration health checks

**Regression Tests:**
- Previous bug fixes verified
- Performance benchmarks maintained
- Security vulnerabilities scanned

---

## 🗄️ DATABASE MIGRATION STRATEGY

### Critical: Industry Database Migration (Day 0 - BEFORE ALL ELSE)

**MUST COMPLETE FIRST:** All backend services depend on this data.

**Source:** MARBA project `/Users/byronhudson/Projects/MARBA`
**Destination:** New Synapse Supabase project

**Step-by-Step Migration:**

1. **Export Data from MARBA (30 minutes)**
```bash
cd /Users/byronhudson/Projects/MARBA

# Export NAICS codes (380 records)
node scripts/export-naics.js > data/naics_codes.json

# Export Industry Profiles (147 records)
node scripts/export-industry-profiles.js > data/industry_profiles.json

# Verify record counts
jq 'length' data/naics_codes.json  # Should show 380
jq 'length' data/industry_profiles.json  # Should show 147
```

2. **Create Supabase Tables (15 minutes)**
```sql
-- Migration: 000_industry_database.sql

-- NAICS Codes Table (380 records)
CREATE TABLE naics_codes (
  code VARCHAR(20) PRIMARY KEY,  -- "541618" or "541618-CONST"
  parent_code VARCHAR(20) REFERENCES naics_codes(code),
  level INTEGER NOT NULL,        -- 2, 3, 4, 6, 7
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  is_standard BOOLEAN DEFAULT true,
  keywords TEXT[],               -- Array of detection keywords
  created_at TIMESTAMP DEFAULT NOW()
);

-- Industry Profiles Table (147 records)
CREATE TABLE industry_profiles (
  id VARCHAR(50) PRIMARY KEY,    -- "restaurant", "cpa", "dentist"
  naics_code VARCHAR(20) REFERENCES naics_codes(code),
  name TEXT NOT NULL,
  target_audience TEXT NOT NULL,

  -- Psychology (JSONB for flexibility)
  psychology_profile JSONB NOT NULL, -- primaryTriggers, emotionalFramework, etc.

  -- Content Strategy
  power_words TEXT[] NOT NULL,
  content_themes TEXT[] NOT NULL,
  tone_of_voice TEXT NOT NULL,

  -- Platform Optimization
  best_posting_times JSONB NOT NULL,  -- Array of {dayOfWeek, hourOfDay, platform, reasoning}
  posting_frequency JSONB NOT NULL,   -- {optimal, minimum, maximum}
  platform_priority TEXT[] NOT NULL,

  -- Benchmarks
  typical_engagement_rate DECIMAL(5,2),
  benchmarks JSONB,                   -- {likes, comments, shares}

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX idx_naics_parent ON naics_codes(parent_code);
CREATE INDEX idx_naics_keywords ON naics_codes USING GIN(keywords);
CREATE INDEX idx_industry_naics ON industry_profiles(naics_code);
CREATE INDEX idx_industry_name ON industry_profiles(name);
```

3. **Import Data to Supabase (45 minutes)**
```typescript
// scripts/import-industry-data.ts
import { createClient } from '@supabase/supabase-js'
import naicsCodes from '../data/naics_codes.json'
import industryProfiles from '../data/industry_profiles.json'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

async function importIndustryData() {
  console.log('Importing 380 NAICS codes...')

  // Batch insert NAICS codes (50 at a time to avoid timeouts)
  for (let i = 0; i < naicsCodes.length; i += 50) {
    const batch = naicsCodes.slice(i, i + 50)
    const { error } = await supabase.from('naics_codes').insert(batch)

    if (error) throw error
    console.log(`Imported ${i + batch.length}/${naicsCodes.length} NAICS codes`)
  }

  console.log('✅ All 380 NAICS codes imported')

  console.log('Importing 147 industry profiles...')

  // Batch insert industry profiles (20 at a time - profiles are larger)
  for (let i = 0; i < industryProfiles.length; i += 20) {
    const batch = industryProfiles.slice(i, i + 20)
    const { error } = await supabase.from('industry_profiles').insert(batch)

    if (error) throw error
    console.log(`Imported ${i + batch.length}/${industryProfiles.length} profiles`)
  }

  console.log('✅ All 147 industry profiles imported')
}

// Verify data integrity
async function verifyImport() {
  const { count: naicsCount } = await supabase
    .from('naics_codes')
    .select('*', { count: 'exact', head: true })

  const { count: profilesCount } = await supabase
    .from('industry_profiles')
    .select('*', { count: 'exact', head: true })

  console.log(`NAICS Codes: ${naicsCount}/380 ✅`)
  console.log(`Industry Profiles: ${profilesCount}/147 ✅`)

  if (naicsCount !== 380 || profilesCount !== 147) {
    throw new Error('Data integrity check FAILED!')
  }

  console.log('✅ Data integrity verified')
}

importIndustryData()
  .then(verifyImport)
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Migration failed:', err)
    process.exit(1)
  })
```

4. **Run Migration (15 minutes)**
```bash
# Set environment variables
export SUPABASE_URL="https://xxx.supabase.co"
export SUPABASE_SERVICE_KEY="your-service-key"

# Run migration
npm run migrate:industry-data

# Expected output:
# Importing 380 NAICS codes...
# Imported 50/380 NAICS codes
# ...
# ✅ All 380 NAICS codes imported
# ✅ All 147 industry profiles imported
# NAICS Codes: 380/380 ✅
# Industry Profiles: 147/147 ✅
# ✅ Data integrity verified
```

5. **Update Brand Schema (5 minutes)**
```sql
-- Migration: 000_update_brands_for_industry.sql
ALTER TABLE brands ADD COLUMN naics_code VARCHAR(20) REFERENCES naics_codes(code);
ALTER TABLE brands ADD COLUMN industry_profile_id VARCHAR(50) REFERENCES industry_profiles(id);

CREATE INDEX idx_brands_naics ON brands(naics_code);
CREATE INDEX idx_brands_industry ON brands(industry_profile_id);
```

**Total Time:** ~2 hours
**Completion Criteria:**
- [ ] 380 NAICS codes in Supabase
- [ ] 147 industry profiles in Supabase
- [ ] All foreign keys valid
- [ ] Indexes created
- [ ] Test queries working (fetch profile by NAICS, search by keywords)

**Blockers if Skipped:** Specialty Detection, Content Generation, Smart Scheduling will all fail without this data.

---

### Migration Principles
1. **Zero Downtime:** All migrations must be backwards compatible
2. **Rollback Ready:** Every migration has a down() method
3. **Data Integrity:** Validate before and after migration
4. **Version Control:** Sequential numbering (001, 002, etc.)

### Migration Files Structure
```
supabase/migrations/
├── 000_industry_database.sql              (NEW - MUST RUN FIRST)
├── 000_update_brands_for_industry.sql     (NEW - Links brands to industries)
├── 001_initial_schema.sql
├── 002_add_intelligence_tables.sql
├── 003_add_calendar_tables.sql
├── 004_add_socialpilot_tables.sql
├── 005_add_analytics_tables.sql
└── 006_add_indexes.sql
```

### Migration Process
```bash
# Test migration locally
supabase db reset
supabase db push

# Apply to staging
supabase db push --db-url $STAGING_URL

# Verify data integrity
npm run test:db

# Apply to production
supabase db push --db-url $PRODUCTION_URL

# Rollback if needed
supabase db reset --db-url $PRODUCTION_URL
supabase db push --db-url $PRODUCTION_URL --version 005
```

### Schema Versioning
```sql
CREATE TABLE schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TIMESTAMP DEFAULT NOW(),
  checksum VARCHAR(64)
);
```

### Backup Strategy
- Automated daily backups (30-day retention)
- Pre-migration snapshot
- Point-in-time recovery capability
- Test restore procedure monthly

---

## ⚡ PARALLEL BUILD STRATEGY

### Git Worktree Architecture

We'll use **git worktrees** to build 4 features simultaneously:

```
/Users/byronhudson/Projects/Synapse/          (main)
/Users/byronhudson/Projects/Synapse-backend/  (feature/backend-services)
/Users/byronhudson/Projects/Synapse-calendar/ (feature/calendar-integration)
/Users/byronhudson/Projects/Synapse-social/   (feature/socialpilot)
/Users/byronhudson/Projects/Synapse-ui/       (feature/ui-enhancements)
```

### Worktree 1: Backend Services (Week 1-2)
**Branch:** `feature/backend-services`
**Owner:** Claude Instance 1

**Build:**
1. Universal URL Parser (Day 1)
2. Parallel Intelligence Gatherer (Day 2-3)
3. Specialty Detection Engine (Day 4)
4. Calendar Population Service (Day 5)

**Files Created:**
- `services/url-parser.service.ts`
- `services/parallel-intelligence.service.ts`
- `services/specialty-detection.service.ts`
- `services/calendar-population.service.ts`
- `services/content-ideas-generator.service.ts`

**Lines:** ~1,750
**No Conflicts:** Pure backend, no UI

---

### Worktree 2: Calendar Integration (Week 1-2)
**Branch:** `feature/calendar-integration`
**Owner:** Claude Instance 2

**Build:**
1. Synapse → Calendar bridge (Day 1-2)
2. Enhanced content generation (Day 3-4)
3. Intelligence → Ideas pipeline (Day 5)

**Files Created:**
- `services/synapse-calendar-bridge.service.ts`
- `services/enhanced-content-generator.service.ts`
- `components/calendar/IntelligencePanel.tsx`

**Lines:** ~800
**Potential Conflicts:** Low (different files)

---

### Worktree 3: SocialPilot Integration (Week 2-3)
**Branch:** `feature/socialpilot`
**Owner:** Claude Instance 3

**Build:**
1. SocialPilot API service (Day 1-2)
2. OAuth flow (Day 3)
3. Publishing automation (Day 4-5)
4. Status tracker (Day 6-7)

**Files Created:**
- `services/socialpilot.service.ts`
- `services/publishing-automation.service.ts`
- `services/post-status-tracker.service.ts`
- `components/calendar/SocialPilotSync.tsx`
- `components/calendar/AccountSelector.tsx`

**Lines:** ~1,400
**No Conflicts:** Isolated API integration

---

### Worktree 4: UI Enhancements (Week 2-3)
**Branch:** `feature/ui-enhancements`
**Owner:** Claude Instance 4

**Build:**
1. Enhanced SynapsePage (Day 1-3)
2. UVP Wizard enhancements (Day 4-5)
3. Content preview components (Day 6-7)

**Files Modified:**
- `pages/SynapsePage.tsx` (57 → 500 lines)

**Files Created:**
- `components/uvp-wizard/EnhancedUVPWizard.tsx`
- `components/uvp-wizard/EvidenceTag.tsx`
- `components/synapse/ContentPreview.tsx`
- `components/synapse/IntelligenceDisplay.tsx`

**Lines:** ~1,400
**Potential Conflicts:** Medium (SynapsePage modified)

---

## 🔄 MERGE STRATEGY

### Week 1: Setup Phase
```bash
# Create all worktrees
git worktree add ../Synapse-backend feature/backend-services
git worktree add ../Synapse-calendar feature/calendar-integration
git worktree add ../Synapse-social feature/socialpilot
git worktree add ../Synapse-ui feature/ui-enhancements
```

### Week 2: First Integration
**Merge Order:**
1. ✅ Backend Services → main (no conflicts expected)
2. ✅ Calendar Integration → main (depends on backend)
3. Test integration

### Week 3: Second Integration
**Merge Order:**
1. ✅ SocialPilot → main (no conflicts expected)
2. ✅ UI Enhancements → main (potential SynapsePage conflict)
3. Resolve conflicts manually
4. Full integration testing

### Week 4: Polish & Launch
1. End-to-end testing
2. Bug fixes
3. Performance optimization
4. Documentation
5. Production deployment

---

## 📊 COMPLEXITY ANALYSIS

### Backend Services (Worktree 1)
**Complexity:** High
**Risk:** Medium (external API dependencies)
**Lines:** 1,750
**Can Parallelize:** 100%

**Critical Path:** URL Parser → Intelligence → Specialty → Calendar Population

### Calendar Integration (Worktree 2)
**Complexity:** Medium
**Risk:** Low (internal services)
**Lines:** 800
**Can Parallelize:** 80%

**Dependencies:** Backend services (Worktree 1)

### SocialPilot Integration (Worktree 3)
**Complexity:** High
**Risk:** High (external API, OAuth)
**Lines:** 1,400
**Can Parallelize:** 100%

**Dependencies:** Calendar system (already exists)

### UI Enhancements (Worktree 4)
**Complexity:** Medium
**Risk:** Low (frontend only)
**Lines:** 1,400
**Can Parallelize:** 90%

**Dependencies:** Backend services for data display

---

## 🎯 BUILDRUNNER INTEGRATION

### Update features.json

Add these completed features as we build:

```json
{
  "id": "unified-content-automation",
  "name": "Unified Content Automation System",
  "status": "in_progress",
  "version": "1.0.0",
  "priority": "critical",
  "description": "Complete flow from URL input to automated social media posting via SocialPilot",
  "components": [
    "services/url-parser.service.ts",
    "services/parallel-intelligence.service.ts",
    "services/specialty-detection.service.ts",
    "services/calendar-population.service.ts",
    "services/socialpilot.service.ts",
    "services/publishing-automation.service.ts",
    "pages/SynapsePage.tsx",
    "components/uvp-wizard/EnhancedUVPWizard.tsx"
  ],
  "lineOfCode": 5350,
  "sub_features": [
    {
      "name": "Backend Services",
      "status": "pending",
      "lineOfCode": 1750,
      "completionPercentage": 0
    },
    {
      "name": "Calendar Integration",
      "status": "pending",
      "lineOfCode": 800,
      "completionPercentage": 0
    },
    {
      "name": "SocialPilot Integration",
      "status": "pending",
      "lineOfCode": 1400,
      "completionPercentage": 0
    },
    {
      "name": "UI Enhancements",
      "status": "pending",
      "lineOfCode": 1400,
      "completionPercentage": 0
    }
  ]
}
```

---

## ✅ ATOMIC TASK LISTS

### Backend Services Tasks (35 tasks)
1. Create url-parser.service.ts
2. Implement URL normalization
3. Add TLD validation (50+ countries)
4. Test URL parser with edge cases
5. Create parallel-intelligence.service.ts
6. Integrate Apify API
7. Integrate OutScraper API
8. Integrate Serper API
9. Implement Promise.all parallel execution
10. Add timeout handling (30s max)
11. Create result aggregation logic
12. Test parallel intelligence with real URLs
13. Create specialty-detection.service.ts
14. Implement niche detection algorithm
15. Add keyword extraction
16. Test specialty detection accuracy
17. Create calendar-population.service.ts
18. Implement 30-day content strategy
19. Add content type distribution (60% educational, 30% promotional, 10% engagement)
20. Generate content ideas from specialty
21. Test calendar population

### Calendar Integration Tasks (15 tasks)
22. Create synapse-calendar-bridge.service.ts
23. Map intelligence data to content ideas
24. Implement idea → calendar item conversion
25. Add pillar distribution logic
26. Test bridge with sample data
27. Update ContentGenerator to use specialty
28. Add intelligence panel to calendar
29. Test end-to-end intelligence → calendar flow

### SocialPilot Integration Tasks (25 tasks)
30. Create socialpilot.service.ts
31. Implement OAuth flow
32. Add account synchronization
33. Implement post creation API
34. Implement post scheduling API
35. Add status tracking
36. Test OAuth connection
37. Create publishing-automation.service.ts
38. Implement background job (runs every 5 min)
39. Add queue polling logic
40. Implement error handling & retry
41. Create post-status-tracker.service.ts
42. Add real-time status updates
43. Create SocialPilotSync.tsx component
44. Add account connection UI
45. Test full publishing pipeline

### UI Enhancement Tasks (20 tasks)
46. Expand SynapsePage.tsx
47. Add "Generate Calendar" button
48. Implement intelligence preview panel
49. Add loading states
50. Create EnhancedUVPWizard.tsx
51. Add evidence citations
52. Implement frequency tracking
53. Add ContentPreview.tsx component
54. Add IntelligenceDisplay.tsx component
55. Test full user flow
56. Add error states
57. Implement responsive design
58. Add animations
59. Test on mobile
60. Add documentation

---

## 📈 SUCCESS METRICS

### Technical Metrics
- [ ] URL Parser: 100% success rate on 50+ TLD formats
- [ ] Intelligence Gathering: <30 seconds for 8 data sources
- [ ] Specialty Detection: >90% accuracy
- [ ] Calendar Generation: 30 content ideas in <60 seconds
- [ ] SocialPilot Publishing: >99% success rate
- [ ] Publishing Latency: <5 minutes from scheduled time

### User Experience Metrics
- [ ] Onboarding Time: <3 minutes (URL → intelligence complete)
- [ ] Content Generation: <1 minute (30 posts ready)
- [ ] Setup to Automation: <10 minutes total
- [ ] Error Rate: <1% failed posts
- [ ] User Satisfaction: "This is magic" feedback

### Business Metrics
- [ ] Content Quality: 3x engagement vs manual posting
- [ ] Time Savings: 20 hours/month saved
- [ ] Consistency: 95% adherence to posting schedule
- [ ] ROI: Trackable revenue attribution

---

## 🚀 LAUNCH CHECKLIST

### Pre-Launch
- [ ] All 4 worktrees merged to main
- [ ] Zero TypeScript errors
- [ ] All tests passing
- [ ] End-to-end flow tested
- [ ] Demo mode with sample data
- [ ] Documentation complete
- [ ] API keys configured
- [ ] SocialPilot OAuth approved

### Launch Day
- [ ] Deploy to production
- [ ] Monitor error logs
- [ ] Track user onboarding flow
- [ ] Verify publishing automation
- [ ] Check SocialPilot API limits
- [ ] Monitor performance

### Post-Launch (Week 1)
- [ ] Collect user feedback
- [ ] Fix critical bugs
- [ ] Optimize slow queries
- [ ] Improve error messages
- [ ] Add requested features

---

## 💰 COST ESTIMATES

### API Costs (per 100 businesses onboarded)
- Apify: ~$5 (web scraping)
- OutScraper: ~$10 (reviews + business profile)
- Serper: ~$2 (search intelligence)
- OpenRouter: ~$15 (Claude content generation)
- SocialPilot: ~$0 (included in user's plan)
**Total: ~$32 per 100 businesses**

### Infrastructure
- Supabase: $25/month (Pro plan)
- Netlify: Free (included)
- CDN: Minimal
**Total: ~$25/month**

---

## 📞 SUPPORT

- Documentation: `/docs/`
- API Reference: `/docs/api/`
- GitHub Issues: https://github.com/DockeryAI/synapse/issues
- BuildRunner Status: `.buildrunner/STATUS.md`

---

**Document Version:** 1.0.0
**Last Updated:** 2025-11-14
**Status:** Ready for Parallel Development
**Estimated Completion:** 4 weeks with 4 parallel developers
