-- Fix anon role permissions at database level
-- This ensures the anon role can actually access the tables

-- 1. First, ensure anon role has USAGE on the schema
GRANT USAGE ON SCHEMA public TO anon;

-- 2. Grant ALL privileges on existing tables to anon
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon;

-- 3. Grant ALL privileges on sequences (for auto-increment columns)
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 4. Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;

-- 5. Specifically grant permissions on our UVP tables (redundant but explicit)
GRANT ALL ON TABLE value_statements TO anon;
GRANT ALL ON TABLE uvp_components TO anon;
GRANT ALL ON TABLE uvp_ab_tests TO anon;
GRANT ALL ON TABLE brand_uvps TO anon;
GRANT ALL ON TABLE mirror_intend_objectives TO anon;
GRANT ALL ON TABLE marketing_strategies TO anon;
GRANT ALL ON TABLE tactical_plans TO anon;

-- 6. Check and fix column-level permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;

-- 7. Ensure anon can execute functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- 8. Force schema reload
NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload config');

-- 9. Verification query - this should return TRUE
DO $$
DECLARE
    has_permissions BOOLEAN;
BEGIN
    -- Check if anon has SELECT permission on brand_uvps
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.table_privileges
        WHERE grantee = 'anon'
        AND table_name = 'brand_uvps'
        AND privilege_type = 'SELECT'
    ) INTO has_permissions;

    IF has_permissions THEN
        RAISE NOTICE 'SUCCESS: anon role has permissions on brand_uvps table';
    ELSE
        RAISE WARNING 'FAILURE: anon role does NOT have permissions on brand_uvps table';
    END IF;
END $$;