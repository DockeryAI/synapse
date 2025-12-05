// PRD Feature: SYNAPSE-V6
/**
 * Outcome Persistence Service
 *
 * Manages persistence of detected customer outcomes to database.
 * Integrates with UVP completion flow to save outcomes when UVP is finalized.
 *
 * Features:
 * - Save detected outcomes to customer_outcomes table
 * - Load outcomes for existing sessions
 * - Update outcome-signal mappings when API data arrives
 * - Maintain RLS compliance through proper foreign key relationships
 *
 * Integration Points:
 * - Called from saveCompleteUVP() when UVP is completed
 * - Called from dashboard when loading existing UVP context
 * - Updates when API signals are discovered
 */

import { supabase } from '@/lib/supabase';
import {
  outcomeDetectionService,
  type DetectedOutcome,
  type OutcomeDifferentiatorMapping,
  type OutcomeDetectionResult,
} from './outcome-detection.service';
import type { CompleteUVP } from '@/types/uvp-flow.types';
import type { IndustryBooster } from './industry-booster.service';

// ============================================================================
// Types
// ============================================================================

/**
 * Outcome category mapping (matches database enum)
 */
type OutcomeCategory =
  | 'efficiency'
  | 'revenue'
  | 'compliance'
  | 'cost_reduction'
  | 'risk_mitigation'
  | 'growth'
  | 'quality'
  | 'speed';

/**
 * Database row for customer_outcomes table
 */
interface CustomerOutcomeRow {
  id?: string;
  uvp_session_id: string;
  outcome_statement: string;
  outcome_category: OutcomeCategory;
  priority_score: number;
  matched_differentiator?: string;
  differentiator_strength?: number;
  supporting_evidence?: string[];
  industry_profile?: string;
  urgency_triggers?: string[];
  seasonal_patterns?: any;
  primary_keywords?: string[];
  outcome_queries?: string[];
}

/**
 * Database row for outcome_signal_mapping table
 */
interface OutcomeSignalMappingRow {
  id?: string;
  customer_outcome_id: string;
  api_source: 'serper' | 'reddit' | 'reviews' | 'forums' | 'social' | 'news' | 'competitor';
  query_used: string;
  signal_strength: number;
  conversation_themes?: string[];
  buying_signals?: string[];
  competitor_mentions?: string[];
  raw_response?: any;
}

/**
 * Result from saving outcomes
 */
export interface OutcomeSaveResult {
  success: boolean;
  outcomeIds?: string[];
  error?: string;
  count?: number;
}

/**
 * Result from loading outcomes
 */
export interface OutcomeLoadResult {
  success: boolean;
  outcomes?: DetectedOutcome[];
  mappings?: OutcomeDifferentiatorMapping[];
  error?: string;
}

// ============================================================================
// Service Implementation
// ============================================================================

export class OutcomePersistenceService {
  /**
   * Save detected outcomes to database
   * Called when UVP is completed or updated
   */
  async saveOutcomesToSession(
    uvpSessionId: string,
    uvp: CompleteUVP,
    industryBooster?: IndustryBooster
  ): Promise<OutcomeSaveResult> {
    try {
      // Detect outcomes from UVP
      const detectionResult = outcomeDetectionService.detectOutcomes(uvp, industryBooster);

      if (detectionResult.outcomes.length === 0) {
        return {
          success: true,
          outcomeIds: [],
          count: 0,
        };
      }

      // Convert detected outcomes to database rows
      const outcomeRows: CustomerOutcomeRow[] = detectionResult.outcomes.map((outcome) =>
        this.mapOutcomeToRow(outcome, uvpSessionId, detectionResult, uvp)
      );

      // Upsert outcomes (idempotent - can be called multiple times)
      const { data, error } = await supabase
        .from('customer_outcomes')
        .upsert(outcomeRows, {
          onConflict: 'uvp_session_id,outcome_statement',
          ignoreDuplicates: false,
        })
        .select('id');

      if (error) {
        console.error('[OutcomePersistence] Failed to save outcomes:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      const outcomeIds = data?.map((row) => row.id) || [];

      return {
        success: true,
        outcomeIds,
        count: outcomeIds.length,
      };
    } catch (error) {
      console.error('[OutcomePersistence] Unexpected error saving outcomes:', error);
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Load outcomes for an existing UVP session
   * Used when rebuilding context from database
   */
  async loadOutcomesForSession(uvpSessionId: string): Promise<OutcomeLoadResult> {
    try {
      const { data, error } = await supabase
        .from('customer_outcomes')
        .select('*')
        .eq('uvp_session_id', uvpSessionId)
        .order('priority_score', { ascending: false });

      if (error) {
        console.error('[OutcomePersistence] Failed to load outcomes:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      if (!data || data.length === 0) {
        return {
          success: true,
          outcomes: [],
          mappings: [],
        };
      }

      // Convert database rows back to DetectedOutcome objects
      const outcomes = data.map((row) => this.mapRowToOutcome(row));

      return {
        success: true,
        outcomes,
        mappings: [],
      };
    } catch (error) {
      console.error('[OutcomePersistence] Unexpected error loading outcomes:', error);
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Update outcome-signal mapping when API data is discovered
   * Tracks which API queries successfully found signals for which outcomes
   */
  async updateOutcomeSignalMapping(
    outcomeId: string,
    apiSource: OutcomeSignalMappingRow['api_source'],
    queryUsed: string,
    signalStrength: number,
    apiData: {
      conversationThemes?: string[];
      buyingSignals?: string[];
      competitorMentions?: string[];
      rawResponse?: any;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const mappingRow: OutcomeSignalMappingRow = {
        customer_outcome_id: outcomeId,
        api_source: apiSource,
        query_used: queryUsed,
        signal_strength: signalStrength,
        conversation_themes: apiData.conversationThemes,
        buying_signals: apiData.buyingSignals,
        competitor_mentions: apiData.competitorMentions,
        raw_response: apiData.rawResponse,
      };

      const { error } = await supabase.from('outcome_signal_mapping').insert(mappingRow);

      if (error) {
        console.error('[OutcomePersistence] Failed to save signal mapping:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return { success: true };
    } catch (error) {
      console.error('[OutcomePersistence] Unexpected error saving signal mapping:', error);
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Delete outcomes for a session (cleanup)
   */
  async deleteOutcomesForSession(uvpSessionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('customer_outcomes')
        .delete()
        .eq('uvp_session_id', uvpSessionId);

      if (error) {
        console.error('[OutcomePersistence] Failed to delete outcomes:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return { success: true };
    } catch (error) {
      console.error('[OutcomePersistence] Unexpected error deleting outcomes:', error);
      return {
        success: false,
        error: String(error),
      };
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Map DetectedOutcome to database row
   */
  private mapOutcomeToRow(
    outcome: DetectedOutcome,
    uvpSessionId: string,
    detectionResult: OutcomeDetectionResult,
    uvp: CompleteUVP
  ): CustomerOutcomeRow {
    // Determine outcome category from statement
    const category = this.inferOutcomeCategory(outcome);

    // Find matching differentiator mapping
    const mapping = detectionResult.mappings.find((m) => m.outcomeId === outcome.id);

    // Generate keywords from outcome statement
    const keywords = this.extractKeywords(outcome.statement);

    // Generate outcome-specific queries for API discovery
    const queries = this.generateOutcomeQueries(outcome, uvp);

    return {
      uvp_session_id: uvpSessionId,
      outcome_statement: outcome.statement,
      outcome_category: category,
      priority_score: outcome.impactScore, // Use impact score as priority
      matched_differentiator: mapping ? this.findDifferentiatorStatement(uvp, mapping.differentiatorId) : undefined,
      differentiator_strength: mapping?.strengthScore,
      supporting_evidence: mapping ? [mapping.reasoning] : undefined,
      industry_profile: uvp.targetCustomer?.industry,
      urgency_triggers: detectionResult.industryContext?.urgencyTriggers,
      seasonal_patterns: detectionResult.industryContext?.seasonalPatterns
        ? { patterns: detectionResult.industryContext.seasonalPatterns }
        : undefined,
      primary_keywords: keywords,
      outcome_queries: queries,
    };
  }

  /**
   * Map database row back to DetectedOutcome
   */
  private mapRowToOutcome(row: any): DetectedOutcome {
    return {
      id: row.id,
      statement: row.outcome_statement,
      type: this.inferOutcomeType(row.outcome_category),
      source: 'customer_profile',
      urgencyScore: row.urgency_triggers?.length ? 70 : 50,
      impactScore: row.priority_score,
      confidence: 75,
    };
  }

  /**
   * Infer outcome category from outcome statement
   */
  private inferOutcomeCategory(outcome: DetectedOutcome): OutcomeCategory {
    const statement = outcome.statement.toLowerCase();

    // Revenue-related
    if (
      statement.includes('revenue') ||
      statement.includes('sales') ||
      statement.includes('profit') ||
      statement.includes('income')
    ) {
      return 'revenue';
    }

    // Cost reduction
    if (
      statement.includes('cost') ||
      statement.includes('save') ||
      statement.includes('reduce expense') ||
      statement.includes('budget')
    ) {
      return 'cost_reduction';
    }

    // Efficiency
    if (
      statement.includes('faster') ||
      statement.includes('efficient') ||
      statement.includes('automate') ||
      statement.includes('streamline')
    ) {
      return 'efficiency';
    }

    // Speed
    if (
      statement.includes('speed') ||
      statement.includes('quick') ||
      statement.includes('time to market') ||
      statement.includes('accelerate')
    ) {
      return 'speed';
    }

    // Compliance
    if (
      statement.includes('compliance') ||
      statement.includes('regulatory') ||
      statement.includes('audit') ||
      statement.includes('standard')
    ) {
      return 'compliance';
    }

    // Risk mitigation
    if (
      statement.includes('risk') ||
      statement.includes('security') ||
      statement.includes('protect') ||
      statement.includes('safe')
    ) {
      return 'risk_mitigation';
    }

    // Growth
    if (
      statement.includes('growth') ||
      statement.includes('scale') ||
      statement.includes('expand') ||
      statement.includes('market share')
    ) {
      return 'growth';
    }

    // Quality
    if (
      statement.includes('quality') ||
      statement.includes('improve') ||
      statement.includes('better') ||
      statement.includes('enhance')
    ) {
      return 'quality';
    }

    // Default to efficiency
    return 'efficiency';
  }

  /**
   * Infer outcome type from category (for reconstruction)
   */
  private inferOutcomeType(category: OutcomeCategory): DetectedOutcome['type'] {
    if (category === 'revenue' || category === 'growth') {
      return 'transformation';
    }
    if (category === 'efficiency' || category === 'speed' || category === 'cost_reduction') {
      return 'functional';
    }
    return 'emotional';
  }

  /**
   * Find differentiator statement by ID
   */
  private findDifferentiatorStatement(uvp: CompleteUVP, differentiatorId: string): string | undefined {
    const diff = uvp.uniqueSolution?.differentiators?.find((d) => d.id === differentiatorId);
    return diff?.statement;
  }

  /**
   * Extract keywords from outcome statement
   */
  private extractKeywords(statement: string): string[] {
    const stopWords = new Set([
      'a',
      'an',
      'and',
      'are',
      'as',
      'at',
      'be',
      'by',
      'for',
      'from',
      'has',
      'he',
      'in',
      'is',
      'it',
      'its',
      'of',
      'on',
      'that',
      'the',
      'to',
      'was',
      'will',
      'with',
    ]);

    return statement
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 3 && !stopWords.has(word))
      .slice(0, 5);
  }

  /**
   * Generate API queries for outcome discovery
   */
  private generateOutcomeQueries(outcome: DetectedOutcome, uvp: CompleteUVP): string[] {
    const queries: string[] = [];
    const industry = uvp.targetCustomer?.industry || '';
    const statement = outcome.statement;

    // Primary query: outcome + industry
    if (industry) {
      queries.push(`${statement} ${industry}`);
    }

    // Secondary query: outcome + pain point
    if (uvp.transformationGoal?.before) {
      queries.push(`${statement} ${uvp.transformationGoal.before}`);
    }

    // Tertiary query: just the outcome
    queries.push(statement);

    return queries.slice(0, 3);
  }
}

// Export singleton instance
export const outcomePersistenceService = new OutcomePersistenceService();
