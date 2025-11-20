-- Fix industry_profiles table permissions and RLS
-- Allow on-demand generated profiles to be saved

-- Disable RLS temporarily to allow saves during development
ALTER TABLE IF EXISTS public.industry_profiles DISABLE ROW LEVEL SECURITY;

-- Grant full access to all roles
GRANT ALL ON public.industry_profiles TO postgres, anon, authenticated, service_role;

-- Ensure the table has proper indexes
CREATE INDEX IF NOT EXISTS idx_industry_profiles_naics ON public.industry_profiles(naics_code);
CREATE INDEX IF NOT EXISTS idx_industry_profiles_name ON public.industry_profiles(name);

-- Force schema cache refresh for PostgREST
NOTIFY pgrst, 'reload schema';
