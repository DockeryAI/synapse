/**
 * Buyer Journey Tables
 * Stores customer journey maps with ICP, JTBD, touchpoints, pain points, and opportunities
 */

-- Create buyer_journeys table
CREATE TABLE IF NOT EXISTS public.buyer_journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,

  -- Journey Map Data (stored as JSONB for flexibility)
  journey_map JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Completion status
  is_complete BOOLEAN NOT NULL DEFAULT false,
  completed_steps TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index on brand_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_buyer_journeys_brand_id ON public.buyer_journeys(brand_id);

-- Create index on is_complete for filtering
CREATE INDEX IF NOT EXISTS idx_buyer_journeys_is_complete ON public.buyer_journeys(is_complete);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_buyer_journeys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_buyer_journeys_updated_at
  BEFORE UPDATE ON public.buyer_journeys
  FOR EACH ROW
  EXECUTE FUNCTION update_buyer_journeys_updated_at();

-- Row Level Security (RLS)
ALTER TABLE public.buyer_journeys ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read buyer journeys for brands they own
CREATE POLICY "Users can read own buyer journeys"
  ON public.buyer_journeys
  FOR SELECT
  USING (
    brand_id IN (
      SELECT id FROM public.brands WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert buyer journeys for brands they own
CREATE POLICY "Users can insert own buyer journeys"
  ON public.buyer_journeys
  FOR INSERT
  WITH CHECK (
    brand_id IN (
      SELECT id FROM public.brands WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update buyer journeys for brands they own
CREATE POLICY "Users can update own buyer journeys"
  ON public.buyer_journeys
  FOR UPDATE
  USING (
    brand_id IN (
      SELECT id FROM public.brands WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    brand_id IN (
      SELECT id FROM public.brands WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete buyer journeys for brands they own
CREATE POLICY "Users can delete own buyer journeys"
  ON public.buyer_journeys
  FOR DELETE
  USING (
    brand_id IN (
      SELECT id FROM public.brands WHERE user_id = auth.uid()
    )
  );

-- Add comment to table
COMMENT ON TABLE public.buyer_journeys IS 'Stores customer journey maps with ICP, JTBD, touchpoints, pain points, and opportunities';

-- Add comments to columns
COMMENT ON COLUMN public.buyer_journeys.journey_map IS 'Complete journey map data stored as JSONB including ICP, jobs analysis, stages, touchpoints, pain points, and opportunities';
COMMENT ON COLUMN public.buyer_journeys.is_complete IS 'Whether the journey map wizard has been fully completed';
COMMENT ON COLUMN public.buyer_journeys.completed_steps IS 'Array of wizard step names that have been completed';
