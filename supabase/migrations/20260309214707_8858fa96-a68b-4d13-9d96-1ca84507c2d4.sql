-- 1. Helper function to get monitoring user IDs (avoids RLS recursion on user_roles)
CREATE OR REPLACE FUNCTION public.get_monitoring_user_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id FROM public.user_roles
  WHERE role IN ('monitoring', 'monitoring_supervisor', 'coordinador_operaciones');
$$;

-- 2. Allow monitoring staff to read profiles of other monitoring users
CREATE POLICY "monitoring_read_monitoring_profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  has_monitoring_role()
  AND id IN (SELECT public.get_monitoring_user_ids())
);

-- 3. Add column for incoming monitorist signature
ALTER TABLE public.bitacora_entregas_turno
ADD COLUMN IF NOT EXISTS firma_entrante_data_url text;