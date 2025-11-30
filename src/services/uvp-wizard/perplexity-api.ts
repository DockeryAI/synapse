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
  apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  model: 'sonar-pro', // Best for deep research
  temperature: 0.7,
  maxTokens: 2000,
}

/**
 * Perplexity API service class
 */
export class PerplexityAPI {
  private config: PerplexityConfig
  private endpoint: string

  constructor(config?: Partial<PerplexityConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`

    if (!this.config.apiKey) {
      console.warn('[PerplexityAPI] No API key provided. Set VITE_SUPABASE_ANON_KEY.')
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
   * Find real conversations about customer pain points
   * Searches Reddit, forums, and community discussions
   */
  async findPainPointConversations(
    painPoints: string[],
    industry: string
  ): Promise<DraggableSuggestion[]> {
    // Build a query focused on finding real discussions
    const painPointList = painPoints.slice(0, 3).join('" OR "')

    const request: PerplexityRequest = {
      query: `Find recent Reddit posts, forum discussions, or community conversations where people are talking about these problems in ${industry}: "${painPointList}".

For each conversation found, provide:
1. A direct quote or paraphrase of what someone said
2. The context (subreddit, forum, or platform)
3. What pain point they're expressing

Focus on real customer voices complaining about or discussing these issues.`,
      context: { industry },
      max_results: 8,
    }

    const response = await this.getIndustryInsights(request)

    return response.insights.map((insight, index) => ({
      id: `conversation-${Date.now()}-${index}`,
      content: insight,
      type: 'pain-point' as SuggestionType,
      source: 'ai-generated',
      confidence: response.confidence,
      is_selected: false,
      is_customizable: true,
    }))
  }

  /**
   * Search for industry discussions and trending topics
   * Returns conversation-style insights for the Conversations tab
   */
  async findIndustryConversations(
    industry: string,
    customerSegment: string
  ): Promise<DraggableSuggestion[]> {
    const request: PerplexityRequest = {
      query: `What are ${customerSegment} in ${industry} discussing right now on Reddit, LinkedIn, and industry forums?

Find 5 specific recent discussions or debates with:
1. The topic being discussed
2. A representative quote or opinion
3. Why this matters to this audience

Focus on frustrations, challenges, and unmet needs they're expressing.`,
      context: { industry },
      max_results: 5,
    }

    const response = await this.getIndustryInsights(request)

    return response.insights.map((insight, index) => ({
      id: `industry-convo-${Date.now()}-${index}`,
      content: insight,
      type: 'problem' as SuggestionType,
      source: 'ai-generated',
      confidence: response.confidence,
      is_selected: false,
      is_customizable: true,
    }))
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
   * Make API request to Perplexity via ai-proxy
   */
  private async makeRequest(prompt: string): Promise<any> {
    const modelName = this.mapModelName(this.config.model)

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        provider: 'perplexity',
        model: modelName,
        messages: [
          {
            role: 'system',
            content: `You are a customer psychology researcher with real-time web access. Your job is to find and report CUSTOMER VOICES - real fears, frustrations, desires, and objections expressed by actual customers.

CRITICAL RULES:
1. Return CUSTOMER PSYCHOLOGY, not business recommendations
2. Use customer language: "Fear of...", "Frustrated with...", "Worried about...", "Want..."
3. Find REAL QUOTES from Reddit, forums, G2, Trustpilot - not marketing copy
4. Keep emotional words: hate, love, frustrated, anxious, worried, wish, need
5. NEVER suggest actions like "Implement...", "Deploy...", "Conduct..."
6. Each insight should read like a customer quote or paraphrase, not a consultant's advice

GOOD EXAMPLES (customer psychology):
- "Fear of vendor lock-in when chatbot conversations are stored in proprietary formats"
- "Frustrated that most chatbots can't handle multi-product insurance bundles"
- "Worried about AI giving incorrect policy information that leads to legal issues"

BAD EXAMPLES (recommendations - AVOID):
- "Implement customer churn prediction by analyzing behavior patterns"
- "Deploy A/B testing on conversion points"
- "Conduct social media sentiment analysis"

Always respond with valid JSON arrays of customer psychology insights.`,
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
    const MAX_INSIGHTS_PER_RESPONSE = 15; // Cap insights to prevent memory bloat

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

    // Cap insights to prevent memory bloat from verbose responses
    if (insights.length > MAX_INSIGHTS_PER_RESPONSE) {
      console.log(`[PerplexityAPI] Capping insights from ${insights.length} to ${MAX_INSIGHTS_PER_RESPONSE}`);
      insights = insights.slice(0, MAX_INSIGHTS_PER_RESPONSE);
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
   * Perplexity returns citations in the response - try multiple formats
   */
  private extractSources(data: any): Array<{ title: string; url: string; excerpt: string }> {
    const sources: Array<{ title: string; url: string; excerpt: string }> = [];

    try {
      // Format 1: Perplexity native API - citations array
      if (data.citations && Array.isArray(data.citations)) {
        data.citations.forEach((citation: any) => {
          if (typeof citation === 'string') {
            // Simple URL string
            sources.push({
              title: this.extractDomainFromUrl(citation),
              url: citation,
              excerpt: ''
            });
          } else if (citation.url) {
            // Citation object
            sources.push({
              title: citation.title || citation.name || this.extractDomainFromUrl(citation.url),
              url: citation.url,
              excerpt: citation.snippet || citation.excerpt || ''
            });
          }
        });
      }

      // Format 2: Check message content for inline citations [1], [2], etc.
      const content = data.choices?.[0]?.message?.content || '';
      const urlPattern = /https?:\/\/[^\s\)\]]+/g;
      const foundUrls = content.match(urlPattern) || [];
      foundUrls.slice(0, 5).forEach((url: string) => {
        // Avoid duplicates
        if (!sources.find(s => s.url === url)) {
          sources.push({
            title: this.extractDomainFromUrl(url),
            url: url,
            excerpt: ''
          });
        }
      });

      // Format 3: OpenRouter metadata
      if (data.metadata?.sources) {
        data.metadata.sources.forEach((source: any) => {
          sources.push({
            title: source.title || source.name || 'Source',
            url: source.url || '',
            excerpt: source.excerpt || ''
          });
        });
      }

    } catch (err) {
      console.warn('[PerplexityAPI] Failed to extract sources:', err);
    }

    console.log(`[PerplexityAPI] Extracted ${sources.length} source URLs`);
    return sources;
  }

  /**
   * Extract domain name from URL for display
   */
  private extractDomainFromUrl(url: string): string {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain.charAt(0).toUpperCase() + domain.slice(1);
    } catch {
      return 'Source';
    }
  }

  /**
   * Map model names to Perplexity direct API format
   * No prefix needed when calling api.perplexity.ai directly
   */
  private mapModelName(model: string): string {
    const mapping: Record<string, string> = {
      'sonar-pro': 'sonar-pro',
      sonar: 'sonar',
      'sonar-medium': 'sonar',
      'sonar-small': 'sonar',
    }

    return mapping[model] || model
  }
}

/**
 * Singleton instance
 */
export const perplexityAPI = new PerplexityAPI()
