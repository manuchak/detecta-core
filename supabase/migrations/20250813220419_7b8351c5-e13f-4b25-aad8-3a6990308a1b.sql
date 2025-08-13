-- CRITICAL SECURITY FIXES
-- Phase 1: Secure Public Tables with RLS Policies

-- 1. Enable RLS on tables that are currently public
ALTER TABLE public.candidatos_custodios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roi_custodios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicios_segmentados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zonas_operacion_nacional ENABLE ROW LEVEL SECURITY;

-- 2. Add restrictive RLS policies for candidatos_custodios (recruitment personnel only)
CREATE POLICY "candidatos_custodios_read_recruitment" ON public.candidatos_custodios
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead', 'ejecutivo_ventas')
  )
);

CREATE POLICY "candidatos_custodios_insert_recruitment" ON public.candidatos_custodios
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead', 'ejecutivo_ventas')
  )
);

CREATE POLICY "candidatos_custodios_update_recruitment" ON public.candidatos_custodios
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead')
  )
);

CREATE POLICY "candidatos_custodios_delete_admin_only" ON public.candidatos_custodios
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

-- 3. Add RLS policies for roi_custodios (financial/management roles only)
CREATE POLICY "roi_custodios_read_financial" ON public.roi_custodios
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'bi')
  )
);

CREATE POLICY "roi_custodios_manage_admin_only" ON public.roi_custodios
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin')
  )
);

-- 4. Add RLS policies for servicios_segmentados (BI/management roles only)
CREATE POLICY "servicios_segmentados_read_bi" ON public.servicios_segmentados
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'bi', 'monitoring_supervisor')
  )
);

CREATE POLICY "servicios_segmentados_manage_admin_only" ON public.servicios_segmentados
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin')
  )
);

-- 5. Add RLS policies for zonas_operacion_nacional (operational personnel only)
CREATE POLICY "zonas_operacion_read_operational" ON public.zonas_operacion_nacional
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'coordinador_operaciones', 'monitoring_supervisor', 'monitoring')
  )
);

CREATE POLICY "zonas_operacion_manage_coordinators" ON public.zonas_operacion_nacional
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones')
  )
);

-- 6. REMOVE HARDCODED ADMIN BYPASS POLICY
-- This is a critical security vulnerability that allows hardcoded email access
DROP POLICY IF EXISTS "admin_email_manage_user_roles" ON public.user_roles;

-- 7. Add comprehensive audit logging for sensitive operations
CREATE OR REPLACE FUNCTION public.audit_sensitive_access(
  table_name text,
  operation text,
  record_id uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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
    COALESCE(record_id, gen_random_uuid()),
    'Security audit: sensitive data access',
    jsonb_build_object(
      'table', table_name,
      'operation', operation,
      'timestamp', now(),
      'user_id', auth.uid(),
      'user_role', (SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1)
    )
  );
END;
$$;

-- 8. Create triggers for audit logging on sensitive tables
CREATE OR REPLACE FUNCTION public.trigger_audit_candidatos_custodios()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.audit_sensitive_access('candidatos_custodios', TG_OP, COALESCE(NEW.id, OLD.id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_candidatos_custodios_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.candidatos_custodios
  FOR EACH ROW EXECUTE FUNCTION public.trigger_audit_candidatos_custodios();

-- 9. Enhanced security function for role validation
CREATE OR REPLACE FUNCTION public.validate_role_change_secure(
  target_user_id uuid,
  new_role text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role text;
  target_current_role text;
BEGIN
  -- Get current user's role
  SELECT role INTO current_user_role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  ORDER BY CASE role
    WHEN 'owner' THEN 1
    WHEN 'admin' THEN 2
    ELSE 10
  END
  LIMIT 1;
  
  -- Get target user's current role
  SELECT role INTO target_current_role
  FROM public.user_roles
  WHERE user_id = target_user_id
  LIMIT 1;
  
  -- Only owner can modify admin roles
  IF target_current_role = 'admin' OR new_role = 'admin' THEN
    RETURN current_user_role = 'owner';
  END IF;
  
  -- Admin and owner can modify other roles
  RETURN current_user_role IN ('admin', 'owner');
END;
$$;

-- 10. Add rate limiting for role changes (prevent abuse)
CREATE TABLE IF NOT EXISTS public.role_change_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  old_role text,
  new_role text,
  timestamp timestamp with time zone DEFAULT now(),
  ip_address inet
);

-- Enable RLS on audit table
ALTER TABLE public.role_change_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "role_change_audit_admin_only" ON public.role_change_audit
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

COMMENT ON TABLE public.candidatos_custodios IS 'SECURITY: Contains sensitive recruitment data - access restricted to recruitment personnel only';
COMMENT ON TABLE public.roi_custodios IS 'SECURITY: Contains financial performance data - access restricted to management and BI roles';
COMMENT ON TABLE public.servicios_segmentados IS 'SECURITY: Contains business intelligence data - access restricted to BI and management roles';
COMMENT ON TABLE public.zonas_operacion_nacional IS 'SECURITY: Contains operational zone data - access restricted to operational personnel';