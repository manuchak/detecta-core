-- Create a centralized permission check for sensitive KPIs (recruitment/financial)
CREATE OR REPLACE FUNCTION public.can_view_sensitive_kpis()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Must be authenticated
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  -- Always allow the seed admin user if present
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND email = 'admin@admin.com'
  ) THEN
    RETURN true;
  END IF;

  -- Allow authorized roles only
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'owner',
        'admin',
        'manager',
        'bi',
        'supply_admin',
        'supply_lead',
        'coordinador_operaciones'
      )
  );
END;
$$;

-- Tighten access to ROI tracking (highly sensitive)
ALTER TABLE public.custodios_roi_tracking ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to read custodios ROI tracking" ON public.custodios_roi_tracking;
CREATE POLICY "sensitive_kpis_read_custodios_roi_tracking"
ON public.custodios_roi_tracking
FOR SELECT
USING (public.can_view_sensitive_kpis());

-- Tighten access to rotation tracking used in executive dashboards
ALTER TABLE public.custodios_rotacion_tracking ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to read rotation tracking" ON public.custodios_rotacion_tracking;
DROP POLICY IF EXISTS "Allow read custodios_rotacion_tracking" ON public.custodios_rotacion_tracking;
CREATE POLICY "sensitive_kpis_read_custodios_rotacion_tracking"
ON public.custodios_rotacion_tracking
FOR SELECT
USING (public.can_view_sensitive_kpis());