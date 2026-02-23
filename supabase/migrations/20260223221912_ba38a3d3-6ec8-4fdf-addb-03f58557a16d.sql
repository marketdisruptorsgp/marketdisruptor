
-- Create market_news table for scraped industry news
CREATE TABLE public.market_news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  source_name TEXT NOT NULL,
  source_url TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  published_at TIMESTAMP WITH TIME ZONE,
  scraped_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (public read)
ALTER TABLE public.market_news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Market news is publicly readable"
  ON public.market_news FOR SELECT USING (true);

-- Add status column to patent_filings for expired tracking
ALTER TABLE public.patent_filings 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Schedule market news scraper daily at 8 AM UTC
SELECT cron.schedule(
  'scrape-market-news-daily',
  '0 8 * * *',
  $$SELECT net.http_post(
    url := 'https://vocwbcoocohezvzmjald.supabase.co/functions/v1/scrape-market-news',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvY3diY29vY29oZXp2em1qYWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NjU0MTIsImV4cCI6MjA4NzA0MTQxMn0.q4zYF9jlJRLNL-pVl9s74Df9pUosGmIUmzGmMQ1Pd_A"}'::jsonb,
    body := '{}'::jsonb
  );$$
);
