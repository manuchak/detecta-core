-- =====================================================
-- CRITICAL FIX: RLS Policy for Custodians to view their tickets
-- Uses phone number matching between profiles and custodio_telefono
-- =====================================================

-- 1. Add SELECT policy for custodians to view tickets by phone number
CREATE POLICY "custodians_view_own_tickets_by_phone"
  ON public.tickets
  FOR SELECT
  TO authenticated
  USING (
    custodio_telefono IS NOT NULL 
    AND custodio_telefono = (
      SELECT phone FROM public.profiles WHERE id = auth.uid()
    )
  );

-- 2. Add UPDATE policy for custodians to update their own tickets (for CSAT ratings)
CREATE POLICY "custodians_update_own_tickets_csat"
  ON public.tickets
  FOR UPDATE
  TO authenticated
  USING (
    custodio_telefono IS NOT NULL 
    AND custodio_telefono = (
      SELECT phone FROM public.profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    custodio_telefono IS NOT NULL 
    AND custodio_telefono = (
      SELECT phone FROM public.profiles WHERE id = auth.uid()
    )
  );

-- 3. Fix custodio_indisponibilidades RLS to use phone-based access
-- DROP existing policies first if they exist (safe drop)
DROP POLICY IF EXISTS "Custodios can insert their own indisponibilidades" ON public.custodio_indisponibilidades;
DROP POLICY IF EXISTS "Custodios can view their own indisponibilidades" ON public.custodio_indisponibilidades;

-- 4. Create phone-based INSERT policy for custodio_indisponibilidades
CREATE POLICY "custodios_insert_own_indisponibilidades"
  ON public.custodio_indisponibilidades
  FOR INSERT
  TO authenticated
  WITH CHECK (
    custodio_id IN (
      -- Allow if phone matches via custodios_operativos
      SELECT co.id FROM public.custodios_operativos co
      INNER JOIN public.profiles p ON co.telefono = p.phone
      WHERE p.id = auth.uid()
    )
  );

-- 5. Create phone-based SELECT policy for custodio_indisponibilidades
CREATE POLICY "custodios_view_own_indisponibilidades"
  ON public.custodio_indisponibilidades
  FOR SELECT
  TO authenticated
  USING (
    custodio_id IN (
      SELECT co.id FROM public.custodios_operativos co
      INNER JOIN public.profiles p ON co.telefono = p.phone
      WHERE p.id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner', 'supply_admin', 'monitoring_supervisor')
    )
  );

-- 6. Add UPDATE policy for custodio_indisponibilidades (to cancel/resolve)
DROP POLICY IF EXISTS "custodios_update_own_indisponibilidades" ON public.custodio_indisponibilidades;
CREATE POLICY "custodios_update_own_indisponibilidades"
  ON public.custodio_indisponibilidades
  FOR UPDATE
  TO authenticated
  USING (
    custodio_id IN (
      SELECT co.id FROM public.custodios_operativos co
      INNER JOIN public.profiles p ON co.telefono = p.phone
      WHERE p.id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner', 'supply_admin', 'monitoring_supervisor')
    )
  )
  WITH CHECK (
    custodio_id IN (
      SELECT co.id FROM public.custodios_operativos co
      INNER JOIN public.profiles p ON co.telefono = p.phone
      WHERE p.id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner', 'supply_admin', 'monitoring_supervisor')
    )
  );