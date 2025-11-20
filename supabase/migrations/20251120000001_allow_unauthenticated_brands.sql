-- Allow unauthenticated brand creation during onboarding
-- This enables users to create brands before signing up

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can insert their own brands" ON brands;

-- Create new policy that allows:
-- 1. Authenticated users to create brands with their user_id
-- 2. Unauthenticated users to create brands with NULL user_id
CREATE POLICY "Allow brand creation for authenticated and unauthenticated users"
ON brands
FOR INSERT
WITH CHECK (
  -- Allow if user is authenticated and brand belongs to them
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR
  -- Allow if user is not authenticated (user_id can be NULL)
  (auth.uid() IS NULL AND user_id IS NULL)
);

-- Update existing SELECT policy to allow reading NULL user_id brands
DROP POLICY IF EXISTS "Users can view their own brands" ON brands;

CREATE POLICY "Allow viewing own brands and unauthenticated brands"
ON brands
FOR SELECT
USING (
  -- Users can see their own brands
  user_id = auth.uid()
  OR
  -- Anyone can see brands with NULL user_id (temporary during onboarding)
  user_id IS NULL
);
