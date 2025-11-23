-- Fix New Car Dealer to show checkmark in UI
-- The profile exists in industry_profiles but needs to be marked in naics_codes

-- First check if it exists
DO $$
DECLARE
  existing_record RECORD;
BEGIN
  SELECT * INTO existing_record
  FROM naics_codes
  WHERE title = 'New Car Dealer'
  LIMIT 1;

  IF existing_record IS NOT NULL THEN
    -- Update existing record
    UPDATE naics_codes
    SET has_full_profile = true,
        updated_at = NOW()
    WHERE code = existing_record.code;
    RAISE NOTICE '✅ Updated existing New Car Dealer record to has_full_profile=true';
  ELSE
    -- Create new record (uses same code format as OnDemandProfileGeneration.ts)
    INSERT INTO naics_codes (
      code,
      title,
      category,
      keywords,
      has_full_profile,
      popularity
    ) VALUES (
      'CUSTOM-441110',  -- Standard NAICS code for New Car Dealers
      'New Car Dealer',
      'Retail',
      ARRAY['car', 'dealer', 'auto', 'vehicle', 'dealership', 'automotive', 'sales', 'new'],
      true,
      5  -- Higher popularity to show it higher in list
    );
    RAISE NOTICE '✅ Created New Car Dealer record with has_full_profile=true';
  END IF;
END $$;

-- Also ensure Used Car Dealer is in there (since it shows in your dropdown)
INSERT INTO naics_codes (
  code,
  title,
  category,
  keywords,
  has_full_profile,
  popularity
) VALUES (
  'CUSTOM-441120',  -- Standard NAICS code for Used Car Dealers
  'Used Car Dealer',
  'Retail',
  ARRAY['car', 'dealer', 'auto', 'vehicle', 'dealership', 'automotive', 'sales', 'used', 'pre-owned'],
  false,  -- Not generated yet
  4
) ON CONFLICT (code) DO NOTHING;

-- Verify the results
SELECT code, title, has_full_profile, popularity
FROM naics_codes
WHERE title ILIKE '%car%dealer%'
ORDER BY popularity DESC;

-- Force PostgREST reload
NOTIFY pgrst, 'reload schema';

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ New Car Dealer should now show checkmark in UI!';
  RAISE NOTICE '';
  RAISE NOTICE 'To see the change:';
  RAISE NOTICE '1. Hard refresh the page (Cmd+Shift+R)';
  RAISE NOTICE '2. Type "car de" in the search box';
  RAISE NOTICE '3. New Car Dealer should now have a green checkmark ✓';
END $$;