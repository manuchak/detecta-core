-- Fix v_ticket_agent_workload view to use security_invoker
-- This ensures the view uses the querying user's permissions (RLS) instead of the view creator's

-- First drop the existing view
DROP VIEW IF EXISTS public.v_ticket_agent_workload;

-- Recreate with security_invoker = true (same definition, just adding the security option)
CREATE VIEW public.v_ticket_agent_workload
WITH (security_invoker = true)
AS
SELECT 
    p.id AS agent_id,
    p.display_name,
    p.email,
    ur.role,
    COALESCE(count(t.id) FILTER (WHERE t.status = ANY (ARRAY['abierto'::text, 'en_progreso'::text])), 0::bigint) AS tickets_activos,
    COALESCE(count(t.id) FILTER (WHERE t.status = 'abierto'::text), 0::bigint) AS tickets_abiertos,
    COALESCE(count(t.id) FILTER (WHERE t.status = 'en_progreso'::text), 0::bigint) AS tickets_en_progreso,
    COALESCE(avg(EXTRACT(epoch FROM now() - t.created_at) / 3600::numeric) FILTER (WHERE t.status = ANY (ARRAY['abierto'::text, 'en_progreso'::text])), 0::numeric)::numeric(10,2) AS avg_age_hours
FROM profiles p
JOIN user_roles ur ON p.id = ur.user_id AND ur.is_active = true
LEFT JOIN tickets t ON t.assigned_to = p.id AND (t.status = ANY (ARRAY['abierto'::text, 'en_progreso'::text]))
WHERE ur.role = ANY (ARRAY['admin'::text, 'owner'::text, 'supply_admin'::text, 'supply_lead'::text, 'soporte'::text])
GROUP BY p.id, p.display_name, p.email, ur.role
ORDER BY (COALESCE(count(t.id) FILTER (WHERE t.status = ANY (ARRAY['abierto'::text, 'en_progreso'::text])), 0::bigint)), p.display_name;

-- Re-grant permissions to authenticated users
GRANT SELECT ON public.v_ticket_agent_workload TO authenticated;
GRANT SELECT ON public.v_ticket_agent_workload TO service_role;

-- Revoke anon access (security hardening - this view was previously accessible to anonymous users)
REVOKE ALL ON public.v_ticket_agent_workload FROM anon;