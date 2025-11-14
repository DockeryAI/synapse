// Type definitions for UVP (Unique Value Proposition) Flow Section
// Mirrors database schema from 20251112000003_create_uvp_tables.sql

// =====================================================
// Core UVP Types
// =====================================================

/**
 * Status lifecycle for value statements
 */
export type ValueStatementStatus = 'draft' | 'active' | 'testing' | 'archived';

/**
 * Context where the UVP will be deployed
 */
export type UVPContext =
  | 'website_hero'
  | 'website_about'
  | 'email_signature'
  | 'linkedin_about'
  | 'linkedin_headline'
  | 'twitter_bio'
  | 'pitch_deck'
  | 'sales_sheet'
  | 'proposal'
  | 'ad_copy'
  | 'landing_page'
  | 'product_description'
  | 'app_store_listing';

/**
 * Main value statement (UVP) interface
 * Represents a complete value proposition with scoring and P→S→O structure
 */
export interface ValueStatement {
  id: string;
  brand_id: string;

  // Core UVP Content
  headline: string;
  subheadline?: string;
  supporting_points: string[]; // Array of benefit statements
  call_to_action?: string;

  // Variant Management
  variant_name?: string; // e.g., "Homepage Primary", "Email Campaign"
  target_persona?: string; // Which customer segment this targets
  context?: UVPContext; // Where this will be used

  // AI-Generated Scores (0-100 scale)
  clarity_score: number;
  conversion_potential: number;
  synapse_score?: number; // Psychological appeal from ContentPsychologyEngine (0-10)
  emotional_triggers?: string[]; // Detected emotional triggers
  power_words_count: number;
  jargon_count: number;

  // Problem → Solution → Outcome Structure
  problem_statement?: string;
  solution_statement?: string;
  outcome_statement?: string;

  // WWH (Why, What, How) Framework Enhancement
  purpose_statement?: string; // WHY: Brand purpose and reason for existing
  unique_approach?: string[]; // HOW: Array of differentiators and unique methods
  core_offerings?: string[]; // WHAT: Array of products/services/value props

  // Status & Lifecycle
  is_primary: boolean; // Only one primary UVP per brand
  status: ValueStatementStatus;

  // A/B Testing
  ab_test_id?: string; // Links to UVPABTest
  performance_data?: UVPPerformanceData; // Actual performance if deployed

  // Metadata
  created_at: string;
  updated_at: string;
}

/**
 * Performance data for deployed UVPs
 */
export interface UVPPerformanceData {
  impressions?: number;
  clicks?: number;
  conversions?: number;
  ctr?: number; // Click-through rate %
  conversion_rate?: number; // Conversion rate %
  bounce_rate?: number;
  time_on_page?: number; // seconds
  deployed_at?: string;
  last_measured_at?: string;
}

// =====================================================
// UVP Component Types (Mad Libs Building Blocks)
// =====================================================

/**
 * Component types for mad-libs style UVP construction
 */
export type UVPComponentType =
  | 'problem'        // Customer pain points
  | 'solution'       // How you solve it
  | 'benefit'        // What they gain
  | 'differentiator' // Why you're unique
  | 'qualifier'      // Who it's for
  | 'outcome'        // End result
  | 'proof';         // Social proof, stats

/**
 * Source of the component
 */
export type ComponentSource = 'manual' | 'ai_generated' | 'template' | 'imported';

/**
 * Reusable UVP building block
 */
export interface UVPComponent {
  id: string;
  brand_id: string;

  // Component Classification
  component_type: UVPComponentType;

  // Content
  text: string;

  // AI-Generated Metadata
  emotional_resonance: number; // 0-10 scale
  clarity_score: number; // 0-100 scale
  category?: string; // Industry-specific category

  // Usage Tracking
  usage_count: number; // How many times used in UVPs
  last_used_at?: string;

  // Source
  source: ComponentSource;

  // Metadata
  created_at: string;
  updated_at: string;
}

// =====================================================
// A/B Testing Types
// =====================================================

/**
 * Status of an A/B test
 */
export type ABTestStatus = 'draft' | 'running' | 'completed' | 'cancelled';

/**
 * Winner designation
 */
export type ABTestWinner = 'variant_a' | 'variant_b' | 'variant_c';

/**
 * A/B test configuration with AI predictions
 */
export interface UVPABTest {
  id: string;
  brand_id: string;

  // Test Configuration
  test_name: string;
  hypothesis?: string; // What are we testing?

  // Variants (references ValueStatement IDs)
  variant_a_id: string;
  variant_b_id: string;
  variant_c_id?: string; // Optional 3rd variant

  // AI-Predicted Performance (before running test)
  predicted_winner?: ABTestWinner;
  prediction_confidence?: number; // 0-100
  prediction_reasoning?: string; // Why AI thinks this will win

  // Psychology-Based Predictions
  variant_a_synapse_score?: number;
  variant_b_synapse_score?: number;
  variant_c_synapse_score?: number;

  variant_a_predicted_ctr?: number; // %
  variant_b_predicted_ctr?: number;
  variant_c_predicted_ctr?: number;

  variant_a_predicted_conversion?: number; // %
  variant_b_predicted_conversion?: number;
  variant_c_predicted_conversion?: number;

  // Actual Performance (if test is run)
  actual_winner?: ABTestWinner;
  variant_a_actual_ctr?: number;
  variant_b_actual_ctr?: number;
  variant_c_actual_ctr?: number;

  variant_a_actual_conversion?: number;
  variant_b_actual_conversion?: number;
  variant_c_actual_conversion?: number;

  // Test Status
  status: ABTestStatus;

  // Timeline
  started_at?: string;
  completed_at?: string;

  // Metadata
  created_at: string;
  updated_at: string;
}

/**
 * Complete A/B test with full variant data
 */
export interface UVPABTestWithVariants extends UVPABTest {
  variant_a: ValueStatement;
  variant_b: ValueStatement;
  variant_c?: ValueStatement;
}

// =====================================================
// UVP Builder Form Types
// =====================================================

/**
 * Form data for creating/editing a value statement
 */
export interface ValueStatementFormData {
  headline: string;
  subheadline?: string;
  supporting_points: string[];
  call_to_action?: string;
  variant_name?: string;
  target_persona?: string;
  context?: UVPContext;
  problem_statement?: string;
  solution_statement?: string;
  outcome_statement?: string;
  purpose_statement?: string; // WWH: WHY
  unique_approach?: string[]; // WWH: HOW
  core_offerings?: string[]; // WWH: WHAT
  status?: ValueStatementStatus;
}

/**
 * Pre-built UVP formula template
 */
export interface UVPFormula {
  id: string;
  name: string;
  description: string;
  template: string; // e.g., "We help [qualifier] [benefit] by [solution]"
  placeholders: {
    key: string;
    label: string;
    component_type: UVPComponentType;
    example: string;
  }[];
  industry_tags: string[];
  best_for: string[]; // Use cases
}

/**
 * Industry-specific UVP template
 */
export interface UVPTemplate {
  id: string;
  name: string;
  industry: string;
  headline_template: string;
  subheadline_template?: string;
  supporting_points_templates: string[];
  examples: {
    brand_name: string;
    headline: string;
    subheadline?: string;
  }[];
  when_to_use: string;
}

// =====================================================
// UVP Analysis & Scoring Types
// =====================================================

/**
 * Real-time UVP score breakdown
 */
export interface UVPScoreBreakdown {
  overall_score: number; // 0-100

  // Individual component scores
  clarity_score: number; // 0-100
  conversion_potential: number; // 0-100
  synapse_score: number; // 0-10
  emotional_impact: number; // 0-100

  // Detailed metrics
  word_count: number;
  character_count: number;
  reading_level: string; // e.g., "Grade 8"
  power_words_count: number;
  power_words: string[];
  jargon_count: number;
  jargon_words: string[];
  emotional_triggers: string[];

  // Specific feedback
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

/**
 * Competitive UVP comparison
 */
export interface CompetitiveUVPAnalysis {
  brand_uvp: ValueStatement;
  competitor_uvps: {
    competitor_name: string;
    website?: string;
    uvp_text: string;
    clarity_score: number;
    differentiation_score: number;
    emotional_impact: number;
    strengths: string[];
  }[];
  differentiation_opportunities: string[];
  market_positioning: {
    uniqueness_score: number; // 0-100
    overlap_areas: string[];
    white_space_opportunities: string[];
  };
}

/**
 * Brand health impact from UVP changes
 */
export interface UVPBrandHealthImpact {
  current_clarity_score: number;
  projected_clarity_score: number;
  impact_delta: number;
  impact_percentage: number;
  affected_metrics: {
    metric_name: string;
    current_score: number;
    projected_score: number;
    delta: number;
  }[];
}

// =====================================================
// UVP Flow UI State Types
// =====================================================

/**
 * Active tab in UVP Flow section
 */
export type UVPFlowTab =
  | 'builder'       // Main UVP builder
  | 'formulas'      // Pre-built formulas
  | 'templates'     // Industry templates
  | 'variants'      // Variant manager
  | 'testing'       // A/B test predictor
  | 'competitive'   // Competitive analysis
  | 'library';      // All UVPs

/**
 * UVP builder mode
 */
export type UVPBuilderMode =
  | 'canvas'        // Mad-libs style dropdowns
  | 'flow'          // P→S→O visual flow
  | 'freeform';     // Direct text entry

/**
 * UVP Context state for React Context
 */
export interface UVPContextState {
  // Current data
  statements: ValueStatement[];
  components: UVPComponent[];
  abTests: UVPABTest[];

  // Selected items
  selectedStatement: ValueStatement | null;
  selectedTest: UVPABTest | null;

  // UI state
  activeTab: UVPFlowTab;
  builderMode: UVPBuilderMode;
  isGenerating: boolean;
  isScoring: boolean;

  // Loading states
  isLoadingStatements: boolean;
  isLoadingComponents: boolean;
  isLoadingTests: boolean;

  // Filters
  statusFilter: ValueStatementStatus | 'all';
  contextFilter: UVPContext | 'all';
}

/**
 * UVP Context actions
 */
export interface UVPContextActions {
  // Value Statement CRUD
  createStatement: (data: ValueStatementFormData) => Promise<ValueStatement>;
  updateStatement: (id: string, data: Partial<ValueStatementFormData>) => Promise<ValueStatement>;
  deleteStatement: (id: string) => Promise<void>;
  setAsPrimary: (id: string) => Promise<void>;
  duplicateStatement: (id: string) => Promise<ValueStatement>;

  // Component CRUD
  createComponent: (component: Omit<UVPComponent, 'id' | 'created_at' | 'updated_at'>) => Promise<UVPComponent>;
  updateComponent: (id: string, updates: Partial<UVPComponent>) => Promise<UVPComponent>;
  deleteComponent: (id: string) => Promise<void>;

  // A/B Test CRUD
  createABTest: (test: Omit<UVPABTest, 'id' | 'created_at' | 'updated_at'>) => Promise<UVPABTest>;
  updateABTest: (id: string, updates: Partial<UVPABTest>) => Promise<UVPABTest>;
  deleteABTest: (id: string) => Promise<void>;

  // AI Actions
  generateUVP: (prompt: string) => Promise<ValueStatement>;
  generateVariants: (statementId: string, count: number) => Promise<ValueStatement[]>;
  scoreStatement: (statement: ValueStatementFormData) => Promise<UVPScoreBreakdown>;
  predictABTest: (testId: string) => Promise<UVPABTest>;

  // UI Actions
  setActiveTab: (tab: UVPFlowTab) => void;
  setBuilderMode: (mode: UVPBuilderMode) => void;
  selectStatement: (statement: ValueStatement | null) => void;
  selectTest: (test: UVPABTest | null) => void;
  setStatusFilter: (status: ValueStatementStatus | 'all') => void;
  setContextFilter: (context: UVPContext | 'all') => void;

  // Refresh actions
  refreshStatements: () => Promise<void>;
  refreshComponents: () => Promise<void>;
  refreshTests: () => Promise<void>;
}

// =====================================================
// Export/Share Types
// =====================================================

/**
 * Export format options
 */
export type UVPExportFormat = 'pdf' | 'pptx' | 'docx' | 'html' | 'json' | 'csv';

/**
 * Export configuration
 */
export interface UVPExportConfig {
  format: UVPExportFormat;
  include_primary: boolean;
  include_variants: boolean;
  include_scores: boolean;
  include_competitive_analysis: boolean;
  include_ab_tests: boolean;
  brand_colors?: {
    primary: string;
    secondary: string;
  };
}

// =====================================================
// Helper Types
// =====================================================

/**
 * Validation result for UVP
 */
export interface UVPValidationResult {
  isValid: boolean;
  errors: {
    field: string;
    message: string;
  }[];
  warnings: {
    field: string;
    message: string;
  }[];
}

/**
 * AI generation request
 */
export interface UVPGenerationRequest {
  brand_id: string;
  brand_context: {
    industry: string;
    target_audience: string;
    key_benefits: string[];
    differentiators: string[];
  };
  generation_type: 'new' | 'variant' | 'improvement';
  base_statement_id?: string; // For variants/improvements
  additional_instructions?: string;
}

/**
 * AI generation response
 */
export interface UVPGenerationResponse {
  statements: ValueStatementFormData[];
  reasoning: string;
  confidence_score: number; // 0-100
  suggestions: string[];
}
