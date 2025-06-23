
-- Función para limpiar servicios duplicados manteniendo el más reciente
CREATE OR REPLACE FUNCTION public.clean_duplicate_service_ids()
RETURNS TABLE(
  duplicates_found INTEGER,
  duplicates_removed INTEGER,
  details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_duplicates_found INTEGER := 0;
  v_duplicates_removed INTEGER := 0;
  v_details TEXT := '';
BEGIN
  -- Contar servicios duplicados
  SELECT COUNT(*) INTO v_duplicates_found
  FROM (
    SELECT id_servicio, COUNT(*) as count
    FROM public.servicios_custodia
    WHERE id_servicio IS NOT NULL AND TRIM(id_servicio) != ''
    GROUP BY id_servicio
    HAVING COUNT(*) > 1
  ) duplicates;

  -- Si hay duplicados, procesarlos
  IF v_duplicates_found > 0 THEN
    -- Crear tabla temporal con los registros a eliminar (mantener el más reciente)
    WITH ranked_services AS (
      SELECT 
        id,
        id_servicio,
        fecha_hora_cita,
        created_at,
        ROW_NUMBER() OVER (
          PARTITION BY id_servicio 
          ORDER BY 
            COALESCE(fecha_hora_cita, '1900-01-01'::timestamp) DESC,
            created_at DESC,
            id DESC
        ) as rn
      FROM public.servicios_custodia
      WHERE id_servicio IS NOT NULL AND TRIM(id_servicio) != ''
    )
    -- Eliminar duplicados (mantener solo el primero de cada grupo)
    DELETE FROM public.servicios_custodia
    WHERE id IN (
      SELECT id FROM ranked_services WHERE rn > 1
    );

    -- Obtener número de registros eliminados
    GET DIAGNOSTICS v_duplicates_removed = ROW_COUNT;
    
    v_details := format('Se encontraron %s servicios con IDs duplicados. Se eliminaron %s registros duplicados, manteniendo los más recientes.',
                       v_duplicates_found, v_duplicates_removed);
  ELSE
    v_details := 'No se encontraron servicios con IDs duplicados.';
  END IF;

  RETURN QUERY SELECT v_duplicates_found, v_duplicates_removed, v_details;
END;
$$;

-- Crear tabla para log de mantenimiento si no existe
CREATE TABLE IF NOT EXISTS public.maintenance_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  operation_type TEXT NOT NULL,
  table_name TEXT NOT NULL,
  records_affected INTEGER DEFAULT 0,
  operation_details TEXT,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- PASO 1: Ejecutar limpieza inicial de duplicados
DO $$
DECLARE
  cleanup_result RECORD;
BEGIN
  -- Ejecutar limpieza de duplicados
  SELECT * INTO cleanup_result FROM public.clean_duplicate_service_ids();
  
  -- Log de la operación inicial
  INSERT INTO public.maintenance_log (
    operation_type,
    table_name,
    records_affected,
    operation_details,
    executed_at
  ) VALUES (
    'initial_duplicate_cleanup',
    'servicios_custodia',
    cleanup_result.duplicates_removed,
    cleanup_result.details,
    now()
  );
  
  RAISE NOTICE 'Limpieza inicial completada: %', cleanup_result.details;
END $$;

-- PASO 2: Ahora crear el índice único (después de limpiar duplicados)
CREATE UNIQUE INDEX IF NOT EXISTS idx_servicios_custodia_id_servicio_unique 
ON public.servicios_custodia (id_servicio) 
WHERE id_servicio IS NOT NULL AND TRIM(id_servicio) != '';

-- Función para verificar y reportar duplicados sin eliminar
CREATE OR REPLACE FUNCTION public.check_duplicate_service_ids()
RETURNS TABLE(
  id_servicio TEXT,
  duplicate_count BIGINT,
  service_ids UUID[],
  latest_date TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.id_servicio,
    COUNT(*) as duplicate_count,
    array_agg(sc.id ORDER BY sc.fecha_hora_cita DESC NULLS LAST, sc.created_at DESC) as service_ids,
    MAX(sc.fecha_hora_cita) as latest_date
  FROM public.servicios_custodia sc
  WHERE sc.id_servicio IS NOT NULL 
    AND TRIM(sc.id_servicio) != ''
  GROUP BY sc.id_servicio
  HAVING COUNT(*) > 1
  ORDER BY COUNT(*) DESC, sc.id_servicio;
END;
$$;

-- Función para la tarea programada diaria
CREATE OR REPLACE FUNCTION public.daily_duplicate_cleanup()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  cleanup_result RECORD;
BEGIN
  -- Ejecutar limpieza de duplicados
  SELECT * INTO cleanup_result FROM public.clean_duplicate_service_ids();
  
  -- Log de la operación
  INSERT INTO public.maintenance_log (
    operation_type,
    table_name,
    records_affected,
    operation_details,
    executed_at
  ) VALUES (
    'daily_duplicate_cleanup',
    'servicios_custodia',
    cleanup_result.duplicates_removed,
    cleanup_result.details,
    now()
  );
  
  -- Si se encontraron duplicados, registrar en log adicional
  IF cleanup_result.duplicates_found > 0 THEN
    RAISE NOTICE 'Limpieza automática de duplicados ejecutada: %', cleanup_result.details;
  END IF;
  
  EXCEPTION WHEN OTHERS THEN
    -- Log del error
    INSERT INTO public.maintenance_log (
      operation_type,
      table_name,
      records_affected,
      operation_details,
      executed_at
    ) VALUES (
      'duplicate_cleanup_error',
      'servicios_custodia',
      0,
      format('Error en limpieza automática: %s', SQLERRM),
      now()
    );
    
    RAISE NOTICE 'Error en limpieza automática de duplicados: %', SQLERRM;
END;
$$;

-- Habilitar extensiones necesarias para cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Programar tarea diaria a las 3:00 AM (UTC)
SELECT cron.schedule(
  'daily-duplicate-cleanup',
  '0 3 * * *', -- Cada día a las 3:00 AM
  $$SELECT public.daily_duplicate_cleanup();$$
);

-- Comentarios sobre el sistema implementado
COMMENT ON FUNCTION public.clean_duplicate_service_ids() IS 'Función que limpia servicios duplicados manteniendo el registro más reciente basado en fecha_hora_cita y created_at';
COMMENT ON FUNCTION public.check_duplicate_service_ids() IS 'Función que verifica duplicados sin eliminar, útil para reportes';
COMMENT ON FUNCTION public.daily_duplicate_cleanup() IS 'Función ejecutada diariamente por cron para mantener la integridad de datos';
COMMENT ON TABLE public.maintenance_log IS 'Tabla de log para operaciones de mantenimiento automático';
