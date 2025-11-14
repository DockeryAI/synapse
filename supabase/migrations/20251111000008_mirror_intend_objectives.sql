-- MIRROR Intend objectives/goals (formerly SOSTAC Objectives)
-- This platform uses a methodology inspired by SOSTAC® (PR Smith). SOSTAC® is a registered trademark of PR Smith.
CREATE TABLE IF NOT EXISTS mirror_intend_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT,

  category TEXT NOT NULL CHECK (category IN ('awareness', 'leads', 'retention', 'revenue')),

  -- SMART criteria
  specific TEXT,
  measurable TEXT, -- Metric definition
  achievable TEXT, -- Why it's realistic
  relevant TEXT, -- Why it matters
  time_bound TEXT, -- Timeline

  -- Metrics
  current_value DECIMAL,
  target_value DECIMAL,
  unit TEXT, -- 'followers', 'leads', 'dollars', 'percent'

  timeline_start DATE,
  timeline_end DATE,

  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'achieved', 'abandoned')),

  progress DECIMAL(5,2), -- Percentage complete

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_mirror_intend_objectives_brand ON mirror_intend_objectives(brand_id);
CREATE INDEX idx_mirror_intend_objectives_status ON mirror_intend_objectives(status);
CREATE INDEX idx_mirror_intend_objectives_brand_status ON mirror_intend_objectives(brand_id, status);
CREATE INDEX idx_mirror_intend_objectives_timeline ON mirror_intend_objectives(timeline_end) WHERE status = 'active';

-- Updated at trigger
CREATE TRIGGER update_mirror_intend_objectives_updated_at
  BEFORE UPDATE ON mirror_intend_objectives
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE mirror_intend_objectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own objectives"
  ON mirror_intend_objectives FOR SELECT
  USING (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own objectives"
  ON mirror_intend_objectives FOR INSERT
  WITH CHECK (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own objectives"
  ON mirror_intend_objectives FOR UPDATE
  USING (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own objectives"
  ON mirror_intend_objectives FOR DELETE
  USING (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));
