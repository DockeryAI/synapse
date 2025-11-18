-- Add onboarding insights columns to brands table
-- These store all intelligence gathered during onboarding for dashboard display

ALTER TABLE brands
ADD COLUMN IF NOT EXISTS website_analysis JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS location_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS services_products JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS customer_triggers JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS market_trends JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS competitor_data JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS brand_voice JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for JSON queries
CREATE INDEX IF NOT EXISTS idx_brands_website_analysis
  ON brands USING gin(website_analysis);

CREATE INDEX IF NOT EXISTS idx_brands_services_products
  ON brands USING gin(services_products);

CREATE INDEX IF NOT EXISTS idx_brands_customer_triggers
  ON brands USING gin(customer_triggers);

-- Add comments
COMMENT ON COLUMN brands.website_analysis IS 'UVPs, brand analysis, and website content from onboarding';
COMMENT ON COLUMN brands.location_data IS 'Detected location, service area, and geographic data';
COMMENT ON COLUMN brands.services_products IS 'Array of services/products identified during onboarding';
COMMENT ON COLUMN brands.customer_triggers IS 'Psychological triggers and customer pain points';
COMMENT ON COLUMN brands.market_trends IS 'Industry trends and market insights';
COMMENT ON COLUMN brands.competitor_data IS 'Competitive intelligence gathered';
COMMENT ON COLUMN brands.brand_voice IS 'Tone, personality, archetype from brand voice analysis';
COMMENT ON COLUMN brands.onboarding_completed_at IS 'Timestamp when onboarding was fully completed';
