-- ============================================================================
-- Product Marketing Tables Migration
--
-- Creates the core tables for product-centric marketing functionality.
-- All tables are prefixed with pm_ to namespace them.
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. PM_CATEGORIES - Product categories with hierarchy support
-- ============================================================================
CREATE TABLE IF NOT EXISTS pm_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    parent_category_id UUID REFERENCES pm_categories(id) ON DELETE SET NULL,
    display_order INTEGER DEFAULT 0,
    icon VARCHAR(100),
    color VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for pm_categories
CREATE INDEX IF NOT EXISTS idx_pm_categories_slug ON pm_categories(slug);
CREATE INDEX IF NOT EXISTS idx_pm_categories_parent ON pm_categories(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_pm_categories_active ON pm_categories(is_active) WHERE is_active = true;

-- ============================================================================
-- 2. PM_PRODUCTS - Main product/service catalog
-- ============================================================================
CREATE TABLE IF NOT EXISTS pm_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    category_id UUID REFERENCES pm_categories(id) ON DELETE SET NULL,
    name VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    price DECIMAL(12, 2),
    price_display VARCHAR(100),
    currency VARCHAR(3) DEFAULT 'USD',
    features TEXT[] DEFAULT '{}',
    benefits TEXT[] DEFAULT '{}',
    images JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'seasonal', 'discontinued', 'draft')),
    is_service BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    is_bestseller BOOLEAN DEFAULT false,
    is_seasonal BOOLEAN DEFAULT false,
    seasonal_start DATE,
    seasonal_end DATE,
    tags TEXT[] DEFAULT '{}',
    external_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Unique constraint per brand (slug must be unique within a brand)
    CONSTRAINT pm_products_brand_slug_unique UNIQUE (brand_id, slug)
);

-- Create indexes for pm_products
CREATE INDEX IF NOT EXISTS idx_pm_products_brand ON pm_products(brand_id);
CREATE INDEX IF NOT EXISTS idx_pm_products_category ON pm_products(category_id);
CREATE INDEX IF NOT EXISTS idx_pm_products_status ON pm_products(status);
CREATE INDEX IF NOT EXISTS idx_pm_products_featured ON pm_products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_pm_products_bestseller ON pm_products(is_bestseller) WHERE is_bestseller = true;
CREATE INDEX IF NOT EXISTS idx_pm_products_seasonal ON pm_products(is_seasonal) WHERE is_seasonal = true;
CREATE INDEX IF NOT EXISTS idx_pm_products_tags ON pm_products USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_pm_products_name_search ON pm_products USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_pm_products_external_id ON pm_products(external_id) WHERE external_id IS NOT NULL;

-- ============================================================================
-- 3. PM_PRODUCT_SOURCES - Track where products were extracted from
-- ============================================================================
CREATE TABLE IF NOT EXISTS pm_product_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES pm_products(id) ON DELETE CASCADE,
    source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('uvp', 'website', 'reviews', 'keywords', 'manual', 'api')),
    source_url TEXT,
    source_data JSONB,
    confidence_score DECIMAL(3, 2) DEFAULT 1.0 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_primary BOOLEAN DEFAULT false
);

-- Create indexes for pm_product_sources
CREATE INDEX IF NOT EXISTS idx_pm_product_sources_product ON pm_product_sources(product_id);
CREATE INDEX IF NOT EXISTS idx_pm_product_sources_type ON pm_product_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_pm_product_sources_primary ON pm_product_sources(product_id) WHERE is_primary = true;

-- ============================================================================
-- 4. PM_PRODUCT_METADATA - Flexible key-value metadata for products
-- ============================================================================
CREATE TABLE IF NOT EXISTS pm_product_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES pm_products(id) ON DELETE CASCADE,
    key VARCHAR(255) NOT NULL,
    value TEXT,
    value_type VARCHAR(50) DEFAULT 'string' CHECK (value_type IN ('string', 'number', 'boolean', 'json', 'date', 'array')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Unique key per product
    CONSTRAINT pm_product_metadata_unique UNIQUE (product_id, key)
);

-- Create indexes for pm_product_metadata
CREATE INDEX IF NOT EXISTS idx_pm_product_metadata_product ON pm_product_metadata(product_id);
CREATE INDEX IF NOT EXISTS idx_pm_product_metadata_key ON pm_product_metadata(key);

-- ============================================================================
-- 5. PM_EXTRACTION_LOGS - Track extraction operations
-- ============================================================================
CREATE TABLE IF NOT EXISTS pm_extraction_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    extraction_type VARCHAR(50) NOT NULL CHECK (extraction_type IN ('uvp', 'website', 'reviews', 'keywords', 'full', 'manual')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    products_found INTEGER DEFAULT 0,
    products_created INTEGER DEFAULT 0,
    products_updated INTEGER DEFAULT 0,
    products_skipped INTEGER DEFAULT 0,
    error_message TEXT,
    error_details JSONB,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for pm_extraction_logs
CREATE INDEX IF NOT EXISTS idx_pm_extraction_logs_brand ON pm_extraction_logs(brand_id);
CREATE INDEX IF NOT EXISTS idx_pm_extraction_logs_status ON pm_extraction_logs(status);
CREATE INDEX IF NOT EXISTS idx_pm_extraction_logs_type ON pm_extraction_logs(extraction_type);
CREATE INDEX IF NOT EXISTS idx_pm_extraction_logs_started ON pm_extraction_logs(started_at DESC);

-- ============================================================================
-- TRIGGERS - Auto-update updated_at timestamps
-- ============================================================================

-- Function to update timestamp
CREATE OR REPLACE FUNCTION pm_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for pm_categories
DROP TRIGGER IF EXISTS pm_categories_updated_at ON pm_categories;
CREATE TRIGGER pm_categories_updated_at
    BEFORE UPDATE ON pm_categories
    FOR EACH ROW
    EXECUTE FUNCTION pm_update_updated_at();

-- Trigger for pm_products
DROP TRIGGER IF EXISTS pm_products_updated_at ON pm_products;
CREATE TRIGGER pm_products_updated_at
    BEFORE UPDATE ON pm_products
    FOR EACH ROW
    EXECUTE FUNCTION pm_update_updated_at();

-- ============================================================================
-- RLS POLICIES - Enable Row Level Security
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE pm_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_product_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_product_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_extraction_logs ENABLE ROW LEVEL SECURITY;

-- Categories are global (shared across brands)
CREATE POLICY "pm_categories_select_all" ON pm_categories
    FOR SELECT USING (true);

CREATE POLICY "pm_categories_insert_authenticated" ON pm_categories
    FOR INSERT WITH CHECK (true);

CREATE POLICY "pm_categories_update_authenticated" ON pm_categories
    FOR UPDATE USING (true);

-- Products are brand-scoped
CREATE POLICY "pm_products_select_all" ON pm_products
    FOR SELECT USING (true);

CREATE POLICY "pm_products_insert" ON pm_products
    FOR INSERT WITH CHECK (true);

CREATE POLICY "pm_products_update" ON pm_products
    FOR UPDATE USING (true);

CREATE POLICY "pm_products_delete" ON pm_products
    FOR DELETE USING (true);

-- Product sources follow product access
CREATE POLICY "pm_product_sources_select" ON pm_product_sources
    FOR SELECT USING (true);

CREATE POLICY "pm_product_sources_insert" ON pm_product_sources
    FOR INSERT WITH CHECK (true);

CREATE POLICY "pm_product_sources_update" ON pm_product_sources
    FOR UPDATE USING (true);

CREATE POLICY "pm_product_sources_delete" ON pm_product_sources
    FOR DELETE USING (true);

-- Product metadata follows product access
CREATE POLICY "pm_product_metadata_select" ON pm_product_metadata
    FOR SELECT USING (true);

CREATE POLICY "pm_product_metadata_insert" ON pm_product_metadata
    FOR INSERT WITH CHECK (true);

CREATE POLICY "pm_product_metadata_update" ON pm_product_metadata
    FOR UPDATE USING (true);

CREATE POLICY "pm_product_metadata_delete" ON pm_product_metadata
    FOR DELETE USING (true);

-- Extraction logs are brand-scoped
CREATE POLICY "pm_extraction_logs_select" ON pm_extraction_logs
    FOR SELECT USING (true);

CREATE POLICY "pm_extraction_logs_insert" ON pm_extraction_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "pm_extraction_logs_update" ON pm_extraction_logs
    FOR UPDATE USING (true);

-- ============================================================================
-- SEED DATA - Default categories
-- ============================================================================

INSERT INTO pm_categories (name, slug, description, display_order, icon, color) VALUES
    ('Products', 'products', 'Physical or digital products', 1, 'package', '#3B82F6'),
    ('Services', 'services', 'Professional services', 2, 'briefcase', '#10B981'),
    ('Subscriptions', 'subscriptions', 'Recurring subscriptions', 3, 'repeat', '#8B5CF6'),
    ('Events', 'events', 'Events and workshops', 4, 'calendar', '#F59E0B'),
    ('Bundles', 'bundles', 'Product bundles and packages', 5, 'layers', '#EC4899')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- COMMENTS - Document the tables
-- ============================================================================

COMMENT ON TABLE pm_categories IS 'Product categories with hierarchical support';
COMMENT ON TABLE pm_products IS 'Main product/service catalog for brands';
COMMENT ON TABLE pm_product_sources IS 'Tracks where products were extracted from';
COMMENT ON TABLE pm_product_metadata IS 'Flexible key-value metadata for products';
COMMENT ON TABLE pm_extraction_logs IS 'Audit log of product extraction operations';
