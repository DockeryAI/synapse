/**
 * YouTube Data API Integration
 * Analyzes trending videos and content for industry insights
 */

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

interface YouTubeVideo {
  id: string
  title: string
  description: string
  channelTitle: string
  publishedAt: string
  viewCount: number
  likeCount: number
  commentCount: number
  tags: string[]
  categoryId: string
}

interface TrendAnalysis {
  trending_topics: string[]
  popular_formats: string[]
  engagement_patterns: {
    avgViewCount: number
    avgEngagementRate: number
    peakPostingTimes: string[]
  }
  content_angles: string[]
  relevance_score: number
}

class YouTubeAPIService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map()

  private getCached(key: string): any | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data
    }
    this.cache.delete(key)
    return null
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  /**
   * Get trending videos for a specific category and region
   */
  async getTrendingVideos(category?: string, region: string = 'US'): Promise<YouTubeVideo[]> {
    const cacheKey = `trending_${category}_${region}`
    const cached = this.getCached(cacheKey)
    if (cached) return cached

    if (!YOUTUBE_API_KEY) {
      throw new Error(
        'YouTube API key not configured. Add VITE_YOUTUBE_API_KEY to your .env file. ' +
        'Get a free API key from https://console.cloud.google.com/apis/library/youtube.googleapis.com'
      )
    }

    try {
      const categoryParam = category ? `&videoCategoryId=${category}` : ''
      const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=${region}${categoryParam}&maxResults=50&key=${YOUTUBE_API_KEY}`

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.statusText}`)
      }

      const data = await response.json()

      const videos: YouTubeVideo[] = data.items.map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        viewCount: parseInt(item.statistics.viewCount || '0'),
        likeCount: parseInt(item.statistics.likeCount || '0'),
        commentCount: parseInt(item.statistics.commentCount || '0'),
        tags: item.snippet.tags || [],
        categoryId: item.snippet.categoryId
      }))

      this.setCache(cacheKey, videos)
      return videos
    } catch (error) {
      console.error('[YouTube API] Error fetching trending videos:', error)
      throw error
    }
  }

  /**
   * Search videos by keywords
   */
  async searchVideos(keywords: string[], maxResults: number = 20): Promise<YouTubeVideo[]> {
    const query = keywords.join(' ')
    const cacheKey = `search_${query}_${maxResults}`
    const cached = this.getCached(cacheKey)
    if (cached) return cached

    if (!YOUTUBE_API_KEY) {
      throw new Error(
        'YouTube API key not configured. Add VITE_YOUTUBE_API_KEY to your .env file. ' +
        'Get a free API key from https://console.cloud.google.com/apis/library/youtube.googleapis.com'
      )
    }

    try {
      // First, search for video IDs
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`

      const searchResponse = await fetch(searchUrl)

      if (!searchResponse.ok) {
        throw new Error(`YouTube search error: ${searchResponse.statusText}`)
      }

      const searchData = await searchResponse.json()
      const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',')

      // Then, get video details including statistics
      const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`

      const videosResponse = await fetch(videosUrl)
      const videosData = await videosResponse.json()

      const videos: YouTubeVideo[] = videosData.items.map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        viewCount: parseInt(item.statistics.viewCount || '0'),
        likeCount: parseInt(item.statistics.likeCount || '0'),
        commentCount: parseInt(item.statistics.commentCount || '0'),
        tags: item.snippet.tags || [],
        categoryId: item.snippet.categoryId
      }))

      this.setCache(cacheKey, videos)
      return videos
    } catch (error) {
      console.error('[YouTube API] Error searching videos:', error)
      throw error
    }
  }

  /**
   * Analyze video trends for an industry
   */
  async analyzeVideoTrends(industry: string, keywords: string[]): Promise<TrendAnalysis> {
    const cacheKey = `trends_${industry}_${keywords.join('_')}`
    const cached = this.getCached(cacheKey)
    if (cached) return cached

    try {
      const videos = await this.searchVideos(keywords, 50)

      // Extract trending topics from titles and tags
      const allTags = videos.flatMap(v => v.tags)
      const tagFrequency = allTags.reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const trendingTopics = Object.entries(tagFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag]) => tag)

      // Analyze formats based on titles
      const formats: Record<string, number> = {}
      videos.forEach(v => {
        if (v.title.toLowerCase().includes('tutorial')) formats['Tutorial'] = (formats['Tutorial'] || 0) + 1
        if (v.title.toLowerCase().includes('review')) formats['Review'] = (formats['Review'] || 0) + 1
        if (v.title.toLowerCase().includes('how to')) formats['How-To'] = (formats['How-To'] || 0) + 1
        if (v.title.toLowerCase().includes('tips')) formats['Tips'] = (formats['Tips'] || 0) + 1
        if (v.title.toLowerCase().includes('vs')) formats['Comparison'] = (formats['Comparison'] || 0) + 1
      })

      const popularFormats = Object.entries(formats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([format]) => format)

      // Calculate engagement metrics
      const avgViewCount = videos.reduce((sum, v) => sum + v.viewCount, 0) / videos.length
      const avgEngagementRate = videos.reduce((sum, v) => {
        const engagement = (v.likeCount + v.commentCount) / (v.viewCount || 1)
        return sum + engagement
      }, 0) / videos.length

      // Extract content angles
      const contentAngles = [
        ...new Set(videos.slice(0, 10).map(v => {
          const title = v.title.toLowerCase()
          if (title.includes('beginner')) return 'Beginner-friendly content'
          if (title.includes('advanced')) return 'Advanced techniques'
          if (title.includes('mistake')) return 'Common mistakes to avoid'
          if (title.includes('secret')) return 'Insider secrets'
          if (title.includes('best')) return 'Best practices'
          return 'Educational content'
        }))
      ]

      const analysis: TrendAnalysis = {
        trending_topics: trendingTopics,
        popular_formats: popularFormats,
        engagement_patterns: {
          avgViewCount: Math.round(avgViewCount),
          avgEngagementRate: parseFloat((avgEngagementRate * 100).toFixed(2)),
          peakPostingTimes: ['10 AM EST', '2 PM EST', '6 PM EST'] // Would need posting time analysis
        },
        content_angles: contentAngles,
        relevance_score: Math.min(100, Math.round((videos.length / 50) * 100))
      }

      this.setCache(cacheKey, analysis)
      return analysis
    } catch (error) {
      console.error('[YouTube API] Error analyzing trends:', error)
      throw error
    }
  }
}

export const YouTubeAPI = new YouTubeAPIService()
export type { YouTubeVideo, TrendAnalysis }
