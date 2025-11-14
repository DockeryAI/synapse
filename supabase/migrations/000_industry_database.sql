-- ============================================================================
-- SYNAPSE INDUSTRY INTELLIGENCE DATABASE
-- ============================================================================
-- Migration 000: Industry Database Foundation
-- Creates tables for 383 NAICS codes + 144 full industry profiles (502k words)
-- Source: Brandock Supabase (full Opus 4.1 profiles with psychology optimization)

-- ============================================================================
-- TABLE 1: NAICS CODES (383 records)
-- ============================================================================
CREATE TABLE IF NOT EXISTS naics_codes (
  code VARCHAR(20) PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  has_full_profile BOOLEAN DEFAULT false,
  popularity INTEGER DEFAULT 0,
  parent_code VARCHAR(20),
  level INTEGER NOT NULL,
  is_standard BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_naics_parent ON naics_codes(parent_code);
CREATE INDEX IF NOT EXISTS idx_naics_keywords ON naics_codes USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_naics_category ON naics_codes(category);
CREATE INDEX IF NOT EXISTS idx_naics_has_profile ON naics_codes(has_full_profile);
CREATE INDEX IF NOT EXISTS idx_naics_popularity ON naics_codes(popularity DESC);

-- Full text search
CREATE INDEX IF NOT EXISTS idx_naics_search
  ON naics_codes USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- ============================================================================
-- TABLE 2: INDUSTRY PROFILES (144 records, ~502k words)
-- ============================================================================
-- Complete Opus 4.1 generated profiles with psychology optimization
CREATE TABLE IF NOT EXISTS industry_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  naics_code VARCHAR(20) NOT NULL UNIQUE REFERENCES naics_codes(code),

  -- Basic Info
  industry TEXT NOT NULL,
  industry_name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,

  -- Customer Psychology (JSONB for rich data)
  customer_triggers JSONB,          -- Array of trigger objects with urgency, frequency
  customer_journey JSONB,            -- Awareness, consideration, decision, retention, advocacy stages
  emotion_breakdown JSONB,           -- Emotional analysis
  emotion_quotient DECIMAL(5,2),    -- EQ score
  emotion_weight DECIMAL(5,2),      -- Emotional weight in decision
  emotion_reasoning TEXT,            -- Why this EQ score
  emotion_confidence DECIMAL(5,2),  -- Confidence in EQ analysis
  emotion_calibrated_at TIMESTAMP,
  eq_reasoning TEXT,
  eq_updated_at TIMESTAMP,

  -- Transformations & Value
  transformations JSONB,             -- Array of before/after transformation objects
  transformation_approach TEXT,
  golden_circle_why TEXT,            -- Simon Sinek's Golden Circle
  golden_circle_how TEXT,
  golden_circle_what TEXT,

  -- Messaging & Content
  power_words TEXT[],                -- Psychology-optimized power words
  avoid_words TEXT[],                -- Words to avoid
  customer_language_dictionary JSONB, -- How customers actually speak
  headline_templates TEXT[],
  cta_templates TEXT[],
  social_post_templates JSONB,
  messaging_frameworks JSONB,

  -- Pricing Psychology
  pricing_psychology JSONB,
  price_sensitivity_thresholds JSONB,
  emergency_premium_pricing JSONB,
  tiered_service_models JSONB,
  margin_optimization_strategies JSONB,

  -- Customer Behavior Patterns
  seasonal_patterns JSONB,
  monthly_patterns JSONB,
  peak_crisis_times JSONB,
  testimonial_capture_timing JSONB,

  -- Sales & Marketing
  competitive_advantages JSONB,
  objection_handlers JSONB,
  risk_reversal JSONB,
  social_proof_statistics JSONB,
  quality_indicators JSONB,
  success_metrics JSONB,

  -- Growth Strategies
  service_packages JSONB,
  expansion_opportunities JSONB,
  cross_sell_opportunity_map JSONB,
  referral_strategies JSONB,
  retention_hooks JSONB,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_industry_naics ON industry_profiles(naics_code);
CREATE INDEX IF NOT EXISTS idx_industry_category ON industry_profiles(category);
CREATE INDEX IF NOT EXISTS idx_industry_eq ON industry_profiles(emotion_quotient);
CREATE INDEX IF NOT EXISTS idx_industry_power_words ON industry_profiles USING GIN(power_words);

-- Full text search across all text fields
CREATE INDEX IF NOT EXISTS idx_industry_search
  ON industry_profiles USING gin(
    to_tsvector('english',
      industry_name || ' ' ||
      COALESCE(transformation_approach, '') || ' ' ||
      COALESCE(golden_circle_why, '')
    )
  );

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- NAICS Codes: Public read access
ALTER TABLE naics_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view NAICS codes"
  ON naics_codes FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can manage NAICS codes"
  ON naics_codes FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Industry Profiles: Public read access
ALTER TABLE industry_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view industry profiles"
  ON industry_profiles FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can manage industry profiles"
  ON industry_profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_naics_codes_updated_at
  BEFORE UPDATE ON naics_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_industry_profiles_updated_at
  BEFORE UPDATE ON industry_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE naics_codes IS '383 NAICS industry classification codes with basic metadata';
COMMENT ON TABLE industry_profiles IS '144 full industry profiles with Opus 4.1 psychology optimization (~502k words)';

COMMENT ON COLUMN industry_profiles.customer_triggers IS 'Psychological triggers that drive customer action (urgency, frequency)';
COMMENT ON COLUMN industry_profiles.customer_journey IS 'Complete customer journey from awareness to advocacy';
COMMENT ON COLUMN industry_profiles.emotion_quotient IS 'Emotional intelligence score (0-100) for buying decisions';
COMMENT ON COLUMN industry_profiles.power_words IS 'Psychology-optimized words proven to drive action';
COMMENT ON COLUMN industry_profiles.transformations IS 'Before/after transformations customers experience';
COMMENT ON COLUMN industry_profiles.pricing_psychology IS 'Psychology-based pricing strategies and thresholds';

-- ============================================================================
-- SUCCESS VERIFICATION
-- ============================================================================
-- After migration, verify with:
-- SELECT COUNT(*) FROM naics_codes; -- Should be 383
-- SELECT COUNT(*) FROM industry_profiles; -- Should be 144
-- SELECT COUNT(*) FROM industry_profiles WHERE emotion_quotient IS NOT NULL; -- Should be 144
