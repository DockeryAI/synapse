/**
 * Connection Discovery Engine
 * Uses AI to find unexpected connections between brand data, market signals, and opportunities
 *
 * This is the "Holy Shit Moments" feature - discovering insights that aren't obvious
 */

import { chat } from '@/lib/openrouter'
import type {
  Connection,
  DeepContext,
  ConnectionDiscoveryOptions,
  ConnectionDiscoveryResult,
  DataPoint
} from '@/types/connections.types'

export class ConnectionDiscoveryEngine {
  /**
   * Find connections in deep brand context
   */
  static async discoverConnections(
    context: DeepContext,
    options: ConnectionDiscoveryOptions = {}
  ): Promise<ConnectionDiscoveryResult> {
    const startTime = Date.now()

    // Check for API key
    if (!import.meta.env.VITE_OPENROUTER_API_KEY) {
      throw new Error(
        'Connection Discovery requires OpenRouter API key. ' +
        'Add VITE_OPENROUTER_API_KEY to your .env file. ' +
        'Get a free key from https://openrouter.ai/'
      )
    }

    const {
      minBreakthroughScore = 0.7,
      maxConnections = 15,
      includeWeakSignals = true,
      focusAreas = ['customer_psychology', 'market_trends', 'competitive_gaps', 'timing']
    } = options

    try {
      console.log('[ConnectionDiscovery] Starting analysis...')

      // Build the analysis prompt
      const prompt = this.buildAnalysisPrompt(context, {
        minBreakthroughScore,
        maxConnections,
        includeWeakSignals,
        focusAreas
      })

      // Call OpenRouter with Claude
      const response = await chat([
        {
          role: 'system',
          content: `You are an expert marketing strategist and data analyst specializing in finding unexpected, high-value connections between disparate data points. You excel at discovering "holy shit" moments - insights that make people say "wow, I never thought of that connection!"

Your task is to analyze brand data and find NON-OBVIOUS connections that create breakthrough marketing opportunities. Don't just state the obvious - find the hidden patterns that competitors miss.

Focus on:
1. Cross-domain connections (e.g., weather pattern → customer trigger → competitor weakness)
2. Timing opportunities (when multiple signals align)
3. Psychological triggers meeting market gaps
4. Competitive white spaces that align with brand strengths

Return ONLY valid JSON matching the schema provided.`
        },
        {
          role: 'user',
          content: prompt
        }
      ], {
        temperature: 0.8, // Higher creativity for discovery
        maxTokens: 3000
      })

      console.log('[ConnectionDiscovery] AI analysis complete')

      // Parse response
      const result = JSON.parse(response)

      // Map to our Connection type
      const connections: Connection[] = result.connections.map((conn: any, index: number) => ({
        id: `conn_${context.brand_id}_${Date.now()}_${index}`,
        brand_id: context.brand_id,
        type: conn.type || '2-way',
        title: conn.title,
        description: conn.description,
        data_points: conn.data_points || [],
        confidence: conn.confidence,
        impact_score: conn.impact_score,
        breakthrough_score: conn.breakthrough_score,
        content_angle: conn.content_angle,
        suggested_actions: conn.suggested_actions || [],
        created_at: new Date().toISOString(),
        expires_at: conn.expires_at
      }))

      const processingTime = Date.now() - startTime

      // Build summary
      const summary = {
        total_connections: connections.length,
        high_confidence_count: connections.filter(c => c.confidence >= 0.85).length,
        breakthrough_insights: connections.filter(c => c.breakthrough_score >= minBreakthroughScore).length,
        categories: this.categorizeConnections(connections)
      }

      const dataSources = this.extractDataSources(context)

      console.log(`[ConnectionDiscovery] Found ${connections.length} connections in ${processingTime}ms`)

      return {
        connections,
        summary,
        processing_time_ms: processingTime,
        data_sources_used: dataSources
      }

    } catch (error) {
      console.error('[ConnectionDiscovery] Error:', error)

      if (error instanceof Error) {
        if (error.message.includes('JSON')) {
          throw new Error('Failed to parse AI response. Connection discovery may need retry.')
        }
        throw error
      }

      throw new Error('Connection discovery failed: ' + String(error))
    }
  }

  /**
   * Build the analysis prompt for the AI
   */
  private static buildAnalysisPrompt(
    context: DeepContext,
    options: ConnectionDiscoveryOptions
  ): string {
    return `Analyze this brand's data and discover unexpected, high-value connections:

**BRAND CONTEXT:**
Industry: ${context.industry}
Archetype: ${context.archetype}
Brand Voice: ${context.brand_voice}
Keywords: ${context.keywords.join(', ')}

**CUSTOMER PSYCHOLOGY:**
Emotional Triggers: ${context.triggers.slice(0, 5).join(', ')}
Target Personas: ${context.target_personas?.length || 0} defined personas

**MARKET INTELLIGENCE:**
Competitors Analyzed: ${context.competitors?.length || 0}
Content Gaps: ${context.content_gaps?.length || 0}
Current Opportunities: ${context.current_opportunities?.length || 0}

**AVAILABLE DATA POINTS:**
${this.summarizeDataPoints(context)}

**YOUR TASK:**
Find ${options.maxConnections} NON-OBVIOUS connections with breakthrough score >= ${options.minBreakthroughScore}.

Focus on: ${options.focusAreas?.join(', ')}

**OUTPUT FORMAT (JSON):**
{
  "connections": [
    {
      "type": "2-way" | "3-way" | "4-way",
      "title": "Short, compelling title",
      "description": "2-3 sentence explanation of WHY this connection matters",
      "data_points": [
        {
          "source": "weather|trends|competitor|customer_trigger|content_gap|seo",
          "insight": "What this data point reveals",
          "data": "Key data",
          "confidence": 0.0-1.0
        }
      ],
      "confidence": 0.0-1.0,
      "impact_score": 0-100,
      "breakthrough_score": 0.0-1.0,
      "content_angle": "Specific content idea to exploit this connection",
      "suggested_actions": [
        {
          "action_type": "create_content|adjust_strategy|target_audience|timing|platform_shift",
          "description": "Specific action to take",
          "priority": "critical|high|medium|low",
          "estimated_effort": "1 hour|half day|2 days|1 week",
          "potential_impact": 0-100
        }
      ],
      "expires_at": "ISO date if time-sensitive"
    }
  ]
}

**EXAMPLE OF A GREAT CONNECTION:**
"During heat waves, searches for 'emergency AC repair' spike 3x. Your competitor's website loads slowly on mobile (4.2s vs your 1.8s). Your 'Hero' archetype resonates with urgency messaging. **CONNECTION**: Run mobile-first PPC campaign with urgency copy ('Same-Day Hero Service') targeting 'emergency AC' keywords during forecasted heat waves. This combines timing (weather), competitive advantage (mobile speed), and psychology (hero archetype + urgency trigger)."

Find connections like this - unexpected, actionable, and high-impact.`
  }

  /**
   * Summarize available data points for the prompt
   */
  private static summarizeDataPoints(context: DeepContext): string {
    const points: string[] = []

    if (context.weather_data) {
      points.push('- Weather forecasts and historical patterns')
    }
    if (context.trend_data) {
      points.push('- Google Trends and search volume data')
    }
    if (context.seo_data) {
      points.push('- SEO keyword opportunities and rankings')
    }
    if (context.competitors && context.competitors.length > 0) {
      points.push(`- ${context.competitors.length} competitor profiles with weaknesses`)
    }
    if (context.content_gaps && context.content_gaps.length > 0) {
      points.push(`- ${context.content_gaps.length} content gap opportunities`)
    }
    if (context.current_opportunities && context.current_opportunities.length > 0) {
      points.push(`- ${context.current_opportunities.length} active market opportunities`)
    }
    if (context.benchmarks) {
      points.push('- Industry benchmark comparisons')
    }

    return points.length > 0 ? points.join('\n') : '- Limited data available (analysis may be constrained)'
  }

  /**
   * Categorize connections by type
   */
  private static categorizeConnections(connections: Connection[]): Record<string, number> {
    const categories: Record<string, number> = {
      timing: 0,
      competitive: 0,
      psychological: 0,
      content: 0,
      channel: 0
    }

    connections.forEach(conn => {
      const description = conn.description.toLowerCase()

      if (description.includes('timing') || description.includes('when') || description.includes('forecast')) {
        categories.timing++
      }
      if (description.includes('competitor') || description.includes('weakness') || description.includes('gap')) {
        categories.competitive++
      }
      if (description.includes('trigger') || description.includes('psychology') || description.includes('emotion')) {
        categories.psychological++
      }
      if (description.includes('content') || description.includes('post') || description.includes('message')) {
        categories.content++
      }
      if (description.includes('channel') || description.includes('platform') || description.includes('medium')) {
        categories.channel++
      }
    })

    return categories
  }

  /**
   * Extract list of data sources used
   */
  private static extractDataSources(context: DeepContext): string[] {
    const sources: string[] = ['brand_profile', 'customer_triggers']

    if (context.weather_data) sources.push('weather_api')
    if (context.trend_data) sources.push('google_trends')
    if (context.seo_data) sources.push('seo_analysis')
    if (context.competitors?.length) sources.push('competitive_intelligence')
    if (context.content_gaps?.length) sources.push('content_gap_analysis')
    if (context.benchmarks) sources.push('industry_benchmarks')

    return sources
  }
}
