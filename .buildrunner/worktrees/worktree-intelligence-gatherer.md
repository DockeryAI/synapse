# Worktree Task: Parallel Intelligence Gathering System

**Feature ID:** `parallel-intelligence-gatherer`
**Branch:** `feature/intelligence-gatherer`
**Estimated Time:** 12 hours (1.5 days)
**Priority:** CRITICAL
**Dependencies:** Foundation, Location Detection (optional)
**Worktree Path:** `../synapse-intelligence`

---

## 🎯 Code Quality Standards

**IMPORTANT:** This feature uses patterns from `.buildrunner/worktrees/PATTERNS.md`

**Required Patterns:**
- ✅ API Call Pattern with retry + fallback
- ✅ Parallel API Calls (race condition safe)
- ✅ Type Validation with Zod
- ✅ Caching Pattern (7-day TTL)
- ✅ Rate Limiting (client-side)
- ✅ Detailed Logging
- ✅ Performance Timing

**Read PATTERNS.md FIRST** before implementing this feature.

---

## Context

Run 8+ data sources in parallel for ultra-fast business intelligence. Target: 30 seconds total completion time. This is the core intelligence engine that feeds everything else.

**Data Sources (from features.json):**
1. Website scraping (Apify)
2. Google Business Profile (OutScraper)
3. Google Reviews (OutScraper)
4. Search presence (Serper)
5. Competitor detection (Serper)
6. Service page analysis (Apify)
7. Social media profiles (Apify)
8. AI synthesis (OpenRouter - Claude Opus)

---

## Prerequisites

- Foundation merged
- Apify API key
- OutScraper API key
- Serper API key
- OpenRouter API key (Opus access)
- Read PATTERNS.md file

---

## Setup

```bash
cd /Users/byronhudson/Projects/Synapse
git worktree add ../synapse-intelligence feature/intelligence-gatherer
cd ../synapse-intelligence
npm install

# New dependencies
npm install apify-client axios zod
```

Add to `.env`:
```
VITE_APIFY_API_KEY=apify_api_xxx
VITE_OUTSCRAPER_API_KEY=xxx
VITE_SERPER_API_KEY=xxx
VITE_OPENROUTER_API_KEY=sk-or-xxx
```

---

## Task Checklist

### File: `src/services/parallel-intelligence.service.ts`

**Import Required Patterns:**
```typescript
import { z } from 'zod'
import { callAPIWithRetry, parallelAPICalls } from '@/lib/api-helpers'
import { SimpleCache } from '@/lib/cache'
import { RateLimiter } from '@/lib/rate-limiter'
import { log, timeOperation } from '@/lib/debug-helpers'
```

**Type Validation Schemas (Zod):**
```typescript
import { z } from 'zod'

const WebsiteDataSchema = z.object({
  pages: z.array(z.object({
    url: z.string().url(),
    title: z.string(),
    content: z.string(),
    wordCount: z.number().optional()
  })),
  totalPages: z.number(),
  keyContent: z.array(z.string()),
  images: z.array(z.string().url()),
  links: z.array(z.string().url())
})

const GBPDataSchema = z.object({
  name: z.string(),
  address: z.string().optional(),
  phone: z.string().optional(),
  hours: z.record(z.string()).optional(),
  categories: z.array(z.string()),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().optional()
})

const ReviewDataSchema = z.object({
  id: z.string(),
  author: z.string(),
  rating: z.number().min(1).max(5),
  text: z.string(),
  date: z.string(),
  sentiment: z.enum(['positive', 'negative', 'neutral']).optional(),
  keywords: z.array(z.string()).optional()
})

const SearchDataSchema = z.object({
  rankings: z.array(z.object({
    keyword: z.string(),
    position: z.number(),
    url: z.string().url()
  })),
  featuredSnippets: z.array(z.string()),
  knowledgePanel: z.boolean(),
  visibility: z.number().min(0).max(100)
})

const CompetitorSchema = z.object({
  name: z.string(),
  website: z.string().url().optional(),
  description: z.string().optional(),
  distance: z.string().optional(),
  rating: z.number().optional()
})

const ServiceDataSchema = z.object({
  name: z.string(),
  description: z.string(),
  pricing: z.string().optional(),
  category: z.string().optional()
})

const SocialProfilesSchema = z.object({
  facebook: z.string().url().optional(),
  instagram: z.string().url().optional(),
  linkedin: z.string().url().optional(),
  twitter: z.string().url().optional(),
  youtube: z.string().url().optional()
})

const AIInsightsSchema = z.object({
  strengths: z.array(z.string()),
  targetAudience: z.string(),
  contentOpportunities: z.array(z.string()),
  uniqueValue: z.string(),
  tone: z.string()
})

const IntelligenceReportSchema = z.object({
  websiteData: WebsiteDataSchema.nullable(),
  googleBusiness: GBPDataSchema.nullable(),
  reviews: z.array(ReviewDataSchema),
  searchPresence: SearchDataSchema.nullable(),
  competitors: z.array(CompetitorSchema),
  services: z.array(ServiceDataSchema),
  socialProfiles: SocialProfilesSchema.nullable(),
  aiInsights: AIInsightsSchema.nullable(),
  completedAt: z.date(),
  duration: z.number(),
  successfulSources: z.number(),
  failedSources: z.array(z.string())
})

type IntelligenceReport = z.infer<typeof IntelligenceReportSchema>
type WebsiteData = z.infer<typeof WebsiteDataSchema>
type GBPData = z.infer<typeof GBPDataSchema>
// ... export other types
```

**Main Function with Error Handling:**

- [ ] `gatherIntelligence(websiteUrl: string, businessName?: string): Promise<IntelligenceReport>`

```typescript
const intelligenceCache = new SimpleCache<IntelligenceReport>()
const rateLimiter = new RateLimiter(10, 60000) // 10 requests per minute

export async function gatherIntelligence(
  websiteUrl: string,
  businessName?: string
): Promise<IntelligenceReport> {
  return await timeOperation('Intelligence Gathering', async () => {
    // Check cache first
    const cacheKey = `intelligence:${websiteUrl}`
    const cached = intelligenceCache.get(cacheKey)
    if (cached) {
      log('Intelligence Gathering', 'Using cached data', 'info')
      return cached
    }

    // Rate limiting check
    if (!rateLimiter.canMakeRequest()) {
      throw new Error('Rate limit exceeded. Please wait before gathering more intelligence.')
    }
    rateLimiter.recordRequest()

    // Validate inputs
    if (!websiteUrl || websiteUrl.trim().length === 0) {
      throw new Error('Website URL is required')
    }

    try {
      // Run all sources in parallel with timeout
      const sources = [
        () => scrapeWebsite(websiteUrl),
        () => fetchGoogleBusiness(businessName || extractBusinessName(websiteUrl)),
        () => fetchGoogleReviews(businessName || extractBusinessName(websiteUrl)),
        () => analyzeSearchPresence(businessName || '', ''),
        () => detectCompetitors(businessName || '', '', ''),
        () => analyzeServicePages(websiteUrl),
        () => findSocialProfiles(businessName || '', websiteUrl),
      ]

      const results = await parallelAPICalls<any>(sources, {
        timeout: 30000, // 30 seconds
        allowPartialFailure: true
      })

      // Combine results
      const rawData = combineResults(results)

      // AI synthesis (sequential after gathering)
      const aiInsights = await synthesizeIntelligence(rawData)

      const report: IntelligenceReport = {
        ...rawData,
        aiInsights,
        completedAt: new Date(),
        duration: 0, // Will be filled by timeOperation
        successfulSources: results.length,
        failedSources: []
      }

      // Validate report structure
      const validatedReport = IntelligenceReportSchema.parse(report)

      // Cache for 7 days
      intelligenceCache.set(cacheKey, validatedReport, 7 * 24 * 60 * 60)

      return validatedReport
    } catch (error) {
      log('Intelligence Gathering', error, 'error')
      throw new Error(`Intelligence gathering failed: ${error}`)
    }
  })
}
```

**8 Data Source Functions (with retry logic):**

#### 1. Website Scraping (Apify)
- [ ] `scrapeWebsite(url: string): Promise<WebsiteData>`

```typescript
async function scrapeWebsite(url: string): Promise<WebsiteData | null> {
  return await callAPIWithRetry(
    async () => {
      // Validate URL
      if (!url.startsWith('http')) {
        throw new Error('Invalid URL format')
      }

      const apifyClient = new ApifyClient({
        token: import.meta.env.VITE_APIFY_API_KEY
      })

      const run = await apifyClient.actor('apify/website-content-crawler').call({
        startUrls: [{ url }],
        maxCrawlDepth: 2,
        maxCrawlPages: 10
      })

      const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems()

      if (!items || items.length === 0) {
        return null
      }

      const data: WebsiteData = {
        pages: items.map(item => ({
          url: item.url,
          title: item.title || '',
          content: item.text || '',
          wordCount: item.text?.split(' ').length || 0
        })),
        totalPages: items.length,
        keyContent: extractKeyContent(items),
        images: extractImages(items),
        links: extractLinks(items)
      }

      return WebsiteDataSchema.parse(data)
    },
    {
      maxRetries: 3,
      fallbackValue: null,
      onError: (error) => log('Website Scraping', error, 'error')
    }
  )
}

// Helper functions
function extractKeyContent(items: any[]): string[] {
  // Extract headings, important text, etc.
  return items
    .flatMap(item => item.headings || [])
    .filter(Boolean)
    .slice(0, 20)
}

function extractImages(items: any[]): string[] {
  return items
    .flatMap(item => item.images || [])
    .filter(img => img.startsWith('http'))
    .slice(0, 10)
}

function extractLinks(items: any[]): string[] {
  return items
    .flatMap(item => item.links || [])
    .filter(link => link.startsWith('http'))
    .slice(0, 20)
}
```

#### 2. Google Business Profile (OutScraper)
- [ ] `fetchGoogleBusiness(businessName: string, location?: string): Promise<GBPData>`

```typescript
async function fetchGoogleBusiness(
  businessName: string,
  location?: string
): Promise<GBPData | null> {
  return await callAPIWithRetry(
    async () => {
      if (!businessName || businessName.trim().length === 0) {
        return null
      }

      const query = location
        ? `${businessName} ${location}`
        : businessName

      const response = await axios.post(
        'https://api.app.outscraper.com/maps/search-v2',
        {
          query: [query],
          limit: 1,
          language: 'en'
        },
        {
          headers: {
            'X-API-KEY': import.meta.env.VITE_OUTSCRAPER_API_KEY
          },
          timeout: 10000
        }
      )

      if (!response.data || response.data.length === 0) {
        return null
      }

      const business = response.data[0][0]
      const data: GBPData = {
        name: business.name || businessName,
        address: business.address || undefined,
        phone: business.phone || undefined,
        hours: business.working_hours || undefined,
        categories: business.categories || [],
        rating: business.rating || undefined,
        reviewCount: business.reviews || undefined
      }

      return GBPDataSchema.parse(data)
    },
    {
      maxRetries: 3,
      fallbackValue: null,
      onError: (error) => log('Google Business Fetch', error, 'error')
    }
  )
}
```

#### 3. Google Reviews (OutScraper)
- [ ] `fetchGoogleReviews(businessName: string): Promise<ReviewData[]>`

```typescript
async function fetchGoogleReviews(businessName: string): Promise<ReviewData[]> {
  return await callAPIWithRetry(
    async () => {
      if (!businessName || businessName.trim().length === 0) {
        return []
      }

      const response = await axios.post(
        'https://api.app.outscraper.com/maps/reviews-v3',
        {
          query: [businessName],
          reviewsLimit: 50,
          language: 'en'
        },
        {
          headers: {
            'X-API-KEY': import.meta.env.VITE_OUTSCRAPER_API_KEY
          },
          timeout: 15000
        }
      )

      if (!response.data || response.data.length === 0) {
        return []
      }

      const reviews = response.data[0]?.reviews_data || []

      const validatedReviews = reviews.map((review: any) =>
        ReviewDataSchema.parse({
          id: review.review_id || `${Date.now()}-${Math.random()}`,
          author: review.author_title || 'Anonymous',
          rating: review.review_rating || 5,
          text: review.review_text || '',
          date: review.review_datetime_utc || new Date().toISOString(),
          sentiment: analyzeSentiment(review.review_text),
          keywords: extractKeywords(review.review_text)
        })
      )

      return validatedReviews
    },
    {
      maxRetries: 3,
      fallbackValue: [],
      onError: (error) => log('Google Reviews Fetch', error, 'error')
    }
  )
}

function analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  // Simple sentiment analysis
  const positiveWords = ['great', 'excellent', 'amazing', 'wonderful', 'best']
  const negativeWords = ['bad', 'terrible', 'worst', 'awful', 'poor']

  const lowerText = text.toLowerCase()
  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length

  if (positiveCount > negativeCount) return 'positive'
  if (negativeCount > positiveCount) return 'negative'
  return 'neutral'
}

function extractKeywords(text: string): string[] {
  // Extract important words (simplified)
  const words = text.toLowerCase().split(/\s+/)
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']
  return words
    .filter(word => word.length > 4 && !stopWords.includes(word))
    .slice(0, 5)
}
```

#### 4-7. Additional API Functions
*Implement similar patterns for:*
- [ ] `analyzeSearchPresence()` - Serper API with retry
- [ ] `detectCompetitors()` - Serper API with retry
- [ ] `analyzeServicePages()` - Apify with retry
- [ ] `findSocialProfiles()` - Apify with retry

**Pattern for each:**
```typescript
async function apiFunction(): Promise<DataType | null> {
  return await callAPIWithRetry(
    async () => {
      // 1. Validate inputs
      // 2. Make API call with timeout
      // 3. Parse response
      // 4. Validate with Zod schema
      // 5. Return typed data
    },
    {
      maxRetries: 3,
      fallbackValue: null,
      onError: (error) => log('Function Name', error, 'error')
    }
  )
}
```

#### 8. AI Synthesis (OpenRouter - Opus)
- [ ] `synthesizeIntelligence(rawData: Partial<IntelligenceReport>): Promise<AIInsights>`

```typescript
async function synthesizeIntelligence(
  rawData: Partial<IntelligenceReport>
): Promise<AIInsights | null> {
  return await callAPIWithRetry(
    async () => {
      const prompt = `Analyze this business intelligence and provide insights:

Business Data:
${JSON.stringify(rawData, null, 2)}

Provide:
1. Top 3 unique strengths
2. Primary target audience (be specific)
3. 5 content opportunities
4. Unique value proposition (1 sentence)
5. Recommended brand tone

Return ONLY valid JSON matching this structure:
{
  "strengths": ["strength1", "strength2", "strength3"],
  "targetAudience": "specific audience description",
  "contentOpportunities": ["opp1", "opp2", "opp3", "opp4", "opp5"],
  "uniqueValue": "one sentence UVP",
  "tone": "brand voice tone"
}`

      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'anthropic/claude-opus',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      )

      const content = response.data.choices[0].message.content
      const insights = JSON.parse(content)

      return AIInsightsSchema.parse(insights)
    },
    {
      maxRetries: 2,
      fallbackValue: null,
      onError: (error) => log('AI Synthesis', error, 'error')
    }
  )
}
```

---

## Edge Cases to Handle

**Critical Edge Cases:**
1. **All APIs fail:** Return partial data with clear indication of failures
2. **Business name missing:** Extract from URL or prompt user
3. **No reviews found:** Return empty array, don't crash
4. **API rate limits:** Implement exponential backoff, show user-friendly message
5. **Invalid JSON from AI:** Catch parse errors, return null
6. **Timeout scenarios:** 30-second max, cancel pending requests
7. **Malformed API responses:** Validate with Zod, log errors
8. **Network disconnection:** Retry with backoff, fail gracefully
9. **Empty/null values:** Handle throughout pipeline
10. **Special characters in business names:** Sanitize before API calls

**Input Validation:**
```typescript
function validateInputs(url: string, businessName?: string) {
  if (!url) throw new Error('URL is required')
  if (url.length > 2000) throw new Error('URL too long')
  if (businessName && businessName.length > 200) {
    businessName = businessName.substring(0, 200)
  }
  // Sanitize inputs
  url = url.trim()
  businessName = businessName?.trim()
}
```

---

## Performance Optimization

**Required Optimizations:**
- [ ] Implement 7-day cache with SimpleCache pattern
- [ ] Use parallel execution with 30-second timeout
- [ ] Rate limit: max 10 intelligence runs per minute per user
- [ ] Cancel pending requests on component unmount
- [ ] Lazy load heavy dependencies
- [ ] Monitor API response times, log slow responses (>5s)

**Performance Metrics:**
```typescript
interface PerformanceMetrics {
  totalDuration: number
  apiCalls: { name: string; duration: number }[]
  cacheHit: boolean
  failedCalls: string[]
}

function trackPerformance(report: IntelligenceReport): PerformanceMetrics {
  // Log to analytics
}
```

---

## Security Considerations

**Required Security Measures:**
- [ ] Never expose API keys in client code (use env vars)
- [ ] Sanitize business names before API calls (prevent injection)
- [ ] Validate all API responses with Zod before using
- [ ] Implement rate limiting to prevent abuse
- [ ] Log security events (suspicious inputs, failed auth)
- [ ] Set reasonable request timeouts (prevent DoS)
- [ ] Validate URL formats to prevent SSRF attacks

```typescript
function sanitizeBusinessName(name: string): string {
  return name
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/[^\w\s-]/g, '') // Remove special chars except spaces and hyphens
    .trim()
    .substring(0, 200)
}
```

---

## Database Integration

**Save results to database:**
```typescript
async function saveIntelligenceReport(
  report: IntelligenceReport,
  businessProfileId: string
) {
  const { data, error } = await supabase
    .from('intelligence_runs')
    .insert({
      business_profile_id: businessProfileId,
      sources_data: report,
      completed_at: report.completedAt,
      duration: report.duration,
      successful_sources: report.successfulSources,
      failed_sources: report.failedSources
    })

  if (error) {
    throw new Error(`Failed to save intelligence report: ${error.message}`)
  }

  return data
}
```

---

## Testing Requirements

**Comprehensive Tests:**
```typescript
describe('Parallel Intelligence Gatherer', () => {
  it('gathers all 8 sources in under 30 seconds', async () => {
    const start = Date.now()
    const report = await gatherIntelligence('https://example.com', 'Example Inc')
    const duration = Date.now() - start

    expect(duration).toBeLessThan(30000)
    expect(report.successfulSources).toBeGreaterThan(5) // At least 5/8 succeed
  })

  it('handles API failures gracefully', async () => {
    // Mock Apify failure
    vi.mock('apify-client', () => ({ ApifyClient: vi.fn(() => ({
      actor: vi.fn(() => ({ call: vi.fn(() => { throw new Error('API Error') }) }))
    })) }))

    const report = await gatherIntelligence('https://example.com')
    expect(report.failedSources).toContain('website-scraping')
    expect(report.websiteData).toBeNull()
    expect(report.googleBusiness).toBeDefined() // Others still work
  })

  it('validates data with Zod schemas', () => {
    const invalidData = { rating: 6 } // Rating > 5
    expect(() => GBPDataSchema.parse(invalidData)).toThrow()
  })

  it('uses cache for repeated requests', async () => {
    const report1 = await gatherIntelligence('https://example.com')
    const report2 = await gatherIntelligence('https://example.com')

    expect(report2).toBe(report1) // Same instance from cache
  })

  it('respects rate limits', async () => {
    // Make 11 requests rapidly
    const promises = Array(11).fill(null).map(() =>
      gatherIntelligence('https://example.com')
    )

    await expect(Promise.all(promises)).rejects.toThrow('Rate limit exceeded')
  })

  it('handles empty business name', async () => {
    const report = await gatherIntelligence('https://example.com', '')
    expect(report).toBeDefined()
    // Should still work by extracting name from URL
  })

  it('sanitizes malicious inputs', () => {
    const malicious = '<script>alert("xss")</script> Business'
    const sanitized = sanitizeBusinessName(malicious)
    expect(sanitized).not.toContain('<script>')
  })
})
```

---

## Completion Criteria

- [ ] All 8 data sources implemented with retry logic
- [ ] Zod schemas defined for all data types
- [ ] Parallel execution with Promise.allSettled
- [ ] Completes in <30 seconds (typical case)
- [ ] Graceful degradation (works with partial data)
- [ ] 7-day caching implemented
- [ ] Rate limiting active (10 per minute)
- [ ] All inputs validated and sanitized
- [ ] Results saved to database
- [ ] Performance monitoring active
- [ ] Comprehensive error handling
- [ ] Type definitions complete and exported
- [ ] All edge cases handled
- [ ] Tested with real business (3+ test cases)
- [ ] No TS errors, builds successfully
- [ ] Security measures implemented
- [ ] PATTERNS.md patterns used throughout

---

## Commit & Merge

```bash
git add .
git commit -m "feat: Add parallel intelligence gathering with 8 data sources

- Apify website scraping and service page analysis
- OutScraper Google Business and reviews
- Serper search presence and competitor detection
- Social media profile discovery
- Claude Opus AI synthesis
- 30-second parallel execution with graceful degradation
- Zod validation for all API responses
- 7-day caching with SimpleCache
- Rate limiting (10 per minute)
- Comprehensive error handling with retry logic
- Input sanitization and security measures
- Results saved to intelligence_runs table

Implements parallel-intelligence-gatherer feature"

git push origin feature/intelligence-gatherer
cd /Users/byronhudson/Projects/Synapse
git merge --no-ff feature/intelligence-gatherer
git worktree remove ../synapse-intelligence
```

---

**CRITICAL:** This is a complex, high-risk feature with 8 parallel API calls. Every API call must have:
1. ✅ Retry logic with exponential backoff
2. ✅ Zod validation
3. ✅ Error logging
4. ✅ Fallback values
5. ✅ Timeout handling

*8 APIs running in parallel. Use PATTERNS.md. Test thoroughly. Don't skip error handling.*
