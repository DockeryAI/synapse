/**
 * Tactics Planner Service
 * Translates strategy into executable marketing tactics and campaigns
 */

export interface TacticalChannel {
  channel: string
  priority: 'primary' | 'secondary' | 'tertiary'
  budget_allocation: number // percentage
  tactics: Tactic[]
  success_metrics: string[]
  resources_needed: string[]
}

export interface Tactic {
  id: string
  name: string
  description: string
  channel: string
  type: 'content' | 'paid' | 'organic' | 'email' | 'event' | 'partnership' | 'PR'
  timeline: string
  effort_level: 'low' | 'medium' | 'high'
  budget_required: 'low' | 'medium' | 'high'
  expected_impact: 'low' | 'medium' | 'high'
  prerequisites: string[]
  steps: TacticStep[]
  status: 'planned' | 'in_progress' | 'completed' | 'paused'
  supports_objectives: string[]
}

export interface TacticStep {
  order: number
  action: string
  owner?: string
  duration_hours: number
  completed: boolean
}

export interface Campaign {
  id: string
  name: string
  description: string
  start_date: string
  end_date: string
  budget: number
  tactics: string[] // tactic IDs
  objectives: string[] // objective IDs
  kpis: CampaignKPI[]
  status: 'planning' | 'active' | 'completed' | 'cancelled'
}

export interface CampaignKPI {
  metric: string
  target: number
  current?: number
  unit: string
}

export interface ResourceAllocation {
  resource_type: 'time' | 'budget' | 'people' | 'tools'
  total_available: number
  allocated: number
  remaining: number
  allocation_by_tactic: Record<string, number>
}

export class TacticsPlanner {
  /**
   * Generate tactical recommendations based on strategy
   */
  static generateTactics(input: {
    strategy: any
    objectives: any[]
    budget: number
    team_size: number
    timeline: string
  }): TacticalChannel[] {
    const channels: TacticalChannel[] = []

    // Content Marketing Tactics
    if (input.strategy.content_strategy) {
      channels.push({
        channel: 'Content Marketing',
        priority: 'primary',
        budget_allocation: 30,
        tactics: this.generateContentTactics(input.strategy, input.objectives),
        success_metrics: ['Website traffic', 'Engagement rate', 'Lead generation', 'SEO rankings'],
        resources_needed: ['Content writers', 'SEO specialist', 'Graphic designer'],
      })
    }

    // Social Media Tactics
    if (input.strategy.content_strategy?.platform_strategies) {
      const socialPlatforms = input.strategy.content_strategy.platform_strategies.filter(
        (p: any) => ['LinkedIn', 'Twitter/X', 'Facebook', 'Instagram'].includes(p.platform)
      )

      if (socialPlatforms.length > 0) {
        channels.push({
          channel: 'Social Media',
          priority: 'primary',
          budget_allocation: 20,
          tactics: this.generateSocialTactics(socialPlatforms, input.objectives),
          success_metrics: ['Follower growth', 'Engagement rate', 'Share of voice', 'Link clicks'],
          resources_needed: ['Social media manager', 'Content creator', 'Community manager'],
        })
      }
    }

    // Email Marketing Tactics
    channels.push({
      channel: 'Email Marketing',
      priority: 'primary',
      budget_allocation: 15,
      tactics: this.generateEmailTactics(input.strategy, input.objectives),
      success_metrics: ['Open rate', 'Click-through rate', 'Conversion rate', 'List growth'],
      resources_needed: ['Email marketer', 'Copywriter', 'Design support'],
    })

    // Paid Advertising Tactics
    if (input.budget > 5000) {
      channels.push({
        channel: 'Paid Advertising',
        priority: 'secondary',
        budget_allocation: 25,
        tactics: this.generatePaidTactics(input.strategy, input.objectives, input.budget),
        success_metrics: ['ROAS', 'CPA', 'CTR', 'Conversion rate', 'Impressions'],
        resources_needed: ['PPC specialist', 'Ad creative designer', 'Landing page developer'],
      })
    }

    // PR & Partnerships
    channels.push({
      channel: 'PR & Partnerships',
      priority: 'secondary',
      budget_allocation: 10,
      tactics: this.generatePRTactics(input.strategy, input.objectives),
      success_metrics: ['Media mentions', 'Backlinks', 'Partner referrals', 'Brand sentiment'],
      resources_needed: ['PR specialist', 'Partnership manager', 'Executive sponsor'],
    })

    return channels
  }

  /**
   * Generate content marketing tactics
   */
  private static generateContentTactics(strategy: any, objectives: any[]): Tactic[] {
    return [
      {
        id: 'tactic-content-blog',
        name: 'Strategic Blog Content',
        description: 'Publish high-quality blog posts targeting key buyer questions and SEO opportunities',
        channel: 'Content Marketing',
        type: 'content',
        timeline: 'Ongoing - 2-3 posts per week',
        effort_level: 'high',
        budget_required: 'medium',
        expected_impact: 'high',
        prerequisites: ['Content calendar', 'SEO keyword research', 'Editorial guidelines'],
        steps: [
          { order: 1, action: 'Research high-intent keywords and topics', duration_hours: 4, completed: false },
          { order: 2, action: 'Create content briefs with target keywords', duration_hours: 2, completed: false },
          { order: 3, action: 'Write and optimize blog posts', duration_hours: 8, completed: false },
          { order: 4, action: 'Design supporting visuals', duration_hours: 2, completed: false },
          { order: 5, action: 'Publish and promote across channels', duration_hours: 2, completed: false },
        ],
        status: 'planned',
        supports_objectives: objectives.filter((o) => o.category === 'awareness').map((o) => o.id),
      },
      {
        id: 'tactic-content-guides',
        name: 'Lead Magnet Guides',
        description: 'Create comprehensive guides and ebooks as lead generation tools',
        channel: 'Content Marketing',
        type: 'content',
        timeline: 'Monthly',
        effort_level: 'high',
        budget_required: 'medium',
        expected_impact: 'high',
        prerequisites: ['Landing page template', 'Email automation', 'Design resources'],
        steps: [
          { order: 1, action: 'Identify high-value topics from customer research', duration_hours: 3, completed: false },
          { order: 2, action: 'Outline comprehensive guide structure', duration_hours: 2, completed: false },
          { order: 3, action: 'Write and edit guide content', duration_hours: 16, completed: false },
          { order: 4, action: 'Design professional PDF layout', duration_hours: 6, completed: false },
          { order: 5, action: 'Create landing page and promotion plan', duration_hours: 4, completed: false },
        ],
        status: 'planned',
        supports_objectives: objectives.filter((o) => o.category === 'leads').map((o) => o.id),
      },
      {
        id: 'tactic-content-video',
        name: 'Educational Video Series',
        description: 'Produce short-form educational videos for YouTube and social platforms',
        channel: 'Content Marketing',
        type: 'content',
        timeline: 'Weekly',
        effort_level: 'high',
        budget_required: 'high',
        expected_impact: 'medium',
        prerequisites: ['Video equipment', 'Editing software', 'Script templates'],
        steps: [
          { order: 1, action: 'Plan video topics and scripts', duration_hours: 3, completed: false },
          { order: 2, action: 'Record video content', duration_hours: 4, completed: false },
          { order: 3, action: 'Edit and add graphics/captions', duration_hours: 6, completed: false },
          { order: 4, action: 'Optimize for each platform', duration_hours: 2, completed: false },
          { order: 5, action: 'Publish and cross-promote', duration_hours: 1, completed: false },
        ],
        status: 'planned',
        supports_objectives: objectives.filter((o) => o.category === 'engagement').map((o) => o.id),
      },
    ]
  }

  /**
   * Generate social media tactics
   */
  private static generateSocialTactics(platforms: any[], objectives: any[]): Tactic[] {
    return [
      {
        id: 'tactic-social-organic',
        name: 'Organic Social Posting',
        description: 'Consistent posting schedule across primary social platforms',
        channel: 'Social Media',
        type: 'organic',
        timeline: 'Daily',
        effort_level: 'medium',
        budget_required: 'low',
        expected_impact: 'medium',
        prerequisites: ['Content calendar', 'Scheduling tool', 'Brand guidelines'],
        steps: [
          { order: 1, action: 'Plan weekly content themes', duration_hours: 2, completed: false },
          { order: 2, action: 'Create social posts and visuals', duration_hours: 6, completed: false },
          { order: 3, action: 'Schedule posts for optimal times', duration_hours: 1, completed: false },
          { order: 4, action: 'Monitor and engage with comments', duration_hours: 3, completed: false },
          { order: 5, action: 'Analyze performance and adjust', duration_hours: 1, completed: false },
        ],
        status: 'planned',
        supports_objectives: objectives.map((o) => o.id),
      },
      {
        id: 'tactic-social-community',
        name: 'Community Engagement',
        description: 'Active participation in industry groups and discussions',
        channel: 'Social Media',
        type: 'organic',
        timeline: 'Daily',
        effort_level: 'medium',
        budget_required: 'low',
        expected_impact: 'medium',
        prerequisites: ['Target group list', 'Engagement guidelines', 'Response templates'],
        steps: [
          { order: 1, action: 'Identify and join relevant communities', duration_hours: 2, completed: false },
          { order: 2, action: 'Monitor discussions for engagement opportunities', duration_hours: 2, completed: false },
          { order: 3, action: 'Provide valuable insights and answers', duration_hours: 3, completed: false },
          { order: 4, action: 'Build relationships with key influencers', duration_hours: 2, completed: false },
        ],
        status: 'planned',
        supports_objectives: objectives.filter((o) => o.category === 'awareness').map((o) => o.id),
      },
    ]
  }

  /**
   * Generate email marketing tactics
   */
  private static generateEmailTactics(strategy: any, objectives: any[]): Tactic[] {
    return [
      {
        id: 'tactic-email-newsletter',
        name: 'Weekly Newsletter',
        description: 'Regular newsletter with industry insights and company updates',
        channel: 'Email Marketing',
        type: 'email',
        timeline: 'Weekly',
        effort_level: 'medium',
        budget_required: 'low',
        expected_impact: 'high',
        prerequisites: ['Email platform', 'Subscriber list', 'Newsletter template'],
        steps: [
          { order: 1, action: 'Curate relevant content and insights', duration_hours: 2, completed: false },
          { order: 2, action: 'Write newsletter copy', duration_hours: 3, completed: false },
          { order: 3, action: 'Design email layout', duration_hours: 1, completed: false },
          { order: 4, action: 'Test and schedule send', duration_hours: 1, completed: false },
          { order: 5, action: 'Analyze open and click rates', duration_hours: 1, completed: false },
        ],
        status: 'planned',
        supports_objectives: objectives.filter((o) => o.category === 'engagement').map((o) => o.id),
      },
      {
        id: 'tactic-email-nurture',
        name: 'Lead Nurture Sequences',
        description: 'Automated email sequences to move leads through the funnel',
        channel: 'Email Marketing',
        type: 'email',
        timeline: 'Ongoing automation',
        effort_level: 'high',
        budget_required: 'medium',
        expected_impact: 'high',
        prerequisites: ['Marketing automation', 'Lead scoring', 'Content library'],
        steps: [
          { order: 1, action: 'Map customer journey stages', duration_hours: 4, completed: false },
          { order: 2, action: 'Create email sequence for each stage', duration_hours: 12, completed: false },
          { order: 3, action: 'Set up automation triggers', duration_hours: 4, completed: false },
          { order: 4, action: 'Test sequences end-to-end', duration_hours: 2, completed: false },
          { order: 5, action: 'Monitor and optimize conversion rates', duration_hours: 2, completed: false },
        ],
        status: 'planned',
        supports_objectives: objectives.filter((o) => o.category === 'leads').map((o) => o.id),
      },
    ]
  }

  /**
   * Generate paid advertising tactics
   */
  private static generatePaidTactics(strategy: any, objectives: any[], budget: number): Tactic[] {
    return [
      {
        id: 'tactic-paid-search',
        name: 'Google Search Ads',
        description: 'Targeted search campaigns for high-intent keywords',
        channel: 'Paid Advertising',
        type: 'paid',
        timeline: 'Ongoing with monthly optimization',
        effort_level: 'medium',
        budget_required: 'high',
        expected_impact: 'high',
        prerequisites: ['Google Ads account', 'Landing pages', 'Conversion tracking'],
        steps: [
          { order: 1, action: 'Research and select target keywords', duration_hours: 4, completed: false },
          { order: 2, action: 'Create ad copy variations', duration_hours: 3, completed: false },
          { order: 3, action: 'Set up campaigns and ad groups', duration_hours: 4, completed: false },
          { order: 4, action: 'Configure bidding and budgets', duration_hours: 2, completed: false },
          { order: 5, action: 'Monitor and optimize performance', duration_hours: 4, completed: false },
        ],
        status: 'planned',
        supports_objectives: objectives.filter((o) => o.category === 'leads' || o.category === 'revenue').map((o) => o.id),
      },
      {
        id: 'tactic-paid-social',
        name: 'Social Media Ads',
        description: 'Targeted campaigns on LinkedIn, Facebook, and Instagram',
        channel: 'Paid Advertising',
        type: 'paid',
        timeline: 'Campaign-based (2-4 weeks)',
        effort_level: 'medium',
        budget_required: 'medium',
        expected_impact: 'medium',
        prerequisites: ['Platform ad accounts', 'Creative assets', 'Audience research'],
        steps: [
          { order: 1, action: 'Define target audience segments', duration_hours: 3, completed: false },
          { order: 2, action: 'Create ad creative and copy', duration_hours: 6, completed: false },
          { order: 3, action: 'Set up campaigns with A/B tests', duration_hours: 3, completed: false },
          { order: 4, action: 'Launch and monitor daily', duration_hours: 2, completed: false },
          { order: 5, action: 'Optimize based on performance data', duration_hours: 3, completed: false },
        ],
        status: 'planned',
        supports_objectives: objectives.filter((o) => o.category === 'awareness' || o.category === 'leads').map((o) => o.id),
      },
    ]
  }

  /**
   * Generate PR and partnership tactics
   */
  private static generatePRTactics(strategy: any, objectives: any[]): Tactic[] {
    return [
      {
        id: 'tactic-pr-outreach',
        name: 'Media Outreach',
        description: 'Pitch stories and insights to industry publications',
        channel: 'PR & Partnerships',
        type: 'PR',
        timeline: 'Monthly pitches',
        effort_level: 'medium',
        budget_required: 'low',
        expected_impact: 'medium',
        prerequisites: ['Media list', 'Press kit', 'Pitch templates'],
        steps: [
          { order: 1, action: 'Research relevant publications and journalists', duration_hours: 4, completed: false },
          { order: 2, action: 'Develop newsworthy story angles', duration_hours: 3, completed: false },
          { order: 3, action: 'Craft personalized pitches', duration_hours: 4, completed: false },
          { order: 4, action: 'Follow up with interested media', duration_hours: 2, completed: false },
          { order: 5, action: 'Track coverage and build relationships', duration_hours: 2, completed: false },
        ],
        status: 'planned',
        supports_objectives: objectives.filter((o) => o.category === 'awareness').map((o) => o.id),
      },
      {
        id: 'tactic-partnerships',
        name: 'Strategic Partnerships',
        description: 'Develop co-marketing partnerships with complementary brands',
        channel: 'PR & Partnerships',
        type: 'partnership',
        timeline: 'Quarterly initiatives',
        effort_level: 'high',
        budget_required: 'low',
        expected_impact: 'high',
        prerequisites: ['Partner criteria', 'Collaboration framework', 'Legal templates'],
        steps: [
          { order: 1, action: 'Identify potential partner companies', duration_hours: 4, completed: false },
          { order: 2, action: 'Develop partnership proposal', duration_hours: 6, completed: false },
          { order: 3, action: 'Reach out and negotiate terms', duration_hours: 8, completed: false },
          { order: 4, action: 'Execute co-marketing campaigns', duration_hours: 12, completed: false },
          { order: 5, action: 'Measure and report on partnership ROI', duration_hours: 3, completed: false },
        ],
        status: 'planned',
        supports_objectives: objectives.map((o) => o.id),
      },
    ]
  }

  /**
   * Calculate resource allocation across tactics
   */
  static calculateResourceAllocation(
    tactics: Tactic[],
    totalBudget: number,
    totalHours: number
  ): ResourceAllocation[] {
    const budgetAllocation: ResourceAllocation = {
      resource_type: 'budget',
      total_available: totalBudget,
      allocated: 0,
      remaining: totalBudget,
      allocation_by_tactic: {},
    }

    const timeAllocation: ResourceAllocation = {
      resource_type: 'time',
      total_available: totalHours,
      allocated: 0,
      remaining: totalHours,
      allocation_by_tactic: {},
    }

    // Simple allocation based on effort and budget levels
    tactics.forEach((tactic) => {
      // Budget allocation
      let tacticBudget = 0
      if (tactic.type === 'paid') {
        tacticBudget = totalBudget * 0.6 // 60% to paid
      } else {
        tacticBudget = (totalBudget * 0.4) / (tactics.length - 1)
      }

      budgetAllocation.allocation_by_tactic[tactic.id] = tacticBudget
      budgetAllocation.allocated += tacticBudget

      // Time allocation
      const tacticHours = tactic.steps.reduce((sum, step) => sum + step.duration_hours, 0)
      timeAllocation.allocation_by_tactic[tactic.id] = tacticHours
      timeAllocation.allocated += tacticHours
    })

    budgetAllocation.remaining = budgetAllocation.total_available - budgetAllocation.allocated
    timeAllocation.remaining = timeAllocation.total_available - timeAllocation.allocated

    return [budgetAllocation, timeAllocation]
  }

  /**
   * Create a campaign from selected tactics
   */
  static createCampaign(
    name: string,
    tactics: Tactic[],
    objectives: any[],
    startDate: string,
    endDate: string,
    budget: number
  ): Campaign {
    return {
      id: `campaign-${Date.now()}`,
      name,
      description: `Integrated campaign with ${tactics.length} tactics across ${new Set(tactics.map((t) => t.channel)).size} channels`,
      start_date: startDate,
      end_date: endDate,
      budget,
      tactics: tactics.map((t) => t.id),
      objectives: objectives.map((o) => o.id),
      kpis: objectives.map((obj) => ({
        metric: obj.title,
        target: obj.target_value,
        unit: obj.unit,
      })),
      status: 'planning',
    }
  }

  /**
   * Prioritize tactics based on impact, effort, and objectives
   */
  static prioritizeTactics(tactics: Tactic[], objectives: any[]): Tactic[] {
    return tactics.sort((a, b) => {
      // Calculate priority score
      const impactWeight = { high: 3, medium: 2, low: 1 }
      const effortWeight = { low: 3, medium: 2, high: 1 } // lower effort = higher score

      const aScore =
        impactWeight[a.expected_impact] * 2 +
        effortWeight[a.effort_level] +
        a.supports_objectives.length

      const bScore =
        impactWeight[b.expected_impact] * 2 +
        effortWeight[b.effort_level] +
        b.supports_objectives.length

      return bScore - aScore
    })
  }
}
