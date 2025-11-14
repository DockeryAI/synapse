/**
 * Perplexity API Service for UVP Wizard
 *
 * Provides real-time industry insights, market research, and competitive intelligence
 * using Perplexity's Sonar models with web search capabilities.
 *
 * This service helps generate UVP suggestions based on:
 * - Industry trends and best practices
 * - Customer pain points and needs
 * - Competitive differentiation opportunities
 * - Market positioning insights
 */

import {
  PerplexityRequest,
  PerplexityResponse,
  DraggableSuggestion,
  SuggestionType,
} from '@/types/uvp-wizard'

/**
 * Perplexity API configuration
 */
interface PerplexityConfig {
  apiKey: string
  model: 'sonar-pro' | 'sonar' | 'sonar-medium' | 'sonar-small'
  temperature: number
  maxTokens: number
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: PerplexityConfig = {
  apiKey: import.meta.env.VITE_OPENROUTER_API_KEY || import.meta.env.VITE_OPENAI_API_KEY || '',
  model: 'sonar-pro', // Best for deep research
  temperature: 0.7,
  maxTokens: 2000,
}

/**
 * Perplexity API service class
 */
export class PerplexityAPI {
  private config: PerplexityConfig
  private endpoint = 'https://openrouter.ai/api/v1/chat/completions'

  constructor(config?: Partial<PerplexityConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }

    if (!this.config.apiKey) {
      console.warn('[PerplexityAPI] No API key provided. Set VITE_OPENROUTER_API_KEY.')
    }
  }

  /**
   * Check if API is available
   */
  async isAvailable(): Promise<boolean> {
    return !!this.config.apiKey
  }

  /**
   * Get industry insights for a specific context
   */
  async getIndustryInsights(request: PerplexityRequest): Promise<PerplexityResponse> {
    console.log('[PerplexityAPI] Fetching industry insights:', request)

    try {
      const prompt = this.buildPrompt(request)
      const response = await this.makeRequest(prompt)

      return this.parseResponse(response)
    } catch (error) {
      console.error('[PerplexityAPI] Failed to get industry insights:', error)
      throw error
    }
  }

  /**
   * Generate customer problem suggestions
   */
  async generateCustomerProblems(
    industry: string,
    customerSegment: string
  ): Promise<DraggableSuggestion[]> {
    const request: PerplexityRequest = {
      query: `What are the top 5 most pressing problems and pain points that ${customerSegment} face in the ${industry} industry right now?`,
      context: { industry },
      max_results: 5,
    }

    const response = await this.getIndustryInsights(request)

    return response.insights.map((insight, index) => ({
      id: `problem-${Date.now()}-${index}`,
      content: insight,
      type: 'problem' as SuggestionType,
      source: 'ai-generated',
      confidence: response.confidence,
      is_selected: false,
      is_customizable: true,
    }))
  }

  /**
   * Generate solution suggestions
   */
  async generateSolutions(
    industry: string,
    problem: string
  ): Promise<DraggableSuggestion[]> {
    const request: PerplexityRequest = {
      query: `What are the most effective solutions currently being used to solve this problem in the ${industry} industry: "${problem}"? Provide 5 specific solution approaches.`,
      context: { industry },
      max_results: 5,
    }

    const response = await this.getIndustryInsights(request)

    return response.insights.map((insight, index) => ({
      id: `solution-${Date.now()}-${index}`,
      content: insight,
      type: 'solution' as SuggestionType,
      source: 'ai-generated',
      confidence: response.confidence,
      is_selected: false,
      is_customizable: true,
    }))
  }

  /**
   * Generate key benefit suggestions
   */
  async generateKeyBenefits(
    industry: string,
    solution: string
  ): Promise<DraggableSuggestion[]> {
    const request: PerplexityRequest = {
      query: `What are the top 5 measurable benefits that customers experience from this type of solution in the ${industry} industry: "${solution}"? Focus on tangible outcomes.`,
      context: { industry },
      max_results: 5,
    }

    const response = await this.getIndustryInsights(request)

    return response.insights.map((insight, index) => ({
      id: `benefit-${Date.now()}-${index}`,
      content: insight,
      type: 'benefit' as SuggestionType,
      source: 'ai-generated',
      confidence: response.confidence,
      is_selected: false,
      is_customizable: true,
    }))
  }

  /**
   * Generate differentiation opportunities
   */
  async generateDifferentiators(
    industry: string,
    competitors: string[]
  ): Promise<DraggableSuggestion[]> {
    const competitorList = competitors.length > 0
      ? `Key competitors include: ${competitors.join(', ')}.`
      : ''

    const request: PerplexityRequest = {
      query: `In the ${industry} industry, what are 5 unique ways a company can differentiate itself from competitors? ${competitorList} Focus on sustainable competitive advantages.`,
      context: { industry, competitors },
      max_results: 5,
    }

    const response = await this.getIndustryInsights(request)

    return response.insights.map((insight, index) => ({
      id: `differentiator-${Date.now()}-${index}`,
      content: insight,
      type: 'differentiator' as SuggestionType,
      source: 'ai-generated',
      confidence: response.confidence,
      is_selected: false,
      is_customizable: true,
    }))
  }

  /**
   * Get customer segment suggestions
   */
  async generateCustomerSegments(
    industry: string,
    brandName?: string
  ): Promise<DraggableSuggestion[]> {
    const brandContext = brandName ? `for a company like ${brandName}` : ''

    const request: PerplexityRequest = {
      query: `What are the 5 most valuable customer segments in the ${industry} industry ${brandContext}? Describe each segment with demographics and psychographics.`,
      context: { industry, brand_name: brandName },
      max_results: 5,
    }

    const response = await this.getIndustryInsights(request)

    return response.insights.map((insight, index) => ({
      id: `customer-${Date.now()}-${index}`,
      content: insight,
      type: 'customer-segment' as SuggestionType,
      source: 'ai-generated',
      confidence: response.confidence,
      is_selected: false,
      is_customizable: true,
    }))
  }

  /**
   * Research competitors for context
   */
  async researchCompetitors(
    industry: string,
    brandName: string
  ): Promise<string[]> {
    const request: PerplexityRequest = {
      query: `Who are the top 10 competitors in the ${industry} industry for ${brandName}? List just the company names.`,
      context: { industry, brand_name: brandName },
      max_results: 10,
    }

    const response = await this.getIndustryInsights(request)
    return response.insights
  }

  /**
   * Build the prompt for Perplexity
   */
  private buildPrompt(request: PerplexityRequest): string {
    let prompt = request.query

    if (request.context) {
      const contextParts: string[] = []

      if (request.context.industry) {
        contextParts.push(`Industry: ${request.context.industry}`)
      }

      if (request.context.brand_name) {
        contextParts.push(`Brand: ${request.context.brand_name}`)
      }

      if (request.context.competitors && request.context.competitors.length > 0) {
        contextParts.push(`Competitors: ${request.context.competitors.join(', ')}`)
      }

      if (contextParts.length > 0) {
        prompt += `\n\nContext:\n${contextParts.join('\n')}`
      }
    }

    prompt += `\n\nProvide ${request.max_results || 5} specific, actionable insights. Format your response as a JSON array of strings.`

    return prompt
  }

  /**
   * Make API request to Perplexity via OpenRouter
   */
  private async makeRequest(prompt: string): Promise<any> {
    const modelName = this.mapModelName(this.config.model)

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'MARBA UVP Wizard',
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: 'system',
            content:
              'You are a marketing intelligence AI with real-time web access. Provide current, accurate insights about industries, markets, and customer needs. Always respond with valid JSON arrays.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Perplexity API error: ${response.status} ${error}`)
    }

    return response.json()
  }

  /**
   * Parse API response into PerplexityResponse
   */
  private parseResponse(data: any): PerplexityResponse {
    const content = data.choices[0].message.content

    // Try to parse as JSON array
    let insights: string[] = []
    try {
      const parsed = JSON.parse(content)
      insights = Array.isArray(parsed) ? parsed : [content]
    } catch {
      // If not JSON, split by newlines and filter
      insights = content
        .split('\n')
        .filter((line: string) => line.trim().length > 0)
        .map((line: string) => line.replace(/^[\d.-]+\s*/, '').trim())
        .filter((line: string) => line.length > 10)
    }

    // Calculate confidence based on response quality
    const confidence = this.calculateConfidence(data)

    return {
      insights,
      sources: this.extractSources(data),
      confidence,
    }
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(data: any): number {
    // Base confidence on finish reason and token usage
    if (data.choices[0].finish_reason === 'stop') {
      return 0.9
    }

    if (data.choices[0].finish_reason === 'length') {
      return 0.7
    }

    return 0.5
  }

  /**
   * Extract sources from response metadata
   */
  private extractSources(data: any): Array<{ title: string; url: string; excerpt: string }> {
    // OpenRouter doesn't return sources in the same format as native Perplexity
    // Return empty array for now - could be enhanced later
    return []
  }

  /**
   * Map model names to OpenRouter format
   */
  private mapModelName(model: string): string {
    const mapping: Record<string, string> = {
      'sonar-pro': 'perplexity/sonar-pro',
      sonar: 'perplexity/sonar',
      'sonar-medium': 'perplexity/sonar-medium-online',
      'sonar-small': 'perplexity/sonar-small-online',
    }

    return mapping[model] || model
  }
}

/**
 * Singleton instance
 */
export const perplexityAPI = new PerplexityAPI()
