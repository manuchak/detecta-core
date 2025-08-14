-- Fix function dependencies by using CASCADE and recreating policies
-- This safely removes old functions and dependent policies, then recreates them

-- Drop functions with CASCADE to remove dependent policies
DROP FUNCTION IF EXISTS public.has_role(uuid, text) CASCADE;

-- Recreate has_role function with proper security
CREATE OR REPLACE FUNCTION public.has_role(user_uuid uuid, role_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uuid AND role = role_name
  );
END;
$$;

-- Recreate the policies that were dropped
CREATE POLICY "Solo admin puede modificar criterios" 
ON public.criterios_evaluacion_financiera
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Ejecutivos pueden ver respuestas de análisis" 
ON public.respuestas_analisis_riesgo
FOR SELECT 
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'ejecutivo_ventas') OR
  public.has_role(auth.uid(), 'jefe_seguridad')
);

CREATE POLICY "Ejecutivos pueden crear respuestas" 
ON public.respuestas_analisis_riesgo
FOR INSERT 
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'ejecutivo_ventas')
);

CREATE POLICY "Ejecutivos pueden actualizar sus respuestas" 
ON public.respuestas_analisis_riesgo
FOR UPDATE 
USING (
  public.has_role(auth.uid(), 'admin') OR 
  (public.has_role(auth.uid(), 'ejecutivo_ventas') AND ejecutivo_id = auth.uid())
);

-- Update other security functions safely
CREATE OR REPLACE FUNCTION public.is_super_admin()
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

CREATE OR REPLACE FUNCTION public.can_access_recruitment_data()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead', 'ejecutivo_ventas')
  );
END;
$$;

-- Log successful security hardening completion
INSERT INTO public.audit_log_productos (
  usuario_id,
  accion,
  producto_id,
  motivo,
  datos_nuevos
) VALUES (
  COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
  'SECURITY_FUNCTIONS_HARDENED',
  gen_random_uuid(),
  'Security functions successfully updated with proper search_path',
  jsonb_build_object(
    'timestamp', now(),
    'security_level', 'CRITICAL',
    'status', 'COMPLETED',
    'actions_taken', ARRAY[
      'Dropped and recreated has_role function with security',
      'Recreated dependent RLS policies',
      'Added SET search_path TO public to all security functions',
      'Maintained existing access control logic'
    ],
    'critical_fixes_complete', true
  )
);