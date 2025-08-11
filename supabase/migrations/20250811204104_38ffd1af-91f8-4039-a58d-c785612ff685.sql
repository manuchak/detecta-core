-- Re-apply role_permissions RLS policies (previous attempt rolled back due to function error)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'role_permissions'
  ) THEN
    EXECUTE 'ALTER TABLE IF EXISTS public.role_permissions ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS public.role_permissions FORCE ROW LEVEL SECURITY';

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'role_permissions' AND policyname = 'role_permissions_select_admins'
    ) THEN
      EXECUTE 'CREATE POLICY role_permissions_select_admins ON public.role_permissions FOR SELECT TO authenticated USING (public.is_admin_user_secure() OR public.user_has_role_direct(''owner''))';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'role_permissions' AND policyname = 'role_permissions_select_self_role'
    ) THEN
      EXECUTE 'CREATE POLICY role_permissions_select_self_role ON public.role_permissions FOR SELECT TO authenticated USING (role = public.get_current_user_role_secure())';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'role_permissions' AND policyname = 'role_permissions_modify_admins'
    ) THEN
      EXECUTE 'CREATE POLICY role_permissions_modify_admins ON public.role_permissions FOR ALL TO authenticated USING (public.is_admin_user_secure() OR public.user_has_role_direct(''owner'')) WITH CHECK (public.is_admin_user_secure() OR public.user_has_role_direct(''owner''))';
    END IF;
  END IF;
END $$;