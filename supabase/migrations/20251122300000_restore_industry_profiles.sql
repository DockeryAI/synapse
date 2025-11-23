-- RESTORE INDUSTRY_PROFILES TABLE TO ORIGINAL STRUCTURE
-- This restores the industry_profiles table that was working before V2 build

-- Drop the broken table if it exists
DROP TABLE IF EXISTS industry_profiles CASCADE;

-- Recreate with CORRECT structure (as it was in 20251111000023_industry_profiles.sql)
CREATE TABLE industry_profiles (
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
CREATE INDEX idx_industry_profiles_naics ON industry_profiles(naics_code);
CREATE INDEX idx_industry_profiles_full ON industry_profiles(has_full_profile) WHERE has_full_profile = true;
CREATE INDEX idx_industry_profiles_level ON industry_profiles(level);
CREATE INDEX idx_industry_profiles_parent ON industry_profiles(parent_code) WHERE parent_code IS NOT NULL;

-- Full text search index on title and description
CREATE INDEX idx_industry_profiles_search
  ON industry_profiles USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- RLS Policies - Allow public read access
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

-- Grant permissions
GRANT ALL ON industry_profiles TO anon;
GRANT ALL ON industry_profiles TO authenticated;
GRANT ALL ON industry_profiles TO public;

-- Notify PostgREST to reload
NOTIFY pgrst, 'reload schema';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ industry_profiles table RESTORED to original structure!';
  RAISE NOTICE '   Now run the data import to restore your 147 profiles.';
END $$;