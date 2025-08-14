-- Security fix: Secure zonas_operacion_nacional table
-- This table contains sensitive business intelligence that should not be publicly accessible

-- Enable RLS on zonas_operacion_nacional if not already enabled
ALTER TABLE public.zonas_operacion_nacional ENABLE ROW LEVEL SECURITY;

-- Drop any existing permissive policies that might allow public access
DROP POLICY IF EXISTS "zonas_operacion_nacional_public_read" ON public.zonas_operacion_nacional;
DROP POLICY IF EXISTS "public_read_zonas" ON public.zonas_operacion_nacional;

-- Create secure read policy for authenticated users with appropriate roles
CREATE POLICY "zonas_operacion_read_restricted" 
ON public.zonas_operacion_nacional 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    check_admin_secure() OR 
    user_has_role_direct('supply_admin') OR 
    user_has_role_direct('coordinador_operaciones') OR
    user_has_role_direct('bi') OR
    user_has_role_direct('ejecutivo_ventas') OR
    user_has_role_direct('supply_lead')
  )
);

-- Create secure insert/update/delete policies for admin roles only
CREATE POLICY "zonas_operacion_admin_manage" 
ON public.zonas_operacion_nacional 
FOR ALL 
USING (
  check_admin_secure() OR 
  user_has_role_direct('supply_admin') OR 
  user_has_role_direct('coordinador_operaciones')
)
WITH CHECK (
  check_admin_secure() OR 
  user_has_role_direct('supply_admin') OR 
  user_has_role_direct('coordinador_operaciones')
);

-- Add audit logging function for sensitive data access
CREATE OR REPLACE FUNCTION public.log_sensitive_access(
  table_name text,
  operation text,
  record_id uuid DEFAULT NULL,
  additional_data jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO audit_log_productos (
    usuario_id,
    accion,
    producto_id,
    motivo,
    datos_nuevos,
    direccion_ip
  ) VALUES (
    auth.uid(),
    operation || ' on ' || table_name,
    COALESCE(record_id, gen_random_uuid()),
    'Security audit - sensitive data access',
    jsonb_build_object(
      'table', table_name,
      'operation', operation,
      'user_role', (SELECT role FROM user_roles WHERE user_id = auth.uid() LIMIT 1),
      'timestamp', now(),
      'additional_data', additional_data
    ),
    inet_client_addr()
  );
END;
$$;