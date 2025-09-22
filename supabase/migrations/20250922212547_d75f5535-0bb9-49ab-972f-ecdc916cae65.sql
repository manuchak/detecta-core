-- Create function to check if custodian has real recent activity
CREATE OR REPLACE FUNCTION public.custodio_tiene_actividad_reciente(p_nombre_custodio TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if custodian has completed services in last 90 days
  RETURN EXISTS (
    SELECT 1 
    FROM public.servicios_custodia sc
    WHERE sc.nombre_custodio = p_nombre_custodio
      AND sc.fecha_hora_cita >= (CURRENT_DATE - INTERVAL '90 days')
      AND LOWER(TRIM(COALESCE(sc.estado, ''))) IN ('completado', 'finalizado')
  );
END;
$$;

-- Drop and recreate the materialized view with activity filter
DROP MATERIALIZED VIEW IF EXISTS public.custodios_operativos_disponibles;

CREATE MATERIALIZED VIEW public.custodios_operativos_disponibles AS
SELECT 
  co.id,
  co.nombre,
  co.telefono,
  co.zona_base,
  co.disponibilidad,
  co.estado,
  co.experiencia_seguridad,
  co.vehiculo_propio,
  co.numero_servicios,
  co.rating_promedio,
  co.tasa_aceptacion,
  co.tasa_respuesta,
  co.tasa_confiabilidad,
  co.score_comunicacion,
  co.score_aceptacion,
  co.score_confiabilidad,
  co.score_total,
  co.fuente,
  co.fecha_ultimo_servicio,
  co.created_at,
  co.updated_at
FROM public.custodios_operativos co
WHERE co.estado = 'activo'
  AND co.disponibilidad = 'disponible'
  AND (
    -- Include non-migrated custodians (truly new)
    co.fuente != 'migracion_historico'
    OR 
    -- Include migrated custodians with recent activity (last 90 days)
    public.custodio_tiene_actividad_reciente(co.nombre)
  );

-- Create indexes for better performance
CREATE INDEX idx_custodios_operativos_disponibles_nombre ON public.custodios_operativos_disponibles(nombre);
CREATE INDEX idx_custodios_operativos_disponibles_zona ON public.custodios_operativos_disponibles(zona_base);
CREATE INDEX idx_custodios_operativos_disponibles_score ON public.custodios_operativos_disponibles(score_total DESC);

-- Update custodios that should be temporarily inactive
UPDATE public.custodios_operativos 
SET disponibilidad = 'inactivo_temporal',
    updated_at = now()
WHERE fuente = 'migracion_historico'
  AND NOT public.custodio_tiene_actividad_reciente(nombre)
  AND disponibilidad = 'disponible';