
-- Analytics sessions table
CREATE TABLE public.analytics_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_active_at timestamptz NOT NULL DEFAULT now(),
  device_type text,
  viewport_width int,
  viewport_height int,
  user_agent_hash text,
  is_returning boolean DEFAULT false,
  referrer text,
  landing_page text,
  page_count int DEFAULT 1,
  total_duration_ms int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_sessions_session_id ON public.analytics_sessions(session_id);
CREATE INDEX idx_analytics_sessions_started_at ON public.analytics_sessions(started_at DESC);

-- Analytics events table (high-resolution behavioral events)
CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  event_type text NOT NULL, -- view, click, scroll, focus, abandon, convert, rage_click, dead_click, hesitation, navigation
  element_id text,
  section_id text,
  page_path text,
  timestamp timestamptz NOT NULL DEFAULT now(),
  time_on_section_ms int,
  scroll_percent int,
  device_type text,
  viewport_width int,
  viewport_height int,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_events_session ON public.analytics_events(session_id);
CREATE INDEX idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_events_timestamp ON public.analytics_events(timestamp DESC);
CREATE INDEX idx_analytics_events_section ON public.analytics_events(section_id);
CREATE INDEX idx_analytics_events_page ON public.analytics_events(page_path);

-- Computed insights (cached analysis results)
CREATE TABLE public.analytics_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type text NOT NULL, -- friction_zone, engagement_score, conversion_funnel, top_path, device_comparison, section_ranking, ux_recommendation
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  computed_at timestamptz NOT NULL DEFAULT now(),
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_insights_type ON public.analytics_insights(insight_type);
CREATE INDEX idx_analytics_insights_computed ON public.analytics_insights(computed_at DESC);

-- Admin access table (owner-only tokens)
CREATE TABLE public.analytics_admin_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL,
  label text DEFAULT 'default',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  last_used_at timestamptz
);

-- Enable RLS on all tables
ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_admin_tokens ENABLE ROW LEVEL SECURITY;

-- Events: public insert (anonymous tracking), no public read
CREATE POLICY "Anyone can insert events" ON public.analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "No public read on events" ON public.analytics_events FOR SELECT USING (false);
CREATE POLICY "No public update on events" ON public.analytics_events FOR UPDATE USING (false);
CREATE POLICY "No public delete on events" ON public.analytics_events FOR DELETE USING (false);

-- Sessions: public insert, no public read
CREATE POLICY "Anyone can insert sessions" ON public.analytics_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update sessions" ON public.analytics_sessions FOR UPDATE USING (true);
CREATE POLICY "No public read on sessions" ON public.analytics_sessions FOR SELECT USING (false);
CREATE POLICY "No public delete on sessions" ON public.analytics_sessions FOR DELETE USING (false);

-- Insights: no public access
CREATE POLICY "No public access to insights" ON public.analytics_insights FOR ALL USING (false);

-- Admin tokens: no public access
CREATE POLICY "No public access to admin tokens" ON public.analytics_admin_tokens FOR ALL USING (false);
