-- Fix buyer_personas RLS policy to allow all access for development

-- Drop existing restrictive policies
DROP POLICY IF EXISTS buyer_personas_access_policy ON buyer_personas;
DROP POLICY IF EXISTS buyer_personas_user_access ON buyer_personas;
DROP POLICY IF EXISTS buyer_personas_dev_access ON buyer_personas;

-- Add brand_id column if it doesn't exist (for compatibility)
ALTER TABLE buyer_personas ADD COLUMN IF NOT EXISTS brand_id uuid;

-- Create completely permissive policy for development
CREATE POLICY buyer_personas_allow_all ON buyer_personas FOR ALL USING (true) WITH CHECK (true);

-- Ensure RLS is enabled but allows everything
ALTER TABLE buyer_personas ENABLE ROW LEVEL SECURITY;