
-- 1. Create profiles table for user first names
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL,
  first_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Auto-update timestamp
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Add user_id column to saved_analyses
ALTER TABLE public.saved_analyses
  ADD COLUMN IF NOT EXISTS user_id uuid;

-- 3. Drop old open RLS policies on saved_analyses
DROP POLICY IF EXISTS "Anyone can read analyses" ON public.saved_analyses;
DROP POLICY IF EXISTS "Anyone can insert analyses" ON public.saved_analyses;
DROP POLICY IF EXISTS "Anyone can delete analyses" ON public.saved_analyses;

-- 4. Create user-scoped RLS policies
CREATE POLICY "Users can read their own analyses"
  ON public.saved_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analyses"
  ON public.saved_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyses"
  ON public.saved_analyses FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own analyses"
  ON public.saved_analyses FOR UPDATE
  USING (auth.uid() = user_id);
