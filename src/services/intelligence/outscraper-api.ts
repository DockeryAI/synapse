/**
 * OutScraper API Integration
 * Real Google Maps business data and review scraping
 * API Docs: https://outscraper.com/api-docs/
 */

import { SerperAPI } from './serper-api'
import { ApifyAPI } from './apify-api'

const OUTSCRAPER_API_KEY = import.meta.env.VITE_OUTSCRAPER_API_KEY
const OUTSCRAPER_API_URL = 'https://api.app.outscraper.com'

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface BusinessListing {
  place_id: string
  name: string
  address: string
  phone?: string
  website?: string
  category: string[]
  rating: number
  reviews_count: number
  price_level?: number
  hours?: OpeningHours
  photos?: string[]
  verified: boolean
  claimed?: boolean
  latitude?: number
  longitude?: number
}

export interface OpeningHours {
  monday?: string
  tuesday?: string
  wednesday?: string
  thursday?: string
  friday?: string
  saturday?: string
  sunday?: string
}

export interface GoogleReview {
  author_name: string
  author_photo?: string
  rating: number
  text: string
  time: string  // ISO date string
  language?: string
  likes?: number
  author_reviews_count?: number
  response?: {
    text: string
    time: string
  }
}

export interface BusinessProfile extends BusinessListing {
  description?: string
  services?: string[]
  attributes?: Record<string, boolean>
  popular_times?: PopularTime[]
  reviews_per_rating?: Record<string, number>
  reviews_tags?: string[]
}

export interface PopularTime {
  day: string
  hours: { hour: number; popularity: number }[]
}

export interface EnrichedCompetitor extends BusinessListing {
  distance_from_brand?: number
  relative_strength?: 'stronger' | 'similar' | 'weaker'
  competitive_advantages?: string[]
  shared_keywords?: string[]
  overlapping_services?: string[]
}

export interface SentimentAnalysis {
  overall_sentiment: number  // 0-1
  positive_count: number
  negative_count: number
  neutral_count: number
  themes: {
    theme: string
    sentiment: number
    mention_count: number
  }[]
  common_phrases: string[]
}

export interface LocalRankingData {
  keyword: string
  position?: number
  map_pack_position?: number
  organic_position?: number
  competitors_above: string[]
}

// ============================================================================
// LinkedIn Types & Interfaces
// ============================================================================

export interface LinkedInProfile {
  name: string
  headline: string
  profileUrl: string
  location?: string
  company?: string
  position?: string
  connections?: number
  followers?: number
  about?: string
  experience?: Array<{
    title: string
    company: string
    duration?: string
  }>
  education?: Array<{
    school: string
    degree?: string
  }>
}

export interface LinkedInCompany {
  name: string
  profileUrl: string
  description: string
  industry?: string
  companySize?: string
  location?: string
  followers?: number
  employees?: number
  website?: string
  specialties?: string[]
}

export interface LinkedInPost {
  author: string
  authorProfile?: string
  authorHeadline?: string
  content: string
  postUrl: string
  publishedAt?: string
  engagement?: {
    likes?: number
    comments?: number
    shares?: number
  }
  hashtags?: string[]
  media?: {
    type: 'image' | 'video' | 'document' | 'poll'
    url?: string
  }[]
}

// ============================================================================
// OutScraper API Service
// ============================================================================

class OutScraperAPIService {
  private baseUrl = OUTSCRAPER_API_URL

  /**
   * Poll an async task until completion
   */
  private async pollTask<T>(taskId: string, maxAttempts = 30, delayMs = 2000): Promise<T> {
    console.log('[OutScraper] Polling task:', taskId)

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/tasks/${taskId}`, {
          headers: {
            'X-API-KEY': OUTSCRAPER_API_KEY || ''
          }
        })

        if (!response.ok) {
          throw new Error(`Task polling failed: ${response.status}`)
        }

        const data = await response.json()

        console.log('[OutScraper] Task status:', data.status, `(attempt ${attempt + 1}/${maxAttempts})`)

        if (data.status === 'Success' || data.status === 'completed') {
          console.log('[OutScraper] ✅ Task completed')
          return data.data as T
        }

        if (data.status === 'Failed' || data.status === 'Error') {
          throw new Error(`Task failed: ${data.error || 'Unknown error'}`)
        }

        // Still pending, wait before next poll
        await new Promise(resolve => setTimeout(resolve, delayMs))
      } catch (error) {
        console.error('[OutScraper] Polling error:', error)
        throw error
      }
    }

    throw new Error(`Task timeout after ${maxAttempts} attempts`)
  }

  /**
   * Check if API key is configured
   */
  private checkApiKey(): void {
    if (!OUTSCRAPER_API_KEY) {
      throw new Error(
        'OutScraper API key not configured.\n' +
        'Add VITE_OUTSCRAPER_API_KEY to your .env file.\n' +
        'Get a free API key from: https://outscraper.com/\n' +
        'Required for: Competitor discovery and review analysis'
      )
    }
  }

  /**
   * Make API request with error handling
   */
  private async makeRequest<T>(endpoint: string, params: Record<string, any>): Promise<T> {
    this.checkApiKey()

    const url = new URL(`${this.baseUrl}${endpoint}`)
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'X-API-KEY': OUTSCRAPER_API_KEY!,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(
          `OutScraper API error (${response.status}): ${errorText}\n` +
          `Endpoint: ${endpoint}\n` +
          `Check your API key and quota at: https://outscraper.com/dashboard/`
        )
      }

      const data = await response.json()
      return data as T
    } catch (error) {
      if (error instanceof Error) {
        console.error('[OutScraper API] Request failed:', error.message)
        throw error
      }
      throw new Error(`OutScraper API request failed: ${String(error)}`)
    }
  }

  /**
   * 1. Get business listings from Google Maps
   * API Docs: https://outscraper.com/google-maps-scraper-api/
   */
  async getBusinessListings(params: {
    query: string
    location?: string
    limit?: number
    language?: string
    region?: string
  }): Promise<BusinessListing[]> {
    console.log('[OutScraper] Fetching business listings:', params.query)
    console.log('[OutScraper] API Key present:', !!OUTSCRAPER_API_KEY)

    const endpoint = '/maps/search-v2'
    const apiParams = {
      query: params.location ? `${params.query} near ${params.location}` : params.query,
      limit: params.limit || 20,
      language: params.language || 'en',
      region: params.region || 'US',
      async: false, // Force synchronous mode - get results immediately, don't queue
      fields: 'place_id,name,full_address,phone,site,category,rating,reviews,price_level,working_hours,photos_count,verified,claimed,latitude,longitude'
    }

    console.log('[OutScraper] Request params:', apiParams)

    try {
      const response = await this.makeRequest<any>(endpoint, apiParams)

      console.log('[OutScraper] Raw response:', response)

      // Check if request is pending (async mode)
      if (response.status === 'Pending') {
        console.warn('[OutScraper] Request is async/pending. Results not immediately available.')
        console.warn('[OutScraper] OutScraper queued the request. Would need to poll:', response.results_location)
        console.warn('[OutScraper] Using synchronous mode would be better for real-time results.')
        return [] // Return empty for now
      }

      // OutScraper returns array of arrays (batch results)
      const results = response.data?.[0] || []
      console.log('[OutScraper] Extracted results array:', results)

      const listings: BusinessListing[] = results.map((item: any) => ({
        place_id: item.place_id || item.google_id || '',
        name: item.name || '',
        address: item.full_address || item.address || '',
        phone: item.phone,
        website: item.site || item.website,
        category: Array.isArray(item.category) ? item.category : [item.category || 'Business'],
        rating: parseFloat(item.rating) || 0,
        reviews_count: parseInt(item.reviews) || 0,
        price_level: item.price_level,
        verified: item.verified === true || item.verified === 'true',
        claimed: item.claimed === true || item.claimed === 'true',
        latitude: item.latitude,
        longitude: item.longitude,
      }))

      console.log('[OutScraper] Found', listings.length, 'business listings')
      return listings
    } catch (error) {
      console.error('[OutScraper] getBusinessListings failed:', error)
      console.error('[OutScraper] Error details:', error instanceof Error ? error.message : error)
      throw error
    }
  }

  /**
   * 2. Scrape Google reviews for a business
   * API Docs: https://outscraper.com/google-reviews-scraper-api/
   *
   * INTELLIGENT FALLBACK:
   * 1. Try dedicated reviews endpoint (cached data)
   * 2. If empty, try Maps Search endpoint (includes reviews with business data)
   * 3. Return whatever real data we find
   */
  async scrapeGoogleReviews(params: {
    place_id: string
    business_name?: string // Used for Maps Search fallback
    industry?: string // Used to make Maps Search more specific
    location?: string // Used to make Maps Search more specific
    limit?: number
    sort?: 'newest' | 'highest' | 'lowest'
    cutoff_date?: string
  }): Promise<GoogleReview[]> {
    console.log('[OutScraper] Scraping reviews for:', params.business_name || params.place_id)

    const limit = params.limit || 100

    // ATTEMPT 1: Try with place_id if provided
    if (params.place_id) {
      try {
        console.log('[OutScraper] ATTEMPT 1: Trying place_id:', params.place_id)
        const endpoint = '/maps/reviews-v2'
        const apiParams = {
          query: params.place_id,
          reviewsLimit: limit,
          sort: params.sort || 'newest',
          cutoff: params.cutoff_date,
          language: 'en',
          async: true, // Use async polling pattern
        }

        console.log('[OutScraper] Request params:', apiParams)
        const response = await this.makeRequest<any>(endpoint, apiParams)
        console.log('[OutScraper] Response status:', response.status)

        // If async response, poll for results
        let results
        if (response.id) {
          console.log('[OutScraper] Task queued, polling for results...', response.id)
          const taskData = await this.pollTask<any[]>(response.id)
          results = taskData?.[0] || []
        } else {
          results = response.data?.[0] || []
        }

        // Debug: Log what we got back
        if (results) {
          console.log('[OutScraper] Results keys:', Object.keys(results))
          console.log('[OutScraper] Business name from results:', results.name || results.business_name || 'not found')
        }

        const reviewsData = results.reviews_data || results.reviews || []

        console.log('[OutScraper] Reviews found via place_id:', reviewsData.length)

        if (reviewsData.length > 0) {
          const reviews: GoogleReview[] = reviewsData.map((review: any) => ({
            author_name: review.author_title || review.author_name || 'Anonymous',
            author_photo: review.author_image || review.author_photo,
            rating: parseInt(review.review_rating) || parseInt(review.rating) || 0,
            text: review.review_text || review.text || '',
            time: review.review_datetime_utc || review.time || new Date().toISOString(),
            language: review.review_language || review.language,
            likes: parseInt(review.review_likes) || 0,
            author_reviews_count: parseInt(review.reviews_count) || 0,
            response: review.owner_answer ? {
              text: review.owner_answer,
              time: review.owner_answer_timestamp || '',
            } : undefined,
          }))

          console.log('[OutScraper] ✅ Found', reviews.length, 'reviews via place_id')
          return reviews
        } else {
          console.warn('[OutScraper] place_id returned 0 reviews, trying name search...')
        }
      } catch (error) {
        console.warn('[OutScraper] place_id lookup failed:', error)
      }
    }

    // ATTEMPT 2: Try with business name + location
    if (params.business_name && params.location) {
      try {
        console.log('[OutScraper] ATTEMPT 2: Trying business name + location search...')
        const endpoint = '/maps/reviews-v2'
        const query = params.industry
          ? `${params.business_name} ${params.industry} ${params.location}`
          : `${params.business_name} ${params.location}`

        console.log('[OutScraper] Search query:', query)

        const apiParams = {
          query: query,
          reviewsLimit: limit,
          sort: params.sort || 'newest',
          cutoff: params.cutoff_date,
          language: 'en',
          async: true, // Use async polling pattern
        }

        console.log('[OutScraper] Request params:', apiParams)
        const response = await this.makeRequest<any>(endpoint, apiParams)
        console.log('[OutScraper] Response status:', response.status)

        // If async response, poll for results
        let results
        if (response.id) {
          console.log('[OutScraper] Task queued, polling for results...', response.id)
          const taskData = await this.pollTask<any[]>(response.id)
          results = taskData?.[0] || []
        } else {
          results = response.data?.[0] || []
        }

        // Debug: Log what we got back
        if (results) {
          console.log('[OutScraper] Results keys:', Object.keys(results))
          console.log('[OutScraper] Business name from results:', results.name || results.business_name || 'not found')
        }

        const reviewsData = results.reviews_data || results.reviews || []

        console.log('[OutScraper] Reviews found via name search:', reviewsData.length)

        if (reviewsData.length > 0) {
          const reviews: GoogleReview[] = reviewsData.map((review: any) => ({
            author_name: review.author_title || review.author_name || 'Anonymous',
            author_photo: review.author_image || review.author_photo,
            rating: parseInt(review.review_rating) || parseInt(review.rating) || 0,
            text: review.review_text || review.text || '',
            time: review.review_datetime_utc || review.time || new Date().toISOString(),
            language: review.review_language || review.language,
            likes: parseInt(review.review_likes) || 0,
            author_reviews_count: parseInt(review.reviews_count) || 0,
            response: review.owner_answer ? {
              text: review.owner_answer,
              time: review.owner_answer_timestamp || '',
            } : undefined,
          }))

          console.log('[OutScraper] ✅ Found', reviews.length, 'reviews via name search')
          return reviews
        } else {
          console.warn('[OutScraper] Name search returned 0 reviews')
        }
      } catch (error) {
        console.warn('[OutScraper] Name search failed:', error)
      }
    }

    // ATTEMPT 3: Fallback to Apify Google Maps Scraper
    console.warn('[OutScraper] ⚠️ No reviews found via OutScraper')
    console.log('[OutScraper] Trying Apify Google Maps fallback...')

    return await this.fallbackToApify(
      params.place_id,
      params.business_name,
      params.location,
      limit
    )
  }

  /**
   * Fallback to Apify Google Maps Scraper for reviews
   * More reliable than Serper as it actually returns review text
   */
  private async fallbackToApify(
    placeId: string | undefined,
    businessName: string | undefined,
    location: string | undefined,
    limit: number
  ): Promise<GoogleReview[]> {
    try {
      console.log('[OutScraper → Apify] Starting fallback to Apify Google Maps Scraper')

      // Check if we have enough info for Apify query
      if (!placeId && (!businessName || !location)) {
        console.warn('[OutScraper → Apify] Cannot fallback - missing placeId and business_name+location')
        console.warn('[OutScraper → Apify] Received:', { placeId, businessName, location })
        return []
      }

      // Build search query
      let searchQuery: string | undefined = undefined
      if (businessName && location) {
        searchQuery = `${businessName} ${location}`
        console.log(`[OutScraper → Apify] Searching with query: "${searchQuery}"`)
      }

      // Call Apify Google Maps Scraper
      const apifyPlaces = await ApifyAPI.scrapeGoogleMapsReviews({
        placeId,
        searchQuery,
        location,
        maxReviews: limit
      })

      if (apifyPlaces.length === 0) {
        console.warn('[OutScraper → Apify] No places found')
        return []
      }

      const place = apifyPlaces[0]
      const reviews = place.reviews || []

      if (reviews.length === 0) {
        console.warn('[OutScraper → Apify] Place found but no reviews available')
        return []
      }

      console.log(`[OutScraper → Apify] ✅ Found ${reviews.length} reviews from Apify`)

      // Convert Apify reviews to GoogleReview format
      const googleReviews: GoogleReview[] = reviews.map(review => ({
        author_name: review.name,
        author_photo: review.reviewerPhotoUrl,
        rating: review.stars,
        text: review.text,
        time: review.publishedAtDate,
        language: undefined,
        likes: review.likesCount,
        author_reviews_count: undefined,
        response: undefined,
      }))

      return googleReviews

    } catch (error) {
      console.error('[OutScraper → Apify] Fallback failed:', error)
      return []
    }
  }

  /**
   * 3. Get detailed business profile
   */
  async getBusinessDetails(place_id: string): Promise<BusinessProfile> {
    console.log('[OutScraper] Fetching business details for:', place_id)

    // Use the maps search with place_id to get full details
    const endpoint = '/maps/search-v2'
    const apiParams = {
      query: place_id,
      limit: 1,
      language: 'en',
    }

    try {
      const response = await this.makeRequest<any>(endpoint, apiParams)
      const results = response.data?.[0] || []
      const item = results[0]

      if (!item) {
        throw new Error(`No business found with place_id: ${place_id}`)
      }

      const profile: BusinessProfile = {
        place_id: item.place_id || item.google_id || '',
        name: item.name || '',
        address: item.full_address || item.address || '',
        phone: item.phone,
        website: item.site || item.website,
        category: Array.isArray(item.category) ? item.category : [item.category || 'Business'],
        rating: parseFloat(item.rating) || 0,
        reviews_count: parseInt(item.reviews) || 0,
        price_level: item.price_level,
        verified: item.verified === true,
        claimed: item.claimed === true,
        latitude: item.latitude,
        longitude: item.longitude,
        description: item.description || item.about,
        services: item.services || [],
        attributes: item.attributes || {},
      }

      console.log('[OutScraper] Retrieved business profile for:', profile.name)
      return profile
    } catch (error) {
      console.error('[OutScraper] getBusinessDetails failed:', error)
      throw error
    }
  }

  /**
   * 4. Discover competitors with enrichment
   */
  async discoverCompetitors(params: {
    businessName: string
    location: string
    industry: string
    radius?: number
  }): Promise<EnrichedCompetitor[]> {
    console.log('[OutScraper] Discovering competitors for:', params.businessName)

    // Search for competitors in the same industry
    const query = `${params.industry} near ${params.location}`
    const listings = await this.getBusinessListings({
      query,
      location: params.location,
      limit: 20,
    })

    // Filter out the brand itself
    const competitors = listings.filter(
      listing => !listing.name.toLowerCase().includes(params.businessName.toLowerCase())
    )

    // Enrich with basic competitive analysis
    const enriched: EnrichedCompetitor[] = competitors.map(competitor => ({
      ...competitor,
      relative_strength: this.assessRelativeStrength(competitor),
      competitive_advantages: this.identifyAdvantages(competitor),
    }))

    console.log('[OutScraper] Found', enriched.length, 'competitors')
    return enriched
  }

  /**
   * 5. Analyze review sentiment
   */
  async analyzeReviewSentiment(reviews: GoogleReview[]): Promise<SentimentAnalysis> {
    console.log('[OutScraper] Analyzing sentiment for', reviews.length, 'reviews')

    const positive = reviews.filter(r => r.rating >= 4).length
    const negative = reviews.filter(r => r.rating <= 2).length
    const neutral = reviews.filter(r => r.rating === 3).length

    const totalSentiment = reviews.reduce((sum, r) => sum + (r.rating / 5), 0) / reviews.length

    // Extract common phrases (simplified - in production, use NLP)
    const allText = reviews.map(r => r.text.toLowerCase()).join(' ')
    const phrases = this.extractCommonPhrases(allText)

    return {
      overall_sentiment: totalSentiment,
      positive_count: positive,
      negative_count: negative,
      neutral_count: neutral,
      themes: this.extractThemes(reviews),
      common_phrases: phrases,
    }
  }

  /**
   * 6. Get local search rankings
   */
  async getLocalSearchRankings(params: {
    keywords: string[]
    location: string
    businessName: string
  }): Promise<LocalRankingData[]> {
    console.log('[OutScraper] Checking local rankings for:', params.businessName)

    const rankings: LocalRankingData[] = []

    for (const keyword of params.keywords) {
      const listings = await this.getBusinessListings({
        query: keyword,
        location: params.location,
        limit: 10,
      })

      const position = listings.findIndex(
        listing => listing.name.toLowerCase().includes(params.businessName.toLowerCase())
      )

      rankings.push({
        keyword,
        position: position >= 0 ? position + 1 : undefined,
        map_pack_position: position >= 0 && position < 3 ? position + 1 : undefined,
        organic_position: position >= 3 ? position - 2 : undefined,
        competitors_above: listings.slice(0, position > 0 ? position : 0).map(l => l.name),
      })
    }

    return rankings
  }

  // ============================================================================
  // LinkedIn Intelligence Methods
  // ============================================================================

  /**
   * 7. Search LinkedIn profiles
   * API Docs: https://outscraper.com/linkedin-profile-scraper/
   */
  async getLinkedInProfiles(query: string, limit: number = 20): Promise<LinkedInProfile[]> {
    console.log('[OutScraper] Searching LinkedIn profiles:', query)

    const endpoint = '/linkedin/profiles'
    const apiParams = {
      query,
      limit,
      async: false, // Force synchronous mode
    }

    try {
      const response = await this.makeRequest<any>(endpoint, apiParams)

      // OutScraper returns different formats - handle both
      let results = response.data?.[0] || response.data || []

      // If results is not an array, wrap it
      if (!Array.isArray(results)) {
        console.log('[OutScraper] Response is not an array, wrapping:', typeof results)
        results = results ? [results] : []
      }

      const profiles: LinkedInProfile[] = results.map((item: any) => ({
        name: item.name || item.full_name || '',
        headline: item.headline || item.title || '',
        profileUrl: item.profile_url || item.url || '',
        location: item.location || item.geo || undefined,
        company: item.company || item.current_company || undefined,
        position: item.position || item.current_position || undefined,
        connections: item.connections ? parseInt(item.connections) : undefined,
        followers: item.followers ? parseInt(item.followers) : undefined,
        about: item.about || item.summary || undefined,
        experience: item.experience || [],
        education: item.education || [],
      }))

      console.log('[OutScraper] Found', profiles.length, 'LinkedIn profiles')
      return profiles
    } catch (error) {
      console.error('[OutScraper] getLinkedInProfiles failed:', error)
      return [] // Return empty array instead of throwing
    }
  }

  /**
   * 8. Search LinkedIn companies
   * API Docs: https://outscraper.com/linkedin-company-scraper/
   */
  async getLinkedInCompanies(query: string, limit: number = 20): Promise<LinkedInCompany[]> {
    console.log('[OutScraper] Searching LinkedIn companies:', query)

    const endpoint = '/linkedin/companies'
    const apiParams = {
      query,
      limit,
      async: false, // Force synchronous mode
    }

    try {
      const response = await this.makeRequest<any>(endpoint, apiParams)

      // OutScraper returns different formats - handle both
      let results = response.data?.[0] || response.data || []

      // If results is not an array, wrap it
      if (!Array.isArray(results)) {
        console.log('[OutScraper] Response is not an array, wrapping:', typeof results)
        results = results ? [results] : []
      }

      const companies: LinkedInCompany[] = results.map((item: any) => ({
        name: item.name || item.company_name || '',
        profileUrl: item.profile_url || item.url || '',
        description: item.description || item.about || '',
        industry: item.industry || undefined,
        companySize: item.company_size || item.size || undefined,
        location: item.location || item.headquarters || undefined,
        followers: item.followers ? parseInt(item.followers) : undefined,
        employees: item.employees ? parseInt(item.employees) : undefined,
        website: item.website || undefined,
        specialties: item.specialties || [],
      }))

      console.log('[OutScraper] Found', companies.length, 'LinkedIn companies')
      return companies
    } catch (error) {
      console.error('[OutScraper] getLinkedInCompanies failed:', error)
      return [] // Return empty array instead of throwing
    }
  }

  /**
   * 9. Search LinkedIn posts
   * API Docs: https://outscraper.com/linkedin-posts-scraper/
   */
  async getLinkedInPosts(query: string, limit: number = 20): Promise<LinkedInPost[]> {
    console.log('[OutScraper] Searching LinkedIn posts:', query)

    const endpoint = '/linkedin/posts'
    const apiParams = {
      query,
      limit,
      async: false, // Force synchronous mode
    }

    try {
      const response = await this.makeRequest<any>(endpoint, apiParams)

      // OutScraper returns different formats - handle both
      let results = response.data?.[0] || response.data || []

      // If results is not an array, wrap it
      if (!Array.isArray(results)) {
        console.log('[OutScraper] Response is not an array, wrapping:', typeof results)
        results = results ? [results] : []
      }

      const posts: LinkedInPost[] = results.map((item: any) => ({
        author: item.author || item.author_name || '',
        authorProfile: item.author_profile || item.author_url || undefined,
        authorHeadline: item.author_headline || item.author_title || undefined,
        content: item.content || item.text || item.post_text || '',
        postUrl: item.post_url || item.url || '',
        publishedAt: item.published_at || item.date || item.timestamp || undefined,
        engagement: {
          likes: item.likes ? parseInt(item.likes) : undefined,
          comments: item.comments ? parseInt(item.comments) : undefined,
          shares: item.shares ? parseInt(item.shares) : undefined,
        },
        hashtags: item.hashtags || [],
        media: item.media || [],
      }))

      console.log('[OutScraper] Found', posts.length, 'LinkedIn posts')
      return posts
    } catch (error) {
      console.error('[OutScraper] getLinkedInPosts failed:', error)
      return [] // Return empty array instead of throwing
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private assessRelativeStrength(competitor: BusinessListing): 'stronger' | 'similar' | 'weaker' {
    if (competitor.rating >= 4.5 && competitor.reviews_count > 100) return 'stronger'
    if (competitor.rating >= 4.0 && competitor.reviews_count > 50) return 'similar'
    return 'weaker'
  }

  private identifyAdvantages(competitor: BusinessListing): string[] {
    const advantages: string[] = []

    if (competitor.rating >= 4.7) advantages.push('Excellent ratings')
    if (competitor.reviews_count > 200) advantages.push('High review volume')
    if (competitor.verified) advantages.push('Verified business')
    if (competitor.claimed) advantages.push('Claimed listing')
    if (competitor.photos && competitor.photos.length > 10) advantages.push('Strong visual presence')

    return advantages
  }

  private extractCommonPhrases(text: string): string[] {
    // Simplified phrase extraction - in production, use proper NLP
    const words = text.split(/\s+/).filter(w => w.length > 3)
    const frequency: Record<string, number> = {}

    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1
    })

    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word)
  }

  private extractThemes(reviews: GoogleReview[]): { theme: string; sentiment: number; mention_count: number }[] {
    // Simplified theme extraction
    const themes = [
      { keyword: 'service', theme: 'Service Quality' },
      { keyword: 'price', theme: 'Pricing' },
      { keyword: 'staff', theme: 'Staff' },
      { keyword: 'professional', theme: 'Professionalism' },
      { keyword: 'quick', theme: 'Speed' },
      { keyword: 'recommend', theme: 'Recommendation' },
    ]

    return themes.map(({ keyword, theme }) => {
      const mentions = reviews.filter(r => r.text.toLowerCase().includes(keyword))
      const avgSentiment = mentions.length > 0
        ? mentions.reduce((sum, r) => sum + r.rating, 0) / mentions.length / 5
        : 0

      return {
        theme,
        sentiment: avgSentiment,
        mention_count: mentions.length,
      }
    }).filter(t => t.mention_count > 0)
  }
}

export const OutScraperAPI = new OutScraperAPIService()
