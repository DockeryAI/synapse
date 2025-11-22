-- Dashboard V2: Campaign Tables Migration
-- Creates tables for campaign storage, pieces, and templates

-- Campaign Templates Table
CREATE TABLE IF NOT EXISTS campaign_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('content', 'campaign')),
  category TEXT NOT NULL,
  structure JSONB,
  variables JSONB,
  emotional_triggers TEXT[],
  best_for TEXT[],
  performance_metrics JSONB,
  piece_count INTEGER,
  duration_days INTEGER,
  industry TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  purpose TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'completed', 'paused')),
  template_id UUID REFERENCES campaign_templates(id),
  arc JSONB,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  target_audience TEXT,
  industry_customization JSONB,
  performance_prediction JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign Pieces Table
CREATE TABLE IF NOT EXISTS campaign_pieces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  phase_id TEXT,
  title TEXT NOT NULL,
  content TEXT,
  emotional_trigger TEXT,
  scheduled_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generated', 'published')),
  channel TEXT,
  piece_order INTEGER NOT NULL,
  template_id UUID REFERENCES campaign_templates(id),
  performance_prediction JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Single Content Table (for content mode)
CREATE TABLE IF NOT EXISTS single_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  purpose TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'scheduled', 'published')),
  channel TEXT,
  template_id UUID REFERENCES campaign_templates(id),
  emotional_trigger TEXT,
  connection_ids UUID[],
  themes JSONB,
  performance_prediction JSONB,
  scheduled_date TIMESTAMPTZ,
  published_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_brand_id ON campaigns(brand_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_pieces_campaign_id ON campaign_pieces(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_pieces_status ON campaign_pieces(status);
CREATE INDEX IF NOT EXISTS idx_single_content_brand_id ON single_content(brand_id);
CREATE INDEX IF NOT EXISTS idx_single_content_status ON single_content(status);
CREATE INDEX IF NOT EXISTS idx_campaign_templates_type ON campaign_templates(type);
CREATE INDEX IF NOT EXISTS idx_campaign_templates_category ON campaign_templates(category);

-- RLS Policies
ALTER TABLE campaign_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE single_content ENABLE ROW LEVEL SECURITY;

-- Campaign Templates: Public read, admin write
CREATE POLICY "Campaign templates are viewable by all" ON campaign_templates
  FOR SELECT USING (true);

CREATE POLICY "Campaign templates are insertable by authenticated users" ON campaign_templates
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Campaign templates are updatable by authenticated users" ON campaign_templates
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Campaigns: Users can manage their own brand's campaigns
CREATE POLICY "Users can view their brand campaigns" ON campaigns
  FOR SELECT USING (
    brand_id IN (
      SELECT id FROM brands WHERE id = brand_id
    )
  );

CREATE POLICY "Users can insert campaigns for their brands" ON campaigns
  FOR INSERT WITH CHECK (
    brand_id IN (
      SELECT id FROM brands WHERE id = brand_id
    )
  );

CREATE POLICY "Users can update their brand campaigns" ON campaigns
  FOR UPDATE USING (
    brand_id IN (
      SELECT id FROM brands WHERE id = brand_id
    )
  );

CREATE POLICY "Users can delete their brand campaigns" ON campaigns
  FOR DELETE USING (
    brand_id IN (
      SELECT id FROM brands WHERE id = brand_id
    )
  );

-- Campaign Pieces: Access through campaign ownership
CREATE POLICY "Users can view their campaign pieces" ON campaign_pieces
  FOR SELECT USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE brand_id IN (
        SELECT id FROM brands WHERE id = brand_id
      )
    )
  );

CREATE POLICY "Users can insert campaign pieces" ON campaign_pieces
  FOR INSERT WITH CHECK (
    campaign_id IN (
      SELECT id FROM campaigns WHERE brand_id IN (
        SELECT id FROM brands WHERE id = brand_id
      )
    )
  );

CREATE POLICY "Users can update their campaign pieces" ON campaign_pieces
  FOR UPDATE USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE brand_id IN (
        SELECT id FROM brands WHERE id = brand_id
      )
    )
  );

CREATE POLICY "Users can delete their campaign pieces" ON campaign_pieces
  FOR DELETE USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE brand_id IN (
        SELECT id FROM brands WHERE id = brand_id
      )
    )
  );

-- Single Content: Users can manage their own brand's content
CREATE POLICY "Users can view their brand content" ON single_content
  FOR SELECT USING (
    brand_id IN (
      SELECT id FROM brands WHERE id = brand_id
    )
  );

CREATE POLICY "Users can insert content for their brands" ON single_content
  FOR INSERT WITH CHECK (
    brand_id IN (
      SELECT id FROM brands WHERE id = brand_id
    )
  );

CREATE POLICY "Users can update their brand content" ON single_content
  FOR UPDATE USING (
    brand_id IN (
      SELECT id FROM brands WHERE id = brand_id
    )
  );

CREATE POLICY "Users can delete their brand content" ON single_content
  FOR DELETE USING (
    brand_id IN (
      SELECT id FROM brands WHERE id = brand_id
    )
  );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaign_templates_updated_at
  BEFORE UPDATE ON campaign_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_pieces_updated_at
  BEFORE UPDATE ON campaign_pieces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_single_content_updated_at
  BEFORE UPDATE ON single_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
