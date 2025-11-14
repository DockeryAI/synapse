import { SynapseAnalysis } from '@/types/intelligence.types'
import { supabase } from '@/lib/supabase'

/**
 * Synapse Auto-Analyzer Service
 * Runs automatic psychology scoring and competitor analysis
 */

export class SynapseAutoAnalyzer {
  /**
   * Analyze content for psychology score and persuasion elements
   */
  static async analyzeContent(content: string, analysisType: 'content' | 'uvp' | 'campaign' | 'audience'): Promise<SynapseAnalysis> {
    // Check cache first
    const cached = await this.getCachedAnalysis(content)
    if (cached) return cached

    // Call enrich-with-synapse edge function
    const { data, error } = await supabase.functions.invoke('enrich-with-synapse', {
      body: { content, analysis_type: analysisType },
    })

    if (error) throw error

    const analysis: SynapseAnalysis = {
      id: `synapse_${Date.now()}`,
      content,
      analysis_type: analysisType,
      psychology_score: data.psychology_score || 0,
      connections: data.connections || [],
      power_words: data.power_words || [],
      emotional_triggers: data.emotional_triggers || [],
      cognitive_load: data.cognitive_load || 0,
      persuasion_elements: data.persuasion_elements || [],
      recommendations: data.recommendations || [],
      cached_at: new Date().toISOString(),
      cache_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }

    // Cache the result
    await this.cacheAnalysis(analysis)

    return analysis
  }

  /**
   * Get cached analysis
   */
  static async getCachedAnalysis(content: string): Promise<SynapseAnalysis | null> {
    try {
      const { data, error } = await supabase
        .from('synapse_analysis_cache')
        .select('*')
        .eq('content_hash', this.hashContent(content))
        .gt('cache_expires_at', new Date().toISOString())
        .single()

      if (error || !data) return null

      return data as SynapseAnalysis
    } catch {
      return null
    }
  }

  /**
   * Cache analysis result
   */
  static async cacheAnalysis(analysis: SynapseAnalysis): Promise<void> {
    try {
      await supabase.from('synapse_analysis_cache').insert({
        content_hash: this.hashContent(analysis.content),
        ...analysis,
      })
    } catch (error) {
      console.error('Failed to cache analysis:', error)
    }
  }

  /**
   * Simple content hashing
   */
  private static hashContent(content: string): string {
    // Simple hash for now - in production use a proper hash function
    return btoa(content.substring(0, 100))
  }

  /**
   * Score positioning statement
   */
  static async scorePositioningStatement(statement: string): Promise<{
    score: number
    strengths: string[]
    weaknesses: string[]
    suggestions: string[]
  }> {
    const analysis = await this.analyzeContent(statement, 'uvp')

    const strengths: string[] = []
    const weaknesses: string[] = []
    const suggestions: string[] = []

    // Analyze based on psychology score
    if (analysis.psychology_score > 70) {
      strengths.push('Strong psychological impact')
    } else if (analysis.psychology_score < 40) {
      weaknesses.push('Low psychological resonance')
      suggestions.push('Add emotional triggers or power words')
    }

    // Check power words
    if (analysis.power_words.length > 3) {
      strengths.push(`Uses ${analysis.power_words.length} power words effectively`)
    } else {
      weaknesses.push('Limited use of power words')
      suggestions.push('Incorporate more impactful language')
    }

    // Check cognitive load
    if (analysis.cognitive_load < 50) {
      strengths.push('Easy to understand')
    } else if (analysis.cognitive_load > 75) {
      weaknesses.push('High cognitive load - may confuse audience')
      suggestions.push('Simplify language and sentence structure')
    }

    return {
      score: analysis.psychology_score,
      strengths,
      weaknesses,
      suggestions,
    }
  }
}
