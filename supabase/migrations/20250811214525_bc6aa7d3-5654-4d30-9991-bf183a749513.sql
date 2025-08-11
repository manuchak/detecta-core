-- Helper: who can access call logs
CREATE OR REPLACE FUNCTION public.can_access_call_logs()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin','owner','manager','ejecutivo_ventas')
  );
END;
$$;

-- Secure manual_call_logs with RLS and least-privilege policies
DO $$
DECLARE pol record;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='manual_call_logs'
  ) THEN
    -- Enable RLS
    EXECUTE 'ALTER TABLE public.manual_call_logs ENABLE ROW LEVEL SECURITY';

    -- Drop existing policies
    FOR pol IN 
      SELECT policyname FROM pg_policies 
      WHERE schemaname='public' AND tablename='manual_call_logs'
    LOOP
      EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.manual_call_logs';
    END LOOP;

    -- Read access: sales roles and admins only
    EXECUTE 'CREATE POLICY manual_call_logs_select_sales ON public.manual_call_logs FOR SELECT USING (public.can_access_call_logs())';

    -- Insert: sales managers and admins
    EXECUTE 'CREATE POLICY manual_call_logs_insert_sales ON public.manual_call_logs FOR INSERT WITH CHECK (public.is_admin_user_secure() OR public.user_has_role_direct(''ejecutivo_ventas'') OR public.user_has_role_direct(''manager''))';

    -- Update: sales managers and admins
    EXECUTE 'CREATE POLICY manual_call_logs_update_sales ON public.manual_call_logs FOR UPDATE USING (public.is_admin_user_secure() OR public.user_has_role_direct(''ejecutivo_ventas'') OR public.user_has_role_direct(''manager'')) WITH CHECK (public.is_admin_user_secure() OR public.user_has_role_direct(''ejecutivo_ventas'') OR public.user_has_role_direct(''manager''))';

    -- Delete: admins/owners only
    EXECUTE 'CREATE POLICY manual_call_logs_delete_admin ON public.manual_call_logs FOR DELETE USING (public.is_admin_user_secure())';
  END IF;
END$$;