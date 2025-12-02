/**
 * Smart Pick Generator Service
 *
 * Intelligently selects and scores 3-5 best campaign ideas from available
 * Synapse insights based on relevance, timeliness, and evidence quality
 *
 * Scoring Algorithm:
 * - Relevance: How well insights match business/industry
 * - Timeliness: How time-sensitive the content is
 * - Evidence Quality: Strength of supporting data
 * - Confidence: AI model confidence in the insight
 *
 * Created: 2025-11-15
 */

import type { DeepContext } from '@/types/synapse/deepContext.types'
import type { SynapseInsight } from '@/types/synapse/synapse.types'
import type {
  SmartPick,
  CampaignType,
  SmartPickGenerationOptions,
  SmartPickGenerationResult,
  ScoringWeights,
  DataSourceInfo
} from '@/types/smart-picks.types'
import { DEFAULT_SCORING_WEIGHTS } from '@/types/smart-picks.types'
import { generateSynapses, type SynapseInput } from '@/services/synapse/SynapseGenerator'
import { chat } from '@/lib/openrouter'
import { ErrorHandlerService, logError } from '../errors/error-handler.service'

// ============================================================================
// MAIN API
// ============================================================================

/**
 * Generate Smart Picks from DeepContext
 *
 * @param context - Deep business intelligence context
 * @param campaignType - Optional filter by campaign type
 * @param options - Generation options
 * @returns Smart picks with scoring and recommendations
 */
export async function generateSmartPicks(
  context: DeepContext,
  campaignType?: CampaignType,
  options: SmartPickGenerationOptions & { cachedSynapses?: SynapseInsight[] } = {}
): Promise<SmartPickGenerationResult> {
  const startTime = Date.now()

  console.log('[SmartPickGenerator] Generating smart picks...')
  console.log('[SmartPickGenerator] Campaign type filter:', campaignType || 'all')

  const {
    maxPicks = 5,
    minConfidence = 0.6,
    preferTimely = true,
    includePreview = true,
    cachedSynapses
  } = options

  try {
    // Step 1: Generate or use existing Synapse insights
    const insights = await getOrGenerateInsights(context, cachedSynapses)

    console.log(`[SmartPickGenerator] Found ${insights.length} total insights`)

    // Step 2: Filter low-confidence insights
    const qualityInsights = insights.filter(i => i.confidence >= minConfidence)

    console.log(`[SmartPickGenerator] ${qualityInsights.length} insights meet confidence threshold (>=${minConfidence})`)

    // Step 3: Generate candidates for each campaign type
    const candidates: SmartPick[] = []

    // Handle multi-post and single-post campaign types
    if (campaignType === 'multi-post' || campaignType === 'single-post') {
      // For multi-post and single-post, generate all types
      candidates.push(...await generateAuthorityBuilderPicks(context, qualityInsights, includePreview))
      candidates.push(...await generateSocialProofPicks(context, qualityInsights, includePreview))
      candidates.push(...await generateLocalPulsePicks(context, qualityInsights, includePreview))
    } else {
      // Handle specific campaign types
      if (!campaignType || campaignType === 'authority-builder') {
        candidates.push(...await generateAuthorityBuilderPicks(context, qualityInsights, includePreview))
      }

      if (!campaignType || campaignType === 'social-proof') {
        candidates.push(...await generateSocialProofPicks(context, qualityInsights, includePreview))
      }

      if (!campaignType || campaignType === 'local-pulse') {
        candidates.push(...await generateLocalPulsePicks(context, qualityInsights, includePreview))
      }
    }

    console.log(`[SmartPickGenerator] Generated ${candidates.length} candidate picks`)

    // Step 4: Score all candidates
    const scoredPicks = candidates.map(pick => scoreSmartPick(pick, context, preferTimely))

    // Step 5: Sort by overall score
    scoredPicks.sort((a, b) => b.overallScore - a.overallScore)

    // Step 6: Take top N
    const topPicks = scoredPicks.slice(0, maxPicks)

    const generationTimeMs = Date.now() - startTime

    console.log(`[SmartPickGenerator] Selected ${topPicks.length} top picks in ${generationTimeMs}ms`)

    return {
      picks: topPicks,
      context,
      metadata: {
        totalCandidates: candidates.length,
        picksGenerated: topPicks.length,
        generationTimeMs,
        strategiesUsed: ['authority-builder', 'social-proof', 'local-pulse']
      }
    }
  } catch (error) {
    console.error('[SmartPickGenerator] Generation failed:', error)
    logError(error, { campaignType, businessId: context.business?.profile?.name })

    // Return template-based picks as fallback
    const fallbackPicks = campaignType
      ? generateTemplatePicks(context, campaignType)
      : [
          ...generateTemplatePicks(context, 'authority-builder'),
          ...generateTemplatePicks(context, 'social-proof'),
          ...generateTemplatePicks(context, 'local-pulse')
        ].slice(0, maxPicks)

    const generationTimeMs = Date.now() - startTime

    return {
      picks: fallbackPicks,
      context,
      metadata: {
        totalCandidates: 0,
        picksGenerated: fallbackPicks.length,
        generationTimeMs,
        strategiesUsed: ['template-fallback']
      }
    }
  }
}

// ============================================================================
// INSIGHT GENERATION
// ============================================================================

async function getOrGenerateInsights(context: DeepContext, cachedSynapses?: SynapseInsight[]): Promise<SynapseInsight[]> {
  // Use cached synapses if provided
  if (cachedSynapses && cachedSynapses.length > 0) {
    console.log('[SmartPickGenerator] Using cached Synapse insights:', cachedSynapses.length, 'insights')
    return cachedSynapses
  }

  // Generate new insights using Synapse Generator
  console.log('[SmartPickGenerator] Generating new insights...')

  const synapseInput: SynapseInput = {
    business: {
      name: context.business.profile.name,
      industry: context.business.profile.industry,
      location: {
        city: context.business.profile.location.city,
        state: context.business.profile.location.state
      }
    },
    intelligence: context
  }

  const result = await generateSynapses(synapseInput)

  return result.synapses
}

// ============================================================================
// CAMPAIGN TYPE STRATEGIES
// ============================================================================

/**
 * Authority Builder: Industry expertise, data-driven insights
 */
async function generateAuthorityBuilderPicks(
  context: DeepContext,
  insights: SynapseInsight[],
  includePreview: boolean
): Promise<SmartPick[]> {
  // Look for insights with strong evidence and industry connections
  const authorityInsights = insights.filter(insight =>
    insight.type === 'unexpected_connection' ||
    insight.type === 'counter_intuitive' ||
    insight.type === 'predictive_opportunity' ||
    (insight.evidence && insight.evidence.length >= 2)
  )

  const picks: SmartPick[] = []

  for (const insight of authorityInsights.slice(0, 3)) {
    const pick: SmartPick = {
      id: `authority-${insight.id}`,
      campaignType: 'authority-builder',
      title: `Industry Insight: ${truncate(insight.insight, 60)}`,
      description: insight.insight,
      insights: [insight],
      preview: includePreview
        ? await generatePreview(insight, context, 'authority-builder')
        : { headline: '', hook: '', platform: 'LinkedIn' },
      confidence: insight.confidence,
      relevance: 0, // Will be scored later
      timeliness: 0,
      evidenceQuality: calculateEvidenceQuality(insight),
      overallScore: 0,
      dataSources: extractDataSources(context, insight),
      reasoning: `Strong evidence-based insight about ${context.business.profile.industry}. Perfect for establishing thought leadership on LinkedIn.`,
      expectedPerformance: {
        engagement: 'medium',
        reach: 'medium',
        conversions: 'low'
      },
      metadata: {
        generatedAt: new Date()
      }
    }

    picks.push(pick)
  }

  return picks
}

/**
 * Social Proof: Reviews, testimonials, customer success
 */
async function generateSocialProofPicks(
  context: DeepContext,
  insights: SynapseInsight[],
  includePreview: boolean
): Promise<SmartPick[]> {
  // Look for insights related to customer psychology or social validation
  const socialInsights = insights.filter(insight =>
    insight.type === 'counter_intuitive' ||  // Accept Synapse insights
    insight.type === 'deep_psychology' ||
    insight.type === 'cultural_moment' ||
    (insight.insight.toLowerCase().includes('customer') ||
     insight.insight.toLowerCase().includes('review') ||
     insight.insight.toLowerCase().includes('testimonial') ||
     insight.whyProfound)  // Any profound insight can work for social proof
  )

  const picks: SmartPick[] = []

  for (const insight of socialInsights.slice(0, 3)) {
    const pick: SmartPick = {
      id: `social-${insight.id}`,
      campaignType: 'social-proof',
      title: `Customer Story: ${truncate(insight.insight, 60)}`,
      description: insight.insight,
      insights: [insight],
      preview: includePreview
        ? await generatePreview(insight, context, 'social-proof')
        : { headline: '', hook: '', platform: 'Facebook' },
      confidence: insight.confidence,
      relevance: 0,
      timeliness: 0,
      evidenceQuality: calculateEvidenceQuality(insight),
      overallScore: 0,
      dataSources: extractDataSources(context, insight),
      reasoning: `Leverages customer psychology and social validation. Great for Facebook and Instagram.`,
      expectedPerformance: {
        engagement: 'high',
        reach: 'high',
        conversions: 'medium'
      },
      metadata: {
        generatedAt: new Date()
      }
    }

    picks.push(pick)
  }

  return picks
}

/**
 * Local Pulse: Weather, events, local news
 */
async function generateLocalPulsePicks(
  context: DeepContext,
  insights: SynapseInsight[],
  includePreview: boolean
): Promise<SmartPick[]> {
  // Check if we have location-based intelligence
  const hasLocation = context.business.profile.location.city
  const hasWeather = context.realTimeCultural?.currentContext?.some(c => c.source === 'weather')
  const hasLocalNews = context.realTimeCultural?.currentContext?.some(c => c.source === 'local_news')

  // Look for time-sensitive insights (work even without specific location)
  const localInsights = insights.filter(insight =>
    insight.type === 'counter_intuitive' ||  // Accept Synapse insights
    insight.whyNow.toLowerCase().includes('now') ||
    insight.whyNow.toLowerCase().includes('today') ||
    insight.whyNow.toLowerCase().includes('week') ||
    insight.whyNow.toLowerCase().includes('current') ||  // Current trends/events
    (hasWeather && insight.insight.toLowerCase().includes('weather')) ||
    (hasLocalNews && insight.type === 'cultural_moment')
  )

  // If no location but we have time-sensitive insights, still use them
  if (!hasLocation && localInsights.length === 0) {
    console.log('[SmartPickGenerator] No location data and no time-sensitive insights for local pulse')
    return []
  }

  const picks: SmartPick[] = []

  for (const insight of localInsights.slice(0, 3)) {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Local content expires in 1 week

    const pick: SmartPick = {
      id: `local-${insight.id}`,
      campaignType: 'local-pulse',
      title: `Local Moment: ${truncate(insight.insight, 60)}`,
      description: insight.insight,
      insights: [insight],
      preview: includePreview
        ? await generatePreview(insight, context, 'local-pulse')
        : { headline: '', hook: '', platform: 'Instagram' },
      confidence: insight.confidence,
      relevance: 0,
      timeliness: 0.9, // Local content is highly time-sensitive
      evidenceQuality: calculateEvidenceQuality(insight),
      overallScore: 0,
      dataSources: extractDataSources(context, insight),
      reasoning: `Time-sensitive content${context.business.profile.location.city ? ` for ${context.business.profile.location.city}` : ''}. Best posted within 48 hours.`,
      expectedPerformance: {
        engagement: 'high',
        reach: 'medium',
        conversions: 'medium'
      },
      metadata: {
        generatedAt: new Date(),
        expiresAt
      }
    }

    picks.push(pick)
  }

  return picks
}

// ============================================================================
// SCORING LOGIC
// ============================================================================

/**
 * Score a Smart Pick using weighted algorithm
 */
function scoreSmartPick(
  pick: SmartPick,
  context: DeepContext,
  preferTimely: boolean
): SmartPick {
  // Calculate relevance: How well does this match the business?
  const relevance = calculateRelevance(pick, context)

  // Calculate timeliness: How time-sensitive is this?
  const timeliness = calculateTimeliness(pick)

  // Evidence quality already calculated
  const evidenceQuality = pick.evidenceQuality

  // Confidence from AI model
  const confidence = pick.confidence

  // Apply weights
  const weights = {
    ...DEFAULT_SCORING_WEIGHTS,
    timeliness: preferTimely ? 0.35 : 0.25, // Boost timeliness if preferred
    relevance: preferTimely ? 0.25 : 0.35
  }

  const overallScore =
    (relevance * weights.relevance) +
    (timeliness * weights.timeliness) +
    (evidenceQuality * weights.evidenceQuality) +
    (confidence * weights.confidence)

  return {
    ...pick,
    relevance,
    timeliness,
    overallScore
  }
}

/**
 * Calculate how relevant this pick is to the business
 */
function calculateRelevance(pick: SmartPick, context: DeepContext): number {
  let score = 0.5 // Base score

  const businessKeywords = [
    context.business.profile.industry.toLowerCase(),
    context.business.profile.location.city.toLowerCase(),
    context.business.profile.location.state.toLowerCase()
  ]

  const insightText = pick.insights.map(i => i.insight.toLowerCase()).join(' ')

  // Boost if insight mentions business-specific keywords
  for (const keyword of businessKeywords) {
    if (insightText.includes(keyword)) {
      score += 0.15
    }
  }

  // Boost if matches campaign type intent
  if (pick.campaignType === 'local-pulse' && context.business.profile.location.city) {
    score += 0.1
  }

  if (pick.campaignType === 'authority-builder' && pick.evidenceQuality > 0.7) {
    score += 0.1
  }

  if (pick.campaignType === 'social-proof' && insightText.includes('customer')) {
    score += 0.1
  }

  return Math.min(score, 1.0)
}

/**
 * Calculate timeliness score
 */
function calculateTimeliness(pick: SmartPick): number {
  const now = new Date()

  // Check if pick has expiration
  if (pick.metadata.expiresAt) {
    const timeLeft = pick.metadata.expiresAt.getTime() - now.getTime()
    const daysLeft = timeLeft / (1000 * 60 * 60 * 24)

    if (daysLeft < 1) return 1.0 // Extremely urgent
    if (daysLeft < 3) return 0.9
    if (daysLeft < 7) return 0.7
    return 0.5
  }

  // Check for time-sensitive keywords in whyNow
  const whyNow = pick.insights.map(i => i.whyNow.toLowerCase()).join(' ')

  if (whyNow.includes('today') || whyNow.includes('now')) return 0.9
  if (whyNow.includes('this week') || whyNow.includes('currently')) return 0.7
  if (whyNow.includes('this month') || whyNow.includes('trending')) return 0.6
  if (whyNow.includes('seasonal')) return 0.5

  return 0.4 // Evergreen content
}

/**
 * Calculate evidence quality score
 */
function calculateEvidenceQuality(insight: SynapseInsight): number {
  const evidenceCount = insight.evidence?.length || 0

  if (evidenceCount === 0) return 0.3
  if (evidenceCount === 1) return 0.5
  if (evidenceCount === 2) return 0.7
  if (evidenceCount >= 3) return 0.9

  return 0.5
}

// ============================================================================
// DATA SOURCE EXTRACTION
// ============================================================================

/**
 * Extract data sources used for this insight
 */
function extractDataSources(context: DeepContext, insight: SynapseInsight): DataSourceInfo[] {
  const sources: DataSourceInfo[] = []
  const addedSources = new Set<string>()

  // Map of source detection to DataSourceInfo
  const sourceMap: Record<string, DataSourceInfo> = {
    weather: {
      source: 'weather',
      icon: 'Cloud',
      label: 'Weather Data',
      verified: true,
      freshness: 'hourly',
      dataPoints: 0
    },
    reviews: {
      source: 'reviews',
      icon: 'Star',
      label: 'Customer Reviews',
      verified: true,
      freshness: 'daily',
      dataPoints: 0
    },
    trends: {
      source: 'trends',
      icon: 'TrendingUp',
      label: 'Search Trends',
      verified: true,
      freshness: 'real-time',
      dataPoints: 0
    },
    news: {
      source: 'news',
      icon: 'Newspaper',
      label: 'News Articles',
      verified: true,
      freshness: 'hourly',
      dataPoints: 0
    },
    reddit: {
      source: 'reddit',
      icon: 'MessageCircle',
      label: 'Reddit Discussions',
      verified: true,
      freshness: 'real-time',
      dataPoints: 0
    },
    youtube: {
      source: 'youtube',
      icon: 'Video',
      label: 'YouTube Trends',
      verified: true,
      freshness: 'daily',
      dataPoints: 0
    },
    competitors: {
      source: 'competitors',
      icon: 'Target',
      label: 'Competitor Analysis',
      verified: true,
      freshness: 'weekly',
      dataPoints: 0
    },
    industry: {
      source: 'industry',
      icon: 'Building',
      label: 'Industry Data',
      verified: true,
      freshness: 'static',
      dataPoints: 0
    }
  }

  // Detect sources from insight evidence
  if (insight.evidence) {
    for (const evidence of insight.evidence) {
      const evidenceLower = evidence.toLowerCase()

      if (evidenceLower.includes('weather') && !addedSources.has('weather')) {
        sources.push({ ...sourceMap.weather, dataPoints: 1 })
        addedSources.add('weather')
      }
      if ((evidenceLower.includes('review') || evidenceLower.includes('rating')) && !addedSources.has('reviews')) {
        sources.push({ ...sourceMap.reviews, dataPoints: 1 })
        addedSources.add('reviews')
      }
      if ((evidenceLower.includes('trend') || evidenceLower.includes('search')) && !addedSources.has('trends')) {
        sources.push({ ...sourceMap.trends, dataPoints: 1 })
        addedSources.add('trends')
      }
      if ((evidenceLower.includes('news') || evidenceLower.includes('article')) && !addedSources.has('news')) {
        sources.push({ ...sourceMap.news, dataPoints: 1 })
        addedSources.add('news')
      }
      if (evidenceLower.includes('reddit') && !addedSources.has('reddit')) {
        sources.push({ ...sourceMap.reddit, dataPoints: 1 })
        addedSources.add('reddit')
      }
      if (evidenceLower.includes('youtube') && !addedSources.has('youtube')) {
        sources.push({ ...sourceMap.youtube, dataPoints: 1 })
        addedSources.add('youtube')
      }
      if ((evidenceLower.includes('competitor') || evidenceLower.includes('competition')) && !addedSources.has('competitors')) {
        sources.push({ ...sourceMap.competitors, dataPoints: 1 })
        addedSources.add('competitors')
      }
    }
  }

  // Default: add industry data
  if (sources.length === 0) {
    sources.push({ ...sourceMap.industry, dataPoints: 1 })
  }

  return sources
}

// ============================================================================
// PREVIEW GENERATION
// ============================================================================

/**
 * Generate a quick preview (headline + hook) for a pick
 */
async function generatePreview(
  insight: SynapseInsight,
  context: DeepContext,
  campaignType: CampaignType
): Promise<{ headline: string; hook: string; platform: string }> {
  const platform = campaignType === 'authority-builder' ? 'LinkedIn' :
                   campaignType === 'social-proof' ? 'Facebook' :
                   'Instagram'

  const prompt = `Generate a compelling social media post preview for ${platform}.

Business: ${context.business.profile.name} (${context.business.profile.industry})
Location: ${context.business.profile.location.city}, ${context.business.profile.location.state}

Campaign Type: ${campaignType}
Insight: ${insight.insight}
Why Now: ${insight.whyNow}

Generate ONLY:
1. Headline (8-12 words, attention-grabbing)
2. Hook (first sentence, 15-25 words, creates curiosity)

Format your response as JSON:
{
  "headline": "Your headline here",
  "hook": "Your hook here"
}

Make it specific to the business and actionable.`

  try {
    const response = await ErrorHandlerService.executeWithRetry(
      async () => {
        return await chat([{ role: 'user', content: prompt }], {
          model: 'anthropic/claude-sonnet-4-5-20250929',
          temperature: 0.8,
          maxTokens: 300
        })
      },
      {
        maxAttempts: 3,
        initialDelayMs: 2000,
      },
      undefined,
      [
        // Fallback: Return template-based preview
        {
          name: 'template_fallback',
          description: 'Generate preview from template',
          execute: async () => {
            return JSON.stringify({
              headline: insight.contentAngle,
              hook: insight.insight.substring(0, 100)
            })
          }
        }
      ]
    )

    const parsed = JSON.parse(response)

    return {
      headline: parsed.headline || insight.contentAngle,
      hook: parsed.hook || insight.insight.substring(0, 100),
      platform
    }
  } catch (error) {
    console.error('[SmartPickGenerator] Preview generation failed:', error)
    logError(error, { campaignType, insightId: insight.id })

    // Fallback
    return {
      headline: insight.contentAngle,
      hook: insight.insight.substring(0, 100),
      platform
    }
  }
}

// ============================================================================
// TEMPLATE FALLBACK
// ============================================================================

/**
 * Generate template-based smart picks as fallback when AI generation fails
 */
function generateTemplatePicks(
  context: DeepContext,
  campaignType: CampaignType
): SmartPick[] {
  // Generate basic smart picks from templates as fallback
  const templates: Record<CampaignType, SmartPick[]> = {
    'authority-builder': [
      {
        id: 'smart-pick-authority-1',
        campaignType: 'authority-builder',
        title: 'Industry Insights Campaign',
        description: 'Educational content that positions you as an industry expert',
        insights: [],
        preview: {
          headline: 'Share Your Expertise',
          hook: 'Educational content that positions you as an industry expert',
          platform: 'LinkedIn'
        },
        confidence: 0.5,
        relevance: 0.5,
        timeliness: 0.5,
        evidenceQuality: 0.5,
        overallScore: 0.5,
        dataSources: [],
        reasoning: 'Template-generated smart pick',
        expectedPerformance: {
          engagement: 'medium',
          reach: 'medium',
          conversions: 'low'
        },
        metadata: {
          generatedAt: new Date()
        }
      }
    ],
    'social-proof': [
      {
        id: 'smart-pick-trust-1',
        campaignType: 'social-proof',
        title: 'Customer Success Stories',
        description: 'Showcase authentic customer testimonials and success stories',
        insights: [],
        preview: {
          headline: 'See Real Results',
          hook: 'Showcase authentic customer testimonials and success stories',
          platform: 'Facebook'
        },
        confidence: 0.5,
        relevance: 0.5,
        timeliness: 0.5,
        evidenceQuality: 0.5,
        overallScore: 0.5,
        dataSources: [],
        reasoning: 'Template-generated smart pick',
        expectedPerformance: {
          engagement: 'high',
          reach: 'high',
          conversions: 'medium'
        },
        metadata: {
          generatedAt: new Date()
        }
      }
    ],
    'local-pulse': [
      {
        id: 'smart-pick-local-1',
        campaignType: 'local-pulse',
        title: 'Local Community Connection',
        description: 'Connect with local events and community initiatives',
        insights: [],
        preview: {
          headline: 'Supporting Our Local Community',
          hook: 'Connect with local events and community initiatives',
          platform: 'Instagram'
        },
        confidence: 0.5,
        relevance: 0.5,
        timeliness: 0.5,
        evidenceQuality: 0.5,
        overallScore: 0.5,
        dataSources: [],
        reasoning: 'Template-generated smart pick',
        expectedPerformance: {
          engagement: 'high',
          reach: 'medium',
          conversions: 'medium'
        },
        metadata: {
          generatedAt: new Date()
        }
      }
    ],
    'multi-post': [],
    'single-post': []
  }

  return templates[campaignType] || templates['authority-builder']
}

// ============================================================================
// UTILITIES
// ============================================================================

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}
