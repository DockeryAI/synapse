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
import { contentSynthesisOrchestrator } from '@/services/intelligence/content-synthesis-orchestrator.service';
import { intelligenceCache } from '@/services/intelligence/intelligence-cache.service';
import { websiteAnalyzer } from '@/services/intelligence/website-analyzer.service';

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
  // brand_voice and customer_stories removed - not in current schema
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
  console.log('[MarbaUVPService] 🔍 DEBUG - uvp.productsServices:', {
    hasProductsServices: !!uvp.productsServices,
    categoriesCount: uvp.productsServices?.categories?.length || 0,
    firstProductName: uvp.productsServices?.categories?.[0]?.items?.[0]?.name || 'none'
  });

  try {
    // If no brandId, save to localStorage for onboarding
    if (!brandId) {
      console.log('[MarbaUVPService] No brand ID - saving to localStorage for onboarding');

      // Save to localStorage
      const sessionId = localStorage.getItem('marba_session_id') || crypto.randomUUID();
      localStorage.setItem('marba_session_id', sessionId);
      localStorage.setItem(`marba_uvp_${sessionId}`, JSON.stringify(uvp));
      localStorage.setItem('marba_uvp_pending', 'true');

      console.log('[MarbaUVPService] Saved to localStorage with session:', sessionId);

      return {
        success: true,
        sessionId,
        error: undefined
      };
    }

    // If we have a brandId, save to database normally
    const effectiveBrandId = brandId;

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
      products_services: uvp.productsServices || null, // Products/services confirmed during onboarding
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

      // NOTE: brand_voice and customer_stories columns removed - not in current schema
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

    // V3 FIX: Invalidate caches when UVP is saved
    // This ensures next insight generation uses fresh UVP data
    try {
      contentSynthesisOrchestrator.clearAllCaches();
      await intelligenceCache.invalidateByBrand(effectiveBrandId);
      console.log('[MarbaUVPService] Caches invalidated after UVP save');
    } catch (cacheError) {
      console.warn('[MarbaUVPService] Cache invalidation failed (non-fatal):', cacheError);
    }

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
      productsServices: parseJSON(row.products_services, undefined),
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
      // Brand voice and customer stories (may be null if not yet scanned)
      brandVoice: parseJSON(row.brand_voice, undefined),
      customerStories: parseJSON(row.customer_stories, undefined),
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

/**
 * Recover/update UVP drivers from session data
 *
 * Looks for customer_data in uvp_sessions that has emotionalDrivers/functionalDrivers
 * and updates the existing marba_uvps record with these drivers if missing.
 *
 * @param brandId - Brand ID to recover drivers for
 * @returns Success status and whether drivers were found/updated
 */
export async function recoverDriversFromSession(brandId: string): Promise<{
  success: boolean;
  updated: boolean;
  emotionalDriversCount: number;
  functionalDriversCount: number;
  error?: string;
}> {
  console.log('[MarbaUVPService] Attempting to recover drivers from session for brand:', brandId);

  try {
    // First check if UVP exists and if it already has drivers
    const existingUVP = await getUVPByBrand(brandId);
    if (!existingUVP) {
      console.log('[MarbaUVPService] No UVP found for brand');
      return { success: true, updated: false, emotionalDriversCount: 0, functionalDriversCount: 0 };
    }

    // Check if drivers already exist in UVP
    const hasEmotionalDrivers = (existingUVP.targetCustomer?.emotionalDrivers?.length || 0) > 0 ||
                                  (existingUVP.transformationGoal?.emotionalDrivers?.length || 0) > 0;
    const hasFunctionalDrivers = (existingUVP.targetCustomer?.functionalDrivers?.length || 0) > 0 ||
                                   (existingUVP.transformationGoal?.functionalDrivers?.length || 0) > 0;

    if (hasEmotionalDrivers && hasFunctionalDrivers) {
      console.log('[MarbaUVPService] UVP already has drivers, no recovery needed');
      return {
        success: true,
        updated: false,
        emotionalDriversCount: existingUVP.transformationGoal?.emotionalDrivers?.length || 0,
        functionalDriversCount: existingUVP.transformationGoal?.functionalDrivers?.length || 0
      };
    }

    // Look for customer_data in uvp_sessions that has drivers
    const { data: sessions, error: sessionError } = await supabase
      .from('uvp_sessions')
      .select('id, customer_data, transformation_data, complete_uvp')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (sessionError) {
      console.error('[MarbaUVPService] Error querying sessions:', sessionError);
      return { success: false, updated: false, emotionalDriversCount: 0, functionalDriversCount: 0, error: sessionError.message };
    }

    if (!sessions || sessions.length === 0) {
      console.log('[MarbaUVPService] No sessions found for brand');
      return { success: true, updated: false, emotionalDriversCount: 0, functionalDriversCount: 0 };
    }

    // Try to find drivers from various session sources
    let emotionalDrivers: string[] = [];
    let functionalDrivers: string[] = [];

    for (const session of sessions) {
      // Check complete_uvp first (most complete source)
      const completeUvp = session.complete_uvp as any;
      if (completeUvp?.transformationGoal?.emotionalDrivers?.length > 0) {
        emotionalDrivers = completeUvp.transformationGoal.emotionalDrivers;
      }
      if (completeUvp?.transformationGoal?.functionalDrivers?.length > 0) {
        functionalDrivers = completeUvp.transformationGoal.functionalDrivers;
      }
      if (completeUvp?.targetCustomer?.emotionalDrivers?.length > 0 && emotionalDrivers.length === 0) {
        emotionalDrivers = completeUvp.targetCustomer.emotionalDrivers;
      }
      if (completeUvp?.targetCustomer?.functionalDrivers?.length > 0 && functionalDrivers.length === 0) {
        functionalDrivers = completeUvp.targetCustomer.functionalDrivers;
      }

      // Check customer_data
      const customerData = session.customer_data as any;
      if (customerData?.selected?.emotionalDrivers?.length > 0 && emotionalDrivers.length === 0) {
        emotionalDrivers = customerData.selected.emotionalDrivers;
      }
      if (customerData?.selected?.functionalDrivers?.length > 0 && functionalDrivers.length === 0) {
        functionalDrivers = customerData.selected.functionalDrivers;
      }

      // Check suggestions in customer_data
      if (customerData?.suggestions?.length > 0 && (emotionalDrivers.length === 0 || functionalDrivers.length === 0)) {
        for (const suggestion of customerData.suggestions) {
          if (suggestion.emotionalDrivers?.length > 0 && emotionalDrivers.length === 0) {
            emotionalDrivers = suggestion.emotionalDrivers;
          }
          if (suggestion.functionalDrivers?.length > 0 && functionalDrivers.length === 0) {
            functionalDrivers = suggestion.functionalDrivers;
          }
        }
      }

      // Check transformation_data
      const transformationData = session.transformation_data as any;
      if (transformationData?.selected?.emotionalDrivers?.length > 0 && emotionalDrivers.length === 0) {
        emotionalDrivers = transformationData.selected.emotionalDrivers;
      }
      if (transformationData?.selected?.functionalDrivers?.length > 0 && functionalDrivers.length === 0) {
        functionalDrivers = transformationData.selected.functionalDrivers;
      }

      if (emotionalDrivers.length > 0 && functionalDrivers.length > 0) {
        break; // Found both, no need to check more sessions
      }
    }

    if (emotionalDrivers.length === 0 && functionalDrivers.length === 0) {
      console.log('[MarbaUVPService] No drivers found in any session');
      return { success: true, updated: false, emotionalDriversCount: 0, functionalDriversCount: 0 };
    }

    console.log('[MarbaUVPService] Found drivers to recover:', {
      emotional: emotionalDrivers.length,
      functional: functionalDrivers.length
    });

    // Update the UVP with recovered drivers
    const updatedTargetCustomer = {
      ...existingUVP.targetCustomer,
      emotionalDrivers: emotionalDrivers.length > 0 ? emotionalDrivers : existingUVP.targetCustomer?.emotionalDrivers || [],
      functionalDrivers: functionalDrivers.length > 0 ? functionalDrivers : existingUVP.targetCustomer?.functionalDrivers || []
    };

    const updatedTransformationGoal = {
      ...existingUVP.transformationGoal,
      emotionalDrivers: emotionalDrivers.length > 0 ? emotionalDrivers : existingUVP.transformationGoal?.emotionalDrivers || [],
      functionalDrivers: functionalDrivers.length > 0 ? functionalDrivers : existingUVP.transformationGoal?.functionalDrivers || []
    };

    const { error: updateError } = await supabase
      .from('marba_uvps')
      .update({
        target_customer: updatedTargetCustomer,
        transformation_goal: updatedTransformationGoal
      })
      .eq('brand_id', brandId);

    if (updateError) {
      console.error('[MarbaUVPService] Failed to update UVP with drivers:', updateError);
      return { success: false, updated: false, emotionalDriversCount: 0, functionalDriversCount: 0, error: updateError.message };
    }

    console.log('[MarbaUVPService] Successfully recovered drivers from session');
    return {
      success: true,
      updated: true,
      emotionalDriversCount: emotionalDrivers.length,
      functionalDriversCount: functionalDrivers.length
    };

  } catch (error) {
    console.error('[MarbaUVPService] Driver recovery error:', error);
    return {
      success: false,
      updated: false,
      emotionalDriversCount: 0,
      functionalDriversCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Recover UVP from session table and save to marba_uvps
 *
 * Looks for complete_uvp in uvp_sessions table and migrates it to marba_uvps
 *
 * @param brandId - Brand ID to recover UVP for
 * @returns Success status and recovery details
 */
export async function recoverUVPFromSession(brandId: string): Promise<{
  success: boolean;
  recovered: boolean;
  uvpId?: string;
  error?: string;
}> {
  console.log('[MarbaUVPService] Attempting to recover UVP from session for brand:', brandId);

  try {
    // Check if UVP already exists in marba_uvps
    const existingUVP = await getUVPByBrand(brandId);
    if (existingUVP) {
      console.log('[MarbaUVPService] UVP already exists in marba_uvps');
      return { success: true, recovered: false };
    }

    // Look for complete_uvp in uvp_sessions
    const { data: sessions, error: sessionError } = await supabase
      .from('uvp_sessions')
      .select('id, complete_uvp, session_name, created_at')
      .eq('brand_id', brandId)
      .not('complete_uvp', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (sessionError) {
      console.error('[MarbaUVPService] Error querying sessions:', sessionError);
      return { success: false, recovered: false, error: sessionError.message };
    }

    if (!sessions || sessions.length === 0) {
      console.log('[MarbaUVPService] No session with complete_uvp found');
      return { success: true, recovered: false };
    }

    const session = sessions[0];
    const completeUVP = session.complete_uvp as CompleteUVP;

    if (!completeUVP || !completeUVP.targetCustomer || !completeUVP.valuePropositionStatement) {
      console.log('[MarbaUVPService] Session has incomplete UVP data');
      return { success: true, recovered: false };
    }

    console.log('[MarbaUVPService] Found complete UVP in session:', session.id);
    console.log('[MarbaUVPService] UVP Statement:', completeUVP.valuePropositionStatement);

    // Save to marba_uvps
    const saveResult = await saveCompleteUVP(completeUVP, brandId);

    if (saveResult.success) {
      console.log('[MarbaUVPService] Successfully recovered UVP:', saveResult.uvpId);
      return {
        success: true,
        recovered: true,
        uvpId: saveResult.uvpId,
      };
    } else {
      console.error('[MarbaUVPService] Failed to save recovered UVP:', saveResult.error);
      return {
        success: false,
        recovered: false,
        error: saveResult.error,
      };
    }

  } catch (error) {
    console.error('[MarbaUVPService] Recovery error:', error);
    return {
      success: false,
      recovered: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Scan brand website and extract brand voice + customer stories
 *
 * This function:
 * 1. Gets the brand's website URL from the database
 * 2. Scrapes the website content
 * 3. Analyzes brand voice using AI
 * 4. Extracts testimonials/customer stories
 * 5. Updates the UVP with brandVoice and customerStories
 *
 * @param brandId - Brand ID to scan website for
 * @returns Success status with extracted data summary
 */
export async function scanBrandWebsiteForVoice(brandId: string): Promise<{
  success: boolean;
  brandVoice?: CompleteUVP['brandVoice'];
  customerStoriesCount?: number;
  error?: string;
}> {
  console.log('[MarbaUVPService] Scanning brand website for voice:', brandId);

  try {
    // 1. Get brand from database to find website URL
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('id, name, website')
      .eq('id', brandId)
      .single();

    if (brandError || !brand) {
      console.error('[MarbaUVPService] Brand not found:', brandError);
      return { success: false, error: 'Brand not found' };
    }

    if (!brand.website) {
      console.warn('[MarbaUVPService] Brand has no website URL');
      return { success: false, error: 'Brand has no website URL configured' };
    }

    console.log('[MarbaUVPService] Found brand website:', brand.website);

    // 2. Extract website content
    console.log('[MarbaUVPService] Extracting website content...');
    const websiteContent = await websiteAnalyzer.extractWebsiteContent(brand.website);

    if (!websiteContent || websiteContent.length < 100) {
      console.warn('[MarbaUVPService] Not enough content extracted from website');
      return { success: false, error: 'Could not extract content from website' };
    }

    console.log('[MarbaUVPService] Extracted', websiteContent.length, 'characters');

    // 3. Analyze brand voice using AI
    console.log('[MarbaUVPService] Analyzing brand voice...');
    const brandVoice = await websiteAnalyzer.analyzeBrandVoice(websiteContent, brand.name);

    // 4. Get testimonials from last scrape
    const testimonials = websiteAnalyzer.getLastTestimonials();
    console.log('[MarbaUVPService] Found', testimonials.length, 'testimonials');

    // 5. Get existing UVP
    const existingUVP = await getUVPByBrand(brandId);
    if (!existingUVP) {
      console.warn('[MarbaUVPService] No UVP found for brand - cannot update');
      return {
        success: true,
        brandVoice: {
          tone: brandVoice.tone as string[],
          values: brandVoice.values,
          personality: brandVoice.personality,
          vocabularyPatterns: brandVoice.vocabularyPatterns,
          avoidWords: brandVoice.avoidWords,
          signaturePhrases: brandVoice.signaturePhrases,
          sentenceStyle: brandVoice.sentenceStyle,
          emotionalTemperature: brandVoice.emotionalTemperature,
          confidence: brandVoice.confidence
        },
        customerStoriesCount: testimonials.length,
        error: 'UVP not found - brand voice extracted but not saved'
      };
    }

    // 6. Update UVP with brand voice and customer stories
    // We need to update the marba_uvps row directly since there's no dedicated column
    // The brand voice will be stored in the target_customer or transformation_goal JSONB

    // Actually, looking at CompleteUVP type, brandVoice and customerStories are top-level fields
    // Let's store them in the complete_uvp column if it exists, or extend the row

    // For now, let's update through the existing save mechanism
    const updatedUVP: CompleteUVP = {
      ...existingUVP,
      brandVoice: {
        tone: brandVoice.tone as string[],
        values: brandVoice.values,
        personality: brandVoice.personality,
        vocabularyPatterns: brandVoice.vocabularyPatterns,
        avoidWords: brandVoice.avoidWords,
        signaturePhrases: brandVoice.signaturePhrases,
        sentenceStyle: brandVoice.sentenceStyle,
        emotionalTemperature: brandVoice.emotionalTemperature,
        confidence: brandVoice.confidence
      },
      customerStories: testimonials.length > 0 ? testimonials : existingUVP.customerStories
    };

    // Save the updated UVP
    const saveResult = await saveCompleteUVP(updatedUVP, brandId);

    if (!saveResult.success) {
      console.error('[MarbaUVPService] Failed to save updated UVP:', saveResult.error);
      return {
        success: false,
        brandVoice: updatedUVP.brandVoice,
        customerStoriesCount: testimonials.length,
        error: `Failed to save UVP: ${saveResult.error}`
      };
    }

    console.log('[MarbaUVPService] Brand voice and stories saved successfully');
    console.log('[MarbaUVPService] Brand voice:', {
      tone: brandVoice.tone,
      values: brandVoice.values.slice(0, 3),
      temperature: brandVoice.emotionalTemperature,
      confidence: brandVoice.confidence
    });

    return {
      success: true,
      brandVoice: updatedUVP.brandVoice,
      customerStoriesCount: testimonials.length
    };

  } catch (error) {
    console.error('[MarbaUVPService] Website scan error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error scanning website'
    };
  }
}
