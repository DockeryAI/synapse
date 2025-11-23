-- Complete 400 Error Diagnostic Script for location_detection_cache
-- Run this entire script in Supabase SQL Editor and share the output

-- ========================================
-- 1. CHECK TABLE LOCATION AND SCHEMA
-- ========================================
SELECT
    'Table Location' as check_type,
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE tablename = 'location_detection_cache';

-- ========================================
-- 2. CHECK EXACT COLUMN NAMES AND TYPES
-- ========================================
SELECT
    'Column Details' as check_type,
    column_name,
    data_type,
    udt_name,
    is_nullable,
    column_default,
    CASE
        WHEN column_name != lower(column_name) THEN '⚠️ CASE-SENSITIVE!'
        ELSE '✅ lowercase'
    END as case_warning
FROM information_schema.columns
WHERE table_name = 'location_detection_cache'
ORDER BY ordinal_position;

-- ========================================
-- 3. SEARCH FOR COLUMN NAME VARIANTS
-- ========================================
SELECT
    'Name Variant Search' as check_type,
    column_name,
    data_type,
    '✅ Found' as status
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

-- ========================================
-- 4. CHECK RLS STATUS
-- ========================================
SELECT
    'RLS Status' as check_type,
    schemaname,
    tablename,
    rowsecurity,
    CASE
        WHEN rowsecurity THEN '⚠️ RLS ENABLED'
        ELSE '✅ RLS DISABLED'
    END as rls_warning
FROM pg_tables
WHERE tablename = 'location_detection_cache';

-- ========================================
-- 5. CHECK ALL POLICIES
-- ========================================
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

-- ========================================
-- 6. CHECK FOR TRIGGERS
-- ========================================
SELECT
    'Triggers' as check_type,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'location_detection_cache';

-- ========================================
-- 7. CHECK INDEXES
-- ========================================
SELECT
    'Indexes' as check_type,
    indexname,
    LEFT(indexdef, 150) as indexdef_preview
FROM pg_indexes
WHERE tablename = 'location_detection_cache';

-- ========================================
-- 8. CHECK CONSTRAINTS
-- ========================================
SELECT
    'Constraints' as check_type,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'location_detection_cache';

-- ========================================
-- 9. TEST COLUMN EXISTENCE
-- ========================================
DO $$
DECLARE
    col_exists BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========== COLUMN EXISTENCE TEST ==========';

    -- Test hasMultipleLocations
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'location_detection_cache'
        AND column_name = 'hasMultipleLocations'
    ) INTO col_exists;

    IF col_exists THEN
        RAISE NOTICE '✅ hasMultipleLocations (exact case) EXISTS';
    ELSE
        RAISE NOTICE '❌ hasMultipleLocations (exact case) NOT FOUND';
    END IF;

    -- Test has_multiple_locations
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'location_detection_cache'
        AND column_name = 'has_multiple_locations'
    ) INTO col_exists;

    IF col_exists THEN
        RAISE NOTICE '✅ has_multiple_locations (snake_case) EXISTS';
    ELSE
        RAISE NOTICE '❌ has_multiple_locations (snake_case) NOT FOUND';
    END IF;

    -- Test allLocations
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'location_detection_cache'
        AND column_name = 'allLocations'
    ) INTO col_exists;

    IF col_exists THEN
        RAISE NOTICE '✅ allLocations (exact case) EXISTS';
    ELSE
        RAISE NOTICE '❌ allLocations (exact case) NOT FOUND';
    END IF;

    -- Test all_locations
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'location_detection_cache'
        AND column_name = 'all_locations'
    ) INTO col_exists;

    IF col_exists THEN
        RAISE NOTICE '✅ all_locations (snake_case) EXISTS';
    ELSE
        RAISE NOTICE '❌ all_locations (snake_case) NOT FOUND';
    END IF;

    RAISE NOTICE '============================================';
    RAISE NOTICE '';
END $$;

-- ========================================
-- 10. TEST DIRECT SELECT
-- ========================================
DO $$
DECLARE
    test_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========== DIRECT SELECT TEST ==========';

    -- Test basic select
    BEGIN
        SELECT COUNT(*) INTO test_count
        FROM location_detection_cache
        LIMIT 1;
        RAISE NOTICE '✅ Basic SELECT works (found % rows)', test_count;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Basic SELECT failed: %', SQLERRM;
    END;

    -- Test select with specific columns
    BEGIN
        PERFORM id, domain, city, state
        FROM location_detection_cache
        LIMIT 1;
        RAISE NOTICE '✅ SELECT with basic columns works';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ SELECT with basic columns failed: %', SQLERRM;
    END;

    RAISE NOTICE '=========================================';
    RAISE NOTICE '';
END $$;

-- ========================================
-- 11. CHECK HELPER FUNCTIONS
-- ========================================
SELECT
    'Helper Functions' as check_type,
    proname as function_name,
    pronargs as arg_count
FROM pg_proc
WHERE proname IN ('insert_location_cache', 'get_location_cache')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- ========================================
-- 12. POSTGREST SCHEMA CACHE TEST
-- ========================================
-- This will show if PostgREST might have stale cache
SELECT
    'Schema Cache Test' as check_type,
    NOW() as current_time,
    'If columns were added recently but still get 400 errors, PostgREST cache is likely stale' as note;

-- ========================================
-- 13. CHECK FOR DUPLICATE TABLES
-- ========================================
SELECT
    'Duplicate Tables' as check_type,
    schemaname,
    tablename,
    CASE
        WHEN schemaname = 'public' THEN '✅ Correct schema'
        ELSE '⚠️ Wrong schema!'
    END as schema_status
FROM pg_tables
WHERE tablename LIKE '%location%cache%'
ORDER BY schemaname, tablename;

-- ========================================
-- SUMMARY
-- ========================================
SELECT
    '================' as separator,
    'END OF DIAGNOSTIC' as status,
    '================' as separator2;