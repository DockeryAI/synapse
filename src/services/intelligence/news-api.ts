/**
 * News API Integration
 * Fetches industry news and local events for opportunity detection
 */

const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

interface NewsArticle {
  title: string
  description: string
  url: string
  publishedAt: string
  source: string
  author?: string
  content?: string
  relevanceScore: number
}

class NewsAPIService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map()

  private getCached(key: string): any | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data
    this.cache.delete(key)
    return null
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  /**
   * Generate broader search terms from specific industry names
   * Examples: "HVAC Services" -> ["HVAC", "heating", "cooling", "air conditioning", "small business"]
   */
  private generateBroaderSearchTerms(industry: string, keywords: string[]): string[] {
    const broaderTerms = new Set<string>()

    // Always include the original terms
    keywords.forEach(k => broaderTerms.add(k))

    // Extract individual words from industry name (skip common words)
    const stopWords = ['services', 'solutions', 'inc', 'llc', 'corp', 'company', 'the', 'and', 'or']
    const words = industry.toLowerCase().split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.includes(w))

    words.forEach(w => broaderTerms.add(w))

    // Add broader business/industry themes
    broaderTerms.add('small business')
    broaderTerms.add('local business')
    broaderTerms.add('business trends')

    // Industry-specific broader terms
    const industryMap: Record<string, string[]> = {
      'hvac': ['energy efficiency', 'home improvement', 'climate control'],
      'plumbing': ['home repair', 'water systems', 'home services'],
      'electrical': ['home improvement', 'smart home', 'energy'],
      'restaurant': ['food industry', 'hospitality', 'dining'],
      'retail': ['e-commerce', 'shopping', 'consumer trends'],
      'fitness': ['health', 'wellness', 'exercise'],
      'salon': ['beauty', 'wellness', 'personal care'],
      'dental': ['healthcare', 'oral health', 'medical'],
      'legal': ['law', 'attorney', 'legal services'],
      'accounting': ['finance', 'tax', 'business services']
    }

    // Find matching broader terms
    Object.entries(industryMap).forEach(([key, terms]) => {
      if (industry.toLowerCase().includes(key)) {
        terms.forEach(t => broaderTerms.add(t))
      }
    })

    return Array.from(broaderTerms).slice(0, 10) // Limit to 10 terms
  }

  async getIndustryNews(industry: string, keywords: string[]): Promise<NewsArticle[]> {
    const cacheKey = `industry_${industry}_${keywords.join('_')}`
    const cached = this.getCached(cacheKey)
    if (cached) return cached

    try {
      // Use Edge Function to bypass CORS
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

      // Generate broader search terms for better results
      const searchTerms = this.generateBroaderSearchTerms(industry, keywords)
      console.log(`[NewsAPI] 🔍 Searching with terms:`, searchTerms.slice(0, 5).join(', '))

      const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-news`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          type: 'industry',
          industry,
          keywords: searchTerms,
          limit: 20
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error(
          `[NewsAPI] ❌ Edge Function error (${response.status}): ${errorData.error || response.statusText}`
        )
        console.error('[NewsAPI] This likely means NEWS_API_KEY is not configured in Supabase Edge Function secrets')
        return []
      }

      const data = await response.json()
      if (!data.success) {
        console.error('[NewsAPI] ❌ Edge Function returned error:', data.error)
        return []
      }

      console.log(`[NewsAPI] 📰 Retrieved ${data.articles.length} articles`)

      const articles: NewsArticle[] = data.articles.map((article: any) => ({
        ...article,
        relevanceScore: this.calculateRelevance(article, searchTerms)
      }))

      // Filter out low-relevance articles (score < 40)
      const relevantArticles = articles.filter(a => a.relevanceScore >= 40)
      console.log(`[NewsAPI] ✅ Filtered to ${relevantArticles.length} relevant articles (score >= 40)`)

      // If no industry-specific articles found, try fallback to general small business news
      if (relevantArticles.length === 0) {
        console.log('[NewsAPI] No industry-specific news found, trying general small business news...')

        const fallbackResponse = await fetch(`${SUPABASE_URL}/functions/v1/fetch-news`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            type: 'industry',
            industry: 'business',
            keywords: ['small business', 'local business', 'business trends', 'entrepreneurship'],
            limit: 15
          })
        })

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json()
          if (fallbackData.success && fallbackData.articles.length > 0) {
            console.log(`[NewsAPI] 📰 Fallback retrieved ${fallbackData.articles.length} general business articles`)
            this.setCache(cacheKey, fallbackData.articles)
            return fallbackData.articles
          }
        }
      }

      this.setCache(cacheKey, relevantArticles)
      return relevantArticles
    } catch (error) {
      console.error('[NewsAPI] ❌ Failed to fetch industry news:', error)
      return []
    }
  }

  async getLocalNews(location: string): Promise<NewsArticle[]> {
    const cacheKey = `local_${location}`
    const cached = this.getCached(cacheKey)
    if (cached) return cached

    try {
      // Use Edge Function to bypass CORS
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

      const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-news`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          type: 'local',
          location,
          limit: 15
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error(
          `[NewsAPI] ❌ Edge Function error (${response.status}): ${errorData.error || response.statusText}`
        )
        console.error('[NewsAPI] This likely means NEWS_API_KEY is not configured in Supabase Edge Function secrets')
        return []
      }

      const data = await response.json()
      if (!data.success) {
        console.error('[NewsAPI] ❌ Edge Function returned error:', data.error)
        return []
      }

      this.setCache(cacheKey, data.articles)
      return data.articles
    } catch (error) {
      console.error('[NewsAPI] ❌ Failed to fetch local news:', error)
      return []
    }
  }

  private calculateRelevance(article: any, keywords: string[]): number {
    let score = 50
    const text = `${article.title} ${article.description}`.toLowerCase()

    keywords.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) score += 15
    })

    return Math.min(100, score)
  }

  /**
   * NO MOCK DATA - removed to enforce real API usage
   * Configure VITE_NEWS_API_KEY to enable news features
   */
}

export const NewsAPI = new NewsAPIService()
export type { NewsArticle }
