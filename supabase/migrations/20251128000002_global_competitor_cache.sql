-- ============================================================================
-- Global Competitor Cache Tables for Cross-Brand Reuse
-- Migration: 20251128000002_global_competitor_cache.sql
-- Purpose: Store competitor scan data globally for sharing across brands
--
-- This allows:
-- 1. Any brand discovering the same competitor can reuse existing scan data
-- 2. Weekly updates apply to the global cache, benefiting all brands
-- 3. Reduces API calls by 60-80% for common competitors
-- ============================================================================

-- ============================================================================
-- 1. GLOBAL COMPETITOR DIRECTORY
-- Central repository of all known competitors (not tied to any brand)
-- ============================================================================

CREATE TABLE IF NOT EXISTS global_competitor_directory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Unique Identifier (normalized website domain)
    canonical_domain VARCHAR(255) NOT NULL UNIQUE,  -- e.g., "hubspot.com" (without www, https)

    -- Basic Info
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),  -- Proper cased name for display
    logo_url VARCHAR(500),
    website_url VARCHAR(500),

    -- Industry Classification
    primary_industry VARCHAR(100),
    secondary_industries TEXT[] DEFAULT '{}',

    -- Company Profile
    company_size VARCHAR(50) CHECK (company_size IN ('startup', 'small', 'medium', 'enterprise', 'unknown')),
    business_model VARCHAR(50) CHECK (business_model IN ('b2b', 'b2c', 'dtc', 'mixed', 'unknown')),
    founded_year INTEGER,
    headquarters_location VARCHAR(255),

    -- Validation Sources (from G2, Capterra, etc)
    g2_profile JSONB DEFAULT '{}'::jsonb,  -- {url, rating, review_count, market_segment}
    capterra_profile JSONB DEFAULT '{}'::jsonb,
    trustpilot_profile JSONB DEFAULT '{}'::jsonb,
    linkedin_profile JSONB DEFAULT '{}'::jsonb,

    -- Quality Score
    data_confidence DECIMAL(3,2) DEFAULT 0.5 CHECK (data_confidence >= 0 AND data_confidence <= 1),
    validation_sources_count INTEGER DEFAULT 0,

    -- Usage Stats
    brands_using_count INTEGER DEFAULT 0,  -- How many brands have this as a competitor
    last_scanned_at TIMESTAMP WITH TIME ZONE,
    scan_count INTEGER DEFAULT 0,

    -- Metadata
    is_verified BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for global_competitor_directory
CREATE INDEX idx_global_competitor_domain ON global_competitor_directory(canonical_domain);
CREATE INDEX idx_global_competitor_name ON global_competitor_directory USING gin(to_tsvector('english', name));
CREATE INDEX idx_global_competitor_industry ON global_competitor_directory(primary_industry);
CREATE INDEX idx_global_competitor_popular ON global_competitor_directory(brands_using_count DESC);
CREATE INDEX idx_global_competitor_recently_scanned ON global_competitor_directory(last_scanned_at DESC);

-- RLS for global_competitor_directory (read-only for authenticated users)
ALTER TABLE global_competitor_directory ENABLE ROW LEVEL SECURITY;

-- Everyone can read global competitors
CREATE POLICY "Anyone can read global competitor directory"
    ON global_competitor_directory FOR SELECT
    USING (true);

-- Only system can insert/update (via service role)
CREATE POLICY "System can manage global competitors"
    ON global_competitor_directory FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

COMMENT ON TABLE global_competitor_directory IS 'Global cache of competitor data shared across all brands';

-- ============================================================================
-- 2. GLOBAL COMPETITOR SCANS CACHE
-- Stores scan results that can be reused by any brand
-- ============================================================================

CREATE TABLE IF NOT EXISTS global_competitor_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    global_competitor_id UUID NOT NULL REFERENCES global_competitor_directory(id) ON DELETE CASCADE,

    -- Scan Type
    scan_type VARCHAR(50) NOT NULL CHECK (scan_type IN (
        'website',
        'reviews-google',
        'reviews-yelp',
        'reviews-g2',
        'reviews-capterra',
        'reviews-trustpilot',
        'ads-meta',
        'ads-linkedin',
        'perplexity-research'
    )),

    -- Scan Results
    scan_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    raw_response JSONB DEFAULT '{}'::jsonb,

    -- Analysis Results
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

    -- Usage Tracking
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    scan_source VARCHAR(50) DEFAULT 'api',  -- 'api', 'cron', 'manual'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure one scan type per competitor (latest wins)
    CONSTRAINT unique_global_scan_type UNIQUE (global_competitor_id, scan_type)
);

-- Indexes for global_competitor_scans
CREATE INDEX idx_global_scans_competitor ON global_competitor_scans(global_competitor_id);
CREATE INDEX idx_global_scans_type ON global_competitor_scans(global_competitor_id, scan_type);
CREATE INDEX idx_global_scans_expires ON global_competitor_scans(expires_at) WHERE is_stale = false;
CREATE INDEX idx_global_scans_fresh ON global_competitor_scans(global_competitor_id, scanned_at DESC);
CREATE INDEX idx_global_scans_stale ON global_competitor_scans(is_stale, expires_at) WHERE is_stale = true;

-- RLS for global_competitor_scans (read-only for authenticated users)
ALTER TABLE global_competitor_scans ENABLE ROW LEVEL SECURITY;

-- Everyone can read global scans
CREATE POLICY "Anyone can read global competitor scans"
    ON global_competitor_scans FOR SELECT
    USING (true);

-- Only system can insert/update (via service role)
CREATE POLICY "System can manage global scans"
    ON global_competitor_scans FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

COMMENT ON TABLE global_competitor_scans IS 'Global cache of competitor scan data reusable across brands';

-- ============================================================================
-- 3. LINK TABLE: Brand Competitor to Global Directory
-- Maps brand-specific competitors to global cache entries
-- ============================================================================

-- Add column to competitor_profiles if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'competitor_profiles'
        AND column_name = 'global_competitor_id'
    ) THEN
        ALTER TABLE competitor_profiles
        ADD COLUMN global_competitor_id UUID REFERENCES global_competitor_directory(id) ON DELETE SET NULL;

        CREATE INDEX idx_competitor_profiles_global
        ON competitor_profiles(global_competitor_id)
        WHERE global_competitor_id IS NOT NULL;

        COMMENT ON COLUMN competitor_profiles.global_competitor_id IS 'Link to global competitor cache for data reuse';
    END IF;
END $$;

-- ============================================================================
-- 4. HELPER FUNCTIONS
-- ============================================================================

-- Function to normalize domain names
CREATE OR REPLACE FUNCTION normalize_domain(url TEXT)
RETURNS TEXT AS $$
DECLARE
    result TEXT;
BEGIN
    IF url IS NULL OR url = '' THEN
        RETURN NULL;
    END IF;

    -- Remove protocol
    result := regexp_replace(url, '^https?://', '', 'i');

    -- Remove www.
    result := regexp_replace(result, '^www\.', '', 'i');

    -- Remove trailing slash and path
    result := regexp_replace(result, '/.*$', '');

    -- Lowercase
    result := lower(result);

    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION normalize_domain IS 'Normalizes URLs to canonical domain format';

-- Function to find or create global competitor
CREATE OR REPLACE FUNCTION get_or_create_global_competitor(
    p_name VARCHAR(255),
    p_website VARCHAR(500),
    p_industry VARCHAR(100) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_domain TEXT;
    v_competitor_id UUID;
BEGIN
    -- Normalize the domain
    v_domain := normalize_domain(p_website);

    IF v_domain IS NULL THEN
        -- Can't create without domain, return null
        RETURN NULL;
    END IF;

    -- Try to find existing
    SELECT id INTO v_competitor_id
    FROM global_competitor_directory
    WHERE canonical_domain = v_domain;

    -- Create if not exists
    IF v_competitor_id IS NULL THEN
        INSERT INTO global_competitor_directory (
            canonical_domain,
            name,
            display_name,
            website_url,
            primary_industry,
            brands_using_count
        ) VALUES (
            v_domain,
            p_name,
            p_name,
            p_website,
            p_industry,
            1
        )
        ON CONFLICT (canonical_domain) DO UPDATE
        SET brands_using_count = global_competitor_directory.brands_using_count + 1,
            updated_at = NOW()
        RETURNING id INTO v_competitor_id;
    ELSE
        -- Increment usage count
        UPDATE global_competitor_directory
        SET brands_using_count = brands_using_count + 1,
            updated_at = NOW()
        WHERE id = v_competitor_id;
    END IF;

    RETURN v_competitor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_or_create_global_competitor IS 'Find or create a global competitor entry, returns the ID';

-- Function to get cached scan data
CREATE OR REPLACE FUNCTION get_cached_competitor_scan(
    p_website VARCHAR(500),
    p_scan_type VARCHAR(50)
)
RETURNS TABLE (
    scan_id UUID,
    scan_data JSONB,
    extracted_weaknesses TEXT[],
    extracted_claims TEXT[],
    data_quality_score DECIMAL(3,2),
    scanned_at TIMESTAMP WITH TIME ZONE,
    is_fresh BOOLEAN
) AS $$
DECLARE
    v_domain TEXT;
    v_global_id UUID;
BEGIN
    v_domain := normalize_domain(p_website);

    IF v_domain IS NULL THEN
        RETURN;
    END IF;

    -- Find global competitor
    SELECT id INTO v_global_id
    FROM global_competitor_directory
    WHERE canonical_domain = v_domain;

    IF v_global_id IS NULL THEN
        RETURN;
    END IF;

    -- Return cached scan if exists
    RETURN QUERY
    SELECT
        gs.id,
        gs.scan_data,
        gs.extracted_weaknesses,
        gs.extracted_claims,
        gs.data_quality_score,
        gs.scanned_at,
        (gs.expires_at > NOW() AND NOT gs.is_stale) as is_fresh
    FROM global_competitor_scans gs
    WHERE gs.global_competitor_id = v_global_id
    AND gs.scan_type = p_scan_type
    ORDER BY gs.scanned_at DESC
    LIMIT 1;

    -- Update access stats
    UPDATE global_competitor_scans
    SET access_count = access_count + 1,
        last_accessed_at = NOW()
    WHERE global_competitor_id = v_global_id
    AND scan_type = p_scan_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_cached_competitor_scan IS 'Retrieves cached scan data for a competitor by website and scan type';

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

-- Trigger to update global competitor last_scanned_at when scan is added
CREATE OR REPLACE FUNCTION update_global_competitor_scan_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE global_competitor_directory
    SET
        last_scanned_at = NEW.scanned_at,
        scan_count = scan_count + 1,
        updated_at = NOW()
    WHERE id = NEW.global_competitor_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_global_scan_stats
    AFTER INSERT ON global_competitor_scans
    FOR EACH ROW EXECUTE FUNCTION update_global_competitor_scan_stats();

-- Trigger to auto-link brand competitors to global cache
CREATE OR REPLACE FUNCTION auto_link_competitor_to_global()
RETURNS TRIGGER AS $$
DECLARE
    v_global_id UUID;
BEGIN
    -- Only process if website exists and global_competitor_id is not set
    IF NEW.website IS NOT NULL AND NEW.global_competitor_id IS NULL THEN
        SELECT get_or_create_global_competitor(NEW.name, NEW.website) INTO v_global_id;
        NEW.global_competitor_id := v_global_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_link_competitor_to_global
    BEFORE INSERT ON competitor_profiles
    FOR EACH ROW EXECUTE FUNCTION auto_link_competitor_to_global();

-- ============================================================================
-- 6. VIEW FOR CACHE STATUS
-- ============================================================================

CREATE OR REPLACE VIEW global_competitor_cache_status AS
SELECT
    gcd.id,
    gcd.canonical_domain,
    gcd.name,
    gcd.brands_using_count,
    gcd.last_scanned_at,
    gcd.data_confidence,
    COUNT(gcs.id) as scan_types_cached,
    MIN(gcs.expires_at) as earliest_expiry,
    MAX(gcs.scanned_at) as latest_scan,
    BOOL_OR(gcs.is_stale OR gcs.expires_at < NOW()) as needs_refresh
FROM global_competitor_directory gcd
LEFT JOIN global_competitor_scans gcs ON gcs.global_competitor_id = gcd.id
GROUP BY gcd.id;

COMMENT ON VIEW global_competitor_cache_status IS 'Shows cache status for global competitors';

-- ============================================================================
-- 7. SUMMARY VIEW FOR ANALYTICS
-- ============================================================================

CREATE OR REPLACE VIEW global_cache_analytics AS
SELECT
    COUNT(DISTINCT gcd.id) as total_competitors,
    SUM(gcd.brands_using_count) as total_brand_links,
    COUNT(DISTINCT gcs.id) as total_cached_scans,
    COUNT(DISTINCT gcs.id) FILTER (WHERE gcs.expires_at > NOW() AND NOT gcs.is_stale) as fresh_scans,
    COUNT(DISTINCT gcs.id) FILTER (WHERE gcs.expires_at <= NOW() OR gcs.is_stale) as stale_scans,
    SUM(gcs.access_count) as total_cache_hits,
    AVG(gcd.data_confidence) as avg_data_confidence
FROM global_competitor_directory gcd
LEFT JOIN global_competitor_scans gcs ON gcs.global_competitor_id = gcd.id;

COMMENT ON VIEW global_cache_analytics IS 'Analytics summary for global competitor cache';
