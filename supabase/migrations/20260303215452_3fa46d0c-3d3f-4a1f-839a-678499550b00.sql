
-- RLS policies for customer_success role on CS module tables

-- 1. pc_clientes — SELECT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'pc_clientes' AND policyname = 'customer_success_select_pc_clientes'
  ) THEN
    CREATE POLICY "customer_success_select_pc_clientes"
      ON public.pc_clientes
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid()
            AND role IN ('admin', 'owner', 'customer_success', 'ejecutivo_ventas', 'coordinador_operaciones')
        )
      );
  END IF;
END$$;

-- 2. cs_quejas — SELECT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cs_quejas' AND policyname = 'customer_success_select_cs_quejas'
  ) THEN
    CREATE POLICY "customer_success_select_cs_quejas"
      ON public.cs_quejas
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid()
            AND role IN ('admin', 'owner', 'customer_success', 'ejecutivo_ventas', 'coordinador_operaciones')
        )
      );
  END IF;
END$$;

-- 3. cs_touchpoints — SELECT, INSERT, UPDATE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cs_touchpoints' AND policyname = 'customer_success_select_cs_touchpoints'
  ) THEN
    CREATE POLICY "customer_success_select_cs_touchpoints"
      ON public.cs_touchpoints
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid()
            AND role IN ('admin', 'owner', 'customer_success', 'ejecutivo_ventas', 'coordinador_operaciones')
        )
      );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cs_touchpoints' AND policyname = 'customer_success_insert_cs_touchpoints'
  ) THEN
    CREATE POLICY "customer_success_insert_cs_touchpoints"
      ON public.cs_touchpoints
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid()
            AND role IN ('admin', 'owner', 'customer_success')
        )
      );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cs_touchpoints' AND policyname = 'customer_success_update_cs_touchpoints'
  ) THEN
    CREATE POLICY "customer_success_update_cs_touchpoints"
      ON public.cs_touchpoints
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid()
            AND role IN ('admin', 'owner', 'customer_success')
        )
      );
  END IF;
END$$;

-- 4. servicios_custodia — SELECT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'servicios_custodia' AND policyname = 'customer_success_select_servicios_custodia'
  ) THEN
    CREATE POLICY "customer_success_select_servicios_custodia"
      ON public.servicios_custodia
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid()
            AND role IN ('admin', 'owner', 'customer_success', 'ejecutivo_ventas', 'coordinador_operaciones')
        )
      );
  END IF;
END$$;

-- 5. servicios_planificados — SELECT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'servicios_planificados' AND policyname = 'customer_success_select_servicios_planificados'
  ) THEN
    CREATE POLICY "customer_success_select_servicios_planificados"
      ON public.servicios_planificados
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid()
            AND role IN ('admin', 'owner', 'customer_success', 'ejecutivo_ventas', 'coordinador_operaciones')
        )
      );
  END IF;
END$$;
