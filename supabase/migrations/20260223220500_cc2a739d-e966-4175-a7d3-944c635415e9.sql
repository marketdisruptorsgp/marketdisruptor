
-- Real patent filings scraped from USPTO/Google Patents
CREATE TABLE public.patent_filings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  assignee TEXT,
  filing_date DATE,
  publication_date DATE,
  patent_number TEXT,
  category TEXT NOT NULL,
  abstract TEXT,
  source_url TEXT,
  scraped_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_patent_filings_category ON public.patent_filings (category);
CREATE INDEX idx_patent_filings_filing_date ON public.patent_filings (filing_date DESC);
CREATE INDEX idx_patent_filings_assignee ON public.patent_filings (assignee);

ALTER TABLE public.patent_filings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patent filings are publicly readable"
  ON public.patent_filings FOR SELECT USING (true);

CREATE POLICY "Service role inserts patent filings"
  ON public.patent_filings FOR INSERT WITH CHECK (false);

-- Real Google Trends data scraped via Firecrawl
CREATE TABLE public.trend_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword TEXT NOT NULL,
  category TEXT NOT NULL,
  interest_over_time JSONB DEFAULT '[]',
  related_queries JSONB DEFAULT '[]',
  source TEXT DEFAULT 'google_trends',
  scraped_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_trend_signals_category ON public.trend_signals (category);
CREATE INDEX idx_trend_signals_scraped_at ON public.trend_signals (scraped_at DESC);

ALTER TABLE public.trend_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trend signals are publicly readable"
  ON public.trend_signals FOR SELECT USING (true);

CREATE POLICY "Service role inserts trend signals"
  ON public.trend_signals FOR INSERT WITH CHECK (false);

-- Platform usage analytics (aggregated from saved_analyses)
CREATE TABLE public.platform_intel (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_platform_intel_metric ON public.platform_intel (metric_type);

ALTER TABLE public.platform_intel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform intel is publicly readable"
  ON public.platform_intel FOR SELECT USING (true);

CREATE POLICY "Service role inserts platform intel"
  ON public.platform_intel FOR INSERT WITH CHECK (false);
