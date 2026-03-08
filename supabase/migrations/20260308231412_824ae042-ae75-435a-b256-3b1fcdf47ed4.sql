
-- ============================================================
-- 1. MARKETS
-- ============================================================
CREATE TABLE public.markets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  canonical_slug text NOT NULL UNIQUE,
  geography text,
  industry_vertical text,
  description text,
  market_size_estimate text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Markets are publicly readable"
  ON public.markets FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert markets"
  ON public.markets FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "No public update on markets"
  ON public.markets FOR UPDATE
  USING (false);

CREATE POLICY "No public delete on markets"
  ON public.markets FOR DELETE
  USING (false);

-- ============================================================
-- 2. MARKET SIGNALS
-- ============================================================
CREATE TABLE public.market_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id uuid NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  analysis_id uuid REFERENCES public.saved_analyses(id) ON DELETE SET NULL,
  fragmentation_index numeric,
  margin_distribution numeric,
  pricing_model_age numeric,
  productizability_score numeric,
  asset_intensity_score numeric,
  ownership_demographics_score numeric,
  distribution_control_score numeric,
  raw_evidence jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.market_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Market signals are publicly readable"
  ON public.market_signals FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert market signals"
  ON public.market_signals FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "No public update on market signals"
  ON public.market_signals FOR UPDATE
  USING (false);

CREATE POLICY "No public delete on market signals"
  ON public.market_signals FOR DELETE
  USING (false);

-- ============================================================
-- 3. OPPORTUNITY ZONES
-- ============================================================
CREATE TABLE public.opportunity_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id uuid NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  signal_id uuid REFERENCES public.market_signals(id) ON DELETE SET NULL,
  archetype text NOT NULL,
  signal_strength numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'emerging',
  description text,
  contributing_signals jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.opportunity_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Opportunity zones are publicly readable"
  ON public.opportunity_zones FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert opportunity zones"
  ON public.opportunity_zones FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "No public update on opportunity zones"
  ON public.opportunity_zones FOR UPDATE
  USING (false);

CREATE POLICY "No public delete on opportunity zones"
  ON public.opportunity_zones FOR DELETE
  USING (false);

-- ============================================================
-- 4. CONCEPTS
-- ============================================================
CREATE TABLE public.concepts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  analysis_id uuid REFERENCES public.saved_analyses(id) ON DELETE SET NULL,
  opportunity_zone_id uuid REFERENCES public.opportunity_zones(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  domain text,
  concept_type text,
  structural_features jsonb DEFAULT '{}'::jsonb,
  generation_iteration integer DEFAULT 0,
  parent_concept_id uuid REFERENCES public.concepts(id) ON DELETE SET NULL,
  evaluation_verdict text,
  memo_snapshot jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.concepts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own concepts"
  ON public.concepts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own concepts"
  ON public.concepts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own concepts"
  ON public.concepts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own concepts"
  ON public.concepts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 5. CONCEPT EVALUATIONS
-- ============================================================
CREATE TABLE public.concept_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id uuid NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  evaluation_type text NOT NULL,
  score numeric DEFAULT 0,
  confidence_score numeric DEFAULT 0,
  reasoning text,
  nearest_analogs jsonb DEFAULT '[]'::jsonb,
  nearest_prior_art jsonb DEFAULT '[]'::jsonb,
  signal_strengths jsonb DEFAULT '{}'::jsonb,
  tam_estimate_low numeric,
  tam_estimate_high numeric,
  tam_basis text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.concept_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own evaluations"
  ON public.concept_evaluations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own evaluations"
  ON public.concept_evaluations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own evaluations"
  ON public.concept_evaluations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own evaluations"
  ON public.concept_evaluations FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 6. CONCEPT OUTCOMES
-- ============================================================
CREATE TABLE public.concept_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id uuid NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.concept_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own outcomes"
  ON public.concept_outcomes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own outcomes"
  ON public.concept_outcomes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own outcomes"
  ON public.concept_outcomes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own outcomes"
  ON public.concept_outcomes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 7. BUSINESS ANALOGS
-- ============================================================
CREATE TABLE public.business_analogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  domain text,
  business_model text,
  customer_segment text,
  distribution_model text,
  pricing_model text,
  capital_intensity text,
  regulatory_class text,
  structural_features jsonb DEFAULT '{}'::jsonb,
  outcome text DEFAULT 'unknown',
  outcome_notes text,
  revenue_range text,
  employee_range text,
  source text DEFAULT 'manual',
  source_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.business_analogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business analogs are publicly readable"
  ON public.business_analogs FOR SELECT
  USING (true);

CREATE POLICY "Service role inserts business analogs"
  ON public.business_analogs FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No public update on business analogs"
  ON public.business_analogs FOR UPDATE
  USING (false);

CREATE POLICY "No public delete on business analogs"
  ON public.business_analogs FOR DELETE
  USING (false);
