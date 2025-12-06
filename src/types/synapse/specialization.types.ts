/**
 * Specialization Types - Phase 15
 *
 * Types for business specialization detection and API pre-fetch.
 * Used to customize all Synapse actions for specific business purposes.
 *
 * Created: 2025-12-05
 */

// ============================================================================
// PROFILE TYPES
// ============================================================================

/**
 * The 7 business profile categories
 */
export type BusinessProfileType =
  | 'local-service-b2c'   // Local B2C service (wedding bakery)
  | 'local-service-b2b'   // Local B2B service (commercial HVAC)
  | 'regional-b2b-agency' // Regional agency (insurance broker)
  | 'regional-retail-b2c' // Regional franchise (retail chain)
  | 'national-saas-b2b'   // National SaaS B2B (OpenDialog)
  | 'national-product-b2c' // National product B2C (DTC brand)
  | 'global-saas-b2b';    // Global enterprise (Salesforce competitor)

/**
 * Mapping from old 6 types to new 7 types
 */
export const PROFILE_TYPE_MIGRATION: Record<string, BusinessProfileType> = {
  'local-b2c': 'local-service-b2c',
  'local-b2b': 'local-service-b2b',
  'regional-agency': 'regional-b2b-agency',
  'regional-retail': 'regional-retail-b2c',
  'national-saas': 'national-saas-b2b',
  'national-product': 'national-product-b2c',
};

// ============================================================================
// SPECIALIZATION DATA
// ============================================================================

/**
 * Base specialization fields common to all profile types
 */
interface BaseSpecialization {
  /** The detected profile type */
  profile_type: BusinessProfileType;

  /** Primary service/product category */
  service_type: string;

  /** Specific niche within category */
  niche: string;

  /** Industry vertical being served */
  industry_vertical: string;

  /** The unique method/approach that differentiates */
  unique_method: string;

  /** What outcome customers actually want */
  target_outcome: string;

  /** Detected competitor types (not generic "other businesses") */
  detected_competitors: string[];

  /** Detection confidence 0-100 */
  confidence: number;
}

/**
 * Local B2C Service specialization (wedding bakery, salon, plumber)
 */
export interface LocalServiceB2CSpecialization extends BaseSpecialization {
  profile_type: 'local-service-b2c';

  /** e.g., "food", "beauty", "home services" */
  service_category: string;

  /** e.g., "wedding", "luxury", "budget", "specialty" */
  niche_positioning: string;

  /** Service radius in miles */
  location_radius: number;

  /** Primary customer trigger (event, emergency, routine) */
  purchase_trigger: 'event' | 'emergency' | 'routine' | 'seasonal';
}

/**
 * Local B2B Service specialization (commercial HVAC, IT services)
 */
export interface LocalServiceB2BSpecialization extends BaseSpecialization {
  profile_type: 'local-service-b2b';

  /** e.g., "HVAC", "IT", "cleaning", "security" */
  trade_type: string;

  /** e.g., "commercial", "industrial", "healthcare", "education" */
  sector_served: string;

  /** Service area description */
  service_area: string;

  /** Contract type focus */
  contract_focus: 'project' | 'retainer' | 'emergency' | 'maintenance';
}

/**
 * Regional B2B Agency specialization (insurance broker, marketing agency)
 */
export interface RegionalB2BAgencySpecialization extends BaseSpecialization {
  profile_type: 'regional-b2b-agency';

  /** e.g., "insurance", "marketing", "staffing", "consulting" */
  agency_type: string;

  /** e.g., "healthcare", "construction", "tech startups" */
  specialty_vertical: string;

  /** Geographic scope */
  geographic_scope: 'city' | 'metro' | 'state' | 'multi-state';

  /** Client size focus */
  client_size_focus: 'smb' | 'mid-market' | 'enterprise' | 'mixed';
}

/**
 * Regional Retail B2C specialization (grocery chain, retail franchise)
 */
export interface RegionalRetailB2CSpecialization extends BaseSpecialization {
  profile_type: 'regional-retail-b2c';

  /** e.g., "grocery", "apparel", "home goods" */
  retail_category: string;

  /** e.g., "value", "premium", "specialty" */
  price_positioning: string;

  /** Number of locations */
  location_count: number;

  /** Ownership model */
  ownership_model: 'corporate' | 'franchise' | 'mixed';
}

/**
 * National SaaS B2B specialization (OpenDialog = AI agents for insurance sales)
 */
export interface NationalSaaSB2BSpecialization extends BaseSpecialization {
  profile_type: 'national-saas-b2b';

  /** What the product DOES (not what it is) e.g., "automates insurance sales" */
  product_function: string;

  /** Industry SOLD TO (not industry OF product) e.g., "insurance" not "AI" */
  industry_sold_to: string;

  /** The unique approach e.g., "AI agents" not "software" */
  unique_approach: string;

  /** Buyer role */
  buyer_role: string;

  /** Integration requirements */
  integration_ecosystem: string[];
}

/**
 * National Product B2C specialization (DTC brand, consumer products)
 */
export interface NationalProductB2CSpecialization extends BaseSpecialization {
  profile_type: 'national-product-b2c';

  /** e.g., "apparel", "food", "beauty", "home" */
  product_category: string;

  /** e.g., "sustainable", "premium", "budget", "innovative" */
  differentiator_angle: string;

  /** Sales channel focus */
  channel_focus: 'dtc' | 'retail' | 'marketplace' | 'hybrid';

  /** Target demographic */
  target_demographic: string;
}

/**
 * Global Enterprise SaaS specialization (Salesforce competitor)
 */
export interface GlobalSaaSB2BSpecialization extends BaseSpecialization {
  profile_type: 'global-saas-b2b';

  /** e.g., "CRM", "ERP", "security", "analytics" */
  enterprise_function: string;

  /** e.g., "mid-market", "Fortune 500", "government" */
  scale_tier: string;

  /** Compliance requirements */
  compliance_requirements: string[];

  /** Deployment model */
  deployment_model: 'cloud' | 'on-premise' | 'hybrid';

  /** Global regions served */
  regions_served: string[];
}

/**
 * Union type of all specialization types
 */
export type SpecializationData =
  | LocalServiceB2CSpecialization
  | LocalServiceB2BSpecialization
  | RegionalB2BAgencySpecialization
  | RegionalRetailB2CSpecialization
  | NationalSaaSB2BSpecialization
  | NationalProductB2CSpecialization
  | GlobalSaaSB2BSpecialization;

// ============================================================================
// PREFETCH CACHE
// ============================================================================

/**
 * Tab types for prefetch
 */
export type PrefetchTab = 'voc' | 'community' | 'competitive' | 'trends' | 'search' | 'local_timing';

/**
 * Status of a prefetch operation
 */
export type PrefetchStatus = 'pending' | 'fetching' | 'complete' | 'failed' | 'expired';

/**
 * Cached tab data structure
 */
export interface PrefetchTabData {
  /** Results for this tab */
  results: unknown[];

  /** Query used to fetch */
  query: string;

  /** When fetched */
  fetched_at: string;

  /** Number of results */
  result_count: number;

  /** Error if any */
  error?: string;
}

/**
 * Full prefetch cache record
 */
export interface PrefetchCache {
  id: string;
  brand_id: string;

  /** Tab data keyed by tab name */
  tab_data: Record<PrefetchTab, PrefetchTabData>;

  /** Query context used for prefetch */
  query_context: {
    specialization: SpecializationData;
    queries_per_tab: Record<PrefetchTab, string[]>;
  };

  /** Specialization data that was used */
  specialization_used: SpecializationData | null;

  created_at: string;
  expires_at: string;

  status: PrefetchStatus;
  error_message: string | null;

  fetch_started_at: string | null;
  fetch_completed_at: string | null;
  tabs_completed: number;
}

// ============================================================================
// DETECTION RESULT
// ============================================================================

/**
 * Result from SpecializationDetector
 */
export interface SpecializationDetectionResult {
  success: boolean;

  /** Detected specialization data */
  specialization: SpecializationData | null;

  /** Confidence score 0-100 */
  confidence: number;

  /** Detection method used */
  method: 'uvp-analysis' | 'website-analysis' | 'manual' | 'fallback';

  /** Processing time in ms */
  processing_time_ms: number;

  /** Any warnings during detection */
  warnings: string[];

  /** Error if failed */
  error?: string;
}

// ============================================================================
// API QUERY CONTEXT
// ============================================================================

/**
 * Specialization-aware query context for API calls
 */
export interface SpecializedQueryContext {
  /** The specialization data */
  specialization: SpecializationData;

  /** Profile-specific search terms */
  search_terms: string[];

  /** Categories to search in */
  categories: string[];

  /** Terms to exclude (competitors, off-topic) */
  exclusions: string[];

  /** Platforms prioritized for this profile */
  priority_platforms: string[];

  /** Psychology triggers relevant to this profile */
  psychology_triggers: string[];
}

/**
 * Tab-specific query configuration
 */
export interface TabQueryConfig {
  tab: PrefetchTab;
  queries: string[];
  apis: string[];
  context: SpecializedQueryContext;
}
