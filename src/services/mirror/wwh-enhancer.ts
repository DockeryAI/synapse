/**
 * WWH Enhancer Service
 * Synthesizes UVP data (Problem/Solution/Outcome + WHY/HOW/WHAT) into enhanced WWH Framework
 * Transforms generic WWH into a powerful, data-driven strategic framework
 */

import type { ValueStatement } from '@/types/uvp.types'

export interface WWHEnhancedData {
  // Original (before) data
  originalWhy: string
  originalHow: string[]
  originalWhat: string[]

  // Enhanced (after) data
  enhancedWhy: string
  enhancedHow: string[]
  enhancedWhat: string[]

  // Metrics showing improvement
  improvementScore: number // 0-100
  clarityImprovement: number // percentage increase
  specificityImprovement: number // percentage increase

  // Insights for the reveal
  insights: {
    whyInsights: string[]
    howInsights: string[]
    whatInsights: string[]
  }
}

export interface WWHEnhancerInput {
  // From brand profile
  brandName: string
  industry?: string
  originalMission?: string
  originalVision?: string
  originalOfferings?: string[]

  // From UVP flow
  problemStatement: string
  solutionStatement: string
  outcomeStatement: string
  purposeStatement: string
  uniqueApproach: string[]
  coreOfferings: string[]
}

/**
 * Enhances WWH Framework data using UVP insights
 */
export class WWHEnhancer {
  /**
   * Main enhancement function - transforms generic WWH into powerful strategic framework
   */
  static enhance(input: WWHEnhancerInput): WWHEnhancedData {
    // Extract original data (generic/before state)
    const originalWhy = input.originalMission || input.originalVision || 'Generic mission statement'
    const originalHow = this.extractOriginalHow(input)
    const originalWhat = input.originalOfferings || ['Generic offerings']

    // Generate enhanced data using UVP insights
    const enhancedWhy = this.enhanceWhy(input)
    const enhancedHow = this.enhanceHow(input)
    const enhancedWhat = this.enhanceWhat(input)

    // Calculate improvements
    const improvementScore = this.calculateImprovementScore(
      { why: originalWhy, how: originalHow, what: originalWhat },
      { why: enhancedWhy, how: enhancedHow, what: enhancedWhat }
    )

    const clarityImprovement = this.calculateClarityImprovement(originalWhy, enhancedWhy)
    const specificityImprovement = this.calculateSpecificityImprovement(originalWhat, enhancedWhat)

    // Generate insights for the reveal
    const insights = this.generateInsights(input, {
      why: enhancedWhy,
      how: enhancedHow,
      what: enhancedWhat,
    })

    return {
      originalWhy,
      originalHow,
      originalWhat,
      enhancedWhy,
      enhancedHow,
      enhancedWhat,
      improvementScore,
      clarityImprovement,
      specificityImprovement,
      insights,
    }
  }

  /**
   * Enhance WHY using purpose statement and problem/solution context
   */
  private static enhanceWhy(input: WWHEnhancerInput): string {
    // Use the purpose statement directly as it's already well-crafted
    if (input.purposeStatement) {
      return input.purposeStatement
    }

    // Fallback: synthesize from problem/solution
    return `We believe ${input.problemStatement.toLowerCase()} ${input.solutionStatement.toLowerCase()}`
  }

  /**
   * Enhance HOW using unique approach + solution methodology
   */
  private static enhanceHow(input: WWHEnhancerInput): string[] {
    const enhanced: string[] = []

    // Use unique approach directly (already specific and differentiated)
    if (input.uniqueApproach && input.uniqueApproach.length > 0) {
      enhanced.push(...input.uniqueApproach)
    }

    // Add solution-derived differentiators
    const solutionKeywords = this.extractKeyPhrases(input.solutionStatement)
    solutionKeywords.forEach((keyword) => {
      if (!enhanced.some((item) => item.toLowerCase().includes(keyword.toLowerCase()))) {
        enhanced.push(keyword)
      }
    })

    return enhanced.slice(0, 5) // Keep top 5
  }

  /**
   * Enhance WHAT using outcome-focused offerings
   */
  private static enhanceWhat(input: WWHEnhancerInput): string[] {
    const enhanced: string[] = []

    // Use core offerings directly (already outcome-focused)
    if (input.coreOfferings && input.coreOfferings.length > 0) {
      enhanced.push(...input.coreOfferings)
    }

    // Add outcome statement if not already covered
    if (
      input.outcomeStatement &&
      !enhanced.some((item) => item.toLowerCase().includes(input.outcomeStatement.toLowerCase().substring(0, 20)))
    ) {
      enhanced.push(input.outcomeStatement)
    }

    return enhanced.slice(0, 5) // Keep top 5
  }

  /**
   * Extract original HOW from brand data (usually generic)
   */
  private static extractOriginalHow(input: WWHEnhancerInput): string[] {
    // Generic values often found in initial brand profiles
    return [
      'Quality service',
      'Customer focus',
      'Innovation',
      'Industry expertise',
    ]
  }

  /**
   * Calculate overall improvement score
   */
  private static calculateImprovementScore(
    original: { why: string; how: string[]; what: string[] },
    enhanced: { why: string; how: string[]; what: string[] }
  ): number {
    let score = 50 // Base score

    // WHY improvement (30 points)
    if (enhanced.why.length > original.why.length * 1.2) score += 10
    if (this.hasSpecificMetrics(enhanced.why)) score += 10
    if (this.hasEmotionalLanguage(enhanced.why)) score += 10

    // HOW improvement (20 points)
    if (enhanced.how.length > original.how.length) score += 10
    if (enhanced.how.some((h) => this.hasSpecificMetrics(h))) score += 10

    // WHAT improvement (20 points)
    if (enhanced.what.length > original.what.length) score += 10
    if (enhanced.what.some((w) => this.isOutcomeFocused(w))) score += 10

    return Math.min(100, score)
  }

  /**
   * Calculate clarity improvement percentage
   */
  private static calculateClarityImprovement(original: string, enhanced: string): number {
    const originalClarity = this.assessClarity(original)
    const enhancedClarity = this.assessClarity(enhanced)

    return Math.round(((enhancedClarity - originalClarity) / originalClarity) * 100)
  }

  /**
   * Calculate specificity improvement percentage
   */
  private static calculateSpecificityImprovement(original: string[], enhanced: string[]): number {
    const originalSpecificity = original.reduce((sum, item) => sum + this.assessSpecificity(item), 0) / original.length
    const enhancedSpecificity = enhanced.reduce((sum, item) => sum + this.assessSpecificity(item), 0) / enhanced.length

    return Math.round(((enhancedSpecificity - originalSpecificity) / originalSpecificity) * 100)
  }

  /**
   * Generate insights showing what improved
   */
  private static generateInsights(
    input: WWHEnhancerInput,
    enhanced: { why: string; how: string[]; what: string[] }
  ): { whyInsights: string[]; howInsights: string[]; whatInsights: string[] } {
    return {
      whyInsights: [
        'Transformed generic mission into a compelling purpose statement',
        'Connected your WHY to actual customer problems',
        'Made your purpose emotionally resonant and authentic',
      ],
      howInsights: [
        `Added ${enhanced.how.length} specific differentiators`,
        'Shifted from generic values to concrete methodologies',
        'Highlighted what makes your approach unique',
      ],
      whatInsights: [
        `Converted ${enhanced.what.length} feature descriptions into outcome-focused offerings`,
        'Added specific metrics and results customers achieve',
        'Made offerings tangible and measurable',
      ],
    }
  }

  // =====================================================
  // Helper Functions
  // =====================================================

  private static extractKeyPhrases(text: string): string[] {
    // Simple keyword extraction - in production, use NLP
    const words = text.split(/\s+/)
    const phrases: string[] = []

    // Look for 2-3 word phrases
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = `${words[i]} ${words[i + 1]}`
      if (phrase.length > 10 && !this.isCommonPhrase(phrase)) {
        phrases.push(phrase)
      }
    }

    return phrases.slice(0, 3)
  }

  private static isCommonPhrase(phrase: string): boolean {
    const common = ['the', 'and', 'for', 'with', 'that', 'this', 'from', 'have']
    return common.some((word) => phrase.toLowerCase().startsWith(word))
  }

  private static hasSpecificMetrics(text: string): boolean {
    return /\d+%|\d+x|\d+ hours|\d+ days|\$\d+/.test(text)
  }

  private static hasEmotionalLanguage(text: string): boolean {
    const emotionalWords = ['believe', 'empower', 'transform', 'enable', 'help', 'support', 'grow']
    return emotionalWords.some((word) => text.toLowerCase().includes(word))
  }

  private static isOutcomeFocused(text: string): boolean {
    const outcomeIndicators = ['that', 'achieve', 'get', 'result', 'deliver', 'generate', 'create', 'increase']
    return outcomeIndicators.some((word) => text.toLowerCase().includes(word))
  }

  private static assessClarity(text: string): number {
    let score = 50

    // Penalize for length
    if (text.length < 20) score -= 20
    if (text.length > 200) score -= 10

    // Reward for specific language
    if (this.hasSpecificMetrics(text)) score += 20
    if (this.hasEmotionalLanguage(text)) score += 15

    // Penalize for jargon
    const jargonWords = ['synergy', 'leverage', 'paradigm']
    if (jargonWords.some((word) => text.toLowerCase().includes(word))) score -= 15

    return Math.max(0, Math.min(100, score))
  }

  private static assessSpecificity(text: string): number {
    let score = 50

    // Reward for metrics
    if (this.hasSpecificMetrics(text)) score += 25

    // Reward for outcome language
    if (this.isOutcomeFocused(text)) score += 15

    // Penalize for generic terms
    const genericTerms = ['quality', 'great', 'best', 'good']
    if (genericTerms.some((term) => text.toLowerCase().includes(term))) score -= 20

    return Math.max(0, Math.min(100, score))
  }
}

/**
 * Utility function to enhance existing value statement with WWH data
 */
export function enhanceValueStatementWithWWH(
  statement: ValueStatement,
  brandData: any
): WWHEnhancedData {
  const input: WWHEnhancerInput = {
    brandName: brandData?.name || 'Your Brand',
    industry: brandData?.industry,
    originalMission: brandData?.full_profile_data?.mission,
    originalVision: brandData?.full_profile_data?.vision,
    originalOfferings: brandData?.full_profile_data?.offerings,
    problemStatement: statement.problem_statement || '',
    solutionStatement: statement.solution_statement || '',
    outcomeStatement: statement.outcome_statement || '',
    purposeStatement: statement.purpose_statement || '',
    uniqueApproach: statement.unique_approach || [],
    coreOfferings: statement.core_offerings || [],
  }

  return WWHEnhancer.enhance(input)
}
