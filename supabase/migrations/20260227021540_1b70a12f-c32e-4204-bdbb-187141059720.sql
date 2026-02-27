
-- Create storage bucket for photo uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('analysis-photos', 'analysis-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload photos (anonymous + authenticated)
CREATE POLICY "Anyone can upload analysis photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'analysis-photos');

-- Allow anyone to read analysis photos
CREATE POLICY "Anyone can read analysis photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'analysis-photos');

-- Allow users to delete their own photos
CREATE POLICY "Users can delete their own analysis photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'analysis-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add analysis_depth column to saved_analyses
ALTER TABLE public.saved_analyses
ADD COLUMN IF NOT EXISTS analysis_depth text NOT NULL DEFAULT 'quick';

-- Add is_anonymous flag to saved_analyses for device-based users
ALTER TABLE public.saved_analyses
ADD COLUMN IF NOT EXISTS is_anonymous boolean NOT NULL DEFAULT false;

-- Update RLS on saved_analyses to allow anonymous users to save
DROP POLICY IF EXISTS "Users can read their own analyses" ON public.saved_analyses;
CREATE POLICY "Users can read their own analyses"
ON public.saved_analyses FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own analyses" ON public.saved_analyses;
CREATE POLICY "Users can insert their own analyses"
ON public.saved_analyses FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own analyses" ON public.saved_analyses;
CREATE POLICY "Users can update their own analyses"
ON public.saved_analyses FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own analyses" ON public.saved_analyses;
CREATE POLICY "Users can delete their own analyses"
ON public.saved_analyses FOR DELETE
USING (auth.uid() = user_id);
