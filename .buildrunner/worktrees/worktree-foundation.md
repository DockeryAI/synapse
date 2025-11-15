# Worktree Task: Foundation (URL Parser + Database Setup)

**Feature IDs:** `universal-url-parser`
**Branch:** `feature/foundation`
**Estimated Time:** 10 hours (1-2 days)
**Priority:** CRITICAL - BLOCKING ALL OTHER WORK
**Dependencies:** None
**Worktree Path:** `../synapse-foundation`

---

## Context

This is the foundation layer for the entire Synapse MVP. Nothing else can be built until this is complete. You're building:
1. Universal URL parser that handles any URL format from any country
2. Complete database schema for all 15+ tables needed by other features

**Why This Matters:**
- Every other feature depends on URL parsing or database tables
- Get this wrong and everything breaks downstream
- Must be rock-solid, no shortcuts

---

## Prerequisites

- Read `.buildrunner/features.json` - Focus on `universal-url-parser` feature
- Read `.buildrunner/BUILD_PLAN.md` - Understand you're Phase 1
- Access to Supabase project
- Node.js 18+, npm installed

---

## Setup Instructions

### 1. Create Worktree
```bash
cd /Users/byronhudson/Projects/Synapse
git worktree add ../synapse-foundation feature/foundation
cd ../synapse-foundation
```

### 2. Install Dependencies
```bash
npm install
```

**Additional Dependencies Needed:**
```bash
# URL parsing and validation
npm install url-parse validator
npm install @types/url-parse @types/validator --save-dev

# Supabase client (should exist)
# npm install @supabase/supabase-js (already installed)
```

### 3. Verify Environment
```bash
# Check .env file exists with Supabase credentials
cat .env | grep SUPABASE

# Should see:
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...
```

---

## Task Checklist

### Part 1: Universal URL Parser (4 hours)

#### File: `src/services/url-parser.service.ts`

**Requirements from features.json:**
- Parse any URL format (with/without protocol)
- Handle international TLDs (.co.uk, .com.au, etc.)
- Extract domain, subdomain, path
- Validate URL structure
- Normalize URLs for consistency

**Implementation:**

- [ ] Create `src/services/url-parser.service.ts`
- [ ] Implement `parseURL(input: string)` function
  - Handle: `example.com`, `www.example.com`, `https://example.com`
  - Handle international TLDs: `.co.uk`, `.com.au`, `.de`, `.fr`, etc.
  - Add protocol if missing (default to https)
  - Return normalized URL
- [ ] Implement `extractDomain(url: string)` function
  - Return just the domain without subdomain
- [ ] Implement `extractSubdomain(url: string)` function
  - Return subdomain or null
- [ ] Implement `validateURL(url: string)` function
  - Return boolean, check valid structure
- [ ] Implement `normalizeURL(url: string)` function
  - Remove trailing slashes
  - Convert to lowercase domain
  - Remove www if present (or keep consistently)
- [ ] Add comprehensive error handling
  - Invalid URLs should throw descriptive errors
  - Handle edge cases: IP addresses, localhost, etc.

**Test Cases to Handle:**
```typescript
// Should all parse correctly:
parseURL('example.com')           // → https://example.com
parseURL('www.example.com')       // → https://www.example.com
parseURL('https://example.com')   // → https://example.com
parseURL('example.co.uk')         // → https://example.co.uk
parseURL('sub.example.com/path')  // → https://sub.example.com/path
parseURL('http://example.com')    // → https://example.com (upgrade to https)
```

**Deliverable:**
- Working `url-parser.service.ts` with all functions
- Export as: `export const URLParser = { parseURL, validateURL, ... }`

---

### Part 2: Database Schema Setup (6 hours)

#### Migration Files: `supabase/migrations/`

**Tables Needed (from features.json across all features):**

1. **NAICS & Industries**
   - `naics_codes` (code, title, description)
   - `naics_mappings` (user_input_term, naics_code)
   - `industry_profiles` (naics_code, profile_data JSON, generated_at)
   - `profile_generation_queue` (industry_name, naics_code, status, started_at)

2. **Business Profiles**
   - `business_profiles` (id, user_id, uvp_data JSON, created_at, updated_at)
   - `products` (id, business_profile_id, name, sku, price, category, status, source)
   - `services` (id, business_profile_id, name, tier, description, pricing, duration)
   - `promotional_offers` (id, business_profile_id, name, discount, start_date, end_date, active)
   - `profile_versions` (id, business_profile_id, version_number, snapshot JSON, created_at)
   - `profile_changes_log` (id, business_profile_id, change_type, old_value, new_value, changed_at)

3. **Intelligence & Analysis**
   - `intelligence_runs` (id, business_profile_id, sources_data JSON, completed_at)
   - `scraped_data` (id, intelligence_run_id, source, data JSON, scraped_at)
   - `social_performance_data` (id, business_profile_id, platform, metrics JSON, date)
   - `engagement_patterns` (id, business_profile_id, pattern_type, data JSON)
   - `optimal_posting_times` (id, business_profile_id, platform, day_of_week, hour, score)

4. **UVP & Evidence**
   - `uvp_suggestions` (id, business_profile_id, suggestion_text, confidence, source)
   - `evidence_citations` (id, uvp_suggestion_id, source_url, quote, found_at)
   - `detected_products` (temp table for discovery, migrate to products table)
   - `detected_services` (temp table for discovery, migrate to services table)

5. **Campaigns & Content**
   - `campaigns` (id, business_profile_id, name, type, duration, status, created_at)
   - `campaign_posts` (id, campaign_id, platform, content, scheduled_for, status)
   - `campaign_templates` (id, campaign_type, template_data JSON)
   - `content_drafts` (existing - verify structure)
   - `generated_content` (existing - verify structure)

6. **SocialPilot Integration** (existing - verify)
   - `socialpilot_connections` (existing)
   - `publishing_queue` (existing)
   - `scheduled_posts` (existing)

7. **Bannerbear**
   - `template_library` (id, name, bannerbear_template_id, variables JSON, preview_url)
   - `generated_visuals` (id, campaign_post_id, template_id, image_url, generated_at)

8. **Buyer Journey** (existing - verify)
   - `buyer_journeys` (existing)
   - `buyer_personas` (existing)

#### Steps:

- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_foundation_schema.sql`
- [ ] Add all table CREATE statements
- [ ] Add foreign key constraints
  - `business_profiles.user_id` → `auth.users(id)`
  - `products.business_profile_id` → `business_profiles(id)`
  - `campaigns.business_profile_id` → `business_profiles(id)`
  - etc.
- [ ] Add indexes for performance
  - Index on `business_profiles.user_id`
  - Index on `products.business_profile_id`
  - Index on `naics_codes.code`
  - Index on `campaigns.business_profile_id`
- [ ] Add RLS (Row Level Security) policies
  - Users can only access their own business_profiles
  - Users can only access their own products/services/campaigns
  - Industry profiles are public (read-only)
- [ ] Add helpful comments in SQL
- [ ] Run migration locally: `supabase db push`
- [ ] Verify all tables exist: `supabase db diff`

**Database Types:**

- [ ] Generate TypeScript types: `supabase gen types typescript --local > src/types/database.types.ts`
- [ ] Update `src/types/index.ts` to export database types
- [ ] Verify types compile: `npm run build`

---

## Integration Points

**What Other Features Need:**
- URL Parser: Used by Location Detection, Intelligence Gatherer, Product Scanner
- Database Tables: Used by EVERYONE

**Export Pattern:**
```typescript
// src/services/url-parser.service.ts
export const URLParser = {
  parseURL,
  validateURL,
  normalizeURL,
  extractDomain,
  extractSubdomain
}

// Other features will import:
// import { URLParser } from '@/services/url-parser.service'
```

---

## Testing Requirements

### URL Parser Tests
```typescript
// Test file: src/services/__tests__/url-parser.test.ts
describe('URLParser', () => {
  it('parses basic domain', () => {
    expect(URLParser.parseURL('example.com')).toBe('https://example.com')
  })

  it('handles international TLDs', () => {
    expect(URLParser.parseURL('example.co.uk')).toBe('https://example.co.uk')
  })

  it('validates URLs', () => {
    expect(URLParser.validateURL('example.com')).toBe(true)
    expect(URLParser.validateURL('not a url')).toBe(false)
  })

  // Add more tests...
})
```

### Database Tests
- [ ] Verify all tables created: Query `information_schema.tables`
- [ ] Test foreign keys: Try inserting invalid references (should fail)
- [ ] Test RLS: Try accessing another user's data (should fail)
- [ ] Test indexes: Check query performance with EXPLAIN

---

## Completion Criteria

**Ready to merge when:**
- [ ] URL Parser service complete with all 5 functions
- [ ] All 15+ database tables created
- [ ] Foreign keys and indexes added
- [ ] RLS policies configured
- [ ] TypeScript types generated and exported
- [ ] No TypeScript errors: `npm run build` succeeds
- [ ] URL parser handles all test cases
- [ ] Database migration runs cleanly
- [ ] Committed to feature branch with good commit message

---

## Merge Instructions

```bash
# From worktree
git add .
git commit -m "feat: Add foundation - URL parser and complete database schema

- Universal URL parser supporting international TLDs
- Complete database schema for all MVP features
- Foreign keys, indexes, and RLS policies
- TypeScript types generated from schema
- Handles 15+ tables for products, campaigns, intelligence, etc.

Closes #foundation"

git push origin feature/foundation

# Switch back to main repo
cd /Users/byronhudson/Projects/Synapse

# Merge foundation (REQUIRED before other work starts)
git merge --no-ff feature/foundation
git push origin main

# Remove worktree
git worktree remove ../synapse-foundation
```

---

## If You Get Stuck

**Common Issues:**

1. **Supabase migration fails:**
   - Check for syntax errors in SQL
   - Ensure no duplicate table names
   - Verify foreign key references exist

2. **TypeScript types not generating:**
   - Ensure migration is pushed: `supabase db push`
   - Check Supabase is running: `supabase status`
   - Regenerate: `supabase gen types typescript --local`

3. **URL parser edge cases:**
   - Test with real-world URLs from different countries
   - Handle missing protocols gracefully
   - Don't crash on invalid input, return error

**Reference Files:**
- `.buildrunner/features.json` - All feature requirements
- `src/types/index.ts` - Existing type patterns
- `supabase/migrations/` - Example migration format

---

**CRITICAL:** This work blocks all other worktrees. Do NOT mark as complete until:
1. URL parser is bulletproof
2. ALL database tables are created
3. Types are generated
4. Everything builds with no errors

*You're the foundation. Don't fuck this up.*
