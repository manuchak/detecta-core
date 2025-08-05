-- Crear función para obtener instaladores sin restricciones RLS
CREATE OR REPLACE FUNCTION get_instaladores_for_programacion(instalador_ids uuid[])
RETURNS TABLE (
  id uuid,
  nombre_completo text,
  telefono text,
  calificacion_promedio numeric,
  especialidades text[]
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.nombre_completo,
    i.telefono,
    i.calificacion_promedio,
    i.especialidades
  FROM instaladores i
  WHERE i.id = ANY(instalador_ids)
    AND i.estado_afiliacion = 'activo';
END;
$$;