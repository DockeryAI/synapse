-- ============================================================================
-- Competitor Intelligence Tables for Gap Tab 2.0
-- Migration: 20251128000001_competitor_intelligence_tables.sql
-- Purpose: Store competitor profiles, scans, gaps, and alerts
-- ============================================================================

-- ============================================================================
-- 1. COMPETITOR PROFILES TABLE
-- Stores discovered and user-added competitors per brand
-- ============================================================================

CREATE TABLE IF NOT EXISTS competitor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

    -- Basic Info
    name VARCHAR(255) NOT NULL,
    website VARCHAR(500),
    logo_url VARCHAR(500),

    -- Verification & Discovery
    is_verified BOOLEAN DEFAULT false,
    discovery_source VARCHAR(50) CHECK (discovery_source IN ('uvp', 'perplexity', 'manual', 'g2', 'google-maps')),
    confidence_score DECIMAL(3,2) DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),

    -- Segment Relevance (for filtering)
    segment_type VARCHAR(50) CHECK (segment_type IN ('local', 'regional', 'national', 'global')),
    business_type VARCHAR(50) CHECK (business_type IN ('b2b', 'b2c', 'dtc', 'mixed')),

    -- User Actions
    is_active BOOLEAN DEFAULT true,
    is_pinned BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,

    -- Extracted Positioning (from website scan)
    positioning_summary TEXT,
    key_claims TEXT[] DEFAULT '{}',
    pricing_model VARCHAR(100),
    target_audience TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_brand_competitor UNIQUE (brand_id, name)
);

-- Indexes for competitor_profiles
CREATE INDEX idx_competitor_profiles_brand ON competitor_profiles(brand_id);
CREATE INDEX idx_competitor_profiles_active ON competitor_profiles(brand_id, is_active) WHERE is_active = true;
CREATE INDEX idx_competitor_profiles_segment ON competitor_profiles(segment_type, business_type);
CREATE INDEX idx_competitor_profiles_name_search ON competitor_profiles USING gin(to_tsvector('english', name));

-- RLS for competitor_profiles
ALTER TABLE competitor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their brand competitors"
    ON competitor_profiles FOR SELECT
    USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their brand competitors"
    ON competitor_profiles FOR INSERT
    WITH CHECK (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their brand competitors"
    ON competitor_profiles FOR UPDATE
    USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their brand competitors"
    ON competitor_profiles FOR DELETE
    USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

COMMENT ON TABLE competitor_profiles IS 'Stores competitor profiles discovered or added for each brand';

-- ============================================================================
-- 2. COMPETITOR SCANS TABLE
-- Stores scan results for each competitor (website, reviews, ads, research)
-- ============================================================================

CREATE TABLE IF NOT EXISTS competitor_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competitor_id UUID NOT NULL REFERENCES competitor_profiles(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

    -- Scan Type
    scan_type VARCHAR(50) NOT NULL CHECK (scan_type IN (
        'website',           -- Apify website scrape
        'reviews-google',    -- Google Reviews
        'reviews-yelp',      -- Yelp Reviews
        'reviews-g2',        -- G2 Reviews
        'reviews-capterra',  -- Capterra Reviews
        'reviews-trustpilot',-- TrustPilot Reviews
        'ads-meta',          -- Meta Ad Library
        'ads-linkedin',      -- LinkedIn Ad Library
        'perplexity-research'-- Perplexity weakness research
    )),

    -- Scan Results
    scan_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    raw_response JSONB DEFAULT '{}'::jsonb,

    -- Analysis Results (Opus 4.5 processed)
    extracted_positioning TEXT,
    extracted_weaknesses TEXT[] DEFAULT '{}',
    extracted_strengths TEXT[] DEFAULT '{}',
    extracted_claims TEXT[] DEFAULT '{}',
    sentiment_summary JSONB DEFAULT '{}'::jsonb,

    -- Quality Metrics
    data_quality_score DECIMAL(3,2) DEFAULT 0.5 CHECK (data_quality_score >= 0 AND data_quality_score <= 1),
    sample_size INTEGER DEFAULT 0,

    -- Cache Management
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_stale BOOLEAN DEFAULT false,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for competitor_scans
CREATE INDEX idx_competitor_scans_competitor ON competitor_scans(competitor_id);
CREATE INDEX idx_competitor_scans_brand ON competitor_scans(brand_id);
CREATE INDEX idx_competitor_scans_type ON competitor_scans(competitor_id, scan_type);
CREATE INDEX idx_competitor_scans_expires ON competitor_scans(expires_at) WHERE is_stale = false;
CREATE INDEX idx_competitor_scans_fresh ON competitor_scans(competitor_id, scan_type, scanned_at DESC);

-- RLS for competitor_scans
ALTER TABLE competitor_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their brand competitor scans"
    ON competitor_scans FOR SELECT
    USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their brand competitor scans"
    ON competitor_scans FOR INSERT
    WITH CHECK (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their brand competitor scans"
    ON competitor_scans FOR UPDATE
    USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their brand competitor scans"
    ON competitor_scans FOR DELETE
    USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

COMMENT ON TABLE competitor_scans IS 'Stores individual scan results per competitor with TTL-based caching';

-- ============================================================================
-- 3. COMPETITOR GAPS TABLE
-- Stores extracted competitive gaps with full provenance
-- ============================================================================

CREATE TABLE IF NOT EXISTS competitor_gaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

    -- Competitor Association (can be multiple)
    competitor_ids UUID[] NOT NULL DEFAULT '{}',
    competitor_names TEXT[] NOT NULL DEFAULT '{}',

    -- Gap Content (The Void / The Demand / Your Angle)
    title VARCHAR(255) NOT NULL,
    the_void TEXT NOT NULL,
    the_demand TEXT NOT NULL,
    your_angle TEXT NOT NULL,

    -- Classification
    gap_type VARCHAR(50) CHECK (gap_type IN (
        'feature-gap',       -- Missing feature/capability
        'service-gap',       -- Service quality issue
        'pricing-gap',       -- Pricing model weakness
        'support-gap',       -- Customer support issues
        'trust-gap',         -- Trust/credibility issues
        'ux-gap',            -- User experience problems
        'integration-gap',   -- Integration limitations
        'messaging-gap'      -- Positioning/messaging weakness
    )),

    -- Quality & Confidence
    confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    source_count INTEGER DEFAULT 1,

    -- Provenance
    primary_source VARCHAR(50) NOT NULL CHECK (primary_source IN (
        'reviews',
        'ads',
        'website',
        'perplexity',
        'uvp-correlation'
    )),
    source_quotes JSONB DEFAULT '[]'::jsonb,  -- Array of {quote, source, url}
    source_scan_ids UUID[] DEFAULT '{}',

    -- Applicability
    customer_profiles JSONB DEFAULT '[]'::jsonb,  -- Which customer segments this applies to
    applicable_offerings JSONB DEFAULT '[]'::jsonb,  -- Which of your offerings address this

    -- User Actions
    is_dismissed BOOLEAN DEFAULT false,
    is_starred BOOLEAN DEFAULT false,
    used_in_content_count INTEGER DEFAULT 0,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for competitor_gaps
CREATE INDEX idx_competitor_gaps_brand ON competitor_gaps(brand_id);
CREATE INDEX idx_competitor_gaps_active ON competitor_gaps(brand_id, is_dismissed) WHERE is_dismissed = false;
CREATE INDEX idx_competitor_gaps_confidence ON competitor_gaps(brand_id, confidence_score DESC);
CREATE INDEX idx_competitor_gaps_type ON competitor_gaps(gap_type);
CREATE INDEX idx_competitor_gaps_competitors ON competitor_gaps USING gin(competitor_ids);
CREATE INDEX idx_competitor_gaps_source ON competitor_gaps(primary_source);

-- RLS for competitor_gaps
ALTER TABLE competitor_gaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their brand gaps"
    ON competitor_gaps FOR SELECT
    USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their brand gaps"
    ON competitor_gaps FOR INSERT
    WITH CHECK (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their brand gaps"
    ON competitor_gaps FOR UPDATE
    USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their brand gaps"
    ON competitor_gaps FOR DELETE
    USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

COMMENT ON TABLE competitor_gaps IS 'Stores competitive gaps with Void/Demand/Angle structure and full provenance';

-- ============================================================================
-- 4. COMPETITOR ALERTS TABLE
-- Stores weekly monitoring alerts for changes
-- ============================================================================

CREATE TABLE IF NOT EXISTS competitor_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    competitor_id UUID REFERENCES competitor_profiles(id) ON DELETE CASCADE,

    -- Alert Type
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN (
        'new-complaint',     -- New negative review theme
        'new-ad-campaign',   -- Competitor launched new ads
        'positioning-change',-- Competitor changed messaging
        'new-feature',       -- Competitor added feature
        'news-mention',      -- Competitor in news
        'gap-opportunity'    -- New gap discovered
    )),

    -- Alert Content
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high')) DEFAULT 'medium',

    -- Evidence
    evidence JSONB DEFAULT '{}'::jsonb,  -- Supporting data/quotes
    related_gap_id UUID REFERENCES competitor_gaps(id) ON DELETE SET NULL,

    -- Status
    is_read BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,
    is_actioned BOOLEAN DEFAULT false,

    -- Metadata
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for competitor_alerts
CREATE INDEX idx_competitor_alerts_brand ON competitor_alerts(brand_id);
CREATE INDEX idx_competitor_alerts_unread ON competitor_alerts(brand_id, is_read) WHERE is_read = false;
CREATE INDEX idx_competitor_alerts_competitor ON competitor_alerts(competitor_id);
CREATE INDEX idx_competitor_alerts_type ON competitor_alerts(alert_type);
CREATE INDEX idx_competitor_alerts_recent ON competitor_alerts(brand_id, detected_at DESC);

-- RLS for competitor_alerts
ALTER TABLE competitor_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their brand alerts"
    ON competitor_alerts FOR SELECT
    USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their brand alerts"
    ON competitor_alerts FOR INSERT
    WITH CHECK (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their brand alerts"
    ON competitor_alerts FOR UPDATE
    USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their brand alerts"
    ON competitor_alerts FOR DELETE
    USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

COMMENT ON TABLE competitor_alerts IS 'Stores weekly monitoring alerts for competitor changes';

-- ============================================================================
-- 5. COMPETITOR ADS TABLE
-- Stores competitor ad library data for analysis
-- ============================================================================

CREATE TABLE IF NOT EXISTS competitor_ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competitor_id UUID NOT NULL REFERENCES competitor_profiles(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

    -- Platform
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('meta', 'linkedin', 'google', 'tiktok')),

    -- Ad Content
    ad_id VARCHAR(255),  -- Platform's ad ID if available
    headline TEXT,
    body_text TEXT,
    cta_text VARCHAR(100),
    creative_type VARCHAR(50) CHECK (creative_type IN ('image', 'video', 'carousel', 'text')),
    creative_url VARCHAR(500),
    landing_page_url VARCHAR(500),

    -- Analysis
    messaging_themes TEXT[] DEFAULT '{}',
    target_audience_signals JSONB DEFAULT '{}'::jsonb,
    emotional_appeals TEXT[] DEFAULT '{}',

    -- Ad Library Metadata
    first_seen_at TIMESTAMP WITH TIME ZONE,
    last_seen_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    raw_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_competitor_ad UNIQUE (competitor_id, platform, ad_id)
);

-- Indexes for competitor_ads
CREATE INDEX idx_competitor_ads_competitor ON competitor_ads(competitor_id);
CREATE INDEX idx_competitor_ads_brand ON competitor_ads(brand_id);
CREATE INDEX idx_competitor_ads_platform ON competitor_ads(competitor_id, platform);
CREATE INDEX idx_competitor_ads_active ON competitor_ads(competitor_id, is_active) WHERE is_active = true;
CREATE INDEX idx_competitor_ads_themes ON competitor_ads USING gin(messaging_themes);

-- RLS for competitor_ads
ALTER TABLE competitor_ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their brand competitor ads"
    ON competitor_ads FOR SELECT
    USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their brand competitor ads"
    ON competitor_ads FOR INSERT
    WITH CHECK (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their brand competitor ads"
    ON competitor_ads FOR UPDATE
    USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their brand competitor ads"
    ON competitor_ads FOR DELETE
    USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

COMMENT ON TABLE competitor_ads IS 'Stores competitor ads from Meta/LinkedIn ad libraries';

-- ============================================================================
-- 6. TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Reuse or create the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
CREATE TRIGGER update_competitor_profiles_updated_at
    BEFORE UPDATE ON competitor_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitor_scans_updated_at
    BEFORE UPDATE ON competitor_scans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitor_gaps_updated_at
    BEFORE UPDATE ON competitor_gaps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitor_alerts_updated_at
    BEFORE UPDATE ON competitor_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitor_ads_updated_at
    BEFORE UPDATE ON competitor_ads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. HELPER VIEWS
-- ============================================================================

-- View for active gaps with competitor names
CREATE OR REPLACE VIEW active_competitor_gaps AS
SELECT
    g.*,
    array_agg(DISTINCT cp.name) FILTER (WHERE cp.name IS NOT NULL) as competitor_name_list
FROM competitor_gaps g
LEFT JOIN competitor_profiles cp ON cp.id = ANY(g.competitor_ids)
WHERE g.is_dismissed = false
GROUP BY g.id;

-- View for competitor scan freshness
CREATE OR REPLACE VIEW competitor_scan_status AS
SELECT
    cp.id as competitor_id,
    cp.brand_id,
    cp.name as competitor_name,
    cs.scan_type,
    cs.scanned_at,
    cs.expires_at,
    CASE
        WHEN cs.expires_at < NOW() THEN true
        ELSE false
    END as is_expired,
    cs.data_quality_score
FROM competitor_profiles cp
LEFT JOIN LATERAL (
    SELECT DISTINCT ON (scan_type) *
    FROM competitor_scans
    WHERE competitor_id = cp.id
    ORDER BY scan_type, scanned_at DESC
) cs ON true
WHERE cp.is_active = true;

COMMENT ON VIEW active_competitor_gaps IS 'Active gaps with resolved competitor names';
COMMENT ON VIEW competitor_scan_status IS 'Current scan status per competitor with freshness indicators';
