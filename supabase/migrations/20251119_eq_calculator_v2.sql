-- EQ Calculator v2.0 Database Schema
-- Created: 2025-11-19
--
-- Tables:
-- 1. brand_eq_scores - Store calculated EQ for each brand
-- 2. eq_patterns - Store pattern signatures for learning
-- 3. eq_specialty_baselines - Auto-learned specialty EQ baselines
-- 4. eq_performance_metrics - Track content performance by EQ

-- ============================================================================
-- 1. Brand EQ Scores
-- ============================================================================

CREATE TABLE IF NOT EXISTS brand_eq_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

  -- EQ Score
  emotional_quotient INTEGER NOT NULL CHECK (emotional_quotient >= 0 AND emotional_quotient <= 100),
  rational_quotient INTEGER NOT NULL CHECK (rational_quotient >= 0 AND rational_quotient <= 100),
  overall_eq INTEGER NOT NULL CHECK (overall_eq >= 0 AND overall_eq <= 100),
  confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  calculation_method TEXT NOT NULL, -- 'specialty_based', 'pattern_based', 'content_only', 'hybrid'

  -- Context
  specialty TEXT,
  industry TEXT,
  is_passion_product BOOLEAN DEFAULT false,

  -- Layer Contributions
  specialty_contribution JSONB, -- { score, weight, contribution, confidence }
  pattern_contribution JSONB,
  content_contribution JSONB,

  -- Detected Signals
  detected_signals JSONB, -- Full DetectedSignals object

  -- Recommendations
  recommendations JSONB, -- Array of EQRecommendation objects

  -- Metadata
  calculation_id TEXT NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One EQ score per brand (latest)
  UNIQUE(brand_id)
);

-- Indexes
CREATE INDEX idx_brand_eq_scores_brand_id ON brand_eq_scores(brand_id);
CREATE INDEX idx_brand_eq_scores_overall_eq ON brand_eq_scores(overall_eq);
CREATE INDEX idx_brand_eq_scores_specialty ON brand_eq_scores(specialty);
CREATE INDEX idx_brand_eq_scores_calculated_at ON brand_eq_scores(calculated_at DESC);

-- RLS Policies
ALTER TABLE brand_eq_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own brand EQ scores"
  ON brand_eq_scores FOR SELECT
  USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own brand EQ scores"
  ON brand_eq_scores FOR INSERT
  WITH CHECK (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own brand EQ scores"
  ON brand_eq_scores FOR UPDATE
  USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

-- ============================================================================
-- 2. EQ Patterns (for learning engine)
-- ============================================================================

CREATE TABLE IF NOT EXISTS eq_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Pattern Signature
  pattern_id TEXT NOT NULL UNIQUE,
  pattern_type TEXT NOT NULL, -- 'passion', 'rational', 'community', 'hybrid'

  -- Keywords
  detected_keywords TEXT[] NOT NULL,
  keyword_density JSONB NOT NULL, -- { emotional, rational }

  -- Structural Signals
  has_testimonials BOOLEAN DEFAULT false,
  has_forums BOOLEAN DEFAULT false,
  has_pricing_tables BOOLEAN DEFAULT false,
  has_comparison_charts BOOLEAN DEFAULT false,
  has_contact_only_pricing BOOLEAN DEFAULT false,

  -- Calculated EQ
  calculated_eq INTEGER NOT NULL CHECK (calculated_eq >= 0 AND calculated_eq <= 100),
  confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),

  -- Associated Business
  business_name TEXT,
  specialty TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_eq_patterns_pattern_type ON eq_patterns(pattern_type);
CREATE INDEX idx_eq_patterns_specialty ON eq_patterns(specialty);
CREATE INDEX idx_eq_patterns_calculated_eq ON eq_patterns(calculated_eq);
CREATE INDEX idx_eq_patterns_created_at ON eq_patterns(created_at DESC);

-- ============================================================================
-- 3. EQ Specialty Baselines (auto-learned)
-- ============================================================================

CREATE TABLE IF NOT EXISTS eq_specialty_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Specialty Info
  specialty TEXT NOT NULL UNIQUE,
  base_eq INTEGER NOT NULL CHECK (base_eq >= 0 AND base_eq <= 100),
  is_passion_product BOOLEAN DEFAULT false,

  -- Learning Stats
  sample_size INTEGER NOT NULL DEFAULT 0,
  confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),

  -- Examples
  example_businesses TEXT[] DEFAULT '{}',

  -- Pattern Characteristics
  avg_emotional_density DECIMAL(5,2),
  avg_rational_density DECIMAL(5,2),
  common_signals TEXT[] DEFAULT '{}',

  -- Metadata
  first_learned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_eq_specialty_baselines_specialty ON eq_specialty_baselines(specialty);
CREATE INDEX idx_eq_specialty_baselines_base_eq ON eq_specialty_baselines(base_eq);
CREATE INDEX idx_eq_specialty_baselines_sample_size ON eq_specialty_baselines(sample_size DESC);

-- ============================================================================
-- 4. EQ Performance Metrics (track if EQ-matched content performs better)
-- ============================================================================

CREATE TABLE IF NOT EXISTS eq_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

  -- Content Reference
  content_id UUID, -- Reference to content_calendar_items or campaigns
  content_type TEXT NOT NULL, -- 'post', 'campaign', 'email', etc.
  platform TEXT NOT NULL, -- 'linkedin', 'instagram', etc.

  -- EQ Context
  content_eq INTEGER NOT NULL CHECK (content_eq >= 0 AND content_eq <= 100),
  target_eq INTEGER, -- Optimal EQ for this audience
  eq_variance INTEGER, -- Difference from optimal

  -- Adjustments Applied
  platform_adjustment INTEGER DEFAULT 0,
  seasonal_adjustment INTEGER DEFAULT 0,
  campaign_type_adjustment INTEGER DEFAULT 0,

  -- Performance Metrics
  impressions INTEGER DEFAULT 0,
  engagement_count INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2),
  click_count INTEGER DEFAULT 0,
  click_rate DECIMAL(5,2),
  conversion_count INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2),

  -- Metadata
  published_at TIMESTAMPTZ,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_eq_performance_brand_id ON eq_performance_metrics(brand_id);
CREATE INDEX idx_eq_performance_content_eq ON eq_performance_metrics(content_eq);
CREATE INDEX idx_eq_performance_platform ON eq_performance_metrics(platform);
CREATE INDEX idx_eq_performance_published_at ON eq_performance_metrics(published_at DESC);

-- RLS Policies
ALTER TABLE eq_performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own EQ performance metrics"
  ON eq_performance_metrics FOR SELECT
  USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own EQ performance metrics"
  ON eq_performance_metrics FOR INSERT
  WITH CHECK (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

-- ============================================================================
-- 5. Add EQ fields to brands table
-- ============================================================================

-- Add emotional_quotient to brands table for quick access
ALTER TABLE brands ADD COLUMN IF NOT EXISTS emotional_quotient INTEGER CHECK (emotional_quotient >= 0 AND emotional_quotient <= 100);
ALTER TABLE brands ADD COLUMN IF NOT EXISTS eq_calculated_at TIMESTAMPTZ;

-- Create index
CREATE INDEX IF NOT EXISTS idx_brands_emotional_quotient ON brands(emotional_quotient);

-- ============================================================================
-- Functions
-- ============================================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for brand_eq_scores
CREATE TRIGGER update_brand_eq_scores_updated_at
  BEFORE UPDATE ON brand_eq_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Sample Data / Seed
-- ============================================================================

-- Insert known specialty baselines from code
INSERT INTO eq_specialty_baselines (specialty, base_eq, is_passion_product, sample_size, confidence_score, example_businesses)
VALUES
  ('classic cars', 75, true, 10, 90, ARRAY['Phoenix Insurance']),
  ('vintage motorcycles', 73, true, 8, 85, ARRAY['Classic Bike Shop']),
  ('enterprise software', 25, false, 15, 95, ARRAY['SaaS Corp']),
  ('luxury watches', 72, true, 12, 90, ARRAY['Timepiece Gallery']),
  ('tax preparation', 18, false, 20, 95, ARRAY['Tax Pro Services']),
  ('wedding photography', 75, true, 10, 85, ARRAY['Forever Moments Photography']),
  ('marketing agency', 45, false, 25, 95, ARRAY['Digital Marketing Co']),
  ('saas', 30, false, 30, 95, ARRAY['Cloud Analytics Platform']),
  ('fitness coaching', 65, false, 15, 85, ARRAY['Transform Fitness Studio']),
  ('accounting', 35, false, 20, 90, ARRAY['Small Business Accounting'])
ON CONFLICT (specialty) DO NOTHING;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE brand_eq_scores IS 'Stores calculated emotional quotient scores for each brand';
COMMENT ON TABLE eq_patterns IS 'Pattern signatures used by the learning engine to identify similar businesses';
COMMENT ON TABLE eq_specialty_baselines IS 'Auto-learned EQ baselines for different business specialties';
COMMENT ON TABLE eq_performance_metrics IS 'Tracks content performance to validate EQ-matched messaging effectiveness';

COMMENT ON COLUMN brand_eq_scores.emotional_quotient IS 'Emotional score 0-100 (higher = more emotional messaging)';
COMMENT ON COLUMN brand_eq_scores.rational_quotient IS 'Rational score 0-100 (higher = more logical/data-driven messaging)';
COMMENT ON COLUMN brand_eq_scores.overall_eq IS 'Overall EQ score (same as emotional_quotient for simplicity)';
COMMENT ON COLUMN brand_eq_scores.calculation_method IS 'How EQ was calculated: specialty_based, pattern_based, content_only, or hybrid';
