-- Crear función RPC optimizada para obtener orígenes con frecuencia
CREATE OR REPLACE FUNCTION public.get_origenes_con_frecuencia(cliente_nombre_param text)
RETURNS TABLE(
  origen text,
  frecuencia bigint,
  ultimo_uso timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH origenes_pricing AS (
    SELECT DISTINCT mpr.origen_texto
    FROM matriz_precios_rutas mpr
    WHERE mpr.activo = true 
      AND mpr.cliente_nombre = cliente_nombre_param
  ),
  frecuencias AS (
    SELECT 
      sc.origen,
      COUNT(*) as freq_count,
      MAX(sc.fecha_hora_cita) as ultimo_servicio
    FROM servicios_custodia sc
    WHERE sc.nombre_cliente = cliente_nombre_param
      AND sc.origen IS NOT NULL
      AND sc.origen != ''
      AND LOWER(TRIM(COALESCE(sc.estado, ''))) NOT IN ('cancelado', 'cancelled', 'canceled')
    GROUP BY sc.origen
  )
  SELECT 
    op.origen_texto as origen,
    COALESCE(f.freq_count, 0) as frecuencia,
    f.ultimo_servicio as ultimo_uso
  FROM origenes_pricing op
  LEFT JOIN frecuencias f ON op.origen_texto = f.origen
  ORDER BY 
    COALESCE(f.freq_count, 0) DESC,
    op.origen_texto ASC;
END;
$function$