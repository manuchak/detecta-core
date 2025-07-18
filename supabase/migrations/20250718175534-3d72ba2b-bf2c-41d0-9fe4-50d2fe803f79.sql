-- FASE 1: Infraestructura de Datos Nacional

-- Tabla para zonas geográficas estratégicas
CREATE TABLE public.zonas_operacion_nacional (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    estados_incluidos TEXT[],
    coordenadas_centro POINT,
    radio_cobertura_km INTEGER,
    prioridad_reclutamiento INTEGER CHECK (prioridad_reclutamiento BETWEEN 1 AND 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para métricas de demanda por zona
CREATE TABLE public.metricas_demanda_zona (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zona_id UUID REFERENCES public.zonas_operacion_nacional(id) ON DELETE CASCADE,
    periodo_inicio DATE NOT NULL,
    periodo_fin DATE NOT NULL,
    servicios_promedio_dia NUMERIC DEFAULT 0,
    custodios_activos INTEGER DEFAULT 0,
    custodios_requeridos INTEGER DEFAULT 0,
    deficit_custodios INTEGER GENERATED ALWAYS AS (custodios_requeridos - custodios_activos) STORED,
    score_urgencia INTEGER CHECK (score_urgencia BETWEEN 1 AND 10) DEFAULT 5,
    gmv_promedio NUMERIC DEFAULT 0,
    ingresos_esperados_custodio NUMERIC DEFAULT 30000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para candidatos a custodios con geolocalización
CREATE TABLE public.candidatos_custodios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(200) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(100),
    ubicacion_residencia POINT,
    zona_preferida_id UUID REFERENCES public.zonas_operacion_nacional(id),
    fuente_reclutamiento VARCHAR(50) DEFAULT 'directo',
    estado_proceso VARCHAR(50) DEFAULT 'lead' CHECK (estado_proceso IN ('lead', 'contactado', 'entrevista', 'documentacion', 'capacitacion', 'activo', 'rechazado', 'inactivo')),
    fecha_contacto TIMESTAMP WITH TIME ZONE,
    calificacion_inicial INTEGER CHECK (calificacion_inicial BETWEEN 1 AND 10),
    experiencia_seguridad BOOLEAN DEFAULT FALSE,
    vehiculo_propio BOOLEAN DEFAULT FALSE,
    disponibilidad_horarios JSONB DEFAULT '{"lunes_viernes": true, "sabados": true, "domingos": false}'::jsonb,
    inversion_inicial_disponible NUMERIC DEFAULT 0,
    expectativa_ingresos NUMERIC DEFAULT 30000,
    notas_recruiter TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para alertas del sistema
CREATE TABLE public.alertas_sistema_nacional (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_alerta VARCHAR(50) NOT NULL CHECK (tipo_alerta IN ('critica', 'preventiva', 'estrategica')),
    categoria VARCHAR(100) NOT NULL,
    zona_id UUID REFERENCES public.zonas_operacion_nacional(id),
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT NOT NULL,
    datos_contexto JSONB DEFAULT '{}'::jsonb,
    prioridad INTEGER CHECK (prioridad BETWEEN 1 AND 10) DEFAULT 5,
    estado VARCHAR(50) DEFAULT 'activa' CHECK (estado IN ('activa', 'en_proceso', 'resuelta', 'descartada')),
    asignado_a UUID,
    fecha_resolucion TIMESTAMP WITH TIME ZONE,
    acciones_sugeridas TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para métricas de reclutamiento por canal
CREATE TABLE public.metricas_reclutamiento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zona_id UUID REFERENCES public.zonas_operacion_nacional(id),
    canal VARCHAR(100) NOT NULL,
    periodo_inicio DATE NOT NULL,
    periodo_fin DATE NOT NULL,
    inversion_marketing NUMERIC DEFAULT 0,
    leads_generados INTEGER DEFAULT 0,
    candidatos_calificados INTEGER DEFAULT 0,
    custodios_contratados INTEGER DEFAULT 0,
    costo_por_lead NUMERIC GENERATED ALWAYS AS (
        CASE WHEN leads_generados > 0 THEN inversion_marketing / leads_generados ELSE 0 END
    ) STORED,
    costo_por_contratacion NUMERIC GENERATED ALWAYS AS (
        CASE WHEN custodios_contratados > 0 THEN inversion_marketing / custodios_contratados ELSE 0 END
    ) STORED,
    tasa_conversion NUMERIC GENERATED ALWAYS AS (
        CASE WHEN leads_generados > 0 THEN (custodios_contratados::NUMERIC / leads_generados) * 100 ELSE 0 END
    ) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.zonas_operacion_nacional ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metricas_demanda_zona ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidatos_custodios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas_sistema_nacional ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metricas_reclutamiento ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (acceso para usuarios autenticados con roles administrativos)
CREATE POLICY "Admins pueden gestionar zonas" ON public.zonas_operacion_nacional
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'owner', 'manager', 'coordinador_operaciones')
    )
);

CREATE POLICY "Admins pueden gestionar métricas de demanda" ON public.metricas_demanda_zona
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'owner', 'manager', 'coordinador_operaciones')
    )
);

CREATE POLICY "Admins pueden gestionar candidatos" ON public.candidatos_custodios
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'owner', 'manager', 'coordinador_operaciones')
    )
);

CREATE POLICY "Admins pueden gestionar alertas" ON public.alertas_sistema_nacional
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'owner', 'manager', 'coordinador_operaciones')
    )
);

CREATE POLICY "Admins pueden gestionar métricas de reclutamiento" ON public.metricas_reclutamiento
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'owner', 'manager', 'coordinador_operaciones')
    )
);

-- Función para calcular el score de urgencia automáticamente
CREATE OR REPLACE FUNCTION public.calcular_score_urgencia_zona(p_zona_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deficit INTEGER;
    v_servicios_pendientes NUMERIC;
    v_score INTEGER;
BEGIN
    -- Obtener métricas actuales de la zona
    SELECT 
        COALESCE(deficit_custodios, 0),
        COALESCE(servicios_promedio_dia, 0)
    INTO v_deficit, v_servicios_pendientes
    FROM public.metricas_demanda_zona 
    WHERE zona_id = p_zona_id 
    AND periodo_fin >= CURRENT_DATE
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Calcular score basado en déficit y demanda
    v_score := CASE 
        WHEN v_deficit >= 5 OR v_servicios_pendientes > 20 THEN 10  -- Crítico
        WHEN v_deficit >= 3 OR v_servicios_pendientes > 15 THEN 8   -- Alto
        WHEN v_deficit >= 1 OR v_servicios_pendientes > 10 THEN 6   -- Medio
        WHEN v_deficit = 0 AND v_servicios_pendientes <= 5 THEN 2   -- Bajo
        ELSE 4  -- Normal
    END;
    
    RETURN v_score;
END;
$$;

-- Función para generar alertas automáticas
CREATE OR REPLACE FUNCTION public.generar_alertas_automaticas()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    zona_record RECORD;
    alert_exists BOOLEAN;
BEGIN
    -- Revisar cada zona y generar alertas según las métricas
    FOR zona_record IN 
        SELECT 
            z.id,
            z.nombre,
            m.deficit_custodios,
            m.servicios_promedio_dia,
            m.custodios_activos,
            m.score_urgencia
        FROM public.zonas_operacion_nacional z
        LEFT JOIN public.metricas_demanda_zona m ON z.id = m.zona_id
        WHERE m.periodo_fin >= CURRENT_DATE
    LOOP
        -- Alerta crítica: Sin custodios activos
        IF zona_record.custodios_activos = 0 THEN
            SELECT EXISTS(
                SELECT 1 FROM public.alertas_sistema_nacional 
                WHERE zona_id = zona_record.id 
                AND categoria = 'ZONA_SIN_COBERTURA' 
                AND estado = 'activa'
            ) INTO alert_exists;
            
            IF NOT alert_exists THEN
                INSERT INTO public.alertas_sistema_nacional (
                    tipo_alerta, categoria, zona_id, titulo, descripcion, prioridad,
                    datos_contexto, acciones_sugeridas
                ) VALUES (
                    'critica',
                    'ZONA_SIN_COBERTURA',
                    zona_record.id,
                    'Zona sin cobertura: ' || zona_record.nombre,
                    'La zona no tiene custodios activos. Riesgo operativo alto.',
                    10,
                    jsonb_build_object('custodios_activos', zona_record.custodios_activos),
                    ARRAY['Reclutamiento inmediato', 'Reasignación temporal de custodios']
                );
            END IF;
        END IF;
        
        -- Alerta preventiva: Déficit alto de custodios
        IF zona_record.deficit_custodios >= 3 THEN
            SELECT EXISTS(
                SELECT 1 FROM public.alertas_sistema_nacional 
                WHERE zona_id = zona_record.id 
                AND categoria = 'DEFICIT_CUSTODIOS' 
                AND estado = 'activa'
            ) INTO alert_exists;
            
            IF NOT alert_exists THEN
                INSERT INTO public.alertas_sistema_nacional (
                    tipo_alerta, categoria, zona_id, titulo, descripcion, prioridad,
                    datos_contexto, acciones_sugeridas
                ) VALUES (
                    'preventiva',
                    'DEFICIT_CUSTODIOS',
                    zona_record.id,
                    'Déficit de custodios: ' || zona_record.nombre,
                    'La zona necesita ' || zona_record.deficit_custodios || ' custodios adicionales.',
                    zona_record.score_urgencia,
                    jsonb_build_object('deficit', zona_record.deficit_custodios),
                    ARRAY['Acelerar proceso de reclutamiento', 'Campaña marketing local']
                );
            END IF;
        END IF;
        
        -- Alerta estratégica: Alta demanda
        IF zona_record.servicios_promedio_dia > 15 THEN
            SELECT EXISTS(
                SELECT 1 FROM public.alertas_sistema_nacional 
                WHERE zona_id = zona_record.id 
                AND categoria = 'OPORTUNIDAD_EXPANSION' 
                AND estado = 'activa'
            ) INTO alert_exists;
            
            IF NOT alert_exists THEN
                INSERT INTO public.alertas_sistema_nacional (
                    tipo_alerta, categoria, zona_id, titulo, descripcion, prioridad,
                    datos_contexto, acciones_sugeridas
                ) VALUES (
                    'estrategica',
                    'OPORTUNIDAD_EXPANSION',
                    zona_record.id,
                    'Oportunidad de expansión: ' || zona_record.nombre,
                    'Alta demanda de servicios (' || zona_record.servicios_promedio_dia || '/día). Oportunidad de crecimiento.',
                    7,
                    jsonb_build_object('servicios_dia', zona_record.servicios_promedio_dia),
                    ARRAY['Incrementar equipo de custodios', 'Evaluar precios premium']
                );
            END IF;
        END IF;
    END LOOP;
END;
$$;

-- Insertar datos iniciales de zonas estratégicas de México
INSERT INTO public.zonas_operacion_nacional (nombre, estados_incluidos, coordenadas_centro, radio_cobertura_km, prioridad_reclutamiento) VALUES
('Centro de México', ARRAY['Ciudad de México', 'Estado de México', 'Morelos'], POINT(-99.1332, 19.4326), 150, 10),
('Bajío', ARRAY['Guanajuato', 'Querétaro', 'Aguascalientes'], POINT(-101.2570, 21.0190), 200, 9),
('Occidente', ARRAY['Jalisco', 'Colima', 'Nayarit'], POINT(-103.3496, 20.6597), 250, 8),
('Norte', ARRAY['Nuevo León', 'Coahuila', 'Tamaulipas'], POINT(-100.3161, 25.6866), 300, 9),
('Pacífico', ARRAY['Sinaloa', 'Sonora', 'Baja California'], POINT(-110.9559, 29.0729), 400, 7),
('Golfo', ARRAY['Veracruz', 'Tabasco', 'Campeche'], POINT(-96.1342, 19.1738), 350, 6),
('Sureste', ARRAY['Yucatán', 'Quintana Roo', 'Chiapas'], POINT(-89.6567, 20.9674), 400, 5),
('Centro-Occidente', ARRAY['Michoacán', 'San Luis Potosí', 'Zacatecas'], POINT(-102.5528, 22.1565), 300, 6);

-- Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_zonas_updated_at BEFORE UPDATE ON public.zonas_operacion_nacional FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_metricas_updated_at BEFORE UPDATE ON public.metricas_demanda_zona FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_candidatos_updated_at BEFORE UPDATE ON public.candidatos_custodios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_alertas_updated_at BEFORE UPDATE ON public.alertas_sistema_nacional FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();