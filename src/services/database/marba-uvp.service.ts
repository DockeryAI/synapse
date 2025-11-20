/**
 * MARBA UVP Database Service
 *
 * Manages database operations for the Enhanced MARBA UVP Flow.
 * Persists the complete 6-step UVP data to the marba_uvps table.
 *
 * Features:
 * - Save complete UVP with all 6 components
 * - Retrieve UVP by brand ID
 * - Update individual UVP components
 * - Proper JSONB conversion for complex types
 * - Comprehensive error handling
 *
 * Created: 2025-11-18
 */

import { supabase } from '@/lib/supabase';
import type { CompleteUVP, CustomerProfile, TransformationGoal, UniqueSolution, KeyBenefit, ProductServiceData } from '@/types/uvp-flow.types';
import { getOrCreateTempBrand } from '@/services/onboarding/temp-brand.service';

// ============================================================================
// Database Row Types
// ============================================================================

interface MarbaUVPRow {
  id: string;
  brand_id: string;
  products_services: any;
  target_customer: any;
  transformation_goal: any;
  unique_solution: any;
  key_benefit: any;
  value_proposition_statement: string;
  why_statement: string | null;
  what_statement: string | null;
  how_statement: string | null;
  overall_confidence: number | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Service Implementation
// ============================================================================

/**
 * Save complete UVP to database
 *
 * @param uvp - Complete UVP data from all 6 steps
 * @param brandId - Brand ID to associate UVP with (optional for onboarding)
 * @returns Success status and UVP ID if successful
 */
export async function saveCompleteUVP(
  uvp: CompleteUVP,
  brandId?: string  // Made optional for onboarding
): Promise<{ success: boolean; uvpId?: string; sessionId?: string; error?: string }> {
  console.log('[MarbaUVPService] Saving complete UVP...');

  try {
    // Get or create temporary brand if no brandId provided
    let effectiveBrandId = brandId;

    if (!brandId) {
      console.log('[MarbaUVPService] No brand ID provided, creating temporary brand for onboarding');
      const tempBrandResult = await getOrCreateTempBrand();

      if (!tempBrandResult.success || !tempBrandResult.brandId) {
        return {
          success: false,
          error: tempBrandResult.error || 'Failed to create temporary brand'
        };
      }

      effectiveBrandId = tempBrandResult.brandId;
      console.log('[MarbaUVPService] Using temporary brand:', effectiveBrandId);
    }

    // Now we always have a brand_id to satisfy RLS policies
    if (!effectiveBrandId) {
      return {
        success: false,
        error: 'No brand ID available'
      };
    }

    if (!uvp.targetCustomer || !uvp.transformationGoal || !uvp.uniqueSolution || !uvp.keyBenefit) {
      return {
        success: false,
        error: 'All UVP components are required',
      };
    }

    // Prepare data for database insertion
    // Convert complex types to JSONB-compatible format
    const row: Partial<MarbaUVPRow> = {
      brand_id: effectiveBrandId,

      // Core components (as JSONB)
      target_customer: uvp.targetCustomer,
      transformation_goal: uvp.transformationGoal,
      unique_solution: uvp.uniqueSolution,
      key_benefit: uvp.keyBenefit,

      // Synthesized outputs
      value_proposition_statement: uvp.valuePropositionStatement,
      why_statement: uvp.whyStatement || null,
      what_statement: uvp.whatStatement || null,
      how_statement: uvp.howStatement || null,

      // Meta
      overall_confidence: typeof uvp.overallConfidence === 'number'
        ? uvp.overallConfidence
        : uvp.overallConfidence?.overall || 0,
    };

    // Check if UVP already exists for this brand (upsert logic)
    const { data: existingData, error: selectError } = await supabase
      .from('marba_uvps')
      .select('id')
      .eq('brand_id', effectiveBrandId)
      .maybeSingle();

    if (selectError) {
      console.error('[MarbaUVPService] Error checking existing UVP:', selectError);
      return {
        success: false,
        error: `Database error: ${selectError.message}`,
      };
    }

    let uvpId: string;

    if (existingData) {
      // Update existing record
      console.log('[MarbaUVPService] Updating existing UVP:', existingData.id);
      console.log('[MarbaUVPService] Update data:', JSON.stringify(row, null, 2));

      const { data: updateData, error: updateError } = await supabase
        .from('marba_uvps')
        .update(row)
        .eq('id', existingData.id)
        .select('id')
        .single();

      if (updateError) {
        console.error('[MarbaUVPService] Update error:', updateError);
        console.error('[MarbaUVPService] Error details:', JSON.stringify(updateError, null, 2));
        return {
          success: false,
          error: `Failed to update UVP: ${updateError.message}${updateError.details ? ` (${updateError.details})` : ''}${updateError.hint ? ` Hint: ${updateError.hint}` : ''}`,
        };
      }

      uvpId = updateData.id;
    } else {
      // Insert new record
      console.log('[MarbaUVPService] Inserting new UVP');
      console.log('[MarbaUVPService] Insert data:', JSON.stringify(row, null, 2));

      const { data: insertData, error: insertError } = await supabase
        .from('marba_uvps')
        .insert(row)
        .select('id')
        .single();

      if (insertError) {
        console.error('[MarbaUVPService] Insert error:', insertError);
        console.error('[MarbaUVPService] Error details:', JSON.stringify(insertError, null, 2));
        return {
          success: false,
          error: `Failed to save UVP: ${insertError.message}${insertError.details ? ` (${insertError.details})` : ''}${insertError.hint ? ` Hint: ${insertError.hint}` : ''}`,
        };
      }

      uvpId = insertData.id;
    }

    console.log('[MarbaUVPService] UVP saved successfully:', uvpId);
    return {
      success: true,
      uvpId,
    };

  } catch (error) {
    console.error('[MarbaUVPService] Unexpected error saving UVP:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get UVP by brand ID
 *
 * @param brandId - Brand ID to retrieve UVP for
 * @returns Complete UVP data or null if not found
 */
export async function getUVPByBrand(brandId: string): Promise<CompleteUVP | null> {
  console.log('[MarbaUVPService] Retrieving UVP for brand:', brandId);

  try {
    const { data, error } = await supabase
      .from('marba_uvps')
      .select('*')
      .eq('brand_id', brandId)
      .maybeSingle();

    if (error) {
      console.error('[MarbaUVPService] Error retrieving UVP:', error);
      throw error;
    }

    if (!data) {
      console.log('[MarbaUVPService] No UVP found for brand:', brandId);
      return null;
    }

    const row = data as MarbaUVPRow;

    // Convert database row back to CompleteUVP type
    const uvp: CompleteUVP = {
      id: row.id,
      targetCustomer: parseJSON(row.target_customer, {} as CustomerProfile),
      transformationGoal: parseJSON(row.transformation_goal, {} as TransformationGoal),
      uniqueSolution: parseJSON(row.unique_solution, {} as UniqueSolution),
      keyBenefit: parseJSON(row.key_benefit, {} as KeyBenefit),
      valuePropositionStatement: row.value_proposition_statement,
      whyStatement: row.why_statement || '',
      whatStatement: row.what_statement || '',
      howStatement: row.how_statement || '',
      overallConfidence: {
        overall: row.overall_confidence || 0,
        dataQuality: row.overall_confidence || 0,
        sourceCount: 1,
        modelAgreement: row.overall_confidence || 0,
      },
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };

    console.log('[MarbaUVPService] UVP retrieved successfully:', row.id);
    return uvp;

  } catch (error) {
    console.error('[MarbaUVPService] Failed to retrieve UVP:', error);
    throw error;
  }
}

/**
 * Update a specific UVP component
 *
 * @param uvpId - UVP ID to update
 * @param component - Component to update (customer, transformation, solution, benefit)
 * @param data - New data for the component
 * @returns Success status
 */
export async function updateUVPComponent(
  uvpId: string,
  component: 'customer' | 'transformation' | 'solution' | 'benefit',
  data: CustomerProfile | TransformationGoal | UniqueSolution | KeyBenefit
): Promise<{ success: boolean; error?: string }> {
  console.log('[MarbaUVPService] Updating component:', component, 'for UVP:', uvpId);

  try {
    // Map component name to database column
    const columnMap = {
      customer: 'target_customer',
      transformation: 'transformation_goal',
      solution: 'unique_solution',
      benefit: 'key_benefit',
    };

    const column = columnMap[component];

    const { error } = await supabase
      .from('marba_uvps')
      .update({ [column]: data })
      .eq('id', uvpId);

    if (error) {
      console.error('[MarbaUVPService] Update component error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log('[MarbaUVPService] Component updated successfully');
    return { success: true };

  } catch (error) {
    console.error('[MarbaUVPService] Failed to update component:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Safely parse JSON from database
 */
function parseJSON<T>(value: any, defaultValue: T): T {
  if (!value) return defaultValue;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return defaultValue;
    }
  }
  // Already parsed by Supabase
  return value as T;
}
