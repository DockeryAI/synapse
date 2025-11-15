/**
 * Customer Discovery Journey (JTBD) Analysis Service
 * Maps customer journey from current state to desired UVP-aligned state
 * Uses Jobs-to-be-Done framework
 */

interface JourneyStage {
  stage: string
  customerMindset: string
  searchBehavior: string
  touchpoints: string[]
  painPoints: string[]
}

interface CustomerJourneyAnalysis {
  currentJourney: {
    stages: JourneyStage[]
    topKeywords: Array<{ keyword: string; intent: string; volume: number }>
    discoveryChannels: Array<{ channel: string; percentage: number }>
    gaps: string[]
  }
  desiredJourney: {
    jobToBeDone: string
    stages: JourneyStage[]
    idealKeywords: Array<{ keyword: string; intent: string; rationale: string }>
    idealChannels: Array<{ channel: string; priority: string; rationale: string }>
  }
  transformationPlan: {
    contentGaps: Array<{
      gap: string
      stage: string
      priority: 'high' | 'medium' | 'low'
      recommendation: string
    }>
    keywordOpportunities: Array<{
      keyword: string
      currentRank: number | null
      targetRank: number
      difficulty: string
      impact: string
    }>
    messagingShifts: Array<{
      from: string
      to: string
      rationale: string
      priority: 'high' | 'medium' | 'low'
    }>
    timeline: Array<{
      phase: string
      duration: string
      actions: string[]
      expectedOutcome: string
    }>
  }
}

export class JTBDAnalysisService {
  /**
   * Analyze customer discovery journey with UVP context
   */
  static async analyzeCustomerJourney(
    brandId: string,
    websiteUrl: string,
    uvp: any,
    industry: string
  ): Promise<CustomerJourneyAnalysis> {
    console.log('[JTBDAnalysisService] Starting customer journey analysis:', {
      brandId,
      websiteUrl,
      industry,
      hasUVP: !!uvp
    })

    try {
      // Step 1: Analyze current discovery patterns
      console.log('[JTBDAnalysisService] Step 1/3: Analyzing current discovery patterns...')
      const currentState = await this.analyzeCurrentState(websiteUrl, industry)

      // Step 2: Map desired state based on UVP
      console.log('[JTBDAnalysisService] Step 2/3: Mapping desired state from UVP...')
      const desiredState = await this.mapDesiredState(uvp, industry)

      // Step 3: Generate transformation plan with Claude
      console.log('[JTBDAnalysisService] Step 3/3: Generating transformation plan...')
      const transformationPlan = await this.generateTransformationPlan(
        currentState,
        desiredState,
        uvp,
        industry
      )

      return {
        currentJourney: currentState,
        desiredJourney: desiredState,
        transformationPlan
      }
    } catch (error) {
      console.error('[JTBDAnalysisService] Analysis failed:', error)
      return this.getFallbackAnalysis(industry)
    }
  }

  /**
   * Analyze current customer discovery patterns
   */
  private static async analyzeCurrentState(
    websiteUrl: string,
    industry: string
  ): Promise<any> {
    try {
      // Try to get actual keyword data
      const { SemrushAPI } = await import('../intelligence/semrush-api')
      const seoData = await SemrushAPI.getComprehensiveSEOMetrics(websiteUrl, websiteUrl)

      const topKeywords = seoData?.rankings?.slice(0, 10).map((rank: any) => ({
        keyword: rank.keyword,
        intent: this.inferSearchIntent(rank.keyword),
        volume: rank.searchVolume || 0
      })) || []

      return {
        stages: this.inferCurrentStages(topKeywords, industry),
        topKeywords,
        discoveryChannels: [
          { channel: 'Organic Search', percentage: 45 },
          { channel: 'Direct', percentage: 25 },
          { channel: 'Social', percentage: 15 },
          { channel: 'Referral', percentage: 15 }
        ],
        gaps: []
      }
    } catch (error) {
      console.error('[JTBDAnalysisService] Current state analysis failed:', error)
      return this.getMockCurrentState(industry)
    }
  }

  /**
   * Map desired customer journey based on UVP
   */
  private static async mapDesiredState(uvp: any, industry: string): Promise<any> {
    const { generateOpusResponse } = await import('../uvp-wizard/openrouter-ai')

    const prompt = `Analyze this Value Proposition and map the ideal customer discovery journey using the Jobs-to-be-Done framework.

VALUE PROPOSITION:
- Target Customer: ${uvp.targetCustomer || 'Not specified'}
- Problem Solved: ${uvp.problemSolved || 'Not specified'}
- Unique Solution: ${uvp.uniqueSolution || 'Not specified'}
- Key Benefit: ${uvp.keyBenefit || 'Not specified'}
- Differentiation: ${uvp.differentiation || 'Not specified'}

INDUSTRY: ${industry}

ANALYSIS REQUIREMENTS:

1. JOB-TO-BE-DONE:
   - What is the customer really hiring this product/service to do?
   - Express as: "When [situation], I want to [motivation], so I can [expected outcome]"

2. IDEAL JOURNEY STAGES (4-6 stages):
   For each stage:
   - Stage name (e.g., "Problem Recognition", "Solution Search")
   - Customer mindset at this stage
   - How they search/discover (keywords, behaviors)
   - Ideal touchpoints
   - Common pain points

3. IDEAL KEYWORDS:
   - 5-10 keywords that align with JTBD
   - Search intent for each
   - Why these keywords matter for this UVP

4. IDEAL DISCOVERY CHANNELS:
   - Top 3-5 channels
   - Priority level (high/medium/low)
   - Rationale for each

Return as JSON:
{
  "jobToBeDone": "When [situation], I want to [motivation], so I can [outcome]",
  "stages": [
    {
      "stage": "Problem Recognition",
      "customerMindset": "...",
      "searchBehavior": "...",
      "touchpoints": ["...", "..."],
      "painPoints": ["...", "..."]
    }
  ],
  "idealKeywords": [
    {
      "keyword": "...",
      "intent": "informational/commercial/transactional",
      "rationale": "..."
    }
  ],
  "idealChannels": [
    {
      "channel": "Content Marketing",
      "priority": "high",
      "rationale": "..."
    }
  ]
}`

    try {
      const response = await generateOpusResponse([
        { role: 'user', content: prompt }
      ])

      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON in response')

      return JSON.parse(jsonMatch[0])
    } catch (error) {
      console.error('[JTBDAnalysisService] Desired state mapping failed:', error)
      return this.getMockDesiredState(industry)
    }
  }

  /**
   * Generate transformation plan from current to desired state
   */
  private static async generateTransformationPlan(
    currentState: any,
    desiredState: any,
    uvp: any,
    industry: string
  ): Promise<any> {
    const { generateOpusResponse } = await import('../uvp-wizard/openrouter-ai')

    const prompt = `Create a transformation plan to move from current customer discovery patterns to the ideal UVP-aligned journey.

CURRENT STATE:
${JSON.stringify(currentState, null, 2)}

DESIRED STATE:
${JSON.stringify(desiredState, null, 2)}

VALUE PROPOSITION:
${JSON.stringify(uvp, null, 2)}

TRANSFORMATION PLAN REQUIREMENTS:

1. CONTENT GAPS (5-8 gaps):
   - What content is missing?
   - Which journey stage does it serve?
   - Priority (high/medium/low)
   - Specific recommendation

2. KEYWORD OPPORTUNITIES (5-8 keywords):
   - Target keywords to own
   - Current rank (if ranking)
   - Target rank
   - Difficulty assessment
   - Expected impact

3. MESSAGING SHIFTS (3-5 shifts):
   - From: current messaging
   - To: UVP-aligned messaging
   - Rationale for change
   - Priority

4. IMPLEMENTATION TIMELINE (3-4 phases):
   - Phase name (e.g., "Quick Wins", "Foundation", "Scale")
   - Duration estimate
   - Key actions for phase
   - Expected outcome

Return as JSON:
{
  "contentGaps": [
    {
      "gap": "Missing problem-focused blog content",
      "stage": "Problem Recognition",
      "priority": "high",
      "recommendation": "Create 5-8 blog posts addressing [specific problems]"
    }
  ],
  "keywordOpportunities": [
    {
      "keyword": "...",
      "currentRank": 35,
      "targetRank": 10,
      "difficulty": "medium",
      "impact": "Could drive 500+ monthly visits"
    }
  ],
  "messagingShifts": [
    {
      "from": "We are the best [category]",
      "to": "We help [customer] achieve [outcome]",
      "rationale": "Shifts focus from features to customer outcomes",
      "priority": "high"
    }
  ],
  "timeline": [
    {
      "phase": "Quick Wins (Weeks 1-4)",
      "duration": "4 weeks",
      "actions": ["Update homepage messaging", "Create 3 key content pieces"],
      "expectedOutcome": "Immediate messaging alignment, foundation for content"
    }
  ]
}`

    try {
      const response = await generateOpusResponse([
        { role: 'user', content: prompt }
      ])

      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON in response')

      return JSON.parse(jsonMatch[0])
    } catch (error) {
      console.error('[JTBDAnalysisService] Transformation plan failed:', error)
      return this.getMockTransformationPlan()
    }
  }

  /**
   * Infer search intent from keyword
   */
  private static inferSearchIntent(keyword: string): string {
    const lowerKeyword = keyword.toLowerCase()

    if (lowerKeyword.includes('how to') || lowerKeyword.includes('what is') || lowerKeyword.includes('guide')) {
      return 'informational'
    }
    if (lowerKeyword.includes('best') || lowerKeyword.includes('review') || lowerKeyword.includes('compare')) {
      return 'commercial'
    }
    if (lowerKeyword.includes('buy') || lowerKeyword.includes('price') || lowerKeyword.includes('near me')) {
      return 'transactional'
    }

    return 'navigational'
  }

  /**
   * Infer current journey stages from keywords
   */
  private static inferCurrentStages(keywords: any[], industry: string): JourneyStage[] {
    const intentGroups = keywords.reduce((acc: any, kw) => {
      acc[kw.intent] = acc[kw.intent] || []
      acc[kw.intent].push(kw.keyword)
      return acc
    }, {})

    const stages: JourneyStage[] = []

    if (intentGroups.informational) {
      stages.push({
        stage: 'Problem Recognition',
        customerMindset: 'Seeking information about their problem',
        searchBehavior: `Searching: ${intentGroups.informational.slice(0, 3).join(', ')}`,
        touchpoints: ['Search engines', 'Blog content'],
        painPoints: ['Information overload', 'Generic advice']
      })
    }

    if (intentGroups.commercial) {
      stages.push({
        stage: 'Solution Evaluation',
        customerMindset: 'Comparing options and providers',
        searchBehavior: `Searching: ${intentGroups.commercial.slice(0, 3).join(', ')}`,
        touchpoints: ['Comparison sites', 'Reviews'],
        painPoints: ['Hard to differentiate options', 'Unclear value']
      })
    }

    if (intentGroups.transactional) {
      stages.push({
        stage: 'Purchase Decision',
        customerMindset: 'Ready to engage or buy',
        searchBehavior: `Searching: ${intentGroups.transactional.slice(0, 3).join(', ')}`,
        touchpoints: ['Website', 'Contact forms'],
        painPoints: ['Friction in conversion', 'Unclear pricing']
      })
    }

    return stages
  }

  /**
   * Fallback analysis when API calls fail
   */
  private static getFallbackAnalysis(industry: string): CustomerJourneyAnalysis {
    return {
      currentJourney: this.getMockCurrentState(industry),
      desiredJourney: this.getMockDesiredState(industry),
      transformationPlan: this.getMockTransformationPlan()
    }
  }

  private static getMockCurrentState(industry: string): any {
    return {
      stages: [
        {
          stage: 'Problem Recognition',
          customerMindset: 'Aware of pain point, seeking information',
          searchBehavior: `Generic ${industry.toLowerCase()} searches`,
          touchpoints: ['Search engines', 'Industry blogs'],
          painPoints: ['Too much generic information', 'Hard to find specific solutions']
        },
        {
          stage: 'Solution Search',
          customerMindset: 'Comparing different approaches',
          searchBehavior: '"Best" and "review" searches',
          touchpoints: ['Comparison sites', 'Review platforms'],
          painPoints: ['Difficult to differentiate providers', 'Unclear value propositions']
        }
      ],
      topKeywords: [
        { keyword: `${industry.toLowerCase()} services`, intent: 'commercial', volume: 1000 },
        { keyword: `best ${industry.toLowerCase()}`, intent: 'commercial', volume: 500 }
      ],
      discoveryChannels: [
        { channel: 'Organic Search', percentage: 45 },
        { channel: 'Direct', percentage: 30 },
        { channel: 'Referral', percentage: 25 }
      ],
      gaps: ['Limited problem-focused content', 'Generic positioning']
    }
  }

  private static getMockDesiredState(industry: string): any {
    return {
      jobToBeDone: 'When facing [specific problem], I want to find a solution that [key benefit], so I can [desired outcome]',
      stages: [
        {
          stage: 'Problem Recognition',
          customerMindset: 'Customer realizes they have a specific problem',
          searchBehavior: 'Problem-focused searches',
          touchpoints: ['Educational content', 'Problem-solution blog posts'],
          painPoints: ['Need quick answers', 'Want expert guidance']
        },
        {
          stage: 'Solution Discovery',
          customerMindset: 'Looking for the right approach',
          searchBehavior: 'Solution comparison searches',
          touchpoints: ['Case studies', 'Solution guides'],
          painPoints: ['Too many options', 'Need proof it works']
        },
        {
          stage: 'Provider Selection',
          customerMindset: 'Ready to choose a provider',
          searchBehavior: 'Provider-specific searches',
          touchpoints: ['Website', 'Testimonials', 'Demos'],
          painPoints: ['Need confidence in choice', 'Want easy onboarding']
        }
      ],
      idealKeywords: [
        { keyword: '[problem] solution', intent: 'commercial', rationale: 'Captures high-intent problem-aware customers' }
      ],
      idealChannels: [
        { channel: 'Content Marketing', priority: 'high', rationale: 'Addresses customers at problem recognition stage' }
      ]
    }
  }

  private static getMockTransformationPlan(): any {
    return {
      contentGaps: [
        {
          gap: 'Missing problem-focused educational content',
          stage: 'Problem Recognition',
          priority: 'high',
          recommendation: 'Create 5-8 blog posts addressing specific customer pain points'
        }
      ],
      keywordOpportunities: [
        {
          keyword: '[problem] solution',
          currentRank: null,
          targetRank: 10,
          difficulty: 'medium',
          impact: 'Could capture 300+ high-intent monthly visitors'
        }
      ],
      messagingShifts: [
        {
          from: 'Feature-focused messaging',
          to: 'Customer outcome-focused messaging',
          rationale: 'Aligns with customer JTBD and desired outcomes',
          priority: 'high'
        }
      ],
      timeline: [
        {
          phase: 'Quick Wins (Weeks 1-4)',
          duration: '4 weeks',
          actions: [
            'Update homepage messaging to focus on customer outcomes',
            'Create 3 problem-focused blog posts',
            'Optimize top pages for ideal keywords'
          ],
          expectedOutcome: 'Immediate messaging alignment, SEO foundation in place'
        },
        {
          phase: 'Foundation (Weeks 5-12)',
          duration: '8 weeks',
          actions: [
            'Complete content library (10-15 pieces)',
            'Build out case studies',
            'Optimize conversion paths'
          ],
          expectedOutcome: 'Comprehensive content covering full journey'
        },
        {
          phase: 'Scale (Weeks 13-26)',
          duration: '14 weeks',
          actions: [
            'Scale content production',
            'Launch targeted campaigns',
            'Build authority with thought leadership'
          ],
          expectedOutcome: 'Strong market presence, consistent lead flow'
        }
      ]
    }
  }
}
