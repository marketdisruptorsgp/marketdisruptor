
CREATE TABLE public.tool_scenarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID NOT NULL,
  user_id UUID NOT NULL,
  tool_id TEXT NOT NULL,
  scenario_name TEXT NOT NULL DEFAULT 'Untitled Scenario',
  inputs JSONB NOT NULL DEFAULT '{}'::jsonb,
  outputs JSONB NOT NULL DEFAULT '{}'::jsonb,
  strategic_impact TEXT NOT NULL DEFAULT 'medium',
  confidence_score NUMERIC NOT NULL DEFAULT 0.85,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tool_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own scenarios"
  ON public.tool_scenarios FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own scenarios"
  ON public.tool_scenarios FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own scenarios"
  ON public.tool_scenarios FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scenarios"
  ON public.tool_scenarios FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
