-- ============================================================================
-- Competitor Weekly Scan Cron Job
-- Gap Tab 2.0 - Phase 5
--
-- Sets up a weekly cron job to automatically scan competitors for changes.
-- Runs every Sunday at 2am UTC.
--
-- Prerequisites (must be enabled in Supabase Dashboard first):
-- 1. pg_cron extension
-- 2. pg_net extension
-- 3. Edge Function deployed: supabase functions deploy competitor-weekly-scan
--
-- Created: 2025-11-28
-- ============================================================================

-- Only create the cron job if pg_cron extension exists
DO $$
BEGIN
  -- Check if pg_cron is available
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Remove existing job if it exists (for idempotency)
    PERFORM cron.unschedule('competitor-weekly-scan')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'competitor-weekly-scan');

    -- Schedule the weekly scan job
    -- Runs every Sunday at 2:00 AM UTC (0 2 * * 0)
    PERFORM cron.schedule(
      'competitor-weekly-scan',
      '0 2 * * 0',
      $$
      SELECT net.http_post(
        url := 'https://jpwljchikgmggjidogon.supabase.co/functions/v1/competitor-weekly-scan',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := '{}'::jsonb
      );
      $$
    );

    RAISE NOTICE 'Cron job competitor-weekly-scan scheduled successfully';
  ELSE
    RAISE NOTICE 'pg_cron extension not available - please enable it in Supabase Dashboard first';
  END IF;
END $$;
