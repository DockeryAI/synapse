-- ============================================================================
-- Fix brands table and create onboarding tables with proper RLS
-- ============================================================================

-- Step 1: Ensure brands table has user_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE brands ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_brands_user ON brands(user_id);
    RAISE NOTICE 'Added user_id column to brands table';
  ELSE
    RAISE NOTICE 'user_id column already exists in brands table';
  END IF;
END $$;

-- Step 2: Create value_propositions table
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

-- Step 3: Create buyer_personas table
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

-- Step 4: Create core_truth_insights table
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

-- Step 5: Create triggers
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

-- Step 6: Add comments
COMMENT ON TABLE value_propositions IS 'Value propositions from onboarding flow - core, secondary, and aspirational';
COMMENT ON TABLE buyer_personas IS 'Buyer personas extracted from website and onboarding inputs';
COMMENT ON TABLE core_truth_insights IS 'Synthesized core truth insights combining value props and personas';

-- Success
DO $$
BEGIN
  RAISE NOTICE '✅ brands table fixed (user_id column added if missing)';
  RAISE NOTICE '✅ Onboarding V5 tables created with PROPER RLS';
  RAISE NOTICE '✅ Data secured by brand ownership';
END $$;
