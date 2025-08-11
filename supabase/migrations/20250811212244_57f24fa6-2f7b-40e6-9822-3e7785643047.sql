DO $$
DECLARE pol record;
BEGIN
  -- Ensure helper exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'can_view_financial_data'
  ) THEN
    EXECUTE 'CREATE FUNCTION public.can_view_financial_data() RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''public'' AS $$ BEGIN RETURN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN (''admin'',''owner'',''bi'',''supply_admin'',''manager'')); END; $$;';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema=''public'' AND table_name=''gastos_externos''
  ) THEN
    -- Enable RLS
    EXECUTE 'ALTER TABLE public.gastos_externos ENABLE ROW LEVEL SECURITY';

    -- Drop existing policies
    FOR pol IN 
      SELECT policyname FROM pg_policies 
      WHERE schemaname='public' AND tablename='gastos_externos'
    LOOP
      EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.gastos_externos';
    END LOOP;

    -- Create policies
    EXECUTE 'CREATE POLICY gastos_externos_select_finance ON public.gastos_externos FOR SELECT USING (public.can_view_financial_data())';

    EXECUTE 'CREATE POLICY gastos_externos_insert_admin ON public.gastos_externos FOR INSERT WITH CHECK (public.is_admin_user_secure())';

    EXECUTE 'CREATE POLICY gastos_externos_update_admin ON public.gastos_externos FOR UPDATE USING (public.is_admin_user_secure()) WITH CHECK (public.is_admin_user_secure())';

    EXECUTE 'CREATE POLICY gastos_externos_delete_admin ON public.gastos_externos FOR DELETE USING (public.is_admin_user_secure())';
  END IF;
END$$;