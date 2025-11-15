/**
 * Brand Health Calculator Service
 * Calculates comprehensive brand health score using 4-metric system:
 * - Clarity (25%): Message clarity, UVP strength, jargon-free communication
 * - Consistency (20%): Brand element alignment, pillar coverage, cross-platform coherence
 * - Engagement (30%): Psychology score, emotional triggers, power word density
 * - Differentiation (25%): Competitive gaps, UVP uniqueness, breakthrough potential
 */

import type { BrandProfile } from '@/types'
import { ContentPsychologyEngine } from '@/services/synapse/generation/ContentPsychologyEngine'

// ============================================================================
// Type Definitions
// ============================================================================

export interface BrandHealthScore {
  overall: number // 0-100
  clarity: MetricScore
  consistency: MetricScore
  engagement: MetricScore
  differentiation: MetricScore
  breakdown: HealthBreakdown
  comparedToIndustry: IndustryComparison
  generatedAt: string
}

export interface MetricScore {
  score: number // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  label: string
  description: string
  strengths: string[]
  improvements: string[]
  impact: 'critical' | 'high' | 'medium' | 'low'
}

export interface HealthBreakdown {
  totalPoints: number
  maxPoints: number
  clarityPoints: number
  consistencyPoints: number
  engagementPoints: number
  differentiationPoints: number
  weights: {
    clarity: number
    consistency: number
    engagement: number
    differentiation: number
  }
}

export interface IndustryComparison {
  industryAverage: number
  yourScore: number
  percentile: number // 0-100 (95 = top 5%)
  topPerformers: number // Average of top 10%
  gap: number // Difference from industry average
  status: 'leading' | 'above-average' | 'average' | 'below-average' | 'trailing'
}

export interface BrandHealthInput {
  brandProfile: BrandProfile
  competitors?: any[]
  industryData?: any
  seoMetrics?: any
  websiteData?: any
}

// ============================================================================
// Main Calculator Class
// ============================================================================

export class BrandHealthCalculator {
  /**
   * Calculate comprehensive brand health score
   */
  static async calculate(input: BrandHealthInput): Promise<BrandHealthScore> {
    try {
      console.log('[BrandHealthCalculator] Starting calculation...')

      // Calculate all 4 metrics in parallel
      const [clarity, consistency, engagement, differentiation] = await Promise.all([
        this.calculateClarity(input),
        this.calculateConsistency(input),
        this.calculateEngagement(input),
        this.calculateDifferentiation(input),
      ])

      // Calculate weighted overall score
      const weights = {
        clarity: 0.25,
        consistency: 0.20,
        engagement: 0.30,
        differentiation: 0.25,
      }

      const overall = Math.round(
        clarity.score * weights.clarity +
        consistency.score * weights.consistency +
        engagement.score * weights.engagement +
        differentiation.score * weights.differentiation
      )

      // Calculate breakdown
      const breakdown: HealthBreakdown = {
        totalPoints: overall,
        maxPoints: 100,
        clarityPoints: Math.round(clarity.score * weights.clarity),
        consistencyPoints: Math.round(consistency.score * weights.consistency),
        engagementPoints: Math.round(engagement.score * weights.engagement),
        differentiationPoints: Math.round(differentiation.score * weights.differentiation),
        weights,
      }

      // Compare to industry
      const comparedToIndustry = this.compareToIndustry(overall, input.industryData)

      console.log('[BrandHealthCalculator] Calculation complete:', {
        overall,
        clarity: clarity.score,
        consistency: consistency.score,
        engagement: engagement.score,
        differentiation: differentiation.score,
      })

      return {
        overall,
        clarity,
        consistency,
        engagement,
        differentiation,
        breakdown,
        comparedToIndustry,
        generatedAt: new Date().toISOString(),
      }
    } catch (error) {
      console.error('[BrandHealthCalculator] Error calculating brand health:', error)

      // Return fallback score
      return this.createFallbackScore(error)
    }
  }

  // ============================================================================
  // Clarity Score (25% weight)
  // ============================================================================

  private static async calculateClarity(input: BrandHealthInput): Promise<MetricScore> {
    const { brandProfile } = input
    let score = 0
    const strengths: string[] = []
    const improvements: string[] = []

    // 1. UVP Clarity (40 points)
    const uvps = brandProfile.full_profile_data?.uvps || []
    if (uvps.length > 0) {
      const primaryUVP = uvps[0]

      // Check UVP length (ideal: 8-15 words)
      const uvpWords = primaryUVP.proposition?.split(' ').length || 0
      if (uvpWords >= 8 && uvpWords <= 15) {
        score += 15
        strengths.push('UVP is concise and clear')
      } else if (uvpWords > 15) {
        score += 8
        improvements.push('UVP could be more concise')
      } else {
        score += 5
        improvements.push('UVP needs more substance')
      }

      // Check UVP has differentiator
      if (primaryUVP.differentiator && primaryUVP.differentiator.length > 10) {
        score += 15
        strengths.push('Clear differentiation stated')
      } else {
        improvements.push('Differentiation unclear')
      }

      // Check for benefit-focused language
      const proposition = (primaryUVP.proposition || '').toLowerCase()
      const benefitWords = ['help', 'achieve', 'improve', 'increase', 'reduce', 'save', 'grow', 'build']
      const hasBenefits = benefitWords.some(word => proposition.includes(word))
      if (hasBenefits) {
        score += 10
        strengths.push('Benefit-focused messaging')
      } else {
        improvements.push('Add customer benefits to messaging')
      }
    } else {
      improvements.push('No UVP defined')
    }

    // 2. Jargon Detection (30 points)
    const positioningStatement = brandProfile.positioning_statement || ''
    const jargonWords = [
      'synergy', 'leverage', 'paradigm', 'disruptive', 'innovative',
      'cutting-edge', 'best-in-class', 'world-class', 'revolutionary',
    ]
    const jargonCount = jargonWords.filter(word =>
      positioningStatement.toLowerCase().includes(word)
    ).length

    if (jargonCount === 0) {
      score += 30
      strengths.push('Jargon-free communication')
    } else if (jargonCount <= 2) {
      score += 20
      improvements.push('Reduce industry jargon')
    } else {
      score += 10
      improvements.push('Too much jargon - simplify language')
    }

    // 3. Message Consistency (30 points)
    const goldenCircle = brandProfile.full_profile_data?.golden_circle
    if (goldenCircle?.why && goldenCircle?.what && goldenCircle?.how) {
      score += 20
      strengths.push('Complete Golden Circle defined')

      // Check if positioning aligns with "Why"
      const why = (goldenCircle.why || '').toLowerCase()
      const positioning = positioningStatement.toLowerCase()
      const whyKeywords = why.split(' ').filter(w => w.length > 4).slice(0, 5)
      const alignment = whyKeywords.some(keyword => positioning.includes(keyword))

      if (alignment) {
        score += 10
        strengths.push('Positioning aligns with purpose')
      } else {
        improvements.push('Better align positioning with brand purpose')
      }
    } else {
      improvements.push('Define complete Golden Circle')
    }

    return {
      score: Math.min(100, score),
      grade: this.scoreToGrade(score),
      label: 'Clarity',
      description: 'How clearly your brand communicates its value',
      strengths,
      improvements,
      impact: score < 60 ? 'critical' : score < 75 ? 'high' : 'medium',
    }
  }

  // ============================================================================
  // Consistency Score (20% weight)
  // ============================================================================

  private static async calculateConsistency(input: BrandHealthInput): Promise<MetricScore> {
    const { brandProfile } = input
    let score = 0
    const strengths: string[] = []
    const improvements: string[] = []

    // 1. Brand Element Alignment (40 points)
    const archetype = brandProfile.full_profile_data?.brand_archetype
    const values = brandProfile.full_profile_data?.brand_values || []
    const voice = brandProfile.full_profile_data?.brand_voice

    if (archetype) {
      score += 15
      strengths.push(`Clear ${archetype} archetype defined`)
    } else {
      improvements.push('Define brand archetype')
    }

    if (values.length >= 3) {
      score += 15
      strengths.push('Core values established')
    } else {
      improvements.push('Define 3+ core brand values')
    }

    if (voice) {
      score += 10
      strengths.push('Brand voice documented')
    } else {
      improvements.push('Document brand voice')
    }

    // 2. Content Pillar Coverage (30 points)
    const pillars = brandProfile.content_pillars || []
    if (pillars.length >= 3) {
      score += 20
      strengths.push('Multiple content pillars defined')

      // Check if pillars have descriptions
      const hasDescriptions = pillars.every(p => p.description && p.description.length > 20)
      if (hasDescriptions) {
        score += 10
        strengths.push('Content pillars well-documented')
      } else {
        improvements.push('Add detailed descriptions to pillars')
      }
    } else {
      improvements.push('Define at least 3 content pillars')
    }

    // 3. Cross-Platform Coherence (30 points)
    const targetAudience = brandProfile.full_profile_data?.target_audience
    const messagingThemes = brandProfile.full_profile_data?.messaging_themes || []

    if (targetAudience) {
      score += 15
      strengths.push('Target audience defined')
    } else {
      improvements.push('Define target audience')
    }

    if (messagingThemes.length >= 3) {
      score += 15
      strengths.push('Consistent messaging themes')
    } else {
      improvements.push('Develop core messaging themes')
    }

    return {
      score: Math.min(100, score),
      grade: this.scoreToGrade(score),
      label: 'Consistency',
      description: 'How consistently your brand shows up',
      strengths,
      improvements,
      impact: score < 50 ? 'high' : score < 70 ? 'medium' : 'low',
    }
  }

  // ============================================================================
  // Engagement Score (30% weight) - Uses Synapse
  // ============================================================================

  private static async calculateEngagement(input: BrandHealthInput): Promise<MetricScore> {
    const { brandProfile } = input
    let score = 0
    const strengths: string[] = []
    const improvements: string[] = []

    // 1. Synapse Psychology Score (50 points)
    try {
      const positioningStatement = brandProfile.positioning_statement || ''
      const uvps = brandProfile.full_profile_data?.uvps || []
      const primaryUVP = uvps[0]?.proposition || ''

      const textToAnalyze = `${positioningStatement} ${primaryUVP}`.trim()

      if (textToAnalyze.length > 10) {
        const psychologyEngine = new ContentPsychologyEngine()
        const psychologyScore = await psychologyEngine.analyzePsychology(
          textToAnalyze,
          brandProfile.full_profile_data || {}
        )

        // Psychology score is 0-10, convert to 0-50
        const psychPoints = Math.round((psychologyScore / 10) * 50)
        score += psychPoints

        if (psychologyScore >= 8) {
          strengths.push('Strong psychological appeal')
        } else if (psychologyScore >= 6) {
          strengths.push('Good psychological foundation')
          improvements.push('Enhance emotional triggers')
        } else {
          improvements.push('Weak psychological appeal - add emotional triggers')
        }
      } else {
        improvements.push('Need more content to analyze psychology')
      }
    } catch (error) {
      console.error('[BrandHealthCalculator] Synapse error:', error)
      score += 25 // Default middle score
    }

    // 2. Emotional Trigger Usage (30 points)
    const emotionalTriggers = brandProfile.full_profile_data?.emotional_triggers || []
    if (emotionalTriggers.length >= 3) {
      score += 20
      strengths.push('Strong emotional trigger library')

      // Check if positioning uses any triggers
      const positioning = (brandProfile.positioning_statement || '').toLowerCase()
      const triggerMatch = emotionalTriggers.some((trigger: any) =>
        positioning.includes((trigger.trigger || trigger).toLowerCase().split(' ')[0])
      )

      if (triggerMatch) {
        score += 10
        strengths.push('Emotional triggers integrated in messaging')
      } else {
        improvements.push('Apply emotional triggers to core messaging')
      }
    } else if (emotionalTriggers.length >= 2) {
      score += 15
      strengths.push('Good emotional trigger foundation')
      improvements.push('Add 1-2 more emotional triggers for depth')
    } else if (emotionalTriggers.length >= 1) {
      score += 10
      improvements.push('Define more emotional triggers (2-3 recommended)')
    } else {
      improvements.push('Define emotional triggers to drive engagement')
    }

    // 3. Power Word Density (20 points)
    const powerWords = [
      'proven', 'guaranteed', 'exclusive', 'limited', 'discover',
      'secret', 'breakthrough', 'results', 'transform', 'achieve',
      'expert', 'expertise', 'specialist', 'specialized', 'trusted',
      'professional', 'experienced', 'dedicated', 'comprehensive', 'quality',
      'premium', 'leading', 'top', 'best', 'certified'
    ]

    const allContent = `${brandProfile.positioning_statement} ${
      brandProfile.full_profile_data?.uvps?.map((u: any) => u.proposition || u.uvp || u).join(' ') || ''
    }`.toLowerCase()

    const powerWordCount = powerWords.filter(word => allContent.includes(word)).length

    if (powerWordCount >= 2) {
      score += 20
      strengths.push('Strong power word usage')
    } else if (powerWordCount >= 1) {
      score += 15
      strengths.push('Good use of impactful language')
      improvements.push('Consider adding 1-2 more power words')
    } else {
      score += 5
      improvements.push('Add power words for stronger impact')
    }

    return {
      score: Math.min(100, score),
      grade: this.scoreToGrade(score),
      label: 'Engagement',
      description: 'How engaging and persuasive your messaging is',
      strengths,
      improvements,
      impact: score < 60 ? 'critical' : score < 75 ? 'high' : 'medium',
    }
  }

  // ============================================================================
  // Differentiation Score (25% weight)
  // ============================================================================

  private static async calculateDifferentiation(input: BrandHealthInput): Promise<MetricScore> {
    const { brandProfile, competitors = [] } = input
    let score = 0
    const strengths: string[] = []
    const improvements: string[] = []

    // 1. Competitive Gap Analysis (40 points)
    if (competitors.length > 0) {
      score += 20
      strengths.push(`Tracking ${competitors.length} competitors`)

      // Check for documented competitive advantages
      const competitiveAdvantages = brandProfile.full_profile_data?.competitive_advantages || []
      if (competitiveAdvantages.length >= 3) {
        score += 20
        strengths.push('Clear competitive advantages documented')
      } else {
        improvements.push('Document your competitive advantages')
      }
    } else {
      improvements.push('Add competitor analysis')
    }

    // 2. UVP Uniqueness (40 points)
    const uvps = brandProfile.full_profile_data?.uvps || []
    if (uvps.length > 0) {
      const primaryUVP = uvps[0]
      const uvpText = primaryUVP.proposition || primaryUVP.uvp || primaryUVP || ''

      // Check for specific, measurable claims
      const hasNumbers = /\d+/.test(uvpText)
      const hasSpecifics = /(percent|years|customers|faster|better|more|expert|specialist|local|specific|focused)/i.test(uvpText)

      if (hasNumbers && hasSpecifics) {
        score += 25
        strengths.push('UVP includes specific, measurable claims')
      } else if (hasSpecifics) {
        score += 20
        strengths.push('UVP has specific positioning')
        improvements.push('Consider adding quantifiable metrics')
      } else {
        score += 15
        strengths.push('UVP present')
        improvements.push('Make UVP more specific and measurable')
      }

      // Check for unique differentiator
      if (primaryUVP.differentiator && primaryUVP.differentiator.length > 20) {
        score += 15
        strengths.push('Clear differentiation from competitors')
      } else {
        improvements.push('Strengthen your differentiator')
      }
    } else {
      improvements.push('Create compelling UVPs')
    }

    // 3. Breakthrough Potential (20 points)
    const brandStory = brandProfile.full_profile_data?.brand_story
    if (brandStory?.origin || brandStory?.narrative) {
      score += 10
      strengths.push('Compelling brand story')

      // Check for transformation narrative
      const narrative = (brandStory.narrative || '').toLowerCase()
      const hasTransformation = [
        'transformed', 'changed', 'revolutionized', 'disrupted',
        'different', 'better way', 'new approach',
      ].some(word => narrative.includes(word))

      if (hasTransformation) {
        score += 10
        strengths.push('Transformation narrative present')
      } else {
        improvements.push('Add transformation story')
      }
    } else {
      improvements.push('Develop your brand story')
    }

    return {
      score: Math.min(100, score),
      grade: this.scoreToGrade(score),
      label: 'Differentiation',
      description: 'How different you are from competitors',
      strengths,
      improvements,
      impact: score < 50 ? 'critical' : score < 70 ? 'high' : 'medium',
    }
  }

  // ============================================================================
  // Industry Comparison
  // ============================================================================

  private static compareToIndustry(
    score: number,
    industryData?: any
  ): IndustryComparison {
    // Industry benchmarks (these could come from real data later)
    const industryAverage = 65
    const topPerformers = 85

    const gap = score - industryAverage
    const percentile = Math.min(99, Math.max(1, Math.round(
      ((score - 40) / 60) * 100
    )))

    let status: IndustryComparison['status']
    if (score >= topPerformers) {
      status = 'leading'
    } else if (score >= industryAverage + 10) {
      status = 'above-average'
    } else if (score >= industryAverage - 10) {
      status = 'average'
    } else if (score >= 50) {
      status = 'below-average'
    } else {
      status = 'trailing'
    }

    return {
      industryAverage,
      yourScore: score,
      percentile,
      topPerformers,
      gap,
      status,
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private static scoreToGrade(score: number): MetricScore['grade'] {
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  private static createFallbackScore(error: any): BrandHealthScore {
    console.error('[BrandHealthCalculator] Using fallback score due to error:', error)

    const fallbackMetric: MetricScore = {
      score: 50,
      grade: 'D',
      label: 'Unknown',
      description: 'Unable to calculate',
      strengths: [],
      improvements: ['Complete brand profile for accurate scoring'],
      impact: 'high',
    }

    return {
      overall: 50,
      clarity: { ...fallbackMetric, label: 'Clarity' },
      consistency: { ...fallbackMetric, label: 'Consistency' },
      engagement: { ...fallbackMetric, label: 'Engagement' },
      differentiation: { ...fallbackMetric, label: 'Differentiation' },
      breakdown: {
        totalPoints: 50,
        maxPoints: 100,
        clarityPoints: 12,
        consistencyPoints: 10,
        engagementPoints: 15,
        differentiationPoints: 13,
        weights: {
          clarity: 0.25,
          consistency: 0.20,
          engagement: 0.30,
          differentiation: 0.25,
        },
      },
      comparedToIndustry: {
        industryAverage: 65,
        yourScore: 50,
        percentile: 30,
        topPerformers: 85,
        gap: -15,
        status: 'below-average',
      },
      generatedAt: new Date().toISOString(),
    }
  }
}
