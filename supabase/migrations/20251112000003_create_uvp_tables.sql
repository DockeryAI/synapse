-- UVP (Unique Value Proposition) Tables
-- Core tables for UVP Flow Section - standalone MIRROR component
-- Supports: UVP building, variants, A/B testing, competitive analysis

-- =====================================================
-- TABLE 1: value_statements
-- Stores UVP headline, subheadline, supporting points
-- =====================================================
CREATE TABLE IF NOT EXISTS value_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

  -- Core UVP Content
  headline TEXT NOT NULL,
  subheadline TEXT,
  supporting_points JSONB DEFAULT '[]'::jsonb, -- Array of supporting benefit statements
  call_to_action TEXT,

  -- Variant Management
  variant_name TEXT, -- e.g., "Homepage Primary", "Email Campaign", "Social Bio"
  target_persona TEXT, -- Which customer segment this targets
  context TEXT, -- Where this will be used: "website_hero", "email_signature", "linkedin_about", etc.

  -- AI-Generated Scores
  clarity_score INTEGER DEFAULT 0 CHECK (clarity_score >= 0 AND clarity_score <= 100),
  conversion_potential INTEGER DEFAULT 0 CHECK (conversion_potential >= 0 AND conversion_potential <= 100),
  synapse_score INTEGER, -- Psychological appeal score from ContentPsychologyEngine
  emotional_triggers TEXT[], -- Array of emotional triggers detected
  power_words_count INTEGER DEFAULT 0,
  jargon_count INTEGER DEFAULT 0,

  -- Problem → Solution → Outcome Structure
  problem_statement TEXT,
  solution_statement TEXT,
  outcome_statement TEXT,

  -- Status & Lifecycle
  is_primary BOOLEAN DEFAULT false, -- Only one primary UVP per brand
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'testing', 'archived')),

  -- A/B Testing
  ab_test_id UUID, -- Links to uvp_ab_tests table
  performance_data JSONB DEFAULT '{}'::jsonb, -- Actual performance metrics if deployed

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_value_statements_brand ON value_statements(brand_id);
CREATE INDEX idx_value_statements_status ON value_statements(status);
CREATE INDEX idx_value_statements_primary ON value_statements(brand_id, is_primary) WHERE is_primary = true;
CREATE INDEX idx_value_statements_context ON value_statements(context);
CREATE INDEX idx_value_statements_ab_test ON value_statements(ab_test_id) WHERE ab_test_id IS NOT NULL;

-- Partial unique constraint: only one primary UVP per brand
CREATE UNIQUE INDEX unique_primary_per_brand ON value_statements(brand_id) WHERE is_primary = true;

-- Updated at trigger
CREATE TRIGGER update_value_statements_updated_at
  BEFORE UPDATE ON value_statements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE value_statements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own value statements"
  ON value_statements FOR SELECT
  USING (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own value statements"
  ON value_statements FOR INSERT
  WITH CHECK (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own value statements"
  ON value_statements FOR UPDATE
  USING (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own value statements"
  ON value_statements FOR DELETE
  USING (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));

-- =====================================================
-- TABLE 2: uvp_components
-- Stores reusable UVP building blocks (mad libs style)
-- =====================================================
CREATE TABLE IF NOT EXISTS uvp_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

  -- Component Classification
  component_type TEXT NOT NULL CHECK (component_type IN (
    'problem',        -- Customer pain points
    'solution',       -- How you solve it
    'benefit',        -- What they gain
    'differentiator', -- Why you're unique
    'qualifier',      -- Who it's for
    'outcome',        -- End result
    'proof'           -- Social proof, stats
  )),

  -- Content
  text TEXT NOT NULL,

  -- AI-Generated Metadata
  emotional_resonance INTEGER DEFAULT 0 CHECK (emotional_resonance >= 0 AND emotional_resonance <= 10),
  clarity_score INTEGER DEFAULT 0 CHECK (clarity_score >= 0 AND clarity_score <= 100),
  category TEXT, -- Industry-specific category

  -- Usage Tracking
  usage_count INTEGER DEFAULT 0, -- How many times used in UVPs
  last_used_at TIMESTAMPTZ,

  -- Source
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'ai_generated', 'template', 'imported')),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_uvp_components_brand ON uvp_components(brand_id);
CREATE INDEX idx_uvp_components_type ON uvp_components(component_type);
CREATE INDEX idx_uvp_components_brand_type ON uvp_components(brand_id, component_type);
CREATE INDEX idx_uvp_components_source ON uvp_components(source);

-- Updated at trigger
CREATE TRIGGER update_uvp_components_updated_at
  BEFORE UPDATE ON uvp_components
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE uvp_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own uvp components"
  ON uvp_components FOR SELECT
  USING (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own uvp components"
  ON uvp_components FOR INSERT
  WITH CHECK (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own uvp components"
  ON uvp_components FOR UPDATE
  USING (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own uvp components"
  ON uvp_components FOR DELETE
  USING (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));

-- =====================================================
-- TABLE 3: uvp_ab_tests
-- Tracks A/B test configurations and predictions
-- =====================================================
CREATE TABLE IF NOT EXISTS uvp_ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

  -- Test Configuration
  test_name TEXT NOT NULL,
  hypothesis TEXT, -- What are we testing?

  -- Variants (references value_statements)
  variant_a_id UUID NOT NULL REFERENCES value_statements(id) ON DELETE CASCADE,
  variant_b_id UUID NOT NULL REFERENCES value_statements(id) ON DELETE CASCADE,
  variant_c_id UUID REFERENCES value_statements(id) ON DELETE CASCADE, -- Optional 3rd variant

  -- AI-Predicted Performance (before running test)
  predicted_winner TEXT, -- 'variant_a', 'variant_b', 'variant_c'
  prediction_confidence INTEGER CHECK (prediction_confidence >= 0 AND prediction_confidence <= 100),
  prediction_reasoning TEXT, -- Why AI thinks this will win

  -- Psychology-Based Predictions
  variant_a_synapse_score INTEGER,
  variant_b_synapse_score INTEGER,
  variant_c_synapse_score INTEGER,

  variant_a_predicted_ctr DECIMAL(5,2), -- Predicted click-through rate %
  variant_b_predicted_ctr DECIMAL(5,2),
  variant_c_predicted_ctr DECIMAL(5,2),

  variant_a_predicted_conversion DECIMAL(5,2), -- Predicted conversion rate %
  variant_b_predicted_conversion DECIMAL(5,2),
  variant_c_predicted_conversion DECIMAL(5,2),

  -- Actual Performance (if test is run in real environment)
  actual_winner TEXT, -- Actual winning variant
  variant_a_actual_ctr DECIMAL(5,2),
  variant_b_actual_ctr DECIMAL(5,2),
  variant_c_actual_ctr DECIMAL(5,2),

  variant_a_actual_conversion DECIMAL(5,2),
  variant_b_actual_conversion DECIMAL(5,2),
  variant_c_actual_conversion DECIMAL(5,2),

  -- Test Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'completed', 'cancelled')),

  -- Timeline
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_uvp_ab_tests_brand ON uvp_ab_tests(brand_id);
CREATE INDEX idx_uvp_ab_tests_status ON uvp_ab_tests(status);
CREATE INDEX idx_uvp_ab_tests_variant_a ON uvp_ab_tests(variant_a_id);
CREATE INDEX idx_uvp_ab_tests_variant_b ON uvp_ab_tests(variant_b_id);
CREATE INDEX idx_uvp_ab_tests_variant_c ON uvp_ab_tests(variant_c_id) WHERE variant_c_id IS NOT NULL;

-- Updated at trigger
CREATE TRIGGER update_uvp_ab_tests_updated_at
  BEFORE UPDATE ON uvp_ab_tests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE uvp_ab_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ab tests"
  ON uvp_ab_tests FOR SELECT
  USING (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own ab tests"
  ON uvp_ab_tests FOR INSERT
  WITH CHECK (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own ab tests"
  ON uvp_ab_tests FOR UPDATE
  USING (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own ab tests"
  ON uvp_ab_tests FOR DELETE
  USING (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));

-- =====================================================
-- COMMENTS for documentation
-- =====================================================
COMMENT ON TABLE value_statements IS 'Stores UVP variants with AI-generated scores and Problem→Solution→Outcome structure';
COMMENT ON TABLE uvp_components IS 'Reusable building blocks for mad-libs style UVP construction';
COMMENT ON TABLE uvp_ab_tests IS 'A/B test configurations with AI-predicted and actual performance metrics';

COMMENT ON COLUMN value_statements.synapse_score IS 'Psychological appeal score (0-10) from ContentPsychologyEngine analyzing 475K+ word psychology database';
COMMENT ON COLUMN value_statements.is_primary IS 'Only one primary UVP per brand - this is the main value proposition shown everywhere';
COMMENT ON COLUMN value_statements.context IS 'Deployment context: website_hero, email_signature, linkedin_about, pitch_deck, etc.';

COMMENT ON COLUMN uvp_ab_tests.prediction_confidence IS 'AI confidence level (0-100) in predicted winner based on psychology analysis';
COMMENT ON COLUMN uvp_ab_tests.variant_a_predicted_ctr IS 'Predicted click-through rate % based on emotional triggers and clarity score';
