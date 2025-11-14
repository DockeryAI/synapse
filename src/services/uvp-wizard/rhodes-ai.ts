/**
 * Rhodes AI Service for UVP Wizard
 *
 * Wrapper around Claude (Anthropic) AI for UVP enhancement, scoring, and validation.
 * Uses OpenRouter for unified API access to Claude models.
 *
 * This service provides:
 * - UVP text enhancement and refinement
 * - Real-time quality scoring
 * - Suggestion generation
 * - Input validation and feedback
 * - Custom input parsing and analysis
 */

import {
  RhodesAIRequest,
  RhodesAIResponse,
  UVP,
  QualityAssessment,
} from '@/types/uvp-wizard'

/**
 * Rhodes AI configuration
 */
interface RhodesAIConfig {
  apiKey: string
  model: 'claude-opus-4' | 'claude-sonnet-4' | 'claude-3-opus' | 'claude-3-sonnet'
  temperature: number
  maxTokens: number
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: RhodesAIConfig = {
  apiKey: import.meta.env.VITE_OPENROUTER_API_KEY || '',
  model: 'claude-sonnet-4', // Balance of speed and quality
  temperature: 0.7,
  maxTokens: 2000,
}

/**
 * Rhodes AI service class
 */
export class RhodesAI {
  private config: RhodesAIConfig
  private endpoint = 'https://openrouter.ai/api/v1/chat/completions'

  constructor(config?: Partial<RhodesAIConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }

    if (!this.config.apiKey) {
      console.warn('[RhodesAI] No API key provided. Set VITE_OPENROUTER_API_KEY.')
    }
  }

  /**
   * Check if API is available
   */
  async isAvailable(): Promise<boolean> {
    return !!this.config.apiKey
  }

  /**
   * Main request handler
   */
  async process(request: RhodesAIRequest): Promise<RhodesAIResponse> {
    console.log('[RhodesAI] Processing request:', request.action)

    try {
      switch (request.action) {
        case 'enhance':
          return await this.enhanceText(request.prompt, request.context)
        case 'score':
          return await this.scoreUVP(request.context)
        case 'suggest':
          return await this.generateSuggestions(request.prompt, request.context)
        case 'validate':
          return await this.validateInput(request.prompt, request.context)
        default:
          throw new Error(`Unknown action: ${request.action}`)
      }
    } catch (error) {
      console.error('[RhodesAI] Request failed:', error)
      throw error
    }
  }

  /**
   * Enhance and refine UVP text
   */
  async enhanceText(originalText: string, context: Partial<UVP>): Promise<RhodesAIResponse> {
    const systemPrompt = `You are a UVP (Unique Value Proposition) copywriting expert.
Your job is to refine and enhance value proposition statements to make them more:
- Clear and concise
- Specific and measurable
- Compelling and persuasive
- Differentiated from competitors
- Customer-focused

Always maintain the core meaning while improving clarity and impact.`

    const userPrompt = `Enhance this UVP text: "${originalText}"

Context:
${context.industry ? `Industry: ${context.industry}` : ''}
${context.target_customer ? `Target Customer: ${context.target_customer}` : ''}
${context.competitors && context.competitors.length > 0 ? `Competitors: ${context.competitors.join(', ')}` : ''}

Provide:
1. Enhanced version of the text
2. 3 alternative variations
3. Brief explanation of changes made

Format your response as JSON:
{
  "enhanced": "enhanced text here",
  "alternatives": ["alt 1", "alt 2", "alt 3"],
  "explanation": "explanation here"
}`

    const response = await this.makeRequest(systemPrompt, userPrompt)
    const parsed = this.parseJSONResponse(response)

    return {
      enhanced_text: parsed.enhanced,
      suggestions: parsed.alternatives,
    }
  }

  /**
   * Score UVP quality
   */
  async scoreUVP(uvp: Partial<UVP>): Promise<RhodesAIResponse> {
    const systemPrompt = `You are a UVP (Unique Value Proposition) quality assessor.
Evaluate UVPs across multiple dimensions:
- Clarity (is it easy to understand?)
- Specificity (is it concrete and measurable?)
- Differentiation (is it unique from competitors?)
- Impact (does it promise meaningful value?)

Provide scores (0-100) and actionable feedback.`

    const userPrompt = `Assess this UVP:

Target Customer: ${uvp.target_customer || 'Not specified'}
Problem: ${uvp.customer_problem || 'Not specified'}
Solution: ${uvp.unique_solution || 'Not specified'}
Key Benefit: ${uvp.key_benefit || 'Not specified'}
Differentiation: ${uvp.differentiation || 'Not specified'}

Industry: ${uvp.industry || 'Not specified'}
${uvp.competitors && uvp.competitors.length > 0 ? `Competitors: ${uvp.competitors.join(', ')}` : ''}

Provide a comprehensive assessment in JSON format:
{
  "overall_score": 85,
  "clarity_score": 90,
  "specificity_score": 80,
  "differentiation_score": 85,
  "impact_score": 85,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2"],
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}`

    const response = await this.makeRequest(systemPrompt, userPrompt)
    const parsed = this.parseJSONResponse(response)

    // Calculate overall score if not provided
    if (!parsed.overall_score) {
      parsed.overall_score = Math.round(
        (parsed.clarity_score +
          parsed.specificity_score +
          parsed.differentiation_score +
          parsed.impact_score) /
          4
      )
    }

    return {
      score: parsed.overall_score,
    }
  }

  /**
   * Generate suggestions based on context
   */
  async generateSuggestions(
    prompt: string,
    context: Partial<UVP>
  ): Promise<RhodesAIResponse> {
    const systemPrompt = `You are a marketing strategist helping to build a powerful UVP.
Generate specific, actionable suggestions that are:
- Tailored to the industry and customer
- Based on proven marketing principles
- Concrete and implementable
- Differentiated from typical generic advice`

    const userPrompt = `${prompt}

Context:
${context.industry ? `Industry: ${context.industry}` : ''}
${context.target_customer ? `Target Customer: ${context.target_customer}` : ''}
${context.customer_problem ? `Problem: ${context.customer_problem}` : ''}
${context.unique_solution ? `Solution: ${context.unique_solution}` : ''}
${context.competitors && context.competitors.length > 0 ? `Competitors: ${context.competitors.join(', ')}` : ''}

Provide 5 specific suggestions in JSON format:
{
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4", "suggestion 5"]
}`

    const response = await this.makeRequest(systemPrompt, userPrompt)
    const parsed = this.parseJSONResponse(response)

    return {
      suggestions: parsed.suggestions || [],
    }
  }

  /**
   * Validate and parse custom user input
   */
  async validateInput(input: string, context: Partial<UVP>): Promise<RhodesAIResponse> {
    const systemPrompt = `You are an input validation assistant.
Analyze user input to ensure it is:
- Relevant to the UVP context
- Clear and well-formed
- Appropriate length and detail
- Free of obvious errors

Provide constructive feedback and suggestions for improvement.`

    const userPrompt = `Validate this input: "${input}"

Context:
${context.industry ? `Industry: ${context.industry}` : ''}
Expected type: ${this.getExpectedTypeFromContext(context)}

Provide validation results in JSON format:
{
  "is_valid": true,
  "errors": [],
  "warnings": ["warning if any"],
  "suggestions": ["suggestion 1", "suggestion 2"]
}`

    const response = await this.makeRequest(systemPrompt, userPrompt)
    const parsed = this.parseJSONResponse(response)

    return {
      validation: {
        is_valid: parsed.is_valid !== false, // Default to true if not specified
        errors: parsed.errors || [],
        warnings: parsed.warnings || [],
      },
      suggestions: parsed.suggestions || [],
    }
  }

  /**
   * Parse custom input and extract structured data
   */
  async parseCustomInput(
    input: string,
    expectedType: 'customer' | 'problem' | 'solution' | 'benefit' | 'differentiator'
  ): Promise<RhodesAIResponse> {
    const systemPrompt = `You are a text analysis assistant.
Parse user input and extract key information, reformatting it into a clear, concise statement.
Clean up grammar, remove filler words, and enhance clarity while preserving meaning.`

    const userPrompt = `Parse this ${expectedType} input: "${input}"

Extract and enhance the core message. Return JSON:
{
  "parsed": "cleaned and enhanced version",
  "confidence": 0.95,
  "issues": ["any issues found"]
}`

    const response = await this.makeRequest(systemPrompt, userPrompt)
    const parsed = this.parseJSONResponse(response)

    return {
      enhanced_text: parsed.parsed,
      suggestions: parsed.issues || [],
    }
  }

  /**
   * Get expected type from context for validation
   */
  private getExpectedTypeFromContext(context: Partial<UVP>): string {
    if (context.target_customer !== undefined) return 'Customer segment'
    if (context.customer_problem !== undefined) return 'Customer problem'
    if (context.unique_solution !== undefined) return 'Solution'
    if (context.key_benefit !== undefined) return 'Key benefit'
    if (context.differentiation !== undefined) return 'Differentiation'
    return 'UVP component'
  }

  /**
   * Make API request to Claude via OpenRouter
   */
  private async makeRequest(systemPrompt: string, userPrompt: string): Promise<string> {
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
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Rhodes AI API error: ${response.status} ${error}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  }

  /**
   * Parse JSON response from AI
   */
  private parseJSONResponse(content: string): any {
    try {
      // Try direct parse
      return JSON.parse(content)
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1])
      }

      // Try to extract JSON from anywhere in the text
      const jsonObjectMatch = content.match(/\{[\s\S]*\}/)
      if (jsonObjectMatch) {
        return JSON.parse(jsonObjectMatch[0])
      }

      // If all fails, return wrapped content
      return { text: content }
    }
  }

  /**
   * Map model names to OpenRouter format
   */
  private mapModelName(model: string): string {
    const mapping: Record<string, string> = {
      'claude-opus-4': 'anthropic/claude-opus-4',
      'claude-sonnet-4': 'anthropic/claude-sonnet-4',
      'claude-3-opus': 'anthropic/claude-3-opus',
      'claude-3-sonnet': 'anthropic/claude-3-sonnet',
    }

    return mapping[model] || model
  }
}

/**
 * Singleton instance
 */
export const rhodesAI = new RhodesAI()
