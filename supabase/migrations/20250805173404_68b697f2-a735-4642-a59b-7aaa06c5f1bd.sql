-- CRITICAL SECURITY FIXES - Phase 1
-- Fix search_path vulnerabilities in security definer functions

-- 1. Fix existing security definer functions that lack proper search_path
CREATE OR REPLACE FUNCTION public.es_usuario_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = $1 AND (role = 'admin' OR role = 'owner' OR role = 'manager')
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.verificar_admin_seguro(check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id 
    AND (role = 'admin' OR role = 'owner' OR role = 'manager')
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_users_with_roles_for_admin()
RETURNS TABLE(user_id uuid, email text, role text, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_admin_user_secure() THEN
    RAISE EXCEPTION 'Sin permisos para ver esta información';
  END IF;

  RETURN QUERY
  SELECT 
    ur.user_id,
    au.email,
    ur.role,
    ur.created_at
  FROM public.user_roles ur
  JOIN auth.users au ON ur.user_id = au.id
  ORDER BY au.email;
END;
$function$;

CREATE OR REPLACE FUNCTION public.user_has_role_direct(role_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = current_user_id AND role = role_name
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.verify_user_role(role_to_check text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role = role_to_check
  );
$function$;

CREATE OR REPLACE FUNCTION public.has_role(user_uid uuid, required_role text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = user_uid AND role = required_role
    );
$function$;

-- 2. Create secure admin check function without hardcoded email bypasses
CREATE OR REPLACE FUNCTION public.is_admin_secure()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Only check roles, no hardcoded email bypasses
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = current_user_id 
    AND role IN ('admin', 'owner')
  );
END;
$function$;

-- 3. Create secure role checking functions
CREATE OR REPLACE FUNCTION public.has_management_role()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = current_user_id 
    AND role IN ('admin', 'owner', 'supply_admin', 'coordinador_operaciones', 'jefe_seguridad')
  );
END;
$function$;

-- 4. Create input validation function
CREATE OR REPLACE FUNCTION public.validate_role_input(role_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate role is in allowed list
  IF role_name NOT IN (
    'owner', 'admin', 'supply_admin', 'coordinador_operaciones', 'jefe_seguridad',
    'analista_seguridad', 'supply_lead', 'ejecutivo_ventas', 'custodio',
    'bi', 'monitoring_supervisor', 'monitoring', 'supply', 'instalador',
    'soporte', 'pending', 'unverified'
  ) THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$function$;

-- 5. Strengthen some critical RLS policies
-- Fix overly permissive candidatos_custodios policy
DROP POLICY IF EXISTS "Allow read candidatos_custodios" ON candidatos_custodios;
DROP POLICY IF EXISTS "candidatos_all_read" ON candidatos_custodios;

CREATE POLICY "candidatos_authenticated_read" 
ON candidatos_custodios 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    public.has_management_role() OR 
    public.user_has_role_direct('supply_lead') OR
    public.user_has_role_direct('ejecutivo_ventas')
  )
);

-- Fix benefits policy - only authenticated users should see internal benefits
DROP POLICY IF EXISTS "Benefits are publicly readable" ON benefits;

CREATE POLICY "benefits_authenticated_read" 
ON benefits 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 6. Add audit logging for critical operations
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  target_user_id uuid,
  old_value jsonb,
  new_value jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "audit_log_admin_read" 
ON security_audit_log 
FOR SELECT 
USING (public.is_admin_secure());

-- System can insert audit logs
CREATE POLICY "audit_log_system_insert" 
ON security_audit_log 
FOR INSERT 
WITH CHECK (true);

-- 7. Create secure role assignment function with audit logging
CREATE OR REPLACE FUNCTION public.assign_role_secure(
  target_user_id uuid,
  new_role text,
  audit_reason text DEFAULT 'Role assignment'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
  old_role text;
BEGIN
  current_user_id := auth.uid();
  
  -- Security checks
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  IF NOT public.is_admin_secure() THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;
  
  -- Validate input
  IF NOT public.validate_role_input(new_role) THEN
    RAISE EXCEPTION 'Invalid role specified';
  END IF;
  
  -- Get current role for audit
  SELECT role INTO old_role 
  FROM public.user_roles 
  WHERE user_id = target_user_id 
  LIMIT 1;
  
  -- Prevent admin from removing their own admin access
  IF current_user_id = target_user_id AND 
     old_role IN ('admin', 'owner') AND 
     new_role NOT IN ('admin', 'owner') THEN
    RAISE EXCEPTION 'Cannot remove your own admin privileges';
  END IF;
  
  -- Update role
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (target_user_id, new_role);
  
  -- Audit log
  INSERT INTO public.security_audit_log (
    user_id, action, target_user_id, old_value, new_value
  ) VALUES (
    current_user_id, 
    'role_change',
    target_user_id,
    jsonb_build_object('role', old_role, 'reason', audit_reason),
    jsonb_build_object('role', new_role, 'reason', audit_reason)
  );
  
  RETURN true;
END;
$function$;