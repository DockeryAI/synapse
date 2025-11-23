# RLS Fix Instructions - 406/400 Errors

**Date:** 2025-11-22
**Issue:** Dashboard taking too long to load due to RLS blocking intelligence_cache, industry_profiles, naics_codes

---

## Quick Summary

**Problem:**
- 406 errors: `intelligence_cache` RLS blocking reads
- 400 errors: `industry_profiles` and `naics_codes` RLS blocking reads

**Solution:**
- Allow public reads on these lookup/cache tables
- Keep writes restricted to authenticated users

**Safety:** Full rollback capability via backup

---

## STEP 1: Backup Current Policies (DO THIS FIRST!)

### Option A: Automated Extraction (Recommended)

1. Open Supabase SQL Editor:
   - https://supabase.com/dashboard/project/jpwljchikgmggjidogon/editor

2. Run this file:
   - `.buildrunner/EXTRACT_CURRENT_RLS_POLICIES.sql`

3. Copy ALL results and save to:
   - `.buildrunner/RLS_BACKUP_MANUAL_$(date).sql`

### Option B: Use Script (If Supabase CLI configured)

```bash
chmod +x scripts/backup-rls-policies.sh
./scripts/backup-rls-policies.sh
```

---

## STEP 2: Apply Fixes

1. Open Supabase SQL Editor:
   - https://supabase.com/dashboard/project/jpwljchikgmggjidogon/editor

2. Run this file:
   - `.buildrunner/FIX_406_400_ERRORS.sql`

3. Verify at bottom of output:
   - All 3 tables show `rowsecurity: true`
   - Policies are created
   - Count queries return results (no errors)

---

## STEP 3: Test Dashboard

1. Reload: http://localhost:3001/dashboard

2. Check browser console:
   - ✅ No 406 errors on intelligence_cache
   - ✅ No 400 errors on industry_profiles/naics_codes
   - ✅ Page loads in < 10 seconds

3. If errors persist:
   - Proceed to ROLLBACK below

---

## ROLLBACK (If Something Breaks)

### If you backed up in Step 1:

1. Open Supabase SQL Editor

2. Run your backup file:
   - `.buildrunner/RLS_BACKUP_MANUAL_*.sql`

3. This will restore original policies

### If you didn't backup:

We have several previous RLS fix attempts in:
- `COMPLETE_RLS_FIX.sql`
- `PROPER_RLS_POLICIES_V2.sql`

But these may not match your exact current state.

---

## What Changed

### intelligence_cache
**Before:** Users could only read their own cache entries
**After:** Anyone can read (it's shared cache data), only authenticated can write

### industry_profiles
**Before:** Potentially restrictive policies
**After:** Public read (it's reference data), authenticated write only

### naics_codes
**Before:** Potentially restrictive policies
**After:** Public read (it's reference data), authenticated write only

---

## Why This is Safe

1. **Cache data is not sensitive** - intelligence_cache stores API response cache
2. **Reference data is public** - industry_profiles and naics_codes are lookup tables
3. **Writes still protected** - Only authenticated users can insert/update/delete
4. **Full rollback available** - Backup allows 100% restoration

---

## Files Created

- `.buildrunner/EXTRACT_CURRENT_RLS_POLICIES.sql` - Run to backup current state
- `.buildrunner/FIX_406_400_ERRORS.sql` - Run to apply fixes
- `.buildrunner/BACKUP_RLS_BEFORE_FIX_20251122.sql` - Template with instructions
- `scripts/backup-rls-policies.sh` - Automated backup script

---

## Next Steps After Fix

Once dashboard loads without errors:
1. Test V2 components render
2. Run Week 6 integration tests
3. Verify no data corruption

---

**Ready to proceed?**
1. Run STEP 1 (backup)
2. Run STEP 2 (apply fixes)
3. Run STEP 3 (test)
