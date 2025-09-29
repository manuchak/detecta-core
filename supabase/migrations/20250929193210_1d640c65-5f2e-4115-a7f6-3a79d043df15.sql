-- Drop and recreate get_activation_metrics_safe with proper type casting
DROP FUNCTION IF EXISTS public.get_activation_metrics_safe();

CREATE FUNCTION public.get_activation_metrics_safe()
RETURNS TABLE(
  total_custodians integer,
  activated_custodians integer,
  activation_rate numeric,
  avg_time_to_activation numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH activation_stats AS (
    SELECT 
      COUNT(DISTINCT pc.id) as total,
      COUNT(DISTINCT pc.id) FILTER (
        WHERE EXISTS (
          SELECT 1 FROM servicios_custodia sc 
          WHERE sc.nombre_custodio = pc.nombre 
          AND LOWER(TRIM(COALESCE(sc.estado, ''))) NOT IN ('cancelado', 'cancelled', 'canceled')
          LIMIT 1
        )
      ) as activated,
      AVG(
        EXTRACT(EPOCH FROM (
          (SELECT MIN(sc.fecha_hora_cita) 
           FROM servicios_custodia sc 
           WHERE sc.nombre_custodio = pc.nombre
           AND LOWER(TRIM(COALESCE(sc.estado, ''))) NOT IN ('cancelado', 'cancelled', 'canceled')
          ) - pc.created_at
        )) / 86400.0
      ) FILTER (
        WHERE EXISTS (
          SELECT 1 FROM servicios_custodia sc 
          WHERE sc.nombre_custodio = pc.nombre 
          AND LOWER(TRIM(COALESCE(sc.estado, ''))) NOT IN ('cancelado', 'cancelled', 'canceled')
          LIMIT 1
        )
      ) as avg_days_to_activation
    FROM pc_custodios pc
    WHERE pc.estado = 'activo'
  )
  SELECT 
    COALESCE(ast.total, 0)::integer,
    COALESCE(ast.activated, 0)::integer,
    CASE 
      WHEN COALESCE(ast.total, 0) > 0 
      THEN ROUND((COALESCE(ast.activated, 0)::numeric / ast.total::numeric) * 100, 2)
      ELSE 0 
    END as activation_rate,
    COALESCE(ast.avg_days_to_activation, 0)::numeric as avg_time_to_activation
  FROM activation_stats ast;
END;
$function$;