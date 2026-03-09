CREATE POLICY "monitoring_read_monitoring_roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  has_monitoring_role()
  AND role IN ('monitoring', 'monitoring_supervisor')
);