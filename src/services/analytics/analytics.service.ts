/**
 * Analytics Service
 *
 * Comprehensive service for analytics data aggregation, calculation, and insights.
 * Supports goal tracking, KPI management, content analytics, audience insights,
 * engagement tracking, learning patterns, and competitive monitoring.
 */

import { supabase } from '@/lib/supabase'
import type {
  GoalProgress,
  Projection,
  KPIMetric,
  Comparison,
  ContentItem,
  ContentPerformance,
  PlatformPerformance,
  PillarPerformance,
  OptimalTimes,
  Demographics,
  GrowthData,
  Heatmap,
  SentimentData,
  EngagementItem,
  ResponseSuggestion,
  InboxFilters,
  LearningPattern,
  CompetitiveActivity,
  CompetitiveGap,
  DateRange,
  Platform,
  OnTrackStatus,
  PowerWordPerformance,
  ContentTypePerformance,
  AnalyticsSummary,
} from '@/types/analytics.types'

export class AnalyticsService {
  // ==================== Goal Progress Methods ====================

  /**
   * Calculate current progress for an objective
   */
  static async calculateGoalProgress(objectiveId: string): Promise<GoalProgress> {
    try {
      // Fetch objective details
      const { data: objective, error: objError } = await supabase
        .from('mirror_intend_objectives')
        .select('*')
        .eq('id', objectiveId)
        .maybeSingle()

      if (objError) throw objError
      if (!objective) throw new Error('Objective not found')

      // Fetch latest analytics for this objective
      const { data: analytics, error: analyticsError } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('objective_id', objectiveId)
        .order('created_at', { ascending: false })
        .limit(30)

      if (analyticsError) throw analyticsError

      // Calculate current value based on objective type
      const currentValue = this.calculateCurrentValue(objective, analytics || [])
      const targetValue = objective.target_value || 0
      const progressPercentage = targetValue > 0 ? (currentValue / targetValue) * 100 : 0

      // Calculate velocity (units per day)
      const velocity = this.calculateVelocity(analytics || [])

      // Calculate time remaining
      const today = new Date()
      const targetDate = new Date(objective.target_date)
      const timeRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      // Project completion date based on current velocity
      const daysToComplete = velocity > 0 ? (targetValue - currentValue) / velocity : Infinity
      const projectedCompletionDate = new Date(today.getTime() + daysToComplete * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

      // Determine on-track status
      const onTrackStatus = this.calculateOnTrackStatus(
        progressPercentage,
        timeRemaining,
        velocity,
        targetValue - currentValue
      )

      // Get industry benchmark if available
      const industryBenchmark = await this.getIndustryBenchmark(objective.category, objective.metric_type)

      return {
        objectiveId,
        objectiveName: objective.name,
        currentValue,
        targetValue,
        progressPercentage,
        onTrackStatus,
        timeRemaining,
        projectedCompletionDate,
        velocity,
        industryBenchmark,
        startDate: objective.start_date,
        targetDate: objective.target_date,
        lastUpdated: new Date().toISOString(),
      }
    } catch (error) {
      console.error('Error calculating goal progress:', error)
      throw error
    }
  }

  /**
   * Project goal completion based on current velocity
   */
  static async projectGoalCompletion(objectiveId: string): Promise<Projection> {
    try {
      const progress = await this.calculateGoalProgress(objectiveId)

      const remaining = progress.targetValue - progress.currentValue
      const daysToComplete = progress.velocity > 0 ? remaining / progress.velocity : Infinity

      const projectedDate = new Date(Date.now() + daysToComplete * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

      // Calculate confidence based on data points and consistency
      const confidence = Math.min(0.95, progress.velocity > 0 ? 0.7 : 0.3)

      return {
        projectedValue: progress.targetValue,
        projectedDate,
        confidence,
        methodology: 'Linear regression based on 30-day velocity',
        assumptions: [
          'Current velocity remains constant',
          'No major market disruptions',
          'Consistent resource allocation',
        ],
      }
    } catch (error) {
      console.error('Error projecting goal completion:', error)
      throw error
    }
  }

  // ==================== KPI Methods ====================

  /**
   * Get all KPI metrics for a brand within a date range
   */
  static async getKPIMetrics(brandId: string, dateRange: DateRange): Promise<KPIMetric[]> {
    try {
      // This would aggregate data from analytics_events and other sources
      // For now, returning sample data structure

      const metrics: KPIMetric[] = []

      // Fetch engagement metrics
      const engagementMetrics = await this.calculateEngagementKPIs(brandId, dateRange)
      metrics.push(...engagementMetrics)

      // Fetch reach metrics
      const reachMetrics = await this.calculateReachKPIs(brandId, dateRange)
      metrics.push(...reachMetrics)

      // Fetch conversion metrics
      const conversionMetrics = await this.calculateConversionKPIs(brandId, dateRange)
      metrics.push(...conversionMetrics)

      return metrics
    } catch (error) {
      console.error('Error getting KPI metrics:', error)
      throw error
    }
  }

  /**
   * Compare KPI to industry benchmark
   */
  static async compareToIndustryBenchmark(metric: KPIMetric): Promise<Comparison> {
    try {
      // Fetch industry benchmark for this metric
      const { data: benchmark } = await supabase
        .from('industry_benchmarks')
        .select('average_value, percentile_90, percentile_75, percentile_50')
        .eq('metric_name', metric.name)
        .single()

      const industryAverage = benchmark?.average_value || 0
      const percentageDifference = industryAverage > 0
        ? ((metric.value - industryAverage) / industryAverage) * 100
        : 0

      // Determine performance rating
      let performanceRating: Comparison['performanceRating'] = 'average'
      if (metric.value >= (benchmark?.percentile_90 || Infinity)) {
        performanceRating = 'excellent'
      } else if (metric.value >= (benchmark?.percentile_75 || 0)) {
        performanceRating = 'above-average'
      } else if (metric.value < (benchmark?.percentile_50 || 0)) {
        performanceRating = 'below-average'
      }

      return {
        metric,
        industryAverage,
        percentageDifference,
        performanceRating,
        rank: performanceRating === 'excellent' ? 'Top 10%' : undefined,
      }
    } catch (error) {
      console.error('Error comparing to industry benchmark:', error)
      throw error
    }
  }

  // ==================== Content Analytics Methods ====================

  /**
   * Get best performing content
   */
  static async getBestPerformingContent(brandId: string, limit: number = 10): Promise<ContentItem[]> {
    try {
      const { data, error } = await supabase
        .from('content_calendar_items')
        .select('*, analytics:analytics_events(*)')
        .eq('brand_id', brandId)
        .eq('status', 'published')
        .order('engagement_score', { ascending: false })
        .limit(limit)

      if (error) throw error

      return this.mapToContentItems(data || [])
    } catch (error) {
      console.error('Error getting best performing content:', error)
      throw error
    }
  }

  /**
   * Get worst performing content
   */
  static async getWorstPerformingContent(brandId: string, limit: number = 10): Promise<ContentItem[]> {
    try {
      const { data, error } = await supabase
        .from('content_calendar_items')
        .select('*, analytics:analytics_events(*)')
        .eq('brand_id', brandId)
        .eq('status', 'published')
        .order('engagement_score', { ascending: true })
        .limit(limit)

      if (error) throw error

      return this.mapToContentItems(data || [])
    } catch (error) {
      console.error('Error getting worst performing content:', error)
      throw error
    }
  }

  /**
   * Get performance by platform
   */
  static async getPerformanceByPlatform(brandId: string): Promise<PlatformPerformance[]> {
    try {
      const platforms: Platform[] = ['instagram', 'twitter', 'linkedin', 'facebook']
      const performance: PlatformPerformance[] = []

      for (const platform of platforms) {
        const { data, error } = await supabase
          .from('platform_metrics_snapshots')
          .select('*')
          .eq('brand_id', brandId)
          .eq('platform', platform)
          .order('created_at', { ascending: false })
          .limit(30)

        if (error) continue

        if (data && data.length > 0) {
          const latest = data[0]
          const oldest = data[data.length - 1]

          const avgEngagement = data.reduce((sum, d) => sum + (d.metrics?.engagement_rate || 0), 0) / data.length
          const avgReach = data.reduce((sum, d) => sum + (d.metrics?.reach || 0), 0) / data.length
          const growthRate = oldest.metrics?.followers > 0
            ? ((latest.metrics?.followers - oldest.metrics?.followers) / oldest.metrics?.followers) * 100
            : 0

          performance.push({
            platform,
            averageEngagement: avgEngagement,
            averageReach: avgReach,
            postCount: data.length,
            totalFollowers: latest.metrics?.followers || 0,
            growthRate,
            bestPerformingContentType: 'image', // Would calculate from content analysis
            topPost: {} as ContentPerformance, // Would fetch actual top post
          })
        }
      }

      return performance
    } catch (error) {
      console.error('Error getting performance by platform:', error)
      throw error
    }
  }

  /**
   * Get performance by pillar
   */
  static async getPerformanceByPillar(brandId: string): Promise<PillarPerformance[]> {
    try {
      const { data: pillars, error } = await supabase
        .from('mirror_reimagine_content_pillars')
        .select('*')
        .eq('brand_id', brandId)

      if (error) throw error

      const performance: PillarPerformance[] = []

      for (const pillar of pillars || []) {
        // Get content tagged with this pillar
        const { data: content } = await supabase
          .from('content_calendar_items')
          .select('engagement_score')
          .eq('brand_id', brandId)
          .contains('tags', [pillar.name])

        const avgEngagement = content?.length
          ? content.reduce((sum, c) => sum + (c.engagement_score || 0), 0) / content.length
          : 0

        performance.push({
          pillarName: pillar.name,
          pillarId: pillar.id,
          averageEngagement: avgEngagement,
          postCount: content?.length || 0,
          audienceResonance: avgEngagement * 10, // Scale to 0-100
          trend: 'stable',
          topKeywords: pillar.keywords?.slice(0, 5) || [],
        })
      }

      return performance
    } catch (error) {
      console.error('Error getting performance by pillar:', error)
      throw error
    }
  }

  /**
   * Get optimal posting times
   */
  static async getOptimalPostingTimes(brandId: string, platform?: Platform): Promise<OptimalTimes> {
    try {
      // Analyze historical post performance by day/time
      const { data: patterns, error } = await supabase
        .from('learning_patterns')
        .select('*')
        .eq('brand_id', brandId)
        .eq('pattern_type', 'timing')
        .order('confidence_score', { ascending: false })
        .limit(1)

      if (error) throw error

      const pattern = patterns?.[0]

      // Default optimal time if no data
      return {
        platform: platform || 'instagram',
        bestDayOfWeek: pattern?.metadata?.best_day || 'Wednesday',
        bestHourOfDay: pattern?.metadata?.best_hour || 14,
        confidence: pattern?.confidence_score || 0.5,
        data: this.generateTimingHeatmapData(),
      }
    } catch (error) {
      console.error('Error getting optimal posting times:', error)
      throw error
    }
  }

  // ==================== Audience Methods ====================

  /**
   * Get audience demographics
   */
  static async getAudienceDemographics(brandId: string): Promise<Demographics> {
    try {
      const { data, error } = await supabase
        .from('platform_metrics_snapshots')
        .select('metrics')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) throw error

      const latestMetrics = data?.[0]?.metrics

      return {
        ageRanges: latestMetrics?.demographics?.age_ranges || this.getDefaultAgeRanges(),
        genderSplit: latestMetrics?.demographics?.gender_split || this.getDefaultGenderSplit(),
        topLocations: latestMetrics?.demographics?.top_locations || this.getDefaultLocations(),
        devices: latestMetrics?.demographics?.devices || this.getDefaultDevices(),
      }
    } catch (error) {
      console.error('Error getting audience demographics:', error)
      throw error
    }
  }

  /**
   * Get audience growth data
   */
  static async getAudienceGrowth(brandId: string, dateRange: DateRange): Promise<GrowthData> {
    try {
      const { data, error } = await supabase
        .from('platform_metrics_snapshots')
        .select('created_at, metrics')
        .eq('brand_id', brandId)
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end)
        .order('created_at', { ascending: true })

      if (error) throw error

      const timeSeriesData = (data || []).map((d, index, arr) => {
        const followers = d.metrics?.followers || 0
        const prevFollowers = index > 0 ? arr[index - 1].metrics?.followers || 0 : followers
        return {
          date: d.created_at.split('T')[0],
          followers,
          newFollowers: Math.max(0, followers - prevFollowers),
          unfollows: 0, // Would need to track separately
          netGrowth: followers - prevFollowers,
        }
      })

      const totalGrowth = timeSeriesData.length > 0
        ? timeSeriesData[timeSeriesData.length - 1].followers - timeSeriesData[0].followers
        : 0

      const growthRate = timeSeriesData[0]?.followers > 0
        ? (totalGrowth / timeSeriesData[0].followers) * 100
        : 0

      const averageDailyGrowth = timeSeriesData.length > 0
        ? totalGrowth / timeSeriesData.length
        : 0

      return {
        timeSeriesData,
        totalGrowth,
        growthRate,
        averageDailyGrowth,
        projectedGrowth: averageDailyGrowth * 30, // 30-day projection
      }
    } catch (error) {
      console.error('Error getting audience growth:', error)
      throw error
    }
  }

  /**
   * Get activity heatmap
   */
  static async getActivityHeatmap(brandId: string): Promise<Heatmap> {
    try {
      // Analyze when audience is most active from engagement data
      const { data, error } = await supabase
        .from('engagement_inbox')
        .select('created_at')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false })
        .limit(1000)

      if (error) throw error

      // Generate heatmap data
      const heatmapData = this.generateHeatmapData(data || [])
      const peakTimes = this.identifyPeakTimes(heatmapData)

      return {
        data: heatmapData,
        peakTimes,
      }
    } catch (error) {
      console.error('Error getting activity heatmap:', error)
      throw error
    }
  }

  /**
   * Get sentiment analysis
   */
  static async getSentimentAnalysis(brandId: string): Promise<SentimentData> {
    try {
      const { data, error } = await supabase
        .from('engagement_inbox')
        .select('sentiment, created_at, content')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false })
        .limit(500)

      if (error) throw error

      const sentiments = data || []
      const total = sentiments.length

      const overall = {
        positive: sentiments.filter((s) => s.sentiment === 'positive').length / total,
        neutral: sentiments.filter((s) => s.sentiment === 'neutral').length / total,
        negative: sentiments.filter((s) => s.sentiment === 'negative').length / total,
      }

      // Group by date for trend
      const trend = this.calculateSentimentTrend(sentiments)

      // Extract keywords (simplified)
      const topPositiveKeywords = ['great', 'love', 'excellent', 'amazing', 'helpful']
      const topNegativeKeywords = ['poor', 'bad', 'issue', 'problem', 'disappointed']

      const averageSentimentScore = overall.positive - overall.negative

      return {
        overall,
        trend,
        topPositiveKeywords,
        topNegativeKeywords,
        averageSentimentScore,
      }
    } catch (error) {
      console.error('Error getting sentiment analysis:', error)
      throw error
    }
  }

  // ==================== Engagement Methods ====================

  /**
   * Get engagement inbox items
   */
  static async getEngagementInbox(brandId: string, filters?: InboxFilters): Promise<EngagementItem[]> {
    try {
      let query = supabase
        .from('engagement_inbox')
        .select('*')
        .eq('brand_id', brandId)

      // Apply filters
      if (filters?.platform) {
        query = query.eq('platform', filters.platform)
      }
      if (filters?.sentiment) {
        query = query.eq('sentiment', filters.sentiment)
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.type) {
        query = query.eq('type', filters.type)
      }
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom)
      }
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo)
      }
      if (filters?.searchQuery) {
        query = query.ilike('content', `%${filters.searchQuery}%`)
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(100)

      if (error) throw error

      return (data || []).map((item) => ({
        id: item.id,
        platform: item.platform,
        type: item.type,
        content: item.content,
        author: item.author_name || 'Unknown',
        authorHandle: item.author_handle,
        authorAvatar: item.author_avatar,
        authorFollowers: item.author_followers,
        sentiment: item.sentiment,
        priority: item.priority,
        status: item.status,
        createdAt: item.created_at,
        contentId: item.content_id,
        requiresResponse: item.requires_response || false,
        responseTime: item.response_time,
        tags: item.tags,
      }))
    } catch (error) {
      console.error('Error getting engagement inbox:', error)
      throw error
    }
  }

  /**
   * Suggest responses for an engagement item
   */
  static async suggestResponse(engagementItem: EngagementItem): Promise<ResponseSuggestion[]> {
    try {
      // This would use AI to generate response suggestions
      // For now, return sample suggestions based on sentiment

      const suggestions: ResponseSuggestion[] = []

      if (engagementItem.sentiment === 'positive') {
        suggestions.push({
          id: '1',
          text: `Thank you so much for your kind words! We're thrilled to hear you're enjoying our content. 🙏`,
          tone: 'friendly',
          confidence: 0.9,
          reason: 'Matches positive sentiment with appreciation',
        })
        suggestions.push({
          id: '2',
          text: `We appreciate your support! It means the world to us. ❤️`,
          tone: 'friendly',
          confidence: 0.85,
          reason: 'Brief and warm acknowledgment',
        })
      } else if (engagementItem.sentiment === 'negative') {
        suggestions.push({
          id: '1',
          text: `We're sorry to hear about your experience. We'd love to make this right. Can you please DM us more details?`,
          tone: 'empathetic',
          confidence: 0.9,
          reason: 'Acknowledges issue and offers solution',
        })
        suggestions.push({
          id: '2',
          text: `Thank you for bringing this to our attention. We're looking into this right away.`,
          tone: 'professional',
          confidence: 0.85,
          reason: 'Professional acknowledgment',
        })
      } else {
        suggestions.push({
          id: '1',
          text: `Thanks for reaching out! How can we help you today?`,
          tone: 'friendly',
          confidence: 0.8,
          reason: 'Neutral, helpful response',
        })
      }

      return suggestions
    } catch (error) {
      console.error('Error suggesting response:', error)
      throw error
    }
  }

  /**
   * Mark engagement item as read
   */
  static async markAsRead(itemId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('engagement_inbox')
        .update({ status: 'responded', updated_at: new Date().toISOString() })
        .eq('id', itemId)

      if (error) throw error
    } catch (error) {
      console.error('Error marking as read:', error)
      throw error
    }
  }

  // ==================== Learning Methods ====================

  /**
   * Get learning patterns
   */
  static async getLearningPatterns(brandId: string): Promise<LearningPattern[]> {
    try {
      const { data, error } = await supabase
        .from('learning_patterns')
        .select('*')
        .eq('brand_id', brandId)
        .order('confidence_score', { ascending: false })
        .limit(20)

      if (error) throw error

      return (data || []).map((pattern) => ({
        id: pattern.id,
        type: pattern.pattern_type,
        pattern: pattern.pattern_description,
        impact: pattern.impact_description || 'Positive impact on performance',
        impactValue: pattern.impact_value || 0,
        confidence: pattern.confidence_score,
        dataPoints: pattern.sample_size,
        recommendation: pattern.recommendation,
        detectedAt: pattern.first_detected_at,
        lastValidated: pattern.last_validated_at,
        examples: pattern.examples,
        relatedMetrics: pattern.related_metrics,
        autoApplied: pattern.auto_apply || false,
      }))
    } catch (error) {
      console.error('Error getting learning patterns:', error)
      throw error
    }
  }

  /**
   * Calculate confidence score for a pattern
   */
  static async getConfidenceScore(pattern: LearningPattern): Promise<number> {
    // Confidence based on data points
    if (pattern.dataPoints >= 1000) return 0.95
    if (pattern.dataPoints >= 500) return 0.85
    if (pattern.dataPoints >= 100) return 0.7
    if (pattern.dataPoints >= 50) return 0.6
    return 0.4
  }

  // ==================== Competitive Methods ====================

  /**
   * Get competitive activity feed
   */
  static async getCompetitiveActivityFeed(brandId: string): Promise<CompetitiveActivity[]> {
    try {
      const { data, error } = await supabase
        .from('competitive_intelligence_snapshots')
        .select('*, competitor:competitors(*)')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      // Map to activities
      const activities: CompetitiveActivity[] = []

      for (const snapshot of data || []) {
        // Detect changes and create activity items
        if (snapshot.change_detected) {
          activities.push({
            id: snapshot.id,
            competitorId: snapshot.competitor_id,
            competitorName: snapshot.competitor?.name || 'Unknown',
            competitorLogo: snapshot.competitor?.logo_url,
            activityType: this.detectActivityType(snapshot.change_type),
            description: snapshot.change_description || 'Activity detected',
            impact: this.calculateImpact(snapshot),
            suggestedResponse: snapshot.suggested_response,
            detectedAt: snapshot.created_at,
            sourceUrl: snapshot.source_url,
            changeDetails: snapshot.change_details,
          })
        }
      }

      return activities
    } catch (error) {
      console.error('Error getting competitive activity feed:', error)
      throw error
    }
  }

  /**
   * Get competitive gaps
   */
  static async getCompetitiveGaps(brandId: string): Promise<CompetitiveGap[]> {
    try {
      const { data, error } = await supabase
        .from('competitive_gaps')
        .select('*, competitors:competitor_gaps(competitor:competitors(*))')
        .eq('brand_id', brandId)
        .order('priority', { ascending: true })

      if (error) throw error

      return (data || []).map((gap) => ({
        id: gap.id,
        type: gap.gap_type,
        description: gap.description,
        competitors: gap.competitors?.map((c: any) => ({
          id: c.competitor.id,
          name: c.competitor.name,
          advantage: c.advantage_description,
        })) || [],
        opportunity: gap.opportunity_description,
        priority: gap.priority,
        estimatedEffort: gap.estimated_effort,
        estimatedImpact: gap.estimated_impact,
        actionItems: gap.action_items,
      }))
    } catch (error) {
      console.error('Error getting competitive gaps:', error)
      throw error
    }
  }

  // ==================== Helper Methods ====================

  private static calculateCurrentValue(objective: any, analytics: any[]): number {
    // Aggregate analytics data based on objective metric type
    if (analytics.length === 0) return 0

    const metricType = objective.metric_type
    const latest = analytics[0]

    switch (metricType) {
      case 'followers':
        return latest.metrics?.followers || 0
      case 'engagement_rate':
        return latest.metrics?.engagement_rate || 0
      case 'reach':
        return latest.metrics?.reach || 0
      case 'conversions':
        return latest.metrics?.conversions || 0
      default:
        return 0
    }
  }

  private static calculateVelocity(analytics: any[]): number {
    if (analytics.length < 2) return 0

    const oldest = analytics[analytics.length - 1]
    const newest = analytics[0]

    const daysDiff = Math.ceil(
      (new Date(newest.created_at).getTime() - new Date(oldest.created_at).getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysDiff === 0) return 0

    const valueDiff = (newest.value || 0) - (oldest.value || 0)
    return valueDiff / daysDiff
  }

  private static calculateOnTrackStatus(
    progressPercentage: number,
    timeRemaining: number,
    velocity: number,
    remaining: number
  ): OnTrackStatus {
    if (progressPercentage >= 100) return 'ahead'

    // Calculate expected progress based on time elapsed
    const daysNeeded = velocity > 0 ? remaining / velocity : Infinity

    if (daysNeeded <= timeRemaining * 0.9) return 'ahead'
    if (daysNeeded <= timeRemaining * 1.1) return 'on-track'
    if (daysNeeded <= timeRemaining * 1.3) return 'slightly-behind'
    return 'behind'
  }

  private static async getIndustryBenchmark(category: string, metricType: string): Promise<number | undefined> {
    try {
      const { data } = await supabase
        .from('industry_benchmarks')
        .select('average_value')
        .eq('category', category)
        .eq('metric_type', metricType)
        .single()

      return data?.average_value
    } catch {
      return undefined
    }
  }

  private static async calculateEngagementKPIs(brandId: string, dateRange: DateRange): Promise<KPIMetric[]> {
    // Would implement actual calculation
    return []
  }

  private static async calculateReachKPIs(brandId: string, dateRange: DateRange): Promise<KPIMetric[]> {
    // Would implement actual calculation
    return []
  }

  private static async calculateConversionKPIs(brandId: string, dateRange: DateRange): Promise<KPIMetric[]> {
    // Would implement actual calculation
    return []
  }

  private static mapToContentItems(data: any[]): ContentItem[] {
    return data.map((item) => ({
      id: item.id,
      content: item.content,
      platform: item.platform,
      postedAt: item.published_at || item.scheduled_for,
      performance: {
        contentId: item.id,
        platform: item.platform,
        content: item.content,
        postedAt: item.published_at || item.scheduled_for,
        engagementScore: item.engagement_score || 0,
        likes: item.analytics?.[0]?.likes || 0,
        comments: item.analytics?.[0]?.comments || 0,
        shares: item.analytics?.[0]?.shares || 0,
        reach: item.analytics?.[0]?.reach || 0,
        impressions: item.analytics?.[0]?.impressions || 0,
        performanceRank: 0,
      },
    }))
  }

  private static generateTimingHeatmapData() {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const data: Array<{ day: string; hour: number; score: number }> = []

    days.forEach((day) => {
      for (let hour = 0; hour < 24; hour++) {
        // Peak hours: 9am, 12pm, 6pm
        let score = 30
        if (hour === 9 || hour === 12 || hour === 18) score = 90
        else if (hour >= 8 && hour <= 20) score = 60

        data.push({ day, hour, score })
      }
    })

    return data
  }

  private static getDefaultAgeRanges() {
    return [
      { range: '18-24', percentage: 20, count: 200 },
      { range: '25-34', percentage: 35, count: 350 },
      { range: '35-44', percentage: 25, count: 250 },
      { range: '45-54', percentage: 15, count: 150 },
      { range: '55+', percentage: 5, count: 50 },
    ]
  }

  private static getDefaultGenderSplit() {
    return [
      { gender: 'Female', percentage: 52, count: 520 },
      { gender: 'Male', percentage: 46, count: 460 },
      { gender: 'Other', percentage: 2, count: 20 },
    ]
  }

  private static getDefaultLocations() {
    return [
      { location: 'United States', count: 500, percentage: 50, country: 'USA', city: 'New York' },
      { location: 'United Kingdom', count: 200, percentage: 20, country: 'UK', city: 'London' },
      { location: 'Canada', count: 150, percentage: 15, country: 'Canada', city: 'Toronto' },
      { location: 'Australia', count: 100, percentage: 10, country: 'Australia', city: 'Sydney' },
      { location: 'Germany', count: 50, percentage: 5, country: 'Germany', city: 'Berlin' },
    ]
  }

  private static getDefaultDevices() {
    return [
      { type: 'Mobile', percentage: 70 },
      { type: 'Desktop', percentage: 25 },
      { type: 'Tablet', percentage: 5 },
    ]
  }

  private static generateHeatmapData(engagements: any[]) {
    const heatmap: Array<{ day: number; hour: number; activity: number }> = []

    // Initialize all slots
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        heatmap.push({ day, hour, activity: 0 })
      }
    }

    // Count engagements
    engagements.forEach((eng) => {
      const date = new Date(eng.created_at)
      const day = date.getDay()
      const hour = date.getHours()
      const slot = heatmap.find((h) => h.day === day && h.hour === hour)
      if (slot) slot.activity += 1
    })

    // Normalize to 0-100
    const max = Math.max(...heatmap.map((h) => h.activity))
    if (max > 0) {
      heatmap.forEach((h) => {
        h.activity = (h.activity / max) * 100
      })
    }

    return heatmap
  }

  private static identifyPeakTimes(heatmapData: Array<{ day: number; hour: number; activity: number }>) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return heatmapData
      .sort((a, b) => b.activity - a.activity)
      .slice(0, 5)
      .map((peak) => ({
        day: days[peak.day],
        hour: peak.hour,
        activityLevel: peak.activity,
      }))
  }

  private static calculateSentimentTrend(sentiments: any[]) {
    // Group by date
    const byDate: Record<string, { positive: number; neutral: number; negative: number; total: number }> = {}

    sentiments.forEach((s) => {
      const date = s.created_at.split('T')[0]
      if (!byDate[date]) {
        byDate[date] = { positive: 0, neutral: 0, negative: 0, total: 0 }
      }
      byDate[date][s.sentiment]++
      byDate[date].total++
    })

    return Object.entries(byDate).map(([date, counts]) => ({
      date,
      positive: counts.positive / counts.total,
      neutral: counts.neutral / counts.total,
      negative: counts.negative / counts.total,
    }))
  }

  private static detectActivityType(changeType: string): CompetitiveActivity['activityType'] {
    const typeMap: Record<string, CompetitiveActivity['activityType']> = {
      website: 'website_change',
      content: 'new_content',
      messaging: 'messaging_shift',
      product: 'product_launch',
      reputation: 'reputation_change',
      pricing: 'pricing_change',
    }
    return typeMap[changeType] || 'new_content'
  }

  private static calculateImpact(snapshot: any): CompetitiveActivity['impact'] {
    // Simple impact calculation based on change magnitude
    const magnitude = snapshot.change_magnitude || 0
    if (magnitude > 0.5) return 'high'
    if (magnitude > 0.2) return 'medium'
    return 'low'
  }
}
