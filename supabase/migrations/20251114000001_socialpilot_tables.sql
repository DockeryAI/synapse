-- SocialPilot Integration Tables
-- Migration for OAuth connections and publishing queue

-- Table: socialpilot_connections
-- Stores OAuth tokens and connection status for SocialPilot integration
CREATE TABLE IF NOT EXISTS socialpilot_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one connection per user
  UNIQUE(user_id)
);

-- Index for quick user lookups
CREATE INDEX IF NOT EXISTS idx_socialpilot_connections_user_id
  ON socialpilot_connections(user_id);

-- Index for expired token checks
CREATE INDEX IF NOT EXISTS idx_socialpilot_connections_expires_at
  ON socialpilot_connections(expires_at);

-- Table: publishing_queue
-- Stores scheduled posts waiting to be published via SocialPilot
CREATE TABLE IF NOT EXISTS publishing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Content to publish
  content TEXT NOT NULL,
  account_ids TEXT[] NOT NULL, -- Array of SocialPilot account IDs
  media TEXT[], -- Array of media URLs
  hashtags TEXT[], -- Array of hashtags

  -- Scheduling
  scheduled_time TIMESTAMPTZ NOT NULL,
  published_at TIMESTAMPTZ,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'publishing', 'published', 'failed')),
  platform_post_id TEXT, -- ID from SocialPilot after publishing

  -- Retry logic
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry TIMESTAMPTZ,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for content_id lookups
CREATE INDEX IF NOT EXISTS idx_publishing_queue_content_id
  ON publishing_queue(content_id);

-- Index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_publishing_queue_user_id
  ON publishing_queue(user_id);

-- Index for scheduled time queries (most important for automation)
CREATE INDEX IF NOT EXISTS idx_publishing_queue_scheduled_time
  ON publishing_queue(scheduled_time)
  WHERE status = 'pending';

-- Index for status queries
CREATE INDEX IF NOT EXISTS idx_publishing_queue_status
  ON publishing_queue(status);

-- Composite index for queue processing (status + scheduled_time)
CREATE INDEX IF NOT EXISTS idx_publishing_queue_processing
  ON publishing_queue(status, scheduled_time)
  WHERE status IN ('pending', 'publishing');

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for socialpilot_connections
DROP TRIGGER IF EXISTS update_socialpilot_connections_updated_at ON socialpilot_connections;
CREATE TRIGGER update_socialpilot_connections_updated_at
  BEFORE UPDATE ON socialpilot_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for publishing_queue
DROP TRIGGER IF EXISTS update_publishing_queue_updated_at ON publishing_queue;
CREATE TRIGGER update_publishing_queue_updated_at
  BEFORE UPDATE ON publishing_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE socialpilot_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE publishing_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for socialpilot_connections
CREATE POLICY "Users can view their own SocialPilot connections"
  ON socialpilot_connections
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own SocialPilot connections"
  ON socialpilot_connections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own SocialPilot connections"
  ON socialpilot_connections
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own SocialPilot connections"
  ON socialpilot_connections
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for publishing_queue
CREATE POLICY "Users can view their own publishing queue"
  ON publishing_queue
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own publishing queue items"
  ON publishing_queue
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own publishing queue items"
  ON publishing_queue
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own publishing queue items"
  ON publishing_queue
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON socialpilot_connections TO authenticated;
GRANT ALL ON publishing_queue TO authenticated;

-- Comments for documentation
COMMENT ON TABLE socialpilot_connections IS 'Stores OAuth tokens for SocialPilot API integration';
COMMENT ON TABLE publishing_queue IS 'Queue for scheduled content to be published via SocialPilot';
COMMENT ON COLUMN publishing_queue.status IS 'pending | publishing | published | failed';
COMMENT ON COLUMN publishing_queue.retry_count IS 'Number of times publishing has been retried';
COMMENT ON COLUMN publishing_queue.max_retries IS 'Maximum number of retry attempts (default: 3)';
