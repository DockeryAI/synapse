-- Direct SQL execution to fix buyer_personas table issues

-- Add brand_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'buyer_personas' AND column_name = 'brand_id'
    ) THEN
        ALTER TABLE buyer_personas ADD COLUMN brand_id uuid REFERENCES brands(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Drop existing RLS policy
DROP POLICY IF EXISTS buyer_personas_user_access ON buyer_personas;

-- Create permissive RLS policy for development
CREATE POLICY buyer_personas_access_policy ON buyer_personas
  FOR ALL
  USING (
    -- Allow if authenticated and user owns the business via business_id
    (auth.uid() IS NOT NULL AND business_id IS NOT NULL AND
     auth.uid() IN (
       SELECT user_id FROM businesses WHERE id = buyer_personas.business_id
     )) OR
    -- Allow if authenticated and user owns the brand via brand_id
    (auth.uid() IS NOT NULL AND brand_id IS NOT NULL AND
     auth.uid() IN (
       SELECT user_id FROM brands WHERE id = buyer_personas.brand_id
     )) OR
    -- Allow unauthenticated access for development (remove in production)
    auth.uid() IS NULL
  );