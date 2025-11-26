/**
 * Parallel Intelligence Gathering System
 *
 * Runs 8 data sources in parallel for ultra-fast business intelligence.
 * Target: <30 seconds completion time with graceful degradation.
 *
 * SECURITY: All API calls routed through Edge Functions
 * No API keys exposed in browser code
 *
 * Data Sources:
 * 1. Website scraping (Apify via apify-proxy)
 * 2. Google Business Profile (OutScraper via fetch-outscraper)
 * 3. Google Reviews (OutScraper via fetch-outscraper)
 * 4. Search presence (Serper via fetch-serper)
 * 5. Competitor detection (Serper via fetch-serper)
 * 6. Service page analysis (Apify via apify-proxy)
 * 7. Social media profiles (Serper via fetch-serper)
 * 8. AI synthesis (OpenRouter via ai-proxy)
 */

import { z } from 'zod'
import { callAPIWithRetry, parallelAPICalls } from '@/lib/api-helpers'
import { SimpleCache } from '@/lib/cache'
import { RateLimiter } from '@/lib/rate-limiter'
import { log, timeOperation } from '@/lib/debug-helpers'
import { sanitizeUserInput, validateURL } from '@/lib/security'

// Supabase Edge Function for secure API access
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// ============================================================================
// ZOD SCHEMAS - Type Validation for All Data Sources
// ============================================================================

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
  hours: z.record(z.string(), z.string()).optional(),
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

// Type exports
export type IntelligenceReport = z.infer<typeof IntelligenceReportSchema>
export type WebsiteData = z.infer<typeof WebsiteDataSchema>
export type GBPData = z.infer<typeof GBPDataSchema>
export type ReviewData = z.infer<typeof ReviewDataSchema>
export type SearchData = z.infer<typeof SearchDataSchema>
export type Competitor = z.infer<typeof CompetitorSchema>
export type ServiceData = z.infer<typeof ServiceDataSchema>
export type SocialProfiles = z.infer<typeof SocialProfilesSchema>
export type AIInsights = z.infer<typeof AIInsightsSchema>

// Legacy export for backwards compatibility
export interface IntelligenceResult {
  source: string
  data: any
  success: boolean
  error?: Error
  duration: number
  priority: 'critical' | 'important' | 'optional'
}

// ============================================================================
// CACHE & RATE LIMITING
// ============================================================================

const intelligenceCache = new SimpleCache<IntelligenceReport>()
const rateLimiter = new RateLimiter(10, 60000) // 10 requests per minute

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract business name from URL if not provided
 */
function extractBusinessName(url: string): string {
  try {
    const urlObj = new URL(url)
    // Extract domain without TLD: example.com -> example
    const domain = urlObj.hostname.replace(/^www\./, '').split('.')[0]
    return domain.charAt(0).toUpperCase() + domain.slice(1)
  } catch {
    return 'Business'
  }
}

/**
 * Sanitize business name for API calls
 */
function sanitizeBusinessName(name: string): string {
  return name
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/[^\w\s-]/g, '') // Remove special chars except spaces and hyphens
    .trim()
    .substring(0, 200)
}

/**
 * Extract key content from scraped pages
 */
function extractKeyContent(items: any[]): string[] {
  return items
    .flatMap(item => item.headings || [])
    .filter(Boolean)
    .slice(0, 20)
}

/**
 * Extract images from scraped pages
 */
function extractImages(items: any[]): string[] {
  return items
    .flatMap(item => item.images || [])
    .filter(img => typeof img === 'string' && img.startsWith('http'))
    .slice(0, 10)
}

/**
 * Extract links from scraped pages
 */
function extractLinks(items: any[]): string[] {
  return items
    .flatMap(item => item.links || [])
    .filter(link => typeof link === 'string' && link.startsWith('http'))
    .slice(0, 20)
}

/**
 * Simple sentiment analysis
 */
function analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const positiveWords = ['great', 'excellent', 'amazing', 'wonderful', 'best', 'love', 'perfect', 'fantastic']
  const negativeWords = ['bad', 'terrible', 'worst', 'awful', 'poor', 'horrible', 'disappointing']

  const lowerText = text.toLowerCase()
  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length

  if (positiveCount > negativeCount) return 'positive'
  if (negativeCount > positiveCount) return 'negative'
  return 'neutral'
}

/**
 * Extract keywords from text
 */
function extractKeywords(text: string): string[] {
  const words = text.toLowerCase().split(/\s+/)
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'is', 'was', 'were']
  return words
    .filter(word => word.length > 4 && !stopWords.includes(word))
    .slice(0, 5)
}

// Legacy aggregated intelligence interface for backwards compatibility
export interface AggregatedIntelligence {
  url: string
  results: IntelligenceResult[]
  successCount: number
  totalCount: number
  totalDuration: number
  isViable: boolean
  timestamp: Date
}

// ============================================================================
// DATA SOURCE FUNCTIONS (8 Sources)
// ============================================================================

/**
 * 1. WEBSITE SCRAPING (Apify via Edge Function)
 * Scrapes website content, structure, images, and links
 */
async function scrapeWebsite(url: string): Promise<WebsiteData | null> {
  return await callAPIWithRetry(
    async () => {
      if (!validateURL(url)) {
        throw new Error('Invalid URL format')
      }

      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error('Supabase configuration missing')
      }

      // Start Apify run via Edge Function
      const runResponse = await fetch(`${SUPABASE_URL}/functions/v1/apify-proxy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'run',
          actorId: 'apify/website-content-crawler',
          input: {
            startUrls: [{ url }],
            maxCrawlDepth: 2,
            maxCrawlPages: 10
          }
        })
      })

      if (!runResponse.ok) {
        throw new Error(`Apify run failed: ${runResponse.status}`)
      }

      const runResult = await runResponse.json()
      const runId = runResult.data?.id
      const datasetId = runResult.data?.defaultDatasetId

      if (!runId || !datasetId) {
        throw new Error('Failed to start Apify run')
      }

      // Poll for completion (max 60 seconds)
      let status = 'RUNNING'
      let attempts = 0
      while (status === 'RUNNING' && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        const statusResponse = await fetch(`${SUPABASE_URL}/functions/v1/apify-proxy`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action: 'status', runId })
        })
        const statusResult = await statusResponse.json()
        status = statusResult.data?.status
        attempts++
      }

      if (status !== 'SUCCEEDED') {
        log('Website Scraping', `Apify run did not succeed: ${status}`, 'warn')
        return null
      }

      // Get dataset results
      const datasetResponse = await fetch(`${SUPABASE_URL}/functions/v1/apify-proxy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'dataset', datasetId, limit: 20 })
      })

      const datasetResult = await datasetResponse.json()
      const items = datasetResult.data || []

      if (!items || items.length === 0) {
        log('Website Scraping', 'No items returned from Apify', 'warn')
        return null
      }

      const pages = items.map((item: any) => ({
        url: (item.url || url) as string,
        title: (item.title || '') as string,
        content: (item.text || '') as string,
        wordCount: typeof item.text === 'string' ? item.text.split(' ').length : 0
      }));

      const data: WebsiteData = {
        pages,
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

/**
 * 2. GOOGLE BUSINESS PROFILE (OutScraper via Edge Function)
 * Fetches Google Business Profile data
 */
async function fetchGoogleBusiness(
  businessName: string,
  location?: string
): Promise<GBPData | null> {
  return await callAPIWithRetry(
    async () => {
      if (!businessName || businessName.trim().length === 0) {
        return null
      }

      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error('Supabase configuration missing')
      }

      const sanitizedName = sanitizeBusinessName(businessName)
      const query = location ? `${sanitizedName} ${location}` : sanitizedName

      const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-outscraper`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endpoint: '/maps/search-v2',
          params: {
            query: query,
            limit: '1',
            language: 'en'
          }
        })
      })

      if (!response.ok) {
        throw new Error(`OutScraper API error: ${response.status}`)
      }

      const data = await response.json()

      if (!data || data.length === 0 || !data[0]) {
        log('Google Business Fetch', 'No results found', 'warn')
        return null
      }

      const business = Array.isArray(data[0]) ? data[0][0] : data[0]
      if (!business) {
        log('Google Business Fetch', 'No business data found', 'warn')
        return null
      }

      const gbpData: GBPData = {
        name: business.name || businessName,
        address: business.address || undefined,
        phone: business.phone || undefined,
        hours: business.working_hours || undefined,
        categories: business.categories || [],
        rating: business.rating || undefined,
        reviewCount: business.reviews || undefined
      }

      return GBPDataSchema.parse(gbpData)
    },
    {
      maxRetries: 3,
      fallbackValue: null,
      onError: (error) => log('Google Business Fetch', error, 'error')
    }
  )
}

/**
 * 3. GOOGLE REVIEWS (OutScraper via Edge Function)
 * Fetches Google reviews with sentiment analysis
 */
async function fetchGoogleReviews(businessName: string): Promise<ReviewData[]> {
  return await callAPIWithRetry(
    async () => {
      if (!businessName || businessName.trim().length === 0) {
        return []
      }

      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error('Supabase configuration missing')
      }

      const sanitizedName = sanitizeBusinessName(businessName)

      const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-outscraper`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endpoint: '/maps/reviews-v3',
          params: {
            query: sanitizedName,
            reviewsLimit: '50',
            language: 'en'
          }
        })
      })

      if (!response.ok) {
        throw new Error(`OutScraper API error: ${response.status}`)
      }

      const data = await response.json()

      if (!data || data.length === 0 || !data[0]?.reviews_data) {
        log('Google Reviews Fetch', 'No reviews found', 'warn')
        return []
      }

      const reviews = data[0].reviews_data || []

      const validatedReviews = reviews.map((review: any) =>
        ReviewDataSchema.parse({
          id: review.review_id || `${Date.now()}-${Math.random()}`,
          author: review.author_title || 'Anonymous',
          rating: review.review_rating || 5,
          text: review.review_text || '',
          date: review.review_datetime_utc || new Date().toISOString(),
          sentiment: analyzeSentiment(review.review_text || ''),
          keywords: extractKeywords(review.review_text || '')
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

/**
 * 4. SEARCH PRESENCE (Serper via Edge Function)
 * Analyzes search engine presence and rankings
 */
async function analyzeSearchPresence(
  businessName: string,
  location: string
): Promise<SearchData | null> {
  return await callAPIWithRetry(
    async () => {
      if (!businessName || businessName.trim().length === 0) {
        return null
      }

      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error('Supabase configuration missing')
      }

      const sanitizedName = sanitizeBusinessName(businessName)
      const query = location ? `${sanitizedName} ${location}` : sanitizedName

      const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-serper`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endpoint: '/search',
          params: { q: query, num: 10 }
        })
      })

      if (!response.ok) {
        throw new Error(`Serper API error: ${response.status}`)
      }

      const responseData = await response.json()

      if (!responseData) {
        return null
      }

      const data: SearchData = {
        rankings: (responseData.organic || []).slice(0, 10).map((result: any, index: number) => ({
          keyword: query,
          position: index + 1,
          url: result.link || ''
        })),
        featuredSnippets: responseData.answerBox ? [responseData.answerBox.snippet || ''] : [],
        knowledgePanel: !!responseData.knowledgeGraph,
        visibility: responseData.organic?.length || 0
      }

      return SearchDataSchema.parse(data)
    },
    {
      maxRetries: 3,
      fallbackValue: null,
      onError: (error) => log('Search Presence Analysis', error, 'error')
    }
  )
}

/**
 * 5. COMPETITOR DETECTION (Serper via Edge Function)
 * Identifies competitors in the same market
 */
async function detectCompetitors(
  businessName: string,
  industry: string,
  location: string
): Promise<Competitor[]> {
  return await callAPIWithRetry(
    async () => {
      if (!businessName || businessName.trim().length === 0) {
        return []
      }

      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error('Supabase configuration missing')
      }

      const sanitizedName = sanitizeBusinessName(businessName)
      const query = `${industry || 'businesses'} ${location || 'near me'}`

      const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-serper`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endpoint: '/search',
          params: { q: query, num: 10 }
        })
      })

      if (!response.ok) {
        throw new Error(`Serper API error: ${response.status}`)
      }

      const responseData = await response.json()

      if (!responseData || !responseData.organic) {
        return []
      }

      const competitors = (responseData.organic || [])
        .slice(0, 5)
        .filter((result: any) => result.title && result.title.toLowerCase() !== sanitizedName.toLowerCase())
        .map((result: any) => ({
          name: result.title || '',
          website: result.link || undefined,
          description: result.snippet || undefined,
          distance: undefined,
          rating: undefined
        }))
        .map(comp => CompetitorSchema.parse(comp))

      return competitors
    },
    {
      maxRetries: 3,
      fallbackValue: [],
      onError: (error) => log('Competitor Detection', error, 'error')
    }
  )
}

/**
 * 6. SERVICE PAGE ANALYSIS (Apify via Edge Function)
 * Analyzes service and product pages
 */
async function analyzeServicePages(url: string): Promise<ServiceData[]> {
  return await callAPIWithRetry(
    async () => {
      if (!validateURL(url)) {
        throw new Error('Invalid URL format')
      }

      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error('Supabase configuration missing')
      }

      // Start Apify run via Edge Function
      const runResponse = await fetch(`${SUPABASE_URL}/functions/v1/apify-proxy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'run',
          actorId: 'apify/website-content-crawler',
          input: {
            startUrls: [{ url }],
            maxCrawlDepth: 2,
            maxCrawlPages: 20,
            crawlAllUrls: true
          }
        })
      })

      if (!runResponse.ok) {
        throw new Error(`Apify run failed: ${runResponse.status}`)
      }

      const runResult = await runResponse.json()
      const runId = runResult.data?.id
      const datasetId = runResult.data?.defaultDatasetId

      if (!runId || !datasetId) {
        throw new Error('Failed to start Apify run')
      }

      // Poll for completion (max 60 seconds)
      let status = 'RUNNING'
      let attempts = 0
      while (status === 'RUNNING' && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        const statusResponse = await fetch(`${SUPABASE_URL}/functions/v1/apify-proxy`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action: 'status', runId })
        })
        const statusResult = await statusResponse.json()
        status = statusResult.data?.status
        attempts++
      }

      if (status !== 'SUCCEEDED') {
        log('Service Page Analysis', `Apify run did not succeed: ${status}`, 'warn')
        return []
      }

      // Get dataset results
      const datasetResponse = await fetch(`${SUPABASE_URL}/functions/v1/apify-proxy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'dataset', datasetId, limit: 30 })
      })

      const datasetResult = await datasetResponse.json()
      const items = datasetResult.data || []

      if (!items || items.length === 0) {
        return []
      }

      const servicePages = items.filter((item: any) =>
        item.url?.includes('/service') ||
        item.url?.includes('/product') ||
        item.url?.includes('/offering')
      )

      const services = servicePages.slice(0, 10).map((page: any) =>
        ServiceDataSchema.parse({
          name: page.title || 'Service',
          description: page.text?.slice(0, 200) || '',
          pricing: undefined,
          category: undefined
        })
      )

      return services
    },
    {
      maxRetries: 3,
      fallbackValue: [],
      onError: (error) => log('Service Page Analysis', error, 'error')
    }
  )
}

/**
 * 7. SOCIAL MEDIA PROFILES (Serper via Edge Function)
 * Discovers social media profiles
 */
async function findSocialProfiles(
  businessName: string,
  websiteUrl: string
): Promise<SocialProfiles | null> {
  return await callAPIWithRetry(
    async () => {
      if (!businessName || businessName.trim().length === 0) {
        return null
      }

      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error('Supabase configuration missing')
      }

      const sanitizedName = sanitizeBusinessName(businessName)

      const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-serper`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endpoint: '/search',
          params: { q: `${sanitizedName} social media facebook instagram linkedin`, num: 10 }
        })
      })

      if (!response.ok) {
        throw new Error(`Serper API error: ${response.status}`)
      }

      const responseData = await response.json()

      if (!responseData || !responseData.organic) {
        return null
      }

      const results = responseData.organic || []
      const profiles: SocialProfiles = {}

      results.forEach((result: any) => {
        const link = result.link || ''
        if (link.includes('facebook.com/')) profiles.facebook = link
        if (link.includes('instagram.com/')) profiles.instagram = link
        if (link.includes('linkedin.com/')) profiles.linkedin = link
        if (link.includes('twitter.com/') || link.includes('x.com/')) profiles.twitter = link
        if (link.includes('youtube.com/')) profiles.youtube = link
      })

      if (Object.keys(profiles).length === 0) {
        return null
      }

      return SocialProfilesSchema.parse(profiles)
    },
    {
      maxRetries: 3,
      fallbackValue: null,
      onError: (error) => log('Social Profile Discovery', error, 'error')
    }
  )
}

/**
 * 8. AI SYNTHESIS (AI Proxy - Claude Opus via OpenRouter)
 * Synthesizes all intelligence into actionable insights
 */
async function synthesizeIntelligence(
  rawData: Partial<IntelligenceReport>
): Promise<AIInsights | null> {
  return await callAPIWithRetry(
    async () => {
      const aiProxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseAnonKey) {
        throw new Error('Supabase configuration is missing');
      }

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
        aiProxyUrl,
        {
          provider: 'openrouter',  // Route through ai-proxy to OpenRouter
          model: 'anthropic/claude-opus',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      )

      const content = response.data.choices[0].message.content

      let jsonStr = content
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonStr = jsonMatch[0]
      }

      const insights = JSON.parse(jsonStr)
      return AIInsightsSchema.parse(insights)
    },
    {
      maxRetries: 2,
      fallbackValue: null,
      onError: (error) => log('AI Synthesis', error, 'error')
    }
  )
}

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

/**
 * Gather intelligence from all 8 sources in parallel
 */
export async function gatherIntelligence(
  websiteUrl: string,
  businessName?: string,
  location?: string,
  industry?: string
): Promise<IntelligenceReport> {
  return await timeOperation('Intelligence Gathering', async () => {
    const cacheKey = `intelligence:${websiteUrl}`
    const cached = intelligenceCache.get(cacheKey)
    if (cached) {
      log('Intelligence Gathering', 'Using cached data', 'info')
      return cached
    }

    if (!rateLimiter.canMakeRequest()) {
      throw new Error('Rate limit exceeded. Please wait before gathering more intelligence.')
    }
    rateLimiter.recordRequest()

    if (!websiteUrl || websiteUrl.trim().length === 0) {
      throw new Error('Website URL is required')
    }

    if (!validateURL(websiteUrl)) {
      throw new Error('Invalid website URL format')
    }

    const effectiveBusinessName = businessName || extractBusinessName(websiteUrl)
    const sanitizedBusinessName = sanitizeBusinessName(effectiveBusinessName)

    log('Intelligence Gathering', {
      url: websiteUrl,
      businessName: sanitizedBusinessName,
      location,
      industry
    }, 'info')

    const startTime = Date.now()
    const failedSources: string[] = []

    try {
      const sources = [
        () => scrapeWebsite(websiteUrl),
        () => fetchGoogleBusiness(sanitizedBusinessName, location),
        () => fetchGoogleReviews(sanitizedBusinessName),
        () => analyzeSearchPresence(sanitizedBusinessName, location || ''),
        () => detectCompetitors(sanitizedBusinessName, industry || '', location || ''),
        () => analyzeServicePages(websiteUrl),
        () => findSocialProfiles(sanitizedBusinessName, websiteUrl)
      ]

      type SourceResult = WebsiteData | GBPData | ReviewData[] | SearchData | Competitor[] | ServiceData[] | SocialProfiles | null;

      const results = await parallelAPICalls<SourceResult>(sources as Array<() => Promise<SourceResult>>, {
        timeout: 30000,
        allowPartialFailure: true
      })

      const [
        websiteDataRaw,
        googleBusinessRaw,
        reviewsRaw,
        searchPresenceRaw,
        competitorsRaw,
        servicesRaw,
        socialProfilesRaw
      ] = results

      // Type guard and cast results
      const websiteData = websiteDataRaw as WebsiteData | null
      const googleBusiness = googleBusinessRaw as GBPData | null
      const reviews = Array.isArray(reviewsRaw) ? reviewsRaw as ReviewData[] : []
      const searchPresence = searchPresenceRaw as SearchData | null
      const competitors = Array.isArray(competitorsRaw) ? competitorsRaw as Competitor[] : []
      const services = Array.isArray(servicesRaw) ? servicesRaw as ServiceData[] : []
      const socialProfiles = socialProfilesRaw as SocialProfiles | null

      if (!websiteData) failedSources.push('website-scraping')
      if (!googleBusiness) failedSources.push('google-business')
      if (!reviews || reviews.length === 0) failedSources.push('google-reviews')
      if (!searchPresence) failedSources.push('search-presence')
      if (!competitors || competitors.length === 0) failedSources.push('competitors')
      if (!services || services.length === 0) failedSources.push('services')
      if (!socialProfiles) failedSources.push('social-profiles')

      const partialReport = {
        websiteData: websiteData,
        googleBusiness: googleBusiness,
        reviews: reviews || [],
        searchPresence: searchPresence,
        competitors: competitors || [],
        services: services || [],
        socialProfiles: socialProfiles
      }

      const aiInsights = await synthesizeIntelligence(partialReport)
      if (!aiInsights) failedSources.push('ai-synthesis')

      const duration = Date.now() - startTime
      const successfulSources = 8 - failedSources.length

      const report: IntelligenceReport = {
        ...partialReport,
        aiInsights,
        completedAt: new Date(),
        duration,
        successfulSources,
        failedSources
      }

      const validatedReport = IntelligenceReportSchema.parse(report)
      intelligenceCache.set(cacheKey, validatedReport, 7 * 24 * 60 * 60)

      log('Intelligence Gathering', {
        duration: `${duration}ms`,
        successfulSources,
        failedSources
      }, 'info')

      return validatedReport
    } catch (error) {
      log('Intelligence Gathering', error, 'error')
      throw new Error(`Intelligence gathering failed: ${error}`)
    }
  })
}

export function clearIntelligenceCache(): void {
  intelligenceCache.clear()
  log('Cache', 'Intelligence cache cleared', 'info')
}

export function getRateLimiterStatus(): { remaining: number; max: number } {
  return {
    remaining: rateLimiter.getRemainingRequests(),
    max: 10
  }
}

// Legacy class for backwards compatibility
export class ParallelIntelligenceService {
  async gather(parsedUrl: any): Promise<AggregatedIntelligence> {
    const report = await gatherIntelligence(parsedUrl.normalized || parsedUrl.url)
    return {
      url: parsedUrl.normalized || parsedUrl.url,
      results: [],
      successCount: report.successfulSources,
      totalCount: 8,
      totalDuration: report.duration,
      isViable: report.successfulSources >= 5,
      timestamp: report.completedAt
    }
  }
  clearCache(): void { clearIntelligenceCache() }
}

export const parallelIntelligence = new ParallelIntelligenceService()
