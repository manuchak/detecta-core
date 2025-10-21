-- ===================================================================
-- FUNCIÓN RPC PARA ACTUALIZACIÓN SEGURA DE ESTADOS
-- ===================================================================

-- Función RPC para actualizar estado de un servicio de forma segura
-- Usa SECURITY DEFINER para bypass de RLS en casos necesarios
CREATE OR REPLACE FUNCTION public.update_servicio_estado(
  p_id_servicio text,
  p_estado text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE servicios_custodia
  SET estado = p_estado,
      updated_time = now()
  WHERE id_servicio = p_id_servicio;
  
  -- Si no se actualizó ninguna fila, loguear para debug
  IF NOT FOUND THEN
    RAISE NOTICE 'No se encontró servicio con id_servicio: %', p_id_servicio;
  END IF;
END;
$$;

-- Otorgar permisos de ejecución
GRANT EXECUTE ON FUNCTION public.update_servicio_estado(text, text) 
TO authenticated, anon, service_role;

COMMENT ON FUNCTION public.update_servicio_estado IS 
'Actualiza el estado de un servicio de custodia de forma segura, bypassing RLS si es necesario';