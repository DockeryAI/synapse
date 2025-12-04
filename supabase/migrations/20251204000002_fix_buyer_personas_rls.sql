-- Fix buyer_personas RLS policy to allow unauthenticated access
-- CRITICAL: This enables the app to save buyer personas during development

-- Drop existing policies
DROP POLICY IF EXISTS buyer_personas_user_access ON buyer_personas;
DROP POLICY IF EXISTS buyer_personas_access_policy ON buyer_personas;

-- Create permissive policy for development
CREATE POLICY buyer_personas_dev_access ON buyer_personas
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Fix brand_profiles missing column error
ALTER TABLE brand_profiles ADD COLUMN IF NOT EXISTS profile_hash text;