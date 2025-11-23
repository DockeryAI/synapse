/**
 * YouTube Data API Integration
 * Analyzes trending videos and content for industry insights
 * SECURITY: Uses Edge Function to keep API keys server-side
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

/**
 * Helper function to call YouTube API via Edge Function
 */
async function callYouTubeEdgeFunction(endpoint: string, params: any): Promise<any> {
  if (!SUPABASE_URL) {
    throw new Error('Supabase URL not configured')
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-youtube`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ endpoint, params })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`YouTube API error (${response.status}): ${errorText}`)
  }

  return await response.json()
}

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

interface YouTubeComment {
  id: string
  text: string
  authorName: string
  likeCount: number
  publishedAt: string
  isReply: boolean
}

interface PsychologicalPattern {
  pattern: string
  type: 'wish' | 'hate' | 'fear' | 'desire' | 'frustration' | 'praise'
  examples: string[]
  frequency: number
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

    try {
      const params: any = {
        part: 'snippet,statistics',
        chart: 'mostPopular',
        regionCode: region,
        maxResults: '50'
      }
      if (category) {
        params.videoCategoryId = category
      }

      const data = await callYouTubeEdgeFunction('videos', params)

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

    try {
      // First, search for video IDs
      const searchData = await callYouTubeEdgeFunction('search', {
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: maxResults.toString()
      })

      const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',')

      // Then, get video details including statistics
      const videosData = await callYouTubeEdgeFunction('videos', {
        part: 'snippet,statistics',
        id: videoIds
      })

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

  /**
   * Get comments from a video for psychological pattern mining
   */
  async getVideoComments(videoId: string, maxResults: number = 100): Promise<YouTubeComment[]> {
    const cacheKey = `comments_${videoId}_${maxResults}`
    const cached = this.getCached(cacheKey)
    if (cached) return cached

    try {
      const data = await callYouTubeEdgeFunction('commentThreads', {
        part: 'snippet',
        videoId,
        maxResults: maxResults.toString(),
        order: 'relevance'
      })

      const comments: YouTubeComment[] = data.items?.map((item: any) => ({
        id: item.id,
        text: item.snippet.topLevelComment.snippet.textDisplay,
        authorName: item.snippet.topLevelComment.snippet.authorDisplayName,
        likeCount: item.snippet.topLevelComment.snippet.likeCount || 0,
        publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
        isReply: false
      })) || []

      this.setCache(cacheKey, comments)
      console.log(`[YouTube API] Retrieved ${comments.length} comments for video ${videoId}`)
      return comments
    } catch (error) {
      console.error('[YouTube API] Error fetching comments:', error)
      return []
    }
  }

  /**
   * Extract psychological patterns from comments ("I wish", "I hate when", etc.)
   */
  extractPsychologicalPatterns(comments: YouTubeComment[]): PsychologicalPattern[] {
    const patterns: Map<string, { type: PsychologicalPattern['type']; examples: string[] }> = new Map()

    // Define pattern matchers
    const matchers: Array<{ regex: RegExp; type: PsychologicalPattern['type']; extract: (match: RegExpMatchArray) => string }> = [
      // Wishes and desires
      { regex: /i wish (?:i |they |we |it |there was |there were )?(.*?)(?:\.|!|$)/gi, type: 'wish', extract: m => m[1] },
      { regex: /i want (?:to )?(.*?)(?:\.|!|$)/gi, type: 'desire', extract: m => m[1] },
      { regex: /i need (.*?)(?:\.|!|$)/gi, type: 'desire', extract: m => m[1] },
      { regex: /if only (.*?)(?:\.|!|$)/gi, type: 'wish', extract: m => m[1] },

      // Frustrations and hates
      { regex: /i hate (?:when |it when |that )?(.*?)(?:\.|!|$)/gi, type: 'hate', extract: m => m[1] },
      { regex: /i can't stand (.*?)(?:\.|!|$)/gi, type: 'hate', extract: m => m[1] },
      { regex: /so frustrat(?:ing|ed) (?:when |that )?(.*?)(?:\.|!|$)/gi, type: 'frustration', extract: m => m[1] },
      { regex: /drives me crazy (.*?)(?:\.|!|$)/gi, type: 'frustration', extract: m => m[1] },
      { regex: /sick of (.*?)(?:\.|!|$)/gi, type: 'frustration', extract: m => m[1] },

      // Fears
      { regex: /i'm afraid (?:of |that )?(.*?)(?:\.|!|$)/gi, type: 'fear', extract: m => m[1] },
      { regex: /i'm worried (?:about |that )?(.*?)(?:\.|!|$)/gi, type: 'fear', extract: m => m[1] },
      { regex: /scared (?:of |that |to )?(.*?)(?:\.|!|$)/gi, type: 'fear', extract: m => m[1] },

      // Praise
      { regex: /(?:this is |that's |it's )(?:so |really |very )?(amazing|great|awesome|helpful|perfect|exactly what i needed)(.*?)(?:\.|!|$)/gi, type: 'praise', extract: m => m[1] + (m[2] || '') },
      { regex: /finally (?:someone |a video that |found )?(.*?)(?:\.|!|$)/gi, type: 'praise', extract: m => m[1] },
      { regex: /thank (?:you|god) for (.*?)(?:\.|!|$)/gi, type: 'praise', extract: m => m[1] },
    ]

    // Process each comment
    for (const comment of comments) {
      const text = comment.text.toLowerCase()

      for (const matcher of matchers) {
        let match
        while ((match = matcher.regex.exec(text)) !== null) {
          const extracted = matcher.extract(match).trim()
          if (extracted && extracted.length > 3 && extracted.length < 100) {
            const key = `${matcher.type}:${extracted.substring(0, 50)}`

            if (patterns.has(key)) {
              patterns.get(key)!.examples.push(comment.text)
            } else {
              patterns.set(key, {
                type: matcher.type,
                examples: [comment.text]
              })
            }
          }
        }
        // Reset regex lastIndex for next comment
        matcher.regex.lastIndex = 0
      }
    }

    // Convert to array and sort by frequency
    const results: PsychologicalPattern[] = Array.from(patterns.entries())
      .map(([key, value]) => ({
        pattern: key.split(':')[1],
        type: value.type,
        examples: value.examples.slice(0, 3),
        frequency: value.examples.length
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20)

    console.log(`[YouTube API] Extracted ${results.length} psychological patterns from ${comments.length} comments`)
    return results
  }

  /**
   * Get comments from multiple videos and extract psychological patterns
   */
  async mineIndustryPsychology(keywords: string[], maxVideos: number = 5): Promise<{
    comments: YouTubeComment[]
    patterns: PsychologicalPattern[]
  }> {
    const cacheKey = `psychology_${keywords.join('_')}_${maxVideos}`
    const cached = this.getCached(cacheKey)
    if (cached) return cached

    try {
      // Search for relevant videos
      const videos = await this.searchVideos(keywords, maxVideos)

      // Get comments from each video
      const allComments: YouTubeComment[] = []
      for (const video of videos) {
        if (video.commentCount > 0) {
          const comments = await this.getVideoComments(video.id, 50)
          allComments.push(...comments)
        }
      }

      // Extract psychological patterns
      const patterns = this.extractPsychologicalPatterns(allComments)

      const result = { comments: allComments, patterns }
      this.setCache(cacheKey, result)

      console.log(`[YouTube API] Mined ${allComments.length} comments from ${videos.length} videos, found ${patterns.length} patterns`)
      return result
    } catch (error) {
      console.error('[YouTube API] Error mining psychology:', error)
      return { comments: [], patterns: [] }
    }
  }
}

export const YouTubeAPI = new YouTubeAPIService()
export type { YouTubeVideo, TrendAnalysis, YouTubeComment, PsychologicalPattern }
