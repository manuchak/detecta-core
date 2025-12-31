-- 1. Agregar días de impacto extendido a calendario de feriados
-- Estos días no son feriados oficiales pero tienen impacto operativo significativo

INSERT INTO calendario_feriados_mx (fecha, nombre, factor_ajuste, impacto_observado_pct, tipo, notas, activo)
VALUES 
  -- Diciembre 2024 - Período extendido
  ('2024-12-24', 'Nochebuena', 0.30, 70, 'comercial', 'Día antes de Navidad - operación reducida', true),
  ('2024-12-26', 'Post-Navidad', 0.75, 25, 'puente', 'Día después de Navidad - recuperación lenta', true),
  ('2024-12-27', 'Puente Navidad-Año Nuevo', 0.70, 30, 'puente', 'Semana entre fiestas - operación reducida', true),
  ('2024-12-28', 'Puente Navidad-Año Nuevo', 0.65, 35, 'puente', 'Sábado puente - muy baja actividad', true),
  ('2024-12-29', 'Puente Navidad-Año Nuevo', 0.55, 45, 'puente', 'Domingo puente - mínima actividad', true),
  ('2024-12-30', 'Pre-Fin de Año', 0.60, 40, 'puente', 'Preparación fin de año - operación reducida', true),
  ('2024-12-31', 'Fin de Año', 0.20, 80, 'comercial', 'Último día del año - operación mínima', true),
  ('2025-01-02', 'Post-Año Nuevo', 0.80, 20, 'puente', 'Recuperación lenta post festividades', true),
  
  -- Diciembre 2025 - Período extendido (para proyecciones futuras)
  ('2025-12-24', 'Nochebuena', 0.30, 70, 'comercial', 'Día antes de Navidad - operación reducida', true),
  ('2025-12-25', 'Navidad', 0.43, 57, 'oficial', 'Navidad - feriado oficial', true),
  ('2025-12-26', 'Post-Navidad', 0.75, 25, 'puente', 'Día después de Navidad - recuperación lenta', true),
  ('2025-12-27', 'Puente Navidad-Año Nuevo', 0.70, 30, 'puente', 'Semana entre fiestas - operación reducida', true),
  ('2025-12-28', 'Puente Navidad-Año Nuevo', 0.65, 35, 'puente', 'Sábado puente - muy baja actividad', true),
  ('2025-12-29', 'Puente Navidad-Año Nuevo', 0.55, 45, 'puente', 'Domingo puente - mínima actividad', true),
  ('2025-12-30', 'Pre-Fin de Año', 0.60, 40, 'puente', 'Preparación fin de año - operación reducida', true),
  ('2025-12-31', 'Fin de Año', 0.20, 80, 'comercial', 'Último día del año - operación mínima', true),
  ('2026-01-01', 'Año Nuevo', 0.18, 82, 'oficial', 'Año Nuevo - feriado oficial', true),
  ('2026-01-02', 'Post-Año Nuevo', 0.80, 20, 'puente', 'Recuperación lenta post festividades', true)
ON CONFLICT (fecha) DO UPDATE SET
  factor_ajuste = EXCLUDED.factor_ajuste,
  impacto_observado_pct = EXCLUDED.impacto_observado_pct,
  tipo = EXCLUDED.tipo,
  notas = EXCLUDED.notas,
  activo = EXCLUDED.activo;

-- 2. Crear tabla para períodos de ajuste operativo completos
CREATE TABLE IF NOT EXISTS public.periodos_ajuste_operativo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  factor_promedio DECIMAL(4,3) NOT NULL DEFAULT 0.7,
  tipo VARCHAR(50) DEFAULT 'estacional',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT check_fechas CHECK (fecha_fin >= fecha_inicio),
  CONSTRAINT check_factor CHECK (factor_promedio BETWEEN 0.1 AND 1.5)
);

-- Enable RLS
ALTER TABLE public.periodos_ajuste_operativo ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read
CREATE POLICY "Authenticated users can read adjustment periods"
  ON public.periodos_ajuste_operativo
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for admins to manage
CREATE POLICY "Admins can manage adjustment periods"
  ON public.periodos_ajuste_operativo
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'director', 'bi_analyst')
    )
  );

-- Insert common periods
INSERT INTO public.periodos_ajuste_operativo (nombre, descripcion, fecha_inicio, fecha_fin, factor_promedio, tipo)
VALUES 
  ('Navidad-Año Nuevo 2024-2025', 'Período festivo de fin de año', '2024-12-24', '2025-01-02', 0.52, 'estacional'),
  ('Navidad-Año Nuevo 2025-2026', 'Período festivo de fin de año', '2025-12-24', '2026-01-02', 0.52, 'estacional'),
  ('Semana Santa 2025', 'Período vacacional Semana Santa', '2025-04-13', '2025-04-20', 0.65, 'estacional');

-- 3. Crear tabla para métricas de capacidad histórica
CREATE TABLE IF NOT EXISTS public.capacidad_operativa_historica (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_month VARCHAR(7) NOT NULL UNIQUE, -- 'YYYY-MM' format
  max_daily_services INTEGER NOT NULL,
  avg_daily_services DECIMAL(6,2) NOT NULL,
  max_daily_gmv DECIMAL(12,2) NOT NULL,
  avg_daily_gmv DECIMAL(12,2) NOT NULL,
  days_with_data INTEGER NOT NULL,
  total_services INTEGER NOT NULL,
  total_gmv DECIMAL(12,2) NOT NULL,
  calculated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT check_year_month CHECK (year_month ~ '^\d{4}-\d{2}$')
);

-- Enable RLS
ALTER TABLE public.capacidad_operativa_historica ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read capacity metrics"
  ON public.capacidad_operativa_historica
  FOR SELECT
  TO authenticated
  USING (true);

-- Comment for documentation
COMMENT ON TABLE public.periodos_ajuste_operativo IS 'Períodos de ajuste operativo para forecasting (ej: semanas festivas)';
COMMENT ON TABLE public.capacidad_operativa_historica IS 'Métricas de capacidad operativa histórica por mes para guardrails de forecast';