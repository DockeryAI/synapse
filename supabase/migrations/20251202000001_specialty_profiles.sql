-- Specialty Profiles Table for Dynamic Profile Generation
-- Stores LLM-generated profiles for specialty businesses that don't match NAICS codes
-- Example: "CAI platform for insurance" - no NAICS code exists for this specialty

-- Generation status enum
DO $$ BEGIN
  CREATE TYPE specialty_profile_status AS ENUM ('pending', 'generating', 'failed', 'complete', 'needs_human');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Main specialty_profiles table
CREATE TABLE IF NOT EXISTS specialty_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Lookup keys
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  specialty_hash TEXT NOT NULL, -- SHA256 of normalized specialty description for deduplication

  -- Specialty identification
  specialty_name TEXT NOT NULL, -- Human readable: "Conversational AI for Insurance"
  specialty_description TEXT, -- Longer description of the specialty
  base_naics_code TEXT, -- Nearest NAICS code we could find (for reference only)
  business_profile_type TEXT, -- One of 7 types: local-service-b2c, national-saas-b2b, etc.

  -- Generation metadata
  generation_status specialty_profile_status DEFAULT 'pending',
  generation_started_at TIMESTAMPTZ,
  generation_completed_at TIMESTAMPTZ,
  generation_attempts INTEGER DEFAULT 0,
  generation_error TEXT, -- Last error message if failed

  -- The full profile data (matches EnhancedIndustryProfile structure)
  profile_data JSONB,

  -- Trigger-specific data extracted for quick access
  customer_triggers JSONB, -- Array of {trigger, urgency, frequency}
  common_pain_points TEXT[],
  common_buying_triggers TEXT[],
  urgency_drivers TEXT[],
  objection_handlers JSONB, -- Array of {objection, response, effectiveness}

  -- Tab visibility configuration
  enabled_tabs JSONB DEFAULT '{
    "triggers": true,
    "proof": true,
    "trends": true,
    "conversations": true,
    "competitors": true,
    "local": false,
    "weather": false
  }'::jsonb,

  -- Quality metrics
  multipass_validation_score INTEGER, -- 0-100, from 3-pass validation
  human_reviewed BOOLEAN DEFAULT false,
  human_reviewed_at TIMESTAMPTZ,
  human_reviewer_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_specialty_profiles_hash
  ON specialty_profiles(specialty_hash);

CREATE INDEX IF NOT EXISTS idx_specialty_profiles_brand
  ON specialty_profiles(brand_id)
  WHERE brand_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_specialty_profiles_status
  ON specialty_profiles(generation_status);

CREATE INDEX IF NOT EXISTS idx_specialty_profiles_needs_human
  ON specialty_profiles(generation_status)
  WHERE generation_status = 'needs_human';

CREATE INDEX IF NOT EXISTS idx_specialty_profiles_base_naics
  ON specialty_profiles(base_naics_code)
  WHERE base_naics_code IS NOT NULL;

-- Full text search on specialty name and description
CREATE INDEX IF NOT EXISTS idx_specialty_profiles_search
  ON specialty_profiles
  USING gin(to_tsvector('english', specialty_name || ' ' || COALESCE(specialty_description, '')));

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_specialty_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_specialty_profiles_updated_at ON specialty_profiles;
CREATE TRIGGER update_specialty_profiles_updated_at
  BEFORE UPDATE ON specialty_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_specialty_profiles_updated_at();

-- RLS Policies
ALTER TABLE specialty_profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can view completed specialty profiles (for caching/reuse)
CREATE POLICY "Anyone can view completed specialty profiles"
  ON specialty_profiles FOR SELECT
  TO public
  USING (generation_status = 'complete');

-- Authenticated users can view their own pending/failed profiles
CREATE POLICY "Users can view own profiles"
  ON specialty_profiles FOR SELECT
  TO authenticated
  USING (
    brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
    OR generation_status = 'complete'
  );

-- Service role can do everything (for Edge Functions)
CREATE POLICY "Service role full access"
  ON specialty_profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Anon role can insert new profiles (for onboarding before auth)
CREATE POLICY "Anon can insert specialty profiles"
  ON specialty_profiles FOR INSERT
  TO anon
  WITH CHECK (true);

-- Anon can update their own pending profiles
CREATE POLICY "Anon can update pending profiles"
  ON specialty_profiles FOR UPDATE
  TO anon
  USING (generation_status IN ('pending', 'generating'));

-- Add specialty_profile_id reference to brands table
ALTER TABLE brands
  ADD COLUMN IF NOT EXISTS specialty_profile_id UUID REFERENCES specialty_profiles(id);

CREATE INDEX IF NOT EXISTS idx_brands_specialty_profile
  ON brands(specialty_profile_id)
  WHERE specialty_profile_id IS NOT NULL;

-- Human intervention queue view
CREATE OR REPLACE VIEW specialty_profiles_needing_human AS
SELECT
  id,
  specialty_name,
  specialty_description,
  base_naics_code,
  generation_attempts,
  generation_error,
  created_at
FROM specialty_profiles
WHERE generation_status = 'needs_human'
ORDER BY created_at ASC;

-- Comments for documentation
COMMENT ON TABLE specialty_profiles IS 'Dynamically generated industry profiles for specialty businesses that dont match NAICS codes';
COMMENT ON COLUMN specialty_profiles.specialty_hash IS 'SHA256 hash of normalized specialty description for deduplication across brands';
COMMENT ON COLUMN specialty_profiles.business_profile_type IS 'One of 7 types: local-service-b2c, local-service-b2b, regional-b2b-agency, regional-retail-b2c, national-saas-b2b, national-product-b2c, global-saas-b2b';
COMMENT ON COLUMN specialty_profiles.profile_data IS 'Full EnhancedIndustryProfile JSONB matching the 40-field schema';
COMMENT ON COLUMN specialty_profiles.multipass_validation_score IS '0-100 quality score from 3-pass LLM validation';
