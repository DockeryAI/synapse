/**
 * Brand Fit Service
 * Analyzes messaging consistency, perception gaps, and brand clarity
 */

import {
  type BrandData,
  type BrandFitAnalysis,
  type BrandFitData,
  type TouchpointAnalysis,
  type TouchpointMessage,
  type ClarityIssue,
  type TrustSignals,
  type Competitor,
} from '@/types/mirror-diagnostics'
import { chat } from '@/lib/openrouter'
import { PerplexityAPI } from '@/services/uvp-wizard/perplexity-api'

// Initialize Perplexity API
const perplexityAPI = new PerplexityAPI()

export class BrandFitService {
  /**
   * Run full brand fit analysis
   */
  static async analyzeBrandFit(
    brandId: string,
    brandData: BrandData
  ): Promise<BrandFitAnalysis> {
    console.log('[BrandFitService] Starting analysis for:', brandData.name)

    try {
      // Analyze messaging across touchpoints
      const touchpointAnalysis = await this.analyzeTouchpoints(brandData)

      // Calculate messaging consistency
      const messagingConsistency = this.calculateMessagingConsistency(touchpointAnalysis)

      // Get perceived positioning from market
      const perceivedPositioning = touchpointAnalysis.reviews.perceived_as

      // Assess differentiation strength
      const differentiationScore = await this.assessDifferentiation(
        brandData,
        touchpointAnalysis
      )

      // Identify clarity issues
      const clarityIssues = this.identifyClarityIssues(
        touchpointAnalysis,
        messagingConsistency
      )

      // Collect trust signals
      const trustSignals = await this.collectTrustSignals(brandData)

      // Build complete brand fit data
      const data: BrandFitData = {
        messaging_consistency: messagingConsistency,
        touchpoint_analysis: touchpointAnalysis,
        perceived_positioning: perceivedPositioning,
        differentiation_score: differentiationScore,
        clarity_issues: clarityIssues,
        trust_signals: trustSignals,
      }

      // Calculate score
      const score = this.calculateClarityScore(data)

      console.log('[BrandFitService] Analysis complete. Score:', score)

      return { score, data }
    } catch (error) {
      console.error('[BrandFitService] Analysis failed:', error)
      throw new Error(`Brand Fit analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Analyze messaging across all customer touchpoints
   */
  private static async analyzeTouchpoints(
    brandData: BrandData
  ): Promise<TouchpointAnalysis> {
    try {
      // Gather messaging from different touchpoints
      const websiteMessage = await this.extractWebsiteMessage(brandData)
      const googleMessage = await this.extractGoogleMessage(brandData)
      const socialMessage = await this.extractSocialMessage(brandData)
      const reviewsMessage = await this.extractReviewsMessage(brandData)

      // Use AI to compare consistency
      const consistencyAnalysis = await this.analyzeMessagingConsistency({
        website: websiteMessage,
        google: googleMessage,
        social: socialMessage,
        reviews: reviewsMessage,
      })

      return consistencyAnalysis
    } catch (error) {
      console.error('[BrandFitService] Touchpoint analysis failed:', error)
      throw new Error(`Failed to analyze touchpoints: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Extract messaging from website
   */
  private static async extractWebsiteMessage(brandData: BrandData): Promise<string> {
    if (!brandData.website) {
      return 'No website available'
    }

    try {
      // Use Perplexity to analyze website content
      const response = await perplexityAPI.getIndustryInsights({
        query: `What is the main message and value proposition on ${brandData.website}? What do they claim to be best at?`,
        context: { industry: brandData.industry },
        max_results: 3,
      })

      return response.insights.join('\n')
    } catch (error) {
      console.error('[BrandFitService] Website extraction failed:', error)
      return 'Unable to extract website message'
    }
  }

  /**
   * Extract messaging from Google Business Profile
   */
  private static async extractGoogleMessage(brandData: BrandData): Promise<string> {
    try {
      const response = await perplexityAPI.getIndustryInsights({
        query: `What does ${brandData.name} say in their Google Business Profile? What is their business description?`,
        context: { industry: brandData.industry },
        max_results: 3,
      })

      return response.insights.join('\n')
    } catch (error) {
      console.error('[BrandFitService] Google extraction failed:', error)
      return 'Unable to extract Google message'
    }
  }

  /**
   * Extract messaging from social media
   */
  private static async extractSocialMessage(brandData: BrandData): Promise<string> {
    try {
      const response = await perplexityAPI.getIndustryInsights({
        query: `What does ${brandData.name} say on their social media profiles? What is their social media positioning?`,
        context: { industry: brandData.industry },
        max_results: 3,
      })

      return response.insights.join('\n')
    } catch (error) {
      console.error('[BrandFitService] Social extraction failed:', error)
      return 'Unable to extract social message'
    }
  }

  /**
   * Extract how customers describe the brand from reviews
   */
  private static async extractReviewsMessage(brandData: BrandData): Promise<string> {
    try {
      const response = await perplexityAPI.getIndustryInsights({
        query: `How do customers describe ${brandData.name} in reviews? What do they say the business is known for?`,
        context: { industry: brandData.industry },
        max_results: 3,
      })

      return response.insights.join('\n')
    } catch (error) {
      console.error('[BrandFitService] Reviews extraction failed:', error)
      return 'Unable to extract review message'
    }
  }

  /**
   * Use AI to analyze messaging consistency across touchpoints
   */
  private static async analyzeMessagingConsistency(touchpoints: {
    website: string
    google: string
    social: string
    reviews: string
  }): Promise<TouchpointAnalysis> {
    const prompt = `Analyze messaging consistency across these customer touchpoints:

WEBSITE: ${touchpoints.website}

GOOGLE BUSINESS: ${touchpoints.google}

SOCIAL MEDIA: ${touchpoints.social}

CUSTOMER REVIEWS: ${touchpoints.reviews}

For each touchpoint, extract:
1. The core message (what they claim)
2. Alignment score (0-100) compared to other touchpoints

Also identify what customers perceive the business as (from reviews).

Return ONLY valid JSON:
{
  "website": {"message": "Core message", "alignment": 85},
  "google": {"message": "Core message", "alignment": 90},
  "social": {"message": "Core message", "alignment": 70},
  "reviews": {"message": "Core message", "alignment": 80, "perceived_as": "What customers think"}
}`

    try {
      const response = await chat(
        [{ role: 'user', content: prompt }],
        {
          temperature: 0.3,
          maxTokens: 1000,
        }
      )

      const parsed = JSON.parse(response)
      return parsed
    } catch (error) {
      console.error('[BrandFitService] Consistency analysis failed:', error)
      throw error
    }
  }

  /**
   * Calculate overall messaging consistency score
   */
  private static calculateMessagingConsistency(
    touchpointAnalysis: TouchpointAnalysis
  ): number {
    const alignments = [
      touchpointAnalysis.website.alignment,
      touchpointAnalysis.google.alignment,
      touchpointAnalysis.social.alignment,
      touchpointAnalysis.reviews.alignment,
    ]

    const average = alignments.reduce((sum, val) => sum + val, 0) / alignments.length
    return Math.round(average)
  }

  /**
   * Assess differentiation strength
   */
  private static async assessDifferentiation(
    brandData: BrandData,
    touchpointAnalysis: TouchpointAnalysis
  ): Promise<number> {
    const prompt = `Analyze differentiation strength for "${brandData.name}" in ${brandData.industry}.

Their messaging across touchpoints:
- Website: ${touchpointAnalysis.website.message}
- Google: ${touchpointAnalysis.google.message}
- Social: ${touchpointAnalysis.social.message}
- Reviews perception: ${touchpointAnalysis.reviews.perceived_as}

Rate their differentiation on a scale of 0-100:
- 0-30: Generic, sounds like everyone else
- 31-60: Some uniqueness but not compelling
- 61-85: Clear differentiation, memorable
- 86-100: Unique and ownable position

Return ONLY a JSON object:
{"score": 65, "reasoning": "Brief explanation"}`

    try {
      const response = await chat(
        [{ role: 'user', content: prompt }],
        {
          temperature: 0.4,
          maxTokens: 500,
        }
      )

      const parsed = JSON.parse(response)
      return parsed.score || 50
    } catch (error) {
      console.error('[BrandFitService] Differentiation assessment failed:', error)
      return 50
    }
  }

  /**
   * Identify clarity issues in messaging
   */
  private static identifyClarityIssues(
    touchpointAnalysis: TouchpointAnalysis,
    messagingConsistency: number
  ): ClarityIssue[] {
    const issues: ClarityIssue[] = []

    // Check for low consistency
    if (messagingConsistency < 70) {
      issues.push({
        issue: 'Inconsistent messaging across touchpoints',
        touchpoint: 'All',
        fix: 'Align all customer touchpoints to communicate the same core value proposition',
      })
    }

    // Check individual touchpoint alignment
    if (touchpointAnalysis.website.alignment < 60) {
      issues.push({
        issue: 'Website message misaligned with brand',
        touchpoint: 'Website',
        fix: 'Rewrite website copy to match your core positioning',
      })
    }

    if (touchpointAnalysis.google.alignment < 60) {
      issues.push({
        issue: 'Google Business Profile message unclear',
        touchpoint: 'Google',
        fix: 'Update Google Business description to clearly state what makes you different',
      })
    }

    if (touchpointAnalysis.social.alignment < 60) {
      issues.push({
        issue: 'Social media messaging off-brand',
        touchpoint: 'Social',
        fix: 'Create social media guidelines that reinforce your unique value',
      })
    }

    if (touchpointAnalysis.reviews.alignment < 60) {
      issues.push({
        issue: 'Customer perception doesn\'t match your positioning',
        touchpoint: 'Reviews',
        fix: 'Adjust messaging or service delivery to close the perception gap',
      })
    }

    return issues
  }

  /**
   * Collect trust signals
   */
  private static async collectTrustSignals(brandData: BrandData): Promise<TrustSignals> {
    try {
      const searchResponse = await perplexityAPI.getIndustryInsights({
        query: `How many reviews does ${brandData.name} have? What is their average rating? What social proof do they display?`,
        context: { industry: brandData.industry },
        max_results: 3,
      })

      const response = searchResponse.insights.join('\n')

      // Parse trust signals using AI
      const prompt = `Extract trust signals from this information:

${response}

Return ONLY valid JSON:
{
  "reviews_count": 150,
  "average_rating": 4.5,
  "social_proof": ["Award 1", "Certification 2", "Featured in Publication"]
}`

      const aiResponse = await chat(
        [{ role: 'user', content: prompt }],
        {
          temperature: 0.2,
          maxTokens: 500,
        }
      )

      return JSON.parse(aiResponse)
    } catch (error) {
      console.error('[BrandFitService] Trust signals collection failed:', error)
      return {
        reviews_count: 0,
        average_rating: 0,
        social_proof: [],
      }
    }
  }

  /**
   * Calculate brand clarity score (0-100)
   */
  private static calculateClarityScore(data: BrandFitData): number {
    let score = 100

    // Penalty for low messaging consistency
    if (data.messaging_consistency < 50) score -= 30
    else if (data.messaging_consistency < 70) score -= 15

    // Penalty for low differentiation
    if (data.differentiation_score < 40) score -= 25
    else if (data.differentiation_score < 60) score -= 10

    // Penalty for clarity issues
    score -= data.clarity_issues.length * 5

    // Penalty for weak trust signals
    if (data.trust_signals.reviews_count < 10) score -= 15
    else if (data.trust_signals.reviews_count < 50) score -= 5

    if (data.trust_signals.average_rating < 3.5) score -= 10
    else if (data.trust_signals.average_rating < 4.0) score -= 5

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Mock touchpoint analysis for development
   */
  private static getMockTouchpointAnalysis(industry: string): TouchpointAnalysis {
    return {
      website: {
        message: `Quality ${industry} services at competitive prices`,
        alignment: 60,
      },
      google: {
        message: `Fast and reliable ${industry} company serving local area`,
        alignment: 55,
      },
      social: {
        message: `Your trusted ${industry} experts - professional service guaranteed`,
        alignment: 70,
      },
      reviews: {
        message: `Customers mention affordable pricing and quick response`,
        alignment: 50,
        perceived_as: `The cheapest option with fast service`,
      },
    }
  }

  /**
   * Fallback data for when analysis fails
   */
  private static getFallbackData(brandData: BrandData): BrandFitData {
    return {
      messaging_consistency: 55,
      touchpoint_analysis: this.getMockTouchpointAnalysis(brandData.industry),
      perceived_positioning: 'Budget-friendly option with quick service',
      differentiation_score: 45,
      clarity_issues: [
        {
          issue: 'Inconsistent messaging across touchpoints',
          touchpoint: 'All',
          fix: 'Align all customer touchpoints to communicate the same core value proposition',
        },
        {
          issue: 'Customer perception doesn\'t match your positioning',
          touchpoint: 'Reviews',
          fix: 'Adjust messaging or service delivery to close the perception gap',
        },
      ],
      trust_signals: {
        reviews_count: 45,
        average_rating: 4.2,
        social_proof: ['Licensed and insured', 'Locally owned'],
      },
    }
  }
}
