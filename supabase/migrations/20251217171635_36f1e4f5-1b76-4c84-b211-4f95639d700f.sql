-- Fix calendario_feriados_mx RLS policy to restrict access to authenticated users only
-- The table contains business intelligence (factor_ajuste, impacto_observado_pct) that shouldn't be public

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Feriados públicos para lectura" ON public.calendario_feriados_mx;

-- Create new policy allowing only authenticated users to read
CREATE POLICY "Feriados visibles para usuarios autenticados"
ON public.calendario_feriados_mx
FOR SELECT
TO authenticated
USING (true);

-- Note: The "Solo admin puede modificar feriados" policy for INSERT/UPDATE/DELETE remains unchanged
-- as it correctly restricts modifications to admin/owner roles