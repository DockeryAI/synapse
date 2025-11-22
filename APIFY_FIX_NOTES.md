# Apify API Fix Notes

**Date:** 2025-11-21
**Issue:** Apify API calls failing with `net::ERR_FAILED` CORS error

---

## 🔴 THE PROBLEM

**Error:** `TypeError: Failed to fetch`

**Root Cause:**
- Apify API was being called **directly from browser** (client-side)
- Browser blocks cross-origin requests to `api.apify.com` (CORS)
- No CORS headers on Apify API responses

**Why This Happened:**
```typescript
// This runs in the browser and gets blocked by CORS
fetch(`https://api.apify.com/v2/acts/${actorId}/runs?token=${APIFY_API_KEY}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(input)
})
```

---

## ✅ THE FIX (Quick Solution)

**Disabled Apify API** by setting `includeApify: false` in DashboardPage.tsx

**Why Disable Instead of Fix:**
1. **CORS Issue:** Requires Supabase Edge Function to proxy requests
2. **Long Polling:** Apify actors take 30-120 seconds to complete (too slow for real-time)
3. **Low Impact:** Was returning 0 data points anyway
4. **8/9 APIs Working:** Other sources providing 173 data points already

---

## 🔧 PROPER FIX (Future)

To re-enable Apify, create Edge Function:

### Step 1: Create `/supabase/functions/apify-scraper/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const APIFY_API_KEY = Deno.env.get('APIFY_API_KEY')
const APIFY_API_URL = 'https://api.apify.com/v2'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const { actorId, input } = await req.json()

    // Start actor run
    const runResponse = await fetch(
      `${APIFY_API_URL}/acts/${actorId}/runs?token=${APIFY_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      }
    )

    if (!runResponse.ok) {
      throw new Error(`Apify API error: ${runResponse.status}`)
    }

    const runData = await runResponse.json()
    const runId = runData.data.id

    // Poll for completion (max 60 seconds for Edge Function)
    const startTime = Date.now()
    const timeout = 55000 // 55 seconds max

    while (Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, 3000))

      const statusResponse = await fetch(
        `${APIFY_API_URL}/actor-runs/${runId}?token=${APIFY_API_KEY}`
      )

      if (!statusResponse.ok) {
        throw new Error(`Failed to check status: ${statusResponse.status}`)
      }

      const statusData = await statusResponse.json()
      const status = statusData.data.status

      if (status === 'SUCCEEDED') {
        const datasetId = statusData.data.defaultDatasetId
        const datasetResponse = await fetch(
          `${APIFY_API_URL}/datasets/${datasetId}/items?token=${APIFY_API_KEY}`
        )

        if (!datasetResponse.ok) {
          throw new Error(`Failed to get results: ${datasetResponse.status}`)
        }

        const results = await datasetResponse.json()

        return new Response(
          JSON.stringify({ success: true, data: results }),
          {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        )
      } else if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) {
        throw new Error(`Actor run ${status}`)
      }
    }

    throw new Error('Actor run timed out')

  } catch (error) {
    console.error('[Apify Edge] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
})
```

### Step 2: Update `apify-api.ts` to call Edge Function

```typescript
private async runActor(actorId: string, input: any): Promise<any> {
  const { data, error } = await supabase.functions.invoke('apify-scraper', {
    body: { actorId, input }
  })

  if (error) throw new Error(`Apify Edge Function error: ${error.message}`)
  if (!data.success) throw new Error(data.error)

  return data.data
}
```

### Step 3: Set API key in Supabase

```bash
supabase secrets set APIFY_API_KEY=your_key_here
```

### Step 4: Re-enable in DashboardPage.tsx

```typescript
includeApify: true, // Now works via Edge Function
```

---

## 📊 IMPACT ANALYSIS

**Before Fix:**
- 9 APIs called
- Apify failing with CORS error
- 173 data points collected

**After Fix (Disabled):**
- 8 APIs called
- No Apify errors
- 173 data points collected (same)

**After Proper Fix (Edge Function):**
- 9 APIs called
- Apify works via Edge Function
- ~180-190 data points expected

---

## 🎯 RECOMMENDATION

**For Now:** Keep Apify disabled
**Reason:** 8 APIs providing sufficient data (173 points)

**Later:** Implement Edge Function if:
- Need website scraping capabilities
- Want to extract testimonials/services from competitor sites
- Building competitive intelligence features

---

## ✅ CURRENT STATUS

**Intelligence Stack:** 8/9 APIs Working
- ✅ YouTube (31 points)
- ✅ OutScraper (45 points)
- ✅ News (10 points)
- ✅ Weather (0 points before fix, 5-10 expected after)
- ✅ Serper (31 points)
- ✅ SEMrush (16 points)
- ✅ Website Analyzer (19 points)
- ✅ Perplexity (20 points)
- ❌ Apify (DISABLED - CORS issue)

**Total:** ~180-185 data points expected after Weather fix

---

**Testing:** Click "Refresh Intelligence" button or hard refresh dashboard (Cmd+Shift+R)
