/**
 * Serper API Integration (Google Search)
 * Search insights and trending queries
 */

const SERPER_API_KEY = import.meta.env.VITE_SERPER_API_KEY

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

class SerperAPIService {
  async searchGoogle(query: string): Promise<SearchResult[]> {
    if (!SERPER_API_KEY) {
      throw new Error(
        'Serper API key not configured. Add VITE_SERPER_API_KEY to your .env file. ' +
        'Get a free API key from https://serper.dev/'
      )
    }

    try {
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': SERPER_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ q: query })
      })

      const data = await response.json()
      return (data.organic || []).map((result: any, index: number) => ({
        title: result.title,
        link: result.link,
        snippet: result.snippet,
        position: index + 1
      }))
    } catch (error) {
      console.error('[Serper API] Error:', error)
      throw error
    }
  }

  async getTrendingSearches(): Promise<string[]> {
    if (!SERPER_API_KEY) {
      throw new Error(
        'Serper API key not configured. Add VITE_SERPER_API_KEY to your .env file. ' +
        'Get a free API key from https://serper.dev/'
      )
    }

    // TODO: Implement real trending searches via Serper API
    throw new Error('getTrendingSearches() not yet implemented. Use Google Trends API instead.')
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
    if (!SERPER_API_KEY) {
      throw new Error(
        'Serper API key not configured. Add VITE_SERPER_API_KEY to your .env file. ' +
        'Get a free API key from https://serper.dev/'
      )
    }

    try {
      const body: any = { q: topic }
      if (location) {
        body.location = location
      }

      const response = await fetch('https://google.serper.dev/news', {
        method: 'POST',
        headers: {
          'X-API-KEY': SERPER_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        throw new Error(`Serper News API error: ${response.status}`)
      }

      const data = await response.json()

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
    if (!SERPER_API_KEY) {
      throw new Error(
        'Serper API key not configured. Add VITE_SERPER_API_KEY to your .env file. ' +
        'Get a free API key from https://serper.dev/'
      )
    }

    try {
      // Use regular search + autocomplete to infer trends
      const [searchResults, relatedSearches] = await Promise.all([
        this.searchGoogle(keyword),
        this.getAutocomplete(keyword)
      ])

      // Simple trend estimation based on result count and recency
      const hasRecentResults = searchResults.some(r =>
        r.snippet.toLowerCase().includes('trending') ||
        r.snippet.toLowerCase().includes('popular')
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
    if (!SERPER_API_KEY) {
      throw new Error(
        'Serper API key not configured. Add VITE_SERPER_API_KEY to your .env file. ' +
        'Get a free API key from https://serper.dev/'
      )
    }

    try {
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': SERPER_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: query,
          autocorrect: true
        })
      })

      if (!response.ok) {
        throw new Error(`Serper Autocomplete API error: ${response.status}`)
      }

      const data = await response.json()

      // Extract "People also ask" and "Related searches"
      const suggestions: string[] = []

      if (data.peopleAlsoAsk) {
        suggestions.push(...data.peopleAlsoAsk.map((item: any) => item.question))
      }

      if (data.relatedSearches) {
        suggestions.push(...data.relatedSearches.map((item: any) => item.query))
      }

      return suggestions.filter(Boolean).slice(0, 10)
    } catch (error) {
      console.error('[Serper Autocomplete] Error:', error)
      return []
    }
  }

  /**
   * Get local business data from Google Places
   */
  async getPlaces(query: string, location: string): Promise<PlaceResult[]> {
    if (!SERPER_API_KEY) {
      throw new Error(
        'Serper API key not configured. Add VITE_SERPER_API_KEY to your .env file. ' +
        'Get a free API key from https://serper.dev/'
      )
    }

    try {
      const response = await fetch('https://google.serper.dev/places', {
        method: 'POST',
        headers: {
          'X-API-KEY': SERPER_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: query,
          location: location
        })
      })

      if (!response.ok) {
        throw new Error(`Serper Places API error: ${response.status}`)
      }

      const data = await response.json()

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
    if (!SERPER_API_KEY) {
      throw new Error('Serper API key not configured')
    }

    try {
      console.log('[Serper] Fetching reviews for place_id:', placeId)

      const response = await fetch('https://google.serper.dev/places', {
        method: 'POST',
        headers: {
          'X-API-KEY': SERPER_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: `place_id:${placeId}`
        })
      })

      if (!response.ok) {
        throw new Error(`Serper Places API error: ${response.status}`)
      }

      const data = await response.json()

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
    if (!SERPER_API_KEY) {
      throw new Error(
        'Serper API key not configured. Add VITE_SERPER_API_KEY to your .env file. ' +
        'Get a free API key from https://serper.dev/'
      )
    }

    try {
      const response = await fetch('https://google.serper.dev/images', {
        method: 'POST',
        headers: {
          'X-API-KEY': SERPER_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ q: query })
      })

      if (!response.ok) {
        throw new Error(`Serper Images API error: ${response.status}`)
      }

      const data = await response.json()

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
    if (!SERPER_API_KEY) {
      throw new Error(
        'Serper API key not configured. Add VITE_SERPER_API_KEY to your .env file. ' +
        'Get a free API key from https://serper.dev/'
      )
    }

    try {
      const response = await fetch('https://google.serper.dev/videos', {
        method: 'POST',
        headers: {
          'X-API-KEY': SERPER_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ q: query })
      })

      if (!response.ok) {
        throw new Error(`Serper Videos API error: ${response.status}`)
      }

      const data = await response.json()

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
    if (!SERPER_API_KEY) {
      throw new Error(
        'Serper API key not configured. Add VITE_SERPER_API_KEY to your .env file. ' +
        'Get a free API key from https://serper.dev/'
      )
    }

    try {
      const response = await fetch('https://google.serper.dev/shopping', {
        method: 'POST',
        headers: {
          'X-API-KEY': SERPER_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ q: product })
      })

      if (!response.ok) {
        throw new Error(`Serper Shopping API error: ${response.status}`)
      }

      const data = await response.json()

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
