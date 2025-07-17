-- Añadir campos para manejo de entrevistas interrumpidas a la tabla leads
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS last_interview_data JSONB,
ADD COLUMN IF NOT EXISTS interruption_reason TEXT,
ADD COLUMN IF NOT EXISTS interview_session_id UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS last_autosave_at TIMESTAMP WITH TIME ZONE;

-- Añadir campos a lead_approval_process para manejo de estados interrumpidos
ALTER TABLE public.lead_approval_process
ADD COLUMN IF NOT EXISTS interview_interrupted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_session_id UUID;

-- Crear tabla para programación de llamadas
CREATE TABLE IF NOT EXISTS public.programacion_llamadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    fecha_programada TIMESTAMP WITH TIME ZONE NOT NULL,
    tipo_llamada TEXT NOT NULL DEFAULT 'entrevista', -- 'entrevista', 'seguimiento', 'reprogramada'
    motivo_reprogramacion TEXT,
    session_id UUID, -- Para vincular con sesiones interrumpidas
    estado TEXT DEFAULT 'programada', -- 'programada', 'completada', 'cancelada'
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS en la nueva tabla
ALTER TABLE public.programacion_llamadas ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios puedan gestionar las programaciones de llamadas
CREATE POLICY "Users can manage call scheduling"
ON public.programacion_llamadas
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_programacion_llamadas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_programacion_llamadas_updated_at
    BEFORE UPDATE ON public.programacion_llamadas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_programacion_llamadas_updated_at();

-- Añadir índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_programacion_llamadas_lead_id ON public.programacion_llamadas(lead_id);
CREATE INDEX IF NOT EXISTS idx_programacion_llamadas_fecha ON public.programacion_llamadas(fecha_programada);
CREATE INDEX IF NOT EXISTS idx_programacion_llamadas_session_id ON public.programacion_llamadas(session_id);
CREATE INDEX IF NOT EXISTS idx_leads_session_id ON public.leads(interview_session_id);

-- Función para auto-guardar progreso de entrevista
CREATE OR REPLACE FUNCTION public.save_interview_progress(
    p_lead_id UUID,
    p_session_id UUID,
    p_interview_data JSONB,
    p_autosave BOOLEAN DEFAULT true
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Actualizar los datos de entrevista en la tabla leads
    UPDATE public.leads 
    SET 
        last_interview_data = p_interview_data,
        interview_session_id = p_session_id,
        last_autosave_at = CASE WHEN p_autosave THEN now() ELSE last_autosave_at END
    WHERE id = p_lead_id;
    
    -- También actualizar el proceso de aprobación si existe
    UPDATE public.lead_approval_process
    SET 
        last_session_id = p_session_id
    WHERE lead_id::text = p_lead_id::text;
    
    RETURN true;
END;
$$;

-- Función para marcar entrevista como interrumpida
CREATE OR REPLACE FUNCTION public.mark_interview_interrupted(
    p_lead_id UUID,
    p_session_id UUID,
    p_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Actualizar la tabla leads
    UPDATE public.leads 
    SET 
        interruption_reason = p_reason
    WHERE id = p_lead_id AND interview_session_id = p_session_id;
    
    -- Marcar como interrumpida en el proceso de aprobación
    UPDATE public.lead_approval_process
    SET 
        interview_interrupted = true,
        last_session_id = p_session_id
    WHERE lead_id::text = p_lead_id::text;
    
    RETURN true;
END;
$$;