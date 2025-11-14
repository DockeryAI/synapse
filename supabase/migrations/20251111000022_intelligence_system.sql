-- =====================================================
-- MARBA Intelligence System Tables
-- Creates tables for opportunity detection, trending topics,
-- competitive intelligence, and learning patterns
-- =====================================================

-- Trending Topics Table
CREATE TABLE IF NOT EXISTS trending_topics (
  id TEXT PRIMARY KEY,
  keyword TEXT NOT NULL,
  category TEXT NOT NULL,
  growth_rate INTEGER NOT NULL,
  search_volume INTEGER NOT NULL,
  related_queries TEXT[] DEFAULT '{}',
  trending_duration TEXT NOT NULL,
  peak_interest TEXT NOT NULL,
  geographic_data JSONB DEFAULT '{}',
  relevance_to_brand INTEGER NOT NULL,
  content_angles TEXT[] DEFAULT '{}',
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for trending_topics
CREATE INDEX IF NOT EXISTS idx_trending_topics_keyword ON trending_topics(keyword);
CREATE INDEX IF NOT EXISTS idx_trending_topics_detected_at ON trending_topics(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_trending_topics_relevance ON trending_topics(relevance_to_brand DESC);
CREATE INDEX IF NOT EXISTS idx_trending_topics_growth ON trending_topics(growth_rate DESC);

-- Competitor Activities Table
CREATE TABLE IF NOT EXISTS competitor_activities (
  id TEXT PRIMARY KEY,
  competitor_id TEXT NOT NULL,
  competitor_name TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('product_launch', 'campaign', 'price_change', 'content', 'acquisition', 'expansion')),
  description TEXT NOT NULL,
  platform TEXT,
  engagement_metrics JSONB DEFAULT '{}',
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
  threat_level TEXT NOT NULL CHECK (threat_level IN ('low', 'medium', 'high', 'critical')),
  opportunity_level TEXT NOT NULL CHECK (opportunity_level IN ('low', 'medium', 'high')),
  recommended_response TEXT[] DEFAULT '{}',
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for competitor_activities
CREATE INDEX IF NOT EXISTS idx_competitor_activities_competitor ON competitor_activities(competitor_id);
CREATE INDEX IF NOT EXISTS idx_competitor_activities_detected_at ON competitor_activities(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_competitor_activities_threat ON competitor_activities(threat_level);
CREATE INDEX IF NOT EXISTS idx_competitor_activities_type ON competitor_activities(activity_type);

-- Competitive Positioning Analysis Table
CREATE TABLE IF NOT EXISTS competitive_positioning_analysis (
  id TEXT PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  competitor_id TEXT NOT NULL,
  our_messaging TEXT NOT NULL,
  their_messaging TEXT NOT NULL,
  psychology_comparison JSONB NOT NULL,
  positioning_gaps JSONB DEFAULT '[]',
  strengths TEXT[] DEFAULT '{}',
  weaknesses TEXT[] DEFAULT '{}',
  recommended_pivots JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for competitive_positioning_analysis
CREATE INDEX IF NOT EXISTS idx_positioning_brand ON competitive_positioning_analysis(brand_id);
CREATE INDEX IF NOT EXISTS idx_positioning_competitor ON competitive_positioning_analysis(competitor_id);
CREATE INDEX IF NOT EXISTS idx_positioning_created ON competitive_positioning_analysis(created_at DESC);

-- Content Patterns Table
CREATE TABLE IF NOT EXISTS content_patterns (
  id TEXT PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pattern_category TEXT NOT NULL CHECK (pattern_category IN ('format', 'timing', 'topic', 'hashtag', 'length', 'tone')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  discovered_from JSONB NOT NULL,
  performance_metrics JSONB NOT NULL,
  confidence_score DECIMAL(3,2) NOT NULL,
  statistical_significance DECIMAL(3,2) NOT NULL,
  actionable_insights TEXT[] DEFAULT '{}',
  implementation_guide TEXT[] DEFAULT '{}',
  evidence_examples JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_validated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for content_patterns
CREATE INDEX IF NOT EXISTS idx_content_patterns_brand ON content_patterns(brand_id);
CREATE INDEX IF NOT EXISTS idx_content_patterns_category ON content_patterns(pattern_category);
CREATE INDEX IF NOT EXISTS idx_content_patterns_confidence ON content_patterns(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_content_patterns_created ON content_patterns(created_at DESC);

-- Content Posts Table (for pattern analysis)
CREATE TABLE IF NOT EXISTS content_posts (
  id TEXT PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('carousel', 'single_image', 'video', 'reel', 'story', 'text')),
  posted_at TIMESTAMPTZ NOT NULL,
  caption TEXT,
  hashtags TEXT[] DEFAULT '{}',
  engagement_rate DECIMAL(5,2) NOT NULL,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for content_posts
CREATE INDEX IF NOT EXISTS idx_content_posts_brand ON content_posts(brand_id);
CREATE INDEX IF NOT EXISTS idx_content_posts_platform ON content_posts(platform);
CREATE INDEX IF NOT EXISTS idx_content_posts_posted_at ON content_posts(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_posts_engagement ON content_posts(engagement_rate DESC);

-- Intelligence Signals Table (raw signal data)
CREATE TABLE IF NOT EXISTS intelligence_signals (
  id TEXT PRIMARY KEY,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('weather', 'trend', 'competitive', 'seasonal', 'news', 'platform', 'audience')),
  source TEXT NOT NULL,
  raw_data JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  opportunities_generated INTEGER DEFAULT 0,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for intelligence_signals
CREATE INDEX IF NOT EXISTS idx_intelligence_signals_type ON intelligence_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_intelligence_signals_processed ON intelligence_signals(processed);
CREATE INDEX IF NOT EXISTS idx_intelligence_signals_detected ON intelligence_signals(detected_at DESC);

-- Competitors Table
CREATE TABLE IF NOT EXISTS competitors (
  id TEXT PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website TEXT,
  social_handles JSONB DEFAULT '{}',
  industry TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for competitors
CREATE INDEX IF NOT EXISTS idx_competitors_brand ON competitors(brand_id);
CREATE INDEX IF NOT EXISTS idx_competitors_name ON competitors(name);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE trending_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitive_positioning_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;

-- Trending Topics Policies (public read for now, can be restricted later)
CREATE POLICY "Anyone can read trending topics"
  ON trending_topics FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert trending topics"
  ON trending_topics FOR INSERT
  WITH CHECK (true);

-- Competitor Activities Policies (public read)
CREATE POLICY "Anyone can read competitor activities"
  ON competitor_activities FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert competitor activities"
  ON competitor_activities FOR INSERT
  WITH CHECK (true);

-- Competitive Positioning Analysis Policies
CREATE POLICY "Users can read own positioning analysis"
  ON competitive_positioning_analysis FOR SELECT
  USING (auth.uid() = brand_id);

CREATE POLICY "Users can insert own positioning analysis"
  ON competitive_positioning_analysis FOR INSERT
  WITH CHECK (auth.uid() = brand_id);

CREATE POLICY "Users can update own positioning analysis"
  ON competitive_positioning_analysis FOR UPDATE
  USING (auth.uid() = brand_id);

-- Content Patterns Policies
CREATE POLICY "Users can read own patterns"
  ON content_patterns FOR SELECT
  USING (auth.uid() = brand_id);

CREATE POLICY "Service role can insert patterns"
  ON content_patterns FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update patterns"
  ON content_patterns FOR UPDATE
  USING (true);

-- Content Posts Policies
CREATE POLICY "Users can read own posts"
  ON content_posts FOR SELECT
  USING (auth.uid() = brand_id);

CREATE POLICY "Users can insert own posts"
  ON content_posts FOR INSERT
  WITH CHECK (auth.uid() = brand_id);

CREATE POLICY "Users can update own posts"
  ON content_posts FOR UPDATE
  USING (auth.uid() = brand_id);

-- Intelligence Signals Policies
CREATE POLICY "Service role can manage signals"
  ON intelligence_signals FOR ALL
  USING (true);

-- Competitors Policies
CREATE POLICY "Users can read own competitors"
  ON competitors FOR SELECT
  USING (auth.uid() = brand_id);

CREATE POLICY "Users can insert own competitors"
  ON competitors FOR INSERT
  WITH CHECK (auth.uid() = brand_id);

CREATE POLICY "Users can update own competitors"
  ON competitors FOR UPDATE
  USING (auth.uid() = brand_id);

CREATE POLICY "Users can delete own competitors"
  ON competitors FOR DELETE
  USING (auth.uid() = brand_id);

-- =====================================================
-- Functions for Intelligence Processing
-- =====================================================

-- Function to calculate opportunity impact score
CREATE OR REPLACE FUNCTION calculate_opportunity_impact(
  reach INTEGER,
  relevance INTEGER,
  timeliness INTEGER,
  confidence DECIMAL
) RETURNS INTEGER AS $$
BEGIN
  -- Weighted scoring: Relevance (40%), Reach (30%), Timeliness (20%), Confidence (10%)
  RETURN ROUND(
    (relevance * 0.4) + (reach * 0.3) + (timeliness * 0.2) + (confidence * 10)
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get active patterns for a brand
CREATE OR REPLACE FUNCTION get_active_patterns(p_brand_id UUID)
RETURNS SETOF content_patterns AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM content_patterns
  WHERE brand_id = p_brand_id
    AND confidence_score >= 0.75
  ORDER BY created_at DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Triggers for Updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trending_topics_updated_at BEFORE UPDATE ON trending_topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitor_activities_updated_at BEFORE UPDATE ON competitor_activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_positioning_analysis_updated_at BEFORE UPDATE ON competitive_positioning_analysis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_patterns_updated_at BEFORE UPDATE ON content_patterns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_posts_updated_at BEFORE UPDATE ON content_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitors_updated_at BEFORE UPDATE ON competitors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE trending_topics IS 'Stores detected trending topics from Google Trends and other sources';
COMMENT ON TABLE competitor_activities IS 'Tracks competitor activities across platforms';
COMMENT ON TABLE competitive_positioning_analysis IS 'Stores Synapse-powered competitive positioning analysis';
COMMENT ON TABLE content_patterns IS 'ML-detected patterns in content performance';
COMMENT ON TABLE content_posts IS 'Historical content posts for pattern analysis';
COMMENT ON TABLE intelligence_signals IS 'Raw intelligence signals before processing';
COMMENT ON TABLE competitors IS 'Competitor profiles for monitoring';
