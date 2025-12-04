-- Add missing profile_hash column to brand_profiles table
ALTER TABLE brand_profiles ADD COLUMN IF NOT EXISTS profile_hash TEXT;

-- Add missing has_full_profile column to industry_profiles table
ALTER TABLE industry_profiles ADD COLUMN IF NOT EXISTS has_full_profile BOOLEAN DEFAULT false;

-- Create index for performance on the new columns
CREATE INDEX IF NOT EXISTS idx_brand_profiles_hash ON brand_profiles(profile_hash);
CREATE INDEX IF NOT EXISTS idx_industry_profiles_full ON industry_profiles(has_full_profile);