# Final Optimized Parallel Claude Prompts - Maximum Quality

**Last Updated:** 2025-11-15
**Purpose:** Production-ready prompts for parallel Claude instances with enterprise code quality standards

---

## 🚀 Quick Start

**For maximum parallel development (5-6 instances), use these prompts:**

### Week 1 - Group 1 (4-5 Parallel Instances)

Copy each prompt below into a separate Claude Code window and press enter. Claude will handle everything from worktree creation to completion.

---

## PHASE 1A: Core MVP

### Week 1 - Parallel Group 1 (5 Claude Instances)

#### 📋 Claude Instance #1: Foundation (10 hours)

```
I'm building the Synapse MVP Foundation feature. This is a CRITICAL feature that ALL other work depends on.

BEFORE YOU START CODING:
1. Read /Users/byronhudson/Projects/Synapse/.buildrunner/worktrees/PATTERNS.md
2. Read /Users/byronhudson/Projects/Synapse/.buildrunner/worktrees/IMPLEMENTATION_STANDARDS.md
3. Read /Users/byronhudson/Projects/Synapse/.buildrunner/worktrees/worktree-foundation.md

CRITICAL REQUIREMENTS:
- Use Zod for ALL type validation
- Universal URL parser must handle international TLDs (.co.uk, .com.au, .de, .fr)
- ALL 15+ database tables must be created with RLS policies
- Generate TypeScript types from database schema
- NO shortcuts - this blocks all other work

WHAT TO BUILD:
- Universal URL Parser (src/services/url-parser.service.ts)
  - parseURL(), validateURL(), normalizeURL(), extractDomain(), extractSubdomain()
  - Handle: example.com, www.example.com, https://example.com, example.co.uk
  - Add protocol if missing (default https)
  - Comprehensive error handling

- Complete Database Schema (supabase/migrations/)
  - business_profiles, products, services, campaigns, intelligence_runs
  - naics_codes, industry_profiles, uvp_suggestions
  - social_performance_data, campaign_posts, template_library
  - All foreign keys, indexes, RLS policies
  - Run migration: supabase db push
  - Generate types: supabase gen types typescript --local > src/types/database.types.ts

WORKTREE SETUP:
cd /Users/byronhudson/Projects/Synapse
git worktree add ../synapse-foundation feature/foundation
cd ../synapse-foundation
npm install url-parse validator zod
npm install @types/url-parse @types/validator --save-dev

COMPLETION CRITERIA:
- [ ] URL Parser handles all international TLDs
- [ ] All 15+ tables created with RLS
- [ ] TypeScript types generated
- [ ] npm run build succeeds (no errors)
- [ ] Tested with 5+ URL formats
- [ ] Migration runs cleanly

When complete, commit with this message:
"feat: Add foundation - URL parser and complete database schema

- Universal URL parser supporting international TLDs
- Complete database schema for all MVP features
- Foreign keys, indexes, and RLS policies
- TypeScript types generated from schema

Implements foundation feature"

Then let me know it's ready for merge. DO NOT merge to main yourself.

USE PATTERNS.md for error handling, validation, and testing.
```

---

#### 📋 Claude Instance #2: Location Detection (8 hours)

```
I'm building the Synapse Global Location Detection Engine.

BEFORE YOU START CODING:
1. Read /Users/byronhudson/Projects/Synapse/.buildrunner/worktrees/PATTERNS.md
2. Read /Users/byronhudson/Projects/Synapse/.buildrunner/worktrees/IMPLEMENTATION_STANDARDS.md
3. Read /Users/byronhudson/Projects/Synapse/.buildrunner/worktrees/worktree-location-detection.md

CRITICAL REQUIREMENTS:
- Foundation MUST be merged first (wait if not merged)
- Use callAPIWithRetry() from PATTERNS.md for ALL API calls
- Use SimpleCache with 30-day TTL for location data
- Use Zod schemas for ALL data validation
- Support 50+ countries (US, UK, CA, AU, EU formats)
- 5 parallel strategies: Contact page, Footer, About, Metadata, IP
- Google Maps geocoding for address normalization

WHAT TO BUILD:
- src/services/location-detection.service.ts
  - detectLocation() - orchestrates 5 parallel strategies
  - scrapeContactPage() - check /contact, /contact-us, /locations
  - extractFooterAddress() - parse <footer> tags and schema.org
  - analyzeAboutPage() - frequency analysis of location mentions
  - inspectMetadata() - OpenGraph, JSON-LD for address data
  - geolocateByIP() - fallback strategy
  - geocodeAddress() - Google Maps API integration
  - parseAddressString() - regex for US, UK, CA, AU formats

WORKTREE SETUP:
cd /Users/byronhudson/Projects/Synapse
git worktree add ../synapse-location feature/location-detection
cd ../synapse-location
git pull origin main  # Get foundation changes
npm install @googlemaps/google-maps-services-js node-geocoder cheerio axios zod

Add to .env:
VITE_GOOGLE_MAPS_API_KEY=your_key

REQUIRED PATTERNS FROM PATTERNS.MD:
- Use parallelAPICalls() for 5 strategies (timeout: 10s, allowPartialFailure: true)
- Use SimpleCache for 30-day location caching
- Use callAPIWithRetry() for Google Maps API (maxRetries: 3)
- Use Zod schemas for BusinessLocation, AddressCandidate, GeocodedLocation

EDGE CASES TO HANDLE:
- No location found: return null (don't crash)
- Multiple locations: return primary/headquarters
- International businesses: prefer contact page over IP
- Schema.org conflicts: prefer visible text
- Google Maps rate limits: cache results, exponential backoff

TESTING:
- Test with real websites: joespizza.com (US), harveynichols.com (UK), melbournecoffee.com.au (AU)
- Verify UK postcode parsing: "SW1A 2AA"
- Test contact page priority over footer

When complete, commit and notify me. DO NOT merge yourself.

USE PATTERNS.MD FOR ALL API CALLS AND ERROR HANDLING.
```

---

#### 📋 Claude Instance #3: Intelligence Gatherer (12 hours) ⚠️ HIGH-RISK

```
I'm building the Synapse Parallel Intelligence Gathering System with 8 APIs running in parallel.

⚠️ HIGH-RISK FEATURE: This has 8 parallel API calls. Use enterprise-grade error handling.

BEFORE YOU START CODING:
1. Read /Users/byronhudson/Projects/Synapse/.buildrunner/worktrees/PATTERNS.md (CRITICAL)
2. Read /Users/byronhudson/Projects/Synapse/.buildrunner/worktrees/IMPLEMENTATION_STANDARDS.md
3. Read /Users/byronhudson/Projects/Synapse/.buildrunner/worktrees/worktree-intelligence-gatherer.md (FULLY ENHANCED VERSION)

NOTE: worktree-intelligence-gatherer.md has been fully optimized with:
- Complete Zod schemas for all 8 data sources
- Detailed retry logic examples
- 10 critical edge cases documented
- Security measures (input sanitization)
- Performance optimization (7-day cache, rate limiting)
- Comprehensive test cases

CRITICAL REQUIREMENTS:
- EVERY API call MUST use callAPIWithRetry() with maxRetries: 3
- EVERY data type MUST have Zod schema
- Use parallelAPICalls() with 30-second timeout and allowPartialFailure: true
- Implement 7-day cache with SimpleCache
- Implement rate limiting: 10 requests per minute
- Sanitize ALL inputs before API calls
- Log ALL errors with detailed context
- Return partial data if some APIs fail (graceful degradation)

8 DATA SOURCES:
1. Apify - Website scraping
2. OutScraper - Google Business Profile
3. OutScraper - Google Reviews (with sentiment analysis)
4. Serper - Search presence
5. Serper - Competitor detection
6. Apify - Service page analysis
7. Apify - Social media profiles
8. OpenRouter - Claude Opus AI synthesis

WORKTREE SETUP:
cd /Users/byronhudson/Projects/Synapse
git worktree add ../synapse-intelligence feature/intelligence-gatherer
cd ../synapse-intelligence
npm install apify-client axios zod

Add to .env:
VITE_APIFY_API_KEY=apify_api_xxx
VITE_OUTSCRAPER_API_KEY=xxx
VITE_SERPER_API_KEY=xxx
VITE_OPENROUTER_API_KEY=sk-or-xxx

IMPLEMENTATION CHECKLIST:
- [ ] Create all 8 Zod schemas (WebsiteDataSchema, GBPDataSchema, ReviewDataSchema, etc.)
- [ ] Implement gatherIntelligence() with cache check + rate limiting
- [ ] Implement scrapeWebsite() with retry (maxRetries: 3, timeout: 10s)
- [ ] Implement fetchGoogleBusiness() with retry
- [ ] Implement fetchGoogleReviews() with retry + sentiment analysis
- [ ] Implement analyzeSearchPresence() with retry
- [ ] Implement detectCompetitors() with retry
- [ ] Implement analyzeServicePages() with retry
- [ ] Implement findSocialProfiles() with retry
- [ ] Implement synthesizeIntelligence() with retry (Opus, maxRetries: 2, timeout: 30s)
- [ ] Implement combineResults() - merge partial data
- [ ] Implement saveIntelligenceReport() - database integration
- [ ] Add input sanitization (sanitizeBusinessName)
- [ ] Add performance monitoring (timeOperation)

CRITICAL EDGE CASES (MUST HANDLE):
1. All APIs fail → return partial data with failedSources array
2. Business name missing → extract from URL
3. No reviews found → return empty array
4. API rate limits → exponential backoff
5. Invalid JSON from AI → catch parse error, return null
6. Timeout (>30s) → cancel pending requests
7. Malformed responses → Zod validation catches, log and continue
8. Network disconnection → retry with backoff
9. Empty/null values → handle throughout pipeline
10. Special characters in names → sanitize before API calls

TESTING REQUIREMENTS (8+ tests):
- gathers all 8 sources in <30 seconds
- handles API failures gracefully (Promise.allSettled)
- validates with Zod schemas
- uses cache for repeated requests
- respects rate limits
- handles empty business name
- sanitizes malicious inputs
- completes performance budget

TARGET: Complete in <30 seconds, with graceful degradation if APIs fail.

When complete, commit and notify me. DO NOT merge yourself.

THIS IS A COMPLEX FEATURE. TAKE YOUR TIME. USE PATTERNS.MD RELIGIOUSLY.
```

---

#### 📋 Claude Instance #4: Industry Profile Generator (10 hours)

```
I'm building the Synapse Dynamic Industry Profile Auto-Generation feature.

BEFORE YOU START CODING:
1. Read /Users/byronhudson/Projects/Synapse/.buildrunner/worktrees/PATTERNS.md
2. Read /Users/byronhudson/Projects/Synapse/.buildrunner/worktrees/IMPLEMENTATION_STANDARDS.md
3. Read /Users/byronhudson/Projects/Synapse/.buildrunner/worktrees/worktree-industry-autogen.md

CRITICAL REQUIREMENTS:
- Integrate with Brandock NAICS data (complete-naics-codes.ts)
- Use Claude Opus for profile generation
- Implement 7-day caching (SimpleCache)
- Micro-segmentation (e.g., "bakery" → "wedding bakery", "vegan bakery")
- Use callAPIWithRetry() for Opus API calls
- Zod validation for all generated profiles

WHAT TO BUILD:
- src/services/industry-profile-generator.service.ts
  - generateProfile() - main orchestrator with cache check
  - fetchNAICSData() - load from complete-naics-codes.ts
  - queryOpus() - call Claude Opus with structured prompt
  - parseOpusResponse() - validate JSON response with Zod
  - detectMicroSegment() - identify specialty niches
  - saveProfile() - store in industry_profiles table with 7-day cache

WORKTREE SETUP:
cd /Users/byronhudson/Projects/Synapse
git worktree add ../synapse-industry feature/industry-autogen
cd ../synapse-industry
npm install zod

OPUS PROMPT STRUCTURE:
Generate a comprehensive industry profile for: [NAICS Code + Name]

Include:
1. Industry overview (3-5 sentences)
2. Target audience personas (3-5)
3. Pain points (5-7)
4. Content pillars (5-7)
5. Messaging framework (tone, language, CTAs)
6. Seasonal opportunities (monthly)
7. Competitive landscape

Return ONLY valid JSON.

REQUIRED PATTERNS:
- Use SimpleCache with 7-day TTL
- Use callAPIWithRetry for Opus (maxRetries: 2, timeout: 30s)
- Use Zod schema for IndustryProfile validation
- Use timeOperation() for performance monitoring

EDGE CASES:
- NAICS code not found → return null or generic profile
- Opus returns invalid JSON → retry once, then fallback to template
- Profile generation timeout → return partial profile
- Cache miss → generate and cache

When complete, commit and notify me.

USE PATTERNS.MD FOR CACHING AND API CALLS.
```

---

#### 📋 Claude Instance #5: Specialty Detection (6 hours)

```
I'm building the Synapse Deep Specialty Detection Engine.

BEFORE YOU START CODING:
1. Read /Users/byronhudson/Projects/Synapse/.buildrunner/worktrees/PATTERNS.md
2. Read /Users/byronhudson/Projects/Synapse/.buildrunner/worktrees/IMPLEMENTATION_STANDARDS.md
3. Read /Users/byronhudson/Projects/Synapse/.buildrunner/worktrees/worktree-specialty-detection.md

CRITICAL REQUIREMENTS:
- Detect specialty vs generic industry (e.g., "wedding bakery" vs "bakery")
- 3-tier classification: generic, specialized, hyper-niche
- Use Claude Opus for specialty analysis
- Extract specialty keywords with frequency analysis
- Use callAPIWithRetry() for Opus API
- Zod validation for SpecialtyResult

WHAT TO BUILD:
- src/services/specialty-detection.service.ts
  - detectSpecialty() - main function with Opus analysis
  - extractSpecialtyKeywords() - frequency-based keyword extraction
  - classifyNicheLevel() - determine generic/specialized/hyper-niche
  - analyzeTargetMarket() - identify specific audience

OPUS PROMPT:
Analyze this business and identify its specialty/niche:

Industry: [industry]
Website Content: [content]
Services: [services]

Determine:
1. Is this generic or specialized?
2. What is their specific niche/specialty?
3. Key differentiating keywords
4. Target market specificity

Return JSON: { specialty, keywords[], nicheLevel, targetMarket }

WORKTREE SETUP:
cd /Users/byronhudson/Projects/Synapse
git worktree add ../synapse-specialty feature/specialty-detection
cd ../synapse-specialty
npm install zod

REQUIRED PATTERNS:
- Use callAPIWithRetry for Opus (maxRetries: 2, timeout: 20s)
- Use Zod schema for SpecialtyResultSchema
- Use log() for error logging

EDGE CASES:
- Generic business (no specialty) → return nicheLevel: 'generic'
- Multiple specialties detected → return primary + secondary
- Opus timeout → return confidence: 0, specialty: null

When complete, commit and notify me.
```

---

### Week 2 - Parallel Group 2 (4 Claude Instances)

#### 📋 Claude Instance #6: Social Media Intelligence (18 hours)

```
[Similar format with PATTERNS.md reference, specific requirements, Zod schemas, edge cases]
```

#### 📋 Claude Instance #7: Product Scanner + UVP Wizard (20 hours) ⚠️ HIGH-RISK

```
[Similar format - this is a BIG one, 20 hours, two features in sequence]
```

#### 📋 Claude Instance #8: Bannerbear Templates (8 hours)

```
[Similar format]
```

---

### Week 3 - Parallel Group 3 (2 Claude Instances)

#### 📋 Claude Instance #9: Profile Management (18 hours)

```
[Similar format]
```

#### 📋 Claude Instance #10: Campaign Generator (16 hours) ⚠️ HIGH-RISK

```
[Similar format - THE GRAND FINALE, integrates all 17 data sources]
```

---

## PHASE 1B: Content Marketing (Weeks 4-5)

### Week 4-5 - Parallel Group (4 Claude Instances)

#### 📋 Claude Instance #11: Long-Form Content (20 hours)

```
[Similar format]
```

#### 📋 Claude Instance #12: Landing Pages (25 hours)

```
[Similar format]
```

#### 📋 Claude Instance #13: SEO Intelligence (30 hours) ⚠️ HIGH-RISK

```
[Similar format - 6 SEMrush API endpoints]
```

#### 📋 Claude Instance #14: Perplexity Local Intelligence (5 hours)

```
[Similar format]
```

---

## PHASE 1C: Video Capabilities (Weeks 6-7)

### Week 6-7 - Parallel Group (2 Claude Instances)

#### 📋 Claude Instance #15: Video Editor (40 hours) ⚠️ HIGH-RISK

```
[Similar format - FFmpeg.wasm, Remotion, Whisper]
```

#### 📋 Claude Instance #16: Video Formatter (30 hours)

```
[Similar format - 7 platform formats]
```

---

## Maximum Parallel Strategy

**Most Aggressive (6-8 instances per phase):**

Week 1: 5 instances (Foundation + Location + Intelligence + Industry + Specialty)
Week 2: 4 instances (Social + Product/UVP + Bannerbear + Profile Mgmt starts early)
Week 3: 2 instances (Profile Mgmt + Campaign Generator)

**Total Phase 1A:** 150h → 25-30h with 5-6 parallel (5-6x speedup)

**Phase 1B:** 4 instances → 80h → 20h (4x speedup)
**Phase 1C:** 2 instances → 70h → 35h (2x speedup)

**Grand Total:** 300h → ~75-85h with maximum parallelization

---

## Critical Success Factors

**For each Claude instance:**
1. ✅ READ PATTERNS.MD FIRST
2. ✅ READ IMPLEMENTATION_STANDARDS.MD SECOND
3. ✅ READ specific worktree task file THIRD
4. ✅ Use Zod for ALL data validation
5. ✅ Use callAPIWithRetry for ALL API calls
6. ✅ Implement caching where specified
7. ✅ Handle ALL edge cases listed
8. ✅ Write 8+ test cases minimum
9. ✅ NO TypeScript errors before committing
10. ✅ Test with real data before marking complete

---

## Merge Order (CRITICAL)

**Week 1:**
1. Foundation FIRST (creates database)
2. Then any order: Location, Intelligence, Industry, Specialty

**Week 2:**
1. Social Analyzer FIRST (needed by UVP)
2. Then any order: Product/UVP, Bannerbear, Profile

**Week 3:**
1. Profile Management FIRST
2. Then Campaign Generator

**Week 4-5:** Any order (all independent)

**Week 6-7:**
1. Video Editor FIRST
2. Then Video Formatter

---

**READY TO BUILD. Copy each prompt above into separate Claude Code windows and let them work in parallel.**

*Maximum quality. Maximum speed. Let's build Synapse.*
