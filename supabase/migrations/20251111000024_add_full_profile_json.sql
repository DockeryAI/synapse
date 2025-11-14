-- Add column to store full Brandock marketing profile data
-- This preserves all the rich marketing intelligence (475k words worth!)

ALTER TABLE industry_profiles
ADD COLUMN IF NOT EXISTS full_profile_data JSONB;

-- Add index for JSON queries
CREATE INDEX IF NOT EXISTS idx_industry_profiles_full_data
  ON industry_profiles USING gin(full_profile_data);

-- Add comment
COMMENT ON COLUMN industry_profiles.full_profile_data IS
  'Complete Brandock marketing profile including customer triggers, journeys, transformations, objection handlers, and all marketing intelligence';
