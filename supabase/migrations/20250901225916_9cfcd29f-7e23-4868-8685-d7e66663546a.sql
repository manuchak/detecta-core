-- Sistema de Control de GPS Portátiles en Comodato
-- Crear tablas principales para gestión de comodatos

-- Tabla principal de comodatos de GPS
CREATE TABLE public.comodatos_gps (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    producto_gps_id UUID NOT NULL,
    numero_serie_gps TEXT NOT NULL,
    
    -- Referencias duales para custodios
    pc_custodio_id UUID NULL, -- FK a pc_custodios
    custodio_operativo_nombre TEXT NULL, -- Nombre del custodio de servicios_custodia
    custodio_operativo_telefono TEXT NULL, -- Teléfono del custodio de servicios_custodia
    
    -- Fechas del ciclo de comodato
    fecha_asignacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    fecha_devolucion_programada TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_devolucion_real TIMESTAMP WITH TIME ZONE NULL,
    
    -- Estados del comodato
    estado TEXT NOT NULL DEFAULT 'asignado' CHECK (estado IN ('asignado', 'en_uso', 'devuelto', 'perdido', 'dañado', 'vencido')),
    
    -- Información adicional
    observaciones TEXT,
    condiciones_asignacion TEXT,
    condiciones_devolucion TEXT,
    
    -- Auditoría
    asignado_por UUID NOT NULL,
    devuelto_por UUID NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de movimientos y historial
CREATE TABLE public.movimientos_comodato (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    comodato_id UUID NOT NULL REFERENCES public.comodatos_gps(id) ON DELETE CASCADE,
    
    tipo_movimiento TEXT NOT NULL CHECK (tipo_movimiento IN ('asignacion', 'devolucion', 'reporte_daño', 'perdida', 'extension', 'observacion')),
    
    fecha_movimiento TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    observaciones TEXT,
    evidencias JSONB, -- URLs de fotos, documentos, etc.
    datos_adicionales JSONB, -- Datos específicos por tipo de movimiento
    
    -- Usuario que realiza el movimiento
    usuario_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Vista materializada para custodios operativos activos
CREATE MATERIALIZED VIEW public.custodios_operativos_activos AS
SELECT DISTINCT
    sc.nombre_custodio,
    sc.telefono,
    sc.telefono_operador,
    COUNT(*) as total_servicios,
    MAX(sc.fecha_hora_cita) as ultimo_servicio,
    COUNT(*) FILTER (WHERE sc.estado IN ('completado', 'Completado', 'finalizado', 'Finalizado')) as servicios_completados,
    AVG(CASE WHEN sc.km_recorridos > 0 THEN sc.km_recorridos END) as km_promedio
FROM public.servicios_custodia sc
WHERE sc.nombre_custodio IS NOT NULL 
    AND TRIM(sc.nombre_custodio) != ''
    AND sc.nombre_custodio != '#N/A'
    AND sc.fecha_hora_cita >= (CURRENT_DATE - INTERVAL '90 days')
    AND sc.fecha_hora_cita <= (CURRENT_DATE + INTERVAL '1 day')
GROUP BY sc.nombre_custodio, sc.telefono, sc.telefono_operador
HAVING COUNT(*) >= 3 -- Mínimo 3 servicios para considerarse activo
ORDER BY ultimo_servicio DESC;

-- Crear índice único en la vista materializada
CREATE UNIQUE INDEX idx_custodios_operativos_activos_unique 
ON public.custodios_operativos_activos (nombre_custodio, COALESCE(telefono, ''), COALESCE(telefono_operador, ''));

-- Índices para optimización
CREATE INDEX idx_comodatos_gps_estado ON public.comodatos_gps(estado);
CREATE INDEX idx_comodatos_gps_producto ON public.comodatos_gps(producto_gps_id);
CREATE INDEX idx_comodatos_gps_pc_custodio ON public.comodatos_gps(pc_custodio_id);
CREATE INDEX idx_comodatos_gps_custodio_operativo ON public.comodatos_gps(custodio_operativo_nombre);
CREATE INDEX idx_comodatos_gps_fechas ON public.comodatos_gps(fecha_asignacion, fecha_devolucion_programada);
CREATE INDEX idx_movimientos_comodato_tipo ON public.movimientos_comodato(tipo_movimiento);
CREATE INDEX idx_movimientos_comodato_fecha ON public.movimientos_comodato(fecha_movimiento);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_comodatos_gps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_comodatos_gps_updated_at
    BEFORE UPDATE ON public.comodatos_gps
    FOR EACH ROW
    EXECUTE FUNCTION public.update_comodatos_gps_updated_at();

-- Función para refrescar la vista materializada
CREATE OR REPLACE FUNCTION public.refresh_custodios_operativos_activos()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.custodios_operativos_activos;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE public.comodatos_gps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_comodato ENABLE ROW LEVEL SECURITY;

-- Política para comodatos_gps - Solo roles autorizados
CREATE POLICY "comodatos_gps_authorized_access" ON public.comodatos_gps
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'owner', 'coordinador_operaciones', 'planificador')
        )
    );

-- Política para movimientos_comodato - Solo roles autorizados
CREATE POLICY "movimientos_comodato_authorized_access" ON public.movimientos_comodato
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'owner', 'coordinador_operaciones', 'planificador')
        )
    );