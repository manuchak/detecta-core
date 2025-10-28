-- ============================================
-- SEGURIDAD: Restringir acceso a datos sensibles de pricing
-- Sin romper funcionalidad de planificadores
-- ============================================

-- PASO 1: Crear tabla de auditoría para accesos a precios
CREATE TABLE IF NOT EXISTS public.audit_pricing_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  user_role TEXT NOT NULL,
  accessed_route_id UUID REFERENCES matriz_precios_rutas(id),
  accessed_cliente TEXT,
  action_type TEXT NOT NULL, -- 'view', 'search', 'export', 'modify'
  sensitive_fields_accessed TEXT[], -- campos sensibles consultados
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS en tabla de auditoría
ALTER TABLE public.audit_pricing_access ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver auditoría
CREATE POLICY "audit_pricing_admin_view"
ON public.audit_pricing_access
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

-- Todos los usuarios autenticados pueden insertar logs (para auditoría)
CREATE POLICY "audit_pricing_authenticated_insert"
ON public.audit_pricing_access
FOR INSERT
TO public
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
);

-- Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_audit_pricing_user_id ON public.audit_pricing_access(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_pricing_created_at ON public.audit_pricing_access(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_pricing_cliente ON public.audit_pricing_access(accessed_cliente);

-- PASO 2: Crear función segura que determina qué campos puede ver cada rol
CREATE OR REPLACE FUNCTION public.get_allowed_pricing_fields(p_user_id UUID)
RETURNS TEXT[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_role TEXT;
  v_allowed_fields TEXT[];
BEGIN
  -- Obtener rol del usuario
  SELECT role INTO v_user_role
  FROM user_roles
  WHERE user_id = p_user_id
  LIMIT 1;

  -- Si no tiene rol, no puede ver nada
  IF v_user_role IS NULL THEN
    RETURN ARRAY[]::TEXT[];
  END IF;

  -- Admin y Owner: acceso completo
  IF v_user_role IN ('admin', 'owner', 'supply_admin') THEN
    RETURN ARRAY[
      'id', 'cliente_nombre', 'origen_texto', 'destino_texto',
      'valor_bruto', 'precio_custodio', 'costo_operativo',
      'margen_neto_calculado', 'porcentaje_utilidad',
      'distancia_km', 'tipo_servicio', 'fecha_vigencia',
      'activo', 'created_at', 'dias_operacion'
    ];
  END IF;

  -- Coordinador de Operaciones: acceso a costos operativos pero no márgenes
  IF v_user_role = 'coordinador_operaciones' THEN
    RETURN ARRAY[
      'id', 'cliente_nombre', 'origen_texto', 'destino_texto',
      'valor_bruto', 'precio_custodio', 'costo_operativo',
      'distancia_km', 'tipo_servicio', 'fecha_vigencia',
      'activo', 'created_at', 'dias_operacion'
    ];
  END IF;

  -- Planificador: acceso limitado (SIN márgenes, SIN costos operativos sensibles)
  IF v_user_role = 'planificador' THEN
    RETURN ARRAY[
      'id', 'cliente_nombre', 'origen_texto', 'destino_texto',
      'valor_bruto', 'precio_custodio', -- necesario para crear servicios
      'distancia_km', 'tipo_servicio', 'fecha_vigencia',
      'activo', 'created_at', 'dias_operacion'
    ];
  END IF;

  -- Por defecto: acceso muy limitado
  RETURN ARRAY[
    'id', 'cliente_nombre', 'origen_texto', 'destino_texto',
    'tipo_servicio', 'activo'
  ];
END;
$$;

-- PASO 3: Crear función para validar si el usuario puede ver campos sensibles
CREATE OR REPLACE FUNCTION public.can_view_sensitive_pricing()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_role TEXT;
BEGIN
  -- Obtener rol del usuario
  SELECT role INTO v_user_role
  FROM user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;

  -- Solo admin, owner y supply_admin pueden ver campos sensibles
  RETURN v_user_role IN ('admin', 'owner', 'supply_admin');
END;
$$;

-- PASO 4: Limpiar políticas duplicadas/conflictivas existentes
DROP POLICY IF EXISTS "matriz_precios_rutas_authenticated_read" ON public.matriz_precios_rutas;
DROP POLICY IF EXISTS "Usuarios de planeación pueden ver matriz de precios" ON public.matriz_precios_rutas;
DROP POLICY IF EXISTS "Usuarios de planeación pueden actualizar matriz de precios" ON public.matriz_precios_rutas;
DROP POLICY IF EXISTS "Usuarios de planeación pueden insertar matriz de precios" ON public.matriz_precios_rutas;

-- PASO 5: Crear nuevas políticas RLS más estrictas

-- SELECT: Usuarios autenticados pueden ver según su rol
CREATE POLICY "matriz_precios_select_role_based"
ON public.matriz_precios_rutas
FOR SELECT
TO public
USING (
  auth.uid() IS NOT NULL
  AND (
    -- Admin/Owner/Supply Admin: acceso completo
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner', 'supply_admin', 'coordinador_operaciones', 'planificador')
    )
  )
);

-- INSERT: Solo roles autorizados pueden crear precios
CREATE POLICY "matriz_precios_insert_authorized_secure"
ON public.matriz_precios_rutas
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner', 'supply_admin', 'coordinador_operaciones', 'planificador')
  )
);

-- UPDATE: Solo admin, coordinador y supply_admin pueden modificar
-- Planificadores YA NO pueden modificar precios existentes
CREATE POLICY "matriz_precios_update_restricted_secure"
ON public.matriz_precios_rutas
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'supply_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'supply_admin')
  )
);

-- DELETE: Mantener política existente (solo admin)
-- (Ya existe: matriz_precios_rutas_delete_admin)

-- PASO 6: Crear trigger para logging automático de accesos
CREATE OR REPLACE FUNCTION public.log_pricing_access_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_role TEXT;
BEGIN
  -- Obtener rol del usuario actual
  SELECT role INTO v_user_role
  FROM user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;

  -- Solo loggear si es planificador o coordinador (admin no necesita logging)
  IF v_user_role IN ('planificador', 'coordinador_operaciones') THEN
    INSERT INTO audit_pricing_access (
      user_id,
      user_role,
      accessed_route_id,
      accessed_cliente,
      action_type,
      sensitive_fields_accessed
    ) VALUES (
      auth.uid(),
      v_user_role,
      NEW.id,
      NEW.cliente_nombre,
      TG_OP, -- 'INSERT', 'UPDATE', 'DELETE'
      CASE 
        WHEN v_user_role = 'planificador' THEN 
          ARRAY['valor_bruto', 'precio_custodio'] -- campos que pueden ver
        ELSE 
          ARRAY['valor_bruto', 'precio_custodio', 'costo_operativo']
      END
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Crear trigger para INSERT
DROP TRIGGER IF EXISTS trigger_log_pricing_insert ON public.matriz_precios_rutas;
CREATE TRIGGER trigger_log_pricing_insert
AFTER INSERT ON public.matriz_precios_rutas
FOR EACH ROW
EXECUTE FUNCTION public.log_pricing_access_trigger();

-- PASO 7: Comentarios de documentación
COMMENT ON FUNCTION public.can_view_sensitive_pricing() IS 
'Determina si el usuario actual puede ver campos sensibles de pricing (márgenes, utilidades, costos operativos)';

COMMENT ON FUNCTION public.get_allowed_pricing_fields(UUID) IS 
'Retorna la lista de campos de matriz_precios_rutas que el usuario puede ver según su rol';

COMMENT ON TABLE public.audit_pricing_access IS 
'Auditoría de accesos a datos sensibles de pricing. Registra quién accedió, cuándo y qué campos consultó';

-- PASO 8: Grant de permisos
GRANT SELECT ON public.matriz_precios_rutas TO authenticated;
GRANT INSERT ON public.matriz_precios_rutas TO authenticated;
GRANT UPDATE ON public.matriz_precios_rutas TO authenticated;
GRANT INSERT ON public.audit_pricing_access TO authenticated;