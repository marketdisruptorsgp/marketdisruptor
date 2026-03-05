
CREATE OR REPLACE FUNCTION public.merge_analysis_step(
  p_analysis_id uuid,
  p_step_key text,
  p_step_payload jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE saved_analyses
  SET
    analysis_data = jsonb_set(
      COALESCE(analysis_data, '{}'::jsonb),
      ARRAY[p_step_key],
      p_step_payload,
      true
    ),
    updated_at = now()
  WHERE id = p_analysis_id
    AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Analysis not found or not owned by user';
  END IF;
END;
$$;
