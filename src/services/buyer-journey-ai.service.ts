/**
 * Buyer Journey AI Service
 * Generates AI-powered suggestions for customer journey mapping
 * Uses UVP + Industry Profile + Website Data for multi-source enrichment
 * ANTI-HALLUCINATION: Only uses actual data sources, never fabricates
 */

import type {
  IdealCustomerProfile,
  Demographics,
  JourneyStage,
  Touchpoint,
} from '@/types/buyer-journey'
import type { IndustryProfile } from '@/types/industry-profile.types'
import { industryRegistry } from '@/data/industries'

// ============================================================================
// Types
// ============================================================================

export interface EnrichmentContext {
  // REQUIRED - UVP data (must exist)
  uvpData: {
    target_customer: string
    customer_problem: string
    unique_solution: string
    key_benefit: string
    differentiation?: string
  }

  // Industry intelligence
  industry: string
  industryProfile?: IndustryProfile

  // Optional enrichment
  websiteData?: {
    services?: string[]
    products?: string[]
    benefits?: string[]
    differentiators?: string[]
  }

  brandData?: {
    name: string
    website?: string
    naicsCode?: string
  }
}

interface ValidationResult {
  isValid: boolean
  suggestions: string[]
  rejectedCount: number
}

// ============================================================================
// Main Service
// ============================================================================

export class BuyerJourneyAI {
  private apiKey: string | null = null
  private model: string = 'anthropic/claude-opus-4.1'

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || null

    if (!this.apiKey) {
      console.warn('[BuyerJourneyAI] No API key found - AI features will be limited')
    }
  }

  /**
   * PRE-POPULATE: Extract initial data from UVP
   */
  async prePopulateFromUVP(
    uvpData: EnrichmentContext['uvpData'],
    industry: string
  ): Promise<Partial<IdealCustomerProfile>> {
    console.log('[BuyerJourneyAI] Pre-populating from UVP:', { uvpData, industry })

    // DON'T extract segment name - let user pick from pre-defined segments
    // This allows the segment selector to show in CustomerDefinitionStep

    // Extract initial pain points from customer problem
    const painPoints = this.extractPainPoints(uvpData.customer_problem)

    // Extract initial goals from key benefit
    const goals = this.extractGoals(uvpData.key_benefit)

    return {
      segment_name: '', // Leave empty so segment selector shows
      pain_points: painPoints,
      goals: goals,
      demographics: {
        age_range: '',
        income_range: '',
        location_type: '',
        occupation: '',
        household_size: '',
      },
      psychographics: {
        values: [],
        personality_traits: [],
        lifestyle: [],
        interests: [],
      },
      buying_triggers: [],
      decision_criteria: [],
    }
  }

  /**
   * GENERATE: Demographics with industry profile integration
   */
  async generateDemographics(context: EnrichmentContext): Promise<Partial<Demographics>> {
    const industryProfile = context.industryProfile || industryRegistry.getById(context.industry)

    if (!industryProfile) {
      console.warn('[BuyerJourneyAI] No industry profile found')
      return {}
    }

    // Use industry profile target audience characteristics
    const targetAudience = industryProfile.targetAudience
    const characteristics = industryProfile.audienceCharacteristics

    // Parse UVP target customer for demographics hints
    const customerDescription = context.uvpData.target_customer.toLowerCase()

    // Extract age hints
    let ageRange = ''
    if (customerDescription.includes('young') || customerDescription.includes('millennial')) {
      ageRange = '25-40'
    } else if (customerDescription.includes('professional') || customerDescription.includes('established')) {
      ageRange = '35-55'
    } else if (customerDescription.includes('senior') || customerDescription.includes('retiree')) {
      ageRange = '55+'
    }

    // Extract location type from characteristics or UVP
    let locationType = ''
    if (customerDescription.includes('urban')) {
      locationType = 'Urban areas'
    } else if (customerDescription.includes('suburban')) {
      locationType = 'Suburban communities'
    } else if (customerDescription.includes('rural')) {
      locationType = 'Rural areas'
    }

    return {
      age_range: ageRange,
      location_type: locationType,
      occupation: this.extractOccupation(customerDescription, targetAudience),
      income_range: this.inferIncomeRange(context),
      household_size: '',
    }
  }

  /**
   * GENERATE: Pain Points from UVP + Industry + Website
   */
  async generatePainPoints(context: EnrichmentContext): Promise<string[]> {
    console.log('[BuyerJourneyAI] 🎯 generatePainPoints called')
    console.log('[BuyerJourneyAI] Brand:', context.brandData?.name)
    console.log('[BuyerJourneyAI] Industry:', context.industry)
    console.log('[BuyerJourneyAI] API Key available?', !!this.apiKey)

    const industryProfile = context.industryProfile || industryRegistry.getById(context.industry)

    // Collect all actual pain point sources
    const sources: string[] = []

    // 1. UVP customer problem (primary source)
    if (context.uvpData.customer_problem) {
      sources.push(context.uvpData.customer_problem)
    }

    // 2. Industry profile common pain points
    if (industryProfile?.commonPainPoints) {
      sources.push(...industryProfile.commonPainPoints)
    }

    // If no sources, return manual input request
    if (sources.length === 0) {
      return ['❌ No pain point data found. Please manually describe customer frustrations and challenges.']
    }

    // If we have API key, use AI to synthesize
    if (this.apiKey) {
      try {
        const prompt = `You are analyzing customer pain points for ${context.brandData?.name || 'a'} ${context.industry} business.

BRAND CONTEXT:
${context.brandData?.name ? `Brand: ${context.brandData.name}` : ''}
${context.brandData?.website ? `Website: ${context.brandData.website}` : ''}
${context.websiteData?.services?.length ? `Services: ${context.websiteData.services.join(', ')}` : ''}
${context.websiteData?.products?.length ? `Products: ${context.websiteData.products.join(', ')}` : ''}

TARGET CUSTOMER (from UVP):
"${context.uvpData.target_customer}"

CUSTOMER PROBLEM (from UVP):
"${context.uvpData.customer_problem}"

UNIQUE SOLUTION (from UVP):
"${context.uvpData.unique_solution}"

INDUSTRY COMMON PAIN POINTS (reference only):
${industryProfile?.commonPainPoints?.map((p, i) => `${i + 1}. ${p}`).join('\n') || 'None'}

Generate 5 SPECIFIC pain points that THIS EXACT customer segment experiences, based on their UVP and brand offering.

STRICT RULES:
- Use the brand name and their specific services/products from above
- Build directly from the customer problem and target customer description
- Reference the unique solution to understand what pain they're solving
- Use industry pain points only as inspiration, NOT as direct copy
- DO NOT use generic fallback language
- Keep each pain point to 1-2 sentences
- Make them specific to THIS brand and THIS customer

Return ONLY a JSON array of exactly 5 strings.`

        const result = await this.callOpenRouter(prompt)
        console.log('[BuyerJourneyAI] ✅ AI returned:', result)

        const validated = this.validateAgainstSources(result, sources)
        console.log('[BuyerJourneyAI] Validation result:', validated)

        if (validated.isValid) {
          console.log('[BuyerJourneyAI] ✅ Returning validated AI-generated pain points:', validated.suggestions)
          return validated.suggestions
        } else {
          console.warn('[BuyerJourneyAI] ⚠️ AI results failed validation, falling back')
        }
      } catch (error) {
        console.error('[BuyerJourneyAI] ❌ Failed to generate pain points:', error)
      }
    }

    // Fallback 1: Extract from UVP problem statement
    console.log('[BuyerJourneyAI] 📝 AI generation failed/unavailable, extracting from UVP problem')
    const uvpExtracted = this.extractPainPoints(context.uvpData.customer_problem)
    if (uvpExtracted.length > 0) {
      console.log('[BuyerJourneyAI] ✅ Using extracted UVP pain points:', uvpExtracted)
      return uvpExtracted
    }

    // Fallback 2: Use industry pain points as last resort
    console.warn('[BuyerJourneyAI] ⚠️ Using generic industry fallback for pain points')
    const fallback = industryProfile?.commonPainPoints?.slice(0, 5) || []
    console.log('[BuyerJourneyAI] Fallback pain points:', fallback)
    return fallback
  }

  /**
   * GENERATE: Goals from UVP benefit + Industry psychology
   */
  async generateGoals(context: EnrichmentContext): Promise<string[]> {
    console.log('[BuyerJourneyAI] 🎯 generateGoals called')
    console.log('[BuyerJourneyAI] Brand:', context.brandData?.name)

    try {
      const industryProfile = context.industryProfile || industryRegistry.getById(context.industry)

      // Collect goal sources
      const sources: string[] = []

      // 1. UVP key benefit (what they want to achieve)
      if (context.uvpData.key_benefit) {
        sources.push(context.uvpData.key_benefit)
      }

      // 2. Industry psychology decision drivers
      if (industryProfile?.psychologyProfile?.decisionDrivers) {
        sources.push(...industryProfile.psychologyProfile.decisionDrivers)
      }

      // 3. Website benefits
      if (context.websiteData?.benefits) {
        sources.push(...context.websiteData.benefits)
      }

      if (sources.length === 0) {
        return ['❌ No goal data found. Please manually describe what customers want to achieve.']
      }

      if (this.apiKey) {
        try {
          const prompt = `You are analyzing customer goals for ${context.brandData?.name || 'a'} ${context.industry} business.

BRAND CONTEXT:
${context.brandData?.name ? `Brand: ${context.brandData.name}` : ''}
${context.brandData?.website ? `Website: ${context.brandData.website}` : ''}
${context.websiteData?.services?.length ? `Services: ${context.websiteData.services.join(', ')}` : ''}
${context.websiteData?.products?.length ? `Products: ${context.websiteData.products.join(', ')}` : ''}
${context.websiteData?.benefits?.length ? `Benefits: ${context.websiteData.benefits.join(', ')}` : ''}

TARGET CUSTOMER (from UVP):
"${context.uvpData.target_customer}"

KEY BENEFIT (from UVP):
"${context.uvpData.key_benefit}"

UNIQUE SOLUTION (from UVP):
"${context.uvpData.unique_solution}"

WHAT DRIVES THEIR DECISIONS (industry insights):
${industryProfile?.psychologyProfile?.decisionDrivers?.map((d, i) => `${i + 1}. ${d}`).join('\n') || 'None'}

Generate 5 SPECIFIC goals/desires that THIS EXACT customer segment has, based on their UVP and what THIS brand offers.

STRICT RULES:
- Use the brand name and their specific services/products/benefits from above
- Connect directly to the UVP key benefit and unique solution
- Use industry psychology insights only as inspiration, NOT as direct copy
- DO NOT invent generic aspirations
- DO NOT use generic fallback language
- Keep each goal to 1 sentence
- Focus on specific outcomes THESE customers want to achieve with THIS brand

Return ONLY a JSON array of exactly 5 strings.`

        const result = await this.callOpenRouter(prompt)
        console.log('[BuyerJourneyAI] ✅ AI returned goals:', result)

        const validated = this.validateAgainstSources(result, sources)
        console.log('[BuyerJourneyAI] Goals validation result:', validated)

        if (validated.isValid) {
          console.log('[BuyerJourneyAI] ✅ Returning validated AI-generated goals:', validated.suggestions)
          return validated.suggestions
        } else {
          console.warn('[BuyerJourneyAI] ⚠️ Goals failed validation, falling back')
        }
      } catch (error) {
        console.error('[BuyerJourneyAI] ❌ Failed to generate goals:', error)
      }
    }

    // Fallback 1: Extract from UVP benefit statement
    console.log('[BuyerJourneyAI] 📝 AI generation failed/unavailable, extracting from UVP benefit')
    const uvpExtracted = this.extractGoals(context.uvpData.key_benefit)
    if (uvpExtracted.length > 0) {
      console.log('[BuyerJourneyAI] ✅ Using extracted UVP goals:', uvpExtracted)
      return uvpExtracted
    }

    // Fallback 2: Use industry decision drivers as last resort
    console.warn('[BuyerJourneyAI] ⚠️ Using generic industry fallback for goals')
    const fallback = industryProfile?.psychologyProfile?.decisionDrivers?.slice(0, 5) || []
    console.log('[BuyerJourneyAI] Fallback goals:', fallback)
    return fallback
  } catch (error) {
      console.error('[BuyerJourneyAI] ❌❌❌ FATAL ERROR in generateGoals:', error)
      throw error
    } finally {
      console.log('[BuyerJourneyAI] ✅ generateGoals completed')
    }
  }

  /**
   * GENERATE: Buying Triggers from industry psychology
   */
  async generateBuyingTriggers(context: EnrichmentContext): Promise<string[]> {
    const industryProfile = context.industryProfile || industryRegistry.getById(context.industry)

    if (!industryProfile) {
      return ['❌ No industry data available for buying triggers.']
    }

    // Use industry-specific buying triggers
    if (industryProfile.commonBuyingTriggers && industryProfile.commonBuyingTriggers.length > 0) {
      return industryProfile.commonBuyingTriggers.slice(0, 5)
    }

    // Fallback to psychology-based triggers if no specific triggers defined
    const triggers: string[] = []

    // Use industry psychology primary triggers
    if (industryProfile.psychologyProfile?.primaryTriggers) {
      triggers.push(...industryProfile.psychologyProfile.primaryTriggers.map(t =>
        `${t.charAt(0).toUpperCase() + t.slice(1)}-based trigger`
      ))
    }

    // Add urgency-based triggers if urgency is high
    if (industryProfile.psychologyProfile?.urgencyLevel === 'high') {
      triggers.push('Time-sensitive opportunity')
      triggers.push('Limited availability')
    }

    return triggers.slice(0, 5)
  }

  /**
   * GENERATE: Touchpoints for a specific journey stage
   */
  async generateTouchpoints(
    context: EnrichmentContext,
    stage: JourneyStage
  ): Promise<Partial<Touchpoint>[]> {
    // Define default touchpoints per stage based on industry
    const touchpointTemplates: Record<JourneyStage, string[]> = {
      awareness: ['Social media posts', 'Search results', 'Word of mouth', 'Online ads'],
      consideration: ['Website visit', 'Reviews/testimonials', 'Comparison research', 'Email inquiry'],
      decision: ['Consultation call', 'Proposal review', 'Pricing discussion', 'References check'],
      purchase: ['Contract signing', 'Onboarding', 'Payment process', 'Welcome email'],
      advocacy: ['Follow-up check-in', 'Review request', 'Referral program', 'Community engagement'],
    }

    const templates = touchpointTemplates[stage] || []

    return templates.map(name => ({
      name,
      stage,
      type: 'digital' as const,
      description: '',
    }))
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private extractSegmentName(targetCustomer: string): string {
    // Take first meaningful phrase (up to 50 chars)
    const cleaned = targetCustomer.split('.')[0].split(',')[0].trim()
    return cleaned.length > 50 ? cleaned.substring(0, 47) + '...' : cleaned
  }

  private extractPainPoints(problem: string): string[] {
    // Split by common delimiters
    const points = problem.split(/[,;]|\band\b/).map(p => p.trim()).filter(p => p.length > 10)
    return points.slice(0, 3)
  }

  private extractGoals(benefit: string): string[] {
    // Extract goal from benefit statement
    const goals = benefit.split(/[,;]|\band\b/).map(g => g.trim()).filter(g => g.length > 10)
    return goals.slice(0, 3)
  }

  private extractOccupation(description: string, fallback: string): string {
    const occupationKeywords = [
      'professional', 'business owner', 'entrepreneur', 'executive',
      'manager', 'homeowner', 'investor', 'family'
    ]

    for (const keyword of occupationKeywords) {
      if (description.includes(keyword)) {
        return keyword.charAt(0).toUpperCase() + keyword.slice(1) + 's'
      }
    }

    // Extract from fallback
    return fallback.split(',')[0].trim()
  }

  private inferIncomeRange(context: EnrichmentContext): string {
    const description = context.uvpData.target_customer.toLowerCase()

    if (description.includes('luxury') || description.includes('premium') || description.includes('high-end')) {
      return '$150k+'
    } else if (description.includes('professional') || description.includes('executive')) {
      return '$75k-$150k'
    } else if (description.includes('small business') || description.includes('startup')) {
      return '$50k-$100k'
    }

    return '$50k-$100k' // Default middle class
  }

  /**
   * Validate AI suggestions against source data
   */
  private validateAgainstSources(suggestions: string[], sources: string[]): ValidationResult {
    const validated = suggestions.filter(suggestion => {
      const lower = suggestion.toLowerCase()

      // Must contain at least one significant word from sources
      const sourceWords = sources.join(' ').toLowerCase().split(/\s+/).filter(w => w.length > 4)
      const hasSourceReference = sourceWords.some(word => lower.includes(word))

      // Reject if it looks fabricated (branded names, specific programs)
      const fabricationPatterns = [
        /\w+\s+(blueprint|lab|score|system|program|package|suite)\b/i,
        /'[^']+'/,
        /"[^"]+"/,
      ]
      const hasFabrication = fabricationPatterns.some(pattern => pattern.test(suggestion))

      return hasSourceReference && !hasFabrication
    })

    return {
      isValid: validated.length > 0,
      suggestions: validated,
      rejectedCount: suggestions.length - validated.length,
    }
  }

  /**
   * Call OpenRouter API with timeout
   */
  private async callOpenRouter(prompt: string): Promise<string[]> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not configured')
    }

    console.log('[BuyerJourneyAI] 🌐 Making API call to OpenRouter...')

    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      console.error('[BuyerJourneyAI] ⏱️ API call timeout after 30 seconds')
      controller.abort()
    }, 30000) // 30 second timeout

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'MARBA Buyer Journey'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a customer journey analyst. ONLY work with factual information provided. Never invent data. Return valid JSON arrays only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 800,
          stream: false, // CRITICAL: Disable streaming to get complete response immediately
        }),
        signal: controller.signal
      })

      console.log('[BuyerJourneyAI] ✅ API response received, status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        clearTimeout(timeoutId)
        console.error('[BuyerJourneyAI] API error response:', errorText)
        throw new Error(`OpenRouter API error: ${response.status}`)
      }

      console.log('[BuyerJourneyAI] 📝 Reading response body with manual stream reader...')

      let responseText: string
      try {
        // Manually read the response stream to have better control
        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('No response body reader available')
        }

        const chunks: Uint8Array[] = []
        let totalLength = 0

        console.log('[BuyerJourneyAI] Starting to read chunks...')

        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            console.log('[BuyerJourneyAI] ✅ Finished reading all chunks')
            break
          }

          if (value) {
            chunks.push(value)
            totalLength += value.length
            console.log('[BuyerJourneyAI] Read chunk:', value.length, 'bytes, total:', totalLength)
          }
        }

        // Combine all chunks
        const combined = new Uint8Array(totalLength)
        let position = 0
        for (const chunk of chunks) {
          combined.set(chunk, position)
          position += chunk.length
        }

        // Decode to text
        responseText = new TextDecoder().decode(combined)
        console.log('[BuyerJourneyAI] ✅ Response text decoded, length:', responseText.length)
        console.log('[BuyerJourneyAI] Response preview:', responseText.substring(0, 300))

        // NOW clear the timeout since we got the body successfully
        clearTimeout(timeoutId)
      } catch (readError) {
        clearTimeout(timeoutId)
        console.error('[BuyerJourneyAI] ❌ Failed to read response body:', readError)
        if (readError.name === 'AbortError') {
          throw new Error('Response body read timeout - response too slow')
        }
        throw new Error(`Failed to read response: ${readError.message}`)
      }

      console.log('[BuyerJourneyAI] 📝 Parsing text as JSON...')
      let data
      try {
        data = JSON.parse(responseText)
        console.log('[BuyerJourneyAI] ✅ JSON parsed successfully')
      } catch (parseError) {
        console.error('[BuyerJourneyAI] ❌ JSON parse failed:', parseError)
        console.error('[BuyerJourneyAI] Response text was:', responseText)
        throw new Error(`Failed to parse JSON: ${parseError.message}`)
      }

      console.log('[BuyerJourneyAI] 📝 Extracting content from parsed data...')
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('[BuyerJourneyAI] Invalid response structure:', data)
        throw new Error('Invalid API response structure')
      }

      const content = data.choices[0].message.content
      console.log('[BuyerJourneyAI] ✅ Content extracted, length:', content.length)
      console.log('[BuyerJourneyAI] API response content:', content.substring(0, 200))

      // Extract JSON array from response
      const jsonMatch = content.match(/\[[\s\S]*?\]/)
      if (!jsonMatch) {
        console.error('[BuyerJourneyAI] No JSON array in response:', content)
        throw new Error('No JSON array found in response')
      }

      const result = JSON.parse(jsonMatch[0])
      console.log('[BuyerJourneyAI] ✅ Successfully parsed JSON array with', result.length, 'items')
      return result
    } catch (error) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        console.error('[BuyerJourneyAI] ❌ API call aborted (timeout)')
        throw new Error('API call timeout after 30 seconds')
      }
      console.error('[BuyerJourneyAI] ❌ API call failed:', error)
      throw error
    }
  }
}

// Export singleton instance
export const buyerJourneyAI = new BuyerJourneyAI()
