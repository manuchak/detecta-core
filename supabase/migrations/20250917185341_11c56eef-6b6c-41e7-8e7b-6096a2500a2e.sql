-- Función RPC segura para obtener zonas de trabajo por ciudad
CREATE OR REPLACE FUNCTION public.get_zonas_trabajo_safe(ciudad_uuid uuid)
RETURNS TABLE(
  id uuid,
  nombre text,
  ciudad_id uuid,
  descripcion text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    zt.id,
    zt.nombre,
    zt.ciudad_id,
    COALESCE(zt.descripcion, '') as descripcion
  FROM public.zonas_trabajo zt
  WHERE zt.ciudad_id = ciudad_uuid
    AND zt.activo = true
  ORDER BY zt.nombre ASC;
END;
$$;

-- Función RPC segura para obtener estados
CREATE OR REPLACE FUNCTION public.get_estados_safe()
RETURNS TABLE(
  id uuid,
  nombre text,
  codigo text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.nombre,
    COALESCE(e.codigo, '') as codigo
  FROM public.estados e
  WHERE e.activo = true
  ORDER BY e.nombre ASC;
END;
$$;

-- Función RPC segura para obtener ciudades por estado
CREATE OR REPLACE FUNCTION public.get_ciudades_safe(estado_uuid uuid)
RETURNS TABLE(
  id uuid,
  nombre text,
  estado_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.nombre,
    c.estado_id
  FROM public.ciudades c
  WHERE c.estado_id = estado_uuid
    AND c.activo = true
  ORDER BY c.nombre ASC;
END;
$$;