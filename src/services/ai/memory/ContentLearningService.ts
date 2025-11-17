/**
 * Content Learning Service
 *
 * Tracks high-performing content and identifies successful patterns.
 * "Posts about X get 3x engagement" - learns what works for each business.
 */

import { supabase } from '../../../lib/supabase';
import type {
  ContentPattern,
  ContentPerformanceData,
  PatternDiscoveryResult,
  AILearning,
  AIContentPatternRow,
  AILearningRow,
} from '../../../types/ai-memory.types';

export class ContentLearningService {
  /**
   * Track content performance
   * Call this when you have performance data for a post
   */
  static async trackContentPerformance(data: ContentPerformanceData): Promise<void> {
    // Store or update performance data
    // This would typically go in a separate table like 'content_performance'
    // For now, we'll use it to discover patterns

    if (data.is_high_performing) {
      await this.discoverPatterns(data.user_id);
    }
  }

  /**
   * Discover patterns from high-performing content
   */
  static async discoverPatterns(userId: string): Promise<PatternDiscoveryResult[]> {
    // In a real implementation, this would:
    // 1. Fetch all high-performing content for user
    // 2. Analyze for patterns (topics, formats, hooks, CTAs)
    // 3. Calculate confidence scores based on sample size
    // 4. Store or update patterns in database

    const results: PatternDiscoveryResult[] = [];

    // Example: Discover topic patterns
    // This is a simplified version - real implementation would use NLP/clustering
    const topicPatterns = await this.discoverTopicPatterns(userId);
    results.push(...topicPatterns);

    // Discover format patterns (video, image, carousel)
    const formatPatterns = await this.discoverFormatPatterns(userId);
    results.push(...formatPatterns);

    // Discover hook patterns
    const hookPatterns = await this.discoverHookPatterns(userId);
    results.push(...hookPatterns);

    return results;
  }

  /**
   * Get all active patterns for user
   */
  static async getPatterns(
    userId: string,
    options?: {
      pattern_type?: ContentPattern['pattern_type'];
      campaign_type?: string;
      platform?: string;
      min_confidence?: number;
    }
  ): Promise<ContentPattern[]> {
    let query = supabase
      .from('ai_content_patterns')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (options?.pattern_type) {
      query = query.eq('pattern_type', options.pattern_type);
    }

    if (options?.campaign_type) {
      query = query.eq('campaign_type', options.campaign_type);
    }

    if (options?.platform) {
      query = query.eq('platform', options.platform);
    }

    if (options?.min_confidence !== undefined) {
      query = query.gte('confidence_score', options.min_confidence);
    }

    const { data, error } = await query.order('confidence_score', { ascending: false });

    if (error) {
      console.error('Error fetching patterns:', error);
      throw error;
    }

    return (data as AIContentPatternRow[]).map(this.mapRowToPattern);
  }

  /**
   * Get top patterns by type
   */
  static async getTopPatterns(
    userId: string,
    patternType: ContentPattern['pattern_type'],
    limit: number = 5
  ): Promise<ContentPattern[]> {
    const { data, error } = await supabase
      .from('ai_content_patterns')
      .select('*')
      .eq('user_id', userId)
      .eq('pattern_type', patternType)
      .eq('is_active', true)
      .order('confidence_score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching top patterns:', error);
      throw error;
    }

    return (data as AIContentPatternRow[]).map(this.mapRowToPattern);
  }

  /**
   * Get patterns for AI injection
   */
  static async getPatternsForAI(userId: string): Promise<{
    topics: string[];
    formats: string[];
    hooks: string[];
    ctas: string[];
  }> {
    const topicPatterns = await this.getTopPatterns(userId, 'topic', 5);
    const formatPatterns = await this.getTopPatterns(userId, 'format', 3);
    const hookPatterns = await this.getTopPatterns(userId, 'hook', 5);
    const ctaPatterns = await this.getTopPatterns(userId, 'cta', 3);

    return {
      topics: topicPatterns.map((p) => p.pattern_value),
      formats: formatPatterns.map((p) => p.pattern_value),
      hooks: hookPatterns.map((p) => p.pattern_value),
      ctas: ctaPatterns.map((p) => p.pattern_value),
    };
  }

  /**
   * Store a discovered pattern
   */
  static async storePattern(
    userId: string,
    patternData: Omit<ContentPattern, 'id' | 'discovered_at' | 'last_validated_at'>
  ): Promise<ContentPattern> {
    const payload: any = {
      user_id: userId,
      pattern_type: patternData.pattern_type,
      pattern_value: patternData.pattern_value,
      campaign_type: patternData.campaign_type,
      platform: patternData.platform,
      avg_engagement_rate: patternData.performance_metrics.avg_engagement_rate,
      avg_reach: patternData.performance_metrics.avg_reach,
      sample_size: patternData.performance_metrics.sample_size,
      confidence_score: patternData.performance_metrics.confidence_score,
      examples: patternData.examples,
      discovered_at: new Date().toISOString(),
      last_validated_at: new Date().toISOString(),
      is_active: patternData.is_active,
    };

    const { data, error } = await supabase
      .from('ai_content_patterns')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Error storing pattern:', error);
      throw error;
    }

    return this.mapRowToPattern(data as AIContentPatternRow);
  }

  /**
   * Update pattern performance
   */
  static async updatePatternPerformance(
    patternId: string,
    newMetrics: {
      avg_engagement_rate?: number;
      avg_reach?: number;
      sample_size?: number;
      confidence_score?: number;
    }
  ): Promise<void> {
    const updates: any = {
      last_validated_at: new Date().toISOString(),
    };

    if (newMetrics.avg_engagement_rate !== undefined) {
      updates.avg_engagement_rate = newMetrics.avg_engagement_rate;
    }
    if (newMetrics.avg_reach !== undefined) {
      updates.avg_reach = newMetrics.avg_reach;
    }
    if (newMetrics.sample_size !== undefined) {
      updates.sample_size = newMetrics.sample_size;
    }
    if (newMetrics.confidence_score !== undefined) {
      updates.confidence_score = newMetrics.confidence_score;
    }

    const { error } = await supabase
      .from('ai_content_patterns')
      .update(updates)
      .eq('id', patternId);

    if (error) {
      console.error('Error updating pattern:', error);
      throw error;
    }
  }

  /**
   * Deactivate pattern (if it stops working)
   */
  static async deactivatePattern(patternId: string): Promise<void> {
    const { error } = await supabase
      .from('ai_content_patterns')
      .update({ is_active: false })
      .eq('id', patternId);

    if (error) {
      console.error('Error deactivating pattern:', error);
      throw error;
    }
  }

  /**
   * Get learnings (insights) for user
   */
  static async getLearnings(userId: string, limit: number = 10): Promise<AILearning[]> {
    const { data, error } = await supabase
      .from('ai_learnings')
      .select('*')
      .eq('user_id', userId)
      .eq('is_dismissed', false)
      .order('confidence', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching learnings:', error);
      throw error;
    }

    return (data as AILearningRow[]).map(this.mapRowToLearning);
  }

  /**
   * Store a learning/insight
   */
  static async storeLearning(
    userId: string,
    category: AILearning['learning_category'],
    insight: string,
    dataPoints: number,
    confidence: number,
    recommendation?: string
  ): Promise<AILearning> {
    const payload: any = {
      user_id: userId,
      learning_category: category,
      insight,
      data_points: dataPoints,
      confidence,
      recommendation,
      created_at: new Date().toISOString(),
      is_dismissed: false,
    };

    const { data, error } = await supabase
      .from('ai_learnings')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Error storing learning:', error);
      throw error;
    }

    return this.mapRowToLearning(data as AILearningRow);
  }

  /**
   * Dismiss a learning
   */
  static async dismissLearning(learningId: string): Promise<void> {
    const { error } = await supabase
      .from('ai_learnings')
      .update({ is_dismissed: true })
      .eq('id', learningId);

    if (error) {
      console.error('Error dismissing learning:', error);
      throw error;
    }
  }

  /**
   * Get learnings for AI injection
   */
  static async getLearningsForAI(
    userId: string,
    limit: number = 5
  ): Promise<Array<{ insight: string; recommendation?: string }>> {
    const learnings = await this.getLearnings(userId, limit);
    return learnings.map((l) => ({
      insight: l.insight,
      recommendation: l.recommendation,
    }));
  }

  /**
   * Discover topic patterns (simplified)
   * Real implementation would use NLP to cluster topics
   */
  private static async discoverTopicPatterns(userId: string): Promise<PatternDiscoveryResult[]> {
    // Placeholder: In real implementation, would analyze content topics
    // and identify which topics perform best
    return [];
  }

  /**
   * Discover format patterns (video, image, carousel)
   */
  private static async discoverFormatPatterns(userId: string): Promise<PatternDiscoveryResult[]> {
    // Placeholder: Would analyze performance by content type
    return [];
  }

  /**
   * Discover hook patterns (question hooks, bold statements, etc.)
   */
  private static async discoverHookPatterns(userId: string): Promise<PatternDiscoveryResult[]> {
    // Placeholder: Would analyze first lines of high-performing posts
    return [];
  }

  /**
   * Calculate confidence score based on sample size and consistency
   */
  private static calculateConfidence(sampleSize: number, variance: number): number {
    // Simple confidence formula
    // More samples = higher confidence
    // Lower variance = higher confidence

    const sampleScore = Math.min(sampleSize / 10, 1); // Caps at 10 samples
    const varianceScore = Math.max(0, 1 - variance);

    return (sampleScore + varianceScore) / 2;
  }

  /**
   * Helper: Map database row to ContentPattern
   */
  private static mapRowToPattern(row: AIContentPatternRow): ContentPattern {
    return {
      id: row.id,
      user_id: row.user_id,
      pattern_type: row.pattern_type as ContentPattern['pattern_type'],
      pattern_value: row.pattern_value,
      campaign_type: row.campaign_type,
      platform: row.platform,
      performance_metrics: {
        avg_engagement_rate: row.avg_engagement_rate,
        avg_reach: row.avg_reach,
        sample_size: row.sample_size,
        confidence_score: row.confidence_score,
      },
      examples: row.examples || [],
      discovered_at: new Date(row.discovered_at),
      last_validated_at: new Date(row.last_validated_at),
      is_active: row.is_active,
    };
  }

  /**
   * Helper: Map database row to AILearning
   */
  private static mapRowToLearning(row: AILearningRow): AILearning {
    return {
      id: row.id,
      user_id: row.user_id,
      learning_category: row.learning_category as AILearning['learning_category'],
      insight: row.insight,
      data_points: row.data_points,
      confidence: row.confidence,
      recommendation: row.recommendation,
      created_at: new Date(row.created_at),
      is_dismissed: row.is_dismissed,
    };
  }
}
