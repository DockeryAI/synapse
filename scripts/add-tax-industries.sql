-- Add tax-related industries to naics_codes so they appear in the dropdown
-- These profiles already exist in industry_profiles but are missing from naics_codes

INSERT INTO naics_codes (code, title, category, keywords, has_full_profile, popularity) VALUES
  ('541211', 'CPA Firm', 'Professional Services',
   ARRAY['cpa', 'certified', 'public', 'accountant', 'accounting', 'tax', 'audit', 'financial', 'services'],
   true, 10),

  ('541213', 'Tax Preparation', 'Professional Services',
   ARRAY['tax', 'preparation', 'return', 'filing', 'irs', 'income', 'business', 'taxes', 'refund'],
   true, 15),

  ('541219', 'Bookkeeping Services', 'Professional Services',
   ARRAY['bookkeeping', 'bookkeeper', 'books', 'accounting', 'payroll', 'quickbooks', 'financial', 'records'],
   true, 8),

  ('541191', 'Tax Preparation Services', 'Professional Services',
   ARRAY['tax', 'preparation', 'services', 'preparer', 'filing', 'returns', 'consulting', 'planning'],
   true, 12)

ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  keywords = EXCLUDED.keywords,
  has_full_profile = true,
  popularity = EXCLUDED.popularity,
  updated_at = NOW();

-- Also add related accounting services that might be useful
INSERT INTO naics_codes (code, title, category, keywords, has_full_profile, popularity) VALUES
  ('541211-2', 'Accounting Services', 'Professional Services',
   ARRAY['accounting', 'accountant', 'financial', 'statements', 'audit', 'review', 'compilation'],
   false, 9),

  ('541214', 'Payroll Services', 'Professional Services',
   ARRAY['payroll', 'processing', 'wages', 'employee', 'taxes', 'withholding', 'hr'],
   false, 7)

ON CONFLICT (code) DO NOTHING;

-- Verify the results
SELECT code, title, has_full_profile, array_length(keywords, 1) as keyword_count
FROM naics_codes
WHERE title ILIKE '%tax%'
   OR title ILIKE '%accounting%'
   OR title ILIKE '%bookkeep%'
   OR title ILIKE '%cpa%'
ORDER BY popularity DESC;

-- Force PostgREST reload
NOTIFY pgrst, 'reload schema';

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Tax-related industries added to naics_codes!';
  RAISE NOTICE '';
  RAISE NOTICE 'Now when you type "tax" you will see:';
  RAISE NOTICE '  • Tax Preparation ✓';
  RAISE NOTICE '  • Tax Preparation Services ✓';
  RAISE NOTICE '  • CPA Firm ✓';
  RAISE NOTICE '  • Bookkeeping Services ✓';
  RAISE NOTICE '';
  RAISE NOTICE 'Hard refresh the page (Cmd+Shift+R) to see them';
END $$;