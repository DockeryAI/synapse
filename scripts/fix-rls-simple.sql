-- Simple RLS fix for onboarding
-- Makes policies more permissive for authenticated users

-- =============================================================================
-- 1. MARBA_UVPS - Allow authenticated users to create UVPs
-- =============================================================================

ALTER TABLE public.marba_uvps ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "View UVPs" ON public.marba_uvps;
DROP POLICY IF EXISTS "Insert UVPs" ON public.marba_uvps;
DROP POLICY IF EXISTS "Update UVPs" ON public.marba_uvps;
DROP POLICY IF EXISTS "Delete UVPs" ON public.marba_uvps;
DROP POLICY IF EXISTS "Users can view their own UVPs" ON public.marba_uvps;
DROP POLICY IF EXISTS "Users can insert their own UVPs" ON public.marba_uvps;
DROP POLICY IF EXISTS "Users can update their own UVPs" ON public.marba_uvps;
DROP POLICY IF EXISTS "Users can delete their own UVPs" ON public.marba_uvps;
DROP POLICY IF EXISTS "Users can view UVPs" ON public.marba_uvps;
DROP POLICY IF EXISTS "Users can insert UVPs" ON public.marba_uvps;
DROP POLICY IF EXISTS "Users can update UVPs" ON public.marba_uvps;
DROP POLICY IF EXISTS "Users can delete UVPs" ON public.marba_uvps;

-- Create simple permissive policies
CREATE POLICY "Authenticated users can view UVPs"
  ON public.marba_uvps FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create UVPs"
  ON public.marba_uvps FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own UVPs"
  ON public.marba_uvps FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND
    brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid())
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND
    brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete own UVPs"
  ON public.marba_uvps FOR DELETE
  USING (
    auth.role() = 'authenticated' AND
    brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid())
  );

-- =============================================================================
-- 2. BRANDS - Ensure authenticated users can create brands
-- =============================================================================

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own brands" ON public.brands;
DROP POLICY IF EXISTS "Users can create brands" ON public.brands;
DROP POLICY IF EXISTS "Users can update own brands" ON public.brands;
DROP POLICY IF EXISTS "Users can delete own brands" ON public.brands;

-- Create policies
CREATE POLICY "Users can view own brands"
  ON public.brands FOR SELECT
  USING (user_id = auth.uid() OR auth.role() = 'authenticated');

CREATE POLICY "Users can create brands"
  ON public.brands FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own brands"
  ON public.brands FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own brands"
  ON public.brands FOR DELETE
  USING (user_id = auth.uid());

-- =============================================================================
-- 3. Ensure tables exist with proper structure
-- =============================================================================

-- Ensure marba_uvps has all required columns
ALTER TABLE public.marba_uvps
  ADD COLUMN IF NOT EXISTS products_services JSONB;

-- Ensure brands table has necessary columns
ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- =============================================================================
-- 4. Grant permissions
-- =============================================================================

GRANT ALL ON public.marba_uvps TO authenticated;
GRANT ALL ON public.brands TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';