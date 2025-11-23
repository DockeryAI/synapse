-- Check the actual structure of location_detection_cache table
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'location_detection_cache'
ORDER BY ordinal_position;