-- Fix permissions for UVP tables
-- Grant SELECT permissions to anon and authenticated roles

-- Grant permissions for value_statements
GRANT SELECT ON value_statements TO anon;
GRANT SELECT ON value_statements TO authenticated;
GRANT INSERT, UPDATE, DELETE ON value_statements TO authenticated;

-- Grant permissions for uvp_components
GRANT SELECT ON uvp_components TO anon;
GRANT SELECT ON uvp_components TO authenticated;
GRANT INSERT, UPDATE, DELETE ON uvp_components TO authenticated;

-- Grant permissions for uvp_ab_tests
GRANT SELECT ON uvp_ab_tests TO anon;
GRANT SELECT ON uvp_ab_tests TO authenticated;
GRANT INSERT, UPDATE, DELETE ON uvp_ab_tests TO authenticated;

-- Grant permissions for brand_uvps
GRANT SELECT ON brand_uvps TO anon;
GRANT SELECT ON brand_uvps TO authenticated;
GRANT INSERT, UPDATE, DELETE ON brand_uvps TO authenticated;

-- Also fix permissions for other tables that are showing 406 errors
GRANT SELECT ON mirror_intend_objectives TO anon;
GRANT SELECT ON mirror_intend_objectives TO authenticated;
GRANT INSERT, UPDATE, DELETE ON mirror_intend_objectives TO authenticated;

GRANT SELECT ON marketing_strategies TO anon;
GRANT SELECT ON marketing_strategies TO authenticated;
GRANT INSERT, UPDATE, DELETE ON marketing_strategies TO authenticated;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';