
-- Add last_seen_at to profiles for "Market Changed" notifications
ALTER TABLE public.profiles
ADD COLUMN last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create user_streaks table for gamification
CREATE TABLE public.user_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  analysis_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Enable RLS
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own streaks"
ON public.user_streaks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streaks"
ON public.user_streaks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks"
ON public.user_streaks FOR UPDATE
USING (auth.uid() = user_id);

-- Function to upsert streak on analysis completion
CREATE OR REPLACE FUNCTION public.upsert_user_streak(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.user_streaks (user_id, week_start, analysis_count)
  VALUES (p_user_id, date_trunc('week', CURRENT_DATE)::date, 1)
  ON CONFLICT (user_id, week_start)
  DO UPDATE SET analysis_count = user_streaks.analysis_count + 1, updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to update last_seen_at
CREATE OR REPLACE FUNCTION public.update_last_seen(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles SET last_seen_at = now() WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
