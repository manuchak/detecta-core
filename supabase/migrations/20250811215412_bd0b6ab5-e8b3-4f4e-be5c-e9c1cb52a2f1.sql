-- =====================================================
-- MÓDULO DE PLANEACIÓN DE CUSTODIAS
-- =====================================================

-- Tipos ENUM necesarios
CREATE TYPE public.estado_custodio AS ENUM ('activo', 'inactivo');
CREATE TYPE public.disponibilidad_custodio AS ENUM ('disponible', 'ocupado', 'off');
CREATE TYPE public.tipo_custodia AS ENUM ('armado', 'no_armado');
CREATE TYPE public.estado_servicio AS ENUM ('nuevo', 'en_oferta', 'asignado', 'en_curso', 'finalizado', 'cancelado');
CREATE TYPE public.estado_oferta AS ENUM ('enviada', 'aceptada', 'rechazada', 'expirada');
CREATE TYPE public.tipo_evento AS ENUM ('desvio', 'jammer', 'ign_on', 'ign_off', 'arribo_poi', 'contacto_custodio', 'contacto_cliente', 'otro');
CREATE TYPE public.severidad_evento AS ENUM ('baja', 'media', 'alta', 'critica');
CREATE TYPE public.actor_touchpoint AS ENUM ('C4', 'Planificador', 'Custodio', 'Cliente');
CREATE TYPE public.canal_comunicacion AS ENUM ('whatsapp', 'app', 'telefono', 'email');
CREATE TYPE public.tipo_servicio_custodia AS ENUM ('traslado', 'custodia_local', 'escolta', 'vigilancia');

-- =====================================================
-- 1. CATÁLOGOS
-- =====================================================

-- Tabla de Clientes
CREATE TABLE public.pc_clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    rfc TEXT,
    contacto_nombre TEXT NOT NULL,
    contacto_tel TEXT NOT NULL,
    contacto_email TEXT,
    sla_minutos_asignacion INTEGER DEFAULT 60,
    notas TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Tabla de Custodios
CREATE TABLE public.pc_custodios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    tel TEXT NOT NULL,
    email TEXT,
    rating_promedio DECIMAL(3,2) DEFAULT 5.0,
    dias_sin_actividad INTEGER DEFAULT 0,
    zona_base TEXT,
    lat DECIMAL(10,8),
    lng DECIMAL(11,8),
    tiene_gadgets BOOLEAN DEFAULT false,
    tipo_custodia tipo_custodia DEFAULT 'no_armado',
    certificaciones TEXT[] DEFAULT '{}',
    estado estado_custodio DEFAULT 'activo',
    disponibilidad disponibilidad_custodio DEFAULT 'disponible',
    ultima_actividad TIMESTAMP WITH TIME ZONE DEFAULT now(),
    cuenta_bancaria JSONB,
    documentos TEXT[] DEFAULT '{}',
    comentarios TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla de Rutas Frecuentes
CREATE TABLE public.pc_rutas_frecuentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES pc_clientes(id) ON DELETE CASCADE,
    nombre_ruta TEXT NOT NULL,
    origen_texto TEXT NOT NULL,
    origen_lat DECIMAL(10,8),
    origen_lng DECIMAL(11,8),
    destino_texto TEXT NOT NULL,
    destino_lat DECIMAL(10,8),
    destino_lng DECIMAL(11,8),
    km_estimados DECIMAL(8,2),
    tiempo_estimado_min INTEGER,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- 2. OPERACIÓN
-- =====================================================

-- Tabla de Servicios
CREATE TABLE public.pc_servicios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folio TEXT NOT NULL UNIQUE,
    cliente_id UUID NOT NULL REFERENCES pc_clientes(id),
    fecha_programada DATE NOT NULL,
    hora_ventana_inicio TIME NOT NULL,
    hora_ventana_fin TIME NOT NULL,
    origen_texto TEXT NOT NULL,
    origen_lat DECIMAL(10,8),
    origen_lng DECIMAL(11,8),
    destino_texto TEXT NOT NULL,
    destino_lat DECIMAL(10,8),
    destino_lng DECIMAL(11,8),
    tipo_servicio tipo_servicio_custodia DEFAULT 'traslado',
    requiere_gadgets BOOLEAN DEFAULT false,
    estado estado_servicio DEFAULT 'nuevo',
    custodio_asignado_id UUID REFERENCES pc_custodios(id),
    motivo_cancelacion TEXT,
    notas_especiales TEXT,
    prioridad INTEGER DEFAULT 5, -- 1-10 donde 10 es mayor prioridad
    valor_estimado DECIMAL(10,2),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla de Ofertas a Custodios
CREATE TABLE public.pc_ofertas_custodio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    servicio_id UUID NOT NULL REFERENCES pc_servicios(id) ON DELETE CASCADE,
    custodio_id UUID NOT NULL REFERENCES pc_custodios(id),
    estado estado_oferta DEFAULT 'enviada',
    motivo_rechazo TEXT,
    score_asignacion DECIMAL(5,3), -- Score calculado para esta oferta
    ola_numero INTEGER DEFAULT 1, -- Número de ola de oferta
    enviada_en TIMESTAMP WITH TIME ZONE DEFAULT now(),
    respondida_en TIMESTAMP WITH TIME ZONE,
    expira_en TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '10 minutes'),
    canal canal_comunicacion DEFAULT 'whatsapp',
    mensaje_enviado TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla de Asignaciones
CREATE TABLE public.pc_asignaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    servicio_id UUID NOT NULL REFERENCES pc_servicios(id) ON DELETE CASCADE,
    custodio_id UUID NOT NULL REFERENCES pc_custodios(id),
    oferta_id UUID REFERENCES pc_ofertas_custodio(id),
    aceptada_en TIMESTAMP WITH TIME ZONE DEFAULT now(),
    confirmada_por_planificador BOOLEAN DEFAULT false,
    confirmada_por UUID REFERENCES auth.users(id),
    confirmada_en TIMESTAMP WITH TIME ZONE,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(servicio_id) -- Un servicio solo puede tener una asignación activa
);

-- Tabla de Eventos de Monitoreo
CREATE TABLE public.pc_eventos_monitoreo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    servicio_id UUID NOT NULL REFERENCES pc_servicios(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    tipo tipo_evento NOT NULL,
    severidad severidad_evento DEFAULT 'media',
    detalle TEXT NOT NULL,
    ubicacion_lat DECIMAL(10,8),
    ubicacion_lng DECIMAL(11,8),
    adjuntos TEXT[] DEFAULT '{}',
    resuelto BOOLEAN DEFAULT false,
    resuelto_por UUID REFERENCES auth.users(id),
    resuelto_en TIMESTAMP WITH TIME ZONE,
    notas_resolucion TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla de Touchpoints
CREATE TABLE public.pc_touchpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    servicio_id UUID NOT NULL REFERENCES pc_servicios(id) ON DELETE CASCADE,
    actor actor_touchpoint NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    medio canal_comunicacion NOT NULL,
    notas TEXT NOT NULL,
    duracion_min INTEGER, -- Para llamadas telefónicas
    adjuntos TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla de Costos e Ingresos
CREATE TABLE public.pc_costos_ingresos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    servicio_id UUID NOT NULL REFERENCES pc_servicios(id) ON DELETE CASCADE,
    costo_custodio DECIMAL(10,2) DEFAULT 0,
    casetas DECIMAL(10,2) DEFAULT 0,
    viaticos DECIMAL(10,2) DEFAULT 0,
    otros_costos DECIMAL(10,2) DEFAULT 0,
    cobro_cliente DECIMAL(10,2) DEFAULT 0,
    variacion DECIMAL(10,2) DEFAULT 0,
    margen DECIMAL(10,2) GENERATED ALWAYS AS (cobro_cliente - (costo_custodio + casetas + viaticos + otros_costos + variacion)) STORED,
    porcentaje_margen DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN cobro_cliente > 0 THEN 
                ((cobro_cliente - (costo_custodio + casetas + viaticos + otros_costos + variacion)) / cobro_cliente) * 100
            ELSE 0
        END
    ) STORED,
    notas_costos TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- 3. CONFIGURACIÓN DE SCORING
-- =====================================================

-- Tabla de Configuración de Pesos para Scoring
CREATE TABLE public.pc_config_scoring (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_config TEXT NOT NULL,
    peso_antiguo_inactivo DECIMAL(3,2) DEFAULT 0.15,
    peso_distancia_origen DECIMAL(3,2) DEFAULT 0.25,
    peso_rating DECIMAL(3,2) DEFAULT 0.15,
    peso_match_tipo DECIMAL(3,2) DEFAULT 0.20,
    peso_gadgets DECIMAL(3,2) DEFAULT 0.10,
    peso_certificaciones DECIMAL(3,2) DEFAULT 0.10,
    peso_confirmado_disponible DECIMAL(3,2) DEFAULT 0.05,
    activa BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insertar configuración por defecto
INSERT INTO public.pc_config_scoring (
    nombre_config, 
    peso_antiguo_inactivo,
    peso_distancia_origen,
    peso_rating,
    peso_match_tipo,
    peso_gadgets,
    peso_certificaciones,
    peso_confirmado_disponible,
    activa
) VALUES (
    'Configuración Default',
    0.15, 0.25, 0.15, 0.20, 0.10, 0.10, 0.05,
    true
);

-- =====================================================
-- 4. AUDITORÍA
-- =====================================================

-- Tabla de Logs de Auditoría
CREATE TABLE public.pc_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES auth.users(id),
    accion TEXT NOT NULL,
    entidad TEXT NOT NULL,
    entidad_id UUID,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    payload JSONB,
    ip_address INET,
    user_agent TEXT
);

-- =====================================================
-- 5. FUNCIONES DE UTILIDAD
-- =====================================================

-- Función para generar folio único
CREATE OR REPLACE FUNCTION public.generar_folio_servicio()
RETURNS TEXT AS $$
BEGIN
    RETURN 'SRV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
           LPAD(EXTRACT(epoch FROM clock_timestamp())::bigint::text, 10, '0');
END;
$$ LANGUAGE plpgsql;

-- Función para calcular distancia entre dos puntos (fórmula de Haversine)
CREATE OR REPLACE FUNCTION public.calcular_distancia_km(
    lat1 DECIMAL, lng1 DECIMAL, 
    lat2 DECIMAL, lng2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    r DECIMAL := 6371; -- Radio de la Tierra en km
    dlat DECIMAL;
    dlng DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    IF lat1 IS NULL OR lng1 IS NULL OR lat2 IS NULL OR lng2 IS NULL THEN
        RETURN NULL;
    END IF;
    
    dlat := RADIANS(lat2 - lat1);
    dlng := RADIANS(lng2 - lng1);
    
    a := SIN(dlat/2) * SIN(dlat/2) + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(dlng/2) * SIN(dlng/2);
    c := 2 * ATAN2(SQRT(a), SQRT(1-a));
    
    RETURN r * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- 6. TRIGGERS
-- =====================================================

-- Trigger para auto-generar folio en servicios
CREATE OR REPLACE FUNCTION public.trigger_generar_folio()
RETURNS trigger AS $$
BEGIN
    IF NEW.folio IS NULL OR NEW.folio = '' THEN
        NEW.folio := generar_folio_servicio();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pc_servicios_folio
    BEFORE INSERT ON public.pc_servicios
    FOR EACH ROW EXECUTE FUNCTION trigger_generar_folio();

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.trigger_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de updated_at a tablas relevantes
CREATE TRIGGER trigger_pc_clientes_updated_at
    BEFORE UPDATE ON public.pc_clientes
    FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();

CREATE TRIGGER trigger_pc_custodios_updated_at
    BEFORE UPDATE ON public.pc_custodios
    FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();

CREATE TRIGGER trigger_pc_servicios_updated_at
    BEFORE UPDATE ON public.pc_servicios
    FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();

CREATE TRIGGER trigger_pc_costos_ingresos_updated_at
    BEFORE UPDATE ON public.pc_costos_ingresos
    FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();

-- =====================================================
-- 7. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para búsquedas frecuentes
CREATE INDEX idx_pc_servicios_estado ON public.pc_servicios(estado);
CREATE INDEX idx_pc_servicios_fecha ON public.pc_servicios(fecha_programada);
CREATE INDEX idx_pc_servicios_cliente ON public.pc_servicios(cliente_id);
CREATE INDEX idx_pc_servicios_custodio ON public.pc_servicios(custodio_asignado_id);

CREATE INDEX idx_pc_custodios_estado ON public.pc_custodios(estado);
CREATE INDEX idx_pc_custodios_disponibilidad ON public.pc_custodios(disponibilidad);
CREATE INDEX idx_pc_custodios_ubicacion ON public.pc_custodios(lat, lng);

CREATE INDEX idx_pc_ofertas_servicio ON public.pc_ofertas_custodio(servicio_id);
CREATE INDEX idx_pc_ofertas_custodio_estado ON public.pc_ofertas_custodio(custodio_id, estado);
CREATE INDEX idx_pc_ofertas_expira ON public.pc_ofertas_custodio(expira_en);

CREATE INDEX idx_pc_eventos_servicio ON public.pc_eventos_monitoreo(servicio_id);
CREATE INDEX idx_pc_eventos_timestamp ON public.pc_eventos_monitoreo(timestamp);
CREATE INDEX idx_pc_eventos_tipo ON public.pc_eventos_monitoreo(tipo, severidad);

CREATE INDEX idx_pc_audit_log_timestamp ON public.pc_audit_log(timestamp);
CREATE INDEX idx_pc_audit_log_usuario ON public.pc_audit_log(usuario_id);
CREATE INDEX idx_pc_audit_log_entidad ON public.pc_audit_log(entidad, entidad_id);

-- =====================================================
-- 8. BÚSQUEDA FULL-TEXT
-- =====================================================

-- Configurar búsqueda full-text para clientes
ALTER TABLE public.pc_clientes ADD COLUMN search_vector tsvector;

CREATE OR REPLACE FUNCTION public.update_pc_clientes_search()
RETURNS trigger AS $$
BEGIN
    NEW.search_vector := to_tsvector('spanish', 
        COALESCE(NEW.nombre, '') || ' ' ||
        COALESCE(NEW.rfc, '') || ' ' ||
        COALESCE(NEW.contacto_nombre, '') || ' ' ||
        COALESCE(NEW.notas, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pc_clientes_search
    BEFORE INSERT OR UPDATE ON public.pc_clientes
    FOR EACH ROW EXECUTE FUNCTION update_pc_clientes_search();

CREATE INDEX idx_pc_clientes_search ON public.pc_clientes USING gin(search_vector);

-- Configurar búsqueda full-text para custodios
ALTER TABLE public.pc_custodios ADD COLUMN search_vector tsvector;

CREATE OR REPLACE FUNCTION public.update_pc_custodios_search()
RETURNS trigger AS $$
BEGIN
    NEW.search_vector := to_tsvector('spanish', 
        COALESCE(NEW.nombre, '') || ' ' ||
        COALESCE(NEW.tel, '') || ' ' ||
        COALESCE(NEW.email, '') || ' ' ||
        COALESCE(NEW.zona_base, '') || ' ' ||
        COALESCE(array_to_string(NEW.certificaciones, ' '), '') || ' ' ||
        COALESCE(NEW.comentarios, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pc_custodios_search
    BEFORE INSERT OR UPDATE ON public.pc_custodios
    FOR EACH ROW EXECUTE FUNCTION update_pc_custodios_search();

CREATE INDEX idx_pc_custodios_search ON public.pc_custodios USING gin(search_vector);