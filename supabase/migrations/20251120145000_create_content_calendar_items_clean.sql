-- Create content_calendar_items table
CREATE TABLE IF NOT EXISTS public.content_calendar_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  platform VARCHAR(50) NOT NULL,
  content_type VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  scheduled_for TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  ai_score INTEGER,
  tags TEXT[],
  media_urls TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,

  -- Indexes for performance
  CONSTRAINT valid_platform CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'twitter', 'tiktok', 'blog', 'email')),
  CONSTRAINT valid_status CHECK (status IN ('draft', 'scheduled', 'published', 'failed', 'archived'))
);

-- Create indexes
CREATE INDEX idx_calendar_brand_id ON public.content_calendar_items(brand_id);
CREATE INDEX idx_calendar_scheduled_for ON public.content_calendar_items(scheduled_for);
CREATE INDEX idx_calendar_status ON public.content_calendar_items(status);
CREATE INDEX idx_calendar_platform ON public.content_calendar_items(platform);

-- Enable Row Level Security
ALTER TABLE public.content_calendar_items ENABLE ROW LEVEL SECURITY;

-- Create policies for content_calendar_items
-- Allow users to see their own content items
CREATE POLICY "Users can view their own content items" ON public.content_calendar_items
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    (
      -- User owns the brand
      brand_id IN (
        SELECT id FROM public.brands
        WHERE user_id = auth.uid()
      )
      -- Or user created the content
      OR created_by = auth.uid()
    )
  );

-- Allow users to create content for their brands
CREATE POLICY "Users can create content for their brands" ON public.content_calendar_items
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    brand_id IN (
      SELECT id FROM public.brands
      WHERE user_id = auth.uid()
    )
  );

-- Allow users to update their own content
CREATE POLICY "Users can update their own content" ON public.content_calendar_items
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    (
      brand_id IN (
        SELECT id FROM public.brands
        WHERE user_id = auth.uid()
      )
      OR created_by = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (
      brand_id IN (
        SELECT id FROM public.brands
        WHERE user_id = auth.uid()
      )
      OR created_by = auth.uid()
    )
  );

-- Allow users to delete their own content
CREATE POLICY "Users can delete their own content" ON public.content_calendar_items
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND
    (
      brand_id IN (
        SELECT id FROM public.brands
        WHERE user_id = auth.uid()
      )
      OR created_by = auth.uid()
    )
  );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_content_calendar_items_updated_at
  BEFORE UPDATE ON public.content_calendar_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();