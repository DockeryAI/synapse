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

  async getIndustryNews(industry: string, keywords: string[]): Promise<NewsArticle[]> {
    const cacheKey = `industry_${industry}_${keywords.join('_')}`
    const cached = this.getCached(cacheKey)
    if (cached) return cached

    if (!NEWS_API_KEY) {
      throw new Error(
        'News API key not configured. Add VITE_NEWS_API_KEY to your .env file. ' +
        'Get a free API key from https://newsapi.org/'
      )
    }

    try {
      const query = `${industry} ${keywords.join(' ')}`
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&pageSize=20&apiKey=${NEWS_API_KEY}`

      const response = await fetch(url)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          `News API error (${response.status}): ${errorData.message || response.statusText}. ` +
          'Check your VITE_NEWS_API_KEY configuration.'
        )
      }

      const data = await response.json()
      const articles: NewsArticle[] = data.articles.map((article: any) => ({
        title: article.title,
        description: article.description || '',
        url: article.url,
        publishedAt: article.publishedAt,
        source: article.source.name,
        author: article.author,
        content: article.content,
        relevanceScore: this.calculateRelevance(article, keywords)
      }))

      this.setCache(cacheKey, articles)
      return articles
    } catch (error) {
      // Re-throw - NO SILENT FAILURES
      if (error instanceof Error) {
        throw error
      }
      throw new Error(`News API failed: ${String(error)}`)
    }
  }

  async getLocalNews(location: string): Promise<NewsArticle[]> {
    const cacheKey = `local_${location}`
    const cached = this.getCached(cacheKey)
    if (cached) return cached

    if (!NEWS_API_KEY) {
      throw new Error(
        'News API key not configured. Add VITE_NEWS_API_KEY to your .env file. ' +
        'Get a free API key from https://newsapi.org/'
      )
    }

    try {
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(location)}&sortBy=publishedAt&language=en&pageSize=15&apiKey=${NEWS_API_KEY}`

      const response = await fetch(url)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          `News API error (${response.status}): ${errorData.message || response.statusText}. ` +
          'Check your VITE_NEWS_API_KEY configuration.'
        )
      }

      const data = await response.json()
      const articles: NewsArticle[] = data.articles.map((article: any) => ({
        title: article.title,
        description: article.description || '',
        url: article.url,
        publishedAt: article.publishedAt,
        source: article.source.name,
        author: article.author,
        content: article.content,
        relevanceScore: 75
      }))

      this.setCache(cacheKey, articles)
      return articles
    } catch (error) {
      // Re-throw - NO SILENT FAILURES
      if (error instanceof Error) {
        throw error
      }
      throw new Error(`News API failed: ${String(error)}`)
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
