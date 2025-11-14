-- Mirror sections data (MIRROR Framework structure)
-- This platform uses a methodology inspired by SOSTAC® (PR Smith). SOSTAC® is a registered trademark of PR Smith.
-- MIRROR Framework phases: Measure, Intend, Reimagine, Reach, Optimize, Reflect
CREATE TABLE IF NOT EXISTS mirror_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

  section TEXT NOT NULL CHECK (section IN ('measure', 'intend', 'reimagine', 'reach', 'optimize', 'reflect')),

  data JSONB NOT NULL DEFAULT '{}'::jsonb,

  last_enriched TIMESTAMP WITH TIME ZONE,
  auto_enrich_enabled BOOLEAN DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_mirror_sections_brand ON mirror_sections(brand_id);
CREATE INDEX idx_mirror_sections_section ON mirror_sections(section);
CREATE INDEX idx_mirror_sections_brand_section ON mirror_sections(brand_id, section);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mirror_sections_updated_at
  BEFORE UPDATE ON mirror_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE mirror_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mirror sections"
  ON mirror_sections FOR SELECT
  USING (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own mirror sections"
  ON mirror_sections FOR INSERT
  WITH CHECK (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own mirror sections"
  ON mirror_sections FOR UPDATE
  USING (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own mirror sections"
  ON mirror_sections FOR DELETE
  USING (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));
