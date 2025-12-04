/**
 * Connection Discovery Engine
 * Uses AI to find unexpected connections between brand data, market signals, and opportunities
 *
 * This is the "Holy Shit Moments" feature - discovering insights that aren't obvious
 */

import { chat } from '@/lib/openrouter'
import type {
  Connection,
  LegacyConnection,
  DeepContext,
  ConnectionDiscoveryOptions,
  ConnectionDiscoveryResult,
  LegacyConnectionDiscoveryResult,
  DataPoint
} from '@/types/connections.types'

export class ConnectionDiscoveryEngine {
  /**
   * Find connections in deep brand context
   */
  static async discoverConnections(
    context: DeepContext,
    options: ConnectionDiscoveryOptions = {}
  ): Promise<LegacyConnectionDiscoveryResult> {
    const startTime = Date.now()

    // Check for Supabase configuration (ai-proxy uses OPENROUTER_API_KEY as server-side secret)
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error(
        'Connection Discovery requires Supabase configuration. ' +
        'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.'
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

      // Map to our LegacyConnection type (since this uses legacy format)
      const connections: LegacyConnection[] = result.connections.map((conn: any, index: number) => ({
        id: `conn_${context.business.profile.id}_${Date.now()}_${index}`,
        brand_id: context.business.profile.id,
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
Industry: ${context.industry.profile?.name || 'Unknown'}
Brand: ${context.business.profile.name}
Brand Voice: ${context.business.brandVoice.tone.join(', ')}
Keywords: ${context.business.profile.keywords.join(', ')}

**CUSTOMER PSYCHOLOGY:**
Emotional Triggers: ${context.customerPsychology.emotional.slice(0, 5).map(e => e.trigger).join(', ')}
Unarticulated Needs: ${context.customerPsychology.unarticulated.length} identified

**MARKET INTELLIGENCE:**
Competitors Analyzed: ${context.industry.competitiveLandscape.topCompetitors.length}
Content Gaps: ${context.competitiveIntel.contentGaps.length}
Market Opportunities: ${context.competitiveIntel.opportunities.length}

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

    if (context.industry.trends && context.industry.trends.length > 0) {
      points.push(`- ${context.industry.trends.length} industry trends analyzed`)
    }
    if (context.industry.seasonality && context.industry.seasonality.length > 0) {
      points.push(`- ${context.industry.seasonality.length} seasonal patterns mapped`)
    }
    if (context.industry.competitiveLandscape.topCompetitors.length > 0) {
      points.push(`- ${context.industry.competitiveLandscape.topCompetitors.length} competitor profiles with detailed analysis`)
    }
    if (context.competitiveIntel.contentGaps && context.competitiveIntel.contentGaps.length > 0) {
      points.push(`- ${context.competitiveIntel.contentGaps.length} content gap opportunities`)
    }
    if (context.competitiveIntel.opportunities && context.competitiveIntel.opportunities.length > 0) {
      points.push(`- ${context.competitiveIntel.opportunities.length} market gap opportunities`)
    }
    if (context.customerPsychology.emotional && context.customerPsychology.emotional.length > 0) {
      points.push(`- ${context.customerPsychology.emotional.length} identified emotional triggers`)
    }
    if (context.industry.economicFactors && context.industry.economicFactors.length > 0) {
      points.push('- Economic indicators and impact analysis')
    }

    return points.length > 0 ? points.join('\n') : '- Limited data available (analysis may be constrained)'
  }

  /**
   * Categorize connections by type
   */
  private static categorizeConnections(connections: LegacyConnection[]): Record<string, number> {
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
    const sources: string[] = ['business_profile', 'customer_psychology']

    if (context.industry.trends?.length) sources.push('industry_trends')
    if (context.industry.seasonality?.length) sources.push('seasonal_analysis')
    if (context.industry.competitiveLandscape?.topCompetitors?.length) sources.push('competitive_intelligence')
    if (context.competitiveIntel.contentGaps?.length) sources.push('content_gap_analysis')
    if (context.competitiveIntel.opportunities?.length) sources.push('market_opportunity_analysis')
    if (context.industry.economicFactors?.length) sources.push('economic_factors')
    if (context.metadata?.dataSourcesUsed?.length) sources.push(...context.metadata.dataSourcesUsed)

    return sources
  }
}
