# Apify MVP Hotfix Plan
**Priority:** CRITICAL
**Timeline:** 1-2 days
**Goal:** Fix current MVP loading issues and get APIs working properly

---

## Current Issues

1. **App stalls at "Loading APIs: 18/23"** - Never completes loading
2. **Apify actor IDs are incorrect** - Getting 404 "Actor not found" errors
3. **Perplexity model name is outdated** - Using deprecated "llama-3.1-sonar" names
4. **Timeout mechanism blocks data** - User wants data, not timeouts

---

## Immediate Fixes Required

### Fix 1: Update Actor IDs in `apify-api.ts`
**File:** `/src/services/intelligence/apify-api.ts`

#### Current (Broken) Actor IDs:
```typescript
// In supabase/functions/apify-scraper/index.ts
TWITTER: 'apify/twitter-scraper'     // ❌ Doesn't exist
QUORA: 'apify/web-scraper'          // ⚠️ Generic fallback
LINKEDIN: 'apify/web-scraper'       // ⚠️ Generic fallback
TRUSTPILOT: 'apify/web-scraper'     // ⚠️ Generic fallback
G2: 'apify/web-scraper'              // ⚠️ Generic fallback
```

#### Corrected Actor IDs (Verified):
```typescript
const SOCIAL_ACTORS = {
  TWITTER: 'web.harvester/twitter-scraper',         // ✅ Updated per Apify recommendation (2025-11-26)
  FACEBOOK: 'apify/facebook-pages-scraper',         // ✅ Verified working
  INSTAGRAM: 'apify/instagram-scraper',             // ✅ Already working
  TIKTOK: 'clockworks/tiktok-scraper',             // ✅ Verified working
  LINKEDIN: 'curious_coder/linkedin-profile-scraper', // ✅ Verified working
  YOUTUBE: 'bernardo/youtube-scraper',              // ✅ Verified working
  GOOGLE_MAPS: 'compass/google-maps-reviews-scraper', // ✅ Already working
  WEBSITE_CONTENT: 'apify/website-content-crawler', // ✅ Keep as-is

  // Fallbacks for unsupported platforms
  QUORA: 'apify/web-scraper',                      // ⚠️ No dedicated actor
  TRUSTPILOT: 'apify/web-scraper',                 // ⚠️ No dedicated actor
  G2: 'apify/web-scraper',                         // ⚠️ No dedicated actor
  REDDIT: 'trudax/reddit-scraper'                  // ✅ Convert existing component
}
```

### Fix 2: Update Perplexity Model Names
**Files:**
- `/src/services/intelligence/perplexity-api.ts`
- `/src/services/intelligence/streaming-api-manager.ts`

#### Current (Deprecated):
```typescript
model: 'llama-3.1-sonar-small-128k-online'
model: 'llama-3.1-sonar-large-128k-online'
```

#### Corrected:
```typescript
model: 'sonar'  // Use the simplified current model name
```

### Fix 3: Remove Timeout Mechanism
**File:** `/src/services/intelligence/optimized-api-loader.service.ts`

#### Current Issue:
- Using `Promise.race` with 15-second timeout
- APIs that take longer than 15s are killed
- User explicitly said "I dont want timeouts, I want the data"

#### Fix:
1. Remove `loadAPIWithTimeout` method entirely
2. Revert to direct `loadAPIWithCache` calls
3. Implement progressive updates instead:
   - Show "Loading [API Name]..." for each API
   - Update UI as each API completes
   - Don't block on slow APIs

### Fix 4: Progressive Loading Implementation
**File:** `/src/services/intelligence/optimized-api-loader.service.ts`

#### Current (Blocking):
All APIs must complete before showing anything

#### Fixed (Progressive):
```typescript
// Phase 1: Instant (0-5s) - Show cached data immediately
const cached = await this.getCachedData();
if (cached) yield cached;

// Phase 2: Fast APIs (5-15s) - Instagram, Google Reviews
const fastAPIs = ['instagram', 'googleReviews'];
for (const api of fastAPIs) {
  const result = await this.loadAPIWithCache(api, brand);
  yield { [api]: result };
}

// Phase 3: Standard APIs (15-30s) - Don't wait, stream results
const standardAPIs = ['facebook', 'twitter', 'tiktok'];
standardAPIs.forEach(async api => {
  const result = await this.loadAPIWithCache(api, brand);
  yield { [api]: result };
});

// Phase 4: Slow APIs (30-60s) - Background loading
const slowAPIs = ['linkedin', 'youtube'];
// Load in background, update UI when ready
```

### Fix 5: Convert Reddit Component to Use Apify
**File:** `/src/services/intelligence/reddit-api.ts` (existing component)

#### Why This is Easy:
- **Already built:** Reddit component with embedding correlation exists
- **Same data structure:** Apify Reddit scraper returns similar JSON structure
- **Embedding pipeline ready:** Already correlating Reddit data through embeddings
- **Minimal changes:** Just swap API calls from Reddit direct to Apify

#### Implementation:
```typescript
// Current: Direct Reddit API
const response = await fetch('https://oauth.reddit.com/r/subreddit/hot', {
  headers: { 'Authorization': `Bearer ${REDDIT_TOKEN}` }
})

// New: Apify Reddit Scraper
const response = await ApifyAPI.runActor('trudax/reddit-scraper', {
  startUrls: [{ url: 'https://www.reddit.com/r/subreddit' }],
  maxItems: 100,
  sort: 'hot'
})
```

#### Benefits:
- **No rate limits:** Apify handles Reddit's aggressive rate limiting
- **No OAuth dance:** No need for Reddit app credentials
- **Better data:** Apify extracts more metadata (awards, cross-posts, etc.)
- **Existing embeddings:** Your correlation system works unchanged
- **Progressive enhancement:** Reddit data flows into existing UI components

#### Migration Path:
1. Keep existing Reddit UI components
2. Replace `reddit-api.ts` backend calls with Apify
3. Map Apify response to existing data structure
4. Existing embedding pipeline continues working
5. No frontend changes needed

---

## Testing Checklist

### Pre-Fix Testing:
- [ ] Document current error messages
- [ ] Screenshot stuck loading screen
- [ ] Note which APIs are failing

### Post-Fix Testing:
- [ ] App loads past 18/23 APIs
- [ ] No more Apify 404 errors
- [ ] Perplexity API returns results
- [ ] Progressive loading shows data as it arrives
- [ ] Instagram scraper still works (already functional)
- [ ] Google Maps reviews still work (already functional)
- [ ] Reddit data flows through Apify (no OAuth needed)
- [ ] Reddit embeddings still correlate properly

### Verification Commands:
```bash
# Test Apify actors directly
curl -X POST "https://api.apify.com/v2/acts/xtdata~twitter-x-scraper/runs" \
  -H "Authorization: Bearer YOUR_APIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"startUrls": [{"url": "https://twitter.com/elonmusk"}]}'

# Test Perplexity with new model
curl -X POST "https://api.perplexity.ai/chat/completions" \
  -H "Authorization: Bearer YOUR_PERPLEXITY_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "sonar", "messages": [{"role": "user", "content": "test"}]}'
```

---

## Implementation Steps

### Day 1 Morning (2 hours):
1. **Update all actor IDs** in Edge Function and frontend
2. **Fix Perplexity model names** across all files
3. **Test each API individually** via curl

### Day 1 Afternoon (3-4 hours):
1. **Remove timeout mechanism** from optimized-api-loader
2. **Implement progressive loading** with yield/streaming
3. **Convert Reddit component** to use Apify (`trudax/reddit-scraper`)
4. **Update UI to show loading progress** per API

### Day 2 Morning (2 hours):
1. **Integration testing** - full app flow
2. **Error handling** - graceful fallbacks
3. **Performance monitoring** - track load times

### Day 2 Afternoon (1 hour):
1. **Deploy fixes** to production
2. **Monitor for errors** in Supabase logs
3. **User acceptance testing**

---

## Success Metrics

### Must Have:
- ✅ App loads to 23/23 APIs (100% completion)
- ✅ No 404 errors in console
- ✅ Data appears progressively (not all at once)
- ✅ All working APIs return data

### Nice to Have:
- ⭐ Load time under 30 seconds for all APIs
- ⭐ Visual progress indicator per API
- ⭐ Cache hit rate > 50%

---

## Rollback Plan

If fixes cause new issues:
1. **Revert actor IDs** to generic `apify/web-scraper`
2. **Disable broken APIs** temporarily
3. **Re-enable timeouts** with longer duration (30s)
4. **Deploy hotfix** within 1 hour

---

## Long-Term Solutions (Post-Hotfix)

1. **Implement actor discovery** - Auto-detect available actors
2. **Build fallback chains** - Primary → Secondary → Generic
3. **Add health checks** - Test actors before using
4. **Create admin panel** - Toggle APIs on/off dynamically
5. **Monitor API costs** - Track Apify usage per actor

---

## Notes

- **Apify Starter Plan Active** - $49/month subscription confirmed
- **Free tier actors** - Instagram, Google Maps work on free tier
- **Paid tier actors** - Facebook, Twitter, TikTok, LinkedIn, Reddit need starter plan
- **Reddit conversion** - Easy migration from direct API to Apify (existing embeddings work)
- **User requirement** - "I want the data" - prioritize completeness over speed

---

**Document Version:** 1.0.0
**Created:** 2025-11-25
**Priority:** CRITICAL - Fix immediately