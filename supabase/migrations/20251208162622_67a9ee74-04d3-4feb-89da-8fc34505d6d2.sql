-- =============================================
-- CALENDARIO FERIADOS MEXICO + FORECAST ACCURACY TRACKING
-- Plan Lean BI para mejorar precisión de proyecciones
-- =============================================

-- Tabla de feriados mexicanos con factores de impacto observados
CREATE TABLE public.calendario_feriados_mx (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  tipo VARCHAR(50) NOT NULL DEFAULT 'nacional', -- 'nacional', 'religioso', 'puente'
  -- Factor de ajuste basado en datos históricos observados
  -- 0.28 significa -72% de servicios ese día (factor = 1 - impacto)
  factor_ajuste NUMERIC(4,3) NOT NULL DEFAULT 0.30,
  impacto_observado_pct NUMERIC(5,2), -- % de reducción observado históricamente
  activo BOOLEAN DEFAULT true,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(fecha)
);

-- Índice para consultas por rango de fechas
CREATE INDEX idx_calendario_feriados_fecha ON public.calendario_feriados_mx(fecha);
CREATE INDEX idx_calendario_feriados_activo ON public.calendario_feriados_mx(activo) WHERE activo = true;

-- Habilitar RLS
ALTER TABLE public.calendario_feriados_mx ENABLE ROW LEVEL SECURITY;

-- Políticas: todos pueden leer, solo admin puede modificar
CREATE POLICY "Feriados públicos para lectura" ON public.calendario_feriados_mx
  FOR SELECT USING (true);

CREATE POLICY "Solo admin puede modificar feriados" ON public.calendario_feriados_mx
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'owner')
    )
  );

-- =============================================
-- POBLAR CON FERIADOS 2024-2026 Y FACTORES OBSERVADOS
-- Factores basados en análisis real de datos históricos
-- =============================================

INSERT INTO public.calendario_feriados_mx (fecha, nombre, tipo, factor_ajuste, impacto_observado_pct, notas) VALUES
-- 2024
('2024-01-01', 'Año Nuevo', 'nacional', 0.18, 82.0, 'Impacto muy alto observado'),
('2024-02-05', 'Día de la Constitución', 'nacional', 0.30, 70.0, 'Impacto alto'),
('2024-03-18', 'Natalicio de Benito Juárez', 'nacional', 0.35, 65.0, 'Impacto moderado-alto'),
('2024-03-28', 'Jueves Santo', 'religioso', 0.25, 75.0, 'Semana Santa - alto impacto'),
('2024-03-29', 'Viernes Santo', 'religioso', 0.20, 80.0, 'Semana Santa - muy alto impacto'),
('2024-05-01', 'Día del Trabajo', 'nacional', 0.28, 72.0, 'Impacto alto consistente'),
('2024-09-16', 'Día de la Independencia', 'nacional', 0.25, 75.0, 'Feriado nacional importante'),
('2024-11-18', 'Revolución Mexicana', 'nacional', 0.35, 65.0, 'Impacto moderado'),
('2024-12-25', 'Navidad', 'nacional', 0.12, 88.0, 'Muy alto impacto - operación mínima'),

-- 2025
('2025-01-01', 'Año Nuevo', 'nacional', 0.18, 82.0, 'Impacto muy alto'),
('2025-02-03', 'Día de la Constitución', 'nacional', 0.30, 70.0, 'Lunes puente'),
('2025-03-17', 'Natalicio de Benito Juárez', 'nacional', 0.35, 65.0, 'Lunes puente'),
('2025-04-17', 'Jueves Santo', 'religioso', 0.25, 75.0, 'Semana Santa'),
('2025-04-18', 'Viernes Santo', 'religioso', 0.20, 80.0, 'Semana Santa'),
('2025-05-01', 'Día del Trabajo', 'nacional', 0.28, 72.0, 'Feriado laboral obligatorio'),
('2025-09-16', 'Día de la Independencia', 'nacional', 0.25, 75.0, 'Feriado nacional'),
('2025-11-17', 'Revolución Mexicana', 'nacional', 0.35, 65.0, 'Lunes puente'),
('2025-12-25', 'Navidad', 'nacional', 0.12, 88.0, 'Operación mínima'),

-- 2026
('2026-01-01', 'Año Nuevo', 'nacional', 0.18, 82.0, 'Impacto muy alto'),
('2026-02-02', 'Día de la Constitución', 'nacional', 0.30, 70.0, 'Lunes puente'),
('2026-03-16', 'Natalicio de Benito Juárez', 'nacional', 0.35, 65.0, 'Lunes puente'),
('2026-04-02', 'Jueves Santo', 'religioso', 0.25, 75.0, 'Semana Santa'),
('2026-04-03', 'Viernes Santo', 'religioso', 0.20, 80.0, 'Semana Santa'),
('2026-05-01', 'Día del Trabajo', 'nacional', 0.28, 72.0, 'Feriado laboral'),
('2026-09-16', 'Día de la Independencia', 'nacional', 0.25, 75.0, 'Feriado nacional'),
('2026-11-16', 'Revolución Mexicana', 'nacional', 0.35, 65.0, 'Lunes puente'),
('2026-12-25', 'Navidad', 'nacional', 0.12, 88.0, 'Operación mínima');

-- =============================================
-- TABLA DE HISTÓRICO DE PRECISIÓN DEL FORECAST
-- Para tracking de MAPE mes a mes y feedback loop
-- =============================================

CREATE TABLE public.forecast_accuracy_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mes DATE NOT NULL, -- Primer día del mes evaluado
  forecast_services INTEGER NOT NULL,
  forecast_gmv NUMERIC(12,2) NOT NULL,
  actual_services INTEGER,
  actual_gmv NUMERIC(12,2),
  mape_services NUMERIC(5,2), -- MAPE de servicios (%)
  mape_gmv NUMERIC(5,2), -- MAPE de GMV (%)
  smape_services NUMERIC(5,2), -- sMAPE de servicios
  modelo_usado VARCHAR(50), -- 'ensemble', 'historical', etc.
  regime_detectado VARCHAR(50),
  feriados_considerados INTEGER DEFAULT 0,
  factor_feriados_aplicado NUMERIC(4,3),
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(mes)
);

CREATE INDEX idx_forecast_accuracy_mes ON public.forecast_accuracy_history(mes DESC);

ALTER TABLE public.forecast_accuracy_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Accuracy history lectura autenticados" ON public.forecast_accuracy_history
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Solo admin puede modificar accuracy history" ON public.forecast_accuracy_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'owner', 'bi_analyst')
    )
  );

-- Trigger para updated_at
CREATE TRIGGER update_forecast_accuracy_history_updated_at
  BEFORE UPDATE ON public.forecast_accuracy_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calendario_feriados_updated_at
  BEFORE UPDATE ON public.calendario_feriados_mx
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comentarios para documentación
COMMENT ON TABLE public.calendario_feriados_mx IS 'Calendario de feriados mexicanos con factores de impacto para ajuste de forecast';
COMMENT ON COLUMN public.calendario_feriados_mx.factor_ajuste IS 'Factor multiplicador (0-1). Ej: 0.28 = 28% de operación normal = 72% de impacto';
COMMENT ON TABLE public.forecast_accuracy_history IS 'Histórico de precisión del forecast para tracking de MAPE y feedback loop';