# UVP V2.1 BUILD PLAN
## Feature Branch: `feature/uvp-v2-unified`

**Created:** 2025-11-24
**Status:** Planning
**Estimated Time:** 19.5 hours
**Based on Backup:** `backup/uvp-onboarding-20241123` (commit `01f2c579`)

---

## Executive Summary

Complete rebuild of the UVP onboarding flow to address three critical failures:

1. **Industry profiles not saving** after AI generation (400/406 RLS errors)
2. **Product detection missing obvious products** (navigation scraping broken)
3. **Customer motivations split across multiple steps** (poor UX, data fragmentation)

This build creates an isolated feature branch from the working UVP backup, implements fixes without touching main codebase, and includes comprehensive testing before merge.

---

## Problems Being Solved

### Problem 1: Industry Profile Save Failure
**Symptom:** New industry profiles generate successfully but fail to save to database
**Root Cause:** `OnDemandProfileGeneration.ts` uses `.select()` after upsert, RLS blocks the SELECT operation
**Evidence:** RLS Documentation shows `.single()` and `.select()` cause 400/406 errors
**Impact:** Every new industry requires manual intervention, breaks onboarding flow

### Problem 2: Product Detection Garbage
**Example:** OpenDialog.ai has products "Selma", "Jamie", "Rhea", "OpenDialog Platform" in navigation
**What We Detected:** Random words, testimonial content, irrelevant text
**Root Cause:**
- Navigation scraper only captures `href` attributes, not link text
- Product extractor sees `/selma` instead of "Selma"
- No logic to prioritize nav structure over general content
- Prompt doesn't account for SaaS naming patterns

**Impact:** Manual product entry required, AI looks stupid

### Problem 3: Customer + Motivations Fragmented
**Current State:** 3 separate screens
- Screen 1: Who is your customer
- Screen 2: Emotional drivers
- Screen 3: Functional drivers

**Problem:** Users can't see how motivations map to specific customer segments
**Impact:** Disconnected data, more steps = more drop-off, poor UX

---

## Solution Architecture

### Fix 1: RLS-Safe Database Operations
- Create `src/services/database/rls-safe-operations.ts` with helpers
- Remove `.select()` from all upsert operations
- Add 400/406 specific error handling
- Apply pattern from `RLS Documentation/400_ERROR_FIX_SUMMARY.md`

### Fix 2: Navigation-First Product Detection
**Two-Pass Strategy:**
1. **Pass 1:** Extract nav structure (text + href pairs)
2. **Pass 2:** Identify product sections, prioritize those URLs

**Detection Priorities:**
1. Nav items under "Products", "Solutions", "Platform" headers
2. Proper nouns in nav (capitalized names like Selma, Jamie)
3. Pricing tables and feature comparison matrices
4. SaaS pattern: "[Name] - [Description]"

### Fix 3: Unified Ideal Customer Profile Screen
**Single Screen Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ YOUR IDEAL CUSTOMER                                         │
├─────────────────────────────────────────────────────────────┤
│ WHO THEY ARE                                                │
│ [AI suggestions for customer segments]                      │
├─────────────────────────────────────────────────────────────┤
│ WHAT DRIVES THEM                                            │
│                                                             │
│ 🧠 FUNCTIONAL NEEDS        💗 EMOTIONAL DRIVERS             │
│ [Checkboxes]               [Checkboxes]                     │
├─────────────────────────────────────────────────────────────┤
│ COMBINED INSIGHT:                                           │
│ "These customers need [functional] because [emotional]"     │
└─────────────────────────────────────────────────────────────┘
```

**Benefits:**
- All customer data visible on one screen
- Clear driver-to-customer mapping
- Reduced steps (6 → 5)
- Better context for users

---

## Phase 0: Setup (30 min)

### 0.1 Create Feature Branch from Backup
```bash
# Start from working UVP backup
git checkout backup/uvp-onboarding-20241123
git checkout -b feature/uvp-v2-unified
git push -u origin feature/uvp-v2-unified
```

### 0.2 Create Isolated Worktree
```bash
cd /Users/byronhudson/Projects/Synapse
git worktree add ../synapse-uvp-v2 feature/uvp-v2-unified
cd ../synapse-uvp-v2
npm install
```

### 0.3 Verify Starting Point
- Run `npm run dev`
- Test existing UVP flow end-to-end
- Document current data structures
- Confirm backup state is clean

**Success Criteria:**
- Worktree created at `../synapse-uvp-v2`
- Dependencies installed without errors
- Dev server runs successfully
- UVP flow accessible and functional

---

## Phase 1: Fix Industry Profile Saving (2 hours)

### 1.1 Create RLS-Safe Operations Helper
**File:** `src/services/database/rls-safe-operations.ts`

**Functions:**
```typescript
// Upsert without requiring SELECT response
async safeUpsert(table, record, options)

// Read with graceful fallback for 406 errors
async safeMaybeSingle(query)

// Handle 400/406 errors specifically
handleRLSError(error)
```

**Reference:** `RLS Documentation/400_ERROR_FIX_SUMMARY.md`

### 1.2 Update OnDemandProfileGeneration
**File:** `src/services/industry/OnDemandProfileGeneration.ts`

**Changes:**
- Import `safeUpsert` helper
- Line 517-522: Remove `.select()` from upsert call
- Add try-catch with specific 400/406 handling
- Update `updateNAICSKeywords()` to use safe operations
- Update `checkCachedProfile()` - already uses `maybeSingle()` ✓

**Before:**
```typescript
const { data, error } = await supabase
  .from('industry_profiles')
  .upsert(record, { onConflict: 'id' })
  .select();
```

**After:**
```typescript
const { error } = await safeUpsert(
  'industry_profiles',
  record,
  { onConflict: 'id' }
);
```

### 1.3 Test Industry Save
**Test Cases:**
1. Generate profile for brand new industry (not in DB)
2. Verify save to `industry_profiles` table
3. Verify NAICS keywords update
4. Regenerate same industry (upsert conflict)
5. Check RLS doesn't block save

**Success Criteria:**
- New industry profiles save without errors
- No 400/406 errors in console
- Profile retrievable on next load

---

## Phase 2: Fix Navigation Scraping (3 hours)

### 2.1 Update WebsiteData Type
**File:** `src/types/scraping.types.ts` (or wherever WebsiteData is defined)

**Add:**
```typescript
interface NavigationItem {
  text: string;      // Link text (e.g., "Products")
  href: string;      // Link URL (e.g., "/products")
  section?: string;  // Optional nav section (e.g., "Main Nav")
}

interface WebsiteData {
  // ... existing fields
  structure: {
    sections: string[];
    navigation: NavigationItem[];  // Changed from string[]
  }
}
```

### 2.2 Update websiteScraper.ts
**File:** `src/services/scraping/websiteScraper.ts`

**Function:** `extractStructure()` (lines 264-294)

**Before:**
```typescript
navigation: ["/products", "/solutions"]
```

**After:**
```typescript
navigation: [
  { text: "Products", href: "/products" },
  { text: "Solutions", href: "/solutions" }
]
```

**Implementation:**
```typescript
doc.querySelectorAll('nav a, header a').forEach(a => {
  const text = a.textContent?.trim() || '';
  const href = a.getAttribute('href');
  if (text && href) {
    navigation.push({ text, href });
  }
});
```

### 2.3 Update All Navigation Consumers
**Files to Update:**
- `src/services/uvp-extractors/product-service-extractor.service.ts`
- Any other file using `data.structure.navigation`

**Pattern:**
```typescript
// Old: data.structure.navigation.join('\n')
// New: data.structure.navigation.map(n => `${n.text} (${n.href})`).join('\n')
```

### 2.4 Test Navigation Extraction
**Test URLs:**
- OpenDialog.ai (should extract "Selma", "Jamie", "Rhea" as text)
- Any SaaS site with product nav
- E-commerce site with product categories

**Success Criteria:**
- Navigation items have both text and href
- Product names visible in scraped data
- No type errors

---

## Phase 3: Smart Product Detection (4 hours)

### 3.1 Create Navigation Product Detector
**File:** `src/services/intelligence/navigation-product-detector.service.ts`

**Functions:**

```typescript
// Identify nav items likely to be product sections
identifyProductNavSection(navigation: NavigationItem[]): NavigationItem[]

// Extract named products from navigation
extractNamedProducts(navItems: NavigationItem[]): string[]

// Detect URLs that might have product details
detectProductPageUrls(navItems: NavigationItem[]): string[]

// Classify nav item as product-related
isProductNavItem(item: NavigationItem): boolean
```

**Keywords to Detect:**
- "Products", "Product", "Solutions", "Platform", "Plans"
- "Services", "Offerings", "Features", "Pricing"

**Pattern Recognition:**
- Proper nouns (capitalized single words)
- Named features (e.g., "Selma", "Jamie")
- Pricing tiers (e.g., "Starter", "Pro", "Enterprise")

### 3.2 Update Product Extractor Prompt
**File:** `src/services/uvp-extractors/product-service-extractor.service.ts`

**Function:** `buildExtractionPrompt()` (line 250)

**Add Section:**
```
**PRIORITY EXTRACTION - Check these FIRST:**
1. NAVIGATION MENU: Look for items under "Products", "Solutions", "Platform" headers
   - Proper nouns are likely product names (e.g., Selma, Jamie, Rhea)
   - Navigation structure reveals product organization

2. NAMED PRODUCTS: SaaS/Tech companies often name their products/modules
   - Look for capitalized proper nouns
   - Format: "[Name] - [Description]" or "[Name]: [Feature]"

3. PRICING TABLES: Products/tiers listed with pricing
   - Basic, Pro, Enterprise, etc.
   - Feature comparison matrices

4. BREADCRUMBS: Products > [Category] > [Product Name]

ONLY extract what is EXPLICITLY NAMED on the website.
Do NOT infer or guess products.
```

### 3.3 Implement Two-Pass Detection
**File:** `src/services/uvp-extractors/product-service-extractor.service.ts`

**Logic:**
```typescript
async function extractProductsServices(...) {
  // Pass 1: Quick nav scan
  const navProducts = navigationProductDetector.extractNamedProducts(websiteData.structure.navigation);

  if (navProducts.length > 0) {
    console.log('Found products in navigation:', navProducts);
    // Inject into prompt as "CONFIRMED PRODUCTS FROM NAV"
  }

  // Pass 2: Deep extraction with nav context
  const extraction = await callClaudeAPI(promptWithNavContext);

  // Merge nav products with AI extracted products
  // Prioritize nav products (higher confidence)
}
```

### 3.4 Test Product Detection
**Test Cases:**
1. **OpenDialog.ai:** Should detect Selma, Jamie, Rhea, OpenDialog Platform
2. **Generic SaaS:** Should detect products from nav before content
3. **E-commerce:** Should detect categories and product lines
4. **Service business:** Should detect service tiers/packages

**Success Criteria:**
- OpenDialog test passes (all 4 products detected)
- No false positives (random words)
- Navigation products have higher confidence scores

---

## Phase 4: Unified Customer Profile Screen (6 hours)

### 4.1 Create Customer Driver Mapper
**File:** `src/services/uvp-extractors/customer-driver-mapper.service.ts`

**Functions:**
```typescript
// Map emotional + functional drivers to customer
mapDriversToCustomer(
  customer: CustomerProfile,
  emotionalDrivers: string[],
  functionalDrivers: string[]
): MappedProfile

// Generate combined insight statement
generateCombinedInsight(
  customer: string,
  topEmotional: string[],
  topFunctional: string[]
): string
```

**Example Output:**
```typescript
{
  customer: "VP of Marketing at mid-sized B2B SaaS companies",
  emotionalDrivers: [
    "Fear of missing quarterly targets",
    "Frustration with manual processes",
    "Desire to look competent to executives"
  ],
  functionalDrivers: [
    "Save 20+ hours per week",
    "Reduce cost per lead by 40%",
    "Integrate with existing CRM"
  ],
  combinedInsight: "VPs of Marketing at mid-sized B2B SaaS companies need to save 20+ hours per week and reduce cost per lead because they fear missing quarterly targets and feel frustrated with manual processes."
}
```

### 4.2 Create IdealCustomerProfilePage Component
**File:** `src/components/uvp-flow/IdealCustomerProfilePage.tsx`

**Layout Structure:**
```tsx
<div className="ideal-customer-profile-page">
  {/* Section 1: Who They Are */}
  <section className="customer-segment">
    <h2>Who They Are</h2>
    <SuggestionPanel suggestions={customerSuggestions} />
    <DropZone value={selectedCustomer} />
  </section>

  {/* Section 2: What Drives Them */}
  <section className="drivers">
    <div className="grid grid-cols-2">
      <div className="functional-drivers">
        <h3>🧠 Functional Needs</h3>
        <CheckboxList items={functionalDrivers} />
      </div>

      <div className="emotional-drivers">
        <h3>💗 Emotional Drivers</h3>
        <CheckboxList items={emotionalDrivers} />
      </div>
    </div>
  </section>

  {/* Section 3: Combined Insight */}
  <section className="combined-insight">
    <h3>Combined Insight</h3>
    <div className="insight-card">
      {generateCombinedInsight(customer, emotional, functional)}
    </div>
  </section>
</div>
```

### 4.3 Extract Driver Data
**Pull from existing services:**
- `src/services/intelligence/psychological-pattern-extractor.service.ts` → Emotional drivers
- `src/services/uvp-extractors/enhanced-benefit-extractor.service.ts` → Functional needs
- `src/services/uvp-extractors/enhanced-customer-extractor.service.ts` → Customer profiles

**Data Flow:**
1. Load all three data sources in parallel
2. Display customer suggestions (existing behavior)
3. Once customer selected, show relevant drivers
4. User selects top 3 emotional + top 3 functional
5. Auto-generate combined insight

### 4.4 Update UVP Flow Router
**File:** `src/pages/OnboardingPageV5.tsx` (or wherever UVP flow is routed)

**Changes:**
- Remove separate emotional driver step
- Remove separate functional driver step
- Add new `IdealCustomerProfilePage` at step 2
- Update step count (6 → 5)
- Update progress percentages

**New Step Order:**
1. Welcome / Industry Selection
2. **Ideal Customer Profile** (NEW - replaces 3 old steps)
3. Transformation Goal
4. Unique Solution
5. Key Benefit
6. Review & Submit

### 4.5 Output Data Structure
**Type Definition:**
```typescript
interface IdealCustomerProfile {
  customer: {
    statement: string;
    role?: string;
    companySize?: string;
    industry?: string;
    confidence: number;
  };
  emotionalDrivers: Array<{
    text: string;
    source: string;
    confidence: number;
  }>;
  functionalDrivers: Array<{
    text: string;
    source: string;
    confidence: number;
  }>;
  combinedInsight: string;
  timestamp: Date;
}
```

### 4.6 Test Unified Screen
**Test Cases:**
1. Load customer suggestions
2. Select customer, verify drivers load
3. Select 3 emotional + 3 functional
4. Verify combined insight generates
5. Navigate back/forward (state persists)
6. Data saves correctly

**Success Criteria:**
- All data visible on one screen
- Drivers map to selected customer
- Combined insight makes grammatical sense
- Backward compatible with old data format

---

## Phase 5: Integration & Testing (3 hours)

### 5.1 Update Data Persistence
**File:** `src/services/uvp/session-manager.service.ts` (or wherever UVP data saves)

**Changes:**
- Save new `IdealCustomerProfile` format
- Ensure backward compatibility with old format
- Migration helper for old data

**Data Storage:**
```typescript
// Save to business_profiles.uvp_data
{
  industry: "...",
  idealCustomerProfile: {
    customer: { ... },
    emotionalDrivers: [ ... ],
    functionalDrivers: [ ... ],
    combinedInsight: "..."
  },
  transformation: "...",
  solution: "...",
  benefit: "..."
}
```

### 5.2 Comprehensive Test Scenarios

#### Test 1: New Industry Save
1. Enter brand new industry (not in database)
2. Wait for profile generation
3. Verify profile saves without error
4. Reload page, verify profile loads from cache
5. Check database `industry_profiles` table

**Expected:** Profile saved, no 400/406 errors

#### Test 2: OpenDialog Product Detection
1. Enter URL: `https://opendialog.ai`
2. Wait for scraping
3. Check extracted products
4. Verify: Selma, Jamie, Rhea, OpenDialog Platform

**Expected:** All 4 products detected with high confidence

#### Test 3: Generic SaaS Product Detection
1. Enter URL of any SaaS with products in nav
2. Verify products from navigation detected first
3. Verify no random words extracted

**Expected:** Navigation-based products prioritized

#### Test 4: Unified Customer Profile
1. Complete flow to customer profile step
2. Select customer segment
3. Verify emotional + functional drivers load
4. Select top 3 of each
5. Verify combined insight generates

**Expected:** All data visible, insight grammatically correct

#### Test 5: Full UVP Flow End-to-End
1. Start fresh onboarding
2. Complete all 5 steps
3. Submit UVP
4. Verify all data saves to `business_profiles.uvp_data`
5. Reload, verify data persists

**Expected:** Full flow completes, data persists

### 5.3 Regression Testing
**Compare with backup version:**
- Data structure compatibility
- No breaking changes to existing flows
- All old features still work

### 5.4 TypeScript & Build Validation
```bash
# No TypeScript errors
npm run build

# No linting errors
npm run lint
```

**Success Criteria:**
- All 5 test scenarios pass
- Zero TypeScript errors
- Zero console errors
- Build completes successfully

---

## Phase 6: Documentation & PR Preparation (1 hour)

### 6.1 Update features.json
**File:** `.buildrunner/features.json`

**Update:**
- Mark `enhanced-uvp-wizard` as complete
- Document new unified step
- Update component list

### 6.2 Create Migration Documentation
**File:** `.buildrunner/UVP_V2_MIGRATION_NOTES.md`

**Contents:**
- Data structure changes
- Backward compatibility notes
- Breaking changes (if any)

### 6.3 Update Worktree Documentation
**File:** `.buildrunner/worktrees/worktree-uvp-v2-unified.md`

**Document:**
- Changes made
- Files modified
- Testing results
- Known issues (if any)

### 6.4 Create Pull Request
```bash
git add .
git commit -m "feat(uvp-v2): Unified customer profile, fixed industry save, smart product detection

FIXES:
- Industry profiles now save successfully (removed .select() from upsert, added 400/406 handlers)
- Navigation scraper captures link text + hrefs (was only capturing hrefs)
- Product detection prioritizes navigation structure over content scraping
- Two-pass product extraction for SaaS sites

NEW FEATURES:
- Unified Ideal Customer Profile page (customer + emotional + functional drivers)
- Customer-driver mapping with combined insight generation
- Navigation-first product detection service
- RLS-safe database operations helper

IMPROVEMENTS:
- Reduced UVP flow steps (6 → 5)
- Better UX: all customer data visible on one screen
- Higher product detection accuracy (tested with OpenDialog.ai)

TESTING:
- All 5 test scenarios passing
- No TypeScript errors
- No console errors
- Backward compatible with old UVP data

Closes #uvp-v2-unified"

git push origin feature/uvp-v2-unified
```

### 6.5 Pre-Merge Checklist
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Documentation updated
- [ ] Migration notes written
- [ ] Backward compatibility verified
- [ ] Side-by-side comparison with main shows improvement

---

## Merge Strategy

### DO NOT MERGE UNTIL:
1. User testing complete with live URLs
2. All 5 test scenarios verified in production-like environment
3. No regressions found
4. Code review complete

### Database Safety
**Important:** This branch uses the SAME Supabase instance as main

**Tables Modified:**
- `industry_profiles` - Safe (only INSERT/UPSERT operations)
- `business_profiles` - Safe (per-user data isolation via RLS)

**Migration Required:** None (schema unchanged, only operation patterns)

### Merge Commands
```bash
# From main repo (NOT worktree)
cd /Users/byronhudson/Projects/Synapse

# Ensure main is up to date
git checkout main
git pull origin main

# Merge feature branch
git merge --no-ff feature/uvp-v2-unified

# Verify build
npm run build

# Push to production
git push origin main

# Clean up worktree
git worktree remove ../synapse-uvp-v2

# Optional: Delete feature branch
git branch -d feature/uvp-v2-unified
git push origin --delete feature/uvp-v2-unified
```

---

## Rollback Plan

**If issues discovered after merge:**

```bash
# Revert merge commit
git revert -m 1 <merge-commit-hash>
git push origin main

# OR restore from backup
git checkout backup/uvp-onboarding-20241123
git checkout -b hotfix/restore-uvp
# Cherry-pick any commits made after backup that need preservation
git push origin hotfix/restore-uvp
```

---

## Time Estimates

| Phase | Estimated Time | Critical Path |
|-------|---------------|---------------|
| 0. Setup | 30 min | No |
| 1. Industry Save Fix | 2 hours | Yes |
| 2. Nav Scraping Fix | 3 hours | Yes |
| 3. Smart Product Detection | 4 hours | Yes |
| 4. Unified Screen | 6 hours | Yes |
| 5. Testing | 3 hours | Yes |
| 6. Documentation | 1 hour | No |
| **TOTAL** | **19.5 hours** | |

**Recommended Schedule:**
- Day 1: Phases 0-2 (5.5 hours)
- Day 2: Phase 3-4 (10 hours)
- Day 3: Phases 5-6 (4 hours)

---

## Success Criteria

### Functional Requirements
- ✅ New industry profiles save without 400/406 errors
- ✅ OpenDialog.ai products detected correctly (Selma, Jamie, Rhea, Platform)
- ✅ Navigation-first product detection working
- ✅ Unified customer profile screen functional
- ✅ Customer-driver mapping accurate
- ✅ Full UVP flow completes in 5 steps (reduced from 6)

### Technical Requirements
- ✅ No TypeScript errors
- ✅ No console errors
- ✅ Build completes successfully
- ✅ All tests pass
- ✅ Backward compatible with old data

### User Experience
- ✅ Fewer steps to complete UVP
- ✅ All customer data visible on one screen
- ✅ Product detection "just works" for common sites
- ✅ No manual intervention needed for new industries

---

## Known Limitations

1. **Database Sharing:** Feature branch uses same Supabase instance as main
   - **Mitigation:** RLS policies isolate user data, industry profiles are append-only

2. **No Visual Regression Testing:** UI changes not captured in automated tests
   - **Mitigation:** Manual visual testing required before merge

3. **Product Detection Limited to Scraping:** Can't detect products behind auth walls
   - **Acceptable:** Most marketing sites have public product pages

---

## References

- **Backup Commit:** `01f2c579` - `backup/uvp-onboarding-20241123`
- **RLS Documentation:** `RLS Documentation/400_ERROR_FIX_SUMMARY.md`
- **Features Registry:** `.buildrunner/features.json`
- **Worktree Pattern:** `.buildrunner/worktrees/worktree-foundation.md`

---

**Last Updated:** 2025-11-24
**Author:** Roy (Burnt-Out Sysadmin AI)
**Next Review:** After Phase 5 completion
