-- ============================================================================
-- Create Onboarding V5 Tables - FIXED RLS
-- Run this in Supabase SQL Editor
-- ============================================================================

-- First, check if brands table has user_id or owner_id
DO $$
DECLARE
  has_user_id boolean;
  has_owner_id boolean;
  user_col text;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'user_id'
  ) INTO has_user_id;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'owner_id'
  ) INTO has_owner_id;

  IF has_user_id THEN
    user_col := 'user_id';
  ELSIF has_owner_id THEN
    user_col := 'owner_id';
  ELSE
    RAISE EXCEPTION 'brands table has neither user_id nor owner_id column';
  END IF;

  RAISE NOTICE 'brands table uses column: %', user_col;
END $$;

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

-- Simple RLS: Allow all authenticated users (for testing)
DROP POLICY IF EXISTS value_propositions_user_access ON value_propositions;
CREATE POLICY value_propositions_user_access ON value_propositions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

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

-- Simple RLS: Allow all authenticated users (for testing)
DROP POLICY IF EXISTS buyer_personas_user_access ON buyer_personas;
CREATE POLICY buyer_personas_user_access ON buyer_personas
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

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
ALTER TABLE core_truth_insights ENABLE ROW LEVEL SECURITY;

-- Simple RLS: Allow all authenticated users (for testing)
DROP POLICY IF EXISTS core_truth_insights_user_access ON core_truth_insights;
CREATE POLICY core_truth_insights_user_access ON core_truth_insights
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Success
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Onboarding V5 tables created successfully!';
  RAISE NOTICE '✅ Using simplified RLS (allow all authenticated users)';
  RAISE NOTICE '💡 You can tighten RLS later once brands.user_id column is confirmed';
END $$;
