-- Design studio templates
CREATE TABLE IF NOT EXISTS design_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('social', 'ad', 'email', 'presentation', 'other')),
  platform TEXT, -- 'instagram-post', 'facebook-cover', 'linkedin-banner', etc.

  thumbnail_url TEXT,
  canvas_data JSONB NOT NULL, -- Fabric.js/Konva canvas JSON

  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),

  usage_count INT DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_design_templates_category ON design_templates(category);
CREATE INDEX idx_design_templates_platform ON design_templates(platform);
CREATE INDEX idx_design_templates_public ON design_templates(is_public) WHERE is_public = true;

-- RLS Policies
ALTER TABLE design_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public templates are viewable by all"
  ON design_templates FOR SELECT
  USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create their own templates"
  ON design_templates FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own templates"
  ON design_templates FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own templates"
  ON design_templates FOR DELETE
  USING (created_by = auth.uid());
