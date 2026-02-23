
-- Market intel data table for AI-generated daily insights
CREATE TABLE public.market_intel (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data_type TEXT NOT NULL, -- 'trend_spotlights', 'disruption_signals', 'category_metrics', 'radar_data'
  payload JSONB NOT NULL DEFAULT '{}',
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast lookups by type
CREATE INDEX idx_market_intel_data_type ON public.market_intel (data_type);
CREATE INDEX idx_market_intel_generated_at ON public.market_intel (generated_at DESC);

-- Public read access (intel is public content)
ALTER TABLE public.market_intel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Market intel is publicly readable"
  ON public.market_intel
  FOR SELECT
  USING (true);

-- Only service role can insert/update (via edge function)
CREATE POLICY "Only service role can insert market intel"
  ON public.market_intel
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Only service role can update market intel"
  ON public.market_intel
  FOR UPDATE
  USING (false);

CREATE POLICY "Only service role can delete market intel"
  ON public.market_intel
  FOR DELETE
  USING (false);
