-- Production-grade solution for location_detection_cache 400 errors
-- FIX 4 from FIXES_FOR_400_ERROR.md - Helper function with SECURITY DEFINER

-- Create the helper function that bypasses RLS
CREATE OR REPLACE FUNCTION public.insert_location_cache(
  p_domain TEXT,
  p_city TEXT,
  p_state TEXT,
  p_confidence DECIMAL DEFAULT 0.5,
  p_method TEXT DEFAULT 'website_scraping',
  p_reasoning TEXT DEFAULT NULL,
  p_has_multiple BOOLEAN DEFAULT false,
  p_all_locations JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER  -- This is the key: runs with owner's privileges, bypasses RLS
SET search_path = public
AS $$
DECLARE
  new_id UUID;
BEGIN
  -- Upsert: Update if exists, insert if not
  INSERT INTO location_detection_cache (
    domain,
    city,
    state,
    confidence,
    method,
    reasoning,
    hasMultipleLocations,
    allLocations,
    updated_at
  )
  VALUES (
    p_domain,
    p_city,
    p_state,
    p_confidence,
    p_method,
    p_reasoning,
    p_has_multiple,
    p_all_locations,
    NOW()
  )
  ON CONFLICT (domain)
  DO UPDATE SET
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    confidence = EXCLUDED.confidence,
    method = EXCLUDED.method,
    reasoning = EXCLUDED.reasoning,
    hasMultipleLocations = EXCLUDED.hasMultipleLocations,
    allLocations = EXCLUDED.allLocations,
    updated_at = NOW()
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- Grant execute permission to everyone (they still can't modify the table directly)
GRANT EXECUTE ON FUNCTION public.insert_location_cache TO anon;
GRANT EXECUTE ON FUNCTION public.insert_location_cache TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_location_cache TO public;
GRANT EXECUTE ON FUNCTION public.insert_location_cache TO service_role;

-- Also create a helper to read from cache (optional, but consistent)
CREATE OR REPLACE FUNCTION public.get_location_cache(p_domain TEXT)
RETURNS TABLE (
  city TEXT,
  state TEXT,
  confidence DECIMAL,
  method TEXT,
  reasoning TEXT,
  hasMultipleLocations BOOLEAN,
  allLocations JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ldc.city,
    ldc.state,
    ldc.confidence,
    ldc.method,
    ldc.reasoning,
    ldc.hasMultipleLocations,
    ldc.allLocations
  FROM location_detection_cache ldc
  WHERE ldc.domain = p_domain
  LIMIT 1;
END;
$$;

-- Grant execute permission for the getter too
GRANT EXECUTE ON FUNCTION public.get_location_cache TO anon;
GRANT EXECUTE ON FUNCTION public.get_location_cache TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_location_cache TO public;
GRANT EXECUTE ON FUNCTION public.get_location_cache TO service_role;

-- Ensure the table has proper RLS policies for direct reads (cache checks)
ALTER TABLE location_detection_cache ENABLE ROW LEVEL SECURITY;

-- Drop any problematic policies
DROP POLICY IF EXISTS "allow_insert" ON location_detection_cache;
DROP POLICY IF EXISTS "allow_cache_select_after_insert" ON location_detection_cache;

-- Create simple, permissive policies for reads
CREATE POLICY "public_read_cache"
  ON location_detection_cache
  FOR SELECT
  TO public, anon, authenticated
  USING (true);

-- No INSERT/UPDATE/DELETE policies needed - use the helper functions!

-- Force schema reload
NOTIFY pgrst, 'reload schema';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Production-grade helper functions created!';
  RAISE NOTICE '   - insert_location_cache: Bypasses RLS for inserts/updates';
  RAISE NOTICE '   - get_location_cache: Bypasses RLS for reads';
  RAISE NOTICE '   - No more 400 errors!';
  RAISE NOTICE '';
  RAISE NOTICE 'To apply this in Supabase Dashboard:';
  RAISE NOTICE '1. Go to SQL Editor';
  RAISE NOTICE '2. Paste and run this entire script';
  RAISE NOTICE '3. Hard refresh your browser (Cmd+Shift+R)';
END $$;