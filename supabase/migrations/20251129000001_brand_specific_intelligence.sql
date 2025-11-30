-- Phase 13: Brand-Specific Intelligence Tables
-- These tables store UVP-contextualized data per brand+competitor combination
-- Global competitor profiles remain shared, but insights are brand-specific

-- ============================================================================
-- BRAND COMPETITOR VOICE
-- Stores customer voice insights for each brand+competitor pair
-- Pain points, desires, objections, and switching triggers are framed
-- relative to the brand's UVP
-- ============================================================================

CREATE TABLE IF NOT EXISTS brand_competitor_voice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL,
  competitor_id UUID NOT NULL REFERENCES competitor_profiles(id) ON DELETE CASCADE,

  -- Customer Voice Data (framed relative to brand's UVP)
  pain_points JSONB DEFAULT '[]'::jsonb,
  desires JSONB DEFAULT '[]'::jsonb,
  objections JSONB DEFAULT '[]'::jsonb,
  switching_triggers JSONB DEFAULT '[]'::jsonb,

  -- Source Quotes with full provenance
  -- Format: [{ quote, source, sentiment, url, date, author, relevance }]
  source_quotes JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- One voice record per brand+competitor
  UNIQUE(brand_id, competitor_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_brand_competitor_voice_brand_id
  ON brand_competitor_voice(brand_id);

CREATE INDEX IF NOT EXISTS idx_brand_competitor_voice_competitor_id
  ON brand_competitor_voice(competitor_id);

-- ============================================================================
-- BRAND COMPETITOR BATTLECARDS
-- Stores competitive battlecards for each brand+competitor pair
-- All advantages and objection handlers are written relative to the brand's UVP
-- ============================================================================

CREATE TABLE IF NOT EXISTS brand_competitor_battlecards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL,
  competitor_id UUID NOT NULL REFERENCES competitor_profiles(id) ON DELETE CASCADE,

  -- Battlecard Data (all relative to brand's positioning)
  our_advantages JSONB DEFAULT '[]'::jsonb,
  their_advantages JSONB DEFAULT '[]'::jsonb,

  -- Objection handlers: [{ objection, response }]
  key_objection_handlers JSONB DEFAULT '[]'::jsonb,

  -- Strategic content
  win_themes JSONB DEFAULT '[]'::jsonb,
  loss_reasons JSONB DEFAULT '[]'::jsonb,
  ideal_icp_overlap TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- One battlecard per brand+competitor
  UNIQUE(brand_id, competitor_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_brand_competitor_battlecards_brand_id
  ON brand_competitor_battlecards(brand_id);

CREATE INDEX IF NOT EXISTS idx_brand_competitor_battlecards_competitor_id
  ON brand_competitor_battlecards(competitor_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE brand_competitor_voice ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_competitor_battlecards ENABLE ROW LEVEL SECURITY;

-- Voice policies
CREATE POLICY "Users can view their brand's competitor voice"
  ON brand_competitor_voice FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their brand's competitor voice"
  ON brand_competitor_voice FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their brand's competitor voice"
  ON brand_competitor_voice FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their brand's competitor voice"
  ON brand_competitor_voice FOR DELETE
  USING (true);

-- Battlecard policies
CREATE POLICY "Users can view their brand's battlecards"
  ON brand_competitor_battlecards FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their brand's battlecards"
  ON brand_competitor_battlecards FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their brand's battlecards"
  ON brand_competitor_battlecards FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their brand's battlecards"
  ON brand_competitor_battlecards FOR DELETE
  USING (true);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_brand_intelligence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_brand_competitor_voice_updated_at
  BEFORE UPDATE ON brand_competitor_voice
  FOR EACH ROW
  EXECUTE FUNCTION update_brand_intelligence_updated_at();

CREATE TRIGGER update_brand_competitor_battlecards_updated_at
  BEFORE UPDATE ON brand_competitor_battlecards
  FOR EACH ROW
  EXECUTE FUNCTION update_brand_intelligence_updated_at();

-- ============================================================================
-- ADD COLUMNS TO COMPETITOR_GAPS FOR PRODUCT/SEGMENT MAPPING
-- ============================================================================

-- Add applicable_products column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'competitor_gaps' AND column_name = 'applicable_products'
  ) THEN
    ALTER TABLE competitor_gaps ADD COLUMN applicable_products JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add applicable_segments column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'competitor_gaps' AND column_name = 'applicable_segments'
  ) THEN
    ALTER TABLE competitor_gaps ADD COLUMN applicable_segments JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Comment on new columns
COMMENT ON COLUMN competitor_gaps.applicable_products IS 'Products from brand UVP that address this gap: [{ product, fit, why }]';
COMMENT ON COLUMN competitor_gaps.applicable_segments IS 'Customer segments most affected: [{ segment, readiness, pain_point }]';
