-- ============================================
-- SECURITY FIX: Business Intelligence Data Protection
-- ============================================
-- Eliminar política pública que expone datos críticos de BI

-- 1. ELIMINAR política pública (CRÍTICO)
DROP POLICY IF EXISTS "Todos pueden leer patrones temporales" ON public.patrones_demanda_temporal;

-- 2. CREAR política restrictiva para roles de negocio
-- Solo usuarios autenticados con roles específicos de negocio/BI pueden acceder
CREATE POLICY "patrones_demanda_business_roles_only"
ON public.patrones_demanda_temporal
FOR SELECT
TO authenticated
USING (
  -- Solo roles autorizados de negocio e inteligencia
  EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN (
      'admin',
      'owner',
      'manager',
      'supply_admin',
      'coordinador_operaciones',
      'bi'  -- Business Intelligence role
    )
  )
);

-- 3. Comentario de auditoría
COMMENT ON POLICY "patrones_demanda_business_roles_only" ON public.patrones_demanda_temporal IS 
  'Security fix: Restricts temporal demand patterns to authorized business and BI roles only. Prevents competitors from accessing strategic operational intelligence including demand multipliers, seasonal patterns, and forecasting data that could be used to undercut pricing or replicate optimization strategies.';