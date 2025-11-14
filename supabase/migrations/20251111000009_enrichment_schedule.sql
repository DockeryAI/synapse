-- Auto-enrichment schedule
CREATE TABLE IF NOT EXISTS enrichment_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

  section TEXT NOT NULL CHECK (section IN ('situation', 'objectives', 'strategy', 'tactics', 'action', 'control')),

  enabled BOOLEAN DEFAULT true,
  frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('hourly', 'daily', 'weekly')),

  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_enrichment_schedule_next ON enrichment_schedule(next_run) WHERE enabled = true;
CREATE INDEX idx_enrichment_schedule_brand ON enrichment_schedule(brand_id);

-- RLS Policies
ALTER TABLE enrichment_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own enrichment schedule"
  ON enrichment_schedule FOR SELECT
  USING (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own enrichment schedule"
  ON enrichment_schedule FOR UPDATE
  USING (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));

CREATE POLICY "System can insert enrichment schedules"
  ON enrichment_schedule FOR INSERT
  WITH CHECK (true);
