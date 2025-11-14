-- ============================================================================
-- MARBA Background Jobs Configuration
-- ============================================================================
-- This script configures all 7 background jobs using Supabase pg_cron
--
-- PREREQUISITE: pg_cron extension must be enabled
-- Run this in your Supabase SQL Editor
--
-- IMPORTANT: Replace [YOUR_PROJECT_REF] and [YOUR_ANON_KEY] with actual values
--            Get these from: Supabase Dashboard > Settings > API
-- ============================================================================

-- Step 1: Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Step 2: Grant permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- ============================================================================
-- JOB 1: Brand Enrichment Scheduler (Daily at 2:00 AM UTC)
-- ============================================================================
-- Enriches all brand profiles with latest intelligence data
-- Runs: Daily at 2:00 AM UTC
-- Duration: ~5-10 minutes for 100 brands

SELECT cron.schedule(
  'marba-brand-enrichment-daily',
  '0 2 * * *', -- 2:00 AM UTC daily
  $$
  SELECT
    net.http_post(
      url := 'https://[YOUR_PROJECT_REF].supabase.co/functions/v1/cron-enrichment-scheduler',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer [YOUR_ANON_KEY]'
      ),
      body := jsonb_build_object(
        'job_name', 'brand_enrichment',
        'triggered_by', 'cron',
        'scheduled_at', NOW()
      )
    ) AS request_id;
  $$
);

-- ============================================================================
-- JOB 2: Opportunity Detector (Every Hour)
-- ============================================================================
-- Detects new marketing opportunities from weather, trends, news
-- Runs: Every hour on the hour
-- Duration: ~2-3 minutes

SELECT cron.schedule(
  'marba-opportunity-detection-hourly',
  '0 * * * *', -- Every hour at :00
  $$
  SELECT
    net.http_post(
      url := 'https://[YOUR_PROJECT_REF].supabase.co/functions/v1/cron-opportunity-detector',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer [YOUR_ANON_KEY]'
      ),
      body := jsonb_build_object(
        'job_name', 'opportunity_detection',
        'triggered_by', 'cron',
        'scheduled_at', NOW()
      )
    ) AS request_id;
  $$
);

-- ============================================================================
-- JOB 3: Competitive Monitoring (Every 6 Hours)
-- ============================================================================
-- Monitors competitor websites, social media, content
-- Runs: Every 6 hours (0:00, 6:00, 12:00, 18:00 UTC)
-- Duration: ~5-7 minutes

SELECT cron.schedule(
  'marba-competitive-monitoring-6h',
  '0 */6 * * *', -- Every 6 hours
  $$
  SELECT
    net.http_post(
      url := 'https://[YOUR_PROJECT_REF].supabase.co/functions/v1/cron-competitive-monitoring',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer [YOUR_ANON_KEY]'
      ),
      body := jsonb_build_object(
        'job_name', 'competitive_monitoring',
        'triggered_by', 'cron',
        'scheduled_at', NOW()
      )
    ) AS request_id;
  $$
);

-- ============================================================================
-- JOB 4: Analytics Collector (Daily at 3:00 AM UTC)
-- ============================================================================
-- Collects analytics from connected social platforms
-- Runs: Daily at 3:00 AM UTC
-- Duration: ~10-15 minutes (depends on platform API rate limits)

SELECT cron.schedule(
  'marba-analytics-collection-daily',
  '0 3 * * *', -- 3:00 AM UTC daily
  $$
  SELECT
    net.http_post(
      url := 'https://[YOUR_PROJECT_REF].supabase.co/functions/v1/cron-analytics-collector',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer [YOUR_ANON_KEY]'
      ),
      body := jsonb_build_object(
        'job_name', 'analytics_collection',
        'triggered_by', 'cron',
        'scheduled_at', NOW()
      )
    ) AS request_id;
  $$
);

-- ============================================================================
-- JOB 5: Learning Engine (Daily at 4:00 AM UTC)
-- ============================================================================
-- Analyzes content performance patterns and updates recommendations
-- Runs: Daily at 4:00 AM UTC
-- Duration: ~5-8 minutes

SELECT cron.schedule(
  'marba-learning-engine-daily',
  '0 4 * * *', -- 4:00 AM UTC daily
  $$
  SELECT
    net.http_post(
      url := 'https://[YOUR_PROJECT_REF].supabase.co/functions/v1/cron-learning-engine',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer [YOUR_ANON_KEY]'
      ),
      body := jsonb_build_object(
        'job_name', 'learning_engine',
        'triggered_by', 'cron',
        'scheduled_at', NOW()
      )
    ) AS request_id;
  $$
);

-- ============================================================================
-- JOB 6: Auto Publisher (Every 5 Minutes)
-- ============================================================================
-- Processes content queue and publishes scheduled content
-- Runs: Every 5 minutes
-- Duration: ~30 seconds

SELECT cron.schedule(
  'marba-auto-publisher-5min',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT
    net.http_post(
      url := 'https://[YOUR_PROJECT_REF].supabase.co/functions/v1/cron-auto-publisher',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer [YOUR_ANON_KEY]'
      ),
      body := jsonb_build_object(
        'job_name', 'auto_publisher',
        'triggered_by', 'cron',
        'scheduled_at', NOW()
      )
    ) AS request_id;
  $$
);

-- ============================================================================
-- JOB 7: Engagement Collector (Every Hour)
-- ============================================================================
-- Collects engagement metrics (likes, comments, shares) from published content
-- Runs: Every hour at :30
-- Duration: ~2-3 minutes

SELECT cron.schedule(
  'marba-engagement-collector-hourly',
  '30 * * * *', -- Every hour at :30
  $$
  SELECT
    net.http_post(
      url := 'https://[YOUR_PROJECT_REF].supabase.co/functions/v1/cron-engagement-collector',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer [YOUR_ANON_KEY]'
      ),
      body := jsonb_build_object(
        'job_name', 'engagement_collector',
        'triggered_by', 'cron',
        'scheduled_at', NOW()
      )
    ) AS request_id;
  $$
);

-- ============================================================================
-- VERIFY JOBS ARE SCHEDULED
-- ============================================================================
-- Run this to see all scheduled jobs:

SELECT
  jobid,
  jobname,
  schedule,
  command,
  active,
  nodename
FROM cron.job
WHERE jobname LIKE 'marba-%'
ORDER BY jobname;

-- ============================================================================
-- MANUAL TRIGGER (For Testing)
-- ============================================================================
-- To manually trigger any job for testing:
--
-- SELECT cron.unschedule('marba-opportunity-detection-hourly');
-- -- Make changes, then reschedule
--
-- Or call the edge function directly:
-- curl -X POST 'https://[YOUR_PROJECT_REF].supabase.co/functions/v1/cron-opportunity-detector' \
--   -H 'Authorization: Bearer [YOUR_ANON_KEY]' \
--   -H 'Content-Type: application/json'

-- ============================================================================
-- MONITORING
-- ============================================================================
-- View job execution history:

SELECT
  runid,
  jobid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid IN (
  SELECT jobid FROM cron.job WHERE jobname LIKE 'marba-%'
)
ORDER BY start_time DESC
LIMIT 50;

-- ============================================================================
-- CLEANUP (If needed)
-- ============================================================================
-- To remove all MARBA background jobs:
--
-- SELECT cron.unschedule(jobname)
-- FROM cron.job
-- WHERE jobname LIKE 'marba-%';

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
-- After running this script:
-- 1. Verify jobs are scheduled: SELECT * FROM cron.job WHERE jobname LIKE 'marba-%'
-- 2. Monitor first runs: SELECT * FROM cron.job_run_details ORDER BY start_time DESC
-- 3. Check edge function logs in Supabase Dashboard > Edge Functions > Logs
-- ============================================================================
