-- ============================================================================
-- Performance Optimization Indexes
-- Created: November 17, 2025
-- Week 3 Phase 2B: Database & Query Optimization
-- ============================================================================

-- Purpose: Add database indexes to improve query performance across the application.
-- Tables optimized: analytics_events, campaign_content
-- Expected performance improvement: 5-10x faster queries on indexed columns

-- ============================================================================
-- ANALYTICS_EVENTS TABLE INDEXES
-- ============================================================================

-- Index on event_type for filtering by event category
CREATE INDEX IF NOT EXISTS idx_analytics_events_type
ON analytics_events(event_type);

-- Index on brand_id for filtering brand-specific analytics
CREATE INDEX IF NOT EXISTS idx_analytics_events_brand
ON analytics_events(brand_id);

-- Index on created_at for time-based queries and sorting
CREATE INDEX IF NOT EXISTS idx_analytics_events_created
ON analytics_events(created_at DESC);

-- Index on session_id for session-based analytics
CREATE INDEX IF NOT EXISTS idx_analytics_events_session
ON analytics_events((event_data->>'sessionId'));

-- Composite index for common query patterns (brand + type + time)
CREATE INDEX IF NOT EXISTS idx_analytics_events_brand_type_created
ON analytics_events(brand_id, event_type, created_at DESC);

-- ============================================================================
-- CAMPAIGN_CONTENT TABLE INDEXES
-- ============================================================================

-- Index on campaign_id for retrieving all content for a campaign
CREATE INDEX IF NOT EXISTS idx_campaign_content_campaign
ON campaign_content(campaign_id);

-- Index on status for filtering by content status
CREATE INDEX IF NOT EXISTS idx_campaign_content_status
ON campaign_content(status);

-- Index on platform for platform-specific queries
CREATE INDEX IF NOT EXISTS idx_campaign_content_platform
ON campaign_content(platform);

-- Index on created_at for time-based sorting
CREATE INDEX IF NOT EXISTS idx_campaign_content_created
ON campaign_content(created_at DESC);

-- Composite index for common query patterns (campaign + status)
CREATE INDEX IF NOT EXISTS idx_campaign_content_campaign_status
ON campaign_content(campaign_id, status);

-- ============================================================================
-- VERIFY INDEXES
-- ============================================================================

-- Query to verify all indexes were created successfully:
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   indexdef
-- FROM pg_indexes
-- WHERE tablename IN ('analytics_events', 'campaign_content')
-- ORDER BY tablename, indexname;

-- ============================================================================
-- PERFORMANCE NOTES
-- ============================================================================

-- Expected query improvements:
-- 1. Funnel analytics queries: 5-10x faster (indexed on event_type, brand_id, created_at)
-- 2. Campaign content retrieval: 3-5x faster (indexed on campaign_id, status)
-- 3. Time-based analytics: 10-20x faster (indexed on created_at with DESC ordering)
-- 4. Session tracking: 5-10x faster (indexed on session_id via JSONB)

-- Index size estimate: ~5-10MB per 100k rows
-- Trade-off: Slightly slower writes (INSERT/UPDATE) for much faster reads (SELECT)
