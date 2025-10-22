-- Mejorar la función RPC update_servicio_estado para ser tolerante a espacios/mayúsculas
-- y devolver el número de filas actualizadas

DROP FUNCTION IF EXISTS public.update_servicio_estado(text, text);

CREATE OR REPLACE FUNCTION public.update_servicio_estado(p_id_servicio text, p_estado text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_rows_updated integer;
BEGIN
  UPDATE public.servicios_custodia
  SET estado = p_estado,
      updated_time = now()
  WHERE lower(trim(id_servicio)) = lower(trim(p_id_servicio));

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  RETURN v_rows_updated;
END;
$$;

-- Mantener el permiso de ejecución
GRANT EXECUTE ON FUNCTION public.update_servicio_estado(text, text) TO authenticated;

-- Opcional: Crear índice funcional para mejorar rendimiento en búsquedas robustas
CREATE INDEX IF NOT EXISTS idx_servicios_custodia_id_servicio_norm 
ON public.servicios_custodia ((lower(trim(id_servicio))));