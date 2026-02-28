
-- Add unique constraint on session_id for upsert support
ALTER TABLE public.analytics_sessions ADD CONSTRAINT analytics_sessions_session_id_key UNIQUE (session_id);
