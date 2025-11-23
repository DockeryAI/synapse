#!/bin/bash
# UVP ONBOARDING ROLLBACK SCRIPT
# This script will restore the UVP onboarding to the backed-up state

echo "🔄 Starting UVP Onboarding Rollback..."

# 1. Stash any current changes
echo "📦 Stashing current changes..."
git stash

# 2. Checkout the backup branch
BACKUP_BRANCH="backup/uvp-onboarding-20241123"
echo "🔀 Switching to backup branch: $BACKUP_BRANCH"
git checkout $BACKUP_BRANCH

# 3. Create a new working branch from backup
echo "🌿 Creating new working branch from backup..."
git checkout -b restored-uvp-$(date +%Y%m%d-%H%M%S)

# 4. Restore specific UVP files only (preserve other work)
echo "📝 Restoring UVP components..."
git checkout $BACKUP_BRANCH -- src/components/uvp-wizard/
git checkout $BACKUP_BRANCH -- src/components/uvp-flow/
git checkout $BACKUP_BRANCH -- src/components/onboarding/
git checkout $BACKUP_BRANCH -- src/components/onboarding-v5/
git checkout $BACKUP_BRANCH -- src/contexts/UVPWizardContext.tsx
git checkout $BACKUP_BRANCH -- src/types/uvp*.ts
git checkout $BACKUP_BRANCH -- src/types/smart-uvp.types.ts

# 5. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 6. Print database restore instructions
echo "
✅ CODE ROLLBACK COMPLETE!

⚠️  TO RESTORE DATABASE:
1. Go to Supabase Dashboard
2. Open SQL Editor
3. Run these commands:

-- Restore sessions
TRUNCATE sessions CASCADE;
INSERT INTO sessions SELECT * FROM sessions_backup_20241123;

-- Restore UVP data
TRUNCATE uvp_synthesis CASCADE;
INSERT INTO uvp_synthesis SELECT * FROM uvp_synthesis_backup_20241123;

TRUNCATE uvp_generation CASCADE;
INSERT INTO uvp_generation SELECT * FROM uvp_generation_backup_20241123;

4. Verify the restore:
SELECT COUNT(*) FROM sessions;
SELECT COUNT(*) FROM uvp_synthesis;

🎉 UVP Onboarding has been restored to backup state!
"