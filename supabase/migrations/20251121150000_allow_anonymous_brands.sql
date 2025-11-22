-- ============================================================================
-- Allow Anonymous Brand Creation
-- ============================================================================
-- Created: 2025-11-21
-- Purpose: Allow anonymous users to create brands during onboarding
-- Issue: brands.user_id was NOT NULL, blocking anonymous inserts
-- ============================================================================

-- Make user_id nullable for anonymous users
ALTER TABLE public.brands ALTER COLUMN user_id DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN public.brands.user_id IS 'User ID - nullable for anonymous onboarding users';
