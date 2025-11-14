-- SPRINT 1: Agregar índices de base de datos críticos para mejorar performance

-- Índice para ordenamiento por fecha de creación (usado en paginación)
CREATE INDEX IF NOT EXISTS idx_leads_fecha_creacion 
ON public.leads(fecha_creacion DESC);

-- Índice compuesto para filtros por estado y fecha
CREATE INDEX IF NOT EXISTS idx_leads_estado_fecha 
ON public.leads(estado, fecha_creacion DESC);

-- Índice para leads asignados (filtra NULL para eficiencia)
CREATE INDEX IF NOT EXISTS idx_leads_asignado_estado 
ON public.leads(asignado_a, estado) 
WHERE asignado_a IS NOT NULL;

-- Índice para búsqueda de logs de llamadas por lead y resultado
CREATE INDEX IF NOT EXISTS idx_manual_call_logs_lead_outcome 
ON public.manual_call_logs(lead_id, call_outcome, created_at DESC);

-- Índice para búsqueda de procesos de aprobación por analista y decisión
CREATE INDEX IF NOT EXISTS idx_lead_approval_analyst_decision 
ON public.lead_approval_process(analyst_id, final_decision);

-- Índice adicional para mejorar conteo de leads sin asignar
CREATE INDEX IF NOT EXISTS idx_leads_fecha_entrada_pool
ON public.leads(fecha_entrada_pool)
WHERE fecha_entrada_pool IS NULL;

COMMENT ON INDEX idx_leads_fecha_creacion IS 'Optimiza ordenamiento de leads por fecha de creación';
COMMENT ON INDEX idx_leads_estado_fecha IS 'Optimiza filtros combinados de estado y fecha';
COMMENT ON INDEX idx_leads_asignado_estado IS 'Optimiza búsquedas de leads asignados por estado';
COMMENT ON INDEX idx_manual_call_logs_lead_outcome IS 'Optimiza búsqueda de historial de llamadas';
COMMENT ON INDEX idx_lead_approval_analyst_decision IS 'Optimiza dashboard de analistas';
COMMENT ON INDEX idx_leads_fecha_entrada_pool IS 'Optimiza conteo de leads activos vs pool';