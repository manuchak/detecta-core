
-- Tabla para el proceso de aprobación por coordinador de operaciones
CREATE TABLE IF NOT EXISTS public.aprobacion_coordinador (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    servicio_id UUID NOT NULL REFERENCES public.servicios_monitoreo(id) ON DELETE CASCADE,
    coordinador_id UUID NOT NULL REFERENCES public.profiles(id),
    fecha_revision TIMESTAMP WITH TIME ZONE DEFAULT now(),
    estado_aprobacion TEXT NOT NULL CHECK (estado_aprobacion IN ('pendiente', 'aprobado', 'rechazado', 'requiere_aclaracion')),
    
    -- Cuestionario de validación
    modelo_vehiculo_compatible BOOLEAN,
    cobertura_celular_verificada BOOLEAN,
    requiere_instalacion_fisica BOOLEAN,
    acceso_instalacion_disponible BOOLEAN,
    restricciones_tecnicas_sla BOOLEAN,
    contactos_emergencia_validados BOOLEAN,
    elementos_aclarar_cliente TEXT,
    
    observaciones TEXT,
    fecha_respuesta TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla para análisis de riesgo por equipo de seguridad
CREATE TABLE IF NOT EXISTS public.analisis_riesgo_seguridad (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    servicio_id UUID NOT NULL REFERENCES public.servicios_monitoreo(id) ON DELETE CASCADE,
    analista_id UUID NOT NULL REFERENCES public.profiles(id),
    fecha_analisis TIMESTAMP WITH TIME ZONE DEFAULT now(),
    estado_analisis TEXT NOT NULL CHECK (estado_analisis IN ('pendiente', 'completado', 'requiere_informacion')),
    
    -- Cuestionario de análisis de riesgo
    tipo_monitoreo_requerido TEXT, -- persona, vehiculo, flotilla
    tipo_activo_proteger TEXT, -- vehiculo, persona, ambos
    perfil_usuario TEXT, -- ejecutivo, operador, custodio, familia, etc
    zonas_operacion TEXT[],
    historial_incidentes TEXT,
    frecuencia_uso_rutas TEXT,
    tipo_riesgo_principal TEXT[], -- robo, secuestro, sabotaje, vandalismo
    nivel_exposicion TEXT CHECK (nivel_exposicion IN ('alto', 'medio', 'bajo')),
    controles_actuales_existentes TEXT[],
    dispositivos_seguridad_requeridos TEXT[],
    medios_comunicacion_cliente TEXT[], -- llamada, correo, app
    puntos_criticos_identificados TEXT,
    apoyo_externo_autoridades TEXT,
    
    -- Resultado del análisis
    calificacion_riesgo TEXT CHECK (calificacion_riesgo IN ('bajo', 'medio', 'alto', 'critico')),
    recomendaciones TEXT,
    equipamiento_recomendado JSONB,
    aprobado_seguridad BOOLEAN DEFAULT false,
    
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_aprobacion_coordinador_servicio ON public.aprobacion_coordinador(servicio_id);
CREATE INDEX IF NOT EXISTS idx_aprobacion_coordinador_estado ON public.aprobacion_coordinador(estado_aprobacion);
CREATE INDEX IF NOT EXISTS idx_analisis_riesgo_servicio ON public.analisis_riesgo_seguridad(servicio_id);
CREATE INDEX IF NOT EXISTS idx_analisis_riesgo_estado ON public.analisis_riesgo_seguridad(estado_analisis);

-- RLS Policies
ALTER TABLE public.aprobacion_coordinador ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analisis_riesgo_seguridad ENABLE ROW LEVEL SECURITY;

-- Policy para coordinadores de operaciones
CREATE POLICY "Coordinadores pueden ver y editar aprobaciones" ON public.aprobacion_coordinador
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'owner', 'coordinador_operaciones')
        )
    );

-- Policy para analistas de seguridad
CREATE POLICY "Analistas pueden ver y editar análisis de riesgo" ON public.analisis_riesgo_seguridad
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'owner', 'analista_seguridad', 'jefe_seguridad')
        )
    );

-- Función para actualizar el estado del servicio según el workflow
CREATE OR REPLACE FUNCTION public.actualizar_estado_servicio_workflow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Si es una aprobación de coordinador
    IF TG_TABLE_NAME = 'aprobacion_coordinador' THEN
        IF NEW.estado_aprobacion = 'aprobado' THEN
            UPDATE public.servicios_monitoreo 
            SET estado_general = 'pendiente_analisis_riesgo'
            WHERE id = NEW.servicio_id;
        ELSIF NEW.estado_aprobacion = 'rechazado' THEN
            UPDATE public.servicios_monitoreo 
            SET estado_general = 'rechazado_coordinador'
            WHERE id = NEW.servicio_id;
        ELSIF NEW.estado_aprobacion = 'requiere_aclaracion' THEN
            UPDATE public.servicios_monitoreo 
            SET estado_general = 'requiere_aclaracion_cliente'
            WHERE id = NEW.servicio_id;
        END IF;
    END IF;
    
    -- Si es un análisis de riesgo
    IF TG_TABLE_NAME = 'analisis_riesgo_seguridad' THEN
        IF NEW.estado_analisis = 'completado' AND NEW.aprobado_seguridad = true THEN
            UPDATE public.servicios_monitoreo 
            SET estado_general = 'aprobado'
            WHERE id = NEW.servicio_id;
        ELSIF NEW.estado_analisis = 'completado' AND NEW.aprobado_seguridad = false THEN
            UPDATE public.servicios_monitoreo 
            SET estado_general = 'rechazado_seguridad'
            WHERE id = NEW.servicio_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Triggers para actualizar estados automáticamente
CREATE TRIGGER trigger_actualizar_estado_aprobacion_coordinador
    AFTER INSERT OR UPDATE ON public.aprobacion_coordinador
    FOR EACH ROW
    EXECUTE FUNCTION public.actualizar_estado_servicio_workflow();

CREATE TRIGGER trigger_actualizar_estado_analisis_riesgo
    AFTER INSERT OR UPDATE ON public.analisis_riesgo_seguridad
    FOR EACH ROW
    EXECUTE FUNCTION public.actualizar_estado_servicio_workflow();
