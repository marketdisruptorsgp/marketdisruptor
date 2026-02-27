
-- Create user_lenses table
CREATE TABLE public.user_lenses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  primary_objective text,
  target_outcome text,
  risk_tolerance text,
  time_horizon text,
  available_resources text,
  constraints text,
  evaluation_priorities jsonb DEFAULT '{"feasibility": 0.25, "desirability": 0.25, "profitability": 0.25, "novelty": 0.25}'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_lenses ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own lenses"
  ON public.user_lenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lenses"
  ON public.user_lenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lenses"
  ON public.user_lenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lenses"
  ON public.user_lenses FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE TRIGGER update_user_lenses_updated_at
  BEFORE UPDATE ON public.user_lenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
