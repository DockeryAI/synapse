// Value Forge types

// ============================================================================
// Session Management
// ============================================================================

export interface ValueForgeSession {
  id: string
  brandId: string
  status: 'active' | 'completed' | 'paused'
  data: Record<string, unknown>
}

// ============================================================================
// Core Context & State
// ============================================================================

export interface ValueForgeContext {
  // Business Intelligence Data
  businessIntel?: {
    marba_score?: number
    competitive?: {
      keywordGaps?: Array<Record<string, unknown>>
      commonApproaches?: string[]
      weaknesses?: string[]
    }
    website_analysis?: {
      valuePropositions?: string[]
      differentiators?: string[]
      problems?: string[]
      solutions?: string[]
      targetAudience?: string[]
      proofPoints?: Array<Record<string, unknown>>
    }
    reviews?: {
      positive?: string[]
      negative?: string[]
    }
    culturalSignals?: Array<Record<string, unknown>>
    trendingTopics?: Array<Record<string, unknown>>
    timingSignals?: Record<string, unknown>
    analysis?: Record<string, unknown>
    business?: {
      name?: string
      url?: string
      industry?: string
    }
    archetype?: string
  }

  // Industry Profile
  industryProfile?: {
    industryName?: string
    marketSize?: number
    idealCustomerProfiles?: Array<Record<string, unknown>>
    competitive_advantages?: Array<Record<string, unknown>>
    transformations?: Array<Record<string, unknown>>
    customerTriggers?: Array<Record<string, unknown>>
    customer_triggers?: Array<Record<string, unknown>>
    quality_indicators?: Array<Record<string, unknown>>
    value_propositions?: Array<Record<string, unknown>>
    service_packages?: Array<Record<string, unknown>>
    powerWords?: string[]
    directories?: string[]
  }

  // Business Metadata
  businessName: string
  businessUrl: string
  industryCode: string
  industryName: string

  // Detected Insights
  detectedArchetype?: string
  detectedValueProps?: string[]
  detectedDifferentiators?: string[]
  competitiveGaps?: Record<string, unknown>
  culturalSignals?: Array<Record<string, unknown>>
  trendingTopics?: Array<Record<string, unknown>>
  timingSignals?: Record<string, unknown>
  analysis?: Record<string, unknown>
}

export interface ValueForgeState {
  // Module States
  brandIdentity?: {
    skills: Skill[]
    attributes: BrandAttribute[]
  }

  brandDefinition?: {
    endResult: {
      userInput?: string
    }
    brandTasks: BrandTask[]
    painPoints: Array<Record<string, unknown>>
    pleasureGoals: Array<Record<string, unknown>>
    transformationPower?: number
  }

  personas: BuyerPersona[]

  bvpModule?: {
    bvp: {
      bvpStatement?: string
    }
    usp: {
      uspStatement?: string
    }
  }

  discoveryPaths?: {
    paths?: Record<string, unknown>
    strategy?: Record<string, unknown>
  }

  customerJourney?: {
    stages?: Record<string, unknown>
  }

  generatedUVPs?: Array<Record<string, unknown>>

  // Metadata
  completionPercentage?: number
  totalCustomizations?: number
  lastUpdated?: string
}

// ============================================================================
// Brand Identity
// ============================================================================

export interface Skill {
  name: string
  description: string
  confidence: number
  source: 'detected' | 'industry'
  marketDemand?: number
  isCore: boolean
}

export interface BrandAttribute {
  id: string
  label: string
  description: string
  category: 'personality' | 'tribe'
  selected: boolean
  alignmentScore: number
}

export interface BrandTask {
  id: string
  task: string
  selected: boolean
}

// ============================================================================
// Buyer Personas
// ============================================================================

export interface Demographics {
  ageRange: string
  income: string
  location: string
  occupation: string
}

export interface Psychographics {
  values: string[]
  lifestyle: string
  interests: string[]
  personality: string[]
}

export interface SituationalTriggers {
  triggers: string[]
  frequency: string
  timeframe: string
}

export interface PersonaMotivations {
  hopes: string[]
  needs: string[]
  dreams: string[]
  fears: string[]
}

export interface BuyerPersona {
  id: string
  name: string
  demographics: Demographics
  psychographics: Psychographics
  situational: SituationalTriggers
  motivations: PersonaMotivations
  confidence: number
  marketSize?: number
}

// ============================================================================
// Discovery Paths
// ============================================================================

export interface DiscoveryPath {
  path: 'search' | 'trust' | 'share' | 'interrupt' | 'browse'
  score: number
  strength: 'weak' | 'moderate' | 'strong'
  opportunities: string[]
  currentPerformance: string
  industryAverage: number
}

export interface DiscoveryPathsModule {
  paths: Record<string, DiscoveryPath>
  strategy?: Record<string, unknown>
}

// ============================================================================
// Customer Journey
// ============================================================================

export interface CustomerJourney {
  stages: Record<string, Record<string, unknown>>
}

// ============================================================================
// Re-analysis
// ============================================================================

export interface ReAnalysisRequest {
  customizationPoint: string
  oldValue: unknown
  newValue: unknown
  context: ValueForgeState
}

export interface ReAnalysisResult {
  impactedModules: string[]
  updatedRecommendations: Record<string, string>
  propagationNeeded: boolean
  analysisNotes: string
}

// ============================================================================
// Brand Definition
// ============================================================================

export interface BrandIdentity {
  skills: Skill[]
  attributes: BrandAttribute[]
}

export interface BrandDefinition {
  endResult: {
    userInput?: string
  }
  brandTasks: BrandTask[]
  painPoints: Array<Record<string, unknown>>
  pleasureGoals: Array<Record<string, unknown>>
  transformationPower?: number
}

export interface BVPModule {
  bvp: {
    bvpStatement?: string
  }
  usp: {
    uspStatement?: string
  }
}

// ============================================================================
// BVP Formula (Business Value Proposition)
// ============================================================================

export interface BVPFormula {
  who: string      // Target audience
  what: string     // Value delivered
  unique: string   // Unique differentiator
}

// ============================================================================
// Transformations
// ============================================================================

export interface TransformationContext {
  before: string
  after: string
  transformation: string
}
