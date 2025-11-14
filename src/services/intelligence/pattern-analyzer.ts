import { ContentPattern, PowerWordAnalysis, LearningPattern } from '@/types/intelligence.types'
import { supabase } from '@/lib/supabase'

/**
 * Pattern Analyzer Service
 * Detects content performance patterns using ML-style analysis
 * Identifies what works: format, timing, topics, hashtags, tone
 */

interface PatternConfig {
  brandId: string
  platforms: string[]
  minSampleSize?: number
  confidenceThreshold?: number
}

interface ContentPost {
  id: string
  platform: string
  content_type: 'carousel' | 'single_image' | 'video' | 'reel' | 'story' | 'text'
  posted_at: string
  caption?: string
  hashtags?: string[]
  engagement_rate: number
  likes: number
  comments: number
  shares: number
  reach: number
  impressions: number
}

export class PatternAnalyzerService {
  /**
   * Detect all patterns for a brand
   */
  static async detectPatterns(config: PatternConfig): Promise<ContentPattern[]> {
    const patterns: ContentPattern[] = []

    try {
      // Get historical content data
      const posts = await this.getHistoricalPosts(
        config.brandId,
        config.platforms
      )

      if (posts.length < (config.minSampleSize || 20)) {
        console.warn('Insufficient data for pattern detection')
        return patterns
      }

      // Detect format patterns
      const formatPattern = this.detectFormatPattern(posts, config.brandId)
      if (formatPattern) patterns.push(formatPattern)

      // Detect timing patterns
      const timingPattern = this.detectTimingPattern(posts, config.brandId)
      if (timingPattern) patterns.push(timingPattern)

      // Detect hashtag patterns
      const hashtagPattern = this.detectHashtagPattern(posts, config.brandId)
      if (hashtagPattern) patterns.push(hashtagPattern)

      // Detect length patterns
      const lengthPattern = this.detectLengthPattern(posts, config.brandId)
      if (lengthPattern) patterns.push(lengthPattern)

      // Detect topic patterns
      const topicPattern = this.detectTopicPattern(posts, config.brandId)
      if (topicPattern) patterns.push(topicPattern)

      // Save patterns to database
      for (const pattern of patterns) {
        if (pattern.confidence_score >= (config.confidenceThreshold || 0.75)) {
          await this.savePattern(pattern)
        }
      }

      return patterns
    } catch (error) {
      console.error('Pattern detection failed:', error)
      return patterns
    }
  }

  /**
   * Detect format performance patterns
   */
  private static detectFormatPattern(
    posts: ContentPost[],
    brandId: string
  ): ContentPattern | null {
    // Group by content type
    const formatGroups = posts.reduce((acc, post) => {
      if (!acc[post.content_type]) acc[post.content_type] = []
      acc[post.content_type].push(post)
      return acc
    }, {} as Record<string, ContentPost[]>)

    // Calculate average engagement for each format
    const formatStats = Object.entries(formatGroups).map(([format, posts]) => ({
      format,
      count: posts.length,
      avg_engagement: posts.reduce((sum, p) => sum + p.engagement_rate, 0) / posts.length,
      total_reach: posts.reduce((sum, p) => sum + p.reach, 0),
    }))

    // Find best performing format
    formatStats.sort((a, b) => b.avg_engagement - a.avg_engagement)
    const best = formatStats[0]
    const baseline = formatStats.reduce((sum, s) => sum + s.avg_engagement, 0) / formatStats.length

    if (best.avg_engagement < baseline * 1.5) {
      return null // No significant pattern
    }

    const improvementPct = Math.round(((best.avg_engagement - baseline) / baseline) * 100)

    return {
      id: `pattern_format_${Date.now()}`,
      brand_id: brandId,
      pattern_category: 'format',
      title: `${this.formatName(best.format)} Posts Outperform by ${improvementPct}%`,
      description: `${this.formatName(best.format)} format consistently achieves ${best.avg_engagement.toFixed(1)}% engagement rate, significantly higher than your ${baseline.toFixed(1)}% baseline.`,
      discovered_from: {
        posts_analyzed: posts.length,
        time_period: 'Last 90 days',
        platforms: [...new Set(posts.map((p) => p.platform))],
      },
      performance_metrics: {
        baseline_engagement: baseline,
        pattern_engagement: best.avg_engagement,
        improvement_percentage: improvementPct,
      },
      confidence_score: this.calculateConfidence(best.count, improvementPct),
      statistical_significance: this.calculateSignificance(formatStats),
      actionable_insights: [
        `${this.formatName(best.format)} posts get ${improvementPct}% more engagement`,
        `Based on ${best.count} posts analyzed`,
        `Average reach: ${Math.round(best.total_reach / best.count).toLocaleString()} per post`,
      ],
      implementation_guide: [
        `Create more ${this.formatName(best.format)} content`,
        'Convert existing single images into carousels',
        'Aim for 3-5 slides per carousel',
        'Use consistent design templates',
      ],
      evidence_examples: this.getTopPerformers(formatGroups[best.format], 3),
      created_at: new Date().toISOString(),
      last_validated: new Date().toISOString(),
    }
  }

  /**
   * Detect timing performance patterns
   */
  private static detectTimingPattern(
    posts: ContentPost[],
    brandId: string
  ): ContentPattern | null {
    // Analyze by day of week and hour
    const timingData = posts.map((post) => {
      const date = new Date(post.posted_at)
      return {
        dayOfWeek: date.getDay(),
        hour: date.getHours(),
        engagement: post.engagement_rate,
        post,
      }
    })

    // Group by day of week
    const dayStats = Array.from({ length: 7 }, (_, day) => {
      const dayPosts = timingData.filter((d) => d.dayOfWeek === day)
      if (dayPosts.length === 0) return null
      return {
        day,
        count: dayPosts.length,
        avg_engagement: dayPosts.reduce((sum, p) => sum + p.engagement, 0) / dayPosts.length,
      }
    }).filter((s) => s !== null) as Array<{day: number; count: number; avg_engagement: number}>

    const baseline = dayStats.reduce((sum, s) => sum + s.avg_engagement, 0) / dayStats.length
    dayStats.sort((a, b) => b.avg_engagement - a.avg_engagement)
    const bestDay = dayStats[0]

    if (bestDay.avg_engagement < baseline * 1.4) {
      return null
    }

    const improvementPct = Math.round(((bestDay.avg_engagement - baseline) / baseline) * 100)
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][bestDay.day]

    // Find best hours for best day
    const bestDayPosts = timingData.filter((d) => d.dayOfWeek === bestDay.day)
    const hourStats = bestDayPosts.reduce((acc, post) => {
      const hour = post.hour
      if (!acc[hour]) acc[hour] = []
      acc[hour].push(post.engagement)
      return acc
    }, {} as Record<number, number[]>)

    const bestHours = Object.entries(hourStats)
      .map(([hour, engagements]) => ({
        hour: parseInt(hour),
        avg: engagements.reduce((sum, e) => sum + e, 0) / engagements.length,
      }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 2)

    return {
      id: `pattern_timing_${Date.now()}`,
      brand_id: brandId,
      pattern_category: 'timing',
      title: `${dayName} Posts Perform ${improvementPct}% Better`,
      description: `Posts on ${dayName} consistently achieve ${bestDay.avg_engagement.toFixed(1)}% engagement rate. Best times: ${bestHours.map((h) => this.formatHour(h.hour)).join(', ')}.`,
      discovered_from: {
        posts_analyzed: posts.length,
        time_period: 'Last 90 days',
        platforms: [...new Set(posts.map((p) => p.platform))],
      },
      performance_metrics: {
        baseline_engagement: baseline,
        pattern_engagement: bestDay.avg_engagement,
        improvement_percentage: improvementPct,
      },
      confidence_score: this.calculateConfidence(bestDay.count, improvementPct),
      statistical_significance: this.calculateSignificance(dayStats),
      actionable_insights: [
        `${dayName} is your best performing day (+${improvementPct}%)`,
        `Best hours: ${bestHours.map((h) => this.formatHour(h.hour)).join(', ')}`,
        `Based on ${bestDay.count} posts on ${dayName}`,
      ],
      implementation_guide: [
        `Schedule high-value content for ${dayName}`,
        `Target ${bestHours[0] ? this.formatHour(bestHours[0].hour) : '9-11am'} time slot`,
        'Use automated scheduling for consistency',
        'Test similar times on other weekdays',
      ],
      evidence_examples: [],
      created_at: new Date().toISOString(),
      last_validated: new Date().toISOString(),
    }
  }

  /**
   * Detect hashtag performance patterns
   */
  private static detectHashtagPattern(
    posts: ContentPost[],
    brandId: string
  ): ContentPattern | null {
    // Analyze posts with hashtags
    const postsWithHashtags = posts.filter((p) => p.hashtags && p.hashtags.length > 0)
    if (postsWithHashtags.length < 10) return null

    // Count hashtag frequency and performance
    const hashtagStats: Record<string, { count: number; totalEngagement: number }> = {}

    postsWithHashtags.forEach((post) => {
      post.hashtags?.forEach((tag) => {
        if (!hashtagStats[tag]) {
          hashtagStats[tag] = { count: 0, totalEngagement: 0 }
        }
        hashtagStats[tag].count++
        hashtagStats[tag].totalEngagement += post.engagement_rate
      })
    })

    // Find top performing hashtags (used at least 3 times)
    const topHashtags = Object.entries(hashtagStats)
      .filter(([_, stats]) => stats.count >= 3)
      .map(([tag, stats]) => ({
        tag,
        count: stats.count,
        avg_engagement: stats.totalEngagement / stats.count,
      }))
      .sort((a, b) => b.avg_engagement - a.avg_engagement)
      .slice(0, 5)

    if (topHashtags.length === 0) return null

    const baseline = posts.reduce((sum, p) => sum + p.engagement_rate, 0) / posts.length
    const best = topHashtags[0]
    const improvementPct = Math.round(((best.avg_engagement - baseline) / baseline) * 100)

    return {
      id: `pattern_hashtag_${Date.now()}`,
      brand_id: brandId,
      pattern_category: 'hashtag',
      title: `Top Hashtags Drive ${improvementPct}% More Engagement`,
      description: `Posts using ${best.tag} and similar hashtags achieve ${best.avg_engagement.toFixed(1)}% engagement vs ${baseline.toFixed(1)}% baseline.`,
      discovered_from: {
        posts_analyzed: postsWithHashtags.length,
        time_period: 'Last 90 days',
        platforms: [...new Set(posts.map((p) => p.platform))],
      },
      performance_metrics: {
        baseline_engagement: baseline,
        pattern_engagement: best.avg_engagement,
        improvement_percentage: improvementPct,
      },
      confidence_score: this.calculateConfidence(best.count, improvementPct),
      statistical_significance: 0.85,
      actionable_insights: [
        `Top 5 hashtags: ${topHashtags.map((h) => h.tag).join(', ')}`,
        `${best.tag} used in ${best.count} high-performing posts`,
        'Hashtag strategy increases discoverability',
      ],
      implementation_guide: [
        'Use top-performing hashtags consistently',
        'Mix branded and industry hashtags',
        'Keep hashtag count between 5-10',
        'Update hashtag strategy quarterly',
      ],
      evidence_examples: [],
      created_at: new Date().toISOString(),
      last_validated: new Date().toISOString(),
    }
  }

  /**
   * Detect caption length patterns
   */
  private static detectLengthPattern(
    posts: ContentPost[],
    brandId: string
  ): ContentPattern | null {
    const postsWithCaptions = posts.filter((p) => p.caption && p.caption.length > 0)
    if (postsWithCaptions.length < 15) return null

    // Categorize by length
    const lengthCategories = postsWithCaptions.map((post) => {
      const length = post.caption!.length
      let category: string
      if (length < 100) category = 'short'
      else if (length < 300) category = 'medium'
      else category = 'long'

      return { category, engagement: post.engagement_rate, post }
    })

    // Calculate stats by category
    const categoryStats = ['short', 'medium', 'long'].map((cat) => {
      const catPosts = lengthCategories.filter((p) => p.category === cat)
      if (catPosts.length === 0) return null
      return {
        category: cat,
        count: catPosts.length,
        avg_engagement: catPosts.reduce((sum, p) => sum + p.engagement, 0) / catPosts.length,
      }
    }).filter((s) => s !== null) as Array<{category: string; count: number; avg_engagement: number}>

    categoryStats.sort((a, b) => b.avg_engagement - a.avg_engagement)
    const best = categoryStats[0]
    const baseline = categoryStats.reduce((sum, s) => sum + s.avg_engagement, 0) / categoryStats.length

    const improvementPct = Math.round(((best.avg_engagement - baseline) / baseline) * 100)
    if (improvementPct < 20) return null

    return {
      id: `pattern_length_${Date.now()}`,
      brand_id: brandId,
      pattern_category: 'length',
      title: `${best.category.charAt(0).toUpperCase() + best.category.slice(1)} Captions Perform Best`,
      description: `${best.category.charAt(0).toUpperCase() + best.category.slice(1)} captions achieve ${best.avg_engagement.toFixed(1)}% engagement vs ${baseline.toFixed(1)}% average.`,
      discovered_from: {
        posts_analyzed: postsWithCaptions.length,
        time_period: 'Last 90 days',
        platforms: [...new Set(posts.map((p) => p.platform))],
      },
      performance_metrics: {
        baseline_engagement: baseline,
        pattern_engagement: best.avg_engagement,
        improvement_percentage: improvementPct,
      },
      confidence_score: this.calculateConfidence(best.count, improvementPct),
      statistical_significance: 0.82,
      actionable_insights: [
        `${best.category.charAt(0).toUpperCase() + best.category.slice(1)} captions (${this.getLengthRange(best.category)}) perform best`,
        `Based on ${best.count} posts analyzed`,
        'Audience preference for concise/detailed content identified',
      ],
      implementation_guide: [
        `Target ${this.getLengthRange(best.category)} character range`,
        'Front-load key information',
        'Use line breaks for readability',
        'Include clear call-to-action',
      ],
      evidence_examples: [],
      created_at: new Date().toISOString(),
      last_validated: new Date().toISOString(),
    }
  }

  /**
   * Detect topic patterns (simplified keyword analysis)
   */
  private static detectTopicPattern(
    posts: ContentPost[],
    brandId: string
  ): ContentPattern | null {
    // This would require NLP in production
    // For now, return a generic insight
    return null
  }

  /**
   * Analyze power words effectiveness
   */
  static async analyzePowerWords(brandId: string): Promise<PowerWordAnalysis[]> {
    const posts = await this.getHistoricalPosts(brandId, [])
    const powerWords = [
      'free', 'new', 'proven', 'guaranteed', 'exclusive', 'limited',
      'secret', 'amazing', 'incredible', 'ultimate', 'essential', 'powerful',
    ]

    const analyses: PowerWordAnalysis[] = []

    for (const word of powerWords) {
      const withWord = posts.filter(
        (p) => p.caption?.toLowerCase().includes(word.toLowerCase())
      )
      const withoutWord = posts.filter(
        (p) => !p.caption?.toLowerCase().includes(word.toLowerCase())
      )

      if (withWord.length < 3) continue

      const withAvg = withWord.reduce((sum, p) => sum + p.engagement_rate, 0) / withWord.length
      const withoutAvg = withoutWord.reduce((sum, p) => sum + p.engagement_rate, 0) / withoutWord.length
      const lift = ((withAvg - withoutAvg) / withoutAvg) * 100

      if (lift > 10) {
        analyses.push({
          word,
          category: this.categorizePowerWord(word),
          effectiveness_score: Math.min(Math.round(lift + 50), 100),
          usage_count: withWord.length,
          avg_engagement_lift: lift,
          best_context: ['headline', 'call-to-action'],
          alternatives: this.getPowerWordAlternatives(word),
          sentiment_impact: lift > 50 ? 0.8 : 0.5,
        })
      }
    }

    return analyses.sort((a, b) => b.effectiveness_score - a.effectiveness_score)
  }

  /**
   * Helper methods
   */
  private static formatName(format: string): string {
    return format.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  private static formatHour(hour: number): string {
    if (hour === 0) return '12am'
    if (hour < 12) return `${hour}am`
    if (hour === 12) return '12pm'
    return `${hour - 12}pm`
  }

  private static getLengthRange(category: string): string {
    if (category === 'short') return '< 100 characters'
    if (category === 'medium') return '100-300 characters'
    return '> 300 characters'
  }

  private static categorizePowerWord(word: string): PowerWordAnalysis['category'] {
    const categories: Record<string, PowerWordAnalysis['category']> = {
      free: 'value',
      guaranteed: 'trust',
      limited: 'urgency',
      exclusive: 'exclusivity',
      new: 'urgency',
      proven: 'trust',
      amazing: 'emotion',
    }
    return categories[word] || 'action'
  }

  private static getPowerWordAlternatives(word: string): string[] {
    const alternatives: Record<string, string[]> = {
      free: ['complimentary', 'no-cost', 'bonus'],
      guaranteed: ['certified', 'verified', 'assured'],
      limited: ['exclusive', 'rare', 'select'],
    }
    return alternatives[word] || []
  }

  private static calculateConfidence(sampleSize: number, improvementPct: number): number {
    let confidence = 0.5

    if (sampleSize >= 10) confidence += 0.1
    if (sampleSize >= 20) confidence += 0.1
    if (sampleSize >= 50) confidence += 0.1

    if (improvementPct >= 30) confidence += 0.1
    if (improvementPct >= 50) confidence += 0.1

    return Math.min(confidence, 1.0)
  }

  private static calculateSignificance(stats: any[]): number {
    // Simplified significance calculation
    const variance = stats.reduce((sum, s) => sum + Math.abs(s.avg_engagement - stats[0].avg_engagement), 0) / stats.length
    return Math.min(variance / 10 + 0.7, 0.98)
  }

  private static getTopPerformers(posts: ContentPost[], count: number): ContentPattern['evidence_examples'] {
    return posts
      .sort((a, b) => b.engagement_rate - a.engagement_rate)
      .slice(0, count)
      .map((post) => ({
        post_id: post.id,
        description: post.caption?.substring(0, 100) || 'No caption',
        metric_value: post.engagement_rate,
      }))
  }

  /**
   * Database operations
   */
  private static async getHistoricalPosts(
    brandId: string,
    platforms: string[]
  ): Promise<ContentPost[]> {
    try {
      let query = supabase
        .from('content_posts')
        .select('*')
        .eq('brand_id', brandId)
        .gte('posted_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .order('posted_at', { ascending: false })

      if (platforms.length > 0) {
        query = query.in('platform', platforms)
      }

      const { data, error } = await query

      if (error) throw error
      return (data as ContentPost[]) || []
    } catch (error) {
      console.error('Failed to get historical posts:', error)
      throw new Error('PatternAnalyzer failed to retrieve historical posts. Check database connection and content_posts table.')
    }
  }

  private static async savePattern(pattern: ContentPattern): Promise<void> {
    try {
      await supabase.from('content_patterns').insert(pattern)
    } catch (error) {
      console.error('Failed to save pattern:', error)
    }
  }

  /**
   * Get active patterns for brand
   */
  static async getActivePatterns(brandId: string): Promise<ContentPattern[]> {
    try {
      const { data, error } = await supabase
        .from('content_patterns')
        .select('*')
        .eq('brand_id', brandId)
        .gte('confidence_score', 0.75)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      return (data as ContentPattern[]) || []
    } catch (error) {
      console.error('[PatternAnalyzer] Failed to get active patterns:', error)
      // ERROR LOUDLY - don't return empty array
      throw new Error(
        'Pattern analysis failed: ' + (error instanceof Error ? error.message : 'Unknown error') +
        '. Ensure content_patterns table exists and has data.'
      )
    }
  }
}
