-- Crear tabla para trackear todas las comunicaciones con custodios
CREATE TABLE public.custodio_communications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  custodio_id UUID NOT NULL,
  custodio_nombre TEXT NOT NULL,
  custodio_telefono TEXT NOT NULL,
  servicio_id UUID,
  tipo_comunicacion TEXT NOT NULL CHECK (tipo_comunicacion IN ('whatsapp', 'llamada', 'sms')),
  direccion TEXT NOT NULL CHECK (direccion IN ('enviado', 'recibido')),
  contenido TEXT,
  estado TEXT NOT NULL DEFAULT 'enviado' CHECK (estado IN ('enviado', 'entregado', 'leido', 'respondido', 'fallido')),
  timestamp_comunicacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para respuestas de custodios
CREATE TABLE public.custodio_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  communication_id UUID NOT NULL REFERENCES public.custodio_communications(id) ON DELETE CASCADE,
  custodio_id UUID NOT NULL,
  servicio_id UUID,
  tipo_respuesta TEXT NOT NULL CHECK (tipo_respuesta IN ('aceptacion', 'rechazo', 'consulta', 'contraoferta')),
  respuesta_texto TEXT,
  tiempo_respuesta_minutos INTEGER,
  razon_rechazo TEXT,
  precio_propuesto NUMERIC,
  disponibilidad_propuesta TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para métricas de performance por custodio
CREATE TABLE public.custodio_performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  custodio_id UUID NOT NULL,
  custodio_nombre TEXT NOT NULL,
  custodio_telefono TEXT NOT NULL,
  
  -- Métricas de comunicación
  total_comunicaciones INTEGER DEFAULT 0,
  total_respuestas INTEGER DEFAULT 0,
  tasa_respuesta NUMERIC(5,2) DEFAULT 0, -- Porcentaje
  tiempo_promedio_respuesta_minutos INTEGER DEFAULT 0,
  
  -- Métricas de aceptación
  total_ofertas INTEGER DEFAULT 0,
  total_aceptaciones INTEGER DEFAULT 0,
  total_rechazos INTEGER DEFAULT 0,
  tasa_aceptacion NUMERIC(5,2) DEFAULT 0, -- Porcentaje
  
  -- Métricas de confiabilidad
  servicios_completados INTEGER DEFAULT 0,
  servicios_cancelados INTEGER DEFAULT 0,
  no_shows INTEGER DEFAULT 0, -- Custodio no se presentó
  tasa_confiabilidad NUMERIC(5,2) DEFAULT 100, -- Porcentaje
  
  -- Scoring dinámico
  score_comunicacion NUMERIC(3,1) DEFAULT 5.0, -- 1-10
  score_aceptacion NUMERIC(3,1) DEFAULT 5.0, -- 1-10  
  score_confiabilidad NUMERIC(3,1) DEFAULT 10.0, -- 1-10
  score_total NUMERIC(3,1) DEFAULT 6.7, -- Promedio ponderado
  
  -- Metadata adicional
  ultima_comunicacion TIMESTAMP WITH TIME ZONE,
  ultimo_servicio TIMESTAMP WITH TIME ZONE,
  zona_operacion TEXT,
  notas_performance TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(custodio_id)
);

-- Crear índices para optimizar consultas
CREATE INDEX idx_custodio_communications_custodio ON public.custodio_communications(custodio_id);
CREATE INDEX idx_custodio_communications_servicio ON public.custodio_communications(servicio_id);
CREATE INDEX idx_custodio_communications_timestamp ON public.custodio_communications(timestamp_comunicacion);

CREATE INDEX idx_custodio_responses_custodio ON public.custodio_responses(custodio_id);
CREATE INDEX idx_custodio_responses_servicio ON public.custodio_responses(servicio_id);
CREATE INDEX idx_custodio_responses_communication ON public.custodio_responses(communication_id);

CREATE INDEX idx_custodio_performance_score ON public.custodio_performance_metrics(score_total DESC);
CREATE INDEX idx_custodio_performance_zona ON public.custodio_performance_metrics(zona_operacion);

-- Función para actualizar métricas automáticamente
CREATE OR REPLACE FUNCTION public.update_custodio_performance_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar métricas cuando se inserta una nueva respuesta
  IF TG_TABLE_NAME = 'custodio_responses' THEN
    INSERT INTO public.custodio_performance_metrics (
      custodio_id, 
      custodio_nombre, 
      custodio_telefono
    )
    VALUES (
      NEW.custodio_id,
      (SELECT custodio_nombre FROM public.custodio_communications WHERE id = NEW.communication_id),
      (SELECT custodio_telefono FROM public.custodio_communications WHERE id = NEW.communication_id)
    )
    ON CONFLICT (custodio_id) DO UPDATE SET
      total_respuestas = custodio_performance_metrics.total_respuestas + 1,
      total_ofertas = CASE 
        WHEN NEW.tipo_respuesta IN ('aceptacion', 'rechazo') 
        THEN custodio_performance_metrics.total_ofertas + 1 
        ELSE custodio_performance_metrics.total_ofertas 
      END,
      total_aceptaciones = CASE 
        WHEN NEW.tipo_respuesta = 'aceptacion' 
        THEN custodio_performance_metrics.total_aceptaciones + 1 
        ELSE custodio_performance_metrics.total_aceptaciones 
      END,
      total_rechazos = CASE 
        WHEN NEW.tipo_respuesta = 'rechazo' 
        THEN custodio_performance_metrics.total_rechazos + 1 
        ELSE custodio_performance_metrics.total_rechazos 
      END,
      updated_at = now();
  END IF;

  -- Actualizar métricas cuando se inserta una nueva comunicación
  IF TG_TABLE_NAME = 'custodio_communications' THEN
    INSERT INTO public.custodio_performance_metrics (
      custodio_id, 
      custodio_nombre, 
      custodio_telefono
    )
    VALUES (
      NEW.custodio_id,
      NEW.custodio_nombre,
      NEW.custodio_telefono
    )
    ON CONFLICT (custodio_id) DO UPDATE SET
      total_comunicaciones = custodio_performance_metrics.total_comunicaciones + 1,
      ultima_comunicacion = NEW.timestamp_comunicacion,
      updated_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Crear triggers para mantener métricas actualizadas
CREATE TRIGGER update_metrics_on_communication
  AFTER INSERT ON public.custodio_communications
  FOR EACH ROW EXECUTE FUNCTION public.update_custodio_performance_metrics();

CREATE TRIGGER update_metrics_on_response
  AFTER INSERT ON public.custodio_responses
  FOR EACH ROW EXECUTE FUNCTION public.update_custodio_performance_metrics();

-- Función para calcular y actualizar scores
CREATE OR REPLACE FUNCTION public.calculate_custodio_scores()
RETURNS void AS $$
BEGIN
  UPDATE public.custodio_performance_metrics SET
    tasa_respuesta = CASE 
      WHEN total_comunicaciones > 0 
      THEN ROUND((total_respuestas::NUMERIC / total_comunicaciones::NUMERIC) * 100, 2)
      ELSE 0 
    END,
    tasa_aceptacion = CASE 
      WHEN total_ofertas > 0 
      THEN ROUND((total_aceptaciones::NUMERIC / total_ofertas::NUMERIC) * 100, 2)
      ELSE 0 
    END,
    tasa_confiabilidad = CASE 
      WHEN (servicios_completados + servicios_cancelados + no_shows) > 0 
      THEN ROUND((servicios_completados::NUMERIC / (servicios_completados + servicios_cancelados + no_shows)::NUMERIC) * 100, 2)
      ELSE 100 
    END,
    score_comunicacion = LEAST(10, GREATEST(1, 
      CASE 
        WHEN total_comunicaciones = 0 THEN 5
        WHEN tasa_respuesta >= 90 THEN 10
        WHEN tasa_respuesta >= 70 THEN 8
        WHEN tasa_respuesta >= 50 THEN 6
        WHEN tasa_respuesta >= 30 THEN 4
        ELSE 2
      END
    )),
    score_aceptacion = LEAST(10, GREATEST(1,
      CASE 
        WHEN total_ofertas = 0 THEN 5
        WHEN tasa_aceptacion >= 80 THEN 10
        WHEN tasa_aceptacion >= 60 THEN 8
        WHEN tasa_aceptacion >= 40 THEN 6
        WHEN tasa_aceptacion >= 25 THEN 4
        ELSE 2
      END
    )),
    score_confiabilidad = LEAST(10, GREATEST(1,
      CASE 
        WHEN (servicios_completados + servicios_cancelados + no_shows) = 0 THEN 10
        WHEN tasa_confiabilidad >= 95 THEN 10
        WHEN tasa_confiabilidad >= 85 THEN 8
        WHEN tasa_confiabilidad >= 70 THEN 6
        WHEN tasa_confiabilidad >= 50 THEN 4
        ELSE 2
      END
    )),
    updated_at = now();
    
  -- Calcular score total como promedio ponderado
  UPDATE public.custodio_performance_metrics SET
    score_total = ROUND(
      (score_comunicacion * 0.3 + score_aceptacion * 0.4 + score_confiabilidad * 0.3), 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Habilitar RLS en todas las tablas
ALTER TABLE public.custodio_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custodio_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custodio_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para custodio_communications
CREATE POLICY "communications_planeacion_access" ON public.custodio_communications
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'planificador', 'supply_admin')
  )
);

-- Políticas RLS para custodio_responses
CREATE POLICY "responses_planeacion_access" ON public.custodio_responses
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'planificador', 'supply_admin')
  )
);

-- Políticas RLS para custodio_performance_metrics
CREATE POLICY "metrics_planeacion_access" ON public.custodio_performance_metrics
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'planificador', 'supply_admin')
  )
);

-- Políticas para lectura amplia de métricas (para scoring)
CREATE POLICY "metrics_read_for_operations" ON public.custodio_performance_metrics
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'planificador', 'supply_admin', 'ejecutivo_ventas')
  )
);