# V6 API Configuration Audit Report
**Date:** 2025-12-04
**Auditor:** Roy (the guy who's seen this movie before)
**Status:** CRITICAL - Multiple misconfigurations found

---

## Executive Summary

Alright, buckle up. After auditing every goddamn API configuration in your V6 engine, I found the smoking gun for why VoC returns 0 insights. TL;DR: **Your VoC APIs are configured to use Serper site: searches and fake Apify actors that don't match what your edge functions expect.**

### The Critical Problem

**VoC Tab APIs for national-saas profile:**
```typescript
voc: ['apify-g2', 'apify-capterra', 'apify-trustpilot', 'hackernews', 'apify-linkedin']
```

**What V6 sends to edge functions:**
- `apify-g2` → Calls `fetch-serper` with `site:g2.com reviews` search
- `apify-capterra` → Calls `fetch-serper` with `site:capterra.com reviews` search
- `apify-trustpilot` → Calls `fetch-serper` with `site:trustpilot.com` search

**The problem:**
These aren't real Apify actors - they're Serper searches pretending to be review scrapers. Comments in your code literally say:
```typescript
// V5 FIX: Use Serper site: searches for review platforms (working config)
// These fake Apify actors don't exist - Serper site: searches actually work
```

So VoC is getting Google search results instead of actual review data. That's like ordering a steak and getting a picture of a steak.

---

## Detailed Findings

### 1. Edge Function Mismatches

**Edge functions that EXIST:**
```
✓ apify-scraper
✓ fetch-serper
✓ fetch-outscraper
✓ fetch-hackernews
✓ fetch-youtube
✓ fetch-buzzsumo
✓ fetch-news
✓ fetch-seo-metrics
✓ fetch-meta-ads
✓ fetch-google-places
✓ fetch-weather
✓ perplexity-proxy
✓ sec-edgar-proxy
```

**APIs configured but DON'T have dedicated edge functions:**
```
✗ producthunt (in FALLBACK_APIS)
✗ reddit-enterprise (doesn't exist - using 'reddit' instead)
✗ All the fake "apify-*" review scrapers (g2, capterra, trustpilot, amazon, yelp)
```

### 2. VoC API Configuration Analysis

#### National SaaS Profile (your test case)
```typescript
voc: ['apify-g2', 'apify-capterra', 'apify-trustpilot', 'hackernews', 'apify-linkedin']
```

**What actually happens:**
1. **apify-g2** → `fetch-serper` edge function
   - Sends: `{ endpoint: '/search', params: { q: '"YourBrand" site:g2.com reviews', num: 10 } }`
   - Returns: Google search results for g2.com pages (NOT review data)

2. **apify-capterra** → `fetch-serper` edge function
   - Sends: `{ endpoint: '/search', params: { q: '"YourBrand" site:capterra.com reviews', num: 10 } }`
   - Returns: Google search results (NOT review data)

3. **apify-trustpilot** → `fetch-serper` edge function
   - Sends: `{ endpoint: '/search', params: { q: '"YourBrand" site:trustpilot.com', num: 10 } }`
   - Returns: Google search results (NOT review data)

4. **hackernews** → `fetch-hackernews` edge function ✓ WORKS
   - Sends: `{ query: 'Insurance AI', tags: 'story', hitsPerPage: 20 }`
   - Returns: Actual HN stories

5. **apify-linkedin** → `apify-scraper` edge function
   - Sends: `{ actorId: 'curious_coder/linkedin-post-search-scraper', scraperType: 'LINKEDIN', input: { searchQuery: 'Insurance AI', maxResults: 20 } }`
   - Returns: Empty (requires LinkedIn cookie - not configured)

**Result:** 1 out of 5 VoC APIs actually returns usable data. The rest are either fake Serper searches or broken Apify actors.

### 3. Query Generation Issues

**extractShortQuery() for national-saas VoC:**
```typescript
// Input UVP: "Insurance agency COO/executive responsible for operational efficiency..."
// Output query: "Insurance agency looking for need solution software tool"
```

This is what's being sent to:
- Serper site searches (which can't parse review sentiment from search results)
- Apify actors (which expect business names or specific URLs)

**The mismatch:**
- Review platforms need **business names** (e.g., "Salesforce", "HubSpot")
- You're sending **customer descriptions** (e.g., "Insurance agency looking for...")

### 4. Apify Actor Configuration

**Configured actors in EDGE_FUNCTION_MAP:**
```typescript
'google-maps': 'compass/google-maps-reviews-scraper' ✓ EXISTS
'apify-facebook': 'apify/facebook-posts-scraper' ✓ EXISTS
'apify-twitter': 'apidojo/tweet-scraper' ✓ EXISTS
'apify-tiktok': 'clockworks/tiktok-scraper' ✓ EXISTS
'apify-instagram': 'apify/instagram-scraper' ✓ EXISTS
'apify-linkedin': 'curious_coder/linkedin-post-search-scraper' ✓ EXISTS (requires cookie)
'reddit': 'trudax/reddit-scraper' ✓ EXISTS
```

**Verified in apify-scraper/index.ts SOCIAL_ACTORS map:**
```typescript
TWITTER: 'apidojo/tweet-scraper' ✓ MATCH
FACEBOOK: 'apify/facebook-posts-scraper' ✓ MATCH
INSTAGRAM: 'apify/instagram-scraper' ✓ MATCH
LINKEDIN: 'curious_coder/linkedin-post-search-scraper' ✓ MATCH
TIKTOK: 'clockworks/tiktok-scraper' ✓ MATCH
REDDIT: 'trudax/reddit-scraper' ✓ MATCH
GOOGLE_MAPS: 'compass/google-maps-reviews-scraper' ✓ MATCH
YELP: 'yin/yelp-scraper' ✓ EXISTS (not in EDGE_FUNCTION_MAP!)
```

**Missing actors:**
- No real G2 scraper (using fake Serper search)
- No real Capterra scraper (using fake Serper search)
- No real Trustpilot scraper (using fake Serper search)
- No real Amazon reviews scraper (using fake Serper search)

### 5. Payload Format Verification

**Serper edge function expects:**
```typescript
// Option 1: Direct params
{ q: 'query', num: 20 }

// Option 2: Endpoint + params
{ endpoint: '/search', params: { q: 'query', num: 10 } }
```

**V6 sends for apify-g2:**
```typescript
{
  endpoint: '/search',
  params: { q: '"Insurance agency" site:g2.com reviews', num: 10 }
}
```
✓ Format is CORRECT

**Apify-scraper edge function expects:**
```typescript
{
  actorId: 'username/actor-name',
  scraperType: 'TWITTER' | 'REDDIT' | etc,
  input: { /* actor-specific input */ }
}
```

**V6 sends for reddit:**
```typescript
{
  actorId: 'trudax/reddit-scraper',
  scraperType: 'REDDIT',
  input: {
    startUrls: [{ url: 'https://www.reddit.com/search/?q=Insurance%20AI&sort=hot&t=month' }],
    maxItems: 15,
    includeComments: true,
    maxCommentsPerPost: 10,
    extendedData: true
  }
}
```
✓ Format is CORRECT

---

## Root Cause Analysis

### Why VoC Returns 0 Insights

**Primary cause:** VoC APIs are configured to use Serper site: searches instead of real review scrapers.

**Chain of failure:**
1. User triggers VoC tab for national-saas profile
2. V6 calls: `['apify-g2', 'apify-capterra', 'apify-trustpilot', 'hackernews', 'apify-linkedin']`
3. First 3 APIs route to `fetch-serper` with site: searches
4. Serper returns Google search result snippets (NOT structured review data)
5. Connection discovery tries to find patterns in search snippets
6. No reviews = no customer pain points = no connections = 0 insights

**Secondary causes:**
1. **LinkedIn actor requires cookie** - Not configured in edge function env vars
2. **Query format mismatch** - Sending customer descriptions instead of business names
3. **No fallback to real Apify review scrapers** - G2/Capterra/Trustpilot actors exist in Apify but aren't configured

### Why Other Tabs Work

**Community tab works because:**
- Uses real Apify actors (reddit, twitter, linkedin)
- Uses HackerNews API (dedicated edge function)
- Social platforms return actual discussions (not search snippets)

**Trends tab works because:**
- Perplexity does LLM synthesis (generates insights from context)
- NewsAPI returns real articles
- YouTube returns real videos

**Search tab works because:**
- SEMrush returns real keyword data
- Serper autocomplete returns real suggestions

---

## Comparison with Working V5 Configuration

I can't find V5 configs in your current codebase (looks like you archived everything), but based on the "V5 FIX" comments:

**V5 approach:**
- Used Serper site: searches as a workaround when Apify actors were broken/expensive
- Explicitly noted these were "fake" actors
- Worked because V5 had different insight synthesis (probably less reliant on structured review data)

**V6 changes:**
- Kept the fake Serper searches
- Added real Apify actors for social (twitter, reddit, etc)
- But forgot to migrate VoC APIs from fake Serper → real Apify scrapers
- V6 connection discovery expects structured data, chokes on search snippets

---

## Recommended Fixes (Priority Order)

### 🔥 CRITICAL - Fix VoC APIs for national-saas

**Option A: Use real Apify review scrapers**
```typescript
'national-saas': {
  voc: [
    'apify-g2-reviews',      // New: Real G2 scraper
    'apify-capterra-reviews', // New: Real Capterra scraper
    'apify-trustpilot',       // Keep: Real Trustpilot scraper exists
    'hackernews',             // Keep: Works
    'reddit'                  // Add: Search r/saas, r/b2bsoftware
  ]
}
```

**Option B: Keep Serper but fix query format**
```typescript
// Change extractShortQuery to extract BRAND NAME for VoC, not customer description
// Example: "Salesforce" instead of "Insurance agency looking for..."
```

**Option C: Hybrid approach (RECOMMENDED)**
```typescript
'national-saas': {
  voc: [
    'outscraper',             // Real reviews (Google My Business, etc)
    'hackernews',             // Tech community discussions
    'reddit',                 // r/saas, r/b2bsoftware, r/entrepreneur
    'apify-g2',               // Keep Serper site:g2.com (for discoverability)
    'serper'                  // General search for brand mentions
  ]
}
```

### 🔥 HIGH - Add missing Apify actors to EDGE_FUNCTION_MAP

**Yelp scraper exists but not configured:**
```typescript
'apify-yelp': {
  functionName: 'apify-scraper',
  timeout: 15000,
  queryType: 'short',
  transform: (query) => ({
    actorId: 'yin/yelp-scraper',
    scraperType: 'YELP',
    input: {
      searchQuery: query,
      maxBusinesses: 10,
      maxReviews: 20
    }
  })
}
```

**Real G2 scraper (if available on Apify):**
```typescript
// Check if apify/g2-scraper exists
// If not, keep using Serper site: search
```

### 🔥 MEDIUM - Fix query generation for VoC

**Current extractShortQuery for VoC:**
```typescript
// Returns: "Insurance agency looking for need solution software tool"
// Problem: This is customer description, not brand name
```

**Fix:**
```typescript
function extractShortQuery(uvp: CompleteUVP, tab: InsightTab): string {
  if (tab === 'voc') {
    // VoC needs brand name or business category
    const businessName = uvp.brandInfo?.name || '';
    const industry = uvp.targetCustomer?.industry || '';

    if (businessName) {
      return businessName; // "Salesforce", "HubSpot", etc
    }

    // Fallback: Industry + solution type
    const solutionKeywords = extractSolutionKeywords(uvp.uniqueSolution?.statement);
    return `${industry} ${solutionKeywords}`.trim(); // "Insurance CRM software"
  }

  // ... existing logic for other tabs
}
```

### 🔥 LOW - Add LinkedIn cookie to edge function env

**Apify LinkedIn actor requires session cookie:**
```bash
# In Supabase secrets
LINKEDIN_SESSION_COOKIE="li_at=xxx"
```

**Update apify-scraper/index.ts:**
```typescript
if (scraperType === 'LINKEDIN') {
  const linkedinCookie = Deno.env.get('LINKEDIN_SESSION_COOKIE');
  if (!linkedinCookie) {
    console.warn('LinkedIn scraper requires LINKEDIN_SESSION_COOKIE env var');
    // Return empty or skip
  }

  optimizedInput.cookie = linkedinCookie;
}
```

---

## Testing Checklist

### Step 1: Test individual edge functions
```bash
# Test Serper (should work)
curl -X POST https://your-project.supabase.co/functions/v1/fetch-serper \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"q": "Salesforce reviews", "num": 10}'

# Test Apify scraper with Reddit (should work)
curl -X POST https://your-project.supabase.co/functions/v1/apify-scraper \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "actorId": "trudax/reddit-scraper",
    "scraperType": "REDDIT",
    "input": {
      "startUrls": [{"url": "https://www.reddit.com/search/?q=salesforce&sort=hot&t=month"}],
      "maxItems": 15
    }
  }'

# Test HackerNews (should work)
curl -X POST https://your-project.supabase.co/functions/v1/fetch-hackernews \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"query": "salesforce", "tags": "story", "hitsPerPage": 20}'
```

### Step 2: Test V6 API orchestrator with national-saas profile
```typescript
// In browser console
const testUVP = {
  targetCustomer: {
    statement: "Insurance agency COO/executive responsible for operational efficiency",
    industry: "Insurance"
  },
  uniqueSolution: {
    statement: "AI Agent Management System for regulated industries"
  }
};

const profile = await getOrCreateBrandProfile('test-brand', testUVP);
console.log('Profile type:', profile.profile_type); // Should be 'national-saas'
console.log('VoC APIs:', profile.api_priorities.voc);

// Load VoC tab
const orchestrator = new ApiOrchestrator();
await orchestrator.setProfile(profile);
const vocData = await orchestrator.loadTab('voc');
console.log('VoC results:', vocData);
```

### Step 3: Verify data quality
```typescript
// Check that VoC results contain actual review/discussion data
vocData.results.forEach(result => {
  console.log(`${result.apiName}:`, {
    success: result.success,
    dataType: typeof result.data,
    sampleData: Array.isArray(result.data) ? result.data[0] : result.data
  });
});

// Look for:
// ✓ hackernews: Array of HN stories with titles/URLs
// ✓ reddit: Array of posts with comments
// ✗ apify-g2: Search snippets (NOT review data)
// ✗ apify-capterra: Search snippets (NOT review data)
```

---

## Additional Observations

### Cache Service is Not Used
You have a beautiful `APICacheService` with SWR pattern, but I don't see it being used in `ApiOrchestrator`. Every call goes directly to edge functions. That's like having a Ferrari in the garage and taking the bus.

### No Error Aggregation
When VoC APIs fail, errors are logged individually but there's no summary of "4 out of 5 VoC APIs failed". User just sees "0 insights" with no explanation.

### Retry Logic is Good
```typescript
const maxRetries = 2;
const backoffMs = Math.pow(2, attempt) * 500; // 500ms, 1s, 2s
```
This is solid. But it's retrying broken configs (garbage in, garbage out).

### Edge Function Timeouts
```typescript
'apify-g2': { timeout: 10000 }     // 10s
'apify-linkedin': { timeout: 15000 } // 15s
'google-maps': { timeout: 20000 }   // 20s
```
These look reasonable. Apify edge function has `waitForFinish=45` which is appropriate.

---

## Conclusion

Your V6 engine's VoC failure is a **configuration problem, not a code problem**. The orchestrator works fine - it's just calling the wrong APIs with the wrong query formats.

Fix priority:
1. **Immediate:** Change national-saas VoC config to use working APIs (reddit, hackernews, outscraper)
2. **Short-term:** Fix extractShortQuery to generate brand names for VoC instead of customer descriptions
3. **Long-term:** Add real Apify review scrapers for G2/Capterra/Trustpilot

And for the love of all that is holy, **test each API individually before adding it to a profile**. Your edge functions are solid, your orchestrator is solid - you just told them to call the wrong numbers.

---

**Roy out.** Now if you'll excuse me, I need to go yell at a junior dev who just pushed to prod on a Friday.
