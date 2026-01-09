-- Fix normalize_name to use schema-qualified unaccent
CREATE OR REPLACE FUNCTION public.normalize_name(input_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN UPPER(TRIM(public.unaccent(COALESCE(input_name, ''))));
END;
$$;