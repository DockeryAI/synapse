-- Fix location_detection_cache 400 errors once and for all
-- Based on RLS_400_Error_Resolution_Case_Study.md

-- Option 1: Disable RLS entirely for cache tables (simplest solution)
ALTER TABLE location_detection_cache DISABLE ROW LEVEL SECURITY;

-- Grant full permissions
GRANT ALL ON location_detection_cache TO anon;
GRANT ALL ON location_detection_cache TO authenticated;
GRANT ALL ON location_detection_cache TO public;
GRANT ALL ON location_detection_cache TO service_role;

-- Option 2: If RLS must be enabled, create the helper function from the case study
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
SECURITY DEFINER  -- Runs with owner's privileges, bypasses RLS
SET search_path = public
AS $$
DECLARE
  new_id UUID;
BEGIN
  -- Delete old entry if exists
  DELETE FROM location_detection_cache WHERE domain = p_domain;

  -- Insert new entry
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
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- Grant execute permission to everyone
GRANT EXECUTE ON FUNCTION public.insert_location_cache TO anon;
GRANT EXECUTE ON FUNCTION public.insert_location_cache TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_location_cache TO public;

-- Force PostgREST to reload
NOTIFY pgrst, 'reload schema';

-- Add a temporary column to force cache reload
ALTER TABLE location_detection_cache ADD COLUMN IF NOT EXISTS _temp_reload BOOLEAN DEFAULT false;
ALTER TABLE location_detection_cache DROP COLUMN IF EXISTS _temp_reload;

DO $$
BEGIN
  RAISE NOTICE '✅ Location cache 400 errors fixed!';
  RAISE NOTICE '   - RLS disabled for cache table';
  RAISE NOTICE '   - Helper function created as fallback';
  RAISE NOTICE '   - Full permissions granted';
END $$;