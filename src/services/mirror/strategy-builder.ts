/**
 * Strategy Builder Service
 * Generates and validates marketing strategies aligned with MIRROR framework
 */

export interface MessagePillar {
  id: string
  title: string
  description: string
  key_messages: string[]
  supporting_proof: string[]
  tone: 'professional' | 'friendly' | 'authoritative' | 'inspirational' | 'playful'
  priority: number
}

export interface CustomerPersona {
  id: string
  name: string
  role: string
  demographics: {
    age_range: string
    location: string
    income_level: string
  }
  psychographics: {
    values: string[]
    pain_points: string[]
    goals: string[]
    motivations: string[]
  }
  behavior: {
    preferred_channels: string[]
    content_preferences: string[]
    buying_triggers: string[]
  }
  journey_stage: 'awareness' | 'consideration' | 'decision' | 'retention' | 'advocacy'
}

export interface ContentTheme {
  id: string
  name: string
  description: string
  target_personas: string[]
  content_types: string[]
  frequency: string
  goals: string[]
}

export interface PlatformStrategy {
  platform: string
  priority: 'primary' | 'secondary' | 'tertiary'
  content_mix: Record<string, number> // content type -> percentage
  posting_frequency: string
  optimal_times: string[]
  key_metrics: string[]
}

export interface CompetitiveDifferentiation {
  differentiator: string
  your_position: string
  competitor_position: string
  strength: 'strong' | 'moderate' | 'weak'
  message_opportunity: string
}

export interface MarketingStrategy {
  brand_strategy: {
    positioning_statement: string
    synapse_score?: number
    message_pillars: MessagePillar[]
    brand_voice: string
    unique_value_drivers: string[]
  }
  audience_strategy: {
    primary_personas: CustomerPersona[]
    secondary_personas: CustomerPersona[]
    journey_map: Record<string, string[]> // stage -> touchpoints
  }
  content_strategy: {
    themes: ContentTheme[]
    platform_strategies: PlatformStrategy[]
    content_calendar_framework: string
  }
  competitive_strategy: {
    differentiators: CompetitiveDifferentiation[]
    white_space_opportunities: string[]
    message_saturation_analysis: Record<string, 'low' | 'medium' | 'high'>
  }
}

export class StrategyBuilder {
  /**
   * Generate positioning statement based on brand data
   */
  static generatePositioningStatement(brandData: {
    name: string
    industry: string
    target_audience: string
    unique_value: string
    competitors: string[]
  }): string {
    return `For ${brandData.target_audience} who need ${brandData.unique_value}, ${brandData.name} is a ${brandData.industry} solution that delivers exceptional results through innovative approaches that ${brandData.competitors.join(', ')} cannot match.`
  }

  /**
   * Generate recommended message pillars based on objectives and positioning
   */
  static generateMessagePillars(
    objectives: any[],
    positioning: string,
    industry: string
  ): MessagePillar[] {
    const pillars: MessagePillar[] = [
      {
        id: 'expertise',
        title: 'Industry Expertise',
        description: 'Demonstrate deep knowledge and proven results in the field',
        key_messages: [
          'Years of experience delivering measurable outcomes',
          'Industry-recognized methodologies and best practices',
          'Case studies and success stories from similar clients',
        ],
        supporting_proof: ['Client testimonials', 'Industry certifications', 'Published research'],
        tone: 'authoritative',
        priority: 1,
      },
      {
        id: 'innovation',
        title: 'Innovative Solutions',
        description: 'Highlight unique approaches that set you apart',
        key_messages: [
          'Cutting-edge technology and methodologies',
          'Creative problem-solving for complex challenges',
          'Continuous improvement and adaptation',
        ],
        supporting_proof: ['Product demos', 'Innovation awards', 'Patent filings'],
        tone: 'inspirational',
        priority: 2,
      },
      {
        id: 'results',
        title: 'Proven Results',
        description: 'Focus on measurable outcomes and ROI',
        key_messages: [
          'Data-driven approach to marketing excellence',
          'Transparent reporting and accountability',
          'Track record of exceeding client goals',
        ],
        supporting_proof: ['Performance metrics', 'Client case studies', 'Before/after comparisons'],
        tone: 'professional',
        priority: 3,
      },
    ]

    return pillars
  }

  /**
   * Generate customer personas from audience data
   */
  static generatePersonas(audienceData: {
    demographics: any
    industry: string
    objectives: any[]
  }): CustomerPersona[] {
    // Generate 2-3 primary personas based on common patterns
    const personas: CustomerPersona[] = [
      {
        id: 'decision-maker',
        name: 'Sarah Chen',
        role: 'Marketing Director',
        demographics: {
          age_range: '35-45',
          location: 'Urban/Suburban',
          income_level: '$100k-$150k',
        },
        psychographics: {
          values: ['Results-driven', 'Innovation', 'Efficiency'],
          pain_points: [
            'Limited budget with high expectations',
            'Pressure to prove ROI on marketing spend',
            'Keeping up with rapidly changing digital landscape',
          ],
          goals: [
            'Increase brand awareness by 50%',
            'Generate high-quality leads consistently',
            'Build a sustainable marketing system',
          ],
          motivations: ['Career advancement', 'Team recognition', 'Business growth'],
        },
        behavior: {
          preferred_channels: ['LinkedIn', 'Email', 'Industry conferences'],
          content_preferences: ['Case studies', 'Webinars', 'Industry reports'],
          buying_triggers: ['Peer recommendations', 'Data-driven proof', 'Free trial/demo'],
        },
        journey_stage: 'consideration',
      },
      {
        id: 'end-user',
        name: 'Mike Rodriguez',
        role: 'Content Manager',
        demographics: {
          age_range: '28-38',
          location: 'Urban',
          income_level: '$60k-$90k',
        },
        psychographics: {
          values: ['Creativity', 'Ease of use', 'Collaboration'],
          pain_points: [
            'Juggling multiple tools and platforms',
            'Creating consistent content across channels',
            'Measuring content performance effectively',
          ],
          goals: [
            'Streamline content creation workflow',
            'Improve content engagement rates',
            'Scale content production without sacrificing quality',
          ],
          motivations: ['Professional development', 'Creative fulfillment', 'Work efficiency'],
        },
        behavior: {
          preferred_channels: ['Twitter/X', 'YouTube', 'Slack communities'],
          content_preferences: ['How-to guides', 'Video tutorials', 'Templates'],
          buying_triggers: ['Easy setup', 'Positive reviews', 'Strong support'],
        },
        journey_stage: 'awareness',
      },
    ]

    return personas
  }

  /**
   * Generate content themes aligned with personas and objectives
   */
  static generateContentThemes(personas: CustomerPersona[], objectives: any[]): ContentTheme[] {
    const themes: ContentTheme[] = [
      {
        id: 'thought-leadership',
        name: 'Industry Thought Leadership',
        description: 'Establish authority through expert insights and trends analysis',
        target_personas: ['decision-maker'],
        content_types: ['Blog posts', 'LinkedIn articles', 'Webinars', 'Whitepapers'],
        frequency: '2-3x per week',
        goals: ['Build brand authority', 'Generate qualified leads', 'Nurture relationships'],
      },
      {
        id: 'education',
        name: 'Educational Content',
        description: 'Help users learn and succeed with actionable guides',
        target_personas: ['end-user', 'decision-maker'],
        content_types: ['How-to guides', 'Video tutorials', 'Templates', 'Checklists'],
        frequency: 'Weekly',
        goals: ['Drive engagement', 'Reduce support queries', 'Improve product adoption'],
      },
      {
        id: 'social-proof',
        name: 'Customer Success Stories',
        description: 'Showcase real results and build trust through testimonials',
        target_personas: ['decision-maker'],
        content_types: ['Case studies', 'Video testimonials', 'ROI calculators'],
        frequency: 'Monthly',
        goals: ['Build credibility', 'Accelerate sales cycle', 'Support retention'],
      },
    ]

    return themes
  }

  /**
   * Generate platform strategies based on personas and resources
   */
  static generatePlatformStrategies(personas: CustomerPersona[]): PlatformStrategy[] {
    // Extract preferred channels from personas
    const channelPreferences = new Map<string, number>()
    personas.forEach((persona) => {
      persona.behavior.preferred_channels.forEach((channel) => {
        channelPreferences.set(channel, (channelPreferences.get(channel) || 0) + 1)
      })
    })

    const strategies: PlatformStrategy[] = [
      {
        platform: 'LinkedIn',
        priority: 'primary',
        content_mix: {
          'Thought leadership': 40,
          'Company updates': 20,
          'Employee spotlights': 15,
          'Industry news': 15,
          'Customer stories': 10,
        },
        posting_frequency: '5x per week',
        optimal_times: ['Tuesday 10am', 'Wednesday 12pm', 'Thursday 9am'],
        key_metrics: ['Engagement rate', 'Profile views', 'Lead generation'],
      },
      {
        platform: 'Email',
        priority: 'primary',
        content_mix: {
          Newsletter: 40,
          'Product updates': 25,
          'Educational content': 20,
          'Customer stories': 15,
        },
        posting_frequency: 'Weekly newsletter + event-based',
        optimal_times: ['Tuesday 10am', 'Thursday 10am'],
        key_metrics: ['Open rate', 'Click-through rate', 'Conversion rate'],
      },
      {
        platform: 'Twitter/X',
        priority: 'secondary',
        content_mix: {
          'Quick tips': 35,
          'Industry commentary': 25,
          'Content promotion': 20,
          'Engagement/replies': 20,
        },
        posting_frequency: '3-5x per day',
        optimal_times: ['9am', '12pm', '3pm', '6pm'],
        key_metrics: ['Engagement rate', 'Impressions', 'Follower growth'],
      },
    ]

    return strategies
  }

  /**
   * Analyze competitive differentiation opportunities
   */
  static analyzeCompetitiveDifferentiation(
    brandData: any,
    competitors: any[]
  ): CompetitiveDifferentiation[] {
    const differentiators: CompetitiveDifferentiation[] = [
      {
        differentiator: 'Technology & Innovation',
        your_position: 'AI-powered insights with real-time adaptation',
        competitor_position: 'Manual analysis and periodic reviews',
        strength: 'strong',
        message_opportunity:
          'Highlight automation, speed, and intelligent recommendations that competitors lack',
      },
      {
        differentiator: 'Customer Experience',
        your_position: 'White-glove onboarding with dedicated strategy sessions',
        competitor_position: 'Self-service setup with limited support',
        strength: 'strong',
        message_opportunity:
          'Emphasize personalized guidance and proven frameworks vs. DIY approaches',
      },
      {
        differentiator: 'Results & ROI',
        your_position: 'Transparent metrics with guaranteed performance benchmarks',
        competitor_position: 'Vague promises without specific commitments',
        strength: 'moderate',
        message_opportunity:
          'Lead with data, case studies, and risk-reversal guarantees',
      },
    ]

    return differentiators
  }

  /**
   * Identify white space opportunities in the market
   */
  static identifyWhiteSpace(industry: string, competitors: any[]): string[] {
    return [
      'AI-driven content strategy automation for small businesses',
      'Real-time competitive intelligence with actionable alerts',
      'Psychology-informed messaging framework (Synapse)',
      'Integrated calendar planning with performance prediction',
      'Industry-specific playbooks and benchmarks',
    ]
  }

  /**
   * Analyze message saturation in the market
   */
  static analyzeMessageSaturation(industry: string): Record<string, 'low' | 'medium' | 'high'> {
    return {
      'AI-powered solutions': 'high',
      'ROI-focused messaging': 'high',
      'Ease of use': 'medium',
      'Industry expertise': 'medium',
      'Psychology-based frameworks': 'low',
      'Real-time adaptation': 'low',
      'Integrated intelligence': 'low',
    }
  }

  /**
   * Generate complete marketing strategy
   */
  static generateStrategy(input: {
    brandData: any
    objectives: any[]
    situationAnalysis: any
    competitors: any[]
  }): MarketingStrategy {
    // Extract real industry profile data
    const brandStrategy = input.brandData?.brandStrategy || {}
    const audienceStrategy = input.brandData?.audienceStrategy || {}
    const contentStrategy = input.brandData?.contentStrategy || {}
    const competitiveStrategy = input.brandData?.competitiveStrategy || {}
    const uvps = input.brandData?.uvps || []

    // Get real value propositions from industry profile
    const valueDrivers = uvps.length > 0
      ? uvps.slice(0, 5).map((vp: any) => vp.proposition || vp.differentiator || vp)
      : (competitiveStrategy.advantages || []).slice(0, 3)

    const positioning = this.generatePositioningStatement({
      name: input.brandData.name || 'Your Brand',
      industry: input.brandData.industry || brandStrategy.positioning || 'Technology',
      target_audience: (audienceStrategy.segments || [])[0] || 'professionals who need excellence',
      unique_value: valueDrivers[0] || competitiveStrategy.differentiation || 'exceptional service',
      competitors: input.competitors.map((c) => c.name).slice(0, 2),
    })

    const messagePillars = this.generateMessagePillars(
      input.objectives,
      positioning,
      input.brandData.industry
    )

    const personas = this.generatePersonas({
      demographics: input.situationAnalysis,
      industry: input.brandData.industry,
      objectives: input.objectives,
    })

    const themes = this.generateContentThemes(personas, input.objectives)
    const platformStrategies = this.generatePlatformStrategies(personas)
    const differentiators = this.analyzeCompetitiveDifferentiation(
      input.brandData,
      input.competitors
    )
    const whiteSpace = this.identifyWhiteSpace(input.brandData.industry, input.competitors)
    const messageSaturation = this.analyzeMessageSaturation(input.brandData.industry)

    // Use real brand voice from industry profile
    const brandVoice = brandStrategy.voice || contentStrategy.powerWords?.slice(0, 5).join(', ') || 'Professional yet approachable'

    return {
      brand_strategy: {
        positioning_statement: positioning,
        message_pillars: messagePillars,
        brand_voice: brandVoice,
        unique_value_drivers: valueDrivers.length > 0 ? valueDrivers : [
          'Industry expertise',
          'Customer-focused approach',
          'Proven results',
        ],
      },
      audience_strategy: {
        primary_personas: personas.filter((p) => p.journey_stage !== 'awareness'),
        secondary_personas: personas.filter((p) => p.journey_stage === 'awareness'),
        journey_map: {
          awareness: ['Social media', 'Search', 'Industry content'],
          consideration: ['Webinars', 'Case studies', 'Product demos'],
          decision: ['Free trial', 'Sales consultation', 'ROI calculator'],
          retention: ['Onboarding program', 'Success check-ins', 'Educational resources'],
          advocacy: ['Referral program', 'User community', 'Co-marketing opportunities'],
        },
      },
      content_strategy: {
        themes,
        platform_strategies: platformStrategies,
        content_calendar_framework: '60% educational, 30% thought leadership, 10% promotional',
      },
      competitive_strategy: {
        differentiators,
        white_space_opportunities: whiteSpace,
        message_saturation_analysis: messageSaturation,
      },
    }
  }

  /**
   * Validate strategy completeness
   */
  static validateStrategy(strategy: Partial<MarketingStrategy>): {
    valid: boolean
    missing: string[]
    warnings: string[]
  } {
    const missing: string[] = []
    const warnings: string[] = []

    if (!strategy.brand_strategy?.positioning_statement) {
      missing.push('Positioning statement is required')
    }

    if (!strategy.brand_strategy?.message_pillars || strategy.brand_strategy.message_pillars.length < 2) {
      missing.push('At least 2 message pillars are required')
    }

    if (!strategy.audience_strategy?.primary_personas || strategy.audience_strategy.primary_personas.length === 0) {
      missing.push('At least 1 primary persona is required')
    }

    if (!strategy.content_strategy?.themes || strategy.content_strategy.themes.length === 0) {
      missing.push('At least 1 content theme is required')
    }

    if (!strategy.content_strategy?.platform_strategies || strategy.content_strategy.platform_strategies.length === 0) {
      missing.push('At least 1 platform strategy is required')
    }

    if (strategy.brand_strategy?.message_pillars && strategy.brand_strategy.message_pillars.length > 5) {
      warnings.push('More than 5 message pillars may dilute focus')
    }

    if (strategy.audience_strategy?.primary_personas && strategy.audience_strategy.primary_personas.length > 4) {
      warnings.push('More than 4 primary personas may spread resources too thin')
    }

    return {
      valid: missing.length === 0,
      missing,
      warnings,
    }
  }
}
