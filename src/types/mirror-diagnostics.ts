/**
 * Mirror Diagnostics Type Definitions
 * Matches database schema in supabase/migrations/20251113000002_create_mirror_diagnostics.sql
 */

// ============================================================================
// Business Model Detection Types
// ============================================================================

export type BusinessModel =
  | 'solo-practitioner'  // One person operation
  | 'small-local'        // 2-10 employees, single location
  | 'multi-location'     // Multiple physical locations, regional presence
  | 'regional'           // Regional presence, established brand
  | 'national'           // National presence, multiple states
  | 'enterprise'         // Large corporation, international presence

export interface BusinessModelDetection {
  model: BusinessModel
  confidence: number // 0-100
  signals: string[] // What indicated this classification
}

// ============================================================================
// Market Position Types
// ============================================================================

export interface Competitor {
  name: string
  url?: string
  positioning: string
  strengths: string[]
  business_model?: BusinessModel
  size_indicator?: string // e.g., "National chain", "Local business"
}

export interface CompetitiveGap {
  gap: string
  impact: string
  competitors_doing: string[]
}

export interface PricingPosition {
  tier: 'budget' | 'mid-market' | 'premium' | 'luxury'
  vs_market: string
}

export interface KeywordRankingSimple {
  keyword: string
  position: number
  searchVolume?: number
  difficulty?: number
  traffic?: number
  trend?: 'rising' | 'stable' | 'declining'
}

export interface MarketPositionData {
  current_rank: number
  total_competitors: number
  top_competitors: Competitor[]
  keyword_rankings: Record<string, number> // keyword -> rank (legacy, simple format)
  keyword_rankings_detailed?: KeywordRankingSimple[] // New: detailed format with volume/difficulty/trend
  competitive_gaps: CompetitiveGap[]
  pricing_position: PricingPosition
}

// ============================================================================
// Customer Truth Types
// ============================================================================

export interface Demographic {
  age: string
  income: string
  location: string
}

export interface WhyTheyChose {
  reason: string
  percentage: number
  source: 'reviews' | 'surveys' | 'analytics'
}

export interface BuyerJourneyGap {
  stage: 'awareness' | 'consideration' | 'purchase' | 'loyalty'
  gap: string
  impact: string
}

export interface CustomerTruthData {
  expected_demographic: Demographic
  actual_demographic: Demographic
  match_percentage: number
  why_they_choose: WhyTheyChose[]
  common_objections: string[]
  buyer_journey_gaps: BuyerJourneyGap[]
  price_vs_value_perception: string
}

// ============================================================================
// Brand Fit Types
// ============================================================================

export interface TouchpointMessage {
  message: string
  alignment: number // 0-100
}

export interface TouchpointAnalysis {
  website: TouchpointMessage
  google: TouchpointMessage
  social: TouchpointMessage
  reviews: TouchpointMessage & { perceived_as: string }
}

export interface ClarityIssue {
  issue: string
  touchpoint: string
  fix: string
}

export interface TrustSignals {
  reviews_count: number
  average_rating: number
  social_proof: string[]
}

export interface BrandFitData {
  messaging_consistency: number // 0-100
  touchpoint_analysis: TouchpointAnalysis
  perceived_positioning: string
  differentiation_score: number // 0-100
  clarity_issues: ClarityIssue[]
  trust_signals: TrustSignals
}

// ============================================================================
// Critical Gaps Types
// ============================================================================

export interface CriticalGap {
  priority: 1 | 2 | 3
  gap: string
  impact: string
  fix: string
  fix_action_link: string // e.g., "/roadmap#uvp-flow"
}

// ============================================================================
// UVP Delivery Types (Post-UVP only)
// ============================================================================

export interface AlignmentMetrics {
  messaging: number // 0-100
  reviews: number // 0-100
  search: number // 0-100
}

export interface DifferentiationProof {
  claim: string
  validated: boolean
  evidence: string
}

export interface AlignmentGap {
  area: string
  gap: string
  recommendation: string
}

export interface UVPDeliveryAnalysis {
  uvp_promise: string
  delivery_score: number // 0-100
  customer_confirmation_percentage: number
  alignment_metrics: AlignmentMetrics
  uvp_keyword_rankings: Record<string, number>
  differentiation_proof: DifferentiationProof[]
  nps_before: number | null
  nps_after: number | null
  alignment_gaps: AlignmentGap[]
}

// ============================================================================
// Main Diagnostic Type
// ============================================================================

export interface MirrorDiagnostic {
  id: string
  brand_id: string

  // Scores
  market_position_score: number
  customer_match_score: number
  brand_clarity_score: number
  overall_health_score: number

  // Analysis Data
  market_position_data: MarketPositionData
  customer_truth_data: CustomerTruthData
  brand_fit_data: BrandFitData
  critical_gaps: CriticalGap[]

  // Post-UVP Enhancement (null pre-UVP)
  uvp_delivery_analysis: UVPDeliveryAnalysis | null

  // Metadata
  has_completed_uvp: boolean
  analyzed_at: string
  updated_at: string
  created_at: string
}

// ============================================================================
// Service Input/Output Types
// ============================================================================

export interface BrandData {
  name: string
  industry: string
  location?: string
  website?: string
  competitors?: string[]
  target_audience?: string
  size?: string // e.g., "1-10 employees"
  founded?: string
}

export interface MarketPositionAnalysis {
  score: number
  data: MarketPositionData
}

export interface CustomerTruthAnalysis {
  score: number
  data: CustomerTruthData
}

export interface BrandFitAnalysis {
  score: number
  data: BrandFitData
}

// ============================================================================
// UI Component Props
// ============================================================================

export interface ScoreStatus {
  score: number
  status: 'excellent' | 'good' | 'needs-work' | 'critical'
  color: string
}

export interface DiagnosticSectionProps {
  brandId: string
  brandData?: BrandData
  hasCompletedUVP: boolean
  className?: string
}

// ============================================================================
// Helper Functions
// ============================================================================

export const getScoreStatus = (score: number): ScoreStatus => {
  if (score >= 80) return { score, status: 'excellent', color: 'text-green-600' }
  if (score >= 60) return { score, status: 'good', color: 'text-blue-600' }
  if (score >= 40) return { score, status: 'needs-work', color: 'text-yellow-600' }
  return { score, status: 'critical', color: 'text-red-600' }
}

export const calculateOverallHealthScore = (
  marketScore: number,
  customerScore: number,
  brandScore: number
): number => {
  // Weighted average: Market 30%, Customer 40%, Brand 30%
  return Math.round(marketScore * 0.3 + customerScore * 0.4 + brandScore * 0.3)
}
