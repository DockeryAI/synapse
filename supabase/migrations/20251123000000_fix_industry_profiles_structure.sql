-- FIX INDUSTRY_PROFILES TABLE WITH PROPER STRUCTURE
-- This creates the table structure that OnDemandProfileGeneration.ts expects

-- Drop any existing table
DROP TABLE IF EXISTS industry_profiles CASCADE;

-- Create table matching what OnDemandProfileGeneration.ts expects (lines 496-505)
CREATE TABLE industry_profiles (
  id TEXT PRIMARY KEY, -- Lowercase, hyphenated industry name
  name TEXT NOT NULL,  -- Industry display name
  naics_code TEXT,     -- NAICS code reference
  profile_data JSONB NOT NULL, -- All profile fields stored here
  is_active BOOLEAN DEFAULT true,
  business_count INTEGER DEFAULT 0,
  template_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_industry_profiles_naics ON industry_profiles(naics_code);
CREATE INDEX idx_industry_profiles_name ON industry_profiles(name);
CREATE INDEX idx_industry_profiles_active ON industry_profiles(is_active);

-- Full text search on name
CREATE INDEX idx_industry_profiles_search
  ON industry_profiles USING gin(to_tsvector('english', name));

-- RLS Policies following the guide (with TO clauses!)
ALTER TABLE industry_profiles ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can view profiles)
CREATE POLICY "Public read industry profiles"
  ON industry_profiles
  FOR SELECT
  TO public  -- Critical: Must have TO clause for PostgREST!
  USING (true);

-- Service role can manage profiles
CREATE POLICY "Service role manage industry profiles"
  ON industry_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to insert/update (for OnDemandProfileGeneration)
CREATE POLICY "Authenticated users can insert profiles"
  ON industry_profiles
  FOR INSERT
  TO authenticated, anon  -- Allow both for flexibility
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update profiles"
  ON industry_profiles
  FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Grant permissions (Layer 1 - table level)
GRANT ALL ON industry_profiles TO anon;
GRANT ALL ON industry_profiles TO authenticated;
GRANT ALL ON industry_profiles TO service_role;
GRANT ALL ON industry_profiles TO public;

-- Create naics_codes table (referenced by code)
CREATE TABLE IF NOT EXISTS naics_codes (
  code TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  keywords TEXT[],
  category TEXT,
  has_full_profile BOOLEAN DEFAULT false,
  popularity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for naics_codes
ALTER TABLE naics_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read naics codes"
  ON naics_codes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service manage naics codes"
  ON naics_codes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON naics_codes TO anon;
GRANT ALL ON naics_codes TO authenticated;
GRANT ALL ON naics_codes TO service_role;
GRANT ALL ON naics_codes TO public;

-- Fix location_detection_cache table (for 406 errors)
CREATE TABLE IF NOT EXISTS location_detection_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT UNIQUE NOT NULL,
  city TEXT,
  state TEXT,
  confidence DECIMAL(3,2),
  method TEXT,
  reasoning TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for location cache
ALTER TABLE location_detection_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read location cache"
  ON location_detection_cache
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public insert location cache"
  ON location_detection_cache
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public update location cache"
  ON location_detection_cache
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON location_detection_cache TO anon;
GRANT ALL ON location_detection_cache TO authenticated;
GRANT ALL ON location_detection_cache TO public;

-- Force PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Tables created with proper structure and RLS policies!';
  RAISE NOTICE '   - industry_profiles: Ready for JSONB data';
  RAISE NOTICE '   - naics_codes: Ready for lookups';
  RAISE NOTICE '   - location_detection_cache: Fixed 406 errors';
  RAISE NOTICE '   All policies include TO clauses for PostgREST compatibility';
END $$;