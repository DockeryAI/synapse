# 400 Error Fix Summary - location_detection_cache

## Problem
Getting 400 errors saying columns `hasMultipleLocations` and `allLocations` don't exist, even after adding them multiple times.

## Root Cause Identified
**Column Name Case Mismatch** - TypeScript was using camelCase but PostgreSQL uses snake_case by default

## Fixes Applied

### 1. Database - Added columns with snake_case naming
```sql
ALTER TABLE location_detection_cache
ADD COLUMN IF NOT EXISTS has_multiple_locations BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS all_locations JSONB DEFAULT '[]'::jsonb;
```

### 2. PostgREST Schema Cache - Forced refresh
```sql
-- Dummy column trick to force cache refresh
ALTER TABLE location_detection_cache ADD COLUMN _temp_refresh BOOLEAN DEFAULT false;
ALTER TABLE location_detection_cache DROP COLUMN _temp_refresh;
```

### 3. TypeScript Code - Updated to use snake_case
**File:** `src/services/intelligence/location-detection.service.ts`

**Line 189** - SELECT query:
```typescript
// Before: .select('... hasMultipleLocations, allLocations')
// After:  .select('... has_multiple_locations, all_locations')
```

**Lines 717-718** - Upsert operation:
```typescript
// Before: hasMultipleLocations: result.hasMultipleLocations || false,
//         allLocations: result.allLocations || null,
// After:  has_multiple_locations: result.hasMultipleLocations || false,
//         all_locations: result.allLocations || null,
```

### 4. Helper Function - Updated to use snake_case
```sql
CREATE OR REPLACE FUNCTION public.insert_location_cache(...)
-- Now uses has_multiple_locations and all_locations internally
```

## Testing
After making these changes:
1. Run the SQL to add columns and refresh schema
2. Update the helper function
3. The TypeScript code changes are already saved
4. Test by researching a new business

## Key Lesson
PostgreSQL converts unquoted identifiers to lowercase. When JavaScript uses camelCase but the database has snake_case, you get 400 errors. Always ensure:
- Database columns use snake_case
- TypeScript field names match exactly
- PostgREST cache is refreshed after schema changes