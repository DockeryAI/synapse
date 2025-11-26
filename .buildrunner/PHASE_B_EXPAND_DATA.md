# PHASE B: EXPAND DATA SOURCES
## Priority: P1 - HIGH
## Estimated Duration: 4-5 days

**Prerequisites**:
- Read `BUILD_INSTRUCTIONS.md` before starting
- Verify Phase A is 100% complete
- Run `npm run build` to confirm clean state

---

## PHASE OBJECTIVE

Expand the intelligence engine's data sources to mine customer pain points, questions, and sentiment from social platforms, review sites, and deep content analysis. All new data sources must integrate with the existing UVP-driven correlation system.

---

## ITEM #5: Reddit Pain Point Mining

### Problem
Reddit contains authentic customer discussions about pain points, frustrations, and solutions. Currently not being mined for intelligence.

### Files to Read First
- `src/services/intelligence/streaming-deepcontext-builder.service.ts` (API integration patterns)
- `src/services/intelligence/reddit-api.ts` (existing Reddit API if any)
- `src/services/intelligence/reddit-apify-api.ts` (Apify-based Reddit scraper if exists)
- `src/types/synapse/deepContext.types.ts` (DataPoint interface)

### Task
1. Identify or create Reddit data fetching capability (likely via Apify)
2. Build search queries from UVP target customer and pain points
3. Extract relevant subreddits based on industry (r/insurance, r/SaaS, r/smallbusiness, etc.)
4. Mine posts and comments for:
   - Pain point expressions ("frustrated with...", "hate when...", "wish I could...")
   - Questions being asked ("how do I...", "what's the best...")
   - Solution discussions ("switched to...", "finally found...")
5. Transform Reddit data into DataPoint format with proper attribution
6. Integrate into streaming pipeline

### Acceptance Criteria
- [ ] Console shows `[Streaming/reddit] Mining X subreddits for customer pain points`
- [ ] Reddit data points appear in InsightGrid with source attribution
- [ ] Pain points extracted align with UVP target customer
- [ ] At least 10-20 relevant Reddit data points per brand

### Verification
```bash
npm run build
# Refresh dashboard and check for Reddit-sourced insights
```

### Status: COMPLETE

**Changes Made:**
- Added `redditAPI` import from `reddit-apify-api.ts`
- Added 'reddit' to `ALL_APIS` constant
- Added 'reddit' to `getApisForBusinessType()` for both local and B2B business types
- Added case statement for 'reddit' in `runApiWithCallback()` switch
- Created `fetchRedditData()` method with UVP-targeted search queries
- Created `getRelevantSubredditsForUVP()` helper for industry-specific subreddit mapping
- Created `buildRedditSearchQueries()` helper for UVP-driven search query generation
- Created `mapTriggerToDataPointType()` helper for emotional trigger mapping
- Added 'competitor_mention' to DataPointType in connections.types.ts
- Build passes successfully

---

## ITEM #6: Quora Question Mining

### Problem
Quora contains questions customers are actively asking about problems your brand solves. Rich source of "what customers want to know."

### Files to Read First
- `src/services/intelligence/streaming-deepcontext-builder.service.ts`
- Search for any existing Quora integration
- Apify actors for Quora scraping

### Task
1. Find/create Quora data source (likely Apify actor)
2. Build search queries from UVP:
   - Target customer job titles + "challenges"
   - Industry + common pain points
   - Transformation goal keywords
3. Extract questions and top answers
4. Score by relevance to UVP
5. Transform to DataPoint format

### Acceptance Criteria
- [ ] Console shows `[Streaming/quora] Found X relevant questions for target customer`
- [ ] Questions align with UVP pain points and transformation goals
- [ ] Top answers provide content angle inspiration

### Verification
```bash
npm run build
# Check console for Quora data points
```

### Status: COMPLETE

**Changes Made:**
- Added `apifySocialScraper` import from `apify-social-scraper.service.ts`
- Added 'quora' to `ALL_APIS` constant
- Added 'quora' to `getApisForBusinessType()` for both local and B2B business types
- Added case statement for 'quora' in `runApiWithCallback()` switch
- Created `fetchQuoraData()` method with UVP-targeted search keywords
- Created `buildQuoraSearchKeywords()` helper for UVP-driven keyword generation
- Created `mapQuoraCategoryToDataPointType()` helper for psychological category mapping
- Added 'quora' to DataSource type in connections.types.ts
- Build passes successfully

---

## ITEM #7: G2 Reviews Mining (B2B)

### Problem
G2 contains detailed B2B software reviews with pros/cons, use cases, and buyer sentiment. Critical for B2B brands.

### Files to Read First
- `src/services/intelligence/streaming-deepcontext-builder.service.ts`
- Search for G2 API or scraper integration
- `src/types/uvp-flow.types.ts` (to understand business type detection)

### Task
1. Integrate G2 review scraping (Apify or direct)
2. Fetch reviews for brand AND competitors
3. Extract:
   - Pros (what customers love)
   - Cons (pain points competitors have)
   - Use cases (job stories)
   - Switching reasons (why they chose this solution)
4. Stratify by rating (1-2 stars vs 4-5 stars for different insights)
5. Only activate for B2B segments

### Acceptance Criteria
- [ ] Console shows `[Streaming/g2] Mined X reviews for brand + competitors`
- [ ] Reviews stratified by rating tier
- [ ] Competitive intelligence extracted (why customers switched)
- [ ] Only runs for B2B brands (not SMB Local)

### Verification
```bash
npm run build
# Test with B2B brand (OpenDialog) - should show G2 insights
# Test with SMB brand - should skip G2
```

### Status: NOT STARTED

---

## ITEM #8: TrustPilot Reviews Mining

### Problem
TrustPilot has authentic customer reviews across all business types. Important for SMB and B2B.

### Files to Read First
- `src/services/intelligence/streaming-deepcontext-builder.service.ts`
- Search for TrustPilot integration
- OutScraper capabilities (may support TrustPilot)

### Task
1. Integrate TrustPilot scraping
2. Fetch reviews for brand and competitors
3. Extract sentiment, pain points, praise
4. Stratify by rating tier
5. Works across all business segments

### Acceptance Criteria
- [ ] Console shows `[Streaming/trustpilot] Mined X reviews`
- [ ] Reviews show customer sentiment with source attribution
- [ ] Works for SMB and B2B brands

### Verification
```bash
npm run build
# Check for TrustPilot data points in insights
```

### Status: NOT STARTED

---

## ITEM #9: Twitter/X Sentiment Mining

### Problem
Twitter/X contains real-time customer sentiment, complaints, and industry discussions. Currently not being mined.

### Files to Read First
- `src/services/intelligence/streaming-deepcontext-builder.service.ts`
- `src/services/intelligence/apify-social-scraper.service.ts` (may have Twitter support)
- Search for existing Twitter integration

### Task
1. Integrate Twitter scraping (Apify actor)
2. Build searches from UVP:
   - Brand mentions + sentiment
   - Competitor mentions + complaints
   - Industry hashtags + discussions
3. Extract:
   - Customer complaints (content defense angles)
   - Praise (testimonial material)
   - Questions (FAQ content)
   - Trends (timely content hooks)
4. Sentiment analysis on tweets

### Acceptance Criteria
- [ ] Console shows `[Streaming/twitter] Mining X tweets for brand sentiment`
- [ ] Tweets show sentiment score and category
- [ ] Competitor complaints identified
- [ ] Industry trends surfaced

### Verification
```bash
npm run build
# Check for Twitter-sourced insights
```

### Status: NOT STARTED

---

## ITEM #10: YouTube Comment Extraction

### Problem
YouTube comments contain authentic viewer reactions, questions, and pain points. Currently only getting video metadata.

### Files to Read First
- `src/services/intelligence/youtube-api.ts`
- `src/services/intelligence/streaming-deepcontext-builder.service.ts` (YouTube integration)

### Task
1. Extend YouTube API to fetch top comments (100 per video)
2. Filter comments for:
   - Questions ("how do I...", "what about...")
   - Pain points ("I struggle with...", "frustrated...")
   - Requests ("please make a video about...")
3. Extract comment themes per video
4. Create DataPoints from comment clusters

### Acceptance Criteria
- [ ] Console shows `[Streaming/youtube] Extracted X comments from Y videos`
- [ ] Comment themes appear as data points
- [ ] Questions from comments surface as content angles

### Verification
```bash
npm run build
# Check YouTube insights include comment-derived data
```

### Status: NOT STARTED

---

## ITEM #11: SEMrush Topic + PAA Expansion

### Problem
SEMrush provides "People Also Ask" questions and related topics that indicate customer search behavior.

### Files to Read First
- `src/services/intelligence/semrush-api.ts`
- `src/services/intelligence/serper-api.ts` (may have PAA support)
- `src/services/intelligence/streaming-deepcontext-builder.service.ts`

### Task
1. Expand Serper queries to capture PAA boxes
2. Extract "People Also Ask" questions related to UVP keywords
3. Group PAA by topic cluster
4. Score by relevance to UVP
5. Surface as content angle suggestions

### Acceptance Criteria
- [ ] Console shows `[Streaming/paa] Found X 'People Also Ask' questions`
- [ ] PAA questions grouped by topic
- [ ] High-relevance PAA surfaced as content ideas

### Verification
```bash
npm run build
# Check for PAA-derived content angles
```

### Status: NOT STARTED

---

## ITEM #12: Google Reviews Stratification (SMB)

### Problem
Google Reviews need to be stratified by rating to extract different insights (1-2 star = pain points, 4-5 star = praise).

### Files to Read First
- `src/services/intelligence/streaming-deepcontext-builder.service.ts` (OutScraper integration)
- `src/services/intelligence/outscraper-api.ts` or similar

### Task
1. Fetch Google Reviews via OutScraper (already exists)
2. Stratify reviews into tiers:
   - 1-2 stars: Extract pain points, complaints, failures
   - 3 stars: Extract mixed sentiment, "could be better"
   - 4-5 stars: Extract praise, testimonial material
3. Perform aspect-based sentiment analysis
4. Create separate DataPoints for each tier

### Acceptance Criteria
- [ ] Console shows `[Streaming/reviews] Stratified X reviews: Y low, Z mid, W high`
- [ ] Pain points extracted from low-rating reviews
- [ ] Testimonial quotes extracted from high-rating reviews
- [ ] Only runs for SMB segments

### Verification
```bash
npm run build
# Test with SMB brand - should show stratified reviews
```

### Status: NOT STARTED

---

## ITEM #13: Yelp Integration (SMB Local)

### Problem
Yelp is critical for SMB Local businesses (restaurants, services). Rich source of local customer sentiment.

### Files to Read First
- `src/services/intelligence/streaming-deepcontext-builder.service.ts`
- Search for Yelp API or scraper
- OutScraper capabilities

### Task
1. Integrate Yelp review scraping (Apify or OutScraper)
2. Only activate for SMB Local businesses
3. Extract:
   - Review text and sentiment
   - Photos (visual content inspiration)
   - Elite reviewer opinions (higher weight)
   - Tips and "what to order" content
4. Stratify by rating like Google Reviews

### Acceptance Criteria
- [ ] Console shows `[Streaming/yelp] Mined X Yelp reviews`
- [ ] Only runs for SMB Local segment
- [ ] Tips and "what to get" content extracted

### Verification
```bash
npm run build
# Test with local business - should show Yelp insights
# Test with B2B - should skip Yelp
```

### Status: NOT STARTED

---

## ITEM #14: LinkedIn Decision-Maker Mining (B2B)

### Problem
LinkedIn contains executive pain points, hiring signals, and industry discussions. Currently only basic search integration.

### Files to Read First
- `src/services/intelligence/streaming-deepcontext-builder.service.ts` (LinkedIn section)
- `src/services/intelligence/linkedin-alternative.service.ts` if exists
- Apify LinkedIn actors

### Task
1. Enhance LinkedIn scraping to find:
   - Posts from target customer job titles
   - Pain points mentioned in posts
   - Hiring trends (indicates growth areas)
   - Industry discussions
2. Build searches from UVP target customer roles
3. Extract content themes from executive posts
4. Only activate for B2B segments

### Acceptance Criteria
- [ ] Console shows `[Streaming/linkedin] Found X executive posts on target customer topics`
- [ ] Decision-maker pain points extracted
- [ ] Hiring trends surfaced
- [ ] Only runs for B2B brands

### Verification
```bash
npm run build
# Test with B2B brand - should show LinkedIn executive insights
```

### Status: NOT STARTED

---

## PHASE B COMPLETION CHECKLIST

Before moving to Phase B3/B4:

- [ ] All 10 items marked COMPLETE
- [ ] All acceptance criteria verified
- [ ] Build passes with no errors
- [ ] Manual test shows expanded data sources
- [ ] Commit all changes with proper format
- [ ] Data point count increased significantly (target: 200+)

---

## NOTES / BLOCKERS

- Many data sources require Apify actors - verify credits available
- Some platforms (Twitter, LinkedIn) have strict rate limits
- Segment detection needed to activate appropriate APIs per business type

---

*Phase B1-B2 must be complete before starting Phase B3-B4 (Contextual Intelligence)*

