
-- API Keys table
CREATE TABLE public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'My API Key',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own api keys"
  ON public.api_keys FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own api keys"
  ON public.api_keys FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own api keys"
  ON public.api_keys FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own api keys"
  ON public.api_keys FOR DELETE
  USING (auth.uid()::text = user_id);

-- Webhooks table
CREATE TABLE public.webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT ARRAY['analysis.completed'],
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own webhooks"
  ON public.webhooks FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own webhooks"
  ON public.webhooks FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own webhooks"
  ON public.webhooks FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own webhooks"
  ON public.webhooks FOR DELETE
  USING (auth.uid()::text = user_id);
