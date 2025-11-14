/**
 * UVP Scoring Service
 *
 * Comprehensive UVP quality assessment that combines:
 * - AI-powered scoring (Rhodes AI / Claude)
 * - Industry intelligence (Perplexity)
 * - Competitive analysis (SerpAPI)
 *
 * Provides real-time scoring, validation, and actionable recommendations
 * to help users craft high-quality value propositions.
 */

import { rhodesAI } from './rhodes-ai'
import { perplexityAPI } from './perplexity-api'
import { serpAPI } from './serp-api'
import {
  UVP,
  QualityAssessment,
  UVPScoringRequest,
  UVPScoringResponse,
} from '@/types/uvp-wizard'

/**
 * Scoring weights for different dimensions
 */
interface ScoringWeights {
  clarity: number
  specificity: number
  differentiation: number
  impact: number
}

/**
 * Default scoring weights
 */
const DEFAULT_WEIGHTS: ScoringWeights = {
  clarity: 0.25,
  specificity: 0.25,
  differentiation: 0.3,
  impact: 0.2,
}

/**
 * UVP Scoring Service class
 */
export class UVPScoringService {
  private weights: ScoringWeights

  constructor(weights?: Partial<ScoringWeights>) {
    this.weights = { ...DEFAULT_WEIGHTS, ...weights }
  }

  /**
   * Score a complete or partial UVP
   */
  async scoreUVP(request: UVPScoringRequest): Promise<UVPScoringResponse> {
    console.log('[UVPScoringService] Starting comprehensive scoring...')

    try {
      // Step 1: Get AI-powered quality assessment
      const aiAssessment = await this.getAIAssessment(request.uvp, request.industry)

      // Step 2: Get competitive context
      const competitiveContext = await this.getCompetitiveContext(
        request.uvp,
        request.industry,
        request.competitors || []
      )

      // Step 3: Get industry benchmarks
      const industryBenchmarks = await this.getIndustryBenchmarks(
        request.uvp,
        request.industry
      )

      // Step 4: Calculate final score with all inputs
      const finalScore = this.calculateFinalScore(
        aiAssessment,
        competitiveContext,
        industryBenchmarks
      )

      // Step 5: Generate actionable recommendations
      const recommendations = await this.generateRecommendations(
        request.uvp,
        aiAssessment,
        competitiveContext,
        industryBenchmarks
      )

      return {
        score: finalScore,
        assessment: aiAssessment,
        recommendations,
      }
    } catch (error) {
      console.error('[UVPScoringService] Scoring failed:', error)
      throw error
    }
  }

  /**
   * Quick score (AI-only, no external API calls)
   */
  async quickScore(uvp: Partial<UVP>): Promise<number> {
    console.log('[UVPScoringService] Quick scoring...')

    try {
      const response = await rhodesAI.process({
        prompt: '',
        context: uvp,
        action: 'score',
      })

      return response.score || 0
    } catch (error) {
      console.error('[UVPScoringService] Quick score failed:', error)
      return 0
    }
  }

  /**
   * Validate UVP completeness
   */
  validateCompleteness(uvp: Partial<UVP>): {
    is_complete: boolean
    missing_fields: string[]
    completion_percentage: number
  } {
    const requiredFields: (keyof UVP)[] = [
      'target_customer',
      'customer_problem',
      'unique_solution',
      'key_benefit',
      'differentiation',
    ]

    const missingFields = requiredFields.filter((field) => !uvp[field] || uvp[field] === '')

    const completionPercentage = Math.round(
      ((requiredFields.length - missingFields.length) / requiredFields.length) * 100
    )

    return {
      is_complete: missingFields.length === 0,
      missing_fields: missingFields,
      completion_percentage: completionPercentage,
    }
  }

  /**
   * Get AI assessment from Rhodes AI
   */
  private async getAIAssessment(
    uvp: Partial<UVP>,
    industry: string
  ): Promise<QualityAssessment> {
    console.log('[UVPScoringService] Getting AI assessment...')

    try {
      const response = await rhodesAI.process({
        prompt: '',
        context: { ...uvp, industry },
        action: 'score',
      })

      // Parse the response to extract quality assessment
      // For now, we'll construct a basic assessment
      // TODO: Enhance RhodesAI to return full QualityAssessment structure

      return {
        overall_score: response.score || 0,
        clarity_score: 70, // Placeholder
        specificity_score: 70, // Placeholder
        differentiation_score: 70, // Placeholder
        impact_score: 70, // Placeholder
        strengths: [],
        improvements: [],
        suggestions: [],
        assessed_at: new Date().toISOString(),
      }
    } catch (error) {
      console.warn('[UVPScoringService] AI assessment failed:', error)

      // Return default assessment
      return this.getDefaultAssessment()
    }
  }

  /**
   * Get competitive context
   */
  private async getCompetitiveContext(
    uvp: Partial<UVP>,
    industry: string,
    competitors: string[]
  ): Promise<{
    differentiation_score: number
    unique_aspects: string[]
    similar_aspects: string[]
  }> {
    console.log('[UVPScoringService] Analyzing competitive context...')

    try {
      // If no competitors provided, discover them
      let competitorList = competitors
      if (competitorList.length === 0) {
        const suggestions = await serpAPI.getCompetitorSuggestions(industry)
        competitorList = suggestions.slice(0, 5).map((s) => s.content)
      }

      // Analyze competitor UVPs
      const competitorAnalysis = await serpAPI.analyzeCompetitorUVPs(
        competitorList,
        industry
      )

      // Compare our UVP to competitors
      const uniqueAspects: string[] = []
      const similarAspects: string[] = []

      // Simple keyword-based comparison
      const ourKeywords = this.extractKeywords(
        `${uvp.unique_solution} ${uvp.key_benefit} ${uvp.differentiation}`
      )

      competitorAnalysis.forEach((analysis) => {
        const competitorKeywords = this.extractKeywords(
          analysis.uvp_insights.join(' ')
        )

        ourKeywords.forEach((keyword) => {
          if (competitorKeywords.includes(keyword)) {
            similarAspects.push(keyword)
          } else {
            uniqueAspects.push(keyword)
          }
        })
      })

      // Calculate differentiation score
      const total = uniqueAspects.length + similarAspects.length
      const differentiationScore = total > 0
        ? Math.round((uniqueAspects.length / total) * 100)
        : 50

      return {
        differentiation_score: differentiationScore,
        unique_aspects: Array.from(new Set(uniqueAspects)).slice(0, 5),
        similar_aspects: Array.from(new Set(similarAspects)).slice(0, 5),
      }
    } catch (error) {
      console.warn('[UVPScoringService] Competitive context failed:', error)

      return {
        differentiation_score: 50,
        unique_aspects: [],
        similar_aspects: [],
      }
    }
  }

  /**
   * Get industry benchmarks
   */
  private async getIndustryBenchmarks(
    uvp: Partial<UVP>,
    industry: string
  ): Promise<{
    industry_fit_score: number
    industry_trends: string[]
    best_practices: string[]
  }> {
    console.log('[UVPScoringService] Getting industry benchmarks...')

    try {
      // Get industry best practices
      const bestPractices = await perplexityAPI.getIndustryInsights({
        query: `What are the key elements of a strong value proposition in the ${industry} industry?`,
        context: { industry },
        max_results: 5,
      })

      // Get industry trends
      const trends = await perplexityAPI.getIndustryInsights({
        query: `What are the current trends and customer expectations in the ${industry} industry?`,
        context: { industry },
        max_results: 5,
      })

      // Calculate industry fit based on alignment with best practices
      const industryFitScore = this.calculateIndustryFit(uvp, bestPractices.insights)

      return {
        industry_fit_score: industryFitScore,
        industry_trends: trends.insights,
        best_practices: bestPractices.insights,
      }
    } catch (error) {
      console.warn('[UVPScoringService] Industry benchmarks failed:', error)

      return {
        industry_fit_score: 50,
        industry_trends: [],
        best_practices: [],
      }
    }
  }

  /**
   * Calculate final score from all inputs
   */
  private calculateFinalScore(
    aiAssessment: QualityAssessment,
    competitiveContext: any,
    industryBenchmarks: any
  ): number {
    // Weighted average of all scores
    const scores = [
      aiAssessment.clarity_score * this.weights.clarity,
      aiAssessment.specificity_score * this.weights.specificity,
      competitiveContext.differentiation_score * this.weights.differentiation,
      industryBenchmarks.industry_fit_score * this.weights.impact,
    ]

    const finalScore = scores.reduce((sum, score) => sum + score, 0)

    return Math.round(finalScore)
  }

  /**
   * Generate actionable recommendations
   */
  private async generateRecommendations(
    uvp: Partial<UVP>,
    aiAssessment: QualityAssessment,
    competitiveContext: any,
    industryBenchmarks: any
  ): Promise<UVPScoringResponse['recommendations']> {
    const recommendations: UVPScoringResponse['recommendations'] = []

    // Recommendations based on clarity score
    if (aiAssessment.clarity_score < 70) {
      recommendations.push({
        field: 'target_customer',
        suggestion: 'Make your target customer description more specific and concrete',
        priority: 'high',
      })
    }

    // Recommendations based on differentiation
    if (competitiveContext.differentiation_score < 60) {
      recommendations.push({
        field: 'differentiation',
        suggestion: `Emphasize unique aspects: ${competitiveContext.unique_aspects.join(', ')}`,
        priority: 'high',
      })
    }

    // Recommendations based on industry fit
    if (industryBenchmarks.industry_fit_score < 60) {
      recommendations.push({
        field: 'key_benefit',
        suggestion: `Align with industry trends: ${industryBenchmarks.industry_trends.slice(0, 2).join(', ')}`,
        priority: 'medium',
      })
    }

    // Add general improvements
    aiAssessment.improvements?.forEach((improvement) => {
      recommendations.push({
        field: 'unique_solution',
        suggestion: improvement,
        priority: 'medium',
      })
    })

    return recommendations.slice(0, 5) // Limit to top 5
  }

  /**
   * Calculate industry fit score
   */
  private calculateIndustryFit(
    uvp: Partial<UVP>,
    bestPractices: string[]
  ): number {
    if (bestPractices.length === 0) return 50

    const uvpText = `${uvp.target_customer} ${uvp.customer_problem} ${uvp.unique_solution} ${uvp.key_benefit} ${uvp.differentiation}`
    const uvpKeywords = this.extractKeywords(uvpText)

    let matchCount = 0
    bestPractices.forEach((practice) => {
      const practiceKeywords = this.extractKeywords(practice)
      practiceKeywords.forEach((keyword) => {
        if (uvpKeywords.includes(keyword)) {
          matchCount++
        }
      })
    })

    // Calculate score based on keyword overlap
    const maxPossibleMatches = bestPractices.length * 3 // Assume 3 key concepts per practice
    const score = Math.min(100, Math.round((matchCount / maxPossibleMatches) * 100))

    return Math.max(30, score) // Minimum score of 30
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    if (!text) return []

    // Remove common words and extract meaningful keywords
    const commonWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'from',
      'is',
      'are',
      'was',
      'were',
      'be',
      'been',
      'being',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'could',
      'should',
      'may',
      'might',
      'can',
      'that',
      'this',
      'these',
      'those',
      'our',
      'your',
      'their',
      'we',
      'you',
      'they',
    ])

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 3 && !commonWords.has(word))
      .slice(0, 20) // Limit to 20 keywords
  }

  /**
   * Get default assessment when APIs fail
   */
  private getDefaultAssessment(): QualityAssessment {
    return {
      overall_score: 50,
      clarity_score: 50,
      specificity_score: 50,
      differentiation_score: 50,
      impact_score: 50,
      strengths: [],
      improvements: ['Complete all fields to get a detailed assessment'],
      suggestions: ['Fill in your target customer', 'Describe the problem you solve'],
      assessed_at: new Date().toISOString(),
    }
  }
}

/**
 * Singleton instance
 */
export const uvpScoringService = new UVPScoringService()
