-- Fase 1: Tablas para métricas operacionales y segmentación de servicios

-- Tabla de métricas operacionales por zona
CREATE TABLE public.metricas_operacionales_zona (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zona_id UUID REFERENCES public.zonas_operacion(id),
  periodo DATE NOT NULL DEFAULT CURRENT_DATE,
  ratio_rechazo_promedio NUMERIC NOT NULL DEFAULT 0.25,
  tiempo_respuesta_promedio_minutos INTEGER DEFAULT 30,
  disponibilidad_custodios_horas NUMERIC NOT NULL DEFAULT 16,
  eficiencia_operacional NUMERIC NOT NULL DEFAULT 0.85,
  horas_trabajo_dia NUMERIC NOT NULL DEFAULT 16,
  custodios_activos INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla de segmentación de servicios
CREATE TABLE public.servicios_segmentados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zona_id UUID REFERENCES public.zonas_operacion(id),
  tipo_servicio TEXT NOT NULL, -- 'local', 'foraneo', 'express'
  duracion_promedio_horas NUMERIC NOT NULL,
  demanda_diaria_promedio NUMERIC DEFAULT 0,
  complejidad_score INTEGER DEFAULT 5 CHECK (complejidad_score BETWEEN 1 AND 10),
  margen_beneficio NUMERIC DEFAULT 0,
  periodo_analisis DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla de patrones temporales (para fases futuras)
CREATE TABLE public.patrones_demanda_temporal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zona_id UUID REFERENCES public.zonas_operacion(id),
  tipo_patron TEXT NOT NULL, -- 'diario', 'semanal', 'mensual', 'estacional'
  factor_multiplicador NUMERIC NOT NULL DEFAULT 1.0,
  dia_semana INTEGER CHECK (dia_semana BETWEEN 1 AND 7),
  mes INTEGER CHECK (mes BETWEEN 1 AND 12),
  hora_inicio INTEGER CHECK (hora_inicio BETWEEN 0 AND 23),
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.metricas_operacionales_zona ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicios_segmentados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patrones_demanda_temporal ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Todos pueden leer métricas operacionales" ON public.metricas_operacionales_zona
  FOR SELECT USING (true);

CREATE POLICY "Admins pueden gestionar métricas operacionales" ON public.metricas_operacionales_zona
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'manager', 'supply_admin', 'coordinador_operaciones')
    )
  );

CREATE POLICY "Todos pueden leer servicios segmentados" ON public.servicios_segmentados
  FOR SELECT USING (true);

CREATE POLICY "Admins pueden gestionar servicios segmentados" ON public.servicios_segmentados
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'manager', 'supply_admin', 'coordinador_operaciones')
    )
  );

CREATE POLICY "Todos pueden leer patrones temporales" ON public.patrones_demanda_temporal
  FOR SELECT USING (true);

CREATE POLICY "Admins pueden gestionar patrones temporales" ON public.patrones_demanda_temporal
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'manager', 'supply_admin', 'coordinador_operaciones')
    )
  );

-- Triggers para actualizar updated_at
CREATE OR REPLACE FUNCTION update_metricas_operacionales_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_metricas_operacionales_updated_at
  BEFORE UPDATE ON public.metricas_operacionales_zona
  FOR EACH ROW
  EXECUTE FUNCTION update_metricas_operacionales_updated_at();

CREATE TRIGGER update_servicios_segmentados_updated_at
  BEFORE UPDATE ON public.servicios_segmentados
  FOR EACH ROW
  EXECUTE FUNCTION update_metricas_operacionales_updated_at();

CREATE TRIGGER update_patrones_demanda_updated_at
  BEFORE UPDATE ON public.patrones_demanda_temporal
  FOR EACH ROW
  EXECUTE FUNCTION update_metricas_operacionales_updated_at();

-- Insertar datos iniciales para métricas operacionales
INSERT INTO public.metricas_operacionales_zona (zona_id, ratio_rechazo_promedio, disponibilidad_custodios_horas, eficiencia_operacional)
SELECT 
  id as zona_id,
  0.25 as ratio_rechazo_promedio,
  16 as disponibilidad_custodios_horas,
  0.85 as eficiencia_operacional
FROM public.zonas_operacion
WHERE activa = true;

-- Insertar tipos de servicios segmentados iniciales
INSERT INTO public.servicios_segmentados (zona_id, tipo_servicio, duracion_promedio_horas, complejidad_score)
SELECT 
  zo.id as zona_id,
  tipo.servicio,
  tipo.duracion,
  tipo.complejidad
FROM public.zonas_operacion zo
CROSS JOIN (
  VALUES 
    ('local', 6, 3),
    ('foraneo', 14, 7),
    ('express', 4, 5)
) AS tipo(servicio, duracion, complejidad)
WHERE zo.activa = true;