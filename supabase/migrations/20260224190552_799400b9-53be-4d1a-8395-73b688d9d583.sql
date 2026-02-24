ALTER TABLE public.trend_signals ADD COLUMN IF NOT EXISTS opportunity_angle TEXT;
ALTER TABLE public.trend_signals ADD COLUMN IF NOT EXISTS source_urls TEXT[];
ALTER TABLE public.trend_signals ADD COLUMN IF NOT EXISTS data_quality TEXT DEFAULT 'medium';