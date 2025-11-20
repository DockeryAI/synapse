-- ============================================================================
-- Create Onboarding V5 Tables with PROPER RLS
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- Table: value_propositions
-- ============================================================================

CREATE TABLE IF NOT EXISTS value_propositions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  statement text NOT NULL,
  category text NOT NULL CHECK (category IN ('core', 'secondary', 'aspirational')),
  market_position text,
  differentiators jsonb DEFAULT '[]'::jsonb,
  confidence jsonb,
  eq_score jsonb,
  sources jsonb DEFAULT '[]'::jsonb,
  validated boolean DEFAULT false,
  user_edited boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_value_propositions_brand_id ON value_propositions(brand_id);
CREATE INDEX IF NOT EXISTS idx_value_propositions_category ON value_propositions(category);

ALTER TABLE value_propositions ENABLE ROW LEVEL SECURITY;

-- Proper RLS: Users can only access their own brands' value propositions
DROP POLICY IF EXISTS value_propositions_user_access ON value_propositions;
CREATE POLICY value_propositions_user_access ON value_propositions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM brands
      WHERE brands.id = value_propositions.brand_id
        AND brands.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM brands
      WHERE brands.id = value_propositions.brand_id
        AND brands.user_id = auth.uid()
    )
  );

-- Allow access for brands without user_id (demo/unauthenticated brands)
DROP POLICY IF EXISTS value_propositions_demo_access ON value_propositions;
CREATE POLICY value_propositions_demo_access ON value_propositions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM brands
      WHERE brands.id = value_propositions.brand_id
        AND brands.user_id IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM brands
      WHERE brands.id = value_propositions.brand_id
        AND brands.user_id IS NULL
    )
  );

-- ============================================================================
-- Table: buyer_personas
-- ============================================================================

CREATE TABLE IF NOT EXISTS buyer_personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text,
  company_type text,
  industry text,
  pain_points jsonb DEFAULT '[]'::jsonb,
  desired_outcomes jsonb DEFAULT '[]'::jsonb,
  jobs_to_be_done jsonb,
  urgency_signals jsonb DEFAULT '[]'::jsonb,
  buying_behavior jsonb,
  validated boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_buyer_personas_brand_id ON buyer_personas(brand_id);
CREATE INDEX IF NOT EXISTS idx_buyer_personas_role ON buyer_personas(role);

ALTER TABLE buyer_personas ENABLE ROW LEVEL SECURITY;

-- Proper RLS: Users can only access their own brands' buyer personas
DROP POLICY IF EXISTS buyer_personas_user_access ON buyer_personas;
CREATE POLICY buyer_personas_user_access ON buyer_personas
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM brands
      WHERE brands.id = buyer_personas.brand_id
        AND brands.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM brands
      WHERE brands.id = buyer_personas.brand_id
        AND brands.user_id = auth.uid()
    )
  );

-- Allow access for brands without user_id (demo/unauthenticated brands)
DROP POLICY IF EXISTS buyer_personas_demo_access ON buyer_personas;
CREATE POLICY buyer_personas_demo_access ON buyer_personas
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM brands
      WHERE brands.id = buyer_personas.brand_id
        AND brands.user_id IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM brands
      WHERE brands.id = buyer_personas.brand_id
        AND brands.user_id IS NULL
    )
  );

-- ============================================================================
-- Table: core_truth_insights
-- ============================================================================

CREATE TABLE IF NOT EXISTS core_truth_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  core_truth text NOT NULL,
  psychological_drivers jsonb DEFAULT '[]'::jsonb,
  transformation_promise text,
  emotional_payoff text,
  synthesis_reasoning text,
  composite_eq_score integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_core_truth_insights_brand_id ON core_truth_insights(brand_id);
CREATE INDEX IF NOT EXISTS idx_core_truth_insights_eq_score ON core_truth_insights(composite_eq_score);

ALTER TABLE core_truth_insights ENABLE ROW LEVEL SECURITY;

-- Proper RLS: Users can only access their own brands' core truth insights
DROP POLICY IF EXISTS core_truth_insights_user_access ON core_truth_insights;
CREATE POLICY core_truth_insights_user_access ON core_truth_insights
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM brands
      WHERE brands.id = core_truth_insights.brand_id
        AND brands.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM brands
      WHERE brands.id = core_truth_insights.brand_id
        AND brands.user_id = auth.uid()
    )
  );

-- Allow access for brands without user_id (demo/unauthenticated brands)
DROP POLICY IF EXISTS core_truth_insights_demo_access ON core_truth_insights;
CREATE POLICY core_truth_insights_demo_access ON core_truth_insights
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM brands
      WHERE brands.id = core_truth_insights.brand_id
        AND brands.user_id IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM brands
      WHERE brands.id = core_truth_insights.brand_id
        AND brands.user_id IS NULL
    )
  );

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================

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

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Onboarding V5 tables created with PROPER RLS';
  RAISE NOTICE '✅ Each table has two policies:';
  RAISE NOTICE '   1. user_access: Users can only access their own brands data';
  RAISE NOTICE '   2. demo_access: Allows access for brands without user_id';
  RAISE NOTICE '✅ Data is secured by brand ownership, not wide open';
END $$;
