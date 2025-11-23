# 400 Bad Request Errors - Complete Root Cause Analysis

## Overview
Getting 400 errors even after adding columns multiple times indicates deeper issues beyond simple schema mismatches.

## Common Causes of Persistent 400 Errors in Supabase/PostgREST

### 1. PostgREST Schema Cache Not Updating
**Symptoms:**
- Column exists in database but PostgREST doesn't recognize it
- Changes made via SQL Editor don't reflect in API calls
- 400 errors mentioning columns that DO exist

**Root Causes:**
- PostgREST caches the schema and doesn't auto-refresh
- Schema cache can be stale for hours or even days
- Supabase Dashboard shows correct schema but API uses cached version

**Solutions:**
```sql
-- Force schema reload (may not always work)
NOTIFY pgrst, 'reload schema';

-- Alternative: Add/drop dummy column to force cache bust
ALTER TABLE location_detection_cache ADD COLUMN _temp BOOLEAN DEFAULT false;
ALTER TABLE location_detection_cache DROP COLUMN _temp;

-- Nuclear option: Restart PostgREST (requires Supabase support)
```

### 2. Case Sensitivity Issues
**Symptoms:**
- Query uses camelCase but database has snake_case
- Column "hasMultipleLocations" vs "hasmultiplelocations" vs "has_multiple_locations"

**Root Causes:**
- PostgreSQL converts unquoted identifiers to lowercase
- If column was created with quotes, it preserves case
- JavaScript uses camelCase, PostgreSQL prefers snake_case

**Diagnostic Query:**
```sql
-- Check exact column names including case
SELECT
    column_name,
    data_type,
    CASE
        WHEN column_name != lower(column_name) THEN 'CASE-SENSITIVE!'
        ELSE 'lowercase'
    END as case_status
FROM information_schema.columns
WHERE table_name = 'location_detection_cache'
ORDER BY ordinal_position;
```

### 3. Column Name Transformation Issues
**Symptoms:**
- Supabase JS client expects different names than what's in DB
- PostgREST transforms names but inconsistently

**Root Causes:**
- PostgREST has auto-detection for column name formats
- Mixing naming conventions confuses the transformer
- Some columns get transformed, others don't

**Example:**
```javascript
// What you write:
.select('hasMultipleLocations')

// What PostgREST might expect (any of these):
.select('hasMultipleLocations')  // Exact match
.select('hasmultiplelocations')  // All lowercase
.select('has_multiple_locations') // Snake case
```

### 4. Data Type Mismatches
**Symptoms:**
- Column exists but wrong data type
- JSONB vs JSON vs TEXT
- BOOLEAN vs INTEGER vs TEXT

**Diagnostic Query:**
```sql
-- Check actual data types
SELECT
    column_name,
    data_type,
    udt_name,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'location_detection_cache'
AND column_name IN ('hasMultipleLocations', 'allLocations', 'hasmultiplelocations', 'alllocations', 'has_multiple_locations', 'all_locations');
```

### 5. RLS Policies Blocking SELECT
**Symptoms:**
- 400 error specifically on SELECT operations
- INSERT/UPDATE work but SELECT fails

**Root Causes:**
- RLS enabled but no SELECT policy
- SELECT policy has impossible conditions
- Policy references non-existent columns

**Diagnostic Query:**
```sql
-- Check RLS status and policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'location_detection_cache';
```

### 6. Schema/Search Path Issues
**Symptoms:**
- Table exists but not found
- Works in SQL Editor but not via API

**Root Causes:**
- Table in wrong schema (not public)
- PostgREST looking in wrong schema
- Multiple tables with same name in different schemas

**Diagnostic Query:**
```sql
-- Find all tables named location_detection_cache
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE tablename = 'location_detection_cache';
```

### 7. Computed Columns or Views
**Symptoms:**
- Trying to select from a view thinking it's a table
- Computed columns not available via API

**Root Causes:**
- View with different column names than expected
- Materialized view not refreshed
- Function-based computed columns not exposed

### 8. Reserved Words as Column Names
**Symptoms:**
- Certain column names cause 400 errors
- Works with some names but not others

**Root Causes:**
- Using PostgreSQL reserved words
- Using PostgREST reserved parameters
- Conflicting with HTTP header names

### 9. Connection Pooler Issues
**Symptoms:**
- Intermittent 400 errors
- Works sometimes, fails others
- Different behavior in different environments

**Root Causes:**
- Using pooler connection string for migrations
- Pooler has different view of schema
- Transaction isolation issues

### 10. Trigger or Constraint Violations
**Symptoms:**
- 400 error on operations that should work
- No clear error message

**Root Causes:**
- BEFORE SELECT triggers (rare but possible)
- Check constraints on computed columns
- Domain constraints on custom types

## Comprehensive Diagnostic Script

```sql
-- Run this entire script to diagnose the issue

-- 1. Check if table exists and where
SELECT
    'Table Location' as check_type,
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE tablename = 'location_detection_cache';

-- 2. Check exact column names and types
SELECT
    'Column Details' as check_type,
    column_name,
    data_type,
    udt_name,
    is_nullable,
    column_default,
    CASE
        WHEN column_name != lower(column_name) THEN 'CASE-SENSITIVE!'
        ELSE 'lowercase'
    END as case_warning
FROM information_schema.columns
WHERE table_name = 'location_detection_cache'
ORDER BY ordinal_position;

-- 3. Look for columns with various naming patterns
SELECT
    'Name Variant Search' as check_type,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'location_detection_cache'
AND (
    lower(column_name) LIKE '%multiple%'
    OR lower(column_name) LIKE '%location%'
    OR column_name IN (
        'hasMultipleLocations',
        'allLocations',
        'hasmultiplelocations',
        'alllocations',
        'has_multiple_locations',
        'all_locations'
    )
);

-- 4. Check RLS configuration
SELECT
    'RLS Status' as check_type,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'location_detection_cache';

-- 5. Check all policies
SELECT
    'RLS Policies' as check_type,
    policyname,
    permissive,
    roles,
    cmd,
    LEFT(qual::text, 100) as qual_preview,
    LEFT(with_check::text, 100) as check_preview
FROM pg_policies
WHERE tablename = 'location_detection_cache';

-- 6. Check for triggers
SELECT
    'Triggers' as check_type,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'location_detection_cache';

-- 7. Check indexes (might affect query planning)
SELECT
    'Indexes' as check_type,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'location_detection_cache';

-- 8. Check constraints
SELECT
    'Constraints' as check_type,
    constraint_name,
    constraint_type,
    is_deferrable,
    initially_deferred
FROM information_schema.table_constraints
WHERE table_name = 'location_detection_cache';

-- 9. Test direct insert/select
DO $$
BEGIN
    RAISE NOTICE 'Testing direct operations...';

    -- Test if columns exist and can be accessed
    PERFORM column_name
    FROM information_schema.columns
    WHERE table_name = 'location_detection_cache'
    AND column_name = 'hasMultipleLocations';

    IF FOUND THEN
        RAISE NOTICE '✓ hasMultipleLocations column exists';
    ELSE
        RAISE NOTICE '✗ hasMultipleLocations column NOT found';
    END IF;

    PERFORM column_name
    FROM information_schema.columns
    WHERE table_name = 'location_detection_cache'
    AND column_name = 'allLocations';

    IF FOUND THEN
        RAISE NOTICE '✓ allLocations column exists';
    ELSE
        RAISE NOTICE '✗ allLocations column NOT found';
    END IF;
END $$;
```

## Next Steps to Debug

1. **Run the diagnostic script above** - Copy entire output
2. **Check PostgREST logs** - May have more detailed error messages
3. **Test with curl directly** - Bypass Supabase client to see raw errors
4. **Check Supabase Dashboard Network tab** - Look at actual request/response
5. **Try different column name formats** in the select statement
6. **Create a completely new table** with the columns to test if it's table-specific

## Most Likely Culprit Based on Your Symptoms

Given that you've added columns multiple times and still get 400 errors, the most likely issues are:

1. **PostgREST schema cache** - The API server hasn't picked up your changes
2. **Column name case sensitivity** - Columns exist but with different casing
3. **Wrong schema** - Columns added to a different schema's table

## Immediate Things to Try

```javascript
// Try these different select formats:
.select('*')  // See what columns actually come back

.select('domain, city, state')  // Only select columns that work

.select('"hasMultipleLocations", "allLocations"')  // Force exact case

.select('has_multiple_locations, all_locations')  // Try snake_case
```

## Force Schema Refresh Methods

1. **Dummy Table Method:**
```sql
CREATE TABLE _force_refresh_dummy (id INT);
DROP TABLE _force_refresh_dummy;
```

2. **Function Method:**
```sql
CREATE OR REPLACE FUNCTION force_schema_refresh()
RETURNS void AS $$
BEGIN
    NOTIFY pgrst, 'reload schema';
    NOTIFY pgrst, 'reload config';
END;
$$ LANGUAGE plpgsql;

SELECT force_schema_refresh();
```

3. **Contact Supabase Support** - Ask them to restart PostgREST for your project

Let's run the diagnostic script first to see exactly what's in your database!