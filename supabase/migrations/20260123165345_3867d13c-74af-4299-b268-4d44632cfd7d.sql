-- Tabla de auditoría para correcciones de KM
-- servicios_custodia.id es BIGINT, no UUID
CREATE TABLE IF NOT EXISTS public.auditoria_km_correcciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servicio_id BIGINT REFERENCES public.servicios_custodia(id) ON DELETE CASCADE,
  id_servicio TEXT,
  km_original NUMERIC,
  km_corregido NUMERIC,
  distancia_mapbox NUMERIC,
  margen_error_pct NUMERIC,
  metodo_correccion TEXT CHECK (metodo_correccion IN ('mapbox_api', 'division_1000', 'origen_igual_destino', 'km_teorico', 'manual')),
  razon TEXT,
  origen_normalizado TEXT,
  destino_normalizado TEXT,
  auditado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_auditoria_km_servicio ON public.auditoria_km_correcciones(servicio_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_km_metodo ON public.auditoria_km_correcciones(metodo_correccion);
CREATE INDEX IF NOT EXISTS idx_auditoria_km_fecha ON public.auditoria_km_correcciones(created_at DESC);

-- Agregar columnas de caché y estado de auditoría a servicios_custodia
ALTER TABLE public.servicios_custodia 
  ADD COLUMN IF NOT EXISTS origen_lat NUMERIC,
  ADD COLUMN IF NOT EXISTS origen_lng NUMERIC,
  ADD COLUMN IF NOT EXISTS destino_lat NUMERIC,
  ADD COLUMN IF NOT EXISTS destino_lng NUMERIC,
  ADD COLUMN IF NOT EXISTS km_auditado BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS fecha_auditoria TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS km_original_backup NUMERIC;

-- RLS para auditoria_km_correcciones
ALTER TABLE public.auditoria_km_correcciones ENABLE ROW LEVEL SECURITY;

-- Solo usuarios autenticados pueden ver las auditorías
CREATE POLICY "auditoria_km_select_authenticated" ON public.auditoria_km_correcciones
  FOR SELECT TO authenticated USING (true);

-- Solo service_role puede insertar/actualizar (edge functions)
CREATE POLICY "auditoria_km_insert_service" ON public.auditoria_km_correcciones
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "auditoria_km_update_service" ON public.auditoria_km_correcciones
  FOR UPDATE TO service_role USING (true);

-- Comentarios para documentación
COMMENT ON TABLE public.auditoria_km_correcciones IS 'Historial de correcciones de km_recorridos en servicios_custodia';
COMMENT ON COLUMN public.auditoria_km_correcciones.metodo_correccion IS 'Método usado: mapbox_api, division_1000, origen_igual_destino, km_teorico, manual';