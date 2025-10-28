-- ============================================
-- SEGURIDAD: Restringir acceso a catálogos de vehículos
-- Solo usuarios autenticados (internos) pueden acceder
-- ============================================

-- PASO 1: Eliminar políticas de acceso público en marcas_vehiculos
DROP POLICY IF EXISTS "Todos pueden leer marcas" ON public.marcas_vehiculos;

-- PASO 2: Eliminar políticas de acceso público en modelos_vehiculos
DROP POLICY IF EXISTS "Todos pueden leer modelos" ON public.modelos_vehiculos;

-- PASO 3: Verificar que existan políticas para usuarios autenticados
-- (Ya existen según la query, pero las recreamos por seguridad)

-- Recrear política de acceso autenticado para marcas_vehiculos
DROP POLICY IF EXISTS "marcas_vehiculos_authenticated_access" ON public.marcas_vehiculos;
CREATE POLICY "marcas_vehiculos_authenticated_access"
ON public.marcas_vehiculos
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);

-- Recrear política de acceso autenticado para modelos_vehiculos
DROP POLICY IF EXISTS "modelos_vehiculos_authenticated_access" ON public.modelos_vehiculos;
CREATE POLICY "modelos_vehiculos_authenticated_access"
ON public.modelos_vehiculos
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);

-- PASO 4: Agregar comentarios de documentación
COMMENT ON POLICY "marcas_vehiculos_authenticated_access" ON public.marcas_vehiculos IS 
'Security fix: Only authenticated users can view vehicle brands. Public access removed to prevent competitor scraping.';

COMMENT ON POLICY "modelos_vehiculos_authenticated_access" ON public.modelos_vehiculos IS 
'Security fix: Only authenticated users can view vehicle models. Public access removed to prevent competitor scraping.';

-- PASO 5: Verificar que las RPC functions seguras también requieran autenticación
-- Actualizar get_marcas_vehiculos_safe para asegurar autenticación
CREATE OR REPLACE FUNCTION public.get_marcas_vehiculos_safe()
RETURNS TABLE (
  id UUID,
  nombre TEXT,
  pais_origen TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar que el usuario esté autenticado
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required to access vehicle brands';
  END IF;

  RETURN QUERY
  SELECT 
    m.id,
    m.nombre,
    m.pais_origen
  FROM marcas_vehiculos m
  WHERE m.activo = true
  ORDER BY m.nombre;
END;
$$;

COMMENT ON FUNCTION public.get_marcas_vehiculos_safe() IS 
'Security fix: Requires authentication. Returns active vehicle brands for authenticated users only.';

-- PASO 6: Crear función segura para modelos_vehiculos si no existe
CREATE OR REPLACE FUNCTION public.get_modelos_vehiculos_safe(p_marca_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  nombre TEXT,
  marca_id UUID,
  tipo_vehiculo TEXT,
  año_inicio INTEGER,
  año_fin INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar que el usuario esté autenticado
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required to access vehicle models';
  END IF;

  RETURN QUERY
  SELECT 
    m.id,
    m.nombre,
    m.marca_id,
    m.tipo_vehiculo,
    m.año_inicio,
    m.año_fin
  FROM modelos_vehiculos m
  WHERE m.activo = true
    AND (p_marca_id IS NULL OR m.marca_id = p_marca_id)
  ORDER BY m.nombre;
END;
$$;

COMMENT ON FUNCTION public.get_modelos_vehiculos_safe(UUID) IS 
'Security fix: Requires authentication. Returns active vehicle models for authenticated users only. Optionally filtered by brand.';

-- PASO 7: Revocar permisos públicos directos (por precaución)
REVOKE SELECT ON public.marcas_vehiculos FROM anon;
REVOKE SELECT ON public.modelos_vehiculos FROM anon;

-- Mantener acceso para usuarios autenticados
GRANT SELECT ON public.marcas_vehiculos TO authenticated;
GRANT SELECT ON public.modelos_vehiculos TO authenticated;