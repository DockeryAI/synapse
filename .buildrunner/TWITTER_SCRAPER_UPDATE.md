# Twitter (X.com) Scraper Update

**Date:** 2025-11-26
**Priority:** HIGH - Previous Twitter scraper deprecated

## Update Summary

Apify has notified us that the previous Twitter scraper is no longer working. We've updated to their recommended replacement: `web.harvester/twitter-scraper`.

## Changes Made

### 1. Updated Actor ID in Edge Function
**File:** `supabase/functions/apify-scraper/index.ts`
- **Old:** `TWITTER: 'apidojo/tweet-scraper'`
- **New:** `TWITTER: 'web.harvester/twitter-scraper'`

### 2. Updated Documentation
- `APIFY_MVP_HOTFIX_PLAN.md` - Updated with new actor ID
- `APIFY_FEATURE_ENHANCEMENT_PLAN.md` - Updated actor reference

## New Twitter Scraper Capabilities

The `web.harvester/twitter-scraper` provides multiple scraping options:

### Available Actors
1. **Twitter Tweets & Profiles Scraper** (`web.harvester/twitter-scraper`)
   - Extract tweets and full profile data
   - Search profiles, scrape tweets with replies
   - Extract data via URL or username
   - Export in JSON, CSV, Excel, XML, or HTML

2. **Twitter User IDs Scraper** (`web.harvester/twitter-users-ids-scraper`)
   - Extract unique Twitter IDs from profiles
   - Input username, handle, or profile URL
   - Perfect for API integration and database management

3. **Twitter Search Scraper** (`web.harvester/easy-twitter-search-scraper`)
   - Extract tweets from search results
   - Get full tweet data including text, engagement, media, and user info
   - Ideal for social media monitoring and trend tracking

## API Usage Examples

### Basic API Call Structure
```javascript
// Run the Twitter scraper via API
const response = await fetch(
  'https://api.apify.com/v2/acts/web.harvester~twitter-scraper/runs',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_APIFY_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      startUrls: [{ url: 'https://twitter.com/username' }],
      maxItems: 100,
      includeReplies: true,
      tweetLanguage: 'en'
    })
  }
)
```

### Synchronous Execution (for quick results)
```javascript
// Get results immediately (for runs < 5 minutes)
const response = await fetch(
  'https://api.apify.com/v2/acts/web.harvester~twitter-scraper/run-sync-get-dataset-items?token=YOUR_API_TOKEN',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  }
)
```

## Input Parameters

### Common Parameters
- `startUrls`: Array of Twitter URLs to scrape
- `maxItems`: Maximum number of items to extract
- `includeReplies`: Whether to include replies (boolean)
- `tweetLanguage`: Filter tweets by language code
- `searchQuery`: For searching tweets (if using search scraper)
- `userHandles`: Array of usernames to scrape

### Output Format Options
- JSON (default)
- CSV
- Excel
- XML
- HTML

## Integration with Synapse

The Twitter scraper integrates with our existing intelligence pipeline:

1. **Breakthrough Detection** - Real-time Twitter mentions for trend detection
2. **Smart Picks** - Analyze viral tweet formats for content inspiration
3. **Cluster Patterns** - Extract customer sentiment from Twitter conversations
4. **Competitive Analysis** - Monitor competitor Twitter activity

## Progressive Loading Strategy

The new scraper fits into our phased loading architecture:
- **Phase 2 (3-15s)**: Twitter mentions and trending topics
- **Phase 3 (15-30s)**: Deep Twitter thread analysis
- **Phase 4 (30-60s)**: Historical Twitter data and competitive analysis

## Testing Checklist

- [ ] Verify new actor ID works in Edge Function
- [ ] Test Twitter profile scraping
- [ ] Test Twitter search functionality
- [ ] Confirm progressive loading continues working
- [ ] Check error handling for rate limits
- [ ] Validate data structure compatibility

## Monitoring

Monitor the following for the new scraper:
- API response times
- Data quality and completeness
- Rate limit handling
- Cost per scrape (Apify credits)

## Rollback Plan

If issues occur with the new scraper:
1. Try alternative: `xtdata/twitter-x-scraper` (if still available)
2. Use fallback: Generic `apify/web-scraper` with Twitter URLs
3. Implement retry logic with exponential backoff
4. Cache Twitter data more aggressively

## Additional Resources

- [Twitter Scraper Documentation](https://apify.com/web.harvester/twitter-scraper)
- [Twitter Scraper API Reference](https://apify.com/web.harvester/twitter-scraper/api)
- [Twitter Search Scraper](https://apify.com/web.harvester/easy-twitter-search-scraper)
- [Twitter User IDs Scraper](https://apify.com/web.harvester/twitter-users-ids-scraper)

## Notes

- The new scraper is actively maintained and recommended by Apify
- No changes needed to frontend code - same data structure
- Progressive loading continues to work without timeouts
- OAuth-less scraping means better reliability

---

**Status:** ✅ Implemented and ready for testing