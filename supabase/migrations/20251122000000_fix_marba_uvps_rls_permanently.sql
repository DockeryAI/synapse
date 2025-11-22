-- Migration: Fix marba_uvps RLS permanently
-- Date: 2025-11-22
-- Issue: marba_uvps table has RLS enabled but no proper policies, causing 401 errors
-- Solution: Create proper RLS policies that check brand ownership

BEGIN;

-- 1. First ensure RLS is properly configured on marba_uvps
ALTER TABLE public.marba_uvps ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing policies on marba_uvps
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'marba_uvps'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON marba_uvps', pol.policyname);
    END LOOP;
END $$;

-- 3. Create comprehensive policies for marba_uvps that check brand ownership
-- This allows users to manage UVPs only for brands they own

-- Policy for SELECT operations
CREATE POLICY "Users can view UVPs for their brands"
ON public.marba_uvps
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.brands
        WHERE brands.id = marba_uvps.brand_id
        AND brands.user_id = auth.uid()
    )
);

-- Policy for INSERT operations
CREATE POLICY "Users can create UVPs for their brands"
ON public.marba_uvps
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.brands
        WHERE brands.id = marba_uvps.brand_id
        AND brands.user_id = auth.uid()
    )
);

-- Policy for UPDATE operations
CREATE POLICY "Users can update UVPs for their brands"
ON public.marba_uvps
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.brands
        WHERE brands.id = marba_uvps.brand_id
        AND brands.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.brands
        WHERE brands.id = marba_uvps.brand_id
        AND brands.user_id = auth.uid()
    )
);

-- Policy for DELETE operations
CREATE POLICY "Users can delete UVPs for their brands"
ON public.marba_uvps
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.brands
        WHERE brands.id = marba_uvps.brand_id
        AND brands.user_id = auth.uid()
    )
);

-- 4. Add a special policy for service role (for backend operations)
CREATE POLICY "Service role has full access"
ON public.marba_uvps
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. Ensure proper grants
GRANT ALL ON public.marba_uvps TO authenticated;
GRANT ALL ON public.marba_uvps TO service_role;
GRANT SELECT ON public.marba_uvps TO anon;

-- 6. Create a helper function to check if a user can access a UVP
CREATE OR REPLACE FUNCTION public.can_access_marba_uvp(p_brand_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.brands
        WHERE id = p_brand_id
        AND user_id = auth.uid()
    );
END;
$$;

-- 7. Create an index to optimize the brand ownership check
CREATE INDEX IF NOT EXISTS idx_brands_user_id ON public.brands(user_id);
CREATE INDEX IF NOT EXISTS idx_marba_uvps_brand_id ON public.marba_uvps(brand_id);

-- 8. Add a trigger to auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_marba_uvps_updated_at
    BEFORE UPDATE ON public.marba_uvps
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;

-- Notify PostgREST to reload the schema
NOTIFY pgrst, 'reload schema';