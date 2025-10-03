-- ============================================
-- SECURITY FIX: Rewards Table RLS Policies
-- ============================================
-- Eliminar todas las políticas SELECT demasiado permisivas que exponen
-- información de recompensas a usuarios no autenticados o de forma indiscriminada

-- 1. Eliminar política que permite acceso anónimo (CRÍTICO)
DROP POLICY IF EXISTS "Anyone can view rewards" ON public.rewards;

-- 2. Eliminar políticas redundantes que permiten acceso sin restricción
DROP POLICY IF EXISTS "Todos pueden ver las recompensas" ON public.rewards;
DROP POLICY IF EXISTS "rewards_select_all" ON public.rewards;
DROP POLICY IF EXISTS "rewards_select_policy" ON public.rewards;
DROP POLICY IF EXISTS "rewards_authenticated_read_new" ON public.rewards;
DROP POLICY IF EXISTS "rewards_authenticated_access" ON public.rewards;

-- 3. Crear política única y segura para lectura de recompensas
-- Solo usuarios autenticados (custodios o personal interno) pueden ver recompensas
CREATE POLICY "rewards_authenticated_users_only"
ON public.rewards
FOR SELECT
TO authenticated
USING (
  -- El usuario debe estar autenticado
  auth.uid() IS NOT NULL
);

-- 4. Verificar que las políticas de administración están correctas
-- Estas políticas ya existen y son seguras, las dejamos intactas:
-- - "Administradores pueden gestionar recompensas"
-- - "Admins pueden gestionar recompensas" 
-- - "rewards_admin_manage_new"
-- - "rewards_insert_policy"
-- - "rewards_update_policy"
-- - "rewards_delete_policy"
-- - "Only admins can modify rewards"

-- 5. Comentario de auditoría
COMMENT ON POLICY "rewards_authenticated_users_only" ON public.rewards IS 
  'Security fix: Restricts rewards viewing to authenticated users only. Prevents public exposure of reward details that could be used for social engineering or phishing attacks.';