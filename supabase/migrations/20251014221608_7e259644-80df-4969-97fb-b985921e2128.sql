-- Fix: Corregir tipo de dato en get_analyst_assigned_leads_v2
-- La columna zona_nombre debe ser character varying(100) para coincidir con zonas_operacion_nacional.nombre

DROP FUNCTION IF EXISTS public.get_analyst_assigned_leads_v2(boolean);

CREATE OR REPLACE FUNCTION public.get_analyst_assigned_leads_v2(p_is_test boolean DEFAULT false)
RETURNS TABLE (
  lead_id text,
  nombre text,
  email text,
  telefono text,
  empresa text,
  mensaje text,
  fuente text,
  lead_estado text,
  fecha_creacion timestamp with time zone,
  fecha_contacto timestamp with time zone,
  notas text,
  asignado_a uuid,
  analista_nombre text,
  analista_email text,
  zona_nombre character varying(100),  -- ✅ Corregido: varchar(100) en lugar de text
  zona_id uuid,
  fecha_aprobacion timestamp with time zone,
  fecha_psicometricos timestamp with time zone,
  fecha_toxicologicos timestamp with time zone,
  fecha_instalacion_gps timestamp with time zone,
  fecha_activacion_custodio timestamp with time zone,
  motivo_rechazo text,
  credenciales_enviadas boolean,
  current_stage text,
  interview_method text,
  phone_interview_completed boolean,
  phone_interview_date timestamp with time zone,
  phone_interview_notes text,
  second_interview_required boolean,
  second_interview_completed boolean,
  second_interview_date timestamp with time zone,
  second_interview_notes text,
  final_decision text,
  decision_reason text,
  analista_id uuid,
  fecha_entrada_pool timestamp with time zone,
  motivo_pool text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id as lead_id,
    l.nombre,
    l.email,
    l.telefono,
    l.empresa,
    l.mensaje,
    l.fuente,
    l.estado as lead_estado,
    l.fecha_creacion,
    l.fecha_contacto,
    l.notas,
    l.asignado_a,
    p.display_name as analista_nombre,
    p.email as analista_email,
    z.nombre as zona_nombre,
    z.id as zona_id,
    l.fecha_aprobacion,
    l.fecha_psicometricos,
    l.fecha_toxicologicos,
    l.fecha_instalacion_gps,
    l.fecha_activacion_custodio,
    l.motivo_rechazo,
    l.credenciales_enviadas,
    lap.current_stage,
    lap.interview_method,
    lap.phone_interview_completed,
    lap.phone_interview_date,
    lap.phone_interview_notes,
    lap.second_interview_required,
    lap.second_interview_completed,
    lap.second_interview_date,
    lap.second_interview_notes,
    lap.final_decision,
    lap.decision_reason,
    lap.analyst_id as analista_id,
    l.fecha_entrada_pool,
    l.motivo_pool
  FROM public.leads l
  LEFT JOIN public.lead_approval_process lap ON l.id = lap.lead_id AND lap.is_test = p_is_test
  LEFT JOIN public.profiles p ON lap.analyst_id = p.id
  LEFT JOIN public.zonas_operacion_nacional z ON l.zona_preferida_id = z.id
  WHERE l.is_test = p_is_test
    AND l.asignado_a IS NOT NULL
  ORDER BY l.fecha_creacion DESC;
END;
$$;