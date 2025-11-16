/**
 * Smart Picks Type Definitions
 *
 * AI-recommended campaign suggestions with confidence scoring,
 * data provenance, and trust indicators
 *
 * Created: 2025-11-15
 */

import type { SynapseInsight } from './synapse/synapse.types'
import type { DeepContext } from './synapse/deepContext.types'

// ============================================================================
// CAMPAIGN TYPES
// ============================================================================

export type CampaignType = 'authority-builder' | 'social-proof' | 'local-pulse'

export interface CampaignTypeMetadata {
  id: CampaignType
  name: string
  description: string
  icon: string
  idealFor: string[]
  platforms: string[]
  color: string
}

export const CAMPAIGN_TYPES: Record<CampaignType, CampaignTypeMetadata> = {
  'authority-builder': {
    id: 'authority-builder',
    name: 'Authority Builder',
    description: 'Establishes industry expertise through data, insights, and thought leadership',
    icon: 'TrendingUp',
    idealFor: ['B2B services', 'Professional services', 'Consultants', 'Technical businesses'],
    platforms: ['LinkedIn', 'Twitter', 'Blog'],
    color: 'blue'
  },
  'social-proof': {
    id: 'social-proof',
    name: 'Social Proof',
    description: 'Leverages customer reviews, testimonials, and success stories',
    icon: 'Star',
    idealFor: ['Local businesses', 'E-commerce', 'Service providers', 'Restaurants'],
    platforms: ['Facebook', 'Instagram', 'Google Business'],
    color: 'yellow'
  },
  'local-pulse': {
    id: 'local-pulse',
    name: 'Local Pulse',
    description: 'Connects to local events, weather, and community moments',
    icon: 'MapPin',
    idealFor: ['Local retailers', 'Restaurants', 'Service businesses', 'Community-focused brands'],
    platforms: ['Facebook', 'Instagram', 'Nextdoor'],
    color: 'green'
  }
}

// ============================================================================
// SMART PICK
// ============================================================================

export interface SmartPick {
  /** Unique identifier */
  id: string

  /** Campaign type this belongs to */
  campaignType: CampaignType

  /** Human-readable title for the pick */
  title: string

  /** The core insight combination */
  insights: SynapseInsight[]

  /** Preview of generated content */
  preview: {
    headline: string
    hook: string
    platform: string
  }

  /** Confidence score (0-1) */
  confidence: number

  /** Relevance score (0-1) */
  relevance: number

  /** Timeliness score (0-1) - how timely is this content */
  timeliness: number

  /** Evidence quality score (0-1) */
  evidenceQuality: number

  /** Overall pick score (weighted combination) */
  overallScore: number

  /** Data sources used */
  dataSources: DataSourceInfo[]

  /** Explanation of why this is recommended */
  reasoning: string

  /** Expected performance indicators */
  expectedPerformance: {
    engagement: 'low' | 'medium' | 'high'
    reach: 'low' | 'medium' | 'high'
    conversions: 'low' | 'medium' | 'high'
  }

  /** Metadata */
  metadata: {
    generatedAt: Date
    expiresAt?: Date // For time-sensitive picks
  }
}

// ============================================================================
// DATA SOURCE INFO
// ============================================================================

export interface DataSourceInfo {
  /** Source name */
  source: 'weather' | 'reviews' | 'trends' | 'news' | 'competitors' | 'reddit' | 'youtube' | 'location' | 'industry' | 'semrush'

  /** Icon name for UI */
  icon: string

  /** Display label */
  label: string

  /** Is this data verified/trusted */
  verified: boolean

  /** Data freshness */
  freshness: 'real-time' | 'hourly' | 'daily' | 'weekly' | 'static'

  /** Number of data points from this source */
  dataPoints: number
}

// ============================================================================
// SMART PICK GENERATION OPTIONS
// ============================================================================

export interface SmartPickGenerationOptions {
  /** Maximum number of picks to generate */
  maxPicks?: number

  /** Minimum confidence threshold (0-1) */
  minConfidence?: number

  /** Filter by campaign type */
  campaignType?: CampaignType

  /** Prefer time-sensitive content */
  preferTimely?: boolean

  /** Include preview generation */
  includePreview?: boolean
}

// ============================================================================
// SMART PICK GENERATION RESULT
// ============================================================================

export interface SmartPickGenerationResult {
  /** Generated picks */
  picks: SmartPick[]

  /** Context used for generation */
  context: DeepContext

  /** Generation metadata */
  metadata: {
    totalCandidates: number
    picksGenerated: number
    generationTimeMs: number
    strategiesUsed: string[]
  }
}

// ============================================================================
// SCORING WEIGHTS
// ============================================================================

export interface ScoringWeights {
  /** Weight for relevance (0-1) */
  relevance: number

  /** Weight for timeliness (0-1) */
  timeliness: number

  /** Weight for evidence quality (0-1) */
  evidenceQuality: number

  /** Weight for confidence (0-1) */
  confidence: number
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  relevance: 0.35,
  timeliness: 0.25,
  evidenceQuality: 0.25,
  confidence: 0.15
}
