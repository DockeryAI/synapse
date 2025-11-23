-- UVP ONBOARDING DATABASE BACKUP SCRIPT
-- Run this in Supabase SQL Editor to create backup tables

-- 1. Backup sessions table (contains UVP data)
CREATE TABLE IF NOT EXISTS sessions_backup_20241123 AS
SELECT * FROM sessions;

-- 2. Backup uvp_synthesis table
CREATE TABLE IF NOT EXISTS uvp_synthesis_backup_20241123 AS
SELECT * FROM uvp_synthesis;

-- 3. Backup uvp_generation table
CREATE TABLE IF NOT EXISTS uvp_generation_backup_20241123 AS
SELECT * FROM uvp_generation;

-- 4. Backup buyer_journey table
CREATE TABLE IF NOT EXISTS buyer_journey_backup_20241123 AS
SELECT * FROM buyer_journey;

-- 5. Backup business_context table
CREATE TABLE IF NOT EXISTS business_context_backup_20241123 AS
SELECT * FROM business_context;

-- 6. Backup any onboarding-related data
CREATE TABLE IF NOT EXISTS onboarding_data_backup_20241123 AS
SELECT * FROM onboarding_data WHERE created_at IS NOT NULL;

-- VERIFICATION
SELECT
  'sessions_backup_20241123' as table_name,
  COUNT(*) as row_count
FROM sessions_backup_20241123
UNION ALL
SELECT
  'uvp_synthesis_backup_20241123',
  COUNT(*)
FROM uvp_synthesis_backup_20241123
UNION ALL
SELECT
  'uvp_generation_backup_20241123',
  COUNT(*)
FROM uvp_generation_backup_20241123;

-- TO RESTORE (if needed):
-- TRUNCATE sessions;
-- INSERT INTO sessions SELECT * FROM sessions_backup_20241123;
-- TRUNCATE uvp_synthesis;
-- INSERT INTO uvp_synthesis SELECT * FROM uvp_synthesis_backup_20241123;
-- etc...