-- Design Studio Enhancements
-- Adds missing fields and updates existing tables for complete Design Studio functionality

-- Update design_templates table to match Design Studio requirements
ALTER TABLE design_templates
  ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS width INTEGER NOT NULL DEFAULT 1080,
  ADD COLUMN IF NOT EXISTS height INTEGER NOT NULL DEFAULT 1080,
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update category constraint to match Design Studio categories
ALTER TABLE design_templates DROP CONSTRAINT IF EXISTS design_templates_category_check;
ALTER TABLE design_templates ADD CONSTRAINT design_templates_category_check
  CHECK (category IN ('Social Post', 'Story', 'Ad', 'Banner', 'Thumbnail', 'Infographic'));

-- Rename canvas_data to design_data for consistency
ALTER TABLE design_templates RENAME COLUMN canvas_data TO design_data;

-- Rename thumbnail_url to thumbnail for consistency
ALTER TABLE design_templates RENAME COLUMN thumbnail_url TO thumbnail;

-- Add index on brand_id
CREATE INDEX IF NOT EXISTS idx_design_templates_brand ON design_templates(brand_id);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_design_templates_updated_at ON design_templates;
CREATE TRIGGER update_design_templates_updated_at
  BEFORE UPDATE ON design_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update RLS policies to include brand_id
DROP POLICY IF EXISTS "Public templates are viewable by all" ON design_templates;
DROP POLICY IF EXISTS "Users can create their own templates" ON design_templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON design_templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON design_templates;

CREATE POLICY "Users can view public and their own brand templates"
  ON design_templates FOR SELECT
  USING (
    is_public = true OR
    created_by = auth.uid() OR
    brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create templates for their brands"
  ON design_templates FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    (brand_id IS NULL OR brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()))
  );

CREATE POLICY "Users can update their own templates"
  ON design_templates FOR UPDATE
  USING (
    created_by = auth.uid() OR
    brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete their own templates"
  ON design_templates FOR DELETE
  USING (
    created_by = auth.uid() OR
    brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
  );

-- Ensure content_calendar_items has media_urls array (if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar_items'
    AND column_name = 'media_urls'
  ) THEN
    ALTER TABLE content_calendar_items ADD COLUMN media_urls TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- Ensure content_calendar_items has hashtags array (if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar_items'
    AND column_name = 'hashtags'
  ) THEN
    ALTER TABLE content_calendar_items ADD COLUMN hashtags TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- Create storage buckets for design assets (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('content-images', 'content-images', true),
  ('brand-assets', 'brand-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for content-images bucket
CREATE POLICY IF NOT EXISTS "Users can upload content images for their brands"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'content-images' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM brands WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can view content images for their brands"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'content-images' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM brands WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can delete content images for their brands"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'content-images' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM brands WHERE user_id = auth.uid()
    )
  );

-- Storage policies for brand-assets bucket
CREATE POLICY IF NOT EXISTS "Users can upload brand assets for their brands"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'brand-assets' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM brands WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can view brand assets for their brands"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'brand-assets' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM brands WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can delete brand assets for their brands"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'brand-assets' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM brands WHERE user_id = auth.uid()
    )
  );

-- Add public access to both buckets for public URLs
CREATE POLICY IF NOT EXISTS "Public can view content images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'content-images');

CREATE POLICY IF NOT EXISTS "Public can view brand assets"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'brand-assets');

-- Comment on tables
COMMENT ON TABLE design_templates IS 'Design templates for the Design Studio visual content creation tool';
COMMENT ON COLUMN design_templates.design_data IS 'Fabric.js canvas JSON representation of the template design';
COMMENT ON COLUMN design_templates.width IS 'Template canvas width in pixels';
COMMENT ON COLUMN design_templates.height IS 'Template canvas height in pixels';
COMMENT ON COLUMN design_templates.is_premium IS 'Whether this is a premium template requiring subscription';
COMMENT ON COLUMN design_templates.is_custom IS 'Whether this is a user-created custom template';
COMMENT ON COLUMN design_templates.tags IS 'Array of tags for template discovery';

COMMENT ON COLUMN content_calendar_items.design_data IS 'Design Studio canvas data for visual editing and re-export';
COMMENT ON COLUMN content_calendar_items.image_url IS 'Primary image URL for the content (deprecated - use media_urls)';
COMMENT ON COLUMN content_calendar_items.media_urls IS 'Array of media URLs (images, videos) for the content';
