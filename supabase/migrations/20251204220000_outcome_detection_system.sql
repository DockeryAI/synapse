-- ============================================================================
-- Synapse V6 Outcome Detection System Tables
-- ============================================================================
-- Created: 2025-12-04
-- Purpose: Track customer outcomes, UVP alignment, API signal mapping
--          Enable intelligent query generation for outcome-based discovery
-- ============================================================================

-- ============================================================================
-- Table: customer_outcomes
-- Core outcome detection - customer goals, UVP matching, query generation
-- ============================================================================

CREATE TABLE IF NOT EXISTS customer_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uvp_session_id UUID REFERENCES public.uvp_sessions(id) ON DELETE CASCADE,

  -- Core outcome data
  outcome_statement TEXT NOT NULL,
  outcome_category TEXT NOT NULL CHECK (outcome_category IN (
    'efficiency',
    'revenue',
    'compliance',
    'cost_reduction',
    'risk_mitigation',
    'growth',
    'quality',
    'speed'
  )),
  priority_score INTEGER NOT NULL CHECK (priority_score >= 1 AND priority_score <= 100),

  -- UVP alignment & matching
  matched_differentiator TEXT,
  differentiator_strength INTEGER CHECK (differentiator_strength >= 1 AND differentiator_strength <= 100),
  supporting_evidence TEXT[] DEFAULT '{}',

  -- Industry & context
  industry_profile TEXT,
  urgency_triggers TEXT[] DEFAULT '{}',
  seasonal_patterns JSONB DEFAULT '{}'::jsonb,

  -- Query generation for API discovery
  primary_keywords TEXT[] DEFAULT '{}',
  outcome_queries TEXT[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_customer_outcomes_uvp_session ON customer_outcomes(uvp_session_id);
CREATE INDEX idx_customer_outcomes_category ON customer_outcomes(outcome_category);
CREATE INDEX idx_customer_outcomes_priority ON customer_outcomes(priority_score DESC);
CREATE INDEX idx_customer_outcomes_industry ON customer_outcomes(industry_profile);

-- Enable Row Level Security
ALTER TABLE customer_outcomes ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Match uvp_sessions pattern for brand access
CREATE POLICY "Users can view outcomes for their brand sessions"
  ON customer_outcomes
  FOR SELECT
  USING (
    uvp_session_id IN (
      SELECT id FROM public.uvp_sessions
      WHERE brand_id IN (
        SELECT id FROM public.brands WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create outcomes for their brand sessions"
  ON customer_outcomes
  FOR INSERT
  WITH CHECK (
    uvp_session_id IN (
      SELECT id FROM public.uvp_sessions
      WHERE brand_id IN (
        SELECT id FROM public.brands WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update outcomes for their brand sessions"
  ON customer_outcomes
  FOR UPDATE
  USING (
    uvp_session_id IN (
      SELECT id FROM public.uvp_sessions
      WHERE brand_id IN (
        SELECT id FROM public.brands WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete outcomes for their brand sessions"
  ON customer_outcomes
  FOR DELETE
  USING (
    uvp_session_id IN (
      SELECT id FROM public.uvp_sessions
      WHERE brand_id IN (
        SELECT id FROM public.brands WHERE user_id = auth.uid()
      )
    )
  );

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_customer_outcomes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customer_outcomes_updated_at
  BEFORE UPDATE ON customer_outcomes
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_outcomes_updated_at();

-- Grant permissions
GRANT ALL ON customer_outcomes TO authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- Table: outcome_signal_mapping
-- Track which APIs/signals match which customer outcomes
-- ============================================================================

CREATE TABLE IF NOT EXISTS outcome_signal_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_outcome_id UUID NOT NULL REFERENCES customer_outcomes(id) ON DELETE CASCADE,

  -- API source tracking
  api_source TEXT NOT NULL CHECK (api_source IN (
    'serper',
    'reddit',
    'reviews',
    'forums',
    'social',
    'news',
    'competitor'
  )),
  query_used TEXT NOT NULL,
  signal_strength INTEGER NOT NULL CHECK (signal_strength >= 1 AND signal_strength <= 100),

  -- Discovered intelligence
  conversation_themes TEXT[] DEFAULT '{}',
  buying_signals TEXT[] DEFAULT '{}',
  competitor_mentions TEXT[] DEFAULT '{}',

  -- Raw data reference (for debugging/refinement)
  raw_response JSONB,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_outcome_signal_mapping_outcome ON outcome_signal_mapping(customer_outcome_id);
CREATE INDEX idx_outcome_signal_mapping_api_source ON outcome_signal_mapping(api_source);
CREATE INDEX idx_outcome_signal_mapping_signal_strength ON outcome_signal_mapping(signal_strength DESC);
CREATE INDEX idx_outcome_signal_mapping_created ON outcome_signal_mapping(created_at DESC);

-- Enable Row Level Security
ALTER TABLE outcome_signal_mapping ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Inherit access through customer_outcomes relationship
CREATE POLICY "Users can view signal mappings for their outcomes"
  ON outcome_signal_mapping
  FOR SELECT
  USING (
    customer_outcome_id IN (
      SELECT id FROM customer_outcomes
      WHERE uvp_session_id IN (
        SELECT id FROM public.uvp_sessions
        WHERE brand_id IN (
          SELECT id FROM public.brands WHERE user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create signal mappings for their outcomes"
  ON outcome_signal_mapping
  FOR INSERT
  WITH CHECK (
    customer_outcome_id IN (
      SELECT id FROM customer_outcomes
      WHERE uvp_session_id IN (
        SELECT id FROM public.uvp_sessions
        WHERE brand_id IN (
          SELECT id FROM public.brands WHERE user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can update signal mappings for their outcomes"
  ON outcome_signal_mapping
  FOR UPDATE
  USING (
    customer_outcome_id IN (
      SELECT id FROM customer_outcomes
      WHERE uvp_session_id IN (
        SELECT id FROM public.uvp_sessions
        WHERE brand_id IN (
          SELECT id FROM public.brands WHERE user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can delete signal mappings for their outcomes"
  ON outcome_signal_mapping
  FOR DELETE
  USING (
    customer_outcome_id IN (
      SELECT id FROM customer_outcomes
      WHERE uvp_session_id IN (
        SELECT id FROM public.uvp_sessions
        WHERE brand_id IN (
          SELECT id FROM public.brands WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Grant permissions
GRANT ALL ON outcome_signal_mapping TO authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- Table: buyer_personas - ADD outcome-related columns
-- Extend existing buyer_personas table with outcome tracking
-- ============================================================================

-- Add outcome tracking columns to buyer_personas
ALTER TABLE buyer_personas
  ADD COLUMN IF NOT EXISTS desired_outcomes TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS outcome_priorities JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS differentiator_match INTEGER CHECK (differentiator_match >= 1 AND differentiator_match <= 100);

-- Create index for outcome-based queries
CREATE INDEX IF NOT EXISTS idx_buyer_personas_differentiator_match
  ON buyer_personas(differentiator_match DESC);

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE customer_outcomes IS 'Customer outcome detection - tracks goals, UVP alignment, and generates API queries for signal discovery';
COMMENT ON TABLE outcome_signal_mapping IS 'Maps API signals to customer outcomes - tracks which queries find which buying signals';

COMMENT ON COLUMN customer_outcomes.outcome_category IS 'Type of customer outcome: efficiency, revenue, compliance, cost_reduction, risk_mitigation, growth, quality, speed';
COMMENT ON COLUMN customer_outcomes.matched_differentiator IS 'Which UVP differentiator addresses this outcome';
COMMENT ON COLUMN customer_outcomes.differentiator_strength IS 'How well the differentiator matches (1-100)';
COMMENT ON COLUMN customer_outcomes.outcome_queries IS 'Generated API queries to find customers with this outcome';
COMMENT ON COLUMN outcome_signal_mapping.api_source IS 'Which API service provided this signal: serper, reddit, reviews, forums, social, news, competitor';
COMMENT ON COLUMN outcome_signal_mapping.signal_strength IS 'How strongly this signal indicates the outcome (1-100)';
COMMENT ON COLUMN buyer_personas.desired_outcomes IS 'Array of outcome statements this persona is seeking';
COMMENT ON COLUMN buyer_personas.outcome_priorities IS 'Priority weights for each outcome (JSON mapping outcome to priority 1-100)';
COMMENT ON COLUMN buyer_personas.differentiator_match IS 'Overall match score between persona outcomes and brand differentiators (1-100)';
