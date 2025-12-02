-- Fix SECURITY DEFINER view: v_liberacion_metrics
-- Change to SECURITY INVOKER so RLS policies are respected

ALTER VIEW public.v_liberacion_metrics SET (security_invoker = true);