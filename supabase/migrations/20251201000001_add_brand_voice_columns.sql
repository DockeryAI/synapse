-- Add brand_voice and customer_stories columns to marba_uvps table
-- These columns store brand voice/tone analysis and customer testimonials
-- Used by the V4 Content Engine to match brand tone and ground stories in real data

-- Add brand_voice column (JSONB for flexible structure)
ALTER TABLE marba_uvps
ADD COLUMN IF NOT EXISTS brand_voice JSONB DEFAULT NULL;

-- Add customer_stories column (JSONB array of testimonials)
ALTER TABLE marba_uvps
ADD COLUMN IF NOT EXISTS customer_stories JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN marba_uvps.brand_voice IS 'Brand voice profile: tone, values, personality, vocabulary patterns, etc. Extracted from website analysis.';
COMMENT ON COLUMN marba_uvps.customer_stories IS 'Array of customer testimonials/stories extracted from website. Used to ground content in real experiences.';
