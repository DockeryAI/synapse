// Value Forge types stub
export interface ValueForgeSession {
  id: string
  brandId: string
  status: 'active' | 'completed' | 'paused'
  data: any
}

export interface TransformationContext {
  before: string
  after: string
  transformation: string
}

export interface Psychographics {
  values: string[]
  interests: string[]
}

export interface SituationalTriggers {
  triggers: string[]
}

export interface PersonaMotivations {
  motivations: string[]
}

export interface ValueForgeContext {
  brand: any
  data: any
}

export interface ValueForgeState {
  id: string
  status: string
}

export interface Skill {
  id: string
  name: string
}

export interface ReAnalysisRequest {
  id: string
}

export interface ReAnalysisResult {
  success: boolean
}

export interface BrandIdentity {
  name: string
}

export interface BrandDefinition {
  description: string
}

export interface BuyerPersona {
  name: string
}

export interface BVPModule {
  id: string
}

export interface DiscoveryPathsModule {
  paths: string[]
}

export interface CustomerJourney {
  stages: string[]
}
