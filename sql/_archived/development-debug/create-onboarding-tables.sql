-- ============================================================================
-- Create Onboarding V5 Tables with Correct brand_id References
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- Table: value_propositions
-- ============================================================================

CREATE TABLE IF NOT EXISTS value_propositions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

  -- Core proposition content
  statement text NOT NULL,
  category text NOT NULL CHECK (category IN ('core', 'secondary', 'aspirational')),
  market_position text,
  differentiators jsonb DEFAULT '[]'::jsonb,

  -- Scoring and confidence
  confidence jsonb,
  eq_score jsonb,

  -- Source attribution
  sources jsonb DEFAULT '[]'::jsonb,

  -- Validation status
  validated boolean DEFAULT false,
  user_edited boolean DEFAULT false,

  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_value_propositions_brand_id ON value_propositions(brand_id);
CREATE INDEX IF NOT EXISTS idx_value_propositions_category ON value_propositions(category);

-- Enable Row Level Security
ALTER TABLE value_propositions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access value propositions for brands they own
DROP POLICY IF EXISTS value_propositions_user_access ON value_propositions;
CREATE POLICY value_propositions_user_access ON value_propositions
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM brands WHERE id = value_propositions.brand_id
    )
  );

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_value_propositions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS value_propositions_updated_at ON value_propositions;
CREATE TRIGGER value_propositions_updated_at
  BEFORE UPDATE ON value_propositions
  FOR EACH ROW
  EXECUTE FUNCTION update_value_propositions_updated_at();

-- ============================================================================
-- Table: buyer_personas
-- ============================================================================

CREATE TABLE IF NOT EXISTS buyer_personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

  -- Core persona identity
  name text NOT NULL,
  role text,
  company_type text,
  industry text,

  -- Pain points and desires
  pain_points jsonb DEFAULT '[]'::jsonb,
  desired_outcomes jsonb DEFAULT '[]'::jsonb,

  -- Jobs to be done framework
  jobs_to_be_done jsonb,

  -- Urgency and behavior
  urgency_signals jsonb DEFAULT '[]'::jsonb,
  buying_behavior jsonb,

  -- Validation status
  validated boolean DEFAULT false,

  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_buyer_personas_brand_id ON buyer_personas(brand_id);
CREATE INDEX IF NOT EXISTS idx_buyer_personas_role ON buyer_personas(role);

-- Enable Row Level Security
ALTER TABLE buyer_personas ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access buyer personas for brands they own
DROP POLICY IF EXISTS buyer_personas_user_access ON buyer_personas;
CREATE POLICY buyer_personas_user_access ON buyer_personas
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM brands WHERE id = buyer_personas.brand_id
    )
  );

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_buyer_personas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS buyer_personas_updated_at ON buyer_personas;
CREATE TRIGGER buyer_personas_updated_at
  BEFORE UPDATE ON buyer_personas
  FOR EACH ROW
  EXECUTE FUNCTION update_buyer_personas_updated_at();

-- ============================================================================
-- Table: core_truth_insights
-- ============================================================================

CREATE TABLE IF NOT EXISTS core_truth_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

  -- Core truth statement
  core_truth text NOT NULL,

  -- Psychological framework
  psychological_drivers jsonb DEFAULT '[]'::jsonb,
  transformation_promise text,
  emotional_payoff text,

  -- Synthesis metadata
  synthesis_reasoning text,
  composite_eq_score integer,

  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_core_truth_insights_brand_id ON core_truth_insights(brand_id);
CREATE INDEX IF NOT EXISTS idx_core_truth_insights_eq_score ON core_truth_insights(composite_eq_score);

-- Enable Row Level Security
ALTER TABLE core_truth_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access core truth insights for brands they own
DROP POLICY IF EXISTS core_truth_insights_user_access ON core_truth_insights;
CREATE POLICY core_truth_insights_user_access ON core_truth_insights
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM brands WHERE id = core_truth_insights.brand_id
    )
  );

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_core_truth_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS core_truth_insights_updated_at ON core_truth_insights;
CREATE TRIGGER core_truth_insights_updated_at
  BEFORE UPDATE ON core_truth_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_core_truth_insights_updated_at();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE value_propositions IS 'Value propositions from onboarding flow - core, secondary, and aspirational';
COMMENT ON TABLE buyer_personas IS 'Buyer personas extracted from website and onboarding inputs';
COMMENT ON TABLE core_truth_insights IS 'Synthesized core truth insights combining value props and personas';
COMMENT ON COLUMN value_propositions.category IS 'Type of value proposition: core (main), secondary (supporting), aspirational (future state)';
COMMENT ON COLUMN value_propositions.eq_score IS 'Emotional quotient scoring for resonance measurement';
COMMENT ON COLUMN buyer_personas.jobs_to_be_done IS 'Jobs-to-be-done framework data for understanding customer motivations';
COMMENT ON COLUMN core_truth_insights.composite_eq_score IS 'Combined EQ score from all value propositions and personas (0-100)';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Onboarding V5 tables created successfully with brand_id references!';
END $$;
