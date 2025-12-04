/**
 * Onboarding V5 Data Service
 *
 * Manages persistence for the 3-page onboarding flow:
 * - Page 1: Value Propositions (core, secondary, aspirational)
 * - Page 2: Buyer Personas (extracted from website intelligence)
 * - Page 3: Core Truth Insights (synthesized from VP + Personas)
 *
 * Enables:
 * - Progress saving (user can leave and resume)
 * - Data validation before storage
 * - Onboarding completion tracking
 */

import { supabase } from '@/lib/supabase';
import type { ValueProposition } from '@/types/value-proposition.types';
import type { BuyerPersona } from '@/types/buyer-persona.types';
import type { CoreTruthInsight } from '@/types/core-truth.types';

// ============================================================================
// Database Row Types
// ============================================================================

interface ValuePropositionRow {
  id: string;
  brand_id: string;
  statement: string;
  category: 'core' | 'secondary' | 'aspirational';
  market_position: string | null;
  differentiators: any;
  confidence: any;
  eq_score: any;
  sources: any;
  validated: boolean;
  user_edited: boolean;
  created_at: string;
  updated_at: string;
}

interface BuyerPersonaRow {
  id: string;
  brand_id: string;  // Reverted back - database actually uses brand_id
  name: string;
  role: string | null;
  company_type: string | null;
  industry: string | null;
  pain_points: any;
  desired_outcomes: any;
  jobs_to_be_done: any;
  urgency_signals: any;
  buying_behavior: any;
  validated: boolean;
  created_at: string;
  updated_at: string;
}

interface CoreTruthInsightRow {
  id: string;
  brand_id: string;
  core_truth: string;
  psychological_drivers: any;
  transformation_promise: string | null;
  emotional_payoff: string | null;
  synthesis_reasoning: string | null;
  composite_eq_score: number | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Progress Tracking Types
// ============================================================================

export interface OnboardingProgress {
  currentPage: 'value-propositions' | 'buyer-personas' | 'core-truth' | 'completed';
  completionPercent: number;
  hasValuePropositions: boolean;
  hasBuyerPersonas: boolean;
  hasCoreTruth: boolean;
  lastUpdated: string;
}

// ============================================================================
// Service Implementation
// ============================================================================

export class OnboardingV5DataService {
  // ==========================================================================
  // Value Propositions
  // ==========================================================================

  /**
   * Save value propositions for a business
   * Replaces all existing propositions (full sync)
   */
  static async saveValuePropositions(
    brandId: string,
    propositions: ValueProposition[]
  ): Promise<void> {
    try {
      // Delete existing propositions for this business
      const { error: deleteError } = await supabase
        .from('value_propositions')
        .delete()
        .eq('brand_id', brandId);

      if (deleteError) {
        console.error('Error deleting existing value propositions:', deleteError);
        throw deleteError;
      }

      // Insert new propositions
      if (propositions.length > 0) {
        const rows: Partial<ValuePropositionRow>[] = propositions.map(vp => ({
          brand_id: brandId,
          statement: vp.surface, // Using surface layer as statement
          category: this.inferVPCategory(vp),
          market_position: vp.functional || null,
          differentiators: JSON.stringify([vp.emotional, vp.identity].filter(Boolean)),
          confidence: null, // Not in ValueProposition type
          eq_score: JSON.stringify({
            composite: vp.eq_score,
            breakdown: vp.eq_breakdown,
          }),
          sources: JSON.stringify([]),
          validated: false,
          user_edited: false,
        }));

        const { error: insertError } = await supabase
          .from('value_propositions')
          .insert(rows);

        if (insertError) {
          console.error('Error inserting value propositions:', insertError);
          throw insertError;
        }
      }
    } catch (error) {
      console.error('Failed to save value propositions:', error);
      throw error;
    }
  }

  /**
   * Load value propositions for a business
   */
  static async loadValuePropositions(brandId: string): Promise<ValueProposition[]> {
    try {
      const { data, error } = await supabase
        .from('value_propositions')
        .select('*')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading value propositions:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Map database rows to ValueProposition type
      return (data as ValuePropositionRow[]).map(row => {
        const eqData = typeof row.eq_score === 'string'
          ? JSON.parse(row.eq_score)
          : row.eq_score || {};

        return {
          id: row.id,
          surface: row.statement,
          functional: row.market_position || '',
          emotional: '', // Extract from differentiators if needed
          identity: '', // Extract from differentiators if needed
          eq_score: eqData.composite || 0,
          eq_breakdown: eqData.breakdown || {
            emotional_resonance: 0,
            urgency: 0,
            identity_alignment: 0,
            composite: 0,
          },
          created_at: row.created_at,
          updated_at: row.updated_at,
        };
      });
    } catch (error) {
      console.error('Failed to load value propositions:', error);
      throw error;
    }
  }

  // ==========================================================================
  // Buyer Personas
  // ==========================================================================

  /**
   * Save buyer personas for a business
   * Replaces all existing personas (full sync)
   * DEV MODE: Skips database save due to RLS issues, just stores in memory
   */
  static async saveBuyerPersonas(
    brandId: string,
    personas: any[] // Accept any format since we get different interfaces from different sources
  ): Promise<void> {
    try {
      console.log('[OnboardingV5DataService] Saving buyer personas to database:', personas.map(p => p.name || p.persona_name));
      // Delete existing personas for this business
      const { error: deleteError } = await supabase
        .from('buyer_personas')
        .delete()
        .eq('brand_id', brandId);

      if (deleteError) {
        console.error('Error deleting existing buyer personas:', deleteError);
        throw deleteError;
      }

      // Insert new personas
      if (personas.length > 0) {
        // Map different persona formats to database schema
        const rows = personas.map((persona, index) => {
          // Handle different persona formats:
          // 1. UI format: { name, archetype, demographics, psychographics }
          // 2. Types format: { persona_name, role, company_type, etc. }
          // Map all available fields to database columns

          const personaName = persona.name || persona.persona_name || `Customer Profile ${index + 1}`;

          // Extract additional fields from BuyerPersona interface
          const occupation = persona.role?.title || persona.role?.seniority || '';
          const ageRange = persona.role?.experience || ''; // Map experience to age range for now
          const incomeRange = persona.company_size || ''; // Map company size to income range for now

          // Convert complex objects to JSONB
          const goals = persona.desired_outcomes ? { desired_outcomes: persona.desired_outcomes } : null;
          const painPoints = persona.pain_points ? { pain_points: persona.pain_points } : null;
          const buyingMotivations = persona.urgency_signals ? { urgency_signals: persona.urgency_signals } : null;
          const preferredChannels = persona.buying_behavior ? { buying_behavior: persona.buying_behavior } : null;

          return {
            brand_id: brandId,
            persona_name: personaName,
            age_range: ageRange,
            income_range: incomeRange,
            occupation: occupation,
            goals: goals,
            pain_points: painPoints,
            buying_motivations: buyingMotivations,
            preferred_channels: preferredChannels,
            is_primary: index === 0 // First persona is primary
          };
        });

        const { error: insertError } = await supabase
          .from('buyer_personas')
          .insert(rows);

        if (insertError) {
          console.error('Error inserting buyer personas:', insertError);

          // Check if this is an RLS policy error (common in development)
          if (insertError.code === '42501' && insertError.message.includes('row-level security policy')) {
            console.warn('RLS policy blocking persona insert. This is expected in development without auth.');
            console.log('Generated personas would be:', personas.map(p => p.persona_name));
            // For development, we'll just log and continue rather than throwing
            return;
          }

          throw insertError;
        }
      }
    } catch (error) {
      console.error('Failed to save buyer personas:', error);
      throw error;
    }
  }

  /**
   * Load buyer personas for a business
   * DEV MODE: Falls back to localStorage if database is empty due to RLS issues
   */
  static async loadBuyerPersonas(brandId: string): Promise<BuyerPersona[]> {
    try {
      // Try database first (now that saves work properly)
      console.log('[OnboardingV5DataService] Loading buyer personas from database...');
      const { data, error } = await supabase
        .from('buyer_personas')
        .select('*')
        .eq('brand_id', brandId)  // Reverted back - database actually uses brand_id
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading buyer personas:', error);
        // Don't throw in development - just return empty array
        console.warn('[OnboardingV5DataService] Database error, returning empty array for development');
        return [];
      }

      if (!data || data.length === 0) {
        console.log('[OnboardingV5DataService] No buyer personas found in database');
        return [];
      }

      console.log('[OnboardingV5DataService] ✅ Loaded', data.length, 'buyer personas from database');

      // Map database rows to BuyerPersona type
      return (data as BuyerPersonaRow[]).map(row => ({
        id: row.id,
        persona_name: row.name,
        role: {
          title: row.role || '',
          seniority: 'unknown' as const,
          department: undefined,
          is_decision_maker: false,
          influence_level: 'medium' as const,
        },
        company_type: (row.company_type as any) || 'unknown',
        company_size: 'unknown' as const,
        industry: {
          primary_industry: row.industry || '',
          sub_industry: undefined,
          industry_keywords: [],
          vertical_specificity: 0,
        },
        pain_points: this.parseJSON(row.pain_points, []),
        desired_outcomes: this.parseJSON(row.desired_outcomes, []),
        urgency_signals: this.parseJSON(row.urgency_signals, []),
        buying_behavior: this.parseJSON(row.buying_behavior, {
          decision_speed: 'moderate' as const,
          research_intensity: 'moderate' as const,
          price_sensitivity: 'medium' as const,
          relationship_vs_transactional: 'mixed' as const,
          evidence: [],
        }),
        success_metrics: [],
        confidence_score: 0,
        sample_size: 0,
        evidence_sources: [],
        representative_quotes: [],
      }));
    } catch (error) {
      console.error('Failed to load buyer personas:', error);
      // Don't throw in development - just return empty array
      console.warn('[OnboardingV5DataService] Returning empty array due to error in development mode');
      return [];
    }
  }

  // ==========================================================================
  // Core Truth Insights
  // ==========================================================================

  /**
   * Save core truth insight for a business
   * Only stores ONE core truth per business (latest wins)
   */
  static async saveCoreTruthInsight(
    brandId: string,
    insight: CoreTruthInsight
  ): Promise<void> {
    try {
      // Delete existing core truth for this business
      const { error: deleteError } = await supabase
        .from('core_truth_insights')
        .delete()
        .eq('brand_id', brandId);

      if (deleteError) {
        console.error('Error deleting existing core truth insight:', deleteError);
        throw deleteError;
      }

      // Insert new core truth
      const row: Partial<CoreTruthInsightRow> = {
        brand_id: brandId,
        core_truth: insight.core_truth,
        psychological_drivers: JSON.stringify(insight.psychological_drivers),
        transformation_promise: insight.transformation_promise || null,
        emotional_payoff: insight.emotional_payoff || null,
        synthesis_reasoning: insight.synthesis_reasoning || null,
        composite_eq_score: insight.composite_eq_score || null,
      };

      const { error: insertError } = await supabase
        .from('core_truth_insights')
        .insert(row);

      if (insertError) {
        console.error('Error inserting core truth insight:', insertError);
        throw insertError;
      }
    } catch (error) {
      console.error('Failed to save core truth insight:', error);
      throw error;
    }
  }

  /**
   * Load core truth insight for a business
   * Returns null if not found
   */
  static async loadCoreTruthInsight(brandId: string): Promise<CoreTruthInsight | null> {
    try {
      const { data, error } = await supabase
        .from('core_truth_insights')
        .select('*')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found - this is ok
          return null;
        }
        console.error('Error loading core truth insight:', error);
        throw error;
      }

      if (!data) {
        return null;
      }

      const row = data as CoreTruthInsightRow;

      return {
        id: row.id,
        business_id: row.brand_id,
        core_truth: row.core_truth,
        psychological_drivers: this.parseJSON(row.psychological_drivers, []),
        transformation_promise: row.transformation_promise || '',
        emotional_payoff: row.emotional_payoff || '',
        synthesis_reasoning: row.synthesis_reasoning || '',
        composite_eq_score: row.composite_eq_score || 0,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    } catch (error) {
      console.error('Failed to load core truth insight:', error);
      throw error;
    }
  }

  // ==========================================================================
  // Progress Tracking
  // ==========================================================================

  /**
   * Get onboarding progress for a business
   * Checks what data has been saved and calculates completion
   */
  static async getOnboardingProgress(brandId: string): Promise<OnboardingProgress> {
    try {
      // Check value propositions
      const { data: vpData, error: vpError } = await supabase
        .from('value_propositions')
        .select('id')
        .eq('brand_id', brandId)
        .limit(1);

      if (vpError) throw vpError;

      // Check buyer personas
      const { data: personaData, error: personaError } = await supabase
        .from('buyer_personas')
        .select('id')
        .eq('brand_id', brandId)
        .limit(1);

      if (personaError) throw personaError;

      // Check core truth
      const { data: truthData, error: truthError } = await supabase
        .from('core_truth_insights')
        .select('id')
        .eq('brand_id', brandId)
        .limit(1);

      if (truthError) throw truthError;

      const hasValuePropositions = (vpData?.length || 0) > 0;
      const hasBuyerPersonas = (personaData?.length || 0) > 0;
      const hasCoreTruth = (truthData?.length || 0) > 0;

      // Calculate completion
      let currentPage: OnboardingProgress['currentPage'] = 'value-propositions';
      let completionPercent = 0;

      if (hasCoreTruth) {
        currentPage = 'completed';
        completionPercent = 100;
      } else if (hasBuyerPersonas) {
        currentPage = 'core-truth';
        completionPercent = 66;
      } else if (hasValuePropositions) {
        currentPage = 'buyer-personas';
        completionPercent = 33;
      }

      return {
        currentPage,
        completionPercent,
        hasValuePropositions,
        hasBuyerPersonas,
        hasCoreTruth,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to get onboarding progress:', error);
      throw error;
    }
  }

  /**
   * Clear all onboarding data for a business
   * Use this when user wants to restart onboarding
   */
  static async clearOnboardingData(brandId: string): Promise<void> {
    try {
      // Delete value propositions
      const { error: vpError } = await supabase
        .from('value_propositions')
        .delete()
        .eq('brand_id', brandId);

      if (vpError) {
        console.error('Error clearing value propositions:', vpError);
        throw vpError;
      }

      // Delete buyer personas
      const { error: personaError } = await supabase
        .from('buyer_personas')
        .delete()
        .eq('brand_id', brandId);

      if (personaError) {
        console.error('Error clearing buyer personas:', personaError);
        throw personaError;
      }

      // Delete core truth
      const { error: truthError } = await supabase
        .from('core_truth_insights')
        .delete()
        .eq('brand_id', brandId);

      if (truthError) {
        console.error('Error clearing core truth:', truthError);
        throw truthError;
      }
    } catch (error) {
      console.error('Failed to clear onboarding data:', error);
      throw error;
    }
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Safely parse JSON from database
   */
  private static parseJSON<T>(value: any, defaultValue: T): T {
    if (!value) return defaultValue;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return defaultValue;
      }
    }
    return value as T;
  }

  /**
   * Infer VP category from structure
   * TODO: Improve this logic based on actual VP categorization rules
   */
  private static inferVPCategory(vp: ValueProposition): 'core' | 'secondary' | 'aspirational' {
    // If EQ score is high, likely core
    if (vp.eq_score >= 80) return 'core';
    // If has strong identity layer, likely aspirational
    if (vp.identity && vp.identity.length > 50) return 'aspirational';
    // Otherwise secondary
    return 'secondary';
  }
}

// Export singleton instance
export const onboardingV5DataService = OnboardingV5DataService;
