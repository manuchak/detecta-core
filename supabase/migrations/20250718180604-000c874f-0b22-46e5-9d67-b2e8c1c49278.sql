-- SISTEMA DE CAPTURA DE GASTOS EXTERNOS PARA ROI

-- Tabla para categorías de gastos
CREATE TABLE public.categorias_gastos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('marketing', 'personal', 'tecnologia', 'operaciones', 'eventos', 'otros')),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para registrar gastos externos
CREATE TABLE public.gastos_externos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria_id UUID REFERENCES public.categorias_gastos(id),
    zona_id UUID REFERENCES public.zonas_operacion_nacional(id),
    concepto VARCHAR(200) NOT NULL,
    descripcion TEXT,
    monto NUMERIC NOT NULL CHECK (monto >= 0),
    moneda VARCHAR(3) DEFAULT 'MXN',
    fecha_gasto DATE NOT NULL,
    fecha_vencimiento DATE,
    metodo_pago VARCHAR(50),
    proveedor VARCHAR(100),
    numero_factura VARCHAR(100),
    comprobante_url TEXT,
    canal_reclutamiento VARCHAR(100), -- Para gastos de marketing específicos
    custodios_objetivo INTEGER, -- Cuántos custodios se esperan de este gasto
    custodios_reales INTEGER DEFAULT 0, -- Cuántos se obtuvieron realmente
    aprobado_por UUID,
    estado VARCHAR(50) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'pagado', 'rechazado')),
    registrado_por UUID NOT NULL,
    notas TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para presupuestos por zona y período
CREATE TABLE public.presupuestos_zona (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zona_id UUID REFERENCES public.zonas_operacion_nacional(id),
    categoria_id UUID REFERENCES public.categorias_gastos(id),
    periodo_inicio DATE NOT NULL,
    periodo_fin DATE NOT NULL,
    presupuesto_asignado NUMERIC NOT NULL CHECK (presupuesto_asignado >= 0),
    presupuesto_utilizado NUMERIC DEFAULT 0,
    custodios_objetivo INTEGER DEFAULT 0,
    roi_esperado NUMERIC, -- ROI que se espera con este presupuesto
    aprobado_por UUID,
    estado VARCHAR(50) DEFAULT 'activo' CHECK (estado IN ('activo', 'pausado', 'completado', 'cancelado')),
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT periodo_valido CHECK (periodo_fin >= periodo_inicio)
);

-- Tabla para tracking de ROI por custodio y zona
CREATE TABLE public.roi_custodios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    custodio_id UUID, -- Puede ser NULL para métricas agregadas
    zona_id UUID REFERENCES public.zonas_operacion_nacional(id),
    periodo_inicio DATE NOT NULL,
    periodo_fin DATE NOT NULL,
    inversion_total NUMERIC DEFAULT 0, -- Gasto total para adquirir este custodio
    ingresos_generados NUMERIC DEFAULT 0, -- GMV generado por este custodio
    servicios_completados INTEGER DEFAULT 0,
    dias_activo INTEGER DEFAULT 0,
    costo_adquisicion NUMERIC GENERATED ALWAYS AS (
        CASE WHEN custodio_id IS NOT NULL THEN inversion_total ELSE 
            CASE WHEN servicios_completados > 0 THEN inversion_total / servicios_completados ELSE 0 END 
        END
    ) STORED,
    roi_percentage NUMERIC GENERATED ALWAYS AS (
        CASE WHEN inversion_total > 0 THEN 
            ((ingresos_generados - inversion_total) / inversion_total) * 100 
        ELSE 0 END
    ) STORED,
    ltv_estimado NUMERIC, -- Lifetime Value estimado
    payback_dias INTEGER, -- Días para recuperar la inversión
    estado_custodio VARCHAR(50) DEFAULT 'activo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para métricas de canales de reclutamiento
CREATE TABLE public.metricas_canales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canal VARCHAR(100) NOT NULL,
    zona_id UUID REFERENCES public.zonas_operacion_nacional(id),
    periodo_inicio DATE NOT NULL,
    periodo_fin DATE NOT NULL,
    inversion NUMERIC DEFAULT 0,
    leads_generados INTEGER DEFAULT 0,
    candidatos_calificados INTEGER DEFAULT 0,
    custodios_contratados INTEGER DEFAULT 0,
    custodios_activos INTEGER DEFAULT 0, -- Custodios que siguen activos
    costo_por_lead NUMERIC GENERATED ALWAYS AS (
        CASE WHEN leads_generados > 0 THEN inversion / leads_generados ELSE 0 END
    ) STORED,
    costo_por_contratacion NUMERIC GENERATED ALWAYS AS (
        CASE WHEN custodios_contratados > 0 THEN inversion / custodios_contratados ELSE 0 END
    ) STORED,
    tasa_conversion_lead_candidato NUMERIC GENERATED ALWAYS AS (
        CASE WHEN leads_generados > 0 THEN (candidatos_calificados::NUMERIC / leads_generados) * 100 ELSE 0 END
    ) STORED,
    tasa_conversion_candidato_custodio NUMERIC GENERATED ALWAYS AS (
        CASE WHEN candidatos_calificados > 0 THEN (custodios_contratados::NUMERIC / candidatos_calificados) * 100 ELSE 0 END
    ) STORED,
    tasa_retencion NUMERIC GENERATED ALWAYS AS (
        CASE WHEN custodios_contratados > 0 THEN (custodios_activos::NUMERIC / custodios_contratados) * 100 ELSE 0 END
    ) STORED,
    roi_canal NUMERIC DEFAULT 0, -- ROI específico del canal
    calidad_promedio NUMERIC, -- Calificación promedio de custodios de este canal
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.categorias_gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gastos_externos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presupuestos_zona ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roi_custodios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metricas_canales ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para gestión financiera (solo admin, owner, manager)
CREATE POLICY "Admins pueden gestionar categorías de gastos" ON public.categorias_gastos
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'owner', 'manager', 'coordinador_operaciones')
    )
);

CREATE POLICY "Admins pueden gestionar gastos externos" ON public.gastos_externos
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'owner', 'manager', 'coordinador_operaciones')
    )
);

CREATE POLICY "Admins pueden gestionar presupuestos" ON public.presupuestos_zona
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'owner', 'manager')
    )
);

CREATE POLICY "Admins pueden ver ROI de custodios" ON public.roi_custodios
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'owner', 'manager', 'coordinador_operaciones')
    )
);

CREATE POLICY "Admins pueden gestionar métricas de canales" ON public.metricas_canales
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'owner', 'manager', 'coordinador_operaciones')
    )
);

-- Función para calcular ROI automáticamente
CREATE OR REPLACE FUNCTION public.calcular_roi_zona(p_zona_id UUID, p_periodo_dias INTEGER DEFAULT 90)
RETURNS TABLE(
    zona_nombre TEXT,
    inversion_total NUMERIC,
    ingresos_generados NUMERIC,
    roi_percentage NUMERIC,
    custodios_adquiridos INTEGER,
    costo_promedio_adquisicion NUMERIC,
    servicios_totales INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    fecha_limite DATE;
BEGIN
    fecha_limite := CURRENT_DATE - INTERVAL '1 day' * p_periodo_dias;
    
    RETURN QUERY
    SELECT 
        z.nombre,
        COALESCE(SUM(ge.monto), 0) as inversion_total,
        COALESCE(SUM(rc.ingresos_generados), 0) as ingresos_generados,
        CASE 
            WHEN COALESCE(SUM(ge.monto), 0) > 0 THEN 
                ((COALESCE(SUM(rc.ingresos_generados), 0) - COALESCE(SUM(ge.monto), 0)) / COALESCE(SUM(ge.monto), 0)) * 100
            ELSE 0 
        END as roi_percentage,
        COALESCE(COUNT(DISTINCT rc.custodio_id), 0)::INTEGER as custodios_adquiridos,
        CASE 
            WHEN COUNT(DISTINCT rc.custodio_id) > 0 THEN 
                COALESCE(SUM(ge.monto), 0) / COUNT(DISTINCT rc.custodio_id)
            ELSE 0 
        END as costo_promedio_adquisicion,
        COALESCE(SUM(rc.servicios_completados), 0)::INTEGER as servicios_totales
    FROM public.zonas_operacion_nacional z
    LEFT JOIN public.gastos_externos ge ON z.id = ge.zona_id 
        AND ge.fecha_gasto >= fecha_limite 
        AND ge.estado = 'pagado'
    LEFT JOIN public.roi_custodios rc ON z.id = rc.zona_id 
        AND rc.periodo_inicio >= fecha_limite
    WHERE z.id = p_zona_id
    GROUP BY z.id, z.nombre;
END;
$$;

-- Función para actualizar métricas de ROI automáticamente
CREATE OR REPLACE FUNCTION public.actualizar_roi_custodios()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    fecha_inicio DATE;
    zona_record RECORD;
BEGIN
    fecha_inicio := CURRENT_DATE - INTERVAL '30 days';
    
    -- Iterar por cada zona
    FOR zona_record IN 
        SELECT id FROM public.zonas_operacion_nacional
    LOOP
        -- Actualizar o insertar métricas de ROI para la zona
        INSERT INTO public.roi_custodios (
            zona_id, 
            periodo_inicio, 
            periodo_fin, 
            inversion_total, 
            ingresos_generados, 
            servicios_completados
        )
        SELECT 
            zona_record.id,
            fecha_inicio,
            CURRENT_DATE,
            COALESCE(SUM(ge.monto), 0),
            COALESCE(SUM(
                CASE 
                    WHEN sc.cobro_cliente IS NOT NULL THEN sc.cobro_cliente 
                    ELSE 0 
                END
            ), 0),
            COUNT(sc.id_servicio)::INTEGER
        FROM public.gastos_externos ge
        FULL OUTER JOIN public.servicios_custodia sc ON ge.zona_id IS NOT NULL
        WHERE (ge.zona_id = zona_record.id OR sc.fecha_hora_cita >= fecha_inicio)
            AND ge.fecha_gasto >= fecha_inicio
            AND ge.estado = 'pagado'
        ON CONFLICT (zona_id, periodo_fin) 
        DO UPDATE SET
            inversion_total = EXCLUDED.inversion_total,
            ingresos_generados = EXCLUDED.ingresos_generados,
            servicios_completados = EXCLUDED.servicios_completados,
            updated_at = NOW();
    END LOOP;
END;
$$;

-- Insertar categorías de gastos predefinidas
INSERT INTO public.categorias_gastos (nombre, descripcion, tipo) VALUES
('Marketing Digital', 'Facebook, Google Ads, LinkedIn, etc.', 'marketing'),
('Marketing Tradicional', 'Radio, volantes, periódicos', 'marketing'),
('Eventos de Reclutamiento', 'Ferias de empleo, eventos presenciales', 'eventos'),
('Salarios Recruiters', 'Salarios del equipo de reclutamiento', 'personal'),
('Bonos y Comisiones', 'Incentivos por contratación exitosa', 'personal'),
('Software y Herramientas', 'CRM, software de tracking, etc.', 'tecnologia'),
('Viáticos y Traslados', 'Gastos de viaje del equipo', 'operaciones'),
('Material Promocional', 'Uniformes, folletos, material de marca', 'marketing'),
('Capacitación', 'Entrenamientos y certificaciones', 'personal'),
('Otros Gastos', 'Gastos diversos no clasificados', 'otros');

-- Triggers para actualizar timestamps
CREATE TRIGGER update_categorias_gastos_updated_at BEFORE UPDATE ON public.categorias_gastos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_gastos_externos_updated_at BEFORE UPDATE ON public.gastos_externos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_presupuestos_zona_updated_at BEFORE UPDATE ON public.presupuestos_zona FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_roi_custodios_updated_at BEFORE UPDATE ON public.roi_custodios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_metricas_canales_updated_at BEFORE UPDATE ON public.metricas_canales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();