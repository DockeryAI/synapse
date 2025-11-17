-- ============================================================================
-- GMB + Social Commerce Integration Tables
-- Created: 2025-01-17
-- Description: Google My Business, Instagram Shopping, Facebook Shop
-- ============================================================================

-- ============================================================================
-- GMB TABLES
-- ============================================================================

-- GMB Connections (OAuth tokens and account info)
CREATE TABLE IF NOT EXISTS gmb_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  account_name TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ NOT NULL,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_synced TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'disconnected')),
  locations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, account_id)
);

-- GMB Posting Schedules
CREATE TABLE IF NOT EXISTS gmb_posting_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'twice_weekly' CHECK (frequency IN ('daily', 'twice_weekly', 'weekly', 'custom')),
  days_of_week INTEGER[] DEFAULT ARRAY[2, 5], -- Tuesday and Friday
  time_of_day TEXT DEFAULT '10:00', -- HH:MM format
  post_type_rotation TEXT[] DEFAULT ARRAY['UPDATE', 'OFFER', 'EVENT', 'UPDATE'],
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, location_id)
);

-- GMB Scheduled Posts
CREATE TABLE IF NOT EXISTS gmb_scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  post_type TEXT NOT NULL CHECK (post_type IN ('UPDATE', 'OFFER', 'EVENT', 'PRODUCT')),
  content JSONB NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'failed', 'cancelled')),
  published_at TIMESTAMPTZ,
  gmb_post_name TEXT, -- Resource name from GMB API
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for scheduled posts query
CREATE INDEX IF NOT EXISTS idx_gmb_scheduled_posts_status_scheduled
ON gmb_scheduled_posts(status, scheduled_for)
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_gmb_scheduled_posts_location
ON gmb_scheduled_posts(location_id);

-- ============================================================================
-- INSTAGRAM SHOPPING TABLES
-- ============================================================================

-- Instagram Shop Setup
CREATE TABLE IF NOT EXISTS instagram_shop_setup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instagram_business_account_id TEXT NOT NULL,
  catalog_id TEXT NOT NULL,
  shop_status TEXT NOT NULL DEFAULT 'pending' CHECK (shop_status IN ('pending', 'approved', 'rejected', 'disabled')),
  review_status JSONB, -- {status, reasons[]}
  product_count INTEGER DEFAULT 0,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_synced TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id)
);

-- ============================================================================
-- FACEBOOK SHOP TABLES
-- ============================================================================

-- Facebook Shop Setup
CREATE TABLE IF NOT EXISTS facebook_shop_setup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  facebook_page_id TEXT NOT NULL,
  catalog_id TEXT NOT NULL,
  commerce_account_id TEXT,
  shop_status TEXT NOT NULL DEFAULT 'pending' CHECK (shop_status IN ('pending', 'active', 'rejected', 'disabled')),
  storefront_url TEXT,
  marketplace_enabled BOOLEAN NOT NULL DEFAULT false,
  checkout_enabled BOOLEAN NOT NULL DEFAULT false,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_synced TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id)
);

-- ============================================================================
-- UNIFIED PRODUCT CATALOG (shared between Instagram and Facebook)
-- ============================================================================

-- Product Catalogs (can be shared between IG and FB)
CREATE TABLE IF NOT EXISTS product_catalogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  facebook_catalog_id TEXT UNIQUE, -- ID from Facebook/Instagram API
  name TEXT NOT NULL,
  vertical TEXT NOT NULL DEFAULT 'commerce' CHECK (vertical IN ('commerce', 'home_listings', 'media', 'travel', 'vehicle')),
  product_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'syncing')),
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, name)
);

-- Catalog Product Sync Status (tracks which internal products are synced)
CREATE TABLE IF NOT EXISTS catalog_product_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id UUID NOT NULL REFERENCES product_catalogs(id) ON DELETE CASCADE,
  internal_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  facebook_product_id TEXT, -- ID from Facebook catalog
  sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed', 'out_of_sync')),
  last_synced_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(catalog_id, internal_product_id)
);

CREATE INDEX IF NOT EXISTS idx_catalog_sync_status
ON catalog_product_sync(catalog_id, sync_status);

-- ============================================================================
-- SHOPPABLE POSTS TRACKING
-- ============================================================================

-- Track which posts have product tags
CREATE TABLE IF NOT EXISTS shoppable_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook')),
  post_id TEXT NOT NULL, -- Platform post ID
  media_id TEXT, -- Instagram media ID
  product_tags JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{product_id, x, y}]
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(platform, post_id)
);

CREATE INDEX IF NOT EXISTS idx_shoppable_posts_user
ON shoppable_posts(user_id, platform);

-- ============================================================================
-- SOCIAL COMMERCE ANALYTICS
-- ============================================================================

-- Product performance tracking (views, clicks, purchases)
CREATE TABLE IF NOT EXISTS product_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  facebook_product_id TEXT,
  date DATE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'marketplace')),
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(product_id, date, platform)
);

CREATE INDEX IF NOT EXISTS idx_product_performance_user_date
ON product_performance(user_id, date DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE gmb_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmb_posting_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmb_scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_shop_setup ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_shop_setup ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_catalogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_product_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE shoppable_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_performance ENABLE ROW LEVEL SECURITY;

-- GMB Connections policies
CREATE POLICY "Users can view own GMB connections" ON gmb_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own GMB connections" ON gmb_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own GMB connections" ON gmb_connections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own GMB connections" ON gmb_connections
  FOR DELETE USING (auth.uid() = user_id);

-- GMB Posting Schedules policies
CREATE POLICY "Users can view own GMB schedules" ON gmb_posting_schedules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own GMB schedules" ON gmb_posting_schedules
  FOR ALL USING (auth.uid() = user_id);

-- GMB Scheduled Posts policies
CREATE POLICY "Users can view own GMB posts" ON gmb_scheduled_posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own GMB posts" ON gmb_scheduled_posts
  FOR ALL USING (auth.uid() = user_id);

-- Instagram Shop policies
CREATE POLICY "Users can view own Instagram shop" ON instagram_shop_setup
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own Instagram shop" ON instagram_shop_setup
  FOR ALL USING (auth.uid() = user_id);

-- Facebook Shop policies
CREATE POLICY "Users can view own Facebook shop" ON facebook_shop_setup
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own Facebook shop" ON facebook_shop_setup
  FOR ALL USING (auth.uid() = user_id);

-- Product Catalogs policies
CREATE POLICY "Users can view own catalogs" ON product_catalogs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own catalogs" ON product_catalogs
  FOR ALL USING (auth.uid() = user_id);

-- Catalog Sync policies
CREATE POLICY "Users can view own catalog sync" ON catalog_product_sync
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM product_catalogs
      WHERE product_catalogs.id = catalog_product_sync.catalog_id
      AND product_catalogs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own catalog sync" ON catalog_product_sync
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM product_catalogs
      WHERE product_catalogs.id = catalog_product_sync.catalog_id
      AND product_catalogs.user_id = auth.uid()
    )
  );

-- Shoppable Posts policies
CREATE POLICY "Users can view own shoppable posts" ON shoppable_posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own shoppable posts" ON shoppable_posts
  FOR ALL USING (auth.uid() = user_id);

-- Product Performance policies
CREATE POLICY "Users can view own product performance" ON product_performance
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own product performance" ON product_performance
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_gmb_connections_updated_at BEFORE UPDATE ON gmb_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gmb_posting_schedules_updated_at BEFORE UPDATE ON gmb_posting_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gmb_scheduled_posts_updated_at BEFORE UPDATE ON gmb_scheduled_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instagram_shop_setup_updated_at BEFORE UPDATE ON instagram_shop_setup
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facebook_shop_setup_updated_at BEFORE UPDATE ON facebook_shop_setup
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_catalogs_updated_at BEFORE UPDATE ON product_catalogs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_catalog_product_sync_updated_at BEFORE UPDATE ON catalog_product_sync
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shoppable_posts_updated_at BEFORE UPDATE ON shoppable_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_performance_updated_at BEFORE UPDATE ON product_performance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE gmb_connections IS 'Google My Business OAuth connections and account info';
COMMENT ON TABLE gmb_posting_schedules IS 'Automated posting schedules for GMB locations';
COMMENT ON TABLE gmb_scheduled_posts IS 'Queue of scheduled GMB posts';
COMMENT ON TABLE instagram_shop_setup IS 'Instagram Shopping configuration per user';
COMMENT ON TABLE facebook_shop_setup IS 'Facebook Shop configuration per user';
COMMENT ON TABLE product_catalogs IS 'Product catalogs (shared between IG and FB)';
COMMENT ON TABLE catalog_product_sync IS 'Tracks sync status between internal products and Facebook catalog';
COMMENT ON TABLE shoppable_posts IS 'Posts with product tags on Instagram/Facebook';
COMMENT ON TABLE product_performance IS 'Product performance metrics from social commerce';

-- ============================================================================
-- END MIGRATION
-- ============================================================================
