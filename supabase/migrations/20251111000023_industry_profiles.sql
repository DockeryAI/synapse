-- Industry Profiles Table for NAICS Codes
-- Stores North American Industry Classification System (NAICS) codes with full profiles

CREATE TABLE IF NOT EXISTS industry_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  naics_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  level INTEGER NOT NULL,
  parent_code TEXT,
  is_standard BOOLEAN DEFAULT true,
  keywords TEXT[],
  has_full_profile BOOLEAN DEFAULT false,

  -- Full profile data (populated from Brandock migration)
  industry_overview TEXT,
  market_size TEXT,
  growth_rate TEXT,
  key_trends TEXT[],
  customer_segments TEXT[],
  pain_points TEXT[],
  common_objections TEXT[],
  success_metrics TEXT[],
  regulatory_considerations TEXT[],
  seasonal_factors TEXT[],
  competitive_landscape TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_industry_profiles_naics ON industry_profiles(naics_code);
CREATE INDEX IF NOT EXISTS idx_industry_profiles_full ON industry_profiles(has_full_profile) WHERE has_full_profile = true;
CREATE INDEX IF NOT EXISTS idx_industry_profiles_level ON industry_profiles(level);
CREATE INDEX IF NOT EXISTS idx_industry_profiles_parent ON industry_profiles(parent_code) WHERE parent_code IS NOT NULL;

-- Full text search index on title and description
CREATE INDEX IF NOT EXISTS idx_industry_profiles_search
  ON industry_profiles USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Updated at trigger
CREATE TRIGGER update_industry_profiles_updated_at
  BEFORE UPDATE ON industry_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies (read-only for all authenticated users, write for service role)
ALTER TABLE industry_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view industry profiles"
  ON industry_profiles FOR SELECT
  TO public
  USING (true);

-- Only service role can modify (for data migration)
CREATE POLICY "Service role can insert industry profiles"
  ON industry_profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update industry profiles"
  ON industry_profiles FOR UPDATE
  TO service_role
  USING (true);

CREATE POLICY "Service role can delete industry profiles"
  ON industry_profiles FOR DELETE
  TO service_role
  USING (true);

-- Add industry NAICS code reference to brands table
ALTER TABLE brands ADD COLUMN IF NOT EXISTS naics_code TEXT REFERENCES industry_profiles(naics_code);
CREATE INDEX IF NOT EXISTS idx_brands_naics ON brands(naics_code);

-- Comments for documentation
COMMENT ON TABLE industry_profiles IS 'NAICS industry classification codes with full marketing profiles';
COMMENT ON COLUMN industry_profiles.naics_code IS 'NAICS code (e.g., 541618 for Management Consulting)';
COMMENT ON COLUMN industry_profiles.has_full_profile IS 'True if this code has complete marketing profile data from Brandock migration';
COMMENT ON COLUMN industry_profiles.level IS '2=sector, 3=subsector, 4=industry group, 5=industry, 6=national industry';
