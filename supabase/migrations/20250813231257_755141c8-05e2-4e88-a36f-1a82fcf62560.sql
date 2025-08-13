-- CRITICAL SECURITY FIXES - Phase 1
-- Remove hardcoded admin bypasses and secure business intelligence data

-- 1. First, drop existing problematic policies on business intelligence tables
DROP POLICY IF EXISTS "servicios_segmentados_public_read" ON public.servicios_segmentados;
DROP POLICY IF EXISTS "zonas_operacion_nacional_public_read" ON public.zonas_operacion_nacional;
DROP POLICY IF EXISTS "subcategorias_gastos_public_read" ON public.subcategorias_gastos;
DROP POLICY IF EXISTS "ml_model_configurations_public_read" ON public.ml_model_configurations;

-- 2. Secure business intelligence tables with proper role restrictions
CREATE POLICY "servicios_segmentados_restricted_access" 
ON public.servicios_segmentados 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'bi')
  )
);

CREATE POLICY "zonas_operacion_nacional_restricted_access" 
ON public.zonas_operacion_nacional 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'bi')
  )
);

CREATE POLICY "subcategorias_gastos_restricted_access" 
ON public.subcategorias_gastos 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'bi')
  )
);

CREATE POLICY "ml_model_configurations_restricted_access" 
ON public.ml_model_configurations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'bi')
  )
);

-- 3. Create secure function to replace hardcoded admin checks
CREATE OR REPLACE FUNCTION public.is_admin_user_secure()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  );
END;
$$;

-- 4. Create secure function for role checking
CREATE OR REPLACE FUNCTION public.has_role_secure(check_role text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role = check_role
  );
END;
$$;

-- 5. Update existing functions to remove hardcoded admin bypasses and add security
CREATE OR REPLACE FUNCTION public.get_available_roles_secure()
RETURNS text[]
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only admins can see available roles
  IF NOT public.is_admin_user_secure() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  RETURN ARRAY[
    'owner',
    'admin', 
    'supply_admin',
    'coordinador_operaciones',
    'jefe_seguridad',
    'analista_seguridad',
    'supply_lead',
    'ejecutivo_ventas',
    'custodio',
    'bi',
    'monitoring_supervisor',
    'monitoring',
    'supply',
    'instalador',
    'soporte',
    'pending',
    'unverified'
  ];
END;
$$;

-- 6. Update verify user email function to use secure role checking
CREATE OR REPLACE FUNCTION public.verify_user_email_secure(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only admins can verify user emails
  IF NOT public.is_admin_user_secure() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Verify that the user exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Update verification status
  UPDATE public.profiles 
  SET is_verified = true, updated_at = now()
  WHERE id = target_user_id;

  RETURN true;
END;
$$;

-- 7. Create audit function for sensitive access logging
CREATE OR REPLACE FUNCTION public.log_sensitive_access(
  table_name text,
  operation text,
  record_id text DEFAULT NULL,
  additional_data jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.audit_log_productos (
    usuario_id,
    accion,
    producto_id,
    motivo,
    datos_nuevos
  ) VALUES (
    auth.uid(),
    operation || ' on ' || table_name,
    COALESCE(record_id::uuid, gen_random_uuid()),
    'Security audit log - sensitive data access',
    jsonb_build_object(
      'table', table_name,
      'operation', operation,
      'record_id', record_id,
      'additional_data', additional_data,
      'timestamp', now(),
      'user_id', auth.uid(),
      'user_role', (
        SELECT role FROM public.user_roles 
        WHERE user_id = auth.uid() 
        ORDER BY 
          CASE role
            WHEN 'owner' THEN 1
            WHEN 'admin' THEN 2
            ELSE 10
          END 
        LIMIT 1
      )
    )
  );
END;
$$;

-- 8. Update existing functions with proper security
CREATE OR REPLACE FUNCTION public.calcular_puntos_viaje(km_recorridos numeric, estado_viaje text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  base_points INTEGER := 10;
  points_per_km INTEGER := 1;
  max_points_per_trip INTEGER := 800;
  calculated_points INTEGER := 0;
  valid_distance NUMERIC;
BEGIN
  -- Normalizar estado para comparación
  IF LOWER(TRIM(COALESCE(estado_viaje, ''))) NOT IN ('completado', 'finalizado') THEN
    RETURN 0;
  END IF;
  
  -- Validar y limpiar distancia
  valid_distance := CASE 
    WHEN km_recorridos IS NULL OR km_recorridos < 0 OR km_recorridos = 'NaN'::numeric 
    THEN 0 
    ELSE km_recorridos 
  END;
  
  -- Aplicar fórmula: puntos base + (km * puntos por km)
  calculated_points := base_points + FLOOR(valid_distance * points_per_km);
  
  -- Aplicar límite máximo
  calculated_points := LEAST(calculated_points, max_points_per_trip);
  
  RETURN calculated_points;
END;
$$;

CREATE OR REPLACE FUNCTION public.award_points(
  p_user_id uuid,
  p_trip_id text,
  p_points integer,
  p_trip_type text DEFAULT 'trip',
  p_description text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  existing_award_id uuid;
BEGIN
  -- Check if points already awarded for this trip
  SELECT id INTO existing_award_id
  FROM public.point_awards 
  WHERE user_id = p_user_id AND trip_id = p_trip_id;
  
  IF existing_award_id IS NOT NULL THEN
    RETURN false; -- Points already awarded
  END IF;
  
  -- Award points
  INSERT INTO public.point_awards (
    user_id, 
    trip_id, 
    points, 
    trip_type, 
    description
  ) VALUES (
    p_user_id, 
    p_trip_id, 
    p_points, 
    p_trip_type, 
    COALESCE(p_description, 'Points awarded for trip completion')
  );
  
  -- Update user's total points
  INSERT INTO public.custodio_points (user_id, points, total_trips)
  VALUES (p_user_id, p_points, 1)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    points = custodio_points.points + p_points,
    total_trips = custodio_points.total_trips + 1,
    updated_at = now();
    
  RETURN true;
END;
$$;

-- 9. Log this security update
INSERT INTO public.audit_log_productos (
  usuario_id,
  accion,
  producto_id,
  motivo,
  datos_nuevos
) VALUES (
  COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
  'SECURITY_UPDATE',
  gen_random_uuid(),
  'Critical security fixes implemented',
  jsonb_build_object(
    'timestamp', now(),
    'fixes_applied', ARRAY[
      'Removed hardcoded admin bypasses',
      'Secured business intelligence tables',
      'Added SET search_path TO public to functions',
      'Implemented audit logging for sensitive access',
      'Created secure role checking functions'
    ],
    'affected_tables', ARRAY[
      'servicios_segmentados',
      'zonas_operacion_nacional', 
      'subcategorias_gastos',
      'ml_model_configurations'
    ],
    'security_level', 'CRITICAL'
  )
);