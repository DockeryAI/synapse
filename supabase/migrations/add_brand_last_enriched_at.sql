-- Migration: Add last_enriched_at to brands table
-- Purpose: Track when brand intelligence was last refreshed for auto-refresh feature
-- Date: 2025-11-12

-- Add last_enriched_at column to brands table
ALTER TABLE brands
ADD COLUMN IF NOT EXISTS last_enriched_at TIMESTAMP WITH TIME ZONE;

-- Add index for efficient queries on stale brands
CREATE INDEX IF NOT EXISTS idx_brands_last_enriched_at
ON brands(last_enriched_at)
WHERE last_enriched_at IS NOT NULL;

-- Add comment
COMMENT ON COLUMN brands.last_enriched_at IS 'Timestamp of when brand intelligence was last enriched/refreshed';

-- Create function to update last_enriched_at automatically
CREATE OR REPLACE FUNCTION update_brand_enrichment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Update brand's last_enriched_at when any mirror_section is updated
  UPDATE brands
  SET last_enriched_at = NOW()
  WHERE id = NEW.brand_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update brand timestamp when sections are enriched
DROP TRIGGER IF EXISTS trigger_update_brand_enrichment ON mirror_sections;
CREATE TRIGGER trigger_update_brand_enrichment
AFTER INSERT OR UPDATE ON mirror_sections
FOR EACH ROW
WHEN (NEW.last_enriched_at IS NOT NULL)
EXECUTE FUNCTION update_brand_enrichment_timestamp();

-- Backfill last_enriched_at for existing brands based on most recent mirror_section update
UPDATE brands
SET last_enriched_at = (
  SELECT MAX(last_enriched_at)
  FROM mirror_sections
  WHERE mirror_sections.brand_id = brands.id
)
WHERE last_enriched_at IS NULL;
