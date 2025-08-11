-- Secure servicios_custodia table: enable RLS and add least-privilege policies

-- 0) Drop existing policies to remove public access if any
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'servicios_custodia'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.servicios_custodia', pol.policyname);
  END LOOP;
END $$;

-- 1) Enable RLS
ALTER TABLE public.servicios_custodia ENABLE ROW LEVEL SECURITY;

-- 2) Policies

-- 2.a) SELECT: Admins and operations roles can read all rows
CREATE POLICY servicios_custodia_select_admin_ops
ON public.servicios_custodia
FOR SELECT
TO authenticated
USING (
  public.is_admin_user_secure()
  OR public.user_has_role_direct('owner')
  OR public.user_has_role_direct('manager')
  OR public.user_has_role_direct('supply_admin')
  OR public.user_has_role_direct('supply_lead')
  OR public.user_has_role_direct('coordinador_operaciones')
  OR public.user_has_role_direct('jefe_seguridad')
  OR public.user_has_role_direct('analista_seguridad')
  OR public.user_has_role_direct('monitoring_supervisor')
  OR public.user_has_role_direct('monitoring')
  OR public.user_has_role_direct('bi')
);

-- 2.b) SELECT: Custodios can read only their own rows (by id_custodio or profile phone match)
CREATE POLICY servicios_custodia_select_self
ON public.servicios_custodia
FOR SELECT
TO authenticated
USING (
  -- Match by id_custodio equals current user
  (id_custodio IS NOT NULL AND id_custodio = auth.uid()::text)
  OR 
  -- Match by phone numbers recorded on the profile
  (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
        AND p.phone IS NOT NULL 
        AND (telefono = p.phone OR telefono_operador = p.phone)
    )
  )
);

-- 2.c) INSERT: Only admins and operations roles can insert
CREATE POLICY servicios_custodia_insert_admin_ops
ON public.servicios_custodia
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin_user_secure()
  OR public.user_has_role_direct('owner')
  OR public.user_has_role_direct('manager')
  OR public.user_has_role_direct('supply_admin')
  OR public.user_has_role_direct('supply_lead')
  OR public.user_has_role_direct('coordinador_operaciones')
  OR public.user_has_role_direct('jefe_seguridad')
  OR public.user_has_role_direct('analista_seguridad')
  OR public.user_has_role_direct('monitoring_supervisor')
  OR public.user_has_role_direct('monitoring')
);

-- 2.d) UPDATE: Only admins and operations roles can update
CREATE POLICY servicios_custodia_update_admin_ops
ON public.servicios_custodia
FOR UPDATE
TO authenticated
USING (
  public.is_admin_user_secure()
  OR public.user_has_role_direct('owner')
  OR public.user_has_role_direct('manager')
  OR public.user_has_role_direct('supply_admin')
  OR public.user_has_role_direct('supply_lead')
  OR public.user_has_role_direct('coordinador_operaciones')
  OR public.user_has_role_direct('jefe_seguridad')
  OR public.user_has_role_direct('analista_seguridad')
  OR public.user_has_role_direct('monitoring_supervisor')
  OR public.user_has_role_direct('monitoring')
)
WITH CHECK (
  public.is_admin_user_secure()
  OR public.user_has_role_direct('owner')
  OR public.user_has_role_direct('manager')
  OR public.user_has_role_direct('supply_admin')
  OR public.user_has_role_direct('supply_lead')
  OR public.user_has_role_direct('coordinador_operaciones')
  OR public.user_has_role_direct('jefe_seguridad')
  OR public.user_has_role_direct('analista_seguridad')
  OR public.user_has_role_direct('monitoring_supervisor')
  OR public.user_has_role_direct('monitoring')
);

-- 2.e) DELETE: Only admins and operations roles can delete
CREATE POLICY servicios_custodia_delete_admin_ops
ON public.servicios_custodia
FOR DELETE
TO authenticated
USING (
  public.is_admin_user_secure()
  OR public.user_has_role_direct('owner')
  OR public.user_has_role_direct('manager')
  OR public.user_has_role_direct('supply_admin')
  OR public.user_has_role_direct('supply_lead')
  OR public.user_has_role_direct('coordinador_operaciones')
  OR public.user_has_role_direct('jefe_seguridad')
  OR public.user_has_role_direct('analista_seguridad')
  OR public.user_has_role_direct('monitoring_supervisor')
  OR public.user_has_role_direct('monitoring')
);
