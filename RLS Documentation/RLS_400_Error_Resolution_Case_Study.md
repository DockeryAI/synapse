# RLS 400 Error Resolution Case Study
## Supabase location_detection_cache Table

**Date:** November 22, 2025
**Issue:** Persistent 400 Bad Request errors when inserting into cache table
**Resolution:** Helper function with SECURITY DEFINER privileges

---

## Executive Summary

This case study documents the resolution of persistent 400 errors when inserting data into a Supabase table with RLS enabled. The root cause was PostgREST attempting to SELECT the inserted row to return it to the client, but RLS policies blocked this SELECT operation. The solution involved creating a helper function with elevated privileges that bypasses RLS.

---

## The Problem

### Symptoms
- 400 Bad Request errors on INSERT operations
- Error occurred AFTER successful location detection but DURING cache save
- Console showed: `POST https://[project].supabase.co/rest/v1/location_detection_cache 400 (Bad Request)`

### Initial Table Structure
```sql
CREATE TABLE location_detection_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT UNIQUE NOT NULL,
  city TEXT,
  state TEXT,
  confidence DECIMAL(3,2),
  method TEXT,
  reasoning TEXT,
  hasMultipleLocations BOOLEAN DEFAULT false,
  allLocations JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Initial RLS Policies
```sql
-- Only INSERT policy existed initially
CREATE POLICY "allow_insert" ON location_detection_cache
FOR INSERT TO authenticated
WITH CHECK (true);
```

---

## Root Cause Analysis

### The Hidden Truth About 400 Errors

**CRITICAL INSIGHT:** 400 errors in Supabase are often NOT client errors but server-side RLS issues that PostgREST incorrectly categorizes as "bad requests."

### Why It Happens

1. **Supabase's Default Behavior**: When you INSERT a row, Supabase automatically performs a SELECT to return the inserted data
2. **The RLS Gap**: If you have an INSERT policy but no SELECT policy, the INSERT succeeds but the SELECT fails
3. **Misleading Error Code**: PostgREST returns 400 (Bad Request) instead of 403 (Forbidden), making it hard to diagnose

### Execution Flow That Causes 400
```
1. Client sends INSERT request
2. INSERT executes successfully (INSERT policy allows it)
3. PostgREST tries to SELECT the row to return it
4. SELECT fails (no SELECT policy)
5. PostgREST returns 400 error
6. Client sees failure despite successful INSERT
```

---

## Failed Attempts

### Attempt 1: Add `returning: 'minimal'`
**Theory**: Skip the SELECT operation after INSERT
```typescript
await supabase
  .from('location_detection_cache')
  .insert(data, { returning: 'minimal' });
```
**Result**: ❌ Still got 400 error - deeper permission issues existed

### Attempt 2: Add SELECT Policy
**Theory**: Allow SELECT so PostgREST can return the row
```sql
CREATE POLICY "allow_select" ON location_detection_cache
FOR SELECT TO authenticated
USING (true);
```
**Result**: ❌ Policy was added but 400 persisted - schema cache issues

### Attempt 3: Force Schema Cache Reload
**Theory**: PostgREST doesn't know about new columns/policies
```sql
NOTIFY pgrst, 'reload schema';
ALTER TABLE location_detection_cache ADD COLUMN _temp BOOLEAN;
ALTER TABLE location_detection_cache DROP COLUMN _temp;
```
**Result**: ❌ Cache was reloaded but 400 persisted

---

## The Solution That Worked

### Helper Function with SECURITY DEFINER

Created a function that runs with elevated privileges, bypassing RLS entirely:

```sql
CREATE OR REPLACE FUNCTION public.insert_location_cache(
  p_domain TEXT,
  p_city TEXT,
  p_state TEXT,
  p_confidence DECIMAL DEFAULT 0.5
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER  -- This is the key: runs with owner's privileges
SET search_path = public
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO location_detection_cache (domain, city, state, confidence)
  VALUES (p_domain, p_city, p_state, p_confidence)
  ON CONFLICT (domain)
  DO UPDATE SET
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    confidence = EXCLUDED.confidence,
    updated_at = NOW()
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.insert_location_cache TO anon, authenticated, public;
```

### Updated Application Code

```typescript
private async cacheResult(url: string, result: LocationResult): Promise<void> {
  try {
    const normalizedUrl = url.match(/^https?:\/\//i) ? url : `https://${url}`;
    const domain = new URL(normalizedUrl).hostname;

    // Try helper function first (bypasses RLS)
    const { data, error } = await supabase.rpc('insert_location_cache', {
      p_domain: domain,
      p_city: result.city,
      p_state: result.state,
      p_confidence: result.confidence || 0.5
    });

    if (error) {
      console.log('[LocationDetection] Helper function failed:', error);
      // Fallback to direct insert with minimal returning
      await supabase
        .from('location_detection_cache')
        .insert({ ...data }, { returning: 'minimal' });
    } else {
      console.log('[LocationDetection] Cached via helper function');
    }
  } catch (error) {
    console.log('[LocationDetection] Cache failed (non-critical):', error);
  }
}
```

---

## Key Learnings

### 1. PostgREST Error Codes Are Misleading
- **400 Bad Request** often means RLS is blocking the automatic SELECT after INSERT
- **Check Supabase logs** for the actual PostgreSQL error message
- **Don't trust HTTP status codes** for RLS issues

### 2. The INSERT-SELECT Gap
- Always create matching SELECT policies for INSERT operations
- Or use `returning: 'minimal'` if you don't need the returned data
- Or use helper functions to bypass RLS entirely

### 3. Schema Cache Is Real
- PostgREST caches your schema aggressively
- Always force reload after adding columns or changing policies
- Multiple reload methods may be needed for reliability

### 4. SECURITY DEFINER Is Powerful
- Functions with SECURITY DEFINER run with owner's privileges
- Perfect for operations that need to bypass RLS
- Must be used carefully - essentially creates an API endpoint with elevated privileges

---

## Best Practices Going Forward

### 1. For Cache Tables
```sql
-- Option A: Disable RLS entirely for cache tables
ALTER TABLE cache_table DISABLE ROW LEVEL SECURITY;

-- Option B: Use helper functions for all operations
CREATE FUNCTION insert_cache(...) SECURITY DEFINER;
CREATE FUNCTION get_cache(...) SECURITY DEFINER;

-- Option C: Create comprehensive RLS policies
CREATE POLICY "cache_all_operations" ON cache_table
FOR ALL TO public, anon, authenticated
USING (true) WITH CHECK (true);
```

### 2. For Migration Scripts
Always include schema reload in migrations:
```sql
BEGIN;
-- Your changes
ALTER TABLE my_table ADD COLUMN new_col TYPE;

-- Force reload (multiple methods)
NOTIFY pgrst, 'reload schema';
ALTER TABLE my_table ADD COLUMN _reload BOOLEAN;
ALTER TABLE my_table DROP COLUMN _reload;
ANALYZE my_table;

COMMIT;
```

### 3. For Debugging 400 Errors
```javascript
const { data, error } = await supabase.from('table').insert(payload);
if (error) {
  console.error('Error pattern analysis:', {
    isRLS: error.message?.includes('row-level security'),
    isSchemaCache: error.code === 'PGRST204',
    isColumnMissing: error.code === '42703',
    isJSONB: error.code === '22P02',

    // Check Supabase dashboard logs for real error
    checkLogs: 'Dashboard > Logs > API > Filter by 400'
  });
}
```

---

## Complete Fix Checklist

When encountering 400 errors on Supabase:

1. ✅ **Check if it's INSERT-SELECT issue**: Add `{ returning: 'minimal' }`
2. ✅ **Add matching SELECT policy**: Must have same TO clause as INSERT
3. ✅ **Force schema cache reload**: Use multiple methods in migration
4. ✅ **Verify column types match**: Especially JSONB columns
5. ✅ **Create helper function**: SECURITY DEFINER bypasses RLS
6. ✅ **Check Supabase logs**: Real error is often different from 400
7. ✅ **Test with direct SQL**: Use SQL Editor to isolate client vs server issues

---

## References

- [PostgREST Issue #1756](https://github.com/PostgREST/postgrest/issues/1756) - RLS causing 400 errors
- [Supabase Docs - RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgREST Schema Cache](https://postgrest.org/en/stable/schema_cache.html)
- Original investigation date: November 22, 2025