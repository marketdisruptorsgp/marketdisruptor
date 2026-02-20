
-- Add analysis type and raw analysis data columns to saved_analyses
ALTER TABLE public.saved_analyses
  ADD COLUMN IF NOT EXISTS analysis_type text NOT NULL DEFAULT 'product',
  ADD COLUMN IF NOT EXISTS analysis_data jsonb;
