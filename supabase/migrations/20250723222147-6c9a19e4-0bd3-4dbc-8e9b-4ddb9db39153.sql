-- Implementación completa de seguimiento de contactos y notas

-- 1. Agregar columnas de seguimiento a la tabla leads
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS contact_attempts_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_contact_attempt_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS last_contact_outcome text;

-- 2. Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_leads_contact_attempts ON public.leads(contact_attempts_count);
CREATE INDEX IF NOT EXISTS idx_leads_last_contact ON public.leads(last_contact_attempt_at);
CREATE INDEX IF NOT EXISTS idx_leads_outcome ON public.leads(last_contact_outcome);

-- 3. Actualizar constraint de call_outcome para incluir nuevas opciones
ALTER TABLE public.manual_call_logs 
DROP CONSTRAINT IF EXISTS manual_call_logs_call_outcome_check;

ALTER TABLE public.manual_call_logs 
ADD CONSTRAINT manual_call_logs_call_outcome_check 
CHECK (call_outcome IN (
  'successful', 
  'reschedule_requested', 
  'no_answer', 
  'busy', 
  'voicemail', 
  'wrong_number', 
  'non_existent_number', 
  'call_failed'
));

-- 4. Crear función trigger para actualizar automáticamente las columnas de seguimiento
CREATE OR REPLACE FUNCTION public.update_lead_contact_tracking()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar columnas de seguimiento en la tabla leads
  UPDATE public.leads 
  SET 
    contact_attempts_count = (
      SELECT COUNT(*) 
      FROM public.manual_call_logs 
      WHERE lead_id = NEW.lead_id
    ),
    last_contact_attempt_at = NEW.created_at,
    last_contact_outcome = NEW.call_outcome
  WHERE id::text = NEW.lead_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Crear trigger que se ejecute al insertar o actualizar en manual_call_logs
DROP TRIGGER IF EXISTS trigger_update_lead_contact_tracking ON public.manual_call_logs;

CREATE TRIGGER trigger_update_lead_contact_tracking
  AFTER INSERT OR UPDATE ON public.manual_call_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_lead_contact_tracking();

-- 6. Función para migrar datos existentes
CREATE OR REPLACE FUNCTION public.migrate_existing_contact_data()
RETURNS void AS $$
BEGIN
  -- Actualizar todas las filas existentes con información de contacto
  UPDATE public.leads l
  SET 
    contact_attempts_count = (
      SELECT COUNT(*) 
      FROM public.manual_call_logs mcl 
      WHERE mcl.lead_id = l.id::text
    ),
    last_contact_attempt_at = (
      SELECT MAX(mcl.created_at) 
      FROM public.manual_call_logs mcl 
      WHERE mcl.lead_id = l.id::text
    ),
    last_contact_outcome = (
      SELECT mcl.call_outcome
      FROM public.manual_call_logs mcl 
      WHERE mcl.lead_id = l.id::text
      ORDER BY mcl.created_at DESC
      LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Ejecutar migración de datos existentes
SELECT public.migrate_existing_contact_data();

-- 8. Actualizar función RPC simplificada que usa las nuevas columnas
CREATE OR REPLACE FUNCTION public.get_analyst_assigned_leads()
RETURNS TABLE(
  lead_id text,
  lead_nombre text,
  lead_email text,
  lead_telefono text,
  lead_estado text,
  lead_fecha_creacion timestamp with time zone,
  approval_stage text,
  phone_interview_completed boolean,
  second_interview_required boolean,
  final_decision text,
  notas text,
  analyst_name text,
  analyst_email text,
  contact_attempts_count integer,
  last_contact_attempt_at timestamp with time zone,
  last_contact_outcome text,
  interview_interrupted boolean,
  interview_session_id text,
  decision_reason text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  is_admin_user boolean := false;
BEGIN
  -- Obtener el ID del usuario actual
  current_user_id := auth.uid();
  
  -- Verificar que el usuario esté autenticado
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;
  
  -- Verificar si el usuario es administrador
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = current_user_id 
    AND ur.role IN ('admin', 'owner', 'manager')
  ) INTO is_admin_user;
  
  -- También verificar por email específico
  IF NOT is_admin_user THEN
    SELECT EXISTS (
      SELECT 1 FROM auth.users au
      WHERE au.id = current_user_id AND au.email = 'admin@admin.com'
    ) INTO is_admin_user;
  END IF;
  
  RETURN QUERY
  SELECT 
    l.id::text as lead_id,
    COALESCE(l.nombre, '')::text as lead_nombre,
    l.email::text as lead_email,
    l.telefono::text as lead_telefono,
    l.estado::text as lead_estado,
    l.created_at as lead_fecha_creacion,
    COALESCE(lap.current_stage, 
      CASE 
        WHEN l.estado = 'rechazado' THEN 'rejected'
        WHEN l.estado = 'aprobado' THEN 'approved' 
        ELSE 'phone_interview'
      END
    )::text as approval_stage,
    COALESCE(lap.phone_interview_completed, false) as phone_interview_completed,
    COALESCE(lap.second_interview_required, false) as second_interview_required,
    COALESCE(lap.final_decision, 
      CASE 
        WHEN l.estado = 'rechazado' THEN 'rejected'
        WHEN l.estado = 'aprobado' THEN 'approved'
        ELSE NULL
      END
    )::text as final_decision,
    COALESCE(l.notas, '')::text as notas,
    COALESCE(assigned_analyst.display_name, assigned_analyst.email, 'Sin asignar')::text as analyst_name,
    COALESCE(assigned_analyst.email, '')::text as analyst_email,
    -- Usar las nuevas columnas directamente
    COALESCE(l.contact_attempts_count, 0) as contact_attempts_count,
    l.last_contact_attempt_at,
    l.last_contact_outcome,
    COALESCE(lap.interview_interrupted, false) as interview_interrupted,
    lap.interview_session_id::text as interview_session_id,
    lap.decision_reason::text as decision_reason
  FROM public.leads l
  LEFT JOIN public.lead_approval_process lap ON l.id::text = lap.lead_id::text
  LEFT JOIN public.profiles assigned_analyst ON l.asignado_a = assigned_analyst.id
  WHERE (
    -- Si es administrador, mostrar todos los leads asignados
    (is_admin_user AND l.asignado_a IS NOT NULL)
    OR 
    -- Si no es administrador, solo los asignados a él
    (NOT is_admin_user AND l.asignado_a = current_user_id)
  )
  ORDER BY 
    -- Priorizar leads con intentos de contacto fallidos
    CASE 
      WHEN l.last_contact_outcome IN ('voicemail', 'no_answer', 'busy', 'wrong_number', 'non_existent_number', 'call_failed') THEN 1
      ELSE 0
    END,
    -- Luego por número de intentos (menos intentos primero)
    COALESCE(l.contact_attempts_count, 0),
    -- Finalmente por fecha de creación
    l.created_at DESC;
END;
$$;