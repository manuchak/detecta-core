-- Añadir campos para manejo de entrevistas interrumpidas
ALTER TABLE leads_assigned 
ADD COLUMN IF NOT EXISTS last_interview_data JSONB,
ADD COLUMN IF NOT EXISTS interruption_reason TEXT,
ADD COLUMN IF NOT EXISTS interview_session_id UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS last_autosave_at TIMESTAMP WITH TIME ZONE;

-- Añadir nuevo estado para entrevistas interrumpidas
-- Primero verificamos si el tipo existe
DO $$ 
BEGIN
    -- Intentar añadir el nuevo valor al enum existente
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'interrupted' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'lead_estado')
    ) THEN
        ALTER TYPE lead_estado ADD VALUE IF NOT EXISTS 'interrupted';
    END IF;
EXCEPTION
    WHEN others THEN
        -- Si hay error, crear el tipo desde cero si no existe
        NULL;
END $$;

-- Crear tabla para programación de llamadas
CREATE TABLE IF NOT EXISTS programacion_llamadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads_assigned(id) ON DELETE CASCADE,
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
ALTER TABLE programacion_llamadas ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios puedan gestionar las programaciones de llamadas
CREATE POLICY "Users can manage call scheduling"
ON programacion_llamadas
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_programacion_llamadas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_programacion_llamadas_updated_at
    BEFORE UPDATE ON programacion_llamadas
    FOR EACH ROW
    EXECUTE FUNCTION update_programacion_llamadas_updated_at();

-- Añadir índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_programacion_llamadas_lead_id ON programacion_llamadas(lead_id);
CREATE INDEX IF NOT EXISTS idx_programacion_llamadas_fecha ON programacion_llamadas(fecha_programada);
CREATE INDEX IF NOT EXISTS idx_programacion_llamadas_session_id ON programacion_llamadas(session_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_session_id ON leads_assigned(interview_session_id);