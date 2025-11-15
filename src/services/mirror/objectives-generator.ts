/**
 * Intent Objectives Generator Service
 * Generates SMART goals based on measurement analysis and industry benchmarks
 * Part of the MIRROR Framework - Intend Phase
 */

export interface IntentObjective {
  id?: string
  brand_id: string
  category: 'awareness' | 'leads' | 'retention' | 'revenue' | 'engagement' | 'custom'
  title: string
  description: string
  current_value: number
  target_value: number
  unit: string
  timeline: '30_days' | '60_days' | '90_days' | '6_months' | '1_year'
  status: 'active' | 'completed' | 'paused'
  reasoning?: string
  expected_impact?: string
  effort_required?: 'low' | 'medium' | 'high'
  milestones?: string[]
  created_at?: string
}

export class ObjectivesGenerator {
  /**
   * Generate recommended objectives based on situation analysis
   */
  static generateRecommendedObjectives(situationData: {
    brandHealth: number
    industry: string
    currentMetrics: Record<string, number>
  }): IntentObjective[] {
    const objectives: IntentObjective[] = []
    const { brandHealth, industry, currentMetrics = {} } = situationData

    // If brand health is low, recommend awareness goal
    if (brandHealth < 70) {
      objectives.push({
        brand_id: '',
        category: 'awareness',
        title: 'Increase Brand Awareness',
        description: 'Improve brand recognition and reach in target market',
        current_value: currentMetrics.followers || 1000,
        target_value: Math.round((currentMetrics.followers || 1000) * 1.5),
        unit: 'followers',
        timeline: '90_days',
        status: 'active',
        reasoning: 'Current brand health score indicates low market awareness. Increasing visibility will improve overall brand strength.',
        expected_impact: 'Higher brand recognition leads to increased inbound leads and customer trust.',
        effort_required: 'medium',
        milestones: [
          'Launch brand awareness campaign',
          'Increase social media posting frequency',
          'Engage with industry influencers',
        ],
      })
    }

    // Always recommend engagement improvement
    objectives.push({
      brand_id: '',
      category: 'engagement',
      title: 'Boost Audience Engagement',
      description: 'Increase engagement rate across all platforms',
      current_value: currentMetrics.engagement_rate || 2.5,
      target_value: 5.0,
      unit: '%',
      timeline: '60_days',
      status: 'active',
      reasoning: 'Higher engagement rates indicate stronger audience connection and content relevance.',
      expected_impact: 'Better engagement leads to improved algorithm visibility and organic reach.',
      effort_required: 'low',
      milestones: [
        'Implement content calendar',
        'Test different content formats',
        'Engage with audience comments',
      ],
    })

    // Recommend lead generation for B2B
    if (industry && (industry.toLowerCase().includes('b2b') || industry.toLowerCase().includes('service'))) {
      objectives.push({
        brand_id: '',
        category: 'leads',
        title: 'Generate Quality Leads',
        description: 'Increase monthly qualified lead generation',
        current_value: currentMetrics.monthly_leads || 20,
        target_value: 50,
        unit: 'leads/month',
        timeline: '90_days',
        status: 'active',
        reasoning: 'Service businesses benefit most from consistent lead generation.',
        expected_impact: 'More qualified leads increase sales opportunities and revenue.',
        effort_required: 'high',
        milestones: [
          'Create lead magnet content',
          'Set up landing pages',
          'Launch targeted ad campaigns',
        ],
      })
    }

    return objectives.slice(0, 3) // Return top 3
  }

  /**
   * Validate SMART goal criteria
   */
  static validateSMARTGoal(objective: Partial<IntentObjective>): {
    valid: boolean
    errors: string[]
    suggestions: string[]
  } {
    const errors: string[] = []
    const suggestions: string[] = []

    // Specific
    if (!objective.title || objective.title.length < 10) {
      errors.push('Goal title is too vague')
      suggestions.push('Be more specific about what you want to achieve')
    }

    // Measurable
    if (objective.current_value === undefined || objective.target_value === undefined) {
      errors.push('Goal must have measurable current and target values')
      suggestions.push('Add numeric values to track progress')
    }

    if (!objective.unit) {
      errors.push('Goal must have a unit of measurement')
      suggestions.push('Specify the unit (followers, %, $, etc.)')
    }

    // Achievable
    if (objective.current_value && objective.target_value) {
      const growth = ((objective.target_value - objective.current_value) / objective.current_value) * 100
      if (growth > 500) {
        suggestions.push('Target may be too ambitious. Consider a more realistic growth rate.')
      }
      if (growth < 10) {
        suggestions.push('Target may be too conservative. Consider a more challenging goal.')
      }
    }

    // Relevant
    if (!objective.category) {
      errors.push('Goal must have a category')
      suggestions.push('Choose: awareness, leads, retention, revenue, or engagement')
    }

    // Time-bound
    if (!objective.timeline) {
      errors.push('Goal must have a timeline')
      suggestions.push('Set a deadline: 30/60/90 days, 6 months, or 1 year')
    }

    return {
      valid: errors.length === 0,
      errors,
      suggestions,
    }
  }

  /**
   * Calculate expected completion percentage based on current progress
   */
  static calculateProgress(objective: IntentObjective): number {
    if (objective.status === 'completed') return 100
    if (objective.status === 'paused') return 0

    const range = objective.target_value - objective.current_value
    if (range <= 0) return 100

    // Mock current value - in production, fetch from analytics
    const mockCurrent = objective.current_value + (range * 0.3)
    const progress = ((mockCurrent - objective.current_value) / range) * 100

    return Math.min(100, Math.max(0, progress))
  }

  /**
   * Get timeline in human-readable format
   */
  static formatTimeline(timeline: string): string {
    const map: Record<string, string> = {
      '30_days': '30 Days',
      '60_days': '60 Days',
      '90_days': '90 Days',
      '6_months': '6 Months',
      '1_year': '1 Year',
    }
    return map[timeline] || timeline
  }

  /**
   * Get category display name
   */
  static formatCategory(category: string): string {
    const map: Record<string, string> = {
      awareness: 'Brand Awareness',
      leads: 'Lead Generation',
      retention: 'Customer Retention',
      revenue: 'Revenue Growth',
      engagement: 'Audience Engagement',
      custom: 'Custom Goal',
    }
    return map[category] || category
  }
}
