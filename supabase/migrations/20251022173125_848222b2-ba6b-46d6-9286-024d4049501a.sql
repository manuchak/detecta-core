-- Create general RPC for updating any fields in servicios_custodia
-- This function accepts an id_servicio and a jsonb object with fields to update
-- Uses SECURITY DEFINER to bypass RLS safely
CREATE OR REPLACE FUNCTION public.update_servicio_completo(
  p_id_servicio text,
  p_updates jsonb
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_rows_updated integer;
  v_sql text;
  v_set_clauses text[];
  v_key text;
  v_value jsonb;
BEGIN
  -- Build dynamic SET clause from jsonb
  FOR v_key, v_value IN SELECT * FROM jsonb_each(p_updates)
  LOOP
    -- Skip id_servicio to avoid updating the WHERE condition
    IF v_key = 'id_servicio' THEN
      CONTINUE;
    END IF;
    
    -- Add each field to SET clause
    v_set_clauses := array_append(
      v_set_clauses,
      format('%I = %L', v_key, v_value #>> '{}')
    );
  END LOOP;
  
  -- Always update updated_time
  v_set_clauses := array_append(v_set_clauses, 'updated_time = now()');
  
  -- Build and execute dynamic UPDATE with normalized id_servicio matching
  v_sql := format(
    'UPDATE public.servicios_custodia SET %s WHERE lower(trim(id_servicio)) = lower(trim(%L))',
    array_to_string(v_set_clauses, ', '),
    p_id_servicio
  );
  
  EXECUTE v_sql;
  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  
  RETURN v_rows_updated;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_servicio_completo(text, jsonb) TO authenticated;

COMMENT ON FUNCTION public.update_servicio_completo IS 'Updates any fields in servicios_custodia by id_servicio. Bypasses RLS via SECURITY DEFINER. Returns number of rows updated.';