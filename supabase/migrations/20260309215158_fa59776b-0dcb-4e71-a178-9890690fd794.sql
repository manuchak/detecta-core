
-- RPC to return monitoring staff profiles (id + display_name), bypassing RLS
CREATE OR REPLACE FUNCTION public.get_monitoring_staff_profiles()
RETURNS TABLE(id uuid, display_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.display_name
  FROM public.profiles p
  INNER JOIN public.user_roles ur ON ur.user_id = p.id
  WHERE ur.role IN ('monitoring', 'monitoring_supervisor', 'coordinador_operaciones')
    AND ur.is_active = true;
$$;
