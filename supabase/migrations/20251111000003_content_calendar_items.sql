-- Content calendar items (enhanced for MARBA)
CREATE TABLE IF NOT EXISTS content_calendar_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

  -- Content
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('social', 'blog', 'email', 'gmb', 'video')),
  platform TEXT CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'twitter', 'youtube', 'gmb')),

  -- Scheduling
  scheduled_for TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('idea', 'draft', 'scheduled', 'published', 'failed')),

  -- Metadata
  pillar_id UUID, -- Links to message pillar
  goal_id UUID, -- Links to MIRROR Intend objective (mirror_intend_objectives table)

  -- Generation metadata
  generation_mode TEXT CHECK (generation_mode IN ('marba', 'synapse')), -- NEW: Track which mode was used
  synapse_enhanced BOOLEAN DEFAULT false,
  uvp_integrated BOOLEAN DEFAULT false,

  -- Assets
  image_url TEXT,
  video_url TEXT,
  design_data JSONB, -- Design studio canvas data for future editing

  -- Publishing
  published_at TIMESTAMP WITH TIME ZONE,
  platform_post_id TEXT, -- ID from external platform
  publish_error TEXT,

  -- Analytics
  views INT DEFAULT 0,
  engagement INT DEFAULT 0,
  clicks INT DEFAULT 0,
  shares INT DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_content_calendar_brand ON content_calendar_items(brand_id);
CREATE INDEX idx_content_calendar_scheduled ON content_calendar_items(scheduled_for);
CREATE INDEX idx_content_calendar_status ON content_calendar_items(status);
CREATE INDEX idx_content_calendar_platform ON content_calendar_items(platform);
CREATE INDEX idx_content_calendar_brand_scheduled ON content_calendar_items(brand_id, scheduled_for);

-- Updated at trigger
CREATE TRIGGER update_content_calendar_items_updated_at
  BEFORE UPDATE ON content_calendar_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE content_calendar_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own content"
  ON content_calendar_items FOR SELECT
  USING (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own content"
  ON content_calendar_items FOR INSERT
  WITH CHECK (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own content"
  ON content_calendar_items FOR UPDATE
  USING (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own content"
  ON content_calendar_items FOR DELETE
  USING (brand_id IN (
    SELECT id FROM brands WHERE user_id = auth.uid()
  ));
