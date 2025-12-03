-- Fix security invoker for new view
ALTER VIEW v_capacitacion_progreso_candidato SET (security_invoker = true);