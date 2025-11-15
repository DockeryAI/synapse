/**
 * Industry Service
 * Fetches industry profile data and generates MIRROR sections
 */

import { supabase } from '@/lib/supabase'

export interface IndustryProfile {
  naics_code: string
  title: string
  description?: string
  has_full_profile: boolean
  keywords?: string[]
  key_trends?: string[]
  customer_segments?: string[]
  pain_points?: string[]
  common_objections?: string[]
  success_metrics?: string[]
  competitive_landscape?: string
  full_profile_data?: any
}

export interface MirrorSections {
  measure: any
  intend: any
  reimagine: any
  reach: any
  optimize: any
  reflect: any
}

/**
 * Fetch industry profile by NAICS code
 */
export async function getIndustryProfile(naicsCode: string): Promise<IndustryProfile | null> {
  try {
    const { data, error } = await supabase
      .from('industry_profiles')
      .select('*')
      .eq('naics_code', naicsCode)
      .single()

    if (error) {
      console.error('Error fetching industry profile:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getIndustryProfile:', error)
    return null
  }
}

/**
 * Generate MIRROR sections from industry profile data
 */
export async function generateMirrorSectionsFromIndustry(
  brandName: string,
  industryProfile: IndustryProfile,
  websiteData?: any,
  customization?: any,
  seoMetrics?: any,
  competitorAnalysis?: any,
  contentGaps?: any,
  youtubeTrends?: any
): Promise<MirrorSections> {
  const fullProfile = industryProfile.full_profile_data || {}

  // Merge customization with industry profile
  const enrichedProfile = customization ? {
    ...fullProfile,
    // Override with real customization from website
    uvps: customization.realUVPs?.length ? customization.realUVPs : fullProfile.uvps,
    emotional_triggers: customization.customizedEmotionalTriggers?.length
      ? customization.customizedEmotionalTriggers
      : fullProfile.emotional_triggers,
    brand_voice: customization.brandVoice || fullProfile.brand_voice,
    messaging_themes: customization.messagingThemes || fullProfile.messaging_themes,
    // Add positioning_statement and content_pillars for brand health calculator
    positioning_statement: customization.realUVPs?.[0]
      ? `${customization.realUVPs[0].uvp || customization.realUVPs[0].proposition}. ${customization.realUVPs[0].differentiator || ''}`
      : (customization.brandVoice?.substring(0, 200) || ''),
    content_pillars: (customization.messagingThemes || []).slice(0, 5).map((theme: string, i: number) => ({
      id: `pillar-${i + 1}`,
      title: theme,
      description: `Content focused on ${theme.toLowerCase()}`,
      priority: i < 2 ? 'high' : 'medium'
    }))
  } : {
    ...fullProfile,
    // Generate basic positioning from generic profile
    positioning_statement: fullProfile.uvps?.[0]
      ? (typeof fullProfile.uvps[0] === 'string' ? fullProfile.uvps[0] : (fullProfile.uvps[0].proposition || fullProfile.uvps[0].prop || ''))
      : '',
    content_pillars: (fullProfile.messaging_themes || []).slice(0, 5).map((theme: string, i: number) => ({
      id: `pillar-${i + 1}`,
      title: theme,
      description: `Content focused on ${theme.toLowerCase()}`,
      priority: i < 2 ? 'high' : 'medium'
    }))
  }

  // Calculate real brand health using BrandHealthCalculator
  console.log('[generateMirrorSections] Calculating brand health...')
  const { BrandHealthCalculator } = await import('@/services/mirror/brand-health-calculator')

  const brandHealthScore = await BrandHealthCalculator.calculate({
    brandProfile: {
      name: brandName,
      full_profile_data: enrichedProfile,
      positioning_statement: enrichedProfile.positioning_statement || '',
      content_pillars: enrichedProfile.content_pillars || []
    } as any,
    industryData: industryProfile,
    seoMetrics: seoMetrics
  })

  console.log('[generateMirrorSections] Brand health calculated:', brandHealthScore.overall)

  return {
    measure: generateMeasureSection(brandName, industryProfile, enrichedProfile, websiteData, brandHealthScore, seoMetrics, competitorAnalysis, contentGaps, youtubeTrends),
    intend: generateIntendSection(brandName, industryProfile, enrichedProfile),
    reimagine: generateReimagineSection(brandName, industryProfile, enrichedProfile, customization),
    reach: generateReachSection(brandName, industryProfile, enrichedProfile),
    optimize: generateOptimizeSection(brandName, industryProfile, enrichedProfile, contentGaps),
    reflect: generateReflectSection(brandName, industryProfile, enrichedProfile)
  }
}

function generateMeasureSection(brandName: string, profile: IndustryProfile, fullProfile: any, websiteData?: any, brandHealthScore?: any, seoMetrics?: any, competitorAnalysis?: any, contentGaps?: any, youtubeTrends?: any) {
  return {
    industry: profile.title,
    brandHealth: brandHealthScore?.overall || 50, // Use calculated score, fallback to 50 if unavailable
    brandHealthDetails: brandHealthScore || null, // Store complete health data
    seoMetrics: seoMetrics || null, // SEMrush SEO data
    keywordOpportunities: seoMetrics?.opportunities || [], // Keyword opportunities
    competitorAnalysis: competitorAnalysis || null, // Competitor intelligence
    contentGapAnalysis: contentGaps || null, // NEW: Content gap analysis
    youtubeTrends: youtubeTrends || null, // NEW: YouTube trending content analysis
    currentMetrics: {
      'Market Awareness': 0,
      'Customer Satisfaction': 0,
      'Brand Recognition': 0
    },
    marketPosition: {
      description: `${brandName} operates in the ${profile.title} industry.`,
      keyTrends: profile.key_trends || fullProfile.customer_triggers?.slice(0, 5).map((t: any) => t.trigger) || [],
      opportunities: fullProfile.urgency_drivers?.slice(0, 3) || []
    },
    competitiveLandscape: {
      description: profile.competitive_landscape || 'Analyzing competitive landscape...',
      advantages: fullProfile.competitive_advantages || []
    },
    assets: {
      strengths: [],
      weaknesses: [],
      opportunities: profile.key_trends || [],
      threats: []
    },
    insights: [
      {
        type: 'trends',
        title: 'Industry Trends',
        description: (profile.key_trends || []).slice(0, 3).join('; '),
        impact: 'high'
      }
    ],
    // Psychology Fields
    emotional_triggers: fullProfile.emotional_triggers || [],
    emotional_journey: fullProfile.emotional_journey_map || {},
    customer_avatars: fullProfile.customer_avatars || [],
    // API Data (enriched during brand creation)
    weather_opportunities: [],
    trending_topics: youtubeTrends?.trending_topics || [],
    industry_news: [],
    competitor_intelligence: []
  }
}

function generateIntendSection(brandName: string, profile: IndustryProfile, fullProfile: any) {
  const transformations = fullProfile.transformations || []
  const successMetrics = fullProfile.success_metrics || profile.success_metrics || []

  return {
    goals: transformations.slice(0, 3).map((t: any, i: number) => ({
      id: `goal-${i}`,
      title: t.from || `Transform customer experience ${i + 1}`,
      description: `Move from ${t.from || 'current state'} to ${t.to || 'improved state'}`,
      emotional_value: t.emotional_value,
      target: t.to,
      metrics: []
    })),
    objectives: [
      {
        id: crypto.randomUUID(),
        title: 'Establish Market Presence',
        description: `Build ${brandName}'s reputation in ${profile.title}`,
        kpis: successMetrics.slice(0, 3).map((m: any) => ({
          metric: m.metric || m,
          target: m.timeframe || 'Q1 2025',
          current: 0
        }))
      }
    ],
    targets: successMetrics.slice(0, 5).map((m: any, i: number) => ({
      id: crypto.randomUUID(),
      metric: m.metric || m,
      current: 0,
      target: 100,
      timeframe: m.timeframe || '6 months'
    })),
    // NEW: Psychology Fields - Golden Circle
    golden_circle: {
      why: fullProfile.why || '',
      how: fullProfile.how || '',
      what: fullProfile.what || ''
    },
    persona_priorities: fullProfile.persona_priority_ranking || []
  }
}

function generateReimagineSection(brandName: string, profile: IndustryProfile, fullProfile: any, customization?: any) {
  const valueProps = fullProfile.value_propositions || []
  const competitive = fullProfile.competitive_advantages || []
  const messaging = fullProfile.messaging_frameworks || {}

  return {
    brandStrategy: {
      positioning: `${brandName} as a trusted provider in ${profile.title}`,
      personality: messaging.premium_messaging || 'Professional, reliable, customer-focused',
      voice: messaging.budget_conscious || 'Clear, helpful, and accessible'
    },
    audienceStrategy: {
      segments: profile.customer_segments || [],
      painPoints: profile.pain_points || [],
      desires: fullProfile.transformations?.map((t: any) => t.emotional_value).slice(0, 3) || []
    },
    contentStrategy: {
      themes: profile.key_trends || [],
      powerWords: fullProfile.power_words?.slice(0, 20) || [],
      avoidWords: fullProfile.avoid_words?.slice(0, 15) || []
    },
    competitiveStrategy: {
      advantages: competitive.slice(0, 5),
      differentiation: valueProps.slice(0, 3).map((vp: any) => vp.differentiator || vp.prop || vp).join('; ')
    },
    uvps: valueProps.slice(0, 5).map((vp: any, i: number) => ({
      id: `uvp-${i}`,
      proposition: vp.prop || vp,
      differentiator: vp.differentiator || '',
      rank: vp.rank || i + 1
    })),
    // NEW: Psychology Fields
    golden_circle: {
      why: fullProfile.why || '',
      how: fullProfile.how || '',
      what: fullProfile.what || ''
    },
    brand_archetype: {
      primary: fullProfile.primary_archetype || '',
      secondary: fullProfile.secondary_archetype || '',
      characteristics: fullProfile.archetype_characteristics || {}
    },
    brand_story: fullProfile.brand_story_template || {},
    origin_story: fullProfile.origin_story_elements || {},
    narrative: fullProfile.narrative_arc || {}
  }
}

function generateReachSection(brandName: string, profile: IndustryProfile, fullProfile: any) {
  const headlines = fullProfile.headline_templates || []
  const ctas = fullProfile.cta_templates || []
  const socialPosts = fullProfile.social_post_templates || []

  return {
    channels: [
      {
        id: 'website',
        name: 'Website',
        priority: 'high',
        status: 'active',
        tactics: headlines.slice(0, 3).map((h: any) => h.template)
      },
      {
        id: 'social',
        name: 'Social Media',
        priority: 'high',
        status: 'planned',
        tactics: socialPosts.slice(0, 3).map((p: any) => `${p.platform}: ${p.template}`)
      }
    ],
    campaigns: [
      {
        id: 'launch',
        name: 'Brand Launch Campaign',
        status: 'planning',
        channels: ['website', 'social', 'email'],
        budget: 0,
        timeline: '3 months'
      }
    ],
    tactics: [
      ...headlines.slice(0, 5).map((h: any, i: number) => ({
        id: `headline-${i}`,
        type: 'headline',
        content: h.template,
        channel: 'website',
        ctr: h.expected_ctr,
        useCase: h.use_case
      })),
      ...ctas.slice(0, 5).map((cta: any, i: number) => ({
        id: `cta-${i}`,
        type: 'cta',
        content: cta.template,
        channel: 'website',
        conversionRate: cta.conversion_rate,
        placement: cta.placement
      }))
    ],
    // NEW: Psychology Fields
    psychological_hooks: fullProfile.psychological_hooks || [],
    persuasion_sequences: fullProfile.persuasion_sequences || []
  }
}

function generateOptimizeSection(brandName: string, profile: IndustryProfile, fullProfile: any, contentGaps?: any) {
  const pricing = fullProfile.pricing_psychology || {}
  const tiers = fullProfile.tiered_service_models || []

  // Generate priority actions from content gaps
  const contentGapActions = contentGaps?.quick_wins?.slice(0, 3).map((gap: any, index: number) => ({
    id: `content-gap-${index}`,
    title: `Create content for "${gap.category}"`,
    description: `Quick win opportunity: ${gap.content_pieces_needed} pieces needed. Est. ${gap.estimated_monthly_leads} leads/month.`,
    priority: 'high',
    status: 'pending',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    assignee: 'Team',
    estimatedRevenue: gap.estimated_monthly_revenue
  })) || []

  return {
    actions: [
      {
        id: 'action-1',
        title: 'Set up analytics tracking',
        description: 'Implement comprehensive analytics',
        priority: 'high',
        status: 'pending',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        assignee: 'Team'
      },
      {
        id: 'action-2',
        title: 'Launch website',
        description: 'Deploy brand website with optimized content',
        priority: 'high',
        status: 'pending',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        assignee: 'Team'
      },
      ...contentGapActions
    ],
    timeline: {
      phases: [
        { name: 'Setup', duration: '2 weeks', status: 'active' },
        { name: 'Launch', duration: '1 month', status: 'pending' },
        { name: 'Growth', duration: '3 months', status: 'pending' }
      ]
    },
    priorities: {
      high: ['Analytics', 'Website', 'Brand Identity'],
      medium: ['Social Media', 'Content Creation'],
      low: ['Partnership Outreach']
    },
    pricingStrategy: {
      psychology: pricing.anchoring || 'Value-based pricing',
      sweetSpots: pricing.sweet_spots || [],
      tiers: tiers.slice(0, 3).map((tier: any) => ({
        name: tier.tier,
        priceRange: tier.price_range,
        targetCustomer: tier.target_customer,
        margin: tier.margin
      }))
    },
    contentGapPriorities: contentGaps?.quick_wins || [], // NEW: Content gap quick wins
    persona_priorities: fullProfile.persona_priority_ranking || [],
    narrative_arc: fullProfile.narrative_arc || {}
  }
}

function generateReflectSection(brandName: string, profile: IndustryProfile, fullProfile: any) {
  const successMetrics = fullProfile.success_metrics || profile.success_metrics || []
  const retention = fullProfile.retention_hooks || []

  return {
    kpis: successMetrics.slice(0, 6).map((m: any, i: number) => ({
      id: `kpi-${i}`,
      name: m.metric || m,
      current: 0,
      target: 100,
      trend: 'neutral',
      timeframe: m.timeframe || 'Monthly'
    })),
    insights: [
      {
        id: 'insight-1',
        title: 'Industry Positioning',
        description: `${brandName} is positioned in ${profile.title}`,
        type: 'positive',
        date: new Date().toISOString()
      }
    ],
    recommendations: [
      {
        id: 'rec-1',
        title: 'Focus on customer retention',
        description: retention.slice(0, 3).join('; ') || 'Build long-term customer relationships',
        priority: 'high',
        impact: 'high'
      },
      {
        id: 'rec-2',
        title: 'Monitor industry trends',
        description: (profile.key_trends || []).slice(0, 3).join('; ') || 'Stay updated on market changes',
        priority: 'medium',
        impact: 'medium'
      }
    ],
    // NEW: Psychology Fields
    emotional_kpis: (fullProfile.emotional_triggers || []).slice(0, 6).map((t: any, i: number) => ({
      id: `emotion-kpi-${i}`,
      emotion: t.emotion || 'Customer Satisfaction',
      current: 0,
      target: (t.intensity || 7) * 10,
      trend: 'neutral'
    }))
  }
}

/**
 * Create brand and populate MIRROR sections WITH WEBSITE ANALYSIS
 */
export async function createBrandWithIndustryData(
  domain: string,
  naicsCode: string,
  userId?: string,
  onProgress?: (step: string) => void
): Promise<{ brand: any; mirrorSections: MirrorSections; websiteData?: any } | null> {
  try {
    console.log(`[createBrandWithIndustryData] Starting for domain: ${domain}, NAICS: ${naicsCode}`)

    // Step 1: Get industry profile
    onProgress?.('loading-profile')
    const industryProfile = await getIndustryProfile(naicsCode)
    console.log('[createBrandWithIndustryData] Industry profile:', industryProfile ? 'Found' : 'Not found')

    if (!industryProfile) {
      throw new Error(`Industry profile not found for NAICS code: ${naicsCode}`)
    }

    // Step 2: Scrape the actual website
    onProgress?.('scraping-website')
    console.log('[createBrandWithIndustryData] Scraping website...')

    let websiteData
    let customization

    try {
      const { scrapeWebsite } = await import('@/services/scraping/websiteScraper')
      websiteData = await scrapeWebsite(domain)
      console.log('[createBrandWithIndustryData] Website scraped successfully')

      // Step 3: Analyze with AI and customize industry profile
      onProgress?.('analyzing-website')
      console.log('[createBrandWithIndustryData] Analyzing with AI...')

      const { customizeIndustryProfile } = await import('@/services/ai/websiteAnalyzer')
      customization = await customizeIndustryProfile(websiteData, industryProfile)
      console.log('[createBrandWithIndustryData] AI analysis complete')
    } catch (scrapeError) {
      console.warn('[createBrandWithIndustryData] Website analysis failed, using generic profile:', scrapeError)
      // Continue with generic profile if scraping/analysis fails
    }

    // Step 4: Create brand with enriched data
    onProgress?.('creating-brand')
    console.log('[createBrandWithIndustryData] Creating brand...')

    const brandName = websiteData?.metadata.title || domain
    const brandData: any = {
      name: brandName,
      website: domain,
      industry: industryProfile.title,
      user_id: userId || null,
    }

    // Add extracted website data if available
    if (websiteData?.design) {
      if (websiteData.design.logo) brandData.logo_url = websiteData.design.logo
      if (websiteData.design.colors?.length) brandData.colors = websiteData.design.colors
      if (websiteData.design.fonts?.length) brandData.fonts = websiteData.design.fonts
    }

    // CRITICAL: Add AI customization to brand profile
    if (customization) {
      const profileData = {
        ...industryProfile.full_profile_data,
        // Override with customized data from AI
        brand_voice: customization.brandVoice,
        messaging_themes: customization.messagingThemes || [],
        uvps: customization.realUVPs || [],
        emotional_triggers: customization.customizedEmotionalTriggers || [],
        brand_story: customization.actualBrandStory,
        brand_values: customization.extractedValues || [],
        target_audience: customization.targetAudience,
      }
      brandData.profile_data = profileData
      brandData.full_profile_data = profileData // For brand health calculator compatibility

      // Generate positioning_statement from first UVP and brand voice
      const firstUVP = customization.realUVPs?.[0]
      if (firstUVP) {
        brandData.positioning_statement = `${firstUVP.uvp || firstUVP.proposition}. ${firstUVP.differentiator || ''}`
      } else {
        brandData.positioning_statement = customization.brandVoice?.substring(0, 200) || ''
      }

      // Generate content_pillars from messaging_themes
      brandData.content_pillars = (customization.messagingThemes || []).slice(0, 5).map((theme: string, i: number) => ({
        id: `pillar-${i + 1}`,
        title: theme,
        description: `Content focused on ${theme.toLowerCase()}`,
        priority: i < 2 ? 'high' : 'medium'
      }))
    } else {
      // Use generic profile if no customization
      brandData.profile_data = industryProfile.full_profile_data
      brandData.full_profile_data = industryProfile.full_profile_data

      // Generate basic positioning from generic profile
      const genericUVPs = industryProfile.full_profile_data?.uvps || []
      if (genericUVPs.length > 0) {
        const firstUVP = genericUVPs[0]
        brandData.positioning_statement = typeof firstUVP === 'string'
          ? firstUVP
          : (firstUVP.proposition || firstUVP.prop || '')
      }

      // Generate basic content pillars
      const themes = industryProfile.full_profile_data?.messaging_themes || []
      brandData.content_pillars = themes.slice(0, 5).map((theme: string, i: number) => ({
        id: `pillar-${i + 1}`,
        title: theme,
        description: `Content focused on ${theme.toLowerCase()}`,
        priority: i < 2 ? 'high' : 'medium'
      }))
    }

    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .insert(brandData)
      .select()
      .single()

    if (brandError) {
      console.error('[createBrandWithIndustryData] Brand creation error:', brandError)
      throw new Error(`Brand creation failed: ${brandError.message}`)
    }

    console.log('[createBrandWithIndustryData] Brand created:', brand.id)

    // Step 4.5: Fetch SEO metrics from SEMrush
    console.log('[createBrandWithIndustryData] Fetching SEO metrics...')
    let seoMetrics
    try {
      const { SemrushAPI } = await import('@/services/intelligence/semrush-api')
      seoMetrics = await SemrushAPI.getComprehensiveSEOMetrics(domain, brandName)
      console.log('[createBrandWithIndustryData] SEO metrics fetched:', {
        authorityScore: seoMetrics.overview.authority_score,
        keywords: seoMetrics.rankings.length,
        opportunities: seoMetrics.opportunities.length
      })
    } catch (seoError) {
      console.warn('[createBrandWithIndustryData] SEO metrics failed:', seoError)
      seoMetrics = null
    }

    // Step 4.6: Discover competitors
    console.log('[createBrandWithIndustryData] Discovering competitors...')
    let competitorAnalysis
    try {
      const { CompetitorDiscovery } = await import('@/services/intelligence/competitor-discovery')
      competitorAnalysis = await CompetitorDiscovery.discoverCompetitors(
        domain,
        industryProfile.title,
        brandName
      )
      console.log('[createBrandWithIndustryData] Competitors discovered:', {
        total: competitorAnalysis.total_found,
        marketLeaders: competitorAnalysis.market_leaders.length,
        primary: competitorAnalysis.primary_competitors.length,
        emerging: competitorAnalysis.emerging_competitors.length
      })
    } catch (competitorError) {
      console.warn('[createBrandWithIndustryData] Competitor discovery failed:', competitorError)
      competitorAnalysis = null
    }

    // Step 4.7: Analyze content gaps
    console.log('[createBrandWithIndustryData] Analyzing content gaps...')
    let contentGaps
    try {
      const { ContentGapAnalyzer } = await import('@/services/intelligence/content-gap-analyzer')
      contentGaps = await ContentGapAnalyzer.analyzeGaps(
        {
          uvps: industryProfile.full_profile_data?.value_propositions || [],
          competitive_advantages: industryProfile.full_profile_data?.competitive_advantages || [],
          positioning_statement: industryProfile.full_profile_data?.positioning_statement || ''
        },
        competitorAnalysis,
        industryProfile
      )
      console.log('[createBrandWithIndustryData] Content gaps analyzed:', {
        totalGaps: contentGaps.all_gaps.length,
        quickWins: contentGaps.quick_wins.length,
        opportunityScore: contentGaps.total_opportunity_score
      })
    } catch (gapError) {
      console.warn('[createBrandWithIndustryData] Content gap analysis failed:', gapError)
      contentGaps = null
    }

    // Step 4.8: Fetch trending YouTube content for industry (optional)
    console.log('[createBrandWithIndustryData] Fetching YouTube trends...')
    let youtubeTrends
    try {
      const { YouTubeAPI } = await import('@/services/intelligence/youtube-api')
      const keywords = industryProfile.keywords?.slice(0, 3) || [industryProfile.title]
      youtubeTrends = await YouTubeAPI.analyzeVideoTrends(industryProfile.title, keywords)
      console.log('[createBrandWithIndustryData] YouTube trends fetched:', {
        topics: youtubeTrends.trending_topics.length,
        formats: youtubeTrends.popular_formats.length
      })
    } catch (youtubeError) {
      console.warn('[createBrandWithIndustryData] YouTube trends fetch failed (API key may be missing):', youtubeError)
      youtubeTrends = null
    }

    // Step 5: Generate MIRROR sections with customized data
    onProgress?.('generating-mirror')
    console.log('[createBrandWithIndustryData] Generating MIRROR sections...')

    const mirrorSections = await generateMirrorSectionsFromIndustry(
      domain,
      industryProfile,
      websiteData,
      customization,
      seoMetrics,
      competitorAnalysis,
      contentGaps,
      youtubeTrends
    )

    // Step 6: Store MIRROR sections
    onProgress?.('saving-data')
    const sectionPromises = Object.entries(mirrorSections).map(([section, sectionData]) =>
      supabase
        .from('mirror_sections')
        .insert({
          brand_id: brand.id,
          section: section,
          data: sectionData  // Store all data in the JSONB 'data' column
        })
    )

    await Promise.all(sectionPromises)

    console.log('[createBrandWithIndustryData] Complete!')
    onProgress?.('complete')

    return { brand, mirrorSections, websiteData }
  } catch (error) {
    console.error('Error in createBrandWithIndustryData:', error)
    return null
  }
}
