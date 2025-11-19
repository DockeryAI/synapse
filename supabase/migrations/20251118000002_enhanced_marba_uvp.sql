-- Enhanced MARBA UVP Flow Database Schema
-- Created: 2025-11-18
-- Stores complete UVP data from the 6-step Enhanced MARBA UVP flow
-- This is separate from brand_uvps (simple 5-element wizard) and value_statements (canvas builder)

-- =====================================================
-- TABLE: marba_uvps
-- Stores Enhanced MARBA UVP Flow data
-- 6-step flow: Products → Customer → Transformation → Solution → Benefit → Synthesis
-- =====================================================
CREATE TABLE IF NOT EXISTS marba_uvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

  -- Core Components (JSONB for rich structured data)
  -- Each component includes confidence scores, sources, and detailed breakdowns

  -- Step 1: Products/Services
  products_services JSONB, -- { categories: [{id, name, items: []}], extractionComplete, confidence, sources }

  -- Step 2: Target Customer
  target_customer JSONB NOT NULL, -- { id, statement, industry, companySize, role, confidence, sources, evidenceQuotes, isManualInput }

  -- Step 3: Transformation Goal (What they're REALLY buying)
  transformation_goal JSONB NOT NULL, -- { id, statement, emotionalDrivers: [], functionalDrivers: [], eqScore: {emotional, rational, overall}, confidence, sources, customerQuotes: [], isManualInput }

  -- Step 4: Unique Solution
  unique_solution JSONB NOT NULL, -- { id, statement, differentiators: [{id, statement, evidence, source, strengthScore}], methodology, proprietaryApproach, confidence, sources, isManualInput }

  -- Step 5: Key Benefit
  key_benefit JSONB NOT NULL, -- { id, statement, outcomeType, metrics: [{metric, value, timeframe, source}], industryComparison, eqFraming, confidence, sources, isManualInput }

  -- Step 6: Synthesized Outputs
  value_proposition_statement TEXT NOT NULL, -- Final value proposition
  why_statement TEXT, -- Purpose/belief statement
  what_statement TEXT, -- Tangible offering statement
  how_statement TEXT, -- Unique approach statement

  -- Meta
  overall_confidence INTEGER CHECK (overall_confidence >= 0 AND overall_confidence <= 100),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one Enhanced MARBA UVP per brand
  CONSTRAINT unique_marba_uvp_per_brand UNIQUE (brand_id)
);

-- Indexes for performance
CREATE INDEX idx_marba_uvps_brand ON marba_uvps(brand_id);
CREATE INDEX idx_marba_uvps_confidence ON marba_uvps(overall_confidence);
CREATE INDEX idx_marba_uvps_created ON marba_uvps(created_at DESC);

-- JSONB GIN indexes for efficient querying of nested data
CREATE INDEX idx_marba_uvps_target_customer_gin ON marba_uvps USING GIN (target_customer);
CREATE INDEX idx_marba_uvps_transformation_gin ON marba_uvps USING GIN (transformation_goal);
CREATE INDEX idx_marba_uvps_solution_gin ON marba_uvps USING GIN (unique_solution);
CREATE INDEX idx_marba_uvps_benefit_gin ON marba_uvps USING GIN (key_benefit);

-- Updated at trigger
CREATE TRIGGER update_marba_uvps_updated_at
  BEFORE UPDATE ON marba_uvps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE marba_uvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own MARBA UVPs"
  ON marba_uvps FOR SELECT
  USING (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own MARBA UVPs"
  ON marba_uvps FOR INSERT
  WITH CHECK (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own MARBA UVPs"
  ON marba_uvps FOR UPDATE
  USING (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own MARBA UVPs"
  ON marba_uvps FOR DELETE
  USING (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));

-- Comments for documentation
COMMENT ON TABLE marba_uvps IS 'Stores Enhanced MARBA UVP Flow data from 6-step wizard: Products → Customer → Transformation → Solution → Benefit → Synthesis. Separate from brand_uvps (simple 5-element wizard) and value_statements (canvas builder).';

COMMENT ON COLUMN marba_uvps.products_services IS 'Product/Service data: {categories: [{id, name, items: []}], extractionComplete, confidence, sources}';
COMMENT ON COLUMN marba_uvps.target_customer IS 'Customer profile: {id, statement, industry, companySize, role, confidence, sources, evidenceQuotes, isManualInput}';
COMMENT ON COLUMN marba_uvps.transformation_goal IS 'What customer is REALLY buying: {id, statement, emotionalDrivers: [], functionalDrivers: [], eqScore: {emotional, rational, overall}, confidence, sources, customerQuotes: [], isManualInput}';
COMMENT ON COLUMN marba_uvps.unique_solution IS 'How you solve differently: {id, statement, differentiators: [{id, statement, evidence, source, strengthScore}], methodology, proprietaryApproach, confidence, sources, isManualInput}';
COMMENT ON COLUMN marba_uvps.key_benefit IS 'Measurable outcome: {id, statement, outcomeType, metrics: [{metric, value, timeframe, source}], industryComparison, eqFraming, confidence, sources, isManualInput}';

COMMENT ON COLUMN marba_uvps.value_proposition_statement IS 'Final synthesized value proposition statement combining all elements';
COMMENT ON COLUMN marba_uvps.why_statement IS 'Purpose/belief statement (Simon Sinek Golden Circle WHY)';
COMMENT ON COLUMN marba_uvps.what_statement IS 'Tangible offering statement (Golden Circle WHAT)';
COMMENT ON COLUMN marba_uvps.how_statement IS 'Unique approach statement (Golden Circle HOW)';

COMMENT ON COLUMN marba_uvps.overall_confidence IS 'Aggregate confidence score (0-100) across all components';
