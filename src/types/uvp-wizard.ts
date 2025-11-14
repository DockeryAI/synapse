/**
 * UVP Wizard Type Definitions
 *
 * Comprehensive type system for the UVP (Unique Value Proposition) wizard,
 * including drag-and-drop interfaces, wizard steps, API responses, and validation.
 */

// ============================================================================
// Core UVP Types
// ============================================================================

/**
 * The complete UVP structure - the main data model
 */
export interface UVP {
  id: string
  brand_id: string

  // Core UVP components
  target_customer: string
  customer_problem: string
  unique_solution: string
  key_benefit: string
  differentiation: string

  // Additional metadata
  industry: string
  competitors: string[]

  // Scoring and validation
  score?: number
  quality_assessment?: QualityAssessment

  // Timestamps
  created_at: string
  updated_at: string

  // Status
  is_complete: boolean
  current_step?: WizardStep
}

/**
 * Quality assessment from AI scoring
 */
export interface QualityAssessment {
  overall_score: number
  clarity_score: number
  specificity_score: number
  differentiation_score: number
  impact_score: number

  strengths: string[]
  improvements: string[]
  suggestions: string[]

  assessed_at: string
}

// ============================================================================
// Wizard Flow Types
// ============================================================================

/**
 * All available wizard steps
 */
export type WizardStep =
  | 'welcome'
  | 'target-customer'
  | 'customer-problem'
  | 'unique-solution'
  | 'key-benefit'
  | 'differentiation'
  | 'review'
  | 'complete'

/**
 * Wizard step configuration
 */
export interface WizardStepConfig {
  id: WizardStep
  title: string
  subtitle: string
  description: string
  icon: string
  order: number

  // Field configuration
  field_name: keyof UVP
  placeholder: string
  helper_text: string

  // Validation
  required: boolean
  min_length?: number
  max_length?: number

  // AI enhancement
  supports_ai_suggestions: boolean
  suggestion_prompt?: string
}

/**
 * Wizard progress and state
 */
export interface WizardProgress {
  current_step: WizardStep
  completed_steps: WizardStep[]
  total_steps: number
  progress_percentage: number

  // Validation state
  is_valid: boolean
  validation_errors: Record<string, string[]>

  // Can navigate
  can_go_back: boolean
  can_go_forward: boolean
  can_submit: boolean
}

// ============================================================================
// Drag-and-Drop Types
// ============================================================================

/**
 * Draggable suggestion item
 */
export interface DraggableSuggestion {
  id: string
  content: string
  type: SuggestionType
  source: SuggestionSource

  // Metadata
  confidence?: number
  tags?: string[]

  // State
  is_selected: boolean
  is_customizable: boolean
}

/**
 * Type of suggestion
 */
export type SuggestionType =
  | 'customer-segment'
  | 'problem'
  | 'solution'
  | 'benefit'
  | 'differentiator'
  | 'competitor'

/**
 * Source of suggestion
 */
export type SuggestionSource =
  | 'industry-profile'
  | 'competitor-analysis'
  | 'ai-generated'
  | 'user-custom'

/**
 * Drop zone configuration
 */
export interface DropZone {
  id: string
  accepts: SuggestionType[]
  max_items?: number

  // Visual state
  is_active: boolean
  is_over: boolean
  can_drop: boolean

  // Current contents
  items: DraggableSuggestion[]
}

/**
 * Drag event data
 */
export interface DragData {
  suggestion: DraggableSuggestion
  source_zone: string
  target_zone?: string

  // Interaction state
  is_dragging: boolean
  drag_offset: { x: number; y: number }
}

// ============================================================================
// API Integration Types
// ============================================================================

/**
 * Perplexity API request for industry insights
 */
export interface PerplexityRequest {
  query: string
  context?: {
    industry?: string
    brand_name?: string
    competitors?: string[]
  }
  max_results?: number
}

/**
 * Perplexity API response
 */
export interface PerplexityResponse {
  insights: string[]
  sources: Array<{
    title: string
    url: string
    excerpt: string
  }>
  confidence: number
}

/**
 * Rhodes AI (Claude) request for UVP enhancement
 */
export interface RhodesAIRequest {
  prompt: string
  context: Partial<UVP>
  action: 'enhance' | 'score' | 'suggest' | 'validate'
}

/**
 * Rhodes AI response
 */
export interface RhodesAIResponse {
  enhanced_text?: string
  suggestions?: string[]
  score?: number
  validation?: {
    is_valid: boolean
    errors: string[]
    warnings: string[]
  }
}

/**
 * SerpAPI request for competitor research
 */
export interface SerpAPIRequest {
  query: string
  location?: string
  num_results?: number
}

/**
 * SerpAPI response
 */
export interface SerpAPIResponse {
  competitors: Array<{
    name: string
    domain: string
    description: string
    rank: number
  }>
  related_searches: string[]
}

/**
 * UVP Scoring request
 */
export interface UVPScoringRequest {
  uvp: Partial<UVP>
  industry: string
  competitors?: string[]
}

/**
 * UVP Scoring response
 */
export interface UVPScoringResponse {
  score: number
  assessment: QualityAssessment
  recommendations: Array<{
    field: keyof UVP
    suggestion: string
    priority: 'high' | 'medium' | 'low'
  }>
}

// ============================================================================
// Suggestion Generation Types
// ============================================================================

/**
 * Request for AI-generated suggestions
 */
export interface SuggestionGenerationRequest {
  step: WizardStep
  current_uvp: Partial<UVP>
  industry: string
  user_input?: string
}

/**
 * Response with generated suggestions
 */
export interface SuggestionGenerationResponse {
  suggestions: DraggableSuggestion[]
  context: string
  confidence: number
}

/**
 * Industry-based suggestion
 */
export interface IndustrySuggestion {
  id: string
  industry: string
  category: SuggestionType
  templates: string[]
  examples: string[]
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Validation rule
 */
export interface ValidationRule {
  field: keyof UVP
  type: 'required' | 'min-length' | 'max-length' | 'pattern' | 'custom'
  value?: any
  message: string
  validator?: (value: any) => boolean
}

/**
 * Validation result
 */
export interface ValidationResult {
  is_valid: boolean
  errors: Record<string, string[]>
  warnings: Record<string, string[]>
  field_statuses: Record<string, FieldValidationStatus>
}

/**
 * Field validation status
 */
export type FieldValidationStatus =
  | 'valid'
  | 'invalid'
  | 'warning'
  | 'pending'
  | 'untouched'

// ============================================================================
// Context and State Management Types
// ============================================================================

/**
 * UVP Wizard context state
 */
export interface UVPWizardContext {
  // Core state
  uvp: Partial<UVP>
  progress: WizardProgress

  // UI state
  is_loading: boolean
  is_saving: boolean
  show_suggestions: boolean

  // Suggestions
  available_suggestions: DraggableSuggestion[]
  selected_suggestions: DraggableSuggestion[]

  // Validation
  validation: ValidationResult

  // Actions
  updateField: (field: keyof UVP, value: any) => void
  goToStep: (step: WizardStep) => void
  goNext: () => void
  goBack: () => void
  generateSuggestions: () => Promise<void>
  addSuggestion: (suggestion: DraggableSuggestion) => void
  removeSuggestion: (id: string) => void
  saveUVP: () => Promise<void>
  scoreUVP: () => Promise<void>
  reset: () => void
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * UVP Wizard props
 */
export interface UVPWizardProps {
  brandId: string
  brandData?: any
  onComplete?: (uvp: UVP) => void
  onCancel?: () => void
  initialStep?: WizardStep
  initialUVP?: Partial<UVP>
}

/**
 * Wizard step component props
 */
export interface WizardStepProps {
  step: WizardStepConfig
  uvp: Partial<UVP>
  suggestions: DraggableSuggestion[]
  onFieldChange: (field: keyof UVP, value: any) => void
  onNext: () => void
  onBack: () => void
  onGenerateSuggestions: () => void
  validation: ValidationResult
}

/**
 * Suggestion panel props
 */
export interface SuggestionPanelProps {
  suggestions: DraggableSuggestion[]
  type: SuggestionType
  onSelect: (suggestion: DraggableSuggestion) => void
  onCustomize: (suggestion: DraggableSuggestion) => void
  onGenerate: () => void
  isLoading?: boolean
}

/**
 * Drop zone props
 */
export interface DropZoneProps {
  zone: DropZone
  onDrop: (suggestion: DraggableSuggestion) => void
  onRemove: (id: string) => void
  placeholder?: string
  className?: string
}

/**
 * Real-time scoring display props
 */
export interface RealTimeScoringProps {
  uvp: Partial<UVP>
  score?: number
  assessment?: QualityAssessment
  onRequestScore: () => void
  isScoring?: boolean
}

/**
 * Venn diagram props
 */
export interface VennDiagramProps {
  customerNeeds: string[]
  companyStrengths: string[]
  marketOpportunities: string[]
  sweetSpot?: string
  className?: string
}

// ============================================================================
// Export all types
// ============================================================================

export type {
  // Ensure all types are exported
}
