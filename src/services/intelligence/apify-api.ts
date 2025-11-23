/**
 * Apify API Integration
 * Web scraping and automation using Apify Actors
 * SECURITY: Uses Edge Function to keep API keys server-side
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// Apify Actor IDs (official actors from Apify Store)
const ACTORS = {
  WEBSITE_CONTENT: 'apify/website-content-crawler',
  GOOGLE_MAPS: 'nwua9Gu5YrADL7ZDj', // Google Maps Scraper
  INSTAGRAM: 'apify/instagram-scraper'
}

interface WebsiteContent {
  url: string
  title: string
  description: string
  text: string
  headings: string[]
  links: string[]
  metadata: {
    author?: string
    keywords?: string[]
    ogTitle?: string
    ogDescription?: string
  }
}

interface GoogleMapsReview {
  name: string
  text: string
  stars: number
  publishedAtDate: string
  likesCount?: number
  reviewId?: string
  reviewUrl?: string
  reviewerId?: string
  reviewerName?: string
  reviewerPhotoUrl?: string
}

interface GoogleMapsPlace {
  placeId: string
  name: string
  address: string
  rating: number
  reviewsCount: number
  phone?: string
  website?: string
  category?: string
  reviews?: GoogleMapsReview[]
}

interface InstagramProfile {
  username: string
  fullName: string
  biography: string
  followersCount: number
  followsCount: number
  postsCount: number
  isVerified: boolean
  url: string
  posts: Array<{
    url: string
    caption: string
    likesCount: number
    commentsCount: number
    timestamp: string
  }>
}

class ApifyAPIService {
  /**
   * Run an Apify Actor and wait for results via Edge Function
   */
  private async runActor(actorId: string, input: any, timeout: number = 45): Promise<any> {
    if (!SUPABASE_URL) {
      throw new Error(
        'Supabase URL not configured. Add VITE_SUPABASE_URL to your .env file.'
      )
    }

    try {
      console.log(`[Apify] Starting actor ${actorId} via Edge Function...`)

      // Call Edge Function to run actor (avoids CORS)
      const response = await fetch(`${SUPABASE_URL}/functions/v1/apify-scraper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          actorId,
          input
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Apify Edge Function error (${response.status}): ${errorText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Unknown error from Apify Edge Function')
      }

      console.log(`[Apify] Actor completed successfully via Edge Function, ${result.data.length} results`)
      return result.data

    } catch (error) {
      console.error('[Apify] Actor run error:', error)
      throw error
    }
  }

  /**
   * Scrape website content using Apify Website Content Crawler
   * More comprehensive than simple fetch - extracts structured content
   */
  async scrapeWebsiteContent(url: string): Promise<WebsiteContent> {
    try {
      console.log('[Apify] Scraping website content:', url)

      const results = await this.runActor(ACTORS.WEBSITE_CONTENT, {
        startUrls: [{ url }],
        maxCrawlPages: 1,
        crawlerType: 'cheerio'
      })

      if (!results || results.length === 0) {
        throw new Error('No content extracted from website')
      }

      const page = results[0]

      return {
        url: page.url || url,
        title: page.title || '',
        description: page.description || page.metadata?.description || '',
        text: page.text || '',
        headings: page.headings || [],
        links: page.links || [],
        metadata: {
          author: page.metadata?.author,
          keywords: page.metadata?.keywords,
          ogTitle: page.metadata?.og?.title,
          ogDescription: page.metadata?.og?.description
        }
      }

    } catch (error) {
      console.error('[Apify] Website scraping error:', error)
      throw error
    }
  }

  /**
   * Scrape Google Maps reviews using Apify Google Maps Scraper
   */
  async scrapeGoogleMapsReviews(options: {
    placeId?: string
    searchQuery?: string
    location?: string
    maxReviews?: number
  }): Promise<GoogleMapsPlace[]> {
    try {
      console.log('[Apify] Scraping Google Maps reviews:', options)

      const input: any = {
        maxReviews: options.maxReviews || 50,
        reviewsSort: 'newest',
        language: 'en'
      }

      if (options.placeId) {
        input.searchStringsArray = [`https://www.google.com/maps/place/?q=place_id:${options.placeId}`]
      } else if (options.searchQuery && options.location) {
        input.searchStringsArray = [`${options.searchQuery} ${options.location}`]
      } else if (options.searchQuery) {
        input.searchStringsArray = [options.searchQuery]
      } else {
        throw new Error('Either placeId or searchQuery must be provided')
      }

      const results = await this.runActor(ACTORS.GOOGLE_MAPS, input, 60) // 1 min timeout

      return results.map((place: any) => ({
        placeId: place.placeId || '',
        name: place.title || place.name || '',
        address: place.address || '',
        rating: place.totalScore || place.rating || 0,
        reviewsCount: place.reviewsCount || 0,
        phone: place.phone,
        website: place.website,
        category: place.categoryName || place.category,
        reviews: (place.reviews || []).map((review: any) => ({
          name: review.name || review.reviewerName || '',
          text: review.text || '',
          stars: review.stars || 0,
          publishedAtDate: review.publishedAtDate || review.publishAt || '',
          likesCount: review.likesCount || 0,
          reviewId: review.reviewId,
          reviewUrl: review.reviewUrl,
          reviewerId: review.reviewerId,
          reviewerName: review.reviewerName,
          reviewerPhotoUrl: review.reviewerPhotoUrl
        }))
      }))

    } catch (error) {
      console.error('[Apify] Google Maps scraping error:', error)
      throw error
    }
  }

  /**
   * Scrape basic Instagram profile data using Apify Instagram Scraper
   * Note: Instagram scraping is limited due to platform restrictions
   */
  async scrapeInstagramBasic(username: string, maxPosts: number = 12): Promise<InstagramProfile | null> {
    try {
      console.log('[Apify] Scraping Instagram profile:', username)

      const results = await this.runActor(ACTORS.INSTAGRAM, {
        directUrls: [`https://www.instagram.com/${username}/`],
        resultsType: 'posts',
        resultsLimit: maxPosts,
        searchType: 'user',
        searchLimit: 1
      }, 180) // 3 min timeout

      if (!results || results.length === 0) {
        console.warn('[Apify] No Instagram data found for:', username)
        return null
      }

      const profile = results[0]

      return {
        username: profile.ownerUsername || username,
        fullName: profile.ownerFullName || '',
        biography: profile.caption || '',
        followersCount: profile.followersCount || 0,
        followsCount: profile.followsCount || 0,
        postsCount: profile.postsCount || 0,
        isVerified: profile.isVerified || false,
        url: profile.url || `https://www.instagram.com/${username}/`,
        posts: results.slice(0, maxPosts).map((post: any) => ({
          url: post.url || '',
          caption: post.caption || '',
          likesCount: post.likesCount || 0,
          commentsCount: post.commentsCount || 0,
          timestamp: post.timestamp || new Date().toISOString()
        }))
      }

    } catch (error) {
      console.error('[Apify] Instagram scraping error:', error)
      // Don't throw - Instagram scraping is optional and may fail
      return null
    }
  }

  /**
   * Legacy method - redirects to scrapeWebsiteContent
   * @deprecated Use scrapeWebsiteContent instead
   */
  async scrapeWebsite(url: string): Promise<WebsiteContent> {
    return this.scrapeWebsiteContent(url)
  }

  /**
   * Legacy method - redirects to scrapeInstagramBasic
   * @deprecated Use scrapeInstagramBasic instead
   */
  async scrapeInstagram(handle: string): Promise<InstagramProfile | null> {
    return this.scrapeInstagramBasic(handle)
  }
}

export const ApifyAPI = new ApifyAPIService()
export type { WebsiteContent, GoogleMapsPlace, GoogleMapsReview, InstagramProfile }
