# 400 Error Troubleshooting Checklist

## Step 1: Column Existence ✅
**Status:** Run the SQL in clipboard first

## Step 2: PostgREST Schema Cache
**Most Common Culprit for Persistent 400s**

If columns exist but still getting 400:
```sql
-- Force cache refresh - Method A (Dummy column)
ALTER TABLE location_detection_cache ADD COLUMN _force_refresh BOOLEAN DEFAULT false;
ALTER TABLE location_detection_cache DROP COLUMN _force_refresh;

-- Method B (Dummy table)
CREATE TABLE _cache_buster (id INT);
DROP TABLE _cache_buster;

-- Method C (Nuclear - requires wait)
-- Contact Supabase support to restart PostgREST
```

## Step 3: Column Name Case Sensitivity
**Check how Supabase client is calling the columns**

In TypeScript code, try these variations:
```typescript
// Option A - Snake case (PostgreSQL default)
.select('has_multiple_locations, all_locations')

// Option B - Exact case with quotes
.select('"hasMultipleLocations", "allLocations"')

// Option C - All lowercase
.select('hasmultiplelocations, alllocations')
```

## Step 4: Check Helper Function Status
```sql
-- See if helper functions exist and work
SELECT proname, pronargs
FROM pg_proc
WHERE proname = 'insert_location_cache'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Test helper function directly
SELECT insert_location_cache(
    'test.com',
    'TestCity',
    'TestState',
    true,
    '[{"city": "Test", "state": "TS"}]'::jsonb
);
```

## Step 5: Direct API Test with curl
```bash
# Test outside of TypeScript to see raw error
curl -X GET \
  'https://jpwljchikgmggjidogon.supabase.co/rest/v1/location_detection_cache?domain=eq.example.com' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'
```

## Step 6: Check Supabase Logs
1. Go to Supabase Dashboard > Logs > API
2. Filter for 400 errors
3. Look for exact error message

## Step 7: Test with New Table
```sql
-- Create identical table with different name to isolate issue
CREATE TABLE location_cache_test AS
SELECT * FROM location_detection_cache WHERE false;

-- Add the problem columns explicitly
ALTER TABLE location_cache_test
ADD COLUMN has_multiple_locations BOOLEAN DEFAULT false,
ADD COLUMN all_locations JSONB DEFAULT '[]'::jsonb;

-- Test insert
INSERT INTO location_cache_test (domain, city, state, has_multiple_locations, all_locations)
VALUES ('test.com', 'TestCity', 'TS', false, '[]'::jsonb);
```

## Step 8: Check Data Type Mismatches
```sql
-- Verify exact data types
SELECT
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_name = 'location_detection_cache'
AND column_name IN (
    'hasMultipleLocations', 'allLocations',
    'has_multiple_locations', 'all_locations'
);
```

## Current Theory Ranking:
1. **PostgREST cache** (90% likely) - Schema changes not reflected in API
2. **Column name mismatch** (70% likely) - Client using wrong case
3. **Wrong table/schema** (20% likely) - Multiple tables with same name
4. **Data type issue** (10% likely) - JSONB vs JSON vs TEXT

## Quick Fix Attempts (in order):
1. Force schema refresh with dummy column
2. Update TypeScript to use snake_case columns
3. Use helper function instead of direct insert
4. Wait 5 minutes and try again (cache timeout)