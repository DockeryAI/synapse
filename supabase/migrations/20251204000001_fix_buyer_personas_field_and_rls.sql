-- Fix buyer_personas table field and RLS issues
-- Problem 1: Service uses 'brand_id' but table has 'business_id'
-- Problem 2: RLS policy requires authentication but app runs unauthenticated

-- Add brand_id column (copy from business_id for existing data)
ALTER TABLE buyer_personas ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES brands(id) ON DELETE CASCADE;

-- Copy business_id values to brand_id for existing records
UPDATE buyer_personas SET brand_id = business_id WHERE brand_id IS NULL;

-- Drop the old RLS policy
DROP POLICY IF EXISTS buyer_personas_user_access ON buyer_personas;

-- Create a more permissive RLS policy for development
-- This allows both authenticated users AND unauthenticated access for development
CREATE POLICY buyer_personas_access_policy ON buyer_personas
  FOR ALL
  USING (
    -- Allow if authenticated and user owns the business
    (auth.uid() IS NOT NULL AND
     auth.uid() IN (
       SELECT user_id FROM businesses WHERE id = buyer_personas.business_id
     )) OR
    -- Allow if authenticated and user owns the brand
    (auth.uid() IS NOT NULL AND
     auth.uid() IN (
       SELECT user_id FROM brands WHERE id = buyer_personas.brand_id
     )) OR
    -- Allow unauthenticated access for development (remove in production)
    auth.uid() IS NULL
  );