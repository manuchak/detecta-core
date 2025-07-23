-- Crear función optimizada para obtener custodios nuevos por mes
CREATE OR REPLACE FUNCTION public.get_custodios_nuevos_por_mes(fecha_inicio date, fecha_fin date)
RETURNS TABLE(
  mes text,
  custodios_nuevos integer,
  nombres_custodios text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH primer_servicio_custodio AS (
    SELECT 
      nombre_custodio,
      MIN(fecha_hora_cita) as primer_servicio
    FROM servicios_custodia 
    WHERE nombre_custodio IS NOT NULL 
      AND fecha_hora_cita IS NOT NULL
      AND nombre_custodio != ''
      AND nombre_custodio != '#N/A'
    GROUP BY nombre_custodio
  ),
  custodios_nuevos_filtrados AS (
    SELECT 
      nombre_custodio,
      primer_servicio,
      TO_CHAR(primer_servicio, 'YYYY-MM') as mes_year
    FROM primer_servicio_custodio
    WHERE primer_servicio >= fecha_inicio
      AND primer_servicio <= fecha_fin
  )
  SELECT 
    cnf.mes_year as mes,
    COUNT(*)::integer as custodios_nuevos,
    array_agg(cnf.nombre_custodio) as nombres_custodios
  FROM custodios_nuevos_filtrados cnf
  GROUP BY cnf.mes_year
  ORDER BY cnf.mes_year;
END;
$$;