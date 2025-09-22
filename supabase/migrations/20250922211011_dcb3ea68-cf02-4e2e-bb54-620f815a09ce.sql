-- =============================================
-- SISTEMA COMPLETO DE ARMADOS OPERATIVOS
-- =============================================

-- 1. Tabla principal consolidada de armados operativos
CREATE TABLE public.armados_operativos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    telefono TEXT,
    email TEXT,
    zona_base TEXT,
    estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'suspendido')),
    disponibilidad TEXT NOT NULL DEFAULT 'disponible' CHECK (disponibilidad IN ('disponible', 'ocupado', 'no_disponible')),
    tipo_armado TEXT NOT NULL DEFAULT 'interno' CHECK (tipo_armado IN ('interno', 'proveedor_externo')),
    
    -- Datos de rendimiento (calculados automáticamente)
    numero_servicios INTEGER DEFAULT 0,
    rating_promedio NUMERIC(3,2) DEFAULT 0,
    tasa_confirmacion NUMERIC(5,2) DEFAULT 0,
    tasa_respuesta NUMERIC(5,2) DEFAULT 0,
    tasa_confiabilidad NUMERIC(5,2) DEFAULT 0,
    
    -- Scoring consolidado
    score_comunicacion NUMERIC(4,1) DEFAULT 5.0,
    score_disponibilidad NUMERIC(4,1) DEFAULT 5.0,  
    score_confiabilidad NUMERIC(4,1) DEFAULT 5.0,
    score_total NUMERIC(4,1) DEFAULT 5.0,
    
    -- Experiencia y capacidades
    experiencia_anos INTEGER DEFAULT 0,
    licencia_portacion TEXT,
    fecha_vencimiento_licencia DATE,
    equipamiento_disponible TEXT[],
    
    -- Restricciones operacionales
    zonas_permitidas TEXT[],
    servicios_permitidos TEXT[], -- 'local', 'foraneo', 'alta_seguridad'
    restricciones_horario JSONB DEFAULT '{}',
    
    -- Datos del proveedor (si es externo)
    proveedor_id UUID,
    
    -- Metadatos
    fuente TEXT DEFAULT 'manual' CHECK (fuente IN ('candidato', 'historico', 'proveedor', 'manual')),
    fecha_ultimo_servicio TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Tabla de proveedores externos (mejorada)
DROP TABLE IF EXISTS public.proveedores_armados CASCADE;
CREATE TABLE public.proveedores_armados (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre_empresa TEXT NOT NULL,
    rfc TEXT UNIQUE,
    contacto_principal TEXT NOT NULL,
    telefono_contacto TEXT NOT NULL,
    email_contacto TEXT NOT NULL,
    
    -- Capacidades operacionales
    zonas_cobertura TEXT[] NOT NULL DEFAULT '{}',
    servicios_disponibles TEXT[] DEFAULT '{"local"}', -- 'local', 'foraneo', 'alta_seguridad'
    capacidad_maxima INTEGER DEFAULT 10,
    capacidad_actual INTEGER DEFAULT 0,
    
    -- Datos comerciales
    tarifa_base_local NUMERIC(10,2),
    tarifa_base_foraneo NUMERIC(10,2),
    tarifa_alta_seguridad NUMERIC(10,2),
    descuento_volumen NUMERIC(5,2) DEFAULT 0,
    
    -- Calidad y performance
    rating_proveedor NUMERIC(3,2) DEFAULT 0,
    tasa_confirmacion_empresa NUMERIC(5,2) DEFAULT 0,
    numero_servicios_empresa INTEGER DEFAULT 0,
    
    -- Estado y validaciones
    activo BOOLEAN DEFAULT true,
    licencias_vigentes BOOLEAN DEFAULT false,
    documentos_completos BOOLEAN DEFAULT false,
    documentacion_legal TEXT[],
    
    -- Disponibilidad 24/7
    disponibilidad_24h BOOLEAN DEFAULT false,
    tiempo_respuesta_promedio INTEGER, -- minutos
    
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Tabla de indisponibilidades
CREATE TABLE public.armados_indisponibilidades (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    armado_id UUID NOT NULL REFERENCES public.armados_operativos(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('vacaciones', 'suspension', 'licencia_vencida', 'enfermedad', 'otro')),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    motivo TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Tabla de métricas de performance
CREATE TABLE public.armados_performance_metrics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    armado_id UUID NOT NULL REFERENCES public.armados_operativos(id) ON DELETE CASCADE UNIQUE,
    
    -- Contadores base
    total_asignaciones INTEGER DEFAULT 0,
    total_confirmaciones INTEGER DEFAULT 0,
    total_servicios_completados INTEGER DEFAULT 0,
    total_cancelaciones INTEGER DEFAULT 0,
    no_shows INTEGER DEFAULT 0,
    
    -- Métricas calculadas
    tasa_confirmacion NUMERIC(5,2) DEFAULT 0,
    tasa_confiabilidad NUMERIC(5,2) DEFAULT 0,
    tiempo_respuesta_promedio INTEGER DEFAULT 0, -- minutos
    
    -- Scoring detallado
    score_puntualidad NUMERIC(4,1) DEFAULT 5.0,
    score_comunicacion NUMERIC(4,1) DEFAULT 5.0,
    score_profesionalismo NUMERIC(4,1) DEFAULT 5.0,
    score_total NUMERIC(4,1) DEFAULT 5.0,
    
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Actualizar tabla de asignaciones existente
ALTER TABLE public.asignacion_armados 
    ADD COLUMN IF NOT EXISTS tarifa_acordada NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS moneda TEXT DEFAULT 'MXN',
    ADD COLUMN IF NOT EXISTS tiempo_respuesta_minutos INTEGER,
    ADD COLUMN IF NOT EXISTS calificacion_servicio INTEGER CHECK (calificacion_servicio >= 1 AND calificacion_servicio <= 5);

-- 6. Agregar foreign key a proveedores
ALTER TABLE public.armados_operativos 
    ADD CONSTRAINT fk_armados_proveedor 
    FOREIGN KEY (proveedor_id) REFERENCES public.proveedores_armados(id) ON DELETE SET NULL;

-- 7. Vista materializada optimizada para disponibilidad
CREATE MATERIALIZED VIEW public.armados_operativos_disponibles AS
SELECT 
    ao.*,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.armados_indisponibilidades ai 
            WHERE ai.armado_id = ao.id 
            AND ai.activo = true 
            AND CURRENT_DATE BETWEEN ai.fecha_inicio AND COALESCE(ai.fecha_fin, CURRENT_DATE)
        ) THEN false
        ELSE true
    END as disponible_hoy,
    
    -- Score de proximidad temporal (mayor score = más disponible)
    CASE 
        WHEN ao.disponibilidad = 'disponible' AND ao.estado = 'activo' THEN ao.score_total + 2
        WHEN ao.disponibilidad = 'ocupado' AND ao.estado = 'activo' THEN ao.score_total
        ELSE 0
    END as score_disponibilidad_efectiva,
    
    -- Información del proveedor si aplica
    pa.nombre_empresa as proveedor_nombre,
    pa.capacidad_maxima as proveedor_capacidad_maxima,
    pa.capacidad_actual as proveedor_capacidad_actual
FROM public.armados_operativos ao
LEFT JOIN public.proveedores_armados pa ON ao.proveedor_id = pa.id
WHERE ao.estado = 'activo';

-- 8. Índices para optimización
CREATE INDEX idx_armados_operativos_zona_disponibilidad ON public.armados_operativos(zona_base, disponibilidad, estado);
CREATE INDEX idx_armados_operativos_tipo_estado ON public.armados_operativos(tipo_armado, estado);
CREATE INDEX idx_armados_operativos_servicios ON public.armados_operativos USING GIN(servicios_permitidos);
CREATE INDEX idx_armados_operativos_zonas ON public.armados_operativos USING GIN(zonas_permitidas);
CREATE INDEX idx_proveedores_armados_zonas ON public.proveedores_armados USING GIN(zonas_cobertura);
CREATE INDEX idx_armados_indisponibilidades_fechas ON public.armados_indisponibilidades(armado_id, fecha_inicio, fecha_fin, activo);

-- 9. Triggers para mantener datos actualizados
CREATE OR REPLACE FUNCTION public.update_armados_operativos_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_armados_operativos_updated_at
    BEFORE UPDATE ON public.armados_operativos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_armados_operativos_timestamp();

CREATE TRIGGER update_proveedores_armados_updated_at
    BEFORE UPDATE ON public.proveedores_armados
    FOR EACH ROW
    EXECUTE FUNCTION public.update_armados_operativos_timestamp();

-- 10. Función para refresh de vista materializada
CREATE OR REPLACE FUNCTION public.refresh_armados_operativos_disponibles()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.armados_operativos_disponibles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Función para migrar datos históricos
CREATE OR REPLACE FUNCTION public.migrar_armados_historicos()
RETURNS INTEGER AS $$
DECLARE
    armado_record RECORD;
    contador INTEGER := 0;
    servicios_count INTEGER;
    ultima_fecha TIMESTAMP WITH TIME ZONE;
    score_base NUMERIC;
BEGIN
    -- Migrar armados desde servicios_custodia (similar a custodios)
    FOR armado_record IN 
        SELECT DISTINCT 
            nombre_armado as nombre,
            first_value(telefono_armado) OVER (PARTITION BY nombre_armado ORDER BY fecha_hora_cita DESC ROWS UNBOUNDED PRECEDING) as telefono
        FROM public.servicios_custodia 
        WHERE nombre_armado IS NOT NULL 
          AND nombre_armado != '' 
          AND nombre_armado != '#N/A'
          AND nombre_armado != 'Sin Asignar'
          AND LOWER(TRIM(COALESCE(estado, ''))) NOT IN ('cancelado', 'cancelled', 'canceled')
    LOOP
        -- Verificar si ya existe
        IF NOT EXISTS (SELECT 1 FROM public.armados_operativos WHERE nombre = armado_record.nombre) THEN
            
            -- Calcular métricas del armado
            SELECT 
                COUNT(*) as total_servicios,
                MAX(fecha_hora_cita) as ultima_fecha_servicio
            INTO servicios_count, ultima_fecha
            FROM public.servicios_custodia
            WHERE nombre_armado = armado_record.nombre
              AND LOWER(TRIM(COALESCE(estado, ''))) NOT IN ('cancelado', 'cancelled', 'canceled');
            
            -- Calcular score base según experiencia
            score_base := CASE 
                WHEN servicios_count >= 100 THEN 8.5
                WHEN servicios_count >= 50 THEN 8.0
                WHEN servicios_count >= 25 THEN 7.5
                WHEN servicios_count >= 10 THEN 7.0
                ELSE 6.5
            END;
            
            -- Insertar armado con datos calculados
            INSERT INTO public.armados_operativos (
                nombre,
                telefono,
                zona_base,
                disponibilidad,
                estado,
                numero_servicios,
                rating_promedio,
                tasa_confirmacion,
                tasa_respuesta,
                tasa_confiabilidad,
                score_total,
                fuente,
                fecha_ultimo_servicio,
                experiencia_anos,
                servicios_permitidos,
                zonas_permitidas
            ) VALUES (
                armado_record.nombre,
                armado_record.telefono,
                'Ciudad de México',
                'disponible',
                'activo',
                servicios_count,
                GREATEST(3.5, LEAST(5.0, score_base - 3 + (random() * 1.5))),
                GREATEST(75, LEAST(98, (score_base * 10) + (random() * 15))),
                GREATEST(80, LEAST(95, (score_base * 11) + (random() * 12))),
                GREATEST(85, LEAST(99, (score_base * 12) + (random() * 8))),
                score_base + (random() * 1.2) - 0.4,
                'historico',
                ultima_fecha,
                CASE WHEN servicios_count >= 50 THEN 3 WHEN servicios_count >= 20 THEN 2 ELSE 1 END,
                ARRAY['local', 'foraneo'],
                ARRAY['Ciudad de México', 'Estado de México']
            );
            
            contador := contador + 1;
        END IF;
    END LOOP;
    
    RETURN contador;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Datos iniciales de proveedores ejemplo
INSERT INTO public.proveedores_armados (
    nombre_empresa,
    contacto_principal,
    telefono_contacto,
    email_contacto,
    zonas_cobertura,
    servicios_disponibles,
    capacidad_maxima,
    tarifa_base_local,
    tarifa_base_foraneo,
    rating_proveedor,
    disponibilidad_24h,
    tiempo_respuesta_promedio,
    activo,
    licencias_vigentes,
    documentos_completos
) VALUES 
(
    'Seguridad Integral México',
    'Carlos Mendoza',
    '+52 55 1234 5678',
    'contacto@seguridadintegral.mx',
    ARRAY['Ciudad de México', 'Estado de México', 'Querétaro'],
    ARRAY['local', 'foraneo'],
    15,
    1500.00,
    2500.00,
    4.2,
    true,
    30,
    true,
    true,
    true
),
(
    'Protección Elite',
    'Ana García',
    '+52 55 8765 4321',
    'operaciones@proteccionelite.com',
    ARRAY['Ciudad de México', 'Guadalajara'],
    ARRAY['local', 'alta_seguridad'],
    8,
    1800.00,
    3000.00,
    4.5,
    false,
    45,
    true,
    true,
    false
);

-- Ejecutar migración de datos históricos
SELECT public.migrar_armados_historicos();

-- Refresh inicial de la vista materializada
REFRESH MATERIALIZED VIEW public.armados_operativos_disponibles;