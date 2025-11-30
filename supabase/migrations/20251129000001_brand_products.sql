-- Brand Products Table
-- Normalized storage for products extracted from UVP or manually added
-- Replaces embedded UVP JSON storage for better queryability

CREATE TABLE IF NOT EXISTS brand_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

  -- Core fields (from UVP ProductService)
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,

  -- Extended fields (from product-centric-marketing)
  product_type TEXT CHECK (product_type IN ('product', 'service', 'hybrid')),
  tier TEXT CHECK (tier IN ('basic', 'premium', 'enterprise', 'custom')),
  priority TEXT CHECK (priority IN ('primary', 'secondary', 'addon')),
  price_range TEXT,
  duration_minutes INTEGER,
  features JSONB DEFAULT '[]'::jsonb,

  -- Extraction metadata
  source TEXT CHECK (source IN ('website', 'manual', 'rescan', 'uvp')),
  source_url TEXT,
  source_excerpt TEXT,
  confidence DECIMAL(3,2) DEFAULT 0.0,
  is_confirmed BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_scanned_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_brand_products_brand_id ON brand_products(brand_id);
CREATE INDEX idx_brand_products_priority ON brand_products(priority);
CREATE INDEX idx_brand_products_source ON brand_products(source);

-- RLS
ALTER TABLE brand_products ENABLE ROW LEVEL SECURITY;

-- RLS policies must handle both:
-- 1. Authenticated users with brands they own (user_id = auth.uid())
-- 2. Unauthenticated onboarding brands (user_id IS NULL)
-- Pattern matches 20251120000001_allow_unauthenticated_brands.sql

CREATE POLICY "Users can view own brand products"
  ON brand_products FOR SELECT
  TO public
  USING (
    brand_id IN (
      SELECT id FROM brands
      WHERE user_id = auth.uid()
         OR user_id IS NULL
    )
  );

CREATE POLICY "Users can insert own brand products"
  ON brand_products FOR INSERT
  TO public
  WITH CHECK (
    brand_id IN (
      SELECT id FROM brands
      WHERE user_id = auth.uid()
         OR user_id IS NULL
    )
  );

CREATE POLICY "Users can update own brand products"
  ON brand_products FOR UPDATE
  TO public
  USING (
    brand_id IN (
      SELECT id FROM brands
      WHERE user_id = auth.uid()
         OR user_id IS NULL
    )
  );

CREATE POLICY "Users can delete own brand products"
  ON brand_products FOR DELETE
  TO public
  USING (
    brand_id IN (
      SELECT id FROM brands
      WHERE user_id = auth.uid()
         OR user_id IS NULL
    )
  );

-- Grant permissions to all roles (required for PostgREST)
GRANT ALL ON brand_products TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_brand_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER brand_products_updated_at
  BEFORE UPDATE ON brand_products
  FOR EACH ROW
  EXECUTE FUNCTION update_brand_products_updated_at();
