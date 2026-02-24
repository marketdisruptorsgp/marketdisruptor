
CREATE TABLE public.portfolio_action_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  analysis_id uuid,
  text text NOT NULL,
  notes text,
  position integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolio_action_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select their own action items"
  ON public.portfolio_action_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own action items"
  ON public.portfolio_action_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own action items"
  ON public.portfolio_action_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own action items"
  ON public.portfolio_action_items FOR DELETE USING (auth.uid() = user_id);
