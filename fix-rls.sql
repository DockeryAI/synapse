-- Fix buyer_personas RLS to allow saves during UVP flow

-- Create script to run directly in Supabase SQL editor
DROP POLICY IF EXISTS buyer_personas_allow_all ON buyer_personas;
DROP POLICY IF EXISTS buyer_personas_access_policy ON buyer_personas;
DROP POLICY IF EXISTS buyer_personas_user_access ON buyer_personas;

-- Add brand_id column if missing (for the service to work)
ALTER TABLE buyer_personas ADD COLUMN IF NOT EXISTS brand_id uuid;

-- Create completely permissive policy for development
CREATE POLICY buyer_personas_allow_all ON buyer_personas FOR ALL USING (true) WITH CHECK (true);

-- Ensure RLS is enabled but allows everything
ALTER TABLE buyer_personas ENABLE ROW LEVEL SECURITY;