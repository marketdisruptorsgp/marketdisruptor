
-- Create saved_analyses table to persist product intelligence runs
CREATE TABLE public.saved_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  era TEXT NOT NULL,
  audience TEXT NOT NULL,
  batch_size INTEGER NOT NULL DEFAULT 5,
  products JSONB NOT NULL DEFAULT '[]'::jsonb,
  product_count INTEGER NOT NULL DEFAULT 0,
  avg_revival_score NUMERIC(4,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- No auth required — public analyses (no user accounts in this app)
ALTER TABLE public.saved_analyses ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read and write analyses (public tool, no auth)
CREATE POLICY "Anyone can read analyses"
  ON public.saved_analyses FOR SELECT USING (true);

CREATE POLICY "Anyone can insert analyses"
  ON public.saved_analyses FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can delete analyses"
  ON public.saved_analyses FOR DELETE USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_saved_analyses_updated_at
  BEFORE UPDATE ON public.saved_analyses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
