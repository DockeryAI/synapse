-- Brand UVPs Table
-- Stores UVP wizard progress and completed UVPs for each brand
-- This is separate from value_statements which are for the canvas builder

CREATE TABLE IF NOT EXISTS brand_uvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

  -- UVP Framework Components (5 core elements)
  target_customer TEXT, -- Who is the customer
  customer_problem TEXT, -- What problem do they have
  unique_solution TEXT, -- How do you solve it
  key_benefit TEXT, -- What's the measurable outcome
  differentiation TEXT, -- Why are you different from competitors

  -- Context
  industry TEXT, -- Industry for context-aware suggestions
  competitors TEXT[] DEFAULT '{}', -- List of competitors

  -- Quality Scoring
  score INTEGER CHECK (score >= 0 AND score <= 100), -- Overall UVP quality score
  quality_assessment JSONB DEFAULT '{}'::jsonb, -- Detailed quality breakdown

  -- Wizard Progress
  current_step TEXT, -- Current wizard step: 'welcome', 'target-customer', 'customer-problem', etc.
  is_complete BOOLEAN DEFAULT false, -- Whether wizard is completed

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one UVP per brand
  CONSTRAINT unique_brand_uvp UNIQUE (brand_id)
);

-- Indexes for performance
CREATE INDEX idx_brand_uvps_brand ON brand_uvps(brand_id);
CREATE INDEX idx_brand_uvps_complete ON brand_uvps(is_complete);
CREATE INDEX idx_brand_uvps_step ON brand_uvps(current_step);

-- Updated at trigger
CREATE TRIGGER update_brand_uvps_updated_at
  BEFORE UPDATE ON brand_uvps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE brand_uvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own brand UVPs"
  ON brand_uvps FOR SELECT
  USING (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own brand UVPs"
  ON brand_uvps FOR INSERT
  WITH CHECK (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own brand UVPs"
  ON brand_uvps FOR UPDATE
  USING (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own brand UVPs"
  ON brand_uvps FOR DELETE
  USING (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));

-- Comments for documentation
COMMENT ON TABLE brand_uvps IS 'Stores UVP wizard progress and completed UVPs for each brand. Separate from value_statements which are for canvas builder.';
COMMENT ON COLUMN brand_uvps.target_customer IS 'Defines the ideal customer segment';
COMMENT ON COLUMN brand_uvps.customer_problem IS 'Identifies the main pain point or challenge';
COMMENT ON COLUMN brand_uvps.unique_solution IS 'Describes how the brand solves the problem uniquely';
COMMENT ON COLUMN brand_uvps.key_benefit IS 'The measurable outcome or benefit for the customer';
COMMENT ON COLUMN brand_uvps.differentiation IS 'What makes this brand different from competitors';
COMMENT ON COLUMN brand_uvps.current_step IS 'Wizard step for progress tracking: welcome, target-customer, customer-problem, unique-solution, key-benefit, differentiation, review, complete';
COMMENT ON COLUMN brand_uvps.quality_assessment IS 'Detailed quality scoring breakdown from AI: {clarity: 0-100, specificity: 0-100, differentiation: 0-100, impact: 0-100}';
