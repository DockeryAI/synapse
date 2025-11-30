/**
 * Competitor Intelligence Types
 *
 * TypeScript types for the Gap Tab 2.0 competitor intelligence system.
 * Matches the Supabase schema in 20251128000001_competitor_intelligence_tables.sql
 *
 * Created: 2025-11-28
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export type DiscoverySource = 'uvp' | 'perplexity' | 'manual' | 'g2' | 'google-maps';

export type SegmentType = 'local' | 'regional' | 'national' | 'global';

export type BusinessType = 'b2b' | 'b2c' | 'dtc' | 'mixed';

export type ScanType =
  | 'website'
  | 'reviews-google'
  | 'reviews-yelp'
  | 'reviews-g2'
  | 'reviews-capterra'
  | 'reviews-trustpilot'
  | 'ads-meta'
  | 'ads-linkedin'
  | 'perplexity-research'
  | 'llm-analysis';

export type GapType =
  | 'feature-gap'
  | 'service-gap'
  | 'pricing-gap'
  | 'support-gap'
  | 'trust-gap'
  | 'ux-gap'
  | 'integration-gap'
  | 'messaging-gap';

export type GapSource = 'reviews' | 'ads' | 'website' | 'perplexity' | 'uvp-correlation';

export type AlertType =
  | 'new-complaint'
  | 'new-ad-campaign'
  | 'positioning-change'
  | 'new-feature'
  | 'news-mention'
  | 'gap-opportunity';

export type AlertSeverity = 'low' | 'medium' | 'high';

export type AdPlatform = 'meta' | 'linkedin' | 'google' | 'tiktok';

export type CreativeType = 'image' | 'video' | 'carousel' | 'text';

// TTL constants for scan types (in milliseconds)
export const SCAN_TTL: Record<ScanType, number> = {
  'website': 14 * 24 * 60 * 60 * 1000,           // 14 days
  'reviews-google': 3 * 24 * 60 * 60 * 1000,     // 3 days
  'reviews-yelp': 3 * 24 * 60 * 60 * 1000,       // 3 days
  'reviews-g2': 3 * 24 * 60 * 60 * 1000,         // 3 days
  'reviews-capterra': 3 * 24 * 60 * 60 * 1000,   // 3 days
  'reviews-trustpilot': 3 * 24 * 60 * 60 * 1000, // 3 days
  'ads-meta': 7 * 24 * 60 * 60 * 1000,           // 7 days
  'ads-linkedin': 7 * 24 * 60 * 60 * 1000,       // 7 days
  'perplexity-research': 7 * 24 * 60 * 60 * 1000, // 7 days
  'llm-analysis': 14 * 24 * 60 * 60 * 1000       // 14 days - LLM knowledge doesn't change quickly
};

// Review sources by segment
export const SEGMENT_REVIEW_SOURCES: Record<SegmentType, ScanType[]> = {
  local: ['reviews-google', 'reviews-yelp'],
  regional: ['reviews-google', 'reviews-yelp', 'reviews-g2'],
  national: ['reviews-g2', 'reviews-capterra', 'reviews-trustpilot'],
  global: ['reviews-g2', 'reviews-capterra', 'reviews-trustpilot']
};

// Ad platforms by business type
export const BUSINESS_TYPE_AD_PLATFORMS: Record<BusinessType, AdPlatform[]> = {
  b2b: ['linkedin', 'meta'],
  b2c: ['meta', 'google'],
  dtc: ['meta', 'tiktok', 'google'],
  mixed: ['meta', 'linkedin']
};

// ============================================================================
// DATABASE ENTITY TYPES
// ============================================================================

/**
 * Competitor Profile - A discovered or manually added competitor
 */
export interface CompetitorProfile {
  id: string;
  brand_id: string;

  // Basic Info
  name: string;
  website: string | null;
  logo_url: string | null;

  // Verification & Discovery
  is_verified: boolean;
  discovery_source: DiscoverySource | null;
  confidence_score: number;

  // Segment Relevance
  segment_type: SegmentType | null;
  business_type: BusinessType | null;

  // User Actions
  is_active: boolean;
  is_pinned: boolean;
  display_order: number;

  // Extracted Positioning
  positioning_summary: string | null;
  key_claims: string[];
  pricing_model: string | null;
  target_audience: string | null;

  // Metadata
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Competitor Scan - A single scan result for a competitor
 */
export interface CompetitorScan {
  id: string;
  competitor_id: string;
  brand_id: string;

  // Scan Type
  scan_type: ScanType;

  // Scan Results
  scan_data: Record<string, unknown>;
  raw_response: Record<string, unknown>;

  // Analysis Results
  extracted_positioning: string | null;
  extracted_weaknesses: string[];
  extracted_strengths: string[];
  extracted_claims: string[];
  sentiment_summary: SentimentSummary;

  // Quality Metrics
  data_quality_score: number;
  sample_size: number;

  // Cache Management
  scanned_at: string;
  expires_at: string;
  is_stale: boolean;

  // Metadata
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Competitor Gap - An identified competitive gap with provenance
 */
export interface CompetitorGap {
  id: string;
  brand_id: string;

  // Competitor Association
  competitor_ids: string[];
  competitor_names: string[];

  // Gap Content (The Void / The Demand / Your Angle)
  title: string;
  the_void: string;
  the_demand: string;
  your_angle: string;

  // Classification
  gap_type: GapType | null;

  // Quality & Confidence
  confidence_score: number;
  source_count: number;

  // Provenance
  primary_source: GapSource;
  source_quotes: SourceQuote[];
  source_scan_ids: string[];

  // Applicability (legacy)
  customer_profiles: CustomerProfileMatch[];
  applicable_offerings: OfferingMatch[];

  // Applicability (Phase 13 - UVP-mapped)
  applicable_products?: ApplicableProduct[];
  applicable_segments?: ApplicableSegment[];

  // User Actions
  is_dismissed: boolean;
  is_starred: boolean;
  used_in_content_count: number;

  // Metadata
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Competitor Alert - A monitoring alert for changes
 */
export interface CompetitorAlert {
  id: string;
  brand_id: string;
  competitor_id: string | null;

  // Alert Type
  alert_type: AlertType;

  // Alert Content
  title: string;
  description: string;
  severity: AlertSeverity;

  // Evidence
  evidence: AlertEvidence;
  related_gap_id: string | null;

  // Status
  is_read: boolean;
  is_dismissed: boolean;
  is_actioned: boolean;

  // Metadata
  detected_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Competitor Ad - An ad from competitor's ad library
 */
export interface CompetitorAd {
  id: string;
  competitor_id: string;
  brand_id: string;

  // Platform
  platform: AdPlatform;

  // Ad Content
  ad_id: string | null;
  headline: string | null;
  body_text: string | null;
  cta_text: string | null;
  creative_type: CreativeType | null;
  creative_url: string | null;
  landing_page_url: string | null;

  // Analysis
  messaging_themes: string[];
  target_audience_signals: Record<string, unknown>;
  emotional_appeals: string[];

  // Ad Library Metadata
  first_seen_at: string | null;
  last_seen_at: string | null;
  is_active: boolean;

  // Metadata
  raw_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// NESTED/JSONB TYPES
// ============================================================================

export interface SentimentSummary {
  positive_count?: number;
  negative_count?: number;
  neutral_count?: number;
  average_rating?: number;
  top_positive_themes?: string[];
  top_negative_themes?: string[];
}

export interface SourceQuote {
  quote: string;
  source: string;
  url?: string;
  date?: string;
  author?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  relevance?: number;
}

/**
 * Applicable product mapping - which of the brand's products address this gap
 */
export interface ApplicableProduct {
  product: string;
  fit: 'direct' | 'partial' | 'indirect';
  why: string;
}

/**
 * Applicable segment mapping - which customer segments are affected
 */
export interface ApplicableSegment {
  segment: string;
  readiness: 'high' | 'medium' | 'low';
  pain_point: string;
}

export interface CustomerProfileMatch {
  segment: string;
  pain_point: string;
  readiness: 'high' | 'medium' | 'low';
}

export interface OfferingMatch {
  offering: string;
  fit: 'direct' | 'partial' | 'indirect';
  positioning: string;
}

export interface AlertEvidence {
  quotes?: SourceQuote[];
  screenshots?: string[];
  comparison_data?: Record<string, unknown>;
  previous_value?: unknown;
  new_value?: unknown;
}

// ============================================================================
// SERVICE/API TYPES
// ============================================================================

/**
 * Competitor discovery request
 */
export interface CompetitorDiscoveryRequest {
  brand_id: string;
  brand_name: string;
  industry: string;
  website_url?: string;
  location?: string;
  segment_type?: SegmentType;
  business_type?: BusinessType;
  existing_competitors?: string[]; // Names to exclude
}

/**
 * Competitor discovery result from Perplexity
 */
export interface DiscoveredCompetitor {
  name: string;
  website?: string;
  confidence: number;
  reason: string;
  segment_type?: SegmentType;
  business_type?: BusinessType;
}

/**
 * Competitor scan request
 */
export interface CompetitorScanRequest {
  competitor_id: string;
  brand_id: string;
  scan_types: ScanType[];
  force_refresh?: boolean;
}

/**
 * Gap extraction request
 */
export interface GapExtractionRequest {
  brand_id: string;
  competitor_id: string;
  competitor_name: string;
  scan_data: {
    website?: CompetitorScan;
    reviews?: CompetitorScan[];
    ads?: CompetitorAd[];
    perplexity?: CompetitorScan;
    llm_analysis?: CompetitorScan; // LLM-powered analysis (reliable fallback)
  };
  uvp_data?: {
    unique_solution: string;
    key_benefit: string;
    differentiation: string;
  };
}

/**
 * Extracted gap from analysis
 */
export interface ExtractedGap {
  title: string;
  the_void: string;
  the_demand: string;
  your_angle: string;
  gap_type: GapType;
  confidence: number;
  sources: SourceQuote[];
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

/**
 * Competitor chip state for UI
 */
export interface CompetitorChipState {
  id: string;
  name: string;
  logo_url: string | null;
  is_selected: boolean;
  is_scanning: boolean;
  scan_progress?: number;
  last_scanned?: string;
  gap_count: number;
  /** AI-computed relevance/threat score (0-100) */
  relevance_score?: number;
  /** User-assigned rank (lower = more important, used for manual reordering) */
  user_rank?: number;
  /** Tier: 'top3' | 'top10' | 'other' (derived from ranking) */
  tier?: 'top3' | 'top10' | 'other';
}

/**
 * Gap card state for UI (extends DB type with UI state)
 */
export interface GapCardState extends CompetitorGap {
  is_expanded: boolean;
  is_generating_content: boolean;
}

/**
 * Scan status for UI
 */
export interface ScanStatus {
  competitor_id: string;
  competitor_name: string;
  scan_type: ScanType;
  status: 'pending' | 'loading' | 'success' | 'error';
  progress?: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
}

/**
 * Overall competitor intelligence state
 */
export interface CompetitorIntelligenceState {
  competitors: CompetitorProfile[];
  gaps: CompetitorGap[];
  alerts: CompetitorAlert[];
  scan_statuses: ScanStatus[];
  is_loading: boolean;
  is_discovering: boolean;
  error: string | null;
  last_refresh: string | null;
}

// ============================================================================
// STREAMING EVENT TYPES
// ============================================================================

export type CompetitorScanEventType =
  | 'competitor-discovery'
  | 'competitor-scan-website'
  | 'competitor-scan-reviews'
  | 'competitor-scan-ads'
  | 'competitor-scan-research'
  | 'competitor-scan-llm'
  | 'competitor-gap-extraction';

export interface CompetitorScanEvent {
  type: CompetitorScanEventType;
  competitor_id?: string;
  competitor_name?: string;
  status: 'started' | 'progress' | 'completed' | 'error';
  progress?: number;
  data?: unknown;
  error?: string;
}

// ============================================================================
// PROMPT TEMPLATES
// ============================================================================

/**
 * Enhanced competitor discovery request with full brand context
 */
export interface EnhancedCompetitorDiscoveryRequest extends CompetitorDiscoveryRequest {
  // UVP context
  unique_solution?: string;
  key_benefit?: string;
  differentiation?: string;

  // Brand context
  brand_description?: string;
  brand_website?: string;
  target_customer?: string;

  // Existing competitor context (for caliber matching)
  existing_competitor_names?: string[];
}

/**
 * Enhanced competitor identification request with full context
 */
export interface EnhancedCompetitorIdentificationRequest {
  name: string;
  website?: string;
  brand_name: string;
  brand_industry: string;
  segment_type?: SegmentType;
  business_type?: BusinessType;

  // UVP context
  unique_solution?: string;
  key_benefit?: string;
  target_customer?: string;

  // Existing competitor context
  existing_competitor_names?: string[];
}

/**
 * Segment category key for prompt selection
 */
export type SegmentCategoryKey =
  | 'saas-b2b'           // National/Global SaaS B2B
  | 'local-b2c'          // Local service B2C (dental, salon, restaurant)
  | 'local-b2b'          // Local service B2B (commercial HVAC, IT)
  | 'regional-agency'    // Regional B2B agency (marketing, accounting)
  | 'ecommerce-dtc'      // E-commerce / DTC brand
  | 'enterprise-b2b'     // Enterprise B2B
  | 'default';           // Fallback

/**
 * Get segment category key from segment and business type
 */
export function getSegmentCategoryKey(segmentType: SegmentType, businessType: BusinessType): SegmentCategoryKey {
  if (segmentType === 'local' && businessType === 'b2c') return 'local-b2c';
  if (segmentType === 'local' && businessType === 'b2b') return 'local-b2b';
  if (segmentType === 'regional' && businessType === 'b2b') return 'regional-agency';
  if ((segmentType === 'national' || segmentType === 'global') && businessType === 'b2b') return 'saas-b2b';
  if (businessType === 'dtc') return 'ecommerce-dtc';
  if (segmentType === 'global' && businessType === 'b2b') return 'enterprise-b2b';
  return 'default';
}

/**
 * Category-specific criteria for competitor discovery prompts
 */
export const CATEGORY_DISCOVERY_CRITERIA: Record<SegmentCategoryKey, string> = {
  'saas-b2b': `
CATEGORY-SPECIFIC CRITERIA (SaaS / B2B Software):
- Target similar company sizes (SMB/Mid-Market/Enterprise)
- Solve the same core problem or use case
- Would appear in the same G2, Capterra, or TrustRadius category
- Have overlapping integrations or tech stack
- Compete on similar pricing tiers and models
- Listed in same industry comparison articles`,

  'local-b2c': `
CATEGORY-SPECIFIC CRITERIA (Local Service B2C):
- Are within reasonable distance of the location
- Have the same Google Business primary category
- Serve similar customer demographics
- Have comparable review volumes and ratings
- Compete on same service area
- Similar price range and service level`,

  'local-b2b': `
CATEGORY-SPECIFIC CRITERIA (Local Service B2B):
- Serve same geographic service area
- Target similar business sizes (SMB, mid-market)
- Offer comparable service packages
- Have similar response time expectations
- Compete on commercial contracts
- Listed in same local business directories`,

  'regional-agency': `
CATEGORY-SPECIFIC CRITERIA (Regional B2B Agency):
- Specialize in similar service areas
- Target similar client types and sizes
- Operate in overlapping geographic markets
- Have comparable team size and expertise depth
- Compete for same types of projects and RFPs
- Listed on Clutch, UpCity, or similar platforms`,

  'ecommerce-dtc': `
CATEGORY-SPECIFIC CRITERIA (E-commerce / DTC):
- Sell similar products or solve similar problems
- Target same price point range (+/- 30%)
- Appeal to same demographic (age, income, lifestyle)
- Use similar distribution channels
- Have comparable brand positioning and aesthetic
- Compete for same social media audience`,

  'enterprise-b2b': `
CATEGORY-SPECIFIC CRITERIA (Enterprise B2B):
- Target same industry verticals
- Serve similar company sizes (enterprise, mid-market)
- Solve comparable business problems
- Have overlapping customer base or references
- Compete in same RFP processes
- Mentioned in analyst reports (Gartner, Forrester)`,

  'default': `
CATEGORY-SPECIFIC CRITERIA:
- Offer similar products or services
- Target the same customer segment
- Operate in the same market tier
- Have comparable positioning and pricing`
};

/**
 * Base competitor discovery prompt template
 */
export const COMPETITOR_DISCOVERY_PROMPT = `
You are a competitive intelligence analyst. Given a business profile, identify their top 10 direct competitors.

Business: {brand_name}
Industry: {industry}
Website: {website_url}
Location: {location}
Business Type: {business_type}

For each competitor, provide:
1. Company name (exact official name)
2. Website URL
3. Confidence score (0-1) based on how directly they compete
4. Brief reason why they're a competitor

Focus on:
- Direct competitors offering similar products/services (5-6 competitors)
- Indirect competitors targeting adjacent markets (2-3 competitors)
- Aspirational competitors / market leaders (1-2 competitors)
- Competitors in the same geographic scope ({segment_type})

Respond in valid JSON array format:
[
  {
    "name": "Competitor Name",
    "website": "https://competitor.com",
    "confidence": 0.9,
    "reason": "Why they compete"
  }
]
`;

/**
 * Enhanced competitor discovery prompt with full brand context
 */
export const ENHANCED_COMPETITOR_DISCOVERY_PROMPT = `
You are a competitive intelligence analyst. Identify up to 10 competitors for this business.

=== BRAND PROFILE ===
Business Name: {brand_name}
Industry: {industry}
Website: {brand_website}
Location: {location}

=== BRAND POSITIONING ===
Value Proposition: {unique_solution}
Key Benefit: {key_benefit}
Target Customer: {target_customer}
Description: {brand_description}

=== SEGMENT CLASSIFICATION ===
Segment: {segment_type}
Business Type: {business_type}

{category_criteria}

=== EXISTING COMPETITORS (for caliber reference) ===
{existing_competitors}

=== INSTRUCTIONS ===
Find up to 10 competitors across these categories:
1. **Direct competitors (5-6)**: Same product/service, same customer profile
2. **Indirect competitors (2-3)**: Adjacent solutions targeting same problem
3. **Aspirational/Market leaders (1-2)**: Top players in the space to learn from

Requirements:
- Compete at a SIMILAR TIER to existing competitors listed above
- Target the SAME CUSTOMER PROFILE
- Solve SIMILAR PROBLEMS or offer similar solutions
- Would realistically be compared by potential customers

Do NOT include:
- Companies already in the existing competitors list
- Companies in vastly different market tiers

For each competitor, provide:
1. Company name (exact official name)
2. Website URL (verified)
3. Confidence score (0-1) based on competitive relevance
4. Reason why they compete (be specific to the brand's positioning)

Respond in valid JSON array format:
[
  {
    "name": "Competitor Name",
    "website": "https://competitor.com",
    "confidence": 0.9,
    "reason": "Why they compete with {brand_name}"
  }
]
`;

/**
 * Enhanced competitor identification prompt for manual add flow
 */
export const ENHANCED_COMPETITOR_IDENTIFICATION_PROMPT = `
Identify and verify "{search_name}" as a potential competitor for {brand_name}.

=== BRAND CONTEXT ===
Industry: {industry}
Value Proposition: {unique_solution}
Key Benefit: {key_benefit}
Target Customer: {target_customer}
Segment: {segment_type} {business_type}

=== EXISTING COMPETITORS (for caliber reference) ===
{existing_competitors}

=== SEARCH INPUT ===
Name to identify: {search_name}
Website hint: {search_website}

=== INSTRUCTIONS ===
1. Search your knowledge to identify the company "{search_name}"
2. Verify if they compete in the same market as {brand_name}
3. Check if they target similar customers
4. Assess if they're at a similar competitive tier to existing competitors

Many companies are well-known by short names:
- "Kore" → Kore.ai (conversational AI platform)
- "Rasa" → Rasa Technologies (open source chatbot framework)
- "Intercom" → Intercom Inc (customer messaging platform)

Return this JSON structure:
{
  "found": true,
  "competitor": {
    "name": "Official Company Name",
    "website": "https://their-website.com",
    "description": "What they do (1-2 sentences)",
    "reason": "Why they compete with {brand_name}",
    "confidence": 0.85
  },
  "alternatives": [
    // If name is ambiguous, list up to 2 other companies it might refer to
  ]
}

If the company cannot be identified or doesn't compete in this market:
{
  "found": false,
  "competitor": null,
  "error": "Reason why not found or not a competitor"
}

You MUST include the "competitor" field when found=true. Respond with valid JSON only.
`;

// ============================================================================
// PHASE 10: ENHANCED COMPETITOR INSIGHTS TYPES
// ============================================================================

/**
 * Customer Voice data extracted from Reddit, reviews, and forums
 */
export interface CustomerVoice {
  pain_points: string[];
  desires: string[];
  objections: string[];
  switching_triggers: string[];
  common_phrases: string[];
  source_quotes: Array<{
    quote: string;
    source: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    relevance: number;
  }>;
}

/**
 * Narrative Dissonance - gap between marketing claims and user reality
 */
export interface NarrativeDissonance {
  gaps: Array<{
    competitor: string;
    claim: string;
    reality: string;
    opportunity: string;
  }>;
  key_insight: string;
}

/**
 * Feature Velocity - release cadence and momentum analysis
 */
export interface FeatureVelocity {
  velocity_analysis: Array<{
    competitor: string;
    cadence: 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'unknown';
    momentum: 'accelerating' | 'steady' | 'decelerating' | 'stalled';
    recent_releases: string[];
    signals: string[];
    gaps: string[];
  }>;
  opportunities: string;
}

/**
 * Pricing Intelligence
 */
export interface PricingIntel {
  competitor: string;
  model: string;
  tiers: Array<{
    name: string;
    price: string;
    features: string[];
  }>;
  arbitrage_opportunity: string;
  positioning_gap: string;
}

/**
 * Strategic Weakness
 */
export interface StrategicWeakness {
  competitor: string;
  core_vulnerability: string;
  why_hard_to_fix: string;
  attack_vector: string;
  confidence: number;
}

/**
 * SEO Metrics (from SEMrush-style data)
 */
export interface SEOMetrics {
  organic_traffic: number;
  keywords_ranking: number;
  backlinks: number;
  authority_score: number;
  top_keywords: string[];
  traffic_trend: 'up' | 'down' | 'stable';
}

/**
 * Threat Score Breakdown
 */
export interface ThreatScore {
  overall: number; // 0-100
  breakdown: {
    market_presence: number;
    feature_velocity: number;
    customer_satisfaction: number;
    pricing_pressure: number;
  };
  trend: 'increasing' | 'stable' | 'decreasing';
}

/**
 * Enhanced Competitor Insights - full intelligence package per competitor
 */
export interface EnhancedCompetitorInsights {
  competitor_id: string;
  competitor_name: string;

  // Basic profile (existing)
  profile: CompetitorProfile;
  gaps: CompetitorGap[];

  // NEW: Strategic Intelligence
  customer_voice?: CustomerVoice;
  narrative_dissonance?: NarrativeDissonance;
  feature_velocity?: FeatureVelocity;
  pricing_intel?: PricingIntel;
  strategic_weakness?: StrategicWeakness;
  seo_metrics?: SEOMetrics;
  threat_score?: ThreatScore;

  // Metadata
  last_updated: string;
  data_sources: string[];
  confidence_score: number;
}

/**
 * Battlecard - auto-generated competitive positioning
 */
export interface CompetitorBattlecard {
  competitor_name: string;
  our_advantages: string[];
  their_advantages: string[];
  key_objection_handlers: Array<{
    objection: string;
    response: string;
  }>;
  win_themes: string[];
  loss_reasons: string[];
  ideal_icp_overlap: string;
}

// ============================================================================
// PHASE 11: STREAMING & PROGRESS TYPES
// ============================================================================

/**
 * Scan phase for UI progress display
 */
export type ScanPhase =
  | 'idle'
  | 'discovering'      // Finding competitors
  | 'validating'       // Cross-validating sources
  | 'scanning'         // Fetching competitor data
  | 'extracting'       // Extracting gaps/insights
  | 'analyzing'        // Strategic analysis
  | 'complete'
  | 'error';

/**
 * Collector priority bucket
 */
export type CollectorPriority = 'fast' | 'medium' | 'slow';

/**
 * Collector status for streaming UI
 */
export interface CollectorStatus {
  name: string;
  priority: CollectorPriority;
  status: 'pending' | 'running' | 'complete' | 'error';
  progress: number;
  data_type: string;
  error?: string;
}

/**
 * Phase progress for UI display
 */
export interface PhaseProgress {
  phase: ScanPhase;
  phase_label: string;
  overall_progress: number;
  sub_tasks: Array<{
    name: string;
    status: 'pending' | 'running' | 'complete' | 'error';
    progress: number;
  }>;
  competitors_found: number;
  competitors_scanned: number;
  gaps_extracted: number;
  insights_generated: number;
  elapsed_seconds: number;
}

export const COMPETITOR_WEAKNESS_PROMPT = `
Research "{competitor_name}" ({competitor_website}) comprehensively. Find their market positioning, competitive landscape, and customer feedback.

PART 1 - MARKET POSITIONING:
1. How do they position themselves? (tagline, key messages)
2. What market segment do they target? (enterprise, SMB, startups)
3. What are their stated differentiators?
4. Who are their main competitors according to industry sources?

PART 2 - CUSTOMER SENTIMENT:
Search for real customer feedback on:
- G2, Capterra, TrustRadius reviews
- Reddit discussions (r/saas, r/chatbots, industry subreddits)
- Twitter/X complaints and praise
- LinkedIn posts and comments
- Hacker News discussions
- Quora Q&A threads

PART 3 - WEAKNESSES & GAPS:
For each weakness found, identify:
1. Negative reviews and common complaints (with exact quotes)
2. Missing features or capabilities customers ask for
3. Service/support issues mentioned
4. Pricing or value concerns
5. User experience problems
6. Integration limitations
7. Technical debt or scalability issues

For each weakness, provide a JSON object with:
- "weakness": Clear description of the issue
- "quote": Direct quote from a customer/reviewer (required)
- "source": Platform name (G2, Reddit, Capterra, etc.)
- "severity": "high" | "medium" | "low"
- "category": "feature" | "support" | "pricing" | "ux" | "integration" | "performance" | "trust"

IMPORTANT: Return at least 5-10 weaknesses with real quotes. If you cannot find enough negative feedback, also include areas where competitors are notably strong (so we know where NOT to compete).

Respond in valid JSON array format:
[
  {
    "weakness": "Limited customization options",
    "quote": "The bot builder is pretty rigid - we couldn't customize the conversation flows the way we needed",
    "source": "G2 Review",
    "severity": "high",
    "category": "feature"
  }
]
`;

export const GAP_EXTRACTION_PROMPT = `
You are a competitive positioning strategist analyzing {competitor_name} for {brand_name}.

COMPETITOR DATA:
- Positioning: {positioning_summary}
- Key claims: {key_claims}

CUSTOMER COMPLAINTS FOUND:
{complaints}

AD MESSAGING THEMES:
{ad_themes}

YOUR CLIENT'S UVP:
- Brand Name: {brand_name}
- Unique Solution: {unique_solution}
- Key Benefit: {key_benefit}
- Target Customer: {target_customer}

YOUR CLIENT'S PRODUCTS/SERVICES:
{products_list}

YOUR CLIENT'S CUSTOMER SEGMENTS:
{segments_list}

For each gap, return a JSON object with:
{
  "title": "Concise gap title (e.g., 'Steep Learning Curve for Non-Technical Users')",
  "the_void": "What {competitor_name} fails to deliver - be specific with evidence",
  "the_demand": "Evidence customers want this - include quotes from complaints",
  "your_angle": "How {brand_name} specifically addresses this via {key_benefit}",
  "gap_type": "feature-gap|service-gap|pricing-gap|support-gap|trust-gap|ux-gap|integration-gap|messaging-gap",
  "confidence": 0.0-1.0,
  "applicable_products": [
    {"product": "Exact product name from list above", "fit": "direct|partial|indirect", "why": "Why this product addresses the gap"}
  ],
  "applicable_segments": [
    {"segment": "Exact segment from list above", "readiness": "high|medium|low", "pain_point": "Specific pain for this segment"}
  ],
  "source_quotes": [
    {
      "quote": "EXACT quote from the complaints - copy verbatim",
      "source": "G2|Reddit|Capterra|Google Reviews|Yelp|TrustPilot|etc",
      "url": "https://... if available, or empty string",
      "date": "Month Year if known",
      "author": "User type if known (e.g., 'Enterprise User', 'SMB Owner')"
    }
  ]
}

CRITICAL REQUIREMENTS - READ CAREFULLY:
1. source_quotes MUST contain EXACT verbatim text from the CUSTOMER COMPLAINTS section above - DO NOT INVENT OR PARAPHRASE quotes
2. Each source_quote MUST copy the URL from the SOURCE URLS FOR CITATIONS section - match [1], [2] citation numbers
3. If a complaint says "[1] users complain about X" then quote = "users complain about X" and url = the URL after [1] in SOURCE URLS section
4. DO NOT make up quotes that don't appear in the complaints - this is a hallucination and must be avoided
5. Map applicable_products ONLY from the client's actual products list above
6. Map applicable_segments ONLY from the client's actual segments list above
7. Write your_angle specifically referencing {brand_name}'s UVP - not generic advice

VALIDATION:
- Every quote in source_quotes MUST be traceable to text in CUSTOMER COMPLAINTS section
- Every url in source_quotes MUST come from SOURCE URLS FOR CITATIONS section
- If you cannot find a real quote with a real URL, include fewer source_quotes rather than hallucinating

Respond with a valid JSON array of gaps. Extract 3-8 gaps based on evidence strength.
`;

export const GAP_EXTRACTION_PROMPT_LEGACY = `
You are a competitive positioning strategist. Analyze the competitor data and extract competitive gaps.

Competitor: {competitor_name}
Their positioning: {positioning_summary}
Their key claims: {key_claims}

Customer complaints found:
{complaints}

Their ad messaging themes:
{ad_themes}

Your client's UVP:
- Unique Solution: {unique_solution}
- Key Benefit: {key_benefit}
- Differentiation: {differentiation}

For each gap you identify, provide:
1. Title: A concise, actionable title (e.g., "Slow Implementation Times")
2. The Void: What the competitor fails to deliver (specific, with evidence)
3. The Demand: Evidence that customers want this (quotes, data)
4. Your Angle: How the client can position against this gap
5. Gap Type: One of: feature-gap, service-gap, pricing-gap, support-gap, trust-gap, ux-gap, integration-gap, messaging-gap
6. Confidence: 0-1 based on evidence strength
7. Sources: Array of {quote, source, url}

Respond in valid JSON array format.
`;

// ============================================================================
// POSITIONING MAP TYPES (Phase 3)
// ============================================================================

/**
 * Price tier classification for positioning map
 */
export type PriceTier = 'budget' | 'mid-market' | 'premium' | 'enterprise';

/**
 * Complexity level for positioning map
 */
export type ComplexityLevel = 'simple' | 'moderate' | 'complex' | 'enterprise';

/**
 * Segment-specific axis definitions
 */
export interface SegmentAxes {
  xAxis: {
    label: string;
    lowLabel: string;
    highLabel: string;
  };
  yAxis: {
    label: string;
    lowLabel: string;
    highLabel: string;
  };
}

/**
 * Segment-specific axis mappings
 * Local: convenience vs quality
 * B2B: features vs ease
 * DTC: price vs premium
 */
export const SEGMENT_AXES: Record<SegmentType, Record<BusinessType, SegmentAxes>> = {
  local: {
    b2b: {
      xAxis: { label: 'Ease of Working With', lowLabel: 'Complex', highLabel: 'Effortless' },
      yAxis: { label: 'Quality/Results', lowLabel: 'Basic', highLabel: 'Premium' }
    },
    b2c: {
      xAxis: { label: 'Convenience', lowLabel: 'Inconvenient', highLabel: 'Super Convenient' },
      yAxis: { label: 'Quality', lowLabel: 'Basic', highLabel: 'Premium' }
    },
    dtc: {
      xAxis: { label: 'Price', lowLabel: 'Budget', highLabel: 'Premium' },
      yAxis: { label: 'Experience', lowLabel: 'Basic', highLabel: 'Luxury' }
    },
    mixed: {
      xAxis: { label: 'Accessibility', lowLabel: 'Niche', highLabel: 'Mainstream' },
      yAxis: { label: 'Quality', lowLabel: 'Basic', highLabel: 'Premium' }
    }
  },
  regional: {
    b2b: {
      xAxis: { label: 'Feature Set', lowLabel: 'Essential', highLabel: 'Full Suite' },
      yAxis: { label: 'Ease of Use', lowLabel: 'Technical', highLabel: 'User-Friendly' }
    },
    b2c: {
      xAxis: { label: 'Reach', lowLabel: 'Limited', highLabel: 'Wide Coverage' },
      yAxis: { label: 'Service Quality', lowLabel: 'Standard', highLabel: 'White Glove' }
    },
    dtc: {
      xAxis: { label: 'Price Point', lowLabel: 'Value', highLabel: 'Premium' },
      yAxis: { label: 'Brand Perception', lowLabel: 'Functional', highLabel: 'Aspirational' }
    },
    mixed: {
      xAxis: { label: 'Solution Depth', lowLabel: 'Specialized', highLabel: 'Full Service' },
      yAxis: { label: 'Customer Experience', lowLabel: 'Self-Serve', highLabel: 'High Touch' }
    }
  },
  national: {
    b2b: {
      xAxis: { label: 'Feature Depth', lowLabel: 'Focused', highLabel: 'Comprehensive' },
      yAxis: { label: 'Ease of Implementation', lowLabel: 'Complex Setup', highLabel: 'Quick Start' }
    },
    b2c: {
      xAxis: { label: 'Price/Value', lowLabel: 'Budget', highLabel: 'Premium' },
      yAxis: { label: 'Brand Trust', lowLabel: 'Emerging', highLabel: 'Established' }
    },
    dtc: {
      xAxis: { label: 'Price Point', lowLabel: 'Mass Market', highLabel: 'Luxury' },
      yAxis: { label: 'Brand Identity', lowLabel: 'Commodity', highLabel: 'Lifestyle' }
    },
    mixed: {
      xAxis: { label: 'Solution Breadth', lowLabel: 'Point Solution', highLabel: 'Platform' },
      yAxis: { label: 'Market Position', lowLabel: 'Challenger', highLabel: 'Leader' }
    }
  },
  global: {
    b2b: {
      xAxis: { label: 'Enterprise Features', lowLabel: 'SMB Focus', highLabel: 'Enterprise Grade' },
      yAxis: { label: 'Implementation Complexity', lowLabel: 'Heavy Lift', highLabel: 'Turnkey' }
    },
    b2c: {
      xAxis: { label: 'Global Reach', lowLabel: 'Regional', highLabel: 'Worldwide' },
      yAxis: { label: 'Premium Tier', lowLabel: 'Standard', highLabel: 'Elite' }
    },
    dtc: {
      xAxis: { label: 'Market Positioning', lowLabel: 'Value', highLabel: 'Prestige' },
      yAxis: { label: 'Brand Recognition', lowLabel: 'Niche', highLabel: 'Global Icon' }
    },
    mixed: {
      xAxis: { label: 'Scale', lowLabel: 'Regional Player', highLabel: 'Global Leader' },
      yAxis: { label: 'Innovation', lowLabel: 'Fast Follower', highLabel: 'Category Creator' }
    }
  }
};

/**
 * Positioning data point for a single competitor
 */
export interface PositioningDataPoint {
  id: string;
  name: string;
  logoUrl?: string | null;
  xValue: number; // 0-100 normalized
  yValue: number; // 0-100 normalized
  priceTier: PriceTier;
  complexityLevel: ComplexityLevel;
  gapCount: number;
  isYourBrand: boolean;
  confidence: number;
  positioningSummary?: string;
  keyDifferentiators?: string[];
}

/**
 * Complete positioning map data
 */
export interface PositioningMapData {
  brandId: string;
  segmentType: SegmentType;
  businessType: BusinessType;
  axes: SegmentAxes;
  dataPoints: PositioningDataPoint[];
  yourBrand?: PositioningDataPoint;
  quadrantLabels: {
    topLeft: string;
    topRight: string;
    bottomLeft: string;
    bottomRight: string;
  };
  generatedAt: string;
}

/**
 * Positioning extraction request
 */
export interface PositioningExtractionRequest {
  competitorId: string;
  competitorName: string;
  website?: string | null;
  scanData?: {
    positioning_summary?: string;
    key_claims?: string[];
    pricing_model?: string;
    target_audience?: string;
  };
  reviewSentiment?: {
    averageRating?: number;
    topThemes?: string[];
  };
}

/**
 * Positioning extraction result
 */
export interface PositioningExtractionResult {
  competitorId: string;
  xValue: number;
  yValue: number;
  priceTier: PriceTier;
  complexityLevel: ComplexityLevel;
  confidence: number;
  reasoning?: string;
}

export const POSITIONING_EXTRACTION_PROMPT = `
You are a market positioning analyst. Based on the competitor data provided, determine their position on a 2D market map.

Competitor: {competitor_name}
Website: {website}
Positioning Summary: {positioning_summary}
Key Claims: {key_claims}
Pricing Model: {pricing_model}
Target Audience: {target_audience}
Review Data: Average Rating {average_rating}, Top Themes: {top_themes}

Segment Type: {segment_type}
Business Type: {business_type}

X-Axis: {x_axis_label} (0 = {x_low_label}, 100 = {x_high_label})
Y-Axis: {y_axis_label} (0 = {y_low_label}, 100 = {y_high_label})

Analyze the competitor and provide:
1. xValue: Position on X-axis (0-100)
2. yValue: Position on Y-axis (0-100)
3. priceTier: One of "budget", "mid-market", "premium", "enterprise"
4. complexityLevel: One of "simple", "moderate", "complex", "enterprise"
5. confidence: How confident you are (0-1)
6. reasoning: Brief explanation of the positioning

Respond in valid JSON format:
{
  "xValue": 65,
  "yValue": 80,
  "priceTier": "premium",
  "complexityLevel": "moderate",
  "confidence": 0.85,
  "reasoning": "Based on their premium pricing and focus on ease of use..."
}
`;
