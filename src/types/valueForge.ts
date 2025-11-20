// Value Forge types

// ============================================================================
// Session Management
// ============================================================================

export interface ValueForgeSession {
  id: string
  brandId: string
  status: 'active' | 'completed' | 'paused'
  data: any
}

// ============================================================================
// Core Context & State
// ============================================================================

export interface ValueForgeContext {
  // Business Intelligence Data
  businessIntel?: {
    marba_score?: number
    competitive?: {
      keywordGaps?: any[]
      commonApproaches?: string[]
      weaknesses?: string[]
    }
    website_analysis?: {
      valuePropositions?: string[]
      differentiators?: string[]
      problems?: string[]
      solutions?: string[]
      targetAudience?: string[]
      proofPoints?: any[]
    }
    reviews?: {
      positive?: string[]
      negative?: string[]
    }
    culturalSignals?: any[]
    trendingTopics?: any[]
    timingSignals?: any
    analysis?: any
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
    idealCustomerProfiles?: any[]
    competitive_advantages?: any[]
    transformations?: any[]
    customerTriggers?: any[]
    customer_triggers?: any[]
    quality_indicators?: any[]
    value_propositions?: any[]
    service_packages?: any[]
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
  competitiveGaps?: any
  culturalSignals?: any[]
  trendingTopics?: any[]
  timingSignals?: any
  analysis?: any
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
    painPoints: any[]
    pleasureGoals: any[]
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
    paths?: any
    strategy?: any
  }

  customerJourney?: {
    stages?: any
  }

  generatedUVPs?: any[]

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
  strategy?: any
}

// ============================================================================
// Customer Journey
// ============================================================================

export interface CustomerJourney {
  stages: Record<string, any>
}

// ============================================================================
// Re-analysis
// ============================================================================

export interface ReAnalysisRequest {
  customizationPoint: string
  oldValue: any
  newValue: any
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
  painPoints: any[]
  pleasureGoals: any[]
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
