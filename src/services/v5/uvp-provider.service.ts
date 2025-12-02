/**
 * V5 UVP Provider Service
 *
 * Extracts and formats UVP data into template variables for content generation.
 * Provides clean {{variable}} substitution format.
 *
 * Created: 2025-12-01
 */

import { supabase } from '@/lib/supabase';
import type { CompleteUVP } from '@/types/uvp-flow.types';
import type { UVPVariables, IUVPProviderService } from './types';

// ============================================================================
// CACHE
// ============================================================================

const variablesCache = new Map<string, { data: UVPVariables; loadedAt: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

/**
 * Get UVP variables for a brand
 */
export async function getVariables(brandId: string): Promise<UVPVariables | null> {
  // Check cache
  const cached = variablesCache.get(brandId);
  if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) {
    console.log(`[V5 UVPProvider] Using cached variables: ${brandId}`);
    return cached.data;
  }

  try {
    console.log(`[V5 UVPProvider] Loading UVP for brand: ${brandId}`);

    // Try to load from brands table (has uvp_data column)
    const { data: brandData, error: brandError } = await supabase
      .from('brands')
      .select('id, name, uvp_data, website_url, industry')
      .eq('id', brandId)
      .single();

    if (brandError || !brandData) {
      console.warn(`[V5 UVPProvider] Brand not found: ${brandId}`);
      return null;
    }

    // Extract UVP from brand data
    const uvpData = brandData.uvp_data as CompleteUVP | null;
    if (!uvpData) {
      console.warn(`[V5 UVPProvider] No UVP data for brand: ${brandId}`);
      // Return minimal variables from brand name
      return {
        businessName: brandData.name || 'Your Business',
        targetCustomer: '',
        transformation: '',
        uniqueSolution: '',
        keyBenefit: '',
        differentiator: '',
        industry: brandData.industry || '',
      };
    }

    const variables = extractVariables(brandData.name, uvpData);

    // Cache it
    variablesCache.set(brandId, { data: variables, loadedAt: Date.now() });
    console.log(`[V5 UVPProvider] Extracted variables for: ${brandData.name}`);

    return variables;
  } catch (err) {
    console.error(`[V5 UVPProvider] Failed to load brand: ${brandId}`, err);
    return null;
  }
}

/**
 * Extract template variables from UVP data
 */
function extractVariables(brandName: string, uvp: CompleteUVP): UVPVariables {
  // Extract target customer
  let targetCustomer = '';
  if (uvp.targetCustomer) {
    targetCustomer = uvp.targetCustomer.statement || '';
    if (!targetCustomer && uvp.targetCustomer.role) {
      targetCustomer = `${uvp.targetCustomer.role}${uvp.targetCustomer.industry ? ` in ${uvp.targetCustomer.industry}` : ''}`;
    }
  }

  // Extract transformation
  let transformation = '';
  if (uvp.transformationGoal) {
    transformation = uvp.transformationGoal.statement || uvp.transformationGoal.outcomeStatement || '';
    if (!transformation && uvp.transformationGoal.before && uvp.transformationGoal.after) {
      transformation = `Go from ${uvp.transformationGoal.before} to ${uvp.transformationGoal.after}`;
    }
  }

  // Extract unique solution
  let uniqueSolution = '';
  if (uvp.uniqueSolution) {
    uniqueSolution = uvp.uniqueSolution.statement || '';
    if (!uniqueSolution && uvp.uniqueSolution.approach) {
      uniqueSolution = uvp.uniqueSolution.approach;
    }
  }

  // Extract key benefit
  let keyBenefit = '';
  if (uvp.keyBenefit) {
    keyBenefit = uvp.keyBenefit.statement || '';
    if (!keyBenefit && uvp.keyBenefit.headline) {
      keyBenefit = uvp.keyBenefit.headline;
    }
  }

  // Extract differentiator from how statement or unique solution
  const differentiator = uvp.howStatement || uvp.uniqueSolution?.approach || '';

  // Extract industry from target customer profile
  const industry = uvp.targetCustomer?.industry || '';

  return {
    businessName: brandName || 'Your Business',
    targetCustomer,
    transformation,
    uniqueSolution,
    keyBenefit,
    differentiator,
    industry,
  };
}

/**
 * Format UVP variables for template substitution
 * Returns a Record<string, string> with {{variable}} names as keys
 */
export function formatForTemplate(uvp: UVPVariables): Record<string, string> {
  return {
    // Core variables
    business_name: uvp.businessName,
    target_customer: uvp.targetCustomer,
    transformation: uvp.transformation,
    unique_solution: uvp.uniqueSolution,
    key_benefit: uvp.keyBenefit,
    differentiator: uvp.differentiator,

    // Optional enrichment
    industry: uvp.industry || '',
    location: uvp.location || '',
    brand_voice: uvp.brandVoice || '',

    // Intelligence variables (if provided)
    trend: uvp.trend || '',
    competitive_edge: uvp.competitiveEdge || '',
    proof_point: uvp.proofPoint || '',

    // Aliases for flexibility
    name: uvp.businessName,
    customer: uvp.targetCustomer,
    benefit: uvp.keyBenefit,
    solution: uvp.uniqueSolution,
  };
}

/**
 * Create UVP variables from raw input (for testing or manual override)
 */
export function createFromRaw(input: {
  businessName: string;
  targetCustomer?: string;
  transformation?: string;
  uniqueSolution?: string;
  keyBenefit?: string;
  differentiator?: string;
  industry?: string;
}): UVPVariables {
  return {
    businessName: input.businessName,
    targetCustomer: input.targetCustomer || '',
    transformation: input.transformation || '',
    uniqueSolution: input.uniqueSolution || '',
    keyBenefit: input.keyBenefit || '',
    differentiator: input.differentiator || '',
    industry: input.industry,
  };
}

/**
 * Populate a template string with UVP variables
 */
export function populateTemplate(template: string, variables: UVPVariables): string {
  const formatted = formatForTemplate(variables);
  let result = template;

  // Replace all {{variable}} patterns
  for (const [key, value] of Object.entries(formatted)) {
    const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');
    result = result.replace(pattern, value || '');
  }

  // Clean up any remaining empty variables
  result = result.replace(/\{\{[^}]+\}\}/g, '');

  // Clean up double spaces and trim
  result = result.replace(/\s{2,}/g, ' ').trim();

  return result;
}

/**
 * Clear cache
 */
export function clearCache(): void {
  variablesCache.clear();
  console.log('[V5 UVPProvider] Cache cleared');
}

// ============================================================================
// EXPORT SERVICE
// ============================================================================

export const uvpProviderService: IUVPProviderService = {
  getVariables,
  formatForTemplate,
};

export default uvpProviderService;
