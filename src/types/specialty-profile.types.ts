/**
 * SPECIALTY PROFILE TYPES
 *
 * Types for dynamically generated industry profiles for specialty businesses
 * that don't match existing NAICS codes.
 *
 * Example: "CAI platform for insurance" - no NAICS code exists for this specialty
 *
 * Created: 2025-12-02
 */

import { z } from 'zod';
import type { EnhancedIndustryProfile, EnabledTabs } from './industry-profile.types';

// Re-export EnabledTabs for consumers of specialty-profile.types
export type { EnabledTabs } from './industry-profile.types';

// ============================================================================
// GENERATION STATUS
// ============================================================================

export type SpecialtyProfileStatus = 'pending' | 'generating' | 'failed' | 'complete' | 'needs_human';

// ============================================================================
// BUSINESS PROFILE TYPES (7 categories)
// ============================================================================

export type BusinessProfileType =
  | 'local-service-b2c'      // Dentist, hair salon, plumber
  | 'local-service-b2b'      // Commercial cleaning, IT support
  | 'regional-b2b-agency'    // Marketing agency, consulting firm
  | 'regional-retail-b2c'    // Multi-location retail, restaurant chain
  | 'national-saas-b2b'      // SaaS company selling to businesses
  | 'national-product-b2c'   // E-commerce, DTC brand
  | 'global-saas-b2b';       // Enterprise software

// ============================================================================
// SPECIALTY PROFILE SCHEMA
// ============================================================================

export const SpecialtyProfileSchema = z.object({
  id: z.string().uuid(),

  // Lookup keys
  brand_id: z.string().uuid().nullable(),
  specialty_hash: z.string(), // SHA256 of normalized specialty description

  // Specialty identification
  specialty_name: z.string().min(1), // "Conversational AI for Insurance"
  specialty_description: z.string().nullable(),
  base_naics_code: z.string().nullable(), // Nearest NAICS code for reference
  business_profile_type: z.enum([
    'local-service-b2c',
    'local-service-b2b',
    'regional-b2b-agency',
    'regional-retail-b2c',
    'national-saas-b2b',
    'national-product-b2c',
    'global-saas-b2b'
  ]).nullable(),

  // Generation metadata
  generation_status: z.enum(['pending', 'generating', 'failed', 'complete', 'needs_human']),
  generation_started_at: z.string().datetime().nullable(),
  generation_completed_at: z.string().datetime().nullable(),
  generation_attempts: z.number().int().min(0),
  generation_error: z.string().nullable(),

  // The full profile data (matches EnhancedIndustryProfile structure)
  profile_data: z.any().nullable(), // EnhancedIndustryProfile

  // Trigger-specific data extracted for quick access
  customer_triggers: z.array(z.object({
    trigger: z.string(),
    urgency: z.number(),
    frequency: z.string()
  })).nullable(),
  common_pain_points: z.array(z.string()).nullable(),
  common_buying_triggers: z.array(z.string()).nullable(),
  urgency_drivers: z.array(z.string()).nullable(),
  objection_handlers: z.array(z.object({
    objection: z.string(),
    response: z.string(),
    effectiveness: z.number()
  })).nullable(),

  // Tab visibility configuration
  enabled_tabs: z.object({
    triggers: z.boolean(),
    proof: z.boolean(),
    trends: z.boolean(),
    conversations: z.boolean(),
    competitors: z.boolean(),
    local: z.boolean(),
    weather: z.boolean()
  }).nullable(),

  // Quality metrics
  multipass_validation_score: z.number().int().min(0).max(100).nullable(),
  human_reviewed: z.boolean(),
  human_reviewed_at: z.string().datetime().nullable(),
  human_reviewer_notes: z.string().nullable(),

  // Timestamps
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

export type SpecialtyProfile = z.infer<typeof SpecialtyProfileSchema>;

// ============================================================================
// DATABASE ROW TYPE (for Supabase queries)
// ============================================================================

export interface SpecialtyProfileRow {
  id: string;
  brand_id: string | null;
  specialty_hash: string;
  specialty_name: string;
  specialty_description: string | null;
  base_naics_code: string | null;
  business_profile_type: BusinessProfileType | null;
  generation_status: SpecialtyProfileStatus;
  generation_started_at: string | null;
  generation_completed_at: string | null;
  generation_attempts: number;
  generation_error: string | null;
  profile_data: EnhancedIndustryProfile | null;
  customer_triggers: Array<{ trigger: string; urgency: number; frequency: string }> | null;
  common_pain_points: string[] | null;
  common_buying_triggers: string[] | null;
  urgency_drivers: string[] | null;
  objection_handlers: Array<{ objection: string; response: string; effectiveness: number }> | null;
  enabled_tabs: EnabledTabs | null;
  multipass_validation_score: number | null;
  human_reviewed: boolean;
  human_reviewed_at: string | null;
  human_reviewer_notes: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// SPECIALTY DETECTION INPUT
// ============================================================================

export interface SpecialtyDetectionInput {
  businessName: string;
  websiteUrl?: string;
  industry?: string;
  naicsCode?: string;
  uvpDescription?: string;
  targetCustomer?: string;
  productsServices?: string;
  /** Full UVP data for accurate profile type detection */
  uvp?: {
    /** Customer type: b2b, b2c, or b2b2c */
    customerType?: 'b2b' | 'b2c' | 'b2b2c';
    /** Geographic scope from UVP */
    geographicScope?: 'local' | 'regional' | 'national' | 'global';
    /** Is this a SaaS/software business? */
    isSaaS?: boolean;
    /** Is this primarily a service business? */
    isService?: boolean;
  };
}

// ============================================================================
// SPECIALTY DETECTION RESULT
// ============================================================================

export interface SpecialtyDetectionResult {
  /** Whether a specialty was detected */
  isSpecialty: boolean;

  /** Detected specialty name (e.g., "Conversational AI for Insurance") */
  specialtyName: string;

  /** SHA256 hash for deduplication */
  specialtyHash: string;

  /** Description of the specialty */
  specialtyDescription: string;

  /** Nearest NAICS code for reference */
  baseNaicsCode: string | null;

  /** Business profile type */
  businessProfileType: BusinessProfileType;

  /** Confidence score 0-100 */
  confidence: number;

  /** Reasoning for the detection */
  reasoning: string;

  /** Existing profile if found in DB */
  existingProfile: SpecialtyProfileRow | null;

  /** Whether generation is needed */
  needsGeneration: boolean;
}

// ============================================================================
// MULTIPASS GENERATION TYPES
// ============================================================================

export interface MultipassGenerationInput {
  specialtyName: string;
  specialtyDescription: string;
  baseNaicsCode: string | null;
  businessProfileType: BusinessProfileType;
  uvpData?: {
    targetCustomer?: string;
    productsServices?: string;
    businessDescription?: string;
  };
}

export interface MultipassGenerationResult {
  success: boolean;
  profile: EnhancedIndustryProfile | null;
  validationScore: number;
  passResults: {
    pass1: { success: boolean; error?: string };
    pass2: { success: boolean; error?: string };
    pass3: { success: boolean; error?: string };
  };
  error?: string;
}

// ============================================================================
// GENERATION PROGRESS EVENTS
// ============================================================================

export interface SpecialtyGenerationProgress {
  stage: 'detecting' | 'checking-cache' | 'pass-1' | 'pass-2' | 'pass-3' | 'validating' | 'saving' | 'complete' | 'failed';
  progress: number; // 0-100
  message: string;
  specialtyName?: string;
  validationScore?: number;
  error?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate SHA256 hash for specialty deduplication
 */
export function generateSpecialtyHash(input: {
  specialtyName: string;
  businessProfileType: BusinessProfileType;
}): string {
  const normalized = `${input.specialtyName.toLowerCase().trim()}|${input.businessProfileType}`;
  // Note: In browser, use crypto.subtle.digest or a library
  // For now, return a simple hash (replace with proper SHA256 in implementation)
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

/**
 * Determine enabled tabs based on business profile type
 */
export function getEnabledTabsForProfileType(type: BusinessProfileType): EnabledTabs {
  const baseEnabled: EnabledTabs = {
    triggers: true,
    proof: true,
    trends: true,
    conversations: true,
    competitors: true,
    local: false,
    weather: false
  };

  switch (type) {
    case 'local-service-b2c':
    case 'local-service-b2b':
      return { ...baseEnabled, local: true, weather: true };

    case 'regional-retail-b2c':
      return { ...baseEnabled, local: true, weather: true };

    case 'regional-b2b-agency':
      return { ...baseEnabled, local: true };

    case 'national-saas-b2b':
    case 'national-product-b2c':
    case 'global-saas-b2b':
      return baseEnabled;

    default:
      return baseEnabled;
  }
}

/**
 * Validate specialty profile data
 */
export function validateSpecialtyProfile(data: unknown): SpecialtyProfile {
  return SpecialtyProfileSchema.parse(data);
}
