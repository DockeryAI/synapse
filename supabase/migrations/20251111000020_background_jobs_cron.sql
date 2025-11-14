-- Background Jobs and Cron Setup
-- Phase 15: Background Jobs and Enrichment Engine

-- Create background_jobs table
CREATE TABLE IF NOT EXISTS background_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  schedule TEXT NOT NULL, -- cron expression
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'failed')),
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  last_run_status TEXT CHECK (last_run_status IN ('success', 'failed', 'running')),
  last_run_duration_ms INTEGER,
  last_error TEXT,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create job_executions table
CREATE TABLE IF NOT EXISTS job_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed')),
  result JSONB,
  error TEXT,
  duration_ms INTEGER,
  brands_processed INTEGER DEFAULT 0,
  items_processed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_job_executions_job_name ON job_executions(job_name);
CREATE INDEX idx_job_executions_started_at ON job_executions(started_at DESC);

-- Create job_logs table
CREATE TABLE IF NOT EXISTS job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error')),
  message TEXT NOT NULL,
  metadata JSONB
);

CREATE INDEX idx_job_logs_job_name ON job_logs(job_name);
CREATE INDEX idx_job_logs_timestamp ON job_logs(timestamp DESC);
CREATE INDEX idx_job_logs_level ON job_logs(level);

-- Create enrichment_cache table (if not exists)
CREATE TABLE IF NOT EXISTS enrichment_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  section TEXT NOT NULL CHECK (section IN ('measure', 'intend', 'reimagine', 'reach', 'optimize', 'reflect')),
  data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(brand_id, section)
);

CREATE INDEX idx_enrichment_cache_brand_id ON enrichment_cache(brand_id);
CREATE INDEX idx_enrichment_cache_expires_at ON enrichment_cache(expires_at);

-- Create enrichment_schedule table
CREATE TABLE IF NOT EXISTS enrichment_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  section TEXT NOT NULL CHECK (section IN ('measure', 'intend', 'reimagine', 'reach', 'optimize', 'reflect')),
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('daily', 'weekly', 'on_demand')),
  last_enriched_at TIMESTAMPTZ,
  next_scheduled_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(brand_id, section)
);

CREATE INDEX idx_enrichment_schedule_brand_id ON enrichment_schedule(brand_id);
CREATE INDEX idx_enrichment_schedule_next_scheduled_at ON enrichment_schedule(next_scheduled_at);

-- Create enrichment_logs table
CREATE TABLE IF NOT EXISTS enrichment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_enrichment_logs_brand_id ON enrichment_logs(brand_id);
CREATE INDEX idx_enrichment_logs_created_at ON enrichment_logs(created_at DESC);

-- Create intelligence_signals table (for aggregated signals)
CREATE TABLE IF NOT EXISTS intelligence_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('opportunity', 'threat', 'trend', 'anomaly')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  source TEXT NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL,
  requires_action BOOLEAN DEFAULT false,
  suggested_actions TEXT[],
  metadata JSONB,
  is_dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_intelligence_signals_brand_id ON intelligence_signals(brand_id);
CREATE INDEX idx_intelligence_signals_detected_at ON intelligence_signals(detected_at DESC);
CREATE INDEX idx_intelligence_signals_severity ON intelligence_signals(severity);
CREATE INDEX idx_intelligence_signals_dismissed ON intelligence_signals(is_dismissed);

-- Create publish_events table
CREATE TABLE IF NOT EXISTS publish_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_calendar_item_id UUID NOT NULL REFERENCES content_calendar_items(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('scheduled', 'published', 'failed', 'retry')),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  platform TEXT NOT NULL,
  error TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_publish_events_content_item ON publish_events(content_calendar_item_id);
CREATE INDEX idx_publish_events_created_at ON publish_events(created_at DESC);

-- Create competitors table (if not exists)
CREATE TABLE IF NOT EXISTS competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_competitors_brand_id ON competitors(brand_id);

-- Create messaging_shifts table
CREATE TABLE IF NOT EXISTS messaging_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  competitor TEXT NOT NULL,
  previous_messaging TEXT,
  new_messaging TEXT,
  shift_type TEXT NOT NULL CHECK (shift_type IN ('tone', 'positioning', 'focus', 'target_audience')),
  impact_assessment TEXT,
  recommended_action TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_messaging_shifts_brand_id ON messaging_shifts(brand_id);
CREATE INDEX idx_messaging_shifts_created_at ON messaging_shifts(created_at DESC);

-- Create competitive_gaps table
CREATE TABLE IF NOT EXISTS competitive_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  area TEXT NOT NULL,
  gap_description TEXT NOT NULL,
  opportunity_size TEXT NOT NULL CHECK (opportunity_size IN ('small', 'medium', 'large')),
  effort_required TEXT NOT NULL CHECK (effort_required IN ('low', 'medium', 'high')),
  recommended_action TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_competitive_gaps_brand_id ON competitive_gaps(brand_id);

-- Create audience_segments table (if not exists)
CREATE TABLE IF NOT EXISTS audience_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  interests TEXT[],
  pain_points TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audience_segments_brand_id ON audience_segments(brand_id);

-- Insert initial background jobs
INSERT INTO background_jobs (name, schedule, status) VALUES
  ('cron-enrichment-scheduler', '0 2 * * *', 'active'),
  ('cron-opportunity-detector', '0 * * * *', 'active'),
  ('cron-competitive-monitoring', '0 */6 * * *', 'active'),
  ('cron-analytics-collector', '0 3 * * *', 'active'),
  ('cron-learning-engine', '0 4 * * *', 'active'),
  ('cron-auto-publisher', '*/5 * * * *', 'active'),
  ('cron-engagement-collector', '0 * * * *', 'active')
ON CONFLICT (name) DO NOTHING;

-- Note: pg_cron setup requires superuser access
-- The actual cron jobs will be set up via Supabase dashboard or CLI
-- Example pg_cron setup (run manually with superuser):

-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- SELECT cron.schedule(
--   'enrichment-scheduler',
--   '0 2 * * *',
--   $$
--   SELECT net.http_post(
--     url := 'https://your-project.supabase.co/functions/v1/cron-enrichment-scheduler',
--     headers := '{"Authorization": "Bearer YOUR_SERVICE_KEY"}'::jsonb
--   ) AS request_id;
--   $$
-- );

-- Repeat for other jobs...

-- Enable RLS
ALTER TABLE background_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrichment_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrichment_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrichment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE publish_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE messaging_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitive_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE audience_segments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin access
CREATE POLICY "Admin full access to background_jobs" ON background_jobs FOR ALL USING (true);
CREATE POLICY "Admin full access to job_executions" ON job_executions FOR ALL USING (true);
CREATE POLICY "Admin full access to job_logs" ON job_logs FOR ALL USING (true);

-- RLS Policies for brand data
CREATE POLICY "Users can view their enrichment_cache" ON enrichment_cache FOR SELECT USING (
  brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view their enrichment_schedule" ON enrichment_schedule FOR SELECT USING (
  brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view their intelligence_signals" ON intelligence_signals FOR ALL USING (
  brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view their competitors" ON competitors FOR ALL USING (
  brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view their competitive_gaps" ON competitive_gaps FOR SELECT USING (
  brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view their audience_segments" ON audience_segments FOR ALL USING (
  brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
);

COMMENT ON TABLE background_jobs IS 'Tracks all background jobs and their status';
COMMENT ON TABLE job_executions IS 'Logs individual job execution runs';
COMMENT ON TABLE job_logs IS 'Detailed logs for job events';
COMMENT ON TABLE enrichment_cache IS 'Caches enrichment results with TTL';
COMMENT ON TABLE intelligence_signals IS 'Aggregated intelligence signals from all sources';
