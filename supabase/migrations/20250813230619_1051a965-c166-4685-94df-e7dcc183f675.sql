-- CRITICAL SECURITY FIXES - Phase 1 (Updated): Database Security
-- Only create policies and updates that don't already exist

-- 1. Secure tables that may not have RLS policies yet (check if exists first)

-- Drop existing policies to recreate with proper permissions (if they exist)
DROP POLICY IF EXISTS "servicios_segmentados_restricted_access" ON public.servicios_segmentados;
DROP POLICY IF EXISTS "zonas_operacion_restricted_access" ON public.zonas_operacion_nacional;
DROP POLICY IF EXISTS "subcategorias_gastos_restricted_access" ON public.subcategorias_gastos;

-- Enable RLS on tables first
ALTER TABLE public.servicios_segmentados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zonas_operacion_nacional ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategorias_gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marcas_vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modelos_vehiculos ENABLE ROW LEVEL SECURITY;

-- Secure servicios_segmentados table - restrict to BI roles only
CREATE POLICY "servicios_segmentados_bi_access" 
ON public.servicios_segmentados 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'bi')
  )
);

-- Secure zonas_operacion_nacional table - restrict to operations roles
CREATE POLICY "zonas_operacion_ops_access" 
ON public.zonas_operacion_nacional 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'bi')
  )
);

-- Secure subcategorias_gastos table - restrict to supply admin roles
CREATE POLICY "subcategorias_gastos_supply_access" 
ON public.subcategorias_gastos 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'bi')
  )
);

-- 2. Secure vehicle information tables to authenticated users only (check if exists first)
DROP POLICY IF EXISTS "marcas_vehiculos_authenticated_only" ON public.marcas_vehiculos;
DROP POLICY IF EXISTS "modelos_vehiculos_authenticated_only" ON public.modelos_vehiculos;

CREATE POLICY "marcas_vehiculos_auth_access" 
ON public.marcas_vehiculos 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "modelos_vehiculos_auth_access" 
ON public.modelos_vehiculos 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 3. Secure reward system data (check if exists first)
DROP POLICY IF EXISTS "rewards_authenticated_access" ON public.rewards;

CREATE POLICY "rewards_auth_access" 
ON public.rewards 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 4. Update remaining database functions with proper search_path

-- Fix has_role function (missing search_path)
CREATE OR REPLACE FUNCTION public.has_role(user_uuid uuid, role_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uuid 
    AND role = role_name
  );
END;
$$;

-- Fix calcular_puntos_viaje function (missing search_path)
CREATE OR REPLACE FUNCTION public.calcular_puntos_viaje(km_input numeric, estado_input text)
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  points INTEGER := 0;
BEGIN
  -- Basic validation
  IF km_input IS NULL OR km_input < 0 THEN
    RETURN 0;
  END IF;
  
  IF LOWER(TRIM(COALESCE(estado_input, ''))) NOT IN ('completado', 'finalizado') THEN
    RETURN 0;
  END IF;
  
  -- Calculate points: 10 base + 1 per km, max 800
  points := 10 + FLOOR(km_input);
  points := LEAST(points, 800);
  
  RETURN points;
END;
$$;

-- Fix award_points function (missing search_path)
CREATE OR REPLACE FUNCTION public.award_points(
  custodio_id uuid,
  trip_id text,
  points_earned integer,
  point_type text DEFAULT 'trip_completion',
  description text DEFAULT 'Points earned from trip'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update custodio points
  INSERT INTO public.custodio_points (user_id, points)
  VALUES (custodio_id, points_earned)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    points = custodio_points.points + EXCLUDED.points,
    updated_at = now();
    
  -- Log the transaction
  INSERT INTO public.point_transactions (
    user_id, 
    service_id, 
    points, 
    transaction_type, 
    description
  ) VALUES (
    custodio_id, 
    trip_id, 
    points_earned, 
    point_type, 
    description
  );
  
  RETURN true;
EXCEPTION 
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- 5. Create additional security functions for audit logging

-- Function to log sensitive data access
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
    'Sensitive data access logged',
    jsonb_build_object(
      'table', table_name,
      'operation', operation,
      'record_id', record_id,
      'additional_data', additional_data,
      'timestamp', now(),
      'user_id', auth.uid()
    )
  );
END;
$$;

-- 6. Log this security update for audit purposes
DO $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.audit_log_productos (
      usuario_id,
      accion,
      producto_id,
      motivo,
      datos_nuevos
    ) VALUES (
      auth.uid(),
      'CRITICAL_SECURITY_UPDATE',
      gen_random_uuid(),
      'Phase 1 critical security fixes applied',
      jsonb_build_object(
        'changes', 'Secured BI tables, vehicle data, rewards, updated functions with search_path',
        'timestamp', now(),
        'severity', 'critical',
        'phase', 1
      )
    );
  END IF;
END $$;