-- Add comentarios_planeacion column for internal planning notes
ALTER TABLE public.servicios_planificados 
ADD COLUMN IF NOT EXISTS comentarios_planeacion TEXT;

-- Add id_interno_cliente column if not exists (for Saphiro folio search)
ALTER TABLE public.servicios_planificados 
ADD COLUMN IF NOT EXISTS id_interno_cliente TEXT;

COMMENT ON COLUMN public.servicios_planificados.comentarios_planeacion IS 'Internal comments from planning team (datos pendientes, equipos, etc.)';
COMMENT ON COLUMN public.servicios_planificados.id_interno_cliente IS 'Client internal ID / Saphiro folio for alternative search';