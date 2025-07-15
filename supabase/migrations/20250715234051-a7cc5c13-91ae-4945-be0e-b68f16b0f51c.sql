-- Crear índices para optimizar consultas en la tabla leads

-- Índice para ordenamiento por fecha de creación (usado en ORDER BY)
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads (created_at DESC);

-- Índice para filtros por estado
CREATE INDEX IF NOT EXISTS idx_leads_estado ON public.leads (estado);

-- Índice para filtros por fuente
CREATE INDEX IF NOT EXISTS idx_leads_fuente ON public.leads (fuente);

-- Índice para filtros por asignación
CREATE INDEX IF NOT EXISTS idx_leads_asignado_a ON public.leads (asignado_a);

-- Índice compuesto para búsquedas de texto (nombre, email)
CREATE INDEX IF NOT EXISTS idx_leads_search_text ON public.leads USING gin (
  to_tsvector('spanish', COALESCE(nombre, '') || ' ' || COALESCE(email, ''))
);

-- Índice para fecha de creación con estado (filtros combinados frecuentes)
CREATE INDEX IF NOT EXISTS idx_leads_created_at_estado ON public.leads (created_at DESC, estado);

-- Índice para fecha de creación con asignación (filtros combinados frecuentes)
CREATE INDEX IF NOT EXISTS idx_leads_created_at_asignado ON public.leads (created_at DESC, asignado_a);

-- Índice para teléfono (usado en búsquedas)
CREATE INDEX IF NOT EXISTS idx_leads_telefono ON public.leads (telefono);

-- Comentarios explicativos
COMMENT ON INDEX idx_leads_created_at IS 'Optimiza ordenamiento por fecha de creación';
COMMENT ON INDEX idx_leads_estado IS 'Optimiza filtros por estado del lead';
COMMENT ON INDEX idx_leads_fuente IS 'Optimiza filtros por fuente del lead';
COMMENT ON INDEX idx_leads_asignado_a IS 'Optimiza filtros por asignación';
COMMENT ON INDEX idx_leads_search_text IS 'Optimiza búsquedas de texto en nombre y email';
COMMENT ON INDEX idx_leads_created_at_estado IS 'Optimiza filtros combinados fecha + estado';
COMMENT ON INDEX idx_leads_created_at_asignado IS 'Optimiza filtros combinados fecha + asignación';
COMMENT ON INDEX idx_leads_telefono IS 'Optimiza búsquedas por teléfono';