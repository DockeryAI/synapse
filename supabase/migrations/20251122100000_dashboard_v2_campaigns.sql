-- Dashboard V2 Campaign Tables
-- Migration for campaign system core (Week 2)

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  purpose VARCHAR(50) NOT NULL,
  template_id VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  arc JSONB,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  target_audience TEXT,
  industry_customization JSONB,
  performance_prediction JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_campaign_status CHECK (status IN ('draft', 'scheduled', 'active', 'completed', 'paused', 'archived')),
  CONSTRAINT valid_campaign_purpose CHECK (purpose IN ('awareness', 'engagement', 'conversion', 'retention', 'advocacy'))
);

-- Campaign pieces table
CREATE TABLE IF NOT EXISTS campaign_pieces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  phase_id VARCHAR(100) NOT NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  emotional_trigger VARCHAR(50) NOT NULL,
  scheduled_date TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  channel VARCHAR(50),
  piece_order INTEGER NOT NULL DEFAULT 0,
  template_id VARCHAR(100),
  performance_prediction JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_piece_status CHECK (status IN ('pending', 'generated', 'edited', 'approved', 'published', 'failed'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_brand_id ON campaigns(brand_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_start_date ON campaigns(start_date);
CREATE INDEX IF NOT EXISTS idx_campaign_pieces_campaign_id ON campaign_pieces(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_pieces_scheduled_date ON campaign_pieces(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_campaign_pieces_status ON campaign_pieces(status);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_campaign_pieces_updated_at ON campaign_pieces;
CREATE TRIGGER update_campaign_pieces_updated_at
  BEFORE UPDATE ON campaign_pieces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_pieces ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (dev mode)
DROP POLICY IF EXISTS campaigns_all_access ON campaigns;
CREATE POLICY campaigns_all_access ON campaigns FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS campaign_pieces_all_access ON campaign_pieces;
CREATE POLICY campaign_pieces_all_access ON campaign_pieces FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON campaigns TO anon, authenticated;
GRANT ALL ON campaign_pieces TO anon, authenticated;
