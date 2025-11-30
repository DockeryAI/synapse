-- Brand Profiles Table
-- Stores business profile and market definition for each brand
-- Created: 2025-11-28

-- Create the brand_profiles table
CREATE TABLE IF NOT EXISTS brand_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,

  -- Customer type
  customer_type TEXT CHECK (customer_type IN ('b2b', 'b2c', 'b2b2c')),

  -- Geographic scope
  geographic_scope TEXT CHECK (geographic_scope IN ('local', 'regional', 'national', 'global')),
  headquarters TEXT,
  primary_regions TEXT[],
  focus_markets TEXT[],

  -- Profile type (from profile-detection.service.ts)
  profile_type TEXT CHECK (profile_type IN (
    'local-service-b2b',
    'local-service-b2c',
    'regional-b2b-agency',
    'regional-retail-b2c',
    'national-saas-b2b',
    'national-product-b2c',
    'global-saas-b2b'
  )),

  -- Auto-detection tracking
  is_auto_detected BOOLEAN DEFAULT true,
  detection_signals JSONB DEFAULT '[]'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one profile per brand
  UNIQUE(brand_id)
);

-- Create index for fast brand lookup
CREATE INDEX IF NOT EXISTS idx_brand_profiles_brand_id ON brand_profiles(brand_id);

-- Create index for profile type queries
CREATE INDEX IF NOT EXISTS idx_brand_profiles_profile_type ON brand_profiles(profile_type);

-- Enable RLS
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for development (allows all operations)
-- In production, this should be restricted to authenticated users
DO $$
BEGIN
  -- Drop existing policies if any
  DROP POLICY IF EXISTS "brand_profiles_select_policy" ON brand_profiles;
  DROP POLICY IF EXISTS "brand_profiles_insert_policy" ON brand_profiles;
  DROP POLICY IF EXISTS "brand_profiles_update_policy" ON brand_profiles;
  DROP POLICY IF EXISTS "brand_profiles_delete_policy" ON brand_profiles;
  DROP POLICY IF EXISTS "brand_profiles_allow_all" ON brand_profiles;

  -- Create permissive policy for development
  CREATE POLICY "brand_profiles_allow_all" ON brand_profiles
    FOR ALL
    USING (true)
    WITH CHECK (true);
END $$;

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_brand_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS brand_profiles_updated_at ON brand_profiles;
CREATE TRIGGER brand_profiles_updated_at
  BEFORE UPDATE ON brand_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_brand_profiles_updated_at();

-- Add comment
COMMENT ON TABLE brand_profiles IS 'Stores business profile and market definition for each brand, used for trigger relevance filtering and content generation';
