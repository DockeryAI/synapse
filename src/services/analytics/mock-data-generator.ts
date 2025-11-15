/**
 * Mock Data Generator for Analytics
 *
 * Generates realistic mock analytics data for development and testing.
 * Creates 90 days of historical data with realistic trends, seasonality, and variance.
 */

import type {
  ContentItem,
  PlatformPerformance,
  PillarPerformance,
  OptimalTimes,
  PowerWordPerformance,
  Demographics,
  GrowthData,
  SentimentData,
  LearningPattern,
  CompetitiveActivity,
  CompetitiveGap,
  Platform
} from '@/types/analytics.types'

// ==================== Time Series Data ====================

export function generateDailyMetrics(days: number = 90) {
  const data = []
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  let baseEngagement = 500
  let baseReach = 10000
  let baseImpressions = 25000

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)

    // Add growth trend
    const growthFactor = 1 + (i / days) * 0.3 // 30% growth over period

    // Add weekly seasonality (higher on Tue/Wed/Thu)
    const dayOfWeek = date.getDay()
    const seasonalityFactor = [0.7, 0.9, 1.1, 1.2, 1.1, 0.8, 0.6][dayOfWeek]

    // Add random variance
    const variance = 0.8 + Math.random() * 0.4 // ±20% variance

    const totalFactor = growthFactor * seasonalityFactor * variance

    data.push({
      date: date.toISOString().split('T')[0],
      dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      engagement: Math.floor(baseEngagement * totalFactor),
      reach: Math.floor(baseReach * totalFactor),
      impressions: Math.floor(baseImpressions * totalFactor),
      likes: Math.floor((baseEngagement * 0.6) * totalFactor),
      comments: Math.floor((baseEngagement * 0.25) * totalFactor),
      shares: Math.floor((baseEngagement * 0.15) * totalFactor),
      clicks: Math.floor((baseEngagement * 0.4) * totalFactor),
      conversions: Math.floor((baseEngagement * 0.02) * totalFactor),
    })
  }

  return data
}

export function generatePerformanceByPlatform(days: number = 90): { data: any[], summary: PlatformPerformance[] } {
  const platforms: Platform[] = ['instagram', 'twitter', 'linkedin', 'facebook', 'tiktok']
  const dailyMetrics = generateDailyMetrics(days)

  const data = dailyMetrics.flatMap(day => {
    return platforms.map(platform => {
      // Platform-specific multipliers
      const multipliers: Record<Platform, number> = {
        instagram: 1.2,
        twitter: 0.9,
        linkedin: 0.7,
        facebook: 1.0,
        tiktok: 1.5,
        youtube: 1.3,
        pinterest: 0.8,
        threads: 0.6
      }

      const factor = multipliers[platform] || 1.0

      return {
        date: day.dateLabel,
        platform,
        engagement: Math.floor(day.engagement * factor),
        reach: Math.floor(day.reach * factor),
        impressions: Math.floor(day.impressions * factor),
      }
    })
  })

  // Generate summary statistics
  const summary: PlatformPerformance[] = platforms.map(platform => {
    const platformData = data.filter(d => d.platform === platform)
    const avgEngagement = platformData.reduce((sum, d) => sum + d.engagement, 0) / platformData.length
    const avgReach = platformData.reduce((sum, d) => sum + d.reach, 0) / platformData.length

    return {
      platform,
      postCount: Math.floor(days / platforms.length + Math.random() * 10),
      averageEngagement: Math.floor(avgEngagement),
      averageReach: Math.floor(avgReach),
      totalFollowers: Math.floor(10000 + Math.random() * 50000),
      growthRate: 3 + Math.random() * 12,
      bestPerformingContentType: ['Image', 'Video', 'Carousel', 'Text', 'Story'][Math.floor(Math.random() * 5)],
    }
  })

  return { data, summary }
}

// ==================== Content Performance ====================

export function generateBestPerformingContent(count: number = 10): ContentItem[] {
  const platforms: Platform[] = ['instagram', 'twitter', 'linkedin', 'facebook', 'tiktok']
  const contentExamples = [
    "Just launched our new product line! 🚀 Check it out at the link in bio. Limited time offer!",
    "Behind the scenes: How we built this amazing feature from scratch. Thread 🧵",
    "🎉 Celebrating 10K followers! Thank you for your incredible support. Here's what's next...",
    "Quick tip: 5 ways to boost your productivity instantly. Save this post! 📌",
    "Customer spotlight: Meet Sarah, who transformed her business using our platform.",
    "Breaking news: Industry insights you need to know right now 📊",
    "Monday motivation: Your only limit is the mindset you bring to the table.",
    "Join us live tomorrow at 2 PM EST for an exclusive Q&A session!",
    "New blog post: The ultimate guide to [topic]. Link in bio 👆",
    "Poll time! Which feature would you like to see next? Vote below 👇",
  ]

  const whyItWorked = [
    "Strong call-to-action with sense of urgency",
    "Thread format encouraged engagement and discussion",
    "Milestone celebration resonated with audience",
    "Valuable, actionable content saved for later",
    "Authentic customer story built trust",
    "Timely, relevant news content",
    "Inspirational content posted at optimal time",
    "Live event created anticipation and FOMO",
    "Educational content with clear value proposition",
    "Interactive poll encouraged participation",
  ]

  return Array.from({ length: count }, (_, i) => {
    const engagement = Math.floor(2000 + Math.random() * 3000)
    const likes = Math.floor(engagement * (0.6 + Math.random() * 0.1))
    const comments = Math.floor(engagement * (0.2 + Math.random() * 0.1))
    const shares = Math.floor(engagement * (0.1 + Math.random() * 0.05))

    return {
      id: `best-${i}`,
      content: contentExamples[i % contentExamples.length],
      platform: platforms[Math.floor(Math.random() * platforms.length)],
      publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      performance: {
        likes,
        comments,
        shares,
        impressions: engagement * 15,
        reach: engagement * 8,
        engagementScore: Math.floor(85 + Math.random() * 15),
        whyItWorked: whyItWorked[i % whyItWorked.length],
      },
    }
  }).sort((a, b) => b.performance.engagementScore - a.performance.engagementScore)
}

export function generateWorstPerformingContent(count: number = 10): ContentItem[] {
  const platforms: Platform[] = ['instagram', 'twitter', 'linkedin', 'facebook', 'tiktok']
  const contentExamples = [
    "Check out our website for more information.",
    "New update available. Download now.",
    "Happy Friday everyone!",
    "Product announcement: version 2.1 is here.",
    "We're hiring! Apply now.",
    "Read our latest blog post.",
    "Follow us for updates.",
    "New feature released.",
    "Thanks for your support.",
    "Visit our store today.",
  ]

  const improvements = [
    ["Add a clear call-to-action", "Include more visual elements", "Create urgency or excitement"],
    ["Make the headline more compelling", "Add customer benefit", "Use power words"],
    ["Provide value beyond generic greeting", "Ask engaging question", "Share useful tip"],
    ["Highlight key benefits", "Use customer testimonials", "Show before/after"],
    ["Make opportunity more appealing", "Showcase company culture", "Include success stories"],
    ["Tease compelling insight", "Use better headline", "Add visual preview"],
    ["Give reason to follow", "Show unique value", "Run giveaway/contest"],
    ["Explain the benefit", "Show use case", "Include demo video"],
    ["Be more specific", "Share concrete results", "Ask for feedback"],
    ["Create limited-time offer", "Show product benefits", "Include social proof"],
  ]

  return Array.from({ length: count }, (_, i) => {
    const engagement = Math.floor(50 + Math.random() * 150)
    const likes = Math.floor(engagement * 0.7)
    const comments = Math.floor(engagement * 0.2)
    const shares = Math.floor(engagement * 0.1)

    return {
      id: `worst-${i}`,
      content: contentExamples[i % contentExamples.length],
      platform: platforms[Math.floor(Math.random() * platforms.length)],
      publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      performance: {
        likes,
        comments,
        shares,
        impressions: engagement * 20,
        reach: engagement * 12,
        engagementScore: Math.floor(15 + Math.random() * 30),
        improvements: improvements[i % improvements.length],
      },
    }
  }).sort((a, b) => a.performance.engagementScore - b.performance.engagementScore)
}

// ==================== Pillar Performance ====================

export function generatePillarPerformance(): PillarPerformance[] {
  const pillars = [
    { name: 'Education', color: '#3b82f6' },
    { name: 'Inspiration', color: '#10b981' },
    { name: 'Entertainment', color: '#f59e0b' },
    { name: 'Promotion', color: '#ef4444' },
    { name: 'Community', color: '#8b5cf6' },
  ]

  return pillars.map(pillar => ({
    pillar: pillar.name,
    postCount: Math.floor(15 + Math.random() * 25),
    averageEngagement: Math.floor(500 + Math.random() * 1000),
    averageReach: Math.floor(8000 + Math.random() * 12000),
    engagementRate: 3 + Math.random() * 5,
    bestPlatform: ['instagram', 'twitter', 'linkedin', 'facebook'][Math.floor(Math.random() * 4)] as Platform,
  }))
}

// ==================== Optimal Posting Times ====================

export function generateOptimalPostingTimes(): OptimalTimes {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  const heatmapData = days.map(day => {
    const isWeekend = day === 'Saturday' || day === 'Sunday'
    return {
      day,
      hours: Array.from({ length: 24 }, (_, hour) => {
        let base = 20
        if (hour >= 8 && hour <= 20) base = 40
        if (hour === 9 || hour === 12 || hour === 18) base = 80
        if (isWeekend) base *= 0.7

        return {
          hour,
          engagement: Math.min(100, base + Math.random() * 20),
        }
      })
    }
  })

  return {
    heatmapData,
    bestTimes: [
      { day: 'Tuesday', hour: 9, score: 92 },
      { day: 'Wednesday', hour: 12, score: 89 },
      { day: 'Thursday', hour: 18, score: 87 },
      { day: 'Tuesday', hour: 13, score: 85 },
      { day: 'Wednesday', hour: 18, score: 83 },
    ],
    bestDays: ['Tuesday', 'Wednesday', 'Thursday'],
    worstTimes: [
      { day: 'Saturday', hour: 3, score: 12 },
      { day: 'Sunday', hour: 4, score: 15 },
      { day: 'Monday', hour: 2, score: 18 },
    ]
  }
}

// ==================== Power Words ====================

export function generatePowerWordPerformance(): PowerWordPerformance[] {
  const words = [
    'Free', 'New', 'Exclusive', 'Limited', 'Now',
    'Save', 'Guaranteed', 'Amazing', 'Discover', 'Secret',
    'Proven', 'Easy', 'Ultimate', 'Essential', 'Instant'
  ]

  return words.map(word => ({
    word,
    usageCount: Math.floor(10 + Math.random() * 50),
    averageEngagement: Math.floor(500 + Math.random() * 1500),
    engagementLift: 5 + Math.random() * 45,
    conversionRate: 2 + Math.random() * 6,
  })).sort((a, b) => b.engagementLift - a.engagementLift)
}

// ==================== Audience Demographics ====================

export function generateAudienceDemographics(): Demographics {
  return {
    age: [
      { group: '13-17', count: 1200, percentage: 8 },
      { group: '18-24', count: 3500, percentage: 23 },
      { group: '25-34', count: 5200, percentage: 35 },
      { group: '35-44', count: 3000, percentage: 20 },
      { group: '45-54', count: 1500, percentage: 10 },
      { group: '55+', count: 600, percentage: 4 },
    ],
    gender: [
      { type: 'Female', count: 8000, percentage: 54 },
      { type: 'Male', count: 6500, percentage: 43 },
      { type: 'Other', count: 500, percentage: 3 },
    ],
    location: [
      { city: 'New York, NY', count: 2000 },
      { city: 'Los Angeles, CA', count: 1800 },
      { city: 'Chicago, IL', count: 1200 },
      { city: 'Houston, TX', count: 1000 },
      { city: 'Miami, FL', count: 900 },
      { city: 'San Francisco, CA', count: 850 },
      { city: 'Seattle, WA', count: 700 },
      { city: 'Boston, MA', count: 650 },
      { city: 'Austin, TX', count: 600 },
      { city: 'Denver, CO', count: 500 },
    ],
    interests: [
      { topic: 'Technology', count: 7000, percentage: 47 },
      { topic: 'Business', count: 5500, percentage: 37 },
      { topic: 'Marketing', count: 4800, percentage: 32 },
      { topic: 'Design', count: 3200, percentage: 21 },
      { topic: 'Entrepreneurship', count: 3000, percentage: 20 },
      { topic: 'Productivity', count: 2500, percentage: 17 },
      { topic: 'Social Media', count: 2200, percentage: 15 },
      { topic: 'Innovation', count: 1800, percentage: 12 },
    ],
  }
}

// ==================== Audience Growth ====================

export function generateAudienceGrowth(days: number = 90): GrowthData {
  const data = []
  let followers = 10000
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)

    const growthRate = 1 + (i / days) * 0.5 // Accelerating growth
    const variance = 0.7 + Math.random() * 0.6
    const newFollowers = Math.floor(50 * growthRate * variance)

    followers += newFollowers

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      followers,
      newFollowers,
    })
  }

  const totalGrowth = followers - 10000
  const growthRate = (totalGrowth / 10000) * 100
  const averageDailyGrowth = totalGrowth / days

  return {
    timeSeriesData: data,
    totalGrowth,
    growthRate,
    averageDailyGrowth,
  }
}

// ==================== Sentiment Analysis ====================

export function generateSentimentAnalysis(days: number = 30): SentimentData {
  const data = []
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)

    // Mostly positive with some variation
    const positive = 60 + Math.random() * 20
    const negative = 10 + Math.random() * 15
    const neutral = 100 - positive - negative

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      positive: Math.floor(positive),
      negative: Math.floor(negative),
      neutral: Math.floor(neutral),
      score: Math.floor(positive - negative + 50), // 0-100 scale
    })
  }

  const avgScore = data.reduce((sum, d) => sum + d.score, 0) / data.length

  return {
    timeSeriesData: data,
    overallScore: Math.floor(avgScore),
    positivePercentage: Math.floor(data.reduce((sum, d) => sum + d.positive, 0) / data.length),
    negativePercentage: Math.floor(data.reduce((sum, d) => sum + d.negative, 0) / data.length),
    neutralPercentage: Math.floor(data.reduce((sum, d) => sum + d.neutral, 0) / data.length),
  }
}

// ==================== Learning Patterns ====================

export function generateLearningPatterns(): LearningPattern[] {
  const patterns = [
    {
      type: 'content_format',
      pattern: 'Video content generates 3.2x more engagement than static images',
      impact: '+220% engagement rate',
      impactValue: 220,
      confidence: 0.92,
      dataPoints: 156,
      autoApplied: true,
      recommendation: 'Prioritize video content creation, especially short-form videos under 60 seconds',
    },
    {
      type: 'posting_time',
      pattern: 'Posts published on Tuesday at 1 PM get 45% more engagement',
      impact: '+45% engagement',
      impactValue: 45,
      confidence: 0.88,
      dataPoints: 243,
      autoApplied: true,
      recommendation: 'Schedule high-priority content for Tuesdays at 1 PM EST',
    },
    {
      type: 'hashtags',
      pattern: 'Using 5-7 hashtags performs better than 1-3 or 10+ hashtags',
      impact: '+32% reach',
      impactValue: 32,
      confidence: 0.85,
      dataPoints: 312,
      autoApplied: false,
      recommendation: 'Aim for 5-7 relevant hashtags per post for optimal reach',
    },
    {
      type: 'content_length',
      pattern: 'Captions between 100-150 characters get highest engagement',
      impact: '+28% engagement',
      impactValue: 28,
      confidence: 0.81,
      dataPoints: 287,
      autoApplied: true,
      recommendation: 'Keep captions concise and impactful, around 125 characters',
    },
    {
      type: 'cta',
      pattern: 'Posts with questions in the caption get 67% more comments',
      impact: '+67% comments',
      impactValue: 67,
      confidence: 0.90,
      dataPoints: 198,
      autoApplied: false,
      recommendation: 'End posts with engaging questions to drive discussion',
    },
    {
      type: 'topic',
      pattern: 'Industry insights and tips get 2.5x higher engagement than promotional content',
      impact: '+150% engagement',
      impactValue: 150,
      confidence: 0.87,
      dataPoints: 223,
      autoApplied: true,
      recommendation: 'Follow 80/20 rule: 80% value content, 20% promotional',
    },
    {
      type: 'visual_style',
      pattern: 'Bright, high-contrast images get 38% more saves',
      impact: '+38% saves',
      impactValue: 38,
      confidence: 0.79,
      dataPoints: 167,
      autoApplied: false,
      recommendation: 'Use vibrant colors and high contrast in visual content',
    },
    {
      type: 'content_format',
      pattern: 'Carousel posts have 1.4x longer view time than single images',
      impact: '+40% view time',
      impactValue: 40,
      confidence: 0.84,
      dataPoints: 134,
      autoApplied: false,
      recommendation: 'Break educational content into carousel format',
    },
    {
      type: 'negative_pattern',
      pattern: 'Posts with more than 3 emojis see 22% lower engagement',
      impact: '-22% engagement',
      impactValue: -22,
      confidence: 0.76,
      dataPoints: 189,
      autoApplied: true,
      recommendation: 'Limit emoji use to 2-3 per post for professional tone',
    },
    {
      type: 'negative_pattern',
      pattern: 'Late-night posts (11 PM - 6 AM) get 45% less engagement',
      impact: '-45% engagement',
      impactValue: -45,
      confidence: 0.93,
      dataPoints: 278,
      autoApplied: true,
      recommendation: 'Avoid scheduling content during late-night hours',
    },
  ]

  return patterns.map((p, i) => ({ ...p, id: `pattern-${i}` }))
}

// ==================== Competitive Analysis ====================

export function generateCompetitiveActivities(): CompetitiveActivity[] {
  const competitors = ['Competitor A', 'Competitor B', 'Competitor C', 'Competitor D', 'Competitor E']
  const activities: CompetitiveActivity[] = []

  const activityTypes: CompetitiveActivity['activityType'][] = [
    'new_content', 'product_launch', 'messaging_shift', 'website_change', 'reputation_change'
  ]

  for (let i = 0; i < 15; i++) {
    const competitor = competitors[Math.floor(Math.random() * competitors.length)]
    const type = activityTypes[Math.floor(Math.random() * activityTypes.length)]
    const daysAgo = Math.floor(Math.random() * 7)

    activities.push({
      id: `activity-${i}`,
      competitorName: competitor,
      activityType: type,
      description: getActivityDescription(type, competitor),
      detectedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      impact: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
      suggestedResponse: getSuggestedResponse(type),
    })
  }

  return activities.sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())
}

function getActivityDescription(type: string, competitor: string): string {
  const descriptions: Record<string, string> = {
    new_content: `${competitor} posted engaging content about industry trends that's getting high engagement`,
    product_launch: `${competitor} announced a new product feature that addresses market pain points`,
    messaging_shift: `${competitor} changed their positioning to focus more on sustainability`,
    website_change: `${competitor} redesigned their website with improved UX and faster load times`,
    reputation_change: `${competitor} received positive press coverage in major industry publications`,
  }
  return descriptions[type] || `${competitor} made significant changes in their marketing approach`
}

function getSuggestedResponse(type: string): string {
  const responses: Record<string, string> = {
    new_content: 'Create similar content highlighting your unique value proposition and expertise',
    product_launch: 'Consider accelerating your product roadmap or highlighting your existing advantages',
    messaging_shift: 'Evaluate if this positioning resonates with your target audience',
    website_change: 'Review your website UX and consider improvements to stay competitive',
    reputation_change: 'Increase PR efforts and seek similar media opportunities',
  }
  return responses[type] || 'Monitor closely and adjust strategy as needed'
}

export function generateCompetitiveGaps(): CompetitiveGap[] {
  return [
    {
      id: 'gap-1',
      area: 'Content Frequency',
      yourMetric: 12,
      competitorAverage: 18,
      gap: -33,
      severity: 'medium',
      recommendation: 'Increase posting frequency to match industry standard of 18 posts/month',
      estimatedImpact: '+25% reach potential',
    },
    {
      id: 'gap-2',
      area: 'Video Content',
      yourMetric: 20,
      competitorAverage: 45,
      gap: -56,
      severity: 'high',
      recommendation: 'Significantly increase video content production - competitors posting 2-3x more videos',
      estimatedImpact: '+150% engagement potential',
    },
    {
      id: 'gap-3',
      area: 'Response Time',
      yourMetric: 4.2,
      competitorAverage: 1.5,
      gap: -64,
      severity: 'high',
      recommendation: 'Implement faster response strategy - average response time is 4.2 hours vs 1.5 hours',
      estimatedImpact: '+40% customer satisfaction',
    },
    {
      id: 'gap-4',
      area: 'Follower Growth Rate',
      yourMetric: 3.2,
      competitorAverage: 2.1,
      gap: 52,
      severity: 'positive',
      recommendation: 'Your growth rate exceeds competitors - continue current strategy',
      estimatedImpact: 'Maintain competitive advantage',
    },
    {
      id: 'gap-5',
      area: 'Engagement Rate',
      yourMetric: 4.8,
      competitorAverage: 3.5,
      gap: 37,
      severity: 'positive',
      recommendation: 'Your engagement outperforms competitors - document and scale successful tactics',
      estimatedImpact: 'Leverage for case studies',
    },
  ]
}

// ==================== Export All ====================

export const MockDataGenerator = {
  generateDailyMetrics,
  generatePerformanceByPlatform,
  generateBestPerformingContent,
  generateWorstPerformingContent,
  generatePillarPerformance,
  generateOptimalPostingTimes,
  generatePowerWordPerformance,
  generateAudienceDemographics,
  generateAudienceGrowth,
  generateSentimentAnalysis,
  generateLearningPatterns,
  generateCompetitiveActivities,
  generateCompetitiveGaps,
}
