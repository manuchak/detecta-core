-- Phase 1: Critical Database Security Fixes
-- Fix function search path vulnerabilities by adding SET search_path TO 'public'

-- Fix get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
  user_email text;
  found_role text;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Check if user is admin@admin.com
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  IF user_email = 'admin@admin.com' THEN
    RETURN 'admin';
  END IF;
  
  -- Get user role
  SELECT role INTO found_role
  FROM public.user_roles
  WHERE user_id = current_user_id
  ORDER BY
    CASE role
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'supply_admin' THEN 3
      WHEN 'bi' THEN 4
      WHEN 'monitoring_supervisor' THEN 5
      WHEN 'monitoring' THEN 6
      WHEN 'supply' THEN 7
      WHEN 'soporte' THEN 8
      WHEN 'pending' THEN 9
      WHEN 'unverified' THEN 10
      ELSE 11
    END
  LIMIT 1;
  
  RETURN COALESCE(found_role, 'unverified');
END;
$function$;

-- Fix is_admin_user_secure function
CREATE OR REPLACE FUNCTION public.is_admin_user_secure()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
  user_email text;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user is admin@admin.com
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  IF user_email = 'admin@admin.com' THEN
    RETURN true;
  END IF;
  
  -- Check user roles
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = current_user_id 
    AND role IN ('admin', 'owner')
  );
END;
$function$;

-- Fix user_has_role_secure function
CREATE OR REPLACE FUNCTION public.user_has_role_secure(check_role text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
  user_email text;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user is admin@admin.com and requested role is admin
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  IF user_email = 'admin@admin.com' AND check_role = 'admin' THEN
    RETURN true;
  END IF;
  
  -- Check user roles
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = current_user_id 
    AND role = check_role
  );
END;
$function$;

-- Add role change auditing table
CREATE TABLE IF NOT EXISTS public.role_change_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id uuid NOT NULL,
  target_user_email text NOT NULL,
  old_role text,
  new_role text NOT NULL,
  changed_by uuid NOT NULL,
  change_reason text,
  approved_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on role_change_audit
ALTER TABLE public.role_change_audit ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for role_change_audit
CREATE POLICY "Admins can view role change audit" ON public.role_change_audit
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

CREATE POLICY "Only admins can create audit records" ON public.role_change_audit
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

-- Create secure role assignment function with auditing
CREATE OR REPLACE FUNCTION public.assign_user_role_secure(
  target_user_id uuid, 
  new_role text,
  change_reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
  target_email text;
  old_role text;
BEGIN
  current_user_id := auth.uid();
  
  -- Verify admin privileges
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = current_user_id 
    AND role IN ('admin', 'owner')
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Validate role
  IF new_role NOT IN ('admin', 'owner', 'supply_admin', 'bi', 'monitoring_supervisor', 
                      'monitoring', 'supply', 'soporte', 'custodio', 'pending', 'unverified') THEN
    RAISE EXCEPTION 'Invalid role specified: %', new_role;
  END IF;

  -- Get target user email and current role
  SELECT email INTO target_email 
  FROM auth.users 
  WHERE id = target_user_id;
  
  IF target_email IS NULL THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;

  SELECT role INTO old_role
  FROM public.user_roles
  WHERE user_id = target_user_id
  LIMIT 1;

  -- Prevent self-demotion from admin/owner
  IF current_user_id = target_user_id AND 
     old_role IN ('admin', 'owner') AND 
     new_role NOT IN ('admin', 'owner') THEN
    RAISE EXCEPTION 'Cannot demote yourself from admin/owner role';
  END IF;

  -- Create audit record
  INSERT INTO public.role_change_audit (
    target_user_id,
    target_user_email,
    old_role,
    new_role,
    changed_by,
    change_reason
  ) VALUES (
    target_user_id,
    target_email,
    old_role,
    new_role,
    current_user_id,
    change_reason
  );

  -- Remove existing roles
  DELETE FROM public.user_roles WHERE user_id = target_user_id;

  -- Assign new role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, new_role);

  RETURN true;
END;
$function$;

-- Add input validation function
CREATE OR REPLACE FUNCTION public.validate_input_text(input_text text, max_length integer DEFAULT 255)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $function$
BEGIN
  IF input_text IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Remove potentially dangerous characters
  input_text := regexp_replace(input_text, '[<>\"''%;()&+]', '', 'g');
  
  -- Trim and limit length
  input_text := trim(input_text);
  
  IF length(input_text) > max_length THEN
    input_text := left(input_text, max_length);
  END IF;
  
  RETURN input_text;
END;
$function$;

-- Update role_permissions policies to be more restrictive
DROP POLICY IF EXISTS "Enable read access for all users" ON public.role_permissions;

CREATE POLICY "Only authenticated users can view permissions" ON public.role_permissions
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Add session validation function
CREATE OR REPLACE FUNCTION public.validate_user_session()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
  session_valid boolean := false;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user still exists and is active
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = current_user_id
    AND (email_confirmed_at IS NOT NULL OR raw_user_meta_data->>'email_verified' = 'true')
  ) INTO session_valid;
  
  RETURN session_valid;
END;
$function$;