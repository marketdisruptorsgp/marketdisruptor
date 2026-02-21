
-- Track analysis usage per user
CREATE TABLE public.user_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  analysis_count INTEGER NOT NULL DEFAULT 0,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT date_trunc('month', now()),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, period_start)
);

-- Enable RLS
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage"
ON public.user_usage FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage"
ON public.user_usage FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage"
ON public.user_usage FOR UPDATE
USING (auth.uid() = user_id);

-- Function to increment usage and return current count
CREATE OR REPLACE FUNCTION public.increment_usage(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count INTEGER;
  current_period TIMESTAMP WITH TIME ZONE := date_trunc('month', now());
BEGIN
  INSERT INTO public.user_usage (user_id, analysis_count, period_start)
  VALUES (p_user_id, 1, current_period)
  ON CONFLICT (user_id, period_start)
  DO UPDATE SET analysis_count = user_usage.analysis_count + 1, updated_at = now()
  RETURNING analysis_count INTO current_count;
  
  RETURN current_count;
END;
$$;
