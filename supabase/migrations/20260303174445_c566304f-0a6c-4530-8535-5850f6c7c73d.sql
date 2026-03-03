CREATE TABLE public.interrogation_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL,
  user_id UUID NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  applied_revisions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique per user+analysis
CREATE UNIQUE INDEX idx_interrogation_user_analysis ON public.interrogation_conversations (user_id, analysis_id);

-- RLS
ALTER TABLE public.interrogation_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own interrogation conversations"
  ON public.interrogation_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interrogation conversations"
  ON public.interrogation_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interrogation conversations"
  ON public.interrogation_conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interrogation conversations"
  ON public.interrogation_conversations FOR DELETE
  USING (auth.uid() = user_id);