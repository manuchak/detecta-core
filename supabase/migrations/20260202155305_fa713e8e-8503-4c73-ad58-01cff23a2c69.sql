-- Epic 6: Agregar campos para control de rotación local/foráneo
ALTER TABLE public.custodios_operativos 
ADD COLUMN IF NOT EXISTS tipo_ultimo_servicio TEXT CHECK (tipo_ultimo_servicio IN ('local', 'foraneo')),
ADD COLUMN IF NOT EXISTS contador_locales_consecutivos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS contador_foraneos_consecutivos INTEGER DEFAULT 0;

-- Crear índice para consultas de rotación
CREATE INDEX IF NOT EXISTS idx_custodios_tipo_servicio ON public.custodios_operativos(tipo_ultimo_servicio) WHERE estado = 'activo';

-- Comentarios de documentación
COMMENT ON COLUMN public.custodios_operativos.tipo_ultimo_servicio IS 'Tipo del último servicio asignado: local o foraneo';
COMMENT ON COLUMN public.custodios_operativos.contador_locales_consecutivos IS 'Número de servicios locales consecutivos asignados';
COMMENT ON COLUMN public.custodios_operativos.contador_foraneos_consecutivos IS 'Número de servicios foráneos consecutivos asignados';

-- Función para actualizar contadores al asignar servicio
CREATE OR REPLACE FUNCTION public.actualizar_rotacion_custodio(
  p_custodio_id UUID,
  p_tipo_servicio TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_tipo_servicio = 'local' THEN
    UPDATE custodios_operativos
    SET 
      tipo_ultimo_servicio = 'local',
      contador_locales_consecutivos = contador_locales_consecutivos + 1,
      contador_foraneos_consecutivos = 0,
      updated_at = NOW()
    WHERE id = p_custodio_id;
  ELSIF p_tipo_servicio = 'foraneo' THEN
    UPDATE custodios_operativos
    SET 
      tipo_ultimo_servicio = 'foraneo',
      contador_foraneos_consecutivos = contador_foraneos_consecutivos + 1,
      contador_locales_consecutivos = 0,
      updated_at = NOW()
    WHERE id = p_custodio_id;
  END IF;
END;
$$;

-- Permisos
GRANT EXECUTE ON FUNCTION public.actualizar_rotacion_custodio(UUID, TEXT) TO authenticated;