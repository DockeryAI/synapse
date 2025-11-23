#!/bin/bash

# Backup RLS policies for critical tables before making changes
# Date: 2025-11-22

BACKUP_FILE=".buildrunner/RLS_BACKUP_$(date +%Y%m%d_%H%M%S).sql"

echo "=========================================="
echo "RLS Policy Backup Script"
echo "=========================================="
echo ""
echo "Creating backup at: $BACKUP_FILE"
echo ""

# Create backup file with header
cat > "$BACKUP_FILE" << 'EOF'
-- =====================================================
-- RLS POLICY BACKUP
-- AUTOMATED BACKUP BEFORE FIXING 406/400 ERRORS
-- =====================================================
-- TO RESTORE: Run this file in Supabase SQL Editor
-- =====================================================

-- Disable RLS on affected tables
ALTER TABLE intelligence_cache DISABLE ROW LEVEL SECURITY;
ALTER TABLE industry_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE naics_codes DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on these tables
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename, policyname
        FROM pg_policies
        WHERE tablename IN ('intelligence_cache', 'industry_profiles', 'naics_codes')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- =====================================================
-- BACKED UP POLICIES (from current database state)
-- =====================================================

EOF

# Check if supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing instructions:"
    echo ""
    echo "Run: npx supabase login"
    echo "Then: npx supabase link --project-ref jpwljchikgmggjidogon"
    echo ""
    echo "📝 Manual backup instructions:"
    echo "1. Go to: https://supabase.com/dashboard/project/jpwljchikgmggjidogon/editor"
    echo "2. Run the query from: .buildrunner/BACKUP_RLS_BEFORE_FIX_20251122.sql"
    echo "3. Copy the policy definitions and save them"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""
echo "Extracting current RLS policies..."
echo ""

# Query to extract policies (will be added to backup file)
POLICY_QUERY="
SELECT
  '-- Policy for table: ' || tablename || E'\n' ||
  'CREATE POLICY \"' || policyname || '\" ON ' || tablename ||
  ' FOR ' || cmd ||
  CASE
    WHEN roles IS NOT NULL THEN ' TO ' || array_to_string(roles, ', ')
    ELSE ''
  END ||
  CASE
    WHEN qual IS NOT NULL THEN E'\n  USING (' || pg_get_expr(qual, (schemaname||'.'||tablename)::regclass) || ')'
    ELSE ''
  END ||
  CASE
    WHEN with_check IS NOT NULL THEN E'\n  WITH CHECK (' || pg_get_expr(with_check, (schemaname||'.'||tablename)::regclass) || ')'
    ELSE ''
  END || ';' || E'\n'
FROM pg_policies
WHERE tablename IN ('intelligence_cache', 'industry_profiles', 'naics_codes')
ORDER BY tablename, policyname;
"

echo "$POLICY_QUERY" | npx supabase db query >> "$BACKUP_FILE" 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Backup created successfully: $BACKUP_FILE"
    echo ""
    echo "📋 Backup contains policies for:"
    echo "   - intelligence_cache"
    echo "   - industry_profiles"
    echo "   - naics_codes"
    echo ""
    echo "🔄 To restore: psql -f $BACKUP_FILE"
else
    echo "❌ Backup failed. See error above."
    echo ""
    echo "📝 Please backup manually:"
    echo "1. Open Supabase SQL Editor"
    echo "2. Run query from: .buildrunner/BACKUP_RLS_BEFORE_FIX_20251122.sql"
    echo "3. Save the results"
    exit 1
fi
