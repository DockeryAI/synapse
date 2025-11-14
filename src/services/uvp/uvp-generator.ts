/**
 * UVP (Unique Value Proposition) Generator Service
 * Creates, validates, and optimizes value propositions with psychology scoring
 */

export interface UVPComponent {
  id: string
  type: 'benefit' | 'feature' | 'differentiator' | 'proof'
  content: string
  target_audience?: string
  emotional_appeal: 'high' | 'medium' | 'low'
  clarity_score: number
  synapse_score?: number
}

export interface ValueStatement {
  id: string
  headline: string
  subheadline: string
  supporting_points: string[]
  call_to_action: string
  target_persona?: string
  synapse_score?: number
  clarity_score: number
  conversion_potential: number
  created_at: string
}

export interface UVPFormula {
  template: string
  name: string
  description: string
  placeholders: string[]
  example: string
  best_for: string[]
}

export interface CompetitivePosition {
  your_value: string
  competitor_value: string
  gap_score: number // 0-100, higher = bigger differentiation
  message_opportunity: string
}

export interface ABTest {
  id: string
  variant_a: ValueStatement
  variant_b: ValueStatement
  hypothesis: string
  success_metric: string
  status: 'draft' | 'running' | 'completed'
  results?: {
    variant_a_performance: number
    variant_b_performance: number
    winner: 'a' | 'b' | 'tie'
    confidence_level: number
  }
}

export class UVPGenerator {
  /**
   * Pre-defined UVP formulas based on proven frameworks
   */
  static readonly FORMULAS: UVPFormula[] = [
    {
      template: 'Help [target audience] [achieve goal] through [unique approach]',
      name: 'Goal-Oriented Formula',
      description: 'Focuses on customer goals and your unique method',
      placeholders: ['target audience', 'achieve goal', 'unique approach'],
      example: 'Help marketing teams increase ROI through AI-powered campaign optimization',
      best_for: ['B2B', 'SaaS', 'Services'],
    },
    {
      template: '[Product/Service] that helps [target audience] [benefit] without [common pain point]',
      name: 'Pain-Relief Formula',
      description: 'Emphasizes problem-solving and pain point elimination',
      placeholders: ['Product/Service', 'target audience', 'benefit', 'common pain point'],
      example: 'Marketing platform that helps SMBs grow their business without hiring expensive agencies',
      best_for: ['B2B', 'B2C', 'Disruptive products'],
    },
    {
      template: 'The only [category] that [unique differentiator]',
      name: 'Category King Formula',
      description: 'Positions you as the unique solution in your space',
      placeholders: ['category', 'unique differentiator'],
      example: 'The only marketing platform that combines psychology scoring with content generation',
      best_for: ['Market leaders', 'Innovators', 'First movers'],
    },
    {
      template: '[Benefit] for [target audience], powered by [technology/approach]',
      name: 'Technology-Driven Formula',
      description: 'Highlights technical innovation and capabilities',
      placeholders: ['Benefit', 'target audience', 'technology/approach'],
      example: 'Intelligent marketing insights for growing brands, powered by multi-signal AI analysis',
      best_for: ['Tech companies', 'AI products', 'Innovation-focused'],
    },
    {
      template: 'Unlike [competitors], we [unique value]',
      name: 'Competitive Contrast Formula',
      description: 'Directly positions against competition',
      placeholders: ['competitors', 'unique value'],
      example: 'Unlike generic marketing tools, we provide psychology-informed strategies that convert',
      best_for: ['Competitive markets', 'Differentiated products', 'Late entrants'],
    },
  ]

  /**
   * Generate UVP components from brand and market data
   */
  static generateComponents(data: {
    brandData: any
    objectives: any[]
    differentiators: any[]
    personas: any[]
  }): UVPComponent[] {
    const components: UVPComponent[] = []

    // Extract benefits from objectives
    data.objectives.forEach((obj, i) => {
      if (obj.expected_impact) {
        components.push({
          id: `benefit-${i}`,
          type: 'benefit',
          content: obj.expected_impact,
          emotional_appeal: 'medium',
          clarity_score: this.calculateClarityScore(obj.expected_impact),
        })
      }
    })

    // Extract differentiators
    data.differentiators.forEach((diff, i) => {
      components.push({
        id: `diff-${i}`,
        type: 'differentiator',
        content: diff.your_position || diff.differentiator,
        emotional_appeal: 'high',
        clarity_score: this.calculateClarityScore(diff.your_position || diff.differentiator),
      })
    })

    // Generate persona-specific benefits
    data.personas.forEach((persona, i) => {
      persona.psychographics?.goals?.forEach((goal: string, j: number) => {
        components.push({
          id: `persona-benefit-${i}-${j}`,
          type: 'benefit',
          content: `Help you ${goal.toLowerCase()}`,
          target_audience: persona.name,
          emotional_appeal: 'medium',
          clarity_score: this.calculateClarityScore(goal),
        })
      })
    })

    return components
  }

  /**
   * Generate value statements using different formulas
   */
  static generateValueStatements(
    components: UVPComponent[],
    brandData: any,
    personas: any[]
  ): ValueStatement[] {
    const statements: ValueStatement[] = []

    // Generate statements for each formula
    this.FORMULAS.forEach((formula, i) => {
      const statement = this.applyFormula(formula, components, brandData, personas[0])
      if (statement) {
        statements.push({
          ...statement,
          id: `statement-${i}`,
          created_at: new Date().toISOString(),
        })
      }
    })

    return statements
  }

  /**
   * Apply a UVP formula to generate a value statement
   */
  private static applyFormula(
    formula: UVPFormula,
    components: UVPComponent[],
    brandData: any,
    primaryPersona: any
  ): ValueStatement | null {
    let headline = formula.template

    // Simple placeholder replacement
    if (headline.includes('[target audience]')) {
      headline = headline.replace('[target audience]', primaryPersona?.role || 'businesses')
    }

    if (headline.includes('[achieve goal]')) {
      const goal = primaryPersona?.psychographics?.goals?.[0] || 'achieve their goals'
      headline = headline.replace('[achieve goal]', goal.toLowerCase())
    }

    if (headline.includes('[unique approach]')) {
      const diff = components.find((c) => c.type === 'differentiator')
      headline = headline.replace('[unique approach]', diff?.content || 'proven strategies')
    }

    if (headline.includes('[Product/Service]')) {
      headline = headline.replace('[Product/Service]', brandData.name || 'Our platform')
    }

    if (headline.includes('[benefit]')) {
      const benefit = components.find((c) => c.type === 'benefit')
      headline = headline.replace('[benefit]', benefit?.content || 'grow faster')
    }

    if (headline.includes('[common pain point]')) {
      const painPoint = primaryPersona?.psychographics?.pain_points?.[0] || 'wasting time and money'
      headline = headline.replace('[common pain point]', painPoint.toLowerCase())
    }

    if (headline.includes('[category]')) {
      headline = headline.replace('[category]', brandData.industry || 'solution')
    }

    if (headline.includes('[unique differentiator]')) {
      const diff = components.find((c) => c.type === 'differentiator')
      headline = headline.replace('[unique differentiator]', diff?.content || 'delivers real results')
    }

    if (headline.includes('[competitors]')) {
      headline = headline.replace('[competitors]', 'traditional solutions')
    }

    if (headline.includes('[unique value]')) {
      const diff = components.find((c) => c.type === 'differentiator')
      headline = headline.replace('[unique value]', diff?.content || 'focus on measurable outcomes')
    }

    if (headline.includes('[technology/approach]')) {
      headline = headline.replace('[technology/approach]', 'AI-powered intelligence')
    }

    if (headline.includes('[Benefit]')) {
      const benefit = components.find((c) => c.type === 'benefit')
      headline = headline.replace('[Benefit]', benefit?.content || 'Better results')
    }

    // Generate subheadline
    const benefits = components.filter((c) => c.type === 'benefit').slice(0, 2)
    const subheadline = benefits.length > 0
      ? `${benefits.map((b) => b.content).join('. ')}.`
      : 'Transform your marketing with data-driven insights and proven strategies.'

    // Supporting points from components
    const supportingPoints = components
      .filter((c) => c.type === 'benefit' || c.type === 'differentiator')
      .slice(0, 3)
      .map((c) => c.content)

    // Default CTA
    const call_to_action = 'Get Started Today'

    const clarityScore = this.calculateClarityScore(headline)
    const conversionPotential = this.estimateConversionPotential(headline, components)

    return {
      id: '',
      headline,
      subheadline,
      supporting_points: supportingPoints,
      call_to_action,
      clarity_score: clarityScore,
      conversion_potential: conversionPotential,
      created_at: '',
    }
  }

  /**
   * Calculate clarity score for text
   */
  static calculateClarityScore(text: string): number {
    if (!text) return 0

    let score = 100

    // Penalize for length
    const words = text.split(/\s+/).length
    if (words > 20) score -= (words - 20) * 2
    if (words < 5) score -= (5 - words) * 5

    // Penalize for jargon and complex words
    const jargonWords = ['synergy', 'leverage', 'paradigm', 'utilize', 'facilitate']
    jargonWords.forEach((jargon) => {
      if (text.toLowerCase().includes(jargon)) score -= 10
    })

    // Penalize for passive voice indicators
    const passiveIndicators = ['was', 'were', 'been', 'being']
    passiveIndicators.forEach((indicator) => {
      if (text.toLowerCase().includes(` ${indicator} `)) score -= 5
    })

    // Bonus for power words
    const powerWords = ['proven', 'guaranteed', 'results', 'transform', 'boost', 'increase']
    powerWords.forEach((power) => {
      if (text.toLowerCase().includes(power)) score += 5
    })

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Estimate conversion potential based on components
   */
  private static estimateConversionPotential(headline: string, components: UVPComponent[]): number {
    let score = 50 // base score

    // Clarity impact
    const clarity = this.calculateClarityScore(headline)
    score += (clarity - 50) * 0.3

    // Emotional appeal impact
    const highEmotionalComponents = components.filter((c) => c.emotional_appeal === 'high').length
    score += highEmotionalComponents * 5

    // Differentiator impact
    const differentiators = components.filter((c) => c.type === 'differentiator').length
    score += differentiators * 8

    // Benefit clarity impact
    const benefits = components.filter((c) => c.type === 'benefit')
    const avgBenefitClarity = benefits.reduce((sum, b) => sum + b.clarity_score, 0) / (benefits.length || 1)
    score += (avgBenefitClarity - 50) * 0.2

    return Math.max(0, Math.min(100, Math.round(score)))
  }

  /**
   * Compare value proposition against competitors
   */
  static compareWithCompetitors(
    yourUVP: ValueStatement,
    competitorUVPs: string[]
  ): CompetitivePosition[] {
    return competitorUVPs.map((compUVP, i) => {
      // Simple text similarity for gap analysis
      const overlap = this.calculateTextOverlap(yourUVP.headline, compUVP)
      const gapScore = Math.round((1 - overlap) * 100)

      let message = ''
      if (gapScore >= 70) {
        message = 'Strong differentiation - capitalize on this unique position'
      } else if (gapScore >= 40) {
        message = 'Moderate differentiation - emphasize unique elements more clearly'
      } else {
        message = 'Low differentiation - consider repositioning or stronger unique angles'
      }

      return {
        your_value: yourUVP.headline,
        competitor_value: compUVP,
        gap_score: gapScore,
        message_opportunity: message,
      }
    })
  }

  /**
   * Calculate text overlap between two strings
   */
  private static calculateTextOverlap(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/))
    const words2 = new Set(text2.toLowerCase().split(/\s+/))

    const intersection = new Set([...words1].filter((w) => words2.has(w)))
    const union = new Set([...words1, ...words2])

    return intersection.size / union.size
  }

  /**
   * Create A/B test for two value statements
   */
  static createABTest(
    variantA: ValueStatement,
    variantB: ValueStatement,
    hypothesis: string,
    successMetric: string
  ): ABTest {
    return {
      id: `test-${Date.now()}`,
      variant_a: variantA,
      variant_b: variantB,
      hypothesis,
      success_metric: successMetric,
      status: 'draft',
    }
  }

  /**
   * Validate UVP quality
   */
  static validateUVP(statement: ValueStatement): {
    valid: boolean
    errors: string[]
    warnings: string[]
    recommendations: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []
    const recommendations: string[] = []

    // Headline validation
    if (!statement.headline || statement.headline.length < 10) {
      errors.push('Headline is too short - aim for at least 10 characters')
    }

    if (statement.headline.length > 100) {
      warnings.push('Headline is too long - keep it under 100 characters for impact')
    }

    const headlineWords = statement.headline.split(/\s+/).length
    if (headlineWords > 15) {
      warnings.push('Headline is too wordy - aim for 5-12 words')
    }

    // Clarity validation
    if (statement.clarity_score < 60) {
      warnings.push('Clarity score is low - simplify language and remove jargon')
    }

    if (statement.clarity_score >= 80) {
      recommendations.push('Excellent clarity - this message is easy to understand')
    }

    // Supporting points validation
    if (statement.supporting_points.length < 2) {
      warnings.push('Add more supporting points to strengthen your value proposition')
    }

    if (statement.supporting_points.length > 5) {
      warnings.push('Too many supporting points - focus on top 3-4 benefits')
    }

    // CTA validation
    if (!statement.call_to_action) {
      errors.push('Call-to-action is required')
    }

    // Conversion potential
    if (statement.conversion_potential < 50) {
      recommendations.push('Consider adding stronger differentiators or emotional benefits')
    }

    if (statement.conversion_potential >= 70) {
      recommendations.push('High conversion potential - test this UVP in your marketing')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      recommendations,
    }
  }

  /**
   * Optimize UVP based on feedback and performance
   */
  static optimizeUVP(
    statement: ValueStatement,
    components: UVPComponent[],
    feedback: { metric: string; value: number }[]
  ): ValueStatement {
    const optimized = { ...statement }

    // If clarity score is low, simplify headline
    if (statement.clarity_score < 60) {
      optimized.headline = this.simplifyText(statement.headline)
      optimized.clarity_score = this.calculateClarityScore(optimized.headline)
    }

    // If conversion potential is low, add stronger differentiators
    if (statement.conversion_potential < 50) {
      const strongDiff = components.find(
        (c) => c.type === 'differentiator' && c.emotional_appeal === 'high'
      )
      if (strongDiff && !optimized.supporting_points.includes(strongDiff.content)) {
        optimized.supporting_points = [strongDiff.content, ...optimized.supporting_points.slice(0, 2)]
      }
    }

    // Recalculate scores
    optimized.conversion_potential = this.estimateConversionPotential(optimized.headline, components)

    return optimized
  }

  /**
   * Simplify text by removing jargon and complex words
   */
  private static simplifyText(text: string): string {
    let simplified = text

    // Replace jargon with simpler alternatives
    const replacements: Record<string, string> = {
      utilize: 'use',
      facilitate: 'help',
      leverage: 'use',
      paradigm: 'model',
      synergy: 'teamwork',
    }

    Object.entries(replacements).forEach(([jargon, simple]) => {
      const regex = new RegExp(`\\b${jargon}\\b`, 'gi')
      simplified = simplified.replace(regex, simple)
    })

    return simplified
  }
}
