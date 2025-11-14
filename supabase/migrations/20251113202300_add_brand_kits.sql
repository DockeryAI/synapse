-- ============================================================================
-- BRAND KITS TABLE
-- ============================================================================
-- Store brand visual identity for automated visual generation
-- Extracted from Mirror diagnostics or set manually
--
-- Philosophy: "Your brand, automated beautifully"
-- ============================================================================

-- Brand Kits: Visual identity for each brand
CREATE TABLE brand_kits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid REFERENCES brands(id) ON DELETE CASCADE,

  -- Colors
  primary_color text NOT NULL DEFAULT '#1e40af',
  secondary_color text NOT NULL DEFAULT '#64748b',
  accent_color text,
  color_palette text[], -- Full palette if available

  -- Typography
  font_family text NOT NULL DEFAULT 'Inter',
  heading_font text,
  body_font text,

  -- Logo
  logo_url text,
  logo_position text DEFAULT 'top-left',

  -- Style
  style text NOT NULL DEFAULT 'professional',
  tone text,

  -- Metadata
  source text NOT NULL DEFAULT 'defaults', -- 'mirror', 'manual', 'ai-generated', 'defaults'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Constraints
  CONSTRAINT valid_style CHECK (style IN ('professional', 'friendly', 'bold', 'minimal', 'elegant')),
  CONSTRAINT valid_source CHECK (source IN ('mirror', 'manual', 'ai-generated', 'defaults')),
  CONSTRAINT unique_brand_kit UNIQUE (brand_id)
);

-- Indexes
CREATE INDEX idx_brand_kits_brand_id ON brand_kits(brand_id);
CREATE INDEX idx_brand_kits_style ON brand_kits(style);

-- RLS Policies
ALTER TABLE brand_kits ENABLE ROW LEVEL SECURITY;

-- Users can view their own brand kits
CREATE POLICY "Users can view their brand kits"
  ON brand_kits
  FOR SELECT
  USING (
    brand_id IN (
      SELECT id FROM brands WHERE user_id = auth.uid()
    )
  );

-- Users can insert their own brand kits
CREATE POLICY "Users can create their brand kits"
  ON brand_kits
  FOR INSERT
  WITH CHECK (
    brand_id IN (
      SELECT id FROM brands WHERE user_id = auth.uid()
    )
  );

-- Users can update their own brand kits
CREATE POLICY "Users can update their brand kits"
  ON brand_kits
  FOR UPDATE
  USING (
    brand_id IN (
      SELECT id FROM brands WHERE user_id = auth.uid()
    )
  );

-- Users can delete their own brand kits
CREATE POLICY "Users can delete their brand kits"
  ON brand_kits
  FOR DELETE
  USING (
    brand_id IN (
      SELECT id FROM brands WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_brand_kits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER brand_kits_updated_at
  BEFORE UPDATE ON brand_kits
  FOR EACH ROW
  EXECUTE FUNCTION update_brand_kits_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE brand_kits IS 'Brand visual identity for automated visual generation';
COMMENT ON COLUMN brand_kits.primary_color IS 'Main brand color (hex)';
COMMENT ON COLUMN brand_kits.secondary_color IS 'Secondary brand color (hex)';
COMMENT ON COLUMN brand_kits.accent_color IS 'Accent color for highlights (hex)';
COMMENT ON COLUMN brand_kits.style IS 'Visual style: professional, friendly, bold, minimal, elegant';
COMMENT ON COLUMN brand_kits.source IS 'How brand kit was created: mirror, manual, ai-generated, defaults';
