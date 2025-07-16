-- ==============================================
-- SISTEMA INTEGRADO DE ASIGNACIÓN GPS CON TRAZABILIDAD
-- ==============================================

-- 1. Tabla para inventario de tarjetas SIM
CREATE TABLE public.inventario_sim (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_sim TEXT UNIQUE NOT NULL,
    operador TEXT NOT NULL, -- 'Telcel', 'Movistar', 'AT&T', etc.
    tipo_plan TEXT NOT NULL, -- 'Basico', 'Premium', 'IoT', etc.
    estado TEXT NOT NULL DEFAULT 'disponible', -- 'disponible', 'asignada', 'instalada', 'suspendida', 'dañada'
    fecha_activacion DATE,
    fecha_vencimiento DATE,
    costo_mensual NUMERIC(10,2),
    datos_incluidos_mb INTEGER,
    numero_iccid TEXT UNIQUE NOT NULL,
    pin_puk TEXT,
    observaciones TEXT,
    gps_asignado UUID REFERENCES public.inventario_gps(id),
    instalacion_asignada UUID REFERENCES public.programacion_instalaciones(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabla para inventario de tarjetas microSD
CREATE TABLE public.inventario_microsd (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_serie TEXT UNIQUE NOT NULL,
    marca TEXT NOT NULL,
    modelo TEXT NOT NULL,
    capacidad_gb INTEGER NOT NULL,
    clase_velocidad TEXT, -- 'Class 10', 'UHS-I', 'UHS-II', etc.
    estado TEXT NOT NULL DEFAULT 'disponible', -- 'disponible', 'asignada', 'instalada', 'dañada'
    precio_compra NUMERIC(10,2),
    fecha_compra DATE,
    proveedor_id UUID REFERENCES public.proveedores(id),
    observaciones TEXT,
    gps_asignado UUID REFERENCES public.inventario_gps(id),
    instalacion_asignada UUID REFERENCES public.programacion_instalaciones(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabla para kits de instalación completos (GPS + SIM + microSD)
CREATE TABLE public.kits_instalacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    programacion_id UUID NOT NULL REFERENCES public.programacion_instalaciones(id),
    gps_id UUID NOT NULL REFERENCES public.inventario_gps(id),
    sim_id UUID REFERENCES public.inventario_sim(id),
    microsd_id UUID REFERENCES public.inventario_microsd(id),
    estado_kit TEXT NOT NULL DEFAULT 'preparado', -- 'preparado', 'enviado', 'instalado', 'validado'
    fecha_preparacion TIMESTAMPTZ DEFAULT now(),
    fecha_envio TIMESTAMPTZ,
    fecha_instalacion TIMESTAMPTZ,
    fecha_validacion TIMESTAMPTZ,
    preparado_por UUID REFERENCES auth.users(id),
    instalado_por UUID REFERENCES public.instaladores(id),
    validado_por UUID REFERENCES auth.users(id),
    observaciones_preparacion TEXT,
    observaciones_instalacion TEXT,
    observaciones_validacion TEXT,
    numero_tracking TEXT, -- Para seguimiento de envío
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints para asegurar unicidad
    UNIQUE(programacion_id),
    UNIQUE(gps_id),
    UNIQUE(sim_id),
    UNIQUE(microsd_id)
);

-- 4. Tabla para criterios de recomendación GPS
CREATE TABLE public.criterios_recomendacion_gps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_vehiculo TEXT NOT NULL,
    sensores_requeridos TEXT[] NOT NULL DEFAULT '{}',
    marca_gps_recomendada TEXT,
    modelo_gps_recomendado TEXT,
    requiere_microsd BOOLEAN DEFAULT false,
    capacidad_microsd_minima_gb INTEGER,
    tipo_sim_recomendado TEXT,
    prioridad INTEGER DEFAULT 1,
    activo BOOLEAN DEFAULT true,
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Función para recomendar GPS basado en criterios
CREATE OR REPLACE FUNCTION public.recomendar_gps_para_instalacion(
    p_tipo_vehiculo TEXT,
    p_sensores_requeridos TEXT[],
    p_ubicacion_instalacion TEXT DEFAULT NULL
)
RETURNS TABLE(
    gps_id UUID,
    marca TEXT,
    modelo TEXT,
    numero_serie TEXT,
    score_compatibilidad INTEGER,
    requiere_microsd BOOLEAN,
    tipo_sim_recomendado TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    criterio RECORD;
    gps_record RECORD;
BEGIN
    -- Buscar criterios que coincidan con el tipo de vehículo
    FOR criterio IN 
        SELECT * FROM public.criterios_recomendacion_gps 
        WHERE tipo_vehiculo = p_tipo_vehiculo 
        AND activo = true
        ORDER BY prioridad ASC
    LOOP
        -- Buscar GPS disponibles que coincidan con los criterios
        FOR gps_record IN
            SELECT 
                ig.id,
                ig.marca,
                ig.modelo,
                ig.numero_serie,
                -- Calcular score de compatibilidad basado en sensores
                CASE 
                    WHEN criterio.sensores_requeridos <@ p_sensores_requeridos THEN 100
                    WHEN criterio.sensores_requeridos && p_sensores_requeridos THEN 75
                    ELSE 50
                END as compatibility_score
            FROM public.inventario_gps ig
            WHERE ig.estado = 'disponible'
            AND (criterio.marca_gps_recomendada IS NULL OR ig.marca = criterio.marca_gps_recomendada)
            AND (criterio.modelo_gps_recomendado IS NULL OR ig.modelo = criterio.modelo_gps_recomendado)
            AND ig.id NOT IN (SELECT gps_id FROM public.kits_instalacion WHERE estado_kit IN ('preparado', 'enviado'))
            ORDER BY compatibility_score DESC
            LIMIT 5
        LOOP
            RETURN QUERY SELECT 
                gps_record.id,
                gps_record.marca,
                gps_record.modelo,
                gps_record.numero_serie,
                gps_record.compatibility_score,
                criterio.requiere_microsd,
                criterio.tipo_sim_recomendado;
        END LOOP;
    END LOOP;
    
    -- Si no hay criterios específicos, devolver GPS disponibles genéricos
    IF NOT FOUND THEN
        RETURN QUERY 
        SELECT 
            ig.id,
            ig.marca,
            ig.modelo,
            ig.numero_serie,
            50 as compatibility_score,
            false as requiere_microsd,
            'Basico'::TEXT as tipo_sim_recomendado
        FROM public.inventario_gps ig
        WHERE ig.estado = 'disponible'
        AND ig.id NOT IN (SELECT gps_id FROM public.kits_instalacion WHERE estado_kit IN ('preparado', 'enviado'))
        ORDER BY ig.created_at DESC
        LIMIT 5;
    END IF;
END;
$$;

-- 6. Función para obtener SIM disponibles por tipo
CREATE OR REPLACE FUNCTION public.obtener_sim_disponibles(p_tipo_plan TEXT DEFAULT NULL)
RETURNS TABLE(
    sim_id UUID,
    numero_sim TEXT,
    operador TEXT,
    tipo_plan TEXT,
    costo_mensual NUMERIC,
    datos_incluidos_mb INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.numero_sim,
        s.operador,
        s.tipo_plan,
        s.costo_mensual,
        s.datos_incluidos_mb
    FROM public.inventario_sim s
    WHERE s.estado = 'disponible'
    AND (p_tipo_plan IS NULL OR s.tipo_plan = p_tipo_plan)
    AND s.id NOT IN (SELECT sim_id FROM public.kits_instalacion WHERE estado_kit IN ('preparado', 'enviado') AND sim_id IS NOT NULL)
    ORDER BY s.tipo_plan, s.costo_mensual ASC;
END;
$$;

-- 7. Función para obtener microSD disponibles
CREATE OR REPLACE FUNCTION public.obtener_microsd_disponibles(p_capacidad_minima_gb INTEGER DEFAULT NULL)
RETURNS TABLE(
    microsd_id UUID,
    numero_serie TEXT,
    marca TEXT,
    modelo TEXT,
    capacidad_gb INTEGER,
    clase_velocidad TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.numero_serie,
        m.marca,
        m.modelo,
        m.capacidad_gb,
        m.clase_velocidad
    FROM public.inventario_microsd m
    WHERE m.estado = 'disponible'
    AND (p_capacidad_minima_gb IS NULL OR m.capacidad_gb >= p_capacidad_minima_gb)
    AND m.id NOT IN (SELECT microsd_id FROM public.kits_instalacion WHERE estado_kit IN ('preparado', 'enviado') AND microsd_id IS NOT NULL)
    ORDER BY m.capacidad_gb ASC, m.marca;
END;
$$;

-- 8. Función para crear kit completo de instalación
CREATE OR REPLACE FUNCTION public.crear_kit_instalacion(
    p_programacion_id UUID,
    p_gps_id UUID,
    p_sim_id UUID DEFAULT NULL,
    p_microsd_id UUID DEFAULT NULL,
    p_preparado_por UUID DEFAULT auth.uid()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_kit_id UUID;
BEGIN
    -- Verificar que la programación existe y no tiene kit asignado
    IF EXISTS (SELECT 1 FROM public.kits_instalacion WHERE programacion_id = p_programacion_id) THEN
        RAISE EXCEPTION 'Esta programación ya tiene un kit asignado';
    END IF;
    
    -- Verificar que el GPS está disponible
    IF NOT EXISTS (SELECT 1 FROM public.inventario_gps WHERE id = p_gps_id AND estado = 'disponible') THEN
        RAISE EXCEPTION 'El GPS seleccionado no está disponible';
    END IF;
    
    -- Verificar que la SIM está disponible (si se proporciona)
    IF p_sim_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.inventario_sim WHERE id = p_sim_id AND estado = 'disponible') THEN
        RAISE EXCEPTION 'La SIM seleccionada no está disponible';
    END IF;
    
    -- Verificar que la microSD está disponible (si se proporciona)
    IF p_microsd_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.inventario_microsd WHERE id = p_microsd_id AND estado = 'disponible') THEN
        RAISE EXCEPTION 'La microSD seleccionada no está disponible';
    END IF;
    
    -- Crear el kit
    INSERT INTO public.kits_instalacion (
        programacion_id, gps_id, sim_id, microsd_id, preparado_por
    ) VALUES (
        p_programacion_id, p_gps_id, p_sim_id, p_microsd_id, p_preparado_por
    ) RETURNING id INTO v_kit_id;
    
    -- Actualizar estados de los componentes
    UPDATE public.inventario_gps SET 
        estado = 'asignado',
        servicio_asignado = (SELECT servicio_id FROM public.programacion_instalaciones WHERE id = p_programacion_id),
        fecha_asignacion = now()
    WHERE id = p_gps_id;
    
    IF p_sim_id IS NOT NULL THEN
        UPDATE public.inventario_sim SET 
            estado = 'asignada',
            gps_asignado = p_gps_id,
            instalacion_asignada = p_programacion_id
        WHERE id = p_sim_id;
    END IF;
    
    IF p_microsd_id IS NOT NULL THEN
        UPDATE public.inventario_microsd SET 
            estado = 'asignada',
            gps_asignado = p_gps_id,
            instalacion_asignada = p_programacion_id
        WHERE id = p_microsd_id;
    END IF;
    
    RETURN v_kit_id;
END;
$$;

-- 9. Función para validar instalación completada
CREATE OR REPLACE FUNCTION public.validar_instalacion_completada(
    p_kit_id UUID,
    p_validado_por UUID DEFAULT auth.uid(),
    p_observaciones TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_kit RECORD;
BEGIN
    -- Obtener información del kit
    SELECT * INTO v_kit FROM public.kits_instalacion WHERE id = p_kit_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Kit de instalación no encontrado';
    END IF;
    
    -- Actualizar estado del kit
    UPDATE public.kits_instalacion SET
        estado_kit = 'validado',
        fecha_validacion = now(),
        validado_por = p_validado_por,
        observaciones_validacion = p_observaciones
    WHERE id = p_kit_id;
    
    -- Actualizar estados finales de los componentes
    UPDATE public.inventario_gps SET 
        estado = 'instalado',
        fecha_instalacion = now()
    WHERE id = v_kit.gps_id;
    
    IF v_kit.sim_id IS NOT NULL THEN
        UPDATE public.inventario_sim SET estado = 'instalada' WHERE id = v_kit.sim_id;
    END IF;
    
    IF v_kit.microsd_id IS NOT NULL THEN
        UPDATE public.inventario_microsd SET estado = 'instalada' WHERE id = v_kit.microsd_id;
    END IF;
    
    RETURN TRUE;
END;
$$;

-- 10. Triggers para actualizar timestamps
CREATE OR REPLACE FUNCTION public.update_timestamp_inventario()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inventario_sim_timestamp
    BEFORE UPDATE ON public.inventario_sim
    FOR EACH ROW
    EXECUTE FUNCTION public.update_timestamp_inventario();

CREATE TRIGGER trigger_update_inventario_microsd_timestamp
    BEFORE UPDATE ON public.inventario_microsd
    FOR EACH ROW
    EXECUTE FUNCTION public.update_timestamp_inventario();

CREATE TRIGGER trigger_update_kits_instalacion_timestamp
    BEFORE UPDATE ON public.kits_instalacion
    FOR EACH ROW
    EXECUTE FUNCTION public.update_timestamp_inventario();

CREATE TRIGGER trigger_update_criterios_recomendacion_timestamp
    BEFORE UPDATE ON public.criterios_recomendacion_gps
    FOR EACH ROW
    EXECUTE FUNCTION public.update_timestamp_inventario();

-- 11. RLS Policies
ALTER TABLE public.inventario_sim ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_microsd ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kits_instalacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.criterios_recomendacion_gps ENABLE ROW LEVEL SECURITY;

-- Políticas para inventario_sim
CREATE POLICY "Usuarios autenticados pueden ver SIM" ON public.inventario_sim
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Solo admins pueden modificar SIM" ON public.inventario_sim
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'coordinador_operaciones', 'supply_admin'))
    );

-- Políticas para inventario_microsd
CREATE POLICY "Usuarios autenticados pueden ver microSD" ON public.inventario_microsd
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Solo admins pueden modificar microSD" ON public.inventario_microsd
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'coordinador_operaciones', 'supply_admin'))
    );

-- Políticas para kits_instalacion
CREATE POLICY "Usuarios pueden ver kits relacionados" ON public.kits_instalacion
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND (
            preparado_por = auth.uid() OR
            instalado_por::uuid = auth.uid() OR
            validado_por = auth.uid() OR
            EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'coordinador_operaciones'))
        )
    );

CREATE POLICY "Coordinadores pueden gestionar kits" ON public.kits_instalacion
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'coordinador_operaciones'))
    );

-- Políticas para criterios_recomendacion_gps
CREATE POLICY "Usuarios autenticados pueden ver criterios" ON public.criterios_recomendacion_gps
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Solo admins pueden modificar criterios" ON public.criterios_recomendacion_gps
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'coordinador_operaciones'))
    );

-- 12. Insertar datos de ejemplo para criterios de recomendación
INSERT INTO public.criterios_recomendacion_gps (tipo_vehiculo, sensores_requeridos, requiere_microsd, capacidad_microsd_minima_gb, tipo_sim_recomendado, prioridad) VALUES
('vehiculo', ARRAY['camara_respaldo', 'boton_panico'], true, 32, 'Premium', 1),
('camion', ARRAY['sensor_combustible', 'sensor_temperatura', 'boton_panico'], true, 64, 'IoT', 1),
('motocicleta', ARRAY['boton_panico'], false, NULL, 'Basico', 1),
('persona', ARRAY['boton_panico'], false, NULL, 'Basico', 1);

-- 13. Vista para análisis completo de kits
CREATE OR REPLACE VIEW public.vista_kits_instalacion AS
SELECT 
    k.id,
    k.programacion_id,
    p.fecha_programada,
    p.tipo_instalacion,
    p.contacto_cliente,
    p.direccion_instalacion,
    
    -- Información del GPS
    g.marca as gps_marca,
    g.modelo as gps_modelo,
    g.numero_serie as gps_serie,
    g.tipo_dispositivo,
    
    -- Información de la SIM
    s.numero_sim,
    s.operador as sim_operador,
    s.tipo_plan as sim_plan,
    
    -- Información de la microSD
    m.marca as microsd_marca,
    m.modelo as microsd_modelo,
    m.capacidad_gb,
    
    -- Estado y fechas del kit
    k.estado_kit,
    k.fecha_preparacion,
    k.fecha_envio,
    k.fecha_instalacion,
    k.fecha_validacion,
    k.numero_tracking,
    
    -- Personal involucrado
    prep.email as preparado_por_email,
    inst.nombre_completo as instalador_nombre,
    val.email as validado_por_email
    
FROM public.kits_instalacion k
INNER JOIN public.programacion_instalaciones p ON k.programacion_id = p.id
INNER JOIN public.inventario_gps g ON k.gps_id = g.id
LEFT JOIN public.inventario_sim s ON k.sim_id = s.id
LEFT JOIN public.inventario_microsd m ON k.microsd_id = m.id
LEFT JOIN auth.users prep_auth ON k.preparado_por = prep_auth.id
LEFT JOIN public.profiles prep ON k.preparado_por = prep.id
LEFT JOIN public.instaladores inst ON k.instalado_por::text = inst.id::text
LEFT JOIN auth.users val_auth ON k.validado_por = val_auth.id
LEFT JOIN public.profiles val ON k.validado_por = val.id;