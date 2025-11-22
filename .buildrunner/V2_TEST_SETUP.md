# V2 UVP Generation - Live Testing Setup

**Date:** 2025-11-21
**Status:** ✅ Ready for Testing
**Server:** http://localhost:3001

---

## What's Been Set Up

### 1. Dev Server on Port 3001 ✅

The development server is now running on **port 3001** to avoid conflicts with other worktrees.

**Access:**
- Local: http://localhost:3001
- Network: http://192.168.1.125:3001

### 2. Real URL Scraping (No Mock Data) ✅

Replaced the mock URL scraper with a **real scraper** that uses CORS proxies:

**File:** `src/services/v2/scraping/real-url-scraper.service.ts`

**Features:**
- ✅ Fetches actual HTML from live websites
- ✅ Uses CORS proxies (corsproxy.io, allorigins.win)
- ✅ Parses HTML with DOMParser to extract:
  - Business name
  - Hero content
  - Section headings and content
  - Paragraphs and descriptions
  - Metadata (title, description)
- ✅ Infers industry from URL and content keywords
- ✅ Infers location from TLD (.com, .uk, .ca, etc.)
- ✅ NO mock data - everything is scraped live

**Proxy Fallback Chain:**
1. corsproxy.io (primary)
2. allorigins.win (fallback)

### 3. V2 Test Page ✅

Created a dedicated test page for V2 UVP generation.

**Route:** `/v2-test`
**Component:** `src/pages/V2TestPage.tsx`

**Features:**
- Clean UI for testing
- Real-time progress display
- Console logging for debugging
- Error handling with alerts
- No V1 dependencies (pure V2)

### 4. Integration Complete ✅

**Updated Files:**
- `vite.config.ts` - Changed port from 3000 → 3001
- `src/services/v2/scraping/real-url-scraper.service.ts` - New real scraper
- `src/services/v2/scraping/index.ts` - Exports both mock and real scrapers
- `src/components/v2/flows/UVPGenerationFlow.tsx` - Uses RealURLScraperV2
- `src/pages/V2TestPage.tsx` - New test page
- `src/App.tsx` - Added `/v2-test` route

---

## How to Test with Live URLs

### Step 1: Access the Test Page

Open your browser and navigate to:

```
http://localhost:3001/v2-test
```

### Step 2: Enter a Website URL

The onboarding wizard will prompt you for a URL.

**Recommended Test URLs:**

1. **Simple Business:**
   ```
   https://www.stripe.com
   ```
   - Well-structured content
   - Clear value propositions
   - Good test case

2. **Restaurant/Service:**
   ```
   https://www.sweetgreen.com
   ```
   - Food & beverage industry
   - Strong brand messaging

3. **SaaS Product:**
   ```
   https://www.notion.so
   ```
   - Technology industry
   - Feature-rich content

4. **Professional Services:**
   ```
   https://www.mckinsey.com
   ```
   - Consulting industry
   - Complex offerings

5. **Any Other URL:**
   - Try your own website
   - Try a client's website
   - Any public business site

### Step 3: Watch the Pipeline

After entering a URL, the V2 pipeline will:

1. **Scrape** - Fetch live HTML via CORS proxy (~2-5s)
2. **Extract** - Run 5 AI extractors in 2 phases (~15-30s)
3. **Synthesize** - Generate UVP using Opus (~10-20s)
4. **Enhance** - Quality scoring and improvements (~5-10s)

**Total Time:** 30-60 seconds for complete UVP generation

### Step 4: Review Results

Once complete, you'll see:
- Primary UVP
- Secondary UVPs
- Customer segments
- Transformations
- Benefits
- Products/Services
- Quality scores

You can:
- ✏️ Edit any field inline (auto-saves after 1s)
- 🔄 Regenerate if quality is low
- ✅ Approve to move forward
- ❌ Cancel to start over

---

## Debugging

### Console Logs

Open browser DevTools (F12) and check Console for detailed logs:

```javascript
[RealURLScraperV2] Starting scrape for: https://example.com
[RealURLScraperV2] Fetching HTML...
[RealURLScraperV2] Trying proxy: https://corsproxy.io/
[RealURLScraperV2] Fetch successful, HTML length: 45230
[RealURLScraperV2] Parsing HTML...
[RealURLScraperV2] Extracted content pieces: 4
[RealURLScraperV2] Scrape completed: { businessName: "Example", contentPieces: 4, totalLength: 2341 }
```

### Network Tab

Check the Network tab to see:
- CORS proxy requests (should be 200 OK)
- AI API calls to OpenRouter
- Response times and payloads

### Known Issues

1. **CORS Proxy Failures**
   - If both proxies fail, you'll see an error
   - Some websites block all CORS proxies
   - Try a different URL

2. **AI API Rate Limits**
   - OpenRouter has rate limits
   - Wait 1-2 minutes between tests if you hit limits

3. **Large Websites**
   - Very large sites may timeout
   - Scraper limits to first few sections to avoid overload

---

## Architecture

### V2 Data Flow

```
User enters URL
    ↓
RealURLScraperV2.scrapeURL(url)
    ↓
Fetch HTML via CORS proxy
    ↓
Parse HTML with DOMParser
    ↓
Extract: businessName, content[], industry, location
    ↓
ExtractionOrchestrator.extractAll()
    ↓
Phase 1: Customer + Product (parallel)
    ↓
Phase 2: Transformation + Benefit + Solution (parallel)
    ↓
Week4Orchestrator.orchestrate()
    ↓
OpusSynthesisService.synthesize()
    ↓
QualityScorer.score()
    ↓
EnhancementService.enhance()
    ↓
Display results in ResultsReview
```

### V2 Isolation

**Zero V1 Imports:**
- ✅ No Supabase client imports
- ✅ No V1 service imports
- ✅ No V1 component imports
- ✅ Only V2 modules + external libraries

**Independent Services:**
- RealURLScraperV2 - Uses browser fetch + CORS proxies
- ExtractionOrchestrator - Coordinates AI extractors
- Week4Orchestrator - Main synthesis pipeline
- All V2 hooks and components

---

## Performance Expectations

### Scraping Phase
- **Target:** < 5 seconds
- **Typical:** 2-3 seconds
- **Factors:** Website size, proxy speed

### Extraction Phase
- **Target:** < 30 seconds
- **Typical:** 15-25 seconds
- **Factors:** Number of extractors, AI model speed

### Synthesis Phase
- **Target:** < 20 seconds
- **Typical:** 10-15 seconds
- **Factors:** Opus model speed, content complexity

### Total Pipeline
- **Target:** < 60 seconds
- **Typical:** 30-45 seconds
- **Best Case:** 25-30 seconds
- **Worst Case:** 60-90 seconds

---

## What's Different from Mock

### Mock Scraper (Old)
- ❌ Generated fake content
- ❌ Always returned same structure
- ❌ No actual HTTP requests
- ✅ Good for unit tests

### Real Scraper (New)
- ✅ Fetches live HTML from websites
- ✅ Parses real content
- ✅ Adapts to different site structures
- ✅ Realistic testing
- ⚠️ Depends on CORS proxies

---

## Next Steps

### Immediate Testing
1. Test with 3-5 different URLs
2. Verify content extraction quality
3. Check industry detection accuracy
4. Test error handling (invalid URLs, blocked sites)

### Potential Improvements
1. **Better Content Parsing**
   - Smarter section detection
   - Better heading hierarchy
   - Remove navigation/footer noise

2. **Fallback Strategies**
   - More CORS proxies
   - Server-side scraping (Supabase Edge Function)
   - Direct Apify integration

3. **Caching**
   - Cache scraped content
   - Avoid re-scraping same URL
   - Speed up repeated tests

4. **Enhanced Extraction**
   - Use scraped HTML structure
   - Extract images and colors
   - Parse pricing information

---

## Troubleshooting

### "Failed to fetch website after trying all proxies"

**Cause:** CORS proxies blocked or website not accessible

**Solutions:**
1. Try a different URL
2. Check your internet connection
3. Some websites block all CORS proxies (e.g., banking sites)
4. Try again in a few minutes (proxy might be down temporarily)

### "Invalid URL format"

**Cause:** URL format not recognized

**Solutions:**
1. Ensure URL starts with http:// or https://
2. Or just enter domain (e.g., "example.com")
3. No spaces or special characters

### "Generation taking too long"

**Cause:** AI models slow or rate-limited

**Solutions:**
1. Wait - first request can take 60-90s
2. Check console for progress
3. If stuck > 2 minutes, cancel and retry
4. Check OpenRouter API status

### "Blank or missing content"

**Cause:** Website structure not parsed correctly

**Solutions:**
1. Try a different URL
2. Check console logs for scraped content
3. Some sites use heavy JavaScript (can't parse client-side)

---

## Success Criteria

### ✅ Scraping Works
- Fetches real HTML
- Extracts business name
- Parses content sections
- Infers industry correctly

### ✅ Extraction Works
- All 5 extractors run
- Confidence scores > 60%
- Relevant data extracted

### ✅ Synthesis Works
- Primary UVP generated
- Secondary UVPs provided
- Quality score > 70

### ✅ UX Works
- Progress updates in real-time
- Results display correctly
- Inline editing saves changes
- Error states handled gracefully

---

## Files to Monitor

### For Scraping Issues:
```bash
src/services/v2/scraping/real-url-scraper.service.ts
```

### For Extraction Issues:
```bash
src/services/v2/extractors/extraction-orchestrator.service.ts
src/services/v2/extractors/customer-extractor-v2.service.ts
src/services/v2/extractors/transformation-extractor-v2.service.ts
```

### For Synthesis Issues:
```bash
src/services/v2/integration/Week4Orchestrator.ts
src/services/v2/synthesis/opus-synthesis.service.ts
```

### For UI Issues:
```bash
src/components/v2/flows/UVPGenerationFlow.tsx
src/components/v2/flows/GenerationPhase.tsx
src/components/v2/flows/ResultsReview.tsx
```

---

## Server Info

**Running:** Background process (ID: a546b7)
**Port:** 3001
**URL:** http://localhost:3001
**Status:** ✅ Ready

**To restart server:**
```bash
npm run dev
```

**To check server status:**
```bash
lsof -i :3001
```

---

**Setup Complete:** 2025-11-21
**Ready for Testing:** ✅ YES
**V2 Isolation:** ✅ Maintained
**Mock Data:** ❌ Disabled (using real scraping)
**Test Route:** http://localhost:3001/v2-test

---

**Happy Testing! 🚀**

Try it with real URLs and see the V2 pipeline in action.
