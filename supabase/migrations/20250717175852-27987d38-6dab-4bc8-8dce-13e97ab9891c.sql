-- Migración para agregar nuevos estados del proceso custodio
-- Actualizar enum de estados si existe, o crear constraint para estados

-- Primero agregar nuevas columnas para el proceso custodio
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS fecha_aprobacion TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS fecha_psicometricos TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS fecha_toxicologicos TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS fecha_instalacion_gps TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS fecha_activacion_custodio TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS motivo_rechazo TEXT,
ADD COLUMN IF NOT EXISTS credenciales_enviadas BOOLEAN DEFAULT FALSE;

-- Agregar constraint para validar estados permitidos
ALTER TABLE public.leads 
DROP CONSTRAINT IF EXISTS leads_estado_check;

ALTER TABLE public.leads 
ADD CONSTRAINT leads_estado_check 
CHECK (estado IN (
  'nuevo',
  'contactado', 
  'en_revision',
  'aprobado',
  'rechazado',
  'psicometricos_pendiente',
  'psicometricos_completado',
  'toxicologicos_pendiente', 
  'toxicologicos_completado',
  'instalacion_gps_pendiente',
  'instalacion_gps_completado',
  'custodio_activo',
  'rechazado_psicometrico',
  'rechazado_toxicologico',
  'inactivo'
));

-- Crear índices para optimizar consultas por estado y fechas
CREATE INDEX IF NOT EXISTS idx_leads_estado ON public.leads(estado);
CREATE INDEX IF NOT EXISTS idx_leads_fecha_aprobacion ON public.leads(fecha_aprobacion);
CREATE INDEX IF NOT EXISTS idx_leads_credenciales_enviadas ON public.leads(credenciales_enviadas);

-- Crear función para automatizar transiciones de estado
CREATE OR REPLACE FUNCTION public.actualizar_fecha_estado_lead()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar fecha según el nuevo estado
  CASE NEW.estado
    WHEN 'aprobado' THEN
      NEW.fecha_aprobacion = COALESCE(NEW.fecha_aprobacion, NOW());
    WHEN 'psicometricos_completado' THEN  
      NEW.fecha_psicometricos = COALESCE(NEW.fecha_psicometricos, NOW());
    WHEN 'toxicologicos_completado' THEN
      NEW.fecha_toxicologicos = COALESCE(NEW.fecha_toxicologicos, NOW());
    WHEN 'instalacion_gps_completado' THEN
      NEW.fecha_instalacion_gps = COALESCE(NEW.fecha_instalacion_gps, NOW());
    WHEN 'custodio_activo' THEN
      NEW.fecha_activacion_custodio = COALESCE(NEW.fecha_activacion_custodio, NOW());
    ELSE
      -- No hacer nada para otros estados
  END CASE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para automatizar fechas
DROP TRIGGER IF EXISTS trigger_actualizar_fecha_estado_lead ON public.leads;
CREATE TRIGGER trigger_actualizar_fecha_estado_lead
  BEFORE UPDATE OF estado ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.actualizar_fecha_estado_lead();