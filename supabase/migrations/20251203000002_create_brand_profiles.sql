-- PRD Feature: SYNAPSE-V6
-- Brand Profiles Table for UVP-driven intelligent tab routing
--
-- This table stores brand-specific profile configurations derived from UVP analysis.
-- Industry profiles remain in industry_profiles table as optional boosters.

-- Profile Types (6 types based on business model)
CREATE TYPE business_profile_type AS ENUM (
  'local-b2c',       -- Local service businesses serving consumers (plumber, restaurant)
  'local-b2b',       -- Local businesses serving other businesses (commercial cleaning)
  'regional-agency', -- Regional agencies/consultants (marketing agency)
  'regional-retail', -- Multi-location retail (regional restaurant chain)
  'national-saas',   -- National/global SaaS companies
  'national-product' -- National product companies (e-commerce)
);

CREATE TABLE IF NOT EXISTS brand_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

  -- Deduplication
  profile_hash TEXT NOT NULL, -- Hash of UVP data for dedup

  -- Profile type detection
  profile_type business_profile_type NOT NULL,

  -- Full UVP data (CompleteUVP JSON)
  uvp_data JSONB NOT NULL,

  -- Optional industry match (reference to 385 NAICS profiles)
  industry_match_code TEXT REFERENCES industry_profiles(naics_code),
  industry_match_confidence DECIMAL(3,2), -- 0.00 to 1.00

  -- Tab configuration (which tabs to show/prioritize)
  enabled_tabs TEXT[] NOT NULL DEFAULT ARRAY[
    'voc',          -- Voice of Customer
    'community',    -- Community Discussions
    'competitive',  -- Competitive Intelligence
    'trends',       -- Industry Trends
    'search',       -- Search Intent
    'local_timing'  -- Local/Timing Signals
  ],

  -- API priorities per tab (ordered list of API names)
  api_priorities JSONB NOT NULL DEFAULT '{
    "voc": ["outscraper", "apify-g2", "serper"],
    "community": ["reddit", "hackernews", "apify-twitter"],
    "competitive": ["semrush", "meta-ads"],
    "trends": ["newsapi", "perplexity"],
    "search": ["semrush", "serper-autocomplete"],
    "local_timing": ["openweather", "serper-events", "newsapi"]
  }'::jsonb,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_brand_profiles_brand ON brand_profiles(brand_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_brand_profiles_hash ON brand_profiles(brand_id, profile_hash);
CREATE INDEX IF NOT EXISTS idx_brand_profiles_type ON brand_profiles(profile_type);
CREATE INDEX IF NOT EXISTS idx_brand_profiles_industry ON brand_profiles(industry_match_code)
  WHERE industry_match_code IS NOT NULL;

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_brand_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_brand_profiles_updated_at
  BEFORE UPDATE ON brand_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_brand_profiles_updated_at();

-- RLS Policies
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read brand profiles (needed for onboarding flow)
CREATE POLICY "Anyone can view brand profiles"
  ON brand_profiles FOR SELECT
  TO public
  USING (true);

-- Anyone can insert brand profiles (for anonymous onboarding)
CREATE POLICY "Anyone can insert brand profiles"
  ON brand_profiles FOR INSERT
  TO public
  WITH CHECK (true);

-- Anyone can update their own brand's profile
CREATE POLICY "Anyone can update brand profiles"
  ON brand_profiles FOR UPDATE
  TO public
  USING (true);

-- Add helpful comments
COMMENT ON TABLE brand_profiles IS 'V6 brand-specific profiles with UVP data and intelligent tab routing';
COMMENT ON COLUMN brand_profiles.profile_type IS 'Business model type for API routing (local-b2c, national-saas, etc)';
COMMENT ON COLUMN brand_profiles.uvp_data IS 'Complete UVP JSON with target_customer, key_benefit, transformation, unique_solution';
COMMENT ON COLUMN brand_profiles.industry_match_code IS 'Optional NAICS code if matched to 385 industry profiles';
COMMENT ON COLUMN brand_profiles.enabled_tabs IS 'Which insight tabs to show for this profile type';
COMMENT ON COLUMN brand_profiles.api_priorities IS 'Ordered API list per tab based on profile type';
