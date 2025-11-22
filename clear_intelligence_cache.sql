-- Clear intelligence cache for specific brand (replace with your brand ID)
DELETE FROM intelligence_cache
WHERE brand_id = '7f97fd31-6327-4df7-a782-cabcc42e3594';

-- OR clear ALL intelligence cache
-- DELETE FROM intelligence_cache;

-- Verify cache cleared
SELECT
  cache_key,
  data_type,
  source_api,
  created_at,
  expires_at
FROM intelligence_cache
WHERE brand_id = '7f97fd31-6327-4df7-a782-cabcc42e3594'
LIMIT 10;
