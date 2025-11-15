-- ============================================================================
-- Synapse MVP Foundation Database Schema
-- ============================================================================
--
-- This migration creates the complete database foundation for Synapse MVP
-- Includes 30+ tables across 8 categories with RLS policies and indexes
--
-- Categories:
-- 1. NAICS & Industries (4 tables)
-- 2. Business Profiles (6 tables)
-- 3. Intelligence & Analysis (5 tables)
-- 4. UVP & Evidence (4 tables)
-- 5. Campaigns & Content (4 tables)
-- 6. SocialPilot Integration (3 tables)
-- 7. Bannerbear (2 tables)
-- 8. Buyer Journey (2 tables)
--
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CATEGORY 1: NAICS & INDUSTRIES (4 tables)
-- ============================================================================

-- naics_codes: Official NAICS code database
CREATE TABLE IF NOT EXISTS naics_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(10) NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  level INTEGER NOT NULL, -- 2-digit, 3-digit, 4-digit, 5-digit, or 6-digit
  parent_code VARCHAR(10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_naics_codes_code ON naics_codes(code);
CREATE INDEX idx_naics_codes_parent ON naics_codes(parent_code);
CREATE INDEX idx_naics_codes_level ON naics_codes(level);

-- naics_hierarchies: NAICS code relationships
CREATE TABLE IF NOT EXISTS naics_hierarchies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(10) NOT NULL REFERENCES naics_codes(code),
  ancestor_code VARCHAR(10) NOT NULL REFERENCES naics_codes(code),
  depth INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(code, ancestor_code)
);

CREATE INDEX idx_naics_hierarchies_code ON naics_hierarchies(code);
CREATE INDEX idx_naics_hierarchies_ancestor ON naics_hierarchies(ancestor_code);

-- industry_profiles: Enriched industry data
CREATE TABLE IF NOT EXISTS industry_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  naics_code VARCHAR(10) NOT NULL REFERENCES naics_codes(code),
  market_size_usd BIGINT,
  growth_rate_percent DECIMAL(5,2),
  competition_level VARCHAR(20), -- low, medium, high, very_high
  seasonality JSONB, -- {peak_months: [], slow_months: []}
  key_trends JSONB, -- array of trend strings
  typical_margins JSONB, -- {low: 10, average: 20, high: 30}
  customer_personas JSONB, -- array of persona objects
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(naics_code)
);

CREATE INDEX idx_industry_profiles_naics ON industry_profiles(naics_code);

-- industry_keywords: SEO keywords by industry
CREATE TABLE IF NOT EXISTS industry_keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  naics_code VARCHAR(10) NOT NULL REFERENCES naics_codes(code),
  keyword TEXT NOT NULL,
  search_volume INTEGER,
  competition_score DECIMAL(3,2), -- 0.00 to 1.00
  relevance_score DECIMAL(3,2), -- 0.00 to 1.00
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_industry_keywords_naics ON industry_keywords(naics_code);
CREATE INDEX idx_industry_keywords_keyword ON industry_keywords(keyword);

-- ============================================================================
-- CATEGORY 2: BUSINESS PROFILES (6 tables)
-- ============================================================================

-- business_profiles: Core business information
CREATE TABLE IF NOT EXISTS business_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL, -- References auth.users (Supabase Auth)
  business_name VARCHAR(255) NOT NULL,
  website_url TEXT,
  naics_code VARCHAR(10) REFERENCES naics_codes(code),
  specialty VARCHAR(255),
  founded_year INTEGER,
  employee_count VARCHAR(20), -- 1-10, 11-50, 51-200, etc.
  annual_revenue_range VARCHAR(50),
  business_model VARCHAR(50), -- B2B, B2C, B2B2C
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_business_profiles_user ON business_profiles(user_id);
CREATE INDEX idx_business_profiles_naics ON business_profiles(naics_code);
CREATE INDEX idx_business_profiles_website ON business_profiles(website_url);

-- business_locations: Physical or service locations
CREATE TABLE IF NOT EXISTS business_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  location_type VARCHAR(20) NOT NULL, -- headquarters, branch, service_area
  address_line1 TEXT,
  address_line2 TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) NOT NULL DEFAULT 'US',
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_business_locations_business ON business_locations(business_id);
CREATE INDEX idx_business_locations_city ON business_locations(city);
CREATE INDEX idx_business_locations_state ON business_locations(state);
CREATE INDEX idx_business_locations_coords ON business_locations(latitude, longitude);

-- business_services: Services offered
CREATE TABLE IF NOT EXISTS business_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  service_name VARCHAR(255) NOT NULL,
  service_description TEXT,
  price_range VARCHAR(50),
  duration_minutes INTEGER,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_business_services_business ON business_services(business_id);

-- business_hours: Operating hours
CREATE TABLE IF NOT EXISTS business_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  location_id UUID REFERENCES business_locations(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 6=Saturday
  opens_at TIME,
  closes_at TIME,
  is_closed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(business_id, location_id, day_of_week)
);

CREATE INDEX idx_business_hours_business ON business_hours(business_id);

-- business_reviews: Aggregated review data
CREATE TABLE IF NOT EXISTS business_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL, -- google, yelp, facebook, etc.
  rating DECIMAL(3,2),
  review_count INTEGER,
  review_url TEXT,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(business_id, platform)
);

CREATE INDEX idx_business_reviews_business ON business_reviews(business_id);

-- business_competitors: Identified competitors
CREATE TABLE IF NOT EXISTS business_competitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  competitor_name VARCHAR(255) NOT NULL,
  competitor_website TEXT,
  competitor_location TEXT,
  strength_level VARCHAR(20), -- weak, moderate, strong, dominant
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_business_competitors_business ON business_competitors(business_id);

-- ============================================================================
-- CATEGORY 3: INTELLIGENCE & ANALYSIS (5 tables)
-- ============================================================================

-- intelligence_cache: Cached intelligence data
CREATE TABLE IF NOT EXISTS intelligence_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key VARCHAR(255) NOT NULL UNIQUE,
  data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_intelligence_cache_key ON intelligence_cache(cache_key);
CREATE INDEX idx_intelligence_cache_expires ON intelligence_cache(expires_at);

-- location_detection_cache: Cached location data
CREATE TABLE IF NOT EXISTS location_detection_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url VARCHAR(500) NOT NULL UNIQUE,
  detected_location JSONB NOT NULL,
  confidence_score DECIMAL(3,2),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_location_cache_url ON location_detection_cache(url);
CREATE INDEX idx_location_cache_expires ON location_detection_cache(expires_at);

-- market_analysis: Market intelligence reports
CREATE TABLE IF NOT EXISTS market_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  analysis_type VARCHAR(50) NOT NULL, -- local, regional, national
  market_size BIGINT,
  market_growth_rate DECIMAL(5,2),
  key_trends JSONB,
  opportunities JSONB,
  threats JSONB,
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_market_analysis_business ON market_analysis(business_id);

-- competitor_analysis: Detailed competitor insights
CREATE TABLE IF NOT EXISTS competitor_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  competitor_id UUID REFERENCES business_competitors(id) ON DELETE CASCADE,
  strengths JSONB,
  weaknesses JSONB,
  market_share_estimate DECIMAL(5,2),
  pricing_strategy TEXT,
  marketing_channels JSONB,
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_competitor_analysis_business ON competitor_analysis(business_id);

-- trend_analysis: Industry and market trends
CREATE TABLE IF NOT EXISTS trend_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  naics_code VARCHAR(10) REFERENCES naics_codes(code),
  trend_name VARCHAR(255) NOT NULL,
  trend_type VARCHAR(50), -- emerging, growing, declining, stable
  impact_level VARCHAR(20), -- low, medium, high
  description TEXT,
  sources JSONB, -- array of source URLs
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trend_analysis_naics ON trend_analysis(naics_code);

-- ============================================================================
-- CATEGORY 4: UVP & EVIDENCE (4 tables)
-- ============================================================================

-- uvp_statements: Unique Value Propositions
CREATE TABLE IF NOT EXISTS uvp_statements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  statement TEXT NOT NULL,
  variant_type VARCHAR(50), -- primary, secondary, social_media, elevator_pitch
  target_audience VARCHAR(100),
  confidence_score DECIMAL(3,2),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_uvp_statements_business ON uvp_statements(business_id);

-- evidence_points: Supporting evidence for UVPs
CREATE TABLE IF NOT EXISTS evidence_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uvp_id UUID NOT NULL REFERENCES uvp_statements(id) ON DELETE CASCADE,
  evidence_type VARCHAR(50) NOT NULL, -- statistic, testimonial, case_study, award
  evidence_text TEXT NOT NULL,
  source_url TEXT,
  credibility_score DECIMAL(3,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_evidence_points_uvp ON evidence_points(uvp_id);

-- proof_sources: Verified sources of proof
CREATE TABLE IF NOT EXISTS proof_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  source_type VARCHAR(50) NOT NULL, -- review, certification, award, case_study
  source_name VARCHAR(255) NOT NULL,
  source_url TEXT,
  verification_status VARCHAR(20), -- pending, verified, rejected
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_proof_sources_business ON proof_sources(business_id);

-- market_positioning: Strategic positioning data
CREATE TABLE IF NOT EXISTS market_positioning (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  positioning_statement TEXT,
  target_market TEXT,
  competitive_advantages JSONB,
  differentiation_factors JSONB,
  positioning_map_data JSONB, -- {x: value, y: value, competitors: [...]}
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_market_positioning_business ON market_positioning(business_id);

-- ============================================================================
-- CATEGORY 5: CAMPAIGNS & CONTENT (4 tables)
-- ============================================================================

-- marketing_campaigns: Campaign tracking
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  campaign_name VARCHAR(255) NOT NULL,
  campaign_type VARCHAR(50), -- social, email, content, ads
  status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, active, paused, completed
  start_date DATE,
  end_date DATE,
  budget_usd DECIMAL(10,2),
  goals JSONB,
  target_audience JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_campaigns_business ON marketing_campaigns(business_id);
CREATE INDEX idx_campaigns_status ON marketing_campaigns(status);

-- content_pieces: Individual content items
CREATE TABLE IF NOT EXISTS content_pieces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE SET NULL,
  content_type VARCHAR(50) NOT NULL, -- post, article, video, infographic
  platform VARCHAR(50), -- facebook, instagram, linkedin, twitter, blog
  title VARCHAR(500),
  content_text TEXT,
  media_urls JSONB,
  hashtags JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, scheduled, published, archived
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_pieces_business ON content_pieces(business_id);
CREATE INDEX idx_content_pieces_campaign ON content_pieces(campaign_id);
CREATE INDEX idx_content_pieces_status ON content_pieces(status);

-- content_performance: Analytics for content
CREATE TABLE IF NOT EXISTS content_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL REFERENCES content_pieces(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  engagements INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_performance_content ON content_performance(content_id);

-- ab_tests: A/B test tracking
CREATE TABLE IF NOT EXISTS ab_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  test_name VARCHAR(255) NOT NULL,
  variant_a_id UUID REFERENCES content_pieces(id),
  variant_b_id UUID REFERENCES content_pieces(id),
  test_type VARCHAR(50), -- headline, cta, image, copy
  status VARCHAR(20) NOT NULL DEFAULT 'running', -- running, completed, cancelled
  winner VARCHAR(1), -- A or B
  confidence_level DECIMAL(5,2),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ab_tests_business ON ab_tests(business_id);

-- ============================================================================
-- CATEGORY 6: SOCIALPILOT INTEGRATION (3 tables)
-- ============================================================================

-- socialpilot_accounts: Connected social accounts
CREATE TABLE IF NOT EXISTS socialpilot_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL, -- facebook, instagram, linkedin, twitter
  account_id VARCHAR(255) NOT NULL,
  account_name VARCHAR(255),
  account_handle VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(business_id, platform, account_id)
);

CREATE INDEX idx_socialpilot_accounts_business ON socialpilot_accounts(business_id);

-- scheduled_posts: Posts scheduled via SocialPilot
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL REFERENCES content_pieces(id) ON DELETE CASCADE,
  socialpilot_account_id UUID NOT NULL REFERENCES socialpilot_accounts(id) ON DELETE CASCADE,
  socialpilot_post_id VARCHAR(255),
  scheduled_time TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled', -- scheduled, published, failed, cancelled
  error_message TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scheduled_posts_content ON scheduled_posts(content_id);
CREATE INDEX idx_scheduled_posts_account ON scheduled_posts(socialpilot_account_id);
CREATE INDEX idx_scheduled_posts_time ON scheduled_posts(scheduled_time);

-- post_performance: Performance from SocialPilot
CREATE TABLE IF NOT EXISTS post_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scheduled_post_id UUID NOT NULL REFERENCES scheduled_posts(id) ON DELETE CASCADE,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  engagements INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_post_performance_post ON post_performance(scheduled_post_id);

-- ============================================================================
-- CATEGORY 7: BANNERBEAR (2 tables)
-- ============================================================================

-- bannerbear_templates: Visual templates
CREATE TABLE IF NOT EXISTS bannerbear_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  template_name VARCHAR(255) NOT NULL,
  template_id VARCHAR(255) NOT NULL, -- Bannerbear template ID
  template_type VARCHAR(50), -- social_post, story, ad, thumbnail
  dimensions JSONB, -- {width: 1080, height: 1080}
  customizable_fields JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bannerbear_templates_business ON bannerbear_templates(business_id);

-- generated_visuals: Generated visual content
CREATE TABLE IF NOT EXISTS generated_visuals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES bannerbear_templates(id) ON DELETE CASCADE,
  content_id UUID REFERENCES content_pieces(id) ON DELETE SET NULL,
  visual_url TEXT NOT NULL,
  thumbnail_url TEXT,
  modifications JSONB, -- {headline: "...", image: "..."}
  bannerbear_image_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_generated_visuals_template ON generated_visuals(template_id);
CREATE INDEX idx_generated_visuals_content ON generated_visuals(content_id);

-- ============================================================================
-- CATEGORY 8: BUYER JOURNEY (2 tables)
-- ============================================================================

-- buyer_personas: Target customer personas
CREATE TABLE IF NOT EXISTS buyer_personas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  persona_name VARCHAR(255) NOT NULL,
  age_range VARCHAR(50),
  income_range VARCHAR(50),
  occupation VARCHAR(100),
  goals JSONB,
  pain_points JSONB,
  buying_motivations JSONB,
  preferred_channels JSONB,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_buyer_personas_business ON buyer_personas(business_id);

-- journey_stages: Customer journey mapping
CREATE TABLE IF NOT EXISTS journey_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  persona_id UUID NOT NULL REFERENCES buyer_personas(id) ON DELETE CASCADE,
  stage_name VARCHAR(100) NOT NULL, -- awareness, consideration, decision, retention
  stage_order INTEGER NOT NULL,
  touchpoints JSONB,
  content_types JSONB,
  key_messages JSONB,
  success_metrics JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_journey_stages_persona ON journey_stages(persona_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables that have user_id or business_id
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE uvp_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE proof_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_positioning ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE socialpilot_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE bannerbear_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_visuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_stages ENABLE ROW LEVEL SECURITY;

-- Public read access for reference tables
ALTER TABLE naics_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE naics_hierarchies ENABLE ROW LEVEL SECURITY;
ALTER TABLE industry_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE industry_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE trend_analysis ENABLE ROW LEVEL SECURITY;

-- Cache tables: public access for efficiency
ALTER TABLE intelligence_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_detection_cache ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: Business Profiles (user owns their business)
-- ============================================================================

CREATE POLICY "Users can view their own business profiles"
  ON business_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own business profiles"
  ON business_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own business profiles"
  ON business_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own business profiles"
  ON business_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- RLS POLICIES: Business-related tables (via business ownership)
-- ============================================================================

-- Helper function to check business ownership
CREATE OR REPLACE FUNCTION user_owns_business(business_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM business_profiles
    WHERE id = business_uuid AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply ownership policies to all business-related tables
CREATE POLICY "Users can access their business locations"
  ON business_locations FOR ALL
  USING (user_owns_business(business_id));

CREATE POLICY "Users can access their business services"
  ON business_services FOR ALL
  USING (user_owns_business(business_id));

CREATE POLICY "Users can access their business hours"
  ON business_hours FOR ALL
  USING (user_owns_business(business_id));

CREATE POLICY "Users can access their business reviews"
  ON business_reviews FOR ALL
  USING (user_owns_business(business_id));

CREATE POLICY "Users can access their business competitors"
  ON business_competitors FOR ALL
  USING (user_owns_business(business_id));

CREATE POLICY "Users can access their market analysis"
  ON market_analysis FOR ALL
  USING (user_owns_business(business_id));

CREATE POLICY "Users can access their competitor analysis"
  ON competitor_analysis FOR ALL
  USING (user_owns_business(business_id));

CREATE POLICY "Users can access their UVP statements"
  ON uvp_statements FOR ALL
  USING (user_owns_business(business_id));

CREATE POLICY "Users can access their proof sources"
  ON proof_sources FOR ALL
  USING (user_owns_business(business_id));

CREATE POLICY "Users can access their market positioning"
  ON market_positioning FOR ALL
  USING (user_owns_business(business_id));

CREATE POLICY "Users can access their marketing campaigns"
  ON marketing_campaigns FOR ALL
  USING (user_owns_business(business_id));

CREATE POLICY "Users can access their content pieces"
  ON content_pieces FOR ALL
  USING (user_owns_business(business_id));

CREATE POLICY "Users can access their AB tests"
  ON ab_tests FOR ALL
  USING (user_owns_business(business_id));

CREATE POLICY "Users can access their social accounts"
  ON socialpilot_accounts FOR ALL
  USING (user_owns_business(business_id));

CREATE POLICY "Users can access their bannerbear templates"
  ON bannerbear_templates FOR ALL
  USING (user_owns_business(business_id));

CREATE POLICY "Users can access their buyer personas"
  ON buyer_personas FOR ALL
  USING (user_owns_business(business_id));

-- Policies for tables with foreign keys to protected tables
CREATE POLICY "Users can access evidence for their UVPs"
  ON evidence_points FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM uvp_statements
      WHERE uvp_statements.id = evidence_points.uvp_id
      AND user_owns_business(uvp_statements.business_id)
    )
  );

CREATE POLICY "Users can access performance for their content"
  ON content_performance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM content_pieces
      WHERE content_pieces.id = content_performance.content_id
      AND user_owns_business(content_pieces.business_id)
    )
  );

CREATE POLICY "Users can access their scheduled posts"
  ON scheduled_posts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM content_pieces
      WHERE content_pieces.id = scheduled_posts.content_id
      AND user_owns_business(content_pieces.business_id)
    )
  );

CREATE POLICY "Users can access performance for their posts"
  ON post_performance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM scheduled_posts sp
      JOIN content_pieces cp ON cp.id = sp.content_id
      WHERE sp.id = post_performance.scheduled_post_id
      AND user_owns_business(cp.business_id)
    )
  );

CREATE POLICY "Users can access visuals for their templates"
  ON generated_visuals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM bannerbear_templates
      WHERE bannerbear_templates.id = generated_visuals.template_id
      AND user_owns_business(bannerbear_templates.business_id)
    )
  );

CREATE POLICY "Users can access journey stages for their personas"
  ON journey_stages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM buyer_personas
      WHERE buyer_personas.id = journey_stages.persona_id
      AND user_owns_business(buyer_personas.business_id)
    )
  );

-- ============================================================================
-- RLS POLICIES: Public reference data (read-only for all)
-- ============================================================================

CREATE POLICY "Anyone can view NAICS codes"
  ON naics_codes FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view NAICS hierarchies"
  ON naics_hierarchies FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view industry profiles"
  ON industry_profiles FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view industry keywords"
  ON industry_keywords FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view trend analysis"
  ON trend_analysis FOR SELECT
  USING (true);

-- ============================================================================
-- RLS POLICIES: Cache tables (public read/write for efficiency)
-- ============================================================================

CREATE POLICY "Anyone can access intelligence cache"
  ON intelligence_cache FOR ALL
  USING (true);

CREATE POLICY "Anyone can access location cache"
  ON location_detection_cache FOR ALL
  USING (true);

-- ============================================================================
-- TRIGGERS: Updated_at timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_naics_codes_updated_at BEFORE UPDATE ON naics_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_industry_profiles_updated_at BEFORE UPDATE ON industry_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_industry_keywords_updated_at BEFORE UPDATE ON industry_keywords
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_profiles_updated_at BEFORE UPDATE ON business_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_locations_updated_at BEFORE UPDATE ON business_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_services_updated_at BEFORE UPDATE ON business_services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_hours_updated_at BEFORE UPDATE ON business_hours
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_reviews_updated_at BEFORE UPDATE ON business_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_competitors_updated_at BEFORE UPDATE ON business_competitors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_uvp_statements_updated_at BEFORE UPDATE ON uvp_statements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_market_positioning_updated_at BEFORE UPDATE ON market_positioning
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON marketing_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_pieces_updated_at BEFORE UPDATE ON content_pieces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_socialpilot_accounts_updated_at BEFORE UPDATE ON socialpilot_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_posts_updated_at BEFORE UPDATE ON scheduled_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bannerbear_templates_updated_at BEFORE UPDATE ON bannerbear_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_buyer_personas_updated_at BEFORE UPDATE ON buyer_personas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journey_stages_updated_at BEFORE UPDATE ON journey_stages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS: Document the schema
-- ============================================================================

COMMENT ON TABLE naics_codes IS 'Official NAICS industry classification codes';
COMMENT ON TABLE business_profiles IS 'Core business information for SMB clients';
COMMENT ON TABLE intelligence_cache IS 'Cached intelligence data from external APIs';
COMMENT ON TABLE uvp_statements IS 'Generated Unique Value Propositions for businesses';
COMMENT ON TABLE content_pieces IS 'Marketing content created for campaigns';
COMMENT ON TABLE socialpilot_accounts IS 'Connected social media accounts via SocialPilot';
COMMENT ON TABLE bannerbear_templates IS 'Visual templates for automated graphic generation';
COMMENT ON TABLE buyer_personas IS 'Target customer personas for marketing';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
