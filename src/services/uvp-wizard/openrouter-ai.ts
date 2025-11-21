/**
 * OpenRouter AI Service for UVP Wizard
 *
 * Uses premium LLMs via OpenRouter for highest quality industry-specific suggestions
 */

import { DraggableSuggestion, SuggestionType } from '@/types/uvp-wizard'
import { getIndustryEQ, adjustSuggestionPrompt } from './emotional-quotient'

interface IndustryContext {
  industry?: string
  brandName?: string
  website?: string
  websiteData?: any
  services?: string[]
  products?: string[]
  competitors?: string[]
  naicsCode?: string
}

// Best models for marketing/UVP content generation
const MODELS = {
  CLAUDE_OPUS_41: 'anthropic/claude-opus-4.1', // Claude Opus 4.1 - HIGHEST QUALITY
  CLAUDE_35_SONNET: 'anthropic/claude-opus-4.1-20240620', // Claude 3.5 Sonnet
  CLAUDE_SONNET: 'anthropic/claude-opus-4.1', // Claude 3.5 Sonnet
  GPT4_TURBO: 'openai/gpt-4-turbo', // Excellent structured reasoning
  // DEPRECATED - DO NOT USE
  // CLAUDE_OPUS: 'anthropic/claude-3-opus-20240229', // OLD VERSION - USE OPUS 4.1 INSTEAD
  MISTRAL_LARGE: 'mistralai/mistral-large', // Good cost/performance ratio
}

class OpenRouterAI {
  private apiKey: string
  private endpoint: string
  private model = MODELS.CLAUDE_OPUS_41 // Using Claude Opus 4.1 - HIGHEST QUALITY

  constructor() {
    this.apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
    this.endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`
    console.log('[OpenRouterAI] Initialized with Claude Opus 4.1 - HIGHEST QUALITY via ai-proxy:', {
      hasApiKey: !!this.apiKey,
      model: this.model,
      endpoint: this.endpoint
    })
  }

  /**
   * Generate industry-specific customer segments
   */
  async generateCustomerSegments(context: IndustryContext): Promise<DraggableSuggestion[]> {
    const industry = context.industry || 'Real Estate'
    console.log('[OpenRouterAI] generateCustomerSegments called with:', context)

    try {
      if (this.apiKey) {
        console.log('[OpenRouterAI] Making API call to Claude Opus 4.1...')
        const prompt = `You are a marketing strategist for the ${industry} industry.

${context.websiteData ? `Based on their website data: ${JSON.stringify(context.websiteData.services || [])}` : ''}

Generate 5 BROAD, MARKETABLE customer categories. Each should:
- Be a GENERAL category you can actually market to (e.g., "luxury buyers", "first-time customers", "repeat clients")
- Have enough market size to be worth targeting
- NOT be overly specific (avoid narrow demographics like "divorced women aged 45-60")
- Focus on buying behavior and general life situations
- Be 1 sentence describing a broad market segment

Format your response as a JSON array of exactly 5 strings. Keep them BROAD and MARKETABLE.`

        const suggestions = await this.callOpenRouter(prompt)
        console.log('[OpenRouterAI] API Response - suggestions:', suggestions)
        const formatted = this.formatSuggestions(suggestions, 'customer-segment')
        console.log('[OpenRouterAI] Formatted suggestions:', formatted)
        return formatted
      } else {
        console.log('[OpenRouterAI] No API key found, using fallback')
      }
    } catch (error) {
      console.error('[OpenRouterAI] API call failed:', error)
    }

    // Fallback to industry-specific templates
    console.log('[OpenRouterAI] Using fallback suggestions for:', industry)
    const fallback = this.getIndustryCustomerSegments(industry)
    console.log('[OpenRouterAI] Fallback suggestions:', fallback)
    return fallback
  }

  /**
   * Generate industry-specific problems (JTBD-centric)
   */
  async generateCustomerProblems(
    context: IndustryContext,
    targetCustomer: string
  ): Promise<DraggableSuggestion[]> {
    const industry = context.industry || 'Real Estate'
    const eq = await getIndustryEQ(industry, context.naicsCode)

    try {
      if (this.apiKey) {
        console.log('[OpenRouterAI] Generating problems with Brandock-calibrated EQ:', eq.emotional_weight, 'for', industry)

        let prompt = `You are a world-class Jobs-to-be-Done (JTBD) researcher specializing in the ${industry} industry.

Industry context: ${eq.purchase_mindset}
Emotional weight: ${eq.emotional_weight}% (${eq.emotional_weight > 70 ? 'Highly emotional' : eq.emotional_weight > 40 ? 'Mixed rational/emotional' : 'Primarily rational'})
Business location: ${context.brandName ? 'This is a local business - avoid geographic-specific scenarios (no mountains, oceans, etc)' : ''}

For this specific customer segment: "${targetCustomer}"

Generate 5 deep, JTBD-focused problems. Each should:`

        // Adjust based on emotional quotient
        if (eq.emotional_weight > 70) {
          // High emotional industries (Fashion, Bars, Restaurants, etc) - balance pain and pleasure
          prompt += `
- Mix BOTH pain points AND pleasure/aspiration motivations
- Include 2-3 pleasure-based motivations: what they WANT to feel, experience, or become
- Include 2-3 pain-based frustrations: what's holding them back from their ideal state
- For pleasure: Use "wanting", "yearning", "craving", "desiring" language
- For pain: Use "struggling", "frustrated by", "held back by" language
- Focus on emotional end-states: confidence, joy, connection, freedom, excitement
- Examples for ${industry}:
  * Pleasure: "Wanting to feel amazing and confident in every outfit"
  * Pain: "Feeling stuck in a style rut with nothing exciting to wear"
- Avoid specific scenarios - keep it conceptual and universally applicable
- NO geographic specifics, numbers, or situational details`
        } else if (eq.emotional_weight > 40) {
          prompt += `
- Balance emotional frustration with practical challenges
- Include BOTH problems to solve AND aspirations to achieve
- Show both personal impact and operational difficulties (without specific numbers)
- Reveal the underlying job they're trying to get done
- Mix negative (problems) with positive (desires) framing
- Connect to their goals and aspirations
- AVOID specific metrics - use concepts like "significant time lost", "unnecessary costs", "missed opportunities"`
        } else {
          prompt += `
- Focus on operational challenges and inefficiencies
- Include some aspiration for better outcomes
- Describe the TYPE of impact (time constraints, resource waste, process bottlenecks)
- Show clear cause-and-effect relationships
- Use precise language about problems without invented metrics
- AVOID made-up numbers - use qualitative descriptors like "excessive", "insufficient", "delayed"`
        }

        prompt += `

Remember: In ${industry}, customers are ${eq.purchase_mindset.toLowerCase()}

Format your response as a JSON array of exactly 5 strings. Each should be 1-2 powerful sentences.`

        const adjustedPrompt = await adjustSuggestionPrompt(prompt, industry, 'customer-problem')
        const suggestions = await this.callOpenRouter(adjustedPrompt)
        return this.formatSuggestions(suggestions, 'problem')
      }
    } catch (error) {
      console.warn('[OpenRouterAI] API failed, using fallback:', error)
    }

    return this.getIndustryProblems(industry)
  }

  /**
   * Generate industry-specific solutions
   * STRICT: ONLY uses actual website data - NO HALLUCINATION
   */
  async generateSolutions(
    context: IndustryContext,
    problem: string
  ): Promise<DraggableSuggestion[]> {
    const industry = context.industry || 'Real Estate'

    // Extract ACTUAL services/solutions from website
    const websiteServices: string[] = []
    const websiteProducts: string[] = []
    const websiteBenefits: string[] = []

    if (context.websiteData) {
      if (context.websiteData.services?.length) {
        websiteServices.push(...context.websiteData.services)
      }
      if (context.websiteData.products?.length) {
        websiteProducts.push(...context.websiteData.products)
      }
      if (context.websiteData.benefits?.length) {
        websiteBenefits.push(...context.websiteData.benefits)
      }
    }

    const hasActualData = websiteServices.length > 0 || websiteProducts.length > 0 || websiteBenefits.length > 0

    // NO DATA = MANUAL INPUT REQUIRED
    if (!hasActualData) {
      console.warn('[OpenRouterAI] ⚠️ NO services/products found on website - requesting manual input')
      return [{
        id: 'manual-input-required',
        content: '❌ Could not find services or solutions on your website. Please manually describe HOW you solve this problem for customers.',
        type: 'solution',
        source: 'manual-input-required',
        confidence: 0,
        is_selected: false,
        is_customizable: true
      }]
    }

    try {
      if (this.apiKey) {
        const allOfferings = [...websiteServices, ...websiteProducts, ...websiteBenefits]

        const prompt = `You are analyzing a ${industry} business website.

CUSTOMER PROBLEM:
"${problem}"

ACTUAL SERVICES/PRODUCTS FROM THEIR WEBSITE:
${allOfferings.map((item, i) => `${i + 1}. ${item}`).join('\n')}

Generate 5 solutions that explain HOW their existing offerings solve this problem.

STRICT RULES:
- ONLY reference the services/products listed above
- DO NOT invent new services, programs, packages, or methodologies
- DO NOT create branded names like "Blueprint", "Lab", "Score", "System", etc.
- Simply explain how their EXISTING offerings address the problem
- Be direct and factual - no marketing fluff

Example: If they offer "property search assistance" → "Help you search for and evaluate properties that match your needs"
NOT: "Launch a 'Property Perfect Match System' with AI-powered recommendations"

Return a JSON array of exactly 5 strings that describe how their actual offerings solve the problem.`

        const suggestions = await this.callOpenRouter(prompt)
        console.log('[OpenRouterAI] Generated solutions:', suggestions)

        // STRICT VALIDATION - Reject hallucinations
        const validated = suggestions.filter(suggestion => {
          const lower = suggestion.toLowerCase()

          // Check for fabricated program/system names
          const fabricatedPatterns = [
            /\w+\s+(blueprint|lab|score|system|program|package|suite|platform|framework|methodology|strategy|plan|process)\b/i,
            /'[^']+'/,  // Quoted branded names
            /"[^"]+"/,  // Double-quoted branded names
          ]

          const hasFabrication = fabricatedPatterns.some(pattern => {
            const match = suggestion.match(pattern)
            if (match) {
              // Check if this fabricated name exists in website data
              const fabricatedTerm = match[0].toLowerCase()
              const existsInWebsite = allOfferings.some(offering =>
                offering.toLowerCase().includes(fabricatedTerm)
              )
              return !existsInWebsite
            }
            return false
          })

          if (hasFabrication) {
            console.warn('[OpenRouterAI] ❌ REJECTED (fabricated):', suggestion)
            return false
          }

          // Must reference at least one actual offering
          const referencesActual = allOfferings.some(offering => {
            const offeringWords = offering.toLowerCase().split(/\s+/).filter(w => w.length > 3)
            return offeringWords.some(word => lower.includes(word))
          })

          if (!referencesActual) {
            console.warn('[OpenRouterAI] ❌ REJECTED (no reference to actual offerings):', suggestion)
            return false
          }

          console.log('[OpenRouterAI] ✅ ACCEPTED:', suggestion)
          return true
        })

        if (validated.length === 0) {
          console.warn('[OpenRouterAI] ⚠️ ALL suggestions were fabricated - requesting manual input')
          return [{
            id: 'manual-input-required',
            content: '❌ AI could not generate valid solutions from your website data. Please manually describe how you solve this problem.',
            type: 'solution',
            source: 'manual-input-required',
            confidence: 0,
            is_selected: false,
            is_customizable: true
          }]
        }

        return this.formatSuggestions(validated, 'solution')
      }
    } catch (error) {
      console.warn('[OpenRouterAI] API failed:', error)
    }

    // API FAILED = MANUAL INPUT REQUIRED (NO FALLBACK TEMPLATES)
    return [{
      id: 'manual-input-required',
      content: '❌ Unable to generate solutions. Please manually describe how you solve this problem.',
      type: 'solution',
      source: 'manual-input-required',
      confidence: 0,
      is_selected: false,
      is_customizable: true
    }]
  }

  /**
   * Generate industry-specific benefits
   */
  async generateKeyBenefits(
    context: IndustryContext,
    solution: string
  ): Promise<DraggableSuggestion[]> {
    const industry = context.industry || 'Real Estate'
    const eq = await getIndustryEQ(industry)

    try {
      if (this.apiKey) {
        let prompt = `You are a marketing strategist helping ${context.brandName || 'a business'} in the ${industry} industry.

Industry emotional profile: ${eq.emotional_weight}% emotional (${eq.jtbd_focus} focus)
Customer mindset: ${eq.purchase_mindset}

For this solution: "${solution}"

Generate 5 key benefit TEMPLATES that customers will experience. Each should:`

        // Adjust benefits based on emotional quotient
        if (eq.emotional_weight > 70) {
          // High emotional industries - focus on feelings and experiences
          prompt += `
- Focus on EMOTIONAL outcomes and personal transformations
- Use feeling-based language: confidence, joy, peace, excitement, pride
- Avoid ROI/time/money metrics unless secondary
- Include identity and social benefits

Example formats for ${industry}:
- "Feel confident and empowered in your choices"
- "Transform your experience into something memorable"
- "Experience the joy of achieving your vision"
- "Become recognized for your unique approach"
- "Enjoy peace of mind knowing you're supported"

DO NOT use ROI, time savings, or cost reduction as primary benefits for ${industry}!`
        } else if (eq.emotional_weight > 40) {
          prompt += `
- Balance emotional satisfaction with practical outcomes
- Include both feeling-based and result-based benefits
- Mix transformation language with achievement language
- Keep it conceptual - no specific numbers

Example formats:
- "Feel confident while achieving better business outcomes"
- "Experience significant improvements in operational efficiency"
- "Transform challenges into sustainable growth"
- "Gain clarity and control over your technology investments"`
        } else {
          // Low emotional industries - focus on outcomes but no made-up metrics
          prompt += `
- Focus on business outcomes without inventing metrics
- Use efficiency and performance language conceptually
- Let the business define their own metrics

Example formats:
- "Reduce operational complexity and associated costs"
- "Accelerate project delivery through streamlined processes"
- "Improve decision-making with better visibility"
- "Enhance team productivity through systematic approaches"`
        }

        prompt += `

Remember: Benefits should match how ${industry} customers actually make decisions.

Format your response as a JSON array of exactly 5 template strings with placeholders.`

        const suggestions = await this.callOpenRouter(prompt)
        return this.formatSuggestions(suggestions, 'benefit')
      }
    } catch (error) {
      console.warn('[OpenRouterAI] API failed, using fallback:', error)
    }

    return this.getIndustryBenefits(industry)
  }

  /**
   * Generate industry-specific differentiators
   * ONLY uses website data - NO HALLUCINATION ALLOWED
   */
  async generateDifferentiators(
    context: IndustryContext
  ): Promise<DraggableSuggestion[]> {
    const industry = context.industry || 'Real Estate'

    // Check if we have actual differentiator data from website
    const hasWebsiteData = context.websiteData && (
      context.websiteData.differentiators?.length > 0 ||
      context.websiteData.unique_value ||
      context.websiteData.strengths?.length > 0 ||
      context.websiteData.benefits?.length > 0
    )

    // If NO website data, return manual input request
    if (!hasWebsiteData) {
      console.warn('[OpenRouterAI] ⚠️ No differentiator data found on website - requesting manual input')
      return [{
        id: 'manual-input-required',
        content: '❌ Could not find your unique approach/methodology on your website. Please manually describe what makes your process or approach different from competitors.',
        type: 'differentiator',
        source: 'manual-input-required',
        confidence: 0,
        is_selected: false,
        is_customizable: true
      }]
    }

    try {
      if (this.apiKey) {
        // Extract ONLY actual website differentiators
        const websiteDifferentiators: string[] = []
        if (context.websiteData.differentiators?.length) {
          websiteDifferentiators.push(...context.websiteData.differentiators)
        }
        if (context.websiteData.unique_value) {
          websiteDifferentiators.push(context.websiteData.unique_value)
        }
        if (context.websiteData.strengths?.length) {
          websiteDifferentiators.push(...context.websiteData.strengths)
        }

        const prompt = `You are analyzing a ${industry} business website that explicitly states these differentiators:

ACTUAL DIFFERENTIATORS FROM THEIR WEBSITE:
${websiteDifferentiators.map((d, i) => `${i + 1}. ${d}`).join('\n')}

Transform these EXISTING differentiators into 5 clear, concise statements. Rules:
- ONLY use what's explicitly stated on their website above
- DO NOT invent methodologies, programs, or systems
- DO NOT add proprietary names or branded processes unless they're in the list above
- Simply clarify and present what they ACTUALLY offer
- Focus on HOW they deliver (their approach/methodology)
- Keep it factual and grounded in reality

Format your response as a JSON array of exactly 5 strings based ONLY on the differentiators listed above.`

        const suggestions = await this.callOpenRouter(prompt)

        // Strict validation - reject anything that fabricates
        const validated = suggestions.filter(s => {
          const lower = s.toLowerCase()
          // Reject if it contains fabricated program names or specific methodologies not in website data
          const hasFabrication = /blueprint|lab|strategy program|entry strategy|legacy|wealth/.test(lower) &&
            !websiteDifferentiators.some(d => d.toLowerCase().includes(lower.substring(0, 20)))

          return !hasFabrication
        })

        if (validated.length === 0) {
          console.warn('[OpenRouterAI] ⚠️ All AI suggestions were fabricated - requesting manual input')
          return [{
            id: 'manual-input-required',
            content: '❌ AI generated fabricated methodologies. Please manually describe your actual approach/process that differentiates you from competitors.',
            type: 'differentiator',
            source: 'manual-input-required',
            confidence: 0,
            is_selected: false,
            is_customizable: true
          }]
        }

        return this.formatSuggestions(validated, 'differentiator')
      }
    } catch (error) {
      console.warn('[OpenRouterAI] API failed:', error)
    }

    // Fallback: manual input required
    return [{
      id: 'manual-input-required',
      content: '❌ Unable to scrape differentiators from your website. Please manually describe what makes your approach unique.',
      type: 'differentiator',
      source: 'manual-input-required',
      confidence: 0,
      is_selected: false,
      is_customizable: true
    }]
  }

  /**
   * Call OpenRouter API
   */
  private async callOpenRouter(prompt: string): Promise<string[]> {
    console.log('[OpenRouterAI] Calling API with model:', this.model)

    const requestBody = {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'You are a marketing analyst helping extract and clarify information from business websites. Your job is to ONLY work with factual information provided - never invent, embellish, or create fictional services, methodologies, or programs. If information is not provided, say so clearly. Always respond with a valid JSON array of exactly 5 strings, no other text or formatting.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 1200,
      top_p: 0.95,
    }

    console.log('[OpenRouterAI] Request URL:', this.endpoint)

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        provider: 'openrouter',
        ...requestBody
      })
    })

    console.log('[OpenRouterAI] Response status:', response.status)

    if (!response.ok) {
      const error = await response.text()
      console.error('[OpenRouterAI] API Error Response:', error)
      throw new Error(`OpenRouter API error: ${response.status} ${error}`)
    }

    const data = await response.json()
    console.log('[OpenRouterAI] API Response data:', data)

    const content = data.choices[0].message.content
    console.log('[OpenRouterAI] Content from API:', content)

    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        console.log('[OpenRouterAI] Parsed JSON:', parsed)
        return parsed
      }
      const parsed = JSON.parse(content)
      console.log('[OpenRouterAI] Direct parsed JSON:', parsed)
      return parsed
    } catch (error) {
      // Fallback parsing if not valid JSON
      console.warn('[OpenRouterAI] Failed to parse JSON, error:', error)
      console.warn('[OpenRouterAI] Attempting text parsing of:', content)
      const fallbackParsed = content
        .split('\n')
        .filter((line: string) => line.trim().length > 10)
        .map((line: string) => line.replace(/^[\d.-]+\s*/, '').replace(/^["']|["']$/g, '').replace(/^\*\s*/, '').trim())
        .filter((line: string) => line.length > 10)
        .slice(0, 5)
      console.log('[OpenRouterAI] Fallback parsed result:', fallbackParsed)
      return fallbackParsed
    }
  }

  /**
   * Format suggestions
   */
  private formatSuggestions(
    content: string[],
    type: SuggestionType
  ): DraggableSuggestion[] {
    return content.map((text, index) => ({
      id: `${type}-ai-${Date.now()}-${index}`,
      content: text,
      type,
      source: 'ai-generated',
      confidence: 0.95,
      is_selected: false,
      is_customizable: true
    }))
  }

  // Fallback methods (same as industry-ai.ts)
  private getIndustryCustomerSegments(industry: string): DraggableSuggestion[] {
    const segments: Record<string, string[]> = {
      'Real Estate': [
        "First-time homebuyers seeking guidance through the purchase process",
        "Real estate investors looking for profitable opportunities",
        "Growing families needing more space in good school districts",
        "Downsizers transitioning to smaller, more manageable homes",
        "Luxury buyers seeking premium properties and exclusive service"
      ],
      'IT Services': [
        "Growing businesses that have outgrown their current IT setup",
        "Companies without internal IT staff needing reliable support",
        "Organizations seeking to modernize aging technology infrastructure",
        "Businesses facing compliance or security challenges",
        "Leadership teams wanting strategic technology guidance"
      ],
      'Information Technology': [
        "Non-technical executives needing to make technology decisions",
        "Companies undergoing digital transformation initiatives",
        "Organizations consolidating multiple technology vendors",
        "Businesses expanding and needing scalable IT solutions",
        "Teams struggling with remote work technology challenges"
      ],
      'default': [
        "Small business owners with 5-20 employees seeking operational efficiency without enterprise complexity",
        "Department managers at mid-size companies looking to optimize team performance with limited budgets",
        "Independent professionals wanting to scale their service offerings beyond solo capacity",
        "Startup founders needing cost-effective growth solutions that scale with revenue",
        "Enterprise teams requiring better collaboration tools that integrate with existing systems"
      ]
    }

    const suggestions = segments[industry] || segments['default']
    return this.formatSuggestions(suggestions, 'customer-segment')
  }

  private getIndustryProblems(industry: string): DraggableSuggestion[] {
    const problems: Record<string, string[]> = {
      'Real Estate': [
        "Craving the freedom to focus on building meaningful client relationships instead of drowning in repetitive administrative work",
        "Yearning for confidence that every lead gets the attention they deserve, even when you're with other clients",
        "Seeking the peace of mind that comes from knowing your pricing strategy is backed by data, not just intuition",
        "Desiring seamless coordination where nothing falls through the cracks and every party stays informed",
        "Wanting to feel connected to your past clients, knowing you're top of mind when opportunities arise"
      ],
      'IT Services': [
        "Frustrated by constant fire-fighting instead of strategic technology planning",
        "Struggling to demonstrate technology ROI to non-technical executives",
        "Wanting to transform from a cost center to a revenue enabler",
        "Seeking better visibility into technology investments and outcomes",
        "Needing to align IT initiatives with business growth objectives"
      ],
      'Information Technology': [
        "Overwhelmed by the complexity of managing multiple technology vendors",
        "Struggling to keep pace with rapid technological change",
        "Lacking the expertise to make confident technology decisions",
        "Wanting predictable technology costs and performance",
        "Seeking to leverage technology for competitive advantage"
      ],
      'default': [
        "Stuck in a cycle of repetitive manual tasks that drain your energy and steal time from strategic growth",
        "The constant stress of information scattered across multiple platforms, never quite sure you have the full picture",
        "The uncertainty of making critical decisions without clear data, hoping your instincts are right",
        "Watching quality slip as you grow, torn between maintaining standards and meeting demand",
        "The frustration of sensing opportunities just out of reach, lacking the visibility to seize them"
      ]
    }

    const suggestions = problems[industry] || problems['default']
    return this.formatSuggestions(suggestions, 'problem')
  }

  private getIndustrySolutions(industry: string): DraggableSuggestion[] {
    const solutions: Record<string, string[]> = {
      'Real Estate': [
        "A comprehensive lead management approach that prioritizes prospects based on engagement patterns and readiness to buy",
        "Modern virtual staging capabilities that help buyers visualize properties quickly and affordably",
        "Data-driven pricing strategies that combine market analysis with current trends for optimal positioning",
        "Streamlined transaction coordination that keeps all parties informed and reduces delays",
        "Systematic client relationship management that maintains connections and encourages referrals"
      ],
      'IT Services': [
        "Strategic technology consulting that aligns IT investments with business objectives",
        "Proactive monitoring and management that prevents issues before they impact operations",
        "Flexible service models that adapt to changing business needs without long-term commitments",
        "Clear reporting and dashboards that demonstrate technology value to stakeholders",
        "Experienced team that becomes an extension of your internal IT department"
      ],
      'Information Technology': [
        "Comprehensive technology assessment and roadmapping services",
        "Vendor-neutral recommendations based on your specific requirements",
        "Managed services that provide predictable costs and reliable performance",
        "Technology optimization that improves efficiency and reduces complexity",
        "Strategic planning that positions technology as a competitive advantage"
      ],
      'default': [
        "A comprehensive solution designed specifically for your industry's unique challenges",
        "Intelligent automation that adapts to your business patterns and workflows",
        "Data-driven insights that help you make better business decisions",
        "Flexible platform that can be customized to match your processes",
        "Seamless integration with your existing tools and systems"
      ]
    }

    const suggestions = solutions[industry] || solutions['default']
    return this.formatSuggestions(suggestions, 'solution')
  }

  private getIndustryBenefits(industry: string): DraggableSuggestion[] {
    const benefits: Record<string, string[]> = {
      'Real Estate': [
        "Close more deals by responding to every lead instantly and maintaining consistent follow-up throughout the sales cycle",
        "Dramatically reduce administrative overhead through automated workflow management and intelligent task coordination",
        "Maximize property values through strategic pricing insights and professional presentation that attracts premium buyers",
        "Build a thriving referral network by maintaining meaningful relationships with past clients long after closing",
        "Accelerate sales velocity with compelling property presentations and targeted marketing that reaches qualified buyers faster"
      ],
      'IT Services': [
        "Transform technology from a cost center into a strategic business enabler",
        "Gain clarity and confidence in technology decisions with expert guidance",
        "Achieve predictable technology costs and eliminate surprise expenses",
        "Improve operational efficiency through optimized technology infrastructure",
        "Enable business growth without technology becoming a bottleneck"
      ],
      'Information Technology': [
        "Reduce technology complexity while improving system reliability",
        "Make informed technology investments that drive business value",
        "Minimize downtime and maintain business continuity",
        "Stay ahead of technology trends without constant learning curves",
        "Convert technology challenges into competitive advantages"
      ],
      'default': [
        "Reclaim valuable time each week by automating repetitive tasks and streamlining workflows",
        "Drive significant revenue growth through better insights and data-driven decision making",
        "Reduce operational costs while simultaneously improving service quality and consistency",
        "Scale your operations efficiently without proportional increases in overhead or complexity",
        "Achieve exceptional customer satisfaction through reliable and consistent service delivery"
      ]
    }

    const suggestions = benefits[industry] || benefits['default']
    return this.formatSuggestions(suggestions, 'benefit')
  }

  private getIndustryDifferentiators(industry: string): DraggableSuggestion[] {
    const differentiators: Record<string, string[]> = {
      'Real Estate': [
        "Rapid response commitment with accountability for every client interaction",
        "Advanced market analysis using comprehensive local data for accurate pricing",
        "Flexible financing options that help clients move forward with confidence",
        "Dedicated support team that handles coordination as part of standard service",
        "Strong satisfaction guarantee that demonstrates commitment to excellence"
      ],
      'IT Services': [
        "Fixed-price service models that eliminate billing surprises",
        "Local team that understands your business and responds quickly",
        "Vendor-neutral approach focused on your best interests",
        "Month-to-month flexibility with no long-term contracts required",
        "Direct access to senior technicians, not just help desk staff"
      ],
      'Information Technology': [
        "Comprehensive approach that covers all technology needs in one relationship",
        "Proactive maintenance that prevents problems before they occur",
        "Clear documentation and knowledge transfer included",
        "Regular business reviews to ensure alignment with goals",
        "Flexible engagement models that adapt to your needs"
      ],
      'default': [
        "Purpose-built solution designed for your specific industry needs",
        "Proven methodology that delivers consistent, reliable results",
        "Strong guarantee that demonstrates confidence in our service",
        "Direct access to leadership team for strategic guidance",
        "Transparent pricing model with no hidden fees"
      ]
    }

    const suggestions = differentiators[industry] || differentiators['default']
    return this.formatSuggestions(suggestions, 'differentiator')
  }

  /**
   * Validate AI-generated suggestions against actual website data
   * Reject any suggestions that contain fabricated content
   */
  private validateAgainstWebsiteData(suggestions: string[], websiteServices: string[]): string[] {
    if (!websiteServices || websiteServices.length === 0) {
      console.warn('[OpenRouterAI] No website services to validate against')
      return []
    }

    // Create a list of "forbidden" words that indicate fabrication
    const forbiddenWords = [
      'proprietary',
      'algorithm',
      'system',
      'methodology',
      'framework',
      'process',
      'phase',
      'step',
      'tier',
      'level',
      'program',
      'suite',
      'platform',
      'engine',
      'solution'
    ]

    // Extract keywords from actual website services (lowercase for matching)
    const websiteKeywords = new Set<string>()
    websiteServices.forEach(service => {
      // Extract meaningful words (3+ characters, not common words)
      const words = service.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3 && !['the', 'and', 'for', 'that', 'with', 'your', 'this', 'from'].includes(w))

      words.forEach(w => websiteKeywords.add(w))
    })

    console.log('[OpenRouterAI] Website keywords:', Array.from(websiteKeywords))

    // Validate each suggestion
    const validated = suggestions.filter(suggestion => {
      const lowerSuggestion = suggestion.toLowerCase()

      // Check for forbidden fabrication indicators
      const hasForbiddenWords = forbiddenWords.some(word =>
        lowerSuggestion.includes(word) &&
        !websiteServices.some(s => s.toLowerCase().includes(word))
      )

      if (hasForbiddenWords) {
        console.warn('[OpenRouterAI] ❌ Rejected (fabricated):', suggestion)
        return false
      }

      // Check if suggestion references at least some actual website keywords
      const suggestionWords = lowerSuggestion
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3)

      const matchCount = suggestionWords.filter(w => websiteKeywords.has(w)).length
      const matchRatio = matchCount / suggestionWords.length

      // Require at least 20% overlap with website keywords
      if (matchRatio < 0.2) {
        console.warn('[OpenRouterAI] ❌ Rejected (no overlap):', suggestion, 'Match ratio:', matchRatio)
        return false
      }

      console.log('[OpenRouterAI] ✅ Accepted:', suggestion, 'Match ratio:', matchRatio)
      return true
    })

    return validated
  }
}

export const openRouterAI = new OpenRouterAI()