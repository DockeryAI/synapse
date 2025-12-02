-- Add brand_voice column to marba_uvps table
ALTER TABLE marba_uvps ADD COLUMN IF NOT EXISTS brand_voice JSONB;

-- Add comment
COMMENT ON COLUMN marba_uvps.brand_voice IS 'Brand voice characteristics for content generation';
