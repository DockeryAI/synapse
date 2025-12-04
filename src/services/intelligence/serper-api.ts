/**
 * Serper API Integration (Google Search)
 * Search insights and trending queries
 *
 * SECURITY: All API calls routed through fetch-serper Edge Function
 * No API keys exposed in browser code
 */

// Supabase Edge Function for secure API access
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

interface SearchResult {
  title: string
  link: string
  snippet: string
  position: number
}

interface NewsResult {
  title: string
  link: string
  snippet: string
  date: string
  source: string
  imageUrl?: string
}

interface TrendData {
  keyword: string
  searchVolume?: number
  relatedQueries: string[]
  timeRange?: string
  trend: 'rising' | 'stable' | 'declining'
  growthPercentage?: number
}

interface PlaceResult {
  name: string
  address: string
  rating?: number
  reviewCount?: number
  phone?: string
  website?: string
  category?: string
  placeId?: string
  _raw?: any  // Keep raw Serper response for debugging
}

interface PlaceReview {
  author: string
  rating: number
  text: string
  date: string
  snippet?: string
}

interface ImageResult {
  title: string
  imageUrl: string
  link: string
  source: string
  thumbnail?: string
}

interface VideoResult {
  title: string
  link: string
  snippet: string
  channel: string
  date: string
  duration?: string
  thumbnail?: string
}

interface ShoppingResult {
  title: string
  link: string
  price: string
  source: string
  rating?: number
  reviewCount?: number
  imageUrl?: string
  inStock?: boolean
}

interface LinkedInProfile {
  name: string
  headline: string
  link: string
  location?: string
  company?: string
  snippet?: string
}

interface LinkedInCompany {
  name: string
  link: string
  description: string
  industry?: string
  size?: string
  location?: string
  followers?: number
  snippet?: string
}

interface LinkedInPost {
  author: string
  authorProfile?: string
  content: string
  link: string
  date?: string
  engagement?: {
    likes?: number
    comments?: number
    shares?: number
  }
  snippet?: string
}

interface LinkedInJob {
  title: string
  company: string
  location: string
  link: string
  description?: string
  posted?: string
  seniority?: string
  employmentType?: string
}

/**
 * Helper to call Serper API via Edge Function
 * @param endpoint - The Serper endpoint (e.g., '/search', '/news', '/places')
 * @param params - The query parameters
 */
async function callSerperEdgeFunction(endpoint: string, params: Record<string, any>): Promise<any> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('[Serper API] Edge Function not configured')
    throw new Error('Serper Edge Function not configured. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-serper`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      endpoint,
      params
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`Serper API error (${response.status}): ${errorData.error || response.statusText}`)
  }

  return response.json()
}

class SerperAPIService {
  async searchGoogle(query: string): Promise<SearchResult[]> {
    // Use Edge Function for secure API access
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn('[Serper API] Edge Function not configured, falling back to empty results')
      return []
    }

    try {
      console.log('[Serper API] Searching via Edge Function:', query)

      const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-serper`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ q: query })  // Serper uses 'q' not 'query'
      })

      if (!response.ok) {
        console.error('[Serper API] Edge Function error:', response.status)
        return []  // Graceful fallback
      }

      const data = await response.json()
      return (data.organic || []).map((result: any, index: number) => ({
        title: result.title || '',
        link: result.link || '',
        snippet: result.snippet || '',
        position: index + 1
      }))
    } catch (error) {
      console.error('[Serper API] Error:', error)
      return []  // Graceful fallback on error
    }
  }

  async getTrendingSearches(): Promise<string[]> {
    // TODO: Implement real trending searches via Serper API
    // Mock implementation for trending searches
    console.warn('[SerperAPI] getTrendingSearches not implemented - returning mock data');
    return [
      { query: 'AI marketing trends', volume: 15000, growth: '+25%' },
      { query: 'Content automation', volume: 8500, growth: '+18%' },
      { query: 'Brand intelligence', volume: 5200, growth: '+12%' }
    ];
  }

  /**
   * Search for competitors in an industry
   */
  async searchCompetitors(query: string, excludeBrand?: string): Promise<string[]> {
    const results = await this.searchGoogle(query)

    // Extract domains from search results
    const domains = results
      .map(result => {
        try {
          const url = new URL(result.link)
          return url.hostname.replace(/^www\./, '')
        } catch {
          return null
        }
      })
      .filter((domain): domain is string => domain !== null)
      .filter(domain => {
        // Exclude common non-competitor domains
        const excluded = ['wikipedia.org', 'youtube.com', 'facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com']
        if (excluded.some(e => domain.includes(e))) return false

        // Exclude the brand's own domain
        if (excludeBrand && domain.toLowerCase().includes(excludeBrand.toLowerCase())) return false

        return true
      })

    // Remove duplicates
    return Array.from(new Set(domains))
  }

  /**
   * Get news articles for a topic with optional location filtering
   */
  async getNews(topic: string, location?: string): Promise<NewsResult[]> {
    try {
      const params: any = { q: topic, num: 50 } // Request 50 news articles
      if (location) {
        params.location = location
      }

      const data = await callSerperEdgeFunction('/news', params)

      return (data.news || []).map((article: any) => ({
        title: article.title || '',
        link: article.link || '',
        snippet: article.snippet || '',
        date: article.date || new Date().toISOString(),
        source: article.source || 'Unknown',
        imageUrl: article.imageUrl
      }))
    } catch (error) {
      console.error('[Serper News API] Error:', error)
      throw error
    }
  }

  /**
   * Get trending data for a keyword with timeRange support
   */
  async getTrends(keyword: string, timeRange?: string): Promise<TrendData> {
    try {
      // Use regular search + autocomplete to infer trends
      const [searchResults, relatedSearches] = await Promise.all([
        this.searchGoogle(keyword),
        this.getAutocomplete(keyword)
      ])

      // Simple trend estimation based on result count and recency
      const hasRecentResults = searchResults.some(r =>
        r.snippet?.toLowerCase().includes('trending') ||
        r.snippet?.toLowerCase().includes('popular')
      )

      return {
        keyword,
        relatedQueries: relatedSearches.slice(0, 5),
        timeRange: timeRange || 'past 30 days',
        trend: hasRecentResults ? 'rising' : 'stable',
        growthPercentage: hasRecentResults ? 25 : 0
      }
    } catch (error) {
      console.error('[Serper Trends] Error:', error)
      throw error
    }
  }

  /**
   * Get autocomplete suggestions for question-based content
   */
  async getAutocomplete(query: string): Promise<string[]> {
    try {
      const data = await callSerperEdgeFunction('/search', {
        q: query,
        autocorrect: true,
        num: 30 // Request more results to get more "People also ask" and related searches
      })

      // Extract "People also ask" and "Related searches"
      const suggestions: string[] = []

      if (data.peopleAlsoAsk) {
        suggestions.push(...data.peopleAlsoAsk.map((item: any) => item.question))
      }

      if (data.relatedSearches) {
        suggestions.push(...data.relatedSearches.map((item: any) => item.query))
      }

      return suggestions.filter(Boolean).slice(0, 30) // Return up to 30 suggestions
    } catch (error) {
      console.error('[Serper Autocomplete] Error:', error)
      return []
    }
  }

  /**
   * Get local business data from Google Places
   */
  async getPlaces(query: string, location: string): Promise<PlaceResult[]> {
    try {
      const data = await callSerperEdgeFunction('/places', {
        q: query,
        location: location
      })

      return (data.places || []).map((place: any) => {
        // Try multiple possible field names for place ID
        const placeId = place.placeId || place.place_id || place.cid || place.data_id || place.dataId

        return {
          name: place.title || place.name || '',
          address: place.address || '',
          rating: place.rating || undefined,
          reviewCount: place.reviews || place.ratingCount || undefined,
          phone: place.phoneNumber || place.phone || undefined,
          website: place.website || undefined,
          category: place.category || place.type || undefined,
          placeId: placeId,
          // Keep raw data for debugging
          _raw: place
        }
      })
    } catch (error) {
      console.error('[Serper Places] Error:', error)
      throw error
    }
  }

  /**
   * Get reviews for a specific place by place_id
   * Fast fallback for when OutScraper doesn't have cached reviews
   */
  async getPlaceReviews(placeId: string): Promise<PlaceReview[]> {
    try {
      console.log('[Serper] Fetching reviews for place_id:', placeId)

      const data = await callSerperEdgeFunction('/places', {
        q: `place_id:${placeId}`
      })

      // Serper returns reviews in the 'reviews' array
      const reviews = data.reviews || []

      console.log('[Serper] Found', reviews.length, 'reviews')

      return reviews.map((review: any) => ({
        author: review.author || review.name || 'Anonymous',
        rating: review.rating || 0,
        text: review.snippet || review.text || '',
        date: review.date || review.publishedAtDate || new Date().toISOString(),
        snippet: review.snippet
      }))
    } catch (error) {
      console.error('[Serper] Error fetching reviews:', error)
      return [] // Return empty array instead of throwing
    }
  }

  /**
   * Get image results for visual content analysis
   */
  async getImages(query: string): Promise<ImageResult[]> {
    try {
      const data = await callSerperEdgeFunction('/images', { q: query })

      return (data.images || []).map((image: any) => ({
        title: image.title || '',
        imageUrl: image.imageUrl || '',
        link: image.link || '',
        source: image.source || '',
        thumbnail: image.thumbnailUrl || image.thumbnail || undefined
      }))
    } catch (error) {
      console.error('[Serper Images] Error:', error)
      throw error
    }
  }

  /**
   * Get video results for video gap analysis
   */
  async getVideos(query: string): Promise<VideoResult[]> {
    try {
      const data = await callSerperEdgeFunction('/videos', { q: query })

      return (data.videos || []).map((video: any) => ({
        title: video.title || '',
        link: video.link || '',
        snippet: video.snippet || video.description || '',
        channel: video.channel || video.source || '',
        date: video.date || new Date().toISOString(),
        duration: video.duration || undefined,
        thumbnail: video.imageUrl || video.thumbnail || undefined
      }))
    } catch (error) {
      console.error('[Serper Videos] Error:', error)
      throw error
    }
  }

  /**
   * Get shopping results for product intelligence
   */
  async getShopping(product: string): Promise<ShoppingResult[]> {
    try {
      const data = await callSerperEdgeFunction('/shopping', { q: product })

      return (data.shopping || []).map((item: any) => ({
        title: item.title || '',
        link: item.link || '',
        price: item.price || 'N/A',
        source: item.source || '',
        rating: item.rating || undefined,
        reviewCount: item.reviews || item.ratingCount || undefined,
        imageUrl: item.imageUrl || item.thumbnail || undefined,
        inStock: item.delivery?.includes('In stock') || undefined
      }))
    } catch (error) {
      console.error('[Serper Shopping] Error:', error)
      throw error
    }
  }
}

export const SerperAPI = new SerperAPIService()
export type {
  SearchResult,
  NewsResult,
  TrendData,
  PlaceResult,
  PlaceReview,
  ImageResult,
  VideoResult,
  ShoppingResult
}
